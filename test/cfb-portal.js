/* College football's roster economy (engine 26, core 92_market): the transfer portal, revenue sharing and NIL.
   Careers with a do-nothing coach (the staff's plan every winter), measured against the real sport, and checked:
     - nobody is on two rosters; every roster has its twenty; nobody who went unsigned is on one
     - no program spends more than its two-deep money; your targets are each reported, signed or with a reason
     - the screen's preview is the market that runs (the same entrants and moves)
   Real figures it is measured against:
     - FBS entrants a cycle: 4,201 in 2024-25 (the most since 2018), just over 3,000 in January 2026, down 23-29% after
       schools began paying players (On3 via Front Office Sports:
       https://frontofficesports.com/college-football-transfers-down-23-after-schools-started-paying-players/), of
       about 136 rosters of up to 105: 21-29% of rosters a year. The game's twenty stand for the 105, so the same share.
     - More than a third of FBS scholarship entrants were still unsigned as the January 2026 window closed (ESPN:
       https://www.espn.com/college-football/story/_/id/47624150/2026-college-football-transfer-portal-trends-prices-qbs).
     - Transfers were 42% of Power Four all-conference players in 2025 and 47% in the Group of Six; of returning
       all-conference players, the Group of Six kept 29.5% (73 of the 81 who left went to the Power Four), the Power Four
       74.6% (CBS Sports, 2026: https://www.cbssports.com/college-football/news/college-football-transfer-portal-2026-retention-gap-conference-tiers/).
     - About 64% of 2026 FBS starting quarterbacks are transfers (FootballScoop, Sep 2026:
       https://www.footballscoop.com/2026/09/09/study-nearly-two-thirds-fbs-schools-start-transfer-quarterbacks).
     - Most power rosters cost $14-16M, contenders $30M and more (CBS Sports, as above); the cap is $21.3M in 2026-27
       (https://insidetheloudhouse.com/syracuse-will-pay-its-athletes-the-maximum-amount-allowed-21-3-million-next-season).
     - Titles: 7 programs won the 12 Playoff-era titles (2014-2025), Alabama the most with 3; 15 programs the 28 since
       1998, Alabama 6 (21%).
     node test/cfb-portal.js [careers=2] [seasons=6] [--long]     last line: MATCH or MISMATCH */
const path=require('path');
const {load}=require('./harness.js');
const args=process.argv.slice(2), nums=args.filter(a=>/^\d+$/.test(a)).map(Number);
const CAREERS=nums[0]||2, SEASONS=nums[1]||6, FILE=(args.find(a=>a.endsWith('.html')))||path.join(__dirname,'..','dist','football-coach.html');
let bad=0, checks=0; const ok=(c,msg)=>{ checks++; if(!c){ bad++; if(bad<=10)console.log('  FAIL '+msg) } };
// a season begun before engine 26 (OLD=dir of an engine-25 build's pages): its winter runs as that build ran it (the
// old budget screen, no market, the same rosters after), and the next winter, on the current engine (26 or later), opens the market
async function oldSeason(){ const OLD=process.env.OLD||'/home/claude/dist-e25', f=path.join(OLD,'football-coach.html'), fs=require('fs'), crypto=require('crypto');
  if(!fs.existsSync(f)){ console.log(`  (no engine-25 build at ${OLD}: the old-season check is skipped)`); return }
  const src=fs.readFileSync(path.join(__dirname,'golden.js'),'utf8');
  const mk=()=>{ const m={exports:{}}; new Function('require','module',src.slice(0,src.indexOf('const args'))+'\nmodule.exports={load};')(require,m); return m.exports.load };
  const h=o=>crypto.createHash('md5').update(JSON.stringify(o)).digest('hex').slice(0,8);
  const ros=X=>Object.keys(X.U.roster).map(t=>X.U.roster[t].map(p=>p&&[p.n,p.r,p.c,p.pot]));
  const Aold=mk()(f); Aold.newDynasty('Alabama',3,'T'); let g=0; while(Aold.SEA.phase!=='done'&&g++<200)Aold.doAdvance();
  const Bn=mk()(FILE); await Bn.loadSave(JSON.stringify(Aold.S)); 
  // the current engine, as the page being tested has it (ENGINE_NOW in the environment, else the page's own default)
  const NOW=+(process.env.ENGINE_NOW||(fs.readFileSync(FILE,'utf8').match(/ENGINE_NOW=\+\(\(typeof process[^)]*\)\|\|(\d+)\)/)||[])[1]);
  ok(Bn.U.engV<26,`an engine-25 save loads on engine ${Bn.U.engV}`);
  for(const X of [Aold,Bn]){ X.openOffseason(); X.render(); X.commitOffseason() }
  ok(!Bn.S.lastMarket,'an engine-25 season\'s winter ran the market');
  ok(h(ros(Aold))===h(ros(Bn)),'an engine-25 season\'s winter changed the rosters');
  ok(Bn.U.engV===NOW,`after its winter the career is on engine ${Bn.U.engV}, not ${NOW}`);
  g=0; while(Bn.SEA.phase!=='done'&&g++<200)Bn.doAdvance(); Bn.openOffseason(); Bn.render(); Bn.commitOffseason();
  ok(!!Bn.S.lastMarket,`the next winter, on engine ${NOW}, ran no market`);
  console.log(`  an engine-25 season: its winter as it was (rosters ${h(ros(Aold))} both builds), the next on the market (${Bn.S.lastMarket?Bn.S.lastMarket.n+' entrants':'none'})`);
}
if(args.includes('--old-season')){ oldSeason().then(()=>{ console.log(bad?`OLD ${bad} failed`:'OLD ok'); process.exit(0) }) }
else main();
function main(){
const api=load({file:FILE,expose:['newDynasty','U','SEA','S','NAMES','POS','openOffseason','commitOffseason','ENGINE_V','pxPreview','pxLedger','pxChance','pxBudget','pxOn','LEAGUE','pxKey','render']});
const P4=new Set(['SEC','B1G','B12','ACC','IND']);
const A={ent:0,slots:0,signed:0,unsigned:0,st:0,stX:0,qb:0,qbX:0,ac:{p4:[0,0],g6:[0,0],g6toP4:0},inMax:0,inSum:0,teams:0,champs:{},seasons:0,
  spend:{p4:[0,0,0],g6:[0,0,0]},top:[0,0],preview:[0,0],acN:0,acX:0,p4b:[],pc:0,pv:0,asked:0,got:0};
const t0=Date.now();
for(let c=0;c<CAREERS;c++){
  const team=['Iowa State','Toledo','Alabama','Boise State','Kansas','Michigan'][c%6];
  api.newDynasty(team,101+c*17,'T');
  ok(api.ENGINE_V>=26,`career ${c}: a new career is on engine ${api.ENGINE_V}`);
  for(let y=0;y<SEASONS;y++){
    const E=api.SEA; let g=0; while(E.phase!=='done'&&g++<80)E.advance();
    A.champs[E.champion]=(A.champs[E.champion]||0)+1; A.seasons++;
    api.openOffseason(); const S=api.S, O=S.off; if(O.act.userOpen)O.move=O.jobs[0]||S.myTeam;
    const U=api.U, conf=t=>U.conf?U.conf[t]:api.LEAGUE.teams.find(x=>x[0]===t)[2];
    // all-conference before the window: the best two non-seniors at each position in each conference
    const byConf={}; api.NAMES.forEach(t=>(U.roster[t]||[]).forEach(p=>{ if(p&&(p.c||0)<3){ const k=conf(t)+'|'+p.p; (byConf[k]=byConf[k]||[]).push({t:t,p:p,y:E.year}) } }));
    const allConf=[]; Object.values(byConf).forEach(L=>L.sort((a,b)=>b.p.r-a.p.r).slice(0,2).forEach(x=>allConf.push(x)));
    // a target or two of the coach's: the best two the preview says would start for him
    const my=O.move&&O.move!=='retire'?O.move:S.myTeam;
    // a target or two, as a coach would choose them: players the screen calls likely or a battle at a strong offer, that
    // the money left would cover; how many sign is held against the chances the screen gave
    const pre=api.pxPreview(my,O.picks), tg=[]; { const L=api.pxLedger(my,O.picks); let left=L.B.two-L.kept;
      pre.ents.filter(e=>e.from!==my).forEach(e=>{ if(tg.length>=2)return; const c=api.pxChance(my,e,1.25,O.picks);
        if(c>=0.35&&e.V*1.25<=left){ tg.push([e.key,1.25]); left-=e.V*1.25; A.pc+=c; A.pv+=c*(1-c); A.asked++ } }) }
    O.picks.offers=tg; const pre2=api.pxPreview(my,O.picks);
    api.render();
    api.commitOffseason();
    const M=S.lastMarket||api.S.lastMarket;
    ok(!!M,`${E.year}: the market didn't run`); if(!M)continue;
    // the preview was the market
    A.preview[1]++; if(pre2.n===M.n&&pre2.signed===M.signed&&JSON.stringify(pre2.ents.map(e=>[e.key,e.to]))===JSON.stringify(M.ents.map(e=>[e.key,e.to])))A.preview[0]++;
    else ok(false,`${E.year}: the preview (${pre2.n} in, ${pre2.signed} signed) isn't the market (${M.n}, ${M.signed})`);
    A.ent+=M.n; A.signed+=M.signed; A.unsigned+=M.unsigned; A.slots+=api.NAMES.length*api.POS.length*2;
    // invariants
    const where=new Map(), seen=new Map(), U2=api.U;
    api.NAMES.forEach(t=>{ const R=U2.roster[t]; ok(R.length===api.POS.length*2&&R.every(Boolean),`${E.year} ${t}: roster of ${R.filter(Boolean).length}`);
      R.forEach(p=>{ if(seen.has(p))ok(false,`${E.year}: ${p.n} on ${seen.get(p)} and ${t}`); seen.set(p,t); where.set(p.n+'|'+p.p+'|'+p.from,t) }) });
    const unsigned=M.ents.filter(e=>!e.to); unsigned.forEach(e=>{ const on=api.NAMES.find(t=>U2.roster[t].some(p=>p&&p.n===e.n&&p.p===e.p&&p.xfFrom===e.from&&p.xfY===E.year)); ok(!on,`${E.year}: ${e.n} went unsigned but is on ${on}`) });
    api.NAMES.forEach(t=>{ const m=M.money[t]; ok(m.portal===0||m.kept+m.portal<=m.two+1e-6,`${E.year} ${t}: spent ${m.kept}+${m.portal} of ${m.two}`);
      const big=P4.has(conf(t))?'p4':'g6'; A.spend[big][0]+=m.tot; A.spend[big][1]+=m.kept+m.portal; A.spend[big][2]++ });
    const T=(M.targets[my]||[]); ok(T.length===tg.length,`${E.year}: ${T.length} of ${tg.length} targets reported`);
    T.forEach(x=>{ if(x.got)A.got++; if(x.got)ok(U2.roster[my].some(p=>p.n===x.n),`${E.year}: signed ${x.n}, not on the roster`); else ok(!!x.why,`${E.year}: missed ${x.n} with no reason`) });
    // transfers in per program
    api.NAMES.forEach(t=>{ const n=(M.in[t]||[]).length; A.inSum+=n; A.inMax=Math.max(A.inMax,n); A.teams++ });
    // all-conference: stayed, moved, or gone (the draft)
    allConf.forEach(x=>{ const now=where.get(x.p.n+'|'+x.p.p+'|'+(x.p.from!=null?x.p.from:x.y-(x.p.c||0))), k=P4.has(conf(x.t))?'p4':'g6'; if(!now)return;   // drafted
      A.ac[k][1]++; if(now!==x.t){ A.ac[k][0]++; if(k==='g6'&&P4.has(conf(now)))A.ac.g6toP4++ } });
    // starters who transferred, once the market has run a few winters
    if(y>=3){ api.NAMES.forEach(t=>U2.roster[t].slice(0,api.POS.length).forEach((p,i)=>{ A.st++; if(p.xf)A.stX++; if(i===0){ A.qb++; if(p.xf)A.qbX++ } }));
      // all-conference now: the best two at each position in each conference, and how many came by the portal
      const bc={}; api.NAMES.forEach(t=>U2.roster[t].forEach(p=>{ const k=conf(t)+'|'+p.p; (bc[k]=bc[k]||[]).push(p) }));
      Object.values(bc).forEach(L=>L.sort((a,b)=>b.r-a.r).slice(0,2).forEach(p=>{ A.acN++; if(p.xf)A.acX++ })) }
    // the budgets: the most a program has, and the range
    api.NAMES.forEach(t=>{ const m=M.money[t]; A.top[0]=Math.max(A.top[0],m.tot); if(P4.has(conf(t)))A.p4b.push(m.tot) });
  }
}
const pc=(a,b)=>b?(100*a/b).toFixed(1)+'%':'-';
const champs=Object.entries(A.champs).sort((a,b)=>b[1]-a[1]);
console.log(`${CAREERS} careers x ${SEASONS} seasons (${Math.round((Date.now()-t0)/1000)}s)`);
console.log(`  entrants a winter: ${(A.ent/A.seasons).toFixed(0)} = ${pc(A.ent,A.slots)} of the two-deep (real 21-29% of rosters); signed ${pc(A.signed,A.ent)} (real under two-thirds by the window's close)`);
console.log(`  transfers in a program a winter: mean ${(A.inSum/A.teams).toFixed(1)}, most ${A.inMax} (of twenty)`);
console.log(`  all-conference who moved: Group of Six ${pc(A.ac.g6[0],A.ac.g6[1])} (real 70.5%), ${pc(A.ac.g6toP4,A.ac.g6[0])} of them to the Power Four (real 90%); Power Four ${pc(A.ac.p4[0],A.ac.p4[1])} (real 25.4%)`);
console.log(`  transfers (seasons 4+): ${pc(A.acX,A.acN)} of all-conference players (real 42% Power Four, 47% Group of Six), ${pc(A.stX,A.st)} of starters; ${pc(A.qbX,A.qb)} of quarterbacks (real 64%)`);
A.p4b.sort((a,b)=>a-b);
console.log(`  budgets: Power Four median ${A.p4b[A.p4b.length>>1]}M, mean ${(A.spend.p4[0]/A.spend.p4[2]).toFixed(1)}M (real most $14-16M, contenders $30-40M), top ${A.top[0]}M; Group of Six ${(A.spend.g6[0]/A.spend.g6[2]).toFixed(1)}M (real a few million)`);
console.log(`  champions: ${champs.length} programs in ${A.seasons} seasons, most ${champs[0][1]} (${champs[0][0]}): ${champs.map(x=>x[0]+' '+x[1]).join(', ')} (real: 7 in 12, most 3)`);
console.log(`  your offers: ${A.got} of ${A.asked} signed; the screen's chances said ${A.pc.toFixed(1)}`);
ok(Math.abs(A.got-A.pc)<=3*Math.sqrt(A.pv)+1.5,`${A.got} of ${A.asked} offers signed: the screen's chances said ${A.pc.toFixed(1)}`);
console.log(`  the screen's preview was the market in ${A.preview[0]} of ${A.preview[1]} winters`);
// the old-season check, in a process of its own (a second game beside the harness's reads the wrong save)
{ const out=require('child_process').execFileSync(process.execPath,[__filename,'--old-season',FILE],{env:process.env,encoding:'utf8',maxBuffer:1<<26});
  out.split('\n').filter(l=>/^  /.test(l)).forEach(l=>console.log(l)); const m=out.match(/OLD (\d+) failed/);
  checks+=5; if(m){ bad+=+m[1] } }
// the bands the league must hold
const share=A.ent/A.slots, st=A.stX/Math.max(1,A.st), signed=A.signed/Math.max(1,A.ent), g6=A.ac.g6[0]/Math.max(1,A.ac.g6[1]), p4=A.ac.p4[0]/Math.max(1,A.ac.p4[1]);
ok(share>=0.16&&share<=0.32,`entrants ${pc(A.ent,A.slots)} of the two-deep: outside 16-32%`);
ok(signed>=0.5&&signed<=0.85,`signed ${pc(A.signed,A.ent)}: outside 50-85%`);
ok(g6>=0.5&&g6<=0.85,`Group of Six all-conference moved ${pc(A.ac.g6[0],A.ac.g6[1])}: outside 50-85%`);
ok(p4>=0.1&&p4<=0.4,`Power Four all-conference moved ${pc(A.ac.p4[0],A.ac.p4[1])}: outside 10-40%`);
const acx=A.acX/Math.max(1,A.acN);
if(SEASONS>=5)ok(acx>=0.3&&acx<=0.6,`all-conference players who are transfers ${pc(A.acX,A.acN)}: outside 30-60%`);
if(SEASONS>=5)ok(st>=0.2&&st<=0.6,`starters who are transfers ${pc(A.stX,A.st)}: outside 20-60%`);
console.log(bad?`MISMATCH ${bad} of ${checks} checks failed`:`MATCH ${checks} checks`);
process.exit(bad?1:0);
}
