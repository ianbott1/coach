/* ============ pro hockey: the front office's screens (engine 27) ============ */
/* The summer screen's choices, as it opens: the staff's re-sign plan, each expiring man's status and terms */
function hkOpen(u,t){
  hkStart(u); const R=u.roster[t]; while(R.length<HK_N)R.push(null);
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
        out.push({key:faKey(t,p),n:p.n,p:p.p,team:t,age:p.age+1,r:p.r,pot:p.pot,ask:hkClamp(hkAsk(p.r,p.age+1)*1.1),st:"UFA"}); return }
      if(st==="UFA"||p.r<57)return;
      if(st==="RFA-A"&&(strHash("file|"+p.n+"|"+u.year)%100)<12)return;          // he'll file for arbitration: no sheets
      const ask=hkClamp(hkAsk(p.r,p.age+1)*1.08);
      out.push({key:faKey(t,p),n:p.n,p:p.p,team:t,age:p.age+1,r:p.r,pot:p.pot,ask:ask,st:"RFA",comp:hkOsComp(ask)}) }) });
  return out.sort((a,b)=>(b.r+(b.pot-b.r)*0.3-b.age*0.2)-(a.r+(a.pot-a.r)*0.3-a.age*0.2)) }
