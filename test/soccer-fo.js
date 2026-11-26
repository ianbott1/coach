/* Soccer's money side, engine 27, against English football's own figures. Last line: MATCH or MISMATCH.
     node test/soccer-fo.js [dist/soccer-coach.html]     (FO_QUICK=1: without the five seasons of part 4)
   The figures (each check names its source):
   - Premier League central payments 2024-25: an equal share of £96.9M, a merit payment of about £2.6M a place (£2.6M to
     £53.1M), facility fees of £8.9M to £24.9M:
     https://www.nbcsports.com/soccer/news/premier-league-prize-money-how-much-is-each-table-position-worth
   - Premier League revenue £6.8bn in 2024-25 (£340M a club), wages £4.4bn (65% of revenue):
     https://www.deloitte.com/uk/en/services/consulting/research/annual-review-of-football-finance-premier-league-clubs.html
   - Championship revenue £942M in 2024-25; wages 93% of revenue in 2023-24:
     https://www.deloitte.com/uk/en/services/financial-advisory/research/annual-review-of-football-finance-football-league-clubs.html
     https://www.deloitte.com/uk/en/about/press-room/deloitte-annual-review-of-football-finance-european-football-market-revenue.html
   - parachute payments: 55%, 45% and 20% of the equal share, the third year only after more than one season up:
     https://en.wikipedia.org/wiki/Premier_League_parachute_and_solidarity_payments
   - the squad cost rule from 2026-27: 85% of revenue (a levy over it); over 115% on 1 March, six points and one more for
     every £6.5M over: https://www.premierleague.com/en/news/4467022/new-premier-league-financial-system-explained
   - summer 2025: Premier League gross spending £3.0bn, the Championship £240M (£145M in 2024):
     https://www.deloitte.com/uk/en/about/press-room/deloitte-premier-league-spending-record-eclipsed.html
   - summer 2025 by club: the big six £1.53bn of £3.13bn (49%); promoted Sunderland £162M, Burnley £108M, Leeds £98M:
     https://www.si.com/soccer/premier-league-transfers-total-money-spent-clubs-2025-summer-window
   - January: £372M in 2025 and about £400M in 2026:
     https://www.gbnews.com/sport/football/premier-league-winter-transfer-window-deadline-day
   - the squad list: 25, at most 17 not homegrown, under-21s free:
     https://www.premierleague.com/en/news/4097471/premier-league-squad-lists-explained
   The game's twelve are the core of a squad: squad costs are SQ27 (2.4) times the twelve's wages and amortisation, and
   the market's gross on the twelve is read the same way (SQ27 times) against the league's whole-squad gross. */
const path=require('path'), {load}=require('./harness.js');
const file=process.argv.slice(2).find(a=>a.endsWith('.html'))||path.join(__dirname,'..','dist','soccer-coach.html');
const X=['S','SEA','U','NAMES','CONF','LEAGUE','POS','BK','newDynasty','openOffseason','commitOffseason','doAdvance','live','liveTick','answerLive','ENGINE_V','fo27','budgetOf','payroll',
  'rev27','cost27','sq27','chute27','kitty27','budget27','inst27','book27','amort27','hgBreak27','nonHG27','hg27','rcl27','ask27','tAnswer27','assess27','M27','SQ27','MAR1',
  'tradesView','jTargets27','jOffers27','jMoney27','jCheck27','jRecord27','jDo27','jDown27','jU27','jDeals27','ctDeadline','tdState','tdApply',
  'tWindowHTML','tMarket','tOffers','LOAN_DEV','nflAsk','tKey'];
let bad=0, n=0; const ok=(c,m)=>{ n++; if(!c){ bad++; console.log('  FAIL '+m) } else console.log('  ok   '+m) };
const sum=a=>a.reduce((x,y)=>x+y,0), mean=a=>a.length?sum(a)/a.length:0, f1=x=>(+x).toFixed(1);
const txt=h=>String(h||'').replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ');
const BIG=['Arsenal','Chelsea','Liverpool','Manchester City','Manchester United','Tottenham Hotspur'];
function summer(A){ A.openOffseason(); for(let c=0;c<6&&A.S.off;c++){ const O=A.S.off; if(O.act&&O.act.userOpen&&O.move===null)O.move=A.S.myTeam; A.commitOffseason() } }
const gload=()=>{ const src=require('fs').readFileSync(path.join(__dirname,'golden.js'),'utf8'), m={exports:{}};
  new Function('require','module',src.slice(0,src.indexOf('const args'))+'\nmodule.exports={load};')(require,m); return m.exports.load };
function toStep(A,pred){ let g=0; while(A.SEA.phase!=='done'&&!pred()&&g++<5000)A.SEA.advance() }
// the app's own way through a season (as test/reload.js plays it), so a save holds where it stands
const play=api=>{ api.doAdvance(); let n=0; while(api.live&&!api.live.done&&n++<800){ api.live.ask?api.answerLive(api.live.ask.dp.opts[(n+api.SEA.step)%api.live.ask.dp.opts.length][0]):api.liveTick() } };
function playTo(A,pred){ let g=0; while(A.SEA.phase!=='done'&&!pred()&&g++<5000)play(A) }

let old26=0;
(async()=>{
/* 1. a season begun on engine 26 plays as it did: no new money, the old January swaps */
console.log('Engine 26 is untouched');
{ process.env.ENGINE_NOW='26'; const A=load({file,expose:X}); A.newDynasty('Brentford',11,'T');
A.S.watchMode='never';   // your games played as the rest are (no viewer), each step kept in the save as the app keeps it
  ok(!A.fo27(),'engine 26: the money model is off');
  ok(!(A.LEAGUE.trade.on&&A.LEAGUE.trade.on()),'engine 26: the January window keeps the round-83 swaps');
  toStep(A,()=>false); summer(A);
  old26=(()=>{ const Z=load({file,expose:X}); Z.newDynasty('Brentford',11,'T'); return Z.budgetOf(Z.U,'Brentford') })();   // before the engine-27 career below (a second game loaded mid-career takes its window)
  ok(!A.U.inst&&!A.U.para&&!A.U.finLast,'engine 26: no instalments, parachutes or books are kept');
  delete process.env.ENGINE_NOW }

/* 2. the pieces, on one engine-27 career */
console.log('The pieces (engine 27)');
const A=load({file,expose:X}); A.newDynasty('Brentford',11,'T');
A.S.watchMode='never';   // your games played as the rest are (no viewer), each step kept in the save as the app keeps it
ok(A.fo27()&&A.ENGINE_V>=27,'a new career plays on engine 27');
{ const M=A.M27, PL=A.NAMES.filter(t=>A.CONF[t]==='PL'), R=PL.map(t=>A.rev27(A.U,t,'PL'));
  ok(R.every(r=>r.tv===96.9),'every top-flight club gets the £96.9M equal share');
  const mer=R.map(r=>r.merit); ok(Math.min(...mer)>=2.5&&Math.min(...mer)<=2.8&&Math.max(...mer)>=50&&Math.max(...mer)<=55,`merit £${f1(Math.min(...mer))}M to £${f1(Math.max(...mer))}M (real £2.6M to £53.1M)`);
  const fac=R.map(r=>r.fac); ok(Math.min(...fac)>=8.9&&Math.max(...fac)<=24.9,`facility fees £${f1(Math.min(...fac))}M to £${f1(Math.max(...fac))}M (real £8.9M to £24.9M)`);
  const u={para:{a:{k:0,long:true},b:{k:1,long:true},c:{k:2,long:true},d:{k:2,long:false}}};
  const c=['a','b','c','d'].map(t=>A.chute27(u,t)); ok(Math.abs(c[0]-53.3)<0.2&&Math.abs(c[1]-43.6)<0.2&&Math.abs(c[2]-19.4)<0.2&&c[3]===0,`parachute £${c.join('M, £')}M (55%, 45%, 20% of £96.9M; no third year after one season up)`);
  const B=A.budget27(A.U,'Brentford','PL');
  ok(B>0&&Math.abs(A.budgetOf(A.U,'Brentford')-B)<0.01,`the wage budget comes from revenue: £${f1(B)}M for the twelve (engine 26: £${f1(old26)}M)`) }
{ const u={}; const now=A.inst27(u,'X','Y',50,2030);
  ok(now===20&&u.inst.X.length===2&&u.inst.X.every(x=>x.f===15)&&u.inst.Y.every(x=>x.f===-15)&&u.inst.X[0].y===2031&&u.inst.X[1].y===2032,'instalments: 40% now, 30% in each of the next two summers, owed by the buyer and due to the seller');
  const p={}; A.book27(p,50,8); ok(p.am===10&&p.amY===5,'a fee is written off over the contract, five years at most (£50M over 5: £10M a year)') }
{ const my='Brentford', R=A.U.roster['Manchester City'], i=R.findIndex((p,j)=>p&&j<6&&R.some(q=>q&&q.r>p.r)); const p=R[i];
  const ask=A.ask27(A.U,'Manchester City',p,true,false);
  const a1=A.tAnswer27(A.U,my,'Manchester City',p,true,ask,{}), a2=A.tAnswer27(A.U,my,'Manchester City',p,true,Math.round(ask*0.9*10)/10,{}), a3=A.tAnswer27(A.U,my,'Manchester City',p,true,Math.round(ask*0.5*10)/10,{});
  ok(a1.ok,`a bid at the asking price (£${f1(ask)}M) is accepted`);
  ok(!a2.ok&&a2.counter===ask,'a bid just under it gets a counter at the asking price');
  ok(!a3.ok&&a3.insult&&a3.counter>=ask,'a low bid is called one, with a counter');
  ok(JSON.stringify(A.tAnswer27(A.U,my,'Manchester City',p,true,Math.round(ask*0.9*10)/10,{}))===JSON.stringify(a2),'asking twice gets the same answer');
  // a club's best player, to a peer: not for sale under half as much again
  const peers=A.NAMES.filter(t=>A.CONF[t]==='PL'&&t!=='Arsenal'&&Math.abs((A.U.program[t]||0)-(A.U.program.Arsenal||0))<100);
  let refused=null; for(const t of peers){ const T=A.U.roster[t], b=T.reduce((m,q)=>q&&(!m||q.r>m.r)?q:m,null); if(!b||A.rcl27(A.U,t,b))continue; const x=A.tAnswer27(A.U,'Arsenal',t,b,true,A.ask27(A.U,t,b,true,false),{}); if(x.refuse){ refused={x,t}; break } }
  ok(refused&&refused.x.want>=refused.x.ask*1.49,'a club\'s best player, wanted by a club its size: not for sale under half as much again'+(refused?` (${refused.t})`:''));
  let rc=null; A.NAMES.filter(t=>A.CONF[t]==='CH').some(t=>A.U.roster[t].some((q,j)=>{ const c=q&&A.rcl27(A.U,t,q); if(c){ rc={t,q,j,c}; return true } }));
  ok(rc&&A.tAnswer27(A.U,'Arsenal',rc.t,rc.q,rc.j<6,rc.c,{}).clause,'a bid that meets a release clause can\'t be refused');
  const Rb=A.U.roster[my], hg=Rb.filter(q=>q&&A.hg27(q,'PL')).length;
  ok(hg>=1&&hg<12,`the homegrown rule: ${hg} of Brentford's twelve homegrown, ${A.nonHG27(Rb,'PL')} over 21 and not`);
  const fake=Array.from({length:12},(_,k)=>({n:'F'+k,p:'CM',r:70,age:26,hg:k<4?1:0})), extra={n:'Z',p:'CM',r:75,age:27,hg:0};
  ok(A.hgBreak27(fake,extra,fake[0],'PL')&&!A.hgBreak27(fake,extra,fake[11],'PL')&&!A.hgBreak27(fake,Object.assign({},extra,{age:20}),fake[0],'PL'),'a ninth man over 21 who isn\'t homegrown breaks the list; swapping one who isn\'t, or a 20-year-old, doesn\'t') }

/* 3. the January window: your buy and your sale, the computer's deadline day, kept, replayed, carried */
console.log('The January window');
playTo(A,()=>/^Jan/.test(A.LEAGUE.dates[A.SEA.step]));
const my=A.S.myTeam;
ok(A.tdState().open&&A.LEAGUE.trade.tab()==='Transfers','January: the window is open, and the tab reads Transfers');
{ const h=txt(A.tradesView()); ok(/Money for fees/.test(h)&&/Bids for your players/.test(h)&&/The market/.test(h)&&/Squad cost ratio/.test(h),'the January screen renders: the books, money for fees, bids, the market');
  const m0=A.jMoney27(my), T=A.jTargets27(my).filter(x=>x.willing).sort((a,b)=>a.fee-b.fee); let bought=null;
  for(const x of T){ const p=A.SEA.roster[x.team][x.j], a=A.tAnswer27(A.jU27(),my,x.team,p,x.j<6,x.fee,{}); if(!a.ok)continue; const c=A.jCheck27(my,x,x.fee,true); if(!c.ok)continue;
    const rec=A.jRecord27({my:my,t:x.team,a:c.a,b:x.j,gn:c.out.n,qn:x.n,buyer:my,seller:x.team,pn:x.n,ln:c.out.n,fee:x.fee,now:c.down,inst:x.fee>=10,wage:x.wage,yrs:3});
    if(A.jDo27(rec,'')){ bought={x,c}; break } }
  ok(bought&&A.SEA.roster[my].some(p=>p&&p.n===bought.x.n)&&A.SEA.roster[bought.x.team].some(p=>p&&p.n===bought.c.out.n),'a buy: he joins you, your spare man goes to them on loan'+(bought?` (${bought.x.n}, £${bought.x.fee}M)`:''));
  ok(bought&&Math.abs(A.jMoney27(my)-(m0-bought.c.down))<0.15,`the money for fees falls by what's paid now (£${f1(m0)}M to £${f1(A.jMoney27(my))}M)`);
  const O=A.jOffers27(my); let sold=null;
  if(O[0]){ const o=O[0], rec=A.jRecord27({my:my,t:o.team,a:o.j,b:o.k,gn:o.n,qn:o.ln,buyer:o.team,seller:my,pn:o.n,ln:o.ln,fee:o.fee,now:A.jDown27(o.fee,true),inst:o.fee>=10,wage:o.wage,yrs:3}); if(A.jDo27(rec,''))sold=o }
  ok(sold&&A.SEA.roster[sold.team].some(p=>p&&p.n===sold.n),'a sale: a bigger club\'s bid for one of yours, taken'+(sold?` (${sold.n} to ${sold.team}, £${sold.fee}M)`:''));
  ok(A.NAMES.every(t=>A.SEA.roster[t].filter(Boolean).length===A.U.roster[t].filter(Boolean).length),'every club\'s twelve stay whole');
  A.S.promos=A.S.promos||{};
  playTo(A,()=>A.SEA.step>A.ctDeadline());
  const cpu=A.jDeals27(A.SEA,true).filter(x=>x.cpu), pl=cpu.filter(x=>A.CONF[x.buyer]==='PL'), g=sum(pl.map(x=>x.fee))*A.SQ27;
  ok(pl.length>=3&&g>=200&&g<=700,`deadline day: ${pl.length} top-flight deals, £${Math.round(g)}M in squad terms (real January: £372M in 2025, about £400M in 2026)`);
  // a reload gives back the same season: your deals kept among the day's moves, the computer's replayed (test/reload.js's load path)
  const B=gload()(file); await B.loadSave(JSON.stringify(A.S));
  const st=Z=>JSON.stringify([Z.SEA.weeks.map(w=>w.games.map(x=>[x.home,x.away,x.hp,x.ap])),Z.SEA.rec,(Z.SEA.cpuTr||[]).map(x=>x.pn)]);
  ok(st(A)===st(B),'a reload after deadline day gives back the same season so far');
  if(st(A)!==st(B)){ const a=JSON.parse(st(A)), b=JSON.parse(st(B)); console.log('    step',A.SEA.step,B.SEA.step,'first week apart',a[0].findIndex((w,i)=>JSON.stringify(w)!==JSON.stringify(b[0][i])),'deadline day',JSON.stringify(a[2]),JSON.stringify(b[2]),'steps',A.S.steps,B.S.steps,B.S.broken,B.S.err,B.SEA.year,A.SEA.year,Object.keys(A.S).length,Object.keys(B.S).length) }
  playTo(A,()=>false); playTo(B,()=>false);
  ok(st(A)===st(B),'and the same season to its end');
  A.openOffseason(); const fin=A.U.finLast||{};
  ok(bought&&(A.U.inst&&A.U.inst[my]||[]).length>=(bought.x.fee>=10?2:0)+(sold&&sold.fee>=10?2:0),'the season\'s end: the instalments are on the books');
  const P=A.U.roster[my].find(p=>p&&p.n===(bought&&bought.x.n)); ok(P&&P.fee===bought.x.fee&&P.amY>0,'the bought man carries his fee and its write-off into next season');
  const L=A.U.roster[bought.x.team].find(p=>p&&p.n===bought.c.out.n); ok(L&&L.loan&&L.loan.from===my,'your man on loan at the seller, coming home in the summer');
  ok(fin[my]&&fin[my].sales>=((sold&&sold.fee)||0)-0.1-0.0,'the sale counts in the rule\'s revenue (profit on sales)'); }
  const W=txt(A.tWindowHTML(A.S.off.picks));
  ok(['The books','Squad cost ratio','Money for fees','Bids for your players','Deals agreed','The market','Loans'].every(k=>W.indexOf(k)>=0),'the summer screen renders: the books, money for fees, bids, deals, the market, loans');
  ok(/Television \(equal share\) £96\.9M/.test(W)&&/Merit, by where you're expected to finish/.test(W),'next season\'s books: the equal share, merit by where the club is expected to finish');

if(!process.env.FO_QUICK){
/* 4. the long run: two careers, five seasons, the league's money against the real one */
console.log('Five seasons, two careers');
const S={rev:[],ratioPL:[],ratioCH:[],gross:[],rich:[],net:[],chShare:[],prom:[],plAvg:[],ded:[],jan:[],loans:[],loanUp:0,loanAll:0,big:[]};
for(const [team,seed] of [['Brentford',11],['Arsenal',7]]){
  const C=load({file,expose:X}); C.newDynasty(team,seed,'T');
  for(let y=0;y<5;y++){
    const PL=C.NAMES.filter(t=>C.CONF[t]==='PL'), CH=C.NAMES.filter(t=>C.CONF[t]==='CH');
    const rv=t=>C.rev27(C.U,t,C.CONF[t]).tot, rPL=PL.map(rv);
    S.rev.push(mean(rPL));
    if(y>=1){ S.ratioPL.push(sum(PL.map(t=>C.cost27(C.U.roster[t],C.sq27(C.U,t,'PL'))))/sum(rPL)); S.ratioCH.push(sum(CH.map(t=>C.cost27(C.U.roster[t],C.sq27(C.U,t,'CH'))))/sum(CH.map(rv))) }
    toStep(C,()=>false);
    S.ded.push(Object.keys(C.SEA.ded||{}).length);
    const jan=C.jDeals27(C.SEA,true).filter(x=>x.cpu&&C.CONF[x.buyer]==='PL'); S.jan.push(sum(jan.map(x=>x.fee))*C.SQ27);
    summer(C);
    const rep=C.S.lastNbaRep&&C.S.lastNbaRep.rep, M=(rep&&rep.market)||[], pl=M.filter(x=>x.dTo==='PL'), gross=sum(pl.map(x=>x.fee));
    const by={}; pl.forEach(x=>by[x.to]=(by[x.to]||0)+x.fee);
    const nowPL=C.NAMES.filter(t=>C.CONF[t]==='PL'), rich=nowPL.slice().sort((a,b)=>C.rev27(C.U,b,'PL').tot-C.rev27(C.U,a,'PL').tot).slice(0,6);
    S.gross.push(gross*C.SQ27); S.rich.push(sum(rich.map(t=>by[t]||0))/Math.max(1,gross)); S.big.push(sum(BIG.map(t=>by[t]||0))/Math.max(1,gross));
    S.net.push((gross-sum(M.filter(x=>x.dFrom==='PL').map(x=>x.fee)))/Math.max(1,gross));
    S.chShare.push(sum(M.filter(x=>x.dTo==='CH').map(x=>x.fee))/Math.max(1,gross));
    const prom=nowPL.filter(t=>C.U.moved&&C.U.moved.moves&&C.U.moved.moves[t]==='PL'&&C.S.myTeam!==t); prom.forEach(t=>S.prom.push(by[t]||0)); S.plAvg.push(gross/20);
    ((rep&&rep.loans)||[]).filter(l=>l.to&&l.from).forEach(l=>{ S.loanAll++; if(C.LEAGUE&&C.CONF[l.to]!==C.CONF[l.from])S.loanUp++ });
  }
}
const q=a=>`${f1(Math.min(...a))}-${f1(Math.max(...a))}`;
ok(mean(S.rev)>=290&&mean(S.rev)<=390,`top-flight revenue £${Math.round(mean(S.rev))}M a club (real £340M: £6.8bn over 20)`);
ok(mean(S.ratioPL)>=0.55&&mean(S.ratioPL)<=0.75,`top-flight squad costs ${Math.round(mean(S.ratioPL)*100)}% of revenue (seasons ${q(S.ratioPL.map(x=>x*100))}%; real wages 65%)`);
ok(mean(S.ratioCH)>=0.6&&mean(S.ratioCH)<=1.1,`Championship squad costs ${Math.round(mean(S.ratioCH)*100)}% of revenue (real wages 93%)`);
ok(mean(S.gross)>=1800&&mean(S.gross)<=3500,`top-flight summer gross £${(mean(S.gross)/1000).toFixed(2)}bn in squad terms (summers £${q(S.gross.map(x=>x/1000))}bn; real £3.0bn in 2025, the record)`);
ok(mean(S.rich)>=0.30&&mean(S.rich)<=0.65,`the six richest clubs spend ${Math.round(mean(S.rich)*100)}% of it (the real big six 49% in 2025; the game's own big six ${Math.round(mean(S.big)*100)}%)`);
ok(mean(S.net)>=0.2&&mean(S.net)<=0.6,`net spend ${Math.round(mean(S.net)*100)}% of gross, the money that leaves the league (real £1.2bn of £3.0bn, 40%: https://www.deloitte.com/uk/en/about/press-room/deloitte-premier-league-spending-record-eclipsed.html)`);
ok(mean(S.chShare)>=0.04&&mean(S.chShare)<=0.16,`the Championship spends ${Math.round(mean(S.chShare)*100)}% of the top flight's gross (real 8%: £240M to £3.0bn)`);
ok(S.prom.length&&mean(S.prom)>=0.5*mean(S.plAvg),`promoted clubs spend to stay up: £${f1(mean(S.prom))}M each against the top flight's £${f1(mean(S.plAvg))}M (real 2025: £98M-£162M against £150M)`);
ok(mean(S.ded)<=2,`points deductions: ${sum(S.ded)} in ${S.ded.length} seasons (Premier League and Championship)`);
ok(mean(S.jan)>=200&&mean(S.jan)<=700,`January £${Math.round(mean(S.jan))}M in squad terms (real £372M-£400M)`);
ok(S.loanAll>0&&S.loanUp/S.loanAll>=0.9,`loans: ${S.loanAll}, ${S.loanUp} of them down the pyramid`);
}
ok(A.LOAN_DEV.start>A.LOAN_DEV.bench&&A.LOAN_DEV.bench>0,'a loan\'s minutes count toward a young man\'s growth (more as a starter)');
console.log(bad?`MISMATCH ${bad} of ${n} checks`:`MATCH ${n} checks`);
})();
