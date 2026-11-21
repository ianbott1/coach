/* ============ live game engine ============ */
/* Games are played out drive by drive and the score emerges from them, so a
   decision made in the fourth quarter genuinely changes the ending. */

const DRIVES_PER_TEAM = (LEAGUE.tuning&&LEAGUE.tuning.drives)||12;   // the league sets its pace
/* How much a rating gap is worth on the field. College gaps are enormous; a
   pro league's are small but decide more, so a league can steepen it. */
const GAP_SCALE = (LEAGUE.tuning&&LEAGUE.tuning.gapScale)||1;
/* A league can have teams manage the game late: sit on a three-score lead in
   the fourth quarter, take risks when well behind. Applies only to a side
   nobody is calling; a coach makes that choice for himself. */
const GAME_STATE = !!(LEAGUE.tuning&&LEAGUE.tuning.gameState);
function situational(aggr,i,total,mine,theirs){
  if(!GAME_STATE||i<total*0.75)return aggr;
  const d=mine-theirs;
  return d>=17?"sit":d<=-9?"chase":aggr;
}
const MAX_CALLS = 6;          // how many decisions a single game will ask of you (it was 3, and most games asked 2:
                              // testers, Nov 2026: "a coached game asks less of you than one real drive does")
/* a call worth asking: not in a game that's decided (a fourth and 12 at 37-17, a fourth and 1
   down 27 were asked and graded irrelevant: Instinct, Grokbot) */
function callMatters(q,diff){ const a=Math.abs(diff); return !(a>=28||(q>=3&&a>=21)||(q===4&&a>=17)) }
/* a rough chance of winning from the score, the quarter and the strengths: a fourth down asked when it was
   under 10% or over 90% moved 2.2-2.9 points; between, 9.2 (test/call-weight.js, 276 calls, Nov 2026; strength /15 fitted: kept 9.2, dropped 3.2) */
function inReach(q,diff,edge){ const frac=Math.max(0.05,(4-Math.min(4,q)+0.5)/4), z=(diff+edge/15*frac)/(13*Math.sqrt(frac));
  const p=0.5*(1+erfApprox(z/Math.SQRT2)); return p>=0.1&&p<=0.9 }
function erfApprox(x){ const t=1/(1+0.3275911*Math.abs(x)), y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x); return x>=0?y:-y }

/* Aggression presets, used both as a pre-game plan and as an in-game choice. */
/* A gameplan is a trade between talent and chance. gap scales how much the
   rating gap counts on the side's own drives: safe lets the better team's
   talent show, risk makes the game more of a coin flip. At even strength the
   three are worth the same; an underdog should take risks, a favourite
   should play it safe. td/fg/to only change how it looks (more field goals
   and fewer turnovers when safe; more touchdowns and turnovers when
   risky), set so they don't change who wins. See test/plans.js. */
const AGGR = {
  safe:      {td:-0.015, fg:+0.035, to:-0.015, gap:1.30},   // rebalanced Nov 2026 (turnovers now give the ball
                                                            // at the spot): even strength within 0.4 of each other over 40,000 games
  balanced:  {td: 0,     fg: 0,     to: 0,     gap:1.00},
  aggressive:{td:+0.022, fg:-0.045, to:+0.030, gap:0.55},
  // not a gameplan: the engine's own urgency, for overtime and for a fourth
  // down it has decided to go for (the old "aggressive" numbers)
  urgent:    {td:+0.082, fg:-0.060, to:+0.086, gap:1.00},
  // late-game management for sides nobody is calling (see situational):
  // sitting on a lead burns clock, chasing a deficit takes shots
  sit:       {td:-0.050, fg:+0.058, to:-0.070, gap:1.00},
  chase:     {td:+0.082, fg:-0.060, to:+0.086, gap:1.00},
  // your call to force it on a last possession: touchdown or bust. Right
  // when you need a touchdown; a mistake when a field goal would do.
  force:     {td:+0.080, fg:-0.120, to:+0.090, gap:1.00}
};

/* your defense on their late drive (the "defend" call): prevent gives up field goals and the clock to stop the
   touchdown; pressure takes the ball away more often and gives up more big plays. Which is right depends on the
   score: up 4 to 8 only a touchdown beats you; up 1 to 3 or level, a field goal does too. */
const FB_REST_DEF={td:+0.070, fg:+0.030, to:-0.025};   // your backups on defense
const DEF_MODE = {
  prevent: {td:-0.090, fg:+0.090, to:-0.035},
  pressure:{td:+0.035, fg:-0.070, to:+0.075}
};
/* Chance of each outcome on one drive, given the gap between the two teams. */
/* ============ engine 14 (round 91): the attributes play ============
   A team's shape (fbShapeOf, through gameCtx sh): each starter's lean (an attribute against his own rating) weighed by
   his group's weight for it and his position's share of the team (a hurt starter's backup in his place: football's
   backups play only then). Offense and defense apart. A man's leans weigh to nothing, and each term below is worth the
   same per point in wins (FB14.c, measured), so a lean changes how a team plays, not what it's worth. Your drives:
   Arm touchdowns (the deep ball); Accuracy fewer picks; Speed breakaways (touchdowns, more from a long field); Hands
   fewer fumbles and drops; Blocking where a stalled drive dies; Strength drives that keep going (short yardage).
   Their defense: Coverage takes touchdowns away and picks passes; Tackling stops breakaways and forces fumbles; Pass
   rush sacks (a stalled drive dies sooner); Strength stops short yardage; Speed runs down breakaways. Vision counts
   with each group's main term (a quarterback's with Accuracy, a back's with Speed, a receiver's with Hands, a lineman's
   with Blocking, a linebacker's and a safety's with Coverage). */
/* measured (scratch r91 marg.js, 400,000 games a term, common dice): each attribute worth FB14.a rating points of win
   value per point. A pick or a fumble mostly takes the place of a punt, so turnovers alone are worth little a drive:
   Accuracy and Hands are 30% fewer turnovers and 70% drives that keep going; Coverage and Tackling 75% touchdowns and
   breakaways, 25% turnovers. College's gaps are worth less a point (its win curve is flatter), so its terms are smaller.
   On a person's path (a live game, calls to the assistant: marg3.js) Blocking, Pass rush and the turnover terms are worth
   up to 16% more than on the computer's; those are set midway, so both paths are within about 7%. */
const FB14_C0={nfl:{arm:0.05344,acc:0.09618,accS:0.1212,spd:0.05574,hnd:0.09618,hndS:0.1212,blk:31.58,str:0.1779,covT:0.03803,covI:0.09751,tklB:0.03961,tklF:0.09681,rsh:34.21,strD:0.1721,spdD:0.05438},
               cfb:{arm:0.03667,acc:0.06155,accS:0.08418,spd:0.03811,hnd:0.06155,hndS:0.08418,blk:18.77,str:0.1258,covT:0.02667,covI:0.06124,tklB:0.02791,tklF:0.06058,rsh:19.26,strD:0.1248,spdD:0.03914}};
const FB14_ENV=k=>(typeof process!=="undefined"&&process.env&&process.env[k]);
const FB14=Object.assign({a:+(FB14_ENV("FB14_A")||2.5),
  c:Object.assign({arm:0,acc:0,accS:0,spd:0,hnd:0,hndS:0,blk:0,str:0,covT:0,covI:0,tklB:0,tklF:0,rsh:0,strD:0,spdD:0},
    (FB14_C0[LEAGUE.id]||FB14_C0.cfb), FB14_ENV("FB14_C")?JSON.parse(FB14_ENV("FB14_C")):{}),
  g:+(FB14_ENV("FB14_G")||((LEAGUE.tuning&&LEAGUE.tuning.fb14g)||1)),
  gap:+(FB14_ENV("FB14_GAP")||((LEAGUE.tuning&&LEAGUE.tuning.fb14gap)||1)),
  pw:Object.assign({safe:{acc:1.5,hnd:1.5,blk:1.5,arm:0.6,spd:0.6}, aggressive:{arm:1.5,spd:1.5,acc:0.6,hnd:0.6,blk:0.6}}, FB14_ENV("FB14_PW")?JSON.parse(FB14_ENV("FB14_PW")):{})});
const FB_OK=["arm","acc","spd","hnd","blk","str"], FB_DK=["cov","tkl","rsh","str","spd"];
const FB_VIS={QB:"acc",RB:"spd",WR:"hnd",OL:"blk",LB:"cov",DB:"cov"};
function fbV14(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=14 }
function fbShapeOf(R,H){ const O={}, D={}; FB_OK.forEach(k=>O[k]=0); FB_DK.forEach(k=>D[k]=0);
  if(!R||typeof attrOf!=="function")return {o:O,d:D};
  POS.forEach((P,i)=>{ const p=H&&H.has(i)?(H.has(BK(i))?null:R[BK(i)]):R[i]; if(!p)return; const A=attrOf(p); if(!A)return;
    const g=attrGrp(p), W=ATTRS.w[g]||{}, T=/^(DL|LB|DB)$/.test(g)?D:O;
    Object.keys(W).forEach(k=>{ if(A[k]==null)return; const kk=k==="vis"?FB_VIS[g]:k; if(kk&&kk in T)T[kk]+=P.w*W[k]*(A[k]-p.r) }) });
  const r3=v=>Math.round(v*1000)/1000; FB_OK.forEach(k=>O[k]=r3(O[k])); FB_DK.forEach(k=>D[k]=r3(D[k]));
  return {o:O,d:D} }
function fbShapeT(t){ try{ const H=SEA.talent?new Set(SEA.talent.active(t).map(x=>x.idx)):null; return fbShapeOf(SEA.roster[t],H) }catch(e){ return fbShapeOf(null) } }
/* one side's drives against the other's defense: changes to the drive's rates (td, to: chance a drive; brk: touchdown
   chance at a 73-yard field, scaled by the field's length; sus: touchdowns and field goals both, as a share; gain: yards
   on a stalled drive). The plan realises some terms more than others (FB14.pw). */
function fbDriveMod(O,D,plan){ if(!O||!D)return null; const c=FB14.c, w=FB14.pw[plan]||{}, m=k=>w[k]!=null?w[k]:1;
  return {td:c.arm*m("arm")*O.arm-c.covT*D.cov, to:-c.acc*m("acc")*O.acc-c.hnd*m("hnd")*O.hnd+c.covI*D.cov+c.tklF*D.tkl,
    brk:c.spd*m("spd")*O.spd-c.tklB*D.tkl-c.spdD*D.spd, gain:c.blk*m("blk")*O.blk-c.rsh*D.rsh,
    sus:c.str*m("str")*O.str+c.accS*m("acc")*O.acc+c.hndS*m("hnd")*O.hnd-c.strD*D.str} }
function fbSideMods(ctx,planH,planA,hum){ const S=ctx&&ctx.sh; if(!fbV14()||!S||!S.home||!S.away)return {home:null,away:null};
  const M={home:fbDriveMod(S.home.o,S.away.d,planH), away:fbDriveMod(S.away.o,S.home.d,planA)};
  // engine 17 (round 94): the plan's fit amplified, the extra (Elo) through its channel: taking risks scores more touchdowns,
  // playing it safe keeps more drives going (a point of Arm adds c.arm to the touchdown rate and is worth FB14.a rating
  // points: c.arm/(a R_SLOPE) a touchdown point per Elo; Accuracy's drives the same through c.accS)
  if(planAmpV())[["home",planH],["away",planA]].forEach(([sd,pl])=>{ if(!M[sd]||!pl||pl==="balanced")return;
    const F=fbLg(hum&&hum[sd]?FB14_FIT:FB14_FITC)[pl]; if(!F)return; const f=fbFitOf(F,S[sd]), E=planAmp(f,FB17)-f, u=E/(FB14.a*R_SLOPE);
    if(pl==="aggressive")M[sd].td+=FB17.ga*u*FB14.c.arm; else if(pl==="safe")M[sd].sus+=FB17.gs*u*FB14.c.accS });
  return M }
/* the plan's fit: per point of lean, in rating points per point of FB14.a, on top of balanced. FB14_FIT on a person's
   path, FB14_FITC on the computer's (scratch r91 marg2.js, marg3.js) */
const FB14_FIT={nfl:{safe:{"o.arm":-0.371,"o.acc":0.495,"o.spd":-0.367,"o.hnd":0.495,"o.blk":0.515}, aggressive:{"o.arm":0.483,"o.acc":-0.422,"o.spd":0.492,"o.hnd":-0.422,"o.blk":-0.479}},
                 cfb:{safe:{"o.arm":-0.411,"o.acc":0.485,"o.spd":-0.395,"o.hnd":0.485,"o.blk":0.557}, aggressive:{"o.arm":0.456,"o.acc":-0.402,"o.spd":0.461,"o.hnd":-0.402,"o.blk":-0.453}}};   // 200,000 games a cell (college at its engine-14 gap)
const FB14_FITC={nfl:{safe:{"o.arm":-0.394,"o.acc":0.486,"o.spd":-0.393,"o.hnd":0.486,"o.blk":0.47}, aggressive:{"o.arm":0.51,"o.acc":-0.363,"o.spd":0.51,"o.hnd":-0.363,"o.blk":-0.366,"o.str":0.037}},
                  cfb:{safe:{"o.arm":-0.417,"o.acc":0.484,"o.spd":-0.404,"o.hnd":0.484,"o.blk":0.496}, aggressive:{"o.arm":0.479,"o.acc":-0.37,"o.spd":0.485,"o.hnd":-0.37,"o.blk":-0.414}}};   // the defense's terms move under 3% with the plan (noise): left at 0
/* a plan's own worth at a gap, no lean: Elo on the balanced curve [at even, per Elo of gap] (scratch r91 pv.js): safe lets
   talent count (gap 1.3x), so it pays a favourite and costs an underdog; taking risks the reverse */
const FB14_SHIFT={nfl:{safe:[-4.5,0.2432],aggressive:[6.7,-0.3604]}, cfb:{safe:[-5,0.1593],aggressive:[8.1,-0.2416]}};   // 200,000 games a point, gaps -225..225
const FB14_SHIFTH={nfl:{safe:[-7.6,0.2318],aggressive:[12,-0.3529]}, cfb:{safe:[-8,0.1552],aggressive:[10.1,-0.2395]}};   // 100,000 games a point
const fbLg=T=>T[LEAGUE.id]||T.cfb;
// round 95: a fit table's keys parsed once (FB_FITK): fbFitOf ran on every drive on engine 17 and splitting its keys each
// time made college football sim 1.25-1.6x slower than engine 16. Same sum, same order, so the same number to the bit.
const FB_FITK=new WeakMap();
function fbFitOf(F,T){ if(!F||!T)return 0; let K=FB_FITK.get(F); if(!K){ K=Object.keys(F).map(k=>{ const [s,a]=k.split("."); return [s,a,F[k]||0] }); FB_FITK.set(F,K) }
  let v=0; for(let i=0;i<K.length;i++){ const q=K[i], o=T[q[0]]; v+=q[2]*((o&&o[q[1]])||0) } return R_SLOPE*FB14.a*v }
/* round 94 (engine 17): one spread of fit (college 35 Elo, the pros 24: scratch r94 fitsd.js) to 8 points on each curve
   (57 and 43 Elo), held to 15 points (111, 83) */
const FB17=Object.assign({cfb:{m:1.6,cap:111,gs:1.6,ga:1.1,g:0.967}, nfl:{m:1.8,cap:83,gs:1.4,ga:1,g:0.966}}[typeof LEAGUE!=="undefined"&&LEAGUE.id==="nfl"?"nfl":"cfb"],
  FB14_ENV("FB17_M")?{m:+FB14_ENV("FB17_M")}:{}, FB14_ENV("FB17_GS")?{gs:+FB14_ENV("FB17_GS")}:{}, FB14_ENV("FB17_GA")?{ga:+FB14_ENV("FB17_GA")}:{}, FB14_ENV("FB17_G")?{g:+FB14_ENV("FB17_G")}:{});
function sportPlanFit(t,pl){ return fbV14()?planAmp(fbFitOf(fbLg(FB14_FIT)[pl],fbShapeT(t)),FB17):0 }
function sportPlanFitC(t,pl){ return fbV14()?planAmp(fbFitOf(fbLg(FB14_FITC)[pl],fbShapeT(t)),FB17):0 }
function sportPlanShift(pl,gap){ return planShiftAt(fbLg(FB14_SHIFT)[pl],gap) }
function sportPlanShiftH(pl,gap){ return fbV14()?planShiftAt(fbLg(FB14_SHIFTH)[pl],gap):0 }
/* "Your shape": what the engine reads (Speed and Strength at both ends together; Vision is folded into each group's main term) */
function sportShape(t){ if(!fbV14())return null; const T=fbShapeT(t); return {arm:T.o.arm,acc:T.o.acc,hnd:T.o.hnd,blk:T.o.blk,spd:T.o.spd+T.d.spd,str:T.o.str+T.d.str,cov:T.d.cov,tkl:T.d.tkl,rsh:T.d.rsh} }
const PLAN_LEAN={safe:"accuracy, hands and blocking",aggressive:"arm and speed"};   // round 94: the reason line
function sportPlanFitLine(t,pl){ return fbV14()?planFitWords(t,pl,{safe:"accuracy, hands and blocking",aggressive:"arm and speed"}):"" }
function driveOdds(offElo, defElo, startYd, aggr, dmode, sm){
  const A0 = AGGR[aggr] || AGGR.balanced, D = typeof dmode==="string" ? DEF_MODE[dmode] : dmode;
  const A = D ? {td:A0.td+D.td, fg:A0.fg+D.fg, to:A0.to+D.to, gap:A0.gap} : A0;
  // risk makes a drive less about who is better; safe makes it more so
  // pro football softens a big mismatch (past 100 a gap counts half): a stacked roster went 17-0, 98%+ was shown in
  // 1.7% of games (Ian, round 39: "you never see 99% in pro football"); college, with its real mismatches, doesn't
  const SD=LEAGUE.tuning.softDrive, gq=offElo-defElo, ga=Math.abs(gq), gs=!SD||ga<=SD[0]?gq:Math.sign(gq)*(SD[0]+(ga-SD[0])*SD[1]);
  const x = gs * GAP_SCALE / 470 * (A.gap || 1) * (sm||fbV14()?FB14.gap:1);   // engine 14: college's gap counts a little more (computer underdogs now take risks)
  const field = (startYd - 27) / 100;              // better starting spot helps
  let td = 0.238 + x * 0.115 + field * 0.24 + A.td;
  let fg = 0.170 + x * 0.0227 + field * 0.10 + A.fg;
  if(ENGINE_V>=2)fg*=(KICK2[LEAGUE.id]||KICK2.cfb).fg;   // round 71: kicks now miss at their odds; held to the same points
  let to = 0.135 - x * 0.0339 + A.to;
  if(sm){ td+=sm.td+sm.brk*(100-startYd)/73; to+=sm.to; td*=1+sm.sus; fg*=1+sm.sus }
  if(sm||fbV14()){ td*=FB14.g; fg*=FB14.g; if(planAmpV()){ td*=FB17.g; fg*=FB17.g } }   // engine 17: suited plans everywhere score more; held to the league's level   // engine 14: the computer's clubs now pick plans, and taking risks scores more; held to the league's level
  td = Math.max(0.02, Math.min(0.62, td));
  fg = Math.max(0.03, Math.min(0.30, fg));
  to = Math.max(0.03, Math.min(0.30, to));
  return {td:td, fg:fg, to:to};
}

function rollDrive(rng, offElo, defElo, startYd, aggr, dmode, sm){
  const o = driveOdds(offElo, defElo, startYd, aggr, dmode, sm);
  const r = rng.r();
  if (r < o.td) return {pts:7, kind:"TD", stall:100};
  if (r < o.td + o.fg){
    if(ENGINE_V<2)return {pts:3, kind:"FG", stall:Math.min(92,startYd+Math.round(rng.range(12,40)))};
    // round 71: a drive that ends in a kick, from where real kicks come (about 36 yards, rarely past 55), made at its odds
    const dist=Math.round(Math.max(19,Math.min(60,rng.gauss(38,9)))), stall=117-dist;
    return rng.r()<fgOdds(stall)?{pts:3,kind:"FG",stall:stall}:{pts:0,kind:"MISS",stall:stall} }
  if (r < o.td + o.fg + o.to) {
    return {pts:0, kind: rng.r()<0.55 ? "INT" : "FUM",
            stall:Math.min(96,startYd+Math.round(rng.range(0,42)))};
  }
  // the drive stalled: where it died, and how far short, decide the options
  const gain = Math.round(rng.gauss(22,17)+(sm?sm.gain:0));
  const stall = Math.max(startYd-6, Math.min(96, startYd+gain));
  const u = rng.r();
  const togo = u<0.24?1 : u<0.42?2 : u<0.56?3 : u<0.68?4 : u<0.78?5 :
               u<0.86?7 : u<0.93?9 : Math.round(rng.range(11,17));
  const s = rng.r();
  let kind = s<0.70 ? "PUNT" : (s<0.86 ? "DOWNS" : "MISS");
  if (stall>=72 && kind==="PUNT") kind="MISS";       // you don't punt from there
  // round 71 (KICK2): a kick is a kick. Inside field-goal range a stalled drive kicks, and it goes in at the kick's odds
  // for its length; out of range the "miss" was a long one. Every miss was a stalled drive before, whatever the length,
  // and only 59% of kicks went in (NFL ~84%, college ~77%).
  if(ENGINE_V>=2&&kind==="MISS"){ const K=KICK2[LEAGUE.id]||KICK2.cfb;
    if(stall>=K.range&&rng.r()<K.kick){ const dist=fgDistance(stall); if(rng.r()<fgOdds(stall))return {pts:3,kind:"FG",stall:stall,togo:togo,att:dist}; return {pts:0,kind:"MISS",stall:stall,togo:togo,att:dist} }
    kind=rng.r()<0.8?"PUNT":"DOWNS" }
  return {pts:0, kind:kind, stall:stall, togo:togo};
}

/* Field-goal success by distance (stall yard -> attempt length). */
/* a smooth curve through the old steps' middles: every yard counts (it was a staircase: 80% from 33 to
   40 yards, 66% from 41 to 47, so a 41-yarder and a 47-yarder were the same kick: Grokbot, Instinct) */
const FG_CURVE=[[18,0.97],[25,0.95],[32,0.88],[40,0.78],[47,0.65],[54,0.48],[60,0.32],[70,0.15]];
/* round 71: each level's own curve (NFL 2015-24 by distance; college lower), with kick2 seasons. The fg rate per drive is
   raised to hold scoring where it was (KICK2[lg].fg), since the kicks that now miss used to be makes. range: the
   stall from which a stalled drive kicks (a 45-yarder and closer). */
const KICK2={nfl:{range:72,fg:1.0,kick:0.5,curve:[[18,0.99],[25,0.97],[32,0.93],[40,0.85],[47,0.76],[54,0.64],[60,0.48],[70,0.2]]},
             cfb:{range:72,fg:1.0,kick:0.65,curve:[[18,0.98],[25,0.94],[32,0.87],[40,0.77],[47,0.65],[54,0.5],[60,0.32],[70,0.12]]}};
function fgOdds(stall){
  const d=(100-stall)+17, C=ENGINE_V>=2?(KICK2[LEAGUE.id]||KICK2.cfb).curve:FG_CURVE;
  if(d<=C[0][0])return C[0][1];
  for(let i=1;i<C.length;i++){ if(d<=C[i][0]){ const [a,pa]=C[i-1],[b,pb]=C[i]; return pa+(pb-pa)*(d-a)/(b-a) } }
  return C[C.length-1][1];
}
function fgDistance(stall){ return (100-stall)+17; }

/* Fourth-down conversion: distance is what matters, quality adjusts it. */
function goOdds(togo, offElo, defElo){
  const base = 0.68 / (1 + 0.165*(Math.max(1,togo)-1));
  const adj = (offElo-defElo) * GAP_SCALE / 3400;
  return Math.max(0.12, Math.min(0.82, base + adj));
}

/* The end of a game nobody is asked about: the computer's drives, and your assistant's when no call comes up.
   A drive's outcome was rolled without the score, so a team down 7 on its last possession kicked a field goal 18-19%
   of the time and punted more often still, and nobody went for two (Ian, round 39: 0 of ~220,000 touchdowns).
   d: the offense's margin before the drive; left: possessions to go, this one included (1: the last). */
const FB_END=true;
function endgameDrive(rng,res,d,left,offE,defE,sm){
  if(!FB_END||left>2||d>=0)return res;
  const goFor=tg=>{                                     // fourth down, and it has to be a touchdown or at least points that matter
    if(rng.r()>=goOdds(tg,offE,defE))return {pts:0,kind:"DOWNS",stall:res.stall,converted:false,
      note:`needed ${d<=-4?"a touchdown":"points"}: went for it on fourth and ${tg} and came up short`};
    const r=rollDrive(rng,offE,defE,Math.min(90,(res.stall||60)+Math.max(2,tg)),"urgent",null,sm);
    if(r.kind==="FG"&&d<=-4)return rng.r()<0.42?{pts:7,kind:"TD",stall:100,converted:true,note:`went for it on fourth and ${tg}, then scored`}
      :{pts:0,kind:"DOWNS",stall:Math.min(96,(res.stall||60)+15),converted:true,note:"needed a touchdown: turned it over on downs in the red zone"};
    if(r.kind==="PUNT"||r.kind==="MISS")return {pts:0,kind:"DOWNS",stall:r.stall,converted:true,note:`converted on fourth and ${tg}, then turned it over on downs`};
    return Object.assign(r,{converted:true,note:r.pts>0?`went for it on fourth and ${tg}, then scored`:`converted on fourth and ${tg}, drive stalled later`}) };
  if(res.kind==="FG"&&d<=-4){                            // three points don't help: from the red zone, go for the end zone
    if(rng.r()<0.40)return {pts:7,kind:"TD",stall:100,note:"passed up the field goal and scored"};
    return {pts:0,kind:"DOWNS",stall:res.stall,converted:false,note:"needed a touchdown: passed up the field goal and came up short"} }
  if(res.kind==="PUNT"||(res.kind==="MISS"&&(res.stall||0)<72&&d<=-4))return goFor(res.togo||4);   // nobody punts it away behind with the game ending
  return res;
}
/* two points or one, by the chart every coach carries late in a game: the margin after the touchdown. */
function twoChart(diff6,late){
  if(!FB_END)return false;
  if(diff6===-2)return true;                            // to tie, any time in the second half
  return late&&[-10,-5,1,5].indexOf(diff6)>=0;
}
/* Where a drive starts, given how the previous one ended, and where: a turnover or a miss gives the
   other side the ball at the spot (it was a random ~42 whatever the spot, so a fumble at their 10 handed
   them the ball near midfield: "a kickoff after a Denver fumble", "started own 72": Grokbot) */
const PUNT_GROSS=45;
function nextStart(rng, prevKind, at){
  const cl=(x,a,b)=>Math.round(Math.max(a,Math.min(b,x)));
  if (at!==undefined&&at!==null){
    if (prevKind === "INT") return cl(100-at+rng.gauss(6,9), 2, 95);      // and a return
    if (prevKind === "FUM") return cl(100-at+rng.gauss(2,4), 2, 95);
    if (prevKind === "DOWNS") return cl(100-at, 4, 95);
    if (prevKind === "MISS") return cl(Math.max(20,100-at+7), 20, 80);   // the spot of the kick, or the 20
    // a punt goes from where it's kicked: ~45 yards and a short return, or a touchback. It was the
    // opponent's 24 whatever the spot, so punting from your own 10 cost nothing and pinning them from
    // midfield gained nothing, and going for it won most fourth downs (Instinct)
    if (prevKind === "PUNT"){ const land=100-at-rng.gauss(PUNT_GROSS,7); return land<=0?20:cl(land+Math.max(0,rng.gauss(6,5)),2,70) }
  }
  if (prevKind === "ONSIDE") return cl(rng.gauss(52,4), 40, 65);          // you recovered your own onside kick
  if (prevKind === "ONSIDEX") return cl(rng.gauss(58,5), 45, 75);         // they recovered it: a short field
  if (prevKind === "TD" || prevKind === "FG") return Math.round(rng.gauss(26, 6));
  if (prevKind === "PUNT") return Math.round(Math.max(4, Math.min(60, rng.gauss(24, 10))));
  if (prevKind === "INT" || prevKind === "FUM") return Math.round(Math.max(4, Math.min(75, rng.gauss(42, 16))));
  if (prevKind === "DOWNS") return Math.round(Math.max(10, Math.min(80, rng.gauss(48, 12))));
  if (prevKind === "MISS") return Math.round(Math.max(15, Math.min(60, rng.gauss(32, 8))));
  return Math.round(rng.gauss(26, 6));
}

/* Play a whole game out, drive by drive. If a decision hook is supplied it may
   pause; otherwise the game runs start to finish. */
function playGame(rng, eloH, eloA, planH, planA, opts){
  opts=opts||{};
  const st={
    h:0, a:0, drives:[], prev:"TD", idx:0,
    total:DRIVES_PER_TEAM*2,
    aggrH:planH||"balanced", aggrA:planA||"balanced",
    baseH:planH||"balanced", baseA:planA||"balanced",
    used:{}, rng:rng
  };
  const M=fbSideMods(opts.ctx,planH||"balanced",planA||"balanced",opts.decide?{home:!!opts.userIsHome,away:!opts.userIsHome}:null);   // engine 14: each side's shape against the other's
  for(let i=0;i<st.total;i++){
    if(st.endAfter!==undefined&&i>st.endAfter)break;   // clock ran out
    const home=i%2===0;
    const start=nextStart(rng,st.prev,st.at);
    const q=Math.min(4,Math.floor(i/(st.total/4))+1);
    let aggr=home?st.aggrH:st.aggrA;
    if(!(opts.decide&&(home?opts.userIsHome:!opts.userIsHome)))
      aggr=situational(aggr,i,st.total,home?st.h:st.a,home?st.a:st.h);
    let forced=null;
    if(opts.decide){
      const isUser = home ? opts.userIsHome : !opts.userIsHome;
      if(isUser){
        const ctx={q:q, idx:i, total:st.total, startYd:start, used:st.used, rng:rng,
                   mine: opts.userIsHome?st.h:st.a, theirs: opts.userIsHome?st.a:st.h};
        const dp=decisionPoint(ctx,true);
        if(dp){
          const choice=opts.decide(dp,ctx);
          st.used[dp.k]=true;
          if(dp.k==="fourth")forced=choice;
          else if(choice==="push")aggr=(dp.k==="chase"?"force":"chase");   // calls are game management,
          else if(choice==="sit"){                     // not the weekly gameplan
            aggr="sit";
            // running clock takes possessions off the board for both teams
            st.endAfter=Math.min(st.total-1, i+2);   // running clock really does end games
          }
          else aggr=home?st.baseH:st.baseA;
          if(home)st.aggrH=aggr; else st.aggrA=aggr;
        }
      }
    }
    let res;
    if(forced==="kick"){
      res = rng.r()< (0.62 + (start-55)*0.006) ? {pts:3,kind:"FG"} : {pts:0,kind:"MISS"};
    }else if(forced==="punt"){
      res = {pts:0,kind:"PUNT"};
    }else if(forced==="go"){
      const conv = rng.r() < 0.52;
      res = conv ? rollDrive(rng, home?eloH:eloA, home?eloA:eloH, Math.min(88,start+6), "urgent", null, home?M.home:M.away)
                 : {pts:0,kind:"DOWNS"};
      if(conv&&res.pts===0)res={pts:0,kind:res.kind};
    }else{
      res = rollDrive(rng, home?eloH:eloA, home?eloA:eloH, start, aggr, null, home?M.home:M.away);
    }
    if(home)st.h+=res.pts; else st.a+=res.pts;
    st.drives.push({home:home,q:q,start:start,pts:res.pts,kind:res.kind,
                    h:st.h,a:st.a,n:i+1,aggr:aggr});
    st.prev=res.kind; st.at=res.stall;
  }
  // overtime rather than an arbitrary tiebreak
  let ot=0;
  while(st.h===st.a&&ot<24){
    ot++;
    const home=(ot%2===1);
    const r=rollDrive(rng,home?eloH:eloA,home?eloA:eloH,75,"urgent",null,home?M.home:M.away);
    if(home)st.h+=r.pts; else st.a+=r.pts;
    st.drives.push({home:home,q:5,start:75,pts:r.pts,kind:r.kind,
                    h:st.h,a:st.a,n:st.total+ot,aggr:"aggressive",note:"overtime",ot:true});
  }
  return st;
}

/* ---- their defense, and your answer (round 35) ----
   Every other game reads the opponent; football only had the scoreboard (Grokbot: decision weight 4 of 10, pro
   football under one call a game). Each club has a usual defense; a scouting report before kickoff, the drive
   chart's numbers in the second quarter and after half-time, and an answer for your offense that holds until
   you change it. Only in a game a person coaches against the computer: no other game moves. */
const SCHEMES={
  blitz:{l:"sending extra rushers",   counter:"quick"},
  shell:{l:"sitting back, two deep",  counter:"run"},
  box:  {l:"loading the box",         counter:"deep"}
};
const SCHEME_KEYS=["blitz","shell","box"];
const FB_ANSWERS={
  quick:{beats:"blitz", l:"Quick passes and screens", d:"Get it out before the rush gets there"},
  run:  {beats:"shell", l:"Run the ball",             d:"Lean on them while they sit back"},
  deep: {beats:"box",   l:"Take shots downfield",     d:"Throw over a defense crowding the line"}
};
/* round 43 (Ian: simming should do about what the computer coaches do; only good calls beat it): computer drives have
   no read layer, so "leave it to your assistant" keeps the plan as it stands (it read 45% for you, all upside: +3.6
   points a game for doing nothing), and a wrong read costs half what a right one gains, so a guess comes out even */
const FB_READ=Object.assign({right:{td:+0.090,fg:0,to:-0.030}, wrong:{td:-0.056,fg:0,to:+0.020},   // round 43: a right read hits harder (it was +0.070 a drive in touchdown chance)
  favW:3, scouted:6, sw:0.30, swBehind:0.50, tell:2.1, base:0.8}, (LEAGUE.tuning&&LEAGUE.tuning.fbRead)||{});
// per drive of yours, what their defense leaves in the numbers: blitzes, deep safeties, men in the box
const FB_TELL={blitz:[FB_READ.tell,FB_READ.base,FB_READ.base],shell:[FB_READ.base,FB_READ.tell,FB_READ.base],box:[FB_READ.base,FB_READ.base,FB_READ.tell]};
function fbRead(T){ const n=Math.max(1,T.n), v=[T.bl/n,T.sh/n,T.bx/n]; return SCHEME_KEYS[v.indexOf(Math.max(...v))] }
/* round 72 (engV 3, new seasons): a defense keeps to its usual scheme 5 games in 7 (was 3 in 5). Following the
   scouting report was right 55% of the time in college, 54% in the pros (measured, 200 games each; the most it could be
   was 60%, the scheme's own rate), against 60-90% in the other games, and Muse: "the report must predict better than a
   coin flip, or say it's a guess". At 5 the report followed is right about 69% (computed; measured below in ARCHITECTURE) */
const FB_FAVW3=5;
function fbFavW(){ return ENGINE_V>=3?FB_FAVW3:FB_READ.favW }
function clubScheme(t,year){ return rosterStyle(t,year)||SCHEME_KEYS[strHash(t+"|def|"+year)%SCHEME_KEYS.length] }
/* round 92: their defense: the blitz from Pass rush, the two-deep shell from Coverage, the loaded box from Strength and Tackling */
/* round 92 (engine 15, Ian: football's reads tied to the roster): the right answer is worth more when your offense suits
   it: quick passes with Accuracy, the run with Blocking and Strength, shots downfield with Arm and Speed. Each answer's
   term is taken against the league as the season opened (its mean and spread, gameCtx fbn), so across the league a right
   read is worth what it was; FBR.k a spread, held to FBR.lo..FBR.hi. */
const FBR={k:+(FB14_ENV("FBR_K")||0.3), lo:0.5, hi:1.5};
const FB_ANS_TERM={quick:O=>O.acc, run:O=>O.blk+O.str, deep:O=>O.arm+O.spd};
function fbReadFit(a,ctx,sd){ const N=ctx&&ctx.fbn, X=ctx&&ctx.sh&&ctx.sh[sd]; if(!N||!X||!N[a]||!(N[a].s>1e-9)||!FB_ANS_TERM[a])return 1;
  return Math.max(FBR.lo,Math.min(FBR.hi,1+FBR.k*(FB_ANS_TERM[a](X.o)-N[a].m)/N[a].s)) }
/* the league's offense terms for the answers, as the season opened (styleTable keeps them) */
function sportSeasonNorms(sea){ const o={}; Object.keys(FB_ANS_TERM).forEach(a=>{ const v=Object.keys(sea.roster).filter(t=>Array.isArray(sea.roster[t])).map(t=>FB_ANS_TERM[a](fbShapeOf(sea.roster[t],null).o));
  const m=v.reduce((x,y)=>x+y,0)/v.length; o[a]={m:m, s:Math.sqrt(v.reduce((x,y)=>x+(y-m)**2,0)/v.length)} }); return o }
const sportStyleAttrs={blitz:"Pass rush",shell:"Coverage",box:"Strength and Tackling"};
function sportStyleScores(R){ const T=fbShapeOf(R,null).d; return {blitz:T.rsh, shell:T.cov, box:T.str+T.tkl} }
function gameCtx(h,a,year,step){ return {fav:{home:clubScheme(h,year),away:clubScheme(a,year)}, seed:strHash(h+"|"+a+"|"+year+"|"+step),
  sh:fbV14()?{home:fbShapeT(h),away:fbShapeT(a)}:undefined, fbn:ENGINE_V>=15&&typeof SEA!=="undefined"&&SEA&&SEA._styles?SEA._styles.norm:undefined} }
function fbReport(fav,seed){
  const r=new RNG(seed>>>0), w=SCHEME_KEYS.map(k=>k===fav?fbFavW():1), tot=w.reduce((a,b)=>a+b), n={};
  SCHEME_KEYS.forEach(k=>n[k]=0);
  for(let g=0;g<FB_READ.scouted;g++){ let x=r.r()*tot, i=0; while(x>w[i]){x-=w[i];i++} n[SCHEME_KEYS[i]]++ }
  return n;
}
const FB_ASSIST=["normal","Leave it to your assistant"];
function fbPrepCall(rep){
  const top=SCHEME_KEYS.reduce((a,k)=>rep[k]>rep[a]?k:a,SCHEME_KEYS[0]);
  return {k:"prep",h:"Before kickoff: the scouting report",b:"Game-plan your offense for how they usually defend, or wait and see?",
    opts:Object.keys(FB_ANSWERS).map(a=>[a,FB_ANSWERS[a].l]).concat([["normal","Wait and see: leave it to your assistant"]]),
    report:Object.assign({},rep), n:FB_READ.scouted, pearl:top};
}
function fbReadCall(stage,T,T2,last,cur){
  const D=T2&&T2.n?T2:null;
  return {k:"read",stage:stage,h:stage===1?"Second quarter: their defense":"After half-time: their defense",
    b:stage===1?"How are they defending you? Pick your answer.":"Anything changed since the break? Adjust, or leave it.",
    opts:(cur&&FB_ANSWERS[cur]?[["keep","Keep it: "+FB_ANSWERS[cur].l]]:[]).concat(Object.keys(FB_ANSWERS).filter(a=>a!==cur).map(a=>[a,FB_ANSWERS[a].l])).concat([FB_ASSIST]),
    tell:Object.assign({},T), tell2:D?Object.assign({},D):null, best:fbRead(D||T), pearl:last?fbRead(last):fbRead(T)};
}

/* A game you step through one drive at a time. next() returns either a drive,
   a decision that needs an answer, or done. */

/* "fourth and 5", or "fourth and goal" when the line to gain is past the goal line (round 93, engine 16) */
function fourthAnd(tg,stall,cap){ const goal=typeof ENGINE_V!=="undefined"&&ENGINE_V>=16&&stall!=null&&tg>=100-stall;
  return (cap?"Fourth":"fourth")+" and "+(goal?"goal":tg) }
/* A decision offered when a drive dies in makeable territory. */
function fourthDownCall(stall, togo, offElo, defElo){
  // fourth and 10 or more: left to the assistant. It moved 4.7 points a call, 60% under 3 (test/call-weight.js,
  // 276 calls); Grokbot was asked about a fourth and 12 on the opening drive
  if (togo >= 10) return null;
  const dist = fgDistance(stall);
  const yard = Math.max(1, 100 - stall);
  const gp = Math.round(goOdds(togo, offElo, defElo)*100);
  const fp = Math.round(fgOdds(stall)*100);
  const where = stall>=50 ? `their ${yard}` : `your own ${stall}`;
  // round 93: inside their 10 with the line to gain past the goal line, it's fourth and goal (a tester: "4th and 5 at their 4")
  const fd = fourthAnd(togo,stall,true);
  if (stall >= 62) {
    return {k:"fourth", h:`${fd} at ${where}`,
      b:`A ${dist}-yard attempt from here, or keep the drive alive.`,
      opts:[["go",`Go for it \u00b7 ${gp}% to convert`],
            ["kick",`Kick it \u00b7 ${dist} yds \u00b7 ${fp}% to make`],
            stall<78?["punt","Pin them deep"]:null].filter(Boolean)};
  }
  if (stall >= 44) {
    return {k:"fourth", h:`${fd} at ${where}`,
      // too far to kick, and it says so (Grokbot: "72 yards is a long way for the kicker", and Go or Punt
      // with no word on why there was no kick)
      b:`Too far to kick: it would be a ${dist}-yard try. Go for it, or punt and flip the field.`,
      opts:[["go",`Go for it \u00b7 ${gp}% to convert`],["punt","Punt it away"]]};
  }
  // fourth and short in your own half: the call coaches are second-guessed on most (added Nov 2026)
  if (stall >= 30 && togo <= 2) {
    return {k:"fourth", h:`${fd} at ${where}`,
      b:`Short yardage in your own half. Keep the drive alive, or punt and play the field?`,
      opts:[["go",`Go for it \u00b7 ${gp}% to convert`],["punt","Punt it away"]]};
  }
  return null;
}

/* After a touchdown, when the arithmetic makes two points interesting. */
function twoPointCall(mine, theirs, q, late){
  const d = (mine + 7) - theirs;
  if (q < 3) return null;
  if ([-5,-2,-1,1,2,4,5].indexOf(d) >= 0) {
    // in scores, not margins: "puts you at 0" read as a score of nothing
    const td=mine+6, say=(m,t)=>`${m}-${t}${m>t?", up "+(m-t):m<t?", down "+(t-m):", tied"}`;
    return {k:"two", h:`After the touchdown, ${td}-${theirs}`,
      b:`Kick it, or go for two? Two points makes it ${say(td+2,theirs)}; the kick makes it ${say(td+1,theirs)}.`,
      opts:[["kick","Kick the extra point"],["two","Go for two"]]};
  }
  return null;
}

/* humans: which sides a person is calling, {home, away}. A bare boolean is
   the one-coach form: true means the user is the home side. Each side has
   its own calls, asked only on its own drives, and an ask says whose it is. */
function makeLiveGame(rng, eloH, eloA, planH, planA, humans, knock, ctx){
  if(typeof humans!=="object"||humans===null)humans={home:!!humans, away:!humans};
  ctx=ctx||{};
  const st={h:0,a:0,drives:[],prev:"TD",i:0,total:DRIVES_PER_TEAM*2,
            aggrH:planH||"balanced",aggrA:planA||"balanced",
            baseH:planH||"balanced",baseA:planA||"balanced",
            usedH:{},usedA:{},callsH:0,callsA:0,humans:humans,
            rng:rng,endAfter:undefined,
            ask:null,stage:null,pend:null,answer:null};
  // their defense against each person's offense (a person facing the computer)
  st.D={}; st.ans={home:null,away:null}; st.log=[];
  ["home","away"].forEach(sd=>{ const o=sd==="home"?"away":"home"; if(!humans[sd]||humans[o])return;
    const fav=ctx.fav&&ctx.fav[o]; let sch;
    if(fav){ const w=SCHEME_KEYS.map(k=>k===fav?fbFavW():1); let x=rng.r()*w.reduce((a,b)=>a+b), i=0; while(x>w[i]){x-=w[i];i++} sch=SCHEME_KEYS[i] }
    else sch=SCHEME_KEYS[rng.int(3)];
    st.D[sd]={sch:sch,fav:fav,T:{bl:0,sh:0,bx:0,n:0},T2:{bl:0,sh:0,bx:0,n:0},last:null,asked:{}} });
  const smOf=home=>{ const M=fbSideMods(ctx,st.baseH,st.baseA,humans); return home?M.home:M.away };   // engine 14 (the plan as it stands)
  const readMod=sd=>{ const D=st.D[sd], a=st.ans[sd]; if(!D||!a||!FB_ANSWERS[a])return null; if(FB_ANSWERS[a].beats!==D.sch)return FB_READ.wrong;
    const f=fbReadFit(a,ctx,sd); return f===1?FB_READ.right:{td:FB_READ.right.td*f, fg:FB_READ.right.fg*f, to:FB_READ.right.to*f} };
  const tellDrive=sd=>{ const D=st.D[sd]; if(!D)return; const t=FB_TELL[D.sch], pz=l=>{ let k=0,p=Math.exp(-l),c=p,u=rng.r(); while(u>c&&k<12){k++;p*=l/k;c+=p} return k };
    const x={bl:pz(t[0]),sh:pz(t[1]),bx:pz(t[2]),n:1}; ["bl","sh","bx","n"].forEach(k=>{ D.T[k]+=x[k]; if(D.half)D.T2[k]+=x[k] }); D.last=x };

  function push(home,q,start,res,aggr){
    if(home)st.h+=res.pts; else st.a+=res.pts;
    const drive={home:home,q:q,start:start,pts:res.pts,kind:res.kind,
                 h:st.h,a:st.a,n:st.i+1,aggr:aggr,note:res.note||null,
                 converted:(res.converted===undefined?null:res.converted),
                 togo:res.togo||null};
    if(res.kind==="FG"||res.kind==="MISS")drive.stall=res.stall;   // where the kick was from: the box score says how long
    /* round 80: a turnover's return is drawn with the next drive's start (nextStart, its first draw); for the clip, the
       same draw read ahead on a copy of the dice, so nothing the game draws moves (Ian: "no turnover returns"). Where
       the ball was lost (stall) and where they took over (retTo, from their own goal). */
    if((res.kind==="INT"||res.kind==="FUM"||res.kind==="PUNT")&&res.stall!=null){   // (round 81: a punt's flight and return too)
      drive.lost=res.stall; try{ const cp=new RNG(0); cp.a=rng.a; cp.sp=rng.sp; drive.retTo=nextStart(cp,res.kind,res.stall) }catch(e){} }
    st.drives.push(drive);
    st.prev=res.kind; st.at=res.stall; st.i++; st.pend=null; st.stage=null;
    return drive;
  }

  st.next=function(){
    const regOver = st.i>=st.total||(st.endAfter!==undefined&&st.i>st.endAfter);
    if(regOver){
      if(st.h!==st.a||st.otGuard>24)
        return {done:true,h:st.h,a:st.a,drives:st.drives};
      // overtime, both teams from the opponent's 25
      st.otGuard=(st.otGuard||0)+1;
      const home=(st.otGuard%2===1);
      const r=rollDrive(rng,home?eloH:eloA,home?eloA:eloH,75,"urgent",null,smOf(home));
      if(home)st.h+=r.pts; else st.a+=r.pts;
      st.drives.push({home:home,q:5,start:75,pts:r.pts,kind:r.kind,
                      h:st.h,a:st.a,n:st.total+st.otGuard,aggr:"aggressive",
                      note:"overtime",ot:true,converted:null,togo:null});
      return {drive:st.drives[st.drives.length-1],h:st.h,a:st.a};
    }

    const i=st.i, home=i%2===0;
    const isUser = home ? humans.home : humans.away;
    const q=Math.min(4,Math.floor(i/(st.total/4))+1);
    // asks only ever go to the side with the ball, so the score is theirs
    const mine=home?st.h:st.a, theirs=home?st.a:st.h;
    const side=home?"home":"away";
    const used=home?st.usedH:st.usedA;
    const calls=()=>home?st.callsH:st.callsA, called=()=>{if(home)st.callsH++;else st.callsA++};
    const late = i>=st.total-7;
    const offE=home?eloH:eloA, defE=home?eloA:eloH;

    // ---- resume from a decision ----
    if(st.stage){
      let choice=st.answer; st.answer=null;
      const P=st.pend, stage=st.stage;
      if(stage==="strategy"){
        st.stage=null;
        // calls are game management, not the weekly gameplan
        if(choice==="push"){ const m=(P.k==="chase"?"force":"chase"); if(home)st.aggrH=m; else st.aggrA=m }
        else if(choice==="sit"){
          if(home)st.aggrH="sit"; else st.aggrA="sit";
          st.endAfter=Math.min(st.total-1,i+3);
        } else { if(home)st.aggrH=st.baseH; else st.aggrA=st.baseA }
        // fall through and play the drive normally
      } else if(stage==="fourth"){
        let res;
        // the call comes at the stall with the drive's end already rolled: choosing what was rolled keeps it. A missed
        // kick asked about and kicked again got a second try the computer never gets (round 43: +5.5 points a game
        // for leaving every call to your assistant)
        const rolled=P.res.kind==="FG"||P.res.kind==="MISS"?"kick":P.res.kind==="DOWNS"?"go":"punt";
        if(choice===undefined||choice===null||choice==="normal")choice=rolled;
        if(choice===rolled&&P.res.kind!=="PUNT"){ res=Object.assign({},P.res); }
        else if(choice==="go"){
          const tg=P.res.togo||3;
          if(rng.r()<goOdds(tg,offE,defE)){
            // converted: the drive carries on from there
            const r2=rollDrive(rng,offE,defE,Math.min(90,P.res.stall+Math.max(2,tg)),"urgent",null,smOf(home));
            res=r2;
            res.converted=true;
            res.note = r2.pts>0 ? `converted on fourth and ${tg}, then scored`
                                : `converted on fourth and ${tg}, drive stalled later`;
          } else {
            res={pts:0,kind:"DOWNS",stall:P.res.stall,
                 converted:false,
                 note:`went for it on fourth and ${tg} and came up short`};
          }
        } else if(choice==="kick"){
          res = rng.r()<fgOdds(P.res.stall)
            ? {pts:3,kind:"FG",stall:P.res.stall,note:"kicked a "+fgDistance(P.res.stall)+"-yard field goal"}
            : {pts:0,kind:"MISS",stall:P.res.stall,note:"missed a "+fgDistance(P.res.stall)+"-yard field goal"};
        } else res={pts:0,kind:"PUNT",stall:P.res.stall,note:"punted it away"};
        return {drive:push(home,P.q,P.start,res,P.aggr),h:st.h,a:st.a};
      } else if(stage==="fbread"){
        st.stage=null; const D=st.D[side], dp=P.dp;
        const pick=choice==="keep"?st.ans[side]:FB_ANSWERS[choice]?choice:null;
        if(pick&&FB_ANSWERS[pick]){
          const e={side:side,h:dp.h,k:dp.k,pick:pick,truth:D.sch,right:FB_ANSWERS[pick].beats===D.sch};
          if(dp.k==="read"){ e.evid=dp.best; if(FB_ANSWERS[pick]&&FB_ANSWERS[pick].beats===dp.best)e.fe=true } if(dp.k==="prep"){ const a=Object.values(dp.report).sort((x,y)=>y-x); if(a[0]===a[1])e.unclear=true; const ks=Object.keys(dp.report).sort((x,y)=>dp.report[y]-dp.report[x]); if(!e.unclear&&FB_ANSWERS[pick].beats===ks[0]){ e.followed=true; e.fav=ks[0] } }   // round 71: followed the report
          st.log.push(e); st.ans[side]=pick }
        else if(dp.k==="prep"&&dp.report){   // waiting is graded too: right when the report's favourite was wrong (round 42; the
          const ks=Object.keys(dp.report).sort((a,b)=>dp.report[b]-dp.report[a]);   // other four games had it from round 39)
          st.log.push({side:side,h:dp.h,k:"prep",pick:"wait",waited:true,fav:ks[0],truth:D.sch,right:ks[0]!==D.sch,unclear:dp.report[ks[0]]===dp.report[ks[1]]}) }
        // "leave it to your assistant": the plan stays as it is, as for the computer's offense (round 43)
        // fall through and play the drive
      } else if(stage==="rest"){
        st.stage=null;
        if(choice==="rest"){ st.rest=st.rest||{}; st.rest[side]=true; if(home)st.aggrH="sit"; else st.aggrA="sit" }
        st.log.push({side:side,k:"rest",pick:choice==="rest"?"rest":"keep",unclear:true});
        // fall through and play the drive
      } else if(stage==="onside"){
        // asked of the side that just scored, before the other side's possession
        st.stage=null;
        if(choice==="onside"){ const ok=rng.r()<ONSIDE_P;
          if(ok){ st.drives.push({home:home,q:q,start:null,pts:0,kind:"ONSIDE",h:st.h,a:st.a,n:st.i+1,aggr:"balanced",
              note:"never had it: the onside kick was recovered",converted:null,togo:null});
            st.prev="ONSIDE"; st.at=null; st.i++; return {drive:st.drives[st.drives.length-1],h:st.h,a:st.a} }
          st.prev="ONSIDEX"; st.at=null; st.onsideMiss=true }
        // fall through: their possession, from wherever the kick left it
      } else if(stage==="defend"){
        st.stage=null; st.dmode=(choice==="prevent"||choice==="pressure")?choice:null;
        // fall through and play their drive against it
      } else if(stage==="two"){
        let res;
        if(choice==="two"){
          res = rng.r()<0.47 ? {pts:8,kind:"TD",stall:100,note:"scored, and the two-point try was good"}
                             : {pts:6,kind:"TD",stall:100,note:"scored, but the two-point try failed"};
        } else {
          res = rng.r()<0.97 ? {pts:7,kind:"TD",stall:100}
                             : {pts:6,kind:"TD",stall:100,note:"scored, but missed the extra point"};
        }
        if(home)st.h-=6; else st.a-=6;            // put on the board at the question; push adds the whole score
        return {drive:push(home,P.q,P.start,res,P.aggr),h:st.h,a:st.a};
      }
    }

    // ---- before their possession: your onside kick, or your defense on a late drive ----
    // (asked of the side without the ball: the other one, a person facing the computer)
    const oth=home?"away":"home", othUser=home?humans.away:humans.home, othCalls=home?st.callsA:st.callsH;
    if(othUser&&!isUser&&!st.stage&&!st.lateAsked&&othCalls<MAX_CALLS){
      const oMine=home?st.a:st.h, oTheirs=home?st.h:st.a, d=oMine-oTheirs, left=st.total-i;   // left: possessions to go, this one included
      const oUsed=home?st.usedA:st.usedH;
      // you just scored and still trail, with too few possessions to win it the slow way
      if(!oUsed.onside&&(st.prev==="TD"||st.prev==="FG")&&d<0&&d>=-16&&left<=4){
        oUsed.onside=true; if(home)st.callsA++; else st.callsH++; st.lateAsked=true;
        st.stage="onside"; st.pend={q:q};
        return {ask:onsideCall(d,left),mine:oMine,theirs:oTheirs,q:q,side:oth} }
      // their late drive, you ahead by a score or level
      if(!oUsed.defend&&d>=0&&d<=8&&left<=3){
        oUsed.defend=true; if(home)st.callsA++; else st.callsH++; st.lateAsked=true;
        st.stage="defend"; st.pend={q:q};
        return {ask:defendCall(d,left),mine:oMine,theirs:oTheirs,q:q,side:oth} }
    }
    if(!st.stage)st.lateAsked=false;

    const start=st.startHold!==undefined?st.startHold:nextStart(rng,st.prev,st.at); st.startHold=undefined;

    // ---- their defense: the half-time change, and your reads (before your drive) ----
    if(!st.stage&&i>=st.total/2){ ["home","away"].forEach(sd=>{ const D=st.D[sd]; if(!D||D.half)return; D.half=true;
        const behind=(sd==="home"?st.a-st.h:st.h-st.a)<0;   // their side behind
        if(rng.r()<(behind?FB_READ.swBehind:FB_READ.sw)){ const ks=SCHEME_KEYS.filter(k=>k!==D.sch); D.sch=ks[rng.int(ks.length)] } }) }
    if(isUser&&!st.stage&&st.D[side]){ const D=st.D[side]; let dp=null;
      if(!D.asked.prep&&D.fav){ D.asked.prep=true; dp=fbPrepCall(fbReport(D.fav,(ctx.seed||0)+(side==="home"?2:1))); if(i>0)dp.h="Before your first drive: the scouting report" }   // round 79: they had the ball first ("Before kickoff" came after their score: Ian)
      else if(!D.asked.r1&&q>=2&&D.T.n>=2){ D.asked.r1=true; dp=fbReadCall(1,D.T,null,D.last,st.ans[side]) }
      else if(!D.asked.r2&&D.half&&D.T2.n>=2&&callMatters(q,mine-theirs)){ D.asked.r2=true; dp=fbReadCall(2,D.T,D.T2,D.last,st.ans[side]) }
      if(dp){ st.stage="fbread"; st.pend={q:q,dp:dp}; st.startHold=start; return {ask:dp,mine:mine,theirs:theirs,q:q,side:side} } }

    // ---- a decided game, your ball: rest the starters? (Muse: a 24-point fourth-quarter lead asked nothing) ----
    // ...and from the third quarter in a rout (Muse, round 39: a 61-17 win asked nothing after the second quarter)
    const RL=mine-theirs, restNow=(q>=4&&RL>=14&&RL<=24)||(q>=3&&RL>=21&&RL<=40);
    if(isUser&&!st.stage&&restNow&&!(home?st.usedH:st.usedA).rest){
      (home?st.usedH:st.usedA).rest=true; st.stage="rest"; st.pend={q:q}; st.startHold=start;
      return {ask:{k:"rest",h:`Up ${mine-theirs} in the ${q>=4?"fourth":"third"} quarter`,
        b:`Rest your starters? The backups run the clock out: a lead this size usually holds, though not always, and nobody gets hurt on the sideline. ${possLeft(st.total-i,true)}`,
        opts:[["rest","Rest the starters"],["keep","Keep them in until it's safe"],["normal","Leave it to your assistant"]]},mine:mine,theirs:theirs,q:q,side:side} }

    // ---- strategic call before the snap ----
    if(isUser&&calls()<MAX_CALLS&&!st.stage){
      const ctx={q:q,idx:i,total:st.total,startYd:start,used:used,rng:rng,
                 mine:mine,theirs:theirs};
      const dp=decisionPoint(ctx,true);
      if(dp){
        used[dp.k]=true; called();
        st.stage="strategy"; st.pend={q:q,start:start,k:dp.k};
        // round 80 (engine 8): the drive starts where it stood when the call came (it drew its start again on resuming,
        // so a pick's return in the clip and the drive after a call could disagree)
        if(ENGINE_V>=8)st.startHold=start;
        return {ask:dp,mine:mine,theirs:theirs,q:q,side:side};
      }
    }

    const aggr=isUser?(home?st.aggrH:st.aggrA)
                     :situational(home?st.aggrH:st.aggrA,i,st.total,mine,theirs);
    let dm=!isUser?st.dmode:readMod(side); if(!isUser)st.dmode=null;
    // their drive against your rested starters: the backups give up more (the price of resting them)
    if(!isUser&&st.rest&&st.rest[home?"away":"home"]){ const D0=typeof dm==="string"?DEF_MODE[dm]:dm, R0=FB_REST_DEF;
      dm={td:(D0?D0.td:0)+R0.td, fg:(D0?D0.fg:0)+R0.fg, to:(D0?D0.to:0)+R0.to} }   // your defense, this drive only; your offense's answer, until you change it
    const res=rollDrive(rng,offE,defE,start,aggr,dm,smOf(home));
    if(isUser)tellDrive(side);
    if(dm&&!isUser)res.note=(res.note?res.note+"; ":"")+(dm==="prevent"?"against your prevent defense":"against your pressure");
    if(st.onsideMiss){ st.onsideMiss=false; res.note=(res.note?res.note+"; ":"")+"after recovering the onside kick" }

    // ---- a call the situation creates ----
    if(isUser&&calls()<MAX_CALLS){
      // asked at every stall, a made kick too: asked only after a miss, a punt or a failed try, every call was a
      // second chance (round 43)
      if((res.kind==="PUNT"||res.kind==="DOWNS"||res.kind==="MISS"||res.kind==="FG")&&(used.fourth||0)<4&&callMatters(q,mine-theirs)&&inReach(q,mine-theirs,home?eloH-eloA:eloA-eloH)){
        const dp=fourthDownCall(res.stall,res.togo||3,offE,defE);
        if(dp)dp.rolled=res.kind==="FG"||res.kind==="MISS"?"kick":res.kind==="DOWNS"?"go":"punt";
        if(dp&&dp.opts.some(o=>o[0]===dp.rolled)){
          used.fourth=(used.fourth||0)+1; called();
          st.stage="fourth"; st.pend={q:q,start:start,res:res,aggr:aggr};
          return {ask:dp,mine:mine,theirs:theirs,q:q,side:side};
        }
      }
      if(res.kind==="TD"&&(used.two||0)<2){
        const dp=twoPointCall(mine,theirs,q,late);
        if(dp){
          used.two=(used.two||0)+1; called();
          st.stage="two"; st.pend={q:q,start:start,res:res,aggr:aggr};
          if(home)st.h+=6; else st.a+=6;          // the touchdown is on the board while you decide
          return {ask:dp,mine:mine+6,theirs:theirs,q:q,side:side};
        }
      }
    }
    { const effT=st.endAfter!==undefined?Math.min(st.total,st.endAfter+1):st.total;
      const r2=endgameDrive(rng,res,mine-theirs,effT-i,offE,defE,smOf(home));
      if(r2.kind==="TD"&&r2.pts===7&&twoChart(mine+6-theirs,q>=4||effT-i<=8)){
        const ok=rng.r()<0.47; r2.pts=ok?8:6; r2.note=(r2.note?r2.note+"; ":"")+(ok?"went for two and got it":"went for two and was stopped") }
      return {drive:push(home,q,start,r2,aggr),h:st.h,a:st.a}; }
  };
  st.reply=function(v){ st.answer=v; };
  return st;
}

/* how much game is left, in the engine's own clock: possessions. "About 6 minutes" was a guess on top of it
   (Grokbot: late calls without the exact time); the drives left are exact. left counts this one. */
function possLeft(left,mineNext){
  const you=mineNext?Math.ceil(left/2):Math.floor(left/2), them=left-you;
  return `Possessions left: ${you} for you, ${them} for them.`;
}
const ONSIDE_P=(LEAGUE.tuning&&LEAGUE.tuning.onside)||0.12;   // about one in eight recovered, under today's kickoff rules
function onsideCall(diff,left){
  // left: possessions to go, theirs next. Kick deep and they get theirs; recover it and theirs is gone.
  const need=-diff<=3?"a field goal":-diff<=8?"a touchdown":"two scores", you=Math.floor(left/2);
  // round 93: with no possession left for you, a deep kick hands them the game (a tester: the advice said "one more stop")
  const ask=you===0?"Kick it deep and you won't see the ball again unless they give it away: the onside kick is the way back."
    :-diff>8&&you<2?"Kick it deep and you get one more possession for the two scores you need: the onside kick buys another."
    :"Kick it deep and make a stop, or try the onside kick?";
  return {k:"onside",h:`Down ${-diff} after your score`,
    b:`You need ${need}. ${ask} About one in eight is recovered; a miss hands them a short field. ${possLeft(left,false)}`,
    opts:[["onside","Onside kick"],["normal","Kick it deep, as your assistant would"]],left:left,diff:diff,you:you};
}
function defendCall(diff,left){
  // round 93: up 7 a touchdown ties it, up 8 it takes a touchdown and two (a tester: "only a touchdown beats a seven-point lead")
  const what=diff===0?"Any score beats you.":diff<=3?"A field goal "+(diff===3?"ties it":"beats you")+".":diff<=6?"Only a touchdown beats you.":diff===7?"Only a touchdown ties it.":"Only a touchdown and a two-point try tie it.";
  return {k:"defend",h:diff===0?"Tied, and they have the ball":`Up ${diff}, and they have the ball`,
    b:`${what} Prevent defense gives up yards and field goals to stop the big play; pressure takes the ball away more often and gives up more touchdowns. ${possLeft(left,false)}`,
    opts:[["prevent","Prevent: nothing deep"],["pressure","Bring pressure"],["normal","Play it straight, as your assistant would"]],left:left,diff:diff};
}

/* Is this a moment worth stopping the game for? */
const FB_LATE2=true;
function decisionPoint(state, isUser){
  if (!isUser) return null;
  const q=state.q, idx=state.idx, total=state.total, mine=state.mine,
        theirs=state.theirs, startYd=state.startYd, used=state.used;
  const late = idx >= Math.floor(total * 0.78);
  const veryLate = idx >= total - 7;
  const diff = mine - theirs;
  // roughly how long is left: drives come about evenly through the game (Grokbot: a late call showed the quarter, not the clock)
  // before the fourth it's the quarter's clock: "About 18 minutes left" at "end of the third" read as wrong (Grokbot;
  // it was 3 in the quarter plus the fourth)
  const left = Math.max(1, Math.round(60*(total-idx)/total)), inQ = Math.min(15, Math.max(1, left-(4-Math.min(4,q))*15)),
        clock = q>=4 ? " "+possLeft(total-idx,true) : ` About ${inQ} minute${inQ===1?"":"s"} left in the ${["first","second","third"][q-1]||"third"} quarter.`;

  // asked on your last possession, when what you need is known: a field
  // goal to win or tie, or nothing less than a touchdown
  const lastBall = idx >= total - 2;
  if (lastBall && diff < 0 && diff >= -8 && !used.chase) {
    return {
      k:"chase",
      h:`Down ${-diff}, last possession`,
      b:(-diff<=3 ? `A field goal ${-diff===3?"ties it":"wins it"}. Take what they give you, or go for the touchdown?`
                  : `Only a touchdown will do. Force it downfield, or work it and trust the clock?`)+clock,
      opts:[["push","Open it up"],["normal","Stay patient"]]
    };
  }
  // round 40: one-score finishes with the ball and no call (4 of 7 in pro football): level late is a real choice
  // (13.5 points a call in pro football, 12.5 in college)
  if (FB_LATE2 && veryLate && diff === 0 && !used.tied) {
    return { k:"tied", h:q>=4?"Tied late":"Tied in the third",
      b:`Go for the win, or play it safe and don't hand it to them?`+clock,
      opts:[["push","Go for the win: attack downfield"],["sit","Play it safe: run it, protect the ball"],["normal","Leave it to your assistant"]] };
  }
  // cut (round 40): "hurry-up now?" behind with two or three possessions left moved about 4 points, over half the calls under 3
  if (veryLate && diff > 0 && diff <= 10 && !used.protect) {   // up 12 to 14 the choice moved nothing (test/call-weight.js, Nov 2026)
    return {
      k:"protect",
      h: q>=4?`Up ${diff} late`:`Up ${diff} in the third`,   // it can come in the third (Grokbot: "up 4 late" in Q3)
      b:`Sit on it and shorten the game, or keep the throttle down.`+clock,
      opts:[["sit","Bleed the clock"],["keep","Keep attacking"]]
    };
  }
  // two scores either way at the break, but not three: up 24 at half, "manage it" was asked and
  // changed nothing (Grokbot; Instinct: "comfortable-lead busywork")
  // cut (round 33): asked only at two scores or more, where it never moved anything (0 to 1.3 points a call, 100%
  // either way in every measured case); the close games' half-time is the fourth downs' and the late calls' job
  if (false && q === 3 && idx === Math.floor(total/2) && Math.abs(diff) >= 14 && callMatters(q,diff) && !used.half) {
    return {
      k:"half",
      h: diff < 0 ? `Down ${-diff} at the break` : `Up ${diff} at the break`,
      b: diff < 0 ? `You need something different in the second half.`
                  : `You can put your foot down or start managing this.`,
      opts: diff < 0 ? [["push","Take more risks"],["normal","Stick with it"]]
                     : [["sit","Manage it"],["normal","Keep going"]]
    };
  }
  return null;
}


