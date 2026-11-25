# Roadmap after the November 25 reviews (agreed with Ian, Nov 25)

Sources: Ian's notes (Nov 25), Instinct (8 across the board but pro football 7.5), Muse (CBB 8, CFB 7, PFB 6, hockey 6,
soccer 6, baseball 6, NBA 5: "the arithmetic is perfect; the plan, in three games, never moves"), Grokbot to come.
Ian's direction: the player must not be told the best plan; watchability is crucial; tactics in every sport, roster
decisions included.

Round 109's own miss: it measured that the card's numbers played as shown, not that its reasons were true or that the
advice varied for a given roster (averaged over clubs, 56-75% "usual plan" hid rosters where one plan always wins).

## Round 110: the decision is the player's, and the game is trustworthy
- Plan card: no per-plan win chances or "would add N" before the game. Show the opponent's evidence instead (team-level
  ranks the game publishes: rim protection and perimeter defence; coverage, pass rush, tackling; skating, checking,
  defence, passing; the day's starter's strikeout and walk lines), and an assistant's opinion as good as your staff
  (a weak one is sometimes wrong). After the game, reveal what each plan would have done (keeps the honest grading).
- Plans that bite by opponent in all seven (pro basketball, baseball, soccer never varied for Muse's rosters), measured
  per roster, not averaged.
- Reasons and scouting from one source of numbers (test: no reason contradicts a published rank or a box score;
  Oregon's CB 85 / S 84 ranked 132nd in coverage is a ranking bug to find).
- Tester bugs, each reproduced before fixing: hockey odds re-roll and PLAY not starting the game (sim the off days
  right after the last game); baseball's card naming a different starter than Probable Starters; college basketball
  Full Match showing future scores; football's 78-yard field goal, the clock jumping back after a call; read tallies
  leaving out wrong reads; "Right read: they surprised you" wording; the card under the PLAY button.
- Ian's quick wins: a box score page like ESPN's; a schedule score opens its box score with a replay; an easy exit from
  a replay; a win-probability chart in the box score.

## Rounds 111-112: watching
- Pacing: Slow in real time (90 minutes a soccer match), Normal at a TV pace; basketball's Normal and Slow are far too
  fast. A bigger field. Player stats accumulating live (baseball's scoreboard stats as a batter comes up).
- Movement: soccer and hockey smooth (no stops and stutters); hockey continuous, not restarting at centre; faceoffs at
  the right dots; soccer dribbling as an attribute.
- Baseball: groundouts with the runner clearly safe (often), sac flies without a tag, singles no fielder reaches, a
  bat, breaking balls, runners leading off.
- Basketball: transition, steals and blocks run the other way.

## Then: tactics in every sport (roster decisions included)
- Soccer formations and instructions; basketball pace, scheme and shot profile; football run/pass, coverage, blitz;
  hockey forecheck and line matching; baseball lineup, platoons, bullpen roles, bench and minors (promote/demote).
- Attributes that visibly drive events (the dribbler dribbles), live player stats and match ratings. Not a full
  agent simulation of every sport.
- Real rosters: real-modelled ratings with invented names (publicity rights; not legal advice); possibly editable names.

## Earlier: roadmap after the November 15 reviews

Sources: Ian's notes (Nov 15), Instinct (hockey 8, soccer 8, pro football 7.5, baseball 7, pro basketball 7, college
football 6.5, college basketball 6), Muse (7/10 across the board: "the loads are fixed, the numbers aren't"), Gamer's
round 10 playtest (141/250). Ordered so trust comes before polish: testers say the games hold attention and lose it
on numbers they can't trust and a sport they read rather than watch.

## Round 78: done, and what was found
- Box score button: Enter and Space on the focused toggle went to the page's "advance" shortcut and started the next
  game (test/boxclick.js now presses it by keyboard, mouse and touch in all seven; it fails on round 77). Fixed: a
  focused control keeps Space and Enter. Rewatch shows the box score.
- Kicking: measured, not a current-engine bug. In a season begun before round 71 (engine 1), 39 of 91 kicks were over
  60 yards (the old rule put the kick 12-40 yards past the drive's start); on the current engine, 0 of 58. Muse's
  testers were in long-running seasons begun before round 71; the next season starts on the current engine. Changing
  the old rule mid-season would make those saves replay differently, so it stays.
- College basketball's false final: not reproduced. On the current build every watched overtime (9 of 9) played out
  before the final, and live and recorded scores matched in 197 games (engines 1, 3 and 6 too). Needs a screenshot.
  Found on the way: an overtime the engine hands back at the end (hockey's, soccer's) appeared all at once when its
  highlights couldn't play; it now plays out a stretch at a time (44 of 44 hockey overtimes in a test).
- Still to do from the list below: items 4-7 (ledger, calls, identity, schedule), and Skip to next call stopping
  before a close finish instead of jumping to the final.

## Round 78 (as planned): trust breakers (bugs, verify each in a real browser first)
1. **Box score button** dismisses the result card instead of opening (5 of 5, four sports). Round 73 feature; its
   test checked the HTML, not the click. Also reachable from Rewatch.
2. **Kicking, both footballs**: 60-86 yard field goals made (a championship decided by 62 and 76), short kicks missed
   at 78-96% displayed, kickoffs labelled "field goal try". A maximum, a make rate falling with distance, labels.
3. **College basketball overtime**: the live view says FINAL at the regulation score, the hub shows an overtime
   result never watched (3 of 10 games). Its court didn't render for one tester (canvas 0x0) in three games.
4. **The ledger, every number one source**: college football box scores and banners credit TDs and picks the QB line
   doesn't have (injured QB still named: d.by / driveScript); pro football phantom TD; hockey goalie line absorbs the
   backup's games and a shutout he didn't earn (round 74 goalie spells); soccer position 16th / 22nd / 1st and the
   table not sorted by goal difference; tallies that disagree with their own breakdowns (hockey reads, pro basketball
   by-month, baseball career games +1); standings Div / Conf columns that don't match records; "Target: 0 wins".
5. **Calls that weren't put to you**: ghost calls graded (pro football, both basketballs, baseball), Skip jumping to the
   final, Very Fast persisting between games, the guide reappearing after Skip the guide, "Before kickoff" call after
   the game started, baseball pinch-hitting the same player twice (a pinch hitter stays in), "a point is a point" in
   knockouts.
6. **Identity on the field**: hockey narration crediting the wrong team or voice; passes from invisible players
   (hockey, basketball); injured or benched players drawn on the field; soccer corner with no kicker; the soccer
   keeper growing after a shot; duplicate surnames across teams.
7. **Baseball schedule**: the Dodgers play Washington for seven straight to open. Use a real MLB-style schedule.

## Round 79: games you can open (done)
- Scores: every played game opens its box score (each side's players by position, from their game logs), all sports.
  Baseball leads with the decisions: "W: N. Figueroa (1-0)  L: ...  S: ... (2)"; a decision the unnamed set-up men
  took reads "W: Houston bullpen" (15 of 45 games had no W or L line before that).
- Next-game card: baseball's probable starters with W-L and ERA. "Featuring" gone from the card; "Play your game." gone.
- The bullpen call names your starter.
- Baseball (engine 7): a man who has pinch-hit can't pinch-hit again (648 games: 21 with a repeat before, 0 after).
- In-game: "Game stats so far" under a live game, all seven; stays open or shut through redraws (test/livestats.js).
- Roster: season stats, sortable by any column (test/rostersort.js). The team page opens on its schedule.
- Football: kickers named ("Tre Obi 35-yd field goal"), on the kick clip and the game-winner line; one game clock for
  the live header, the run of play and the calls (engine 7 seasons); a failed fourth-down try plays as a clip; the
  scouting call says "Before your first drive" when they had the ball first.
- Football (engine 7): the run of play is seeded by the fixture, not the final score: a live touchdown named one scorer
  and the box score another in 18 of 29 (the testers' TD contradictions); now 0 of 89.
- Hockey and basketball clips: a man who takes the puck or ball twice goes to each spot (a third of clips passed to
  empty space: the invisible passers). Soccer's corner taker stays at the flag until he's struck it.
- Skip stops once for a close finish (and an overtime). Knockouts don't offer "the point". No "Target: 0 wins".
- Baseball (schedV 4): no second series straight against the same club, where avoidable (60% of club-seasons had
  seven straight against one club; 5% now).
- Scores' box sheets are drawn when opened (a busy day's page was 1.6 MB with them all drawn).
- Not done from this list: player stats in the live panel (the players' lines are credited when the game ends);
  a converted fourth down has no clip (only a failed try). Not reproduced: the Div/Conf column against records.

## Round 80: watching (done)
- Football: a pick run back to where the next drive starts (read ahead in the engine, no draws); a clip for a fourth
  down made; defenders chase a breakaway (61 of 66 long touchdowns chased; 0 before). Engine 8: a drive after a
  strategy call keeps its start (it drew it again on resuming).
- Hockey line changes: the scorer's line and pair, the assist on the ice making the last pass, the second unit its share
  (the scoring dot wore the scorer's name in 16 of 74 goals before; 74 of 74 now).
- Basketball rotations: the bench in for its stretches, the shooter's dot the man named (106 of 142 before; all now).
- Testing: a quick tier (about 6 minutes) on every change; the full suite (about 90) at a release.

## Round 81 (done)
- Watch any game in the league this season (replayed on a tap from its own dice, to its recorded score).
- Punts and their returns as clips. Soccer: Player of the Month and your Goal of the Month; a diving keeper no longer grows.
- Soccer's credit gap turned out to be the box score reading the other cup-week game (fixed in round 82; no engine change).

## Round 82 (done)
- Baseball: the pitching staff by role (five starters, closer, set-up, long relief); trade any two pitchers' jobs.
- Testing: two browsers at once measured slower on two cores; back to one.
- Next: in-season trades (about two rounds). Then attributes by category, from a written design agreed first.

## Round 83 (done)
- Trades in the season, five pro games: shop a player or ask about one of theirs; one for one at the same position;
  deadlines and soccer's January window; the cap; a club never gives more than you give, now and later together.
- Fixed: a promoted or re-roled man's season was left out of his career (shipped in round 82 for the staff roles).

## Round 84 (done)
- Offers that come to you near the deadline; two for two (cross-position and consolidation); shared seats replay every
  coach's moves (trades on there); all-in buying priced up (a premium for big deals, three trades a season).

## Round 85 (done)
- Engine 9: the computer's clubs trade with each other on deadline day (buyers gain 0.5 to 2.5 points of win share after;
  the standings' spread unchanged). Fixed: the offseason's screens now see the season's trades; a box score keeps a man
  traded to the club he'd played.
- Open: baseball's HR leader under 40 in a quarter of seasons (MLB's overall leader rarely is): power a touch low.

## Round 86 (done)
- First-round picks in deals, with a man for a man, in the four drafting games; a club can hold two first-rounders or
  none; draft night, the mock and the lottery line follow the pick. Fixed: the mock crashed with no first-rounder.
- Next: FM-style attributes, from a written design agreed first.
- Open dials: all-in trading strength (TD_MAX, TD_PROP); picks only as a sweetener (no pick-for-pick or pick-alone deals,
  no later rounds, no computer-to-computer pick deals: those would be engine code).

## Round 87 (done)
- FM-style attributes in all seven games (1-20, 8-10 a sport, three bands), from the agreed design doc. They sum
  exactly to the rating and develop by age and training focus, with no new dice. The player page has the grid, the
  roster has roles and "Your shape", draft night reads a prospect's role through the scouts' fog.
- Baseball engine 10: the attributes play (Power/Contact/Eye split the hitter's line; Stuff/Control/Stamina; Fielding;
  Speed and Arm in the steal). Weights come from measured run value, so a rating means the same however a player
  leans (within 3%). Training focus is in baseball's offseason. The other six games play exactly as in round 86.
- Next: round 88, basketball's engine hooks; then hockey, soccer, football; per-attribute ceilings and breakouts;
  training focus everywhere; club styles from rosters (its own round).

## Round 88 (done)
- Basketball engine 11 (college and pro): the attributes play. A team's shape on the floor (each man's leans, weighed by
  position and minutes) moves threes, twos, turnovers, boards, the other side's shooting, and the closing minutes,
  each worth the same per point, so a rating means the same however a player leans (within 0.3 points of margin).
  Shapes show: a shooting team takes and makes more threes. Box-score shares lean with the matching attribute.
- The plan fits the roster: the threes plan is worth more to shooters, Work it inside to finishers (about 2 points of
  win chance a spread). The pre-game chance includes it, and the plan rows say which plan the roster suits (Ian's
  call; case 78 kept everywhere else). Training focus in both basketball games. Skip's own late margin in basketball.
- Next: round 89, hockey and soccer's engine hooks; then football; ceilings and breakouts; computer clubs picking a plan
  for their shape (round 91). Watch: college live chance 30-50 band; March 1 seeds in the Final Four (old).

## Round 107 (released Nov 24): the game agrees with itself (the November 23 reviews: Muse, Instinct, Grokbot)
- Done: a backup from the title screen; football reads headed by their quarter; touchdown yards inside a man's yards;
  football's header and field line follow the drive; a postseason game never an NBA Cup game; the Film Room names what
  a call is measured against; a live plan change takes two taps; a tap as a game ends never starts the next; baseball
  call headers; hockey shots add up; marked reads never graded wrong; moves survive a reload; shirt numbers kept; Slow
  rewatch; decision cards above the pinned Play button, Keep him; the summer hire defaults to the best; soccer's keeper
  and running numbers; the win chance in overtime; hockey's even-strength goals outside penalties, third-person cues,
  bars on the clock; the board's verdict said; soccer's late change named only when possible.
- Also done: hockey overtime drawn three-on-three; football reads by the card's marks too.
- Left for later: red-zone punts (needs its own fit tables); the residual soccer number drop (one in two matches).
- Released: goldens re-recorded (engine 21), the full suite on 119ef83 (the release head differs by one test file):
  122 of 124. migrate.js wanted the old staff card (Keep him is new on purpose: the test now compares without it,
  2253 of 2253). draft-labels.js fails one band, identically on this head and on the published d07d747 (football's
  "likely gone" at your first pick: 50% of 30, band 75%+): an open item, not a regression. The March check (ncaab)
  failed once beside the browser tests and passed alone and on re-run: test/bb-longrun.js stops each career at 270 s
  of wall clock, so a busy machine pools fewer tournaments (116 against 185 from the same seeds). Worth making it count
  seasons instead.
- Round 108 (Nov 24, on its branch, engine 22): soccer, hockey and basketball move like their sports (no jumps, shots
  growing out of the play), tired legs and the benches show, live instructions and soccer changes any time; the play
  by play is one line. Basketball's pace follows a mid-game push or sit; football and baseball move without jumps;
  baseball shows the pitch count. See ARCHITECTURE. Open: hockey's instruction effects measured for direction only;
  tired legs drawn, not measured; the roster round (109) next.
  Full suite on 1b86acc: 171 of 173. draft-labels.js (pro) and the March check (ncaab, 7 v 10 seeds 54.9% against
  60.6 within 5.3, 194 tournaments) fail identically on the round 107 release f3d658a: open items, not regressions.
  The March check sits on its band's edge: how many tournaments the wall clock lets it pool decides it (round 107:
  failed at 116, passed at 185; now fails at 193-194). It should count seasons, and 7 v 10 needs a look.
- Round 108 as first planned: watching. A named play-by-play feed you can read at Normal speed (Grokbot's first ask, Muse and
  Instinct's every man named): baseball's relievers and pitching changes, basketball's bench and fouls, football's full
  box, feeds that narrate every play in order and keep up with the scoreboard. A condensed Full match (three to five
  minutes a game) and Full as the default. Hockey's power plays in the right end, college basketball using both halves,
  the soccer pitch applying the late change, hockey's rink on a phone.
- Round 109 (Nov 24, on its branch, engine 23): the plan depends on tonight's opponent in all seven (a club's usual
  plan the card's pick in 56-75% of live games, was 74-100%), played as shown; baseball's card counts today's starter;
  soccer's keeper weighs more. See ARCHITECTURE. Not done: hockey skaters and baseball hitters stay near real-world
  weight (Ian's in-between); live agency between calls.
- Later: the career layer (Grokbot's list): development you can see, injuries and form that change the next month,
  recruiting and contracts, job security and rivalries, history, news.

## Rounds 103-106 (done): every sport played as it happened
- Soccer touch by touch: the engine's crosses, long balls, balls won high and bookings, every man named, the scoreboard's
  match numbers, assists as shown. Hockey touch by touch: forechecks, killed entries, cycles, penalties with the man in
  the box, faceoffs, line changes, the scoreboard's numbers. Baseball pitch by pitch, H as the hits are played.
- Football engine 20: a stalled drive's fourth and N is one the drive could have reached (was impossible in ~10%); no
  turnover on downs deep in your own end or on a long fourth down in your own half (a punt).
- Not done: kicks instead of punts inside their 28 (a quarter of punts come from there). Tried in round 106 and taken
  out: it made blocking against the rush worth more than the rating, plan fit or chance count (the pro chance missed by
  up to 14 points on a pair). Needs its own round with the fit tables and the chance re-measured.
- Open: pro football's draft board "likely gone" label is weak on both builds. Over 48 drafts 64% of those players were
  gone at your first pick on the published 101+102 build and 73% on this one (band 75%+). At the suite's 16 drafts it
  reads 64% and 50%, so test/draft-labels.js fails on this head (146 of 147); the test is unchanged.
- Publishing: the 99-100 and 101-102 bundles never reached GitHub (coach main was 6473dcb, rounds 96-98), and the
  101-102 bundle had not copied dist/site to the root. This release puts 99-106 on the site at once.
- Next: red-zone punts (above); the plan as a real decision at even odds; the board's "likely gone"; testers' reports.

## Round 102 (done): the field fits the screen (ships with 101)
- Hockey's header clock no longer piles up old minutes. The whole field sits above the action bar on a laptop (baseball's
  home plate and batter were under it at 1280x800). Soccer's squad men named between moments.
- Next: soccer play by play (round 103), hockey (104), baseball pitch by pitch (105), then football's fourth and N.

## Round 101 (done): Full match as a match to watch
- Every sport's Full match plays the game's own events, not decoration: basketball every possession, baseball every
  at-bat and steal, soccer and hockey on a running clock with every goal and counted shot at its minute.
- Football play-by-play: each drive snap by snap (series of downs, runs, catches, incompletions, sacks, scrambles, flags,
  every man named), built to come exactly to where the drive engine put the ball and the fourth and N it left. A
  fourth-down or two-point call shows the drive up to it first.
- A watched game's box score credits the plays shown; an unwatched game is unchanged. Goldens identical except
  football's, where a touchdown can no longer be longer than the field the drive had (stats only; results identical).
- Next: football's engine draws a stalled drive's fourth and N apart from how far it got (about 8% of drives impossible;
  1 fourth-down call in 12 reads one distance while the drive shows another): draw it from the gain, an engine round
  with calibration (Ian agreed: its own round); with it, punts from inside their 15. Then the plan as a real decision
  at even odds.

## Round 100 (done): Grokbot's round 12 interim (ships with round 99)
- The game starts on the plan its card shows (a reloaded game played an old mid-game change). The coach name survives.
- No injured player in a football touchdown line or clip: the live line names who's actually playing.
- Desktop plan clicks keep your place. The Play button says which plan it starts on.
- Full match: every player named in basketball and hockey; basketball plays the stretch before its big basket.
- Basketball's read marks points in the paint.
- Baseball: after a call inside an inning the scoreboard no longer steps back; one Skip can't play two games.
- Phones: a new call opens at its top; soccer's table no longer wraps a word a line.
- Tell testers: start a new career. A season begun before engine 17 keeps its old plans (baseball's "every plan 0").
- Next: the plan as a real decision at even odds (the opponent's shape in the fit, so two plans are live for different
  reasons: an engine round); soccer and baseball reports when Grokbot finishes them.

## Round 99 (done): Ian's notes, the November 22 reviews
- Title page trimmed. Field goals with numbers; pick returns end in a tackle. The team card's figures open their pages.
- Old seasons say the new features arrive next season (testers' veteran careers). A conference title loss isn't the end.
- Hockey plays the whole rink between moments: breakouts, skating up the ice, passing, stickhandling. Basketball dribbles,
  drives and brings it up the floor.
- Next: the clips inside the continuous play (watch the game's own possessions, not decoration between them); football and
  baseball between moments; who-played (rested starters in football clips, backup goalie starts, injured probable starter).

## Round 98 (done): watching
- Hockey and basketball play on between the highlights, as soccer's full match did: the puck and ball moving, both sides
  in shape, possessions trading ends. Soccer and hockey's pitch is never empty between clips now, in any mode.
- Next: hand back to the testers; then football and baseball's surfaces (the engines have no plays inside a drive or
  an inning, so what they can show between moments is a design question first).

## Round 97 (done): trust fixes
- Baseball's win chance on a call reads the call's score (it showed the inning before); late-game readings refit.
- A hurt player is never drawn in a clip (hockey, soccer, football measured; none now).

## Round 96 (done): Coach
- The Coach title page: seven games, five sports, the seven owls as links; every game links back to it.
- The address moves to ianbott1.github.io/coach (Ian renames the repo); the old address forwards, saves come along.
- Attribute grids: the 1-20 against every player (no more columns of 1s; stars reach 18-20), each attribute's weight for
  the position shown, and the line says which count most (Grokbot's point 4).
- Next: Grokbot's minor-fixes checklist, checked on the current build; a one-line attribute "why" after the game
  (point 3); replay odds after late calls (point 6).

## Round 95 (done): what the plan did, and late calls worth deciding (engine 18)
- After every game, the result card says the plan you started on and what it was worth before the game, as the card
  showed it, and why ("You started on Take risks: -5 before the game (43% to win, against 48% on Balanced), as the
  better side tonight. Play it safe would have been +4."). All seven; no verdict on one night's luck.
- Late calls measured: most were quizzes (one answer always best) or coin flips. Soccer's 80th minute rebuilt as a read
  of their back line's legs (shown on the call, a little off): go at them, keep the ball, take the point or park the
  bus. The options now differ (8.4 points apart when level); reading the legs adds under a point over the best answer.
- Hockey's late decision is the ten-minute third-period read (18 of 18 close finishes asked it); the pull stays a quiz.
- College football's sim speed back to about round 93's.
- Not done: hockey graded in standings points; football's tied call (a 7-10 point quiz); the other small quizzes.
- Next: the Coach rename, title page and the game page; the odd attribute grids.

## Round 94 (done): plans you can feel (engine 17, all seven)
- A plan suited to the roster is worth about 8 points of win chance at even for a roster one league spread off average,
  held to 15; the wrong plan costs as much. The extra plays through each sport's own events, so box scores carry it.
  Measured on both the computer's path and yours (on yours, what the plan played against what the chance showed:
  0.94-1.15 by sport, hockey the highest after its gains were raised for the computer's path).
- Baseball gets a fit of its own (the lineup's Power against Contact and Eye). Ian chose a smaller fit so the league's
  spread stays MLB-like: worth about 6 points at the median (90th percentile about 11), under the 8 elsewhere.
- One reason line under the plan buttons names the roster or the gap ("+11 from Shorten the game: your shooters suit it").
- Hockey: the chance now knows when tonight's goalie is the backup (the second night of a back-to-back); mid-season it
  was 4 points off for some clubs and now reads within 1.4.
- League levels recentred on engine 17 in every sport. Cost: standings spread a little wider where seasons are long
  (hockey, baseball, soccer), and a player who leaves the plan on Balanced all season falls behind the computer's clubs
  (pro objectives met 41% on Balanced against 54% on the assistant's plan).
- Not reached: hockey's scoring leaders still about 60 goals (band 45-57); the fix is a deeper roster (Ian's call).
- Watch: college football's chance after five weeks (Alabama +3.0 against a bound of 3); baseball's chance doesn't carry
  tonight's lineups and starters (Seattle -3.9 in one context; holds over a season); soccer draws a point high.
- Tests loosened or changed, each measured: recruiting's bound 2.5 to 3.5; objectives and recruiting sim the
  assistant's plan; bs-calibrate's bare Balanced floor 3.9 and runs from seasons as played; bs-players' innings leader on
  a two-season average; hk-lines at 0.85; firing's limit 2700s. Full suite 127 of 127.
- Open: college football sims about 1.25-1.6x slower than round 93 (the plan's fit worked out on every drive; cache it
  per game, results unchanged).
- Next: round 95, a post-game line on what the plan and attributes did, late calls with options that really differ, the
  odd attribute grids; the Coach rename, title page and the game page.

## Round 93 (done): trust fixes from the November 20 reviews
- A game is recorded only once its engine has finished; held headers and basketball clips name the moment shown.
- Career games: every season counted one game too many in all seven; banked right now, old careers repaired once.
- Hockey (engine 16): every goal has a scorer; the named goals add up to the score. The leaders rise to about 60 goals
  (51-68; round 90's band was 45-57) because the roster carries ten skaters, not eighteen: a decision for Ian.
- Basketball (engine 16): once the starters sit (a rest, or a decided game) the run of play, box and clips name the bench.
- Football: "Fourth and goal" inside the line to gain; the onside call and Pearl count the possessions left; up 7, a
  touchdown ties it.
- Baseball (engine 16): a postseason series opens with the ace (four-man turn). The staff card shows ceilings and can
  feature an arm (Two deep already could).
- Reads: answering what tonight's numbers fit best is never marked wrong ("Right read: they surprised you"); the month
  and season tallies use one rule.
- Help: the chance includes your plan (it moves with the plan; the glossary said it didn't). The attribute page wording.
- Soccer's roster line ranks within the division. Contract rows decide on their own button.
- Taken back out: productive grounders (runners up on a groundout). Putting the run level back left the baseball
  season checks a tenth past their edges on fixed seeds; it needs multi-seed season checks first.
- Not built: naming every bullpen inning (needs real bullpen slots); the field presentation items (football returner
  and defenders, kick numbers, names on the field; soccer names, shirt numbers, pace): with the 2D round.
- Not reproduced: pro football's second round labelled WILD CARD, the board objective staying up, soccer's "of 184".
- Next: round 94, plans that play and attributes you can feel (Ian's decisions first); round 95, the Coach rename,
  title page and the game page.

## Round 92 (done)
- Club styles come from rosters (engine 15, all seven): each club's usual offense, system, approach or defense is the one
  its opening roster leans to (a flat roster keeps the old hash between its top two). The scouting report shows their
  roster's ranks; its best rank names the usual style for about nine clubs in ten, though the night still varies.
- Football's reads tied to your roster: a right answer is worth more when your offense suits it, the same on average.
- League levels unchanged within noise in all seven.
- Fixed: the pre-game chance now counts the computer opponent's plan's own worth, not only its fit (an outgunned college
  football club taking risks read 81% for you where you won 70%).
- Watch: a club's own games can run 2-2.5 points off the pre-game chance (how two rosters' shapes and styles meet, which
  the chance doesn't simulate; the same on engine 14).
- Next: computer clubs draft, sign and trade for fit (its own round); per-attribute ceilings and breakouts; a kicker
  slot. Watch: the roster line makes the usual style easy to read (the report's favourite was right about two times in
  three before); football home wins a point low; soccer draws a point high.

## Round 91 (done)
- Football engine 14 (college and pro): the attributes play. A team's shape moves its drives: Arm and Speed score
  touchdowns, Accuracy and Hands keep the ball and the drive going, Blocking gets stalled drives into field-goal range,
  Strength wins short yardage; Coverage, Tackling, Pass rush, Strength and Speed answer them. Each worth the same per
  point in wins (within 4%), so a rating means one thing. Box scores lean with the attributes; training focus in both.
- Plans fit the roster as in the other sports: Take risks suits arm and speed, Play it safe accuracy, hands and blocking;
  the chance counts the fit and the plan's worth at tonight's gap; computer clubs pick plans. Scoring, college's
  favourites and the shown chance's curve re-held on engine 14 (computer underdogs now take risks).
- Not built: Kicking (Ian: a kicker slot, its own round later); reads tied to the roster (round 92).
- Next: round 92, club styles from rosters (each club's scheme or system from its players, the reads with it); then
  per-attribute ceilings and breakouts; a kicker slot. Watch: home wins about a point low in football on engine 14;
  soccer draws a point high; a window's quoted fee against the commit's.

## Round 90 (done)
- Transfers: a bid that would cut a player you bought earlier that window no longer goes through (no fee paid); the bids
  screen says so before the window, or that it depends on the first signing starting after the summer.
- Hockey's scoring leaders back in range (engine 13, credit only): about 55 goals and 109 points, and a depth man leads
  only when he's had a starter's minutes all season.
- Next: round 91, football's attribute hooks (a short design addition first: the drive engine has no individual plays);
  then per-attribute ceilings and breakouts; club styles from rosters. Watch: soccer draws a point high; a window's
  quoted fee against the commit's.

## Round 89 (done)
- Hockey and soccer engine 12: the attributes play, each worth the same per point in results (within 2%). Shapes show:
  shooters score more of their shots, checkers allow fewer, a positional goalie kills penalties, finishers convert more
  of the same chances, fitter sides score late. Box scores lean with the attributes; training focus in both.
- Computer clubs (basketball, hockey, soccer) pick the plan their roster suits when it's worth it at that gap; Sim ahead
  leaves your plan to your assistant. The chance before a game now includes your plan's own measured worth at tonight's
  gap as well as your roster's fit (Ian); the plan line never recommends a net loss. Basketball's fit was understated
  for a person in round 88: corrected.
- Fixed: a soccer cup tie and league game merged in the logs; a shootout's header.
- Next: round 90, football's hooks; then per-attribute ceilings and breakouts; club styles from rosters (the computer's
  system or approach for its shape). Watch: soccer draws a point high; hockey's top scorers high (already so); a
  window's quoted fee against the commit's. (Two signings at one position: fixed in round 90.)

## Still to come: watching
- Motion, not stills: the ball in play between moments; a watch rhythm between calls (pro basketball, baseball);
  college football's field to the pro standard; clock, down and distance, count and outs on the surface.
- Football: kick returns, blocks shown.

## Later: depth
- Player attributes: football's hooks (round 90), ceilings and breakouts per attribute.
- Baseball staff, further: a middle reliever and a sixth starter would need roster slots (the 8 pitcher slots are
  four jobs and their backups today); fatigue and pitch counts carried between days.
- Awards: coach of the month, other sports' monthly awards; a top-five goals reel.
- Decisions: late calls with clock, timeouts and fouls; stakes shown on options; scouting with sample sizes and ties
  shown as ties.

## Decisions for Ian
- **Rebrand**: a name for the seven-game set and its repository. The saves live with the site
  (ianbott1.github.io), not the repository's path, so moving should keep them; the old link can forward.
- **Real player names**: recommended against (publicity rights; leagues and players' associations license names).
- **HIT / PIT assistant numbers**: keep the numbers (they're real effects you hire for), shorten the explanation.
