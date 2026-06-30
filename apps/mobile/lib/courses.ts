// Load authored course JSON and build typed courses via the shared core loader.
import {
  buildCourse,
  type BuiltCourse,
  type Course,
  type Item,
  type Level,
  type RawCourse,
} from "@rememeber-it/core";
import radicalsRaw from "../../../content/radicals.json";
import hsk1Raw from "../../../content/hsk1.json";

const built: BuiltCourse[] = [
  buildCourse(radicalsRaw as RawCourse),
  buildCourse(hsk1Raw as RawCourse),
].sort((a, b) => a.course.order - b.course.order);

const itemsById = new Map<string, Item>();
const levelsById = new Map<string, Level>();
const coursesBySlug = new Map<string, BuiltCourse>();

for (const b of built) {
  coursesBySlug.set(b.course.slug, b);
  b.items.forEach((it) => itemsById.set(it.id, it));
  b.levels.forEach((lv) => levelsById.set(lv.id, lv));
}

export const allCourses: Course[] = built.map((b) => b.course);

export function getCourse(slug: string): BuiltCourse | undefined {
  return coursesBySlug.get(slug);
}

export function getLevel(levelId: string): Level | undefined {
  return levelsById.get(levelId);
}

export function getItem(itemId: string): Item | undefined {
  return itemsById.get(itemId);
}

export function getLevelItems(levelId: string): Item[] {
  const lv = levelsById.get(levelId);
  if (!lv) return [];
  return lv.itemIds.map((id) => itemsById.get(id)).filter((x): x is Item => !!x);
}

export function getCourseItems(slug: string): Item[] {
  return coursesBySlug.get(slug)?.items ?? [];
}
