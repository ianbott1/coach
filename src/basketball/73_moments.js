/* Basketball's big moments (round 73, core 96_moments): the last shot, made to win it. From the game's own last
   possession, the one the highlights play. */
function sportMoments(g,my,meHome){
  const out=[], side=meHome?"home":"away", D=g.drives||[], last=D[D.length-1];
  if(g.winner===my&&last&&last.seg==="last"&&last.side===side&&last.made&&last.choice==="three")
    out.push({k:"buzzer", h:"At the buzzer", l:`Down two with the last possession, you went for the three, and it went in.`});
  return out;
}
