/* Soccer's big moments (round 73, core 96_moments): a hat-trick, and a late winner. From the game's own events, the
   same ones the run of play and the box score name. */
function sportMoments(g,my,meHome){
  const out=[], side=meHome?"home":"away", D=g.drives||[];   // extra time before penalties has real goals too
  const goals=[]; D.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k==="goal")goals.push(e) }));
  // a hat-trick (or more): the scorer the log credits
  const by={}; goals.filter(e=>e.side===side).forEach(e=>{ const n=scGoalBy(my,e).n; if(!n||n==="a forward")return; (by[n]=by[n]||[]).push(e.m) });
  Object.keys(by).filter(n=>by[n].length>=3).forEach(n=>{ const m=by[n];
    out.push({k:"hattrick", h:m.length>=4?(m.length===4?"Four goals":m.length+" goals"):"Hat-trick", who:n,
      l:`${esc(n)} scored ${m.length===3?"three":m.length===4?"four":m.length}: ${m.map(x=>x+"'").join(", ")}.`}) });
  // a late winner: your goal from the 85th minute on (or in extra time) that broke a level score and stood
  if(g.winner===my&&!g.pens){ let h=0,a=0, win=null;
    goals.slice().sort((x,y)=>x.m-y.m).forEach(e=>{ const lv=h===a; if(e.side==="home")h++; else a++;
      if(lv&&e.side===side&&e.m>=85)win=e; else if(e.side!==side)win=null });
    const fin=meHome?h-a:a-h;
    if(win&&fin===1){ const n=scGoalBy(my,win).n;
      out.push({k:"late", h:win.m>90?"Extra-time winner":"Late winner", who:n, l:`${esc(n)}, ${win.m}': ${esc(g.home===my?g.away:g.home)} had a point until then.`}) } }
  return out;
}
