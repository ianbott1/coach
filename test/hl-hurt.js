/* A hurt man isn't in a clip (round 97; Grokbot: an injured player still on the ice). Live games in each game with clips:
   every name in a clip's key, both sides, against that night's injury list. Before the fix, hockey 144 of 900 clips,
   soccer 65 of 237, pro football 80 of 343 named a hurt man.
     node test/hl-hurt.js [game prefix]    last line: MATCH or MISMATCH */
const path=require('path'); const {load}=require('./harness.js');
const D=f=>path.join(process.env.DIST||path.join(__dirname,'..','dist'),f);
const GAMES=[['hockey-coach-pro.html','Vegas',30],['soccer-coach.html','Arsenal',30],['football-coach-pro.html','Denver',14],['football-coach.html','Alabama',12],
  ['basketball-coach-pro.html','Orlando',20],['baseball-coach-pro.html','Seattle',30]];
const only=process.argv[2]; let bad=0;
for(const [f,team,N] of GAMES){ if(only&&!f.startsWith(only))continue;
  const A=load({file:D(f),settable:['live'],expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','HL_SPORT']});
  A.newDynasty(team,5,'T'); let games=0,clips=0,hit=0,hurtG=0; const ex=[];
  for(let g=0;g<N&&A.SEA.phase==='week';g++){ A.doAdvance(); if(!A.live)continue; games++;
    const hurt={}; [A.live.g.home,A.live.g.away].forEach(t=>{ const R=A.SEA.roster[t]; hurt[t]=new Set(A.SEA.talent.active(t).map(x=>R[x.idx]&&String(R[x.idx].n).split(' ').slice(-1)[0]).filter(Boolean)) });
    if(Object.values(hurt).some(h=>h.size))hurtG++;
    let m=0,seen=0; while(A.live&&!A.live.done&&m++<4000){ if(A.live.ask){ A.answerLive(A.live.ask.dp.opts[A.live.ask.dp.opts.length-1][0]); continue }
      A.liveTick(); const L=A.live; if(!L||!L.drives)continue;
      for(;seen<L.drives.length;seen++){ let cs=[]; try{ cs=A.HL_SPORT.clips(L,L.drives[seen],'all')||[] }catch(e){}
        cs.forEach(c=>{ clips++; (c.legend||[]).forEach(l=>(l.list||[]).forEach(x=>{ const n=Array.isArray(x)?x[1]:x; if(n&&hurt[l.team]&&hurt[l.team].has(n)){ hit++; if(ex.length<3)ex.push(l.team+' '+n) } })) }) } } }
  const ok=hit===0&&hurtG>0&&clips>50; if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${games} games (${hurtG} with someone hurt), ${clips} clips, ${hit} naming a hurt man${ex.length?' | '+ex.join(', '):''}`) }
console.log(bad?'MISMATCH':'MATCH');
