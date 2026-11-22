/* Basketball's full match (round 101), in a browser, both leagues, a whole game each at Very fast: every stretch the
   engine logged is played back possession by possession; the score on the page never goes down while a stretch plays;
   each stretch starts from the score the last one ended on (no jump back, no basket shown twice); the box score credits
   the men the screen showed scoring; no page errors.   node test/bb-full.js    last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
const DIST=process.env.DIST||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,team] of [['basketball-coach-pro.html','Orlando'],['basketball-coach.html','Duke']]){
  const pg=await b.newPage({viewport:{width:1280,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.join(DIST,f)); await pg.waitForTimeout(300);
  await pg.evaluate(t=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty(t,5,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render() },team);
  // play to the first game day
  for(let k=0;k<5;k++){ await pg.evaluate(()=>doAdvance()); await pg.waitForTimeout(200); if(await pg.evaluate(()=>!!live))break }
  const r=await pg.evaluate(()=>new Promise(res=>{ const out={stretches:0,played:0,down:0,jump:[],samples:0}; let prevSc=null, lastD=null, endOf=null;
    const hdr=()=>{ const w=[...document.querySelectorAll('.wtop .wn')].map(e=>+e.textContent); return w.length===2?{a:w[0],h:w[1]}:null };
    const t=setInterval(()=>{ try{
      if(!live){ clearInterval(t); res(Object.assign(out,{err:'no live'})); return }
      if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return }
      if(live.done){ clearInterval(t); out.final=[live.eng.h,live.eng.a]; res(out); return }
      const H=hdr(); if(!H)return; out.samples++;
      if(live.pb&&live.pb.d!==lastD){ // a new stretch began: it starts where the last ended
        if(lastD){ out.stretches++; } lastD=live.pb.d; out.played++;
        if(endOf&&(live.pb.h0!==endOf[0]||live.pb.a0!==endOf[1]))out.jump.push([endOf,[live.pb.h0,live.pb.a0]]);
        endOf=[live.pb.d.sh,live.pb.d.sa]; prevSc=null }
      if(live.pb){ const sc=H.h+H.a; if(prevSc!==null&&sc<prevSc)out.down++; prevSc=sc }
    }catch(e){ clearInterval(t); res(Object.assign(out,{err:e.message})) } },60) }));
  await pg.waitForTimeout(800);
  // the box score credits the men the screen showed scoring (the stretch's names kept with the game, d.pn)
  const cr=await pg.evaluate(()=>{ const arr=Object.values(S.played||{}).pop()||[], P=arr[arr.length-1], drives=(P&&P.drives)||[], g=live.g, exp={};
    drives.forEach(d=>(d.pn||[]).forEach(q=>{ const tm=q[0]===0?g.home:g.away, p=SEA.roster[tm][q[2]]; if(!p)return; const e=exp[tm+'|'+p.n]=exp[tm+'|'+p.n]||{t3:0,pts:0}; if(q[1]===3)e.t3++; e.pts+=q[1] }));
    let n=0, mism=0; const ex=[];
    [g.home,g.away].forEach(tm=>SEA.roster[tm].forEach(p=>{ if(!p)return; const e=exp[tm+'|'+p.n]; if(!e)return; n++;
      const gl=p.gl||[], w=glStride(), st={}; if(gl.length>=w){ const o=gl.length-w; (STAT_KEYS[POS[gl[o+5]].p]||[]).forEach((k,i)=>st[k]=gl[o+6+i]) }
      if(st.tpm!==e.t3||st.pts!==e.pts){ mism++; if(ex.length<2)ex.push(`${p.n}: shown ${e.t3} threes ${e.pts} pts, box ${st.tpm} / ${st.pts}`) } }));
    return {kept:drives.filter(d=>Array.isArray(d.pn)).length, n:n, mism:mism, ex:ex} });
  r.credit=cr;
  const ok=!r.err&&r.played>=8&&r.down===0&&r.jump.length===0&&!errs.length&&cr.kept>=8&&cr.n>=8&&cr.mism===0;
  if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${r.played} stretches played back, ${r.samples} samples, score went down ${r.down}, jumps ${JSON.stringify(r.jump.slice(0,2))}, final ${JSON.stringify(r.final)}; box score: ${r.credit.n} scorers named, ${r.credit.mism} differ from the screen ${r.credit.ex.join('; ')}${r.err?' | '+r.err:''}${errs.length?' | '+errs[0]:''}`);
  await pg.close() }
 console.log(bad?'MISMATCH':'MATCH'); await b.close() })();
