import { describe, expect, it } from "vitest";
import { buildCourse, MAX_ITEMS_PER_LEVEL, type RawCourse } from "./content";

const raw: RawCourse = {
  slug: "demo",
  title: "Demo",
  language: "zh-Hans",
  description: "d",
  order: 1,
  levels: [
    {
      title: "L1",
      items: [
        { prompt: "一", answer: "one", kind: "radical" },
        { prompt: "二", answer: "two", kind: "radical" },
      ],
    },
  ],
};

describe("buildCourse", () => {
  it("assigns deterministic ids and wires references", () => {
    const built = buildCourse(raw);
    expect(built.course.id).toBe("demo");
    expect(built.course.levelIds).toEqual(["demo-l1"]);
    expect(built.levels[0]!.itemIds).toEqual(["demo-l1-i1", "demo-l1-i2"]);
    expect(built.items[0]!.courseId).toBe("demo");
    expect(built.items[0]!.levelId).toBe("demo-l1");
  });

  it("throws when a level exceeds the item cap", () => {
    const tooBig: RawCourse = {
      ...raw,
      levels: [
        {
          title: "big",
          items: Array.from({ length: MAX_ITEMS_PER_LEVEL + 1 }, (_, i) => ({
            prompt: String(i),
            answer: String(i),
            kind: "vocab" as const,
          })),
        },
      ],
    };
    expect(() => buildCourse(tooBig)).toThrow(/max is 10/);
  });
});
