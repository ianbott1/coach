/* Soccer's monthly awards (round 81, Ian: "goals and player of the month"). Fourteen weeks of a career: each month done
   has a Player of the Month from your division whose month in his game log adds up to the line shown, and a Goal of the
   Month that is one of your own goals in a game you watched; the home screen shows the month just ended for two weeks.
     node test/months.js          last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js'); let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const A=load({file:path.join(process.env.DIST||path.join(__dirname,'..','dist'),'soccer-coach.html'),expose:['S','SEA','CONF','newDynasty','doAdvance','live','liveTick','answerLive','epMonthsDone','epPlayerOfMonth','epGoalOfMonth','epMonthRace','glStride']});
A.newDynasty('Arsenal',5,'T'); let hubSeen=0;
for(let w=0;w<14;w++){ A.doAdvance(); let n=0; while(A.live&&!A.live.done&&n++<6000){ A.live.ask?A.answerLive(A.live.ask.dp.opts[0][0]):A.liveTick() } if(A.epMonthRace(A.S.myTeam))hubSeen++ }
const D=A.epMonthsDone(); ok(D.length>=3,`months done after 14 weeks: ${D.map(m=>m.m).join(', ')}`);
D.forEach(mo=>{ const p=A.epPlayerOfMonth(mo), g=A.epGoalOfMonth(mo);
  ok(p&&A.CONF[p.t]===A.CONF[A.S.myTeam],`${mo.m}: player of the month ${p&&p.p.n} (${p&&p.t}) is in your division`);
  if(p){ const set=new Set(mo.steps), w=A.glStride(); let goals=0; for(let r=0;r<p.p.gl.length;r+=w)if(set.has(p.p.gl[r]))goals+=p.p.gl[r+6]||0; ok(p.pos==='GK'||goals===(p.tot.goals||0),`${mo.m}: his ${p.tot.goals||0} goals are in his game log (${goals})`) }
  ok(!g||(g.e.side===(g.g.home===A.S.myTeam?'home':'away')&&g.g.drives),`${mo.m}: goal of the month ${g?g.e.nm+' '+g.e.m+"'":'(none)'} is yours, from a game you watched`) });
ok(hubSeen>=4,`the home screen showed the month just ended on ${hubSeen} weeks`);
console.log(bad?`MISMATCH ${bad}`:'MATCH the monthly awards are true'); process.exit(bad?1:0);
