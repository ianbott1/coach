/* Long careers: does season 20 look like the real league, as season 1 does? (round 2 of the review, branch
   integrity). Plays do-nothing careers (the staff's plan, the staff's offseason) in all seven games and records,
   every season: the rating distribution (starters' mean and spread, the top 1%, the best man), the leaders, scoring
   a game, the spread of wins, payroll, the oldest starters, how ratings change by age over a summer, each club's
   franchise strength and the champion. Then it checks the late seasons against the early ones (drift) and against
   the real leagues (bands below, each with its source).

     node test/longrun.js                        all seven, 20 seasons, 2 careers each (about 25 minutes on 4 cores)
     node test/longrun.js mlb nhl --seasons 12   some leagues
     node test/longrun.js --short                run-all's fast tier: 6 seasons, 1 career, two at a time, the bands that show early
     node test/longrun.js --dist DIR             another build (DIR/<game>.html), e.g. /home/claude/dist-e25 for before
     node test/longrun.js --json out.json        keep every season's numbers
   The last line is MATCH or MISMATCH.

   Real figures (each band says which it uses):
   - MLB leaders and league batting: https://www.baseball-reference.com/leagues/majors/bat.shtml and each season's
     leaders page (HR leader 2015-25: 44-62; batting title .310-.355 since 2015; nobody has hit .400 since 1941:
     https://www.baseball-reference.com/leaders/batting_avg_top_ten.shtml). Wins spread 2024 sd 12.3:
     https://www.espn.in/mlb/table/_/season/2024/sort/losses/group/overall
   - NHL goals a game 5.8-6.4 in 2021-25: https://www.hockey-reference.com/leagues/stats.html
   - NBA points a team a game 110-116 in 2021-25: https://www.basketball-reference.com/leagues/NBA_stats_per_game.html
   - NFL points a team a game 21-23.5 in 2015-24: https://www.pro-football-reference.com/years/NFL/scoring.htm ;
     starting quarterbacks into their late thirties and past 40 (Rodgers and Flacco, both 40+, started against each
     other in 2025): https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/aaron-rodgers-joe-flacco-brings-a-rare-matchup-of-40-year-old-quarterbacks
   - Premier League goals a game 2.5-3.3 in 2015-25: https://www.worldfootball.net/stats/eng-premier-league/1/
   - Aging: MLB hitters peak about 26 and decline gradually, sharply in their late thirties
     (https://blogs.fangraphs.com/checking-in-on-the-aging-curve/); NBA players peak about 27, then decline slowly to
     the mid-30s (https://aws.basketball-reference.com/blog/index5ed6.html?p=2953); NHL forwards peak 27-28,
     defencemen 28-29, goalies change little with age (https://medicalxpress.com/news/2014-05-nhl-players-peak-age.pdf).
*/
const fs=require('fs'), path=require('path'), cp=require('child_process');
const GAMES={cfb:'football-coach', nfl:'football-coach-pro', ncaab:'basketball-coach', nba:'basketball-coach-pro',
  nhl:'hockey-coach-pro', epl:'soccer-coach', mlb:'baseball-coach-pro'};
const COLLEGE={cfb:1, ncaab:1};
const argv=process.argv.slice(2);
const opt=(k,d)=>{ const i=argv.indexOf(k); return i>=0?argv[i+1]:d };

/* ---------------- one career (a child process) ---------------- */
function career(lg,seasons,k,dist){
  const {load}=require('./harness.js');
  const A=load({file:path.join(dist,GAMES[lg]+'.html'),expose:['S','SEA','U','NAMES','POS','LEAGUE','CONF','newDynasty',
    'openOffseason','commitOffseason','payroll','NFL_CAP','ENGINE_V','ATTRS','attrGrp','attrKeys']});
  const team=A.NAMES[(k*7+3)%A.NAMES.length], seed=1000+k*7919;
  A.newDynasty(team,seed,'T');
  const rows=[];
  const q=(a,f)=>{ if(!a.length)return null; const s=a.slice().sort((x,y)=>x-y); return s[Math.min(s.length-1,Math.floor(f*s.length))] };
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null, sd=a=>{ const m=mean(a); return a.length>1?Math.sqrt(a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)):null };
  for(let y=1;y<=seasons;y++){
    const E=A.SEA, NP=A.POS.length;
    // the league this season, as it starts (before any game: the universe's rosters)
    const top=lg==='epl'?A.LEAGUE.conf.order[0]:null, inTop=t=>!top||A.U.conf[t]===top;
    const T=A.NAMES.filter(inTop);
    const st=[], all=[], pots=[], oldest={}, old35={};
    T.forEach(t=>(A.U.roster[t]||[]).forEach((p,i)=>{ if(!p||p.r==null)return; all.push(p.r); if(p.pot!=null)pots.push(p.pot);
      if(i<NP){ st.push(p.r); if(p.age!=null){ const P=String(p.p).replace(/\d+$/,''); oldest[P]=Math.max(oldest[P]||0,p.age); if(p.age>=35)old35[P]=(old35[P]||0)+1 } } }));
    // the league's lean: each attribute's mean (attribute less rating) against a fresh league's (ATTRS.lean), the largest
    let lean=null; if(A.ATTRS&&A.attrGrp){ const S={}, N={};
      A.NAMES.forEach(t=>(A.U.roster[t]||[]).forEach(p=>{ if(!p||!Array.isArray(p.at))return; const g=A.attrGrp(p), K=A.attrKeys(g); if(p.at.length!==K.length)return;
        S[g]=S[g]||K.map(()=>0); N[g]=(N[g]||0)+1; K.forEach((k,j)=>S[g][j]+=p.at[j]-p.r) }));
      lean=0; Object.keys(S).forEach(g=>{ if(N[g]<8)return; const K=A.attrKeys(g), W=A.ATTRS.w[g], M=(A.ATTRS.lean&&A.ATTRS.lean[g])||{}, mw=K.reduce((s,k)=>s+W[k]*(M[k]||0),0);
        K.forEach((k,j)=>{ lean=Math.max(lean,Math.abs(S[g][j]/N[g]-((M[k]||0)-mw))) }) }) }
    let g=0; while(E.phase!=='done'&&g++<3000)E.advance();
    // results
    const R=E.regRec||E.rec, gp=t=>R[t][0]+R[t][1]+((E.drw&&E.drw[t])||0)+((E.otl&&E.otl[t])||0);
    const wins=T.map(t=>R[t][0]*(lg==='epl'?1:1)), winPct=T.map(t=>R[t][0]/Math.max(1,gp(t)));
    const pts=lg==='epl'?T.map(t=>3*R[t][0]+((E.drw&&E.drw[t])||0)):lg==='nhl'&&E.pts?T.map(t=>E.pts(t)):null;
    let n=0,sc=0; (E.weeks||[]).forEach(w=>(w.games||[]).forEach(x=>{ if(x.hp==null||!inTop(x.home)||!inTop(x.away))return; n++; sc+=x.hp+x.ap }));
    // the leaders, from the season's own lines
    const L={}, lines=[]; T.forEach(t=>(E.roster[t]||[]).forEach(p=>{ if(p&&p.st2)lines.push(p) }));
    const mx=(f,flt)=>{ let b=null; lines.forEach(p=>{ if(flt&&!flt(p.st2,p))return; const v=f(p.st2,p); if(v!=null&&isFinite(v)&&(b===null||v>b))b=v }); return b };
    const cnt=(f)=>lines.filter(p=>f(p.st2,p)).length;
    const G=Math.max(...T.map(gp));
    if(lg==='mlb'){ L.hr=mx(s=>s.hr); L.avg=mx(s=>s.ab?s.h/s.ab:null,s=>(s.ab||0)+(s.bb||0)>=3.1*G); L.rbi=mx(s=>s.rbi);
      L.hr30=cnt(s=>(s.hr||0)>=30); L.hr40=cnt(s=>(s.hr||0)>=40); L.k=mx(s=>s.ip!=null?s.k:null);
      L.era=-mx(s=>s.ip>=3*G?-(s.er*27/s.ip):null); L.w=mx(s=>s.ip!=null?s.w:null); }   // ip in outs
    if(lg==='nhl'){ L.goals=mx(s=>s.goals); L.pts=mx(s=>s.pts); L.g50=cnt(s=>(s.goals||0)>=50); L.p100=cnt(s=>(s.pts||0)>=100) }
    if(lg==='nba'||lg==='ncaab'){ const gmin=lg==='nba'?58:20; L.ppg=mx(s=>s.pts/s.g,s=>s.g>=gmin); L.tpm=mx(s=>s.tpm); L.rpg=mx(s=>s.reb/s.g,s=>s.g>=gmin);
      L.ppg25=cnt(s=>s.g>=gmin&&s.pts/s.g>=25) }
    if(lg==='epl'){ L.goals=mx(s=>s.goals); L.g20=cnt(s=>(s.goals||0)>=20) }
    if(lg==='nfl'||lg==='cfb'){ L.pyd=mx(s=>s.pyd); L.ryd=mx(s=>s.ryd); L.cyd=mx(s=>s.cyd); L.sck=mx(s=>s.sck) }
    // payroll (the pro games: the players the sim tracks), against the season's limit
    let pay=null; if(typeof A.payroll==='function'&&!COLLEGE[lg]){ const P=T.map(t=>A.payroll(A.U.roster[t])); pay={med:q(P,0.5),p90:q(P,0.9),cap:A.NFL_CAP||null} }
    const row={y:y,year:E.year,eng:A.ENGINE_V,
      st:{m:mean(st),s:sd(st),p50:q(st,0.5),p90:q(st,0.9),p99:q(st,0.99),max:Math.max(...st)},
      all:{p99:q(all,0.99),max:Math.max(...all),over99:all.filter(r=>r>99).length,potMax:pots.length?Math.max(...pots):null},
      winsSd:sd(winPct)*G, best:Math.max(...winPct)*G, worst:Math.min(...winPct)*G, G:G, ptsSd:pts?sd(pts):null, ptsBest:pts?Math.max(...pts):null,
      score:n?sc/n/2:null, lean:lean, L:L, pay:pay, oldest:oldest, old35:old35,
      prog:A.NAMES.map(t=>Math.round(A.U.program[t])), champ:E.champion};
    // the summer: how each man's rating changes, by age (pros) or class (college), and by position
    if(y<seasons){
      // the same man after the summer: the universe is rebuilt from a snapshot, so match by name and position (a name
      // two men share is left out)
      const id=p=>p.n+'|'+String(p.p).replace(/\d+$/,''), before=new Map(), dup=new Set();
      A.NAMES.forEach(t=>(A.U.roster[t]||[]).forEach(p=>{ if(!p)return; const k=id(p); if(before.has(k))dup.add(k);
        before.set(k,{r:p.r,a:p.age!=null?p.age:'c'+p.c,p:String(p.p).replace(/\d+$/,'')}) }));
      A.openOffseason();
      for(let c=0;c<6&&A.S.off;c++){ const O=A.S.off; if(O.act&&O.act.userOpen&&O.move===null)O.move=A.S.myTeam;
        if(A.LEAGUE.ui.offseasonBlock()!==null&&O.picks&&O.picks.resign)Object.keys(O.picks.resign).forEach(k=>O.picks.resign[k]=false);
        A.commitOffseason() }
      const age={}; A.NAMES.forEach(t=>(A.U.roster[t]||[]).forEach(p=>{ const b=p&&!dup.has(id(p))&&before.get(id(p)); if(!b)return;
        [b.a,b.p+':'+b.a].forEach(key=>{ const x=age[key]=age[key]||[0,0]; x[0]+=p.r-b.r; x[1]++ }) }));
      row.age=age; if(A.U.rc26)row.rc=A.U.rc26;   // engine 26: the starters before the summer's re-centring
    }
    rows.push(row);
    if(!A.SEA||A.S.retired)break;
  }
  return rows;
}

if(argv[0]==='--child'){   // writes its seasons to a file (a pipe can be cut short at exit)
  const [, lg, seasons, k, dist, file]=argv;
  fs.writeFileSync(file,JSON.stringify(career(lg,+seasons,+k,dist)));
  process.exit(0);
}

/* ---------------- the parent: run the careers, then judge ---------------- */
const SHORT=argv.includes('--short');
const LGS=argv.filter(a=>GAMES[a]); const leagues=LGS.length?LGS:Object.keys(GAMES);
const SEASONS=+opt('--seasons',SHORT?6:20), CAREERS=+opt('--careers',SHORT?1:2), JOBS=+opt('--jobs',SHORT?2:3);
const DIST=path.resolve(opt('--dist',path.join(__dirname,'..','dist')));
const jobs=[]; leagues.forEach(lg=>{ for(let k=0;k<CAREERS;k++)jobs.push({lg,k}) });
// longest first
const COST={mlb:9,ncaab:9,epl:6,nba:4,nhl:3,cfb:2,nfl:1.2}; jobs.sort((a,b)=>COST[b.lg]-COST[a.lg]);
const t0=Date.now(), out={};
function runAll(){ return new Promise(done=>{ let next=0, live=0;
  const pump=()=>{ while(live<JOBS&&next<jobs.length){ const j=jobs[next++]; live++;
      const file=path.join(require('os').tmpdir(),`longrun-${process.pid}-${j.lg}-${j.k}.json`);
      const ch=cp.spawn(process.execPath,[__filename,'--child',j.lg,String(SEASONS),String(j.k),DIST,file],{stdio:['ignore','inherit','inherit']});
      ch.on('close',code=>{ live--; try{ (out[j.lg]=out[j.lg]||[])[j.k]=JSON.parse(fs.readFileSync(file,'utf8')); fs.unlinkSync(file) }catch(e){ console.log(`${j.lg} career ${j.k}: no result (exit ${code})`); (out[j.lg]=out[j.lg]||[])[j.k]=null }
        if(next>=jobs.length&&live===0)done(); else pump() }) } };
  pump() }) }

const mean=a=>{ a=a.filter(x=>x!=null&&isFinite(x)); return a.length?a.reduce((s,x)=>s+x,0)/a.length:null };
const f1=x=>x==null?'-':Math.abs(x)<1&&x!==0?x.toFixed(3):x.toFixed(1);

runAll().then(()=>{
  let bad=0; const report=[];
  const check=(lg,what,v,lo,hi,src)=>{ const ok=v!=null&&v>=lo&&v<=hi; if(!ok)bad++;
    report.push(`  ${ok?'ok  ':'FAIL'} ${what}: ${f1(v)} (want ${lo}..${hi}${src?'; '+src:''})`) };
  leagues.forEach(lg=>{
    const C=(out[lg]||[]).filter(Boolean); if(!C.length){ bad++; report.push(`${lg}: no careers finished`); return }
    const N=Math.max(...C.map(c=>c.length)), W=SHORT?3:5;
    const early=C.flatMap(c=>c.slice(0,3)), late=C.flatMap(c=>c.length>=6?c.slice(Math.max(3,c.length-W)):[]);
    const E=f=>mean(early.map(f)), Lt=f=>mean(late.map(f)), MX=(rows,f)=>Math.max(...rows.map(f).filter(x=>x!=null));
    report.push(`\n${lg}: ${C.length} career(s) of ${C.map(c=>c.length).join(', ')} seasons, engine ${C[0][0].eng}->${C[0][C[0].length-1].eng}; early = seasons 1-3, late = each career's last ${W}`);
    if(N<SEASONS){ bad++; report.push(`  FAIL a career ended before season ${SEASONS}`) }
    const line=(what,f,d)=>report.push(`  ${what.padEnd(28)} early ${f1(E(f)).padStart(7)}  late ${f1(Lt(f)).padStart(7)}`+(d?`  ${d}`:''));
    line('starters: mean rating',r=>r.st.m); line('starters: sd',r=>r.st.s); line('starters: 99th percentile',r=>r.st.p99);
    line('best player',r=>r.st.max); line('all: 99th percentile',r=>r.all.p99); line('wins sd',r=>r.winsSd); line('best record (wins)',r=>r.best);
    line('scoring a side a game',r=>r.score); line('largest league-mean lean',r=>r.lean);
    Object.keys(C[0][0].L).forEach(k=>line('leader: '+k,r=>r.L[k]));
    if(C[0][0].pay)line('median payroll',r=>r.pay&&r.pay.med);
    if(C[0].some(r=>r.rc))line('summer: mean before re-centre',r=>r.rc&&r.rc.m,'(engine 26)'),line('summer: sd before re-centre',r=>r.rc&&r.rc.s);
    // the summer's change by age (pros) or class (college), pooled over every summer
    const AG={}; C.forEach(c=>c.forEach(r=>Object.keys(r.age||{}).forEach(a=>{ const x=AG[a]=AG[a]||[0,0]; x[0]+=r.age[a][0]; x[1]+=r.age[a][1] })));
    const ag=a=>AG[a]&&AG[a][1]>=20?AG[a][0]/AG[a][1]:null;
    const ages=Object.keys(AG).filter(a=>/^\d+$/.test(a)).map(Number).sort((a,b)=>a-b);
    if(ages.length)report.push('  summer change by age: '+ages.filter(a=>a>=21&&a<=35).map(a=>`${a}:${ag(a)==null?'-':(ag(a)>0?'+':'')+ag(a).toFixed(1)}`).join(' '));
    const posAge=(P,lo,hi)=>{ let s=0,n=0; for(let a=lo;a<=hi;a++){ const x=AG[P+':'+a]; if(x){ s+=x[0]; n+=x[1] } } return n>=20?s/n:null };
    const all=C.flat();
    // ---------- the bands ----------
    // 1. the scale: no rating past 99, ever (the glossary's 0-99)
    check(lg,'ratings past 99 (any season)',MX(all,r=>r.all.over99),0,0,'0-99 scale');
    check(lg,'best potential (any season)',MX(all,r=>r.all.potMax),0,99,'0-99 scale');
    // 2. drift: the late league against the early one
    if(!SHORT||N>=6){
      check(lg,'starters\' mean rating, late - early',Lt(r=>r.st.m)-E(r=>r.st.m),-1.5,1.5,'drift');
      check(lg,'starters\' 99th percentile, late - early',Lt(r=>r.st.p99)-E(r=>r.st.p99),-3,SHORT?3:2.5,'drift');
      check(lg,'best player, late - early',Lt(r=>r.st.max)-E(r=>r.st.max),-4,SHORT?4:3.5,'drift');
      check(lg,'scoring a game, late / early',Lt(r=>r.score)/E(r=>r.score),0.95,1.05,'drift');
      check(lg,'largest league-mean lean (late)',Lt(r=>r.lean),0,SHORT?0.6:0.3,'a fresh league ~0.1-0.2');
      check(lg,'wins sd, late / early',Lt(r=>r.winsSd)/E(r=>r.winsSd),0.8,1.2,'drift');
      if(C[0][0].pay)check(lg,'median payroll, late / early',Lt(r=>r.pay.med)/E(r=>r.pay.med),0.8,1.2,'drift');
    }
    // 3. the real league, late in a career
    const LT=f=>Lt(f), MXL=f=>MX(late,f);
    if(lg==='mlb'){ check(lg,'late: HR leader (mean)',LT(r=>r.L.hr),42,64,'MLB 2015-25: 44-62');
      check(lg,'late: best HR season',MXL(r=>r.L.hr),0,70,'MLB record 73');
      check(lg,'late: batting title (mean)',LT(r=>r.L.avg),0.300,0.375,'MLB .310-.355');
      check(lg,'late: best batting title',MXL(r=>r.L.avg),0,0.399,'no .400 since 1941');
      check(lg,'late: runs a side a game',LT(r=>r.score),4.0,4.8,'MLB 2021-25 4.3-4.6');
      check(lg,'late: wins sd',LT(r=>r.winsSd),10,15.5,'MLB 2024 12.3') }
    if(lg==='nhl'){ check(lg,'late: goals a game (both sides)',2*LT(r=>r.score),5.6,6.8,'NHL 2021-25 5.8-6.4');
      check(lg,'late: top goal scorer (mean)',LT(r=>r.L.goals),45,72,'NHL 2015-25: 44-69');
      check(lg,'late: 50-goal scorers, late - early',LT(r=>r.L.g50)-E(r=>r.L.g50),-99,4,'drift (12-man rosters make ~10 from season 1)') }
    if(lg==='nba'){ check(lg,'late: points a team a game',LT(r=>r.score),108,121,'NBA 2021-25 110-116');
      check(lg,'late: wins sd',LT(r=>r.winsSd),10,15,'NBA ~12-14') }
    if(lg==='epl'){ check(lg,'late: goals a game (both sides)',2*LT(r=>r.score),2.4,3.3,'PL 2015-25 2.5-3.3') }
    if(lg==='nfl'){ check(lg,'late: points a team a game',LT(r=>r.score),19.5,25,'NFL 2015-24 21-23.5');
      check(lg,'late: wins sd',LT(r=>r.winsSd),2.4,3.9,'NFL 2024 3.65');
      if(!SHORT){ check(lg,'oldest starting QB over the careers',Math.max(...all.map(r=>r.oldest.QB||0)),37,45,'Brady 45, Rodgers 41, Flacco 40');
        check(lg,'starting QBs aged 35+ a season (late)',LT(r=>r.old35.QB||0),0.7,6,'NFL 2024: Rodgers, Stafford, Cousins, Flacco, Wilson') } }
    if(lg==='cfb'){ check(lg,'late: points a team a game',LT(r=>r.score),24,31,'FBS 2015-24 ~27-29') }
    if(lg==='ncaab'){ check(lg,'late: points a team a game',LT(r=>r.score),68,77,'D-I 2015-25 ~70-73') }
    // 4. aging: a peak at 26-29, a steeper fall from 31 (pros)
    if(!COLLEGE[lg]&&!SHORT){
      const at=(lo,hi)=>{ let s=0,n=0; for(let a=lo;a<=hi;a++)if(AG[a]){ s+=AG[a][0]; n+=AG[a][1] } return n?s/n:null };
      check(lg,'summer change at 26-28',at(26,28),-0.6,1.5,'peak 26-29');
      check(lg,'summer change at 29',at(29,29),-1.5,0.5,'peak 26-29');
      check(lg,'summer change at 32-34',at(32,34),-6,-1.5,'decline from 31');
      const later=lg==='nfl'?'QB':lg==='nhl'?'G':lg==='epl'?'GK':lg==='mlb'?'SP':null;
      if(later){ const v=posAge(later,30,32), o=(()=>{ let s=0,n=0; Object.keys(AG).forEach(k=>{ const m=/^([A-Z]+):(\d+)$/.exec(k); if(m&&m[1]!==later&&+m[2]>=30&&+m[2]<=32){ s+=AG[k][0]; n+=AG[k][1] } }); return n?s/n:null })();
        check(lg,`${later} at 30-32 minus others at 30-32`,v!=null&&o!=null?v-o:null,0.3,5,'later peak') }
    }
    // 5. franchises: no club gains in every career (the offseason's dice are the career's own)
    if(C.length>=2&&N>=8){
      const d=C.map(c=>c[c.length-1].prog.map((v,i)=>v-c[0].prog[i]));
      const nT=d[0].length, up=Array(nT).fill(0); d.forEach(x=>x.forEach((v,i)=>{ if(v>0)up[i]++ }));
      const corr=(a,b)=>{ const ma=mean(a), mb=mean(b); let s=0,sa=0,sb=0; a.forEach((x,i)=>{ s+=(x-ma)*(b[i]-mb); sa+=(x-ma)**2; sb+=(b[i]-mb)**2 }); return s/Math.sqrt(sa*sb) };
      // drift residual after regression to the mean (start strength explains part of every career's change)
      const res=d.map((x,ci)=>{ const s0=C[ci][0].prog, ms=mean(s0), mx2=mean(x); let b=0,v=0; s0.forEach((s,i)=>{ b+=(s-ms)*(x[i]-mx2); v+=(s-ms)**2 }); b/=v; return x.map((y,i)=>y-mx2-b*(s0[i]-ms)) });
      const cs=[]; for(let i=0;i<res.length;i++)for(let j=i+1;j<res.length;j++)cs.push(corr(res[i],res[j]));
      report.push(`  franchise drift: correlation between careers ${f1(mean(cs))}; index-0 club up in ${up[0]} of ${C.length}`);
      if(!COLLEGE[lg])check(lg,'franchise drift correlated across careers',mean(cs),-0.35,0.35,'independent careers');
    }
    // 6. college: no program wins titles in every career
    if(COLLEGE[lg]){ const champs={}; all.forEach(r=>{ if(r.champ)champs[r.champ]=(champs[r.champ]||0)+1 });
      const top=Object.entries(champs).sort((a,b)=>b[1]-a[1]).slice(0,4);
      report.push(`  titles: ${top.map(([t,n])=>`${t} ${n}`).join(', ')} of ${all.length}`);
      if(!SHORT&&all.length>=30)check(lg,'one program\'s share of titles',top[0][1]/all.length,0,0.15,'AP era: no program over ~12%') }
  });
  console.log(report.join('\n'));
  const J=opt('--json',null); if(J)fs.writeFileSync(J,JSON.stringify(out));
  console.log(`\n${Math.round((Date.now()-t0)/1000)}s`);
  console.log(bad?`MISMATCH (${bad} band${bad>1?'s':''} out)`:'MATCH');
  process.exit(bad?1:0);
});
