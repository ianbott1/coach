/* The surface fits above the action bar (round 102): during a Full match, all seven games, on laptop, desktop and phone
   screens, with the page at its top, through the first stretches and the calls between, no part of the field is under the fixed bar (at 1280x800 the bar hid a quarter
   of baseball's field, home plate and the batter, and soccer's near touchline). No page errors.
     node test/fit.js     last line: MATCH or MISMATCH */
const {chromium,devices}=require('playwright'); const path=require('path');
const DIST=process.env.DIST||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,team] of [['football-coach-pro.html','Denver'],['football-coach.html','Alabama'],['basketball-coach-pro.html','Orlando'],['basketball-coach.html','Duke'],['hockey-coach-pro.html','Vegas'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']]){
  const row=[]; let ok=true;
  for(const vp of [{width:1280,height:800},{width:1366,height:650},{width:1280,height:680},{width:1440,height:900},{width:1920,height:1080},'iPhone 13']){
   const ctx=await b.newContext(typeof vp==='string'?devices[vp]:{viewport:vp}); const pg=await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
   await pg.goto('file://'+path.join(DIST,f)); await pg.waitForTimeout(200);
   await pg.evaluate(t=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty(t,5,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='fast'; render() },team);
   for(let k=0;k<6;k++){ await pg.evaluate(()=>doAdvance()); await pg.waitForTimeout(200); if(await pg.evaluate(()=>!!live&&!live.done))break }
   // through the first stretches and the calls between them (the win-chance bar arrives after the first and pushes the field down)
   let m=null, n=0;
   for(let j=0;j<40;j++){ await pg.waitForTimeout(350); const q=await pg.evaluate(()=>{ if(live&&live.ask){ answerLive(live.ask.dp.opts[0][0]); return null } window.scrollTo(0,0); const c=document.querySelector('canvas.hlcv'); if(!c||!c.offsetHeight)return null; const r=c.getBoundingClientRect(), bar=document.querySelector('.actionbar'), top=bar&&bar.offsetHeight?bar.getBoundingClientRect().top:innerHeight;
       return {cTop:Math.round(r.top),w:Math.round(r.width),hidden:Math.max(0,Math.round(r.bottom-top))} });
     if(q){ n++; if(!m||q.hidden>m.hidden)m=q } }
   if(m)m.n=n;
   const name=typeof vp==='string'?vp:vp.width+'x'+vp.height;
   if(!m||m.hidden>0||errs.length){ ok=false; row.push(`${name}: ${m?`${m.hidden}px under the bar`:'no field'}${errs.length?' '+errs[0]:''}`) } else row.push(`${name} ok (${m.n} looks, ${m.w}px wide)`);
   await ctx.close() }
  if(!ok)bad++; console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${row.join(' | ')}`) }
 console.log(bad?'MISMATCH':'MATCH'); await b.close() })();
