/* Box scores, league leaders and awards a stats fan believes (round 2 review, engine 26). One computer season in each
   game (two in the NBA), the regular season's leaders read from the players' game logs (league games only: no playoffs,
   no cups), each held to a band around the last three real seasons; basketball's box lines add up to the game; and
   the pro MVP and the Heisman go to the positions the real awards go to (the check test/calibrate.js printed and never
   failed). The bands are wider than the real spread by about one season's noise here.
     node test/boxscores.js [file-prefix]      last line: MATCH or MISMATCH
   Sources (read November 2026):
     NFL   https://www.espn.com/nfl/stats/_/season/2024/seasontype/2 (Burrow 4,918, Barkley 2,005, Chase 1,708, Franklin 173
           tackles, Joseph 9 INT); https://www.espn.com/nfl/stats/player/_/stat/passing/season/2023/seasontype/2 (Tagovailoa
           4,624); https://www.espn.com/nfl/stats/player/_/stat/passing/season/2022/seasontype/2 (Mahomes 5,250);
           https://www.espn.com/nfl/stats/player/_/stat/receiving/season/2023/seasontype/2 (Hill 1,799);
           https://www.espn.com/nfl/stats/player/_/view/defense/season/2023/seasontype/2 (183 tackles);
           https://www.actionnewsjax.com/sports/action-sports-jax/2024-nfl-offenses-were-more-efficient-than-ever/WVJ76EU43BDQLDWG7RJIZRSLKE/
           (65.3% completions in 2024). AP MVP: a quarterback in 21 of the 25 seasons since 2000.
     NBA   https://www.landofbasketball.com/year_by_year_stats/2024_2025_leaders_points_pg_rs.htm (32.7 ppg; 10th 24.9; nine
           at 25+), the 2023_2024 (33.9 / 26.4 / 14) and 2022_2023 (33.1 / 26.2 / 14) pages;
           https://www.landofbasketball.com/yearbyyear/2024_2025_season_leaders.htm and its 2023-24 and 2022-23 pages
           (rebounds 12.3-13.9, assists 10.7-11.6, steals 1.9-3.0)
     NCAAB https://www.espn.com/mens-college-basketball/stats/player/_/season/2025/seasontype/2 (23.3 ppg) and season/2024 (25.2)
     NHL   https://www.thescore.com/nhl/news/3268277 (2024-25: 52 goals, 121 points, one 50-goal man);
           https://www.thescore.com/nhl/news/2894890 (2023-24: 69, 144, four 50-goal men);
           https://thescore.com/nhl/news/2627081 (2022-23: 64, 153, five 50-goal men)
     EPL   Golden Boot 36 (2022-23), 27 (2023-24), 29 (2024-25), 38 league games
     MLB   https://www.mlb.com/news/every-50-home-run-season (leaders 54, 58, 60 in 2023-25);
           https://blogs.fangraphs.com/more-walks-more-runs-an-early-look-at-offense-with-the-arrival-of-the-abs/ (walks
           8.59%, 8.18%, 8.41% of plate appearances in 2023-25); https://www.mlb.com/stats/team/pitching/era/2024?split=h
           and ?split=a (166 + 155 shutouts in 2,429 games in 2024: 13.2%);
           https://nowtakingthefield.substack.com/p/overall-2024-mlb-stats-in-historical (4.39 runs a side in 2024) */
const path=require('path');const {load}=require('./harness.js');
const D=f=>path.join(process.env.DIST||path.join(__dirname,'..','dist'),f);
let bad=0, checks=0; const ok=(c,m)=>{ checks++; console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const inBand=(v,lo,hi,m)=>ok(v>=lo&&v<=hi,`${m}: ${typeof v==='number'&&v%1?v.toFixed(v<1?3:1):v} (band ${lo}-${hi})`);
const EXPOSE=['S','SEA','NAMES','LEAGUE','POS','STAT_KEYS','glStride','newDynasty','boxLines','ENGINE_V','CONF'];
function season(A){ let g=0; while(A.SEA.phase!=='done'&&g++<9000)A.SEA.advance() }
// a player's regular-season league games, from his game log (step before the playoffs, cup bit clear)
function reg(A,p){ const gl=p.gl||[], w=A.glStride(), o={g:0}; for(let j=0;j+w<=gl.length;j+=w){ if(gl[j]>=A.LEAGUE.weeks||(gl[j+2]&2))continue;
  const Q=A.POS[gl[j+5]]; if(!Q)continue; o.g++; (A.STAT_KEYS[Q.p]||[]).forEach((k,q)=>o[k]=(o[k]||0)+gl[j+6+q]) } return o }
function rows(A,flt){ const R=[]; A.NAMES.forEach(t=>(A.SEA.roster[t]||[]).forEach((p,i)=>{ if(!p||!p.st2||!p.st2.g)return; const s=reg(A,p); if(s.g)R.push({t,i,slot:A.POS[i%A.POS.length].p,p,s}) }));
  return flt?R.filter(flt):R }
const top=(R,f,k=0)=>R.map(f).filter(x=>x!=null&&!isNaN(x)).sort((a,b)=>b-a)[k]||0;
const only=process.argv[2];
const run=(f,fn)=>{ if(only&&!f.startsWith(only))return; const t0=Date.now(); console.log(f); const A=load({file:D(f),expose:EXPOSE}); fn(A); console.log(`  (${((Date.now()-t0)/1000).toFixed(0)}s)`) };

// ---- pro football: the leaders, and the MVP by the slot played over sixteen seasons ----
run('football-coach-pro.html',A=>{
  const mvp={}; let first=null;
  for(let s=1;s<=16;s++){ A.newDynasty(A.NAMES[s%A.NAMES.length],s,'T'); season(A); if(!first)first=rows(A);
    const m=A.SEA.mvpRace.call(A.SEA,1)[0]; if(m)mvp[m.p]=(mvp[m.p]||0)+1 }
  const R=first, qb=R.filter(r=>r.slot==='QB'&&r.s.att>=200), cmp=qb.reduce((t,r)=>t+r.s.cmp,0)/qb.reduce((t,r)=>t+r.s.att,0);
  inBand(cmp*100,61,68,'completion % (QBs with 200 attempts; NFL 65.3 in 2024)');
  inBand(top(R,r=>r.s.pyd),4300,5700,'passing yards leader (4,624-5,250)');
  inBand(top(R,r=>r.s.ryd),1350,2200,'rushing yards leader (1,459-2,005)');
  inBand(top(R,r=>r.s.cyd),1450,2000,'receiving yards leader (1,708-1,799)');
  inBand(top(R,r=>r.s.tkl),145,205,'tackles leader (173-183)');
  inBand(top(R,r=>r.s.ints),5,11,'interceptions leader, defense (6-9)');
  const bkCB=R.filter(r=>r.slot==='CB'&&r.i>=A.POS.length&&(r.s.ints||0)>=4&&!(r.s.tkl>0)).length;
  ok(bkCB===0,`no backup corner with 4+ interceptions and no tackles (${bkCB})`);
  const qbRtd=R.filter(r=>r.slot==='QB').reduce((t,r)=>t+(r.s.rtd||0),0); ok(qbRtd>=40,`quarterbacks are credited their rushing touchdowns (${qbRtd} in the league)`);
  const n=Object.values(mvp).reduce((a,b)=>a+b,0); inBand(Math.round(100*(mvp.QB||0)/n),60,96,`MVP to a quarterback, % of 16 seasons (${JSON.stringify(mvp)}; AP 84% since 2000)`);
});
// ---- college football: completions, and the Heisman by the slot played ----
run('football-coach.html',A=>{
  const hz={}; let first=null;
  for(let s=1;s<=10;s++){ A.newDynasty(A.NAMES[s%A.NAMES.length],s,'T'); season(A); if(!first)first=rows(A);
    const m=(A.SEA.mvpRace||A.SEA.heisman).call(A.SEA,1)[0]; if(m)hz[m.p]=(hz[m.p]||0)+1 }
  const qb=first.filter(r=>r.slot==='QB'&&r.s.att>=200), cmp=qb.reduce((t,r)=>t+r.s.cmp,0)/qb.reduce((t,r)=>t+r.s.att,0);
  inBand(cmp*100,58,66,'completion % (QBs with 200 attempts; FBS about 62)');
  inBand(top(first,r=>r.s.pyd),3500,5300,'passing yards leader (about 4,300-5,000; 4,430 the median of 30 seasons here)');
  const n=Object.values(hz).reduce((a,b)=>a+b,0); inBand(Math.round(100*(hz.QB||0)/n),50,100,`Heisman to a quarterback, % of 10 seasons (${JSON.stringify(hz)}; 19 of 25 since 2000)`);
  ok(!Object.keys(hz).some(p=>!['QB','RB','WR','WR2','EDGE','CB'].includes(p)),`Heisman only to skill players and stars (${Object.keys(hz).join(', ')})`);
});
// ---- basketball: leaders, and every box line adds up ----
function bbBox(A,lbl,mins){
  let games=0, badPts=0, badShot=0, badMin=0, badPm=0, bench=0;
  A.SEA.weeks.slice(0,3).forEach((W,step)=>W.games.forEach(g=>{ if(g.hp==null)return; const BL=A.boxLines(g,step,true); if(!BL)return; games++;
    ['home','away'].forEach(sd=>{ const L=BL[sd], sum=k=>L.reduce((t,x)=>t+(x.s[k]||0),0), sc=sd==='home'?g.hp:g.ap, op=sd==='home'?g.ap:g.hp;
      if(sum('pts')!==sc)badPts++;
      L.forEach(x=>{ const s=x.s; if(s.fgm>s.fga||s.tpm>s.tpa||s.ftm>s.fta||s.tpm>s.fgm||2*s.fgm+s.tpm+s.ftm!==s.pts)badShot++; if(/bench/i.test(x.n))bench++ });
      const m=sum('min'), ot=Math.max(0,Math.round((m-mins)/25)); if(m!==mins+25*ot)badMin++;
      if(Math.abs(sum('pm')-5*(sc-op))>5)badPm++ }) }));
  ok(games>20,`${lbl}: box lines read for ${games} games`);
  ok(badPts===0,`${lbl}: players' points are the team's score (${badPts} sides off)`);
  ok(badShot===0,`${lbl}: makes within attempts and 2FG+3PM+FT = points, every line (${badShot} off)`);
  ok(badMin===0,`${lbl}: minutes come to ${mins} a side, 25 more an overtime (${badMin} off)`);
  ok(badPm===0,`${lbl}: plus-minus sums to five times the margin (${badPm} off)`);
  ok(bench===0,`${lbl}: no "rest of the bench" row (${bench})`);
}
run('basketball-coach-pro.html',A=>{
  const S=[]; for(let s=1;s<=2;s++){ A.newDynasty(A.NAMES[s],s,'T'); season(A); if(s===1)bbBox(A,'NBA',240); S.push(rows(A)) }
  const pg=(R,k)=>{ const G=Math.max(...R.map(r=>r.s.g)); return R.filter(r=>r.s.g>=G*0.58).map(r=>(r.s[k]||0)/r.s.g).sort((a,b)=>b-a) };
  const avg=f=>S.map(f).reduce((a,b)=>a+b,0)/S.length;
  inBand(avg(R=>pg(R,'pts')[0]),29,36.5,'scoring leader, ppg (32.7-33.9)');
  inBand(avg(R=>pg(R,'pts')[9]),22.5,28,'tenth scorer, ppg (24.9-26.4)');
  inBand(avg(R=>pg(R,'pts').filter(x=>x>=25).length),5,17,'men at 25+ ppg (9-14)');
  inBand(avg(R=>pg(R,'reb')[0]),11,15.5,'rebounds leader, rpg (12.3-13.9)');
  inBand(avg(R=>pg(R,'ast')[0]),8.5,13,'assists leader, apg (10.7-11.6)');
  inBand(avg(R=>pg(R,'stl')[0]),1.7,3.3,'steals leader, spg (1.9-3.0)');
});
run('basketball-coach.html',A=>{
  A.newDynasty(A.NAMES[1],1,'T'); season(A); bbBox(A,'college',200);
  const R=rows(A), G=Math.max(...R.map(r=>r.s.g)), p=R.filter(r=>r.s.g>=G*0.58).map(r=>r.s.pts/r.s.g).sort((a,b)=>b-a);
  inBand(p[0],21.5,28.5,'scoring leader, ppg (23.3-25.2)');
});
// ---- hockey ----
run('hockey-coach-pro.html',A=>{
  A.newDynasty(A.NAMES[0],7,'T'); season(A); const R=rows(A), pt=r=>(r.s.goals||0)+(r.s.ast||0);
  inBand(top(R,r=>r.s.goals),48,74,'goals leader (52-69)');
  inBand(top(R,pt),110,165,'points leader (121-153)');
  inBand(R.filter(r=>r.s.goals>=50).length,0,14,'50-goal men (NHL 1-5; the roster carries ten of a club\'s eighteen skaters, so its forwards score more)');
  const g=R.reduce((t,r)=>t+(r.s.goals||0),0), a=R.reduce((t,r)=>t+(r.s.ast||0),0); inBand(a/g,1.15,1.8,'assists a goal');
});
// ---- soccer: the Premier League's own games ----
run('soccer-coach.html',A=>{
  A.newDynasty(A.NAMES[0],7,'T'); season(A); const top20=rows(A,r=>A.CONF&&A.CONF[r.t]==='PL');
  inBand(top(top20,r=>r.s.goals),22,38,'Golden Boot, league goals (36, 27, 29)');
});
// ---- baseball ----
run('baseball-coach-pro.html',A=>{
  A.newDynasty(A.NAMES[0],7,'T'); season(A); const R=rows(A), H=R.filter(r=>r.s.ab!=null);
  let G=0,runs=0,so=0; A.SEA.weeks.slice(0,A.LEAGUE.weeks).forEach(W=>W.games.forEach(x=>{ if(x.hp==null)return; G++; runs+=x.hp+x.ap; if(!x.hp||!x.ap)so++ }));
  const ab=H.reduce((t,r)=>t+r.s.ab,0), bb=H.reduce((t,r)=>t+r.s.bb,0);
  inBand(100*so/G,10,16.5,'games with a shutout, % (13.2 in 2024)');
  inBand(runs/G/2,4.1,4.8,'runs a side (4.39 in 2024)');
  inBand(100*bb/(ab+bb),7.6,9.4,'walks, % of AB+BB (8.2-8.6% of plate appearances)');
  inBand(top(H,r=>r.s.hr),40,64,'home run leader (54, 58, 60)');
});
console.log(`${checks} checks`);
console.log(bad?`MISMATCH ${bad} of ${checks}`:'MATCH box scores, leaders and awards look like the real leagues\''); process.exit(bad?1:0);
