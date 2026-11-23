/* Baseball's full match pitch by pitch (round 105), scripted over engine games: every plate appearance's pitches are a
   legal count that ends in the engine's result (a strikeout on strike three with fewer than four balls, a walk on ball
   four with fewer than three strikes, a ball in play or a hit batter on a count short of either; a foul never strike
   three); the same pitches however they're reached; about MLB's pitches a plate appearance (3.9) and a quarter of
   strikeouts looking.     node test/bs-pitch.js     last line: MATCH or MISMATCH */
const path=require('path'); const {load}=require('./harness.js');
const A=load({file:path.join(__dirname,'..','dist','baseball-coach-pro.html'),settable:['live'],expose:['makeLiveGame','RNG','newDynasty','SEA','S','HL_SPORT','live']});
let bad=0, checks=0; const ok=(c,m)=>{ checks++; if(!c){ bad++; if(bad<=10)console.log('  FAIL '+m) } };
A.newDynasty('Seattle',5,'T');
let pa=0, pitches=0, k=0, kc=0, full=0;
for(let s=1;s<=40;s++){ const e=A.makeLiveGame(new A.RNG(s),1700,1700,'balanced','balanced',true); e.plog=true; let n=0; while(n++<900){ const r=e.next(); if(r.done)break; if(r.ask)e.reply(r.ask.opts[0][0]) }
  e.drives.forEach(d=>(d.pl||[]).forEach((q,i)=>{ if(q.t!=='pa')return; pa++; const z=(s*7919+i*131+d.seg)>>>0, P=A.HL_SPORT.bsPitches(q,z), P2=A.HL_SPORT.bsPitches(q,z), tag=`seed ${s} inning ${d.seg+1} ${q.o}: ${P.join(' ')}`;
    ok(JSON.stringify(P)===JSON.stringify(P2),`${tag}: two different sequences`); pitches+=P.length;
    const last=P[P.length-1], [b,st]=A.HL_SPORT.bsCount(P,P.length-1);
    ok(b<=3&&st<=2,`${tag}: the count before the last pitch is ${b}-${st}`);
    if(q.o==='k'){ k++; ok((last==='KC'||last==='KS')&&st===2,`${tag}: a strikeout not on strike three`); if(last==='KC')kc++ }
    else if(q.o==='bb'){ ok(last==='B4'&&b===3,`${tag}: a walk not on ball four`) }
    else if(q.o==='hbp')ok(last==='HBP',`${tag}: a hit batter`);
    else ok(last==='X',`${tag}: in play`);
    if(b===3&&st===2)full++ })) }
const ppa=pitches/pa; ok(ppa>3.6&&ppa<4.2,`${ppa.toFixed(2)} pitches a plate appearance (MLB about 3.9)`); ok(kc/k>0.18&&kc/k<0.32,`${Math.round(100*kc/k)}% of strikeouts looking (MLB about a quarter)`);
console.log(`  ${pa} plate appearances: ${ppa.toFixed(2)} pitches each, ${Math.round(100*kc/k)}% of ${k} strikeouts looking, ${Math.round(100*full/pa)}% reached a full count`);
console.log(bad?`MISMATCH ${bad} of ${checks}`:`MATCH ${checks} checks`);
