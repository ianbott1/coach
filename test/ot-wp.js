/* Pro basketball's win chance follows the score shown in overtime, in the full match (round 107, Grokbot: OT 2:16, down
   107-114, "Orlando: 53% to win"; the bar was drawn at the start of the stretch). Seed 75's first game went to overtime; on engine 26 (round 112) seed 31's does.
     node test/ot-wp.js [distDir]      last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path'); const HLM='full', SEED=+(process.argv[4]||31);
(async()=>{ const b=await chromium.launch(); const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+path.join(process.argv[2]&&!/^(full|key|all)$/.test(process.argv[2])?process.argv[2]:path.join(__dirname,'..','dist'),'basketball-coach-pro.html')); await p.waitForTimeout(300);
 await p.evaluate(([h,s])=>{ newDynasty('Orlando',s,'T'); S.title=false; S.guide=false; S.watchSpeed='rapid'; S.highlights=h; render(); for(let k=0;k<3&&!live;k++)doAdvance() },[HLM,SEED]);
 let bad=[], n=0, wasOT=false;
 for(let i=0;i<30000;i++){ await p.waitForTimeout(30); const s=await p.evaluate(()=>{ if(!live||live.done)return {end:1}; if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return {} }
    const lab=((document.querySelector('.wlabel')||{}).textContent||'').trim().replace(/\s+/g,' '), wp=(document.querySelector('.lwpct')||{}).textContent||'', sc=[...document.querySelectorAll('.scnum, .sbig, .big')].map(e=>e.textContent.trim()).slice(0,2).join('-');
    return {lab, wp, sc, h:liveH(), a:liveA(), hold:live.hold?[live.hold.h,live.hold.a,live.hold.n]:null, n:live.drives.length, tq:!!live.tailQ, me:live.g.home===S.myTeam} });
   if(s.end)break; if(!/OT|overtime/i.test(s.lab))continue; wasOT=true; n++;
   const H=s.hold?s.hold[0]:s.h, A=s.hold?s.hold[1]:s.a, mg=s.me?H-A:A-H, pc=+((s.wp.match(/(\d+)%/)||[])[1]);
   if(s.wp&&((mg<=-4&&pc>25)||(mg>=4&&pc<75))&&bad.length<5)bad.push(JSON.stringify(s)) }
  const ok=wasOT&&n>20&&!bad.length; console.log(`${ok?'  ok  ':'  FAIL'} overtime ${wasOT?'seen':'not reached'}, ${n} samples; the bar against the score shown: ${bad.length}`); bad.forEach(x=>console.log('  ',x)); if(errs[0])console.log(errs[0]); await b.close(); console.log(ok?'MATCH the win chance follows the score in overtime':'MISMATCH'); process.exit(ok?0:1) })();
