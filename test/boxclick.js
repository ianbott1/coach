/* The box score opens, however you press it (round 78). Testers pressed BOX SCORE five times in four games and landed
   back on the hub: Enter and Space on the focused toggle went to the page's "advance" shortcut and started the next
   game. In a real browser, every game: play a game, then the Box score toggle opens by keyboard (Enter, Space) without
   leaving the result card, by mouse, and by a tap on a phone; Rewatch shows the box score too. Tests the press, not
   the HTML.
     node test/boxclick.js [file-prefix]          last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIR=process.env.DIST||path.join(__dirname,'..','dist');
const GAMES=[['football-coach.html','Alabama'],['football-coach-pro.html','Kansas City'],['basketball-coach.html','Duke'],['basketball-coach-pro.html','Boston'],
  ['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
const only=process.argv[2]; let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
async function played(b,f,team,phone){
  const p=await (await b.newContext(phone?{viewport:{width:390,height:844},hasTouch:true,isMobile:true}:{viewport:{width:1265,height:900}})).newPage(), errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.join(DIR,f)); await p.waitForTimeout(500);
  await p.evaluate(([t])=>{ newDynasty(t,5,'T'); S.title=false; S.guide=false; render() },[team]);
  await p.evaluate(()=>{ for(let k=0;k<8&&!live;k++)doAdvance() });
  for(let i=0;i<6000;i++){ const d=await p.evaluate(()=>{ if(!live||live.done)return 1; if(live.ask)answerLive(live.ask.dp.opts[0][0]); else liveTick(); return 0 }); if(d)break }
  await p.evaluate(()=>{ if(live&&live.done&&typeof finishLive==='function')finishLive(); render() }); await p.waitForTimeout(300);
  return {p,errs} }
const state=p=>p.evaluate(()=>({box:!!document.querySelector('details.boxscore'), open:!!document.querySelector('details.boxscore[open]'), step:SEA.step, live:!!(live&&!live.done)}));
(async()=>{ const b=await chromium.launch();
  for(const [f,team] of GAMES.filter(g=>!only||g[0].startsWith(only))){
    for(const key of ['Enter',' ']){
      const {p,errs}=await played(b,f,team); const s0=await state(p);
      if(!s0.box){ ok(false,`${f}: no box score on the result card`); await p.close(); continue }
      await p.focus('details.boxscore > summary'); await p.keyboard.press(key); await p.waitForTimeout(300); const s1=await state(p);
      ok(s1.open&&s1.step===s0.step&&!s1.live,`${f}: ${key===' '?'Space':'Enter'} on Box score opens it and stays on the result card (step ${s0.step} -> ${s1.step})`);
      if(errs.length){ bad++; console.log('  page errors: '+errs.slice(0,2).join(' | ')) } await p.close() }
    { const {p}=await played(b,f,team); await p.click('details.boxscore > summary'); await p.waitForTimeout(200); ok((await state(p)).open,`${f}: a click opens it`);
      // Rewatch: the box score is there too
      await p.evaluate(()=>{ const r=document.querySelector('[data-rewatch]'); if(r)r.click() }); await p.waitForTimeout(300);
      ok(await p.evaluate(()=>!!watch&&!!document.querySelector('.wbox details.boxscore')),`${f}: Rewatch shows the box score`); await p.close() }
    { const {p}=await played(b,f,team,true); await p.evaluate(()=>document.querySelector('details.boxscore > summary').scrollIntoView({block:'center'})); await p.waitForTimeout(150);
      const r=await p.evaluate(()=>{ const x=document.querySelector('details.boxscore > summary').getBoundingClientRect(); return {x:x.x+x.width/2,y:x.y+x.height/2} });
      await p.touchscreen.tap(r.x,r.y); await p.waitForTimeout(250); ok((await state(p)).open,`${f}: a tap on a phone opens it`); await p.close() } }
  await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH the box score opens however you press it'); process.exit(bad?1:0) })();
