# Round 3: the spread of a soccer game's goals (branch rv3/soccer-spread)

The matchday's best clubs scored 110 to 163 Premier League goals a season (the record is 106, Manchester City 2017-18)
and games ended 7-4, 9-5, 13-2. The benchmark here is every Premier League result of the fifteen seasons 2010-11 to
2024-25 (5,700 games, openfootball: https://github.com/openfootball/football.json, `<season>/en.1.json`, read
November 2026). A season, mean (lowest-highest): goals a game 2.80 (2.57-3.28); draws 24.0% (18.7-29.2%); the best
club's goals 90.7 (71-106); the worst club's goals against 79.9 (68-104, Sheffield United 2023-24); games of 6+ goals
23.5 (11-36), of 7+ 9.2 (4-15), of 10+ 0.2 (three in fifteen seasons); wins by 5+ 9.2; the biggest win 7.2 goals
(6-9; 9-0 three times); champions 89.7 points (80-100); the bottom club 23.3 (12-33). A game's goals vary as a
Poisson's do (variance 2.81 on a mean of 2.80), and games between clubs 45+ points apart in the final table score 1.20
times the goals of games between clubs within 15 points.

## 1. A game's goals: the gap's split and the gameplans' pull (engine 27)
- What: two changes in `src/soccer/50_game.js`, both `ENGINE_V>=27`, tunable for tests by `SC27S_P`, `SC27S_Q`,
  `SC27S_QC`:
  - `scSplit`: each side's scoring rate was `exp(+-e/2)` of the edge e, so the two rates' sum grew with the gap as
    cosh(e/2). Now the sum grows as cosh(e/2)^0.4 and the ratio of the two rates is exactly exp(e) as before, so who
    is favoured doesn't move, only how many goals a mismatch has. Extra time and the shown win-draw-loss chance
    (`LEAGUE.wdl`, src/leagues/epl/05_league.js) use the same split.
  - `PQ` in `makeLiveGame`: in a game the computer plays on both sides (every league game but yours, and yours when
    simmed, which is already the computer coaching your club), half the two gameplans' pull on the game's goals is
    undone; each side's share of the chances, which is what a plan does for who wins, is kept. `qc` (0.77) centres it
    on the pyramid's usual mix, so the Championship scores what it did. Your watched games keep the plans' full pull,
    so the game-day card's measured plan worth (`SC12_SHIFTH`) still holds.
  - The engine's "27:" comment has an entry.
- Why: measured on 1,140 top-flight games, the expected goals of each: the gameplans explained three quarters of the
  spread of a game's expected goals (both sides taking the game to them, 3.9 goals; both sitting deep, 1.3), and the
  gap 3%. So the cause the brief named, `exp(e/2)`, is real (a mismatch scored 1.30 times a close game's goals against
  the real 1.20) but most of the excess came from the plans. Taming only the split (any p up to 1) left a game's
  goals at 1.2 times a Poisson's variance and 6+ goal games at 45 a season. A late-game chase that played nearer even
  was tried too and dropped: it pushed draws to 27% and barely moved the tail.
- Measured (`test/soccer-spread.js`: six careers, two seasons each, against engine 26 on the same six first seasons):
  goals a game 2.85 (engine 26 3.09; engine 27 before this branch 3.30 on four first seasons); variance over mean
  1.12 (1.24; real 1.00); draws 25.0% (23.2%); the best club 88.2 goals, at most 115 in twelve seasons (100.8, 116 in
  six; on engine 27 before, 106 on average); the worst club's goals against 81.8 (93.7); 6+ goal games 28.5 a season
  (43.5); 7+ 12.5 (20.5); 10+ 0.83 (2.33); wins by 5+ 9.6 (14.5); the biggest win 6.8 (7.8); champions 87.3 points
  and the bottom club 23.0 (the same on engine 26); a mismatch's goals 1.22 times a close game's (1.25); the
  Championship 2.52 goals a game (2.56; real 2.45 in 2024-25). `test/sc-manager.js`: 2.89 goals, 25.9% draws (real
  2.85-3.28, 21.6-24.5%). `test/soccer-goals.js`: the Golden Boot 23 to 33, mean 26.9 (band 22-31).
- Games: soccer.
- Tested: `test/soccer-spread.js` (new, fast tier, about 45 seconds), `test/sc-manager.js`, `test/soccer-goals.js`,
  `test/soccer-fo.js`, `test/boxscores.js soccer`, `test/longrun.js epl --short`, `OLD=/home/claude/dist-e26
  test/engine-replay.js soccer`, `test/migrate.js`, `test/reload.js`, `test/saves.js` (results in the report).
- Not yet: the tail is still fatter than the real league's: about one 10-goal game a season (real 0.2) and now and
  then a club past 106 or an 11-goal win; what remains is a game's run of play (legs, the late chase) and the
  starting spread of club strength, not the split. The computer's plan picks (`cpuPlanOf`, `SC12_SHIFT`) were
  measured with the plans' full pull; with half of it undone sitting deep is worth a little less to a computer
  underdog than the table says. Not re-measured.

## 2. Scoring's drift over a career (`test/longrun.js`)
- What: no code beyond section 1; the cause, found.
- Why: the brief had `longrun --short` failing "scoring a game, late / early" at 0.946 (engine 26 0.974). On this
  branch's base (006847a) the short run reads 0.982 here, with two other bands out (the starters' 99th percentile -4.0,
  the best player -4.7); one career is noisy. Four careers of twelve seasons each make it clear:
  - engine 26: the top flight's starters' spread stays at 9.4 to 10.1 every season and scoring holds (0.974);
  - engine 27 before this branch: the spread falls 10.2 to 7.6 by season 12 and scoring with it (0.909, the band
    out); goals a game went with the spread at 0.16 a game per point of spread;
  - this branch: about 40% less sensitive (0.09 a game per point), scoring 0.972 (in), spread 10.2 to 8.4.
  The narrowing is engine 27's soccer money and transfers (`CHANGELOG-review/soccer-fo.md` section 8 names it in its
  Not yet: "the spread still narrows ... and scoring drifts down about 5%"), not the coaching carousel or the scorer
  hold (neither moves a rating or a game's goals). A league whose clubs are closer scored fewer goals because both of
  section 1's causes grow with the gap: the split, and the computer's plans (the stronger side takes the game to
  them, the weaker sits deep). Section 1 cuts that link by 40%; the narrowing itself is the market's.
- Games: soccer.
- Tested: `test/longrun.js epl --careers 4 --seasons 12` on the base, on engine 26 and on this branch;
  `test/longrun.js epl --short`.
- Not yet: the narrowing of the top flight's spread under engine 27's market.

## 3. Soccer's seasonResult mid-season
- What: `seasonResult` (src/leagues/epl/85_postseason.js) during the league season returns where the club stands
  ("4th in the Premier League so far") and touches nothing. Before, it called `_result`, whose `_seed` keeps the
  table it reads: the champions, the play-off seeds, `regRec` and `regElo`. A call mid-season would have settled the
  season then, and the play-offs and the champion would have come from that week's table.
- Why: a note from another branch. No caller reaches it mid-season today: every one waits for `phase==="done"` or the
  post-season (`95_share`, `96_goals`, `97_feel`, `99_app`'s season's end, grade and carousel, `90_history`, the
  offseason); `99_app`'s season line and `95_share` returned "" mid-season for this very reason.
- Games: soccer. No result moves, so nothing is gated.
- Tested: `test/soccer-spread.js` calls it at week 20 and checks nothing is seeded, then that the season ends exactly
  as the same season without the call (champions, table, the club's result).

## 4. The Championship's squad costs (engine 27)
- What: `SQ_CH` (1.2) in `src/leagues/epl/28_money.js`: a Championship club's squad costs are 1.2 x `SQ27` (2.88)
  times the twelve's wages and write-offs. The code already said "a Championship bill is flatter"; a flatter bill
  means the twelve are a smaller share of it than at a top-flight club, the reverse of the top flight's stars (`sq27`
  takes the biggest clubs down to three quarters of `SQ27`). The board's line (95%) is unchanged, so its wage room for
  the twelve is a sixth smaller; Championship clubs use about three quarters of it.
- Why: `test/soccer-fo.js` read Championship squad costs at 59-61% of revenue against the band's floor of 60% (real
  wages 93% of revenue, Deloitte, cited in soccer-fo.md).
- Measured: `test/soccer-fo.js` 71% (band 60-110%); its other money checks hold (top flight 58%, the Championship's
  share of the market's gross 12%, points deductions 4 in 10 seasons, January £295M).
- Also: soccer-fo's check of your next season's books expected the top flight's equal share, but the career it plays
  (Brentford, seed 11) now goes down; the check reads the Championship's books when the club was relegated.
- Not yet (soccer-fo's area, seen here): the summer window is drawn before the drop is made, so a relegated club's
  "books for next season" show no parachute payment (£53.3M), and `kitty27`, read then, leaves it out of the summer's
  money for fees too.
- Games: soccer. Files: `28_money.js`, `test/soccer-fo.js`.

## Sources (read November 2026)
- Premier League results 2010-11 to 2024-25: https://github.com/openfootball/football.json
- The Championship's goals a game, 2024-25: futbol24.com's season statistics, as src/soccer/55_squad.js cites.
- Manchester City's 106 goals, 2017-18: https://en.wikipedia.org/wiki/2017%E2%80%9318_Premier_League
