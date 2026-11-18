/* Hockey's and soccer's attributes (round 89, engine 12): two players of one rating are worth the same however they
   lean, through the real path, and shapes show.
   - The roster's path (a man's leans weighed by position and minutes -> hkShapeOf / scShapeOf): a man leaning two spreads
     to any attribute, the rest down so his rating holds, moves the team's terms by amounts that sum to nothing (each
     weighted by its worth, which is the same for every term), against a plain gain for the same lean with nothing down.
   - The engine: each term is worth the same result per point (standings points in hockey, league points in soccer),
     within 8% of HK12.a / SC12.a rating points (these two engines draw a varying number of dice, so no common-dice
     pairing: large samples instead).
   - Shapes show: hockey's shooters score more of their shots, checkers allow fewer shots, a goalie leaning to
     Positioning kills more penalties; soccer's finishers score more of the same shots, passers make more shots, legs
     last longer with Stamina. A hurt starter's backup carries the lean; hockey's backup goalie counts once he's in net.
     node test/attrs-hs.js [games]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const N=+process.argv[2]||60000;
let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const f2=x=>(x>=0?'+':'')+x.toFixed(3);
for(const [f,team,sport] of [['hockey-coach-pro.html','Boston','hk'],['soccer-coach.html','Arsenal','sc']]){
  const HK=sport==='hk', C=HK?'HK12':'SC12', SHP=HK?'hkShapeOf':'scShapeOf';
  const A=load({file:path.join(__dirname,'..','dist',f),expose:['playGame','RNG','ENGINE_V','SEA','newDynasty',SHP,C,'ATTRS','attrGrp','attrKeys','attrScale','ATTR_SPREAD','POS','BK','R_SLOPE'],settable:['ENGINE_V']});
  A.newDynasty(team,7,'T'); A.ENGINE_V=12; const P=A[C];
  const R0=A.SEA.roster[team].map(p=>p&&Object.assign({},p,{at:p.at.slice()})), sd=A.attrScale().s*A.ATTR_SPREAD, D=2*sd;
  const leanOn=(R,i,k,d,comp)=>{ const p=Object.assign({},R[i],{at:R[i].at.slice()}), g=A.attrGrp(p), K=A.attrKeys(g), W=A.ATTRS.w[g], j=K.indexOf(k);
    const down=comp===false?0:d*W[k]/(1-W[k]); p.at=p.at.map((v,q)=>q===j?v+d:v-down); const R2=R.slice(); R2[i]=p; return R2 };
  const flat=T=>HK?Object.assign({},T.sk,T.g[0]):T;
  const shape=(R,H)=>A[SHP](R,H||null,null);
  const sum=T=>Object.values(flat(T)).reduce((a,b)=>a+b,0);
  // 1. the roster's path: every attribute of every starting group, compensated sums to ~0, uncompensated doesn't
  const groups={}; A.POS.forEach((p,i)=>{ const g=A.attrGrp(R0[i]); if(g&&groups[g]===undefined)groups[g]=i });
  let worst=0, wmsg='', gainMin=1e9;
  for(const g of Object.keys(groups)){ const i=groups[g]; for(const k of A.attrKeys(g)){
    const dz=sum(shape(leanOn(R0,i,k,D)))-sum(shape(R0)), du=sum(shape(leanOn(R0,i,k,D,false)))-sum(shape(R0));
    if(Math.abs(dz)>Math.abs(worst)){ worst=dz; wmsg=`${A.POS[i].p} ${k}` } gainMin=Math.min(gainMin,du) } }
  ok(Math.abs(worst)<0.004&&gainMin>0.03,`${f}: a man leaning two spreads to any attribute, the rest down: the team's terms move by ${f2(worst)} in all (worst: ${wmsg}); the same lean with nothing down at least ${f2(gainMin)}`);
  // 2. the engine: each term's goal margin per point against a rating point's
  const Z=()=>{ if(HK)return {sk:{sht:0,pas:0,skt:0,chk:0,def:0},g:[{rfx:0,gpo:0},{rfx:0,gpo:0}]}; const o={}; ['fin','pas','pac','tck','hed','sta','pos','han'].forEach(k=>o[k]=0); return o };
  const set=(T,k,v)=>{ if(HK){ if(k in T.sk)T.sk[k]=v; else T.g[0][k]=v } else T[k]=v; return T };
  const play=(T,elo,n,opp)=>{ let m=0, L={g:0,s:0,sa:0,ppa:0,ppga:0,late:0}; for(let i=0;i<n;i++){ const r=A.playGame(new A.RNG(i*7919+17),1500+(elo||0),1500,'balanced','balanced',{ctx:{sh:{home:T,away:opp||Z()},seed:i}});
      m+=HK?(r.h>r.a?2:(r.ot||r.so)?1:0):(r.h>r.a?3:r.h===r.a?1:0); const lh=r.lines&&r.lines.h, la=r.lines&&r.lines.a; L.g+=r.h; if(lh){ L.s+=lh.sog||0; L.ppa+=la.pp||0; L.ppga+=la.ppg||0 } if(la)L.sa+=la.sog||0;
      if(!HK&&r.drives)r.drives.forEach(d=>{ if(d.seg>=12&&d.seg<18)L.late+=d.h||0 }) } return {m:m/n,L,n} };
  const rp=(play(Z(),A.R_SLOPE*4,2*N).m-play(Z(),-A.R_SLOPE*4,2*N).m)/8;   // result value (standings or league points) per rating point
  const K=HK?['sht','pas','skt','chk','def','rfx','gpo']:['fin','pas','pac','tck','hed','sta','pos','han'];
  const ratios=K.map(k=>{ const v=(play(set(Z(),k,2),0,N).m-play(set(Z(),k,-2),0,N).m)/4; return [k,v/rp/P.a] });
  const off=ratios.filter(([k,r])=>Math.abs(r-1)>0.08);
  ok(!off.length,`${f}: each term's worth per point, in rating points per point of a (want 1): ${ratios.map(([k,r])=>k+' '+r.toFixed(2)).join(', ')} (a rating point: ${rp.toFixed(4)} ${HK?'standings':'league'} points a game)`);
  // 3. shapes show
  const big=k=>set(Z(),k,3), base=play(Z(),0,N);
  if(HK){ const s=play(big('sht'),0,N), c=play(big('chk'),0,N);
    ok(s.L.g/s.L.s>base.L.g/base.L.s+0.004,`${f}: a shooting team scores more of its shots: ${(100*base.L.g/base.L.s).toFixed(1)}% to ${(100*s.L.g/s.L.s).toFixed(1)}%`);
    ok(c.L.sa<base.L.sa*0.97,`${f}: a checking team allows fewer shots: ${(base.L.sa/N).toFixed(1)} to ${(c.L.sa/N).toFixed(1)} a game`);
    // their goalie leans to Positioning: our power play scores less (home's pp goals: lines.h.ppg over lines.h.pp)
    const ppOf=(T)=>{ let pp=0,g=0; for(let i=0;i<N;i++){ const r=A.playGame(new A.RNG(i*7919+17),1500,1500,'balanced','balanced',{ctx:{sh:{home:Z(),away:T},seed:i}}); pp+=r.lines.h.pp; g+=r.lines.h.ppg } return g/pp };
    const p0=ppOf(Z()), p1=ppOf(set(Z(),'gpo',3)), r1=ppOf(set(Z(),'rfx',3));
    ok(p1<p0-0.01&&(p0-p1)>(p0-r1),`${f}: against a goalie leaning to Positioning the power play scores less (${(100*p0).toFixed(1)}% to ${(100*p1).toFixed(1)}%), more than against Reflexes (${(100*r1).toFixed(1)}%)`);
    // the goalie in net: a hurt starter's backup carries the lean; the backup's own counts in G[1]
    const Rb=leanOn(R0,A.BK(5),'rfx',D,false), T0=shape(R0), Tb=shape(Rb), Th=shape(Rb,new Set([5]));
    ok(Math.abs(Tb.g[0].rfx-T0.g[0].rfx)<1e-9&&Tb.g[1].rfx>T0.g[1].rfx+0.01&&Th.g[0].rfx>T0.g[0].rfx+0.01,`${f}: the backup goalie's Reflexes count when he's in net (${T0.g[1].rfx.toFixed(3)} to ${Tb.g[1].rfx.toFixed(3)}) and when the starter is hurt (starts: ${Th.g[0].rfx.toFixed(3)}), not otherwise`);
  } else { const fi=play(big('fin'),0,N), pa=play(big('pas'),0,N), st=play(big('sta'),0,N);
    ok(fi.L.g>base.L.g*1.04&&Math.abs(fi.L.s/base.L.s-1)<0.02,`${f}: a finishing team scores more (${(base.L.g/N).toFixed(2)} to ${(fi.L.g/N).toFixed(2)} a game) from the same shots on target (${(base.L.s/N).toFixed(2)} to ${(fi.L.s/N).toFixed(2)})`);
    ok(pa.L.s>base.L.s*1.04,`${f}: a passing team makes more shots on target: ${(base.L.s/N).toFixed(2)} to ${(pa.L.s/N).toFixed(2)} a game`);
    ok(st.L.late/st.L.g>base.L.late/base.L.g+0.005,`${f}: a team with Stamina scores more of its goals in the last half hour: ${(100*base.L.late/base.L.g).toFixed(1)}% to ${(100*st.L.late/st.L.g).toFixed(1)}%`);
    const Rb=leanOn(R0,A.BK(5),'fin',D,false), Ts=shape(R0,new Set([5])), Tb=shape(Rb,new Set([5]));
    ok(Tb.fin>Ts.fin+0.01,`${f}: with the striker hurt, his backup's Finishing counts in full (${Ts.fin.toFixed(3)} to ${Tb.fin.toFixed(3)})`) }
}
console.log(bad?`MISMATCH ${bad}`:`MATCH hockey and soccer ratings mean the same however a player leans, and shapes show`); process.exit(bad?1:0);
