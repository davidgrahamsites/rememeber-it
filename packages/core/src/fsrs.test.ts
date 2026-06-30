import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIG,
  newState,
  nextInterval,
  retrievability,
  schedule,
} from "./fsrs";
import { Grade, type FsrsState } from "./types";

const T0 = new Date("2026-01-01T00:00:00.000Z");
const daysAfter = (base: Date, days: number) =>
  new Date(base.getTime() + days * 86_400_000);

describe("retrievability", () => {
  it("is 1 immediately after review", () => {
    expect(retrievability(0, 10)).toBeCloseTo(1, 5);
  });

  it("equals requestRetention after `stability` days", () => {
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 5);
  });

  it("decreases as time passes", () => {
    expect(retrievability(20, 10)).toBeLessThan(retrievability(5, 10));
  });
});

describe("nextInterval", () => {
  it("is at least 1 day", () => {
    expect(nextInterval(0.01)).toBeGreaterThanOrEqual(1);
  });

  it("grows with stability", () => {
    expect(nextInterval(50)).toBeGreaterThan(nextInterval(5));
  });

  it("respects the maximum interval", () => {
    expect(nextInterval(1e9)).toBeLessThanOrEqual(DEFAULT_CONFIG.maximumInterval);
  });
});

describe("schedule — first review", () => {
  it("Easy yields a longer first interval than Good than Hard than Again", () => {
    const again = schedule(null, Grade.Again, T0);
    const hard = schedule(null, Grade.Hard, T0);
    const good = schedule(null, Grade.Good, T0);
    const easy = schedule(null, Grade.Easy, T0);
    const ivl = (s: FsrsState) =>
      (new Date(s.due).getTime() - T0.getTime()) / 86_400_000;
    expect(ivl(easy)).toBeGreaterThanOrEqual(ivl(good));
    expect(ivl(good)).toBeGreaterThanOrEqual(ivl(hard));
    expect(ivl(hard)).toBeGreaterThanOrEqual(ivl(again));
  });

  it("sets reps to 1 and difficulty within [1,10]", () => {
    const s = schedule(null, Grade.Good, T0);
    expect(s.reps).toBe(1);
    expect(s.lastReview).toBe(T0.toISOString());
    expect(s.difficulty).toBeGreaterThanOrEqual(1);
    expect(s.difficulty).toBeLessThanOrEqual(10);
  });
});

describe("schedule — subsequent reviews", () => {
  it("intervals expand across successive Good answers", () => {
    let state = schedule(null, Grade.Good, T0);
    let prevStability = state.stability;
    let when = T0;
    for (let i = 0; i < 4; i++) {
      when = daysAfter(when, nextInterval(state.stability));
      state = schedule(state, Grade.Good, when);
      expect(state.stability).toBeGreaterThan(prevStability);
      prevStability = state.stability;
    }
    expect(state.reps).toBe(5);
  });

  it("Again counts a lapse and shrinks stability", () => {
    const learned = schedule(null, Grade.Easy, T0);
    const lapsed = schedule(learned, Grade.Again, daysAfter(T0, 3));
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.stability).toBeLessThanOrEqual(learned.stability);
  });

  it("does not mutate the input state", () => {
    const before = schedule(null, Grade.Good, T0);
    const snapshot = { ...before };
    schedule(before, Grade.Hard, daysAfter(T0, 1));
    expect(before).toEqual(snapshot);
  });
});

describe("newState", () => {
  it("is treated as a brand-new card", () => {
    const s = schedule(newState(), Grade.Good, T0);
    expect(s.reps).toBe(1);
  });
});
