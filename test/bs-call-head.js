/* Baseball: a call inside an inning is headed by its inning (round 107, Grokbot: "After the 6th" over a card headed
   "7th inning, tied"). Six games on a phone, calls left to the assistant.   node test/bs-call-head.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path'); const dir=process.argv[2]||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
 await p.goto('file://'+path.join(dir,'baseball-coach-pro.html')); await p.waitForTimeout(300);
 await p.evaluate(()=>{ newDynasty('Seattle',7,'T'); S.title=false; S.guide=false; S.watchSpeed='rapid'; S.highlights='off'; render() });
 let n=0, bad=[], kinds={};
 for(let gm=0;gm<6;gm++){ for(let k=0;k<8;k++){ if(await p.evaluate(()=>!!live&&!live.done))break; await p.evaluate(()=>doAdvance()); await p.waitForTimeout(200) }
  for(let i=0;i<8000;i++){ await p.waitForTimeout(15); const s=await p.evaluate(()=>{ if(!live||live.done)return {end:1}; if(!live.ask)return {}; const lab=((document.querySelector('.wlabel')||{}).textContent||'').trim().replace(/\s+/g,' '), h=live.ask.dp.h, k=live.ask.dp.k; answerLive(live.ask.dp.opts[live.ask.dp.opts.length-1][0]); return {lab,h,k} });
   if(s.end)break; if(!s.h)continue; n++; kinds[s.k]=(kinds[s.k]||0)+1; const m=s.h.match(/^(\d+)(st|nd|rd|th) inning/); if(m&&!new RegExp('\\b'+m[1]+(m[2])+' inning','i').test(s.lab))bad.push(s.lab+' / '+s.h) } }
 const ok=n>=8&&!bad.length; console.log(`${ok?'  ok  ':'  FAIL'} ${n} calls ${JSON.stringify(kinds)}; header not the call's inning: ${bad.length}`, bad.slice(0,4)); await b.close(); console.log(ok?'MATCH a baseball call is headed by its inning':'MISMATCH'); process.exit(ok?0:1) })();
