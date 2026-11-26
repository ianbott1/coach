/* Soccer (engine 26): the manager's matchday. Measured against the real Premier League and the rules.
   1. The league still plays like the Premier League with team sheets, rotation, condition and five changes: goals a
      game, draws, home wins and the champion's points against the last three seasons (2022-23 to 2024-25:
      https://www.futbol24.com/national/England/Premier-League/2024-2025/statistics and the 2023-2024, 2022-2023 pages:
      2.85, 3.28, 2.93 goals a game; draws 22.9%, 21.6%, 24.5%; home wins 48.4%, 46.1%, 40.8%; champions on 89, 91, 84).
   2. Changes as the law and the clubs make them: at most five, in at most three windows besides half-time, one more of
      each in extra time (IFAB Law 3, https://www.theifab.com/laws/latest/the-players/); about four a side a match, all
      five in about four matches in ten, the first around the hour (2023-24: 42.5% of matches saw all five used,
      https://kwestthoughts.substack.com/p/data-dump-2023-24-substitution-trends; first changes 55' to 66' by club,
      https://theanalyst.com/articles/assessing-each-premier-league-teams-substitutions-2023-24/).
   3. Condition and rotation: two games in four days leave starters short at kick-off and the clubs rest some (more in a
      cup tie against a lower division); a side short of it picks up a few more knocks, within what the Champions League
      injury study found for four days' rest or fewer against six or more (1.09 overall, 1.32 muscle injuries: Bengtsson,
      Ekstrand and Hagglund, BJSM 2013, https://bjsm.bmj.com/lookup/doi/10.1136/bjsports-2013-092383).
   4. What a sheet is worth, the engine against the shown chance (scSheetElo): tired legs and a weaker man started cost
      about what the card says; the shape a squad suits is worth a little, never a lot.
   5. Your matchday: your sheet starts the man you picked, your changes come in the windows the law allows (a sixth
      and a fourth window refused, half-time free), a change of approach is made and said, and a reload plays it all the
      same; the assistant's changes as before when you leave the bench to him.
     node test/sc-manager.js [dist] [seasons=3]     last line: MATCH or MISMATCH */
process.env.ENGINE_NOW=process.env.ENGINE_NOW||'26';
const path=require('path'); const {load}=require('./harness.js');
const DIST=process.argv[2]&&!/^\d+$/.test(process.argv[2])?process.argv[2]:path.join(__dirname,'..','dist');
const NS=+(process.argv.find(a=>/^\d+$/.test(a))||3), FILE=path.join(DIST,'soccer-coach.html');
let bad=0; const chk=(ok,m)=>{ console.log((ok?'  ok   ':'  FAIL ')+m); if(!ok)bad++ };
const f2=x=>x.toFixed(2), pc=x=>(100*x).toFixed(1)+'%', mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
const t0=Date.now();

/* 1-3: whole seasons, the computer coaching every club */
const EXP=['S','SEA','NAMES','CONF','newDynasty','ENGINE_V','Season','sportInjMul','scCndOf','scDayOf','FORMATIONS','SEGS','scTier'];
const A=load({file:FILE,expose:EXP});
const G=[], five={}, subs=[], firsts=[], rot={lg:[],cupLow:[],cupEq:[]}, cnd={short:[],long:[]}, inj={short:[],long:[]}, fm={}, champ=[];
let wrongWin=0, over=0, keeperRested=0, keeperCup=0;
const proto=A.Season.prototype, _rs=proto._resolve;
proto._resolve=function(a,b,neutral,extra){ const st=this.step, hf=this.half?1:0, cup=!!(extra&&extra.cup), gkHurt=[a,b].map(t=>this.talent.active(t).some(x=>x.idx===0));
  const r=_rs.call(this,a,b,neutral,extra), D=this.lastDrives||[], d0=D.find(d=>d&&d.xi0);
  const pl=!cup&&A.CONF[a]==='PL'&&A.CONF[b]==='PL'&&this.phase==='week';
  if(pl)G.push({h:r.hp,a:r.ap});
  if(d0){ const et=D.some(d=>d.seg>=A.SEGS);
    ['home','away'].forEach((sd,i)=>{ const t=i?b:a, o=i?a:b, W=new Set(); let n=0, f=null;
      D.forEach(d=>{ const L=d.sb&&d.sb[sd]; if(!L||!L.length)return; n+=L.length; if(d.seg!==9&&d.seg<A.SEGS)W.add(d.seg); if(f==null)f=d.seg*5 });
      if(n>5+(et?1:0)||W.size>3)over++;
      if(d0.xi0[sd][0]&&!gkHurt[i]){ if(cup&&A.scTier(o)>A.scTier(t))keeperCup++; else keeperRested++ }
      if(pl){ subs.push(n); if(n>=5)five[G.length-1]=1; if(f!=null)firsts.push(f); fm[d0.xi0.fm[sd]]=(fm[d0.xi0.fm[sd]]||0)+1 }
      const k=d0.xi0[sd].reduce((s,x)=>s+x,0), tier=A.scTier;
      if(pl)rot.lg.push(k); else if(cup)(tier(o)>tier(t)?rot.cupLow:rot.cupEq).push(k) }) }
  return r };
for(let s=0;s<NS;s++){ A.newDynasty(A.NAMES[(s*37+5)%A.NAMES.length],3000+s*11,'T'); const E=A.SEA; let g=0;
  // the days since each club's last game, and its starters' condition at kick-off
  const last={};
  while(E.phase!=='done'&&g++<6000){ E.userTeam=null;
    const st=E.step, hf=E.half?1:0;
    E.advance();
    if(E.phase==='week'||E.step!==st){ const C=A.scCndOf(E);
      // the kick-off condition each club's starters had in the game just played, by the days since its last game
      A.NAMES.forEach(t=>{ const K=C[t]; if(!K||!K.k||K.k.w!==st||K.k.half!==hf||A.CONF[t]!=='PL')return; const day=A.scDayOf(st,hf), gap=last[t]!=null?day-last[t]:7; last[t]=day;
        (gap<=4?cnd.short:cnd.long).push(K.k.v); if(!hf)(gap<=4?inj.short:inj.long).push(A.sportInjMul(t,st+1)) }) } }
  const pts=A.NAMES.filter(t=>A.CONF[t]==='PL').map(t=>3*E.rec[t][0]+((E.drw&&E.drw[t])||0)); champ.push(Math.max(...pts)) }
proto._resolve=_rs;
const goals=mean(G.map(x=>x.h+x.a)), draws=mean(G.map(x=>x.h===x.a?1:0)), homeW=mean(G.map(x=>x.h>x.a?1:0));
console.log(`  ${NS} seasons, ${G.length} Premier League games (${Math.round((Date.now()-t0)/1000)}s, engine ${A.ENGINE_V})`);
chk(A.ENGINE_V===26,'a new season plays on engine 26');
chk(goals>=2.7&&goals<=3.3, `goals a game ${f2(goals)} (real 2.85, 3.28, 2.93)`);
chk(draws>=0.19&&draws<=0.28, `draws ${pc(draws)} (real 22.9%, 21.6%, 24.5%)`);
chk(homeW>=0.40&&homeW<=0.50, `home wins ${pc(homeW)} (real 48.4%, 46.1%, 40.8%)`);
chk(mean(champ)>=78&&mean(champ)<=96, `champions' points ${f2(mean(champ))} (${champ.join(', ')}; real 89, 91, 84)`);
const s5=Object.keys(five).length/G.length;
chk(!over, `never more than five changes, or three windows besides half-time (one more of each in extra time): ${over} sides over`);
chk(mean(subs)>=3.5&&mean(subs)<=4.7, `changes a side a match ${f2(mean(subs))} (Premier League 2023-24: about four)`);
chk(s5>=0.25&&s5<=0.6, `all five used in ${pc(s5)} of matches, by one side or both (2023-24: 42.5%)`);
chk(mean(firsts)>=52&&mean(firsts)<=70, `the first change at ${f2(mean(firsts))}' on average (clubs' averages 55' to 66')`);
chk(!keeperRested, `the first-choice keeper rested only in a cup tie against a lower division (${keeperRested} other times; ${keeperCup} in such ties): clubs play their cup keeper there, never in the league`);
console.log(`  shapes the clubs pick: ${Object.keys(fm).sort((x,y)=>fm[y]-fm[x]).map(k=>k+' '+pc(fm[k]/subs.length)).join(', ')}`);
chk(Object.keys(fm).length>=3&&(fm['4-2-3-1']||0)/subs.length>=0.4&&(fm['4-2-3-1']||0)/subs.length<=0.75, 'the clubs play more than one shape, as their squads suit, 4-2-3-1 most (2024-25: about 54% of teams\' games, https://www.premierleague.com/news/4323030)');
chk(mean(cnd.short)<mean(cnd.long)-1&&mean(cnd.long)>=98, `starters' condition at kick-off: ${f2(mean(cnd.short))} after four days or fewer (${cnd.short.length}), ${f2(mean(cnd.long))} after a week (${cnd.long.length})`);
chk(mean(rot.cupLow)>mean(rot.lg)+0.5&&mean(rot.lg)<1.5, `men rested a game: ${f2(mean(rot.lg))} in the league, ${f2(mean(rot.cupLow))} in a cup tie against a lower division (${rot.cupLow.length}), ${f2(mean(rot.cupEq))} against their own or higher`);
const iS=mean(inj.short), iL=mean(inj.long);
chk(iS>iL&&iS<=1.32&&iL<1.03, `knocks: ${f2(iS)} times as many after four days or fewer, ${f2(iL)} after a week (study: 1.09 overall, 1.32 muscle)`);

/* 4: the engine against the shown chance, on equal sides (gd per Elo from the Elo runs) */
const B=load({file:FILE,expose:['RNG','playGame','scSheetElo','ENGINE_V','FORMATIONS'],settable:['ENGINE_V']}); B.ENGINE_V=26;
const NG=+(process.env.SC_MGR_N||12000);
const sideQ=(c,on,f,ratings)=>({fm:f===undefined?'4-3-3':f,u:[0,1,2,3,4,5].map(u=>({s:ratings?ratings[u]:60,b:ratings?ratings[u]-10:50,ns:'A B',nb:'C D',cs:c,cb:100,av:'both',on:on?(on[u]||0):0}))});
const gdOf=(H,Aw,dh,seed)=>{ const rng=new B.RNG(seed||4242); let gd=0; for(let i=0;i<NG;i++){ const r=B.playGame(rng,1500+dh,1500,'balanced','balanced',{ctx:{xi:{home:H,away:Aw}}}); gd+=r.h-r.a } return gd/NG };
const F=sideQ(100), base=gdOf(F,F,0), perElo=(gdOf(F,F,80,99)-gdOf(F,F,-80,98))/160;
const worth=(H)=>(gdOf(H,F,0,4243)-base)/perElo, shown=H=>B.scSheetElo(H)-B.scSheetElo(F);
const T1=sideQ(80), T2=sideQ(100,[0,1,1,1,1,1]);
const w1=worth(T1), w2=worth(T2), s1=shown(T1), s2=shown(T2);
chk(Math.abs(w1-s1)<=Math.max(15,0.4*Math.abs(s1)), `starters at 80% condition: worth ${w1.toFixed(0)} Elo in the engine, the card says ${s1.toFixed(0)}`);
chk(Math.abs(w2-s2)<=Math.max(15,0.4*Math.abs(s2)), `five deputies started (10 points worse): worth ${w2.toFixed(0)} Elo, the card says ${s2.toFixed(0)}`);
// a squad strong out wide: its shape against the one that suits it least
const R=[60,58,58,58,68,58], best='4-3-3', worst='3-5-2', fw=(gdOf(sideQ(100,0,best,R),sideQ(100,0,worst,R),0,555)-0)/perElo;
chk(fw>0&&fw<45, `a squad strong out wide, in 4-3-3 against itself in 3-5-2: worth ${fw.toFixed(0)} Elo (a little)`);

/* 5: your matchday */
const UX=['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','setActMidGame','scIdx','cardGame','winProb','rebuild'];
function play(acts,sheet,carry){ const U=load({file:FILE,expose:UX,settable:['S']}); U.newDynasty('Southampton',5,'T');
  const my=U.S.myTeam, ng=U.cardGame(my), opp=ng.home===my?ng.away:ng.home, idx=U.scIdx(U.SEA.year,ng.week,ng.cup?1:0); let wp0=U.winProb(my,opp,ng.home===my,!!ng.neutral), wp1=wp0;
  if(sheet){ U.S.xiLog={[my+'|'+idx]:{on:sheet}}; wp1=U.winProb(my,opp,ng.home===my,!!ng.neutral) }
  if(carry)U.S.planMid=JSON.parse(carry);
  for(let k=0;k<3&&!U.live;k++)U.doAdvance(); const L=U.live, side=L.userIsHome?'home':'away'; const log=[];
  let m=0; while(U.live&&!U.live.done&&m++<5000){ if(U.live.ask){U.answerLive(U.live.ask.dp.opts[U.live.ask.dp.opts.length-1][0]);continue}
    const n=U.live.drives.length; (acts[n]||[]).forEach(id=>{ const before=L.pm.length; U.setActMidGame(id); log.push([n,id,L.pm.length>before]) }); U.liveTick() }
  const ev=[]; L.drives.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.side===side&&(e.k==='sub'||e.k==='shift'))ev.push([d.seg,e.k,e.u==null?e.app:e.u]) }));
  return {ev,log,xi0:L.drives[0].xi0[side],subs:L.eng.S[side].subs,score:[L.eng.h,L.eng.a],saved:JSON.stringify(U.S.planMid||{}),wp0,wp1,U} }
const none=play({}), mine=play({4:['s3'],9:['s1','s2'],11:['s4'],13:['s5'],15:['app:block'],16:['s3']});
chk(none.subs>=3&&none.ev.every(e=>e[1]==='sub'), `leave it to your assistant and he makes his changes (${none.subs})`);
const subsBy=mine.ev.filter(e=>e[1]==='sub'), segs=[...new Set(subsBy.map(e=>e[0]))];
chk(subsBy.length===5&&subsBy.some(e=>e[0]===9&&e[2]===1)&&subsBy.some(e=>e[0]===9&&e[2]===2), `five changes: 20', two at half-time, 55', 65' (${JSON.stringify(subsBy.map(e=>e[0]*5+"'"+e[2]))})`);
chk(segs.filter(s=>s!==9).length===3, `three windows besides half-time (${segs.map(s=>s*5+"'").join(', ')})`);
chk(!subsBy.some(e=>e[0]===16), 'a sixth change is refused');
chk(mine.ev.some(e=>e[1]==='shift'&&e[2]==='block'&&e[0]===15), 'sit deeper at 75\': made, and the feed says so');
const fourth=play({2:['s1'],4:['s2'],6:['s3'],8:['s4']}); const w4=fourth.ev.filter(e=>e[1]==='sub').map(e=>e[0]);
chk(w4.length===3&&!w4.includes(8), `a fourth window is refused (${w4.map(s=>s*5+"'").join(', ')})`);
const again=play({},null,mine.saved);
chk(JSON.stringify(again.ev)===JSON.stringify(mine.ev)&&again.score.join()===mine.score.join(), `begun again from the save, the same changes at the same moments (${again.score.join('-')} as ${mine.score.join('-')})`);
const sheet=play({},[0,0,0,1,0,0]);
chk(sheet.xi0[3]===1&&sheet.xi0.filter(x=>x).length===1, `your sheet starts the man you picked in midfield (${JSON.stringify(sheet.xi0)})`);
chk(sheet.wp1<sheet.wp0, `starting the weaker man moves the shown chance (${pc(sheet.wp0)} to ${pc(sheet.wp1)})`);
// a reload replays your sheet: the season so far, the same
{ const U=sheet.U; for(let k=0;k<4;k++){ U.doAdvance(); let m=0; while(U.live&&!U.live.done&&m++<5000){ if(U.live.ask)U.answerLive(U.live.ask.dp.opts[0][0]); else U.liveTick() } }
  const was=JSON.stringify(U.SEA.weeks.map(w=>w.games.map(g=>[g.home,g.away,g.hp,g.ap])));
  const V=load({file:FILE,expose:UX,settable:['S']}); V.S=JSON.parse(JSON.stringify(U.S)); V.rebuild();
  chk(JSON.stringify(V.SEA.weeks.map(w=>w.games.map(g=>[g.home,g.away,g.hp,g.ap])))===was, 'reloaded, the season with your sheet plays back the same') }
console.log(`  (${Math.round((Date.now()-t0)/1000)}s)`);
console.log(bad?`MISMATCH ${bad} failed`:'MATCH the matchday plays like the Premier League'); process.exit(bad?1:0);
