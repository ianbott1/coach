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

## Football backups have whole lines; "Tight ends and backs" in the box score (college and pro)
- What: the backup receivers play as the third and fourth wideouts (about a tenth and a twentieth of the team's catches,
  taken from the catches the two starters don't make; their yards in proportion), and the backup corner and safety as
  the nickel and dime backs (0-3 tackles a game, a pass broken up about one game in six), every game they're healthy
  (fbBenchLines in src/football/10_players.js). A backup defender with a pick always has a tackle. The box score's row for
  the catches the roster doesn't carry is labelled "Tight ends and backs", not "Other receivers".
- Why: playtest: backup stats made of nothing but the log's named plays (a corner with 2 games, 2 interceptions, no
  tackle; a receiver with 5 catches, all touchdowns), and "Other receivers" in every pro box score with 4-14 catches.
- Games: pro and college football (shared layer).
- Results: none move (draws after every other on the line generator; lines feed no result). Screens change.
- Tested: `node test/polish.js "football backups"`: 1699 catches for 252 touchdowns by backup receivers league-wide,
  64 nickel and dime backs with lines, no pick without a tackle, the box score reads "Tight ends and backs". Buffalo's
  season (seed 5): WR3 39 catches 429 yards 4 TD over 17 games (was 4 games, 15 catches), backup CB 17 games 33
  tackles 2 INT (was 2 games, 0 tackles, 2 INT); the tight-end-and-back row 3-10 catches a game (was 4-14).

## Each sport's own words: Highlights modes, the sim-ahead stop, "side" (six games)
- What: the live screen's and Settings' Highlights buttons name each sport's own modes (HL_SPORT.allLabel/fullLabel):
  basketball "Every big basket", football "Every big play", baseball "Every big hit", hockey "Goals and saves", and
  "Full game" for all four; soccer keeps "Every chance" and "Full match". The sim-ahead stop reads "A big game is next
  (a rival, a top team, an NBA Cup knockout game)" in pro basketball and "(a rival, a top team)" elsewhere; soccer keeps
  "a top side, a cup tie". "A good side" (first job), "a side rated far above yours", "a side that started in the
  bottom half" (achievements), "as the better side tonight" (plan reasons) and the Settings note's "the better side"
  use "team" outside soccer (sideWord()).
- Why: playtest: soccer's words on the other sports' screens. The "all" modes show the big moments, not every
  possession, so they are named for what they show (Ian, round 99: "Full match is not showing the full match").
- Games: all six non-soccer games; soccer unchanged.
- Tested: `node test/polish.js soccer`: the live screen, Settings, the sim sheet, the first jobs and the achievements in
  cfb, nfl, ncaab, nba, nhl, mlb carry none of "Every chance", "Full match", "top side", "good side", "cup tie", "better
  side", and say "Full game"; soccer keeps its words. MATCH.

## Pro basketball's plan says forty-eight minutes
- What: "Work it inside" reads "Over forty-eight minutes the better team wins" in pro basketball (college keeps forty).
  Every "forty"/"40 minutes" string in all seven was checked: the only other game-length lines are hockey's sixty and
  soccer's ninety, both right.
- Why: playtest: pro basketball said forty. NBA games are four 12-minute quarters
  (https://official.nba.com/rule-no-5-scoring-and-timing), college two 20-minute halves.
- Tested: `node test/polish.js "as long"`: ncaab forty, nba forty-eight, nhl sixty, epl ninety. MATCH.

## Basketball play-by-play: no basket for a star on the bench; "stays on the bench" (college and pro)
- What: a stretch's star sitting with foul trouble (or fouled out; the drive's own d.star record) is off the floor for
  the names: the play-by-play's threes and buckets inside (bbPlayer's new `off`), the clips' and the full match's five
  on the floor (onFloor), and the box score's named baskets go to his backup (or, with none, the next starter). A second
  sit on the same fouls (he sat to the half on 3 and sits again after it) reads "stays on the bench to start the half,
  still on 3 fouls" instead of a second "heads to the bench with 3 fouls" (sitEv in 50_game.js: no draw, so every game
  plays the same).
- Why: playtest (college basketball): "Cooper Achterberg buries a three" while he was on the bench with 3 fouls; "Heads
  to the bench with 3 fouls" repeated after half-time. The wrong team label in the same report ("Dayton Cooper
  Achterberg", a Virginia Tech player) did not reproduce: over 30 college and 40 pro live games every named man was on
  his own team's roster; the likeliest reading is that he had moved in the transfer portal.
- Games: college and pro basketball. Results don't move; screens and box-score lines do.
- Tested: `node test/polish.js "names men"`: before the fix, ncaab 3 and nba 2 baskets named for a star while he sat
  (e.g. "Damari Mancini buries a three" while Damari Mancini sat), 0 "stays" lines; after: none of 262 and 611 named
  baskets, 3 and 1 second sits read "stays on the bench". MATCH.

## The board judges only what has happened (college basketball, college football, the pros, achievements)
- What:
  - College basketball: before Selection Sunday a team still alive in its conference tournament, or one the committee
    could still take at large (a winning record and a résumé inside the best 44+32 non-champions), has no season result
    yet (`ctAlive`, `marchHope` in leagues/ncaab/85_postseason.js); only a team out of its tournament with no at-large
    hope "missed the NCAA tournament". The loss card for such a team says "At 11–20 no at-large bid is coming: the
    season is over" instead of "Selection Sunday decides the rest"; the board's clause says the same.
  - College football: no season result before the selection show (no "Bowl snub" during conference championship week);
    a team picked for a bowl not yet played is "Headed to the X Bowl", graded +0.5 (between a bowl win's +0.8 and a
    loss's +0.2), so a bowl loss lowers the grade instead of raising it.
  - Pro basketball, hockey, baseball (and college basketball's "Made the NCAA tournament"): alive in the playoffs counts
    at par or better (Math.max(0.9, exp.par)), as a season in progress does; getting in no longer lowers the grade.
  - Achievements: a game's achievement shown after a sim names the game ("Off the mark: Win your first game · Oct 28").
- Why: playtest findings (item 7). The grade at the end of a season is unchanged (final results only use the ended
  strings), so history and firing are unaffected.
- Tested: `node test/polish.js "the board"`. Before the fix: cfb 132 teams with a result before the selection show
  ("Bowl snub"), 0 of 31 bowl teams "headed to" theirs; nba Cleveland 62-20 fell A- to B+ and Detroit 55-27 B+ to B on
  getting in (the playtest's exact case); the toast had no game. After: ncaab no team alive in its tournament told it
  missed (299 team-rounds out with no hope are), cfb none before the show and 31 of 31 headed to their bowls, nba 12,
  nhl 16, mlb 12 playoff teams with no grade falling, the toast names Oct 28. MATCH.

## Pro basketball's (and hockey's) bracket fills as soon as a pairing is known; "Conference Semifinals"
- What: a playoff round not yet begun shows each pairing as soon as its teams are known (one winner beside "to be
  decided" while the other series plays; both once both are done), with home court or ice as the round will give it
  (nbaNextPairs in leagues/nba/97_views.js; the same in leagues/nhl/97_views.js); the Finals tab the same from the
  conference finals. Pro basketball's columns read the league's round names: "First Round", "Conference Semifinals",
  "Conference Finals" (ROUND_NAME), as the series lines already did.
- Why: playtest (pro basketball): the second round's boxes read "to be decided" after the first round had finished,
  until a game of round 2 was played; "Semifinals" beside "Conference finals". Hockey's bracket was built the same way
  and showed the same gap.
- Tested: `node test/polish.js "bracket fills"`: before the fix, nba's columns read "Semifinals" and a series winner
  was missing from the next round's box (nhl the same: winners missing); after, nba 8 and nhl 8 looks between the
  rounds with every known winner in the next box and no "to be decided" once the round is over. MATCH.

## The staff rating's scale is open at both ends (all seven)
- What: the tooltip on an assistant's rating reads "0 is an average assistant, +40 or more one of the best, -40 or less
  in over his head". Ratings run from about -58 to +68 (core/20_engine.js, basketball/21_coordinators.js clamp them
  there) and the grade words already call anything at +40 or above "one of the best"; the display isn't clamped,
  since a +45 is better than a +40 and the game uses the difference.
- Why: playtest (pro basketball): OFF assistant Luis Chatman showed +45 beside a scale that stopped at +40.
- Tested: `node test/polish.js "staff rating"`: every staff rating's tooltip in all seven games has the open scale. MATCH.
