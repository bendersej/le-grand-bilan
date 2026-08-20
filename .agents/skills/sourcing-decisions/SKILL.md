---
name: sourcing-decisions
description: Research and add political decisions to the Le Grand Bilan registry with exact official sources, correct references, and highlighted summaries.
---

# Sourcing decisions

How to add decisions to `data/decisions/yyyy-mm.json`. Used by humans and AI agents alike; the output always goes through a pull request reviewed before publication.

## Non-negotiables

1. **Every claim is sourced with the EXACT document URL.** For a law/ordinance/decree, that is the Légifrance text page (`https://www.legifrance.gouv.fr/jorf/id/JORFTEXT…`) — never a homepage, search page, or article ABOUT the decision as the only source. The schema rejects site-root URLs; the reviewer rejects imprecise ones. VERIFY every URL resolves to the named document before submitting (fetch it; never guess an id).
2. **Never submit an entry you could not source.** No source found = no entry.
3. **Neutral, factual summaries.** Describe what the decision does — no evaluation, no framing. The registry's credibility is the product.
4. **NO EM DASHES, ever, in content.** The em dash (—) is banned in all forms in titles, summaries and any text field. Use commas, colons, parentheses or separate sentences instead.

## Finding sources (best to weakest)

- Légifrance (`legifrance.gouv.fr/jorf/id/JORFTEXT…`) — the promulgated text; also `dossierlegislatif/JORFDOLE…` for the legislative history
- Journal officiel, assemblee-nationale.fr `/dyn/…/dossiers/…` and senat.fr `dossier-legislatif/…` pages (all fetch-verifiable)
- vie-publique.fr is a great INDEX but is JS-rendered and cannot be fetch-verified: use it via search snippets to find things, then cite Légifrance + Sénat/AN instead
- Reputable press ONLY as a supplementary source, never the sole one

More sources is better ("never forget" open-data registry).

## Research strategy (proven on the 2026 batch)

- Start each year from the Sénat index of promulgated laws (`senat.fr/dossiers-legislatifs/lois-promulguees-<year>.html`): it is exhaustive and reliable. Press searches only help rank significance.
- Harvest exact JORFTEXT ids from Légifrance JORF sommaire pages (fetch the sommaire, extract ids, fetch each id) — never guess an id.
- When coordinating subagents, the coordinator re-fetches EVERY url itself before writing it into data; a subagent's "verified" claim is not a guarantee.
- Expect Wikimedia/Légifrance rate limits: pace requests, and on 429 wait about 60 seconds and retry (all scripts are idempotent).

## Entry checklist

For each decision in the month file (`month` must match the filename):

- `id` — unique lowercase-dash slug, stable forever; prefer the COMMON name over the official title (`loi-philippine-2026`, not the long formal wording), suffixed with the year
- `date` — the decision's authoritative date (`yyyy-mm-dd`, inside the file's month): promulgation for laws, signature/publication for décrets and accords, NOT the JO publication date
- Several décrets that form one policy act are ONE decision (e.g. a pair of décrets implementing the same measure)
- For a proposition de loi, add the author deputy as a décisionnaire only when the law genuinely carries their name/initiative; verify their mandate dates cover it
- `title` — `fr` required, short, commonly-used name first ("Loi Travail (loi El Khomri)"); `en` translation or `null`
- `summary` — 1-3 sentences of what materially changed. **Bold the meaningful facts** with the limited markdown (`**bold**`, `*italic*`, `[label](https://…)`): what changed, for whom, by how much (e.g. "**relèvement de l'âge légal de 62 à 64 ans**", "**article 49.3**")
- `category_ids` — from `data/categories.json`; add a new category (lexicographic order, fr/en label) only when none fits
- `politician_ids` — most responsible first (minister who carried it, then PM, then President); every id must exist in `data/politicians.json` — add missing politicians with the `sourcing-decisionnaires` skill
- `sources` — at least one exact URL + human-readable title
- `relations` — typed links when the decision `amends` / `implements` / `repeals` / is `related` to another registry decision

## Validate before submitting

```bash
pnpm run test      # schema, referential integrity, month/filename, ordering
pnpm run check     # full CI-equivalent gate
```

A red data suite means the entry is wrong, not the suite.
