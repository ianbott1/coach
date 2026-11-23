/* ============ players: soccer ============ */
/* A squad as six units, each a first-choice player and one behind him:
   goalkeeper, centre-backs, full-backs, midfield, wingers, striker. The bench
   plays about a quarter of the time (rotation, substitutes, injuries). */

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

/* unit, share of team strength, backup dropoff, share of injuries, bench share */
const POS=[
  {p:"GK", w:0.14, drop:12, hz:0.05, bench:0.10},
  {p:"CB", w:0.18, drop:9,  hz:0.19, bench:0.25},
  {p:"FB", w:0.14, drop:8,  hz:0.19, bench:0.28},
  {p:"CM", w:0.22, drop:9,  hz:0.21, bench:0.28},
  {p:"W",  w:0.15, drop:9,  hz:0.18, bench:0.32},
  {p:"ST", w:0.17, drop:10, hz:0.18, bench:0.28},
];
const BENCH=0.25;                        // an average, for anything that needs one number
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
function blankTeamLine(){return {sog:0,pp:0,ppg:0,pim:0}}

/* ============ box scores ============ */
const OUT=["goals","ast","shots"];
const STAT_KEYS={GK:["sv","ga","cs"],CB:OUT.concat(["cs"]),FB:OUT.concat(["cs"]),CM:OUT,W:OUT,ST:OUT};
function blankStats(pos){const o={g:0}; (STAT_KEYS[pos]||[]).forEach(k=>o[k]=0); return o}
/* each first-choice player's share of the team's goals, assists and shots */
const ROLE={CB:{goals:0.06,ast:0.04,shots:0.07},FB:{goals:0.05,ast:0.14,shots:0.08},CM:{goals:0.16,ast:0.24,shots:0.20},
            W:{goals:0.22,ast:0.24,shots:0.24},ST:{goals:0.36,ast:0.12,shots:0.28}};
function gameStats(rng,pl,posIdx,forPts,oppPts,won){
  const P=POS[posIdx].p;
  if(P==="GK"){ const sa=Math.max(oppPts,Math.round(rng.gauss(4.4,1.8)+oppPts)); return {sv:sa-oppPts, ga:oppPts, cs:oppPts===0?1:0} }
  const R=ROLE[P], q=(pl.r-60)/20, star=Math.max(0.5,1+q*0.45+rng.gauss(0,0.2)), first=1-POS[posIdx].bench;
  const pick=(n,p)=>{let k=0;for(let i=0;i<n;i++)if(rng.r()<p)k++;return k};
  const goals=pick(forPts,Math.min(0.9,R.goals*first*star));
  const ast=pick(forPts,Math.min(0.9,R.ast*first*star*0.9));
  const shots=Math.max(goals,Math.round(rng.gauss(12*R.shots*first*star,0.8)));
  const o={goals:goals, ast:ast, shots:shots}; if(P==="CB"||P==="FB")o.cs=oppPts===0?1:0; return o;
}
/* round 74 (engV 4): a team's lines from the game's own record. Every goal to the man the log names (scScorer), an
   assist on about seven in ten to a team-mate (by position and rating), the shots the game had shared among the men on
   the pitch (each scorer at least his goals), the keeper's saves (their shots on target less their goals) and goals
   against as the game played them. Everyone who played gets a line, the bench too. */
const SC_ASSISTED=0.72;
function teamLines(rng,c){
  const o=c.side==="home"?"away":"home", tm=c.tm, at={}; c.R.forEach((p,i)=>{ if(p&&p.n&&!at[p.n])at[p.n]={pl:p,i:i} });
  const hurt=new Set(c.sea.talent?c.sea.talent.active(tm).map(x=>x.idx):[]), star=p=>Math.max(0.5,1+(p.r-60)/20*0.45);
  const on=[]; POS.forEach((P,i)=>{ if(P.p==="GK")return; const st=hurt.has(i)?null:c.R[i], bk=hurt.has(BK(i))?null:c.R[BK(i)], b=P.bench;
    if(st)on.push({p:st,i:i,P:P.p,m:bk?1-b:1}); if(bk)on.push({p:bk,i:BK(i),P:P.p,m:st?b:1}) });
  const L=new Map(); on.forEach(x=>L.set(x.p.n,{goals:0,ast:0,shots:0}));
  const ev=[]; c.drives.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k==="goal")ev.push(e) }));
  // round 103: a goal the full match showed: the assist is the man the screen showed passing to the scorer (none if it
  // was a partner without a name, or a penalty); the draws are made as before either way
  const sdA=c.side==="home"?0:1, shownA=[]; c.drives.forEach(d=>(Array.isArray(d.pn)?d.pn:[]).forEach(q=>{ if(q[0]===sdA&&q[1]==="a")shownA.push({i:q[2],m:q[3]}) }));
  ev.filter(e=>e.side===c.side).forEach(e=>{ const S=scGoalBy(tm,e), l=L.get(S.n); e.nm=S.n; e.un=S.unit; if(!l)return; l.goals++;
    let k=-1; if(rng.r()<SC_ASSISTED){ const w=on.map(x=>x.p.n===S.n?0:ROLE[x.P].ast*x.m*star(x.p)*scLean(x.p,"pas")); k=splitDraw(rng,1,w).indexOf(1) }
    const j=shownA.findIndex(q=>q.m===e.m);
    if(j>=0){ const q=shownA.splice(j,1)[0], p=q.i>=0?c.R[q.i]:null; if(p&&p.n!==S.n&&L.has(p.n))L.get(p.n).ast++ }
    else if(k>=0)L.get(on[k].p.n).ast++ });
  const sts=c.drives.filter(d=>d.st), st=sts.length?sts[sts.length-1].st:null;
  // round 101: a shot the full match showed is its shooter's (d.pn, roster slots); the rest shared as before
  const sd=c.side==="home"?0:1, shown={}; let nShown=0;
  c.drives.forEach(d=>(Array.isArray(d.pn)?d.pn:[]).forEach(q=>{ if(q[0]!==sd||q[1]!=="s")return; const p=c.R[q[2]]; if(p&&L.has(p.n)){ shown[p.n]=(shown[p.n]||0)+1; nShown++ } }));
  const shots=st?st[c.side][0]:0, given=on.reduce((t,x)=>t+L.get(x.p.n).goals,0);
  const n=splitDraw(rng,Math.max(0,shots-given-nShown),on.map(x=>ROLE[x.P].shots*x.m*star(x.p)));
  on.forEach((x,j)=>{ const l=L.get(x.p.n); l.shots=l.goals+n[j]+(shown[x.p.n]||0) });
  const ga=ev.filter(e=>e.side===o).length, reg=ev.filter(e=>e.side===o&&e.m<=90).length, cs=ga===0?1:0;
  const out=on.map(x=>{ const l=L.get(x.p.n); if(x.P==="CB"||x.P==="FB")l.cs=cs; return {pl:x.p,pos:POS[x.i%POS.length].p,line:l} });
  const gk=c.act.find(x=>x.P==="GK"); if(gk)out.push({pl:gk.pl,pos:"GK",line:{sv:st?Math.max(0,st[o][1]-reg):0,ga:ga,cs:cs}});
  return out;
}
function addStats(dst,src){dst.g=(dst.g||0)+1; Object.keys(src).forEach(k=>dst[k]=(dst[k]||0)+src[k])}
function statLine(pos,s){
  if(!s||!s.g)return "";
  if(pos==="GK")return `${s.cs||0} clean sheet${s.cs===1?"":"s"}, ${s.sv||0} save${s.sv===1?"":"s"} in ${s.g} game${s.g===1?"":"s"}`;
  return `${s.goals||0} goal${s.goals===1?"":"s"}, ${s.ast||0} assist${s.ast===1?"":"s"} in ${s.g} game${s.g===1?"":"s"}`;   // "IN 1 GAMES" (Instinct)
}
function statProd(pos,s){
  if(!s||!s.g)return 0;
  if(pos==="GK")return (s.cs||0)*3+(s.sv||0)*0.25;
  return (s.goals||0)*3+(s.ast||0)*2+(s.cs||0)*(pos==="CB"?1.5:1);
}

/* ---- stats pages (round 69): column labels and the league's leader boards ---- */
const STAT_ABBR={goals:"Goals",ast:"Assists",shots:"Shots",cs:"Clean sheets",sv:"Saves",ga:"Conceded"};
const LEADERS=[{l:"Goals",v:s=>s.goals||0},{l:"Assists",v:s=>s.ast||0},{l:"Goals and assists",v:s=>(s.goals||0)+(s.ast||0)},
  {l:"Clean sheets",pos:["GK"],v:s=>s.cs||0},{l:"Saves",pos:["GK"],v:s=>s.sv||0}];

/* round 87: attributes (core 93_attrs), by role: keepers, centre backs, full backs, midfielders, wingers, strikers. They
   make up the rating and grow with age; round 89 (engine 12) plays them: 50_game SC12. */
const ATTRS={
  name:{fin:"Finishing",pas:"Passing",pac:"Pace",tck:"Tackling",hed:"Heading",sta:"Stamina",pos:"Positioning",han:"Handling"},
  desc:{fin:"turning chances into goals",pas:"creating chances",pac:"getting in behind",tck:"winning the ball",hed:"in the air, both boxes",
    sta:"running for ninety minutes",pos:"being in the right place",han:"catching, not parrying (keepers)"},
  band:{fin:"t",pas:"t",pac:"p",tck:"t",hed:"t",sta:"p",pos:"m",han:"t"},
  group:p=>p,
  w:{GK:{han:.45,pos:.35,pas:.1,sta:.1}, CB:{tck:.3,hed:.22,pos:.22,pac:.1,pas:.08,sta:.08}, FB:{pac:.2,tck:.24,sta:.16,pas:.16,pos:.16,hed:.08},
     CM:{pas:.3,sta:.16,pos:.14,tck:.12,fin:.12,pac:.16}, W:{pac:.26,fin:.18,pas:.2,sta:.14,pos:.1,tck:.06,hed:.06},
     ST:{fin:.34,hed:.18,pac:.2,pos:.16,pas:.08,sta:.04}},
  lean:{},
  role:{fin:"Finisher",pas:"Playmaker",pac:"Speedster",tck:"Ball winner",hed:"Aerial threat",sta:"Engine",pos:"Reader of the game",han:"Safe hands"},
  roleBy:{ST:{fin:"Poacher",hed:"Target man",pac:"Runner in behind"}, CB:{hed:"Stopper",pas:"Ball-playing defender"}, GK:{pos:"Sweeper keeper",pas:"Sweeper keeper"}},
  plays:()=>ENGINE_V>=12,   // round 89: the attributes play (engine 12)
  train:{Defenders:{groups:["CB","FB"],keys:["tck","pos","hed","pac","pas","sta"]}, Midfield:{groups:["CM","W"],keys:["pas","pac","sta","fin","tck","pos"]}, Attack:{groups:["ST"],keys:["fin","hed","pac","pos","pas"]}, Keepers:{groups:["GK"],keys:["han","pos","pas","sta"]}}
};
