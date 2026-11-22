/* Baseball's full match (round 101), in a browser, whole games at Very fast: every inning is played back at-bat by
   at-bat; the page's score never goes down while it plays; each playback starts where the last ended; a call shows the
   score it was asked at (the at-bats before it were played first), and after it the inning plays on from there, not
   from its top; no page errors.   node test/bs-full.js    last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
const DIST=process.env.DIST||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0, T={inn:0,calls:0,mid:0,resumed:0,down:0,jump:0,callOff:0,games:0}; const ex=[]; const errs=[];
 const pg=await b.newPage({viewport:{width:1280,height:800}}); pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('file://'+path.join(DIST,'baseball-coach-pro.html')); await pg.waitForTimeout(300);
 await pg.evaluate(()=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty('Seattle',5,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render() });
 for(let g=0;g<3;g++){
  for(let k=0;k<5;k++){ await pg.evaluate(()=>doAdvance()); await pg.waitForTimeout(200); if(await pg.evaluate(()=>!!live&&!live.done))break }
  const r=await pg.evaluate(()=>new Promise(res=>{ const o={inn:0,calls:0,mid:0,resumed:0,down:0,jump:0,callOff:0,ex:[]}; let lastPb=null, prevSc=null, endOf=null, seenAsk=null;
    const hdr=()=>{ const w=[...document.querySelectorAll('.wtop .wn')].map(e=>+e.textContent); return w.length===2?{a:w[0],h:w[1]}:null };
    const t=setInterval(()=>{ try{
      if(!live){ clearInterval(t); res(o); return }
      if(live.done){ clearInterval(t); res(o); return }
      const H=hdr();
      if(live.ask&&live.ask!==seenAsk){ seenAsk=live.ask; o.calls++; const q=live.ask, h=live.userIsHome?q.mine:q.theirs, a=live.userIsHome?q.theirs:q.mine;
        if(H&&(H.h!==h||H.a!==a)){ o.callOff++; if(o.ex.length<3)o.ex.push(`call at ${a}-${h}, page ${H.a}-${H.h}`) }
        const D=live.eng.partial&&live.eng.partial(); if(D&&D.pl&&D.pl.length)o.mid++;
        answerLive(q.dp.opts[0][0]); prevSc=null; return }
      if(live.pb&&live.pb!==lastPb){ const P=live.pb; lastPb=P; if(!P.d.partial)o.inn++;
        if(P.from>0&&!P.d.partial)o.resumed++;
        if(endOf&&(P.h0!==endOf[0]||P.a0!==endOf[1])){ o.jump++; if(o.ex.length<3)o.ex.push(`jump ${endOf} to ${P.h0},${P.a0}`) }
        const L=P.d.pl[(P.to||P.d.pl.length)-1]; endOf=L&&L.h!=null?[L.h,L.a]:[P.d.sh,P.d.sa]; prevSc=null }
      if(live.pb&&H){ const sc=H.h+H.a; if(prevSc!==null&&sc<prevSc)o.down++; prevSc=sc }
    }catch(e){ clearInterval(t); o.ex.push('error '+e.message); res(o) } },40) }));
  T.games++; Object.keys(T).forEach(k=>{ if(k!=='games')T[k]+=r[k]||0 }); ex.push(...r.ex);
  await pg.waitForTimeout(1500) }
 const ok=T.inn>=24&&T.down===0&&T.jump===0&&T.callOff===0&&T.calls>=3&&T.mid>=1&&T.resumed>=1&&!errs.length&&!ex.some(x=>/^error/.test(x));
 console.log(`${T.games} games: ${T.inn} innings played back, ${T.calls} calls (${T.mid} inside an inning, ${T.resumed} innings resumed after one), score went down ${T.down}, jumps ${T.jump}, calls showing another score ${T.callOff}${ex.length?' | '+ex.slice(0,3).join('; '):''}${errs.length?' | '+errs[0]:''}`);
 console.log(ok?'MATCH':'MISMATCH'); await b.close() })();
