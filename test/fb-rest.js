/* Round 99 (Muse: after "rest your starters" the clips still named the starters): from the drive after you rest them, your
   side's men in a clip are the backups. College football, two clubs that rest often. Fails on 6473dcb (32 starters named).
     node test/fb-rest.js    last line: MATCH or MISMATCH */
const path=require('path'); const {load}=require('./harness.js');
const file=path.join(process.env.DIST||path.join(__dirname,'..','dist'),'football-coach.html'); let bad=0,tot=0,rests=0;
for(const team of ['Georgia','Ohio State']){
  const A=load({file,settable:['live'],expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','HL_SPORT','BK']});
  A.newDynasty(team,5,'T'); let after=0,stN=0,bkN=0;
  for(let g=0;g<14&&A.SEA.phase==='week';g++){ A.doAdvance(); if(!A.live)continue; let restIdx=null, seen=0;
    const my=A.S.myTeam, R=A.SEA.roster[my], sur=i=>R[i]&&String(R[i].n).split(' ').slice(-1)[0], st=new Set([0,1,2,3,8].map(sur)), bk=new Set([0,1,2,3,8].map(i=>sur(A.BK(i))));
    let m=0; while(A.live&&!A.live.done&&m++<4000){ const L=A.live; if(L.ask){ const dp=L.ask.dp; if(dp.k==='rest'&&dp.opts.some(o=>o[0]==='rest')){ A.answerLive('rest'); rests++; restIdx=L.drives.length } else A.answerLive(dp.opts[dp.opts.length-1][0]); continue }
      A.liveTick(); const D=A.live.drives; for(;seen<D.length;seen++){ const d=D[seen]; if(restIdx==null||seen<restIdx||(d.home?A.live.g.home:A.live.g.away)!==my)continue;
        (A.HL_SPORT.clips(A.live,d,'all')||[]).forEach(c=>{ after++; (c.legend||[]).forEach(l=>{ if(l.team!==my)return; l.list.forEach(x=>{ if(st.has(x[1])&&!bk.has(x[1]))stN++; if(bk.has(x[1]))bkN++ }) }) }) } } }
  tot+=after; if(stN)bad++; console.log(`  ${team}: ${after} clips of your drives after a rest, starters named ${stN}, backups named ${bkN}`) }
if(!tot){ bad++; console.log('  no clips after a rest') }
console.log(bad?'MISMATCH':'MATCH');
