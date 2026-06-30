// FSRS (Free Spaced Repetition Scheduler), FSRS-5 long-term formulas.
// Faithful port of the open-spaced-repetition default model. Pure + deterministic.
// Ref: https://github.com/open-spaced-repetition  (see references.md)

import { Grade, type FsrsState } from "./types";

/** Default FSRS-5 weights (19 parameters). */
export const DEFAULT_W: readonly number[] = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575,
  0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655,
  0.6621,
];

const DECAY = -0.5;
/** FACTOR such that retrievability(stability, stability) == 0.9. */
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1; // ≈ 0.234567

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const MIN_STABILITY = 0.01;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SchedulerConfig {
  w: readonly number[];
  /** Target probability of recall when a card comes due. */
  requestRetention: number;
  /** Maximum interval in days. */
  maximumInterval: number;
}

export const DEFAULT_CONFIG: SchedulerConfig = {
  w: DEFAULT_W,
  requestRetention: 0.9,
  maximumInterval: 36500,
};

const clamp = (x: number, lo: number, hi: number): number =>
  Math.min(Math.max(x, lo), hi);

/** Probability of recall after `elapsedDays` for a card with the given stability. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
}

/** Interval (whole days) until the card next reaches requestRetention. */
export function nextInterval(stability: number, config = DEFAULT_CONFIG): number {
  const ivl =
    (stability / FACTOR) *
    (Math.pow(config.requestRetention, 1 / DECAY) - 1);
  return clamp(Math.round(ivl), 1, config.maximumInterval);
}

function initStability(grade: Grade, w: readonly number[]): number {
  return Math.max(w[grade - 1] as number, MIN_STABILITY);
}

function initDifficulty(grade: Grade, w: readonly number[]): number {
  const d = (w[4] as number) - Math.exp((w[5] as number) * (grade - 1)) + 1;
  return clamp(d, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

function nextDifficulty(
  difficulty: number,
  grade: Grade,
  w: readonly number[],
): number {
  // Linear damping: larger moves when difficulty is low.
  const deltaD = -(w[6] as number) * (grade - 3);
  const damped = difficulty + (deltaD * (10 - difficulty)) / 9;
  // Mean reversion toward the difficulty of an "Easy" first answer.
  const target = initDifficulty(Grade.Easy, w);
  const reverted = (w[7] as number) * target + (1 - (w[7] as number)) * damped;
  return clamp(reverted, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

function nextRecallStability(
  difficulty: number,
  stability: number,
  recall: number,
  grade: Grade,
  w: readonly number[],
): number {
  const hardPenalty = grade === Grade.Hard ? (w[15] as number) : 1;
  const easyBonus = grade === Grade.Easy ? (w[16] as number) : 1;
  const inc =
    Math.exp(w[8] as number) *
    (11 - difficulty) *
    Math.pow(stability, -(w[9] as number)) *
    (Math.exp((w[10] as number) * (1 - recall)) - 1) *
    hardPenalty *
    easyBonus;
  return Math.max(stability * (1 + inc), MIN_STABILITY);
}

function nextForgetStability(
  difficulty: number,
  stability: number,
  recall: number,
  w: readonly number[],
): number {
  const s =
    (w[11] as number) *
    Math.pow(difficulty, -(w[12] as number)) *
    (Math.pow(stability + 1, w[13] as number) - 1) *
    Math.exp((w[14] as number) * (1 - recall));
  // A lapse cannot make the card more stable than it already was.
  return clamp(s, MIN_STABILITY, stability);
}

function elapsedDays(lastReview: string | null, now: Date): number {
  if (!lastReview) return 0;
  return Math.max(0, (now.getTime() - new Date(lastReview).getTime()) / DAY_MS);
}

/**
 * Schedule a card given a grade. Pass `state = null` (or reps 0) for a brand-new card.
 * Returns the next FsrsState; does not mutate the input.
 */
export function schedule(
  state: FsrsState | null,
  grade: Grade,
  now: Date = new Date(),
  config: SchedulerConfig = DEFAULT_CONFIG,
): FsrsState {
  const w = config.w;
  const nowIso = now.toISOString();

  let stability: number;
  let difficulty: number;
  let reps: number;
  let lapses: number;

  if (!state || state.reps === 0) {
    // First exposure.
    stability = initStability(grade, w);
    difficulty = initDifficulty(grade, w);
    reps = 1;
    lapses = 0;
  } else {
    const recall = retrievability(
      elapsedDays(state.lastReview, now),
      state.stability,
    );
    difficulty = nextDifficulty(state.difficulty, grade, w);
    if (grade === Grade.Again) {
      stability = nextForgetStability(state.difficulty, state.stability, recall, w);
      lapses = state.lapses + 1;
    } else {
      stability = nextRecallStability(
        state.difficulty,
        state.stability,
        recall,
        grade,
        w,
      );
      lapses = state.lapses;
    }
    reps = state.reps + 1;
  }

  const intervalDays = nextInterval(stability, config);
  const due = new Date(now.getTime() + intervalDays * DAY_MS).toISOString();

  return { stability, difficulty, due, lastReview: nowIso, reps, lapses };
}

/** Fresh, never-reviewed state for a new card. */
export function newState(): FsrsState {
  return {
    stability: 0,
    difficulty: 0,
    due: new Date(0).toISOString(),
    lastReview: null,
    reps: 0,
    lapses: 0,
  };
}
