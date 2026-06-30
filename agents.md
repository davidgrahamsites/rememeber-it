# Agents — roles & build conventions

> For AI contributors (Claude Code, Codex) working on this repo. Re-write as roles evolve.

## Workflow
1. Read `restart.md` first — it has current status and the next concrete steps.
2. Read `memory.md` for locked decisions; do **not** silently reverse them.
3. Make surgical changes; match existing style; minimal code to meet the goal.
4. Update the six docs at the end of every build pass (especially `restart.md` and `bugs.md`).
5. Hand off to **Codex** for review; record findings in `bugs.md`.

## Roles
- **Builder (Claude Code):** implements features per `restart.md` next-steps, writes tests,
  keeps docs current.
- **Reviewer (Codex):** checks correctness, security, and adherence to the plan; files issues
  into `bugs.md`.
- **Content author:** curates `content/radicals.json` / `content/hsk1.json` from cited sources
  (`references.md`); keeps levels ≤10 items.
- **Asset generator (offline):** runs `tools/generator` (OpenAI) to seed mnemonics + meme
  images; a human **admin curates** (accept/reject→regenerate) before assets ship.

## Conventions
- Pure logic (FSRS, exercise engine, matching, keymap) → `packages/core`, fully unit-tested,
  no React/platform imports.
- UI → `apps/mobile` + `packages/ui`. Keep web keyboard-drivable (keymap from core).
- No runtime AI calls in the app — generation is build-time only.
- Data Bus calls are fire-and-forget; never block UI.
- Secrets via env only.

## Definition of done (per feature)
- Code + unit tests pass (`npm test`).
- Runs on web (`npx expo start --web`); the relevant flow works keyboard-only where applicable.
- Docs updated; Codex review requested; bugs logged.
