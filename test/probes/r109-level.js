/* your path's level when you follow the card: each club v its 6 nearest, the card's best plan (engine 23 v 22 on the
   same dice), your points for and against and wins. node level.js file [NT] [N] */
const path=require('path');const {load}=require(require('path').join(__dirname,'..','harness.js'));
const f=process.argv[2], NT=+(process.argv[3]||6), N=+(process.argv[4]||600), DV=0.5;
const mk=()=>load({file:path.join(require('path').join(__dirname,'..','..','dist'),f),settable:['plan'],expose:['plan','S','SEA','NAMES','newDynasty','winProb','LEAGUE','playGame','RNG','gameCtx','cpuPlanOf']});
const A=mk(); process.env.ENGINE_NOW='22'; const B=mk(); delete process.env.ENGINE_NOW;
const out={};
for(const [nm,X] of [['23',A],['22',B]]){ X.newDynasty(X.NAMES[0],5,'T'); let pf=0,pa=0,w=0,n=0,pk={safe:0,balanced:0,aggressive:0};
  const teams=X.NAMES.filter((_,i)=>i%Math.floor(X.NAMES.length/NT)===0).slice(0,NT);
  for(const t of teams){ const near=X.NAMES.filter(x=>x!==t).sort((a,b)=>Math.abs(X.SEA.elo[a]-X.SEA.elo[t])-Math.abs(X.SEA.elo[b]-X.SEA.elo[t])).slice(0,6);
    for(const o of near){ X.S.myTeam=t; X.SEA.userTeam=t; const wdl=X.LEAGUE.wdl; const sh=p=>{ X.plan=p; const r=wdl?wdl.call(X.LEAGUE,t,o,true,true):null; return r?r[0]+DV*r[1]:X.winProb(t,o,true,true) };
      const R=x=>Math.round(x*100), b=sh('balanced'); let best='balanced'; for(const k of ['safe','aggressive']){ const v=sh(k); if(R(v)-R(b)>=2&&v>(best==='balanced'?b:sh(best)))best=k } X.plan='balanced'; pk[best]++;
      const e=X.SEA.matchupElo({home:t,away:o,neutral:true},'balanced'), op=X.cpuPlanOf(o,e.a-e.h), ctx=X.gameCtx(t,o,X.SEA.year,X.SEA.step), r=new X.RNG(21);
      for(let i=0;i<N;i++){ const g=X.playGame(r,e.h,e.a,best,op,{neutral:true,ctx:ctx,decide:dp=>dp&&dp.opts?dp.opts[dp.opts.length-1][0]:"auto",userIsHome:true}); pf+=g.h; pa+=g.a; w+=g.h>g.a?1:g.h===g.a?DV:0; n++ } } }
  out[nm]={pf:pf/n,pa:pa/n,w:w/n,pk}; console.log(f,'engine',nm,'following the card: points for',(pf/n).toFixed(2),'against',(pa/n).toFixed(2),'total',((pf+pa)/n).toFixed(2),'wins',(100*w/n).toFixed(1)+'%','picks',JSON.stringify(pk)) }
