/* Football's game day on engine 27 (src/football/51_tactics.js), against the real game.
     node test/fb-tactics.js            both leagues; last line: MATCH or MISMATCH
     node test/fb-tactics.js nfl|cfb    one league
     node test/fb-tactics.js --calib    each option's worth against an even spread of plans (GP_C), to paste
   1. Whole seasons, every game: fourth downs gone for and made, two-point tries and made, coach's challenges and how many
      win, points, and the interceptions leader.
      NFL fourth downs: 1.47 attempts a team-game in 2023, 51.8% made; 1.40 in 2024, 56.8% made. Two-point tries: 9.8% of
        touchdowns in 2024 (4.4% in 2014), 47.6% made over the last five seasons
        https://bracketology.engr.wisc.edu/nfl-analytics-recap-of-the-2024-regular-season/
        https://www.foxsports.com/stories/nfl/why-nfl-offenses-going-fourth-down-more-than-ever (766 tries in 2024, 57%)
      FBS fourth downs: 3.6 tries a game (both teams) in 2022, 3.64 in 2025, 54 to 55% made
        https://www.ksat.com/sports/2025/11/12/college-football-picks-trend-of-going-for-it-on-4th-down-continues-to-rise-and-so-does-success-rate/
      FBS two-point tries: 493 in 2024, 45.8% made (about 8 to 9% of touchdowns)
        https://www.nbcsports.com/college-football/news/college-football-coaches-are-going-for-two-and-converting-at-the-highest-rate-since-the-1970s
      NFL coach's challenges: about 0.25 a team-game (51.5 in the first seven weeks, 2021-24; about 60 in 2025), 40% won in
        2024 and 60% in 2025 https://www.tsn.ca/nfl/article/why-nfl-replay-reviews-are-succeeding-at-unprecedented-rates-n1-46675881/
      NFL interceptions leader: 15 to 21 a season, 2019-2024 (Pro Football Reference's season leaders); points: about 22 to 23
        a team-game (2023-24). FBS: about 27 to 28.
   2. The levers: each option's worth against an even spread of the other side's plans is about nothing (the matchup
      decides), and the matchup terms point the real way: the blitz pays when the rush beats the line and loses to an
      accurate quarterback; throwing into two deep safeties pays less than into one; man coverage pays with the better
      corners. Blitzing: about a quarter of dropbacks (25.4% outside the red zone, 2024), and over 2011-24 it was about even
      (EPA a dropback near zero; quarterbacks' yards an attempt 7.3 to 8.6 against it), so it's high risk both ways: more
      touchdowns against it and more interceptions
      https://www.sharpfootballanalysis.com/analysis/nfl-offense-struggles-blitz-2024-warren-sharp/amp/
      Two-high shells behind the blitz rose from 23.1% to 28.1%, 2020 to 2024, to take away the big play
      https://www.yardbarker.com/nfl/articles/nfl_defenses_are_bringing_blitzing_back/s1_17304_41038171
   3. No single plan wins in most matchups: across every pairing of a league's clubs, the best plan against the other side's
      (its assistant's) differs; no option of any lever is best in most of them. */
const path=require('path'); const {load}=require('./harness.js');
const D=f=>path.join(process.env.DIST||path.join(__dirname,'..','dist'),f);
const args=process.argv.slice(2), calib=args.includes('--calib'), only=args.find(a=>!a.startsWith('--'));
if(calib)process.env.GP_K=JSON.stringify(Object.assign(process.env.GP_K?JSON.parse(process.env.GP_K):{},{cm:0}));   // the cost of a lean stays out of the neutralizers
const EXP=['S','SEA','NAMES','LEAGUE','newDynasty','ENGINE_V','ENGINE_NOW','makeLiveGame','RNG','GP_K','GP_OPT','GP_DEF','GP_C','GP_KEYS',
  'strHash','fb27Mods','fb27UnitsT','fb27CpuOff','fb27CpuDef','fb27SchOf','clubScheme','gameCtx'];
let bad=0; const ok=(c,l)=>{ console.log(`  ${c?'ok  ':'FAIL'} ${l}`); if(!c)bad++ };
const f2=(x,d=2)=>Number(x).toFixed(d);
const REAL={nfl:{go:[1.2,1.7],goOk:[0.48,0.6],two:[0.07,0.13],twoOk:[0.4,0.55],ch:[0.15,0.35],chOk:[0.38,0.65],pts:[21.5,24.5],intLead:[15,21]},
            cfb:{go:[1.5,2.1],goOk:[0.48,0.6],two:[0.06,0.12],twoOk:[0.4,0.55],ch:[0.05,0.2],chOk:[0.38,0.65],pts:[25,30]}};
for(const [lg,file,NS] of [['nfl','football-coach-pro.html',3],['cfb','football-coach.html',2]]){ if(only&&only!==lg)continue;
  const A=load({file:D(file),settable:['ENGINE_V'],expose:EXP}); console.log(`${file} (engine ${A.ENGINE_NOW})`);
  const R=REAL[lg], K=A.GP_K, U0={passO:K.rel0,runO:0,cov:0,front:0,rec:-K.man0,prot:-K.bl0,rush:0,rb:-K.man0+K.rb0,wr:K.wr0,wr2:0,qs:K.qs0,qa:0};
  // games straight from the engine: plans (gH against gA), units, common dice
  const play=(gH,gA,uH,uA,N,fn)=>{ A.ENGINE_V=A.ENGINE_NOW; const o={w:0,m:0,n:N,td:0,int:0,dr:0};
    for(let i=0;i<N;i++){ const rng=new A.RNG((977+i*7919)>>>0), e=A.makeLiveGame(rng,1600,1600,'balanced','balanced',{home:false,away:false},false,
        {seed:i*104729,gp27:{g:{home:gH,away:typeof gA==='function'?gA(i):gA},u:{home:uH,away:uA}}});
      let r,g=0; while(g++<4000){ r=e.next(); if(r.done)break }
      o.w+=r.h>r.a?1:r.h===r.a?0.5:0; o.m+=r.h-r.a; (r.drives||[]).forEach(d=>{ if(!d.home||d.ot)return; o.dr++; if(d.kind==='TD')o.td++; if(d.kind==='INT')o.int++ }) }
    o.w/=N; o.m/=N; return o };
  const keys=A.GP_KEYS, randPlan=i=>{ const g={}; keys.forEach(k=>{ const o=A.GP_OPT[k]; g[k]=o[A.strHash(i+'|'+k)%o.length][0] }); return g };
  if(calib){ const N=+(process.env.N||16000), sl=0.095, base=play(A.GP_DEF,randPlan,U0,U0,N), C={};
    keys.forEach(k=>A.GP_OPT[k].forEach(([v])=>{ if(v===A.GP_DEF[k])return; const r=play(Object.assign({},A.GP_DEF,{[k]:v}),randPlan,U0,U0,N);
      C[k+'.'+v]=Math.round(((A.GP_C[k+'.'+v]||0)-100*(r.w-base.w)/sl)*10)/10 }));
    console.log(lg+' GP_C '+JSON.stringify(C)); continue }

  // ---- 1. whole seasons ----
  const t0=Date.now(), a={g:0,pts:0,td:0,two:0,twoOk:0,go:0,goOk:0,ch:0,chOk:0}, lead=[];
  for(let s=1;s<=NS;s++){ A.newDynasty(A.NAMES[(s*5)%A.NAMES.length],s,'T'); const SEA=A.SEA, o=SEA._resolve;
    SEA._resolve=function(h,w){ const r=o.apply(this,arguments), Dr=this.lastDrives; if(!Dr||this.phase!=='week')return r;
      a.g++; a.pts+=r.hp+r.ap;
      Dr.forEach(d=>{ if(d.kind==='TD'){ a.td++; if(d.pts===8){a.two++;a.twoOk++} else if(d.pts===6&&/two/.test(d.note||''))a.two++ }
        if(d.converted===true)a.goOk++; if(d.converted!=null)a.go++; if(d.chal){ a.ch++; if(d.chal.won)a.chOk++ } }); return r };
    let g=0; while(SEA.phase==='week'&&g++<9000)SEA.advance();
    let top=0; A.NAMES.forEach(t=>(SEA.roster[t]||[]).forEach(p=>{ if(p&&p.st2&&p.st2.int!=null)top=Math.max(top,p.st2.int) })); lead.push(top) }
  const tg=2*a.g, in_=(x,r)=>x>=r[0]&&x<=r[1];
  console.log(`  ${NS} seasons, ${a.g} games (${Math.round((Date.now()-t0)/1000)}s)`);
  ok(in_(a.go/tg,R.go),`fourth downs gone for: ${f2(a.go/tg)} a team-game (real ${lg==='nfl'?'1.40 to 1.47':'about 1.8'})`);
  ok(in_(a.goOk/a.go,R.goOk),`fourth downs made: ${f2(100*a.goOk/a.go,1)}% (real ${lg==='nfl'?'51.8 to 56.8%':'54 to 55%'})`);
  ok(in_(a.two/a.td,R.two),`two-point tries: ${f2(100*a.two/a.td,1)}% of touchdowns (real ${lg==='nfl'?'9.8% in 2024':'about 8 to 9%'})`);
  ok(in_(a.twoOk/a.two,R.twoOk),`two-point tries made: ${f2(100*a.twoOk/a.two,1)}% (real ${lg==='nfl'?'47.6%':'45.8%'})`);
  ok(in_(a.ch/tg,R.ch),`coach's challenges: ${f2(a.ch/tg)} a team-game (real ${lg==='nfl'?'about 0.25':'rarer: the booth reviews'})`);
  ok(in_(a.chOk/Math.max(1,a.ch),R.chOk),`challenges won: ${f2(100*a.chOk/Math.max(1,a.ch),1)}% (real 40% in 2024, 60% in 2025)`);
  ok(in_(a.pts/tg,R.pts),`points: ${f2(a.pts/tg)} a team-game`);
  if(R.intLead){ const m=lead.reduce((x,y)=>x+y,0)/lead.length;
    ok(in_(m,R.intLead)&&Math.max(...lead)<=23,`interceptions leader by season: ${lead.join(', ')} (real 15 to 21; engine 26 threw 27 and 28)`) }
  else console.log(`       interceptions leader by season: ${lead.join(', ')}`);

  // ---- 2. the levers ----
  const N=+(process.env.N||8000), base=play(A.GP_DEF,randPlan,U0,U0,N), worth=[];
  keys.forEach(k=>A.GP_OPT[k].forEach(([v])=>{ if(v===A.GP_DEF[k])return; const r=play(Object.assign({},A.GP_DEF,{[k]:v}),randPlan,U0,U0,N); worth.push([k+'.'+v,(r.w-base.w)*100/0.095]) }));
  const wmax=worth.reduce((m,x)=>Math.abs(x[1])>Math.abs(m[1])?x:m,['',0]);
  ok(Math.abs(wmax[1])<=12,`each option is worth about nothing against an even spread of plans: the most, ${wmax[0]}, ${f2(wmax[1],1)} Elo (${worth.map(x=>x[0]+' '+f2(x[1],1)).join(', ')})`);
  const M=(O,Dp,uO,uD)=>A.fb27Mods(Object.assign({},A.GP_DEF,O),Object.assign({},A.GP_DEF,Dp),Object.assign({},U0,uO),Object.assign({},U0,uD)).elo;
  const bl=M({},{blitz:'high'},{prot:-K.bl0-6},{})-M({},{blitz:'high'},{prot:-K.bl0+6},{}), bq=M({},{blitz:'high'},{qa:6},{})-M({},{blitz:'high'},{qa:-6},{});
  ok(bl<0&&bq>0,`the blitz pays when the rush beats the line (${f2(bl,1)} Elo to the offense) and loses to an accurate quarterback (${f2(bq,1)})`);
  const sh=M({mix:'pass'},{cov:'c2'},{},{})-M({mix:'pass'},{cov:'c3'},{},{}), shr=M({mix:'run'},{cov:'c2'},{},{})-M({mix:'run'},{cov:'c3'},{},{});
  ok(sh<0&&shr>0,`throwing into two deep safeties pays less than into one (${f2(sh,1)} Elo), running into them more (${f2(shr,1)})`);
  const mn=M({},{cov:'c1'},{rec:-K.man0-6},{})-M({},{cov:'c1'},{rec:-K.man0+6},{});
  ok(mn<0,`man coverage pays with the better corners (${f2(mn,1)} Elo to the offense)`);
  const b1=play(A.GP_DEF,Object.assign({},A.GP_DEF,{blitz:'high'}),U0,U0,N), b0=play(A.GP_DEF,Object.assign({},A.GP_DEF,{blitz:'low'}),U0,U0,N);
  ok(b1.td/b1.dr>b0.td/b0.dr&&b1.int/b1.dr>b0.int/b0.dr,`against the blitz more touchdowns (${f2(100*b1.td/b1.dr,1)}% of drives, ${f2(100*b0.td/b0.dr,1)}% against four) and more interceptions (${f2(100*b1.int/b1.dr,1)}%, ${f2(100*b0.int/b0.dr,1)}%)`);
  const p2=play(Object.assign({},A.GP_DEF,{mix:'pass'}),Object.assign({},A.GP_DEF,{cov:'c2'}),U0,U0,N), p1=play(Object.assign({},A.GP_DEF,{mix:'pass'}),Object.assign({},A.GP_DEF,{cov:'c3'}),U0,U0,N);
  ok(p2.m<p1.m,`a passing plan scores less against two deep (margin ${f2(p2.m)}) than one deep (${f2(p1.m)})`);

  // ---- 3. no single plan wins in most matchups ----
  A.newDynasty(A.NAMES[0],1,'T'); const SEA=A.SEA, yr=SEA.year, T=A.NAMES.filter(t=>SEA.roster[t]), U={}; T.forEach(t=>U[t]=A.fb27UnitsT(t,SEA));
  const cnt={mix:{},cov:{},blitz:{},plan:{}}; let n=0;
  for(const h of T)for(const w of T){ if(h===w||!U[h]||!U[w])continue; n++;
    const theirDef=A.fb27CpuDef(w,yr,A.clubScheme(w,yr),U[w],U[h]), theirOff=A.fb27CpuOff(w,yr,U[w],U[h],A.clubScheme(h,yr));
    // offense: the mix that does most against their defense; defense: the coverage and pressure that do most against their
    // offense. The matchup's terms only: each option's own cost and style come to about nothing on average (part 2)
    const E=(O,Dp,uO,uD)=>{ const r=A.fb27Mods(O,Dp,uO,uD); return r.elo-r.parts.cost };
    const bestO=A.GP_OPT.mix.map(([v])=>[v,E(Object.assign({},A.GP_DEF,{mix:v}),theirDef,U[h],U[w])]).sort((x,y)=>y[1]-x[1])[0][0];
    let bd=null; A.GP_OPT.cov.forEach(([c])=>A.GP_OPT.blitz.forEach(([b])=>{ const e=E(theirOff,Object.assign({},A.GP_DEF,{cov:c,blitz:b}),U[w],U[h]); if(!bd||e<bd[2])bd=[c,b,e] }));
    cnt.mix[bestO]=(cnt.mix[bestO]||0)+1; cnt.cov[bd[0]]=(cnt.cov[bd[0]]||0)+1; cnt.blitz[bd[1]]=(cnt.blitz[bd[1]]||0)+1;
    const pl=bestO+'/'+bd[0]+'/'+bd[1]; cnt.plan[pl]=(cnt.plan[pl]||0)+1 }
  const top=o=>Object.entries(o).sort((x,y)=>y[1]-x[1])[0], sh2=o=>top(o)[1]/n;
  ['mix','cov','blitz','plan'].forEach(k=>ok(sh2(cnt[k])<0.5&&Object.keys(cnt[k]).length>=2,
    `${k==='plan'?'the whole plan':k}: the most common best, ${top(cnt[k])[0]}, is best in ${f2(100*sh2(cnt[k]),1)}% of ${n} pairings (${Object.entries(cnt[k]).sort((x,y)=>y[1]-x[1]).slice(0,5).map(x=>x[0]+' '+x[1]).join(', ')})`));
}
console.log(calib?'calibration printed':bad?'MISMATCH':'MATCH');
