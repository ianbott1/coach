/* Hockey's highlights (round 51, core 97_highlights): a goal or a big save from the engine's event, played out on a
   rink by twelve dots and a puck. The commentary's words pick the move where they say how ("tips in a point shot",
   "finishes a two-on-one", "jams a loose puck home at the crease"); the event's draw picks it otherwise. The scorer
   is the man the log names. As on the scoreboard's rink, the home side attacks to the left. */
const HL_SPORT=(function(){
  const PADX=0.03, PADY=0.06;
  // attack frame: 0 the side's own goal end, 1 the end it attacks. G, D, D, C, LW, RW
  const ATT=[[0.08,0.5],[0.63,0.3],[0.63,0.7],[0.8,0.5],[0.84,0.2],[0.84,0.8]];
  const DEF=[[0.92,0.5],[0.86,0.38],[0.86,0.62],[0.8,0.5],[0.72,0.25],[0.72,0.75]];
  const UNIT={C:3,LW:4,RW:5,D:1,D2:2}, GOAL=0.91, net=[0.47,0.53];
  const unitOf=u=>{ const x=u%100; return x<30?"C":x<52?"LW":x<74?"RW":x<88?"D":"D2" };
  const HL_CM=(typeof window!=="undefined"&&window.HLCM)||1;
  /* round 104: one rule for when a side is short a man, for the clips and the play between them. The engine places a
     power play's shots evenly through the stretch and the penalty at its own minute, so the window runs from whichever
     comes first, the call or the first power-play shot, for two minutes or to the last power-play shot. The man called
     sits it out (the commentary's man, hkSkater): he takes the sixth's place, which stays empty. */
  function hkPPWin(x,e){ const pk=e.side, pp=pk==="home"?"away":"home", ms=[];
    (x.sv||[]).forEach(q=>{ if(q.pp&&q.side===pk)ms.push(q.m) }); (x.ev||[]).forEach(q=>{ if(q.k==="goal"&&q.pp&&q.side===pp)ms.push(q.m) });
    const s=Math.min(e.m,...(ms.length?ms:[e.m])), z=Math.max(s+2,...(ms.length?ms.map(m=>m+1):[s+2])); return [s,z] }
  /* round 107: the places left empty by how many men a side is missing: one (a penalty) the sixth; two (overtime's
     three-on-three, Instinct: "announced three-on-three while still drawing five skaters") a defenceman and the sixth */
  const HK_OUT=[new Set(),new Set([5]),new Set([2,5])], hpOut=n=>HK_OUT[Math.max(0,Math.min(2,+n||0))];
  // overtime: three a side (four on a power play, as the NHL plays it); engine 21
  const hkOT=d=>!!(d&&!d.so&&typeof SEGS!=="undefined"&&d.seg>=SEGS&&(typeof ENGINE_V==="undefined"||ENGINE_V>=21));
  function hkShort(L,side,m){ for(const x of (L.drives||[]))for(const e of (x.ev||[])){ if(e.k!=="pen"||e.side!==side)continue; const w=hkPPWin(x,e); if(m>=w[0]&&m<w[1])return e } return null }
  function hkOffender(team,e){ const n=hkSkater(team,e.u||0), R=(SEA.roster&&SEA.roster[team])||[]; return R.findIndex(p=>p&&p.n===n) }
  function clips(L,d,mode){
    // round 70: the shots stopped (d.sv, every one the engine played) give the saves; the commentary's big saves first.
    // Key moments: about one save for each goal over a game (Ian: "too high a share of goals")
    if(mode==="pb"){ // round 101: the full match: every goal and every shot stopped (d.sv is every one the engine played)
      // round 107: each big save the commentary logged is one of the stretch's stops, the nearest on that side: it takes
      // that one's place (matched within the minute only, a big save a minute or more from any stop was shown as well as
      // all the stops, a save more than the goalie made: Vegas stopped 33, the screen showed 35 stopped)
      const logged=(d.ev||[]).filter(e=>e.k==="save"), used=new Set();
      logged.forEach(x=>{ let bi=-1, bd=1e9; (d.sv||[]).forEach((e,i)=>{ if(used.has(i)||e.side!==x.side)return; const dd=Math.abs(e.m-x.m); if(dd<bd){bd=dd;bi=i} }); if(bi>=0)used.add(bi) });
      const svAll=(d.sv||[]).filter((e,i)=>!used.has(i));
      const ev=(d.ev||[]).filter(e=>e.k==="goal"||e.k==="save").concat(svAll.map(e=>Object.assign({},e,{k:"save"}))).sort((a,b)=>a.m-b.m);
      let rows=[]; try{ rows=rowsOf(L.g,L.drives) }catch(e){}
      const out=[]; let sh=d.sh-(d.h||0), sa=d.sa-(d.a||0);
      if(d.so)return clips(L,d,"all");
      ev.forEach(e=>{ if(e.k==="goal"){ const c=mk(L,e,"goal",rows,d); if(e.side==="home")sh++; else sa++; c.after=[sh,sa]; out.push(c); return }
        const c=mk(L,e,"save",rows,d); c.base=2200; out.push(c) });
      out.forEach(c=>Object.defineProperty(c,"pbFrom",{value:L,writable:true,configurable:true,enumerable:false}));   // round 104: grows out of the touch-by-touch play
      return out }
    const all=mode==="all"||mode==="full", logged=(d.ev||[]).filter(e=>e.k==="save");
    const svPick=(d.sv||[]).filter(e=>all?e.u%3===0:e.u%5===0||(e.pp&&e.u%2===0)).filter(e=>!logged.some(x=>Math.abs(x.m-e.m)<1&&x.side===e.side));
    const ev=(d.ev||[]).filter(e=>e.k==="goal"||e.k==="save").concat(svPick.map(e=>Object.assign({},e,{k:"save"}))).sort((a,b)=>a.m-b.m);
    let rows=[]; try{ rows=rowsOf(L.g,L.drives) }catch(e){}
    const out=[]; let chance=0; let sh=d.sh-(d.h||0), sa=d.sa-(d.a||0);
    // a shoot-out: the engine keeps only who won it, so the deciding attempt is the clip (round 67)
    if(d.so){ const win=(d.sh||0)>=(d.sa||0)?"home":"away"; out.push(mk(L,{k:"goal",side:win,m:65,u:((d.sh||0)*7+(d.sa||0)*13+(d.seg||0))%100,so:true},"goal",rows,d)); return out }
    ev.forEach(e=>{
      if(e.k==="goal"){ const c=mk(L,e,"goal",rows,d); if(e.side==="home")sh++; else sa++; c.after=[sh,sa]; out.push(c); return }
      if((mode==="key"&&chance<2&&Math.abs(sh-sa)<=3||all&&chance<4)&&((e.u||0)%HL_CM===0)){ chance++; out.push(mk(L,e,"save",rows,d)) } });
    return hlTrim(out,mode==="all"||mode==="full"?5:3);
  }
  function mk(L,e,kind,rows,d){ d=d||{};
    const g=L.g, attSide=kind==="goal"?e.side:(e.side==="home"?"away":"home"), tm=attSide==="home"?g.home:g.away, u=e.u||0;
    const r=mulberry32(((e.m||0)*7919+u*131+(attSide==="home"?17:29))>>>0);
    const GN=kind==="goal"?hkGoalNames(tm,e):null, shooter=GN?GN.n:hkSkater(tm,u);
    // round 80: line changes (Ian): the men on the ice are the line and pair the scorer and his assist play on, the
    // first or the second, and in a chance the shift the clock and your ice time give; a fourth-line goal has no names.
    // The scorer is the dot that shoots (it was a slot by draw, wearing the first line's numbers).
    const R0=(SEA.roster&&SEA.roster[tm])||[], ix=n=>{ if(!n)return -1; for(let i=0;i<R0.length;i++)if(R0[i]&&R0[i].n===n)return i; return -1 };
    const si=ix(shooter), ai=GN?ix(GN.a):-1, nP=typeof POS!=="undefined"?POS.length:6, posOf=i=>i<0?-1:i%nP, lineOf=i=>i<0?-1:(i>=nP?1:0);
    let unit=unitOf(u); if(GN&&si>=0&&posOf(si)<5)unit=["C","LW","RW","D","D2"][posOf(si)];
    const row=rows.find(x=>x.m===e.m+"'"&&(kind==="goal"?/GOAL|EMPTY/.test(x.tag):!x.tag&&/save|robs|denied|gloves|stretches/i.test(x.text)));
    const text=row?row.text:"", T=text.toLowerCase();
    let plan=e.so?"so":e.en?"en":e.pp?"pp":/tips|point/.test(T)?"point":/two-on-one|walks in alone/.test(T)?"rush":/jams|crease|loose puck|bats|skate/.test(T)?"cycle":/one-times|circle/.test(T)?"pp"
      :["rush","cycle","point","pp"][Math.floor(r()*4)];
    const s=r()<0.5?0:1, sy=s?0.72:0.28;
    let W;
    if(plan==="so")W=[[0.5,0.5],[0.7,0.5+(r()-0.5)*0.25],[0.85,0.5+(r()-0.5)*0.14]];
    else if(plan==="rush")W=[[0.42,0.5],[0.66,s?0.32:0.68],[0.8,0.5+(s?0.08:-0.08)]];
    else if(plan==="cycle")W=[[0.7,sy],[0.95,s?0.8:0.2],[0.96,0.4+r()*0.2],[0.86,0.5+(r()-0.5)*0.08]];
    else if(plan==="point")W=[[0.74,s?0.85:0.15],[0.65,s?0.68:0.32],[0.84,0.5]];
    else if(plan==="pp")W=[[0.65,0.5],[0.78,s?0.82:0.18],[0.82,s?0.7:0.3]];
    else W=[[0.35,0.5],[0.55,0.5+(r()-0.5)*0.3]];   // empty net: from anywhere
    // round 104: a side short a man (a penalty in the last two minutes) has no sixth skater on the ice
    const penA=e.so?null:hkShort(L,attSide,e.m||0), penD=e.so?null:hkShort(L,attSide==="home"?"away":"home",e.m||0), ot=hkOT(d);
    const nA=ot?(penA?2:penD?1:2):penA?1:0, nD=ot?(penD?2:penA?1:2):(penD||e.pp)?1:0, shortA=nA>0, OA=hpOut(nA);
    let sIdx=UNIT[unit]||3; const sWas=sIdx; if(OA.has(sIdx))sIdx=sIdx===5?4:1;
    const rec=W.map((w,i)=>{ if(i===W.length-1||plan==="so")return sIdx;   // a shoot-out: one man carries it all the way
 let b=3,bd=9; for(let k=1;k<6;k++){ if(k===sIdx||OA.has(k))continue; const p=ATT[k], dd=Math.hypot(p[0]-w[0],p[1]-w[1]); if(dd<bd){bd=dd;b=k} } return b });
    const end=kind==="goal"?[GOAL+0.012,net[0]+r()*(net[1]-net[0])]:[GOAL-0.012,0.5+(r()-0.5)*0.05];
    const inks=hlKits(g.home,g.away).map(k=>k.fill); const gks=hlFar(["#111318","#E8F56B","#C9A0FF","#FF9F43"],inks);
    const nm=shooter?String(shooter).split(" ").slice(-1)[0]:"";
    // round 67: numbers on every man and a key under the rink; slots G, D, D, C, LW, RW are roster places 5, 3, 4, 0, 1, 2
    // the goalie in net is the one playing (round 71: the backup once he's in, or when he started)
    const gIn=sd=>!!((d.gIn&&d.gIn[sd])||(L.drives[0]&&L.drives[0].bk&&L.drives[0].bk[sd]));
    const shift=(team,grp,salt)=>{ const dep=typeof deployOf==="function"?deployOf(SEA,team):{}, k=dep[grp]||"bal", b=typeof DEPLOY!=="undefined"&&DEPLOY[grp]&&DEPLOY[grp].opts[k]?DEPLOY[grp].opts[k].b:0.3;
      return (((u*37+(e.m||0)*11+salt)%100)+0.5)/100<(1-b)?0:1 };   // first unit about its share of the ice
    const pickLine=(team,grp,a,b,salt)=>{ const la=lineOf(a), lb=lineOf(b), want=x=>x>=0&&(grp==="f"?posOf(x)<3:posOf(x)>=3&&posOf(x)<5);
      return want(a)?la:want(b)?lb:shift(team,grp,salt) };
    const fL=GN&&GN.depth?1:pickLine(tm,"f",si,ai,3), dL=pickLine(tm,"d",si,ai,7);
    // round 97: a hurt man isn't on the ice (Grokbot: an injured player drawn in a clip; 144 of 900 clips in 33 games named
    // one, most often a hurt starting goalie): his line-mate at the spot instead, the backup in net
    const hurtOf=team=>new Set(SEA.talent&&SEA.talent.inj&&SEA.talent.inj[team]?SEA.talent.active(team).map(x=>x.idx):[]);
    // review round: the scorer and his assist played in this game, so a later injury never takes them off the ice when an old
    // game is watched again (hk-lines: 7 of 240 goals drew a line-mate shooting after the scorer was hurt weeks later)
    const H0=hurtOf(tm), bkOf=i=>typeof BK==="function"?BK(i):i+nP; if(GN){ H0.delete(si); H0.delete(ai) }
    const pickAt=(R,H,i,l)=>{ const j=l?bkOf(i):i, o=l?i:bkOf(i); return R[j]&&!H.has(j)?j:R[o]&&!H.has(o)?o:R[j]?j:i };
    const at=(i,l)=>pickAt(R0,H0,i,l);   // a man missing or hurt: the other line's
    const slots=sd=>{ const team=sd==="home"?g.home:g.away, H=hurtOf(team); return [(gIn(sd)||H.has(5))&&typeof BK==="function"?BK(5):5,3,4,0,1,2] };
    const defSide=attSide==="home"?"away":"home", opp=attSide==="home"?g.away:g.home;
    const SL=[slots(attSide)[0],at(3,dL),at(4,dL),at(0,fL),at(1,fL),at(2,fL)];
    if(sWas!==sIdx){ [SL[sIdx],SL[sWas]]=[SL[sWas],SL[sIdx]] }   // the shooter's dot is his: short a man, the right wing shoots from the left wing's place
    if(GN&&!GN.depth&&si>=2*nP)SL[sIdx]=si;   // engine 27: a goal of the bottom six (the roster carries twenty-three): the scorer is out there, his own number
    if(penA){ const o=hkOffender(tm,penA), j=SL.indexOf(o); if(j>0&&j!==5&&j!==sIdx){ [SL[j],SL[5]]=[SL[5],SL[j]] } }   // the man in the box isn't out there
    // the assist from the other line: he's out there too (a shift on the change), at his own place if the scorer isn't
    // in it, else beside him
    if(GN&&ai>=0&&!GN.depth&&SL.indexOf(ai)<0&&posOf(ai)<5){ const own=[3,4,5,1,2][posOf(ai)], grp=posOf(ai)<3?[3,4,5]:[1,2], shot=sIdx;
      const k=own!==shot?own:grp.find(x=>x!==shot); if(k!=null)SL[k]=ai }
    const Ro=(SEA.roster&&SEA.roster[opp])||[], HO=hurtOf(opp), atO=(i,l)=>pickAt(Ro,HO,i,l), oF=shift(opp,"f",13), oD=shift(opp,"d",19);
    const DL=[slots(defSide)[0],atO(3,oD),atO(4,oD),atO(0,oF),atO(1,oF),atO(2,oF)];
    if(penD){ const o=hkOffender(opp,penD), j=DL.indexOf(o); if(j>0&&j!==5){ [DL[j],DL[5]]=[DL[5],DL[j]] } }
    const an=hlNamed(tm,SL), dn=hlNamed(opp,DL), kits=hlKits(g.home,g.away);
    if(GN&&GN.depth){ an[3]=an[4]=an[5]=null }   // the fourth line: the roster doesn't carry them
    // the assist is the pass before the shot, when he's out there
    if(GN&&ai>=0&&rec.length>=2&&plan!=="so"){ let aSlot=SL.indexOf(ai)>0?SL.indexOf(ai):[3,4,5,1,2][posOf(ai)];   // round 104: where he is (the slots can swap)
      if(OA.has(aSlot)){ const o=nA<=1?(sIdx===4?3:4):[3,4,1].find(x=>x!==sIdx&&!OA.has(x)); [an[o],an[aSlot]]=[an[aSlot],an[o]]; [SL[o],SL[aSlot]]=[SL[aSlot],SL[o]]; aSlot=o }   // short a man: the assist from the man who's out there
      if(aSlot!=null&&aSlot!==sIdx)rec[rec.length-2]=aSlot }
    const OD=hpOut(nD), legend=[{team:tm,kit:kits[attSide==="home"?0:1],list:an.filter((x,i)=>x&&!(ot&&OA.has(i)))},{team:opp,kit:kits[attSide==="home"?1:0],list:dn.filter((x,i)=>x&&!(ot&&OD.has(i)))}];
    const gno=kind==="goal"&&!e.so?hlGoalNo(L,e,x=>{ const N=hkGoalNames(x.side==="home"?g.home:g.away,x); return N.depth?null:N.n }):0;
    return {shortA,shortD:!!penD||!!e.pp,nA,nD,ot,who:shooter,gno,an,dn,legend:e.so?null:legend,kind,so:!!e.so,e,tm,home:attSide==="home",W,rec,end,nm,text:e.so?"":text,plan,m:e.m,base:3200,inks,gk:gks,en:!!e.en,pp:!!e.pp};
  }
  // the home side attacks left: flip the attack frame for it
  const P=(W,H,c,a,y)=>{ const X=c.home?1-a:a, Y=c.home?1-y:y; return [W*PADX+X*W*(1-2*PADX), H*PADY+Y*H*(1-2*PADY)] };
  function pitch(x,W,H){
    // the arena in the dark, the boards, then the ice: a cold sheen, skate marks, the lines and circles under it
    const bg=x.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#151A24"); bg.addColorStop(1,"#0D1118"); x.fillStyle=bg; x.fillRect(0,0,W,H);
    const L=W*PADX, T=H*PADY, w=W*(1-2*PADX), h=H*(1-2*PADY), rr=h*0.28;
    const rink=(o)=>{ const l=L-o, t=T-o, ww=w+2*o, hh=h+2*o, r=rr+o; x.beginPath(); x.moveTo(l+r,t); x.lineTo(l+ww-r,t); x.quadraticCurveTo(l+ww,t,l+ww,t+r); x.lineTo(l+ww,t+hh-r);
      x.quadraticCurveTo(l+ww,t+hh,l+ww-r,t+hh); x.lineTo(l+r,t+hh); x.quadraticCurveTo(l,t+hh,l,t+hh-r); x.lineTo(l,t+r); x.quadraticCurveTo(l,t,l+r,t); x.closePath() };
    rink(Math.max(3,W/160)); x.fillStyle="#D9E1E8"; x.fill(); x.strokeStyle="#5F6B78"; x.lineWidth=1; x.stroke();
    x.save(); rink(0); x.clip();
    const ice=x.createRadialGradient(L+w/2,T+h/2,h*0.1,L+w/2,T+h/2,w*0.62); ice.addColorStop(0,"#F7FBFE"); ice.addColorStop(1,"#DCE8F1"); x.fillStyle=ice; x.fillRect(L,T,w,h);
    // skate marks: long faint arcs, from a seed
    { const r=mulberry32(5); x.lineWidth=0.5; for(let k=0;k<70;k++){ const cx=L+r()*w, cy=T+r()*h, R=h*(0.2+r()*0.8), a=r()*Math.PI*2;
      x.beginPath(); x.arc(cx,cy,R,a,a+0.25+r()*0.5); x.strokeStyle=`rgba(120,140,160,${0.05+r()*0.08})`; x.stroke() } }
    hlSpeckle(x,L,T,w,h,Math.round(w*h/60),9,0.04);
    const vl=(fx,col,lw)=>{ x.fillStyle=col; x.fillRect(L+fx*w-lw/2,T,lw,h) };
    const lw=Math.max(2.5,w/110);
    vl(0.35,"rgba(36,92,170,.88)",lw); vl(0.65,"rgba(36,92,170,.88)",lw); vl(0.5,"rgba(200,30,45,.85)",lw);
    // the centre line's notches, as the NHL paints it
    x.fillStyle="rgba(255,255,255,.7)"; for(let yy=T;yy<T+h;yy+=lw*2.4)x.fillRect(L+w/2-lw*0.12,yy,lw*0.24,lw*1.1);
    vl(GOAL,"rgba(200,30,45,.8)",Math.max(1,lw*0.35)); vl(1-GOAL,"rgba(200,30,45,.8)",Math.max(1,lw*0.35));
    const ring=(cx,cy,R,col)=>{ x.beginPath(); x.arc(cx,cy,R,0,Math.PI*2); x.strokeStyle=col; x.lineWidth=Math.max(1,lw*0.35); x.stroke() };
    const dot=(cx,cy,R,col)=>{ x.beginPath(); x.arc(cx,cy,R,0,Math.PI*2); x.fillStyle=col; x.fill() };
    ring(L+w/2,T+h/2,h*0.13,"rgba(36,92,170,.85)"); dot(L+w/2,T+h/2,lw*0.5,"rgba(36,92,170,.9)");
    // the end-zone circles with their hash marks, and the neutral-zone dots
    [0.19,0.81].forEach(fx=>[0.24,0.76].forEach(fy=>{ const cx=L+fx*w, cy=T+fy*h, R=h*0.17; ring(cx,cy,R,"rgba(200,30,45,.75)"); dot(cx,cy,lw*0.7,"rgba(200,30,45,.85)");
      x.strokeStyle="rgba(200,30,45,.75)"; [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{ x.beginPath(); x.moveTo(cx+sx*R*0.28,cy+sy*R*0.92); x.lineTo(cx+sx*R*0.28,cy+sy*R*1.15); x.stroke() }) }));
    [0.39,0.61].forEach(fx=>[0.24,0.76].forEach(fy=>dot(L+fx*w,T+fy*h,lw*0.6,"rgba(200,30,45,.85)")));
    // the creases and the nets
    [[GOAL,1],[1-GOAL,-1]].forEach(([gx,sd])=>{ const cx=L+gx*w, cy=T+h/2;
      x.beginPath(); x.moveTo(cx,cy-h*0.07); x.arc(cx,cy,h*0.07,sd>0?-Math.PI/2:Math.PI/2,sd>0?Math.PI/2:Math.PI*1.5,true); x.closePath();
      x.fillStyle="rgba(110,175,230,.55)"; x.fill(); x.strokeStyle="rgba(200,30,45,.8)"; x.lineWidth=1; x.stroke();
      hlNet(x,cx,T+h*net[0],T+h*net[1],w*0.018,sd); x.strokeStyle="#D7263D"; x.lineWidth=2; x.beginPath(); x.moveTo(cx,T+h*net[0]); x.lineTo(cx+w*0.018*sd,T+h*net[0]); x.lineTo(cx+w*0.018*sd,T+h*net[1]); x.lineTo(cx,T+h*net[1]); x.stroke() });
    // the glass's shadow on the ice along the boards
    const sg=x.createLinearGradient(0,T,0,T+h*0.06); sg.addColorStop(0,"rgba(30,40,55,.18)"); sg.addColorStop(1,"rgba(30,40,55,0)"); x.fillStyle=sg; x.fillRect(L,T,w,h*0.06);
    x.restore();
    rink(0); x.strokeStyle="#F5C342"; x.lineWidth=Math.max(1.5,W/400); x.stroke();   // the kick plate
  }
  /* ---- the full match (round 98: "watch it, not read it"; soccer's since round 68) ----
     Between the moments the ice keeps playing: the puck moved about by the side that has it, shared as the engine's balance
     of play for the stretch has it (its drive's mom), never into the slot and never a shot; each side's five keeps its
     shape around the puck, the goalies square to it. Every real moment still plays as its own clip. Drawn from the clock,
     not stored. */
  function ambient(x,W,H){
    /* round 99 (Ian: "never seeing any skating down the ice or passing; everything in the final third"): whole-rink
       possessions. Each one: a breakout from behind its own net (the D up the boards to a winger), the carry up the ice
       with the puck on his stick and his line skating with him, the entry over the blue line, a cycle of passes low and
       to the points, then the puck is lost (a stick check, a dump, a clear) and the other five break out the other way.
       Which side has it follows the stretch's balance of play (mom). The checkers back-check between the puck and their
       net, the goalies square to it. Never a shot: every shot is a real one, played as its own clip. */
    if(typeof live==="undefined"||!live||live.done||!live.g)return;
    const g=live.g, last=live.drives[live.drives.length-1], mom=last&&typeof last.mom==="number"?last.mom:0.5;
    const now=Date.now(), seedB=((live.step||0)*7919+live.drives.length*131+3)>>>0, PD=9000;
    const rnd=(k,j)=>((strHash(seedB+"|"+k+"|"+j)>>>0)%10000)/10000;
    // one possession's puck path in the frame of the side with it (a: 0 its own goal line end, 1 the end it attacks)
    const plan=k=>{ const home=rnd(k,0)<mom, sd=rnd(k,1)<0.5?0.14:0.86, os=1-sd, ent=rnd(k,2)<0.35;   // ent: dump it in
      // [time 0-1, a, y, who has it (index in the five: 0 D, 1 D, 2 C, 3 W strong side, 4 W weak side), pass?]
      const P0=[[0,0.07,0.5,0,0],[0.08,0.1,sd*0.6+0.2,0,0],[0.14,0.27,sd,3,1],[0.22,0.34,sd*0.85+0.075,3,0],[0.3,0.44,0.5+(sd-0.5)*0.4,2,1],
        [0.42,0.62,0.5+(os-0.5)*0.3,2,0],[0.5,ent?0.9:0.72,ent?sd:0.5+(os-0.5)*0.55,ent?3:4,ent?1:0],[0.6,0.86,os*0.9+0.05,4,ent?0:1],
        [0.68,0.68,os*0.7+0.15,1,1],[0.76,0.68,sd*0.7+0.15,0,1],[0.84,0.85,sd*0.9+0.05,3,1],[0.92,0.8,0.5+(sd-0.5)*0.3,2,1],[1,0.92,0.5+(sd-0.5)*0.2,2,0]];   // lost deep in their end, where the other five break out from
      return {home,sd,os,P:P0} };
    const at=T=>{ const k=Math.floor(T/PD), f=(T-k*PD)/PD, pl=plan(k); let i=0; while(i<pl.P.length-2&&pl.P[i+1][0]<=f)i++;
      const A=pl.P[i], B=pl.P[i+1], u=(f-A[0])/Math.max(1e-6,B[0]-A[0]), pass=B[4]===1, e=pass?Math.min(1,u*1.6):hlEase(u);
      return {k,f,pl,a:hlLerp(A[1],B[1],e),y:hlLerp(A[2],B[2],e),who:pass&&u<0.62?-1:(pass?B[3]:A[3]),toWho:B[3],pass,u} };
    // the five with the puck, around it: the man with it on it, the rest in lanes ahead or trailing
    const five=s=>{ const a=s.a, y=s.y, sd=s.pl.sd, os=s.pl.os, lane=v=>0.5+(v-0.5)*0.92;
      const P=[[Math.max(0.06,a-0.22),lane(0.32)],[Math.max(0.06,a-0.2),lane(0.68)],[Math.min(0.9,a+0.04),0.5+(y-0.5)*0.4],[Math.min(0.92,a+0.07),lane(sd*0.9+0.05)],[Math.min(0.92,a+0.1),lane(os*0.85+0.075)]];
      if(a>0.66){ P[0]=[0.66,lane(0.3)]; P[1]=[0.66,lane(0.7)]; P[2]=[0.8,0.5+(y-0.5)*0.3]; P[3]=[0.86,lane(sd*0.85+0.075)]; P[4]=[0.84,lane(os*0.75+0.125)] }   // set up in their end: the D at the points
      if(s.who>=0)P[s.who]=[a-0.012,y]; else { const t=s.pl.P, nx=t.find(q=>q[0]>s.f); if(nx)P[nx[3]]=[hlLerp(P[nx[3]][0],nx[1],0.7),hlLerp(P[nx[3]][1],nx[2],0.7)] }   // a pass: the man it's going to moves to meet it
      return P };
    // their five: between the puck and their own net (at 1 in this frame), tighter as it comes in
    const chk=s=>{ const a=s.a, y=s.y, d=Math.min(1,Math.max(0,(a-0.3)/0.5)), back=hlLerp(0.5,0.9,d);
      return [[Math.min(0.97,back+0.03),0.5+(y-0.5)*0.35-0.1],[Math.min(0.97,back+0.03),0.5+(y-0.5)*0.35+0.1],[Math.min(0.95,a+0.05),hlLerp(0.5,y,0.6)],[Math.min(0.93,back-0.07),0.24+(y-0.5)*0.2],[Math.min(0.93,back-0.07),0.76+(y-0.5)*0.2]] };
    const lag=fn=>{ const o=[[0,0],[0,0],[0,0],[0,0],[0,0]]; [0,90,180,270].forEach((dt,q)=>{ const w=4-q, s=at(now-dt), side=s.pl.home, P=fn(s);
        P.forEach((p,i)=>{ const X=side?1-p[0]:p[0], Y=side?1-p[1]:p[1]; o[i][0]+=X*w; o[i][1]+=Y*w }) }); return o.map(p=>[p[0]/10,p[1]/10]) };   // rink frame, smoothed
    const s=at(now), home=s.pl.home, kits=hlKits(g.home,g.away), r=Math.max(5,W/80), gks=hlFar(["#111318","#E8F56B","#C9A0FF","#FF9F43"],kits.map(k=>k.fill));
    const RP=(X,Y)=>{ const sideF={home:false}; return P(W,H,sideF,X,Y) };   // rink frame straight to the screen (home attacks left: X is already in rink terms)
    const puckX=home?1-s.a:s.a, puckY=home?1-s.y:s.y; let [qx,qy]=RP(puckX,puckY);
    const A5=lag(five), C5=lag(chk), ka=kits[home?0:1], kc=kits[home?1:0];
    // the goalies: on their lines, square to the puck
    [[GOAL,0],[1-GOAL,1]].forEach(([gx,ti],j)=>{ const [px,py]=RP(gx,0.5+(puckY-0.5)*0.12); hlPlayer(x,px,py,r,hlKit("",gks[ti]),{dir:Math.atan2(qy-py,qx-px)}) });
    // round 100 (Grokbot: "some frames still show unnamed dots"): every skater by number and name. The five out there
    // change by possession, the second unit about a third of them; a hurt man's line-mate takes his place
    const nP=typeof POS!=="undefined"?POS.length:6, bkI=i=>typeof BK==="function"?BK(i):i+nP;
    const fiveOf=(team,k,salt)=>{ const R=(SEA.roster&&SEA.roster[team])||[], H=new Set(SEA.talent&&SEA.talent.inj&&SEA.talent.inj[team]?SEA.talent.active(team).map(q=>q.idx):[]);
      const l=((k*7+salt)%3)===2?1:0, pk=i=>{ const j=l?bkI(i):i, o=l?i:bkI(i); return R[j]&&!H.has(j)?j:R[o]&&!H.has(o)?o:j };
      return hlNamed(team,[pk(3),pk(4),pk(0),pk(1),pk(2)]) };
    const aT=home?g.home:g.away, cT=home?g.away:g.home, ck=(s.k||0)+"|"+aT;
    const NM=ambient._n=ambient._n&&ambient._n.k===ck&&ambient._n.L===live?ambient._n:{k:ck,L:live,a:fiveOf(aT,s.k||0,1),c:fiveOf(cT,s.k||0,2)};
    const lab=q=>q?{num:q[0],sub:q[1]}:{};
    C5.forEach((p,i)=>{ const [px,py]=RP(p[0],p[1]); hlPlayer(x,px,py,r,kc,Object.assign({dir:Math.atan2(qy-py,qx-px)},lab(NM.c[i]))) });
    A5.forEach((p,i)=>{ let [px,py]=RP(p[0],p[1]); const on=s.who===i;
      if(on){ const back=home?1:-1; px=qx+back*r*1.2; py=qy+Math.sin(now/110)*r*0.25 }   // on his stick, worked side to side
      hlPlayer(x,px,py,r,ka,Object.assign({dir:on?(home?Math.PI:0):Math.atan2(qy-py,qx-px)},lab(NM.a[i]))) });
    if(s.who>=0){ qy+=Math.sin(now/110)*r*0.45 }   // stickhandling: the puck moves on his blade
    hlBall(x,qx,qy,r*0.5,0,null,{kind:"puck"});
    const Hd=live.hold, hs=Hd?Hd.h:live.eng.h, as=Hd?Hd.a:live.eng.a, m=Math.min(60,live.drives.length*5);
    hlBug(x,W,H,{home:g.home,away:g.away,hs:hs,as:as,hk:kits[0],ak:kits[1],clock:(Hd&&Hd.clock)||(m<=20?"1st":m<=40?"2nd":"3rd")+" \u00b7 "+m+"'"});   // round 100: the header's clock when it holds one (it read 6', the rink 10')
  }
  function idle(x,W,H){ if(typeof live!=="undefined"&&live&&live.pb&&live.pb.d&&!live.done&&typeof hlEvDraw==="function"){ hlEvDraw(x,W,H); return }
    if(typeof hlAmbOn==="function"?hlAmbOn():typeof hlMode==="function"&&hlMode()==="full")ambient(x,W,H) }   // round 67: nothing until something happens, unless you asked for the full match
  /* ---- round 104: the full match, touch by touch (soccer's since round 103). Between the shots, each side's own numbers
     for the stretch are played (d.T, the tells, less the stretch before: the giveaways it forced in their zone, the zone
     entries it killed, the shifts it cycled below their goal line, so the read's numbers are what you saw); each penalty
     at its minute, the side short a man on the ice for its two minutes; whistles (icing, offside, a goalie freezing it)
     and faceoffs after them; hits at the league's rate. Each move is passed between the men on the ice, the lines
     changing every shift by the club's deployment (the first unit its share), every man named. Each move picks up where
     the last ended and the one before a shot ends where the shot's own move begins, on the shot's first man in his own
     number. Drawn from the stretch and how far through it the clock is (d, f): the same frame however it's reached.
     No game dice. */
  const HP_RATE={icing:0.35,off:0.3,hit:1.8,freeze:0.4};   // a side's icings, offsides and hits in five minutes (NHL: about 4, 3.5, 22 a game); share of saves the goalie freezes
  const HP_POS=["the goalie","the defenceman","the defenceman","the centre","the left wing","the right wing"];
  // the six on the ice for a side and a shift (roster places, by slot: G, D, D, C, LW, RW), as the clips pick them
  function hpSix(L,d,sd,fL,dL,off){ const g=L.g, team=sd==="home"?g.home:g.away, R=(SEA.roster&&SEA.roster[team])||[], nP=POS.length, bk=i=>typeof BK==="function"?BK(i):i+nP;
    const H=new Set(SEA.talent&&SEA.talent.inj&&SEA.talent.inj[team]?SEA.talent.active(team).map(x=>x.idx):[]);
    const pick=(i,l)=>{ const j=l?bk(i):i, o=l?i:bk(i); return R[j]&&!H.has(j)?j:R[o]&&!H.has(o)?o:R[j]?j:i };
    const gIn=!!((d.gIn&&d.gIn[sd])||(L.drives[0]&&L.drives[0].bk&&L.drives[0].bk[sd]));
    const gk=(gIn||H.has(5))&&typeof BK==="function"?BK(5):5, idx=[gk,pick(3,dL),pick(4,dL),pick(0,fL),pick(1,fL),pick(2,fL)];
    if(off!=null&&off>=0){ const j=idx.indexOf(off); if(j>0&&j!==5)[idx[j],idx[5]]=[idx[5],idx[j]] }   // the man in the box takes the empty sixth place
    return {idx,an:hlNamed(team,idx)} }
  const hpWho=(S,s)=>S&&S.an&&S.an[s]?S.an[s][1]:HP_POS[s];
  // where the six stand for a puck at (a,y) in the frame of the side with it (0 its own end), the other side between it and its net
  function hpShape(a,y,short){ const lane=v=>0.5+(v-0.5)*0.92;
    let A=[[0.08,0.5+(y-0.5)*0.1],[Math.max(0.06,a-0.2),lane(0.32)],[Math.max(0.06,a-0.18),lane(0.68)],[Math.min(0.9,a+0.03),0.5+(y-0.5)*0.45],[Math.min(0.92,a+0.07),lane(0.18+(y-0.5)*0.25)],[Math.min(0.92,a+0.07),lane(0.82+(y-0.5)*0.25)]];
    if(a>0.66){ A[1]=[0.67,lane(0.3)]; A[2]=[0.67,lane(0.7)]; A[3]=[0.8,0.5+(y-0.5)*0.35]; A[4]=[0.86,lane(0.22+(y-0.5)*0.4)]; A[5]=[0.86,lane(0.78+(y-0.5)*0.4)] }
    const d=Math.min(1,Math.max(0,(a-0.3)/0.5)), back=hlLerp(0.55,0.9,d);
    let D=[[0.92,0.5+(y-0.5)*0.12],[Math.min(0.97,back+0.03),0.5+(y-0.5)*0.35-0.1],[Math.min(0.97,back+0.03),0.5+(y-0.5)*0.35+0.1],[Math.min(0.95,a+0.06),hlLerp(0.5,y,0.6)],[Math.min(0.93,back-0.08),0.24+(y-0.5)*0.2],[Math.min(0.93,back-0.08),0.76+(y-0.5)*0.2]];
    // round 108 (engine 22): deep in its own end the side with the puck breaks out (wingers up the boards, the centre low
    // in support, the D in the corners), and the other side forechecks it (one on the puck, two high, the D at the blue
    // line) where it stood back at centre ice and let them out
    if(typeof ENGINE_V==="undefined"||ENGINE_V>=22){ const fc=Math.max(0,Math.min(1,(0.42-a)/0.22)), bl=(P,Q)=>P.map((p,i)=>i&&Q[i]?[hlLerp(p[0],Q[i][0],fc),hlLerp(p[1],Q[i][1],fc)]:p);
      if(fc>0){ A=bl(A,[null,[Math.max(0.05,a-0.05),lane(0.28)],[Math.max(0.05,a-0.05),lane(0.72)],[a+0.07,0.5+(y-0.5)*0.4],[a+0.16,0.1],[a+0.16,0.9]]);
        D=bl(D,[null,[Math.max(0.36,a+0.3),0.3],[Math.max(0.36,a+0.3),0.7],[a+0.045,hlLerp(0.5,y,0.9)],[a+0.14,y<0.5?0.32:0.22],[a+0.17,y<0.5?0.78:0.68]]) } }
    return {A,D} }   // both in the attacking side's frame
  const hpNear=(P,a,y,skip,short)=>{ let b=3,bd=9; const O=hpOut(short); for(let k=1;k<6;k++){ if(k===skip||O.has(k))continue; const dd=Math.hypot(P[k][0]-a,P[k][1]-y); if(dd<bd){bd=dd;b=k} } return b };
  function hpAfter(m){ const s=m.side, o=1-s, c=m.c;
    if(m.end==="clip")return c.kind==="goal"?{side:null,kind:"faceoff",zone:"centre"}:((c.e.u||0)%100)<HP_RATE.freeze*100?{side:null,kind:"faceoff",zone:"d",def:o}:{side:o,kind:"won"};
    if(m.end==="icing")return {side:null,kind:"faceoff",zone:"d",def:s}; if(m.end==="off")return {side:null,kind:"faceoff",zone:"n"};
    if(m.end==="pen")return {side:null,kind:"faceoff",zone:"d",def:m.pen};   // the side short a man defends the draw
    return {side:o,kind:"won"} }
  function hpPlan(L,d){
    const nD=(L.drives||[]).length; if(d._hp&&d._hp.L===L&&d._hp.n===nD)return d._hp;
    const g=L.g, EP=typeof hlEvPlan==="function"?hlEvPlan(L,d):{clips:[]}, di=(L.drives||[]).indexOf(d), pv=di>0?L.drives[di-1]:null, t0=d.seg*5;
    const r=mulberry32(strHash("hp|"+g.home+"|"+g.away+"|"+d.seg+"|"+d.sh+"|"+d.sa)), ri=n=>Math.floor(r()*n), cl=v=>Math.max(0.02,Math.min(0.98,v));
    const pois=lam=>{ const Lx=Math.exp(-lam); let k=0,p=1; do{ k++; p*=r() }while(p>Lx&&k<9); return k-1 };
    const dl=(sd,k)=>{ const a=d.T&&d.T[sd], b=pv&&pv.T&&pv.T[sd]; return a?Math.max(0,Math.round((a[k]||0)-(b?b[k]||0:0))):pois(0.7) };
    const N={}; ["home","away"].forEach(sd=>{ N[sd]={to:dl(sd,"to"),fe:dl(sd,"fe"),cy:dl(sd,"cy"),icing:pois(HP_RATE.icing),off:pois(HP_RATE.off),hit:pois(HP_RATE.hit)} });
    // the penalties: this stretch's at their minutes; a side is short for two minutes (one from the stretch before can run on)
    const pens=(d.ev||[]).filter(e=>e.k==="pen").map(e=>{ const w=hkPPWin(d,e); return {side:e.side==="home"?0:1,f:Math.max(0.02,(w[0]-t0-0.5)/5-0.012),e:e} });   // called just before the window opens
    const minAt=f=>Math.floor(t0+f*5+0.5), penAt=(s,f)=>hkShort(L,s?"away":"home",minAt(f)), OT=hkOT(d), shortAt=(s,f)=>OT?(penAt(s,f)?2:penAt(1-s,f)?1:2):penAt(s,f)?1:0;
    const pullAt=s=>{ const e=(d.ev||[]).find(q=>q.k==="pull"&&q.side===(s?"away":"home")); return e?Math.max(0,(e.m-t0)/5):2 };   // the goalie comes out for an extra man
    // the shifts: a line change every 45 seconds of play, the first unit its deployment share (the clips' rule)
    const shiftLines=(sd,k)=>{ const team=sd==="home"?g.home:g.away, dep=typeof deployOf==="function"?deployOf(SEA,team):{}, b=grp=>{ const q=dep[grp]||"bal"; return typeof DEPLOY!=="undefined"&&DEPLOY[grp]&&DEPLOY[grp].opts[q]?DEPLOY[grp].opts[q].b:0.3 };
      const h=strHash(team+"|"+d.seg+"|"+k); return {fL:((h%100)+0.5)/100<(1-b("f"))?0:1, dL:(((h>>>8)%100)+0.5)/100<(1-b("d"))?0:1} };
    const sixAt=(s,f)=>{ const sd=s?"away":"home", k=Math.floor(f*5*60/45), q=shiftLines(sd,k), pe=penAt(s,f); return hpSix(L,d,sd,q.fL,q.dL,pe?hkOffender(sd==="home"?g.home:g.away,pe):null) };
    // the anchors: each shot's move at its clip's minute (on the clip's own men), each penalty at its minute
    const anchors=[]; EP.clips.forEach(c=>{ const s=c.home?0:1, w0=c.W[0]; anchors.push({f:c.f,side:s,end:"clip",c:c,ea:w0[0],ey:w0[1],slot:c.rec[0]}) });
    pens.forEach(p=>{ let text=""; try{ text=hkEventText(g,p.e).text }catch(er){} anchors.push({f:Math.max(0.02,Math.min(0.97,p.f)),side:1-p.side,end:"pen",pen:p.side,e:p.e,text:text}) });
    anchors.sort((a,b)=>a.f-b.f);
    const fl=[]; [0,1].forEach(s=>{ const n=N[s?"away":"home"], o=N[s?"home":"away"];
      for(let k=0;k<o.to;k++)fl.push({side:s,end:"forced"});   // they forced a giveaway in our zone
      for(let k=0;k<o.fe;k++)fl.push({side:s,end:"killed"});   // they killed our entry
      for(let k=0;k<n.icing;k++)fl.push({side:s,end:"icing"});
      for(let k=0;k<n.off;k++)fl.push({side:s,end:"off"});
      const mine=fl.filter(m=>m.side===s), cyc=mine.filter(m=>m.end==="lost"||m.end==="off");
      let c=n.cy; for(let k=0;k<c;k++){ fl.push({side:s,end:r()<0.6?"lost":"icing",cy:1}) }
      const tgt=2; for(let k=fl.filter(m=>m.side===s).length+anchors.filter(a=>a.side===s).length;k<tgt;k++)fl.push({side:s,end:"lost"}) });
    // the hits: on a move of the side hit (it keeps the puck or loses it; a hit that loses it is the giveaway already counted)
    const hits=[[],[]]; [0,1].forEach(s=>{ for(let k=0;k<N[s?"away":"home"].hit;k++)hits[s].push(1) });
    for(let i=fl.length-1;i>0;i--){ const j=ri(i+1); [fl[i],fl[j]]=[fl[j],fl[i]] }
    const gaps=[]; let f0=0; anchors.forEach(a=>{ gaps.push({f0:f0,f1:a.f,a:a,m:[]}); f0=a.f }); gaps.push({f0:f0,f1:1,a:null,m:[]});
    const room=gaps.map(q=>Math.max(0.0001,q.f1-q.f0)), tot=room.reduce((s,x)=>s+x,0);
    fl.forEach(m=>{ let x=r()*tot, j=0; while(j<gaps.length-1&&x>room[j]){ x-=room[j]; j++ } gaps[j].m.push(m) });
    for(let j=0;j<gaps.length;j++){ const q=gaps[j], cap=Math.max(0,Math.floor(room[j]/0.03)-(q.a?1:0));
      while(q.m.length>cap){ const m=q.m.pop(); let k=-1; for(let z=1;z<gaps.length&&k<0;z++){ for(const jj of [j+z,j-z]){ if(jj>=0&&jj<gaps.length&&gaps[jj].m.length<Math.max(0,Math.floor(room[jj]/0.03)-(gaps[jj].a?1:0))){ k=jj; break } } } if(k<0){ q.m.push(m); break } gaps[k].m.push(m) } }
    // the start: a faceoff at centre to open each period, else where the stretch before left it
    let ball=d.seg%4===0?{side:null,kind:"faceoff",zone:"centre",x:0.5,y:0.5}:null;
    if(!ball){ let q=null; try{ q=pv&&pv.seg===d.seg-1?hpPlan(L,pv).last:null }catch(e){} ball=q?Object.assign({},q):{side:r()<0.5?0:1,kind:"won",x:0.5,y:0.5} }
    // a faceoff's winner from the stretch's hash
    const settle=b=>{ if(b.side==null){ b.side=r()<0.5?0:1; b.fo=1 } return b };
    const seqs=gaps.map(q=>({q,seq:[]}));
    let side=null; { const b=Object.assign({},ball); settle(b); ball=b; side=b.side }
    seqs.forEach(G=>{ const pool=G.q.m.slice();
      const after=m=>{ const a=hpAfter(m); return a.side==null?(r()<0.5?0:1):a.side };
      while(pool.length){ let j=pool.findIndex(m=>m.side===side); if(j<0){ j=0; G.seq.push({side:side,end:"lost"}); side=1-side } const m=pool.splice(j,1)[0]; G.seq.push(m); m.next=after(m); side=m.next }
      if(G.q.a){ if(G.q.a.side!==side){ if(G.q.f1-G.q.f0<0.03*(G.seq.length+2))G.q.a.steal=1; else G.seq.push({side:side,end:"lost",next:1-side}); side=1-side } G.seq.push(G.q.a); G.q.a.next=after(G.q.a); side=G.q.a.next }   // no room for a move of theirs: a takeaway on the spot
      G.seq.forEach(m=>{ if(m.next==null)m.next=1-m.side; m.nT=m.end==="clip"?2+ri(2):2+(r()<0.4?1:0)+(m.cy?2:0) }) });
    const moves=[];
    const toRink=(s,a,y)=>s===0?[1-a,1-y]:[a,y];   // the home side attacks left
    const fromRink=(s,x,y)=>s===0?[1-x,1-y]:[x,y];
    const push=(m,fA,fB)=>{ const s=m.side, short=shortAt(s,fA); if(ball.side!==s){ ball.side=s; ball.by=null; if(!ball.fo)ball.kind="won" } const [sa,sy]=fromRink(s,ball.x,ball.y);
      let sp; if(m.end==="clip")sp=[m.ea,m.ey];
      else if(m.end==="forced")sp=[0.12+r()*0.16,r()<0.5?0.12:0.88];   // lost behind or along our own boards
      else if(m.end==="killed")sp=[0.6+r()*0.06,0.25+r()*0.5];          // stood up at their blue line
      else if(m.end==="icing")sp=[0.3+r()*0.1,0.3+r()*0.4];
      else if(m.end==="off")sp=[0.67,0.3+r()*0.4];
      else if(m.end==="pen")sp=[0.3+r()*0.5,0.2+r()*0.6];
      else sp=m.cy?[0.9,r()<0.5?0.15:0.85]:[0.35+r()*0.45,0.15+r()*0.7];
      const pts=[{x:sa,y:sy,k:ball.fo?"faceoff":ball.kind==="won"?"won":"carry"}];
      const mid=m.nT-1; let cur=[sa,sy];
      if(m.cy){ const sd=sp[1]<0.5?0.12:0.88; pts.push({x:0.94,y:sd,k:"cycle"}); pts.push({x:0.95,y:sd<0.5?0.3:0.7,k:"cycle"}); cur=[0.95,sd<0.5?0.3:0.7] }
      for(let k=pts.length;k<mid;k++){ const t=(k-pts.length+1)/(mid-pts.length+1); pts.push({x:cl(hlLerp(cur[0],sp[0],t)+(r()-0.5)*0.06),y:cl(hlLerp(cur[1],sp[1],t)+(r()-0.5)*0.3),k:"pass"}) }
      if(m.end==="icing"){ pts.push({x:sp[0],y:sp[1],k:"ice"}); sp=[0.97,0.5+(r()-0.5)*0.6] }
      pts.push({x:sp[0],y:sp[1],k:"end"});
      const T=pts.map((p,k)=>{ const [x,y]=toRink(s,p.x,p.y); return {x,y,a:p.x,ay:p.y,f:hlLerp(fA,fB,k/(pts.length-1)),k:p.k} });
      const six=m.end==="clip"?{an:m.c.an,clip:1}:sixAt(s,fA), oSix=m.end==="clip"?{an:m.c.dn,clip:1}:sixAt(1-s,fA);
      T.forEach((t,k)=>{ if(k===0&&ball.by!=null&&!hpOut(shortAt(s,t.f)).has(ball.by)){ t.s=ball.by; return } const S=hpShape(t.a,t.ay).A; t.s=k===T.length-1&&m.slot!=null?m.slot:hpNear(S,t.a,t.ay,k>0?T[k-1].s:-1,shortAt(s,t.f)) });
      const e=T[T.length-1]; if(m.end==="forced"||m.end==="killed"||m.end==="lost"||m.end==="pen"){ const S=hpShape(e.a,e.ay).D; m.by=hpNear(S,e.a,e.ay,-1,shortAt(1-s,e.f)) }
      if(m.end==="pen"){ const o=hkOffender(m.pen?g.away:g.home,m.e), j=oSix.idx?oSix.idx.indexOf(o):-1; if(j>0)m.by=j }
      // a hit on our man along the way
      if(hits[s].length&&T.length>2&&m.end!=="clip"){ hits[s].pop(); const k=1+ri(T.length-2), S=hpShape(T[k].a,T[k].ay).D; T[k].hit=hpNear(S,T[k].a,T[k].ay,-1,shortAt(1-s,T[k].f)) }
      /* round 111: in real time a leg of five or six seconds left the man on the puck crawling; the puck moves on every three
         seconds or so (passes in between, on their own dice so the counted events don't move) */
      if(HP2()&&evPB.rt){ const rf=mulberry32(strHash("hpf|"+g.home+"|"+d.seg+"|"+fA)>>>0);
        for(let k=T.length-2;k>=0;k--){ const A=T[k], B=T[k+1]; if(A.k==="ice"||B.k==="ice"||A.k==="faceoff")continue; const Ls=(B.f-A.f)*300, n=Math.min(3,Math.floor(Ls/3.2)); if(n<1)continue;
          const add=[]; for(let j=1;j<=n;j++){ const t=j/(n+1), a=cl(hlLerp(A.a,B.a,t)+(rf()-0.5)*0.08), ay=cl(hlLerp(A.ay,B.ay,t)+(rf()-0.5)*0.36); add.push({a,ay,f:hlLerp(A.f,B.f,t),k:"pass"}) }
          let prv=A.s; add.forEach(q=>{ const [x,y]=toRink(s,q.a,q.ay); q.x=x; q.y=y; q.s=hpNear(hpShape(q.a,q.ay).A,q.a,q.ay,prv,shortAt(s,q.f)); prv=q.s });
          T.splice(k+1,0,...add) } }
      moves.push({side:s,end:m.end,m:m,T:T,f0:fA,f1:fB,six,oSix,short,oShort:shortAt(1-s,fA)});
      const nx=hpAfter(m); ball={side:m.next,kind:nx.kind,x:e.x,y:e.y,by:nx.kind==="won"?m.by:null,fo:nx.kind==="faceoff"?1:0};
      if(nx.kind==="faceoff"){ if(nx.zone==="centre"){ ball.x=0.5; ball.y=0.5 } else if(nx.zone==="n"){ const [x,y]=toRink(s,0.61,e.ay<0.5?0.24:0.76); ball.x=x; ball.y=y } else { const df=nx.def, [x,y]=toRink(df,0.19,e.ay<0.5?0.24:0.76); ball.x=x; ball.y=y } }
      if(m.end==="clip"&&nx.kind==="won"){ const [x,y]=toRink(1-s,0.12,0.5); ball.x=x; ball.y=y } };
    seqs.forEach(G=>{ const q=G.q, n=G.seq.length; if(!n)return; const W2=G.seq.reduce((t,m)=>t+m.nT,0); let at=q.f0;
      G.seq.forEach((m,k)=>{ const fB=k===n-1?q.f1:at+(q.f1-q.f0)*m.nT/W2; push(m,at,fB); at=fB }) });
    const out={L:L,n:nD,moves,N,pens,shortAt,pullAt,last:Object.assign({},ball,{fo:0})};
    Object.defineProperty(d,"_hp",{value:out,writable:true,configurable:true,enumerable:false});
    return out }
  function hpCounts(L,d){ const P=hpPlan(L,d), o=[{to:0,fe:0,cy:0,icing:0,off:0,hit:0,pen:0},{to:0,fe:0,cy:0,icing:0,off:0,hit:0,pen:0}];
    P.moves.forEach(m=>{ const s=m.side; if(m.end==="forced")o[1-s].to++; if(m.end==="killed")o[1-s].fe++; if(m.m.cy)o[s].cy++; if(m.end==="icing")o[s].icing++; if(m.end==="off")o[s].off++; if(m.end==="pen")o[m.m.pen].pen++;
      m.T.forEach(t=>{ if(t.hit!=null)o[1-s].hit++ }) });
    return o }
  // round 104: the game's numbers so far, as the screen has shown them (shots on goal the engine's; power plays, the
  // penalties drawn and the goals scored on them; hits as shown)
  function hpTally(L,upto,d,f){ if(!(upto>=0))upto=(L.drives||[]).length;   /* round 107: a stretch still being played (a partial, not yet among the drives) counts every stretch before it: it read 0-0 for that stretch (measured, 37 times in two soccer matches) */
    const o=[{sog:0,pp:0,ppg:0,pim:0,hit:0},{sog:0,pp:0,ppg:0,pim:0,hit:0}], D=(L.drives||[]).filter(x=>x&&typeof x.seg==="number"&&x.seg<SEGS);
    let last=null; D.forEach(x=>{ const di=L.drives.indexOf(x); if(di>=upto)return; last=x;
      (x.ev||[]).forEach(e=>{ const s=e.side==="home"?0:1; if(e.k==="pen"){ o[s].pim+=2; o[1-s].pp++ } if(e.k==="goal"&&e.pp)o[s].ppg++ });
      let c=null; try{ c=hpCounts(L,x) }catch(e){} if(c)[0,1].forEach(s=>o[s].hit+=c[s].hit) });
    if(last&&last.sog){ o[0].sog=last.sog[0]; o[1].sog=last.sog[1] }
    if(d&&f!=null){ let PP=null; try{ PP=hpPlan(L,d) }catch(e){} (PP?PP.pens:[]).forEach(p=>{ if(p.f>f)return; o[p.side].pim+=2; o[1-p.side].pp++ });   // the penalty as the play calls it
      const EP=d._ev; if(EP)EP.clips.forEach(c=>{ if(c.f>=f)return; const s=c.home?0:1; o[s].sog++; if(c.kind==="goal"&&c.pp)o[s].ppg++ });
      let P=null; try{ P=hpPlan(L,d) }catch(e){} if(P)P.moves.forEach(m=>m.T.forEach(t=>{ if(t.hit!=null&&t.f<=f)o[1-m.side].hit++ })) }
    return {o} }
  function hpTallyHTML(T){ const o=T.o, row=(l,a,b)=>`<span class="sct"><b>${a}</b><i>${l}</i><b>${b}</b></span>`;
    return row("Shots",o[1].sog,o[0].sog)+row("Power play",o[1].ppg+"/"+o[1].pp,o[0].ppg+"/"+o[0].pp)+row("PIM",o[1].pim,o[0].pim)+row("Hits",o[1].hit,o[0].hit) }   // the away side on the left, as hockey's scoreboard has it
  function hpText(P,mv,k){ const S=mv.six, O=mv.oSix, t=mv.T[k], a=hpWho(S,t.s), nx=mv.T[k+1], b=nx?hpWho(S,nx.s):"";
    if(k===mv.T.length-1){ const by=mv.m.by!=null?hpWho(O,mv.m.by):"";
      if(mv.end==="clip")return ""; if(mv.end==="forced")return `${by} forces a giveaway from ${a}`; if(mv.end==="killed")return `${by} stands up ${a} at the line`;
      if(mv.end==="icing")return `Icing`; if(mv.end==="off")return `${a} is offside`; if(mv.end==="pen")return mv.m.text||`Penalty: ${by}, two minutes`;
      return `${by} picks it off ${a}` }
    if(t.hit!=null)return `Big hit on ${a} by ${hpWho(O,t.hit)}`;
    if(t.k==="faceoff")return `${a} wins the faceoff`; if(t.k==="cycle")return `${a} cycles it low`; if(t.k==="ice")return `${a} fires it down the ice`;
    if(t.k==="won")return `${a} has it`; return `${a} to ${b}` }
  // round 108 (engine 22): the rink moves like hockey (sc-motion's rules): a longer, even lag behind the puck, the man
  // it goes to skating onto it, and nobody faster than his legs frame to frame (metres a stretch; the rink 60 by 26)
  const HP2=()=>typeof ENGINE_V==="undefined"||ENGINE_V>=22, HP_VMAX=1500;   // 7% of man-frames held back, 0.53 m on average (test/sc-motion.js hockey)
  /* round 111 (Ian: "jankiness in the moment of players ... The timing also feels off"): as soccer's, the puck at a
     pass's real speed and the man it reaches skating it on toward his next pass in the time left, the shapes following
     it as it really moves (each touch eased the play to a stop); in game time, a stretch's minutes */
  const HP_V=15, HP_SKATE=6.5, HP_VRUN=8;
  function hpMsF(d){ return evPB.span(d)*60000 }
  function hpDist(a,b){ return Math.hypot((b.a-a.a)*60,(b.ay-a.ay)*26) }
  function hpTravel(a,b,segMs){ return Math.max(120,Math.min(0.8*segMs,hpDist(a,b)/(a.k==="ice"?22:HP_V)*1000+100)) }
  function hpCarry(T,i,msF){ if(i<=0||i>=T.length-1)return {a:T[i].a,ay:T[i].ay}; const P=T[i], N=T[i+1], A=T[i-1], dd=hpDist(P,N); if(dd<1)return {a:P.a,ay:P.ay};
    const rem=Math.max(0,(P.f-A.f)*msF-hpTravel(A,P,(P.f-A.f)*msF)), cd=Math.min(0.5*dd,HP_SKATE*rem/1000*0.8), w=cd/dd; return {a:hlLerp(P.a,N.a,w),ay:hlLerp(P.ay,N.ay,w)} }
  function hpPuck(T,k,f,msF){ const a=T[k], b=T[Math.min(T.length-1,k+1)], segMs=Math.max(1,(b.f-a.f)*msF), u=b.f>a.f?Math.max(0,Math.min(1,(f-a.f)/(b.f-a.f))):1;
    const A=hpCarry(T,k,msF);
    // the move's last leg: the man on the puck skates it in to where the move ends (a pass there left the puck lying still till the next move)
    if(b!==a&&k+1===T.length-1&&b.k==="end"&&a.k!=="ice"){ const C={a:hlLerp(A.a,b.a,0.4),ay:hlLerp(A.ay,b.ay,0.4)}, tf=hpTravel({a:A.a,ay:A.ay,k:a.k},C,segMs)/segMs;
      if(u<tf){ const q=u/tf, e=1-Math.pow(1-q,1.4); return {a:hlLerp(A.a,C.a,e),ay:hlLerp(A.ay,C.ay,e),tr:q,A,rcv:C} }
      const y=(u-tf)/Math.max(1e-6,1-tf); return {a:hlLerp(C.a,b.a,y),ay:hlLerp(C.ay,b.ay,y),tr:1,A,rcv:C} }
    const tf=b===a?1:hpTravel({a:A.a,ay:A.ay,k:a.k},b,segMs)/segMs;
    if(u<tf){ const q=u/tf, e=1-Math.pow(1-q,1.4); return {a:hlLerp(A.a,b.a,e),ay:hlLerp(A.ay,b.ay,e),tr:q,A} }
    const R=k+1<=T.length-1?hpCarry(T,k+1,msF):{a:b.a,ay:b.ay}, y=Math.pow((u-tf)/Math.max(1e-6,1-tf),1.2); return {a:hlLerp(b.a,R.a,y),ay:hlLerp(b.ay,R.ay,y),tr:1,A} }
  function hpDraw(x,W,H,d,f){
    const L=live, P=hpPlan(L,d); let mv=P.moves.find(m=>f>=m.f0&&f<=m.f1)||P.moves.filter(m=>m.f0<=f).pop()||P.moves[0]; if(!mv){ ambient(x,W,H); return }
    const T=mv.T; let k=0; while(k<T.length-2&&f>T[k+1].f)k++;
    const a=T[k], b=T[Math.min(T.length-1,k+1)], u=b.f>a.f?Math.max(0,Math.min(1,(f-a.f)/(b.f-a.f))):1, rt=HP2()&&evPB.rt, msF=hpMsF(d), PK=rt?hpPuck(T,k,f,msF):null;
    const tr=rt?PK.tr:Math.min(1,u/0.6), e=a.k==="ice"?tr:hlEase(tr), pa=rt?PK.a:hlLerp(a.a,b.a,e), py=rt?PK.ay:hlLerp(a.ay,b.ay,e);
    const s=mv.side, toS=(X,Y)=>[W*PADX+X*W*(1-2*PADX), H*PADY+Y*H*(1-2*PADY)], toR=(sd,aa,yy)=>sd===0?[1-aa,1-yy]:[aa,yy];
    // the shapes a moment behind the puck
    const shapeAt=fq=>{ const mm=P.moves.find(q=>fq>=q.f0&&fq<=q.f1)||mv, TT=mm.T; let kk=0; while(kk<TT.length-2&&fq>TT[kk+1].f)kk++;
      if(rt){ const q=hpPuck(TT,kk,fq,msF), sh=hpShape(q.a,q.ay); return {s:mm.side,A:sh.A.map(p=>toR(mm.side,p[0],p[1])),D:sh.D.map(p=>toR(mm.side,p[0],p[1]))} }
      const A=TT[kk], B=TT[Math.min(TT.length-1,kk+1)], uu=B.f>A.f?Math.max(0,Math.min(1,(fq-A.f)/(B.f-A.f))):1, tt=hlEase(Math.min(1,uu/0.6));
      const sh=hpShape(hlLerp(A.a,B.a,tt),hlLerp(A.ay,B.ay,tt)); return {s:mm.side,A:sh.A.map(p=>toR(mm.side,p[0],p[1])),D:sh.D.map(p=>toR(mm.side,p[0],p[1]))} };
    const acc=[[],[]]; (rt?[0,1,2,3,4,5,6,7,8,9].map(q=>q*80/msF):HP2()?[0,0.0025,0.005,0.0075,0.01,0.0125,0.015,0.0175,0.02,0.0225]:[0,0.005,0.01,0.015]).forEach((dt,q)=>{ const w=HP2()?1:4-q, S=shapeAt(Math.max(0,f-dt)); [[S.s,S.A],[1-S.s,S.D]].forEach(([si,arr])=>arr.forEach((p,i)=>{ if(!acc[si][i])acc[si][i]=[0,0,0]; acc[si][i][0]+=p[0]*w; acc[si][i][1]+=p[1]*w; acc[si][i][2]+=w })) });
    let pos=[0,1].map(si=>acc[si].map(o=>[o[0]/o[2],o[1]/o[2]]));
    // round 111: skaters never stand still: each loops round his spot on the game's clock (about 2 m/s; a frozen frame is still)
    if(rt){ const gs=(d.seg*5+f*5)*60; pos=pos.map((A,si)=>A.map((q,i)=>i===0?q:[q[0]+Math.sin(gs*0.75+i*2.1+si*1.3)*0.04,q[1]+Math.sin(gs*1.1+i*1.7+si*0.7)*0.075])) }
    const [bx,by]=toR(s,pa,py);
    // a faceoff: both lines set at the dot, centres over the puck, wings on the hash marks, the D behind, until it's won
    if(k===0&&a.k==="faceoff"&&u<0.45){ const w=1-hlEase(u/0.45), a0=a.a, y0=a.ay, o=1-s;
      const FA=[null,[a0-0.13,y0-0.12],[a0-0.13,y0+0.12],[a0-0.014,y0],[a0-0.025,y0-0.09],[a0-0.025,y0+0.09]], FD=[null,[a0+0.13,y0-0.12],[a0+0.13,y0+0.12],[a0+0.014,y0],[a0+0.025,y0-0.09],[a0+0.025,y0+0.09]];
      for(let i=1;i<6;i++){ const pA=toR(s,FA[i][0],FA[i][1]), pD=toR(s,FD[i][0],FD[i][1]); pos[s][i]=[hlLerp(pos[s][i][0],pA[0],w),hlLerp(pos[s][i][1],pA[1],w)]; pos[o][i]=[hlLerp(pos[o][i][0],pD[0],w),hlLerp(pos[o][i][1],pD[1],w)] } }
    if(rt){ if(tr<1){ const [ax,ay]=toR(s,PK.A.a,PK.A.ay); pos[s][a.s]=[hlLerp(pos[s][a.s][0],ax,0.85*(1-tr)),hlLerp(pos[s][a.s][1],ay,0.85*(1-tr))] }
      const R0=PK.rcv||b, [tx,ty]=tr<1?toR(s,R0.a,R0.ay):[bx,by], wb=tr<1?0.95*hlEase(tr):1; pos[s][b.s]=[hlLerp(pos[s][b.s][0],tx,wb),hlLerp(pos[s][b.s][1],ty,wb)] }
    else { if(tr<1){ const [ax,ay]=toR(s,a.a,a.ay); pos[s][a.s]=[hlLerp(pos[s][a.s][0],ax,0.85*(1-tr)),hlLerp(pos[s][a.s][1],ay,0.85*(1-tr))] }
    { const [tx,ty]=toR(s,b.a,b.ay), wb=HP2()?0.95*hlEase(tr):0.4+0.55*tr; pos[s][b.s]=[hlLerp(pos[s][b.s][0],tx,wb),hlLerp(pos[s][b.s][1],ty,wb)] } }
    if(b.hit!=null&&tr>0.6){ const o=1-s; pos[o][b.hit]=[hlLerp(pos[o][b.hit][0],bx,0.8),hlLerp(pos[o][b.hit][1],by,0.8)] }
    if(k===T.length-2&&mv.m.by!=null&&tr>0.5){ const o=1-s; pos[o][mv.m.by]=[hlLerp(pos[o][mv.m.by][0],bx,(tr-0.5)*1.6),hlLerp(pos[o][mv.m.by][1],by,(tr-0.5)*1.6)] }
    if(HP2()){ const Q=hpDraw.st, di=(L.drives||[]).indexOf(d); let df=-1;
      if(Q&&Q.d===d&&f>=Q.f)df=f-Q.f; else if(Q&&Q.di===di-1&&Q.f>0.97&&f<0.03&&d.seg%4!==0)df=f+1-Q.f;
      let nCl=0, lagM=0; if(df>=0&&df<0.02){ const lim=rt?HP_VRUN*df*msF/1000:HP_VMAX*df; pos=pos.map((A,si)=>A.map((q,i)=>{ const o=Q.pos[si][i], dx=(q[0]-o[0])*60, dy=(q[1]-o[1])*26, m=Math.hypot(dx,dy), L2=lim*(si===s&&(i===b.s||i===a.s)?(rt?1.4:2.2):1)*(i===0?0.6:1);
        if(m>L2&&m>0){ nCl++; lagM+=m-L2; return [o[0]+dx*L2/m/60,o[1]+dy*L2/m/26] } return q })) }
      pos=pos.map(A=>A.map(q=>[Math.max(0.01,Math.min(0.99,q[0])),Math.max(0.02,Math.min(0.98,q[1]))]));
      hpDraw.st={d,di,f,at:Date.now(),pos:pos.map(A=>A.map(q=>q.slice()))}; hpDraw.cl={nCl,lagM} }
    hpDraw.pos=pos; hpDraw.dbg={s,as:a.s,bs:b.s,u,bx,by,cl:hpDraw.cl,k,nT:T.length,tr,fo:a.k,bk:b.k,same:a===b};
    const g=L.g, kits=hlKits(g.home,g.away), inks=kits.map(k=>k.fill), gks=hlFar(["#111318","#E8F56B","#C9A0FF","#FF9F43"],inks), r=Math.max(5,W/80);
    const [qx,qy]=toS(bx,by);
    [0,1].forEach(si=>{ const S=si===s?mv.six:mv.oSix, short=si===s?P.shortAt(s,f):P.shortAt(si,f);
      pos[si].forEach((p,i)=>{ if(hpOut(short).has(i)||i===0&&f>=P.pullAt(si))return; const [px,py]=toS(p[0],p[1]), on=si===s&&(i===b.s&&tr>=1||i===a.s&&tr<1);
        hlDot(x,px,py,r,i?inks[si]:gks[si],"rgba(0,0,0,.6)","",Object.assign(S&&S.an&&S.an[i]?{num:S.an[i][0],sub:S.an[i][1]}:{},on?{hot:true}:{})) }) });
    hlBall(x,qx,qy,r*0.5,0,null,{kind:"puck"});
    const Hd=live.hold, hs=Hd?Hd.h:live.eng.h, as=Hd?Hd.a:live.eng.a;
    hlBug(x,W,H,{home:g.home,away:g.away,hs:hs,as:as,hk:kits[0],ak:kits[1],clock:(Hd&&Hd.clock)||evPB.clock(d,f)});
    let txt=hpText(P,mv,k===T.length-2&&u>0.6?T.length-1:k); const sh0=P.shortAt(0,f), sh1=P.shortAt(1,f);
    if(sh0||sh1)txt=(txt?txt+" · ":"")+"Power play, "+(sh0?g.away:g.home);
    if(txt)hlTicker(x,W,H,txt.charAt(0).toUpperCase()+txt.slice(1),8+Math.max(10,Math.round(W/44))*1.7+6);
    // round 111 (Ian: a play by play in every sport, synced): each move's end as it is shown, by name
    if(typeof hlFeedTick==="function")hlFeedTick(()=>{ const out=[]; P.moves.forEach((m2,i)=>{ const z=m2.T[m2.T.length-1]; if(z.f>f||m2.end==="clip")return; const tx=hpText(P,m2,m2.T.length-1); if(!tx)return;
      const sd=m2.end==="pen"?m2.m.pen:m2.end==="icing"||m2.end==="off"?m2.side:1-m2.side; out.push({k:d.seg+"|h"+i,m:evPB.clock(d,z.f),team:sd?g.away:g.home,text:tx.charAt(0).toUpperCase()+tx.slice(1),big:m2.end==="pen"?"pen":null}) }); return out });
    if(mv.end==="pen"&&k===T.length-2&&u>0.7)hlBanner(x,W,H,"PENALTY",{fill:"#F2C14E"},(u-0.7)/0.3);
    // round 108: the bench changes how it plays (the computer pushing in the third or locking it down, your call)
    else if(HP2()&&f<0.16&&d.md){ const di=(L.drives||[]).indexOf(d), pv=di>0?L.drives[di-1]:null;
      if(pv&&pv.md&&pv.seg===d.seg-1)for(let si=0;si<2;si++){ const sd=si?"away":"home", a0=pv.md[sd], b0=d.md[sd], SAY={push:"%s PINCH THE D AND PUSH",sit:"%s LOCK IT DOWN",safe:"%s OPEN IT UP",aggressive:"%s CLOG THE MIDDLE"};
        if(a0!==b0&&SAY[b0]){ hlBanner(x,W,H,SAY[b0].replace("%s",String(si?g.away:g.home).toUpperCase()),kits[si],Math.min(1,f/0.04)*(f>0.13?(0.16-f)/0.03:1)); break } } }
    if(Date.now()-(hpDraw.t||0)>500){ hpDraw.t=Date.now(); try{ const els=document.querySelectorAll(".scstats"); if(els.length){ const di=(L.drives||[]).indexOf(d), h=hpTallyHTML(hpTally(L,di,d,f)); els.forEach(el=>el.innerHTML=h) } }catch(e){} }
  }
  /* round 101: the full match on a running clock (core hlEvPlan): five minutes a stretch, about twelve seconds of play */
  const evPB={mode:"pb", rt:true, t0:d=>d.seg*5, span:d=>5, ms:d=>28000, clock:(d,f)=>{   /* round 104: twenty-eight seconds of play between the shots a stretch at Normal (was twelve): room for the touches */ const m=Math.min(60,Math.max(1,Math.floor(d.seg*5+f*5)+1)); return (m<=20?"1st":m<=40?"2nd":"3rd")+" \u00b7 "+m+"'" }, skip:d=>d.seg>=SEGS};
  function frame(x,W,H,c,t){
    const n=c.W.length, tb=0.72, ts=0.86;
    let bx,by;
    if(t<tb){ const f=t/tb*(n-1); const k=Math.min(n-2,Math.floor(f)), s=hlEase(f-k), a=c.W[k], b=c.W[k+1]; bx=hlLerp(a[0],b[0],s); by=hlLerp(a[1],b[1],s) }
    else if(t<ts){ const s=(t-tb)/(ts-tb), a=c.W[n-1]; bx=hlLerp(a[0],c.end[0],s); by=hlLerp(a[1],c.end[1],s) }
    else{ bx=c.end[0]; by=c.end[1] }
    const prog=Math.min(1,t/tb);
    const att=ATT.map((p,i)=>{ if(i===0)return c.en?[0.5,0.5]:[0.08,0.5]; let a=hlLerp(p[0]-0.25,p[0],prog), y=p[1]+(by-0.5)*0.15;
      /* round 79: a man who takes the puck twice goes to each spot in turn (it found his first only, and the pass went to
         empty ice: Ian, "invisible passers") */ let j=-1, near=0; c.rec.forEach((ri,q)=>{ if(ri!==i)return; const v=t<tb?Math.max(0,1-Math.abs(t/tb*(n-1)-q)):q===n-1?1:0; if(j<0||v>near){ j=q; near=v } }); if(j>=0){ const w=c.W[j]; a=hlLerp(a,w[0],hlEase(Math.min(1,near*1.4))); y=hlLerp(y,w[1],hlEase(Math.min(1,near*1.4))) }
      if(i===c.rec[n-1]&&t>=tb){ a=c.W[n-1][0]; y=c.W[n-1][1] }
      return [a,y] });
    const def=DEF.map((p,i)=>{ if(i===0){ if(c.en)return null; let y=0.5+(by-0.5)*0.3; if(t>=tb&&c.kind!=="goal")y=hlLerp(y,c.end[1],hlEase((t-tb)/(ts-tb))); return [GOAL-0.015,Math.max(0.45,Math.min(0.55,y))] }
      if(c.nD!=null?hpOut(c.nD).has(i):(c.pp||c.shortD)&&i===5)return null;   // a man short (overtime: two)
      return [hlLerp(p[0]-0.1,p[0],prog),p[1]+(by-0.5)*0.25] });
    // round 104: in the full match the shot's move grows out of the play before it (each man from where it had him)
    // round 108: from where the rink last drew them, when it just did, and back to it after (sc-clipjoin's rules)
    const sA=c.home?0:1, flip=q=>q?(c.home?[1-q[0],1-q[1]]:[q[0],q[1]]):q;
    if(HP2()&&c.pbFrom&&t<0.05&&!c._from&&!c.so){ const Q=hpDraw.st; if(Q&&Date.now()-Q.at<800&&Math.abs(Q.f-c.f)<0.06)Object.defineProperty(c,"_from",{value:{A:Q.pos[sA].map(flip),D:Q.pos[1-sA].map(flip)},writable:true,configurable:true,enumerable:false}) }
    if(c.pbFrom&&t<0.16&&!c.so){ const w=1-hlEase(t/0.16), S=HP2()&&c._from?c._from:hpShape(c.W[0][0],c.W[0][1]);
      att.forEach((p,i)=>{ if(p&&S.A[i])att[i]=[hlLerp(p[0],S.A[i][0],w),hlLerp(p[1],S.A[i][1],w)] }); def.forEach((p,i)=>{ if(p&&S.D[i])def[i]=[hlLerp(p[0],S.D[i][0],w),hlLerp(p[1],S.D[i][1],w)] }) }
    let nr=[]; def.forEach((p,i)=>{ if(p&&i)nr.push([Math.hypot(p[0]-bx,p[1]-by),i]) }); nr.sort((a,b)=>a[0]-b[0]);
    nr.slice(0,1).forEach(([d,i])=>{ const p=def[i]; def[i]=[hlLerp(p[0],bx,0.5),hlLerp(p[1],by,0.5)] });
    frame.dbg={att,def,home:c.home};
    if(HP2()&&c.pbFrom&&!c.so&&hpDraw.st&&typeof live!=="undefined"&&live&&live.pb&&live.pb.d===hpDraw.st.d){ const Q=hpDraw.st;
      att.forEach((p,i)=>{ if(p)Q.pos[sA][i]=flip(p) }); def.forEach((p,i)=>{ if(p)Q.pos[1-sA][i]=flip(p) }); Q.f=Math.max(Q.f,c.f); Q.at=Date.now() }
    const r=Math.max(5,W/80), ink=c.inks[c.home?0:1], dink=c.inks[c.home?1:0];
    def.forEach((p,i)=>{ if(!p||c.so&&i)return; const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,i?dink:c.gk[1],"rgba(0,0,0,.6)","",c.dn&&c.dn[i]?{num:c.dn[i][0],sub:c.dn[i][1]}:null) });
    att.forEach((p,i)=>{ if(i===0&&c.en||c.so&&i!==c.rec[n-1]||(c.nA!=null?hpOut(c.nA).has(i):c.shortA&&i===5))return; const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,i?ink:c.gk[0],"rgba(0,0,0,.6)",i===c.rec[n-1]&&t>=ts?c.nm:"",c.an&&c.an[i]?{num:c.an[i][0],sub:c.an[i][1]}:null) });
    const [qx,qy]=P(W,H,c,bx,by);
    const pos=tt=>{ tt=Math.max(0,tt); if(tt<tb){ const f=tt/tb*(n-1), k=Math.min(n-2,Math.floor(f)), s=hlEase(f-k), a=c.W[k], b=c.W[k+1]; return P(W,H,c,hlLerp(a[0],b[0],s),hlLerp(a[1],b[1],s)) }
      if(tt<ts){ const s=(tt-tb)/(ts-tb), a=c.W[n-1]; return P(W,H,c,hlLerp(a[0],c.end[0],s),hlLerp(a[1],c.end[1],s)) } return P(W,H,c,c.end[0],c.end[1]) };
    const tr=[]; for(let q=8;q>=1;q--)tr.push(pos(t-q*0.012));
    hlBall(x,qx,qy,r*0.55,0,t>0.1?tr:null,{kind:"puck"});
    const top=c.so?"Shoot-out":`${c.m}'${c.pp?" power play":""}`;   // round 66: whose chance it is waits for the outcome
    const end=t>=ts?(c.so?`${c.nm} wins the shoot-out!`:c.kind==="goal"?(c.en&&(c.gno||1)<3?`EMPTY NET! ${c.nm}`:hlGoalWord(c.gno||1,c.nm)):"Saved!"):null;
    hlCaption(x,W,H,t>=ts&&c.text?`${c.m}' ${c.text}`:top,end,c.kind==="goal"?ink:null);
  }
  // round 72: the header's clock while a clip plays, in its words: the period and the game minute
  const headClock=c=>c?(c.so?"Shootout":c.m!=null?(c.m<20?"1st":c.m<40?"2nd":c.m<60?"3rd":"OT")+" \u00b7 "+c.m+"'":null):null;
  /* round 111: live player stats from the log, as far as the screen has shown: goals and shots */
  const lsOut=(rows,key,line)=>{ const T={}; Object.values(rows).forEach(r=>{ (T[r.tm]=T[r.tm]||[]).push(r) }); Object.keys(T).forEach(tm=>{ T[tm]=T[tm].sort(key).map(r=>({nm:r.nm,line:line(r)})).filter(r=>r.line) }); return T };
  function liveStats(L){ const rows={}, sur=n=>n?String(n).split(" ").slice(-1)[0]:"?";
    const one=(d,fl)=>{ if(!d||typeof d.seg!=="number"||d.so)return; let E=null; try{ E=hlEvPlan(L,d) }catch(e){ return } (E.clips||[]).forEach(c=>{ if(c.f>=fl||!c.who||!c.tm||c.kind==="red"||c.so)return; const key=c.tm+"|"+c.who, r=rows[key]=rows[key]||{tm:c.tm,nm:sur(c.who),g:0,s:0}; r.s++; if(c.kind==="goal")r.g++ }) };
    (typeof liveShown==="function"?liveShown():L.drives).forEach(d=>one(d,9));
    const P=L.pb; if(P&&P.d&&!L.done)one(P.d,hlEvCurF(P.d));
    return lsOut(rows,(a,b)=>b.g-a.g||b.s-a.s,r=>`${r.g?(r.g>1?r.g+" goals, ":"goal, "):""}${r.s} shot${r.s>1?"s":""}`) }
  return {liveStats, feedClips:true, frameDbg:()=>frame.dbg||null, drawPos:()=>hpDraw.pos||null, drawDbg:()=>hpDraw.dbg||null, allLabel:"Goals and saves", fullLabel:"Full game", reveal:0.86, ambient:true, fullMs:10000, aspect:0.5, clips, pitch, idle, frame, headClock, evPB, amb:(x,W,H,d,f)=>d&&f!=null&&typeof d.seg==="number"&&d.seg<SEGS?hpDraw(x,W,H,d,f):ambient(x,W,H), playback:(L,d)=>hlEvPlayback(L,d), hpPlan, hpCounts, hpTally, hpTallyHTML, hkShort, hkOffender};
})();
