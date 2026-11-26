# Pro football: the front office (branch rv/nfl-fo)

Game: pro football only (league `nfl`, `dist/football-coach-pro.html`). College football shares `src/football`, and its
goldens are unchanged. No other game's goldens changed.

Every real-world figure below has its source next to it. Figures with no source are the model's own assumptions, and
they are labelled as such.

---

## 1. Computer clubs draft from a real board

**What.** Computer clubs now score prospects on the staff's worth for each player: the current rating plus 0.45 of the
gap to the ceiling. Each club reads that worth through its own scouts' fog, then pulls the read back toward the class
average, by as much as a read that noisy can be trusted (a normal shrinkage: `k = v/(v+sd²)`). Need is added as a
capped tiebreaker:

| Style | Need weight | Cap |
|---|---|---|
| bpa | 0.25 | 2.5 |
| need | 0.6 | 5 |
| upside | 0.15 | 1.5 |

The mock behind the "likely gone / maybe there / likely there" labels uses the same model. It gives a mean and a spread
per pick, with the spread scaled by `FO_MOCK` (1.07).

- Code: `src/leagues/nfl/27_frontoffice.js` (`LEAGUE.offseason.draftBoard`).
- A guarded hook in `src/core/91_draftnight.js` (`draftBoardOf`). It returns null unless the league defines a board, so
  NBA and NHL draft exactly as before.
- Each pick still draws one `rng.gauss` per prospect, so the dice are unchanged.

**Why.** Before this change, the fog's noise went straight into the score, and unsure prospects carried 2.2 times the
noise. Clubs fell for whichever prospect got the luckiest guess. In round 1 they took ~53-56-rated players while 65-68s
were still on the board.

**How tested.**

- `node scratchpad/r1.js` (6 drafts, round 1, rank by true worth among available players):

  | | Median rank | Mean rank | Mean rating | Best available | Gap to best |
  |---|---|---|---|---|---|
  | Before | 32 | 45.8 | 60.8 | 68.2 | 7.3 rating points |
  | After | 6 | 10.1 | 63.0 | 66.9 | 3.9 rating points |

  With the need weight set to 0, the gap is 4.0, so need isn't what keeps the gap open.
- `node test/draft-night.js` (football, 8 seeds). The worth figures are for the user's own picks:

  | | Staff worth | Kept | Oracle edge |
  |---|---|---|---|
  | Before | 64.78 | 57% | +1.10 |
  | After | 61.93 | 32% | +2.48 |

  The user's picks are worse now because the computer clubs take the better players first. Reading the board well is
  worth more than before.
- `node test/draft-labels.js 16 football`:
  - The old build was a MISMATCH ("likely gone" on the board was right 50% of the time).
  - New build: MATCH. On the board, "gone" was right 91%, "maybe" 48%, "there" 7%. On draft night: gone 73%, maybe
    50%, there 30%.
  - FO_MOCK settings tried: 1.3 and 1.15 gave "there" at 33% and 31% (OUT); 1.0 gave "gone" at 71% (OUT); 1.07 MATCH.
- `node test/draftboard.js dist/football-coach-pro.html`: MATCH on all checks.
- The "likely gone" label flipping between screens was not reproduced. The labels now come from one model on the board
  and on draft night.

## 2. The real 2026 cap and real contracts

**What** (`src/leagues/nfl/27_frontoffice.js`, `98_fo_views.js`, and edits in `26_offseason.js` and
`98_offseason_views.js`):

**The cap.** The cap is $301.2M (ESPN, https://www.espn.com/nfl/story/_/id/48055711/nfl-salary-cap-hits-new-milestone-3012-million-2026).
The twenty tracked players are paid against it. The rest of the 53 and the practice squad count as one line,
`FO_DEPTH` = $62M (model assumption).

**Contracts.** Each contract has:
- years;
- a cap hit;
- the prorated signing bonus (`pb` per year);
- guaranteed base (`g`);
- total value and guaranteed total.

Releasing a player puts the unspread bonus plus the guaranteed base on next year's cap as dead money. Releases are
counted by comparing rosters, so trades and retirements carry no dead money.

**The rookie scale by slot.**
- Pick 1: $57.27M over 4 years with a $38.11M signing bonus. Pick 32: $16.78M with $8.69M. Rookie minimum: $0.885M.
- Source: CBS, https://www.cbssports.com/nfl/news/2026-nfl-draft-agents-take-rookie-contracts/
- Round 1 interpolates geometrically between those two picks. Later rounds decay toward the minimum (model).
- Round 1 is fully guaranteed, round 2 partly, and later rounds only the bonus (model, following the CBS description).

**The franchise tag.**
- One year, fully guaranteed, at the greater of the position's tag and 120% of the current salary.
- QB $43.9M and WR $27.3M come from ESPN (link above).
- The other positions use SI's 2026 projections: RB 14.5, TE 16.3, OL 27.9, DE 27.3, DT 26.3, LB 28.2, CB 21.4, S 20.9,
  K/P 6.9. Source: https://www.si.com/nfl/2026-nfl-franchise-tag-explainer-details-contract-amounts-potential-targets
- The user tags from the re-sign screen. Computer clubs tag their best expiring starter rated 73 or more and under 31,
  when the tag fits.

**Fifth-year options.**
- For first-rounders after their third season (CBS rules, link above).
- The option year pays the greater of the deal's average and 62% of the position's tag (model), fully guaranteed.
- The staff's default is to pick it up when the player is rated 67 or more, or has a ceiling of 74 or more.

**Re-signing (extensions before free agency) as a negotiation of structure.**
- The four structures:
  - their ask;
  - fewer years for more a year (x1.07);
  - more years for less a year (x0.95);
  - more guaranteed for less a year (x0.92, +22% guaranteed share).
- Every option is a deal the player would sign. What changes is the risk the user carries. No option is marked best.

**Salaries.**
- Salaries were rescaled with QBs at the top. The top asks by position: QB 55, RB 16, WR 33, WR2 30, OT 31, EDGE 33,
  DT 29, LB 21, CB 25, S 21, K 6, P 4, in $M (model). The curve is `x^1.8` on (rating-50)/30, with an age discount.
- The asks were calibrated so the starting payroll median is $204M of $301.2M, depth included (min 154, max 292).

**Saves.**
- A new career starts converted.
- An older career converts when its next offseason opens (`u.capV`), deterministically, so a reload gives the same
  contracts.
- The front office runs from the summer it was opened on this build (`u.foV`, `S.off.picks.fo`). An older offseason
  that was already open keeps the old screen and rules for that one summer.
- `LEAGUE.cap` and `LEAGUE.taxLine` are now getters, so the core's team card and in-season trades see the right cap.

**Model assumptions to know.**
- The cap doesn't grow year to year.
- `FO_DEPTH` is flat.
- About $16M is kept free for the draft class.
- The computer's tag rarely fires (0 tags in a 3-season sample), because its threshold is strict.

**Why.** The old game had a $110M cap and a single salary per player, with no structure, tags or options.

**How tested.**
- `node scratchpad/dist.js`:
  - Payroll median 204 at the start and 204 after 3 seasons (max 271).
  - QB salary median 8.4, p90 31.4, max 60.
  - Dead money on 16 teams (max $12.3M).
  - All contracts converted (231 rookie deals, 409 veteran deals).
- `node test/reload.js dist/football-coach-pro.html`: MATCH, 18 of 18 reloads.
- `OLD=scratchpad/base node test/engine-replay.js football-coach-pro`: MATCH. An older season replays as it was played.
- `node scratchpad/oldmig.js <old build> <new build>`:
  - An old save at season's end converts at open (cap 301.2).
  - A reload mid-offseason gives the same contracts and specialists.
  - Committing sets `foV` 1 (payroll 239.9), and play continues.
- `node test/nfl.js dist/football-coach-pro.html 3 8`: MATCH on every rule. See entry 4 for the numbers.

## 3. A kicker and a punter for every club

**What** (`src/leagues/nfl/28_specialists.js`; a guarded edit in `src/football/50_drives.js`; a one-line guarded edit in
`src/football/75_screens.js`):

- Every pro club has a kicker and a punter (`u.spec[team]`), each with a name, an age and a rating centred on 70.
- **The kicker's rating** shifts the log-odds of every field goal he tries by (r-70)/15.
  - Using the league curve at 47 yards (76%): an 85-rated kicker makes about 90%, a 55-rated one about 54%.
- **The punter's rating** moves the punt's mean distance by (r-70)\*0.3 yards. In a direct check, the net from his own
  30 runs from 34.3 yards (rated 55) to 43.3 yards (rated 85).
- Only the odds and the mean move. No draw is added or removed.
- The kicker the games already named stays the kicker.
- They age and change each summer from a hash of club and year, not the season's dice.
- Their pay sits inside `FO_DEPTH`.
- The offseason screen names them.
- They exist only in a front-office career, so college football and older careers play exactly as before. The kick
  shift is carried in the game's `ctx.kp`; with no `kp` it is 0.

**Drive outcomes against real 2025 football.** One Chicago season, 285 games:

| | TD | FG | Missed FG | Punt | INT | FUM | Downs | Drives/team-game | Points/game |
|---|---|---|---|---|---|---|---|---|---|
| Before | 25.4% | 15.2% | 2.3% | 36.0% | 9.0% | 6.6% | 5.5% | 10.0 | 45.0 |
| After | 24.9% | 16.0% | 2.7% | 35.8% | 8.7% | 6.4% | 5.5% | 10.0 | 44.8 |

| | FG attempts per team-game | FG% |
|---|---|---|
| Before | 1.76 | 86.7% |
| After | 1.87 | 85.7% |

Real 2025:
- 1,088 FGA and 931 FGM, 85.6%, about 2.0 attempts per team-game. Source (full regular season):
  https://www.nfl.com/stats/team-stats/special-teams/field-goals/2025/post/all
- Drives ending in a score 39.2%, in a turnover 10.6%. Source: https://www.pro-football-reference.com/pi/share/t6OXi

The engine scores on 41-43% of drives, and 15.1-15.6% end in a turnover (INT+FUM). Both are a little above the real
figures (the turnover rate notably so). Kicking and the TD share sit close.

The report from play of "0 FG attempts / 60% TDs" was not reproduced by the engine. Nothing in the drive model needed
recalibrating for this step, so the turnover share is left as a known gap. By kicker rating in that season, FG% was
90.2% for kickers more than 5 points above 70 and 83.6% for those near 70. The 135 attempts by low-rated kickers came
in at 87.4%, which is within sampling noise of their expected rate. The direct check is `scratchpad/kick2.js`.

**How tested.**
- `node test/golden.js dist/football-coach.html --fast --check`: MATCH 30c6ece58cf32d78 (college football unchanged).
- `node test/reload.js dist/football-coach-pro.html`: MATCH, 18 of 18.
- `OLD=scratchpad/base node test/engine-replay.js football-coach-pro`: MATCH.
- `node scratchpad/kick.js`: drive table above. `node scratchpad/kick2.js`: odds by rating.
- `node scratchpad/oldmig.js`: specialists are created at the old save's first offseason, are identical on reload, and
  age one year over the summer.

## 4. Pro football goldens re-recorded

The expected changes are in pro football only:
- Season 1 games differ through computer in-season trades on the new contracts.
- Field goals and punts now use the specialists.
- Computer clubs draft differently.

The NBA and NHL fast goldens were checked unchanged after the core draft-night hook: NBA MATCH b67133ff4419ea04, NHL
MATCH 55b61b4531d1e1c8. College football MATCH 30c6ece58cf32d78.

- `test/golden-fast-nfl.json`: re-recorded (`node test/golden.js dist/football-coach-pro.html --fast --write --note ...`).
- `test/golden-nfl.json`: re-recorded.
- `test/hotseat-nfl.json`: see the commit.

Favourite win rate (`test/nfl.js 3 8`): 0.581 on HEAD's build and 0.583 after these changes, so the gap below the NFL's
0.63-0.66 band was already there and isn't from this branch. Parity is something to look at in a later round.

## Not built: plans

**Free agency as a multi-day market.**
- Keep the plan screen, but run free agency as 3-4 rounds ("days") inside `nflRun`.
- Each day, every unsigned free agent holds offers: computer clubs bid on need, cap room and the player's ask.
- The user places offers by structure, using the four deal shapes above.
- The player signs the best offer on a weighted value: money, then guarantees, then contender status, then role.
  Unsigned players lower their ask each day.
- The user sees which offers were outbid, and can raise them between days. This needs a step state in `S.off` and a
  screen per day, so the offseason becomes several screens. The batch run already settles the cap, so each day can
  reuse `foContract`.

**Trades with several players and picks.**
- Extend `S.off.picks.trade` to `{give:[i...], get:[i...], picks:{give:[[year,round]...], get:[...]}}`.
- Value each player as worth over contract (`foAsk` against `p.k.sal`, over the years left). Value picks from
  `foRookieTot` and the draft's mean worth by slot, discounting next year's by 0.8.
- Each club's situation (contending or rebuilding, from its Elo and its age curve) weights now against later.
- A counteroffer is the computer adding or removing the smallest asset that balances the deal.
- The draft order would have to honour traded picks (`placeDraftNight`). Kept in `src/leagues/nfl`, so the core trade
  code that the NBA rebuild touches stays untouched.

**Full depth: TE, interior OL, 53-man rosters.**
- The 20-slot array (10 starters plus backups at i+10) is assumed across core (`POS`, `BK`, stats, screens, goldens).
- The plan is to add a third, league-only array per club (`u.depth[team]`), as the specialists do, holding TE, IOL and
  the rest of the 53.
- Then let the drive engine's shape (`fbShapeT`) read blocking from OT and IOL together, and receiving from WR, WR2 and
  TE, through a `ctx` field as `kp` does here.
- `FO_DEPTH` would become the sum of those contracts.

## Risks and merge hotspots

**Core edits** (all additive, and guarded so nothing changes unless the league defines the hook):

| File | What changed |
|---|---|
| `src/core/91_draftnight.js` | The pick loop and `dnMock`, through `draftBoardOf` |
| `src/core/20_engine.js` | `LEAGUE.onNewUniverse` in `newUniverse` |
| `src/core/99_app.js` | `LEAGUE.afterRebuild` at the end of `rebuild()` |

**Shared football edits:**

| File | What changed |
|---|---|
| `src/football/50_drives.js` | `fgOdds`, `nextStart` punt, `fbSpecSet` calls, `gameCtx.kp` |
| `src/football/75_screens.js` | `kickerName` |

College football is unchanged.

**Other risks:**
- `LEAGUE.cap` and `LEAGUE.taxLine` are getters that read the global `U`.
- The computer's franchise tag rarely fires.
