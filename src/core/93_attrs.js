/* round 87 (Ian, the player attributes design): a player is a shape, not one number. Each sport names 7-10
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
      if(p.ar!==p.r)attrDevelop(p,F[g]); else if(summer)p.ap=p.at.slice() }) });   // a summer with no change: no arrows
  if(summer&&typeof eng26==="function"&&eng26())attrRecentre26(u) }
/* engine 26 (review round 2): the league's shape holds. Gains go to the young, and the young take them in physical
   attributes (ATTR_AGE), so over sixteen summers hockey's league-mean lean went Skating +0.38, Defence -0.39 and goals a
   game 6.2 to 7.9 (computer clubs pick the plan their rosters suit). Each summer the average lean of each attribute,
   in each group, goes back to where a fresh league has it (the generation's lean, ATTRS.lean); a man keeps how he
   leans against the others. Rounded by his own hash (a shift of 0.03 a summer moves the league, not nobody), and his
   attributes still sum to his rating (attrFix). No dice. */
function attrRecentre26(u){
  const by={};
  Object.keys(u.roster).forEach(t=>{ const R=u.roster[t]; if(!Array.isArray(R))return;
    R.forEach(p=>{ if(!p||p.r==null||!Array.isArray(p.at))return; const g=attrGrp(p), K=attrKeys(g); if(!K.length||p.at.length!==K.length)return;
      (by[g]=by[g]||[]).push(p) }) });
  // round 112: the shift read from the other clubs only (as recentre26), and made to every man
  const mine=new Set(); if(typeof humanTeams26==="function")humanTeams26().forEach(t=>{ if(Array.isArray(u.roster[t]))u.roster[t].forEach(p=>{ if(p)mine.add(p) }) });
  Object.keys(by).forEach(g=>{
    const K=attrKeys(g), W=ATTRS.w[g], M=(ATTRS.lean&&ATTRS.lean[g])||{}, P=by[g]; if(P.length<8)return;
    const O=P.filter(p=>!mine.has(p)); if(O.length<8)return;
    const mw=K.reduce((s,k)=>s+W[k]*(M[k]||0),0), sh=K.map((k,j)=>O.reduce((s,p)=>s+p.at[j]-p.r,0)/O.length-((M[k]||0)-mw));
    if(sh.every(x=>Math.abs(x)<0.02))return;
    P.forEach(p=>{ const v=p.at.map((x,j)=>Math.max(1,Math.floor(x-sh[j]+hash01("lean|"+p.n+"|"+K[j]+"|"+u.year))));
      p.at=attrFix(v,W,K,p.r); p.ar=p.r }) }) }
/* a player's attributes as {key: value on the rating scale}: his own, or (a prospect, a free agent not yet
   synced) the shape he will arrive with */
function attrOf(p){ if(!attrOn()||!p)return null; const g=attrGrp(p), K=attrKeys(g); if(!K.length)return null;
  const v=Array.isArray(p.at)&&p.at.length===K.length&&p.ar===p.r?p.at:attrGen(typeof U!=="undefined"?U:null,p); if(!v)return null;
  const o={}; K.forEach((k,j)=>o[k]=v[j]); return o }
/* round 96 (the odd grids): shown 1-20 against every rostered player in the league, not the starters alone, with soft
   tails, so a backup isn't a column of 1s and a star reaches 18-20 (on the starters' scale 7-10% of the pro games'
   attributes read 1, hockey's best read 18). Constants fixed: measured once, every club's roster as a career opens. Display
   only: shapes, roles and every engine read the rating scale (ATTR_SCALE above). */
const ATTR_SHOW={cfb:{m:54.2,s:15.1}, nfl:{m:61.4,s:9.2}, ncaab:{m:54.8,s:15.5}, nba:{m:54.4,s:9.4}, nhl:{m:53.8,s:8.9},
  epl:{m:43.6,s:16.9}, mlb:{m:53.5,s:8.9}}, ATTR_TAIL=1.55, ATTR_SHOW_ON=true;
function attrShow(v){ const A=ATTR_SHOW[LEAGUE.id];
  if(!ATTR_SHOW_ON||!A){ const S=attrScale(); return Math.max(1,Math.min(20,Math.round(11+(v-S.m)/S.s*3))) }
  return Math.max(1,Math.min(20,Math.round(10.5+9.5*Math.tanh((v-A.m)/(A.s*ATTR_TAIL))))) }
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
/* round 96 (Grokbot's point 4, "explain how the attributes make the rating"): each attribute's weight for his position
   beside it (pips: counts most, more, less), heaviest first in each band, and the line says which count most */
function attrPips(w,mx){ const n=w>=mx*0.75?3:w>=mx*0.4?2:1; return n }
function attrGridHTML(p){
  const A=attrOf(p); if(!A)return ""; const g=attrGrp(p), K=attrKeys(g), W=ATTRS.w[g], was=Array.isArray(p.ap)&&p.ap.length===K.length?p.ap:null;
  const mx=Math.max(...K.map(k=>W[k])), byW=K.slice().sort((x,y)=>W[y]-W[x]);
  const pipWord=["","counts less toward his rating","counts more toward his rating","counts most toward his rating"];
  const cell=(k,j)=>{ const v=attrShow(A[k]), d=was?v-attrShow(was[j]):0, n=attrPips(W[k],mx);
    return `<div class="attr" title="${esc(ATTRS.desc[k]||"")}"><div class="attrn"><span class="attrw" title="${pipWord[n]}" aria-label="${pipWord[n]}">${"<i class=on></i>".repeat(n)}${"<i></i>".repeat(3-n)}</span>${n===3?`<b>${esc(ATTRS.name[k])}</b>`:esc(ATTRS.name[k])}<small>${esc(ATTRS.desc[k]||"")}</small></div>
      <div class="attrbar" aria-hidden="true"><i style="width:${v*5}%;background:${attrColor(v)}"></i></div>
      <div class="attrv">${d>0?`<span style="color:var(--turf)">&#9650;${d}</span>`:d<0?`<span style="color:var(--flag)">&#9660;${-d}</span>`:""}<b style="color:${attrColor(v)}">${v}</b></div></div>` };
  const rows=ATTR_BANDS.map(([b,l])=>{ const ks=K.map((k,j)=>[k,j]).filter(([k])=>(ATTRS.band[k]||"t")===b).sort((x,y)=>W[y[0]]-W[x[0]]); if(!ks.length)return "";
    return `<div class="attrband">${l}</div>${ks.map(([k,j])=>cell(k,j)).join("")}` }).join("");
  const role=attrRole(p), nm=k=>esc(ATTRS.name[k]);
  const most=byW.filter(k=>attrPips(W[k],mx)===3), least=byW[byW.length-1];
  const how=`Weighted for his position: ${most.map(nm).join(" and ")} count${most.length>1?"":"s"} most${byW.length>most.length+1?`, ${nm(least)} least`:byW.length>most.length?`, then ${nm(least)}`:""}.`;
  return `<div class="grouphead">Attributes${role?` &middot; <span style="text-transform:none;letter-spacing:0">${esc(role)}</span>`:""}</div>
    <div class="attrgrid">${rows}</div>
    <div class="fnote" style="margin:4px 0 10px">${how} His rating (${p.r}) is that weighted mix, so the 1-20s won't average to it: they show where he leans, against every player in the league${attrPlays()?", and each plays in the game as it says":"; this season began on an older version of the game, so they shape how he develops but not how he plays until next season"}.${was?" Arrows: last summer.":""}</div>` }
/* the roster's shape: each attribute's average among your starters who have it, ranked in the league (soccer: your
   division), the two best and the worst (Ian's design: "you can see what your team is and what it lacks") */
function attrTeamShape(t){
  if(!attrOn()||!SEA||!SEA.roster)return null;
  const teams=LEAGUE.groupFilter&&typeof CONF!=="undefined"?NAMES.filter(x=>CONF[x]===CONF[t]):NAMES;
  const val=x=>{ const R=SEA.roster[x]||[], s={}, n={}; for(let i=0;i<POS.length;i++){ const p=R[i], A=p&&attrOf(p); if(!A)continue; Object.keys(A).forEach(k=>{ s[k]=(s[k]||0)+A[k]; n[k]=(n[k]||0)+1 }) }
    const o={}; Object.keys(s).forEach(k=>o[k]=s[k]/n[k]); return o };
  const V={}; teams.forEach(x=>V[x]=typeof sportShape==="function"&&sportShape(x)||val(x)); const mine=V[t]||{};   // round 88: where the engine reads a team's shape, rank that
  const rk=Object.keys(mine).map(k=>({k:k,r:1+teams.filter(x=>V[x][k]!=null&&V[x][k]>mine[k]).length}));
  if(!rk.length)return null; rk.sort((a,b)=>a.r-b.r||(a.k<b.k?-1:1));
  return {best:rk.slice(0,2), worst:rk[rk.length-1], n:teams.length} }
function attrShapeHTML(t){ const S0=attrTeamShape(t); if(!S0)return "";
  const nm=x=>`${esc(ATTRS.name[x.k])} ${ordinal(x.r)}`;
  return `<div class="note"><b>Your shape:</b> ${S0.best.map(nm).join(", ")} of ${S0.n}${S0.worst&&S0.best.indexOf(S0.worst)<0?`; ${nm(S0.worst)}`:""}. ${attrPlays()?"Each plays in the game as its name says.":"This season began on an older version of the game: they shape how your players grow, and play in games from next season."}</div>` }
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

/* round 89 (engine 12): a computer club plays the plan its roster suits (Ian: computer clubs choose a plan for their
   shape). Only when the fit is worth it (PLAN_PICK_MIN Elo over balanced, as the plan rows' line), and only when the
   plan's own shape at this gap doesn't take it back: more events favour the better side, fewer the weaker (sportPlanShift,
   measured per sport: the Elo on the balanced curve that a plan is worth at a gap, with no lean). gap: this side's edge.
   human: the fit on a person's path (the plan also picks a person's system), for your assistant's pick. */
const PLAN_PICK_MIN=12;
/* round 110 (engine 24): your assistant's pick is a read, as good as your staff (Ian: the player shouldn't be told the
   best plan). Each plan's worth tonight, as the engine has it, plus his error: a spread from 9 Elo for the best staff
   (assistants rated 62) to 40 for the worst (-52), drawn from the game (club, season, step), so a reload asks the same.
   The card says what he'd pick; Sim ahead plays it. */
function staffReadQ(t){ try{ const o=U&&U.oc&&U.oc[t], d=U&&U.dc&&U.dc[t]; if(!o&&!d)return 0; return ((o?o.q:0)+(d?d.q:0))/((o?1:0)+(d?1:0)) }catch(e){ return 0 } }
const ASST_K=+((typeof process!=="undefined"&&process.env&&process.env.ASST_K)||1);
function staffReadSD(t){ const q=Math.max(-52,Math.min(62,staffReadQ(t))), cap=typeof sportPlanCap==="function"?sportPlanCap():40; return ASST_K*cap*(0.9-0.6*(q+52)/114) }   // as a share of the sport's plan cap: 0.9 of it for the worst staff, 0.3 for the best
function assistantPlan(t,gap,opp,step){
  const sd=staffReadSD(t), r=mulberry32(strHash("asst|"+t+"|"+(SEA&&SEA.year)+"|"+(step!=null?step:SEA&&SEA.step)+"|"+(opp||""))>>>0), g=()=>{ let u=0,v=0; while(!u)u=r(); while(!v)v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v) };
  let best="balanced", bv=g()*sd*0.5;
  ["safe","aggressive"].forEach(pl=>{ const v=planEdge(t,pl,gap||0,opp)+g()*sd; if(v>bv){ bv=v; best=pl } });
  return best }
function cpuPlanOf(t,gap,human,opp){ if(typeof ENGINE_V==="undefined"||ENGINE_V<12||typeof sportPlanFit!=="function"||!t)return "balanced";
  if(human&&opp&&ENGINE_V>=24)return assistantPlan(t,gap,opp);
  let best="balanced", bv=0;
  // round 109: your assistant, on your path, reads tonight's opponent too (planVs: 0 before engine 23 or with no opp)
  ["safe","aggressive"].forEach(pl=>{ const f=(human||typeof sportPlanFitC!=="function"?sportPlanFit(t,pl):sportPlanFitC(t,pl))+(human&&opp?planVs(t,opp,pl):0); if(!(f>=PLAN_PICK_MIN))return;
    const v=f+(typeof sportPlanShift==="function"?sportPlanShift(pl,gap||0):0); if(v>bv){ bv=v; best=pl } });
  return best }
/* round 94 (engine 17): the plan your roster suits is worth about 8 points of win chance at even for a roster one league
   spread off the average, up to 15 (Ian, after Grokbot: "make roster fit move the win chance in every game"). Each sport
   keeps its measured fit (round 88-92: what the plan's own channels already give a lean) and amplifies it by its own M
   (one spread of fit to 8 points on its curve), held to +/-cap; the extra is played through the plan's own events, so
   the box score carries it. Balanced is untouched. */
function planAmpV(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=17 }
function planAmp(f,A){ if(!planAmpV()||!A||!f)return f||0; const v=A.m*f; return Math.max(-A.cap,Math.min(A.cap,v)) }
/* round 109 (engine 23; Grokbot, round 13: "in Football Manager, a tactic that is right against one side is wrong against
   another. Until that is true here, the plan is a setting, not a decision"). On a person's side a plan is worth what his
   roster suits it over what tonight's opponent's roster suits it (PLAN_VS_K of theirs), held to the sport's cap: skating
   with a quicker side is worth less, with a slower one more. Averaged over the league the opponent's part is the
   league's mean fit, so a person who picks blind gains nothing; the computer's games are untouched (no calibration
   moves). Each sport plays it where it plays the amplified fit (planAmp's extra), so the box score carries it. */
const PLAN_VS_K=+((typeof process!=="undefined"&&process.env&&process.env.PLAN_VS_K)||0);   // a test's override; 0: the engine's own
/* round 110 (engine 24): tonight's opponent counts for more against your roster's fit, so the best plan turns with the
   opponent for every roster (Muse: one plan best against four opponents in pro basketball, baseball and soccer). Applied
   once, here (the sports' counters had it inside too: the same at 1). */
const PLAN_VS_K24=+((typeof process!=="undefined"&&process.env&&process.env.PLAN_VS_K24)||2);   // measured (scratch r110 modal-K*.txt, 10 rosters a game): the most one-plan roster at 1 / 2: nfl 97/71%, ncaab 96/79, nhl 94/87, epl 97/82, mlb 83/79
function planVsK(){ return PLAN_VS_K||(typeof ENGINE_V!=="undefined"&&ENGINE_V>=24?PLAN_VS_K24:1) }
function planVsV(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=23 }
/* the total a person's plan is worth from rosters, given his amplified fit f and the opponent's fo, held to cap */
function planVsTot(f,fo,cap){ const v=f-planVsK()*(fo||0); return cap?Math.max(-cap,Math.min(cap,v)):v }
/* in the chance: the opponent's part (the total less your own fit), 0 before engine 23 or where a sport has no counter */
/* basketball and football plan your offence, so there the opponent's part is their defence against it (sportPlanVsC: in
   Elo, a league spread of the defence that answers the plan worth a spread of fit); hockey and soccer play one game
   both ways, so there it is how well their roster suits the same plan */
function planVsOpp(o,pl){ return typeof sportPlanVsC==="function"?sportPlanVsC(o,pl):-sportPlanFit(o,pl) }
function planVs(t,o,pl){ if(!planVsV()||!t||!o||!pl||pl==="balanced"||typeof sportPlanFit!=="function"||typeof sportPlanCap!=="function")return 0;
  const f=sportPlanFit(t,pl); return planVsTot(f,-planVsOpp(o,pl),sportPlanCap())-f }
/* a plan's shift [at even, per Elo of gap], the gap held to +/-300 (a line fitted to the measured points, -225..225) */
function planShiftAt(T,gap){ return T?T[0]+T[1]*Math.max(-300,Math.min(300,gap||0)):0 }
/* what your plan is worth tonight on your own path, in Elo on the balanced curve: your roster's fit, and (engine 12,
   Ian round 89) the plan's own measured worth at tonight's gap. gap: your edge before plans */
function planEdge(t,pl,gap,o){ if(!pl||pl==="balanced")return 0; return (typeof sportPlanFit==="function"?sportPlanFit(t,pl):0)+(typeof sportPlanShiftH==="function"?sportPlanShiftH(pl,gap||0):0)+(o?planVs(t,o,pl):0) }
/* your edge in your next game before any plan, for the plan rows */
/* round 109: the game the card shows. A league with a game most days (LEAGUE.skipIdle: hockey, baseball) plays through
   the days you're off, so the card names your next game; the plan's reason and gap read the same game (on an off day
   they read none and fell back to the roster-only line: hockey 129 cards of 240 over four seasons, 96 naming a plan
   that wasn't tonight's best; baseball 28, all of them) */
function cardGame(t){ let g=SEA&&SEA.nextGame?SEA.nextGame(t):null;
  if(!g&&SEA&&SEA.phase==="week"&&LEAGUE.skipIdle)g=SEA.sched.filter(x=>x.week>SEA.step&&(x.home===t||x.away===t)).sort((x,y)=>x.week-y.week)[0]||null;
  return g }
/* round 110: the step of the card's game, for a club in it (baseball named today's starter, not the game's: Instinct, a
   Probable Starters line and a card naming two different men) */
function cardStepFor(o){ try{ const g=typeof S!=="undefined"&&S&&S.myTeam?cardGame(S.myTeam):null; return g&&(g.home===o||g.away===o)?g.week:SEA.step }catch(e){ return SEA.step } }
function planGapNow(t){ try{ const g=cardGame(t); if(!g)return 0; const e=SEA.matchupElo(g,"balanced"), d=e.h-e.a; return g.home===t?d:-d }catch(e){ return 0 } }
/* the plan rows' words (hockey and soccer; basketball words its own): which plan the roster suits, once the gap is
   worth PLAN_PICK_MIN Elo. lean: what each plan's roster leans to */
function planFitWords(t,pl,lean){ if(typeof PLANS==="undefined"||typeof sportPlanFit!=="function")return "";
  const v={safe:sportPlanFit(t,"safe"),balanced:0,aggressive:sportPlanFit(t,"aggressive")}; let best=Object.keys(v).reduce((a,b)=>v[b]>v[a]?b:a,"balanced");
  // never a plan that is a net loss tonight (its own worth on your path at this gap: Ian, round 89)
  if(best!=="balanced"&&planEdge(t,best,planGapNow(t))<=0)best="balanced";
  if(best!==pl&&v[best]-v[pl]>=PLAN_PICK_MIN)return best==="balanced"?`Your roster doesn't suit this plan: <b>${esc(PLANS.balanced.l)}</b> fits it better.`:`Your roster leans to its ${lean[best]}: <b>${esc(PLANS[best].l)}</b> suits it.`;
  return best===pl&&pl!=="balanced"&&v[pl]>=PLAN_PICK_MIN?`This plan suits your ${lean[pl]}.`:"" }

/* ============ round 92 (engine 15): each club's usual style comes from its roster ============
   (Ian: the roster's lean, near-ties kept on the hash; set once as the season opens, so a trade doesn't change it and a
   reload plays the same.) Each sport scores its styles from the opening roster's shape (sportStyleScores); each score
   is taken against the league (z: the league's mean and spread that season), and a club plays the style it leans to
   most. Where its top two are within STYLE_TIE of a spread, the old hash picks between those two, so a flat roster stays
   hard to read. A league whose scores are all level (no attributes) keeps the hash outright. */
const STYLE_TIE=0.25;
function styleTable(sea){ if(typeof ENGINE_V==="undefined"||ENGINE_V<15||typeof sportStyleScores!=="function"||!sea||!sea.roster)return null;
  const T=Object.keys(sea.roster).filter(t=>Array.isArray(sea.roster[t])), S={}; if(!T.length)return null;
  T.forEach(t=>{ try{ S[t]=sportStyleScores(sea.roster[t])||null }catch(e){ S[t]=null } });
  const K=Object.keys(S[T.find(t=>S[t])]||{}); if(!K.length)return null;
  const mu={}, sd={}; K.forEach(k=>{ const v=T.map(t=>S[t]?S[t][k]:0); mu[k]=v.reduce((a,b)=>a+b,0)/v.length; sd[k]=Math.sqrt(v.reduce((a,b)=>a+(b-mu[k])**2,0)/v.length) });
  if(K.every(k=>!(sd[k]>1e-9)))return null;
  const out={style:{},rank:{},n:T.length};
  T.forEach(t=>{ if(!S[t])return; const z=K.map(k=>[k,sd[k]>1e-9?(S[t][k]-mu[k])/sd[k]:0]).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1));
    out.style[t]=z[0][1]-z[1][1]<STYLE_TIE?[z[0][0],z[1][0]].sort()[strHash(t+"|"+sea.year)%2]:z[0][0] });
  K.forEach(k=>{ T.filter(t=>S[t]).sort((a,b)=>S[b][k]-S[a][k]||(a<b?-1:1)).forEach((t,i)=>{ (out.rank[t]=out.rank[t]||{})[k]=i+1 }) });
  if(typeof sportSeasonNorms==="function")try{ out.norm=sportSeasonNorms(sea) }catch(e){}   // football: the league's offense, for reads tied to the roster
  if(typeof sportLeanSD==="function")try{ out.leanSD=sportLeanSD(S,T) }catch(e){}   // round 94: baseball's lineup lean, its spread fixed as the season opens (a reload asks at another moment)
  return out }
/* the season's style for a club, when it comes from the roster (else null: the caller keeps its hash) */
function rosterStyle(t,year){ try{ return typeof SEA!=="undefined"&&SEA&&SEA.year===year&&SEA._styles&&SEA._styles.style[t]||null }catch(e){ return null } }
/* the scouting report's line on their roster (Ian: one line): where it ranks in the league for each style's attributes,
   as the season opened (what the style was read from) */
function styleRosterLine(t){ try{ const X=typeof SEA!=="undefined"&&SEA&&SEA._styles, R=X&&X.rank[t]; if(!R||typeof sportStyleAttrs==="undefined")return "";
  // round 93: soccer ranks a club in its own division (a tester's Championship line read "of 184", then "of 164": the whole
  // pyramid); the order is the table's, so the style it names is the same
  let rk=R, n=X.n; if(typeof LEAGUE!=="undefined"&&LEAGUE.id==="epl"&&typeof CONF!=="undefined"&&CONF[t]!==undefined){ const P=Object.keys(X.rank).filter(o=>CONF[o]===CONF[t]); n=P.length; rk={};
    Object.keys(R).forEach(k=>{ rk[k]=1+P.filter(o=>X.rank[o][k]<R[k]).length }) }
  const K=Object.keys(sportStyleAttrs).filter(k=>rk[k]).sort((a,b)=>rk[a]-rk[b]||R[a]-R[b]);
  return `<div class="evn"><b>Their roster</b>, as the season opened: ${K.map(k=>`${esc(sportStyleAttrs[k])} ${ordinal(rk[k])}`).join(", ")} of ${n}${n<X.n?" in their division":""}. Clubs play to their rosters.</div>` }catch(e){ return "" } }
