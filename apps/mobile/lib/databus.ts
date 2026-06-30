// App Opener Hub Data Bus — fire-and-forget. Never blocks the UI.
// Per ~/CLAUDE.md: send at meaningful moments only (level/session complete).
const HUB = "http://127.0.0.1:9800";
const APP_NAME = "Rememeber It";

export function busSend(content: string, metadata: Record<string, unknown> = {}): void {
  try {
    void fetch(`${HUB}/apps/${encodeURIComponent(APP_NAME)}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, role: "assistant", metadata }),
    }).catch(() => {
      /* fire-and-forget: ignore hub errors */
    });
  } catch {
    /* never let bus calls break the app */
  }
}
