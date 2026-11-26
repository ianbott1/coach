# Realism review (branch rv/realism)

All behaviour changes are gated on engine 25 (`ENGINE_NOW` 24 -> 25 in src/core/20_engine.js): a season
begun on engine 24 replays exactly as before. Measurements: `node test/realism.js <league> <seasons>
[--assist]`; full before/after tables and every source in docs/calibration-review.md.

## Measurement tool and calibration report
- **What changed:** new `test/realism.js` (margins, points, home win rate, reliability of the shown chance by
  bin, win spread, series lengths and upsets, injuries, football drive outcomes, start-of-season expected
  wins against results, the board's target against wins, with `--assist` for a club on the assistant).
  New docs/calibration-review.md.
- **Why:** the playtest's complaints needed numbers over thousands of games, not single games.
- **Which:** all seven.
- **How tested:** ran on the engine-24 build and on this branch for all seven (runs listed in the review).

## Board targets from what this roster should win
- **What changed:** `expectations()` (src/core/99_app.js) now passes the sum of the shown chances over the
  club's regular-season schedule, before any plan, to each league's `goals.expectations(p, xw)`
  (`byWins:true` in nba, nhl, mlb, nfl, cfb, ncaab 26_offseason.js). Tiers by expected wins, e.g. NBA 54+
  CONTEND, 47+ WIN A SERIES, 40+ MAKE THE PLAYOFFS, 31+ REBUILD. The hot seat and the firing checks use
  the same function. EPL keeps its table-place targets.
- **Why:** targets came from the long-run program rating. NBA 62-20 Minnesota was given 47; over 40
  assistant seasons targets missed wins by sd 12 (Orlando 7-75 told WIN A SERIES). College basketball's
  CONTEND team going 11-20 was the same cause.
- **Which:** NBA, NHL, MLB, NFL, college football, college basketball.
- **How tested:** board target minus wins, sd: NBA 10.9 -> 5.6 (computer club, 20 seasons) and 12.1 -> 7.4
  (assistant); NHL 8.1 -> 3.3; MLB 7.8 -> 4.7; NFL 2.9 -> 2.2; college football 2.0 -> 1.6; college basketball
  3.3 -> 2.9. The assistant ends 0-2 wins over its target on average (its plans add ~1.8 wins, se 1.3).

## MLB: records spread like MLB's
- **What changed:** the rating gap inside a baseball game is scaled by 0.75 (`tuning.gap25`, src/baseball/50_game.js).
- **Why:** wins sd 15.2, best 110.6, worst 48.4 against 2024's 12.3 / 98 / 41; favourites won 59.8% when
  shown 57.4%. Source: https://www.espn.in/mlb/table/_/season/2024/sort/losses/group/overall
- **Which:** MLB.
- **How tested:** 8 seasons: wins sd 12.7, best 104.4, worst 53.9; favourites 57.7% shown 57.3%; home 52.5%
  (real 52.2%); 4.3 runs a side (real 4.39).

## NFL: rating gap and the shown chance
- **What changed:** the gap in a drive counts 1.2 times (`tuning.gap25`, src/football/50_drives.js); the card's
  chance refitted (`wpK25` 249/290/380).
- **Why:** wins sd 2.7 against 3.65 in 2024; the top bins overconfident (shown 87% won 82%, 92% won 80%);
  home 51.8% against 53.3%. Source: https://www.espn.co.uk/nfl/table/_/season/2024/group/league
- **Which:** NFL (college football shares the drive code but has no gap25, so it is unchanged).
- **How tested:** 40 seasons: favourites 65.7% shown 66.7%, every bin within a point to 87%; wins sd 2.9,
  best 14.5; home 53.1%; 22.6 points a side (real 22.9). Drives: TD 25.1%, FG 16.6%, punt 36.7%; scoring
  drives 41.7% against 38.8% in 2024 (https://bengretch.substack.com/p/touchdowns-mattered-more-to-fantasy).
  The playtest's 60% touchdown game: 0.7% of team-games.

## College football: the shown chance
- **What changed:** `wpK25` 401/464/612 for the card's chance.
- **Why:** favourites shown 73.6% won 70.9%; 88% won 84%.
- **Which:** college football.
- **How tested:** 12 seasons: shown 71.8% won 70.9%, bins within 1-3 points.

## College basketball: injuries
- **What changed:** `tuning.inj25`: injuries 0.75 as often, cost 0.9-1.5 of the man's worth (was 1.05-2.1),
  capped at 180 rating points (src/core/20_engine.js `injTune25`, same random draws).
- **Why:** 2.3 starters a team-season costing 99 points swung a game's chance 49% -> 82%. NCAA men's
  basketball: 12.1 injuries per 1,000 competition exposures, 41% time-loss
  (https://nata.kglmeridian.com/view/journals/attr/56/7/article-p681.xml).
- **Which:** college basketball.
- **How tested:** 6 seasons: 1.7 a team-season, cost 76; points, margins and reliability unchanged.

## NHL: home ice
- **What changed:** `hfa` 20 -> 55 on engine 25.
- **Why:** home sides won 51.8%; 2024-25 56.3% with overtime (https://www.espn.com/nhl/standings/_/season/2025/group/league).
- **Which:** NHL.
- **How tested:** 8 seasons: home 54.4%, shown chance still within 1-3 points by bin.

## NBA: home court tried, kept
- **What changed:** nothing in the end (hfa 30 tried and reverted in this branch).
- **Why:** at 30 home sides won 54.4% (real 54.4%, https://www.espn.com/nba/table/_/season/2025) but playoff
  sweeps went 19.3% -> 27.5% against 18% since 1996 (https://nba-comeback-dashboard.github.io/analysis/playoff_series.html).
- **Which:** NBA. **How tested:** 40 seasons at 30, 30 at 45, 20 at 60.

## NCAA tournament format and seeding
- **What changed:** nothing. The 76-team field with 12 opening-round games is the real format for seasons
  after 2026 (https://africa.espn.com/mens-college-basketball/story/_/id/48704864/ncaa-mens-women-basketball-tournaments-expand-76-teams).
  Seeding checked over 6 seasons (1-4 seeds average power rank 9.4; strong-record mid-majors seeded 7-10).
- **Which:** college basketball.

## Goldens and baselines re-recorded
- **What changed:** test/golden*.json and test/hotseat*.json for all seven games, with the note "Engine 25
  (realism review)". Engine 25 changes new careers in every game (EPL only through the engine number and
  the shared target code).
- **How tested:** `OLD=<engine-24 build> node test/engine-replay.js`: MATCH (all seven: an engine-24 season
  reloaded here replays game for game). `node test/saves.js` MATCH; `node test/objectives.js 3` MATCH 427;
  `node test/goals.js` MATCH (0 checks reached, see report).
