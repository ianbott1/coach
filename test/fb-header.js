/* Football's full match: the header and the line under the field name the drive that's on the field (round 107; Muse,
   Nov 23: the header and "started own N" ran a drive behind, the clock went missing while plays ran, "own 55" past
   midfield). Plays the opener in Chromium at Very fast on Full match, sampling every 0.7s while a drive plays: the
   header names that drive and carries a clock, the line under the field names its team, and no yard line reads past 50.
     node test/fb-header.js [football-coach.html|football-coach-pro.html]      last line MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const files=process.argv[2]?[process.argv[2]]:['football-coach.html','football-coach-pro.html'];
(async()=>{ const b=await chromium.launch(); let bad=0;
  for(const f of files){ const p=await b.newPage({viewport:{width:1600,height:1000}}), errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file://'+path.join(__dirname,'..','dist',f)); await p.waitForTimeout(500);
    await p.evaluate(()=>{ newDynasty(LEAGUE.id==='cfb'?'Pittsburgh':'Denver',189324,'T'); S.title=false; S.watchMode='always'; S.highlights='full'; S.watchSpeed='veryfast'; save(); render(); doAdvance() });
    let n=0,bh=0,nc=0,bf=0,past=0; const ex=[];
    for(let i=0;i<150;i++){ await p.waitForTimeout(700);
      const r=await p.evaluate(()=>{ if(!live)return null; if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return {ask:1} }
        const f=document.querySelector('.fpos'), c=typeof HL!=='undefined'&&HL.cur, wl=document.querySelector('.wlabel');
        return {hd:wl&&wl.textContent.replace(/\s+/g,' ').trim(),cl:c&&c.hd,foot:f&&f.textContent.replace(/\s+/g,' ').trim(),k:c&&c.kind,tm:c&&c.tm,done:live.done} });
      if(!r||r.ask)continue; if(r.done)break; if(/own (5[1-9]|[6-9]\d)/.test(r.foot||''))past++;
      if(r.k!=='drive')continue; n++;
      const dn=(r.cl||'').match(/drive \d+/), hn=(r.hd||'').match(/drive \d+/);
      if(!dn||!hn||dn[0]!==hn[0]){ bh++; if(ex.length<3)ex.push(`header "${r.hd}" while ${r.cl} plays`) }
      if(!/OT|\d:\d\d/.test(r.hd||''))nc++;
      if((r.foot||'').indexOf(r.tm)!==0){ bf++; if(ex.length<3)ex.push(`"${r.foot}" while ${r.tm}'s drive plays`) } }
    const ok=n>=20&&!bh&&!nc&&!bf&&!past&&!errs.length; if(!ok)bad++;
    console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${n} samples of a drive playing; header on another drive ${bh}, header without a clock ${nc}, line under the field on another team ${bf}, "own" past 50 ${past}${ex.length?'; e.g. '+ex.join('; '):''}${errs.length?'; page errors: '+errs.slice(0,2).join(' | '):''}`);
    await p.close() }
  await b.close(); console.log(bad?`MISMATCH ${bad} game(s)`:'MATCH the header and the field line follow the drive on the field'); process.exit(bad?1:0) })();
