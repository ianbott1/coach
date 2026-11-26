# Round 3: a league with a memory (branch rv3/league-life)

The league goes on around you, in all seven games: a record book that starts from the real one, a Hall of Fame by each
sport's own rule, retired numbers, an awards night with finalists and the vote, coaches fired in season and after it
at the real leagues' rates, rivalries grown from playoff meetings, droughts and dynasties noticed, players retiring
with a farewell, and the owner (chairman, athletic director) who decides how long you have. Everything that moves a
result or a firing is gated on engine 27 (`ENGINE_NOW` 26 -> 27 in src/core/20_engine.js, "27: a league with a
memory ..."): a season begun on engine 26 replays exactly and banks nothing new. The shared work is
src/core/93_lore.js; each league's facts are in src/leagues/<id>/89_lore.js. The measuring test is
`test/league-life.js` (its header lists every source); `--short` plays 5 seasons a game (about 3 minutes on 4 cores),
the full run 16.

## The record book
- What: each league's real book as the game opens (single season and career; regular season for the pro leagues as
  they keep it, every game for college as the NCAA does, the Premier League's own league games since 1992-93), plus the
  team mark (most wins; most points in the Premier League). A record falls on the date it fell ("It fell on Jan 20,
  2027"), in the week's news as it happens ("breaks the single-season record for goals") and in the summer's. Your
  club keeps its own book from the day the game began (single season and with the club). The Dynasty tab has a new
  Records page: Records, Hall of Fame, Awards, Titles (champions, the longest waits, postseason rivalries or title
  races).
- Why: careers began at 0 in 2026, so a 31-year-old veteran had no career and no milestone could come; nothing in the
  game remembered anything the league did.
- Games: all seven.
- The years before the game began: every veteran gets an estimate of his career so far (`p.pre`), once, from his first
  season here (his rate over the seasons since his debut age, at 0.7, never more than half the real career record),
  so the milestones (`careerOf`, core 93_people) and the career records count them. The Premier League also keeps
  each man's Premier League tallies (`p.lc`): the game's careers count every division and cup.
- Tested: test/league-life.js; records fallen (player marks, season and career) RESULTS_RECORDS.
  Sources: NFL https://www.pro-football-reference.com/ (Manning 5,477 and 55 in 2013, Dickerson 2,105, Calvin Johnson
  1,964, Strahan 22.5, Lane 14; Brady 89,214 and 649, Emmitt Smith 18,355, Rice 22,895, Bruce Smith 200, Krause 81);
  NBA LeBron James 43,440 at the end of 2025-26 https://www.olympics.com/ioc/news/lebron-james-points-tracker-nba-all-time-top-scorer ;
  NHL Ovechkin 929 as 2026-27 opened https://www.tsn.ca/nhl/article/several-milestones-still-in-reach-as-ovechkin-winds-down-nhl-career/ ;
  Premier League Fernandes 21 assists in 2025-26 (a new record), Haaland 36 in 2022-23
  https://www.premierleague.com/en/news/4668605/everything-thats-been-decided-in-202526-premier-league ; the rest are
  the long-standing marks in each league's own book (named with their holder and year in 89_lore.js).
- Not yet: pro career totals include the postseason (the game's careers do); the regular-season-only career would
  cost a counter on every player, and save size matters. The book has no per-game or percentage records.

## The Hall of Fame and retired numbers
- What: when a career ends (a pro retires or goes unsigned; a college career finishes), a man with a case joins the
  waiting list (his seasons above the league's starters, his years before the game, his best career stat against the
  real record, his MVPs, other awards and all-league or All-America teams). Each hall waits its own years and elects
  its own size of class: Pro Football 5 years, 3-5 a year; Hockey 3 years, at most 4; Naismith 3 years; baseball 5
  years, 75% of the writers' ballots shown, ten years on the ballot; the Premier League's after retirement; College
  Football ten years after, First-team All-Americans only; National Collegiate Basketball likewise. A club retires
  the number of a long-serving great at his retirement (not in soccer). Farewells for the best careers to end.
- Why: the design review's "five things a season happen that the player didn't cause" and stories players retell.
- Games: all seven.
- Tested: RESULTS_HOF.
  Sources: https://profootballhof.com/hall-of-famers/selection-process-faq , https://hhof.com/induction/electionprocedures.html ,
  https://www.thescore.com/news/1449560 , https://baseball-reference.com/about/hof_voting.shtml ,
  https://en.wikipedia.org/wiki/Premier_League_Hall_of_Fame , https://www.thescore.com/ncaaf/news/3455549 ,
  https://www.foxsports.com/articles/cbk/jack-hartman-wayne-estes-among-8-chosen-for-national-collegiate-basketball-hall-of-fame
- Not yet: no coaches in the halls (you included); the Naismith and the college halls' waiting periods are the
  game's choice (their rules were not found).

## Awards night
- What: at the season's end (top of the offseason screen) each league's own awards with the sport's names, the
  finalists, and where the sport publishes one, the vote: NBA MVP 100 voters 10-7-5-3-1, Defensive Player, Rookie
  and Coach of the Year; AP NFL MVP, Offensive and Defensive Player, both Rookies and Coach of the Year, 50 voters
  10-5-3-2-1 with five finalists; the Hart, Norris and Calder (194 ballots, 10-7-5-3-1), the Vezina and the Jack
  Adams with finalists, the Art Ross and Rocket Richard to the leaders; MLB's MVP (30 writers a league,
  14-9-8-7-6-5-4-3-2-1), Cy Young (7-4-3-2-1), Rookie and Manager of the Year in each league; the Premier League's
  Player and Young Player of the Season from a shortlist of eight, the Golden Boot, Golden Glove and Playmaker, and the
  Manager of the Season; the Heisman (four finalists, 928 ballots, 3-2-1) and college basketball's Player and Coach of
  the Year. Each voter ranks the candidates as he sees them (the MVP race's score with a little noise of his own, by
  hash), so a close race splits. The winners are kept (last 30 seasons) and the honours go into each man's Hall of
  Fame case.
- Why: one MVP line at the end of a season read like nothing.
- Games: all seven.
- Tested: every season of every game had its awards night and every vote added up (test/league-life.js).
  Sources: https://wtop.com/nba/2022/05/nba-most-valuable-player-voting-2/ ,
  https://www.aol.com/articles/nfl-honors-votes-associated-press-140539640.html ,
  https://www.si.com/nhl/2025-hart-trophy-voting-results-full-tally-connor-hellebuyck-wins ,
  https://www.dailyfaceoff.com/news/phwa-releases-all-194-ballots-for-the-2024-nhl-awards ,
  https://www.mlb.com/news/2023-mlb-mvp-award-voting-results , https://www.mlb.com/news/2023-mlb-cy-young-award-voting-results ,
  https://heisman.com/?p=11926
- Not yet: the rookie awards find rookies by age and an empty history (a first-year 25-year-old can be missed);
  no Sixth Man, Selke or Lady Byng.

## The coaching carousel at real rates
- What: computer clubs well short of what their standing promised fire their coach in season, at checkpoints by
  league (`LEAGUE.lore.coach.mid`); the interim keeps the job about a third of the time. After the season the old
  rule stands (a hot seat ends in a firing at `keep`), with a smaller chance just below it (`x` from heat `h`), and a
  long-serving pro coach retires now and then. All by hash: a reload fires the same men, and no other dice move.
  Week news ("Indianapolis fire Jim Njoku: 2-7 and short of what the club expected"), summer news (who changed, who
  was hired away, who retired).
- Why: the carousel turned over NFL 5.5, NBA 6.0, NHL 5.0, MLB 4.7, Premier League 4.0, FBS 23.3 and Division I
  basketball 71.3 clubs a season (engine 26, 6 seasons), and nobody was ever fired during a season.
- Games: all seven.
- Tested: RESULTS_COACH.
  Sources: in test/league-life.js's header (SI, Hoops Rumors, inkl, CBS, Boston.com, Daily Faceoff, ESPN, National
  World, The Analyst, Deseret News, CBS, ESPN).
- Not yet: the Coaches tab still shows the fired coach until the summer (the interim is named in the news only).

## Rivalries, droughts and dynasties
- What: every postseason meeting is kept by pair (meetings, who won, first and last year; soccer: the title race of
  the top two), news when a pair meets again ("their third meeting since 2027-28"). Every club's last title is seeded
  from the real one and the champion's line says what it means: "Buffalo's first championship since 1965: 62
  years", "The first Stanley Cup in Columbus' history", "back-to-back", "three in a row", "third in ten years".
- Games: all seven.
- Sources: 2026's champions (Knicks and Hurricanes https://www.wbtv.com/2026/06/20/knicks-canes-2026-brings-victory-long-suffering-fans/ ,
  Seattle in Super Bowl LX https://thesportscast.net/2026/09/10/who-won-the-super-bowl-in-2026-seattle-seahawks-beat-patriots-to-win-super-bowl-lx/ ,
  Arsenal's 2025-26 title, Indiana's 2025 Playoff https://www.cbssports.com/college-football/news/indiana-miami-cfp-title-jimmy-butler-tears-acl/ ,
  Michigan's 2026 NCAA https://www.tsn.ca/ncaa/article/no-1-michigan-defeats-no-2-uconn-to-capture-second-ncaa-mens-basketball-title/);
  the older titles are the leagues' own lists.
- Not yet: a club whose last title isn't in the list (most colleges, the lower English divisions) claims no drought.

## Your owner
- What: each club has an owner (chairman, athletic director) with a name and a temper, fixed by the club: measured
  (half of them: two seasons in a row short of the board's target and you're fired, the rule since round 1), patient
  (a quarter: three), impatient (a quarter: two, or one bad year after your first season). A title in the last two
  seasons buys one more. The You tab says who and how ("Your athletic director, Dale Hendricks, is patient: 3 seasons
  in a row short of the target before a change"); the hot-seat badge and the board's line follow the owner's count.
  The board's targets and grades are unchanged.
- Games: all seven.
- Tested: test/league-life.js checks the rule on made-up histories; test/firing.js now checks every firing against the
  owner's count (RESULTS_FIRING); test/goals.js MATCH.
- Not yet: the owner never changes (no sale), and has no budget of his own outside the NBA's.

## Save size
- The league's memory (`U.lore`) holds only what the book shows: overrides of the real records, the last 60 records
  fallen, 40 champions, 30 awards nights, 200 Hall of Fame members, 60 on the waiting list, 60 rivalries, two summers'
  news. RESULTS_BYTES.
