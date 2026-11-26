/* ============ players: basketball ============ */
/* Ten players per program: five starters and a backup at each spot. Team
   strength comes from them, starters and bench together (the bench plays a
   fifth of the minutes), so injuries, graduation, recruiting and depth all
   move it through actual people. */

const PNAMES_F=["Marcus","Jalen","Trevor","DeAndre","Caleb","Xavier","Bryce","Amari","Cooper",
"Isaiah","Rashaun","Tanner","Malik","Grayson","Devonte","Hunter","Elijah","Josiah","Keenan","Dontae",
"Landon","Zaire","Kyler","Omari","Tre","Nico","Quinn","Deshaun","Cade","Tyrese","Micah","Damari",
"Kobe","Silas","Emory","Kade","Anwar","Diego","Kamari","Jamir","Ezra","Khalil","Nnamdi","Makai",
"Jaylen","Tariq","Darius","Moussa","Luka","Bogdan","Ousmane","Kel'el","Terrence","Armando","Otis"];
const PNAMES_L=["Whitfield","Okonkwo","Barrera","Sanders","Colquitt","Adeyemi","Reyes","Traylor",
"Mbeki","Vandenberg","Hollis","Guillory","Achebe","Kirkpatrick","Solano","Nwosu","Bettencourt",
"Ratliff","Delacroix","Ivory","Sinclair","Ogunleye","Castillo","Thibodeaux","Marchetti","Ude",
"Espinoza","Vann","Duckworth","Asante","Rios","Pettigrew","Oyelaran","Steadman","Cifuentes","Igwe",
"Balogun","Tremblay","Norwood","Mensah","Quintero","Ashworth","Diallo","Buchanan","Lefevre","Odom",
"Kponeh","Vasquez","Randle","Diabate","Petrovic","Kuminga","Sissoko","Harlan","Ellsworth"];

/* position, share of team strength, backup dropoff, share of injuries */
const POS=[
  {p:"PG", w:0.22, drop:12, hz:0.20},
  {p:"SG", w:0.20, drop:11, hz:0.20},
  {p:"SF", w:0.20, drop:11, hz:0.20},
  {p:"PF", w:0.19, drop:11, hz:0.20},
  {p:"C",  w:0.19, drop:12, hz:0.20},
];
const BENCH=0.20;                        // the bench's share of the minutes
function pickInjuredPos(rng){
  let x=rng.r(), acc=0;
  for(let i=0;i<POS.length;i++){acc+=POS[i].hz; if(x<acc)return i}
  return POS.length-1;
}
/* rating <-> Elo, as in football: teamRating 45 -> 1150, 82 -> 2050 */
const R_SLOPE=24.3, R_INT=56;
const ratingToElo=r=>R_INT+R_SLOPE*r;
const eloToRating=e=>(e-R_INT)/R_SLOPE;
function playerName(rng){ const f=rng.pick(PNAMES_F), l=rng.pick(PNAMES_L); return f+" "+wideLast(f,l,PNAMES_L) }   // the same two draws; the surname read through a wider list (core 21_names)
/* ten players: 0-4 start, 5-9 back up the same spot */
const BK=i=>i+POS.length;
function teamRating(roster){
  let s=0;
  POS.forEach((P,i)=>{const st=roster[i], bk=roster[BK(i)]||st;
    s+=P.w*((1-BENCH)*st.r+BENCH*bk.r)});
  return s;
}
function rosterElo(roster){return ratingToElo(teamRating(roster))}
/* Elo cost of losing a starter: his minutes go to the backup, and the
   backup's to whoever is next (a walk-on's worth of drop) */
function injuryCost(roster,idx){
  const P=POS[idx];
  if(!roster||!roster[BK(idx)])return -P.w*P.drop*R_SLOPE;
  const gap=Math.max(3,roster[idx].r-roster[BK(idx)].r);
  // pro basketball's fifteen (the front office, Nov 2026): the third man takes the backup's minutes, so a deep bench
  // softens an injury and a thin one deepens it; ten deep (college, older careers) a walk-on's worth, as before
  const th=roster[BK(BK(idx))], d2=th?Math.max(1,Math.min(14,roster[BK(idx)].r-th.r)):6;
  return -P.w*((1-BENCH)*gap+BENCH*d2)*R_SLOPE;
}

/* ============ box scores ============ */
/* engine 26 (stats): and the rest of a box score's line: minutes, field goals made and tried, threes tried, free throws,
   turnovers, fouls and plus-minus (a season begun before keeps the six: blankStats) */
const BB_K6=["pts","reb","ast","stl","blk","tpm"], BB_K26=BB_K6.concat(["min","fgm","fga","tpa","ftm","fta","to","pf","pm"]);
const STAT_KEYS={PG:BB_K26,SG:BB_K26,SF:BB_K26,PF:BB_K26,C:BB_K26};
function blankStats(pos){const o={g:0}; (typeof ENGINE_V!=="undefined"&&ENGINE_V<26?BB_K6:STAT_KEYS[pos]||[]).forEach(k=>o[k]=0); return o}
/* how a position's production splits: share of the starters' points,
   rebounds, assists, steals, blocks, and threes */
const ROLE={PG:{pts:0.22,reb:0.12,ast:0.40,stl:0.30,blk:0.05,tpm:0.28},
            SG:{pts:0.25,reb:0.14,ast:0.20,stl:0.25,blk:0.07,tpm:0.34},
            SF:{pts:0.22,reb:0.19,ast:0.16,stl:0.20,blk:0.13,tpm:0.24},
            PF:{pts:0.17,reb:0.25,ast:0.13,stl:0.14,blk:0.30,tpm:0.10},
            C: {pts:0.14,reb:0.30,ast:0.11,stl:0.11,blk:0.45,tpm:0.04}};
/* engine 26 (stats): the scoring shares flatter by position (a center leads the league in scoring as often as a guard
   does: Embiid, Jokic, Antetokounmpo), and a star's share leans more on his rating (BB_SLOPE26 a 20-point spread, was 0.35) */
const ROLE26={PG:{pts:0.21,reb:0.12,ast:0.40,stl:0.30,blk:0.05,tpm:0.30},
              SG:{pts:0.22,reb:0.14,ast:0.20,stl:0.25,blk:0.07,tpm:0.32},
              SF:{pts:0.21,reb:0.19,ast:0.16,stl:0.20,blk:0.13,tpm:0.24},
              PF:{pts:0.19,reb:0.25,ast:0.13,stl:0.14,blk:0.30,tpm:0.10},
              C: {pts:0.17,reb:0.30,ast:0.11,stl:0.11,blk:0.45,tpm:0.04}};
const BB_SLOPE26=0.6;
/* one game's line for one starter, consistent with his rating and the score */
function gameStats(rng,pl,posIdx,forPts,oppPts,won){
  const P=POS[posIdx].p, R=ROLE[P], q=(pl.r-60)/20;          // about -1 .. +1.5
  const star=Math.max(0.55,1+q*0.35+rng.gauss(0,0.22));
  const team={pts:forPts*(1-BENCH), reb:rng.gauss(36,4)*(1-BENCH), ast:forPts*0.19*(1-BENCH),
              stl:rng.gauss(6.5,1.8)*(1-BENCH), blk:rng.gauss(3.6,1.4)*(1-BENCH), tpm:forPts*0.105*(1-BENCH)};
  const s={};
  Object.keys(R).forEach(k=>{s[k]=Math.max(0,Math.round(team[k]*R[k]*star+rng.gauss(0,k==="pts"?2.5:0.8)))});
  if(s.tpm*3>s.pts)s.tpm=Math.floor(s.pts/3);
  return s;
}
/* round 74 (engV 4): a team's lines from the game's own record. Its made twos, threes and free throws (the engine counts
   them) go one by one to the players on the floor, by position and rating, with the bench's share to the bench; the man
   the play-by-play named for a three or an and-one has it. So the points come to the score, less the bench's. Rebounds
   are the misses the game had (their misses less their offensive boards, and ours), assists about three made shots in
   five, steals about half their turnovers, blocks about one of their missed twos in six; nine misses in ten end in a player's rebound, shared the same way. */
const BB_AST=0.60, BB_STL=0.52, BB_BLK=0.18, BB_REB=0.9, BB_STARP6C=+((typeof process!=="undefined"&&process.env&&process.env.BB_SPC)||2.8), BB_STARP4=1.6, BB_STARP5=+((typeof process!=="undefined"&&process.env&&process.env.BB_SP)||2.2);   // round 75 (engine 5): 2.2, college's scoring leader ran 22 (the real one ~25); pro 30 to 32   // a star's share of the scoring grows faster than his rating (1.6)
function teamLines(rng,c){
  const recs=c.drives.filter(d=>d.ln), last=recs[recs.length-1], o=c.side==="home"?"away":"home";
  if(!last)return statLinesOld(rng,c);
  const M=last.ln[c.side], O=last.ln[o], tm=c.tm;
  const sl=c.act.map(x=>({x:x,R:ROLE[x.P],star:Math.max(0.55,1+(x.pl.r-60)/20*0.35+rng.gauss(0,0.22))}));
  const at={}; c.R.forEach((p,i)=>{ if(p&&p.n&&!at[p.n])at[p.n]={pl:p,i:i} });
  const line=()=>({pts:0,reb:0,ast:0,stl:0,blk:0,tpm:0,f2:0,ft:0}), L=sl.map(line), extra={};
  // the play-by-play's men: a three, a bucket inside and its free throw
  const named=(nm,k)=>{ if(!nm)return; const j=sl.findIndex(s=>s.x.pl.n===nm); const t=j>=0?L[j]:(at[nm]?(extra[nm]=extra[nm]||line()):null); if(t)t[k]++ };
  let t3=M.tpm||0, t2=M.fgm2||0, t1=M.ftm||0;
  // round 101: a stretch played back in the full match names every man it showed scoring (d.pn, roster slots): he has it
  const sd=c.side==="home"?0:1;
  c.drives.forEach(d=>{ if(!Array.isArray(d.pn))return; d.pn.forEach(q=>{ if(q[0]!==sd)return; const p=c.R[q[2]]; if(!p)return;
    if(q[1]===3&&t3>0){ named(p.n,"tpm"); t3-- } else if(q[1]===2&&t2>0){ named(p.n,"f2"); t2-- } else if(q[1]===1&&t1>0){ named(p.n,"ft"); t1-- } }) });
  c.drives.forEach(d=>!Array.isArray(d.pn)&&(d.ev||[]).forEach(e=>{ if(e.side!==c.side)return; const u=e.u||0, bn=!!(d.bn&&d.bn[c.side]);
    const off=typeof bbOff==="function"?bbOff(d,c.side,tm):null;   // review round: not the star while he sits
    if(e.k==="three"&&t3>0&&typeof bbPlayer==="function"){ named(bbPlayer(tm,typeof bbSlot==="function"?bbSlot(tm,"three",u):[1,2,0,1,2][u%5],u,bn,off),"tpm"); t3-- }
    if(e.k==="inside"&&t2>0&&typeof bbPlayer==="function"){ const nm=bbPlayer(tm,typeof bbSlot==="function"?bbSlot(tm,"inside",u):[4,3,4,2][u%4],u,bn,off); named(nm,"f2"); t2--; if(t1>0){ named(nm,"ft"); t1-- } } }));
  if(ENGINE_V>=26)return bbLines26(rng,c,M,O,L,sl,extra,at,line,t3,t2,t1);
  const bD={};   // the bench's share of each count (review round: it went to no one, so a backup's season line had only the points the play-by-play named him for)
  const share=(k,n)=>{ const sc=k==='tpm'||k==='pts2'||k==='pts1'; const w=sl.map(s=>(1-BENCH)*s.R[k]*(sc?Math.pow(s.star,ENGINE_V>=6&&LEAGUE.id==="ncaab"?BB_STARP6C:ENGINE_V>=5?BB_STARP5:BB_STARP4):s.star)*bbLean(s.x.pl,k)).concat([BENCH]); const d=splitDraw(rng,Math.max(0,n),w); sl.forEach((s,j)=>{ L[j][k==="pts2"?"f2":k==="pts1"?"ft":k]+=d[j] }); bD[k]=d[sl.length] };
  ROLE_FT(sl); share("tpm",t3); share("pts2",t2); share("pts1",t1);
  const oMiss=(O.fga2-O.fgm2)+(O.tpa-O.tpm), reb=Math.round(BB_REB*((M.oreb||0)+Math.max(0,oMiss-(O.oreb||0))));
  share("reb",reb); share("ast",Math.round(BB_AST*(M.fgm2+M.tpm))); share("stl",Math.round(BB_STL*(O.to||0))); share("blk",Math.round(BB_BLK*(O.fga2-O.fgm2)));
  benchLines(rng,c,bD,at,extra,line);
  const fin=l=>({pts:2*l.f2+3*l.tpm+l.ft,reb:l.reb,ast:l.ast,stl:l.stl,blk:l.blk,tpm:l.tpm});
  const out=sl.map((s,j)=>({pl:s.x.pl,pos:s.x.P,line:fin(L[j])}));
  Object.keys(extra).forEach(nm=>{ const x=at[nm]; out.push({pl:x.pl,pos:POS[x.i%POS.length].p,line:fin(extra[nm])}) });
  return out;
}
/* review round (playtest: a college center averaged 3.8 points and 0.0 rebounds over 30 games; a pro backup center the
   same): the bench's share of every count goes to the backups who played, by position and the same leans as the
   starters (a backup center takes the boards and blocks, a backup point guard the assists). A backup plays behind a
   healthy starter (a hurt starter's backup is on the floor, in the starters' lines); a hurt backup doesn't play. Every
   backup who played has a line, so his games are the games he played, not the ones he scored in. Lines only: these
   draws come after every other on the game's own line generator, so no result moves. */
function benchLines(rng,c,bD,at,extra,line){
  const onF=new Set(c.act.map(x=>x.pl)), hurt=new Set(c.sea&&c.sea.talent?c.sea.talent.active(c.tm).map(x=>x.idx):[]);
  const B=[]; POS.forEach((P,i)=>{ const p=c.R[BK(i)]; if(p&&p.n&&!hurt.has(BK(i))&&!onF.has(p)&&c.R[i]&&onF.has(c.R[i]))B.push({pl:p,R:ROLE[P.p]}) });
  if(!B.length)return;
  ["tpm","pts2","pts1","reb","ast","stl","blk"].forEach(k=>{ const n=bD[k]||0; if(!n)return; const rk=k==="pts2"||k==="pts1"?"pts":k;
    const d=splitDraw(rng,n,B.map(b=>b.R[rk]*bbLean(b.pl,k))); B.forEach((b,j)=>{ if(!d[j])return; const t=extra[b.pl.n]=extra[b.pl.n]||line(); t[k==="pts2"?"f2":k==="pts1"?"ft":k]+=d[j] }) });
  B.forEach(b=>{ if(at[b.pl.n])extra[b.pl.n]=extra[b.pl.n]||line() });
}
/* round 88 (engine 11): who takes the shares leans with his attributes: the shooters the threes, the finishers the
   buckets inside and the free throws, the rebounders the boards, the playmakers the assists, the perimeter stoppers the
   steals, the rim protectors the blocks. A lean of one league spread is BB_ATK more of the share (e^0.35, 1.4x). The
   team's totals are the engine's, so nothing here moves a result. */
const BB_ATK=0.35, BB_LEANK={tpm:"sht",pts2:"fin",pts1:"fin",reb:"reb",ast:"ply",stl:"pd",blk:"id"};
function bbLean(p,k){ if(ENGINE_V<11||typeof attrOf!=="function"||!p)return 1; const a=BB_LEANK[k], A=a&&attrOf(p); if(!A||A[a]==null)return 1;
  const x=Math.exp(BB_ATK*(A[a]-p.r)/(attrScale().s*ATTR_SPREAD));
  return ENGINE_V>=26?Math.max(1/BB_LEANMAX,Math.min(BB_LEANMAX,x)):x }   // engine 26: held to 1.4x either way (a 64-rated wing with Finishing 78 scored 45.9 a game)
/* engine 26: how well he shoots, from the same attribute (a tenth of the lean: a shooter makes more of his threes) */
function bbEff(p,k){ const l=bbLean(p,k); return Math.pow(l,0.3) }

/* ============ engine 26 (stats): a box score like the league's ============
   Every man who played has a line: minutes from the stretches (the starters about three quarters of each, the bench
   the rest; a decided game's last stretches to the bench and, fifteen deep, the end of the bench; a star sitting in
   foul trouble gives his minutes to his backup), and each count shared by minutes, position, rating and attributes,
   with no one taking more than BB_USE of a team's made shots of a kind. Misses go to the men who shot, by how well they
   shoot; turnovers to the ball handlers, fouls to the bigs (the star's own fouls as the game counted them), plus-minus
   from the score in the stretches he played. The team's totals are the engine's: nothing here moves a result. */
const _bbE=k=>typeof process!=="undefined"&&process.env&&process.env[k]?+process.env[k]:null;
const BB_LEANMAX=1.4, BB_USE=_bbE("BB_USE")||0.33, BB_START26=_bbE("BB_START")||0.67, BB_STAR26={nba:2.9,ncaab:2.3}, BB_EXP26={nba:0.8,ncaab:0.8};
const BB_PFW={PG:0.8,SG:0.9,SF:1.0,PF:1.25,C:1.45}, BB_FT26={PG:1.06,SG:1.05,SF:1.0,PF:0.94,C:0.88};
/* a man's appetite for shots, his own and kept all season (some good players are scorers, some aren't): his name's
   hash, a spread of BB_SCOR in the log of his share */
const BB_SCOR=_bbE("BB_SCOR")||0.35;
function bbScorer(p){ const h=strHash("sc|"+p.n), u1=((h>>>0)%10007+0.5)/10007, u2=(((h>>>0)/10007|0)%10009+0.5)/10009;
  return BB_SCOR*Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2) }
function bbLines26(rng,c,M,O,L,sl,extra,at,line,t3,t2,t1){
  const side=c.side, R=c.R, onF=new Set(c.act.map(x=>x.pl)), hurt=new Set(c.sea&&c.sea.talent?c.sea.talent.active(c.tm).map(x=>x.idx):[]);
  const pro=LEAGUE.id!=="ncaab", G0=pro?48:40, segs=c.drives.filter(d=>typeof d.seg==="number");
  const ot=segs.reduce((m,d)=>Math.max(m,d.ot||0),0), Gm=G0+5*ot;
  // the men: the five on the floor, a bench man at each spot, and (fifteen deep) the end of the bench
  const P=c.act.map((x,j)=>({pl:x.pl,pos:x.P,i:x.i,j:j,R:ROLE26[x.P],t:0}));
  POS.forEach((Q,i)=>{ const pool=[BK(i),BK(BK(i))].filter(k=>R[k]&&R[k].n&&!hurt.has(k)&&!onF.has(R[k]));
    pool.forEach((k,n)=>P.push({pl:R[k],pos:Q.p,i:i,j:-1,R:ROLE26[Q.p],t:n+1})) });
  // the better starters play more (a team's best about 36 minutes, its fifth starter about 30)
  const avgR=c.act.reduce((t,x)=>t+x.pl.r,0)/Math.max(1,c.act.length);
  const star=c.act.reduce((b,x)=>!b||x.pl.r>b.pl.r?x:b,null), starN=star?star.pl.n:null;
  // minutes and plus-minus, stretch by stretch: each spot's minutes come to the stretch's length
  const sgn=side==="home"?1:-1; let prev=null;
  P.forEach(x=>{ x.min=0; x.pm=0 });
  const play=(len,bench,starOff,delta)=>{ POS.forEach((Q,i)=>{ const at=P.filter(x=>x.i===i), s=at.find(x=>x.t===0), b=at.find(x=>x.t===1), e=at.find(x=>x.t===2);
      let fs=bench?0.2:(s?Math.max(0.6,Math.min(0.82,BB_START26+0.012*(s.pl.r-avgR))):BB_START26), fb=1-fs, fe=0; if(bench&&e){ fe=fb*0.35; fb-=fe }
      if(s&&starOff&&s.pl.n===starN){ fb+=fs; fs=0 }
      if(!b){ if(e){ fe+=fb; fb=0 } else { fs+=fb; fb=0 } } if(!e&&fe){ fb+=fe; fe=0 }
      [[s,fs],[b,fb],[e,fe]].forEach(([x,f])=>{ if(x){ x.min+=len*f; x.pm+=delta*f } }) }) };
  segs.forEach(d=>{ const len=d.seg<SEGS?G0/SEGS:5, bn=!!(d.bn&&d.bn[side]), so=!!(d.star&&d.star[side]&&(d.star[side][1]===false||d.star[side][2]));
    play(len,bn,so,sgn*((d.h||0)-(d.a||0))); prev=d });
  c.drives.forEach((d,k)=>{ if(d.seg!=="last")return; const before=c.drives.slice(0,k).reverse().find(x=>x.sh!==undefined); if(!before)return;
    const del=sgn*((d.sh-before.sh)-(d.sa-before.sa)); if(del)play(0,false,false,del) });
  const pw=BB_STAR26[LEAGUE.id]||2.4, starOf=pl=>Math.max(0.55,1+(pl.r-60)/20*BB_SLOPE26+rng.gauss(0,0.22));
  // a scorer's share grows with his rating by a constant factor a point (the best in the league take about a third of
  // their team's shots, a good team's second option a fifth)
  const ex=_bbE("BB_EXP")||BB_EXP26[LEAGUE.id]||1.9;
  P.forEach(x=>{ x.st=starOf(x.pl); x.sc=Math.exp(ex*(x.pl.r-60)/20+bbScorer(x.pl)+rng.gauss(0,0.3)); x.L=x.j>=0?L[x.j]:(extra[x.pl.n]=extra[x.pl.n]||line()) });
  const tot=P.reduce((t,x)=>t+x.min,0)||1;
  // a count shared by minutes, role, rating and lean; the scorers held to BB_USE of the kind each
  const share=(k,n,rk,sc)=>{ if(!(n>0))return; let w=P.map(x=>x.min/tot*x.R[rk]*(sc?x.sc:x.st)*Math.pow(bbLean(x.pl,rk),rk==="blk"||rk==="ast"?2:1));   // a rim protector's blocks and a point guard's assists lean twice
    if(sc){ for(let it=0;it<4;it++){ const T=w.reduce((a,b)=>a+b,0); if(!(T>0))break; const over=w.map(v=>v>BB_USE*T); if(!over.some(Boolean))break;
        const fixed=w.reduce((t,v,j)=>t+(over[j]?0:v),0), cap=BB_USE*fixed/(1-BB_USE*over.filter(Boolean).length); if(!(cap>0))break; w=w.map((v,j)=>over[j]?cap:v) } }
    // the men the run of play already named for some keep them: the whole count is shared, then made up to theirs
    const fl=P.map(x=>x.L[k]||0), N=n+fl.reduce((a,b)=>a+b,0), d=splitDraw(rng,N,w);
    let need=d.reduce((t,v,j)=>t+Math.max(0,fl[j]-v),0); const out=d.map((v,j)=>Math.max(v,fl[j]));
    while(need>0){ const ex=out.map((v,j)=>Math.max(0,v-fl[j])), T=ex.reduce((a,b)=>a+b,0); if(!(T>0))break; let u=rng.r()*T, j=0; while(j<ex.length-1&&u>=ex[j]){ u-=ex[j]; j++ } out[j]--; need-- }
    P.forEach((x,j)=>{ x.L[k]=out[j] }) };
  ROLE_FT(P);
  share("tpm",t3,"tpm",1); share("f2",t2,"pts2",1); share("ft",t1,"pts1",1);
  const oMiss=(O.fga2-O.fgm2)+(O.tpa-O.tpm);
  share("reb",Math.round(BB_REB*((M.oreb||0)+Math.max(0,oMiss-(O.oreb||0)))),"reb"); share("ast",Math.round(BB_AST*(M.fgm2+M.tpm)),"ast");
  share("stl",Math.round(BB_STL*(O.to||0)),"stl"); share("blk",Math.round(BB_BLK*(O.fga2-O.fgm2)),"blk");
  // the misses: to the men who shot, by how well they shoot (a man with no make still takes a shot or two)
  const miss=(mk,n,pT,ek,f)=>{ if(!(n>0))return; const w=P.map(x=>{ const p=Math.max(0.05,Math.min(0.97,pT*bbEff(x.pl,ek)*(f?f(x):1)));
      return (x.L[mk]+0.25*x.min/tot*5*(mk==="tpm"?x.R.tpm/0.25:1))*(1-p)/p });
    const d=splitDraw(rng,n,w); P.forEach((x,j)=>{ x["m"+mk]=d[j] }) };
  const pr=(m,a)=>a>0?m/a:0.5;
  miss("tpm",(M.tpa||0)-(M.tpm||0),pr(M.tpm,M.tpa),"tpm"); miss("f2",(M.fga2||0)-(M.fgm2||0),pr(M.fgm2,M.fga2),"pts2"); miss("ft",(M.fta||0)-(M.ftm||0),pr(M.ftm,M.fta),"pts1",x=>BB_FT26[x.pos]||1);
  // turnovers to the ball handlers; fouls to the bigs, the star's own as counted
  const tw=P.map(x=>x.min/tot*(0.55*x.R.ast+0.45*x.R.pts)*x.st/Math.sqrt(bbLean(x.pl,"ast")));
  const td=splitDraw(rng,Math.max(0,M.to||0),tw); P.forEach((x,j)=>{ x.to=td[j] });
  const fl=c.drives.filter(d=>d.fouls).slice(-1)[0], F=fl?fl.fouls[side]||0:0, ss=segs.slice(-1)[0], sF=ss&&ss.star&&ss.star[side]?ss.star[side][0]||0:0;
  const sx=P.find(x=>x.pl.n===starN), fw=P.map(x=>x===sx?0:x.min/tot*(BB_PFW[x.pos]||1)), fd=splitDraw(rng,Math.max(0,F-(sx?sF:0)),fw);
  const out=BB.foulOut||6; P.forEach((x,j)=>{ x.pf=x===sx?Math.min(out,sF):Math.min(out,fd[j]) });
  // whole minutes that come to the game's 240 (a man rounded on his own left a side at 237 or 243): the largest remainders
  // take the spare minutes
  P.forEach(x=>{ x.mi=Math.floor(x.min) }); let spare=Math.round(tot)-P.reduce((t,x)=>t+x.mi,0);
  P.map((x,j)=>j).sort((a,b)=>(P[b].min-P[b].mi)-(P[a].min-P[a].mi)||a-b).forEach(j=>{ if(spare>0){ P[j].mi++; spare-- } });
  const fin=x=>{ const l=x.L, fgm=l.f2+l.tpm; return {pts:2*l.f2+3*l.tpm+l.ft,reb:l.reb,ast:l.ast,stl:l.stl,blk:l.blk,tpm:l.tpm,
    min:x.mi,fgm:fgm,fga:fgm+(x.mf2||0)+(x.mtpm||0),tpa:l.tpm+(x.mtpm||0),ftm:l.ft,fta:l.ft+(x.mft||0),to:x.to||0,pf:x.pf||0,pm:Math.round(x.pm)} };
  const res=P.filter(x=>x.j>=0||x.mi>0||Object.keys(x.L).some(k=>x.L[k])).map(x=>({pl:x.pl,pos:x.pos,line:fin(x)}));
  // anyone the play-by-play named who isn't in the rotation above (a hurt man's line stays as it was named)
  const inP=new Set(P.map(x=>x.pl.n));
  Object.keys(extra).forEach(nm=>{ if(inP.has(nm)||!at[nm])return; const l=extra[nm], x=at[nm], fgm=l.f2+l.tpm;
    res.push({pl:x.pl,pos:POS[x.i%POS.length].p,line:{pts:2*l.f2+3*l.tpm+l.ft,reb:l.reb,ast:l.ast,stl:l.stl,blk:l.blk,tpm:l.tpm,min:0,fgm:fgm,fga:fgm,tpa:l.tpm,ftm:l.ft,fta:l.ft,to:0,pf:0,pm:0}}) });
  return res;
}
/* the shares of made twos and free throws: the scorers' share of points (pts2, pts1 read ROLE.pts) */
function ROLE_FT(sl){ sl.forEach(s=>{ if(s.R.pts2===undefined){ s.R=Object.assign({},s.R,{pts2:s.R.pts,pts1:s.R.pts}) } }) }
function addStats(dst,src){dst.g=(dst.g||0)+1; Object.keys(src).forEach(k=>dst[k]=(dst[k]||0)+src[k])}
/* season line, per game */
function statLine(pos,s){
  if(!s||!s.g)return "";
  const pg=k=>((s[k]||0)/s.g).toFixed(1);
  if(pos==="PG")return `${pg("pts")} ppg, ${pg("ast")} apg, ${pg("reb")} rpg`;
  if(pos==="PF"||pos==="C")return `${pg("pts")} ppg, ${pg("reb")} rpg, ${pg("blk")} bpg`;
  return `${pg("pts")} ppg, ${pg("reb")} rpg, ${pg("tpm")} 3pm`;
}
/* award production, built from what a player actually did */
function statProd(pos,s){
  if(!s||!s.g)return 0;
  // a rebound or a block counts nearly as much as an assist: bigs win awards too
  return s.pts*0.9+s.reb*1.05+s.ast*0.95+s.stl*1.8+s.blk*2.0;
}

/* ---- stats pages (round 69): column labels and the league's leader boards (per game, at least a third of the games) ---- */
const STAT_ABBR={pts:"Pts",reb:"Reb",ast:"Ast",stl:"Stl",blk:"Blk",tpm:"3PM",min:"Min",fgm:"FGM",fga:"FGA",tpa:"3PA",ftm:"FTM",fta:"FTA",to:"TO",pf:"PF",pm:"+/-"};
const STAT_FMT={pm:v=>(v>0?"+":"")+Math.round(v)};
const PERG=k=>({v:s=>s.g?(s[k]||0)/s.g:0,f:v=>v.toFixed(1),min:(s,G)=>s.g>=Math.max(1,G/3)});
const LEADERS=[Object.assign({l:"Points per game"},PERG("pts")),Object.assign({l:"Rebounds per game"},PERG("reb")),Object.assign({l:"Assists per game"},PERG("ast")),
  Object.assign({l:"Steals per game"},PERG("stl")),Object.assign({l:"Blocks per game"},PERG("blk")),{l:"Three-pointers made",v:s=>s.tpm||0},
  // engine 26: the shooting percentages, on the league's minimums a game (the NBA's 300 field goals, 82 threes and 125
  // free throws in 82 games) and the minutes
  Object.assign({l:"Minutes per game"},PERG("min"),{min:(s,G)=>s.g>=Math.max(1,G/3)&&s.min>0}),
  {l:"Field goal %",v:s=>s.fga?s.fgm/s.fga:0,f:v=>(100*v).toFixed(1),min:(s,G)=>s.fga>0&&s.fgm>=3.66*G},
  {l:"Three-point %",v:s=>s.tpa?s.tpm/s.tpa:0,f:v=>(100*v).toFixed(1),min:(s,G)=>s.tpa>0&&s.tpm>=1*G},
  {l:"Free throw %",v:s=>s.fta?s.ftm/s.fta:0,f:v=>(100*v).toFixed(1),min:(s,G)=>s.fta>0&&s.ftm>=1.52*G}];

/* round 87: attributes (core 93_attrs): guards, wings and bigs weigh them differently. Round 88 (engine 11) plays
   them: the team's shape on the floor in each possession (50_game BB11), and who takes the shares in the box. */
const ATTRS={
  name:{sht:"Shooting",fin:"Finishing",ply:"Playmaking",reb:"Rebounding",pd:"Perimeter D",id:"Interior D",ath:"Athleticism",sta:"Stamina"},
  desc:{sht:"threes and mid-range",fin:"at the rim",ply:"assists, fewer turnovers",reb:"both glasses",pd:"guarding the ball",id:"protecting the rim",
    ath:"speed and lift",sta:"minutes before he tires"},
  band:{sht:"t",fin:"t",ply:"m",reb:"t",pd:"m",id:"m",ath:"p",sta:"p"},
  group:p=>/^(PG|SG)$/.test(p)?"G":p==="SF"?"W":"B",
  w:{G:{sht:.22,fin:.12,ply:.22,reb:.04,pd:.16,id:.02,ath:.14,sta:.08}, W:{sht:.18,fin:.15,ply:.12,reb:.1,pd:.14,id:.07,ath:.16,sta:.08},
     B:{sht:.08,fin:.2,ply:.06,reb:.22,pd:.05,id:.2,ath:.13,sta:.06}},
  lean:{},
  role:{sht:"Shooter",fin:"Slasher",ply:"Playmaker",reb:"Glass cleaner",pd:"Perimeter stopper",id:"Rim protector",ath:"Athlete",sta:"Motor"},
  roleBy:{B:{sht:"Stretch big",ply:"Playmaking big"}, G:{ply:"Floor general"}},
  plays:()=>ENGINE_V>=11,
  train:{Guards:{groups:["G"],keys:["sht","fin","ply","pd","ath"]}, Wings:{groups:["W"],keys:["sht","fin","ply","reb","pd","ath"]}, Bigs:{groups:["B"],keys:["fin","reb","id","sht","ath"]}}
};
