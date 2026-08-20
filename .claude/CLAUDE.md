# Le Grand Bilan

**Qui a fait quoi. Quand.** — Le registre ouvert des décisions politiques françaises, mois par mois, depuis mai 2012. Plus de visibilité pour les élections de mai 2027.

A static, open-data changelog of decisions applied or validated by French politicians: each decision is dated, categorized, linked to the politicians responsible, backed by at least one official source (the more the better), and optionally related to other decisions (amends / implements / repeals / related). Contributions arrive as pull requests — from the site's submission UI or from the public MCP server — and merging to master deploys the site.

**Simplicity is a write-time gate, not an aspiration.** Before writing code that introduces ANY new construct — a function, type, hook, flag, parameter, file, branch, layer, or abstraction — run this check and abort the construct if it fails:

1. **Can existing code do this?** Name the existing owner and why it can't be changed or extended instead. No crisp answer → don't add the construct; change what's there.
2. **Is this the smallest change that fully meets the goal?** The right change is usually net-negative or flat. A diff that only ADDS is a smell — re-derive.
3. **Task or hypothetical?** Build only for what is in front of you, never for a problem that may never arise.

**Leave the campground cleaner than you found it.** De-duplicate as part of whatever you touch: when your change sits next to copy-pasted types, schemas, or logic, consolidate to a single owner and import from it. Keep cleanup proportional and low-risk; flag larger refactors for permission instead of smuggling them in.

**Define it once, derive the rest.** Every type, schema, enum, or vocabulary is defined ONCE at a single owner; everywhere else derives from it (`import`, `typeof`, `keyof`, `infer`, `satisfies`). The data model's single owner is `src/data/schema.ts` (Zod); the JSON Schemas in `schemas/` are GENERATED from it (`pnpm run generate:json-schemas`), never hand-edited.

**Documentation is updated PROACTIVELY, as part of the change itself.** When code, data model, infrastructure, or project structure change, update the file that owns that fact in the same change — never defer it to a later doc pass.

## Documentation Routing

This file is a **router**: rules that bind on every edit stay inline; reference material lives in `docs/` behind one-line hooks. Two rules keep it working:

- **Plain relative paths only for routed content — never `@` references.** A router pointer is `docs/topic.md`, read on demand.
- **One home per fact.** Never restate one tier in another; point to it.

Root reference docs:

- `docs/data-model.md` — the data files, the Zod schema owner, validation rules, how to add a decision
- `docs/deployment.md` — Cloudflare Workers architecture, CI/CD, required secrets

## Always-binding pointers

- **Touching `data/`, `schemas/`, or `src/data/schema.ts`**: run `pnpm run test` — the data suite enforces schema conformance, referential integrity, and JSON Schema drift. Schema changes MUST regenerate `schemas/` (`pnpm run generate:json-schemas`). Details: `docs/data-model.md`.
- **Every decision needs at least one official source URL pointing to the EXACT document** (e.g. a Légifrance `jorf/id/JORFTEXT…` page), never a homepage or search page. This is an open-data, "never forget" registry: unsourced entries and site-root URLs are rejected by schema.
- **The DSFR (French State design system) is legally reserved to the French State** — never add `@gouvfr/dsfr` or its assets (Marianne font included). The France palette lives as tokens in `src/styles.css`.
- **Content is French-first**: every `LocalizedText` has a required `fr` and a nullable `en`.
- **New data structures prefer lexicographic order** (registry entries ordered by id — enforced by tests).

## Repository Structure

```
lgb/                     (repo name: le-grand-bilan)
├── .github/workflows/   CI (tests, lint, format, typecheck, build) + deploy on merge to master
├── data/                The registry (open data)
│   ├── categories.json  Curated category registry
│   ├── politicians.json Politician registry (mandates with roles + dates)
│   └── decisions/       One file per month: yyyy-mm.json
├── docs/                Root reference docs (routed from this file)
├── plans/               Implementation plans (index: plans/README.md)
├── schemas/             GENERATED JSON Schemas — never hand-edit
├── scripts/             One-shot scripts (JSON Schema generation)
└── src/
    ├── components/      Shared React components
    ├── data/            schema.ts (Zod owner of the data model) + data validation tests
    └── routes/          TanStack Start file-based routes
```

### Core Stack

| Area    | Tech                                                                                   |
| ------- | -------------------------------------------------------------------------------------- |
| Site    | TanStack Start (React 19, Vite), static prerender, Tailwind v4                         |
| Data    | JSON files validated by Zod v4, generated JSON Schemas                                 |
| Hosting | Cloudflare Workers (single Worker: static assets + future `/mcp` + `/api/submissions`) |
| CI      | GitHub Actions: vitest, oxlint, oxfmt, tsc, build; wrangler deploy on master           |

## Commands

Package manager is **pnpm** (pinned via `packageManager`).

- `pnpm run dev` — dev server on port 3000
- `pnpm run check` — routes + typecheck + lint + format check + tests (what CI runs)
- `pnpm run test` — vitest (data validation suite)
- `pnpm run generate:json-schemas` — regenerate `schemas/` from `src/data/schema.ts`
- `pnpm run smoketest` — assert the prerendered pages contain their expected content (needs a prior `pnpm run build`; CI runs it after every build)
- `pnpm run deploy` — build + `wrangler deploy` (CI does this on merge to master)

## Workflow

- Plans live in `plans/` (`plans/README.md` is the index, `plans/template.md` the template). Work on a plan happens on a branch named after the plan file; commits use `[P0xx] <type>: <message>`.
- When all tasks are complete and nothing is left to do, run a thorough review of the modified code against the write-time simplicity gate above before finishing. Do this proactively: it is read-only analysis with zero risk.

## AGENTS.md (cross-tool compatibility)

`AGENTS.md` at the repo root is a symlink to this file so other coding agents read the same instructions. `CLAUDE.md` is the source of truth. When creating a new `.claude/CLAUDE.md`, create the symlink next to its parent `.claude/` directory:

```bash
ln -s .claude/CLAUDE.md AGENTS.md
```
