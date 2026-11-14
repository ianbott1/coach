/* Hockey's box score (round 73, core 96_moments): goals with scorer and assist, shots, saves, power plays. Saves are
   the shots each goalie stopped, as the engine played them; shots on goal are those saves and the goals. */
function sportBox(g){
  const D=g.drives||[], goals=[], pen={home:0,away:0}, sv={home:0,away:0}, shots={home:0,away:0};
  D.forEach(d=>{ (d.ev||[]).forEach(e=>{ if(e.k==="goal")goals.push(e); else if(e.k==="pen")pen[e.side]++ });
    (d.sv||[]).forEach(x=>sv[x.side]++) });
  // shots on goal: the goals that came from a shot and the saves against, shot by shot as the engine played them (the
  // spell totals miss overtime's shots and count a few more; round 73 measured them one or two apart)
  ["home","away"].forEach(sd=>{ const o=sd==="home"?"away":"home"; shots[sd]=goals.filter(e=>e.side===sd&&!e.en&&!e.extra).length+sv[o] });
  const tot=sd=>goals.filter(e=>e.side===sd).length, ppg=sd=>goals.filter(e=>e.side===sd&&e.pp).length, other=sd=>sd==="home"?"away":"home";
  const rows=[["Goals",tot("away"),tot("home")],["Shots on goal",shots.away,shots.home],["Saves",sv.away,sv.home],
    ["Power plays",`${ppg("away")} of ${pen.home}`,`${ppg("home")} of ${pen.away}`]];
  const per=m=>m<20?"1st":m<40?"2nd":m<60?"3rd":"OT";
  const list=goals.slice().sort((a,b)=>a.m-b.m).map(e=>{ const tm=e.side==="home"?g.home:g.away, N=hkGoalNames(tm,e);
    return {c:[`${per(e.m)} ${e.m}'`,esc(tAb(tm)),esc(N.n)+(N.a?` <span style="color:var(--muted)">(${esc(N.a)})</span>`:"")+(e.pp?" PP":e.en?" EN":"")]} });
  return boxTeams(g,rows,false)+(list.length?`<div class="boxhead">Goals</div>`+statTable(["","",""],list,3):"")
    +(g.so?`<div class="fnote">Level after overtime: ${esc(g.winner)} won the shootout.</div>`:"");
}
