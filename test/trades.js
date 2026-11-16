/* In-season trades (round 83). In a real browser, the five pro games:
   - the Trades tab: offers for one of yours, what a club would take for one of theirs; a trade done by two taps
   - both rosters change, both strengths move by the change in rosterElo, the trade is kept and a reload plays it again
   - the same question gets the same answer (no dice); nothing after the deadline or outside the window
   - a club won't be fleeced: a coach who takes the best offer every chance he gets, to the deadline, gains this much
   - next season starts with the traded men where they went, their seasons in their careers
     node test/trades.js [--fleece]      last line: MATCH or MISMATCH */
const {chromium}=require('playwright'),path=require('path');
const G=process.env.ONLY?[[process.env.ONLY,process.env.TEAM]]:[['football-coach-pro.html','Kansas City'],['basketball-coach-pro.html','Boston'],['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
const FLEECE=process.argv.includes('--fleece');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('  FAIL',m)}};
for(const [f,team] of G){const p=await b.newPage({viewport:{width:1265,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),f));await p.waitForTimeout(400);
// to an open day: soccer waits for January
const r=await p.evaluate(([team])=>{newDynasty(team,5,'T');S.title=false;S.guide=false;
  let n=0; while(!tdState().open&&SEA.phase==="week"&&n<400){simAdvance();n++} if(!tdState().open)return {err:'never open: '+tdState().why};
  for(let i=0;i<3;i++)simAdvance();
  const my=S.myTeam, R=SEA.roster[my];
  let shops=0, offers=0; R.forEach((p,i)=>{ if(!p)return; shops++; offers+=tdOffers(i).length });
  const C=tdClubs(), t=C[3], ask=SEA.roster[t].map((q,b)=>q?tdAsk(t,b).list.length:0);
  const same=JSON.stringify(tdOffers(0).map(d=>[d.t,d.b]))===JSON.stringify(tdOffers(0).map(d=>[d.t,d.b]));
  return {step:SEA.step,date:LEAGUE.dates[SEA.step],why:tdState().why,shops,offers,asked:ask.length,askYes:ask.filter(x=>x).length,same,clubs:C.length}},[team]);
if(r.err){console.log(f,r.err);bad++;await p.close();continue}
console.log(f.padEnd(26),`${r.date} (${r.why}) offers ${r.offers} for ${r.shops} players; of one club's ${r.asked}, ${r.askYes} could be had; ${r.clubs} clubs`);
ok(r.offers>0,'some offers'); ok(r.askYes>0,'some of a club\'s men could be had'); ok(r.same,'the same question, the same answer');
// a trade by two taps in the Trades tab
await p.evaluate(()=>{view='team';teamTab='trades';TD_UI={};render()});
const shopBtn=await p.evaluate(()=>{const R=SEA.roster[S.myTeam];for(let i=0;i<R.length;i++)if(R[i]&&tdOffers(i).length)return i;return -1});
await p.click(`[data-tdshop="${shopBtn}"]`);await p.waitForTimeout(60);
const pre=await p.evaluate(()=>{const d=tdOffers(TD_UI.shop)[0];return {t:d.t,a:d.a,b:d.b,gn:d.give.n,qn:d.get.n,bm:SEA.talent.base[S.myTeam],bt:SEA.talent.base[d.t],em:rosterElo(SEA.roster[S.myTeam]),et:rosterElo(SEA.roster[d.t]),now:d.now}});
await p.click('[data-tdgo]');await p.waitForTimeout(40);await p.click('[data-tdgo]');await p.waitForTimeout(80);
const post=await p.evaluate(([x])=>{const M=SEA.roster[S.myTeam],T=SEA.roster[x.t];return {mineHas:M.some(q=>q&&q.n===x.qn),theyHave:T.some(q=>q&&q.n===x.gn),dm:SEA.talent.base[S.myTeam]-x.bm-(rosterElo(M)-x.em),dt:SEA.talent.base[x.t]-x.bt-(rosterElo(T)-x.et),done:document.body.innerText.includes('Done.'),log:JSON.stringify(S.promos)}},[pre]);
ok(post.mineHas&&post.theyHave,`${pre.gn} to ${pre.t}, ${pre.qn} to you`); ok(Math.abs(post.dm)<1e-6&&Math.abs(post.dt)<1e-6,`both strengths move by the change in rosterElo (${post.dm}, ${post.dt})`);
ok(post.done,'the tab says it is done'); ok(/"tr":/.test(post.log),'kept in the save');
// a reload plays it again, 20 steps on
const rl=await p.evaluate(()=>{for(let i=0;i<20&&SEA.phase==="week";i++)simAdvance();const snap=()=>JSON.stringify([SEA.rec,NAMES.map(t=>SEA.roster[t].map(q=>q&&q.n)),NAMES.map(t=>Math.round(SEA.talent.base[t]*1000))]);
  const a=snap(); rebuild(); return a===snap()});
ok(rl,'a reload gives back the same season, trade and all');
// after the deadline (or the window): closed
const shut=await p.evaluate(()=>{let n=0;while(tdState().open&&SEA.phase==="week"&&n<300){simAdvance();n++} return {open:tdState().open,why:tdState().why,tab:(view='team',teamTab='trades',render(),!document.querySelector('[data-tdshop]'))}});
ok(!shut.open&&shut.tab,'closed after the deadline: '+shut.why);
// next season: the traded men where they went, their seasons banked
const S_TEAM=()=>team;
const nx=await p.evaluate(([x])=>{ const orig=tdCarry; let carried=null; tdCarry=function(u){ orig(u); carried={mine:u.roster[S.myTeam].some(q=>q&&q.n===x.qn),theirs:u.roster[x.t].some(q=>q&&q.n===x.gn)} }; const run0=LEAGUE.offseason.run; let banked=null; LEAGUE.offseason.run=function(u,...rest){ const q=u.roster[S.myTeam].find(q=>q&&q.n===x.qn); banked=q&&q.hist?q.hist.slice(-1)[0]:null; LEAGUE.offseason.run=run0; return run0.call(this,u,...rest) }; let n=0;while(SEA.phase!=="done"&&n<500){simAdvance();n++} try{ openOffseason(); const O=S.off; if(O&&O.act&&O.act.userOpen)O.move=S.myTeam;
    if(LEAGUE.ui.offseasonBlock()!==null&&O.picks&&O.picks.resign)Object.keys(O.picks.resign).forEach(k=>O.picks.resign[k]=false);   // under the cap: let the expiring go
    commitOffseason() }catch(e){return {err:'offseason '+e.message}}
  const inU=(t,nm)=>U.roster[t]&&U.roster[t].some(q=>q&&q.n===nm);
  let g=null; NAMES.forEach(t=>{ const q=U.roster[t].find(q=>q&&q.n===x.qn); if(q)g=q });
  const where=NAMES.filter(t=>U.roster[t].some(q=>q&&q.n===x.gn)); const H=S.history[S.history.length-1], L=H&&H.league; const fate=L?['released','retired','signed','resigned','left','gone'].filter(k=>JSON.stringify(L[k]||'').includes(x.gn)):[];
  return {banked,carried,where,fate,block:LEAGUE.ui.offseasonBlock&&S.off?LEAGUE.ui.offseasonBlock():null,year:SEA.year,phase:SEA.phase,mine:inU(S.myTeam,x.qn),theirs:inU(x.t,x.gn),hist:g&&g.hist?g.hist.slice(-1)[0]:null}},[pre]);
console.log('   next season:',JSON.stringify(nx).slice(0,300)); ok(nx.carried&&nx.carried.mine&&nx.carried.theirs,'at the season\'s end the traded men are put where they went'); if(!(nx.mine&&nx.theirs))console.log('   (one has moved on in the offseason since: '+nx.where.join(', ')+')'); ok(nx.banked&&nx.banked.t===S_TEAM(nx)&&nx.banked.s&&nx.banked.s.g>0,'his season banked with the club he finished with');
// fleece: the best offer every chance, to the deadline, in a fresh career
if(FLEECE){ const fl=await p.evaluate(([team])=>{newDynasty(team,7,'F');S.title=false;S.guide=false;let n=0; while(!tdState().open&&SEA.phase==="week"&&n<400){simAdvance();n++}
  const r0=teamRating(SEA.roster[S.myTeam]), b0=SEA.talent.base[S.myTeam]; let k=0, fut=0;
  while(tdState().open&&SEA.phase==="week"){ const R=SEA.roster[S.myTeam]; let best=null; R.forEach((q,i)=>{ if(!q)return; tdOffers(i).forEach(d=>{ if(d.now>0&&(!best||d.now>best.now))best=d }) });
    if(best){fut+=best.fut;tdDo(best);k++} else simAdvance() }
  return {k,fut,gain:teamRating(SEA.roster[S.myTeam])-r0}},[team]);
  console.log('   fleece:',`${fl.k} trades, team rating ${fl.gain>=0?'+':''}${fl.gain.toFixed(2)} now, ${fl.fut>=0?'+':''}${fl.fut.toFixed(2)} in two years`) }
ok(!errs.length,'page errors: '+errs.slice(0,2).join(' | '));
await p.close()}
await b.close();console.log(bad?'MISMATCH '+bad:'MATCH trades in the season: offers, asks, kept, replayed, shut at the deadline');process.exit(bad?1:0)})();
