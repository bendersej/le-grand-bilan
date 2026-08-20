# P003 - Backfill par agent

**Type:** FEATURE
**Status:** In Progress

## Overview

Delegate the sourcing of the registry (decisions since 2012-05, and later appearances) to an agent instead of manual entry. The agent researches one month at a time, writes `data/decisions/yyyy-mm.json` entries with verified exact source URLs, runs the data suite, and submits the result as a pull request for human review — the same editorial gate as every other contribution.

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
