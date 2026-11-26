/* engine 27: the weekly game plan on the next game's card (51_tactics has the levers and what they do). Your assistant
   draws one up from the two rosters, as the computer's clubs do; a tap changes one lever for this game only, and the
   scouting lines say what the film shows (their habits, and where your units stand against theirs) without picking for
   you. Kept in the save: S.fbGP[team] = [[year*100+step, plan], ...]. */
const GP_TIP={
  mix:{run:"More of the clock and fewer picks, but fewer possessions for both sides. Best against two deep safeties and a light front.",
       bal:"Takes what the defense gives.",
       pass:"More big plays and a few more possessions, and more interceptions. Best against one deep safety and a weak secondary."},
  tempo:{slow:"Shortens the game: fewer possessions for both sides, which helps the weaker team.",
         norm:"The usual number of snaps.",
         fast:"More possessions for both sides and a tired defense across the field, yours included."},
  cov:{c1:"Corners alone on their receivers, a safety over the top. Good when your corners are better; big plays when they aren't.",
       c3:"Three deep and four under, one safety high. Sound against the run, open to the pass.",
       c2:"Two safeties deep: takes away the big play, gives up the run and the short pass.",
       c2m:"Man underneath with two safeties over the top. Needs corners who can stay with their receivers."},
  blitz:{low:"Seven in coverage: few big plays, little pressure, and long drives.",
         norm:"Pressure on the usual downs.",
         high:"Sacks and hurried throws when it gets home, big plays when it doesn't. An accurate quarterback beats it."},
  key:{none:"Everyone plays his own man.",
       rb:"An extra man in the box for their back. Costs something in coverage if he isn't their best player.",
       wr:"A safety over their top receiver. Costs something against the run if he isn't the one who beats you.",
       qb:"A linebacker on the quarterback's legs. Wasted on a quarterback who doesn't run."}};
function fb27PlanIdx(step){ return fb27Idx(SEA.year,step) }
// this game's two plans and the film on them, for your team (null when there's no plan to make)
function fb27Card(ng,my,step){ if(!fb27()||typeof SEA==="undefined"||!SEA||!SEA.roster||!ng||(ng.home!==my&&ng.away!==my))return null;
  const c=gameCtx(ng.home,ng.away,SEA.year,step,SEA), G=c&&c.gp27; if(!G||!G.u||!G.u.home||!G.u.away)return null;
  const sd=ng.home===my?"home":"away", od=sd==="home"?"away":"home";
  return {sd:sd,od:od,me:G.u[sd],op:G.u[od],g:G.g[sd],auto:G.auto[sd],theirs:G.auto[od],fav:c.fav[od],mine:!!G.user[sd],idx:fb27PlanIdx(step),opp:sd==="home"?ng.away:ng.home} }
// what the film says, in plain lines: nothing here is the computer's draw for the game, only habits and the rosters
function fb27Scout(Q){ const K=GP_K, me=Q.me, op=Q.op, L=[];
  const usual={blitz:"They blitz more than most",shell:"They play two deep safeties more than most",box:"They load the box against the run more than most"}[Q.fav];
  if(usual)L.push(usual+".");
  const tm=Q.theirs.mix, tt=Q.theirs.tempo;
  L.push(tm==="run"?"Their offense leans on the run.":tm==="pass"?"Their offense throws more than most.":"Their offense keeps a balance of run and pass.");
  if(tt!=="norm")L.push(tt==="fast"?"They play at a hurry-up tempo.":"They slow the game down.");
  const rel=((me.passO-me.runO)-(op.cov-op.front))-K.rel0;
  L.push(rel>4?"Your passing game matches up better than your running game.":rel<-4?"Your running game matches up better than your passing game.":"Neither your run nor your pass has a clear edge on them.");
  const man=me.cov-op.rec-K.man0, manT=op.cov-me.rec-K.man0;
  L.push(man>3?"Your corners can stay with their receivers.":man<-3?"Their receivers are a step better than your corners.":"Your corners and their receivers are about even.");
  if(manT>3)L.push("Their corners can stay with your receivers in man.");
  const bl=(me.rush-op.prot)-K.bl0;
  L.push(bl>3?"Your pass rush beats their line.":bl<-3?"Their line handles your pass rush.":"Your pass rush and their line are about even.");
  if(op.qa>3)L.push("Their quarterback is accurate under pressure.");
  const so=(v,c)=>v-c;
  if(so(op.rb-op.rec,K.rb0)>5)L.push("Their back is the best player in their offense.");
  else if(so(op.wr-op.wr2,K.wr0)>7)L.push("Their top receiver is far ahead of the rest.");
  if(so(op.qs,K.qs0)>6)L.push("Their quarterback runs.");
  return L }
function sportNextExtra(ng,my,step){ try{ if(typeof S==="undefined"||!S||my!==S.myTeam)return ""; const Q=fb27Card(ng,my,step); fb27Card.last=Q?{g:ng,step:step}:null; if(!Q)return "";
  const row=k=>`<div class="setrow"><span style="min-width:74px;display:inline-block;color:var(--muted)">${esc(GP_LAB[k])}</span>${GP_OPT[k].map(([v,l])=>
    `<button class="setbtn" data-fbgp="${k}|${v}" aria-pressed="${Q.g[k]===v}">${esc(l)}${Q.auto[k]===v&&Q.g[k]!==v?" *":""}</button>`).join("")}</div>
    <div class="fnote">${esc(GP_TIP[k][Q.g[k]])}</div>`;
  const al=GP_KEYS.map(k=>gpLabel(k,Q.auto[k])).join(", ");
  return `<div class="gameplan"><div class="nlabel" style="margin-top:6px">GAME PLAN</div>
    <div class="fnote">On offense</div>${row("mix")}${row("tempo")}
    <div class="fnote">On defense</div>${row("cov")}${row("blitz")}${row("key")}
    <div class="fnote">${Q.mine?`Your plan for this game. Your assistant's (marked *): ${esc(al)}. <button class="setbtn" data-fbgp="reset">Use your assistant's</button>`:`Your assistant's plan, from the two rosters. A tap changes it for this game only.`}</div>
    <div class="nlabel" style="margin-top:6px">SCOUTING</div>${fb27Scout(Q).map(l=>`<div class="nrec">${esc(l)}</div>`).join("")}</div>` }catch(e){ return "" } }
function fb27SetPlan(t,idx,g){ S.fbGP=S.fbGP||{}; const yr=Math.floor(idx/100);
  const L=(S.fbGP[t]||[]).filter(x=>x[0]!==idx&&Math.floor(x[0]/100)>=yr);   // last season's plans: done with
  if(g)L.push([idx,gpOk(g)]); if(L.length)S.fbGP[t]=L; else delete S.fbGP[t] }
function sportBind(){ if(typeof document==="undefined")return;
  document.querySelectorAll("[data-fbgp]").forEach(b=>b.onclick=()=>{ const my=S.myTeam, n=fb27Card.last; if(!n)return; const Q=fb27Card(n.g,my,n.step); if(!Q)return;
    const v=b.dataset.fbgp; if(v==="reset")fb27SetPlan(my,Q.idx,null);
    else { const [k,x]=v.split("|"); if(!GP_OPT[k]||!GP_OPT[k].some(o=>o[0]===x))return; const g=Object.assign({},Q.g,{[k]:x});
      fb27SetPlan(my,Q.idx,GP_KEYS.every(j=>g[j]===Q.auto[j])?null:g) }
    save(); render() }) }
