/* round 83: trades in the season (Ian: "in-season trades and offers, with deadlines and caps: make an offer, ask what
   they'd want"). The five pro games: football, basketball, hockey and baseball until the league's deadline, soccer in
   the January window. One of yours for one of theirs at the same position (a starter or a backup, either side), so
   both rosters stay whole. A club answers from the deal alone, with no dice: asking twice gets the same answer.

   What a club wants: how much stronger the deal makes it now and in two years (its own roster, rated now and as its
   players will be: the young toward their ceiling, the old past 29 losing a step), weighed by where it stands. A
   contender wants now; a club out of it wants later. It takes the deal when that is worth a little more than it gives
   (TD_PREM), it fits under the cap, and it hasn't traded with you in the last TD_GAP days. Injured men aren't traded.

   A trade is kept with its day among the promotions (S.promos), as a promotion is: a reload plays it at the same point. Each man takes the
   other's slot and the better of the two at that spot starts. Both clubs' strength moves by what the sim reads (the
   change in rosterElo). At the season's end the trade is put into next season's rosters too (tdCarry), and a man's
   season goes into his career with the club he finished with. The computer's clubs don't trade with each other yet,
   so nothing changes for a season with no trades in it. */
const TD_PREM=2;                // elo: what a club wants over even before it says yes
const TD_GAP=7;                 // steps between two trades with the same club (a week of football is one step)
const TD_MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function tdDay(s){ const D=LEAGUE.dates||[], m0=TD_MON.indexOf(String(D[0]||"Jan 1").split(" ")[0]); const [m,d]=String(s||"").split(" ");
  return ((TD_MON.indexOf(m)-m0+12)%12)*31+(+d||0) }
// open now? and the line that says when it closes (or opened, or opens)
function tdState(){
  const T=LEAGUE.trade; if(!T||!SEA||!SEA.roster)return {open:false,why:""};
  if(SEA.phase!=="week")return {open:false,why:"Trades are closed until next season."};
  if(typeof isHotSeat==="function"&&isHotSeat())return {open:false,why:"Trades aren't in a shared-seat career yet."};
  if(SEA.half)return {open:false,why:"Not in the middle of a cup week: after its second game."};
  const today=(LEAGUE.dates||[])[SEA.step]||"";
  if(T.window){ const m=today.split(" ")[0]; if(T.window.indexOf(m)>=0)return {open:true,why:`The January window: open until ${T.shut}.`};
    return {open:false,why:tdDay(today)<tdDay(T.window[0]+" 1")?"The transfer window opens in January.":"The January window has shut."} }
  if(tdDay(today)>tdDay(T.by))return {open:false,why:`The trade deadline (${T.by}) has passed.`};
  return {open:true,why:`The trade deadline is ${T.by}.`};
}
const tdGrp=i=>POS[i%POS.length].p.replace(/\d+$/,"");      // baseball's SP, SP2 and SP3 are all starters
function tdHurt(t,i){ return SEA.talent.active(t).some(e=>e.idx===i) }
// a man whose deal ends this season counts for 40% of himself in two years (he may re-sign; he may not: a rental)
function tdFut(p){ const a=p.age||27, young=Math.max(0,27-a)/5;
  const f=Math.max(30,p.r+(p.pot!=null&&p.pot>p.r?(p.pot-p.r)*0.5*young:0)-Math.max(0,a-29)*1.5);
  return p.k&&p.k.yrs<=1?f*0.4:f }
// a club's own reading of a roster: the starters, and a little for the man behind each (in case)
function tdVal(R,fut){ let s=0; POS.forEach((P,i)=>{ const v=x=>x?(fut?tdFut(x):x.r):0, x=v(R[i]), y=v(R[BK(i)]); s+=P.w*(0.88*Math.max(x,y)+0.12*Math.min(x,y)) }); return ratingToElo(s) }   // the better of the two starts (in two years too)
// where a club stands: 1 is a contender, 0 out of it (the share of the season gone tempers it early)
function tdWin(t){
  const rec=SEA.rec||{}, pct=x=>{ const r=rec[x]||[0,0]; return ((r[0]||0)+5)/((r[0]||0)+(r[1]||0)+10) };
  const peers=NAMES.filter(x=>CONF[x]===CONF[t]||!LEAGUE.trade.sameDiv), mine=pct(t), rank=peers.filter(x=>pct(x)>mine).length/Math.max(1,peers.length-1);
  const gone=Math.min(1,SEA.step/Math.max(1,(LEAGUE.dates||[]).length*0.5));
  return 0.55+(rank<0.35?0.3:rank>0.65?-0.3:0)*gone }
// the two rosters after the swap: each man in the other's slot, the better of the two at that spot starting
function tdAfter(R,i,p){ const X=R.slice(); X[i]=p; const s=i%POS.length, b=BK(s); if(X[s]&&X[b]&&X[b].r>X[s].r){ const t=X[s]; X[s]=X[b]; X[b]=t } return X }
function tdPay(R){ return R.reduce((s,p)=>s+(p&&p.k&&p.k.sal||0),0) }
// the deal from both sides: a = my slot, b = their slot
function tdDeal(t,a,b){
  const my=S.myTeam, M=SEA.roster[my], T=SEA.roster[t], give=M[a], get=T[b];
  if(!give||!get||tdGrp(a)!==tdGrp(b))return null;
  const M2=tdAfter(M,a,get), T2=tdAfter(T,b,give), w=tdWin(t);
  const score=w*(tdVal(T2,false)-tdVal(T,false))+(1-w)*(tdVal(T2,true)-tdVal(T,true));
  const cap=LEAGUE.taxLine||LEAGUE.cap, over=cap?[[M,M2],[T,T2]].some(([x,y])=>tdPay(y)>cap&&tdPay(y)>tdPay(x)):false;
  return {t:t,a:a,b:b,give:give,get:get,score:score,yes:score>=TD_PREM&&!over,over:over,w:w,
    now:teamRating(M2)-teamRating(M), fut:(tdVal(M2,true)-tdVal(M,true))/R_SLOPE*1}
}
// kept among the promotions (S.promos), so a reload replays a trade and a promotion on one day in the order they were made
const tdLog=()=>{ const L=S.promos||{}, o={}; Object.keys(L).forEach(k=>{ const v=L[k].filter(x=>x&&x.tr).map(x=>x.tr); if(v.length)o[k]=v }); return o };
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
// who of mine a club would take for one of theirs
function tdAsk(t,b){
  const my=S.myTeam; if(tdHurt(t,b))return {hurt:true,list:[]}; if(tdRecent(t))return {recent:true,list:[]};
  const list=[]; SEA.roster[my].forEach((p,a)=>{ if(!p||tdGrp(a)!==tdGrp(b)||tdHurt(my,a))return; const d=tdDeal(t,a,b); if(d&&d.yes)list.push(d) });
  return {list:list.sort((x,y)=>y.now-x.now||y.fut-x.fut)} }
// carry a trade out: on the season's rosters (also as a reload replays it)
function tdApply(sea,x){
  const my=x.my||S.myTeam, M=sea.roster[my], T=sea.roster[x.t]; if(!M||!T)return false;
  const a=M[x.a]&&M[x.a].n===x.gn?x.a:M.findIndex(p=>p&&p.n===x.gn), b=T[x.b]&&T[x.b].n===x.qn?x.b:T.findIndex(p=>p&&p.n===x.qn);
  if(a<0||b<0)return false;
  const e0=rosterElo(M), f0=rosterElo(T), give=M[a], get=T[b];
  [[M,a,get,my],[T,b,give,x.t]].forEach(([R,i,p,tm])=>{ R[i]=p; const s=i%POS.length, k=BK(s); if(R[s]&&R[k]&&R[k].r>R[s].r){ const z=R[s]; R[s]=R[k]; R[k]=z;
    (sea.talent.inj[tm]||[]).forEach(e=>{ if(e.idx===s)e.idx=k; else if(e.idx===k)e.idx=s }) } });   // an injury goes with the man, not the slot
  sea.talent.base[my]+=rosterElo(M)-e0; sea.talent.base[x.t]+=rosterElo(T)-f0;
  get.tdFrom=x.t; give.tdFrom=my; return true }
function tdDo(d){
  S.promos=S.promos||{}; const k=SEA.step, x={t:d.t,a:d.a,b:d.b,gn:d.give.n,qn:d.get.n,my:S.myTeam,y:SEA.year,d:(LEAGUE.dates||[])[k]||""};
  if(!tdApply(SEA,x))return; (S.promos[k]=S.promos[k]||[]).push({tr:x});
  TD_UI={done:x}; save(); render() }
// at the season's end, into the universe's rosters (next season's): the same two men, found by name
function tdCarry(u){
  const L=tdLog(); Object.keys(L).sort((a,b)=>a-b).forEach(k=>L[k].forEach(x=>{ if(x.y!==undefined&&x.y!==SEA.year)return;
    const my=x.my||S.myTeam, M=u.roster[my], T=u.roster[x.t]; if(!M||!T)return;
    const a=M.findIndex(p=>p&&p.n===x.gn), b=T.findIndex(p=>p&&p.n===x.qn); if(a<0||b<0)return;
    const g=M[a], q=T[b]; M[a]=q; T[b]=g; [q,g].forEach(p=>{ p.yrsHere=0; p.joined=SEA.year });
    [[M,a],[T,b]].forEach(([R,i])=>{ const s=i%POS.length, k=BK(s); if(R[s]&&R[k]&&R[k].r>R[s].r){ const z=R[s]; R[s]=R[k]; R[k]=z } }) })) }
function tdTrades(){ const L=tdLog(); return [].concat(...Object.keys(L).sort((a,b)=>a-b).map(k=>L[k])).filter(x=>x.y===undefined||x.y===SEA.year) }

/* the Trades tab */
let TD_UI={};
function tdLine(d,mine){ const sg=v=>(v>=0?"+":"")+v.toFixed(1);
  return `<span style="color:${d.now>=0?"var(--good,#7fd17f)":"var(--bad,#e88)"}">${sg(d.now)} now</span>, <span style="color:var(--muted)">${sg(d.fut)} in two years</span>` }
function tdPl(t,p,i){ return `${plLink(t,p.n)} <span style="color:var(--muted)">${esc(POS[i%POS.length].p)} ${p.r}${p.age?`, ${p.age}`:""}${p.k&&p.k.sal?`, $${p.k.sal.toFixed(1)}M`:""}</span>` }
function tradesView(){
  const my=S.myTeam, st=tdState(), R=SEA.roster[my];
  let h=`<div class="note">${esc(st.why)} One of yours for one of theirs at the same position. A club answers from the deal: how much it helps them now and in two years, weighed by where they stand (a contender wants now, a club out of it wants later), under the cap.</div>`;
  if(TD_UI.done){ const x=TD_UI.done; h+=`<div class="card" style="padding:10px 12px;margin:8px 0"><b>Done.</b> ${esc(x.gn)} to ${esc(x.t)}, ${esc(x.qn)} to you.</div>` }
  const done=tdTrades(); if(done.length)h+=`<div class="grouphead">Your trades this season</div><div class="card" style="padding:6px 12px">${done.map(x=>`<div style="margin:4px 0">${esc(x.d)}: ${esc(x.gn)} to ${esc(x.t)} for ${esc(x.qn)}</div>`).join("")}</div>`;
  if(!st.open)return h;
  const cap=LEAGUE.taxLine||LEAGUE.cap; if(cap&&R.some(p=>p&&p.k))h+=`<div class="note">Payroll $${tdPay(R).toFixed(1)}M of $${cap}M.</div>`;
  // shop one of mine
  h+=`<div class="grouphead">Shop a player</div>`;
  if(TD_UI.shop!=null&&R[TD_UI.shop]){ const a=TD_UI.shop, O=tdOffers(a);
    h+=`<div class="card" style="padding:8px 12px"><div style="margin-bottom:6px">Offers for ${tdPl(my,R[a],a)} <button class="promo" data-tdshop="-1">Back</button></div>`+
      (O.length?O.map((d,k)=>`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${esc(d.t)}: ${tdPl(d.t,d.get,d.b)}</div><div class="psub">Your team: ${tdLine(d)}</div></div><button class="promo" data-tdgo="${esc(d.t)}|${d.a}|${d.b}">Trade</button></div>`).join(""):
        `<div class="fnote">No club would give you a better man at his spot, now or in two years, for him.</div>`)+`</div>` }
  else h+=`<div class="card" style="padding:6px 12px">${R.map((p,i)=>p&&!tdHurt(my,i)?`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${tdPl(my,p,i)}</div></div><button class="promo" data-tdshop="${i}">Shop</button></div>`:"").join("")}</div>`;
  // ask about one of theirs
  const C=tdClubs(), t=TD_UI.club&&C.indexOf(TD_UI.club)>=0?TD_UI.club:null;
  h+=`<div class="grouphead">Ask about a player</div><div class="card" style="padding:8px 12px"><div class="confpick"><select data-tdclub><option value="">Choose a club</option>${C.map(c=>`<option${c===t?" selected":""}>${esc(c)}</option>`).join("")}</select></div>`;
  if(t){ const T=SEA.roster[t];
    if(TD_UI.ask!=null&&T[TD_UI.ask]){ const b=TD_UI.ask, A=tdAsk(t,b);
      h+=`<div style="margin:8px 0">${t} on ${tdPl(t,T[b],b)} <button class="promo" data-tdask="-1">Back</button></div>`+
        (A.hurt?`<div class="fnote">He's injured: not now.</div>`:A.recent?`<div class="fnote">They've traded with you in the last ${TD_GAP} ${LEAGUE.daily?"days":"weeks"}: not yet.</div>`:
         A.list.length?`<div class="fnote">They'd take any of these for him:</div>`+A.list.map(d=>`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${tdPl(my,d.give,d.a)}</div><div class="psub">Your team: ${tdLine(d)}</div></div><button class="promo" data-tdgo="${esc(t)}|${d.a}|${d.b}">Trade</button></div>`).join(""):
         `<div class="fnote">Nobody of yours at his position would get him${tdWin(t)>0.7?": they're contending and he helps them win now":""}.</div>`) }
    else h+=T.map((q,b)=>q?`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${tdPl(t,q,b)}${tdHurt(t,b)?` <span class="outtag">OUT</span>`:""}</div></div>${tdHurt(t,b)?"":`<button class="promo" data-tdask="${b}">Ask</button>`}</div>`:"").join("") }
  return h+`</div>` }
function bindTrades(){
  document.querySelectorAll("[data-tdshop]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.tdshop; TD_UI={shop:i<0?null:i,club:TD_UI.club}; render() });
  document.querySelectorAll("[data-tdask]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.tdask; TD_UI={club:TD_UI.club,ask:i<0?null:i}; render() });
  document.querySelectorAll("[data-tdclub]").forEach(s=>s.onchange=()=>{ TD_UI={club:s.value||null}; render() });
  document.querySelectorAll("[data-tdgo]").forEach(b=>b.onclick=()=>{ const [t,a,c]=b.dataset.tdgo.split("|"), d=tdDeal(t,+a,+c);
    if(!d||!d.yes||!tdState().open)return; tapTwice(b,"Confirm",()=>tdDo(d)) });
}
