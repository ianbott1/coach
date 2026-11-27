/* round 111: baseball's full match shows the race the log decided (Ian: "a groundout where the runner was clearly
   safe", "a single no fielder gets to", "a sac fly with no tag"). Plays every at-bat of a few games frame by frame from
   what is drawn (drawPos: the fielders, the men, the ball) and checks:
   - a ground ball out at first: the ball is in the covering man's hands at the bag before the batter gets there;
   - a hit: an outfielder gets to the ball (within 2 m of it) before it's thrown back in;
   - a sac fly: the runner from third is on the bag until the catch, then crosses the plate before the ball gets there;
   - every pitch: some bend (breaking balls), runners stand off their bases when the pitch is thrown (leads);
   - wall seconds per game minute of a real game: Slow plays the plays in real time.
   node test/bs-plays.js [dist]   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
const DIST=process.argv[2]||path.join(__dirname,'..','dist');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1000,height:700}}); await p.goto('file://'+path.join(DIST,'baseball-coach-pro.html')); await p.waitForTimeout(300);
  const R=await p.evaluate(()=>{ newDynasty('Seattle',5,'T'); S.title=false; S.guide=false; S.highlights='off'; S.watchSpeed='slow'; render();
    const c=document.createElement('canvas'); c.width=1000; c.height=620; const x=c.getContext('2d');
    const out={go:0,goBad:0,goWorst:-9,hit:0,hitBad:0,hitWorst:0,sf:0,sfBad:[],pitches:0,bent:0,leadOn:0,leadN:0,wall:0,err:[]};
    const MX=167, MY=103.5, dm=(a,b)=>Math.hypot((a[0]-b[0])*MX,(a[1]-b[1])*MY), B1=[0.62,0.72], B3=[0.38,0.72], HP=[0.5,0.9];
    for(let gm=0;gm<3;gm++){ live=null; for(let k=0;k<6&&!live;k++)doAdvance(); if(!live)break; let n=0; while(live&&!live.done&&n++<5000){ if(live.ask){ answerLive(live.ask.dp.opts[0][0]); continue } liveTick() }
      live.done=false; live.hold=null; const D=live.drives.filter(d=>Array.isArray(d.pl)&&d.pl.length);
      D.forEach(d=>{ const ms=HL_SPORT.playback(live,d); out.wall+=ms; live.pb={d,at:0,ms,frozen:0,h0:0,a0:0}; const it=d._pb;
        it.P.forEach((C,ci)=>{ if(!C.G)return; const q=C.q, G=C.G, frame=t=>{ const T=C.at+C.tc+t; live.pb.frozen=T/it.tot*ms; try{ HL_SPORT.idle(x,1000,620) }catch(e){ out.err.push(String(e)) } return HL_SPORT.drawPos() };
          const bd=(q.post||[]).indexOf(q.nm)+1;
          // the pitches: the last one's flight, bent or straight; runners off their bags at release
          for(let j=0;j<C.ps.length;j++){ const PS=6+0.8+0.5+1.5, pt0=j<C.nPre?j*PS:C.nPre*PS, rel=6+0.8; const pts=[0.1,0.3,0.5].map(s=>{ live.pb.frozen=(C.at+pt0+rel+s*0.43)/it.tot*ms; HL_SPORT.idle(x,1000,620); return (HL_SPORT.drawPos()||{}).ball });
            if(pts.every(Boolean)){ out.pitches++; const mid=(pts[0][0]+pts[2][0])/2; if(Math.abs(pts[1][0]-mid)*MX>0.12)out.bent++ }
            live.pb.frozen=(C.at+pt0+rel+0.2)/it.tot*ms; HL_SPORT.idle(x,1000,620); const P=HL_SPORT.drawPos(); if(P)P.r.forEach(m=>{ if(m.nm==='#box'||m.nm===q.nm)return; out.leadN++; const onBag=[B1,[0.5,0.54],B3].some(bb=>dm(bb,m.p)<1); if(!onBag)out.leadOn++ }) }
          if(q.o==='out'&&!q.dp&&!q.sf&&bd<=0&&G.legs.length&&G.legs[0][4]===0&&G.tO){ out.go++;   // a ground ball out at first
            // when the batter reaches the bag (4.3 s), the ball must already be at it
            const P=frame(4.25); const lead=P&&P.ball?dm(P.ball,B1):99; if(lead>1.5){ out.goBad++; if(out.err.length<3)out.err.push("GO "+JSON.stringify({tO:G.tO,legs:G.legs,ball:P&&P.ball,t:P&&P.t,ci:P&&P.ci,me:ci}))} out.goWorst=Math.max(out.goWorst,G.tO-4.3) }
          if(['s1','s2','s3'].includes(q.o)){ out.hit++; const T0=G.legs.length>1?G.legs[G.legs.length-1][0]-0.35:0; const P=frame(T0); let best=99; if(P&&P.ball)P.f.forEach((f,i)=>{ if(i>=6)best=Math.min(best,dm(f,P.ball)) }); if(best>2)out.hitBad++; out.hitWorst=Math.max(out.hitWorst,best) }
          if(q.sf){ out.sf++; const th=G.legs[0][1], third=(q.pre||[])[2]; const before=frame(th-0.3), after=frame(th+0.2);
            const at=(P,nm)=>P&&P.r.find(m=>m.nm===nm); const a=at(before,third), bb=at(after,third);
            if(!a||dm(a.p,B3)>0.6)out.sfBad.push('left early '+(a?dm(a.p,B3).toFixed(1):'gone'));
            const tH=th+27.4/7.6, P2=frame(tH-0.05), ballAt=P2&&P2.ball?dm(P2.ball,HP):0; if(ballAt<2)out.sfBad.push('ball home first') } }) }) }
    out.games=3; return out });
  let bad=0; const ok=(c,m)=>{ console.log(`  ${c?'ok  ':'FAIL'} ${m}`); if(!c)bad++ };
  ok(!R.err.length,`no errors drawing (${R.err.length}${R.err.length?': '+R.err[0]:''})`);
  ok(R.go>10&&R.goBad===0,`ground ball outs at first: the ball at the bag before the batter in ${R.go-R.goBad} of ${R.go} (the throw ${(-R.goWorst).toFixed(2)} s ahead at the closest)`);
  ok(R.hit>10&&R.hitBad===0,`hits: an outfielder on the ball before the throw back in ${R.hit-R.hitBad} of ${R.hit} (furthest ${R.hitWorst.toFixed(1)} m)`);
  ok(R.sfBad.length===0,`sac flies: the runner tags and beats the throw in ${R.sf-R.sfBad.length} of ${R.sf}${R.sfBad.length?' ('+R.sfBad.join(', ')+')':''}`);
  ok(R.bent/R.pitches>0.2&&R.bent/R.pitches<0.5,`pitches that bend: ${R.bent} of ${R.pitches} (${(100*R.bent/R.pitches).toFixed(0)}%)`);
  ok(R.leadOn/R.leadN>0.95,`runners off the bag as the pitch is thrown: ${R.leadOn} of ${R.leadN}`);
  console.log(`  Slow: ${(R.wall/1000/60/R.games).toFixed(0)} minutes a game on screen`);
  await b.close(); console.log(bad?`MISMATCH ${bad}`:'MATCH the plays as the log has them'); process.exit(bad?1:0) })();
