---
name: backfill-year
description: Orchestrate a one-year sourcing batch for the registry, launch the research agent, review its output, record learnings, and refine the sourcing skills.
---

# Backfill a year

The repeatable loop that has produced the 2026 and 2025 batches. One year per run, going backwards to the beginning of the Cinquième République (1958). Two roles: the ORCHESTRATOR (launches, reviews, ships) and the RESEARCH AGENT (sources, validates, reports).

## 1. Launch

Spawn ONE research agent for the year with a prompt that mandates, in this order:

1. Read `sourcing-decisions` and `sourcing-decisionnaires` (they carry every accumulated learning) plus `docs/data-model.md` and a recent month file as format reference.
2. Scope: 2-6 significant decisions per month, quality and sourcing over volume; laws AND non-legislative pivots (governments, dissolutions, censures, accords: the sourcing skill says how).
3. Check `data/politicians.json` before adding people; EXTEND existing politicians' mandates for the year's portfolios rather than duplicating.
4. Cross-year relations both directions (edit adjacent years' files when the relation belongs there).
5. Validate with `pnpm run test` until green; never build, deploy, or commit.
6. Work continuously; never wait silently more than ~5 minutes (the watchdog kills silent stretches); break long waits into 60s `node -e "setTimeout(()=>{}, 60000)"` sleeps.
7. Report: counts per month, politicians/categories added or changed, the unsourceable, and a LEARNINGS section on what the skills still get wrong.

If the agent stalls or dies, resume it with "inspect your own partial work first (git status, existing month files), then continue without duplicating".

## 2. Review gate (orchestrator, before anything ships)

- Run `pnpm run format && pnpm run check && pnpm run build && pnpm run smoketest` on the full tree.
- Independently re-verify a random sample of at least 4 source URLs across different months (fetch each; number, date and topic must match the entry). One mismatch = audit the whole batch.
- Skim 2-3 summaries for neutrality and the markdown/em-dash rules (the data suite enforces the mechanical parts).

## 3. Learnings loop (the point of doing this yearly)

- Append a "Learnings round N" section to `plans/P003-backfill-par-agent.md`: outcome numbers, what worked, what failed, conventions decided.
- Fold every actionable learning INTO the two sourcing skills immediately: the next year's agent must never rediscover a documented pitfall.

## 4. Ship

- Commit in two: `[P003] feat: <year> batch, N sourced decisions, M politician profiles` (data/, public/media/), then `[P003] docs: round-N learnings in plan and sourcing skills`.
- Deploy, push, and verify one new entry on the live site.

## Known scale marks (update as they move)

- A year takes the agent roughly 25-50 minutes; Wikimedia caps profile captures at ~3-4 per run (60-75s retry loop).
- Corpus so far: 2024? / 2025 (34) / 2026 (28) + seed years.
