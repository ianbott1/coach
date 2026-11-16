/* Hockey's clips put the right men on the ice (round 80, Ian: line changes, invisible passers). A few weeks of live games:
   in every goal clip with a named scorer the dot that shoots wears his number and name; the assist, when named, is on the
   ice and makes the last pass; the second line and pair play their share (chances too), and a fourth-line goal shows no
   names. No canvas needed: the clip carries its numbers.
     node test/hk-lines.js          last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const F=path.join(process.env.DIST||path.join(__dirname,'..','dist'),'hockey-coach-pro.html'); let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const A=load({file:F,expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','HL_SPORT','hkGoalNames','shirtNo']});
const o={goals:0,shooterOk:0,ast:0,astOn:0,astPass:0,clips:0,second:0,depth:0,depthBlank:0};
for(const team of ['Boston','Edmonton']){ A.newDynasty(team,5,'T');
  for(let w=0;w<10;w++){ A.doAdvance(); let n=0; while(A.live&&!A.live.done&&n++<6000){ A.live.ask?A.answerLive(A.live.ask.dp.opts[0][0]):A.liveTick() } }
  A.SEA.weeks.forEach(W=>W.games.forEach(g=>{ if(!g.drives)return; g.drives.forEach(d=>{ A.HL_SPORT.clips({g,drives:g.drives},d,'all').forEach(c=>{ if(c.so)return; o.clips++;
    const R=A.SEA.roster[c.tm]||[], P=6, second=[1,2,3,4,5].some(k=>{ const nm=c.an[k]&&c.an[k][1]; return nm&&R.some((p,i)=>p&&i>=P&&i<2*P&&String(p.n).split(' ').slice(-1)[0]===nm&&A.shirtNo(c.tm,i)===c.an[k][0]) }); if(second)o.second++;
    if(c.kind!=='goal')return; const N=A.hkGoalNames(c.tm,c.e); if(N.depth){ o.depth++; if(!c.an[3]&&!c.an[4]&&!c.an[5])o.depthBlank++; return }
    o.goals++; const sh=c.an[c.rec[c.rec.length-1]]; if(sh&&sh[1]===String(N.n).split(' ').slice(-1)[0])o.shooterOk++;
    if(N.a){ o.ast++; const an=String(N.a).split(' ').slice(-1)[0], k=c.an.findIndex(x=>x&&x[1]===an); if(k>0){ o.astOn++; if(c.rec.length>=2&&c.rec[c.rec.length-2]===k)o.astPass++ } } }) }) })) }
console.log(JSON.stringify(o));
ok(o.goals>20&&o.shooterOk===o.goals,`the shooter is the scorer (${o.shooterOk} of ${o.goals})`);
ok(o.astOn===o.ast,`the assist is on the ice (${o.astOn} of ${o.ast})`);
ok(o.astPass>=0.9*o.ast,`and makes the last pass (${o.astPass} of ${o.ast})`);
ok(o.second>=0.2*o.clips,`the second line or pair is out in ${o.second} of ${o.clips} clips`);
ok(o.depthBlank===o.depth,`fourth-line goals show no names (${o.depthBlank} of ${o.depth})`);
console.log(bad?`MISMATCH ${bad}`:'MATCH hockey puts the right men on the ice'); process.exit(bad?1:0);
