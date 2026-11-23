/* Round 99 (Instinct: 12-1 Miami was told "Season over" after the ACC final, then seeded 2nd with a bye): a conference
   title game is played before the playoff field is picked, so a loss there doesn't end the season on the card.
   Fails on 6473dcb.   node test/cfb-conf.js [file]    last line: MATCH or MISMATCH */
const {load}=require('./harness.js');
const file=process.argv[2]||require('path').join(process.env.DIST||require('path').join(__dirname,'..','dist'),'football-coach.html');
let shown=0,bad=0;
/* engine 20 moved live games, so the old seeds stopped reaching a title-game loss (round 106): try seeds until each
   team has lost one, as two-point.js hunts its calls */
for(const t of ['Ohio State','Miami']) for(let seed=1;seed<=30;seed++){
  const A=load({file,settable:['live','flash'],expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','heroResult','flash','endLive','finishLive']});
  try{ A.newDynasty(t,seed,'T') }catch(e){ continue }
  for(let k=0;k<40;k++){ A.doAdvance(); if(A.live){ let m=0; while(A.live&&!A.live.done&&m++<4000){ A.live.ask?A.answerLive(A.live.ask.dp.opts[A.live.ask.dp.opts.length-1][0]):A.liveTick() } }
    const my=A.S.myTeam, tg=(A.SEA.titles||[]).find(g=>g&&(g.home===my||g.away===my)&&g.winner); if(tg&&tg.winner!==my&&A.flash){ const f={g:tg}; const h=String(A.heroResult()).replace(/<[^>]+>/g,' ').replace(/\s+/g,' '); const m=h.match(/(Season over[^.]*|Beaten in the [^.]*\. The playoff field is picked next)/); if(!m||/Season over/.test(m[0]))bad++; console.log(t,'seed',seed,'lost',f.g.title,'|',m?m[0]:'(no line)'); shown++; seed=99; break }
    if(tg||A.SEA.phase==='done')break } }
console.log(shown,'conference title losses seen'); console.log(shown>=2&&bad===0?'MATCH':'MISMATCH')
