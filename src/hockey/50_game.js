/* the gap in words */
function downWord(n){ return ["","one","two","three","four","five"][n]||String(n) }
/* ============ the game engine: hockey ============ */
/* Three 20-minute periods, played as twelve five-minute spells. Each side
   takes shots at a rate shaped by its edge, and each shot scores at a rate
   shaped by it too and by the goalie in net; penalties give the other side a
   power play. The side behind pushes in the third and the side ahead sits
   back (score effects). Trailing late, the goalie comes out for an extra
   attacker: goals both ways. Regular season: five minutes of three-on-three,
   then a shootout. Playoffs: sudden-death periods.

   Every side plays a system: an aggressive forecheck, a neutral-zone trap or
   a grinding cycle. It shows in the numbers (giveaways it forces in your
   zone, zone entries it kills, time it spends cycling below your goal line)
   and in the commentary. The right answer blunts it; the wrong one costs a
   little. And every goalie has a night: now and then a genuinely bad one,
   which shows in goals let in against what the shots were worth, and in how
   soft they were. A goalie on a bad night is worth pulling; one who has been
   unlucky is better than his backup.

   Your calls: the read at the first intermission; your goalie at either
   intermission when he has let in two or more; at the second intermission,
   push or lock it down; trailing late, when to pull the goalie. Every call's
   last option leaves it to your assistant, who does what the computer does. */
const SEGS = 12;
const DRIVES_PER_TEAM = 6;                    // the live clock's pace: twelve spells a game
const HK_BASE = {
  shots:25,          // even-strength shots on goal per team per game (power plays add ~5)
  shotSd:1.0,        // spread of a spell's shots (x sqrt of the rate)
  sh:0.0798,         // a shot's chance of scoring at even strength (an average night: some are bad)
  pens:3.1,          // power plays per team per game
  ppShots:1.55,      // shots on a power play
  ppSh:0.135,        // their chance of scoring
  shotEdge:0.00134,  // per Elo of edge: more shots...
  finishEdge:0.00124,// ...and a better chance each (both up a little: bad nights in goal add luck)
  scoreFx:0.13,      // third period: the side behind shoots this much more
  pullMin:{normal:1.6, early:3.2},   // minutes the goalie is out
  pullFor:0.15,      // the trailer's goals a minute with the extra attacker
  pullAgainst:0.20,  // empty-net goals a minute against
  otGoal:0.68,       // chance three-on-three produces a goal (else a shootout)
  soEdge:0.25,       // how much edge counts in a shootout (of the overtime's)
  counter:{own:1.18, opp:0.75},   // the right answer to their system (round 43: 1.10/0.85; a strong reader +5.1 -> +8.4 a game)
  misread:0.87,      // the wrong answer: your own chances, fewer (0.95: a blind guess before the game paid)
  offNight:0.10,     // how often a goalie has a genuinely bad night...
  offBy:0.060,       // ...and how much more often shots go in
  formSd:0.007,      // an ordinary night's spread
  backup:0.006,      // the backup: this much worse than the starter on average (when the ratings aren't known)
  backupPer:0.0009,  // ...or this much per rating point behind the starter (round 44)
  tired:0.015,       // a starter on the second night of a back-to-back: this much worse (round 44)
  softBad:0.65, softOk:0.15,   // goals the commentary calls soft: on a bad night, on an ordinary one
  cueTrue:0.5,       // commentary on a system that is about the real one
  favW:5,            // a club's usual system: this many times as likely as any other (4: 61%, as basketball)
  scouted:6,         // games in a scouting report
  misprep:{own:0.93, opp:1.05},  // set up all week for the wrong system: out of shape until you change it
  prepped:{own:1.05, opp:0.95}   // ...for the right one: drilled, sharper than a change made mid-game
};
const HK = Object.assign({}, HK_BASE, (typeof LEAGUE!=="undefined"&&LEAGUE.tuning&&LEAGUE.tuning.hk)||{}, (typeof HK_TRY!=="undefined"?HK_TRY:{}));
/* ============ engine 12 (round 89): the attributes play ============
   The team's shape on the ice (hkShapeOf, through gameCtx sh): each skater's lean (an attribute against his own rating)
   weighed by his group's weight for it and his ice time (a position's share; the man behind him takes the depth's share,
   the user's lines and pairings deciding it); the goalie in net on his own. A man's leans weigh to nothing, and each
   term below is worth the same per point (HK12.c, measured: scratch r89), so a lean changes how a team plays, not what
   it is worth. Shooting: a shot's chance of going in. Passing: shots made. Skating: half shots made, half shots kept
   from your end. Checking: shots allowed. Defence: the chance of the shots allowed. The goalie in net: Reflexes at even
   strength, Positioning more on the penalty kill. Plans realise some more than others (HK12.pw): skating with them
   is a skating game, clogging it up a checking one. */
const HK12_ENV=k=>(typeof process!=="undefined"&&process.env&&process.env[k]);
const HK12=Object.assign({a:+(HK12_ENV("HK12_A")||2.5),
  c:Object.assign({sht:0.0478,pas:0.0635,sktO:0.031,sktD:0.031,chk:0.06,def:0.0449,rfx:0.0528,gpo:0.04,gpoPP:1.6,rfxPP:0.5},   // measured: a point of any is worth HK12.a rating points of result (standings points; equal goal margin first, r89 marg-hk.js, then by value, fitv.js, 100,000 games)
    HK12_ENV("HK12_C")?JSON.parse(HK12_ENV("HK12_C")):{}),
  pw:Object.assign({safe:{skt:1.5,pas:1.25,chk:0.7,def:0.75}, aggressive:{chk:1.5,def:1.4,skt:0.6,pas:0.8}},
    HK12_ENV("HK12_PW")?JSON.parse(HK12_ENV("HK12_PW")):{})});
const HK_SHK=["sht","pas","skt","chk","def"], HK_GK=["rfx","gpo"];
function hkV12(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=12 }
/* R a roster, H the set of hurt slots, dep the user's ice time ({f,d,g}: ride/bal/roll) or null */
function hkShapeOf(R,H,dep){ const T={}; HK_SHK.forEach(k=>T[k]=0); const G=[{rfx:0,gpo:0},{rfx:0,gpo:0}];
  if(!R||typeof attrOf!=="function")return {sk:T,g:G};
  const add=(p,m)=>{ if(!p||!(m>0))return; const A=attrOf(p); if(!A)return; const W=ATTRS.w[attrGrp(p)]||{}; HK_SHK.forEach(k=>{ if(A[k]!=null&&W[k])T[k]+=m*W[k]*(A[k]-p.r) }) };
  const share=i=>{ const g=Object.keys(DEPLOY).find(x=>DEPLOY[x].idx.indexOf(i)>=0), k=dep&&dep[g]; return k&&k!=="bal"&&DEPLOY[g].opts[k]?DEPLOY[g].opts[k].b:POS[i].bench };
  for(let i=0;i<5;i++){ const P=POS[i], b=share(i), hs=H&&H.has(i), hb=H&&H.has(BK(i));
    if(hs)add(hb?null:R[BK(i)],P.w); else { add(R[i],P.w*(1-b)); if(!hb)add(R[BK(i)],P.w*b) } }
  // the goalies: [the one who starts, the one behind him]; a hurt starter's backup starts and a walk-on (no lean) backs him up
  const gk=p=>{ const o={rfx:0,gpo:0}; const A=p&&attrOf(p); if(!A)return o; const W=ATTRS.w[attrGrp(p)]||{}; HK_GK.forEach(k=>{ if(A[k]!=null&&W[k])o[k]=POS[5].w*W[k]*(A[k]-p.r) }); return o };
  const s0=H&&H.has(5), b0=H&&H.has(BK(5)), g0=s0?(b0?null:R[BK(5)]):R[5], g1=s0||b0?null:R[BK(5)];
  G[0]=gk(g0); G[1]=gk(g1);
  const r3=v=>Math.round(v*1000)/1000; HK_SHK.forEach(k=>T[k]=r3(T[k])); G.forEach(o=>HK_GK.forEach(k=>o[k]=r3(o[k])));
  return {sk:T,g:G} }
function hkShapeT(t){ try{ const H=SEA.talent?new Set(SEA.talent.active(t).map(x=>x.idx)):null; return hkShapeOf(SEA.roster[t],H,typeof deployOf==="function"?deployOf(SEA,t):null) }catch(e){ return hkShapeOf(null) } }
/* the plan's fit (round 89): skating with them is a skating game, clogging it up a checking one (HK12.pw). Measured
   (scratch r89 fit-hk.js, 150,000 games a cell): per point of lean, in rating points per point of HK12.a, on top of
   balanced; HK12_FIT on a person's path (the plan also picks a person's system), HK12_FITC on the computer's */
const HK12_FIT={safe:{sht:0.059,pas:0.288,skt:0.514,chk:-0.184,def:-0.164,rfx:0.074,gpo:0.035}, aggressive:{sht:-0.103,pas:-0.304,skt:-0.431,chk:0.189,def:0.229,rfx:-0.088,gpo:-0.044}};
const HK12_FITC={safe:{sht:0.044,pas:0.250,skt:0.457,chk:-0.213,def:-0.198,rfx:0.034,gpo:0.012}, aggressive:{sht:-0.051,pas:-0.225,skt:-0.362,chk:0.290,def:0.258,rfx:-0.065,gpo:-0.031}};
/* a plan's own worth at a gap, no lean, in standings points: Elo on the balanced curve [at even, per Elo of gap]
   (scratch r89 pv.js, 60,000 games a point). Clogging it up is worth about 15 at even: more overtime, more loser points */
const HK12_SHIFT={safe:[-2.4,0.0305], aggressive:[17,-0.033]};
function hkFitOf(F,T){ if(!F)return 0; let v=0; HK_SHK.forEach(k=>v+=(F[k]||0)*T.sk[k]); HK_GK.forEach(k=>v+=(F[k]||0)*T.g[0][k]); return R_SLOPE*HK12.a*v }
/* round 94 (engine 17): one spread of fit (7.3 Elo, scratch r94 fitsd.js) to 8 points on hockey's curve (91 Elo), held
   to 15 points (176). Played through the plan's channel: skating with them makes more shots, clogging it up allows fewer */
const HK17_ENV=k=>HK12_ENV(k)&&+HK12_ENV(k);
const HK17={m:HK17_ENV("HK17_M")||12.5, cap:HK17_ENV("HK17_CAP")||176, gs:HK17_ENV("HK17_GS")||1.25, ga:HK17_ENV("HK17_GA")||1.52, g:HK17_ENV("HK17_G")||1.02};   // g: the league's shots back to 6.1 goals (more clubs clog it up on 17)
function sportPlanFit(t,pl){ return hkV12()?planAmp(hkFitOf(HK12_FIT[pl],hkShapeT(t)),HK17):0 }
function sportPlanFitC(t,pl){ return hkV12()?planAmp(hkFitOf(HK12_FITC[pl],hkShapeT(t)),HK17):0 }
function sportPlanCap(){ return HK17.cap }   // round 109: planVs holds a person's plan to the same cap
function sportPlanShift(pl,gap){ return planShiftAt(HK12_SHIFT[pl],gap) }
/* the same on a person's path (the plan also sets your system: skating with them is a forecheck, clogging it up a trap),
   measured (r89 pvh.js, 60,000 games a point): Ian (round 89) chose to put it in the chance before a game */
const HK12_SHIFTH={safe:[-21.4,0.0519], aggressive:[12,-0.0929]};
function sportPlanShiftH(pl,gap){ return hkV12()?planShiftAt(HK12_SHIFTH[pl],gap):0 }
function sportShape(t){ if(!hkV12())return null; const T=hkShapeT(t); return Object.assign({},T.sk,T.g[0]) }
const PLAN_LEAN={safe:"skaters",aggressive:"checking and defence"};   // round 94: the reason line
function sportPlanFitLine(t,pl){ return hkV12()?planFitWords(t,pl,{safe:"skaters",aggressive:"checking and defence"}):"" }
/* gameplans and in-game modes: how many events a side creates, and allows */
const AGGR = {
  safe:      {own:1.12, opp:1.10},   // skate with them: more hockey, both ways
  balanced:  {own:1.00, opp:1.00},
  aggressive:{own:0.86, opp:0.84},   // clog it up: fewer chances, more luck
  push:      {own:1.20, opp:1.12},
  sit:       {own:0.84, opp:0.90},
  urgent:    {own:1.00, opp:1.00}
};
/* systems: own and opp scale a side's shots and the shots it allows */
const SYSTEM = {
  forecheck:{l:"an aggressive forecheck", own:1.05, opp:1.05, counter:"stretch"},
  trap:     {l:"a neutral-zone trap",     own:0.88, opp:0.86, counter:"dump"},
  cycle:    {l:"a grinding cycle",        own:1.03, opp:0.98, counter:"collapse"}
};
/* round 107: what the read card marks, from the same counts and the same marks it shows. A pick that answers a marked
   style fits the evidence and is never graded wrong, like the best fit (Grokbot: two marks on the card and a hard cross;
   soccer's card marked crosses and the grade went by going long) */
function readFlags(dp){ const T=dp&&dp.tell; if(!T)return []; const n=Math.max(1,T.n), f=[];
  if(T.to/n>=1.2)f.push("forecheck"); if(T.fe/n>=1.2)f.push("trap"); if(T.cy/n>=1.2)f.push("cycle"); return f }
const SYSTEM_KEYS=["forecheck","trap","cycle"];
const ANSWERS = {
  stretch: {beats:"forecheck", l:"Stretch passes: beat the first man", d:"Quick, direct breakouts before their forwards arrive"},
  dump:    {beats:"trap",      l:"Dump it in and chase",               d:"Stop trying to carry it through the middle"},
  collapse:{beats:"cycle",     l:"Collapse low, take away the slot",   d:"Live with point shots; own the net-front"}
};
/* what each system leaves in the numbers, per spell: [giveaways it forces in
   the other side's zone, entries it kills at the blue line, cycle shifts] */
const HK_TELL = { forecheck:[2.0,0.6,0.7], trap:[0.5,2.1,0.5], cycle:[0.6,0.6,2.0] };
const HK_TELL_BASE=[0.7,0.7,0.7];
function shotsIn(rng,lam){ return Math.max(0,Math.round(rng.gauss(lam,Math.sqrt(Math.max(lam,0.01))*HK.shotSd))) }
function goalsFrom(rng,n,p){ let g=0; for(let i=0;i<n;i++)if(rng.r()<p)g++; return g }
function hkRead(T){
  const n=Math.max(1,T.n), out={};
  SYSTEM_KEYS.forEach(k=>{ const t=HK_TELL[k]; let s=0;
    s+=(T.to/n-HK_TELL_BASE[0])*(t[0]-HK_TELL_BASE[0]);
    s+=(T.fe/n-HK_TELL_BASE[1])*(t[1]-HK_TELL_BASE[1]);
    s+=(T.cy/n-HK_TELL_BASE[2])*(t[2]-HK_TELL_BASE[2]); out[k]=s });
  return SYSTEM_KEYS.reduce((a,k)=>out[k]>out[a]?k:a,SYSTEM_KEYS[0]);
}
const ASSIST=["normal","Leave it to your assistant"];
function readCall(T,hint,early){
  return {k:"read",h:early||"First intermission",q:"How are they playing us? Pick the answer.",
    opts:Object.keys(ANSWERS).map(a=>[a,ANSWERS[a].l]).concat([ASSIST]),
    tell:{to:T.to,fe:T.fe,cy:T.cy,n:T.n}, best:hkRead(T), pearl:hint||hkRead(T)};
}
/* ten minutes left in a one-goal (or tied) game: some clubs change system for the third, more often when behind.
   Since the second intermission beside the whole game, as soccer's half-time read (Instinct: the split column is
   what makes a change readable). Pearl reads the whole game: she's slow to see a change. Grokbot: a 5-4 playoff
   game with five minutes left asked nothing. */
function thirdCall(lead,T,T3,cur){
  const D={to:T.to-T3.to,fe:T.fe-T3.fe,cy:T.cy-T3.cy,n:T.n-T3.n};
  return {k:"third",h:`${lead>0?"Up one":lead<0?"Down one":"Tied"}, ten minutes left`,q:"Timeout. Have they changed anything since the second intermission?",
    opts:(cur&&ANSWERS[cur]?[["keep","Keep it: "+ANSWERS[cur].l]]:[]).concat(Object.keys(ANSWERS).filter(a=>a!==cur).map(a=>[a,ANSWERS[a].l])).concat([ASSIST]),
    tell:{to:T.to,fe:T.fe,cy:T.cy,n:T.n}, tell3:D, best:hkRead(D), pearl:hkRead(T)};
}
function goalieCall(per,G){
  return {k:"goalie",h:per===1?"Your goalie, after one":"Your goalie, after two",
    q:"He's let in "+G.ga+". Bad night, or bad luck?",
    opts:[["swap","Put the backup in"],["keep","Keep him in"],ASSIST],
    ga:G.ga, xga:Math.round(G.xga*10)/10, soft:G.soft, sa:G.sa, pearl:G.lastSoft};
}
function intCall(lead){
  return lead<0
    ? {k:"push",h:`Down ${-lead} after two`,q:"Twenty minutes left. Open it up?",
       opts:[["push","Push: pinch the D, more shots"],["keep","Stay the course"],ASSIST]}
    : {k:"lock",h:`Up ${lead} after two`,q:"Twenty minutes left. Sit on it?",
       opts:[["sit","Lock it down: trap, block shots"],["keep","Keep playing our game"],ASSIST]};
}
/* the last five minutes, up one or level (round 40: 81% of one-goal finishes asked nothing; Grokbot). Down one is the
   goalie call. Up one: sit on it or hunt the second; level: go for the win or play for overtime and the point. */
const HK_FINAL=true, HK_OTQ=true;
/* three-on-three overtime: open it up (more chances both ways, so the better side's edge shows) or hold the puck and
   take your chances in a shootout. Edge-dependent by design: the stronger side should attack, the weaker hold. */
function otCall(){ return {k:"ot",h:"Overtime: three on three",q:"Open it up, or keep the puck and take the shootout if it comes?",
  opts:[["attack","Open it up: send a defenceman"],["hold","Keep the puck: no risks, shootout if it comes"],ASSIST]} }
function finalCall(lead,playoff){
  // round 79: in the playoffs there's no point for an overtime loss, and overtime is sudden death (Ian: "a point is a point" in a knockout)
  if(lead<=0&&playoff)return {k:"final",ko:true,h:"Tied, five minutes left",q:"Go for the win, or play it tight and take it to sudden-death overtime?",
       opts:[["push","Go for the win"],["sit","Play it tight: on to sudden death"],ASSIST]};
  return lead>0
    ? {k:"final",h:"Up one, five minutes left",q:"Shut it down, or go for the second and finish it?",
       opts:[["sit","Shut it down: trap, block shots"],["push","Go for the second"],ASSIST]}
    : {k:"final",h:"Tied, five minutes left",q:"Go for the win, or play for overtime and the point?",
       opts:[["push","Go for the win"],["sit","Play for overtime: a point is a point"],ASSIST]};
}
const HK_GSTART=true;
/* the second night of a back-to-back: the tired starter, or the backup (round 44: Muse, "a backup who can plausibly
   play"). Your assistant starts the backup, as the computer does. */
function goalStartCall(G){
  return {k:"gstart",h:"In goal tonight",q:`${G.s?G.s.n:"Your starter"} played last night. Start him tired, or give the backup the night?`,
    opts:[["starter",`Start ${G.s?G.s.n.split(" ").slice(-1)[0]:"the starter"}: tired, but your best`],["backup",`Start ${G.b?G.b.n.split(" ").slice(-1)[0]:"the backup"}: fresh`],ASSIST],
    gk:G};
}
function pullCall(lead,shortTo){
  // killing a penalty at the question (Grokbot: offered on a penalty kill, with no word of it)
  const pk=shortTo?`, a man short until ${Math.floor(shortTo)}:${String(Math.round((shortTo%1)*60)).padStart(2,"0")}`:"";
  return {k:"pull",h:`Down ${-lead}, late in the third${pk}`,q:pk?"When does the goalie come out? Early would mean six against four once he's out.":"When does the goalie come out?",
    opts:[["early","Early: over three minutes left"],["late","The usual: under two minutes"],ASSIST]};
}
/* the scouting report: the systems a club played in its last few games,
   drawn from its own seed so it never moves the game */
function scoutReport(fav,seed){
  const r=new RNG(seed>>>0), w=SYSTEM_KEYS.map(k=>k===fav?HK.favW:1), tot=w.reduce((a,b)=>a+b), n={};
  SYSTEM_KEYS.forEach(k=>n[k]=0);
  for(let g=0;g<HK.scouted;g++){ let x=r.r()*tot, i=0; while(x>w[i]){x-=w[i];i++} n[SYSTEM_KEYS[i]]++ }
  return n;
}
function prepCall(rep){
  const top=SYSTEM_KEYS.reduce((a,k)=>rep[k]>rep[a]?k:a,SYSTEM_KEYS[0]);
  return {k:"prep",h:"Before the puck drops: the scouting report",q:"Set up for how they usually play, or wait and see?",
    opts:Object.keys(ANSWERS).map(a=>[a,ANSWERS[a].l]).concat([["normal","Wait and see: leave it to your assistant"]]),
    report:Object.assign({},rep), n:HK.scouted, pearl:top};
}
function makeLiveGame(rng, eloH, eloA, planH, planA, humans, playoff, ctx){
  ctx=ctx||{}; const fav=ctx.fav||{};
  if(typeof humans!=="object"||humans===null)humans={home:!!humans, away:!humans};
  const gap=(eloH-eloA)*(typeof GAP_SCALE!=="undefined"?GAP_SCALE:1);
  const night=()=>rng.r()<HK.offNight?HK.offBy+rng.gauss(0,HK.formSd):rng.gauss(0,HK.formSd);
  const side0=()=>({sys:null, ans:null, form:night(), backupIn:false, ga:0, xga:0, soft:0, sa:0, lastSoft:null,
    tell:{to:0,fe:0,cy:0,n:0}, lastCue:null});
  /* who's in goal (round 44): on the second night of a back-to-back the computer (and your assistant) starts the
     backup, as most benches do; the starter, if he plays, is tired. The backup's cost is his rating gap. */
  const GK=(ctx&&ctx.gk)||{}, bkCost=sd=>GK[sd]&&GK[sd].gap!==undefined?HK.backupPer*Math.max(0,GK[sd].gap):HK.backup;
  const st={h:0,a:0,drives:[],seg:0,humans:humans,lines:{h:blankTeamLine(),a:blankTeamLine()},
    mode:{home:planH,away:planA}, late:{home:null,away:null}, asked:{}, queue:[], ask:null,
    ot:0, so:false, done:false, playoff:!!playoff, S:{home:side0(),away:side0()}};
  st.gap=gap;
  // tonight's form was drawn above; who starts only shifts it (no new dice)
  const startGoalie=(sd,who)=>{ const X=st.S[sd]; if(who==="starter")X.form+=HK.tired; else { X.backupIn=true; X.startedBk=true; X.form+=bkCost(sd) } };
  if(HK_GSTART)["home","away"].forEach(sd=>{ if(GK[sd]&&GK[sd].b2b&&!humans[sd])startGoalie(sd,"backup") });
  const other=s=>s==="home"?"away":"home";
  // engine 12: the teams' shapes (round 89). Factors on a side's shots and on its shots' chance; the goalie in net's own
  const SH=hkV12()&&ctx.sh&&ctx.sh.home&&ctx.sh.away?ctx.sh:null;
  const pwOf=(m,k)=>(HK12.pw[m]&&HK12.pw[m][k])||1;
  const shotF=(sd,mX,mY)=>{ if(!SH)return 1; const X=SH[sd].sk, Y=SH[other(sd)].sk, c=HK12.c;
    return Math.max(0.3,1+HK12.a*(c.pas*pwOf(mX,"pas")*X.pas+c.sktO*pwOf(mX,"skt")*X.skt-c.chk*pwOf(mY,"chk")*Y.chk-c.sktD*pwOf(mY,"skt")*Y.skt)) };
  // the shooters' part (what the shots were worth: the goalie read's expected goals follow it) and the goalie's
  const finSk=(sd,mX,mY)=>{ if(!SH)return 1; const X=SH[sd].sk, Y=SH[other(sd)].sk, c=HK12.c;
    return Math.max(0.3,1+HK12.a*(c.sht*pwOf(mX,"sht")*X.sht-c.def*pwOf(mY,"def")*Y.def)) };
  const finG=(sd,pp)=>{ if(!SH)return 0; const G=SH[other(sd)].g[st.S[other(sd)].backupIn?1:0], c=HK12.c;
    return -HK12.a*(c.rfx*(pp?c.rfxPP:1)*G.rfx+c.gpo*(pp?c.gpoPP:1)*G.gpo) };
  // engine 17 (round 94): the plan's fit amplified, the extra (in Elo) played through its channel at hockey's own rates
  // (a point of Passing moves shots by c.pas and is worth HK12.a rating points: c.pas/R_SLOPE a shot factor per Elo)
  const ampMemo={home:{},away:{}};
  const ampE=(sd,m)=>{ if(!SH||!planAmpV()||!m||m==="balanced"||!HK12_FIT[m])return 0; const M=ampMemo[sd]; if(M[m]!==undefined)return M[m];
    const f=hkFitOf((humans[sd]?HK12_FIT:HK12_FITC)[m],SH[sd]);
    // engine 23 (round 109): a person's plan against tonight's opponent's roster (planVs), played on the same channel
    // (that part plays 1.14x its Elo: r109 vs2.js, the change from engine 22 on common dice; played at 0.88)
    if(humans[sd]&&planVsV()){ const fa=planAmp(f,HK17); return M[m]=fa-f+0.88*(planVsTot(fa,planAmp(hkFitOf(HK12_FIT[m],SH[other(sd)]),HK17),HK17.cap)-fa) }
    return M[m]=planAmp(f,HK17)-f };
  const ampF=(sd,mX,mY)=>{ let f=1; if(mX==="safe")f*=1+HK17.gs*ampE(sd,mX)*HK12.c.pas/R_SLOPE; if(mY==="aggressive")f*=1-HK17.ga*ampE(other(sd),mY)*HK12.c.chk/R_SLOPE; return Math.max(0.3,f)*(planAmpV()?HK17.g:1) };
  const lead=side=>side==="home"?st.h-st.a:st.a-st.h;
  // a side's system: the better side forechecks, the weaker traps
  const pickSys=(side)=>{
    const m=st.mode[side];
    if(humans[side]){ if(m==="safe")return "forecheck"; if(m==="aggressive")return "trap"; return "cycle" }
    const e=side==="home"?gap:-gap, w=(e>60?[3,1,2]:e<-60?[1,3,2]:[2,2,2]).map((x,i)=>SYSTEM_KEYS[i]===fav[side]?x*HK.favW:x);
    let x=rng.r()*w.reduce((a,b)=>a+b), i=0; while(x>w[i]){x-=w[i];i++} return SYSTEM_KEYS[i];
  };
  st.S.home.sys=pickSys("home"); st.S.away.sys=pickSys("away");
  const queueCall=(side,dp)=>{ const key=dp.k+(dp.h||"")+side; if(!humans[side]||st.asked[key])return;
    st.asked[key]=true; st.queue.push({side:side,dp:dp}) };
  // the computer: push when behind in the third, sit on a lead of two or more
  const cpuMode=(side,s)=>{ const L=lead(side);
    if(s>=8&&L<0)return "push"; if(s>=8&&L>=2)return "sit"; return st.mode[side] };
  const modeOf=(s,side)=>{ const L=humans[side]&&st.late[side];
    if(L==="auto"||!humans[side])return cpuMode(side,s);
    return L||st.mode[side] };
  const readIt=(side,p)=>{ if(rng.r()<p){st.S[side].ans=SYSTEM[st.S[other(side)].sys].counter; st.S[side].prepd=false} };
  // the computer's goalie rule: four in, he's out (once)
  const cpuGoalie=(side)=>{ const X=st.S[side]; if(!X.backupIn&&X.ga>=4)swapGoalie(side) };
  const swapGoalie=(side)=>{ const X=st.S[side]; X.backupIn=true; X.form=night()+bkCost(side); X.ga=0; X.xga=0; X.soft=0; X.sa=0;
    (st.pendEv=st.pendEv||[]).push({m:st.seg*5,side:side,k:"swap"}) };
  const segment=(s)=>{
    const mH=modeOf(s,"home"), mA=modeOf(s,"away");
    const AH=AGGR[mH]||AGGR.balanced, AA=AGGR[mA]||AGGR.balanced;
    const e=gap, ev=(st.pendEv||[]).splice(0);
    const sysF=(side)=>{ const X=st.S[side], O=st.S[other(side)]; let f=SYSTEM[X.sys].own*SYSTEM[O.sys].opp;
      if(X.ans){ if(ANSWERS[X.ans].beats===O.sys)f*=HK.counter.own; else f*=HK.misread }
      if(O.ans&&ANSWERS[O.ans].beats===X.sys)f*=HK.counter.opp;
      if(X.prepd)f*=ANSWERS[X.ans].beats===O.sys?HK.prepped.own:HK.misprep.own;
      if(O.prepd)f*=ANSWERS[O.ans].beats===X.sys?HK.prepped.opp:HK.misprep.opp;
      return f };
    let lamH=HK.shots/SEGS*(1+e*HK.shotEdge)*AH.own*AA.opp*sysF("home")*shotF("home",mH,mA)*ampF("home",mH,mA);
    let lamA=HK.shots/SEGS*(1-e*HK.shotEdge)*AA.own*AH.opp*sysF("away")*shotF("away",mA,mH)*ampF("away",mA,mH);
    if(s>=8&&st.h!==st.a){ if(st.h<st.a){lamH*=1+HK.scoreFx;lamA*=1-HK.scoreFx*0.6} else {lamA*=1+HK.scoreFx;lamH*=1-HK.scoreFx*0.6} }
    // a shot's chance: the shooter's edge, and the goalie it's against
    const kH=finSk("home",mH,mA), kA=finSk("away",mA,mH);
    const pH=HK.sh*(1+e*HK.finishEdge)*(kH+finG("home"))+st.S.away.form, pA=HK.sh*(1-e*HK.finishEdge)*(kA+finG("away"))+st.S.home.form;
    const t0=s*5, minute=()=>t0+rng.r()*5;
    const sv=[];   // round 70: every shot stopped, for the highlights (Ian: "more saves"); placed by count, no draws
    const shoot=(side,n,p,pp,xk)=>{ const G=st.S[other(side)]; let g=0;
      for(let i=0;i<n;i++){ G.sa++; G.xga+=(pp?HK.ppSh:HK.sh)*(xk||1);
        // engine 20 (round 106): a power play's shots inside its two minutes (they were spread over the five, so the full
        // match drew a side short for up to five); no draw
        const pm=pp&&ENGINE_V>=20&&st.penAt?st.penAt[other(side)]:null, at=pm!=null?Math.min(t0+4.99,pm+2*(i+0.5)/n):t0+5*(i+0.5)/n;
        if(!(rng.r()<Math.max(0.01,p))){ sv.push({m:at,side:other(side),k:"sv",pp:!!pp,u:(s*31+i*13+sv.length*7+(side==="home"?3:5))%100}); continue }
        { g++; G.ga++;
          // was it soft? A goalie on a bad night lets in more that he should stop
          const bad=G.form>HK.offBy/2, soft=rng.r()<(bad?HK.softBad:HK.softOk);
          if(soft){G.soft++; G.lastSoft=true} else G.lastSoft=false;
          const gm=minute(); ev.push({m:pm!=null?Math.min(t0+4.99,pm+(gm-t0)/5*2):gm,side:side,k:"goal",pp:!!pp,soft:soft,u:rng.int(100)}) } }
      return g };
    const sH=shotsIn(rng,lamH), sA=shotsIn(rng,lamA);
    let gH=shoot("home",sH,pH,false,kH), gA=shoot("away",sA,pA,false,kA);
    const Lh=st.lines.h, La=st.lines.a; let ppH=0,ppA=0;
    const penAt=(sd,m)=>{ (st.penAt=st.penAt||{})[sd]=m; return m };
    if(rng.r()<HK.pens/SEGS){ ppH=shotsIn(rng,HK.ppShots); ev.push({m:penAt("away",minute()),side:"away",k:"pen",u:rng.int(100)});
      const g=shoot("home",ppH,HK.ppSh*(1+e*HK.finishEdge)*(kH+finG("home",true))+st.S.away.form,true,kH); gH+=g; Lh.ppg+=g; Lh.pp++; La.pim+=2 }
    if(rng.r()<HK.pens/SEGS){ ppA=shotsIn(rng,HK.ppShots); ev.push({m:penAt("home",minute()),side:"home",k:"pen",u:rng.int(100)});
      const g=shoot("away",ppA,HK.ppSh*(1-e*HK.finishEdge)*(kA+finG("away",true))+st.S.home.form,true,kA); gA+=g; La.ppg+=g; La.pp++; Lh.pim+=2 }
    Lh.sog+=sH+ppH; La.sog+=sA+ppA;
    st.h+=gH; st.a+=gA;
    // big saves, now and then
    [["home",sA+ppA],["away",sH+ppH]].forEach(([sd,n])=>{ if(n>=3&&rng.r()<0.35)ev.push({m:minute(),side:sd,k:"save",u:rng.int(100)}) });
    // the tells
    ["home","away"].forEach(sd=>{ const X=st.S[sd], t=HK_TELL[X.sys], T=X.tell;
      T.to+=Math.max(0,Math.round(rng.gauss(t[0],Math.sqrt(t[0])))); T.fe+=Math.max(0,Math.round(rng.gauss(t[1],Math.sqrt(t[1]))));
      T.cy+=Math.max(0,Math.round(rng.gauss(t[2],Math.sqrt(t[2])))); T.n++;
      if(rng.r()<0.3){ const k=rng.r()<HK.cueTrue?X.sys:rng.pick(SYSTEM_KEYS), u=rng.int(100);
        ev.push({m:minute(),side:sd,k:"cue",cue:k,u:u}); if(u%3===0)X.lastCue=k } });
    // the last spell: trailing by one or two, the goalie comes out
    let en=null;
    if(s===SEGS-1){
      const tr=st.h<st.a?"home":st.a<st.h?"away":null;
      if(tr&&Math.abs(st.h-st.a)<=2){
        const pick=humans[tr]&&st.late[tr+"pull"], when=pick==="early"?"early":"normal";
        const mins=HK.pullMin[when], edge=tr==="home"?e:-e;
        ev.push({m:60-mins,side:tr,k:"pull"});
        let m=0; while(m<mins){ const dt=Math.min(1,mins-m); m+=dt;
          const trG=rng.r()<HK.pullFor*dt*(1+edge*HK.finishEdge), enG=rng.r()<HK.pullAgainst*dt*(1-edge*HK.finishEdge);
          if(trG&&(!enG||rng.r()<0.5)){ if(tr==="home")st.h++; else st.a++; en={side:tr,kind:"extra"};
            ev.push({m:60-mins+m,side:tr,k:"goal",extra:true,u:rng.int(100)}); if(ENGINE_V>=21){ if(tr==="home")st.lines.h.sog++; else st.lines.a.sog++ } break }
          if(enG){ if(tr==="home")st.a++; else st.h++; en={side:tr==="home"?"away":"home",kind:"empty"};
            ev.push({m:60-mins+m,side:other(tr),k:"goal",en:true,u:rng.int(100)}); if(ENGINE_V>=21){ if(tr==="home")st.lines.a.sog++; else st.lines.h.sog++ } break }
        }
      }
    }
    // round 107 (engine 21): a goal into an empty net, or with the goalie pulled for an extra man, is a shot on goal (it
    // was the scorer's but not his team's: Chicago's shooters 36 against the team's 35, test/ev-full.js)
    /* round 107 (engine 21): an even-strength goal is never timed inside the other side's penalty (Grokbot: a 37' goal
       inside a penalty, not a power-play goal). The power play's own shots are timed inside the two minutes; the others
       were timed anywhere in the stretch. One that lands inside goes just before the penalty, or just after it ends. */
    if(ENGINE_V>=21){ const pens=ev.filter(x=>x.k==="pen").map(x=>({side:x.side,m:x.m})).concat(st.penCarry||[]);
      // by the minutes shown: a goal at the penalty's minute or the two after reads as inside it
      ev.forEach(x=>{ if(x.k!=="goal"||x.pp||x.en||x.extra)return; const F=Math.floor, pn=pens.find(q=>q.side!==x.side&&F(x.m)>=F(q.m)&&F(x.m)<=F(q.m)+2); if(!pn)return;
        const b=F(pn.m)-0.5, a=F(pn.m)+3.5; if(b>=t0)x.m=b; else if(a<t0+5)x.m=a });
      st.penCarry=ev.filter(x=>x.k==="pen"&&x.m+2>t0+5).map(x=>({side:x.side,m:x.m})) }
    ev.sort((x,y)=>x.m-y.m); ev.forEach(x=>x.m=Math.min(59,Math.floor(x.m))); sv.forEach(x=>x.m=Math.min(59,Math.floor(x.m)));
    const prev=st.drives.length?st.drives[st.drives.length-1]:{sh:0,sa:0};
    const mom=Math.max(0.12,Math.min(0.88,(sH+ppH+0.5)/(sH+ppH+sA+ppA+1)+rng.gauss(0,0.05)));
    const d={seg:s,h:st.h-prev.sh,a:st.a-prev.sa,sh:st.h,sa:st.a,shots:[sH+ppH,sA+ppA],pp:[ppH>0,ppA>0],en:en,ot:0,ev:ev,sv:sv,mom:mom,
      T:{home:Object.assign({},st.S.home.tell),away:Object.assign({},st.S.away.tell)},
      sog:[Lh.sog,La.sog]};
    // who started in goal, for the commentary (round 50: "your assistant's call: start Vann: fresh", and the starter's name
    // made every save: Muse). Data only; no dice.
    if(!st.drives.length&&(st.S.home.startedBk||st.S.away.startedBk))d.bk={home:!!st.S.home.startedBk,away:!!st.S.away.startedBk};
    // who is in net now, for the highlights' rink (round 71, Muse: the rink showed the starter in all four games the backup played)
    if(st.S.home.backupIn||st.S.away.backupIn)d.gIn={home:!!st.S.home.backupIn,away:!!st.S.away.backupIn};
    if(ENGINE_V>=22)d.md={home:mH,away:mA};   // round 108: the mode each side played the stretch in, for the rink (no draws)
    st.drives.push(d); return d;
  };
  const overtime=()=>{
    const e=gap, pH=0.5+e*HK.finishEdge*2.2, ev=[];
    if(st.playoff){                                          // sudden death: 20-minute periods until a goal
      let k=0; while(k++<8){ st.ot=k;
        const lamH=HK.shots/3*(1+e*HK.shotEdge)*shotF("home","balanced","balanced"), lamA=HK.shots/3*(1-e*HK.shotEdge)*shotF("away","balanced","balanced");
        const gH=goalsFrom(rng,shotsIn(rng,lamH),HK.sh*(1+e*HK.finishEdge)*(finSk("home","balanced","balanced")+finG("home"))+st.S.away.form), gA=goalsFrom(rng,shotsIn(rng,lamA),HK.sh*(1-e*HK.finishEdge)*(finSk("away","balanced","balanced")+finG("away"))+st.S.home.form);
        if(gH||gA){ const w=(gH&&(!gA||rng.r()<gH/(gH+gA)))?"home":"away"; if(w==="home")st.h++; else st.a++;
          ev.push({m:60+(k-1)*20+rng.int(20),side:w,k:"goal",u:rng.int(100)}); break } }
      if(st.h===st.a){ const w=rng.r()<pH?"home":"away"; if(w==="home")st.h++; else st.a++; ev.push({m:60+st.ot*20,side:w,k:"goal",u:rng.int(100)}) }
    } else {
      st.ot=1;
      // your overtime call (round 40): attack makes a goal likelier and tilts it to the better side; hold, the reverse
      let og=HK.otGoal, ph=pH; ["home","away"].forEach(sd=>{ const m=st.late[sd+"ot"]; if(!m)return;
        if(m==="attack"){ og=Math.min(0.92,og+0.14); ph=0.5+(ph-0.5)*1.5 } else if(m==="hold"){ og=Math.max(0.3,og-0.2); ph=0.5+(ph-0.5)*0.6 } });
      if(rng.r()<og){ const w=rng.r()<ph?"home":"away"; if(w==="home")st.h++; else st.a++; ev.push({m:60+rng.int(5),side:w,k:"goal",u:rng.int(100)}) }
      else { st.so=true; if(rng.r()<0.5+(pH-0.5)*HK.soEdge)st.h++; else st.a++ }
    }
    st.drives.push({seg:SEGS,sh:st.h,sa:st.a,ot:st.ot,so:st.so,h:0,a:0,shots:[0,0],pp:[false,false],ev:ev});
  };
  st.log=[];            // the person's reads, and what was true (for the result screen)
  const apply=(side,dp,v)=>{
    const X=st.S[side];
    if(dp.k==="prep"){ if(ANSWERS[v]){ const t=st.S[other(side)].sys; X.ans=v; X.prepd=true;
      st.log.push({side:side,h:dp.h,k:"prep",pick:v,truth:t,right:ANSWERS[v].beats===t,split:(()=>{const a=Object.values(dp.report).sort((x,y)=>y-x);return a[0]===a[1]?a.filter(x=>x>0).join("-"):false})()}); { const L=st.log[st.log.length-1]; if(L.split)L.unclear=true } { const L=st.log[st.log.length-1], ks=Object.keys(dp.report).sort((a,b)=>dp.report[b]-dp.report[a]); if(!L.split&&ANSWERS[v]&&ANSWERS[v].beats===ks[0]){ L.followed=true; L.fav=ks[0] } }   /* round 71: set up for what the report said most */   // a split report is a coin flip: not graded either way (Grokbot: 3-3 graded "right")
      } else if(v!==undefined&&dp.report){ const t=st.S[other(side)].sys, ks=Object.keys(dp.report).sort((a,b)=>dp.report[b]-dp.report[a]);
        // waiting is a decision too, graded on whether the report's favourite was right (Muse, round 39: no trace on the card)
        st.log.push({side:side,h:dp.h,k:"prep",pick:"wait",waited:true,fav:ks[0],truth:t,right:ks[0]!==t,unclear:dp.report[ks[0]]===dp.report[ks[1]]}) } return }
    if(dp.k==="read"&&ANSWERS[v]){ const t=st.S[other(side)].sys; st.log.push({side:side,h:dp.h,k:"read",pick:v,truth:t,right:ANSWERS[v].beats===t,evid:dp.best,fe:ANSWERS[v].beats===dp.best||(ENGINE_V>=21&&readFlags(dp).includes(ANSWERS[v].beats))}) }
    if(dp.k==="goalie"&&(v==="swap"||v==="keep")){ const off=X.form>HK.offBy/2; st.log.push({side:side,h:dp.h,k:"goalie",pick:v,truth:off?"off":"ok",right:(v==="swap")===off}) }
    if(dp.k==="read"){ if(ANSWERS[v]){ if(v!==X.ans)X.prepd=false; X.ans=v } else { const was=X.ans; readIt(side,0.45); st.autoDid=X.ans!==was&&ANSWERS[X.ans]?"read them himself and switched to "+ANSWERS[X.ans].l.split(":")[0].toLowerCase():"read them himself and kept the system as it was" } return }
    if(dp.k==="third"){ const t=st.S[other(side)].sys, pick=v==="keep"?X.ans:ANSWERS[v]?v:null;
      if(pick&&ANSWERS[pick]){ st.log.push({side:side,h:dp.h,k:"third",pick:pick,truth:t,right:ANSWERS[pick].beats===t,evid:dp.best}); if(pick!==X.ans)X.prepd=false; X.ans=pick }
      else { const was=X.ans; readIt(side,0.3); st.autoDid=X.ans!==was&&ANSWERS[X.ans]?"read them himself and switched to "+ANSWERS[X.ans].l.split(":")[0].toLowerCase():"read them himself and kept the system as it was" }
      return }
    // round 71: once you've kept him in, your assistant doesn't pull him at the next break on his own (Muse: a keep graded
    // right, then "Cooper Vann comes in for K. Igwe" at the next intermission with no call put to you)
    if(dp.k==="goalie"){ if(v==="keep")X.kept=true; if(v==="swap")swapGoalie(side); else if(v==="normal"){ if(!(ENGINE_V>=2&&X.kept))cpuGoalie(side); st.autoDid=ENGINE_V>=2&&X.kept?"kept him in, as you had":"made the computer's goalie call" } return }
    if(dp.k==="push"||dp.k==="lock"){ st.late[side]=v==="push"?"push":v==="sit"?"sit":v==="keep"?st.mode[side]:"auto"; if(st.late[side]==="auto")st.autoDid="managed it by the score, as every computer coach does"; return }
    if(dp.k==="pull")st.late[side+"pull"]=v==="early"?"early":"normal";
    if(dp.k==="ot"){ st.late[side+"ot"]=v==="attack"||v==="hold"?v:null; return }
    if(dp.k==="gstart"){ startGoalie(side,v==="starter"?"starter":"backup"); return }
    if(dp.k==="final"){ st.late[side]=v==="push"?"push":v==="sit"?"sit":"auto"; if(st.late[side]==="auto")st.autoDid="managed it by the score, as every computer coach does"; return }
  };
  st.next=function(){
    const fin=()=>({done:true,h:st.h,a:st.a,drives:st.drives});
    if(st.done)return fin();
    if(st.pendingSide){ const P=st.pendingSide, v=st.answer; st.pendingSide=null; st.answer=null; st.autoDid=null; apply(P.side,P.dp,v) }
    if(st.queue.length){const Q=st.queue.shift(); st.pendingSide=Q;
      const r={ask:Q.dp,mine:Q.side==="home"?st.h:st.a,theirs:Q.side==="home"?st.a:st.h,q:st.seg,side:Q.side};
      st.waiting=r; return r}
    const s=st.seg;
    if(HK_GSTART&&s===0&&!st.gq){ st.gq=true; ["home","away"].forEach(sd=>{ if(humans[sd]&&GK[sd]&&GK[sd].b2b)queueCall(sd,goalStartCall(GK[sd])) }); if(st.queue.length)return st.next() }
    if(s===0&&!st.p0){st.p0=true; ["home","away"].forEach(sd=>{ const o=other(sd);
      if(humans[sd]&&!humans[o]&&fav[o])queueCall(sd,prepCall(scoutReport(fav[o],(ctx.seed||0)+(o==="home"?1:2)))) });
      if(st.queue.length)return st.next()}
    /* your goalie: asked only when the evidence is split, a soft goal or goals
       well over what the shots were worth, and after two only if something
       new has gone in. Asked on a schedule, with the answer plain, it taught
       players to skip it (Instinct). Not asked, the assistant's rule stands. */
    function askGoalie(sd,X,per){
      if(X.ga<2||X.backupIn)return;
      const split=X.soft>0||X.ga>=X.xga+1.5, fresh=X.askedGa===undefined||X.ga>X.askedGa;
      // and only with the game in reach: down three or more, or up big, the swap moved 0-2.5 points
      // (test/call-weight.js, Nov 2026); within two it was 10-22 (Instinct: make it rare and heavy)
      if(split&&fresh&&Math.abs(lead(sd))<=2){ X.askedGa=X.ga; queueCall(sd,goalieCall(per,X)) } else cpuGoalie(sd);
    }
    // first intermission: the read, and your goalie if he's let in two or more
    // two down early: call your timeout and make the read now, not at the intermission (Instinct)
    if(s>=2&&s<4&&!st.i1){ ["home","away"].forEach(sd=>{ if(!humans[sd]||lead(sd)>-2||(st.r1e||{})[sd])return; (st.r1e=st.r1e||{})[sd]=true;
        const O=st.S[other(sd)]; queueCall(sd,readCall(O.tell,O.lastCue,`Timeout: ${downWord(-lead(sd))} down, ${s*5} minutes in`)) });   // the real gap: "two down" at 0-3 (Muse)
      if(st.queue.length)return st.next()}
    if(s===4&&!st.i1){st.i1=true; ["home","away"].forEach(sd=>{ const X=st.S[sd], O=st.S[other(sd)];
        if(!humans[sd]){ readIt(sd,0.45); cpuGoalie(sd); return }
        if(!(st.r1e||{})[sd])queueCall(sd,readCall(O.tell,O.lastCue));
        askGoalie(sd,X,1) });
      if(st.queue.length)return st.next()}
    // second intermission: the score, and your goalie
    if(s===8&&!st.i2){st.i2=true; ["home","away"].forEach(sd=>{ const X=st.S[sd], L=lead(sd);
        if(!humans[sd]){ cpuGoalie(sd); return }
        // the other bench may change its system for the third (only against a person: no other game moves)
        // only in a game within a goal: elsewhere no third-period read is asked, and a change nobody asks about only
        // erodes the first read (it halved its worth: test/hk-reads.js)
        // round 95 (engine 18): two apart after two, the counts since are kept as well, so a game that comes within a goal
        // by ten minutes left gets the read too (it is hockey's late decision now); no system change, no draw
        { const O=st.S[other(sd)]; if(ENGINE_V>=18&&!humans[other(sd)]&&Math.abs(L)===2)O.t3=Object.assign({},O.tell);
          if(!humans[other(sd)]&&Math.abs(L)<=1){ O.t3=Object.assign({},O.tell);
            if(rng.r()<(L>0?(HK.thirdSwitchBehind||0.5):(HK.thirdSwitch||0.25))){ const ks=SYSTEM_KEYS.filter(k=>k!==O.sys); O.sys=ks[rng.int(ks.length)] } } }
        askGoalie(sd,X,2);
        if(L!==0&&Math.abs(L)<=3)queueCall(sd,intCall(L)) });      // up four after two, it's gone
      if(st.queue.length)return st.next()}
    if(s===10&&!st.t3q){st.t3q=true; ["home","away"].forEach(sd=>{ const O=st.S[other(sd)];
        if(humans[sd]&&O.t3&&Math.abs(lead(sd))<=1)queueCall(sd,thirdCall(lead(sd),O.tell,O.t3,st.S[sd].ans)) });
      if(st.queue.length)return st.next()}
    if(s===11&&!st.pl){st.pl=true; ["home","away"].forEach(sd=>{ const L=lead(sd); if(HK_FINAL&&(L===1||L===0))queueCall(sd,finalCall(L,st.playoff)); if(L===-1){   /* down two, early or normal moved nothing (0.0 points: test/call-weight.js) */ const p=st.penAt&&st.penAt[sd]; const X=st.S[sd]; queueCall(sd,Object.assign(pullCall(L,p!==undefined&&p+2>s*5?p+2:0),{gn:{ga:X.ga,sa:X.sa,xga:X.xga,bk:!!X.backupIn}})) }   /* his night, on the card (round 47, Muse: the pull is a coin flip about a stranger) */ });
      if(st.queue.length)return st.next()}
    if(s>=SEGS&&HK_OTQ&&st.h===st.a&&!st.playoff&&!st.otq){ st.otq=true; ["home","away"].forEach(sd=>queueCall(sd,otCall())); if(st.queue.length)return st.next() }
    if(s>=SEGS){ if(st.h===st.a)overtime(); st.done=true; return fin() }
    const d=segment(s); st.seg++;
    return {drive:d,h:st.h,a:st.a};
  };
  st.reply=function(v){ st.answer=v; st.waiting=null };
  return st;
}
/* A whole game at once: the same game, with the computer's calls, or
   opts.decide for a person who isn't watching. */
/* each club's usual system this season, and the seed for its scouting report */
function clubStyle(t,year){ return rosterStyle(t,year)||SYSTEM_KEYS[strHash(t+"|"+year)%SYSTEM_KEYS.length] }
/* round 92: the forecheck from Skating and Checking, the trap from Defence, the cycle from Passing */
const sportStyleAttrs={forecheck:"Skating and Checking",trap:"Defence",cycle:"Passing"};
function sportStyleScores(R){ const T=hkShapeOf(R,null,null).sk; return {forecheck:T.skt+T.chk, trap:T.def, cycle:T.pas} }
/* the goalie picture for a game (round 44): the second night of a back-to-back, and the gap between the goalies */
function gkCtx(t,step){
  try{ if(typeof SEA==="undefined"||!SEA||!SEA.sched||!SEA.roster||!SEA.roster[t])return null;
    const b2b=step>0&&SEA.sched.some(g=>g.week===step-1&&(g.home===t||g.away===t)), R=SEA.roster[t], st=R[5], bk=R[BK(5)];
    if(!st||!bk)return {b2b:b2b};
    return {b2b:b2b, gap:st.r-bk.r, s:{n:st.n,r:st.r}, b:{n:bk.n,r:bk.r}} }catch(e){ return null } }
/* round 94: tonight's goalie in the chance before a game. On the second night of a back-to-back the computer starts his
   backup (and your assistant does too, unless you start the tired starter), and the chance never counted it: after five
   weeks it read Edmonton +4.4, Toronto +4.3, Vegas -4.3 against the engine, and -0.5 to +1.2 with the back-to-backs
   taken out (scratch r94 pre37.js NOGK). Measured worth (scratch r94 gkelo.js, equal clubs, 20,000 games a gap, engine
   17): 8 points behind the starter -43 Elo, 16 -72, 24 -104, 4.45 a point. */
const HK_BK_ELO=4.45;
function sportTonightEdge(t){ if(!planAmpV()||!HK_GSTART||typeof SEA==="undefined"||!SEA)return 0; const G=gkCtx(t,SEA.step); if(!G||!G.b2b)return 0;
  return -HK_BK_ELO*(G.gap!==undefined?Math.max(0,G.gap):HK.backup/HK.backupPer) }
function gameCtx(h,a,year,step){ return {fav:{home:clubStyle(h,year),away:clubStyle(a,year)}, gk:HK_GSTART?{home:gkCtx(h,step),away:gkCtx(a,step)}:undefined, seed:strHash(h+"|"+a+"|"+year+"|"+step),
  sh:hkV12()?{home:hkShapeT(h),away:hkShapeT(a)}:undefined} }
function playGame(rng, eloH, eloA, planH, planA, opts){
  opts=opts||{};
  const humans=opts.decide?{home:!!opts.userIsHome,away:!opts.userIsHome}:{home:false,away:false};
  const e=makeLiveGame(rng,eloH,eloA,planH,planA,humans,opts.playoff,opts.ctx);
  let guard=0;
  while(guard++<120){
    const r=e.next();
    if(r.done)return {h:r.h,a:r.a,drives:r.drives,ot:e.ot,so:e.so,lines:e.lines};
    if(r.ask){ const v=opts.decide(r.ask,{mine:r.mine,theirs:r.theirs,q:r.q}); e.reply(v||r.ask.opts[r.ask.opts.length-1][0]) }
  }
  return {h:e.h,a:e.a,drives:e.drives,ot:0,lines:e.lines};
}
