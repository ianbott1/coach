# rv/people: the people (engine 25)

All seven games: college football (cfb), pro football (nfl), college basketball (ncaab), pro basketball (nba),
pro hockey (nhl), soccer (epl), pro baseball (mlb). Sport-neutral core in `src/core/93_morale.js`, with small hooks
in each league's aging line and each sport's staff room.

## 1. Personality and morale (engine 25)

**What changed.** Every player has five lasting traits (ambition, loyalty, temperament, professionalism, leadership,
1-20, fixed by his name) and a morale (3-97, shown as delighted / happy / settled / uneasy / unhappy / furious on the
roster, the player page and the team card). Morale moves after each game with the result, starting or sitting, a
backup who thinks he should start, form, a pro's final contract year, a losing run for a short fuse, a benching (worse
when the man who took his job is 4+ years younger), and promises kept or broken; it drifts back toward each player's
own base and carries 40% into the next season. A leader calls a players' meeting in a losing run. Team morale (the
starters, plus the room's chemistry) is worth at most 2% of a level game's chance (MO_WP), the home crowd at most 0.8%
more (FAN_WP). Morale nudges development by at most +/-0.8 rating points a summer (a mentor +0.4). ENGINE_NOW 24 -> 25:
a season begun on engine 24 or earlier replays exactly as it was played and has no people layer.

**Why.** The games had moods that were descriptions only; Football Manager and OOTP make players people whose state
answers to your decisions. Kept small and measured so it never swamps the ratings.

**How tested.**
- `node test/morale.js dist/<game>.html` for all seven: MATCH (cfb 30 checks, nfl 35, ncaab 36, nba 38, nhl 40,
  epl 23, mlb 48). Two seasons each: the question gap, the morale edge bound, ranges, the assistant's answer moves
  nobody, 3-4 reloads compare every player's morale, the fans, the room, captains, the open question and every result.
- Calibration, `node test/probes/morale-calib.js dist/<game>.html 2 3`, against `ENGINE_NOW=24` on the same build
  (2 careers x 3 seasons; wins sd = spread of season win totals):

  | game | home win % (25 / 24) | better side wins % | wins sd | morale edge at season's end |
  |---|---|---|---|---|
  | cfb | 57.5 / 57.2 | 67.7 / 67.4 | 2.49 / 2.47 | mean 3.7 elo, max 12.7 |
  | nfl | 51.2 / 51.4 | 56.9 / 56.9 | 2.98 / 2.74 | mean 2.5 |
  | ncaab | 58.0 / 58.7 | 62.7 / 62.6 | 5.00 / 4.83 | mean 3.8, max 14.6 |
  | nba | 59.3 / 59.0 | 62.0 / 61.0 | 13.03 / 12.82 | mean 2.7, max 8.6 |
  | nhl | 51.3 / 51.8 | 58.4 / 57.2 | 9.23 / 9.27 | mean 4.5, max 20.7 |
  | epl | 42.5 / 42.5 | 60.5 / 60.0 | 5.22 / 5.01 | mean 2.6, max 11.8 |
  | mlb | 53.7 / 53.1 | 55.0 / 55.0 | 15.68 / 15.33 | mean 3.4, max 13.1 |

  Home advantage and favourites hold within noise; season spreads widen by 0-9% (a good room gets better). The
  documented targets in ARCHITECTURE.md ("Calibration targets") are unchanged and still met by these figures.
- `node test/people.js` (all seven): MATCH 6635 checks.

## 2. Conversations

**What changed.** One-decision moments in "Needs a decision" with two or three answers: a trade request (college: the
portal), a benched veteran, a backup asking for minutes (promise him a start, and the start is made), a starter
wanting a bigger role, a rift after a losing run, contract talk, a rookie asking for a mentor, naming a captain.
Effects are real and remembered: morale, trust (promises are tracked and kept or broken), chemistry, fans. One staff
voice comments on each, leaning its own way, never giving the answer. At most one question per two steps of the
schedule (a week of games in the daily leagues). Questions never stop Sim; one you leave is answered by your
assistant at your next game, and that answer changes nobody's morale. Answers are logged in the save (S.talks) and
replayed by rebuild().

**Why.** "A living human layer": decisions with consequences, one at a time, phone-friendly.

**How tested.** `test/morale.js` as above (every kind's answers report how they landed; a reload with an answer given
and the day not yet played gives back the same season).

## 3. Media and fans

**What changed.** A press conference after a play-off game, a run of results, a rivalry or an upset: praise, protect,
challenge or deflect, moving morale, the room and the fans. Capped at a few a season (2 in the NFL, 3 in the NBA and
NHL, 5 in baseball) and two in a play-off run, so the players' own questions are heard. Fans (5-98) move with results
and answers and are shown on the team card ("Dressing room: ... Fans: ... Captain: ...").

**How tested.** `test/morale.js` (fans and room in range every step, reloads).

## 4. Storylines across seasons

**What changed.** Kept per coach in the save (S.saga): your best player's duel with each opponent's, meeting by
meeting; captains and whether one came up through your club; a veteran's title chase and the night he wins it; bitter
departures and the night one returns to face you. Written into the season's history entry (entry.people), the history
rows, the team page's season story, and the next opponent's line.

**How tested.** `node test/story.js`: MATCH 40 checks. `node test/migrate.js`: MATCH 2253 of 2253 (the migrate test now
treats `people`, like `story`, as written only when there is something to tell). A 4-season NFL smoke run produced
captain, chase, bitter departure and duel lines.

## 5. A realistic staff room

**What changed.** Help -> "Staff room": Realistic (default in the pro leagues: names and jobs such as "video
coordinator", initials for faces, plain words) or Characters (default in college: Pearl, the Two Bears, the
Apprehensive Capybara). Only the voices change; the advice is the same. Pearl's dog asides and the Bears' "distracted"
lines are skipped in realistic mode, and any line that is pure character becomes plain advice.

**How tested.** A smoke script over all seven games: in the pro games, 0 of 260-380 Bears and Pearl lines kept a
character aside; toggling the setting swaps names both ways.

## Goldens

Re-recorded deliberately for all seven games (fast and full, and the hot-seat fingerprints), with notes: engine 25's
morale and crowd edge change results; the team card, roster, player page, news and history rows show the people; the
pro staff rooms speak as realistic staff.

Evidence that nothing else moved: with `PEOPLE_ON=0` (the layer off), the NBA fast golden's games, records, poll,
awards and history equal round 110's, and its universe equals round 110's once `engV` (24 -> 25) is stripped
(`STRIP=engV ... --fast --dump`: e953fd4864c412b6 on both builds); only `screens` differ. The NBA hot-seat fingerprint
with `PEOPLE_ON=0` is round 110's exactly (d9c452b4879407ca).

Commands: `node test/golden.js dist/<game>.html [--fast] --write --note "..."` and
`node test/hotseat.js dist/<game>.html --write --note "..."`, one at a time.

| golden | old -> new |
|---|---|
| golden-fast.json (cfb) | 30c6ece58cf32d78 -> c2f41bc5900cccb7 |
| golden.json (cfb) | e16166e4f2373c43 -> d46abfb12035629a |
| golden-fast-nfl | f214c1e9bd9f5025 -> 9370c2cda3faba15 |
| golden-nfl | 2dadafc3c2ca9735 -> 7e8c4e25dfdb5f4b |
| golden-fast-ncaab | c81a35489f0479ac -> fb5be3f201059a15 |
| golden-ncaab | 45cff08c498c4f41 -> 34c762b7beebe588 |
| golden-fast-nba | b67133ff4419ea04 -> 5bc2221a6b1e47e0 |
| golden-nba | b0d4fc8493ebefae -> dd71d385f7ff168e |
| golden-fast-nhl | 55b61b4531d1e1c8 -> 2acf046a2a38e0a8 |
| golden-nhl | 5b5b8ddc7dd608c4 -> 9be5b4b9edfa25b8 |
| golden-fast-epl | 3d45da509d39d7b9 -> dff8646687a39947 |
| golden-epl | 970533ca1a8ba026 -> 77f8649b23529ebb |
| golden-fast-mlb | b47ce354d7c745ac -> 2c4d08bcccb9ed43 |
| golden-mlb | 1ebdddcc4e20204a -> c4c7acc5df5c46eb |

## Other tests run

- `node test/reload.js dist/football-coach.html`: MATCH 18 of 18; `dist/basketball-coach-pro.html`: MATCH 18 of 18.
- `OLD=<round 110 pages, engine 24> node test/engine-replay.js <game>` for all seven: MATCH (an engine-24 season
  replays as it was played).
- `node test/saves.js`: MATCH.
