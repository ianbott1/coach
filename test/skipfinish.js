/* Skip stops for a close finish (round 79, Ian: Skip jumped to the final of a one-score game). Every game, a few weeks:
   tap Skip whenever the game is running (calls answered); count the games that came into the late window close, and
   how many of those Skip stopped in, before the final, for the finish to be watched.
     node test/skipfinish.js          last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const DIR=process.env.DIST||path.join(__dirname,'..','dist');
const GAMES=[['football-coach.html','Alabama'],['football-coach-pro.html','Kansas City'],['basketball-coach.html','Duke'],['basketball-coach-pro.html','Boston'],['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
let bad=0;
const lateClose=(A,L)=>{ const F=A.SPORT.lateFloor, D=L.drives||[], d=D[D.length-1]; if(!F||!d||!F.late(D,d))return false; return Math.abs(((d.sh!==undefined?d.sh:d.h)||0)-((d.sa!==undefined?d.sa:d.a)||0))<=F.close };
for(const [f,t] of GAMES){ const A=load({file:path.join(DIR,f),expose:['S','SEA','SPORT','newDynasty','doAdvance','live','liveTick','answerLive','skipLive']});
  A.newDynasty(t,5,'T'); let close=0, stopped=0, games=0;
  for(let w=0;w<10;w++){ A.doAdvance(); if(!A.live)continue; games++; let wasStop=false, sawClose=false, jumped=false, m=0;
    while(A.live&&!A.live.done&&m++<3000){ if(A.live.ask){ A.answerLive(A.live.ask.dp.opts[0][0]); continue }
      if(!A.live.ffLate){ const L=A.live; A.skipLive();
        if(!L.done&&(L.ask||L.ffLate)&&lateClose(A,L))wasStop=true;   // stopped in the late window, close: by the finish rule or a call
        else if(L.done&&!wasStop){ const D=L.drives, d=D[D.length-1], F=A.SPORT.lateFloor; if(d&&Math.abs(((d.sh!==undefined?d.sh:d.h)||0)-((d.sa!==undefined?d.sa:d.a)||0))<=F.close){ sawClose=true; jumped=true } } }
      else A.liveTick();
      if(A.live&&lateClose(A,A.live))sawClose=true }
    if(sawClose){ close++; if(!jumped)stopped++ } }
  const ok=close===0||stopped===close; if(!ok)bad++;
  console.log(`  ${ok?'ok  ':'FAIL'} ${f}: ${games} games, ${close} close in the late window, Skip stopped for ${stopped} (or a call stopped it there)`) }
console.log(bad?`MISMATCH ${bad}`:'MATCH Skip stops for a close finish'); process.exit(bad?1:0);
