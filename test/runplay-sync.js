/* round 111: the live page never shows a score the field hasn't reached (Muse: "the live scoreboard read 22-10 at 13:02
   while Run of Play already listed 29-13 at 10:00"; Grokbot: the field's score and the header's disagree). Each sport's
   full match at Very fast, sampled ten times a second: the newest Run of play row's score must never be ahead of the
   header's, and the header must agree with the score the field is holding (live.hold) while a stretch plays.
   node test/runplay-sync.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
const G=[['soccer-coach.html','Arsenal'],['hockey-coach-pro.html','Winnipeg'],['basketball-coach-pro.html','Orlando'],['basketball-coach.html','Duke'],['baseball-coach-pro.html','Houston'],['football-coach-pro.html','San Francisco']];
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,t] of G){ const p=await (await b.newContext({viewport:{width:1280,height:800}})).newPage(); await p.goto('file://'+path.join(DIST,f)); await p.waitForTimeout(300);
  await p.evaluate(t=>{ newDynasty(t,7,'T'); S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='rapid'; render() },t);
  for(let k=0;k<6;k++){ if(await p.evaluate(()=>!!live))break; await p.evaluate(()=>doAdvance()); await p.waitForTimeout(300) }
  let n=0, ahead=0, off=0; const ex=[];
  for(let i=0;i<450;i++){ await p.waitForTimeout(100);
    const r=await p.evaluate(()=>{ if(!live||live.done)return null; if(live.ask){ answerLive(live.ask.dp.opts[0][0]); return {skip:1} }
      const wn=[...document.querySelectorAll('.wtop .wn')].map(e=>+e.textContent); if(wn.length!==2)return {skip:1};
      const row=document.querySelector('.plays .pscore'); let rs=null; if(row){ const m=/(\d+)\D+(\d+)/.exec(row.textContent); if(m)rs=[+m[1],+m[2]] }
      const H=live.hold&&live.pb&&!live.done?[live.hold.a,live.hold.h]:null;
      return {hdr:wn,row:rs,hold:H} });
    if(!r)break; if(r.skip)continue; n++;
    if(r.row&&r.row[0]+r.row[1]>r.hdr[0]+r.hdr[1]){ ahead++; if(ex.length<2)ex.push(`run of play ${r.row.join('-')}, header ${r.hdr.join('-')}`) }
    if(r.hold&&(r.hold[0]!==r.hdr[0]||r.hold[1]!==r.hdr[1])){ off++; if(ex.length<4)ex.push(`field ${r.hold.join('-')}, header ${r.hdr.join('-')}`) } }
  const ok=n>20&&ahead===0&&off<=Math.max(1,n*0.02);
  console.log(`  ${ok?'ok  ':'FAIL'} ${f}: ${n} samples; run of play ahead of the header ${ahead}; header off the field's score ${off}${ex.length?' ('+ex.join('; ')+')':''}`);
  if(!ok)bad++; await p.close() }
 await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH the page shows the score the field has reached'); process.exit(bad?1:0) })();
