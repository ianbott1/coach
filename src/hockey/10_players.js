/* ============ players: hockey ============ */
/* Twelve players: a first unit (centre, two wings, two defensemen and the
   starting goalie) and a player behind each (the depth lines, the third
   pair, the backup goalie). Team strength comes from them, the goalie most
   of all. */

const PNAMES_F=["Marcus","Jalen","Trevor","DeAndre","Caleb","Xavier","Bryce","Amari","Cooper",
"Isaiah","Rashaun","Tanner","Malik","Grayson","Devonte","Hunter","Elijah","Josiah","Keenan","Dontae",
"Landon","Zaire","Kyler","Omari","Tre","Nico","Quinn","Deshaun","Cade","Tyrese","Micah","Damari",
"Kobe","Silas","Emory","Kade","Anwar","Diego","Kamari","Jamir","Ezra","Khalil","Nnamdi","Makai",
"Jaylen","Tariq","Darius","Moussa","Luka","Bogdan","Ousmane","Kel'el","Terrence","Armando","Otis"];
const PNAMES_L=["Whitfield","Okonkwo","Barrera","Sanders","Colquitt","Adeyemi","Reyes","Traylor",
"Mbeki","Vandenberg","Hollis","Guillory","Achebe","Kirkpatrick","Solano","Nwosu","Bettencourt",
"Ratliff","Delacroix","Ivory","Sinclair","Ogunleye","Castillo","Thibodeaux","Marchetti","Ude",
"Espinoza","Vann","Duckworth","Asante","Rios","Pettigrew","Oyelaran","Steadman","Cifuentes","Igwe",
"Balogun","Tremblay","Lindqvist","Kovalenko","Bergeron","Makinen","Duchene","Karlsson","Norwood","Mensah","Quintero","Ashworth","Diallo","Buchanan","Lefevre","Odom",
"Kponeh","Vasquez","Randle","Diabate","Petrovic","Kuminga","Sissoko","Harlan","Ellsworth"];

/* position, share of team strength, backup dropoff, share of injuries, and
   how much the player behind him plays (depth lines about 30%; a backup
   goalie starts about a fifth of games) */
const POS=[
  {p:"C",  w:0.17, drop:10, hz:0.20, bench:0.30},
  {p:"LW", w:0.13, drop:9,  hz:0.19, bench:0.30},
  {p:"RW", w:0.13, drop:9,  hz:0.19, bench:0.30},
  {p:"D",  w:0.14, drop:9,  hz:0.19, bench:0.30},
  {p:"D2", w:0.13, drop:9,  hz:0.18, bench:0.30},
  {p:"G",  w:0.30, drop:12, hz:0.05, bench:0.22},
];
const BENCH=0.28;                        // an average, for anything that needs one number
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
/* round 74 (engV 4): a team's lines from the game's own record. Every goal and assist to the men the log names
   (hkGoalNames), the shots on goal the game had (its goals from shots and the other goalie's saves) shared among the
   ten skaters dressed, the goalie's saves and goals against as the game played them (an empty-net goal isn't his).
   Everyone dressed gets a line, the depth men too. */
function teamLines(rng,c){
  const o=c.side==="home"?"away":"home", tm=c.tm, at={}; c.R.forEach((p,i)=>{ if(p&&p.n&&!at[p.n])at[p.n]={pl:p,i:i} });
  const dressed=hkDressed(tm,HK_SW); if(!dressed.length)return statLinesOld(rng,c);
  const L={}; dressed.forEach(d=>L[d.n]={goals:0,ast:0,pts:0,sog:0});
  const ev=[]; c.drives.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k==="goal")ev.push(e) }));
  let mine=0;
  ev.filter(e=>e.side===c.side).forEach(e=>{ const N=hkGoalNames(tm,e); e.nm=N.n; if(N.a)e.an=N.a; if(N.depth)e.dp=1;
    if(L[N.n]){ L[N.n].goals++; if(!e.en&&!e.extra)mine++ } else if(!e.en&&!e.extra)mine++;
    if(N.a&&L[N.a])L[N.a].ast++ });
  const sv=k=>c.drives.reduce((t,d)=>t+(d.sv||[]).filter(x=>x.side===k).length,0);
  const sog=ev.filter(e=>e.side===c.side&&!e.en&&!e.extra).length+sv(o);
  const credited=dressed.reduce((t,d)=>t+L[d.n].goals,0), rest=Math.max(0,sog-credited);
  const n=splitDraw(rng,rest,dressed.map(d=>d.w).concat([0.08]));
  dressed.forEach((d,j)=>{ const l=L[d.n]; l.sog=l.goals+n[j]; l.pts=l.goals+l.ast });
  const out=dressed.map(d=>({pl:d.p,pos:POS[d.i%POS.length].p,line:L[d.n]}));
  // the goalies: the man in net for each spell (the backup once he's in, or when he started) gets its saves and goals
  // against; an empty-net goal is nobody's
  const d0=c.drives[0]||{}, gi=POS.findIndex(P=>P.p==="G"), gAct=c.act.find(x=>x.i===gi), bkG=c.R[BK(gi)];
  const start=d0.bk&&d0.bk[c.side]&&bkG?bkG:gAct?gAct.pl:null, other=start===bkG?(gAct?gAct.pl:null):bkG, G=new Map();
  c.drives.forEach(d=>{ const inNet=(d.gIn&&d.gIn[c.side]&&other&&start!==bkG)?other:start; if(!inNet)return;
    const l=G.get(inNet)||{sv:0,ga:0,so:0}; l.sv+=(d.sv||[]).filter(x=>x.side===c.side).length; l.ga+=(d.ev||[]).filter(e=>e.k==="goal"&&e.side===o&&!e.en).length; G.set(inNet,l) });
  G.forEach((l,p)=>{ if(p!==start&&!l.sv&&!l.ga)return; l.so=p===start&&G.size===1&&l.ga===0&&c.pa===0?1:0; out.push({pl:p,pos:"G",line:l}) });
  return out;
}
function blankTeamLine(){return {sog:0,pp:0,ppg:0,pim:0}}

/* ============ box scores ============ */
const SK=["goals","ast","pts","sog"];
const STAT_KEYS={C:SK,LW:SK,RW:SK,D:SK,D2:SK,G:["sv","ga","so"]};
function blankStats(pos){const o={g:0}; (STAT_KEYS[pos]||[]).forEach(k=>o[k]=0); return o}
/* each unit's share of the first unit's goals, assists and shots (depth
   players account for the rest) */
/* scaled (x0.72) so a first-line centre scores like one: ~65 points in an
   84-game season, the best near 100; a first-pair defenceman ~35 (it was 92
   and 48: a dozen players can't carry all of a team's scoring) */
/* goals x0.78, forwards' assists x1.12, and rating counts half again as much (Grokbot, Nov 2026: a 57-rated centre with
   35 goals; a 62 winger led the league with 60; five players over 54, where the NHL has one or two near 50) */
const HK_GSH=0.78, HK_ASH=1.12, HK_STAR=0.7;
const ROLE={C:{goals:0.195*HK_GSH,ast:0.19*HK_ASH,sog:0.24},LW:{goals:0.18*HK_GSH,ast:0.15*HK_ASH,sog:0.22},RW:{goals:0.18*HK_GSH,ast:0.15*HK_ASH,sog:0.22},
            D:{goals:0.085*HK_GSH,ast:0.12,sog:0.17},D2:{goals:0.055*HK_GSH,ast:0.075,sog:0.12}};   // defencemen's assists as they were   // a second pair: ~22 points, not the first pair's ~35
/* one game's line for one first-unit player, consistent with his rating and the score */
function gameStats(rng,pl,posIdx,forPts,oppPts,won){
  const P=POS[posIdx].p;
  if(P==="G"){ const sa=Math.max(oppPts,Math.round(rng.gauss(29,4.5)));
    return {sv:sa-oppPts, ga:oppPts, so:oppPts===0?1:0} }
  const R=ROLE[P], q=(pl.r-60)/20, star=Math.max(0.4,1+q*HK_STAR+rng.gauss(0,0.2)), first=1-(HK_STAT_BENCH?HK_STAT_BENCH[posIdx]:POS[posIdx].bench);
  const pick=(n,p)=>{let k=0;for(let i=0;i<n;i++)if(rng.r()<p)k++;return k};
  const goals=pick(forPts,Math.min(0.9,R.goals*first*star));
  const ast=pick(Math.round(forPts*1.7),Math.min(0.9,R.ast*first*star*0.55));
  const sog=Math.max(goals,Math.round(rng.gauss(29*R.sog*first*star,1.2)));
  return {goals:goals, ast:ast, pts:goals+ast, sog:sog};
}
function addStats(dst,src){dst.g=(dst.g||0)+1; Object.keys(src).forEach(k=>dst[k]=(dst[k]||0)+src[k])}
/* a season line: hockey counts totals */
function statLine(pos,s){
  if(!s||!s.g)return "";
  if(pos==="G"){ const sa=(s.sv||0)+(s.ga||0), sv=sa?(s.sv/sa):0;
    return `${sv.toFixed(3).replace(/^0/,"")} save %, ${((s.ga||0)/s.g).toFixed(2)} GAA${s.so?", "+s.so+" shutout"+(s.so===1?"":"s"):""}` }
  return `${nOf(s.goals||0,"goal")}, ${nOf(s.ast||0,"assist")}, ${nOf(s.pts||0,"point")}`;
}
/* award production, from what a player actually did */
function statProd(pos,s){
  if(!s||!s.g)return 0;
  if(pos==="G"){ const sa=(s.sv||0)+(s.ga||0); return sa?Math.max(0,((s.sv/sa)-0.880)*1400)*Math.min(1,s.g/40):0 }
  return (s.pts||0)+(s.goals||0)*0.4;
}

/* ---- stats pages (round 69): column labels and the league's leader boards ---- */
const STAT_ABBR={goals:"G",ast:"A",pts:"Pts",sog:"SOG",sv:"Saves",ga:"GA",so:"SO"};
const LEADERS=[
  {l:"Points",pos:["C","LW","RW","D","D2"],v:s=>s.pts||0},{l:"Goals",pos:["C","LW","RW","D","D2"],v:s=>s.goals||0},{l:"Assists",pos:["C","LW","RW","D","D2"],v:s=>s.ast||0},
  {l:"Points by a defenceman",pos:["D","D2"],v:s=>s.pts||0},
  {l:"Save percentage",pos:["G"],v:s=>(s.sv+s.ga)?s.sv/(s.sv+s.ga):0,f:v=>v.toFixed(3).replace(/^0/,""),min:(s,G)=>s.g>=Math.max(1,G/3)},
  {l:"Goals against average",pos:["G"],v:s=>s.g?s.ga/s.g:0,f:v=>v.toFixed(2),low:true,min:(s,G)=>s.g>=Math.max(1,G/3)},{l:"Shutouts",pos:["G"],v:s=>s.so||0}];
function STAT_EXTRA(pos){ return pos==="G"?[["SV%",s=>(s.sv+s.ga)?(s.sv/(s.sv+s.ga)).toFixed(3).replace(/^0/,""):"-"]]:[] }

/* round 87: attributes (core 93_attrs): forwards, defencemen, goalies. Not yet in the game engine: they make up the
   rating and grow with age (round 89 plays them). */
const ATTRS={
  name:{sht:"Shooting",pas:"Passing",skt:"Skating",chk:"Checking",def:"Defence",rfx:"Reflexes",gpo:"Positioning"},
  desc:{sht:"scoring",pas:"setting up goals",skt:"speed and edges",chk:"winning the boards",def:"reading the play in his own end",
    rfx:"the quick save",gpo:"square to the shooter"},
  band:{sht:"t",pas:"t",skt:"p",chk:"p",def:"m",rfx:"p",gpo:"m"},
  group:p=>p==="G"?"G":/^D/.test(p)?"D":"F",
  w:{F:{sht:.3,pas:.25,skt:.25,chk:.1,def:.1}, D:{def:.32,chk:.2,skt:.2,pas:.18,sht:.1}, G:{rfx:.55,gpo:.45}},
  lean:{},
  role:{sht:"Sniper",pas:"Playmaker",skt:"Speedster",chk:"Power forward",def:"Two-way forward",rfx:"Athletic goalie",gpo:"Positional goalie"},
  roleBy:{D:{sht:"Offensive defenceman",pas:"Puck mover",chk:"Shutdown defenceman",def:"Shutdown defenceman",skt:"Puck mover"}}
};
