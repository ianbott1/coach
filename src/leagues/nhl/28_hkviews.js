/* ============ pro hockey: the front office's screens (engine 27) ============ */
/* The summer screen's choices, as it opens: the staff's re-sign plan, each expiring man's status and terms */
function hkOpen(u,t){
  hkStart(u); hkIndex(u); const R=u.roster[t]; while(R.length<HK_N)R.push(null);
  const resign=hkResignPlan(u,t,R,HK_AIM.balanced), asks={};
  R.forEach((p,i)=>{ if(!p||p.k.yrs>1)return; const st=hkStatus(p);
    asks[i]=st==="UFA"?{st:st,sal:hkAsk(p.r,p.age+1),yrs:hkYears(p.age+1,p.r,true)}
      :Object.assign({st:st,qo:hkQO(p.k.sal),award:st==="RFA-A"?hkAward(p):null},hkRfaDeal(p)) });
  nflDraftClass(u,t);
  return {pool:HK$.cap, picks:{resign:resign, asks:asks, fa:"balanced", draft:"bpa", board:[], targets:[], block:null, trade:null,
    buyouts:[], nomatch:{}, arbYrs:{}, walk:{}, bids:{}}} }
/* who will be on the market: other clubs' men their plans won't keep (unrestricted), and the restricted men they'll
   qualify, whom an offer sheet can take */
function hkFreeAgentPreview(u,myTeam){
  const out=[], E=(typeof SEA!=="undefined"&&SEA&&SEA.elo)||u.perceived;
  NAMES.forEach(t=>{ if(t===myTeam)return;
    const R=u.roster[t], plan=hkResignPlan(u,t,R,HK_AIM[hkStyle(u,t,E,null)]);
    R.forEach((p,i)=>{ if(!p||p.k.yrs>1)return; const st=hkStatus(p);
      if(!plan[i]){ if(p.r<HK_POOLR||!vetOK(Object.assign({},p,{age:p.age+1})))return;
        out.push({key:faKey(t,p),n:p.n,p:p.p,team:t,age:p.age+1,r:p.r,pot:p.pot,ask:hkClamp(hkAsk(p.r,p.age+1)*1.1),yrs:hkYears(p.age+1,p.r,false),st:"UFA"}); return }
      if(st==="UFA"||p.r<57)return;
      if(st==="RFA-A"&&(strHash("file|"+p.n+"|"+u.year)%100)<12)return;          // he'll file for arbitration: no sheets
      const ask=hkClamp(hkAsk(p.r,p.age+1)*1.1);
      out.push({key:faKey(t,p),n:p.n,p:p.p,team:t,age:p.age+1,r:p.r,pot:p.pot,ask:ask,yrs:Math.min(HK$.yNew,5),st:"RFA",comp:hkOsComp(ask)}) }) });
  return out.sort((a,b)=>(b.r+(b.pot-b.r)*0.3-b.age*0.2)-(a.r+(a.pot-a.r)*0.3-a.age*0.2)) }

/* ---- the summer screen ---- */
/* next season's cap hit as you've planned it: the men under contract, the expiring men you keep on the terms shown,
   buyouts at their cap hit, dead money, an agreed trade */
function hkPlanned(P,t){
  t=t||S.myTeam; const R=U.roster[t], bo=P.buyouts||[]; let pay=hkDeadOf(U,t), n=0;
  R.forEach((p,i)=>{ if(!p)return; const a=P.asks&&P.asks[i];
    if(bo.indexOf(faKey(t,p))>=0){ pay+=hkBuyHit(p); return }
    if(a){ const d=P.resign&&P.resign[i]; if(!d)return; n++; pay+=a.st==="UFA"?a.sal:d==="arb"?(a.award||a.sal):a.sal; return }
    n++; pay+=p.k.sal });
  if(P.trade)pay+=P.trade.sal-P.trade.giveSal;
  return {pay:hk2(pay), n:n, open:Math.max(0,HK_N-n)} }
const hkYrsW=y=>nOf(y,"year");
/* the cap line: what you'd carry, against the cap and the floor; the fifty contracts */
function hkCapLineHTML(P){
  const t=S.myTeam, pl=hkPlanned(P), fill=pl.open*HK$.min, room=HK$.cap-pl.pay-fill, dead=hkDeadOf(U,t);
  const nres=hkResOf(U,t).filter(p=>p.k).length;
  return `<div class="budgetleft ${room>=0?'done':''}">Cap hit ${hkMoney(pl.pay)} &middot; cap ${hkMoney(HK$.cap)} &middot; ${room>=0?hkMoney(room)+" room":hkMoney(-room)+" over the cap"}${pl.open>0?` after ${nOf(pl.open,"open place")} at the minimum`:""}</div>${room<0?`<div class="note">You can be up to 10% over in the summer, but not on opening night: still over then, the worst value below your top twelve is waived until you fit.</div>`:""}
    <div class="note">${pl.n} of 23 signed for next season &middot; ${pl.n+nres} of 50 contracts &middot; the floor is ${hkMoney(HK$.floor)}${dead>0?` &middot; dead money ${hkMoney(dead)} (buyouts and retained salary)`:""}.</div>` }
/* expiring contracts: unrestricted men re-sign or go; restricted men are qualified (and sign), taken to arbitration,
   or not qualified (then they're unrestricted) */
function hkExpiringHTML(P){
  const t=S.myTeam, R=U.roster[t], exp=Object.keys(P.asks||{}).map(Number).filter(i=>R[i]);
  if(!exp.length)return `<div class="note">Nobody's contract is up this year.</div>`;
  return exp.map(i=>{ const p=R[i], a=P.asks[i], d=P.resign[i], spot=i<POS.length?"First unit":i<2*POS.length?"Second unit":"Depth";
    const head=`<div class="candtop"><div><div class="fname">${esc(p.n)} <span class="dpos">${esc(p.p)}</span></div>
      <div class="fnote">${spot} &middot; age ${p.age+1} next season &middot; rated ${p.r} &middot; ${esc(HK_STW[a.st])}</div></div>`;
    if(a.st==="UFA")return `<div class="cand ${d?'on':''}">${head}
      <button class="promo" data-hkd="${i}|${d?0:1}" aria-pressed="${!!d}">${d?"Re-signing":"Letting go"}</button></div>
      <div class="cdesc">Unrestricted: he can sign anywhere on July 1. Asking ${hkMoney(a.sal)} a year for ${hkYrsW(a.yrs)}${p.age>=31?" &middot; on the wrong side of thirty":""}.</div>${staffTag(i)}</div>`;
    const opt=(v,l)=>{ const on=v===0?!d:d===v; return `<button class="skip small ${on?'on':''}" data-hkd="${i}|${v}" aria-pressed="${on}">${l}</button>` };
    let desc=`Restricted: qualify him (${hkMoney(a.qo)}) and he's yours to sign; another club can still sign him to an offer sheet you can match. He'd sign for ${hkMoney(a.sal)} a year for ${hkYrsW(a.yrs)}${a.long?" (buying his free-agent years)":" (a bridge deal)"}. Not qualified, he's unrestricted.`;
    if(a.st==="RFA-A"){ const y=(P.arbYrs&&P.arbYrs[i])||1, w=!!(P.walk&&P.walk[i]);
      desc+=` He has arbitration rights: an arbitrator would award about ${hkMoney(a.award)}.`;
      if(d==="arb")desc+=` <button class="skip small" data-hkay="${i}">${y===2?"Two years":"One year"}</button>`+(a.award>=HK$.walk?` <button class="skip small ${w?'on':''}" data-hkwalk="${i}" aria-pressed="${w}">${w?"Walk away from the award":"Accept the award"}</button> <span class="planwhy">A club may walk away from an award of ${hkMoney(HK$.walk)} or more; he's then unrestricted.</span>`:"") }
    const key=faKey(t,p), nm=!!(P.nomatch&&P.nomatch[key]);
    if(d&&d!=="arb"&&p.r>=57)desc+=` <button class="skip small ${nm?'':'on'}" data-hknm="${esc(key)}" aria-pressed="${!nm}">${nm?"Take the picks if a sheet comes":"Match any offer sheet"}</button>`;
    return `<div class="cand ${d?'on':''}">${head}<span class="cgrade">${d==="arb"?"arbitration":d?"qualified":"not qualified"}</span></div>
      <div class="cdesc">${desc}</div>
      <div class="cdesc">${opt("q","Qualify and sign")}${a.st==="RFA-A"?" "+opt("arb","Arbitration"):""} ${opt(0,"Don't qualify")}</div>${staffTag(i)}</div>` }).join("") }
/* buyouts, in June: a man with years left, his cap hit spread over twice the years at a third (a sixth under 26) */
function hkBuyoutsHTML(P){
  const t=S.myTeam, R=U.roster[t], bo=P.buyouts||[];
  const over=p=>p.k.sal-hkAsk(p.r,p.age+1);
  const can=R.map((p,i)=>({p:p,i:i})).filter(x=>x.p&&!x.p.k.elc&&x.p.k.yrs>=2&&x.p.k.sal>=2).sort((a,b)=>over(b.p)-over(a.p)).slice(0,6);
  let h=`<div class="grouphead">Buyouts</div><div class="note">A bought-out man is paid two-thirds of what's left (a third if he's under 26), spread over twice the years: a smaller cap hit now, dead money for longer.</div>`;
  if(!can.length)return h+`<div class="note">Nobody with years left worth buying out.</div>`;
  return h+can.map(({p})=>{ const key=faKey(t,p), on=bo.indexOf(key)>=0, left=p.k.yrs-1, hit=hkBuyHit(p);
    return `<div class="drow"><div class="fmain"><div class="fname">${esc(p.n)} <span class="dpos">${esc(p.p)}</span></div>
      <div class="fnote">Rated ${p.r}, age ${p.age} &middot; ${hkMoney(p.k.sal)} for ${hkYrsW(left)} more &middot; bought out: ${hkMoney(hit)} a year against the cap for ${hkYrsW(2*left)}, ${hkMoney(p.k.sal-hit)} a year freed now</div></div>
      <button class="skip small ${on?'on':''}" data-hkbo="${esc(key)}" aria-pressed="${on}">${on?"Buying out":"Buy out"}</button></div>` }).join("") }
/* free agents and offer sheets you want: your price and years, against what you have */
function hkTargetsHTML(P){
  const t=S.myTeam, pre=hkFreeAgentPreview(U,t), byKey={}; pre.forEach(x=>byKey[x.key]=x);
  const mine=(P.targets||[]).filter(k=>byKey[k]), pl=hkPlanned(P), nxt=SEA.year+1;
  let left=HK$.cap-pl.pay-pl.open*HK$.min;
  const bid=x=>hkBid(P,x.key,Object.assign({},x,{ask:x.ask/1.1}),x.team===t);
  const row=(x,on,i)=>{ const b=on?bid(x):{sal:x.ask,yrs:x.yrs}; let fit="";
    if(on){ left-=b.sal-HK$.min; fit=left>=0?"fits":`${hkMoney(-left)} short of room` }
    const sheet=x.st==="RFA"?` &middot; restricted: an offer sheet costs ${hkOsWords(hkOsComp(b.sal))}${on&&!hkOwnsComp(U,t,hkOsComp(b.sal),nxt)?" (you don't hold those picks)":""}`:"";
    const k=esc(x.key);
    return `<div class="drow"><span class="dpick">${on?(i+1)+".":""}</span>
      <div class="fmain"><div class="fname">${esc(x.n)} <span class="dpos">${esc(x.p)}</span></div>
        <div class="fnote">${esc(x.team)} &middot; age ${x.age} &middot; rated ${x.r} &middot; ${on?"your offer":"about"} ${hkMoney(b.sal)} for ${hkYrsW(b.yrs)}${sheet}${fit?" &middot; "+fit:""}</div>
        ${on?`<div class="fnote"><button class="skip small" data-hkbid="${k}|-0.25|0">&minus; $250K</button> <button class="skip small" data-hkbid="${k}|0.25|0">+ $250K</button> <button class="skip small" data-hkbid="${k}|0|-1">&minus; a year</button> <button class="skip small" data-hkbid="${k}|0|1">+ a year</button></div>`:""}</div>
      <button class="skip small" ${on?`data-fatrm="${k}"`:`data-fatadd="${k}"`}>${on?"Remove":"Add"}</button></div>` };
  let h=`<div class="grouphead">Free agents and offer sheets you want</div>`;
  h+=mine.length?`<div class="note">Free agency opens July 1. A man weighs the money, the years, a winner, his role and his old club: set your price and years. An offer sheet to a restricted man costs draft picks by its value if his club doesn't match.</div>`+mine.map((k,i)=>row(byKey[k],true,i)).join("")
    :`<div class="note">None yet: your free-agency style will decide. Players you add get your offer first, at the price and years you set.</div>`;
  const rest=pre.filter(x=>mine.indexOf(x.key)<0), cheap=!!S.faCheap, rfa=rest.filter(x=>x.st==="RFA").length;
  const pool=(cheap?rest.slice().sort((a,b)=>a.ask-b.ask||b.r-a.r):rest).slice(0,25);
  h+=`<div class="grouphead">Likely on the market &mdash; ${cheap?"the cheapest 25":"the best 25"}</div>
    <div class="note">${rest.length} likely free agents, ${rfa} of them restricted (an offer sheet). <button class="skip small" data-facheap="1">${cheap?"Show the best first":"Show the cheapest first"}</button></div>`+
    (pool.length?pool.map(x=>row(x,false)).join(""):`<div class="note">Nobody worth chasing this year.</div>`);
  return h }
/* the reserve list: prospects whose rights the club holds, or signed and in the minors */
function hkReserveHTML(t,brief){
  const L=hkResOf(U,t).slice().sort((a,b)=>hkVal(b)-hkVal(a)); if(!L.length)return "";
  let h=`<div class="grouphead">Reserve list &middot; ${nOf(L.length,"prospect")}</div>`;
  if(!brief)h+=`<div class="note">Prospects in junior or the minors. A drafted man's rights are held until he signs an entry-level deal (at 20, if he's worth it); a signed one counts toward the fifty contracts. One better than the last man at his spot comes up in the summer.</div>`;
  return h+L.map(p=>`<div class="drow"><div class="fmain"><div class="fname">${esc(p.n)} <span class="dpos">${esc(p.p)}</span></div>
    <div class="fnote">Age ${p.age} &middot; rated ${p.r}, ceiling ${p.pot}${p.draft?` &middot; drafted ${p.draft.year}, #${p.draft.overall}`:""} &middot; ${p.k?(p.k.elc?"entry-level deal, "+hkMoney(p.k.sal):"two-way deal, "+hkMoney(p.k.sal)):"rights held, unsigned"}</div></div></div>`).join("") }
/* the summer screen's contract sections, in place of the old ones */
function hkSummerHTML(P,n){
  let h=staffPlanHTML(P);
  h+=`<div class="grouphead">${n(1)}. Expiring contracts</div>`;
  h+=coachMark("hkcontracts","Unrestricted men (27 and up, or seven seasons in) can go anywhere on July 1. Restricted men are yours if you qualify them; one with arbitration rights can be taken to an arbitrator. Every club must fit twenty-three under the cap.");
  h+=hkCapLineHTML(P)+hkExpiringHTML(P)+hkBuyoutsHTML(P);
  return h }
/* the summer screen's block: a club may be up to 10% over the cap in the summer, and must be under it by opening night
   (over it then, the worst value below the top twelve is waived); past the 10%, it can't go on */
function hkBlock(){ const P=S.off.picks, pl=hkPlanned(P), over=pl.pay+pl.open*HK$.min-HK$.cap*1.1;
  return over>0.005?"Over the summer's 10% allowance by "+hkMoney(over):null }
/* the summer screen's taps */
function hkBind(){
  const P=()=>S.off.picks, go=()=>{ save(); render() };
  document.querySelectorAll("[data-hkd]").forEach(b=>b.onclick=()=>{ const [i,v]=b.dataset.hkd.split("|"); P().resign[+i]=v==="1"?true:v==="0"?false:v; go() });
  document.querySelectorAll("[data-hkay]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.hkay, A=P().arbYrs=P().arbYrs||{}; A[i]=(A[i]||1)===1?2:1; go() });
  document.querySelectorAll("[data-hkwalk]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.hkwalk, W=P().walk=P().walk||{}; W[i]=!W[i]; go() });
  document.querySelectorAll("[data-hknm]").forEach(b=>b.onclick=()=>{ const k=b.dataset.hknm, M=P().nomatch=P().nomatch||{}; M[k]=!M[k]; go() });
  document.querySelectorAll("[data-hkbo]").forEach(b=>b.onclick=()=>{ const k=b.dataset.hkbo, L=P().buyouts=P().buyouts||[]; const j=L.indexOf(k); if(j>=0)L.splice(j,1); else L.push(k); go() });
  document.querySelectorAll("[data-hkbid]").forEach(b=>b.onclick=()=>{ const v=b.dataset.hkbid.split("|"), dy=+v.pop(), ds=+v.pop(), key=v.join("|"), team=v[0];
    const x=hkFreeAgentPreview(U,S.myTeam).find(z=>z.key===key); if(!x)return;
    const cur=hkBid(P(),key,Object.assign({},x,{ask:x.ask/1.1}),team===S.myTeam), mx=team===S.myTeam?HK$.yOwn:HK$.yNew;
    P().bids=P().bids||{}; P().bids[key]={sal:hk2(Math.max(HK$.min,Math.min(HK$.max,cur.sal+ds))),yrs:Math.max(1,Math.min(mx,cur.yrs+dy))}; go() }) }

/* ---- the season's screens ---- */
/* the cap sheet in a line, on every club's card: the cap hit with dead money, against the cap */
LEAGUE.payrollLine=function(t){
  const R=(SEA&&SEA.roster&&SEA.roster[t])||(U&&U.roster&&U.roster[t]); if(!R||!R.some(p=>p&&p.k))return "";
  if(!hkFO()){ const pay=payroll(R), room=LEAGUE.cap-pay;     // a career from before: the old line until its summer on engine 27
    return `<div class="progline">Payroll <b>${money2(pay)}</b> of ${money2(LEAGUE.cap)} cap &middot; ${room>=0?`${money2(room)} of room`:`<span class="dn">${money2(-room)} over</span>`}</div>` }
  const dead=SEA&&SEA.roster&&SEA.roster[t]===R?hkDeadSeason(SEA,t):hkDeadOf(U,t), hit=hk2(payroll(R)+dead), room=HK$.cap-hit;
  return `<div class="progline">Cap hit <b>${hkMoney(hit)}</b> of ${hkMoney(HK$.cap)} &middot; ${room>=0?`${hkMoney(room)} of room`:`<span class="dn">${hkMoney(-room)} over</span>`}${dead>0?` &middot; dead money ${hkMoney(dead)}`:""}</div>` };
/* the roster's other eleven (they play when a man ahead of them is hurt) and the reserve list */
LEAGUE.reservesHTML=function(my,hurt){
  const R=SEA.roster[my]; if(!hkFO()||!R||R.length<=2*POS.length)return "";
  let h=`<div class="grouphead">The rest of the twenty-three</div><div class="note">The bottom of the roster and the extras: the next man at a spot steps in when one ahead of him is hurt.</div>`;
  h+=POS.map((P,k)=>{ const L=hkSlots(k).slice(2).map(j=>R[j]).filter(Boolean); if(!L.length)return "";
    return `<div class="depth"><div class="dpos">${esc(P.p)}</div><div class="dbody">`+L.map(c=>`<div class="prow2 bk">
      <div class="pmain"><div class="pname sm">${plLink(my,c.n)}</div>
        <div class="psub">age ${c.age} &middot; ${c.pot>c.r?"ceiling "+c.pot:"at ceiling"} &middot; ${hkMoney(c.k.sal)}${c.k.yrs>1?" for "+hkYrsW(c.k.yrs):""}${c.k.elc?", entry-level":""}</div></div>
      <span class="prate sm">${c.r}</span></div>`).join("")+`</div></div>` }).join("");
  return h+hkReserveHTML(my,true) };
/* the summer's record, on the banner that closes it */
function hkBannerHTML(H,my){
  const L=(a,f)=>a.map(f).join(", "); let h="";
  if(H.buyouts.length)h+=`<div class="bnews small"><b>Bought out:</b> ${L(H.buyouts,b=>`${esc(b.n)} (${esc(b.p)}), ${hkMoney(b.hit)} a year of dead money for ${hkYrsW(b.yrs)}`)}.</div>`;
  if(H.arb.length)h+=`<div class="bnews small"><b>Arbitration:</b> ${L(H.arb,a=>a.walked?`${esc(a.n)} (${esc(a.p)}) was awarded ${hkMoney(a.award)}; you walked away and he's a free agent`:`${esc(a.n)} (${esc(a.p)}) awarded ${hkMoney(a.award)} for ${hkYrsW(a.yrs)}${a.filed==="he"?" (he filed)":""}`)}.</div>`;
  const q=H.rfa.filter(x=>x.q), nq=H.rfa.filter(x=>!x.q);
  if(q.length)h+=`<div class="bnews small"><b>Restricted, qualified and signed:</b> ${L(q,x=>`${esc(x.n)} (${esc(x.p)}) ${hkMoney(x.sal)} for ${hkYrsW(x.yrs)}`)}.</div>`;
  if(nq.length)h+=`<div class="bnews small"><b>Not qualified:</b> ${L(nq,x=>`${esc(x.n)} (${esc(x.p)})`)}.</div>`;
  H.os.forEach(e=>{ const pk=hkOsWords(e.comp);
    h+=e.from===my?`<div class="bnews ${e.matched?"":"flag"}"><b>Offer sheet.</b> ${esc(e.to)} signed ${esc(e.n)} (${esc(e.p)}) to ${hkMoney(e.sal)} for ${hkYrsW(e.yrs)}. ${e.matched?"You matched it.":`You didn't match: ${esc(e.to)} sends you ${pk}.`}</div>`
      :`<div class="bnews ${e.matched?"":"flag"}"><b>Offer sheet.</b> You signed ${esc(e.n)} (${esc(e.p)}) of ${esc(e.from)} to ${hkMoney(e.sal)} for ${hkYrsW(e.yrs)}. ${e.matched?`${esc(e.from)} matched it.`:`${esc(e.from)} didn't match: he's yours, and ${pk} go${/^(a|an) /.test(pk)&&pk.indexOf(" and ")<0?"es":""} to ${esc(e.from)}.`}</div>` });
  H.osMine.filter(x=>!x.got&&x.why&&!H.os.some(e=>e.n===x.n)).forEach(x=>{ h+=`<div class="bnews small"><b>Offer sheet not sent:</b> ${esc(x.n)} (${esc(x.p)}): ${esc(x.why)}.</div>` });
  if(H.up.length)h+=`<div class="bnews small"><b>Up from the reserve list:</b> ${L(H.up,x=>`${esc(x.n)} (${esc(x.p)}, ${x.age}) rated ${x.r}`)}.</div>`;
  if(H.res.length)h+=`<div class="bnews small"><b>Entry-level deals:</b> ${L(H.res,x=>`${esc(x.n)} (${esc(x.p)})`)} signed and stay on the reserve list.</div>`;
  if(H.floor>0)h+=`<div class="bnews small">Under the floor, the one-year men were paid ${hkMoney(H.floor)} more to reach it.</div>`;
  return h }
