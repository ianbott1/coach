// how often a team's usual plan is the card's pick, across every opponent where the game is live (20-80%), home
const path=require('path'); const DIST=process.env.DIST||require('path').join(__dirname,'..','..','dist'); const {load}=require(require('path').join(__dirname,'..','harness.js'));
const GAMES={nfl:'football-coach-pro.html',cfb:'football-coach.html',nba:'basketball-coach-pro.html',ncaab:'basketball-coach.html',nhl:'hockey-coach-pro.html',epl:'soccer-coach.html',mlb:'baseball-coach-pro.html'};
const only=process.argv[2]; const NT=+(process.argv[3]||10);
for(const [lg,f] of Object.entries(GAMES)){ if(only&&only!==lg)continue;
  const A=load({file:path.join(DIST,f),expose:['S','SEA','newDynasty','NAMES','winProb','LEAGUE','plan'],settable:['plan']});
  const names=A.NAMES.slice(), step=Math.max(1,Math.floor(names.length/NT)), picks=names.filter((_,i)=>i%step===0).slice(0,NT);
  let shares=[], tot={safe:0,balanced:0,aggressive:0}, spreadE=[];
  for(const t of picks){ A.newDynasty(t,5,'T'); const my=A.S.myTeam; const cnt={safe:0,balanced:0,aggressive:0}; let n=0;
    for(const o of names){ if(o===my)continue; const p={}; for(const k of ['safe','balanced','aggressive']){ A.plan=k; p[k]=A.LEAGUE.wdl?A.LEAGUE.wdl(my,o,true,false)[0]:A.winProb(my,o,true,false) } A.plan='balanced';
      if(p.balanced<0.2||p.balanced>0.8)continue; const R=x=>Math.round(x*100), d=k=>R(p[k])-R(p.balanced); const b=d('aggressive')>d('safe')?'aggressive':'safe'; const pick=d(b)>=2?b:'balanced'; cnt[pick]++; tot[pick]++; n++; spreadE.push(d('safe')-d('aggressive')) }
    if(n)shares.push(Math.max(...Object.values(cnt))/n) }
  const m=shares.reduce((a,b)=>a+b,0)/shares.length; const sd=a=>{const u=a.reduce((x,y)=>x+y,0)/a.length; return Math.sqrt(a.reduce((x,y)=>x+(y-u)**2,0)/a.length)};
  console.log(`${lg.padEnd(6)} a team's usual pick is the card's pick in ${(m*100).toFixed(0)}% of its live games (teams: ${shares.map(x=>Math.round(x*100)).join(' ')}); picks ${JSON.stringify(tot)}`) }
