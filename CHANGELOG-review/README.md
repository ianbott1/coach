# Review round changelog (engines 25 and 26)

This folder logs the code changes made alongside the playtest and design review ("Coach: a playtest and design review of the seven games", November 2026). Round one (engine 25) was six branches, built and tested one at a time, then merged into `review-improvements`. Round two (engine 26) added six more, plus follow-ups that fixed what the merge showed. Each file says what changed, why, in which game, how it was tested and what is still missing.

| File | Area | Games |
|---|---|---|
| [nba-fo.md](nba-fo.md) | Real 2026-27 NBA cap sheet, 15-man rosters, trade machine, five-day free agency, owner limit and tax | Pro basketball |
| [nfl-fo.md](nfl-fo.md) | CPU draft board, real $301.2M cap with bonuses and dead money, rookie scale, tag, fifth-year option, kickers and punters | Pro football |
| [gameday.md](gameday.md) | Timeouts against runs, rotation (tight, usual, deep) with fatigue, last-minute foul or play | College and pro basketball |
| [people.md](people.md) | Traits and morale, conversations, press conferences, fans, storylines, the Staff room setting | All seven |
| [realism.md](realism.md) | Board targets from expected wins; MLB, NFL, college football, NHL and college basketball calibration; `test/realism.js` | All seven |
| [polish.md](polish.md) | Fifteen bugs found in play (carried-plan prompt, bench stats, nickel and dime, brackets, verdicts, sport words and more) | All seven |
| [hockey.md](hockey.md) | Round 2 (engine 26): the goalie pull at real benches' times with today's empty-net rates, tonight's lines and legs, the timeout, the backup on the live bar | Pro hockey |
| [soccer.md](soccer.md) | Round 2 (engine 26): the matchday, a team sheet with shapes, five changes in three windows by name, how we play from here, condition, rotation and knocks in a congested run | Soccer |
| [college.md](college.md) | Round 2 (engine 26): revenue sharing and NIL as a roster budget, every program's transfer portal in one window, measured against the real sport (`test/cfb-portal.js`) | College football, college basketball |
| [stats.md](stats.md) | Round 2 (engine 26): box scores, leaders and awards against the last three real seasons; full basketball lines, football credit, hockey and soccer goal shares, MLB walks and shutouts; `test/boxscores.js` | All seven |
| [integrity.md](integrity.md) | Engine 26, long careers: ratings held to the opening league, hidden ceilings, aging by position, college programs and coaches, the summer's own dice; `test/longrun.js` | All seven |
| [baseball.md](baseball.md) | Round 2 (engine 26): the platoon by handedness, a named nine-man bullpen with roles and rest, pitch counts and times through the order, the lineup card, holds, calls that name who comes in or hits, the intentional walk, Go to the bullpen on the live bar; `test/bs-manager.js` | Pro baseball |
| [hockey-fo.md](hockey-fo.md) | Round 3 (engine 27): the hockey front office: the real 2026-27 cap ($104.0M) and floor, twenty-three and a reserve list, entry-level deals, restricted and unrestricted free agency, qualifying offers, arbitration, offer sheets with the 2026 pick table, buyouts, retained salary to the March 1 deadline, clubs spending like the real league; `test/hockey-fo.js` | Pro hockey |
| [fb-tactics.md](fb-tactics.md) | Round 3 (engine 27): football's game day, a weekly game plan (run-pass mix, tempo, coverage, pressure, a key) that depends on both rosters, fourth downs and two-point tries at real rates in every game, half-time, timeouts and challenges, the NFL's interceptions leader; `test/fb-tactics.js` | College football, pro football |
| [share.md](share.md) | Round 3 (engine 27): reach and replay. A league code that starts the same league and club on any device, a weekly challenge with a result code a friend's game checks by replaying the season, backup files with a version and a checksum, the season in review as text or a picture; nothing moves a result, so nothing is gated; `test/share.js` | All seven |
| [mlb-fo.md](mlb-fo.md) | Round 3 (engine 27): baseball's front office: the 26 and the 40, a farm at three levels, service time, arbitration with super twos, the $244M competitive balance tax, owners' limits by market, the $23.15M qualifying offer and its picks, a market where players choose, injured-list call-ups; `test/mlb-fo.js` | Pro baseball |
| [league-life.md](league-life.md) | Round 3 (engine 27): a league with a memory: the real record book falling on a date, Halls of Fame by each sport's rule, retired numbers, awards night with finalists and votes, the coaching carousel in season and after at real rates, rivalries, droughts, farewells, owners with patience; `test/league-life.js` | All seven |

## Rules kept

- Every change that moves a result is gated on its engine: `ENGINE_V >= 25` for round one and `ENGINE_V >= 26` for round two. A season begun on an older engine replays exactly as it was played (checked against the engine-25 build with `test/engine-replay.js`), and old saves load.
- After the round-two merge, follow-ups re-tuned what the branches moved together: soccer lines follow the team sheet, the college portal preview matches the market, Premier League goals and draws, and pro baseball's runs, platoon split and wins spread (see the Follow-up sections in `stats.md`, `college.md`, `soccer.md` and `baseball.md`).
- Each branch's goldens matched before its merge; the goldens and hot-seat baselines were re-recorded once on the merged build after each round.

## Not run here

Browser tests that need Playwright's Chromium (`test/trades.js`, `test/picks.js` and the other browser checks) could not run in the review environment. Run them before merging.
