/* Soccer: the spread of a game's goals against the Premier League's (round 3, engine 27). The matchday's best clubs
   scored 110 to 160 league goals a season (the record is 106) and games ended 7-11, 9-5, 13-2: a game's goals spread
   far wider than the real league's. Engine 27 (src/soccer/50_game.js scSplit and makeLiveGame's PQ) holds the gap's
   split of the goals and the gameplans' pull on them.
     node test/soccer-spread.js [dist-file]      last line: MATCH or MISMATCH      (about a minute)
   Checks, Premier League games only (no cups), twelve seasons (six careers, two seasons each):
     - the league: goals a game, draws, the champions' and the bottom club's points
     - the spread: the best club's goals, the worst club's goals against, games of 6+ and 7+ goals, wins by 5+, the
       biggest win, how much a game's goals vary about their mean, and how many more goals a mismatch scores
     - the Championship's goals a game where they were
     - scSplit keeps the ratio of the two sides' rates (who wins), and engine 26 its old split
     - soccer's seasonResult mid-season doesn't settle the season (the play-offs, the champions)
   The same twelve seasons on engine 26 are printed for the record.
   Real figures: every Premier League result 2010-11 to 2024-25 (15 seasons, 5,700 games), from openfootball
   (https://github.com/openfootball/football.json, files 2010-11/en.1.json to 2024-25/en.1.json, read November 2026).
   A season, mean (lowest-highest): goals a game 2.80 (2.57-3.28); draws 24.0% (18.7-29.2%); the best club's goals
   90.7 (71-106, Manchester City 2017-18); the worst club's goals against 79.9 (68-104, Sheffield United 2023-24);
   games of 6+ goals 23.5 (11-36), of 7+ 9.2 (4-15), of 10+ 0.2 (0-2: 8-2, 7-3 and one more in fifteen seasons);
   wins by 5+ 9.2 (2-17); the biggest win 7.2 goals (6-9, 9-0 three times); champions 89.7 points (80-100); the
   bottom club 23.3 (12-33). A game's goals: mean 2.80, variance 2.81 (a Poisson's). Games between clubs 45+ points
   apart in the final table: 1.20 times the goals of games between clubs within 15 (3.21 against 2.67). The
   Championship: 2.45 goals a game in 2024-25 (futbol24.com's season statistics, as src/soccer/55_squad.js cites). */
const path=require('path');const {load}=require('./harness.js');
const FILE=process.argv[2]||path.join(__dirname,'..','dist','soccer-coach.html');
const EXPOSE=['S','SEA','NAMES','LEAGUE','POS','newDynasty','openOffseason','commitOffseason','ENGINE_V','CONF','scSplit'];
let bad=0, checks=0; const ok=(c,m)=>{ checks++; console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const t0=Date.now();
function play(A){ let g=0; while(A.SEA.phase!=='done'&&g++<9000)A.SEA.advance() }
function season(A){ play(A);
  const games=d=>{ const T=A.NAMES.filter(t=>A.CONF[t]===A.LEAGUE.conf.order[d]); const G=[];
    A.SEA.weeks.slice(0,A.LEAGUE.weeks).forEach(W=>W.games.forEach(x=>{ if(x.hp!=null&&!x.cup&&T.includes(x.home)&&T.includes(x.away))G.push(x) })); return {T,G} };
  const {T,G}=games(0), gf={}, ga={}, pts={}; T.forEach(t=>{ gf[t]=0; ga[t]=0; pts[t]=0 });
  G.forEach(x=>{ gf[x.home]+=x.hp; ga[x.home]+=x.ap; gf[x.away]+=x.ap; ga[x.away]+=x.hp;
    if(x.hp===x.ap){ pts[x.home]++; pts[x.away]++ } else pts[x.hp>x.ap?x.home:x.away]+=3 });
  const tot=G.map(x=>x.hp+x.ap), mar=G.map(x=>Math.abs(x.hp-x.ap)), P=T.map(t=>pts[t]).sort((a,b)=>b-a);
  const bins=[[0,0],[0,0]]; G.forEach(x=>{ const d=Math.abs(pts[x.home]-pts[x.away]), k=d<15?0:d>=45?1:-1; if(k>=0){ bins[k][0]++; bins[k][1]+=x.hp+x.ap } });
  const C=games(1).G;
  return {n:G.length, goals:tot.reduce((a,b)=>a+b,0), sq:tot.reduce((a,b)=>a+b*b,0), draws:G.filter(x=>x.hp===x.ap).length,
    best:Math.max(...T.map(t=>gf[t])), worst:Math.max(...T.map(t=>ga[t])), six:tot.filter(x=>x>=6).length, seven:tot.filter(x=>x>=7).length,
    ten:tot.filter(x=>x>=10).length, m5:mar.filter(x=>x>=5).length, big:Math.max(...mar), champ:P[0], bottom:P[P.length-1], bins:bins,
    ch:C.reduce((s,x)=>s+x.hp+x.ap,0)/C.length} }
function next(A){ A.openOffseason(); for(let c=0;c<6&&A.S.off;c++){ const O=A.S.off; if(O.act&&O.act.userOpen&&O.move===null)O.move=A.S.myTeam;
  if(A.LEAGUE.ui.offseasonBlock()!==null&&O.picks&&O.picks.resign)Object.keys(O.picks.resign).forEach(k=>O.picks.resign[k]=false); A.commitOffseason() } }
const CAREERS=[[3,1000],[10,8919],[17,16838],[4,11],[0,12],[7,13]];
function run(A,seasons){ const out=[]; CAREERS.forEach(([c,seed])=>{ A.newDynasty(A.NAMES[c],seed,'T'); for(let y=0;y<seasons;y++){ out.push(season(A)); if(y<seasons-1)next(A) } }); return out }
function sum(R){ const s=k=>R.reduce((a,r)=>a+r[k],0), m=k=>s(k)/R.length, n=s('n'), g=s('goals'), mu=g/n;
  const b=i=>R.reduce((a,r)=>a+r.bins[i][1],0)/Math.max(1,R.reduce((a,r)=>a+r.bins[i][0],0));
  return {gpg:mu, vr:(s('sq')/n-mu*mu)/mu, draws:s('draws')/n, best:m('best'), bestMax:Math.max(...R.map(r=>r.best)), worst:m('worst'),
    six:m('six'), seven:m('seven'), ten:m('ten'), m5:m('m5'), big:m('big'), bigMax:Math.max(...R.map(r=>r.big)), champ:m('champ'), bottom:m('bottom'),
    mis:b(1)/b(0), ch:m('ch')} }
const line=(k,x)=>console.log(`  ${k}: goals a game ${x.gpg.toFixed(2)} (variance/mean ${x.vr.toFixed(2)}), draws ${(100*x.draws).toFixed(1)}%, best club ${x.best.toFixed(1)} goals (most ${x.bestMax}), `+
  `worst ${x.worst.toFixed(1)} against, 6+ goal games ${x.six.toFixed(1)}, 7+ ${x.seven.toFixed(1)}, 10+ ${x.ten.toFixed(2)}, wins by 5+ ${x.m5.toFixed(1)}, `+
  `biggest win ${x.big.toFixed(1)} (most ${x.bigMax}), champions ${x.champ.toFixed(1)}, bottom ${x.bottom.toFixed(1)}, a mismatch's goals x${x.mis.toFixed(2)}, Championship ${x.ch.toFixed(2)}`);

const A=load({file:FILE,expose:EXPOSE});
const R=sum(run(A,2));
ok(A.ENGINE_V>=27,`engine ${A.ENGINE_V}`);
process.env.ENGINE_NOW='26'; const B=load({file:FILE,expose:EXPOSE}); delete process.env.ENGINE_NOW;
const R26=sum(run(B,1));
console.log('Premier League games, twelve seasons (six careers, two seasons each); engine 26, the six first seasons, for the record');
line('engine 27',R); line('engine 26',R26);
console.log('The league');
ok(R.gpg>=2.65&&R.gpg<=3.1,`goals a game ${R.gpg.toFixed(2)} (band 2.65-3.1; real 2.57-3.28, 2.80)`);
ok(R.draws>=0.21&&R.draws<=0.28,`draws ${(100*R.draws).toFixed(1)}% (band 21-28%; real 18.7-29.2%, 24.0%)`);
ok(R.champ>=82&&R.champ<=98,`champions ${R.champ.toFixed(1)} points (band 82-98; real 80-100, 89.7)`);
ok(R.bottom>=15&&R.bottom<=31,`bottom club ${R.bottom.toFixed(1)} points (band 15-31; real 12-33, 23.3)`);
console.log('The spread');
ok(R.best>=82&&R.best<=100,`best club's goals ${R.best.toFixed(1)} (band 82-100; real 71-106, 90.7; engine 26 ${R26.best.toFixed(1)})`);
ok(R.bestMax<=118,`best club's goals, the most in twelve seasons ${R.bestMax} (band up to 118; the record 106; engine 26 ${R26.bestMax} in six)`);
ok(R.worst>=72&&R.worst<=92,`worst club's goals against ${R.worst.toFixed(1)} (band 72-92; real 68-104, 79.9; engine 26 ${R26.worst.toFixed(1)})`);
ok(R.six>=15&&R.six<=33,`games of 6+ goals ${R.six.toFixed(1)} a season (band 15-33; real 11-36, 23.5; engine 26 ${R26.six.toFixed(1)})`);
ok(R.seven>=4&&R.seven<=15,`games of 7+ goals ${R.seven.toFixed(1)} a season (band 4-15; real 4-15, 9.2; engine 26 ${R26.seven.toFixed(1)})`);
ok(R.ten<=1.1,`games of 10+ goals ${R.ten.toFixed(2)} a season (band up to 1.1; real 0.2, 0-2; engine 26 ${R26.ten.toFixed(2)})`);
ok(R.m5>=5&&R.m5<=13,`wins by 5+ ${R.m5.toFixed(1)} a season (band 5-13; real 2-17, 9.2; engine 26 ${R26.m5.toFixed(1)})`);
ok(R.big>=6&&R.big<=8.5,`the season's biggest win ${R.big.toFixed(1)} goals (band 6-8.5; real 6-9, 7.2; engine 26 ${R26.big.toFixed(1)})`);
ok(R.vr<=1.15,`a game's goals: variance ${R.vr.toFixed(2)} times the mean (band up to 1.15; real 1.00; engine 26 ${R26.vr.toFixed(2)})`);
ok(R.mis>=1.08&&R.mis<=1.3,`games between clubs 45+ points apart score ${R.mis.toFixed(2)} times the goals of near neighbours' (band 1.08-1.3; real 1.20; engine 26 ${R26.mis.toFixed(2)})`);
ok(R.ch>=2.35&&R.ch<=2.75,`the Championship's goals a game ${R.ch.toFixed(2)} (band 2.35-2.75; real 2.45 in 2024-25; engine 26 ${R26.ch.toFixed(2)})`);
console.log('The split');
{ const e=0.8, s=A.scSplit(e); ok(Math.abs(Math.log(s[0]/s[1])-e)<1e-9&&s[0]+s[1]<Math.exp(e/2)+Math.exp(-e/2),`scSplit keeps the ratio exp(e) and holds the sum (${(s[0]+s[1]).toFixed(3)} against ${(Math.exp(e/2)+Math.exp(-e/2)).toFixed(3)})`);
  const s26=B.scSplit(e); ok(s26[0]===Math.exp(e/2)&&s26[1]===Math.exp(-e/2),'engine 26 keeps exp(+-e/2)') }
console.log('seasonResult mid-season');
{ const C=load({file:FILE,expose:EXPOSE}); C.newDynasty(C.NAMES[3],1234,'T'); let g=0; while(C.SEA.step<20&&C.SEA.phase==='week'&&g++<9000)C.SEA.advance();
  const t=C.NAMES[3], r=C.SEA.seasonResult(t); ok(/so far$/.test(r)&&!C.SEA._seeded&&!C.SEA.regRec,`week ${C.SEA.step}: "${r}", nothing seeded or frozen`);
  play(C); const D=load({file:FILE,expose:EXPOSE}); D.newDynasty(D.NAMES[3],1234,'T'); play(D);
  ok(C.SEA.champion===D.SEA.champion&&JSON.stringify(C.SEA.table('PL'))===JSON.stringify(D.SEA.table('PL'))&&C.SEA.seasonResult(t)===D.SEA.seasonResult(t),
    `the season ends as it would have (champions ${C.SEA.champion}; ${t}: ${C.SEA.seasonResult(t)})`) }
console.log(`  (${((Date.now()-t0)/1000).toFixed(0)}s) ${checks} checks`);
console.log(bad?`MISMATCH ${bad} of ${checks}`:'MATCH a game\'s goals spread like the Premier League\'s'); process.exit(bad?1:0);
