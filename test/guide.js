/* The coach's notes, a guide through a first season (round 76; Ian: "it should be easy to get rid of the tutorial if you
   are an experienced player"). In a real browser, every game: a new career shows the welcome before the first game, a
   note on the live game, the Scores, Standings and Dynasty tabs, and the first offseason; "Got it" clears just that
   note; "Skip the guide" clears them all at once, and a new career afterwards, in this game and in another, starts with
   none; Help's "Coach's notes: On" brings them back. A hot seat has none.
     node test/guide.js [file-prefix]          last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIR=process.env.DIST||path.join(__dirname,'..','dist');
const GAMES=[['football-coach.html','Alabama'],['football-coach-pro.html','Kansas City'],['basketball-coach.html','Duke'],['basketball-coach-pro.html','Boston'],
  ['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
const only=process.argv[2]; let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
(async()=>{ const b=await chromium.launch();
  for(const [f,team] of GAMES.filter(g=>!only||g[0].startsWith(only))){
    const ctx=await b.newContext({viewport:{width:390,height:844}}), p=await ctx.newPage(), errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.join(DIR,f)); await p.waitForTimeout(500);
    const notes=()=>p.evaluate(()=>[...document.querySelectorAll('.guide[data-mark]')].map(x=>x.dataset.mark));
    const tab=v=>p.evaluate(v=>{ const t=document.querySelector(`.tab[data-v="${v}"]`); if(t)t.click() },v);
    await p.evaluate(([t])=>{ newDynasty(t,5,'T'); S.title=false; render() },[team]); await p.waitForTimeout(200);
    const hub=await notes(); ok(hub.includes('g_welcome'),`${f}: the welcome before the first game (${hub.join(', ')})`);
    const seen={}; for(const v of ['scores','stand','dyn']){ await tab(v); await p.waitForTimeout(100); seen[v]=(await notes()).includes('g_'+v) }
    ok(seen.scores&&seen.stand&&seen.dyn,`${f}: a note on Scores, Standings and Dynasty (${JSON.stringify(seen)})`);
    await tab('team'); await p.waitForTimeout(100);
    // "Got it" clears that note only
    await p.evaluate(()=>{ const m=document.querySelector('.guide[data-mark="g_welcome"] .markx:not(.guideoff)'); if(m)m.click() }); await p.waitForTimeout(150);
    const after=await notes(); ok(!after.includes('g_welcome'),`${f}: Got it clears the welcome`);
    await tab('scores'); await p.waitForTimeout(100); ok((await notes()).includes('g_scores'),`${f}: and leaves the others`); await tab('team');
    // the live game
    await p.evaluate(()=>doAdvance()); await p.waitForTimeout(300); let liveNote=false;
    for(let i=0;i<40&&!liveNote;i++){ liveNote=(await notes()).includes('g_live'); if(!liveNote){ await p.evaluate(()=>{ if(live&&!live.done&&!live.ask)liveTick() }); await p.waitForTimeout(30) } }
    ok(liveNote,`${f}: a note on the live game`);
    // Skip the guide: every note gone, and a new career (here and in another game) starts without them
    await p.evaluate(()=>{ const m=document.querySelector('.guide[data-mark] .guideoff'); if(m)m.click() }); await p.waitForTimeout(200);
    ok((await notes()).length===0&&await p.evaluate(()=>S.guide===false),`${f}: Skip the guide clears every note`);
    await p.evaluate(([t])=>{ newDynasty(t,6,'T'); S.title=false; render() },[team]); await p.waitForTimeout(200);
    ok(await p.evaluate(()=>S.guide===false)&&(await notes()).length===0,`${f}: a new career after skipping has no notes`);
    const other=GAMES.find(g=>g[0]!==f), q=await ctx.newPage(); await q.goto('file://'+path.join(DIR,other[0])); await q.waitForTimeout(600);
    await q.evaluate(([t])=>{ newDynasty(t,5,'T'); S.title=false; render() },[other[1]]); await q.waitForTimeout(200);
    ok(await q.evaluate(()=>S.guide===false),`${f}: skipping here turns the notes off in ${other[0]} too`); await q.close();
    // Help turns them back on, and the first offseason has its note
    await p.evaluate(()=>{ const b=document.querySelector('[data-guide="true"]'); GUIDE_SEEN={}; guideMark(null,false) });
    await p.evaluate(([t])=>{ live=null; newDynasty(t,8,'T'); S.title=false;   /* (the earlier career's live game, still at its call) */ let g=0; while(SEA.phase!=='done'&&g++<4000)SEA.advance(); openOffseason(); render() },[team]); await p.waitForTimeout(300);
    const st=await p.evaluate(()=>({guide:S.guide,off:!!S.off}));
    ok((await notes()).includes('g_offseason'),`${f}: the first offseason's note, with the notes back on (${JSON.stringify(st)}: ${(await notes()).join(',')})`);
    // a hot seat: none
    await p.evaluate(([t])=>{ const o=NAMES.find(x=>x!==t); newDynasty(t,7,'A',[{team:t,name:'Coach A'},{team:o,name:'Coach B'}]); S.title=false; render() },[team]); await p.waitForTimeout(200);
    ok(await p.evaluate(()=>S.guide!==true),`${f}: a hot seat has no notes`);
    if(errs.length){ bad++; console.log('  page errors: '+errs.slice(0,2).join(' | ')) }
    await ctx.close() }
  await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH the coach\'s notes come, go, and stay gone'); process.exit(bad?1:0) })();
