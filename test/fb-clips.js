/* Football's clips show what happened (round 80). In a real browser, a few weeks of live games in both football games:
   every pick with a known return is run back to where the next drive starts, and every punt (round 81); every fourth down they went for and made
   has its own clip ("FIRST DOWN!"); on a touchdown of 20+ yards, defenders are chasing at the end (at least three
   within 8 yards of the scorer; before round 80 they stood near the line).
     node test/fb-clips.js          last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIR=process.env.DIST||path.join(__dirname,'..','dist'); let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
(async()=>{ const b=await chromium.launch();
  for(const [f,team] of [['football-coach.html','Alabama'],['football-coach-pro.html','Kansas City']]){
    const p=await b.newPage(), errs=[]; p.on('pageerror',e=>errs.push(e.message)); await p.goto('file://'+path.join(DIR,f)); await p.waitForTimeout(400);
    const r=await p.evaluate(([team])=>{ newDynasty(team,5,'T'); S.title=false; S.guide=false;
      for(let w=0;w<8;w++){ doAdvance(); let n=0; while(live&&!live.done&&n++<6000){ live.ask?answerLive(live.ask.dp.opts[n%2?0:1][0]):liveTick() } if(live&&live.done&&typeof finishLive==='function')finishLive() }
      const o={picks:0,picksOk:0,conv:0,convClip:0,td:0,tdChased:0,punts:0,puntsOk:0,puntClips:0};
      // where the dots are drawn: catch hlDot's calls during one frame
      const real=hlDot; let dots=[]; window.hlDot=function(x,px,py,r,fill){ dots.push([px,py,fill]); return real.apply(this,arguments) };
      const cv=document.createElement('canvas'); cv.width=1000; cv.height=460; const x=cv.getContext('2d');
      SEA.weeks.forEach(W=>W.games.forEach(g=>{ if(!g.drives)return; g.drives.forEach((d,i)=>{ const cs=HL_SPORT.clips({g,drives:g.drives},d,'key'), ca=HL_SPORT.clips({g,drives:g.drives},d,'all');
        const nx=g.drives[i+1]&&!g.drives[i+1].ot?g.drives[i+1]:null;   // overtime starts at the 25 whatever came before (a punt as regulation ran out)
        if(d.kind==='PUNT'&&nx){ o.punts++; const pc=ca.find(c=>c.kind==='punt'); if(pc){ o.puntClips++; if(pc.end===100-g.drives[i+1].start)o.puntsOk++ } }
        if(d.converted===true&&/converted on fourth and/.test(d.note||"")){ o.conv++; if(cs.some(c=>c.kind==='conv'))o.convClip++ }
        cs.forEach(c=>{
          if(c.kind==='int'&&c.ret!=null&&nx){ o.picks++; if(c.catchY-c.ret===100-g.drives[i+1].start)o.picksOk++ }
          if(c.kind==='td'&&c.len>=20){ o.td++; dots=[]; HL_SPORT.frame(x,1000,460,c,0.86);
            const def=dots.slice(0,11), sc=dots[11+(c.pass?c.rcv:(c.qbRun?0:1))], yd=1000*0.8/120;   // a yard in pixels, about
            if(sc&&def.filter(q=>Math.hypot(q[0]-sc[0],q[1]-sc[1])<8*yd).length>=3)o.tdChased++ } }) }) }));
      window.hlDot=real; return o },[team]);
    ok(r.picks===r.picksOk,`${f}: picks run back to where the next drive starts (${r.picksOk} of ${r.picks})`);
    ok(r.conv===r.convClip,`${f}: fourth downs made have a clip (${r.convClip} of ${r.conv})`);
    ok(r.punts>0&&r.puntClips===r.punts&&r.puntsOk===r.punts,`${f}: every punt plays (every chance) and ends where the next drive starts (${r.puntClips} played, ${r.puntsOk} of ${r.punts} at the spot)`);
    ok(r.td===0||r.tdChased/r.td>=0.8,`${f}: long touchdowns chased (${r.tdChased} of ${r.td})`);
    if(errs.length){ bad++; console.log('  page errors: '+errs.slice(0,2).join(' | ')) } await p.close() }
  await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH football\'s clips show what happened'); process.exit(bad?1:0) })();
