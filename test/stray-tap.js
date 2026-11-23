/* A tap that began on the game screen does nothing on the screen that follows (round 107, Grokbot, baseball at 390px:
   one Skip in the eighth, and the next game's first pitch; its result card never showed). On a phone, a touch tap on
   Skip late in a game: the game ends, its result stays on screen, the next game hasn't started. A slow ending is
   simulated (the ending takes 1.5s), as on a phone.
     node test/stray-tap.js [distDir]      last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist'); let bad=0;
(async()=>{ const b=await chromium.launch();
 for(const [f,t] of [['baseball-coach-pro.html','Seattle'],['hockey-coach-pro.html','Florida'],['basketball-coach.html','Minnesota']]) for(const slow of [0,1500]){
  const p=await (await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.join(DIST,f)); await p.waitForTimeout(300);
  await p.evaluate(t=>{ newDynasty(t,7,'T'); S.title=false; S.guide=false; S.watchSpeed='fast'; render() },t);
  for(let k=0;k<8;k++){ if(await p.evaluate(()=>!!live))break; await p.evaluate(()=>doAdvance()); await p.waitForTimeout(300) }
  // late in the game, calls answered
  for(let i=0;i<6000;i++){ await p.waitForTimeout(20); const r=await p.evaluate(()=>{ if(!live||live.done)return -1; if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return 0 } const n=live.drives.length, N=SPORT.drivesPerGame||(LEAGUE.id==="mlb"?9:LEAGUE.id==="nhl"?12:8); return n/N }); if(r<0||r>=0.7)break }
  // keep tapping Skip (it stops for calls and close finishes) until the game ends
  await p.evaluate(ms=>{ window.__g=live&&live.g; if(ms){ const o=finishLive; finishLive=function(){ const r=o.apply(this,arguments); const t=Date.now(); while(Date.now()-t<ms){} return r } } },slow);
  let taps=0; for(let k=0;k<12;k++){ const st=await p.evaluate(()=>({done:!live||live.done,ask:!!(live&&live.ask)})); if(st.done)break;
    if(st.ask){ await p.evaluate(()=>answerLive(live.ask.dp.opts[0][0])); await p.waitForTimeout(150); continue }
    const sk=await p.$('#wskip'); if(!sk){ await p.waitForTimeout(150); continue } const R=await sk.boundingBox(); if(!R){ await p.waitForTimeout(150); continue }
    await p.touchscreen.tap(R.x+R.width/2,R.y+R.height/2); taps++; await p.waitForTimeout(2600) }
  const s=await p.evaluate(()=>({same:!!live&&live.g===window.__g, done:!!live&&live.done, first:/first pitch|before the/i.test(document.body.innerText.slice(0,400))}));
  const ok=s.same&&s.done; if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f}${slow?' (slow ending)':''}: ${taps} taps on Skip; the game ${s.done?'ended':'did not end'}, ${s.same?'its result on screen':'and the next game started'}${errs.length?' | '+errs[0]:''}`);
  await p.close() }
 await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH a tap on Skip as a game ends never starts the next'); process.exit(bad?1:0) })();
