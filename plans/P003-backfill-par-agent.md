# P003 - Backfill par agent

**Type:** FEATURE
**Status:** In Progress

## Overview

Delegate the sourcing of the registry (decisions back to the start of the Cinquième République in 1958, and later appearances) to an agent instead of manual entry. The agent researches one month at a time, writes `data/decisions/yyyy-mm.json` entries with verified exact source URLs, runs the data suite, and submits the result as a pull request for human review — the same editorial gate as every other contribution.

## Success Criteria

- [ ] A repeatable agent workflow (prompt + guardrails) that produces one month of sourced decisions per run, passing `pnpm run test` before submitting
- [ ] Every claim carries at least one exact official source URL (Légifrance, JO, vie-publique.fr); the agent never submits an entry it could not source
- [ ] Output arrives as a PR (via the P001 Phase 4/5 submission path once live, or direct branch + PR before that)
- [ ] Human review checklist for agent PRs (source spot-check, neutrality of summaries, category/politician mapping)
- [ ] Optionally scheduled (recurring run) once the workflow is trusted

## Implementation Phases

### Phase 1: Agent workflow definition `[TODO]`

Prompt/guardrails, month-selection strategy (newest-first vs chronological), duplicate detection against existing ids, politician/category registry growth rules.

### Phase 2: Pilot months + review checklist `[TODO]`

Run on 2-3 months, review, tighten the prompt; write the reviewer checklist.

### Phase 3: Scale + scheduling `[TODO]`

Recurring runs; monitor PR quality; expand to appearances (P002 data).

## Progress Tracker

- [x] Phase 1: Agent workflow definition
- [x] Phase 2: Pilot months + review checklist (pilot ran on 2026-01..08)
- [ ] Phase 3: Scale + scheduling

## Remaining Work

Phase 3 in progress: 2025 and 2026 done and reviewed. Next: 2024 backwards, one year per run. Add vie-publique dossier links by hand where valuable (not fetch-verifiable by agents).

## Decision Log

| Decision                                                    | Rationale                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Agent output goes through PR review, never direct to master | Sourcing quality and political neutrality need the human editorial gate |

## Risks

- Hallucinated or imprecise sources: the exact-URL schema check catches roots, not wrong documents — the review checklist must include source spot-checks.

## Appendix A: Artifacts

None yet.

## Learnings (batch 2026, ran 2026-08-20)

Outcome: 28 decisions (2026-01..08), 15 politicians captured+curated, 3 new categories (agriculture, defense, sport), every source fetch-verified, all tests green. Coordinator + 4 parallel research subagents (2 months each), ~50 min end to end.

- **Research strategy that worked**: start each year from the Sénat index of promulgated laws (`senat.fr/dossiers-legislatifs/lois-promulguees-<year>.html`), then harvest exact JORFTEXT ids from Légifrance JORF sommaire pages; press searches only to rank significance.
- **Verification**: the coordinator re-fetches EVERY url itself; never trust a subagent's "verified". vie-publique.fr is JS-rendered and cannot be fetch-verified: use it via search snippets, cite Légifrance + Sénat/AN dossiers instead (both fetchable).
- **Wikipedia capture**: ~3 profiles succeed per run before 429; loop capture, sleep 60-75s, retry until no nulls (~10 min per 15 profiles).
- **Mandate-date traps**: short-lived governments (Lecornu I lasted one day with different portfolios); use the date the current portfolio started; check PPL authors are still in office at promulgation (Falorni case).
- **Modeling calls made**: décrets forming one policy act grouped as one decision (AME, suspension retraites); common-name slugs suffixed with the year; PPL author added as décisionnaire only when the law carries their name.
- **Deliberately excluded** (second-tier, verified to exist): lois 2026-630, 2026-725, 2026-795, 2026-797, méga-décret simplification, loi SDIS, loi indivision. The January 49.3/censure sequence has no standalone JO document: folded into the LF 2026 summary.
- Skills updated with all of the above (research strategy, vie-publique caveat, date rule, PPL rule, rate-limit loop, Wikipedia-only profile facts).

## Learnings round 2 (batch 2025, ran 2026-08-20)

Outcome: 34 decisions across all 12 months of 2025, 11 new politicians, new `energie` category (retro-applied to two 2026 decisions), cross-year relations wired (LFSS 2026 chain to the 2023 retraites reform, Bougival/Oudinot, loi spéciale/LF 2026). One stall: the agent hit the 600s silence watchdog mid-run and needed a resume; long waits must be broken into 60s sleeps.

- Sénat index held (62 laws in one fetch) BUT its Légifrance links are bot-walled NOR redirects: the working route is search "n° YYYY-XXX" + legifrance, then fetch-verify the JORFTEXT page. Skill updated.
- 2025's biggest events were non-legislative (circulaire Retailleau, accord de Bougival, chute Bayrou, gouvernements Lecornu): sourcing patterns for circulaires, JO-published accords, AN scrutin pages and nomination décrets are now in the skill.
- 6 of 34 decisions were partially censored by the Conseil constitutionnel: summaries must state what survived; press describes pre-censure texts. Now in the skill.
- Attribution conventions pinned in the skill: caretaker-government portfolio boundaries, naming the real carrier when they left before promulgation, budget-year ids.
- Wikimedia 429 pattern matched the documented loop exactly (3-4 captures per run).

Next: 2024 backwards, one year per run, same review gate.

## HANDOVER STATE (2026-08-20, end of session)

- A 2023 research agent is RUNNING IN THE BACKGROUND at handover time (spawned from this session; it dies with the session). Its output lands UNCOMMITTED in the working tree (data/decisions/2023-*.json, politicians, photos). Next session: if output is present, run the backfill-year review gate (format/check/build/smoketest + independently fetch-verify 4+ sampled sources), record LEARNINGS round 4 here, fold them into the sourcing skills, then the two-commit ship (push = CI deploys). If the tree is clean, relaunch the year with .agents/skills/backfill-year.
- 2023 brief given to the agent: data/decisions/2023-04.json already holds the seed reforme-retraites-2023 (extend around it, never duplicate); Borne ministers largely exist, extend mandates.
- After 2023: 2022, then backwards to 1958, one backfill-year run each.

## Learnings round 3 (batch 2024, ran 2026-08-20)

Outcome: 35 decisions across all 12 months of the dissolution year, 12 politicians added (11 profiles; Santiago blocked by a Wikipedia page without lead image), 4 politicians' mandates extended, `culture` and `numerique` categories, cross-year relations wired into five 2025 entries. Review gate passed (4/4 sampled sources exact).

- CC traps now in the skill: decision numbers carry the saisine year; a dissolution dismisses pending saisines (third outcome besides censored/upheld).
- Non-legislative sourcing extended: dissolution + convocation are two same-day décrets with distinct ids; état d'urgence can end by silent statutory expiry; caretaker months still produce registry-worthy decisions; never-promulgated arcs (PLF 2025) are dated by their conseil-des-ministres presentation.
- Attribution: censured governments have two end dates (PM at successor's nomination, ministers at the next composition décret). Now in the skill.
- Photo-less Wikipedia pages leave `profile: null` by design; documented as the fallback. Open question for later: should the schema allow photo-less profiles?
- Government sites (info.gouv.fr, budget.gouv.fr, interieur.gouv.fr) 403 automated fetches: rely on Légifrance/AN/Sénat/Élysée instead.

Next: 2023 backwards.

## Learnings round 4 (batch 2023, ran 2026-08-21)

Outcome: 33 decisions across all 12 months (32 new + the seed reforme-retraites-2023 extended in place with its CC censure, RIP rejections and censure motion), 17 politicians added, 6 extended, no new categories needed, cross-year relations in both directions (retraites↔2026 suspension, LPM↔2026 actualisation, APER↔PPE3, majorité numérique↔SREN...). Review gate passed (4/4 sampled sources exact). One resume needed: the agent parked on a Monitor again.

- Légifrance's own search (`/search/all?query=`) is now the PRIMARY id-harvesting route (server-rendered, returns JORFTEXT ids); web search demoted to fallback (session budgets exhaust; DDG captcha-walled).
- Conseil d'État arianeweb URLs anchor UNPUBLISHED administrative acts (abaya note de service, Darmanin télégramme); education.gouv.fr's BO is Cloudflare-walled.
- elysee.fr sitemaps are the way to find exact speech/announcement URLs.
- Sénat dossier URLs bulk-verify with one curl title sweep.
- Wikipedia infobox via action API pins deputies' mandate dates; `--data-urlencode` required for accented titles.
- The monitor-parking failure finally has a fix: the backfill-year skill now mandates verbatim "single-run agent, no notification will EVER reach you, in-call foreground sleeps only" wording, plus the literal-ids-not-$VAR rule for backgrounded commands.

Next: 2022.

## Learnings round 5 (batch 2022, ran 2026-08-21)

Outcome: 37 decisions across all 12 months of the double-election year, 13 politicians added (12 profiles; patricia-lemoine null by design, no lead image), no new categories, cross-year relations wired into five 2023 files, candidate 2021 backward relations recorded for the next batch (passe vaccinal chain, boucliers tarifaires, loi harkis ↔ discours de pardon). Review gate passed (5/5 sampled sources exact, format/check/build/smoketest green, 247 pages). No stall this run: the verbatim single-run wording held.

- Légifrance (search, jorf/id, circulaire/id) is curl-403ed even with a browser UA but passes via the agent's web-fetch tool; curl stays for senat/AN/elysee. Skill now says which tool per host.
- The Sénat "lois promulguées" index omits treaty-ratification laws (loi 2022-1124 OTAN): geopolitical years need an explicit "autorisant la ratification" Légifrance search.
- Summit-level decisions (Conseil européen, OTAN) have no JO document: elysee.fr sitemap date-grep gives the citable page; consilium hard-403s; nato.int 301s to a new URL scheme.
- ecologie.gouv.fr is the one fetchable ministry site (HTML presse pages, not the rotting PDF paths).
- Long omnibus laws defeat single-fetch verification (first chunk only): verify headline measures via the CC decision or the Sénat dossier, never trust one negative fetch.
- Election-year months are structurally thin (March-July 2022): proclamations, formation décrets and summits, not laws. Now stated in the skill.
- Unsourceable and accepted as such: réquisitions des raffineries (arrêtés préfectoraux hors JO), accueil de l'Ocean Viking (communiqués only).

Next: 2021.

## Learnings round 6 (batch 2021, ran 2026-08-21)

Outcome: 34 decisions across all 12 months of the Covid/Castex year (couvre-feux, 3e confinement, passe sanitaire, climat et résilience, séparatisme, bioéthique/PMA, France 2030, LFI 2022), 5 politicians added (4 profiles; annick-billon null, no lead image), 3 mandates extended (Montchalin, Dussopt, Borne au Travail), no new categories, cross-year relations wired into four 2022 files plus forward links (fin Barkhane, Beauvau→LOPMI). Review gate passed (5/5 sampled sources exact, 286 pages, format/check/build/smoketest green). One editorial fix at review: "ruée historique sur la vaccination" neutralized to the factual appointment count. No stall.

- JO sommaire page (`jorf/jo/YYYY/MM/DD/NNNN`) added as the second id-harvesting route: Légifrance search sometimes returns only a law's "(rectificatif)" JORFTEXT.
- The web-fetch summarizer misattributes articles/dates in omnibus texts: cross-check via `jorf/article_jo/JORFARTI…` or drop the disputed detail. Now in the skill.
- CC censure specifics extract cleanly by curl + grep of the "Sont contraires à la Constitution" dispositif; conseil-constitutionnel.fr is fully curl-able.
- diplomatie.gouv.fr rots (old communiqués 301 to country pages): the AUKUS ambassador recall was dropped as unsourceable. Élysée URL path dates can be off by one vs the event: date from page content.
- politicians.json round-trips cleanly through scripts; decisions month files (inline arrays) must be edited surgically. Now in the skill.
- Candidate 2020 backward relations recorded in the batch report: 2021 confinement décrets amend décret 2020-1310, prorogation EUS amends loi 2020-1379, loi Rist implements the Ségur de la santé, décret sortie de crise repeals 2020-1310.

Next: 2020.

## Learnings round 7 (batch 2020, ran 2026-08-21)

Outcome: 42 decisions across all 12 months of the first Covid year (49.3 retraites puis abandon, création de l'état d'urgence sanitaire, deux confinements, 25 ordonnances d'un seul conseil des ministres, Ségur, France Relance, loi Avia censurée, 5G, Brexit exclu faute de document français exact), 6 politicians added with full profiles (Buzyn, Castaner, Vidal, Avia, Cédric O, Pietraszewski), 2 mandates extended backwards (Darmanin, Borne), no new categories. All 2021↔2020 candidate relations wired both directions plus loi climat → Convention citoyenne. Review gate passed (6/6 sampled sources exact, 334 pages, format/check/build/smoketest green). No stall.

- Légifrance search declared ACTIVELY untrustworthy for base texts (~30% modifying-text hits): JO sommaire route promoted, mandatory re-fetch of every search-derived id. Sommaire issue-number interpolation trick (sequential, no JO most Mondays) documented.
- sante.gouv.fr/solidarites-sante.gouv.fr captcha-wall returns 200 HTML even on PDF URLs: check content type, not status. tresor.economie.gouv.fr is the fetchable anchor for government plans.
- Regulator acts (Arcep 5G) may never reach the JO: the regulator communiqué is the citable source; arcep.fr needs web-fetch, not curl.
- 49.3 + censure outcomes are inline on AN dossier pages; scrutin-number brute-force is a dead end. PM-led announcements (Ségur, France Relance) have no conseil-des-ministres communication: date by the implementing décret (Ségur entered at the décret CTI du 19 septembre, accords du 13 juillet named in the summary).
- Recurring same-year acts get the month in the id from the start (deux prorogations EUS 2020). Now in the skill.
- Candidate 2019 relations recorded in the batch report (rapport Delevoye, Grenelle violences conjugales, création de la Convention citoyenne, loi biodiversité 2016 pour les néonicotinoïdes).

Next: 2019.

## Learnings round 8 (batch 2019, ran 2026-08-21)

Outcome: 37 decisions across the gilets-jaunes/grand-débat year (prélèvement à la source, grand débat, anticasseurs + censure, Notre-Dame, PACTE + RIP ADP, taxe GAFA, école de la confiance, fonction publique, énergie-climat, Grenelle violences conjugales, rapport Delevoye + présentation CESE, LOM, LFI 2020), 5 politicians added with full profiles (Belloubet, de Rugy, Riester, Delevoye, Schiappa), 3 mandates extended backwards (Borne aux Transports, Lecornu, Dussopt), no new categories, all planned 2020 relations wired. Review gate passed (6/6 sampled sources exact, incl. the COR PDF and lecese.fr; 380 prerendered pages, 285 decisions, 93 politicians after ship). No stall.

Shipped alongside: the missing_sources policy (registry now surfaces unsourceable decisions in red) with its first three entries (réquisitions raffineries, Ocean Viking, rappel des ambassadeurs AUKUS avec l'URL MEAE expirée en preuve + ajout de Jean-Yves Le Drian), and the bot_walled source flag (canonical captcha-walled URLs recorded but not rendered, pending human verification).

- zsh does not word-split unquoted $VAR: `capture:profiles $ids` silently passes one argument. The literal-ids rule now covers ALL commands, not just backgrounded ones.
- JO sommaire counting skips public holidays as well as Mondays.
- Préfecture sites (prefectures-regions.gouv.fr, departmental .gouv.fr) mirror Matignon discours/dossiers de presse and are curl-fetchable: the anchor for PM announcements whose canonical page is bot-walled. cor-retraites.fr for official reports, lecese.fr and justice.gouv.fr fetch fine.
- elysee.fr sitemap grep works by keyword, not just date.
- The Sénat index omitted a treaty-ratification law again (Aix-la-Chapelle): the standing explicit-search rule is confirmed.
- Playwright probe of the bot walls: headless Chromium gets vie-publique.fr to render (with cookie-banner handling it could machine-verify it), but sante.gouv.fr (Cegedim WAF "Request Rejected") and info.gouv.fr/consilium (Cloudflare challenge) block it. Human verification stays the plan for bot_walled sources.

Next: 2018, then 2017 (extend around the 2017-09 seed, never duplicate it).

## Learnings round 9 (batch 2018, ran 2026-08-21)

Outcome: 38 decisions across Philippe year 2 and the gilets-jaunes autumn (abandon NDDL, Parcoursup, ratification des ordonnances travail reliée au seed 2017-09, frappes Syrie, 80 km/h, RGPD, pacte ferroviaire, Schiappa, asile-immigration, EGalim, ELAN, fake news + CC, moratoire taxe carbone, allocution du 10 décembre, loi MUES, LFI 2019), 5 politicians added (Hulot, Collomb, Flessel, Guillaume, Girardin), Denormandie extended, no new categories, no missing_sources/bot_walled needed. Cross-year relations wired into seven 2019 files and the 2017-09 seed. Review gate passed (5/5 sampled sources exact incl. the composition décret and the AN compte rendu; 423 pages, 323 decisions, 98 politicians). No stall.

- JO sommaire promoted to THE primary harvesting route for laws (search demoted to décrets): ~20 error-free harvests when seeded with the Sénat index's printed issue numbers.
- prefectures-regions.gouv.fr turned Cloudflare-walled a day after round 8 declared it reliable: bot walls move, mirror claims need per-run re-verification (skill updated with that caveat). interieur.gouv.fr and cipdr.gouv.fr are fully walled: the ZAD evacuation, PSQ and plan radicalisation stayed out (candidates for missing_sources or a human pass).
- archive-2017-2022.ecologie.gouv.fr preserves the era's rotted ministry press URLs; AN "déclaration du Gouvernement" compte-rendu pages anchor no-JO announcements.
- Reshuffle mechanics: resignation acceptance and successor nomination can be separate décrets weeks apart; date by the successor décret, name the resignation date in the summary.
- Headline figures absent from the cited source are dropped (two press-memory numbers died that way). Now a general rule in the skill.

Next: 2017.

## Learnings round 10 (batch 2017, ran 2026-08-21)

Outcome: 32 new decisions spanning fin de quinquennat Hollande (égalité et citoyenneté, prescription pénale, sécurité publique, devoir de vigilance, Fessenheim avec son annulation CE), the transition (proclamation CC, gouvernements Philippe I/II) and Macron year 1 (plan climat, EGA/Rungis, Versailles/Sorbonne, lois confiance, SILT + fin de l'état d'urgence, baisse APL, gel des contrats aidés, hydrocarbures, LFSS/LFI 2018). The 2017-09 seed was extended without a single deleted line. 9 politicians added with full profiles (Cazeneuve, Le Roux, Urvoas, Rossignol, Kanner, Royal, Mézard, Travert, Potier), no new categories. Second missing_sources entry: gel-contrats-aides-2017 (never_published, anchored by the Sénat rapport r17-321, sources + missing_sources coexisting). Review gate passed (6/6 sampled sources exact incl. the CC proclamation with vote counts and the archived plan climat page; 464 pages, 355 decisions, 107 politicians). No stall.

- Décrets that delegate a figure "fixé par arrêté": the amount lives in the same JO issue's arrêté (baisse APL). Search surfaces the wrong-year arrêté; the sommaire resolves it. Now in the skill.
- Annulled décrets: search returns the annulment-era JORFTEXT (wrong-year id = the tell). Now in the skill.
- `codes/article_lc/LEGIARTI…` consolidated articles are citable carriers for omnibus figures (11 vaccins). Now in the skill.
- Sénat rapports d'information are curl-fetchable anchors for never-published administrative acts, pairing with missing_sources. Sénat dossier pages lost their greppable "objet du texte". Both in the skill.
- elysee.fr CM compte-rendu slugs carry typos ("jullet") and date offsets: verify by content. In the skill.
- Election/transition thinness extends beyond March-July (April 2017 = 1 decision): the 2-6 floor yields to significance, stated in the backfill skill.

Corpus now covers 2017-2026 continuously (355 decisions). Next: 2016 backwards.

## Learnings round 11 (batch 2016, ran 2026-08-21)

Outcome: 31 new decisions across all 12 months of the fin-de-quinquennat Hollande year (loi santé, Claeys-Leonetti, gaspillage alimentaire, quatre prorogations de l'état d'urgence + abandon de la déchéance, la loi travail seed intacte reliée à son 49.3, biodiversité, République numérique, fichier TES, démantèlement de Calais, non-candidature de Hollande, gouvernement Cazeneuve, Sapin 2, LFI 2017 avec le prélèvement à la source), 9 politicians added with full profiles, 5 extended backwards (Macron à l'Économie 2014-2016, Cazeneuve à l'Intérieur, Le Drian à la Défense...), no new categories, cross-year relations wired both directions into 2017/2019/2020/2022/2026 files. Review gate passed (7/7 sampled sources exact across Légifrance, Sénat, CC and Élysée; 506 pages, 388 decisions, 116 politicians). One editorial neutralization at review ("déchirements politiques" → "débats", FR + EN). No stall.

- First `bot_walled` entries ever shipped (2 interieur.gouv.fr archive URLs on the Calais operation), which exposed a smoketest gap: it expected EVERY source URL in the rendered panel while bot_walled sources are unrendered by design. Fixed in `scripts/smoketest.ts` at the gate.
- elysee.fr hosts the FULL archive of past presidents' declarations (`/francois-hollande/YYYY/MM/DD/…`, ~15k sitemap URLs): the anchor for pre-2017 announcement decisions. Now in the skill.
- Legacy AN dossier pages (`/14/dossiers/*.asp`) are curl-fine but Windows-1252: decode cp1252 before grepping accents. Now in the skill.
- CNCDH avis published at the JO (with figures) + defenseurdesdroits.fr PDFs anchor operations whose ministry pages are bot-walled. Now in the skill.
- The Sénat index prints recurring acts with identical titles (five prorogation dossiers): disambiguate by promulgation date on the dossier page. Now in the skill.
- Confirmed as documented: JO issue counting skips holidays, Wikimedia 3-captures-per-run throughput.
- Flagged, untouched: `myriam-el-khomri` mandate ends 2017-05-10 while the other Cazeneuve ministers end 2017-05-17 — check the fin-de-fonctions décret in a later pass.
- Candidate 2015 backward relations recorded in the batch report (COP21, déclaration + 1re prorogation de l'état d'urgence de novembre 2015, Congrès de Versailles, loi Rebsamen, loi renseignement, nomination El Khomri).

Next: 2015.

## Learnings round 12 (batch 2015, ran 2026-08-21)

Outcome: 35 decisions across all 12 months of the attentats/COP21 year (Sentinelle, 13 régions + NOTRe, 49.3 loi Macron + censure prud'homale, réforme du collège, loi renseignement + 2015-713 DC, transition énergétique, Rebsamen, état d'urgence + Congrès de Versailles + 1re prorogation, surveillance internationale, adoption de l'accord de Paris, LFSS/LF 2016), 6 politicians added with full profiles (Fabius, Vallaud-Belkacem, Rebsamen, Lebranchu, Pellerin, Pau-Langevin), 2 extended backwards, no new categories. All planned 2016↔2015 relations wired both directions. Review gate passed (7/7 sampled sources verified; the Sentinelle entry's 2015-01-12 date is carried verbatim by the cited Toulon speech, "son niveau lundi lorsque j'ai pris la décision"; 547 pages, 423 decisions, 122 politicians). No stall, no neutrality edits needed.

- JO issue-number interpolation around holiday clusters: probe ±1 on a contentless page before falling back to search. Now in the skill.
- elysee.fr same-day/overnight declarations carry near-identical slugs (13 vs 14 novembre): content-fetch to pick the operative one. Now in the skill.
- Sénat budget avis (`senat.fr/rap/…`) restate announcement-type plans with exact figures: standard anchor when the canonical page is walled. Now in the skill.
- vie-publique.fr renders zero content to web-fetch as well as curl: only ever a `bot_walled` canonical, never an anchor. Skill caveat hardened.
- Wikimedia capture loop must count `profile: null` among the batch's OWN ids: pre-existing photo-less politicians spin an unfiltered loop forever. Now in the decisionnaires skill.
- Operator feedback folded into the skill: removal decisions (abrogation, suspension, abandon, fin d'un dispositif) are first-class registry entries, and an act undoing a prior entry MUST use the `repeals` relation, not `related`. Corpus baseline at round 12: 215 related / 37 implements / 24 amends / 1 repeals — an audit of the 215 `related` links for mislabeled `amends`/`repeals` is queued as follow-up.
- Dropped as unsourceable, candidates for a human pass: plan contre le racisme et l'antisémitisme (17 avril 2015, gouvernement.fr 403), comité interministériel égalité et citoyenneté, conférence sociale d'octobre, accord PPCR.
- Candidate 2014 backward relations recorded in the batch report (MAPTAM/réforme territoriale, gouvernements Valls I/II + nomination Macron, LPM 2014-2019, loi Cazeneuve terrorisme, Vigipirate 2014, annonce de la panthéonisation).
- Note for a later pass: francois-rebsamen also held a 2024-2025 Bayrou-government mandate, out of the 2015 batch's scope.

Next: 2014.

## Relation audit (ran 2026-08-21, between rounds 12 and 13)

The corpus stored 76 relation pairs on BOTH sides while the site derives incoming relations, so mirrored pairs double-rendered "Liée à" on both decision pages; and removal/execution links were mostly filed as `related`. A scripted pass over 2017-2026 files (2015/2016 excluded: the 2014 agent edits them concurrently) applied 12 retypes (covid décret chains to `amends`/`repeals`, PPE/Fessenheim/OTAN to `implements`), 2 added typed edges (fin Barkhane implements its annonce, LOPMI implements the Beauvau) and 41 mirror deletions. Distribution moved from 215 related / 37 implements / 24 amends / 1 repeals to 162 / 42 / 30 / 4. Both sourcing skills now pin the strongest-accurate-type rule (abrogation/termination = `repeals`, suspension/prorogation = `amends`) and the store-once convention.

Follow-ups:

- **At the 2014 review gate**: run the same dedup/retype pass on the 37 remaining mirrors (all involve 2015/2016 files), including the état d'urgence prorogation chain to `amends` and `demantelement-jungle-calais-2016` implements its annonce; then add a data-suite test asserting no relation pair is stored on both sides.
- **UI (deliberately deferred)**: surfacing additions vs removals vs amendments (broadly) on the timeline and decision pages would help reading; do nothing for now.

## Learnings round 13 (batch 2014, ran 2026-08-21)

Outcome: 38 decisions across all 12 months of the Valls-nomination year (retraites Touraine, MAPTAM, non-cumul, CPF, Hamon, ALUR, Florange, pacte de responsabilité + ses collectifs budgétaires censurés, réforme ferroviaire, réforme pénale Taubira avec la suppression des peines planchers, Barkhane, Valls I/II + nomination Macron, Chammal, taxis/VTC, abandon de l'écotaxe + résiliation Ecomouv', loi Cazeneuve, LO destitution, LF 2015), 9 politicians added with full profiles, 5 mandates extended backwards to 2012. First removal decisions sourced under the new rule (écotaxe, peines planchers, both with exact JO/AN anchors). Review gate passed (8/8 sampled sources verified incl. the CE ordonnance Dieudonné, the écotaxe audition PDF decompressed and keyword-checked, and the peines-planchers abrogation confirmed at article level; 595 pages, 462 decisions, 131 politicians). No stall, no neutrality edits.

- The deferred relation cleanup ran corpus-wide at this gate: 6 retypes (état d'urgence prorogation chain to `amends`, démantèlement de Calais to `implements`), 55 mirror edges deleted (the 37 deferred pairs plus the 2014 batch's own mirrors). Final distribution: 139 related / 43 implements / 35 amends / 4 repeals. The data suite now enforces single-side storage (24th test).
- `relations` is a required key (empty array allowed): now stated in the entry checklist.
- The Sénat index regex-harvests every "parue au JO n°X" in one curl: interpolation only serves décrets. Now in the skill.
- AN QE PDFs, commission compte-rendu PDFs (removal-decision figures) and legacy `/14/cri/` vote tallies are fetch-verifiable anchors; sgdsn.gouv.fr only hosts the current Vigipirate. All in the skill.
- Commons Artist credits over 120 chars are license blobs: `capture:profiles` now nulls them (site falls back to "Wikimedia Commons").
- Unsourceable, candidates for a human pass: suspension des Mistral (nov. 2014, communiqué absent de l'archive elysee.fr), interdictions de manifestations de juillet 2014 (arrêtés préfectoraux non publiés).
- Candidate 2013 backward relations recorded in the batch report (suspension initiale de l'écotaxe, LPM 2014-2019).

Corpus now covers 2014-2026 continuously (462 decisions). Next: 2013.

## HANDOVER STATE (2026-08-21, end of session)

- Working tree CLEAN, everything committed and pushed through `[P003] docs: round-10 learnings`; CI green; live site verified (spot checks incl. discours-sorbonne-2017 and the red missing_sources caveats). No background agent is running.
- Shipped this session: batches 2022→2017 (217 decisions, six review gates, learnings rounds 5-10 folded into the skills), the `missing_sources` model (3 entries live: réquisitions raffineries, Ocean Viking, rappel AUKUS avec URL MEAE expirée) and the `bot_walled` source flag (no entries yet), the month/year date picker on timeline markers, and the static-header/scroll-container + mobile marker UI fixes ([P001] commits).
- Next backfill run: 2016 (backfill-year skill; scale marks updated; extend around the 2016-08 loi-travail seed). Candidate 2016 relations are listed in Learnings round 10; candidate missing_sources/human-pass items in round 9 (ZAD, PSQ, plan radicalisation) plus Brexit-via-EUR-Lex and Ouagadougou (anchors the 2020 restitution law).
- P002 marked Completed this session; its follow-ups (INA media source, appearance `t=` offsets, CI-side R2 asset check, EN profile summaries) are carried here under the appearances expansion.
- Watch item (P001): the registry ships fully in the client bundle; at 355 decisions and growing toward 1958, route-level data splitting is due soon.
