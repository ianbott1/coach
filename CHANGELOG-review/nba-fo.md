# Pro basketball: the front office (branch rv/nba-fo)

Game: pro basketball only (`basketball-coach-pro.html`, league `nba`). Code is in `src/leagues/nba` except for small
guarded hooks in core and one line in `src/basketball/10_players.js` (listed under each entry and at the end).

## 1. The real 2026-27 cap sheet

**What changed.** The cap, the tax line, both aprons, the minimum team salary, the three mid-level exceptions, the
bi-annual exception, the minimum and maximum salary scales and the rookie scale are now the league's real 2026-27
numbers (`src/leagues/nba/24_cap.js`, `NBA$`). Salaries follow the real market's shape: stars near the max, good
starters at the mid-level and up, the end of the bench at the minimum (`NBA_PAYC`, `nbaAsk`), with age discounts. Deals
carry years and options: player options (he opts out when the market pays clearly more) and team options (yours to pick
up or decline on the summer screen; the computer keeps a man worth his money). Drafted players sign rookie-scale deals
(four years, a team option on the fourth; second-rounders two years at the minimum). Re-signing your own goes over the
cap (Bird rights) up to the owner's limit; other clubs' free agents need cap room, else the mid-level exception the
payroll allows (non-taxpayer below the first apron, taxpayer below the second), else the minimum. Cap holds are
simplified: what you re-sign is counted at the player's ask, and your draft picks at their scale, before free agency.

**Why.** The game showed "$155.2M of $200M" as a hard cap with no tax, no aprons and no salary matching, and salaries
like a 70-rated point guard on $51M.

**Old saves.** A career begun before this keeps its contracts and the old 165/200 numbers for the season in progress
(`LEAGUE.cap`/`LEAGUE.taxLine` are getters that read `u.foV`), so a season under way replays exactly. At its next
summer every contract is rescaled to the new market (`nbaMigrate`; drafted players on their pick's rookie scale, the
years left kept) and the career comes onto the new rules (`u.foV=1`). New careers start on them
(`LEAGUE.offseason.init`).

**Sources (verified Nov 2026).**
- Cap $164.961M, tax $200.428M, first apron $209.015M, second apron $221.686M, minimum team salary $148.465M,
  non-taxpayer MLE $15.044M, taxpayer MLE $6.064M, room MLE $9.366M: https://pr.nba.com/2026-27-salary-cap/
- Bi-annual exception $5.477M: https://www.yardbarker.com/nba/articles/values_of_202627_mid_level_bi_annual_exceptions/s1_14822_44014426
- Maximum salaries (25/30/35% of the cap: $41.240M / $49.488M / $57.736M): https://www.yardbarker.com/nba/articles/nba_maximum_salaries_for_202627/s1_14822_44013796
- Minimum salaries by service ($1.358M to $3.877M): https://www.yardbarker.com/nba/articles/nba_minimum_salaries_for_202627/s1_14822_44016395
- Rookie scale by pick (#1 $15.2M ... #30 $3.0M): https://www.profootballnetwork.com/?p=1454081 , cross-checked with
  https://bleacherreport.com/articles/25435791-aj-dybantsa-darryn-peterson-and-all-projected-rookie-contracts-top-2026-nba-draft-picks
  (#1's four-year total $66.9M)
- Luxury tax rates by bracket (1.00, 1.25, 3.50, 4.75, +0.50; repeaters 3.00, 3.25, 5.50, 6.75): https://www.shamsports.com/cbaglossary/luxurytax.htm
- The 2026-27 bracket size, $6.064M: https://www.salaryswish.com/luxury-tax/2027 . Sham Sports' glossary gives a $6.5M
  bracket; I used Salary Swish's 2026-27 figure (it moves with the cap each season).
- Trade salary matching by apron tier (200% + $0.25M up to $9.1M out, out + $9.1M up to $35.2M, 125% + $0.25M above;
  100% over the first apron; no aggregation over the second): https://fanspo.com/nba/trade-machine/rules

**Core hooks.** `src/core/20_engine.js` newUniverse calls `LEAGUE.offseason.init` if a league defines it (only nba
does). `src/core/99_app.js` payrollLine defers to `LEAGUE.payrollLine` if defined (only nba).

**How tested.** Scratch multi-season sim (30 clubs, three seasons, computer coaching every club): ppg 113.3 / 114.6 /
113.5, wins sd 13.7 / 12.9 / 13.3, best 68 / 64 / 70, worst 13 / 17 / 20. Salaries by rating land on the curve (68+ at
$36-41M, a 60 about $20M, under 52 about the minimum).

## 2. Fifteen on a roster

**What changed.** A third man at each spot (slots 10-14) behind the ten-man rotation. The engine's rotation is
unchanged (starters and backups play; team strength is 80% starters, 20% backups). Third men play through injuries:
when a man is hurt the third man takes the backup's minutes (`injuryCost` in `src/basketball/10_players.js` uses the
backup-to-third-man gap when a third man exists; ten deep, as college keeps, it is the old fixed value). The roster tab
shows "The rotation" and "The rest of the fifteen", each third man with **Move up** (a promotion, kept and replayed like
any). Summer signing, placing and fill-ins understand three deep. Old careers fill out to fifteen at their next summer.

**Why.** A ten-man NBA roster was the first thing that read wrong; injuries now make depth matter.

**Not done.** Two-way players; minutes by rating inside a game (the third men only play through injuries).

**Core hooks.** `src/core/99_app.js` rosterView: `LEAGUE.text.depthHead` (header word) and `LEAGUE.reservesHTML`
(only nba defines either).

**How tested.** Scratch sim, fifteen deep: 2026 ppg 112.9, wins sd 11.5, best 66, worst 15; 2027 ppg 115.3, wins sd
12.3. `node test/nba-screens.js` MATCH (921 screens drew, none speaks football).

## 3. The trade machine

**What changed.** The Trades tab is a trade machine for pro basketball (`src/leagues/nba/98_fo_trades.js`): up to
three players a side at any position, future firsts and seconds (four years out; your firsts protected top 4, 10 or 14
or not), salary matching by apron tier, the owner's limit, players signed this summer locked until Dec 15. Clubs weigh
now against later by where they stand (contenders want help now; rebuilders want youth, picks and room), charge for tax
and for salary, and counter when close ("they'd do it if you add ..."). Shop one of yours, ask what a club wants for one
of theirs, or build your own. No three-trade cap and no built-in "you always give a little more". The computer's clubs
deal through the last two weeks before the deadline, buyers (top 35%) with sellers (bottom 40%), sometimes with a first.
Picks traded go through draft night (`LEAGUE.pickOwner`). The old offseason "Trade block" is hidden on the new rules.

**Why.** At most three trades a season, one-for-one at a position, no picks, no counteroffers.

**Core hooks** (additive, each guarded on `x.nba`, `LEAGUE.trade.on()` or `LEAGUE.pickOwner`, none defined by another
league): `src/core/98_trades.js` tdApply, tdCarry, tradesView, bindTrades, tdOfferCard; `src/core/98_trades_cpu.js`
cpuDeadline, cpuNewsCard; `src/core/91_draftnight.js` dnOwnerAt.

**Tests changed.** `test/trades.js` and `test/picks.js` skip pro basketball once its own machine is on (they drive
the old one-for-one API); `test/hotseat-moves.js` uses the new machine for pro basketball. The new `test/nba-fo.js`
covers the machine.

**How tested.** Scratch: shop returns offers for every starter (~170 ms for five); 2,900 one-for-one probes found 562
close deals and countered 487; a trade done keeps both rosters at fifteen; a reload 20 days on replays the same
season; 7 computer deadline deals. `node test/nba-fo.js` (below).

## 4. Free agency: days of bidding

**What changed.** Free agency runs five days. Each day clubs make the offers they can pay for (room, the exception
their payroll allows, the minimum; a club flush with room bids up), up to two at a time. Each player weighs his offers:
the money against his market, the years he wants (a veteran wants security), winning (more to a veteran), the role he'd
have at that club, and his old club (`nbaFaPref` in `24_cap.js`). Stars hold out for the market, role players sign
early, and on the last day each takes his best offer. An offer a club can no longer pay for (its room went on someone
else) falls away. Your targets are offers you make: price and years with +/- buttons, shown against his market, with
what you can offer ("about $X of cap room", "the $15.0M mid-level", "only minimum deals") after your re-signings and
draft picks. A target you miss says why ("signed with Miami ($23.3M for 4 years: more money, more years, a better
team)", or "your offer didn't fit: over the cap, only the $15.0M mid-level exception"). The bench reaches free agency
too (rated 50 and up, was 58), and money under the salary floor is free to spend, so clubs with room use it.

**Why.** Free agency was a single pass with no bidding; teams sat with room and nobody to buy.

**How tested.** See the measurements below and `node test/nba-fo.js`.

## 5. Finances: the owner and the tax

**What changed.** The owner's limit (by franchise strength and market) is shown on the cap sheet, the summer screen and
in every summer's banner. A club pays the luxury tax on the payroll it ends the season with, at the repeater's rates if
it paid in three of the four seasons before; a club under the floor pays the shortfall to its players. The banner says
what you paid. The owner reacts: tax paid for a losing season (six points of win% under what the job expects) cuts the
limit to the tax line for the next one; tax paid for a title, or a season eight points over, lets it out a step. The
cap sheet says which ("he wants out of the tax").

**Why.** No finances: payroll was a number against a hard cap.

**How tested (4 and 5).** Scratch multi-season sim with steps 1-5 (`seasons.js`, 30 clubs, the computer coaching all,
Boston seed 11, four seasons): ppg 115.7 / 114.9 / 115.6 / 114.3; wins sd 10.9 (the opening season, before any summer)
/ 11.7 / 12.5 / 12.8; best 70 / 64 / 67 / 68, worst 21 / 21 / 21 / 15. Each summer 43-50 free agents signed (6-9 with
the mid-level), on every one of the five days. Payrolls after the summer: median $164-172M, 10-15 clubs under the cap,
one to three in the tax or over an apron. (Seed 5, three seasons: ppg 112.6 / 113.8 / 113.8, wins sd 12.0 / 13.5 / 9.7;
the win weights in `nbaFaPref` were raised after that run, as the bidding had spread talent too evenly.)

## Tests

- `node test/nba-fo.js` (new, ~75 s): MATCH. New career: fifteen on every roster, cap 164.961 and tax 200.428, payroll
  median $176M, no salary outside the minimum and maximum. Trades: 25 offers for five starters, the same answer twice,
  a two-for-one with Philadelphia done (both rosters fifteen), a deal for Atlanta's first done, a reload 15 days on the
  same season, 7 computer deadline deals, shut after Feb 5. Draft night: picks held "1Atlanta,1Boston,2Boston", picks
  made the same. Summer: your offers and the owner's limit on the screen; 42 signed over days 1-5 (8 with the
  mid-level); every target back with why; a bill for all 30 clubs (6 taxpayers); fifteen on every roster; the banner
  draws. Old career (saved by the published build at the repo root, 30 days in): loads and replays exactly (ten deep,
  old cap, trade machine off), and after its summer is on the new rules (fifteen, every contract rescaled, cap
  164.961).
- `node test/nba-screens.js`: MATCH 921 screens drew, none speaks football (run after step 3).
- Other leagues unchanged: `node test/golden.js dist/basketball-coach.html --fast --check` MATCH c81a35489f0479ac
  (college basketball shares `src/basketball`); `node test/golden.js dist/football-coach-pro.html --fast --check` MATCH
  f214c1e9bd9f5025 (pro football uses the core trade code I hooked).

## Goldens re-recorded (pro basketball only)

`node test/golden.js dist/basketball-coach-pro.html --fast --write --note "..."` and the same without `--fast`. The
nba fingerprints change on purpose: a new career starts on the front office (fifteen deep, new contracts), so the
universe, every season and the screens differ. Fast b67133ff4419ea04 -> ecd19db9673c1f77; full
b0d4fc8493ebefae -> 7f265d5b9a428baa (3 min 15 s). Both re-checked MATCH right after recording.
