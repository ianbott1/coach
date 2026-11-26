/* ============ the front office's screens: pro football ============ */
/* Re-signing as a negotiation (how the deal is built: years against money against guarantees), the franchise tag, the
   fifth-year options and where the cap goes. Only on the real scale (27_frontoffice: foNew) and an offseason opened on
   this build (S.off.picks.fo); an older open offseason keeps its old screen. */

/* a planned re-signing's cap hit, as the deal you've chosen builds it */
function foPlannedSal(P,i){ const a=P.asks&&P.asks[i]; if(!a)return 0; const R=U.roster[S.myTeam], p=R[i];
  return foContract(a.sal,a.yrs,p?p.r:60,(P.deal&&P.deal[i])||"ask",U.year+1).sal }
/* where the cap goes: the twenty you track, the rest of the roster, dead money */
function foCapNote(pay){ const my=S.myTeam, dead=foDeadNext(U,my);
  return `<div class="note">The ${U.year+1} cap is $${FO_CAP}M. Your twenty main players take $${(pay-FO_DEPTH).toFixed(1)}M of it; the rest of the
    53 and the practice squad about $${FO_DEPTH}M${dead>0?`; dead money from players you've let go $${dead.toFixed(1)}M`:""}. About $${nflRookieRoom()}M goes to
    the draft class, on the rookie scale by where you pick.</div>`+foSpecLine(my) }
/* one expiring player: let him go, re-sign him on a deal you shape, or tag him */
function foResignHTML(P,i,p,a){
  const on=!!P.resign[i], tag=P.tag===i, kind=(P.deal&&P.deal[i])||"ask", k=foContract(a.sal,a.yrs,p.r,kind,U.year+1), tv=foTagVal(p);
  const deals=Object.keys(FO_DEALS).map(d=>{ const x=foContract(a.sal,a.yrs,p.r,d,U.year+1);
    return `<button class="skip small${kind===d&&on?" armed":""}" data-fodeal="${i}:${d}" title="${esc(FO_DEALS[d].l)}">${esc(FO_DEALS[d].l)}: ${x.yrs} yr${x.yrs===1?"":"s"}, $${x.sal.toFixed(1)}M a year, $${x.gt.toFixed(1)}M guaranteed</button>` }).join(" ");
  const state=tag?"Tagged":on?"Re-signing":"Letting go";
  return `<div class="cand ${on||tag?'on':''}">
    <div class="candtop"><div><div class="fname">${esc(p.n)} <span class="dpos">${esc(p.p)}</span></div>
    <div class="fnote">${i<POS.length?"Starter":"Backup"} &middot; age ${p.age+1} next season &middot; rated ${p.r}${p.pot>p.r?", ceiling "+p.pot:""}</div></div>
    <button class="promo" data-resign="${i}" aria-pressed="${on}" title="${on?"Tap to let him go":"Tap to re-sign him"}">${state}</button></div>
    <div class="cdesc">${tag?`On the franchise tag: one year at $${tv.toFixed(1)}M, all of it guaranteed. He hits the market again next year.`
      :on?`${k.yrs} year${k.yrs===1?"":"s"}, $${k.tot.toFixed(1)}M in all ($${k.sal.toFixed(1)}M a year on the cap); $${k.gt.toFixed(1)}M guaranteed, $${k.sb.toFixed(1)}M of it as a signing bonus paid now and spread over the deal. Cut him later and what's guaranteed and unspread stays on your cap as dead money.`
      :`Asking about $${a.sal.toFixed(1)}M a year for ${a.yrs} year${a.yrs===1?"":"s"}${p.age>=31?" &middot; on the wrong side of thirty":""}. Let go, he's a free agent anyone can sign.`}</div>
    ${on?`<div class="fnote" style="margin-top:6px">Every one of these is a deal he'd sign; what changes is the risk you carry.</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${deals}</div>`:""}
    ${i<POS.length&&!on?`<button class="skip small" data-fotag="${i}">${tag?"Take the tag off":`Franchise tag: $${tv.toFixed(1)}M for one year${P.tag!=null&&P.tag!==i?" (moves it from "+esc((U.roster[S.myTeam][P.tag]||{}).n||"")+")":""}`}</button>`:""}
    ${staffTag(i)}</div>`;
}
/* first-rounders after their third season: pick up the fifth year, guaranteed, or let the deal run out a year sooner */
function foOptHTML(P){ const R=U.roster[S.myTeam], L=R.map((p,i)=>({p:p,i:i})).filter(x=>foOptAble(x.p));
  if(!L.length)return "";
  return `<div class="grouphead">Fifth-year options</div><div class="note">First-round picks after their third season. Picking up the option adds a fifth year at a set salary, all of it guaranteed; declined, he's a free agent after next season.</div>`+
    L.map(x=>{ const on=!!(P.opt&&P.opt[x.i]); return `<div class="cand ${on?'on':''}"><div class="candtop"><div><div class="fname">${esc(x.p.n)} <span class="dpos">${esc(x.p.p)}</span></div>
      <div class="fnote">Rated ${x.p.r}${x.p.pot>x.p.r?", ceiling "+x.p.pot:""} &middot; age ${x.p.age} &middot; the option year: $${foOptSal(x.p).toFixed(1)}M</div></div>
      <button class="promo" data-foopt="${x.i}" aria-pressed="${on}">${on?"Picking it up":"Declining"}</button></div></div>` }).join("");
}
function foBindOffseason(){
  const P=S.off&&S.off.picks; if(!P)return;
  document.querySelectorAll("[data-fodeal]").forEach(b=>b.onclick=()=>{ const [i,d]=b.dataset.fodeal.split(":"); P.deal=P.deal||{}; P.deal[+i]=d; save(); render() });
  document.querySelectorAll("[data-fotag]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.fotag; P.tag=P.tag===i?null:i; if(P.tag===i)P.resign[i]=false; save(); render() });
  document.querySelectorAll("[data-foopt]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.foopt; P.opt=P.opt||{}; P.opt[i]=!P.opt[i]; save(); render() });
}
