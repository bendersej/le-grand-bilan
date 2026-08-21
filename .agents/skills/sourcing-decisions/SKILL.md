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
- The Sénat index's Légifrance links are legacy `UnTexteDeJorf.do?numjo=NOR` redirects behind a bot wall: do NOT follow them. PRIMARY id-harvesting route: Légifrance's own search, `legifrance.gouv.fr/search/all?query=…` (server-rendered, returns JORFTEXT ids directly). Web search is the fallback only (session budgets can be exhausted; DuckDuckGo-html is captcha-walled, Mojeek 403s). Always fetch the JORFTEXT page to verify; never guess an id.
- Légifrance (search, `jorf/id/…`, `circulaire/id/…`) is Cloudflare-walled to curl even with a browser UA: verify Légifrance URLs with the agent's web-fetch tool. Keep curl for senat.fr, assemblee-nationale.fr, elysee.fr and conseil-constitutionnel.fr, which fetch fine.
- Légifrance search results are ACTIVELY UNTRUSTWORTHY for base texts: modifying texts dominate the ranking, so it returns modifying décrets, arrêtés modificatifs or a law's "(rectificatif)" instead of the base text roughly a third of the time. Every search-derived id MUST be re-fetched and title-checked. The more reliable route: the JO sommaire page `legifrance.gouv.fr/jorf/jo/YYYY/MM/DD/NNNN` (the issue number is printed in the Sénat index as "JO n°X du date") links the exact JORFTEXT of every text of that day.
- JO sommaire issue numbers are strictly sequential with no issue most Mondays: anchor on a Sénat-index-provided issue number and count days (minus Mondays) to reach a target date. An off-by-one guess returns a contentless page, not a 404.
- The web-fetch summarizer can misread which article of an omnibus text does what (wrong article/date attributions). Cross-check any date/number claim with a targeted fetch of the specific `jorf/article_jo/JORFARTI…` URL, or write the summary without the disputed detail.
- The Sénat "lois promulguées" index OMITS treaty-ratification laws (e.g. loi 2022-1124 autorisant la ratification OTAN). A year with a major geopolitical arc needs an explicit Légifrance search for "autorisant la ratification"/"autorisant l'approbation" laws.
- Election-year months are structurally thin (March-July): the sourcable acts are CC proclamation decisions (they have JORFTEXT ids), government formation décrets and summit decisions, not laws. Do not burn time hunting non-existent legislation there.
- Bulk-verify the Sénat index's dossier-legislatif URLs with one curl `<title>` sweep (server-rendered) instead of fetching them one by one.
- When coordinating subagents, the coordinator re-fetches EVERY url itself before writing it into data; a subagent's "verified" claim is not a guarantee.
- Long omnibus laws (LFI, LFR, LFSS) defeat single-fetch verification: the fetch only surfaces the first chunk and can wrongly report a later-article measure "absent". Verify headline measures via the CC decision page or the Sénat dossier instead of trusting one negative fetch.
- Expect Wikimedia/Légifrance rate limits: pace requests, and on 429 wait about 60 seconds and retry (all scripts are idempotent).

## Non-legislative decisions (often the year's biggest events)

- Circulaires: `legifrance.gouv.fr/circulaire/id/<n>` — the id can be a short number (e.g. `45302`); like all of Légifrance it 403s under curl, use the web-fetch tool.
- Conseil d'État decisions: `conseil-etat.fr/fr/arianeweb/CE/decision/YYYY-MM-DD/NNNNNN` (stable, fetchable). They are the anchor for UNPUBLISHED administrative acts (notes de service, télégrammes): date the entry by the act, cite the CE decision that quotes it. education.gouv.fr's BO is Cloudflare-walled; do not try to fetch it.
- elysee.fr has no search endpoint, but its sitemaps (`sitemap.publication.xml` etc.) are curl-able and grep-able by date to find exact speech/announcement URLs. The date in an elysee.fr URL path can be off by one vs the event: date the entry from the page content, not the URL.
- diplomatie.gouv.fr is rot-prone: old communiqué URLs 301 to generic country pages. A diplomatic act with no JO or Élysée trace may end up unsourceable; drop it rather than cite a redirect.
- EU-summit and NATO decisions have no French JO document: the elysee.fr publication page (found via the sitemap date-grep) is the citable French source. consilium.europa.eu hard-403s all automated fetches; nato.int works but 301s to its new URL scheme (`nato.int/en/about-us/official-texts-and-resources/official-texts/…`), cite the redirect target.
- Most ministry sites 403 automated fetches (info.gouv.fr, budget.gouv.fr, interieur.gouv.fr, education.gouv.fr) but ecologie.gouv.fr does NOT: its `presse/…` HTML pages fetch fine and anchor government plans. Prefer the HTML press page over `sites/default/files/…` PDF paths, which rot.
- sante.gouv.fr / solidarites-sante.gouv.fr are captcha-walled and return 200 with HTML even for PDF URLs: check the content type, never the status code. tresor.economie.gouv.fr IS curl-fetchable and hosts official dossiers de presse that economie.gouv.fr 403s (the anchor for France Relance).
- Regulator decisions (Arcep…) may never appear at the JO: the regulator's own communiqué is the citable source. arcep.fr is bot-walled to curl (JS challenge) but fetches via the web-fetch tool.
- A 49.3 engagement and its censure-motion outcome are documented inline on the AN dossier page ("Engagement de responsabilité… Motion rejetée"): the dossier page alone sources a 49.3 entry. Brute-forcing scrutin numbers is a dead end (numbers are unrelated to dates).
- Do not assume a conseil-des-ministres communication exists for PM-led announcements (Ségur, France Relance have none): hunt the implementing décret or the official dossier de presse instead.
- Signed accords: often published at the JO (search "publication au Journal officiel" + the accord name for a JORFTEXT id).
- Confidence votes / motions de censure: no standalone JO document exists for the vote; date the decision by the resulting décret (nomination/fin de fonctions, which has a JORFTEXT id) and add the fetch-verifiable Assemblée nationale scrutin/actualité page as a second source.
- Government formations: the PM nomination décret and the government composition décret both have JORFTEXT ids.
- A dissolution and the convocation of electors are TWO separate décrets published the same day with distinct JORFTEXT ids (one may be unnumbered).
- An état d'urgence can end by silent statutory expiry (e.g. the 12-day lapse): there is no "levée" text to hunt at the JO; date the end by the expiry.
- Caretaker governments ("affaires courantes") still produce registry-worthy decisions: application décrets, stopgap measures. Do not treat those months as dead time.
- When a bill's arc never reached promulgation (e.g. a budget killed by a censure), the PRESENTATION in conseil des ministres is the citable act: source it with the AN dossier page plus the compte rendu.

## Conseil constitutionnel censures

When a law was partially censored before promulgation, the summary MUST state what survived and what was censored (with the CC décision as an extra source when relevant). Press and vie-publique summaries often describe the PRE-censure text: verify against the promulgated version.

- CC decision numbers carry the SAISINE year, not the law's year (the January 2024 immigration law is décision 2023-863 DC).
- A dissolution makes pending saisines inadmissible (deputies lose standing when the décret takes effect): a law can be promulgated with its referrals dismissed, a third outcome besides censored/upheld. State it when it happened.
- Extract censure specifics by curl + grep of the decision page for the "Sont contraires à la Constitution" dispositif and surrounding paragraphs (conseil-constitutionnel.fr is fully curl-able).

## Attribution conventions

- Caretaker/short-lived governments: when a cabinet lives only days inside a caretaker stretch, use the next durable government's start date as the portfolio boundary, aligned with Wikipedia's dates when they differ; keep one convention registry-wide.
- Censured governments have TWO end dates: the PM's mandate ends at the successor PM's nomination décret; the ministers' mandates end at the next government's composition décret (often days later). Follow that asymmetry.
- When the minister who carried a bill left office before promulgation, `politician_ids` lists the office-holder at promulgation and the summary NAMES the actual carrier.
- Budget laws take the BUDGET year in the id (`lfss-2026` promulgated in December 2025 lives in `2025-12.json`).

## Entry checklist

For each decision in the month file (`month` must match the filename):

- `id` — unique lowercase-dash slug, stable forever; prefer the COMMON name over the official title (`loi-philippine-2026`, not the long formal wording), suffixed with the year. When the same kind of act recurs within a year (two prorogations d'état d'urgence in 2020), put the month in the id from the start (`-mai-`, `-novembre-`)
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

`data/politicians.json` is in standard 2-space JSON style, so a script round-trip produces a clean minimal diff; the decisions month files use inline arrays and must be edited surgically, never round-tripped.

A red data suite means the entry is wrong, not the suite.
