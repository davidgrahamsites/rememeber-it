# Generator — OpenAI mnemonic + meme seeding (offline, build-time)

Generates the *initial* community mnemonics. **No runtime AI** — this runs once
per course at build time, behind a human admin curation loop.

## Usage

```bash
# Offline dry-run with the mock generator (no key needed):
npm run seed --workspace @rememeber-it/generator -- --course radicals --dry-run --auto-approve --limit 3

# Verify the curation loop logic:
npm run verify --workspace @rememeber-it/generator

# Real seeding (needs OPENAI_API_KEY in env; interactive curation):
OPENAI_API_KEY=sk-... npm run seed --workspace @rememeber-it/generator -- --course radicals
```

Interactive prompt per item: **[a]pprove** keeps it, **[r]egenerate** rejects and
makes a fresh candidate (loop), **[s]kip** drops it. Approved assets are written to
`generated-assets/<course>.mnemonics.json`.

## Flags
- `--course <slug>` — `radicals` (default) or `hsk1`
- `--dry-run` — use the offline mock generator (auto if no `OPENAI_API_KEY`)
- `--auto-approve` — approve every first candidate (auto when not a TTY)
- `--limit <n>` — only process the first n items

Models default to `gpt-4o-mini` (text) and `gpt-image-1` (image); override in
`openAiGenerator()`.
