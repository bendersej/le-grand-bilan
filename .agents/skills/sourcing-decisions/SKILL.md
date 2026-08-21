---
name: sourcing-decisions
description: Research and add political decisions to the Le Grand Bilan registry with exact official sources, correct references, and highlighted summaries.
---

# Sourcing decisions

How to add decisions to `data/decisions/yyyy-mm.json`. Used by humans and AI agents alike; the output always goes through a pull request reviewed before publication.

## Non-negotiables

1. **Every claim is sourced with the EXACT document URL.** For a law/ordinance/decree, that is the Légifrance text page (`https://www.legifrance.gouv.fr/jorf/id/JORFTEXT…`) — never a homepage, search page, or article ABOUT the decision as the only source. The schema rejects site-root URLs; the reviewer rejects imprecise ones. VERIFY every URL resolves to the named document before submitting (fetch it; never guess an id).
2. **Never submit an entry with an unverified source.** When a registry-worthy decision genuinely has no citable official document, enter it WITH `missing_sources: { reason, note, expired_url }` instead of dropping it (reasons: `link_rot` with the dead exact URL kept as proof, `never_published` for acts absent from official publication, `no_official_document` when no standalone document exists). This is a last resort after the alternate routes below failed, never a shortcut around fetch-verification. `missing_sources` and real `sources` MAY coexist: a never-published act anchored by a Sénat rapport d'information (`senat.fr/rap/rXX-NNN/…`, curl-fetchable) cites the report AND states why the act itself is uncitable.
3. **Bot-walled canonical URLs are recorded, flagged, and paired with a verified anchor.** When the canonical official document lives on a host that blocks automated fetches (sante.gouv.fr, info.gouv.fr…), add it to `sources` with `bot_walled: true` (the site hides it pending human verification) AND cite at least one machine-verified alternate anchor (CC decision, Sénat dossier, implementing décret, préfecture mirror) — the schema requires one non-bot-walled source unless `missing_sources` applies.
4. **Neutral, factual summaries.** Describe what the decision does — no evaluation, no framing. The registry's credibility is the product.
5. **NO EM DASHES, ever, in content.** The em dash (—) is banned in all forms in titles, summaries and any text field. Use commas, colons, parentheses or separate sentences instead.

## Finding sources (best to weakest)

- Légifrance (`legifrance.gouv.fr/jorf/id/JORFTEXT…`) — the promulgated text; also `dossierlegislatif/JORFDOLE…` for the legislative history
- Journal officiel, assemblee-nationale.fr `/dyn/…/dossiers/…` and senat.fr `dossier-legislatif/…` pages (all fetch-verifiable)
- vie-publique.fr is a great INDEX but renders zero content to curl AND to the web-fetch summarizer: use it via search snippets to find things, then cite Légifrance + Sénat/AN instead. It can only ever be a `bot_walled` canonical, never a verifying anchor.
- press.un.org (UN resolutions) is Client-Challenge-walled and returns HTTP 200 with a challenge page — check content, not status. Anchor UN resolutions via elysee.fr or parliamentary sources instead.
- Reputable press ONLY as a supplementary source, never the sole one

More sources is better ("never forget" open-data registry).

## Research strategy (proven on the 2026 batch)

- Start each year from the Sénat index of promulgated laws (`senat.fr/dossiers-legislatifs/lois-promulguees-<year>.html`): it is exhaustive and reliable. Press searches only help rank significance.
- The Sénat index's Légifrance links are legacy `UnTexteDeJorf.do?numjo=NOR` redirects behind a bot wall: do NOT follow them. PRIMARY id-harvesting route for laws: the JO sommaire pages (below), seeded with the issue numbers the Sénat index prints; ~20 error-free harvests per year at scale. One curl of the index regex-harvests every `parue au JO n°X du date` mention, giving the year's full sommaire URL list upfront (interpolation then only serves décrets) — but the line can be truncated mid-sentence in the HTML flow and silently lose the issue number: when a law has none, probe the sommaire at promulgation date + 1-2 days. Légifrance search (`legifrance.gouv.fr/search/all?query=…`) is for décrets and texts with no known JO issue. Web search is the last fallback (session budgets can be exhausted; DuckDuckGo-html is captcha-walled, Mojeek 403s). Always fetch the JORFTEXT page to verify; never guess an id.
- Légifrance (search, `jorf/id/…`, `circulaire/id/…`) is Cloudflare-walled to curl even with a browser UA: verify Légifrance URLs with the agent's web-fetch tool. Keep curl for senat.fr, assemblee-nationale.fr, elysee.fr and conseil-constitutionnel.fr, which fetch fine.
- Légifrance search results are ACTIVELY UNTRUSTWORTHY for base texts: modifying texts dominate the ranking, so it returns modifying décrets, arrêtés modificatifs, a law's "(rectificatif)", or the LATER annulment decision for an annulled décret (a JORFTEXT id from the wrong year is the tell). Every search-derived id MUST be re-fetched and title-checked. The more reliable route: the JO sommaire page `legifrance.gouv.fr/jorf/jo/YYYY/MM/DD/NNNN` (the issue number is printed in the Sénat index as "JO n°X du date") links the exact JORFTEXT of every text of that day. Issue-number interpolation is fragile around holiday clusters: count Mondays AND holidays as a set, expect ±1 drift after (not just around) any holiday cluster, and when a computed guess returns "Pas de contenu disponible", probe the numbers ±1 before falling back to search.
- JO sommaire issue numbers are strictly sequential with no issue most Mondays AND public holidays (no JO on Ascension): anchor on a Sénat-index-provided issue number and count days, skipping both. An off-by-one guess returns a contentless page, not a 404.
- When a décret delegates a figure "fixé par arrêté", the amount lives in the arrêté published in the SAME JO issue: hunt it in that sommaire (search will not surface it).
- For an omnibus-law measure that defeats single-fetch, the consolidated code article (`legifrance.gouv.fr/codes/article_lc/LEGIARTI…`) is a citable supplementary source carrying the figure; harvest the LEGIARTI id from web-search snippets (never guess), then verify.
- Sénat dossier pages no longer expose a greppable "objet du texte" summary: they are good for existence/title/JO issue only; verify content via the Légifrance page or the CC decision.
- The web-fetch summarizer can misread which article of an omnibus text does what (wrong article/date attributions). Cross-check any date/number claim with a targeted fetch of the specific `jorf/article_jo/JORFARTI…` URL, or write the summary without the disputed detail. The same rule covers headline figures from press memory: a number that is not IN a cited source gets dropped from the summary.
- The Sénat "lois promulguées" index OMITS treaty-ratification laws (e.g. loi 2022-1124 autorisant la ratification OTAN). A year with a major geopolitical arc needs an explicit Légifrance search for "autorisant la ratification"/"autorisant l'approbation" laws.
- Election-year months are structurally thin (March-July): the sourcable acts are CC proclamation decisions (they have JORFTEXT ids), government formation décrets and summit decisions, not laws. Do not burn time hunting non-existent legislation there.
- Bulk-verify the Sénat index's dossier-legislatif URLs with one curl `<title>` sweep (server-rendered) instead of fetching them one by one. This sweep is MANDATORY: the index's dossier links are not adjacency-reliable when regex-scraped (the link nearest a law in raw HTML can belong to a neighboring law — 4/26 wrong in the 2013 batch); recover a mismatched title by guessing the pjl/ppl number and re-sweeping.
- Sénat commission-d'enquête report notice pages only carry the table of contents: cite the `*_mono.html` variant, which holds the operative passages.
- `senat.fr/scrutin-public/YYYY/scrNNNN.html` pages are curl-fetchable with exact vote tallies: the anchor for article 35 prolongation-of-intervention votes, paired with the legacy AN cri page. YYYY is the SESSION year, not the calendar year: the 12 July 2011 vote lives under `scrutin-public/2010/` (session 2010-2011).
- The Sénat index prints recurring acts with identical titles (five "Prorogation de l'état d'urgence" dossiers across 2015-2016): before citing, disambiguate the pjl number by grepping the dossier page for the promulgation date.
- When coordinating subagents, the coordinator re-fetches EVERY url itself before writing it into data; a subagent's "verified" claim is not a guarantee.
- `pnpm run verify:sources [year|paths]` (no args = the git-changed month files) machine-verifies every cited source on the curl-able hosts (act numbers from the source title, title-word overlap as fallback) and prints the bot-walled remainder (Légifrance…) as the exact list to verify via web-fetch. Run it before finishing; it does not replace web-fetch verification of the walled list.
- Long omnibus laws (LFI, LFR, LFSS) defeat single-fetch verification: the fetch only surfaces the first chunk and can wrongly report a later-article measure "absent". Verify headline measures via the CC decision page or the Sénat dossier instead of trusting one negative fetch.
- Expect Wikimedia/Légifrance rate limits: pace requests, and on 429 wait about 60 seconds and retry (all scripts are idempotent).

## Non-legislative decisions (often the year's biggest events)

- Circulaires: `legifrance.gouv.fr/circulaire/id/<n>` — the id can be a short number (e.g. `45302`); like all of Légifrance it 403s under curl, use the web-fetch tool.
- Conseil d'État decisions: `conseil-etat.fr/fr/arianeweb/CE/decision/YYYY-MM-DD/NNNNNN` (stable, fetchable). They are the anchor for UNPUBLISHED administrative acts (notes de service, télégrammes): date the entry by the act, cite the CE decision that quotes it. education.gouv.fr's BO is Cloudflare-walled; do not try to fetch it.
- elysee.fr has no search endpoint, but its sitemaps (`sitemap.publication.xml` etc.) are curl-able and grep-able by date AND by keyword to find exact speech/announcement URLs (thematic hunting works: CRIF speech, lettre aux Français, G7 outcome page). The date in an elysee.fr URL path can be off by one vs the event: date the entry from the page content, not the URL. Same-day (or overnight) declarations get near-identical slugs (13 vs 14 November 2015): fetch the content to pick the one carrying the operative announcements.
- elysee.fr also hosts the FULL archive of past presidents' declarations under `/francois-hollande/YYYY/MM/DD/…` and `/nicolas-sarkozy/YYYY/MM/DD/…` (~15k URLs in the sitemap, same date/keyword grep): the citable anchor for pre-2017 announcement decisions (abandon déchéance, Calais, non-candidature). Some archived transcripts are TRUNCATED (a 2012 European Council press conference stops after its opening topic): grep the page for the operative announcement before citing it.
- Élysée conseil-des-ministres compte rendus do not exist in the sitemap for the 2012 era: legacy AN dossier `.asp` pages carry "Extrait du compte rendu du Conseil des ministres du DD/MM/YY" inline — the anchor for CM presentations of bills.
- Sénat rapport synthesis PDFs (`senat.fr/rap/lXX-NNN/lXX-NNN-syn.pdf`, ~4 pages) are curl-fetchable and carry the headline measures of omnibus laws when the Légifrance fetch truncates: harvest the link from the dossier page (`grep 'rap/'`), never guess the rapport number. They do not exist before ~2012: the `_mono.html` full rapport is the pre-2012 equivalent and is grep-rich. For announcement-type plans of that era (plans de rigueur), the commission des finances rapport on the implementing LFR is the standard verified anchor.
- diplomatie.gouv.fr is rot-prone: old communiqué URLs 301 to generic country pages. A diplomatic act with no JO or Élysée trace may end up unsourceable; drop it rather than cite a redirect.
- EU-summit and NATO decisions have no French JO document: the elysee.fr publication page (found via the sitemap date-grep) is the citable French source. consilium.europa.eu hard-403s all automated fetches; nato.int works but 301s to its new URL scheme (`nato.int/en/about-us/official-texts-and-resources/official-texts/…`), cite the redirect target.
- Most ministry sites 403 automated fetches (info.gouv.fr, budget.gouv.fr, interieur.gouv.fr, education.gouv.fr) but ecologie.gouv.fr does NOT: its `presse/…` HTML pages fetch fine and anchor government plans. Prefer the HTML press page over `sites/default/files/…` PDF paths, which rot.
- sante.gouv.fr / solidarites-sante.gouv.fr are captcha-walled and return 200 with HTML even for PDF URLs: check the content type, never the status code. tresor.economie.gouv.fr IS curl-fetchable and hosts official dossiers de presse that economie.gouv.fr 403s (the anchor for France Relance).
- Regulator decisions (Arcep…) may never appear at the JO: the regulator's own communiqué is the citable source. arcep.fr is bot-walled to curl (JS challenge) but fetches via the web-fetch tool.
- Departmental préfecture sites (e.g. guadeloupe.gouv.fr) mirror Matignon discours and dossiers de presse as curl-fetchable pages/PDFs: an official anchor when the canonical page lives on 403'd info.gouv.fr or captcha-walled sante.gouv.fr. prefectures-regions.gouv.fr worked once then turned Cloudflare-walled within a day: re-verify per run. interieur.gouv.fr (incl. mobile.) and cipdr.gouv.fr are walled to curl AND web-fetch. cor-retraites.fr hosts official reports remis au Premier ministre as plain PDFs; lecese.fr and justice.gouv.fr are curl-fetchable and anchor CESE/Chancellerie events. Before promising figures from a mirrored PDF, check it has a text layer: image-only scans are citable as the exact document but not greppable — keep summary facts to what the title and official restatements carry.
- ecologie.gouv.fr press URLs from the 2017-2022 era rot on the live site but survive at `archive-2017-2022.ecologie.gouv.fr/presse/…` (fetches fine): the citable anchor for that period's ministry plans.
- AN written-question PDFs (`assemblee-nationale.fr/dyn/14/questions/QANR5L14QE….pdf`, also on `questions.assemblee-nationale.fr`) are fetch-verifiable official anchors for administrative acts whose canonical pages are walled (Vigipirate 2014, circulaire Guéant abrogation, CICE rates); even a "question retirée" PDF restates the operative facts. AN commission compte-rendu PDFs (`/14/pdf/cr-dvp/…`) anchor removal decisions with figures (écotaxe suspension/résiliation). Legacy AN séance compte-rendus (`/14/cri/…`) carry exact vote tallies for confidence and article 50-1 votes; sessions extraordinaires live under `2013-2014-extra2/…` numbering, found via search, not guessable.
- sgdsn.gouv.fr is curl-fetchable but only hosts the CURRENT Vigipirate plan (2016+): do not cite it for historical refontes.
- AN "déclaration du Gouvernement" compte-rendu pages (`assemblee-nationale.fr/dyn/<leg>/comptes-rendus/seance/…`) are curl-fetchable and anchor announcement-type decisions with no JO trace (e.g. the 5 December 2018 taxe carbone annulation), like the dossier pages do for 49.3s.
- Government reshuffles: one composition décret can carry several stories, and a resignation can be split from the successor's nomination by weeks (acceptance décret vs composition décret). Date the entry by the successor décret and state the resignation date in the summary. The opposite also happens: a single "décret relatif à la composition du Gouvernement" can carry both the fin de fonctions and the successor's nomination — check its articles before hunting a separate cessation décret.
- A 49.3 engagement and its censure-motion outcome are documented inline on the AN dossier page ("Engagement de responsabilité… Motion rejetée"): the dossier page alone sources a 49.3 entry. Brute-forcing scrutin numbers is a dead end (numbers are unrelated to dates).
- Legacy AN dossier pages (`assemblee-nationale.fr/14/dossiers/*.asp`, pre-2017 legislatures) are curl-fetchable and carry the same inline 49.3/censure documentation as `/dyn/` pages, but they are Windows-1252 encoded: decode cp1252 before grepping accented strings ("alinéa 3"), or the grep silently misses.
- Sénat rapports and budget avis (`senat.fr/rap/…`) are curl-fetchable and often restate announcement-type plans with their exact figures (the 21 January 2015 antiterrorist plan lives in the avis on its décret d'avance): a standard anchor when the plan's canonical page is walled.
- CNCDH avis and déclarations are published at the JO with JORFTEXT ids: a fetch-verifiable official anchor that carries the figures for operations whose ministry pages are bot-walled (used for the Calais dismantlement). defenseurdesdroits.fr report PDFs also curl fine.
- Do not assume a conseil-des-ministres communication exists for PM-led announcements (Ségur, France Relance have none): hunt the implementing décret or the official dossier de presse instead. When a CM compte rendu DOES exist on elysee.fr, beware its URL slugs: typos ("jullet") and off-by-one dates are common; verify by page content.
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
- CC decision URLs are case-sensitive and era-INCONSISTENT in both directions (2012 DC/QPC decisions 301 lowercase→uppercase while some 2012 PDR decisions only resolve lowercase): there is no reliable rule — curl-check both casings and cite the one that answers 200.

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
- `relations` — REQUIRED key even when empty (`"relations": []`); the schema rejects a decision without it. Typed links when the decision `amends` / `implements` / `repeals` / is `related` to another registry decision. Removal decisions (abrogation, suspension, abandon, fin d'un dispositif) are registry-worthy in their own right — hunt them as actively as the laws they create. Pick the STRONGEST type that is legally accurate: an act that abrogates or terminates a prior entry uses `repeals`; a suspension, extension (prorogation) or partial rollback uses `amends`; an act executing an announcement or enabling law uses `implements`; `related` is the last resort. Store each pair ONCE, on the acting (usually later) decision — the site derives and renders the reverse direction, so a mirrored edge in the other file double-renders on both pages.

## Validate before submitting

```bash
pnpm run test      # schema, referential integrity, month/filename, ordering
pnpm run check     # full CI-equivalent gate
```

`data/politicians.json` is in standard 2-space JSON style, so a script round-trip produces a clean minimal diff; the decisions month files use inline arrays and must be edited surgically, never round-tripped.

A red data suite means the entry is wrong, not the suite.
