/* soccer's full match as it moves: every stretch of a played match drawn frame by frame (a 500th of a stretch, about a
   tenth of a second at Normal), each man's step between frames. No one jumps across the pitch, no two of a side stand
   on each other for long, and everyone stays on the pitch.
     node test/sc-motion.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:900,height:700}})).newPage();
  await p.goto('file://'+path.join(DIST,'soccer-coach.html')); await p.waitForTimeout(300);
  const R=await p.evaluate(()=>{ newDynasty('Southampton',7,'T'); S.title=false; S.guide=false; render(); for(let k=0;k<3&&!live;k++)doAdvance();
    let n=0; while(live&&!live.done&&n++<5000){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } liveTick() }
    if(!live)return null; const c=document.createElement('canvas'); c.width=900; c.height=560; const x=c.getContext('2d');
    const out={held:0,loose:0,steps:[],big:0,stack:0,offp:0,frames:0,maxStep:0,where:''}; const D=live.drives.filter(d=>d.seg!=null&&!d.ot);
    D.forEach(d=>{ let prev=null; for(let i=0;i<=500;i++){ const f=i/500; HL_SPORT.amb(x,900,560,d,f); const P=HL_SPORT.spDrawPos?HL_SPORT.spDrawPos():null, G=HL_SPORT.spDrawDbg?HL_SPORT.spDrawDbg():null; if(!P)return; out.frames++;
        if(G&&G.u>=0.8){ out.held++; const q=P[G.s][G.bs]; if(Math.hypot((q[0]-G.bx)*105,(q[1]-G.by)*68)>4)out.loose++ }
        P.forEach((A,s)=>A.forEach((q,k)=>{ if(q[0]<-0.01||q[0]>1.01||q[1]<-0.01||q[1]>1.01)out.offp++; if(prev){ const m=Math.hypot((q[0]-prev[s][k][0])*105,(q[1]-prev[s][k][1])*68); if(m>out.maxStep){out.maxStep=m; out.where=d.seg+'@'+f+' side '+s+' man '+k} if(m>5)out.big++ } }));
        P.forEach(A=>{ for(let a=1;a<11;a++)for(let c2=a+1;c2<11;c2++)if(Math.hypot((A[a][0]-A[c2][0])*105,(A[a][1]-A[c2][1])*68)<1.2)out.stack++ });
        prev=P.map(A=>A.map(q=>q.slice())) } });
    return out });
  if(!R){ console.log('MISMATCH no live game'); process.exit(1) }
  const fr=R.frames*20, ok1=R.big/fr<0.002, ok2=R.stack/fr<0.01, ok3=R.offp===0, ok4=R.loose/Math.max(1,R.held)<0.05;
  console.log(`  ${ok1?'ok  ':'FAIL'} steps over 5 m between frames: ${R.big} of ${fr} (${(100*R.big/fr).toFixed(3)}%), largest ${R.maxStep.toFixed(1)} m (${R.where})`);
  console.log(`  ${ok2?'ok  ':'FAIL'} two of a side within 1.2 m: ${R.stack} pair-frames of ${fr}`);
  console.log(`  ${ok3?'ok  ':'FAIL'} men off the pitch: ${R.offp}`);
  console.log(`  ${ok4?'ok  ':'FAIL'} the man the ball went to has it: more than 4 m from it in ${R.loose} of ${R.held} frames (${(100*R.loose/Math.max(1,R.held)).toFixed(1)}%)`);
  await b.close(); const ok=ok1&&ok2&&ok3&&ok4; console.log(ok?'MATCH the full match moves smoothly':'MISMATCH the full match jumps'); process.exit(ok?0:1) })();
