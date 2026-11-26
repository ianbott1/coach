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
