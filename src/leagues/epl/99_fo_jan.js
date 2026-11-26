/* ============ the January window, engine 27: English football ============ */
/* The window opens on 1 January and shuts on 2 February (the Premier League's dates for 2026-27: 1 January to 1 February,
   11pm: https://www.liverpoolfc.com/news/premier-league-confirms-dates-2026-27-transfer-windows). Engine 27 replaces the
   round-83 swaps with fees: you bid for a man and his club answers as in the summer (tAnswer27: accept, counter, refuse,
   or a release clause it can't refuse); clubs bid for yours. The twelve stay whole: a club that sells takes the buyer's
   spare man at that position on loan until the summer (a January loan the other way, as real deals often carry), and he
   goes home when the summer opens (loanBack27). The money: what the board keeps back for January (12% of the summer's
   share of revenue; January spending is about an eighth of the summer's: £372M in January 2025 and about £400M in
   January 2026 against £3.0bn in summer 2025, https://www.gbnews.com/sport/football/premier-league-winter-transfer-window-deadline-day
   and https://www.deloitte.com/uk/en/about/press-room/deloitte-premier-league-spending-record-eclipsed.html), plus what
   was saved from the summer, plus 80% of what you take in now. A fee of £10M or more goes 40% now and the rest over the
   next two summers. On the window's last day the computer's clubs do their own business: the clubs at the bottom
   buying to stay up and the clubs at the top to win the league (or to go up), the richest first, a few deals a
   division. Everything here is kept as the round-83 trades are (S.promos for yours, the season's cpuTr for theirs), so
   a reload replays it, and carried into next season's rosters and books at the season's end. */
const J27_ALLOW=0.12;                 // of the summer's share of revenue, kept back for January
const J27_CPU={PL:7,CH:5};            // the computer's deals on deadline day, a division
const jOn27=()=>fo27()&&typeof SEA!=="undefined"&&!!SEA&&!!SEA.roster;
function jU27(sea){ const o=Object.create(U); o.roster=(sea||SEA).roster; return o }   // the summer's functions, on the season's rosters
function jAllow27(u,t){ const d=CONF[t], r=ledgerDiv(d)?rev27(u,t,d):null; return r?Math.round(r.tot*M27.kit*J27_ALLOW*10)/10:0 }
// this season's January deals: yours (kept among the promotions) and the computer's
function jDeals27(sea,cpuOnly){ sea=sea||SEA; const o=[];
  if(!cpuOnly&&typeof tdAllTrades==="function")tdAllTrades().forEach(x=>{ if(x.epl27)o.push(x) });
  ((sea&&sea.cpuTr)||[]).forEach(x=>{ if(x.epl27)o.push(x) }); return o }
// money for fees now: January's allowance and the summer's savings, less what's gone down, plus 80% of what's come in
function jMoney27(t,sea,cpuOnly){ let k=jAllow27(U,t)+((U.kitty&&U.kitty[t])||0);
  jDeals27(sea,cpuOnly).forEach(x=>{ if(x.buyer===t)k-=x.now; if(x.seller===t)k+=x.now*0.8 });
  return Math.max(0,Math.round(k*10)/10) }
const jDown27=(fee,inst)=>inst&&fee>=T27_INST?Math.round((fee-2*Math.round(fee*0.3*10)/10)*10)/10:fee;
const jHurt27=(sea,t,i)=>sea.talent&&sea.talent.active(t).some(e=>e.idx===i);
// who of the buyer's goes the other way on loan: the weaker of the two at that position (the backup, as a rule)
function jSpare27(R,i){ const s=R[i], b=R[BK(i)]; if(!b)return s?i:-1; if(!s)return BK(i); return b.r<=s.r?BK(i):i }
// men in this season's January deals: not sold on in the same window
function jMoved27(sea){ const m={}; jDeals27(sea).forEach(x=>{ m[x.pn]=1; m[x.ln]=1 }); return m }

/* the market for you: who'd improve your twelve, from clubs in your division and the ones next to it */
function jTargets27(my){
  const sea=SEA, u=jU27(), R=sea.roster[my], H=nflHumans(), out=[], mv=jMoved27(sea), tm=DIVS[CONF[my]].tier;
  NAMES.forEach(t=>{ const T=sea.roster[t]; if(t===my||H.indexOf(t)>=0||!T||Math.abs(DIVS[CONF[t]].tier-tm)>1)return;
    const W=tWilling(u,my,t);
    T.forEach((p,j)=>{ if(!p||!p.k||mv[p.n]||jHurt27(sea,t,j))return;
      const i=j%POS.length, s=R[i], b=R[BK(i)];
      const better=s?p.r>=s.r+2:true, depth=b?p.r>=b.r+6&&p.r>=(s?s.r-3:0):false; if(!better&&!depth)return;
      out.push({key:tKey(t,p),n:p.n,p:p.p,i:i,j:j,team:t,age:p.age,r:p.r,pot:p.pot,fee:ask27(u,t,p,j<POS.length,mustSell27(u,t)),wage:nflAsk(p.r,p.p,p.age),
        willing:W.ok,why:W.why||"",starter:better,rc:rcl27(u,t,p),hg:hg27(p,CONF[t]),yrs:p.k.yrs}) }) });
  return out.sort((a,b)=>(b.r-a.r)||(a.fee-b.fee)) }
/* what stands in the way of a deal you've agreed a fee for: money, wages, the squad list, the man going the other way */
function jCheck27(my,x,fee,inst){
  const sea=SEA, u=jU27(), R=sea.roster[my], a=jSpare27(R,x.i); if(a<0)return {why:"you have nobody at his position to send the other way"};
  if(jHurt27(sea,my,a))return {why:`${R[a].n}, who'd go the other way, is injured`};
  const down=jDown27(fee,inst), m=jMoney27(my); if(down>m+0.05)return {why:`${money(down)}${inst&&fee>=T27_INST?" down":""} is more than you have (${money(m)})`};
  const out=R[a], pay=payroll(R)-((out.k&&out.k.sal)||0)+x.wage; if(pay>budgetOf(u,my)+0.05)return {why:`his ${money(x.wage)} a year won't fit the wage budget`};
  const T=sea.roster[x.team], p=T&&T[x.j]; if(!p||p.n!==x.n)return {why:"he's no longer there"};
  if(hgBreak27(R,p,out,CONF[my]))return {why:"the squad list: he'd be a ninth player over 21 who isn't homegrown (17 of 25)"};
  return {ok:true,a:a,out:out,down:down} }
function jRecord27(o){ return Object.assign({epl27:1,y:SEA.year,d:(LEAGUE.dates||[])[SEA.step]||"",step:SEA.step},o) }
/* bids for your men: clubs he'd go to (bigger, or a division up) that he'd start for, with the money down and the wage room */
function jOffers27(my){
  const sea=SEA, u=jU27(), R=sea.roster[my], H=nflHumans(), mv=jMoved27(sea), out=[];
  R.forEach((p,j)=>{ if(!p||!p.k||p.r<55||mv[p.n]||jHurt27(sea,my,j))return; const i=j%POS.length; let best=null, bk=-1;
    NAMES.forEach(t=>{ const T=sea.roster[t]; if(t===my||H.indexOf(t)>=0||!T||!ledgerDiv(CONF[t]))return;
      if(!tWilling(u,t,my).ok||!(T[i]&&p.r>=T[i].r+3))return; const k=jSpare27(T,i); if(k<0||jHurt27(sea,t,k))return;
      const wage=nflAsk(p.r,p.p,p.age); if(payroll(T)-((T[k].k&&T[k].k.sal)||0)+wage>budgetOf(u,t))return;
      if(hgBreak27(T,p,T[k],CONF[t]))return;
      const ask=ask27(u,my,p,j<POS.length,false); if(jDown27(ask*0.9,true)>jMoney27(t))return;
      if(!best||(u.program[t]||0)>(u.program[best]||0)){ best=t; bk=k } });
    if(best){ const ask=ask27(u,my,p,j<POS.length,false);
      out.push({key:tKey(my,p),n:p.n,p:p.p,r:p.r,age:p.age,j:j,team:best,k:bk,ln:sea.roster[best][bk].n,fee:Math.round(ask*0.9*10)/10,ask:ask,starter:j<POS.length,wage:nflAsk(p.r,p.p,p.age)}) } });
  return out.sort((a,b)=>b.fee-a.fee).slice(0,3) }

/* carried out: the swap the round-83 trade makes (each man into the other's slot, the better of two starting), money
   kept with the deal for the books at the season's end */
function eplJanApply(sea,x){ const y=Object.assign({},x); delete y.epl27; return tdApply(sea,y) }
function eplJanCarry(u,x){
  const P=(u.roster[x.seller]||[]).find(p=>p&&p.n===x.pn), L=(u.roster[x.buyer]||[]).find(p=>p&&p.n===x.ln); if(!P||!L)return;
  u.saleP=u.saleP||{}; u.kitty=u.kitty||{};
  if(x.inst&&x.fee>=T27_INST)inst27(u,x.buyer,x.seller,x.fee,u.year);
  // the buyer: January's allowance goes first, then the summer's savings
  if(!u._j27||u._j27.y!==u.year)Object.defineProperty(u,"_j27",{value:{y:u.year,sp:{}},writable:true,configurable:true,enumerable:false});
  const a=jAllow27(u,x.buyer), s0=u._j27.sp[x.buyer]||0, s1=s0+x.now; u._j27.sp[x.buyer]=s1;
  const fromSaved=Math.max(0,s1-a)-Math.max(0,s0-a); u.kitty[x.buyer]=Math.round(Math.max(0,(u.kitty[x.buyer]||0)-fromSaved)*10)/10;
  u.kitty[x.seller]=Math.round(((u.kitty[x.seller]||0)+x.now*0.5)*10)/10;
  u.saleP[x.seller]=Math.round(((u.saleP[x.seller]||0)+x.fee-bookLeft27(P))*10)/10;
  P.k={sal:x.wage,yrs:x.yrs}; book27(P,x.fee,x.yrs); P.rcl=undefined; P.from=x.seller;
  L.loan={from:x.buyer,y:u.year+1} }

/* the window's last day: the computer's clubs. In each of the top two divisions, the clubs with most at stake (the
   bottom five, to stay up; the top four, to win it or go up), the richest first, each buys the man who helps it most
   for what it can put down now, from a club its size or smaller in its division or one below; a club sells once */
function jCpu27(sea){
  if(sea._j27===sea.year||sea.step!==ctDeadline())return; sea._j27=sea.year;
  const u=jU27(sea), H=sea.humans||[], used={}, out=[];
  ["PL","CH"].forEach(d=>{ const tbl=sea.table(d), n=tbl.length; let made=0;
    const buyers=tbl.map((t,i)=>({t:t,pos:i+1})).filter(c=>H.indexOf(c.t)<0&&sea.roster[c.t]&&(c.pos<=4||c.pos>n-5))
      .map(c=>Object.assign(c,{m:jMoney27(c.t,sea,true)})).sort((a,b)=>b.m-a.m||(a.t<b.t?-1:1));
    buyers.forEach(c=>{ if(made>=J27_CPU[d]||used[c.t]||c.m<1)return; const B=c.t, RB=sea.roster[B]; let best=null;
      NAMES.forEach(Sl=>{ const RS=sea.roster[Sl]; if(Sl===B||used[Sl]||H.indexOf(Sl)>=0||!RS)return;
        const td=DIVS[CONF[Sl]].tier-DIVS[d].tier; if(td<0||td>1||(td===0&&(u.program[Sl]||0)>(u.program[B]||0)))return;
        RS.forEach((p,j)=>{ if(!p||!p.k||jHurt27(sea,Sl,j)||(p.age||25)>31)return; const i=j%POS.length, s=RB[i]; if(s&&p.r<s.r+3)return;
          const k=jSpare27(RB,i); if(k<0||jHurt27(sea,B,k))return;
          const fee=ask27(u,Sl,p,j<POS.length,mustSell27(u,Sl)), now=jDown27(fee,true); if(now>c.m)return;
          const wage=nflAsk(p.r,p.p,p.age); if(payroll(RB)-((RB[k].k&&RB[k].k.sal)||0)+wage>budgetOf(u,B)*1.02)return;
          if(hgBreak27(RB,p,RB[k],d))return;
          const v=(p.r-(s?s.r:40))*POS[i].w/(0.2+now/c.m); if(!best||v>best.v)best={v:v,Sl:Sl,j:j,k:k,p:p,fee:fee,now:now,wage:wage} }) });
      if(!best)return;
      const x=jRecord27({cpu:1,my:B,t:best.Sl,a:best.k,b:best.j,gn:RB[best.k].n,qn:best.p.n,buyer:B,seller:best.Sl,pn:best.p.n,ln:RB[best.k].n,
        fee:best.fee,now:best.now,inst:best.fee>=T27_INST,wage:best.wage,yrs:Math.min(5,Math.max(2,nflYears(best.p.age,best.p.p))),r:best.p.r,pp:best.p.p,d:(LEAGUE.dates||[])[sea.step]||"",step:sea.step,y:sea.year});
      if(tdApply(sea,x)){ out.push(x); used[B]=used[best.Sl]=1; made++; c.m-=best.now } }) });
  sea.cpuTr=(sea.cpuTr||[]).concat(out) }

/* ---- the screen: the Transfers tab in January ---- */
let J27_UI={};
function jNeg27(k){ if(!S.j27||S.j27.y!==SEA.year)S.j27={y:SEA.year,neg:{}}; return S.j27.neg[k]=S.j27.neg[k]||{} }
function jPl27(t,n,pos,r,age){ return `${plLink(t,n)} <span style="color:var(--muted)">${esc(pos)} ${r}${age?`, ${age}`:""}</span>` }
function jNewsHTML27(all){ const L=jDeals27(SEA,true).filter(x=>x.cpu&&(all||CONF[x.buyer]===CONF[S.myTeam]||CONF[x.seller]===CONF[S.myTeam])); if(!L.length)return "";
  return `<div class="card" style="padding:8px 12px;margin:8px 0"><div class="olab">Deadline day</div>${L.map(x=>`<div style="margin:4px 0">${esc(x.buyer)} signed ${plLink(x.buyer,x.pn)} <span style="color:var(--muted)">${esc(x.pp||"")} ${x.r||""}</span> from ${esc(x.seller)} for ${money(x.fee)}; ${esc(x.ln)} goes the other way on loan.</div>`).join("")}</div>` }
function jView27(){
  const my=S.myTeam, st=tdState(), d=CONF[my], R=SEA.roster[my];
  let h=`<div class="note">${esc(st.why)} Up to ${TD_MAX} deals a window. You bid a fee and the club answers; a club that sells takes your spare man at that position on loan until the summer, so both twelves stay whole.</div>`;
  if(J27_UI.done)h+=`<div class="card" style="padding:10px 12px;margin:8px 0"><b>Done.</b> ${esc(J27_UI.done)}</div>`;
  h+=jNewsHTML27(true);
  const mine=jDeals27().filter(x=>!x.cpu);
  if(mine.length)h+=`<div class="grouphead">Your deals this window</div><div class="card" style="padding:6px 12px">${mine.map(x=>`<div style="margin:4px 0">${esc(x.d)}: ${x.buyer===my?`signed ${esc(x.pn)} from ${esc(x.seller)} for ${money(x.fee)}${x.inst&&x.fee>=T27_INST?` (${money(x.now)} now)`:""}; ${esc(x.ln)} on loan to them`:`sold ${esc(x.pn)} to ${esc(x.buyer)} for ${money(x.fee)}${x.inst&&x.fee>=T27_INST?` (${money(x.now)} now)`:""}; ${esc(x.ln)} on loan to you`}</div>`).join("")}</div>`;
  if(ledgerDiv(d)){ const sales=(U.saleP&&U.saleP[my])||0; h+=finCard27(U,my,d,{title:"The books this season",R:R,sales:sales}) }
  h+=`<div class="budgetleft done">Money for fees ${money(jMoney27(my))} &middot; wage room ${money(Math.max(0,budgetOf(jU27(),my)-payroll(R)))} a year</div>`;
  if(!st.open)return h;
  // bids for yours
  const offers=jOffers27(my);
  h+=`<div class="grouphead">Bids for your players</div>`;
  h+=offers.length?offers.map(o=>{ const ng=jNeg27("s|"+o.key), fee=ng.fee||o.fee;
    return `<div class="drow"><div class="fmain"><div class="fname">${esc(o.team)} bid ${money(fee)} for ${jPl27(my,o.n,o.p,o.r,o.age)}</div>
      <div class="fnote">${o.starter?"Your starter":"A backup"} &middot; your price ${money(o.ask)}${fee>=T27_INST?" &middot; 40% now, the rest over two summers":""} &middot; ${esc(o.ln)} would come to you on loan until the summer${ng.gone?` &middot; <b>${esc(ng.gone)}</b>`:""}</div></div>
      ${ng.gone?"":`<span><button class="skip small" data-j27sell="${esc(o.key)}">Sell</button>${ng.fee?"":` <button class="skip small" data-j27more="${esc(o.key)}">Ask for more</button>`}</span>`}</div>` }).join("")
    :`<div class="note">Nobody bigger is bidding for anyone of yours.</div>`;
  // agreed fees waiting to be signed, and talks
  const neg=(S.j27&&S.j27.y===SEA.year&&S.j27.neg)||{}, mkt=jTargets27(my), byKey={}; mkt.forEach(x=>byKey[x.key]=x);
  const open=Object.keys(neg).filter(k=>/^b\|/.test(k)&&byKey[k.slice(2)]&&(neg[k].agreed||neg[k].why));
  if(open.length){ h+=`<div class="grouphead">Talks</div>`;
    h+=open.map(k0=>{ const k=k0.slice(2), x=byKey[k], ng=neg[k0];
      if(ng.agreed){ const c=jCheck27(my,x,ng.agreed,ng.inst!==false), out=c.ok?c.out:null;
        return `<div class="drow"><div class="fmain"><div class="fname">${jPl27(x.team,x.n,x.p,x.r,x.age)} &middot; ${esc(x.team)} agree ${money(ng.agreed)}</div>
          <div class="fnote">${ng.agreed>=T27_INST?(ng.inst!==false?`${money(jDown27(ng.agreed,true))} now, the rest over two summers`:"all of it now"):"paid now"} &middot; ${money(x.wage)} a year for ${Math.min(5,Math.max(2,nflYears(x.age,x.p)))} years${out?` &middot; ${esc(out.n)} (${esc(out.p)} ${out.r}) goes to them on loan`:` &middot; <b>${esc(c.why)}</b>`}</div>
          <div class="fnote">${ng.agreed>=T27_INST?`<button class="skip small" data-j27inst="${esc(k)}">${ng.inst!==false?"Pay it all now":"In instalments"}</button> `:""}${c.ok?`<button class="promo" data-j27sign="${esc(k)}">Sign him</button> `:""}<button class="skip small" data-j27drop="${esc(k)}">Walk away</button></div></div></div>` }
      return `<div class="drow"><div class="fmain"><div class="fname">${jPl27(x.team,x.n,x.p,x.r,x.age)} &middot; ${esc(x.team)}</div><div class="fnote">You bid ${money(ng.offer)}: ${esc(ng.why)}</div></div>
        ${ng.want?`<button class="skip small" data-j27acc="${esc(k)}">Pay ${money(ng.want)}</button>`:""}</div>` }).join("") }
  // the market
  h+=`<div class="grouphead">The market &mdash; who'd improve you</div>`;
  if(d==="PL"){ const nh=nonHG27(R,"PL"); if(nh>=HG_MAX)h+=`<div class="note">Squad list: ${nh} of your twelve are over 21 and not homegrown, and the rule allows ${HG_MAX} (17 of 25): a signing has to be homegrown or 21 or under, unless the man going the other way isn't.</div>` }
  POS.forEach((P2,i)=>{ const s=R[i], list=mkt.filter(x=>x.i===i&&!neg["b|"+x.key]);
    const will=list.filter(x=>x.willing).slice(0,3), no=list.filter(x=>!x.willing).length;
    h+=`<div class="divhead">${esc(P2.p)} &middot; your starter ${s?esc(s.n)+", "+s.r:"none"}</div>`;
    h+=will.length?will.map(x=>{ const lo=Math.round(x.fee*0.8*10)/10;
      return `<div class="drow"><div class="fmain"><div class="fname">${jPl27(x.team,x.n,x.p,x.r,x.age)} <span class="ptag">${x.starter?"would start":"depth"}</span>${d==="PL"&&x.hg?` <span class="ptag">homegrown</span>`:""}</div>
      <div class="fnote">${esc(x.team)} (${esc(LEAGUE.groupShort(CONF[x.team]))})${x.pot>x.r+2?` &middot; ceiling ${x.pot}`:""} &middot; asking ${money(x.fee)}${x.rc?`, release clause ${money(x.rc)}`:""} &middot; ${money(x.wage)} a year${x.yrs<=1?" &middot; out of contract in the summer":""}</div>
      <div class="fnote"><button class="skip small" data-j27off="${esc(x.key)}|${lo}">Bid ${money(lo)}</button> <button class="skip small" data-j27off="${esc(x.key)}|${x.fee}">Bid ${money(x.fee)}</button>${x.rc?` <button class="skip small" data-j27off="${esc(x.key)}|${x.rc}">Meet his clause</button>`:""}</div></div></div>` }).join(""):`<div class="note">Nobody who'd come is better than what you have.</div>`;
    if(no)h+=`<div class="note">${no} better player${no===1?"":"s"} at ${esc(P2.p)} won't come: bigger clubs, or a higher division.</div>` });
  return h }
function jDo27(x,msg){ S.promos=S.promos||{}; const k=SEA.step; if(!tdApply(SEA,x))return false; (S.promos[k]=S.promos[k]||[]).push({tr:x}); J27_UI={done:msg}; return true }
function jBind27(){
  const my=()=>S.myTeam, find=k=>jTargets27(my()).find(m=>m.key===k);
  document.querySelectorAll("[data-j27off]").forEach(b=>b.onclick=()=>{ const s=b.dataset.j27off, i=s.lastIndexOf("|"), k=s.slice(0,i), f=+s.slice(i+1), x=find(k); if(!x)return;
    const p=SEA.roster[x.team][x.j], ng=jNeg27("b|"+k), a=tAnswer27(jU27(),my(),x.team,p,x.j<POS.length,f,ng);
    if(a.ok)Object.assign(ng,{agreed:f,inst:true,why:null,want:null}); else Object.assign(ng,{offer:f,why:a.why,want:a.refuse?a.want:a.counter});
    J27_UI={}; save(); render() });
  document.querySelectorAll("[data-j27acc]").forEach(b=>b.onclick=()=>{ const ng=jNeg27("b|"+b.dataset.j27acc); if(ng.want)Object.assign(ng,{agreed:ng.want,inst:true}); save(); render() });
  document.querySelectorAll("[data-j27inst]").forEach(b=>b.onclick=()=>{ const ng=jNeg27("b|"+b.dataset.j27inst); ng.inst=ng.inst===false; save(); render() });
  document.querySelectorAll("[data-j27drop]").forEach(b=>b.onclick=()=>{ delete S.j27.neg["b|"+b.dataset.j27drop]; save(); render() });
  document.querySelectorAll("[data-j27sign]").forEach(b=>b.onclick=()=>{ const k=b.dataset.j27sign, x=find(k), ng=jNeg27("b|"+k); if(!x||!ng.agreed||!tdState().open)return;
    const inst=ng.inst!==false, c=jCheck27(my(),x,ng.agreed,inst); if(!c.ok)return;
    tapTwice(b,"Confirm",()=>{ const R=SEA.roster[my()], yrs=Math.min(5,Math.max(2,nflYears(x.age,x.p)));
      const rec=jRecord27({my:my(),t:x.team,a:c.a,b:x.j,gn:c.out.n,qn:x.n,buyer:my(),seller:x.team,pn:x.n,ln:c.out.n,fee:ng.agreed,now:c.down,inst:inst&&ng.agreed>=T27_INST,wage:x.wage,yrs:yrs,r:x.r,pp:x.p});
      if(jDo27(rec,`${x.n} signs from ${x.team} for ${money(ng.agreed)}; ${c.out.n} goes to them on loan.`))delete S.j27.neg["b|"+k]; save(); render() }) });
  document.querySelectorAll("[data-j27more]").forEach(b=>b.onclick=()=>{ const k=b.dataset.j27more, o=jOffers27(my()).find(x=>x.key===k), ng=jNeg27("s|"+k); if(!o||ng.fee||ng.gone)return;
    const a=tMore27(jU27(),o); if(a.ok)ng.fee=a.fee; else ng.gone=a.why; save(); render() });
  document.querySelectorAll("[data-j27sell]").forEach(b=>b.onclick=()=>{ const k=b.dataset.j27sell, o=jOffers27(my()).find(x=>x.key===k), ng=jNeg27("s|"+k); if(!o||ng.gone||!tdState().open)return;
    tapTwice(b,"Confirm",()=>{ const fee=ng.fee||o.fee, rec=jRecord27({my:my(),t:o.team,a:o.j,b:o.k,gn:o.n,qn:o.ln,buyer:o.team,seller:my(),pn:o.n,ln:o.ln,fee:fee,now:jDown27(fee,true),inst:fee>=T27_INST,wage:o.wage,yrs:Math.min(5,Math.max(2,nflYears(o.age,o.p))),r:o.r,pp:o.p});
      jDo27(rec,`${o.n} sold to ${o.team} for ${money(fee)}; ${o.ln} comes to you on loan.`); save(); render() }) });
}
/* the hooks: engine 27 takes the January window over; a season begun on engine 26 keeps the round-83 swaps */
LEAGUE.trade.on=jOn27;
LEAGUE.trade.view=jView27; LEAGUE.trade.bind=jBind27;
LEAGUE.trade.cpu=function(sea){ if(!fo27())return false; jCpu27(sea); return true };
LEAGUE.trade.offerCard=function(){ return "" };
LEAGUE.trade.news=function(){ const L=jDeals27(SEA,true).filter(x=>x.cpu); if(!L.length||SEA.phase!=="week")return ""; const k=SEA.step-L[L.length-1].step; if(k<1||k>3)return ""; return jNewsHTML27(false) };
LEAGUE.trade.tab=()=>jOn27()?"Transfers":"Trades";
