# P002 - Profils des décisionnaires et archives médias

**Type:** FEATURE
**Status:** Backlog

## Overview

Enrich each politician ("décisionnaire") with a profile — photo and short summary sourced from Wikipedia (captured at commit time, with the link) — and an archive of public appearances (speeches, TV shows) sourced from INA / YouTube. Media assets are downloaded and re-hosted on Cloudflare R2 at deploy time so the registry preserves them even if the original is taken down: the INA/YouTube link stays the cited source, the served asset comes from R2.

## Success Criteria

- [x] Politician schema extended: `wikipedia_url`, `photo` (R2 asset + source + license), `summary` (LocalizedText + `retrieved_at`) — all captured by a commit-time script, not hand-written
- [x] Appearance/media schema: title, date, politician_ids, optional decision_ids, `source_url` (INA/YouTube), R2 asset reference, archived_at
- [x] Archival (commit-time): new media entries are downloaded and uploaded to R2 exactly once (idempotent), site serves the R2 asset with the original link displayed as source
- [x] Politician profile (modal, per P001-02) renders photo + summary + appearances; media playback works from R2
- [x] ALL assets self-hosted: the Wikipedia lead image is downloaded and stored on our infrastructure like the videos — the site never hotlinks Wikipedia/Wikimedia/YouTube/INA
- [x] Timeline rows show the décisionnaires as a photo cluster: main décisionnaire as a square picture, smaller squares for the others; hovering any square grows it to the main size (genie-style scale animation); clicking opens that person's profile modal
- [x] Data suite extended: asset references resolve, licenses/attribution present for Wikipedia content (CC BY-SA)

## Implementation Phases

### Phase 1: Schema + registries `[TODO]`

Extend `src/data/schema.ts` (politician profile fields, new appearances registry — likely `data/appearances/yyyy-mm.json` mirroring decisions). Regenerate JSON Schemas, extend `src/data/data.test.ts`.

### Phase 2: Wikipedia profile capture `[TODO]`

Commit-time script (`scripts/`): fetch the Wikipedia REST summary + lead image for a politician id, write photo asset + summary + `retrieved_at` + attribution into the registry. CC BY-SA attribution rendered on the site; image license captured per file from Wikimedia Commons.

### Phase 3: Media archival to R2 `[TODO]`

Deploy-time script: diff registry vs R2 bucket, download missing media (yt-dlp for YouTube; INA source TBD), upload to R2 (`wrangler r2 object put` or S3 API), record the asset key. Serve via the Worker (R2 binding) or public bucket domain. Idempotent, runs in CI after checks.

### Phase 4: UI `[TODO]`

Politician profile modal: photo, summary, Wikipedia link, appearances list with player (R2 asset) + source link (INA/YouTube). Timeline rows: photo-square cluster replacing (or complementing) the politician chips — main décisionnaire large, others as smaller squares, genie-style hover growth, click opens the profile modal (wireframe 2, described in P001-02).

## Progress Tracker

- [x] Phase 1: Schema + registries
- [x] Phase 2: Wikipedia profile capture
- [x] Phase 3: Media archival to R2
- [x] Phase 4: UI

## Remaining Work

- INA as a media source (only YouTube handled by yt-dlp so far)
- R2 media served from pub-…r2.dev (rate-limited): move to a custom domain at launch
- Archival runs locally at commit time; CI-side verification that every recorded asset exists in R2 is not yet wired
- EN summaries not captured (fr only, en: null)

## Decision Log

| Decision                                         | Rationale                                                      |
| ------------------------------------------------ | -------------------------------------------------------------- |
| Original link is the source, R2 serves the asset | Preservation: registry must survive takedowns ("never forget") |
| Wikipedia capture at commit time, not runtime    | Static site; content is versioned data like everything else    |

## Risks

- **LEGAL (needs operator sign-off before Phase 3 ships): re-hosting INA/YouTube video is copyright-sensitive.** INA archives are rights-managed and licensed commercially; YouTube's TOS forbids downloading; re-serving from R2 is republication, and French "courte citation" exceptions are narrow for video. Archival intent does not by itself create a right. Options to evaluate: short excerpts only, audio-only, private R2 bucket used as cold archive while the site embeds the original, or takedown-triggered publication.
- Wikipedia text is CC BY-SA: summaries derived from it must credit Wikipedia and link the article (share-alike applies to derivatives); each Commons image carries its own license to record.
- R2 egress/storage cost grows with video count; enforce size/duration caps in the archival script.
- yt-dlp breakage is routine; the archival step must fail soft (report, don't block deploy).

## Appendix A: Artifacts

None yet.
