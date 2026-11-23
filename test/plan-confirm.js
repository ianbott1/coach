/* A change of plan in a live game takes two taps on the same button (round 107, Grokbot: a click meant for Full
   match landed on Shorten the game as the screen moved, and the plan changed with nothing said). One tap arms it
   and says so; a second tap changes it; the arming lapses after a few seconds or on a tap on anything else.
     node test/plan-confirm.js [distDir]      last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
let bad=0; const ok=(c,m)=>{ if(!c){bad++; console.log('  FAIL '+m)} };
(async()=>{ const b=await chromium.launch();
 for(const [w,h] of [[1280,800],[390,844]]) for(const [f,t] of [['basketball-coach.html','Minnesota'],['hockey-coach-pro.html','Florida'],['soccer-coach.html','Southampton'],['football-coach-pro.html','Green Bay']]){
  const p=await (await b.newContext({viewport:{width:w,height:h},hasTouch:w<500})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.join(DIST,f)); await p.waitForTimeout(300);
  await p.evaluate(t=>{ newDynasty(t,7,'T'); S.title=false; S.guide=false; S.watchSpeed='slow'; render() },t);
  for(let k=0;k<8;k++){ if(await p.evaluate(()=>!!live))break; await p.evaluate(()=>doAdvance()); await p.waitForTimeout(300) }
  const pause=()=>p.evaluate(()=>{ if(live.ask)answerLive(live.ask.dp.opts[0][0]); live.paused=true; if(live.timer){clearTimeout(live.timer);live.timer=null} render() });
  await pause(); await p.waitForTimeout(200);
  const st=()=>p.evaluate(()=>({cur:livePlanNow(), pm:(live.pm||[]).length}));
  const s0=await st(); const other=await p.evaluate(c=>Object.keys(PLANS).find(k=>k!==c),s0.cur);
  const btn=()=>p.$(`[data-midplan="${other}"]`);
  const tag=`${w} ${f}`;
  ok(!!(await btn()),`${tag}: no plan buttons in the live game`);
  // one tap: armed, not changed
  await (await btn()).click(); await p.waitForTimeout(350);
  let s1=await st(); ok(s1.cur===s0.cur&&s1.pm===s0.pm,`${tag}: one tap changed the plan (${s0.cur} to ${s1.cur})`);
  ok(/Tap again/.test(await (await btn()).textContent()),`${tag}: one tap didn't ask for a second`);
  // the second tap changes it
  await (await btn()).click(); await p.waitForTimeout(300);
  let s2=await st(); ok(s2.cur===other&&s2.pm===s0.pm+1,`${tag}: two taps didn't change the plan (${s2.cur})`);
  ok(!/Tap again/.test(await (await btn()).textContent()),`${tag}: still asking after the change`);
  // arming lapses on a tap elsewhere
  const back=s0.cur, bb=()=>p.$(`[data-midplan="${back}"]`);
  await (await bb()).click(); await p.waitForTimeout(300);
  const hl=await p.$('[data-hlm]'); if(hl){ await hl.click(); await p.waitForTimeout(300);
    ok(!/Tap again/.test(await (await bb()).textContent()),`${tag}: still armed after a tap on the highlights`);
    await (await bb()).click(); await p.waitForTimeout(300);
    ok((await st()).cur===other,`${tag}: a tap after a tap elsewhere changed the plan`) }
  // and by itself after a few seconds
  await p.waitForTimeout(4400); await p.evaluate(()=>render());
  ok(!/Tap again/.test(await (await bb()).textContent()),`${tag}: still armed after 4 seconds`);
  await (await bb()).click(); await p.waitForTimeout(300);
  ok((await st()).cur===other,`${tag}: one tap after the arming lapsed changed the plan`);
  ok(!errs.length,`${tag}: page error ${errs[0]}`);
  console.log(`  ok   ${tag}: plan ${s0.cur} -> ${other} on the second tap`);
  await p.close() }
 await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH a live plan change takes two taps on the same button'); process.exit(bad?1:0) })();
