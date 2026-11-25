// round 109 probe: (A) a depth-chart swap at each starting slot, as a person makes it, and what it does to the shown
// chance and the best plan; (B) each plan's edge over balanced against every opponent: how often each plan is best.
const path=require('path'); const DIST=process.env.DIST||require('path').join(__dirname,'..','..','dist'); const {load}=require(require('path').join(__dirname,'..','harness.js'));
const GAMES={nfl:'football-coach-pro.html',cfb:'football-coach.html',nba:'basketball-coach-pro.html',ncaab:'basketball-coach.html',nhl:'hockey-coach-pro.html',epl:'soccer-coach.html',mlb:'baseball-coach-pro.html'};
const only=process.argv[2]; const NT=+(process.argv[3]||8);
for(const [lg,f] of Object.entries(GAMES)){ if(only&&only!==lg)continue;
  const A=load({file:path.join(DIST,f),expose:['S','SEA','newDynasty','POS','BK','NAMES','swapDepth','winProb','LEAGUE','gameEdge','plan','sportPlanFit'],settable:['plan']});
  const names=A.NAMES.slice(); const step=Math.max(1,Math.floor(names.length/NT)); const picks=names.filter((_,i)=>i%step===0).slice(0,NT);
  const swaps=[]; const bestCount={safe:0,balanced:0,aggressive:0}; const edges={safe:[],aggressive:[]}; let flips=0, nsw=0;
  for(const t of picks){ A.newDynasty(t,5,'T'); const my=A.S.myTeam, sea=A.SEA, R=sea.roster[my];
    const ch=(opp)=>{ const o={}; const was=A.plan; for(const k of ['safe','balanced','aggressive']){ A.plan=k; o[k]=A.LEAGUE.wdl?A.LEAGUE.wdl(my,opp,true,false)[0]:A.winProb(my,opp,true,false) } A.plan=was; return o };
    const best=o=>{ const R=x=>Math.round(x*100); let b='balanced'; for(const k of ['safe','aggressive'])if(R(o[k])-R(o.balanced)>=2&&R(o[k])>R(o[b]))b=k; return b };
    // opponent: the nearest club in strength (where a plan and a swap matter most)
    const base=sea.talent.base; const opp=names.filter(x=>x!==my).sort((a,b)=>Math.abs(base[a]-base[my])-Math.abs(base[b]-base[my]))[0];
    const c0=ch(opp), b0=best(c0);
    for(let i=0;i<A.POS.length;i++){ const bk=R[A.BK(i)]; if(!R[i]||!bk)continue; const gap=R[i].r-bk.r; if(gap<12||gap>30)continue;
      A.swapDepth(sea,i,my); const c1=ch(opp), b1=best(c1); A.swapDepth(sea,i,my);
      nsw++; if(b1!==b0)flips++;
      swaps.push({t:my,pos:A.POS[i].p,gap,d:Math.round((c1.balanced-c0.balanced)*1000)/10, dS:Math.round(((c1.safe-c1.balanced)-(c0.safe-c0.balanced))*1000)/10, dA:Math.round(((c1.aggressive-c1.balanced)-(c0.aggressive-c0.balanced))*1000)/10,b0,b1}) }
    for(const o of names){ if(o===my)continue; const c=ch(o); if(c.balanced<0.2||c.balanced>0.8)continue; bestCount[best(c)]++; edges.safe.push((c.safe-c.balanced)*100); edges.aggressive.push((c.aggressive-c.balanced)*100) } }
  const q=(a,p)=>{a=a.slice().sort((x,y)=>x-y); return a.length?a[Math.floor(p*(a.length-1))].toFixed(1):'-'};
  console.log(`=== ${lg}: swaps of a starter for a backup 12-30 points worse, against the nearest club`);
  const byPos={}; swaps.forEach(s=>{(byPos[s.pos]=byPos[s.pos]||[]).push(s)});
  for(const [p,a] of Object.entries(byPos)){ const m=x=>(x.reduce((u,v)=>u+v,0)/x.length); console.log(`  ${p.padEnd(4)} n${String(a.length).padStart(3)} gap ${m(a.map(s=>s.gap)).toFixed(1)}  chance ${m(a.map(s=>s.d)).toFixed(1)}  per 20 pts ${(m(a.map(s=>s.d/s.gap))*20).toFixed(1)}  safe edge ${m(a.map(s=>s.dS)).toFixed(1)} aggr edge ${m(a.map(s=>s.dA)).toFixed(1)}`) }
  console.log(`  best plan changed in ${flips} of ${nsw} swaps`);
  console.log(`  against every opponent 20-80%: best plan ${JSON.stringify(bestCount)}; safe edge p10/50/90 ${q(edges.safe,.1)}/${q(edges.safe,.5)}/${q(edges.safe,.9)}; aggressive ${q(edges.aggressive,.1)}/${q(edges.aggressive,.5)}/${q(edges.aggressive,.9)}`) }
