/* football's full match as it moves (engine 22): every drive of a played game played snap by snap at 60 frames a second
   (a play is 1.1 s at Normal). Between snaps the men walk back to the line (they were set at the next snap in a frame),
   in a play nobody jumps, and the cap that does it holds a man back rarely.
     node test/fb-motion.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,team] of [['football-coach-pro.html','Kansas City'],['football-coach.html','Alabama']]){ const p=await b.newPage({viewport:{width:1000,height:700}}); await p.goto('file://'+path.join(DIST,f)); await p.waitForTimeout(300);
  const R=await p.evaluate((team)=>{ newDynasty(team,7,'T'); S.title=false; S.guide=false; S.highlights='off'; render(); for(let k=0;k<5&&!live;k++)doAdvance();
    let n=0; while(live&&!live.done&&n++<5000){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } liveTick() }
    const c=document.createElement('canvas'); c.width=1000; c.height=460; const x=c.getContext('2d'), out={big:0,steps:0,max:0,mf:0,cl:0,lag:0,drives:0};
    live.drives.forEach(d=>{ let C=null; try{ C=HL_SPORT.clips(live,d,'full') }catch(e){} const list=(C&&C.clips)||C||[]; (Array.isArray(list)?list:[]).filter(q=>q.kind==='drive'&&q.plays&&q.plays.length).forEach(q=>{ out.drives++;
      const nP=q.plays.length, steps=nP*66; let prev=null;
      for(let i=0;i<=steps;i++){ const t=i/steps; HL_SPORT.frame(x,1000,460,q,t); const P=HL_SPORT.drivePos(); if(!P){ prev=null; continue }
        out.mf+=22; out.cl+=P.nCl||0; out.lag+=P.lagM||0; const cur=P.off.concat(P.def);
        if(prev)cur.forEach((v,k)=>{ const o=prev[k], m=Math.hypot(v[0]-o[0],(v[1]-o[1])*53.3); out.steps++; if(m>out.max)out.max=m; if(m>4)out.big++ });
        prev=cur.map(v=>v.slice()) } }) });
    return out },team);
  const ok1=R.big===0&&R.drives>0, ok2=R.cl/R.mf<0.12&&R.lag/R.mf<1;
  console.log(`  ${ok1?'ok  ':'FAIL'} ${f}: ${R.drives} drives, steps over 4 yards a frame: ${R.big} of ${R.steps}, largest ${R.max.toFixed(1)} yards`);
  console.log(`  ${ok2?'ok  ':'FAIL'} ${f}: held back by the cap in ${(100*R.cl/R.mf).toFixed(1)}% of man-frames, on average ${(R.lag/R.mf).toFixed(2)} yards behind`);
  if(!ok1||!ok2)bad++; await p.close() }
 await b.close(); console.log(bad?'MISMATCH the field jumps':'MATCH the full match moves smoothly'); process.exit(bad?1:0) })();
