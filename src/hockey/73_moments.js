/* Hockey's big moments (round 73, core 96_moments): a hat-trick (the hats come down), the overtime winner, a shootout
   won. From the game's own events: the scorers the run of play and the box score name. */
function sportMoments(g,my,meHome){
  const out=[], side=meHome?"home":"away", D=g.drives||[];
  const goals=[]; D.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k==="goal")goals.push(e) }));
  const by={}; goals.filter(e=>e.side===side).forEach(e=>{ const N=hkGoalNames(my,e), n=N.n; if(N.depth||!n||n==="a forward")return; (by[n]=by[n]||[]).push(e.m) });   // (the fourth line is nobody's hat-trick)
  Object.keys(by).filter(n=>by[n].length>=3).forEach(n=>{ const m=by[n];
    out.push({k:"hattrick", h:m.length===3?"Hat-trick":m.length===4?"Four goals":m.length+" goals", who:n,
      l:`${esc(n)} scored ${m.length===3?"three":m.length===4?"four":m.length}${m.length===3?", and the hats came down":""}: ${m.map(x=>x+"'").join(", ")}.`}) });
  const last=D[D.length-1];
  if(g.winner===my&&last&&last.seg>=SEGS){
    const e=(last.ev||[]).filter(x=>x.k==="goal").slice(-1)[0];
    if(!last.so&&e&&e.side===side){ const n=hkGoalNames(my,e).n;
      out.push({k:"ot", h:"Overtime winner", who:n, l:`${esc(n)} ended it ${e.m-60>=1?e.m-60+" minute"+(e.m-60===1?"":"s"):"seconds"} into overtime.`}) }
    else if(last.so)out.push({k:"so", h:"Shootout win", l:`Level after overtime, and won in the shootout.`}) }
  return out;
}
