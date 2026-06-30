import { describe, expect, it } from "vitest";
import { isStreakAlive, newStreak, recordActivity, toDateKey } from "./streak";

const day = (s: string) => new Date(`${s}T12:00:00`);

describe("recordActivity", () => {
  it("starts a streak at 1", () => {
    const s = recordActivity(newStreak(), day("2026-06-01"));
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
  });

  it("is idempotent within the same day", () => {
    let s = recordActivity(newStreak(), day("2026-06-01"));
    s = recordActivity(s, day("2026-06-01"));
    expect(s.current).toBe(1);
  });

  it("increments on consecutive days", () => {
    let s = recordActivity(newStreak(), day("2026-06-01"));
    s = recordActivity(s, day("2026-06-02"));
    s = recordActivity(s, day("2026-06-03"));
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
  });

  it("resets after a missed day with no freeze", () => {
    let s = recordActivity(newStreak(), day("2026-06-01"));
    s = recordActivity(s, day("2026-06-04"));
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
  });

  it("spends a freeze to survive a one-day gap", () => {
    let s = recordActivity(newStreak(1), day("2026-06-01"));
    s = recordActivity(s, day("2026-06-02")); // current 2
    s = recordActivity(s, day("2026-06-04")); // gap of 2 days, freeze spent
    expect(s.current).toBe(3);
    expect(s.freezes).toBe(0);
  });

  it("tracks the longest streak across a reset", () => {
    let s = newStreak();
    s = recordActivity(s, day("2026-06-01"));
    s = recordActivity(s, day("2026-06-02"));
    s = recordActivity(s, day("2026-06-03")); // longest 3
    s = recordActivity(s, day("2026-06-10")); // reset to 1
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
  });
});

describe("isStreakAlive", () => {
  it("is alive today or yesterday, dead after a two-day gap", () => {
    const s = recordActivity(newStreak(), day("2026-06-01"));
    expect(isStreakAlive(s, day("2026-06-02"))).toBe(true);
    expect(isStreakAlive(s, day("2026-06-03"))).toBe(false);
  });
});

describe("toDateKey", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(toDateKey(new Date("2026-06-09T23:00:00"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
