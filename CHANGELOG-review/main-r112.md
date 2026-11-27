# Bringing in main's round 112

**What:** `main` gained round 112 after round 111, and round 112 is this branch's rounds one and two: the designer merged them (with four of the changes gated at `ENGINE_V>=25`), fixed the engine-26 summer re-centre so it reads only from uncoached clubs, fixed the CPU deadline re-dealing a player just traded with a coach, loosened some tests, and released it live. So pull request 1 no longer merged cleanly. `origin/main` is merged into `review-improvements`; after this the pull request effectively adds round three (engine 27) and its fixes.

**Conflicts and how they were resolved:**
- `src/core/98_trades_cpu.js`: main's moved-set lines are kept, followed by this branch's `cpuSkip` check on each group.
- `test/run-all.js`: the union of both lists, with main's full-order timeout and this branch's `fb-tactics` entry.
- `test/regressions.js` section 37: both comments kept, with this branch's `const ctx=ctx0;`.
- `ARCHITECTURE.md` and the baseball comment: main's wording.
- `test/golden*.json`, `test/hotseat*.json`: main's taken, then re-recorded (below).

**Why the goldens moved:** main's engine-26 summer and deadline fixes also apply on engine 27, so every engine-27 career plays slightly differently. Engine 25 and 26 results don't move: replays against main's live round-112 build, an engine-25 build and the round-111 build all MATCH.

**How tested (on the merged build):** all seven goldens (fast and full) and hot seats re-recorded and then re-checked, all MATCH; engine replays MATCH as above; `migrate.js` 2,253 of 2,253; `saves.js` MATCH; `reload.js` 18 of 18; all seven pages load; `regressions.js` 8,507 of 8,508 (the known college Alabama-Tulane chance, shown 72%, wins 61%). Browser tests (`trades.js`, `picks.js`, and main's round-111 tests such as `live-stats.js`, `runplay-sync.js`, `pb-rescale.js`, `fit.js`) need Playwright's Chromium and should be run before merging.
