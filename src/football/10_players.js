
/* ============ players ============ */
/* A star core of ten rated starters per program. Team strength is DERIVED from
   these ratings rather than floating free, so injuries, graduation and recruiting
   all move the needle through actual people. */

const PNAMES_F=["Marcus","Jalen","Trevor","DeAndre","Caleb","Xavier","Bryce","Amari",
"Cooper","Isaiah","Rashaun","Tanner","Malik","Grayson","Devonte","Hunter","Elijah",
"Braxton","Josiah","Keenan","Dontae","Landon","Zaire","Kyler","Rocco","Jaxon","Omari",
"Tre","Bo","Nico","Quinn","Deshaun","Cade","Ronan","Tyreek","Micah","Damari","Jett",
"Kobe","Silas","Emory","Roman","Kade","Anwar","Diego","Kamari","Beau","Jamir","Tomas",
"Ezra","Khalil","Brock","Nnamdi","Sione","Tua","Leilani","Makai","Dax","Colt","Rhett"];
const PNAMES_L=["Whitfield","Okonkwo","Barrera","Sanders","Colquitt","Adeyemi","Reyes",
"Traylor","Mbeki","Vandenberg","Hollis","Guillory","Achebe","Kirkpatrick","Solano",
"Nwosu","Bettencourt","Ratliff","Fuamatu","Delacroix","Ivory","Sinclair","Ogunleye",
"Castillo","Thibodeaux","Marchetti","Ude","Bramlett","Espinoza","Kealoha","Vann",
"Duckworth","Asante","Rios","Pettigrew","Oyelaran","Steadman","Cifuentes","Igwe",
"Balogun","Tremblay","Norwood","Sarkisian","Faletau","Mensah","Quintero","Ashworth",
"Diallo","Buchanan","Lefevre","Odom","Tagovailoa","Kponeh","Vasquez","Randle"];

/* position, share of team strength, backup dropoff */
/* hz = share of injuries that land on this spot */
const POS=[
  {p:"QB",  w:0.27, drop:21, hz:0.14},
  {p:"RB",  w:0.07, drop:10, hz:0.13},
  {p:"WR",  w:0.09, drop:11, hz:0.11},
  {p:"WR2", w:0.06, drop:9,  hz:0.09},
  {p:"OT",  w:0.12, drop:12, hz:0.13},
  {p:"EDGE",w:0.11, drop:13, hz:0.10},
  {p:"DT",  w:0.08, drop:10, hz:0.09},
  {p:"LB",  w:0.08, drop:10, hz:0.08},
  {p:"CB",  w:0.07, drop:11, hz:0.08},
  {p:"S",   w:0.05, drop:9,  hz:0.05},
];
function pickInjuredPos(rng){
  let x=rng.r(), acc=0;
  for(let i=0;i<POS.length;i++){acc+=POS[i].hz; if(x<acc)return i}
  return POS.length-1;
}

/* rating <-> Elo: teamRating 45 -> 1150, 82 -> 2050 */
const R_SLOPE=24.3, R_INT=56;
const ratingToElo=r=>R_INT+R_SLOPE*r;
const eloToRating=e=>(e-R_INT)/R_SLOPE;

function playerName(rng){ const f=rng.pick(PNAMES_F), l=rng.pick(PNAMES_L); return f+" "+wideLast(f,l,PNAMES_L) }   // the same two draws; the surname read through a wider list (core 21_names)

/* Twenty players: indices 0-9 start, 10-19 are the backup at the same spot. */
const BK=i=>i+POS.length;

function teamRating(roster){
  let s=0; POS.forEach((P,i)=>{s+=P.w*roster[i].r});
  return s;                                 // starters only
}
function rosterElo(roster){return ratingToElo(teamRating(roster))}

/* Elo cost of losing a starter: the actual drop-off to his backup. */
function injuryCost(roster,idx){
  const P=POS[idx];
  if(!roster||!roster[BK(idx)])return -P.w*P.drop*R_SLOPE;
  const gap=Math.max(3,roster[idx].r-roster[BK(idx)].r);
  return -P.w*gap*R_SLOPE;
}

/* ============ box scores ============ */
/* Stat lines are derived from rating, game flow and scoring, so the numbers a
   player puts up are consistent with how good he is and how the game went. */

const STAT_KEYS={
  QB  :["cmp","att","pyd","ptd","int"],
  RB  :["car","ryd","rtd"],
  WR  :["rec","cyd","ctd"],
  WR2 :["rec","cyd","ctd"],
  OT  :["pan","ska"],
  EDGE:["tkl","sck","tfl"],
  DT  :["tkl","sck","tfl"],
  LB  :["tkl","tfl","pd"],
  CB  :["tkl","pd","ints"],
  S   :["tkl","pd","ints"]
};

function blankStats(pos){
  const o={g:0};
  (STAT_KEYS[pos]||[]).forEach(k=>o[k]=0);
  return o;
}

/* One game's production for one starter. */
function gameStats(rng,pl,posIdx,forPts,oppPts,won){
  const pos=POS[posIdx].p;
  const q=(pl.r-58)/22;                 // roughly -1.3 (poor) .. +1.8 (elite)
  const s={};
  const R=(a,b)=>a+rng.r()*(b-a);
  const pass=forPts*0.60, run=forPts*0.40;

  if(pos==="QB"){
    s.att=Math.max(8,Math.round(R(24,38)+(won?-2:4)));
    const pct=Math.max(0.38,Math.min(0.78,0.545+q*0.055+rng.gauss(0,0.05)));
    s.cmp=Math.round(s.att*pct);
    s.pyd=Math.max(0,Math.round(s.cmp*(10.4+q*1.5+rng.gauss(0,1.4))));
    s.ptd=Math.max(0,Math.round(pass/7*R(0.55,1.0)+ (q>1?rng.r():0)));
    s.int=Math.max(0,Math.round(R(0,1.9)-q*0.55+(won?-0.2:0.35)));
  } else if(pos==="RB"){
    s.car=Math.max(4,Math.round(R(13,23)+(won?4:-3)));
    s.ryd=Math.max(-5,Math.round(s.car*(3.9+q*0.85+rng.gauss(0,0.9))));
    s.rtd=Math.max(0,Math.round(run/7*R(0.45,0.95)));
  } else if(pos==="WR"||pos==="WR2"){
    const share=pos==="WR"?R(0.26,0.38):R(0.15,0.24);
    s.rec=Math.max(0,Math.round(R(3,9)*(0.8+q*0.22)));
    s.cyd=Math.max(0,Math.round(s.rec*(12.8+q*2.4+rng.gauss(0,2))));
    s.ctd=Math.max(0,Math.round(pass/7*share*R(0.8,1.6)));
  } else if(pos==="OT"){
    s.pan=Math.max(0,Math.round(R(2,7)+q*2));
    s.ska=Math.max(0,Math.round(R(0,2.2)-q*0.6));
  } else if(pos==="EDGE"){
    s.tkl=Math.max(0,Math.round(R(2,5.5)+q*0.7));
    s.sck=(rng.r()<0.34+q*0.15?1:0)+(rng.r()<0.09+q*0.06?1:0);
    s.tfl=s.sck+(rng.r()<0.30+q*0.12?1:0);
  } else if(pos==="DT"){
    s.tkl=Math.max(0,Math.round(R(2,5)+q*0.6));
    s.sck=(rng.r()<0.20+q*0.09?1:0);
    s.tfl=s.sck+(rng.r()<0.24+q*0.10?1:0);
  } else if(pos==="LB"){
    s.tkl=Math.max(1,Math.round(R(5,11)+q*1.3));
    s.tfl=(rng.r()<0.42+q*0.15?1:0)+(rng.r()<0.10+q*0.05?1:0);
    s.pd=(rng.r()<0.28+q*0.09?1:0);
  } else {                                   // CB, S
    s.tkl=Math.max(0,Math.round(R(2,6)+q*0.6));
    s.pd=(rng.r()<0.42+q*0.14?1:0)+(rng.r()<0.14+q*0.07?1:0);
    s.ints=(rng.r()<0.155+q*0.055?1:0);
  }
  return s;
}

/* round 74 (engV 4): a team's lines from the game's own record. The touchdowns and interceptions are the play-by-play's
   (driveScript): the passer and the receiver it names for a touchdown pass, the runner for a run, the defender for a
   pick, and the game's own turnovers for the quarterback's interceptions. The receivers' catches and yards are a split
   of the quarterback's completions and yards (the rest to receivers the roster doesn't carry), so they never come to
   more. The rest of a line (attempts, carries, tackles) is drawn as before, from the player's rating. */
function teamLines(rng,c){
  const home=c.side==="home", g={home:c.home,away:c.away,hp:home?c.pf:c.pa,ap:home?c.pa:c.pf};
  const slot={}; c.act.forEach(x=>slot[x.i]=x);
  // the names the log will use: whoever played (an injured starter's backup)
  c.drives.forEach(d=>{ d.by=d.by||{}; if(d.home===home){ [0,1,2,3].forEach(i=>{ if(slot[i])d.by[i]=slot[i].pl.n }); [BK(2),BK(3)].forEach(i=>{ const p=c.R[i]; if(p&&!c.act.some(x=>x.pl===p))d.by[i]=p.n }) } else { [7,8,9].forEach(i=>{ if(slot[i])d.by["d"+i]=slot[i].pl.n }); [BK(8),BK(9)].forEach(i=>{ const p=c.R[i]; if(p&&!c.act.some(x=>x.pl===p))d.by["d"+i]=p.n }) } });
  const rows=typeof driveScript==="function"?driveScript(g,c.drives,[c.sea.roster[c.home],c.sea.roster[c.away]]):[];
  const L={}; c.act.forEach(x=>{ L[x.i]=gameStats(rng,x.pl,x.i,c.pf,c.pa,c.pf>c.pa) });
  const X={};   // backups the log named (a nickel back's pick)
  const has=i=>!!L[i];
  if(has(0)){ L[0].ptd=0; L[0].int=0 } if(has(1))L[1].rtd=0; [2,3].forEach(i=>{ if(has(i))L[i].ctd=0 }); [8,9].forEach(i=>{ if(has(i))L[i].ints=0 });
  c.drives.forEach((d,k)=>{ const w=rows[k]&&rows[k].who; if(!w)return;
    const slotOf=i=>{ if(has(i))return i; const p=c.R[i], x=p&&c.act.find(a=>a.pl===p); return x?x.i:-1 };   // a backup playing for an injured starter
    if(d.home===home){ if(w.k==="pass"){ if(has(0))L[0].ptd++; const si=slotOf(w.i); if(si>=0)L[si].ctd++;
        else if(w.i>=POS.length&&c.R[w.i]){ const p=c.R[w.i], e=X[w.i]=X[w.i]||{pl:p,pos:POS[w.i%POS.length].p,line:{rec:0,cyd:0,ctd:0}}; e.line.ctd++; e.line.rec++; e.line.cyd+=w.y||0 } }
      else if(w.k==="run"&&w.i===1&&has(1))L[1].rtd++ }
    else if(w.k==="int"){ const si=slotOf(w.i); if(si>=0){ if("ints" in L[si])L[si].ints++; else L[si].pd=(L[si].pd||0)+1 } else if(w.i>=POS.length&&c.R[w.i]){ const p=c.R[w.i]; (X[w.i]=X[w.i]||{pl:p,pos:POS[w.i%POS.length].p,line:{tkl:0,pd:0,ints:0}}).line.ints++ } } });
  c.drives.forEach(d=>{ if(d.home===home&&d.kind==="INT"&&has(0))L[0].int++ });
  // the catches and yards: a split of the passer's
  const bkRec=Object.values(X).reduce((t,e)=>t+(e.line.rec||0),0), bkYd=Object.values(X).reduce((t,e)=>t+(e.line.cyd||0),0);
  if(has(0)){ const Q=L[0]; Q.cmp=Math.max(Q.cmp,Q.ptd); Q.att=Math.max(Q.att,Q.cmp); Q.pyd=Math.max(Q.pyd,bkYd);
    const rc=[2,3].filter(has), q=i=>(slot[i].pl.r-58)/22, star=i=>Math.max(0.5,1+q(i)*0.25);
    const w=rc.map(i=>(i===2?0.30:0.20)*star(i)).concat([1-rc.reduce((t,i)=>t+(i===2?0.30:0.20),0)]);
    const n=splitDraw(rng,Math.max(0,Q.cmp-bkRec),w);
    rc.forEach((i,j)=>{ L[i].rec=Math.max(n[j],L[i].ctd) });
    let over=rc.reduce((t,i)=>t+L[i].rec,0)+bkRec-Q.cmp; if(over>0)Q.cmp+=over, Q.att=Math.max(Q.att,Q.cmp);
    const ypc=rc.map(i=>(i===2?12.8:11.6)+q(i)*2.2+rng.gauss(0,1.5)), rest=Q.cmp-bkRec-rc.reduce((t,i)=>t+L[i].rec,0);
    const wy=rc.map((i,j)=>L[i].rec*Math.max(6,ypc[j])), T=wy.reduce((t,x)=>t+x,0)+rest*9.5;
    rc.forEach((i,j)=>{ L[i].cyd=T>0?Math.floor((Q.pyd-bkYd)*wy[j]/T):0 }) }
  else [2,3].forEach(i=>{ if(has(i)){ L[i].rec=L[i].ctd; L[i].cyd=0 } });
  return c.act.map(x=>({pl:x.pl,pos:x.P,line:L[x.i]})).concat(Object.values(X));
}
function addStats(dst,src){
  dst.g=(dst.g||0)+1;
  Object.keys(src).forEach(k=>dst[k]=(dst[k]||0)+src[k]);
}

/* Human-readable season line. */
function statLine(pos,s){
  if(!s||!s.g)return "";
  const n=x=>x.toLocaleString();
  if(pos==="QB")return `${n(s.pyd)} yds, ${s.ptd} TD, ${s.int} INT (${s.cmp}/${s.att})`;
  if(pos==="RB")return `${n(s.ryd)} yds, ${s.rtd} TD (${s.car} car)`;
  if(pos==="WR"||pos==="WR2")return `${s.rec} rec, ${n(s.cyd)} yds, ${s.ctd} TD`;
  if(pos==="OT")return `${s.pan} pancake${s.pan===1?"":"s"}, ${s.ska} sack${s.ska===1?"":"s"} allowed`;   // "1 SACKS ALLOWED" (Instinct)
  if(pos==="EDGE"||pos==="DT")return `${s.tkl} tkl, ${s.sck} sack${s.sck===1?"":"s"}, ${s.tfl} TFL`;
  if(pos==="LB")return `${s.tkl} tkl, ${s.tfl} TFL, ${s.pd} PD`;
  return `${s.tkl} tkl, ${s.ints} INT, ${s.pd} PD`;
}

/* Award production, built from what a player actually did. */
function statProd(pos,s){
  if(!s||!s.g)return 0;
  if(pos==="QB")  return s.pyd*0.042 + s.ptd*4.4 - s.int*3.0;
  if(pos==="RB")  return s.ryd*0.062 + s.rtd*4.6;
  if(pos==="WR")  return s.cyd*0.060 + s.ctd*4.6 + s.rec*0.32;
  if(pos==="WR2") return s.cyd*0.046 + s.ctd*3.4;
  if(pos==="OT")  return s.pan*0.55 - s.ska*0.9;
  if(pos==="EDGE")return s.sck*5.2 + s.tfl*1.9 + s.tkl*0.30;
  if(pos==="DT")  return s.sck*4.6 + s.tfl*1.7 + s.tkl*0.28;
  if(pos==="LB")  return s.tkl*0.55 + s.tfl*2.1 + s.pd*1.1;
  return s.ints*7.2 + s.pd*1.7 + s.tkl*0.38;
}


/* ---- stats pages (round 69): column labels and the league's leader boards ---- */
const STAT_ABBR={cmp:"Cmp",att:"Att",pyd:"Yds",ptd:"TD",int:"Int",car:"Car",ryd:"Yds",rtd:"TD",rec:"Rec",cyd:"Yds",ctd:"TD",pan:"Pancakes",ska:"Sacks allowed",tkl:"Tkl",sck:"Sacks",tfl:"TFL",pd:"PD",ints:"Int"};
const LEADERS=[
  {l:"Passing yards",pos:["QB"],v:s=>s.pyd||0},{l:"Passing touchdowns",pos:["QB"],v:s=>s.ptd||0},
  {l:"Rushing yards",pos:["RB"],v:s=>s.ryd||0},{l:"Rushing touchdowns",pos:["RB"],v:s=>s.rtd||0},
  {l:"Receiving yards",pos:["WR","WR2"],v:s=>s.cyd||0},{l:"Receptions",pos:["WR","WR2"],v:s=>s.rec||0},{l:"Receiving touchdowns",pos:["WR","WR2"],v:s=>s.ctd||0},
  {l:"Sacks",pos:["EDGE","DT","LB"],v:s=>s.sck||0,f:v=>v.toFixed(1).replace(/\.0$/,"")},{l:"Tackles",pos:["EDGE","DT","LB","CB","S"],v:s=>s.tkl||0},
  {l:"Interceptions",pos:["CB","S"],v:s=>s.ints||0}];

/* round 87: attributes (core 93_attrs), by position group. Not yet in the drive engine: they make up the rating and
   grow with age (round 90 plays them). */
const ATTRS={
  name:{arm:"Arm",acc:"Accuracy",spd:"Speed",hnd:"Hands",blk:"Blocking",str:"Strength",rsh:"Pass rush",cov:"Coverage",tkl:"Tackling",vis:"Vision"},
  desc:{arm:"the deep ball",acc:"completions, fewer picks",spd:"breakaways",hnd:"catches in traffic",blk:"protection and run lanes",str:"winning at the line",
    rsh:"sacks and pressure",cov:"blanketing receivers",tkl:"bringing them down",vis:"reading the field"},
  band:{arm:"p",acc:"t",spd:"p",hnd:"t",blk:"t",str:"p",rsh:"t",cov:"m",tkl:"t",vis:"m"},
  group:p=>p==="QB"?"QB":p==="RB"?"RB":/^WR/.test(p)?"WR":p==="OT"?"OL":/^(EDGE|DT)$/.test(p)?"DL":p==="LB"?"LB":"DB",
  w:{QB:{arm:.3,acc:.4,vis:.2,spd:.1}, RB:{spd:.4,vis:.25,hnd:.15,blk:.1,str:.1}, WR:{spd:.4,hnd:.45,vis:.15},
     OL:{blk:.55,str:.35,vis:.1}, DL:{rsh:.5,str:.3,tkl:.15,spd:.05}, LB:{tkl:.4,cov:.2,vis:.2,rsh:.1,spd:.1}, DB:{cov:.5,spd:.3,tkl:.1,vis:.1}},
  lean:{},
  role:{arm:"Gunslinger",acc:"Field general",spd:"Burner",hnd:"Possession receiver",blk:"Road grader",str:"Mauler",rsh:"Pass rusher",cov:"Cover man",tkl:"Thumper",vis:"Instinctive"},
  roleBy:{QB:{spd:"Dual threat",vis:"Field general"}, RB:{spd:"Home-run hitter",vis:"Patient runner",str:"Power back",hnd:"Third-down back",blk:"Third-down back"},
    WR:{spd:"Deep threat",hnd:"Possession receiver",vis:"Route runner"}, OL:{blk:"Pass protector",str:"Mauler",vis:"Technician"},
    DL:{rsh:"Pass rusher",str:"Run stuffer",tkl:"Run stuffer"}, LB:{cov:"Coverage backer",rsh:"Blitzer",tkl:"Thumper"}, DB:{cov:"Lockdown corner",spd:"Ball hawk",tkl:"Enforcer"}}
};
