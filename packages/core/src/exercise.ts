// Exercise engine: answer normalization/matching, distractor selection,
// multiple-choice building, and exercise-type selection. Pure + deterministic
// (randomness is injected so tests are stable).

import type { ExerciseType, FsrsState, Item } from "./types";

/** Deterministic RNG seam: returns a float in [0, 1). Defaults to Math.random. */
export type Rng = () => number;

/**
 * Normalize a free-text answer for tolerant matching:
 * lowercase, trim, collapse whitespace, strip diacritics/pinyin tones,
 * drop surrounding punctuation, and remove a leading English article.
 */
export function normalizeAnswer(input: string): string {
  let s = input.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  s = s.toLowerCase().trim();
  s = s.replace(/[.,!?;:"'`]/g, "");
  s = s.replace(/\s+/g, " ");
  s = s.replace(/^(a|an|the|to)\s+/, "");
  return s;
}

/** True if the typed answer matches the item's canonical or alternate answers. */
export function checkAnswer(input: string, item: Item): boolean {
  const candidate = normalizeAnswer(input);
  if (!candidate) return false;
  const accepted = [item.answer, ...(item.altAnswers ?? [])].map(normalizeAnswer);
  return accepted.includes(candidate);
}

/** Fisher–Yates shuffle using the injected RNG; returns a new array. */
export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * Pick `count` distractor items from `pool` (same course/level), excluding the
 * correct item and any sharing its answer.
 */
export function pickDistractors(
  correct: Item,
  pool: readonly Item[],
  count: number,
  rng: Rng = Math.random,
): Item[] {
  const correctAns = normalizeAnswer(correct.answer);
  const candidates = pool.filter(
    (it) => it.id !== correct.id && normalizeAnswer(it.answer) !== correctAns,
  );
  return shuffle(candidates, rng).slice(0, count);
}

export interface MultipleChoice {
  prompt: string;
  options: string[];
  /** Index of the correct option within `options`. */
  correctIndex: number;
}

/** Build a multiple-choice question (default 4 options) for `item`. */
export function buildMultipleChoice(
  item: Item,
  pool: readonly Item[],
  optionCount = 4,
  rng: Rng = Math.random,
): MultipleChoice {
  const distractors = pickDistractors(item, pool, optionCount - 1, rng);
  const options = shuffle([item.answer, ...distractors.map((d) => d.answer)], rng);
  return {
    prompt: item.prompt,
    options,
    correctIndex: options.indexOf(item.answer),
  };
}

/**
 * Choose an exercise type for an item based on its kind and how well it's known.
 * - Grammar items default to cloze.
 * - New/weak items favor recognition (multiple choice).
 * - As stability grows, move toward production (typing, then speaking).
 * Only returns a type present in `available`.
 */
export function chooseExerciseType(
  item: Item,
  state: FsrsState | null,
  available: readonly ExerciseType[] = ["multipleChoice", "cloze", "typing", "speaking"],
): ExerciseType {
  const has = (t: ExerciseType) => available.includes(t);
  const stability = state?.stability ?? 0;

  if (item.kind === "grammar" && item.clozeSentence && has("cloze")) return "cloze";

  if (stability < 1 && has("multipleChoice")) return "multipleChoice";
  if (stability < 7 && has("typing")) return "typing";
  if (has("speaking")) return "speaking";

  // Fallbacks in order of preference.
  for (const t of ["typing", "multipleChoice", "cloze", "speaking"] as ExerciseType[]) {
    if (has(t)) return t;
  }
  return available[0] ?? "multipleChoice";
}
