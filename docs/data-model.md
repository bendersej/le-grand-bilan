# Data Model

The registry is a set of JSON files under `data/`. The single owner of the data model is the Zod schema in `src/data/schema.ts`; the JSON Schemas in `schemas/` are generated from it and referenced by each data file's `$schema` key for editor autocomplete.

## Files

| File                          | Schema (generated)                    | Content                                         |
| ----------------------------- | ------------------------------------- | ----------------------------------------------- |
| `data/categories.json`        | `schemas/categories.schema.json`      | Curated category registry (id + fr/en label)    |
| `data/politicians.json`       | `schemas/politicians.schema.json`     | Politician registry (id, name, party, mandates) |
| `data/decisions/yyyy-mm.json` | `schemas/decisions-month.schema.json` | All decisions of one month                      |

Data files use `snake_case` keys. Registry entries (categories, politicians) are ordered lexicographically by id.

## Decision shape

- `id` — globally unique lowercase-dash slug (e.g. `loi-travail-2016`)
- `date` — `yyyy-mm-dd`, must fall inside the file's month
- `title` / `summary` — `LocalizedText`: `fr` required, `en` nullable
- `category_ids` — at least one id from `data/categories.json`
- `politician_ids` — at least one id from `data/politicians.json`, most responsible first
- `sources` — at least one `{ url, title }`; official sources preferred (Légifrance, Journal officiel, vie-publique.fr). The more the better: this is an open-data, "never forget" registry. The `url` MUST point to the EXACT document (e.g. `https://www.legifrance.gouv.fr/jorf/id/JORFTEXT…`), never a homepage or search page — the schema rejects site-root URLs
- `relations` — typed links to other decisions: `amends` | `implements` | `related` | `repeals`

## Validation

`src/data/data.test.ts` (run via `pnpm run test`) enforces:

- every file parses against the Zod schema
- filename ↔ `month` field ↔ decision dates consistency
- globally unique decision ids; unique category/politician ids
- referential integrity: every referenced category, politician, and related decision exists; no self-relations
- lexicographic ordering of the registries
- `schemas/` is in sync with `src/data/schema.ts` (drift check)

## Changing the schema

1. Edit `src/data/schema.ts` (the only place).
2. Run `pnpm run generate:json-schemas` and commit the regenerated `schemas/`.
3. Run `pnpm run test`.

## Adding a decision

1. Open (or create) `data/decisions/yyyy-mm.json` for the decision's month. A new file needs the `$schema` key and the `month` field.
2. Add the decision with at least one official source. Add missing politicians/categories to their registries in the same change (keeping lexicographic order).
3. Run `pnpm run test`.

Planned entry points that automate this via pull requests (submission UI + MCP server): `plans/P001-le-grand-bilan-foundation.md`.
