/* round 81: Player of the Month and your Goal of the Month (Ian: "goals and player of the month"). A month is done when
   every league week dated in it has been played. Player of the Month: your division, from the players' game logs for
   that month's weeks (goals, assists, a keeper's or defender's clean sheets and a keeper's saves). Goal of the Month:
   from your own games watched that month (the goals with a clip), a late goal that won or saved the game first, then a
   hat-trick's third, then any that won or levelled it, the later the better. Reads only what was played; draws nothing. */
function epMonth(step){ return String((LEAGUE.dates||[])[step]||"").split(" ")[0] }
function epMonthsDone(){
  const D=LEAGUE.dates||[], done=[], seen={};
  for(let s=0;s<D.length;s++){ const m=epMonth(s); if(!m||seen[m])continue; seen[m]=1;
    let last=-1; for(let k=0;k<D.length;k++)if(epMonth(k)===m)last=k;
    if(last<SEA.step&&!(SEA.phase==="week"&&epMonth(SEA.step)===m&&last>=SEA.step))done.push({m:m,steps:D.map((_,k)=>k).filter(k=>epMonth(k)===m),last:last}) }
  return done }
function epPlayerOfMonth(mo){
  const teams=NAMES.filter(t=>CONF[t]===CONF[S.myTeam]), set=new Set(mo.steps), w=glStride(); let best=null;
  teams.forEach(t=>(SEA.roster[t]||[]).forEach((p,i)=>{ if(!p||!p.gl)return; const pos=p.p||POS[i%POS.length].p, keys=STAT_KEYS[pos]||[];
    let g=0, tot={}; for(let r=0;r<p.gl.length;r+=w){ if(!set.has(p.gl[r]))continue; g++; keys.forEach((k,j)=>tot[k]=(tot[k]||0)+(p.gl[r+6+j]||0)) }
    if(!g)return; const v=(tot.goals||0)+0.6*(tot.ast||0)+(pos==="GK"?0.8*(tot.cs||0)+0.04*(tot.sv||0):pos==="CB"||pos==="FB"?0.35*(tot.cs||0):0);
    if(!best||v>best.v||(v===best.v&&g<best.g))best={p:p,t:t,pos:pos,g:g,tot:tot,v:v} }));
  return best&&best.v>0?best:null }
function epGoalOfMonth(mo){
  const my=S.myTeam; let best=null;
  mo.steps.forEach(s=>{ const W=SEA.weeks[s]; if(!W)return; W.games.forEach(g=>{ if(!g.drives||(g.home!==my&&g.away!==my))return; const side=g.home===my?"home":"away";
    const ev=g.drives.flatMap(d=>(d.ev||[]).filter(e=>e.k==="goal")).sort((a,b)=>a.m-b.m), fH=g.hp!==undefined?g.hp:g.h, fA=g.ap!==undefined?g.ap:g.a;
    let h=0,a=0; const by={};
    ev.forEach(e=>{ if(e.side==="home")h++; else a++; if(e.side!==side||!e.nm)return; by[e.nm]=(by[e.nm]||0)+1;
      const me=side==="home"?h:a, them=side==="home"?a:h, fMe=side==="home"?fH:fA, fThem=side==="home"?fA:fH;
      const decisive=(fMe>fThem&&me===fThem+1)||(fMe===fThem&&me===them&&me===fMe);   // the winner (the goal that put you ahead for good) or the last equaliser
      const sc=(e.m>=80&&decisive?3:by[e.nm]===3?2.5:decisive?1.5:1)+e.m/1000;
      if(!best||sc>best.sc)best={sc:sc,e:e,g:g,s:s,opp:side==="home"?g.away:g.home,home:side==="home",late:e.m>=80,decisive:decisive,third:by[e.nm]===3,fMe:fMe,fThem:fThem} }) }) });
  return best }
const EP_MON={Jan:"January",Feb:"February",Mar:"March",Apr:"April",May:"May",Jun:"June",Jul:"July",Aug:"August",Sep:"September",Oct:"October",Nov:"November",Dec:"December"};
function epPotmLine(b){ const T=b.tot, bits=[];
  if(b.pos==="GK"){ if(T.cs)bits.push(`${T.cs} clean sheet${T.cs===1?"":"s"}`); if(T.sv)bits.push(`${T.sv} saves`) }
  else { if(T.goals)bits.push(`${T.goals} goal${T.goals===1?"":"s"}`); if(T.ast)bits.push(`${T.ast} assist${T.ast===1?"":"s"}`); if((b.pos==="CB"||b.pos==="FB")&&T.cs)bits.push(`${T.cs} clean sheet${T.cs===1?"":"s"}`) }
  return `${plLink(b.t,b.p.n)} (${esc(b.t)}): ${bits.join(", ")} in ${b.g} game${b.g===1?"":"s"}` }
function epGotmLine(x){ const e=x.e, ord=n=>n+(n%10===1&&n!==11?"st":n%10===2&&n!==12?"nd":n%10===3&&n!==13?"rd":"th");
  const what=x.third?"hat-trick goal":x.late&&x.decisive?(x.fMe>x.fThem?"late winner":"late equaliser"):x.decisive?(x.fMe>x.fThem?"winner":"equaliser"):"goal";
  return `${esc(String(e.nm).split(" ").slice(-1)[0])}'s ${ord(e.m)}-minute ${what} ${x.home?"against":"at"} ${esc(x.opp)} (${x.fMe}-${x.fThem})` }
function epMonthCard(mo,full){
  const p=epPlayerOfMonth(mo), g=epGoalOfMonth(mo); if(!p&&!g)return "";
  return `<div class="card" style="padding:10px 12px;margin:8px 0"><div class="olab">${esc(EP_MON[mo.m]||mo.m)}${full?"":" awards"}</div>`+
    (p?`<div style="margin:4px 0"><b>Player of the Month</b>: ${epPotmLine(p)}</div>`:"")+
    (g?`<div style="margin:4px 0"><b>Your Goal of the Month</b>: ${epGotmLine(g)}</div>`:full?`<div class="fnote">No goal of yours watched this month.</div>`:"")+`</div>` }
// on the home screen for the two weeks after a month ends
function epMonthRace(my){ try{ const D=epMonthsDone(), mo=D[D.length-1]; if(!mo||SEA.step-mo.last>2)return ""; return epMonthCard(mo,false) }catch(e){ return "" } }
// above the leaders: every month done this season, latest first
function sportLeadersExtra(){ try{ const D=epMonthsDone(); if(!D.length)return ""; return `<div class="grouphead">Monthly awards</div>`+D.slice().reverse().map(mo=>epMonthCard(mo,true)).join("") }catch(e){ return "" } }
Object.assign(LEAGUE.ui,{raceCard:epMonthRace});
