/* ============ players: baseball ============ */
/* Thirteen places and a player behind each: the nine in the lineup (the
   designated hitter among them), three starting pitchers and the closer. The
   player behind a starting pitcher is the fourth or fifth starter (they take
   about two starts in five); behind a hitter, the bench; behind the closer,
   the setup man. Team strength comes from them, the rotation most of all. */

const PNAMES_F=["Marcus","Jalen","Trevor","DeAndre","Caleb","Xavier","Bryce","Amari","Cooper",
"Isaiah","Rashaun","Tanner","Malik","Grayson","Devonte","Hunter","Elijah","Josiah","Keenan","Dontae",
"Landon","Zaire","Kyler","Omari","Tre","Nico","Quinn","Deshaun","Cade","Tyrese","Micah","Damari",
"Kobe","Silas","Emory","Kade","Anwar","Diego","Kamari","Jamir","Ezra","Khalil","Yandel","Makai",
"Jaylen","Tariq","Darius","Rafael","Luis","Yoshi","Andres","Wilmer","Terrence","Armando","Otis"];
const PNAMES_L=["Whitfield","Okonkwo","Barrera","Sanders","Colquitt","Adeyemi","Reyes","Traylor",
"Mbeki","Vandenberg","Hollis","Guillory","Achebe","Kirkpatrick","Solano","Nwosu","Bettencourt",
"Ratliff","Delacroix","Ivory","Sinclair","Ogunleye","Castillo","Thibodeaux","Marchetti","Ude",
"Espinoza","Vann","Duckworth","Asante","Rios","Pettigrew","Oyelaran","Steadman","Cifuentes","Igwe",
"Balogun","Tremblay","Lindqvist","Kovalenko","Bergeron","Pujols","Duchene","Karlsson","Norwood","Mensah","Quintero","Ashworth","Diallo","Buchanan","Lefevre","Odom",
"Kponeh","Vasquez","Randle","Diabate","Petrovic","Arroyo","Sissoko","Harlan","Ellsworth"];

/* position, share of team strength, backup dropoff, share of injuries, and how much the man behind plays */
const POS=[
  {p:"C",  w:0.055, drop:8,  hz:0.08, bench:0.2},
  {p:"1B", w:0.055, drop:8,  hz:0.06, bench:0.12},
  {p:"2B", w:0.055, drop:8,  hz:0.07, bench:0.12},
  {p:"3B", w:0.055, drop:8,  hz:0.07, bench:0.12},
  {p:"SS", w:0.06,  drop:8,  hz:0.07, bench:0.12},
  {p:"LF", w:0.05,  drop:8,  hz:0.06, bench:0.12},
  {p:"CF", w:0.06,  drop:8,  hz:0.07, bench:0.12},
  {p:"RF", w:0.055, drop:8,  hz:0.06, bench:0.12},
  {p:"DH", w:0.05,  drop:7,  hz:0.04, bench:0.15},
  {p:"SP", w:0.15,  drop:12, hz:0.12, bench:0.4},
  {p:"SP2",w:0.13,  drop:10, hz:0.11, bench:0.4},
  {p:"SP3",w:0.12,  drop:9,  hz:0.11, bench:0.4},
  {p:"CL", w:0.07,  drop:8,  hz:0.08, bench:0.45},
];
const BS_HIT=[0,1,2,3,4,5,6,7,8], BS_SP=[9,10,11], BS_CL=12;
const BENCH=0.2;
function pickInjuredPos(rng){
  let x=rng.r(), acc=0;
  for(let i=0;i<POS.length;i++){acc+=POS[i].hz; if(x<acc)return i}
  return POS.length-1;
}
const R_SLOPE=24.3, R_INT=56;
const ratingToElo=r=>R_INT+R_SLOPE*r;
const eloToRating=e=>(e-R_INT)/R_SLOPE;
function playerName(rng){ const f=rng.pick(PNAMES_F), l=rng.pick(PNAMES_L); return f+" "+wideLast(f,l,PNAMES_L) }   // the same two draws; the surname read through a wider list (core 21_names)
const BK=i=>i+POS.length;
function teamRating(roster){
  let s=0;
  POS.forEach((P,i)=>{const st=roster[i], bk=roster[BK(i)]||st;
    s+=P.w*((1-P.bench)*st.r+P.bench*bk.r)});
  return s;
}
function rosterElo(roster){return ratingToElo(teamRating(roster))}
function injuryCost(roster,idx){
  const P=POS[idx];
  if(!roster||!roster[BK(idx)])return -P.w*P.drop*R_SLOPE;
  const gap=Math.max(3,roster[idx].r-roster[BK(idx)].r);
  return -P.w*((1-P.bench)*gap+P.bench*6)*R_SLOPE;
}
function blankTeamLine(){return {h:0,hr:0,bb:0,k:0,lob:0,e:0}}

/* ============ box scores ============ */
const HIT_KEYS=["ab","h","hr","rbi","r","bb","sb"], PIT_KEYS=["gs","ip","er","k","bb","w","l","sv"];
const STAT_KEYS={C:HIT_KEYS,"1B":HIT_KEYS,"2B":HIT_KEYS,"3B":HIT_KEYS,SS:HIT_KEYS,LF:HIT_KEYS,CF:HIT_KEYS,RF:HIT_KEYS,DH:HIT_KEYS,
  SP:PIT_KEYS,SP2:PIT_KEYS,SP3:PIT_KEYS,CL:PIT_KEYS};
function blankStats(pos){const o={g:0}; (STAT_KEYS[pos]||[]).forEach(k=>o[k]=0); return o}
const isPitcher=p=>p==="SP"||p==="SP2"||p==="SP3"||p==="CL";
/* one game's line, consistent with his rating and the score: a hitter's at-bats and hits; a starter's line on the days
   he starts (about one in five), the closer's on the days he closes. Innings are kept in thirds (ip: outs). */
function gameStats(rng,pl,posIdx,forPts,oppPts,won){
  const P=POS[posIdx].p, q=(pl.r-60)/20;
  if(P==="CL"){ if(won&&forPts-oppPts<=3&&rng.r()<0.55)return {sv:1,ip:3,er:0,k:rng.r()<0.6?1+rng.int(2):0,bb:rng.r()<0.3?1:0};
    if(rng.r()<0.25)return {ip:3,er:rng.r()<0.25?1:0,k:rng.int(3),bb:rng.r()<0.3?1:0}; return {} }
  if(isPitcher(P)){ if(rng.r()>0.2)return {};
    const outs=Math.max(6,Math.min(24,Math.round(rng.gauss(16.5+q*3,3.5)))), er=Math.min(oppPts,Math.max(0,Math.round(oppPts*outs/27*(1-q*0.15)+rng.gauss(0,0.7))));
    return {gs:1,ip:outs,er:er,k:Math.max(0,Math.round(rng.gauss(outs*0.33*(1+q*0.25),1.6))),bb:Math.max(0,Math.round(rng.gauss(outs*0.1,1))),
      w:won&&outs>=15&&rng.r()<0.7?1:0,l:!won&&er>=2&&rng.r()<0.6?1:0} }
  const first=1-POS[posIdx].bench; if(rng.r()>first)return {};
  const ab=3+(rng.r()<0.55?1:0)+(forPts>=7&&rng.r()<0.5?1:0), p=Math.min(0.42,Math.max(0.15,0.245+q*0.035+(forPts-4.4)*0.012));
  let h=0; for(let i=0;i<ab;i++)if(rng.r()<p)h++;
  const hr=h&&rng.r()<0.14+q*0.05?1:0, rbi=Math.min(forPts,Math.max(0,Math.round(forPts/9+hr+(h?rng.gauss(0.2,0.5):0)))), r=Math.min(forPts,Math.max(hr,Math.round(forPts/9+rng.gauss(0,0.5))));
  return {ab:ab,h:h,hr:hr,rbi:rbi,r:r,bb:rng.r()<0.32?1:0,sb:rng.r()<0.03?1:0};
}
function addStats(dst,src){dst.g=(dst.g||0)+1; Object.keys(src).forEach(k=>dst[k]=(dst[k]||0)+src[k])}
const ipStr=outs=>Math.floor(outs/3)+(outs%3?"."+(outs%3):"");
/* a season line */
function statLine(pos,s){
  if(!s||!s.g)return "";
  if(pos==="CL"){ const era=s.ip?(s.er*27/s.ip):0; return `${nOf(s.sv||0,"save")}, ${era.toFixed(2)} ERA, ${s.k||0} K` }
  if(isPitcher(pos)){ if(!s.gs)return ""; const era=s.ip?(s.er*27/s.ip):0; return `${s.w||0}-${s.l||0}, ${era.toFixed(2)} ERA, ${s.k||0} K in ${ipStr(s.ip||0)} IP` }
  const avg=s.ab?(s.h/s.ab):0; return `${avg.toFixed(3).replace(/^0/,"")}, ${nOf(s.hr||0,"home run")}, ${s.rbi||0} RBI`;
}
/* award production, from what a player actually did */
function statProd(pos,s){
  if(!s||!s.g)return 0;
  if(pos==="CL")return (s.sv||0)*1.2+Math.max(0,(4-(s.ip?s.er*27/s.ip:4)))*8;
  if(isPitcher(pos)){ if(!s.ip)return 0; const era=s.er*27/s.ip; return Math.max(0,(5-era))*s.ip/27*6+(s.w||0)*2+(s.k||0)*0.08 }
  const avg=s.ab?s.h/s.ab:0; return (s.hr||0)*2.2+(s.rbi||0)*0.5+(s.r||0)*0.4+Math.max(0,avg-0.22)*s.ab*0.9;
}

/* (round 77, engine 6: the named relievers have lines of their own, no start; B.sp names the starter) */
/* round 74 (engV 4): a team's lines are the game's own box score (50_game counts it at bat by bat): every hit, run, RBI
   and home run to the man who had it, the starter's innings and runs, the closer's. A man who didn't play gets no line. */
function teamLines(rng,c){
  const last=c.drives[c.drives.length-1], B=last&&last.box&&last.box[c.side];
  if(!B)return statLinesOld(rng,c);
  const at={}; c.R.forEach((p,i)=>{ if(p&&p.n&&!at[p.n])at[p.n]={pl:p,i:i} });
  const posOf=i=>POS[i%POS.length].p, out=[];
  Object.keys(B.bat).forEach(nm=>{ const x=at[nm], b=B.bat[nm]; if(!x)return; const pos=posOf(x.i); if(isPitcher(pos))return;
    out.push({pl:x.pl,pos:pos,line:{ab:b.ab,h:b.h,hr:b.hr,rbi:b.rbi,r:b.r,bb:b.bb,sb:b.sb}}) });
  const cl=POS.findIndex(P=>P.p==="CL"), clAct=c.act.find(x=>x.i===cl), dec=B.dec||{};
  Object.keys(B.pit).forEach(nm=>{ if(nm==="bullpen")return; const p=B.pit[nm], x=nm==="closer"?(clAct?{pl:clAct.pl,i:cl}:null):at[nm]; if(!x)return;
    const pos=nm==="closer"?"CL":posOf(x.i); if(!isPitcher(pos))return;
    out.push({pl:x.pl,pos:pos,line:{gs:nm==="closer"?0:B.sp?(nm===B.sp?1:0):1,ip:p.outs,er:p.er,k:p.k,bb:p.bb,w:dec.w===nm?1:0,l:dec.l===nm?1:0,sv:dec.sv===nm?1:0}}) });
  return out;
}
/* a watched game's log, by hitter (round 56): home runs, RBI and hits for the men it named (core 80_season credits them) */
function bsLogCredit(team,side,drives){
  const out={}; (drives||[]).forEach(d=>(d.ev||[]).forEach(e=>{ if(e.side!==side||!e.nm)return;
    if(e.k!=="hr"&&e.k!=="rbi")return; const c=out[e.nm]=out[e.nm]||{hr:0,rbi:0,h:0};
    if(e.k==="hr"){ c.hr++; c.h++; c.rbi+=e.n||1 } else { c.rbi+=e.n||1; if(e.hit>0)c.h++ } }));
  return out;
}

/* ---- stats pages (round 69): column labels and the league's leader boards (averages need 3.1 at-bats or an inning a game) ---- */
const STAT_ABBR={ab:"AB",h:"H",hr:"HR",rbi:"RBI",r:"R",bb:"BB",sb:"SB",gs:"GS",ip:"IP",er:"ER",k:"K",w:"W",l:"L",sv:"SV"};
const HITTERS=["C","1B","2B","3B","SS","LF","CF","RF","DH"], STARTERS=["SP","SP2","SP3"];
const LEADERS=[
  {l:"Batting average",pos:HITTERS,v:s=>s.ab?s.h/s.ab:0,f:v=>v.toFixed(3).replace(/^0/,""),min:(s,G)=>s.ab>=3.1*Math.max(1,G)},
  {l:"Home runs",pos:HITTERS,v:s=>s.hr||0},{l:"Runs batted in",pos:HITTERS,v:s=>s.rbi||0},{l:"Hits",pos:HITTERS,v:s=>s.h||0},{l:"Stolen bases",pos:HITTERS,v:s=>s.sb||0},
  {l:"Earned run average",pos:STARTERS.concat(["CL"]),v:s=>s.ip?s.er*27/s.ip:99,f:v=>v.toFixed(2),low:true,min:(s,G)=>s.ip>=3*Math.max(1,G)},
  {l:"Wins",pos:STARTERS,v:s=>s.w||0},{l:"Strikeouts",pos:STARTERS.concat(["CL"]),v:s=>s.k||0},{l:"Saves",pos:["CL"],v:s=>s.sv||0}];
const STAT_FMT={ip:ipStr};
function STAT_EXTRA(pos){ return isPitcher(pos)?[["ERA",s=>s.ip?(s.er*27/s.ip).toFixed(2):"-"]]:[["AVG",s=>s.ab?(s.h/s.ab).toFixed(3).replace(/^0/,""):"-"]] }

/* round 87: attributes (core 93_attrs). Hitters and pitchers have their own; every pitcher weighs alike, so a job
   traded on the staff (swapRoles) changes nothing about him. Engine 10 plays them (50_game: the hitter's line, the
   pitcher's strikeouts and walks, his stamina, the steal). */
const ATTRS={
  name:{con:"Contact",pow:"Power",eye:"Eye",spd:"Speed",fld:"Fielding",arm:"Arm",stf:"Stuff",ctl:"Control",sta:"Stamina"},
  desc:{con:"singles, and fewer strikeouts",pow:"home runs and doubles",eye:"walks, and fewer strikeouts",spd:"steals and taking the extra base",
    fld:"outs on balls in play",arm:"throwing out base stealers",stf:"strikeouts",ctl:"fewer walks",sta:"batters faced before he tires"},
  band:{con:"t",pow:"t",eye:"m",spd:"p",fld:"t",arm:"p",stf:"p",ctl:"m",sta:"p"},
  group:p=>/^(SP|CL)/.test(p)?"P":p==="C"?"C":p==="DH"?"DH":/^(LF|CF|RF)$/.test(p)?"OF":"IF",
  /* weights by run value (round 87), measured on the engine's own dice (one attribute up three points, nothing taken
     away, nine hitters or one starter, 10,000 games: scratch marg.js): a point of Power is worth 0.42 of a hitter's
     edge, Contact 0.28, Eye 0.25, Fielding 0.045, Speed next to nothing (a steal is a step: few points cross one); a
     point of Stuff 0.47 of a pitcher's, Control 0.42, Stamina 0.11 (the average of a point up and a point down:
     a walk too many costs more than one saved gains). So the rating, which the trade screens, free agency
     and the chance to win all read, is worth the same however a player leans (test/attrs-bs.js). A catcher's Arm, like
     Speed, is a step in the steal: priced as little. */
  w:{C:{con:.27,pow:.40,eye:.24,spd:.01,fld:.04,arm:.04}, IF:{con:.277,pow:.416,eye:.252,spd:.01,fld:.045},
     OF:{con:.277,pow:.416,eye:.252,spd:.01,fld:.045}, DH:{con:.29,pow:.44,eye:.27}, P:{stf:.47,ctl:.42,sta:.11}},
  lean:{C:{spd:-6}, IF:{}, OF:{spd:3}, DH:{}, P:{}},
  role:{con:"Contact hitter",pow:"Power bat",eye:"Patient hitter",spd:"Speedster",fld:"Glove first",arm:"Cannon arm",
    stf:"Power arm",ctl:"Control artist",sta:"Workhorse"},
  roleBy:{C:{fld:"Defensive catcher",arm:"Defensive catcher"}},
  allRound:{P:"Steady arm"},
  plays:()=>ENGINE_V>=10,
  train:{Hitters:{groups:["C","IF","OF","DH"],keys:["con","pow","eye","spd","fld"]}, Pitchers:{groups:["P"],keys:["stf","ctl","sta"]}}
};
