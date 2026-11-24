/* A read that answers a style the card marks is never graded wrong (round 107, Grokbot: two marks on the card and a
   hard cross; soccer's card marked crosses and the grade went by going long). Each read is answered with a marked
   style other than the best fit when there is one; those reads must come back as fitting the evidence.
     node test/read-marks.js [distDir]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const DIR=process.argv[2]||process.env.DIST||path.join(__dirname,'..','dist'); let bad=0;
const G=[['soccer-coach.html','Southampton','COUNTERS'],['basketball-coach-pro.html','Orlando','DEFENSES'],['basketball-coach.html','Minnesota','DEFENSES'],['hockey-coach-pro.html','Florida','ANSWERS']];
for(const [f,t,AN] of G){ const A=load({file:path.join(DIR,f),expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','readFlags',AN]});
  A.newDynasty(t,9,'T'); let reads=0, marked=0, alt=0, ok=0, wrongNow=0; const ex=[];
  for(let w=0;w<14;w++){ A.doAdvance(); if(!A.live)continue; let m=0; const mine=[];
    while(A.live&&!A.live.done&&m++<5000){ const L=A.live; if(L.ask){ const dp=L.ask.dp; let pick=dp.opts[0][0];
        if(dp.k==="read"&&dp.tell){ reads++; const fl=A.readFlags(dp), AW=A[AN]; if(fl.length)marked++;
          const o=dp.opts.map(x=>x[0]).find(k=>AW[k]&&fl.includes(AW[k].beats)&&AW[k].beats!==dp.best);
          if(o){ pick=o; alt++ } mine.push(!!o) }
        A.answerLive(pick); continue } A.liveTick() }
    const P=Object.values(A.S.played||{}).flat().filter(p=>p.team===A.S.myTeam); const last=P[P.length-1];
    ((last&&last.reads)||[]).filter(x=>x.k==="read").forEach((x,i)=>{ if(!mine[i])return; const AW=A[AN], b=AW[x.pick]&&AW[x.pick].beats; if(b&&b!==x.evid&&!x.right){ if(x.fe)ok++; else { wrongNow++; if(ex.length<2)ex.push(JSON.stringify(x).slice(0,160)) } } }) }
  const pass=alt>0&&wrongNow===0; if(!pass)bad++;
  console.log(`${pass?'  ok  ':'  FAIL'} ${f}: ${reads} reads, ${marked} with a mark, ${alt} answered by a marked style that isn't the best fit; wrong on the night and still graded wrong: ${wrongNow} (said as fitting the evidence: ${ok}) ${ex.join(' ')}`) }
console.log(bad?`MISMATCH ${bad}`:'MATCH a read answering a marked style is never graded wrong'); process.exit(bad?1:0);
