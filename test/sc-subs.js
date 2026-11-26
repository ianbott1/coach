/* soccer (engine 22): your changes, any time. A change made at 30' freshens that unit from the next stretch, once; the
   bench is then yours (your assistant makes no change at 60' or 70'); a third is refused; begun again from the save (a reload) the game makes the same changes. With no change of yours your assistant still makes both.
     node test/sc-subs.js [dist]   last line: MATCH or MISMATCH */
// engine 26 replaced these changes with five in three windows (test/sc-manager.js): this checks the engine-22 path, which
// a season begun on engine 25 or before still plays
process.env.ENGINE_NOW=process.env.ENGINE_NOW||'25';
const path=require('path'); const {load}=require('./harness.js');
const DIST=process.argv[2]||path.join(__dirname,'..','dist'); let bad=0; const chk=(ok,m)=>{ console.log((ok?'  ok   ':'  FAIL ')+m); if(!ok)bad++ };
const EXP=['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','setSubMidGame','liveSubsLeft','startLive','save','load'];
function run(subs,carry){ const A=load({file:path.join(DIST,'soccer-coach.html'),expose:EXP}); A.newDynasty('Southampton',5,'T'); if(carry)A.S.planMid=JSON.parse(carry);
  for(let k=0;k<3&&!A.live;k++)A.doAdvance(); const L=A.live, side=L.userIsHome?'home':'away'; const E=[], left=[];
  let m=0; while(A.live&&!A.live.done&&m++<5000){ if(A.live.ask){A.answerLive(A.live.ask.dp.opts[A.live.ask.dp.opts.length-1][0]);continue}
    const n=A.live.drives.length; (subs[n]||[]).forEach(u=>{ A.setSubMidGame(u); left.push([n,A.liveSubsLeft()]) }); A.liveTick() }
  L.drives.forEach(d=>{ if(d.E)E.push(d.sub?d.sub[side]:[]) }); return {E,left,pm:L.pm.slice(),bench:L.eng.bench,subs:L.eng.S[side].subs,saved:JSON.stringify(A.S.planMid||{}),score:[L.eng.h,L.eng.a]} }
const base=run({}), mine=run({6:[1],15:[0,2]}), ht=run({9:[2]});
// with none of yours: the assistant's two (legs up at 60' and 70')
const up=(R,i,u)=>R.E[i].indexOf(u)>=0;
chk(base.subs===2&&[0,1,2].some(u=>up(base,12,u))&&[0,1,2].some(u=>up(base,14,u)), `your assistant makes his two when you make none (${base.subs})`);
chk(up(mine,6,1)&&!up(mine,5,1), `a change at 30' freshens the midfield from the next stretch (changes by stretch ${JSON.stringify(mine.E.map((x,i)=>x.length?i+':'+x:'').filter(Boolean))})`);
chk(![0,1,2].some(u=>up(mine,12,u)||up(mine,14,u)), 'the bench is yours after it: no change at 60\' or 70\'');
chk(up(mine,15,0)&&!up(mine,15,2)&&mine.subs===2, `two changes a match: the back at 75', the third refused (${mine.subs} made; left after each ${JSON.stringify(mine.left)})`);
const again=run({},mine.saved);
chk(JSON.stringify(again.E)===JSON.stringify(mine.E)&&again.score.join()===mine.score.join(), `the game begun again from the save makes the same changes at the same moments (${again.score.join('-')} as ${mine.score.join('-')})`);
chk(ht.E[9].length===1&&ht.E[9][0]===2&&ht.subs===1&&ht.left[0][1]===1, `a change at half-time, as its call comes, is made once (${JSON.stringify(ht.E[9])}, ${ht.subs} made, ${ht.left[0][1]} left)`);
console.log(bad?`MISMATCH ${bad} failed`:'MATCH your changes come when you make them'); process.exit(bad?1:0);
