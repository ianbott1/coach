/* How hard is the weekly challenge? (review round 3, core 95_share; a measurement, not a verdict.) For each game,
   N weeks' challenges played by the assistant alone (every game simmed, as Sim ahead plays it): how often each goal is
   met. A person's calls and plans should do better (the assistant is the floor), so each goal is pitched where the
   assistant meets it now and then, and a good season does.
   A real figure for the "post" goal: clubs picked to miss the postseason make it every year. The NFL has had at least
   four new playoff teams every season since 1990 (https://nflspinzone.com/2023/01/10/incredible-nfl-playoffs-streak-extends-33-seasons),
   four or more of 12-14 places. The challenge's post club is picked 55-75% of the way down the league, so the
   assistant alone should get it there a few times in ten, and a good season more often.
     node test/share-odds.js [weeks=9] [game ...] */
const path=require('path'), {load}=require('./harness.js');
const GAMES={cfb:'football-coach.html',nfl:'football-coach-pro.html',ncaab:'basketball-coach.html',nba:'basketball-coach-pro.html',nhl:'hockey-coach-pro.html',epl:'soccer-coach.html',mlb:'baseball-coach-pro.html'};
const args=process.argv.slice(2), N=+(args.find(a=>/^\d+$/.test(a))||9), only=args.filter(a=>GAMES[a]);
for(const [lg,f] of Object.entries(GAMES)){ if(only.length&&only.indexOf(lg)<0)continue;
  const T={wins:[0,0],post:[0,0],title:[0,0]}, t0=Date.now();
  for(let w=1;w<=N;w++){ const id='2027-W'+String(w).padStart(2,'0');
    const A=load({file:path.join(__dirname,'..','dist',f),expose:['chStart','chSpec','chMet','chResult','simAdvance','S','SEA']});
    A.chStart(1,'',id); let g=0; while(A.SEA.phase!=='done'&&g++<700)A.simAdvance();
    const C=A.S.challenge, sp=A.chSpec(id), met=A.chMet(sp,C.tgt,A.S.myTeam,A.chResult(A.S.myTeam)); T[sp.kind][0]++; if(met)T[sp.kind][1]++ }
  console.log(`${lg.padEnd(6)} ${Object.keys(T).map(k=>`${k} ${T[k][1]}/${T[k][0]}`).join('   ')}   (${Math.round((Date.now()-t0)/1000)}s)`);
}
