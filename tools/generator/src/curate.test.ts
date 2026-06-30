import { describe, expect, it } from "vitest";
import type { Item } from "@rememeber-it/core";
import { approve, makeCandidate, reject, toMnemonic } from "./curate";
import { mockGenerator } from "./openai";

const item: Item = {
  id: "demo-l1-i1",
  courseId: "demo",
  levelId: "demo-l1",
  prompt: "水",
  answer: "water",
  reading: "shuǐ",
  kind: "radical",
};

describe("curation loop", () => {
  it("starts as a pending candidate", async () => {
    const c = await makeCandidate(item, mockGenerator);
    expect(c.status).toBe("pending");
    expect(c.attempts).toBe(1);
    expect(c.text.length).toBeGreaterThan(0);
  });

  it("approve marks the candidate approved", async () => {
    const c = approve(await makeCandidate(item, mockGenerator));
    expect(c.status).toBe("approved");
    expect(toMnemonic(c).status).toBe("approved");
  });

  it("reject regenerates a fresh pending candidate", async () => {
    const c = await makeCandidate(item, mockGenerator);
    const r = await reject(c, mockGenerator);
    expect(r.status).toBe("pending");
    expect(r.attempts).toBe(2);
    expect(r.text).not.toBe(c.text);
  });
});
