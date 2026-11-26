# Round 112 branch rv2/baseball: pro baseball's dugout (engine 26)

The review measured about two calls a game in pro baseball, and none of them was the real manager's job: who pitches,
who hits, who plays. Everything below is gated on `ENGINE_V >= 26` (`bsV26()`, `BS_V26`, constants in `BS26`,
`src/baseball/50_game.js`). A season begun on engine 25 replays exactly.

## 1. Handedness and the platoon
- What: every player bats left, right or both and throws left or right, from a hash of his name (no dice): about a third
  bat left, one in nine switch-hits, 28% of pitchers throw left, and each bullpen carries a lefty specialist and a
  left-handed middle reliever. A batter facing a pitcher of the other hand does better, by the league split, centred on his usual mix of
  pitchers so his rating is still what he does over a season (`bsPlat`).
- Why: the platoon is the first thing a manager plans around, and nothing in the game knew a hitter's hand.
- Size, measured (`test/bs-manager.js`, 2,000 games, 152,000 plate appearances): left-handed batters .321 wOBA
  against right-handers and .279 against left-handers (gap .042), right-handed .327 and .303 (gap .024), switch-hitters
  even. FanGraphs: gaps .041 and .024 (https://blogs.fangraphs.com/basic-hitter-platoon-splits-2002-2012). 30% of
  plate appearances come against a left-hander (about 28% in MLB).
- Games: pro baseball.

## 2. A named bullpen with roles and rest, and pitch counts
- What: nine relievers by name: the closer, set-up man and long man from the roster, and six more arms per club (a
  second set-up man, the lefty specialist, three middle relievers, a mop-up man: `bsCorps`, named and rated from the
  club and the years, rated about the league's usual reliever so a club is no stronger on average). Each pitches by
  his own rating. Rest carries between days: each game's box score notes who threw how many pitches
  (`bsNoteUse`, kept on the season, not saved: a load replays the season and keeps it again), and tomorrow's bullpen
  reads it (`bsPen26`). A man who pitched yesterday is a shade worse, much worse on a third straight day or after 25
  pitches yesterday, and isn't used then unless nobody else is left (fastballs are 0.5 mph slower on back-to-back days
  and 2.3 slower on a third: https://tht.fangraphs.com/do-relief-pitchers-suffer-from-pitching-back-to-back-days/).
- The starter's pitches are counted (the full match's own pitches, `bsPitchSeq`, moved from 72_highlights so the
  count on screen is the count he tires by). He loses a little with each pitch past 80, and hitters gain each time
  through the order (`BS26.tto`; MLB starters 2016-25 .713 / .747 / .780 OPS:
  https://www.mlb.com/glossary/miscellaneous/third-time-through-the-order-penalty). Measured: x1.046 and x1.085 by
  wOBA on 3,000 games (x1.048 and x1.094 real); 2,000 games in the test read x1.016 and x1.078 (noise).
- The manager (`penPlan26`): pulls a starter on pitches, runs or the third time through in trouble; the closer for the
  save, the set-up men for the 8th and close late innings, the long and mop-up men early and in blowouts, the lefty for
  a run of left-handed hitters; the three-batter rule (three batters or the end of an inning). The computer and your
  assistant use the same rules.
- Credit (`bsBoxDone26`, owned here per the coordinator): wins, losses and saves by name, no anonymous "bullpen" or
  "closer"; holds and blown saves; a save also for three innings finished. Season lines for the six arms off the
  roster are kept with the rest (`bsRelief`), shown in the bullpen card, the box score and the decisions line.
- Numbers, one all-computer season, engine 25 then 26 (`test/bs-manager.js`):

  | | engine 25 | engine 26 | real |
  |---|---|---|---|
  | runs a side | 4.31 | 4.28 | 4.39 (2024) |
  | starter innings / pitches a start | 5.34 / not counted | 5.22 / 85 | 5.2 / 86 (AL 2024) |
  | starters' ERA, relievers' ERA | 4.36, 4.22 | 4.41, 4.07 | 4.15, 3.97 (MLB 2024) |
  | relief appearances a game, outs each | 2.54, 4.17 (one anonymous "bullpen" line) | 3.27, 3.37 | 3.3, 3.3 (AL 2024) |
  | relievers' share of wins | 35% | 33% | 38% (AL 2024: 31 of 81) |
  | saves a club, the leader | 41.8, - | 44.6, 46 | 40.8, 49 (Helsley) |
  | holds, blown saves a club | none | 71.7, 21.1 | 89 holds (AL 2024) |
  | relief outings on no days' rest | none | 21% | 16% (AL 2024: 85 of 529) |
  | busiest reliever | - | 83 games | about 80 |
  | intentional walks a club | none | 16.4 | about 17 (2024: 507 in all) |

  Sources: https://statmuse.com/mlb/ask/average-era-for-all-starting-pitchers-in-mlb-2024,
  https://www.mlb.com/stats/team/pitching/era/2024?split=rp, https://www.baseball-reference.com/leagues/AL/2024-starter-pitching.shtml,
  https://www.baseball-reference.com/leagues/AL/2024-reliever-pitching.shtml, https://www.statmuse.com/mlb/ask/save-leader-2024,
  https://theanalyst.com/2025/03/intentional-walks-mlb-worth-the-risk. The run level was held at engine 25's (the stats
  branch moves baseball's walk rate, so the gap to 4.39 is theirs to close).
- Games: pro baseball.

## 3. The lineup card
- What: each day's nine (`bsLineup26`): a regular rests about one day in fourteen and a catcher one in six (a hash of
  the day, no dice); a backup who bats from the other side starts against a starter of the hand the regular hits
  worst, when he's two points better against him; the order is by ability against that starter (engine 5's book
  order). Your next game's card says who rests and who starts in the platoon. The bench is everyone healthy not in the
  nine, the idle catcher apart (four bats).
- Why: real regulars start about 150 games, catchers 120-130; every regular here played all 162. Rest buys little at
  the plate (five games in seven against seven: about 3 points of OBP,
  https://baseballprospectus.com/news/article/21090/baseball-therapy-what-a-difference-a-day-off-makes), so it's a
  schedule, not a boost. The best batting order gains about a win over a typical one
  (https://blogs.fangraphs.com/how-significant-is-batting-order), so the order isn't asked.
- Games: pro baseball.

## 4. The calls: who, not whether
- What: the starter's pull names the relievers (two best for the moment, with role, hand and rest) beside Leave him in;
  a new call, "pen", when the computer would change relievers from the 7th in a game within three runs (Leave him in,
  two names, the assistant); the pinch hitter offers up to three bench bats by the platoon against the pitcher now in;
  the intentional walk (from the 8th within a run, first base open, a man in scoring position, the man on deck six
  points weaker). The evidence panels show the pitches, times through the order, each reliever's rest and season, the
  hitters' hands and worth against this pitcher. The staff room (third-base coach, analytics coordinator, bench
  coach) argue for keeping him, the freshest arm, and the book's man.
- The live bar has Go to the bullpen (two taps, as a plan change): when you next take the field you're asked who comes
  in (three names, or Not yet). It's always asked.
- Gating as the call rules have it: "pull" stays gated; "pen" and "ibb" join the spread gate (asked when an option
  gains 4 points on your assistant over 120 replays; registered at run time in `SPREAD_KINDS`); the pinch call keeps
  its own narrow window.
- Honest size, on replays from the moment of the call (50 each, same dice before it, fresh after;
  `test/bs-manager.js`): best option over your assistant's about 2 points for the bullpen calls, 3.6 for the pull, 1.7
  for the pinch hitter, 2.7 for the walk; best to worst 2.5 to 6.4 points; your assistant within half a point of the
  average option over every graded call (the replays' noise). Before the gate a game brings about 0.8 pull, 1.4 pen,
  0.1 pinch and 0.07 walk calls.
- Games: pro baseball.

## 5. Found on the way
- Deadline day: the computer's clubs make their deals before the day's games (core 80_season), but your game was set
  up before them, so a club that traded a man that morning still played him against you, and his line fell out of the
  box score (`test/boxscore.js`: "hitters' 4 runs, 9 hits against 5 and 10"; the lineup card made it show). From
  engine 26, in baseball, `startLive` makes the day's deals first (`src/core/99_app.js`; nothing is drawn, so they are
  the same deals). Other sports have the same order and keep it, since their results would move: see Not yet.
- The calls' grading (core `callImpact`) replays each option besides yours and your assistant's 400 times. Baseball's
  engine-26 calls name two or three men beside keeping him, so a pinch-hit call cost three times a call anywhere else.
  Where a baseball engine-26 call has two or more such options they share the 400 replays (same dice, the first of
  them each: 200 apiece where there are two). The worth of your call against your assistant's is replayed as before. With the bullpen ranking read only
  when a change is due and the hands kept by name, the grading at the final out takes 1.06 s of CPU a game (most 2.0 s)
  against engine 25's 0.67 s (1.09 s), under the test's 4 s (`test/call-impact.js`).
- `test/bs-calibrate.js` reads ten seasons, not five, for the spread of wins: one season's spread swings 8.6 to 17.0
  by the seed, and five seasons' mean moves about 1.2 either way. On seeds 1-5 engine 26 read 15.2 (engine 25 13.2); on
  seeds 6-13 12.6 (engine 25 13.9); over ten 13.5, inside the test's band of 10-15 (MLB 2023-25).

## Tested
- `node test/bs-manager.js` (new, fast tier): MATCH (platoon, times through the order, the season's pitching shape
  against engine 25 and real figures, the calls' worth, the live button, engine 25 untouched).
- `OLD=/home/claude/dist-e25 node test/engine-replay.js baseball`: MATCH.
- `node test/bs-calibrate.js` (ten seasons now): MATCH, spread of wins 13.5, best record 109, runs 4.34, home 53.1%.
- `node test/bs-pitch.js`: MATCH 9272. `node test/reload.js dist/baseball-coach-pro.html`: MATCH 18 of 18.
  `node test/saves.js`, `node test/migrate.js` (2253), `node test/replay.js baseball` (2268 of 2268),
  `node test/statsum.js baseball --check`, `node test/boxscore.js baseball` (1375, after the deadline-day fix),
  `node test/late-calls.js` (baseball's close finishes ask pen 8, pinch 3, pull 1, steal 4, ibb 1): MATCH.
- `node test/call-impact.js`: MATCH 552 (baseball 1.03 s a game at the final out, most 1.97 s, against its 4 s line;
  under the shared machine's earlier load, about 20 on four cores, engine 25's build failed that line too).
- Goldens re-recorded for pro baseball only: fast c927c4b0c954b487 to 2655b170a3259e21, full 11ad5725c23c4f20 to
  7f30bce86d5cf599, hot seat 8cd6f6a3a427a33e to f8c632346a46fb10. The deadline-day fix and the speed-ups moved none of them
  (checked after). The other six games' fingerprints move with the engine number alone (ENGINE_NOW 26 stamps every new
  universe; with ENGINE_NOW=25 this build matches basketball's fast golden, eb3fad6e09ffd401): not re-recorded here.

## Not yet
- Setting the lineup card yourself (order, rest, platoon): the computer and your assistant write it, and the card says
  what changed.
- Pinch-running and defensive replacements.
- Steal and bunt: the steal call is as before; no sacrifice bunt (the engine has no bunt).
- The six relief arms off the roster can't be traded, signed or developed; they turn over every three years or so.
- The holds board and relievers' leaderboards (the bullpen card shows your club's).
- Deadline day in the other sports: a club that trades a man that morning still plays him against you (core
  `startLive` runs before the day's deals). Fixed for baseball on engine 26 only; the others need their own engine bump.
- Browser checks (Playwright isn't installed): the bullpen card, the live button and the box score were checked
  through the harness only.

## Follow-up: re-tuned on the merged build
On the merge with the stats branch (its rates as `BS26R`: walks 0.066, a starter's form 0.02, the hitters' edge 0.035)
pro baseball failed three bs-manager checks (runs 4.52 a side, the left-handed platoon gap .057, starters' ERA below
relievers') and longrun's wins spread (16.5 a season against a band of 10-15.5; MLB 2024 12.3). All changes are on
engine 26 only.

### Changes
- `BS26R` (src/baseball/50_game.js): walks 0.062, the hitters' edge 0.050, form kept at 0.02, and a new `g` 0.5: the
  clubs' strength gap counts half on the day, the home edge in it whole (without that, home sides fell to 51.8%).
- The chance shown before a game: a hook, `sportWpEdge`, in core `winProb` reads the gap the way the games play it
  (0.72 of the edge, home edge whole). Favourites were shown 57.4% and won 55.4%; now shown 55.7%, won 55.8%.
- The dugout: platoon for left-handed hitters 0.068 to 0.054, times through the order 0.021 to 0.017, relievers' rp0
  -0.05 to -0.033, the left-handed relief arms a little better (lefty specialist +1, left-handed middle man 0).
- A reliever on a busy pace (12 games or more and over half his club's games) waits in all but save and tie spots. The
  busiest went from 88-90 games to 81-82 (MLB's busiest about 80).
- test/bs-manager.js: the run level is judged against MLB 2021-25's 4.3-4.6 rather than engine 25's; the platoon reads
  3,000 games (the switch-hitter gap, which is pure selection, read -0.019 on 2,000).

### Why not form 0.12 or gap25
The stats branch found that form 0.12 lined the shown chance up with results but sent shutouts back to about 16%; I
saw the same, so form stays at 0.02 and the shown chance is fixed where it is computed. It suggested `tuning.gap25`
for the wins spread, but gap25 applies from engine 25 on, so changing it would break engine 25's replay; `BS26R.g`
does the same job on engine 26 alone.

### Numbers (merged with review-improvements 7d501c8)
- bs-manager: runs 4.45 a side, starters 4.56 ERA and relievers 4.25, platoon .040 and .018 (real .041 and .024),
  switch -0.007, saves 45.2 a club, holds 77.2, 15.5 intentional walks a club.
- bs-calibrate: runs 4.44 and 4.47, home 53.4%, wins spread 12.9, best record 108.
- longrun mlb --short: runs 4.4 late, wins sd 14.1 late (one career, so noisy; a ten-season read is 12.9).
- boxscores baseball: shutouts 13.5%, runs 4.4, walks 8.4%.

### Tested
- MATCH: bs-manager, bs-calibrate, `longrun.js mlb --short`, `boxscores.js baseball`, `statsum.js baseball --check`,
  `boxscore.js baseball` (1347), `OLD=/home/claude/dist-e25 node test/engine-replay.js baseball`, `replay.js baseball`,
  bs-pitch (9263), migrate (2253), saves, reload (18 of 18), `live-wp.js 200 baseball-coach-pro.html` (worst band 7.0).
- `realism.js mlb`: favourites shown 55.7%, won 55.8%.
- `stakes.js`: its one failure is soccer's (Manchester City's title), not baseball's.
- Goldens re-recorded for pro baseball only, one at a time: fast 099a7208a787e997 to 446d2472a4050b57, full
  164a0be539c5ab8d to f3a245c796f89a25, hot seat 22a6de51885cd0cf to 1296628ab653cb8d.

### Not yet
- longrun --short reads one career, so its wins spread swings by a point or more with the seed (14.1 here, 12.6 on
  the build before the merge); the ten-season read in bs-calibrate is the steadier one.
- Browser checks remain harness-only (Playwright isn't installed).
