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

## Rounds 80-82: watching
- **Replay the whole game** (Ian's top item; highlights stay the default).
- Motion, not stills: goals, shots, passes and the ball in play animated; the surface stays up behind call cards; a
  watch rhythm between calls (pro basketball, baseball); college football's field to the pro standard.
- Clock, down and distance, count and outs, penalties and power plays on the surface.
- Football: defenders pursue a breakaway; turnover returns; punts, kick returns, blocks shown.
- Hockey line changes and basketball rotations in the game (and shown).

## Later: depth
- Player attributes by category (as Football Manager) that drive performance and develop over time.
- In-season trades and offers, with deadlines and caps: make an offer, ask what they'd want, counter.
- Baseball staff: a five-man rotation and a bench of starters; a bullpen of set-up and middle relievers with roles you
  assign (closer, set-up, middle, long), instead of one backup per slot.
- Awards: player, coach and goal of the month; a top-five goals reel.
- Decisions: late calls with clock, timeouts and fouls; stakes shown on options; scouting with sample sizes and ties
  shown as ties.

## Decisions for Ian
- **Rebrand**: a name for the seven-game set and its repository. The saves live with the site
  (ianbott1.github.io), not the repository's path, so moving should keep them; the old link can forward.
- **Real player names**: recommended against (publicity rights; leagues and players' associations license names).
- **HIT / PIT assistant numbers**: keep the numbers (they're real effects you hire for), shorten the explanation.
