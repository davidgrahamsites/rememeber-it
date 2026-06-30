// Content loader: turns authored course JSON (the `content/` files) into typed
// Course/Level/Item objects with deterministic ids. Pure — no file I/O here.

import type { Course, Item, Level } from "./types";

export const MAX_ITEMS_PER_LEVEL = 10;

export interface RawItem {
  prompt: string;
  answer: string;
  altAnswers?: string[];
  reading?: string;
  audioUrl?: string;
  partOfSpeech?: string;
  notes?: string;
  clozeSentence?: string;
  kind: Item["kind"];
}

export interface RawLevel {
  title: string;
  items: RawItem[];
}

export interface RawCourse {
  slug: string;
  title: string;
  language: string;
  description: string;
  order: number;
  levels: RawLevel[];
}

export interface BuiltCourse {
  course: Course;
  levels: Level[];
  items: Item[];
}

/**
 * Build a typed course from authored JSON. Ids are deterministic
 * (`<slug>`, `<slug>-l<n>`, `<slug>-l<n>-i<m>`). Throws if any level exceeds
 * MAX_ITEMS_PER_LEVEL so bad content fails loudly at import time.
 */
export function buildCourse(raw: RawCourse): BuiltCourse {
  const levels: Level[] = [];
  const items: Item[] = [];

  raw.levels.forEach((rawLevel, li) => {
    if (rawLevel.items.length > MAX_ITEMS_PER_LEVEL) {
      throw new Error(
        `Course "${raw.slug}" level ${li + 1} ("${rawLevel.title}") has ` +
          `${rawLevel.items.length} items; max is ${MAX_ITEMS_PER_LEVEL}.`,
      );
    }
    const levelId = `${raw.slug}-l${li + 1}`;
    const itemIds: string[] = [];

    rawLevel.items.forEach((rawItem, ii) => {
      const id = `${levelId}-i${ii + 1}`;
      itemIds.push(id);
      items.push({
        id,
        courseId: raw.slug,
        levelId,
        prompt: rawItem.prompt,
        answer: rawItem.answer,
        altAnswers: rawItem.altAnswers,
        reading: rawItem.reading,
        audioUrl: rawItem.audioUrl,
        partOfSpeech: rawItem.partOfSpeech,
        notes: rawItem.notes,
        clozeSentence: rawItem.clozeSentence,
        kind: rawItem.kind,
      });
    });

    levels.push({ id: levelId, courseId: raw.slug, index: li, title: rawLevel.title, itemIds });
  });

  const course: Course = {
    id: raw.slug,
    slug: raw.slug,
    title: raw.title,
    language: raw.language,
    description: raw.description,
    order: raw.order,
    levelIds: levels.map((l) => l.id),
  };

  return { course, levels, items };
}
