/* Hockey overtime is drawn three-on-three (round 107, Instinct: overtime announced three-on-three, the rink drew five a
   side). Seed 6's first game goes to overtime; every frame drawn there counts its men.
     node test/hk-ot.js [distDir]      last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
(async()=>{ const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.join(process.argv[2]||path.join(__dirname,'..','dist'),'hockey-coach-pro.html')); await p.waitForTimeout(300);
 await p.evaluate(()=>{ window.__dots=0; window.__frames=[]; const o=hlDot; hlDot=function(){ window.__dots++; return o.apply(this,arguments) }; const raf=window.requestAnimationFrame; window.requestAnimationFrame=function(cb){ return raf(t=>{ window.__dots=0; cb(t); const lab=((document.querySelector('.wlabel')||{}).textContent||''); if(window.__dots)window.__frames.push([/OT|overtime/i.test(lab)?1:0,window.__dots]); if(window.__frames.length>4000)window.__frames.shift() }) };
   newDynasty('Florida',6,'T'); S.title=false; S.guide=false; S.watchSpeed='rapid'; S.highlights='full'; render(); for(let k=0;k<3&&!live;k++)doAdvance() });
 for(let i=0;i<40000;i++){ await p.waitForTimeout(40); const e=await p.evaluate(()=>{ if(!live||live.done)return 1; if(live.ask)answerLive(live.ask.dp.opts[0][0]); return 0 }); if(e)break }
 const r=await p.evaluate(()=>{ const ot=__frames.filter(f=>f[0]).map(f=>f[1]), reg=__frames.filter(f=>!f[0]).map(f=>f[1]); const h=a=>{ const o={}; a.forEach(x=>o[x]=(o[x]||0)+1); return o }; return {ot:h(ot), reg:h(reg.slice(-500))} });
  const ks=Object.keys(r.ot).map(Number), ok=ks.length>0&&ks.every(k=>k<=9)&&!errs.length; console.log(`${ok?'  ok  ':'  FAIL'} men drawn a frame in overtime: ${JSON.stringify(r.ot)}; in regulation: ${JSON.stringify(r.reg)} ${errs[0]||''}`); await b.close(); console.log(ok?'MATCH overtime is three-on-three':'MISMATCH'); process.exit(ok?0:1) })();
