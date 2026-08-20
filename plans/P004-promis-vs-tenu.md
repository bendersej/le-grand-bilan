# P004 - Promis vs Tenu

**Type:** FEATURE
**Status:** Backlog

## Overview

For each politician who is or was président de la République, confront their campaign promises with what the registry shows they delivered. A president icon on the photo (top-right corner, cluster and profile modal) opens a two-column diff view — left: what they PROMISED (sourced from the official campaign program); right: the delivering decisions from the registry, or a full-bleed "NON TENUE" tombstone in GTA-"WASTED" style over the Marianne illustration when they did not deliver.

## Success Criteria

- [ ] Presidencies are part of the data model: a promises registry per president (`data/promises/<politician-id>.json`) with term dates, the official program as exact source(s), and promises: `id`, `promise` (LocalizedText, limited markdown), `sources` (exact URLs, min 1), `status: 'delivered' | 'not_delivered'`, `decision_ids` (registry evidence, required when delivered)
- [ ] President icon rendered on the top-right corner of the photo (timeline cluster main square + profile modal) for any politician with a promises file; clicking opens the Promis/Tenu view
- [ ] Promis/Tenu view is a modal route over the timeline (P001-02 pattern, URL shareable): two columns like a diff — promise left; right shows either the linked decisions (rendered as rows) or the tombstone
- [ ] Tombstone: "NON TENUE" in GTA-"WASTED" style (Pricedown-like slab, white with dark outline, slight letterspacing) over the darkened Marianne illustration (`plans/artifacts/plan-004-tombstone-marianne.png`, served self-hosted from `public/media/illustrations/`)
- [ ] Data suite extended: promises reference existing politicians/decisions, delivered entries carry evidence, sources are exact URLs
- [ ] Smoketest: president pages assert promises content in the dialog slice

## Implementation Phases

### Phase 1: Schema + registry `[TODO]`

`Promise`/`PromisesFile` in `src/data/schema.ts`, `data/promises/`, JSON Schema generation, data tests, registry indexes (`promisesByPoliticianId`).

### Phase 2: Seed data `[TODO]`

Hollande 2012 ("60 engagements pour la France") and Macron 2017 programs: source the official program documents (exact URLs), encode a first batch of promises with delivered/not-delivered status backed by registry decisions (backfill dependency: many delivering decisions are not in the registry yet — P003).

### Phase 3: UI `[TODO]`

President icon on `photo-chip-main` + profile modal (position absolute top-right); `_timeline.promesses.$politicianId.tsx` modal with the two-column diff; tombstone component (illustration + "NON TENUE" typography); Pricedown-style font — verify the license allows self-hosted webfont use, otherwise closest open alternative.

## Progress Tracker

- [ ] Phase 1: Schema + registry
- [ ] Phase 2: Seed data
- [ ] Phase 3: UI

## Remaining Work

Not started.

## Decision Log

| Decision                                 | Rationale                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Delivered = links to registry decisions  | The registry is the evidence; a "tenu" without decision ids is unverifiable and rejected by schema |
| Promises in their own per-president file | Keeps `politicians.json` lean; the president icon derives from the existence of promises data      |

## Risks

- Editorial exposure: "non tenue" is a judgment — each status needs sources a reviewer can check; contested cases should stay out until clear.
- Pricedown (GTA font) license must be verified for webfont use; fallback to an open condensed slab.
- Phase 2 depends on backfill (P003): a promise can only be marked delivered against decisions that exist in the registry.

## Appendix A: Artifacts

- `artifacts/plan-004-tombstone-marianne.png` — operator-provided illustration for the "NON TENUE" tombstone (Marianne, lowered tricolore, stormy Paris).
