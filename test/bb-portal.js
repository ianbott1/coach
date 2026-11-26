/* College basketball, the transfer portal (engine 26: the roster economy, core 92_market): entrants every spring,
   never seniors; nobody lands on two teams; rosters stay at ten with no duplicates;
   computer programs take at most the market's limit (four of the ten: about six of fifteen); no program spends more
   than its money; your offers are signed (and on your roster) or reported with a reason; the screen's preview is the
   market that runs; the offseason screen and the banner after it render with it.
   Real figures it reads against (the bands are wide: the game's ten stand for fifteen, and seniors don't transfer here):
     - 2,033 men's players had entered by April 10, 2025, about 35% of D-I rosters; 2,088 in 2024
       (https://frontofficesports.com/article/more-than-2000-mens-basketball-players-have-entered-transfer-portal/)
     - the 2026 window: 15 days, April 7-21, 1,500 entries on the first day
       (https://bleacherreport.com/articles/25415606-college-basketball-transfer-portal-sees-1500-mens-player-entries-1st-day-window)
     node test/bb-portal.js [offseasons=4]   last line: MATCH or MISMATCH */
const path=require('path');
const {load}=require('./harness.js');
const N=+(process.argv.slice(2).find(a=>/^\d+$/.test(a))||4);
const api=load({file:path.join(__dirname,'..','dist','basketball-coach.html'),
  expose:['newDynasty','U','SEA','S','NAMES','POS','openOffseason','commitOffseason','pxPreview','pxLedger','pxChance','pxOn','MK','render','LEAGUE']});
let pc=0,pv=0,bad=0,checks=0,moves=0,got=0,asked=0,ent=0,slots=0,signed=0; const ok=(c,msg)=>{checks++; if(!c){bad++; if(bad<=8)console.log('  FAIL '+msg)}};
api.newDynasty('Houston',12,'T');
const maxIn=api.MK().maxIn;
for(let y=0;y<N;y++){
  const E=api.SEA; let g=0; while(E.phase!=='done'&&g++<200)E.advance();
  api.openOffseason(); const S=api.S, O=S.off; if(O.act.userOpen)O.move=O.jobs[0]||S.myTeam;
  ok(api.pxOn(),`${E.year}: the market is off`);
  const my=O.move&&O.move!=='retire'?O.move:S.myTeam;
  const pre=api.pxPreview(my,O.picks);
  ok(pre.n>0, `${E.year}: nobody would enter the portal`);
  ok(pre.ents.every(e=>e.c<=2), `${E.year}: a senior in the portal`);
  // three offers: the best the preview says would sign somewhere, at a strong offer
  // three offers, as a coach would make them: players the screen calls likely or a battle at a strong offer, that the
  // money left would cover; how many sign is held against the chances the screen gave
  const want=[]; { const L=api.pxLedger(my,O.picks); let left=L.B.two-L.kept;
    pre.ents.filter(e=>e.from!==my).forEach(e=>{ if(want.length>=3)return; const c=api.pxChance(my,e,1.25,O.picks);
      if(c>=0.35&&e.V*1.25<=left){ want.push([e.key,1.25]); left-=e.V*1.25; pc+=c; pv+=c*(1-c) } }) }
  O.picks.offers=want; asked+=want.length;
  const pre2=api.pxPreview(my,O.picks);
  api.render(); ok(/Transfer portal/.test(api.LEAGUE.ui.offseasonScreen()),`${E.year}: the offseason screen has no portal`);
  api.commitOffseason();
  const M=S.lastMarket; ok(!!M,`${E.year}: the market didn't run`); if(!M)continue;
  ok(JSON.stringify(pre2.ents.map(e=>[e.key,e.to]))===JSON.stringify(M.ents.map(e=>[e.key,e.to])),`${E.year}: the preview isn't the market`);
  ent+=M.n; signed+=M.signed; slots+=api.NAMES.length*10;
  // your recap lists each player who left once (Instinct saw two departures twice)
  { const h=api.S.history.slice(-1)[0], Mk=h.league&&h.league.market, O2=(Mk&&Mk.out&&Mk.out[my])||[], seen=new Set();
    ok(!!Mk,`${E.year}: the season's history keeps no market`);
    O2.forEach(o=>{ ok(!seen.has(o.n), `${E.year}: ${o.n} listed twice in your portal-out recap`); seen.add(o.n) }) }
  // the same player (the same record, not just the same name: names repeat across 3,650 players) is never on two rosters
  const U=api.U, where=new Map();
  api.NAMES.forEach(t=>{const R=U.roster[t]; ok(R.length===10&&R.every(Boolean), `${E.year} ${t}: roster of ${R.filter(Boolean).length}`);
    R.forEach(p=>{ if(where.has(p))ok(false, `${E.year}: ${p.n} on ${where.get(p)} and ${t}`); where.set(p,t)});
    const n=(M.in[t]||[]).length; moves+=n; ok(n<=maxIn, `${E.year} ${t}: ${n} transfers in`);
    const m=M.money[t]; ok(m.portal===0||m.kept+m.portal<=m.two+1e-6,`${E.year} ${t}: spent ${m.kept}+${m.portal} of ${m.two}`) });
  const T=(M.targets||{})[my]||[];
  ok(T.length===want.length, `${E.year}: ${T.length} of ${want.length} targets reported`);
  // a transfer can still declare for the NBA draft (the window is in April, the draft's deadline after it): then the
  // banner says so with the rest who left early
  const early=((api.S.history.slice(-1)[0].league.early||{})[my]||[]).map(p=>p.n);
  T.forEach(x=>{ if(x.got){got++; ok(U.roster[my].some(p=>p.n===x.n)||early.includes(x.n), `${E.year}: signed ${x.n} but he isn't on your roster or in the draft`)} else ok(!!x.why, `${E.year}: missed ${x.n} with no reason`)});
  ok(/Transfer portal/.test(api.LEAGUE.ui.offseasonBanner()),`${E.year}: the banner says nothing of the portal`);
}
const share=ent/Math.max(1,slots);
console.log(`  your offers: ${got} of ${asked} signed; the screen's chances said ${pc.toFixed(1)}`);
ok(Math.abs(got-pc)<=3*Math.sqrt(pv)+1.5,`${got} of ${asked} offers signed: the screen's chances said ${pc.toFixed(1)}`);
console.log(`  entrants ${(100*share).toFixed(1)}% of the ten a spring (real about 35% of rosters), ${(100*signed/Math.max(1,ent)).toFixed(1)}% signed`);
ok(share>=0.22&&share<=0.45,`entrants ${(100*share).toFixed(1)}% of the ten: outside 22-45%`);
console.log(bad?`MISMATCH ${bad} of ${checks} checks failed`:`MATCH ${checks} checks (${N} offseasons; ${moves} transfers; ${got} of ${asked} of your targets signed)`);
process.exit(bad?1:0);
