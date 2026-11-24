/* hockey's full match (engine 22): a shot's move grows out of the play before it. Played back frame by frame (a 60th of
   a second), at the first frame of each clip every man stands within a few metres of where the touch-by-touch play last
   drew him (by his place in the six), none jumps more than 5 m a frame through the clip's opening, and the play after
   it starts where the clip left them.
     node test/sc-clipjoin.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1000,height:700}});
  await p.goto('file://'+path.join(DIST,'hockey-coach-pro.html')); await p.waitForTimeout(300);
  const R=await p.evaluate(()=>{ newDynasty('Florida',7,'T'); S.title=false; S.guide=false; S.highlights='full'; render(); for(let k=0;k<3&&!live;k++)doAdvance();
    let n=0; while(live&&!live.done&&n++<5000){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } liveTick() }
    const c=document.createElement('canvas'); c.width=1000; c.height=620; const x=c.getContext('2d'); live.done=false; const out={joins:0,far:0,max:0,open:0,big:0,backs:0,bfar:0,bmax:0};
    const home=(q,h)=>h?[1-q[0],1-q[1]]:q;
    live.drives.filter(d=>typeof d.seg==='number'&&d.seg<SEGS).forEach(d=>{ const P=hlEvPlan(live,d); const tot=P.seg.reduce((m,q)=>Math.max(m,q.at+q.ms),0);
      live.pb={d,at:0,ms:tot,frozen:0,h0:d.sh-d.h,a0:d.sa-d.a}; let last=null, inClip=null, prevC=null, cf=0;
      for(let el=0;el<tot;el+=16){ live.pb.frozen=el; hlEvDraw(x,1000,620); const i=P.seg.findIndex(q=>el<q.at+q.ms+(q.k==="clip"?250:0)), q=P.seg[i<0?P.seg.length-1:i];
        if(q.k!=='clip'){ const pos=HL_SPORT.drawPos(); if(!pos)continue; last={pos,nums:[[0,1,2,3,4,5],[0,1,2,3,4,5]]};
          if(inClip&&prevC){ out.backs++; [0,1].forEach(s=>pos[s].forEach((v,j)=>{ const w=prevC[s+'|'+last.nums[s][j]]; if(!w)return; const m=Math.hypot((w[0]-v[0])*60,(w[1]-v[1])*26); if(m>out.bmax)out.bmax=m; if(m>8)out.bfar++ })) }
          inClip=null; continue }
        const F=HL_SPORT.frameDbg(); if(!F)continue; const sA=F.home?0:1;
        const cur={}; F.att.forEach((v,j)=>{ if(v)cur[sA+'|'+j]=home(v,F.home) }); F.def.forEach((v,j)=>{ if(v)cur[(1-sA)+'|'+j]=home(v,F.home) });
        if(inClip!==q){ inClip=q; cf=0; if(last){ out.joins++; [0,1].forEach(s=>last.pos[s].forEach((v,j)=>{ const k=s+'|'+last.nums[s][j], w=cur[k]; if(!w)return; const m=Math.hypot((w[0]-v[0])*60,(w[1]-v[1])*26); if(m>out.max)out.max=m; if(m>8)out.far++ })) } prevC=null }
        if(prevC&&cf<20)Object.keys(cur).forEach(k=>{ const o=prevC[k]; if(!o)return; out.open++; if(Math.hypot((cur[k][0]-o[0])*60,(cur[k][1]-o[1])*26)>5)out.big++ });
        prevC=cur; cf++ } });
    live.done=true; live.pb=null; return out });
  const ok1=R.far<=R.joins*2, ok2=R.big===0, ok3=R.bfar<=R.backs*2;
  console.log(`  ${ok1?'ok  ':'FAIL'} at a clip's first frame, men more than 8 m from where the play had them: ${R.far} over ${R.joins} clips (largest ${R.max.toFixed(1)} m)`);
  console.log(`  ${ok2?'ok  ':'FAIL'} steps over 5 m a frame in a clip's opening: ${R.big} of ${R.open}`);
  console.log(`  ${ok3?'ok  ':'FAIL'} after a clip, men more than 8 m from where it left them: ${R.bfar} over ${R.backs} (largest ${R.bmax.toFixed(1)} m)`);
  await b.close(); console.log(ok1&&ok2&&ok3?'MATCH the shot grows out of the play (hockey)':'MISMATCH the shot cuts in'); process.exit(ok1&&ok2&&ok3?0:1) })();
