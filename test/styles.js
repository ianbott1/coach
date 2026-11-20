/* Club styles from rosters (round 92, engine 15). In all seven games:
   - every club has a style read from its opening roster, spread across the styles (none past 60% of clubs);
   - the scouting report's roster line (each style's attributes ranked in the league) has its best rank on the club's own
     style for most clubs (near-ties keep the hash, so not all);
   - the same career draws the same styles, and a trade during the season doesn't change them (clubStyle reads the table
     made as the season opened);
   - on engine 14 there is no table and every style is the old hash;
   - football: a right read's worth follows your roster (fbReadFit) and averages 1 across the league.
     node test/styles.js      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
let bad=0; const ok=(c,m)=>{ console.log((c?"  ok   ":"  FAIL ")+m); if(!c)bad++; return !!c };
const GAMES=[['basketball-coach-pro.html','Boston','clubStyle'],['basketball-coach.html','Duke','clubStyle'],['hockey-coach-pro.html','Boston','clubStyle'],['soccer-coach.html','Arsenal','clubStyle'],
  ['baseball-coach-pro.html','Seattle','clubStyle'],['football-coach-pro.html','Kansas City','clubScheme'],['football-coach.html','Alabama','clubScheme']];
for(const [f,team,fn] of GAMES){
  const L=()=>load({file:path.join(__dirname,'..','dist',f),settable:['ENGINE_V'],expose:['SEA','newDynasty','NAMES','strHash','ENGINE_V','gameCtx','fbReadFit',fn]});
  const A=L(); A.newDynasty(team,7,'T'); const X=A.SEA._styles;
  if(!ok(X&&X.style&&A.NAMES.every(t=>X.style[t]),`${f}: every club has a style from its roster`))continue;
  const c={}; A.NAMES.forEach(t=>c[X.style[t]]=(c[X.style[t]]||0)+1); const top=Math.max(...Object.values(c))/A.NAMES.length;
  ok(top<=0.6,`${f}: styles spread across the league (${JSON.stringify(c)})`);
  let agree=0; A.NAMES.forEach(t=>{ const R=X.rank[t], k=Object.keys(R).sort((a,b)=>R[a]-R[b])[0]; if(k===X.style[t])agree++ });
  ok(agree/A.NAMES.length>=0.75,`${f}: the roster line's best rank names the style for ${(100*agree/A.NAMES.length).toFixed(0)}% of clubs (near-ties keep the hash)`);
  ok(A.NAMES.every(t=>A[fn](t,A.SEA.year)===X.style[t]),`${f}: ${fn} reads the season's table`);
  const B=L(); B.newDynasty(team,7,'T'); ok(A.NAMES.every(t=>B.SEA._styles.style[t]===X.style[t]),`${f}: the same career draws the same styles`);
  // a trade during the season: swap two clubs' rosters outright; the styles stay those of the opening rosters
  const [t1,t2]=[A.NAMES[1],A.NAMES[2]], r1=A.SEA.roster[t1]; A.SEA.roster[t1]=A.SEA.roster[t2]; A.SEA.roster[t2]=r1;
  ok(A[fn](t1,A.SEA.year)===X.style[t1]&&A[fn](t2,A.SEA.year)===X.style[t2],`${f}: a roster changed during the season doesn't change its style`);
  if(/football/.test(f)){ const v={}; for(const a of ['quick','run','deep']){ const w=B.NAMES.map(t=>B.fbReadFit(a,B.gameCtx(t,B.NAMES[0],B.SEA.year,1),'home')); v[a]=w.reduce((x,y)=>x+y,0)/w.length }
    ok(Object.values(v).every(m=>Math.abs(m-1)<0.03)&&new Set(B.NAMES.map(t=>B.fbReadFit('deep',B.gameCtx(t,B.NAMES[0],B.SEA.year,1),'home'))).size>3,`${f}: a right read's worth follows the roster and averages 1 (quick ${v.quick.toFixed(3)}, run ${v.run.toFixed(3)}, deep ${v.deep.toFixed(3)})`) }
  // engine 14: no table, the old hash
  process.env.ENGINE_NOW='14'; const C14=load({file:path.join(__dirname,'..','dist',f),expose:['SEA','newDynasty','NAMES','strHash',fn]}); delete process.env.ENGINE_NOW;
  C14.newDynasty(team,7,'T');
  ok(!C14.SEA._styles&&C14.NAMES.every(t=>C14[fn](t,C14.SEA.year)!==undefined),`${f}: on engine 14 there is no table (the old hash)`);
}
console.log(bad?`MISMATCH ${bad}`:'MATCH every club plays to its opening roster, the report says so, and old seasons keep the hash'); process.exit(bad?1:0);
