/* Soccer's full match touch by touch (round 103), in a browser: two whole games at Very fast. The box score's assists
   are the passes the screen showed into each goal (the man named, none for a penalty or a partner without a name);
   paused, the picture holds still (a frame is drawn from the stretch and the clock, not the wall clock); the play
   between the shots is drawn (the touch plan, not the old passing-about); no page errors.
     node test/sc-watch.js     last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
const DIST=process.env.DIST||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const team of ['Arsenal','Liverpool']){
  const pg=await b.newPage({viewport:{width:1280,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.join(DIST,'soccer-coach.html')); await pg.waitForTimeout(300);
  await pg.evaluate(t=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty(t,5,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render() },team);
  for(let k=0;k<6;k++){ await pg.evaluate(()=>doAdvance()); await pg.waitForTimeout(200); if(await pg.evaluate(()=>!!live&&!live.done))break }
  // a pause partway: the canvas twice, half a second apart
  let still=null;
  const r=await pg.evaluate(()=>new Promise(res=>{ const o={plan:0,samples:0}; let paused=false;
    const t=setInterval(()=>{ try{
      if(!live){ clearInterval(t); res(o); return }
      if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return }
      if(live.done){ clearInterval(t); res(o); return }
      if(live.pb&&live.pb.d&&live.pb.d._sp)o.plan++; o.samples++;
      if(!paused&&live.pb&&live.pb.d&&live.pb.d.seg>=3&&!live.ask&&typeof HL!=='undefined'&&!HL.cur){ paused=true; clearInterval(t); res(Object.assign(o,{pausedAt:live.pb.d.seg})) }
    }catch(e){ clearInterval(t); res(Object.assign(o,{err:e.message})) } },40) }));
  if(r.pausedAt!=null){ await pg.evaluate(()=>{ live.paused=true; if(live.pb&&live.pb.frozen==null)live.pb.frozen=Date.now()-live.pb.at }); await pg.waitForTimeout(400);
    const a=await pg.evaluate(()=>document.querySelector('canvas.hlcv').toDataURL()); await pg.waitForTimeout(600); const z=await pg.evaluate(()=>document.querySelector('canvas.hlcv').toDataURL()); still=a===z;
    await pg.evaluate(()=>{ live.paused=false; if(live.pb&&live.pb.frozen!=null){ live.pb.at=Date.now()-live.pb.frozen; live.pb.frozen=null } liveTick() }) }
  const r2=await pg.evaluate(()=>new Promise(res=>{ const t=setInterval(()=>{ try{ if(!live){ clearInterval(t); res({}); return } if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return } if(live.done){ clearInterval(t); res({final:[live.eng.h,live.eng.a]}) } }catch(e){ clearInterval(t); res({err:e.message}) } },40) }));
  await pg.waitForTimeout(800);
  const cr=await pg.evaluate(()=>{ const arr=Object.values(S.played||{}).pop()||[], P=arr[arr.length-1], drives=(P&&P.drives)||[], g=live.g, out={goals:0,shownA:0,named:0,mism:0,ex:[],kept:0};
    drives.forEach(d=>{ if(Array.isArray(d.pn))out.kept++; (d.ev||[]).forEach(e=>{ if(e.k==='goal')out.goals++ }) });
    [[0,g.home],[1,g.away]].forEach(([sd,tm])=>{ const R=SEA.roster[tm], want={};
      drives.forEach(d=>(d.pn||[]).forEach(q=>{ if(q[0]===sd&&q[1]==='a'){ out.shownA++; if(q[2]>=0&&R[q[2]]){ out.named++; const n=R[q[2]].n; want[n]=(want[n]||0)+1 } } }));
      // the scorer can't assist himself: a pass from the scorer's own dot isn't counted (the box drops it too)
      const w=glStride(); R.forEach(p=>{ if(!p)return; const gl=p.gl||[]; if(gl.length<w)return; const o=gl.length-w, pos=POS[gl[o+5]].p, keys=STAT_KEYS[pos]||[], st={}; keys.forEach((k,i)=>st[k]=gl[o+6+i]); if(!('ast' in st))return;
        const exp=want[p.n]||0; if(st.ast!==exp&&!(st.ast<exp)){ out.mism++; if(out.ex.length<3)out.ex.push(`${tm} ${p.n}: shown ${exp}, box ${st.ast}`) } else if(st.ast<exp){ out.mism++; if(out.ex.length<3)out.ex.push(`${tm} ${p.n}: shown ${exp}, box ${st.ast}`) } }) });
    return out });
  const ok=!r.err&&!r2.err&&!errs.length&&r.plan>0&&still!==false&&cr.mism===0&&cr.shownA===cr.goals;
  if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${team}: final ${JSON.stringify(r2.final)}, ${cr.goals} goals, ${cr.shownA} with the pass shown (${cr.named} from a named man), box assists differ ${cr.mism}${cr.ex.length?' ('+cr.ex.join('; ')+')':''}; touch plan drawn ${r.plan} of ${r.samples} looks; paused at stretch ${r.pausedAt}: picture ${still===null?'not checked':still?'held still':'MOVED'}${r.err||r2.err?' | '+(r.err||r2.err):''}${errs.length?' | '+errs[0]:''}`);
  await pg.close() }
 console.log(bad?'MISMATCH':'MATCH'); await b.close() })();
