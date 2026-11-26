/* round 111: how the full match plays now. Per sport and speed: wall seconds per game minute; each man's speed in m/s
   (median, 95th, max) from 60 fps playback; stutters (a man moving over 1.5 m/s who stops, under 0.3 m/s, for at most
   12 frames, then moves again) per man-minute of playback. node r111-pace.js [sport] [speed] */
const {chromium}=require('playwright'), path=require('path');
const DIST=path.join(__dirname,'..','..','dist');
const SP={soccer:['soccer-coach.html','Southampton',105,68,'sc',5],hockey:['hockey-coach-pro.html','Boston',60,26,'hk',5],nba:['basketball-coach-pro.html','Orlando',28,15,'bb',null],ncaab:['basketball-coach.html','Duke',28,15,'bb',null]};
const only=process.argv[2], speeds=process.argv[3]?[process.argv[3]]:['slow','normal'];
(async()=>{ const b=await chromium.launch();
 for(const k of Object.keys(SP).filter(k=>!only||k===only)) for(const spd of speeds){ const [f,team,FW,FH,kind]=SP[k];
  const p=await b.newPage({viewport:{width:1000,height:700}}); await p.goto('file://'+path.join(DIST,f)); await p.waitForTimeout(300);
  const R=await p.evaluate(([t,spd,FW,FH,kind,OLD])=>{ newDynasty(t,5,'T'); S.watchSpeed=spd; if(OLD&&HL_SPORT.evPB)HL_SPORT.evPB.rt=false; S.title=false; S.guide=false; S.highlights='full'; render(); for(let k=0;k<5&&!live;k++)doAdvance();
    let n=0; while(live&&!live.done&&n++<5000){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } liveTick() }
    const c=document.createElement('canvas'); c.width=1000; c.height=600; const x=c.getContext('2d'); live.done=false;
    const sp=[], st={stut:0,manMin:0,fast:0}, msTot=[]; let gameMin=0, wall=0;
    const ev=kind==='sc'||kind==='hk'; const D=live.drives.filter(d=>ev?(typeof d.seg==='number'&&!d.ot):Array.isArray(d.pl)&&d.pl.length).slice(0,ev?6:8);
    D.forEach(d=>{ let tot, span;
      if(ev){ const P=hlEvPlan(live,d); tot=P.seg.reduce((m,q)=>Math.max(m,q.at+q.ms),0); span=5; live.pb={d,at:0,ms:tot,frozen:0,h0:d.sh-d.h,a0:d.sa-d.a} }
      else { tot=HL_SPORT.playback(live,d); span=HL_SPORT.pbSpan?HL_SPORT.pbSpan(d):(HL_SPORT.evPB&&HL_SPORT.evPB.span)?HL_SPORT.evPB.span(d):null; live.pb={d,at:0,ms:tot,frozen:0,h0:0,a0:0} }
      wall+=tot; if(span)gameMin+=span; msTot.push(tot);
      let prev=null; const hist={};
      for(let el=0;el<tot;el+=16){ live.pb.frozen=el; let pts={};
        if(ev){ hlEvDraw(x,1000,600); const P=kind==='sc'?HL_SPORT.spDrawPos():HL_SPORT.drawPos(); if(!P)continue; P[0].forEach((v,j)=>pts['0|'+j]=v); P[1].forEach((v,j)=>pts['1|'+j]=v) }
        else { HL_SPORT.idle(x,1000,600); const P=HL_SPORT.drawPos(); if(!P)continue; P.att.forEach((q,i)=>pts[P.sA+'|'+i]=q); P.def.forEach((q,i)=>pts[(1-P.sA)+'|'+i]=q) }
        if(prev)Object.keys(pts).forEach(k=>{ const o=prev[k], v=pts[k]; if(!o||!v)return; const m=Math.hypot((v[0]-o[0])*FW,(v[1]-o[1])*FH)*60/ (1); sp.push(m); if(m>12)st.fast++;
          const h=hist[k]=hist[k]||{state:'still',stop:0}; if(m>1.5){ if(h.state==='stopped'&&h.stop<=12)st.stut++; h.state='moving'; h.stop=0 } else if(m<0.3){ if(h.state==='moving'){h.state='stopped';h.stop=1} else if(h.state==='stopped')h.stop++ } });
        st.manMin+=Object.keys(pts).length/3600; prev=pts } });
    const z=sp.filter(v=>v<0.05).length/Math.max(1,sp.length); sp.sort((a,b)=>a-b); const q=r=>sp.length?sp[Math.floor(r*(sp.length-1))]:0;
    live.done=true; live.pb=null; return {wallPerStretch:(wall/D.length/1000).toFixed(1), gameMin, wall, med:q(0.5).toFixed(1), p95:q(0.95).toFixed(1), max:q(1).toFixed(1), stutPerManMin:(st.stut/Math.max(0.01,st.manMin)).toFixed(2), fastPerManMin:(st.fast/Math.max(0.01,st.manMin)).toFixed(2), n:D.length, z:z.toFixed(2) } },[team,spd,FW,FH,kind,!!process.env.OLD]);
  const ratio=R.gameMin?` | ${(R.wall/1000/R.gameMin).toFixed(0)} wall s per game minute (real time 60)`:'';
  console.log(`${k} ${spd}: ${R.n} stretches, ${R.wallPerStretch} s each${ratio} | man speed m/s (on screen): median ${R.med}, 95th ${R.p95}, max ${R.max} | stutters ${R.stutPerManMin} per man-minute | over 12 m/s ${R.fastPerManMin} frames a man-minute | still ${R.z}`);
  await p.close() }
 await b.close() })();
