---
name: sourcing-decisionnaires
description: Add politicians (décisionnaires) to the Le Grand Bilan registry, capture their Wikipedia profile with the idempotent script, and curate the editorial summary.
---

# Sourcing décisionnaires

How to add a politician to `data/politicians.json` and give them a complete profile. Used by humans and AI agents alike; output goes through a reviewed pull request.

## 1. Registry entry (hand-written)

Insert in lexicographic id order:

- `id` — lowercase-dash slug of the full name (`myriam-el-khomri`)
- `full_name` — with accents ("Édouard Philippe"); it doubles as the French Wikipedia page title the capture script queries, so it must match that page name
- `party` — current main party, or `null`
- `mandates` — the roles RELEVANT to decisions in the registry, with `from`/`to` dates (`to: null` when in office); role label fr + en. Verify the ACTUAL portfolio dates: short-lived governments are a trap (a reshuffled cabinet can last a day with different portfolios), so date the mandate from when the person got the CURRENT portfolio; and check a law's author/carrier was still in office at promulgation
- `profile: null` — the capture script fills it, never write it by hand

## 2. Profile capture (scripted, idempotent)

```bash
pnpm run capture:profiles <id> [...ids]      # only politicians with profile: null
pnpm run capture:profiles <id> --force       # re-check upstream; bails when content_hash unchanged
```

The script pulls, from the French Wikipedia REST + Commons APIs:

- the lead image → downloaded to `public/media/politicians/<id>.jpg` (self-hosted, NEVER hotlinked) with its per-file Commons license + author
- the article's lead section → seeds `summary.fr` (≤300 words), records `wikipedia_url`, `retrieved_at` and a `content_hash`

If the French Wikipedia page has NO lead image, the capture fails by design (the schema requires a photo in any non-null profile): leave `profile: null` and flag the politician in your report rather than fabricating a photo source.

Rate limits: Wikimedia 429s on bursts — expect roughly 3 successful captures per run. Loop: capture, count remaining `profile: null` AMONG THE IDS YOU ADDED (pre-existing photo-less politicians keep `profile: null` by design and make an unfiltered loop spin forever), sleep 60-75s, retry until none remain (budget ~10 min per 15 profiles; the script is idempotent, only failures retry).

## 3. Curate the summary (editorial — the script never overwrites it)

Rewrite `summary.fr` from the seeded lead section into ~300 words max that highlight, with the limited markdown (`**bold**`, `*italic*`, `[label](https://…)`):

- current/most recent **role** and party
- the **key offices held** (with years)
- what they did BEFORE politics — **public/private sector** jobs, profession, notable employers
- facts a reader needs to judge their decisions in context

Stay factual and neutral; everything must be supported by the Wikipedia article (the cited source). Wikipedia text is **CC BY-SA**: the site renders the attribution automatically — keep the summary derived from the article, don't import text from elsewhere.

**NO EM DASHES, ever, in content.** The em dash (—) is banned in all forms in summaries and any text field. Use commas, colons, parentheses or separate sentences instead.

## 4. Validate

```bash
pnpm run test    # includes: photo file exists, license present, references resolve
```

## Appearances (interventions publiques)

Public speeches/TV moments go in `data/appearances/yyyy-mm.json`: title fr/en, date, `politician_ids`, optional `decision_ids`, and `source_url` pointing at the EXACT video — for YouTube include the timestamp where the person speaks (`…&t=95s`). The site links the source; `pnpm run archive:appearances` additionally keeps a private R2 cold archive (never served) against takedowns.
