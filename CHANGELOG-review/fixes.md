# Round 3 follow-up: the merged build's three failing checks (branch rv3/fixes, engine 27)

`node test/run-all.js --fast` on 035f710 (all of round 3 merged, goldens re-recorded on engine 27) failed three
non-browser checks. One was a real bug in baseball's front office; two were tests that measured the wrong thing.
Nothing here moves a simulated result, so nothing is gated and no golden or hot-seat baseline was re-recorded
(`node test/golden.js dist/baseball-coach-pro.html --fast`: MATCH bbdda6b42598665f). `ENGINE_NOW` stays 27.

## 1. A call-up sent back down keeps his lines in the box scores he played in

- What: when an injured starter came back off the IL, `mlbAfterWeek` (src/leagues/mlb/28_fo_season.js) put the bench
  man back and the call-up's player object, with his game log, left the 26-man. The box score reads a club's men from
  its roster (core 96_moments `boxLines`), so the call-up's line left the box of every game he played. The sent-down
  call-ups are now kept on the season's front-office record (`sea.mlb.gone`, rebuilt on reload like the rest of it)
  and `boxLines` reads them through the league's `boxGone(t)` (a hook the other games don't define).
- Why: `test/boxscore.js` found Detroit 3 at Seattle 5 (step 160) with Seattle's hitters at 8 hits against the line
  score's 9: the center fielder, a call-up, was gone from the box.
- Game(s): pro baseball (engine 27 careers, the only ones with a farm).
- Tested: `node test/boxscore.js baseball` MATCH 1364 checks (was MISMATCH 1).
- Not yet: the call-up's season line still leaves with him. A player page, the leaders and the awards read rosters,
  so a man who played two weeks up and went down has no season there. A second stint up starts a fresh line.

## 2. The college roster economy test follows the current engine

- What: `test/cfb-portal.js`'s old-season check asked that a career begun on engine 25 be on engine 26 after its
  winter. It now reads the current engine (`ENGINE_NOW` in the environment, else the page's own default) and its
  messages say so. Its other 26s are floors (`>=26`: the market opens on 26 and later), which still hold.
- Why: "FAIL after its winter the career is on engine 27, not 26": the test was written when 26 was current.
- Game(s): college football (the test only).
- Tested: `node test/cfb-portal.js` MATCH 5141 checks.

## 3. Skip and a close baseball finish: the test reads a call inside an inning at the score as it stands

- What: `test/skipfinish.js` judged whether a call stopped Skip in a close late game by the last finished inning's
  score. Baseball's calls come inside an inning (round 101), so it now reads `live.askScore` for a call inside the
  stretch.
- Why: "10 games, 5 close in the late window, Skip stopped for 4". The fifth was Detroit at Seattle in the first
  week: a pinch-hit call in the bottom of the 9th with the game tied 2-2, read by the test as the 8th's 0-2. Skip had
  stopped there (the call was asked, and a call turns Skip off), and the walk-off after it was watched at normal
  speed. The game was right. The same game fails the same way on the engine-26 build (/home/claude/dist-e26: "Skip
  stopped for 3" of 4), so engine 27 changed nothing: round 2's dugout calls in the 9th brought it out.
- Game(s): pro baseball (the test only).
- Tested: `node test/skipfinish.js` MATCH, all seven (baseball 5 of 5); on /home/claude/dist-e26 MATCH (4 of 4).
- Not yet: the late floor itself (`lateFloorDue`, `ffLateStop`) also reads the last finished stretch's score, so a
  call inside a close 9th that the gate would hand to your assistant isn't forced to be yours. Skip still stops when
  that inning ends close. Changing it would change which calls are yours, so it would need an engine gate.

## Tests run on this branch

- `node test/cfb-portal.js`: MATCH 5141 checks
- `node test/boxscore.js baseball`: MATCH 1364 checks
- `node test/skipfinish.js`: MATCH (and on /home/claude/dist-e26: MATCH)
- `node test/golden.js dist/baseball-coach-pro.html --fast`: MATCH bbdda6b42598665f (no result moved)
- `OLD=/home/claude/dist-e26 node test/engine-replay.js`: MATCH; `OLD=/home/claude/dist-e25`: MATCH
- `node test/migrate.js`: MATCH 2253 of 2253; `node test/saves.js`: MATCH
- `node test/reload.js` baseball and college football: MATCH 18 of 18 each
- `node test/mlb-fo.js`: MATCH; `node test/bs-manager.js`: MATCH; `node test/boxscores.js baseball`: MATCH
