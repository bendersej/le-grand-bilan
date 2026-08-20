# P001-02 - Frise toujours visible (pages en modales)

**Type:** FEATURE (amendment of [P001](P001-le-grand-bilan-foundation.md) Phase 3)
**Status:** In Progress

## Context

Operator direction (wireframe 2, described below — no file provided): the frise chronologique is the app. No page ever replaces it: decision, politician, category and about views open as modals ABOVE the timeline, which stays visible (and keeps its scroll position) behind them.

The same wireframe adds a "profile picture" cluster per decision row: the main décisionnaire as a square photo with smaller squares for the other décisionnaires, a genie-style hover that grows any small square to the main size, and click opening the politician profile modal. That part depends on self-hosted profile photos and therefore lives in [P002](P002-profils-et-archives-medias.md) — every image and video is stored on our infrastructure, never hotlinked.

## Success Criteria

- [ ] `/decisions/$id`, `/politiciens/$id`, `/categories/$id`, `/about` render as modals over the timeline; the timeline never unmounts and keeps its scroll position
- [ ] Direct visits to those URLs prerender timeline + open modal (SEO + shareable links intact)
- [ ] Modal closes to `/` (backdrop click + close button) without scrolling the frise back to top
- [ ] Smoketest asserts entity content inside the modal (`role="dialog"` slice), since the always-visible timeline now satisfies naive content markers on every page

## Implementation Phases

### Phase 1: Pathless layout + modal routes

`src/routes/_frise.tsx` (timeline + Outlet), children `_frise.index.tsx` (null), `_frise.about.tsx`, `_frise.decisions.$decisionId.tsx`, `_frise.politiciens.$politicianId.tsx`, `_frise.categories.$categoryId.tsx`; shared `src/components/Modal.tsx`; `resetScroll={false}` on modal links; smoketest dialog-slice assertions.

## Progress Tracker

- [ ] Phase 1: Pathless layout + modal routes

## Remaining Work

Not started.

## Decision Log

| Decision | Rationale |
| -------- | --------- |
| Modals are routes, not client state | Prerender emits every URL as timeline + open modal: links shareable, SEO intact, no JS required for first paint |

## Risks

- Modal accessibility (focus trap, Escape) is minimal in v1; revisit before launch.

## Appendix A: Artifacts

Wireframe 2 was provided inline in conversation only (no file to copy): timeline rail; per decision a cluster of one large + smaller circles (photos), politician box, category box, then title/description/sources.
