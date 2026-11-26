/* ============ pro baseball: the front office's screens (engine 27) ============
   The summer screen's contracts on the real rules (each man by his class: pre-arbitration, arbitration, free agency;
   tender or non-tender, re-sign or the qualifying offer), the payroll against the tax line and the owner's limit, the
   farm (call a man up, designate one for assignment), the roster tab's farm and moves, and each club's payroll line.
   Careers that haven't reached the front office's rules keep the old screens. */
const mlbScreenOn=()=>typeof U!=="undefined"&&U&&mlbNext(U);
const mlbM=v=>"$"+(Math.round(v*10)/10).toFixed(1)+"M";
/* next season's roster as the summer screen stands: each ending deal as you have it marked */
function mlbPlannedRoster(){
  const R=U.roster[S.myTeam], P=S.off.picks, A=P.asks||{}, D=new Set(P.dfa||[]);
  return R.map((p,i)=>{ if(!p||D.has(p.n))return null; const a=A[i]; if(!a||p.k.yrs>1)return p;
    let sal=null;
    if(a.c==="fa"){ if(P.resign&&P.resign[i])sal=a.sal; else if(P.qo&&P.qo[i]&&a.acc)sal=MLB$.qo }
    else if(P.tender&&P.tender[i])sal=a.sal;
    return sal==null?null:Object.assign({},p,{k:{sal:sal,yrs:1}}) }) }
function mlbPlannedPay(){ const P=S.off.picks; let pay=mlbTaxPay(U,S.myTeam,mlbPlannedRoster());
  if(P.trade)pay+=P.trade.sal-P.trade.giveSal; return Math.round(pay*10)/10 }
/* the tax in words: where a payroll sits, and the bill */
function mlbTaxWords(pay,rep){
  const over=pay-MLB$.cbt, bill=mlbTaxBill(pay,rep), yr=["first","second","third"][Math.min(2,rep||0)];
  if(over<=0)return `${mlbM(-over)} under the $${MLB$.cbt}M tax line`;
  return `${mlbM(over)} over the $${MLB$.cbt}M tax line: a ${mlbM(bill)} bill (${yr} year over, ${Math.round(MLB$.rate[Math.min(2,rep||0)]*100)}%${over>MLB$.sur[0][0]?", more on each dollar past $20M, $40M and $60M over":""})${over>=MLB$.pickBack?"; your top draft pick moves back ten places":""}` }
function mlbOwnerWords(t){ const m=(U.mlbOwn&&U.mlbOwn[t])||0;
  return m>=1?"The owner is pleased and has loosened the purse.":m<=-1?"The owner is unhappy with the tax bill and has tightened the purse.":"" }
/* the contracts section of the summer screen */
function mlbContractsHTML(P,num){
  const my=S.myTeam, R=U.roster[my], A=P.asks||{}, rep=mlbRep(U,my);
  const pay=mlbPlannedPay(), B=mlbBudget(U,my), bill=mlbTaxBill(pay,rep), room=mlbRoomFor(U,my,pay);
  let h=`<div class="grouphead">${num}. Contracts</div>`;
  h+=coachMark("contracts","A player with fewer than three years of service is paid near the minimum. From three years (or two, for the top 22% of that class, the super twos) he goes to arbitration, and his raise follows the season he had. After six years he is a free agent.");
  h+=`<div class="budgetleft ${pay+bill<=B?'done':''}">Payroll ${mlbM(pay)} &middot; owner's limit ${mlbM(B)} with the tax &middot; ${room>0?mlbM(room)+" to spend":"no room to add"}</div>`;
  h+=`<div class="note">${mlbTaxWords(pay,rep)}. ${esc(mlbOwnerWords(my))}</div>`;
  if(pay+bill>B*1.02)h+=`<div class="note"><b>Over the owner's limit by ${mlbM(pay+bill-B)}.</b> Unless the club wins well past what's expected of it, he will cut next season's limit.</div>`;
  const ctl=Object.keys(A).map(Number).filter(i=>A[i].c!=="fa"&&R[i]), fa=Object.keys(A).map(Number).filter(i=>A[i].c==="fa"&&R[i]);
  if(!ctl.length&&!fa.length)h+=`<div class="note">Nobody's contract is up this year.</div>`;
  if(ctl.length){
    h+=`<div class="grouphead">Under club control</div><div class="note">Tender a contract and he stays on the figure shown; non-tender him and he becomes a free agent.</div>`;
    h+=ctl.map(i=>{ const p=R[i], a=A[i], on=!!(P.tender&&P.tender[i]);
      const what=a.c==="pre"?"Pre-arbitration":`Arbitration, year ${a.y||1}${a.s2?" (super two)":""}`;
      const why=a.c==="arb"&&a.perf?(a.perf>0?" &middot; his season added to it":" &middot; his season took some off it"):"";
      return `<div class="cand ${on?'on':''}"><div class="candtop"><div><div class="fname">${esc(p.n)} <span class="dpos">${esc(p.p)}</span></div>
        <div class="fnote">${bsRole(i)} &middot; age ${p.age+1} next season &middot; rated ${p.r} &middot; ${(p.svc||0).toFixed(1)} years of service</div></div>
        <button class="promo" data-mlbt="${i}" aria-pressed="${on}">${on?"Tendering":"Non-tendering"}</button></div>
        <div class="cdesc">${what}: ${mlbM(a.sal)} for next season${why}.</div></div>` }).join("") }
  if(fa.length){
    h+=`<div class="grouphead">Free agents</div><div class="note">Re-sign him at his price, make him the qualifying offer (one year at ${mlbM(MLB$.qo)}: if he turns it down and signs elsewhere, you get a draft pick), or let him go.</div>`;
    h+=fa.map(i=>{ const p=R[i], a=A[i], st=P.resign&&P.resign[i]?"sign":P.qo&&P.qo[i]?"qo":"go";
      const b=(k,l)=>`<button class="skip small ${st===k?'on':''}" data-mlbfa="${i}|${k}" aria-pressed="${st===k}">${l}</button>`;
      return `<div class="cand ${st!=="go"?'on':''}"><div class="candtop"><div><div class="fname">${esc(p.n)} <span class="dpos">${esc(p.p)}</span></div>
        <div class="fnote">${bsRole(i)} &middot; age ${p.age+1} next season &middot; rated ${p.r}</div></div></div>
        <div class="cdesc">Asking ${mlbM(a.sal)} a year for ${nOf(a.yrs,"year")}${p.age>=31?" &middot; on the wrong side of thirty":""}.${a.qoOK?(a.acc?" He would likely take the qualifying offer.":" He would likely turn the qualifying offer down."):" He can't get the qualifying offer (he had one before, or joined during the season)."}</div>
        <div>${b("sign","Re-sign")}${a.qoOK?b("qo","Qualifying offer"):""}${b("go","Let him go")}</div></div>` }).join("") }
  return h }
/* the farm on the summer screen: the 40-man, the best prospects by level, a man to call up; your roster's men to designate */
function mlbFarmHTML(P,num){
  const my=S.myTeam, F=(U.farm&&U.farm[my])||[], R=U.roster[my], calls=new Set(P.calls||[]), dfa=new Set(P.dfa||[]);
  let h=`<div class="grouphead">${num}. The farm and the 40-man</div>`;
  h+=`<div class="note">${mlb40(U,my)} of 40 on the 40-man roster (the 26 in the majors and ${F.filter(p=>p.on40).length} protected in the minors). A man optioned to the minors uses one of his three option years; once they're gone, or after five years of service, he can only be sent down through waivers.</div>`;
  h+=`<div class="opt ${P.farmAuto!==false?'on':''}" data-mlbauto="1"><div class="fname">${P.farmAuto!==false?"Your staff moves prospects up":"You move prospects up yourself"}</div><div class="cdesc">${P.farmAuto!==false?"A Triple-A man clearly better than one of your bench players takes his place. Tap to make every call yourself.":"Only the call-ups you choose below. Tap to let your staff do it."}</div></div>`;
  MLB_LV.forEach(L=>{ const at=F.filter(p=>p.lvl===L).sort((a,b)=>mlbProsVal(b)-mlbProsVal(a)); if(!at.length)return;
    h+=`<div class="grouphead">${L==="AAA"?"Triple-A":L==="AA"?"Double-A":"Single-A"} &mdash; ${nOf(at.length,"player")}</div>`;
    h+=at.slice(0,L==="A"?4:6).map(p=>{ const on=calls.has(p.n);
      return `<div class="drow"><div class="fmain"><div class="fname">${esc(p.n)} <span class="dpos">${esc(p.p)}</span>${p.on40?` <span class="dgone">40-man</span>`:""}</div>
        <div class="fnote">Age ${p.age} &middot; rated ${p.r}, ceiling ${p.pot}${p.on40?` &middot; ${nOf(mlbOptsLeft(p),"option")} left`:""}</div></div>
        ${L!=="A"?`<button class="skip small" data-mlbcall="${esc(p.n)}" aria-pressed="${on}">${on?"Calling up":"Call up"}</button>`:""}</div>` }).join("") });
  const bench=R.map((p,i)=>({p,i})).filter(x=>x.p&&x.p.k.yrs>1);
  if(bench.length){ h+=`<div class="grouphead">Designate for assignment</div><div class="note">Off the 40-man: another club can claim him and his contract. If nobody does, a man with three years of service is a free agent and the rest go to Triple-A. You still pay what he's owed if he's released.</div>`;
    h+=bench.filter(x=>x.i>=POS.length||dfa.has(x.p.n)).map(x=>{ const on=dfa.has(x.p.n);
      return `<div class="drow"><div class="fmain"><div class="fname">${esc(x.p.n)} <span class="dpos">${esc(x.p.p)}</span></div>
        <div class="fnote">${bsRole(x.i)} &middot; rated ${x.p.r} &middot; ${mlbM(x.p.k.sal)} for ${nOf(x.p.k.yrs,"more year")}</div></div>
        <button class="skip small" data-mlbdfa="${esc(x.p.n)}" aria-pressed="${on}">${on?"Designating":"Designate"}</button></div>` }).join("") }
  return h }
/* the summer's own record on the banner: arbitration, the qualifying offers, the tax, the farm */
function mlbBannerHTML(){
  const L=S.lastNbaRep&&S.lastNbaRep.rep, my=S.myTeam; if(!L||!L.bills)return "";
  const list=(a,f)=>(a||[]).map(f).join(", "); let h="";
  const b=L.bills[my]; if(b)h+=`<div class="bnews small"><b>The tax:</b> ${b.tax>0?`payroll ${mlbM(b.pay)}, a ${mlbM(b.tax)} competitive balance tax bill.`:`payroll ${mlbM(b.pay)}, under the $${MLB$.cbt}M line.`}</div>`;
  const T=(L.tendered[my]||[]).filter(x=>x.c==="arb"); if(T.length)h+=`<div class="bnews small"><b>Arbitration:</b> ${list(T,x=>esc(x.n)+" "+mlbM(x.sal)+(x.perf>0?" (a good season)":x.perf<0?" (a poor one)":""))}.</div>`;
  const N=L.nontender[my]||[]; if(N.length)h+=`<div class="bnews small"><b>Non-tendered:</b> ${list(N,x=>esc(x.n)+" ("+esc(x.p)+")")}.</div>`;
  const Q=L.qo[my]||[]; if(Q.length)h+=`<div class="bnews small"><b>Qualifying offers:</b> ${list(Q,x=>esc(x.n)+(x.accepted?" accepted":" turned it down"))}.</div>`;
  const rd=r=>r.length?"round "+r.join(" and "):"no";
  const C=(L.forfeit[my]||[]).map(x=>`signing ${esc(x.n)} sends your ${rd(x.rounds)} pick to ${esc(x.to)}`).concat(((L.comp&&L.comp[my])||[]).map(x=>`${esc(x.n)} turned down your qualifying offer and signed with ${esc(x.from)}: their ${rd(x.rounds)} pick is yours`));
  if(C.length)h+=`<div class="bnews small"><b>Draft picks:</b> ${C.join("; ")}.</div>`;
  const up=L.farmUp[my]||[]; if(up.length)h+=`<div class="bnews small"><b>Up from the farm:</b> ${list(up,x=>esc(x.n)+" ("+esc(x.p)+", "+x.r+")")}.</div>`;
  const dn=(L.opt[my]||[]).map(x=>esc(x.n)+" optioned").concat((L.dfa[my]||[]).map(x=>esc(x.n)+" "+esc(x.to||"designated"))); if(dn.length)h+=`<div class="bnews small"><b>Sent down:</b> ${dn.join(", ")}.</div>`;
  const pay=NAMES.map(t=>L.bills[t]?L.bills[t].pay:0), over=NAMES.filter(t=>L.bills[t]&&L.bills[t].tax>0);
  h+=`<div class="bnews small">Around the league: ${over.length?nOf(over.length,"club")+" paid the tax ("+over.map(esc).join(", ")+")":"nobody paid the tax"}; payrolls ran from ${mlbM(Math.min(...pay))} to ${mlbM(Math.max(...pay))}.</div>`;
  return h }
/* the roster tab: the farm and the season's moves */
function mlbReservesHTML(my){
  if(!U||!U.mlbFO||!U.farm)return "";
  const F=U.farm[my]||[], M=SEA&&SEA.mlb, now=M?Object.keys(M.now).filter(k=>k.indexOf(my+"|")===0).map(k=>M.now[k]):[];
  let h=`<div class="grouphead">The farm</div><div class="note">${mlb40(U,my)} of 40 on the 40-man. When a starter goes on the injured list for ten days or more, the best man at his position comes up from Triple-A or Double-A.</div>`;
  if(now.length)h+=now.map(x=>`<div class="note">${esc(x.up)} is up from ${x.from==="AAA"?"Triple-A":"Double-A"} while ${esc(x.who)} is on the injured list${x.sits?" (he sits: the bench man is better)":""}.</div>`).join("");
  MLB_LV.forEach(L=>{ const at=F.filter(p=>p.lvl===L).sort((a,b)=>mlbProsVal(b)-mlbProsVal(a)).slice(0,3); if(!at.length)return;
    h+=`<div class="note"><b>${L==="AAA"?"Triple-A":L==="AA"?"Double-A":"Single-A"}:</b> ${at.map(p=>`${esc(p.n)} (${esc(p.p)}, ${p.age}, ${p.r}, ceiling ${p.pot})`).join(", ")}.</div>` });
  const log=M?M.log.filter(x=>x.t===my).slice(-6):[];
  if(log.length)h+=`<div class="grouphead">Moves this season</div>`+log.map(x=>`<div class="note">Day ${x.day}: ${x.kind==="il"?`${esc(x.who)} (${esc(x.p)}) to the injured list; ${esc(x.up)} called up`:`${esc(x.who)} back from the injured list; ${esc(x.down)} sent down`}.</div>`).join("");
  return h }
if(typeof LEAGUE!=="undefined"){
  const ui=LEAGUE.ui, scr0=ui.offseasonScreen, blk0=ui.offseasonBlock, bind0=ui.bindOffseason, ban0=ui.offseasonBanner;
  const res0=LEAGUE.reservesHTML, pl0=LEAGUE.payrollLine;
  LEAGUE.reservesHTML=function(my,hurt){ return (res0?res0(my,hurt):"")+mlbReservesHTML(my) };
  LEAGUE.payrollLine=function(t){
    if(!U||!U.mlbFO)return pl0?pl0(t):(function(){ const R=(SEA&&SEA.roster&&SEA.roster[t])||U.roster[t]; return R?`<div class="progline">Payroll <b>${money2(payroll(R))}</b> of ${money2(NFL_CAP)} cap</div>`:"" })();
    const pay=mlbTaxPay(U,t), rep=mlbRep(U,t), bill=mlbTaxBill(pay,rep), B=mlbBudget(U,t);
    return `<div class="progline">Payroll <b>${money2(pay)}</b> &middot; ${pay>MLB$.cbt?`<span class="dn">${money2(pay-MLB$.cbt)} over the tax line, a ${money2(bill)} bill</span>`:`${money2(MLB$.cbt-pay)} under the tax line`} &middot; owner's limit ${money2(B)}</div>` };
  ui.offseasonBanner=function(){ const h=ban0(); if(!U||!U.mlbFO)return h; const i=h.lastIndexOf('<button class="cardbtn"'); return i<0?h+mlbBannerHTML():h.slice(0,i)+mlbBannerHTML()+h.slice(i) };
  ui.offseasonScreen=function(){
    const h=scr0(); if(!mlbScreenOn()||(S.off.dn&&dnOn()))return h;
    // the old contracts section (the cap) gives way to the front office's: from its heading to free agency's
    const a=h.search(/<div class="grouphead">\d+\. Expiring contracts<\/div>/), b=h.search(/<div class="grouphead">\d+\. Free agency<\/div>/);
    if(a<0||b<0)return h;
    const num=+(h.slice(a).match(/(\d+)\. Expiring/)[1]);
    const c=h.search(/<div class="grouphead">\d+\. The draft<\/div>/);
    return h.slice(0,a)+mlbContractsHTML(S.off.picks,num)+h.slice(b,c<0?h.length:c)+mlbFarmHTML(S.off.picks,num+"b")+(c<0?"":h.slice(c)) };
  // the owner's limit doesn't stop the summer: going past it costs next season's limit (27_fo_run, the owner's mood)
  ui.offseasonBlock=function(){ if(!S.off||!mlbScreenOn())return blk0.call(ui); return null };
  ui.bindOffseason=function(){
    bind0.call(ui); if(!S.off||!mlbScreenOn()||(S.off.dn&&dnOn()))return;
    const P=S.off.picks, go=()=>{ save(); render() };
    const tog=(k,v)=>{ P[k]=P[k]||[]; P[k]=P[k].indexOf(v)>=0?P[k].filter(x=>x!==v):P[k].concat([v]) };
    document.querySelectorAll("[data-mlbt]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.mlbt; P.tender[i]=!P.tender[i]; go() });
    document.querySelectorAll("[data-mlbfa]").forEach(b=>b.onclick=()=>{ const [i,k]=b.dataset.mlbfa.split("|");
      P.resign[+i]=k==="sign"; P.qo=P.qo||{}; P.qo[+i]=k==="qo"; go() });
    document.querySelectorAll("[data-mlbauto]").forEach(b=>b.onclick=()=>{ P.farmAuto=P.farmAuto===false; go() });
    document.querySelectorAll("[data-mlbcall]").forEach(b=>b.onclick=()=>{ tog("calls",b.dataset.mlbcall); go() });
    document.querySelectorAll("[data-mlbdfa]").forEach(b=>b.onclick=()=>{ tog("dfa",b.dataset.mlbdfa); go() }) };
}
