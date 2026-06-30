// CLI: seed mnemonics + meme images for a course, with an admin curation loop.
//
//   npm run seed -- --course radicals            # interactive (needs OPENAI_API_KEY)
//   npm run seed -- --course radicals --dry-run  # offline mock generator
//   npm run seed -- --course radicals --auto-approve --limit 3
//
// Approved assets are written to generated-assets/<course>.mnemonics.json.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { buildCourse, type Mnemonic, type RawCourse } from "@rememeber-it/core";
import { approve, makeCandidate, reject, toMnemonic, type Generate } from "./curate";
import { mockGenerator, openAiGenerator } from "./openai";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

async function main() {
  const course = opt("course") ?? "radicals";
  const dryRun = flag("dry-run") || !process.env.OPENAI_API_KEY;
  const autoApprove = flag("auto-approve") || !process.stdin.isTTY;
  const limit = Number(opt("limit") ?? "0");

  const raw = JSON.parse(
    readFileSync(resolve(ROOT, "content", `${course}.json`), "utf8"),
  ) as RawCourse;
  const { items } = buildCourse(raw);
  const work = limit > 0 ? items.slice(0, limit) : items;
  const gen: Generate = dryRun ? mockGenerator : openAiGenerator();

  console.log(
    `Seeding "${course}" — ${work.length} items ` +
      `${dryRun ? "(dry-run / mock)" : "(OpenAI)"}${autoApprove ? " · auto-approve" : ""}`,
  );

  const rl = autoApprove ? null : createInterface({ input: process.stdin, output: process.stdout });
  const approved: Mnemonic[] = [];

  for (const item of work) {
    let c = await makeCandidate(item, gen);
    for (;;) {
      console.log(
        `\n${item.prompt} = ${item.answer}\n  → ${c.text}` +
          (c.memeImageUrl ? `\n  img: ${c.memeImageUrl}` : ""),
      );
      const decision = autoApprove || !rl
        ? "a"
        : ((await rl.question("  [a]pprove / [r]egenerate / [s]kip? ")).trim().toLowerCase() || "a");
      if (decision === "r") {
        c = await reject(c, gen);
        continue;
      }
      if (decision === "s") {
        c = { ...c, status: "rejected" };
      } else {
        c = approve(c);
      }
      break;
    }
    if (c.status === "approved") approved.push(toMnemonic(c));
  }
  rl?.close();

  // 1) Full record per course (gitignored raw output).
  const outDir = resolve(ROOT, "generated-assets");
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `${course}.mnemonics.json`);
  writeFileSync(outFile, JSON.stringify(approved, null, 2));

  // 2) Merge approved into the committed map the app reads at build time.
  const publishedFile = resolve(ROOT, "content", "mnemonics.generated.json");
  let published: Record<string, { text: string; memeImageUrl?: string }> = {};
  try {
    published = JSON.parse(readFileSync(publishedFile, "utf8"));
  } catch {
    published = {};
  }
  for (const m of approved) {
    published[m.itemId] = { text: m.text, ...(m.memeImageUrl ? { memeImageUrl: m.memeImageUrl } : {}) };
  }
  writeFileSync(publishedFile, JSON.stringify(published, null, 2) + "\n");

  console.log(
    `\nApproved ${approved.length} mnemonics → ${outFile}\n` +
      `Published to ${publishedFile} (${Object.keys(published).length} total)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
