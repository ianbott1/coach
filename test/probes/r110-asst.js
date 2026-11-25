/* round 110: your assistant's read (engine 24). Each club v its 6 nearest at a neutral site, common dice: wins on
   Balanced, on the best plan (as the engine prices it), and on the assistant's pick; how often he picks the best, by
   staff quality (assistantPlan's error grows as the staff weakens); and whether the card's pick is the one a sim plays.
   node r110-asst.js file [NT] [N] */
const path=require('path');const {load}=require(require('path').join(__dirname,'..','harness.js'));
const f=process.argv[2], NT=+(process.argv[3]||6), N=+(process.argv[4]||400), DV=0.5;
const X=load({file:path.join(__dirname,'..','..','dist',f),settable:['plan'],expose:['plan','S','SEA','U','NAMES','newDynasty','winProb','LEAGUE','playGame','RNG','gameCtx','cpuPlanOf','assistantPlan','planEdge','staffReadSD','staffReadQ','ENGINE_V']});
X.newDynasty(X.NAMES[0],5,'T');
const teams=X.NAMES.filter((_,i)=>i%Math.floor(X.NAMES.length/NT)===0).slice(0,NT);
let W={bal:0,best:0,asst:0}, n=0, agree=0, bins={}, same=0, cnt=0;
for(const t of teams){ const near=X.NAMES.filter(x=>x!==t).sort((a,b)=>Math.abs(X.SEA.elo[a]-X.SEA.elo[t])-Math.abs(X.SEA.elo[b]-X.SEA.elo[t])).slice(0,6);
  for(const o of near){ X.S.myTeam=t; X.SEA.userTeam=t; const e=X.SEA.matchupElo({home:t,away:o,neutral:true},'balanced'), gap=e.h-e.a;
    const E=k=>k==='balanced'?0:X.planEdge(t,k,gap,o), best=['safe','aggressive'].reduce((a,k)=>E(k)>E(a)?k:a,'balanced');
    const ap=X.assistantPlan(t,gap,o,X.SEA.step), sim=X.cpuPlanOf(t,gap,true,o); cnt++; if(ap===sim)same++;
    const q=Math.round(X.staffReadQ(t)/20)*20; bins[q]=bins[q]||[0,0]; bins[q][1]++; if(ap===best){ agree++; bins[q][0]++ }
    const op=X.cpuPlanOf(o,e.a-e.h), ctx=X.gameCtx(t,o,X.SEA.year,X.SEA.step);
    const run=p=>{ const r=new X.RNG(13); let w=0; for(let i=0;i<N;i++){ const g=X.playGame(r,e.h,e.a,p,op,{neutral:true,ctx:ctx,decide:dp=>dp&&dp.opts?dp.opts[dp.opts.length-1][0]:"auto",userIsHome:true}); w+=g.h>g.a?1:g.h===g.a?DV:0 } return w/N };
    const rb=run('balanced'); W.bal+=rb; W.best+=best==='balanced'?rb:run(best); W.asst+=ap==='balanced'?rb:ap===best&&best!=='balanced'?run(best):run(ap); n++ } }
const P=x=>(100*x/n).toFixed(1);
console.log(`${f} engine ${X.ENGINE_V}: wins on Balanced ${P(W.bal)}%, the best plan ${P(W.best)}%, the assistant's ${P(W.asst)}% | he picks the best ${(100*agree/n).toFixed(0)}% (by staff: ${Object.keys(bins).sort((a,b)=>a-b).map(k=>k+':'+Math.round(100*bins[k][0]/bins[k][1])+'%/'+bins[k][1]).join(' ')}) | card's pick = sim's pick ${same}/${cnt}`);
