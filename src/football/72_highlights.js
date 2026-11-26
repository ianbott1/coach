/* Football's highlights (round 51, core 97_highlights): a touchdown, played out from the snap. The engine plays whole
   drives, not plays, and names no scorer on the drive chart, so the scoring play is drawn by position, not name: a
   pass to a receiver or a run, from a distance the drive's draw picks, ending in the end zone the way the drive did.
   In "goals" mode, only touchdowns in the fourth quarter of a one-score game. The home side drives to the left, as
   the drive chart's field has it. */
const HL_SPORT=(function(){
  const PADX=0.02, PADY=0.06, Y=v=>(v+10)/120;   // yards (0 own goal line .. 100 the one attacked) to the field's length with end zones
  // offense at the snap, relative to the line of scrimmage (yards back, across 0..1): QB, RB, WR, WR, TE, slot, then five linemen
  const OFF=[[-5,0.5],[-7,0.5],[-0.5,0.08],[-0.5,0.92],[-0.8,0.66],[-1,0.2],[-0.5,0.4],[-0.5,0.45],[-0.5,0.5],[-0.5,0.55],[-0.5,0.6]];
  const DEF=[[1,0.42],[1,0.47],[1,0.53],[1,0.58],[4.5,0.35],[4.5,0.5],[4.5,0.65],[6,0.1],[6,0.9],[12,0.32],[12,0.68]];
  /* round 67: field goals (made and missed) and interceptions too, so a clip isn't always a touchdown (Ian) */
  // round 72: the header names the drive a clip shows (it named the drive before it until the clip was over)
  function clips(L,d,mode){ let out=clips0(L,d,mode), afterCall=false; const n=(L.drives||[]).indexOf(d);
    if(mode==="full"){ const dc=mkDrive(L,d,out);   // round 99: the drive itself, play by play
      if(dc){ if(dc.conv)out=out.filter(c=>c.kind!=="conv");
        // round 101: what the lead-up to a call already showed (leadUp) isn't shown again: the plays to the fourth down,
        // or the whole drive and its touchdown before the two-point call
        const sk=leadFor(L,d);
        if(sk){ dc.plays=dc.plays.slice(sk.k); dc.base=Math.max(1,dc.plays.length)*1100; if(sk.all)out=[]; afterCall=true }
        if(!sk||(!sk.all&&dc.plays.length))out=[dc].concat(out);
        // round 101: the live game keeps what the screen showed of this drive, from its first clip, for the box score
        if(typeof live!=="undefined"&&live&&L===live){ const rec=dc.rec; if(sk){ d.pbShown=true; d._pb=rec } else if(out.length)out[0].onStart=()=>{ d.pbShown=true; d._pb=rec } } } }
    // round 107: the clip's header carries the game clock at the drive's start, as the header between drives does (the
    // clock went missing while plays ran: Muse)
    // round 110: what's left of a drive after a call goes on from the call's clock (the call reads the drive 0.7 of the way
    // through: 75_screens), not the drive's start (the clock stepped back about two minutes after every call: Muse, 10 of 10)
    const di=n>=0?n:Math.max(0,(L.drives||[]).length-1), ck=typeof fbClock==="function"&&ENGINE_V>=7&&d.q<5?" "+fbClock(d.q,di+(afterCall?0.7:0),DRIVES_PER_TEAM*2):"";
    out.forEach(c=>{ c.hd=d.q>=5?"OT":"Q"+d.q+ck+" \u00b7 drive "+(di+1); c.scores=d.kind==="TD"||d.kind==="FG" }); return out }
  function clips0(L,d,mode){
    const k=d.kind; if(d.q===5&&!d.pts&&k==="TD")return [];
    const close=Math.abs((d.h||0)-(d.a||0))<=8;
    // round 80: a fourth down they went for and made plays too, before what the drive came to (Ian: "fourth-down plays
    // always shown"; round 79 showed only the failed ones)
    const conv=mode!=="goals"&&d.converted===true&&/converted on fourth and (\d+)/.test(d.note||"")?[mkConv(L,d)]:[];
    if(k==="TD"){ if(mode==="goals"&&!(d.q>=4&&close))return []; return conv.concat([mk(L,d)]) }
    if(mode==="goals")return [];
    if(conv.length&&k!=="FG"&&k!=="MISS"&&k!=="INT"&&k!=="FUM"&&k!=="DOWNS"&&k!=="PUNT")return conv;
    const all=mode==="all"||mode==="full";   // round 68: every kick and every pick
    if(k==="FG"||k==="MISS"&&(all||(d.stall||0)>=62))return conv.concat([mkKick(L,d)]);
    if(k==="INT")return conv.concat([mkPick(L,d)]);   // round 70: every turnover (Ian: "I didn't see any turnovers")
    if(k==="FUM")return conv.concat([mkFum(L,d)]);
    if(k==="DOWNS"&&ENGINE_V>=7)return conv.concat([mkDowns(L,d)]);
    // round 81: punts and their returns (Ian), from where it was kicked to where they took over (d.retTo, read ahead):
    // every punt in "every chance" and the full game, a long return (15+) in key moments
    if(k==="PUNT"&&retTo(L,d)!=null&&(d.lost!=null||d.stall!=null)){ const c=mkPunt(L,d); if(all||c.ret>=15)return conv.concat([c]) }   // round 79: a fourth-down try that fails is shown (Ian: "fourth-down plays always shown")
    return conv;
  }
  // round 67: numbers. The tracked man at each position wears his own (QB, RB, both WRs, a lineman; edge, tackle,
  // linebacker, corner, safety); the rest of the eleven take free numbers in their position's range. Key below.
  const OFF_SL={0:0,1:1,2:2,3:3,8:4}, DEF_SL={0:5,1:6,5:7,7:8,9:9};
  const FILL_O=[null,null,null,null,85,11,72,64,null,61,77], FILL_D=[null,null,97,94,52,null,45,null,24,null,31];
  /* round 99 (Muse: after "rest your starters" the clips still named the starters): from the drive after you rest them,
     your side's tracked men are their backups */
  let REST=false;
  function numbers(team,SL,fill){ const R=(SEA.roster&&SEA.roster[team])||[], nums=fill.slice(), list=[], used={}, nm=[], ri=[];
    Object.keys(SL).forEach(k=>{ let i=hlFit(team,SL[k]); if(REST&&team===S.myTeam&&typeof BK==="function"&&R[BK(SL[k])])i=hlFit(team,BK(SL[k])); if(R[i]){ const n=shirtNo(team,i); nums[k]=n; used[n]=1; nm[k]=String(R[i].n).split(" ").slice(-1)[0]; ri[k]=i; list.push([n,nm[k]]) } });
    nums.forEach((v,k)=>{ if(SL[k]===undefined&&v!=null){ let w=v; while(used[w])w++; nums[k]=w; used[w]=1 } }); return {nums,list,nm,ri} }
  /* round 99 (Ian: "still can't see players numbers on field goal kicks"): the kicking unit wears numbers. The roster
     carries no kicker, holder or snapper, so they take numbers no one on the roster wears (the kicker the one named by
     kickerName, a single digit or teens; the holder a backup's number in the teens; the line from the 50s-70s), the same
     every time for a club; the rush is the defense's numbers. */
  function stNums(team){ const R=(SEA.roster&&SEA.roster[team])||[], used={}; R.forEach((p,i)=>{ if(p){ const n=shirtNo(team,i); if(n!=null)used[n]=1 } });
    const h=strHash("st|"+team), pick=(lo,hi,k)=>{ const span=hi-lo+1; for(let j=0;j<span;j++){ const v=lo+((h+k*31+j*7)%span); if(!used[v]){ used[v]=1; return v } } return lo };
    return {k:pick(1,19,1), h:pick(10,19,2), line:[0,1,2,3,4,5,6,7,8].map(j=>pick(50,79,3+j))} }
  function base(L,d){ REST=!!(L&&L.restAt!=null&&L.drives&&L.drives.indexOf(d)>=L.restAt); const g=L.g, tm=d.home?g.home:g.away, opp=d.home?g.away:g.home, K=hlKits(g.home,g.away), O=numbers(tm,OFF_SL,FILL_O), D=numbers(opp,DEF_SL,FILL_D);
    return {offN:O.nums,defN:D.nums,onm:O.nm,ori:O.ri,dnm:D.nm,legend:[{team:tm,kit:K[d.home?0:1],list:O.list},{team:opp,kit:K[d.home?1:0],list:D.list}],d,tm:d.home?g.home:g.away,opp:d.home?g.away:g.home,home:!!d.home,q:d.q,inks:hlKits(g.home,g.away).map(k=>k.fill),kits:hlKits(g.home,g.away),hm:g.home,aw:g.away,ot:d.q>=5} }
  function mkKick(L,d){ const r=mulberry32(((d.n||1)*7919+(d.stall||0)*131+(d.home?17:29))>>>0), los=Math.max(25,Math.min(99,d.stall||75));
    // the kick's own length, as the run of play gives it; some hook, some start wide and curl back (round 70: Ian)
    const good=d.kind==="FG", hook=r()<0.45, wide=r()<0.5?-1:1;
    const B=base(L,d), team=d.home?L.g.home:L.g.away, st=stNums(team), kn=typeof kickerName==="function"?kickerName(team):null;
    B.legend=[{team,kit:B.kits[d.home?0:1],list:[[st.k,kn?String(kn).split(" ").slice(-1)[0]:"K"],[st.h,"holder"]]},B.legend[1]];
    return Object.assign(B,{st,kind:good?"fg":"miss",los,kicker:kn,dist:typeof fgDistance==="function"?fgDistance(d.stall||los):Math.round(100-los+17),wide,hook,
      endY:good?0.5+wide*(0.005+r()*0.03):0.5+wide*(0.085+r()*0.05),startY:hook?(good?0.5+wide*0.09:0.5-wide*0.02):0.5,base:3400,reveal:0.82}) }
  function mkFum(L,d){ const r=mulberry32(((d.n||1)*7919+(d.stall||0)*131+(d.home?19:31))>>>0), los=Math.max(3,Math.min(97,d.lost||d.stall||50)), len=Math.round(3+r()*Math.min(8,99-Math.max(3,Math.min(97,d.lost||d.stall||50))));
    const m=/recovered by (.*)$/.exec(rowText(L,d));
    return Object.assign(base(L,d),{kind:"fum",pass:false,los,rcv:1,len,catchY:Math.min(99,los+len),lane:0.38+r()*0.24,who:m?surname(m[1]):"",base:3200,reveal:0.66}) }
  function mkDowns(L,d){ const r=mulberry32(((d.n||1)*7919+(d.stall||0)*131+(d.home?23:37))>>>0), los=Math.max(1,Math.min(99,d.stall||(d.start||30)+20+Math.round(r()*20))), tg0=d.togo||+((/fourth and (\d+)/.exec(d.note||"")||[])[1])||2, tg=Math.max(1,Math.min(30,tg0)), len=Math.max(0,tg-1-Math.floor(r()*Math.min(3,tg)));
    return Object.assign(base(L,d),{kind:"downs",pass:false,los,rcv:1,len,togo:tg,catchY:Math.min(99,los+len),lane:0.4+r()*0.2,who:"",base:3000,reveal:0.86}) }
  function mkConv(L,d){ const r=mulberry32(((d.n||1)*7919+(d.start||0)*131+(d.home?41:43))>>>0), tg=Math.max(1,Math.min(9,+(/converted on fourth and (\d+)/.exec(d.note||"")||[0,2])[1])),
      los=Math.max(25,Math.min(90,(d.start||25)+12+Math.round(r()*30))), len=tg+Math.round(r()*Math.min(6,95-los-tg));
    return Object.assign(base(L,d),{kind:"conv",pass:false,los,rcv:1,len,togo:tg,catchY:Math.min(99,los+len),lane:0.38+r()*0.24,who:"",base:3000,reveal:0.86}) }
  // round 80: the pick from where the ball was lost (d.lost), run back to where they took over (d.retTo: the next drive's
  // start, read ahead in the engine), with the passing side chasing him; the catch comes earlier to leave the run room
  // where they took over: read ahead in the engine, or (a game played before round 80, or simmed) the next drive's start
  function retTo(L,d){ if(d.retTo!=null)return d.retTo; const i=(L.drives||[]).indexOf(d), nx=i>=0?L.drives[i+1]:null; return nx&&nx.start!=null&&(d.lost!=null||d.stall!=null)?nx.start:null }
  function mkPunt(L,d){ const rt=retTo(L,d), lost=d.lost!=null?d.lost:d.stall, r=mulberry32(((d.n||1)*7919+(lost||0)*131+(d.home?47:53))>>>0), los=Math.max(1,Math.min(99,lost)), end=100-rt;
    const tb=rt===20&&los+40>=95, fair=!tb&&r()<0.25;
    let land=tb?104:fair?end:Math.min(99,end+Math.round(2+r()*Math.min(14,99-end)));
    if(land<=los+15)land=Math.min(99,los+30);
    const ret=tb||fair?0:Math.max(0,land-end);
    return Object.assign(base(L,d),{kind:"punt",los,land,end,ret,tb,fair,lane:0.35+r()*0.3,who:"",base:3600+ret*35,reveal:0.95}) }
  function mkPick(L,d){ const r=mulberry32(((d.n||1)*7919+(d.stall||0)*131+(d.home?17:29))>>>0), los=Math.max(3,Math.min(97,d.lost||d.stall||70));
    const rcv=r()<0.6?2:3; let len=Math.round(8+r()*Math.min(25,100-los-2));
    let ret=null; const rtp=retTo(L,d); if(rtp!=null){ const end=100-rtp; len=Math.max(3,Math.min(len,Math.round(4+r()*10))); if(end>los+len)len=Math.min(99-los,end-los+1); ret=Math.max(0,Math.min(99,los+len)-end) }   // round 94: from where he catches it (a pick past 99 is caught at 99: the return ran 4 yards long)
    if(ret!=null){ const m=/intercepted by (.*)$/.exec(rowText(L,d)), f=ret>3?0.6:0.86;
      return Object.assign(base(L,d),{kind:"int",who:m?surname(m[1]):"",tight:true,pass:true,los,rcv,len,catchY:Math.min(99,los+len),lane:(rcv===2?0.18:0.82)+(r()-0.5)*0.1,base:3400+(f<0.86?1200+40*ret:0),reveal:f,f,ret,retEnd:100-rtp}) }
    const m=/intercepted by (.*)$/.exec(rowText(L,d));
    return Object.assign(base(L,d),{kind:"int",who:m?surname(m[1]):"",tight:true,pass:true,los,rcv,len,catchY:Math.min(99,los+len),lane:(rcv===2?0.18:0.82)+(r()-0.5)*0.1,base:3400,reveal:0.86}) }
  /* the run of play's line for this drive (driveScript draws its words in drive order from the game's seed, so the
     prefix up to this drive gives the same line the page shows): the clip plays what it says (round 70: Ian, "who
     scored it"; the clip had picked its own pass or run and length) */
  function rowText(L,d){ try{ const i=L.drives.indexOf(d); if(i<0||typeof driveScript!=="function")return ""; const sc=driveScript(L.g,L.drives.slice(0,i+1)); return (sc[sc.length-1]||{}).text||"" }catch(e){ return "" } }
  const surname=n=>String(n||"").split(" ").slice(-1)[0];
  function mk(L,d){
    const g=L.g, tm=d.home?g.home:g.away;
    const r=mulberry32(((d.n||1)*7919+(d.h||0)*131+(d.a||0)*37+(d.home?17:29))>>>0);
    let pass=r()<0.56, len=pass?Math.round(4+r()*45):Math.round(1+r()*30), rcv=pass?(r()<0.62?2:3):1, who="", qbRun=false;
    const T=rowText(L,d), off=(SEA.roster&&SEA.roster[tm])||[], mp=/^(.*?) (\d+)-yd TD pass to (.*)$/.exec(T), mr=/^(.*?) (\d+)-yd TD run$/.exec(T);
    if(mp){ pass=true; len=+mp[2]; who=mp[3]; rcv=off[3]&&off[3].n===who?3:2 }
    else if(mr){ pass=false; len=+mr[2]; who=mr[1]; qbRun=!!(off[0]&&off[0].n===who); rcv=1 }
    const los=100-len;
    // most balls are contested: the corner stays with the receiver; now and then he's beaten clean
    const tight=pass&&r()<0.7;
    const catchY=pass?Math.min(104,100+Math.round(r()*6)):104, lane=pass?(rcv===2?0.15:0.85)+(r()-0.5)*0.1:0.4+r()*0.2;
    const inks=hlKits(g.home,g.away).map(k=>k.fill);
    return Object.assign(base(L,d),{kind:"td",pass,len,los,rcv,catchY,lane,who:surname(who),qbRun,tight,base:3400,reveal:0.86});
  }
  const P=(W,H,c,yd,y)=>{ const f=Y(yd), X=c.home?1-f:f, YY=c.home?1-y:y; return [W*PADX+X*W*(1-2*PADX), H*PADY+YY*H*(1-2*PADY)] };
  function pitch(x,W,H){
    const bg=x.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#161B26"); bg.addColorStop(1,"#0E121A"); x.fillStyle=bg; x.fillRect(0,0,W,H);
    const L=W*PADX, T=H*PADY, w=W*(1-2*PADX), h=H*(1-2*PADY);
    // the sideline apron, then turf mown in five-yard bands
    x.fillStyle="#24602E"; x.fillRect(L-W*0.008,T-H*0.03,w+W*0.016,h+H*0.06);
    hlGrass(x,L,T,w,h,{bands:24,base:"#2B7536",alt:"#32823E",seed:21});
    // the end zones: painted, with the diagonal stripes
    [0,110].forEach(y0=>{ const ex=L+w*y0/120, ew=w*10/120; x.fillStyle="rgba(20,40,90,.55)"; x.fillRect(ex,T,ew,h);
      x.save(); x.beginPath(); x.rect(ex,T,ew,h); x.clip(); x.strokeStyle="rgba(255,255,255,.08)"; x.lineWidth=ew*0.12;
      for(let k=-h;k<ew+h;k+=ew*0.35){ x.beginPath(); x.moveTo(ex+k,T); x.lineTo(ex+k-h,T+h); x.stroke() } x.restore() });
    const lw=Math.max(1,W/700);
    hlLines(x,lw,()=>{
      x.strokeRect(L,T,w,h);
      for(let yd=0;yd<=100;yd+=5){ const px=L+w*Y(yd); x.lineWidth=yd===0||yd===100?lw*2.2:yd%10?lw*0.8:lw; x.beginPath(); x.moveTo(px,T); x.lineTo(px,T+h); x.stroke() }
      // the hash marks, every yard, at the sidelines and between the hashes
      x.lineWidth=lw*0.7; for(let yd=1;yd<100;yd++){ if(yd%5===0)continue; const px=L+w*Y(yd);
        [[T,T+h*0.025],[T+h-h*0.025,T+h],[T+h*0.4,T+h*0.415],[T+h*0.585,T+h*0.6]].forEach(([a,b])=>{ x.beginPath(); x.moveTo(px,a); x.lineTo(px,b); x.stroke() }) }
    });
    // the numbers, with their direction arrows, as painted on the field
    const fs=Math.max(8,Math.round(h/13)); x.font=`700 ${fs}px 'Barlow Condensed',Impact,sans-serif`; x.textAlign="center"; x.textBaseline="middle";
    [10,20,30,40,50,60,70,80,90].forEach(yd=>{ const v=Math.min(yd,100-yd), px=L+w*Y(yd);
      [[T+h*0.15,0],[T+h*0.85,Math.PI]].forEach(([py,rot])=>{ x.save(); x.translate(px,py); x.rotate(rot); x.fillStyle="rgba(246,250,242,.8)"; x.fillText(String(v),0,0);
        if(yd!==50){ const sd=yd<50?-1:1, ax=sd*(x.measureText(String(v)).width/2+fs*0.3)*(rot?-1:1); x.beginPath(); x.moveTo(ax+sd*fs*0.22*(rot?-1:1),-fs*0.3); x.lineTo(ax,-fs*0.42); x.lineTo(ax,-fs*0.18); x.closePath(); x.fill() }
        x.restore() }) });
    // the goalposts, seen from above
    [L,L+w].forEach((gx,k)=>{ const sd=k?1:-1; x.strokeStyle="#F2D24B"; x.lineWidth=2.4; x.beginPath(); x.moveTo(gx+sd*w*0.006,T+h*0.45); x.lineTo(gx+sd*w*0.006,T+h*0.55); x.stroke();
      x.beginPath(); x.moveTo(gx,T+h*0.5); x.lineTo(gx+sd*w*0.006,T+h*0.5); x.stroke() });
  }
  function idle(x,W,H){}   // round 67: nothing to say until something happens (Ian)
  /* the end zones in the two sides' colours with their names, as the drive chart has them */
  function endZones(x,W,H,c){
    [[-10,c.home?c.hm:c.aw],[100,c.home?c.aw:c.hm]].forEach(([y0,team])=>{ const a=P(W,H,c,y0,0), b=P(W,H,c,y0+10,1), l=Math.min(a[0],b[0]), w=Math.abs(b[0]-a[0]), tp=Math.min(a[1],b[1]), h=Math.abs(b[1]-a[1]);
      const k=c.kits[team===c.hm?0:1]; x.save(); x.globalAlpha=0.78; x.fillStyle=k.fill; x.fillRect(l,tp,w,h); x.globalAlpha=1;
      const nm=String(team).toUpperCase(), fs=Math.max(8,Math.min(w*0.62,h/Math.max(4,nm.length)*1.25)); x.translate(l+w/2,tp+h/2); x.rotate(l<W/2?-Math.PI/2:Math.PI/2);
      x.font=`800 ${fs}px 'Barlow Condensed',Impact,sans-serif`; x.textAlign="center"; x.textBaseline="middle"; x.fillStyle=k.num; x.globalAlpha=0.9; x.fillText(nm,0,1,h*0.92); x.restore() }) }
  // a punt: the snap back to the punter, the ball up and away, the coverage team down the field, the returner under it and
  // back to where they take over (or a fair catch, or a touchback)
  function puntFrame(x,W,H,c,t){
    const snap=0.12, kick=0.24, landT=0.58, tEnd=0.92, pY=Math.max(-9.5,c.los-13), r=Math.max(4.5,W/100), ink=c.inks[c.home?0:1], dink=c.inks[c.home?1:0];
    let bx,by,z=0; const ret=c.ret, rs=Math.max(0,Math.min(1,(t-landT)/(tEnd-landT)));
    const retAt=s=>[hlLerp(c.land,c.end,hlEase(s)),hlLerp(c.lane,0.5,hlEase(s)*0.4)];
    if(t<snap){ bx=c.los; by=0.5 } else if(t<kick){ const s=(t-snap)/(kick-snap); bx=hlLerp(c.los,pY,s); by=0.5 }
    else if(t<landT){ const s=(t-kick)/(landT-kick); bx=hlLerp(pY,c.land,s); by=hlLerp(0.5,c.lane,s); z=Math.sin(s*Math.PI)*0.16 }
    else if(c.tb){ bx=Math.min(110,c.land+rs*4); by=c.lane } else { const q=retAt(rs); bx=q[0]; by=q[1] }
    // the punting side: a line of eleven, the gunners wide, all running down the field after the kick
    const off=[...Array(11)].map((_,i)=>{ if(i===0)return t<kick?[pY,0.5]:[pY+(t-kick)*8,0.5];
      const y0=i<=2?(i===1?0.06:0.94):0.3+(i-3)*0.055, y1=c.lane+((i%5)-2)*0.07, s=Math.max(0,Math.min(1,(t-snap)/(landT-snap))), fy=hlLerp(c.los,c.land-3-(i%4)*2,hlEase(s)*(i<=2?1:0.85));
      const chase=Math.max(0,Math.min(1,(t-landT)/(tEnd-landT))); const q=retAt(chase);
      return t<=snap?[c.los-0.5,y0]:[hlLerp(fy,q[0]+2+(i%3),chase*0.7),hlLerp(hlLerp(y0,y1,s),q[1]+((i%2)?0.05:-0.05),chase*0.7)] });
    const def=[...Array(11)].map((_,i)=>{ if(i===0){ return t<landT?[c.land,c.lane]:c.tb?[c.land,c.lane]:retAt(rs) }
      const y=0.2+(i-1)*0.065, d0=i<=6?c.los+1:c.land-12-(i%3)*4, s=Math.max(0,Math.min(1,(t-snap)/(landT-snap)));
      return [hlLerp(d0,c.land-8-(i%4)*3,s*(i<=6?0.7:0.4))-(t>landT?rs*Math.min(ret,10)*0.5:0),hlLerp(y,c.lane+((i%3)-1)*0.12,s*0.5)] });
    def.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)",i===0&&t>landT-0.08?"PR":"",c.defN?{num:c.defN[i%c.defN.length]}:null) });
    off.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,ink,"rgba(0,0,0,.6)",i===0&&t<landT?"P":"",c.offN?{num:c.offN[i%c.offN.length]}:null) });
    const [qx,qy]=P(W,H,c,bx,by); hlBall(x,qx,qy,r*0.55,z*W,null,{kind:"oval",fill:"#8A5428",ring:"#2a1406"});
    const top=`${c.ot?"Overtime":"Q"+c.q} \u00b7 ${c.tm} punt`, yds=Math.min(100,c.land)-c.los;
    const end=t>=tEnd?(c.tb?`PUNT, ${Math.min(99,yds)} yards: touchback`:c.fair?`PUNT, ${yds} yards: fair catch`:`PUNT, ${yds} yards: returned ${ret} yard${ret===1?"":"s"}`):null;
    hlCaption(x,W,H,top,end,null); fbFeedEnd(c,end) }
  function kickFrame(x,W,H,c,t){
    const snap=0.15, kick=0.3, tEnd=c.reveal, r=Math.max(4.5,W/100), ink=c.inks[c.home?0:1], dink=c.inks[c.home?1:0];
    const holder=[c.los-7,0.5], kicker=[c.los-9.5+Math.min(1,Math.max(0,(t-snap)/(kick-snap)))*2.3,0.47];
    let bx,by,z=0;
    if(t<snap){ const s=t/snap; bx=c.los; by=0.5 } else if(t<kick){ bx=holder[0]; by=holder[1] }
    else { const s=Math.min(1.05,(t-kick)/(tEnd-kick)), sy=c.startY!=null?c.startY:0.5, ey=c.endY!=null?c.endY:(c.kind==="fg"?0.5+c.wide*0.012:0.5+c.wide*0.075);
      // a hook: the line it starts on, bending late to where it ends
      bx=hlLerp(holder[0],111,s); const k=Math.min(1,s), path=c.hook?hlLerp(hlLerp(0.5,sy,Math.min(1,k*1.6)),ey,Math.pow(k,2.4)):hlLerp(0.5,ey,k); by=path; z=Math.max(0,Math.sin(Math.min(1,s)*Math.PI*0.95))*0.06 }   // low again by the posts, so where it crosses reads plainly
    if(t>=snap&&t<kick){ const s=(t-snap)/(kick-snap); if(s<0.4){ bx=hlLerp(c.los,holder[0],s/0.4) } }
    const line=[0.38,0.42,0.46,0.5,0.54,0.58,0.62,0.34,0.66];
    const st=c.st||{k:null,h:null,line:[]};
    line.forEach((y,i)=>{ const [px,py]=P(W,H,c,c.los-1.2,y); hlDot(x,px,py,r,ink,"rgba(0,0,0,.6)","",st.line[i]!=null?{num:st.line[i]}:null) });
    [[holder,st.h,"H"],[kicker,st.k,"K"]].forEach(([p,n,lab])=>{ const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,ink,"rgba(0,0,0,.6)",lab,n!=null?{num:n}:null) });
    line.concat([0.3,0.7]).forEach((y,i)=>{ const rush=t>snap?Math.min(1,(t-snap)/0.25)*2.5:0; const [px,py]=P(W,H,c,c.los+1.8-rush*0.6,y+(y-0.5)*-0.1*rush/2.5); hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)","",c.defN?{num:c.defN[i%c.defN.length]}:null) });
    // the uprights, drawn over everything so the ball is plainly inside them or not
    { const a=P(W,H,c,110,0.45), b=P(W,H,c,110,0.55), a0=P(W,H,c,96,0.45), b0=P(W,H,c,96,0.55); x.save();
      // the window between the uprights, marked back up the field so the ball's line through it (or not) is plain
      x.strokeStyle="rgba(242,210,75,.45)"; x.lineWidth=Math.max(1,W/520); x.setLineDash([4,4]); x.beginPath(); x.moveTo(a0[0],a0[1]); x.lineTo(a[0],a[1]); x.moveTo(b0[0],b0[1]); x.lineTo(b[0],b[1]); x.stroke(); x.setLineDash([]);
      x.strokeStyle="#F2D24B"; x.lineWidth=Math.max(3,W/180); x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke();
      [a,b].forEach(q=>{ x.beginPath(); x.arc(q[0],q[1],Math.max(3.5,W/150),0,Math.PI*2); x.fillStyle="#F2D24B"; x.fill() }); x.restore() }
    const [qx,qy]=P(W,H,c,bx,by); hlBall(x,qx,qy,r*0.55,z*W,null,{kind:"oval",fill:"#8A5428",ring:"#2a1406",rot:t>kick?(t*40)%6.3:0});
    // the view from behind the kicker as it reaches the posts: an H, and the ball going through it or past it
    if(t>kick+(tEnd-kick)*0.35){ const u=Math.min(1,(t-kick)/(tEnd-kick)), bw=Math.min(W*0.3,170), bh=bw*0.72, X0=P(W,H,c,110,0.5)[0]>W/2?W*0.035:W*0.965-bw, Y0=H*0.13;   // at the end away from the posts, clear of the line
      x.save(); x.globalAlpha=Math.min(1,(u-0.35)/0.15); x.fillStyle="rgba(10,16,24,.94)"; x.strokeStyle="rgba(255,255,255,.3)"; x.lineWidth=1;
      x.beginPath(); x.rect(X0,Y0,bw,bh); x.fill(); x.stroke();
      const cx=X0+bw/2, gy=Y0+bh*0.88, cb=Y0+bh*0.6, half=bw*0.17, sc=half/0.05;
      x.strokeStyle="#F2D24B"; x.lineWidth=3; x.beginPath(); x.moveTo(cx,gy); x.lineTo(cx,cb); x.moveTo(cx-half,cb); x.lineTo(cx+half,cb); x.moveTo(cx-half,cb); x.lineTo(cx-half,Y0+bh*0.08); x.moveTo(cx+half,cb); x.lineTo(cx+half,Y0+bh*0.08); x.stroke();
      const side=(by-0.5)*(c.home?-1:1), bxI=cx-side*sc, far=Math.pow(u,1.3), byI=hlLerp(gy+bh*0.05,cb-bh*(c.kind==="fg"?0.22:0.18),Math.min(1,u*1.15)), br=hlLerp(bw*0.07,bw*0.022,far);
      x.beginPath(); x.ellipse(Math.max(X0+br,Math.min(X0+bw-br,bxI)),byI,br,br*0.7,0,0,Math.PI*2); x.fillStyle="#8A5428"; x.fill(); x.strokeStyle="#2a1406"; x.lineWidth=1; x.stroke(); x.restore() }
    const top=`${c.ot?"Overtime":"Q"+c.q} \u00b7 ${c.kicker?c.kicker+", ":""}${c.dist}-yard field goal try`;
    const end=t>=tEnd?(c.kind==="fg"?"IT'S GOOD!":"NO GOOD! Wide "+(c.wide*(c.home?-1:1)>0?"left":"right")):null;
    hlCaption(x,W,H,top,end,c.kind==="fg"?ink:null); fbFeedEnd(c,end);
  }
  /* ---- round 99 (Ian: "they should look like I showed up to watch the match"): in Full match every drive is played on
     the field, snap by snap, from where it started to where it ended (the spot its outcome clip starts from, or where it
     stalled), with the down and distance on the caption and the chains moving. The engine plays a drive as one roll, so
     the plays inside it are drawn (from the drive's own number, no game dice) to add up to the real start and end; how
     the drive ended (a touchdown, a kick, a punt, a pick, a turnover on downs) still plays as its own clip after it. */
  /* ---- round 101 (Ian: "add a play-by-play engine if you think it would improve the game a lot"): the drive engine
     still decides every drive (where it starts, where it ends, how), and the plays inside it are built to come to
     exactly that: series of downs that move the chains (each one's last play crosses the line to gain, the ones before
     it don't), and for a drive that ends in a kick, a punt or a turnover on downs, a last series that fails on third
     down and leaves the fourth and N the engine had (the one a fourth-down call asked about), at the spot it had. A
     fourth down they went for and made is played where it was made (d.cv). Runs, catches, throws that fall
     incomplete, sacks and scrambles, each with the man who carried or caught it. All from the drive's own numbers,
     never the game's dice, and the box score credits the plays a drive the screen showed (namesOf, d.pn). */
  const RC=[2,3,4,5,1], RCW=[0.27,0.22,0.2,0.15,0.16];
  function wpick(r,w){ let x=r()*w.reduce((a,b)=>a+b,0), i=0; while(i<w.length-1&&x>=w[i]){ x-=w[i]; i++ } return i }
  function gRun(r){ const u=r(); return u<0.09?-1-Math.floor(r()*3):u<0.19?0:u<0.55?1+Math.floor(r()*3):u<0.83?4+Math.floor(r()*4):u<0.95?8+Math.floor(r()*7):15+Math.floor(r()*30) }
  function gCmp(r){ const u=r(); return u<0.08?-2+Math.floor(r()*3):u<0.35?2+Math.floor(r()*5):u<0.7?7+Math.floor(r()*7):u<0.92?14+Math.floor(r()*11):25+Math.floor(r()*35) }
  const PASS_P=(down,dist)=>down>=3&&dist>=5?0.85:down>=3?0.5:down===2&&dist>=8?0.62:0.52;
  function kindFor(r,down,dist){ if(r()>=PASS_P(down,dist))return "run"; const u=r(); return u<0.045?"sack":u<0.075?"scr":u<0.41?"inc":"pass" }
  function gainOf(r,t){ return t==="run"?gRun(r):t==="pass"?gCmp(r):t==="inc"?0:t==="sack"?-(3+Math.floor(r()*7)):1+Math.floor(r()*9) }
  // a play that must not move the chains (cum+g short of the line), and must not go back past his own goal line
  function freePlay(r,down,tg,cum,spot){ for(let k=0;k<8;k++){ const t=kindFor(r,down,tg-cum); let g=gainOf(r,t); if(spot+g<1)g=1-spot; if(cum+g<tg)return {t,g} }
    return {t:"inc",g:0} }
  // a play of exactly g yards: what kind it was follows from the yards
  function fitPlay(r,down,dist,g){ if(g===0)return {t:r()<0.75?"inc":"run",g}; if(g<0)return {t:g<-4||r()<0.4?"sack":"run",g};
    return r()<(g>=18?0.72:PASS_P(down,dist))?{t:r()<0.06?"scr":"pass",g}:{t:"run",g} }
  // n downs from a first down at spot (tg to go) coming to exactly T yards; conv: the last one moves the chains
  function series(r,spot,tg,n,T,conv){ let P=[];
    for(let tries=0;tries<12;tries++){ P=[]; let cum=0;
      for(let k=0;k<n-1;k++){ const p=freePlay(r,k+1,tg,cum,spot+cum); P.push(Object.assign(p,{down:k+1,togo:tg-cum,from:spot+cum})); cum+=p.g }
      const last=T-cum; if(last<-12&&tries<11)continue;
      P.push(Object.assign(fitPlay(r,n,tg-cum,last),{down:n,togo:tg-cum,from:spot+cum,fd:!!conv})); return P }
    return P }
  // series that move the chains, R yards from a first down at a (each 10 or more)
  /* a flag on the defense that moves the chains by itself (holding, illegal contact, a personal foul): the pros' holding
     is 5 yards and a first down, college's 10; 15 for a personal foul. One of these in a series of downs lets a drive
     reach a first down 5-9 yards on, as real ones do. */
  let PENS=[5,15];
  function penSeries(r,s,G){ const tg=Math.min(10,100-s), ps=PENS.filter(p=>G-p>=-3&&G-p<tg); if(!ps.length)return null; const p=ps[Math.floor(r()*ps.length)], c=G-p;
    const n=c===0?(r()<0.5?0:1):r()<0.6?1:2, P=n?series(r,s,tg,n,c,false):[]; const cum=P.reduce((t,q)=>t+q.g,0);
    P.push({t:"pen",g:p,down:Math.min(4,n+1),togo:tg-cum,from:s+cum,fd:true,flag:p===15?"Personal foul":r()<0.7?"Defensive holding":"Illegal contact"}); return P }
  function moving(r,a,R){ const out=[]; if(R<5)return out; if(R<10){ const P=penSeries(r,a,R); return P||out }
    const k=Math.max(1,Math.min(Math.floor(R/10),Math.round(R/(12+r()*6)))), E=R-10*k;
    const w=[...Array(k)].map(()=>-Math.log(1-r()*0.999)), sw=w.reduce((x,y)=>x+y,0), G=w.map(v=>10+Math.floor(E*v/sw)); G[k-1]+=R-G.reduce((x,y)=>x+y,0);
    let s=a; G.forEach(g=>{ const u=r(), n=g>=25?(u<0.45?1:u<0.85?2:3):(u<0.32?1:u<0.78?2:3), P=r()<0.025?penSeries(r,s,g):null; out.push(...(P||series(r,s,10,n,g,true))); s+=g }); return out }
  /* a stretch from a first down at a to b: series that move the chains, then the last one. fail: three downs short,
     leaving fourth and T4 (null: any; past the goal line: fourth and goal); else 0-2 downs before the play that ends it.
     Returns the plays and the fourth-down distance it left (fail). */
  function stretch(r,a,b,fail,T4){ const Y=b-a, C=[];
    for(let F=-12;F<=9;F++){ const R=Y-F; if(!(R===0||R>=10||R>=5&&PENS.some(p=>R-p>=-3&&R-p<Math.min(10,100-a))))continue; const fd=b-F; if(fd<1||fd>99)continue; const tg=Math.min(10,100-fd); if(F>=tg)continue;
      if(fail){ const left=tg-F; let ok=T4==null||(b+T4>=100?fd>=90:left===T4&&fd<=90); C.push({F,R,tg,left,ok,w:ok?(F>=0&&F<=6?3:F<0?0.6:1.5)*(F===Y?2:1):0}) }
      else C.push({F,R,tg,ok:true,w:F===0?3:F>0?1.5:0.4}) }
    if(!C.length)C.push({F:Y,R:0,tg:Math.min(10,100-a),left:Math.min(10,100-a)-Y,ok:false,w:1});
    let pool=C.filter(c=>c.ok); const forced=!pool.length;
    // the engine drew the fourth and N apart from how far the drive went: when no series of downs from this start can
    // leave it, the nearest one that can
    if(forced){ const dist=c=>T4==null?0:Math.abs((b+T4>=100?100-b:T4)-c.left), m=Math.min(...C.map(dist)); pool=C.filter(c=>dist(c)===m).map(c=>Object.assign({},c,{w:1})) }
    const c=pool[wpick(r,pool.map(c=>c.w))], plays=moving(r,a,c.R), fd=a+c.R;
    if(fail)plays.push(...series(r,fd,c.tg,3,c.F,false));
    else { const m=c.F===0?(r()<0.4?0:r()<0.6?1:2):(r()<0.55?1:2); if(m)plays.push(...series(r,fd,c.tg,m,c.F,false)) }
    return {plays,left:fail?c.left:null,forced} }
  function sideOf(r,pl,B){ if(pl.t==="pen")return pl; if(pl.t==="run"){ pl.rc=r()<(B.cfb?0.17:0.1)?0:1; if(pl.rc===1&&B.rb2&&r()<(B.cfb?0.33:0.25))pl.alt=1 } else if(pl.t==="sack"||pl.t==="scr")pl.rc=0; else pl.rc=RC[wpick(r,RCW)];
    if(pl.t==="sack")pl.by=r()<0.6?0:3; return pl }
  function playsFor(L,d,next,B){ if(d.start==null)return null; const nx=(next||[]).find(c=>c.kind!=="conv"), start=Math.max(1,Math.min(99,d.start)), k=d.kind;
    let end=nx&&nx.los!=null&&nx.kind!=="conv"?nx.los:k==="TD"?100:(d.stall!=null?d.stall:d.lost!=null?d.lost:start); end=Math.max(1,Math.min(99,end));
    const fail=k==="PUNT"||k==="FG"||k==="MISS"||k==="DOWNS", r=mulberry32(((d.n||1)*104729+start*131+(d.home?7:13))>>>0);
    let plays=[], left=null, forced=false, conv=false;
    const cv=d.cv&&d.cv[0]>=start&&d.cv[0]<=Math.max(start,end)+6&&d.cv[0]+d.cv[1]<100?d.cv:null;
    const A0=cv?stretch(r,start,cv[0],true,cv[1]):null;
    if(A0&&cv[0]+A0.left<100){ const A=A0, tg4=A.left, g4=Math.min(99-cv[0],Math.max(tg4,Math.min(90,cv[0]+Math.max(2,cv[1]))-cv[0])), bs=cv[0]+g4;
      const p4=Object.assign(fitPlay(r,4,tg4,g4),{down:4,togo:tg4,from:cv[0],fd:true,fourth:true}); if(p4.g<=0)p4.t="run";
      const Bz=stretch(r,bs,end,fail,fail?d.togo:null); plays=A.plays.concat([p4],Bz.plays); left=Bz.left; forced=A.forced||Bz.forced; conv=true }
    else { const A=stretch(r,start,end,fail,fail?d.togo:null); plays=A.plays; left=A.left; forced=A.forced }   // (a fourth down made inside the 10 the plays can't reach: drawn as a drive without it)
    plays.forEach(p=>sideOf(r,p,B));
    return {plays,start,end,left,forced,conv} }
  // what the box score credits: [kind, roster index, yards] (0 run, 1 catch, 2 incomplete, 3 sack, 4 scramble, 5 the
  // touchdown pass and 6 the touchdown run as the run of play names them, 7 a pick)
  function record(B,P,out){ const K={run:0,pass:1,inc:2,sack:3,scr:4}, rec=P.plays.filter(p=>p.t!=="pen").map(p=>[K[p.t],p.alt?B.rb2:(B.ori&&B.ori[p.rc]!=null?B.ori[p.rc]:-1),p.g]);
    out.forEach(c=>{ if(c.kind==="td")rec.push([c.pass?5:6,-1,c.len]); else if(c.kind==="int")rec.push([7,-1,0]); else if(c.kind==="fum"||c.kind==="downs")rec.push([0,B.ori?B.ori[1]:-1,c.len||0]) });
    return rec }
  // the lead-up a call showed of this drive (live only): its plays, where they ended and the fourth and N they left
  function leadFor(L,d){ const LS=typeof live!=="undefined"&&live&&L===live&&live.leadShown; return LS&&LS.n===d.n&&LS.start===d.start&&LS.home===!!d.home?LS:null }
  /* the drive after a call: what the lead-up showed, then from where it ended: nothing more for a kick, a punt or a
     turnover on downs; for a fourth down made, the play that made it (a flag on the defense when it was fourth and goal:
     a made fourth and goal the engine carries on with, short of the line) and the rest of the drive from there */
  function afterLead(L,d,next,LS){ const r=mulberry32(((d.n||1)*104729+(d.start||0)*131+(d.home?7:13)+977)>>>0), k=d.kind, fail=k==="PUNT"||k==="FG"||k==="MISS"||k==="DOWNS";
    const plays=LS.plays.slice(); let end=LS.end, left=LS.left, conv=false, forced=!!LS.forced;
    if(!LS.all&&d.cv){ const e0=LS.end, tg4=LS.left||d.cv[1], nx=(next||[]).find(c=>c.kind!=="conv"); let p4;
      if(e0+tg4<100){ const g4=Math.min(99-e0,Math.max(tg4,Math.min(90,e0+Math.max(2,d.cv[1]))-e0)); p4=Object.assign(fitPlay(r,4,tg4,g4),{down:4,togo:tg4,from:e0,fd:true,fourth:true}); if(p4.g<=0)p4.t="run" }
      else { const g=Math.max(1,Math.floor((100-e0)/2)); p4={t:"pen",g,down:4,togo:tg4,from:e0,fd:true,fourth:true,flag:"Defensive pass interference"} }
      const bs=e0+p4.g, b=nx&&nx.los!=null?nx.los:k==="TD"?100:(d.stall!=null?d.stall:d.lost!=null?d.lost:bs), e1=Math.max(1,Math.min(99,b));
      const Bz=stretch(r,bs,e1,fail,fail?d.togo:null); Bz.plays.forEach(p=>sideOf(r,p,LS.B)); plays.push(p4,...Bz.plays); left=Bz.left; forced=forced||Bz.forced; conv=true; end=e1 }
    return {plays,start:d.start,end,left,forced,conv} }
  function mkDrive(L,d,next){ const B=base(L,d), tm=B.tm, R=(SEA.roster&&SEA.roster[tm])||[]; B.cfb=typeof LEAGUE!=="undefined"&&LEAGUE.id==="cfb"; PENS=B.cfb?[10,15]:[5,15];
    // the second back: a carry in five or so (the starter's number swapped for his); not when he's already the starter
    // (never a hurt man: hlFit gives the starter back when the backup is out, and then there's no second back)
    const r2=typeof BK==="function"?hlFit(tm,BK(1)):null;
    if(r2!=null&&B.ori&&B.ori[1]!==r2&&R[r2]){ B.rb2=r2; B.rb2n=shirtNo(tm,r2); B.rb2nm=String(R[r2].n).split(" ").slice(-1)[0] }
    const LS=leadFor(L,d); let P;
    if(LS&&LS.plays){ LS.B=B; P=afterLead(L,d,next,LS) } else P=playsFor(L,d,next,B);
    if(!P)return null;
    const nx=(next||[]).find(c=>c.kind==="downs"); if(nx&&P.left!=null&&P.left!==nx.togo){ nx.togo=P.left; nx.len=Math.min(nx.len,P.left-1) }   // (the engine's own fourth and N is what it left, unless the data can't get there)
    const c=Object.assign(B,{kind:"drive",plays:P.plays,start:P.start,end:P.end,left:P.left,forced:P.forced,conv:P.conv,base:Math.min(16500,Math.max(1,P.plays.length)*1100),reveal:0.999});
    fbTimes(c);
    c.rec=record(B,P,next||[]); return c }
  const who=(c,pl)=>pl.alt?c.rb2nm||"#"+c.rb2n:c.onm&&c.onm[pl.rc]?c.onm[pl.rc]:(pl.rc===4?"tight end #":pl.rc===5?"slot receiver #":"#")+(c.offN?c.offN[pl.rc]:"");
  function playText(c,pl){ const g=pl.g, y=Math.abs(g)+" yard"+(Math.abs(g)===1?"":"s"), qb=c.onm&&c.onm[0]||"the quarterback";
    if(pl.t==="pen")return `${pl.flag} on ${c.opp}, ${y}, automatic first down`;
    let s=pl.t==="inc"?`Incomplete, intended for ${who(c,pl)}`:pl.t==="sack"?`${qb} sacked, loss of ${y}`:pl.t==="scr"?(g>0?`${qb} scrambles for ${y}`:`${qb} scrambles, no gain`)
      :pl.t==="pass"?(g>0?`${qb} to ${who(c,pl)}, ${y}`:g<0?`${qb} to ${who(c,pl)}, loss of ${y}`:`${qb} to ${who(c,pl)}, no gain`)
      :(g>0?`${who(c,pl)} runs for ${y}`:g<0?`${who(c,pl)} stopped for a loss of ${y}`:`${who(c,pl)}, no gain`);
    if(pl.fourth)s=`FOURTH DOWN, MADE! ${s}`; else if(pl.fd)s+=" · FIRST DOWN"; return s }
  /* round 111 (Ian: "Slow should be real time"): each snap on real seconds: the men set and the snap (FB_PRE; the 25 to
     40 seconds of a real huddle are the one thing not in real time), the play at real speed (a run about 2.5 s and a
     second for every 7 yards, a pass about 3 s to the throw and a second for every 9 yards after, the incompletion 3.5 s),
     then the whistle. The drive's clip runs the sum on the full match's pace (fullRT). */
  const FB_PRE=4, FB_POST=1.2;
  function fbPlayS(pl){ const g=Math.abs(pl.g||0); return pl.t==="pen"?2.4:pl.t==="run"?2.4+g/7:pl.t==="scr"?3.2+g/8:pl.t==="sack"?2.8:pl.t==="pass"?3+g/9:pl.t==="inc"?3.5:3 }
  function fbTimes(c){ let at=0; c.pT=c.plays.map(pl=>{ const a=fbPlayS(pl), w=FB_PRE+a+FB_POST, o={at,w,snap:FB_PRE/w,done:(FB_PRE+a)/w}; at+=w; return o }); c.rtS=Math.max(1,at); c.pTot=at }
  function driveFrame(x,W,H,c,t){
    if(!c.plays.length)return;
    let n=c.plays.length, f=Math.min(0.9999,t)*n, i=Math.floor(f), u=f-i;
    if(c.pT){ const T=Math.min(0.9999,t)*c.pTot; i=c.pT.findIndex(q=>T<q.at+q.w); if(i<0)i=n-1; u=Math.max(0,Math.min(1,(T-c.pT[i].at)/c.pT[i].w)); f=i+u }
    const pl=c.plays[i], r=Math.max(4.5,W/100), ink=c.inks[c.home?0:1], dink=c.inks[c.home?1:0];
    const snap=c.pT?c.pT[i].snap:0.18, done=c.pT?c.pT[i].done:0.84, s=Math.max(0,Math.min(1,(u-snap)/(done-snap))), e=hlEase(s), los=pl.from, gain=pl.g, tgt=los+gain, j=pl.rc==null?1:pl.rc, th=0.4;
    { const a=P(W,H,c,los,0.02), b=P(W,H,c,los,0.98), g1=P(W,H,c,Math.min(100,los+pl.togo),0.02), g2=P(W,H,c,Math.min(100,los+pl.togo),0.98); x.save(); x.lineWidth=Math.max(2,W/260);
      x.strokeStyle="rgba(80,150,255,.85)"; x.beginPath(); x.moveTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.stroke(); if(los+pl.togo<100){ x.strokeStyle="rgba(242,210,75,.9)"; x.beginPath(); x.moveTo(g1[0],g1[1]); x.lineTo(g2[0],g2[1]); x.stroke() } x.restore() }
    if(pl.t==="pen"){   // the snap, a whistle, a yellow flag at the line; the ball moves on and the chains with it
      const m=Math.min(1,s*3)*(1-Math.max(0,(s-0.5)*2)), bxp=los+(u>=done?gain:0);
      const dP=DEF.map((p,k)=>[bxp+p[0]+m*(k<4?-0.6:0.8),p[1]]), oP=OFF.map((p,k)=>[bxp+p[0]+m*(k>=6?0.6:k>=2?1.5:0),p[1]]);
      // round 108: a flag's men walk to their places too (the cap below), and leave the next play where they stood
      if(typeof ENGINE_V==="undefined"||ENGINE_V>=22){ const Q=driveFrame.st, dt=Q&&Q.c===c&&t>=Q.t?(c.pT?(t-Q.t)*c.pTot*FB_VRUN/FB_VMAX:(t-Q.t)*n):-1;
        if(dt>=0&&dt<0.25){ const lim=FB_VMAX*dt, cap=(o,q)=>{ const dx=q[0]-o[0], dy=(q[1]-o[1])*53.3, mm=Math.hypot(dx,dy); return mm>lim&&mm>0?[o[0]+dx*lim/mm,o[1]+dy*lim/mm/53.3]:q }; dP.forEach((q,k)=>dP[k]=cap(Q.def[k],q)); oP.forEach((q,k)=>oP[k]=cap(Q.off[k],q)) }
        driveFrame.st={c,t,off:oP.map(q=>q.slice()),def:dP.map(q=>q.slice())}; driveFrame.pos={off:oP,def:dP,nCl:0,lagM:0,n} }
      dP.forEach((p,k)=>{ const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)","",c.defN?{num:c.defN[k]}:null) });
      oP.forEach((p,k)=>{ const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,ink,"rgba(0,0,0,.6)","",c.offN?{num:c.offN[k]}:null) });
      const [qx,qy]=P(W,H,c,bxp,0.5); hlBall(x,qx,qy,r*0.55,0,null,{kind:"oval",fill:"#8A5428",ring:"#2a1406"});
      if(u>=snap+0.08){ const k=Math.min(1,(u-snap-0.08)/0.25), [fx,fy]=P(W,H,c,los+1.5,hlLerp(0.15,0.42,k)); x.save(); x.fillStyle="#F2D24B"; x.strokeStyle="rgba(0,0,0,.5)"; x.lineWidth=1;
        const sz=Math.max(5,W/90); x.translate(fx,fy-Math.sin(k*Math.PI)*H*0.08); x.rotate(k*6); x.fillRect(-sz/2,-sz/2,sz,sz); x.strokeRect(-sz/2,-sz/2,sz,sz); x.restore() }
      const ord=["","1st","2nd","3rd","4th"][pl.down], spotTxt=los<50?"own "+Math.round(los):los===50?"midfield":"their "+Math.round(100-los), togo=los+pl.togo>=100?"goal":pl.togo;
      hlCaption(x,W,H,`${c.ot?"OT":"Q"+c.q} \u00b7 ${c.tm} \u00b7 ${ord} & ${togo} at ${spotTxt}`,u>=done?playText(c,pl):u>=snap+0.08?"FLAG ON THE PLAY":null,null); fbFeed(c,i,u>=done); return }
    const st=OFF[j]||OFF[1], lane=0.5+((i*37)%5-2)*0.09, qbAt=[los-5-Math.min(1,s/th)*2,0.5];
    const deep=pl.t==="inc"?Math.min(99-los,8+((i*7)%11)):0;
    let carrier=null, bx=los, by=0.5, z=0;
    if(pl.t==="run")carrier=[hlLerp(los+st[0],tgt,e),hlLerp(st[1],lane,Math.min(1,e*1.5))];
    else if(pl.t==="scr")carrier=s<th?qbAt:[hlLerp(qbAt[0],tgt,hlEase((s-th)/(1-th))),hlLerp(0.5,lane,hlEase((s-th)/(1-th)))];
    else if(pl.t==="sack")carrier=[hlLerp(los-5,Math.min(los-1,tgt),Math.min(1,s/0.7)),0.5];
    else if(pl.t==="pass")carrier=[hlLerp(los+st[0],tgt,e),hlLerp(st[1],lane,Math.min(1,e*1.3))];
    else carrier=[hlLerp(los+st[0],los+deep,e),hlLerp(st[1],st[1]<0.5?0.22:0.78,Math.min(1,e*1.2))];
    if(u<snap){ bx=los; by=0.5 }
    else if(pl.t==="pass"||pl.t==="inc"){ if(s<th){ bx=qbAt[0]; by=0.5 } else { const k=Math.min(1,(s-th)/(0.78-th)); const aim=pl.t==="inc"?[los+deep+1.5,carrier[1]+(carrier[1]<0.5?-0.03:0.03)]:carrier;
        bx=hlLerp(qbAt[0],aim[0],k); by=hlLerp(0.5,aim[1],k); z=k<1?Math.sin(k*Math.PI)*0.05:0; if(pl.t==="inc"&&k>=1){ bx=aim[0]+Math.min(1.5,(s-0.78)*8); by=aim[1] } } }
    else { bx=carrier[0]; by=carrier[1] }
    const off=OFF.map((p,k)=>{ let yd=los+p[0], y=p[1]; if(u>=snap){ if(k===j)return carrier; if(k===0&&(pl.t==="pass"||pl.t==="inc"))return qbAt; if(k>=6)yd+=s*1.2; else if(k>=1)yd+=s*Math.min(8,Math.max(2,gain)*0.6) } return [yd,y] });
    const def=DEF.map((p,k)=>{ let yd=los+p[0], y=p[1]; if(u>=snap){ const w=k<4?0.2:0.5*s; yd=hlLerp(yd,bx,w*0.7); y=hlLerp(y,by,w) } return [yd,y] });
    if(pl.t==="sack"){ const k=pl.by||0, w=Math.min(1,s/0.7); def[k]=[hlLerp(los+DEF[k][0],carrier[0]+0.6,w),hlLerp(DEF[k][1],0.5+0.02,w)] }
    else if(pl.t==="inc"&&u>=snap){ const k=carrier[1]<0.5?7:8; def[k]=[carrier[0]+0.9,carrier[1]+(carrier[1]<0.5?0.03:-0.03)] }   // the man on him, there when it arrives
    else if(u>=done){ const k=pl.t==="pass"?(carrier[1]<0.5?7:8):5; def[k]=[carrier[0]+0.6,carrier[1]+0.02] }   // and he's brought down
    // round 108 (engine 22): between snaps the men walk back to the line and set (they were at the next snap in a frame:
    // the carrier forty yards downfield one frame, in the backfield the next); in a play nobody outruns his legs. The cap
    // is in yards a play of the drive's own clock, so every speed keeps up; seeking starts afresh.
    if(typeof ENGINE_V==="undefined"||ENGINE_V>=22){ const Q=driveFrame.st, dt=Q&&Q.c===c&&t>=Q.t?(c.pT?(t-Q.t)*c.pTot*FB_VRUN/FB_VMAX:(t-Q.t)*n):-1; let nCl=0, lagM=0;
      if(dt>=0&&dt<0.25){ const lim=FB_VMAX*dt, cap=(o,q)=>{ const dx=q[0]-o[0], dy=(q[1]-o[1])*53.3, m=Math.hypot(dx,dy); if(m>lim&&m>0){ nCl++; lagM+=m-lim; return [o[0]+dx*lim/m,o[1]+dy*lim/m/53.3] } return q };
        off.forEach((p,k)=>{ off[k]=cap(Q.off[k],p) }); def.forEach((p,k)=>{ def[k]=cap(Q.def[k],p) });
        if(u>=snap&&(pl.t==="run"||pl.t==="scr"||pl.t==="sack"||(pl.t==="pass"&&s>=0.78))&&off[j]){ bx=off[j][0]; by=off[j][1] } }   // the ball stays in his hands
      driveFrame.st={c,t,off:off.map(p=>p.slice()),def:def.map(p=>p.slice())}; driveFrame.pos={off,def,nCl,lagM,n} }
    def.forEach((p,k)=>{ const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)","",c.defN?{num:c.defN[k]}:null) });
    off.forEach((p,k)=>{ const [px,py]=P(W,H,c,p[0],p[1]); const num=k===j&&pl.alt?c.rb2n:c.offN?c.offN[k]:null; hlDot(x,px,py,r,ink,"rgba(0,0,0,.6)","",num!=null?{num}:null) });
    const [qx,qy]=P(W,H,c,bx,by); hlBall(x,qx,qy,r*0.55,z*W,null,{kind:"oval",fill:"#8A5428",ring:"#2a1406"});
    const ord=["","1st","2nd","3rd","4th"][pl.down], spotTxt=los<50?"own "+Math.round(los):los===50?"midfield":"their "+Math.round(100-los), togo=los+pl.togo>=100?"goal":pl.togo;
    hlCaption(x,W,H,`${c.ot?"OT":"Q"+c.q} · ${c.tm} · ${ord} & ${togo} at ${spotTxt}`,u>=done?playText(c,pl):null,null); fbFeed(c,i,u>=done) }
  // round 111 (Ian: a play by play in every sport, synced): each snap once it's over, by name; a kick or the drive's end once shown
  function fbFeedEnd(c,end){ if(!end||typeof hlFeedTick!=="function")return; hlFeedTick(()=>[{k:"fe|"+c.tm+"|"+c.q+"|"+c.kind+"|"+c.los,m:c.ot?"OT":"Q"+c.q,team:c.tm,text:end,big:c.kind==="td"||c.kind==="fg"?"score":null}]) }
  function fbFeed(c,i,dn){ if(typeof hlFeedTick!=="function")return; hlFeedTick(()=>c.plays.slice(0,dn?i+1:i).map((pl,j)=>({k:"f|"+c.tm+"|"+c.q+"|"+c.start+"|"+j+"|"+c.plays.length,m:c.ot?"OT":"Q"+c.q,team:c.tm,text:playText(c,pl),big:pl.g>=20?"big":null}))) }
  const FB_VMAX=200, FB_VRUN=11;   // yards a play of the drive's clock at most (round 108); round 111: yards a game second (real time)
  function frame(x,W,H,c,t){
    endZones(x,W,H,c);
    if(c.kind==="drive")return driveFrame(x,W,H,c,t);
    if(c.kind==="fg"||c.kind==="miss")return kickFrame(x,W,H,c,t);
    if(c.kind==="punt")return puntFrame(x,W,H,c,t);
    const sf=(c.f||0.86)/0.86, snap=0.18*sf, throwT=0.5*sf, tEnd=0.86*sf;   // (round 80: a pick with a return catches earlier)
    // the ball: snapped, then a drop and a throw, or a handoff and a run
    let bx,by,z=0;
    const qb=[c.los-5-(t>snap?Math.min(1,(t-snap)/(throwT-snap))*2:0),0.5];
    const carrierAt=s=>{ if(c.pass){ return [hlLerp(c.los-0.5,c.catchY,hlEase(s)),hlLerp(c.rcv===2?0.08:0.92,c.lane,hlEase(Math.min(1,s*1.4)))] }
      return [hlLerp(c.los-7,c.catchY,hlEase(s)),hlLerp(0.5,c.lane,hlEase(Math.min(1,s*2)))] };
    const runS=Math.max(0,Math.min(1,(t-snap)/(tEnd-snap)));
    if(t<snap){ bx=c.los; by=0.5 }
    else if(c.pass){ if(t<throwT){ bx=qb[0]; by=0.5 } else { const s=Math.min(1,(t-throwT)/(tEnd-throwT-0.08)); const tg=carrierAt(Math.min(1,runS+0.05)); bx=hlLerp(qb[0],tg[0],s); by=hlLerp(0.5,tg[1],s); z=Math.sin(Math.min(1,s)*Math.PI)*0.05 } }
    else{ const p=carrierAt(runS); bx=p[0]; by=p[1] }
    const off=OFF.map((p,i)=>{ let yd=c.los+p[0], y=p[1];
      if(t>snap){ if(i===0)return c.qbRun?carrierAt(runS):qb; if(c.pass&&i===c.rcv){ const q=carrierAt(runS); return q }
        if(!c.pass&&i===1){ return c.qbRun?[c.los-6,0.5+0.1]:carrierAt(runS) }
        if(c.kind==="fum"&&i===1&&t>c.reveal-0.12){ return carrierAt(Math.min(1,(c.reveal-0.12-snap)/(tEnd-snap))) }
        if(i>=6){ yd+=runS*1.5 } else if(i>=2){ yd+=runS*Math.min(18,c.len*0.7); y=hlLerp(y,0.5,runS*0.2) } }
      return [yd,y] });
    const def=DEF.map((p,i)=>{ let yd=c.los+p[0], y=p[1]; if(t>snap){ const k=i<4?0.15:0.45*runS; yd=hlLerp(yd,bx,k*0.6); y=hlLerp(y,by,k) } return [yd,y] });
    // round 80: pursuit (Ian: nobody chased a breakaway): once the ball is in the runner's hands the back seven take
    // angles on him and end a few yards behind, the deep men closest
    if((c.kind==="td"||c.kind==="conv")&&t>(c.pass?throwT:snap)){ const q=carrierAt(runS), w=hlEase(Math.min(1,(t-(c.pass?throwT:snap))/(tEnd-(c.pass?throwT:snap))))*0.9;
      for(let i=4;i<11;i++){ const gap=(i>=9?1.0:i>=7?1.7:2.5)+(i%3)*0.5+(c.len>25?0.8:0); def[i]=[hlLerp(def[i][0],q[0]-gap,w),hlLerp(def[i][1],q[1]+(i%2?0.06:-0.06)*(1-w*0.5),w)] } }
    // a contested ball: the corner on the receiver's hip the whole way (round 70: Ian, too many blown coverages)
    if(c.pass&&c.tight&&t>snap&&c.kind!=="int"){ const j=c.rcv===2?7:8, q=carrierAt(runS), lag=0.9+0.6*Math.sin(runS*5); def[j]=[q[0]-lag,q[1]+(c.rcv===2?0.035:-0.035)] }
    // a fumble: the carrier is hit, the ball comes loose, a defender falls on it
    if(c.kind==="fum"&&t>c.reveal-0.12){ const hit=carrierAt(Math.min(1,(c.reveal-0.12-snap)/(tEnd-snap))), u=Math.min(1,(t-c.reveal+0.12)/0.3), j=c.rcv===2?5:6;
      bx=hit[0]+hlEase(u)*4.5; by=hit[1]+hlEase(u)*(hit[1]<0.5?0.07:-0.07)+Math.sin(u*9)*0.012; z=Math.abs(Math.sin(u*Math.PI*3))*0.012*(1-u); def[j]=[hlLerp(def[j][0],bx,Math.min(1,u*1.4)),hlLerp(def[j][1],by,Math.min(1,u*1.4))] }
    // a pick: the nearest defensive back jumps the route and takes it the other way
    if(c.kind==="int"&&t>throwT){ const tg=carrierAt(Math.min(1,runS+0.05)), j=c.rcv===2?7:8, s=Math.min(1,(t-throwT)/(tEnd-throwT));
      def[j]=[hlLerp(def[j][0],tg[0]+0.8,hlEase(s)),hlLerp(def[j][1],tg[1],hlEase(s))];
      if(t>tEnd){ const u=(t-tEnd)/(1-tEnd), run=c.ret!=null?c.ret:12, cy=tg[0]+0.8-hlEase(u)*run, cyl=hlLerp(tg[1],0.5,hlEase(u)*0.5); def[j]=[cy,cyl]; bx=cy; by=cyl; z=0;
        // round 80: the passing side gives chase, his own men run with him
        if(c.ret!=null){ off.forEach((p,i)=>{ const k=u*(i<2||i>=6?0.35:0.6); off[i]=[hlLerp(p[0],cy+2+(i%4)*1.2,k),hlLerp(p[1],cyl+((i%3)-1)*0.09,k)] });
          def.forEach((p,i)=>{ if(i!==j){ const k=u*0.3; def[i]=[hlLerp(p[0],cy-2-(i%3)*1.5,k),hlLerp(p[1],cyl+((i%2)?0.14:-0.14),k)] } })
          /* round 99 (Ian: "not clear that a player gets tackled"): a man from the passing side cuts across, meets him where he
             is downed and brings him down: the quarterback on a long return (he is the last man back), the intended receiver
             on a short one. Not on a return to the end zone. */
          if(c.retEnd>0&&c.retEnd<100){ const ti=run>12?0:c.rcv, endY=tg[0]+0.8-run, meet=0.82, from=off[ti], v=Math.min(1,u/meet);
            off[ti]=u<meet?[hlLerp(from[0],endY-0.9,hlEase(v)),hlLerp(from[1],cyl,hlEase(v))]:[cy-0.55,cyl+0.01];
            c._tk=u>=meet?ti:-1 } } } }
    const r=Math.max(4.5,W/100), ink=c.inks[c.home?0:1], dink=c.inks[c.home?1:0];
    const tag=i=>c.kind==="int"&&t>tEnd&&c._tk===i?"TACKLE":!(c.kind==="int"&&t>tEnd)&&t>snap&&((c.pass&&i===c.rcv)||(!c.pass&&i===1)||(c.pass&&i===0&&t<throwT))?["QB","RB","WR","WR"][i]:"";
    const dtag=i=>c.kind==="int"&&t>tEnd&&i===(c.rcv===2?7:8)?"INT":"";   // round 80: the man running it back
    def.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,dink,"rgba(0,0,0,.6)",dtag(i),c.defN?{num:c.defN[i]}:null) });
    off.forEach((p,i)=>{ const [px,py]=P(W,H,c,p[0],p[1]); hlDot(x,px,py,r,ink,"rgba(0,0,0,.6)",tag(i),c.offN?{num:c.offN[i]}:null) });
    const [qx,qy]=P(W,H,c,bx,by); hlBall(x,qx,qy,r*0.55,z*W,null,{kind:"oval",fill:"#8A5428",ring:"#2a1406"});
    const top=`${c.ot?"Overtime":"Q"+c.q} \u00b7 ${c.tm} ball`;   // round 67: no "12 yards out" before it's done
    const te=c.kind==="fum"?c.reveal:tEnd;
    const end=t>=te&&c.kind==="conv"?`FIRST DOWN! ${c.len} yards on fourth and ${c.togo}`:t>=te&&c.kind==="int"&&c.ret!=null&&t>=0.97?`INTERCEPTED!${c.who?" "+c.who+",":""} ${c.ret?"returned "+c.ret+" yard"+(c.ret===1?"":"s"):"no return"}`:t>=te&&c.kind==="downs"?`STOPPED! ${c.len?c.len+" yard"+(c.len===1?"":"s")+",":"No gain,"} ${c.togo} needed`:t>=te?(c.kind==="int"?`INTERCEPTED!${c.who?" "+c.who:""}`:c.kind==="fum"?`FUMBLE!${c.who?" Recovered by "+c.who:""}`:`TOUCHDOWN! ${c.who?c.who+", ":""}${c.len}-yard ${c.pass?"pass":"run"}`):null;
    if(c.kind==="downs"||c.kind==="conv"){ const [mx,my]=P(W,H,c,Math.min(99.5,c.los+c.togo),0), [mx2,my2]=P(W,H,c,Math.min(99.5,c.los+c.togo),1); x.save(); x.strokeStyle="#F2D24B"; x.lineWidth=2; x.beginPath(); x.moveTo(mx,my); x.lineTo(mx2,my2); x.stroke(); x.restore() }   // the line to gain
    hlCaption(x,W,H,top,end,c.kind==="int"||c.kind==="fum"||c.kind==="downs"?dink:ink); fbFeedEnd(c,end);
  }
  /* round 101: the drive up to a call, before it's asked (core hlLeadUpStart): a fourth down's drive to the fourth down
     (the drive pushed after the answer starts from the same numbers, so its plays begin with these), or a touchdown's
     drive and the touchdown before the two-point call. The drive isn't in the record yet: it's drawn as it will be. */
  function leadUp(L,r){ const st=L&&L.eng, P=st&&st.pend, stg=st&&st.stage; if(!P||!r||!r.ask||(stg!=="fourth"&&stg!=="two")||P.start==null)return null;
    const two=stg==="two", d={home:r.side==="home",q:P.q,start:P.start,n:st.i+1,kind:two?"TD":P.res.kind,pts:two?6:0,h:st.h,a:st.a,stall:two?100:P.res.stall,togo:two?null:(P.res.togo||3),aggr:P.aggr};
    if(!two&&P.res.kind!=="PUNT"&&P.res.kind!=="DOWNS"&&P.res.kind!=="FG"&&P.res.kind!=="MISS")return null;
    const L2={g:L.g,drives:(L.drives||[]).concat([d]),restAt:L.restAt}, out=clips0(L2,d,"full"), dc=mkDrive(L2,d,out); if(!dc)return null;
    const n=L2.drives.length, ck=typeof fbClock==="function"&&ENGINE_V>=7&&d.q<5?" "+fbClock(d.q,Math.max(0,n-1),DRIVES_PER_TEAM*2):""; [dc].concat(out).forEach(c=>{ c.hd=d.q>=5?"OT":"Q"+d.q+ck+" \u00b7 drive "+n; c.scores=two });
    const clips=two?[dc].concat(out.filter(c=>c.kind==="td")):[dc];
    if(!dc.plays.length&&!two)return null;
    return {clips:clips.filter(c=>c.kind!=="drive"||c.plays.length),hold:two,key:{n:d.n,start:d.start,home:d.home,k:dc.plays.length,all:two,plays:dc.plays,end:dc.plays.reduce((t,p)=>t+p.g,dc.start),left:dc.left,forced:dc.forced}} }
  const headClock=c=>c&&c.hd||null;
  // round 107: the line under the field names the drive on the field (it named the last drive drawn: a drive behind, Muse)
  // the header's clock and drive set in place while the drive plays (a render would show the drive chart's result early)
  const headLive=(e,k)=>{ e.innerHTML='<span class="live"></span>'+esc(k)+(typeof fbVenueTag==="function"?fbVenueTag():"") };
  const footText=c=>c&&c.kind==="drive"&&c.start!=null&&c.tm?`${c.tm} ball \u00b7 started ${fbYd(c.start)}`:null;
  return {drivePos:()=>driveFrame.pos||null, replaces:".field", collapseIdle:true, ambient:true, fullMs:700, aspect:0.46,   // round 99: Full match offered (each drive played snap by snap); nothing drawn between drives
           clips, pitch, idle, frame, headClock, footText, headLive, goalsLabel:"Late touchdowns",
           namesOf:(L,d)=>d&&Array.isArray(d._pb)?d._pb:null, playText, leadUp, playsFor:(L,d)=>{ const out=clips0(L,d,"full"); const c=mkDrive(L,d,out); return c?{plays:c.plays,start:c.start,end:c.end,left:c.left,forced:c.forced,conv:c.conv,rec:c.rec,next:out.map(o=>({kind:o.kind,los:o.los,togo:o.togo,len:o.len}))}:null }};
})();
