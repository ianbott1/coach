# Review round 3, branch rv3/hockey-fo: pro hockey's front office (engine 27)

Game: pro hockey only (`hockey-coach-pro.html`, league `nhl`). Code is in `src/leagues/nhl` (new: `24_hkcap.js`,
`27_hkrun.js`, `28_hkviews.js`, `29_hktrades.js`; edited: `26_offseason.js`, `98_offseason_views.js`) except for small
guarded hooks in `src/core/98_trades.js` and `src/core/98_trades_cpu.js` (entry 7). Nothing in `src/hockey/` changed.
Everything that moves a result is gated on engine 27: a career's summer runs on the new rules when it follows an engine-27
season (`hkSummer()`), and the career is on them from then on (`u.hkFO`). `ENGINE_NOW` is 27.
Test: `node test/hockey-fo.js [seasons=20] [seed=11]` (20 summers, about a minute alone; in the fast tier).

Before this, pro hockey shared pro football's simpler offseason: twelve men with one-number contracts under a $90M
limit, no floor, no restricted free agents, no entry-level deals, no buyouts, nothing kept in a trade.

## 1. The real 2026-27 cap sheet
- What changed: the upper limit $104.0M, the lower limit $76.9M, the $850K minimum, the most one man may count ($20.8M,
  20% of the limit), contracts as a cap hit and years (seven re-signing your own man, six with a new club), the
  fifty-contract limit, and up to 10% over the cap in the summer but under it by opening night (`HK$`, `24_hkcap.js`).
  `LEAGUE.cap` reads $104.0M once a career is on the rules. Every club card and the Trades tab show the cap hit with dead
  money and the room left.
- Why: the old limit was $90M with no floor, and payrolls ran from 39% to 94% of it (median 66%): nothing like a hockey
  GM's year, where nearly every club works against the cap.
- Sources (verified Nov 2026):
  - $104.0M / $76.9M: https://www.nhl.com/news/nhl-nhlpa-announce-team-payroll-range-for-2026-27-season
  - $20.8M, Kaprizov's $17.0M the 2026-27 high: https://thehockeynews.com/nhl/vancouver-canucks/latest-news/a-look-at-the-nhl-salary-cap-rules-for-the-2026-27-season
  - $850K minimum, the entry-level maximum ($1.0M for the 2026 draft), seven and six years from Sept 16, 2026, the
    qualifying-offer steps: https://capwages.com/articles/2025-memorandum-of-understanding
  - 23-man roster, buyouts, the 10% summer allowance: https://capwages.com/articles/nhl-salary-cap-explained and
    https://www.prohockeyrumors.com/2024/08/salary-cap-transactions-faqs-waivers-retention-buyouts-more.html
- Game(s): pro hockey.
- Tested: `test/hockey-fo.js` (the cap the game reads, no contract past seven years, no club past fifty contracts).
- Not yet: the cap stays at 2026-27's figure every season (ratings are held to the opening league, so the money is
  too); performance bonuses and the bonus cushion; long-term injured reserve; the variance limits on a contract's years.

## 2. Twenty-three and a reserve list
- What changed: a roster is twenty-three men under contract. The engine still plays twelve (a first unit and a man
  behind each, slots 0-11); slots 12-22 add a third man at each spot (a third goalie too) and a fourth forward at each
  spot and a fourth man on each side of the blue line. The cap counts all twenty-three. Behind them, the reserve list
  (`u.hkRes`): drafted men whose rights are held, signed to entry-level deals at 20 if they're worth it, called up in
  the summer when better than the last man at their spot, let go when they don't make it. The draft has three rounds.
  The roster tab lists the other eleven and the reserve list.
- Why: a hockey roster is twenty-three, and prospects in junior and the minors are half a GM's job.
- Game(s): pro hockey.
- Tested: twenty-three on every roster after every summer (672 of 672 club-summers); the roster tab and the summer screen
  render the reserve list (`test/hockey-fo.js`).
- Not yet: the extras play only through the twelve the engine plays (an injury still goes to the engine's own
  replacement, not to the named third man); waivers; the AHL as a league; two-way deals beyond a prospect's renewal.

## 3. Restricted and unrestricted free agency, qualifying offers, arbitration, offer sheets
- What changed: a man whose deal ends is unrestricted at 27 (as the game counts age) or after seven seasons; otherwise
  restricted. Qualified (110% of a salary up to $1.25M, 105% to $1.75M, the same above), he signs: a young star buys out
  his free-agent years (seven years near his market), others take a bridge of two or three years. Not qualified, he's
  unrestricted. A man with arbitration rights (by his age at his first contract: 18-20 four pro seasons, 21 three, 22-23
  two, 24 and up one) may file or be taken there: the award is about what comparable men are paid, for one or two years,
  and a club may walk away from an award of $5.7M or more. Another club with cap room may sign a qualified restricted
  man to an offer sheet; his club matches or takes the picks the 2026 table calls for (none up to $1.58M; a third; a
  second; a first and a third; a first, second and third; two firsts, a second and a third; four firsts above $11.94M).
  Picks move through a ledger (`u.hkPk`) the draft reads (`LEAGUE.pickOwner`).
- Why: restricted free agency, the bridge deal, the offer sheet and arbitration are what make an NHL summer different
  from the other leagues'.
- Sources: offer sheet table https://www.prohockeyrumors.com/2026/05/nhl-sets-offer-sheet-thresholds-for-2026.html ;
  arbitration eligibility https://www.prohockeyrumors.com/2016/07/capology-101-arbitration-part-1.html ; the award's
  term and walking away https://flamesnation.ca/news/cba-school-article-12-salary-arbitration (the walk-away line was
  $4.4M in 2019; $5.7M is that scaled to today's cap, my estimate); offer sheets are rare, twelve in the cap era
  (2006-2024): https://www.dailyfaceoff.com/news/a-brief-history-of-offer-sheets-in-the-nhls-salary-cap-era
- Numbers (20 summers, seed 11): offer sheets 0.6 a summer (real 0.6); about four arbitration awards a summer.
- Game(s): pro hockey.
- Tested: `test/hockey-fo.js` (your arbitration case is heard; your sheet is sent, or why not is said; sheets 0-3 a
  summer).
- Not yet: the player's own election of the term in a player-filed case; arbitration settled before a hearing; the
  offer sheet's seven-day window as days; a sheet's compensation for the current year's picks only (later years' firsts
  are checked as held, not traded).

## 4. Buyouts and dead money
- What changed: in June a club may buy a man out: two-thirds of what's left (a third under 26), over twice the years
  left, a third (a sixth) of his cap hit against the cap each year (`hkBuyHit`, `u.hkDead`). The computer buys out an
  older man paid far over his worth, one a summer at most. The summer screen lists your candidates with the dead money
  each would leave.
- Why: the buyout is the GM's way out of a bad deal, at a price later.
- Numbers: about four buyouts a summer league-wide (real: about 5-15).
- Game(s): pro hockey. Tested: your buyout goes through and the banner reports it (`test/hockey-fo.js`).
- Not yet: the cap hit's exact year-by-year shape when a deal's salary varies by year; compliance buyouts.

## 5. Free agency from July 1 and the entry-level deal
- What changed: five days of bidding (the NBA design from round 1, `27_hkrun.js`): each club offers what its room and
  the cap it aims at allow; a man weighs money, years, a winner, his role and his old club. Your targets go first, at the
  price and years you set (+/- $250K, +/- a year); a restricted man on your list gets an offer sheet instead. A drafted
  man who makes the team signs his entry-level deal (three years at 18-21, two at 22-23, one from 24; the first round
  near the $1.0M maximum); the rest go on the reserve list.
- Game(s): pro hockey. Tested: your offers render with their price, years and a sheet's picks (`test/hockey-fo.js`).

## 6. The computer's clubs spend to the cap like the real league
- What changed: the market's shape is the league's (a star near $17M, a top-six forward $6-10M, the bottom of the roster
  at or near the minimum: `HK_MK`, `HK_TOP`), and its level is set each summer from the ratings so that the league's
  twenty-three-man rosters at market prices cost a little over what the clubs can spend (`hkIndex`, no dice; restricted
  men, entry-level deals and the minimum bring the payrolls under). Clubs aim by where they stand: the top ten at the
  cap, the middle just under, the bottom six leaving room. A club re-signs while the rest of its places still fit at the
  minimum; one over the cap on opening night waives the worst value below its top twelve; one under the floor pays its
  one-year men up to it. New careers' opening contracts are spread like an opening night (86-99% of the cap).
- Numbers (20 summers on the computer's hands, seed 11, after each summer; engine 26 had no comparable sheet: median
  payroll 66% of a $90M limit, 10th percentile 39%):

  | Measure | Engine 27 | Real | Source |
  |---|---|---|---|
  | median payroll | 97.0% of the cap | 97.7% (2025-26) | PuckPedia opening rosters |
  | clubs within 3% of the cap | 52% | 59% | same |
  | clubs with 8% or more of room | 23% | 22% | same |
  | clubs under 80% of the cap | 0.6% | none in 2025-26; a rebuilding club near the floor some years | same |
  | over the cap / under the floor | 0 / 0 | 0 / 0 | NHL |
  | the top eight by strength | 98.2% of the cap | contenders at the cap | same |
  | top cap hit | $17.5M (16.8%) | $17.0M of $104.0M (Kaprizov) | The Hockey News |
  | average cap hit | $4.27M (4.1%) | $3.5M of $95.5M (3.7%, over every NHL contract) | The Win Column |
  | players above the average | 40% | 41.5% | same |
  | standings points sd | 15.9 | about 14 (engine 26: 15.7) | |

  Sources: https://www.puckpedia.com/news/2025-26-nhl-season-opening-rosters ,
  https://thewincolumn.ca/2026/04/19/how-much-do-nhl-players-make-in-2025-26/
- Game(s): pro hockey. Tested: `test/hockey-fo.js` (all of the table, seeds 3, 7 and 11 checked while tuning).
- Not yet: clubs don't plan a summer ahead (a contender doesn't clear room the year before a big re-signing).

## 7. Trades: retained salary and the deadline
- What changed: in season, to March 1 (the 2027 deadline), a trade must leave both clubs under the cap with their dead
  money; when one would be over, the club sending a man may keep part of his cap hit for the rest of his deal: up to
  half, in steps of 5%, three retained deals on a club's books at a time, 15% of the cap in all, and a contract already
  retained on isn't retained again (`29_hktrades.js`). Your deals say who keeps what; the computer's deadline deals use
  it (the seller keeps salary so the contender fits). Core gets five small hooks, used only by pro hockey:
  `LEAGUE.trade.capFit` (98_trades `tdDeal` and 98_trades_cpu `cpuDeadline`), `onRetain` (`tdApply`), `carryRetain`
  (`tdCarry`), `retWords` and `payNote` (the Trades tab). With no hook, each line does what it did.
- Why: retained salary is how the real deadline works under a hard cap.
- Sources: https://www.puckpedia.com/salary-cap/retained-salary ;
  https://www.yardbarker.com/nhl/articles/2027_nhl_trade_deadline_set_for_march_1/s1_16958_44098157
- Numbers: about one in three of the computer's deadline deals keeps salary (9 of 24 in four seasons, the most 45%).
- Game(s): pro hockey. Tested: `test/hockey-fo.js` (a deal over the cap works with 30% kept; over by more than half,
  no deal; the rules hold on every club's books every season); engine-26 replay of all seven games.
- Not yet: the summer trade screen (football's one-for-one block) has no retention; picks other than first-rounders
  aren't traded in season; no-trade clauses; the 75-day wait before re-retaining.

## 8. The summer screen, in the sport's words
- What changed: under the front office the summer screen leads with the cap hit, the twenty-three signed, the fifty
  contracts and the floor; each expiring man shows his status (unrestricted; restricted; restricted with arbitration
  rights) and its choices (re-sign or let go; qualify and sign, arbitration with one or two years and accept or walk
  away, or don't qualify; match any sheet or take the picks). Then buyouts, free agents and offer sheets with your price
  and years, the draft, and the reserve list. The banner that closes the summer reports buyouts, arbitration, qualified
  and unqualified men, offer sheets both ways, call-ups and entry-level deals. `28_hkviews.js`.
- Game(s): pro hockey. Tested: rendered headlessly and read as text in `test/hockey-fo.js` (Playwright isn't installed).

## Old saves
- A career begun on engine 26 keeps its twelve men, contracts and the $90M limit through its season and its summer
  (that summer ran on engine 26). Its next season is on engine 27; at that season's summer (`hkStart`, from hashes, no
  dice) every contract is re-priced on the new market, eleven men are added to make twenty-three, six prospects make a
  reserve list, and the career comes onto the rules. Checked in `test/hockey-fo.js` through the game's own load path.

## Tests run (this branch)
- `node test/hockey-fo.js` (20 seasons, seed 11): MATCH (also seeds 3 and 7 for 20 seasons while tuning).
- `OLD=/home/claude/dist-e26 node test/engine-replay.js`: MATCH for all seven games.
- `test/reload.js dist/hockey-coach-pro.html`: MATCH 18 of 18 reloads. `test/saves.js`: MATCH. `test/migrate.js`:
  MATCH 2253 of 2253 checks.
- `node test/boxscores.js hockey`: one band misses on its one seeded season, 50-goal men 15 against a band of 0-14
  (engine 26 on the same seed: 11). Six seeds each: engine 27 averages 21.7, engine 26 20.7 (season lines with
  playoffs), so it's the season's dice moving with the deeper roster, not a shift in scoring.
- `test/hk-economy.js`: payroll median 93% of the cap (10th 83%, 90th 99%), top-6 kept 85%, points sd 16.5; before
  this branch, 66% of $90M (10th 39%, 90th 94%), 83%, 15.7. Its printed ask line still uses the old curve.
- `test/nhl-screens.js`: MATCH 689 screens. `test/nhl-playoffs.js 3`: MATCH 389 checks. `test/nhl-clinch.js 4`:
  MATCH 270. `test/hk-gameday.js`: MATCH. `test/shirts.js`: MATCH.
- `test/hk-pp-goal.js`: MISMATCH on engine 27, one even-strength goal (55') within two minutes of the other side's
  penalty (53'); MATCH with ENGINE_NOW=26. The game day draws each five-minute spell on its own, so a spell's
  even-strength goals can land inside a power play begun late in the spell before (src/hockey/50_game.js). The
  deeper roster moves the season's dice onto it; the game day itself is unchanged here.
- `test/longrun.js --short`: see the report.

## Files
- New: `src/leagues/nhl/24_hkcap.js`, `27_hkrun.js`, `28_hkviews.js`, `29_hktrades.js`, `test/hockey-fo.js`.
- Edited: `src/leagues/nhl/26_offseason.js`, `src/leagues/nhl/98_offseason_views.js`, `src/core/20_engine.js`
  (`ENGINE_NOW` 27), `src/core/98_trades.js`, `src/core/98_trades_cpu.js`, `test/run-all.js` (fast tier).
