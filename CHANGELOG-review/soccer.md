# Review round 2 branch rv2/soccer: the manager's matchday (soccer, engine 26)

The benchmark is Football Manager's matchday: pick the eleven and the shape, make five changes in the windows the law
allows, change how the side plays as the game turns, and rotate through a congested run. Every change that moves a
result is gated on `ENGINE_V >= 26` (`SC26_V`, `scV26()`); a season begun on engine 25 or before plays exactly as it did.
New file `src/soccer/55_squad.js`; engine changes in `src/soccer/50_game.js`.

## 1. The team sheet and the shape (engine 26)
- What changed: the next game's card has a Team sheet. For each unit (keeper, centre-back, full-back, midfield, wide,
  striker) it shows the first choice and the man behind him, with ratings and condition, and a Start button that puts
  the other man in for this game. Five shapes (4-2-3-1, 4-3-3, 4-4-2, 3-5-2, 4-1-4-1) move a little of each unit's
  weight in the side's strength (every shape's moves sum to zero: a squad equally good everywhere plays them all alike).
  The computer, and your assistant until you pick, plays the shape its squad suits, leaning a little to the shapes clubs
  play now. Your picks are kept in the save (`S.xiLog` for a game's eleven, `S.xiFm` for the shape from a game on), so
  a reload plays them the same. The shown chance moves when you start a weaker man or tired legs (it leaves the
  shape's fit out, as it leaves a plan's out: clicking through shapes mustn't read out the answer).
- Why: before, there was no team to pick. The squad of twelve played itself, the bench came on by a fixed share.
- Real figures: Premier League 2024-25 shapes, 4-2-3-1 in about 54% of teams' games, a back three 15%, 4-3-3 15%,
  4-1-4-1 4%, 4-4-2 3% (https://www.premierleague.com/news/4323030). The clubs' picks here (three seasons): 4-2-3-1
  48%, 4-3-3 24%, 4-1-4-1 12%, 3-5-2 10%, 4-4-2 6%.
- Size: a squad strong out wide in 4-3-3 against itself in 3-5-2 is worth about 34 Elo (a few points of chance), the
  best shape against a middling one less. A man started over his first choice costs about 45% of the rating gap times
  his unit's share (the computer's changes put the first choice back on at the hour), measured on engine games.
- Games: soccer. Core: `gameCtx(h,a,year,step,sea)` takes the season (other sports ignore it); `sportBind` hook in the
  render bindings, beside hockey's `bindLines`.
- Tested: `test/sc-manager.js` parts 1, 4, 5.
- Not yet: the keeper is never rested (the feed and the box name the first-choice keeper, and the box score's credit
  code belongs to the stats branch). For the same reason the box score and the feed still share goals and cards
  between the first choice and his deputy by the usual bench share when one was rested: the credit code
  (`teamLines`, `scScorer`) should follow `drives[0].xi0` and `drives[i].sb` after the stats branch is merged.

## 2. Five changes in three windows, and the assistant's suggestion (engine 26)
- What changed: each side may make five changes, in at most three windows besides half-time, and one more change in
  one more window in extra time. In a live game the change buttons name the men ("Sepulveda for Hartsfield
  (midfield, legs 85)") and the line above them says how many changes and windows are left and what your assistant
  would do ("Your assistant: Sepulveda on for Hartsfield (midfield)"). A change freshens that unit's line by its share
  and brings on the other man's rating and condition. A sixth change or a fourth window is refused. Leave the bench to
  your assistant and he makes the computer's changes: two at 60', one at 70', one at 80' (one more at 80' when behind
  or tired), the line whose legs are lowest first unless the man behind is much worse. Every change is a row in the run
  of play ("SUB Sepulveda on for Hartsfield (midfield)").
- Why: there were two unit-level changes ("at the back", "in midfield") with no names, and the bench could be asked
  for a change after none was left.
- Real figures: IFAB Law 3 (https://www.theifab.com/laws/latest/the-players/). Premier League 2023-24: about four
  changes a side a match, all five in 42.5% of matches
  (https://kwestthoughts.substack.com/p/data-dump-2023-24-substitution-trends); clubs' first changes on average at 55'
  to 66' (https://theanalyst.com/articles/assessing-each-premier-league-teams-substitutions-2023-24/). Here: 3.9 a
  side, all five in 27% of matches, the first at 60'.
- Games: soccer (the engine-22 buttons stay for seasons begun on engine 22 to 25).
- Tested: `test/sc-manager.js` parts 2 and 5; `test/sc-subs.js` now runs on engine 25 (its path).
- Not yet: all five are used less often than in the Premier League (27% against 42.5%). The browser test
  `test/sc-subs-taps.js` taps the engine-22 buttons and needs updating for engine 26 (not run: no browser here).

## 3. How we play from here (engine 26)
- What changed: in a live game, four buttons change the side's approach from the next five minutes: Press higher, Sit
  deeper, Work it wide, Go direct (the engine's own four approaches, the ones the half-time and 80' calls already
  used). The feed says so ("Southampton drop deeper and sit on it"). Together with the existing push and sit plan
  buttons (round 108) this is the in-game shift: press higher, protect a lead, go direct when chasing.
- Why: the approach could only change at the two calls.
- Tested: `test/sc-manager.js` part 5 (made at 75', said in the feed, replayed from the save).

## 4. Condition, congestion and rotation (engine 26)
- What changed: every man has a condition. Ninety minutes take 26 points (a keeper about a third of that), a day
  gives 7 back, so a week puts everyone back to 100 and a Saturday, Tuesday, Saturday run starts the men who play all
  three at about 95 and 97. Condition at kick-off sets each line's legs (`SC26.cnK`). A club whose starters began the
  week's league game short of it picks up more knocks that week (1 + 1.5 x the shortfall). The computer rests a man
  under 97 when the man behind him is within 8 points and fresher, and in a cup tie against a lower division rests any
  whose deputy is within 10. The card shows each man's condition and what your assistant would do.
- Real figures: injuries per match 1.09 times as high with four days or fewer of rest as with six or more, muscle
  injuries 1.32 (Bengtsson, Ekstrand and Hagglund, BJSM 2013,
  https://bjsm.bmj.com/lookup/doi/10.1136/bjsports-2013-092383). Rest matters at three days or fewer, not beyond (Scoppa,
  IZA DP 7519, https://newsroom.iza.org/en/archive/research/new-evidence-from-soccer-tournaments-three-days-of-rest-are-enough).
  Here: starters at 98.4 after four days or fewer and 100 after a week; knocks 1.03 times as many after the short
  gap; starters at 80% condition cost about 54 Elo in the engine (the card says 50).
- Games: soccer. Core: `Season._resolve` calls `sportAfterGame` after every game (both branches); `Talent.advance`
  multiplies the injury hazard by `sportInjMul` (the same dice).
- Tested: `test/sc-manager.js` part 3.
- Not yet: the game has no European fixtures, so congestion comes only from the cup ties and the Christmas weeks.

## The league, before and after (same seeds)
`node test/realism.js epl 8` (all clubs, both divisions): engine 25 goals 2.9, draws 24.8%, home wins 44.9%, the
Premier League champion 82.1 points, Brier 0.1681; engine 26 goals 2.9, draws 24.4%, home wins 45.7%, champion 84.6,
Brier 0.1691. Premier League games alone, `test/sc-manager.js`'s three seasons on the same seeds: engine 25 goals
2.70, draws 28.6%, home wins 43.4%, champions 88.7; engine 26 goals 2.83, draws 27.8%, home wins 42.0%, champions
86.0 (the top division's draws run high on both engines: not this branch's). Real, 2022-23 to 2024-25 (https://www.futbol24.com/national/England/Premier-League/2024-2025/statistics
and the 2023-2024 and 2022-2023 pages): goals 2.85, 3.28, 2.93; draws 22.9%, 21.6%, 24.5%; home wins 48.4%, 46.1%,
40.8%; champions on 89, 91, 84.

## How it was tested
See the report at the end of the branch's work (the commit message lists each run).
