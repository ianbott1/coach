# Bringing in main's round 111

**What:** `main` gained round 111 (the full match in real time, live player stats, a bigger field; engine 24 untouched) after this branch was cut, so pull request 1 no longer merged cleanly. `origin/main` is merged into `review-improvements`.

**Conflicts and how they were resolved:**
- `src/{basketball,baseball,football,hockey}/72_highlights.js`: each sport's highlights object keeps main's new `liveStats` (and basketball's `pbSpan`/`pbPlan`, hockey's `feedClips`) and this branch's `allLabel`/`fullLabel`.
- `src/baseball/72_highlights.js`: main's new drawing code is kept; on it, this branch's three changes are re-applied: `bsPitches` reads the engine's own pitches (`bsPitchSeq`, the same sequence main drew), an intentional walk is signalled ("Intentional walk", one "B4") and isn't counted in the pitcher's count.
- `ARCHITECTURE.md`: both sections kept; this branch's game-day section is renamed "Review branch, round one" so it isn't read as main's round 111.

**How tested (on the merged build):** all seven goldens match without re-recording; engine replay against engine-25 and engine-26 builds MATCH; `migrate.js` 2,253 of 2,253; `saves.js` MATCH; `reload.js` 18 of 18; all seven pages load; `regressions.js` 8,456 of 8,457 (the known college Alabama-Tulane chance); fast suite 60 of 98, the same as before the merge (37 browser tests that can't run here, and the six-season baseball spread check). The browser tests main added for round 111 (`live-stats.js`, `runplay-sync.js`, `pb-rescale.js`, `fit.js` and the rest) need Playwright's Chromium and should be run before merging.
