// round 109: tonight's starter 20 points worse (his rating lowered, the card's chance read), ten clubs
const {load}=require('/home/claude/wt109/test/harness.js');
const A=load({file:'/home/claude/wt109/dist/baseball-coach-pro.html',expose:['S','SEA','newDynasty','NAMES','winProb','spCtx','BS_SP','BK','cardGame']});
const out=[];
for(const t of A.NAMES.filter((_,i)=>i%3===0)){ A.newDynasty(t,5,'T'); const my=A.S.myTeam, SEA=A.SEA, g=A.cardGame(my); if(!g)continue;
 const opp=g.home===my?g.away:g.home, atH=g.home===my, R=SEA.roster[my];
 const sp=A.spCtx(my,g.week); const p=R.find(x=>x&&x.n===sp.n);
 const w0=A.winProb(my,opp,atH,!!g.neutral); const r0=p.r; p.r=r0-20; const w1=A.winProb(my,opp,atH,!!g.neutral); p.r=r0;
 // the same 20 points on a regular hitter (the best of the nine)
 out.push({t:my,sp:p.n,r:r0,d:Math.round((w0-w1)*1000)/10}) }
out.forEach(o=>console.log(o.t.padEnd(16),o.sp.padEnd(22),'r',o.r,'chance down',o.d,'pts'));
const ds=out.map(o=>o.d).sort((a,b)=>a-b); console.log('n',ds.length,'min',ds[0],'median',ds[ds.length>>1],'max',ds[ds.length-1]);
