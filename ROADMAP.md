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
- Next (round 84): two-for-one and cross-position deals, player plus pick where the sport has picks, offers coming to you
  near the deadline, the computer's clubs trading with each other (a new engine version), shared-seat careers.

## Still to come: watching
- Motion, not stills: the ball in play between moments; a watch rhythm between calls (pro basketball, baseball);
  college football's field to the pro standard; clock, down and distance, count and outs on the surface.
- Football: kick returns, blocks shown.

## Later: depth
- Player attributes by category (as Football Manager) that drive performance and develop over time.
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
