# Calibration review: do the seven games play like their real leagues?

Measured Nov 2026 (realism review, engine 24 -> 25) with `test/realism.js`, which plays whole seasons
headlessly with every coach on the computer and records, for every game, the chance the card showed
before the game (the same `winProb` the screens use) and what happened.

    node test/realism.js <league> [seasons] [--assist] [--json=out.json] [--dist=dir]

`--assist` puts one club on the assistant (the plan "auto") to compare the board's target with what that
club actually wins. "Before" is 02eb24b, this branch's starting point (engine 24, built from `git archive`), "after" is this branch. Seasons: NFL 40, college football 12, college basketball 6,
NBA 40 (20 for the final NBA rows), NHL 8, EPL 4, MLB 8. Real figures are each cited once at the bottom.

## Reading the shown chance (reliability)

"Favourite shown -> won" bins every regular-season game by the chance shown to the favourite. A good card
says 70% and the favourite wins about 70%.

| League | Before: favourites shown / won | After | Worst bin before | Worst bin after |
|---|---|---|---|---|
| NFL | 65.9% / 64.4% | 66.7% / 65.7% | shown 87% won 82%, 92% won 80% | within 1 pt to 87% |
| College football | 73.6% / 70.9% | 71.8% / 70.9% | shown 88% won 84%, 77% won 73% | 72% won 69% |
| College basketball | 73.0% / 72.5% | 72.3% / 71.8% | within 3 pts | within 2 pts |
| NBA | 70.7% / 70.0% | unchanged | within 2 pts | - |
| NHL | 59.8% / 59.5% | 60.3% / 59.4% | within 2 pts | 72% won 69% |
| MLB | 57.4% / 59.8% (under-confident) | 57.3% / 57.7% | shown 62% won 67%, 67% won 74% | within 1 pt to 72% |
| EPL (Premier League games) | home win shown 45.6% -> 46.2%, draw shown 24.2% -> 23.4% | unchanged | - | - |

The live chance (in-game) was checked separately for the college basketball report "down 8 on the road
with 5:00 left shown 6%": the game shows about 2.6% for down 10 with 5 minutes left, and KenPom's 238
games with a 10-point lead and 5 minutes left had the trailing side win 6 (2.5%). Down 8 on the road at
about 6% is in line. Not changed.

## League by league

### NBA (basketball-coach-pro)

| | Game before | Game after | Real |
|---|---|---|---|
| Points a side | 114.2 | same | - |
| Home sides win | 59.0% | 58.9% (kept) | 54.4% (2024-25) |
| Wins sd / best / worst | 12.6 / 66.0 / 16.1 | 12.6 / 66.2 / 15.8 | 13.1 / 68 / 17 (2024-25) |
| Playoff series 4-0 / 4-1 / 6-7 games | 19.3 / 32.5 / 48.2% | same | 18 / 28 / 54% (since 1996) |
| Better seed wins a series | 74.3% | same | 73.9% (home-court team, since 1996) |
| Board target minus wins, sd (computer club / assistant) | 10.9 / 12.1 | 5.6 / 7.4 | - |

The playtest's 62-20 Minnesota against a 47-win target was the board, not the dice: the target came from
the club's long-run "program" rating, not this roster. Over 40 seasons with the assistant, targets missed
the wins by 12 on average (Orlando 7-75 was told WIN A SERIES; New Orleans 54-28 was told REBUILD).
Engine 25 sets the target from the sum of the shown chances over the club's schedule at the start of the
season (before any plan), so a target means what a team of that strength wins. Its error is now down to
the season's own luck (wins minus the start-of-season sum: sd 7.1, of which dice alone 4.1, the rest
injuries and in-season form; real preseason projections miss by about 7 wins in MLB, see FanGraphs).

Home court was tried at 30 (home sides 54.1-54.4%, ESPN 2024-25 54.4%) and reverted: playoff sweeps rose
from 19.3% to 27.5% (real 18%) and six- and seven-game series fell to 44%. Before, the large home edge was
what kept series long. The underlying gap: in the playoffs 27% of series open with the favourite at 80%+
a game, and half of those are sweeps. A playoff-only softening of the game edge (tried at 250 and 200)
did not move sweeps, so the cause sits in the basketball engine's playoff ratings (stars' minutes and
health by April), which another branch is changing. Left for a later round, with this measurement to start from.

Injuries: 1.0 a starter a team-season, about 34 games out each, 36% of them season-long. Not changed.

### NHL (hockey-coach-pro)

| | Game before | Game after | Real (2024-25) |
|---|---|---|---|
| Goals a side | 3.2 | 3.2 | - |
| Home sides win | 51.8% | 54.4% | 56.3% (incl. overtime) |
| Points sd / best / worst | 15.4 / 125 / 64 | 15.9 / 127 / 62 | 14.6 / 116 / 52 |
| Series 4 / 5 / 6 / 7 games | 18 / 25 / 27 / 30% | 21 / 24 / 26 / 29% | - |
| Better seed wins a series | 67% | 59% | - |
| Board target minus wins (computer) | -1.9, sd 8.1 | -1.9, sd 3.3 | - |

Home ice raised (hfa 20 -> 55). A rating-gap scale was tried and made no measurable difference. The best
records run about 10 points above the real best; left (the spread is in-season form, not the dice).

### NFL (football-coach-pro)

| | Game before | Game after | Real (2024) |
|---|---|---|---|
| Points a side | 22.6 | 22.6 | 22.9 |
| Home sides win | 51.8% | 53.1% | 53.3% |
| Margin mean | 11.5 | 11.8 | - |
| Wins sd / best / worst | 2.7 / 14.1 / 2.9 | 2.9 / 14.5 / 2.8 | 3.65 / 15 / 3 |
| Shown chance, top bins | 87% won 82%, 92% won 80% | 87% won 87%, 91% won 95% | - |
| Drives: TD / FG made / punt / turnover / downs | 25.1 / 16.6 / 36.9 / 13.7 / 5.0% | 25.1 / 16.6 / 36.7 / 13.9 / 5.0% | 38.8% of drives scored in 2024 (game: 41.7%) |
| Board target minus wins (computer / assistant) | -0.9 sd 2.9 / 0.0 sd 3.4 | 0.5 sd 2.2 / 1.9 sd 2.4 | - |

The rating gap counts 1.2 times as much in a drive (closer to the real spread of records) and the card's
chance was refitted to it (k 290 at balanced). The playtest's "60% of drives touchdowns, no field goal
tries" is one game's dice: across 10,880 games a side scores touchdowns on 60%+ of eight or more drives
without a kick in 0.7% of team-games, and drives league-wide end in touchdowns 25% and field goals
(made or missed) 19%. An average offence scored 41.25 touchdowns in 2024 (2.4 a game; the game: 2.5).
The record spread is still a little narrow (sd 2.9 against 3.65).

### College football (football-coach)

| | Game before | Game after | Real |
|---|---|---|---|
| Points a side | 26.8 | 26.8 | 27.8 (FBS 2023) |
| Home sides win | 58.2% | 58.2% | 63.8% (FBS 2022-24, includes FCS visitors) |
| Favourites shown / won | 73.6 / 70.9% | 71.8 / 70.9% | - |
| Board target minus wins (computer / assistant) | -0.3 sd 2.0 / -2.5 sd 1.5 | 1.3 sd 1.6 / 0.0 sd 1.2 | - |

The shown chance was overconfident from 75% up; refitted (k 464 at balanced). The home edge is short of the
real figure, but the real one counts the FCS visitors this game does not schedule; left.

### College basketball (basketball-coach)

| | Game before | Game after | Real |
|---|---|---|---|
| Points a side | 71.9 (5-95th 52-91) | 72.1 | - |
| Home sides win | 61.0% | 61.1% | 64.3% in 1996-97 (KenPom), lower since |
| Injuries to starters a team-season | 2.3 (cost 99 rating points) | 1.7 (cost 76) | 12.1 per 1,000 competition exposures, 41% time-loss |
| Board target minus wins (computer / assistant) | -2.2 sd 3.3 / -3.0 sd 4.3 | -0.3 sd 2.9 / 1.0 sd 1.4 | - |

The playtest's injuries swinging the chance 49% -> 82% came from long college injuries priced like pro
ones: an injury now happens 3/4 as often and costs 0.9-1.5 times the man's worth instead of 1.05-2.1,
capped at 180 rating points. The CONTEND team going 11-20 was the board again (target from program, not
roster). Scores like 116-110 or 38 points are the 1-in-1,000 tails (sd of points 12.1 a side, 5-95th
52-91). The NCAA field of 76 with 12 opening-round games is right for seasons after
2026 (NCAA, May 2026). Seeding: of 20 teams with three losses or fewer, 13 got a 1 seed; the 1-4 seeds
average power rank 9.4; a 31-2 mid-major ranked 30th in power got a 7-10 seed, as the committee does.
Gonzaga 28-2 as a 5 seed fits a weak schedule. Not changed.

### MLB (baseball-coach-pro)

| | Game before | Game after | Real (2024) |
|---|---|---|---|
| Runs a side | 4.4 | 4.3 | 4.39 |
| Home sides win | 53.6% | 52.5% | 52.2% |
| Wins sd / best / worst | 15.2 / 110.6 / 48.4 | 12.7 / 104.4 / 53.9 | 12.3 / 98 / 41 |
| Favourites shown / won | 57.4 / 59.8% | 57.3 / 57.7% | - |
| Postseason: better seed wins | 69% | 58% | - |
| Board target minus wins (computer) | -11.9, sd 7.8 | -4.3, sd 4.7 | - |

The rating gap inside a game counts 0.75 as much (records spread like MLB's, the card's chance honest).
Wins minus the start-of-season sum still has sd 11 against 6.3 for dice alone: the start-of-season chance
does not know rotations and attributes the engine uses, so the board can still be off by ten wins. Left;
the fix belongs in the start chance, not the engine.

### EPL (soccer-coach)

Premier League games: 3.1 goals a game, home W/D 46.1% / 23.6%, both within a point of the card. PL points
best 92, worst 24. Not changed. The board's targets here are table places, not wins, and were left as they were.

## What is left

1. NBA playoff series are decided too easily once the home edge is realistic (sweeps 27.5% at a 54% home rate).
2. NBA home court 58.9% against 54.4% (kept, see above).
3. MLB start-of-season chance misses rotation quality (season residual sd 11 against 6.3).
4. NHL and NBA best records run a little high; NFL record spread a little narrow.
5. `test/hk-engine.js` no longer runs (`planAmpV` undefined); not touched here.

## Sources

- NBA 2024-25 standings (home records, best/worst): https://www.espn.com/nba/table/_/season/2025
- NBA best-of-seven lengths and home-court team since 1996: https://nba-comeback-dashboard.github.io/analysis/playoff_series.html
- NHL 2024-25 standings: https://www.espn.com/nhl/standings/_/season/2025/group/league
- NFL 2024 standings: https://www.espn.co.uk/nfl/table/_/season/2024/group/league
- NFL 2024 scoring drives (38.8%) and touchdowns per offence (41.25): https://bengretch.substack.com/p/touchdowns-mattered-more-to-fantasy
- MLB 2024 standings: https://www.espn.in/mlb/table/_/season/2024/sort/losses/group/overall
- Projection error in MLB: https://blogs.fangraphs.com/lets-make-sure-were-honest-about-projections
- FBS scoring 27.78 a team (2023): https://www.cbssports.com/college-football/news/college-football-offenses-continue-declining-in-key-categories-resulting-in-lowest-scoring-season-since-2009
- FBS home teams 63.8% (2022-24): https://philsteele.com/home-field-edges-part-one-the-last-3-years-home-field-records-straight-up/
- College basketball home teams 64.3% (1996-97, KenPom): https://www.cbssports.com/college-basketball/news/how-the-home-court-advantage-in-college-basketball-is-shrinking-this-season-due-to-fewer-fans-at-games
- College basketball late leads: https://kenpom.com/blog/?p=395
- NCAA men's injuries: https://nata.kglmeridian.com/view/journals/attr/56/7/article-p681.xml
- NCAA tournament to 76 teams: https://africa.espn.com/mens-college-basketball/story/_/id/48704864/ncaa-mens-women-basketball-tournaments-expand-76-teams
