/* Hockey: no even-strength goal of the side with the man advantage reads as inside the other side's penalty (round 107,
   Grokbot: a 37' goal inside a penalty, not tagged power play). By the minutes shown: the penalty's minute and the two
   after. Every goal of a season of games, all teams.   node test/hk-pp-goal.js [distDir]   last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const DIR=process.argv[2]||process.env.DIST||path.join(__dirname,'..','dist');
const A=load({file:path.join(DIR,'hockey-coach-pro.html'),expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive']});
A.newDynasty('Florida',7,'T'); let goals=0, pp=0, inside=0; const ex=[];
for(let w=0;w<25;w++){ A.doAdvance(); const L=A.live; if(!L)continue; let m=0; while(A.live&&!A.live.done&&m++<5000){ if(A.live.ask){A.answerLive(A.live.ask.dp.opts[0][0]);continue} A.liveTick() }
  const E=[].concat(...L.drives.map(d=>d.ev||[])); const pens=E.filter(e=>e.k==="pen");
  E.filter(e=>e.k==="goal"&&!e.so).forEach(e=>{ goals++; if(e.pp){pp++;return} if(e.en||e.extra)return; const p=pens.find(q=>q.side!==e.side&&e.m>=q.m&&e.m<=q.m+2&&e.m<60&&q.m<60);
    if(p){ inside++; if(ex.length<3)ex.push(`${e.side} goal ${e.m}' in ${p.side}'s ${p.m}' penalty`) } }) }
const ok=goals>50&&inside===0; console.log(`${ok?'  ok  ':'  FAIL'} ${goals} goals (${pp} on the power play); even-strength goals inside the other side's penalty: ${inside} ${ex.join('; ')}`);
console.log(ok?'MATCH no even-strength goal inside a penalty':'MISMATCH'); process.exit(ok?0:1);
