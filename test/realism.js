/* Realism report (review round): whole seasons of one league straight through the simulation, measured against the
   real league. For every game: the chance the game shows before it (winProb, the home side's), the result, the margin
   and the points. For every season: the spread of records, the postseason's series and upsets, and the injuries.
     node test/realism.js <league> [seasons=6] [--assist] [--json=out.json]
   league: cfb nfl ncaab nba nhl epl mlb. --assist: your club (a different one each season) simmed by your assistant
   (the plan left on "auto", as Sim ahead does), and its wins set against the board's target. */
const fs=require('fs'), path=require('path');
const FILES={cfb:'football-coach.html',nfl:'football-coach-pro.html',ncaab:'basketball-coach.html',nba:'basketball-coach-pro.html',
  nhl:'hockey-coach-pro.html',epl:'soccer-coach.html',mlb:'baseball-coach-pro.html'};
const args=process.argv.slice(2), LG=args[0], N=+(args.find(a=>/^\d+$/.test(a))||6), ASSIST=args.includes('--assist');
const OUT=(args.find(a=>a.startsWith('--json='))||'').slice(7), DIST=(args.find(a=>a.startsWith('--dist='))||'').slice(7)||path.join(__dirname,'..','dist');
if(!FILES[LG]){ console.log('league: '+Object.keys(FILES).join(' ')); process.exit(2) }
let js=fs.readFileSync(path.join(DIST,FILES[LG]),'utf8').split('<script>')[1].split('</script>')[0].replace(/\(async function\(\)\{[\s\S]*?\}\)\(\);/,'');
global.setTimeout=()=>0; global.clearTimeout=()=>{};
global.window={storage:{get:async()=>null,set:async()=>({}),delete:async()=>({}),list:async()=>({keys:[]})},addEventListener(){},innerWidth:390,matchMedia:()=>({matches:false})};
const nd=()=>({innerHTML:'',value:'1',dataset:{},classList:{toggle(){},add(){},remove(){}},setAttribute(){},scrollIntoView(){},focus(){}});
global.document={getElementById:nd,querySelector:nd,querySelectorAll:()=>[],createElement:nd,body:{classList:{toggle(){}}},addEventListener(){}};
const G=new Function(js+`
  const REC={games:[],drives:[]};
  const _pg=playGame; playGame=function(){ const r=_pg.apply(this,arguments); REC.lastDrives=r&&r.drives; return r };
  const _rs=Season.prototype._resolve;
  Season.prototype._resolve=function(a,b,neutral,extra){
    let wp=null, wd=null; try{ if(LEAGUE.wdl){ const q=LEAGUE.wdl(a,b,true,!!neutral); wp=q[0]; wd=q[1] } else wp=winProb(a,b,true,!!neutral) }catch(e){}
    const ph=this.phase, st=this.step; REC.lastDrives=null;
    const r=_rs.call(this,a,b,neutral,extra);
    REC.games.push({a:a,b:b,n:!!neutral,wp:wp,wd:wd,dv:(typeof CONF!=='undefined'?CONF[a]:null),hp:r.hp,ap:r.ap,w:r.winner,ph:ph,st:st,ot:r.ot||0,draw:!!r.draw,cup:!!(extra&&extra.cup),hs:r.hseed,as:r.aseed,user:this.userTeam===a||this.userTeam===b});
    if(REC.lastDrives&&REC.lastDrives.length&&REC.lastDrives[0]&&REC.lastDrives[0].kind)REC.drives.push(REC.lastDrives.map(d=>d.kind)); REC.sides=REC.sides||[]; [true,false].forEach(h=>{ const D=REC.lastDrives.filter(d=>!!d.home===h&&!d.ot); if(D.length)REC.sides.push([D.length,D.filter(d=>d.kind==='TD').length,D.filter(d=>d.kind==='FG'||d.kind==='MISS').length]) })
    return r };
  return {REC,newDynasty,get SEA(){return SEA},get S(){return S},get U(){return U},NAMES,LEAGUE,expectations,winProb,get ENGINE_V(){return ENGINE_V}};`)();
const L=G.LEAGUE, W=L.weeks;
const res={league:LG,seasons:N,assist:ASSIST,reg:[],post:[],records:[],series:[],inj:{events:0,teamSeasons:0,games:0,mag:0,season:0},user:[],drives:{}};
const t0=Date.now();
for(let s=0;s<N;s++){
  const team=G.NAMES[(s*37+5)%G.NAMES.length];
  G.newDynasty(team,1000+s*7,'T');
  const E=G.SEA, my=G.S.myTeam, exp=G.expectations(), prog=G.U&&G.U.program?G.U.program[my]:null;
  G.REC.games.length=0; G.REC.drives.length=0;
  // what each club should win at the start, by the chance the game shows for each of its games (the season's own strengths)
  const expW={}, varW={}; G.NAMES.forEach(t=>{expW[t]=0;varW[t]=0});
  if(!LG.match(/epl/))E.sched.filter(x=>x.week<W&&!x.cup).forEach(x=>{ let p=0.5; try{ p=G.winProb(x.home,x.away,true,!!x.neutral) }catch(e){} expW[x.home]+=p; expW[x.away]+=1-p; varW[x.home]+=p*(1-p); varW[x.away]+=p*(1-p) });
  let g=0;
  while(E.phase!=='done'&&g++<6000){
    if(ASSIST){ E.userTeam=my; E.plan='auto'; E.featured=null; G.S.plans=G.S.plans||{} } else E.userTeam=null;
    E.advance();
  }
  // records after the regular season (rec counts only the regular season outside college)
  const recs=G.NAMES.map(t=>({t:t,w:E.rec[t][0],l:E.rec[t][1],otl:(E.otl&&E.otl[t])||0,d:(E.drw&&E.drw[t])||0,conf:G.U.conf?G.U.conf[t]:null}));
  res.records.push(recs.map(r=>[r.w,r.l,r.otl,r.d,r.conf]));
  // injuries in the regular season
  G.NAMES.forEach(t=>{ (E.talent.log[t]||[]).forEach(e=>{ if(e.kind==='injury'&&e.wk<W){ res.inj.events++; res.inj.games+=e.weeks||0; res.inj.mag+=Math.abs(e.mag||0); if((e.weeks||0)>=0.4*W)res.inj.season++ } }); res.inj.teamSeasons++ });
  G.REC.games.forEach(x=>{ const o={wp:x.wp,wd:x.wd,dv:x.dv,hp:x.hp,ap:x.ap,hw:x.w===x.a?1:x.draw?0.5:0,n:x.n,ot:x.ot,user:x.user,hs:x.hs,as:x.as,cup:x.cup,a:x.a,b:x.b,st:x.st};
    (x.ph==='week'?res.reg:res.post).push(o) });
  G.REC.drives.forEach(D=>D.forEach(k=>res.drives[k]=(res.drives[k]||0)+1));
  // series: postseason games between the same pair, in order
  const by={}; G.REC.games.filter(x=>x.ph!=='week'&&!x.cup).forEach(x=>{ const k=[x.a,x.b].sort().join('~'); (by[k]=by[k]||[]).push(x) });
  Object.values(by).forEach(Gs=>{ if(Gs.length<2&&!['nba','nhl','mlb'].includes(LG))return; const c={}; Gs.forEach(x=>c[x.w]=(c[x.w]||0)+1);
    const win=Object.keys(c).sort((p,q)=>c[q]-c[p])[0], lose=Gs[0].a===win?Gs[0].b:Gs[0].a;
    const sw=E.seeds?E.seeds[win]:null, sl=E.seeds?E.seeds[lose]:null, rw=E.rec[win][0]/(E.rec[win][0]+E.rec[win][1]), rl=E.rec[lose][0]/(E.rec[lose][0]+E.rec[lose][1]);
    res.series.push({n:Gs.length,sw:sw,sl:sl,rw:rw,rl:rl,wp1:Gs[0].a===win?Gs[0].wp:1-Gs[0].wp}) });
  { const r=E.rec[my]; res.user.push({team:my,w:r[0],l:r[1],exp:exp.w,t:exp.t,prog:prog,xw:expW[my]}) }
  res.xw=res.xw||[]; G.NAMES.forEach(t=>res.xw.push([E.rec[t][0],expW[t],varW[t]]));
}
res.secs=Math.round((Date.now()-t0)/1000);
if(OUT)fs.writeFileSync(OUT,JSON.stringify(res));
// ---- the report ----
const R=LG==='epl'?res.reg.filter(x=>x.dv==='PL'):res.reg, f1=x=>x.toFixed(1), pc=x=>(100*x).toFixed(1)+'%';
const mean=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length), sd=a=>{const m=mean(a);return Math.sqrt(mean(a.map(x=>(x-m)**2)))};
const q=(a,p)=>{const b=a.slice().sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.floor(p*b.length))]};
const marg=R.map(x=>Math.abs(x.hp-x.ap)), pts=[].concat(...R.map(x=>[x.hp,x.ap]));
console.log(`${LG}: ${N} seasons, ${R.length} regular-season games, ${res.post.length} postseason (${res.secs}s, engine ${G.ENGINE_V})`);
console.log(`  points a side ${f1(mean(pts))} (sd ${f1(sd(pts))}, 5th-95th ${q(pts,0.05)}-${q(pts,0.95)}, min ${Math.min(...pts)} max ${Math.max(...pts)}) | total a game ${f1(2*mean(pts))}`);
console.log(`  margin mean ${f1(mean(marg))} sd(signed) ${f1(sd(R.map(x=>x.hp-x.ap)))} median ${q(marg,0.5)} 90th ${q(marg,0.9)} 99th ${q(marg,0.99)} | one-score/one-goal games ${pc(mean(marg.map(m=>m<=({cfb:8,nfl:8,ncaab:3,nba:3}[LG]||1)?1:0)))}`);
const home=R.filter(x=>!x.n); console.log(`  home sides win ${pc(mean(home.map(x=>x.hw)))}${['epl'].includes(LG)?` (draws ${pc(mean(home.map(x=>x.hw===0.5?1:0)))}, home W ${pc(mean(home.map(x=>x.hw===1?1:0)))})`:''} | OT ${pc(mean(R.map(x=>x.ot?1:0)))}`);
// reliability: the shown chance (favourite's) against how often the favourite won
const bins={}; let brier=0, bn=0;
R.concat(res.post).filter(x=>x.wp!=null).forEach(x=>{ const lw=x.wd!=null?1-x.wp-x.wd:1-x.wp, hf=x.wp>=lw, fp=x.wd!=null?Math.max(x.wp,lw):Math.max(x.wp,1-x.wp), won=x.wd!=null?(hf?(x.hw===1?1:0):(x.hw===0?1:0)):(x.wp>=0.5?x.hw:1-x.hw); const k=Math.min(9,Math.floor(fp*20)-10);
  const b=bins[k]=bins[k]||{n:0,p:0,w:0}; b.n++; b.p+=fp; b.w+=won; brier+=(x.wp-x.hw)**2; bn++ });
console.log('  shown chance (favourite) -> won: '+Object.keys(bins).sort((a,b)=>a-b).map(k=>{const b=bins[k];return `${(100*b.p/b.n).toFixed(0)}%->${(100*b.w/b.n).toFixed(0)}% (${b.n})`}).join(' | ')+`  Brier ${(brier/bn).toFixed(4)}`);
const fav=R.filter(x=>x.wp!=null&&x.wp!==0.5&&x.wd==null); if(R.some(x=>x.wd!=null)){ const D=R.filter(x=>x.wd!=null); console.log(`  draws shown ${pc(mean(D.map(x=>x.wd)))} -> ${pc(mean(D.map(x=>x.hw===0.5?1:0)))}; home win shown ${pc(mean(D.map(x=>x.wp)))} -> ${pc(mean(D.map(x=>x.hw===1?1:0)))}`) } if(fav.length)console.log(`  favourite (shown) wins ${pc(mean(fav.map(x=>x.wp>0.5?x.hw:1-x.hw)))}, shown ${pc(mean(fav.map(x=>Math.max(x.wp,1-x.wp))))}`);
// records
const wsd=res.records.map(rs=>sd(rs.map(r=>r[0]))), best=res.records.map(rs=>Math.max(...rs.map(r=>r[0]))), worst=res.records.map(rs=>Math.min(...rs.map(r=>r[0])));
const ptsOf=r=>2*r[0]+r[2];
console.log(`  wins sd ${f1(mean(wsd))} | best ${f1(mean(best))} (max ${Math.max(...best)}) | worst ${f1(mean(worst))} (min ${Math.min(...worst)})`+(LG==='nhl'?` | points sd ${f1(mean(res.records.map(rs=>sd(rs.map(ptsOf)))))}, best ${f1(mean(res.records.map(rs=>Math.max(...rs.map(ptsOf)))))}, worst ${f1(mean(res.records.map(rs=>Math.min(...rs.map(ptsOf)))))}`:'')+(LG==='epl'?` | PL points: best ${f1(mean(res.records.map(rs=>Math.max(...rs.filter(r=>r[4]==='PL').map(r=>3*r[0]+r[3])))))}, worst ${f1(mean(res.records.map(rs=>Math.min(...rs.filter(r=>r[4]==='PL').map(r=>3*r[0]+r[3])))))}`:''));
// series
if(res.series.length){ const S=res.series.filter(x=>x.n>=1), len={}; S.forEach(x=>len[x.n]=(len[x.n]||0)+1);
  const seeded=S.filter(x=>x.sw!=null&&x.sl!=null&&x.sw!==x.sl), better=S.filter(x=>Math.abs(x.rw-x.rl)>0.001);
  console.log(`  postseason: ${S.length} series/ties; length ${Object.keys(len).map(k=>k+':'+pc(len[k]/S.length)).join(' ')} | better seed won ${seeded.length?pc(mean(seeded.map(x=>x.sw<x.sl?1:0))):'-'} | better record won ${pc(mean(better.map(x=>x.rw>x.rl?1:0)))}`);
  const P=res.post.filter(x=>!x.cup), pm=P.map(x=>Math.abs(x.hp-x.ap)); if(P.length)console.log(`  postseason games: margin ${f1(mean(pm))}, 20+ ${pc(mean(pm.map(m=>m>=20?1:0)))}, home won ${pc(mean(P.filter(x=>!x.n).map(x=>x.hw)))}`) }
console.log(`  injuries (regular season, starters): ${f1(res.inj.events/res.inj.teamSeasons)} a team-season, ${f1(res.inj.games/Math.max(1,res.inj.events))} steps out each (of ${W}), cost ${f1(res.inj.mag/Math.max(1,res.inj.events))} rating points; season-long ${pc(res.inj.season/Math.max(1,res.inj.events))}`);
if(G.REC.sides&&G.REC.sides.length){ const S=G.REC.sides, hot=S.filter(x=>x[0]>=8&&x[1]/x[0]>=0.6&&x[2]===0).length, best=S.map(x=>x[1]/x[0]).sort((a,b)=>b-a); console.log(`  a side's game: TDs on 60%+ of 8+ drives with no kick ${(100*hot/S.length).toFixed(2)}% of team-games; 99th percentile TD share ${(100*best[Math.floor(S.length*0.01)]).toFixed(0)}%`) }
if(Object.keys(res.drives).length){ const T=Object.values(res.drives).reduce((a,b)=>a+b,0); console.log('  drives: '+Object.keys(res.drives).sort((a,b)=>res.drives[b]-res.drives[a]).map(k=>k+' '+pc(res.drives[k]/T)).join(', ')+` (${(T/(R.length+res.post.length)/2).toFixed(1)} a side a game)`) }
if(res.xw&&res.xw.length&&res.xw[0][1]>0){ const d=res.xw.map(x=>x[0]-x[1]); console.log(`  season: wins minus the shown chances' sum at the start, sd ${f1(sd(d))} (dice alone ${f1(Math.sqrt(mean(res.xw.map(x=>x[2]))))}; mean ${f1(mean(d))}); expected wins sd ${f1(sd(res.xw.map(x=>x[1])))}`) }
if(res.user.length){ const d2=res.user.map(u=>u.w-u.xw); console.log(`  your club (${ASSIST?'the assistant':'the computer'}): wins minus expected ${f1(mean(d2))} (sd ${f1(sd(d2))}), minus the board's target ${f1(mean(res.user.map(u=>u.w-u.exp)))} (sd ${f1(sd(res.user.map(u=>u.w-u.exp)))})`) }
if(ASSIST&&res.user.length&&process.env.LIST){ const d=res.user.map(u=>u.w-u.exp); console.log(`  your club, simmed by the assistant: wins minus the board's target ${f1(mean(d))} (sd ${f1(sd(d))}): `+res.user.map(u=>`${u.team} ${u.w}-${u.l} vs ${u.exp} (${u.t})`).join('; ')) }
