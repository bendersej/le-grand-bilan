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
