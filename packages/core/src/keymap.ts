// Centralized keyboard map so the web app is fully keyboard-drivable.
// The UI layer reads these; it never hard-codes key strings of its own.

import { Grade } from "./types";

export type KeyAction =
  | { type: "choose"; index: number } // multiple-choice option 1..4 (0-based index)
  | { type: "grade"; grade: Grade } // self-rating after reveal
  | { type: "submit" } // submit typed answer / continue
  | { type: "reveal" } // show the answer
  | { type: "replayAudio" }
  | { type: "skip" }
  | { type: "exit" }
  | { type: "help" };

/**
 * Resolve a KeyboardEvent.key to an action.
 * Number keys 1–4 double as multiple-choice selection and post-reveal grading;
 * the caller decides which phase it is in.
 */
export function actionForKey(key: string): KeyAction | null {
  switch (key) {
    case "1":
    case "2":
    case "3":
    case "4": {
      const index = Number(key) - 1;
      return { type: "choose", index };
    }
    case "Enter":
      return { type: "submit" };
    case " ":
    case "Spacebar":
      return { type: "replayAudio" };
    case "r":
    case "R":
      return { type: "reveal" };
    case "s":
    case "S":
      return { type: "skip" };
    case "Escape":
      return { type: "exit" };
    case "?":
      return { type: "help" };
    default:
      return null;
  }
}

/** Number keys 1–4 map to the four grades when the learner is self-rating. */
export function gradeForKey(key: string): Grade | null {
  switch (key) {
    case "1":
      return Grade.Again;
    case "2":
      return Grade.Hard;
    case "3":
      return Grade.Good;
    case "4":
      return Grade.Easy;
    default:
      return null;
  }
}

/** Human-readable legend for the on-screen help overlay ("?"). */
export const KEY_LEGEND: ReadonlyArray<{ keys: string; label: string }> = [
  { keys: "1–4", label: "Choose option / rate (Again·Hard·Good·Easy)" },
  { keys: "Enter", label: "Submit / continue" },
  { keys: "Space", label: "Replay audio" },
  { keys: "R", label: "Reveal answer" },
  { keys: "S", label: "Skip" },
  { keys: "Esc", label: "Exit session" },
  { keys: "?", label: "Toggle this help" },
];
