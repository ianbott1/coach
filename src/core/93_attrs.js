/* round 87 (Ian, the player attributes design): a player is a shape, not one number. Each sport names 8-10
   attributes (ATTRS, in its 10_players.js); each player carries the ones of his group (ATTRS.group: a stable group
   from his position, so a job change mid-season never changes which he has or how they weigh). They are kept on the
   rating's own scale and his rating is their weighted sum (ATTRS.w[group]), rounded, exactly: a 65 is a 65 however
   his attributes lean. On screen they read 1-20, against his league (ATTR_SCALE: the starters' mean and spread, so
   the soccer pyramid's tiers read as tiers, as in Football Manager).

   Nothing here draws the season's dice:
   - a shape (how a player leans) is drawn once, from his name, group and the career's seed (attrRng), around his
     rating that day, and kept on him (p.at, with p.ar the rating it sums to). The same player drawn twice comes out
     the same (draft night shows the shape that later arrives on the roster).
   - each summer the league's own development sets his rating exactly as it always has; attrSync then spreads the
     change across his attributes by age (physical early, technical in his prime, mental late) and, for your team,
     your training focus. No draw: ratings, and so every result that reads them, are what they were.
   Where an engine reads attributes (baseball, engine 10), it gets them through the game's own context (gameCtx), as
   it gets ratings: never from a roster mid-game. */
const ATTR_SCALE={cfb:{m:61.2,s:10.8}, nfl:{m:66.6,s:5.8}, ncaab:{m:61.9,s:10.9}, nba:{m:59.2,s:5.6}, nhl:{m:59.7,s:6.0},
  epl:{m:49.2,s:13.0}, mlb:{m:59.0,s:5.8}};
const ATTR_SPREAD=0.8;   // a shape's spread, in the league's starter standard deviations
function attrScale(){ return ATTR_SCALE[LEAGUE.id]||{m:60,s:6} }
function attrOn(){ return typeof ATTRS!=="undefined" }
function attrGrp(p){ return p&&p.p?ATTRS.group(String(p.p)):null }
function attrKeys(g){ const W=ATTRS.w[g]; return W?Object.keys(W):[] }
// a player's own numbers: name, group, the career's seed (u.seed), never the season's
function attrRng(u,p,g){ return new RNG((strHash("attr|"+((u&&u.seed)||0)+"|"+p.n+"|"+g)>>>0)||1) }
// the weighted sum, exact: nudge the heaviest attribute until the rounded sum is the rating
function attrFix(v,W,K,r){
  const sum=()=>K.reduce((s,k,j)=>s+W[k]*v[j],0);
  const order=K.map((k,j)=>j).sort((a,b)=>W[K[b]]-W[K[a]]||a-b);
  let guard=0; while(Math.round(sum())!==r&&guard++<400){ const up=r>sum();
    const j=up?order[0]:order.find(i=>v[i]>1); if(j===undefined)break; v[j]+=up?1:-1 }
  return v }
function attrGen(u,p){
  const g=attrGrp(p), K=attrKeys(g); if(!K.length)return null;
  const W=ATTRS.w[g], M=(ATTRS.lean&&ATTRS.lean[g])||{}, sd=attrScale().s*ATTR_SPREAD, R=attrRng(u,p,g);
  let d=K.map(k=>R.gauss(M[k]||0,sd)); const mean=K.reduce((s,k,j)=>s+W[k]*d[j],0);
  d=d.map(x=>x-mean);                            // a shape leans; it doesn't add to the rating
  return attrFix(K.map((k,j)=>Math.max(1,Math.round(p.r+d[j]))),W,K,p.r) }
/* how a summer's change lands, by age: share of a gain, share of a loss */
const ATTR_AGE={ p:{up:a=>a<=24?1.4:a<=27?1.0:a<=30?0.5:0.25, dn:a=>a>=30?1.7:1.1},
                 t:{up:a=>a<=30?1.0:0.8, dn:a=>0.9},
                 m:{up:a=>a<=24?0.6:a<=28?1.0:1.4, dn:a=>a>=30?0.45:0.7} };
const ATTR_FOCUS=1.5;   // training focus: the attribute you pick takes this much more of a summer's growth
function attrAge(p){ return p.age!=null?p.age:p.c!=null&&p.c<=6?17+p.c:p.c!=null?p.c:24 }
function attrDevelop(p,focus){
  const g=attrGrp(p), K=attrKeys(g), W=ATTRS.w[g], delta=p.r-p.ar, a=attrAge(p);
  if(!delta||!K.length)return; const up=delta>0;
  const s=K.map(k=>{ const B=ATTR_AGE[ATTRS.band[k]||"t"]; let x=up?B.up(a):B.dn(a); if(focus===k)x*=up?ATTR_FOCUS:1/ATTR_FOCUS; return x });
  const den=K.reduce((t,k,j)=>t+W[k]*s[j],0)||1;
  const v=p.at.map((x,j)=>Math.max(1,Math.round(x+delta*s[j]/den)));
  p.ap=p.at; p.at=attrFix(v,W,K,p.r); p.ar=p.r }   // ap: last summer's, for the page's arrows
/* every rostered player has his attributes, and they sum to his rating: run where a season's universe is fixed (a
   new career, a new season) and on a reload (a career from before round 87 gets them then, from its players as they
   are). focus: {team: {group: attribute}} (training focus; yours only). */
function attrSync(u,focus,summer){
  if(!attrOn()||!u||!u.roster)return;
  Object.keys(u.roster).forEach(t=>{ const R=u.roster[t]; if(!Array.isArray(R))return; const F=(focus&&focus[t])||{};
    R.forEach(p=>{ if(!p||p.r==null)return; const g=attrGrp(p), K=attrKeys(g); if(!K.length)return;
      if(!Array.isArray(p.at)||p.at.length!==K.length){ p.at=attrGen(u,p); p.ar=p.r; return }
      if(p.ar!==p.r)attrDevelop(p,F[g]); else if(summer)p.ap=p.at.slice() }) }) }   // a summer with no change: no arrows
/* a player's attributes as {key: value on the rating scale}: his own, or (a prospect, a free agent not yet
   synced) the shape he will arrive with */
function attrOf(p){ if(!attrOn()||!p)return null; const g=attrGrp(p), K=attrKeys(g); if(!K.length)return null;
  const v=Array.isArray(p.at)&&p.at.length===K.length&&p.ar===p.r?p.at:attrGen(typeof U!=="undefined"?U:null,p); if(!v)return null;
  const o={}; K.forEach((k,j)=>o[k]=v[j]); return o }
function attrShow(v){ const S=attrScale(); return Math.max(1,Math.min(20,Math.round(11+(v-S.m)/S.s*3))) }
/* the role: the attribute he leans on most against his own rating (a label of his shape, not a mechanic) */
function attrRole(p){ return attrRoleOf(p,attrOf(p)) }
function attrRoleOf(p,A){ if(!A)return ""; const g=attrGrp(p), K=attrKeys(g);
  let best=null, bd=-1e9; K.forEach(k=>{ const d=A[k]-p.r-((ATTRS.lean&&ATTRS.lean[g]&&ATTRS.lean[g][k])||0); if(d>bd){ bd=d; best=k } });
  if(bd<attrScale().s*0.35)return ATTRS.allRound&&ATTRS.allRound[g]||"All-rounder";
  const O=ATTRS.roleBy&&ATTRS.roleBy[g]; return (O&&O[best])||ATTRS.role[best]||"" }
/* a prospect, as your scouts see him (round 87: fog where the rating is already fogged, the draft): each attribute read
   with an error of its own, wider when the scouts are unsure, narrow after a workout; the same read every time */
function attrLooks(r){ return r?`looks like ${/^[aeiou]/i.test(r)?"an":"a"} ${r.toLowerCase()}`:"" }   // the role, read: a speedster, an all-rounder
function attrRoleRead(p,x,team){ const A=attrOf(p); if(!A)return ""; x=x||{};
  const sd=attrScale().s*ATTR_SPREAD*(x.wk?0.3:x.unsure?1.0:0.55), R={};
  Object.keys(A).forEach(k=>{ const r=new RNG((strHash("aread|"+((typeof U!=="undefined"&&U&&U.seed)||0)+"|"+(team||"")+"|"+(p.pid!=null?p.pid:p.n)+"|"+k)>>>0)||1); R[k]=A[k]+r.gauss(0,sd) });
  return attrRoleOf(p,R) }
/* the player's page: his attributes in three bands, 1-20, last summer's change beside each, what each one does */
const ATTR_BANDS=[["t","Technical"],["m","Mental"],["p","Physical"]];
function attrColor(v){ return v>=16?"var(--turf)":v>=12?"var(--bone)":v>=8?"var(--muted)":"var(--flag)" }
function attrPlays(){ return typeof ATTRS!=="undefined"&&typeof ATTRS.plays==="function"&&ATTRS.plays() }
function attrGridHTML(p){
  const A=attrOf(p); if(!A)return ""; const g=attrGrp(p), K=attrKeys(g), was=Array.isArray(p.ap)&&p.ap.length===K.length?p.ap:null;
  const cell=(k,j)=>{ const v=attrShow(A[k]), d=was?v-attrShow(was[j]):0;
    return `<div style="display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.05)" title="${esc(ATTRS.desc[k]||"")}">
      <span>${esc(ATTRS.name[k])}<span style="color:var(--muted);font-size:11px"> &middot; ${esc(ATTRS.desc[k]||"")}</span></span>
      <span style="font-family:var(--mono);white-space:nowrap">${d>0?`<span style="color:var(--turf);font-size:11px">&#9650;${d} </span>`:d<0?`<span style="color:var(--flag);font-size:11px">&#9660;${-d} </span>`:""}<b style="color:${attrColor(v)}">${v}</b></span></div>` };
  const cols=ATTR_BANDS.map(([b,l])=>{ const ks=K.map((k,j)=>[k,j]).filter(([k])=>(ATTRS.band[k]||"t")===b); if(!ks.length)return "";
    return `<div style="flex:1 1 180px;min-width:0"><div style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin:4px 0">${l}</div>${ks.map(([k,j])=>cell(k,j)).join("")}</div>` }).join("");
  const role=attrRole(p);
  return `<div class="grouphead">Attributes${role?` &middot; <span style="text-transform:none;letter-spacing:0">${esc(role)}</span>`:""}</div>
    <div class="attrgrid" style="display:flex;flex-wrap:wrap;gap:4px 18px;font-size:13px">${cols}</div>
    <div class="fnote" style="margin:4px 0 10px">1-20 against the league. Together they make up his rating (${p.r}); ${attrPlays()?"each one also plays in the game as it says.":"in this game they don't yet change how he plays, only how he develops."}${was?" Arrows: last summer.":""}</div>` }
/* the roster's shape: each attribute's average among your starters who have it, ranked in the league (soccer: your
   division), the two best and the worst (Ian's design: "you can see what your team is and what it lacks") */
function attrTeamShape(t){
  if(!attrOn()||!SEA||!SEA.roster)return null;
  const teams=LEAGUE.groupFilter&&typeof CONF!=="undefined"?NAMES.filter(x=>CONF[x]===CONF[t]):NAMES;
  const val=x=>{ const R=SEA.roster[x]||[], s={}, n={}; for(let i=0;i<POS.length;i++){ const p=R[i], A=p&&attrOf(p); if(!A)continue; Object.keys(A).forEach(k=>{ s[k]=(s[k]||0)+A[k]; n[k]=(n[k]||0)+1 }) }
    const o={}; Object.keys(s).forEach(k=>o[k]=s[k]/n[k]); return o };
  const V={}; teams.forEach(x=>V[x]=val(x)); const mine=V[t]||{};
  const rk=Object.keys(mine).map(k=>({k:k,r:1+teams.filter(x=>V[x][k]!=null&&V[x][k]>mine[k]).length}));
  if(!rk.length)return null; rk.sort((a,b)=>a.r-b.r||(a.k<b.k?-1:1));
  return {best:rk.slice(0,2), worst:rk[rk.length-1], n:teams.length} }
function attrShapeHTML(t){ const S0=attrTeamShape(t); if(!S0)return "";
  const nm=x=>`${esc(ATTRS.name[x.k])} ${ordinal(x.r)}`;
  return `<div class="note"><b>Your shape:</b> ${S0.best.map(nm).join(", ")} of ${S0.n}${S0.worst&&S0.best.indexOf(S0.worst)<0?`; ${nm(S0.worst)}`:""}. ${attrPlays()?"Each plays in the game as its name says.":"For now they show who your players are and how they'll grow; this game's engine doesn't read them yet."}</div>` }
/* training focus (the summer's development, your team only): one attribute for each training group, or balanced. The
   chosen one takes ATTR_FOCUS times its share of a gain (the rest a little less), so the rating moves as it would
   have: nothing is free, only where it lands. Offered where attributes play (ATTRS.plays). */
function attrTrainOn(){ return attrOn()&&typeof ATTRS.plays==="function"&&!!ATTRS.train }
function attrTrainHTML(){
  if(!attrTrainOn()||!S||!S.off)return ""; const T=S.train||{};
  const row=(gname,G)=>{ const cur=T[G.groups[0]]||"";
    return `<div style="margin:6px 0"><div class="fnote" style="margin-bottom:4px">${esc(gname)}</div><div class="subtabs" style="flex-wrap:wrap">${[["","Balanced"]].concat(G.keys.map(k=>[k,ATTRS.name[k]])).map(([k,l])=>
      `<button class="subtab" data-train="${esc(gname)}|${k}" aria-pressed="${cur===k}">${esc(l)}</button>`).join("")}</div></div>` };
  return `<div class="card" style="padding:8px 12px;margin:8px 0"><div class="grouphead" style="margin-top:0">Training focus</div>
    <div class="fnote">Where this ${OFFW()}'s development lands on your players. The focus takes half again its usual share of a gain and the rest a little less, so a player's rating moves as it would have: you choose what kind of player he grows into.</div>
    ${Object.keys(ATTRS.train).map(g=>row(g,ATTRS.train[g])).join("")}</div>` }
function attrTrainSet(gname,k){ const G=ATTRS.train[gname]; if(!G)return; S.train=Object.assign({},S.train||{}); G.groups.forEach(g=>{ if(k)S.train[g]=k; else delete S.train[g] }) }
