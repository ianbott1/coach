/* Round 100 (Muse): after a call in the middle of an inning, the scoreboard stepped back to the inning's start ("6th
   inning, tied 2-2", then "Top of the 6th, 1-2") while the inning's clips played. Live baseball games with clips on, in
   a browser: after each call, the score on the page is never behind the score the call showed, and the line score's
   runs add up to it.   node test/bs-call-hold.js    last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
(async()=>{ const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),'baseball-coach-pro.html')); await pg.waitForTimeout(300);
 await pg.evaluate(()=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty('Seattle',5,'T'); S.title=false; S.guide=false; S.highlights='key'; S.watchSpeed='rapid'; render() });
 let calls=0, mid=0, back=0, held=0; const ex=[];
 const shown=()=>pg.evaluate(()=>{ const r=[...document.querySelectorAll('.linescore tr')].slice(1).map(tr=>+((tr.querySelector('td.b')||{}).textContent||0)); return {a:r[0],h:r[1],hold:!!live.hold} });   // what the page shows: the line score's R
 for(let g=0;g<24;g++){ await pg.evaluate(()=>doAdvance());
  for(let k=0;k<800;k++){ const s=await pg.evaluate(()=>!live?'none':live.done?'done':live.ask?'ask':'run'); if(s==='none'||s==='done')break;
   if(s==='ask'){ const c=await pg.evaluate(()=>{ const q=live.ask; if(q.mine==null)return null; const h=live.userIsHome?q.mine:q.theirs, a=live.userIsHome?q.theirs:q.mine, d=live.drives[live.drives.length-1]; return {h,a,inside:!!(d?(h!==d.sh||a!==d.sa):(h||a)),txt:q.dp.h||''} });
     await pg.evaluate(()=>answerLive(live.ask.dp.opts[0][0])); await pg.waitForTimeout(40);
     if(c){ calls++; if(c.inside)mid++; const n=await shown(); if(n.hold)held++; if(n.h<c.h||n.a<c.a){ back++; if(ex.length<3)ex.push(`"${c.txt}" ${c.a}-${c.h}, then ${n.a}-${n.h}`) } } }
   else await pg.evaluate(()=>{live.paused=true;liveTick()}) } }
 const ok=back===0&&mid>=2&&held>=3&&!errs.length;
 console.log(`${calls} calls, ${mid} inside an inning, ${held} followed by a held clip, ${back} stepped back${ex.length?' | '+ex.join('; '):''}${errs.length?' | '+errs[0]:''}`);
 console.log(ok?'MATCH':'MISMATCH'); await b.close() })();
