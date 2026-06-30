// Daily learning streak logic. Pure + deterministic; dates are YYYY-MM-DD strings.

import type { StreakState } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayDiff(fromKey: string, toKey: string): number {
  const a = new Date(`${fromKey}T00:00:00`);
  const b = new Date(`${toKey}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export function newStreak(freezes = 0): StreakState {
  return { current: 0, longest: 0, lastActiveDate: null, freezes };
}

/**
 * Register activity for the given day and return the updated streak.
 * - Same day as last active → no change.
 * - Next day → streak + 1.
 * - Gap of 2 days, with a freeze available → freeze is spent, streak continues.
 * - Larger gap (or no freeze) → streak resets to 1.
 */
export function recordActivity(state: StreakState, now: Date = new Date()): StreakState {
  const today = toDateKey(now);
  if (state.lastActiveDate === today) return state;

  let current: number;
  let freezes = state.freezes;

  if (state.lastActiveDate === null) {
    current = 1;
  } else {
    const gap = dayDiff(state.lastActiveDate, today);
    if (gap === 1) {
      current = state.current + 1;
    } else if (gap === 2 && freezes > 0) {
      freezes -= 1;
      current = state.current + 1;
    } else {
      current = 1;
    }
  }

  return {
    current,
    longest: Math.max(state.longest, current),
    lastActiveDate: today,
    freezes,
  };
}

/** Whether the streak is still alive as of `now` (today or yesterday active). */
export function isStreakAlive(state: StreakState, now: Date = new Date()): boolean {
  if (state.lastActiveDate === null) return false;
  return dayDiff(state.lastActiveDate, toDateKey(now)) <= 1;
}
