/* basketball's full match as it moves (engine 22): every stretch of a played game played back at 60 frames a second;
   each man's step between frames (court 28 by 15 m). No one jumps across the floor (a free throw's set, a new
   possession, a turnover put men there in one frame); the ball stays with the man who has it.
     node test/bb-motion.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,team] of [['basketball-coach-pro.html','Orlando'],['basketball-coach.html','Duke']]){
  const p=await b.newPage({viewport:{width:1000,height:700}}); await p.goto('file://'+path.join(DIST,f)); await p.waitForTimeout(300);
  const R=await p.evaluate(t=>{ newDynasty(t,5,'T'); S.title=false; S.guide=false; S.highlights='off'; render(); for(let k=0;k<5&&!live;k++)doAdvance();
    let n=0; while(live&&!live.done&&n++<5000){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } liveTick() }
    const c=document.createElement('canvas'); c.width=1000; c.height=540; const x=c.getContext('2d'), out={big:0,steps:0,max:0,held:0,loose:0};
    live.done=false; const D=live.drives.filter(d=>Array.isArray(d.pl)&&d.pl.length);
    D.forEach(d=>{ const ms=HL_SPORT.playback(live,d); live.pb={d,at:0,ms,frozen:0,h0:0,a0:0}; let prev=null;
      for(let el=0;el<ms;el+=16){ live.pb.frozen=el; HL_SPORT.idle(x,1000,540); const P=HL_SPORT.drawPos(); if(!P)continue;
        const cur={}; P.att.forEach((q,i)=>cur[P.sA+'|'+i]=q); P.def.forEach((q,i)=>cur[(1-P.sA)+'|'+i]=q);
        if(prev)Object.keys(cur).forEach(k=>{ const o=prev[k]; if(!o)return; const m=Math.hypot((cur[k][0]-o[0])*28,(cur[k][1]-o[1])*15); out.steps++; if(m>out.max)out.max=m; if(m>1.5)out.big++ });
        if(P.held&&P.holder>=0){ out.held++; const h=P.att[P.holder]; if(Math.hypot((h[0]-P.ball[0])*28,(h[1]-P.ball[1])*15)>1.2)out.loose++ }
        prev=cur } });
    live.done=true; live.pb=null; return out },team);
  const ok1=R.big/Math.max(1,R.steps)<0.0005, ok2=R.loose/Math.max(1,R.held)<0.02;
  console.log(`  ${ok1?'ok  ':'FAIL'} ${f}: steps over 1.5 m in a frame: ${R.big} of ${R.steps}, largest ${R.max.toFixed(1)} m`);
  console.log(`  ${ok2?'ok  ':'FAIL'} ${f}: the ball away from the man holding it: ${R.loose} of ${R.held} frames`);
  if(!ok1||!ok2)bad++; await p.close() }
 await b.close(); console.log(bad?'MISMATCH the court jumps':'MATCH the full match moves smoothly'); process.exit(bad?1:0) })();
