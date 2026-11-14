/* Rewatch on the pitch (round 73, Instinct: "Rewatch is text only ... players will want to rewatch the goals on it").
   In a real browser, each sport: play the first game watched, then Rewatch it. Counts the clips the rewatch plays and
   checks, at every redraw while one plays, that the header shows the clip's time (one clock, round 72), and that every
   scoring drive of the game played its clips. Fails on a sport whose rewatch plays no clips, or a header off the clip.
     node test/rewatch.js [sport-file-prefix]          DIST=dir for another build */
const {chromium}=require('playwright'), path=require('path');
const GAMES=[['soccer-coach.html','Wrexham'],['hockey-coach-pro.html','Winnipeg'],['basketball-coach-pro.html','Boston'],['basketball-coach.html','Duke'],['football-coach-pro.html','Green Bay'],['football-coach.html','Alabama'],['baseball-coach-pro.html','Houston']];
const only=process.argv.slice(2).find(a=>!a.startsWith('--'));
let bad=0;
(async()=>{ const b=await chromium.launch();
 for(const [f,team] of GAMES.filter(x=>!only||x[0].indexOf(only)===0)){
  const p=await (await b.newContext({viewport:{width:1265,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),f)); await p.waitForTimeout(400);
  await p.evaluate(([t])=>{ newDynasty(t,7,'T'); S.title=false; S.guide=false; S.watchSpeed='rapid'; S.highlights='key'; render() },[team]);
  for(let k=0;k<6;k++){ if(await p.evaluate(()=>!!live))break; await p.evaluate(()=>doAdvance()); await p.waitForTimeout(300) }
  // the live game, quickly: highlights off for it
  await p.evaluate(()=>{ S.highlights='off'; live.ff=true });
  for(let i=0;i<4000;i++){ const d=await p.evaluate(()=>{ if(!live||live.done)return 1; if(live.ask)answerLive(live.ask.dp.opts[0][0]); else liveTick(); return 0 }); if(d)break }
  await p.evaluate(()=>{ if(live&&live.done&&typeof finishLive==="function")finishLive(); S.highlights='key'; render() }); await p.waitForTimeout(300);
  const has=await p.evaluate(()=>!!document.querySelector('[data-rewatch]'));
  if(!has){ console.log(`  FAIL ${f}: no Rewatch button after the game`); bad++; await p.close(); continue }
  await p.evaluate(()=>{ window.__clips=0; const hs=hlStart; hlStart=function(c){ window.__clips++; if(c.kind==='goal')window.__goalClips=(window.__goalClips||0)+1; return hs(c) }; document.querySelector('[data-rewatch]').click() });
  await p.waitForTimeout(200);
  const plan=await p.evaluate(()=>watch&&watch.hl?watch.hl.end.length:null);
  const scoring=await p.evaluate(()=>{ const g=watch.g; let n=0; (g.drives||[]).forEach(d=>{ try{ if((HL_SPORT.clips({g:g,drives:g.drives},d,'goals')||[]).length)n++ }catch(e){} }); return n });
  let redraws=0, off=0, t0=Date.now(); const shots=[];
  while(Date.now()-t0<240000){ await p.waitForTimeout(60);
    const s=await p.evaluate(()=>{ if(!watch)return {gone:1};
      const lab=(document.querySelector('.wtop .wlabel')||{}).innerText||'';
      const want=HL.cur&&watch.hlClock?hlHeadClock(HL.cur):null;
      return {done:watch.i>=watch.script.length, lab:lab.trim(), want:want, cur:!!HL.cur} });
    if(s.gone||s.done)break;
    if(s.cur&&s.want&&process.env.SHOT&&!shots.length){ shots.push(1); await p.waitForTimeout(500); await p.screenshot({path:path.join(process.env.SHOT,f.replace('.html','.png'))}) }
    if(s.cur&&s.want){ redraws++; if(s.lab.toLowerCase().indexOf(s.want.toLowerCase())<0){ off++; if(off<=3)console.log(`  header "${s.lab}" while a clip of ${s.want} plays`) } } }
  const goals=await p.evaluate(()=>{ const g=watch.g, d=g.drives[g.drives.length-1]; return [d.sh,d.sa,window.__goalClips||0] });
  const clips=await p.evaluate(()=>window.__clips), played=await p.evaluate(()=>watch&&watch.hl?watch.hl.next:null);
  const goalsOk=!/soccer|hockey/.test(f)||(goals[0]+goals[1]===goals[2]); if(!goalsOk)console.log(`  ${f}: ${goals[0]+goals[1]} goals but ${goals[2]} goal clips`);
  const ok=clips>0&&off===0&&plan!=null&&played===plan&&goalsOk; if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${clips} clips in the rewatch (${scoring} drives with goals), header off the clip in ${off} of ${redraws} redraws, drives covered ${played}/${plan}; final ${goals[0]}-${goals[1]}, goal clips ${goals[2]}`);
  if(errs.length){ console.log('  page errors: '+errs.slice(0,2).join(' | ')); bad++ }
  await p.close() }
 await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH the rewatch plays the game on the pitch'); process.exit(bad?1:0) })();
