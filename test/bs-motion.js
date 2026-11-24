/* baseball's full match as it moves (engine 22): every inning of a played game played back at 60 frames a second, at
   Normal and Very fast. No fielder or runner jumps (a fielder who ran the ball down was back in his place in a frame),
   the cap that stops it holds a man back rarely and not far, and the line under the field never disagrees with the
   bug's outs once a play is done.   node test/bs-motion.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const spd of ['normal','rapid']){ const p=await b.newPage({viewport:{width:1000,height:700}}); await p.goto('file://'+path.join(DIST,'baseball-coach-pro.html')); await p.waitForTimeout(300);
  const R=await p.evaluate((spd)=>{ newDynasty('Seattle',5,'T'); S.title=false; S.guide=false; S.highlights='off'; S.watchSpeed=spd; render(); for(let k=0;k<5&&!live;k++)doAdvance();
    let n=0; while(live&&!live.done&&n++<5000){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } liveTick() }
    const c=document.createElement('canvas'); c.width=1000; c.height=620; const x=c.getContext('2d'), out={big:0,steps:0,max:0,mf:0,cl:0,lag:0};
    live.done=false; live.hold=null; const D=live.drives.filter(d=>Array.isArray(d.pl)&&d.pl.length);
    D.forEach(d=>{ const ms=HL_SPORT.playback(live,d); live.pb={d,at:0,ms,frozen:0,h0:0,a0:0}; let prev=null;
      for(let el=0;el<ms;el+=16){ live.pb.frozen=el; HL_SPORT.idle(x,1000,620); const P=HL_SPORT.drawPos(); if(!P)continue;
        const cur={}; P.f.forEach((q,i)=>cur['f'+i]=q); P.r.forEach(R=>cur['r'+R.nm]=R.p); out.mf+=Object.keys(cur).length; out.cl+=P.nCl||0; out.lag+=P.lagM||0;
        if(prev)Object.keys(cur).forEach(k=>{ const o=prev[k]; if(!o)return; const m=Math.hypot(cur[k][0]-o[0],(cur[k][1]-o[1])*P.H/P.W); out.steps++; if(m>out.max)out.max=m; if(m>1.45*P.upf*16)out.big++ });
        prev=cur } });
    live.done=true; live.pb=null; return out },spd);
  const ok1=R.big===0, ok2=R.cl/R.mf<0.1&&R.lag/R.mf<0.01;
  console.log(`  ${ok1?'ok  ':'FAIL'} ${spd}: steps past the cap: ${R.big} of ${R.steps}, largest ${(100*R.max).toFixed(1)}% of the field's width a frame`);
  console.log(`  ${ok2?'ok  ':'FAIL'} ${spd}: held back by the cap in ${(100*R.cl/R.mf).toFixed(1)}% of man-frames, on average ${(100*R.lag/R.mf).toFixed(2)}% of the width behind`);
  if(!ok1||!ok2)bad++; await p.close() }
 await b.close(); console.log(bad?'MISMATCH the field jumps':'MATCH the full match moves smoothly'); process.exit(bad?1:0) })();
