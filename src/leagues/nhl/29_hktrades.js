/* ============ pro hockey: trades on the front office's rules (engine 27) ============ */
/* In season, to the deadline (March 1, the 2027 date), a trade must leave both clubs under the cap with their dead
   money. When one would be over, the club sending a man may keep part of his cap hit for the rest of his deal (retained
   salary): up to half, in steps of 5%; no more than three retained deals on a club's books at a time, and no more than
   15% of the cap retained in all (https://www.puckpedia.com/salary-cap/retained-salary). A contract already retained on
   isn't retained again. The computer's deadline deals use it too: the seller keeps salary so the contender fits, as the
   real deadline goes. Kept on the trade's record (x.ret), so a reload plays it again; into the universe at the
   season's end (dead money, u.hkDead, its years his deal's). Careers from before (no u.hkFO): nothing here applies. */
/* this season's retained salary not yet carried into the universe */
function hkSeaRet(sea,t){ return (sea&&sea.hkRet&&!(typeof U!=="undefined"&&U&&U._tdc===sea.year))?sea.hkRet.filter(d=>d.t===t):[] }
/* dead money as the season stands: the universe's and this season's retained salary */
function hkDeadSeason(sea,t){ return hkDeadOf(U,t)+hkSeaRet(sea,t).reduce((s,d)=>s+d.sal,0) }
/* the retained deals on a club's books */
function hkRetOf(sea,t){ return hkRetained(U,t).concat(hkSeaRet(sea,t)) }
function hkRecv(x){ return x.ret.by===x.my?x.t:x.my }
Object.assign(LEAGUE.trade,{
  /* both clubs under the cap after the deal, a club over only if it was over already and the deal doesn't add to it;
     one over the cap may be brought under by the other club keeping part of an incoming man's cap hit */
  capFit(sea,c){
    if(!hkFO())return null;
    const pay=(club,R)=>payroll(R)+hkDeadSeason(sea,club);
    let ret=null, over=false;
    [[c.my,c.M,c.M2,c.t,c.T2],[c.t,c.T,c.T2,c.my,c.M2]].forEach(([club,R,R2,other,oR2])=>{
      const p2=pay(club,R2); if(p2<=HK$.cap+1e-9||p2<=pay(club,R)+1e-9)return;
      const cand=R2.filter(p=>p&&R.indexOf(p)<0&&!(p.k&&p.k.ret)).sort((a,b)=>b.k.sal-a.k.sal)[0];
      if(ret||!cand){ over=true; return }
      const pct=Math.ceil((p2-HK$.cap)/cand.k.sal*20-1e-9)/20, amt=hk2(cand.k.sal*pct), L=hkRetOf(sea,other);
      if(pct>HK$.retMax||L.length>=HK$.retN||L.reduce((s,d)=>s+d.sal,0)+amt>HK$.cap*HK$.retShare+1e-9||pay(other,oR2)+amt>HK$.cap+1e-9){ over=true; return }
      ret={by:other,n:cand.n,p:cand.p,pct:pct,sal:amt,yrs:cand.k.yrs||1} });
    return {over:over,ret:over?null:ret} },
  /* the deal done: his cap hit with his new club is what's left; the club that sent him carries the rest */
  onRetain(sea,x){ const R=sea.roster[hkRecv(x)], p=R&&R.find(q=>q&&q.n===x.ret.n); if(!p)return;
    p.k=Object.assign({},p.k,{sal:hk2(p.k.sal-x.ret.sal),ret:x.ret.pct});
    (sea.hkRet=sea.hkRet||[]).push({t:x.ret.by,n:x.ret.n,p:x.ret.p,sal:x.ret.sal,yrs:p.k.yrs||1,why:"ret"}) },
  carryRetain(u,x){ const R=u.roster[hkRecv(x)], p=R&&R.find(q=>q&&q.n===x.ret.n); if(!p)return;
    p.k=Object.assign({},p.k,{sal:hk2(p.k.sal-x.ret.sal),ret:x.ret.pct});
    u.hkDead=u.hkDead||{}; (u.hkDead[x.ret.by]=u.hkDead[x.ret.by]||[]).push({n:x.ret.n,p:x.ret.p,sal:x.ret.sal,yrs:p.k.yrs||1,why:"ret"}) },
  /* in words, on a deal and on the record */
  retWords(r,done){ const me=typeof S!=="undefined"&&S&&r.by===S.myTeam, pc=Math.round(r.pct*100)+"%";
    return `${me?(done?"You keep":"you keep"):esc(r.by)+" keeps"} ${pc} of ${esc(r.n)}'s cap hit (${hkMoney(r.sal)} a year for ${hkYrsW(r.yrs)})${done?".":""}` },
  /* the Trades tab's cap line */
  payNote(my){ if(!hkFO())return `<div class="note">Payroll $${payroll(SEA.roster[my]).toFixed(1)}M of $${LEAGUE.cap}M.</div>`;
    const hit=hk2(payroll(SEA.roster[my])+hkDeadSeason(SEA,my)), L=hkRetOf(SEA,my), kept=L.reduce((s,d)=>s+d.sal,0);
    return `<div class="note">Cap hit ${hkMoney(hit)} of ${hkMoney(HK$.cap)} &middot; ${hit<=HK$.cap?hkMoney(HK$.cap-hit)+" of room":hkMoney(hit-HK$.cap)+" over"}. A deal that puts a club over the cap can work if the club sending a man keeps part of his cap hit: up to half, three retained deals at a time, ${hkMoney(HK$.cap*HK$.retShare)} in all (you have ${nOf(L.length,"retained deal")}${kept>0?", "+hkMoney(kept):""}).</div>` } });
/* the draft reads the pick ledger (offer sheets' compensation): a pick another club now holds */
LEAGUE.pickOwner=function(u,orig,rd){ if(!hkFO(u))return null; const o=hkPickOwner(u,u.year,rd,orig); return o!==orig?o:null };
