/* Baseball's box score (round 73, core 96_moments): the line score (runs by inning, hits), the home runs and the runs
   batted in, by the hitters the run of play names. */
function sportBox(g){
  const D=g.drives||[]; if(!D.length)return "";
  const last=D[D.length-1], hits=last.hits||[null,null];
  const line=statTable(["Inning"].concat(D.map((d,i)=>String(i+1))).concat(["R","H"]),[g.away,g.home].map((t,k)=>({c:[esc(tAb(t))].concat(D.map((d,i)=>{ const v=k?d.h:d.a; return k&&i===D.length-1&&i>=SEGS-1&&!v&&!(d.ev||[]).some(e=>e.side==="home")&&d.sh>d.sa?"x":String(v||0) })).concat(["<b>"+(k?last.sh:last.sa)+"</b>",hits[k?0:1]!=null?String(hits[k?0:1]):"-"])})),1);
  const hr=[]; D.forEach((d,i)=>(d.ev||[]).forEach(e=>{ if(e.k==="hr"&&e.nm)hr.push({c:[ordw(i+1),esc(tAb(e.side==="home"?g.home:g.away)),esc(e.nm)+` <span style="color:var(--muted)">(${e.n===4?"grand slam":e.n>1?e.n+" runs":"solo"})</span>`]}) }));
  const rbi=[]; ["away","home"].forEach(sd=>{ const C=bsLogCredit(sd==="home"?g.home:g.away,sd,D); Object.keys(C).filter(n=>C[n].rbi>0).sort((a,b)=>C[b].rbi-C[a].rbi).forEach(n=>rbi.push({c:[esc(tAb(sd==="home"?g.home:g.away)),esc(n),String(C[n].rbi)]})) });
  return line+(hr.length?`<div class="boxhead">Home runs</div>`+statTable(["","",""],hr,3):"")+(rbi.length?`<div class="boxhead">Runs batted in</div>`+statTable(["","","RBI"],rbi,2):"");
}
