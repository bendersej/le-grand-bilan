# Deployment

## Architecture

One Cloudflare Worker (`wrangler.jsonc`, name `le-grand-bilan`) serves everything:

- **Static site** — TanStack Start with build-time prerendering (`prerender` in `vite.config.ts`); routes are emitted as static assets served by the Worker.
- **`/api/submissions`** (planned, plans/P001 phase 4) — accepts a decision submission from the site UI, validates it against the Zod schema, verifies Cloudflare Turnstile, and opens a GitHub pull request using a fine-grained PAT stored as a Worker secret.
- **`/mcp`** (planned, plans/P001 phase 5) — streamable-HTTP MCP server exposing a `submit_decision` tool that goes through the same validation + PR path.

## Pipeline

`.github/workflows/ci.yml`:

- **Pull requests + pushes to master** — `pnpm run check` (route generation, typecheck, oxlint, oxfmt check, vitest data suite), `pnpm run build`, then `pnpm run smoketest` (derives expectations from `data/` and asserts every registry entry appears in the prerendered `dist/client/` pages).
- **Merge to master** — after checks pass, the deploy job builds, re-runs `pnpm run smoketest` on the exact artifact it ships, then `wrangler deploy` via `cloudflare/wrangler-action`. Merging a data PR is what publishes the site: no separate content pipeline.

## Required GitHub Actions secrets

| Secret                  | Purpose                                           |
| ----------------------- | ------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Workers deploy permission (Edit Workers template) |
| `CLOUDFLARE_ACCOUNT_ID` | Target account                                    |

## Required Worker secrets (once the PR-creation endpoints ship)

Set with `wrangler secret put <NAME>`:

| Secret                 | Purpose                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GITHUB_PR_TOKEN`      | Fine-grained PAT (ideally on a dedicated bot account) scoped to this repo only: contents + pull-requests write |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verification for UI submissions                                                          |

## Domain

Served on `legrandbilan.fr` (+ `www`) via Worker custom domains (`routes` in `wrangler.jsonc`); Cloudflare manages DNS and TLS. Registration stays at Gandi with nameservers delegated to Cloudflare. The `workers.dev` URL is disabled once the domain is verified.

## Local

- `pnpm run dev` — local dev server (port 3000)
- `pnpm run preview` — build + preview the production build
- `pnpm run deploy` — manual deploy (normally CI's job)
