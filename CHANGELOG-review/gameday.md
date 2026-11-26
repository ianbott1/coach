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
