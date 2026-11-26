/* Hockey game day (review round 2, engine 26): the goalie pull, tonight's lines and legs, the timeout, the goalie change.
   The engine on its own (src/hockey/50_game.js), computer against computer and you at home. Checks, then a report.
     node test/hk-gameday.js [games=20000]          last line: MATCH or MISMATCH
   Real figures it is measured against:
   - empty-net goals: 13.8 a team in 2023-24, 0.34 a game (dailyfaceoff.com/news/how-empty-net-goals-have-changed-the-nhl);
     about 0.4 a game, about 7% of all goals, in 2024-25 (theringer.com/2025/03/03/nhl/how-hockeys-golden-age-of-goalie-goals-explains-sports)
   - six on five: 0.071 goals a minute for the extra attacker, 0.155 against into the empty net, 2015-16 (Asness and Brown,
     ushr.com/assets/docs/2018/Pulling-the-Goalie-2018-05-31-19-29-28.pdf); "just shy of 6.5 an hour" (Matt Cane, cited at
     hockeysarsenal.substack.com/p/when-should-we-pull-our-goalie). Goals for against goals into the empty net: 0.46 (Asness
     and Brown), 0.52 (Minnesota and Seattle 2021-22, 23 for and 44 against: spokesman.com, below)
   - a down-one pull ties it 13.5% (2013-14) to 18.1% (2021) of the time; the average pull at 1:13 in 2013-14, 1:46 in
     2019-20 (Meghan Hall: spokesman.com/stories/2022/jun/21/heres-why-the-kraken-and-other-nhl-teams-are-pulli/); now
     "around the 2-minute mark" (goaliemonkey.com/learn/goalie-goals-becoming-more-common)
   - overtime: about 22-24% of games (the repo's realism notes) */
const fs=require('fs'),path=require('path');
const core=fs.readFileSync(path.join(__dirname,'..','src','core','20_engine.js'),'utf8');
const rngSrc=core.slice(core.indexOf('function mulberry32'),core.indexOf('\n}\n',core.indexOf('class RNG'))+3);
const eng=fs.readFileSync(path.join(__dirname,'..','src','hockey','50_game.js'),'utf8');
const G=new Function(rngSrc+'function blankTeamLine(){return {sog:0,pp:0,ppg:0,pim:0}}\nfunction planAmpV(){return ENGINE_V>=17}\nconst LEAGUE={tuning:{}};\n'+eng+
  ';return {RNG,playGame,makeLiveGame,HK,HK_GD,SEGS,setV(v){ENGINE_V=v}};')();
const N=+(process.argv[2]||8000);
let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const pct=x=>(100*x).toFixed(1)+'%';
// a roster's gap (top line and pair over the depth), split forwards and defence as the league's are
const lnOf=g=>({gf:+(g*0.56).toFixed(2),gd:+(g*0.44).toFixed(2),bf:0.3,bd:0.3});
const MEAN=G.HK_GD.gMean;

// 1. the league, computer against computer: engine 25 against 26
function league(v){ G.setV(v); let goals=0,ot=0,en=0,ex=0,pulls=0,p1=0,t1=0,pt1=0,pt2=0,p2=0;
  for(let i=1;i<=N;i++){ const gap=35+((i*37)%240)-120, r=G.playGame(new G.RNG(i),1500+gap,1500,'balanced','balanced',{});
    goals+=r.h+r.a; if(r.ot)ot++;
    let sh=0,sa=0; r.drives.forEach(d=>{ if(d.seg>=G.SEGS)return; let h=d.sh-d.h, a=d.sa-d.a;
      (d.ev||[]).slice().sort((x,y)=>x.m-y.m).forEach(e=>{ if(e.en)en++; if(e.extra)ex++;
        if(e.k==='pull'&&!e.cont){ pulls++; const dn=e.side==='home'?a-h:h-a;
          // the down-one pulls: how often the goalie came out and the game was then tied (at the end of regulation)
          if(dn===1){ p1++; pt1+=60-e.m; const D=r.drives.find(x=>x.seg===G.SEGS-1)||d; if(D.sh===D.sa)t1++ } else if(dn===2){ p2++; pt2+=60-e.m } }
        if(e.k==='goal'){ if(e.side==='home')h++; else a++ } }) }) }
  return {g:goals/N,ot:ot/N,en:en/N,ex:ex/N,pulls:pulls/N,tie1:t1/Math.max(1,p1),pt1:pt1/Math.max(1,p1),pt2:pt2/Math.max(1,p2)} }
const L25=league(25), L26=league(26);
const row=(l,o)=>console.log(`  ${l}: goals ${o.g.toFixed(2)} a game, overtime ${pct(o.ot)}; empty-net goals ${o.en.toFixed(3)} a game (${pct(o.en/o.g)} of goals), extra-attacker goals ${o.ex.toFixed(3)} (for/against ${(o.ex/o.en).toFixed(2)}); pulls ${o.pulls.toFixed(2)} a game, down one at ${o.pt1.toFixed(1)} min (floored), down two at ${o.pt2.toFixed(1)}; a down-one pull tied ${pct(o.tie1)}`);
console.log('the league, computer against computer (home +35 Elo on average):'); row('engine 25',L25); row('engine 26',L26);
console.log('  real: goals about 6.1-6.2, overtime 22-24%; empty-net goals 0.34-0.40 a game (5.5-7%), for/against 0.46-0.52; a down-one pull ties 13.5-18.1%; pulls at about two minutes down one');
ok(L26.g>5.9&&L26.g<6.35,'goals a game stay about 6.1');
ok(L26.ot>0.20&&L26.ot<0.25,'overtime about 22%');
ok(L26.en>1.6*L25.en&&L26.en>0.22&&L26.en<0.42,'empty-net goals toward today\'s league (from 2005-06\'s level)');
ok(L26.ex/L26.en>0.40&&L26.ex/L26.en<0.60,'goals for the extra attacker against goals into the empty net as the league\'s');
ok(L26.tie1>0.12&&L26.tie1<0.22,'a down-one pull ties it about one time in six');
ok(L26.pt1>=2&&L26.pt1<=3,'the computer pulls down one with about two minutes left (2:15, its minute floored as the clock shows it)');

// 2. your games: the pull call
G.setV(26);
function play(seed,gap,ans,opt){ opt=opt||{}; const e=G.makeLiveGame(new G.RNG(seed),1500+gap,1500,'balanced','balanced',{home:true,away:false},!!opt.po,opt.ctx);
  const asks=[]; let r,g=0;
  while(g++<400){ if(opt.pre)opt.pre(e); r=e.next(); if(r.done)break;
    if(r.ask){ asks.push({k:r.ask.k,dp:r.ask,seg:e.seg,lead:r.mine-r.theirs}); e.reply(ans?ans(r.ask,e):r.ask.opts[r.ask.opts.length-1][0]) } }
  return {h:r.h,a:r.a,w:r.h>r.a?1:0,pts:r.h>r.a?2:(e.ot?1:0),asks,e,drives:r.drives} }
const asst=dp=>dp.opts[dp.opts.length-1][0];
{ let asked=0, wrong=0, par=0, parN=0;
  for(let s=1;s<=N/4;s++){ const gap=((s*53)%300)-150, x=play(s,gap); const q=x.asks.filter(a=>a.k==='pull');
    q.forEach(a=>{ asked++; if(!(a.seg===G.SEGS-1&&(a.lead===-1||a.lead===-2)))wrong++ });
    // your assistant pulls as the computer: the goalie out at the league's time (no goal before it)
    if(q.length&&parN<300){ const D=x.drives.find(d=>d.seg===G.SEGS-1), p=(D.ev||[]).find(e=>e.k==='pull'&&e.side==='home');
      if(p&&!(D.ev||[]).some(e=>e.k==='goal'&&e.m<=p.m)){ parN++; if(p.m===Math.floor(60-G.HK_GD.pullT[-q[0].lead]))par++ } } }
  console.log(`your games: the pull call ${(asked/(N/4)).toFixed(2)} a game`);
  ok(asked>0&&wrong===0,'asked only with five minutes left, down one or two');
  ok(parN>0&&par===parN,`your assistant pulls at the league's time (${par} of ${parN})`) }
// what the pull's timing is worth, by who's better tonight (the same dice up to the call; each option after)
console.log('the pull call, by tonight\'s edge: wins and standings points a game it comes up in (now / earlier / your assistant, the league\'s habit)');
const pullW={};
for(const gap of [-150,0,150]){ const S={};
  for(let s=1;s<=N;s++){ const a=play(s,gap); const q=a.asks.find(x=>x.k==='pull'); if(!q)continue;
    const dn=-q.lead, B=S[dn]=S[dn]||{n:0}; B.n++;
    q.dp.opts.forEach(o=>{ const k=o[0], x=k==='normal'?a:play(s,gap,dp=>dp.k==='pull'?k:asst(dp)); B[k]=(B[k]||0)+x.w; B[k+'P']=(B[k+'P']||0)+x.pts }) }
  pullW[gap]=S;
  Object.keys(S).forEach(dn=>{ const B=S[dn], ks=Object.keys(B).filter(k=>k!=='n'&&!k.endsWith('P'));
    console.log(`  edge ${gap>0?'+':''}${gap}, down ${dn} (${B.n}): `+ks.map(k=>`${k} ${pct(B[k]/B.n)} ${(B[k+'P']/B.n).toFixed(3)} pts`).join(' | ')) }) }
{ const W=(gap,dn,k)=>pullW[gap][dn][k]/pullW[gap][dn].n;
  ok(W(150,1,'now')>W(150,1,'normal'),'the better side gains by pulling earlier, down one');
  const P=(gap,dn,k)=>pullW[gap][dn][k+'P']/pullW[gap][dn].n;
  ok(P(-150,1,'three')>=P(-150,1,'now'),'the weaker side gains less from five minutes six on five than from three (standings points)');
  ok([-150,0,150].every(g=>Math.abs(W(g,1,'now')-W(g,1,'normal'))<0.08),'the pull\'s timing is worth a little, not a lot (under 8 points of win chance)') }

// 3. the live bar's pull: behind by two with ten or fifteen minutes left
{ let n=0, wNow=0, wNo=0, outOk=0, outN=0, backOk=0, backN=0, contOk=true;
  for(let s=1;s<=N;s++){ const gap=((s*29)%200)-100; let at=null;
    const a=play(s,gap,null,{pre:e=>{ if(at===null&&e.seg===9&&!e.queue.length&&!e.waiting){ at=e.h-e.a } }});
    if(at!==-2)continue; n++; let pressed=false;
    const b=play(s,gap,null,{pre:e=>{ if(!pressed&&e.seg===9&&!e.queue.length&&!e.waiting){ pressed=e.act('home','pull') } }});
    wNo+=a.w; wNow+=b.w;
    const D=b.drives.find(d=>d.seg===9); if(D){ outN++; const p=(D.ev||[]).find(e=>e.k==='pull'&&e.side==='home'); if(p&&p.m===45)outOk++ }
    b.drives.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k==='gback'&&e.side==='home'){ backN++; const lead=d.sh-d.sa; backOk++ } }));
    // a stretch's first goalie event: a pull at its first minute, with him out as the stretch before ended, is marked cont
    let out=false; b.drives.forEach(d=>{ if(d.seg>=G.SEGS)return; const E=(d.ev||[]).filter(e=>(e.k==='pull'||e.k==='gback')&&e.side==='home');
      if(E.length&&E[0].k==='pull'&&E[0].m===d.seg*5&&out&&!E[0].cont)contOk=false; if(E.length)out=E[E.length-1].k==='pull'; else if(d.seg>=9)out=false }) }
  console.log(`  down two with fifteen minutes left (${n} games): goalie out from 45:00 won ${pct(wNow/n)}, the league's way ${pct(wNo/n)}`);
  ok(n>0&&outOk===outN,`the live bar's pull takes the goalie out as the next stretch starts (${outOk} of ${outN})`);
  ok(contOk,'a goalie still out as a stretch starts is not pulled again in the run of play');
  ok(Math.abs(wNow-wNo)/n<0.06,'fifteen minutes six on five, down two: a gamble, not a free win') }

// 4. tonight's lines: the same dice, the whole game or from the third; a roster with the league's gap, a thin one, a deep one
console.log('tonight\'s lines, even sides, you at home (margin a game; win %):');
const lineRes={};
for(const [lab,g] of [['usual',MEAN],['thin bench',MEAN+3.5],['deep',MEAN-3.5]]){
  const ctx={ln:{home:lnOf(g),away:lnOf(MEAN)}}, R={};
  for(const [k,from] of [['set',0],['roll',0],['top',0],['short',0],['short',8]]){ let m=0,w=0;
    for(let s=1;s<=N/2;s++){ let done=false; const x=play(s,0,null,{ctx,pre:e=>{ if(!done&&e.seg===from&&!e.queue.length&&!e.waiting){ done=true; if(k!=='set')e.act('home','ln:'+k) } }}); m+=x.h-x.a; w+=x.w }
    R[k+(from?'@3rd':'')]={m:m/(N/2),w:w/(N/2)} }
  lineRes[lab]=R; console.log(`  ${lab.padEnd(10)} (gap ${g.toFixed(1)}): `+Object.keys(R).map(k=>`${k} ${R[k].m>=0?'+':''}${R[k].m.toFixed(3)} ${pct(R[k].w)}`).join(' | ')) }
{ const d=(r,a,b)=>r[a].m-r[b].m;
  ok(Math.abs(d(lineRes.usual,'top','set'))<0.06&&Math.abs(d(lineRes.usual,'roll','set'))<0.06,'the league\'s usual roster gains nothing either way all game (under 0.06 goals)');
  ok(d(lineRes['thin bench'],'top','set')>0.02,'a thin bench wants the top line on more');
  ok(d(lineRes.deep,'roll','set')>0.02,'a deep roster wants the lines rolled');
  // the third's legs are paid for after the horn: a short bench late is a real lever (benches do it), a small one
  ok(d(lineRes.usual,'short@3rd','set')>0&&d(lineRes['thin bench'],'short@3rd','set')>0,'shortening the bench for the third gains a little, more with a thin bench');
  ok(d(lineRes.usual,'short@3rd','set')<0.12&&Math.abs(d(lineRes.deep,'short@3rd','set'))<0.05,'a little: under an eighth of a goal for the usual roster, nothing much for a deep one');
  ok(['usual','thin bench','deep'].every(l=>Math.abs(d(lineRes[l],'short','set'))<0.35),'the lines move a game by tenths of a goal, not goals') }
// the computer's own games: tonight's lines play as set; with their gaps or without, the same game
{ let same=0; for(let s=1;s<=2000;s++){ const a=G.playGame(new G.RNG(s),1530,1500,'balanced','balanced',{ctx:{ln:{home:lnOf(10),away:lnOf(5)}}}), b=G.playGame(new G.RNG(s),1530,1500,'balanced','balanced',{}); if(a.h===b.h&&a.a===b.a)same++ }
  ok(same===2000,`the computer plays its lines as set: its games are the same with tonight's gaps or without (${same} of 2000)`) }

// 5. the timeout: kept for the pull (as the computer and your assistant use it) or spent early to rest a short bench
{ const ctx={ln:{home:lnOf(MEAN+3.5),away:lnOf(MEAN)}}; let n=0,wK=0,wE=0,used=0;
  for(let s=1;s<=N/2;s++){ let a1=false; const a=play(s,0,null,{ctx,pre:e=>{ if(!a1&&e.seg===0&&!e.queue.length&&!e.waiting){ a1=true; e.act('home','ln:top') } }});
    n++; let b1=false,b2=false;
    const b=play(s,0,null,{ctx,pre:e=>{ if(!b1&&e.seg===0&&!e.queue.length&&!e.waiting){ b1=true; e.act('home','ln:top') } if(!b2&&e.seg===6&&!e.queue.length&&!e.waiting){ b2=e.act('home','to') } }});
    if(b2)used++; wK+=a.w; wE+=b.w;
  }
  console.log(`  the timeout, leaning on the top line all game, all games (${n}): kept for the pull won ${pct(wK/n)}, spent at 30:00 ${pct(wE/n)}`);
  ok(used===n,'a timeout of your own is taken once (and then the button is gone)');
  { const e=G.makeLiveGame(new G.RNG(3),1500,1500,'balanced','balanced',{home:true,away:false}); e.next(); ok(e.act('home','to')===true&&e.act('home','to')===false&&e.TO.home===0,'one timeout a game') } }

// 6. the buttons: when each shows
{ const e=G.makeLiveGame(new G.RNG(7),1500,1500,'balanced','balanced',{home:true,away:false}); e.next();
  const ids=e.actsFor('home').map(a=>a.id);
  ok(['ln:roll','ln:set','ln:top','ln:short','to','swap'].every(k=>ids.includes(k))&&!ids.includes('pull'),'early in a game: lines, the timeout and the goalie change; no pull');
  ok(e.act('home','pull')===false,'no pull in the first period');
  ok(e.actsFor('away').length===0,'the computer\'s side has no buttons');
  ok(e.act('home','swap')===true&&e.act('home','swap')===false&&!e.actsFor('home').some(a=>a.id==='swap'),'the backup goes in once') }
{ G.setV(25); const e=G.makeLiveGame(new G.RNG(7),1500,1500,'balanced','balanced',{home:true,away:false}); e.next(); ok(e.actsFor('home').length===0,'engine 25: no buttons, as before'); G.setV(26) }

console.log(bad?`MISMATCH ${bad}`:'MATCH hockey\'s game day: the pull, the lines, the timeout');
process.exit(bad?1:0);
