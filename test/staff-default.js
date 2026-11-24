/* The summer plan's hire is the candidate rated best of those shown (round 107, Instinct: the plan had picked a man
   marked "in over his head", and the season began at -37 with a prompt to fire him). Fire the hitting coach (baseball)
   or an assistant mid-season, play the season out, and look at the plan's pick; then at who starts next season.
     node test/staff-default.js [distDir]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const DIR=process.argv[2]||process.env.DIST||path.join(__dirname,'..','dist'); let bad=0, seen=0;
const RANK=["in over his head","unproven","solid","highly regarded","one of the best"], rk=g=>{ for(let i=RANK.length-1;i>=0;i--)if(String(g).indexOf(RANK[i])===0)return i; return 1 };
for(const [f,team] of [['baseball-coach-pro.html','Seattle'],['football-coach.html','Alabama'],['hockey-coach-pro.html','Vegas'],['basketball-coach-pro.html','Orlando']]) for(const seed of [5,6,7]){
  const A=load({file:path.join(DIR,f),expose:['S','SEA','U','newDynasty','doAdvance','live','liveTick','answerLive','skipLive','fireCoord','openOffseason','commitOffseason','simAdvance']});
  A.newDynasty(team,seed,'T');
  const play=n=>{ for(let k=0;k<n&&A.SEA.phase!=="done";k++){ const s0=A.SEA.step; A.doAdvance(); let m=0; while(A.live&&!A.live.done&&m++<5000){ if(A.live.ask){A.answerLive(A.live.ask.dp.opts[0][0]);continue} A.skipLive() } if(A.S.off)break } };
  play(3); try{ A.fireCoord('oc') }catch(e){} play(999); if(!A.S.off)A.openOffseason();
  const L=A.S.off&&A.S.off.staff&&A.S.off.staff.oc; if(!L){ console.log(`  --   ${f} ${seed}: no hire to make`); continue } seen++;
  const pick=A.S.off.picks.oc==null?0:A.S.off.picks.oc, best=Math.max(...L.map(c=>rk(c.grade)));
  const ok=rk(L[pick].grade)===best; if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f} ${seed}: candidates ${L.map(c=>c.grade.split(' ').slice(0,3).join(' ')).join(' / ')}; the plan picks the ${['first','second','third'][pick]} (${L[pick].grade})`) }
const ok=!bad&&seen>0; console.log(ok?'MATCH the summer plan hires the candidate rated best':'MISMATCH '+bad); process.exit(ok?0:1);
