/* Baseball's big moments (round 73, core 96_moments): the walk-off. From the game's own innings: the home side, not
   ahead going into its last time up, wins it there; the hitter is the one the run of play names. */
function sportMoments(g,my,meHome){
  const out=[], D=g.drives||[], last=D[D.length-1], pv=D[D.length-2];
  if(!meHome||g.winner!==my||!last||last.seg<SEGS-1)return out;
  const before=pv?pv.sh||0:0;   // home's runs before this inning; the visitors bat first
  if(before>last.sa||!(last.sh>last.sa))return out;
  const e=(last.ev||[]).filter(x=>x.side==="home"&&(x.k==="hr"||x.k==="rbi")).slice(-1)[0], inn=last.seg+1;
  const nm=e&&e.nm?e.nm:null, ord=typeof ordw==="function"?ordw(inn):inn+"th";
  out.push({k:"walkoff", h:e&&e.k==="hr"?"Walk-off home run":"Walk-off", who:nm,
    l:`${nm?esc(nm)+(e.k==="hr"?" homered":" drove in the winning run")+" in the bottom of the "+ord:"The winning run came home in the bottom of the "+ord}, and that was the game.`});
  return out;
}
