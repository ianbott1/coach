/* Round 99: in Full match the stretch plays before its moments; none is lost to the lead-in, a pause or a step, and the
   game finishes (round 112: a soccer match at Very fast now plays past ten minutes, round 111's pacing, so the cap is 30) (soccer, hockey and, from round 100, both basketball games, in a browser).   node test/full-order.js    last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,t] of [['soccer-coach.html','Arsenal'],['hockey-coach-pro.html','Vegas'],['basketball-coach-pro.html','Orlando'],['basketball-coach.html','Duke']]) for(const pauses of [false,true]){
  const pg=await b.newPage({viewport:{width:1280,height:900}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),f)); await pg.waitForTimeout(200);
  const r=await pg.evaluate(async([t,pauses])=>{ try{localStorage.setItem('coach-guide-seen','1')}catch(e){} newDynasty(t,5,'T'); S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render();
    const want=new Set(), got=new Set(); const orig=hlPlay; window.hlPlay=function(L,d){ const v=orig(L,d); if(v>0)got.add(L.drives.indexOf(d)); return v };
    const ow=hlWillPlay; window.hlWillPlay=function(L,d){ const v=ow(L,d); if(v)want.add(L.drives.length-1); return v };
    for(let k=0;k<4&&!live;k++){ doAdvance(); await new Promise(r=>setTimeout(r,200)) }
    const t0=Date.now(); let n=0; while(live&&!live.done&&Date.now()-t0<1800000){ if(live.ask)answerLive(live.ask.dp.opts[0][0]);
      if(pauses&&(++n%9===0)){ live.paused=true; if(live.timer){clearTimeout(live.timer);live.timer=null} await new Promise(r=>setTimeout(r,120)); live.paused=false; liveTick() }
      await new Promise(r=>setTimeout(r,150)) }
    const secs=Math.round((Date.now()-t0)/1000); const lost=[...want].filter(i=>!got.has(i)); return {want:want.size,got:got.size,lost,done:!live||live.done,secs} },[t,pauses]);
  const ok=r.done&&r.lost.length===0&&!errs.length; if(!ok)bad++;
  console.log(f.padEnd(24),pauses?'with pauses':'straight   ',JSON.stringify(r),errs.slice(0,1).join(''),ok?'ok':'FAIL'); await pg.close() }
 console.log(bad?'MISMATCH':'MATCH'); await b.close() })();
