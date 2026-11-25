// baseball: the card's chance against games played, across the rotation (the same pair on five days), your path
const {load}=require(require('path').join(__dirname,'..','harness.js'));
const A=load({file:require('path').join(__dirname,'..','..','dist','baseball-coach-pro.html'),settable:['plan'],expose:['plan','S','SEA','NAMES','newDynasty','winProb','playGame','RNG','gameCtx','cpuPlanOf','spCtx','sportTonightEdge']});
A.newDynasty('Seattle',5,'T'); const N=+(process.argv[2]||2000); const rows=[];
for(const [t,o] of [['Seattle','Houston'],['Boston','Toronto'],['Chicago Cubs','St. Louis'],['Atlanta','Miami']]){ if(!A.NAMES.includes(t)||!A.NAMES.includes(o))continue;
  for(let st=0;st<5;st++){ A.SEA.step=st; A.S.myTeam=t; A.SEA.userTeam=t; A.plan='balanced'; const sh=A.winProb(t,o,true,true);
    const e=A.SEA.matchupElo({home:t,away:o,neutral:true},'balanced'), op=A.cpuPlanOf(o,e.a-e.h), ctx=A.gameCtx(t,o,A.SEA.year,st);
    const r=new A.RNG(11+st); let w=0; for(let i=0;i<N;i++){ const g=A.playGame(r,e.h,e.a,'balanced',op,{neutral:true,ctx:ctx,decide:dp=>dp&&dp.opts?dp.opts[dp.opts.length-1][0]:"auto",userIsHome:true}); w+=g.h>g.a?1:0 }
    rows.push([sh,w/N]); console.log(t,'v',o,'day',st,A.spCtx(t,st).n,'v',A.spCtx(o,st).n,'tonight',(A.sportTonightEdge(t)-A.sportTonightEdge(o)).toFixed(0),'shown',(100*sh).toFixed(1),'played',(100*w/N).toFixed(1)) } }
const n=rows.length, mx=rows.reduce((a,r)=>a+r[0],0)/n, my=rows.reduce((a,r)=>a+r[1],0)/n; let sxy=0,sxx=0; rows.forEach(([x,y])=>{sxy+=(x-mx)*(y-my);sxx+=(x-mx)**2});
console.log('played on shown slope',(sxy/sxx).toFixed(2),'mean shown',(100*mx).toFixed(1),'played',(100*my).toFixed(1));
