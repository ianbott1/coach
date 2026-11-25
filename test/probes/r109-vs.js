/* played against shown for planVs: your club (home, neutral) on a plan against balanced, calls to your assistant, the
   computer on the plan its roster suits; matchups chosen where the opponent's part is large either way. Common dice.
   node vs.js file [NT teams] [N games] */
const path=require('path');const {load}=require(require('path').join(__dirname,'..','harness.js'));
const f=process.argv[2], NT=+(process.argv[3]||4), N=+(process.argv[4]||3000), DV=+(process.env.DV||0.5);
const A=load({file:path.join(process.env.DIST||require('path').join(__dirname,'..','..','dist'),f),settable:['plan'],expose:['plan','S','SEA','NAMES','newDynasty','winProb','LEAGUE','sportPlanFit','planVs','playGame','RNG','gameCtx','cpuPlanOf']});
A.newDynasty(A.NAMES[0],5,'T'); const wdl=A.LEAGUE.wdl; let sx=0,sy=0,sxx=0,sxy=0,n=0, so=0, ss=0;
const teams=A.NAMES.filter((_,i)=>i%Math.floor(A.NAMES.length/NT)===0).slice(0,NT);
for(const t of teams){ const near=A.NAMES.filter(x=>x!==t).sort((a,b)=>Math.abs(A.SEA.elo[a]-A.SEA.elo[t])-Math.abs(A.SEA.elo[b]-A.SEA.elo[t])).slice(0,8);
  for(const pl of ['safe','aggressive']){ const vs=near.map(o=>[o,A.planVs(t,o,pl)]).sort((a,b)=>a[1]-b[1]); for(const [opp,cv] of [vs[0],vs[vs.length-1]]){
    A.S.myTeam=t; const shown=p=>{ A.plan=p; const w=wdl?wdl.call(A.LEAGUE,t,opp,true,true):null; return w?w[0]+DV*w[1]:A.winProb(t,opp,true,true) };
    const sB=shown('balanced'), sP=shown(pl); A.plan='balanced';
    A.SEA.userTeam=t; const e=A.SEA.matchupElo({home:t,away:opp,neutral:true},'balanced'), op=A.cpuPlanOf(opp,e.a-e.h), ctx=A.gameCtx(t,opp,A.SEA.year,A.SEA.step);
    const run=p=>{ const r=new A.RNG(13); let w=0; for(let i=0;i<N;i++){ const g=A.playGame(r,e.h,e.a,p,op,{neutral:true,ctx:ctx,decide:dp=>dp&&dp.opts?dp.opts[dp.opts.length-1][0]:"auto",userIsHome:true}); w+=g.h>g.a?1:g.h===g.a?DV:0 } return w/N };
    const b=run('balanced'), x=run(pl); const X=sP-sB, Y=x-b; sx+=X; sy+=Y; sxx+=X*X; sxy+=X*Y; n++; so+=Math.abs(Y); ss+=Math.abs(X);
    console.log(t.slice(0,14).padEnd(14),'v',opp.slice(0,14).padEnd(14),pl.padEnd(10),'vs',cv.toFixed(0).padStart(5),'| shown',(100*X).toFixed(1).padStart(6),'| played',(100*Y).toFixed(1).padStart(6)) } } }
const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx); console.log(`played on shown: slope ${slope.toFixed(2)}, mean shown ${(100*sx/n).toFixed(1)} played ${(100*sy/n).toFixed(1)}, mean |shown| ${(100*ss/n).toFixed(1)} |played| ${(100*so/n).toFixed(1)}`);
