/* round 83: trades in the season (Ian: "in-season trades and offers, with deadlines and caps: make an offer, ask what
   they'd want"). The five pro games: football, basketball, hockey and baseball until the league's deadline, soccer in
   the January window. One of yours for one of theirs at the same position (a starter or a backup, either side), so
   both rosters stay whole. A club answers from the deal alone, with no dice: asking twice gets the same answer.

   What a club wants: how much stronger the deal makes it now and in two years (its own roster, rated now and as its
   players will be: the young toward their ceiling, the old past 29 losing a step), weighed by where it stands. A
   contender wants now; a club out of it wants later. It takes the deal when that is worth a little more than it gives
   (TD_PREM), you don't come out ahead now and later together, it fits under the cap, and it hasn't traded with you in the last TD_GAP days. Injured men aren't traded.

   A trade is kept with its day among the promotions (S.promos), as a promotion is: a reload plays it at the same point. Each man takes the
   other's slot and the better of the two at that spot starts. Both clubs' strength moves by what the sim reads (the
   change in rosterElo). At the season's end the trade is put into next season's rosters too (tdCarry), and a man's
   season goes into his career with the club he finished with. The computer's clubs don't trade with each other yet,
  , so nothing changes for a season with no trades in it. In a shared seat each coach trades for his own club; a reload replays every coach's moves in turn order (round 84). */
const TD_PREM=2;                // elo: what a club wants over even before it says yes
const TD_SPREAD=0.3;          // how far a contender (0.55+) and a club out of it (0.55-) lean to now or later
/* round 84, measured: a coach going all in for now (the best deal for now each day, two for two included, to the
   deadline) gained hockey +9.1 team rating (clubs' spread, one standard deviation: 3.5), basketball +7.0 (3.3),
   baseball +5.1 (1.7), football +4.2 (2.7): a mid club past the league's best in one season. Two dials, measured:
   - a premium in proportion to the strength a club gives up now (TD_PROP): a big deal costs more than a small one
   - three trades a season (TD_MAX): the deadline market isn't deep; most of the gain came in the first two or three
   With both: hockey +5.5 (for -20.8 in two years), basketball +5.3 (-17.4), football +3.9 (-13.4), baseball +2.4
   (-4.0), soccer +1.3 (-14.9). How the clubs lean (TD_SPREAD 0.15 or 0.3) made no difference: deals come early. */
const TD_PROP=1;
const TD_MAX=3;
const TD_GAP=7;                 // steps between two trades with the same club (a week of football is one step)
const TD_MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function tdDay(s){ const D=LEAGUE.dates||[], m0=TD_MON.indexOf(String(D[0]||"Jan 1").split(" ")[0]); const [m,d]=String(s||"").split(" ");
  return ((TD_MON.indexOf(m)-m0+12)%12)*31+(+d||0) }
// open now? and the line that says when it closes (or opened, or opens)
function tdState(){
  const T=LEAGUE.trade; if(!T||!SEA||!SEA.roster)return {open:false,why:""};
  if(SEA.phase!=="week")return {open:false,why:"Trades are closed until next season."};
  if(SEA.half)return {open:false,why:"Not in the middle of a cup week: after its second game."};
  const today=(LEAGUE.dates||[])[SEA.step]||"";
  if(T.window){ const m=today.split(" ")[0]; if(T.window.indexOf(m)>=0)return tdTrades().length>=TD_MAX?{open:false,why:`You've made ${TD_MAX} deals this window, the most a club makes.`}:{open:true,why:`The January window: open until ${T.shut}.`};
    return {open:false,why:tdDay(today)<tdDay(T.window[0]+" 1")?"The transfer window opens in January.":"The January window has shut."} }
  if(tdDay(today)>tdDay(T.by))return {open:false,why:`The trade deadline (${T.by}) has passed.`};
  if(tdTrades().length>=TD_MAX)return {open:false,why:`You've made ${TD_MAX} trades this season, the most a club makes.`};
  return {open:true,why:`The trade deadline is ${T.by}.`};
}
const tdGrp=i=>POS[i%POS.length].p.replace(/\d+$/,"");      // baseball's SP, SP2 and SP3 are all starters
function tdHurt(t,i){ return SEA.talent.active(t).some(e=>e.idx===i) }
// a man whose deal ends this season counts for 40% of himself in two years (he may re-sign; he may not: a rental); 80%
// at 26 or younger (round 85: a rebuilding club had sold a 63-rated 23-year-old for a 53-rated 31-year-old)
function tdFut(p){ const a=p.age||27, young=Math.max(0,27-a)/5;
  const f=Math.max(30,p.r+(p.pot!=null&&p.pot>p.r?(p.pot-p.r)*0.5*young:0)-Math.max(0,a-29)*1.5);
  return p.k&&p.k.yrs<=1?f*(a<=26?0.8:0.4):f }   // a young man re-signs more often than not (round 85)
// a club's own reading of a roster: the starters, and a little for the man behind each (in case)
function tdVal(R,fut){ let s=0; POS.forEach((P,i)=>{ const v=x=>x?(fut?tdFut(x):x.r):0, x=v(R[i]), y=v(R[BK(i)]); s+=P.w*(0.88*Math.max(x,y)+0.12*Math.min(x,y)) }); return ratingToElo(s) }   // the better of the two starts (in two years too)
// where a club stands: 1 is a contender, 0 out of it (the share of the season gone tempers it early)
function tdWin(t){
  const rec=SEA.rec||{}, pct=x=>{ const r=rec[x]||[0,0]; return ((r[0]||0)+5)/((r[0]||0)+(r[1]||0)+10) };
  const peers=NAMES.filter(x=>CONF[x]===CONF[t]||!LEAGUE.trade.sameDiv), mine=pct(t), rank=peers.filter(x=>pct(x)>mine).length/Math.max(1,peers.length-1);
  const gone=Math.min(1,SEA.step/Math.max(1,(LEAGUE.dates||[]).length*0.5));
  return 0.55+(rank<0.35?TD_SPREAD:rank>0.65?-TD_SPREAD:0)*gone }
// the two rosters after the swap: each man in the other's slot, the better of the two at that spot starting
function tdAfter(R,i,p){ const X=R.slice(); X[i]=p; const s=i%POS.length, b=BK(s); if(X[s]&&X[b]&&X[b].r>X[s].r){ const t=X[s]; X[s]=X[b]; X[b]=t } return X }
function tdPay(R){ return R.reduce((s,p)=>s+(p&&p.k&&p.k.sal||0),0) }
// the deal from both sides: a = my slot, b = their slot
// round 84: two for two, a pair at each of two positions (a2, b2): a guard and a forward for a forward and a guard, or
// two good men for a star and a throw-in. Both rosters stay whole (no call-ups, no one released mid-season).
function tdDeal(t,a,b,a2,b2,pk){
  const my=S.myTeam, M=SEA.roster[my], T=SEA.roster[t], give=M[a], get=T[b], two=a2!=null&&b2!=null;
  if(pk&&!tdPickHeld(pk==="mine"?my:t))return null;
  if(!give||!get||tdGrp(a)!==tdGrp(b))return null;
  if(two&&(!M[a2]||!T[b2]||tdGrp(a2)!==tdGrp(b2)||tdGrp(a2)===tdGrp(a)))return null;
  let M2=tdAfter(M,a,get), T2=tdAfter(T,b,give); const w=tdWin(t);
  if(two){ M2=tdAfter(M2,a2,T[b2]); T2=tdAfter(T2,b2,M[a2]) }
  // a first-round pick (round 86): two years on, the man it brings, at the slot the club's record says it will be
  const pkT=pk?(pk==="mine"?1:-1)*tdPickVal(t,pk==="mine"?my:t,T2):0, pkM=pk?(pk==="mine"?-1:1)*tdPickVal(my,pk==="mine"?my:t,M2):0;
  const dNow=tdVal(T2,false)-tdVal(T,false), score=w*dNow+(1-w)*(tdVal(T2,true)-tdVal(T,true)+pkT)-TD_PROP*Math.max(0,-dNow);
  const cap=LEAGUE.taxLine||LEAGUE.cap, over=cap?[[M,M2],[T,T2]].some(([x,y])=>tdPay(y)>cap&&tdPay(y)>tdPay(x)):false;
  const now=teamRating(M2)-teamRating(M), fut=(tdVal(M2,true)-tdVal(M,true)+pkM)/R_SLOPE;
  // and it won't give you more than you give, now and in two years counted together: it will swap one for the other
  // when that suits where it stands, never both (measured: without this a coach who took the best deal every day
  // gained in both, 16 trades for +4.3 now and +10.7 in two years in basketball, buying now from clubs out of it and
  // selling it dear to contenders)
  const fair=now+fut<=-0.01;
  const d={t:t,a:a,b:b,give:give,get:get,score:score,yes:score>=TD_PREM&&!over&&fair,over:over,fair:fair,w:w,now:now,fut:fut};
  if(two)Object.assign(d,{a2:a2,b2:b2,give2:M[a2],get2:T[b2]});
  if(pk)Object.assign(d,{pk:pk,pkSlot:tdPickSlot(pk==="mine"?my:t)});
  return d
}
// kept among the promotions (S.promos), so a reload replays a trade and a promotion on one day in the order they were made
const tdLog=(P)=>{ const L=P||S.promos||{}, o={}; Object.keys(L).forEach(k=>{ const v=L[k].filter(x=>x&&x.tr).map(x=>x.tr); if(v.length)o[k]=v }); return o };
function tdRecent(t){ const L=tdLog(); return Object.keys(L).some(k=>SEA.step-(+k)<TD_GAP&&L[k].some(x=>x.t===t)) }
function tdClubs(){ const my=S.myTeam, H=typeof nflHumans==="function"?nflHumans():[my];
  return NAMES.filter(t=>t!==my&&H.indexOf(t)<0&&SEA.roster[t]&&(!LEAGUE.trade.sameDiv||CONF[t]===CONF[my])) }
// what each club would give for one of mine: its best man at the spot that it would part with, the one that helps me most
function tdOffers(a){
  const my=S.myTeam; if(tdHurt(my,a))return [];
  const out=[]; tdClubs().forEach(t=>{ if(tdRecent(t))return; let best=null;
    SEA.roster[t].forEach((q,b)=>{ if(!q||tdGrp(b)!==tdGrp(a)||tdHurt(t,b))return; const d=tdDeal(t,a,b); if(d&&d.yes&&(d.now>0||d.fut>0)&&(!best||d.now>best.now||(d.now===best.now&&d.fut>best.fut)))best=d });
    if(best)out.push(best) });
  return out.sort((x,y)=>y.now-x.now||y.fut-x.fut).slice(0,5) }
// with a first-round pick on top (round 86): theirs with the man they give (shop), yours with the man you give (ask)
function tdShopPick(a){ if(!tdHasDraft()||tdHurt(S.myTeam,a))return []; const out=[];
  tdClubs().forEach(t=>{ if(tdRecent(t)||!tdPickHeld(t))return; let best=null; SEA.roster[t].forEach((q,b)=>{ if(!q||tdGrp(b)!==tdGrp(a)||tdHurt(t,b))return; const d=tdDeal(t,a,b,null,null,"theirs"); if(d&&d.yes&&(!best||d.now+d.fut>best.now+best.fut))best=d }); if(best)out.push(best) });
  return out.sort((x,y)=>(y.now+y.fut)-(x.now+x.fut)).slice(0,3) }
function tdAskPick(t,b){ if(!tdHasDraft()||tdRecent(t)||tdHurt(t,b)||!tdPickHeld(S.myTeam))return []; const out=[];
  SEA.roster[S.myTeam].forEach((p,a)=>{ if(!p||tdGrp(a)!==tdGrp(b)||tdHurt(S.myTeam,a))return; const d=tdDeal(t,a,b,null,null,"mine"); if(d&&d.yes)out.push(d) });
  return out.sort((x,y)=>(y.now+y.fut)-(x.now+x.fut)).slice(0,3) }
// who of mine a club would take for one of theirs
function tdAsk(t,b){
  const my=S.myTeam; if(tdHurt(t,b))return {hurt:true,list:[]}; if(tdRecent(t))return {recent:true,list:[]};
  const list=[]; SEA.roster[my].forEach((p,a)=>{ if(!p||tdGrp(a)!==tdGrp(b)||tdHurt(my,a))return; const d=tdDeal(t,a,b); if(d&&d.yes)list.push(d) });
  return {list:list.sort((x,y)=>y.now-x.now||y.fut-x.fut)} }
/* review round (playtest, pro basketball: asking about a player said only "Nobody of yours at his position would get
   him"): who of yours comes closest, and what stands in the way, in the deal's own terms (words only: the trade model
   is untouched). A club wants more than an even swap, values now or two years ahead by where it stands, keeps under
   the cap, and won't give you more than you give. */
function tdAskWhy(t,b){ try{ const my=S.myTeam, M=SEA.roster[my];
    const D=M.map((p,a)=>p&&tdGrp(a)===tdGrp(b)&&!tdHurt(my,a)?tdDeal(t,a,b):null).filter(Boolean);
    if(!D.length)return " You have nobody healthy at his position to offer.";
    const w=tdWin(t), want=w>0.6?"they're contending and want more help now":w<0.4?"they're building and want more for the years ahead":"they want more, now or in two years";
    const fit=D.filter(d=>!d.over&&d.fair), unfair=D.filter(d=>!d.over&&!d.fair), cap=D.filter(d=>d.over);
    if(fit.length){ const d=fit.sort((x,y)=>y.score-x.score)[0];
      return ` Closest: ${tdPl(my,d.give,d.a)}, and it isn't enough: ${want}. A second player or a first-round pick can sometimes bridge it.` }
    if(unfair.length){ const d=unfair.sort((x,y)=>(x.now+x.fut)-(y.now+y.fut))[0];
      return ` They'd take ${tdPl(my,d.give,d.a)}, but no club gives more than it gets: that swap would leave you better off now and in two years together.` }
    if(cap.length)return ` Every swap would put one of you over the ${LEAGUE.taxLine?"tax line":"cap"}.`;
    return "" }catch(e){ return "" } }
// carry a trade out: on the season's rosters (also as a reload replays it)
// two for two around one man: yours at a (shop) or theirs at b (ask); the second pair at any other position
function tdPackages(t,a,b){
  const my=S.myTeam, M=SEA.roster[my], T=SEA.roster[t], out=[];
  const As=a!=null?[a]:M.map((p,i)=>i).filter(i=>M[i]&&(b==null||tdGrp(i)===tdGrp(b))&&!tdHurt(my,i));
  const Bs=a1=>b!=null?[b]:T.map((p,i)=>i).filter(i=>T[i]&&tdGrp(i)===tdGrp(a1)&&!tdHurt(t,i));   // both open: every pair (the fleece)
  As.forEach(a1=>Bs(a1).forEach(b1=>M.forEach((p,a2)=>{ if(!p||tdGrp(a2)===tdGrp(a1)||tdHurt(my,a2))return;
    if(a==null&&b==null&&a2<a1)return;
    T.forEach((q,b2)=>{ if(!q||tdGrp(b2)!==tdGrp(a2)||tdHurt(t,b2))return; const d=tdDeal(t,a1,b1,a2,b2); if(d&&d.yes)out.push(d) }) })));
  return out }
// the best of those for you: a package that helps you now or later, one a club, the three best
function tdShopTwo(a){ const out=[]; tdClubs().forEach(t=>{ if(tdRecent(t))return; let best=null;
    tdPackages(t,a,null).forEach(d=>{ if((d.now>0||d.fut>0)&&(!best||d.now+d.fut>best.now+best.fut))best=d }); if(best)out.push(best) });
  return out.sort((x,y)=>(y.now+y.fut)-(x.now+x.fut)).slice(0,3) }
function tdAskTwo(t,b){ if(tdRecent(t)||tdHurt(t,b))return []; return tdPackages(t,null,b).sort((x,y)=>(y.now+y.fut)-(x.now+x.fut)).slice(0,3) }
const tdGo=d=>`${esc(d.t)}|${d.a}|${d.b}`+(d.give2?`|${d.a2}|${d.b2}`:"||")+(d.pk?`|${d.pk}`:"");
function tdApply(sea,x){
  const my=x.my||S.myTeam, M=sea.roster[my], T=sea.roster[x.t]; if(!M||!T)return false;
  const find=(R,i,n)=>R[i]&&R[i].n===n?i:R.findIndex(p=>p&&p.n===n);
  const pairs=[[find(M,x.a,x.gn),find(T,x.b,x.qn)]]; if(x.gn2)pairs.push([find(M,x.a2,x.gn2),find(T,x.b2,x.qn2)]);
  if(pairs.some(([a,b])=>a<0||b<0))return false;
  const e0=rosterElo(M), f0=rosterElo(T);
  pairs.forEach(([a,b])=>{ const give=M[a], get=T[b];
    [[M,a,get,my],[T,b,give,x.t]].forEach(([R,i,p,tm])=>{ R[i]=p; const s=i%POS.length, k=BK(s); if(R[s]&&R[k]&&R[k].r>R[s].r){ const z=R[s]; R[s]=R[k]; R[k]=z;
      (sea.talent.inj[tm]||[]).forEach(e=>{ if(e.idx===s)e.idx=k; else if(e.idx===k)e.idx=s }) } });   // an injury goes with the man, not the slot
    get.tdFrom=x.t; give.tdFrom=my });
  sea.talent.base[my]+=rosterElo(M)-e0; sea.talent.base[x.t]+=rosterElo(T)-f0;
  return true }
function tdDo(d){
  S.promos=S.promos||{}; const k=SEA.step, x={t:d.t,a:d.a,b:d.b,gn:d.give.n,qn:d.get.n,my:S.myTeam,y:SEA.year,d:(LEAGUE.dates||[])[k]||""};
  if(d.give2)Object.assign(x,{a2:d.a2,b2:d.b2,gn2:d.give2.n,qn2:d.get2.n});
  if(d.pk)x.pk=d.pk;
  if(!tdApply(SEA,x))return; (S.promos[k]=S.promos[k]||[]).push({tr:x});
  TD_UI={done:x}; save(); render() }
// at the season's end, into the universe's rosters (next season's): the same two men, found by name
function tdCarry(u){
  // once a season (round 85: at the season's end, on a reload, at the summer's commit); kept off the save (not enumerable)
  if(u._tdc===SEA.year)return; Object.defineProperty(u,"_tdc",{value:SEA.year,writable:true,configurable:true,enumerable:false});
  const own={}; tdAllTrades().forEach(x=>{ if(x.pk){ const g=x.pk==="mine"?(x.my||S.myTeam):x.t; own[g]=g===x.t?(x.my||S.myTeam):x.t } });
  if(Object.keys(own).length)u.pickOwn={y:SEA.year,own:own};   // round 86: whose first-round pick each club holds, for the summer's draft
  const L={}; coachMoves().forEach(([tm,P])=>{ const o=tdLog(P||{}); Object.keys(o).forEach(k=>(L[k]=L[k]||[]).push(...o[k])) });   // every coach's (round 84)
  ((SEA&&SEA.cpuTr)||[]).forEach(x=>(L[x.step]=L[x.step]||[]).push(x));   // and the computer's clubs' (round 85), after yours on deadline day
  Object.keys(L).sort((a,b)=>a-b).forEach(k=>L[k].forEach(x=>{ if(x.y!==undefined&&x.y!==SEA.year)return;
    const my=x.my||S.myTeam, M=u.roster[my], T=u.roster[x.t]; if(!M||!T)return;
    [[x.gn,x.qn]].concat(x.gn2?[[x.gn2,x.qn2]]:[]).forEach(([gn,qn])=>{
      const a=M.findIndex(p=>p&&p.n===gn), b=T.findIndex(p=>p&&p.n===qn); if(a<0||b<0)return;
      const g=M[a], q=T[b]; M[a]=q; T[b]=g; [q,g].forEach(p=>{ p.yrsHere=0; p.joined=SEA.year });
      [[M,a],[T,b]].forEach(([R,i])=>{ const s=i%POS.length, k=BK(s); if(R[s]&&R[k]&&R[k].r>R[s].r){ const z=R[s]; R[s]=R[k]; R[k]=z } }) }) })) }
function tdTrades(){ const L=tdLog(); return [].concat(...Object.keys(L).sort((a,b)=>a-b).map(k=>L[k])).filter(x=>x.y===undefined||x.y===SEA.year) }

/* the Trades tab */
let TD_UI={};
function tdLine(d,mine){ const sg=v=>(v>=0?"+":"")+v.toFixed(1);
  return `<span style="color:${d.now>=0?"var(--good,#7fd17f)":"var(--bad,#e88)"}">${sg(d.now)} now</span>, <span style="color:var(--muted)">${sg(d.fut)} in two years</span>` }
function tdPl(t,p,i){ return `${plLink(t,p.n)} <span style="color:var(--muted)">${esc(POS[i%POS.length].p)} ${p.r}${p.age?`, ${p.age}`:""}${p.k&&p.k.sal?`, $${p.k.sal.toFixed(1)}M`:""}</span>` }
function tdPickRows(L,my,label){ if(!L.length)return "";
  return `<div class="fnote" style="margin-top:8px">${label}:</div>`+L.map(d=>`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${tdPl(my,d.give,d.a)}${d.pk==="mine"?" and your first-round pick":""}</div>
    <div class="psub">for ${esc(d.t)}${/s$/.test(d.t)?"'":"'s"} ${tdPl(d.t,d.get,d.b)}${d.pk==="theirs"?" and their first-round pick":""} <span style="color:var(--muted)">(the pick #${d.pkSlot} on today's records)</span></div><div class="psub">Your team: ${tdLine(d)}</div></div><button class="promo" data-tdgo="${tdGo(d)}">Trade</button></div>`).join("") }
function tdTwoRows(L,my){ if(!L.length)return "";
  return `<div class="fnote" style="margin-top:8px">Two for two:</div>`+L.map(d=>`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${tdPl(my,d.give,d.a)} and ${tdPl(my,d.give2,d.a2)}</div>
    <div class="psub">for ${esc(d.t)}${/s$/.test(d.t)?"'":"'s"} ${tdPl(d.t,d.get,d.b)} and ${tdPl(d.t,d.get2,d.b2)}</div><div class="psub">Your team: ${tdLine(d)}</div></div><button class="promo" data-tdgo="${tdGo(d)}">Trade</button></div>`).join("") }
function tradesView(){
  const my=S.myTeam, st=tdState(), R=SEA.roster[my];
  let h=`<div class="note">${esc(st.why)} Up to ${TD_MAX} trades a season: one for one at the same position, or two for two (a pair at each of two positions). A club weighs now against two years ahead by where it stands, under the cap, and you always give a little more than you get.</div>`;
  const nm2=(a,b)=>esc(a)+(b?" and "+esc(b):"");
  if(TD_UI.done){ const x=TD_UI.done; h+=`<div class="card" style="padding:10px 12px;margin:8px 0"><b>Done.</b> ${nm2(x.gn,x.gn2)}${x.pk==="mine"?" and your first-round pick":""} to ${esc(x.t)}, ${nm2(x.qn,x.qn2)}${x.pk==="theirs"?" and their first-round pick":""} to you.</div>` }
  if(typeof cpuTradesHTML==="function")h+=cpuTradesHTML();   // round 85: the computer's clubs' deadline deals
  const done=tdTrades(); if(done.length)h+=`<div class="grouphead">Your trades this season</div><div class="card" style="padding:6px 12px">${done.map(x=>`<div style="margin:4px 0">${esc(x.d)}: ${nm2(x.gn,x.gn2)}${x.pk==="mine"?" and your first-round pick":""} to ${esc(x.t)} for ${nm2(x.qn,x.qn2)}${x.pk==="theirs"?" and their first-round pick":""}</div>`).join("")}</div>`;
  if(!st.open)return h;
  const cap=LEAGUE.taxLine||LEAGUE.cap; if(cap&&R.some(p=>p&&p.k))h+=`<div class="note">Payroll $${tdPay(R).toFixed(1)}M of $${cap}M.</div>`;
  // shop one of mine
  h+=`<div class="grouphead">Shop a player</div>`;
  if(TD_UI.shop!=null&&R[TD_UI.shop]){ const a=TD_UI.shop, O=tdOffers(a);
    h+=`<div class="card" style="padding:8px 12px"><div style="margin-bottom:6px">Offers for ${tdPl(my,R[a],a)} <button class="promo" data-tdshop="-1">Back</button></div>`+
      (O.length?O.map((d,k)=>`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${esc(d.t)}: ${tdPl(d.t,d.get,d.b)}</div><div class="psub">Your team: ${tdLine(d)}</div></div><button class="promo" data-tdgo="${tdGo(d)}">Trade</button></div>`).join(""):
        `<div class="fnote">No club would give you a better man at his spot, now or in two years, for him.</div>`)+tdTwoRows(tdShopTwo(a),my)+tdPickRows(tdShopPick(a),my,"With their first-round pick")+`</div>` }
  else h+=`<div class="card" style="padding:6px 12px">${R.map((p,i)=>p&&!tdHurt(my,i)?`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${tdPl(my,p,i)}</div></div><button class="promo" data-tdshop="${i}">Shop</button></div>`:"").join("")}</div>`;
  // ask about one of theirs
  const C=tdClubs(), t=TD_UI.club&&C.indexOf(TD_UI.club)>=0?TD_UI.club:null;
  h+=`<div class="grouphead">Ask about a player</div><div class="card" style="padding:8px 12px"><div class="confpick"><select data-tdclub><option value="">Choose a club</option>${C.map(c=>`<option${c===t?" selected":""}>${esc(c)}</option>`).join("")}</select></div>`;
  if(t){ const T=SEA.roster[t];
    if(TD_UI.ask!=null&&T[TD_UI.ask]){ const b=TD_UI.ask, A=tdAsk(t,b);
      h+=`<div style="margin:8px 0">${t} on ${tdPl(t,T[b],b)} <button class="promo" data-tdask="-1">Back</button></div>`+
        (A.hurt?`<div class="fnote">He's injured: not now.</div>`:A.recent?`<div class="fnote">They've traded with you in the last ${TD_GAP} ${LEAGUE.daily?"days":"weeks"}: not yet.</div>`:
         A.list.length?`<div class="fnote">They'd take any of these for him:</div>`+A.list.map(d=>`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${tdPl(my,d.give,d.a)}</div><div class="psub">Your team: ${tdLine(d)}</div></div><button class="promo" data-tdgo="${esc(t)}|${d.a}|${d.b}">Trade</button></div>`).join(""):
         `<div class="fnote">Nobody of yours at his position would get him${tdWin(t)>0.7?": they're contending and he helps them win now":""}.${tdAskWhy(t,b)}</div>`)+(A.hurt||A.recent?"":tdTwoRows(tdAskTwo(t,b),my)+tdPickRows(tdAskPick(t,b),my,"With your first-round pick")) }
    else h+=T.map((q,b)=>q?`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${tdPl(t,q,b)}${tdHurt(t,b)?` <span class="outtag">OUT</span>`:""}</div></div>${tdHurt(t,b)?"":`<button class="promo" data-tdask="${b}">Ask</button>`}</div>`:"").join("") }
  return h+`</div>` }
function bindTrades(){
  document.querySelectorAll("[data-tdshop]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.tdshop; TD_UI={shop:i<0?null:i,club:TD_UI.club}; render() });
  document.querySelectorAll("[data-tdask]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.tdask; TD_UI={club:TD_UI.club,ask:i<0?null:i}; render() });
  document.querySelectorAll("[data-tdno]").forEach(b=>b.onclick=()=>{ TD_UI={no:b.dataset.tdno}; render() });
  document.querySelectorAll("[data-tdclub]").forEach(s=>s.onchange=()=>{ TD_UI={club:s.value||null}; render() });
  document.querySelectorAll("[data-tdgo]").forEach(b=>b.onclick=()=>{ const [t,a,c,a2,c2,pk]=b.dataset.tdgo.split("|"), d=a2!==undefined&&a2!==""?tdDeal(t,+a,+c,+a2,+c2,pk||null):tdDeal(t,+a,+c,null,null,pk||null);
    if(!d||!d.yes||!tdState().open)return; tapTwice(b,"Confirm",()=>tdDo(d)) });
}

/* round 84: offers that come to you. In the last stretch before the deadline (the last three weeks of football, the
   last three weeks of the daily leagues, every third day; the window's last two weeks in soccer) the club that most
   wants one of your men comes to you, on the home screen. Which club: the one whose best deal it scores highest; which
   man of theirs it offers: of the men it would give for him, the best for you. The same rules as any deal, so there's
   no free lunch: you give a little more than you get, now and later together. Not now hides it till the next one. */
function tdLastOpen(){ const T=LEAGUE.trade, D=LEAGUE.dates||[]; let last=-1;
  for(let k=0;k<D.length;k++){ const m=String(D[k]).split(" ")[0]; if(T.window?T.window.indexOf(m)>=0:tdDay(D[k])<=tdDay(T.by))last=k }
  return last }
function tdIncoming(){
  const st=tdState(); if(!st.open)return null; const last=tdLastOpen(), left=last-SEA.step;
  const span=LEAGUE.daily?21:LEAGUE.trade.window?2:3; if(left<0||left>=span)return null; if(LEAGUE.daily&&left%3)return null;
  // only an offer that helps you now or later (measured: the club's keenest deal was most often a lowball that cost you
  // both, a 70 for a 52 at -2.7 now and -8.5 later), and not one already made to you this season
  const my=S.myTeam, R=SEA.roster[my], seen=(S.tdShown&&S.tdShown.y===SEA.year?S.tdShown.k:[]); let pick=null;
  tdClubs().forEach(t=>{ if(tdRecent(t))return; const T=SEA.roster[t];
    R.forEach((g,a)=>{ if(!g||tdHurt(my,a)||seen.indexOf(t+"|"+g.n)>=0)return; T.forEach((q,b)=>{ if(!q||tdGrp(a)!==tdGrp(b)||tdHurt(t,b))return; const d=tdDeal(t,a,b);
      if(d&&d.yes&&(d.now>0||d.fut>0)&&(!pick||d.score>pick.score))pick=d }) }) });
  if(!pick)return null;
  // the man of theirs best for you, of those they'd give for him
  let best=pick; SEA.roster[pick.t].forEach((q,b)=>{ if(!q||tdGrp(b)!==tdGrp(pick.a)||tdHurt(pick.t,b))return; const d=tdDeal(pick.t,pick.a,b); if(d&&d.yes&&(d.now>0||d.fut>0)&&d.now+d.fut>best.now+best.fut)best=d });
  return best }
// an offer shown is remembered for the season (only what's offered: it changes nothing a reload plays)
function tdMark(d){ if(!S.tdShown||S.tdShown.y!==SEA.year)S.tdShown={y:SEA.year,s:{},k:[]};
  const key=d.t+"|"+d.give.n; if(S.tdShown.s[SEA.step]===undefined){ S.tdShown.s[SEA.step]=key; if(S.tdShown.k.indexOf(key)<0)S.tdShown.k.push(key) } }
function tdOfferCard(){
  if(!LEAGUE.trade||!SEA.roster)return ""; const k=SEA.year+"|"+SEA.step; if(TD_UI.no===k)return "";
  const sh=S.tdShown&&S.tdShown.y===SEA.year?S.tdShown:null; let d=null;
  if(sh&&sh.s[SEA.step]!==undefined){ const [t,gn]=String(sh.s[SEA.step]).split("|"), R=SEA.roster[S.myTeam], a=R.findIndex(p=>p&&p.n===gn);
    if(a>=0&&t){ let best=null; SEA.roster[t].forEach((q,b)=>{ if(!q||tdGrp(b)!==tdGrp(a)||tdHurt(t,b))return; const x=tdDeal(t,a,b); if(x&&x.yes&&(x.now>0||x.fut>0)&&(!best||x.now+x.fut>best.now+best.fut))best=x }); d=best } }
  else { d=tdIncoming(); if(d)tdMark(d) }
  if(!d)return ""; const my=S.myTeam;
  return `<div class="card" style="padding:10px 12px;margin:8px 0"><div class="olab">A trade offer &middot; ${esc(tdState().why)}</div>
    <div style="margin:6px 0">${esc(d.t)} want ${tdPl(my,d.give,d.a)}. They'd give ${tdPl(d.t,d.get,d.b)}.</div>
    <div class="psub" style="margin-bottom:6px">Your team: ${tdLine(d)}</div>
    <button class="promo" data-tdgo="${esc(d.t)}|${d.a}|${d.b}">Trade</button> <button class="promo" data-tdno="${k}">Not now</button></div>` }

/* round 86: first-round picks. A club deals only its own, once a season, and only with a man for a man (the rosters
   stay whole). What a pick is worth to a club: two years on, the man it brings, where the club's record says it will
   pick (the worst record picks first), from this summer's class as it is (read on a copy: nothing drawn, nothing
   kept on the league). In a deal a pick counts in two years' strength, nowhere in now: the same rules as any deal, so
   a club still gives a little less than it gets, now and later together. */
const tdHasDraft=()=>!!(LEAGUE.offseason&&LEAGUE.offseason.draftRounds);
function tdAllTrades(){ const o=[]; coachMoves().forEach(([tm,P])=>{ const L=tdLog(P||{}); Object.keys(L).sort((a,b)=>a-b).forEach(k=>o.push(...L[k])) });
  return o.filter(x=>x.y===undefined||x.y===SEA.year) }
function tdPickHeld(t){ return tdHasDraft()&&!tdAllTrades().some(x=>x.pk&&(x.pk==="mine"?(x.my||S.myTeam):x.t)===t) }
function tdPickSlot(t){ const rec=SEA.rec||{}, pct=x=>{ const r=rec[x]||[0,0]; return ((r[0]||0)+5)/((r[0]||0)+(r[1]||0)+10) };
  return NAMES.filter(x=>pct(x)<pct(t)||(pct(x)===pct(t)&&x<t)).length+1 }
let TD_CLASS=null;
function tdClassSorted(){ const key=(U.seed||0)+"|"+SEA.year; if(TD_CLASS&&TD_CLASS.key===key)return TD_CLASS.list;
  const C=nflDraftClass({seed:U.seed,year:SEA.year,roster:U.roster}).list.map(p=>Object.assign({},p));
  C.sort((a,b)=>(b.r+(b.pot-b.r)*0.45)-(a.r+(a.pot-a.r)*0.45)); TD_CLASS={key:key,list:C}; return C }
function tdPickVal(club,orig,R){ if(!tdHasDraft())return 0; const L=tdClassSorted(), q=L[Math.min(L.length-1,tdPickSlot(orig)-1)]; if(!q)return 0;
  const p=Object.assign({},q,{age:q.age||21,k:{yrs:4}}), i=POS.findIndex(P=>P.p===p.p); if(i<0)return 0;
  const R2=R.slice(), s=R2[i], b=R2[BK(i)], f=tdFut(p);
  if(!s||f>tdFut(s)){ R2[BK(i)]=s; R2[i]=p } else if(!b||f>tdFut(b))R2[BK(i)]=p; else return 0;
  return Math.max(0,tdVal(R2,true)-tdVal(R,true)) }
const tdPickName=d=>d.pk?` and ${d.pk==="mine"?"your":"their"} first-round pick (on today's records, #${d.pkSlot})`:"";
