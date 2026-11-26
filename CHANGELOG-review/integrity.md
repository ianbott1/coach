# Long careers: season 20 should look like season 1 (branch rv2/integrity, engine 26)

Games: all seven. Every change below that moves a result is gated on `ENGINE_V >= 26` (`eng26()`, core
`20_engine.js`). The offseason runs on the engine of the season it closes, so a career whose season began on
engine 25 plays that summer exactly as before; its next season starts on 26. New careers start on 26.

How it was measured: `test/longrun.js` (new) plays do-nothing careers (the staff's plan, the staff's offseason) for
20 seasons, 2 careers per pro league and 4 per college league, and compares the late league (each career's last 5
seasons) with the early one (seasons 1-3) and with the real league. Before = engine 25 (`/home/claude/dist-e25`),
after = this branch. The table at the end has both runs.

## 1. Ratings stay on the 0-99 scale; a hidden ceiling that a breakout reveals

**What.** Each player gets a ceiling, drawn once from his name and the career's seed (no dice): his scouted potential
plus |N(0,4)|, less near the top (a scouted 90 hides about 1.4) (`ceil26`). A breakout year can reveal it but never
pass it, or 99 (`develop26`). Potential is clamped at 99 everywhere. In college basketball a five-star at a top
program could arrive at 100-101; now 99.

**Why.** On engine 25 a breakout raised potential with no ceiling, so leaps compounded: hockey reached 104 and a
potential of 103, soccer 105 (potential 112), college basketball 101. The NBA's best player went 77 to 91 and hockey's
74 to 97 over 20 seasons.

**Game(s).** All seven (college basketball: the five-star cap only).

## 2. Aging: a peak at 26-29, a steeper fall from 31, later for some positions

**What.** One curve for the pro leagues (`ageBase26`): growth to 25, a plateau 26-28, easing at 29, a fall that
steepens from 31. Each league shifts the positions that age later or sooner (`AGE26`): NHL goalies +3 and defencemen
+1; Premier League keepers +3, centre-backs +1, wingers -1; MLB starters and closers +1, catchers -1; NFL running backs
-2. An NFL quarterback grows like anyone to 27, then ages at half speed to 35 (four years in hand from then on).
Retirement and the re-sign and free-agent age cut-offs read the same shift (the NFL's used to ignore it; `vetOK`). A
man well above the bar stays three years past the usual cut-off. In the NFL the re-sign bars read the position's place
in the league (a starting quarterback sits 1.7 below the league's starters, `bar26`). NBA rookies arrive four points
further from the same ceiling (with rookies as good as the men they replaced, the league's balance put its peak at
24-25).

**Why.** On engine 25 every league peaked at about 25 and the summer change was already -0.6 to -1.2 at 26-28 and -1.7
to -2.2 at 29. No starting quarterback was older than 34 in 40 NFL seasons; goalies and keepers aged like skaters.

**Sources.** MLB hitters peak about 26 (https://blogs.fangraphs.com/checking-in-on-the-aging-curve/); NBA players about
27 (https://aws.basketball-reference.com/blog/index5ed6.html?p=2953); NHL forwards 27-28, defencemen 28-29, goalies
change little with age (https://medicalxpress.com/news/2014-05-nhl-players-peak-age.pdf); quarterbacks starting past 40
(https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/aaron-rodgers-joe-flacco-brings-a-rare-matchup-of-40-year-old-quarterbacks).

**Game(s).** The five pro games.

## 3. Each summer the league is held to its opening shape

**What.** After each offseason (`recentre26`, called from core `endSeason`):
- the starters' mean is set back to the league's opening mean (both ways);
- their spread is narrowed back to the opening spread if it has widened (never stretched);
- the top 1% of starters is drawn back to its opening level if it has risen (what lies past the top tenth is drawn in);
- each position is put back in its opening place against the league (`REFPOS26`);
- soccer does this by division (the pyramid's levels are its own);
- every man is rounded by his own hash, so a small shift moves the league a little rather than nobody.
The attributes' average lean is re-centred the same way (`attrRecentre26`, core `93_attrs.js`). The opening values
(`REF26`, `REFPOS26`) are the starters of ten fresh universes per league.

**Why.** Engine 25 drifted upward: starters' mean +4 to +6 in the NBA, NHL and Premier League; hockey's goals a game 6.2
to 7.7, its top scorer 73 to 89 goals and 50-goal men 17 to 51 a season; MLB's home run leader 51 to 66 (83 at most)
and a .418 batting title; payrolls up 1.2 to 3.1 times. The first version held the soccer pyramid as one and squeezed
the Premier League (its starters' sd 9.8 to 4.3, goals 0.85 times). Keepers' later peak lifted the position and cut
scoring, hence the hold by position.

**Game(s).** All seven.

## 4. College: programs and recruiting classes over 20 seasons

**What.**
- The programs' spread is held to the opening one (`programRecentre26`, both college games).
- A computer coach retires from his tenth season: 5% a year, plus 2.5 points a year after that (about sixteen seasons
  for a coach who is never fired). The draw comes from a hash, so no other dice move. His successor is hired as for a
  firing, and the offseason's news counts the change. College only.
- College basketball's programs drift back toward their level in the 64-team era. A title before 1985 counts 2 points
  of pedigree, not 7 (`ANCHOR26_OF`). Titles 1985-2025 come from
  https://en.wikipedia.org/wiki/List_of_NCAA_Division_I_men%27s_basketball_champions. A new career's programs start
  there too (UCLA's 58 Elo lower, Kentucky's 29); the rosters and coaches are as drawn.
- Players are held to the opening level, as in the pros.

**Why.** Football's programs drifted apart every year (sd 204 to 283 Elo in 20 seasons), and its starters' mean fell 3
points. No coach ever retired, so a 68-rated coach at the top program kept the job for twenty seasons. UCLA, ten of
whose eleven titles came in 1964-75, sat at the top of the prior. It won 5 and 8 of 20 titles in the two engine-25
careers. After: 9 of 80 in four careers (2-3 each).

**Game(s).** College football, college basketball.

## 5. The summer's dice are the career's own

**What.** The offseason's random stream is seeded by the career and the year (`offseasonRng`, core `99_app.js`);
engine 25 keeps its fixed seed.

**Why.** Every career's offseasons ran on one tape (RNG(0)), so the same clubs rose in every career (Buffalo gained in
18 of 18).

**Game(s).** All seven.

## 6. test/longrun.js

**What.** 20 seasons, every league, checked against bands (each with its source in the file): ratings past 99 and
potentials; drift of the starters' mean, top 1% and best player, scoring, wins spread, payroll and the attributes' lean;
the real league late in a career (MLB home run leader and batting title, runs; NHL goals a game and top scorer; NBA
points; Premier League goals; NFL points, wins spread, oldest starting quarterback and how many start at 35+; college
points); aging by age and the late positions; franchise drift independent across careers; one program's share of
college titles. `--short` (6 seasons, one career) is in run-all's fast tier; the full run in the long tier.

## Tested

- `node test/longrun.js` (20 seasons; 2 careers in each pro league, 4 in each college league): engine 25 **58 bands
  out**, this branch **MATCH** (0 out). `--short` (run-all's fast tier): MATCH in 115 s.
- Early = seasons 1-3, late = each career's last 5 (means over seasons):

| League: measure | early e25 | late e25 | early e26 | late e26 | real |
|---|---|---|---|---|---|
| MLB: best player | 74.8 | 92.6 | 73.8 | 74.6 | |
| MLB: home run leader | 51 | 66 (83 at most) | 51 | 55 | 44-62 |
| MLB: batting title | .318 | .377 (.418 at most) | .316 | .331 | .310-.355 |
| NHL: starters' mean | 59.3 | 63.4 | 59.3 | 59.5 | |
| NHL: goals a game | 6.15 | 7.67 | 6.17 | 6.24 | 5.8-6.4 |
| NHL: top goal scorer | 73 | 89 | 72 | 67 | 44-69 |
| NHL: 50-goal men a season | 16.5 | 50.5 | 19.2 | 15.2 | |
| NBA: starters' mean | 59.3 | 64.4 | 59.6 | 59.7 | |
| NBA: top 1% of starters | 72.8 | 89.2 | 72.5 | 72.1 | |
| NBA: points a team | 113.2 | 116.3 | 113.6 | 114.2 | 110-116 |
| Premier League: best player | 96.2 | 105.9 | 94.0 | 92.2 | |
| Premier League: median payroll | 26 | 82 | 28 | 35 | |
| NFL: best player | 81.7 | 87.5 | 82.5 | 82.8 | |
| NFL: starting QBs 35+ a season | 0 | 0 (oldest 34) | 0 | 1.3 (oldest 37) | about 5 |
| College football: starters' mean | 59.7 | 56.7 | 61.1 | 61.1 | |
| College basketball: rating past 99 | | 101 | | none | |
| Any league: rating past 99 | hockey 103, soccer 109 | | none | | 0-99 |

- Summer change by age (late e26): NFL +0.2 at 26, -0.2 at 28, -0.8 at 29, -2.4 at 32; NBA -0.2 at 26-27, -1.1 at 29;
  NHL -0.3 to -0.6 at 26-28, -1.0 at 29; Premier League 0 to -0.3 at 26-28; MLB -0.2 to -0.5 at 26-28. Engine 25: -0.6
  to -1.2 at 26-28, -1.7 to -2.2 at 29. Goalies, keepers, starting pitchers and quarterbacks at 30-32 change 0.4 to 0.9 a
  summer more than the others (engine 25: 0.0 for goalies and keepers, 0.2 for pitchers).
- College titles: football's most frequent winner 9 of 80 (engine 25: 7 of 40); basketball's UCLA 9 of 80, 2-3 a
  career (engine 25: 5 and 8 of 20).
- `OLD=/home/claude/dist-e25 node test/engine-replay.js`: MATCH (an engine-25 season replays as played, all seven).
- `node test/migrate.js` MATCH 2253 of 2253; `node test/saves.js` MATCH; `node test/reload.js` MATCH 18 of 18 in each
  game; `node test/attrs.js` MATCH 168570 checks.
- Goldens: all seven fast goldens matched on the engine-25 build before any change. Re-recorded, one at a time
  (`golden.js --fast --write`, `golden.js --write`, `hotseat.js --write`): every game's results moved, since every
  new career is on engine 26.

## Not yet

- The NFL has about 1.3 starting quarterbacks aged 35+ a season, oldest 37; the real league has about five, and
  40-year-olds start. Holding the position's level means the old ones must beat the young ones on their own team.
- Professional head coaches still never retire (college coaches now do).
- College basketball: UCLA is still the most frequent champion (2-3 titles a career): it starts third in the prior
  and keeps its strong rosters.
- The NBA's peak is about 25-26 by the delta method (real about 27). NBA rookies now arrive further from the same
  ceiling. The other leagues' drafts weren't changed.
- MLB: wins spread 15.0 late (band 10-15.5; MLB 2024 12.3). It was 14.3 on engine 25, so it isn't new here.
- The soccer wage bill rises from 28 to about 35 in the first five seasons, then holds. The band is judged against
  seasons 4-6.
- The tail hold and position hold use fixed opening values (REF26, REFPOS26). If a league's roster generation
  changes, re-measure them: the starters' mean, spread, top 1% and each position's offset in ten fresh universes per league.
