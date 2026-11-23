/* Baseball's full match pitch by pitch (round 105), in a browser at Very fast: the line score's H is the hits the screen
   has shown (it read the inning's hits before they were played): never down, never past the hits of the innings shown
   so far, going up as each hit is played (not at the inning's end), never past the engine's; held as it was at a call; the count shows on screen; no page errors.
     node test/bs-watch.js     last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
const DIST=process.env.DIST||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const team of ['Seattle','Boston']){
  const pg=await b.newPage({viewport:{width:1280,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.join(DIST,'baseball-coach-pro.html')); await pg.waitForTimeout(300);
  await pg.evaluate(t=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty(t,5,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render() },team);
  for(let k=0;k<6;k++){ await pg.evaluate(()=>doAdvance()); await pg.waitForTimeout(200); if(await pg.evaluate(()=>!!live&&!live.done))break }
  const r=await pg.evaluate(()=>new Promise(res=>{ const o={n:0,down:0,over:0,behind:0,mid:0,ex:[]}; let prev=null, prevD=null;
    const t=setInterval(()=>{ try{
      if(!live){ clearInterval(t); res(o); return } if(live.ask){ if(!o.askAt){ o.askAt=Date.now(); o.atAsk=null } if(Date.now()-o.askAt<400){ const rows=[...document.querySelectorAll('.linescore tr')].slice(1).map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent)); if(rows.length>=2){ const H=rows.map(c=>+c[c.length-1]||0); if(prev&&(H[0]!==prev[0]||H[1]!==prev[1])){ o.askJump=(o.askJump||0)+1; if(o.ex.length<3)o.ex.push(`at a call ${prev} -> ${H}`) } o.asks=(o.asks||0)+1 } return } o.askAt=0; answerLive(live.ask.dp.opts[0][0]); return }
      if(live.done){ clearInterval(t); const L=live.drives[live.drives.length-1]; o.engH=L&&L.hits?[L.hits[1],L.hits[0]]:null; res(o); return }
      if(!live.pb||!live.pb.d)return; const rows=[...document.querySelectorAll('.linescore tr')].slice(1).map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent)); if(rows.length<2)return;
      const H=rows.map(c=>+c[c.length-1]||0), di=live.drives.indexOf(live.pb.d), cap=di>=0&&live.pb.d.hits?[live.pb.d.hits[1],live.pb.d.hits[0]]:null; o.n++;   // rows: away, home
      if(prev&&(H[0]<prev[0]||H[1]<prev[1])){ o.down++; if(o.ex.length<3)o.ex.push(`down ${prev} -> ${H}`) }
      if(cap){ if(H[0]>cap[0]||H[1]>cap[1]){ o.over++; if(o.ex.length<3)o.ex.push(`past the inning: ${H} vs ${cap}`) } if(H[0]<cap[0]||H[1]<cap[1])o.behind++ }
      if(prev&&prevD===live.pb.d&&(H[0]!==prev[0]||H[1]!==prev[1]))o.mid++;   // a hit counted as it's played, not at the inning's end
      prev=H; prevD=live.pb.d; o.lastH=H }catch(e){ clearInterval(t); res(Object.assign(o,{err:e.message})) } },50) }));
  const ok=!r.err&&!errs.length&&r.n>50&&!r.askJump&&r.down===0&&r.over===0&&r.mid>0&&r.engH&&r.lastH&&r.lastH[0]<=r.engH[0]&&r.lastH[1]<=r.engH[1];
  if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${team}: ${r.n} looks; H went down ${r.down}, ran past the innings shown ${r.over}, went up mid-inning ${r.mid} times; at the calls (${r.asks||0} looks) H changed ${r.askJump||0}; last seen H ${JSON.stringify(r.lastH)}, engine's at the end ${JSON.stringify(r.engH)}${r.ex.length?' | '+r.ex.join('; '):''}${r.err?' | '+r.err:''}${errs.length?' | '+errs[0]:''}`);
  await pg.close() }
 console.log(bad?'MISMATCH':'MATCH'); await b.close() })();
