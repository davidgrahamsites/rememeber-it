# Memory — durable decisions & rationale

> Why we chose what we chose. Append learnings; don't delete history (strike through if reversed).

## Locked decisions (confirmed with user 2026-06-30)

| Area | Choice | Why |
|---|---|---|
| Cross-platform | Expo (RN universal) | One TS codebase → iOS App Store + web; strong web keyboard support; fast for a small team shipping in phases. |
| Backend | Supabase | Postgres fits relational SRS scheduling & leaderboards; built-in email/Google/Facebook auth; storage for meme images; realtime for social. |
| AI provider | OpenAI | User requirement — no Claude image generation. Used for mnemonic text **and** meme images. |
| AI usage | Initial assets only, admin-curated | User: NOT continuous. Generate once → admin accept (keep) / reject (regenerate). No runtime AI on the app path. |
| SRS | FSRS | ~20–30% fewer reviews than SM-2 for equal retention; predicts recall more accurately; open source. |
| Auth timing | Rollout phases, not prototype | User: prototype has no login; email/Google/Facebook arrive in the feature rollout. |
| Rollout shape | Phases start in parallel | User: "phases that start at the same time" → concurrent workstreams, ship as ready. |
| First courses | Radicals, then HSK1 vocab/grammar | User priority order. |

## Product rules (from user)
- It's a **mnemonic database**: users upload mems; learners pick the mem they prefer per item.
- **≤10 items per level**; every course has a learning path.
- Exercises: **multiple choice, cloze, speaking, typing**.
- **Keyboard controls** for every interaction on web.
- **Learning streak** + **add friends** (social).
- App name is **"Rememeber It"** (intentional spelling).

## Naming
- Product/display + Data Bus + Hub registry name: **`Rememeber It`** (must match across all three).
- "mem" = mnemonic (text and/or meme image). User wrote "memes"; treated as mems/mnemonics.

## Build facts (Phase 0, 2026-06-30)
- Expo **SDK 57**, React **19.2.3**, React Native **0.86.0**, expo-router ~57, reanimated 4.
  Reanimated 4 needs the `react-native-worklets/plugin` babel plugin (last in the list).
- Monorepo root = the project directory itself (npm workspaces: `packages/*`, `apps/*`, `tools/*`).
- Metro monorepo config (`apps/mobile/metro.config.js`) sets `watchFolders` to the workspace root
  so the app can import `@rememeber-it/core` (TS source) and `content/*.json`.
- **Metro does not rewrite `.js`→`.ts`** in workspace source. Keep `packages/core` internal
  imports **extensionless** (Vitest, tsc-Bundler, and Metro all accept that).
- Core is pure/deterministic (RNG injected) → 31 unit tests; generator curation loop → 3 tests.

## Learnings (append as we build)
- `packages/ui` deferred for the prototype; design tokens live in `apps/mobile/lib/theme.ts`.
- **Asset generation is resumable by design** (per user): a per-course `*.checklist.md` is written
  first; each item is checked off as its image downloads, so a dropped connection resumes without
  re-downloading. `gpt-image-1` returns base64 (no temp URL) → images saved straight to disk.
- **Work split (per user):** delegate repetitive API-call/execution work to a **Haiku subagent**
  that reports back to **Opus 4.8**, which does the heavy lifting (architecture/code/orchestration).
- **Secrets:** `tools/generator/.env` is gitignored; `.env.example` is git-tracked (keep it a
  placeholder only). The generator loads `.env` itself (no dotenv dep). Never commit real keys.
- Repo: https://github.com/davidgrahamsites/rememeber-it (account davidgrahamsites; `main`).
