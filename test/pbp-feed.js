/* round 111: every sport's full match keeps a play by play (Ian: "a synced, named play-by-play log in every sport").
   Per sport: a game played back frame by frame on its full match; the feed must fill as it plays (lines only once their
   moment has been drawn: none waiting at the stretch's start), name men, and the live page must show the panel.
   node test/pbp-feed.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
const G=[['soccer-coach.html','Arsenal'],['hockey-coach-pro.html','Boston'],['basketball-coach-pro.html','Orlando'],['basketball-coach.html','Duke'],['baseball-coach-pro.html','Seattle'],['football-coach-pro.html','Kansas City'],['football-coach.html','Alabama']];
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,team] of G){ const p=await b.newPage({viewport:{width:1100,height:800}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.goto('file://'+path.join(DIST,f)); await p.waitForTimeout(300);
  const R=await p.evaluate(async(t)=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    try{ newDynasty(t,5,'T') }catch(e){ return {err:'newDynasty '+e.message} } S.title=false; S.guide=false; S.highlights='full'; S.watchSpeed='normal'; render();
    for(let k=0;k<8&&!live;k++)doAdvance(); if(!live)return {err:'no live game'};
    const panel=!!document.getElementById('pbp');
    let n=0; while(live&&!live.done&&n++<5000){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } liveTick() }
    live.done=false; live.hold=null; live.feed=[]; live.feedK={};
    const c=document.createElement('canvas'); c.width=1000; c.height=600; const x=c.getContext('2d'); const early=[];
    const D=live.drives.slice(0,6); let frames=0;
    for(const d of D){
      if(HL_SPORT.evPB&&typeof d.seg==='number'&&typeof hlEvPlan==='function'&&!HL_SPORT.playback.length){}
      let ms=0, ev=!!(HL_SPORT.evPB&&typeof d.seg==='number'&&!d.ot);
      if(ev){ const P=hlEvPlan(live,d); ms=P.tot } else if(typeof HL_SPORT.playback==='function'&&HL_SPORT.playback!==undefined&&!HL_SPORT.drivePos)ms=HL_SPORT.playback(live,d);
      if(HL_SPORT.drivePos){ // football: its drives are clips
        let cl=[]; try{ cl=HL_SPORT.clips(live,d,'full')||[] }catch(e){} for(const cc of cl){ for(let tt=0;tt<=1;tt+=0.004){ hlFeedT=0; HL_SPORT.frame(x,1000,600,cc,tt); frames++ } } continue }
      if(!ms)continue; live.pb={d,at:0,ms,frozen:0,h0:0,a0:0};
      const n0=(live.feed||[]).length; hlFeedT=0; live.pb.frozen=0; if(ev)hlEvDraw(x,1000,600); else HL_SPORT.idle(x,1000,600); if((live.feed||[]).length>n0+1)early.push((live.feed.length-n0)+' lines at the start of a stretch');
      for(let el=0;el<ms;el+=Math.max(16,ms/600)){ live.pb.frozen=el; hlFeedT=0; if(ev)hlEvDraw(x,1000,600); else HL_SPORT.idle(x,1000,600); frames++ } }
    const F=live.feed||[]; live.done=true; live.pb=null;
    return {panel,lines:F.length,named:F.filter(l=>/[A-Z][a-z]+/.test(l.text)).length,sample:F.slice(0,3).map(l=>l.m+' '+l.team+': '+l.text),early,frames} },team);
  if(R.err){ console.log(`  FAIL ${f}: ${R.err}`); bad++; await p.close(); continue }
  const ok=R.panel&&R.lines>=8&&R.named/R.lines>0.85&&!R.early.length&&!errs.length;
  console.log(`  ${ok?'ok  ':'FAIL'} ${f}: panel ${R.panel?'shown':'MISSING'}, ${R.lines} lines (${R.named} naming a man)${R.early.length?', '+R.early[0]:''}${errs.length?', page error: '+errs[0]:''}`);
  R.sample.forEach(s=>console.log('         '+s)); if(!ok)bad++; await p.close() }
 await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH every sport keeps a play by play'); process.exit(bad?1:0) })();
