/* Soccer: one man's season against the Premier League's (round 3, engine 27). A computer-run Manchester City striker
   (the 4th club, seed 1234) scored 65 league goals in a season, past the record of 36 by week 28: the unit shares credit
   a whole side's goals to one striker, one winger, one midfielder, and the matchday's best sides can score 140. Engine
   27 holds a man running ahead of about a goal a game (src/soccer/75_screens.js scPace); the side's goals don't move.
     node test/soccer-goals.js [dist-file]      last line: MATCH or MISMATCH
   Checks, Premier League games only (no cups):
     - seed 1234 with the 4th club: the season's top scorer back near the record (was 65)
     - twelve seasons (seed 1234 and five more careers, two seasons each): the Golden Boot's mean and highest against
       the real ones
     - the same first seasons with the hold switched off (SC27_P=99): every result, goal and draw the same; only the
       scorers move
   Source (read November 2026): https://en.wikipedia.org/wiki/Premier_League_Golden_Boot. The 38-game seasons since
   1995-96: 18 to 36 (Haaland, 2022-23, the record), 25.9 on average; the last three 36, 27, 29. */
const path=require('path');const {load}=require('./harness.js');
const FILE=process.argv[2]||path.join(__dirname,'..','dist','soccer-coach.html');
const EXPOSE=['S','SEA','NAMES','LEAGUE','POS','STAT_KEYS','glStride','newDynasty','openOffseason','commitOffseason','ENGINE_V','CONF'];
let bad=0, checks=0; const ok=(c,m)=>{ checks++; console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
function reg(A,p){ const gl=p.gl||[], w=A.glStride(), o={g:0,goals:0}; for(let j=0;j+w<=gl.length;j+=w){ if(gl[j]>=A.LEAGUE.weeks||(gl[j+2]&2))continue;
  const Q=A.POS[gl[j+5]]; if(!Q)continue; o.g++; (A.STAT_KEYS[Q.p]||[]).forEach((k,q)=>o[k]=(o[k]||0)+gl[j+6+q]) } return o }
function season(A){
  let g=0; while(A.SEA.phase!=='done'&&g++<9000)A.SEA.advance();
  const T=A.NAMES.filter(t=>A.CONF[t]===A.LEAGUE.conf.order[0]); let G=0, goals=0, draws=0; const res=[];
  A.SEA.weeks.slice(0,A.LEAGUE.weeks).forEach(W=>W.games.forEach(x=>{ if(x.hp==null||!T.includes(x.home))return; G++; goals+=x.hp+x.ap; if(x.hp===x.ap)draws++; res.push(x.hp+'-'+x.ap) }));
  const R=[]; T.forEach(t=>(A.SEA.roster[t]||[]).forEach(p=>{ if(p){ const s=reg(A,p); if(s.goals)R.push(s.goals) } })); R.sort((a,b)=>b-a);
  return {top:R[0], fifth:R[4], gpg:goals/G, draws:draws/G, res:res.join(',')} }
function next(A){ A.openOffseason(); for(let c=0;c<6&&A.S.off;c++){ const O=A.S.off; if(O.act&&O.act.userOpen&&O.move===null)O.move=A.S.myTeam;
  if(A.LEAGUE.ui.offseasonBlock()!==null&&O.picks&&O.picks.resign)Object.keys(O.picks.resign).forEach(k=>O.picks.resign[k]=false); A.commitOffseason() } }
const t0=Date.now();
const CAREERS=[[3,1234],[0,11],[0,12],[0,13],[0,14],[0,15]];
function run(){ const A=load({file:FILE,expose:EXPOSE}), out=[];
  CAREERS.forEach(([c,seed])=>{ A.newDynasty(A.NAMES[c],seed,'T'); const a=season(A); next(A); out.push([a,season(A)]) }); return {A,out} }
const {A,out}=run();
ok(A.ENGINE_V>=27,`engine ${A.ENGINE_V}`);
const tops=[].concat(...out.map(x=>x.map(s=>s.top))), mean=tops.reduce((a,b)=>a+b,0)/tops.length;
console.log('  Golden Boot, league goals, twelve seasons:',tops.join(', '),' fifth:',[].concat(...out.map(x=>x.map(s=>s.fifth))).join(', '));
ok(out[0][0].top<=40,`seed 1234, the 4th club: the top scorer ${out[0][0].top} (65 before; the record 36)`);
ok(mean>=22&&mean<=31,`Golden Boot mean ${mean.toFixed(1)} (band 22-31; real 25.9 since 1995-96)`);
ok(Math.max(...tops)<=40,`Golden Boot highest ${Math.max(...tops)} (band up to 40; the record 36)`);
// the hold off: the same first seasons play the same games
process.env.SC27_P='99'; const B=load({file:FILE,expose:EXPOSE}); delete process.env.SC27_P;
const off=CAREERS.map(([c,seed])=>{ B.newDynasty(B.NAMES[c],seed,'T'); return season(B) });
ok(off.every((s,i)=>s.res===out[i][0].res),`the same results with the hold off (goals a game ${off.map(s=>s.gpg.toFixed(2)).join(', ')}; draws ${off.map(s=>(100*s.draws).toFixed(1)+'%').join(', ')})`);
console.log('  with the hold off, Golden Boot:',off.map(s=>s.top).join(', '),' with it:',out.map(x=>x[0].top).join(', '));
console.log(`  (${((Date.now()-t0)/1000).toFixed(0)}s) ${checks} checks`);
console.log(bad?`MISMATCH ${bad} of ${checks}`:'MATCH one man\'s season looks like the Premier League\'s'); process.exit(bad?1:0);
