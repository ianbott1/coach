# Roadmap after the November 15 reviews

Sources: Ian's notes (Nov 15), Instinct (hockey 8, soccer 8, pro football 7.5, baseball 7, pro basketball 7, college
football 6.5, college basketball 6), Muse (7/10 across the board: "the loads are fixed, the numbers aren't"), Gamer's
round 10 playtest (141/250). Ordered so trust comes before polish: testers say the games hold attention and lose it
on numbers they can't trust and a sport they read rather than watch.

## Round 78: trust breakers (bugs, verify each in a real browser first)
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

## Round 79: games you can open
- Scores: tap any game for its box score and both teams' player stats (all sports). Baseball shows the winning and
  losing pitchers and the save with records; the box score shows the decisions with season ERA and W-L.
- The next-game card: baseball previews both starters (name, W-L, ERA); drop "Featuring ..." everywhere and the
  "Play your game" line.
- In-game: team and player stats (this game and season) a tap away while watching.
- Rewatch shows the box score; roster sortable by any stat; standings team click opens its schedule and results.
- Football: kicker named on field goals, time left on every late call (and the clock on screen), fourth-down plays
  always shown.

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
