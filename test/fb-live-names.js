/* A live football game names who's playing (round 100; Grokbot: a receiver out for 14 weeks caught a 64-yard
   touchdown). The run of play's line for each drive, as the page draws it while the game is played, against the line
   the finished game keeps (credited by the season: an injured starter's backup). Before the fix, 12 of 1278 lines in
   pro football named the injured man live and his backup afterwards (the touchdown clip reads the live line).
     node test/fb-live-names.js    last line: MATCH or MISMATCH */
const path=require('path'); const {load}=require('./harness.js');
const D=f=>path.join(process.env.DIST||path.join(__dirname,'..','dist'),f);
let bad=0;
for(const [f,team,N,seeds] of [['football-coach-pro.html','Green Bay',17,[5,11]],['football-coach.html','Alabama',12,[5,11,17]]]){
  const A=load({file:D(f),settable:['live'],expose:['driveScript','S','SEA','newDynasty','doAdvance','live','liveTick','answerLive']});
  let games=0,lines=0,diff=0,hurtG=0; const ex=[];
  for(const seed of seeds){ A.newDynasty(team,seed,'T');
    for(let g=0;g<N&&A.SEA.phase==='week';g++){ A.doAdvance(); if(!A.live)continue; games++;
      if([A.live.g.home,A.live.g.away].some(t=>A.SEA.talent.active(t).length))hurtG++;
      const at=[]; let m=0,seen=0; while(A.live&&!A.live.done&&m++<4000){ if(A.live.ask){ A.answerLive(A.live.ask.dp.opts[0][0]); continue } A.liveTick(); const L=A.live; if(!L||!L.drives)continue;
        for(;seen<L.drives.length;seen++){ const sc=A.driveScript(L.g,L.drives.slice(0,seen+1)); at.push((sc[sc.length-1]||{}).text) } }
      const after=A.driveScript(A.live.g,A.live.drives).map(x=>x.text);
      at.forEach((t,i)=>{ lines++; if(t!==after[i]){ diff++; if(ex.length<3)ex.push(`seed ${seed} game ${g}: live "${t}", after "${after[i]}"`) } }) } }
  const ok=diff===0&&hurtG>3&&lines>300; if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${games} games (${hurtG} with someone hurt), ${lines} lines, ${diff} differ${ex.length?' | '+ex.join('; '):''}`) }
console.log(bad?'MISMATCH':'MATCH');
