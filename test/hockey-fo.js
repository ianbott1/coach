/* Pro hockey's front office (review round 3, engine 27) against the real NHL. Plays careers on the computer's hands for
   N summers and measures the cap sheets after each summer (opening night) against the league's own:

   - every club at or under the $104.0M upper limit, none under the $76.9M lower limit
       https://www.nhl.com/news/nhl-nhlpa-announce-team-payroll-range-for-2026-27-season
   - the payroll spread on 2025-26 opening night (PuckPedia: 19 of 32 clubs within $3M of the $95.5M cap or over it on
     LTIR, 6 with $3-8M, 7 with $8-14M; the most room $14M, 85% of the cap spent):
       https://www.puckpedia.com/news/2025-26-nhl-season-opening-rosters
     bands, as shares of the cap: median payroll 94-100%; 35-75% of clubs within 3%; 10-35% with 8% or more of room;
     few far under: no more than 10% of clubs under 80% of the cap (the floor is 74%; in 2025-26 none spent under 85%,
     but a rebuilding club spends near the floor in some years)
   - the contenders spend to the cap: the top eight by strength use 95% or more on average
   - the most one man counts: Kaprizov's $17.0M (2026-27), Draisaitl's $14.0M (2025-26 of $95.5M, 14.7%): the top cap
     hit 13-19% of the cap. The average cap hit $3.5M of $95.5M (3.7%): 3.0-4.6% of the cap here. 41.5% of players
     above the average (PuckPedia via The Win Column): 32-50% here.
       https://thewincolumn.ca/2026/04/19/how-much-do-nhl-players-make-in-2025-26/
   - twenty-three on every active roster; fifty contracts or fewer; contracts no longer than seven years
   - offer sheets are rare: twelve signed in the cap era, Kesler's in 2006 to Broberg's and Holloway's in 2024, about
     0.6 a summer: 0.1-1.5 a summer here. Buyouts a handful a summer.
       https://www.dailyfaceoff.com/news/a-brief-history-of-offer-sheets-in-the-nhls-salary-cap-era
   - the points spread stays the league's (standings points sd 12-18; the NHL about 14)
   Also: an engine-26 career's season replays as before and its first engine-27 summer brings it onto the rules.

     node test/hockey-fo.js [seasons=20] [seed=11]          last line: MATCH or MISMATCH */
const path=require('path'), {load}=require('./harness.js');
const FILE=process.env.HK_FILE||path.join(__dirname,'..','dist','hockey-coach-pro.html');
const Y=+process.argv[2]||20, SEED=+process.argv[3]||11;
const X=['S','SEA','U','NAMES','tdDeal','faKey','hkFreeAgentPreview','hkStatus','newDynasty','openOffseason','commitOffseason','LEAGUE','HK$','hkCapHit','hkContracts','hkResOf','hkFO','POS','render','ENGINE_V'];
const A=load({file:FILE,expose:X});
let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const q=(a,p)=>{ const b=a.slice().sort((x,y)=>x-y); return b[Math.floor(p*(b.length-1))] }, avg=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
A.newDynasty('Toronto',SEED,'T');
const H=A.HK$, CAP=H.cap;
ok(A.hkFO(A.U),'a new career starts on the front office\'s rules');
ok(A.NAMES.every(t=>A.U.roster[t].length===23&&A.U.roster[t].every(p=>p&&p.k&&p.k.v===3)),'twenty-three under contract on every roster as a career opens');
ok(Math.abs(A.LEAGUE.cap-104)<1e-9,`the cap the game reads: $${A.LEAGUE.cap}M`);
ok(A.LEAGUE.trade.by==='Mar 1',`the trade deadline: ${A.LEAGUE.trade.by} (the 2027 date)`);
const Z={ret:[],retBad:0,u80:[],share:[],within3:[],room8:[],low:[],over:0,under:0,contend:[],top:[],mean:[],above:[],n23:0,nTeams:0,c50:0,yrsMax:0,contracts:[],elc:[],os:[],buy:[],arb:[],sign:[],res:[],pts:[],rfaQ:[],up:[],min:[]};
const snap=(label)=>{ const U=A.U, sh=[], hits=[];
  A.NAMES.forEach(t=>{ const R=U.roster[t], c=A.hkCapHit(U,t,R); sh.push(c/CAP); Z.nTeams++;
    if(c>CAP+0.005)Z.over++; if(c<H.floor-0.005)Z.under++;
    if(R.filter(Boolean).length===23)Z.n23++; const nc=A.hkContracts(U,t,R); Z.contracts.push(nc); if(nc>50)Z.c50++;
    R.forEach(p=>{ if(!p)return; hits.push(p.k.sal); if(p.k.yrs>Z.yrsMax)Z.yrsMax=p.k.yrs }); Z.elc.push(R.filter(p=>p&&p.k.elc).length); Z.res.push(A.hkResOf(U,t).length) });
  const E=(A.SEA&&A.SEA.elo)||U.perceived, top8=A.NAMES.slice().sort((a,b)=>E[b]-E[a]).slice(0,8);
  Z.contend.push(avg(top8.map(t=>A.hkCapHit(U,t)/CAP)));
  Z.share.push(q(sh,0.5)); Z.within3.push(sh.filter(x=>x>=0.97).length/sh.length); Z.room8.push(sh.filter(x=>x<=0.92).length/sh.length); Z.low.push(Math.min(...sh)); Z.u80.push(sh.filter(x=>x<0.8).length/sh.length);
  const m=avg(hits); Z.top.push(Math.max(...hits)/CAP); Z.mean.push(m/CAP); Z.above.push(hits.filter(x=>x>m).length/hits.length); Z.min.push(hits.filter(x=>x<=H.min+0.001).length/hits.length);
  if(label)console.log(`  ${label}: median ${(100*q(sh,.5)).toFixed(1)}% of the cap (lowest ${(100*Math.min(...sh)).toFixed(1)}%, highest ${(100*Math.max(...sh)).toFixed(1)}%), within 3% ${sh.filter(x=>x>=0.97).length}, 8%+ room ${sh.filter(x=>x<=0.92).length}; top hit $${Math.max(...hits).toFixed(2)}M, mean $${m.toFixed(2)}M`) };
snap('opening night, 2026');
/* the summer screen, read as text: your cap line, expiring men by status, buyouts, your offers, the reserve list; then
   your choices go through and the banner says what came of them */
let SCR=null;
const txt=h=>h.replace(/<[^>]+>/g,' ').replace(/&middot;/g,'·').replace(/&mdash;/g,'—').replace(/&minus;/g,'-').replace(/\s+/g,' ');
function screens(){
  const P=A.S.off.picks, t=A.S.myTeam, R=A.U.roster[t], h=txt(A.LEAGUE.ui.offseasonScreen()); SCR0=A.LEAGUE.ui.offseasonBlock();
  const exp=Object.keys(P.asks).map(Number), rfa=exp.find(i=>P.asks[i].st!=='UFA'), arb=exp.find(i=>P.asks[i].st==='RFA-A');
  if(arb!=null){ P.resign[arb]='arb'; P.arbYrs={[arb]:2} } else if(rfa!=null)P.resign[rfa]='q';
  const bo=R.filter(p=>p&&!p.k.elc&&p.k.yrs>=2&&p.k.sal>=2).sort((a,b)=>b.k.sal-a.k.sal)[0]; if(bo)P.buyouts=[A.faKey(t,bo)];
  const pre=A.hkFreeAgentPreview(A.U,t), ufa=pre.find(x=>x.st==='UFA'), os=pre.find(x=>x.st==='RFA');
  P.targets=[ufa,os].filter(Boolean).map(x=>x.key); P.bids={}; if(ufa)P.bids[ufa.key]={sal:Math.min(H.max,ufa.ask*1.25),yrs:ufa.yrs}; if(os)P.bids[os.key]={sal:Math.min(H.max,os.ask*1.4),yrs:5};
  const h2=txt(A.LEAGUE.ui.offseasonScreen());
  SCR={h:h,h2:h2,arb:arb,rfa:rfa,bo:bo&&bo.n,ufa:ufa&&ufa.n,os:os&&os.n,block:SCR0} }
let SCR0;
for(let y=0;y<Y;y++){
  let g=0; while(A.SEA.phase!=='done'&&g++<900)A.SEA.advance();
  (A.SEA.cpuTr||[]).forEach(x=>{ if(x.ret){ Z.ret.push(x.ret); if(x.ret.pct>0.5)Z.retBad++ } });
  A.NAMES.forEach(t=>{ const L=(A.U.hkDead[t]||[]).filter(d=>d.why==='ret'); if(L.length>3||L.reduce((s,d)=>s+d.sal,0)>CAP*0.15+0.01)Z.retBad++ });
  A.NAMES.forEach(t=>Z.pts.push(A.SEA.rec[t][0]*2+(A.SEA.otl?A.SEA.otl[t]||0:0)));
  A.openOffseason(); if(y===1)screens(); for(let c=0;c<4;c++){ if(!A.S.off)break; if(A.S.off.act.userOpen&&A.S.off.move===null)A.S.off.move=A.S.myTeam; A.commitOffseason() }
  const r=A.S.lastNbaRep&&A.S.lastNbaRep.rep; if(r){ const n=k=>A.NAMES.reduce((s,t)=>s+(r[k][t]||[]).length,0);
    Z.os.push(r.os.length); Z.buy.push(n('buyouts')); Z.arb.push(n('arb')); Z.sign.push(n('signed')); Z.rfaQ.push(n('rfa')); Z.up.push(n('up')) }
  snap(y<3||y===Y-1||y%5===4?`after summer ${y+1} (${A.U.year})`:null);
}
if(SCR){ const h=SCR.h, h2=SCR.h2; console.log('  the summer screen: '+h.slice(h.indexOf('Expiring contracts'),h.indexOf('Expiring contracts')+420).trim()+' ...');
  ok(/Cap hit \$[\d.]+M · cap \$104M/.test(h)&&/of 23 signed for next season · \d+ of 50 contracts · the floor is \$76\.9M/.test(h),'the summer screen leads with the cap hit, the twenty-three and the fifty contracts');
  ok(SCR.block===null,`the staff's plan fits under the cap as the screen opens (${SCR.block||'no block'})`);
  ok(/(unrestricted|restricted)/.test(h)&&(SCR.rfa==null||/Qualify and sign/.test(h)&&/Don't qualify/.test(h)),'expiring men by status: re-sign or let go, qualify or not');
  ok(SCR.arb==null||/Arbitration/.test(h)&&/an arbitrator would award about \$/.test(h2)&&/Two years/.test(h2),`arbitration offered to a man with the rights, its term your choice${SCR.arb==null?' (none this summer)':''}`);
  ok(/Buyouts/.test(h)&&(!SCR.bo||/Buying out/.test(h2)&&/a year against the cap for/.test(h2)),'buyouts, their dead money spelled out');
  ok(/Free agents and offer sheets you want/.test(h)&&(!SCR.os||/an offer sheet costs (a|two|four|no)/.test(h2))&&/\+ \$250K/.test(h2),'free agents and offer sheets with your price and years, a sheet\'s picks shown');
  ok(/Reserve list · \d+ prospect/.test(h),'the reserve list on the summer screen');
  const X=A.S.history[A.S.history.length-2]&&A.S.history[A.S.history.length-2].league||{}, last=A.S.history.find(z=>z.year===2027)||{}, L=last.league||{}, b=L.hk;
  ok(!!b&&(!SCR.bo||b.buyouts.some(x=>x.n===SCR.bo)),`your buyout went through${SCR.bo?' ('+SCR.bo+')':''}`);
  ok(!!b&&(SCR.arb==null||b.arb.length>0),'your arbitration case was heard');
  ok(!!b&&(!SCR.os||b.os.some(e=>e.n===SCR.os)||b.osMine.some(x=>x.n===SCR.os)),`your offer sheet was sent or its reason given${SCR.os?' ('+SCR.os+')':''}`); }
{ const t=A.S.myTeam, rv=txt(A.LEAGUE.reservesHTML(t,{})), pl=txt(A.LEAGUE.payrollLine(t));
  ok(/The rest of the twenty-three/.test(rv)&&/Reserve list · \d+ prospect/.test(rv),'the roster tab lists the rest of the twenty-three and the reserve list');
  ok(/Cap hit \$[\d.]+M of \$104M · /.test(pl),`the club card's cap line: ${pl.trim()}`) }
console.log(`  summers: offer sheets ${avg(Z.os).toFixed(2)} (${Z.os.join(',')}), buyouts ${avg(Z.buy).toFixed(1)}, arbitration ${avg(Z.arb).toFixed(1)}, free-agent signings ${avg(Z.sign).toFixed(0)}, restricted decisions ${avg(Z.rfaQ).toFixed(0)}, prospects up ${avg(Z.up).toFixed(1)}`);
console.log(`  rosters: contracts ${avg(Z.contracts).toFixed(1)} a club (most ${Math.max(...Z.contracts)}), entry-level ${avg(Z.elc).toFixed(1)}, reserve list ${avg(Z.res).toFixed(1)}, at the minimum ${(100*avg(Z.min)).toFixed(0)}%`);
const mu=avg(Z.pts), sd=Math.sqrt(avg(Z.pts.map(x=>(x-mu)**2)));
ok(A.U.year===2026+Y,`every summer ran (the league is in ${A.U.year})`);
ok(Z.over===0,`no club over the $104.0M cap after a summer (${Z.over} of ${Z.nTeams})`);
ok(Z.under===0,`no club under the $76.9M floor (${Z.under} of ${Z.nTeams})`);
ok(q(Z.share,0.5)>=0.94&&q(Z.share,0.5)<=1.0,`median payroll ${(100*q(Z.share,.5)).toFixed(1)}% of the cap (real 94-100%; 2025-26: 97.7%)`);
ok(avg(Z.within3)>=0.35&&avg(Z.within3)<=0.75,`clubs within 3% of the cap ${(100*avg(Z.within3)).toFixed(0)}% (real 35-75%; 2025-26: 59%)`);
ok(avg(Z.room8)>=0.10&&avg(Z.room8)<=0.35,`clubs with 8% or more of room ${(100*avg(Z.room8)).toFixed(0)}% (real 10-35%; 2025-26: 22%)`);
ok(avg(Z.u80)<=0.10,`clubs under 80% of the cap ${(100*avg(Z.u80)).toFixed(1)}% (real: a club or two in a bad year; the lowest of all ${(100*Math.min(...Z.low)).toFixed(1)}%, the floor 73.9%)`);
ok(avg(Z.contend)>=0.95,`the top eight by strength spend ${(100*avg(Z.contend)).toFixed(1)}% of the cap (real: the contenders at it)`);
ok(q(Z.top,0.5)>=0.13&&q(Z.top,0.5)<=0.19,`the top cap hit ${(100*q(Z.top,.5)).toFixed(1)}% of the cap, $${(q(Z.top,.5)*CAP).toFixed(1)}M (real 13-17%: $14.0M of $95.5M, $17.0M of $104.0M)`);
ok(avg(Z.mean)>=0.030&&avg(Z.mean)<=0.046,`the average cap hit ${(100*avg(Z.mean)).toFixed(2)}% of the cap, $${(avg(Z.mean)*CAP).toFixed(2)}M (real 3.7%: $3.5M of $95.5M)`);
ok(avg(Z.above)>=0.32&&avg(Z.above)<=0.50,`players above the average ${(100*avg(Z.above)).toFixed(0)}% (real 41.5%)`);
ok(Z.n23===Z.nTeams,`twenty-three on every roster after every summer (${Z.n23} of ${Z.nTeams})`);
ok(Z.c50===0,`no club past fifty contracts (most ${Math.max(...Z.contracts)})`);
ok(Z.yrsMax<=7,`no contract longer than seven years (longest ${Z.yrsMax})`);
ok(avg(Z.os)>=0.1&&avg(Z.os)<=1.5,`offer sheets ${avg(Z.os).toFixed(2)} a summer (real 0.6: twelve from 2006 to 2024)`);
ok(avg(Z.buy)>=1&&avg(Z.buy)<=20,`buyouts ${avg(Z.buy).toFixed(1)} a summer (real about 5-15)`);
ok(Z.ret.length>0&&Z.retBad===0,`retained salary at the deadline: ${Z.ret.length} of the computer's deals in ${Y} seasons, half or less each (most ${Z.ret.length?Math.round(100*Math.max(...Z.ret.map(r=>r.pct))):0}%), three a club and 15% of the cap at most (${Z.retBad} broken)`);
{ // your side of a deal: over the cap with the man you'd get, his club keeps part of his cap hit; past half, no deal
  const my=A.S.myTeam, t=A.NAMES.find(x=>x!==my), M=A.SEA.roster[my].map(p=>p&&Object.assign({},p,{k:Object.assign({},p.k)})), T=A.SEA.roster[t];
  const q=T.slice().filter(p=>p&&!p.k.ret).sort((a,b)=>b.k.sal-a.k.sal)[0], k=T.indexOf(q)%6, a=M.findIndex((p,i)=>p&&i%6===k&&i>=12);
  const base=M.reduce((s,p)=>s+p.k.sal,0)-M[a].k.sal, dead=(A.U.hkDead[my]||[]).reduce((s,d)=>s+d.sal,0)+((A.SEA.hkRet||[]).filter(d=>d.t===my).reduce((s,d)=>s+d.sal,0));
  const f=(CAP-dead-q.k.sal*0.7)/base; M.forEach((p,i)=>{ if(i!==a)p.k.sal*=f });   // over by 30% of his cap hit with him
  const M2=M.slice(); M2[a]=q; const T2=T.slice(); T2[T.indexOf(q)]=M[a];
  const cf=A.LEAGUE.trade.capFit(A.SEA,{my:my,t:t,M:M,M2:M2,T:T,T2:T2});
  const w=cf&&cf.ret?txt(A.LEAGUE.trade.retWords(cf.ret)):'';
  ok(cf&&!cf.over&&cf.ret&&cf.ret.by===t&&cf.ret.pct===0.3,`a deal over the cap works with salary kept: ${w||JSON.stringify(cf)}`);
  M.forEach((p,i)=>{ if(i!==a)p.k.sal*=1+q.k.sal*0.3/base });
  const cf2=A.LEAGUE.trade.capFit(A.SEA,{my:my,t:t,M:M,M2:M2,T:T,T2:T2});
  ok(cf2&&cf2.over,'over by more than half his cap hit: no deal'); }
ok(sd>=12&&sd<=18,`standings points sd ${sd.toFixed(1)} (NHL about 14)`);

/* a career begun on engine 26: its season and summer go as they went (twelve men, the old $90M limit); the next season
   is on engine 27 but keeps the old rules until its summer, which brings the career onto the front office's */
(async()=>{
  const season=B=>{ let g=0; while(B.SEA.phase!=='done'&&g++<900)B.SEA.advance() };
  const summer=B=>{ B.openOffseason(); for(let c=0;c<4;c++){ if(!B.S.off)break; if(B.S.off.act.userOpen&&B.S.off.move===null)B.S.off.move=B.S.myTeam; B.commitOffseason() } };
  for(let i=0;i<20;i++)await new Promise(r=>setImmediate(r));   // the first career's saves land in its own storage first
  // golden.js's loader: its loadSave goes through the game's own load path
  const gsrc=require('fs').readFileSync(path.join(__dirname,'golden.js'),'utf8');
  const mk=()=>{ const m={exports:{}}; new Function('require','module',gsrc.slice(0,gsrc.indexOf('const args'))+'\nmodule.exports={load};')(require,m); return m.exports.load(FILE) };
  process.env.ENGINE_NOW='26'; const O=mk(); process.env.ENGINE_NOW='';
  O.newDynasty('Boston',5,'T');
  const B=mk(); await B.loadSave(JSON.stringify(O.S));
  const hit=t=>B.U.roster[t].reduce((s,p)=>s+(p?p.k.sal:0),0)+(((B.U.hkDead||{})[t])||[]).reduce((s,d)=>s+d.sal,0);
  ok(!B.U.hkFO&&B.U.engV===26,'an engine-26 save loads on its old rules');
  season(B); summer(B);
  ok(!B.U.hkFO&&B.NAMES.every(t=>B.U.roster[t].length===12)&&B.LEAGUE_CAP()===90,`its summer goes as before: twelve men, the $${B.LEAGUE_CAP()}M limit`);
  ok(B.U.engV===27,'its next season is on engine 27');
  season(B); summer(B);
  ok(B.U.hkFO&&B.NAMES.every(t=>B.U.roster[t].length===23&&B.U.roster[t].every(p=>p&&p.k&&p.k.v===3)),'its first engine-27 summer brings it onto the front office: twenty-three under contract');
  const hits=B.NAMES.map(hit);
  ok(hits.every(c=>c<=CAP+0.01&&c>=H.floor-0.01),`every club between the floor and the cap after it ($${Math.min(...hits).toFixed(1)}M to $${Math.max(...hits).toFixed(1)}M)`);
  console.log(bad?`MISMATCH ${bad}`:'MATCH the front office keeps the real league\'s cap sheets');
  process.exit(bad?1:0) })();
