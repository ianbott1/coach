/* Basketball's highlights (round 51, core 97_highlights): a stretch's big basket from the engine's event (a three, an
   and-one inside), and the last shot of a game, played out on a court by ten dots. The man the commentary names takes
   the shot. In "key" mode, one basket a stretch while the game is within ten, and every last shot; "goals" mode keeps
   only the last five minutes of a close game and the last shot. The home side attacks to the right. */
const HL_SPORT=(function(){
  const PADX=0.03, PADY=0.05, RIM=[0.945,0.5];
  // attack frame: 0 the side's own baseline, 1 the one it attacks. PG, SG, SF, PF, C
  const ATT=[[0.64,0.5],[0.76,0.12],[0.77,0.88],[0.86,0.3],[0.9,0.66]];
  const BENCH_P=[0,0.45,0.3,0.05,0,0.45,0.3,0.05];
  /* who's on the floor for a stretch (round 80: starters open each half and close, the bench in for parts of each
     quarter); the shooter's slot (si) is the man the run of play names. Round 100: the full match's play between the
     moments uses it too, so every man there has his number and name (Grokbot: "a court of unnamed dots") */
  function onFloor(team,salt,seg,bn,si,nm){ const R=(SEA.roster&&SEA.roster[team])||[], hurt=new Set(SEA.talent?SEA.talent.active(team).map(x=>x.idx):[]), bk=i=>typeof BK==="function"?BK(i):i+5;
    let h=0; for(const ch of team+salt)h=(h*31+ch.charCodeAt(0))>>>0;
    return [0,1,2,3,4].map(i=>{ const st=hurt.has(i)?-1:i, b=R[bk(i)]&&!hurt.has(bk(i))?bk(i):-1;
      if(i===si){ if(b>=0&&R[b].n===nm)return b; if(st>=0)return st; return b>=0?b:i }
      const x=(((h+i*97+(seg+1)*53)%100)+0.5)/100, benchIn=bn||(seg>=0&&x<(BENCH_P[seg%8]||0));
      return st<0?(b>=0?b:i):benchIn&&b>=0?b:st }) }
  function clips(L,d,mode){
    const g=L.g, out=[];
    if(d.seg==="last"){ out.push(mk(L,{k:d.made?"last":"lastmiss",side:d.side,u:(d.sh*7+d.sa*13)%100,choice:d.choice,m:"0:04"},d)); return out }
    if(mode==="full"&&Array.isArray(d.pl)&&d.pl.length)return out;   // round 101: the full match plays every possession instead
    const SG=typeof SEGS!=="undefined"?SEGS:8, late=d.seg>=SG-1, close=Math.abs(d.sh-d.sa)<=(late?5:10);
    if(mode==="goals"&&!(late&&close))return out;
    const all=mode==="all"||mode==="full";   // round 68: every big basket, whatever the score
    if(!close&&!all)return out;
    const ev=(d.ev||[]).filter(e=>e.k==="three"||e.k==="inside");
    if(!ev.length)return out;
    // the stretch's moment: the last side to score big, its draw picking which
    const e=ev[(ev.length-1+((ev[0].u||0)%2))%ev.length];
    const all2=d.ev||[], pos=(all2.indexOf(e)+1)/(all2.length+1);
    out.push(mk(L,Object.assign({},e,{m:segMoment(d.seg,pos)}),d));   // round 93: the moment inside its stretch (every clip read the stretch's end: "End of Q4" at 84-94 of a 105-106 game)
    return out;
  }
  function mk(L,e,d){
    const g=L.g, tm=e.side==="home"?g.home:g.away, u=e.u||0;
    const r=mulberry32((u*131+(typeof e.m==="string"?e.m.length*977:0)+(e.side==="home"?17:29))>>>0);
    const kind=e.k==="last"||e.k==="lastmiss"?(e.choice==="three"?"three":"two"):e.k;
    const made=e.k!=="lastmiss";
    const idx=kind==="three"?[1,2,0,1,2][u%5]:kind==="inside"?[4,3,4,2][u%4]:(u%2?0:1);
    const bnA=!!(d&&d.bn&&d.bn[e.side]), bnD=!!(d&&d.bn&&d.bn[e.side==="home"?"away":"home"]);
    let nm=""; try{ nm=bbPlayer(tm,idx,u,bnA)||(e.k==="last"||e.k==="lastmiss"?bbStar(tm):"") }catch(er){}
    if(e.k==="last"||e.k==="lastmiss"){ try{ nm=bbStar(tm) }catch(er){} }
    // the spot: a three from the corner, the wing or the top; inside at the rim; a two from the elbow
    const spot=kind==="three"?[[0.92,0.035],[0.77,0.14],[0.69,0.5],[0.77,0.86],[0.92,0.965]][Math.floor(r()*5)]:kind==="inside"?[0.93,0.5+(r()-0.5)*0.12]:[0.84,0.38+r()*0.24];
    // ball movement: two or three passes round the perimeter, then the shooter
    const W=[[0.62,0.5]]; const k=1+Math.floor(r()*2);
    for(let i=0;i<k;i++)W.push([[0.76,0.15],[0.7,0.5],[0.76,0.85]][Math.floor(r()*3)]);
    if(kind==="inside")W.push([0.82,0.5+(r()-0.5)*0.4]);
    W.push(spot);
    const rec=W.map((w,i)=>{ if(i===W.length-1)return idx; let b=0,bd=9; ATT.forEach((p,j)=>{ if(j===idx)return; const dd=Math.hypot(p[0]-w[0],p[1]-w[1]); if(dd<bd){bd=dd;b=j} }); return b });
    const inks=hlKits(g.home,g.away).map(k=>k.fill), last=e.k==="last"||e.k==="lastmiss";
    // round 67: every man on the floor by number and name (Ian: only the ball carrier was named)
    // round 80: rotations (Ian): who's on the floor follows the stretch: starters to open each half and to close, the bench
    // in for the late first and third quarters and the start of the second and fourth (about the bench's fifth of the
    // minutes), each position on its own rhythm; the shooter's man is the one the run of play names, starter or backup
    const opp=e.side==="home"?g.away:g.home, seg=d&&typeof d.seg==="number"?d.seg:-1;
    const floor=(team,salt,shooter,bn)=>onFloor(team,salt,seg,bn,shooter?idx:-1,nm);
    const an=hlNamed(tm,floor(tm,"a",true,bnA)), dn=hlNamed(opp,floor(opp,"d",false,bnD)), kits=hlKits(g.home,g.away);
    const legend=[{team:tm,kit:kits[e.side==="home"?0:1],list:an.filter(Boolean)},{team:opp,kit:kits[e.side==="home"?1:0],list:dn.filter(Boolean)}];
    return {kind,made,last,e,tm,home:e.side==="home",W,rec,nm:nm?String(nm).split(" ").slice(-1)[0]:"",m:e.m,base:last?3600:2600,inks,an,dn,legend,
      andOne:kind==="inside",text:""};
  }
  const P=(W,H,c,a,y)=>{ const X=c.home?a:1-a, Y=c.home?y:1-y; return [W*PADX+X*W*(1-2*PADX), H*PADY+Y*H*(1-2*PADY)] };
  function pitch(x,W,H){
    const bg=x.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#161B26"); bg.addColorStop(1,"#0E121A"); x.fillStyle=bg; x.fillRect(0,0,W,H);
    const L=W*PADX, T=H*PADY, w=W*(1-2*PADX), h=H*(1-2*PADY);
    // the apron, then maple boards running the length of the floor, each its own shade, with grain
    x.fillStyle="#7A4E2A"; x.fillRect(L-W*0.012,T-H*0.02,w+W*0.024,h+H*0.04);
    { const r=mulberry32(3), bh=Math.max(3,h/34); for(let yy=T,row=0;yy<T+h;yy+=bh,row++){ let xx=L-r()*w*0.2;
        while(xx<L+w){ const bl=w*(0.12+r()*0.18), tone=r(); x.fillStyle=`rgb(${Math.round(206+tone*22)},${Math.round(160+tone*18)},${Math.round(104+tone*14)})`;
          x.fillRect(Math.max(L,xx),yy,Math.min(bl,L+w-Math.max(L,xx)),Math.min(bh,T+h-yy)); x.fillStyle="rgba(90,55,25,.18)"; x.fillRect(Math.max(L,xx),yy,0.7,Math.min(bh,T+h-yy)); xx+=bl }
        x.fillStyle="rgba(90,55,25,.12)"; x.fillRect(L,yy,w,0.6) }
      for(let k=0;k<260;k++){ const gx=L+r()*w, gy=T+r()*h; x.fillStyle=`rgba(120,75,35,${0.05+r()*0.08})`; x.fillRect(gx,gy,4+r()*18,0.6) } }
    // varnish: the arena lights reflected down the middle
    const gl=x.createLinearGradient(0,T,0,T+h); gl.addColorStop(0,"rgba(255,255,255,0)"); gl.addColorStop(0.5,"rgba(255,248,230,.16)"); gl.addColorStop(1,"rgba(255,255,255,0)"); x.fillStyle=gl; x.fillRect(L,T,w,h);
    const lw=Math.max(1.3,W/480);
    // the painted lanes and the centre circle
    [[RIM[0],1],[1-RIM[0],-1]].forEach(([rx,sd])=>{ x.fillStyle="rgba(28,58,120,.78)"; x.fillRect(sd>0?L+w*0.81:L,T+h*0.34,w*0.19,h*0.32) });
    x.beginPath(); x.arc(L+w/2,T+h/2,h*0.12,0,Math.PI*2); x.fillStyle="rgba(28,58,120,.55)"; x.fill();
    hlLines(x,lw,()=>{
      x.strokeRect(L,T,w,h);
      x.beginPath(); x.moveTo(L+w/2,T); x.lineTo(L+w/2,T+h); x.stroke(); x.beginPath(); x.arc(L+w/2,T+h/2,h*0.12,0,Math.PI*2); x.stroke();
      x.beginPath(); x.arc(L+w/2,T+h/2,h*0.04,0,Math.PI*2); x.stroke();
      [[RIM[0],1],[1-RIM[0],-1]].forEach(([rx,sd])=>{ const cx=L+rx*w, cy=T+h/2;
        x.strokeRect(sd>0?L+w*0.81:L,T+h*0.34,w*0.19,h*0.32);
        const fx=sd>0?L+w*0.81:L+w*0.19; x.beginPath(); x.arc(fx,cy,h*0.12,sd>0?Math.PI/2:-Math.PI/2,sd>0?Math.PI*1.5:Math.PI/2); x.stroke();
        // the three-point line: straight from the baseline in the corners, then the arc round the rim
        const Rr=h*0.45, th=Math.asin(Math.min(0.999,0.44/0.45));
        x.beginPath(); x.moveTo(sd>0?L+w:L,cy-h*0.44); x.lineTo(cx-sd*Rr*Math.cos(th),cy-h*0.44);
        x.arc(cx,cy,Rr,sd>0?Math.PI+th:-th,sd>0?Math.PI-th:th,sd>0); x.lineTo(sd>0?L+w:L,cy+h*0.44); x.stroke();
        // the restricted-area arc and lane hash marks
        x.beginPath(); x.arc(cx,cy,h*0.08,sd>0?Math.PI/2:-Math.PI/2,sd>0?Math.PI*1.5:Math.PI/2); x.stroke();
        [0.86,0.9].forEach(fz=>{ const hx=sd>0?L+w*fz:L+w*(1-fz); x.beginPath(); x.moveTo(hx,T+h*0.34); x.lineTo(hx,T+h*0.32); x.moveTo(hx,T+h*0.66); x.lineTo(hx,T+h*0.68); x.stroke() }) });
    });
    // the baskets: backboard, rim, net
    [[RIM[0],1],[1-RIM[0],-1]].forEach(([rx,sd])=>{ const cx=L+rx*w, cy=T+h/2, rr=Math.max(3,w*0.012);
      x.fillStyle="rgba(240,244,248,.9)"; x.fillRect(cx+sd*rr*1.6-(sd>0?0:2),cy-h*0.09,2.2,h*0.18);
      x.beginPath(); x.arc(cx,cy,rr,0,Math.PI*2); x.fillStyle="rgba(255,255,255,.35)"; x.fill();
      x.strokeStyle="rgba(255,255,255,.6)"; x.lineWidth=0.6; for(let a=0;a<6;a++){ x.beginPath(); x.moveTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr); x.lineTo(cx+Math.cos(a+1.2)*rr*0.4,cy+Math.sin(a+1.2)*rr*0.4); x.stroke() }
      x.beginPath(); x.arc(cx,cy,rr,0,Math.PI*2); x.strokeStyle="#E8553D"; x.lineWidth=2; x.stroke() });
  }
  /* ---- the full match (round 98: "watch it, not read it") ----
     Between the moments the floor keeps playing: possessions trade ends, the ball worked round the arc by passes, each
     defender between his man and the rim, never a shot (the shots are the clips). Drawn from the clock, not stored. */
  function ambient(x,W,H){
    if(typeof live==="undefined"||!live||live.done||!live.g)return;
    const g=live.g, PD=6500, DT=1100, TR=2100, now=Date.now(), seed=((live.step||0)*7919+(live.g.home||"").length*131)>>>0;
    const hz=(a,b)=>strHash(seed+"|"+a+"|"+b);
    const sway=(i,T)=>[Math.sin(T/700+i*1.7)*0.012,Math.cos(T/830+i*2.3)*0.02];
    const holder=(k,j)=>{ if(j<=0)return 0; const p=holder(k,j-1), h=1+hz(k,j)%4; return (p+h)%5 };   // never to himself
    const defOf=(A,bi)=>A.map(([a,y],i)=>{ const d=i===bi?0.3:0.22; return [hlLerp(a,RIM[0],d),hlLerp(y,RIM[1],d)] });
    const mir=p=>[1-p[0],1-p[1]];
    const at=T=>{ const k=Math.floor(T/PD), tIn=T-k*PD, home=k%2===0, j=Math.floor(tIn/DT), hj=holder(k,j);
      const set=ATT.map((p,i)=>{ const s=sway(i,T); return [p[0]+s[0],p[1]+s[1]] });
      // round 99: the man with it puts it on the floor and drives at the rim once a trip, then kicks it out
      { const dj=2+hz(k,99)%3; if(j===dj){ const ph0=(tIn-j*DT)/DT, d=Math.sin(Math.min(1,ph0)*Math.PI)*0.55; set[hj]=[hlLerp(set[hj][0],RIM[0]-0.05,d),hlLerp(set[hj][1],RIM[1],d)] } }
      // the ball between two men while a pass is in the air, else with the man who has it
      let ball; const ph=(tIn-j*DT)/DT; if(j>0&&ph<0.32){ const a=set[holder(k,j-1)], b=set[hj], e=hlEase(ph/0.32); ball=[hlLerp(a[0],b[0],e),hlLerp(a[1],b[1],e)] } else ball=[set[hj][0]-0.012,set[hj][1]];
      let att=set, def=defOf(set,j>0&&ph<0.32?-1:hj);
      if(tIn<TR){ // bringing it up: last trip's defenders run up, last trip's attackers get back
        const e=hlEase(tIn/TR), pAtt=ATT, pDef=defOf(ATT,0), fromA=pDef.map(mir), fromD=pAtt.map(mir);
        att=set.map((p,i)=>[hlLerp(fromA[i][0],p[0],e),hlLerp(fromA[i][1],p[1],e)]); def=def.map((p,i)=>[hlLerp(fromD[i][0],p[0],e),hlLerp(fromD[i][1],p[1],e)]); ball=[att[0][0]-0.015,att[0][1]] }
      return {home,att,def,ball,air:j>0&&ph<0.32&&tIn>=TR,up:tIn<TR} };
    const b=at(now), c={home:b.home}, kits=hlKits(g.home,g.away), r=Math.max(5,W/80), ink=kits[b.home?0:1].fill, dink=kits[b.home?1:0].fill;
    // the men on the floor now: the stretch being played, the bench in when the last one ended with it on (d.bn)
    const seg=live.drives.length, ld=live.drives[seg-1], aT=b.home?g.home:g.away, dT=b.home?g.away:g.home, aS=b.home?"home":"away", dS=b.home?"away":"home";
    const key=seg+"|"+aT, CA=ambient._c=ambient._c&&ambient._c.k===key&&ambient._c.L===live?ambient._c:{k:key,L:live,
      an:hlNamed(aT,onFloor(aT,"a",seg,!!(ld&&ld.bn&&ld.bn[aS]),-1,"")),dn:hlNamed(dT,onFloor(dT,"d",seg,!!(ld&&ld.bn&&ld.bn[dS]),-1,""))};
    const scr=b.att.map(p=>P(W,H,c,p[0],p[1])), crowd=(px,py)=>scr.some(q=>Math.abs(q[0]-px)<r*5&&Math.abs(q[1]-py)<r*2.6);
    b.def.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]), q=CA.dn[i]; hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)","",q?{num:q[0],sub:crowd(px,py)?"":q[1]}:null) });
    b.att.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]), q=CA.an[i]; hlDot(x,px,py,r,ink,"rgba(0,0,0,.6)","",q?{num:q[0],sub:q[1]}:null) });
    // round 99 (Ian: "still not seeing dribbling"): a ball in a man's hands is dribbled: it bounces at his side, the
    // shadow on the floor, quicker on the move up the floor
    let [qx,qy]=P(W,H,c,b.ball[0],b.ball[1]); const held=!b.air, bo=held?Math.abs(Math.sin(now/(b.up?120:150)))*r*1.3:0;
    if(held){ qx+=(b.home?1:-1)*r*0.15; qy+=r*0.75 }
    hlBall(x,qx,qy,r*0.62,bo,null,{fill:"#E8702A",ring:"#2a1406"});
    const Hd=live.hold, hs=Hd?Hd.h:live.eng.h, as=Hd?Hd.a:live.eng.a, SG=typeof SEGS!=="undefined"?SEGS:8, q=Math.min(4,Math.floor(live.drives.length*4/SG)+1);
    hlBug(x,W,H,{home:g.home,away:g.away,hs:hs,as:as,hk:kits[0],ak:kits[1],clock:(Hd&&Hd.clock)||"Q"+q});
  }
  /* ---- round 101: the full match, possession by possession (Ian: "as realistic as possible ... in Football Manager I
     would do this all the time") ----
     The engine keeps each possession of the game on screen (d.pl, read off the box-score lines, no draws). The court
     plays them back in order: the clock runs through the stretch, the ball is brought up and worked round, and each
     possession ends as it did: a basket (the score moves as it drops), a miss and the rebound (an offensive board goes
     again), a turnover, free throws. The page holds the score until the stretch is over and moves it basket by basket.
     Who: the stretch's five on each side (onFloor, one five a side for the stretch), the shooter by position from the
     possession's own hash: the team totals are the engine's, the names are the screen's (the box score credits its own). */
  const PB_W={to:0.8, att:1, ft:0.9, base:0.55}, BB_VMAX=3.5;   // courts a unit of the playback's own clock at most (a unit is 700 ms at Normal), round 108: it holds a man back only on a jump (4% of man-frames, 0.05 m behind on average; test/bb-motion.js)
  const pbSeed=(d,i,k)=>strHash((live&&live.step||0)+"|"+d.seg+"|"+i+"|"+k);
  const pickBy=(w,u)=>{ let t=w.reduce((a,b)=>a+b,0), x=(u%1000)/1000*t; for(let i=0;i<w.length;i++){ x-=w[i]; if(x<0)return i } return w.length-1 };
  const W3=[25,30,25,12,8], W2=[14,14,20,26,26], WTO=[40,25,15,12,8], WRB=[6,8,14,32,40], WST=[30,26,20,14,10];
  function pbActs(d,i,p){   // [side, to, fta, ftm, tpa, tpm, fga2, fgm2, oreb, late]
    const sd=p[0], to=p[1], fta=p[2], ftm=p[3], tpa=p[4], tpm=p[5], fga2=p[6], fgm2=p[7], ob=p[8], late=p[9];
    const A=[], u=k=>pbSeed(d,i,k);
    let x3=tpa-tpm, x2=fga2-fgm2, k=0;
    const miss=(off)=>{ const three=x3>0&&(x2<=0||u("m"+k)%2===0); if(three)x3--; else x2--; A.push({t:"miss",three:three,who:pickBy(three?W3:W2,u("s"+k)),reb:off?"off":"def",rb:pickBy(WRB,u("r"+k))}); k++ };
    if(to&&!tpa&&!fga2&&!fta){ A.push({t:"to",who:pickBy(WTO,u("t")),st:pickBy(WST,u("st"))}); return A }
    for(let j=0;j<ob;j++)miss(true);
    if(tpm||fgm2){ const three=!!tpm; A.push({t:"make",three:three,who:pickBy(three?W3:W2,u("s"+k)),pts:three?3:2,and1:!three&&fta===1,ftm:ftm}); return A }
    if(fta>=2){ A.push({t:"ft",n:fta,m:ftm,late:!!late,who:late?pickBy(WTO,u("f")):pickBy(fta===3?W3:W2,u("f"))}); return A }
    if(x3>0||x2>0)miss(false);
    if(to)A.push({t:"to",who:pickBy(WTO,u("t")),st:pickBy(WST,u("st"))});
    return A }
  function pbPlan(d){
    if(d._pb)return d._pb; const out=[]; let tot=0;
    (d.pl||[]).forEach((p,i)=>{ const acts=pbActs(d,i,p); let w=PB_W.base; acts.forEach(a=>{ w+=a.t==="to"?PB_W.to:a.t==="ft"?PB_W.ft:PB_W.att });
      out.push({side:p[0],acts:acts,w:w,at:tot,pts:2*p[7]+3*p[5]+p[3]}); tot+=w });
    return d._pb={P:out,tot:tot} }
  /* the men the screen showed scoring in a stretch it played back: [side 0/1, kind 3 / 2 / 1 (a free throw), roster slot],
     kept with the game so the box score credits them (teamLines) */
  function namesOf(L,d){ if(!d||!Array.isArray(d.pl))return null; const g=L.g, plan=pbPlan(d), out=[];
    const five={0:onFloor(g.home,"f",d.seg,!!(d.bn&&d.bn.home),-1,""),1:onFloor(g.away,"f",d.seg,!!(d.bn&&d.bn.away),-1,"")};
    plan.P.forEach(q=>q.acts.forEach(a=>{ const sl=five[q.side][a.who]; if(sl==null)return;
      if(a.t==="make"){ out.push([q.side,a.three?3:2,sl]); if(a.and1&&a.ftm)out.push([q.side,1,sl]) }
      else if(a.t==="ft"){ for(let z=0;z<a.m;z++)out.push([q.side,1,sl]) } }));
    return out }
  /* how long the stretch takes on screen (ms), or 0 where there's nothing to play back */
  function playback(L,d){ if(!d||!Array.isArray(d.pl)||!d.pl.length)return 0;
    const sp=typeof speedMult==="function"?speedMult():1; return Math.round(pbPlan(d).tot*700/Math.pow(Math.max(0.25,sp),0.75)) }
  // the clock at a fraction of a stretch (the full stretch, unclamped)
  const clockAt=(s,f)=>{ f=Math.max(0,Math.min(1,f)); const mm=x=>{ const t=Math.max(0,Math.round(x*60)), m=Math.floor(t/60), sec=t%60; return m+":"+(sec<10?"0":"")+sec };
    if(s>=8)return "OT"+(s-7>1?(s-7):"")+" "+mm(5*(1-f));
    if(BB.quarters){ const q=Math.floor(s/2)+1, start=s%2?6:12; return "Q"+q+" "+mm(start-6*f) }
    return (s<4?"1st":"2nd")+" "+mm(20-5*(s%4)-5*f) };
  // the page's own scoreboard follows the basket that just dropped (it is held while the stretch plays)
  let pbShown="";
  function pbPatch(h,a,clock){ const k=h+"|"+a+"|"+clock; if(k===pbShown)return; pbShown=k;
    if(live.hold){ live.hold.h=h; live.hold.a=a; live.hold.clock=clock }
    if(typeof lwRefresh==="function")setTimeout(lwRefresh,0);
    try{ const top=document.querySelector(".wtop"); if(!top)return; const sd=top.querySelectorAll(".wside"), wn=top.querySelectorAll(".wn");
      if(wn.length===2){ wn[0].textContent=a; wn[1].textContent=h; sd[0].classList.toggle("lead",a>h); sd[1].classList.toggle("lead",h>a) }
      const lb=top.querySelector(".wlabel"); if(lb){ const t=lb.textContent||"", i=t.indexOf("\u00b7"); lb.innerHTML=`<span class="live"></span>${esc(clock)}${i>=0?" "+esc(t.slice(i).replace(/\s+/g," ")):""}` }
      if(typeof miniBar==="function")miniBar() }catch(e){} }
  function pbDraw(x,W,H){
    const PB=live.pb, d=PB.d, plan=pbPlan(d), el=PB.frozen!=null?PB.frozen:Date.now()-PB.at, f=Math.max(0,Math.min(0.9999,el/Math.max(1,PB.ms))), T=f*plan.tot;
    const g=live.g, kits=hlKits(g.home,g.away), r=Math.max(5,W/80);
    let pi=plan.P.findIndex(q=>T<q.at+q.w); if(pi<0)pi=plan.P.length-1;
    const cur=plan.P[pi], u=(T-cur.at)/cur.w;   // 0..1 through this possession
    // the score: every basket of the possessions before this one, and this one's once it has dropped
    let hs=PB.h0, as=PB.a0; for(let j=0;j<pi;j++){ if(plan.P[j].side===0)hs+=plan.P[j].pts; else as+=plan.P[j].pts }
    const home=cur.side===0, aT=home?g.home:g.away, dT=home?g.away:g.home, c={home:home};
    const bnA=!!(d.bn&&d.bn[home?"home":"away"]), bnD=!!(d.bn&&d.bn[home?"away":"home"]);
    const NM=pbDraw._n=pbDraw._n&&pbDraw._n.d===d?pbDraw._n:{d:d,home:hlNamed(g.home,onFloor(g.home,"f",d.seg,!!(d.bn&&d.bn.home),-1,"")),away:hlNamed(g.away,onFloor(g.away,"f",d.seg,!!(d.bn&&d.bn.away),-1,""))};
    const an=home?NM.home:NM.away, dn=home?NM.away:NM.home;
    // phases: bring it up (to tb), work it round (to tw), then the possession's acts share the rest
    const tb=0.22, tw=0.42, acts=cur.acts, na=acts.length;
    const seed=pbSeed(d,pi,"p"), rr=mulberry32(seed>>>0);
    const passes=[]; { let h=0; const n=1+Math.floor(rr()*3); for(let k=0;k<n;k++){ let q=Math.floor(rr()*5); if(q===h)q=(q+1)%5; passes.push(q); h=q } }
    const sway=(i)=>[Math.sin(Date.now()/700+i*1.7)*0.01,Math.cos(Date.now()/830+i*2.3)*0.016];
    // the set they run: five out, four out and one in, horns, a post-up (from the possession's own hash; a side that
    // lives on threes spreads the floor more often)
    const SETS=[ATT,[[0.66,0.5],[0.8,0.06],[0.8,0.94],[0.72,0.2],[0.72,0.8]],[[0.64,0.5],[0.79,0.1],[0.79,0.9],[0.8,0.39],[0.8,0.61]],[[0.66,0.5],[0.78,0.12],[0.76,0.86],[0.84,0.7],[0.9,0.38]]];
    const offK=(()=>{ try{ return live.eng&&live.eng.S&&live.eng.S[home?"home":"away"].off }catch(e){ return null } })();
    const setW=offK==="threes"?[20,45,15,20]:offK==="paint"?[25,10,25,40]:offK==="pnr"?[30,15,40,15]:[34,22,22,22];
    const SET=SETS[pickBy(setW,seed)];
    // off the ball: men cut and relocate through the half-court (a slow figure of eight round their spot)
    const cutT=Date.now()/1000;
    let att=SET.map((p,i)=>{ const s=sway(i), cx=Math.sin(cutT*0.9+i*2.1+seed%7)*0.035, cy=Math.sin(cutT*1.8+i*1.3)*0.05; return [Math.min(0.95,p[0]+s[0]+cx),Math.max(0.03,Math.min(0.97,p[1]+s[1]+cy))] }), ball, held=true, lift=0, top="", end="", endInk=null;
    const defOf=(A,bi)=>A.map(([a,y],i)=>{ const dd=i===bi?0.3:0.22; return [hlLerp(a,RIM[0],dd),hlLerp(y,RIM[1],dd)] });
    const SH3=[[0.92,0.035],[0.77,0.14],[0.69,0.5],[0.77,0.86],[0.92,0.965]];
    const spotOf=(a,k)=>{ const z=pbSeed(d,pi,"sp"+k); return a.three?SH3[z%5]:z%5<3?[0.925,0.5+((z>>3)%7-3)*0.02]:[0.84,0.36+((z>>4)%5)*0.07] };
    const surname=q=>q&&q[1]?String(q[1]):"";
    let holder=0, def;
    const clk=clockAt(d.seg,f);
    if(u<tb){ // bring it up: from the other end, the defence getting back
      const e=hlEase(u/tb), mir=p=>[1-p[0],1-p[1]];
      att=att.map((p,i)=>{ const m=mir(defOf(ATT,-1)[i]); return [hlLerp(m[0],p[0],e),hlLerp(m[1],p[1],e)] });
      def=defOf(att,0).map((p,i)=>{ const m=mir(ATT[i]); return [hlLerp(m[0],p[0],e),hlLerp(m[1],p[1],e)] });
      ball=[att[0][0]-0.015,att[0][1]]; top=`${clk} · ${aT} bring it up`;
    }else if(u<tw){ // the ball round the floor
      const v=(u-tb)/(tw-tb)*passes.length, k=Math.min(passes.length-1,Math.floor(v)), ph=v-k, from=k?passes[k-1]:0, to=passes[k];
      if(ph<0.35){ const e=hlEase(ph/0.35), a=att[from], b=att[to]; ball=[hlLerp(a[0],b[0],e),hlLerp(a[1],b[1],e)]; held=false; holder=-1 }
      else { holder=to; ball=[att[to][0]-0.012,att[to][1]] }
      def=defOf(att,holder); top=`${clk} · ${aT} ball`;
    }else{ // the acts: shots, boards, the turnover, free throws
      const v=(u-tw)/(1-tw)*na, k=Math.min(na-1,Math.floor(v)), ph=v-k, a=acts[k], q=an[a.who], nm=surname(q);
      if(a.t==="to"){ const sq=dn[a.st], st=surname(sq), e=hlEase(Math.min(1,ph/0.5));
        const at=att[a.who]; holder=a.who; ball=[hlLerp(at[0],0.5,ph>0.4?hlEase((ph-0.4)/0.6):0),hlLerp(at[1],0.5,ph>0.4?hlEase((ph-0.4)/0.6):0)]; held=ph>0.4;
        def=defOf(att,a.who); def[a.st]=[hlLerp(def[a.st][0],at[0],e),hlLerp(def[a.st][1],at[1],e)];
        top=`${clk} · ${nm||aT}`; end=ph>0.35?`Turnover: ${dT} take it away`:""; endInk=kits[home?1:0].fill }   // the team: the box score shares steals out its own way
      else if(a.t==="ft"){ const sp=[0.81,0.5]; att=att.map((p,i)=>i===a.who?sp:[[0.86,0.33],[0.92,0.33],[0.86,0.67],[0.92,0.67],[0.7,0.5]][i]); def=att.map((p,i)=>i===a.who?[0.72,0.5]:[p[0]+0.03,p[1]+(p[1]<0.5?-0.04:0.04)]);
        const n=a.n, j=Math.min(n-1,Math.floor(ph*n)), pj=ph*n-j;   // made ones first: the order isn't kept, the count is
        const fly=Math.min(1,pj/0.6); ball=[hlLerp(sp[0],RIM[0],hlEase(fly)),hlLerp(sp[1],RIM[1],hlEase(fly))]; lift=Math.sin(fly*Math.PI)*0.05*W; held=false;
        const ok=j<a.m; top=`${clk} · ${a.late?"Fouled to stop the clock: ":"Fouled: "}${nm||aT} at the line, ${n} shots`; end=pj>0.6?`${j+1} of ${n}: ${ok?"good":"no good"}`:"";
        if(ok&&pj>0.6){ if(home)hs+=1; else as+=1 } for(let z=0;z<j;z++)if(z<a.m){ if(home)hs+=1; else as+=1 } endInk=ok?kits[home?0:1].fill:null }
      else { // a shot: made, or missed and rebounded
        const sp=spotOf(a,k); att=att.slice(); const me=a.who, e1=hlEase(Math.min(1,ph/0.4));
        att[me]=[hlLerp(att[me][0],sp[0],e1),hlLerp(att[me][1],sp[1],e1)];
        def=defOf(att,me);
        if(ph<0.45){ holder=me; ball=[att[me][0]-0.012,att[me][1]] }
        else if(ph<0.75){ const fl=(ph-0.45)/0.3; held=false; const to=a.t==="make"?RIM:[RIM[0]-0.01,RIM[1]+0.03]; ball=[hlLerp(sp[0],to[0],hlEase(fl)),hlLerp(sp[1],to[1],hlEase(fl))]; lift=Math.sin(fl*Math.PI)*(a.three?0.09:0.06)*W }
        else if(a.t==="make"){ held=false; ball=RIM.slice(); if(home)hs+=a.pts; else as+=a.pts; if(a.and1&&ph>0.9){ if(a.ftm){ if(home)hs+=1; else as+=1 } } }
        else { const rbSide=a.reb==="off", rb=rbSide?att[a.rb]:def[a.rb], e2=hlEase((ph-0.75)/0.25);
          if(rbSide)att[a.rb]=[hlLerp(att[a.rb][0],RIM[0]-0.04,e2),hlLerp(att[a.rb][1],RIM[1],e2)]; else def[a.rb]=[hlLerp(def[a.rb][0],RIM[0]-0.04,e2),hlLerp(def[a.rb][1],RIM[1],e2)];
          held=false; ball=[hlLerp(RIM[0],RIM[0]-0.04,e2),hlLerp(RIM[1]+0.03,RIM[1],e2)] }
        top=`${clk} · ${nm||aT}${a.three?" for three":ph>=0.45?" shoots":""}`;
        if(ph>=0.75){ if(a.t==="make"){ end=`${nm||aT}${a.three?" from three!":a.and1?", and one!":": two"}`; endInk=kits[home?0:1].fill }
          else { end=a.reb==="off"?`Offensive board, ${aT}`:`No good. ${dT} rebound`; endInk=a.reb==="off"?kits[home?0:1].fill:kits[home?1:0].fill } }   // the team: the box score shares boards out its own way
      }
    }
    if(!def)def=defOf(att,holder);
    // round 108 (engine 22): nobody outruns his legs. Each man (by side and slot, in the court's own frame) covers at most
    // BB_VMAX courts a unit of the playback's clock (whatever the speed) from the last frame; the set for free throws, a new possession, a turnover used
    // to put men there in one frame. The ball stays in the hands of the man who has it.
    if(typeof ENGINE_V==="undefined"||ENGINE_V>=22){ const Q=pbDraw.st, ab=p=>home?p:[1-p[0],1-p[1]], sA=home?0:1, sD=1-sA;
      const cur={}; att.forEach((p,i)=>cur[sA+"|"+i]=ab(p)); def.forEach((p,i)=>cur[sD+"|"+i]=ab(p));
      const dt=Q&&Q.d===d?el-Q.el:-1;
      let lagM=0, nCl=0; if(dt>=0&&dt<400){ const lim=BB_VMAX*dt/Math.max(1,PB.ms)*plan.tot; Object.keys(cur).forEach(k=>{ const o=Q.pos[k]; if(!o)return; const q=cur[k], dx=(q[0]-o[0])*28, dy=(q[1]-o[1])*15, m=Math.hypot(dx,dy), L2=lim*28;
        if(m>L2&&m>0){ cur[k]=[o[0]+dx*L2/m/28,o[1]+dy*L2/m/15]; nCl++; lagM+=m-L2 } });
        const back=p=>home?p:[1-p[0],1-p[1]]; att=att.map((p,i)=>back(cur[sA+"|"+i])); def=def.map((p,i)=>back(cur[sD+"|"+i]));
        if(held&&holder>=0&&att[holder])ball=[att[holder][0]-0.012,att[holder][1]] }
      pbDraw.st={d,el,pos:cur}; pbDraw.pos={att:att.map(ab),def:def.map(ab),sA,ball:ab(ball),held,holder,nCl:typeof nCl==='number'?nCl:0,lagM:typeof lagM==='number'?lagM:0,upf:plan.tot/Math.max(1,PB.ms)} }
    const ink=kits[home?0:1].fill, dink=kits[home?1:0].fill;
    const scr=att.map(p=>P(W,H,c,p[0],p[1])), crowd=(px,py)=>scr.some(q=>Math.abs(q[0]-px)<r*5&&Math.abs(q[1]-py)<r*2.6);
    def.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]), q=dn[i]; hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)","",q?{num:q[0],sub:crowd(px,py)?"":q[1]}:null) });
    att.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]), q=an[i]; hlDot(x,px,py,r,ink,"rgba(0,0,0,.6)","",q?{num:q[0],sub:q[1]}:null) });
    let [qx,qy]=P(W,H,c,ball[0],ball[1]); const bo=held?Math.abs(Math.sin(Date.now()/140))*r*1.3:lift;
    if(held){ qx+=(home?1:-1)*r*0.15; qy+=r*0.75 }
    hlBall(x,qx,qy,r*0.62,bo,null,{fill:"#E8702A",ring:"#2a1406"});
    hlBug(x,W,H,{home:g.home,away:g.away,hs:hs,as:as,hk:kits[0],ak:kits[1],clock:clk});
    hlTicker(x,W,H,top,8.01);   // top right: the score bug has the left
    if(end){ const key=pi+"|"+end; if(pbDraw._b!==key){ pbDraw._b=key; pbDraw._b0=Date.now() } hlBanner(x,W,H,end,endInk&&endInk!=="#fff"?{fill:endInk}:null,Math.max(0,(Date.now()-pbDraw._b0)/1200)) }
    pbPatch(hs,as,clk);
    // the crowd, once a basket: your side's three, or a basket that takes the lead
    { const L0=pbDraw._sc; pbDraw._sc={d:d,h:hs,a:as};
      if(L0&&L0.d===d&&(hs!==L0.h||as!==L0.a)&&typeof sfx==="function"){ const meH=live.userIsHome, mineUp=meH?hs-L0.h:as-L0.a, my=meH?hs:as, th=meH?as:hs, was=meH?L0.h-L0.a:L0.a-L0.h;
        if(mineUp>=3||(mineUp>0&&my>th&&was<=0))sfx("run") } }
  }
  function idle(x,W,H){ if(typeof live!=="undefined"&&live&&live.pb&&live.pb.d&&!live.done){ pbDraw(x,W,H); return } if(typeof hlAmbOn==="function"?hlAmbOn():typeof hlMode==="function"&&hlMode()==="full")ambient(x,W,H) }   // round 67: nothing until something happens, unless you asked for the full match
  function frame(x,W,H,c,t){
    const n=c.W.length, tb=0.7, ts=0.86;
    let bx,by,z=0;
    if(t<tb){ const f=t/tb*(n-1), k=Math.min(n-2,Math.floor(f)), s=hlEase(f-k), a=c.W[k], b=c.W[k+1]; bx=hlLerp(a[0],b[0],s); by=hlLerp(a[1],b[1],s) }
    else if(t<ts){ const s=(t-tb)/(ts-tb), a=c.W[n-1]; const to=c.made?RIM:[RIM[0]+0.02,RIM[1]+0.06]; bx=hlLerp(a[0],to[0],s); by=hlLerp(a[1],to[1],s); z=Math.sin(s*Math.PI)*0.06 }
    else{ const s=(t-ts)/(1-ts); bx=c.made?RIM[0]:RIM[0]-s*0.08; by=c.made?RIM[1]:RIM[1]+0.06+s*0.1 }
    const att=ATT.map((p,i)=>{ let a=p[0],y=p[1]; /* round 79: a man who takes the puck twice goes to each spot in turn (it found his first only, and the pass went to
         empty ice: Ian, "invisible passers") */ let j=-1, nr=0; c.rec.forEach((ri,q)=>{ if(ri!==i)return; const v=t<tb?Math.max(0,1-Math.abs(t/tb*(n-1)-q)):q===n-1?1:0; if(j<0||v>nr){ j=q; nr=v } }); if(j>=0){ const w=c.W[j]; a=hlLerp(a,w[0],hlEase(Math.min(1,nr*1.4))); y=hlLerp(y,w[1],hlEase(Math.min(1,nr*1.4))) }
      if(i===c.rec[n-1]&&t>=tb){ a=c.W[n-1][0]; y=c.W[n-1][1] } return [a,y] });
    // man to man: each defender between his man and the rim, closer on the ball
    const def=att.map(([a,y])=>{ const d=Math.hypot(a-bx,y-by)<0.04?0.35:0.25; return [hlLerp(a,RIM[0],d),hlLerp(y,RIM[1],d)] });
    const r=Math.max(5,W/80), ink=c.inks[c.home?0:1], dink=c.inks[c.home?1:0];
    // a name under each man, except where two stand close enough for the names to collide: there, only the attacker's
    const scr=att.map(p=>P(W,H,c,p[0],p[1])), crowd=(px,py)=>scr.some(q=>Math.abs(q[0]-px)<r*5&&Math.abs(q[1]-py)<r*2.6);
    def.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]), q=c.dn&&c.dn[i]; hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)","",q?{num:q[0],sub:crowd(px,py)?"":q[1]}:null) });
    att.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]); const q=c.an&&c.an[i]; hlDot(x,px,py,r,ink,"rgba(0,0,0,.6)",i===c.rec[n-1]&&t>=ts?c.nm:"",q?{num:q[0],sub:q[1]}:null) });
    const [qx,qy]=P(W,H,c,bx,by); hlBall(x,qx,qy,r*0.62,z*W,null,{fill:"#E8702A",ring:"#2a1406"});
    const top=c.last?"Last shot":c.m;
    const end=t>=ts?(c.last?(c.made?(c.kind==="three"?`${c.nm} hits it! Game over`:`${c.nm} ties it!`):"No good!"):c.kind==="three"?`${c.nm} from three!`:`${c.nm}, and one!`):null;
    hlCaption(x,W,H,top,end,c.made?ink:null);
  }
  // round 72: the header's clock while a clip plays: the clip's stretch, as the court shows it
  const headClock=c=>c?(c.last?"Last shot":c.m||null):null;
  return {drawPos:()=>pbDraw.pos||null, reveal:0.86, collapseIdle:true, ambient:true, leadIn:true, fullMs:13000, playback, namesOf, aspect:0.54, clips, pitch, idle, frame, headClock, allLabel:"Every big basket", fullLabel:"Full game", goalsLabel:"Crunch time"};
})();
