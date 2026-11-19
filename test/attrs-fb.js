/* Football's attributes (round 91, engine 14): two players of one rating are worth the same however they lean, through
   the real path, and shapes show. Both games (college and pro).
   - The roster's path (a starter's leans weighed by his group and his position's share -> fbShapeOf): a man leaning two
     spreads to any attribute, the rest down so his rating holds, moves the team's terms by amounts that sum to nothing
     (each term is worth the same per point), against a plain gain for the same lean with nothing down.
   - The engine: each term (offense and defense) is worth the same in wins per point, within 8% of FB14.a rating points.
   - Shapes show: an Arm team scores more touchdowns a drive; Accuracy and Hands throw fewer picks and lose fewer fumbles;
     Blocking kicks more field goals and punts less; Coverage gives up fewer touchdowns and picks more; a pass rush keeps
     the other side out of field-goal range. A hurt starter's backup carries the lean; a healthy backup's doesn't count.
   - Box scores lean: a receiver leaning to Hands and Speed catches more of the touchdowns.
     node test/attrs-fb.js [games]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const N=+process.argv[2]||300000;   // a term at 60,000 games reads within about 5% (football draws a varying number of dice: little pairing)
let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const f3=x=>(x>=0?'+':'')+x.toFixed(3);
for(const [f,team] of [['football-coach-pro.html','Kansas City'],['football-coach.html','Alabama']]){
  const A=load({file:path.join(__dirname,'..','dist',f),expose:['playGame','RNG','ENGINE_V','SEA','newDynasty','fbShapeOf','FB14','ATTRS','attrGrp','attrKeys','attrScale','ATTR_SPREAD','POS','BK','R_SLOPE','driveScript','fbLean'],settable:['ENGINE_V']});
  A.newDynasty(team,7,'T'); A.ENGINE_V=14;
  const R0=A.SEA.roster[team].map(p=>p&&Object.assign({},p,{at:p.at.slice()})), sd=A.attrScale().s*A.ATTR_SPREAD, D=2*sd;
  const leanOn=(R,i,k,d,comp)=>{ const p=Object.assign({},R[i],{at:R[i].at.slice()}), g=A.attrGrp(p), K=A.attrKeys(g), W=A.ATTRS.w[g], j=K.indexOf(k);
    const down=comp===false?0:d*W[k]/(1-W[k]); p.at=p.at.map((v,q)=>q===j?v+d:v-down); const R2=R.slice(); R2[i]=p; return R2 };
  const shape=(R,H)=>A.fbShapeOf(R,H||null);
  const sum=T=>Object.values(T.o).reduce((a,b)=>a+b,0)+Object.values(T.d).reduce((a,b)=>a+b,0);
  // 1. the roster's path
  let worst=0, wmsg='', gainMin=1e9;
  A.POS.forEach((P,i)=>{ const g=A.attrGrp(R0[i]); for(const k of A.attrKeys(g)){
    const dz=sum(shape(leanOn(R0,i,k,D)))-sum(shape(R0)), du=sum(shape(leanOn(R0,i,k,D,false)))-sum(shape(R0));
    if(Math.abs(dz)>Math.abs(worst)){ worst=dz; wmsg=`${P.p} ${k}` } gainMin=Math.min(gainMin,du) } });
  ok(Math.abs(worst)<0.004&&gainMin>0.01,`${f}: a starter leaning two spreads to any attribute, the rest down: the team's terms move by ${f3(worst)} in all (worst: ${wmsg}); the same lean with nothing down at least ${f3(gainMin)}`);
  // 2. the engine: each term's worth in wins per point against a rating point's
  const Z=()=>({o:{arm:0,acc:0,spd:0,hnd:0,blk:0,str:0},d:{cov:0,tkl:0,rsh:0,str:0,spd:0}});
  const set=(s,k,v)=>{ const T=Z(); T[s][k]=v; return T };
  const play=(T,elo,n,opp)=>{ let w=0; const L={td:0,int:0,fum:0,fg:0,punt:0,dr:0,otd:0,oint:0,ofg:0,odr:0};
    for(let i=0;i<n;i++){ const r=A.playGame(new A.RNG(i*7919+17),1500+(elo||0),1500,'balanced','balanced',{ctx:{sh:{home:T,away:opp||Z()},seed:i}});
      w+=r.h>r.a?1:r.h===r.a?0.5:0;
      r.drives.forEach(d=>{ if(d.ot)return; if(d.home){ L.dr++; if(d.kind==='TD')L.td++; if(d.kind==='INT')L.int++; if(d.kind==='FUM')L.fum++; if(d.kind==='FG')L.fg++; if(d.kind==='PUNT')L.punt++ }
        else { L.odr++; if(d.kind==='TD')L.otd++; if(d.kind==='INT')L.oint++; if(d.kind==='FG'||d.kind==='MISS')L.ofg++ } }) }
    return {w:w/n,L} };
  const rp=(play(Z(),20,2*N).w-play(Z(),-20,2*N).w)/(40/A.R_SLOPE);   // wins per rating point, over +/-20 Elo as the terms were measured (the curve bends past it)
  const K=[['o','arm'],['o','acc'],['o','spd'],['o','hnd'],['o','blk'],['o','str'],['d','cov'],['d','tkl'],['d','rsh'],['d','str'],['d','spd']];
  const ratios=K.map(([s,k])=>{ const v=(play(set(s,k,0.25),0,N).w-play(set(s,k,-0.25),0,N).w)/0.5; return [s+'.'+k,v/rp/A.FB14.a] });
  const off=ratios.filter(([k,r])=>Math.abs(r-1)>0.08);
  ok(!off.length,`${f}: each term's worth per point, in rating points per point of a (want 1): ${ratios.map(([k,r])=>k+' '+r.toFixed(2)).join(', ')} (a rating point: ${rp.toFixed(4)} wins a game)`);
  // 3. shapes show (half a point of a term: two spreads or more in the pros)
  const b=play(Z(),0,N).L, pc=(x,n)=>(100*x/n).toFixed(1)+'%';
  const ar=play(set('o','arm',0.5),0,N).L, ac=play(set('o','acc',0.5),0,N).L, hn=play(set('o','hnd',0.5),0,N).L, bk=play(set('o','blk',0.5),0,N).L;
  const cv=play(set('d','cov',0.5),0,N).L, rs=play(set('d','rsh',0.5),0,N).L;
  ok(ar.td/ar.dr>b.td/b.dr+0.01,`${f}: an Arm team scores more touchdowns a drive: ${pc(b.td,b.dr)} to ${pc(ar.td,ar.dr)}`);
  ok(ac.int/ac.dr<b.int/b.dr*0.9&&hn.fum/hn.dr<b.fum/b.dr*0.9,`${f}: Accuracy throws fewer picks (${pc(b.int,b.dr)} to ${pc(ac.int,ac.dr)} of drives), Hands loses fewer fumbles (${pc(b.fum,b.dr)} to ${pc(hn.fum,hn.dr)})`);
  ok(bk.fg/bk.dr>b.fg/b.dr+0.005&&bk.punt/bk.dr<b.punt/b.dr,`${f}: a Blocking team kicks more field goals (${pc(b.fg,b.dr)} to ${pc(bk.fg,bk.dr)}) and punts less (${pc(b.punt,b.dr)} to ${pc(bk.punt,bk.dr)})`);
  ok(cv.otd/cv.odr<b.otd/b.odr-0.005&&cv.oint/cv.odr>b.oint/b.odr*1.05,`${f}: a Coverage defense gives up fewer touchdowns (${pc(b.otd,b.odr)} to ${pc(cv.otd,cv.odr)}) and picks more (${pc(b.oint,b.odr)} to ${pc(cv.oint,cv.odr)})`);
  ok(rs.ofg/rs.odr<b.ofg/b.odr-0.003,`${f}: a pass rush keeps them out of field-goal range: their kicks ${pc(b.ofg,b.odr)} to ${pc(rs.ofg,rs.odr)} of drives`);
  // a hurt starter's backup carries the lean; a healthy one's doesn't count
  const Rb=leanOn(R0,A.BK(0),'arm',D,false), T0=shape(R0), Tb=shape(Rb), Th=shape(Rb,new Set([0])), Ts=shape(R0,new Set([0]));
  ok(Math.abs(Tb.o.arm-T0.o.arm)<1e-9&&Th.o.arm>Ts.o.arm+0.01,`${f}: the backup quarterback's Arm counts when the starter is hurt (${Ts.o.arm.toFixed(3)} to ${Th.o.arm.toFixed(3)}), not otherwise`);
  // 4. box scores: the first receiver leaning to Hands and Speed catches more of the touchdown passes (both up, nothing down:
  // compensated, each lean takes back much of the other)
  const R1=leanOn(leanOn(R0,2,'hnd',D,false),2,'spd',D,false);
  const share=R=>{ let a=0,t=0; const g={home:team,away:team}; for(let s=0;s<400;s++){ const dr=[]; for(let n=1;n<=24;n++)dr.push({home:true,n:n,q:1,kind:'TD',pts:7});
      A.SEA.year=2026+s; A.driveScript(g,dr,[R,R]).forEach(r=>{ if(r.who&&r.who.k==='pass'){ t++; if(r.who.i===2)a++ } }) } return a/t };
  const s0=share(R0), s1=share(R1);
  ok(s1>s0+0.03,`${f}: a first receiver two spreads up in Hands and Speed catches more of the touchdown passes: ${(100*s0).toFixed(0)}% to ${(100*s1).toFixed(0)}%`);
}
console.log(bad?`MISMATCH ${bad}`:`MATCH a football rating means the same however a player leans, and shapes show`); process.exit(bad?1:0);
