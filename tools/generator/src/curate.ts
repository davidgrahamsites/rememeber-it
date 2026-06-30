// Admin curation loop (pure logic, no I/O). A candidate mnemonic starts
// `pending`; the admin either approves it or rejects it (which regenerates a
// fresh candidate). Decisions are testable without any prompts or network.
import type { Item, Mnemonic } from "@rememeber-it/core";

export interface GeneratedAsset {
  text: string;
  memeImageUrl?: string;
}

/** Produces a candidate asset for an item on a given attempt (1-based). */
export type Generate = (item: Item, attempt: number) => Promise<GeneratedAsset>;

export interface Candidate {
  item: Item;
  text: string;
  memeImageUrl?: string;
  status: "pending" | "approved" | "rejected";
  attempts: number;
}

/** Generate the first candidate for an item (status: pending). */
export async function makeCandidate(item: Item, gen: Generate): Promise<Candidate> {
  const asset = await gen(item, 1);
  return { item, text: asset.text, memeImageUrl: asset.memeImageUrl, status: "pending", attempts: 1 };
}

/** Admin approves the current candidate. */
export function approve(c: Candidate): Candidate {
  return { ...c, status: "approved" };
}

/** Admin rejects the current candidate → regenerate a new pending candidate. */
export async function reject(c: Candidate, gen: Generate): Promise<Candidate> {
  const attempt = c.attempts + 1;
  const asset = await gen(c.item, attempt);
  return {
    ...c,
    text: asset.text,
    memeImageUrl: asset.memeImageUrl,
    status: "pending",
    attempts: attempt,
  };
}

/** Convert an approved candidate into a storable Mnemonic record. */
export function toMnemonic(c: Candidate): Mnemonic {
  return {
    id: `${c.item.id}-ai`,
    itemId: c.item.id,
    authorId: null,
    text: c.text,
    memeImageUrl: c.memeImageUrl,
    source: "ai",
    status: c.status === "approved" ? "approved" : "pending",
    upvotes: 0,
  };
}
