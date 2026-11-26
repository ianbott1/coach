/* Pro basketball's front office (Nov 2026). In node, on dist/basketball-coach-pro.html:
   - a new career: fifteen on every roster, the real 2026-27 cap sheet, every salary between the minimum and the maximum
   - trades: offers for one of yours, the same answer twice, a deal done (both rosters stay fifteen), picks change hands,
     a reload replays the season the same, the computer's clubs deal before the deadline, the window shuts after it
   - the summer: free agency over its days (players sign on different days, your offers come back signed or with why),
     the tax bill and the floor for every club, fifteen again, the banner draws
   - an old career (saved by the published build at the repo root) loads and replays as it was played, then comes onto
     the front office's rules at its next summer
     node test/nba-fo.js [new.html] [old.html]      last line: MATCH or MISMATCH */
const fs=require('fs'),path=require('path');
const newF=process.argv[2]||path.join(__dirname,'..','dist','basketball-coach-pro.html');
const oldF=process.argv[3]||path.join(__dirname,'..','basketball-coach-pro.html');
function load(file){
  const js=fs.readFileSync(file,'utf8').split('<script>')[1].split('</script>')[0].replace(/\(async function\(\)\{[\s\S]*?\}\)\(\);\s*$/,'');
  const mem={}; global.setTimeout=()=>0; global.clearTimeout=()=>{};
  const win={storage:{get:async k=>mem[k]!==undefined?{key:k,value:mem[k]}:null,set:async(k,v)=>{mem[k]=v;return{}},delete:async k=>{delete mem[k];return{}},list:async()=>({keys:Object.keys(mem)})},addEventListener:()=>{},innerWidth:390,matchMedia:()=>({matches:false})};
  const nodes={}; const mk=()=>({innerHTML:'',onclick:null,oninput:null,value:'1',dataset:{},setAttribute(){},scrollIntoView(){},classList:{toggle(){},add(){},remove(){}},focus(){},setSelectionRange(){}});
  const node=id=>(typeof id==='string'?(nodes[id]=nodes[id]||mk()):mk());
  const doc={getElementById:node,querySelector:node,querySelectorAll:()=>[],createElement:()=>mk(),body:{classList:{toggle(){}}},addEventListener(){}};
  global.window=win; global.document=doc;
  const g=new Function('window','document',js+`; return {ev:s=>eval(s)}`)(win,doc); g.nodes=nodes; return g }
let bad=0; const ok=(c,m)=>{ if(!c){bad++;console.log('  FAIL',m)} };
const PLAY=`(()=>{ let n=0; while(SEA.phase!=="done"&&n++<900){ doAdvance(); let k=0; while(live&&!live.done&&k++<900){ if(live.ask)answerLive(live.ask.dp.opts[0][0]); else liveTick() } } })()`;
const SUMMER=`(()=>{ for(let c=0;c<4&&S.off;c++){ if(S.off.act.userOpen&&S.off.move===null)S.off.move=S.myTeam; commitOffseason() } })()`;
(async()=>{
// ---- a new career
const g=load(newF);
g.ev(`newDynasty("Boston",5,'T'); S.title=false; S.guide=false;`);
const a=g.ev(`(()=>{ const sal=[],pays=[]; let full=true; NAMES.forEach(t=>{ const R=U.roster[t]; if(R.length!==15||R.some(p=>!p))full=false; pays.push(payroll(R)); R.forEach(p=>p&&sal.push([p.k.sal,nbaMin(p.age),nbaMax(p.age)])) });
  pays.sort((x,y)=>x-y); return {foV:U.foV,full,cap:LEAGUE.cap,tax:LEAGUE.taxLine,med:pays[15],lo:pays[0],hi:pays[29],under:sal.filter(([s,mn])=>s<mn-0.05).length,over:sal.filter(([s,,mx])=>s>mx+0.05).length} })()`);
console.log('new career:',JSON.stringify(a));
ok(a.foV===1,'a new career is on the front office'); ok(a.full,'fifteen on every roster'); ok(a.cap===164.961&&a.tax===200.428,'the 2026-27 cap and tax line');
ok(a.med>130&&a.med<205,'league payrolls sit about the cap'); ok(a.under===0&&a.over===0,'every salary between the minimum and the maximum');
// ---- trades
const b=g.ev(`(()=>{ let n=0; while(!ntState().open&&SEA.phase==="week"&&n++<400)simAdvance(); for(let i=0;i<3;i++)simAdvance();
  const my=S.myTeam, R=SEA.roster[my]; let offers=0; for(let i=0;i<5;i++)offers+=ntShop(i).length;
  const k=O=>JSON.stringify(O.map(d=>[d.t,d.b,d.pb.map(ntPickName)]));
  const same=k(ntShop(1))===k(ntShop(1));
  let d=null; for(let i=0;i<10&&!d;i++){ const O=ntShop(i); d=O.find(x=>x.get.length+x.give.length>=3)||null } if(!d){ const O=ntShop(0); d=O[0] }
  if(!d)return {offers,same,none:1};
  const t=d.t, gn=d.give.map(p=>p.n), qn=d.get.map(p=>p.n), pk=d.pb.map(ntPickName);
  ntDo(d); const M=SEA.roster[my], T=SEA.roster[t];
  const moved=qn.every(n=>M.some(p=>p&&p.n===n))&&gn.every(n=>T.some(p=>p&&p.n===n));
  view='team'; teamTab='trades'; render(); const html=document.getElementById('app').innerHTML;
  const snap=()=>JSON.stringify([SEA.rec,NAMES.map(t=>SEA.roster[t].map(q=>q&&q.n)),NAMES.map(t=>Math.round(SEA.talent.base[t]*1000))]);
  // a deal that brings you this year's first-round pick of another club
  let pd=null; for(let i=0;i<15&&!pd;i++){ if(!M[i]||M[i].n===qn[0])continue; pd=ntShop(i).find(x=>x.pb.some(q=>q.y===SEA.year&&q.rd===1&&!q.prot))||null }
  if(pd)ntDo(pd); const pk1=pd?pd.pb.filter(q=>q.y===SEA.year&&q.rd===1).map(q=>q.o):[];
  const mine=()=>ntPicksOf(my).filter(q=>q.y===SEA.year).map(q=>q.rd+q.o).sort().join(",");
  const m1=mine(); for(let i=0;i<15;i++)simAdvance(); const s1=snap(); rebuild(); const s2=snap();
  return {offers,same,t,gn,qn,pk,moved,fifteen:M.length===15&&T.length===15&&M.every(Boolean)&&T.every(Boolean),
    shows:/Your trades/.test(html)||/Done/.test(html),same2:s1===s2,step:SEA.step,pk1,pkKept:pk1.every(o=>mine().indexOf("1"+o)>=0)&&m1===mine()} })()`);
console.log('trades:',JSON.stringify(b));
ok(b.offers>0,'offers for your players'); ok(b.same,'the same question, the same answer'); ok(!b.none,'a deal to make');
ok(b.moved,'the players moved both ways'); ok(b.pk1.length>0,'a deal with a first-round pick'); ok(b.pkKept,'the pick is yours, after a reload too'); ok(b.fifteen,'both rosters stay fifteen'); ok(b.shows,'the Trades tab shows the deal'); ok(b.same2,'a reload replays the season the same');
const c=g.ev(`(()=>{ let n=0; while(ntState().open&&SEA.phase==="week"&&n++<400)simAdvance(); simAdvance();
  return {open:ntState().open,cpu:(SEA.cpuTr||[]).length,picks:(SEA.cpuTr||[]).filter(x=>(x.pa||[]).length||(x.pb||[]).length).length,date:LEAGUE.dates[SEA.step]} })()`);
console.log('deadline:',JSON.stringify(c));
ok(!c.open,'shut after the deadline'); ok(c.cpu>=3,'the computer\'s clubs dealt before the deadline');
// ---- the summer
g.ev(PLAY);
const held=g.ev(`ntPicksOf(S.myTeam).filter(q=>q.y===SEA.year).map(q=>q.rd+(q.prot?"p":"")+q.o).sort().join(",")`);
g.ev(`openOffseason();`);
const dn=g.ev(`(()=>{ const o=dnOrder(); return dnPicksOf(dnTeam()).map(x=>Math.ceil(x/o.length)+o[(x-1)%o.length]).sort().join(",") })()`);
console.log('draft night: picks held',held,'| picks made',dn);
ok(/p/.test(held)||held===dn,'draft night gives you the picks you hold');
const d=g.ev(`(()=>{ const pre=nflFreeAgentPreview(U,S.myTeam), P=S.off.picks; P.targets=pre.slice(0,3).map(x=>x.key);
  P.bids={}; if(pre[2])P.bids[pre[2].key]={sal:nbaMin(pre[2].age),yrs:1};
  view='team'; flash=null; render(); const h=document.getElementById('app').innerHTML.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' '); return {offersShown:/Your offer:/.test(h),sheet:/owner's limit/.test(h),targets:P.targets.length} })()`);
console.log('summer screen:',JSON.stringify(d));
ok(d.offersShown,'your offers on the summer screen'); ok(d.sheet,'the cap sheet and the owner\'s limit on the summer screen');
g.ev(SUMMER);
const e=g.ev(`(()=>{ const rep=S.lastNbaRep.rep, all=[]; NAMES.forEach(t=>rep.signed[t].forEach(x=>all.push(x)));
  const days={}; all.forEach(x=>days[x.day]=(days[x.day]||0)+1);
  const T=rep.targets[S.myTeam]||[]; let full=true; NAMES.forEach(t=>{ const R=U.roster[t]; if(R.length!==15||R.some(p=>!p))full=false });
  const pays=NAMES.map(t=>payroll(U.roster[t])).sort((x,y)=>x-y);
  return {signed:all.length,days,mle:all.filter(x=>x.how==='mle').length,targets:T.map(x=>x.got?'got '+x.n:x.n+': '+x.why),
    bills:Object.keys(rep.bills||{}).length,taxers:NAMES.filter(t=>rep.bills[t].tax>0).length,full,foV:U.foV,med:pays[15],hi:pays[29],
    banner:/in the books/.test(offseasonBanner())&&/Payroll after the summer/.test(offseasonBanner())} })()`);
console.log('summer:',JSON.stringify(e));
ok(e.signed>=15,'free agents signed'); ok(Object.keys(e.days).length>=2,'players sign on different days'); ok(e.targets.length===3,'every offer of yours comes back');
ok(e.targets.every(x=>/^got /.test(x)||/: \S/.test(x)),'a missed target says why'); ok(e.bills===30,'a season\'s bill for every club');
ok(e.full,'fifteen on every roster after the summer'); ok(e.foV===1,'still on the front office'); ok(e.banner,'the banner draws');
// ---- an old career, saved by the published build
if(fs.existsSync(oldF)){
  const o=load(oldF);
  o.ev(`newDynasty("Boston",7,'T'); S.title=false; S.guide=false; for(let i=0;i<30;i++)simAdvance();`);
  const js=o.ev(`JSON.stringify(S)`), want=o.ev(`JSON.stringify([SEA.step,SEA.rec,NAMES.map(t=>SEA.roster[t].map(q=>q&&q.n+':'+q.k.sal))])`);
  const n=load(newF);
  await n.ev(`(async()=>{ await window.storage.set(KEYFOR(1),${JSON.stringify(js)}); slot=1; const d=await loadSlot(1); S=d; S.title=false; rebuild(); S.expNow=S.expNow||expectations(); render() })()`);
  const got=n.ev(`JSON.stringify([SEA.step,SEA.rec,NAMES.map(t=>SEA.roster[t].map(q=>q&&q.n+':'+q.k.sal))])`);
  const f0=n.ev(`({foV:!!U.foV,len:SEA.roster.Boston.length,cap:LEAGUE.cap,on:ntOn()})`);
  console.log('old save, loaded:',JSON.stringify(f0));
  ok(got===want,'an old career replays as it was played'); ok(!f0.foV&&f0.len===10&&!f0.on,'an old career keeps its rules until its summer');
  n.ev(PLAY); n.ev(`openOffseason();`); n.ev(SUMMER);
  const f1=n.ev(`(()=>{ let full=true, v2=true; NAMES.forEach(t=>{ const R=U.roster[t]; if(R.length!==15||R.some(p=>!p))full=false; R.forEach(p=>{ if(p&&p.k.v!==2)v2=false }) });
    const pays=NAMES.map(t=>payroll(U.roster[t])).sort((x,y)=>x-y); return {foV:U.foV,full,v2,cap:LEAGUE.cap,med:pays[15]} })()`);
  console.log('old save, after its summer:',JSON.stringify(f1));
  ok(f1.foV===1&&f1.full&&f1.v2&&f1.cap===164.961,'the old career comes onto the front office at its summer');
} else console.log('(no old build at',oldF+': the old-save part skipped)');
console.log(bad?'MISMATCH '+bad+' failed':'MATCH the front office works');
})();
