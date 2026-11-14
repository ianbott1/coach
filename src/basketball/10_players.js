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
  return -P.w*((1-BENCH)*gap+BENCH*6)*R_SLOPE;
}

/* ============ box scores ============ */
const STAT_KEYS={PG:["pts","reb","ast","stl","blk","tpm"],SG:["pts","reb","ast","stl","blk","tpm"],
  SF:["pts","reb","ast","stl","blk","tpm"],PF:["pts","reb","ast","stl","blk","tpm"],C:["pts","reb","ast","stl","blk","tpm"]};
function blankStats(pos){const o={g:0}; (STAT_KEYS[pos]||[]).forEach(k=>o[k]=0); return o}
/* how a position's production splits: share of the starters' points,
   rebounds, assists, steals, blocks, and threes */
const ROLE={PG:{pts:0.22,reb:0.12,ast:0.40,stl:0.30,blk:0.05,tpm:0.28},
            SG:{pts:0.25,reb:0.14,ast:0.20,stl:0.25,blk:0.07,tpm:0.34},
            SF:{pts:0.22,reb:0.19,ast:0.16,stl:0.20,blk:0.13,tpm:0.24},
            PF:{pts:0.17,reb:0.25,ast:0.13,stl:0.14,blk:0.30,tpm:0.10},
            C: {pts:0.14,reb:0.30,ast:0.11,stl:0.11,blk:0.45,tpm:0.04}};
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
const BB_AST=0.60, BB_STL=0.52, BB_BLK=0.18, BB_REB=0.9, BB_STARP=1.6;   // a star's share of the scoring grows faster than his rating (1.6)
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
  c.drives.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.side!==c.side)return; const u=e.u||0;
    if(e.k==="three"&&t3>0&&typeof bbPlayer==="function"){ named(bbPlayer(tm,[1,2,0,1,2][u%5],u),"tpm"); t3-- }
    if(e.k==="inside"&&t2>0&&typeof bbPlayer==="function"){ const nm=bbPlayer(tm,[4,3,4,2][u%4],u); named(nm,"f2"); t2--; if(t1>0){ named(nm,"ft"); t1-- } } }));
  const share=(k,n)=>{ const sc=k==='tpm'||k==='pts2'||k==='pts1'; const w=sl.map(s=>(1-BENCH)*s.R[k]*(sc?Math.pow(s.star,BB_STARP):s.star)).concat([BENCH]); const d=splitDraw(rng,Math.max(0,n),w); sl.forEach((s,j)=>{ L[j][k==="pts2"?"f2":k==="pts1"?"ft":k]+=d[j] }) };
  ROLE_FT(sl); share("tpm",t3); share("pts2",t2); share("pts1",t1);
  const oMiss=(O.fga2-O.fgm2)+(O.tpa-O.tpm), reb=Math.round(BB_REB*((M.oreb||0)+Math.max(0,oMiss-(O.oreb||0))));
  share("reb",reb); share("ast",Math.round(BB_AST*(M.fgm2+M.tpm))); share("stl",Math.round(BB_STL*(O.to||0))); share("blk",Math.round(BB_BLK*(O.fga2-O.fgm2)));
  const fin=l=>({pts:2*l.f2+3*l.tpm+l.ft,reb:l.reb,ast:l.ast,stl:l.stl,blk:l.blk,tpm:l.tpm});
  const out=sl.map((s,j)=>({pl:s.x.pl,pos:s.x.P,line:fin(L[j])}));
  Object.keys(extra).forEach(nm=>{ const x=at[nm]; out.push({pl:x.pl,pos:POS[x.i%POS.length].p,line:fin(extra[nm])}) });
  return out;
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
const STAT_ABBR={pts:"Pts",reb:"Reb",ast:"Ast",stl:"Stl",blk:"Blk",tpm:"3PM"};
const PERG=k=>({v:s=>s.g?(s[k]||0)/s.g:0,f:v=>v.toFixed(1),min:(s,G)=>s.g>=Math.max(1,G/3)});
const LEADERS=[Object.assign({l:"Points per game"},PERG("pts")),Object.assign({l:"Rebounds per game"},PERG("reb")),Object.assign({l:"Assists per game"},PERG("ast")),
  Object.assign({l:"Steals per game"},PERG("stl")),Object.assign({l:"Blocks per game"},PERG("blk")),{l:"Three-pointers made",v:s=>s.tpm||0}];
