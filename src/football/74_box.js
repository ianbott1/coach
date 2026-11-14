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
