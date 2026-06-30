// Shared domain types for Rememeber It.
// Pure data only — no React, no platform APIs.

/** FSRS grade given by the learner after seeing the answer. */
export enum Grade {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

/** Per-card scheduling state (mirrors the `review_state` table). */
export interface FsrsState {
  /** Memory stability in days (interval at which retrievability == requestRetention). */
  stability: number;
  /** Difficulty, clamped to [1, 10]. */
  difficulty: number;
  /** ISO timestamp the card is next due. */
  due: string;
  /** ISO timestamp of the last review, or null if never reviewed. */
  lastReview: string | null;
  /** Successful + failed reviews so far. */
  reps: number;
  /** Times the card was forgotten (graded Again after being learned). */
  lapses: number;
}

export type ExerciseType = "multipleChoice" | "cloze" | "typing" | "speaking";

/** A single learnable thing: a radical, an HSK1 word, or a grammar point. */
export interface Item {
  id: string;
  courseId: string;
  levelId: string;
  /** What the learner sees as the question target, e.g. the radical "氵" or word "你好". */
  prompt: string;
  /** Canonical answer, e.g. "water" or "hello". */
  answer: string;
  /** Other accepted answers for tolerant matching (typing). */
  altAnswers?: string[];
  /** Pinyin / reading, e.g. "nǐ hǎo". */
  reading?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  notes?: string;
  /** For cloze (grammar): a sentence containing the blank token "___". */
  clozeSentence?: string;
  /** Item kind drives default exercise selection. */
  kind: "radical" | "vocab" | "grammar";
}

export interface Level {
  id: string;
  courseId: string;
  index: number;
  title: string;
  itemIds: string[]; // always <= 10
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  language: string;
  description: string;
  order: number;
  levelIds: string[];
}

/** A community mnemonic ("mem"): text and/or generated meme image. */
export interface Mnemonic {
  id: string;
  itemId: string;
  authorId: string | null; // null for AI seed
  text: string;
  memeImageUrl?: string;
  source: "ai" | "user";
  status: "pending" | "approved" | "rejected";
  upvotes: number;
}

/** Daily learning streak state. */
export interface StreakState {
  current: number;
  longest: number;
  /** ISO date (YYYY-MM-DD) of the last active day, or null. */
  lastActiveDate: string | null;
  /** Remaining streak freezes. */
  freezes: number;
}
