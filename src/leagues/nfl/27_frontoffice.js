/* ============ the front office: pro football (Nov 2026) ============ */
/* Running a club the way a real front office does. Each part is switched on by the universe's front-office version
   (u.foV), so a career saved before it plays on exactly as it was until its next offseason:
     - new careers get it at once (LEAGUE.onNewUniverse);
     - an older career gets it when its next offseason opens (S.off.picks.fo), and keeps it from then on (nflRun sets
       u.foV once the summer has run).
   1. the draft board: computer clubs take the best player on a sensible board, talent first and need as a tiebreaker,
      through the fog of their own scouting (a hard-to-read prospect is judged as what he's likely to be, not as the
      luckiest guess about him). */
const FO_V=1;
const FO_ENV=(k,d)=>{ const v=typeof process!=="undefined"&&process.env?process.env[k]:undefined; return typeof v==="string"&&v!==""&&isFinite(+v)?+v:d };
const FO_MOCK=FO_ENV("FO_MOCK",1.07);   // the mock's spread on top of the clubs' own error (test/draft-labels.js holds the bands)
function foOn(u){ return !!(u&&u.foV>=FO_V)||!!(typeof S!=="undefined"&&S&&S.off&&S.off.picks&&S.off.picks.fo>=FO_V&&u===(typeof U!=="undefined"?U:null)) }
LEAGUE.onNewUniverse=function(u){ u.foV=FO_V };

/* ---- 1. the draft board ---- */
/* A prospect's worth on the staff's scale: now, plus 0.45 of the way to his ceiling. */
const foWorth=p=>p.r+(p.pot-p.r)*0.45;
/* need breaks ties: what he adds to the roster as it stands (nflGain, weighted by the position's share of the team),
   held to a few points of worth, so a club never takes a much worse player for a hole */
const FO_NEED={bpa:[0.25,2.5], need:[0.6,5], upside:[0.15,1.5]};
function foNeed(style,R,p){ const k=FO_NEED[style]||FO_NEED.bpa; return Math.min(k[1],Math.max(0,nflGain(R,p))*k[0]) }
function foScore(style,R,p){ const w=style==="upside"?p.r*0.35+p.pot*0.65:foWorth(p); return w+foNeed(style,R,p) }
/* the class's worth, as every scouting department knows it from years of drafts: its mean and spread (not saved) */
function foPrior(u){ const C=u&&u.draftClass; if(!C||!C.list||!C.list.length)return {m:58,v:30};
  if(C._foPrior)return C._foPrior; const L=C.list.map(foWorth), n=L.length, m=L.reduce((a,b)=>a+b,0)/n, v=L.reduce((a,b)=>a+(b-m)*(b-m),0)/n;
  Object.defineProperty(C,"_foPrior",{value:{m:m,v:Math.max(1,v)},enumerable:false,configurable:true}); return C._foPrior }
LEAGUE.offseason.draftBoard=function(u){
  if(!foOn(u))return null;
  const P=foPrior(u);
  return {
    score:foScore,
    /* a computer club: the truth plus its scouts' error (sd its spread), read back toward the class as far as a read that
       noisy can be trusted; the same shift to now and ceiling, so the need it fills is judged on the same read */
    cpu(style,R,p,e,sd){ const W=foWorth(p), k=P.v/(P.v+sd*sd), post=P.m+(W+e-P.m)*k, d=post-W;
      return foScore(style,R,Object.assign({},p,{r:p.r+d,pot:p.pot+d})) },
    /* the mock draft (the "likely gone" labels): what that club's pick looks like from your reads (p: your read, p.pv
       what's still unknown about him): the mean of its score, and its spread */
    mock(R,p,sd){ const k=P.v/(P.v+sd*sd), W=foWorth(p);
      return [P.m+(W-P.m)*k+foNeed("bpa",R,p), FO_MOCK*k*Math.sqrt((p.pv||0)+sd*sd)] }
  };
};

/* ---- 2. the real cap, and real contracts ----
   The 2026 cap is $301.2M (ESPN, Feb 27 2026). The sim tracks twenty players a club; the rest of the 53 and the practice
   squad are one line, FO_DEPTH, so a club's payroll is its twenty plus that line, plus any dead money, against the cap.
   A contract (k, version 2): yrs left (this season included), sal = the cap hit (flat: base + the prorated signing
   bonus), pb = the prorated bonus a year, g = guaranteed base still to be paid, sb/gt/tot = signing bonus, guarantees and
   total when signed. Releasing a player costs pb x years left + g in dead money, all on the coming season's cap. Cash
   in a signing year is the base plus the whole signing bonus. Rookie deals follow the slot (CBS, 2026: #1 $57.27M over
   four years with a $38.11M bonus, #32 $16.78M with $8.69M); first-rounders carry a fifth-year option; one franchise tag
   a club a year, at the position's 2026 tender. Old careers convert when their next offseason opens (foMigrate). */
const FO_CAP=301.2, FO_MIN=0.885, FO_DEPTH=62, FO_MAX=60;
// the market's top at each spot, a little above the franchise tender (the five highest cap hits' average): ESPN gives
// the 2026 tenders for QB (43.9) and WR (27.3); the rest are SI's 2026 projections. FO_TAG is the tender itself.
const FO_TAG={QB:43.9,RB:14.5,WR:27.3,WR2:27.3,OT:27.9,EDGE:27.3,DT:26.3,LB:28.2,CB:21.4,S:20.9,K:6.9,P:6.9};
const FO_TOP={QB:55,RB:16,WR:33,WR2:30,OT:31,EDGE:33,DT:29,LB:21,CB:25,S:21,K:6,P:4};
const FO_PAY=FO_ENV("FO_PAY",1.0);
let FO_U=null;                                       // the universe an offseason run is working on (else the open game's)
function foU(){ return FO_U||(typeof U!=="undefined"?U:null) }
function foNew(u){ u=u||foU(); return !!(u&&u.capV>=1) }
/* money on the old scale (a career not yet converted) and the new: a figure in the old $110M world times this */
function foK(u){ return foNew(u)?(FO_CAP-FO_DEPTH)/110:1 }
function foAsk(r,pos,age){
  const x=Math.max(0,Math.min(1.1,(r-50)/30)), top=FO_TOP[pos]||20;
  let s=FO_MIN+(top-FO_MIN)*Math.pow(x,1.8)*FO_PAY;
  const a=age-(AGE_SHIFT[pos]||0);
  if(a>=31)s*=0.78; else if(a>=29)s*=0.9;
  return Math.round(Math.max(FO_MIN,Math.min(FO_MAX,s))*10)/10;
}
/* how a deal is built: a better player gets more of it up front and guaranteed */
function foQual(r){ return Math.max(0,Math.min(1,(r-55)/25)) }
const FO_DEALS={ask:{y:0,m:1,g:0,l:"Their ask"}, short:{y:-1,m:1.07,g:0,l:"Fewer years, more a year"},
  long:{y:+1,m:0.95,g:0,l:"More years, less a year"}, gtd:{y:0,m:0.92,g:0.22,l:"More guaranteed, less a year"}};
function foContract(aav,yrs,r,kind,year){
  const D=FO_DEALS[kind]||FO_DEALS.ask; yrs=Math.max(1,Math.min(5,yrs+D.y)); aav=Math.round(Math.max(FO_MIN,aav*D.m)*10)/10;   // (the ask is capped already: foAsk)
  const q=foQual(r), tot=aav*yrs, sb=yrs>1?tot*(0.12+0.3*q):0, gt=Math.min(tot,Math.max(sb,tot*Math.min(0.9,0.12+0.5*q+D.g)));
  const r1=x=>Math.round(x*100)/100;
  return {v:2,sal:aav,yrs:yrs,aav:aav,pb:r1(sb/yrs),g:r1(gt-sb),sb:r1(sb),gt:r1(gt),tot:r1(tot),y0:year,deal:kind||"ask"};
}
function foMinDeal(year){ return {v:2,sal:FO_MIN,yrs:1,aav:FO_MIN,pb:0,g:0,sb:0,gt:0,tot:FO_MIN,y0:year} }
/* the rookie scale by overall pick: four years, the bonus and guarantees falling with the slot */
function foRookieTot(o){ return o<=32?57.27*Math.pow(16.78/57.27,(o-1)/31):4.2+(16.78-4.2)*Math.exp(-(o-32)/30) }
function foRookie(o,year){ const tot=foRookieTot(o), sbS=o<=32?0.666-(0.666-0.518)*(o-1)/31:Math.max(0.08,0.45*Math.exp(-(o-32)/40)),
  sb=tot*sbS, gt=o<=32?tot:o<=64?sb+(tot-sb)*0.4:sb, aav=Math.round(tot/4*10)/10, r1=x=>Math.round(x*100)/100;
  return {v:2,sal:aav,yrs:4,aav:aav,pb:r1(sb/4),g:r1(gt-sb),sb:r1(sb),gt:r1(gt),tot:r1(tot),y0:year,rk:o} }
function foTagVal(p){ return Math.max(FO_TAG[p.p]||20,Math.round(((p.k&&p.k.sal)||0)*1.2*10)/10) }
function foTagDeal(p,year){ const t=foTagVal(p); return {v:2,sal:t,yrs:1,aav:t,pb:0,g:t,sb:0,gt:t,tot:t,y0:year,tag:1} }
/* the fifth-year option (basic tier, a model figure: about 62% of the position's tender), fully guaranteed */
function foOptSal(p){ return Math.round(Math.max((p.k&&p.k.aav)||0,(FO_TAG[p.p]||20)*0.62)*10)/10 }
const foOptAble=p=>!!(p&&p.k&&p.k.v===2&&p.k.rk&&p.k.rk<=32&&!p.k.opt&&!p.k.optYr&&p.k.yrs===2);
function foDeadOf(p){ const k=p&&p.k; if(!k||k.v!==2)return 0; return Math.round(((k.pb||0)*(k.yrs||0)+(k.g||0))*10)/10 }
/* a season passes on a contract: the year's guaranteed base is paid, the option year comes in */
function foAgeDeal(k){ if(!k||k.v!==2)return; k.g=Math.max(0,Math.round(((k.g||0)-Math.max(0,k.aav-(k.pb||0)))*100)/100);
  if(k.opt&&k.yrs===1){ k.sal=k.aav=k.opt; k.g=k.opt; k.pb=0; delete k.opt; k.optYr=1 } }
/* dead money on a club's cap: {y: the season it counts in, t: {club: $M}} */
function foDead(u,t){ const D=u&&u.dead; return D&&D.t&&D.y===u.year?(D.t[t]||0):0 }
function foDeadNext(u,t){ const D=u&&u.dead; return D&&D.t&&D.y===u.year+1?(D.t[t]||0):0 }   // in the offseason: the season ahead
const FO_ROOKIE_ROOM=16;   // what a seven-pick class costs in its first year, about (re-signing leaves this free)
/* releases are found by who is gone: each player under contract for the season ahead, as the summer's contracts are set,
   with what cutting him would leave; anyone gone from his club who wasn't traded or retired was let go (foSettle) */
let FO_SNAP=null;
function foSnapStart(u){ FO_SNAP=new Map() }
function foSnap(u,t,R){ if(!FO_SNAP)return; R.forEach(p=>{ if(p&&p.k&&p.k.v===2&&!FO_SNAP.has(p))FO_SNAP.set(p,t) }) }
function foSettle(u){ if(!FO_SNAP)return; FO_SNAP.forEach((t,p)=>{ if(p._dc||p._tr||p._ret||(u.roster[t]||[]).indexOf(p)>=0)return;
  foAddDead(u,t,foDeadOf(p)); p._dc=1 }) }
function foSettleEnd(u){ if(FO_SNAP)FO_SNAP.forEach((t,p)=>{ delete p._dc; delete p._tr; delete p._ret }); FO_SNAP=null }
/* the computer's franchise tag: its best expiring player it isn't keeping, if he's a real starter and the tender fits */
function foCpuTag(u,t,R,plan){ let bi=null;
  R.forEach((p,i)=>{ if(!p||p.k.yrs>1||plan[i]||i>=POS.length||p.age>=31||p.r<73)return; if(bi===null||p.r>R[bi].r)bi=i });
  if(bi===null)return null; const pay=R.reduce((s,p,i)=>s+(p&&(p.k.yrs>1||plan[i])?p.k.sal:0),0)+FO_DEPTH;
  return pay+foTagVal(R[bi])<=FO_CAP-FO_ROOKIE_ROOM?bi:null }
function foAddDead(u,t,amt){ if(!(amt>0))return; if(!u.dead||u.dead.y!==u.year+1)u.dead={y:u.year+1,t:{}}; u.dead.t[t]=Math.round(((u.dead.t[t]||0)+amt)*10)/10 }
/* convert a career's contracts (no dice: a player's deal from his rating, age and years left), then fit every club */
function foMigrate(u){
  if(!u||u.capV>=1)return; u.capV=1; u.dead={y:u.year,t:{}};
  NAMES.forEach(t=>{ const R=u.roster[t]; if(!R)return;
    R.forEach(p=>{ if(!p||!p.k)return; const yrs=Math.max(1,p.k.yrs||1);
      const o=p.draft&&p.draft.overall, rook=o&&p.draft.year!=null&&u.year-p.draft.year<4;
      p.k=rook?Object.assign(foRookie(o,p.draft.year+1),{yrs:yrs}):foContract(foAsk(p.r,p.p,p.age),yrs,p.r,"ask",u.year) });
    const pay=R.reduce((s,p)=>s+(p&&p.k?p.k.sal:0),0)+FO_DEPTH, lim=FO_CAP*0.97;
    if(pay>lim){ const f=(lim-FO_DEPTH)/(pay-FO_DEPTH); R.forEach(p=>{ if(!p||!p.k)return; const k=p.k, s=x=>Math.round(x*f*100)/100;
      k.sal=k.aav=Math.max(FO_MIN,Math.round(k.sal*f*10)/10); k.pb=s(k.pb); k.g=s(k.g); k.sb=s(k.sb); k.gt=s(k.gt); k.tot=s(k.tot) }) } });
}
{ const nu0=LEAGUE.onNewUniverse; LEAGUE.onNewUniverse=function(u){ nu0(u); foMigrate(u) } }
LEAGUE.afterRebuild=function(u){ if(foOn(u))foMigrate(u) };   // an older career, in an offseason it opened on this build
/* the cap the core reads (the team card, in-season trades); in-season trades check the twenty against the room the rest
   of the roster leaves (taxLine) */
Object.defineProperty(LEAGUE,"cap",{configurable:true,enumerable:true,get(){ return foNew()?FO_CAP:NFL_CAP }});
Object.defineProperty(LEAGUE,"taxLine",{configurable:true,enumerable:true,get(){ return foNew()?FO_CAP-FO_DEPTH:undefined }});
/* the money line on a contract, in words */
function foDealLine(k){ if(!k)return ""; if(k.v!==2)return "$"+(+k.sal).toFixed(1)+"M, "+k.yrs+" yr"+(k.yrs===1?"":"s")+" left";
  const bits=["$"+k.sal.toFixed(1)+"M cap hit", k.yrs+" yr"+(k.yrs===1?"":"s")+" left"];
  if(k.tag)bits.push("franchise tag, guaranteed"); else if(k.optYr)bits.push("fifth-year option, guaranteed");
  else{ const dg=Math.round((k.pb*k.yrs+k.g)*10)/10; if(dg>0.05)bits.push("$"+dg.toFixed(1)+"M dead if cut"); if(k.rk)bits.push("rookie deal (#"+k.rk+")"); if(k.opt)bits.push("option picked up") }
  return bits.join(" &middot; ") }

/* ---- switching it on ---- */
{ const open0=LEAGUE.offseason.open, ch0=LEAGUE.offseason.choices, run0=LEAGUE.offseason.run;
  // an older career gets the front office from this offseason: its contracts convert before the screen's asks are made
  LEAGUE.offseason.open=function(u,t,w){ foMigrate(u); const o=open0.call(this,u,t,w); o.picks.fo=FO_V; o.picks.deal={}; o.picks.tag=null;
    o.picks.opt=foOptPlan(u.roster[t]); return o };
  LEAGUE.offseason.choices=function(P){ const c=ch0.call(this,P); if(P&&P.fo){ c.fo=P.fo; c.deal=P.deal||{}; c.tag=P.tag!=null?P.tag:null; c.opt=P.opt||{} } return c };
  LEAGUE.offseason.run=function(u,rng,healthy,elo,rec,choices){ const on=foOn(u)||!!(choices&&choices.fo);
    if(on)foMigrate(u); const was=FO_U; FO_U=u;
    try{ const out=run0.call(this,u,rng,healthy,elo,rec,choices); if(on)u.foV=FO_V; return out }finally{ FO_U=was } } }
/* the staff's call on each first-rounder's fifth-year option: picked up for a starter-quality player */
function foOptPlan(R){ const o={}; (R||[]).forEach((p,i)=>{ if(foOptAble(p))o[i]=p.r>=67||p.pot>=74 }); return o }
