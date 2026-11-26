# Review round: polish (branch rv/polish)

Playtest slips from the live games, each reproduced first (by a test on the current code) and then fixed, one commit
each. The regression checks are in test/polish.js (registered in test/run-all.js, fast tier; `node test/polish.js
<name>` runs one).

## The carried-plan question only before a game you play (all seven)
- What: "Keep <plan> from your last game? Tap again" is no longer asked on "Sim to your next game, or the end" (a
  postseason round without you) or on "Enter the offseason" (the season is done). planCarried() in core/99_app.js
  returns false when SEA.phase is "done" or spectating().
- Why: the coordinator's playtest on build 0af4735: after an eliminated pro basketball team's last game, both buttons
  first turned into the question.
- Games: all seven (the question is core); measured in all seven.
- Tested: `node test/polish.js carried`: before the fix pro basketball asked at pi1 step 90, r1g6 step 97, r2g5 step
  103; after, every league asks before its own games only (cfb 12, nfl 17, ncaab 31, nba 91, nhl 91, epl 47, mlb 164)
  and never on a sim-on or the season's end. MATCH.

## Basketball backups have whole season lines (college and pro)
- What: the bench's share of each game's points, rebounds, assists, steals and blocks (20% of the minutes) went to no
  one ("Rest of the bench"), so a backup's line held only the baskets the play-by-play named him for, and his games
  were the games he scored in. Now it goes to the backups who played (behind a healthy starter, healthy themselves), by
  position and the same attribute leans as the starters (benchLines in src/basketball/10_players.js). Every backup who
  played has a line each game. The box score's "Rest of the bench" row shows only if anything is left over.
- Why: playtest: a college center (Guidry) 3.8 ppg and 0.0 rpg over 30 games; the coordinator, on the round 110 build:
  a pro backup center (Anwar Dabney) 3.8 ppg, 0.0 rpg, 0.0 bpg.
- Games: college and pro basketball.
- Results: none move. The new draws come after every other draw on the game's own line generator (seeded per game and
  side), and lines feed no result. Screens and the universe's career totals change (golden fingerprints: see the
  goldens entry).
- Tested: `node test/polish.js whole`: before, college 325 and pro 109 players with 10+ games and no rebound, backup
  centers 2.3 / 1.0 rpg; after, none, backup centers 2.0 / 2.9 rpg. A pro team's season (Boston, seed 5): starters'
  lines unchanged; backups now play 97 games at 4.2-8.6 ppg, the backup center 4.1 rpg, 0.9 bpg.
