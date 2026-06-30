# Supabase backend (Phase A/B)

Postgres schema + RLS for accounts, cloud sync, community mnemonics, and social.
**Not wired into the app yet** — the prototype (Phase 0) runs fully local with no auth.

## Apply

```bash
# With the Supabase CLI and a linked project:
supabase db push          # applies migrations/*.sql
# or paste migrations/0001_init.sql into the SQL editor.
```

## Layout
- `migrations/0001_init.sql` — tables, the `leaderboard` view, and RLS policies.

## Model notes
- Content tables (`courses`, `levels`, `items`, `mnemonics`) are **publicly readable**; writes
  go through the service role / admin curation (matches the "no runtime AI, admin-curated" rule).
- Per-user tables (`review_state`, `reviews`, `streaks`, `user_mnemonic_choice`, `friends`) are
  **owner-only** via RLS (`user_id = auth.uid()`).
- `review_state` columns map 1:1 to the FSRS fields in `packages/core` (`stability`,
  `difficulty`, `due`, `last_review`, `reps`, `lapses`).
- IDs for content are the deterministic slugs from `buildCourse` (e.g. `radicals-l1-i1`), so the
  local `content/*.json` import and the cloud rows line up.

## Next
1. Add Supabase Auth (email + Google + Facebook) — Phase A.
2. Seed content tables from `content/*.json` + `content/mnemonics.generated.json`.
3. Point a `packages/core`-shaped data adapter at Supabase so the app can switch from the local
   store to cloud sync without changing UI code.
