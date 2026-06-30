// Seed mnemonics for the prototype. Approved AI mnemonics produced by the
// offline generator + admin curation are published to
// content/mnemonics.generated.json (committed) and loaded here. A derived
// "link" mem is always added as a fallback so the picker is never empty.
import type { Item, Mnemonic } from "@rememeber-it/core";
import generated from "../../../content/mnemonics.generated.json";

const published = generated as Record<string, { text: string; memeImageUrl?: string }>;

export function seedMnemonics(item: Item): Mnemonic[] {
  const mems: Mnemonic[] = [];

  const ai = published[item.id];
  if (ai) {
    mems.push({
      id: `${item.id}-ai`,
      itemId: item.id,
      authorId: null,
      text: ai.text,
      memeImageUrl: ai.memeImageUrl,
      source: "ai",
      status: "approved",
      upvotes: 0,
    });
  }

  if (item.notes) {
    mems.push({
      id: `${item.id}-seed-note`,
      itemId: item.id,
      authorId: null,
      text: item.notes,
      source: "ai",
      status: "approved",
      upvotes: 0,
    });
  }

  const reading = item.reading ? ` (${item.reading})` : "";
  mems.push({
    id: `${item.id}-seed-link`,
    itemId: item.id,
    authorId: null,
    text: `Link the shape of ${item.prompt}${reading} to "${item.answer}" — picture it vividly.`,
    source: "ai",
    status: "approved",
    upvotes: 0,
  });

  return mems;
}
