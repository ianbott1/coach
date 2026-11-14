/* Basketball's big moments (round 73, core 96_moments): the last shot, made to win it. From the game's own last
   possession, the one the highlights play. */
function sportMoments(g,my,meHome){
  const out=[], side=meHome?"home":"away", D=g.drives||[], last=D[D.length-1];
  if(g.winner===my&&last&&last.seg==="last"&&last.side===side&&last.made&&last.choice==="three")
    out.push({k:"buzzer", h:"At the buzzer", l:`Down two with the last possession, you went for the three, and it went in.`});
  // round 74: won in overtime; or behind going into the last stretch of regulation and won by a possession (college
  // basketball had no moment in a season: the buzzer-beater needs you to take the three, down two)
  else if(g.winner===my){ const segs=D.filter(d=>typeof d.seg==="number"), mine=meHome?g.hp:g.ap, theirs=meHome?g.ap:g.hp;
    const tied=last&&last.seg==="last"&&last.side===side&&last.made&&last.choice!=="three";
    if(segs.some(d=>d.seg>=SEGS))out.push({k:"ot", h:"Overtime win", l:tied?`You tied it with the last shot of regulation, and won it in overtime, ${mine}&ndash;${theirs}.`:`Level after regulation, and you won it in overtime, ${mine}&ndash;${theirs}.`});
    else { const pre=segs.filter(d=>d.seg===SEGS-2)[0];
      if(pre&&mine-theirs<=3){ const was=meHome?pre.sh-pre.sa:pre.sa-pre.sh;
        if(was<=0)out.push({k:"late", h:"Won it late", l:was<0?`${-was} down going into the last stretch, and you won by ${mine-theirs}.`:`Level going into the last stretch, and you won by ${mine-theirs}.`}) } } }
  return out;
}
