/* Football's full match (round 101), in a browser at Very fast, both leagues. Every drive is played snap by snap:
   the plays come to exactly the spot the drive engine gave (each series that moves the chains crosses the line to
   gain, the ones before don't; a drive that ends in a kick, a punt or a turnover on downs fails on third down and
   leaves a fourth down); the drives the screen showed keep their plays with the game (d.pn) and the box score credits
   them: in a game watched start to finish the passer's completions, attempts and yards, the back's carries and yards
   and each receiver's catches and yards are the plays shown. A game skipped partway keeps no plays for the drives it
   skipped. No page errors.   node test/fb-full.js    last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
const DIST=process.env.DIST||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,team,skipAt] of [['football-coach-pro.html','Denver',0],['football-coach.html','Alabama',0],['football-coach-pro.html','Seattle',6]]){
  const pg=await b.newPage({viewport:{width:1280,height:800}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.join(DIST,f)); await pg.waitForTimeout(300);
  await pg.evaluate(t=>{ try{localStorage.setItem('coach-guide-seen','{"__off":1}')}catch(e){} newDynasty(t,5,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render() },team);
  for(let k=0;k<5;k++){ await pg.evaluate(()=>doAdvance()); await pg.waitForTimeout(200); if(await pg.evaluate(()=>!!live))break }
  const r=await pg.evaluate(skipAt=>new Promise(res=>{ const out={drivesClips:0,down:0,skipped:null,samples:0,started:[]}; let prev=null, skipN=null;
    // which drives the screen started a clip for (the clip names its drive)
    out.leads=[]; const lu=HL_SPORT.leadUp; HL_SPORT.leadUp=function(L,r){ const U=lu.apply(this,arguments); if(U){ const k=live.drives.length; if(out.started.indexOf(k)<0)out.started.push(k) } if(U)out.leads.push({key:U.key,plays:(U.clips[0].plays||[]).map(p=>[p.t,p.g,p.from]),ask:r&&r.ask&&r.ask.h}); return U };
    const o=window.hlStart; window.hlStart=function(c){ try{ const k=live&&c&&c.d?live.drives.indexOf(c.d):-1; if(k>=0&&out.started.indexOf(k)<0)out.started.push(k) }catch(e){} return o.apply(this,arguments) };
    const hdr=()=>{ const w=[...document.querySelectorAll('.wtop .wn')].map(e=>+e.textContent); return w.length===2?w[0]+w[1]:null };
    const t=setInterval(()=>{ try{
      if(!live){ clearInterval(t); res(Object.assign(out,{err:'no live'})); return }
      if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return }
      if(live.done){ clearInterval(t); out.final=[live.eng.h,live.eng.a]; res(out); return }
      // skip from here to the end (Skip runs on to the next call; after each call, skip again): the drives it runs through
      if(skipAt&&live.drives.length>=skipAt){ const a=live.drives.length; skipN=a; skipLive(); const z=live.drives.length; if(z>a){ out.skipped=out.skipped||[]; for(let k=a;k<z;k++)out.skipped.push(k) } return }
      if(typeof HL!=="undefined"&&HL.cur&&HL.cur.kind==="drive")out.drivesClips++;
      const sc=hdr(); if(sc!=null){ out.samples++; if(prev!=null&&sc<prev)out.down++; prev=sc }
    }catch(e){ clearInterval(t); res(Object.assign(out,{err:e.message})) } },50) }),skipAt);
  await pg.waitForTimeout(800);
  const cr=await pg.evaluate(leads=>{ const arr=Object.values(S.played||{}).pop()||[], P=arr[arr.length-1], drives=(P&&P.drives)||[], g=live.g;
    const L={g:g,drives:drives}, out={withPn:0,real:0,sumBad:0,kept:[],box:[],mism:0,ex:[]};
    drives.forEach((d,k)=>{ if(d.start==null)return; out.real++; if(Array.isArray(d.pn)){ out.withPn++; out.kept.push(k) }
      const Q=HL_SPORT.playsFor(L,d); if(Q){ const s=Q.plays.reduce((t,p)=>t+p.g,Q.start); if(s!==Q.end)out.sumBad++ } });
    // the box against the plays, for a side whose every drive was shown
    const rows=driveScript(g,drives);
    [[true,g.home],[false,g.away]].forEach(([home,tm])=>{ const own=drives.filter(d=>d.home===home&&d.start!=null); if(!own.length||own.some(d=>!Array.isArray(d.pn)))return;
      const R=SEA.roster[tm], e={cmp:0,att:0,pyd:0}, per={};
      const add=(ri,k,v)=>{ if(ri==null||ri<0||!R[ri])return; const n=R[ri].n; per[n]=per[n]||{}; per[n][k]=(per[n][k]||0)+v };
      own.forEach(d=>{ const w=rows[drives.indexOf(d)]&&rows[drives.indexOf(d)].who; d.pn.forEach(q=>{ const t=q[0], td=t===5||t===6, y=td&&w&&w.y!=null?w.y:q[2], ri=td?(w?w.i:-1):q[1];
        if(t===1||t===5){ e.cmp++; e.att++; e.pyd+=y; add(ri,'rec',1); add(ri,'cyd',y) } else if(t===2||t===7)e.att++; else if(t===0||t===6){ add(ri,'car',1); add(ri,'ryd',y) } }) });
      const w=glStride(), line=p=>{ const gl=p.gl||[], st={}; if(gl.length>=w){ const o=gl.length-w; (STAT_KEYS[POS[gl[o+5]].p]||[]).forEach((k,i)=>st[k]=gl[o+6+i]) } return st };
      R.forEach((p,i)=>{ if(!p)return; const st=line(p), pos=POS[i%POS.length].p;
        const chk=(k,v)=>{ if(st[k]==null)return; out.box.push(k); if(st[k]!==v){ out.mism++; if(out.ex.length<4)out.ex.push(`${tm} ${p.n} ${k}: shown ${v}, box ${st[k]}`) } };
        if(pos==='QB'&&st.att){ chk('cmp',e.cmp); chk('att',e.att); chk('pyd',e.pyd) }
        if(pos==='RB'&&st.car!=null&&i===1){ chk('car',(per[p.n]||{}).car||0); chk('ryd',(per[p.n]||{}).ryd||0) }
        if((pos==='WR'||pos==='WR2')&&st.rec!=null&&i<POS.length){ chk('rec',(per[p.n]||{}).rec||0); chk('cyd',(per[p.n]||{}).cyd||0) } }) });
    // the drive up to each call, shown before it was asked, is how the drive itself begins
    out.leads=leads.length; out.leadBad=[];
    leads.forEach(u=>{ const d=drives.find(x=>x.n===u.key.n&&x.start===u.key.start); const Q=d&&HL_SPORT.playsFor(L,d);
      if(!Q){ out.leadBad.push('no drive '+u.key.n); return } const pre=Q.plays.slice(0,u.plays.length).map(p=>[p.t,p.g,p.from]);
      if(JSON.stringify(pre)!==JSON.stringify(u.plays))out.leadBad.push(`drive ${u.key.n} (${d.kind}): lead-up ${JSON.stringify(u.plays)} vs ${JSON.stringify(pre)}`) });
    return out },r.leads);
  // the drives that kept plays are exactly the ones the screen started; a skip leaves some unshown
  const st=new Set(r.started), same=cr.kept.length===st.size&&cr.kept.every(k=>st.has(k));
  let skipOk=same; if(skipAt&&(!r.skipped||!r.skipped.some(k=>!st.has(k))))skipOk=false;
  const full=!skipAt;
  const ok=!r.err&&!errs.length&&cr.leadBad.length===0&&r.down===0&&cr.sumBad===0&&r.drivesClips>0&&same&&(full?cr.withPn>=cr.real-1&&cr.box.length>=6&&cr.mism===0:skipOk&&cr.withPn<cr.real);
  if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f} (${team}${skipAt?', skipped after drive '+skipAt:''}): ${cr.withPn} of ${cr.real} drives kept their plays, plays off the engine's spot ${cr.sumBad}, score went down ${r.down}, final ${JSON.stringify(r.final)}; ${cr.leads} calls shown with the drive up to them${cr.leadBad.length?' MISMATCH '+cr.leadBad[0]:''}; kept plays exactly where a clip started: ${same}; box ${cr.box.length} figures checked, ${cr.mism} differ ${cr.ex.join('; ')}${skipAt?`; ${(r.skipped||[]).length} drives skipped [${(r.skipped||[]).join(",")}], kept plays only where shown: ${skipOk}`:''}${r.err?' | '+r.err:''}${errs.length?' | '+errs[0]:''}`);
  await pg.close() }
 console.log(bad?'MISMATCH':'MATCH'); await b.close() })();
