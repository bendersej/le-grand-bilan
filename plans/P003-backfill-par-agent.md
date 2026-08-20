# P003 - Backfill par agent

**Type:** FEATURE
**Status:** Backlog

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

- [ ] Phase 1: Agent workflow definition
- [ ] Phase 2: Pilot months + review checklist
- [ ] Phase 3: Scale + scheduling

## Remaining Work

Not started. Depends on the GitHub PR path (repo now exists) and benefits from P001 Phases 4-5.

## Decision Log

| Decision                                                    | Rationale                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Agent output goes through PR review, never direct to master | Sourcing quality and political neutrality need the human editorial gate |

## Risks

- Hallucinated or imprecise sources: the exact-URL schema check catches roots, not wrong documents — the review checklist must include source spot-checks.

## Appendix A: Artifacts

None yet.
