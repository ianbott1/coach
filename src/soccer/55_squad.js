/* ============ the squad on matchday: soccer (engine 26) ============ */
/* Review round 2 (the matchday): who plays, in what shape, and how fresh they are.

   Condition. A man who plays ninety minutes comes off with SC_CND.drop less in his legs and gets SC_CND.rec back a
   day (a keeper runs less: SC_CND.gk of it), so a week between games puts everyone back to full and a Saturday,
   Tuesday, Saturday run starts the men who played all three at about 95 on the Tuesday and 97 on the Saturday. Full recovery after a match
   takes about 72 hours or more (Nedelec and others, "Recovery in soccer", Sports Medicine 2012). What it costs: legs
   at kick-off (50_game SC26.cnK) and, for a club whose starters are short of it, knocks: injuries per match in the
   Champions League injury study ran 1.09 times as high with four days or fewer of rest as with six or more (muscle
   injuries 1.32: Bengtsson, Ekstrand and Hagglund, BJSM 2013, bjsm.bmj.com/lookup/doi/10.1136/bjsports-2013-092383).
   The days: league games on the date of their week, cup ties three days later (87_cup cupDate).

   The team sheet. Each unit's first choice starts unless he's hurt or rested; the computer (and your assistant, until
   you pick) rests a man short of condition when the man behind him is close, and in a cup tie against a club from a
   lower division rests any whose man behind is close, the keeper too. Its formation is the one
   its squad suits best (the most of its rating on the units the shape leans on). Your own picks for a game, and your
   formation from a game on, are kept in the save (S.xiLog, S.xiFm) so a reload plays them the same. */
const SC_CND={drop:26, rec:7, gk:0.35, floor:30,
  restC:97, restGap:8,         // the computer rests a man under 97 when the man behind him is within 8 and fresher
  cupGap:10,                   // and in a cup tie against a lower division, any man whose deputy is within 10
  injK:1.5,                    // knocks: 1 + injK x the starters' shortfall
  legsP:0.8,                   // what a side's kick-off legs are worth over a game, against the engine's legs at kick-off
  xiP:0.45};                   // and a man started over the usual (the changes put him right, and freshen the line):
                               // both measured, engine games against Elo gaps (test/sc-manager.js part 4)
const SC_MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
let SC_DAYS=null;
/* days since the season's first Saturday: a league game on its week's date, a cup tie three days after it, a play-off
   game a week after the last */
function scDayOf(step,half){
  if(!SC_DAYS){ const D=LEAGUE.dates||[], at=i=>{ const m=String(D[i]||"").split(" "), mi=SC_MON.indexOf(m[0]); return mi<0?NaN:Date.UTC(mi>=7?2026:2027,mi,+m[1])/864e5 };
    SC_DAYS=D.map((_,i)=>Math.round(at(i)-at(0))) }
  const n=SC_DAYS.length, d=step<n?SC_DAYS[step]:(SC_DAYS[n-1]||0)+7*(step-n+1);
  return (isNaN(d)?step*7:d)+(half?3:0) }
function scCndOf(sea){ if(!sea._cnd)Object.defineProperty(sea,"_cnd",{value:{},writable:true,enumerable:false}); return sea._cnd }
/* a man's condition on a day, 0-100: what the last game left him with, and the days since */
function scCond(sea,t,p,day){ if(!sea||!p)return 100; const C=scCndOf(sea)[t], x=C&&C.c[p.n]; if(!x)return 100;
  return Math.min(100,Math.round((x[0]+SC_CND.rec*Math.max(0,day-x[1]))*10)/10) }
function scTier(t){ try{ return DIVS[CONF[t]].tier }catch(e){ return 0 } }
function scIdx(year,step,half){ return year*1000+step*2+(half?1:0) }
/* the step and half a game in hand is played on: the season's own (a game being played), or the card's */
function scWhen(sea){ return {step:sea.step, half:sea.half?1:0} }
/* each unit as the sheet sees it: the first choice (s) and the man behind him (b), their ratings, names, conditions,
   and who's fit (av) */
function scUnits(sea,t,day){ const R=sea.roster&&sea.roster[t]; if(!R)return null;
  const H=new Set(sea.talent?sea.talent.active(t).map(x=>x.idx):[]);
  return POS.map((P,u)=>{ const a=R[u], b=R[BK(u)], ha=!a||H.has(u), hb=!b||H.has(BK(u));
    return {s:a?a.r:null, b:b?b.r:(a?a.r-P.drop:null), ns:a?a.n:null, nb:b?b.n:null, cs:scCond(sea,t,a,day), cb:scCond(sea,t,b,day),
      av:!ha&&!hb?"both":!ha?"s":!hb?"b":""} }) }
/* the shape a squad suits: the most of its men's rating on the units each formation leans on; the computer's pick leans
   a little to the shapes clubs play now (FORMATIONS pop) */
function scFmScore(U,fm){ let v=0; U.forEach((q,u)=>{ const r=q.av==="b"?q.b:q.s; if(r!=null)v+=fmW(fm,u)*r }); return v }
function scBestFm(U){ const v=k=>scFmScore(U,k)+(FORMATIONS[k].pop||0); return FM_KEYS.reduce((a,k)=>v(k)>v(a)+1e-9?k:a,FM_KEYS[0]) }
/* the computer's (and your assistant's) team: rest a tired man when the man behind him is close; in a cup tie against a
   lower division, rest more */
function scAutoOn(U,cupLow){ const C=SC_CND;
  return U.map((q,u)=>{ if(q.av!=="both")return q.av==="b"?1:0;
    // the keeper: rested only for a cup tie against a lower division (his legs are back by the next game). The feed,
    // the box and the clips name the keeper the sheet started (stats follow-up; it named the first choice before)
    if(u===0)return cupLow&&q.b>=q.s-C.cupGap?1:0;
    if(q.cs<C.restC&&q.b>=q.s-C.restGap&&q.cb>=q.cs)return 1;
    if(cupLow&&q.b>=q.s-C.cupGap)return 1;
    return 0 }) }
/* your picks, as the save keeps them: the formation from a game on (S.xiFm[team]: [[game, shape], ...]), who starts in a
   game (S.xiLog["team|game"]: {on}) */
function scSaved(){ return typeof S!=="undefined"&&S?S:null }
function scUserFm(t,idx){ const SV=scSaved(), F=SV&&SV.xiFm&&SV.xiFm[t]; let f=null; if(F)F.forEach(x=>{ if(x[0]<=idx&&FORMATIONS[x[1]])f=x[1] }); return f }
function scUserOn(t,idx){ const SV=scSaved(), L=SV&&SV.xiLog&&SV.xiLog[t+"|"+idx]; return L&&Array.isArray(L.on)?L.on:null }
/* one side's sheet for a game (ctx.xi): the shape, each unit (with on: who starts), the day */
function scSheet(sea,t,opp,step,half,asAuto){
  const day=scDayOf(step,half), U=scUnits(sea,t,day); if(!U)return null;
  const idx=scIdx(sea.year,step,half), cupLow=!!half&&scTier(opp)>scTier(t);
  const auto=scAutoOn(U,cupLow), mine=asAuto?null:scUserOn(t,idx);
  const on=U.map((q,u)=>q.av==="both"&&mine?(mine[u]?1:0):auto[u]);
  U.forEach((q,u)=>{ q.on=on[u]; q.auto=auto[u] });
  return {fm:(asAuto?null:scUserFm(t,idx))||scBestFm(U), afm:scBestFm(U), u:U, day:day, cupLow:cupLow} }
/* gameCtx's part (50_game): both sides, for the game being played now */
function scXiCtx(h,a,sea,step){ try{ sea=sea||(typeof SEA!=="undefined"?SEA:null); if(!scV26()||!sea||!sea.roster)return undefined;
  const st=step==null?sea.step:step, hf=st===sea.step&&sea.half?1:0;
  const H=scSheet(sea,h,a,st,hf), A=scSheet(sea,a,h,st,hf); if(!H||!A)return undefined;
  const strip=X=>({fm:X.fm,u:X.u.map(q=>({s:q.s,b:q.b,ns:q.ns,nb:q.nb,cs:q.cs,cb:q.cb,av:q.av,on:q.on}))});
  return {home:strip(H),away:strip(A)} }catch(e){ return undefined } }
/* after a game (core Season._resolve): each man's minutes off his condition, from who started (the first stretch's
   xi0) and the changes (each stretch's sb); and how fresh the club's starters were, for this week's knocks */
function sportAfterGame(sea,a,b,drives){ if(!scV26()||!sea||!Array.isArray(drives)||!drives.length)return;
  const d0=drives.find(d=>d&&d.xi0); if(!d0)return;
  const w=scWhen(sea), day=scDayOf(w.step,w.half), et=drives.some(d=>d&&d.seg>=SEGS), C=scCndOf(sea);
  [[a,"home"],[b,"away"]].forEach(([t,sd])=>{ const R=sea.roster&&sea.roster[t], on0=d0.xi0[sd]; if(!R||!on0)return;
    const at={}; drives.forEach(d=>{ const L=d&&d.sb&&d.sb[sd]; if(L)L.forEach(u=>{ if(at[u]==null)at[u]=d.seg }) });
    const K=C[t]=C[t]||{c:{},k:null}; let kv=0, kw=0;
    POS.forEach((P,u)=>{ const first=R[on0[u]?BK(u):u], second=R[on0[u]?u:BK(u)], sg=at[u];
      const len=90+(et?30:0), m1=sg!=null?Math.min(len,sg*5):len, m2=sg!=null?len-m1:0;
      [[first,m1],[second,m2]].forEach(([p,m])=>{ if(!p||!(m>0))return; const c0=scCond(sea,t,p,day);
        if(p===first&&u>0){ kv+=posW(P)*c0; kw+=posW(P) }
        K.c[p.n]=[Math.max(SC_CND.floor,c0-SC_CND.drop*m/90*(u===0?SC_CND.gk:1)),day] }) });
    if(kw)K.k={w:w.step,half:w.half,v:kv/kw} }) }
/* core Talent.advance: a club whose starters began the week's league game short of condition picks up more knocks
   (1 + injK x the shortfall: about 1.15 at 90, the study's 1.09 to 1.32) */
function sportInjMul(t,w){ if(!scV26()||typeof SEA==="undefined"||!SEA)return 1; const K=scCndOf(SEA)[t], k=K&&K.k;
  return k&&k.w===w-1?1+SC_CND.injK*Math.max(0,1-k.v/100):1 }
/* the next game of a club, as the card and the shown chance see it: its step, half (a cup tie is the week's second
   half) and opponent */
function scNext(t){ const sea=typeof SEA!=="undefined"?SEA:null; if(!sea)return null; let g=null;
  try{ g=typeof cardGame==="function"?cardGame(t):null }catch(e){ g=null }
  if(g&&g.week>=sea.step&&(g.home===t||g.away===t))return {step:g.week,half:g.cup?1:0,opp:g.home===t?g.away:g.home};
  return {step:sea.step,half:sea.half?1:0,opp:null} }
/* kick-off legs, as the engine takes them (50_game): each line's men weighted by their share */
function scLegsKick(Q){ const g=[[0,0],[0,0],[0,0]]; Q.u.forEach((q,u)=>{ if(u===0)return; const w=posW(POS[u]), G=SC26.grp[u];
  g[G][0]+=w*scLegs0(q.on?q.cb:q.cs); g[G][1]+=w }); return g.map(x=>x[1]?x[0]/x[1]:1) }
/* what tonight's sheet is worth in Elo, for the shown chance: who starts (50_game scXiElo) and the legs they start
   with, against the same squad's first choices fresh. The shape's fit is left out, as a plan's is (clicking through the
   shapes mustn't read out the answer); a backup started does move it. */
function scSheetElo(Q){ const x=SC_CND.xiP*scXiElo({fm:null,u:Q.u},Q.u.map(q=>q.on?1:0));
  const L=scLegsKick(Q), own=0.6*(1-L[2])+0.4*(1-L[1]), opp=0.6*(1-L[0])+0.4*(1-L[1]);
  return x-SC_CND.legsP*(SC.tiredOwn*own+SC.tiredOpp*opp)/SC.edge/(typeof GAP_SCALE!=="undefined"?GAP_SCALE:1) }
function sportTonightEdge(t){ if(!scV26()||typeof SEA==="undefined"||!SEA||!SEA.roster)return 0;
  try{ const n=scNext(t); const Q=scSheet(SEA,t,n.opp,n.step,n.half); if(!Q)return 0;
    // against the same men fresh, first choices wherever they're fit: what a rating already counts
    const F={u:Q.u.map(q=>Object.assign({},q,{on:q.av==="b"?1:0,cs:100,cb:100}))};
    return scSheetElo(Q)-scSheetElo(F) }catch(e){ return 0 } }
/* the next game's card: the team sheet. Your shape (the assistant's is the one your squad suits), and in each unit who
   starts, with both men's ratings and condition; a tap starts the other man for this game. Kept in the save. */
const SC_UNITL=["Keeper","Centre-back","Full-back","Midfield","Wide","Striker"];
function scMine(){ const t=typeof S!=="undefined"&&S?S.myTeam:null, n=t?scNext(t):null; if(!n||!SEA)return null;
  return {t:t,n:n,idx:scIdx(SEA.year,n.step,n.half)} }
function sportNextExtra(ng,my,step){ try{ if(!scV26()||!SEA||!SEA.roster||my!==S.myTeam)return "";
  const opp=ng.home===my?ng.away:ng.home, half=ng.cup?1:0, Q=scSheet(SEA,my,opp,step,half); if(!Q)return "";
  const sn=n=>esc(String(n||"").split(" ").slice(-1)[0]), cnd=c=>`<span class="lgs${c<90?" low":c<97?" mid":""}">${Math.round(c)}%</span>`;
  const fmB=FM_KEYS.map(k=>`<button class="setbtn" data-scfm="${esc(k)}" aria-pressed="${Q.fm===k}">${esc(k)}</button>`).join("");
  const rows=Q.u.map((q,u)=>{ if(q.s==null)return "";
    const a=`${sn(q.ns)} ${q.s} ${cnd(q.cs)}`, b=q.nb?`${sn(q.nb)} ${q.b} ${cnd(q.cb)}`:"";
    const hurt=q.av==="b"?` (${sn(q.ns)} injured)`:q.av==="s"?` (${sn(q.nb)} injured)`:q.av===""?" (both injured)":"";
    const first=q.on?b:a, other=q.on?a:b;
    const btn=q.av==="both"?`<button class="setbtn" data-scxi="${u}" style="margin-left:6px">Start ${sn(q.on?q.ns:q.nb)}</button>`:"";
    const said=q.av==="both"&&q.auto!==q.on?` <span style="color:var(--muted)">Your assistant would start ${sn(q.auto?q.nb:q.ns)}.</span>`:"";
    return `<div class="nrec"><b>${SC_UNITL[u]}</b> ${first}${other?` <span style="color:var(--muted)">&middot; bench</span> ${other}`:""}${hurt}${btn}${said}</div>` }).join("");
  const rest=Q.u.filter(q=>q.av==="both"&&q.auto).length;
  return `<div class="teamsheet"><div class="nlabel" style="margin-top:6px">TEAM SHEET</div>
    <div class="setrow">${fmB}</div>
    <div class="fnote">${esc(Q.fm)}: ${esc(FORMATIONS[Q.fm].l)}. It asks most of your ${esc(FORMATIONS[Q.fm].lean)}.${Q.afm!==Q.fm?` Your assistant would play ${esc(Q.afm)}.`:" Your assistant's pick too."}</div>
    ${rows}
    <div class="fnote">Condition: what each man has in his legs at kick-off. Ninety minutes take about a quarter of it and a day gives back 7, so a week puts everyone back to full; two games in four days doesn't, and a side whose starters are short of it picks up more knocks.${rest?` Your assistant rests ${rest===1?"one man":rest+" men"} for this one.`:""}</div></div>` }catch(e){ return "" } }
function sportBind(){ if(typeof document==="undefined")return;
  document.querySelectorAll("[data-scfm]").forEach(b=>b.onclick=()=>{ const M=scMine(); if(!M||!FORMATIONS[b.dataset.scfm])return;
    S.xiFm=S.xiFm||{}; const F=(S.xiFm[M.t]||[]).filter(x=>x[0]<M.idx); F.push([M.idx,b.dataset.scfm]); S.xiFm[M.t]=F; save(); render() });
  document.querySelectorAll("[data-scxi]").forEach(b=>b.onclick=()=>{ const M=scMine(), u=+b.dataset.scxi; if(!M)return;
    const Q=scSheet(SEA,M.t,M.n.opp,M.n.step,M.n.half); if(!Q||!(u>=0)||!Q.u[u]||Q.u[u].av!=="both")return;
    S.xiLog=S.xiLog||{}; Object.keys(S.xiLog).forEach(k=>{ if(+k.split("|").pop()<SEA.year*1000)delete S.xiLog[k] });   // last season's sheets: done with
    const on=Q.u.map(q=>q.on?1:0); on[u]=1-on[u]; S.xiLog[M.t+"|"+M.idx]={on:on}; save(); render() }) }
