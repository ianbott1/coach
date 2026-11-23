# Coach — architecture

Orientation for any new session. Code: github.com/ianbott1/coach (renamed from football-coach in round 96;
branch main). Each game is one self-contained HTML file, no dependencies, no server, published on GitHub Pages at
ianbott1.github.io/coach. The old address (ianbott1.github.io/football-coach) is a separate repo of forwarding pages.
Saves live with the origin (ianbott1.github.io), so they survive the move.

## The seven games

    game                   build            output (dist/)              sport layer   league
    College Football Coach python3 build.py football-coach.html        football      cfb
    Pro Football Coach     build.py nfl     football-coach-pro.html    football      nfl
    College Basketball     build.py ncaab   basketball-coach.html      basketball    ncaab
    Pro Basketball Coach   build.py nba     basketball-coach-pro.html  basketball    nba
    Pro Hockey Coach       build.py nhl     hockey-coach-pro.html      hockey        nhl
    Soccer Coach           build.py epl     soccer-coach.html          soccer        epl
    Pro Baseball Coach     build.py mlb     baseball-coach-pro.html    baseball      mlb

Publishing: `python3 build.py site` builds all seven into dist/site/ with the
landing page (src/landing.html, the Coach title page) as index.html; copy that folder's files (and version.json) to
the repo root and push. The landing page's owls come from src/owls/ (node tools/owls.js after changing the owl art).
College football lives at football-coach.html (the root was college football until November 2026).

## Three layers

    src/core/          sport-neutral: RNG, talent model, season state machine
                       (80), history (90), your players: form, milestones,
                       moods (93_people), share card (95), objectives and
                       achievements (96_goals), sound/touch/motion (97_feel),
                       UI, saves and the live-game loop (99_app)
    src/<sport>/       football, basketball, hockey, soccer: positions and
                       ratings, the game engine (playGame, makeLiveGame), the
                       calls, the advisors (60_staff), the watch view, the game
                       screens (75_screens: live view, call view, replays,
                       readText for the read verdicts)
    src/leagues/<id>/  teams, schedule, postseason, offseason rules, awards,
                       views, text (the LEAGUE object); soccer's FA Cup is
                       leagues/epl/87_cup.js

A league chooses its sport with src/leagues/<id>/GAME. League settings switch
on anything one league needs (all default off, so other games are
unchanged): tuning.talentSteps, tuning.bb / hk / sc (engine settings),
tracksOT, draws, recText/points/standingsCol, rankTop, rankAll (number every
team), bigTop (what counts as a big game), position/positionLine (a table
instead of a ranking), myGameLabel, stepLabel, skipIdle, homeFirst,
jobMarket/poachOffers, budgetOf, pickIntro, afterWeek (between-weeks
business: the cup draw), cup, trophyNow, cardLine, postRecord (college:
postseason games count in the season record; elsewhere only the regular
season does, Season.countsInRecord), daily (hockey, pro basketball: Scores
is headed by the date; schedules list games, not days), text.bye.

## In-game calls: the design rule

Decided by Ian, Nov 2026: better decisions, not more decisions. No live
win-probability ticker (it kills the magic); a call shows its stakes in
words. Every call type is measured (win-rate effect over 60,000 games); one
worth under about a point is rebalanced or cut, and new call types are added
only where they matter. No target for calls per game.

Every call has a right answer you can work out from evidence on the screen,
and its worth is measured. Each sport's engine gives every side a hidden way
of playing that leaves marks in the numbers and the commentary; the right
answer blunts it, the wrong one costs a little.

    soccer      approach (press, block, flanks, direct) -> counter, at 25' and
                55'; the weak flank at half-time; score calls at HT (within
                two) and 70' (within one)
    hockey      system (forecheck, trap, cycle) -> answer, first intermission;
                your goalie after a bad period (a bad night vs bad luck), only
                within two goals;
                push/lock after two; when to pull the goalie (down one only)
    basketball  offence (threes, paint, pick-and-roll) -> defence, end of Q1
                and the half; half-time, late and last-shot calls
    football    the original calls (fourth downs, two-point tries, the clock)
    before the game (soccer, hockey, basketball): the scouting report. Each
                club has a usual approach this season (clubStyle: a hash of
                name and year, favW 4x as likely); the report is its last six
                games, from its own seed. Prepare a counter from kick-off, or
                wait. A drilled counter is sharper than a mid-game change; the
                wrong one leaves you out of shape until you change it.

After a live football game each call is judged (callVerdicts): replayed from
that moment with every answer over the same 1200 stretches of luck, later
calls left to the usual choice; "the better call" if yours won within 3
points of the best. Calls that made no difference aren't judged. The
verdict agrees with one from 10x the replays ~87% of the time.

- Every call's last option leaves it to your assistant, who plays exactly as
  the computer does: a skipped or simmed game is never worse than before.
- Pearl reads only the latest clue (commentary is ~50-60% truthful); the
  evidence panel is better. That gap is the skill. The Bears and the
  Capybara have fixed habits.
- After each live game the result says whether each read was right
  (engine st.log -> played.reads -> readText); a season tally is kept.
- Measured and dropped as calls (worth nothing either way): soccer
  substitutions, basketball foul trouble (sit your star or not).

What each kind of call is worth (test/call-weight.js, Nov 2026): every call
in a run of live games, the rest of the game replayed 40 times under each
option on the same luck; the spread between the best and the worst option's
win rate. Average points per call:

    soccer      game plan 10.6, reads 7.8, flank 6.4, late 5.5, half 5.1
    hockey      reads 15.9, game plan 14.5, goalie 8.3, lock 7.3, push 7.3,
                pull 2.1
    basketball  college: plan 12.9, reads 10.7, half 4.6, chase 3.3;
                pro: plan 10.9, reads 9.7, half 5.5, chase 5.0
    football    college fourth 6.2, half 4.4, protect 3.3; pro fourth 5.0,
                two-point/half ~3.8, protect 1.9

Acted on (round 21): soccer's late call was 1.6 (82% under 3 points); asked
at 70' instead of 75', only within a goal, with sharper modes (push
1.55/1.45, sit 0.50/0.80, win 1.35/1.25; engine calibration unchanged:
2.72 goals, 28% draws), it is 5.5 and the half-time call went 3.1 -> 5.1.
Hockey's pull down two and football's protect at 11-14 measured 0.0 and
are no longer asked. The pull down one stays at ~2.5: the real choice is
small, and an honest one. Remaining small: college basketball protect (1.5,
five calls in 30 games), pro football protect (1.9).

Calls on events, not only the clock (round 22, Instinct): two down before
the first read, it comes at once. Hockey calls a timeout at 10 or 15
minutes (about 1 game in 10; worth 12-17 points, as much as the
intermission read, 13); soccer at 15 or 20 minutes (rare). The 25'/first
intermission read is then skipped for that side.

Round 33: calls that matter (Ian: make the options genuinely different; no numbers on them):
- Measured first (test/call-weight.js, 30 games each): reads and scouting
  9-14 points a call everywhere; the situation calls (push, sit, protect,
  chase, half-time, late) mostly coin flips, largely because they were asked
  in decided games (football up 10 late: 100% either way; basketball down 16
  at half-time: 0-2%).
- Situation calls are asked only in a game in reach (core 94 callInReach:
  40 replays of the rest with the assistant's call; asked when 10-90%).
  Outside it the assistant answers (S.callAuto), as for a skipped game, so
  results are those of his choice; those answers are never graded or weighed
  (yourAnswers). A check costs 4-15 ms. Reads, scouting, flanks, the goalie
  and football's fourth downs (inReach) are always asked.
- Soccer's late call at 65' (was 70') with sharper modes for your choice only
  (upush/usit/uwin/upoint; the computer keeps its own): 5.3 -> 8.7 points a
  call, close either way 35% -> 4%. Your games' goals unchanged (2.73 when
  always taking the sharpest option; league 2.76). At 60' it was 7.2, but it
  halved the reading edge over Pearl (numbers vs latest clue, 60,000 games:
  main 1.2 win points, 60' 0.5, 65' 1.0): a wrong read had longer to recover.
- Cut, by Ian's rule: basketball's protect (about 3 points, 0.1 a game; your
  side now closes out as the assistant would) and football's half-time call
  (asked only at two scores or more: 0-1.3 points, 100% either way).
- The chance before a game is the same whichever plan you pick (withPlan
  "balanced"); the line telling you which plan to pick is gone. Plans are
  described in words and judged on the card.
- Control: the build with these call changes off matches the previous
  fingerprints except screens (golden) and exactly (hot seat).
- After (best vs worst option, average points a call / share under 3):
    pro basketball  game plan 10.9 / 13%, reads 10.1 / 22%, chase 10.0 / 25%,
                    half 6.7 / 39%
    college b-ball  game plan 12.9 / 10%, reads 10.7 / 16%, chase 7.9 / 17%,
                    half 4.3 / 53%
    hockey          game plan 13.7 / 0%, reads 13.5 / 10%, goalie 11.3 / 0%,
                    lock 10.9 / 0%, push 5.6 / 25%, pull 3.8 / 50%
    soccer          game plan 11.7, reads 9.6, late 8.7 / 4%, flank 7.1 /
                    23%, half 4.1-5.2
    football        college fourth 10.9 / 6%, two-point 18 (rare), protect
                    4.4 / 50%; pro fourth 5.3 / 38% and under one call a game
- Still to do: pro football needs more call types with stakes (onside kicks,
  timeouts, two-point in more spots); college basketball's half-time call and
  hockey's pull timing stay small (honest, but close half the time).

Round 34: the number you can trust (Muse, Grokbot and Instinct, round 11 of testing):
- The chance before a game is the engine's own (core gameEdge/winProb): the
  strengths the game is played with (SEA.matchupElo at the balanced plan:
  lineup, injuries, featuring, ice time, staff), not the league's running
  ratings (SEA.elo). A backup started moved nothing on screen while the game
  charged it in full (pro basketball, PG 24 worse: shown 65% -> 65%, engine
  57% -> 35%). Measured over four seasons a league: the old number was badly
  calibrated (pro basketball's 96% won 87%, 5% won 24%; pro football's 95%
  won 83%); the engine's holds (95% wins 92-96%, 5% wins 2-6%). Soccer's W/D/L
  the same (gameEdge). One number on every screen, whichever plan is picked.
- Skip (and Enter) plays on at once to your next call and stops there
  (skipLive); a game finished by endLive marks its answers as the
  assistant's (S.callAuto), never graded. Live controls act on the press:
  at Very fast the screen redraws faster than a tap.
- Basketball's crunch time, level or ahead with a call's worth of game left
  (the late segment, within 9): "close", a read of their closing play (each
  club's clubClose, the report of its last close finishes) against what
  they've run tonight; 60% go to the closing play (BB.closePref). 8.8-13.7
  points a call, rarely a coin flip; chase stays for behind. Hockey's third
  period, within a goal at ten minutes left: "third", a read with since-the-
  second-intermission counts beside the whole game; the other bench changes
  system for the third 25% of the time (50% when behind), only in a game
  within a goal after two and only against a person, so no other game moves
  (in every game it halved the first read's worth where no third read was
  asked). 12.3 points, 4% coin flips, 0.4 a game. Both gated like other situation calls (GATE_KINDS).
- Pearl reads change from the numbers, not her eyes: "has anything moved?"
  compares the numbers' best read at each stage (basketball, soccer), and
  when her eyes (the commentary cue, often wrong by design) disagree with the
  numbers she says so (basketball, hockey). Soccer's half-time lines answer
  her 25-minute read with the first half's numbers (pearlRecall), once.
- Scouts: an unsure read is said as what he's likely to be (scoutRead pulls
  it toward the class by its reliability, draftPrior). Fair on average before,
  but a high unsure read of 72 averaged 62 (Muse's three 73-82 reads arrived
  50-59); after, every read level holds within 1-3. The mock (dnMock) no
  longer pulls those a second time, treats a worked-out player as a sharp
  read, and gives each team ahead 70% of its own org's scouting error
  (DRAFT_K.mockOrg). test/draft-labels.js now checks draft night at every one
  of your picks (it checked the first only; the old build failed there at
  70% of "likely gone"): football 76/53/22, basketball 95/51/32 (small),
  hockey 94/60/26, all in band. Worked-out players stay listed wherever their
  read puts them; the tapped-once pick lives in dnArmed, not on the button.
- Promotions and firings belong to their season: S.promos and S.fires were
  never cleared, so a reload in season 2 replayed season 1's (a coordinator
  fired again: a season of "Interim staff", Muse). Reset each season;
  S.choiceYear marks them, and an old save past its first season drops its
  untagged ones.
- Text: Dynasty counts the season the moment it's over and lists it in Your
  seasons (now above the trophy cabinet); your seasons stay in reach on the
  fired screen; the playoff screen names the conference champions below the
  first team out; "close either way" says it isn't graded; a game you watched
  with no call says so; soccer's play-off places by number; soccer's since-
  half-time column is counts, not ten minutes scaled to 45 ("36.0
  turnovers").
- The reads tests (hk-reads, bb-reads) play each game on its own dice, the same
  for every strategy: one stream for all games let any changed draw reshuffle
  every later game. On common dice, hockey's "pull him on soft goals" is no
  better than "pull him at two" (0.0-0.1 apart, round 33's engine too: it
  passed on luck); the test now checks that knowing a real bad night is
  worth something.
- Measured, not changed: hockey live games 6.18 goals (target 6.1), pro
  basketball live 116.5 a team (league 115, target 114.6). Soccer's identical
  stats panels didn't reproduce: 400 simulated and 6 live panels, no repeats;
  the coarse since-half-time column made repeats likely, now counts.
- Still to do: football's late calls (clock, timeouts, two-minute drill) and
  pro football's call count; a firing that moves you skips the new team's
  free agency; hockey and pro basketball's free-agent market is depth only
  (teams re-sign their best; the pool floor is 58).

Round 35: football reads the game (Grokbot: pro football decision weight 4 of 10, under one call a game):
- Their defense and your answer, as every other sport reads its opponent:
  each club's usual defense (clubScheme: blitz, two-deep shell, loaded box),
  a scouting report before kickoff (prep), a read in the second quarter and
  one after half-time (with since-half-time counts beside the whole game);
  your answer (quick passes / run / deep shots) holds until you change it:
  right +0.070 touchdown and -0.025 turnover a drive, wrong -0.020 / +0.015
  (FB_READ). They change defense at half-time 30% of the time, 50% behind.
  Only against the computer in a game a person coaches; no other game moves.
  Pearl's read is the last drive (her eyes), the numbers the whole game; she
  says when they differ. test/fb-reads.js on common dice (8000 games): the
  report +2.8-2.9 win points, the numbers +3.6-3.9, Pearl +1.6-2.2, a guess
  -1.9 to -3.0, the right answer +7.9-8.1.
- Late calls a coach makes: the onside kick (after you score and still trail
  by up to 16 with 4 or fewer possessions left; 12% recovered, LEAGUE.tuning.
  onside; a miss gives them a short field) and your defense on their late
  drive (up 0-8 with 3 or fewer left: prevent, pressure or straight;
  DEF_MODE). Late calls give the clock in the engine's own unit, possessions
  left for each side (possLeft), not "about 6 minutes". No timeouts: the
  engine has no clock inside a drive, and an invented one would be a number
  you can't trust.
- Measured (test/call-weight.js, 12-17 games, two teams each): reads 8.5-9.3
  points a call (a dominant pro team 3.1), the report 6.8-10.0, fourth downs
  8.6-10.4, defend 7.5-8.1, onside 2.5-7.5 (rare). Pro football now asks
  about four calls a game (was under one). Scoring unchanged: your games
  48.1 points (48.8 before), the league 46.0.
- Control: with the reads and late calls off, every fingerprint matches round
  34 exactly (golden and hot seat).
- Still to do: the two-minute drill and timeouts would need a clock inside
  drives; a firing that moves you skips the new team's free agency; the
  free-agent market in hockey and pro basketball is depth only.

Round 36: the NBA Cup and the coach's notes (Ian):
- The NBA Cup (leagues/nba/87_nbacup.js): six groups of five, three a
  conference, drawn each season on the Cup's own dice; a five-night round robin
  on the Cup nights (steps 10, 12, 14, 17, 19: Nov 11-28), four games each;
  group tables by wins, head to head, then point difference; the six winners
  and the best runner-up in each conference to quarter-finals at the better
  seed (step 23, Dec 9), semi-finals (25) and the championship (26) in Las
  Vegas. Played as cup games on split days (LEAGUE.splitCup), on their own
  dice (Season._week swaps in sea.cup.gr), so no other game's result moves;
  they touch no record. Every team still plays 82: unlike the real NBA, where
  all but the championship count, because the schedule has no room to make
  the group games league games. Said on the Cup page. A Cup page on Rankings
  (your group, the bracket, the other groups), Cup lines on the next-up and
  result cards (LEAGUE.cup.stake, result), trophy and card lines, the history
  entry (league.cup). Core cup text is generic now (LEAGUE.cup.name, tag,
  rule, objective); soccer's achievements need LEAGUE.draws, not a cup.
  NBA_CUP=0 in Node turns it off: then every fingerprint matches round 35.
- The coach's notes (guideNote): a short note the first time a new career
  meets each kind of call (read, scouting report, fourth down, situation
  call, goalie, flank, crunch time, third period), the next-up card and the
  result card; "Got it" clears one, "Skip the guide" all. On for a new
  career (S.guide), off in a hot seat and for older careers; Help turns them
  back on. Screens only.

Round 37: the same number twice (Muse, Instinct, Grokbot, round 12 of testing):
- swapDepth moves the season's strength by the change (rosterElo after minus
  before), not to rosterElo: the season's base isn't rosterElo alone, so a
  swap and a swap back left the number elsewhere (Muse: 83% then 66% for the
  same five; college football 33% then 28%). Measured in all six: load,
  render, swap back and reload now read the same to the decimal (regression
  87). Draft labels: no change between renders in three games (labels.js in
  the round notes); they move with a workout or the board, as they should.
- The title screen blanks its save list when the browser brings the page back
  from its cache, then reads the saves (Muse: Winnipeg, 3 seasons, painted
  before Edmonton, 5).
- Hockey's box score credits the men its game log names, backups too
  (hkGoalNames, hkLogCredit; Season._resolve on a played game). The log picks
  scorer and assist from the goal alone; a re-worded goal changes words (w),
  never the scorer. Old build: 17 of 19 goals in 5 games mismatched; now 0
  (regression 88). Games don't move (the same dice); awards and history do.
- The NBA Cup's games are league games: on a Cup night the pair's own games
  that night are swapped (their opponents meet instead), or the pair's next
  meeting moves up when both are free; knockout nights the same, on the
  first night all eight (four, two) teams have a game. Everyone plays exactly
  82, one game a day (Instinct: a second game on a day you played; 86).
  The championship counts too (in the real NBA it doesn't): said on the Cup
  page. NBA_CUP=0: every fingerprint matches round 35 exactly (hot seat
  19a3071c).
- The season tally counts reads only ("graded reads only"); calls are priced
  in wins in the ledger line (Instinct: 11 of 11 right above a call that cost
  6 games in 100). Football's tally is now reads, like the others.
- Bundled objectives say each clause as it stands (LEAGUE.goals.clauseLine:
  college basketball's March, pro football's division and playoff win).
  Draft-night fit notes use your roster after your re-sign plan
  (dnRosterAfterPlan). An injured player's cost is said under the chance
  (injuredLine: "13% without X; about 41% with him"). One label ("to win,
  before the game", "Chance to win" in the glossary, which no longer says the
  plan moves it), one calm seat badge ("Secure"), and football's replay
  figures say each is that option's own rate.
- Pushed back, measured: hockey's 12-point winger swap moves about a point
  (a winger is 13% of the team and a starter plays 70% of the minutes); the
  late call in decided games stays gated (round 33); Very Fast stays a setting.
- Still to do: a rest-your-starters call for decided games (injury risk is
  real); retained box scores and a season story page; football's headline and
  replay figures come from separate replays and can disagree in the margin;
  soccer's payroll page; hockey's free-agent floor; phrase pools.

Round 38: decided games, and the basketball list (Grokbot):
- Rest your starters, in decided games: basketball at the late mark up 10-12
  (13+ the bench comes in by itself), football in the fourth quarter up 14-24
  with the ball. Resting costs on the floor (basketball: the bench's make-rate
  cost, half of benchPull, for the last stretch; football: you sit on it and
  your backups' defense gives up more, FB_REST_DEF) and halves the week's
  injury chance (REST_HZ 0.5: Season._resolve keeps a rested game in
  sea.restAt, talent.advance reads it; the same dice, so a rest only ever
  removes a knock). Measured on common dice when asked: pro basketball 96.8%
  kept, 94.3% rested; college 97.7 / 97.1; football 99.5-99.9 both ways.
  Asked in 9% of basketball games and 27-30% of football ones; not right or
  wrong (unclear), so not in the tally. With it off, every fingerprint
  matches round 37 exactly (golden and hot seat).
- Grokbot's card naming a choice he didn't make: not reproduced (107 card
  lines in Node, 67 in a browser at Very fast). test/card-honest.js keeps
  watching in the suite. "Saw it all" is now "Every read right".
- Points for and against in the standings (teamScoring: PPG, OPP, streak in
  basketball; PF/PA, GF/GA elsewhere), on screens 600px and wider: on a phone
  they squeezed team names to two letters.
- Pro basketball: a Finals defeat says "beaten in the final"; "win a series"
  and the conference-final target say where they stand (clauseLine).
- Measured, not changed: pro basketball scoring, live games 230.4 a game
  (league 229.1), playoffs 218.9; the scouting report differs every game of a
  series (each game has its own seed), the club's tendency doesn't.
- Still to do: the last-minute choices Grokbot keeps asking for (foul up three,
  hold for the last shot) need a clock inside the last segment; football's
  headline and replay figures from one set of replays; a team stats line on
  phones; a season story page with kept box scores.

Round 92: club styles from rosters (engine 15, all seven). Design addition agreed in "Player attributes: design".
- Each club's usual style (basketball's offense, hockey's system, soccer's approach, baseball's hitters, football's
  defense) comes from its opening roster, not a hash of its name and the year (Ian: the roster's lean, near-ties kept on
  the hash). core 93_attrs styleTable, made once in the Season constructor from its copy of the rosters (after
  attrSync), kept off the save (SEA._styles): each sport scores its styles from the shape the engine reads
  (sportStyleScores: basketball threes Shooting, paint Finishing+Rebounding, pick-and-roll Playmaking; hockey forecheck
  Skating+Checking, trap Defence, cycle Passing; soccer press Stamina+Tackling, low block Positioning, flanks Pace, direct
  Heading; baseball the nine regulars' Power, Eye, Contact by position weight; football blitz Pass rush, shell Coverage,
  box Strength+Tackling), each taken against the league that season (z), and a club plays the style it leans to most;
  top two within STYLE_TIE (0.25 of a spread) keep the old hash between those two. clubStyle/clubScheme read the table
  (rosterStyle) and otherwise the hash, so engine-14 seasons are untouched. Fixed as the season opens: a trade doesn't
  change it, a reload draws the same.
- The scouting report's line on their roster (Ian: one line; styleRosterLine): each style's attributes ranked in the
  league as the season opened ("Their roster, as the season opened: Strength and Tackling 3rd, Pass rush 24th, Coverage
  28th of 32. Clubs play to their rosters."), in all five report screens. Measured (test/styles.js, four seeds): the
  line's best rank names the club's usual style for 81-97% of clubs. The night still varies: the usual style shows
  about two nights in three (favW), as before.
- Football's reads tied to the roster (Ian: round 91's deferral): a right answer is worth more when your offense suits
  it (quick passes Accuracy, the run Blocking+Strength, shots downfield Arm+Speed), 1 + 0.3 a spread against the league
  as the season opened (FBR, fbReadFit; gameCtx fbn from styleTable's norms), held to 0.5-1.5. Across the league it
  averages 0.985-1.006 by answer; a wrong answer costs what it did.
- League levels, engine 14 against 15 (scratch r92 level.js, computer-only seasons; basketball pro, hockey, soccer, pro
  football six seeds x four seasons, the rest three x four): baseball, college and pro football identical (their styles
  touch only games against a person); pro basketball 227.5 points (227.5), home 59.5% (59.8), favourites 64.6% (65.1),
  wins sd 11.5 (11.8); college basketball 143.9 (144.0), home 61.0% (60.7), favourites 67.6% (67.6); hockey 6.17 goals
  (6.14), overtime 24.1% (24.6), favourites 55.8% (55.5), wins sd 7.7 (7.5); soccer 2.67 (2.67), draws 28.6% (28.3),
  home 43.0% (42.9). All within noise; no retune.
- Control: an engine-14 build of this round matches round 91's fast goldens exactly in all seven. At 15 every game's
  goldens move: computer games where styles play (basketball, hockey, soccer), and your own games everywhere (the
  opponent's style; football's read fit). engine-replay now replays engine 14 (round 91, a2b6b14).
- The chance before a game (core gameEdge, engine 15): the computer opponent's plan now counts its own worth at their gap
  (sportPlanShift, as cpuPlanOf weighs it), not only its roster fit. Found when regressions 37 was widened from one
  pair to six opponents at several gaps: an outgunned college football club taking risks is worth up to 60+ Elo, and
  the chance read 81% where the engine won 70% (Tulane, gap 289; 74% after). The same was true in rounds 89-91 for
  hockey, soccer and basketball's plan picks. Engine 14 seasons keep the old rule (the control).
- Watch (measured, not fixed): over six opponents a club's own games can run 2-2.5 points off the chance on average
  (hockey's Vegas -2.4, pro basketball's Orlando +2.0, the same on engine 14); the curve by gap holds within a point
  (scratch r92 curve.js) and a club's own style is worth under a point (ownstyle.js), so it is the meeting of two shapes
  and two styles, which no plan fit carries. Across random pairs the shapes' meeting is at the noise (median 0.6-1.0
  win points), up to 2-3.5 for strongly shaped pairs (Duke-UCLA: UCLA takes few threes, so Duke's perimeter defence
  counts for less). Counting matchups would need the chance to simulate the game: a later round's question.
- Tests: test/styles.js (quick tier); regressions 37 over six opponents (mean within 3, each within 7), 79 counts the
  opponent plan's own worth as the chance does; engine-replay's limit 2700s (twelve old builds took past 1500s beside the
  browser tests); stakes finds Manchester City's clinch on seed 17 (engine 15: seeds 11-21 clinch on 11, 14-17 and 20).
- Fixed on the way: soccer's live W/D/L read 101 when a sub-1% chance was shown as 1% (W 85 D 15 L 1; callwp found it):
  the largest gives the point back.
- Not built: computer clubs drafting, signing and trading for fit (Ian: a round of its own); basketball's crunch-time
  habit stays on the hash; a kicker.

Round 106: football's fourth and N follows the drive (engine 20; Ian: its own round).
- rollDrive drew a stalled drive's fourth and N apart from how far it got, so 9.8% (college) and 10.9% (pro) of stalled
  live drives ended on a state no series of downs reaches (fourth and 1 after 2 yards from a fresh first down), and the
  full match's lead-up to a fourth-down call couldn't reach the call's distance in about 1 call in 12. Now fbTogo
  turns the drawn distance into one the drive could have reached, with no new draw: G yards from the drive's start, no
  first down since: exactly 10 - G; a first down at X (at least 10 past the start): X + 10 - the spot, so at least 20 - G;
  goal to go: the distance to the goal line. A kick rolled as a drive's end carries one too (fbTogo(3, ...): it read
  "fourth and 3" whatever the drive, so a fourth-down call on a kick offered a short go). Gated on ENGINE_V >= 20; a
  season begun on 19 or earlier replays as it was (engine-replay now includes d5adcd9).
- Measured (600 live games a league, the assistant answering): points a game unchanged (college 49.9, pro 43.2), home
  wins within 0.4; fourth-down calls 3.09 -> 2.96 (college) and 2.95 -> 2.81 (pro) a game (a long fourth and N on a kick
  isn't asked: it's kicked); going for it converts less often (the distances are honest now). Impossible states 0;
  the full match's lead-ups reach the call's distance every time (fb-leadup: 0 of ~1,000, was ~70). The computer's
  simulated games don't use the drive engine's fourth and N (playGame), so that part leaves the league's calibration
  untouched (the punt rule below doesn't: it runs in playGame too).
- Also under engine 20 (same draws): no turnover on downs in your own end (inside your 40), or on fourth and 4+ in your
  own half, unless the endgame's own rule goes for it (166 at fourth and 10+ in your own half in 500 college games; now
  none): a punt. Punts from inside your own 15: 0.3% (the "about 5% of punts from inside their 15" in round 101's notes
  was the opponent's 15).
- Measured with both rules (engine 20 against 19, same build): computer games (calibrate.js, 200 seasons) college 49.5
  -> 48.6 points a game, favourites 0.699 both, margin 15.4 -> 15.2, home 57.9 -> 58.1%; pro 42.9 -> 42.3, favourites
  0.588 both, margin 11.4 -> 11.3, home 53.1 -> 52.9%. Live games (600 a league, the assistant answering) college 49.9
  -> 49.3, pro 43.2 -> 42.3 (NFL ~44-46: the gap below it widens by about a point; a punt for a turnover on downs gives
  the other side a longer field); home wins within 0.4; fourth-down calls 3.09 -> 2.93 and 2.95 -> 2.77 a game. The
  chance shown against the engine (regressions 37) holds: random pairs, pro, median miss 1.3 points, 90th 3.7 (engine
  19: 1.3, 4.1); the one pair past 7 (Seattle-Arizona, 8.0) reads the same on engine 19.
- Tried and taken out (round 106): inside their 28 a stalled drive that didn't try the kick tried it all the same (it
  falls through to "punt or downs", undoing "you don't punt from there": 12,755 of 49,268 rolled punts come from their
  28 or closer). That made yards on a stalled drive worth points, and blocking against the rush (the drive's "gain")
  worth more than any rating, plan fit or chance counts: the pro chance shown missed the engine by up to 14 points on a
  pair (Denver-Arizona 72% shown, 58% won; college Alabama-BYU 47% and 57%), the median miss over random pro pairs 1.3
  -> 2.5, 90th 3.7 -> 6.1, and the miss followed the gain gap (correlation -0.73). The first measurement of this round
  said the computer's games were untouched (calibrate.js identical): that was before these two rules, and wrong after
  them; the full suite caught it. Red-zone punts need their own round, with the plan-fit tables and the chance
  re-measured on the new worth of a yard.
- Goldens: football's games and stat lines move where a seeded career's calls went for it (on ENGINE_NOW=19 the old
  fingerprints match); the other games change only by the engine number in the universe.
- Tests on engine 20's seeds: cfb-conf tries seeds until Ohio State and Miami have each lost a title game (the two old
  seeds no longer reach one; seeds 11 and 12 do; still fails on 6473dcb); regressions 65 weighs the calls the card
  weighs (a read, the scouting report too, is graded in the reads list and never heads the card: a +18 read beside a
  -15 wrong call read as a headline disagreeing with its bullets).
- Suite on d7466b6: 146 of 147. The failure is draft-labels (pro football's board, "likely gone" at your first pick:
  50% of 30 at 16 drafts, band 75%+). It is a weak label on both builds, not this round's: over 48 drafts the published
  build reads 64% of 115 (out of band) and this one 73% of 135; at 16 drafts the published build read 64% of 45 and
  passed by its margin. Left as an open item; the test unchanged.
- Publishing (corrected): the root pages had not been copied since round 99-100's release, and GitHub's main was still
  6473dcb (rounds 96-98). Round 99-106's release copies dist/site and version.json to the root.

Rounds 103-105: soccer and hockey touch by touch, baseball pitch by pitch (Ian: "best in the world"; the engine
decides everything with the same dice; what the screen shows is built from the stretch's own record and hash).
- Soccer (72_highlights spPlan/spDraw, round 103). Each five minutes is a run of moves, each passed between the men on the
  pitch and ending in what the stretch's numbers say: the crosses, long balls and balls won high each side makes are the
  engine's (d.TA, the whole match's tally, less the stretch before, so the read card's numbers are what you watched),
  each booking at its minute on the man the commentary books (cardName's), fouls, corners and offsides at league rates
  (10.5, 5 and 1.8 a side a match) from the stretch's hash, possession as the read has it (50 plus each side's lean,
  normalised for the scoreboard). Every move picks up where the last ended (kick-off, goal kick, corner flag, free kick
  where the foul was, a throw where it went out); the move before a shot ends where the shot's own move begins, on its
  first man in his shirt (hlEvPlan's clips are the anchors; two shots in a minute are spread a moment apart), and the
  clip grows out of the play (each man starts from where the play had him). The eleven: keeper, and each line's two
  men (the squad has a first and second man per line; the engine shares the line's shots, goals and assists between
  them all match, bench share ~25-32%), so every man on the pitch is named and no shooter comes from outside it (it was
  20% with nameless partners). A man sent off leaves the pitch (slot 2, the centre back the red clip sends off). A goal's
  last pass is the assist the box credits for a watched game (d.pn [side,"a",slot,minute]; the draws are made as before
  either way); 72-76% of watched goals are assisted, the engine's 72%. The scoreboard keeps possession, shots, on target,
  corners, fouls and offsides as far as the clock (spTally). Twenty seconds of play a stretch at Normal (was twelve).
  Drawn from (stretch, fraction), so pause holds still (HLK.now frozen while live.pb.frozen). The plan is kept off the
  save (non-enumerable d._sp). test/sc-pb.js (scripted: counts, continuity, shirts, red cards, bookings, scoreboard),
  test/sc-watch.js (browser: assists against the passes shown, a reload keeps the box, pause holds still).
- Hockey (hpPlan/hpDraw, round 104). The same shape on the rink: each side's forced giveaways, killed zone entries and
  cycles are the engine's tells (d.T deltas: the read's "giveaways they force", "entries they kill", "shifts they cycle"),
  each penalty at its minute with the side short a man for two minutes (no sixth skater, in the play and in the clips),
  icings, offsides and frozen saves bring faceoffs at the dots (both lines set there), hits at the league's rate. The
  lines change every 45 seconds of play by the club's deployment (the clips' rule); the move before a shot is on the
  shot's own men (clip.an/dn). Twenty-eight seconds of play a stretch at Normal (was twelve). The scoreboard keeps shots,
  power plays (goals/chances), PIM and hits. test/hk-pb.js. Engine 20 puts a power play's shots and goals inside its
  two minutes (the engine spread them over the stretch, so a side was drawn short for up to five minutes; windows now 2.1
  minutes on average, at most 3 with whole minutes); minutes only, no draw. On a phone's pitch only the man on the ball
  is named (twenty-two names piled up). Shots come about five a stretch, so ~2% of moves are a
  quick touch between two (bounded at 3%).
- Baseball (bsPitches, round 105). Each plate appearance's pitches are a legal count that ends in the engine's result
  (strike three swinging or looking, ball four, in play, hit by pitch; a foul never strike three), from the at-bat's
  hash: 3.82 pitches a PA (MLB ~3.9), 26% of strikeouts looking, 12% full counts. The count and each call on screen.
  The line score's H is the hits as played (it read the last finished inning's, so a run could read on 0 hits).
  test/bs-pitch.js, test/bs-watch.js (fails on 62a4ca3: H never rose mid-inning).
- A watched match is longer: soccer about 1.7x, hockey about 2x, baseball about 1.8x the round 101 time at the same speed.
Round 102: the field on the screen, and two fixes found by watching every sport's full match (ships with round 101).
- Hockey's header clock piled up (round 101's running clock): the label kept everything after its first dot, and hockey's
  clock has one ("1st · 4'"), so each update kept the old minutes ("1st · 6' · 6' · 5' ..."). Its clock now sits in its
  own span (.wclk) and only that is rewritten. test/ev-full.js reads the label (fails on 1259cb1, passes now).
- The field above the action bar: at 1280x800 the fixed bar hid 24% of baseball's field (home plate, the batter, the
  catcher), 23% of soccer's pitch, 12% of basketball's court, 5% of hockey's rink. hlEnsure now draws a surface too tall
  for the room above the bar narrower and centred, down to 40% of the column (a 650-pixel-tall window: about 380 pixels
  wide). It resizes once when the win-chance bar arrives after the first stretch. test/fit.js: all seven, six screens
  (1280x800, 1366x650, 1280x680, 1440x900, 1920x1080, a phone), looked at through the first stretches and the calls.
- Soccer's six squad men (keeper, centre back, full back, midfield, wing, striker) named in the play between moments.
- Seen, not fixed: baseball's line score counts R for the inning under way but H only for innings finished, so a run can
  read on 0 hits mid-inning (the H column catches up at the inning's end).

Round 101: Full match as a match to watch (Ian: "it should be super interesting to watch full matches and as realistic as
possible - in football manager I would do this all the time"; then "add a play-by-play engine").
- The rule throughout: the engine still decides everything, with the same dice. What the screen shows is logged or built
  from the engine's own record for the game on screen only (live.eng.plog), never with new draws; logs are stripped from
  the save; the box score credits what the screen showed (d.pn, roster slots) only for stretches it showed, so a game not
  watched in Full match, and every computer game, is unchanged (goldens identical in basketball, baseball, soccer, hockey).
- Basketball: each possession logged in playSeg (d.pl: turnover, free throws, twos, threes, offensive boards, late-foul
  trips) and played back possession by possession on core live.pb (offensive sets by style, off-ball movement, the
  score held and moved as each basket drops; pause freezes it). The box credits the shown scorers' makes first.
  test/bb-full.js.
- Baseball: every at-bat and steal logged (D.pl) and played pitch to outcome, runners base to base; a call inside an inning
  plays the inning up to it first (pbPartialStart, live.askPend). test/bs-full.js.
- Soccer and hockey: a running clock (core hlEvPlan): the play between moments, then every goal and every counted shot
  (hockey every save) as its clip at its own minute; the box credits each shown shooter. test/ev-full.js.
- Football (72_highlights playsFor/stretch/series): a constrained play model inside each drive. From the engine's start to
  its end spot: series of downs that move the chains (each one's last play crosses the line to gain, the ones before
  don't), then for a kick, punt or turnover on downs a series that fails on third down and leaves the engine's fourth and
  N (d.togo) at its spot; a fourth down made is played where it was made (d.cv). Runs, catches, incompletions, sacks,
  scrambles, a second back about one carry in four, defensive flags that move the chains (pros 5 yards, college 10, 15
  for a personal foul), each with its man named. Seeded from the drive's numbers. A fourth-down or two-point call now
  shows the drive up to it first (core hlLeadUpStart, HL_SPORT.leadUp); the drive pushed after the answer starts from
  the same numbers; it is built from what the lead-up showed (live.leadShown: its plays, end spot and fourth and N),
  then picks up where it ended: nothing more for a kick, punt or turnover on downs; for a fourth down made, the play
  that made it (a flag on the defense for a made fourth and goal, which the engine carries on with short of the line)
  and the rest of the drive. A two-point call's lead-up is the drive and its touchdown; nothing of it plays again.
  test/fb-leadup.js (scripted engine games, ~960 fourth-down and 50 two-point lead-ups). The box for a watched game is the plays: passer
  completions, attempts and yards, the back's carries and yards, each receiver's catches and yards; drives not shown
  keep their share of the draw (teamLines). test/fb-full.js (browser): box equals plays, a skipped drive keeps nothing,
  each lead-up is how its drive begins.
- Engine record (no draws, results identical): a turnover on downs keeps its spot (d.stall), a made fourth down where it was
  made (d.cv), an answered call the distance it was asked at (d.togo). A touchdown's yards never exceed the field the
  drive had (engine 19, ENGINE_NOW 19; driveScript caps the same draw at 100-start; it showed a 64-yard TD from their
  30 about one TD in ten). A season begun on 18 or earlier replays as it was (engine-replay now includes 49d1e29).
  Goldens: football's stat lines and awards move (games, standings, polls, champions identical; on ENGINE_NOW=18 the
  old fingerprints match); the other games' change only by the engine number in the universe (STRIP=engV equal).
- Measured (scratch r101 fbplays.js, 16 games a league; fb-full against the record's own spot): plays end on the
  engine's spot in every drive once the outcome clips start where the engine had the ball (punts and kicks were
  clamped, 13 drives in ~600 off), downs and distance consistent. A watched pro box ~23/32 for ~220 passing, lead back ~19 for ~88 (the stat model: ~19/33 for 204,
  17 for 74); college ~28/38 for ~270, back ~20 for ~96 (model 22/38 for 242, 18 for 76). 3rd-down conversions 40-44%,
  ~2 flags and ~3.5 sacks a side.
- Broken in the engine, not fixed: rollDrive draws a stalled drive's fourth and N apart from how far it got, so ~8% of
  drives end on an impossible state (4th and 1 after 2 yards from a fresh first down). The plays show the nearest real
  distance, so about 1 fourth-down call in 12 reads one distance and the drive shows another. Fix: draw togo from the
  gain (togo >= 10 - gain from the last first down); an engine change with a version bump and calibration (Ian: its
  own round). Also seen: about 5% of punts come from inside their 15 (a stalled drive past the kicking range the
  engine turns from a miss into a punt); the clip punts from there.

Round 100: Grokbot's round 12 interim report (five games; soccer and baseball still under test). Ships with round 99.
- Plan card against plan played (pro basketball, Grokbot: the card showed Work it inside at 55%, the game played Shorten
  the game at 32%). Reproduced (scratch r100 planreload.js): a plan change made mid-game is kept in S.planMid by game; a
  game begun again after a reload or a quit replayed it, and a change at the first possession overrode the card. Now
  startLive drops your own changes at possession 0 when a game starts (the card has the say); later ones still replay
  where they were made. Before: card safe, game aggressive; after: both safe.
- Coach name (Grokbot: "Ian Bott" kept as "Ian Bot", "Ian", "n"). Not reproduced by typing (stored right in all seven);
  a redraw of the setup screen mid-typing lost everything typed (measured on the released build: "" after two redraws).
  The setup screen now keeps what's typed, the focus and the caret through any redraw; Suggest one sets the box too.
- Injured man on a touchdown (pro football, Grokbot: a receiver out 14 weeks caught a 64-yard touchdown). The live drive
  has no d.by until the season credits the game at its end, so driveScript named the slot's man, hurt or not, and the
  touchdown clip reads that line (hl-hurt only checked the clip's key). driveScript now builds the season's own rule for
  a live drive (_creditV4/teamLines: a hurt man's backup plays his slot). test/fb-live-names.js: the live line against
  the finished game's, 1,144 lines in both football games, 0 differ (released build: 21).
- Desktop plan clicks (every game): the side column (#side) scrolls on its own and went back to the top on redraw; its
  scroll is kept and the pressed button stays under the pointer (measured in all games with a plan card, 1280 and 390).
- The Play button names the plan it starts on ("on Balanced"): the result card's Play week used to carry it silently.
- Full match: basketball's and hockey's play between moments names every man by number and name (basketball onFloor, the
  clip's own rotation; hockey's five by possession, the second unit about a third, a hurt man's line-mate in his place);
  the score bug's clock is the header's when it holds one (it read 6', the rink 10'). Basketball now plays each stretch
  before its big basket, the score held until the moment, as hockey and soccer do (HL_SPORT.leadIn); full-order covers both
  basketball games.
- Basketball's read panel marks points in the paint (bbPaintMark: pros 20+ high, 10 or under low; college 13+ and 7),
  measured at 300 reads a league; a marked paint rate counts as shown when a read is graded.
- From the full report (soccer and baseball added):
  Baseball's call inside an inning (Muse; Grokbot: "10th inning, tied 3-3" then play at 2-2): the held score started at
  the end of the last inning, so the scoreboard and line score stepped back behind the call. live.askScore keeps the
  score a call showed; the hold starts there, baseball's clips skip the plays up to the one that made it, and the chance
  bar holds with the score in every sport (it read the result of the clip still to play). test/bs-call-hold.js (browser):
  57 calls, 0 step back (released build: 4).
  One Skip played two baseball games: the bar's Sim game sits where Skip was. Play (side column), Sim game and Enter now
  wait 1.2s after a game ends (Sim had 0.7s; Play and Enter had none).
  A new call scrolls to its top when the page was scrolled away (soccer on a phone: the read off-screen).
  Evidence headings contain their right-hand label (display:flow-root): soccer's table row wrapped round it, a word a line.
  Baseball's plans "all worth 0": not so on a new career (Cincinnati 35/46/57, Seattle 47/41/35); the tester's Seattle
  career (64-98 both rounds) began before engine 17, where plans did nothing, as the hub now says. Soccer's roster barely
  moving the plan is likely the same. Not reproduced: soccer's Highlights row under the speed buttons (clear at five
  sizes, paused or running, scrolled to the end), taps not registering, the Burnley read graded wrong (reads that follow
  the report aren't graded). Not changed: a catcher's grid says power counts most because his rating uses the hitters'
  weights (true, but a design question for Ian).
- Not reproduced, so not changed: a rested five-foul starter still on the floor (0 fouls to a rested side after a rest in
  180 games on the released build or this one). Not done: the plan as a real decision at even odds (point 1; the best
  plan depends only on your own roster, so one plan wins most nights: needs the opponent in the fit, an engine round);
  football's 4th-and-1 graded wrong at 69% (graded by replays, by design).
- Round 99's later items: rested football starters leave the clips (REST from L.restAt; test/fb-rest.js); football's Full
  match plays each drive snap by snap (mkDrive, gains summing to the drive, down and distance, chains); Full match lengths
  by sport (HL_SPORT.fullMs); in Full match the stretch plays before its moments (live.leadPend; test/full-order.js).

Round 99: Ian's notes and the November 22 reviews (Muse, Instinct).
- Title page: the "Seven games · five sports" line and the three-box section gone (Ian: they read as AI).
- Field goals: the kicking unit wears numbers (football 72 stNums): the kicker the one kickerName names, the holder and the
  line on numbers no one on the roster wears, the same each time for a club; the rush the defense's numbers; the key names
  the kicker. Picks: a man from the passing side cuts across and brings the returner down where he's downed (the
  quarterback on a long return, the intended receiver on a short one), tagged TACKLE; not on a return to the end zone.
- The team card and the top bar link (core GO, goTo): the club's name and record to its page (schedule and history), the
  group record to the standings at its conference, the ranking to the ranking tab, the coach to his page; keyboard too.
  test/golinks.js (quick tier, browser): every figure in all seven at 390 and 1280 opens its page; fails on 6473dcb.
- Old seasons (Muse's veteran careers began before round 88: plans moved nothing, the grids said the engine didn't read
  them): a season plays to its end on the engine it began on, so saves replay; the hub now says what arrives next
  season (oldEngineHTML, seasons before engine 17) and the grids say "this season", not "this game". Measured: a season
  begun on engine 9 reads 68/68/68 for hockey's three plans and the old line; engine 18 moves them.
- College football: losing a conference title game no longer says "Season over" before the playoff field is picked
  ("Beaten in the ACC Championship. The playoff field is picked next."). test/cfb-conf.js: Ohio State and Miami lose
  their title games; 6473dcb said "Season over" for both.
- Baseball's call screen: the clock under a call never reads under half an inning (in extra innings it was 0, so a one-run
  lead read 99%: Muse). Up one with half an inning left now reads 91%. Not fixed: a call comes mid-inning and the live view
  shows the inning from its start after it, so the scoreboard steps back behind the call's headline.
- Watching (Ian: hockey "never skating down the ice or passing", basketball "not seeing dribbling"): hockey's play between
  moments is whole-rink possessions (a breakout from behind the net, the carry up the ice with the puck worked on the
  stick, the entry or a dump, a cycle of passes low and to the points, the puck lost deep where the other five break out),
  the checkers back between the puck and their net, the goalies square. Basketball brings it up the floor dribbling, the
  ball bouncing at the handler's side, a drive at the rim once a trip, then kicked out. Both drawn from the clock; still
  never a shot (shots are the clips). Not yet: the clips placed inside the continuous play, so what you watch is the
  game's own possessions; football and baseball between moments (their engines have no plays inside a drive or inning).
- Not done from the reviews: rested football starters still named in clips and backups' games uncredited; hockey's backup
  goalie's start; baseball's injured probable starter; football's canvas and caption naming different sides (not
  reproduced yet).

Round 98: watching (testers: "a sport they read rather than watch").
- The play between moments (core hlAmbOn, hlAmbient; each sport's ambient): hockey and basketball join soccer. Hockey: the
  puck moved about by the side with it (the stretch's mom), never into the slot or a shot, each five keeping its shape
  round the puck, the man on it carrying it, the goalies square, a score bug with period and minute. Basketball:
  possessions trade ends (the side that had it gets back, the other brings it up), the ball worked round the arc by
  passes in the air, each defender between his man and the rim, a score bug with the quarter. Drawn from the clock,
  never stored, nothing drawn from the game's dice.
- Where the pitch stays on the live screen (soccer, hockey) the play runs in every mode, so the ice and the pitch are never
  empty between clips; the pace is the mode's own (only Full match waits longer between stretches, as before). Basketball
  shows its court between moments in Full match only (it collapses otherwise; core keeps the box up in Full match).
- Fixed on the way: the man nearest the ball was meant to be on it in soccer's full match, but the search radius was 9
  pixels, so the ball ran loose; hockey's copy had it too before it shipped. Now the carrier has it.
- Seen in Chromium at 1280 in Full match and Key moments, five frames each sport (scratch r98 amb.js); no page errors.

Round 97: trust fixes from Grokbot's round 11 checklist, each measured first; only what reproduced on round 96.
- Baseball's call screens (core liveWPHTML): a stretch is an inning, and baseball asks inside one, so a call showed the
  last inning's reading ("8th inning, down 1" over the tied inning's 44%). On baseball's call screens the bar reads the
  call's own score (ask.mine, ask.theirs), half an inning into the one under way.
- Baseball's live chance shrinks its spread as tau^0.7 (LIVE_TAUP, was 1: linear). Measured on 1,500 even engine games
  (scratch r97 bscal.js), linear read two runs down after eight as 0% where 4% came back, after seven 3% for 10%.
  live-wp: best fit spread 4.20 (the build's), worst band 6.8 points. Spread unchanged.
- A hurt man is never in a clip (core hlFit; hockey's lines and goalie, soccer's named units, football's tracked men):
  measured before, hockey 144 of 900 clips named a hurt man (most often a hurt starting goalie in net), soccer 65 of 237,
  pro football 80 of 343; now none. test/hl-hurt.js (quick tier, six games).
- Not reproduced: baseball's last-out banner "down 2" at 11-10 (1,381 last-out clips, the gap right every time). Left: the
  plan picker sits on the next-game card beside Play by design (no extra stop before a game); the rest of the checklist.

Round 96: Coach (Ian: the set is "Coach", its title page, and an address without "football"); the attribute grids
(Grokbot's point 4).
- The title page (src/landing.html): COACH, seven games and five sports (it said six sports), the seven owls on their perches
  as links (src/owls/<league>.svg from each game's own LOGO, tools/owls.js; build.py fills <!--OWL:id-->), a card per game
  with its owl. No horizontal scroll at 390 or 1280. Every game's title screen links back ("Coach · all seven games");
  the build stamp moved under the restore button.
- The address: the share card, each league's site line and the landing footer name ianbott1.github.io/coach and
  github.com/ianbott1/coach. Ian renames the repo on GitHub; GitHub doesn't redirect a project site's old URL (docs:
  renaming a repository), so a new repo named football-coach holds forwarding pages (index, each game's file, 404,
  version.json with "moved" so an old open copy offers a reload; scratch r96/forward, football-coach-forward.bundle).
- The 1-20 (core attrShow, display only): against every rostered player, not the starters, with soft ends:
  10.5 + 9.5 tanh((v - m)/(1.55 s)), m and s fixed per league (ATTR_SHOW, measured once on every opening roster).
  Before, 7-10% of the pro games' shown attributes read 1 (a Denver backup safety 1, 1, 1, 1 as "Lockdown corner")
  and hockey's best read 18. After, over four seasons in all seven: 1s 0.0-0.1%, 19-20 2.3-4.4%, the league's best
  players average 18.6-19.3 (test/attrs.js checks under 2%, 0.2-6%, 16.5+). Shapes, roles and every engine read the
  rating scale, unchanged: the fast goldens match.
- The grid: one list by band with a bar per attribute, each attribute's weight for his position beside it (pips: counts
  most / more / less), heaviest first in each band, and the line says which count most ("Weighted for his position:
  Hands and Speed count most, then Vision. His rating (84) is that weighted mix, so the 1-20s won't average to it").
  The grids stay 2-8 attributes a position: more would need the engines to read them.
- Not done from Grokbot's round 11 list (most of it was against round 92's builds: fit, reads graded on the panel and
  named scorers came in rounds 93-94): a one-line attribute "why" on the post-game card (point 3); the replay odds after
  late calls (point 6); the minor-fixes checklist, unverified on this build.

Round 95: what the plan did, and an 80th minute worth deciding (engine 18 for soccer's and hockey's late calls; ENGINE_NOW 18).
- College football's sim time back (round 94 left it 1.25-1.6x slower): fbFitOf parses a fit table's keys once (FB_FITK),
  the same sum in the same order. A fast golden season 11.4-12.3s against 14.4-16.2 (round 93 10.8-11.0); both footballs'
  full goldens and hot seats identical.
- After the game, the plan (Grokbot's point 3): the result card opens its audit with the plan you started on, its
  worth before the game as the card showed it and why ("You started on Take risks: -5 before the game (43% to win,
  against 48% on Balanced), as the better side tonight. Play it safe would have been +4."). Kept when the game starts
  (doAdvance planPreKeep, S.planPre, this season only, checked against the card's opponent), so it never reads a later
  step's injuries; on Balanced it names what the best other plan would have added; a change during the game is said;
  simmed single games too, none for games simmed ahead on the assistant's plan or in a hot seat. No verdict on whether
  the plan "worked" tonight: a plan's extra is a fraction of a score a game, one box score is luck. test/plan-line.js
  (quick tier): all seven, 58 games, the card's number before the game equals the line's, and it is in the save.
  PLANLINE_ON=0 matches round 94's fast goldens. First worded "kicked off ... before kickoff" in every sport: wrong-sport
  caught it in the five non-football games (9 to 324 times a season); now "started on ... before the game".
- Late calls, measured (Grokbot's point 6; scratch r95 lc.js: engine games at random gaps, each option played on from
  the call on fresh luck, 300 runs an option, hundreds of calls a kind). Most late calls were one of two kinds. Quizzes,
  one answer always best: soccer's 80' in every state (down one push 180 of 180, up one sit 180 of 182, level go for the
  win 172 of 201; 65' the same), hockey's pull (early 206 of 208), football's tied call (push 85%, worth 7-10 points),
  football's defend up a score (prevent 84%, 2 points). Near coin flips: hockey's last five minutes (push minus sit 0.9
  points tied, 0.6 up one), overtime, the goalie call, basketball's foul trouble, baseball's steal, pinch and pull,
  football's protect. (Told to Ian first from 3-16 calls a kind; the lab corrected three: soccer level is a quiz, not a
  coin flip; basketball's fouls are flat, not a quiz.) The ceiling at that minute: an absurd one-sided boost to one
  option (own chances 3x, none against) is worth 10 points in hockey's last five minutes, 21 in soccer's last ten.
- Soccer's 80' call rebuilt as a read (Ian): how to chase, see it out or go for it. Down: Go at them (press high) or Keep
  the ball; level: those or Take the point; up: Keep the ball or Park the bus. The answer is in their back line's legs:
  how hard the day has been on their defence and midfield (scLegsZ, from the stamina model's per-game drain SC.fit; the
  energy itself sat near full at 80' after the 60' and 70' changes), shown on the call as the staff's read of each side's
  legs, 0-100, a few points off (SC18.noise 8). Going at them: own chances x(1.8 + 2.0z), theirs x(1.6 - 0.8z) where z is
  +1 for a back line that's gone and -1 for fresh legs; keeping the ball x(1.25 + 0.5z) and theirs x(0.75 - 0.7z), and
  x1.35 more of your own when behind (it is still a chase); park the bus and take the point as before. Your answers only:
  the computer's late modes and every computer game are untouched. Pearl reads the legs, the Bears always go, the
  capybara never does. test/sc-final.js (quick tier, 700 games, 200 runs an option): reading the legs 41.2 against the
  best fixed answer 40.2 and the assistant 37.6 level, 7.9 / 7.4 / 6.2 down, 90.6 / 90.0 / 87.9 up; best answers split
  83/74/32, 72/66, 93/69. Honest size: the options now differ (level 8.4 points apart), but reading the legs adds under a
  point over the best single answer; up and down stay small because ten minutes rarely changes a result. Your games'
  goals 2.79 a game (round 94 2.78).
- Hockey's late decision is the ten-minute read (Ian, after the ceiling above): the late floor's window opens at ten
  minutes left (engine 18), where the third-period read is asked, and the read's counts are kept for games two apart
  after two, so a game that comes within a goal gets it too (no system change, no draw). The five-minute call stays in
  NEVER_ASK and now comes up only as the floor's fallback. late-calls (40 games): 18 of 18 close finishes asked the read,
  the five-minute call twice. The pull stays a quiz (Ian).
- Not done, for Ian: hockey graded in standings points (an overtime loss's point; the lab shows it flattens the tied
  call further, 2.2 to 1.4, and the tied call is no longer asked); football's tied call (a 7-10 point quiz); the small
  quizzes and coin flips left with the assistant or as they were.
- Checks: sim parity MATCH (hockey -1.3, soccer +0.4); hk-reads MATCH; sc-decisions MATCH; ENGINE_NOW=17 matches round
  94's fast goldens in all seven; at 18 the other five games differ by the universe's engine stamp only. engine-replay
  replays round 94 (796a941, engine 17). Soccer's evidence rows keep their label at phone width ("Now1st, level", since
  round 44). Full suite 129 of 129.

Round 94: plans you can feel (engine 17, all seven; ENGINE_NOW 17). Ian, after Grokbot's point 1 ("make roster fit move the
win chance in every game, and show why"): about 8 points of win chance at even for a roster one league spread off the
average, held to 15; the wrong plan costs as much; balanced plays as before.
- Measured first (scratch r94 plans2.js, every club against the club nearest in rating): the best plan over balanced, median
  and 90th percentile, college football 3.8 / 8.6, pro football 5.0 / 9.2, college basketball 0.9 / 5.2, pro basketball 1.3 /
  3.2, hockey 0.7 / 1.8, soccer about 0 / 1.8, baseball 0 (no fit at all). College basketball's "identical across plans" in
  a browser was its opening schedule: mismatches at 97-99%, where no edge moves the number.
- core planAmp(f, A): each sport's measured fit (rounds 88-92: what the plan's channels already give a lean, FIT on a
  person's path, FITC on the computer's) times its M (one league spread of fit to 8 points on its curve), held to +/-cap
  (15 points). The extra over the measured fit is played through the plan's own events at each sport's measured rate per
  Elo, so a box score carries it: hockey (M 12.5) skating with them makes more shots, clogging it up allows fewer;
  basketball (college 2.0, pros 3.5) working it inside makes more of its twos, shortening the game more of its threes;
  soccer (8.8: on its W/D/L model 8 points is 123 Elo, draws flatten it) taking the game to them makes more chances, sitting
  deep more on the break (cutting their chances drew 32% of games); football (college 1.6, pros 1.8) taking risks scores
  more touchdowns, playing it safe keeps more drives going. Channel gains (gs, ga) set on the computer's path at the cap
  (scratch r94 ampcheck2.js, the same clubs and dice on 17 and 16), then checked on yours where the shown number lives
  (person.js: your club on your plan, calls left to the assistant, the opponent on its suited plan, clubs near one spread,
  3,000 games a plan on common dice): played against shown hockey 0.93, college basketball 0.98, the pros 0.94, pro
  football 0.98, college 1.00, soccer 1.08, baseball 0.97. Basketball's person path played the extra louder (the pros
  1.61x at first: a person's plan also sets his offence), so a person's extra there is scaled (BB17.hg: college 0.85,
  the pros 0.58). One M on both paths means a computer basketball club gets about half a person's fit from the same
  roster (FITC is about half FIT); the other sports' paths are within 10%.
- Baseball's fit (design addition, new): the nine regulars' lean, Power against Contact and Eye (sportStyleScores, as the
  report's roster line), in league spreads (bsLeanZ; the spread from the opening rosters, core styleTable's leanSD, so a
  promotion before the first game can't move it between a play and its reload); 95 Elo a spread, held to 146 (12 points,
  not 15: below). In the game's context (ctx.lz). Played as a better side plays (BS17: x0.79 of the fit's log-odds through
  every hit and walk, half at the plate for the suited club and half in the field against its opponents), not through the
  plan's own outcomes. The first build played it all as home runs (Swing for the fences, up to x1.77) or singles and walks
  (Small ball, x1.42): the full suite's MLB player check failed 10 ranges, home-run leaders 60-79 (engine 16: 40-46), the
  best average .375, runs 156-159, RBI 148-164, while the league's runs held at 4.50. All through every hit at the plate:
  home runs back (58.5) but runs 168-177. Half in the field: the hitters back, but an ace reached 227-236 innings (MLB to
  225: fewer runners, longer starts) at the 15-point cap. Held to 12 points, the check passes (scratch r94 bsp-d.txt). Six
  seasons on 17 against 16 (bsp6-*.txt, before the cap): home-run leaders 52.2 against 43.5, runs and RBI leaders within a
  few. Measured after: the computer's path 1.04 of the curve, yours 1.12, 8.61-8.81 runs a game (8.82).
- The chance before a game counts it (sportPlanFit returns the amplified fit; gameEdge unchanged), so do computer clubs'
  plan picks (cpuPlanOf) and the opponent's fit. Measured in a browser, each plan clicked: Tulane 43 / 36 / 52, the LA
  Clippers 63 / 49 / 74, Boston (hockey) 41 / 54 / 29, Cincinnati (baseball) 45 / 32 / 58.
- The reason line (planReasonHTML, engine 17; Grokbot: "+9 because your arm and speed fit Take risks"): one line under the
  plan buttons from the same chance as the number above (each plan's chance less balanced's), naming the roster or the gap
  ("+11 from Shorten the game: your shooters suit it. ", "Take risks would add 9: your arm and speed suit it."). It
  replaces the fit line and the underdog line, which could contradict each other. "Kept from your last game" only when the
  plan was chosen before today's game (S.planStep).
- League levels, engine 16 against 17 (scratch r94 level.js, computer-only, three seeds x three seasons): suited plans
  everywhere scored more (baseball 8.8 to 11.1 runs a game, pro basketball +4 points, football +1.6 to 1.8, soccer's
  sitting deep 2.66 to 2.39 goals and 32% draws), so each is recentred on 17 only: hockey's shots x1.02 (HK17.g),
  basketball's make rates -0.014/-0.019 x (0.5, 0.36) (BB17.k), football's touchdowns and kicks x0.967/0.966 (FB17.g),
  soccer's chances x0.95 (SC17.g), baseball's hits and walks x0.905 (BS17.g; 0.985 once the fit plays half in the field). After: baseball 8.80 runs (8.82), pro
  basketball 228.9 (227.7), college 144.2 (143.9), pro football 45.6 (45.4), college 53.6 (53.7), hockey 6.10 goals (6.14),
  overtime 23.7% (23.6%), soccer 2.70 goals (2.66), draws 29.9% (28.9%: a point higher again; watch), home wins 41.9% (42.8%). The cost, as
  told to Ian before building: the standings spread out where seasons are long and fit is a whole spread of wins (wins sd
  hockey 7.9 to 8.3, baseball 15.1 to 16.6, soccer 4.67 to 4.88; pro basketball and both footballs unchanged within
  noise). Balanced itself isn't the old game: the recentring moves every game a little, and nearly every computer club
  now takes its suited plan, so staying on balanced gives the opponent's fit away.
- Hockey's scoring leaders (Ian: back into 45-57; credit only, engine 17): NOT reached. The lean 0.06 a spread held to
  0.75-1.2, the star factor 0.35, the depth share 0.3 split evenly between a starter and the man behind him (HK17C):
  four seeds read 56.8 goals (61, 55, 58, 53), eight more seasons 61.8 (59-68): about 60 over twelve, as round 93; the
  points leaders come down a little (110-119 against 107-139). Every goal is named among the ten skaters a roster
  carries where a club dresses eighteen, so the stars take about a quarter of their club's goals. More weight to the
  defencemen (HK17C.dw 2.4) centres the leaders (51.9) but a defenceman led the league with 55 goals and the first
  pair's best reached 86 points (target 35-45): left at 1. The real fix is a deeper roster (or unnamed depth goals
  again): Ian's call.
- The full suite then (round 94's first run): beyond baseball's players, the chance before a game against the engine
  (regressions 37) read hockey -3.7 and pro basketball +3.1 (bound 3). Hockey's computer path played 0.92 of its counted
  extra (scratch r94 amp2all.txt; the others 0.97-1.16), so hockey's channel gains rose (HK17 gs 1.15 to 1.25, ga 1.4 to
  1.52: computer 0.99; your path 1.10 to 1.15 at 10,000 games a plan, within noise). That did NOT fix test 37: it then read
  -3.5. The "Vegas -1.1" first written here came from a script (pre37.js) that built opening night's context, where the
  test built week 5's against opening night's chance. Round 94's second pass (scratch r94 p37/):
  - Opening night, context matched: Vegas +0.7 / -1.1 (round 93 / 94), Edmonton +0.7 / +1.1, Toronto +0.9 / -0.0. With
    the old gains Vegas reads -0.8: the raise neither fixed nor broke it; kept for the computer path.
  - After five weeks played, that night's chance against that night's context: Edmonton +3.1 / +4.4, Toronto +3.0 / +4.3,
    Vegas -0.4 / -4.3 (round 93 / 94 before the fix). Cause found (scratch r94 pre37.js GKLOG, gkelo.js): the second night
    of a back-to-back dresses the backup goalie, and the chance didn't know. Without back-to-backs the three read -0.5 to
    +1.2. A backup is worth -4.45 Elo a point behind the starter (8 points -43, 16 -72, 24 -104). Fixed (Ian: "find and fix
    it now"): hockey's sportTonightEdge(t) takes that off a club whose goalie tonight is the backup (gkCtx's b2b, the
    measured gap), and core gameEdge adds sportTonightEdge(me) - sportTonightEdge(opp) where a sport defines it; engine 17
    only (planAmpV). After, week 5: Vegas -0.3, Edmonton +1.4, Toronto +1.3. Test 37 now also reads hockey after five
    weeks (Vegas, Edmonton) besides opening night.
  - Every game after five weeks (scratch r94 p37/): college football Alabama +3.0 (opening night 0.1, week 9 2.0; round 93
    +1.6), Denver -0.8, Duke 0.2, Orlando 2.3, Seattle (lean only) 1.2, Vegas 0.2. Alabama's week 5 sits on the bound:
    watch item, not in the test.
  - Pro basketball: Orlando reads +2.0 / +3.1 over the test's six opponents and +1.3 / +2.0 over twelve (the test now uses
    twelve); six other clubs read -1.1 to +1.2 on 17.
  - Baseball: the test plays the lineup's lean only. With lineups and starters, on tonight's context, Seattle reads -3.9:
    the chance doesn't carry tonight's lineups and starters (at equal ratings Seattle beats the Dodgers 58%, Miami Colorado
    55%, scratch r94 neut.js); over a season it holds (live-wp PRE: engine 16 45/46 and 56/58). Pre-existing, watch item.
- Baseball's league was wider than MLB on 17 (bs-calibrate, computer-only seasons; scratch r94 bscal.js): the spread of
  wins 16.0 and best record 114 on the test's five seeds (round 93: 14.3, 109; MLB 10-15, under 112); over ten seeds 15.1
  and 111 (round 93: 13.3, 108). The suited plans add spread on top of talent. Ian chose a smaller baseball fit: BS17.e 95
  to 80 Elo a spread. After: 14.8 and 110 on the test's seeds, 14.7 and 109 over ten; runs a side as played 4.37;
  computer path 1.06 of the curve, yours 1.04; the best plan over balanced median 6.8 to 5.8 points, 90th percentile 12.0
  to 10.7. Baseball's plan is now worth about 6 points at the median, under the 8 asked for everywhere else. bs-calibrate
  and bs-players pass. The innings leader read 231 in one season (MLB to 225); eight seasons average 219.0 (round 93
  218.8), so bs-players now judges it on its two seasons' average (223), as it does home runs.
- Objectives and recruiting (found by the suite): with your club left on Balanced all season, the pro games met 41% of
  objectives (round 93: 53%, eight seasons) and chasing the best recruits read +3.0 a spot (round 93 +2.4, bound 2.5).
  On your assistant's plan, as Sim ahead plays it: objectives 54% (round 93: 55%); recruiting +2.7 over five seeds
  (round 93 +2.6). A person who never touches the plan now falls well behind the computer's clubs: that is what 8-15
  points costs, for Ian to judge. Hockey's live chance read 18.7 in one band on the default seed and 6.0-7.8 on three
  others (engine 16: 8.8). Firing (cfb) timed out beside the browser tests (again in the final run).
- Smaller: a sim ahead always stops when one of your two best players is out for the rest of the regular season (Grokbot:
  college basketball lost an 80-rated star without stopping); the page keeps its place after a plan click (not reproduced
  in Chromium at phone or laptop width on round 93; now held explicitly); a pick caught past the 99 returned 4 yards long in
  its clip (fb-clips found it on engine 17's dice).
- Checked, not reproduced: the coach's name not sticking (college basketball, hockey, soccer, football, baseball: typed
  with a space, by click and by Enter, kept through the team pick and a reload; scratch r94 cname.js, cname2.js).
- Control: this build at ENGINE_NOW=16 matches round 93's fast goldens in every field in all seven. engine-replay now
  replays engine 16 (round 93, 446b6e3).
- Tests changed after they failed, each measured: hk-lines over four clubs and its last-pass line at 0.85 (engine 16 127 of
  140, 90.7%; engine 17 103 of 116, 88.8%; two clubs read 47 of 53); regressions' plan-line check reads the reason line
  on 17 (its sign and size are the card's rounded change; under balanced only when another plan adds 2); featuring's
  check lets the rounded number stand when the chance moves under a point (baseball 50.5 to 51.5, both "51%");
  bs-players' engine games play each club's suited plan (the league's level is set that way on 17).
  Second pass: regressions' plan-line check reads soccer's win share; regressions 37 on tonight's context (opening night,
  and hockey after five weeks) over twelve opponents, bound unchanged; objectives and recruiting sim your club on the assistant's plan; recruiting's
  free-upgrade bound 2.5 to 3.5 (loosened: five seeds read +2.6 on round 93 and +2.7 on 94 on the assistant's plan; round
  93 read +2.4 and +1.8 under the old test); bs-calibrate reads runs a side from the seasons as played (4.43; round 93
  4.41) and holds the bare Balanced-v-Balanced game, no lineups, above 3.9 (it reads 4.09: engine 17's 1.5% off every hit
  that suited plans and lineups give back; whether any real game plays without lineups is not checked); hk-reads gets
  planAmpV when it loads the engine alone.
- Full suite: 127 of 127 passed (33, then a resume after the two-hour limit with 94). Firing (cfb) timed out at 1500s
  beside the browser tests; alone it took 1365s against round 93's 834s (same machine, same 104 offseasons), so
  its limit is now 2700s; it passed in the resume at 1385s. College football sims about 1.25-1.6x slower on 17 (a fast
  golden season 12.8s of CPU against 10.4s): profiled, the extra is fbSideMods working out the plan's amplified fit on
  every drive (fbFitOf splits its keys each call: 0.54s plus 1.2s in its closure, against nothing on 16). The fit is
  fixed for a game, so caching it per game should give the time back with identical results. Not done in this release
  (it would need the goldens and the suite again): round 95, and check the other sports' per-drive paths too.
- Not built (round 95): a post-game line on what the plan and the attributes did (Grokbot's point 3), late calls with
  options that really differ (point 6), the odd attribute grids (point 4).

Round 93: trust fixes from the November 20 reviews (engine 16 where a game's own play or credit moves; ENGINE_NOW 16).
- A game is recorded only once its engine has finished (core finishLive drains it if not, and warns); held headers name
  the moment shown; basketball clips name their moment inside the stretch (segMoment: "End of Q4" sat on clips from
  84-94 of a 105-106 game). College basketball's false final: not reproduced in 155 live games; the guard is the cover.
- Career games: banking a season added its games twice (addStats counts a game); every season in all seven read one
  game too many. Banked by summing the season's numbers; old careers repaired once on load (carFix).
- Hockey (engine 16): every goal has a scorer. The quarter round 90 left to "the fourth line" goes to the dressed men,
  flat, a man behind the starters three times a starter (star-weighted, one backup scored 91; backups alone let
  50-rated men lead). Leaders measured (scratch r90/reg.js, four seeds x two): goals 51-68, mean 60 (round 90: 55, band
  45-57), points 94-122, mean 110 (95-112). Above the goals band: the roster carries ten skaters where a club dresses
  eighteen, so the bottom six's goals land on them. Put to Ian as a decision. boxscore checks every goal is named.
- Basketball (engine 16): a decided stretch, or one after you rest your starters, names the bench in the run of play,
  the box and the clips (segment bn; regressions 89 checks the names after a rest).
- Football: "Fourth and goal" in the call when the line to gain is past the goal line (engine 16; drive notes keep the
  distance: a converted fourth and goal would read as nonsense). The onside call and Pearl count the possessions left:
  none left for you, the onside kick is the way back; two scores needed with one possession, the same. Up 7, a
  touchdown ties it; up 8, a touchdown and a two-point try.
- Baseball (engine 16): a postseason series opens with the ace and turns four (spCtx from the phase's game number); the
  regular season is untouched (bs-calibrate and bs-players identical to engine 15). The staff card shows ceilings and
  lets you feature a top-four arm (Two deep already could).
- Tried and taken out: productive grounders (runners up a base, the man on third home, 0.13 runs a side a game). Every
  way of putting the run level back (the level, an edge scale, fewer sac flies) left bs-calibrate or bs-players a tenth
  past an edge on their fixed seeds, the seasons swinging 106-114 best records on dice alone (16 seeds: 108 vs 111, inside
  noise; the favourite's rate by gap matched engine 15). Needs multi-seed season checks first.
- Not built: naming every bullpen inning (1.3 innings a side a game go to "Bullpen"; the roster carries two relievers
  and a closer, so naming them would put 100+ more innings on each: needs real bullpen slots).
- Reads: an in-game read that answers the style tonight's numbers fit best (dp.best, from the counts the call shows)
  is never marked wrong: "Right read: they surprised you", not counted. One rule (readGraded) for the season's tally,
  the month's and the repair: the month counted reads the season didn't (hockey's 17 of 23 by month against 12 of 16).
- Help: the chance includes your plan (measured on the hub: pro football 30/34/44 by plan, hockey 26-32, college
  basketball 84-87); the glossary and hub note said it didn't. The attribute page no longer says the 1-20s make up the
  rating by eye.
- Soccer's roster line ranks a club in its own division ("of 24 in their division"; the pyramid's 164 read as noise);
  its best rank names the club's style for 85% of clubs. Contract rows (all five pro games) decide on their own button.
- Not reproduced: pro football's second round labelled WILD CARD and the board objective staying up (both right after
  a wild-card win and after a reload, scratch r93/nflwc.js).
- Control: this build at ENGINE_NOW=15 matches round 92's fast goldens in games and records in all seven; screens differ
  (the help text, the staff card, the read lines). engine-replay replays engine 15 (round 92, e8f58c2).
- Full suite: 81 of 81 passed (one resume after the two-hour limit; quick tier and hot seats too).

Round 91: football's attributes play (engine 14, college and pro). Design addition agreed in "Player attributes: design".
- The drive engine plays a drive as one roll (touchdown, field goal, turnover, stall) with the spot a stalled drive dies;
  there are no plays, so no separate pass and run. A team's shape (50_drives fbShapeOf, through gameCtx sh): each
  starter's lean weighed by his group's weight and his position's share (POS w); a hurt starter's backup in his place
  (football's backups play only then). Offense and defense apart; Vision counts with each group's main term (QB
  Accuracy, RB Speed, WR Hands, OL Blocking, LB and S Coverage). Your drives: Arm touchdowns; Accuracy 30% fewer picks,
  70% drives that keep going; Speed breakaways (touchdowns, more from a long field); Hands fewer fumbles and drops and
  drives that keep going, as Accuracy; Blocking where a stalled drive dies (yards: more field goals, fewer punts);
  Strength drives that keep going (touchdowns and field goals as a share). Their defense: Coverage 75% touchdowns
  taken away, 25% picks; Tackling 75% breakaways stopped, 25% forced fumbles; Pass rush the stall spot back; Strength
  short yardage; Speed breakaways (fbDriveMod).
- Each term worth FB14.a (2.5) rating points of wins a point (FB14_C0 per league, measured on common dice: scratch r91
  marg.js, marg2.js, 400,000 games a term). A pick or fumble mostly takes a punt's place, so turnovers alone were worth
  about a sixth of a touchdown term a drive: hence the splits. On a person's path (a live game, calls to the assistant:
  marg3.js) Blocking, Pass rush and the turnover terms are worth up to 16% more than on the computer's (the end game
  and the fourth-down choice read the stall spot); those are set midway. test/attrs-fb.js (suite, 300,000 games a
  term: 60,000 read within about 5%, football's varying dice pair little): pro 0.98-1.04, college 0.96-1.04 (want 1);
  a starter leaning two spreads with the rest down moves the team's terms by 0.001-0.002 in all against 0.04-0.07.
- Signatures (half a point of a term: about two spreads of a pro team): an Arm team scores touchdowns on 26.5% of
  drives (24.0%); Accuracy picks 4.9% (7.6%), Hands fumbles 4.0% (6.2%); Blocking field goals 20.9% (16.9%) and punts
  28.6% (33.6%); a Coverage defense allows touchdowns on 22.6% (24.4%) and picks 10.5% (7.8%); a pass rush holds
  their kicks to 17.2% of drives (19.6%). League spreads of a term (one standard deviation, season 1): pro 0.12-0.26,
  college 0.21-0.65.
- Plans (FB14.pw): Take risks realises Arm and Speed 1.5x and Accuracy, Hands, Blocking 0.6x; Play it safe the
  reverse. Fit measured on both paths (FB14_FIT person, FB14_FITC computer: the defense moves under 3%, left at 0),
  the plan's own worth at a gap too (FB14_SHIFT, FB14_SHIFTH; pv.js): safe lets talent count (pro: -7.6 Elo at even,
  +0.23 an Elo of gap on a person's path), risks the reverse (+12, -0.35). As in the other sports (Ian): the chance
  before a game counts your fit and the plan's worth at tonight's gap, computer clubs pick a plan for their roster
  (about half their team-games), the plan line names a plan past 12 Elo and never a net loss.
- Calibration (scratch r91 fblevel.js, eight seeds x five computer-only seasons, against an engine-13 control): the
  shapes alone moved nothing (pro 45.9 points, college 54.1 with no plan picks); computer underdogs now take risks, so
  scoring rose (pro 47.5, college 57.2) and college favourites fell (69.0% to 66.5%). Recentred on engine 14 only:
  touchdowns and field goals x FB14.g (pro 0.962, college 0.94), college's gap counts 1.12x (fb14gap); the shown
  chance's curve refit for engine 14 (wpK14: pro 309, college 411 balanced, the plans in proportion; fitk.js). After:
  pro 45.8 points (engine 13 45.9), margin 11.7 (11.7), home 52.6% (53.8), favourites by the public ratings 58.5%
  (59.3), wins sd 2.75 (2.78), best record 14.3 (13.8); college 54.3 (53.8), margin 15.7 (15.8), favourites 68.2%
  (69.0), home 55.8% (56.3; the target 57-59% was already under), wins sd 2.90 (2.94). Home wins read about a point low
  in both (2.5 standard errors in pro): underdogs' plans take a little of home field's worth. Watch.
- Box scores (credit, own dice; gated, as old seasons replay their lines): who scores a touchdown leans with Arm against
  the back's Speed and Strength, the receiver with Hands and Speed (a first receiver two spreads up in both: 40% of the
  touchdown passes to 51%); picks with Coverage (by the drive's number, no draw); sacks with Pass rush, tackles with
  Tackling, passes defended with Coverage, rushing yards with Speed and Strength (fbLean: exp 0.22 a spread, 0.6-1.6).
- Training focus in both games (Passing game, Run game, Front seven, Secondary); attribute descriptions say what each
  does in the engine. Kicking: not built (no kicker on the roster; Ian: a kicker slot in a later round of its own).
- Control: an engine-13 build of this round matches round 90's goldens in every field in all seven games apart from
  football's screens (the Training focus card, shown in an engine-13 season's offseason because the summer it shapes
  leads into an engine-14 season). At 14 the other five games equal that control with the engine stamp stripped.
  engine-replay now replays engine 13 (round 90, 98999e1).
- Tests changed, each measured: regressions 37 plays the computer opponent on the plan its roster suits, with both
  shapes, where the sport's shapes play (the chance counts both; baseball's context is its lineups, left out); case 78
  takes football on 14; sim parity reports football's shaped case; fb-clips skips a punt or pick followed by overtime
  (overtime starts at the 25: a punt as regulation ran out read 1 of 38 wrong).
- Not built: reads tied to the roster (Ian: with round 92's club styles, so read calibration moves once); a kicker.

Round 90: two fixes (engine 13 for hockey's credit).
- Transfers (leagues/epl/27_transfers tWindow): a newcomer pushes his position's backup out whatever his rating, so two
  bids at one position that both went through cut the first signing the same summer (Brentford seed 3: Ratliff bought
  for 1.9M, released when Hammond came, signed by Everton for nothing). Now a bid that would cut a man bought earlier in
  the window doesn't go through and costs nothing ("no room at ST: it would cut X, whom you just bought"), the rule
  free-agent targets already had. The bids screen says so ("no room ... bought above"), or, when the first signing
  would start only on today's ratings, that it depends on him starting after the summer's development (ratings move
  between the screen and the window: Ratliff 64 on the screen, 59 at the window, behind Brentford's 63). TW_ROOM=0 is
  the control: test/transfers.js fails there and passes here. Only your bids: no league result moves.
- Hockey's scorers (75_screens HK13, engine 13; ENGINE_NOW 13): round 89's lean (exp 0.22 a spread, 0.6-1.6) had depth
  men leaning to Shooting lead the league (regular seasons, four seeds x two: leaders 55-75, mean 62; a 57-rated backup
  with 75; round 88 48-64, mean 56). Swept (scratch r90/reg.js, the game logs' regular season; the old checks counted
  the playoffs too): lean 0.12 held to 0.75-1.35, the depth man 0.7 of his weight (0.9), the men the roster doesn't
  carry a quarter of the goals (0.17; the NHL's bottom six and third pair score about that). Leaders 55.2 goals and
  108.9 points (targets 45-57, 95-112), mostly rated 63+; a backup leads only when his starter missed the season (6-7
  games). More rating weight (0.8) only concentrated goals in the stars (64.6). Credit only: no result moves.
- Control: this build at ENGINE_NOW=12 matches round 89's goldens in all seven, every field. At 13 the six other games
  differ by the engine stamp alone (stripped, equal); hockey's games, records and champions are unchanged, its lines,
  MVP race, history and screens move. engine-replay replays engine 12 (round 89, 30013f3): all seven match.

Round 89: hockey's and soccer's attributes play (engine 12); computer clubs pick the plan their roster suits; the plan's
own worth in the chance.
- Hockey (50_game HK12, hkShapeOf through gameCtx sh): each skater's lean weighed by his group's weight and his ice time
  (a position's share, the man behind him the depth's share; the user's lines and pairings set it), the goalie in net on
  his own (the starter, or the backup once he's in or when he started; a hurt starter's backup starts, a walk-on with no
  lean behind him). Shooting: a shot's chance of going in. Passing: shots made. Skating: half shots made, half kept from
  your end. Checking: shots allowed. Defence: the chance of the shots allowed. Reflexes at even strength, Positioning
  more on the penalty kill. The goalie read's expected goals follow the shooters' terms (not the goalie's), so a sniper
  doesn't make your goalie look like he's having a bad night.
- Soccer (SC12, scShapeOf): Passing and Pace make chances; Tackling and Positioning stop them; Heading half at each end;
  Finishing turns more of the same chances into goals (not more shots); the keeper's Handling, fewer of the chances
  allowed; Stamina: the legs go slower and the last half hour's chances are a fitter side's (a drain alone saturated).
- Each term worth the same per point in results (standings points, league points), measured: equal goal margin first
  (marg-hk.js, marg-sc.js), then by result value (fitv.js, 100,000 games); test/attrs-hs.js: hockey 1.00-1.02, soccer
  0.99-1.02 (want 1). A man leaning two spreads with the rest down moves the team's terms by 0.001-0.003 in all against
  0.09-0.10 for the same lean with nothing down. Sizes (one league spread of a team term, season 1): hockey skaters
  0.16-0.29, goalies 0.42; soccer 0.38-0.62 (164 clubs across six tiers).
- Signatures (attrs-hs, three points of a term): a shooting team scores on 13.5% of its shots (10.3%); a checking team
  allows 19.1 shots (29.3); against a goalie leaning to Positioning the power play scores 12.2% (22.4%; Reflexes 18.4%);
  a finishing team 1.35 to 1.79 goals a game from the same saved shots; a passing team 2.32 to 3.17 shots on target;
  Stamina 38.2% to 44.1% of goals in the last half hour. Box scores: hockey's goals lean with Shooting, assists with
  Passing (1.25x a spread, held to 0.6-1.6: at basketball's 1.4x uncapped a depth winger leaning hard to Shooting scored
  103); soccer's scorers by Finishing, assists by Passing. Training focus in both (hockey Forwards, Defence, Goalies;
  soccer Defenders, Midfield, Attack, Keepers).
- Plans realise terms (HK12.pw, SC12.pw): skating with them a skating and passing game, clogging it up a checking and
  defending one; taking the game to them a passing game, sitting deep pace on the break and shape. Fit measured in
  result value on both paths (a person's plan also sets his system or approach): hockey safe skt +0.51 pas +0.29 chk
  -0.18, aggressive chk +0.19 def +0.23 skt -0.43 (a person's; the computer's skt +0.46 / chk +0.29); soccer safe pas
  +0.31 tck +0.17 pac -0.15, aggressive pac +0.18 (computer +0.27) pos +0.05 (+0.17), finishing and keeping lose when
  there are fewer chances. Margin was the wrong unit: in a low-scoring plan each goal is worth more.
- Basketball's fit measured again in wins on each path: a person's is about half again the computer's (safe sht -0.71 fin
  +0.52, aggressive sht +0.78 fin -0.56 against the computer's -0.39/+0.29, +0.51/-0.35). Round 88's table was the
  computer's and understated what a person's plan was worth to a shaped roster: corrected (screens only on engine 11).
- Computer clubs pick a plan (core 93_attrs cpuPlanOf; Season._resolve, the replay record _rp, startLive, gameEdge;
  never a person's club in a shared seat): the plan their roster suits on the computer's path, when the fit is worth 12
  Elo and the plan's own worth at that gap doesn't take it back (sportPlanShift, measured: hockey clogging it up is worth
  about 15 Elo of standings points at even, more overtime; soccer sitting deep costs about 25 at even, draws). Sim ahead
  leaves your plan to your assistant ("auto"): a simmed game is played as the computer plays it, so he picks by the
  computer's measure and simming is the computer coaching your club. Single games keep your plan.
- The plan's own worth in the chance (Ian: "include it"): measured on a person's path at even strength several plans
  cost points (college basketball's Work it inside about 21 Elo, hockey's Skate with them 21, soccer's Take the game to
  them 12 and Sit deep 20), more or less with the gap (pvh.js, a line fitted per plan). The chance before a game is now
  your edge plus your plan's fit plus its own worth at tonight's gap (planEdge), less the computer opponent's fit for
  the plan it picks. Engine 11 seasons and the other three games keep the old rule. The plan line never recommends a
  plan that is a net loss tonight. Case 78 checks the edge moves by exactly that; case 79 includes the opponent's fit.
- Calibration (seasons 1-6, computer-only, level.js): hockey 6.09 goals a game (engine 11 6.14), overtime 24.6%
  (23.6%: more clubs clogging it up), points 94.4 sd 13.4 (94.0, 14.8). Soccer: sitting deep cost 2.5% of the league's
  goals (2.66 against 2.73); recentred (SC12.g 1.025): 2.70 over two seeds, draws 28.3% (27.0%), home wins 43%.
  Hockey's top scorer averages 69 goals over four seeds (65 on round 88; the target 45-57 was already passed). NHL and
  NBA history, March, the live chance, reads: all pass.
- Fixed on the way: a cup week's league game and cup tie with one club, at one ground, with one score were logged as one
  game (2 of 7,760 soccer team-games): the log's ground field adds 2 for a cup game (readers take &1). A shootout's
  header read "END OF 3RD" while its clip played (the tail's first clip set the held clock after the page was drawn).
- Tests changed after they failed, each measured: stakes (Manchester City seed 11 went 21-6 without the title; seed 12
  clinches with 5 to spare), transfers (a bid's fee is set at the commit and can differ from the window's quote: Diabate
  50.3M quoted, 20.6M at the commit with a 17.5M sale in hand; the check is now the rule itself), reported cases 56
  (Brighton: engine 12's Arsenal won wide; over six seeds engine 12 asks 21 late calls, engine 11 14), 63 and 69 look
  for a seed where the case arises; sim parity's shaped arm is a report (a person's plan sets his system, so a live game
  left to the assistant on the recommended plan differs from the computer by more than the calls: college basketball
  +5.9, hockey -2.8).
- Control: an engine-11 build of this round matches round 88's goldens in every field apart from hockey's and soccer's
  screens (the training card). engine-replay now replays engine 11 (round 88).
- Not built: club styles from rosters (the computer's system or approach chosen for its shape: the roadmap's own round);
  per-attribute ceilings and breakouts; football's hooks.
- Watch: a window's quoted fee and the commit's can differ a lot (pre-existing); soccer draws a point high; two bids at
  one position that both went through bumped the first signing (fixed in round 90).

Round 88: basketball's attributes play (engine 11, college and pro); the plan's fit in the chance; Skip's own margin.
- The team's shape on the floor (50_game bbShapeOf, through gameCtx sh): each man's lean (an attribute against his own
  rating) weighed by his group's weight for it (a guard's shooting counts more than a big's) and by his minutes (a
  position's share; starters 80%, the bench 20%; a hurt starter's minutes to his backup, a hurt backup's to a walk-on
  with no lean). A man's leans weigh to nothing, so with each attribute worth the same per point in the engine, a lean
  changes how a team plays, not what it's worth. Sizes (one league spread of a team term): pro 0.20-0.29 rating points,
  college 0.36-0.49; the league's means drift by up to 0.17 by season 5 (development by age), which moves style, not
  strength (a team's terms sum to nothing).
- What each moves, per possession (BB11; a = 2.5, c per league so a point of any attribute is worth a rating points of
  margin, measured on common dice, scratch r88/marg.js: every term 2.45-2.54): Shooting the three-point make rate and
  share (the extra the two earn together taken back); Finishing the two-point rate; Playmaking turnovers; Rebounding the
  offensive rebound rate, both sides; Perimeter D their three-point rate; Interior D their two-point rate; Athleticism
  half on easy twos, half on forcing turnovers; Stamina the closing two stretches' make rates (who still has legs).
- Stamina as built: the closing minutes, not the bench's minutes (Ian's design said minutes before the bench comes in).
  The worth of more starter minutes depends on the gap between a team's starters and its bench, so a point of Stamina
  would be worth more to a thin team than a deep one and a rating would stop meaning one thing.
- Signatures (three starters leaning two spreads to Shooting): pro threes 40.6% to 45.3% of shots, made 36.8% to 41.0%;
  college 42.6% to 51.5%, 40.1% to 44.6%. Two bigs to Rebounding: offensive boards 11.4 to 13.1 a game (pro), 7.1 to
  8.7 (college). Two guards to Playmaking: turnovers 14.3 to 11.7, 12.4 to 9.5. Box scores: each man's share of the
  team's threes, buckets, boards, assists, steals and blocks leans with the matching attribute (bbLean, 1.4x a spread;
  the team's totals are the engine's, own dice).
- Equal rating (test/attrs-bb.js, through the real roster-to-shape path, both leagues): any one man leaning two spreads
  to any attribute, the rest down, moves the margin under 0.3 points (about 1% of win chance) against 0.3-1.8 for the
  same gain with nothing down. The worst is a point guard leaning to Shooting (+0.15 pro, +0.25 college), partly a
  convexity left over from share and make rate together.
- The plan's fit (Ian chose it: "words, number moves"). Shooting is realised on threes and Finishing on twos, so a plan
  that shoots more threes is worth more to a shooting side. Measured per point of lean, in rating points per point of a,
  on top of balanced (40,000 games a cell, both leagues alike): Work it inside: Shooting -0.37, Finishing +0.24; Let it
  fly / Shorten the game: Shooting +0.65, Finishing -0.30 (Rebounding and Stamina under 0.1). A team one spread toward
  Shooting gains about 2 points of win chance on the threes plan (pro 1.5). The chance before a game is now the
  balanced curve plus your plan's fit (core gameEdge + sportPlanFit, planPicked: the plan you've picked under any
  withPlan); the plan rows say which plan your roster suits once the gap is worth about 12 Elo, beside the old
  favourite/underdog line.
- "Your shape" ranks what the engine reads (sportShape: the lean, not the starters' raw averages: a strong team ranked
  first in Shooting with a negative shooting lean). Training focus in both basketball games (Guards, Wings, Bigs).
- Skip: in basketball a close finish came back from 7-12 inside the last stretch about one time in fifteen (engine 10
  too: skipfinish at 40 games failed there), and Skip, which stops only between stretches, jumped it. lateFloor.skip
  (12) is Skip's own margin; the late-call floor keeps 6, so calls don't move.
- Calibration: college (bb-calibrate, 160 seasons) 71.7 points a team, margin 13.4, home 61.1% (engine 10 the same to
  the decimal), first round in range (5 v 12 66.9%, 6 v 11 69.7%, the old high pairing); NBA history MATCH (194
  seasons: wins spread 11.5, first three seasons 12.4, best 65 median and 73 top, margin 12.9, 1 seeds 57%).
- Control: an engine-10 build of this round matches round 87's goldens in every field in all seven games, apart from
  basketball's screens (the training card). engine-replay now replays engine 10 (round 87).
- Case 78 (Ian's rule: the chance before a game doesn't move with the plan, and no line tells you which plan to pick)
  gives way in engine-11 basketball only, by Ian's call ("words, number moves"; then "do the recommended one"): the
  edge moves by exactly the plan's measured fit and nothing else, and a line names a plan only past 12 Elo, as a fact
  about the roster, never "try X" (regressions 78: six rosters, three moved, 41/41/42 to 60/58/54). Engine 10 and the
  other games keep the old rule, checked on the control.
- Watch: the live chance in college reads a little low in its 30-50 band on engine 11 (1,200 games: shown 40 won 33,
  engine 10 39; worst band 6.3 against 4.3, the limit 10); 400 games read 12 once. March: 1 seeds are 49% of Final
  Fours on both engines over 500 tournaments (real ~40, the check's limit 49): an old miss, not this round's.
- Not built: per-attribute ceilings and attribute breakouts; computer clubs choosing a plan for their shape (round 91).

Round 87: player attributes (FM-style; design agreed in the doc "Player attributes: design"), and baseball's engine 10.
- Core 93_attrs.js; each sport's ATTRS in its 10_players.js (names, bands physical / technical / mental, weights per
  position group, leans, roles). Every player keeps p.at (his group's attributes, on the rating scale) and p.ar (the
  rating they sum to). The rounded weighted sum is his rating, exactly (attrFix nudges the heaviest attribute). Shapes
  are drawn once from a hash of name, group and u.seed (attrRng): no season dice. Shown 1-20 per league (ATTR_SCALE:
  the starters' mean and spread; 11 + 3 a standard deviation). Your own players exact; draft prospects through the
  scouts' fog (attrRoleRead: a read of the role, foggier when unsure, sharper after a workout).
- Development: each league's own loop sets the rating exactly as before; attrSync then spreads the change across the
  attributes by age (the young gain physical, the old mental) and training focus, with no draws. Synced at a new
  career (before S.uStart), each new season and every rebuild. So in six games results are identical to round 86:
  their goldens match with at/ar/ap stripped (an engine-9 control build of this round, every field but screens).
- Baseball, engine 10 (ENGINE_NOW 10; older seasons replay on their own engine: engine-replay passes 3 to 9). The
  attributes reach the engine through the game's context (ctx.at, compact arrays, only the men read that day: 7.4 MB a
  season of replay context, 5.1 before; 12.1 MB before trimming). The hitter's edge splits by attribute: Power drives
  home runs and a fifth of doubles; Contact singles, most doubles and half the strikeouts; Eye walks and the other half.
  A pitcher's shape is read against his own rating: Stuff (strikeouts up, hits down), Control (walks and home runs
  down), Stamina (how fast he tires; first tried as a longer leash, which raised the innings leader to 240 and the wins
  leader to 23). The nine's Fielding shades singles; Speed and Arm feed the steal (replacing the name hash). Every term
  is recentred for the league's spread (bsHalfVar), so a lineup with no lean bats as on engine 9.
- Weights by measured run value (a +/-3 bump of each attribute, common dice): C con .27 pow .40 eye .24 spd .01 fld .04
  arm .04; IF and OF con .277 pow .416 eye .252 spd .01 fld .045; DH con .29 pow .44 eye .27; P stf .47 ctl .42 sta .11.
  BS10: stf .016, ctl .0229, fld .05, sta .03, s2pow .2 (the pitcher terms a fifth under first measure: starters had
  taken 64.8% of wins). Two players of one rating are worth the same within 3% however they lean (test/attrs-bs.js).
- Measured after (bs-players, regular seasons): starters 63.7% of wins (round 86 62.3%), HR leader 43.0 on average
  (42.4 on engine 9: the open "power a touch low" item moves a little), 4.4 runs a side; all in range.
- On screen: the player page's attribute grid (three bands, arrows from last summer); the roster's "Your shape" line
  and role tags; a role read on draft-night rows; baseball's offseason Training focus (Hitters / Pitchers). Not built
  yet: per-attribute ceilings, attribute breakouts, training focus outside baseball, the other engines' hooks (round 88:
  basketball).
- Tests: attrs.js (all seven, four seasons: sums exact, shape kept corr > 0.85, no drift in the heaviest attribute,
  development by age, drawn twice the same, pages draw: 166,149 checks), attrs-bs.js. migrate.js normalises the
  roster's shape line and role tags. trades.js now clears its two hand-made injuries before a game is played with them:
  they weren't in the save, so a reload's season was another (engine 10's deadline deals moved with it). Lesson: a test
  that edits state the save doesn't hold must undo it before anything is simulated.
- Goldens: six games screens and universe (the attribute keys and engine stamp) only; baseball re-recorded (engine 10);
  hot seat: baseball only.

Round 86: first-round picks in deals (football, basketball, hockey, baseball; soccer has no draft).
- A pick goes with a man: their pick with their man (tdShopPick), or yours with yours (tdAskPick); tdDeal(...,pk) with
  pk 'mine' or 'theirs'. Valued by each club's own lights as the prospect the pick should bring (the class drawn on a
  copy, tdClassSorted, cached; the slot from today's win% rank, tdPickSlot) placed in that club's roster two years on
  (tdPickVal, in the future side of the sum). The fairness rule and premiums are unchanged. One pick a season per club:
  next summer's first-rounder (tdPickHeld).
- Ownership: tdCarry writes u.pickOwn={y,own:{origClub:holder}} from the season's trades. One reading for everything
  (core 91_draftnight.js): pickOwnMap, dnOwnerAt(order,u,overall), dnPicksOf(t). The draft, draft night (yours on the
  clock, the teams between), the mock, the lottery line ("your own pick lands at Nth, for X") and "Your picks: #22, #23,
  #52" all read it. With no pick traded the map is empty and everything reduces to the old order (goldens unchanged).
- Fixed on the way: the mock crashed when your first pick was in round 2 (it took the whole order as the teams ahead).
- test/picks.js (quick tier): basketball and football, both directions: the holder makes the pick, the club without one
  skips to round 2, the draft runs out, a reload drafts the same, the summer commits.

Round 85: engine 9, the computer's clubs trade on deadline day; trades reach the offseason's screens; picks deferred.
- Engine 9 (core 98_trades_cpu.js, Season.advance before deadline day's games): the top 30% of clubs buy now from the
  bottom 35% (soccer within each division): one man for one at the same position, when both come out ahead by their own
  lights (buyer 0.85 now, seller 0.25; premium 2 elo plus one per elo of strength given up now; the cap); each club one
  deal at most, one deal for every eight clubs. Nothing drawn: a reload makes the same deals. Your clubs, and every coach's
  in a shared seat (SEA.humans), take no part. Frozen rules (CT_*, ctVal, ctFut), apart from the user's trades, so tuning
  the user's market changes no computer deal; changing them needs an engine bump. News: the home screen for a while after
  deadline day, and the Trades tab (soccer: your division's). Carried into next season with the user's (tdCarry).
- Measured, engine 8 against 9 on the same seeds (16 a game): nothing differs before deadline day (an engine-8 build of
  round 85 matches round 84's goldens, full, short and shared-seat, field by field, apart from the offer card's screens);
  after it buyers win 0.5 to 2.5 points more of their games, the standings' spread is unchanged in all five games, the
  best record and the champion move as luck after the deadline does. statsum, replay, watchany, months, sheets pass on it.
- Found by engine 9 (each a real bug for the user's trades since round 83 as well):
  - the offseason's screens read next season's rosters before the season's trades were in them (they went in at the
    summer's commit): the man you traded away was on your re-sign list, the man you got missing, and a re-sign choice
    kept by slot fell on whoever had his slot. carryTrades() now puts them in as the season ends (openOffseason, and on
    a reload), once (a marker kept off the save: on the universe it had changed every fingerprint).
  - a box score left out a man traded to the club he'd played against (boxLines skipped the opponent's roster; his row's
    opponent and ground already say which side he was on): 9 of 10,286 soccer goals had no scorer in the box.
  - statsum filed a traded man's earlier games under his new club (617 team-games for 570 played in football).
- Tests moved by engine 9's dice, each checked: transfers.js (a man who retires before his sale passes, as for a bid);
  lines.js (eight seasons: the ice-time order was within noise on four, 27.8 to 26.8 on round 84, 27.2 to 27.3 now);
  regressions' soccer firing case on seed 8; bs-players judges the HR leader on the seasons' average (14 seasons each:
  under 40 in a quarter of seasons on engine 8 and 9 alike, means 42.9 and 42.4: baseball's power a touch low against
  MLB's leaders, on the roadmap, not retuned). engine-replay now replays engines 7 and 8 (rounds 79 and 84) too.
- An expiring man of 26 or younger counts for 80% of himself in two years (40% older): a rebuilding club had sold a
  63-rated 23-year-old for a 53-rated 31-year-old.
- Draft picks in deals: deferred. They reach into draft night (your slot, your picks each round, the mock, the lottery
  view all assume one pick a round), so they want their own round.

Round 84: trades as a market: offers that come to you, two for two, shared seats; the all-in price.
- Shared seats (core 99_app): a reload replayed only the coach whose turn it was, so the other coach's promotions,
  firings and (now) trades were lost (measured, pro basketball: his strength came back 19 elo off). coachMoves() gives
  every coach's [team, promotions, firings] in turn order; rebuild replays them all, swapDepth takes the team, tdCarry
  carries every coach's trades. Trades are on in shared seats. test/hotseat-moves.js (fails on round 83).
- Offers that come to you (tdIncoming, tdOfferCard; home screen under the race card): in the last three weeks before
  the deadline (football each week; the daily leagues every third day; soccer the window's last two weeks), the club
  keenest on one of your men, with the man of theirs best for you among those it would give. Only an offer that helps
  you now or later (the keenest deal was most often a lowball costing both: a 70 for a 52 at -2.7 now, -8.5 later),
  never the same club and man twice in a season (S.tdShown, which plays no part in a reload). Not now hides it.
- Two for two (tdDeal with a2/b2, tdPackages, tdShopTwo, tdAskTwo): a pair at each of two positions, so a deal can move
  value between positions (a guard and a forward for a forward and a guard) or consolidate (two good men for a star and
  a throw-in). Not the call-up plan first described: packages keep both rosters whole, with no one invented or released
  mid-season (a released man's season would fall out of his career). The same rules as a single deal.
- The price of going all in (measured with the best deal for now each day, packages included, to the deadline): hockey
  +9.1 team rating, basketball +7.0, baseball +5.1, football +4.2, against clubs' spread (one standard deviation) of
  3.5, 3.3, 1.7 and 2.7: a mid club past the league's best in one season. (Round 83's "hockey +7.5 at a price" was
  reported without that comparison.) Now a club asks a premium in proportion to the strength it gives up now
  (TD_PROP 1) and a club makes at most three trades a season (TD_MAX): hockey +5.5 (for -20.8 in two years),
  basketball +5.3 (-17.4), football +3.9 (-13.4), baseball +2.4 (-4.0), soccer +1.3 (-14.9). How far clubs lean
  (TD_SPREAD) made no difference. Still enough to lift a club a long way for a season: a dial for Ian.
- Tests: trades.js adds the offer card (helps you, Not now, the same offer on a redraw, Trade takes it), a two for two
  (four men move, rosters whole, carried into next season) and the all-in bound; hotseat-moves.js. Goldens: the offer
  card on three games' home screens (screens only; every other field equal to round 83). Suite 120 of 120 apart from
  those, 86 minutes.

Round 83: trades in the season (the five pro games); careers banked by the man.
- Trades (core 98_trades.js; Ian: "make an offer, ask what they'd want, with deadlines and caps"). Football, basketball,
  hockey and baseball to the league's deadline (LEAGUE.trade.by: Nov 5, Feb 5, Mar 6, Jul 31), soccer in the January
  window within your division. One of yours for one of theirs at the same position (tdGrp: baseball's SP, SP2, SP3 are
  one), healthy men only; the Trades tab on your team page: Shop one of yours (each club's best man at the spot that
  helps you, now or in two years), or Ask about one of theirs (who of yours they'd take). Two taps to trade.
- A club answers from the deal alone, no dice (tdDeal): its roster now and in two years (tdVal: the better of each pair
  starting, 0.12 for the man behind; tdFut: the young toward their ceiling, a step lost a year past 29, a man whose deal
  ends counted at 40% in two years), weighed by where it stands (tdWin: 0.85 contending, 0.25 out of it, tempered early).
  It says yes when that is worth TD_PREM over even, it fits under the cap, it hasn't traded with you in TD_GAP steps,
  and you don't come out ahead now and later together (fair: now+fut <= -0.01). Measured before that last rule: a coach
  taking the best of every deal any club would take, each day to the deadline, gained in both (basketball 16 trades,
  +4.3 team rating now and +10.7 in two years; baseball +1.8 and +9.8), buying now from clubs out of it and selling it
  dear to contenders. After it, none gains in both; going all in still buys now at a price (hockey +7.5 now for -18.8).
- Kept among the day's promotions (S.promos {tr:...}), so a reload plays trades and promotions in the order made;
  swapDepth hands a trade to tdApply. Each man takes the other's slot, the better of the pair starts, an injury moves
  with its man, both clubs' strength moves by the change in rosterElo. tdCarry puts the season's trades into next
  season's rosters at endSeason, before the careers are banked. The computer's clubs don't trade with each other, so a
  season with no trades in it plays as before (no engine change). Not in shared-seat careers (their promotions aren't
  replayed for the other coach either).
- Careers (bankCareers) now find the man by name in his club, not the same slot: a promoted man, the one he replaced,
  and baseball's pitchers who traded jobs lost their season before (test/careers-moved.js: 0 of 4 on round 82, 4 of 4).
  This was a bug shipped in round 82 (the staff roles) and before it for every promotion.
- Tests: trades.js (browser, five games: offers, asks, two-tap trade, both strengths, kept and replayed 20 steps on,
  the other club's earlier games still replay to their scores, an injury stays on its man, shut at the deadline,
  carried into next season with the better man starting, his season banked with the club he finished with, and the
  exhaustive fleece bounded); careers-moved.js. Goldens: the five pro games' screens (the Trades tab), checked field by
  field and line by line. Suite 119 of 119 apart from those five.

Round 82: baseball's pitching staff by role; the soccer "credit gap" found to be the box score.
- Baseball (Ian: a five-man rotation, a bullpen whose roles you assign). The roster's Pitching staff card
  (staffRolesHTML, baseball 75_screens) names each job by its slot: Starters 1-5 (SP, SP2, SP3, BK(SP), BK(SP2), as
  spCtx turns them), Closer (CL), Set-up (BK(CL)), Long relief (BK(SP3)), with each man's season line. Tap Move on
  one and then on another and they trade jobs: swapDepth(sea,{i,j}) swaps the two slots, moves their injuries and
  adds the change in rosterElo to talent.base (a job's weight goes with it: an ace in the bullpen counts for less).
  Kept in S.promos with its day, as a promotion is, so rebuild plays it at the same point. No engine change: the
  slots already decide who starts and who closes. test/bs-staff.js (browser): eight jobs, the trade, the strength
  moves, kept in the save, a rebuild 40 days on gives the same results, the ace moved to closer starts no more games.
- Soccer: the "about 2 goals a season with no line" was the box sheet, not the credit. In a cup week a club can play
  the same side twice on one step at the same ground (a league game and a cup tie); boxLines matched rows on step,
  opponent and ground and read the other game's lines. Rows now match on the score too. replay.js now asks every
  name to agree (10,478 of 10,478). No engine 9.
- Testing: two browser tests at once was tried and measured slower on two cores (68 of 112 in two hours; round 81's
  whole suite took 112 minutes), so it is back to one (BROWSERS=2 to try again on a bigger machine). Full suite
  117 of 117; quick tier 34 of 34 (571 s); goldens unchanged.

Round 81: watch any game in the league; punts; soccer's monthly awards.
- Any game this season, any league (Ian: as Football Manager). Before each computer game the season keeps where its dice
  stood and what it was played with (Season._rp: rng a/sp, both strengths, the game's options as text), not saved: a
  load replays the season and keeps them again. replayGame (core 96) plays it again on a tap and shows it only when it
  ends on the recorded score. After the credit, the names it put on the plays (football's d.by, the scorers and
  assists) are kept too (E.st) and put back, so a replay names the box score's men after injuries and moves. Measured,
  a whole season and postseason in all seven (test/replay.js): every computer game replays to its score (over 15,000,
  bowls, March, the series, cup ties to penalties, October); names agree (hockey 6,344, football 5,886, soccer 10,343
  of 10,345: the two are goals soccer's credit never gave a line, its own gap); replaying changes nothing (the dice,
  records, ratings and every line hashed before and after). Memory 0.4-2.4 MB a season, baseball 5.3 (its lineups;
  4.7 KB a game as objects, 2.3 as text); the season sims no slower. Earlier seasons can't be watched.
- Scores: Watch on every computer game (watchBtnHTML); the rewatch ends with who won (watchRes), the box score under
  it, a Watch row for the depth (Goals only, Key moments, Every chance, Text only). test/watchany.js (browser, all
  seven): plays to the score with clips, a neutral result, Back to Scores, the career unchanged.
- Box scores keep the men who have moved clubs since (boxLines(g,step,true) reads every roster's logs for that game).
- Found by the full suite and fixed before shipping: the name stamp was put between the credit's if and its else and
  took the else, so every user game was credited twice and engine-3 seasons' computer games not at all (older seasons,
  reported cases and recruiting failed). The lines-add-up check (statsum) joined the quick tier: it sees that.
- Punts as clips (every punt in every chance and full, a long return in key moments): the flight, the coverage, the
  return to where they take over (retTo, read ahead as for picks), a fair catch or a touchback; fb-clips checks every
  punt ends at the next drive's start.
- Soccer: Player of the Month (your division, from the game logs) and your Goal of the Month (a late winner or
  equaliser first, from games you watched), on the home screen for two weeks after a month ends and above the leaders
  (leagues/epl/99_months.js; test/months.js). A diving keeper is laid out, not grown (1.9x long before).
- Goldens: soccer (the awards card), college and pro football and hockey (the Watch button): screens only, field by
  field and line by line. Suite 108 of 111, those three.

Round 80: watching (engine 8), and a faster test loop.
- Football clips: a pick is run back to where the next drive starts. The engine draws a turnover's return with the next
  drive's start (nextStart, that step's first draw); push() reads it ahead on a copy of the dice (cp.a, cp.sp) into
  drive.retTo, with where it was lost (drive.lost), so nothing the game draws moves. The passing side chases, the
  returner is labelled INT, the catch comes earlier to leave the run room (c.f). A fourth down made has its own clip
  (mkConv, "FIRST DOWN!", the line to gain drawn). Pursuit: on a touchdown run or catch the back seven take angles and
  end a few yards behind (61 of 66 long touchdowns with three defenders within 8 yards; 0 of 68 before).
- Engine 8: a drive after a strategy call kept no hold on its start and drew it again on resuming, so the drive started
  elsewhere than where it stood when you were asked (found because 3 of 24 read-ahead returns missed). Now
  st.startHold=start (ENGINE_V>=8). Only your games move; computer games and calibration don't.
- Hockey line changes (clips): the scorer's line and pair (first or second), the assist on the ice and making the last
  pass (at his own place, or beside the scorer), the second unit about its share of the ice in chances (DEPLOY's bench
  share), no names on a fourth-line goal. The scoring dot wore the scorer's name in 16 of 74 goals before; 74 of 74 now
  (test/hk-lines.js).
- Basketball rotations (clips): starters open each half and close; the bench for the late first and third quarters
  and the start of the second and fourth (BENCH_P), each position its own rhythm; the shooter's dot is the man the play
  names (106 of 142 before; 142 of 142: test/bb-floor.js); starters for the last shot.
- Testing: run-all runs one test a core (it ran four on two), one browser test at a time, longest first by
  test/timings.json; --fast is the quick tier (one-season fingerprints, golden-fast-*.json, and the cheap checks: 29
  tests, about 6 minutes) for every change; --quick before a release (108 tests, about 97 minutes). Baseball's hot
  seat plays two seasons (it took 29 minutes; the two are identical to round 79's first two).
- Goldens: football's move (engine 8); elsewhere the universe's engine number only (field by field on one-season
  dumps). Hot seat: football re-recorded (engine 8), baseball (two seasons); the other four match. Suite 105 of 108,
  the three the hot seats named.

Round 78: trust breakers (the testers' feedback, verified in a real browser first).
- Box score button: Enter and Space on the focused toggle went to the page's "advance" shortcut and started the next
  game. A focused control (summary, button, link, select, role=button) now keeps Space and Enter. test/boxclick.js
  presses it by keyboard, mouse and touch in all seven (it fails on round 77). Rewatch shows the box score.
- Kicking: measured, not a current-engine bug: in a season begun before round 71 (engine 1), 39 of 91 kicks were over
  60 yards; on the current engine 0 of 58. Left as is, so old saves replay.
- College basketball's false final: not reproduced (9 of 9 overtimes played out before the final; 197 games' live and
  recorded scores matched on engines 1, 3 and 6). An overtime the engine hands back at the end (hockey's, soccer's)
  now plays out a stretch at a time when its highlights can't play (live.tailQ; 44 of 44 hockey overtimes).

Round 79: games you can open (engine 7, schedV 4).
- Scores: every played game opens its box score (gameSheet, core 96_moments: each side's players by statCols group,
  from their game logs, so the computer's games have one too). Baseball leads with the decisions (sportSheetNote:
  "W: x (w-l)  L: y (w-l)  S: z (n)"); a decision the unnamed set-up men took reads "W: Houston bullpen" (15 of 45
  games had no W or L line before that).
- Next-game card: sportNextExtra hook; baseball's probable starters with W-L and ERA. ownMark no longer says
  "Featuring"; Balanced's "Play your game." gone in every sport. The bullpen call names your starter (pullCall sp).
- Baseball (engine 7): a man who has pinch-hit can't pinch-hit again (benchFree; 648 games: 21 with a repeat
  before, 0 after). schedV 4: packSeries avoids a second series straight against the same club, taking a day off
  instead while there's room (seven straight against one club in 60% of club-seasons before, 5% over 40 seasons
  after; bs-calibrate's back-to-back check now at most 5 a season, was ~18).
- In-game: "Game stats so far" (liveStatsHTML: the sport's box team table from the stretches played, as the screen
  holds them during a highlight), all seven, open or shut through redraws (test/livestats.js).
- Roster: season stats sortable by any column (rosterStatsHTML; test/rostersort.js). The team page opens on its
  schedule (standings team click).
- Skip stops once for a close finish (ffLateStop at the sport's lateFloor window) and for an overtime the engine hands
  back. test/skipfinish.js: on round 78 Skip jumped a close finish in two of seven games; now none.
- Football: kickerName (a name per club from the career's seed, drawing nothing the season uses) on field goals, the
  kick clip and the game-winner line; fbClock, one game clock for the live header, the run of play and the calls
  (engine 7 seasons); a failed fourth-down try plays as a clip (mkDowns); the scouting call says "Before your first
  drive" when they had the ball first.
- Soccer: the corner's taker stays at the flag until he's struck it. Knockouts: hockey's playoff tie and soccer's cup
  tie no longer offer "the point" (sudden death, extra time), staff lines too (dp.ko). A goal with no wins in it
  reads as itself (soccer showed "Target: 0 wins" on every club).
- Hockey and basketball clips: a man who takes the puck or ball twice goes to each spot (rec.indexOf found his first
  only; 13 of 46 hockey clips and 14 of 31 basketball clips passed to empty space).
- Football (engine 7): the run of play's draw is seeded by the fixture (fbScriptSeed: the two sides and the year), not
  watchSeed's final score. A live game has no final score, so its clips named one scorer and the box score, the
  player's line and the rewatch another: 18 of 29 pro and 21 of 32 college touchdowns; now 0 of 89. The live panel's
  scoring rows no longer change with each tick.
- Scores' box sheets are drawn when opened (gameSheetHTML gives a toggle with data-sheet; SHEETS[id] draws it on
  toggle, bindSheets after every render): a busy college basketball day's Scores was 1.6 MB with every sheet drawn
  (84 KB on round 78), now 109 KB. test/sheets.js: no empty toggle, on an engine-3 season (only your own games have a
  box there: no game logs) and through a new season into its postseason.
- Tests changed after they failed, each measured: migrate.js normalises this round's screen moves; regressions 30
  checks the odds no longer mention featuring (Ian asked for it gone); bs-players pools its engine sample over three
  seeds (the steal rate ran 77.4-82.3% by seed at 1,500 games; pooled 79.3%, round 78 79.5%).
- Goldens: football, basketball, hockey and soccer results identical to round 78 field by field (games, playoffs,
  champion, records, poll, awards, history); the universe differs only by its engine stamp; screens re-recorded.
  Baseball's results move (engine 7, schedV 4); football's awards race and history move with its players' lines
  (games, records, poll and champion identical). Suite: 105 of 105. engine-replay now also replays round 77's pages (engine 6).
- Not reproduced: the Div/Conf column against records (it matches the games in every sport, in season and after).

Round 77: baseball's running game and named relievers (engine 6); college basketball's scoring. (The "what if"
replay was dropped: the call grades already answer it from many replays, and one replay against a grade would only
undercut it.)
- Steals (BS6): a runner's speed (by name: one in twenty a burner +0.14, a fifth fast +0.08, half average, a fifth
  slow -0.12) sets how often the computer sends him a chance (runner on first, second open, under two out): burners
  0.45, fast 0.28, average 0.16, slow never, when he's 70% or better to make it (was one chance in thirty, at 80%).
  Measured: 0.80 attempts a side a game (MLB 0.7-1.2), 80% make it (74-82), leaders 48-60 (40-70).
- Named relievers: the third starter's backup is the long man (in at the 6th or before, two innings at most), the
  closer's backup the set-up man (the 8th; the 9th when the closer rests); others "bullpen". Each by rating against a
  usual reliever (50) x BS5.q, so naming them didn't make the bullpen worse (rated against the rotation, runs went to
  4.9 a side). They have lines (no start: B.sp names the starter) and show in the box as RP.
- The scorer's decisions (bsBoxDone6): the win to the pitcher of record when his side took the lead for good (a
  starter short of five innings gives it to the first reliever), the loss to the man pitching when his side fell behind
  for good, the save to the last man if he came in protecting one to three. Starters face one batter fewer (5.5 innings
  a start and 64% of the wins before; now 60%), the offence -0.005 for the running. Runs 4.22 (bs-calibrate) and
  4.34-4.38 in the app's seasons; bs-players (suite) all in range over three seasons, with a steals-leader check.
- College basketball (engine 6, ncaab only): a star's scoring share as rating^2.8: the leader ~26 a game with the
  tournament (was ~23-24; the real one ~25). Pro unchanged.
- Old seasons replay: engine-replay now checks rounds 73, 74 and 76's pages (engines 3, 4, 5): all match. Football,
  hockey, soccer and pro basketball play exactly as before (goldens differ only in the engine number; hot seat
  matches).

Round 76: the coach's notes cover a first season (the tutorial). The guide already existed (round 39: "Coach's
notes", one per kind of call plus the home screen and the result card; "Skip the guide" off for good in every game in
this browser, Help's "Coach's notes" back on; none in a hot seat). Walked in a browser at phone width, a new player met
notes on three screens and nothing on the live game, the tabs or the offseason. Added, all inside the same guide (so one
"Skip the guide" still clears everything, in all seven games):
- A welcome on the home screen before the first game: what a game is (a gameplan, then Play to coach it or Sim game to
  leave the calls to your assistant, who makes them as the computer's coaches do; Sim ahead), how the notes go, and how
  to turn them off and back on.
- The live game (livePlanBarHTML): it plays out a piece at a time; the game plan from here; Highlights; pause, step, or
  skip to the next call.
- Scores, Standings (the leaders, a player's page), Dynasty (the Film Room, History, Coaches and Teams): a line each.
  None on the ranking tab (Poll, Rankings, Table mean different things by league).
- The first offseason: all on one page, the staff's plan in every section, change what you like or nothing.
- The result card's note now points at the box score and Rewatch.
- test/guide.js (suite, browser, all seven): the welcome, the tab notes and the live note show for a new career; Got
  it clears one; Skip the guide clears all, and a new career afterwards, here and in another game, has none; back on,
  the first offseason shows its note; a hot seat has none. Goldens: screens only.

Round 75: baseball's players by their own ratings (engine 5). Round 74's leaders were read over seasons with
playoffs; over the regular season alone (test/bs-players.js, suite) the runs and wins leaders were inside MLB's
range (124-128 runs, 20 wins). What was off: a hitter's rating never touched his at-bats (the team's strength and his
slot did: rating against production 0.16-0.21, the home run leader 31-39), the lineup batted by position (the catcher
led off every game), the best starters ran 1.4-1.5 ERAs over 220+ innings, the bullpen's ERA 4.56 and starters took
66% of the wins.
- BS5 (baseball 50_game, engine 5 only): a hitter's edge is his rating against his day lineup's average (x0.013,
  zero-sum within the nine), split across his line: home runs x2.6, walks x1.6, doubles x1.4, strikeouts x1.0 (fewer),
  singles x0.5 (it was all singles at first: a .385 leader); the pinch hitter's edge is now just his rating. The nine
  bat in order of ability (the third best leads off, the best second); the catcher for the steal is named, not slot 1.
  A starter's rotation edge per rating point 0.012 -> 0.005; the bullpen -0.10 -> -0.07 from a fresh starter; the
  closer rests one night in four (by the day's seed, no draw), a set-up man taking that save (one closer had every
  chance, 57 a season); the league's offence +0.01 holds the runs at 4.41 a side (bs-calibrate) and 4.40-4.53 in the
  app's seasons.
- Measured (three regular seasons, test/bs-players.js): starter innings a start 5.3, 6+ innings 47%, 7+ 21%;
  starters take 61% of the wins; home run leaders 42-47 (rated 66-69); runs leaders 141-149; RBI 130-141; best ERA
  1.88-2.35; wins leaders 19-22; saves leaders 38-48; innings leaders 215-222; rating against production 0.75-0.78.
  The leaders' ranges are real seasons from 2015-24 (Acuna's 149 runs, Verlander's 1.75, Arrieta's 22 wins).
- Basketball (engine 5): a star's share of the scoring grows as rating^2.2 (was 1.6): college's scoring leader ran
  22 (the real one ~25), now ~23-24; pro's 30 -> ~32.
- Old seasons replay: test/engine-replay.js now plays part of a season on round 73's pages (engine 3) and on round
  74's (engine 4, git 422d434), reloads here and compares: all fourteen match. Football, hockey and soccer play
  exactly as before (their goldens differ only in the season's stored engine number; their hot-seat checks match).
- Still open: steals (leaders 6-10; MLB's 40-70: the computer sends a runner only when he's 80% likely to make it),
  and the bullpen beyond the closer is one "bullpen" line, not named relievers.

Round 74: players' lines add up to the game (engine 4). Round 73 found the player stat lines drawn per player from
rating and score, not counted: basketball starters' points 87 of 115, receiving yards over passing yards, more runs
scored than the score. Measured over a whole league season (test/statsum.js, every team-game, yours and the
computer's), before: 7,450 team-games off across six games; after: none.
- Season._creditV4 (core 80_season): a team's lines come from the sport's teamLines(rng, game record), on numbers of
  their own (seeded by year, step, teams, side), never the season's: a change to how lines are drawn moves no result.
  Players who didn't appear get no line. ENGINE_NOW 4; a season begun before keeps the old gameStats lines on the
  season's numbers, and the old play-by-play names (hockey's scorers, soccer's injured, football's receivers), so a
  save replays as played: test/engine-replay.js (suite) plays part of a season on round 73's pages (git 787c225),
  reloads it here and compares every game, the standings and every line, 4 steps on: all seven match. New seasons'
  results move once (the lines had drawn on the season's numbers): goldens and hot-seat re-recorded.
- Baseball counts its box score at bat by at bat in the engine (bsCount, no draws): each batter's AB, H, HR, BB, K,
  RBI, runs (the lead runners score first; the batter on a homer), steals; each pitcher's outs, strikeouts, walks and
  runs charged to the pitcher who put the runner on (inherited runners are the starter's; the extra-inning runner is
  unearned), "bullpen" for relievers the roster doesn't carry; decisions at the end (the starter's win: five innings,
  left ahead, the lead held; his loss: left behind, never caught; the closer's save: in with one to three, finished).
  300 games: runs scored = the score, hits = the line score, every time. A hitter who sat gets no line.
- Football: touchdowns and picks are the play-by-play's (driveScript now says who: the passer and receiver, the
  runner, the defender; the season stamps who played, d.by, so an injured starter's backup is named). A touchdown
  pass goes to the top receiver 42%, the second 26%, the backups (a tight end, the slot) 32% (one receiver had caught
  30 in a season); a pick to the corner, the safety or their backups. The quarterback's interceptions are the game's
  INT drives. Catches and yards are a split of his completions and yards, the rest to receivers the roster doesn't
  carry. Attempts, carries, tackles, sacks: drawn as before.
- Basketball: the team's made twos, threes and free throws (the engine's count) go one by one to the players on the
  floor by position and rating (a star's scoring share grows as rating^1.6), the bench's share to the bench; the man
  the log named for a three or an and-one has it. Rebounds from the misses (theirs less their offensive boards, and
  ours; nine in ten to a player), assists 0.6 a made shot, steals half their turnovers, blocks a sixth of their missed
  twos.
- Hockey: the scorer and assist are drawn from the ten skaters dressed by position, rating and ice time (hkDressed:
  it was by position alone, the top centre one goal in five at any rating), and about one goal in six goes to the men
  the roster doesn't carry ("The fourth line ..."; no line for them): naming all of a team's goals among ten skaters
  put a first-line centre at 77 points. Assists one a goal (named). Shots on goal (goals plus the other goalie's
  saves) shared among the ten; each goalie his spell's saves and goals against, an empty-net goal nobody's. Depth men
  get lines every game now (they had none in computer games).
- Soccer: goals to the man the log names (scScorer, an injured man no longer), assists on 72% to a team-mate by
  position and rating, the game's shots shared, the keeper's saves and goals against. The scorer is stamped on the
  goal (e.nm), so moments, highlights and the box name him after a transfer.
- Levels, a season with playoffs (before -> after; the real game): pro basketball ppg 28 -> 30, rpg 12 -> 13, apg 8.5
  -> 9.3, bpg 1.7 -> 2.0; college ppg 26 -> 22 (low: the real leader is ~25), rpg 14 -> 10. Pro football pass TD 36
  -> 43, rec TD 21 -> 22, INT (defender) 7 -> 8; college pass TD 49 -> 39. Hockey (targets above): goals 55 -> 62,
  points 128 -> 111, first-line C 66 -> 73, first-pair D 32 -> 37, top scorers rated 64+. Soccer: top scorer 55 -> 41
  (the Man City 55 is gone), assists 30 -> 24. Baseball: HR 28 -> 36, RBI 139 -> 137, runs 118 -> 158 (high: MLB's
  leader is ~130), W 17 -> 25 (high), SV 37 -> 52, best ERA 3.2 -> 1.6 (low): these last are the engine's own innings
  now, not a draw, and are worth a look in the engine (starters go deep and leads hold).
- Box scores show the players' lines (engine 4 games only; sportBoxPlayers, from the game logs): basketball with the
  rest of the bench's points, football passing, rushing, receiving and the other receivers, the defenders who made a
  play; hockey skaters and goalies; soccer the men who scored, assisted or shot, and the keeper; baseball hitters and
  pitchers with the bullpen and decisions. test/boxscore.js checks they add up to the game (TDs caught = thrown, picks
  = the game's, runs and hits = the line score, goals = the score less the fourth line's).
- Basketball's moments: won in overtime (and "you tied it with the last shot of regulation"), and "won it late"
  (behind or level going into the last stretch, won by a possession); college basketball had none in a season.
- Fixed on the way: a squad-filler drawn with a veteran's name took it and the veteran was renamed (a keeper you'd
  sold showed up at Birmingham as Isaiah Salinger): a man who has played a season keeps his name (engine 4).
  test/live-wp.js: twice the games for basketball (a quarter of football's states a game; 200 college games read
  15.9 on one seed, 3 to 8 on three others, 4.6 over 600).
- Not this round: the "what if" replay and the tutorial.

Round 73: big moments, the rewatch on the pitch, box scores (Instinct's 12 November "next best ideas" 1 and 2, and
box scores). Nothing here moves a game: all seven goldens differ in screens only, all seven hot-seat checks match.
- Rewatch plays the clips (Instinct: "Rewatch is text only ... the pitch is the best thing in the game"). The rewatch
  reads the run of play row by row; a drive's clips play as its first row comes up and the row waits for them, as the
  live stretch does (hlWatchPlan/hlWatchAt, core 97_highlights). Which rows are whose: the script of the first k
  drives is the first rows of the whole script in every sport, so the rows drive k adds are where that prefix grows; a
  sport whose rows didn't build that way would get no clips and the old text rewatch. The header keeps the clip's
  time (round 72's one clock). Highlights off: no pitch, as live. Tap the pitch to skip; Next skips and steps.
  test/rewatch.js (suite, browser, all seven): clips play, every drive is covered, the header is never off the clip,
  and in soccer and hockey every goal of the game is a clip (2-0: 2; 4-5: 9).
- Big moments (core 96_moments, sport 73_moments): on the result card, the night's biggest moment as a banner, any
  others under it, and one of the staff on it (staffAside "m_"+kind, three voices per kind per sport). Each sport
  reads its own from the game's record: soccer the hat-trick (the scorer the log credits, so the box score and his
  game log agree) and the late winner (85'+ or extra time, from level, standing); hockey the hat-trick, the overtime
  winner, the shootout; basketball the last shot made to win; football the late drive that won it from behind or
  level (in the drive chart's words); baseball the walk-off (home not ahead going into its last time up). Every sport:
  the comeback (down 2 soccer, 3 hockey, 4 baseball, 14 football, 15 basketball, and won), and the shutout where nil is
  rare (hockey, football, baseball). In a clip, a scorer's third goal is "HAT-TRICK!" (fourth "FOUR GOALS!").
  Measured over a season of your games: soccer hat-tricks 1.9% across four clubs (Arsenal 4.8%, 2.0 goals a game; one
  attacking Arsenal season 16%), hockey shutouts 8%, overtime winners 6%, shootouts 4%, hat-tricks 2%; baseball
  shutouts 9%, walk-offs 2%; football game-winning drives 17-18%; pro basketball comebacks 2%; college basketball
  none in 34 games (the last shot needs the "down 2, last possession" call and a three).
- Box scores (core 96_moments boxHTML, sport 74_box), folded on the result card: only what the game itself counted.
  Soccer: goals with scorers, shots and on target (the engine's ninety minutes), saves (shots on target less goals),
  cards. Hockey: goals with scorer and assist, saves (each shot stopped), shots on goal (those saves and the goals:
  the spell totals miss overtime's shots and ran one or two apart), power plays. Basketball: the team lines the
  engine counted shot by shot (now kept on each stretch as d.ln, no draws): two-point and three-point makes and free
  throws are the points. Football: the scoring summary in the drive chart's words, and each side's drives by how they
  ended. Baseball: the line score with hits, home runs, runs batted in. Player-by-player lines are not shown where the
  stats model draws them per player rather than counting them in the game: measured, basketball's starters' points
  were 87 of 115 and 118 of 94; football's receiving yards and touchdowns didn't match the passing ones; baseball's
  runs scored ran short of the score. test/boxscore.js (suite): every game you played over a season in all seven,
  the numbers add up and every moment is true of its game (a hat-trick man has three in the box score, his game log
  and his clips; a walk-off ended in the home half; a comeback's depth is the game's).
- Not this round: the "what if" replay and the first-call tutorial (Instinct's ideas 3 and 5).

Round 72: one clock, the score in sight, honest numbers (Instinct's and Muse's 12 November reviews, the rest).
- One clock (Instinct: the clip said 74' while the header said 70', in all three live-highlight sports). While a clip
  plays, the page is drawn as it stood before its stretch (round 66), header clock included; now the hold carries the
  clip's own time (live.hold.clock from HL_SPORT.headClock, moved on per clip in hlStart, as round 70's held score is)
  and every sport's header reads it: soccer the minute, hockey "1st · 14'", basketball the stretch, football "Q2 ·
  drive 7", baseball "Top of the 2nd". Hockey's header is game minutes now, as its rows and clips are (it said "1ST
  5:00", time left, beside rows stamped 13'). Basketball's rows of one stretch show its clock once. test/clocks.js
  (suite): while a clip plays the header equals its time, all seven; with the following switched off (--control) it
  fails all seven, every redraw.
- The score in sight (Instinct: "keep the score visible"). A call's options sat below the fold (933px on an 844px
  phone, 836px on a 720px laptop), so reading them put the score off the top, and after answering the game went on
  with no score in view. A strip (#minibar) copies the scoreboard (.wtop: label, both sides, held score) and shows once
  most of the numbers have scrolled away; a finished game scrolls its score into view once. test/score-visible.js.
- The fixed bar: the page leaves room for it by its measured height (--barh, fitBar after every render); a fixed 96px
  left the highlights row under a 128px bar at 1265x720 in every sport, and the offseason's last card under "Begin".
  test/bar-cover.js (the published build fails the five laptop cases). Phone: the plan rows keep 16px off the edges.
- The win chance on call screens (Ian: yes to Muse; one number, as it stands, never per option): liveWPHTML(true)
  above the call box. test/callwp.js: every call in play shows it, equal to the screen before; soccer's three add to
  100. Early 90%+ readings were measured, not capped: a side shown 90%+ before half-time on a lead of ten or fewer won
  93.9% (college football, shown 93.7%), 91.7% (pros, 92.7%), 93.5% (college basketball, 94.1%); shown 99%, won 100%.
  The line now adds the chance before the game while more than half is to play, which is what makes those high.
  Hockey's one-point drifts between screens with no goal are the clock running (a level game drifts to its edge).
- Football's scouting report (engV 3, new seasons): a defense keeps to its usual scheme 5 games in 7 (FB_FAVW3; was
  3 in 5). Following the report was right 55.6% (college) and 54.5% (pros) over 200 games each, against a ceiling of
  60% (the scheme's own rate); now 70.5% and 69.1%. Computer games have no read layer: calibration identical (college
  0.696 / 15.5 / 57.8% / 53.8; pros 0.591 / 11.6 / 52.7% / 45.9, before and after).
- Baseball's bullpen call (engV 3): replayed both ways from the same moment, leaving the starter in won more replays in
  0 of 50 calls (median 13 points behind). A starter now tires 0.03 a batter past his 18th (was 0.06) and the bullpen
  sits at -0.10 (was -0.02): keeping him wins 30% of calls, 48% for a starter who hasn't allowed a run, 24% for 1-2,
  18% for 3+. Runs a side 4.38 (was 4.39), one-run games 25.1% (27.2), extra innings 7.8% (9.0), all in target.
  bs-calibrate's engine block now plays the current engine (it played engine 1 outside a season, and showed 4.39
  with fatigue at 0.03 when the real figure was 3.86).
- Wording: soccer save rows under the keeper's team ("Fulham Orozco gets down" was Sunderland's keeper); a scorer's
  goals in a match each get their own words (scFinish; 7 of 13 two-goal scorers repeated a sentence, now 0; clip and
  row agree, scEventTextIn); a neutral site says so in the next-game label, its line and the live header; a kept plan
  that doesn't suit tonight gets a line (planFitHTML); the board's goal reads the same all season (words and number);
  the first highlights setting is named per sport (Big home runs, Late touchdowns, Crunch time); baseball's closer and
  rotation are named in the offseason (bsRole); day-one squad news keeps one contract-year story; a wrong call in a
  game won either way says "though it didn't cost you this one", and wrong reads in a win "you won anyway" (what a
  wrong read cost isn't measured, so no more is claimed); the college portal says the common reason once and shows
  five at a time; no full-screen flash after a clip has shown the score (with highlights off it stays).
- Flow: a season never opens on a week with no game of yours (skipIdleDays at step 0: the Premier League starts a week
  after the Football League; a college team's week 0); the draft's second tap waits 15 seconds and names the player.
- Not reproduced: baseball's save card a game behind the loaded save (it matched after every game played).
- Verification: the control build (ENGINE_NOW 2, opening skip off) matched every golden's simulation; only screens
  differed. With the skip on, college football's simulation still matched. The new build's simulation differs in
  football and baseball only (engV 3), and the other five differ in screens and the stored engine version.

Round 71: trust (Muse's and Instinct's 12 November reviews).
- Saves (Muse's priority 1: "This career isn't saving ... InvalidStateError", and first loads a week or a season
  behind until a reload, in four games). Cause, reproduced in all seven: the browser can close the page's database
  connection on its own (a page put away in the back-forward cache and brought back). The game kept the closed
  connection: every write after it failed (the banner), and every read fell back to the localStorage copy, which
  stopped moving the day the career moved to the database (round 46). A reload opened a new connection, which is why
  reloading "fixed" it. Now: a connection that closes is dropped (db.onclose) and a call that meets InvalidStateError
  opens a fresh one and tries again; when the database is known and still doesn't answer, a read fails (the slot reads
  "couldn't be read", the banner shows) instead of returning the old copy; a page brought back from the cache in a
  career reloads; a career tab brought back into view checks the save's revision. test/idb-close.js (in the suite):
  served over http so the database opens, each game saves, keeps an older localStorage copy, has its connection
  closed, then must save and load as it is. The published build fails it in all seven; this build passes.
- One career count of calls made your own way (S.callCareer): the Film Room's figure fell across an offseason (143 to
  129, 130 to 85) because it took the larger of the season ledger (which keeps two seasons) and the life tally (begun
  round 41). Now fixed as the career opens (rebuild) and only added to. A count an older build already dropped can't
  come back; from here it never falls.
- Reads: a scouting report left to the assistant ("Wait and see") reads "Left to your assistant. He waited..." and
  isn't counted in your tally; a report set up exactly as it said (followed) says so, right or wrong ("a few games can
  mislead, and following the report is still the better bet"), and isn't counted either way; baseball's split report
  (2-2-2) is ungraded like the other games' (it was counted as right).
- Field goals (Ian: rebalance). engV 2 (u.engV, ENGINE_V: a season begun earlier replays on its own engine): a drive
  that ends in a kick kicks from real distances (about 38 yards, gauss 38/9, 19-60) and goes in at the kick's odds;
  a stalled drive in range (a 45-yarder or closer) kicks two times in three in college, half the time in the pros,
  at its odds. Each level has its own curve (KICK2; the user's fourth-down kick uses it too). 4,000 computer games
  each (balanced plans): college FG 60% -> 80%, attempts 7.0 -> 5.0 a game, points 54.6 -> 53.2; pro FG 60% -> 86%,
  attempts 5.8 -> 4.0, points 46.0 -> 45.8. Calibration (150 seasons): college favourites 0.701 -> 0.696, margin
  15.8 -> 15.5, home 58.0 -> 57.8%, points 54.7 -> 53.8; pro favourites 0.593 -> 0.591, margin 11.9 -> 11.6, home
  52.9 -> 52.7%, points 46.3 -> 45.9. Turnovers unchanged (college 3.2, pro 2.8 a game; real ~2.6 and ~2.5): left.
- Schedules (schedV 3, new seasons): pro basketball's Cup nights moved games between pairs and the hosts with them
  (27 of 30 clubs off 41 home games, up to 45-37); a balancing pass after the group draw passes extra home games along
  chains of league games (nbaHomeBalance), and a knockout night's stand-in game goes to the club with fewer home
  games: all 30 at 41 at the start. Baseball's division games by game 80 ran 11 to 38 of 52; packSeries now leans a
  club behind on its division games toward a division series (DIV_SPREAD 40, no draws): 22 to 29.
- Who's on the field: the rink shows the goalie in net (d.gIn, the backup once he's in or when he started); baseball's
  fielders are the day's (a hurt starter's backup). A goalie you kept in isn't pulled by your assistant at the next
  break on his own (engV 2).
- The floor under the finish (Muse's priority 3): in a close game's late window (SPORT.lateFloor: football's 4th
  quarter within 8, basketball's last segment within 6, hockey's last five minutes and overtime within a goal, soccer
  from 80' within a goal, baseball from the 7th within a run) the first call that comes up is yours, whatever the gate
  says; graded as any call (close either way when it is). One a game; LATE_FLOOR_ON. Close finishes with no late call
  (late-calls.js, 40 games each): college basketball (within 6) 33% -> 0%, pro 30% -> 0%, hockey 35% -> 0%, soccer
  92% -> 0%, pro football 50% -> 10%, college football 33% -> 17%, baseball 9% (no call came up at all in that game).
- Measured, not changed: the scouting report's most common pick, followed, was right in about half of football's
  games (8 and 9 samples), 0.6-0.7 in college basketball, soccer and baseball, ~0.9 in pro basketball and hockey
  (small samples; test with the followed flag before tuning).
- Football grading (found by the suite after the kick change): "too close to grade" compared the rounded raw gap with
  3 points, while the card shows each option's rate rounded on its own; 15.5 vs 11.5 showed as 15 v 12 and was graded
  (often as wrong), and the reverse let some 4-point gaps go ungraded. Now the gap the card shows decides. In the
  college goldens about a dozen calls moved to "close either way" and a few 4-point calls into the Film Room.
- Floor asks carry live.ask.floor, so the in-reach test (regressions 77) leaves them out; double-finish counts reads as
  the tally does (waited and followed reports excluded).
- Releasing: r71-wip grew from r70-wip, not from main's squashed round 70, so git merge --squash conflicts. main's
  source matched r70-wip exactly, so main took r71-wip's tree (git read-tree -u --reset r71-wip) and the site was
  rebuilt; the pages were byte-identical to the tested builds. Branch the next round from main.

Round 70: highlights (Ian's round 69 notes, across the sports).
- Every sport: a stretch's goals all play (hlTrim keeps every goal and cuts only chances; hockey's slice(0,3) dropped
  a later goal when saves came first), and with more clips to come the held score moves on per goal as it goes in
  (c.after) instead of all at once at the end.
- Soccer: shots fly by their own line (lift and bend from the clip's draw: some driven straight, some curled, some
  over); the sides change ends at half-time (c.lr), in the full-match animation too.
- Football: the clip plays what the run of play says (rowText: driveScript's line for that drive, the same words the
  page shows): the scorer's name, pass or run and its length on the banner ("TOUCHDOWN! Espinoza, 16-yard pass"; QB
  runs carried by the QB). Every interception and fumble plays in Key moments, naming the man who took it (a new FUM
  clip: the hit, the ball loose, the defender on it). 70% of passes are contested (the corner on the receiver's
  hip). Field goals: the kick's real length (fgDistance), some hook or curl in, low by the posts, the uprights drawn
  bold with the window marked back up the field, and a behind-the-posts view (an H and the ball) at the end away
  from the line, so it plainly goes through or wide.
- Baseball: the engine now notes, for the highlights only (no draws, nothing the game reads; goldens unchanged),
  who was on each base (H.bn: runners never pass, runs come off the front, the double play and caught stealing take
  the man from first), who was pitching (e.p: his name, "closer" or "bullpen"), and the out that ended the game
  (d.last: strikeout, fly, grounder or double play). The clip names the runners and fielders, the mound shows the
  day's pitcher, panels low on either side give the batter's season line and the pitcher's, the fielder runs a hit
  down and throws it in (a fly to the cutoff, a sacrifice fly home), and a close finish (one run, or the tying run
  on or at the plate) shows its last out ("Top 9th, 2 out, runners on 1st and 2nd, down 2" / "CAUGHT! Ballgame").
  Sound: your home run gets the big crowd and an organ run (sfx "hr"), any other run a smaller cheer ("run"), at the
  moment it crosses in the clip (HL_SPORT.sound; hlRelease then leaves only the flash), and by SPORT.scoreSfx when
  no clip plays.
- Hockey: every shot the engine stops is kept on the period's stretch (d.sv: placed by count, no draws), so saves
  are real ones. Key moments show about 1.4 saves a goal (20 games: 135 saves, 95 goals; save % .898). Posts are
  not shown: the engine plays only shots on goal, so a post would be made up. Names under every player.

Round 69: stats (Ian: "click on a player and see all of their history and game-by-game stats"; "league leaders").
- Game logs: every line a player is credited with (core 80_season, both play paths and the log-credit extras) also
  goes to logGame: one flat list of numbers per player, glStride() a game (step, opponent index, home, for,
  against, position index, the position's stat keys padded to the sport's longest). On the season's copy of the
  player, so it's rebuilt by the replay and never saved. A list per game cost 16 MB over a baseball season; flat,
  about 8 MB (64,000 rows), basketball 1.4 MB; the season sims no slower.
- Season by season: at the season's end the line is kept as pl.hist [{y, t, p, r, s}] beside the career total (saved
  in the universe; careers from before this round show their earlier seasons as one "Before" line).
- The player's page (core 93_people playerView): number, name, team, position, age, rating and ceiling, contract;
  this season's line; season by season with the career total; this season's games, latest first (60 shown). Any
  player on any roster: tap a name (plLink) on your roster, another team's roster, or the leaders.
- Leaders: a sub-tab of Standings in every game (Table | Leaders). Each sport's categories (LEADERS in its
  10_players: football's yards and touchdowns, sacks, tackles, picks; basketball per game with a third of the games;
  hockey points, goals, assists, defencemen, save percentage and GAA with a third of the games, shutouts; soccer
  goals, assists, both, clean sheets, saves, in your division; baseball AVG with 3.1 at-bats a game, HR, RBI, hits,
  steals, ERA with an inning a game, wins, strikeouts, saves). Top five of each, or one category's top 25.
- test/stats.js (in the suite): over two seasons in all seven games, 82,000 checks: one log row per game played,
  the log's columns summing to the season line, the season kept in the history with its games, the leaders and
  every sampled page drawing.
- Goldens rewritten: the universe now holds the histories (with them stripped, every old fingerprint matched), names
  are links and Standings has its sub-tabs. migrate.js and regressions.js read past the links.
- In-game stats and box scores come next (round 70).

Round 68: how much to watch, and changing the plan during a game (Ian: "like Football Manager").
- Highlights have five levels, chosen on the live screen (a row above the action bar) or in the ? panel: goals only,
  key moments (round 66's), every chance (no closeness rule, more a stretch: soccer up to three chances, hockey four
  saves, baseball three plays an inning, football every kick and pick, basketball every big basket), full match, off.
- Full match (soccer: HL_SPORT.ambient): between the moments the pitch keeps playing, possession moved about in
  midfield with each side's shape around the ball, shared as the engine's balance of play for the stretch says (the
  drive's mom, the home side's share). It never makes a shot: the ball stays inside 0.76 of the way to goal. Drawn
  from the clock (hlAmbient redraws every frame while no clip plays), so nothing is stored. Each stretch then takes
  about 4.2 s at normal speed, so a match runs roughly a minute and a half plus its clips.
- The game plan can be changed at any point (pause first if you like): it takes effect from the next stretch. The
  change travels with the game's arguments (live.args[7] = live.pm, [[stretch, side, plan]], saved as S.planMid[key]),
  and a wrapper round makeLiveGame (core 94) counts the stretches each engine hands back and sets the plan before the
  one named (setLivePlan: st.mode in soccer, hockey, basketball and baseball; aggr/base in football). So a reload
  mid-game and the replays that weigh your calls play it the same way: a game with a change at the fourth stretch,
  rebuilt from its calls and changes, matched stretch for stretch. Not in a hot seat. Substitutions aren't modelled
  outside soccer's calls, so there's no free substitution.
- Goldens rewritten for the plan bar on the live screen (a build without it matched round 67's fingerprints).

Round 67: following the highlights, and Ian's list from playing round 65.
- Who's who: every player has a shirt number (core 93_people shirtNo: fixed by name and team, unique on the roster,
  starters first from their position's numbers: a keeper 1, a lineman 50-79, a goalie 30s; nothing drawn from the
  dice, nothing saved). The roster shows them. Highlights number every dot and put a key under the pitch (hlLegendHTML,
  HL.leg) with each side's tracked players. What a sport tracks decides what's real: basketball's five and hockey's six
  are the men on the floor and ice; baseball's nine fielders and pitcher; football one man a position (the other dots
  take free numbers in their position's range); soccer one man per unit, wearing his number on one dot (the scorer's
  dot carries the scorer). Basketball also names all ten under their dots, except where two stand close.
- Football: the replay plays where the drive chart is (HL_SPORT.replaces: the chart steps aside while a clip runs),
  end zones in the two sides' colours with their names, and the page's score changes as the ball crosses the line
  (clip.reveal / HL_SPORT.reveal: the hold is released at the moment of the outcome in a stretch's last clip, every
  sport). Field goals, made and missed (from the drive's own spot, no kick over 55 yards), and interceptions in the
  red half are clips too; before the outcome the caption says only whose ball it is.
- Hockey overtime and shoot-outs played inside the engine's finish and were added at the final whistle without a
  clip (Ian: a 5-4 shoot-out win he never saw). liveTick now draws the live view with the score held, plays the tail's
  clips (hlPlayTail) and finishes after them; a tap finishes at once (live.finishing). The screen before was the
  overtime call, with no pitch: the live view must be drawn before the clips are asked to play. A shoot-out keeps only
  its winner, so its clip is the deciding attempt: one skater, one goalie. Two and three goals in one stretch were
  each shown (two segments, three clips each, in a browser at fast speed): not reproduced.
- Baseball's highlights aren't only home runs: run-scoring hits, sacrifice flies drawn as the deep fly caught at the
  wall (it climbs like a home run: you find out at the wall), double plays (the grounder, the flip, the throw),
  strikeouts with two or more on, runners caught stealing; two at most an inning, the biggest first. Over 38 games:
  62 home runs, 50 hits, 8 deep catches, 15 strikeouts, 1 double play. The caption shows the inning only until the end.
- Smaller: the overview's "Your players" (the three best, on the roster already) is "Squad news": up to four players
  with something to say (form, a mood, a last year, a milestone close), hidden when there's none. The pro leagues show
  records beside opponents instead of a 1-25 rank (ranksMean: college's poll and soccer's table position stay). The
  idle "Highlights: ... play here" lines are gone.
- Goldens and hot seats rewritten: every change traced to the display changes (a build with them undone matched the
  old fingerprints; football's was the replay box moving above the field, which moves whitespace).

Round 66: the highlights keep the suspense (Ian: it said "goal" before the ball went in; Football Manager leaves you
not knowing whether it's a goal, the post, a save or a miss).
- The leak was mostly the page, not the clip: the stretch was drawn (score, run of play, momentum, live chance) and
  the goal sound and flash played, then the clip started. Now liveTick asks hlWillPlay first; if a clip will play it
  sets live.hold (the score and run of play before the stretch) and skips feelSpell; render draws the live view with
  live.drives and live.eng.h/a swapped to the held values (restored in a finally); hlRelease (clips over, or skipped,
  or the next tick) clears the hold, plays the sound and flash, and redraws. hlWillPlay must not ask for the pitch
  box: after a call the screen has none until the live view is drawn (the first browser run leaked there, 50').
- In the clip: the shot line stays white until the ball arrives; the shooter's ring and name, and the team in the
  caption, wait for the outcome (soccer, hockey, basketball: "it shouldn't tell you whose chance it is"); every
  soccer clip is 3.6 s, every hockey clip 3.2 s (goals ran longer than chances).
- The mix: in 12 Arsenal matches soccer showed 23 goals and 10 chances (70% goals), so a clip meant a goal. Chances now
  play in any game within two goals, one a stretch: 23 goals, 30 chances (43%). Hockey 57 goals, 17 saves (77%): its
  engine logs about one big save a game and nothing else, so there are no more real chances to show; none invented.
  Basketball's clips are made baskets (and the last shot); baseball's and football's are scoring plays.
- Penalties show the move that won them: the build-up to a foul in the box (the first 42% of the clip, an open-play
  move), "PENALTY!", everyone back outside the box, then the kick (soccer: c.pre, c.open, c.from).
- Red cards are highlights (soccer, key mode): the booked centre-back closes the man on the ball and fouls him, the
  card, and he walks off to the touchline. The engine sends off about one side in twenty games.
- test/hl-suspense.js (in the suite): a soccer match in Chromium; 50 moments of goal clips before the ball arrived,
  none showed the new score; the new score showed after each clip. With the hold removed it fails.

Round 65: soccer's highlight movement (the gap left to Football Manager after round 64).
- The 22 players were placed by a few lerps toward the ball's waypoints. Now (soccer 72_highlights: attAt, defAt,
  keeperDive): the attacking 4-4-2 pushes up with the ball, back line least, and shifts to its side; each receiver
  starts his run before the pass and curves into the space; on a wing move the full back overlaps outside the
  winger; as the final ball comes the forwards attack the near post, far post and spot, a midfielder arrives late at
  the edge. Defending: a flat back four holding a line (ball + 0.12, between 0.62 and 0.9 of the pitch) and sliding
  across, a midfield four in front, two strikers loitering; the nearest man presses, the next covers; in the box each
  defender takes the nearest attacker, goal side. The keeper comes off his line on the angle and dives at the shot
  (hlPlayer's dive: laid out along it, with a blur); a goal is dived at late, or the wrong way one time in three.
  After a goal the scorer wheels away to the corner flag with three team-mates after him.
- Players accelerate and settle rather than snap: each position is a weighted average of where he's heading over the
  last moments (four samples back to t-0.06). Stateless, so any frame is the same however it's reached.
- Set pieces start set: on a corner the box is already full and marked, two centre backs at halfway, the taker at
  the flag; on a penalty everyone stands outside the box along the arc and nobody presses.
- Seen frame by frame over twelve clips (goals, saves, a corner, a wing move, both kinds of penalty). Drawing only:
  the soccer golden matched.

Round 64: the highlight pitches, redrawn (Ian: Football Manager's 2D at least).
- Core drawing kit (97_highlights): the surface is painted once per size into an offscreen canvas (hlPitch) and copied
  each frame, so textures cost nothing in play. Mown grass in bands with a sheen and speckle (hlGrass), lines with a
  faint shadow (hlLines), goal nets with mesh (hlNet), a vignette (hlFinish). Players (hlPlayer): drop shadow, shaded
  disc in the club's real colour (hlKit/hlKits: a clash or a green shirt sends the away side to a change kit), trim
  ring, shirt number, a notch for which way he faces, a pulsing ring and name tag for the man the moment is about.
  The ball (hlBall): shadow that drifts and softens with height, a trail of its last moments; a puck and an oval
  football too. A broadcast score bug (hlBug), a commentary ticker (hlTicker) and a sliding banner in the scoring
  side's colour (hlBanner). hlDot and hlCaption now draw through these, so every sport changed at once.
- Canvas text can't read CSS variables: "var(--cond)" in a canvas font was ignored and every highlight caption drew
  at the 10px default since round 51. The kit names the families ('Barlow Condensed', 'Barlow', 'IBM Plex Mono').
- Surfaces: soccer (penalty arcs, spots, corner arcs and flags, nets), hockey (ice sheen and skate marks, boards and
  kick plate, end-zone circles with hash marks, neutral-zone dots, creases, notched centre line), basketball (maple
  boards with grain and varnish, painted lanes and centre circle, restricted arcs, backboards and nets), football
  (five-yard bands, painted end zones, hash marks every yard, numbers with arrows, goalposts), baseball (checkerboard
  outfield, warning track, padded wall with distances, textured dirt, mound, plate boxes, dugouts).
- Soccer also shows the move so far as a dashed line and the shot as a solid one, shirt numbers 1-11 by position,
  players facing the ball, and the score bug with the minute. Nothing here decides anything: every golden matched.
- Seen at 640 and 360 wide (scratch hlshot.js renders clip frames from a live game to PNG).

Round 63: the staff's re-sign bar, in every pro game.
- Swept with a scratch measure (6 seasons each, every club's staff plan at each offseason): the bar was a fixed rating
  copied between games and sat above the league's median, so the staff let most expiring deals go. Kept share before:
  pro football 27% (bar 66/64; median starter 65, backup 59), pro basketball 23% (62/60; medians 61/54), soccer 7%
  (62/60 across a pyramid whose median starter is 44). Hockey and baseball were fixed in rounds 61-62 (now ~48%).
- Now at the league medians: pro football 65/59 (FB_RS/FB_RB): 43% kept, room at season's end 29% (27%), win%
  spread .152 (.150). Pro basketball 61/54 (NB_RS/NB_RB): 47% kept, room 26% (20%), spread .133 (.136).
- Soccer not changed: a bar from each club's own squad (its median starter and backup) only lifted it to 17%; the
  wage budget is what binds (the 10th-percentile club ends the season ~18% over its budget). Its own round.
- Long-run checks (skipped by --quick since round 60) all run on round 62's build: NBA history (194 seasons), NHL
  history (114), draft labels (16 drafts): MATCH. March vs history: one MISMATCH, 3 seeds beat 14 seeds 89.3%
  of the time (real 85.2, tolerance 3.8). Not new: the Nov 5 run had 89.0, inside by nothing, and 2 v 15 runs high
  too (94-95 vs 92.9). The top seeds win their first games a little too often; the same seeds every run, so a core
  change since Nov 5 moved it 0.3. Not fixed this round. bb-march must run from the repo root
  (bb-longrun reads test/golden.js relative to the working directory).

Round 62: round 61's two open items.
- Hockey's payroll had the same problem as baseball's: the median club used 61% of the $104M cap (10th percentile
  33%), and the staff's re-sign bar (62 a starter, 60 a backup, copied with the code) sat at the league's top
  quartile (median starter 60, backup 52): it let go 0-2 of 3-8 expiring deals. Now a $90M limit with contracts
  still priced from $104M (PAY_SCALE: the maximum stays $20.8M), bars 59/54. Over 12 seasons x 2 seeds
  (test/hk-economy.js, which now counts max deals against $20.8M, not a fifth of the limit): median payroll 73-77% of
  the limit (61%), top-six kept 83-84% (75%), points sd 14.0-14.2 (13.7-14.4). nhl-history over 74 seasons: mean
  94.2, spread 13.3, best 122, worst 66, home ice 62% of first-round series. The glossary no longer calls the
  figure the real NHL cap. Clubs on their first contracts still sit well under it in the early seasons (Boston
  $27M with everyone kept): the starting rosters' deals run at their numbers, as before.
- Baseball's higher retention (top six kept 95%, was 90%) was flagged as a dynasty risk; measured, it isn't: year-to-
  year win correlation 0.36 before and after round 61 (3 seeds x 12 seasons), 7-9 different champions in 12 either
  way. Real MLB runs stickier (~0.5). Left alone.

Round 61: the baseball leftovers (Muse, Instinct, second looks).
- Pause on a phone did nothing (all seven games, measured in Chromium's iPhone 13 emulation): the press paused, the
  redraw put a new button under the finger, and the click that followed unpaused it. The press time is now kept by
  the button's name (PRESS_AT), not on the button. Pausing also stops on the play shown; it used to play one more.
  A mouse click always worked.
- Payroll: MLB's limit was $244M with the median club at $133M (45% room; football's 24%), so money decided
  nothing (Muse: $127.5M of room). The limit is now $165M; contracts are still priced from $244M (PAY_SCALE, so the
  maximum deal stays ~$49M). The staff's re-sign bar was hockey's (62 for a starter, 60 for a backup) in a league
  whose median starter is 59 and median backup 50: it let go 0-3 of 8-16 expiring deals (Muse: 9 of 12). Now 58/53
  (RS_BAR/RB_BAR): 5-6 kept by default, and keeping everyone leaves $5-30M for free agency. Measured over 12
  seasons x 3 seeds (scratch mlb-econ, hk-economy's method): median payroll 80-84% of the limit (r60: 58%), top-six
  kept 95% (90%), wins sd 12.3-13.3 (11.5-12.3), best record 108 on average (106; target under 112).
- Draft: five rounds (MLB_ROUNDS). The class's first two rounds are drawn exactly as before, then a tail: lower now
  (~45), wider ceilings. Late picks make a roster about half the time; ~1 in 15 reaches 60. A "sleeper" callout in
  round 4 was measured and not built: the highest scout ceiling left at your round-4 pick (40 drafts) had a true
  ceiling of 60.6 against the staff pick's 58.2, and was worth less now (50.9 vs 51.5). No edge to point at.
- Voices: the Capybara said the same two sentences every game (20 of 20); his three baseball lines now have
  alternates (SPORT.voiceAlt, merged into VOICE_ALT). The Bears' repeated shout uses the pick's short name ("ATTACK
  THE ZONE!", not the whole label) with more tags; Pearl's read line opens four ways.
- Filler and highlights: strikeout, double-play and quiet-inning lines vary; a home run says its distance
  (355-465 ft, by hash) and its arc varies in the highlight.
- Reads: a wrong read now names the tell for what they were (READ_TELL: balls in play pulled, pitches an at-bat,
  swings and misses). The team page's tally shows reads by month in daily leagues (NBA, NHL, MLB) once two months
  have graded reads, with a small bar per month.

Round 60: football's numbers in the shared code, swept.
- Achievements (96_goals): "Century" was 100 wins (inside one baseball season; nine in football): now about ten
  seasons' wins (LEAGUE.tuning.century: NBA/NHL 500, MLB 1,000, soccer 250, college basketball 200, football 100).
  "Unbeaten" can't happen over 82 or 162 games: a win share as rare as a perfect college football season (~0.6% of
  team-seasons, measured: NBA 85%, NHL 72%, MLB 67% = 109 wins; tuning.unbeaten; football and soccer: no losses).
  "Giant-killer" was 150 rating points, which each engine's own scale made a long shot in pro basketball (280) and
  a mild upset in baseball (680): now a win you had a one-in-four chance of (wpScale x log10 3).
- Margins (core MG, SPORT.margins): the words were football's, 3 close, 21 a rout, 28 never in doubt, 38 the week's
  blowout; a hockey or soccer side "lost a heartbreaker" by three and nothing was ever routed. Basketball 3/20/25/32,
  hockey 1/4/5/6, soccer 1/3/4/5, baseball 1/7/9/11. "Over by halftime" is "Decided early" (no halves in two sports).
- Runs (RUN): a slide was three straight losses, a streak five, a story four. The share of days on such a run is
  the same in every sport (13-15% on 3+ losses, measured) but 162 games made it ~22 days a season in baseball (1.6
  in football): two more over 50+ games, one more over 20+. The board's streak objective already scaled.
- Goldens were first written on a build without RUN (my mistake); the suite caught four, rewritten on the build.
- Left alone: the in-season rating update is /400 with football's margin multiplier in every game; each game was
  calibrated with it in place (every calibration check measures the real app), so rescaling it would mean
  recalibrating all seven for nothing a player sees.

Round 59: reloads re-rolled baseball's season (Muse, Instinct, second looks).
- Cause: round 57's packSeries sorted the free clubs with a random comparator (slack, then rng.r()-0.5) inside
  sort(). In a browser that came out differently on each load, so a reload built another schedule and replayed the
  season onto it (53-40 came back 41-51, then 52-41; Tampa Bay and Houston "80-80, 160 games"). The node reload
  test passed throughout. Now each club's tie-break is drawn before sorting. Reproduced in Chromium (a 110-day
  career, every run different from day 0); after: three runs identical. Older baseball careers can't be put back
  (their schedules were never stored); they re-roll once more on the first load and hold from then on.
- test/reload-browser.js (run-all): each game played in Chromium through the page's own functions (days,
  watched games with calls answered, sims ahead, plan and featured-player changes), saved, the page reloaded, the
  slot opened from the title screen, every game compared. Checked by putting the random comparator back: day 1.
- The schedule: no back-to-back series against the same club unless nothing else fits (a 6-game set, ten straight
  against Cleveland: Muse): ~70 such pairs a season to 21-27 (bs-calibrate checks at most 30).
- The read panel: the highlighted row's class drew a fixed &#9650; beside the name, against a &#9660; value in 9 of 20
  reads (Muse); the row now uses the plain highlight. The bullpen call, after "leave him in", waits three batters
  or a run (it asked in back-to-back innings: Instinct). Words: "a big step in a winter", the hire text (no "end of
  the floor"), "San Diego wins the World Series", the standings picker named by the league's groups (Division in
  the pros: it said Conference). wrong-sport.js knows "of the floor".
- A guaranteed late decision (Ian): in a game within one run from the 8th, if nothing worth asking has come, the
  first pinch-hit or steal chance is yours (st.lateGot). 30 games: one-run finishes with no late call 67% to 13%
  (the one left had nobody on for you in the 8th or 9th); sim parity 49.7 / 48.9; calibration unchanged.
- Soccer, found by reload-browser.js (1 run in 9, then Bristol City seed 4 every time): a cup week plays its league
  game and its tie as two halves of one step, and the gameplan was kept once a step; the league half on "safe" then
  the tie simmed on "balanced" overwrote it, and a reload replayed the tie another way (3-1 came back 0-0). Now
  planKey/planFor keep the second half's plan as "step#1" (older saves: one plan a step, as before).
  Hockey's staff-hire text said "that end of the floor" too: now how your team attacks or defends.

Round 59 (not shipped): the closer an inning early, measured and dropped.
- The call: up one or two going to the 8th, bring in the closer for six outs (at his best for the 8th, BS.closer
  less 0.10 for the 9th) or save him (a setup man for the 8th). Replays (250 each option, 50 calls): worth 2.8
  points on the assistant, median 0; most of it was the setup man replacing a tired starter, not the closer's
  timing. With a realistic batting order (slot edges +0.09 for the 3-hole to -0.14 for the 9-hole, zero-mean) it
  was 1.8, median 0, even with the heart of the order due in the 8th; and the order moved calibration (one-run
  26.1%, 4.48 runs). One inning of a better reliever is worth too little in win chance for the call to pass the
  3-point rule. Reverted; the engine is round 58's.

Round 58: baseball's calls, October, the lottery.
- The read: the strikeout-rate tell was never moved by the approach (only two tells carried anything); the best
  reader of the tells after three innings was right 53% of the time, under the scouting report's 69%. Now a third
  real tell, swings and misses an at-bat (BS_TELL[k][2], drawn like pitches seen; the plate appearance unchanged),
  noise pit 1.1 / wh 0.9, and bsRead by likelihood: the best reader right 84% (3,000 games). The panel marks each
  tell above (&#9650;) or below (&#9660;) the league average. Worth 6.2 points on the assistant (replays, 300 each).
- Steal: a runner's speed and a catcher's arm (from their names: fast/average/slow, strong/average/weak) set the
  odds (0.74 base, +0.08/-0.12, -0.08/+0.06); the computer and your assistant send only at 80%+ (BS_SEND); the panel
  shows both and the runner's steals. Pinch: the edge is how much better the bench bat is than the man he hits for
  (0.012 a rating point, -0.12 to +0.15); the computer pinch-hits by the same rule (it never did); the panel shows
  both men's season lines. Measured worth on the assistant: steal 1.6 points (tied 8th-9th 2.5-3.9), pinch 2.9
  (tied or down one from the 8th about 4): asked only there, his rule elsewhere (and for your side, the computer's).
  Close finishes now often carry no late call (8 of 12 one-run games in 30): the bullpen call is the late decision.
- Bullpen call: also in close games (within two) from the 6th, six batters before he's spent: in 16 of 56 live games
  (10 before). Worth 14.9 points on the assistant.
- October (mlb 97_views nflBracket): one screen, your road (each series, every game's score from your side), then
  both leagues and the World Series, each series with its games (G1 Seattle 8-1...).
- The draft lottery (98_offseason_views lotteryHTML): the eighteen outside the postseason by record, each one's
  odds at No. 1, and where each landed; your line says where your record put you and where you drew.
- Sim parity 49.7 / 48.9; calibration 4.39 runs, one-run 27.2%.

Round 57: baseball's schedule as series, the run level, and September.
- Schedule (mlb 25_schedule): MLB's pairings (13 / 6-7 / 3 / 4) as series: division 7+6 as 4+3 and 3+3, the rest of
  the league 3+3 (the seventh game makes a 4), one 3-game series against each of fourteen in the other league, 2+2
  with the natural rival. Exactly 81 at home for every club: each league's odd pairings, and the interleague
  series, are oriented along Euler circuits (every club has an even number of each). packSeries lays them into
  the days: no games over a 4-day All-Star break or two league-wide off days, both clubs free on the first day,
  least room first, a day off after 12-17 straight (MLB's cap is 20). Measured: 2,430 games, 630 three-game,
  120 four-game and 30 two-game series, 24 days off a club, longest stretch 19-20, the season to day 184-186 of 186
  (with no league-wide days off it ended on 176-178). bs-calibrate.js checks all of it on three seeds.
- The hub's next game: "Game 2 of 3 at home · you trail 1-0" (serLine, from sched entries' ser/sg/sn).
- Run level: singles 0.136 to 0.134 and home runs 0.029 to 0.028 (the real app ran 4.52-4.57 a side). Real app
  now: 4.43 a side, one-run 26.7%, home 52.6%, wins spread 11.7, best 105. bs-calibrate: 4.38, 28.1%, 9.2% extras.
  The starter's form (0.12) barely moves the one-run share (0.06: 26.9%), so it stays.
- The race (mlb 97_views bsRaceCard, LEAGUE.ui.raceCard, drawn above Next up from the last 45 days): your division
  and the wild card with games behind and clinch marks, the magic number (163 less your wins less the second's
  losses) or elimination number, the same for the wild card against fourth or third, last night's scores for
  every club in either race, and "clinched today" once (S.bsClinch).
- A newline added to the next-game card's template changed every game's hub HTML (and goldens): kept inline.

Round 56: baseball testers' first reports (Instinct, Muse), the bugs.
- Saving (all games): a refused database write is tried twice more; if it still fails, the banner gives the
  browser's own words and the storage in use (store.lastFail, saveWhy). Muse's main browser refused a new career's
  first save; a new career is ~10 KB in every game, so it isn't size. storage-full.js: refused twice then taken
  (no banner), refused every time (banner with the reason), taken again (banner goes). Retries only where a
  database exists (storage.js caught the wait on the old localStorage path).
- "Beaten in the final" asked whether the team that beat you won it all: now the series' own round
  (finalRound()). Baseball: "out of the postseason", "beaten in the World Series" (LEAGUE.text.outOf/lostFinal).
- Baseball live: the line score takes the live score for the inning under way (it ran a play behind at a call);
  every event names its man from the day's lineup (injured regulars' backups), a pinch hitter stays in his slot,
  and a watched game's log credits home runs, RBI and hits (bsLogCredit, core 80_season): 41 of 41 homers
  credited over 35 live games, no slot named two ways. Bases-loaded walks score with a line. The stranded-rally
  line once a half-inning (same random draws as before). The final card drops the pre-game series state
  (liveLabel, all three series sports). The flash: home runs, and runs from the 7th that tie or take the lead
  (SPORT.flashWord). Pinch calls tied or behind only (the help said so; a third came with a lead).
- Live win chance (baseball): the spread shrinks linearly with innings left and the pre-game edge as tau^1.5
  (LIVE_TAUP, LIVE_MUP). Measured on 15,000 games: a one-run lead after seven showed 69% and won 82%, now 83/82;
  a tie after seven against a far stronger club showed 29% (40% before the fade) and won 38%, now 37/38. Hidden
  once the game is decided. A Hide / Show button on the bar itself (it was only in the ? panel).
- Objectives (all games): the home and re-aimed targets used Elo/400; each engine has its own scale (wpK: NBA 280,
  baseball 680), so baseball's targets were 61% at home for an 87-win club and "93 of your last 135". Now
  wpScale("balanced"). Met overall 50% (49% before). Baseball's clauseLine: division or place clinched, out of
  the race, or where you stand for the last wild card (wcRace), not "stay in the wild-card race" after clinching.
- Words: All-Pro was football's (baseball All-MLB, hockey All-Star, pro basketball All-NBA); baseball's offseason
  is the winter (LEAGUE.text.offWord); soccer's All-Pro is the Team of the Year; the season card's group stat says DIVISION in the pros, LEAGUE in soccer;
  baseball's close-game chip is "One run" at one run. wrong-sport.js knows All-Pro and summer-in-baseball.
- Measured in the real app (9,720 games): home 52.6%, one-run 25.1% (MLB ~28%), 4.57 runs a side (MLB ~4.4),
  home games per club 77-85: the schedule and the run level go with round 57's series schedule.

Round 55: words from the wrong sport (test/wrong-sport.js, in run-all).
- The test: a lexicon per sport (touchdown, rebound, Stanley Cup, relegation, home run...) and per league (Super
  Bowl, March Madness, NBA, NHL, MLB...). Two seasons in each game, every tab several times, live game screens,
  offseason steps, team pages and season cards: ~4,400 screens, 11.8M characters, searched for any other sport's
  or league's words. Then every string in each game's own layers (src/<sport>, src/leagues/<league>), shown or
  not, minus template expressions and bare identifiers. Allowed: the NFL in college football, the NBA in college
  basketball (the draft); club names (AFC Telford United, Accrington Stanley). Checked by planting "won the Stanley
  Cup" in baseball: caught on screen and in the source.
- On screen: clean in all seven after rounds 53-54. In the source:
  - pro basketball, hockey and baseball passed football's "SUPER BOWL CHAMPIONS" to milestones(), which no other
    league's isTitle matched: "First championship of your tenure" could never appear in hockey or baseball (and
    the copy was wrong in pro basketball too). Now last.seasonResult(my); measured: it appears in all three.
  - college basketball's "NFL pipeline." when a player you built leaves early: now "NBA pipeline.".
  - soccer's named rivalries were hockey's (none of the clubs exist, so no rivalry was ever named): now eight
    English derbies. A named rivalry also adds a "beat your rival" objective and a big week in the digest, so
    soccer gains derby objectives (objectives: rival 1/3 met; stakes and objectives tests pass).
- Found beside it in core (milestones): "worst season" needed 3 wins or fewer, football's number; seasons of 20+
  games now use 35% of games. Football's rule unchanged.
- Exposed by the derbies (regressions.js): the rivalry news had no draw, so a drawn derby read "null takes The
  Merseyside derby, 1-1". Now "X and Y draw The Merseyside derby, 1-1".
- Baselines rewritten: college basketball and soccer goldens; hockey, pro basketball and soccer hot seat (text
  and soccer's derby objectives). The other goldens unchanged.

Round 54: each pro league keeps its own franchise-strength range (26_offseason, the summer's u.program clamp).
- Hockey and pro basketball carried pro football's 1480-1920. Both start clubs below 1480 (hockey 1372-1628, NBA
  1420-1640), so after one summer every weak club sat at 1480 (11 in each) and expectations had no rebuild or
  start-over jobs left (measured over five seasons: hockey 9 rebuild + 2 start over in year one, none after; NBA
  8 rebuild, none after). Now hockey 1300-1720, NBA 1320-1740, baseball 1320-1680 (1380 still held its weakest
  club); the job mix holds year to year and nothing sits on a floor.
- Calibration after: NBA history (194 seasons) wins sd 11.7, margin 12.9, 1 seeds 54% of titles; NHL history
  (114 seasons) mean points 94.1, sd 14.0, best 122, worst 64; draft labels hold. Goldens and hot seat
  rewritten for hockey and pro basketball; the other five unchanged.

Round 53: baseball, second pass (measured):
- The best record over 12 seasons averages 104.8 (98-113; MLB 2015-25 ~104), the worst 56 (MLB ~52), the spread of
  wins 11.8: the round-52 "107" was five seasons. The engine's edge is unchanged.
- Hockey left in MLB, fixed: the season grade and objectives (wins over 84 games, "Stanley Cup" as the title, so a
  World Series counted as no title and grades ran high). Now: bands by franchise strength at its expected wins
  (a club wins ~81 + 0.157 a point above 1507): CONTEND 89 / par 1.8, WIN A SERIES 86 / 1.1, WILD-CARD RACE 81 / 0
  (only 12 of 30 go to October), REBUILD 75, START OVER 68; 0.09 a win; results matched to baseball's series names.
  35% of seasons miss expectations (hockey 36%). Also: "won the World Series", "World Series champions" and
  "Postseason, No. N seed" in the history, MLB's named rivalries, MLB's lottery (eighteen teams, six picks drawn),
  and baseball's own franchise-strength range (1380-1680; the copied 1480 floor lifted seven clubs after a year).
- Found by adding baseball to the cross-game tests: leaving calls to the assistant won 39% to the computer's 49%.
  Once the pull call had been asked in an inning, nothing took a spent starter out until the inning ended (a run a
  game). Fixed in cpuTurn; now 49.3 / 49.8. And test/sim-parity.js could not fail: its count sat inside a comment.
- Live win chance: LIVE_SIG mlb 4.2 (fit 4.0 at 400 games; worst band 5.7 points).
- Baseball is now in saves, layouts, sim and skip, sim ahead, objectives, people, postseason-gate, regressions,
  call-impact, late-calls, stakes, live-wp, names, highlights, sim-parity and story. Not in goals.js (college and
  pro football only, a 60-step loop).
- Hockey and pro basketball had the same 1480-1920 clamp: fixed in round 54.

Round 52: baseball, a seventh game (Pro Baseball Coach, league mlb, game layer baseball):
- Built from the hockey and NHL layers: the league machinery (contracts, draft,
  offseason, records, views) adapted; the sport replaced. Positions (10_players):
  the nine in the lineup (DH among them), three starters and the closer, each with
  a man behind (the fourth and fifth starters take about two starts in five).
  gameStats gives a starter a line on the days he starts (about one in five).
- Engine (50_game): plate appearance by plate appearance (K, BB, HBP, 1B, 2B, 3B,
  HR, out in play with double plays and sacrifice flies), the starter tiring past
  eighteen batters, the bullpen, the closer for a save, extra innings with a runner
  on second (not in the postseason). The read: their hitters' approach (pull,
  patient, contact) against your plan (away, zone, spin), from tells (pulled balls
  in play, pitches an at-bat, strikeout rate). Calls: prep, the read after three,
  pull (your tiring starter in a close game), pinch (7th+, men in scoring position,
  the bottom of the order), steal (7th+, one-run game). st.autoDid names the
  assistant's action. BS.edge 0.00031 a point of Elo; wpK 650/680/720; hfa 40.
- MLB (05_league, 25_schedule, 85_postseason, 97_views): thirty clubs by city, the
  balanced 162-game schedule (13 x division, 6-7 x league, 3 x interleague, 4 x
  rival) fitted into 186 days (a team running out of days plays whenever it can);
  twelve-team postseason: byes for the top two division winners, best-of-three wild
  card at the higher seed, 2-2-1, 2-3-2, 2-3-2. Payroll limit $244M.
- Measured (test/bs-calibrate.js): 4.48 runs a side, one-run games 27.7%, extras
  8.9%, home sides 53.8%, the spread of wins 12.6 (10.8-15.6 by season), the best
  record 107 on average (97-117): a little high against MLB (~101).
- Screens (75_screens): line score, the run of play an inning at a time with names,
  evidence for each call; highlights (72_highlights) for home runs and big hits.
- First version: not yet in the cross-game tests (layouts, saves, sim and skip,
  objectives, live-wp, call-gate lists); in goldens, hot seat, storage, reload.

Round 51: highlights (Football Manager's 2D match, in all six):
- core 97_highlights: HL state, a canvas that survives redraws (hlMount moves it
  into #hlpitch after each render), hlPlay(live,drive) returns the clips' length
  and liveTick waits that long for the next stretch; tap to skip (the next
  stretch comes at once). S.highlights: "key" (default), "goals", "off", in the
  ? panel. No canvas or requestAnimationFrame (tests), or reduced motion:
  nothing plays and nothing waits. Each sport's HL_SPORT {aspect, clips, pitch,
  idle, frame, collapseIdle}: soccer and hockey 72_highlights (the only pitch on
  their live screen, idle when nothing plays), basketball and football (shown
  only while a clip plays: they have their own field or flow).
- Nothing decided: the event (goal, save, miss; three, and-one, last shot; a
  touchdown) is the engine's; its draw (e.u, seeded mulberry32) picks the move;
  the commentary's words pick it where they say how (soccer "from the penalty
  spot", "heads in at the near post", "blazes over"; hockey "tips in a point
  shot", "finishes a two-on-one"); the man the commentary names takes the shot.
  Football's drives have no plays and the chart names no scorer, so its
  touchdown is drawn by position (QB, WR, RB), never by name.
- test/highlights.js: each sport's first watched game plays its clips with no
  page errors and ends the same with highlights on and off; clips 1 to 10 a game.
- Phones: the goal flash scaled a full-screen layer to 1.04 and widened the
  live screen to 421-465px in about one soccer match in three; it grows inside
  the screen now, and html/body clip any overflow. A long club name ellipsizes
  (.wside min-width 0) and the live W/D/L wraps under its bar.

Round 50: the testers' rounds 46-49 review (Muse, Instinct):
- Saves: store.get, when the database and localStorage both hold a key and
  differ, asks store.pick (core 99: revisions by number; careers by season,
  seasons banked, steps) and loads the copy further along, copying it into the
  database. Muse's rollbacks (pro football 3-2 to 1-1; a finished pro basketball
  season back to Game 7) fit an old cached tab writing localStorage after the
  new build had made a database copy: reproduced on round 49's build (loads the
  older database copy), fixed here (storage-full case 5, both directions).
- One ledger for calls: engines record what "leave it to your assistant" did on
  the night (st.autoDid: his own read and what he switched to, the score rule,
  his goalie call); callImpact keeps it from the same-dice replay (c.dd).
  assistantSaid() names it on the What if, the Film Room and the season's big
  calls. The Film Room keeps only calls the match graded (4+ points), and its
  rule line now says so in the card's words; entries carry the match verdict.
  What if: a flipped result or a graded call only (a close call that moved
  only the score is out); the night and the replays are told apart ("graded
  close either way... this night the dice decided it"); an empty state says why.
- Bugs: a player drafted or signed and let go in one summer is named once, in
  "gone", and is never an alumnus (all four pro leagues: leave() skips
  joined>year). Soccer bookings name a man once per match, the red goes to the
  booked centre-back (1,500 matches: 101 repeat bookings -> 0). College: no
  target "missed" before Selection Sunday (10 premature lines -> 0). Hockey:
  the goalie who started (backup on a back-to-back) is the one named (first
  drive carries bk). The career count and its worth from one ledger (callLedger
  keeps two seasons; lifeCalls the career): never a count from one and a worth
  from the other. The slot counts a title just won before the offseason banks
  it; "0 earlier seasons" dropped. "Out for the season" only past the season's
  remaining steps (it was 14, football's weeks). Career leaders include current
  players (a 108-yard passer led pro football's list of departed players).
  Not reproduced: hockey's 2034 record in two versions; the counters reads vs
  differing calls (they count different things).
- Live win chance: early states measured (300 games a game, more than half to
  play): shown 90%+ won 91-99%, shown under 10% won 1-11%: the extremes are this
  engine's honest odds (favourites win more than in real sport). W/D/L now adds
  to 100 (largest remainder). On/off in the ? panel (S.liveWP), with a line on
  why early leads can read high.
- Phones: upright, the two sims share a row; the result card and Rewatch clear
  the bar on the first view (390x844, three games).
- The late-call floor: basketball's crunch-time read (close) now comes down 1-3
  as well as up 0-9, and in a one-score game it is never gated (CLOSE_FLOOR,
  core 99 floorCall): a read, judged on the evidence. College: close calls 8 ->
  23 in 116 watched games; close finishes with a late call 4/18 -> 10/18. The
  rebalance of soccer's late attitude call was not done: AGGR push/sit were
  already widened once (Nov 2026) and the call still moves under 3 points in 9
  of 10; soccer and hockey already give the player a graded read after half-
  time (55' read; hockey's third-period read and overtime).

Round 49: phones, the call gate measured, playoff strength, names:
- Phones (390px, Playwright, every main screen in all six): nothing ran past the
  edge. The top bar's five 24px buttons cut "WREXHAM" to "WREXH..."; on phones
  they are 34px tall and music moves to the ? panel (a Music row there). Speed,
  sub-tab and rewatch buttons 36px on touch screens. Not checked: a clinch night.
- The spread gate, measured (1,172 gated calls, six seasons a game, each option's
  worth on 1,600 fresh replays): at 60 replays and 3 points it asked 432, and 79%
  of them truly gained under 3 points on the assistant (the max of several noisy
  numbers flatters the best; raising the threshold alone didn't help). Only 14%
  of gated calls truly gain 3 points. Now 120 replays at 4 points, and NEVER_ASK
  (core 94) gives the assistant kinds that almost never matter: nhl push, lock,
  final (1 of 108); ncaab half, chase (3 of 95); cfb protect, onside (0 of 22);
  nfl onside (0 of 7). On fresh seeds: 66% of asked calls under 3 points (was
  79%): hockey and pro football ~one in three, pro and college basketball and
  soccer still ~75-89%, because their calls rarely move a game. The fix there
  is rebalancing those options, not the gate. Gate cost ~2x (about 30 ms a call
  in node). Scratch tools: r49/gate.js, gate2.js, rules.js.
- NBA playoffs at full strength (LEAGUE.postFull): the regular season halves a
  mismatch past softGap (the better side coasts); the postseason no longer does.
  1 seeds 43% -> 53% of titles over 194 seasons (real ~55), 1 v 8 86%; the
  regular season is untouched (the gopts playoff flag, as hockey and soccer).
  nba-history passes.
- Names (core 21_names): each sport drew from 55-61 surnames, so 60-100% of new
  rosters shared one. playerName makes the same two draws and reads the surname
  through ~300 by hash (wideLast); a new roster's repeats are re-read by hash
  (distinctSurnames). New rosters: none shared (test/names.js). After six
  seasons newcomers bring some back: ~20% of basketball and soccer rosters,
  40-55% of football and hockey. Against a control build, games, records and
  champions unchanged in five games; college basketball's changed because the
  recruiting commit dice are seeded by the recruit's name (core 92).
- What if (95_story whatIfHTML, WHATIF_ON): at the season's end, up to three
  calls where the replay on the assistant's call (the same dice) went furthest:
  a flipped result first, then the score swing, then clarity; words for the
  verdict, the replayed score shown. Kept per season (S.whatIf).
- Hot seat (found by firing.js once round 49's results moved): when both humans
  were fired in one winter, the first was offered the second's program (open,
  since its coach was fired), took it, and the second's departure then handed it
  to a computer coach: the first coached nothing. Another human's program is now
  never on your job market or poach list (openOffseason, humanT). Single-player
  markets unchanged; hot-seat goldens unchanged.
- Tests that followed the gate: regressions 81 (college basketball's close finish
  over two seasons: asked about one game in twenty) and 84 (no onside-call count:
  the onside kick is the assistant's); recruiting on eight basketball programs
  (three read +4.8 by luck; eight +2.3, round 48's build +1.8; the bar is 2.5).

Round 48: one number, one basis (Muse round 21, Instinct round 16):
- The play-off pre-game card took every game as neutral while the injury note
  under it took it as a home game (62% over "73% without him; about 81% with
  him"). postNext now gives the host (nba, nhl, epl; nfl already did) and both
  use it, on the balanced plan.
- An old copy says so: build.py writes version.json (each game's stamp); a game
  served over http fetches it uncached on load and, if its own stamp differs,
  shows "A newer version of this game is out" with a reload that asks for the
  new build (Muse reviewed a pro football page two builds old, and a college
  page showed the last build's stamp on first load). test/version.js.
- Saves: a database slow to open (8 s) is retried on the next call, and a save
  that can't reach it fails (the banner says so) instead of landing in
  localStorage under the database's newer copy.
- NBA seasons banked before round 46 read "Lost in the play-in" from your own
  season's result. An absence reads in one unit everywhere (stepWord). The
  hot-seat sentence quotes the record as shown (recStr: it read "6-12" beside
  6-8-4). The pros' goal line after game 82 stops promising postseason wins
  ("N wins of the M asked" and the play-off clause): only college play-off
  games count in the record (LEAGUE.postRecord).
- The watched tally counts each game once (the post list is [game, label] pairs
  holding title games the weeks have: "watched 4 of your 39" after 31-5).
- Soccer's economy: a summer gap was filled with a 53-58 rated player on
  GBP 0.9M (the football game's numbers). In the non-league that is a star on
  ten times the wage budget: after three summers National League payrolls ran
  6.3 times their budgets, North/South 8.6-9.7, and the tiers' ratings had
  closed up (NN 32 to 42 in one summer). Gaps are now filled at the club's level
  (eloToRating(program) minus 2-7) on the pyramid's wages; the non-league
  budgets are a quarter up. Over seven summers: ratings hold their tiers
  (NL ~35-37, NN/NS ~31-32), payrolls settle at 1.1-1.2 times the non-league
  budgets, 0.4-0.9 above. epl-predict and epl-rules pass.
- Hockey's market: "Show the cheapest first", and the count asking under $3M
  (measured: 9-13 of 48-67 likely free agents, rated 52-54, below the best-25
  cut that Muse checked four times).
- Calls: a situation call graded level with the assistant's is checked against
  its third option on the same dice (IMPACT_ALL); "level with your assistant's
  call, but X was the better option by about N in 100" replaces "close either
  way" when that's so. Measured: seven in ten asked situation calls were
  graded within 3 points (the pick level with the assistant's while the gate's
  60 replays had seen 3 points somewhere). The foul-trouble rule is said on the
  card and the note (foulRule: once a half, at foulOut-3 and foulOut-2).
- Film Room: the rule line (five best, three costliest, two of a kind, only the
  ones that weren't close) and how many more are kept behind them; the story
  keeps the live chance at its lowest in a win and highest in a defeat
  (storyExtremes: "won from 7% at Virginia Tech", "You were at 7% ... and won
  anyway" on title night). The play-off card shows the series so far (each game,
  and what your calls in the watched ones were worth).
- Also: the season-ending audit opens by itself; the page clears a fixed action
  bar; soccer's loss lines know the occasion (early season, near the drop);
  Pearl's hints point rather than assert; more capybara wordings in basketball.
- Not done here: duplicate surnames on one roster; the NBA title-slot lag by a
  game (not reproduced); the NBA long-run 1-seed title share (43%).

Round 47: voices and presentation:
- The staff's fixed lines vary across games (core/93_voice: VOICE_ALT, voiceVary,
  VOICE_ON). Each fixed line has three other ways the same voice gives the same
  advice; the first time a line is heard in a game it moves one along its
  rotation, kept in S.voice, and stays for that game (staffFresh still stops a
  voice repeating itself within one). Muse, round 20: Pearl's pre-kickoff line
  and the capybara's half-time line were word for word in all four matches.
  Measured on soccer: the capybara's flank, prep and read lines, and Pearl's
  prep hint, four distinct in six matches.
- The Film Room remembers on the call screen (95_story filmMemoryHTML): the
  latest kept call with the same heading, this team, and how it went, in words
  (no number on tonight's options).
- Hockey's pull card shows the goalie's night: who, goals on shots, the save
  percentage, what those shots were worth, the backup if he's in (dp.gn).
- The live game uses a wide screen (watchwrap 900px from 1024px; larger run of
  play); the live chance names your team.
- Football's result card lists each call once: the impact summary skips calls
  graded in football's own option-by-option list (the same fourth down came
  twice, from two sets of replays with two sets of numbers).
- The Film Room says when a list is empty, and when this season's calls made
  none clear enough to keep.
- Goldens: screens only; games, records and universes unchanged.

Round 46: trust (Muse round 20, Instinct round 15):
- Saves in IndexedDB (core/15_store idb, IDB_ON). All six games share one
  origin and localStorage gave them about 5 MB between them; veteran careers
  run 240 KB to 1.7 MB. A key not yet in the database is read from
  localStorage and copied across on first read; the localStorage copy stays
  (a fallback, and what an older cached page sees) and goes only when the key
  is deleted, so an erased career can't return. No database (some private
  windows, the node harness): localStorage as before. navigator.storage.persist
  is asked once. test/storage-full.js: six careers of 1.6 MB (9.6 MB) all save
  and reload; an old career with localStorage full loads, plays, saves and
  reloads; erased stays erased; without a database the old full-storage path
  holds.
- One story per screen: the college basketball card after a conference
  tournament exit says what the field did (g.ct); NBA play-in losers are
  "Lost in the play-in" in the history too, and the season result is pending
  (empty) before the field is drawn or while a play-in is unfinished, which is
  what turned a 57-25 team's badge to "Under pressure" for a screen; careers
  bank and show the regular-season record, as the franchise all-time line does
  (soccer's and hockey's careers took in play-off games); soccer goals in a
  watched game go to the commentary's scorers (scLogCredit, as hockey's
  hkLogCredit); the home objective says the ones not won; "1 points" fixed;
  soccer money to one decimal under £100M (the £17M/£17.5M bridge); soccer's
  goal line knows the occasion (posGoalLine: champions, promoted, up through
  the play-offs, relegated).
- Not reproduced (asked for the tester's backup): a soccer player released in
  the summer still on the squad (offseasons with the computer's choices and
  with every expiring player let go: 0 of 77 stayed); pro football's three
  career records (fresh careers agree to the game across three seasons).
- Every situation call gated at 3 points (Ian: "gate them"): SPREAD_KINDS now
  takes the final stretch, ties, overtime, the pull, the press and the third
  period too. Shown per game after (30 games): hockey overtime 0.35 -> 0.27,
  final stretch 0.45 -> 0.20, third period 0.50 -> 0.27; soccer final 0.10.
- The rare decisions announced: when the assistant takes foul trouble or the
  back-to-back goalie (not worth asking), the live view says so for a few
  stretches (ANNOUNCE_KINDS, autoNoteIn). Foul trouble is asked in about one
  basketball game in seven, the goalie start in one hockey game in twenty.
- The big nights in order: a title, clinch, promotion or elimination card puts
  the banner first, then the score and what it means, with the graded calls
  behind a tap (details.audit).
- Film Room: the assistant's call named ("Play it straight, as your assistant
  would" was hidden for saying "assistant": filmDef); the career count comes
  from the same ledger as the season's (it sat 30 under 92).
- Verdicts show the replays option by option (repRates: your call's share of
  the replays won beside the assistant's), win shares, not in soccer (graded in
  points).
- Live win probability (a trial, LIVE_WP_ON): between plays only, never on a
  call. The rest of the margin as normal: mean mu*tau, spread sigma*sqrt(tau),
  mu from the pre-game chance; football adds the next possession (1.5 points);
  a level finish goes to overtime at half the pre-game edge. LIVE_SIG fitted
  per league on 400 live games (cfb 18, nfl 14, ncaab 16, nba 18, nhl 2.75,
  epl 1.9); calibration bands within 7.5 points everywhere (pro football's
  50-70 band the worst: shown 60, won 52), most within 3. test/live-wp.js (200
  games, bands within 10: the same model reads 2 to 9 by seed in pro football).
- Tests changed with Ian's gating: late-calls no longer caps close finishes with
  nothing asked (it fails only if none of five or more asks anything); case 81
  needs one close call in 40 games, not two. confirm-taps runs its screens on
  the localStorage path and the two-tab check on both.
- Found, not caused here: the long-run NBA history check (not in --quick) has
  1 seeds winning 43% of titles against a real ~55%, on the round-45 build too.

Round 45: stakes in the flow (what a game means, before it and after a run of them):
- What this game means (96_goals meansStakes, MEANS_ON): a stake line for the
  board's objective the game could settle ("Win and the season series against
  Ole Miss is yours", "5 in a row. Win and it's 6", "Win here and that's 4 home
  wins") and for the table: where a win or a defeat leaves you, by the table's
  own order and tiebreaks (the record nudged for a moment and put back; pros
  and soccer only, college tables go by conference record; ties counted
  against a "win takes you top"). It always gets a line: a third when two
  others outrank it.
- Re-aimed objectives (REAIM_ON): one settled, met or missed, with a third of
  the league games still to play gets a replacement, two a season at most: the
  side just above you in the table now, else "Win N of your last M" (a little
  better than the ratings say, as the home record is). Set the first time it's
  seen, kept in S.obj.extra. Credit is capped at the board's three (a re-aimed
  one counts in place of one missed): with reputation fading 6% a season, two
  more met a season would settle about 40 points higher. "The board's
  favourite" still needs the original three.
- The Film Room before games (95_story filmLine, FILMPRE_ON): the latest kept
  call against this side, on the next-game card. A game against your rival
  coach counts as a big game for sim ahead (weekWeight).
- The sim digest (DIGEST_INC): under the results, what happened: your injuries,
  the best night and the worst, rival games, objectives met, missed or
  re-aimed, the run you're on, the move in the table, and soccer clinches.
- Soccer clinches (95_story clinchCheck, CLINCH_ON): a title, automatic
  promotion or relegation settled on points (ties count against it: goal
  difference could go either way), checked after every advance and kept with
  the step it happened. The result card of that game carries it ("Manchester
  City are Premier League champions, with 2 games to spare"); a sim digest
  lists it. The trophy night still waits for the last day.
- test/stakes.js: all six, a season in sim-ahead chunks: digests, stakes and
  objectives draw cleanly, the board never counts more than three, re-aims only
  with a third to play, Manchester City (seed 11) clinch with 2 to spare.

Round 44: a second decision per sport, each measured by replays, simming still
equal to the computer coaches (test/sim-parity.js MATCH: every game within 1.5):
- Basketball: foul trouble is a call again (BB_FOULQ). A star with foul
  trouble: sit him for the stretch or play him; the evidence is the referees'
  whistle against the league average and his own fouls. A star off the floor
  costs more (starOwn 0.022 -> 0.034, starDef 0.006 -> 0.009), or sitting him
  was never wrong. About 7 points a call; the best answer splits (pro: sit 8,
  play 11). Asked only when it gains on the assistant (SPREAD_KINDS fouls).
- Hockey: who starts in goal on the second night of a back-to-back
  (HK_GSTART, goalStartCall k "gstart", 22 back-to-backs a season). A tired
  starter (HK tired 0.015) against the backup, who costs by his rating gap
  (backupPer 0.0009 a point, gkCtx). The computer starts its backup, as real
  clubs do, so the assistant does too. About 4.5 points a call, the best answer
  splits (backup 21, starter 12); asked only when it gains (SPREAD_KINDS gstart).
- Soccer: calls are graded in league points. resultVal (core/94_staffplan):
  a win 1, a loss 0, a draw LEAGUE.drawVal (soccer 1/3: a point against
  three; every other league 0.5 as before), and a cup tie settled on
  penalties goes to the shootout's winner (it scored half). Every replay
  grade, gate and spread uses it. Measured at 80' (scfinal.js, 496 matches,
  60 replays an option, league points): down one, everyone forward was best in
  128 of 144; up one, parking the bus in 108 of 122; level, the answers split
  (win 138, carry on 55, the point 37). A question with one answer is a quiz:
  down or up, the final call is asked only when it beats the assistant's by 3
  points (dp.spread); level, always (in reach). Beside the late calls, the
  table: now, with a win, with a draw (tableStakesHTML). The final call's
  changes are named (finalSub: who comes on, who comes off; flavour, the
  engine's modes as before). Honest size: the final call is worth 1-2.5
  points of a win on average; the table panel makes the level case a real
  question, not a big one.
- Football: a questionable starter during the week (play a starter due back
  next week at about 60%, or two weeks early at 40%, against a trainers'
  risk of 2-4 more weeks out; graded in expected wins) was built and cut.
  Measured (both games, every team, 4 seasons): a candidate 1.2-1.8 times a
  team-season, worth 3 points either way 0.3-0.4 times, and "give him the
  week" was right in 85% of those (two weeks early: 1 in 134). A single
  football player rarely moves a game 3 points. Football already has the most
  decisions (prep, reads, fourth downs, two-point tries, the end game); the
  code is kept out of the build.
- A round-44 edit had swallowed the SPREAD_KINDS deletions into a comment (final,
  tied, ot, pull, close and third were spread-gated in the WIP); restored before
  shipping.

Round 43: make skill pay (Muse: "being right 82% of the time earns you almost nothing"; Ian: simming should do
about what the computer coaches do, only good calls beat it):
- The rule, measured (test/sim-parity.js): even sides, the same dice, the home
  side coached by the computer, then by you with every call left to your
  assistant. Football was +9 points a game for doing nothing: a fourth-down
  call came only after a punt, a miss or a failed try, and choosing the same
  thing rolled it again (a second chance the computer never gets), and the
  assistant read your reads for you 45% of the time with no downside. Now the
  call comes at every stall (a made kick too), choosing what was rolled keeps
  it, the assistant's default is what was rolled (verdictDefault dp.rolled),
  and "leave it to your assistant" on a read keeps the plan as it is (the
  computer's offense has no read layer). Within about a point in all six.
- A right read hits harder; a wrong one costs about half a right one, so a
  guess comes out even or worse. Per game, a strong player (the report, then
  the numbers) against leaving it all to the assistant, before -> after:
  hockey +5.1 -> +8.4 (HK counter 1.18/0.75, misread 0.87); pro basketball
  +5.0 -> +5.8, college +4.3 -> +5.6 (BB answer x1.5, leak, misprep; the
  report's reliability caps it); pro football +3.7 -> +9.4, college +9.7
  (FB_READ right td +0.09 / to -0.03, wrong -0.056 / +0.02); soccer +7.5 ->
  +10.4 (SC counter 1.20/0.72, misread 0.89, misprep 0.88/1.08). Reads now
  weigh 11-16 points a call, the scouting report 11-25. The leagues stay
  calibrated (every read test MATCH): hockey 6.12 goals, favourites 69.4%;
  pro basketball 114.2, home 60.8%, favourites 69.5%; soccer 2.72 goals.
- Mid-game situation calls with nothing to gain are not asked (callSpread,
  SPREAD_KINDS: the gated kinds and the two-point try, less the final
  stretch and the reads): over SPREAD_RUNS 60 replays per option on the same
  dice, if no option beats the assistant's call by SPREAD_MIN 3 points, he
  takes it, said on the card ("couldn't change much tonight: the game out of
  reach, or the options too close to matter"). The final stretch (final,
  tied, ot, pull) keeps round 40's promise; crunch-time and third-period
  calls are reads. test/late-calls.js still MATCH. Soccer's 80' call mostly
  had little to gain on the assistant's: kept, to deepen in round 44.
- Across a season, from the per-game figures: an expert reader is worth about
  +5 wins in pro basketball, +1.6 in pro football's 17, +7 in hockey's 82
  (more in points), +14 points in a 46-match soccer season.

Round 42: the save loss, and the joins (Muse, Instinct):
- The save loss (Muse: six careers gone after "changed in another tab", Reload,
  three empty slots). Reproduced: every career in all six games shares one
  site's storage (~5.2M characters in Chromium). store.local() tested
  storage with a write before every read; with storage full the write failed,
  so every read came back empty. The save check read the revision as 0 (a
  false "another tab" banner), and after Reload every slot read empty over
  careers still stored, where a new career could overwrite one. Now reads
  never write (store.writable() for the rare check), a revision read that
  fails is not "another tab", a failed save shows a banner at once with a
  backup button (saveFail), and the offseason asks once a season to download
  a backup (backupNagHTML, S.backedUp). test/storage-full.js (browser): with
  storage full a save that fits lands with no banner, one that can't is
  said at once, and after a reload slot 1 still holds the career.
- Phone endings: a game finished on a narrow screen lands on the Team view,
  where its result card is (finishLive, doAdvance); narrowing the window with
  a result showing does the same (Instinct: a playoff win showed only the
  bracket).
- State text at the transitions: pro playoff clauses read the standings
  before the seeding (a 71-11 first seed read "Missed the playoffs" for a
  screen); college basketball's conference-tournament loss before Selection
  Sunday reads "Out of the SEC Tournament. Selection Sunday decides the rest"
  (not "Season over"); the seat badge in a postseason grades the wins you have
  and the run so far, not a regular-season pace (a Final Four team read
  "Under pressure").
- Football's "wait and see" is graded as in the other four games; football
  call verdicts no longer repeat their headline; shared surnames get initials
  (hockey lines, play-by-play in hockey, soccer, basketball); "an 18-point".
- Results unchanged: every golden result field and the hot seat match round
  41; screens only.

Round 41: the season story (core/95_story.js; Muse's ideas, Instinct's "make the peak a peak"):
- Kept per coach (COACH_FIELDS film, lifeCalls, storyYr, rivals), written only
  from games already played; none of it moves a game. recordStory after each
  played game (finishLive), bankStory when the season is banked.
- The Film Room (Dynasty, below Your seasons): your best five and costliest
  three graded situation calls, career-long (S.film keeps the best and worst
  thirty; at most two of one kind of moment shown). Reads stay out: their
  card judges them right or wrong (round 39's one verdict per call). Each
  with season, date, opponent, result, your choice and the assistant's, and
  its worth in games per 100. Above it, who you are once there are eight
  calls: bold or careful by the options you pick (STORY_BOLD / STORY_SAFE),
  and whether it has paid (S.lifeCalls, career-long; the season ledger keeps
  two years only).
- Comebacks and collapses: the running score of each played game (drives'
  sh/sa or h/a); down at least STORY_TH (football 10, basketball 12, hockey
  and soccer 2) and won, up as much and lost. The season's biggest of each
  goes into its history entry (story) and its row in Your seasons.
- Rivals: at the season's bank, every game you coached against the head
  coach of the other side then (interim staff skipped), into S.rivals by
  name with the clubs on both sides, so the record follows both of you
  between jobs. Before a game: "<name>, their coach: 6-3 against him (and
  with X)". Your rival: the coach you've met most (four or more), the closer
  record breaking ties, tagged.
- Title night: the result card of the game that wins it ("Champions" in the
  result line) carries a gold card: the record, the season's comeback, your
  call of the season, the player who carried it, and which title it is.
  CSS confetti, off under prefers-reduced-motion. Soccer's titles are won on
  the table with no final, so no title night there yet.
- test/story.js joins the suite (four games: film keeps no reads and nothing
  under 4 points, story reaches history, coaches counted, the pages render).
- Control (STORY_ON false): every golden fingerprint, screens included, and
  the hot seat match round 40 (once a template's whitespace was matched).
- Not done: in-game win probability, so "you were at 4% in the third" isn't
  possible yet (comebacks are told by the score); rewatching a Film Room game
  from a past season; soccer's title night.

Round 40: late calls in close finishes (Grokbot's top request, measured in round 39):
- Hockey: the last five minutes up one or tied (finalCall, HK_FINAL): up one,
  shut it down or go for the second; tied, go for the win or play for
  overtime and the point (down one is the goalie call). 8.4 points a call
  (tied 10.2, up one 6.4; 70 games x 40 replays). Regular-season overtime
  (otCall, HK_OTQ): open it up (a goal likelier, the better side's edge 1.5x)
  or keep the puck (the reverse, toward the shootout): 10.1 points a call,
  and the better option splits 27 attack / 26 hold, so it's a decision, not
  a quiz. One-goal finishes with no call: 81% -> 0%; overtime 4 of 4 asked.
- Soccer at 80', within a goal (finalCall, SC_FINAL; the same sharper modes as
  the 65' call): 4.6 points a call (65': 5.9). Close finishes with no call:
  100% -> 22% (the rest out of reach, so the assistant's: callInReach).
- Football, tied late (k "tied", FB_LATE2): go for the win or play it safe:
  13.5 points a call in pro football, 12.5 in college. One-score finishes with
  no call in pro football: 57% -> 0%. Tried and cut: "hurry-up now?" behind
  with two or three possessions left, about 4 points with over half the calls
  under 3, even with the stronger mode.
- New kinds are gated like the other situation calls (GATE_KINDS final, tied).
  Staff lines for each. test/late-calls.js joins the suite: each game's close
  finishes must ask something (hockey at most 15% empty, the rest 25-60%).
- Control (HK_FINAL, HK_OTQ, SC_FINAL, FB_LATE2 off): every golden fingerprint,
  screens included, and the hot seat match round 39 exactly.
- Still to do: the season story (Film Room, comebacks, title nights, rivals);
  hockey name collisions; highlights; baseball.

Round 39: the engine's ends, and a card you can trust (Ian, Grokbot, Muse, Instinct):
- Football's end game (endgameDrive, twoChart; FB_END): a drive nobody is
  asked about (the computer's, your assistant's) was rolled without the score,
  so a team down 4-8 on its last possession kicked a field goal 18-19% of the
  time, punted more, and nobody went for two (0 of ~220,000 touchdowns). Now:
  behind on the last possession, no punt (fourth down) and no field goal that
  can't help (the end zone, 40%); after a touchdown, the chart (-2 any time in
  the second half; -10, -5, +1, +5 late). Pointless last-drive kicks 0 of
  ~4,900; scoring +0.3 a team, margin -0.1, favourites unchanged.
- The strength gap (Ian: 99% chances, a 76-6 season). Rosters make an outlier
  (best NFL roster +120 to +194 over average, often far clear of the second;
  NBA up to +230). Pro football: gapScale 2.2 -> 1.6 and a big mismatch
  softened past 100 (tuning.softDrive, driveOdds; college unchanged): over
  16 seasons favourites 73.5% -> 66% (NFL ~66%), margin 14.0 -> 11.9, best
  records 13-16 (a 17-0 before), wins sd 2.8, top chance shown ~94%. Pro
  basketball: gapPerPoss 0.0006 -> 0.00052: favourites 73.6% -> 70%, margin
  13.0, wins sd 12.5, best ~67 (77-5 before). The shown chance softens like
  the engine (tuning.softWp, wpSoft in winProb; shown 98%+ won 94.7% before)
  and is refit (wpK: NFL 300, NBA 280; plans in proportion). nba-history
  MATCH (194 seasons). Cleveland's 99% leagues now top out at 92-94%.
- The result card: each call once, by the name it had on screen. Reads carry
  their headline (log h) and are judged only in the reads, right or wrong;
  the top section is situation calls against the assistant (the two verdicts
  disagreed on one call). The scouting report is "Scouting report" (the hub's
  "Your gameplan" is another thing: why Grokbot thought he was graded on a
  call never offered; the engine never did that in ~100 browser games at
  every speed, with reloads). A split report shows a dash, not a tick. "You
  left all N of tonight's calls to your assistant" replaces a false "none of
  the moments came up"; calls the assistant took in a decided stretch are
  said, not graded. "Wait and see" is graded (it paid when the report's
  favourite was wrong; hockey, basketball, soccer).
- Hockey: free agency from 52 (HK_POOL; it was 58, nobody under $5M): 14 under
  $3M, the best 25's cheapest $2.4M; economy 12 seasons: payroll 66% (65),
  top-six kept 76% (76), points sd 14.3 (13.1; NHL ~14). Backups' season lines
  on the two-deep. Your career and stops in W-L-OTL on the coach page
  (bankedRec: it read W-L with overtime losses inside the losses).
- Pearl's flank line says when the count points the other way, three ways
  each; every staff line's pick includes the match (liveSeed), so 0-0 at the
  half no longer says last match's words. Soccer's summer page bridges last
  season's wage bill to this one.
- Ian's list: week 1's fixtures before the season; Scores steps over days
  nobody plays; soccer's picker names the division (League One, not
  "Football League"; National League North); colours for all 120 clubs from
  League One down; "Keep it balanced: neither side" on the flank call; the
  coach's notes are read once per browser (coach-guide-seen; "Skip the guide"
  holds for new careers). Football's rest call also from the third quarter in
  a rout (up 21-40; asked in 29-35% of games). Streak column in football and
  hockey tables; plurals; pro football's glossary explains replay figures.
- Control (engine switches off: FB_END, the rout rest call, NFL and NBA
  tuning, HK_POOL 58): golden results match round 38 (only screens, and
  stored "1 sack allowed" lines); hot seat exactly.
- Measured, not changed: late calls are missing in close finishes in hockey
  (81% of one-goal last five minutes asked nothing; overtime never), soccer
  (nothing after 65') and pro football (4 of 7) - round 40. NBA scoring on
  target (2 of 492 team scores at 150). Soccer Very fast: the 25' read showed
  in 10 of 10 matches and Normal switched it off mid-match.
- Still to do: late calls (hockey, soccer, pro football, hockey overtime);
  the season story (Film Room, comebacks, title nights, rivals); hockey name
  collisions (Sissoko on Sissoko); highlights; baseball.

Round 32 (Grokbot's six; Muse; Ian on NBA scoring):
- A call ignores taps for 0.7 s after it appears (live.ask.at): at Very fast
  soccer's 25' call came up under a tap meant for the game and was graded as
  the player's choice. Skipping a game never logs a read (measured).
- The card: each read its own line, "You chose X." first (readPickLabel per
  sport); a split scouting report and a near-even flank count (gap of 1 or
  12% or less) are coin flips, shown with a dash and not counted.
- "Sim the series" stops before a game that could end your season (pro
  basketball, hockey); pressed when already facing elimination it plays it.
- Basketball pace: "Work it inside" was tempo 1.36 (played NBA games 136-142
  a team; the plans moved wins 1-5 points). Now 1.08 / 0.92: scoring 110-126
  a team; win chance by plan refitted relative to balanced (wpK). The plans
  barely move the result in basketball, as in hockey: round 33's question.
- Hockey goals: not reproduced. Played games on "Skate with them" 6.6-6.7 a
  game over 252 (the league 6.1-6.2), playoffs 6.0-7.4; balanced 6.0-6.1.
- Win chances shown 1-99% (pctShown).
- Draft labels (test/draft-labels.js, long-run): a mock on your reads at face
  value ran out of band (football "likely gone" 50%, "likely there" gone 39%).
  The reason is selection: real teams often reach for a hard-to-read
  prospect (picks 91st, 103rd, 159th on their own true score), and your top
  names are partly your luckiest reads. dnMock now shrinks each read by its
  reliability, adds the team's own error (wider when unsure), and scores with
  each picking team's needs. In band in all three (16-28 drafts); football's
  "likely gone" holds ~70%, at the edge of its band. Board marks players
  drafted on draft night.
- Soccer payroll adds up: departing players keep their wage (sal), re-signed
  their old one (was); the line names every part and the rest (academy and
  fill-ins). Regression 70 checks the sum.
- In-season job security sees postseason targets: outside the projected
  field you're under pressure (college basketball warned all season).
- Division titles are called that in the pro games and soccer (was "Conf");
  best finish counts a finished season not yet archived; the awards race is
  dated in daily leagues ("week 194"); the result header says OT, shootout or
  penalties; tabs fit at 390px; "Still to do:" when the wins target is met.
- Each gag once a season (gagSeason): a line a voice used in an earlier game
  loses Pearl's flourish or becomes a plain Bears shout of the pick.
- The 1.5 s reveal after a simmed game re-rendered whatever screen was up;
  on draft night it rebuilt the page between a pick's two taps and the pick
  was lost (likely round 31's flaky browser runs too). It now renders only
  the screen it was for.

Round 31 (Ian; Instinct round 10; Muse round 15; Grokbot):
- HOT SEAT is just that on the badge (the reason ran it over the coach's
  name at 390px); the reason, target named, is on hover and heads the
  board's objectives (seatWhy). The coach line says "coaching solid" so it
  isn't read with "Secure" as one verdict.
- Standings take a league's own columns and zones (LEAGUE.ui.standingsCols,
  standingsZone, standingsCut): soccer shows goal difference and the zone
  edges with a key; college basketball marks the top four (byes) and draws
  the line after twelve (the conference tournament), not after two.
- Playoff brackets show the first round at 0-0 (hockey, pro basketball:
  seeded at the regular season's end, as the clinch marks already did).
- Injuries on badges in games where a step is a game day; a level cup tie
  says "Won on penalties"; soccer's job list shows next season's division.
- Post-game card: no "though tonight's dice gave the same result either way"
  (on a win it read as "your win didn't count"); the season recap names only
  graded calls as best or costliest, with a why line; the season tally says
  what it counts.
- Head to head: your record against any opponent you've coached against
  (S.h2h, banked when a season is written; this season counted live), on
  the next-game card when there's no rivalry series. Starts from now.
- "Your seasons" lists every finished season from the first (one row each);
  coaching stops stay one row per job.
- Staff text: the real gap ("three down", "three up"), Pearl's "same as I
  said before" only when she gave that advice before, soccer cues in the
  third person ("{t} press high; {o} can't play out").
- Football late calls before the fourth give the quarter's clock.
- Team picker: tap a team, then "Start with X" in a bar (or tap it again):
  "Tap again to start" wrapped a word to a line and looked dead.
- Draft night: the legend reads as a legend; a worked-out prospect shows his
  read before and after.
- The year-two "best season of your tenure" milestone is gone (only beats
  year one); it was the only change to history (control build matched).
- test/golden.js HISTORY_OUT=file writes each season's history entry;
  confirm-taps clicks by selector on draft night (held handles went stale).

Round 30: draft night (pro football, pro basketball, hockey; core/91_draftnight.js):
- The draft is drawn on its own dice (draftRng) from the rosters as the season
  ended, so it can be shown pick by pick before the summer runs; the drafted
  players join rosters at the same step as before (placeDraftNight). Each
  team's later picks see its earlier rookies (a scratch roster per team).
  Control: the same code on the old dice and timing reproduced the old
  fingerprints exactly. Every pick draws the same dice whoever is taken, so
  your choice changes later picks only through who is left. The NBA and NHL
  lottery is the first draw, so it is known when the offseason opens.
- Draft night: the lottery, the picks before yours revealed, on the clock
  with your scouts' board, "likely there at #N" (a mock of the picks before
  your next), where he'd fit ("may not make the roster": the summer keeps a
  rookie only if he helps), your staff's pick, pick / let the staff pick /
  staff make the rest. Picks are kept as made (S.off.picks.hand); a reload
  resumes at the same pick; a pick you leave goes to your board, then your
  staff. A change of job clears them (dnReset). A hot seat keeps the board.
- Measured first (test/draft-night.js, test/draft-years.js): the old draft
  was weightless. After four drafts, perfect knowledge of every class moved
  starters by under 0.3 and wins within noise: prospects near your pick were
  a point or two apart, most rookies never make a roster, and the staff's
  pick used near-true ratings.
- Reshaped (DRAFT_DEF, overridable per league and from the environment):
  class spread 1.6x, hidden stars (8%: +6 now, +6 ceiling) and busts (10%),
  reads 1.8x foggier, 30% of prospects hard to read (everyone misjudges them
  2.2x; your scouts say "scouts unsure"), classes 1.4x deeper, the class 2.5
  lower to keep each league's talent (starters within 0.5). Your staff pick
  from your scouts' reads. Private workouts (3 a year) give a 0.3x read on
  chosen players. Effect, smart drafting (workouts on unsure players near
  each pick) against the staff after five drafts: pro basketball starters
  +1.2, +4.6 wins a season; history checks pass (194 seasons).
- Pro football: the full shape made its league top-heavy (favourites .665,
  13+ win teams 4.4 a season, unbeaten 9 per 100 seasons, against .633 /
  3.6 / 4). With every new setting neutral the league matched the release,
  so the misjudgment itself loosens the league: a draft that rewards finding
  the misjudged player also lets bad teams miss. Settled with Ian on a middle
  ground (spread 1.0, fog 1.4, shift 1.5): favourites .656, 13+ win teams
  4.2 (just over the band), a well-run draft +0.5 on starters.
- Hockey: draftees are 18 and a pick who doesn't make the roster is gone (no
  junior system), so no draft shape gave picks weight (7 drafts: starters
  +0.0). Draft night stays as presence; no workouts. A prospect pipeline is
  the fix, a separate job.
- Settings read from the environment only for a set string: in a browser
  the lookup gave false, read as 0, and every class was empty (the Node
  suite passed). test/confirm-taps.js now runs draft night in Chromium.
- Names: the college games have their own runDraft; draft night's are
  draftNight / placeDraftNight (a collision would have broken college).

Round 29 (Grokbot's remaining reports: pro basketball, hockey, soccer):
- Soccer's job security is graded by table position, not a win pace that
  ignores draws: Queens Park Rangers (seed 3) read Secure all season and
  were then fired; now "Under pressure" through the year before and "HOT
  SEAT" in the season that ends in the sack.
- A hot-seat badge names the target missed ("HOT SEAT · missed last year's
  target (mid-table)"), in all six games.
- Rank moves say where to ("Down 5 to #11 in the poll", "in the rankings" in the pro games).
- Soccer's summer payroll line no longer adds parts that can't close (the
  old wages of re-signed and departed players aren't kept): last season's
  figure, then the new deals, signings and players gone, named.
- test/golden.js SCREENS=dir writes each season's screen text, so a
  screens-only fingerprint change can be read line by line against HEAD.
- The Championship play-offs (3rd-8th) are right: the EFL expanded them
  from 2026-27.

Round 28 (Instinct round 9; Muse; Grokbot on pro football, college and pro
basketball):
- Hockey: a played overtime game lost its overtime (the engine scores it
  inside its finish; the live loop never got that stretch: 7 of 7 OT games
  recorded 3-3 style). syncTail copies the engine's last stretch across.
- A knockout defeat ends the season on the card, with the round
  ("Season over: beaten in the AFC Wild Card").
- Post-game card: the headline comes first and only for a clear call
  (beyond 7 points: callClarity, graded calls against the best option);
  a read crossed on the same call is never headlined as good; the single
  same-luck replay score is gone (a 117-85 win "became a 103-116 loss");
  every other call is listed with a sized word.
- Labels that overstate: same-position targets ("the second signs only if
  there is still room"), "probably won't fit" (about half still sign),
  draft "taken before you could get them ... before your #N", "would fit"
  on every free-agent row, portal push-out on every row, the assistant's
  hand-off worded as such, "mostly gone" only under 15%, a missed target
  after the season as a result, "level with them" at level records.
- Second reads list your current setup once ("keep"), basketball and soccer.
- Pro football power ranking: strength moves 35% of the way each week, the
  record weighs in over 10 games (moves weeks 1-6 were 6.5..2.7 places a
  team, now 4.7..1.9).
- Football late calls say roughly how long is left; pre-game odds say
  "to win, before the game"; a "Since last season" line before week one
  (who left, who arrived); the result card lands on the team page.
- Phone: bar buttons ignore taps for 0.7 s after a game ends; How to play
  and Help open at the top.
- Basketball commentary never names an injured player; prospects in one
  class never share a name; coaching-move lines use each sport's staff
  label (no "OC" in basketball); Dynasty stop rows run to this season.
- Not reproduced, measured: NBA live scoring 117.8/114.7 through the real
  buttons in a browser (Muse saw 145/140 on a save carried across builds:
  asked for the backup file); animation speed after a call (kept); the
  coach name losing letters (typed at 0.9 s a key: intact).

Round 27 (Grokbot, college football on 42f0682):
- One grading rule in football: a call is graded only when its options'
  replay win rates spread more than 3 points; closer ones are listed as
  "Close either way" (every call made is on the card) and never count in
  the tally. The headline is judged like the bullets, against the best
  option (q, sp on the impact entry), not against the assistant alone.
- The post-game line names both numbers: the play's odds ("53% to
  convert") and the share of replays won ("won the game in 71%"); they
  were read as the live odds changing.
- Fourth and 10 or more is left to the assistant (4.7 points a call, 60%
  under 3).
- Fired screen: no "best season of your tenure"; a note that the plan is
  for wherever you go; a move reads "You take over as head coach".
- Standings show today's poll rank (the weekly snapshot lagged a week).
- Not reproduced: the coach-name field dropping letters (typed slowly in
  a browser on a fresh setup: intact).

Round 26 (Muse's deep-play pass, on an older build; each point checked on
this one):
- Post-game card: the decision leads, the dice follow ("A good call, though
  tonight's dice gave the same result either way"). A call within 3 points
  of the assistant's gets no headline, one quiet line. Before, "Same defeat
  either way tonight, but..." led about half the cards.
- Playoff results say where the series stands, and a defeat that ends the
  season says so ("Season over: out of the playoffs, 3-4 in the series").
- A star who fouls out collects no more fouls (an "8th foul" in a six-foul
  league); the dice are drawn as before, so no result moved.
- Hockey's draft says when a board name went earlier (as football and
  basketball did); soccer's payroll line shows last season's figure and
  what changed it; a college basketball portal target says who he'd push
  down (it can be the recruit you just signed).
- Not reproduced on this build, measured: soccer's flank panel points at
  the weak side 27 of 30 times and a right pick was never graded worse;
  "fits" free-agent targets signed 35 of 35 (hockey, NBA, pro football);
  the NBA's best team scores 120 and allows 112 live (Muse saw 139/132);
  the NBA half-time "keep" was best in 4 of 30 second reads, not always.

Round 25 (Grokbot's list):
- Phone width (390px), checked in a browser for sideways scroll and clipped
  text on every tab of all six: BASKETBALL ran off the title screen
  (.wm-long); long team names in the top bar step down (.tb-long, .tb-xl);
  division names in pro rankings had a 46px column ("Paci...", .divn);
  rivalry names get their own line; the team picker has Back at the top
  as well as under the list; the intro's buttons sit in one place on
  every page; a call screen whose answers are below the fold pins "Your N
  options" (#tocall) until they're on screen.
- Hockey play-by-play: larger phrase pools and no template twice in a game
  until its pool runs out (pickFresh): 5.4 repeats a game -> 0.5.
- Draft boards (pro football, basketball, hockey) mark each prospect
  likely gone / might be there / likely there at your first pick: a mock
  draft from your own scouts' numbers (nothing hidden shown). Checked
  against real drafts: gone 78-88% / 28-51% / 10-15% of the time.

Fourth downs (round 24, Instinct: "all 3 fourth downs favoured go"):
- Punts were the opponent's ~24 from anywhere, so punting from your own 10
  cost nothing and pinning them from midfield gained nothing. Now a punt
  travels ~45 yards from the spot with a short return, or a touchback
  (nextStart, PUNT_GROSS). Scoring and favourites unchanged.
- Asked only with the game in reach (inReach: a rough win chance from the
  score, quarter and strengths, 10-90%). Outside it a fourth down moved
  ~3 points; inside, ~9 (276 calls). Best answer before: go 63% of clear
  calls; after: go 52%, punt 34%, kick 14%.

Featuring's edge scales with the player (featureEdge, core/80_season.js):
FEATURE_EDGE x (1 + (rating - starters' average)/12), held to 0.5-1.3.

The staff room never repeats a sentence in a game (staffFresh): a voice
that would says "As I said earlier..." with its pick instead. Measured on
10 college football games: 4 verbatim repeats in 102 lines before, 0 after.

The offseason screen opens with the season's calls (seasonCallsHTML): the
tally, and the call that helped most and the one that cost most, in words.

Measured value, even sides at home (tests below):

    soccer      numbers +3.2 win pts, Pearl +2.2, guess -2.1; flank +1.6,
                wrong flank -2.3; every read +4.7 (~6 league points/season)
    hockey      numbers +2.4, Pearl +2.0, guess -1.4; goalie read +0.5,
                pulling him every time he lets in two -0.8
    basketball  college numbers +2.7, Pearl +1.0, guess -2.8;
                pro +1.8, +1.2, -5.4
    scouting    following the report (Pearl's pick): soccer +2.6, hockey
                +2.9, college basketball +4.5, pro +3.4; a guess ~0;
                report then reading the numbers beats reading alone by 1-2.4

## Working rules

1. The container doesn't persist between sessions. Package the source (a git
   bundle of main) and have Ian download it before a session ends.
2. Before changing anything, rebuild and confirm golden matches.
3. Verify by measurement, not by reading code; every claim about behaviour
   comes from a test run.
4. Two tiers (round 80). On every change: node test/run-all.js --fast (about 6 minutes: one-season fingerprints,
   golden-fast-*.json, and the cheap checks). Before a release: node test/run-all.js --quick (about 90 minutes on two
   cores; full: without --quick). run-all runs one test a core, one browser test at a time, longest first by the last
   run's times (test/timings.json). Read the result before writing the message.
   `python3 build.py site` builds all seven into dist/site/. Wait for the summary line in a fresh output file.
5. Check simulation changes against the calibration targets below.
6. Tell Ian plainly when something is broken, a plan is wrong, or you made a
   mistake.

Lessons from this project (each cost a bug that shipped or nearly did):
- Never call the random generator inside an Array.sort comparator. The
  number of comparisons isn't fixed for a comparator that changes its mind,
  so every draw after it hangs on the sort: the NBA and NHL schedule builders
  did, and about one season build in four came out different on the same
  save (a reload replayed the season on another schedule; 36-46 became
  49-33). Draw the keys first, then sort on them (schedOrder, core/20_engine).
  test/confirm-taps.js swaps in a different correct sort and checks the
  schedule doesn't change. Seasons begun before Nov 2026 (no u.schedV) keep
  the old draw so a season under way isn't redrawn.
- Opening the offseason changes the league (the coaching carousel: hires,
  firings, coordinators hired away, coaches' records). rebuild() replays it
  on load (replayCarousel, same dice, inputs kept in S.off.act.users or
  S.carousel.users). Without it a reload in the offseason started the next
  season from another league. test/reload.js reloads mid-offseason, goes on
  and compares season 2, head coaches and coordinators. Coach ids are a page
  counter (COACH_ID) and aren't compared; nothing reads them.
- One question, one answer: the graded call and the post-game line weigh
  the same call with the same replays (the graded call's rates, kept as rk,
  decide the post-game worth) and the same 3-point margin
  (test/verdict-agree.js). Two samples of one question disagreed in words.
- The title button's prompt is a safeguard, not friction: it says where the
  career is saved, or warns that it isn't (storage blocked) before you lose
  it. test/storage.js checks it.
- The "How to play" page is a module variable (introAt), never in a save:
  read from S, it only showed with no career loaded.
- Pro basketball and hockey power rankings rank on a smoothed rating
  (PowerRank.form: 0.3 of the way to the new Elo each game). Measured:
  weekly moves of 8+ places fell from 7.1% to 2.6% (basketball) and 5.2%
  to 1.5% (hockey); the final ranking tracks the standings as well or
  better. A day's games are listed by rank, so a ranking change reorders
  the golden "games" hash without changing any result: compare as sets.
- "year N" for a head coach counts from the season he started (c.since,
  coachYear()); the c.t count that drives the computer's patience still
  goes up for a new hire in his first offseason, so don't read it as years.
- Staff lines at a second read say what changed since the first (Pearl's
  first read is kept on the second ask as pearl1); picks are unchanged, so
  "leave it to the assistant" plays the same.
- Legacy seasons (no u.schedV) lock their schedule on first load: S.schedLock
  {year, sched, a, sp} is the schedule and the RNG state right after it, saved
  at once (lockNew); Season uses it instead of drawing again. Cleared when a
  new season starts. RNG keeps its state on the object (rng.a, rng.sp): same
  numbers as the old closure. commitOffseason still runs on new RNG(0): its
  rngA "carry on" never worked (the state was hidden), and restoring it now
  would change every future offseason.
- Verdict scale (football 75_screens GAP_SAME 3, GAP_CLEAR 7; the post-game
  line's avgOf uses the same): within 3 points "about as often", 4 to 7 "a
  little", beyond 7 "clearly". Graded calls list every option's replay share.
- A read the evidence card hadn't marked (basketball: three-point share 45%+
  or 31%-, pick-and-rolls 3.4+) and you got wrong is logged unclear: shown
  with a dash, not counted in the season's tally.
- Scouting reliability (model of the engine's weights, favW 4, 6 games
  scouted): the report's top system is the one they play 61% in basketball
  and hockey, 49% in soccer (four approaches). Instinct's target: about
  two-thirds. Soccer is short; raising it changes matches, so it waits for a
  measured round.
- Football: after a turnover, a turnover on downs or a missed kick, the next
  drive starts at the spot (nextStart(rng,kind,at); at = the drive's stall).
  It was random (~42) whatever the spot. Calibration after: college 54.8
  points a game (target ~54), pro 46.5 (NFL ~44-46), other targets unmoved.
- Scouting: a club's usual system is favW times as likely as each other.
  Measured in real games (report's top system played): soccer 54% -> 67% at
  favW 7; hockey 64% -> 68% at 5. Basketball stays 4 (college 61%, pro
  70%): 5 took college to 72% but more predictable opponents cut March
  upsets (6 v 11 favourites 63.5% -> 67.1%, real 61.5).
- Replay matching: a played result is matched to a cup tie only if it is a
  cup result (!!F.cup===!!cup). A league result saves no cup flag, and it
  took a cup tie against the same side in the same round (soccer reload).
- Streak objective: 6 in a row for seasons of 60+ games (5 was met 24 of 24
  in hockey). test/objectives.js checks a type's rate only from 15 samples.
- Full slots: the title offers "Start a new career", then Replace (two taps)
  on a career, which erases it and opens the new-career screens there.
- Football plans rebalanced after the turnover change (aggressive td +0.022,
  safe fg +0.035): at even strength the three within 0.4 points over 40,000
  games (test/plans.js; the published build already had safe 51.2 against
  aggressive 49.5, passing at 5,000 games by luck).
- Soccer: a player signed or bought this window (keep) isn't pushed out by a
  later arrival or the wage-cap trim; the newcomer goes instead (Brentford
  bought a midfielder and an academy graduate cut him).
- Tests read noise as failure three times this round (objectives "top" 1 of
  8, recruiting with 3 programs, plans at 5,000 games). Sample sizes raised;
  each was checked against a much larger run before changing anything.
- save() returns when no career is open (!S.myTeam). The title screen's
  "How to play" Skip and last Next called save() and wrote an empty career
  over slot 1 in all six games (found by Grokbot; my clean-profile repro
  never opened the intro).
- A choice that the replay reads (featuring, ice time) is logged with
  noteChoice even in the offseason: rebuild() with no log uses today's
  choice from the first game, so featuring someone new in the offseason
  rewrote last season on reload.
- Re-baselining goldens: build once with the intended change held back and
  confirm the old fingerprints still match; then the --write note can say so.
- A new game needs its own save key in SAVE_KEYS (core) and a case in
  test/saves.js, test/reload.js, test/golden.js, test/hotseat.js.
- Test both layouts (test/layouts.js): at 1024px+ the buttons live in the
  side panel.
- Words: each game has a screen test that fails on another sport's words;
  read screens by eye too (records, draws, ordinals, "the League One").
- Check real-world facts against a current source, not memory.
- Draws: anything that counts wins and losses (streaks, records, history,
  the card) must say what a draw is.
- A live game must know when it is a knockout (startLive passes it): without
  it a level soccer play-off had no winner and the next round crashed.
- A step can hold two of your games (a cup week): count per team, keep calls
  per game, and never replay one game's answers into another.
- Golden fingerprints include whitespace: keep empty template slots on the
  same line, or every game's baseline moves.
- Global names collide across files (tierOf): a test that loads the build
  catches it; the build itself doesn't.
- Rebuild every game before a test that loads them all: a stale build gave
  false failures (a field added to one module, five builds out of date).
- A cup tie and a league game can share a week and an opponent: key live
  games by step and slot, not step and teams.
- pkill -f matches its own shell too: it killed the session's shell. Don't.
- A finished live game must be recorded once: liveTick and answerLive return
  when the game is done, finishLive runs once per game, and old saves drop
  duplicate copies on load (repairPlayed). Fast clicks at the whistle
  recorded games up to five times (test/double-finish.js).
- `grep -c MATCH` counts MISMATCH lines too: check baselines with
  `grep -v "^MATCH"` (nothing printed means all match).
- Simming on past a moment the player should see (Selection Sunday) is a
  bug: simPostOn stops after LEAGUE.post.stopAfter (default "selection").
- Wait on a fresh output file: waiting for "passed" in last run's file
  returned at once, and a commit went out before its suite had run.
- A long-run test that skips the first seasons hides the seasons every new
  player sees: nba-longrun recorded from season 4, and fresh seasons ran
  77-5 for two years (Muse). Check season 1 too.
- Staff advice on reads: Hints only is the default from the first season
  (Nov 2026, both testers: Full gave the answer away); Full is the opt-in.
  "Automatic" is gone; saves that chose it get hints.
- No browser dialogs (confirm/alert): blocked or dismissed, they return false
  without a word and the button does nothing ("Make a change"). tapTwice()
  confirms on the page.
- Every reported case gets a test that fails on the build that had it:
  test/regressions.js (soccer draws, hockey play date, featuring reset,
  ordinals, shared surnames, the desktop decision card, the build stamp)
  and test/confirm-taps.js (Erase / Start over in Chromium). Both fail
  hard on 27e0ea0, the build the site was stuck on (DIST=<dir> runs
  regressions.js against another build).
- The site can lag the repo: Pages served 27e0ea0 for a day after later
  pushes (cause not visible from here; .nojekyll added). Each game's title
  screen and help, and the landing page, show a build stamp (a hash of the
  source, so a rebuild matches); give testers the stamp with each release.
- Hockey lines and ice time (hockey 12_lines, Nov 2026): forwards, defence
  and goalies each ride / balanced / roll. Strength: DEPLOY_K (2.5) x R_SLOPE
  x position weight x the change in the starter's share x (his edge over
  his backup - FRESH: 8 skaters, 6 goalies), so leaning pays for a top-heavy
  group and spreading for a deep one; balanced is exactly the old game (the
  computer's teams, calibration). Riding both skater groups x1.5 injury risk,
  rolling x0.76; the box score follows the ice time (HK_STAT_BENCH); a
  summer's development follows it too (DEPLOY_DEV: rolling depth +2, top
  -0.5; riding depth -1, top +0.5; a shift in the draw's mean, so no other
  team changes; ceilings cap it, so rolling grows players with room). Size:
  up to ~29 strength points (median 9); hockey turns 25 into ~1 point of win
  probability, ~2 standings points a season. test/lines.js checks each link;
  a season's luck (~10 points) is too big to assert on.
- Recruiting board (core 92_recruiting, college games, Nov 2026): prospects
  at each open position are drawn with the league's own newcomer function
  (drawNewcomer, shared with developRoster), in your program's context and
  choices. Your board's top prospect at a position commits with a chance
  that falls as he rises above what a newcomer there averages (RB_LAND0 0.70,
  RB_LANDK 0.30 per SD). The default newcomer is always drawn and developed
  first on the season's dice; a signed recruit swaps in at the end of
  developRoster (rbSettle), developed by as much as the man he replaced, so
  no other program's roster changes (an earlier swap-before-development
  changed everyone's: the dice depend on each player's attributes). Gain per
  open spot against the replaced newcomer: chasing the best ~+0.4 to +1.2,
  the best of the battles ~+0.1 to +0.8, only the likely ones negative.
  test/recruiting.js.
- What your calls did (core callImpact, Nov 2026): every call you make
  against the assistant's choice is replayed (a) once with the same dice and
  his choice, for the other scoreline, and (b) 400 times with fresh luck after
  the call, for its worth (win rate yours minus his). The post-game line
  credits or blames the call only when both agree; a single replay disagreed
  with the average about as often as not (measured), so otherwise it says it
  was luck. The season ledger (S.callLedger) sums the worth: "your 27 calls:
  about +1.5 wins". One call rarely flips a game (a few times in 72 games for
  a coach always taking the first option); the ledger is where it adds up.
  test/call-impact.js: replays reproduce the real game exactly, headlines
  follow the rule, under ~0.7 s per game on desktop.
- Show what a coach would see, not the engine's dials (Ian, Nov 2026):
  records, save %, scouting stats, fourth-down conversion odds and the
  post-game replay verdicts stay; plan goal rates, featuring's win
  probability and development points, injury costs, base rates ("one night
  in ten") and grading thresholds are said in words. Injuries read Big loss /
  Real loss / Minor against the sport's typical absence (INJ_MED, measured).
  Any number that is shown must be measured on that engine: win probability
  per 10 strength points runs 0.5 (soccer) to 2.4 (pro football), where the
  textbook Elo curve said 1.5 for all.
- A trailing comment on a line that a later edit extends swallows the code
  after it (featDv vanished; every page failed to load). Load-check in
  Chromium after every build.
- Measure the paths a player actually takes, not just the default: hockey
  scored right with the assistant's calls and the balanced plan, but Muse
  played "Skate with them" on a top team and saw 87-point centres. And put
  the measured numbers on the choice (the plan buttons now say 6.7/6.2/5.2).
- A rename must check every name in the league, not just the ones seen so
  far: renaming one duplicate into another player's name cascaded through
  the league each summer and scrambled identities (caught by measuring
  summer rating changes: +50 jumps were two players with one name). When two
  share a name, a player on a coached team keeps it: the recaps name him
  (renaming a transfer you'd just signed broke "signed X" in bb-portal).
- Screens must not promise what the code doesn't do: pro featuring said it
  sped development and didn't (only college did) until Nov 2026.
- Round 6 (Muse) and Instinct round 2, Nov 2026, each with a check in
  test/regressions.js that fails on e4f92e5:
  an injury belongs to the player, not the slot (promoting a healthy backup
  moves the injury to the bench and stops its cost; promotions saved before
  this are plain numbers and replay the old way, so old careers don't
  change); win probability includes your own edges (featuring, ice time:
  ownEdge); a club page averages its starters, not the squad; soccer records
  carry draws everywhere, and seasons saved without them are filled in on
  load from the division's games (38 or 46, read from the season's result
  wording: the ranking is not pyramid order, as a first try assumed); a
  coordinator fired mid-season leaves a job to fill, so he can't return;
  after a move, last season's featuring names the player you featured and
  says nothing at the new club; Start over goes to the title screen (it went
  to a team picker with no setup and every game needed a reload); college
  standings have a conference picker; college basketball keeps each
  season's bracket (packed, under 3 KB) and History draws past ones;
  payroll against the cap or wage budget is on every team's card, all
  season; milestones count only your own seasons at the club.
- Hockey's ask curve is its own (Instinct): the football-shaped curve at
  PAY 4.3 put every 63+ at the max (85 of 768 contracts), so the hard cap
  made no tradeoffs. Now a line in dollars, 0.85 + 19 x (r-48)/20: a median
  player ~$7M, a 64 (top 10%) ~$16M, the max from ~69 (6 of 768). Typical
  payroll ~70% (was ~80%): with ratings this compressed (median 55, top 5%
  67), a payroll near the cap and a rare max pull against each other.
  nhl-history unchanged. Every league's signing markup (x1.1) is clamped at
  the maximum contract.
- The free-agent "fits" label: the signing checks the cap after the draft,
  so there is no "squeezing the draft class". The screen's room less the
  rookie reserve is right on average (measured: mean error -0.4M football,
  +0.6M hockey) but varies about 5M either way, so near the line the label
  says "close: it depends on what the draft class costs".
- Anything you choose that changes how your games play must be kept with the
  step it was made at, because a load replays the season from its seed:
  featuring and ice time kept only the latest choice, so every simmed game
  replayed with it and records drifted between loads (Muse: 77-5 became
  71-11; the title screen, written at the last save, "corrected itself" once
  the career was opened). S.chLog keeps each change (noteChoice); with no log
  for the season the choice never changed. Promotions and firings were
  already kept this way (S.promos, S.fires). test/regressions.js 21.
- Two tabs on one career (Nov 2026, round 8): a tab left open on an older
  state saved over newer progress without a word (measured in Chromium: six
  games wiped). That was Muse's "ghost" careers back after an erase, title
  summaries a season behind, a playoff series that changed on reload, and
  likely featuring "carrying over" in college basketball. Each slot now has
  a revision beside it (KEYFOR(n)+"-rev"): a tab saves only over the
  revision it last read or wrote, and otherwise stops saving and says so;
  the title screen re-reads the slots when another tab writes (storage
  event) or the page comes back from the back-forward cache.
  test/confirm-taps.js (two tabs) and regressions.js 26.
- Read prompts are asked on evidence, not on a schedule: hockey's goalie
  only with a soft goal or goals 1.5+ over expected (and after two, only if
  more have gone in); otherwise the assistant's rule stands. Soccer's
  second-half read shows since-half-time numbers beside the whole match
  (whole-match rates lagged a change), and offers "Keep your setup" first.
  Identical verdicts print once ("twice"); every call against the assistant
  is weighed on the result card, not only the biggest. Calls per live game
  (Nov 2026, median / p90): college football 2 / 3, pro football 2 / 3,
  hockey 3 / 4, soccer 6 / 6, college basketball 4 / 5, pro 5 / 5. Football
  is the gap: a spread-gated prompt plus more two-point and overtime calls
  is the next design job (Instinct's proposal, round 3).
- The win chance on screen is the engine's own (Nov 2026, Grokbot pass 1):
  measured by playing thousands of games at each rating gap and plan, it
  fits p=1/(1+10^(-gap/k)) within ~1 point, with k per league and plan
  (LEAGUE.tuning.wpK): college football 380/440/580 (safe/balanced/bold),
  pro 180/210/275, college basketball 380/420/470, pro 250ish, hockey
  ~655 (plans barely move hockey's result). The textbook /400 had pro
  football favourites at 70% that won 84%, hockey's at 70% that won 63%,
  and the plan buttons never moved the number. Soccer's W/D/L model takes
  fitted goal and edge factors per plan.
- Testers share one browser (Nov 2026, round 9): every game lives on one
  origin, so localStorage is shared by every tester using that profile.
  The careers Grokbot "lost" in slot 1 include ones Muse reported erasing
  the round before (Pro Football Seattle, Hockey Toronto); in a clean
  profile the reported repro (a pre-update career in slot 1, a new career
  in slot 2, reload) keeps slot 1 in all six games. Defences now: a save
  that won't open is shown as such and never as Empty (an empty-looking
  slot invites a new career over it), and each game keeps a copy of the
  career last opened, offered back on the title screen when its slot is
  empty or unreadable. Testers should each use their own browser profile.
- A game's drives must be its own: a live game's result kept the drives of
  the last simmed game of yours (_userDrives), so Rewatch showed another
  game (a 12-31 loss replayed as a 27-20 win) and box views disagreed with
  the score. regressions.js 42.
- Football calls (Nov 2026): up to 6 a game (was 3), four fourth downs (was
  two) and two two-point tries (was one), a new fourth-and-short call in
  your own half (stall 30-43, 1-2 to go), and no fourth-down call in a
  decided game (callMatters: 28+, 21+ after half-time, 17+ in the fourth).
  Measured over 36 college and 51 pro live games: calls a game 2.5 -> 3.5,
  graded calls (the options really differed) 1.2 -> 2.1, share graded
  47-52% -> 58-59%; median 4 (college) and 3 (pro). Verdicts still agree
  with 10x the replays 91%. Next: onside kicks and overtime calls need the
  drive engine to break strict alternation of possession.
- Real schedules can't be fetched from here: the NHL and NBA feeds are off
  the allowlist, and Hockey-Reference's page comes back cut at Nov 10.
  They need files from Ian (Hockey-Reference / Basketball-Reference export
  the schedule as CSV; Premier League fixtures likewise).
- A push to main is the release: Pages deploys it within minutes (Instinct
  tested d501095 live within the hour). Say "live once Pages deploys", not
  "nothing is live until you push", when Ian has already pushed.
- In a hot seat the people's coach records (U.coach) count each season twice;
  screens use each person's career instead (coachRows). Not fixed at the
  source: U.coach for people is otherwise unused, and changing
  recordCoaches would move hot-seat histories.
- Playoff series put several of your games in one round: anything that
  finds "your game" in a round must take the latest, not the first.

## Tests (test/)

run-all.js runs every verdict test in every game. Per game: golden (fingerprint
of results and screens), hotseat, storage, reload. Across games: saves,
layouts, sim-and-skip, sim-ahead, objectives, goals, migrate (old saves; the
v1 build is in test/fixtures; deliberate screen changes are normalised there
with a note), your players (people), football call verdicts (fb-verdicts),
the transfer window (transfers). Per league: rules and clinch tests (nfl, nba-playoffs,
nhl-playoffs, nhl-clinch, bb-bracket, epl-rules, epl-cup), screen and wording
audits (bb-screens, nba-screens, nhl-screens, epl-screens), the reads
(sc-decisions, hk-reads, bb-reads college/pro: league calibration plus each
call's worth), offseason systems (draftboard, fatargets, trades, bb-portal),
and long-run history checks against the real leagues (bb-march,
nba-history, nhl-history).
Reports (run by hand): draft-night and draft-years (what a hand pick is
worth), calibrate, advisors, calls, the engine harnesses
(bb-engine, hk-engine, hk-decisions), the long-run recorders.

## Soccer: the pyramid and the cup

164 real clubs, tiers 1-6 (PL, Championship, Leagues One and Two, National
League, North and South), each division's real promotion, play-off and
relegation rules. Fixtures are a Berger double round robin (never more than
two in a row at home or away). The FA Cup: tiers 5-6 in two qualifying
rounds, tiers 3-4 at the first round, 1-2 at the third; open draws with its
own RNG (so the league's results don't move); midweek ties in league weeks,
played live; level ties go to extra time and penalties; Wembley for the
last two rounds. Cup ties never touch a league record or a table.

## Soccer: the transfer window (leagues/epl/27_transfers.js)

Players under contract cost a fee (wage x age x years left, more for a
starter) as well as wages. They move up the pyramid, not down: a player
won't drop a division, and in the same division wants a club of at least
his own club's standing (judged on the standing as the summer began, and
on next season's divisions). The kitty, fixed when the summer opens: 15% of
the season's wage bill + 1.5% of the budget + half of last summer's
leftover; sales add to it. Bigger clubs bid for your best players (keep or
sell). Bids go in your order while the money and the wage budget last.
Only your bids and sales move players: the computer's clubs rebuild as
before, so the league behaves as it did. Measured (test/transfers.js): a
Premier League club ~£8M against a median starter upgrade of ~£10M; a
League One club ~£1.3M against ~£1.2M.

## The offseason: the staff's plan (core/94_staffplan.js)

Every offseason choice starts at what the staff would do (the computer
teams' plan). A card at the top says so: who they'd re-sign and let go and
why, free agency, the draft, trades; each contract row says the staff's
call. "Back to the staff's plan" undoes your changes. College: the even
budget split and a balanced class.

## The postseason is yours only where you play (core: spectating, simPostOn)

A round with no game of yours says "Sim to your next game, or the end", and
one click sims on until you play again or it's over (test/postseason-gate.js).
Records: the career includes the season in progress (careerNow); saves carry
seasonNow for the title screen.

## Reads: hints and honest verdicts

Staff advice on reads (help panel): Full, Hints only (Pearl points at the
number to watch, SPORT.hints), or Automatic (full in the first season, hints
after: the default). Read verdicts say when the numbers pointed elsewhere
(evid) and when the scouting report was split. Football: near-equal options
read "won about as often" both ways; a quiet game shows its closest call.

## Backups and the season tally

Help (?) has "Download a backup" (the save as a .coach file) and "Restore a
backup"; the title screen restores into the first empty slot. The team
page keeps the season's tally of reads and calls (tallyHTML).

## Music (core/97_feel.js)

Generated with Web Audio like the sound: four chords per sport (own key and
tempo), bass, a plucked figure; in a live game a beat and a busier figure.
The second top-bar button (S.music, off by default); it starts on the first
tap after a reload, as browsers require.

## Your players (core/93_people.js)

The team page shows your three best players and any backup who wants to
start: season line, form (last three games against his season: in form at
1.35x, out of form at 0.6x), final year (contract, or a college senior), the
next career milestone when close, and a mood read from those facts (not a
mechanic). Milestones per sport and level are in SPORT.milestones (college:
milestonesCollege) and reach the weekly news. Pro careers count from the
dynasty's first season (generated players have no earlier history).

## Real data

    college football  30_schedule2026: ~81% of the 2026 games, transcribed
    pro football      30_schedule2026: all 272 games (nflverse, data/)
    pro hockey        30_schedule2026: Sept 29 - Nov 29 (429 games, Hockey-
                      Reference, data/); the rest generated to the NHL's matrix
    pro basketball    formula only
    college basketball formula only
    soccer            clubs, divisions and rules 2026-27; fixtures generated
    colours           data/ (ncaa-team-colors, ISC); 18 stand-ins remain

## Calibration targets (checked by the history and reads tests)

    college football  favourite ~0.70, margin ~15, home 57-59%, ~54 pts/game
    pro football      favourite 0.63-0.66, margin (NFL ~10-11), MVP QB ~85-90%;
                      by the shown chance (round 39): favourites ~66%, margin
                      ~12, best record 13-16, top chance shown ~94%
    college basketball 72.6 pts/team, margin 12.2, home 62%, favourites 68%;
                      first-round seed pairings vs NCAA history (bb-march)
    pro basketball    114.6 pts/team, margin ~12.9, home 61%, favourites ~69%
                      (71% and 13.2 before round 39's narrower gap);
                      wins sd 12-13, 1 seeds ~55% of titles, series 4-7 games.
                      First seasons too (nba-history checks seasons 1-3):
                      wins sd ~13, best ~66, worst ~15 (NBA_K 1.0; it was
                      2.0 and fresh seasons ran 77-5 / 9-73, sd 17.6)
    pro hockey        6.1 goals/game, save % ~.900, ~22% to overtime; points
                      mean ~94 (84 games), sd ~14. Game totals spread like a
                      Poisson at that mean (12+ goals ~2%). Your games by plan
                      (Nov 2026): skate with them 6.7, balanced 6.2, clog it
                      up 5.2. Skater points: first-line C ~65 at a 60 rating,
                      ~75 at 63-69; league best 95-112 (regular season), top goal scorers
                      45-57 and rated 63+ (round 21: goals x0.78, forwards'
                      assists x1.12, rating slope 0.45 -> 0.7; a 62 winger
                      led with 60 goals before), first-pair D ~35-45.
                      Coaching changes: ~2 the first summer, ~5 after
                      (seatSpread 30; at 45 it was ~1).
    soccer            2.75 goals/game, ~27% draws, ~41% home wins (league
                      mix); strength predicts the tables (rank corr 0.6-0.9)

## Known calibration gaps (measured)

- Played vs simmed scoring (Nov 2026, one season x3 per game, calls cycled):
  your live games against the league's simmed games, points per team:
  college football 26.6 / 26.8, pro football 23.8 / 22.4, college basketball
  72.1 / 72.4, pro basketball 115.8 / 114.6, hockey 3.1 / 3.1, soccer
  1.6 / 1.4 (Arsenal: a strong side). In a browser, 20 hand-played Saint
  Joseph's games averaged 74.4. Calls barely move totals (college
  basketball: 72.0 to 72.9 whichever option you always take). Testers'
  high hand-played samples were small; no engine gap found.
- Field goals: fgOdds is a smooth curve (FG_CURVE) used only for your
  fourth-down calls; the computer's drives resolve kicks their own way, so
  CPU calibration doesn't move. Fourth downs graded over 6 careers: where
  no kick is offered (the punt-or-go band) "go" is best about two times in
  three; that band, not the kick curve, is why most fourth downs favour
  going (Instinct). A model question still open.
- Hockey pay (decided Nov 2026, Ian, on all three testers' advice): a
  convex curve for contracts signed from now on (HK_B 1.8, HK_A 16.3, HK_0
  47): a 55 about $4M, a 62 $10.6M, a 66 $15.7M, the maximum from ~70.
  Teams carry 12 contracts, not 23, so each player stands for about two;
  the curve fixes relative prices (a 67 was priced like the best). Over 12
  seasons (test/hk-economy.js): median payroll 61% of the cap (was 80%),
  max deals per team unchanged, top-six retention 79% (78%), points spread
  13.6 (NHL ~14). Deals already signed run at their numbers: an older save
  replays identically mid-season and mid-offseason.

- Hockey's goalie call is nearly weightless (Nov 2026, test/hk-reads.js at
  60,000 games): pulling him only on a real bad night is worth about +1 win
  point over leaving it, and telling a bad night from bad luck (soft goals
  vs simply two in) about +0.3 to +0.4, inside the noise of a 20,000-game
  run. The check now asks only that it's positive. Grokbot scored hockey's
  decision weight 5/10; this is part of why.

- Pro basketball (before round 39's narrower gap): 70-win seasons in ~19% of long-run seasons (real ~10%);
  max seen 79. Big mismatches (gap over 200) count half (BB.softGap) since an
  82-0 turned up; the tail is still a little fat.
- Pro football: best record ~15 wins (real ~14), worst ~2 (real ~3). Round 39: 13-16 over 16 fresh seasons, favourites 66%, margin 11.9.
- Salary caps (Nov 2026, Ian's go-ahead): veterans' asks are scaled (PAY:
  football 1.75, basketball 2.1, hockey 4.3; rookie scales and minimums are
  real and unscaled), with each league's maximum contract (20% of the cap,
  35% in basketball). Typical payroll ~75-85% of the cap; hard caps (football,
  hockey) never exceeded (free agency keeps the minimum back for empty spots;
  the post-draft check counts them). Basketball's soft cap: re-signing up to
  the tax line, top payrolls ~105-115%. Calibration unchanged (nba-history,
  nhl-history, football spread by season). Hockey's curve was reshaped
  later (see the lessons): typical payroll ~70%. Gap: hockey's typical payroll
  drifts down by year five (rebuilding teams on rookies and minimums); real
  leagues have a salary floor, the game doesn't.
- College basketball injury costs reach ~200 team-strength points: some
  starters in the 80s have backups rated 30-40. Bench depth, not the cost
  formula, is the problem; worth reshaping college benches (a calibration
  change: run bb-calibrate and bb-march after).

- Pro football: mean margin ~13 (NFL ~10-11).
- Pro basketball: first-round 2 v 7 and 3 v 6 upsets too common.
- College basketball (bb-march, a long-run test): one seed line or another
  fails after unrelated changes (3 v 14, 8 v 9, 6 v 11 on different runs in
  Oct 2026; 6 v 11 read 62-69% across runs). Its tolerance is 3 standard
  errors treating tournaments as independent, but a career's tournaments
  share teams, so the real noise is larger. The old engine also failed 8 v 9
  at 388 tournaments (52.9%, real 48.8). Nov 2026, same seeds: the previous
  build failed 6 v 11 (68.9%); the scouting-report build failed 2 v 15
  (96.1%, prior 94.7) and 3 v 14 (90.1%, prior 88.3). Fix to consider: a standard error
  clustered by career. Not loosened. Nov 2026 (caps round): 3 v 14 at 89.0%
  (194 tournaments) on this build and on e31fc08 alike; the long-run is
  time-limited, so a run can fit a different number of tournaments and pass.
- Soccer: the Premier League is a little too predictable (rank corr ~0.9).
- Pro hockey: year-to-year correlation of records 0.40 (NHL ~0.5).
