# Rememeber It

Spaced-repetition language-learning app (web + iPhone) in the spirit of the original Memrise —
a community **mnemonic database** where users upload mnemonics ("mems") and other learners pick
the one that helps them most. Launches with **Simplified Chinese Radicals** and **HSK1
Vocabulary & Grammar**.

## Highlights
- **Expo (React Native universal)** — one TypeScript codebase for iOS + web.
- **FSRS** spaced-repetition scheduler (pure, deterministic, unit-tested).
- Learning path of levels (≤10 items each), four exercise types — **multiple choice, cloze,
  typing, speaking** — fully **keyboard-driven** on web.
- **Streaks** and **friends + leaderboard**.
- Community mnemonics: pick a mem or add your own. Initial mems are **AI-generated once** via
  **OpenAI** behind an admin accept/reject→regenerate loop (no runtime AI).
- **Supabase** backend (Postgres + Auth + Storage + Realtime) for the rollout phases.

## Repo layout
```
apps/mobile/        Expo Router app (iOS + web)
packages/core/      FSRS, exercise engine, keymap, streaks, content loader (tested)
tools/generator/    Offline OpenAI seeding + admin curation
content/            Course data + curated mnemonics
supabase/           Schema + RLS (rollout phase)
```

## Quick start
```bash
npm install
npm test                                   # core + generator unit tests
cd apps/mobile && npx expo start --web     # run the web prototype
```

See `CLAUDE.md`, `restart.md`, and `memory.md` for the full plan, current status, and decisions.

## Status
**Phase 0 prototype** — local, no auth. Auth (email/Google/Facebook), cloud sync, and social
land in the rollout phases. See `restart.md`.
