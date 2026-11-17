/* A shared seat replays every coach's moves (round 84). Two coaches in pro basketball: each promotes a backup and
   each makes a trade on his own turn; play on; a reload gives back the same season (records, both rosters, every
   club's strength). Before round 84 a reload replayed only the coach whose turn it was: the other's promotion was
   lost (his strength came back 19 elo off) and trades were off in a shared seat.
     node test/hotseat-moves.js     last line: MATCH or MISMATCH */
const {chromium}=require('playwright'),path=require('path');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),'basketball-coach-pro.html'));await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const A='Boston',B='New York';newDynasty(A,99,'A',[{team:A,name:'A'},{team:B,name:'B'}]);S.title=false;S.guide=false;
  const step=()=>{doAdvance();let g=0;while(live&&!live.done&&g++<8000){live.ask?answerLive(live.ask.dp.opts[0][0]):liveTick()}};
  const did={}, log=[]; let n=0;
  while(n++<140&&SEA.phase==="week"){ const t=S.turn||0;
    if(SEA.step>=4&&!did['p'+t]){ promote(0); did['p'+t]=1; log.push(`${S.myTeam} promoted (step ${SEA.step})`) }
    if(SEA.step>=8&&!did['t'+t]&&tdState().open){ const R=SEA.roster[S.myTeam]; for(let i=0;i<R.length&&!did['t'+t];i++){ const O=tdOffers(i); if(O.length){ const d=O[0]; tdDo(d); did['t'+t]=1; log.push(`${S.myTeam} traded ${d.give.n} to ${d.t} for ${d.get.n} (step ${SEA.step})`) } } }
    step() }
  const snap=()=>JSON.stringify([SEA.rec,NAMES.map(t=>SEA.roster[t].map(q=>q&&q.n)),NAMES.map(t=>Math.round(SEA.talent.base[t]*1000))]);
  const a=snap(); stashCoach(); rebuild(); const c=snap();
  return {log,step:SEA.step,same:a===c,moves:Object.keys(did).length}});
console.log(r.log.join('\n')); await b.close(); const bad=!r.same||r.moves<4||errs.length;
console.log(bad?`MISMATCH same=${r.same} moves=${r.moves} ${errs.join(' | ')}`:`MATCH a reload replays both coaches' promotions and trades (${r.step} steps)`);process.exit(bad?1:0)})();
