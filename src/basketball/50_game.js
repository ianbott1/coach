/* ============ the game: basketball ============ */
/* Played possession by possession: a turnover, or a shot (two or three),
   with fouls to the line and offensive rebounds for a second chance. The
   rating gap tilts each side's make rates and turnovers; home court is a
   small edge for the home side. A gameplan sets the pace (possessions) and
   the share of threes. Twos and threes are worth the same on average, so a
   plan changes how swingy a game is, not how many points it's worth: more
   possessions and fewer threes let the better team's talent show; fewer
   possessions and more threes make it a game of chances.
   Possessions are grouped into eight five-minute segments, which the live
   view shows one at a time (the sport's "drives"). */
const DRIVES_PER_TEAM = 4;                    // segments per half; 8 in a game
const SEGS = 8;
const BB_COLLEGE = {
  pace: 69,             // possessions per team per game, both teams balanced
  paceSd: 3.0,
  gapPerPoss: 0.00039,  // rating gap (Elo) -> make-rate edge (calibrated: test/bb-calibrate.js)
  toBase: 0.164, toGap: 0.9,
  two: 0.533, three: 0.360,   // with fouls and and-ones, a two and a three are each worth ~1.05
  foul2: 0.085, foul3: 0.015, ft: 0.715, and1: 0.07,   // threes are rarely fouled
  oreb: 0.22,
  pressTO: 0.08,        // a press forces this many extra turnovers...
  pressEasy: 0.05,      // ...and gives up this much easier baskets when broken
  pressPace: 1.1,      // and speeds the game up
  garbage: 13,          // a lead this big after 25 minutes: the benches come in
  benchPull: 0.05,      // the bench's make-rate cost to the side that's ahead
  // reading the game (test/bb-reads.js)
  answer:{share:-0.15, p3:-0.045, p2:-0.052, f2:0.78, to:0.052, p2t:-0.022},   // the right defense on their style (round 43: x1.5)
  leak:{p2:0.0135, p3:0.009},  // the wrong one: easier looks somewhere else
  cueTrue:0.4,          // commentary on a style that is about the real one
  favW:4,               // a team's usual offense: this many times as likely as any other. The report is right 61% of
                        // the time in college (70% pro); 5 made it 72%, but more predictable opponents cut March upsets
                        // (6 v 11 favourites 63.5% to 67.1%, real 61.5), so it stays (Nov 2026)
  scouted:6,            // games in a scouting report
  prepped:{p2:-0.008, p3:-0.008},   // the right defense, drilled all week: sharper than a mid-game switch
  misprep:{p2:0.013, p3:0.0095},   // round 43 (0.008/0.006): a guess before tip-off would have paid     // the wrong one from the tip: out of position until you change it
  pnrTell:[2.0,5.0],    // ball screens a segment: other styles, pick-and-roll
  starOwn:0.034,        // your star off the floor: your make rates, this much lower... (round 44: 0.022; foul trouble a real call)
  starClutch:2.2,       // ...and this many times more in the closing segments (who finishes games)
  starDef:0.009,        // ...and theirs this much higher (0.006)
  starFouls:2.6,        // a star's fouls a game, an ordinary crew
  foulOut:5,
  teamFouls:17,         // fouls called on a side a game, an ordinary crew
  crews:[[0.25,0.65],[0.5,1.0],[0.25,1.7]]   // how tight tonight's referees are: [share of games, fouls x]
};
/* a league can set its own game (LEAGUE.tuning.bb): the pros play 48
   minutes in quarters, faster, with better shooting */
const BB = Object.assign({}, BB_COLLEGE,
  (typeof LEAGUE!=="undefined"&&LEAGUE.tuning&&LEAGUE.tuning.bb)||{});
/* round 111 (engine 25): game day as coaching. Timeouts: a side has BB.timeouts a game (NBA 7, NCAA men's 4 in a
   broadcast game: one 60-second and three 30-second; official.nba.com Rule 5 VI, en.wikipedia.org/wiki/Time-out_(sport)).
   A run (a stretch won by BB.runPts or more, the run of play's RUN) carries a little into the next stretch unless the
   side it hurt calls a timeout or a period ends. Small on purpose: matched studies find the post-timeout recovery is
   mostly regression to the mean, at most about 0.06 points a possession (arxiv.org/abs/2009.06750) or slightly against
   the side calling it (arxiv.org/abs/2011.11691). BB.momentum to each side's make rate (+ the side on the run, - the
   other) is about 0.05 points a possession between them. A timeout also lets you change the defense, and one kept for
   the end means a drawn-up last shot: without one it's a scramble (BB.noTO of the make rate). The computer and your
   assistant call one on any run they face while they have one, so the computer's own games play as before. */
const BB_GD_V=25;   // the engine version these arrive with (core 20 ENGINE_NOW)
function bbGdV(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=BB_GD_V }
const BB_GD=Object.assign({timeouts:BB.quarters?7:4, runPts:8, momentum:0.012, noTO:0.85,
  // the rotation (round 111, step 2): the bench's share of the minutes, tight 0.12, as usual 0.20 (BENCH), deep 0.28.
  // Each stretch a tighter rotation has more of your starters on the floor (worth the starters' gap over the bench, by
  // the minutes moved: rating points x R_SLOPE); the minutes come back as tired legs in the last two stretches (and
  // overtime), by how much tighter you played before each, less for a side with Stamina. Set so a side with the
  // league's usual gap and Stamina gets nothing either way (a design choice, not a measured real figure): a thin
  // bench and fit starters want it tight, a deep bench or a tired-legged five want it deep. gMean: the league's mean
  // gap, starters over bench, by position weight (measured, scratch gaps.js: college 14.3 sd 3.8, pros 12.0 sd 3.3);
  // staK: a point of Stamina lean cuts the tiredness by this share (one league sd, 0.25 college and 0.13 pros, about 30%)
  rot:{tight:0.12, normal:0.20, deep:0.28}, gMean:BB.quarters?12.0:14.3, staK:BB.quarters?2.3:1.2},
  (typeof LEAGUE!=="undefined"&&LEAGUE.tuning&&LEAGUE.tuning.bbgd)||{});
const ROT_L={tight:"Tight rotation",normal:"Usual rotation",deep:"Go deep"};
/* engine 11 (round 88): what a point of team shape (gameCtx sh, a lean in rating points weighed by position and minutes)
   moves. c: each term's rate change per point, set so a point of any attribute is worth the same margin (measured on
   common dice: scratch r88/marg.js); a: how loud shapes are (one league sd of team Shooting moves the three-point rate
   by about two points). shr (three-point share) is a signature only. */
const BB11_ENV=k=>(typeof process!=="undefined"&&process.env&&process.env[k]);
const BB11=Object.assign({a:+(BB11_ENV("BB11_A")||2.5),
  c:Object.assign({sht:0.0165,pd:0.0163,fin:0.0158,id:0.016,ath:0.0083,athd:0.0062,ply:0.0125,reb:0.0138,sta:0.036,shr:0.02},   // college; the pros: LEAGUE.tuning.bb11
    (typeof LEAGUE!=="undefined"&&LEAGUE.tuning&&LEAGUE.tuning.bb11)||{}, BB11_ENV("BB11_C")?JSON.parse(BB11_ENV("BB11_C")):{})});
/* Calibrated on its own (test/bb-engine.js: 20,000 games, league spread sd
   160 Elo, home court 105 Elo): 72.8 points and 69 possessions a team, mean
   margin 11.9, game noise 12.7, home teams 59.2% (2.7 points) between equal
   sides, threes 35.2%, turnovers 0.173 a possession, overtime 6.9%.
   Real Division I: ~72, ~69, 11-12, ~11, 60-65% (~3), ~34%, ~0.18, ~6%.
   Calls (test/bb-calls.js): the press is usually right when behind late (as
   in real coaching); halftime and milking-the-clock calls are close; down 2
   on the last possession, the three is usually the better shot. */
const AGGR = {
  safe:      {tempo:1.08, three:0.18},        // work it inside: a little quicker. It was 1.36, which put a played NBA game at 136-142 a team (Ian, Muse, Grokbot); real paces differ by a few percent
  balanced:  {tempo:1.00, three:0.38},
  aggressive:{tempo:0.92, three:0.64},        // shorten the game: a little slower (was 0.66), and lots of threes
  // not gameplans: the engine's own late-game modes
  urgent:    {tempo:1.10, three:0.55},        // behind late: quick shots, threes
  sit:       {tempo:0.80, three:0.25},        // ahead late: bleed the clock
  chase:     {tempo:1.10, three:0.55},
  push:      {tempo:1.12, three:0.55}        // a coach's call: speed it up, let it fly
};
/* one possession: points scored, and a line for the box score */
const NOMOD={share:0,p2:0,p3:0,to:0,f2:1};
function possession(rng, edge, mode, st, pressed, m){
  const A=AGGR[mode]||AGGR.balanced; m=m||NOMOD;
  if(pressed){ if(rng.r()<BB.pressTO){st.to++; return 0} edge+=BB.pressEasy }   // against the press
  if(rng.r() < BB.toBase - edge*BB.toGap*0.1 + m.to){ st.to++; return 0 }
  for(let tries=0;tries<3;tries++){
    const three = rng.r() < Math.max(0.05,Math.min(0.85,A.three+m.share));
    // talent is worth the same per shot either way (2/3 of the edge on a
    // three), so taking more threes adds variance, not an edge
    const pMake = (three?BB.three+edge*2/3+m.p3:BB.two+edge+m.p2);
    if(rng.r() < (three?BB.foul3:BB.foul2*m.f2)){          // fouled in the act
      const n=three?3:2; let pts=0; st.fta+=n;
      for(let i=0;i<n;i++) if(rng.r()<BB.ft){pts++; st.ftm++}
      return pts;
    }
    if(three)st.tpa++; else st.fga2++;
    if(rng.r() < pMake){
      if(three)st.tpm++; else st.fgm2++;
      let pts=three?3:2;
      if(!three&&rng.r()<BB.and1){st.fta++; if(rng.r()<BB.ft){pts++;st.ftm++}}
      return pts;
    }
    if(rng.r() >= BB.oreb+(m.or||0)) return 0;        // defense rebounds (engine 11: the two sides' Rebounding)
    st.oreb++;
  }
  return 0;
}
/* How the game is managed from here, given the segment and the home lead:
   the edge (home side's) and each side's mode. */
function gameState(seg,lead,eH,planH,planA){
  const left=SEGS-seg, big=Math.abs(lead);
  let e=eH, mH=planH, mA=planA;
  if(seg>=5&&big>=BB.garbage){                    // decided: benches on both sides
    e=eH*0.4-Math.sign(lead)*BB.benchPull; mH="balanced"; mA="balanced";
  }else if(left<=2&&big>=4&&big<BB.garbage){      // late and close enough to matter
    if(lead>0){mH="sit";mA="chase"} else {mH="chase";mA="sit"}
  }
  return {eH:e,mH:mH,mA:mA};
}
const blankTeamLine=()=>({to:0,fta:0,ftm:0,tpa:0,tpm:0,fga2:0,fgm2:0,oreb:0});
/* Late, the team behind fouls: the leader goes to the line (two shots) and
   the trailer gets the ball back and hunts threes. */
function foulTrip(rng,st){let p=0; st.fta+=2; for(let i=0;i<2;i++)if(rng.r()<BB.ft){p++;st.ftm++} return p}

/* Every side has a way of scoring: bombing threes, pounding the paint, or
   running pick-and-roll. Each leaves a mark on the shot chart (three-point
   attempts, points in the paint, ball screens), and each has a defense that
   blunts it; the wrong defense leaks somewhere else. */
const STYLE={
  threes:{l:"bombing threes",       mod:{share:0.15, p2:0,     p3:-0.006, to:0,     f2:1},   answer:"chase"},
  paint: {l:"pounding the paint",   mod:{share:-0.15,p2:-0.005,p3:0,      to:0,     f2:1.2}, answer:"pack"},
  pnr:   {l:"running pick-and-roll",mod:{share:0,    p2:0.006, p3:0,      to:0.008, f2:1},   answer:"trap"}
};
/* round 100: the read panel's marks on points in the paint (Grokbot: never marked, even at 24 in a quarter), a rate a
   quarter (pros) or ten minutes (college). Measured at the read (scratch r100 paint.js, 300 reads a league): pros 20+
   is 69% of paint-pounding sides and 29% of the rest, 10 or under 6% and 40%; college 13+ 33% and 15%, 7 or under 23%
   and 51% */
function bbPaintMark(){ return BB.quarters?[20,10]:[13,7] }
const STYLE_KEYS=["threes","paint","pnr"];
const DEFENSES={
  chase:{beats:"threes",l:"Run them off the line",  d:"Close out hard, switch everything, live with drives"},
  pack: {beats:"paint", l:"Pack the paint: zone",    d:"Wall off the rim, make them shoot over it"},
  trap: {beats:"pnr",   l:"Trap the ball handler",   d:"Blitz the pick-and-roll, make someone else beat you"}
};
/* the offense a side runs, against the defense it faces: one possession's modifier */
function styleMod(off,def,prepd){
  const b=STYLE[off].mod, m={share:b.share,p2:b.p2,p3:b.p3,to:b.to,f2:b.f2};
  if(def){ if(DEFENSES[def].beats===off){ const A=BB.answer;
      if(off==="threes"){m.share+=A.share; m.p3+=A.p3}
      else if(off==="paint"){m.p2+=A.p2; m.f2*=A.f2}
      else {m.to+=A.to; m.p2+=A.p2t} }
    else { m.p2+=BB.leak.p2; m.p3+=BB.leak.p3 }
    if(prepd){ const P=DEFENSES[def].beats===off?BB.prepped:BB.misprep; m.p2+=P.p2; m.p3+=P.p3 } }
  return m;
}
/* round 107: what the read card marks, from the same counts and the same marks it shows. A pick that answers a marked
   style fits the evidence and is never graded wrong, like the best fit (Grokbot: two marks on the card and a hard cross;
   soccer's card marked crosses and the grade went by going long) */
function readFlags(dp){ const T=dp&&dp.tell; if(!T)return []; const n=Math.max(1,T.n), fa=Math.max(1,T.fga), share=100*T.tpa/fa, paint=T.paint/n*2, f=[];
  if(Math.round(share)>=45)f.push("threes"); if(+paint.toFixed(1)>=bbPaintMark()[0])f.push("paint"); if(T.pnr/n>=3.4)f.push("pnr");
  return f }
function bbRead(T){
  // the share of shots from three, and the ball screens: which style fits best
  const n=Math.max(1,T.n), f=Math.max(1,T.fga), r=T.tpa/f;
  const ll=k=>{ const rk=0.38+STYLE[k].mod.share, sr=Math.sqrt(rk*(1-rk)/f), mu=(k==="pnr"?BB.pnrTell[1]:BB.pnrTell[0])*n, sp=1.3*Math.sqrt(n);
    return -((r-rk)**2)/(2*sr*sr)-((T.pnr-mu)**2)/(2*sp*sp) };
  return STYLE_KEYS.reduce((a,k)=>ll(k)>ll(a)?k:a,STYLE_KEYS[0]);
}
const ASSIST=["normal","Leave it to your assistant"];
/* The calls a coach can make. dp: {k, h (headline), b (the situation),
   opts: [[key, label], ...]}; the last option always leaves it to the assistant. */
function readCall(stage,T,hint,cur){
  // "keep your setup" first when you have one, as in soccer (Instinct): "leave it to your assistant" hands the read back
  return {k:"read",stage:stage,h:stage===1?(BB.quarters?"End of the first quarter":"Ten minutes in"):"Half-time: their offense",
    b:stage===1?"How are they scoring? Pick the defense.":"Anything changed? Adjust the defense, or leave it.",
    // your current defense once, as "keep" (it was listed twice, the plain one identical to keeping: Instinct)
    opts:(stage===2&&cur&&DEFENSES[cur]?[["keep","Keep your setup: "+DEFENSES[cur].l]]:[]).concat(Object.keys(DEFENSES).filter(d=>!(stage===2&&d===cur)).map(d=>[d,DEFENSES[d].l])).concat([ASSIST]),
    tell:{tpa:T.tpa,fga:T.fga,paint:T.paint,pnr:T.pnr,n:T.n}, best:bbRead(T), pearl:hint||bbRead(T)};
}
const BB_FOULQ=true;
const CLOSE_FLOOR=3;   // round 50: within this many points late, the crunch-time read is always yours (core 99: not gated)
function foulCall(half,X,T,seg){
  return {k:"fouls",h:`Your star has ${X.f} fouls`,b:half===1?"Sit him until the half, or ride it out?":"Sit him until the last ten minutes, or leave him in?",
    opts:[["sit",half===1?"Sit him until the half":"Sit him until crunch time"],["play","Leave him in"],ASSIST],
    f:X.f, out:BB.foulOut, called:T.fouls, avg:Math.round(BB.teamFouls*2*seg/SEGS), pearl:T.lastSeg, rot:T.rot};
}
function halfCall(lead){
  return lead<0
    ? {k:"half",h:`Down ${-lead} at the half`,b:"Speed it up and let it fly, or stay the course?",
       opts:[["push","Speed it up, more threes"],["keep","Stay the course"],ASSIST]}
    : {k:"half",h:lead>0?`Up ${lead} at the half`:"Tied at the half",b:"Slow it down and protect it, or keep going?",
       opts:[["sit","Slow it down"],["keep","Keep going"],ASSIST]};
}
function lateCall(lead){
  return lead<0
    ? {k:"chase",h:`Down ${-lead}, ${BB.lateLeft||"five"} minutes left`,b:"Throw on the full-court press, or play it straight? The press forces turnovers and gives up easy baskets.",
       opts:[["press","Full-court press"],["keep","Play it straight"],ASSIST]}
    : {k:"protect",h:`Up ${lead}, ${BB.lateLeft||"five"} minutes left`,b:"Milk the clock, or keep attacking?",
       opts:[["sit","Milk the clock"],["keep","Keep attacking"],ASSIST]};
}
/* crunch time, level or ahead: a timeout, and what they go to now. Close teams lean on a closing play of their own
   (the report of their last close finishes); some stay with what they've run tonight. Measured as a call
   (test/call-weight.js), not a clock choice: milking it or attacking moved about 3 points and was cut (round 33).
   Grokbot: elimination games and a tied finish into overtime came and went with no call. */
/* a lead of 10 to 12 with a call's worth left: rest the starters now, or keep them in until it's safe (the bench
   comes in by itself at 13). The bench makes fewer shots; the starters can't get hurt from the bench. Muse and
   Grokbot: a decided game had nothing in its second half to decide, while real coaches make exactly this call
   (and Muse's college point guard was hurt in one). */
function restCall(lead){
  return {k:"rest",h:`Up ${lead}, ${BB.lateLeft||"five"} minutes left`,
    b:"Rest your starters? The bench finishes it: a lead this size usually holds, though not always, and nobody gets hurt sitting down. Keep them in and they close it out, at the usual risk.",
    opts:[["rest","Rest the starters"],["keep","Keep them in until it's safe"],["normal","Leave it to your assistant"]]};
}
function closeCall(lead,rep,n,cur){
  const top=STYLE_KEYS.reduce((a,k)=>rep[k]>rep[a]?k:a,STYLE_KEYS[0]);
  return {k:"close",h:`${lead>0?"Up "+lead:lead<0?"Down "+(-lead):"Tied"}, ${BB.lateLeft||"five"} minutes left`,
    b:"Timeout. They'll go to their closing play, or stay with what's worked tonight. What do you take away?",
    opts:(cur&&DEFENSES[cur]?[["keep","Keep your setup: "+DEFENSES[cur].l]]:[]).concat(Object.keys(DEFENSES).filter(d=>d!==cur).map(d=>[d,DEFENSES[d].l])).concat([ASSIST]),
    report:Object.assign({},rep), n:n, pearl:top};
}
/* round 111: behind in the last minute (one to eight). Fouling stops the clock and buys possessions at the price of
   their free throws; playing it out lets them run one down, and gets you one more. The computer and your assistant
   foul, as before. Graded by replay; asked only in reach and when it gains on your assistant (core GATE_KINDS defend) */
function defendCall(L,ftm,fta){
  return {k:"defend",h:`Down ${-L}, under a minute left`,b:"Foul to stop the clock and send them to the line, or play it out and get a stop?",
    opts:[["foul","Foul: send them to the line"],["defend","Play it out: get a stop"],ASSIST], ft:{m:ftm,a:fta}, avg:Math.round(BB.ft*100), down:-L};
}
function lastCall(left){
  return {k:"last",h:"Down 2, last possession",b:"A three wins it. A two sends it to overtime."+(left===0?" No timeouts left: no play drawn up, a scramble the length of the floor.":left>0?" Timeout: you draw up the play.":""),
    opts:[["three","Go for the win: three"],["two","Tie it: two, and overtime"],ASSIST]};
}
/* round 111: a run against you. A timeout stops it carrying into the next stretch (a little: see BB_GD) and is the
   moment to change the defense; saved, it's there for the last possession. withDef false when a read or crunch-time
   call follows at this same break (the defense is that call's) */
const TO_KEEP="Timeout, keep your setup", TO_SW="Timeout, switch to ";
function timeoutCall(run,left,cur,T,cue,withDef,s){
  const defs=withDef?[["to",cur&&DEFENSES[cur]?TO_KEEP+" ("+DEFENSES[cur].l+")":"Timeout, settle them down"]].concat(Object.keys(DEFENSES).filter(d=>d!==cur).map(d=>["to:"+d,TO_SW+DEFENSES[d].l]))
    :[["to","Call a timeout"]];
  return {k:"timeout",stage:s,h:`They're on a ${run[0]}-${run[1]} run`,
    b:withDef?`Stop it with a timeout, and change the defense while you're at it? You have ${left} left.`:`Stop it with a timeout? You have ${left} left.`,
    opts:defs.concat([["save",`No timeout: save it (${left} left)`],ASSIST]), left:left, run:run, out:BB_GD.timeouts,
    tell:{tpa:T.tpa,fga:T.fga,paint:T.paint,pnr:T.pnr,n:T.n}, best:bbRead(T), pearl:cue||bbRead(T), withDef:withDef};
}
/* your own timeout, from the live game's Timeout button: the floor is yours for a minute */
function myTimeoutCall(left,cur,T,cue,s){
  return {k:"tomine",stage:s,h:"Your timeout",b:`What do you change? ${left?`${left} left after this one.`:"That was your last one."}`,
    opts:(cur&&DEFENSES[cur]?[["keep","Keep your setup: "+DEFENSES[cur].l]]:[]).concat(Object.keys(DEFENSES).filter(d=>d!==cur).map(d=>[d,DEFENSES[d].l])).concat([ASSIST]),
    left:left, tell:{tpa:T.tpa,fga:T.fga,paint:T.paint,pnr:T.pnr,n:T.n}, best:bbRead(T), pearl:cue||bbRead(T)};
}

/* The live game. humans: {home, away} (a bare boolean is the one-coach
   form: true = the user is home). next() plays a segment, or returns a call
   for a person to make; reply(v) answers it. */
/* the scouting report: the offenses a team ran in its last few games,
   drawn from its own seed so it never moves the game */
function scoutReport(fav,seed){
  const r=new RNG(seed>>>0), w=STYLE_KEYS.map(k=>k===fav?BB.favW:1), tot=w.reduce((a,b)=>a+b), n={};
  STYLE_KEYS.forEach(k=>n[k]=0);
  for(let g=0;g<BB.scouted;g++){ let x=r.r()*tot, i=0; while(x>w[i]){x-=w[i];i++} n[STYLE_KEYS[i]]++ }
  return n;
}
function prepCall(rep){
  const top=STYLE_KEYS.reduce((a,k)=>rep[k]>rep[a]?k:a,STYLE_KEYS[0]);
  return {k:"prep",h:"Before tip-off: the scouting report",b:"Game-plan for how they usually score, or wait and see?",
    opts:Object.keys(DEFENSES).map(d=>[d,DEFENSES[d].l]).concat([["normal","Wait and see: leave it to your assistant"]]),
    report:Object.assign({},rep), n:BB.scouted, pearl:top};
}
function makeLiveGame(rng, eloH, eloA, planH, planA, humans, playoff, ctx){
  ctx=ctx||{}; const fav=ctx.fav||{};
  if(typeof humans!=="object"||humans===null)humans={home:!!humans, away:!humans};
  const tempo=((AGGR[planH]||AGGR.balanced).tempo+(AGGR[planA]||AGGR.balanced).tempo)/2;
  const poss=Math.max(50,Math.round(rng.gauss(BB.pace*tempo,BB.paceSd)));
  // a mismatch past BB.softGap counts half: the better side rests and coasts, so
  // even a great team loses some (unset: no change). Pro: 82-0 happened.
  const rawGap=(eloH-eloA)*(typeof GAP_SCALE!=="undefined"?GAP_SCALE:1), sg=playoff&&LEAGUE.postFull?0:BB.softGap;   // the playoffs: full strength (round 49)
  const gap=sg&&Math.abs(rawGap)>sg?Math.sign(rawGap)*(sg+(Math.abs(rawGap)-sg)*0.5):rawGap;
  const eH=gap*BB.gapPerPoss/2;
  // tonight's referees
  let cx=rng.r(), crew=1; for(const [w,f] of BB.crews){ if(cx<w){crew=f;break} cx-=w }
  const side0=()=>({off:null, def:null, f:0, sitTo:-1, out:false, asked1:false, asked2:false,
    tell:{tpa:0,fga:0,paint:0,pnr:0,n:0}, lastCue:null});
  const st={plog:false,h:0,a:0,drives:[],seg:0,poss:poss,humans:humans,lines:{h:blankTeamLine(),a:blankTeamLine()},
    mode:{home:planH,away:planA}, late:{home:null,away:null}, asked:{}, queue:[], ask:null, answer:null,
    ot:0, done:false, last:null, crew:crew, S:{home:side0(),away:side0()}, fouls:{home:0,away:0}, lastSeg:{home:0,away:0}};
  // round 111 (engine 25): timeouts left, and who carries a run into the next stretch
  const GD=bbGdV(); if(GD){ st.TO={home:BB_GD.timeouts,away:BB_GD.timeouts}; st.mo={home:0,away:0};
    // the rotation: the bench's share now, and the extra minutes your starters have played (in stretches of tight)
    st.rot={home:"normal",away:"normal"}; st.xm={home:0,away:0};
    st.rg={home:(ctx.rot&&ctx.rot.home)||{g:BB_GD.gMean,sta:0},away:(ctx.rot&&ctx.rot.away)||{g:BB_GD.gMean,sta:0}} }
  // a side's edge from its rotation this stretch, in Elo: the starters' extra minutes now, less tired legs late
  const rotElo=(sd,s)=>{ if(!GD)return 0; const b=BB_GD.rot[st.rot[sd]]||0.2, G=st.rg[sd], d=0.2-b;
    const RS=typeof R_SLOPE!=="undefined"?R_SLOPE:24.3; let e=d?RS*d*G.g:0;
    if(s>=SEGS-2&&st.xm[sd]){ const F=8*RS*0.08*BB_GD.gMean/(1+7/6);   // the late cost that nets a usual side's tight game to nothing
      e-=F*st.xm[sd]*Math.max(0,1-BB_GD.staK*(G.sta||0)) }
    return e };
  const other=sd=>sd==="home"?"away":"home";
  const lead=side=>side==="home"?st.h-st.a:st.a-st.h;
  // a side's offense: a person's from the gameplan, the computer's by chance
  const pickOff=(side)=>{ const m=st.mode[side];
    if(humans[side]&&m==="safe")return "paint"; if(humans[side]&&m==="aggressive")return "threes";
    if(!fav[side])return STYLE_KEYS[rng.int(3)];
    const w=STYLE_KEYS.map(k=>k===fav[side]?BB.favW:1); let x=rng.r()*w.reduce((a,b)=>a+b), i=0; while(x>w[i]){x-=w[i];i++} return STYLE_KEYS[i] };
  st.S.home.off=pickOff("home"); st.S.away.off=pickOff("away");
  st.gap=gap;
  const readIt=(side,p)=>{ if(rng.r()<p){st.S[side].def=STYLE[st.S[other(side)].off].answer; st.S[side].prepd=false} };
  const queueCall=(side,dp)=>{ const key=dp.k+(dp.stage||"")+side; if(!humans[side]||st.asked[key])return;
    st.asked[key]=true; st.queue.push({side:side,dp:dp}) };
  // calls due before a segment: the old score calls
  const queueCalls=(when)=>{
    ["home","away"].forEach(side=>{
      if(!humans[side])return;
      const L=lead(side); let dp=null;
      // not at 20 either way: neither answer moves a game that's gone (Instinct: comfortable-lead busywork)
      if(when==="half"){ if(Math.abs(L)<20)dp=halfCall(L) }
      // only when behind: protecting a lead (milk the clock or keep attacking) measured about 3 points a call and
      // 0.1 a game, close either way two times in three (round 33): cut, as Ian's rule asks
      // round 50, the last decision of a close game is yours: down one to three, the crunch-time read (what do they go to
      // now?) comes to you as it does when ahead. Both testers: after half-time in six straight close games, nothing
      // (the press, the old call here, rarely mattered: 1 of 15 calls worth 3 points in college)
      else if(when==="late"&&L<0&&L>=-CLOSE_FLOOR){ const o=other(side), O=st.S[o];
        if(!humans[o]){ const cp=(ctx.close&&ctx.close[o])||fav[o]||O.off;
          O.closeTo=rng.r()<(BB.closePref||0.6)?cp:O.off;
          dp=closeCall(L,scoutReport(cp,(ctx.seed||0)+(o==="home"?11:12)),BB.scouted,st.S[side].def) } }
      else if(when==="late"&&L<0&&L>=-9)dp=lateCall(L);
      else if(when==="late"&&L>=10&&L<BB.garbage)dp=restCall(L);
      else if(when==="late"&&L>=0&&L<=9){
        if(L>0)st.late[side]="auto";   // the clock: your assistant closes it out, as he would have (round 33)
        const o=other(side), O=st.S[o];
        if(!humans[o]){ const cp=(ctx.close&&ctx.close[o])||fav[o]||O.off;
          O.closeTo=rng.r()<(BB.closePref||0.6)?cp:O.off;
          dp=closeCall(L,scoutReport(cp,(ctx.seed||0)+(o==="home"?11:12)),BB.scouted,st.S[side].def) } }
      else if(when==="last"&&L===-2)dp=lastCall(GD?st.TO[side]:undefined);
      if(dp)queueCall(side,dp);
    });
  };
  // engine 11: the shapes (gameCtx sh), as each possession's modifier: a side's offense against the other's defense
  const SH=bbV11()&&ctx.sh&&ctx.sh.home&&ctx.sh.away?ctx.sh:null;
  const shAdd=(m,sd,s)=>{ const X=SH[sd], Y=SH[other(sd)], c=BB11.c, a=BB11.a;
    const ds=a*c.shr*X.sht, d3=a*c.sht*X.sht;   // more threes, and better ones: the extra the two earn together is taken back (ds*d3/share), so a lean holds its worth
    m.share+=ds; m.p3+=d3-ds*d3/(0.38+ds)-a*c.pd*Y.pd; m.p2+=a*(c.fin*X.fin-c.id*Y.id+c.ath*X.ath);
    m.to+=a*(c.athd*Y.ath-c.ply*X.ply); m.or=(m.or||0)+a*c.reb*(X.reb-Y.reb);
    if(s>=SEGS-2){ m.p2+=a*c.sta*X.sta; m.p3+=a*c.sta*X.sta*2/3 }   // the closing minutes: who still has legs
    // engine 17 (round 94): the plan's fit amplified, the extra (Elo) through its own shots (a point of Finishing moves the
    // two-point rate by a*c.fin and is worth a rating points: c.fin/R_SLOPE a rate point per Elo; Shooting the same on threes)
    if(planAmpV()){ m.p2-=BB17.k*0.5; m.p3-=BB17.k*0.36 }   // the league's points held (suited plans everywhere score more on 17)
    if(s<SEGS){ const pl=st.mode[sd], E=ampE(sd,pl); if(E){ if(pl==="safe")m.p2+=BB17.gs*E*c.fin/R_SLOPE; else if(pl==="aggressive")m.p3+=BB17.ga*E*c.sht/R_SLOPE } } };
  const ampMemo={home:{},away:{}};
  const ampE=(sd,pl)=>{ if(!SH||!planAmpV()||!pl||pl==="balanced"||!BB11_FIT[pl])return 0; const M=ampMemo[sd]; if(M[pl]!==undefined)return M[pl];
    const f=bbFitSh((humans[sd]?BB11_FIT:BB11_FITC)[pl],SH[sd]);
    // engine 23 (round 109): against their defence; college plays that part 1.20x its Elo (r109 vs2.js, the change from
    // engine 22 on common dice, 16 matchups x 3,000 games), so it's played at 1/1.2 there; the pros 0.79x, played at 1.27
    if(humans[sd]&&planVsV()){ const fa=planAmp(f,BB17); return M[pl]=(fa-f+BB23_PLAY[LEAGUE.id]*(planVsTot(fa,-bbVsOf(SH[other(sd)],pl),BB17.cap)-fa))*BB17.hg }
    return M[pl]=(planAmp(f,BB17)-f)*(humans[sd]?BB17.hg:1) };   // hg: a person's plan also sets his offence, so his path plays the extra louder (scratch r94 person.js: the pros 1.61x the shown change at 1, college 1.14x)
  const starOn=(X,s)=>!X.out&&!(s<X.sitTo);
  const playSeg=(s)=>{
    let n=s<SEGS?Math.floor(poss/SEGS)+(s<poss%SEGS?1:0):Math.round(poss/SEGS);
    const g=gameState(Math.min(s,SEGS-1),st.h-st.a,eH,planH,planA);
    let mH=g.mH, mA=g.mA;
    // a person's calls override the computer's game management for their side
    // (a press is about the other side's possessions, not this side's mode);
    // "auto" hands it back to the assistant, who manages as the computer does
    const lm=(x,plan)=>x==="auto"?null:x==="keep"?plan:x&&x!=="press"?x:null;
    if(humans.home&&st.late.home!=="auto")mH=lm(st.late.home,st.mode.home)||st.mode.home;
    if(humans.away&&st.late.away!=="auto")mA=lm(st.late.away,st.mode.away)||st.mode.away;
    if(s>=SEGS){mH="urgent";mA="urgent"}
    // engine 22 (round 108): a person's pace plays from the stretch it's set. The game's possessions are drawn at tip-off
    // from the two starting plans; a person's mode now (a live instruction, the half-time call, a late call kept) scales
    // this stretch's count by its tempo against the plan he started on. The computer's sides, and a side left to the
    // assistant, count as their starting plan: a computer-only game draws and plays exactly as before.
    if(ENGINE_V>=22&&s<SEGS){ const t0=sd=>(AGGR[sd==="home"?planH:planA]||AGGR.balanced).tempo,
        tNow=(sd,m)=>humans[sd]&&st.late[sd]!=="auto"?(AGGR[m]||AGGR.balanced).tempo:t0(sd), f=(tNow("home",mH)+tNow("away",mA))/(t0("home")+t0("away"));
      if(Math.abs(f-1)>1e-9)n=Math.max(1,Math.round(n*f)) }
    const H=st.S.home, A=st.S.away;
    // stars off the floor: in foul trouble, or fouled out
    const onH=starOn(H,s), onA=starOn(A,s);
    const cl=s>=SEGS-2?BB.starClutch:1, so=BB.starOwn*cl, sd=BB.starDef*cl;
    const rH=st.rest&&st.rest.home?BB.benchPull*0.5:0, rA=st.rest&&st.rest.away?BB.benchPull*0.5:0;   // a rested side's bench, for the last few minutes
    let moE=GD&&s<SEGS?BB_GD.momentum*(st.mo.home-st.mo.away):0;   // round 111: a run carried in (none for a side that stopped it)
    const gbR=Math.min(s,SEGS-1)>=5&&Math.abs(st.h-st.a)>=BB.garbage;   // a decided game: the benches are in whatever the rotation
    if(GD&&!gbR&&(st.rot.home!=="normal"||st.rot.away!=="normal"||st.xm.home||st.xm.away))moE+=(rotElo("home",s)-rotElo("away",s))*BB.gapPerPoss/2;
    const ehH=g.eH-(onH?0:so)+(onA?0:sd)-rH+rA+moE, ehA=-g.eH-(onA?0:so)+(onH?0:sd)-rA+rH-moE;
    const modH=styleMod(H.off,A.def,A.prepd), modA=styleMod(A.off,H.def,H.prepd);
    if(SH){ shAdd(modH,"home",s); shAdd(modA,"away",s) }   // engine 11: each side's shape against the other's
    let dh=0,da=0, nA=n;
    const pressH=st.late.home==="press", pressA=st.late.away==="press";
    const nn=(pressH||pressA)?Math.round(n*BB.pressPace):n;
    const L0h=Object.assign({},st.lines.h), L0a=Object.assign({},st.lines.a);
    const ev=(st.pendEv||[]).splice(0), t0=s;
    const pStar=BB.starFouls/Math.max(40,poss)*crew;
    // round 111: a star in a tight rotation is on the floor more, and fouls more; deep, less (the same draws)
    const rotF=sd=>GD&&st.rot[sd]!=="normal"?(1-BB_GD.rot[st.rot[sd]])/0.8:1, pStarH=pStar*rotF("home"), pStarA=pStar*rotF("away");
    if(GD&&s<SEGS)["home","away"].forEach(sd=>{ if(st.rot[sd]!=="normal")st.xm[sd]+=(0.2-BB_GD.rot[st.rot[sd]])/0.08/6 });   // after this stretch's edge is set
    // round 101: the full match's possession log (live games only): what each possession did, read off the box-score
    // lines before and after it (no draws, so no game moves): [side 0 home / 1 away, turnovers, free throws tried, made,
    // threes tried, made, twos tried, made, offensive boards, late foul (1)]
    const pl=st.plog?[]:null, snapL=L=>[L.to,L.fta,L.ftm,L.tpa,L.tpm,L.fga2,L.fgm2,L.oreb];
    const plRec=(sd,L,b,f)=>{ const a=snapL(L); pl.push([sd].concat(a.map((v,i)=>v-b[i]),[f?1:0])) };
    for(let i=0;i<Math.max(nn,nA);i++){
      let b0=pl?snapL(st.lines.h):null;
      dh+=possession(rng,ehH,mH,st.lines.h,pressA,modH); if(pl){ plRec(0,st.lines.h,b0); b0=snapL(st.lines.a) }
      da+=possession(rng,ehA,mA,st.lines.a,pressH,modA); if(pl)plRec(1,st.lines.a,b0);
      // the stars' fouls: on defense, while on the floor
      // a star who fouls out mid-stretch is gone at once (Muse: an "8th foul" in a six-foul league); the
      // dice are drawn as before, so nothing else in the game moves
      if(s<SEGS){ if(onH&&rng.r()<pStarH){ const u=rng.int(100); if(!H.out){ H.f++; ev.push({side:"home",k:"foul",f:H.f,u:u}); if(H.f>=BB.foulOut){H.out=true; H.outEv={side:"home",k:"out"}; ev.push(H.outEv)} } }
        if(onA&&rng.r()<pStarA){ const u=rng.int(100); if(!A.out){ A.f++; ev.push({side:"away",k:"foul",f:A.f,u:u}); if(A.f>=BB.foulOut){A.out=true; A.outEv={side:"away",k:"out"}; ev.push(A.outEv)} } } }
    }
    [["home",H],["away",A]].forEach(([sd,X])=>{ if(X.outEv&&X.outEv.u===undefined){ X.outEv.u=rng.int(100); delete X.outEv }   // drawn where it always was
      else if(!X.out&&X.f>=BB.foulOut){X.out=true; ev.push({side:sd,k:"out",u:rng.int(100)})} });
    // the last minute of regulation: whoever is behind by one to eight fouls
    // to stop the clock, sending the leader to the line and getting the ball
    // back, up to four times (extra possessions: the game lasts longer)
    const lastSeg=s===SEGS-1, trail=st.h+dh-(st.a+da);
    // round 111 (engine 25): the last minute of regulation, a person behind by one to eight: foul or play it out, asked
    // here, inside the stretch (core: the full match plays the stretch up to the call, eng.partial). The rest of the
    // stretch waits in st.lpFinish; nothing is drawn while it waits
    const tail=()=>{
    let foulH=lastSeg&&trail<0&&trail>=-8, foulA=lastSeg&&trail>0&&trail<=8;
    // round 111: behind in the last minute, a person may play it out instead: they run a possession down, you get one
    const outH=foulH&&GD&&st.lf&&st.lf.home==="defend", outA=foulA&&GD&&st.lf&&st.lf.away==="defend";
    if(outH){ foulH=false; let b0=pl?snapL(st.lines.a):null; da+=possession(rng,ehA,"sit",st.lines.a); if(pl){ plRec(1,st.lines.a,b0); b0=snapL(st.lines.h) } dh+=possession(rng,ehH,"push",st.lines.h); if(pl)plRec(0,st.lines.h,b0) }
    if(outA){ foulA=false; let b0=pl?snapL(st.lines.h):null; dh+=possession(rng,ehH,"sit",st.lines.h); if(pl){ plRec(0,st.lines.h,b0); b0=snapL(st.lines.a) } da+=possession(rng,ehA,"push",st.lines.a); if(pl)plRec(1,st.lines.a,b0) }
    if(foulH||foulA){
      for(let k=0;k<4;k++){
        const behindH=foulH&&st.h+dh<st.a+da, behindA=foulA&&st.a+da<st.h+dh;
        if(!behindH&&!behindA)break;
        if(behindA){ let b0=pl?snapL(st.lines.h):null; dh+=foulTrip(rng,st.lines.h); if(pl){ plRec(0,st.lines.h,b0,1); b0=snapL(st.lines.a) } da+=possession(rng,ehA,"push",st.lines.a); if(pl)plRec(1,st.lines.a,b0) }
        else { let b0=pl?snapL(st.lines.a):null; da+=foulTrip(rng,st.lines.a); if(pl){ plRec(1,st.lines.a,b0,1); b0=snapL(st.lines.h) } dh+=possession(rng,ehH,"push",st.lines.h); if(pl)plRec(0,st.lines.h,b0) }
      }
    }
    // the shot chart: attempts, points in the paint, ball screens; fouls called
    [["home",st.lines.h,L0h],["away",st.lines.a,L0a]].forEach(([sd,L,L0])=>{ const X=st.S[sd], T=X.tell;
      const tpa=L.tpa-L0.tpa, fga=tpa+L.fga2-L0.fga2, paint=2*(L.fgm2-L0.fgm2);
      T.tpa+=tpa; T.fga+=fga; T.paint+=paint; T.pnr+=Math.max(0,Math.round(rng.gauss(X.off==="pnr"?BB.pnrTell[1]:BB.pnrTell[0],1.3))); T.n++;
      // highlights: threes made, buckets inside
      const m3=L.tpm-L0.tpm, m2=L.fgm2-L0.fgm2;
      if(m3>=2||(m3&&rng.r()<0.5))ev.push({side:sd,k:"three",n:m3,u:rng.int(100)});
      if(m2>=4&&rng.r()<0.6)ev.push({side:sd,k:"inside",n:m2,u:rng.int(100)});
      if(rng.r()<0.3){ const k=rng.r()<BB.cueTrue?X.off:rng.pick(STYLE_KEYS), u=rng.int(100);
        ev.push({side:sd,k:"cue",cue:k,u:u}); if(u%3===0)X.lastCue=k }
      const tf=Math.max(0,Math.round(rng.gauss(BB.teamFouls/SEGS*crew,1.4)));
      st.fouls[sd]+=tf; st.lastSeg[sd]=tf });
    // round 93 (engine 16): the stretch's benches, for the names (Instinct: "rests the starters", then a starter's three):
    // decided (both sides) or a side that rested its starters; drawn from nothing, so the game is the same
    const gb=Math.min(s,SEGS-1)>=5&&s<SEGS&&Math.abs(st.h-st.a)>=BB.garbage, bn=typeof ENGINE_V!=="undefined"&&ENGINE_V>=16&&(gb||(st.rest&&(st.rest.home||st.rest.away)))?{home:!!(gb||(st.rest&&st.rest.home)),away:!!(gb||(st.rest&&st.rest.away))}:null;
    st.h+=dh; st.a+=da;
    // round 111: a run, for the next stretch (drawn from nothing: the score of this one)
    if(GD){ st.mo={home:0,away:0}; if(s<SEGS-1){ if(dh-da>=BB_GD.runPts)st.mo.home=1; else if(da-dh>=BB_GD.runPts)st.mo.away=1 } }
    const d={seg:s,h:dh,a:da,sh:st.h,sa:st.a,ot:s>=SEGS?s-SEGS+1:0,ev:ev,
      T:{home:Object.assign({},H.tell),away:Object.assign({},A.tell)}, star:{home:[H.f,onH,H.out],away:[A.f,onA,A.out]},
      fouls:Object.assign({},st.fouls), ln:{home:Object.assign({},st.lines.h),away:Object.assign({},st.lines.a)}};   // round 73: the box score's team lines, as they stand (no draws)
    if(bn)d.bn=bn;
    if(pl)d.pl=pl;
    st.drives.push(d); return d;
    };
    const lh=GD&&lastSeg&&!st.lpAsked?(trail<0&&trail>=-8&&humans.home?"home":trail>0&&trail<=8&&humans.away?"away":null):null;
    if(lh){ st.lpAsked=true; const o=other(lh), Lo=st.lines[o==="home"?"h":"a"];
      st.lpD={seg:s,pl:pl?pl.slice():null,sh:st.h+dh,sa:st.a+da}; st.lpFinish=tail;
      queueCall(lh,defendCall(lh==="home"?trail:-trail,Lo.ftm,Lo.fta)); return null }
    return tail();
  };
  // the last possession, when a side trails by two: a three to win or a two to tie
  const lastShot=(side,choice)=>{
    const L=st.lines[side==="home"?"h":"a"], e=side==="home"?eH:-eH;
    const three=choice==="three";
    if(three)L.tpa++; else L.fga2++;
    const noTO=GD&&st.TO[side]<=0;   // round 111: no timeout left, no drawn-up play: a scramble the length of the floor
    if(GD&&!noTO){ st.TO[side]--; st.drewUp=side }
    const made=rng.r()<(three?BB.three+e*2/3:BB.two+e)*(noTO?BB_GD.noTO:1);
    if(made){ if(three)L.tpm++; else L.fgm2++;
      if(side==="home")st.h+=three?3:2; else st.a+=three?3:2 }
    st.last={side:side,choice:choice,made:made};
    st.drives.push({seg:"last",side:side,choice:choice,made:made,sh:st.h,sa:st.a,ln:{home:Object.assign({},st.lines.h),away:Object.assign({},st.lines.a)}});
  };
  // foul trouble: the computer (and your assistant) sits him, as most coaches do
  const troubleAt=(s,X)=>{ if(X.out||s<X.sitTo)return 0;
    if(s>=1&&s<=3&&!X.asked1&&X.f>=BB.foulOut-3)return 1;
    if(s>=4&&s<=6&&!X.asked2&&X.f>=BB.foulOut-2)return 2; return 0 };
  const sitStar=(X,half)=>{ X.sitTo=half===1?4:6 };
  // review round: a second sit on the fouls he sat with at the half says he stays on the bench (no draw: the same game)
  const sitEv=(X,sd,u)=>{ const e={side:sd,k:"sit",f:X.f,u:u}; if(X.satF===X.f)e.again=1; X.satF=X.f; return e };
  st.log=[];            // the person's reads, and what was true (for the result screen)
  // did the numbers on the card mark what they were doing? (the card's own marks: three-point share
  // 45%+ or 31%- , pick-and-rolls 3.4+ a stretch). If not, a miss isn't held against you (Instinct: 38%
  // threes against a 39% average, nothing marked, and "wrong: they were bombing threes")
  const shownOf=(dp,t)=>{ const T=dp.tell; if(!T)return true; const sh=100*T.tpa/Math.max(1,T.fga), n=Math.max(1,T.n);
    return t==="threes"?sh>=45:t==="paint"?sh<=31||T.paint/n*2>=bbPaintMark()[0]:t==="pnr"?T.pnr/n>=3.4:true };
  // round 111: a timeout used: the other side's run stops here; said in the next stretch's run of play (no draws)
  const useTO=(side,mine)=>{ if(!GD||st.TO[side]<=0)return false; st.TO[side]--; st.mo[other(side)]=0;
    st.pendEv=(st.pendEv||[]).concat([{side:side,k:"to",left:st.TO[side],mine:!!mine,u:(st.seg*37+st.h*3+st.a)%100}]); return true };
  // a defense picked at a timeout is graded as a read is: on what they were really running
  const logDef=(side,dp,pick)=>{ const t=st.S[other(side)].off, ok=DEFENSES[pick].beats===t;
    st.log.push({side:side,h:dp.h,k:"read",pick:pick,truth:t,right:ok,evid:dp.best,fe:DEFENSES[pick].beats===dp.best||readFlags(dp).includes(DEFENSES[pick].beats),unclear:!ok&&!shownOf(dp,t)}) };
  const apply=(side,dp,v)=>{
    const X=st.S[side];
    if(dp.k==="timeout"){ if(v==="save")return; useTO(side);
      const d=typeof v==="string"&&v.indexOf("to:")===0?v.slice(3):null;
      if(d&&DEFENSES[d]){ logDef(side,dp,d); if(d!==X.def)X.prepd=false; X.def=d }
      else if(v==="to"&&dp.withDef&&DEFENSES[X.def])logDef(side,dp,X.def);
      else if(v!=="to")st.autoDid="called the timeout and kept the defense as it was";
      return }
    if(dp.k==="tomine"){ if(v==="keep"&&DEFENSES[X.def]){ logDef(side,dp,X.def); return }
      if(DEFENSES[v]){ logDef(side,dp,v); if(v!==X.def)X.prepd=false; X.def=v; return }
      const was=X.def; readIt(side,0.45); st.autoDid=X.def!==was&&DEFENSES[X.def]?"used your timeout to switch to "+DEFENSES[X.def].l.split(":")[0].toLowerCase():"used your timeout to settle them, and kept the defense"; return }
    if(dp.k==="prep"){ if(DEFENSES[v]){ const t=st.S[other(side)].off; X.def=v; X.prepd=true;
      st.log.push({side:side,h:dp.h,k:"prep",pick:v,truth:t,right:DEFENSES[v].beats===t,split:(()=>{const a=Object.values(dp.report).sort((x,y)=>y-x);return a[0]===a[1]?a.filter(x=>x>0).join("-"):false})()}); { const L=st.log[st.log.length-1]; if(L.split)L.unclear=true } { const L=st.log[st.log.length-1], ks=Object.keys(dp.report).sort((a,b)=>dp.report[b]-dp.report[a]); if(!L.split&&DEFENSES[v]&&DEFENSES[v].beats===ks[0]){ L.followed=true; L.fav=ks[0] } }   /* round 71: set up for what the report said most */   // a split report is a coin flip: not graded either way (Grokbot: 3-3 graded "right")
      } else if(v!==undefined&&dp.report){ const t=st.S[other(side)].off, ks=Object.keys(dp.report).sort((a,b)=>dp.report[b]-dp.report[a]);
        // waiting is a decision too, graded on whether the report's favourite was right (Muse, round 39: no trace on the card)
        st.log.push({side:side,h:dp.h,k:"prep",pick:"wait",waited:true,fav:ks[0],truth:t,right:ks[0]!==t,unclear:dp.report[ks[0]]===dp.report[ks[1]]}) } return }
    if(dp.k==="read"&&v==="keep"&&DEFENSES[X.def]){ const t=st.S[other(side)].off, ok=DEFENSES[X.def].beats===t; st.log.push({side:side,h:dp.h,k:"read",pick:X.def,truth:t,right:ok,evid:dp.best,fe:DEFENSES[X.def].beats===dp.best||(ENGINE_V>=21&&readFlags(dp).includes(DEFENSES[X.def].beats)),unclear:!ok&&!shownOf(dp,t)}); return }
    if(dp.k==="read"&&DEFENSES[v]){ const t=st.S[other(side)].off, ok=DEFENSES[v].beats===t; st.log.push({side:side,h:dp.h,k:"read",pick:v,truth:t,right:ok,evid:dp.best,fe:DEFENSES[v].beats===dp.best||(ENGINE_V>=21&&readFlags(dp).includes(DEFENSES[v].beats)),unclear:!ok&&!shownOf(dp,t)}) }
    if(dp.k==="read"){ if(DEFENSES[v]){ if(v!==X.def)X.prepd=false; X.def=v } else { const was=X.def; readIt(side,dp.stage===2?0.3:0.45); st.autoDid=X.def!==was&&DEFENSES[X.def]?"read them himself and switched to "+DEFENSES[X.def].l.split(":")[0].toLowerCase():"read them himself and kept the defense as it was" } return }
    if(dp.k==="fouls"){ if(v!=="play"){ sitStar(X,dp.half); st.pendEv=(st.pendEv||[]).concat([sitEv(X,side,rng.int(100))]) } return }   // judged on the card against your assistant's (he sits him), like the other situation calls
    if(dp.k==="half"){ st.mode[side]=v==="push"?"push":v==="sit"?"sit":st.mode[side]; if(v!=="push"&&v!=="sit")st.autoDid="kept the pace as it was"; return }
    if(dp.k==="chase"){ st.late[side]=v==="press"?"press":v==="keep"?"keep":"auto"; if(st.late[side]==="auto")st.autoDid="managed the finish by the score, as every computer coach does"; return }
    if(dp.k==="protect"){ st.late[side]=v==="sit"?"sit":v==="keep"?"keep":"auto"; if(st.late[side]==="auto")st.autoDid="managed the finish by the score, as every computer coach does"; return }
    if(dp.k==="rest"){ st.late[side]="auto"; if(v==="rest"){ st.rest=st.rest||{}; st.rest[side]=true }
      st.log.push({side:side,k:"rest",pick:v==="rest"?"rest":"keep",unclear:true}); return }   // not right or wrong: priced in knocks, not wins
    if(dp.k==="close"){ const O=st.S[other(side)]; if(O.closeTo)O.off=O.closeTo; const t=O.off;
      const pick=v==="keep"?X.def:DEFENSES[v]?v:null;
      if(pick&&DEFENSES[pick]){ st.log.push({side:side,h:dp.h,k:"close",pick:pick,truth:t,right:DEFENSES[pick].beats===t}); if(pick!==X.def)X.prepd=false; X.def=pick }
      else { const was=X.def; readIt(side,0.45); st.autoDid=X.def!==was&&DEFENSES[X.def]?"read their finish himself and switched to "+DEFENSES[X.def].l.split(":")[0].toLowerCase():"read their finish himself and kept the defense as it was" }
      return }
    if(dp.k==="last"){ lastShot(side,v==="three"?"three":"two"); st.lastDone=true }
    if(dp.k==="defend"){ (st.lf=st.lf||{})[side]=v==="defend"?"defend":"foul"; if(v!=="foul"&&v!=="defend")st.autoDid="fouled to stop the clock, as every computer coach does"; return }
  };
  st.next=function(){
    if(st.done)return {done:true,h:st.h,a:st.a,drives:st.drives};
    if(st.ask)return st.ask;
    if(st.pendingSide){ const P=st.pendingSide, v=st.answer; st.pendingSide=null; st.answer=null; st.autoDid=null; apply(P.side,P.dp,v) }
    if(st.queue.length){const Q=st.queue.shift(); st.pendingSide=Q; const sh=st.lpD?st.lpD.sh:st.h, sa=st.lpD?st.lpD.sa:st.a;   // a call inside the last stretch: its score so far
      st.ask={ask:Q.dp,mine:Q.side==="home"?sh:sa,
              theirs:Q.side==="home"?sa:sh,q:st.seg<4?1:st.seg<SEGS?2:3,side:Q.side};
      const r=st.ask; st.ask=null; st.waiting=r; return r}
    // round 111: the rest of a stretch that stopped for a call inside it
    if(st.lpFinish){ const f=st.lpFinish; st.lpFinish=null; st.lpD=null; const d=f(); st.seg++; return {drive:d,h:st.h,a:st.a} }
    const s=st.seg;
    if(s===0&&!st.p0){st.p0=true; ["home","away"].forEach(sd=>{ const o=other(sd);
      if(humans[sd]&&!humans[o]&&fav[o])queueCall(sd,prepCall(scoutReport(fav[o],(ctx.seed||0)+(o==="home"?1:2)))) });
      if(st.queue.length)return st.next()}
    // round 111 (engine 25): a run against a side. A period's end stops it by itself (the half; the pros' quarters);
    // otherwise the computer, and your assistant, call a timeout while they have one; a person is asked (not when
    // the game is gone: 20 either way). withDef: the defense is this call's unless a read or crunch time follows here
    if(GD&&s>0&&s<SEGS&&st.toAt!==s){ st.toAt=s;
      if(s===SEGS/2||(BB.quarters&&s%2===0))st.mo={home:0,away:0};
      else ["home","away"].forEach(sd=>{ const o=other(sd); if(!st.mo[o]||st.TO[sd]<=0)return;
        if(humans[sd]&&Math.abs(lead(sd))<20){ const D=st.drives[st.drives.length-1], run=sd==="home"?[D.a,D.h]:[D.h,D.a];
          queueCall(sd,timeoutCall(run,st.TO[sd],st.S[sd].def,st.S[o].tell,st.S[o].lastCue,!(s===2||s===SEGS-1),s)) }
        else useTO(sd) });
      if(st.queue.length)return st.next() }
    // foul trouble, either side, before any segment of regulation
    if(s<SEGS&&st.ft!==s){ st.ft=s; ["home","away"].forEach(sd=>{ const X=st.S[sd], h=troubleAt(s,X); if(!h)return;
        if(h===1)X.asked1=true; else X.asked2=true;
        // yours is a call again (round 44: Muse, "foul trouble is scenery in a game drowning in foul data"): sit him, as
        // the computer and your assistant do, or ride it out on how tight tonight's referees are
        if(BB_FOULQ&&humans[sd]){ queueCall(sd,Object.assign(foulCall(h,X,{fouls:st.fouls[sd],lastSeg:st.lastSeg[sd],rot:GD?st.rot[sd]:undefined},s),{half:h})); return }
        sitStar(X,h); st.pendEv=(st.pendEv||[]).concat([sitEv(X,sd,rng.int(100))]) });
      if(st.queue.length)return st.next() }
    // the reads: end of the first quarter (two segments), and the half
    if(s===2&&!st.r1){st.r1=true; ["home","away"].forEach(sd=>{ const O=st.S[other(sd)];
        if(humans[sd]){ const d=readCall(1,O.tell,O.lastCue); (st.p1=st.p1||{})[sd]=d.pearl; (st.b1=st.b1||{})[sd]=d.best; queueCall(sd,d) } else readIt(sd,0.45) });
      if(st.queue.length)return st.next()}
    if(s===4&&!st.halfDone){st.halfDone=true; ["home","away"].forEach(sd=>{ const O=st.S[other(sd)];
        if(humans[sd]){ const d=readCall(2,O.tell,O.lastCue,st.S[sd].def); d.pearl1=(st.p1||{})[sd]; d.best1=(st.b1||{})[sd]; queueCall(sd,d) } else if(rng.r()<0.3)readIt(sd,1) });   // what Pearl read the first time
      queueCalls("half"); if(st.queue.length)return st.next()}
    if(s===SEGS-1&&!st.lateDone){st.lateDone=true; queueCalls("late"); if(st.queue.length)return st.next()}
    if(s===SEGS&&!st.lastDone){
      st.lastDone=true;
      // someone trails by two with the last possession: a coin flip says who has the ball
      const trailer=st.h-st.a===-2?"home":st.a-st.h===-2?"away":null;
      if(trailer&&rng.r()<0.5){
        if(humans[trailer]){queueCalls("last"); if(st.queue.length)return st.next()}
        else lastShot(trailer,"two");                 // the computer ties it
      }
    }
    if(s>=SEGS&&st.h!==st.a){st.done=true; return {done:true,h:st.h,a:st.a,drives:st.drives}}
    if(s>=SEGS+6){ if(rng.r()<0.5)st.h++; else st.a++; st.done=true; return {done:true,h:st.h,a:st.a,drives:st.drives} }
    const d=playSeg(s); if(!d)return st.next();   // a call inside the stretch (round 111): asked first
    st.seg++;
    return {drive:d,h:st.h,a:st.a};
  };
  st.reply=function(v){ st.answer=v; st.waiting=null };
  st.partial=function(){ return st.lpD||null };   // core pbPartialStart: the stretch so far, while its call waits
  // round 111: the live game's own buttons (core: setLivePlan "act:<id>", made as a stretch starts). A timeout of yours:
  // the other side's run stops, and the floor is yours for a minute (myTimeoutCall)
  st.actsFor=function(side){ if(!GD||!humans[side]||st.done)return [];
    const lg=st.legs(side), legs=lg>=95?"fresh":lg>=85?"fine":lg>=75?"tiring":"tired";
    return [{id:"to",l:"Call a timeout",left:st.TO[side],pend:"Called: at the next break"}].concat(Object.keys(BB_GD.rot).map(k=>({id:"rot:"+k,l:ROT_L[k],on:st.rot[side]===k,
      grp:`Rotation (your starters' legs: ${legs})`,pend:"From the next stretch"}))) };
  // your starters' legs, out of 100: what the late stretches will cost or give back (the same sum the engine plays)
  st.legs=function(side){ if(!GD)return 100; const G=st.rg[side]; return Math.min(100,Math.round(100-20*st.xm[side]*Math.max(0,1-BB_GD.staK*(G.sta||0)))) };
  st.act=function(side,id){ if(!GD||!humans[side]||st.done)return false;
    if(id.indexOf("rot:")===0){ const k=id.slice(4); if(!BB_GD.rot[k]||st.rot[side]===k)return false; st.rot[side]=k;
      st.pendEv=(st.pendEv||[]).concat([{side:side,k:"rot",rot:k,u:(st.seg*41+st.h)%100}]); return true }
    if(id!=="to"||!useTO(side,true))return false; const o=other(side);
    st.queue.push({side:side,dp:myTimeoutCall(st.TO[side],st.S[side].def,st.S[o].tell,st.S[o].lastCue,st.seg)}); return true };
  return st;
}

/* A whole game at once (every game but the ones you watch): the same game,
   with the computer's calls, or opts.decide for a person who isn't watching. */
/* each team's usual offense this season, and the seed for its scouting report */
function clubStyle(t,year){ return rosterStyle(t,year)||STYLE_KEYS[strHash(t+"|"+year)%STYLE_KEYS.length] }
/* round 92: threes from Shooting, the paint from Finishing and Rebounding, pick-and-roll from Playmaking */
const sportStyleAttrs={threes:"Shooting",paint:"Finishing and Rebounding",pnr:"Playmaking"};
function sportStyleScores(R){ const T=bbShapeOf(R,null); return {threes:T.sht, paint:T.fin+T.reb, pnr:T.ply} }
function clubClose(t,year){ return STYLE_KEYS[strHash(t+"|close|"+year)%STYLE_KEYS.length] }   // what they go to in a close finish
function gameCtx(h,a,year,step){ return {fav:{home:clubStyle(h,year),away:clubStyle(a,year)}, close:{home:clubClose(h,year),away:clubClose(a,year)}, seed:strHash(h+"|"+a+"|"+year+"|"+step),
  sh:bbV11()?{home:bbShapeT(h),away:bbShapeT(a)}:undefined, rot:bbGdV()?{home:bbRotT(h),away:bbRotT(a)}:undefined} }
/* round 111: what the rotation works with: the starters' gap over the bench (rating points, by position weight; a hurt
   man's place taken as his minutes are: backup up, walk-on in) and the team's Stamina lean */
function bbRotOf(R,H,sta){ if(!R)return {g:BB_GD.gMean,sta:0}; let g=0;
  POS.forEach((P,i)=>{ const st=H&&H.has(i)?R[BK(i)]:R[i], bk=H&&(H.has(i)||H.has(BK(i)))?null:R[BK(i)];
    if(st)g+=P.w*(st.r-(bk?bk.r:st.r-P.drop)) });
  return {g:Math.round(g*100)/100, sta:sta||0} }
function bbRotT(t){ try{ const H=SEA.talent?new Set(SEA.talent.active(t).map(x=>x.idx)):null; return bbRotOf(SEA.roster[t],H,bbShapeT(t).sta) }catch(e){ return {g:BB_GD.gMean,sta:0} } }
/* round 88, engine 11: the team's shape on the floor. Each man's lean (an attribute against his own rating) counts by
   how much his position uses it (his group's weight) and by his minutes (a position's share, starters 80%, the bench
   20%; a hurt starter's minutes go to his backup, a hurt backup's to a walk-on, who brings no lean). A man's leans
   weigh to nothing (his weights sum his attributes to his rating), so with each attribute worth the same per point
   in the engine (BB11), a lean changes how a team plays and not what it's worth. */
const BB_SHK=["sht","fin","ply","reb","pd","id","ath","sta"];
function bbV11(){ return ENGINE_V>=11 }
function bbShapeOf(R,H){ const T={}; BB_SHK.forEach(k=>T[k]=0); if(!R||typeof attrOf!=="function")return T;
  const add=(p,m)=>{ if(!p||!(m>0))return; const A=attrOf(p); if(!A)return; const W=ATTRS.w[attrGrp(p)]||{}; BB_SHK.forEach(k=>{ if(A[k]!=null&&W[k])T[k]+=m*W[k]*(A[k]-p.r) }) };
  POS.forEach((P,i)=>{ const hs=H&&H.has(i), hb=H&&H.has(BK(i));
    if(hs)add(hb?null:R[BK(i)],P.w); else { add(R[i],P.w*(1-BENCH)); if(!hb)add(R[BK(i)],P.w*BENCH) } });
  BB_SHK.forEach(k=>T[k]=Math.round(T[k]*1000)/1000); return T }
/* the plan's fit (Ian, round 88: the chance moves with it, the plan rows say it): Shooting is realised on threes and
   Finishing on twos, so a plan that shoots more threes is worth more to a shooting side. Measured (scratch r88/fit2.js,
   40,000 games a cell, both leagues alike): per point of lean, in rating points per point of BB11.a, on top of balanced */
/* round 89: measured again in wins on each path (scratch r89 fitv-bb.js, 60,000 games a cell, the two leagues averaged):
   a person's plan also sets his offence (threes, the paint), so the fit on his path is about half again the computer's.
   Round 88's table (safe sht -0.37 fin +0.24, aggressive sht +0.65 fin -0.30) was the computer's path and understated
   what a person's plan was worth to a shaped roster. BB11_FIT: a person's (the plan rows, the shown chance);
   BB11_FITC: the computer's (its own plan, engine 12) */
const BB11_FIT={safe:{sht:-0.71,fin:0.52}, aggressive:{sht:0.78,fin:-0.56}};
const BB11_FITC={safe:{sht:-0.39,fin:0.29}, aggressive:{sht:0.51,fin:-0.35}};
function bbFitOf(F,t){ if(!bbV11()||!F)return 0; const T=bbShapeT(t); return R_SLOPE*BB11.a*(F.sht*T.sht+F.fin*T.fin) }
/* round 94 (engine 17): one spread of fit (college 29 Elo, the pros 11: scratch r94 fitsd.js) to 8 points on each curve
   (59 and 39 Elo), held to 15 points; played through the plan's own shots: working it inside makes more of its twos,
   shortening the game more of its threes */
const BB17_ENV=k=>BB11_ENV(k)&&+BB11_ENV(k);
const BB17=Object.assign({ncaab:{m:2.0,cap:113,gs:1,ga:0.87,k:0.014,hg:0.85}, nba:{m:3.5,cap:75,gs:1,ga:0.7,k:0.019,hg:0.58}}[typeof LEAGUE!=="undefined"&&LEAGUE.id==="nba"?"nba":"ncaab"],
  BB17_ENV("BB17_M")?{m:BB17_ENV("BB17_M")}:{}, BB17_ENV("BB17_GS")?{gs:BB17_ENV("BB17_GS")}:{}, BB17_ENV("BB17_GA")?{ga:BB17_ENV("BB17_GA")}:{}, BB17_ENV("BB17_K")?{k:BB17_ENV("BB17_K")}:{}, BB17_ENV("BB17_HG")?{hg:BB17_ENV("BB17_HG")}:{});
function bbFitSh(F,T){ return F&&T?R_SLOPE*BB11.a*(F.sht*T.sht+F.fin*T.fin):0 }
function sportPlanFit(t,pl){ return planAmp(bbFitOf(BB11_FIT[pl],t),BB17) }
function sportPlanFitC(t,pl){ return planAmp(bbFitOf(BB11_FITC[pl],t),BB17) }
/* round 109 (engine 23): working it inside against their rim protection, shortening the game against their perimeter
   defence: a league spread of it (r109 spread.js, three seasons: the pros id 0.188 pd 0.180, college 0.361 0.375) worth a
   spread of the plan's fit (the pros 41 and 43 Elo, college 55 and 59), against you when they're good at it */
const BB23_PLAY={nba:1.27,ncaab:0.83};
const BB23_VS={nba:{safe:["id",218],aggressive:["pd",240]}, ncaab:{safe:["id",152],aggressive:["pd",157]}};
function bbVsOf(T,pl){ const V=T&&typeof LEAGUE!=="undefined"&&BB23_VS[LEAGUE.id]&&BB23_VS[LEAGUE.id][pl]; return V?-V[1]*(T[V[0]]||0):0 }
function sportPlanVsC(o,pl){ return bbVsOf(bbShapeT(o),pl) }
function sportPlanCap(){ return BB17.cap }
const PLAN_VS_WORDS={safe:["protect the rim","don't protect the rim"], aggressive:["guard the three-point line","don't guard the three-point line"]};
const PLAN_VS_NOUN={safe:"rim protection",aggressive:"perimeter defence"};   // round 110: the scouting card
function sportShape(t){ return bbV11()?bbShapeT(t):null }
/* round 89 (engine 12, the computer's plan): a plan's own worth at a gap, no lean, in wins: Elo on the balanced curve
   [at even, per Elo of gap] (scratch r89 pv.js, 40,000 games a point) */
const BB12_SHIFT={nba:{safe:[1,0.033],aggressive:[-1.9,-0.037]}, ncaab:{safe:[-4.7,0.038],aggressive:[4,-0.037]}};
function sportPlanShift(pl,gap){ const T=typeof LEAGUE!=="undefined"&&BB12_SHIFT[LEAGUE.id]; return planShiftAt(T&&T[pl],gap) }
/* the same on a person's path (the plan also sets your offence: the paint, threes), measured (r89 pvh.js, 40,000 games
   a point): Ian (round 89) chose to put it in the chance before a game */
const BB12_SHIFTH={nba:{safe:[1.6,0.0733],aggressive:[-11.1,-0.0267]}, ncaab:{safe:[-21.1,0.0719],aggressive:[-3.4,-0.0376]}};
function sportPlanShiftH(pl,gap){ if(typeof ENGINE_V==="undefined"||ENGINE_V<12)return 0; const T=typeof LEAGUE!=="undefined"&&BB12_SHIFTH[LEAGUE.id]; return planShiftAt(T&&T[pl],gap) }
/* in words, on the plan rows: which plan your shape suits, once the difference is worth about a point and a half of
   win chance (a lean of half a league spread) */
const PLAN_LEAN={safe:"finishers",aggressive:"shooters"};   // round 94: the reason line
function sportPlanFitLine(t,pl){ if(!bbV11()||typeof PLANS==="undefined")return "";
  const v={safe:sportPlanFit(t,"safe"),balanced:0,aggressive:sportPlanFit(t,"aggressive")}; let best=Object.keys(v).reduce((a,b)=>v[b]>v[a]?b:a,"balanced");
  if(best!=="balanced"&&typeof planEdge==="function"&&planEdge(t,best,planGapNow(t))<=0)best="balanced";   // round 89: never a net loss tonight
  const lean=x=>x==="aggressive"?"shooters":"finishers";
  if(best!==pl&&v[best]-v[pl]>=12)return best==="balanced"?`Your roster doesn't suit this plan: <b>${esc(PLANS.balanced.l)}</b> fits it better.`:`Your roster leans to its ${lean(best)}: <b>${esc(PLANS[best].l)}</b>${best==="aggressive"?", with its threes,":""} suits it.`;
  return best===pl&&pl!=="balanced"&&v[pl]>=12?`This plan suits your ${lean(pl)}.`:"" }
function bbShapeT(t){ try{ const H=SEA.talent?new Set(SEA.talent.active(t).map(x=>x.idx)):null; return bbShapeOf(SEA.roster[t],H) }catch(e){ return bbShapeOf(null) } }
function playGame(rng, eloH, eloA, planH, planA, opts){
  opts=opts||{};
  const humans=opts.decide?{home:!!opts.userIsHome,away:!opts.userIsHome}:{home:false,away:false};
  const e=makeLiveGame(rng,eloH,eloA,planH,planA,humans,opts.playoff,opts.ctx);
  let guard=0;
  while(guard++<200){
    const r=e.next();
    if(r.done)return {h:r.h,a:r.a,drives:r.drives,poss:e.poss,ot:Math.max(0,e.seg-SEGS),lines:e.lines,last:e.last};
    if(r.ask){ const v=opts.decide(r.ask,{mine:r.mine,theirs:r.theirs,q:r.q});
      e.reply(v||r.ask.opts[r.ask.opts.length-1][0]) }
  }
  return {h:e.h,a:e.a,drives:e.drives,poss:e.poss,ot:0,lines:e.lines};
}
