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
