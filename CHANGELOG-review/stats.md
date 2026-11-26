# Round 2: box scores, leaders and awards (branch rv2/stats)

Box scores, league leaders and awards a stats fan believes, in all seven games. Every change that moves a result or a
stat line is gated on engine 26 (`ENGINE_NOW` 25 -> 26 in src/core/20_engine.js, "26: box scores, leaders and awards
..."): a season begun on engine 25 replays exactly, and its players keep their old stat keys. Leaders are measured
from the regular season's league games only (the game logs, no playoffs or cups) against the last three real seasons.
The measuring test is `test/boxscores.js` (fast tier of run-all, about 55 seconds); its header lists every source.

## Pro and college football: stat lines like the league's
- What: completions from a per-league base (pro 0.615, college 0.625) plus the passer's accuracy, yards a catch
  10.3 / 11.7; quarterbacks run (1.5-5.5 carries pro, 3-9 college) and are credited their rushing touchdowns
  (new `car`, `ryd`, `rtd` on QB, shown on the line, the leaders and the box); carries split about 65/35 between the
  first and second back; linebackers can intercept (`ints` on LB) and the interception picker spreads over both
  safeties, the corners and the linebacker, never a spare who did not dress; tackles by slot with the lean capped at
  1.3x; receiver touchdowns spread 0.31/0.24/0.24/0.21. Credit is drawn on its own seeded generator, so the score of
  every game is unchanged. Files: src/football/10_players.js, 74_box.js, 75_screens.js.
- Why: the playtest's box scores: completion 57.6%, the rushing leader at 2,019, a tackles leader at 227, backup
  corners with 4 interceptions and no tackles, quarterbacks' rushing touchdowns credited to no one.
- Games: pro and college football.
- Tested: 12-30 seasons. NFL completion 57.6% -> 64.2-64.8% (65.3% in 2024); passing leader about 5,040-5,100
  (4,624-5,250); rushing leader 1,858-2,028 (1,459-2,005); receiving leader 1,735 (1,708-1,799); tackles leader
  227 -> 186 (173-183); defensive interceptions leader 12 -> 10 (6-9); no backup corner with 4+ picks and no tackles.
  College completion 54.1% -> 62.1-62.2%. test/stats.js and test/boxscore.js MATCH; test/boxscores.js MATCH.
  Sources: https://www.espn.com/nfl/stats/_/season/2024/seasontype/2,
  https://www.espn.com/nfl/stats/player/_/stat/passing/season/2023/seasontype/2,
  https://www.espn.com/nfl/stats/player/_/stat/passing/season/2022/seasontype/2,
  https://www.espn.com/nfl/stats/player/_/stat/receiving/season/2023/seasontype/2,
  https://www.espn.com/nfl/stats/player/_/view/defense/season/2023/seasontype/2,
  https://www.actionnewsjax.com/sports/action-sports-jax/2024-nfl-offenses-were-more-efficient-than-ever/WVJ76EU43BDQLDWG7RJIZRSLKE/
- Not yet: the interceptions-thrown leader stays at 26-27 (real 15-21). The league average (0.78 a game, real 0.7)
  is right, but the drive engine gives weak teams most of the turnovers, and the interception/fumble split moves
  returns, so it can't change without moving scores.

## The pro MVP and the Heisman by the slot played
- What: the race groups men by the roster slot they play (`POS[i].p`), not the label on the player, and weighs each
  position by `premium26` in src/leagues/nfl/05_league.js and src/leagues/cfb/05_league.js (QB 1.12, RB 0.93-0.99,
  WR 0.9-0.95, edge 0.85-0.88, the rest 0.5-0.8). College also scales each man by his position's top-eight mean.
- Why: a quarterback has won the AP MVP in 21 of the 25 seasons since 2000; here a man listed at one position but
  playing another was ranked in the wrong group, and edge rushers and safeties won.
- Games: pro and college football.
- Tested: MVP to a quarterback 35 of 40 seasons (13 of 16 in test/boxscores.js), Heisman 36 of 40 (9 of 10). The award
  split test/calibrate.js only printed is now a failing check in test/boxscores.js.
- Not yet: the college Heisman goes to a quarterback a little more often than the real 76%.

## Basketball: a full line for every man who played
- What: minutes, FGM-FGA, 3PM-3PA, FTM-FTA, turnovers, fouls and plus-minus on every line (new keys from engine 26;
  `bbLines26` in src/basketball/10_players.js). Minutes come from each stretch's starters and bench (a starter's share
  0.67 +/- his rating, clamped 0.6-0.82; a man sitting in foul trouble gives his minutes to his backup), and whole
  minutes are shared by largest remainder so a side's come to 240 (college 200) plus 25 an overtime. Plus-minus is each
  stretch's margin times the man's time on the floor. Points, rebounds, assists, steals and blocks are shared by
  minutes, role, rating and attribute lean; the lean is held to 1.4x either way, and no man takes more than a third of
  his side's makes. The named play-by-play's baskets stay their scorer's. Misses go by each man's shooting, fouls are
  capped at the foul-out. The box shows Min, Pts, FG, 3PT, FT, Reb, Ast, Stl, Blk, TO, PF and +/- (starters first, then
  by minutes); the "Rest of the bench" row is gone. New leader boards: minutes, FG%, 3P% and FT%.
- Why: a 64-rated wing with Finishing 78 scored 45.9 a game, the scoring leader was at 38.9 and 25 men scored 25+.
- Games: pro and college basketball.
- Tested: NBA three seasons: scoring leader 38.9 -> 30.4-32.3 ppg (32.7-33.9), tenth scorer 24.0-27.0 (24.9-26.4),
  men at 25+ 25 -> 8-14 (9-14), 20+ 30-36 (34-43), rebounds leader 13.9-14.7 (12.3-13.9), assists 9.4-10.8
  (10.7-11.6), steals 2.2-2.6 (1.9-3.0); team totals 114 points, 89 FGA. College scoring leader 25.0-25.1 (23.3-25.2).
  Every line: makes within attempts, 2FG+3PM+FT = points, players' points = the score, minutes 240/200 + 25 an
  overtime, plus-minus sums to five times the margin (test/boxscores.js, 591 games). Sources:
  https://www.landofbasketball.com/year_by_year_stats/2024_2025_leaders_points_pg_rs.htm (and its 2023_2024 and
  2022_2023 pages), https://www.landofbasketball.com/yearbyyear/2024_2025_season_leaders.htm (and 2023-24, 2022-23),
  https://www.espn.com/mens-college-basketball/stats/player/_/season/2025/seasontype/2 and season/2024.
- Not yet: the threes leader makes 537-608 a season (real 301-357, 3.8 a game in college): the plan sets a team's
  three-point rate (safe 0.18, balanced 0.38, aggressive 0.64), so team makes run 4 to 24 a game. That is the game
  engine's, outside this branch. The blocks leader is low (2.1-2.3, real 3.0-3.8).

## Hockey: goals and points like the NHL's
- What: the bottom six's goals (the depth share) go mostly to the men behind the starters (a starter weighs 0.35 of a
  spare), by rating and forwards more than defencemen, and a spare playing for a hurt starter counts as the starter;
  the starters' rating spread 0.35 -> 0.2; a second assist, from the scorer's own line, on 35% of assisted goals
  (`HK26_*` in src/hockey/75_screens.js), credited on the line and listed in the box score ("(first, second)").
- Why: nine 50-goal scorers a season, a goals leader at 71, a 49-rated spare leading the league with 64, and one
  assist a goal (the points leader 108-122 once goals came down).
- Games: pro hockey.
- Tested: four seasons, regular season only: goals leader 58-74 (52-69), points leader 117-133 (121-153), assists a
  goal 1.3. test/hk-lines.js 240 of 240 (the clips read hkGoalNames). Sources: https://www.thescore.com/nhl/news/3268277,
  https://www.thescore.com/nhl/news/2894890, https://thescore.com/nhl/news/2627081,
  https://www.hockey-reference.com/leagues/NHL_2024_skaters.html
- Not yet: 5-11 men score 50 (real 1-5) and 26-48 score 40. The roster carries ten skaters where a club dresses
  eighteen, so its forwards share the whole team's goals; the named depth goals were a round-93 decision (the score's
  goals must all be named) and stay.

## Soccer: the Golden Boot
- What: the striker's share of a side's goals 38% -> 29%, wingers 26 -> 28, midfield 20 -> 23, centre-backs 8 -> 11,
  full-backs 8 -> 9 (`SC26`), and the finishing lean held to 1.4x (`scLean`), src/soccer/75_screens.js.
- Why: the league's top scorer reached 48 (with the cups) and 34 on average in the league alone.
- Games: English football.
- Tested: three seasons, Premier League games only: Golden Boot 33, 28, 24 (real 36, 27, 29); assists leader 17-24.
- Not yet: goals a game swing 2.6-3.7 between seasons (real 2.8-3.3), the match engine's.

## Baseball: walks and shutouts like the majors'
- What: base walk rate 0.080 -> 0.066, a starter's day-to-day form 0.12 -> 0.02, and a 0.035 edge to the hitters so
  runs hold (`BS26` in src/baseball/50_game.js). Reliever decisions are left to the baseball branch.
- Why: about one game in five had a shutout, and walks ran 9.7% of AB+BB.
- Games: MLB.
- Tested: two seasons: games with a shutout 17.8-19.9% -> 13.1-14.9% (13.2% in 2024: 321 in 2,429); walks 9.7% ->
  8.7% of AB+BB (8.2-8.6% of plate appearances in 2023-25); runs a side 4.27-4.32 -> 4.46-4.49 (4.39 in 2024); home
  run leader 48-54 (54, 58, 60); batting leader .341-.342. Sources:
  https://www.mlb.com/stats/team/pitching/era/2024?split=h and ?split=a,
  https://blogs.fangraphs.com/more-walks-more-runs-an-early-look-at-offense-with-the-arrival-of-the-abs/,
  https://nowtakingthefield.substack.com/p/overall-2024-mlb-stats-in-historical,
  https://www.mlb.com/news/every-50-home-run-season
- Not yet: the league batting average rose .242 -> .254 (real .243). Most of the scoreless games come from the plan
  read (a right read takes about a quarter off the hitters), which is the game's and stays.

## Awards in the other leagues
- What: checked, not changed. Ten seasons each, MVP by position: NBA PG 3, PF 3, SF 2, SG 1, C 1; NHL C 4, LW 3,
  RW 1, G 1, D 1; MLB 3B 4, SS 3, 2B, C, LF 1 each; EPL W 4, ST 3, CM 3; college basketball C 5, PF 2, SG, SF, PG 1.
- Why: the brief asked whether they share football's slot-versus-label skew. They group by slot already, and the
  spread matches the real awards' (centres and goalies win the Hart, wingers and strikers the PFA award).

## test/boxscores.js
- What: one computer season in each game (sixteen in the NFL and ten in college for the awards, two in the NBA), the
  leaders held to bands around the last three real seasons, basketball's box lines checked against the game, and the
  award splits. Added to test/run-all.js's fast tier.
- Tested: MATCH, 41 checks, about 55 seconds.

# Follow-up

## The merged build's soccer page didn't load
- What: the soccer branch's `SC26` (50_game.js) and this branch's `SC26` (75_screens.js) were both declared, so
  dist/soccer-coach.html at 3e83a72 stopped with "Identifier 'SC26' has already been declared". Mine is now
  `SC_GOAL26`.
- Games: English football.

## Soccer: the names follow the team sheet
- What: the box score, the feed, the highlights and the stats pages read who was on the pitch from the sheet
  (`drives[0].xi0`, 1 where the man behind started) and its changes (`d.sb`, the units changed as stretch `d.seg`
  began, at minute seg*5): `scOnAt` in src/soccer/75_screens.js. Each man's minutes come from it (a starter changed at
  minute m plays m, the man who came on the rest, 120 with extra time); only men who played get a line; a goal goes to a
  man on the pitch at its minute, an assist to another, a clean sheet to a defender with 60 minutes; the keeper's line
  is the keeper who started. Minutes are a new stat (`min`, from engine 26 only). The highlights' eleven names the
  sheet's men and leaves the partners the roster doesn't carry unnamed. With that sound, the computer rests its keeper
  too, in a cup tie against a lower division when his deputy is close (as clubs play a cup keeper), and you can swap
  yours on the sheet.
- Why: a rested starter could be credited with goals, so keepers were never rotated.
- Games: English football.
- Tested: a season of a club's own games: 43 games, 341 changes, 0 lines and 0 goals for men off the pitch, 4 starts
  for the deputy keeper (test/boxscores.js); eight seasons, the first-choice keeper rested 336 times, every one in such
  a tie (test/sc-manager.js, its check changed from "never rested"); test/sc-keeper.js reads the sheet for the keeper
  who made a save.
- Not yet: sc-manager's goals a game (2.69) and draws (28-29%) sit just outside its bands over eight seasons, and did
  so at 3e83a72 too (2.69 and 28.3% with only the rename): the soccer branch's match engine, not this change.

## Basketball: threes and blocks like the league's
- What, threes (src/basketball/50_game.js, engine 26): the plans' three-point shares 0.18 and 0.64 become 0.29 and
  0.49 (`AGGR26`), and no side takes under 0.20 or over 0.53 of its shots from three, style and shape included
  (`BB26_SHR`). The pace is as it was. A plan's fit is paid as before, the part its own shots no longer carry on its
  other shots (`BB26_FIT`), so the shown fit still holds and the best-shooting sides aren't made better shooters than any
  real one. In the box score no one takes more than 26% of his team's threes (`BB_USE3`, src/basketball/10_players.js).
- What, blocks: a rim protector's lean counts four times, a centre's role 1.5 times, and the team blocks 0.21 of the
  other side's missed twos, from 0.18 (`BB_BLKX`, `BB_BLKC`, `BB_BLK26`). Lines only.
- Why: a side that let it fly all season took 60 threes a game and its shooter made 537-608; the blocks leader sat at
  2.1-2.3.
- Games: NBA, college basketball.
- Tested: two NBA seasons: sides' threes tried a game 14-62 -> 24-45 (2024-25: 34.6-48.2 of the 25 sides listed);
  made 13.6 -> 12.5 a side (about 13.5); leader 580/608 -> 345 average (301-357); blocks leader 2.2-2.3 -> 3.6 (3.0-3.8),
  team blocks 4.3 -> 5.0. College three-point leader 3.5 a game (3.7-4.5). Plans' worth, engine 25 against 26 on the
  same dice, 8,000 games a gap (test/bb-plans.js run at each): every cell within a point. Sources:
  https://www.landofbasketball.com/yearbyyear/2024_2025_season_leaders.htm (and 2023-24, 2022-23),
  https://www.statmuse.com/nba/ask/3pt-attempts-team-leaders-2024-2025,
  https://www.sports-reference.com/cbb/leaders/fg3-player-yearly.html
- Not yet: the sides' three-point percentages run 31.5-39.9% (about 33-39% real), from the shapes.

## Football: interceptions thrown
- Not done. The leader throws 22-36 (real 15-21) because his side does: over twenty computer seasons the sides threw
  13-15 interceptions at the median and 22-36 at the most. The starter
  rightly throws all of his side's. The spread is the drive engine's (turnovers bunch on the weak sides), and a real
  side would bench a quarterback long before 30, so either fix moves results: it waits for the football owner.

## test/boxscores.js
- What: the NBA's sides' threes (fewest, most, made a game), the three-point and blocks leaders; college's three-point
  leader; soccer's sheet checks above. 25 basketball and 5 soccer checks.
