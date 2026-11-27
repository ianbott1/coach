# Round 3 follow-up: the chance shown against the engine, and the hot-seat line (branch rv3/fixes-odds, engine 27)

`node test/regressions.js` on the merged build (3f3cc45) failed four checks: the win chance shown against the games
the engine plays (section 37) in college football, pro football and pro baseball, and soccer's hot-seat line that
names the target missed (section 69). Football was an engine bug (engine 27 broke the rule that a roster's shape is
worth the same per point); baseball was a test that no longer played the game the chance is for, plus the chance
undercounting tonight's starter on engine 27; soccer was game text. Everything that moves a result is gated on engine
27 (`fb27()`, `eng27()`), so engine-25 and engine-26 seasons replay as played. `ENGINE_NOW` stays 27.

## 1 and 2. Football: blocking and pass rush were worth twice everything else (college and pro)

- What: engine 27's fourth downs (51_tactics `fb27Fourth`) are decided from where a drive stalls, so the yards a stalled
  drive gains, which a side's Blocking against the other's Pass rush sets, turned into points. Measured with
  scratch `odds/worth.js` (home's lean at +-1 of each attribute, 20,000 games a side on common dice, both builds):
  a point of Blocking or Pass rush was worth 113-125 Elo on 27 against about 39-63 for every other term (engine 26:
  45-64 for all of them), and the turnover terms lost about a quarter (`fb27To` follows the gap less steeply). The
  shape terms are meant to be worth the same per point (engine 14's rule; the chance, the plan fits and the computer's
  plans all read on it), so on engine 27 each attribute's terms are scaled by its worth on 26 over its worth on 27
  (`FB27_CW`, src/football/50_drives.js; `fbC()` gives the drive the scaled terms on 27, the old ones before).
  After: college 54-62 Elo a point for every term, pro 45-55 (engine 26: college 53-64, pro 45-54).
- And: the weekly game plan (engine 27's assistants' plans, `fb27Ctx`/`fb27Mods`) moves college games by more than the
  plan words did, unevenly by matchup. The chance now counts both clubs' assistants' plans
  (`sportPlanDayEdge`, src/football/51_tactics.js, read by core `gameEdge`): the plans' Elo, plus a measured worth of each
  plan's style at the gap (`GP_W`, scratch `odds/gpmodel.js`), with the computer's defensive scheme weighted as it is
  drawn (its usual scheme 5, the others 1). College only: over 162 random pairs it brings the mean miss from 2.63 to
  2.18 points and the pairs over 7 from 9 to 6; on pro it made things no better (105 pairs: 2.85 without, 2.98 with), so
  pro has none (`GP_W` is null for the NFL). Returns 0 before engine 27.
- Why: "football-coach.html: ... mean -3.3 points, worst BYU (gap 43): shows 48%, wins 62%" (BYU's weak pass rush gave
  Alabama 18 more yards on every stalled drive) and "football-coach-pro.html: ... worst Washington (gap 82): shows 48%,
  wins 55%".
- Wide check (scratch `odds/wide.js`, 84 random college pairs): mean |shown - won| 1.88 points on the engine-26 build,
  4.58 on the merged engine-27 build (14 pairs over 7), 2.66 with the terms rescaled (5 over), 1.82 with the game plan
  off, so what is left is the game plan, which the new chance term brings to about 2.2.
- Game(s): college and pro football. Results move on engine 27 (the term scaling and, through the board's expected
  wins, the chance), so the goldens and hot-seat baselines were re-recorded (below).

## 3. Pro baseball: the test plays the whole game, and tonight's starter counts what he's worth on 27

- What: section 37 played baseball with only the lineup's lean (`{lz:ctx.lz}`), since the chance didn't carry the
  rest before round 94. Since engine 26 the clubs' gap is played through the lineup card, the men's attributes and the
  bullpens, and the chance was refit on those games (`BS26_WP`), so a game with only the lean is no longer the game the
  chance is for: Colorado, 201 better, won 51% of those against 57% shown, and 57% of full games. The test now plays the
  whole context, as the season does (test/regressions.js).
- And: with the whole context, tonight's starter was undercounted on 27. Measured (scratch `odds/bsspq2.js`: eight pairs,
  each side's starter at +-0.04 of q, 12,000 games a side on common dice): 1,180 to 1,655 Elo a unit of q, mean 1,465.
  The chance counted 853 a unit and then only `BS26_WP` (0.72) of it: Seattle read 51% against the Dodgers on a day its
  starter was 0.049 better, and the games gave it 59%. On engine 27 the starter counts `BS27_SPQ` (1,465) on the curve
  (src/baseball/50_game.js `sportTonightEdge`); engine-26 seasons keep 853.
- Game(s): pro baseball. The chance moves on 27, so the board's targets can; goldens re-recorded (below).

## 4. Soccer: the hot-seat line names the target

- What: engine 27's chairman line (core 93_lore `bossWhy`, which titles the badge when the lore is on) said "has seen
  1 season short of the target" without the target. It now names last season's: "The chairman, Matt Hargrove, has seen
  1 season short of the target (mid-table). Miss this one and the job goes." (with two or more misses: "(last season's:
  ...)"; a target's first letter is lowered only when it reads as an ordinary word, so "win in March" keeps its
  capital).
- Why: "soccer: 0 of 1 hot-seat badges name the target (seed 8)".
- Game(s): every game with the board's lore (the text only; no result moves).

## Tested

- The four checks (sections 37 and 69 of `test/regressions.js`, run alone): 9 of 10 pass. College football's
  section 37 reads mean +0.8 points over 11 opponents (was -3.3), worst Tulane (gap 288): shows 72%, wins 61%, still
  over the 7-point bound (see Not yet; BYU, the reported pair, is now inside it). Pro football passes (mean -1.6,
  worst -3.6; was -0.5 and Washington 48% against 55%). Pro baseball passes (mean -1.9, worst -4.9; was +3.9 and
  Colorado 57% against 51%). Soccer: 1 of 1 hot-seat badges name the target (was 0 of 1).
- `OLD=/home/claude/dist-e26 node test/engine-replay.js`: MATCH. `OLD=/home/claude/dist-e25 node test/engine-replay.js`:
  MATCH (all seven games: an engine-25 or engine-26 season replays as it was played).
- `node test/migrate.js`: MATCH 2253 of 2253 checks.
- Goldens, re-recorded on purpose: college football, pro football and pro baseball move on engine 27 (fast:
  b783dd22199c7e86, 8172d22fd4b32b36, 66f9350f842e7cec; full: e0f731cd9016d7a5, bfb43bd907041993, d9487c9771978513;
  hot seat: 0bd09b0d2da6c46f, 11a75dac43530d3e, fa09f4062e820c5a). The other four games changed only in their screens
  (the hot-seat line; every result field matched): college basketball's fast golden re-recorded (99de4eb245178b28), and
  the full goldens of college basketball, soccer, pro basketball and hockey re-recorded, screens only (fc55ac6ea5bb2649,
  5d8d34cc52c3eefb, 4ba1c0ba8791b199, 1caeb51121d24eb1). Their hot seats match
  (cffbb1fccb3fc520, e0b135a343bc9771, 6bf921962d34e36e, a341c29c2f93bbc2) and the fast goldens of soccer, pro
  basketball and hockey match (ec41d9359cbcf068, d4b45eadbbd3616e, 57ac9e3b0ac41b02).

## Not yet

- College football's section 37 still reads one pair off: Alabama against Tulane (gap 288, an outgunned club with
  an aggressive plan and a blitz scheme) shows 72% and wins 61%. Engine 26 read +4.1 on the same pair. What is left is
  the engine-27 weekly game plan at a big gap: the style table (`GP_W`) is fit per lever across random pairs, and a
  blitzing underdog against a big favourite interacts beyond it. Part of it is the one context the test plays (its
  defensive scheme is drawn once): played with a fresh context each game the pair reads 8 points. The mean over the
  eleven opponents is within a point. Reading the two plans for the card by playing them out would close it, at a
  cost per card; not done here.
- Pro football has no game-plan term (it measured no better); its worst pair is within 4.
- Engine-26 baseball seasons keep the starter at 853 a unit (their games are as they were played).
- Not run here: the rest of `test/regressions.js` (only sections 37 and 69, the failing ones, were run on the final
  build), `test/run-all.js`, and the browser tests that need Playwright's Chromium.

## Follow-up: check 79 counts the weekly game plan

The merged build's full `test/regressions.js` run showed two more college football failures in check 79 ("the chance shown is the engine's"): the check rebuilt the engine's chance without the weekly game-plan edge that the chance now counts on engine 27. The check now adds `sportPlanDayEdge` the way `gameEdge` does. Test only; no result moves. Check 79 run alone: 10 of 10.
