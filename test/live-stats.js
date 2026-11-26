/* round 111: live player stats (Ian: "live player stats"). Per sport: the panel is on the live page in Full match and
   fills as the game plays; at the final whistle its counts add up to the game: basketball's points to the score,
   hockey's and soccer's goals to the score, baseball's hits to the line score's; and mid-game it never counts what the
   field hasn't shown (points above the header's score).   node test/live-stats.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
const ONLY=process.argv[3]; const G0=[['soccer-coach.html','Arsenal','g'],['basketball-coach-pro.html','Orlando','pts'],['basketball-coach.html','Duke','pts'],['hockey-coach-pro.html','Winnipeg','g'],['baseball-coach-pro.html','Houston','h'],['football-coach-pro.html','San Francisco',null]], G=G0.filter(x=>!ONLY||x[0].startsWith(ONLY));
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,t,k] of G){ const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.goto('file://'+path.join(DIST,f)); await p.waitForTimeout(300);
  await p.evaluate(t=>{ newDynasty(t,7,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render() },t);
  for(let i=0;i<6;i++){ if(await p.evaluate(()=>!!live))break; await p.evaluate(()=>doAdvance()); await p.waitForTimeout(300) }
  let panel=false, filled=0, over=0, n=0; const ex=[];
  for(let i=0;i<(f==='soccer-coach.html'?700:250);i++){ await p.waitForTimeout(100);   // soccer: shots are rare, so longer
    const r=await p.evaluate((k)=>{ if(!live||live.done)return null; if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return {skip:1} }
      const el=document.getElementById('lstats'); const wn=[...document.querySelectorAll('.wtop .wn')].map(e=>+e.textContent);
      let T=null; try{ T=HL_SPORT.liveStats(live) }catch(e){ return {err:String(e)} }
      let sum=0; if(k==='pts'||k==='g'){ Object.values(T).forEach(R=>R.forEach(r=>{ const m=k==='pts'?/^(\d+) pts/.exec(r.line):/^(\d+) goals|^goal/.exec(r.line); if(m)sum+=k==='pts'?+m[1]:(m[1]?+m[1]:1) })) }
      return {panel:!!el,filled:el?el.textContent.replace(/—/g,'').length>40:false,sum,hdr:wn.length===2?wn[0]+wn[1]:null} },k);
    if(!r)break; if(r.skip)continue; if(r.err){ ex.push(r.err); break } n++; panel=panel||r.panel; if(r.filled)filled++; if(r.hdr!=null&&(k==='pts'||k==='g')&&r.sum>r.hdr){ over++; if(ex.length<2)ex.push(`stats ${r.sum} over header ${r.hdr}`) } }
  // the whole game: skip to the end, then the totals against the final
  await p.evaluate(()=>{ let n=0; while(live&&!live.done&&n++<5000){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } if(live.timer){clearTimeout(live.timer);live.timer=null} live.pb=null; liveTick() } });
  const fin=await p.evaluate((k)=>{ if(!live)return {err:'no game'}; const g=live.g, T=HL_SPORT.liveStats(live), tot={}; Object.keys(T).forEach(tm=>{ tot[tm]=0; T[tm].forEach(r=>{ let m;
      if(k==='pts'&&(m=/^(\d+) pts/.exec(r.line)))tot[tm]+=+m[1]; else if(k==='g'&&(m=/^(\d+) goals|^goal/.exec(r.line)))tot[tm]+=m[1]?+m[1]:1; else if(k==='h'&&(m=/^(\d+) for/.exec(r.line)))tot[tm]+=+m[1] }) });
    const L=live.drives[live.drives.length-1]||{}; let want=null;
    if(k==='pts'||k==='g'){ const last=live.drives.filter(d=>d.sh!=null||d.h!=null).pop()||{}; want={[g.home]:live.eng&&live.eng.h!=null?live.eng.h:last.sh, [g.away]:live.eng&&live.eng.a!=null?live.eng.a:last.sa} }
    if(k==='h'){ const hh=[0,0]; live.drives.forEach(d=>(d.pl||[]).forEach(q=>{ if(q.t==='pa'&&['s1','s2','s3','hr'].includes(q.o))hh[q.s]++ })); want={[g.home]:hh[0],[g.away]:hh[1]} }
    const rows=Object.values(T).reduce((s,R)=>s+R.length,0); return {tot,want,rows,so:live.drives.some(d=>d.so)} },k);
  let okFin=true, finTxt='';
  if(fin.err){ okFin=false; finTxt=fin.err } else if(fin.want){ const ks=Object.keys(fin.want); okFin=fin.so||ks.every(tm=>fin.tot[tm]===fin.want[tm]); finTxt=ks.map(tm=>`${tm} ${fin.tot[tm]} of ${fin.want[tm]}`).join(', ')+(fin.so?' (shootout: skipped)':'') } else { okFin=fin.rows>4; finTxt=`${fin.rows} men listed` }
  const ok=panel&&filled>0&&over===0&&okFin&&!errs.length&&!ex.some(e=>/Error/.test(e));
  console.log(`  ${ok?'ok  ':'FAIL'} ${f}: panel ${panel?'shown':'MISSING'}, filled in ${filled} of ${n} samples, ahead of the header ${over}; at the end ${finTxt}${ex.length?' ('+ex.join('; ')+')':''}${errs.length?' page error: '+errs[0]:''}`);
  if(!ok)bad++; await p.close() }
 await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH live player stats add up'); process.exit(bad?1:0) })();
