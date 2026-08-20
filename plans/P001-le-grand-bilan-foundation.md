# P001 - Le Grand Bilan foundation

**Type:** INFRASTRUCTURE + FEATURE
**Status:** In Progress

## Overview

Build "Le Grand Bilan" — Qui a fait quoi. Quand. — a static, open-data registry of French political decisions since May 2012 (start of François Hollande's term), aimed at more visibility for the May 2027 elections. The site is statically prerendered, the data lives in versioned JSON files, and every contribution (UI or MCP) becomes a reviewed pull request whose merge deploys the site.

## Success Criteria

- [x] Repo scaffolded: TanStack Start + Cloudflare Workers, pnpm, strict TS, vitest, oxlint, oxfmt
- [x] Data model owned by a Zod schema; JSON Schemas generated; seed data with real, sourced decisions; validation suite (schema, referential integrity, month/filename consistency, drift check) green
- [x] CI workflow: checks on PRs, deploy to Cloudflare on merge to master
- [ ] Site renders the registry: timeline by year/month, decision detail pages, politician pages, category filtering, FR/EN language toggle
- [ ] Submission UI: a form that validates against the schema, passes Turnstile, and opens a PR via `/api/submissions`
- [ ] MCP server at `/mcp` exposing a `submit_decision` tool that opens the same kind of PR
- [ ] Abuse protection live: Turnstile on the UI, Worker rate limiting on `/api/submissions` and `/mcp`
- [ ] First deploy reachable on workers.dev; merge-to-master deploy proven end to end

## Implementation Phases

### Phase 1: Scaffold (DONE)

Cloudflare TanStack Start template, prerender enabled (`vite.config.ts`), France palette tokens (`src/styles.css`), FR branding on routes/components, pnpm + oxlint + oxfmt + vitest wiring, docs routing (`.claude/CLAUDE.md`, `docs/`).

### Phase 2: Data model + seed (DONE)

`src/data/schema.ts` (Zod v4, snake_case data keys), `scripts/generate-json-schemas.ts`, `schemas/` generated, seed registries + 3 real sourced decisions (loi Travail 2016, ordonnances Travail 2017, réforme des retraites 2023), `src/data/data.test.ts`.

### Phase 3: Site UI

- **Design direction (operator wireframe: `artifacts/plan-001-timeline-wireframe.png`): MINIMAL changelog / timeline. The data is the interface.**
  - One vertical timeline rail; year as large heading, month as subheading beneath it
  - Per decision: category chip(s) + politician chip(s) on the left, decision title + short description + inline source links on the right
  - No cards, no shadows, no glassmorphism: strip the template's island-shell aesthetic (`.island-shell`, `.feature-card`, hero gradients, `.demo-*` styles) as part of this phase — typography and whitespace only, France palette kept for accents
- Data loading: import the JSON files at build time (route loaders), derive year/month index
- Routes: `/` timeline (per year, per month), `/decisions/$decisionId`, `/politiciens/$politicianId`, `/categories/$categoryId`, about
- Category filter UI; relation threads on decision pages ("modifie / abroge / applique")
- FR/EN toggle rendering `LocalizedText` (fr required, en nullable → fall back to fr)
- No component library unless the Phase 4 form demonstrably needs one (the wireframe needs none)

### Phase 4: Submission UI + `/api/submissions`

- Worker route handling POST: Zod-validate the submission, verify Turnstile server-side, rate limit
- PR creation via GitHub REST (contents + pulls) with `GITHUB_PR_TOKEN` (fine-grained PAT, dedicated bot account recommended, scoped to this repo)
- Branch naming + PR body template for submissions; inserts into the right `yyyy-mm.json`, creates missing politicians/categories as part of the PR
- Form page reusing the schema for client-side validation

### Phase 5: MCP server at `/mcp`

- Streamable HTTP MCP server on the same Worker (Cloudflare `agents` SDK)
- `submit_decision` tool sharing the exact validation + PR-creation path with Phase 4 (single owner)
- Rate limiting; no Turnstile (not applicable to MCP) — strict schema validation + rate limits are the guard

### Phase 6: Launch checklist

- Create the GitHub repo (`le-grand-bilan`), push, set Actions secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- Prove merge → deploy end to end on workers.dev
- Branch protection on master (require CI green)
- Custom domain decision + `routes` in `wrangler.jsonc`
- Backfill campaign: decisions from 2012-05 onward (own follow-up plan)

## Progress Tracker

- [x] Phase 1: Scaffold
- [x] Phase 2: Data model + seed
- [x] Phase 3: Site UI (done except the FR/EN language toggle — see Remaining Work)
- [ ] Phase 4: Submission UI + API
- [ ] Phase 5: MCP server
- [ ] Phase 6: Launch checklist

## Remaining Work

- Phase 3 leftover: FR/EN language toggle (site currently renders `fr` only; `en` fields are captured in data but not displayed).
- Registry ships fully in the client bundle (`src/data/registry.ts`); acceptable now, revisit with route-level data splitting once backfill grows the corpus.
- Phase 4 is next. GitHub repo does not exist yet (Phase 6 blocks end-to-end merge→deploy proof).

## Decision Log

| Decision                                                         | Rationale                                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| TanStack Start over Astro                                        | React-first, official Cloudflare prerender support (since Dec 2025), one Worker hosts site + future MCP/API        |
| Tailwind v4 + (later) shadcn/ui, France palette                  | DSFR is legally reserved to the French State (Etalab license terms forbid non-state use); palette inspiration only |
| Single Worker                                                    | One deploy, one config, shared PR-creation code and secrets                                                        |
| Fine-grained PAT for PR creation                                 | Simplest; dedicated bot account recommended; GitHub App possible later                                             |
| GitHub Actions + wrangler deploy (not Workers Builds)            | Deploys gated on green CI, one automation home                                                                     |
| Zod as schema source of truth, JSON Schemas generated            | Matches TS conventions; `$schema` gives contributors editor validation                                             |
| Sources: min 1 required, unbounded                               | Open-data / "never forget" registry; credibility before the 2027 election                                          |
| Politicians/categories as separate registries with id references | Enables per-politician/category pages, prevents typo fragmentation, CI-checkable                                   |
| Typed decision relations (amends/implements/related/repeals)     | Captures the real legislative story; renders as history threads                                                    |
| Turnstile + rate limiting                                        | PR spam would burn reviewer time; MCP gets rate limits + validation only                                           |
| FR + EN (`LocalizedText`: fr required, en nullable)              | International visibility; en falls back to fr when absent                                                          |
| pnpm, single package                                             | One Worker, one app; no publishable package yet                                                                    |
| Repo name `le-grand-bilan`                                       | Site name, lowercase-dash convention                                                                               |
| Minimal changelog design, no boxes/shadows                       | Operator wireframe; the data is the product — typography-led timeline, template island aesthetic goes              |
| Spectral (headings) + Inter (body)                               | Marianne is State-reserved; Spectral is by a French foundry (Production Type) on Google Fonts, Inter for data      |
| Sources must cite the exact document URL                         | Operator requirement; schema rejects site-root URLs, seed uses direct Légifrance jorf/id links                     |
| Limited markdown in text fields (bold, italic, https links)      | Highlights each decision's meaningful keywords; parsed to React elements, never raw HTML (PR-sourced content)     |
| Smoketest derives expectations from `data/`                      | Review finding: hand-listed markers were shell-satisfiable; registry-driven assertions scale with backfill         |

## Risks

- Political neutrality: the registry must stay factual and sourced; PR review is the editorial gate — reviewer guidelines should be written before opening submissions publicly.
- PR spam despite Turnstile/rate limits: fine-grained PAT is scoped to this repo only, so blast radius is PRs, not code; branch protection keeps master safe.
- oxfmt is beta: pin the version; formatting drift handled by `--check` in CI.
- TanStack Start prerender on Workers is recent (Dec 2025): pin working versions; fall back to `vite build` static output serving if a regression lands.

## Appendix A: Artifacts

- `artifacts/plan-001-timeline-wireframe.png` — operator wireframe for the Phase 3 timeline: vertical rail, year/month headings, category + politician chips, title + short description + inline source links.
