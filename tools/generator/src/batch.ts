// Resumable batch asset generation.
//   npm run generate --workspace @rememeber-it/generator -- --course radicals
//   npm run generate --workspace @rememeber-it/generator -- --course hsk1
//
// For each item it generates a mnemonic (gpt-4o-mini) + a meme image (gpt-image-1),
// downloads the image to generated-assets/images/<course>/<itemId>.png, and records
// the result in content/mnemonics.generated.json. Progress is tracked in a per-course
// checklist markdown file (generated-assets/<course>.checklist.md) written BEFORE any
// downloads; each item is checked off as it completes. Re-running skips checked items,
// so a dropped connection resumes from where it stopped.
//
// Flags: --course <slug>  --dry-run  --limit <n>  --stop-on-error
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCourse, type Item, type RawCourse } from "@rememeber-it/core";

const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const GEN_ROOT = resolve(SRC_DIR, ".."); // tools/generator
const ROOT = resolve(GEN_ROOT, "../.."); // workspace root

/** Load tools/generator/.env into process.env (no dependency). */
function loadEnv(): void {
  const p = resolve(GEN_ROOT, ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[1] && !process.env[m[1]]) process.env[m[1]] = m[2] ?? "";
  }
}

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(`--${n}`);
const opt = (n: string) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const TINY_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

interface ItemAsset {
  text: string;
  image?: string; // repo-relative path under generated-assets/images/<course>/
}

/** Parse the checklist md → set of completed itemIds. */
function readDone(path: string): Set<string> {
  const done = new Set<string>();
  if (!existsSync(path)) return done;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^- \[x\] (\S+)/);
    if (m && m[1]) done.add(m[1]);
  }
  return done;
}

/** Write the checklist md from items + done set (stable order). */
function writeChecklist(path: string, course: string, items: Item[], done: Set<string>): void {
  const lines = [
    `# Asset generation — ${course}`,
    "",
    `Progress: ${[...done].filter((id) => items.some((i) => i.id === id)).length}/${items.length}`,
    "",
    ...items.map(
      (it) => `- [${done.has(it.id) ? "x" : " "}] ${it.id} — ${it.prompt} (${it.answer})`,
    ),
    "",
  ];
  writeFileSync(path, lines.join("\n"));
}

async function generateForItem(
  item: Item,
  dryRun: boolean,
): Promise<{ text: string; pngBytes: Buffer }> {
  if (dryRun) {
    return {
      text: `Picture "${item.answer}" when you see ${item.prompt}${item.reading ? ` (${item.reading})` : ""}.`,
      pngBytes: Buffer.from(TINY_PNG_B64, "base64"),
    };
  }
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI();

  const chat = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.8,
    messages: [
      {
        role: "system",
        content:
          "You write short, vivid, funny mnemonics for language learners. One or two sentences, no preamble.",
      },
      {
        role: "user",
        content: `Create a mnemonic to remember that the Chinese ${item.kind} "${item.prompt}"${item.reading ? ` (${item.reading})` : ""} means "${item.answer}".`,
      },
    ],
  });
  const text = chat.choices[0]?.message?.content?.trim() ?? "";

  const image = await client.images.generate({
    model: "gpt-image-1",
    prompt: `A simple, bold, funny meme illustrating this memory aid: ${text}. Clean flat illustration.`,
    size: "1024x1024",
    n: 1,
  });
  const b64 = image.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image data returned");
  return { text, pngBytes: Buffer.from(b64, "base64") };
}

async function main(): Promise<void> {
  loadEnv();
  const course = opt("course") ?? "radicals";
  const dryRun = flag("dry-run") || !process.env.OPENAI_API_KEY;
  const stopOnError = flag("stop-on-error");
  const limit = Number(opt("limit") ?? "0");

  const raw = JSON.parse(
    readFileSync(resolve(ROOT, "content", `${course}.json`), "utf8"),
  ) as RawCourse;
  const allItems = buildCourse(raw).items;
  const items = limit > 0 ? allItems.slice(0, limit) : allItems;

  const imagesDir = resolve(ROOT, "generated-assets", "images", course);
  mkdirSync(imagesDir, { recursive: true });
  const checklistPath = resolve(ROOT, "generated-assets", `${course}.checklist.md`);
  const publishedPath = resolve(ROOT, "content", "mnemonics.generated.json");

  // Write the checklist FIRST (resume reference) before any downloads.
  const done = readDone(checklistPath);
  writeChecklist(checklistPath, course, items, done);

  let published: Record<string, ItemAsset> = {};
  try {
    published = JSON.parse(readFileSync(publishedPath, "utf8"));
  } catch {
    published = {};
  }

  console.log(
    `Generating "${course}" — ${items.length} items ${dryRun ? "(dry-run)" : "(OpenAI)"}; ` +
      `${done.size} already done.`,
  );

  let completed = 0;
  for (const item of items) {
    if (done.has(item.id)) {
      continue;
    }
    try {
      const { text, pngBytes } = await generateForItem(item, dryRun);
      const rel = `images/${course}/${item.id}.png`;
      writeFileSync(resolve(ROOT, "generated-assets", rel), pngBytes);

      published[item.id] = { text, image: rel };
      writeFileSync(publishedPath, JSON.stringify(published, null, 2) + "\n"); // incremental

      done.add(item.id);
      writeChecklist(checklistPath, course, items, done); // incremental
      completed++;
      console.log(`  ✓ ${item.id}  ${item.prompt} → ${item.answer}`);
    } catch (e) {
      console.error(`  ✗ ${item.id}: ${(e as Error).message}`);
      if (stopOnError) {
        console.error("Stopping (--stop-on-error). Re-run to resume.");
        break;
      }
    }
  }

  console.log(
    `\nDone this run: ${completed}. Total complete: ${done.size}/${items.length}.\n` +
      `Checklist: ${checklistPath}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
