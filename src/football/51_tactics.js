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
  nfl:{goK:0.92, twoOk:0.476, pat:0.96, intI:0.056, intK:0.2, fumI:0.045, fumK:0.3, tdK:0.895, fgK:0.71},
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

/* ============ the weekly game plan (engine 27) ============
   Five levers, each a trade with a real cost, each worth what the two rosters make it:
   - Offense, run or pass (mix): leaning on the side of your offense that beats the side of their defense (your passing
     game against their coverage, your run game against their front, both against each team's own level) is worth Elo
     on every drive; throwing more scores more touchdowns and throws more picks, running keeps the ball and the clock
     (fewer possessions for both sides: an underdog's friend). Two deep shells take away the pass and give up the run,
     a single-high safety the reverse.
   - Tempo: hurry-up gives both sides more possessions (more of the game decided by who's better: the favourite's
     friend), a little sharper (the defense can't change personnel) and tires your own defense; slow the reverse.
   - Coverage: man (Cover 1 single-high, 2-man two-high) is worth your corners and safeties against their receivers,
     and gives up the big play when it loses; zone (Cover 3, Cover 2 and quarters) gives up the short throw and keeps
     the ball in front, with more picks.
   - Blitz: more rushers is worth your pass rush against their protection, sacks and strips, and the big play when the
     ball gets out (an accurate quarterback beats it); fewer rushers the reverse.
   - Key on a man: their back, their top receiver or a spy on the quarterback. It takes away a standout and costs the
     rest of the field, so it pays only when one man is clearly their best weapon.
   No lever has a right answer on its own: at a matchup of league-average shapes every option is worth the same (the
   GP_C constants hold it there, measured), and the best plan moves with both rosters and their plan
   (test/fb-tactics.js counts how often each option is best). Real figures: the league blitzed on 25.4% of dropbacks
   outside the red zone in 2024, the #3 lowest of the decade, and quarterbacks against it averaged 7.3-8.6 yards an
   attempt and about zero EPA (2011-2024: https://www.sharpfootballanalysis.com/analysis/nfl-offense-struggles-blitz-2024-warren-sharp/amp/),
   that is, a blitz is neither better nor worse on average, only for the matchup; 23-28% of blitzes come with two-high
   shells behind them (https://www.yardbarker.com/nfl/articles/nfl_defenses_are_bringing_blitzing_back/s1_17304_41038171). */
const GP_OPT={
  mix:  [["run","Lean on the run"],["bal","Balanced"],["pass","Throw it more"]],
  tempo:[["slow","Slow it down"],["norm","Usual tempo"],["fast","Hurry-up"]],
  cov:  [["c1","Man, one deep"],["c3","Zone, one deep"],["c2","Zone, two deep"],["c2m","Man, two deep"]],
  blitz:[["low","Rush four"],["norm","Usual pressure"],["high","Blitz often"]],
  key:  [["none","Play it straight"],["rb","Key on their back"],["wr","Double their top receiver"],["qb","Spy the quarterback"]]};
const GP_KEYS=Object.keys(GP_OPT), GP_DEF={mix:"bal",tempo:"norm",cov:"c3",blitz:"norm",key:"none"};
const GP_LAB={mix:"Offense",tempo:"Tempo",cov:"Coverage",blitz:"Pressure",key:"Key on"};
function gpOk(g){ const o={}; GP_KEYS.forEach(k=>{ o[k]=g&&GP_OPT[k].some(x=>x[0]===g[k])?g[k]:GP_DEF[k] }); return o }
function gpLabel(k,v){ const x=GP_OPT[k]&&GP_OPT[k].find(y=>y[0]===v); return x?x[1]:v }
/* a team's units, rating points against its own team rating (tilts): who it is good at, not how good it is (the Elo
   gap already counts that). A hurt starter's backup plays. */
function fb27Units(R,H){ if(!R)return null; const p=i=>{ const x=H&&H.has(i)?R[BK(i)]||R[i]:R[i]; return x?x.r:60 };
  const tr=POS.reduce((s,P,i)=>s+P.w*p(i),0);
  const u={passO:0.55*p(0)+0.2*p(2)+0.12*p(3)+0.13*p(4), runO:0.55*p(1)+0.45*p(4), rec:0.6*p(2)+0.4*p(3), prot:p(4),
    rush:0.6*p(5)+0.4*p(6), front:0.4*p(6)+0.35*p(7)+0.25*p(5), cov:0.6*p(8)+0.4*p(9), rb:p(1), wr:p(2), wr2:p(3), qb:p(0)};
  Object.keys(u).forEach(k=>u[k]=Math.round((u[k]-tr)*100)/100);
  // the quarterback's legs (a scrambler is worth a spy) and his accuracy (beats the blitz), as leans
  let qs=0, qa=0; try{ const Q=H&&H.has(0)?R[BK(0)]:R[0], A=typeof attrOf==="function"?attrOf(Q):null; if(A&&Q){ qs=(A.spd||Q.r)-Q.r; qa=(A.acc||Q.r)-Q.r } }catch(e){}
  u.qs=Math.round(qs*10)/10; u.qa=Math.round(qa*10)/10;
  return u }
function fb27UnitsT(t,sea){ try{ sea=sea||SEA; const H=sea.talent?new Set(sea.talent.active(t).map(x=>x.idx)):null; return fb27Units(sea.roster[t],H) }catch(e){ return null } }
/* the sizes: Elo a rating point of each matchup term, clamps, and each option's own worth held to nothing at an average
   matchup (GP_C, measured: test/fb-tactics.js --calib). Centres: the league's average tilts (measured on season one). */
const GP_K=Object.assign({
  nfl:{km:3.0, sh:14, kman:2.4, kb:2.2, kq:1.6, kk:2.6, cl:14, rel0:-1.8, man0:0.4, bl0:-0.2, rb0:0.0, wr0:0.0, qs0:0.0},
  cfb:{km:2.6, sh:16, kman:2.0, kb:1.8, kq:1.4, kk:2.2, cl:18, rel0:-0.6, man0:-0.3, bl0:1.0, rb0:0.8, wr0:1.6, qs0:0.0}}[typeof LEAGUE!=="undefined"&&LEAGUE.id==="nfl"?"nfl":"cfb"],
  typeof process!=="undefined"&&process.env&&process.env.GP_K?JSON.parse(process.env.GP_K):{});
// each option's style on the drive (td, dInt, dFum, brk, sus, gain) and its possessions a team; oppTd: on the other side's drives
const GP_STYLE={
  mix:{run:{td:-0.012,dInt:-0.010,dFum:0.004,sus:0.03,poss:-0.45}, bal:{}, pass:{td:0.006,dInt:0.010,brk:0.008,sus:-0.03,poss:0.15}},
  tempo:{slow:{sus:-0.02,poss:-0.55,oppTd:-0.006}, norm:{}, fast:{sus:0.03,poss:0.6,oppTd:0.008}}};
const GP_DSTYLE={   // a defense's style on the other side's drives
  cov:{c1:{brk:0.014,dInt:-0.004,sus:-0.03}, c3:{sus:0.015}, c2:{brk:-0.010,dInt:0.002,sus:0.035}, c2m:{brk:0.004,dInt:-0.002,sus:-0.02}},
  blitz:{low:{gain:2,brk:-0.012,dInt:-0.002,sus:0.015}, norm:{}, high:{gain:-6,dInt:0.006,dFum:0.004,brk:0.022,td:0.004}}};
const GP_C=Object.assign({nfl:{"mix.run":-5,"mix.pass":0.2,"tempo.slow":-6.1,"tempo.fast":2.2,"cov.c1":0,"cov.c2":-8.5,"cov.c2m":-11.2,"blitz.low":5.9,"blitz.high":-3.9,"key.rb":-2,"key.wr":-2,"key.qb":-2},
  cfb:{"mix.run":3.5,"mix.pass":-7.1,"tempo.slow":-0.3,"tempo.fast":-2.8,"cov.c1":2.9,"cov.c2":-14.8,"cov.c2m":-21.3,"blitz.low":8.1,"blitz.high":-11.2,"key.rb":-2,"key.wr":-2,"key.qb":-2}}[typeof LEAGUE!=="undefined"&&LEAGUE.id==="nfl"?"nfl":"cfb"],
  typeof process!=="undefined"&&process.env&&process.env.GP_C?JSON.parse(process.env.GP_C):{});
const gpCl=(v,c)=>Math.max(-c,Math.min(c,v));
const GP_SHELL={c1:-1,c3:-1,c2:1,c2m:1}, GP_MAN={c1:1,c2m:1,c3:0,c2:0}, GP_M={run:-1,bal:0,pass:1}, GP_B={low:-1,norm:0,high:1};
/* one side's drives: its offense's plan (O, units uO) against the other's defense (D, units uD). Returns the drive's
   changes (td, dInt, dFum, brk, sus, gain) and elo, its edge on every drive. Each Elo term is also kept apart (parts), for
   the card's evidence and the tests. */
function fb27Mods(O,D,uO,uD){
  O=gpOk(O); D=gpOk(D); const K=GP_K, m=GP_M[O.mix], sh=GP_SHELL[D.cov], b=GP_B[D.blitz], P={};
  const x={td:0,dInt:0,dFum:0,brk:0,sus:0,gain:0};
  const add=s=>{ if(s)Object.keys(x).forEach(k=>{ if(s[k])x[k]+=s[k] }) };
  add(GP_STYLE.mix[O.mix]); add(GP_STYLE.tempo[O.tempo]); add(GP_DSTYLE.cov[D.cov]); add(GP_DSTYLE.blitz[D.blitz]);
  if(D.tempo==="fast")x.td+=GP_STYLE.tempo.fast.oppTd; else if(D.tempo==="slow")x.td+=GP_STYLE.tempo.slow.oppTd;   // their tempo tires (or rests) their own defense: here, D's offense
  if(uO&&uD){
    P.mix=m*K.km*gpCl(((uO.passO-uO.runO)-(uD.cov-uD.front))-K.rel0,K.cl);
    P.man=GP_MAN[D.cov]?-K.kman*gpCl(uD.cov-uO.rec-K.man0,K.cl):0;
    P.blitz=b?-b*K.kb*gpCl((uD.rush-uO.prot)-K.bl0,K.cl)+b*K.kq*gpCl(uO.qa,8):0;
    const so=(v,c)=>Math.max(0,v-c);   // a standout: past the rest of his group
    P.key=D.key==="rb"?-K.kk*so(uO.rb-uO.rec,K.rb0)*(1-0.4*m):D.key==="wr"?-K.kk*so(uO.wr-uO.wr2,K.wr0)*(1+0.3*m)*0.8:D.key==="qb"?-K.kk*so(uO.qs,K.qs0)*1.2:0;
  } else { P.mix=0; P.man=0; P.blitz=0; P.key=0 }
  P.shell=-m*sh*K.sh;
  const C=k=>GP_C[k]||0;
  P.cost=C("mix."+O.mix)+C("tempo."+O.tempo)-C("cov."+D.cov)-C("blitz."+D.blitz)-C("key."+D.key);
  const elo=Object.values(P).reduce((a,v)=>a+v,0);
  return {elo:Math.round(elo*10)/10, td:x.td, dInt:x.dInt, dFum:x.dFum, brk:x.brk, sus:x.sus, gain:x.gain, parts:P} }
/* possessions a team in a game from both plans: the league's drives, plus each offense's mix and tempo. A fraction is
   settled by the game's seed (no draw), so on average it's exact. */
function fb27Drives(gH,gA,seed){ const S=g=>{ g=gpOk(g); return (GP_STYLE.mix[g.mix].poss||0)+(GP_STYLE.tempo[g.tempo].poss||0) };
  const f=S(gH)+S(gA), base=DRIVES_PER_TEAM, fr=((strHash("gp|"+(seed||0))%1000)/1000);
  return Math.max(base-2,Math.min(base+2,base+Math.floor(f+fr))) }

/* the possessions in a game, for its clock: a live game's engine, or a game's drives (each carries tot when it isn't the league's) */
function fbTot(L){ if(L&&L.eng&&L.eng.total)return L.eng.total; const ds=L&&(Array.isArray(L)?L:L.drives), d=ds&&ds[0]; return d&&d.tot||DRIVES_PER_TEAM*2 }

/* ---- the computer's plan, and your assistant's (the same: simming is the computer coaching your club) ----
   Offense: the mix its matchup suits, through the club's own habit (a coordinator's lean, by club and year: about one
   club in three leans off the matchup); tempo is a club's habit (about one in five hurries, one in seven slows it).
   Defense: its usual scheme this season (clubScheme, from the roster: the blitz from pass rush, the two-deep shell from
   coverage, the loaded box from strength and tackling), drawn for the game 5 times in 7 as the scouting report says,
   and a key on a clear standout. */
const GP_SCH={blitz:{cov:"c1",blitz:"high"}, shell:{cov:"c2",blitz:"low"}, box:{cov:"c3",blitz:"norm"}};
function fb27Hab(t,year,k){ return (strHash(t+"|gp|"+k+"|"+year)%1000)/1000 }
function fb27CpuOff(t,year,uT,uO,oppSch){ const K=GP_K, h=fb27Hab(t,year,"mix"), t2=fb27Hab(t,year,"tempo");
  let s=uT&&uO?K.km*gpCl(((uT.passO-uT.runO)-(uO.cov-uO.front))-K.rel0,K.cl):0;
  if(oppSch&&GP_SCH[oppSch])s+=GP_SHELL[GP_SCH[oppSch].cov]*-K.sh*0.6;   // their usual shell, from the film
  s+=(h-0.5)*40;
  return {mix:s>14?"pass":s<-14?"run":"bal", tempo:t2<0.19?"fast":t2<0.33?"slow":"norm"} }
function fb27CpuDef(t,year,sch,uT,uO){ const g=Object.assign({},GP_SCH[sch]||GP_SCH.box), K=GP_K;
  if(g.cov==="c2"&&uT&&uO&&uT.cov-uO.rec>4)g.cov="c2m";   // corners better than their receivers: man under two deep
  g.key="none"; if(uO&&fb27Hab(t,year,"key")<0.6){ if(uO.rb-uO.rec-K.rb0>5)g.key="rb"; else if(uO.wr-uO.wr2-K.wr0>7)g.key="wr"; else if(uO.qs-K.qs0>6)g.key="qb" }
  return g }
/* the scheme a computer defense plays in a game it plays against another computer club: its usual one 5 times in 7
   (fbFavW), from the game's seed (no draw from the game's dice) */
function fb27SchOf(fav,seed){ if(!fav)return SCHEME_KEYS[(seed>>>0)%3]; const w=SCHEME_KEYS.map(k=>k===fav?fbFavW():1), tot=w.reduce((a,b)=>a+b); let x=((strHash("sch|"+seed)%10000)/10000)*tot, i=0; while(x>w[i]){x-=w[i];i++} return SCHEME_KEYS[i] }
/* your plan for a game: the latest you set at or before it (S.fbGP[team]: [[year*100+step, plan]]), else your assistant's */
function fb27Idx(year,step){ return year*100+step }
function fb27UserPlan(t,idx){ const SV=typeof S!=="undefined"&&S?S:null, L=SV&&SV.fbGP&&SV.fbGP[t]; if(!L)return null; let g=null; L.forEach(x=>{ if(x[0]<=idx)g=x[1] }); return g?gpOk(g):null }
function fb27IsUser(t){ try{ return typeof S!=="undefined"&&S&&(S.myTeam===t||(Array.isArray(S.coaches)&&S.coaches.some(c=>c&&c.team===t))) }catch(e){ return false } }
/* gameCtx's part: both sides' units and plans for the game (computer sides' defenses as drawn for the game) */
function fb27Ctx(h,a,year,step,fav,seed,sea){ try{ if(!fb27())return undefined; sea=sea||(typeof SEA!=="undefined"?SEA:null); if(!sea||!sea.roster)return undefined;
  const U={home:fb27UnitsT(h,sea),away:fb27UnitsT(a,sea)}, idx=fb27Idx(year,step), T={home:h,away:a}, o={u:U,g:{},user:{}};
  ["home","away"].forEach((sd,j)=>{ const t=T[sd], od=sd==="home"?"away":"home", mine=fb27UserPlan(t,idx);
    const sch=fb27SchOf(fav&&fav[sd],(seed||0)+(j?11:7)), oppSch=fav&&fav[od];
    const auto=Object.assign(fb27CpuOff(t,year,U[sd],U[od],oppSch),fb27CpuDef(t,year,sch,U[sd],U[od]));
    o.g[sd]=mine||auto; o.auto=o.auto||{}; o.auto[sd]=auto; o.sch=o.sch||{}; o.sch[sd]=sch; if(mine)o.user[sd]=1 });
  return o }catch(e){ return undefined } }
