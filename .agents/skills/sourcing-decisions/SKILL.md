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
- The Sénat index's Légifrance links are legacy `UnTexteDeJorf.do?numjo=NOR` redirects behind a bot wall: do NOT follow them. The efficient id-harvesting route: web-search `"n° <year>-<number>" <date> legifrance JORFTEXT`, then fetch the JORFTEXT page to verify. Never guess an id.
- When coordinating subagents, the coordinator re-fetches EVERY url itself before writing it into data; a subagent's "verified" claim is not a guarantee.
- Expect Wikimedia/Légifrance rate limits: pace requests, and on 429 wait about 60 seconds and retry (all scripts are idempotent).

## Non-legislative decisions (often the year's biggest events)

- Circulaires: `legifrance.gouv.fr/circulaire/id/<n>` (fetch-verifiable).
- Signed accords: often published at the JO (search "publication au Journal officiel" + the accord name for a JORFTEXT id).
- Confidence votes / motions de censure: no standalone JO document exists for the vote; date the decision by the resulting décret (nomination/fin de fonctions, which has a JORFTEXT id) and add the fetch-verifiable Assemblée nationale scrutin/actualité page as a second source.
- Government formations: the PM nomination décret and the government composition décret both have JORFTEXT ids.

## Conseil constitutionnel censures

When a law was partially censored before promulgation, the summary MUST state what survived and what was censored (with the CC décision as an extra source when relevant). Press and vie-publique summaries often describe the PRE-censure text: verify against the promulgated version.

## Attribution conventions

- Caretaker/short-lived governments: when a cabinet lives only days inside a caretaker stretch, use the next durable government's start date as the portfolio boundary, aligned with Wikipedia's dates when they differ; keep one convention registry-wide.
- When the minister who carried a bill left office before promulgation, `politician_ids` lists the office-holder at promulgation and the summary NAMES the actual carrier.
- Budget laws take the BUDGET year in the id (`lfss-2026` promulgated in December 2025 lives in `2025-12.json`).

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
