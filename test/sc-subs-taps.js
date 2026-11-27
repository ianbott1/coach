/* soccer (engine 22), in a browser: the change buttons. Two taps on "Fresh legs in midfield" (300 ms apart) during a
   running Full match make one change on the next stretch (d.sub lists it once, one left); the same at half-time, with
   the call on screen before the stretch plays. Round 112: on engine 26 the buttons name the change ("Forsberg for
   Kirkwood (midfield ...)", #ma-s3), so the same two taps on it must make one change: one fewer left, once.   node test/sc-subs-taps.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0; const chk=(ok,m)=>{ console.log((ok?'  ok   ':'  FAIL ')+m); if(!ok)bad++ };
  for(const at of [3,9]){ const p=await (await b.newContext({viewport:{width:1280,height:900}})).newPage(); await p.goto('file://'+path.join(DIST,'soccer-coach.html')); await p.waitForTimeout(300);
    await p.evaluate(()=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty('Southampton',7,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render(); for(let k=0;k<3&&!live;k++)doAdvance() });
    // run to the stretch, answering calls, then stop the clock
    for(let i=0;i<4000;i++){ const st=await p.evaluate((at)=>{ if(!live)return 'none'; if(live.ask&&live.drives.length!==at){ answerLive(live.ask.dp.opts[0][0]); return 'ask' } if(live.drives.length>=at)return 'there'; if(live.pb&&!live.ask){ if(live.timer){clearTimeout(live.timer);live.timer=null} live.pb=null; liveTick() } return 'go' },at);   /* round 111: Very fast now plays a soccer stretch in about a minute, so the run-up skips the playback */ if(st==='there'||st==='none')break; await p.waitForTimeout(50) }
    await p.evaluate(()=>{ live.paused=true; clearTimeout(live.timer); live.timer=null; render() }); await p.waitForTimeout(200);
    const ask0=await p.evaluate(()=>!!live.ask);
    if(ask0){ await p.evaluate(()=>{ live.ask=live.ask }) }
    const V26=await p.evaluate(()=>ENGINE_V>=26), BID=V26?'#ma-s3':'#ms-1';
    if(V26){ const before=await p.evaluate(()=>{ const sd=live.userIsHome?'home':'away'; return live.eng.subsLeft(sd) });
      const b26=await p.$(BID); if(!b26){ chk(false,`stretch ${at}: no named change button (ask on screen: ${ask0})`); await p.close(); continue }
      await b26.click(); await p.waitForTimeout(300); const b2=await p.$(BID); if(b2&&!(await b2.isDisabled()))await b2.click(); await p.waitForTimeout(200);
      const pend=await p.evaluate(()=>{ const sd=live.userIsHome?'home':'away'; return (live.pm||[]).filter(x=>x[1]===sd&&x[2]==='act:s3').length });
      await p.evaluate(()=>{ live.paused=false; if(!live.ask)liveTick() });
      for(let i=0;i<4000;i++){ const st=await p.evaluate((at)=>{ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return 'ask' } if(live.drives.length>at)return 'done'; return 'go' },at); if(st==='done')break; await p.waitForTimeout(50) }
      const R=await p.evaluate(()=>{ const sd=live.userIsHome?'home':'away'; return {left:live.eng.subsLeft(sd), chg:!!live.eng.S[sd].chg[3], n:live.drives.length} });
      chk(pend===1&&R.left===before-1&&R.chg, `two taps on a named change at stretch ${at}${ask0?' (a call on screen)':''}: ${pend} called, ${before} left before and ${R.left} after, midfield changed: ${R.chg} (${R.n} stretches played)`);
      await p.close(); continue }
    const btn=await p.$('#ms-1'); if(!btn){ chk(false,`stretch ${at}: no change button (ask on screen: ${ask0})`); await p.close(); continue }
    await btn.click(); await p.waitForTimeout(300); await (await p.$('#ms-1')).click(); await p.waitForTimeout(200);
    const left0=await p.evaluate(()=>liveSubsLeft());
    // play on to the end of the next stretch
    await p.evaluate(()=>{ live.paused=false; if(!live.ask)liveTick() }); 
    for(let i=0;i<4000;i++){ const st=await p.evaluate((at)=>{ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return 'ask' } if(live.drives.length>at)return 'done'; return 'go' },at); if(st==='done')break; await p.waitForTimeout(50) }
    const R=await p.evaluate((at)=>{ const side=live.userIsHome?'home':'away', d=live.drives[at]; return {n:live.drives.length,sub:d&&d.sub?d.sub[side]:[],left:liveSubsLeft(),made:live.eng.S[side].subs} },at);
    chk(JSON.stringify(R.sub)==='[1]'&&R.left===1&&left0===1, `two taps at stretch ${at}${ask0?' (a call on screen)':''}: the stretch's changes ${JSON.stringify(R.sub)}, ${R.left} left (${left0} just after the taps; ${R.n} stretches played)`);
    await p.close() }
  await b.close(); console.log(bad?`MISMATCH ${bad} failed`:'MATCH a change by the buttons is made once'); process.exit(bad?1:0) })();
