# P002 - Profils des décisionnaires et archives médias

**Type:** FEATURE
**Status:** Backlog

## Overview

Enrich each politician ("décisionnaire") with a profile — photo and short summary sourced from Wikipedia (captured at commit time, with the link) — and an archive of public appearances (speeches, TV shows) sourced from INA / YouTube. Media assets are downloaded and re-hosted on Cloudflare R2 at deploy time so the registry preserves them even if the original is taken down: the INA/YouTube link stays the cited source, the served asset comes from R2.

## Success Criteria

- [ ] Politician schema extended: `wikipedia_url`, `photo` (R2 asset + source + license), `summary` (LocalizedText + `retrieved_at`) — all captured by a commit-time script, not hand-written
- [ ] Appearance/media schema: title, date, politician_ids, optional decision_ids, `source_url` (INA/YouTube), R2 asset reference, archived_at
- [ ] Deploy-time archival: new media entries are downloaded and uploaded to R2 exactly once (idempotent), site serves the R2 asset with the original link displayed as source
- [ ] Politician pages render profile + appearances; media playback works from R2
- [ ] Data suite extended: asset references resolve, licenses/attribution present for Wikipedia content (CC BY-SA)

## Implementation Phases

### Phase 1: Schema + registries `[TODO]`

Extend `src/data/schema.ts` (politician profile fields, new appearances registry — likely `data/appearances/yyyy-mm.json` mirroring decisions). Regenerate JSON Schemas, extend `src/data/data.test.ts`.

### Phase 2: Wikipedia profile capture `[TODO]`

Commit-time script (`scripts/`): fetch the Wikipedia REST summary + lead image for a politician id, write photo asset + summary + `retrieved_at` + attribution into the registry. CC BY-SA attribution rendered on the site; image license captured per file from Wikimedia Commons.

### Phase 3: Media archival to R2 `[TODO]`

Deploy-time script: diff registry vs R2 bucket, download missing media (yt-dlp for YouTube; INA source TBD), upload to R2 (`wrangler r2 object put` or S3 API), record the asset key. Serve via the Worker (R2 binding) or public bucket domain. Idempotent, runs in CI after checks.

### Phase 4: UI `[TODO]`

Politician page: photo, summary, Wikipedia link, appearances list with player (R2 asset) + source link (INA/YouTube).

## Progress Tracker

- [ ] Phase 1: Schema + registries
- [ ] Phase 2: Wikipedia profile capture
- [ ] Phase 3: Media archival to R2
- [ ] Phase 4: UI

## Remaining Work

Not started. Open questions below must be settled before Phase 3.

## Decision Log

| Decision | Rationale |
| -------- | --------- |
| Original link is the source, R2 serves the asset | Preservation: registry must survive takedowns ("never forget") |
| Wikipedia capture at commit time, not runtime | Static site; content is versioned data like everything else |

## Risks

- **LEGAL (needs operator sign-off before Phase 3 ships): re-hosting INA/YouTube video is copyright-sensitive.** INA archives are rights-managed and licensed commercially; YouTube's TOS forbids downloading; re-serving from R2 is republication, and French "courte citation" exceptions are narrow for video. Archival intent does not by itself create a right. Options to evaluate: short excerpts only, audio-only, private R2 bucket used as cold archive while the site embeds the original, or takedown-triggered publication.
- Wikipedia text is CC BY-SA: summaries derived from it must credit Wikipedia and link the article (share-alike applies to derivatives); each Commons image carries its own license to record.
- R2 egress/storage cost grows with video count; enforce size/duration caps in the archival script.
- yt-dlp breakage is routine; the archival step must fail soft (report, don't block deploy).

## Appendix A: Artifacts

None yet.
