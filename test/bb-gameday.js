/* Basketball game day (round 111, engine 25): timeouts, runs, and the calls they bring. The engine on its own, both
   leagues. Checks, then a report.   node test/bb-gameday.js [games=3000]
   - the computer's own games: as on engine 24 (it calls a timeout on every run it faces while it has one)
   - a run is asked about only after a stretch lost by BB_GD.runPts, never at a period's end, never with none left or 20
     either way; your assistant's answer plays exactly as calling the timeout and keeping the defense
   - timeouts never go below zero; a timeout of your own (the live button) asks what you change
   - what a timeout is worth: the same games, every run answered "save it" against "timeout" (small, on purpose) */
const fs=require('fs');
const core=fs.readFileSync('src/core/20_engine.js','utf8');
const rngSrc=core.slice(core.indexOf('function mulberry32'),core.indexOf('\n}\n',core.indexOf('class RNG'))+3);
const eng=fs.readFileSync('src/basketball/50_game.js','utf8');
const nbaSrc=fs.readFileSync('src/leagues/nba/05_league.js','utf8');
const nbaBB=new Function('return {'+nbaSrc.slice(nbaSrc.indexOf('bb:{pace'),nbaSrc.indexOf('}',nbaSrc.indexOf('bb:{pace'))+1)+'}')().bb;
function load(pro){ return new Function('LEAGUE',rngSrc+eng+'\nreturn {RNG,makeLiveGame,BB,BB_GD,SEGS,setV(v){ENGINE_V=v}};')(pro?{id:'nba',tuning:{bb:nbaBB}}:{id:'ncaab',tuning:{}}) }
const N=+(process.argv[2]||3000);
let fails=0; const check=(ok,msg)=>{ console.log((ok?'  ok   ':'  FAIL ')+msg); if(!ok)fails++ };
function run(G,seed,gap,humans,answer,actAt){
  const e=G.makeLiveGame(new G.RNG(seed),1500+gap,1500,'balanced','balanced',humans);
  const asks=[]; let g=0, r, acted=false;
  while(g++<400){
    if(actAt!=null&&!acted&&e.seg===actAt&&!e.queue.length&&!e.waiting){ acted=e.act('home','to') }
    r=e.next(); if(r.done)break;
    if(r.ask){ asks.push({k:r.ask.k,dp:r.ask,seg:e.seg,lead:r.mine-r.theirs,TO:e.TO?e.TO[r.side]:null,mo:e.mo?Object.assign({},e.mo):null});
      e.reply(answer?answer(r.ask,e):r.ask.opts[r.ask.opts.length-1][0]) } }
  return {h:r.h,a:r.a,asks,TO:e.TO,drives:e.drives,acted,log:e.log};
}
for(const pro of [false,true]){
  const G=load(pro), L=pro?'pro':'college';
  console.log(`\n${L}: ${G.BB_GD.timeouts} timeouts, a run is ${G.BB_GD.runPts}+ in a stretch, momentum ${G.BB_GD.momentum}`);
  // 1. the computer's own games, engine 24 against 25
  let same=0, toUsed=0, runs=0, neg=0;
  for(let s=1;s<=N;s++){ const gap=((s*37)%300)-150;
    G.setV(24); const a=run(G,s,gap,false); G.setV(25); const b=run(G,s,gap,false);
    if(a.h===b.h&&a.a===b.a)same++; toUsed+=2*G.BB_GD.timeouts-b.TO.home-b.TO.away; if(b.TO.home<0||b.TO.away<0)neg++;
    b.drives.forEach(d=>{ if(typeof d.seg==='number'&&d.seg<G.SEGS-1&&Math.abs(d.h-d.a)>=G.BB_GD.runPts)runs++ }) }
  console.log(`  computer games: ${same} of ${N} as on engine 24; runs ${(runs/N).toFixed(2)} a game, timeouts called ${(toUsed/N).toFixed(2)} a game (both sides)`);
  check(same>=N*0.995,'the computer\'s games play as before (99.5%+)');
  check(neg===0,'timeouts never below zero');
  // 2. your games: when the run call comes, and what the assistant's answer does
  G.setV(25); let asked=0, bad=0, parity=0, parN=0, withDef=0;
  for(let s=1;s<=N;s++){ const gap=((s*53)%300)-150, x=run(G,s,gap,{home:true,away:false});
    x.asks.filter(q=>q.k==='timeout').forEach(q=>{ asked++; if(q.dp.withDef)withDef++;
      const s0=q.seg, D=x.drives[s0-1], against=D.a-D.h;
      if(against<G.BB_GD.runPts||s0===G.SEGS/2||(pro&&s0%2===0)||q.TO<=0||Math.abs(q.lead)>=20||s0>=G.SEGS)bad++ });
    if(x.asks.some(q=>q.k==='timeout')&&parN<300){ parN++;
      const a=run(G,s,gap,{home:true,away:false},(dp)=>dp.k==='timeout'?'to':dp.opts[dp.opts.length-1][0]);
      if(a.h===x.h&&a.a===x.a)parity++ } }
  console.log(`  your games: the run call ${(asked/N).toFixed(2)} a game (${withDef} with the defense on it)`);
  check(asked>0&&bad===0,'asked only after a run against you, mid-period, with a timeout left, inside 20');
  check(parity===parN,`your assistant's answer plays as "timeout, keep your setup" (${parity} of ${parN})`);
  // 3. your own timeout
  let acts=0, tomine=0, left=0;
  for(let s=1;s<=200;s++){ const x=run(G,s,0,{home:true,away:false},null,3); if(x.acted){ acts++; if(x.asks.some(q=>q.k==='tomine'))tomine++ } left+=x.TO.home }
  check(acts===200&&tomine===200,`a timeout of your own asks what you change (${tomine} of ${acts})`);
  { const e=G.makeLiveGame(new G.RNG(5),1500,1500,'balanced','balanced',{home:true,away:false}); e.TO.home=0; check(e.act('home','to')===false&&!e.queue.length,'no timeout of your own with none left') }
  // 4. what a timeout is worth: every run answered "save" against "timeout", the same dice
  let n=0, wSave=0, wTO=0, ptsS=0, ptsT=0;
  for(let s=1;s<=N;s++){ const gap=((s*53)%300)-150, x=run(G,s,gap,{home:true,away:false},dp=>dp.k==='timeout'?'save':dp.opts[dp.opts.length-1][0]);
    if(!x.asks.some(q=>q.k==='timeout'))continue;
    const y=run(G,s,gap,{home:true,away:false},dp=>dp.k==='timeout'?'to':dp.opts[dp.opts.length-1][0]);
    n++; wSave+=x.h>x.a?1:0; wTO+=y.h>y.a?1:0; ptsS+=x.h-x.a; ptsT+=y.h-y.a }
  console.log(`  ${n} games with a run against you: timeout won ${(100*wTO/n).toFixed(1)}%, saved ${(100*wSave/n).toFixed(1)}%; margin ${(ptsT/n).toFixed(2)} against ${(ptsS/n).toFixed(2)}`);
  check(n>0&&(ptsT-ptsS)/n>-0.2&&(ptsT-ptsS)/n<2,'a timeout on a run is worth a little, not a lot (under two points)');
}
console.log(fails?`\n${fails} FAILED`:'\nall passed'); process.exit(fails?1:0);
