/* Baseball's players against MLB (round 75). A regular season (no playoffs) of the real app, from the players' own lines,
   and a few thousand games straight from the engine for what a start looks like:
     starters: innings a start, how often they go 6+ and 7+, the league's starters' and bullpen's ERA, the best ERA
     (162+ innings), the wins leader; hitters: home runs, runs, RBI, steals and average leaders, runs and plate
     appearances by batting slot, and how much a hitter's rating shows in his line (rating vs OPS-ish, correlation).
   Reports against MLB's ranges (2015-24, the leaders' range set by real seasons: Acuna's 149 runs in 2023, Verlander's
   1.75 ERA in 2022, Arrieta's 22 wins in 2015). With --check, exits 1 when one is out of its range.
     node test/bs-players.js [--check] [--seasons N]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const F=path.join(process.env.DIST||path.join(__dirname,'..','dist'),'baseball-coach-pro.html');
const args=process.argv.slice(2), CHECK=args.includes('--check'), NS=+(args[args.indexOf('--seasons')+1]||2)||2;
const out=[]; let bad=0; const rep=(k,v,lo,hi,f)=>{ const ok=v>=lo&&v<=hi; if(!ok)bad++; out.push(`  ${ok?'ok  ':'OFF '} ${k}: ${f?f(v):v} (MLB ${f?f(lo):lo} to ${f?f(hi):hi})`) };
const r1=v=>v.toFixed(1), r2=v=>v.toFixed(2), r3=v=>v.toFixed(3).replace(/^0/,'');
// the engine: games between average sides, each club's day lineup and starter
// round 79: three careers' worth (4,500 games), not one: the steal rate swung 77.4% to 82.3% between single seeds at
// 1,500 games (six seeds, round 79), so one seed could fall outside MLB's range by chance alone
{ const A=load({file:F,expose:['SEA','newDynasty','playGame','gameCtx','NAMES']});
  let starts=0,outs=0,six=0,seven=0,spER=0,bpER=0,bpOuts=0,clER=0,clOuts=0,g=0,runs=0,dec={w:0,l:0,sv:0},sb=0,cs=0;
  for(const seed of [11,12,13]){ A.newDynasty('Seattle',seed,'T');
  for(let i=0;i<1500;i++){ const h=A.NAMES[i%30], a=A.NAMES[(i*7+3)%30]; if(h===a)continue; g++;
    const gs=A.playGame(A.SEA.rng,1500,1500,'balanced','balanced',{ctx:A.gameCtx(h,a,A.SEA.year,i)}), B=gs.drives[gs.drives.length-1].box; runs+=gs.h+gs.a;
    gs.drives.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k==='sb')sb++; if(e.k==='cs')cs++ }));
    ['home','away'].forEach(sd=>{ const P=B[sd].pit; Object.keys(P).forEach(n=>{ const p=P[n];
      if(n==='bullpen'||(B[sd].sp&&n!==B[sd].sp&&n!=='closer')){ bpER+=p.er; bpOuts+=p.outs } else if(n==='closer'){ clER+=p.er; clOuts+=p.outs } else { starts++; outs+=p.outs; spER+=p.er; if(p.outs>=18)six++; if(p.outs>=21)seven++ } });
      const d=B[sd].dec||{}; if(d.w&&d.w!=='closer'&&(!B[sd].sp||d.w===B[sd].sp))dec.w++; if(d.l&&d.l!=='closer')dec.l++; if(d.sv)dec.sv++ }) } }
  console.log(`engine: ${g} games, ${r2(runs/g/2)} runs a side`);
  rep('starter innings a start',outs/3/starts,5.0,5.6,r1); rep('starts of 6+ innings',100*six/starts,38,55,v=>r1(v)+'%'); rep('starts of 7+ innings',100*seven/starts,12,25,v=>r1(v)+'%');
  rep("starters' ERA",spER*27/outs,3.8,4.6,r2); rep("bullpen's ERA (relievers and closer)",(bpER+clER)*27/(bpOuts+clOuts),3.6,4.3,r2);
  rep("share of games' wins to the starter",100*dec.w/g,52,64,v=>r1(v)+'%');
  rep('steal attempts a side a game',(sb+cs)/g/2,0.7,1.2,r2); rep('steals that make it',100*sb/Math.max(1,sb+cs),74,82,v=>r1(v)+'%'); rep('saves a game (both sides)',dec.sv/g,0.38,0.6,r2) }
// seasons of the real app: the leaders, from the regular season's lines
for(let s=0;s<NS;s++){ const A=load({file:F,expose:['S','SEA','U','newDynasty','doAdvance','live','liveTick','answerLive','NAMES','POS','STAT_KEYS','LEAGUE']});
  A.newDynasty(['Seattle','Houston','NY Yankees'][s%3],21+s,'T'); let guard=0;
  while(A.SEA.phase==='week'&&guard++<400){ A.doAdvance(); let n=0; while(A.live&&!A.live.done&&n++<5000){A.live.ask?A.answerLive(A.live.ask.dp.opts[0][0]):A.liveTick()} }
  const H=[], P=[], G=Math.max(...A.NAMES.map(t=>A.SEA.rec[t][0]+A.SEA.rec[t][1])), slot=[...Array(9)].map(()=>({r:0,ab:0,n:0}));
  // the batting slot: by position before engine 5, by ability after (the best second: BS_ORDER5)
  const ORD=[2,0,1,3,4,5,6,7,8], v5=(A.U&&A.U.engV||0)>=5;
  A.NAMES.forEach(t=>{ const R=A.SEA.roster[t]||[], rk=R.slice(0,9).map((p,i)=>({p,i})).filter(x=>x.p).sort((a,b)=>(b.p.r-a.p.r)||(a.i-b.i)).map(x=>x.i);
    R.forEach((p,i)=>{ if(!p||!p.st2||!p.st2.g)return; const s2=p.st2, pos=A.POS[i%A.POS.length].p;
    if(/^(SP|SP2|SP3|CL)$/.test(pos))P.push({p,s:s2,pos}); else { H.push({p,s:s2}); if(i<9){ const k=v5?ORD.indexOf(rk.indexOf(i)):i; if(k>=0){ slot[k].r+=s2.r; slot[k].ab+=s2.ab+s2.bb; slot[k].n++ } } } }) });
  let rs=0,gn=0; A.SEA.weeks.forEach(W=>W.games.forEach(g=>{ if(g.hp!==undefined){ rs+=g.hp+g.ap; gn++ } }));
  rep(`runs a side in the app's season ${s+1}`,rs/gn/2,4.2,4.7,r2);
  const top=(L,f,min)=>L.filter(x=>!min||min(x.s)).map(x=>({v:f(x.s),x})).sort((a,b)=>b.v-a.v);
  const hr=top(H,s=>s.hr), rr=top(H,s=>s.r), rbi=top(H,s=>s.rbi), sb=top(H,s=>s.sb), avg=top(H,s=>s.h/s.ab,s=>s.ab>=3.1*G);
  const era=top(P,s=>-s.er*27/s.ip,s=>s.ip>=3*G).map(x=>({v:-x.v,x:x.x})), w=top(P,s=>s.w||0), sv=top(P.filter(x=>x.pos==='CL'),s=>s.sv||0), ip=top(P,s=>s.ip/3);
  // does a hitter's rating show? correlation of rating with (H+BB+2HR)/PA among regulars
  const reg=H.filter(x=>x.s.ab>=2.5*G), xs=reg.map(x=>x.p.r), ys=reg.map(x=>(x.s.h+x.s.bb+2*x.s.hr)/(x.s.ab+x.s.bb));
  const mx=xs.reduce((a,b)=>a+b,0)/xs.length, my=ys.reduce((a,b)=>a+b,0)/ys.length, cov=xs.reduce((t,x,i)=>t+(x-mx)*(ys[i]-my),0), vx=xs.reduce((t,x)=>t+(x-mx)**2,0), vy=ys.reduce((t,y)=>t+(y-my)**2,0), corr=cov/Math.sqrt(vx*vy);
  console.log(`season ${s+1} (${G} games): HR ${hr.slice(0,3).map(x=>x.v+' (r'+x.x.p.r+')').join(', ')}; R ${rr[0].v}; RBI ${rbi[0].v}; SB ${sb[0].v}; AVG ${r3(avg[0].v)}; ERA ${r2(era[0].v)} (${(era[0].x.s.ip/3).toFixed(0)} IP); W ${w[0].v}; SV ${sv[0].v}; IP ${ip[0].v.toFixed(0)}`);
  console.log(`  runs by slot: ${slot.map((x,i)=>`${i+1}:${(x.r/x.n).toFixed(0)}`).join(' ')}; PA by slot: ${slot.map(x=>(x.ab/x.n).toFixed(0)).join(' ')}`);
  console.log(`  HR leader, season ${s+1}: ${hr[0].v} (judged on the two seasons' average below)`); (global.__hrL=global.__hrL||[]).push(hr[0].v); rep(`runs leader, season ${s+1}`,rr[0].v,115,150); rep(`RBI leader, season ${s+1}`,rbi[0].v,110,145); rep(`steals leader, season ${s+1}`,sb[0].v,35,75);
  rep(`best ERA (162+ IP), season ${s+1}`,era[0].v,1.7,2.9,r2); rep(`wins leader, season ${s+1}`,w[0].v,15,22); rep(`saves leader, season ${s+1}`,sv[0].v,35,50);
  rep(`innings leader, season ${s+1}`,ip[0].v,180,225,v=>v.toFixed(0)); rep(`hitters' rating shows (corr with production), season ${s+1}`,corr,0.4,1,r2) }
// the HR leader on the seasons' average (round 85, measured over 14 seasons each: the engine's leader is under 40 in about
// a quarter of seasons, engine 8 and 9 alike (means 42.9 and 42.4): one season under 40 is the engine's own spread, not a
// change; a low average would be. Power a touch low against MLB's leaders: on the roadmap, not retuned here)
{ const L=global.__hrL||[]; if(L.length)rep(`HR leader, average of ${L.length} seasons`,L.reduce((a,b)=>a+b,0)/L.length,40,62,v=>v.toFixed(1)) }
out.forEach(l=>console.log(l)); console.log(bad?`MISMATCH ${bad} out of MLB's range`:"MATCH baseball's players look like MLB's"); process.exit(CHECK&&bad?1:0);
