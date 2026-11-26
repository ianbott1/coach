/* Baseball's highlights (round 52, core 97_highlights): the home runs, and in "key" mode the inning's biggest hit when
   it scores runs in a close game, drawn on a diamond: the pitch, the swing, the ball's flight to where it lands, the
   runners coming round. The man the commentary names hits it. Shown only while a clip plays (the line score is the
   live screen's own picture). */
const HL_SPORT=(function(){
  const HOME=[0.5,0.9];
  /* round 67: not only home runs (Ian: "it shouldn't say home run first"; show doubles, triples, balls caught at the
     wall, double plays, the big moments). From what the engine logs: home runs; hits that score runs (singles,
     doubles, triples); sacrifice flies, drawn as the deep fly caught at the wall with the runner tagging; double plays;
     strikeouts with two or more on; runners caught stealing. Two at most an inning, the biggest first. */
  function clips(L,d,mode){
    // round 68: "every chance" (all, and the full match) drops the closeness rule and keeps three an inning
    const all=mode==="all"||mode==="full", close=all||Math.abs(d.sh-d.sa)<=3, late=all||(d.seg||0)>=5, C=[];
    (d.ev||[]).forEach(e=>{
      if(e.k==="hr"){ if(mode!=="goals"||close||e.n>=3)C.push([9+e.n,e]); return }
      if(mode==="goals")return;
      if(e.k==="rbi"&&e.hit>=1&&close)C.push([e.hit+e.n+(late?1:0),e]);
      else if(e.k==="rbi"&&e.hit===0&&!e.gb&&close)C.push([3+(late?1:0),e]);          // a sacrifice fly
      else if(e.k==="dp"&&close&&late)C.push([4,e]);
      else if(e.k==="kk"&&close&&(e.on||0)>=2)C.push([3+(late?1:0),e]);
      else if(e.k==="cs"&&close&&late)C.push([2,e]); });
    if(mode==="full"&&Array.isArray(d.pl))return [];   // round 101: the full match plays every at-bat instead
    C.sort((a,b)=>b[0]-a[0]); const pick=C.slice(0,all?3:2).map(x=>x[1]);
    // the score after each run-scoring play, so the page ticks up clip by clip (round 70)
    const di=(L.drives||[]).indexOf(d), pv=di>0?L.drives[di-1]:null; let sh=pv?pv.sh||0:0, sa=pv?pv.sa||0:0; const after=new Map();   // the inning keeps only its end score
    (d.ev||[]).forEach(e=>{ if((e.k==="hr"||e.k==="rbi")&&e.n){ if(e.side==="home")sh+=e.n; else sa+=e.n } after.set(e,[sh,sa]) });
    // round 100: a call inside this inning already showed its score: the plays up to the one that made it aren't shown
    // again (the 6th's leadoff run played after "6th inning, tied 2-2", which already counted it)
    let from=0; { const q=L.askScore; if(q&&q.n===di&&(q.h>(pv?pv.sh||0:0)||q.a>(pv?pv.sa||0:0))){ const E=d.ev||[]; for(let i=0;i<E.length;i++){ const a=after.get(E[i]); if(a&&a[0]>=q.h&&a[1]>=q.a&&(E[i].k==="hr"||E[i].k==="rbi")&&E[i].n){ from=i+1; break } } } }
    const out=(d.ev||[]).filter((e,i)=>i>=from&&pick.indexOf(e)>=0).map(e=>{ const c=mk(L,e,d); if((e.k==="hr"||e.k==="rbi")&&e.n)c.after=after.get(e); return c });
    // round 70: the out that ends a close game, the tying run at the plate or on base (Ian: "down 1 in the 9th, the game
    // just ended")
    const E=d.last; if(E&&mode!=="goals"){ const gap=Math.abs(d.sh-d.sa), on=(E.r||[]).filter(Boolean).length; if(all||gap<=1||on+1>=gap)out.push(mk(L,E,d)) }
    return out;
  }
  function mk(L,e,d){
    const g=L.g, fieldEv=e.k==="dp"||e.k==="kk"||e.k==="cs", bat=e.k==="end"?e.bat:fieldEv?(e.side==="home"?"away":"home"):e.side, tm=bat==="home"?g.home:g.away, u=e.u||0;
    const kind=e.k==="end"?"end":e.k==="hr"?"hr":e.k==="rbi"&&e.hit===0?"sf":e.k==="rbi"?"hit":e.k;
    const r=mulberry32((u*7919+(d.seg||0)*131+(e.side==="home"?17:29))>>>0);
    let nm=e.nm||""; if(!nm)try{ nm=bsBatter(tm,e.slot!==undefined?e.slot:u%9,u)||"" }catch(er){}
    const ang=(-0.75+r()*1.5)*0.72, hr=e.k==="hr", how=kind==="end"?e.how:null;
    const dist=hr?1.08+r()*0.15:kind==="sf"?0.93+r()*0.04:how==="fly"?0.7+r()*0.2:e.hit===3?0.92:e.hit===2?0.82:0.55;
    const land=[HOME[0]+Math.sin(ang)*dist*0.62, HOME[1]-Math.cos(ang)*dist*0.78];
    const runners=kind==="sf"?1:kind==="kk"?Math.min(3,e.on||2):kind==="dp"||kind==="cs"?1:Math.max(0,(e.n||1)-(hr?1:0));
    // who was on (round 70: the engine now says, by base), and the men at the plate and on the mound for the panels
    const sur=n=>n?String(n).split(" ").slice(-1)[0]:"", on=(e.r||[]).map(sur), fteam=bat==="home"?g.away:g.home;
    const FR=(SEA.roster&&SEA.roster[fteam])||[], pn=e.p==="closer"?(FR[BS_CL]&&FR[BS_CL].n):e.p, pit=pn&&pn!=="bullpen"?bsPlayer(fteam,pn):null, bp=nm?bsPlayer(tm,nm):null, bl=bp&&bp.st2, pl=pit&&pit.st2;
    const panels={bat:{nm:sur(nm),team:tm,line:bl&&bl.ab?`${(bl.h/bl.ab).toFixed(3).replace(/^0/,"")} \u00b7 ${bl.hr||0} HR \u00b7 ${bl.rbi||0} RBI`:"No at-bats yet this season"},
      pit:{nm:pit?sur(pit.n):e.p==="bullpen"?"Bullpen":"",team:fteam,line:pl&&pl.ip?(e.p==="closer"?`${pl.sv||0} SV \u00b7 ${(pl.er*27/pl.ip).toFixed(2)} ERA \u00b7 ${pl.k||0} K`:`${(pl.er*27/pl.ip).toFixed(2)} ERA \u00b7 ${pl.w||0}-${pl.l||0} \u00b7 ${pl.k||0} K`):pit?"No innings yet this season":"In relief"}};
    // round 61: each one its own flight (a high fly or a line drive) and its distance (Instinct). A deep fly that's
    // caught climbs like a home run: you find out at the wall (round 67)
    const arc=hr||kind==="sf"?0.07+r()*0.11:0.03+r()*0.04, ft=hr&&typeof hrFeet==="function"?hrFeet(e):0;
    // round 67: the fielders by number (P, C, 1B, 2B, SS, 3B, LF, CF, RF are roster places 9, 0, 1, 2, 4, 3, 5, 6, 7), the batter
    // by his; a key under the diamond
    const fld=bat==="home"?g.away:g.home, K=hlKits(g.home,g.away), fn=hlNamed(fld,(H=>[9,0,1,2,4,3,5,6,7].map(i=>i!==9&&H.has(i)?BK(i):i))((()=>{ try{ return hurtSet(fld) }catch(e){ return new Set() } })()));   // round 71: the man playing, not the one hurt (Muse: injured Haddad at short)
    const BR=(SEA.roster&&SEA.roster[tm])||[], bi=BR.findIndex(p=>p&&nm&&p.n===nm), bno=bi>=0?shirtNo(tm,bi):null;
    const legend=[{team:fld,kit:K[bat==="home"?1:0],list:fn.filter(Boolean)},{team:tm,kit:K[bat==="home"?0:1],list:bno!=null?[[bno,String(nm).split(" ").slice(-1)[0]]]:[]}];
    // the man on the mound is the day's pitcher (the starter, the closer, or a reliever with no name), not the roster's first starter
    if(e.p){ const pi=pit?FR.indexOf(pit):-1; fn[0]=pi>=0?[shirtNo(fteam,pi),sur(pit.n)]:null; legend[0].list=fn.filter(Boolean) }
    const rv=kind==="end"?(how==="k"?0.62:how==="dp"?0.7:0.66):kind==="kk"?0.62:kind==="dp"?0.7:kind==="cs"?0.56:0.72;
    return {kind,how,on,panels,outs:e.outs,half:bat==="home"?"Bottom":"Top",gap:Math.abs(d.sh-d.sa),reveal:rv,dpTo:r()<0.5?4:3,fn,bno,legend,e,tm,nm:nm?String(nm).split(" ").slice(-1)[0]:"",hr,land,runners,n:e.n||1,inn:d.seg+1,base:3200,inks:hlKits(g.home,g.away).map(k=>k.fill),side:bat,text:"",arc,ft};
  }
  function pitch(x,W,H){
    const bg=x.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#121722"); bg.addColorStop(1,"#0D1118"); x.fillStyle=bg; x.fillRect(0,0,W,H);
    const P=(a,b)=>[a*W,b*H], [hx,hy]=P(HOME[0],HOME[1]), R=H*0.86, a0=-Math.PI/2-0.82, a1=-Math.PI/2+0.82;
    const fan=(rad)=>{ x.beginPath(); x.moveTo(hx,hy); x.arc(hx,hy,rad,a0,a1); x.closePath() };
    // the stands' edge, the warning track, the outfield grass mown in a checkerboard
    fan(R*1.035); x.fillStyle="#1E2A36"; x.fill();
    fan(R); x.fillStyle="#A9784C"; x.fill();
    x.save(); fan(R*0.955); x.clip(); hlGrass(x,0,0,W,H,{bands:16,base:"#2C7A37",alt:"#33873F",seed:31});
    { const n=16; for(let i=0;i<n;i++){ if(i%2)continue; x.fillStyle="rgba(0,0,0,.05)"; x.fillRect(0,i*H/n,W,H/n) } } x.restore();
    // the outfield wall, padded, with the distances
    x.beginPath(); x.arc(hx,hy,R,a0,a1); x.strokeStyle="#16324A"; x.lineWidth=Math.max(3,W/180); x.stroke();
    x.beginPath(); x.arc(hx,hy,R*1.0,a0,a1); x.strokeStyle="#F2C14E"; x.lineWidth=1; x.stroke();
    x.font=`700 ${Math.max(8,Math.round(W/60))}px 'Barlow Condensed',Impact,sans-serif`; x.fillStyle="rgba(246,250,242,.75)"; x.textAlign="center"; x.textBaseline="middle";
    [[a0+0.06,"330"],[-Math.PI/2-0.42,"375"],[-Math.PI/2,"400"],[-Math.PI/2+0.42,"375"],[a1-0.06,"330"]].forEach(([a,tx])=>x.fillText(tx,hx+Math.cos(a)*R*1.018,hy+Math.sin(a)*R*1.018));
    // the infield dirt: the arc behind the bases, then the grass diamond inside it
    const base=[[0.5,0.9],[0.62,0.72],[0.5,0.54],[0.38,0.72]].map(([a,b])=>P(a,b));
    x.save(); x.beginPath(); x.moveTo(hx,hy); x.arc(hx,hy,H*0.37,-Math.PI/2-0.82,-Math.PI/2+0.82); x.closePath(); x.clip();
    x.fillStyle="#B98656"; x.fillRect(0,0,W,H); hlSpeckle(x,0,0,W,H,Math.round(W*H/30),41,0.12); x.restore();
    const sq=0.065; x.beginPath(); [[0.5,0.9-sq],[0.62-sq,0.72],[0.5,0.54+sq],[0.38+sq,0.72]].map(([a,b])=>P(a,b)).forEach(([px,py],i)=>i?x.lineTo(px,py):x.moveTo(px,py)); x.closePath();
    x.save(); x.clip(); hlGrass(x,0,0,W,H,{bands:8,vertical:false,base:"#2E7E39",alt:"#358B41",seed:33}); x.restore();
    // the cut-outs round the bases, the mound, the plate's circle
    base.forEach(([px,py],i)=>{ if(i===0)return; x.beginPath(); x.arc(px,py,H*0.045,0,Math.PI*2); x.fillStyle="#B98656"; x.fill() });
    const [mx,my]=P(0.5,0.72); x.beginPath(); x.arc(mx,my,H*0.035,0,Math.PI*2); x.fillStyle="#C08E5E"; x.fill(); x.fillStyle="#F4F1E8"; x.fillRect(mx-3,my-0.8,6,1.6);
    x.beginPath(); x.arc(hx,hy,H*0.045,0,Math.PI*2); x.fillStyle="#B98656"; x.fill();
    // the foul lines and the boxes at the plate
    hlLines(x,Math.max(1,W/500),()=>{ [a0,a1].forEach(a=>{ x.beginPath(); x.moveTo(hx,hy); x.lineTo(hx+Math.cos(a)*R,hy+Math.sin(a)*R); x.stroke() });
      x.strokeRect(hx-H*0.035,hy-H*0.02,H*0.022,H*0.04); x.strokeRect(hx+H*0.013,hy-H*0.02,H*0.022,H*0.04) });
    // bases and the plate
    base.forEach(([px,py],i)=>{ x.save(); x.translate(px,py); x.rotate(Math.PI/4); x.fillStyle="#F4F1E8"; const b=i?4:3.4; x.fillRect(-b,-b,2*b,2*b); x.restore() });
    // the dugouts along the lines
    [[0.2,0.94],[0.8,0.94]].forEach(([a,b])=>{ const [px,py]=P(a,b); x.fillStyle="#1C2733"; x.fillRect(px-W*0.06,py-H*0.015,W*0.12,H*0.03) });
  }
  /* ---- round 101: the full match, at-bat by at-bat (Ian: "as realistic as possible") ----
     The engine logs every plate appearance of the game on screen (d.pl: the batter, what happened, who was on before and
     after, the outs, the runs, the pitcher) and every steal. The diamond plays them in order: the pitch, then the
     result as it was: the strikeout, the walk, the hit and where the runners went, the out in play, the double play, the
     sacrifice fly, the home run and its trot. The score and the outs change as they happen. Names are the engine's
     own, so the box score (counted at bat by at bat) agrees. Between halves, a beat for the change of sides. */
  /* round 105: pitch by pitch. Each plate appearance's pitches lead to the result the engine logged: a strikeout ends on
     strike three (swinging or looking), a walk on ball four, a ball in play or a hit batter on the pitch the count
     leaves; fouls with two strikes keep it going. From the at-bat's own hash, no game dice (MLB: about 3.9 pitches a
     plate appearance, a quarter of strikeouts looking). */
  function bsPitches(q,z){ const r=mulberry32((z^0x9E3779B9)>>>0), o=q.o, out=[]; let b=0,s=0;
    const strike=()=>{ const x=r(); if(s===2)return x<0.55?"F":x<0.8?"C":"W"; return x<0.36?"C":x<0.62?"W":"F" };   // called, swinging, foul (a foul can't be strike three)
    const add=c=>{ out.push(c); if(c==="B")b++; else if(c==="F"){ if(s<2)s++ } else s++ };
    const pre=(stopP,maxB,maxS)=>{ for(let k=0;k<12;k++){ if(r()<stopP&&k>0)break; const ball=r()<(b<maxB?0.4:0); if(ball)add("B"); else { const c=strike(); if((c==="C"||c==="W")&&s>=maxS){ add("F") } else add(c) } } };
    if(o==="k"){ for(let k=0;k<14&&s<2;k++){ if(b<3&&r()<0.36)add("B"); else { const c=strike(); add(c) } } for(let k=0;k<3&&r()<0.22;k++){ if(b<3&&r()<0.4)add("B"); else add("F") } out.push(r()<0.25?"KC":"KS") }
    else if(o==="bb"){ for(let k=0;k<14&&b<3;k++){ if(r()<0.62||s>=2&&r()<0.8)add("B"); else { const c=strike(); if(s>=2&&c!=="F")add("F"); else add(c) } } out.push("B4") }
    else if(o==="hbp"){ pre(0.5,3,2); out.push("HBP") }
    else { pre(0.4,3,2); out.push("X") }
    return out }
  const bsCount=(P,j)=>{ let b=0,s=0; for(let i=0;i<j;i++){ const c=P[i]; if(c==="B")b++; else if(c==="F"){ if(s<2)s++ } else if(c==="C"||c==="W")s++ } return [b,s] };
  /* round 111 (Ian: "Slow should be real time"; "a groundout where the runner was clearly safe", "singles no fielder gets
     to", "a sac fly with no tag", "no bat", "no curveballs", "runners don't lead off"): every play on real seconds, its
     men at real speeds, and the race the log decided is the race the screen shows. A fielder gets to the ball he fields;
     a ground ball's throw beats the runner it gets (the batter needs 4.3 s to first); on a sac fly the runner waits on
     third for the catch, then the throw comes in late. Between pitches the pitcher stands BS_DW seconds (the real pitch
     clock is 15 to 20: the wait is the one thing not in real time). Distances in metres (BS_MX, BS_MY: the field's
     width and depth in metres; the bases 27.4 m apart). */
  const BS_MX=167, BS_MY=103.5, BS_DW=6, BS_WIND=0.8, BS_SET=1.5, BS_CHANGE=10, BS_VCAP=9.5;
  const V_RUN=7.2, V_FLD=7.5, V_THR=33, V_GB=26, BASE_M=27.4, T_BAT1=4.3;
  const PLATE=[0.5,0.905], MOUND=[0.5,0.72], MITT=[0.5,0.93];
  const bsM=(a,b)=>Math.hypot((b[0]-a[0])*BS_MX,(b[1]-a[1])*BS_MY);
  const bsL=(a,b,t)=>{ t=Math.max(0,Math.min(1,t)); return [hlLerp(a[0],b[0],t),hlLerp(a[1],b[1],t)] };
  const bsTo=(a,b,m)=>{ const D=bsM(a,b); return D<1e-6?a.slice():bsL(a,b,m/D) };   // m metres from a toward b
  const bsPol=(ang,dist)=>[0.5+Math.sin(ang)*dist*0.62, 0.9-Math.cos(ang)*dist*0.78];
  // a pitch's kind from the at-bat's hash: about a third break (a slider or a curve: slower, bending), the rest straight
  const bsBreak=(z,j)=>{ const h=(z>>>((j*5+3)%27))&15; return h<5?(h&1?1:-1):0 };
  const bsFlight=br=>br?0.52:0.43;
  const PS_S=BS_DW+BS_WIND+0.5+BS_SET;   // an earlier pitch, its start to the next one's
  /* the play after contact (or the last pitch), from the log's line: who fields it, where the ball goes, when each man
     gets where, and when it's decided (tEnd: the banner, the outs and the score) */
  function bsGeom(q,z,on){ const rr=mulberry32((z^0x51ED27)>>>0), o=q.o, G={o,tEnd:0.3,tDur:2.6,legs:[],fl:{},run:[],bat:null};
    const post=q.post||[null,null,null], pre=q.pre||on||[null,null,null], postAt=nm=>{ const j=post.indexOf(nm); return j>=0?j+1:-1 };
    const hitN=o==="s1"?1:o==="s2"?2:o==="s3"?3:o==="hr"?4:0;
    // the ball's path: legs [t0,t1,from,to,lift (a share of the field's height at the top),bounce]
    const leg=(t0,t1,a,b,lift,bn)=>{ G.legs.push([t0,t1,a.slice(),b.slice(),lift||0,bn||0]); return t1 };
    const fmove=(i,t0,t1,a,b)=>{ (G.fl[i]=G.fl[i]||[]).push([t0,t1,a.slice(),b.slice()]) };
    const thr=(t0,a,b,lift)=>{ const t1=t0+Math.max(0.25,bsM(a,b)/V_THR); leg(t0,t1,a,b,lift==null?Math.min(0.04,bsM(a,b)/2400):lift); return t1 };
    const B=k=>BASES[k];
    const coverOf=(base,fi)=>base===1?(fi===2?0:2):base===2?(fi===4?3:4):base===3?(fi===5?4:5):1;
    // the runners: where the log put each one (a base, home, or out); out ones are put out at the play's out time
    let toScore=q.runs-(o==="hr"?1:0); const R=[];
    [2,1,0].forEach(i=>{ const nm=pre[i]; if(!nm)return; let dest=postAt(nm); if(dest<0){ if(toScore>0){ dest=4; toScore-- } else dest=-1 } R.push({nm,from:i+1,dest}) });
    const bd=o==="hr"?4:postAt(q.nm);
    const runFrom=(r,t0,v)=>{ r.t0=t0; r.v=v||V_RUN };
    if(o==="k"){ G.tEnd=0.2; G.tDur=2.6; R.forEach(r=>{ r.dest=r.from; r.hold=1 }); G.bat={stay:1.8} }
    else if(o==="bb"||o==="hbp"){ G.tEnd=0.4; const tt=BASE_M/4.2; G.tDur=0.6+tt+0.8; R.forEach(r=>{ if(r.dest>r.from)runFrom(r,0.6,4.2); else r.hold=1 }); G.bat={from:0,dest:1,t0:0.6,v:4.2} }
    else if(o==="hr"){ const ang=(-0.75+rr()*1.5)*0.72, far=bsPol(ang,1.12), th=4.2; leg(0,th,PLATE,far,0.17);
      const fi=far[0]<0.4?6:far[0]>0.6?8:7; fmove(fi,0.3,3.6,F[fi],bsPol(ang,0.96)); G.tEnd=th;
      R.forEach(r=>runFrom(r,0.8,6)); G.bat={from:0,dest:4,t0:0.8,v:6}; G.tDur=0.8+4*BASE_M/6+1.2 }
    else if(hitN){ // a hit: the ball through or over the infield, the outfielder runs it down where it gets to, the throw back in
      const ang=(-0.75+rr()*1.5)*0.72, d0=hitN===1?0.5+rr()*0.12:hitN===2?0.8:0.9, Lp=bsPol(ang,d0), fi=Lp[0]<0.4?6:Lp[0]>0.6?8:7;
      const air=hitN>1||rr()<0.5, vb=air?30:24, tb=bsM(PLATE,Lp)/vb, vr=hitN>1?9:6;
      leg(0,tb,PLATE,Lp,air?(hitN>1?0.06:0.03):0,air?0:1);
      // where he gets to it: along the ray past the landing point, the ball rolling on at vr m/s
      let dq=d0, tF=tb; for(let it=0;it<4;it++){ const Q=bsPol(ang,dq), tf=bsM(F[fi],Q)/V_FLD; if(tf<=tF+0.05)break; const roll=Math.min(0.97-d0,(tf-tb)*vr/BS_MY/0.78); dq=d0+Math.max(0,roll); tF=tb+bsM(Lp,bsPol(ang,dq))/vr }
      const Q=bsPol(ang,dq), tf=bsM(F[fi],Q)/V_FLD; tF=Math.max(tF,tf)+0.2; if(dq>d0)leg(tb,tF,Lp,Q,0,1);
      fmove(fi,0,tF,F[fi],Q);
      const cut=hitN===1?B(2):bsL(B(2),Q,0.35), cm=Lp[0]>0.55?3:4; fmove(cm,0.4,Math.max(2,tF-0.3),F[cm],cut);
      const tA=thr(tF+0.35,Q,cut);
      R.forEach(r=>{ if(r.dest>r.from)runFrom(r,0,V_RUN); else r.hold=1 });
      const tB=hitN*BASE_M/V_RUN; G.bat={from:0,dest:hitN,t0:0,v:V_RUN,round:1}; G.tEnd=Math.min(tB,T_BAT1+0.3); G.tDur=Math.max(tA+1.2,tB+1.2,...R.map(r=>r.dest>r.from?(Math.min(4,r.dest)-r.from)*BASE_M/V_RUN+1:0)) }
    else if(o==="out"&&(q.sf||(!q.dp&&rr()>=0.5))){ // a fly ball caught: the man under it, the runners tag (a sac fly: the run comes in after the catch)
      const ang=(-0.75+rr()*1.5)*0.72, d0=q.sf?0.9:0.62+rr()*0.12; let Ld=bsPol(ang,d0); const fi=Ld[0]<0.4?6:Ld[0]>0.6?8:7, th=3.0+d0*2.2;
      const reach=V_FLD*(th-0.5); if(bsM(F[fi],Ld)>reach)Ld=bsTo(F[fi],Ld,reach);
      leg(0,th,PLATE,Ld,q.sf?0.13:0.11); fmove(fi,0.2,th-0.25,F[fi],Ld); G.tEnd=th;
      R.forEach(r=>{ if(r.dest>r.from){ r.tag=1; runFrom(r,th,7.6) } else r.hold=1 });
      const scorer=R.find(r=>r.tag&&r.dest===4);
      if(scorer){ const tH=th+BASE_M/7.6; leg(th+0.5,tH+0.5,Ld,MITT,0.05); G.tEnd=tH; G.tDur=tH+2 } else { const t2=thr(th+0.6,Ld,B(2)); fmove(4,th-1,t2,F[4],B(2)); G.tDur=Math.max(th+2,t2+0.8) }
      G.bat={from:0,dest:1,t0:0,v:V_RUN,out:th+0.4} }
    else { // a ground ball: the man fields it where it comes to him, the throw beats the runner it gets
      const fi=q.dp?(rr()<0.5?4:3):[5,4,3,2][Math.floor(rr()*4)];
      let I=bsTo(F[fi],PLATE,rr()*3); I=[I[0]+(rr()-0.5)*0.03,I[1]];
      const tI=bsM(PLATE,I)/V_GB; leg(0,tI,PLATE,I,0,1); fmove(fi,0,tI,F[fi],I); const tG=tI+0.45;
      const outR=R.filter(r=>r.dest===-1).sort((a,b)=>b.from-a.from)[0];
      R.forEach(r=>{ if(r.dest!==r.from)runFrom(r,0,V_RUN); else r.hold=1 });
      if(q.dp){ const lead=outR||{from:1}, b1=lead.from+1, c1=coverOf(b1,fi); fmove(c1,0.2,tG,F[c1],B(b1));
        let t1=thr(tG,I,B(b1)), t2c=coverOf(1,c1===2?-1:fi); fmove(t2c,0.2,1.6,F[t2c],B(1));
        let t2=thr(t1+0.45,B(b1),B(1)); if(t2>T_BAT1-0.25){ const k=(T_BAT1-0.25)/t2; G.legs.forEach(L=>{ L[0]*=k; L[1]*=k }); t1*=k; t2*=k }
        if(outR)outR.tOut=t1; G.bat={from:0,dest:1,t0:0,v:V_RUN,out:t2,thru:1}; G.tEnd=t2; G.tDur=Math.max(t2+2,T_BAT1+1.5) }
      else { const b1=outR&&bd>0?outR.from+1:1, c1=coverOf(b1,fi);
        if(fi===2&&b1===1&&bsM(I,B(1))<9){ const tO=tG-0.2+bsM(I,B(1))/V_FLD; leg(tG-0.2,tO,I,B(1),0); fmove(2,tG-0.2,tO,I,B(1)); G.tO=tO }
        else { const tc=bsM(F[c1],B(b1))/V_FLD+0.2; fmove(c1,0.1,tc,F[c1],B(b1)); G.tO=Math.max(tc+0.1,thr(tG,I,B(b1))); if(G.tO>G.legs[G.legs.length-1][1]){ const Lg=G.legs[G.legs.length-1]; Lg[1]=G.tO } }
        if(b1===1&&G.tO>T_BAT1-0.3){ const k=(T_BAT1-0.3)/G.tO; G.legs.forEach(L=>{ L[0]*=k; L[1]*=k }); Object.values(G.fl).forEach(A=>A.forEach(m=>{ m[0]*=k; m[1]*=k })); G.tO*=k }
        if(outR)outR.tOut=G.tO; G.bat=bd>0?{from:0,dest:bd,t0:0,v:V_RUN}:{from:0,dest:1,t0:0,v:V_RUN,out:G.tO,thru:1}; G.tEnd=Math.max(G.tO,bd>0?T_BAT1:0); G.tDur=Math.max(G.tEnd+2,T_BAT1+1.5) } }   // he runs it out through the bag
    G.run=R; return G }
  function bsEndText(q,G){ const o=q.o, hitN=o==="s1"?1:o==="s2"?2:o==="s3"?3:o==="hr"?4:0, H_=["","single","double","triple"], rn=q.runs?`, ${q.runs} in`:"", fly=G.legs.length&&G.legs[0][4]>0.08;
    return o==="k"?`Strikeout: ${sur(q.nm)}`:o==="bb"?`Walk: ${sur(q.nm)}${rn}`:o==="hbp"?`Hit by pitch: ${sur(q.nm)}${rn}`
      :o==="hr"?(q.runs===4?`GRAND SLAM! ${sur(q.nm)}`:`HOME RUN! ${sur(q.nm)}${q.runs>1?", "+q.runs+" in":""}`)
      :hitN?`${sur(q.nm)}: ${H_[hitN]}${rn}`:q.dp?`Double play${rn}`:q.sf?`Sac fly: ${sur(q.nm)}, a run scores`:`${sur(q.nm)} ${fly?"flies out":"grounds out"}${rn}` }
  // the ball at t seconds into the play: {p, lift} (lift a share of the field's height), or the last leg's end
  function bsBallAt(G,t){ if(!G.legs.length)return null; let L=G.legs[0]; if(t<L[0])return {p:L[2],lift:0};
    for(const l of G.legs){ if(t<=l[1]){ const s=(t-l[0])/Math.max(1e-6,l[1]-l[0]); return {p:bsL(l[2],l[3],l[5]?1-Math.pow(1-s,1.5):s),lift:l[4]?Math.sin(Math.PI*s)*l[4]:l[5]?Math.abs(Math.sin(s*Math.PI*3))*0.008*(1-s):0} } L=l }
    return {p:L[3],lift:0} }
  // a man's base position (0 home .. 4 home again) running from base `from` toward `dest` at v m/s from t0, off a lead
  const bsRunK=(from,dest,t0,v,t,lead)=>{ const st=from+(lead||0), d=Math.min(4,dest)-st; if(d<=0)return Math.min(4,dest); return st+Math.min(d,Math.max(0,t-t0)*v/BASE_M) };
  const W_ITEM={sb:BS_DW+BS_WIND+5,cs:BS_DW+BS_WIND+5};
  function pbItems(d,from,to){ const key=(from||0)+"|"+(to==null?d.pl.length:to)+"|"+d.pl.length+"|rt"; if(d._pb&&d._pb.key===key)return d._pb;
    const L=d.pl.slice(0,to==null?d.pl.length:to), out=[]; let tot=0, side=from>0&&L[from-1]?L[from-1].s:null;
    for(let i=from||0;i<L.length;i++){ const q=L[i], pv=i>0?L[i-1]:null, on=pv&&pv.s===q.s?(pv.post||[null,null,null]):[null,null,null];
      if(q.s!==side){ out.push({k:"change",s:q.s,at:tot,w:BS_CHANGE,i:i}); tot+=BS_CHANGE; side=q.s }
      const z=strHash("bs|"+d.seg+"|"+i+"|"+(q.nm||"")), ps=q.t==="pa"?bsPitches(q,z):null;
      if(ps){ const G=bsGeom(q,z,on), nPre=ps.length-1, fl=bsFlight(bsBreak(z,nPre)), w=nPre*PS_S+BS_DW+BS_WIND+fl+G.tDur;
        out.push({k:q.t,q:q,at:tot,w:w,ps:ps,i:i,z:z,G:G,nPre:nPre,tc:nPre*PS_S+BS_DW+BS_WIND+fl}); tot+=w }
      else { const w=W_ITEM[q.t]||8; out.push({k:q.t,q:q,at:tot,w:w,i:i,z:z}); tot+=w } }
    return d._pb={key:key,P:out,tot:tot} }
  function playback(L,d,from,to){ if(!d||!Array.isArray(d.pl))return 0; const it=pbItems(d,from||0,to); if(!it.P.length)return 0;
    return Math.round(it.tot*1000*(typeof fullRT==="function"?fullRT():0.5)) }
  const F=[[0.5,0.72],[0.5,0.95],[0.6,0.66],[0.56,0.6],[0.44,0.6],[0.4,0.66],[0.25,0.38],[0.5,0.25],[0.75,0.38]];
  const BASES=[[0.5,0.9],[0.62,0.72],[0.5,0.54],[0.38,0.72],[0.5,0.9]];
  const along=k=>{ const f=Math.max(0,Math.min(4,k)), i=Math.min(3,Math.floor(f)), s=f-i; return [hlLerp(BASES[i][0],BASES[i+1][0],s),hlLerp(BASES[i][1],BASES[i+1][1],s)] };
  const sur=n=>n?String(n).split(" ").slice(-1)[0]:"";
  const BOX=[0.473,0.9];   // the right-handed batter's box (the third-base side of the plate)
  let pbKey=""; const BS_VMAX=1.4;
  function pbDraw(x,W,H){
    const PB=live.pb, d=PB.d, it=pbItems(d,PB.from||0,PB.to), el=PB.frozen!=null?PB.frozen:Date.now()-PB.at, f=Math.max(0,Math.min(0.9999,el/Math.max(1,PB.ms))), T=f*it.tot;
    let ci=it.P.findIndex(q=>T<q.at+q.w); if(ci<0)ci=it.P.length-1; const C=it.P[ci], tin=T-C.at;
    // the pitch cycle: which pitch (pj: an earlier one, or null for the last), seconds into it (pt); t: seconds after the last pitch reaches the plate
    const pj=C.ps&&tin<C.nPre*PS_S?Math.floor(tin/PS_S):null, pt=C.ps?(pj!=null?tin-pj*PS_S:tin-C.nPre*PS_S):tin, t=C.ps?tin-C.tc:tin-(BS_DW+BS_WIND+0.43);
    const g=live.g, Pp=(a,b)=>[a*W,b*H], r=Math.max(5,W/85), kits=hlKits(g.home,g.away);
    const prevQ=C.i>0?d.pl[C.i-1]:null, q=C.q||(C.k==="change"?d.pl[C.i]:null), batS=C.s!=null?C.s:q.s, bat=batS===0?"home":"away", fld=bat==="home"?"away":"home";
    const btm=g[bat], ftm=g[fld], ink=kits[batS===0?0:1].fill, dink=kits[batS===0?1:0].fill;
    const sameHalf=prevQ&&prevQ.s===batS;
    let hs=prevQ&&prevQ.h!=null?prevQ.h:PB.h0, as=prevQ&&prevQ.a!=null?prevQ.a:PB.a0;
    let outs=sameHalf?prevQ.outs:0, on=sameHalf?(prevQ.post||[null,null,null]):[null,null,null];
    if(C.k==="change"){ on=[null,null,null]; outs=0 }
    const inn=(d.seg||0)+1, half=bat==="home"?"Bot":"Top";
    const FR=(SEA.roster&&SEA.roster[ftm])||[], hurt=(()=>{ try{ return hurtSet(ftm) }catch(e){ return new Set() } })();
    const fn=hlNamed(ftm,[9,0,1,2,4,3,5,6,7].map(i=>i!==9&&hurt.has(i)?BK(i):i));
    const pn=q&&q.p==="closer"?(FR[BS_CL]&&FR[BS_CL].n):q&&q.p;
    if(pn&&pn!=="bullpen"){ const pi=FR.findIndex(p=>p&&p.n===pn); fn[0]=pi>=0?[shirtNo(ftm,pi),sur(pn)]:[null,sur(pn)] }
    const BR=(SEA.roster&&SEA.roster[btm])||[], noOf=nm=>{ const i=BR.findIndex(p=>p&&p.n===nm); return i>=0?shirtNo(btm,i):null };
    const z=C.z||0;
    let ball=null, lift=0, top="", end="", endInk=null, swing=null, batOn=false;
    const fpos=F.map(p=>p.slice()), men=[];   // men: {nm, p, isB}
    const onTxt=b=>{ const k=[0,1,2].filter(i=>b[i]).map(i=>["1st","2nd","3rd"][i]); return !k.length?"bases empty":k.length===3?"bases loaded":(k.length===1?"runner on ":"runners on ")+k.join(" and ") };
    // the pitch: held, the windup, the flight (a breaking ball bends and loops), into the mitt; leads off and back
    const cyc=(ptt,br,fl)=>{ const r0=ptt-BS_DW-BS_WIND; if(r0<0)return {ball:MOUND.slice(),lift:0,phase:"set"};
      if(r0<fl){ const s=r0/fl; return {ball:[0.5+br*(0.011-0.026*s*s),hlLerp(0.72,0.905,s)],lift:Math.sin(Math.PI*s)*(br?0.024:0.012),phase:"fly",s} }
      return {ball:MITT.slice(),lift:0,phase:"in",after:r0-fl} };
    const leadAt=(ptt,base)=>{ const L0=base===3?0.09:0.13, L1=base===3?0.15:0.2;
      if(ptt<2)return 0; if(ptt<BS_DW)return L0*Math.min(1,(ptt-2)/1.8); const r0=ptt-BS_DW; if(r0<BS_WIND+0.5)return hlLerp(L0,L1,Math.min(1,r0/(BS_WIND+0.5))); return L1*Math.max(0,1-(r0-BS_WIND-0.5)/1.2) };
    if(C.k==="change"){
      const was=prevQ?prevQ.s:null; top=`${half} ${ordw(inn)}`;
      end=prevQ&&was!==batS?(batS===0?`Middle of the ${ordw(inn)}`:`End of the ${ordw(inn-1)}`):`${half} of the ${ordw(inn)}`;
      if(!prevQ)end=batS===1?`Top of the ${ordw(inn)}: ${btm} up`:`Bottom of the ${ordw(inn)}`;
    }else if(C.k==="sb"||C.k==="cs"){   // the runner goes with the windup, the catcher's throw to second
      const ok=C.k==="sb", c=cyc(pt,0,0.43), r0=pt-BS_DW, tArr=BS_WIND+(24/7.4), tBall=ok?tArr+0.3:tArr-0.35, tThr=BS_WIND+0.43+0.7;
      ball=c.ball; lift=c.lift; if(r0>=tThr){ const s=Math.min(1,(r0-tThr)/Math.max(0.2,tBall-tThr)); ball=bsL(MITT,BASES[2],s); lift=Math.sin(Math.PI*s)*0.02 }
      if(r0>tThr-0.5)fpos[4]=bsL(F[4],BASES[2],(r0-(tThr-0.5))/1.2);
      on.forEach((nm,i)=>{ if(!nm)return; if(i===0){ const k=r0<0?1+leadAt(pt,1):bsRunK(1,2,0,7.4,r0,0.13); if(ok||r0<tBall+0.6)men.push({nm,p:along(k)}) } else men.push({nm,p:along(i+1+leadAt(pt,i+1))}) });
      men.push({nm:null,p:BOX.slice(),isB:true,box:true});
      top=`${half} ${ordw(inn)} · ${outs} out`; if(r0>=Math.min(tArr,tBall)){ end=ok?`Stolen base: ${sur(q.nm)}`:`Caught stealing: ${sur(q.nm)}`; endInk=ok?ink:dink; outs=q.outs }
    }else{
      const o=q.o, G=C.G, hitN=o==="s1"?1:o==="s2"?2:o==="s3"?3:o==="hr"?4:0, done=t>=G.tEnd;
      const jj=pj!=null?pj:C.nPre, code=C.ps[jj], br=bsBreak(z,jj), fl=pj!=null?0.5:bsFlight(br), c=cyc(pt,br,fl), sw=code==="W"||code==="F"||code==="X"||code==="KS";
      // the batter in the box, the bat back; he swings as the ball gets there
      if(c.phase==="fly"&&sw&&c.s>0.6)swing=Math.min(1,(c.s-0.6)/0.4); else if(c.phase==="in"&&sw)swing=1;
      if(pj!=null||t<0){ ball=c.ball; lift=c.lift; batOn=true;
        if(pj!=null&&c.phase==="in"&&code==="F"){ const v=Math.min(1,c.after/0.9), sd=(z>>>pj)&1?1:-1; ball=[0.5+sd*v*0.32,0.905-v*0.12]; lift=Math.sin(v*Math.PI)*0.06 }
        on.forEach((nm,i)=>{ if(nm)men.push({nm,p:along(i+1+leadAt(pt,i+1))}) });
        men.push({nm:q.nm,p:BOX.slice(),isB:true,box:true}) }
      else { // the play
        if(o==="k"||o==="bb"||o==="hbp"){ ball=MITT.slice() } else { const bb=bsBallAt(G,t); if(bb){ ball=bb.p; lift=bb.lift } }
        Object.keys(G.fl).forEach(i=>G.fl[i].forEach(([t0,t1,a,b])=>{ if(t>=t0)fpos[i]=bsL(a,b,(t-t0)/Math.max(0.05,t1-t0)) }));
        if(G.tO&&t>G.tO+0.8&&o==="out"){ }   // the fielders keep their places till the next pitch (the cap walks them back)
        G.run.forEach(R0=>{ const lead=0.2*Math.max(0,1-t/0.6);
          if(R0.hold){ men.push({nm:R0.nm,p:along(R0.from+(R0.tag?0:lead))}); return }
          if(R0.dest===-1){ if(R0.tOut!=null&&t>R0.tOut+0.6)return; men.push({nm:R0.nm,p:along(Math.min(R0.from+0.95,bsRunK(R0.from,R0.from+1,R0.t0||0,R0.v||V_RUN,t,R0.tag?0:0.2)))}); return }
          const k=bsRunK(R0.from,R0.dest,R0.t0||0,R0.v||V_RUN,t,R0.tag?0:0.2); if(k>=4&&t>(R0.t0||0)+(4-R0.from)*BASE_M/(R0.v||V_RUN)+0.8)return; men.push({nm:R0.nm,p:along(k)}) });
        const Bt=G.bat; if(Bt){ if(Bt.stay!=null){ if(t<Bt.stay)men.push({nm:q.nm,p:BOX.slice(),isB:true,box:true}) }
          else { let k=bsRunK(Bt.from,Bt.dest,Bt.t0,Bt.v,t,0); if(Bt.round&&Bt.dest<4){ const ta=Bt.t0+Bt.dest*BASE_M/Bt.v; if(t>ta)k=Bt.dest+0.1*Math.sin(Math.min(1,(t-ta)/2.2)*Math.PI) }
            if(Bt.out!=null){ k=Math.min(1.12,Math.max(0,t-Bt.t0)*Bt.v/BASE_M); if(t>(Bt.thru?Math.max(Bt.out+1.1,Bt.t0+1.12*BASE_M/Bt.v+0.5):Bt.out+1.1))k=-1 }
            if(k>=0&&!(Bt.dest>=4&&k>=4&&t>Bt.t0+4*BASE_M/Bt.v+0.8))men.push({nm:q.nm,p:along(k),isB:true}) } } }
      top=`${half} ${ordw(inn)} · ${outs} out · ${onTxt(on)} · ${sur(q.nm)} up${q.ph?" (pinch-hitting for "+sur(q.ph)+")":""}`;
      if(pj==null&&done){ outs=q.outs;
        end=bsEndText(q,G);
        endInk=o==="k"||o==="out"?dink:ink;
        top=`${half} ${ordw(inn)} · ${outs} out`+(outs<3?` · ${onTxt(q.post||[null,null,null])}`:"") }
      // the count and the call
      let call=""; if(c.phase==="in"&&pj!=null)call=code==="B"?"Ball":code==="C"?"Called strike":code==="W"?"Swinging strike":"Foul";
      const thrown=pj!=null?(c.phase==="in"?pj+1:pj):(c.phase==="in"||t>=0?C.ps.length:C.ps.length-1), [cb,cs]=bsCount(C.ps,Math.min(thrown,C.nPre));
      if(pj!=null||!done)top=top+` · ${cb}-${cs}`+(call?` · ${call}`:"");
      if(pj==null&&!done&&t>=0){ const lastP=C.ps[C.ps.length-1]; const lc=lastP==="KC"?"Called strike three":lastP==="KS"?"Swinging strike three":lastP==="B4"?"Ball four":""; if(lc)top=top+` · ${lc}` }
      if(done&&q.h!=null){ hs=q.h; as=q.a }
      pbDraw._thrown=thrown }
    // nobody outruns his legs: a fielder going back to his place after a play, any man between items, at most BS_VCAP m/s of the game's clock
    const mpos=men.map(m=>m.p.slice()), key=m=>m.nm||"#box";
    { const Q=pbDraw.st, dt=Q&&Q.d===d&&Q.from===(PB.from||0)?el-Q.el:-1; let nCl=0, lagM=0;
      const lim=BS_VCAP*Math.max(0,dt)/Math.max(1,PB.ms)*it.tot/BS_MX;
      if(dt>=0&&dt<400){ const cap=(o,q2)=>{ const dx=q2[0]-o[0], dy=(q2[1]-o[1])*H/W, m=Math.hypot(dx,dy); if(m>lim&&m>0){ nCl++; lagM+=m-lim; return [o[0]+dx*lim/m,o[1]+dy*lim/m*W/H] } return q2 };
        fpos.forEach((p,i)=>{ if(Q.f[i])fpos[i]=cap(Q.f[i],p) }); men.forEach((m,j)=>{ const o=Q.r[key(m)]; if(o)mpos[j]=cap(o,mpos[j]) }) }
      pbDraw.st={d,from:PB.from||0,el,f:fpos.map(p=>p.slice()),r:Object.fromEntries(men.map((m,j)=>[key(m),mpos[j].slice()]))};
      pbDraw.pos={f:fpos,r:men.map((m,j)=>({nm:key(m),p:mpos[j]})),nCl,lagM,upf:BS_VCAP*it.tot/Math.max(1,PB.ms)/BS_MX/BS_VMAX,W,H,ball,t,ci} }
    // draw: the fielders, the runners and the batter with his bat, the ball
    fpos.forEach((p,i)=>{ const [px,py]=Pp(p[0],p[1]); hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)","",fn&&fn[i]?{num:fn[i][0],sub:fn[i][1]}:null) });
    if(C.k!=="change")men.forEach((m,j)=>{ const [rx,ry]=Pp(mpos[j][0],mpos[j][1]);
      if(m.box&&m.nm){ // the bat: back over the shoulder, through the zone on a swing
        const a0=-2.2, a1=0.35, ang=swing==null?a0:hlLerp(a0,a1,swing), L=r*2.9, hx=rx+r*0.6, hy=ry-r*0.25, ex=hx+Math.cos(ang)*L, ey=hy+Math.sin(ang)*L;
        x.save(); x.lineCap="round"; x.strokeStyle="rgba(0,0,0,.55)"; x.lineWidth=Math.max(3,r*0.5); x.beginPath(); x.moveTo(hx,hy); x.lineTo(ex,ey); x.stroke();
        x.strokeStyle="#D9B27A"; x.lineWidth=Math.max(2,r*0.34); x.beginPath(); x.moveTo(hx,hy); x.lineTo(ex,ey); x.stroke(); x.restore() }
      if(m.nm)hlDot(x,rx,ry,r,ink,"rgba(0,0,0,.6)","",{num:noOf(m.nm),sub:sur(m.nm)}) });
    if(ball){ const [qx,qy]=Pp(ball[0],ball[1]); hlBall(x,qx,qy,r*0.55,lift*H,null,{ring:"#C8102E"}) }
    // the pitcher's count, as a manager watches it (every pitch he has thrown this game as shown)
    let pcTxt=""; if((typeof ENGINE_V==="undefined"||ENGINE_V>=22)&&pn&&pn!=="bullpen"&&q){ const cnt=(dd,upto)=>{ let k=0; (dd.pl||[]).forEach((qq,ii)=>{ if(ii>=upto||!qq||qq.t!=="pa"||qq.p!==q.p||qq.s!==batS)return; k+=bsPitches(qq,strHash("bs|"+dd.seg+"|"+ii+"|"+(qq.nm||""))).length }); return k };
      let tot=0; const di0=live.drives.indexOf(d); live.drives.slice(0,di0<0?live.drives.length:di0).forEach(dd=>{ tot+=cnt(dd,1e9) }); tot+=cnt(d,C.i);
      if(C.ps&&C.k!=="change")tot+=pbDraw._thrown||0;
      pcTxt=` · ${sur(pn)} ${tot}p`; pbDraw.pc=tot }
    const clock=`${half==="Top"?"▲":"▼"}${inn} · ${outs} out${pcTxt}`;
    hlBug(x,W,H,{home:g.home,away:g.away,hs:hs,as:as,hk:kits[0],ak:kits[1],clock:clock});
    hlTicker(x,W,H,top,8.01);
    if(end){ const k2=ci+"|"+end; if(pbDraw._b!==k2){ pbDraw._b=k2; pbDraw._b0=Date.now() } hlBanner(x,W,H,end,endInk&&endInk!=="#fff"?{fill:endInk}:null,Math.max(0,(Date.now()-pbDraw._b0)/1200)) }
    // round 111 (Ian: a play by play in every sport, synced): each at-bat once it's decided, steals as they happen
    if(typeof hlFeedTick==="function")hlFeedTick(()=>{ const out=[]; it.P.forEach((C2,j)=>{ const q2=C2.q; if(!q2)return; const tE=C2.G?C2.at+C2.tc+C2.G.tEnd:C2.at+C2.w-2; if(tE>T)return;
      const tx=C2.G?bsEndText(q2,C2.G):q2.t==="sb"?`Stolen base: ${sur(q2.nm)}`:q2.t==="cs"?`Caught stealing: ${sur(q2.nm)}`:""; if(!tx)return; const sd=q2.s===0?"home":"away";
      out.push({k:d.seg+"|"+(PB.from||0)+"|"+C2.i,m:`${q2.s===0?"▼":"▲"}${(d.seg||0)+1}`,team:g[sd],text:tx,big:q2.o==="hr"?"hr":q2.runs?"run":null}) }); return out });
    // the page follows: the score, the half and the outs; the hits so far as shown
    const HIT={s1:1,s2:1,s3:1,hr:1}, di=live.drives.indexOf(d), pd=di>0?live.drives[di-1]:di<0&&live.drives.length?live.drives[live.drives.length-1]:null, hh=pd&&pd.hits?pd.hits.slice():[0,0];
    for(let i=0;i<C.i;i++){ const qq=d.pl[i]; if(qq&&qq.t==="pa"&&HIT[qq.o])hh[qq.s]++ } if(q&&C.k==="pa"&&C.G&&pj==null&&t>=C.G.tEnd&&HIT[q.o])hh[q.s]++; PB.hits=hh;
    const head=`${half==="Top"?"Top":"Bottom"} of the ${ordw(inn)}, ${outs} out`, k2=hs+"|"+as+"|"+head+"|"+hh.join(",");
    if(k2!==pbKey){ const was=pbKey; pbKey=k2; if(live.hold){ const runUp=live.hold.h!==hs||live.hold.a!==as; live.hold.h=hs; live.hold.a=as; live.hold.clock=head; live.hold.hits=hh;
        if(runUp&&was&&typeof sfx==="function"){ const mine=(bat==="home")===(g.home===S.myTeam); sfx(mine?(q&&q.o==="hr"?"hr":"run"):"against") } }
      setTimeout(()=>{ if(live&&live.pb&&typeof render==="function")render() },0) }
  }
  function idle(x,W,H){ if(typeof live!=="undefined"&&live&&live.pb&&live.pb.d&&!live.done){ pbDraw(x,W,H); return } }   // round 67: otherwise nothing to say until something happens (Ian)
  function frame(x,W,H,c,t){
    const P=(a,b)=>[a*W,b*H], ink=c.inks[c.side==="home"?0:1], dink=c.inks[c.side==="home"?1:0], r=Math.max(5,W/85);
    // the fielders: nine of them in their places, the pitcher on the mound
    const F=[[0.5,0.72],[0.5,0.95],[0.6,0.66],[0.56,0.6],[0.44,0.6],[0.4,0.66],[0.25,0.38],[0.5,0.25],[0.75,0.38]];
    const bases=[[0.5,0.9],[0.62,0.72],[0.5,0.54],[0.38,0.72],[0.5,0.9]];
    const along=(k)=>{ const f=Math.max(0,Math.min(4,k)), i=Math.min(3,Math.floor(f)), s=f-i; return [hlLerp(bases[i][0],bases[i+1][0],s),hlLerp(bases[i][1],bases[i+1][1],s)] };
    const tp=0.18, tl=c.reveal;
    // the game's last out plays as the out it was: a strikeout, a fly caught, a grounder thrown to first, a double play
    const K=c.kind==="end"?({k:"kk",dp:"dp",fly:"fo",gb:"go"}[c.how]||"go"):c.kind;
    const flight=K==="hr"||K==="hit"||K==="sf"||K==="fo";
    const fi=c.land[0]<0.4?6:c.land[0]>0.6?8:7, gbTo=c.land[0]<0.45?(c.land[0]<0.4?5:4):3;
    // round 70: the fielder runs the ball down and throws it in (Ian: "they keep running to the ball and throw it")
    const tGet=K==="hit"?tl+0.07:tl, roll=K==="hit"?[c.land[0]+(c.land[0]-HOME[0])*0.06,c.land[1]+(c.land[1]-HOME[1])*0.06]:c.land;
    const wallAt=[HOME[0]+(c.land[0]-HOME[0])*0.86,HOME[1]+(c.land[1]-HOME[1])*0.86];
    const throwTo=K==="sf"?[0.5,0.89]:bases[2];
    const ballAt=tt=>{ tt=Math.max(0,tt); const mound=[0.5,0.72], plate=[0.5,0.905], mitt=[0.5,0.93];
      if(tt<tp)return [mound[0],hlLerp(mound[1],plate[1],tt/tp),0];
      if(flight){ if(tt<tl){ const s=(tt-tp)/(tl-tp); return [hlLerp(HOME[0],c.land[0],s),hlLerp(HOME[1],c.land[1],s),Math.sin(s*Math.PI)*(c.arc||0.05)] }
        if(K==="hr")return [c.land[0],c.land[1],0];
        if(tt<tGet){ const s=(tt-tl)/(tGet-tl); return [hlLerp(c.land[0],roll[0],s),hlLerp(c.land[1],roll[1],s),Math.abs(Math.sin(s*Math.PI*2))*0.008*(1-s)] }
        const s=Math.min(1,(tt-tGet-0.03)/0.16); if(s<=0)return [roll[0],roll[1],0];
        return [hlLerp(roll[0],throwTo[0],s),hlLerp(roll[1],throwTo[1],s),Math.sin(s*Math.PI)*0.03] }
      if(K==="kk"){ const s=Math.min(1,(tt-tp)/(tl-tp)); return [0.5,hlLerp(plate[1],mitt[1],s),0] }
      if(K==="cs"){ if(tt<tp+0.08)return [0.5,hlLerp(plate[1],mitt[1],(tt-tp)/0.08),0]; const s=Math.min(1,(tt-tp-0.08)/(tl-tp-0.08)); return [hlLerp(0.5,bases[2][0],s),hlLerp(mitt[1],bases[2][1],s),Math.sin(s*Math.PI)*0.02] }
      if(K==="go"){ const fd=F[gbTo], g1=0.42; if(tt<g1){ const s=(tt-tp)/(g1-tp); return [hlLerp(HOME[0],fd[0],s),hlLerp(HOME[1],fd[1],s),0] }
        const s=Math.min(1,(tt-g1-0.03)/(tl-g1-0.03)); if(s<=0)return [fd[0],fd[1],0]; return [hlLerp(fd[0],bases[1][0],s),hlLerp(fd[1],bases[1][1],s),Math.sin(s*Math.PI)*0.015] }
      // a double play: the grounder, the flip to second, the throw to first
      const fd=F[c.dpTo], g1=0.4, g2=0.53;
      if(tt<g1){ const s=(tt-tp)/(g1-tp); return [hlLerp(HOME[0],fd[0],s),hlLerp(HOME[1],fd[1],s),0] }
      if(tt<g2){ const s=(tt-g1)/(g2-g1); return [hlLerp(fd[0],bases[2][0],s),hlLerp(fd[1],bases[2][1],s),0] }
      const s=Math.min(1,(tt-g2)/(tl-g2)); return [hlLerp(bases[2][0],bases[1][0],s),hlLerp(bases[2][1],bases[1][1],s),Math.sin(s*Math.PI)*0.015] };
    const [bx,by,z]=ballAt(t);
    // the fielders
    const goal=K==="hr"?wallAt:K==="hit"?roll:[Math.max(0.08,Math.min(0.92,c.land[0])),Math.max(0.06,c.land[1])];
    const chase=flight&&t>tp?Math.min(1,(t-tp)/((K==="hit"?tGet:tl)-tp)):0;
    F.forEach((p,i)=>{ let q=p;
      if(flight&&i===fi)q=[hlLerp(p[0],goal[0],hlEase(chase)),hlLerp(p[1],goal[1],hlEase(chase))];
      if((K==="dp"&&i===(c.dpTo===4?3:4))||(K==="cs"&&i===4)||(flight&&K!=="hr"&&i===(c.land[0]<0.5?4:3))){ const s=Math.min(1,Math.max(0,(t-tp)/0.25)); q=[hlLerp(p[0],bases[2][0],s),hlLerp(p[1],bases[2][1]+0.01,s)] }
      if((K==="dp"||K==="go")&&i===2){ const s=Math.min(1,Math.max(0,(t-tp)/0.3)); q=[hlLerp(p[0],bases[1][0]-0.01,s),hlLerp(p[1],bases[1][1],s)] }
      if(K==="go"&&i===gbTo){ const s=Math.min(1,Math.max(0,(t-tp)/(0.42-tp))); q=[hlLerp(p[0],p[0]+(HOME[0]-p[0])*0.12,s),hlLerp(p[1],p[1]+(HOME[1]-p[1])*0.12,s)] }
      if(K==="sf"&&i===1&&t>tl)q=[0.5,hlLerp(0.95,0.91,Math.min(1,(t-tl)/0.1))];
      const [px,py]=P(q[0],q[1]); hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)","",c.fn&&c.fn[i]?{num:c.fn[i][0],sub:c.fn[i][1]}:null) });
    // the batter and the runners, by name (round 70)
    const after=Math.max(0,(t-tp)/(1-tp)), hitN=c.e.hit||1;
    let bRun=K==="hr"?after*4:K==="hit"?after*Math.min(3,hitN):K==="sf"||K==="fo"?Math.min(0.7,after*1.4):K==="dp"||K==="go"?Math.min(0.95,after*1.3):0;
    const [bxp,byp]=P(...along(bRun)); hlDot(x,bxp,byp,r,ink,"rgba(0,0,0,.6)",t>=tl&&c.kind!=="end"?c.nm:"",c.bno!=null?{num:c.bno,sub:c.nm}:{sub:c.nm});
    const runAt=(start,k,nm)=>{ const v=Math.min(4,start+k); if(v>=4)return; const [rx,ry]=P(...along(v)); hlDot(x,rx,ry,r,ink,"rgba(0,0,0,.6)","",nm?{sub:nm}:null) };
    const on=c.on&&c.on.length===3?c.on:null;
    if(on){ // the men who were on: the leading ones score, the rest move up behind them
      const occ=[2,1,0].filter(i=>on[i]), scoring=K==="hr"?occ.length:K==="hit"?Math.min(occ.length,c.n):K==="sf"?1:0;
      let cap=K==="hit"?Math.min(3,hitN)-1:3;   // the batter's base, a runner stays ahead of it
      occ.forEach((i,k)=>{ const st=i+1; let fin=st;
        if(k<scoring)fin=4; else if(K==="hit"){ fin=Math.min(3,st+hitN); cap=Math.max(cap,0) }
        else if(K==="dp"&&i===0)fin=1.95; else if(K==="cs"&&i===0)fin=2;
        const sp=K==="cs"?Math.min(1,Math.max(0,(t-tp+0.05)/(tl-tp+0.03))):K==="sf"?(t<tl?0:Math.min(1,(t-tl)/(1-tl)*1.1)):Math.min(1,after*1.3);
        const lead=K==="kk"||K==="go"||K==="fo"?0.06:0;
        runAt(st,(fin-st)*sp+lead,on[i]) }) }
    else if(K==="hr"||K==="hit")for(let k=0;k<Math.min(3,c.runners);k++)runAt(3-k,bRun,"");
    else if(K==="sf")runAt(3,t<tl?0.08:Math.min(1,(t-tl)/(1-tl)*1.1),"");
    else if(K==="kk")for(let k=0;k<c.runners;k++)runAt(1+k,0.06,"");
    else if(K==="dp")runAt(1,Math.min(0.95,after*1.2),"");
    else if(K==="cs")runAt(1,Math.min(1,Math.max(0,(t-tp+0.05)/(tl-tp+0.03))),"");
    const tr=[]; for(let q=8;q>=1;q--){ const b=ballAt(t-q*0.012); const pp=P(b[0],b[1]); tr.push([pp[0],pp[1]-b[2]*H]) }
    const [qx,qy]=P(bx,by); hlBall(x,qx,qy,r*0.55,z*H,t>tp?tr:null,{ring:"#C8102E"});
    // the man at the plate and the man on the mound, low down either side (round 70: Ian)
    if(c.panels){ const pw=Math.min(W*0.28,170), fs=Math.max(9,Math.round(pw/12)), ph=fs*3.3, py=H*0.66;
      const card=(l,cap,o,col)=>{ if(!o||!o.nm)return; x.save(); x.fillStyle="rgba(10,12,18,.84)"; hlRound(x,l,py,pw,ph,5); x.fill(); x.fillStyle=col; x.fillRect(l,py,3,ph);
        x.textAlign="left"; x.textBaseline="top"; x.fillStyle="rgba(255,255,255,.55)"; x.font=`600 ${Math.round(fs*0.8)}px 'Barlow Condensed',Impact,sans-serif`; x.fillText(cap,l+9,py+fs*0.35);
        x.fillStyle="#fff"; x.font=`700 ${Math.round(fs*1.15)}px 'Barlow Condensed',Impact,sans-serif`; x.fillText(o.nm,l+9,py+fs*1.15,pw-14);
        x.fillStyle="rgba(255,226,92,.95)"; x.font=`500 ${Math.round(fs*0.85)}px 'IBM Plex Mono',monospace`; x.fillText(o.line,l+9,py+fs*2.35,pw-14); x.restore() };
      card(8,"AT BAT",c.panels.bat,ink); card(W-8-pw,"PITCHING",c.panels.pit,dink) }
    // the inning only, until it's done: the result waits for the ball (round 67)
    const onTxt=on?(()=>{ const b=[0,1,2].filter(i=>on[i]).map(i=>["1st","2nd","3rd"][i]); return !b.length?"bases empty":b.length===3?"bases loaded":(b.length===1?"runner on ":"runners on ")+b.join(" and ") })():"";
    const top=c.kind==="end"?`${c.half} ${ordw(c.inn)} · ${c.outs} out · ${onTxt}${c.gap?` · down ${c.gap}`:" · tied"}`
      :`${ordw(c.inn)}${K==="kk"?" · runners on":""}`;
    const HITS=["","single","double","triple"];
    const end=t<tl?null:c.kind==="end"?(K==="kk"?"STRIKE THREE! Ballgame":K==="fo"?"CAUGHT! Ballgame":K==="dp"?"DOUBLE PLAY! Ballgame":"OUT AT FIRST! Ballgame")
      :K==="hr"?(c.n===4?`GRAND SLAM! ${c.nm}${c.ft?` · ${c.ft} ft`:""}`:`HOME RUN! ${c.nm}${c.ft?` · ${c.ft} ft`:""}`)
      :K==="hit"?`${c.nm}: ${HITS[c.e.hit||1]}, ${c.n} in`:K==="sf"?"Caught at the wall! The run scores"
      :K==="kk"?`STRIKE THREE! ${c.runners} left on`:K==="dp"?"DOUBLE PLAY!":K==="cs"?"CAUGHT STEALING!":null;
    hlCaption(x,W,H,top,end,K==="dp"||K==="kk"||K==="cs"||c.kind==="end"?dink:ink);
  }
  /* the crowd at the moment the run crosses (round 70: Ian, a celebration for your home runs, a smaller one for a run) */
  function sound(c){ if(!c.after||typeof sfx!=="function")return false; const mine=(c.side==="home")===(live&&live.g.home===S.myTeam);
    sfx(mine?(c.kind==="hr"?"hr":"run"):"against"); return true }

  // round 72: the header says the inning a clip shows ("After the 1st" stayed up through the 2nd's home run)
  const headClock=c=>c&&c.inn&&c.half?`${c.half} of the ${ordw(c.inn)}`:null;
  /* round 111: live player stats from the log, as far as the screen has shown: each batter's hits and at-bats, homers, runs batted in, walks */
  const lsOut=(rows,key,line)=>{ const T={}; Object.values(rows).forEach(r=>{ (T[r.tm]=T[r.tm]||[]).push(r) }); Object.keys(T).forEach(tm=>{ T[tm]=T[tm].sort(key).map(r=>({nm:r.nm,line:line(r)})).filter(r=>r.line) }); return T };
  function liveStats(L){ const g=L.g, rows={};
    const add=q=>{ if(!q||q.t!=="pa")return; const tm=q.s===0?g.home:g.away, key=tm+"|"+q.nm, r=rows[key]=rows[key]||{tm,nm:sur(q.nm),ab:0,h:0,hr:0,rbi:0,bb:0,k:0}, o=q.o;
      if(o==="bb"||o==="hbp")r.bb++; else if(!q.sf)r.ab++; if(o==="s1"||o==="s2"||o==="s3"||o==="hr")r.h++; if(o==="hr")r.hr++; if(o==="k")r.k++; r.rbi+=q.runs||0 };
    (typeof liveShown==="function"?liveShown():L.drives).forEach(d=>(d.pl||[]).forEach(add));
    const P=L.pb; if(P&&P.d&&!L.done&&Array.isArray(P.d.pl)){ const d=P.d, it=pbItems(d,P.from||0,P.to), el=P.frozen!=null?P.frozen:Date.now()-P.at, T=Math.min(1,el/Math.max(1,P.ms))*it.tot;
      d.pl.forEach((q,i)=>{ if(i<(P.from||0))add(q) }); it.P.forEach(C=>{ if(C.G&&C.at+C.tc+C.G.tEnd<=T)add(C.q) }) }
    return lsOut(rows,(a,b)=>b.h-a.h||b.rbi-a.rbi||b.bb-a.bb,r=>r.ab+r.bb?`${r.h} for ${r.ab}${r.hr?", "+(r.hr>1?r.hr+" HR":"HR"):""}${r.rbi?", "+r.rbi+" RBI":""}${r.bb?", "+r.bb+" BB":""}${r.k?", "+r.k+" K":""}`:"") }
  return {liveStats, drawPos:()=>pbDraw.pos||null, reveal:0.72, collapseIdle:true, ambient:true, aspect:0.62, clips, pitch, idle, frame, sound, headClock, playback, goalsLabel:"Big home runs", bsPitches, bsCount};
})();
