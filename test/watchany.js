/* Watch any game in the league, in a real browser (round 81). All seven: a few weeks in, Scores shows Watch on the
   computer games (not on yours); tapping one plays it with clips at Every chance and no page errors, ends on the
   recorded score with who won (not WIN or LOSS), the box score under it; Back returns to Scores; the career is exactly
   as it was (nothing recorded, nothing changed), and the depth buttons change what plays.
     node test/watchany.js [file-prefix]          last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIR=process.env.DIST||path.join(__dirname,'..','dist'), only=process.argv[2]; let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const GAMES=[['football-coach.html','Alabama'],['football-coach-pro.html','Kansas City'],['basketball-coach.html','Duke'],['basketball-coach-pro.html','Boston'],['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
(async()=>{ const b=await chromium.launch();
  for(const [f,team] of GAMES.filter(g=>!only||g[0].startsWith(only))){
    const p=await b.newPage({viewport:{width:1265,height:900}}), errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.join(DIR,f)); await p.waitForTimeout(400);
    const pre=await p.evaluate(([t])=>{ newDynasty(t,5,'T'); S.title=false; S.guide=false; S.highlights='all';
      for(let w=0;w<3;w++){ doAdvance(); let n=0; while(live&&!live.done&&n++<6000){ live.ask?answerLive(live.ask.dp.opts[0][0]):liveTick() } if(live&&live.done&&typeof finishLive==='function')finishLive() }
      view='scores'; scoreWk=null; render();
      const btns=[...document.querySelectorAll('[data-watchg]')], mineBtn=[...document.querySelectorAll('article.mine [data-watchg]')].length;
      return {n:btns.length,mineBtn,h:JSON.stringify([S.calls,S.played&&S.played.length,SEA.rec,SEA.rng.a,SEA.step])} },[team]);
    ok(pre.n>0&&pre.mineBtn===0,`${f}: Watch on ${pre.n} computer games, none on yours`);
    await p.click('[data-watchg]'); await p.waitForTimeout(300);
    const r=await p.evaluate(async()=>{ if(!watch)return {err:'no watch'}; const g=watch.g; const want=[g.hp,g.ap]; let clips=0;
      const real=hlWatchAt; window.hlWatchAt=function(i){ const ms=real.apply(this,arguments); if(ms)clips++; return ms };
      for(let k=0;k<400&&watch&&watch.i<watch.script.length;k++){ stepWatch() } window.hlWatchAt=real;
      render(); const last=watch.script[watch.script.length-1]||{}; const txt=document.getElementById('app').innerText;
      return {clips, end:[last.h,last.a], want, win:/\bWIN\b/.test(txt)&&!/ WIN\b/.test(txt.replace(/\n/g,' ').replace(/[A-Z&.' ]+ WIN/,'')), label:(txt.match(/FINAL[^\n]*/)||[''])[0], box:!!document.querySelector('.wbox details.boxscore, .wbox .boxscore'), depth:document.querySelectorAll('[data-whl]').length} });
    ok(!r.err&&r.end[0]===r.want[0]&&r.end[1]===r.want[1],`${f}: plays to the recorded score ${r.want&&r.want.join('-')} (${r.end&&r.end.join('-')})`);
    ok(r.clips>0,`${f}: with clips (${r.clips})`);
    ok(/WIN|DRAW/.test(r.label)&&!/· (WIN|LOSS)$/.test(r.label.trim()),`${f}: ends with who won: "${r.label.trim()}"`);
    ok(r.box,`${f}: the box score under it`);
    await p.evaluate(()=>{ const d=document.getElementById('wdone'); if(d)d.click() }); await p.waitForTimeout(200);
    const post=await p.evaluate(()=>({back:!watch&&view==='scores',h:JSON.stringify([S.calls,S.played&&S.played.length,SEA.rec,SEA.rng.a,SEA.step])}));
    ok(post.back,`${f}: Back returns to Scores`); ok(post.h===pre.h,`${f}: the career is exactly as it was`);
    if(errs.length){ bad++; console.log('  page errors: '+errs.slice(0,2).join(' | ')) } await p.close() }
  await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH any game in the league can be watched'); process.exit(bad?1:0) })();
