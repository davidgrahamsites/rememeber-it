# Restart — pick up from here

> Source of truth for "what's done / what's next". Re-write at the end of every build pass.

_Last updated: 2026-06-30 — Phase 0 prototype built end to end; bundles & tests green._

## Current phase
**Phase 0 — Prototype** (local data, no auth, no backend).

## Done
- [x] Requirements gathered; stack locked (Expo + Supabase + OpenAI + FSRS).
- [x] Build plan approved; six living docs created.
- [x] Monorepo scaffolded at the project root (npm workspaces: packages/*, apps/*, tools/*).
- [x] `packages/core` — FSRS-5 scheduler, exercise engine (matching/distractors/type-selection),
      keymap, streaks, content loader, types. **31 tests pass; typecheck clean.**
- [x] Course content authored: `content/radicals.json` (50 radicals, 5 levels) and
      `content/hsk1.json` (45 items: 40 vocab + 5 grammar, 5 levels). All levels ≤10, validated.
- [x] Expo Router app (SDK 57, RN 0.86, React 19.2):
      home/streak, course learning path, keyboard-driven exercise player
      (multiple choice / cloze / typing / speaking) with mnemonic picker + add-your-own.
      **Web bundle exports & serves (200); mobile typecheck clean.**
- [x] `tools/generator` — OpenAI mnemonic+meme seeding with admin accept/reject→regenerate loop.
      **3 tests pass; dry-run seeded 50 radical mnemonics → `generated-assets/radicals.mnemonics.json`.**
- [x] Data Bus wired fire-and-forget on level completion (`apps/mobile/lib/databus.ts`).
- [x] Curated mnemonics published to committed `content/mnemonics.generated.json` (95 entries,
      **mock/dry-run text, no images** — see B5) and loaded by `apps/mobile/lib/mnemonics.ts`.
- [x] Friends + leaderboard screen (`app/social.tsx`, local stub) linked from home.
- [x] Supabase schema + RLS (`supabase/migrations/0001_init.sql`) — not yet wired to the app.
- [x] Git repo initialized and pushed: https://github.com/davidgrahamsites/rememeber-it (branch `main`).

## Verified this pass
- `npm test` → 31 core + 3 generator tests pass.
- `npx expo export --platform web` → bundles 1263 modules; static shell serves & bundle loads (200).
- `npm run verify --workspace @rememeber-it/generator` → curation loop OK (pending→approve, reject→regenerate).

## Next concrete steps (in order)
1. **Real OpenAI mnemonics:** set `OPENAI_API_KEY`, run
   `npm run seed --workspace @rememeber-it/generator -- --course radicals` (interactive curation),
   then `--course hsk1`. This replaces the mock placeholders with real text + meme images (B5).
2. **Manual browser pass:** `cd apps/mobile && npx expo start --web`, complete a radicals level
   **keyboard-only** (1–4, Enter, Space, R, M, ?); confirm streak increments and the next level unlocks.
3. Store meme images in Supabase Storage and reference their URLs in `mnemonics.generated.json`.
4. Begin Phase A: Supabase Auth (email/Google/Facebook) + a core-shaped data adapter so the app
   swaps the local store for cloud sync without UI changes (schema already in `supabase/`).
5. Register the app in the Hub registry once it's packaged into a `.app` (see bugs.md).

## Run commands
```bash
npm install
npm test
cd apps/mobile && npx expo start --web
```

## Blockers / open questions
- App Opener Hub was **not running** during this pass, so the live send wasn't observed (the
  call is safe/fire-and-forget regardless). Re-test when the Hub is up.
- HSK1 content is a curated **starter subset**, not the full ~150-word list (see bugs.md).
- Speaking exercise uses the browser Web Speech API on web; native (iOS) STT is not wired yet.
