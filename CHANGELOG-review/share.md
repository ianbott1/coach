# Reach and replay: league codes, the weekly challenge, save files, the season in review (branch rv3/share)

Games: all seven (shared core, `src/core/95_share.js`; small hooks in `99_app.js`, styles in `_head.html`).

The plan's last section ends with "shareable universes, a weekly challenge seed, async friend leagues ... cloud
saves", measured by "players share leagues without the designer's help". The games are single-file pages with saves
in the browser and no server, so everything here works from the game itself: what is shared is a seed and a player's
choices, and the receiving copy of the game works out the rest.

**Engine.** Nothing here moves a simulated result, so nothing is gated and `ENGINE_NOW` stays at 26 on this branch.
The one place the branch touched a result was a bug of its own, found by its test and fixed before commit (2, below).
A league code and a result code record the engine they were made on: a result code made on engine 26 can't be checked
on engine 27 and says so; a league code from an older engine still starts the same league, with a note that its games
will play on this version's engine.

How it was measured: `test/share.js` (new) plays each of the seven games in Node, from two separate loads of the built
page, and checks that the second load reaches the same league and the same season as the first. The real figures the
codes are held to are where people paste them: a league code must fit one text message (160 characters, GSM 7-bit,
https://en.wikipedia.org/wiki/SMS#Message_size) and a result code one Discord message (2,000 characters,
https://discord.com/developers/docs/resources/message#create-message).

## 1. A league code

**What.** `NBA-EQK1-0D-26-7PSR`: the game, the world seed and your club (Crockford base 32, so O/0 and I/L/1 can't be
misread), the engine it was made on, and a four-letter check. The check is a hash of all of that and of the league
this copy of the game builds from that seed (every roster's names, positions and ratings, and every program), so it
catches a typo and a code from a version whose league from that seed is another one. Where to find it: the team page,
"Share this league" (with Copy). Where to use it: the title screen, "Start from a league code" (a name is optional),
and the new-career screen, a League code box under the world seed. Another game's code says which game it's for.

**Why.** The world seed alone shared the universe but not the club, and nothing told a friend whether their copy of
the game made the same league from it.

**Game(s).** All seven.

**Tested.** `test/share.js`: in each game a code for seed 482913 reads back to the same seed and club; a career begun
from the code (typed in lower case, with O for 0) on a second load plays the same steps game for game as one begun
from the seed and club on the first; a changed last letter and another game's code are refused, with the reason.
Codes are 16-21 characters (one text message is 160).

**Not yet.** A code describes the league's start. A friend can't join a career in progress (that needs the save, 3).

## 2. The weekly challenge, and a result code checked by replaying it

**What.** The title screen's "This week's challenge" (the ISO week: 26 Nov 2026 is 2026-W48). The week fixes the
seed (a hash of the game and the week), the goal (it turns through three) and the club (by the pre-season ranking of
the build's own data, so the same for everyone):
- beat the forecast with one of the worst clubs (85-100% down the league): win at least the club's expected wins
  (the season's own chances, as the board's targets are worked out) plus 1.25 times the season's spread;
- reach the postseason with a club picked to miss it (55-75% down): the playoffs proper (NBA: the play-in alone
  doesn't count), a bowl or the playoff in college football, the NCAA tournament, the top half of the Premier League;
- win it all with a good side that isn't the favourite (12-30% down; college 1-10%).
The team page shows the goal and how far there is to go. When the season ends it shows met or not met, and a result
code (`CC1.nba.2026-W48.<data>.<check>`) to copy and send. "Check a friend's challenge result" (title screen, and the
challenge box) checks one.

A result code carries only the player's choices (every call's answer in order, plans before and during games,
promotions and trades, the featured man, ice time, team sheets and shapes, answers to the people's questions), the
score of each game they played live, and the season's end they claim. Checking it rebuilds the league from the
week's seed, applies those choices, and plays every live game again from its own dice and those answers, as the live
game does (`shReplayStep` from `rebuild`, `shPlayLive`); the rest of the season replays as a reload does. The code is
believed only if every live game comes out at its claimed score and the season ends on the claimed record and result.
A check runs in a sandbox: the career that is open is put back exactly as it was, and nothing is saved.

**Why it is hard to fake.** The check at the end of the code catches a typo, but it is in the page for anyone to
compute, so it is not the protection: the replay is. Changing a claimed record or a claimed score makes the code
disagree with its own replay; changing the choices gives another season, which is then just a different, honest
playthrough. The only way to a result is to play for it (or to search for choices that reach it, which is playing).
Restarting the week's challenge to try again is allowed, as in any daily puzzle.

**A bug found on the way.** The first version asked soccer's `seasonResult` for the challenge's progress mid-season;
soccer freezes its final table the first time that's asked, so the season ended "12th" on screen and "relegated" on
a reload. Found by the test's round trip; the progress line now reads the record only and asks for the result at the
season's end.

**Game(s).** All seven.

**Tested.** `test/share.js`, each game: a "beat the forecast" week; the first ten of the club's games played live
with answers taken in turn from each call's options, the pre-game plan changed every game and the plan changed
mid-game, every fourth step simmed, the rest live until ten; the code checked on a fresh load. Results (one run):

    game    target (expected)  played    code   checked   check time*
    cfb      6 (3.5)           4-8        704   matches    9.2 s
    nfl      7 (4.2)           6-11       784   matches    0.6 s
    ncaab   19 (15.9)          22-6       836   matches   24.9 s
    nba     18 (13.3)          12-70      826   matches   17.7 s
    nhl     39 (33.3)          35-39-10   754   matches   13.5 s
    epl      9 (5.9)           2-7-29    1019   matches   19.1 s
    mlb     72 (63.9)          55-107     856   matches   27.6 s
    * six games at once on four cores beside other branches' tests; nfl alone 0.6 s.

Refused, in all seven: the record edited and the code re-signed ("It claims 7-10 ...; replayed from its own calls it
comes out 6-11"), one live score edited and re-signed ("Its game against NY Jets on Week 1 replays 19-27, not 20-27"),
a code from another engine, one cut short, one with its calls taken out. A check run from inside another career
gives the same answer and leaves that career's games, steps and club as they were. Codes with ten games live are
704-1,019 characters (one Discord message is 2,000); a whole baseball season played live measured 3,806 before the
choices were packed (answers as numbers into a list, only the plans that weren't balanced) and comes to about 1,800-
2,400 after.

How hard the goals are with no person at all (`node test/share-odds.js 12`: the assistant sims twelve weeks'
challenges, four of each goal): in the table below. The postseason goal is pitched so a side picked to miss can make
it, which real leagues do every year (the NFL has had at least four new playoff teams every season since 1990:
https://nflspinzone.com/2023/01/10/incredible-nfl-playoffs-streak-extends-33-seasons).

    game    beat the forecast   reach the postseason   win it all
    cfb          0/4                  2/4                0/4
    nfl          0/4                  0/4                0/4
    ncaab        0/4                  1/4                0/4
    nba          1/4                  0/4                0/4
    nhl          0/4                  1/4                0/4
    epl          0/4                  0/4                0/4
    mlb          0/4                  0/4                0/4
    all seven    1/28                 4/28               0/28     (5 of 84, 6%)

Left to the assistant, a week's goal is met about one time in seventeen: the challenge is meant to need the player's
calls, and the postseason goal is the one a sim alone sometimes reaches. Four of each goal per game is a small sample;
the bands (CH_BANDS) are where to tune it.

**Not yet.** The check is a few seconds to half a minute in the long seasons and holds the page while it runs (it
says "Replaying the season..."). No leaderboard: friends compare codes by hand. A season whose live game was watched
in Full match credits its scorers by the men the screen showed, which a replay doesn't see; the scores, the record
and the result don't depend on it, but box-score lines in the replay can differ. Hot-seat careers can't take a
challenge. A code made on one engine can only be checked on the same engine.

## 3. A save as a file, with a version and a checksum

**What.** A backup file (from inside a career, or "Back up" on the title screen) now starts `COACH SAVE 2`, then one
line saying what it is (the game, club, coach, season, seasons played, the engine and build it was saved on, the
date, the save's length and a checksum), then the save as the game stores it. Restoring checks the game and the
checksum before reading anything: "That's a backup from Pro Hockey Coach. Open it there." / "That backup file is
damaged or cut short: its checksum doesn't match, so nothing was read from it." Files from before (the save alone)
still open. Windows line endings are fine. This is how a career moves to another device: back up, send the file,
"Restore a career from a backup file".

**Why.** A file damaged in transit opened as "isn't a backup from this game", or as a broken career; nothing said
which game a file was from.

**Game(s).** All seven.

**Tested.** `test/share.js`, each game: a finished challenge career written as a file reads back to the same career
as the old format gives; one character changed in the save is refused for its checksum; another game's file is
refused by name; Windows line endings open. `test/saves.js` MATCH.

**Not yet.** No cloud saves: a server is out of scope for a static page. `test/backup-reach.js` (browser) couldn't
run here; it reads files through `readBackup`, which takes both formats.

## 4. The season in review

**What.** On the season card (and from the team page as soon as a season ends, "The season in review"): the club's
record, the result, the board's grade, the season's moments (the sport's big moments from your games: a walk-off, a
hat-trick, an overtime winner, the comeback, the shutout, each with how many this season; the longest winning run;
the biggest win; the best win; the comeback and collapse the history kept), the awards (the league's player of the
year and your men in the race, your men on the team of the year) and the week's challenge if it was one. Copy it as
text, or download it as a picture drawn on a canvas (1080 x 1350, `reviewDraw`).

**Why.** The existing season card was a record and a headline; the plan's reach section asks for something a player
sends to a friend that tells the season.

**Game(s).** All seven.

**Tested.** `test/share.js`, each game: the review's text carries the record and the result, at least one moment and
one award, and the challenge line; the picture, drawn into a context that records every line of text, carries the
club, the record, the moments and the awards; the card view shows the review with both buttons; the title screen
offers the week's challenge. Real seasons drew, e.g., "Walk-off home run (3 this season). Malik Blanchard homered in
the bottom of the 9th, and that was the game." and "Hart Trophy: Josiah Dalby (C, Florida)."

**Not yet.** For seasons long past, the moments are what the history kept (the best win, the comeback and collapse):
the games themselves aren't in the save. Not checked in a real browser (canvas and clipboard need one).

## Other tests run

Run on the built branch, beside other branches' tests on four shared cores:
- `node test/share.js` (all seven): MATCH; per game 24-106 s. Rerun for nfl after the last change: MATCH.
- `node test/share-odds.js 12`: the table in 2.
- `OLD=/home/claude/dist-e26 node test/engine-replay.js`: MATCH, an older season replays as it was played (7 of 7).
- `node test/migrate.js`: MATCH 2253 of 2253. It first gave 15 "tab 0 differs", one per saved season: the team
  page's new share panels, which the old build doesn't draw. The panels now close with a marker and migrate.js
  leaves them out, as it does for earlier rounds' new panels; the base commit gives MATCH 2253 of 2253 too.
- `node test/saves.js`: MATCH. `node test/reload.js`: nfl MATCH 18 of 18, soccer MATCH 18 of 18.
- `node test/longrun.js --short`: MATCH (77 checks). `node test/boxscores.js` nfl and nhl: MATCH (9 and 4 checks).
- `node test/golden.js <game> --fast` (nfl, nhl, epl): MISMATCH on "screens" only, as expected for a new panel on the
  team page. The base commit's own build already mismatches its nfl screens hash (cff8cc43 against the recorded
  402d34ff); written out with `SCREENS=`, the branch's screens differ from the base's in the share lines alone
  (12 lines in nfl's first season). Not re-recorded, as the brief says.
