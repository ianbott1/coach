/* Basketball's attributes (round 88, engine 11): two players of one rating are worth about the same however they lean,
   through the real path (a roster's men -> bbShapeOf: their leans weighed by position and minutes -> the possession).
   On common dice, a team whose guard (or wing, or big; a starter or the backup who takes a hurt starter's minutes)
   leans hard to one attribute, the rest down so his rating holds, scores within a small margin of the same team with
   no lean, at the balanced plan (within 0.3 points of margin, about 1% of win chance; a single point guard leaning two
   spreads to Shooting is the worst, measured at +0.15 pro and +0.25 college, against 1.4-1.8 for the same gain with
   nothing down: round 88); the same lean without the rest down (a better player) moves it plainly. And shapes
   show: a shooting team takes and makes more threes, a rebounding one gets more second chances, a playmaking one
   turns it over less. Both leagues.
     node test/attrs-bb.js [games]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const N=+process.argv[2]||16000;
let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
for(const [f,team] of [['basketball-coach-pro.html','Boston'],['basketball-coach.html','Duke']]){
  const A=load({file:path.join(__dirname,'..','dist',f),expose:['playGame','RNG','ENGINE_V','SEA','newDynasty','bbShapeOf','ATTRS','attrGrp','attrKeys','attrScale','ATTR_SPREAD','POS','BK'],settable:['ENGINE_V']});
  A.newDynasty(team,7,'T'); A.ENGINE_V=11;
  const R0=A.SEA.roster[team].map(p=>p&&Object.assign({},p,{at:p.at.slice()})), sd=A.attrScale().s*A.ATTR_SPREAD;
  // a lean of d on k, the rest down by their weights so the rating holds (comp false: the rest stay, a better player)
  const leanOn=(R,i,k,d,comp)=>{ const p=Object.assign({},R[i],{at:R[i].at.slice()}), g=A.attrGrp(p), K=A.attrKeys(g), W=A.ATTRS.w[g], j=K.indexOf(k);
    const down=comp===false?0:d*W[k]/(1-W[k]); p.at=p.at.map((v,q)=>q===j?v+d:v-down); const R2=R.slice(); R2[i]=p; return R2 };
  const shape=(R,H)=>A.bbShapeOf(R,H||null), opp=shape(R0);
  const play=(T)=>{ let m=0, L={tpa:0,fga:0,tpm:0,oreb:0,to:0}; for(let i=0;i<N;i++){ const r=A.playGame(new A.RNG(i*7919+17),1500,1500,'balanced','balanced',{ctx:{sh:{home:T,away:opp},seed:i}});
      m+=r.h-r.a; const l=r.lines.h; L.tpa+=l.tpa; L.fga+=l.tpa+l.fga2; L.tpm+=l.tpm; L.oreb+=l.oreb; L.to+=l.to } return {m:m/N,tp:L.tpa/L.fga,t3:L.tpm/Math.max(1,L.tpa),or:L.oreb/N,to:L.to/N} };
  const base=play(shape(R0)), D=2*sd;
  console.log(`  ${f}: margin with no lean ${base.m.toFixed(2)}`);
  const cases=[["the point guard","sht",0],["the centre","sht",4],["the centre","id",4],["the small forward","reb",2],["the shooting guard","ply",1],["the point guard","pd",0],["the power forward","ath",3],["the centre","sta",4]];
  for(const [who,k,i] of cases){ const r=play(shape(leanOn(R0,i,k,D))), up=play(shape(leanOn(R0,i,k,D,false)));
    ok(Math.abs(r.m-base.m)<0.3&&Math.abs(up.m-base.m)>2*Math.abs(r.m-base.m)&&up.m-base.m>0.3,`${f}: ${who} leaning to ${A.ATTRS.name[k]} (+${D.toFixed(1)}): margin ${(r.m-base.m>=0?'+':'')+(r.m-base.m).toFixed(3)}; the same with nothing down (a better player) ${(up.m-base.m>=0?'+':'')+(up.m-base.m).toFixed(3)}`) }
  // a hurt starter: his backup takes his minutes, so the backup's lean counts in full and the starter's not at all
  const H=new Set([0]), Rb=leanOn(R0,A.BK(0),"sht",D,false), Ts=shape(R0,H), Tb=shape(Rb,H), Tn=shape(leanOn(R0,0,"sht",D,false),H);
  ok(Tb.sht>Ts.sht+0.01&&Math.abs(Tn.sht-Ts.sht)<1e-9,`${f}: with the point guard hurt, his backup's shooting counts (${Ts.sht.toFixed(3)} to ${Tb.sht.toFixed(3)}) and his own doesn't`);
  // shapes show in the team's line
  const sh=play(shape([0,1,2].reduce((R,i)=>leanOn(R,i,"sht",D),R0))), rb=play(shape([3,4].reduce((R,i)=>leanOn(R,i,"reb",D),R0))), pl=play(shape([0,1].reduce((R,i)=>leanOn(R,i,"ply",D),R0)));
  ok(sh.tp>base.tp+0.005&&sh.t3>base.t3+0.005,`${f}: a shooting team's threes: ${(100*base.tp).toFixed(1)}% of shots to ${(100*sh.tp).toFixed(1)}%, made ${(100*base.t3).toFixed(1)}% to ${(100*sh.t3).toFixed(1)}%`);
  ok(rb.or>base.or+0.2,`${f}: a rebounding team's offensive boards: ${base.or.toFixed(2)} to ${rb.or.toFixed(2)} a game`);
  ok(pl.to<base.to-0.2,`${f}: a playmaking team's turnovers: ${base.to.toFixed(2)} to ${pl.to.toFixed(2)} a game`);
}
console.log(bad?`MISMATCH ${bad}`:`MATCH a basketball rating means the same however a player leans, and a shape shows`); process.exit(bad?1:0);
