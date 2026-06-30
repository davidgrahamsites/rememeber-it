# Rememeber It

Spaced-repetition language-learning app (web + iPhone) in the spirit of the original Memrise.
A community **mnemonic database**: users upload mnemonics ("mems") and other learners pick the
one that helps them remember each item. Launches with **Simplified Chinese Radicals** and
**HSK1 Vocabulary / Grammar** courses.

> These docs (`CLAUDE.md`, `restart.md`, `memory.md`, `references.md`, `agents.md`, `bugs.md`)
> are **living** — re-write them on every build pass. `restart.md` is the source of truth for
> "what's done / what's next". Codex reviews the work.

## Stack (locked)

| Area | Choice |
|---|---|
| Cross-platform | **Expo (React Native universal)** — one TS codebase → iOS + web |
| Backend | **Supabase** (Postgres + Auth + Storage + Realtime) — rollout phase only |
| AI | **OpenAI**, initial asset generation only, admin accept/reject→regenerate loop. No runtime AI. |
| SRS | **FSRS** (open-spaced-repetition), pure TS in `packages/core` |
| Prototype | **No auth, no backend** — local device data. Auth ships in rollout phases. |

## Repo layout

```
<repo root = this project dir>
├─ apps/mobile/        # Expo Router app (iOS + web). lib/databus.ts = Hub client
├─ packages/core/      # FSRS scheduler, exercise engine, keymap, streaks, content loader, types (tested)
├─ tools/generator/    # OpenAI seeding + admin curation (offline, build-time)
├─ content/            # radicals.json, hsk1.json (source content)
├─ generated-assets/   # curated AI mnemonics output (gitignored)
└─ supabase/           # SQL migrations, RLS, seed (rollout phase — not yet created)
```

Note: `packages/ui` (shared design system) is deferred; the prototype keeps tokens in
`apps/mobile/lib/theme.ts` and primitives in `apps/mobile/components/ui.tsx`.

## How to run

The repo root is this project directory (it holds the npm workspaces).

```bash
npm install
npm test                                   # packages/core + generator unit tests
npm run typecheck                          # packages/core typecheck
cd apps/mobile && npx expo start --web     # web prototype
cd apps/mobile && npx expo start --ios     # iOS simulator
cd apps/mobile && npx expo export --platform web   # verify the web bundle compiles

# Mnemonic seeding (offline dry-run; real run needs OPENAI_API_KEY):
npm run seed --workspace @rememeber-it/generator -- --course radicals --dry-run --auto-approve
npm run verify --workspace @rememeber-it/generator

# Real asset generation — resumable; downloads meme images to generated-assets/images/.
# Needs tools/generator/.env (OPENAI_API_KEY=...). Re-run to resume; skips completed items.
npm run generate --workspace @rememeber-it/generator -- --course radicals
npm run generate --workspace @rememeber-it/generator -- --course hsk1
```

Generated text + image paths are written to `content/mnemonics.generated.json` (committed);
the PNG files live in `generated-assets/images/<course>/` (gitignored, local-only until moved to
Supabase Storage). Per-course progress is tracked in `generated-assets/<course>.checklist.md`.

## Conventions

- TypeScript everywhere. Pure, deterministic, unit-tested logic lives in `packages/core` (no
  React, no platform APIs there).
- Surgical changes; match existing style; minimal code to meet the goal (see Engineering
  Principles in `~/CLAUDE.md`).
- A **level holds ≤10 items**. Every course has a visual learning path of leveled nodes.
- Web must be **fully keyboard-drivable**. Keymap is centralized in `packages/core`.
- Exercise types: **multiple choice, cloze, typing, speaking**. Speaking degrades gracefully
  where speech APIs are unavailable.
- Secrets (OpenAI key) via env only; never commit keys or generated cost.

## App Opener Hub Data Bus (required, per `~/CLAUDE.md`)

- App name: **`Rememeber It`** (must match the Hub registry).
- Fire-and-forget only — never block UI on bus calls.
- Send at meaningful moments: **level complete**, **session complete**, **export** — not every
  state change.
- POST `http://127.0.0.1:9800/apps/Rememeber It/send` with `{content, role, metadata}`.

## Current phase

**Phase 0 — Prototype** (local, no auth). See `restart.md` for exact status and next steps.
