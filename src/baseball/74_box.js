/* Baseball's box score (round 73, core 96_moments): the line score (runs by inning, hits), the home runs and the runs
   batted in, by the hitters the run of play names. */
function sportBox(g){
  const D=g.drives||[]; if(!D.length)return "";
  const last=D[D.length-1], hits=last.hits||[null,null];
  const line=statTable(["Inning"].concat(D.map((d,i)=>String(i+1))).concat(["R","H"]),[g.away,g.home].map((t,k)=>({c:[esc(tAb(t))].concat(D.map((d,i)=>{ const v=k?d.h:d.a; return k&&i===D.length-1&&i>=SEGS-1&&!v&&!(d.ev||[]).some(e=>e.side==="home"&&e.k!=="pc"&&e.k!=="ibb")&&d.sh>d.sa?"x":String(v||0) })).concat(["<b>"+(k?last.sh:last.sa)+"</b>",hits[k?0:1]!=null?String(hits[k?0:1]):"-"])})),1);
  const hr=[]; D.forEach((d,i)=>(d.ev||[]).forEach(e=>{ if(e.k==="hr"&&e.nm)hr.push({c:[ordw(i+1),esc(tAb(e.side==="home"?g.home:g.away)),esc(e.nm)+` <span style="color:var(--muted)">(${e.n===4?"grand slam":e.n>1?e.n+" runs":"solo"})</span>`]}) }));
  const rbi=[]; ["away","home"].forEach(sd=>{ const C=bsLogCredit(sd==="home"?g.home:g.away,sd,D); Object.keys(C).filter(n=>C[n].rbi>0).sort((a,b)=>C[b].rbi-C[a].rbi).forEach(n=>rbi.push({c:[esc(tAb(sd==="home"?g.home:g.away)),esc(n),String(C[n].rbi)]})) });
  return line+(hr.length?`<div class="boxhead">Home runs</div>`+statTable(["","",""],hr,3):"")+(rbi.length?`<div class="boxhead">Runs batted in</div>`+statTable(["","","RBI"],rbi,2):"");
}

/* round 74: each side's hitters (at-bats, hits, home runs, RBI, runs, walks) and pitchers (innings, runs, strikeouts,
   walks, the decision), as the game counted them at bat by at bat; the relievers the roster doesn't carry are "Bullpen" */
function sportBoxPlayers(g,BL){
  const last=(g.drives||[]).slice(-1)[0], B=last&&last.box;
  return ["away","home"].map(sd=>{ const R=BL[sd], hit=R.filter(x=>!isPitcher(x.pos)), pit=R.filter(x=>isPitcher(x.pos)), nm=x=>esc(boxName(x.n));
    const h=hit.map(x=>({c:[nm(x)+` <span style="color:var(--muted)">${esc(x.pos)}</span>`,x.s.ab,x.s.h,x.s.hr,x.s.rbi,x.s.r,x.s.bb].map(String)}));
    const dec=s=>s.w?"W":s.l?"L":s.sv?"SV":"";
    const role=x=>x.s.gs?"SP":x.pos==="CL"&&x.i===POS.findIndex(P=>P.p==="CL")?"CL":x.pos==="CL"||!x.s.gs?"RP":"SP";   // (round 77: the set-up and long men, RP)
    const p=pit.map(x=>({c:[nm(x)+` <span style="color:var(--muted)">${esc(role(x))}</span>`,ipStr(x.s.ip||0),x.s.er,x.s.k,x.s.bb,dec(x.s)].map(String)}));
    const bp=B&&B[sd]&&B[sd].pit&&B[sd].pit.bullpen; if(bp)p.push({c:['<span style="color:var(--muted)">Bullpen</span>',ipStr(bp.outs),bp.er,bp.k,bp.bb,""].map(String)});
    // engine 26: every pitcher by name in the order they pitched, with his pitches, the relievers off the roster too, and
    // the holds and blown saves
    const F=B&&B[sd]; if(F&&F.pit&&Object.keys(F.pit).some(n=>F.pit[n]&&F.pit[n].np!=null)){ const d=F.dec||{}, by={}; pit.forEach(x=>{ by[x.n]=x });
      const q=Object.keys(F.pit).filter(n=>n!=="bullpen").map(n=>{ const s=F.pit[n], x=by[n], r=n===F.sp?"SP":x&&x.pos==="CL"&&x.i===POS.findIndex(P=>P.p==="CL")?"CL":"RP";
        const dc=d.w===n?"W":d.l===n?"L":d.sv===n?"SV":(d.hld||[]).indexOf(n)>=0?"H":(d.bs||[]).indexOf(n)>=0?"BS":"";
        return {c:[esc(boxName(n))+` <span style="color:var(--muted)">${r}</span>`,ipStr(s.outs||0),s.er||0,s.k||0,s.bb||0,s.np||0,dc].map(String)} });
      return boxSide(g,sd,["","AB","H","HR","RBI","R","BB"],h)+statTable(["","IP","ER","K","BB","NP",""],q,1) }
    return boxSide(g,sd,["","AB","H","HR","RBI","R","BB"],h)+(p.length?statTable(["","IP","ER","K","BB",""],p,1):"") }).join("");
}

/* round 79: a pitcher's season so far, "7-4, 3.21 ERA" (Ian: the card should preview the starters, and the box score
   and scores the winning and losing pitchers, with their records, as real baseball does) */
function bsSeasonLine(team,nm){ const R=(SEA&&SEA.roster&&SEA.roster[team])||[], p=R.find(x=>x&&x.n===nm), s=p&&p.st2;
  if(!s||!s.ip)return "no starts yet"; return `${s.w||0}-${s.l||0}, ${(s.er*27/s.ip).toFixed(2)} ERA` }
/* the next game's card: both probable starters */
function sportNextExtra(ng,my,step){ try{ if(typeof spCtx!=="function")return "";
  const opp=ng.home===my?ng.away:ng.home, a=spCtx(my,step), b=spCtx(opp,step); if(!a||!b)return "";
  const row=(t,p)=>`<div class="nrec"><b>${esc(tAb(t))}</b> ${esc(p.n)} <span style="color:var(--muted)">(${esc(bsSeasonLine(t,p.n))})</span></div>`;
  return `<div class="probable"><div class="nlabel" style="margin-top:6px">PROBABLE STARTERS</div>${row(my,a)}${row(opp,b)}</div>${bsLineupNote(my,opp,step)}` }catch(e){ return "" } }
/* engine 26: the lineup card's changes for your next game: who rests, who starts in the platoon */
function bsLineupNote(my,opp,step){ if(typeof bsV26!=="function"||!bsV26())return ""; const K=bsLineup26(my,step,opp); if(!K||!K.why.length)return "";
  const L=K.why.map(([i,o,w])=>w==="rest"?`${esc(boxName(o))} rests; ${esc(boxName(i))} starts`:`${esc(boxName(i))} starts for ${esc(boxName(o))} against the ${K.th==="L"?"left":"right"}-hander`).join(". ");
  return `<div class="fnote" style="margin:4px 0 2px">Your lineup: ${L}.</div>` }

/* the decisions, with each man's season after this game: "W: R. Ortiz (8-3)  L: J. Kim (4-6)  S: T. Padilla (21)" */
function sportSheetNote(g,BL){
  const last=(g.drives||[]).slice(-1)[0], BX=last&&last.box;
  const pick=k=>{ for(const sd of ["home","away"]){ const x=BL[sd].find(y=>isPitcher(y.pos)&&y.s[k]); if(x)return {x:x,t:g[sd]} }
    if(BX)for(const sd of ["home","away"]){ const n=BX[sd]&&BX[sd].dec&&BX[sd].dec[k]; if(n&&BX[sd].pit&&BX[sd].pit[n]&&BX[sd].pit[n].np!=null)return {x:{n:n},t:g[sd]} }   // engine 26: a reliever off the roster
    return null };
  const rec=(t,nm,k)=>{ const R=(SEA.roster&&SEA.roster[t])||[], p=R.find(y=>y&&y.n===nm), s=p&&p.st2||(typeof bsRelief==="function"?bsRelief(t)[nm]:null); if(!s)return ""; return k==="sv"?`${s.sv||0}`:`${s.w||0}-${s.l||0}` };
  // a decision that went to the set-up men (the unnamed bullpen) still gets its line, from engine 6 on, when every game has one
  const hs=g.hp!==undefined?g.hp:g.h, as=g.ap!==undefined?g.ap:g.a, win=hs>as?"home":as>hs?"away":null, pen=k=>ENGINE_V>=6&&win&&k!=="sv"?`${esc(g[k==="w"?win:(win==="home"?"away":"home")])} bullpen`:"";
  const parts=[["w","W"],["l","L"],["sv","S"]].map(([k,lab])=>{ const r=pick(k); return r?`<b>${lab}:</b> ${esc(boxName(r.x.n))} (${esc(rec(r.t,r.x.n,k))})`:pen(k)?`<b>${lab}:</b> ${pen(k)}`:"" }).filter(Boolean);
  return parts.length?`<div class="fnote" style="margin:6px 0 2px">${parts.join(" &nbsp; ")}</div>`:"" }
