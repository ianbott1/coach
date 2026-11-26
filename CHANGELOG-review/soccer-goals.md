# Round 3: soccer's top scorer (branch rv3/soccer-goals)

A probe of the soccer game on engine 27 had a computer-run Manchester City striker (the 4th club, seed 1234) score 65
Premier League goals in 2026-27, passing the record of 36 by week 28. Engine 26 does exactly the same (65, on
`ENGINE_NOW=26` and on /home/claude/dist-e26): it is round 2's, not round 3's.

## The cause
- The unit shares (`SC_GOAL26` in src/soccer/75_screens.js, round 2's stats branch) credit a whole side's goals to one
  striker (29%), one winger (28%), one midfielder (23%), and the finishing lean (`scLean`) can take the striker to
  1.4x and the rest to 1/1.4x: 44.5% of his side's goals at most (real Golden Boot winners 24% to 41%).
- The matchday's best sides score far more than the real ones: Manchester City 144 in that season (seed 5: 163;
  in 12 of 24 probe seasons a club passed 110). The real record is 106 (Manchester City 2017-18,
  https://en.wikipedia.org/wiki/2017%E2%80%9318_Premier_League). 45% of 144 is 65. That club-goal tail is the
  matchday's (src/soccer/50_game.js) and is left to it: see Not yet.

## One man's season held to what one man scores
- What: `scPace` (src/soccer/75_screens.js), engine 27 only. A man running ahead of 0.72 goals a game, after 3
  goals' grace, sees his weight in `scScorer` fall away (exp(-excess/3)); his team-mates get the chances. It reads
  his season tally before this match (`st2`, league and cups), which is the same when the live feed names a goal and
  when the season stamps it after the game, so the feed, the box score and the highlights still agree. Tunable for
  tests by `SC27_P`, `SC27_A`, `SC27_K`. The engine's "27:" comment has an entry.
- Why: no Premier League player has scored more than 36 in a 38-game season, and the best seasons run at about a goal
  a game (Haaland 36 in 35). Golden Boot since 1995-96: 18 to 36, 25.9 on average
  (https://en.wikipedia.org/wiki/Premier_League_Golden_Boot).
- What it doesn't move: any result. The side's goals are the same goals; only the names change. With the hold off
  (`SC27_P=99`) the same seasons play every game the same (test/soccer-goals.js checks every score line).
- Games: English football.
- Tested, Premier League goals only, 48 seasons (16 careers x 3, scratch probe):
  - before (engine 26 and 27 alike): top scorer 20 to 65, mean 30.4, 8 of 48 seasons past 36 (37, 37, 39, 40, 42,
    47, 52, 65)
  - after: 19 to 33, mean 27.9, none past 36; seed 1234 37 (was 65). The fifth-best scorer 15 to 27 (real about
    19-20).
  - `node test/soccer-goals.js` (new, run-all fast tier, ~45s): MATCH (seed 1234 37; twelve seasons' mean 29.5 with
    seed 1234 in them, highest 37; results identical with the hold off).
  - `node test/boxscores.js soccer`: MATCH (Golden Boot 33, band 22-38; scorers on the pitch at their minute).
  - `node test/sc-manager.js`: MATCH. `OLD=/home/claude/dist-e26 node test/engine-replay.js soccer`: MATCH.
    `node test/migrate.js`: MATCH 2253 of 2253. `node test/reload.js dist/soccer-coach.html`: MATCH 18 of 18.
  - `node test/longrun.js epl --short`: MISMATCH, one band, "scoring a game, late / early: 0.946" (top scorer, all
    competitions: early 34.3, late 28.7). The same 0.946 with the hold off (`SC27_P=99`) and 0.974 on `ENGINE_NOW=26`:
    the drift comes from another engine-27 change on the base, not this one (this change moves no result).
- Not yet:
  - The best clubs' goal totals (110-163 a season against a real best of 106; 7- to 11-goal games several times a
    season) are the matchday's: the segment rate `exp(e/2)` with the multipliers stacked. Fixing them moves results,
    so it belongs to the soccer matchday's owner. Until then the mean Golden Boot sits about 2 above the real one.
  - The other sports: `node test/boxscores.js` MATCH in all seven. Hockey credits a line's goals the same way (12-man
    rosters); an earlier longrun --short run had about 21 fifty-goal scorers a season (real 1 to 5) and a top scorer
    mean of 74 against a 45-72 band, but no one near the record of 92. Worth the same look there.
