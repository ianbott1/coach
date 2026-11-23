/* Soccer's highlights (round 51, core 97_highlights): a goal, a save or a miss from the engine's event, played out on
   a pitch by twenty-two dots. The event says who attacked, when, and how it ended; its draw (e.u) picks the move
   (a cross from the wing, a ball through the middle, a shot from distance, a corner) and the man the commentary names
   takes the shot. The home side attacks to the right all match, as the pitch on the scoreboard has it. */
const HL_SPORT=(function(){
  const PAD=0.035;
  // a 4-4-2, in the attacking side's frame: 0 its own goal line, 1 the goal it attacks; y across the pitch
  const SLOT_N={GK:0,FB:1,CB:2,CM:6,W:5,ST:9};   // a line's man in the eleven's slots (the clips' SLOT)
  const BASE=[[0.04,0.5],[0.2,0.14],[0.18,0.38],[0.18,0.62],[0.2,0.86],[0.44,0.12],[0.42,0.38],[0.42,0.62],[0.44,0.88],[0.64,0.4],[0.64,0.6]];
  const UNIT_IDX={ST:[9,10],W:[5,8],CM:[6,7],CB:[2,3],FB:[1,4]};
  const goalW=0.108, post=[0.5-goalW/2,0.5+goalW/2];
  const HL_CM=(typeof window!=="undefined"&&window.HLCM)||1;
  function clips(L,d,mode){
    if(mode==="pb")return pbClips(L,d);
    const ev=(d.ev||[]).filter(e=>e.k==="goal"||e.k==="save"||e.k==="miss"||e.k==="red").sort((a,b)=>a.m-b.m);
    const out=[]; let chance=null;
    const sh0=d.sh-(d.h||0), sa0=d.sa-(d.a||0); let sh=sh0, sa=sa0;
    ev.forEach(e=>{
      if(e.k==="goal"){ const c=mk(L,e,"goal",sh,sa); if(e.side==="home")sh++; else sa++; c.after=[sh,sa]; out.push(c); return }
      if(e.k==="red"){ if(mode!=="goals")out.push(mk(L,e,"red",sh,sa)); return }   // round 66: a sending-off is a moment too
      // a big chance: one a stretch at most, in a game still within a goal, when asked for
      if(mode==="key"&&!chance&&Math.abs(sh-sa)<=2&&((e.u||0)%HL_CM===0)){ chance=mk(L,e,e.k,sh,sa); out.push(chance) }
      else if((mode==="all"||mode==="full")&&out.filter(c=>c.kind!=="goal").length<3)out.push(mk(L,e,e.k,sh,sa)) });   // round 68: every chance
    return hlTrim(out,mode==="all"||mode==="full"?5:3);
  }
  /* round 101: the full match shows every shot the engine counted. Goals and the big chance keep their minutes; the
     other shots (the stretch's count, on target and off) get a minute from their own hash, saved or off target as the
     count has them. Short clips for those. */
  function pbClips(L,d){
    const ev=(d.ev||[]).filter(e=>e.k==="goal"||e.k==="save"||e.k==="miss"||e.k==="red").map(e=>Object.assign({},e));
    const di=(L.drives||[]).indexOf(d), pv=di>0?L.drives[di-1]:null, t0=d.seg*5;
    ["home","away"].forEach(sd=>{ const c1=d.st&&d.st[sd], c0=pv&&pv.st&&pv.st[sd]||[0,0]; if(!c1)return;
      const shots=c1[0]-c0[0], sot=c1[1]-c0[1], g=ev.filter(e=>e.k==="goal"&&e.side===sd).length, sv=ev.filter(e=>e.k==="save"&&e.side===sd).length, ms=ev.filter(e=>e.k==="miss"&&e.side===sd).length;
      const xs=Math.max(0,sot-g-sv), xm=Math.max(0,shots-sot-ms);
      for(let j=0;j<xs+xm;j++){ const h=strHash((L.step||0)+"|"+d.seg+"|"+sd+"|"+j); ev.push({m:t0+1+h%5,side:sd,k:j<xs?"save":"miss",u:(h>>>8)%100,pbx:1}) } });
    ev.sort((a,b)=>a.m-b.m||(a.u||0)-(b.u||0));
    const out=[]; let sh=d.sh-(d.h||0), sa=d.sa-(d.a||0);
    ev.forEach(e=>{ if(e.k==="goal"){ const c=mk(L,e,"goal",sh,sa); if(e.side==="home")sh++; else sa++; c.after=[sh,sa]; out.push(c); return }
      const c=mk(L,e,e.k,sh,sa); if(e.pbx||e.k!=="red")c.base=Math.min(c.base,e.pbx?2300:c.base); out.push(c) });
    out.forEach(c=>Object.defineProperty(c,"pbFrom",{value:L,writable:true,configurable:true,enumerable:false}));   // round 103: grows out of the touch-by-touch play
    return out }
  function mk(L,e,kind,sh,sa){
    const g=L.g, red=kind==="red", aside=red?(e.side==="home"?"away":"home"):e.side, tm=aside==="home"?g.home:g.away, opp=aside==="home"?g.away:g.home, u=e.u||((e.m||0)*37)%100;
    const r=mulberry32(((e.m||0)*7919+u*131+(e.side==="home"?17:29))>>>0);
    const shooter=kind==="goal"?scGoalBy(tm,e):scScorer(tm,u);
    let text=""; try{ text=scEventTextIn(g,L.drives,e).text }catch(er){}
    // the move follows the commentary's words where they say how ("heads in at the near post", "from the penalty spot",
    // "blazes over"), else the event's draw
    const T=text.toLowerCase();
    let plan=red?"through":/penalty/.test(T)?"pen":/corner|set piece/.test(T)?"corner":/distance|deflected/.test(T)?"distance":/head|back post|tip/.test(T)?"wing"
      :/rounds|first time|slots|cuts inside|drills|overlaps/.test(T)?"through":["wing","through","distance"][Math.floor(r()*3)];
    const how=kind==="miss"?(/post/.test(T)?"post":/over/.test(T)?"over":/line/.test(T)?"blocked":"wide"):kind;
    const side=r()<0.5?0:1;   // which flank
    // the move: waypoints for the ball in the attacking frame, and which attacker receives each
    let W=[];
    const start=[0.28+r()*0.12, 0.3+r()*0.4];
    if(plan==="wing"){ const wy=side?0.9:0.1; W=[start,[0.5+r()*0.08,0.5+(side?0.15:-0.15)],[0.74+r()*0.06,wy],[0.86+r()*0.04,0.42+r()*0.16]] }
    else if(plan==="through"){ W=[start,[0.52+r()*0.06,0.35+r()*0.3],[0.68+r()*0.05,0.4+r()*0.2],[0.84+r()*0.04,0.44+r()*0.12]] }
    else if(plan==="distance"){ W=[start,[0.5+r()*0.08,0.25+r()*0.5],[0.66+r()*0.06,0.38+r()*0.24],[0.72+r()*0.04,0.4+r()*0.2]] }
    // a penalty: the move that won it, ending with the foul in the box (round 66: Ian, the build-up, not just the kick)
    else if(plan==="pen"){ W=[start,[0.6+r()*0.06,0.3+r()*0.4],[0.88+r()*0.03,0.36+r()*0.28]] }
    else { const cy=side?0.995:0.005; W=[[0.995,cy],[0.9+r()*0.04,0.42+r()*0.16]] }
    // the receivers: the nearest attacker to each spot (the last is the man who shoots: the named one when we know him)
    const sIdx=(UNIT_IDX[shooter.unit]||[9,10])[Math.floor(r()*2)];
    const rec=W.map((w,i)=>{ if(i===W.length-1)return sIdx; let b=1,bd=9; for(let k=1;k<11;k++){ const p=BASE[k], dd=Math.hypot(p[0]+0.18-w[0],p[1]-w[1])*(SP_NAMED.has(k)?0.7:1); if(dd<bd&&k!==sIdx){bd=dd;b=k} } return b });   // round 103: the squad's man of a pair a little more often (the full match credits the last pass)
    // a goal's last pass: four times in five from the squad's nearest named man (so a watched season's goals come out assisted
    // about as often as the engine's 72%: partners without a name can't be credited)
    if(kind==="goal"&&plan!=="pen"&&W.length>=2&&((e.m||0)*31+u)%100<80){ const w=W[W.length-2]; let b=-1,bd=9; SP_NAMED.forEach(k=>{ if(!k||k===sIdx)return; const p=BASE[k], dd=Math.hypot(p[0]+0.18-w[0],p[1]-w[1]); if(dd<bd){bd=dd;b=k} }); if(b>0)rec[W.length-2]=b }
    // the end of the shot
    let end, kept=false, postHit=false;
    if(kind==="goal")end=[1.012,0.5+(r()-0.5)*goalW*0.8];
    else if(kind==="save"){ end=[0.975,0.5+(r()-0.5)*goalW*0.7]; kept=true }
    else if(how==="post"){ postHit=true; end=[1.0,r()<0.5?post[0]:post[1]] }
    else if(how==="blocked"){ end=[0.99,0.5+(r()-0.5)*goalW*0.6]; kept=true }
    else if(how==="over"){ end=[1.03,0.5+(r()-0.5)*goalW*0.9] }
    else end=[1.03,r()<0.5?post[0]-0.03-r()*0.06:post[1]+0.03+r()*0.06];
    const nm=shooter.n?String(shooter.n).split(" ").slice(-1)[0]:"";
    const inks=hlInks(g.home,g.away), kits=hlKits(g.home,g.away);
    // keepers in a colour neither side wears
    const gks=hlFar(["#E8F56B","#C9A0FF","#F2F2F2","#FF9F43","#7CF2D0","#111318"],[kits[0].fill,kits[1].fill]);
    if(red){ W=[start,[0.5+r()*0.06,0.3+r()*0.4],[0.64+r()*0.08,0.3+r()*0.4]]; for(let i=0;i<W.length;i++){ let b=1,bd=9; for(let k=1;k<11;k++){ const p=BASE[k], dd=Math.hypot(p[0]+0.18-W[i][0],p[1]-W[i][1]); if(dd<bd){bd=dd;b=k} } rec[i]=b } rec.length=W.length }
    let off=""; if(red){ const m2=/^(.*?) sees/.exec(text); off=m2?String(m2[1]).split(" ").slice(-1)[0]:"" }
    const from=plan==="pen"?[0.895,0.5]:W[W.length-1], pre=plan==="pen"?0.42:red?0.6:0;
    // round 67: shirt numbers. Each unit's named player wears his own on one dot (the scorer's dot carries the scorer);
    // the other dots take free numbers. A key under the pitch says who's who.
    const SLOT={GK:0,FB:1,CB:2,CM:6,W:5,ST:9};
    // round 103: the numbers are the full match's eleven (spXI: the squad's men by name in their slots, the partners by a
    // number of their own), so a man wears the same number in the move before the shot and in the shot. The scorer
    // takes the slot the move gives him; the man who stood there takes his.
    const sideNums=(team,isAtt)=>{ const X=spXI(L,team), nums=X.nums.slice(), idx=X.idx.slice(), list=[];
      if(isAtt&&!red&&shooter&&shooter.n){ const R=(SEA.roster&&SEA.roster[team])||[], j=R.findIndex(p=>p&&p.n===shooter.n), home=SLOT[shooter.unit];
        if(j>=0){ const at=idx.indexOf(j); if(at>=0&&at!==sIdx){ [nums[at],nums[sIdx]]=[nums[sIdx],nums[at]]; [idx[at],idx[sIdx]]=[idx[sIdx],idx[at]] }
          else if(at<0){ idx[sIdx]=j; nums[sIdx]=shirtNo(team,j); const k=nums.findIndex((v,q)=>q!==sIdx&&v===nums[sIdx]); if(k>=0)nums[k]=nums[k]+20 } } }
      const R=(SEA.roster&&SEA.roster[team])||[]; idx.forEach((i,k)=>{ if(i>=0&&R[i])list.push([nums[k],String(R[i].n).split(" ").slice(-1)[0]]) });
      return {nums,list,idx} };
    const SA=sideNums(tm,true), SD=sideNums(opp,false);
    // each shot its own flight (round 70, Ian: "all of the shots have a curve"): a low drive, a rising strike, a chip,
    // or one bent in from the side
    const shot=r(), lift=how==="over"?0.05:shot<0.35?0.003:shot<0.65?0.012:shot<0.82?0.028:0.008, bend=shot>=0.82?(r()<0.5?-1:1)*(0.03+r()*0.03):0;
    const gno=kind==="goal"?hlGoalNo(L,e,x=>scGoalBy(x.side==="home"?g.home:g.away,x).n):0;
    const cl={gno,lift,bend,lr:(aside==="home")!==((e.m||0)>45),numsA:SA.nums,numsD:SD.nums,idxA:SA.idx,subA:SA.idx.map(i=>i>=0&&SEA.roster[tm][i]?String(SEA.roster[tm][i].n).split(" ").slice(-1)[0]:""),subD:SD.idx.map(i=>i>=0&&SEA.roster[opp][i]?String(SEA.roster[opp][i].n).split(" ").slice(-1)[0]:""),legend:[{team:tm,kit:kits[aside==="home"?0:1],list:SA.list},{team:opp,kit:kits[aside==="home"?1:0],list:SD.list}],kind,how:red?"red":how,e,tm,opp,home:aside==="home",W,rec,end,kept,postHit,nm:red?off:nm,text,plan,sh,sa,m:e.m,base:red?3000:3600,red,from,pre,inks,kits,gk:[gks[0],gks[1]],home0:g.home,away0:g.away};
    cl.open=Object.assign({},cl,{plan:"through",pre:0,red:false,from:W[W.length-1]});
    cl.who=shooter&&typeof shooter==="object"?shooter.n:shooter;   // round 101: the box score credits a shot the full match showed
    return cl;
  }
  // pitch coordinates (attack frame -> screen)
  // round 70: the sides change ends at half-time (Ian): lr, the attacking side going left to right
  const P=(W,H,c,a,y)=>{ const lr=c.lr!=null?c.lr:c.home, X=lr?a:1-a, Y=lr?y:1-y; return [W*PAD+X*W*(1-2*PAD), H*PAD+Y*H*(1-2*PAD)] };
  function pitch(x,W,H){
    x.fillStyle="#1E5E2A"; x.fillRect(0,0,W,H);
    const L=W*PAD, T=H*PAD, R=W*(1-PAD), B=H*(1-PAD), w=R-L, h=B-T;
    hlGrass(x,0,0,W,H,{bands:14,base:"#2C7A37",alt:"#33873F",seed:11});
    const lw=Math.max(1.2,W/520), pa=w*0.157, ga=w*0.052, cr=h*0.135;
    hlLines(x,lw,()=>{
      x.strokeRect(L,T,w,h);
      x.beginPath(); x.moveTo(L+w/2,T); x.lineTo(L+w/2,B); x.stroke();
      x.beginPath(); x.arc(L+w/2,T+h/2,cr,0,Math.PI*2); x.stroke();
      [[L,1],[R,-1]].forEach(([gx,sd])=>{
        x.strokeRect(sd>0?gx:gx-pa,T+h*0.2,pa,h*0.6); x.strokeRect(sd>0?gx:gx-ga,T+h*0.37,ga,h*0.26);
        // the penalty arc ("the D"): the part of a 9.15m circle round the spot outside the box
        const spx=gx+sd*w*0.105, a=Math.acos(Math.min(1,(pa-w*0.105)/cr)); x.beginPath();
        x.arc(spx,T+h/2,cr,sd>0?-a:Math.PI-a,sd>0?a:Math.PI+a); x.stroke() });
      // corner arcs
      [[L,T,0],[R,T,Math.PI/2],[R,B,Math.PI],[L,B,Math.PI*1.5]].forEach(([cx,cy,a0])=>{ x.beginPath(); x.arc(cx,cy,w*0.009,a0,a0+Math.PI/2); x.stroke() });
    });
    x.fillStyle="rgba(246,250,242,.92)";
    [[L+w/2,T+h/2],[L+w*0.105,T+h/2],[R-w*0.105,T+h/2]].forEach(([px,py])=>{ x.beginPath(); x.arc(px,py,lw*1.4,0,Math.PI*2); x.fill() });
    [[L,-1],[R,1]].forEach(([gx,sd])=>hlNet(x,gx,T+h*post[0],T+h*post[1],w*0.022,sd));
    // corner flags
    [[L,T],[R,T],[R,B],[L,B]].forEach(([cx,cy])=>{ x.fillStyle="#F2C14E"; x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+(cx<W/2?-1:1)*5,cy-3); x.lineTo(cx,cy-6); x.closePath(); x.fill() });
  }
  /* ---- the full match (round 68) ----
     Between the moments the pitch keeps playing: possession passed about in midfield, never a shot, the ball shared
     between the sides as the engine's balance of play for the stretch has it (its drive's mom, the home side's share).
     Every real moment still plays as its own clip. Drawn from the clock, not stored: a frame is the same however it's
     reached. */
  function ambient(x,W,H){
    if(typeof live==="undefined"||!live||live.done||!live.g)return;
    const g=live.g, last=live.drives[live.drives.length-1], mom=last&&typeof last.mom==="number"?last.mom:0.5;
    const DT=1150, now=Date.now(), seedB=((live.step||0)*7919+live.drives.length*131)>>>0;
    const spot=k=>{ const h=strHash(seedB+"|"+k), r1=(h%1000)/1000, r2=((h>>>10)%1000)/1000, r3=((h>>>20)%1000)/1000, home=r1<mom;
      return {home,a:0.28+r2*0.48,y:0.12+r3*0.76} };      // in the side's own frame: never beyond 0.76 of the way to goal
    const at=T=>{ const k=Math.floor(T/DT), f=(T-k*DT)/DT, A=spot(k), B=spot(k+1);
      const ax=A.home?A.a:1-A.a, bx=B.home?B.a:1-B.a, ay=A.home?A.y:1-A.y, by=B.home?B.y:1-B.y, e=hlEase(Math.min(1,f/0.55));
      return {x:hlLerp(ax,bx,e),y:hlLerp(ay,by,e),home:f<0.55?A.home:B.home} };   // pitch frame: 0 the home goal, 1 the away goal
    const kits=hlKits(g.home,g.away), r=Math.max(5,W/80);
    // each side keeps its shape around the ball: the side on it pushed on, the other in a block behind it
    const shape=(T,home)=>{ const b=at(T), bx=home?b.x:1-b.x, by=home?b.y:1-b.y, has=b.home===home;
      return BASE.map((p,i)=>{ if(i===0)return [0.04+0.05*bx,0.5+(by-0.5)*0.12];
        const push=has?Math.max(0,bx-0.3)*0.7:Math.max(0,bx-0.45)*0.45, depth=i<5?0.6:i<9?0.85:1;
        return [Math.min(0.92,p[0]+push*depth+(has?0.05:-0.02)),0.5+(p[1]-0.5)*(has?1:0.82)+(by-0.5)*(i<5?0.15:0.25)] }) };
    const lagged=home=>{ const S0=[0,120,240,360], o=BASE.map(()=>[0,0]); S0.forEach((dt,q)=>{ const w=4-q; shape(now-dt,home).forEach((p,i)=>{ o[i][0]+=p[0]*w; o[i][1]+=p[1]*w }) }); return o.map(p=>[p[0]/10,p[1]/10]) };
    const h2=live.drives.length*5>45, toS=(home,p)=>{ const lr=home!==h2, X=lr?p[0]:1-p[0], Y=lr?p[1]:1-p[1]; return [W*PAD+X*W*(1-2*PAD), H*PAD+Y*H*(1-2*PAD)] };
    const b=at(now), [qx,qy]=toS(true,[b.x,b.y]);   // the ball in the home side's frame
    // round 102: the six men the squad has a line for (keeper, centre back, full back, midfield, wing, striker) by number and
    // name in their slots, as the clips have them (a hurt man's backup takes his place); the partners keep a number
    const nk=live.drives.length+"|"+g.home, NMs=ambient._n=ambient._n&&ambient._n.k===nk&&ambient._n.L===live?ambient._n:{k:nk,L:live,s:[g.away,g.home].map(team=>{
      const R=(SEA.roster&&SEA.roster[team])||[], out={}; Object.keys(SLOT_N).forEach(u=>{ const i=typeof SC_UNIT!=="undefined"?hlFit(team,SC_UNIT[u]):-1; if(i>=0&&R[i])out[SLOT_N[u]]=[shirtNo(team,i),String(R[i].n).split(" ").slice(-1)[0]] }); return out })};
    [false,true].forEach(home=>{ const k=kits[home?0:1], gk=hlKit("",home?"#E8F56B":"#C9A0FF"), P2=lagged(home), nm=NMs.s[home?1:0], used=new Set(Object.values(nm).map(q=>q[0]));
      // the man nearest the ball, on the side that has it, is on it
      let ni=-1,nd=1e9; if(b.home===home)P2.forEach((p,i)=>{ if(!i)return; const [sx,sy]=toS(home,p), dd=Math.hypot(sx-qx,sy-qy); if(dd<nd){nd=dd;ni=i} });
      P2.forEach((p,i)=>{ let [sx,sy]=toS(home,p); if(i===ni){ sx=hlLerp(sx,qx,0.8); sy=hlLerp(sy,qy,0.8) } const q=nm[i], num=q?q[0]:(used.has(NUM[i])?NUM[i]+20:NUM[i]); hlPlayer(x,sx,sy,r,i?k:gk,q?{num:num,sub:q[1],dir:Math.atan2(qy-sy,qx-sx)}:{num:num,dir:Math.atan2(qy-sy,qx-sx)}) }) });
    hlBall(x,qx,qy,r*0.55,0,null);
    const Hd=live.hold, hs=Hd?Hd.h:live.eng.h, as=Hd?Hd.a:live.eng.a;
    hlBug(x,W,H,{home:g.home,away:g.away,hs:hs,as:as,hk:kits[0],ak:kits[1],clock:(Hd&&Hd.clock)||Math.min(90,live.drives.length*5)+"'"});
  }
  function idle(x,W,H){ if(typeof live!=="undefined"&&live&&live.pb&&live.pb.d&&!live.done&&typeof hlEvDraw==="function"){ hlEvDraw(x,W,H); return }
    if(typeof hlAmbOn==="function"?hlAmbOn():typeof hlMode==="function"&&hlMode()==="full")ambient(x,W,H) }
  /* ---- round 103: the full match, touch by touch (Ian: "as realistic as possible ... in Football Manager I would do
     this all the time"). Between the shots, the stretch's own numbers are played: each side's crosses, long balls and
     the balls it won high up the pitch are the engine's (d.TA, the whole match's tally, less the stretch before: the
     read screen's numbers are what you saw), each booking at its minute, possession shared as the read has it (50 plus
     each side's lean). Fouls, corners and offsides at the league's rates, from the stretch's own hash. Every move is
     passed between the men on the pitch: the six the squad has a line for by name, their partners by position. Each
     move picks up where the last ended (a free kick where the foul was, a corner from the flag, a goal kick, a
     kick-off after a goal) and the one before a shot ends where the shot's own move begins, its man on the ball.
     Drawn from the stretch and how far through it the clock is (d, f): the same frame however it's reached, paused
     or not. No game dice. */
  const SP_RATE={foul:0.58,corner:0.28,off:0.1};   // a side's fouls, corners and offsides in five minutes (EPL: about 10.5, 5, 1.8 a match)
  const SP_POS=["the keeper","the full back","the centre back","the centre back","the full back","the winger","the midfielder","the midfielder","the winger","the striker","the striker"];
  const SP_UNIT=["GK","FB","CB","CB","FB","W","CM","CM","W","ST","ST"];
  function spXI(L,team){ const key=team+"|"+(L.drives?L.drives.length:0); spXI.c=spXI.c||{}; if(spXI.c[key]&&spXI.c[key].L===L)return spXI.c[key];
    const R=(SEA.roster&&SEA.roster[team])||[], idx=Array(11).fill(-1), nm=Array(11).fill(null), nums=NUM.slice(), used={};
    Object.keys(SLOT_N).forEach(u=>{ const s=SLOT_N[u], i=typeof SC_UNIT!=="undefined"?hlFit(team,SC_UNIT[u]):-1; if(i<0||!R[i])return; idx[s]=i; nm[s]=String(R[i].n).split(" ").slice(-1)[0]; nums[s]=shirtNo(team,i); used[nums[s]]=s });
    let f=2; nums.forEach((v,k)=>{ if(idx[k]>=0)return; if(used[v]!==undefined){ while(used[f]!==undefined||nums.some((w,j)=>j!==k&&idx[j]>=0&&w===f))f++; nums[k]=f } used[nums[k]]=k });
    return spXI.c[key]={L:L,idx,nm,nums} }
  const spWho=(X,s)=>X.nm[s]||SP_POS[s];
  // where each side stands for a ball at (bx,by) in the home frame (0 the home goal line), the side on it pushed on
  function spShape(bx,by,has){ return [true,false].map(home=>{ const a=home?bx:1-bx, y=home?by:1-by, on=has===home;
    const P=BASE.map((p,i)=>{ if(i===0)return [0.04+0.05*a,0.5+(y-0.5)*0.12];
      const push=on?Math.max(0,a-0.3)*0.75:Math.max(0,a-0.42)*0.5-(on?0:Math.max(0,0.55-a)*0.25), depth=i<5?0.62:i<9?0.88:1;
      return [Math.max(0.06,Math.min(0.95,p[0]+push*depth+(on?0.05:-0.03))),0.5+(p[1]-0.5)*(on?1:0.8)+(y-0.5)*(i<5?0.18:0.3)] });
    return P.map(p=>home?p:[1-p[0],1-p[1]]) }) }
  // the man nearest, the named one of a pair a little more often (the squad's man for the line is its first choice)
  const SP_NAMED=new Set(Object.values(SLOT_N));
  const spNear=(P,x,y,skip)=>{ let b=1,bd=9; for(let k=1;k<11;k++){ if(k===skip)continue; const dd=Math.hypot(P[k][0]-x,P[k][1]-y)*(SP_NAMED.has(k)?0.7:1); if(dd<bd){bd=dd;b=k} } return b };
  // after a move: who has the ball and how it restarts (no dice: a clip's own draw decides a save's corner)
  function spAfter(m){ const s=m.side, o=1-s, c=m.c;
    if(m.end==="clip")return c.kind==="goal"?{side:o,kind:"kickoff"}:c.kind==="red"?{side:s,kind:"free"}:c.kind==="save"&&((c.e.u||0)%5)<2?{side:s,kind:"corner"}:{side:o,kind:"gk"};
    if(m.end==="card"||m.end==="foul")return {side:s,kind:"free"}; if(m.end==="corner")return {side:s,kind:"corner"};
    if(m.end==="off")return {side:o,kind:"free"}; if(m.end==="out")return {side:o,kind:m.cr?"gk":"throw"}; return {side:o,kind:"won"} }
  function spPlan(L,d){
    const nD=(L.drives||[]).length; if(d._sp&&d._sp.L===L&&d._sp.n===nD)return d._sp;
    const g=L.g, EP=typeof hlEvPlan==="function"?hlEvPlan(L,d):{clips:[]}, di=(L.drives||[]).indexOf(d), pv=di>0?L.drives[di-1]:null;
    const r=mulberry32(strHash("sp|"+g.home+"|"+g.away+"|"+d.seg+"|"+d.sh+"|"+d.sa)), ri=n=>Math.floor(r()*n), cl=v=>Math.max(0.02,Math.min(0.98,v));
    const pois=lam=>{ const Lx=Math.exp(-lam); let k=0,p=1; do{ k++; p*=r() }while(p>Lx&&k<9); return k-1 };
    const XI=[spXI(L,g.home),spXI(L,g.away)];
    // the stretch's numbers
    const dl=(sd,k)=>{ const a=d.TA&&d.TA[sd], b=pv&&pv.TA&&pv.TA[sd]; return a?Math.max(0,Math.round((a[k]||0)-(b?b[k]||0:0))):null };
    const N={}; ["home","away"].forEach(sd=>{ const a=d.TA&&d.TA[sd], b=pv&&pv.TA&&pv.TA[sd], posL=a?((a.pos||0)-(b?b.pos||0:0))/Math.max(1,(a.n||0)-(b?b.n||0:0)):0;
      const yel=(d.ev||[]).filter(e=>e.k==="yellow"&&e.side===(sd==="home"?"away":"home")).length;   // a booking for them: a foul on us
      N[sd]={cr:dl(sd,"cr"),lb:dl(sd,"lb"),to:dl(sd,"to"),pos:Math.max(20,Math.min(80,50+posL)),fouled:Math.max(yel,pois(SP_RATE.foul)),corner:pois(SP_RATE.corner),off:pois(SP_RATE.off)};
      ["cr","lb","to"].forEach(k=>{ if(N[sd][k]==null)N[sd][k]=pois(0.7) }) });
    const pH=N.home.pos/(N.home.pos+N.away.pos);
    // the anchors: each shot's move at its clip's minute (it ends where the clip's own move begins), each booking at its own
    const anchors=[]; EP.clips.forEach(c=>{ const s=c.home?0:1, w0=c.W[0];
      anchors.push({f:c.f,side:s,end:"clip",c:c,ex:cl(s?1-w0[0]:w0[0]),ey:cl(s?1-w0[1]:w0[1]),slot:c.rec[0]}) });
    (d.ev||[]).filter(e=>e.k==="yellow").forEach(e=>{ const f=Math.max(0.03,Math.min(0.97,(e.m-d.seg*5-0.5)/5)); let text=""; try{ text=scEventTextIn(g,L.drives,e).text }catch(er){}
      anchors.push({f:f,side:e.side==="home"?1:0,end:"card",e:e,text:text}) });
    anchors.sort((a,b)=>a.f-b.f);
    // the rest float: what each side's moves end in
    const fl=[]; [0,1].forEach(s=>{ const n=N[s?"away":"home"], o=N[s?"home":"away"];
      for(let k=anchors.filter(a=>a.end==="card"&&a.side===s).length;k<n.fouled;k++)fl.push({side:s,end:"foul"});
      for(let k=0;k<n.corner;k++)fl.push({side:s,end:"corner"});
      for(let k=0;k<n.off;k++)fl.push({side:s,end:"off"});
      for(let k=0;k<o.to;k++)fl.push({side:s,end:"high"});   // they won it high: our move ends in our own third
    });
    // the crosses and long balls each side plays, one of each at most to a move: a cross on a move that ends in their
    // half (cleared, a corner, out), a long ball on any but one lost in our own third
    [0,1].forEach(s=>{ const n=N[s?"away":"home"]; let c=n.cr, l=n.lb;
      fl.filter(m=>m.side===s&&(m.end==="corner"||m.end==="foul")).forEach(m=>{ if(c>0){ m.cr=1; c-- } });
      fl.filter(m=>m.side===s&&m.end!=="high").forEach(m=>{ if(l>0){ m.lb=1; l-- } });
      while(c>0||l>0){ const m={side:s,end:r()<0.75?"lost":"out"}; if(c>0){ m.cr=1; c-- } if(l>0){ m.lb=1; l-- } fl.push(m) }
      // enough moves to share the ball as the read has it: about seven a side in an even five minutes
      const mine=fl.filter(m=>m.side===s).length+anchors.filter(a=>a.side===s).length, tgt=Math.round(6*(s?1-pH:pH));
      for(let k=mine;k<tgt;k++)fl.push({side:s,end:r()<0.65?"lost":"out"}) });
    for(let i=fl.length-1;i>0;i--){ const j=ri(i+1); [fl[i],fl[j]]=[fl[j],fl[i]] }
    // the floats share out between the anchors by the room each gap has
    const gaps=[]; let f0=0; anchors.forEach(a=>{ gaps.push({f0:f0,f1:a.f,a:a,m:[]}); f0=a.f }); gaps.push({f0:f0,f1:1,a:null,m:[]});
    const room=gaps.map(q=>Math.max(0.0001,q.f1-q.f0)), tot=room.reduce((s,x)=>s+x,0);
    fl.forEach(m=>{ let x=r()*tot, j=0; while(j<gaps.length-1&&x>room[j]){ x-=room[j]; j++ } gaps[j].m.push(m) });
    // where the stretch starts: a kick-off to begin each half, else where the stretch before left it
    let ball=d.seg===0?{side:0,kind:"kickoff",x:0.5,y:0.5}:d.seg===9?{side:1,kind:"kickoff",x:0.5,y:0.5}:null;
    if(!ball){ let q=null; try{ q=pv&&pv.seg===d.seg-1?spPlan(L,pv).last:null }catch(e){} ball=q?Object.assign({},q):{side:r()<pH?0:1,kind:"won",x:0.5,y:0.5} }
    // each gap: its moves in order, a ball lost in midfield wherever the next move is the other side's
    const seqs=gaps.map(q=>{ const list=q.m.concat(q.a?[q.a]:[]), seq=[]; return {q,list,seq} });
    let side=ball.side;
    seqs.forEach(G=>{ const pool=G.q.m.slice();   // the side on the ball plays its next move if it has one (fewer balls lost just to hand it over)
      while(pool.length){ let j=pool.findIndex(m=>m.side===side); if(j<0){ j=0; G.seq.push({side:side,end:"lost"}); side=1-side } const m=pool.splice(j,1)[0]; G.seq.push(m); side=spAfter(m).side }
      if(G.q.a){ if(G.q.a.side!==side){ G.seq.push({side:side,end:"lost"}); side=1-side } G.seq.push(G.q.a); side=spAfter(G.q.a).side }
      G.seq.forEach(m=>{ m.nT=m.end==="clip"?2+ri(2):2+(m.cr?1:0)+(m.lb?1:0)+(r()<0.45?1:0) }) });
    const moves=[];
    const push=(m,fA,fB)=>{ const s=m.side, A=x=>s?1-x:x;   // A: our attacking frame <-> the home frame (y too: x and y both flip)
      const st=[A(ball.x),A(ball.y)];
      let sp;
      if(m.end==="clip"){ sp=[A(m.ex),A(m.ey)]; const c=m.c, want=c.numsA?c.numsA[c.rec[0]]:null, j=want!=null?XI[s].nums.indexOf(want):-1; if(j>0)m.slot=j }   // the shot's first man by his shirt (the scorer's move can swap two slots)
      else if(m.end==="high")sp=[0.14+r()*0.16,0.15+r()*0.7];
      else if(m.end==="corner")sp=[0.985,r()<0.5?0.03:0.97];
      else if(m.end==="off")sp=[0.76+r()*0.1,0.3+r()*0.4];
      else if(m.end==="foul"||m.end==="card")sp=m.cr?[0.82+r()*0.06,0.2+r()*0.6]:[0.3+r()*0.45,0.12+r()*0.76];
      else if(m.end==="out")sp=m.cr?[0.995,0.3+r()*0.4]:[0.25+r()*0.55,r()<0.5?0.005:0.995];
      else sp=m.cr?[0.86+r()*0.06,0.32+r()*0.36]:[0.35+r()*0.35,0.2+r()*0.6];
      // the path: a long ball from our half, a cross from wide in their third, passes between
      const pts=[{x:st[0],y:st[1],k:ball.kind==="play"?"pass":ball.kind}];
      const mid=m.nT-1-(m.cr?2:0); let cur=st;
      if(m.lb){ const lx=Math.min(cur[0],0.45), ly=0.2+r()*0.6; if(cur[0]>0.45||Math.hypot(lx-cur[0],ly-cur[1])>0.05)pts.push({x:lx,y:ly,k:"long"}); else pts[0].lk=1; cur=[Math.min(0.85,lx+0.3+r()*0.15),0.15+r()*0.7]; pts.push({x:cur[0],y:cur[1],k:"pass"}) }
      const tgt=m.cr?[0.74+r()*0.08,r()<0.5?0.07+r()*0.06:0.87+r()*0.06]:sp;
      for(let k=pts.length;k<mid;k++){ const t=(k-pts.length+1)/(mid-pts.length+1); pts.push({x:cl(hlLerp(cur[0],tgt[0],t)+(r()-0.5)*0.06),y:cl(hlLerp(cur[1],tgt[1],t)+(r()-0.5)*0.24),k:"pass"}) }
      if(m.cr){ pts.push({x:tgt[0],y:tgt[1],k:"cross"}) }
      pts.push({x:sp[0],y:sp[1],k:"end"});
      // timing by touch; who: the man nearest each spot in the shape we hold there (the clip's own first receiver at its end)
      const T=pts.map((p,k)=>({x:A(p.x),y:A(p.y),f:hlLerp(fA,fB,k/(pts.length-1)),k:p.lk&&(p.k==="pass"||p.k==="won")?"long":p.k,lk:p.lk?1:0}));
      T.forEach((t,k)=>{ if(k===0&&t.k==="gk"){ t.s=0; return } if(k===0&&ball.by!=null){ t.s=ball.by; return } const S=spShape(t.x,t.y,s===0)[s]; t.s=k===T.length-1&&m.slot!=null?m.slot:spNear(S,t.x,t.y,k>0?T[k-1].s:-1) });
      // the man who won it or fouled
      const e=T[T.length-1], o=1-s; if(m.end!=="clip"&&m.end!=="out"&&m.end!=="off"){ const S=spShape(e.x,e.y,s===0)[o]; m.by=spNear(S,e.x,cl(e.y)) }
      moves.push({side:s,end:m.end,m:m,T:T,f0:fA,f1:fB});
      const nx=spAfter(m); ball={side:nx.side,kind:nx.kind,x:e.x,y:e.y,by:nx.kind==="won"?m.by:null};
      if(nx.kind==="kickoff"){ ball.x=0.5; ball.y=0.5 } else if(nx.kind==="gk"){ ball.x=nx.side?0.94:0.06; ball.y=0.5 } else if(nx.kind==="corner"&&m.end==="clip"){ ball.x=s?0.015:0.985; ball.y=((m.c.e.u||0)%2)?0.03:0.97 } };
    seqs.forEach(G=>{ const q=G.q, n=G.seq.length; if(!n)return; const W2=G.seq.reduce((t,m)=>t+m.nT,0); let at=q.f0;
      G.seq.forEach((m,k)=>{ const fB=k===n-1?q.f1:at+(q.f1-q.f0)*m.nT/W2; push(m,at,fB); at=fB }) });
    const out={L:L,n:nD,moves,N,pH,XI,last:Object.assign({},ball)};
    Object.defineProperty(d,"_sp",{value:out,writable:true,configurable:true,enumerable:false});   // never saved with the game (it holds the live game)
    return out }
  // the counts the screen shows for the stretch (test/sc-pb.js checks them against the engine's)
  function spCounts(L,d){ const P=spPlan(L,d), o=[{cr:0,lb:0,to:0,foul:0,corner:0,off:0,card:0},{cr:0,lb:0,to:0,foul:0,corner:0,off:0,card:0}];
    P.moves.forEach(m=>{ m.T.forEach(t=>{ if(t.k==="cross")o[m.side].cr++; if(t.k==="long"||t.lk)o[m.side].lb++ });
      if(m.end==="high")o[1-m.side].to++; if(m.end==="foul"||m.end==="card")o[1-m.side].foul++; if(m.end==="card")o[1-m.side].card++; if(m.end==="corner")o[m.side].corner++; if(m.end==="off")o[m.side].off++ });
    return o }
  function spText(P,mv,k){ const X=P.XI[mv.side], Xo=P.XI[1-mv.side], t=mv.T[k], a=spWho(X,t.s), nx=mv.T[k+1], b=nx?spWho(X,nx.s):"";
    if(k===mv.T.length-1){ const by=mv.m.by!=null?spWho(Xo,mv.m.by):"";
      if(mv.end==="clip")return "";
      if(mv.end==="card")return mv.m.text||`Booked: ${by}`;
      if(mv.end==="foul")return `Foul by ${by} on ${a}. Free kick`;
      if(mv.end==="corner")return `${a} forces a corner off ${by}`;
      if(mv.end==="off")return `${a} is offside`;
      if(mv.end==="out")return `Out of play off ${a}. Throw-in`;
      if(mv.end==="high")return `Won back high up the pitch by ${by}`;
      return `${by} wins it off ${a}` }
    if(t.k==="kickoff")return `${a} kicks off`; if(t.k==="gk")return `Goal kick, ${a}`; if(t.k==="corner")return `${a} swings in the corner`;
    if(t.k==="free")return `${a} takes the free kick`; if(t.k==="throw")return `${a} takes the throw`;
    if(t.k==="cross")return `${a} crosses`; if(t.k==="long")return `${a} goes long for ${b}`; if(t.k==="won")return `${a} on the ball`;
    return `${a} to ${b}` }
  function spDraw(x,W,H,d,f){
    const L=live, P=spPlan(L,d); let mv=P.moves.find(m=>f>=m.f0&&f<=m.f1)||P.moves.filter(m=>m.f0<=f).pop()||P.moves[0]; if(!mv){ ambient(x,W,H); return }
    const T=mv.T; let k=0; while(k<T.length-2&&f>T[k+1].f)k++;
    const a=T[k], b=T[Math.min(T.length-1,k+1)], u=b.f>a.f?Math.max(0,Math.min(1,(f-a.f)/(b.f-a.f))):1;
    // the ball travels in the first part of the interval, then the man it reached carries it a little
    const LOFT={long:0.05,cross:0.035,corner:0.035,gk:0.06}, lf=LOFT[a.k]||(a.lk?0.05:0), tr=Math.min(1,u/0.62), e=lf?tr:hlEase(tr), bx=hlLerp(a.x,b.x,e), by=hlLerp(a.y,b.y,e);
    const z=lf&&tr<1?Math.sin(Math.PI*tr)*lf:0;
    const g=L.g, h2=d.seg>=9, toS=(X,Y)=>{ const sx=h2?1-X:X, sy=h2?1-Y:Y; return [W*PAD+sx*W*(1-2*PAD), H*PAD+sy*H*(1-2*PAD)] };
    // each side's shape, a moment behind the ball (players take a moment to react); the man on it, and the man it's going to
    const lagS=(fq)=>{ let mm=P.moves.find(m=>fq>=m.f0&&fq<=m.f1)||mv, TT=mm.T, kk=0; while(kk<TT.length-2&&fq>TT[kk+1].f)kk++; const A=TT[kk], B=TT[Math.min(TT.length-1,kk+1)], uu=B.f>A.f?Math.max(0,Math.min(1,(fq-A.f)/(B.f-A.f))):1, tt=hlEase(Math.min(1,uu/0.62));
      return spShape(hlLerp(A.x,B.x,tt),hlLerp(A.y,B.y,tt),mm.side===0) };
    const sh=[[],[]]; const dq=[0,0.006,0.012,0.018]; dq.forEach((dt,q)=>{ const w=4-q, S=lagS(Math.max(0,f-dt)); [0,1].forEach(s=>S[s].forEach((p,i)=>{ if(!sh[s][i])sh[s][i]=[0,0,0]; sh[s][i][0]+=p[0]*w; sh[s][i][1]+=p[1]*w; sh[s][i][2]+=w })) });
    const pos=[0,1].map(s=>sh[s].map(o=>[o[0]/o[2],o[1]/o[2]]));
    const s=mv.side; if(u<0.62){ pos[s][a.s]=[hlLerp(pos[s][a.s][0],a.x,0.85*(1-tr)),hlLerp(pos[s][a.s][1],a.y,0.85*(1-tr))] }
    pos[s][b.s]=[hlLerp(pos[s][b.s][0],b.x,0.4+0.55*tr),hlLerp(pos[s][b.s][1],b.y,0.4+0.55*tr)];
    if(k===T.length-2&&mv.m.by!=null&&mv.end!=="clip"&&tr>0.5){ const o=1-s; pos[o][mv.m.by]=[hlLerp(pos[o][mv.m.by][0],b.x,(tr-0.5)*1.6),hlLerp(pos[o][mv.m.by][1],b.y,(tr-0.5)*1.6)] }
    const kits=hlKits(g.home,g.away), r=Math.max(5,W/80), gks=hlFar(["#E8F56B","#C9A0FF","#F2F2F2","#FF9F43","#7CF2D0","#111318"],[kits[0].fill,kits[1].fill]);
    const [qx,qy]=toS(bx,by);
    [0,1].forEach(si=>{ const X=P.XI[si], kt=kits[si], gk=hlKit("",gks[si]);
      pos[si].forEach((p,i)=>{ const [px,py]=toS(p[0],p[1]), on=si===s&&(i===b.s&&tr>=1||i===a.s&&tr<1);
        hlPlayer(x,px,py,r,i?kt:gk,Object.assign({num:X.nums[i],dir:Math.atan2(qy-py,qx-px)},X.nm[i]?{sub:X.nm[i]}:{},on?{hot:true}:{})) }) });
    // the ball's last moments
    const trail=[]; if(a.k!=="pass"||tr<1)for(let q=6;q>=1;q--){ const tq=Math.max(0,tr-q*0.04), eq=lf?tq:hlEase(tq), zq=lf&&tq<1?Math.sin(Math.PI*tq)*lf:0, pp=toS(hlLerp(a.x,b.x,eq),hlLerp(a.y,b.y,eq)); trail.push([pp[0],pp[1]-zq*W]) }
    hlBall(x,qx,qy,r*0.55,z*W,trail.length>1?trail:null);
    const Hd=live.hold, hs=Hd?Hd.h:live.eng.h, as=Hd?Hd.a:live.eng.a;
    hlBug(x,W,H,{home:g.home,away:g.away,hs:hs,as:as,hk:kits[0],ak:kits[1],clock:(Hd&&Hd.clock)||evPB.clock(d,f)});
    const txt=spText(P,mv,k===T.length-2&&u>0.62?T.length-1:k);
    if(txt)hlTicker(x,W,H,txt.charAt(0).toUpperCase()+txt.slice(1),8+Math.max(10,Math.round(W/44))*1.7+6);
    if(mv.end==="card"&&k===T.length-2&&u>0.7)hlBanner(x,W,H,"YELLOW CARD",{fill:"#F2C14E"},(u-0.7)/0.3);
  }
  /* round 101: the full match on a running clock (core hlEvPlan): five minutes a stretch, about twelve seconds of play */
  const evPB={mode:"pb", t0:d=>d.seg*5, span:d=>5, ms:d=>20000,   /* round 103: twenty seconds a stretch at Normal (was twelve), room for the touches */ clock:(d,f)=>Math.min(d.seg>=18?120:90,Math.max(1,Math.floor(d.seg*5+f*5)+1))+"'", skip:d=>!!d.ot};
  const NUM=[1,2,5,6,3,7,4,8,11,9,10];
  /* penalties and red cards: an open-play move first, played in the first part of the clip (pre), then the set piece */
  const openT=(c,t)=>Math.min(0.699,Math.max(0,t)*0.7/c.pre);
  function ballAt(c,t){
    if(c.pre&&c.red){ if(t<c.pre)return ballAt0(c.open,openT(c,t)); const f=c.W[c.W.length-1]; return {bx:f[0]+Math.min(0.01,(t-c.pre)*0.05),by:f[1],z:0,carrier:-1,k:0} }
    if(c.pre&&c.plan==="pen"){ if(t<c.pre)return ballAt0(c.open,openT(c,t)); const f=c.W[c.W.length-1];
      if(t<0.5)return {bx:f[0],by:f[1],z:0,carrier:-1,k:0};
      if(t<0.66){ const s=hlEase((t-0.5)/0.16); return {bx:hlLerp(f[0],c.from[0],s),by:hlLerp(f[1],c.from[1],s),z:0,carrier:-1,k:0} } }
    return ballAt0(c,t) }
  function ballAt0(c,t){
    const n=c.W.length, tb=0.7, ts=0.85; let bx,by,z=0, carrier=-1, k=0;
    if(t<tb&&!(c.plan==="pen"&&c.pre)){ const f=Math.max(0,t)/tb*(n-1); k=Math.min(n-2,Math.floor(f)); const s=hlEase(f-k); const a=c.W[k], b=c.W[k+1];
      bx=hlLerp(a[0],b[0],s); by=hlLerp(a[1],b[1],s); z=Math.sin(s*Math.PI)*(c.plan==="wing"&&k===n-2?0.05:c.plan==="corner"?0.06:0.012); carrier=s<0.15?c.rec[k]:s>0.85?c.rec[k+1]:-1 }
    else if(t<tb&&c.plan==="pen"){ bx=c.from[0]; by=c.from[1] }
    else if(t<ts){ const s=(t-tb)/(ts-tb), a=c.from||c.W[n-1]; const e=c.end;
      bx=hlLerp(a[0],e[0],s); by=hlLerp(a[1],e[1],s)+Math.sin(s*Math.PI)*(c.bend||0); z=Math.sin(s*Math.PI)*(c.lift!=null?c.lift:0.02) }
    else{ const s=(t-ts)/(1-ts); bx=c.end[0]; by=c.end[1];
      if(c.postHit){ bx=1-s*0.12; by=c.end[1]+(c.end[1]<0.5?-1:1)*s*0.08 }
      if(c.kind==="goal"){ bx=Math.min(1.02,c.end[0]+s*0.006) }
      if(c.kept&&c.kind==="save"){ bx=c.end[0]-s*0.01 } }
    return {bx,by,z,carrier,k} }
  /* ---- how they move (round 65) ----
     Attack: the side keeps its 4-4-2 shape, pushed up the pitch with the ball and shifted toward its side. The man who
     takes each pass starts his run before it's played and curves into space; on a move down the wing the full back
     overlaps outside the winger; as the cross or shot comes, the forwards attack the near post, the far post and the
     penalty spot, a midfielder arrives late at the edge of the box. After a goal the scorer wheels away to the corner
     and the nearest team-mates chase him. Defence: a flat back four that holds a line and slides across with the
     ball, a midfield four a step in front, two strikers loitering; the nearest man presses the ball, the next covers;
     in the box each defender picks up the nearest attacker, goal side. The keeper narrows the angle off his line and
     dives at the shot. */
  const BOX=[[0.94,0.43],[0.93,0.6],[0.89,0.5],[0.83,0.46],[0.81,0.32]];   // near post, far post, spot, edge, late
  function attAt(c,t){
    if(c.pre&&t<c.pre+0.08)return attAt0(c.open,openT(c,t));
    if(c.pre&&c.plan==="pen"&&t<0.66){ const a=attAt0(c.open,0.699), b=attAt0(c,0.66), e=hlEase((t-c.pre-0.08)/(0.66-c.pre-0.08)); return a.map((p,i)=>[hlLerp(p[0],b[i][0],e),hlLerp(p[1],b[i][1],e)]) }
    if(c.red){ const a=attAt0(c.open,0.699); return a }   // play stops for the card
    return attAt0(c,t) }
  function attAt0(c,t){
    const n=c.W.length, tb=0.7, ts=0.85, b=ballAt(c,t), bx=b.bx, by=b.by, prog=c.plan==="corner"?1:Math.min(1,t/tb), fin=c.plan==="corner"?1:Math.max(0,Math.min(1,(t-tb*0.75)/(tb*0.3)));
    const wingSide=c.plan==="wing"?(c.W[2]&&c.W[2][1]>0.5?1:0):-1;
    const push=Math.min(0.42,Math.max(0,bx-0.35))*0.9+0.1*prog;
    const pos=BASE.map((p,i)=>{ if(i===0)return [0.05+0.1*prog,0.5+(by-0.5)*0.1];
      const depth=i<5?0.55:i<9?0.8:0.9, a=p[0]+push*depth+0.04*prog, y=0.5+(p[1]-0.5)*(i<5?0.9:1.0)+(by-0.5)*(i<5?0.12:0.22);
      return [a,y] });
    // the full back's overlap down the wing being used
    if(wingSide>=0){ const fb=wingSide?4:1, wg=wingSide?8:5, o=Math.max(0,Math.min(1,(prog-0.2)/0.6));
      pos[fb]=[hlLerp(pos[fb][0],Math.min(0.86,bx+0.12),hlEase(o)),hlLerp(pos[fb][1],wingSide?0.93:0.07,hlEase(o))];
      pos[wg]=[pos[wg][0],hlLerp(pos[wg][1],wingSide?0.78:0.22,hlEase(o))] }
    // the box: forwards and a late midfielder attack it as the final ball comes
    if(c.plan==="corner"){ [2,3].forEach((i,q)=>{ pos[i]=[0.52,0.38+q*0.24] }); [1,4].forEach((i,q)=>{ pos[i]=[0.7,0.2+q*0.6] }) }
    if(c.plan!=="pen"){ const crash=[9,10,6,7,c.plan==="wing"?(wingSide?5:8):5].filter(i=>i!==c.rec[n-1]);
      crash.forEach((i,q)=>{ const tg=BOX[q%BOX.length]; const y=c.plan==="wing"&&wingSide===0?1-tg[1]:tg[1]; pos[i]=[hlLerp(pos[i][0],tg[0],hlEase(fin)*(q<3?1:0.7)),hlLerp(pos[i][1],y,hlEase(fin)*(q<3?1:0.7))] }) }
    else pos.forEach((p,i)=>{ if(i&&i!==c.rec[n-1])pos[i]=i<5?[0.55+((i*7)%3)*0.03,0.25+((i*3)%4)*0.17]:[0.79-((i*7)%3)*0.012,0.2+((i*7)%10)*0.064] });   // a penalty: everyone back outside the box
    // each receiver: starts his run a beat before the pass, curving into the space it's played to
    c.rec.forEach((ri,j)=>{ if(!ri)return; const w=c.W[j], f=t<tb?t/tb*(n-1):n-1, lead=j-f;
      // round 79: the corner's taker stays at the flag until he's struck it, then trots in (he ran into the box before the
      // kick, leaving the ball by the flag with nobody there: Ian)
      if(c.plan==="corner"&&j===0){ const u=Math.max(0,Math.min(1,(t-0.22)/0.78))*0.55; pos[ri]=[hlLerp(w[0],0.88,u),hlLerp(w[1],w[1]>0.5?0.8:0.2,u)]; return }
      if(lead<=-0.15&&j<n-1){ return }
      const s=Math.max(0,Math.min(1,1-(lead-0.05)/1.1)), e=hlEase(s), from=pos[ri], bend=(j%2?1:-1)*0.05*Math.sin(e*Math.PI);
      pos[ri]=[hlLerp(from[0],w[0],e)+bend*0.3,hlLerp(from[1],w[1],e)+bend] });
    if(t>=tb||c.plan==="pen"&&c.pre&&t>=0.66){ const w=c.plan==="pen"&&c.pre?[c.from[0]-0.02,c.from[1]]:c.W[n-1]; pos[c.rec[n-1]]=[w[0],w[1]] }
    // the celebration: the scorer to the corner flag, team-mates after him
    if(c.kind==="goal"&&t>ts){ const s=hlEase((t-ts)/(1-ts)), cy=by<0.5?0.03:0.97, sc=c.rec[n-1];
      pos[sc]=[hlLerp((c.from||c.W[n-1])[0],0.96,s),hlLerp((c.from||c.W[n-1])[1],cy,s)];
      pos.map((p,i)=>[Math.hypot(p[0]-pos[sc][0],p[1]-pos[sc][1]),i]).filter(([d,i])=>i&&i!==sc).sort((a,b2)=>a[0]-b2[0]).slice(0,3)
        .forEach(([d,i],q)=>{ pos[i]=[hlLerp(pos[i][0],0.93-q*0.02,s*0.8),hlLerp(pos[i][1],cy+(cy<0.5?1:-1)*(0.04+q*0.03),s*0.8)] }) }
    return pos.map(p=>[Math.max(0.02,Math.min(0.97,p[0])),Math.max(0.02,Math.min(0.98,p[1]))]) }
  function defAt(c,t,att){
    // a red card: the booked centre-back (no. 5) closes the man on the ball and chops him; then walks off
    if(c.red){ const base=defAt0(c.open,openT(c,Math.min(t,c.pre)),att), f=c.W[c.W.length-1];
      const k=hlEase(Math.min(1,t/c.pre)); base[2]=[hlLerp(base[2][0],f[0]+0.015,k),hlLerp(base[2][1],f[1],k)];
      if(t>c.pre+0.1){ const w=hlEase((t-c.pre-0.1)/(1-c.pre-0.1)); base[2]=[hlLerp(f[0]+0.015,0.75,w),hlLerp(f[1],f[1]<0.5?-0.01:1.01,w)] }
      return base }
    if(c.pre&&t<c.pre+0.08)return defAt0(c.open,openT(c,t),att);
    if(c.pre&&c.plan==="pen"&&t<0.66){ const a=defAt0(c.open,0.699,att), b=defAt0(c,0.66,att), e=hlEase((t-c.pre-0.08)/(0.66-c.pre-0.08)); return a.map((p,i)=>p&&[hlLerp(p[0],b[i][0],e),hlLerp(p[1],b[i][1],e)]) }
    return defAt0(c,t,att) }
  function defAt0(c,t,att){
    const n=c.W.length, tb=0.7, ts=0.85, b=ballAt(c,t), bx=b.bx, by=b.by, fin=c.plan==="corner"?1:Math.max(0,Math.min(1,(t-tb*0.75)/(tb*0.3)));
    const line=Math.min(0.9,Math.max(0.62,bx+0.12)), mid=line-0.15, top=line-0.3, sy=0.5+(by-0.5)*0.42, wid=0.36;
    const pos=[null,
      [line,sy-wid*0.82],[line+0.005,sy-wid*0.27],[line+0.005,sy+wid*0.27],[line,sy+wid*0.82],
      [mid,sy-wid*0.9],[mid-0.01,sy-wid*0.3],[mid-0.01,sy+wid*0.3],[mid,sy+wid*0.9],
      [top,sy-0.12],[top,sy+0.12]];
    // in the box at the end: each defender goes goal side of the nearest attacker in it
    if(fin>0){ const inBox=(att||[]).map((p,i)=>p&&i&&p[0]>0.8?i:-1).filter(i=>i>=0), used={};
      [2,3,1,4,6,7].forEach(d=>{ let best=-1,bd=9; inBox.forEach(a=>{ if(used[a])return; const dd=Math.hypot(att[a][0]-pos[d][0],att[a][1]-pos[d][1]); if(dd<bd){bd=dd;best=a} });
        if(best<0)return; used[best]=1; const m=att[best]; pos[d]=[hlLerp(pos[d][0],Math.min(0.97,m[0]+0.025),hlEase(fin)),hlLerp(pos[d][1],hlLerp(m[1],0.5,0.2),hlEase(fin))] }) }
    if(c.plan==="pen"){ for(let i=1;i<11;i++)pos[i]=i<9?[0.805+((i*5)%3)*0.01,0.23+((i*3)%10)*0.064]:[0.6,0.4+(i-9)*0.2]; pos[0]=[0.99,0.5]; const dv=keeperDive(c,t); if(dv)pos[0]=[0.99,hlLerp(0.5,dv.y,dv.k)];
      return pos.map(p=>p&&[Math.max(0.03,Math.min(0.99,p[0])),Math.max(0.02,Math.min(0.98,p[1]))]) }
    // the press: the nearest outfield man to the ball closes it, the next drops in behind him
    const nr=pos.map((p,i)=>p&&i?[Math.hypot(p[0]-bx,p[1]-by),i]:null).filter(Boolean).sort((a,b2)=>a[0]-b2[0]);
    if(nr[0]){ const i=nr[0][1]; pos[i]=[hlLerp(pos[i][0],bx+0.02,0.7),hlLerp(pos[i][1],by,0.7)] }
    if(nr[1]){ const i=nr[1][1]; pos[i]=[hlLerp(pos[i][0],Math.min(0.95,bx+0.07),0.4),hlLerp(pos[i][1],hlLerp(by,0.5,0.4),0.4)] }
    // the keeper: off his line on the angle between ball and goal
    const ang=Math.atan2(by-0.5,1-bx), off=Math.min(0.03,Math.max(0.008,0.03*(1-Math.hypot(1-bx,by-0.5)/0.6)));
    let gx=0.99-off*Math.cos(ang), gy=0.5+Math.max(-0.045,Math.min(0.045,(by-0.5)*0.25));
    const dv=keeperDive(c,t); if(dv){ gy=hlLerp(gy,dv.y,dv.k); gx=Math.min(0.99,gx+0.004*dv.k) }
    pos[0]=[gx,gy];
    return pos.map(p=>p&&[Math.max(0.03,Math.min(0.99,p[0])),Math.max(0.02,Math.min(0.98,p[1]))]) }
  /* the dive: from the moment the shot is struck. Saves are reached; goals are dived at a beat late, or the wrong way
     when it goes in the other half of the goal from where he started */
  function keeperDive(c,t){
    const tb=0.7, ts=0.85; if(c.red||t<tb+0.04||c.plan==="pen"&&t<tb)return null;
    if(c.how==="over"||c.how==="wide")return null;
    const s=Math.min(1,(t-tb-0.04)/(ts-tb)), k=hlEase(s);
    let y=c.end[1]; if(c.kind==="goal"){ const wrong=((c.e&&c.e.u)||0)%3===0; y=wrong?0.5-(c.end[1]-0.5)*0.9:hlLerp(0.5,c.end[1],0.7) }
    const dir=y>0.5?1:-1; return {y:Math.max(0.44,Math.min(0.56,y)),k:k*(c.kind==="goal"?0.9:1),dir:dir} }
  function frame(x,W,H,c,t){
    const n=c.W.length, tb=0.7, ts=0.85;
    const {bx,by,z}=ballAt(c,t);
    const prog=Math.min(1,t/tb);   // how far the attack has come
    const kA=c.kits[c.home?0:1], kD=c.kits[c.home?1:0];
    // positions are where each player is heading, averaged over the last moments: players accelerate and settle
    // rather than snap (a stateless lag, so a frame is the same however it's reached)
    const lag=(fn)=>{ const S=[0,0.02,0.04,0.06], out=[]; S.forEach((dt,q)=>{ const P2=fn(Math.max(0,t-dt)); P2.forEach((p,i)=>{ if(!out[i])out[i]=[0,0,0]; if(!p)return; const wgt=4-q; out[i][0]+=p[0]*wgt; out[i][1]+=p[1]*wgt; out[i][2]+=wgt }) });
      return out.map(o=>o[2]?[o[0]/o[2],o[1]/o[2]]:null) };
    const att=lag(tt=>attAt(c,tt)), def=lag(tt=>defAt(c,tt,att));
    // round 103: in the full match the shot's move grows out of the play before it: each man starts from where the
    // touch-by-touch play had him (found by his shirt) and runs into the move's shape over its first moments
    if(c.pbFrom&&t<0.16){ const w=1-hlEase(t/0.16), s0=c.home?0:1, w0=c.W[0], hx=s0?1-w0[0]:w0[0], hy=s0?1-w0[1]:w0[1], S=spShape(hx,hy,s0===0), fr=q=>s0?[1-q[0],1-q[1]]:q;
      const XA=spXI(c.pbFrom,c.tm), XD=spXI(c.pbFrom,c.opp);
      att.forEach((q,i)=>{ if(!q)return; const j=c.numsA?XA.nums.indexOf(c.numsA[i]):i, src=fr(S[s0][j>=0?j:i]); att[i]=[hlLerp(q[0],src[0],w),hlLerp(q[1],src[1],w)] });
      def.forEach((q,i)=>{ if(!q)return; const j=c.numsD?XD.nums.indexOf(c.numsD[i]):i, src=fr(S[1-s0][j>=0?j:i]); def[i]=[hlLerp(q[0],src[0],w),hlLerp(q[1],src[1],w)] }) }
    const kick=t>=tb&&t<ts+0.02, sIdx=c.rec[n-1];
    const r=Math.max(5,W/80), [qx,qy]=P(W,H,c,Math.min(1.03,bx),by);
    // the move so far, faint, and the shot once it's struck
    const bEnd=c.pre||tb, pg=Math.min(1,t/bEnd);
    const done=[]; for(let q=0;q<=Math.min(n-1,Math.floor(pg*(n-1)));q++)done.push(P(W,H,c,c.W[q][0],c.W[q][1]));
    if(done.length){ done.push(t<bEnd?[qx,qy]:P(W,H,c,c.W[n-1][0],c.W[n-1][1])); hlPath(x,done,"rgba(255,255,255,.35)",[4,5],1.3) }
    if(t>=tb&&!c.red){ const a=P(W,H,c,c.from[0],c.from[1]); hlPath(x,[a,[qx,qy]],c.kind==="goal"&&t>=ts?"rgba(255,226,92,.85)":"rgba(255,255,255,.6)",null,1.8) }   // gold only once it's in
    const face=(px,py)=>Math.atan2(qy-py,qx-px);
    const dv=keeperDive(c,t);
    def.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]);
      if(i===0&&dv){ const ang=((c.lr!=null?c.lr:c.home)?1:-1)*(dv.dir>0?Math.PI/2:-Math.PI/2); hlPlayer(x,px,py,r,hlKit("",c.gk[1]),{dive:{ang:ang,k:dv.k}}); return }
      const sent=c.red&&i===2&&t>=c.pre, fade=sent&&t>c.pre+0.1?Math.max(0.25,1-(t-c.pre-0.1)*1.8):null;
      hlPlayer(x,px,py,r,i?kD:hlKit("",c.gk[1]),{num:c.numsD?c.numsD[i]:NUM[i],sub:c.subD&&!sent?c.subD[i]:"",dir:face(px,py),alpha:fade,label:sent?c.nm:"",hot:sent});
      if(sent){ x.save(); x.translate(px+r*1.3,py-r*1.6); x.rotate(0.2); x.fillStyle="#E3262F"; x.fillRect(-r*0.45,-r*0.65,r*0.9,r*1.3); x.strokeStyle="rgba(0,0,0,.5)"; x.lineWidth=0.8; x.strokeRect(-r*0.45,-r*0.65,r*0.9,r*1.3); x.restore() } });
    att.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]); const hot=!c.red&&i===sIdx&&t>=ts; hlPlayer(x,px,py,r,i?kA:hlKit("",c.gk[0]),{num:c.numsA?c.numsA[i]:NUM[i],sub:c.subA&&!hot?c.subA[i]:"",dir:face(px,py),hot:hot,label:hot?c.nm:""}) });
    // the ball and the last few moments of its path
    const tr=[]; for(let q=8;q>=1;q--){ const b=ballAt(c,t-q*0.012); const pp=P(W,H,c,Math.min(1.03,b.bx),b.by); tr.push([pp[0],pp[1]-b.z*W]) }
    hlBall(x,qx,qy,r*0.55,z*W,t>0.1?tr:null);
    // the score bug, the commentary, and what happened
    const scored=c.kind==="goal"&&t>=ts, hs=c.sh+(scored&&c.home?1:0), as=c.sa+(scored&&!c.home?1:0);
    hlBug(x,W,H,{home:c.home0,away:c.away0,hs:hs,as:as,hk:c.kits[0],ak:c.kits[1],clock:c.m+"'"});
    const said=c.red?t>=c.pre+0.04:t>=ts;
    if(said&&c.text)hlTicker(x,W,H,c.text,8+Math.max(10,Math.round(W/44))*1.7+6);
    if(c.red){ if(said)hlBanner(x,W,H,`RED CARD! ${c.nm||""}`.trim(),{fill:"#E3262F"},(t-c.pre-0.04)/(1-c.pre)); return }
    if(c.plan==="pen"&&c.pre&&t>=c.pre+0.03&&t<tb)hlBanner(x,W,H,"PENALTY!",null,(t-c.pre-0.03)/(tb-c.pre));
    const end=t>=ts?({goal:hlGoalWord(c.gno||1,c.nm),save:"Saved!",post:"Off the post!",over:"Over the bar!",blocked:"Cleared off the line!",wide:"Wide!"})[c.how]||"":null;
    if(end)hlBanner(x,W,H,end,c.kind==="goal"?kA:null,(t-ts)/(1-ts));
  }
  // round 72: the header's clock while a clip plays: the clip's minute
  const headClock=c=>c&&!c.so&&c.m!=null?c.m+"'":null;
  return {reveal:0.85, ambient:true, aspect:0.62, clips, pitch, idle, frame, headClock, evPB, amb:(x,W,H,d,f)=>d&&f!=null&&d.seg!=null&&!d.ot?spDraw(x,W,H,d,f):ambient(x,W,H), playback:(L,d)=>hlEvPlayback(L,d), spPlan, spCounts, spXI};
})();
