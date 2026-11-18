/* Baseball's attributes (round 87, engine 10): two players of one rating are worth about the same however they lean.
   On the same dice (each shape plays the same games), a lineup of nine 60-rated hitters leaning to Power, to Contact,
   to Eye or to Speed and Fielding scores within a few percent of a lineup with no lean; a 60-rated starter leaning to
   Stuff, to Control or to Stamina allows within a few percent of one with no lean. And a hitter whose attributes all
   equal his rating bats as on engine 9 (the same runs on the same dice). Otherwise a rating would mislead: the trade
   screens, free agency and the chance to win all price by it.
     node test/attrs-bs.js [games]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const F=path.join(__dirname,'..','dist','baseball-coach-pro.html');
const A=load({file:F,expose:['playGame','RNG','ENGINE_V','ENGINE_NOW','ATTRS'],settable:['ENGINE_V']});
const N=+process.argv[2]||12000, R=60, TOL=0.03;
let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const W=A.ATTRS.w;
// a lean: +d on the chosen attributes, the rest down so the weighted sum stays the rating
function lean(g,up,d){ const K=Object.keys(W[g]), wu=up.reduce((s,k)=>s+W[g][k],0), down=-d*wu/(1-wu), o={};
  K.forEach(k=>o[k]=R+(up.indexOf(k)>=0?d:down)); return o }
const HN=[...Array(9)].map((_,i)=>'H'+i), PN='SP';
function ctx(hit,pit){ const side=nm=>({}); const at={home:{},away:{}}, rate={home:{},away:{}};
  ['home','away'].forEach(sd=>{ HN.forEach(n=>{ rate[sd][n]=R; at[sd][n]=sd==='home'?hit:lean('IF',[],0) }); rate[sd][PN]=R; at[sd][PN]=sd==='away'?pit:lean('P',[],0) });
  return {lineup:{home:HN,away:HN}, rate:rate, at:at, sp:{home:{n:PN,q:0},away:{n:PN,q:0}}, catcher:{home:'H0',away:'H0'}, team:{home:'X',away:'Y'}} }
// the home lineup's runs against the away starter, on the same dice for each shape
function runs(hit,pit,eng){ A.ENGINE_V=eng; let s=0; for(let i=0;i<N;i++){ const r=A.playGame(new A.RNG(i*7919+11),1500,1500,'balanced','balanced',{ctx:ctx(hit,pit)}); s+=r.h } return s/N }
const P0=lean('P',[],0), H0=lean('IF',[],0);
const base=runs(H0,P0,10), base9=runs(H0,P0,9);
ok(Math.abs(base/base9-1)<TOL,`no lean bats about as on engine 9 (each term is recentred for the league's spread): ${base.toFixed(3)} and ${base9.toFixed(3)} runs`);
[['Power',['pow']],['Contact',['con']],['Eye',['eye']],['Speed and Fielding',['spd','fld']]].forEach(([l,up])=>{
  const r=runs(lean('IF',up,5),P0,10); ok(Math.abs(r/base-1)<TOL,`nine hitters leaning to ${l}: ${r.toFixed(3)} runs a game against ${base.toFixed(3)} (${((r/base-1)*100).toFixed(1)}%)`) });
[['Stuff',['stf']],['Control',['ctl']],['Stamina',['sta']]].forEach(([l,up])=>{
  const r=runs(H0,lean('P',up,5),10); ok(Math.abs(r/base-1)<TOL,`a starter leaning to ${l} allows ${r.toFixed(3)} against ${base.toFixed(3)} (${((r/base-1)*100).toFixed(1)}%)`) });
console.log(bad?`MISMATCH ${bad}`:`MATCH a rating means the same however a player leans`); process.exit(bad?1:0);
