/* In-season trades (round 83). In a real browser, the five pro games:
   - the Trades tab: offers for one of yours, what a club would take for one of theirs; a trade done by two taps
   - both rosters change, both strengths move by the change in rosterElo, the trade is kept and a reload plays it again
   - the same question gets the same answer (no dice); nothing after the deadline or outside the window
   - a club won't be fleeced: a coach who takes the best offer every chance he gets, to the deadline, gains this much
   - next season starts with the traded men where they went, their seasons in their careers
     node test/trades.js [--fleece]      last line: MATCH or MISMATCH */
const {chromium}=require('playwright'),path=require('path');
const G=process.env.ONLY?[[process.env.ONLY,process.env.TEAM]]:[['football-coach-pro.html','Kansas City'],['basketball-coach-pro.html','Boston'],['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
const FLEECE=process.argv.includes('--fleece'), FL=[];
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('  FAIL',m)}};
for(const [f,team] of G){const p=await b.newPage({viewport:{width:1265,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),f));await p.waitForTimeout(400);
// to an open day: soccer waits for January
const r=await p.evaluate(([team])=>{newDynasty(team,5,'T');S.title=false;S.guide=false;if(LEAGUE.trade.on&&LEAGUE.trade.on())return {skip:1};   /* pro basketball's front office: its own trade machine, tested by nba-fo.js */
  let n=0; while(!tdState().open&&SEA.phase==="week"&&n<400){simAdvance();n++} if(!tdState().open)return {err:'never open: '+tdState().why};
  for(let i=0;i<3;i++)simAdvance();
  const my=S.myTeam, R=SEA.roster[my];
  let shops=0, offers=0; R.forEach((p,i)=>{ if(!p)return; shops++; offers+=tdOffers(i).length });
  const C=tdClubs(), t=C[3], ask=SEA.roster[t].map((q,b)=>q?tdAsk(t,b).list.length:0);
  const same=JSON.stringify(tdOffers(0).map(d=>[d.t,d.b]))===JSON.stringify(tdOffers(0).map(d=>[d.t,d.b]));
  return {step:SEA.step,date:LEAGUE.dates[SEA.step],why:tdState().why,shops,offers,asked:ask.length,askYes:ask.filter(x=>x).length,same,clubs:C.length}},[team]);
if(r.skip){console.log(f.padEnd(26),'its own trade machine: see test/nba-fo.js');await p.close();continue}
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
// two for two (round 84): four men move, both rosters whole, kept and replayed below with the rest
const pk=await p.evaluate(([x])=>{ const C=tdClubs(); let d=null; for(const t of C){ if(tdRecent(t)||t===x.t)continue; const R=SEA.roster[S.myTeam];
    for(let a=0;a<R.length&&!d;a++){ if(!R[a]||tdHurt(S.myTeam,a)||R[a].n===x.qn)continue; const L=tdPackages(t,a,null).filter(z=>z.give2.n!==x.qn); if(L.length)d=L[0] } if(d)break }
  if(!d)return {none:true}; const n0=SEA.roster[S.myTeam].filter(Boolean).length, nt=SEA.roster[d.t].filter(Boolean).length; tdDo(d);
  const M=SEA.roster[S.myTeam], T=SEA.roster[d.t];
  window.__pk={t:d.t,give:[d.give.n,d.give2.n],get:[d.get.n,d.get2.n]};
  return {moved:[d.get.n,d.get2.n].every(n=>M.some(q=>q&&q.n===n))&&[d.give.n,d.give2.n].every(n=>T.some(q=>q&&q.n===n)),whole:M.filter(Boolean).length===n0&&T.filter(Boolean).length===nt,
    line:`${d.give.n} and ${d.give2.n} to ${d.t} for ${d.get.n} and ${d.get2.n}`} },[pre]);
if(pk.none)console.log('   (no two for two this time)'); else { ok(pk.moved&&pk.whole,'two for two: four men move, both rosters whole ('+pk.line+')') }
// the other club's games before the trade still replay to their scores, with the box score's names
const wr=await p.evaluate(([x])=>{ let n=0,okk=0; for(let s=0;s<SEA.step;s++){ const W=SEA.weeks[s]; if(!W)continue; W.games.forEach(g=>{ if((g.home!==x.t&&g.away!==x.t)||g.home===S.myTeam||g.away===S.myTeam||g.hp===undefined)return; n++; try{ if(replayGame(g,s))okk++ }catch(e){} }) } return {n,okk} },[pre]);
ok(wr.n>0&&wr.okk===wr.n,`${pre.t}'s games before the trade still replay to their scores (${wr.okk} of ${wr.n})`);
// a reload plays it again, 20 steps on
const rl=await p.evaluate(()=>{for(let i=0;i<20&&SEA.phase==="week";i++)simAdvance();const snap=()=>JSON.stringify([SEA.rec,NAMES.map(t=>SEA.roster[t].map(q=>q&&q.n)),NAMES.map(t=>Math.round(SEA.talent.base[t]*1000))]);
  const a=snap(); rebuild(); return a===snap()});
ok(rl,'a reload gives back the same season, trade and all');
// an injured starter, his healthy backup traded for a better man: the new man starts, the injury stays with the injured
const inj=await p.evaluate(()=>{ const my=S.myTeam, R=SEA.roster[my]; let res=null;
  for(let s=0;s<POS.length&&!res;s++){ const k=BK(s); if(!R[s]||!R[k]||tdHurt(my,s)||tdHurt(my,k))continue;
    tdClubs().forEach(t=>{ if(res||tdRecent(t))return; SEA.roster[t].forEach((q,b)=>{ if(res||!q||tdGrp(b)!==tdGrp(k)||tdHurt(t,b)||q.r<=R[s].r)return;
      // their side too: the man they get must start for them, over a man of theirs we injure
      const T=SEA.roster[t], ts=b%POS.length, tk=BK(ts), other=b===ts?tk:ts; if(!T[other]||tdHurt(t,other)||R[k].r<=T[other].r)return;
      SEA.talent.inj[my].push({m:-1,w:9,k:POS[s].p,idx:s,who:R[s].n,rating:R[s].r}); SEA.talent.inj[t].push({m:-1,w:9,k:POS[ts].p,idx:other,who:T[other].n,rating:T[other].r});
      const d=tdDeal(t,k,b); if(!d||!d.yes){ SEA.talent.inj[my].pop(); SEA.talent.inj[t].pop(); return }
      const hm=R[s].n, ht=T[other].n; tdDo(d);
      const where=(tm,nm)=>{ const e=SEA.talent.active(tm).find(e=>e.who===nm); return e?SEA.roster[tm][e.idx]&&SEA.roster[tm][e.idx].n:null };
      res={mine:where(my,hm)===hm, theirs:where(t,ht)===ht, starts:SEA.roster[my][s].n===q.n, t:t};
      // round 87: the two injuries were put in by hand and aren't saved, so a reload's season would be another (on engine
      // 10 the deadline deals of the computer's clubs moved with it): out again before a game is played with them
      [my,t].forEach(tm=>{ const L=SEA.talent.inj[tm]; const j=L.findIndex(e=>e.m===-1&&e.w===9); if(j>=0)L.splice(j,1) }) }) }) }
  return res });
if(inj){ ok(inj.mine&&inj.theirs,`after a trade reorders a pair, each injury is still on the injured man (yours ${inj.mine}, ${inj.t}'s ${inj.theirs})`); ok(inj.starts,'the better man starts') }
else console.log('   (no deal found for the injury case this time)');
// after the deadline (or the window): closed
const shut=await p.evaluate(()=>{let n=0;while(tdState().open&&SEA.phase==="week"&&n<300){simAdvance();n++} return {open:tdState().open,why:tdState().why,tab:(view='team',teamTab='trades',render(),!document.querySelector('[data-tdshop]'))}});
ok(!shut.open&&shut.tab,'closed after the deadline: '+shut.why);
// next season: the traded men where they went, their seasons banked
const S_TEAM=()=>team;
const nx=await p.evaluate(([x])=>{ const orig=tdCarry; let carried=null; tdCarry=function(u){ orig(u); carried={mine:u.roster[S.myTeam].some(q=>q&&q.n===x.qn),theirs:u.roster[x.t].some(q=>q&&q.n===x.gn)}; const pr=u.roster[S.myTeam], pi=pr.findIndex(q=>q&&q.n===x.qn); const K=window.__pk; carried.pk=!K||(K.get.every(n=>u.roster[S.myTeam].some(q=>q&&q.n===n))&&K.give.every(n=>u.roster[K.t].some(q=>q&&q.n===n))); carried.ordered=pi<0||(()=>{ const s0=pi%POS.length, k=BK(s0); return !pr[s0]||!pr[k]||pr[s0].r>=pr[k].r })() }; const run0=LEAGUE.offseason.run; let banked=null; LEAGUE.offseason.run=function(u,...rest){ const q=u.roster[S.myTeam].find(q=>q&&q.n===x.qn); banked=q&&q.hist?q.hist.slice(-1)[0]:null; LEAGUE.offseason.run=run0; return run0.call(this,u,...rest) }; let n=0;while(SEA.phase!=="done"&&n<500){simAdvance();n++} try{ openOffseason();
    // round 85: the offseason's screens see the trade (it was carried only at the summer's commit before), and a reload there keeps it, once
    window.__off={gotOnScreen:document.body.innerText.length>=0&&U.roster[S.myTeam].some(q=>q&&q.n===x.qn), gaveGone:!U.roster[S.myTeam].some(q=>q&&q.n===x.gn)};
    { const names=()=>JSON.stringify(NAMES.map(t=>U.roster[t].map(q=>q&&q.n))); const a0=names(); stashCoach&&stashCoach(); rebuild(); window.__off.reload=names()===a0 }
    const O=S.off; if(O&&O.act&&O.act.userOpen)O.move=S.myTeam;
    if(LEAGUE.ui.offseasonBlock()!==null&&O.picks&&O.picks.resign)Object.keys(O.picks.resign).forEach(k=>O.picks.resign[k]=false);   // under the cap: let the expiring go
    commitOffseason() }catch(e){return {err:'offseason '+e.message}}
  const inU=(t,nm)=>U.roster[t]&&U.roster[t].some(q=>q&&q.n===nm);
  let g=null; NAMES.forEach(t=>{ const q=U.roster[t].find(q=>q&&q.n===x.qn); if(q)g=q });
  const where=NAMES.filter(t=>U.roster[t].some(q=>q&&q.n===x.gn)); const H=S.history[S.history.length-1], L=H&&H.league; const fate=L?['released','retired','signed','resigned','left','gone'].filter(k=>JSON.stringify(L[k]||'').includes(x.gn)):[];
  const pr=U.roster[S.myTeam], pi=pr.findIndex(q=>q&&q.n===x.qn), ordered=pi<0||(()=>{ const s0=pi%POS.length, k=BK(s0); return !pr[s0]||!pr[k]||pr[s0].r>=pr[k].r })();
  return {off:window.__off,ordered,banked,carried,where,fate,block:LEAGUE.ui.offseasonBlock&&S.off?LEAGUE.ui.offseasonBlock():null,year:SEA.year,phase:SEA.phase,mine:inU(S.myTeam,x.qn),theirs:inU(x.t,x.gn),hist:g&&g.hist?g.hist.slice(-1)[0]:null}},[pre]);
console.log('   next season:',JSON.stringify(nx).slice(0,300)); ok(nx.off&&nx.off.gotOnScreen&&nx.off.gaveGone,'the offseason opens with the trade in next season\'s rosters'); ok(nx.off&&nx.off.reload,'a reload in the offseason keeps it, once'); ok(nx.carried&&nx.carried.pk,'the two for two is carried into next season too'); ok(nx.carried&&nx.carried.mine&&nx.carried.theirs,'at the season\'s end the traded men are put where they went'); ok(nx.carried&&nx.carried.ordered,'carried into next season, the better of the two at his spot starts'); if(!(nx.mine&&nx.theirs))console.log('   (one has moved on in the offseason since: '+nx.where.join(', ')+')'); ok(nx.banked&&nx.banked.t===S_TEAM(nx)&&nx.banked.s&&nx.banked.s.g>0,'his season banked with the club he finished with');
// an offer that comes to you near the deadline, on the home screen: it helps you now or later; Not now hides it; Trade takes it
{ const o=await p.evaluate(([team])=>{newDynasty(team,11,'O');S.title=false;S.guide=false;let n=0,shown=0,help=0,first=null;
    while(SEA.phase==="week"&&n++<400){ if(tdState().open){ view='home';TD_UI={};render(); const c=document.querySelector('[data-tdno]'); if(c){ shown++; const d=tdIncoming()||null; if(!first)first={step:SEA.step}; } } else if(shown)break;
      if(first&&first.step===SEA.step)break; simAdvance() }
    if(!first)return {shown:0};
    const card=document.querySelector('[data-tdgo]').closest('.card').innerText, go=document.querySelector('[data-tdgo]').dataset.tdgo.split('|'), d=tdDeal(go[0],+go[1],+go[2]);
    return {shown,card:card.replace(/\s+/g,' ').slice(0,160),helps:d.now>0||d.fut>0,yes:d.yes,go,gn:d.give.n,qn:d.get.n} },[team]);
  ok(o.shown>0,'a club comes with an offer before the deadline');
  if(o.shown){ ok(o.helps&&o.yes,'the offer helps you now or later, and the club would make it: '+o.card);
    await p.click('[data-tdno]');await p.waitForTimeout(50); ok(!(await p.$('[data-tdgo]')),'Not now hides it');
    await p.evaluate(()=>{TD_UI={};render()}); const again=await p.evaluate(()=>{const b=document.querySelector('[data-tdgo]');return b?b.dataset.tdgo:null});
    ok(again===o.go.join('|'),'the same offer that day after a redraw');
    await p.click('[data-tdgo]');await p.waitForTimeout(40);await p.click('[data-tdgo]');await p.waitForTimeout(80);
    const tk=await p.evaluate(([gn,qn,t])=>SEA.roster[S.myTeam].some(q=>q&&q.n===qn)&&SEA.roster[t].some(q=>q&&q.n===gn),[o.gn,o.qn,o.go[0]]);
    ok(tk,'Trade on the card makes the trade'); } }
// fleece: every deal any club would take (any of yours, any of theirs at the spot), the best each day, to the deadline
for(const obj of ['now+later','now']){ const fl=await p.evaluate(([team,obj])=>{newDynasty(team,7,'F');S.title=false;S.guide=false;let n=0; while(!tdState().open&&SEA.phase==="week"&&n<400){simAdvance();n++}
  const my=S.myTeam, r0=teamRating(SEA.roster[my]), f0=tdVal(SEA.roster[my],true); let k=0;
  while(tdState().open&&SEA.phase==="week"){ const R=SEA.roster[my]; let best=null, bv=0.05;
    tdClubs().forEach(t=>{ if(tdRecent(t))return; SEA.roster[t].forEach((q,b)=>{ if(!q||tdHurt(t,b))return; R.forEach((g,a)=>{ if(!g||tdGrp(a)!==tdGrp(b)||tdHurt(my,a))return;
      const d=tdDeal(t,a,b); if(!d||!d.yes)return; const v=obj==='now'?d.now:d.now+d.fut; if(v>bv){bv=v;best=d} }) }) });
    // and every two for two (round 84), on every fifth day of the daily leagues
    if(!LEAGUE.daily||SEA.step%5===0)tdClubs().forEach(t=>{ if(tdRecent(t))return; tdPackages(t,null,null).forEach(d=>{ const v=obj==='now'?d.now:d.now+d.fut; if(v>bv){bv=v;best=d} }) });
    if(best){tdDo(best);k++} else simAdvance() }
  return {k,gain:teamRating(SEA.roster[my])-r0,fut:(tdVal(SEA.roster[my],true)-f0)/R_SLOPE}},[team,obj]);
  console.log(`   fleece (${obj}): ${fl.k} trades, team rating ${fl.gain>=0?'+':''}${fl.gain.toFixed(2)} now, ${fl.fut>=0?'+':''}${fl.fut.toFixed(2)} in two years`);
  FL.push({f,obj,...fl}); if(obj==='now')ok(fl.k<=3&&fl.gain<=6,`going all in: at most three trades, at most +6 now (${fl.k}, ${fl.gain.toFixed(2)})`); if(obj==='now+later')ok(fl.gain+fl.fut<=0.05,`no coach comes out ahead now and later together by trading (${(fl.gain+fl.fut).toFixed(2)})`) }
if(false){ const fl=await p.evaluate(([team])=>{newDynasty(team,7,'F');S.title=false;S.guide=false;let n=0; while(!tdState().open&&SEA.phase==="week"&&n<400){simAdvance();n++}
  const r0=teamRating(SEA.roster[S.myTeam]), b0=SEA.talent.base[S.myTeam]; let k=0, fut=0;
  while(tdState().open&&SEA.phase==="week"){ const R=SEA.roster[S.myTeam]; let best=null; R.forEach((q,i)=>{ if(!q)return; tdOffers(i).forEach(d=>{ if(d.now>0&&(!best||d.now>best.now))best=d }) });
    if(best){fut+=best.fut;tdDo(best);k++} else simAdvance() }
  return {k,fut,gain:teamRating(SEA.roster[S.myTeam])-r0}},[team]);
  console.log('   fleece:',`${fl.k} trades, team rating ${fl.gain>=0?'+':''}${fl.gain.toFixed(2)} now, ${fl.fut>=0?'+':''}${fl.fut.toFixed(2)} in two years`) }
ok(!errs.length,'page errors: '+errs.slice(0,2).join(' | '));
await p.close()}
await b.close();console.log(bad?'MISMATCH '+bad:'MATCH trades in the season: offers, asks, kept, replayed, shut at the deadline');process.exit(bad?1:0)})();
