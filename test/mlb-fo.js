/* Pro baseball's front office (engine 27, Nov 2026). In node, on dist/baseball-coach-pro.html, against the real game:
   - a new career: 26 on every active roster, a farm at Triple-A, Double-A and Single-A, nobody's 40-man past 40,
     every salary at least the minimum ($780K)
   - the season: a starter on the injured list for ten days or more brings a man up from the farm, and a reload replays
     the season the same
   - the summer screen draws the contracts by class (pre-arbitration, arbitration, free agency, the qualifying offer),
     the payroll against the tax line and the owner's limit, the farm; the roster tab draws the farm; every club's
     payroll line
   - ten seasons of the league's economy against the real one (each band below gives its source):
       payrolls  2026 opening day (AP study, Apr 2026: https://www.ksat.com/sports/2026/04/09/ap-study-mlb-average-salary-hits-a-record-534m-as-the-mets-lead-spending-again/):
                 the Mets $352.2M at the top, Cleveland $62.3M at the bottom, eight clubs under $100M; the average
                 salary $5.34M, the median $1.4M
       the tax   $244M for 2026, 20/30/50% by consecutive years over plus surcharges past $20M, $40M and $60M over
                 (https://www.mlb.com/glossary/transactions/competitive-balance-tax)
       the QO    $23.15M for 2027, made to eight players on Nov 2, 2026; most turn it down
                 (https://www.click2houston.com/sports/2026/11/02/bednar-suzuki-and-arozarena-are-among-8-mlb-players-receiving-2315-million-qualifying-offers/,
                 https://www.mlb.com/glossary/transactions/qualifying-offer)
       service   arbitration from three years (the top 22% of the two-year class as super twos), free agency at six
                 (https://www.mlb.com/glossary/transactions/salary-arbitration)
       wins      the spread of wins, sd 10-15.5 a season (test/longrun.js's band; MLB 2024 12.3)
   - an old career (saved by the build before engine 27) loads and replays as it was played, keeps its rules for the
     season under way and its summer, and comes onto the front office at the summer after its first engine-27 season
     node test/mlb-fo.js [new.html] [old.html] [seasons]      last line: MATCH or MISMATCH */
const fs=require('fs'), path=require('path');
const {load}=require('./harness.js');
const newF=process.argv[2]||path.join(__dirname,'..','dist','baseball-coach-pro.html');
const oldF=process.argv[3]||path.join(__dirname,'..','baseball-coach-pro.html');   // the published build (engine 26 or before)
const SEASONS=+(process.argv[4]||8);
const EXPOSE=['S','SEA','U','NAMES','POS','LEAGUE','ENGINE_V','ENGINE_NOW','newDynasty','openOffseason','commitOffseason','rebuild','payroll',
  'MLB$','mlbTaxPay','mlbTaxBill','mlbBudget','mlbClass','mlb40','mlbS2','mlbReservesHTML','payrollLine','KEYFOR','loadSlot','expectations','BK','mlbSchedule','RNG'];
let bad=0; const ok=(c,m)=>{ if(!c){ bad++; console.log('  FAIL',m) } else console.log('  ok  ',m) };
const q=(a,f)=>{ const s=a.slice().sort((x,y)=>x-y); return s[Math.min(s.length-1,Math.floor(f*s.length))] };
const sd=a=>{ const m=a.reduce((s,x)=>s+x,0)/a.length; return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1)) };
const play=A=>{ let g=0; while(A.SEA.phase!=='done'&&g++<3000)A.SEA.advance() };
const summer=A=>{ A.openOffseason(); for(let c=0;c<6&&A.S.off;c++){ const O=A.S.off; if(O.act&&O.act.userOpen&&O.move===null)O.move=A.S.myTeam; A.commitOffseason() } };
const text=h=>String(h||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
(async()=>{
const t0=Date.now();
// ---- a new career
const A=load({file:newF,expose:EXPOSE,settable:['S','slot']});
A.newDynasty('Seattle',5,'T'); A.S.title=false; A.S.guide=false;   // (seed 11 can't build its 2033 schedule, on the engine-26 build too: leagues/mlb 25_schedule)
const U=()=>A.U, T=A.NAMES;
const a=(()=>{ let full=true, f40=true, under=0, lv={AAA:0,AA:0,A:0};
  T.forEach(t=>{ const R=U().roster[t]; if(R.length!==26||R.some(p=>!p))full=false; if(A.mlb40(U(),t)>40)f40=false;
    R.forEach(p=>{ if(p&&p.k.sal<A.MLB$.min-0.005)under++ }); (U().farm[t]||[]).forEach(p=>lv[p.lvl]=(lv[p.lvl]||0)+1) });
  return {engine:A.ENGINE_V,fo:U().mlbFO,full,f40,under,lv} })();
console.log('new career:',JSON.stringify(a));
ok(a.engine===27&&a.fo===1,'a new career is on engine 27 and the front office');
ok(a.full,'26 on every active roster'); ok(a.f40,'nobody past 40 on the 40-man');
ok(a.under===0,'every salary at least the $780K minimum');
ok(a.lv.AAA>=T.length*6&&a.lv.AA>=T.length*5&&a.lv.A>=T.length*5,'a farm at Triple-A, Double-A and Single-A for every club');
// ---- the seasons
const rows=[], winters=[]; let il=null, scr=null;
for(let y=1;y<=SEASONS;y++){
  if(y>1&&A.SEA.year===rows[rows.length-1].y){ ok(false,'the summer goes on to a new season ('+A.SEA.year+')'); break }
  const pays=T.map(t=>A.mlbTaxPay(U(),t)), sal=[].concat(...T.map(t=>U().roster[t].filter(Boolean).map(p=>p.k.sal)));
  const s2=A.mlbS2(U()), cls={pre:0,arb:0,fa:0}; T.forEach(t=>U().roster[t].forEach(p=>{ if(p)cls[A.mlbClass(p,s2).c]++ }));
  const f40=T.every(t=>A.mlb40(U(),t)<=40);
  play(A);
  const w=T.map(t=>A.SEA.rec[t][0]);
  // the games themselves: runs a side and shutouts (a call-up with no clubhouse mood once made every game NaN-strong: 1-0)
  let G=0, runs=0, so=0; A.SEA.weeks.slice(0,A.LEAGUE.weeks).forEach(W=>W.games.forEach(x=>{ if(x.hp==null)return; G++; runs+=x.hp+x.ap; if(!x.hp||!x.ap)so++ }));
  const rs=runs/Math.max(1,G)/2, shut=100*so/Math.max(1,G), moOk=!A.SEA.ppl||Number.isFinite(A.SEA.ppl.mid);
  rows.push({y:A.SEA.year,med:q(pays,0.5),lo:Math.min(...pays),hi:Math.max(...pays),over:pays.filter(x=>x>A.MLB$.cbt).length,u100:pays.filter(x=>x<100).length,
    mean:sal.reduce((s,x)=>s+x,0)/sal.length,smed:q(sal,0.5),wsd:sd(w),best:Math.max(...w),cls,f40,rs,shut,moOk});
  if(y===2){   // the first front-office season of the run: the injured list, and a replay
    const M=A.SEA.mlb, L=M?M.log.filter(x=>x.kind==='il'):[], rec=JSON.stringify(A.SEA.rec);
    A.rebuild(); play(A);
    il={n:L.length,same:JSON.stringify(A.SEA.rec)===rec&&A.SEA.mlb&&A.SEA.mlb.log.length===M.log.length,ex:L[0]?`${L[0].who} (${L[0].p}) hurt day ${L[0].day}, ${L[0].up} up from ${L[0].from}`:''};
    const my=A.S.myTeam; il.roster=text(A.mlbReservesHTML(my)); il.line=text(A.payrollLine(my)) }
  if(y===SEASONS)break;
  if(y===2){   // the summer screen
    A.openOffseason(); const ui=A.LEAGUE.ui; let h='', blk='', err='';
    try{ h=text(ui.offseasonScreen()); blk=ui.offseasonBlock(); ui.bindOffseason() }catch(e){ err=String(e&&e.stack||e) }
    scr={h,blk,err}; for(let c=0;c<6&&A.S.off;c++){ const O=A.S.off; if(O.act&&O.act.userOpen&&O.move===null)O.move=A.S.myTeam; A.commitOffseason() }
    scr.banner=text(ui.offseasonBanner()) }
  else summer(A);
  const L=A.S.lastNbaRep&&A.S.lastNbaRep.rep;
  if(L&&L.bills){ const cnt=k=>T.reduce((s,t)=>s+((L[k]&&L[k][t])||[]).length,0);
    winters.push({qo:cnt('qo'),acc:T.reduce((s,t)=>s+L.qo[t].filter(x=>x.accepted).length,0),signed:cnt('signed'),farmUp:cnt('farmUp'),forfeit:cnt('forfeit'),
      payers:T.filter(t=>L.bills[t].tax>0).length,top:Math.max(0,...T.flatMap(t=>L.signed[t].map(x=>x.sal)))}) }
}
rows.forEach(r=>console.log(`${r.y}: payroll median ${r.med.toFixed(0)}, ${r.lo.toFixed(0)}-${r.hi.toFixed(0)}, ${r.over} over $244M, ${r.u100} under $100M | salary mean ${r.mean.toFixed(2)} median ${r.smed.toFixed(2)} | classes ${JSON.stringify(r.cls)} | wins sd ${r.wsd.toFixed(1)} best ${r.best} | runs a side ${r.rs.toFixed(2)}, shutouts ${r.shut.toFixed(1)}%`));
winters.forEach((x,i)=>console.log(`  winter ${i+1}: ${x.qo} qualifying offers (${x.acc} taken), ${x.signed} free agents signed (top $${x.top.toFixed(1)}M), ${x.farmUp} up from the farm, ${x.forfeit} picks forfeited, ${x.payers} tax payers`));
ok(rows.every(r=>r.rs>=4.0&&r.rs<=4.8&&r.shut<=17.5&&r.moOk),'every season scores like MLB with its call-ups: runs a side 4.0-4.8, shutouts 17.5% or fewer (2024: 4.39, 13.2%; baseball-reference.com/leagues/majors/2024-misc.shtml)');
console.log('injured list:',JSON.stringify({n:il.n,same:il.same,ex:il.ex}));
ok(il.n>=5,'starters on the injured list bring men up from the farm');
ok(il.same,'a reload replays the season the same, call-ups and all');
ok(/The farm/.test(il.roster)&&/of 40 on the 40-man/.test(il.roster),'the roster tab draws the farm');
ok(/tax line/.test(il.line)&&/owner's limit/.test(il.line),'the payroll line: the tax line and the owner\'s limit');
console.log('summer screen:',scr.err||scr.h.length+' characters', '| block:',JSON.stringify(scr.blk));
ok(!scr.err,'the summer screen draws and binds');
ok(/Contracts/.test(scr.h)&&/tax line/.test(scr.h)&&/owner's limit/.test(scr.h),'contracts, the tax line and the owner\'s limit');
ok(/Pre-arbitration|Arbitration, year/.test(scr.h)&&/qualifying offer/.test(scr.h),'each man by his class, and the qualifying offer');
ok(/The farm and the 40-man/.test(scr.h)&&/Triple-A/.test(scr.h),'the farm and the 40-man');
ok(!/Expiring contracts|over the cap/.test(scr.h),'none of the old cap\'s words');
ok(/The tax:/.test(scr.banner)&&/Around the league/.test(scr.banner),'the banner gives the summer\'s tax');
// the settled league: seasons 3 on (the first two are the market finding its level)
const S3=rows.slice(2), W=winters.slice(1), mean=(a,f)=>a.reduce((s,x)=>s+f(x),0)/a.length;
const band=(v,lo,hi,m)=>ok(v>=lo&&v<=hi,`${m}: ${typeof v==='number'?Math.round(v*100)/100:v} (want ${lo}..${hi})`);
band(mean(S3,r=>r.hi),250,380,'top payroll (2026: Mets $352.2M)');
band(mean(S3,r=>r.lo),45,110,'bottom payroll (2026: Cleveland $62.3M)');
band(mean(S3,r=>r.u100),2,12,'clubs under $100M (2026: eight)');
band(mean(S3,r=>r.over),1,9,'clubs over the $244M tax line');
band(mean(S3,r=>r.mean),4,7,'mean salary $M (2026: $5.34M)');
band(mean(S3,r=>r.smed),0.78,2.5,'median salary $M (2026: $1.4M)');
band(mean(S3,r=>r.wsd),10,15.5,'wins sd');
const all=S3.reduce((s,r)=>({pre:s.pre+r.cls.pre,arb:s.arb+r.cls.arb,fa:s.fa+r.cls.fa}),{pre:0,arb:0,fa:0}), n=all.pre+all.arb+all.fa;
band(all.pre/n,0.3,0.6,'share of men in pre-arbitration');
band(all.arb/n,0.1,0.35,'share in arbitration');
band(mean(W,x=>x.qo),2,20,'qualifying offers a winter (Nov 2026: eight)');
ok(mean(W,x=>x.acc)<=mean(W,x=>x.qo)/3,'most qualifying offers are turned down');
ok(rows.every(r=>r.f40),'nobody past 40 on the 40-man, every season');
// ---- an old career, saved by the build before engine 27
if(fs.existsSync(oldF)){
  const O=load({file:oldF,expose:EXPOSE.concat(['simAdvance'])});
  O.newDynasty('Boston',7,'T'); O.S.title=false; O.S.guide=false; for(let i=0;i<40;i++)O.simAdvance();
  const js=JSON.stringify(O.S), want=JSON.stringify([O.SEA.step,O.SEA.rec,O.NAMES.map(t=>O.SEA.roster[t].map(p=>p&&p.n+':'+p.k.sal))]);
  const N=load({file:newF,expose:EXPOSE,settable:['S','slot']});
  await global.window.storage.set(N.KEYFOR(1),js); N.slot=1; N.S=await N.loadSlot(1); N.S.title=false; N.rebuild(); N.S.expNow=N.S.expNow||N.expectations();
  const got=JSON.stringify([N.SEA.step,N.SEA.rec,N.NAMES.map(t=>N.SEA.roster[t].map(p=>p&&p.n+':'+p.k.sal))]);
  ok(got===want,'an old career replays as it was played');
  ok(!N.U.mlbFO&&N.ENGINE_V<27,'an old career keeps its rules for the season under way');
  play(N); summer(N);
  ok(!N.U.mlbFO&&N.U.engV===27,'its summer runs on the old rules; the next season is on engine 27');
  play(N); summer(N);   // the first summer after an engine-27 season
  const f=(()=>{ let full=true; N.NAMES.forEach(t=>{ const R=N.U.roster[t]; if(R.length!==26||R.some(p=>!p))full=false });
    return {fo:N.U.mlbFO,full,farm:!!N.U.farm,engine:N.U.engV,svc:N.U.roster.Boston.filter(p=>p&&p.svc!=null).length} })();
  console.log('old career after its summer:',JSON.stringify(f));
  ok(f.fo===1&&f.farm&&f.full&&f.svc===26,'the old career comes onto the front office at its first summer on engine 27');
} else console.log('(no old build at '+oldF+': the old-career part skipped)');
// the schedule (Nov 2026: about one season in two hundred wouldn't pack, and the career stopped there; a scan of 60
// dice states by 20 years found 6). A failed build redraws its series (LEAGUE.buildSchedule); one that built is unchanged.
{ const dice=(s,y)=>new A.RNG((s*2654435761+y*40503)|0), gm=x=>JSON.stringify(x.map(g=>[g.week,g.home,g.away]));
  const hard=[[1,2037],[8,2035],[44,2028]], easy=[[2,2030],[9,2041],[30,2026]];
  let threw=0, fits=0, same=0;
  hard.forEach(([s,y])=>{ try{ A.mlbSchedule(dice(s,y),{},y) }catch(e){ threw++ }
    try{ const G=A.LEAGUE.buildSchedule(dice(s,y),{},y), n={}, h={}; G.forEach(g=>{ n[g.home]=(n[g.home]||0)+1; n[g.away]=(n[g.away]||0)+1; h[g.home]=(h[g.home]||0)+1 });
      if(T.every(t=>n[t]===162&&h[t]===81))fits++ }catch(e){} });
  easy.forEach(([s,y])=>{ if(gm(A.LEAGUE.buildSchedule(dice(s,y),{},y))===gm(A.mlbSchedule(dice(s,y),{},y)))same++ });
  console.log('schedule:',JSON.stringify({threw,fits,same}));
  ok(threw===hard.length&&fits===hard.length,'a season whose schedule would not pack gets one: 162 games a club, 81 at home');
  ok(same===easy.length,'a schedule that built before builds the same'); }
console.log(`(${Math.round((Date.now()-t0)/1000)}s)`);
console.log(bad?'MISMATCH '+bad+' failed':'MATCH the front office works');
})();
