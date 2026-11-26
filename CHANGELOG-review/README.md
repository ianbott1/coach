# Review round changelog (engine 25)

This folder logs the code changes made alongside the playtest and design review ("Coach: a playtest and design review of the seven games", November 2026). Six branches were built and tested one at a time, then merged into `review-improvements`. Each file says what changed, why, in which game, how it was tested and what is still missing.

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

## Rules kept

- Every change that moves a result is gated on `ENGINE_V >= 25`. A season begun on engine 24 replays exactly as it was played, and old saves load.
- Each branch's goldens matched before its merge; the goldens and hot-seat baselines were re-recorded once on the merged build.

## Not run here

Browser tests that need Playwright's Chromium (`test/trades.js`, `test/picks.js` and the other browser checks) could not run in the review environment. Run them before merging.
