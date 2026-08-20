# P001-03 - Contenu en tête de timeline (fin des modales)

**Type:** FEATURE (amendment of [P001-02](P001-02-timeline-toujours-visible.md))
**Status:** Completed

## Context

Operator direction superseding P001-02's modals: no overlay at all. The former modal content renders as an in-flow panel at the TOP of the timeline. On a politician's page the timeline becomes that person's story: scoped to their decisions, with their public appearances woven into the months. Also in this iteration: the Marianne portrait as header logo (hero title/tagline hidden in filter mode), and the OG/social meta image.

## Success Criteria

- [x] `/decisions/$id`, `/politiciens/$id`, `/about` render an in-flow panel (with close ✕ back to `/`) above the timeline — no `role="dialog"`, no overlay
- [x] Politician view: timeline scoped to their decisions, appearances interleaved chronologically as timeline items
- [x] Category filter still composes (URL search param preserved across panel navigation)
- [x] Header shows the Marianne logo; the site hero (title + tagline) hides when a filter or panel is active
- [x] OG image (1200×630) + Open Graph/Twitter meta tags
- [x] Smoketest slices between `data-panel` and `data-timeline` sentinels; appearance titles asserted in the politician's timeline

## Decision Log

| Decision                                                           | Rationale                                                                  |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Month-hash scroll anchors dropped from entity links                | Content now lives at the top: navigation must scroll there, not to a month |
| Layout owns the scoped timeline via `useParams({ strict: false })` | Single owner of timeline rendering; routes only render their panel         |

## Appendix A: Artifacts

- `artifacts/plan-002-cluster-wireframe.png`, `artifacts/plan-002-cluster-wireframe-v2.png` — recovered cluster wireframes (referenced by P001-02/P002).
