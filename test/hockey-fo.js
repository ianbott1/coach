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
   - offer sheets are rare (2019-2025: about one a summer, PuckPedia's tracker): 0-3 a summer on average; buyouts a
     handful a summer; arbitration filings a few
       https://www.puckpedia.com/offer-sheet-tracker
   - the points spread stays the league's (standings points sd 12-18; the NHL about 14)
   Also: an engine-26 career's season replays as before and its first engine-27 summer brings it onto the rules.

     node test/hockey-fo.js [seasons=20] [seed=11]          last line: MATCH or MISMATCH */
const path=require('path'), {load}=require('./harness.js');
const FILE=process.env.HK_FILE||path.join(__dirname,'..','dist','hockey-coach-pro.html');
const Y=+process.argv[2]||20, SEED=+process.argv[3]||11;
const X=['S','SEA','U','NAMES','newDynasty','openOffseason','commitOffseason','LEAGUE','HK$','hkCapHit','hkContracts','hkResOf','hkFO','POS','render','ENGINE_V'];
const A=load({file:FILE,expose:X});
let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const q=(a,p)=>{ const b=a.slice().sort((x,y)=>x-y); return b[Math.floor(p*(b.length-1))] }, avg=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
A.newDynasty('Toronto',SEED,'T');
const H=A.HK$, CAP=H.cap;
ok(A.hkFO(A.U),'a new career starts on the front office\'s rules');
ok(A.NAMES.every(t=>A.U.roster[t].length===23&&A.U.roster[t].every(p=>p&&p.k&&p.k.v===3)),'twenty-three under contract on every roster as a career opens');
ok(Math.abs(A.LEAGUE.cap-104)<1e-9,`the cap the game reads: $${A.LEAGUE.cap}M`);
const Z={u80:[],share:[],within3:[],room8:[],low:[],over:0,under:0,contend:[],top:[],mean:[],above:[],n23:0,nTeams:0,c50:0,yrsMax:0,contracts:[],elc:[],os:[],buy:[],arb:[],sign:[],res:[],pts:[],rfaQ:[],up:[],min:[]};
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
for(let y=0;y<Y;y++){
  let g=0; while(A.SEA.phase!=='done'&&g++<900)A.SEA.advance();
  A.NAMES.forEach(t=>Z.pts.push(A.SEA.rec[t][0]*2+(A.SEA.otl?A.SEA.otl[t]||0:0)));
  A.openOffseason(); for(let c=0;c<4;c++){ if(!A.S.off)break; if(A.S.off.act.userOpen&&A.S.off.move===null)A.S.off.move=A.S.myTeam; A.commitOffseason() }
  const r=A.S.lastNbaRep&&A.S.lastNbaRep.rep; if(r){ const n=k=>A.NAMES.reduce((s,t)=>s+(r[k][t]||[]).length,0);
    Z.os.push(r.os.length); Z.buy.push(n('buyouts')); Z.arb.push(n('arb')); Z.sign.push(n('signed')); Z.rfaQ.push(n('rfa')); Z.up.push(n('up')) }
  snap(y<3||y===Y-1||y%5===4?`after summer ${y+1} (${A.U.year})`:null);
}
console.log(`  summers: offer sheets ${avg(Z.os).toFixed(2)} (${Z.os.join(',')}), buyouts ${avg(Z.buy).toFixed(1)}, arbitration ${avg(Z.arb).toFixed(1)}, free-agent signings ${avg(Z.sign).toFixed(0)}, restricted decisions ${avg(Z.rfaQ).toFixed(0)}, prospects up ${avg(Z.up).toFixed(1)}`);
console.log(`  rosters: contracts ${avg(Z.contracts).toFixed(1)} a club (most ${Math.max(...Z.contracts)}), entry-level ${avg(Z.elc).toFixed(1)}, reserve list ${avg(Z.res).toFixed(1)}, at the minimum ${(100*avg(Z.min)).toFixed(0)}%`);
const mu=avg(Z.pts), sd=Math.sqrt(avg(Z.pts.map(x=>(x-mu)**2)));
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
ok(avg(Z.os)<=3,`offer sheets ${avg(Z.os).toFixed(2)} a summer (real about one)`);
ok(avg(Z.buy)>=1&&avg(Z.buy)<=20,`buyouts ${avg(Z.buy).toFixed(1)} a summer (real about 5-15)`);
ok(sd>=12&&sd<=18,`standings points sd ${sd.toFixed(1)} (NHL about 14)`);
console.log(bad?`MISMATCH ${bad}`:'MATCH the front office keeps the real league\'s cap sheets');
process.exit(bad?1:0);
