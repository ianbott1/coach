/* Football's box score (round 73, core 96_moments): the scoring summary, in the drive chart's words, and each side's
   drives by how they ended. Every point is a drive's own. */
function sportBox(g){
  const D=g.drives||[]; let R=[]; try{ R=driveScript(g,D) }catch(e){ R=[] }
  const side=h=>D.filter(d=>d.home===h), cnt=(h,k)=>side(h).filter(d=>k.indexOf(d.kind)>=0).length;
  const rows=[["Points",side(false).reduce((t,d)=>t+(d.pts||0),0),side(true).reduce((t,d)=>t+(d.pts||0),0)],
    ["Drives",side(false).filter(d=>d.kind!=="ONSIDE").length,side(true).filter(d=>d.kind!=="ONSIDE").length],
    ["Touchdowns",cnt(false,["TD"]),cnt(true,["TD"])],["Field goals",`${cnt(false,["FG"])} of ${cnt(false,["FG","MISS"])}`,`${cnt(true,["FG"])} of ${cnt(true,["FG","MISS"])}`],
    ["Turnovers",cnt(false,["INT","FUM"]),cnt(true,["INT","FUM"])],["Punts",cnt(false,["PUNT"]),cnt(true,["PUNT"])],["Stopped on downs",cnt(false,["DOWNS"]),cnt(true,["DOWNS"])]];
  const list=D.map((d,i)=>[d,i]).filter(([d])=>d.pts>0).map(([d,i])=>({c:[d.q>=5||d.ot?"OT":"Q"+d.q,esc(tAb(d.home?g.home:g.away)),esc(R[i]&&R[i].text||(d.kind==="FG"?"field goal":"touchdown"))+(d.kind==="TD"&&d.pts!==7?` <span style="color:var(--muted)">(${d.pts===8?"two-point try good":d.pts===6?"no extra point":d.pts+" pts"})</span>`:""),`${d.a}&ndash;${d.h}`]}));
  return boxTeams(g,rows,false)+(list.length?`<div class="boxhead">Scoring</div>`+statTable(["","","",""],list,3):"");
}

/* round 74: each side's passer, runner, receivers (and the receivers the roster doesn't carry: the rest of the catches
   and yards) and the defenders who made a play */
function sportBoxPlayers(g,BL){
  return ["away","home"].map(sd=>{ const R=BL[sd], nm=x=>esc(boxName(x.n)), q=R.find(x=>x.pos==="QB"), out=[];
    if(q)out.push({c:[nm(q)+' <span style="color:var(--muted)">passing</span>',`${q.s.cmp}/${q.s.att}`,q.s.pyd,q.s.ptd,q.s.int].map(String)});
    R.filter(x=>x.pos==="RB"&&(x.s.car||x.s.rtd)).forEach(x=>out.push({c:[nm(x)+' <span style="color:var(--muted)">rushing</span>',`${x.s.car} car`,x.s.ryd,x.s.rtd,""].map(String)}));
    const rc=R.filter(x=>(x.pos==="WR"||x.pos==="WR2")&&(x.s.rec||x.s.ctd));
    rc.forEach(x=>out.push({c:[nm(x)+' <span style="color:var(--muted)">receiving</span>',`${x.s.rec} rec`,x.s.cyd,x.s.ctd,""].map(String)}));
    if(q){ const r=q.s.cmp-rc.reduce((t,x)=>t+x.s.rec,0), y=q.s.pyd-rc.reduce((t,x)=>t+x.s.cyd,0); if(r>0)out.push({c:['<span style="color:var(--muted)">Other receivers</span>',`${r} rec`,String(y),"",""]}) }
    R.filter(x=>x.s.ints||x.s.sck).forEach(x=>out.push({c:[nm(x)+` <span style="color:var(--muted)">${esc(x.pos)}</span>`,x.s.sck?`${x.s.sck} sack${x.s.sck===1?"":"s"}`:"","",x.s.ints?`${x.s.ints} INT`:"",""]}));
    return boxSide(g,sd,["","","Yds","TD","INT"],out) }).join("");
}
