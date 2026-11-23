/* Soccer's and hockey's full match (round 101), in a browser, a whole game each at Very fast: every stretch is played
   back on a running clock; the page's score never goes down while it plays; each stretch starts where the last ended;
   every goal shows at its own minute (the header's clock when the score moves is the goal's minute); every shot shown is
   its shooter's in the box score; the header's label keeps one clock; no page errors.   node test/ev-full.js    last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
const DIST=process.env.DIST||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,team] of [['soccer-coach.html','Arsenal'],['hockey-coach-pro.html','Vegas']]){
  const pg=await b.newPage({viewport:{width:1280,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.join(DIST,f)); await pg.waitForTimeout(300);
  await pg.evaluate(t=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty(t,5,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render() },team);
  for(let k=0;k<6;k++){ await pg.evaluate(()=>doAdvance()); await pg.waitForTimeout(200); if(await pg.evaluate(()=>!!live&&!live.done))break }
  const r=await pg.evaluate(()=>new Promise(res=>{ const o={played:0,down:0,jump:0,goals:0,atMinute:0,offMinute:[],ex:[],lab:0,labBad:null}; let lastPb=null, prev=null, endOf=null;
    const t=setInterval(()=>{ try{
      if(!live){ clearInterval(t); res(o); return }
      if(live.ask){ answerLive(live.ask.dp.opts[0][0]); prev=null; return }
      if(live.done){ clearInterval(t); o.final=[live.eng.h,live.eng.a]; res(o); return }
      const P=live.pb; if(!P||!live.hold)return;
      if(P!==lastPb){ lastPb=P; o.played++; if(endOf&&(P.h0!==endOf[0]||P.a0!==endOf[1])){ o.jump++; if(o.ex.length<3)o.ex.push(`jump ${endOf} to ${P.h0},${P.a0}`) } endOf=[P.d.sh,P.d.sa]; prev=null }
      const H=live.hold, sc=H.h+H.a;
      // the header's label: one clock and one "at home" / "on the road" (hockey's clock has its own dot; round 101 piled them up)
      { const lb=document.querySelector('.wtop .wlabel'), tx=lb?lb.textContent.replace(/\s+/g,' ').trim():''; if(tx){ o.lab++; const n=(tx.match(/·/g)||[]).length; if(n>(LEAGUE.id==='nhl'?2:1)&&!o.labBad)o.labBad=tx } }
      if(prev){ if(sc<prev.sc)o.down++;
        if(sc>prev.sc){ o.goals++; const mins=(P.d.ev||[]).filter(e=>e.k==="goal").map(e=>e.m), m=+(String(H.clock||"").match(/(\d+)'/)||[])[1];
          if(mins.includes(m))o.atMinute++; else o.offMinute.push([H.clock,mins]) } }
      prev={sc:sc};
    }catch(e){ clearInterval(t); o.ex.push('error '+e.message); res(o) } },30) }));
  await pg.waitForTimeout(800);
  // the box score: each shot the screen showed is its shooter's (the shots kept with the game, d.pn)
  const cr=await pg.evaluate(()=>{ const arr=Object.values(S.played||{}).pop()||[], P=arr[arr.length-1], drives=(P&&P.drives)||[], g=live.g, shown={}; let n=0;
    drives.forEach(d=>(d.pn||[]).forEach(q=>{ const tm=q[0]===0?g.home:g.away, p=SEA.roster[tm][q[2]]; if(!p)return; n++; shown[tm+'|'+p.n]=(shown[tm+'|'+p.n]||0)+1 }));
    let short=0, players=0; const ex=[], key=LEAGUE.id==="nhl"?"sog":"shots";
    Object.keys(shown).forEach(k=>{ const [tm,nm]=k.split('|'), p=SEA.roster[tm].find(x=>x&&x.n===nm); if(!p)return; players++;
      const gl=p.gl||[], w=glStride(), st={}; if(gl.length>=w){ const o=gl.length-w; (STAT_KEYS[POS[gl[o+5]].p]||[]).forEach((kk,i)=>st[kk]=gl[o+6+i]) }
      if((st[key]||0)<shown[k]){ short++; if(ex.length<2)ex.push(`${nm}: shown ${shown[k]}, box ${st[key]||0}`) } });
    return {n:n,players:players,short:short,ex:ex,kept:drives.filter(d=>Array.isArray(d.pn)).length} });
  r.cr=cr;
  const ok=r.played>=12&&r.down===0&&r.jump===0&&r.goals>=2&&r.offMinute.length===0&&!errs.length&&!r.ex.some(x=>/^error/.test(x))&&cr.n>=20&&cr.short===0&&r.lab>20&&!r.labBad;
  if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${r.played} stretches played back, ${r.goals} goals seen, ${r.atMinute} at their minute${r.offMinute.length?', off: '+JSON.stringify(r.offMinute.slice(0,3)):''}, score went down ${r.down}, jumps ${r.jump}, final ${JSON.stringify(r.final)}; box score: ${r.cr.n} shots shown (${r.cr.players} shooters), ${r.cr.short} short ${r.cr.ex.join('; ')}; header label read ${r.lab} times${r.labBad?', MISMATCH: '+r.labBad.slice(0,80):', one clock'}${r.ex.length?' | '+r.ex.join('; '):''}${errs.length?' | '+errs[0]:''}`);
  await pg.close() }
 console.log(bad?'MISMATCH':'MATCH'); await b.close() })();
