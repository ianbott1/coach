# Review round 2, branch rv2/hockey: pro hockey's game day (engine 26)

The pattern is basketball's game day (gameday.md): the coach's calls asked live as "Needs a decision" prompts, buttons on
the live bar, small effects measured by a test, the assistant's suggestion as the last option. Everything that moves a
result is gated on `ENGINE_V >= 26` (`HK_GD_V`, `hkGdV()` in src/hockey/50_game.js); `ENGINE_NOW` is 26. A season begun
on engine 25 replays as it was played. Test: `node test/hk-gameday.js [games=8000]` (about a minute; in the fast tier).

## 1. The goalie pull, at real benches' times (engine 26)
- What changed: the last minutes of the third (three, longer when a bench pulls earlier) are played ten seconds at a
  time. The goalie comes out when his bench says and goes back in when it's level or out of reach; while he's out his
  side gets the extra attacker's shots and the other side shoots at the empty net. The time he's out is taken out of
  the play (engine 25 added 1.6 minutes of six on five on top of five full minutes). The computer pulls as the league
  does now: down one with 2:15 left, down two with 3:30. A timeout goes with the pull when the side has one (a set play:
  20% more six-on-five shots for a minute). The call, asked with five minutes left down one or two: now, a minute
  earlier than the league (three down one, four down two), or leave it to your assistant (the league's habit). The
  live bar has Pull the goalie in the third (down one to three: he stays out from the next stretch) and Put him back.
  The evidence card shows who's better tonight on paper and the shots so far. The pull's clip, its event text and the
  "goalie back in" line follow the engine's events; a goalie still out as a stretch starts isn't pulled again.
- Why: on engine 25 the goalie came out in a fixed window and empty-net goals were 0.14 a game (2.3% of goals), the
  league of 2005-06. The pull is the most-discussed bench decision in today's NHL.
- Numbers (league, computer against computer, 8,000 games; engine 25 then 26, real):
  - empty-net goals a game: 0.140, 0.294; real 0.34 (2023-24, 13.8 a team:
    https://www.dailyfaceoff.com/news/how-empty-net-goals-have-changed-the-nhl) to about 0.40, 7% of goals (2024-25:
    https://www.theringer.com/2025/03/03/nhl/how-hockeys-golden-age-of-goalie-goals-explains-sports)
  - extra-attacker goals for each empty-net goal against: 0.72, 0.51; real 0.46 (Asness and Brown, 2015-16:
    https://www.ushr.com/assets/docs/2018/Pulling-the-Goalie-2018-05-31-19-29-28.pdf) to 0.52 (two teams 2021-22,
    https://www.spokesman.com/stories/2022/jun/21/heres-why-the-kraken-and-other-nhl-teams-are-pulli/)
  - a down-one pull tied: 18.1%, 18.4%; real 13.5% (2013-14) to 18.1% (2021) (Meghan Hall, the Spokesman link)
  - pull time down one: about 2:00 left; real "around the 2-minute mark"
    (https://goaliemonkey.com/learn/goalie-goals-becoming-more-common), 1:46 in 2019-20 and rising
  - goals a game 6.12, 6.16; overtime 23.7%, 23.0% (real 6.1-6.2 and 22-24%)
  - six on five: 0.12 goals a minute for (Matt Cane's "just shy of 6.5 an hour", 0.108, cited at
    https://hockeysarsenal.substack.com/p/when-should-we-pull-our-goalie; the timeout's set play is on top), 0.26 a
    minute into the empty net (Asness and Brown had 0.155 in 2015-16; tuned up to bring empty-net goals toward today's).
- Honest size: the call is worth a few points of win chance, more for the better side. Same dice up to the call, then
  each answer (wins; standings points a game it comes up in): +150 Elo tonight, down one: now 34.8% (0.775), three
  32.6% (0.723), assistant 31.5% (0.690); even: 16.4% / 15.4% / 14.0%; -150: 4.0% (0.207) / 3.9% (0.213) / 3.5%
  (0.209): the weaker side gains nothing from five minutes of six on five. Pulling with fifteen minutes left down two:
  7.2% won against 7.4% the league's way. Asness and Brown's best times are earlier (5:40 down one); benches still
  pull later, so the computer does too.
- Games: pro hockey. Files: src/hockey/50_game.js (tailPlay, pullCall, the live bar), 60_staff.js (staff picks),
  75_screens.js (event text, evidence rows).
- Tested: test/hk-gameday.js (MATCH); the call is asked only with five minutes left down one or two; your assistant
  pulls at the league's time in 300 of 300 games.
- Not yet: empty-net goals are 0.29 a game against today's 0.34-0.40 (no pull down three in the last minutes, no
  delayed-penalty empty nets). The highlights' rink reads the first pull of a stretch; a goalie put back in and pulled
  again in the same stretch shows out from the first.

## 2. Tonight's lines and legs (engine 26)
- What changed: a live-bar group, Lines tonight: Roll four lines (the depth gets 40% of the minutes), As set (the
  season's deployment), Lean on the top six (22%), Shorten the bench (14%). More top line and pair on the ice is worth
  their gap over the depth (rating points by position weight, R_SLOPE Elo a point, the same sum as the season's
  deployment in src/hockey/12_lines.js); the minutes come back as tired legs: each stretch's load fades to 0.75 by the
  next, and costs HK_GD.tire Elo a unit (set so the league's usual gap, 7.5 points, is level over a game). The live bar
  shows your top line's legs. The computer plays its lines as set: its games are identical with or without the lines
  data (2,000 of 2,000).
- Why: the deployment was a season setting only; a bench boss shortens the bench late and leans on his best when the
  depth is thin.
- Honest size (you at home, even teams, 4,000 games each, margin a game against As set): the league's usual roster
  gains nothing either way all game (under 0.03 goals); a thin bench (gap 11) gains 0.06 leaning on the top six, 0.16
  shortening; a deep roster (gap 4) gains 0.10 rolling four lines and loses 0.21 shortening; shortening the bench for
  the third only gains 0.07 for the usual roster (+1.7 points of win chance), 0.16 for a thin one, nothing for a deep
  one. No real figure to calibrate against was found; the sizes are tenths of a goal by design.
- Not yet: line matching at home (top line against their top line, sheltering the kids). Under the engine's linear
  model of strengths it averages out to nothing; a quality-of-competition effect would need the opponent's lines in
  the stretch's rates. Left out rather than faked.

## 3. The timeout (engine 26)
- What changed: one a game. Kept, your assistant calls it as the goalie comes out (the set play above). The live bar's
  Timeout spends it at the next stretch break: it rests the legs (takes 0.3 off the lines' load). The computer keeps its
  timeout for the pull.
- Honest size: leaning on the top line all game, kept for the pull won 51.8%, spent at 30:00 won 52.7% (4,000 games).
- Not yet: a timeout after an icing or before a late faceoff (the engine has no faceoff or icing moments to hang it on).

## 4. Pulling a struggling starter
- What changed: Put the backup in on the live bar (the existing goalie change, from the next stretch), next to the
  engine's own call after four goals against.

## Not built
- Power-play and penalty-kill unit choice: the engine's power play is one rate a penalty (no units); a unit choice
  would be a coin flip on rating points with nothing to read. Left for a round that splits the units.
- The coach's challenge (offside, goaltender interference): needs a call in the middle of a stretch and a goal taken
  back after it's credited, which touches goal credit (the stats branch owns it).

## Tests run
- node test/hk-gameday.js: MATCH. node test/hk-lines.js: MATCH. hk-reads.js: MATCH. hk-pp-goal.js: MATCH.
- OLD=/home/claude/dist-e25 node test/engine-replay.js hockey: MATCH.
- test/migrate.js (2253 of 2253), test/reload.js dist/hockey-coach-pro.html (18 of 18), test/saves.js, test/statsum.js
  hockey --check, test/boxscore.js: MATCH.
- Goldens: hockey's fast fingerprint matched before the change (8a7ce9c311be32a6); re-recorded fast, full and hot-seat
  for hockey only (its games moved). The other games' fingerprints differ only in `universe` (ENGINE_NOW 26, the
  engine version): left for the merged build's single re-record, as in round 1 (soccer checked: universe only).
- hk-decisions.js, hk-engine.js and hk-ot.js fail to load on main too (R_SLOPE and planAmpV missing in their loaders;
  hk-ot needs a browser): not changed here.
