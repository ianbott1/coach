// baseball: what a starter's q is worth in Elo, played. Equal clubs, neutral; home starter's q moved, then the Elo gap moved
const {load}=require(require('path').join(__dirname,'..','harness.js'));
const A=load({file:require('path').join(__dirname,'..','..','dist','baseball-coach-pro.html'),expose:['S','SEA','NAMES','newDynasty','playGame','RNG','gameCtx']});
A.newDynasty('Seattle',5,'T'); const N=+(process.argv[2]||20000);
const [h,a]=['Seattle','Colorado']; const base=A.gameCtx(h,a,A.SEA.year,5); const e0=1500;
const run=(dq,de)=>{ const ctx=JSON.parse(JSON.stringify(base)); ctx.sp.home.q=(base.sp.away.q||0)+dq; const r=new A.RNG(7); let w=0;
  for(let i=0;i<N;i++){ const g=A.playGame(r,e0+de,e0,'balanced','balanced',{neutral:true,ctx:ctx}); w+=g.h>g.a?1:0 } return w/N };
const w0=run(0,0), wq=run(0.05,0), wqn=run(-0.05,0), we=run(0,50), wen=run(0,-50);
const sq=(wq-wqn)/0.1, se=(we-wen)/100; console.log({w0,wq,wqn,we,wen}, 'Elo per unit q', (sq/se).toFixed(0), ' a 10-point better starter (q', 10*0.005,') =', (0.05*sq/se).toFixed(0),'Elo');
