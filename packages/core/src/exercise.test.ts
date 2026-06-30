import { describe, expect, it } from "vitest";
import {
  buildMultipleChoice,
  checkAnswer,
  chooseExerciseType,
  normalizeAnswer,
  pickDistractors,
} from "./exercise";
import type { Item } from "./types";

const mkItem = (over: Partial<Item> & Pick<Item, "id" | "answer">): Item => ({
  courseId: "c1",
  levelId: "l1",
  prompt: over.answer,
  kind: "vocab",
  ...over,
});

const pool: Item[] = [
  mkItem({ id: "1", prompt: "你好", answer: "hello", reading: "nǐ hǎo" }),
  mkItem({ id: "2", prompt: "谢谢", answer: "thanks" }),
  mkItem({ id: "3", prompt: "再见", answer: "goodbye" }),
  mkItem({ id: "4", prompt: "水", answer: "water" }),
  mkItem({ id: "5", prompt: "火", answer: "fire" }),
];

// Deterministic RNG for stable assertions.
const seqRng = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length] as number;
};

describe("normalizeAnswer", () => {
  it("strips case, punctuation, articles, and pinyin tones", () => {
    expect(normalizeAnswer("  The Hello!  ")).toBe("hello");
    expect(normalizeAnswer("nǐ hǎo")).toBe("ni hao");
    expect(normalizeAnswer("to eat")).toBe("eat");
  });
});

describe("checkAnswer", () => {
  const item = mkItem({
    id: "x",
    prompt: "吃",
    answer: "to eat",
    altAnswers: ["eat", "consume"],
  });
  it("accepts canonical, alternates, and tolerant variants", () => {
    expect(checkAnswer("eat", item)).toBe(true);
    expect(checkAnswer("To Eat.", item)).toBe(true);
    expect(checkAnswer("consume", item)).toBe(true);
  });
  it("rejects wrong answers and empty input", () => {
    expect(checkAnswer("drink", item)).toBe(false);
    expect(checkAnswer("   ", item)).toBe(false);
  });
});

describe("pickDistractors", () => {
  it("excludes the correct item and returns the requested count", () => {
    const correct = pool[0]!;
    const d = pickDistractors(correct, pool, 3, seqRng([0.1, 0.5, 0.9, 0.2]));
    expect(d).toHaveLength(3);
    expect(d.every((it) => it.id !== correct.id)).toBe(true);
  });
});

describe("buildMultipleChoice", () => {
  it("includes the correct answer and reports its index", () => {
    const correct = pool[3]!; // water
    const mc = buildMultipleChoice(correct, pool, 4, seqRng([0.3, 0.6, 0.1, 0.8]));
    expect(mc.options).toHaveLength(4);
    expect(mc.options).toContain("water");
    expect(mc.options[mc.correctIndex]).toBe("water");
  });
});

describe("chooseExerciseType", () => {
  it("uses cloze for grammar items that have a sentence", () => {
    const g = mkItem({
      id: "g",
      prompt: "了",
      answer: "le",
      kind: "grammar",
      clozeSentence: "我吃___饭。",
    });
    expect(chooseExerciseType(g, null)).toBe("cloze");
  });

  it("uses multiple choice for new vocab", () => {
    expect(chooseExerciseType(pool[0]!, null)).toBe("multipleChoice");
  });

  it("moves to typing as the card gains stability", () => {
    const state = {
      stability: 3,
      difficulty: 5,
      due: "",
      lastReview: null,
      reps: 2,
      lapses: 0,
    };
    expect(chooseExerciseType(pool[0]!, state)).toBe("typing");
  });

  it("respects the available set", () => {
    expect(chooseExerciseType(pool[0]!, null, ["typing"])).toBe("typing");
  });
});
