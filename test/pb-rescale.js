/* round 111: a speed change inside a full-match stretch takes hold at once and keeps the stretch's place (stretches run
   minutes on Slow now). Per sport: start a stretch on Normal, let it run, press Slow: the share played must not move, the
   stretch's length must grow by Normal's pace over Slow's, and the stretch must end at the new length (its timer moved). */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
const G=[['soccer-coach.html','Southampton'],['hockey-coach-pro.html','Boston'],['basketball-coach-pro.html','Orlando'],['baseball-coach-pro.html','Seattle']];
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,team] of G){ const p=await b.newPage({viewport:{width:1100,height:800}}); await p.goto('file://'+path.join(DIST,f)); await p.waitForTimeout(300);
  const R=await p.evaluate(async(t)=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    newDynasty(t||Object.keys(SEA.roster)[0],5,'T'); S.watchSpeed='normal'; S.title=false; S.guide=false; S.highlights='full'; render();
    for(let k=0;k<8&&!live;k++)doAdvance(); if(!live)return {err:'no live game'};
    for(let k=0;k<400&&!(live.pb&&live.pb.frozen==null&&!live.done);k++){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } if(live.timer){ clearTimeout(live.timer); live.timer=null } liveTick() }
    if(!live.pb)return {err:'no stretch played back'};
    await sleep(1500); const P=live.pb, d=P.d, el0=Date.now()-P.at, f0=el0/P.ms, ms0=P.ms;
    let tmo=null; const ST=window.setTimeout; window.setTimeout=(fn,ms,...a)=>{ if(fn===liveTick)tmo=ms; return ST(fn,ms,...a) };
    const btn=document.querySelector('[data-speed="slow"]'); if(!btn)return {err:'no speed button'}; btn.dispatchEvent(new MouseEvent('pointerdown',{bubbles:true})); btn.click();
    await sleep(50); const P2=live.pb; if(P2!==P)return {err:'stretch changed on the press'};
    const el1=Date.now()-P2.at, f1=el1/P2.ms, ratio=P2.ms/ms0;
    window.setTimeout=ST; return {f0,f1,ratio,ms0,ms1:P2.ms,speed:S.watchSpeed,tmo,left:P2.ms-el1} },team);
  if(R.err){ console.log(`  FAIL ${f}: ${R.err}`); bad++; await p.close(); continue }
  const okF=Math.abs(R.f1-R.f0)<0.02, okR=R.ratio>1.5, okT=R.tmo!=null&&Math.abs(R.tmo-R.left)<500;
  console.log(`  ${okF&&okR&&okT?'ok  ':'FAIL'} ${f}: share played ${R.f0.toFixed(3)} then ${R.f1.toFixed(3)}; length ${Math.round(R.ms0/1000)} s then ${Math.round(R.ms1/1000)} s (x${R.ratio.toFixed(2)}); the stretch now ends in ${R.tmo==null?'(no new timer)':Math.round(R.tmo/1000)+' s'}`);
  if(!(okF&&okR&&okT))bad++; await p.close() }
 await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH a speed change takes hold mid-stretch'); process.exit(bad?1:0) })();
