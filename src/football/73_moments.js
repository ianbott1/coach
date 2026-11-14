/* Football's big moments (round 73, core 96_moments): the drive that won it late, from behind or level. From the
   game's own drives; the words are the drive chart's, so the card and the chart name the same man. */
function sportMoments(g,my,meHome){
  const out=[], D=g.drives||[];
  if(g.winner!==my)return out;
  let k=-1; D.forEach((d,i)=>{ if(d.pts>0)k=i });
  const d=D[k]; if(!d||d.home!==meHome||d.q<4)return out;
  const before=meHome?(d.h-d.pts)-d.a:(d.a-d.pts)-d.h;
  if(before>0)return out;
  let txt=""; try{ const R=driveScript(g,D); txt=R[k]&&R[k].text||"" }catch(e){}
  const ot=d.q>=5||d.ot, what=txt?(d.kind==="FG"?"a "+txt:txt):(d.kind==="FG"?"a field goal":"a touchdown");
  out.push({k:"winner", h:ot?"Overtime winner":"Game-winning drive",
    l:`${before<0?`Down ${-before}`:"Level"} ${ot?"in overtime":"in the fourth quarter"}: ${esc(what)}. That won it.`});
  return out;
}
