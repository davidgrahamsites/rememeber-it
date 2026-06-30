# Bugs & known issues

> Running list. Format: `[ID] severity — title` then repro / status. Re-write every build pass.

## Open
- **[B1] low — HSK1 content is a starter subset, not the full list.** `content/hsk1.json` has
  45 items (40 vocab + 5 grammar). HSK1 is ~150 words. Complete it from a cited source
  (see references.md) before launch. Status: open.
- **[B2] low — App not registered in the Hub registry.** `~/Library/Application Support/AppOpenerHub/registry.json`
  has no "Rememeber It" entry, and the Hub was offline during this build. Register once the app
  is packaged into a `.app` (the registry expects a binary path). The Data Bus client is safe
  meanwhile (fire-and-forget). Status: open.
- **[B3] low — iOS speaking exercise has no STT.** Speaking uses the browser Web Speech API on
  web; on native it falls back to reveal + self-grade. Wire an on-device/native STT for iOS.
  Status: open / by design for the prototype.
- **[B4] low — npm audit reports vulnerabilities** in the transitive dev/build dependency tree
  (Expo/Metro toolchain). No runtime impact on the shipped app; revisit with `npm audit` before
  store submission. Status: open.

- **[B5] medium — real AI mnemonics being generated.** Replacing the mock placeholders via
  `npm run generate` (gpt-4o-mini text + gpt-image-1 images), resumable through
  `generated-assets/<course>.checklist.md`. Status: PAUSED (radicals 14/50 real text + images, hsk1 0/45,
  81 mock placeholders remain). Resume via `npm run generate --workspace @rememeber-it/generator -- --course <radicals|hsk1>`.
  Once complete, the meme PNGs are local-only (`generated-assets/images/`) pending the Supabase Storage move (B6).
- **[B6] medium — meme images are local-only, not hosted.** Images download to
  `generated-assets/images/<course>/` (gitignored). The app does not display them yet; upload to
  Supabase Storage and store the public URL in `mnemonics.generated.json` (`image` → `memeImageUrl`).
  Status: open (planned with Phase B).

## Watchlist / risks (not bugs yet)
- Typing exercise tolerant matching (pinyin tones, articles, synonyms) — add more cases to
  `exercise.test.ts` as real answers surface false negatives.
- FSRS uses default weights; revisit the optimizer once real review logs exist.
- Metro requires extensionless relative imports in workspace TS source (we dropped `.js`
  extensions in `packages/core`); keep new core imports extensionless. (Resolved this pass.)

## Resolved
- **[R1] Metro could not resolve `./types.js` from `packages/core`.** Core used explicit `.js`
  import extensions (fine for Vitest/tsc, not Metro). Fixed by switching core internal imports
  to extensionless. Web bundle now compiles. (2026-06-30)
- **[R2] Web export failed: missing `react-native-web`/`react-dom`.** Installed via
  `expo install`. (2026-06-30)
