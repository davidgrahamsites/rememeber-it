// Global keyboard handler for the web app. No-op on native.
// Ignores keystrokes while a text field is focused so typing exercises work.
import { useEffect } from "react";
import { Platform } from "react-native";

export function useKeyboard(handler: (key: string) => void, enabled = true): void {
  useEffect(() => {
    if (Platform.OS !== "web" || !enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const el = (globalThis as { document?: Document }).document?.activeElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return; // let the field handle it
      handler(e.key);
    };
    const w = globalThis as unknown as {
      addEventListener: typeof window.addEventListener;
      removeEventListener: typeof window.removeEventListener;
    };
    w.addEventListener("keydown", onKey);
    return () => w.removeEventListener("keydown", onKey);
  }, [handler, enabled]);
}
