/* ============ engine 27: game day as a head coach does it (review round 3, rv3/fb-tactics) ============
   Everything here moves results only on seasons begun on engine 27 (fb27()); an older season replays as it was.

   1. One engine for every game. On engine 26 a computer game went through playGame, a short loop with no fourth-down
      choice, no two-point try, no endgame and a kick after every touchdown (Ian, round 39: 0 of ~220,000 touchdowns
      went for two), while a live game went through makeLiveGame. On 27 playGame plays makeLiveGame with nobody
      calling, so the computer, your assistant and a simmed game coach by the same rules as the game you watch.
   2. The coach's calls at the rates real coaches make them (fb27Fourth, fb27TwoGo): fourth downs (go, kick or punt
      by distance, field and score), two-point tries, the extra point's misses.
   3. Interceptions: a team's interceptions follow its passing less steeply than its other turnovers (fb27Int).
   The weekly game plan (levers on both sides of the ball), timeouts, challenges and the half-time adjustment follow
   in the sections below. */
function fb27(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=27 }

/* ---- real figures (read November 2026) ----
   NFL fourth downs: 1.47 attempts a team-game in 2023 (51.8% made), 1.40 in 2024 (56.8%); 4th and 1 made 68.6%, 4th
   and 2 57.8% (2024): https://bracketology.engr.wisc.edu/nfl-analytics-recap-of-the-2024-regular-season/ ; 766
   attempts in 2024, 57% made; 4th and 1 gone for 71% of the time (42% in 2014), 88% past midfield; 7.52 punts a game:
   https://www.foxsports.com/stories/nfl/why-nfl-offenses-going-fourth-down-more-than-ever
   NFL two-point tries: 9.8% of touchdowns in 2024 (4.4% in 2014), made 47.6% over the last five seasons (40% in 2024,
   56.5% in 2023); extra points 96%: the bracketology link above.
   FBS fourth downs: 3.6 attempts a game, both teams, in 2022 (the most since 2015), 3.64 in 2025 through week 11; made
   54-54.9%: https://www.ksat.com/sports/2025/11/12/college-football-picks-trend-of-going-for-it-on-4th-down-continues-to-rise-and-so-does-success-rate/
   FBS two-point tries: 493 in 2024, 45.8% made (the best since 1974):
   https://www.nbcsports.com/college-football/news/college-football-coaches-are-going-for-two-and-converting-at-the-highest-rate-since-the-1970s */
const FB27_REAL={nfl:{go:[1.40,1.47], conv:[0.518,0.568], two:0.098, twoOk:0.476, pat:0.96},
                 cfb:{go:[1.80,1.82], conv:[0.54,0.549], two:0.08, twoOk:0.458, pat:0.98}};
const FB27=Object.assign({
  nfl:{goK:0.92, twoOk:0.476, pat:0.96, intI:0.058, intK:0.2, fumI:0.045, fumK:0.3, tdK:0.91, fgK:0.71},
  cfb:{goK:1.02, twoOk:0.458, pat:0.98, intI:0.06, intK:0.15, fumI:0.05, fumK:0.3, tdK:0.91, fgK:0.78}}[typeof LEAGUE!=="undefined"&&LEAGUE.id==="nfl"?"nfl":"cfb"],
  typeof process!=="undefined"&&process.env&&process.env.FB27?JSON.parse(process.env.FB27):{});

/* ---- 2. fourth down: go, kick or punt ----
   stall: the spot (yards from the offense's own goal), togo, d: the offense's margin, left: possessions to go, this one
   included. The chance of going for it by distance and field, as the league's coaches do now (4th and 1 past midfield
   nearly always; inside your 30 almost never), more behind late, less ahead late. A draw only when the answer isn't
   certain. Returns "go", "kick" or "punt". */
function fb27GoRate(stall,togo,d,q,left){
  const opp=stall>=50, inFG=stall>=62, goal=togo>=100-stall;
  let p;
  if(stall<30)p=togo<=1?0.10:0.01;
  else if(!opp)p=togo<=1?0.52:togo<=2?0.22:togo<=3?0.08:0.02;
  else if(!inFG)p=togo<=1?0.90:togo<=2?0.68:togo<=3?0.48:togo<=5?0.28:togo<=7?0.12:0.05;
  else p=togo<=1?(goal?0.62:0.52):togo<=2?0.30:togo<=3?0.14:togo<=5?0.06:0.02;
  p=Math.min(0.97,p*FB27.goK);
  // the score and the clock: behind late you can't kick it away; ahead late a punt is safe
  if(q>=4||left<=6){ if(d<0)p=Math.min(0.98,p*(d<=-9?2.6:1.8)+(d<=-9?0.15:0.05)); else if(d>0)p*=d>=9?0.35:0.6 }
  return p }
function fb27Fourth(rng,stall,togo,d,q,left,ctxK){
  // the last two possessions behind: the score decides (endgameDrive's rule, kept)
  const inRange=stall>=(ctxK==null?60:ctxK);
  if(left<=2&&d<0){ if(-d<=3&&inRange)return "kick"; return "go" }
  if(left<=2&&d>=0&&d<=2&&inRange)return "kick";
  const p=fb27GoRate(stall,togo,d,q,left);
  if(p>=0.999||rng.r()<p)return "go";
  if(!inRange)return "punt";
  if(ctxK===0)return "kick";   // the drive already rolled its kick
  // a long kick is a choice: nearly always from 45 yards in, about half the time from 50, rarely past 55 (pros; college shorter)
  const dist=fgDistance(stall), k=LEAGUE.id==="nfl"?[46,51,56]:[42,47,52], pk=dist<=k[0]?1:dist<=k[1]?1-0.5*(dist-k[0])/(k[1]-k[0]):dist<=k[2]?0.5-0.4*(dist-k[1])/(k[2]-k[1]):0.1;
  return pk>=1||rng.r()<pk?"kick":"punt" }
/* two points or one: the chart late (twoChart), and earlier the tries today's coaches make (down 8 after the score,
   up 1, a share of the rest). The rates by margin are set so that tries come to the league's share of touchdowns. */
function fb27TwoGo(rng,diff6,q,left){
  if(twoChart(diff6,q>=4||left<=8))return true;
  const base=(LEAGUE.id==="nfl"?0.024:0.025)*(q>=3?1.5:1);
  const m={"-8":0.55,"-2":0.45,"-5":0.25,"-9":0.2,"-12":0.2,"5":0.18,"1":0.22,"-1":0.12,"-15":0.18,"12":0.12,"8":0.05}[String(diff6)];
  return rng.r()<(m!=null?Math.max(m*(q>=3?1.2:0.5),base):base) }
function fb27TwoOk(rng,offE,defE){ return rng.r()<Math.max(0.3,Math.min(0.65,FB27.twoOk+(offE-defE)*GAP_SCALE/5200)) }
function fb27Pat(rng){ return rng.r()<FB27.pat }

/* ---- 3. interceptions ----
   A drive's turnovers move with the gap and the plan (driveOdds' to); on engine 26 55% of every turnover was a pick, so
   the weakest passers threw 26-28 a season (the leader, real 15-21 in 2022-24) and every side lost 0.6 fumbles a game
   (the NFL about 0.45). Here a pick takes FB27.intI of a drive and a lost fumble FB27.fumI at the league's usual rate,
   and each follows the rest of the turnover term only by intK and fumK (a weak side's drives die in punts and downs
   more than in giveaways). sm.dInt and sm.dFum: the game plan's own (pass-heavy throws more picks, and so on). */
function fb27To(to,sm){ const t0=0.135, x=to-t0;
  return [Math.max(0.008,FB27.intI+FB27.intK*x*0.55+(sm&&sm.dInt||0)), Math.max(0.008,FB27.fumI+FB27.fumK*x*0.45+(sm&&sm.dFum||0))] }

/* ---- 1. playGame on engine 27: makeLiveGame with nobody calling ----
   opts.decide (a decide hook) answers asks for the side it coaches; the rest is the computer's. */
function playGame27(rng,eloH,eloA,planH,planA,opts){
  opts=opts||{};
  const hum=opts.decide?{home:!!opts.userIsHome,away:!opts.userIsHome}:{home:false,away:false};
  const e=makeLiveGame(rng,eloH,eloA,planH,planA,hum,!!opts.playoff,opts.ctx||{});
  let r,g=0; while(g++<4000){ r=e.next(); if(r.done)break; if(r.ask)e.reply(opts.decide?opts.decide(r.ask,{}):"normal") }
  return {h:e.h,a:e.a,drives:e.drives,ot:e.drives.some(d=>d.ot)?1:0} }
/* a drive that ended at fourth down: a punt, a kick, or stopped on downs at the spot (not a touchdown or a turnover) */
function fb27Stalled(res){ return !!res&&res.stall!=null&&res.togo!=null&&(res.kind==="PUNT"||res.kind==="DOWNS"||res.kind==="MISS"||res.kind==="FG") }
/* the longest kick a coach tries: the pros about 57 yards (their 60), college about 52 (their 65) */
function FB27K(){ return LEAGUE.id==="nfl"?60:65 }
/* the fourth down played out as chosen. A kick the drive had already rolled keeps its result; a go is made at goOdds and
   the drive goes on from where it was made (its own plan, as any drive); a punt is from the spot. */
function fb27Resolve(choice,res,offE,defE,aggr,sm){
  const rng=fb27Resolve.rng, tg=res.togo||3, at=res.stall;
  if(choice==="kick"){ if(res.kind==="FG"||res.kind==="MISS")return Object.assign({},res);
    const dist=fgDistance(at); return rng.r()<fgOdds(at)?{pts:3,kind:"FG",stall:at,togo:tg,att:dist}:{pts:0,kind:"MISS",stall:at,togo:tg,att:dist} }
  if(choice==="punt")return {pts:0,kind:"PUNT",stall:at,togo:tg};
  // go
  if(rng.r()<goOdds(tg,offE,defE)){
    const r2=rollDrive(rng,offE,defE,Math.min(90,at+Math.max(2,tg)),aggr,null,sm);
    return Object.assign(r2,{converted:true,go:1,cv:[at,tg],note:r2.pts>0?`converted on fourth and ${tg}, then scored`:`converted on fourth and ${tg}, drive stalled later`}) }
  return {pts:0,kind:"DOWNS",stall:at,togo:tg,converted:false,go:1,note:`went for it on fourth and ${tg} and came up short`} }
/* a touchdown's try: two points or the kick (the computer's and your assistant's way) */
function fb27Try(rng,r,diff6,q,left,offE,defE){
  if(r.kind!=="TD"||r.pts!==7||r.two)return r;
  if(fb27TwoGo(rng,diff6,q,left)){ const ok=fb27TwoOk(rng,offE,defE); r.pts=ok?8:6; r.two=1; r.note=(r.note?r.note+"; ":"")+(ok?"went for two and got it":"went for two and was stopped") }
  else if(!fb27Pat(rng)){ r.pts=6; r.note=(r.note?r.note+"; ":"")+"missed the extra point" }
  return r }
