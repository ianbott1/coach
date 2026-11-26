# Review round 3, branch rv3/fb-tactics: football's game day (engine 27)

Game-day coaching in college and pro football: a weekly game plan with real levers on both sides of the ball, and the
calls a head coach makes during the game (fourth downs, two-point tries, timeouts, challenges, half-time) at the rates
real coaches make them. Everything that moves a result is gated on `ENGINE_V >= 27` (`fb27()` in
src/football/51_tactics.js); `ENGINE_NOW` is 27. A season begun on engine 26 replays exactly
(`OLD=/home/claude/dist-e26 node test/engine-replay.js football`: MATCH). Test: `node test/fb-tactics.js` (about 50
seconds, both leagues; in the fast tier). `node test/fb-tactics.js --calib` prints each option's neutralizer.

## 1. One engine for every game; fourth downs and two-point tries at real rates
- What: on engine 26 a game you watched ran makeLiveGame (with fourth-down and two-point calls) and every other game ran a
  shorter loop with neither. On engine 27 every game runs makeLiveGame (`playGame27`), with nobody calling for the
  computer's sides. A drive that dies at fourth down is now the coach's choice: go, kick or punt, from a go-rate table by
  field zone and distance (own side, midfield, outside field-goal range, in range), raised late when behind and in the
  last two possessions (`fb27GoRate`, `fb27Fourth`). A go is played from the stall (`fb27Resolve`), a long kick is tried
  at the league's distances. Two-point tries follow the chart late and a small base rate earlier (higher after half-time),
  made at the league's rate (`fb27TwoGo`, `fb27TwoOk`); extra points miss at the real 4% (NFL) and 2% (college).
  Your fourth-down and two-point calls read the computer's choice as the assistant's answer (`dp.rolled`, `dp.auto`), and
  the verdicts grade a two-point call against it (`verdictDefault`, 75_screens).
- Why: computer games never went for it on fourth down or for two, and the shown fourth-down and two-point choices
  meant nothing for the other 15 games a week.
- Numbers (test/fb-tactics.js, 3 NFL seasons, 2 college; real):
  - NFL fourth downs gone for: 0 in computer games on engine 26; now 1.41 a team-game, 53.9% made. Real 1.47 (2023,
    51.8% made), 1.40 (2024, 56.8%) https://bracketology.engr.wisc.edu/nfl-analytics-recap-of-the-2024-regular-season/,
    766 tries in 2024 at 57% https://www.foxsports.com/stories/nfl/why-nfl-offenses-going-fourth-down-more-than-ever
  - College: 1.74 a team-game, 52.6% made. Real 3.6 a game for both teams (2022), 3.64 (2025), 54-55% made
    https://www.ksat.com/sports/2025/11/12/college-football-picks-trend-of-going-for-it-on-4th-down-continues-to-rise-and-so-does-success-rate/
  - NFL two-point tries: 10.8% of touchdowns, 47.8% made. Real 9.8% in 2024 (4.4% in 2014), 47.6% over five seasons
    (bracketology link). College: 9.3%, 50.5% made; real 493 tries in 2024, 45.8% made
    https://www.nbcsports.com/college-football/news/college-football-coaches-are-going-for-two-and-converting-at-the-highest-rate-since-the-1970s
- Games: college and pro football. Files: src/football/51_tactics.js (new), 50_drives.js (rollDrive, driveOdds,
  playGame, makeLiveGame's fourth and two), 75_screens.js (verdictDefault).
- Tested: test/fb-tactics.js, test/two-point.js, test/fb-leadup.js, test/plans.js (all MATCH).
- Not yet: college goes for it a little less often than the real 1.8 a team-game. A fourth down is still decided at the
  drive's stall, not play by play.

## 2. Interceptions like the NFL's
- What: a drive's turnover is split into interceptions and fumbles at the league's own rates (`fb27To`), each following
  the gap between the teams less steeply than engine 26's single turnover number; the rest of engine 26's turnovers are
  stalls. A team's interceptions follow its plan (a passing mix and a blitz throw more of them).
- Why: the NFL's interceptions leader threw 26 to 28 a season on engine 26 (one club threw 28 as a team), against 15 to
  21 for the real leaders, 2019-2024.
- Numbers: NFL interceptions leader by season, engine 26: 28, 27, 21, 22; engine 27: 17, 18, 17 in the test (15 to 20
  over eight seasons in the probe); team high 20-22 a season. NFL interceptions a team-game 0.73 to 0.62 (real about 0.65-0.7).
  College leader 23, 23 to 19, 16. Points a team-game, NFL 22.55 to 22.70, college 26.70 to 26.81 (drive scoring held to
  the league with `FB27.tdK`, `fgK`).
- Games: both. Files: 50_drives.js (rollDrive), 51_tactics.js (FB27).
- Tested: test/fb-tactics.js (leader 15-21, none over 23), test/boxscores.js, test/statsum.js.

## 3. The weekly game plan
- What: five levers for each side (`GP_OPT`): on offense the run-pass mix (Lean on the run, Balanced, Throw it more)
  and the tempo (Slow it down, Usual tempo, Hurry-up); on defense the coverage (Man one deep, Zone one deep, Zone two
  deep, Man two deep), the pressure (Rush four, Usual pressure, Blitz often) and a key (Play it straight, Key on their
  back, Double their top receiver, Spy the quarterback). Each changes the other side's drives two ways
  (`fb27Mods`): a style on every drive (touchdowns, big plays, interceptions, fumbles, how long drives last, and the
  game's possessions for the mix and tempo: `GP_STYLE`, `GP_DSTYLE`, `fb27Drives`), and an edge that depends on both
  rosters' units (`fb27Units`, rating points against the team's own rating): the mix against how their coverage and front
  compare with your passing and running games, against their shell (throwing into two deep pays less, running into
  them more); man coverage against your corners and their receivers; the blitz against their line and your rush, and
  against an accurate quarterback; a key against a real standout. Each option's own worth against an even spread of
  the other side's plans is held to about nothing (`GP_C`, measured), a small edge earns nothing (a dead zone) and a
  lean costs a little (`cm`), so the matchup decides and the balanced choice is right when the matchup is even.
- The computer's clubs plan from their rosters and habits (`fb27CpuOff`: the matchup through a club's lean, a hurry-up
  club in five, a slow one in seven; `fb27CpuDef`: the club's usual scheme drawn for the game, man under two deep with
  better corners, a key on a clear standout). At half-time a computer offense well behind throws more and one well ahead
  runs; a computer defense that changes its scheme changes its coverage and pressure. Your assistant draws your plan the
  same way.
- The next game's card carries the plan (src/football/76_gameplan.js): each lever's buttons, a line on what the
  chosen option costs and does, your assistant's choices marked, and Use your assistant's. A tap changes the plan for
  that game only (`S.fbGP`, kept in the save; last season's are dropped). A Scouting list says what the film shows
  without picking for you: their usual defense, their offense's lean and tempo, where your passing and running games,
  your corners and their receivers, your rush and their line stand, an accurate or running quarterback, a standout.
- Why: on engine 26 a football coach's week was one plan word (safe, balanced, aggressive); nothing about how to attack
  this opponent or defend it.
- Numbers (test/fb-tactics.js):
  - each option's worth against an even spread of plans: at most 6.3 Elo (NFL) and 5.4 (college), most under 3
  - the blitz: against it 25.3% of drives end in touchdowns (22.3% against a four-man rush) and 6.3% in interceptions
    (5.7%): high risk both ways, even on average. Real: about a quarter of dropbacks blitzed (25.4% outside the red zone,
    2024), quarterbacks' yards an attempt 7.3 to 8.6 against it and EPA a dropback near zero over 2011-24
    https://www.sharpfootballanalysis.com/analysis/nfl-offense-struggles-blitz-2024-warren-sharp/amp/
  - a passing plan against two deep: margin -0.15 against +0.23 against one deep (two-high shells behind the blitz rose
    from 23.1% to 28.1%, 2020-24, to take away the big play:
    https://www.yardbarker.com/nfl/articles/nfl_defenses_are_bringing_blitzing_back/s1_17304_41038171)
  - matchup terms: a rush six rating points better than the line is worth 26 Elo to the blitzing side; an accurate
    quarterback 19 back; corners six points better than the receivers 29 Elo to man coverage
  - no single plan wins in most matchups: over every pairing of a league's clubs, the best mix against their assistant's
    defense is Throw it more in 48% (NFL, 992 pairings) and 46% (college, 17,292), Lean on the run 40% and 45%, Balanced
    the rest; the best coverage at most 37%, the best pressure at most 50% (Usual pressure); the best whole plan at most 9%.
- Games: both. Files: 51_tactics.js, 50_drives.js (makeLiveGame: `st.gp`, `st.m27Now`, the drive's changes and Elo,
  possessions), 76_gameplan.js (new: the card, `sportNextExtra`, `sportBind`), 72_highlights.js and 75_screens.js
  (the clock reads the game's possessions: `fbTot`).
- Tested: test/fb-tactics.js; the card rendered in the headless harness for both leagues and a tapped plan reaches the
  game's context (checked by script; not a test of its own).
- Not yet: the plan can't be changed from the live bar (only at half-time, below). The key on a player has no line of
  its own in the box score. The units are read from ratings and leans; no week-to-week film beyond the club's habits.

## 4. Half-time, timeouts and challenges
- Half-time: your first possession after the break asks for a change of plan, with the first half's film: both
  offenses' touchdowns, field goals and turnovers on their drives, their shell, pressure and run-pass lean, and up to
  three changes that differ from your plan (throw more, run more, two deep against a passing team, a safety down against
  a running one, blitz more or rush four). Logged as a half call (ungraded).
- Timeouts: three a half. The offense burns one on about one drive in ten; the last drive of a half with one left scores
  6% less, with none 14% less. When you sit on a lead, a computer side behind with two timeouts in the half uses them to
  stop the clock and gets one more possession.
- Challenges: a close call against a side, on a drive it could turn (a third-down catch on your drive, theirs on a
  scoring drive; turnovers and scores are reviewed by the booth). The booth reads it one of three ways; the computer
  throws the flag 10%, 50% and 90% of the time by the read and wins 10%, 35% and 65% of them. A challenge needs a
  timeout and costs one when lost; two a game in the NFL (a third after winning both), one in college (a second after
  winning it). Won, the drive is looked at again and the challenger gets the better result. Yours is asked when your
  booth thinks it could be wrong and the game is in reach; otherwise your assistant decides.
- Numbers: NFL challenges 0.23 a team-game, 53.9% won; college 0.12, 48.8%. Real NFL: 51.5 in the first seven weeks over
  2021-24 and about 60 in 2025 (about 0.25 a team-game), 40% overturned in 2024 and 60% in 2025
  https://www.tsn.ca/nfl/article/why-nfl-replay-reviews-are-succeeding-at-unprecedented-rates-n1-46675881/; coaches'
  career rates 0.28-0.52 a game https://operations.nfl.com/stats-central/stats-articles/how-do-nfl-coaches-use-their-challenges.
  College has had one coach's challenge a game since 2006, rarely used beside the booth's reviews.
- Games: both. Files: 51_tactics.js (`fb27HalfCall`, `fb27Clock`, `fb27Close`, `fb27ChalDo`, `fb27ChalCall`),
  50_drives.js (the asks and their answers).
- Not yet: no timeout call of your own (yours are spent by the same rules as the computer's), no two-minute drill
  played clock by clock, no end-of-half possession bought with the defense's timeouts. The challenge's play isn't shown
  in the highlights (the drive's note says a challenge was upheld or failed).

## Tests run
- node test/fb-tactics.js: MATCH (both leagues, about 50 seconds; added to run-all's fast tier).
- OLD=/home/claude/dist-e26 node test/engine-replay.js football: MATCH (a season begun on engine 26 replays as played).
- Goldens with ENGINE_NOW=26 (fast): college 1a2a58de5b2e862e MATCH; pro cff8cc43147de1ef against 402d34ff185e18b8
  expected, the same fingerprint the branch's base (f5474a2) builds: the pro golden was already stale there, not moved
  here. Goldens and hot-seat baselines not re-recorded.
- test/migrate.js (2253 of 2253), test/saves.js, test/reload.js for both football games (18 of 18 each): MATCH.
- node test/longrun.js cfb nfl --short: MATCH (late points a team-game: college 27.0, NFL 23.5).
- node test/boxscores.js football: MATCH (13 checks). test/statsum.js, test/boxscore.js: MATCH.
- test/two-point.js, test/plans.js (cfb), test/fb-reads.js, test/fb-leadup.js, test/fb-live-names.js, test/fb-rest.js,
  test/double-finish.js, test/late-calls.js, test/sim-parity.js, test/fb-verdicts.js (nfl, 60), test/verdict-agree.js,
  test/plan-line.js, test/hl-hurt.js: MATCH.
- test/fb-live-names.js needed a third college career: on engine 27's dice its two careers had only 2 games with
  someone hurt (it asks for more than 3); with three, 9 of 31.
- Browser tests (Playwright) not run here.
