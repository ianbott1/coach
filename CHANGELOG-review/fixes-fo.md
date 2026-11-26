# Round 3 follow-up: the front-office checks in test/regressions.js (branch rv3/fixes-fo, engine 27)

`node test/regressions.js` on the merged round-3 build (3f3cc45) failed seven front-office checks in sections 7, 16,
19 and 71. Each was checked against the engine-26 and engine-25 builds (`DIST=/home/claude/dist-e26` and
`dist-e25`) to see whether engine 27 caused it. All seven are tests that check a rule the game no longer has: none
is a game bug. Only `test/regressions.js` changed. Nothing moves a simulated result, so nothing is gated, `dist/` is
unchanged and no golden or hot-seat baseline was re-recorded. `ENGINE_NOW` stays 27.

Each new check applies only to a career on the new rules (`u.hkFO` for hockey, `u.mlbFO` for baseball, `foNew` for
football's real cap). A career on the old rules is held to the old check, so the engine-25 and engine-26 builds
still pass it.

## 1. Pro football: typical payroll 59% of the cap (wanted ~70-85%)

- What: on football's real cap (engine 25), the check now wants the twenty tracked players' median payroll between
  50% and 75% of the cap less the depth line (`FO_CAP - FO_DEPTH`, $239.2M). It used to want 60% to 95%. The old
  $110M game keeps 60-95%.
- Why: engine 25 set the asks so the median payroll is $204M of $301.2M with the $62M depth line counted (nfl-fo.md,
  "Salaries"). That puts the tracked twenty at about 59% of $239.2M, right on the old 60% floor, so the check failed
  on noise. Engine 27 didn't cause it. Seeds 3, 5, 9 and 11, three summers each:
  - engine 26: 57-62%;
  - engine 27: 57-61%;
  - the check's own seed: 58% on engine 25, 61% on engine 26, 59% on engine 27.

  The "~70-85%" target was written for the old $110M cap.
- Game: pro football (test only).
- **Owner's call:** real NFL clubs carry close to the whole cap: across the league, cap space is usually a small
  share of the $279-301M. Here a typical club carries about 68% of $301.2M. That was a choice made at engine 25. If
  football payrolls should sit near the cap, that is a recalibration that moves results (a new engine). It is not
  done here.

## 2. Pro hockey: typical payroll 96% of the cap (wanted ~55-70%)

- What: a hockey career on the NHL cap sheet (`u.hkFO`) is now checked against a band of 88% to 100% of the $104M
  cap. An older career keeps the old 50-95% band and its "~55-70%" target. The game's payroll level was not changed.
- Why: round 3 (hockey-fo.md, entry 6) set clubs to spend like the real league: median payroll 97% of the cap,
  against 97.7% across the NHL in 2025-26. The check measured 96%. The engine-26 build reads 60% and the engine-25
  build 56%, so this is engine 27's intended change.
- Game: pro hockey (test only).
- **Owner's call: the two levels now differ.** The test's comment records Ian's earlier decision (November 2026)
  that cheaper middle-of-the-roster contracts should leave a typical hockey payroll near 60% of the cap. The engine-27
  front office follows the real NHL instead, at about 97%. Ian needs to decide which one the game should have. Until
  then, the check accepts the NHL level for engine-27 careers only.

## 3 and 4. Hockey and baseball: "card shows no payroll in season"

- What: the card check now also accepts each new front office's own line:
  - hockey on the NHL sheet: "Cap hit $X of $104M · $Y of room" (or "over"), with dead money counted
    (`src/leagues/nhl/28_hkviews.js`, `LEAGUE.payrollLine`);
  - baseball's front office: "Payroll $X · $Y under the tax line" (or "over the tax line, a $Z bill"), then the
    owner's limit (`src/leagues/mlb/99_fo_views.js`).

  The old "Payroll $X of $Y" wording is still checked for the other games and for older careers.
- Why: the card does show payroll all season. Engine-27 careers just word it differently. Checked by printing the
  card two games in:
  - Boston: "Cap hit $102.47M of $104M · $1.53M of room";
  - Baltimore: "Payroll $129.3M · $114.7M under the tax line · owner's limit $146.0M".

  The test's regex only knew the old wording. The engine-26 build's cards read "Payroll $49.6M of $90.0M cap" and
  pass the old check.
- Games: pro hockey, pro baseball (test only).

## 5. Hockey: a free-agent target "fits only by squeezing the draft class"

- What: on the NHL sheet, a target counts as having a verdict when its row reads "fits" or "$X short of room". These
  are the verdicts the new screen gives (`hkTargetsHTML`). "Squeezing the draft class" must still never appear. The
  old screen keeps its own words: "fits", "close: it depends" or "won't fit".
- Why: the check failed because all three targets it adds are $19.25M restricted men. With Winnipeg's room, all
  three read "short of room", which the old regex didn't recognise. Nothing on the screen says "squeezing". On the
  NHL sheet a drafted man's rights go to the reserve list unsigned, so the class takes no room before free agency.
- Game: pro hockey (test only).

## 6 and 7. Hockey draft night: "stopped for 3 picks of 2"; "the draft shown is not the draft that happened"

- What: the draft-night check now takes the number of rounds from the league (`LEAGUE.offseason.draftRounds`) and
  expects one stop for each pick your club holds (`dnPicksOf`). It used to hard-code two rounds for hockey.
- Why: engine 27 gives hockey a three-round draft (`get draftRounds(){ return hkSummer()||hkFO()?3:2 }`), because an
  offer sheet can cost a third-round pick. Draft night stopped three times for Toronto's three picks, which is
  correct. The test then rebuilt the "shown" draft with two rounds and compared it with the real three-round draft,
  so the two could never match. With the league's own rounds, all checks hold for all three games (football 7
  rounds, basketball 2, hockey 3): the stops, the finished night, shown equal to real, and your picks drafted.
- Game: pro hockey (test only). Football and basketball read the same rounds as before.

## How tested

- The four sections, run alone (a scratch copy of sections 7, 16, 19 and 71):
  - this build: MATCH, 283 checks (before the change: MISMATCH, 7 of 283);
  - `DIST=/home/claude/dist-e26`: MATCH, 119 checks;
  - `DIST=/home/claude/dist-e25`: MATCH, 122 checks. Section 7's football check had also failed on engine 25 (58%).
- The whole of `node test/regressions.js` on this build: MISMATCH, 4 of 8457. All seven checks above pass. The four
  failures left are outside this brief:
  - section 37 (the chance shown against the engine): college football, pro football and pro baseball. Baseball
    fails the same way on the engine-26 build; the two football checks pass there.
  - section 69 (soccer: "0 of 1 hot-seat badges name the target", seed 8): passes on the engine-26 build.
- `OLD=/home/claude/dist-e26 node test/engine-replay.js`: MATCH. `OLD=/home/claude/dist-e25 node test/engine-replay.js`:
  MATCH.
- `node test/migrate.js`: MATCH, 2253 of 2253.
- `node test/reload.js dist/hockey-coach-pro.html`: MATCH, 18 of 18. `node test/reload.js dist/baseball-coach-pro.html`:
  MATCH, 18 of 18.
- Goldens: not run and not re-recorded, because no game source changed (`dist/` is the merged build as given).

## Still missing

- Ian's decision on hockey's payroll level: about 60% (his earlier call) or about 97% (the real NHL, engine 27). If
  he keeps 60%, engine 27's hockey market has to be retuned, and this check's 88-100% band goes back to the old one.
- Pro football's payroll level against the real NFL (about 68% of the cap carried here, near all of it in the real
  league). Changing it moves results and needs a new engine.
- The four remaining failures in `test/regressions.js` (sections 37 and 69, above) were not looked at here.
- Browser checks (Playwright) were not run here.
