# Roadmap after the November 15 reviews

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
