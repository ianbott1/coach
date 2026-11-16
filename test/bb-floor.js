/* Basketball's clips put the right men on the floor (round 80, Ian: rotations). A few weeks of live games, both games:
   the shooter's dot wears the name the clip gives him; the bench plays its share (some clip in most games has a
   backup on the floor who isn't shooting); the last shot goes to the starters.
     node test/bb-floor.js          last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js'); let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
for(const [f,team] of [['basketball-coach.html','Duke'],['basketball-coach-pro.html','Boston']]){
  const A=load({file:path.join(process.env.DIST||path.join(__dirname,'..','dist'),f),expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','HL_SPORT']});
  A.newDynasty(team,5,'T'); const o={clips:0,shooterOk:0,benchOn:0};
  for(let w=0;w<10;w++){ A.doAdvance(); let n=0; while(A.live&&!A.live.done&&n++<6000){ A.live.ask?A.answerLive(A.live.ask.dp.opts[0][0]):A.liveTick() } }
  A.SEA.weeks.forEach(W=>W.games.forEach(g=>{ if(!g.drives)return; g.drives.forEach(d=>{ A.HL_SPORT.clips({g,drives:g.drives},d,'all').forEach(c=>{ o.clips++;
    const sh=c.an[c.rec[c.rec.length-1]]; if(!c.nm||(sh&&sh[1]===c.nm))o.shooterOk++;
    const R=A.SEA.roster[c.tm]||[], bench=new Set(R.slice(5,10).filter(Boolean).map(p=>String(p.n).split(' ').slice(-1)[0]));
    if(c.an.some((x,k)=>x&&k!==c.rec[c.rec.length-1]&&bench.has(x[1])))o.benchOn++ }) }) }));
  ok(o.clips>10&&o.shooterOk===o.clips,`${f}: the shooter wears his own name (${o.shooterOk} of ${o.clips})`);
  ok(o.benchOn>=0.12*o.clips,`${f}: the bench is on the floor in ${o.benchOn} of ${o.clips} clips`) }
console.log(bad?`MISMATCH ${bad}`:'MATCH basketball puts the right men on the floor'); process.exit(bad?1:0);
