/* Soccer's and hockey's full match (round 101), in a browser, a whole game each at Very fast: every stretch is played
   back on a running clock; the page's score never goes down while it plays; each stretch starts where the last ended;
   every goal shows at its own minute (the header's clock when the score moves is the goal's minute); the final is the
   engine's; no page errors.   node test/ev-full.js    last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
const DIST=process.env.DIST||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,team] of [['soccer-coach.html','Arsenal'],['hockey-coach-pro.html','Vegas']]){
  const pg=await b.newPage({viewport:{width:1280,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.join(DIST,f)); await pg.waitForTimeout(300);
  await pg.evaluate(t=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty(t,5,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render() },team);
  for(let k=0;k<6;k++){ await pg.evaluate(()=>doAdvance()); await pg.waitForTimeout(200); if(await pg.evaluate(()=>!!live&&!live.done))break }
  const r=await pg.evaluate(()=>new Promise(res=>{ const o={played:0,down:0,jump:0,goals:0,atMinute:0,offMinute:[],ex:[]}; let lastPb=null, prev=null, endOf=null;
    const t=setInterval(()=>{ try{
      if(!live){ clearInterval(t); res(o); return }
      if(live.ask){ answerLive(live.ask.dp.opts[0][0]); prev=null; return }
      if(live.done){ clearInterval(t); o.final=[live.eng.h,live.eng.a]; res(o); return }
      const P=live.pb; if(!P||!live.hold)return;
      if(P!==lastPb){ lastPb=P; o.played++; if(endOf&&(P.h0!==endOf[0]||P.a0!==endOf[1])){ o.jump++; if(o.ex.length<3)o.ex.push(`jump ${endOf} to ${P.h0},${P.a0}`) } endOf=[P.d.sh,P.d.sa]; prev=null }
      const H=live.hold, sc=H.h+H.a;
      if(prev){ if(sc<prev.sc)o.down++;
        if(sc>prev.sc){ o.goals++; const mins=(P.d.ev||[]).filter(e=>e.k==="goal").map(e=>e.m), m=+(String(H.clock||"").match(/(\d+)'/)||[])[1];
          if(mins.includes(m))o.atMinute++; else o.offMinute.push([H.clock,mins]) } }
      prev={sc:sc};
    }catch(e){ clearInterval(t); o.ex.push('error '+e.message); res(o) } },30) }));
  const ok=r.played>=12&&r.down===0&&r.jump===0&&r.goals>=2&&r.offMinute.length===0&&!errs.length&&!r.ex.some(x=>/^error/.test(x));
  if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${r.played} stretches played back, ${r.goals} goals seen, ${r.atMinute} at their minute${r.offMinute.length?', off: '+JSON.stringify(r.offMinute.slice(0,3)):''}, score went down ${r.down}, jumps ${r.jump}, final ${JSON.stringify(r.final)}${r.ex.length?' | '+r.ex.join('; '):''}${errs.length?' | '+errs[0]:''}`);
  await pg.close() }
 console.log(bad?'MISMATCH':'MATCH'); await b.close() })();
