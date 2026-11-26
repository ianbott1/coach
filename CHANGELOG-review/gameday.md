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
