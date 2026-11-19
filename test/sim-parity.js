/* Ian's rule (round 43): simming, or leaving every call to your assistant, should do about what the computer coaches
   do; only good calls should beat it. Even sides, the same dice: the home side coached by the computer, then by you
   with every call left to your assistant. Football was +9 points a game for doing nothing (a fourth down re-rolled
   after a miss; reads the assistant made with no downside). Within 2.5 points in every game (sampling noise at 6000 games is about 1).
     node test/sim-parity.js [games=6000]   last line: MATCH or MISMATCH */
const {load}=require('./harness.js'), path=require('path'); const N=+(process.argv[2]||6000); let bad=0;
for(const f of ['football-coach.html','football-coach-pro.html','basketball-coach.html','basketball-coach-pro.html','hockey-coach-pro.html','soccer-coach.html','baseball-coach-pro.html']){
  const G=load({file:path.join(__dirname,'..','dist',f),expose:['makeLiveGame','RNG']}); let cpu=0, asst=0;
  for(let i=0;i<N;i++){ for(const hum of [false,true]){ const e=G.makeLiveGame(new G.RNG((11+i*7919)>>>0),1500,1500,'balanced','balanced',{home:hum,away:false},false,{seed:i});
      let r,g=0; while(g++<3000){ r=e.next(); if(r.done)break; if(r.ask){ const o=r.ask.opts; const a=o.find(x=>/assistant/i.test(x[1]))||o[o.length-1]; e.reply(a[0]) } }
      const s=r.h>r.a?1:r.h===r.a?0.5:0; if(hum)asst+=s; else cpu+=s } }
  const d=100*(asst-cpu)/N, ok=Math.abs(d)<=2.5; if(!ok)bad++;   // ~2.5 standard errors at 6000 games (hockey read -2.3 at 4000, -0.4 at 12000); round 53: the count was inside the comment, so a FAIL still read MATCH
  console.log(`${f.padEnd(26)} computer ${(100*cpu/N).toFixed(1)}%  your assistant ${(100*asst/N).toFixed(1)}%  (${d>=0?'+':''}${d.toFixed(1)})${ok?'':'  FAIL'}`) }
/* round 89 (engine 12): the computer's clubs pick the plan their roster suits. A simmed game of yours is played as the
   computer plays it, with the plan your assistant picks by the computer's measure (Season "auto"), so simming is the
   computer coaching your club by construction. Reported, not asserted: a live game left to your assistant on the plan
   the plan rows recommend, against the computer on its own pick, for the most shaped club in a new league: a person's
   plan also sets his system or offence, so the two paths differ by more than the calls */
for(const f of ['basketball-coach.html','basketball-coach-pro.html','hockey-coach-pro.html','soccer-coach.html']){
  const G=load({file:path.join(__dirname,'..','dist',f),expose:['makeLiveGame','RNG','newDynasty','NAMES','SEA','ENGINE_V','cpuPlanOf','sportPlanFit','sportPlanFitC','gameCtx']});
  G.newDynasty(G.NAMES[0],3,'T'); if(G.ENGINE_V<12)continue;
  const fitOf=t=>Math.max(...['safe','aggressive'].map(p=>G.sportPlanFit(t,p)));
  const ranked=G.NAMES.slice().sort((a,b)=>fitOf(b)-fitOf(a)), t=ranked[0], o=ranked[ranked.length>>1];
  const pc=G.cpuPlanOf(t,0), pa=G.cpuPlanOf(t,0,true), ctx=G.gameCtx(t,o,G.SEA.year,5);
  const val=r=>/soccer/.test(f)?(r.h>r.a?1:r.h===r.a?1/3:0):/hockey/.test(f)?(r.h>r.a?1:(r.ot||r.so)?0.5:0):(r.h>r.a?1:0);
  let cpu=0, asst=0;
  for(let i=0;i<N;i++){ for(const hum of [false,true]){ const e=G.makeLiveGame(new G.RNG((11+i*7919)>>>0),1500,1500,hum?pa:pc,G.cpuPlanOf(o,0),{home:hum,away:false},false,Object.assign({},ctx,{seed:i}));
      let r,g=0; while(g++<3000){ r=e.next(); if(r.done)break; if(r.ask){ const op=r.ask.opts; const a=op.find(x=>/assistant/i.test(x[1]))||op[op.length-1]; e.reply(a[0]) } }
      if(hum)asst+=val(r); else cpu+=val(r) } }
  const d=100*(asst-cpu)/N;
  console.log(`${f.padEnd(26)} (report) shaped (${t}, fit ${fitOf(t).toFixed(0)} Elo; the computer plays ${pc}, your assistant ${pa}): computer ${(100*cpu/N).toFixed(1)}%  your assistant ${(100*asst/N).toFixed(1)}%  (${d>=0?'+':''}${d.toFixed(1)})`) }
console.log(bad?`MISMATCH ${bad} games where leaving it to your assistant isn't the computer's level`:'MATCH leaving every call to your assistant plays like the computer coaches'); process.exit(bad?1:0);
