# Round 111 review branch rv/gameday: game day as coaching (basketball, then hockey)

## 1. Basketball timeouts (engine 25)
- What changed: each side has a limited number of timeouts a game (pro 7, college 4). A run (a stretch won by 8 or
  more, the run of play's RUN) carries a small edge into the next stretch unless the side it hurt calls a timeout or a
  period ends (college half-time; the pros' quarters). When a run goes against you, you're asked: call a timeout (and
  change the defense, with the shot chart in front of you), or save it. A Timeout button in the live bar (two taps, as a
  plan change) calls one at the next stretch break and asks what you change. A timeout kept for the end means a
  drawn-up last shot; with none left the down-two last possession is a scramble (85% of the usual make rate). The
  computer and your assistant call one on every run they face while they have one, so the computer's own games play
  exactly as on engine 24 (3,000 of 3,000 games identical, both leagues).
- Why: a live game stopped only for quizzes; between them you could only switch a plan (no timeouts, no way to answer
  a run). Real coaches spend timeouts on runs and save them for the end.
- Honest size: matched studies find the "timeout stops the run" effect is mostly regression to the mean, at most about
  0.06 points a possession (https://arxiv.org/abs/2009.06750), or slightly against the side calling it
  (https://arxiv.org/abs/2011.11691). The engine's carry-over is 0.012 on each side's make rate (about 0.05 points a
  possession between them); measured on the same dice, every run answered "timeout" against "save it": +0.5 points of
  margin and +1 to +3 points of win rate over the rest of those games (college, pro).
- Rules: NBA 7 charged timeouts in regulation, at most 4 in the fourth quarter and 2 after its three-minute mark
  (https://official.nba.com/rule-no-5-scoring-and-timing); NCAA men's broadcast games 4 (one 60-second, three
  30-second) (https://en.wikipedia.org/wiki/Time-out_(sport)). The fourth-quarter limits aren't modelled (runs come
  about 0.4 times a game per side, so a side never gets near them).
- The call follows the call rules: graded by replay against your assistant (callImpact), a defense picked at a timeout
  is graded as a read (on what they were really running, with the shot chart's marks), the last option leaves it to
  the assistant (who plays as the computer: timeout, defense kept), never asked 20 either way. Not gated by the spread
  rule: being asked would say your defense is wrong (the read's answer is in the evidence, as for the reads).
- Games: college and pro basketball. Core: setLivePlan takes "act:<id>" (a sport's own live button); the live bar
  draws them (liveActsHTML); ENGINE_NOW 25 (universe fingerprints of all seven change: engV only).
- How tested: node test/bb-gameday.js 1500 (all pass: computer games 1500/1500 as engine 24 in both leagues; asked
  only after a run against you mid-period with a timeout left; assistant = "timeout, keep" 300/300; own timeout asks
  200/200; timeout vs save +0.53 / +0.39 points of margin). node test/bb-gameday-ui.js MATCH (8 live games each, the
  button, the call screen, TIMEOUT in the run of play, rebuilt games give back their score).

## 2. Basketball rotation and fatigue; foul trouble that knows your rotation (engine 25)
- What changed: a rotation control on the live bar: Tight rotation (the bench plays 12% of the minutes), Usual (20%,
  as before), Go deep (28%), from the next stretch, any time. A tighter rotation puts more of your starters on the floor
  each stretch (worth your starters' gap over your bench, by position weight, in rating points times R_SLOPE); the
  minutes come back as tired legs in the last two stretches and overtime, by how much tighter you played before each,
  less for a side with Stamina. The bar shows your starters' legs (fresh, fine, tiring, tired) from the same sum the
  engine plays. A star in a tight rotation is on the floor more and picks up fouls faster (deep, slower); the
  foul-trouble card says so. The engine reads each side's gap and Stamina from the roster (gameCtx rot; a hurt
  starter's minutes go to his backup, a hurt backup's to a walk-on).
- Why: no minutes control existed; a coach's most constant decision (how far down the bench to go, whether to ride the
  starters) wasn't in the game, and Stamina only showed in the last ten minutes.
- Honest size (a design choice, not a measured real figure): a roster with the league's usual gap (college 14.3, pro
  12.0 rating points, measured over every team) and Stamina gains nothing either way. Measured on the same dice
  (test/bb-gameday.js, 1,500 games a cell, even sides): college, gap 18.3 tight vs deep +0.83 points of margin; gap
  10.3 deep vs tight +0.17; Stamina +1 sd tight +0.75 over deep, -1 sd deep +0.38. Pro: gap 16 tight +0.80, gap 8 deep
  +1.14; Stamina +1 sd tight +0.93, -1 sd deep +0.86. The usual roster: within 0.1 points either way.
- Foul trouble: the call already existed for your star (round 44: once a half, at foulOut-3 and foulOut-2: college 2
  and 3, pro 3 and 4; asked when it gains 4 points on your assistant, who sits him). Kept as is; not widened to every
  starter (a non-star starter off the floor measured as worth nothing either way, ARCHITECTURE "Measured and dropped").
- Computer games: unchanged (the computer plays the usual rotation; the fast goldens' results are identical, screens
  changed by the new buttons).
- Games: college and pro basketball. Core: liveActsHTML groups a sport's buttons, shows the one in force.
- How tested: node test/bb-gameday.js 1500 (all pass, incl. "the usual roster gains nothing" and "a thin bench wants it
  tight, a deep one deep"); node test/bb-gameday-ui.js MATCH (rotation buttons, the change said in the run of play,
  legs); golden --fast both basketballs: screens only, re-recorded.

## 3. Basketball end game: behind in the last minute, foul or play it out (engine 25)
- What changed: when you're behind by one to eight in the last minute of regulation (the moment the engine's trailing
  side starts fouling), the game stops inside the last stretch and asks: foul to stop the clock and send them to the
  line (what the computer and your assistant do, as before), or play it out (they run a possession down, you get one
  more). The full match plays the stretch up to the call and goes on from there (core eng.partial, as baseball's
  in-inning calls). Graded by replay; asked only in reach and when an option gains 4 points on your assistant (core
  GATE_KINDS "defend"), or as the close game's late-window floor call.
- Why: the last minute of a close game had no decision; fouling was automatic.
- Measured (test/bb-gameday.js, 1,500 games, every other call left to the assistant): college (free throws 71.5%)
  fouling wins more at every deficit (down 1-2: 17.4% against 12.8%; 3-4: 5.4 against 2.2); pro (78.5%) playing it out
  is better down 1-2 (28.4 against 24.3) and level from 3. So the answer moves with the league and the deficit; the
  card shows the deficit and the league's free-throw rate (not tonight's free throws, which predict nothing in the
  engine: every side shoots the league's rate).
- Not built: "hold for the last shot" and "two-for-one". Worked through on the engine's own numbers both are quizzes
  (holding with the score tied wins whenever your early shot isn't better than the held one by more than their make
  rate; the two-for-one is right whenever the clock allows), which the call rules don't allow; the tied last possession
  would also change the computer's own overtime rate.
- Games: college and pro basketball. How tested: node test/bb-gameday.js 1500 (all pass: asked only when behind 1-8;
  the assistant fouls as the computer, 300 of 300 identical; the stretch waits with its score and possession log and
  goes on from it, 100 of 100); node test/bb-gameday-ui.js MATCH; golden --fast: college MATCH, pro screens only (one
  call more in the season's count; results identical), re-recorded.

## 4. Hockey: not built this round (findings for the lead)
- Pull the goalie: hockey already has the call (src/hockey/50_game.js pullCall, down one in the last stretch: early,
  3.2 minutes, or normal, 1.6; the computer and your assistant pull at 1.6). Nothing new was added. Two findings:
  - The engine's extra-attacker rates (pullFor 0.15 goals a minute for, pullAgainst 0.20 against) overstate the six
    against five for the trailing side compared with the real figures. Asness and Brown measured about 0.07 a minute for
    and about 0.15 against, and put the best pull at about 5:40 left down one and 11:40 down two, against the 1 to 1.5
    minutes coaches use (https://www.ushr.com/assets/docs/2018/Pulling-the-Goalie-2018-05-31-19-29-28.pdf).
    These are global calibration constants, so they're left to the calibration work. Changing them moves every
    computer game.
  - Under the engine's rates and under the real ones, "pull earlier" is the right answer down one or two in nearly
    every case. A wider pull call (when, at what deficit) would be a quiz, which the call rules don't allow. Down
    two, early against normal already measured as 0.0 points (test/call-weight.js), which is why it isn't asked.
- Line matching and forecheck choice: not started. The lines module (src/hockey/12_lines.js) sets season-long ice time,
  and a live matching call needs a per-shift model the engine doesn't have.

## 5. Goldens re-recorded (round 111)
- Fast goldens: test/golden-fast-nba.json and test/golden-fast-ncaab.json, re-recorded with each step (notes in the
  files). The computer's results are the same, and the user's live games move with the new calls.
- Full goldens: test/golden-nba.json and test/golden-ncaab.json, re-recorded once at the end with a --note.
- Other five games (football pro and college, hockey, soccer, baseball): ENGINE_NOW 24 to 25 changes only the
  `universe` field (engV) of their goldens. Hockey fast was checked: universe only. Not re-recorded here; the
  calibration agent also moves to engine 25, so the merge decides one re-record.
