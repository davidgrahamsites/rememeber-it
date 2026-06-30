// Dry-run verification of the curation loop (offline). Run: npm run verify
import type { Item } from "@rememeber-it/core";
import { approve, makeCandidate, reject } from "./curate";
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

const main = async () => {
  const pending = await makeCandidate(item, mockGenerator);
  console.log("1) pending  :", pending.status, "| attempt", pending.attempts, "|", pending.text);

  const approved = approve(pending);
  console.log("2) approved :", approved.status);

  const regen = await reject(pending, mockGenerator);
  console.log("3) regenerated after reject:", regen.status, "| attempt", regen.attempts, "|", regen.text);

  const ok =
    pending.status === "pending" &&
    approved.status === "approved" &&
    regen.status === "pending" &&
    regen.attempts === 2 &&
    regen.text !== pending.text;
  console.log(ok ? "\n✓ curation loop OK" : "\n✗ curation loop FAILED");
  if (!ok) process.exit(1);
};

main();
