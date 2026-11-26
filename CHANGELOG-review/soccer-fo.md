# Review round 3 branch rv3/soccer-fo: the money side of English football (soccer, engine 27)

The benchmark is the real Premier League and Championship: where the money comes from, what the rules let a club spend,
and how clubs buy and sell in the two windows. Every change that moves a simulated result is gated on `ENGINE_V >= 27`
(`eng27()` in `src/core/20_engine.js`, `fo27()` in the soccer files); a season begun on engine 26 plays and replays
exactly as it did, and a career from before carries on, moving onto the new money at its next summer. New files
`src/leagues/epl/28_money.js` (the model), `99_fo.js` (the books card, the summer window's screen, the 1 March check),
`99_fo_jan.js` (the January window). Measured in `test/soccer-fo.js`.

The game's squad is twelve men (a starter and a backup in six units), so the model reads the twelve as the core of a
squad: squad costs are `SQ27` (2.4) times the twelve's wages and the year's write-off of their fees, which puts the
Premier League's squad costs where its wage bills are. The market's spending on the twelve is read the same way against
the league's whole-squad spending.

## 1. Revenue by division, the wage budget from it, parachutes (engine 27)
- What changed: each club in the top two divisions has a revenue in parts (`rev27`). The top flight: the equal share of
  £96.9M, a merit payment of £2.65M a place (£53M for the champions, £2.65M for 20th; by where the club is expected to
  finish before a ball is kicked, by where it finished when the books close), facility fees of £8.9M to £24.9M by
  stature, and matchday, commercial and the rest by stature (from about £25M to over £500M; Manchester City and
  Arsenal near £700M in all). The Championship: £11M of central money and solidarity, the club's own, and a parachute after relegation
  (55%, 45% and 20% of the equal share; the third year only for a club that was up more than one season). A relegated
  club's wages drop by 40% (the relegation clauses most top-flight contracts carry) and its board takes back half its
  savings. The board's wage budget for the twelve is its line on revenue (70% in the top flight, the UEFA squad cost
  rule's figure; 95% in the Championship) less the fees the twelve already carry (`budget27`), in place of the old
  budgets (90 to 320 in the top flight, which the review found never bound).
- Why: the review: "the model doesn't bind at the top", wages a quarter of a fixed budget, no revenue anywhere, no
  parachutes.
- Real figures (sources below): top-flight revenue £6.8bn in 2024-25 (£340M a club), wages 65% of it; Championship
  revenue £942M, wages 93% of it in 2023-24.
- Measured (`test/soccer-fo.js`, two careers, five seasons): top-flight revenue £334M a club; squad costs 63% of revenue
  (seasons 58% to 67%; real wages 65%); the Championship 66% (real 93%: lower here, see Not yet).
- Games: soccer. Files: `28_money.js`, `26_offseason.js` (the parachute clock, the relegation cut, `budgetOf`).
- Tested: `test/soccer-fo.js` parts 2 and 4.
- Not yet: League One and below keep the old budgets and kitties (their clubs aren't in the books).

## 2. The squad cost rule and its points deduction (engine 27)
- What changed: from 2026-27 the Premier League's rule: squad costs (wages, the write-off of fees) against revenue plus
  profit on player sales. Over 85% a levy (here, taken from next summer's money for fees); over 115% on 1 March, six
  points off and one more for every £6.5M over (`assess27` on the Saturday before 1 March, `sea.ded`, read by
  `LEAGUE.points`). The same rule is applied to the Championship, which adopts squad cost ratio rules at 85% from 2026-27
  (its sanctions aren't published; the Premier League's are used). The season's books close at its end (`close27`:
  revenue by where the club finished, the ratio, any levy) and are shown on the books card in both windows.
- Why: the brief: "the league's spending rule, with a points deduction for a breach".
- Measured: no deductions in ten seasons (the computer's clubs keep to their boards' lines, which are under the rule).
  The rule bites a human club that spends past its line (a club that buys with the wage room of sales it then doesn't
  make, or carries a relegated wage bill).
- Tested: `test/soccer-fo.js` (the rule's lines, no runaway deductions).
- Not yet: the levy is a cost against next summer's fees, not a payment to the league; the anchoring cap (a multiple of
  the bottom club's central money) isn't modelled.

## 3. The summer window negotiated (engine 27)
- What changed: the summer screen (Transfers in the summer's hub) now has the club's books, money for fees with where it
  comes from (40% of revenue in the top flight, 20% in the Championship, half as much again in a promoted club's first
  summer, half of last summer's leftover, instalments due and owed, any levy), bids for your players, deals agreed, talks
  and the market. You bid and the club answers at once (`tAnswer27`): a bid at the asking price is accepted, one within
  15% gets a counter at it, a lower one is called a low bid with a counter; a club's best player wanted by a club its
  own size isn't for sale under half as much again; a bid that meets a release clause can't be refused (12% of players
  at top-flight clubs outside the expected top seven have one, 20% in the Championship). Asking twice gets the same
  answer. A fee of £10M or more can go in instalments: 40% now, 30% in each of the next two summers (`u.inst`, owed by
  the buyer and due to the seller). You choose the contract (3, 4 or 5 years): the fee is written off over it, five
  years at most, so a longer deal costs less a year against the rule. A player may choose a bigger club after the same
  man (35% of targets have one): pay him a quarter more or lose him. Bids for your players come from clubs he'd go to,
  at 90% of your price; Ask for more gets 15% more or the club walks away (its limit worked out once).
- Why: the brief, and the review: the old window was a list of fixed prices, no answer, no terms.
- Tested: `test/soccer-fo.js` part 2 (answers, release clause, instalments, write-off), `test/transfers.js` (engine 26).

## 4. The homegrown rule (engine 27)
- What changed: the Premier League's squad list is 25, at most 17 of them over 21 and not homegrown. Of the twelve, at
  most 8 over 21 who aren't homegrown: a signing that would make a ninth is refused (yours, and the computer's), unless
  the man he replaces isn't homegrown either. Academy graduates are homegrown; of the men the game began with, a share by
  division (45% in the top flight, 65% in the Championship, more lower down). The market marks homegrown players.
- Tested: `test/soccer-fo.js` part 2.

## 5. The computer's market (engine 27)
- What changed: the computer's clubs in the top three divisions buy and sell (`market27`). Richest first and most
  often: three fee signings a summer at most in the top flight, two in the Championship, one in League One, each a
  starter upgrade it can put down the money for now and fit under its wage line, from a club its size or smaller or up
  to two divisions down, at the selling club's price. A club over its wage line must sell (15% off). A seller puts 80%
  of what it's paid back into its squad. Promoted clubs have half as much again, to stay up. The summer's deals go in
  the summer's news (`rep.market`).
- Why: before, only your bids moved players between clubs; the computer's clubs rebuilt through the academy and free
  transfers.
- Measured (two careers, five summers): the top flight's gross £2.23bn in squad terms (summers £1.6bn to £2.6bn; real
  £3.0bn in 2025, the record); the six richest clubs spend 35% of it (the
  real big six 49%); the Championship 12% of the top flight's (real 8%); promoted clubs £40M each against the top
  flight's £47M average (real 2025: Sunderland £162M, Burnley £108M, Leeds £98M against £150M).
- Not yet: the richest clubs spend less than real ones: their twelve's wages reach their 70% line, and the model can't
  yet sell a star to make room (the sold man would leave the twelve with no buyer). Clubs don't yet sell to a club
  abroad (the real top flight's net spend was £1.2bn of £3.0bn).

## 6. Loans (engine 27)
- What changed: a young backup (21 or under) can go out on loan for the season to a club a division or two down that
  would start him and can pay him; he comes back at the next summer, with growth for the minutes (`LOAN_DEV`: a
  starter's season adds 1.2 to his summer's development, a bench season 0.3). If he's no better than both men at his
  position at home, he's let go. You can loan one out and borrow one in a summer (a bigger club's young player who'd
  start for you; you pay his wages). The computer's top-two-division clubs loan one young backup each a summer.
- Measured: 128 loans in ten summers, all down the pyramid.
- Tested: `test/soccer-fo.js` part 4.

## 7. The January window with fees (engine 27)
- What changed: January's window (1 January to 2 February) is now a transfer window in the same terms as the summer's:
  the Trades tab reads Transfers; you bid a fee and the club answers, then sign him (40% now on £10M or more); clubs bid
  for yours, and you can ask for more. The twelve stay whole: the selling club takes the buyer's spare man at that
  position on loan until the summer (he goes home when the summer opens). The money: 12% of the summer's share of revenue
  kept back for January, plus the summer's savings, plus 80% of what you take in now. On the window's last Saturday the
  computer's clubs do their business (`jCpu27`): the top four and bottom five of each of the top two divisions, the
  richest first, seven deals at most in the top flight and five in the Championship, a club selling once. Your deals are
  kept among the day's moves (`S.promos`) and the computer's in the season's `cpuTr`, so a reload replays them; at the
  season's end the fees, instalments, write-offs and loans go into next season's books (`eplJanCarry`, from `tdCarry`).
- Why: before, January was one-for-one swaps with no money.
- Real figures: £372M in January 2025, about £400M in January 2026.
- Measured: January £305M in squad terms (the five-season mean; one January with your deals in, £358M).
- Games: soccer. Core: two guarded lines in `src/core/98_trades.js` (`tdApply` routes `x.epl27`, as it routes `x.nba`;
  `tdCarry` calls `eplJanCarry` before the swap) and one in `src/core/99_app.js` (the sub-tab's label from
  `LEAGUE.trade.tab` when a league gives one).
- Tested: `test/soccer-fo.js` part 3 (the screen, a buy, a sale, money, whole twelves, deadline day, a reload after
  deadline day and to the season's end, the books carried).
- Not yet: no loans in January other than the ones that go with a deal; no rival bidders in January.

## Sources (read Nov 2026)
- Premier League central payments 2024-25 (equal share £96.9M, merit about £2.6M a place, facility fees £8.9M to
  £24.9M): https://www.nbcsports.com/soccer/news/premier-league-prize-money-how-much-is-each-table-position-worth
- Premier League revenue £6.8bn, wages £4.4bn (65%), 2024-25:
  https://www.deloitte.com/uk/en/services/consulting/research/annual-review-of-football-finance-premier-league-clubs.html
- Championship revenue £942M in 2024-25:
  https://www.deloitte.com/uk/en/services/financial-advisory/research/annual-review-of-football-finance-football-league-clubs.html
- Championship wages 93% of revenue in 2023-24:
  https://www.deloitte.com/uk/en/about/press-room/deloitte-annual-review-of-football-finance-european-football-market-revenue.html
- Parachute payments (55%, 45%, 20%):
  https://en.wikipedia.org/wiki/Premier_League_parachute_and_solidarity_payments
- EFL central money for a Championship club:
  https://www.footballtransfers.com/en/transfer-news/uk-championship/2026/05/efl-tv-money-parachute-payments-explained-championship-league-one-league-two
- The squad cost ratio from 2026-27 (85%, 115%, six points and one per £6.5M, UEFA clubs 70%):
  https://www.premierleague.com/en/news/4467022/new-premier-league-financial-system-explained
- EFL squad cost rules from 2026-27 (Championship 85%, owners' £15M a season; League One 50%):
  https://www.fcbusiness.co.uk/news/efl-clubs-approve-changes-to-financial-control-rules/
- Transfer windows 2026-27 (15 June to 1 September; 1 January to 1 February):
  https://www.liverpoolfc.com/news/premier-league-confirms-dates-2026-27-transfer-windows
- Summer 2025: top flight gross £3.0bn, net £1.2bn; Championship £240M (£145M in 2024); relegated clubs' sales £225M:
  https://www.deloitte.com/uk/en/about/press-room/deloitte-premier-league-spending-record-eclipsed.html
- Summer 2025 club by club (big six £1.53bn of £3.13bn; Sunderland £162M, Burnley £107.8M, Leeds £98M):
  https://www.si.com/soccer/premier-league-transfers-total-money-spent-clubs-2025-summer-window
- January 2026 about £400M, January 2025 £372M:
  https://www.gbnews.com/sport/football/premier-league-winter-transfer-window-deadline-day
- Squad lists and the homegrown rule: https://www.premierleague.com/en/news/4097471/premier-league-squad-lists-explained

## Files
- New: `src/leagues/epl/28_money.js`, `src/leagues/epl/99_fo.js`, `src/leagues/epl/99_fo_jan.js`, `test/soccer-fo.js`.
- Changed: `src/leagues/epl/26_offseason.js`, `src/leagues/epl/27_transfers.js`, `src/leagues/epl/98_offseason_views.js`,
  `src/core/20_engine.js` (engine 27, `eng27`), `src/core/98_trades.js` (two hooks), `src/core/99_app.js` (the tab's
  label), `test/transfers.js` (pinned to engine 26, which it measures), `test/run-all.js` (the new test, fast tier).
