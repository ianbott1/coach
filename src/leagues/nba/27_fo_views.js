/* ============ pro basketball: the front office's screens (Nov 2026) ============ */
/* Fifteen on a roster: the ten in the rotation (a starter and the man behind him at each spot) and a third man at each
   spot who plays when one of the two ahead of him is hurt. "Move up" puts a third man into the rotation (a promotion,
   kept and replayed like any). Careers from before keep ten until their next summer. */
LEAGUE.text.depthHead="The rotation";
LEAGUE.reservesHTML=function(my,hurt){
  const R=SEA.roster[my]; if(!R||R.length<=2*POS.length)return "";
  let h=`<div class="grouphead">The rest of the fifteen</div><div class="note">They play when a man ahead of them at their spot is hurt: the third man takes the backup's minutes. Move one up and he joins the rotation in his place.</div>`;
  h+=POS.map((P,i)=>{ const c=R[BK(BK(i))], b=R[BK(i)]; if(!c)return `<div class="depth"><div class="dpos">${esc(P.p)}</div><div class="dbody"><div class="fnote">Nobody: an injury here goes to a walk-on.</div></div></div>`;
    return `<div class="depth"><div class="dpos">${esc(P.p)}</div><div class="dbody"><div class="prow2 bk">
      <div class="pmain"><div class="pname sm">${plLink(my,c.n)}${hurt&&hurt[BK(BK(i))]?` <span class="outtag">OUT</span>`:""}</div>
        <div class="psub">${c.p!==P.p?esc(c.p)+" playing "+esc(P.p)+" &middot; ":""}age ${c.age} &middot; ${c.pot>c.r?"ceiling "+c.pot:"at ceiling"} &middot; ${nbaMoney(c.k.sal)}${b?` &middot; ${b.r-c.r>0?(b.r-c.r)+" behind "+esc(b.n):b.r===c.r?"even with "+esc(b.n):"ahead of "+esc(b.n)}`:""}</div></div>
      ${b?`<button class="promo" data-promo="${BK(i)}">Move up</button>`:""}<span class="prate sm">${c.r}</span></div></div></div>` }).join("");
  return h };
/* the cap sheet in a line, on every club's card: payroll against the cap, the tax line and the aprons */
LEAGUE.payrollLine=function(t){
  const R=(SEA&&SEA.roster&&SEA.roster[t])||(U&&U.roster&&U.roster[t]); if(!R||!R.some(p=>p&&p.k))return "";
  const pay=payroll(R);
  if(!nbaFO())return `<div class="progline">Payroll <b>${money2(pay)}</b> of ${money2(LEAGUE.taxLine)} &middot; the old cap rules until the summer</div>`;
  const tier=nbaTier(pay), tax=nbaTaxBill(pay);
  const next=tier==="room"?`${nbaMoney(NBA$.cap-pay)} under the cap`:tier==="cap"?`${nbaMoney(NBA$.tax-pay)} under the tax`:tier==="tax"?`${nbaMoney(NBA$.ap1-pay)} under the first apron`:tier==="ap1"?`${nbaMoney(NBA$.ap2-pay)} under the second apron`:`${nbaMoney(pay-NBA$.ap2)} over the second apron`;
  return `<div class="progline">Payroll <b>${money2(pay)}</b> &middot; ${esc(NBA_TIERW[tier])} (${next})${tax>0?` &middot; <span class="dn">tax bill ${nbaMoney(tax)}</span>`:""}</div>` };
