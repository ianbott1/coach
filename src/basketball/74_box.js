/* Basketball's box score (round 73, core 96_moments): the team lines the engine counted, shot by shot. Two-point and
   three-point makes and free throws add up to the score. */
function sportBox(g){
  const D=g.drives||[], last=D.filter(d=>d.ln).slice(-1)[0]; if(!last)return "";
  const L=last.ln, fg=x=>`${x.fgm2+x.tpm}-${x.fga2+x.tpa}`, pc=(m,a)=>a?Math.round(100*m/a)+"%":"-";
  const pts=x=>2*x.fgm2+3*x.tpm+x.ftm, f=D.filter(d=>d.fouls).slice(-1)[0];
  const rows=[["Points",pts(L.away),pts(L.home)],["FG",fg(L.away),fg(L.home)],["FG%",pc(L.away.fgm2+L.away.tpm,L.away.fga2+L.away.tpa),pc(L.home.fgm2+L.home.tpm,L.home.fga2+L.home.tpa)],
    ["Threes",`${L.away.tpm}-${L.away.tpa}`,`${L.home.tpm}-${L.home.tpa}`],["Free throws",`${L.away.ftm}-${L.away.fta}`,`${L.home.ftm}-${L.home.fta}`],
    ["Offensive rebounds",L.away.oreb,L.home.oreb],["Turnovers",L.away.to,L.home.to],f?["Fouls",f.fouls.away,f.fouls.home]:null];
  return boxTeams(g,rows,false);
}

/* round 74: each side's players (the men on the floor, by the season's lines) and the bench's share, which come to the
   team's points */
function sportBoxPlayers(g,BL){
  const last=(g.drives||[]).filter(d=>d.ln).slice(-1)[0]; if(!last)return "";
  // engine 26 (stats): each man's whole line (minutes, shots made and tried, turnovers, fouls, plus-minus), the starters
  // first, then by minutes; every point is a named man's, so no bench row
  if(["away","home"].some(sd=>BL[sd].some(x=>x.s.min>0)))return ["away","home"].map(sd=>{
    const R=BL[sd].filter(x=>x.s.min>0||x.s.pts).slice().sort((a,b)=>((a.i>=0&&a.i<5)?0:1)-((b.i>=0&&b.i<5)?0:1)||b.s.min-a.s.min), s2=(m,a)=>`${m}-${a}`;
    const rows=R.map(x=>({c:[esc(boxName(x.n))+` <span style="color:var(--muted)">${esc(x.pos)}</span>`,x.s.min,x.s.pts,s2(x.s.fgm,x.s.fga),s2(x.s.tpm,x.s.tpa),s2(x.s.ftm,x.s.fta),x.s.reb,x.s.ast,x.s.stl,x.s.blk,x.s.to,x.s.pf,(x.s.pm>0?"+":"")+x.s.pm].map(String)}));
    return boxSide(g,sd,["","Min","Pts","FG","3PT","FT","Reb","Ast","Stl","Blk","TO","PF","+/-"],rows) }).join("");
  return ["away","home"].map(sd=>{ const L=last.ln[sd], pts=2*L.fgm2+3*L.tpm+L.ftm, R=BL[sd];
    const rows=R.map(x=>({c:[esc(boxName(x.n))+` <span style="color:var(--muted)">${esc(x.pos)}</span>`,x.s.pts,x.s.reb,x.s.ast,x.s.tpm,x.s.stl,x.s.blk].map(String)}));
    const rest=pts-R.reduce((t,x)=>t+x.s.pts,0), r3=L.tpm-R.reduce((t,x)=>t+x.s.tpm,0);
    if(R.length&&(rest>0||r3>0))rows.push({c:[`<span style="color:var(--muted)">Rest of the bench</span>`,String(rest),"","",String(r3),"",""]});
    return boxSide(g,sd,["","Pts","Reb","Ast","3PM","Stl","Blk"],rows) }).join("");
}
