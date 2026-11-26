/* A shared seat replays every coach's moves (round 84). Two coaches in pro basketball: each promotes a backup and
   each makes a trade on his own turn; play on; a reload gives back the same season (records, both rosters, every
   club's strength). Before round 84 a reload replayed only the coach whose turn it was: the other's promotion was
   lost (his strength came back 19 elo off) and trades were off in a shared seat.
     node test/hotseat-moves.js     last line: MATCH or MISMATCH */
const {chromium}=require('playwright'),path=require('path');(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),'basketball-coach-pro.html'));await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const A='Boston',B='New York';newDynasty(A,99,'A',[{team:A,name:'A'},{team:B,name:'B'}]);S.title=false;S.guide=false;
  const step=()=>{doAdvance();let g=0;while(live&&!live.done&&g++<8000){live.ask?answerLive(live.ask.dp.opts[0][0]):liveTick()}};
  const did={}, log=[]; let n=0; const FO=()=>!!(LEAGUE.trade.on&&LEAGUE.trade.on());
  while(n++<260&&SEA.phase==="week"&&SEA.step<=ctDeadline()+2){ const t=S.turn||0;
    if(SEA.step>=4&&!did['p'+t]){ promote(0); did['p'+t]=1; log.push(`${S.myTeam} promoted (step ${SEA.step})`) }
    // pro basketball's front office (Nov 2026) trades through its own machine (leagues/nba 98_fo_trades)
    if(SEA.step>=8&&!did['t'+t]&&(FO()?ntState():tdState()).open){ const R=SEA.roster[S.myTeam]; for(let i=0;i<R.length&&!did['t'+t];i++){ const O=FO()?ntShop(i):tdOffers(i); if(O.length){ const d=O[0]; FO()?ntDo(d):tdDo(d); did['t'+t]=1; const nm=x=>[].concat(x).map(q=>q.n).join('+'); log.push(`${S.myTeam} traded ${nm(d.give)} to ${d.t} for ${nm(d.get)} (step ${SEA.step})`) } } }
    step() }
  const snap=()=>JSON.stringify([SEA.rec,NAMES.map(t=>SEA.roster[t].map(q=>q&&q.n)),NAMES.map(t=>Math.round(SEA.talent.base[t]*1000))]);
  const a=snap(); stashCoach(); rebuild(); const c=snap();
  const cpu=(SEA.cpuTr||[]), humanIn=cpu.some(x=>[A,B].indexOf(x.my)>=0||[A,B].indexOf(x.t)>=0);   // round 85: the computer's deadline deals leave both coaches alone
  return {log,step:SEA.step,same:a===c,moves:Object.keys(did).length,cpu:cpu.length,humanIn}});
console.log(r.log.join('\n')); await b.close(); console.log(`computer deadline deals: ${r.cpu}, a coach's club in one: ${r.humanIn}`); const bad=!r.same||r.moves<4||r.humanIn||errs.length;
console.log(bad?`MISMATCH same=${r.same} moves=${r.moves} ${errs.join(' | ')}`:`MATCH a reload replays both coaches' promotions and trades (${r.step} steps)`);process.exit(bad?1:0)})();
