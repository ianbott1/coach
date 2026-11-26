# rv2/college: the college roster economy (engine 26)

College football (cfb) and college basketball (ncaab). Sport-neutral core in `src/core/92_market.js`, switched on by
`LEAGUE.market` in each college league (`src/leagues/cfb/26_offseason.js`, `src/leagues/ncaab/26_offseason.js`) and shown
on each league's offseason screen. ENGINE_NOW 25 -> 26: a season begun on engine 25 or earlier plays its winter as it
was played (the old budget screen, no market); the career's next season is on engine 26.

## 1. Revenue sharing and NIL: a roster budget spent on players

**What changed.** The offseason budget's four buckets (recruiting, development, facilities, retention) are gone at
engine 26. Every program has a roster budget in dollars instead, by conference tier and prestige, raised by a good
season (8 wins in 10: x1.12). Every returning player asks to be paid what the open market would pay him (his market
value: rating, position, room to grow; a loyal man asks less, a Group of Six star whom bigger programs want asks more).
The staff's plan, and every computer program, pays the most important players first, up to most of the money; you can
pay or drop anyone (the "Pay" toggle). What is left is your portal money. Money isn't carried over. The screen shows the
House settlement's cap, the roster limit (105 in football, 15 in basketball), the money outside the depth chart and the
money left; the button is blocked while you're over budget.

**Why.** Since the House settlement (approved June 2025) a school may share about $20.5M a year with its athletes,
$21.3M in 2026-27, most of it on football, and collectives add more. A four-bucket points slider no longer resembles the
job: today's college coach spends real money keeping and adding players, against rosters that can leave every winter.

**Figures used.**
- Cap: $21.3M in 2026-27, up 4% from $20.5M
  (https://insidetheloudhouse.com/syracuse-will-pay-its-athletes-the-maximum-amount-allowed-21-3-million-next-season,
  https://www.aol.com/articles/ohio-state-sports-receive-revenue-140213086.html). The common split, 75% football and
  15% men's basketball (https://africa.espn.com/college-sports/story/_/id/45469494/ncaa-settlement-done-divide-spoils).
- Football: most power rosters cost $14-16M, contenders $30M and more, near $40M; Group of Six a few million (CBS Sports,
  2026: https://www.cbssports.com/college-football/news/college-football-transfer-portal-2026-retention-gap-conference-tiers/).
  The best quarterbacks $3-5M, linemen $1M and more
  (https://www.espn.com/college-football/story/_/id/47624150/2026-college-football-transfer-portal-trends-prices-qbs).
- Basketball: eleven programs at $20M or more for 2026-27, only Kentucky and Louisville in 2025-26 (CBS Sports via
  Bleacher Report, Oct 2026:
  https://bleacherreport.com/articles/25517245-duke-unc-kentucky-headline-tier-1-schools-spending-20m-cbb-rosters-new-cbs-report-says).

**Game(s).** College football, college basketball.

**Tested.** `test/cfb-portal.js` (2 careers x 6 seasons): Power Four budget median $14.7M (real most $14-16M), mean
$19.0M, top $42.6M (real contenders $30-40M), Group of Six mean $3.1M (real a few million); no program spends more than
its money (every program, every winter). `test/bb-portal.js`: the same spending check for 365 programs.

**Not yet.** Revenue sharing is one number per program; the other sports' share, Title IX questions and the roster's
85 players outside the depth chart are not modelled. Money is not carried across winters, and in-season NIL deals (a
player's morale over pay) are not tracked.

## 2. The transfer portal, every program, in one window

**What changed.** Football's portal is a winter window (Jan 4-13, 2027: ten days from the first business day after
Jan 1, NCAA Division I Cabinet, Oct 2026); basketball's is the spring's (15 days in April). Who enters comes from why
he'd go: buried behind a better starter, a new head coach, a Group of Six player good enough to start at a Power Four
program (a mid-major star in basketball), a Power Four star below the contenders, a losing team, unhappiness and
distrust from the people layer (morale banked at the season's end and the trust your conversations build or break), his
traits (loyalty, ambition), and whether he was paid. Quarterbacks move more. Every computer program with a need and the
money bids; you bid on the players you choose, at Offer, Strong offer, Top offer or twice his value. Each player signs
where the deal is best for him: the money against his value, playing time, the program against his old one, the Power
Four's stage for a Group of Six man, the season it had, and a part that's his own; below a reserve he takes nothing
(he drops a level). The screen lists who would leave you and why, the portal within your reach (likely, a battle, a long
shot: his choice played out on fixed dice against every other bid), and the best of the rest; the banner after the
window shows who came, who went, the targets you missed and why, and what it cost. In college basketball this replaces
the old portal (backups who wanted minutes, one star in twelve, first look for you, two transfers a program).

**Why.** The review found college football had no portal at all and college basketball's moved about 300 players a
year where the real sport moves about 2,000. The portal is now the central roster decision in both sports.

**Figures used.**
- Football entrants: 4,201 in 2024-25, just over 3,000 in January 2026 (down 23-29% after schools began paying players)
  (https://frontofficesports.com/article/college-football-transfers-down-23-after-schools-started-paying-players/);
  more than a third of FBS scholarship entrants still unsigned near the window's close (ESPN, above).
- Retention: the Group of Six kept 29.5% of returning all-conference players (73 of the 81 who left went to the Power
  Four), the Power Four 74.6%; transfers were 42% of Power Four and 47% of Group of Six all-conference players (CBS,
  above). About 64% of 2026 FBS starting quarterbacks are transfers
  (https://www.footballscoop.com/2026/09/09/study-nearly-two-thirds-fbs-schools-start-transfer-quarterbacks).
- Window: https://www.ncaa.org/news/division-i-cabinet-approves-new-transfer-windows-in-several-sports/
- Basketball: 2,033 men's entrants by April 10, 2025, about 35% of D-I rosters, after 2,088 in 2024
  (https://frontofficesports.com/article/more-than-2000-mens-basketball-players-have-entered-transfer-portal/); the
  2026 window ran April 7-21
  (https://bleacherreport.com/articles/25415606-college-basketball-transfer-portal-sees-1500-mens-player-entries-1st-day-window).

**Game(s).** College football, college basketball.

**Tested.** `node test/cfb-portal.js` (2 careers x 6 seasons, about a minute): MATCH 5,241 checks.

| College football | Before (engine 25) | After | Real |
|---|---|---|---|
| Entrants a winter, share of the depth chart | none | 24.7% (652 a winter) | 21-29% of rosters |
| Entrants who signed | - | 74% | under two-thirds by the window's close |
| Group of Six all-conference who moved | 0% | 69% | 70.5% |
| ... of them to the Power Four | - | 93% | 90% |
| Power Four all-conference who moved | 0% | 26-33% | 25.4% |
| All-conference players who are transfers (seasons 4+) | 0% | 37% | 42-47% |
| Starting quarterbacks who are transfers | 0% | 53% | 64% |
| Distinct champions in 12 seasons (6 careers) | 8.7 | 7.7 | 7 (2014-2025) |

The entrants fall from about 840 in the market's first winter to about 570 in later ones, as the real portal fell after
schools began paying. The screen's preview was the market in every winter (12 of 12, offers and a job move included),
and your offers signed as often as the screen's chances said (10 of 24, the chances summed to 10.7). Every roster keeps
its twenty, nobody is on two, and an engine-25 season's winter (OLD=/home/claude/dist-e25) gives the same rosters on
both builds with no market, then the next winter runs it.

College basketball, `node test/bb-portal.js 4`: MATCH 4,439 checks. Entrants 31.8% of the ten a spring (before: about
8-10%, about 300 players; real about 35% of rosters), 76% signed, mid-major starters rated 70+ who moved 89%, all to
high-majors; starters who are transfers 48% (seasons 3+). `test/bb-march.js 2 60` (the market build): MATCH, every
first-round seed line and the 1 seeds' titles and Final Fours within history (48 tournaments).

**Not yet.** One window a year (no spring window in football, no graduate transfers: seniors graduate). Players are
not tampered with in season, and the portal has no "do not contact" tag. In basketball a transfer you sign can still
declare for the NBA draft that summer; the banner says so, and you've paid for him. Your offers are one per player;
the computer's do not escalate. Starting quarterbacks who are transfers are still under the real share.

## 3. Your players ask to leave: the conversations

**What changed.** The people layer's in-season "thinking about the portal" talk (core 93_morale) now has a
consequence in the window: a player's banked morale under 40 adds to his push, over 75 takes from it, and every point of
trust your answers built (or broke) moves it by three points. The screen gives each player's reason in his own terms
("He's behind a better player and wants to start somewhere", "Bigger programs will pay him more than you can").

**Why.** The brief asked that your own players ask to leave through the conversations the people layer already has,
not a second system.

**Game(s).** College football, college basketball.

**Tested.** `test/cfb-portal.js`: the preview reads each man's morale and trust as the season's end banks them (the
preview was the market in every winter).

**Not yet.** No conversation at the window itself (a promise of the starting job, say). Weekly recruiting decisions
(board, visits, offers; item 3 of the brief) were not started: the existing recruiting board stands as it was.
