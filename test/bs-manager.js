/* Round 112 (engine 26): pro baseball's dugout, measured against the real game.
     node test/bs-manager.js [dist/baseball-coach-pro.html]          last line: MATCH or MISMATCH
   1. The season's pitching shape (one all-computer season on engine 26, and one on engine 25 beside it for the run level):
      starters' innings and pitches, relief appearances and their length, starters' against relievers' ERA, saves, holds,
      blown saves, relievers' share of wins, back-to-back outings, the busiest reliever, intentional walks.
      Real (2024): MLB starters 4.15 ERA (statmuse.com/mlb/ask/average-era-for-all-starting-pitchers-in-mlb-2024), relievers
      3.97 and 1,225 saves, about 41 a club (mlb.com/stats/team/pitching/era/2024?split=rp); AL starters 5.2 innings and 86
      pitches a start (baseball-reference.com/leagues/AL/2024-starter-pitching.shtml); AL relievers a club: 529 appearances
      (3.3 a game), 3.3 outs each, 89 holds, 31 wins of the club's ~81, 85 appearances on no days' rest
      (baseball-reference.com/leagues/AL/2024-reliever-pitching.shtml); the saves leader 49 (Ryan Helsley,
      statmuse.com/mlb/ask/save-leader-2024); about 507 intentional walks in all, ~17 a club
      (theanalyst.com/2025/03/intentional-walks-mlb-worth-the-risk: 507 plate appearances followed one).
   2. The platoon split: left-handed batters .332 wOBA against right-handers and .291 against left-handers, right-handed
      batters .337 against left-handers and .313 against right-handers, switch-hitters about even
      (blogs.fangraphs.com/basic-hitter-platoon-splits-2002-2012). Times through the order: MLB starters 2016-25 .713 OPS the
      first time, .747 the second, .780 the third (mlb.com/glossary/miscellaneous/third-time-through-the-order-penalty).
   3. Your calls: how often each is due before the gate, and what each choice is worth, on replays from the moment of the
      call (the same dice up to it, fresh luck after: core callSpread's method). Small and honest: your assistant's choice
      is never worse than the average option, and the best is worth a few points at most.
   4. The live button: Go to the bullpen asks who comes in when you next take the field, and he comes in.
   5. Engine 25 is untouched: no pitching changes by name, the closer and the bullpen as before. */
const path=require('path'), {spawn}=require('child_process');
const {load}=require('./harness.js');
const FILE=process.argv.slice(2).find(a=>!a.startsWith('--'))||path.join(__dirname,'..','dist','baseball-coach-pro.html');
const CHILD=process.argv.includes('--season');
const EXPOSE=['SEA','NAMES','newDynasty','playGame','makeLiveGame','gameCtx','RNG','mulberry32','ENGINE_V','bsBats','bsThrows','bsRelief','POS'];

/* ---- 1. one season of computer games (run in a child, once per engine) ---- */
function season(seed){
  const A=load({file:FILE,expose:EXPOSE,settable:['playGame']}); A.newDynasty('Seattle',seed,'T');
  const pg=A.playGame, G=[];
  A.playGame=function(rng,eh,ea,ph,pa,opts){ const r=pg.apply(null,arguments), d=r.drives[r.drives.length-1], c=opts&&opts.ctx;
    G.push({box:d&&d.box,h:r.h,a:r.a,step:A.SEA.step,t:c&&c.team,ev:[].concat(...r.drives.map(x=>x.ev||[]))}); return r };
  let n=0; while(A.SEA.phase==='week'&&n++<3000){ A.SEA.userTeam=null; A.SEA.advance() }
  const o={games:G.length,runs:0,spOuts:0,spEr:0,rpOuts:0,rpEr:0,gs:0,spNp:0,rpApp:0,spW:0,rpW:0,sv:0,hld:0,bs:0,ibb:0,ph:0,pc:0,b2b:0,named:0,anon:0};
  const days={};   // team|reliever -> steps pitched
  G.forEach(g=>{ o.runs+=g.h+g.a; g.ev.forEach(e=>{ if(e.k==='ibb')o.ibb++; if(e.k==='ph')o.ph++; if(e.k==='pc')o.pc++ });
    ['home','away'].forEach(sd=>{ const F=g.box[sd], sp=F.sp, d=F.dec||{}; o.gs++; if(F.pit.bullpen||F.pit.closer)o.anon++;
      Object.keys(F.pit).forEach(nm=>{ const p=F.pit[nm]; if(nm===sp){ o.spOuts+=p.outs; o.spEr+=p.er; o.spNp+=p.np||0 } else { o.rpOuts+=p.outs; o.rpEr+=p.er; o.rpApp++;
        if(p.np!=null){ o.named++; const k=(g.t&&g.t[sd])+'|'+nm; (days[k]=days[k]||[]).push(g.step) } } });
      if(d.w){ if(d.w===sp)o.spW++; else o.rpW++ } if(d.sv)o.sv++; o.hld+=(d.hld||[]).length; o.bs+=(d.bs||[]).length }) });
  let apps=0, busiest=0; Object.values(days).forEach(L=>{ const s=new Set(L); apps+=L.length; busiest=Math.max(busiest,L.length); L.forEach(x=>{ if(s.has(x-1))o.b2b++ }) });
  const R=A.bsRelief?A.NAMES.map(t=>A.bsRelief(t)):[]; let lead=0; R.forEach(T=>Object.values(T).forEach(s=>{ lead=Math.max(lead,s.sv) }));
  return {eng:A.ENGINE_V, runs:o.runs/G.length/2, ip:o.spOuts/3/o.gs, np:o.spNp/o.gs, spEra:o.spEr*27/o.spOuts, rpEra:o.rpEr*27/o.rpOuts,
    app:o.rpApp/o.gs, outsApp:o.rpOuts/o.rpApp, sv:o.sv/30, svLead:lead, hld:o.hld/30, bs:o.bs/30, rpWin:o.rpW/(o.spW+o.rpW),
    b2b:apps?o.b2b/apps:0, busiest:busiest, ibb:o.ibb/30, ph:o.ph/30, pc:o.pc/G.length, named:o.named, anon:o.anon};
}
if(CHILD){ const s=+(process.argv[process.argv.indexOf('--season')+1]||1); console.log(JSON.stringify(season(s))); return }
const child=(env,seed)=>new Promise(res=>{ let out=''; const p=spawn(process.execPath,[__filename,FILE,'--season',String(seed)],{env:Object.assign({},process.env,env)});
  p.stdout.on('data',d=>out+=d); p.stderr.on('data',d=>out+=d); p.on('close',()=>{ try{ res(JSON.parse(out.trim().split('\n').pop())) }catch(e){ res({err:out.slice(-400)}) } }) });

(async()=>{
  let bad=0; const ok=(c,msg)=>{ console.log((c?'  ok   ':'  FAIL ')+msg); if(!c)bad++ };
  const kids=Promise.all([child({ENGINE_NOW:'26'},1),child({ENGINE_NOW:'25'},1)]);

  /* ---- 2 to 4, in this process, on engine 26 ---- */
  const A=load({file:FILE,expose:EXPOSE}); A.newDynasty('Seattle',2,'T'); const S=A.SEA;
  for(let i=0;i<40;i++){ S.userTeam=null; S.advance() }
  const W={bb:0.69,hbp:0.72,s1:0.88,s2:1.25,s3:1.59,hr:2.04};   // wOBA weights (FanGraphs' guts, about 2024)
  const cell=()=>({n:0,w:0}), sp={LL:cell(),LR:cell(),RL:cell(),RR:cell(),SL:cell(),SR:cell()}, tto=[cell(),cell(),cell()];
  const ctxOf=gi=>{ const h=A.NAMES[gi%30], a=A.NAMES[(gi*7+3)%30]; return a===h?null:A.gameCtx(h,a,S.year,S.step) };
  for(let gi=0;gi<3000;gi++){ const ctx=ctxOf(gi); if(!ctx)continue; const e=A.makeLiveGame(new A.RNG(5000+gi),1500,1500,'balanced','balanced',{home:false,away:false},false,ctx); e.plog=true;
    const th={}; ['home','away'].forEach(sd=>(ctx.pen26[sd]||[]).forEach(c=>{ th[c[0]]=c[2]?'L':'R' }));
    let r; while(!(r=e.next()).done){}
    // (times through the order only where the fielding side never set a plan: a right read after three innings makes
    // their hitters worse from the fourth on, BS.read, which would hide the penalty)
    const plain={home:!e.S.home.ans,away:!e.S.away.ans}, seen={};   // starter -> batters faced
    r.drives.forEach(d=>(d.pl||[]).forEach(q=>{ if(q.t!=='pa'||q.ibb)return; const b=A.bsBats(q.nm), t=th[q.p]||A.bsThrows(q.p), c=sp[b+t], w=W[q.o]||0; c.n++; c.w+=w;
      const side=q.s===0?'away':'home', sn=ctx.sp[side]&&ctx.sp[side].n; if(q.p===sn&&plain[side]){ const k=seen[sn]=(seen[sn]||0)+1, j=Math.floor((k-1)/9); if(j<3){ tto[j].n++; tto[j].w+=w } } })) }
  const wo=c=>c.w/c.n, f3=x=>x.toFixed(3).replace(/^0/,'');
  const gL=wo(sp.LR)-wo(sp.LL), gR=wo(sp.RL)-wo(sp.RR), gS=wo(sp.SR)-wo(sp.SL);
  console.log(`  platoon (${sp.LL.n+sp.LR.n+sp.RL.n+sp.RR.n+sp.SL.n+sp.SR.n} PA): left-handed batters ${f3(wo(sp.LR))} v RHP, ${f3(wo(sp.LL))} v LHP (gap ${f3(gL)}, real .041); right-handed ${f3(wo(sp.RL))} v LHP, ${f3(wo(sp.RR))} v RHP (gap ${f3(gR)}, real .024); switch ${f3(gS)}`);
  const lhp=(sp.LL.n+sp.RL.n+sp.SL.n)/(sp.LL.n+sp.LR.n+sp.RL.n+sp.RR.n+sp.SL.n+sp.SR.n);
  console.log(`  share of plate appearances against a left-hander ${(100*lhp).toFixed(0)}% (real ~28%)`);
  ok(Math.abs(gL-0.041)<=0.016&&Math.abs(gR-0.024)<=0.014&&Math.abs(gS)<=0.02&&gL>gR,'the platoon split is the real one, left-handed batters most');
  ok(lhp>0.2&&lhp<0.36,'about a quarter of plate appearances come against a left-hander');
  const t1=wo(tto[0]), t2=wo(tto[1]), t3=wo(tto[2]);
  console.log(`  starters' wOBA by time through the order: ${f3(t1)} / ${f3(t2)} / ${f3(t3)} (x${(t2/t1).toFixed(3)}, x${(t3/t1).toFixed(3)}; real OPS x1.048, x1.094)`);
  ok(t2/t1>1.01&&t2/t1<1.10&&t3/t1>1.04&&t3/t1<1.15&&t3>t2,'hitters do better each time through the order, by about the real step');

  /* 3. calls: due how often (before the gate) and their worth on replays */
  const asked={}, worth={}; let games=0; const RUNS=+(process.env.BSM_RUNS||50);
  const val=(r,home)=>home?(r.h>r.a?1:0):(r.a>r.h?1:0);
  const playTo=(seed,ctx,home,answers,j,v,m)=>{ const rng=new A.RNG(seed), e=A.makeLiveGame(rng,1500,1500,'balanced','balanced',{home:home,away:!home},false,ctx); let i=0,g=0,r;
    while(g++<3000){ r=e.next(); if(r.done)break; if(r.ask){ let a; if(i<j)a=answers[i]; else if(i===j){ a=v; rng.f=A.mulberry32((seed^Math.imul(m+211,0x9E3779B1))>>>0); rng.sp=null } else a=r.ask.opts[r.ask.opts.length-1][0]; e.reply(a); i++ } }
    return val(r,home) };
  const graded={pull:0,pen:0,penu:0,pinch:0,ibb:0};
  for(let gi=0;gi<160;gi++){ const ctx=ctxOf(gi+3); if(!ctx)continue; const seed=9000+gi, home=gi%2===0; games++;
    const rng=new A.RNG(seed), e=A.makeLiveGame(rng,1500,1500,'balanced','balanced',{home:home,away:!home},false,ctx); const ans=[]; let r,g=0;
    while(g++<3000){ if(gi%4===0&&ans.length===2)e.act(home?'home':'away','pen'); r=e.next(); if(r.done)break;
      if(r.ask){ const k=r.ask.k; asked[k]=(asked[k]||0)+1;
        if(graded[k]!==undefined&&graded[k]<(k==='penu'?10:k==='ibb'||k==='pinch'?14:22)){ graded[k]++; const j=ans.length, O=r.ask.opts.map(o=>o[0]);
          const v=O.map(o=>{ let s=0; for(let m=0;m<RUNS;m++)s+=playTo(seed,ctx,home,ans,j,o,m); return s/RUNS });
          const ai=O.indexOf('normal'), def=ai>=0?v[ai]:v[v.length-1], others=v.filter((x,i)=>i!==ai), mean=others.reduce((a,b)=>a+b,0)/others.length;
          const W0=worth[k]=worth[k]||{n:0,gain:0,spread:0,vsMean:0}; W0.n++; W0.gain+=Math.max(...v)-def; W0.spread+=Math.max(...v)-Math.min(...v); W0.vsMean+=def-mean }
        const a=r.ask.opts[r.ask.opts.length-1][0]; ans.push(a); e.reply(a) } } }
  console.log(`  calls due a game, before the gate (${games} games): `+Object.keys(asked).sort().map(k=>`${k} ${(asked[k]/games).toFixed(2)}`).join(', '));
  Object.keys(worth).forEach(k=>{ const W0=worth[k]; console.log(`  ${k}: ${W0.n} calls on ${RUNS} replays each: the best option ${(100*W0.gain/W0.n).toFixed(1)} points over your assistant's, best to worst ${(100*W0.spread/W0.n).toFixed(1)}, assistant against the average option ${(100*W0.vsMean/W0.n>=0?'+':'')}${(100*W0.vsMean/W0.n).toFixed(1)}`) });
  ok(['pull','pen','pinch'].every(k=>asked[k]>0),'the bullpen and the pinch hitter are asked, by name');
  { let n=0,s=0; Object.keys(worth).filter(k=>k!=='penu').forEach(k=>{ n+=worth[k].n; s+=worth[k].vsMean });
    console.log(`  all graded calls: your assistant against the average option ${(100*s/n>=0?'+':'')}${(100*s/n).toFixed(1)} points (${n} calls)`);
    ok(s/n>=-0.01,"your assistant's choice is within a point of the average option's, over every graded call (the replays' noise is about half a point)") }
  ok(Object.keys(worth).every(k=>worth[k].spread/worth[k].n<0.25),'each choice is worth a few points, not the game');

  /* 4. the live button */
  { const ctx=ctxOf(11); const e=A.makeLiveGame(new A.RNG(77),1500,1500,'balanced','balanced',{home:true,away:false},false,ctx);
    const acts=e.actsFor('home'); let r,g=0,got=null,inAfter=null;
    while(g++<3000){ if(g===4)e.act('home','pen'); r=e.next(); if(r.done)break;
      if(r.ask){ if(r.ask.k==='penu'&&!got){ got=r.ask; const pick=r.ask.opts[1][0]; e.reply(pick); inAfter=pick.slice(4); continue } e.reply(r.ask.opts[r.ask.opts.length-1][0]) } }
    const pc=[].concat(...r.drives.map(d=>d.ev||[])).find(x=>x.k==='pc'&&x.side==='home'&&x.nm===inAfter);
    ok(acts.length===1&&acts[0].l==='Go to the bullpen'&&!!got&&!!pc,`the live bar's Go to the bullpen asks who (${got?got.opts.length-1:0} arms offered) and he comes in (${inAfter||'nobody'})`) }

  /* 1 and 5: the seasons */
  const [s26,s25]=await kids;
  if(s26.err||s25.err){ console.log(s26.err||s25.err); ok(false,'the seasons ran'); }
  else{ const f=(x,d)=>x.toFixed(d==null?2:d);
    for(const s of [s25,s26])console.log(`  engine ${s.eng}: ${f(s.runs)} runs a side; starters ${f(s.ip)} innings, ${f(s.np,0)} pitches, ${f(s.spEra)} ERA; relievers ${f(s.rpEra)} ERA, ${f(s.app)} a game, ${f(s.outsApp)} outs each, ${f(s.rpWin*100,0)}% of wins; saves ${f(s.sv,1)} a club (leader ${s.svLead}), holds ${f(s.hld,1)}, blown ${f(s.bs,1)}; ${f(s.b2b*100,0)}% of relief outings on no days' rest, the busiest ${s.busiest}; ${f(s.ibb,1)} intentional walks and ${f(s.ph,1)} pinch hitters a club`);
    // (round 112 follow-up: against MLB's own figure, not engine 25's. Engine 26 also cut walks to the real rate and
    // the starter's day-to-day form, from the stats branch, and the run level is set from the real one: MLB 2021-25
    // 4.3-4.6 a side, https://www.baseball-reference.com/leagues/majors/bat.shtml)
    ok(s26.runs>=4.25&&s26.runs<=4.6,`the run level is MLB's (${f(s26.runs)} a side; engine 25 ${f(s25.runs)}; MLB 2021-25 4.3-4.6, 2024 4.39)`);
    ok(s26.ip>=4.95&&s26.ip<=5.5&&s26.np>=80&&s26.np<=92,'starters go about five and a third innings and 86 pitches (AL 2024: 5.2, 86)');
    ok(s26.spEra>s26.rpEra&&s26.spEra-s26.rpEra<0.45,'starters allow a little more than relievers (2024: 4.15 against 3.97)');
    ok(s26.app>=2.9&&s26.app<=3.7&&s26.outsApp>=2.9&&s26.outsApp<=3.8,'relievers: about 3.3 appearances a game, about 3.3 outs each (AL 2024)');
    ok(s26.sv>=35&&s26.sv<=48&&s26.svLead>=40&&s26.svLead<=58,'saves: about 41 a club, the leader in the 40s (2024: Helsley 49)');
    ok(s26.hld>=65&&s26.hld<=110&&s26.bs>=10&&s26.bs<=32,'holds about 89 a club (AL 2024), and blown saves');
    ok(s26.rpWin>=0.28&&s26.rpWin<=0.45,"relievers take about 38% of wins (AL 2024: 31 of 81)");
    ok(s26.b2b>=0.08&&s26.b2b<=0.25&&s26.busiest<=90,"back-to-back days are about one outing in six (AL 2024: 85 of 529), and nobody pitches every day");
    ok(s26.ibb>=6&&s26.ibb<=30,'intentional walks: a dozen or so a club (2024: about 17)');
    ok(s26.anon===0&&s26.named>0,'every reliever is named: no anonymous bullpen');
    ok(s25.named===0&&s25.anon>0&&s25.pc===0,'engine 25 is as it was: the closer and the bullpen, no pitching changes by name') }
  console.log(bad?'MISMATCH':'MATCH');
})();
