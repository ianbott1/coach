/* Soccer's box score (round 73, core 96_moments): goals with their scorers, shots and shots on target, saves, cards.
   Shots come from the engine's count through ninety minutes; extra time adds goals only. */
function sportBox(g){
  const D=g.drives||[], goals=[], cards={home:[0,0],away:[0,0]};
  D.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k==="goal")goals.push(e); else if(e.k==="yellow")cards[e.side][0]++; else if(e.k==="red")cards[e.side][1]++ }));
  const reg=D.filter(d=>d.st).slice(-1)[0], st=reg?reg.st:{home:[0,0],away:[0,0]};
  const regGoals=sd=>goals.filter(e=>e.side===sd&&e.m<=90).length;
  const saves=sd=>{ const o=sd==="home"?"away":"home"; return Math.max(0,st[o][1]-regGoals(o)) };
  const tot=sd=>goals.filter(e=>e.side===sd).length;
  const rows=[["Goals",tot("away"),tot("home")],["Shots",st.away[0],st.home[0]],["On target",st.away[1],st.home[1]],["Saves",saves("away"),saves("home")],
    ["Yellow cards",cards.away[0],cards.home[0]],cards.away[1]||cards.home[1]?["Red cards",cards.away[1],cards.home[1]]:null];
  const list=goals.slice().sort((a,b)=>a.m-b.m).map(e=>{ const tm=e.side==="home"?g.home:g.away; return {c:[e.m+"'",esc(tAb(tm)),esc(scGoalBy(tm,e).n)]} });
  return boxTeams(g,rows,true)+(list.length?`<div class="boxhead">Goals</div>`+statTable(["","",""],list,3):"")
    +(g.pens?`<div class="fnote">Level after extra time: ${esc(g.pens==="home"?g.home:g.pens==="away"?g.away:g.pens)} won on penalties.</div>`:"");
}

/* round 74: each side's men who scored, set one up or had a shot, and the keeper */
function sportBoxPlayers(g,BL){
  return ["away","home"].map(sd=>{ const R=BL[sd], out=R.filter(x=>x.pos!=="GK"&&(x.s.goals||x.s.ast||x.s.shots)), gk=R.filter(x=>x.pos==="GK");
    const rows=out.map(x=>({c:[esc(boxName(x.n))+` <span style="color:var(--muted)">${esc(x.pos)}</span>`,x.s.goals,x.s.ast,x.s.shots].map(String)}))
      .concat(gk.map(x=>({c:[esc(boxName(x.n))+' <span style="color:var(--muted)">GK</span>',`${x.s.sv} saves`,`${x.s.ga} conceded`,""]})));
    return boxSide(g,sd,["","Goals","Assists","Shots"],rows) }).join("");
}
