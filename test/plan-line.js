/* Round 95 (Grokbot's point 3): after the game, the plan you started on and its worth as the card showed it before
   the game. In all seven, nine games each on the three plans: the number on the result card equals the card's number
   before the game (each plan's chance less Balanced's, as rounded on screen), and it is in the save.
     node test/plan-line.js [game prefix]    last line: MATCH or MISMATCH */
const path=require('path'); const {load}=require('./harness.js');
const D=f=>path.join(process.env.DIST||path.join(__dirname,'..','dist'),f);
const GAMES=[['football-coach.html','Alabama'],['football-coach-pro.html','Denver'],['basketball-coach.html','Duke'],
  ['basketball-coach-pro.html','Orlando'],['hockey-coach-pro.html','Vegas'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
const strip=h=>String(h||'').replace(/<[^>]+>/g,' ').replace(/&minus;/g,'-').replace(/\s+/g,' ').trim();
const only=process.argv[2]; let bad=0,n=0,shown=0;
for(const [f,t] of GAMES){ if(only&&!f.startsWith(only))continue;
  const A=load({file:D(f),settable:['plan','flash','live'],expose:['plan','flash','S','SEA','NAMES','newDynasty','doAdvance','live','liveTick','answerLive','planChances','planReasonHTML','heroResult','rebuild','save','planFor','PLANS','saveText']});
  A.newDynasty(t,5,'T'); const P=['safe','balanced','aggressive']; const out=[]; const n0=n;
  for(let k=0;k<9&&A.SEA.phase==='week';k++){ A.plan=P[k%3];
    const card=strip(A.planReasonHTML(false)||''); const C=A.planChances(); const R=x=>Math.max(1,Math.min(99,Math.round(x*100)));
    const want=C?R(C.p[A.plan])-R(C.p.balanced):null;
    A.doAdvance(); let m=0; while(A.live&&!A.live.done&&m++<4000){ A.live.ask?A.answerLive(A.live.ask.dp.opts[A.live.ask.dp.opts.length-1][0]):A.liveTick() }
    const h=A.heroResult(), pm=String(h).match(/<div class="planpost">(.*?)<\/div>/), line=pm?strip(pm[1]):'';
    const has=A.flash&&A.S.planPre&&A.S.planPre[A.SEA.year+':'+A.flash.step]; if(!has){ continue }
    n++; if(line)shown++;
    const num=/no better than/.test(line)?'0':(line.match(/: ([+-]?\d+) before the game/)||[])[1];
    if(A.plan!=='balanced'&&C){ if(!line){bad++; console.log('  NO LINE',f,k,A.plan,card)} else if(+num!==want){bad++; console.log('  DIFF',f,k,line,'| want',want,'| card',card)} }
    out.push([A.SEA.step,line]) }
  if(n-n0<4){bad++; console.log('  only',n-n0,'games judged',f)}
  // the kept numbers are in the save, so a reload reads the same line
  { const J=JSON.parse(A.saveText(A.S)); if(JSON.stringify(J.planPre)!==JSON.stringify(A.S.planPre)){bad++; console.log('  NOT SAVED',f)} }
}
console.log(`${n} games, ${shown} with a line, ${bad} wrong`); console.log(bad?'MISMATCH':'MATCH');
