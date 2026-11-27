/* ============ the front office's screens and hooks: English football (engine 27) ============ */
/* After the cup (87_cup sets LEAGUE.afterWeek): the 1 March check of the spending rule rides on it. */
{ const _aw=LEAGUE.afterWeek; LEAGUE.afterWeek=function(sea,w){ if(_aw)_aw(sea,w); if(fo27()&&w===MAR1-1)assess27(sea) } }
{ const _pts=LEAGUE.points; LEAGUE.points=function(t,sea){ return _pts(t,sea)-((sea&&sea.ded&&sea.ded[t])||0) } }

/* ---- the club's books: a card (the summer's window, the January window, the club page) ---- */
const pct27=x=>Math.round(x*100)+"%";
function finCard27(u,t,d,opts){
  opts=opts||{}; d=d||CONF[t]; const R=opts.R||u.roster[t]||[], r=rev27(u,t,d,opts.pos,opts.next); if(!r)return "";
  const rc=opts.next&&down27(u,t)?M27.relWage:1;   // follow-up: going down, the relegation clauses cut the wages as the drop is made
  const sales=opts.sales!=null?opts.sales:0, sq=sq27(u,t,d), am=amort27(R), cost=rc===1?cost27(R,sq):Math.round(sq*(payroll(R)*rc+am)*10)/10, ratio=cost/Math.max(1,r.tot+sales);
  const line=ratio>M27.red?"over the red line: points off on 1 March":ratio>M27.green?"over the 85% line: a levy, no points":"inside the rule";
  const parts=[["Television (equal share)",d==="PL"?r.tv:null],["Merit, "+(opts.pos?ordinal(opts.pos):"by where you're expected to finish"),d==="PL"?r.merit:null],["Facility fees",d==="PL"?r.fac:null],
    ["Television and solidarity",d==="CH"?r.tv:null],["Parachute payment",r.chute||null],["Matchday, commercial and the rest",r.own]].filter(x=>x[1]!=null);
  return `<div class="card" style="padding:10px 12px;margin:8px 0"><div class="olab">${esc(opts.title||"The books")}</div>
    <div style="margin:4px 0">Revenue ${money(r.tot)} a year: ${parts.map(([l,v])=>`${esc(l)} ${money(v)}`).join(" &middot; ")}.</div>
    <div style="margin:4px 0">Squad costs ${money(cost)}: the squad's wages (the twelve here are ${money(payroll(R)*rc)} of them${rc<1?", after the relegation clauses":""})${am?`, and ${money(sq*am)} of transfer fees written off this year`:", no transfer fees to write off"}.</div>
    <div style="margin:4px 0"><b>Squad cost ratio ${pct27(ratio)}</b>${sales?` (revenue plus ${money(sales)} profit on sales)`:""}: ${esc(line)}. The board's own line is ${pct27(M27.board[d])}.</div>
    <div class="fnote">The ${esc(LEAGUE.conf.names[d])}'s rule: squad costs up to 85% of revenue; over it a levy, and over 115% on 1 March six points off and one more for every &pound;6.5M over.</div></div>` }

/* ---- the summer's window, engine 27 ---- */
const T27=()=>S.off.picks;
function tNeg27(k){ const P=T27(); P.neg=P.neg||{}; return P.neg[k]=P.neg[k]||{} }
function tWindowHTML27(P){
  const my=S.myTeam, H=nflHumans(), d=tNextConf(my), pay=nflPlannedPay();
  const offers=tOffers(U,my,H), sales=P.sales||[], salesNow=sales.reduce((a,o)=>a+(o.fee>=T27_INST?o.fee-2*Math.round(o.fee*0.3*10)/10:o.fee),0);
  const kitty=(P.kitty!=null?P.kitty:(kitty27(U,my,d,true)||0))+salesNow;
  const mkt=tMarket(U,my,H), byKey={}; mkt.forEach(x=>byKey[x.key]=x);
  const bids=(P.bids||[]).filter(k=>byKey[k]), BT=P.bidTerms||{};
  let h="";
  if(ledgerDiv(d))h+=finCard27(U,my,d,{title:`The books for ${SEA.year+1}-${String(SEA.year+2).slice(2)}`,next:true});
  const owe=owed27(U,my,U.year), due=due27(U,my,U.year), levy=(U.levy&&U.levy[my])||0, carry=(U.kitty&&U.kitty[my])||0;
  h+=`<div class="budgetleft done">Money for fees ${money(kitty)} &middot; wage room ${money(Math.max(0,LEAGUE.budgetOf(U,my)-pay))} a year</div>
    <div class="note">${ledgerDiv(d)?`The board gives you ${pct27(M27.kit[d])} of revenue for fees${d==="PL"&&CONF[my]!=="PL"?", half as much again in a promoted club's first summer":""}`:"The money for fees comes from the wage bill and earnings"}${carry?`, plus ${money(carry)} saved from last summer`:""}${owe?`, less ${money(owe)} of instalments due on earlier deals`:""}${due?`, plus ${money(due)} due to you from earlier sales`:""}${levy?`, less a ${money(levy)} levy for last season's squad costs`:""}${salesNow?`, plus ${money(salesNow)} from sales now`:""}. A fee of ${money(T27_INST)} or more can go in instalments: 40% now, the rest over the next two summers.</div>`;
  // bids for your players
  h+=`<div class="grouphead">Bids for your players</div>`;
  h+=offers.length?offers.map(o=>{ const ng=tNeg27("s|"+o.key), on=sales.find(x=>x.key===o.key), fee=ng.fee||o.fee;
    return `<div class="cand ${on?'on':''}"><div class="candtop"><div>
      <div class="fname">${esc(o.team)} bid ${money(fee)} for ${esc(o.n)} <span class="dpos">${esc(o.p)}</span></div>
      <div class="fnote">${o.starter?"Your starter":"A backup"} &middot; rated ${o.r} &middot; age ${o.age} &middot; ${esc(LEAGUE.conf.names[tNextConf(o.team)])} &middot; your price ${money(o.ask)}${fee>=T27_INST?" &middot; paid 40% now, the rest over two summers":""}${ng.gone?` &middot; <b>${esc(ng.gone)}</b>`:""}</div></div>
      ${ng.gone?"":on?`<button class="skip small" data-t27sell="${esc(o.key)}">Keep him</button>`:`<span><button class="skip small" data-t27sell="${esc(o.key)}">Sell</button>${ng.fee?"":` <button class="skip small" data-t27more="${esc(o.key)}">Ask for more</button>`}</span>`}</div></div>` }).join("")
    :`<div class="note">Nobody bigger is bidding for anyone of yours this summer.</div>`;
  // your bids: agreed, in order
  let left=kitty, wl=LEAGUE.budgetOf(U,my)-pay+sales.reduce((a,o)=>{const p=U.roster[my].find(q=>q&&tKey(my,q)===o.key);return a+(p?p.k.sal:0)},0);
  h+=`<div class="grouphead">Deals agreed</div>`;
  h+=bids.length?bids.map((k,i)=>{ const x=byKey[k], T=BT[k]||{}, wage=T.wage||x.wage, down=T.inst&&T.fee>=T27_INST?T.fee-2*Math.round(T.fee*0.3*10)/10:T.fee;
      const rv=tRival27(U,my,x.team,U.roster[x.team].find(q=>q&&tKey(x.team,q)===k)||{p:x.p,r:x.r,age:x.age},H);
      let fit=down>left+0.05?"more than you have left":wage>wl+0.05?"his wages won't fit":rv&&!(T.pay>=T27_RIVAL_PAY)?`${rv} want him too, and he'd choose them`:"fits"; if(fit==="fits"){ left-=down; wl-=wage }
      return `<div class="drow"><span class="dpick">${i+1}.</span><div class="fmain"><div class="fname">${esc(x.n)} <span class="dpos">${esc(x.p)}</span> from ${esc(x.team)}</div>
      <div class="fnote">${money(T.fee)}${T.clause?" (his release clause)":""}${T.inst&&T.fee>=T27_INST?`, ${money(down)} now`:""} &middot; ${money(wage)} a year for ${T.yrs} years &middot; <b>${esc(fit)}</b></div>
      <div class="fnote">${T.fee>=T27_INST?`<button class="skip small" data-t27inst="${esc(k)}">${T.inst?"Pay it all now":"In instalments"}</button> `:""}${[3,4,5].map(y=>`<button class="skip small" data-t27yrs="${esc(k)}|${y}" aria-pressed="${T.yrs===y}">${y} years</button>`).join(" ")}${rv?` <button class="skip small" data-t27pay="${esc(k)}">${T.pay>=T27_RIVAL_PAY?"Usual wages":"Pay him a quarter more"}</button>`:""} <button class="skip small" data-bidrm="${esc(k)}">Withdraw</button></div></div></div>` }).join("")+`<div class="note">They go through in this order when the window opens, while the money lasts. A fee is written off over the contract (five years at most): a longer deal costs less a year against the rule.</div>`
    :`<div class="note">None yet. Make an offer below: the club answers at once.</div>`;
  // talks under way
  const talks=Object.keys(P.neg||{}).filter(k=>/^b\|/.test(k)&&byKey[k.slice(2)]&&bids.indexOf(k.slice(2))<0);
  if(talks.length){ h+=`<div class="grouphead">Talks</div>`;
    h+=talks.map(k0=>{ const k=k0.slice(2), x=byKey[k], ng=P.neg[k0];
      return `<div class="drow"><div class="fmain"><div class="fname">${esc(x.n)} <span class="dpos">${esc(x.p)}</span> &middot; ${esc(x.team)}</div>
        <div class="fnote">You bid ${money(ng.offer)}: ${esc(ng.why||"")}</div></div>
        ${ng.want?`<button class="skip small" data-t27acc="${esc(k)}">Pay ${money(ng.want)}</button>`:""}</div>` }).join("") }
  // the market
  h+=`<div class="grouphead">The market &mdash; who'd improve you</div>`;
  const R=U.roster[my];
  if(d==="PL"){ const nh=nonHG27(R,"PL"); h+=`<div class="note">Squad list: ${nh} of your twelve are over 21 and not homegrown; the rule allows ${HG_MAX} (17 of 25)${nh>=HG_MAX?`, so ${nh>HG_MAX?"you're over it and ":""}a signing has to be homegrown or 21 or under, unless he replaces a man who isn't`:""}.</div>` }
  POS.forEach((P2,i)=>{
    const st=R[i], list=mkt.filter(x=>x.i===i&&bids.indexOf(x.key)<0&&!(P.neg&&P.neg["b|"+x.key]));
    const can=x=>x.fee<=kitty?1:0;
    const will=list.filter(x=>x.willing).sort((a,b)=>(can(b)-can(a))||(b.r-a.r)).slice(0,3), no=list.filter(x=>!x.willing).length;
    h+=`<div class="divhead">${esc(P2.p)} &middot; your starter ${st?esc(st.n)+", "+st.r:"none"}</div>`;
    h+=will.length?will.map(x=>{ const lo=Math.round(x.fee*0.8*10)/10;
      return `<div class="drow"><div class="fmain"><div class="fname">${esc(x.n)} <span class="dpos">${esc(x.p)}</span> <span class="ptag">${x.starter?"would start":"depth"}</span>${d==="PL"&&x.hg?` <span class="ptag">homegrown</span>`:""}</div>
      <div class="fnote">${esc(x.team)} (${esc(LEAGUE.groupShort(CONF[x.team]))}) &middot; age ${x.age} &middot; rated ${x.r}${x.pot>x.r+2?", ceiling "+x.pot:""} &middot; asking ${money(x.fee)}${x.rc?`, release clause ${money(x.rc)}`:""} &middot; ${money(x.wage)} a year</div>
      <div class="fnote"><button class="skip small" data-t27off="${esc(x.key)}|${lo}">Bid ${money(lo)}</button> <button class="skip small" data-t27off="${esc(x.key)}|${x.fee}">Bid ${money(x.fee)}</button>${x.rc?` <button class="skip small" data-t27off="${esc(x.key)}|${x.rc}">Meet his clause</button>`:""}</div></div></div>` }).join(""):`<div class="note">Nobody who'd come is better than what you have.</div>`;
    if(no)h+=`<div class="note">${no} better player${no===1?"":"s"} at ${esc(P2.p)} won't come: bigger clubs, or higher divisions.</div>`;
  });
  // loans
  const LO=P.loans||[], LI=P.loansIn||[];
  const young=R.map((p,j)=>({p:p,j:j})).filter(x=>x.p&&x.p.age+1<=LOAN_AGE+1&&!x.p.loan&&x.j>=POS.length);
  h+=`<div class="grouphead">Loans</div><div class="note">A young player out on loan plays a season a division or two down, for a club that pays his wages, and comes back better for the minutes. One out and one in a summer.</div>`;
  h+=young.length?young.map(({p})=>{ const k=tKey(my,p), on=LO.indexOf(k)>=0, dest=loanDest27(U,my,p,H);
      return `<div class="drow"><div class="fmain"><div class="fname">${esc(p.n)} <span class="dpos">${esc(p.p)}</span></div><div class="fnote">Age ${p.age} &middot; rated ${p.r}${p.pot>p.r?", ceiling "+p.pot:""} &middot; ${dest?`${esc(dest)} (${esc(LEAGUE.groupShort(CONF[dest]))}) would take him and start him`:"no club down the pyramid would start him"}</div></div>
      ${dest?`<button class="skip small" data-t27lo="${esc(k)}">${on?"Keep him":"Loan out"}</button>`:""}</div>` }).join(""):`<div class="note">No backup of 21 or under to send out.</div>`;
  const inl=loanInList27(U,my,H).slice(0,4);
  if(inl.length)h+=`<div class="fnote" style="margin-top:6px">Bigger clubs' young players who'd start for you, on loan for the season (you pay his wages):</div>`+inl.map(x=>{ const on=LI.indexOf(x.key)>=0;
    return `<div class="drow"><div class="fmain"><div class="fname">${esc(x.n)} <span class="dpos">${esc(x.p)}</span> &middot; ${esc(x.team)}</div><div class="fnote">Age ${x.age} &middot; rated ${x.r}${x.pot>x.r?", ceiling "+x.pot:""} &middot; ${money(x.wage)} a year</div></div>
    <button class="skip small" data-t27li="${esc(x.key)}">${on?"Cancel":"Borrow him"}</button></div>` }).join("");
  return h;
}
function bindT27(){
  const P=()=>S.off.picks, H=()=>nflHumans();
  const find=k=>tMarket(U,S.myTeam,H()).find(m=>m.key===k);
  const plOf=k=>{ const [t]=k.split("|"); const R=U.roster[t]||[]; const j=R.findIndex(q=>q&&tKey(t,q)===k); return j<0?null:{p:R[j],j:j,t:t} };
  const agree=(k,fee,clause)=>{ const x=find(k), Q=P(); if(!x)return; Q.bids=(Q.bids||[]).filter(z=>z!==k).concat([k]);
    Q.bidTerms=Object.assign({},Q.bidTerms||{},{[k]:{fee:fee,wage:x.wage,yrs:Math.min(5,Math.max(3,nflYears(x.age,x.p))),inst:fee>=T27_INST,clause:!!clause}}); if(Q.neg)delete Q.neg["b|"+k] };
  document.querySelectorAll("[data-t27off]").forEach(b=>b.onclick=()=>{ const [t,n,pp,f]=b.dataset.t27off.split("|"), k=[t,n,pp].join("|"), o=plOf(k); if(!o)return;
    const ng=tNeg27("b|"+k), a=tAnswer27(U,S.myTeam,t,o.p,o.j<POS.length,+f,ng);
    if(a.ok)agree(k,+f,a.clause); else Object.assign(ng,{offer:+f,why:a.why,want:a.refuse?a.want:a.counter});
    save(); render() });
  document.querySelectorAll("[data-t27acc]").forEach(b=>b.onclick=()=>{ const k=b.dataset.t27acc, ng=tNeg27("b|"+k); if(ng.want)agree(k,ng.want,false); save(); render() });
  const term=(k,f)=>{ const Q=P(); Q.bidTerms=Q.bidTerms||{}; if(Q.bidTerms[k])f(Q.bidTerms[k]); save(); render() };
  document.querySelectorAll("[data-t27inst]").forEach(b=>b.onclick=()=>term(b.dataset.t27inst,T=>T.inst=!T.inst));
  document.querySelectorAll("[data-t27yrs]").forEach(b=>b.onclick=()=>{ const s=b.dataset.t27yrs, i=s.lastIndexOf("|"); term(s.slice(0,i),T=>T.yrs=+s.slice(i+1)) });
  document.querySelectorAll("[data-t27pay]").forEach(b=>b.onclick=()=>term(b.dataset.t27pay,T=>{ const x=find(b.dataset.t27pay); if(!x)return; T.pay=T.pay>=T27_RIVAL_PAY?1:T27_RIVAL_PAY; T.wage=Math.round(x.wage*T.pay*1000)/1000 }));
  document.querySelectorAll("[data-t27sell]").forEach(b=>b.onclick=()=>{ const Q=P(), k=b.dataset.t27sell; Q.sales=Q.sales||[];
    if(Q.sales.some(x=>x.key===k))Q.sales=Q.sales.filter(x=>x.key!==k);
    else { const o=tOffers(U,S.myTeam,H()).find(x=>x.key===k), ng=tNeg27("s|"+k); if(o&&!ng.gone)Q.sales=Q.sales.concat([{key:o.key,team:o.team,fee:ng.fee||o.fee}]) }
    save(); render() });
  document.querySelectorAll("[data-t27more]").forEach(b=>b.onclick=()=>{ const k=b.dataset.t27more, o=tOffers(U,S.myTeam,H()).find(x=>x.key===k), ng=tNeg27("s|"+k); if(!o||ng.fee||ng.gone)return;
    const a=tMore27(U,o); if(a.ok)ng.fee=a.fee; else ng.gone=a.why; save(); render() });
  document.querySelectorAll("[data-t27lo]").forEach(b=>b.onclick=()=>{ const Q=P(), k=b.dataset.t27lo; Q.loans=(Q.loans||[]).indexOf(k)>=0?[]:[k]; save(); render() });
  document.querySelectorAll("[data-t27li]").forEach(b=>b.onclick=()=>{ const Q=P(), k=b.dataset.t27li; Q.loansIn=(Q.loansIn||[]).indexOf(k)>=0?[]:[k]; save(); render() });
}
{ const _b=LEAGUE.ui.bindOffseason; LEAGUE.ui.bindOffseason=function(){ _b(); if(fo27())bindT27() } }
