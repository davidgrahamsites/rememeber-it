// Browser speech helpers (web only). Native is a no-op / unsupported so the
// speaking exercise degrades gracefully.
import { Platform } from "react-native";

type WinSpeech = {
  speechSynthesis?: {
    speak: (u: unknown) => void;
    cancel: () => void;
  };
  SpeechSynthesisUtterance?: new (text: string) => { lang: string; rate: number };
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
}

function win(): WinSpeech | null {
  if (Platform.OS !== "web") return null;
  return globalThis as unknown as WinSpeech;
}

/** Speak text aloud (default Mandarin). Silent no-op where unsupported. */
export function speak(text: string, lang = "zh-CN"): void {
  const w = win();
  if (!w?.speechSynthesis || !w.SpeechSynthesisUtterance) return;
  try {
    w.speechSynthesis.cancel();
    const u = new w.SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.85;
    w.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

export function canRecognizeSpeech(): boolean {
  const w = win();
  return !!(w && (w.SpeechRecognition || w.webkitSpeechRecognition));
}

/** Capture one spoken phrase and resolve the transcript. Rejects if unsupported. */
export function recognizeOnce(lang = "zh-CN"): Promise<string> {
  const w = win();
  const Ctor = w?.SpeechRecognition || w?.webkitSpeechRecognition;
  if (!Ctor) return Promise.reject(new Error("speech recognition unsupported"));
  return new Promise<string>((resolve, reject) => {
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => resolve(e.results[0]?.[0]?.transcript ?? "");
    rec.onerror = () => reject(new Error("speech recognition error"));
    rec.onend = () => {};
    rec.start();
  });
}
