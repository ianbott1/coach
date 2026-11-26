# Round 3 branch rv3/mlb-fo: pro baseball's front office (engine 27)

Pro baseball had a hard $165M payroll limit on the players the game tracks, contracts that simply ran out, and a draft
whose picks joined the big-league roster. Every club looked like every other, and the game's richest club spent half
what the Mets do. This branch gives baseball the real front office: the 26 and the 40, a farm, service time and
arbitration, the competitive balance tax, the qualifying offer, a market where players choose, and owners who spend
like real ones.

Everything below is gated on `ENGINE_V >= 27`: a career comes onto the new rules at the first summer after an
engine-27 season (`mlbRun27` replaces `nflRun` there; a new career opens on them). A season begun on engine 26, and
its summer, replay exactly. Constants and pure functions are in `src/leagues/mlb/24_fo.js` (`MLB$`), the summer in
`27_fo_run.js`, the season's injured list in `28_fo_season.js`, the screens in `99_fo_views.js`.

The real rules, checked Nov 2026:
- The competitive balance tax: $244M for 2026 (230, 233, 237, 241, 244 over 2022-26); 20%, 30% and 50% of the
  overage for a first, second and third-or-later straight year; surcharges of 12% on $20-40M over, 42.5% on $40-60M
  (45% for a repeater), 60% past $60M; $40M or more over moves the club's top pick back ten places.
  https://www.mlb.com/glossary/transactions/competitive-balance-tax
- The minimum salary, $780K, and 2026 opening-day payrolls: the Mets $352.2M, the Dodgers $316.6M, the Yankees
  $297.2M, Cleveland $62.3M, eight clubs under $100M; the average salary $5.34M, the median $1.4M.
  https://www.ksat.com/sports/2026/04/09/ap-study-mlb-average-salary-hits-a-record-534m-as-the-mets-lead-spending-again/
- The qualifying offer: $23.15M for 2027 (the mean of the 125 highest salaries), made to eight players on Nov 2, 2026;
  the compensation and forfeits by the clubs' status.
  https://www.click2houston.com/sports/2026/11/02/bednar-suzuki-and-arozarena-are-among-8-mlb-players-receiving-2315-million-qualifying-offers/,
  https://www.mlb.com/glossary/transactions/qualifying-offer
- Service and arbitration: 172 days make a year; arbitration from three years, or two for the top 22% of that class
  with 86 days the year before (super twos); free agency after six.
  https://www.mlb.com/glossary/transactions/salary-arbitration
- What arbitration pays against the open market, roughly 25% / 40% / 60% over the three years.
  https://blogs.fangraphs.com/an-arbitration-compensation-update
- The agreement: the CBA expires on Dec 1, 2026, a lockout is expected, and the owners have proposed a hard cap the
  players oppose. The game plays on the 2022-26 rules until there is a new one.
  https://frontofficesports.com/article/mlb-qualifying-offer-figure-rises-amid-labor-strife/

## 1. Service time, the player's class, arbitration and free agency
- What: every man carries his service time (`p.svc`, years and days; a career's first summer on the rules gives each
  man a debut from a hash of his name, a big market's veterans a little more and a small market's a little less). His
  class follows (`mlbClass`): pre-arbitration under three years, paid near the minimum by a scale (`mlbControlSal`);
  arbitration from three, or two for a super two (the top 22% of the two-year class, `mlbSuper2`); a free agent after
  six. An arbitration award is a share of what he'd get on the market, 25% / 42% / 62% / 75% by his year
  (`MLB$.arbFrac`), and the season he had moves it: his line against what his rating should have done (`mlbPerf`, OPS
  pieces for a hitter, earned runs for a pitcher, up to six rating points either way). Never a pay cut. A club tenders
  each man under control or doesn't (a non-tendered man is a free agent).
- Why: the cheap young core and the expensive veteran is how a baseball roster is built; one contract rule for
  everybody made every club the same.
- Game(s): pro baseball.
- Tested: `test/mlb-fo.js` (shares settled over seasons 3-8: 43% of big-leaguers pre-arbitration, 33% in arbitration,
  every salary at least $780K); the summer screen shows each man's class and figure.
- Not yet: multi-year extensions before free agency (buying out arbitration years); the arbitration hearing itself
  (filing numbers, a club win or a player win).

## 2. Owners, the tax and the payroll spread
- What: no cap. Each owner sets a limit for payroll and tax together (`mlbBudget`): by market (four tiers, $92M,
  $150M, $215M and $320M: the Yankees, Mets and Dodgers on top; Kansas City, Pittsburgh, Cleveland, Tampa Bay, Miami
  and the A's at the bottom), by how strong the franchise is, and by his mood. The tax is the real one (`mlbTaxBill`),
  repeater rates from `u.mlbTaxN`; the tax payroll is the 26 plus each 40-man man in the minors at a split
  (`mlbTaxPay`). A club $40M or more over moves its top pick back ten places the next draft (`mlbBackOrder`, through
  `LEAGUE.pickOwner`). The owner's mood moves the next limit 10%: up for a title or a season well past what the job
  expects, down for a tax bill or a spend past his limit in a losing season. The computer's clubs spend inside their
  limits; yours can go past it, and the summer screen says what it costs.
- Why: the gap between the Mets and the Guardians is the sport's central fact, and a $165M ceiling erased it.
- Game(s): pro baseball.
- Tested: `test/mlb-fo.js`, eight seasons, the settled league (seasons 3-8), engine 26 before and engine 27 after,
  against 2026's opening day:

  | | Engine 26 | Engine 27 | Real 2026 |
  |---|---|---|---|
  | Top payroll | $156-165M | $252-320M | $352.2M (Mets) |
  | Bottom payroll | $52-77M | $53-77M | $62.3M (Cleveland) |
  | Clubs under $100M | 5-9 | 5-8 | 8 |
  | Clubs over the $244M tax line | 0 | 1-4 | 3 near $300M or more |
  | Mean salary | $4.4-5.0M | $5.6-6.5M | $5.34M |
  | Median salary | $1.7-3.1M | $0.9-1.8M | $1.4M |
  | Wins, sd | 9.2-16.4 | 10.7-14.6 | 12.3 (2024) |

  The big markets win more, as they do, without running away: over seasons 11-16 of a sixteen-season run (seed 5) the
  four tiers paid about $83M, $142M, $204M and $281M and won about 72, 82, 84 and 89 games; the best record was
  98-119 a season (100-120 on engine 26).
- Not yet: revenue sharing as money (it shows only in the compensation rules), the payroll floor the owners proposed.

## 3. The qualifying offer and draft-pick compensation
- What: a club can make its own free agent the qualifying offer, one year at $23.15M, unless he had one before or
  joined during the season. He takes it when the market would pay him well under it, or (older, or now and then) when
  it's close (`mlbQoAccept`); the computer's clubs make it to a man whose price is near it. A man who turns it down
  and signs elsewhere costs his new club picks by its status: a tax payer its second- and fifth-round picks, a
  revenue-sharing club its third, any other its second, which go to the club he left (`mlbForfeit`, `u.mlbPk`, read
  by `LEAGUE.pickOwner`). The free-agent list marks him, and the market weighs the pick against him.
- Why: the qualifying offer is the decision of every November, and the reason some free agents sit unsigned.
- Game(s): pro baseball.
- Tested: `test/mlb-fo.js`: 0-10 offers a winter (mean 5.1 on seed 5; eight in Nov 2026), 4 of 36 taken over seven
  winters, picks forfeited and received; the summer screen offers it and says whether he'd likely take it.
- Not yet: the real compensation pick is a new pick (after the first round, after Competitive Balance Round B or after
  the fourth round); the game's draft has a fixed number of picks, so the forfeited pick itself moves. No
  international bonus pool to forfeit.

## 4. A free-agent market where players choose
- What: six days of bidding, as pro basketball's (`mlbMarket27`, `mlbFaPref`, `mlbFaHold`). Each day every club with
  room bids by its style: a contender to its limit for anyone, a rebuilding club little and only for younger men.
  Each man weighs the money, the years, how good the club is (more as he ages), a starting job, and home; the best
  wait for better offers early. Your targets are your offers, and a target you miss says why. Prices come from a
  market curve by rating (`MLB_PAYC`, a 60 is a regular at about $15M; a closer and a designated hitter for less, a
  man past 31 for less).
- Why: the old market gave each man to the first club with room.
- Game(s): pro baseball.
- Tested: 42-60 signings a winter, top deals $28-44M a season (the real top is about $45-60M).
- Not yet: opt-outs, deferrals, mutual options.

## 5. The 26, the 40 and the farm
- What: each club has a farm, Triple-A (nine), Double-A and Single-A (seven each), built for a career's first summer on
  the rules from the club's own name and years (`mlbFarmInit`). Every draft pick goes to the farm, to Single-A, or
  Double-A at 21 and over. The farm develops on its own dice each summer, more at a level that stretches a man; men
  move up and down levels and the ones going nowhere are let go (`mlbFarmSummer`). The 40-man is the 26 and the
  prospects protected on it (`mlbProtect`: a man at Double-A or above rated 53 or with a ceiling of 66). A man on the
  40-man in the minors uses an option year; three, and none past five years of service (`mlbCanOption`). A Triple-A
  man clearly better than a bench player takes his place, the bench player optioned down if he can be, otherwise
  designated for assignment: the club with the worst record whose man there is weaker claims him, or he goes to free
  agency (three years' service) or Triple-A (`mlbDepthMoves`, `mlbWaivers`). Empty places are filled from the farm
  first, then the market. On the summer screen you can call a man up yourself, designate a man for assignment, or
  take the depth calls away from your staff.
- The farm is held on the league's scale: each summer's re-centre (core `recentre26`) reads only the big-league
  rosters, so the same move is made to the farm at the same moment (`mlbFarmRecentre`); without it the farm drifted
  above the league it feeds, and each call-up lifted the majors for the re-centre to take back from everyone.
- Why: the farm is where a baseball front office spends its time, and a prospect who develops for three years is the
  sport's long game.
- Game(s): pro baseball.
- Tested: `test/mlb-fo.js`: 26 on every roster and nobody past 40 every season; 110-215 men up from the farm a
  winter. `node test/longrun.js mlb --seasons 20` (see Tested below).
- Not yet: the Rule 5 draft; minor-league free agency; promote and demote during the season by your own hand (the
  injured list's call-ups are automatic); minor-league salaries beyond the split.

## 6. The injured list in the season
- What: a starter out ten days or more goes on the injured list, and his club calls up the best man at his position
  from Triple-A or Double-A, a 40-man man first. The better of the call-up and the bench player starts in his place,
  and the injury's cost to the club is read again with him in it; when the starter is back, the call-up goes down.
  Every club, yours included. No dice: who goes up is read from the ratings, so a reload replays the same. The
  season's record (who was on each roster on opening day, each call-up's days) is folded into service time as the
  summer opens, and a call-up joins the 40-man.
- Why: the call-up when a regular goes down is how most prospects reach the majors.
- Game(s): pro baseball.
- Tested: `test/mlb-fo.js`: 16 call-ups in its first front-office season, the same after a reload; the roster tab
  lists who is up and why; every season scores 4.18-4.54 runs a side with 12.8-16.0% shutouts (2024: 4.39 and 13.2%).
  A call-up once came up with no clubhouse mood: the room's morale, and with it the league's, read NaN and every game
  ended 1-0 after nine scoreless innings (`node test/boxscores.js baseball` caught it: 3.2 runs a side, 38% shutouts).
  He now comes up with the mood his nature gives him, and the test checks the scoring every season.
- Not yet: the game's injuries come at its own rate (about fifteen of ten days or more a season across the league,
  against hundreds of real IL placements); the 60-day list.

## 7. The screens
- What: the summer screen's contracts section on the real rules (each man by class with his figure, tender or not;
  each free agent re-sign, qualifying offer or let go), the payroll against the tax line and the owner's limit, what
  the tax would cost, the farm by level with call-ups and designations. The free-agent list marks a man who turned
  down a qualifying offer, and room is the owner's limit. The banner after the summer gives the tax bill, the
  arbitration awards, the non-tenders, the qualifying offers, picks lost and won, the farm's moves, and who paid the
  tax around the league. The roster tab shows the farm and the season's moves; every club's card shows its payroll
  against the tax line and its owner's limit. The glossary explains the tax, service time, the qualifying offer and
  the 40-man.
- Why: a front office you can't see is a front office you can't run.
- Game(s): pro baseball.
- Tested: `test/mlb-fo.js` draws the summer screen, its binding, the banner, the roster tab and the payroll line
  headlessly, and checks for the new words and none of the old cap's.
- Not yet: a full farm page with every man; a 40-man page.

## 8. Young players keep growing to their peak
- What: on engine 27 a big-leaguer's summer leans young: +0.75 rating a summer at 25 and under, +0.6 at 26-28, a
  little less past 30 (`mlbYoung`). The re-centre takes the level back, so the lean is all that is left.
- Why: a league whose spread comes from the farm and the market is narrower than the one a career opens with, so the
  re-centre stopped lifting its low end, and the 24-28 group stalled a year before its peak (`test/longrun.js`: the
  26-28 change fell to -0.77, below its band).
- Game(s): pro baseball.
- Tested: `node test/longrun.js mlb --seasons 20 --careers 2`: the 26-28 change -0.50 (band -0.6 to 1.5), 29 -1.1,
  32-34 -3.0; the home-run bands (leader 50.9 on average, the best season 64 after a farm breakout rate of 6%; 77 at 8%) and the
  wins bands hold.

## Tested
All on the final build (engine 27 unless named):
- `node test/mlb-fo.js` (new, fast tier, about 110 s): MATCH, 31 checks.
- `OLD=/home/claude/dist-e26 node test/engine-replay.js baseball`: MATCH, an engine-26 season replays as it was played.
- `node test/migrate.js`: MATCH 2253 of 2253. `node test/saves.js`: MATCH. `node test/reload.js dist/baseball-coach-pro.html`: MATCH 18 of 18.
- `node test/longrun.js mlb --short`: MATCH. `node test/longrun.js mlb --seasons 20 --careers 2`: MATCH.
- `node test/boxscores.js baseball`: MATCH (4.3 runs a side, 15.1% shutouts, walks 8.4%, home-run leader 45).
  `node test/bs-manager.js`: MATCH. `node test/bs-calibrate.js`: MATCH.
- Goldens and hot-seat baselines: not re-recorded. Screens with `ENGINE_NOW=26` on a scratch build: MATCH.

## Seen outside this branch
- `leagues/mlb/25_schedule.js`: seed 11 (a career opened as Seattle) can't build its 2033 schedule ("could not fit
  the baseball schedule"), on the engine-26 build too. `test/mlb-fo.js` uses seed 5.
