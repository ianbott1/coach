
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
  QB  :["cmp","att","pyd","ptd","int","car","ryd","rtd"],   // engine 26: and his runs (a season begun before keeps the passing five: blankStats)
  RB  :["car","ryd","rtd"],
  WR  :["rec","cyd","ctd"],
  WR2 :["rec","cyd","ctd"],
  OT  :["pan","ska"],
  EDGE:["tkl","sck","tfl"],
  DT  :["tkl","sck","tfl"],
  LB  :["tkl","tfl","pd","ints"],
  CB  :["tkl","pd","ints"],
  S   :["tkl","pd","ints"]
};

/* engine 26 (stats): the keys a season begun before didn't keep (a quarterback's runs, a linebacker's picks), so its
   lines replay as they were */
const FB_KEYS26={QB:["car","ryd","rtd"],LB:["ints"]};
function blankStats(pos){
  const o={g:0}, old=typeof ENGINE_V!=="undefined"&&ENGINE_V<26?FB_KEYS26[pos]||[]:[];
  (STAT_KEYS[pos]||[]).forEach(k=>{ if(old.indexOf(k)<0)o[k]=0 });
  return o;
}
/* engine 26 (stats): stat lines like the league's. Completion 65.3% in the NFL's 2024 season (AP), about 62% in FBS;
   7.0 yards an attempt (NFL) and 7.5 (FBS); a quarterback's runs and scrambles; carries shared by two backs about 65/35;
   tackles spread like a real defence's (a linebacker leads, about 10 a game at the top). */
const FB26={nfl:{pct:0.615,ypc:10.3,qcar:[1.5,5.5],ycar:4.6},cfb:{pct:0.625,ypc:11.7,qcar:[3,9],ycar:4.4}};
const fb26=()=>typeof ENGINE_V!=="undefined"&&ENGINE_V>=26?(FB26[LEAGUE.id]||FB26.cfb):null;

/* round 91 (engine 14): a man's line leans with his attributes, as basketball's and hockey's do: a share times
   exp(FB_LK x his lean in spreads), held to FB_LMIN..FB_LMAX. Credit only (its own dice), so no result moves; gated,
   because an older season replays its lines. k: one attribute or several (their leans averaged). */
const FB_LK=0.22, FB_LMIN=0.6, FB_LMAX=1.6;
function fbLean(p,k){ if(typeof ENGINE_V==="undefined"||ENGINE_V<14||!p||typeof attrOf!=="function")return 1; const A=attrOf(p); if(!A)return 1;
  const K=[].concat(k).filter(x=>A[x]!=null); if(!K.length)return 1; const l=K.reduce((t,x)=>t+(A[x]-p.r),0)/K.length;
  return Math.max(FB_LMIN,Math.min(FB_LMAX,Math.exp(FB_LK*l/(attrScale().s*ATTR_SPREAD)))) }
/* One game's production for one starter. */
function gameStats(rng,pl,posIdx,forPts,oppPts,won){
  const pos=POS[posIdx].p;
  const q=(pl.r-58)/22;                 // roughly -1.3 (poor) .. +1.8 (elite)
  const s={};
  const R=(a,b)=>a+rng.r()*(b-a), Lr=k=>fbLean(pl,k);
  const pass=forPts*0.60, run=forPts*0.40;

  const V=fb26();
  if(pos==="QB"){
    s.att=Math.max(8,Math.round(R(24,38)+(won?-2:4)));
    const pct=Math.max(0.38,Math.min(0.78,(V?V.pct+0.012*(Lr("acc")-1)*4:0.545)+q*0.055+rng.gauss(0,0.05)));
    s.cmp=Math.round(s.att*pct);
    s.pyd=Math.max(0,Math.round(s.cmp*((V?V.ypc:10.4)+q*1.5+rng.gauss(0,1.4))));
    s.ptd=Math.max(0,Math.round(pass/7*R(0.55,1.0)+ (q>1?rng.r():0)));
    s.int=Math.max(0,Math.round(R(0,1.9)-q*0.55+(won?-0.2:0.35)));
    if(V){ const sp=fbLean(pl,"spd"); s.car=Math.max(0,Math.round(R(V.qcar[0],V.qcar[1])*sp*sp)); s.ryd=Math.round(s.car*(V.ycar+rng.gauss(0,1.6))*sp); s.rtd=0 }
  } else if(pos==="RB"){
    // engine 26: the backs' carries (the lead back's share is drawn in teamLines)
    s.car=Math.max(4,Math.round(V?R(19,29)+(won?3:-3):R(13,23)+(won?4:-3)));
    s.ryd=Math.max(-5,Math.round(s.car*(3.9+q*0.85+rng.gauss(0,0.9))*Lr(["spd","str"])));
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
    s.tkl=Math.max(0,Math.round((R(2,5.5)+q*0.7)*Lr("tkl")));
    s.sck=(rng.r()<(0.34+q*0.15)*Lr("rsh")?1:0)+(rng.r()<(0.09+q*0.06)*Lr("rsh")?1:0);
    s.tfl=s.sck+(rng.r()<0.30+q*0.12?1:0);
  } else if(pos==="DT"){
    s.tkl=Math.max(0,Math.round((R(2,5)+q*0.6)*Lr("tkl")));
    s.sck=(rng.r()<(0.20+q*0.09)*Lr("rsh")?1:0);
    s.tfl=s.sck+(rng.r()<0.24+q*0.10?1:0);
  } else if(pos==="LB"){
    s.tkl=Math.max(1,Math.round(V?(R(4,9.5)+q*1.0)*Math.min(1.3,Lr("tkl")):(R(5,11)+q*1.3)*Lr("tkl")));
    if(V)s.ints=0;
    s.tfl=(rng.r()<0.42+q*0.15?1:0)+(rng.r()<0.10+q*0.05?1:0);
    s.pd=(rng.r()<(0.28+q*0.09)*Lr("cov")?1:0);
  } else {                                   // CB, S
    s.tkl=Math.max(0,Math.round(V&&pos==="S"?(R(3,7.5)+q*0.6)*Math.min(1.3,Lr("tkl")):(R(2,6)+q*0.6)*Lr("tkl")));
    s.pd=(rng.r()<(0.42+q*0.14)*Lr("cov")?1:0)+(rng.r()<(0.14+q*0.07)*Lr("cov")?1:0);
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
  // engine 26 (stats): the second back too (he shares the carries and some of the touchdown runs), and a hurt backup
  // isn't named (he caught touchdowns while out)
  const v26=ENGINE_V>=26, hurt26=v26&&c.sea&&c.sea.talent?new Set(c.sea.talent.active(c.tm).map(x=>x.idx)):new Set();
  const bkOk=i=>{ const p=c.R[i]; return p&&!c.act.some(x=>x.pl===p)&&!hurt26.has(i) };
  c.drives.forEach(d=>{ d.by=d.by||{}; if(d.home===home){ [0,1,2,3].forEach(i=>{ if(slot[i])d.by[i]=slot[i].pl.n }); (v26?[BK(1),BK(2),BK(3)]:[BK(2),BK(3)]).forEach(i=>{ const p=c.R[i]; if(bkOk(i))d.by[i]=p.n }) } else { [7,8,9].forEach(i=>{ if(slot[i])d.by["d"+i]=slot[i].pl.n }); [BK(8),BK(9)].forEach(i=>{ const p=c.R[i]; if(bkOk(i))d.by["d"+i]=p.n }) } });
  const rows=typeof driveScript==="function"?driveScript(g,c.drives,[c.sea.roster[c.home],c.sea.roster[c.away]]):[];
  const L={}; c.act.forEach(x=>{ L[x.i]=gameStats(rng,x.pl,x.i,c.pf,c.pa,c.pf>c.pa) });
  const X={};   // backups the log named (a nickel back's pick)
  const has=i=>!!L[i];
  // engine 26: the carries split between the backs, about 65/35 (by their ratings and the lead back's Speed and
  // Strength), each at his own yards a carry
  if(v26&&has(1)&&slot[1].i===1&&bkOk(BK(1))&&c.R[1]&&slot[1].pl===c.R[1]){ const b=c.R[BK(1)], a=slot[1].pl, T=L[1].car;
    const st=p=>Math.max(0.5,1+(p.r-58)/22*0.3)*fbLean(p,["spd","str"]), n=splitDraw(rng,T,[0.65*st(a),0.35*st(b)]);
    const qb=(b.r-58)/22, yb=Math.max(-3,Math.round(n[1]*(3.9+qb*0.85+rng.gauss(0,0.9))*fbLean(b,["spd","str"])));
    L[1].ryd=T>0?Math.round(L[1].ryd*n[0]/T):0; L[1].car=n[0];
    X[BK(1)]={pl:b,pos:POS[1].p,line:{car:n[1],ryd:yb,rtd:0}} }
  if(has(0)){ L[0].ptd=0; L[0].int=0 } if(has(1))L[1].rtd=0; [2,3].forEach(i=>{ if(has(i))L[i].ctd=0 }); [8,9].forEach(i=>{ if(has(i))L[i].ints=0 });
  c.drives.forEach((d,k)=>{ const w=rows[k]&&rows[k].who; if(!w)return;
    const slotOf=i=>{ if(has(i))return i; const p=c.R[i], x=p&&c.act.find(a=>a.pl===p); return x?x.i:-1 };   // a backup playing for an injured starter
    if(d.home===home){ if(w.k==="pass"){ if(has(0))L[0].ptd++; const si=slotOf(w.i); if(si>=0)L[si].ctd++;
        else if(w.i>=POS.length&&c.R[w.i]){ const p=c.R[w.i], e=X[w.i]=X[w.i]||{pl:p,pos:POS[w.i%POS.length].p,line:{rec:0,cyd:0,ctd:0}}; e.line.ctd++; e.line.rec++; e.line.cyd+=w.y||0 } }
      else if(w.k==="run"&&w.i===1&&has(1))L[1].rtd++;
      else if(v26&&w.k==="run"&&w.i===0&&has(0)){ L[0].rtd++; L[0].car=Math.max(L[0].car||0,L[0].rtd) }
      else if(v26&&w.k==="run"&&w.i===BK(1)){ const e=X[BK(1)]; if(e){ e.line.rtd++; e.line.car=Math.max(e.line.car,e.line.rtd) } else if(has(1))L[1].rtd++ } }
    else if(w.k==="int"){ const si=slotOf(w.i); if(si>=0){ if("ints" in L[si])L[si].ints++; else L[si].pd=(L[si].pd||0)+1 } else if(w.i>=POS.length&&c.R[w.i]){ const p=c.R[w.i]; (X[w.i]=X[w.i]||{pl:p,pos:POS[w.i%POS.length].p,line:{tkl:0,pd:0,ints:0}}).line.ints++ } } });
  c.drives.forEach(d=>{ if(d.home===home&&d.kind==="INT"&&has(0))L[0].int++ });
  // the catches and yards: a split of the passer's
  const bkRec=Object.values(X).reduce((t,e)=>t+(e.line.rec||0),0), bkYd=Object.values(X).reduce((t,e)=>t+(e.line.cyd||0),0);
  if(has(0)){ const Q=L[0]; Q.cmp=Math.max(Q.cmp,Q.ptd); Q.att=Math.max(Q.att,Q.cmp); Q.pyd=Math.max(Q.pyd,bkYd);
    const rc=[2,3].filter(has), q=i=>(slot[i].pl.r-58)/22, star=i=>Math.max(0.5,1+q(i)*0.25)*fbLean(slot[i].pl,"hnd");
    const ws=i=>i===2?(v26?0.27:0.30):(v26?0.18:0.20);   // engine 26: the completions are more, the top two's share a little less
    const w=rc.map(i=>ws(i)*star(i)).concat([1-rc.reduce((t,i)=>t+ws(i),0)]);
    const n=splitDraw(rng,Math.max(0,Q.cmp-bkRec),w);
    rc.forEach((i,j)=>{ L[i].rec=Math.max(n[j],L[i].ctd) });
    let over=rc.reduce((t,i)=>t+L[i].rec,0)+bkRec-Q.cmp; if(over>0)Q.cmp+=over, Q.att=Math.max(Q.att,Q.cmp);
    const ypc=rc.map(i=>((i===2?12.8:11.6)+q(i)*2.2+rng.gauss(0,1.5))*fbLean(slot[i].pl,"spd")), rest=Q.cmp-bkRec-rc.reduce((t,i)=>t+L[i].rec,0);
    const wy=rc.map((i,j)=>L[i].rec*Math.max(6,ypc[j])), T=wy.reduce((t,x)=>t+x,0)+rest*9.5;
    rc.forEach((i,j)=>{ L[i].cyd=T>0?Math.floor((Q.pyd-bkYd)*wy[j]/T):0 }) }
  else [2,3].forEach(i=>{ if(has(i)){ L[i].rec=L[i].ctd; L[i].cyd=0 } });
  /* round 101: the drives the full match showed snap by snap (d.pn: [kind, roster index, yards]) credit the plays the
     screen showed: the passer's completions, attempts and yards, the back's carries and yards, each receiver's catches
     and yards. The drives it didn't show keep their share of the draw above (all of it in a game not watched that way,
     so nothing drawn moves). */
  const own=c.drives.filter(d=>d.home===home&&d.start!=null), seen=own.filter(d=>Array.isArray(d.pn));
  if(seen.length){ const sh=(own.length-seen.length)/own.length, sc=v=>Math.round((v||0)*sh);
    const actOf=ri=>{ if(ri==null||ri<0)return -1; const p=c.R[ri], x=p&&c.act.find(a=>a.pl===p); return x?x.i:-1 };
    const T={cmp:0,att:0,pyd:0,car:0,ryd:0}, rec={}, cyd={};
    seen.forEach(d=>{ const k=c.drives.indexOf(d), w=rows[k]&&rows[k].who; d.pn.forEach(q=>{ const t=q[0], td=t===5||t===6, g=td&&w&&w.y!=null?w.y:(q[2]||0), ri=td?(w?w.i:-1):q[1];
      if(t===1||t===5){ T.cmp++; T.att++; T.pyd+=g; const si=actOf(ri); if(si===2||si===3){ rec[si]=(rec[si]||0)+1; cyd[si]=(cyd[si]||0)+g } }
      else if(t===2||t===7)T.att++;
      else if(t===0||t===6){ if(actOf(ri)===1){ T.car++; T.ryd+=g } } }) });
    if(has(1)){ L[1].car=sc(L[1].car)+T.car; L[1].ryd=sc(L[1].ryd)+T.ryd }
    [2,3].forEach(i=>{ if(has(i)){ L[i].rec=Math.max(sc(L[i].rec)+(rec[i]||0),L[i].ctd); L[i].cyd=sc(L[i].cyd)+(cyd[i]||0) } });
    if(has(0)){ const Q=L[0]; Q.cmp=sc(Q.cmp)+T.cmp; Q.pyd=sc(Q.pyd)+T.pyd; Q.att=sc(Q.att)+T.att;
      const got=[2,3].reduce((t,i)=>t+(has(i)?L[i].rec:0),0)+bkRec; if(got>Q.cmp)Q.cmp=got; Q.att=Math.max(Q.att,Q.cmp) } }
  /* round 107 (engine 21): a man's touchdowns are inside his own yards. The catches and yards were a split of the
     passer's, drawn apart from the touchdowns the scoring names, so a receiver's four touchdown catches came to 203 yards
     against a line of 169 (Muse, Nov 23). Each receiver gets at least his touchdown yards and 2 a catch for the rest,
     taken first from the catches the roster doesn't carry, then added to the passer; the back the same for his runs.
     No draws: the season plays as it did. */
  if(ENGINE_V>=21){ const tdY={};
    c.drives.forEach((d,k)=>{ const w=rows[k]&&rows[k].who; if(!w||d.home!==home||w.y==null)return;
      const si=has(w.i)?w.i:(()=>{ const p=c.R[w.i], x=p&&c.act.find(a=>a.pl===p); return x?x.i:-1 })();
      if(si>=0&&((w.k==="pass"&&(si===2||si===3))||(w.k==="run"&&si===1)))tdY[si]=(tdY[si]||0)+w.y });
    if(has(1)&&tdY[1]&&L[1].ryd<tdY[1]){ L[1].ryd=tdY[1]; L[1].car=Math.max(L[1].car||0,L[1].rtd||0) }
    if(v26){ const ty=k=>c.drives.reduce((t,d,j)=>{ const w=rows[j]&&rows[j].who; return t+(w&&d.home===home&&w.k==="run"&&w.i===k&&w.y!=null?w.y:0) },0);
      if(has(0)&&L[0].car!=null){ const y=ty(0); if(L[0].ryd<y)L[0].ryd=y }
      const e=X[BK(1)]; if(e){ const y=ty(BK(1)); if(e.line.ryd<y)e.line.ryd=y } }
    const rc=[2,3].filter(has);
    rc.forEach(i=>{ const need=(tdY[i]||0)+2*Math.max(0,(L[i].rec||0)-(L[i].ctd||0)); if(L[i].cyd<need)L[i].cyd=need });
    if(has(0)){ const Q=L[0], got=rc.reduce((t,i)=>t+L[i].cyd,0)+bkYd; if(got>Q.pyd)Q.pyd=got } }
  if(ENGINE_V>=25)fbBenchLines(rng,c,L,X);   /* merge fix: an older season replays as played (these draws moved its lines and, in the pro game, its results) */
  return c.act.map(x=>({pl:x.pl,pos:x.P,line:L[x.i]})).concat(Object.values(X));
}
/* review round (playtest: a backup's season line was only the plays the log named him for: a corner with 2 games, 2
   interceptions and no tackle, a receiver whose every catch was a touchdown; and every box score carried 4-14 catches for
   "Other receivers"). The backup receivers are the third and fourth wideouts: they take a share of the catches the roster's
   two starters don't (a third receiver about a tenth of the team's, a fourth half that; the rest are the tight ends' and
   backs', which the roster doesn't carry). The backup corner and safety are the nickel and dime backs: a few tackles a
   game, a pass broken up now and then. Each line is for a game he was healthy and dressed, so his games are the team's.
   Lines only: these draws come after every other on the game's own line generator, so no result moves. */
function fbBenchLines(rng,c,L,X){
  const hurt=new Set(c.sea&&c.sea.talent?c.sea.talent.active(c.tm).map(x=>x.idx):[]), onF=new Set(c.act.map(x=>x.pl));
  const bk=i=>{ const p=c.R[BK(i)]; return p&&p.n&&!hurt.has(BK(i))&&!onF.has(p)&&c.R[i]&&onF.has(c.R[i])?p:null };
  const ent=(i,keys)=>{ const j=BK(i), p=c.R[j]; const e=X[j]=X[j]||{pl:p,pos:POS[i].p,line:{}}; keys.forEach(k=>{ if(e.line[k]==null)e.line[k]=0 }); return e.line };
  const Q=L[0];
  if(Q&&Q.cmp!=null){ const B=[[2,0.10],[3,0.05]].filter(([i])=>bk(i));
    if(B.length){ const own=[2,3].reduce((t,i)=>t+(L[i]&&L[i].rec||0),0)+Object.values(X).reduce((t,e)=>t+(e.line.rec||0),0);
      const ownY=[2,3].reduce((t,i)=>t+(L[i]&&L[i].cyd||0),0)+Object.values(X).reduce((t,e)=>t+(e.line.cyd||0),0);
      const rest=Math.max(0,Q.cmp-own), restY=Math.max(0,Q.pyd-ownY), d=splitDraw(rng,rest,B.map(b=>b[1]).concat([0.35]));
      B.forEach(([i],j)=>{ const l=ent(i,["rec","cyd","ctd"]); l.rec+=d[j]; l.cyd+=rest>0?Math.floor(restY*d[j]/rest):0 }) } }
  [8,9].forEach(i=>{ if(!bk(i))return; const l=ent(i,["tkl","pd","ints"]); l.tkl+=Math.round(rng.r()*3.4); if(rng.r()<0.18)l.pd++; if(l.ints&&l.tkl<1)l.tkl=1 });
}
function addStats(dst,src){
  dst.g=(dst.g||0)+1;
  Object.keys(src).forEach(k=>dst[k]=(dst[k]||0)+src[k]);
}

/* Human-readable season line. */
function statLine(pos,s){
  if(!s||!s.g)return "";
  const n=x=>x.toLocaleString();
  if(pos==="QB")return `${n(s.pyd)} yds, ${s.ptd} TD, ${s.int} INT (${s.cmp}/${s.att})`+(s.rtd?`, ${s.rtd} rush TD`:"");
  if(pos==="RB")return `${n(s.ryd)} yds, ${s.rtd} TD (${s.car} car)`;
  if(pos==="WR"||pos==="WR2")return `${s.rec} rec, ${n(s.cyd)} yds, ${s.ctd} TD`;
  if(pos==="OT")return `${s.pan} pancake${s.pan===1?"":"s"}, ${s.ska} sack${s.ska===1?"":"s"} allowed`;   // "1 SACKS ALLOWED" (Instinct)
  if(pos==="EDGE"||pos==="DT")return `${s.tkl} tkl, ${s.sck} sack${s.sck===1?"":"s"}, ${s.tfl} TFL`;
  if(pos==="LB")return `${s.tkl} tkl, ${s.tfl} TFL, ${s.pd} PD`+(s.ints?`, ${s.ints} INT`:"");
  return `${s.tkl} tkl, ${s.ints} INT, ${s.pd} PD`;
}

/* Award production, built from what a player actually did. */
function statProd(pos,s){
  if(!s||!s.g)return 0;
  if(pos==="QB")  return s.pyd*0.042 + s.ptd*4.4 - s.int*3.0 + (s.ryd||0)*0.05 + (s.rtd||0)*4.4;   // engine 26: and his runs
  if(pos==="RB")  return s.ryd*0.062 + s.rtd*4.6;
  if(pos==="WR")  return s.cyd*0.060 + s.ctd*4.6 + s.rec*0.32;
  if(pos==="WR2") return s.cyd*0.046 + s.ctd*3.4;
  if(pos==="OT")  return s.pan*0.55 - s.ska*0.9;
  if(pos==="EDGE")return s.sck*5.2 + s.tfl*1.9 + s.tkl*0.30;
  if(pos==="DT")  return s.sck*4.6 + s.tfl*1.7 + s.tkl*0.28;
  if(pos==="LB")  return s.tkl*0.55 + s.tfl*2.1 + s.pd*1.1 + (s.ints||0)*6;
  return s.ints*7.2 + s.pd*1.7 + s.tkl*0.38;
}


/* ---- stats pages (round 69): column labels and the league's leader boards ---- */
const STAT_ABBR={cmp:"Cmp",att:"Att",pyd:"Yds",ptd:"TD",int:"Int",car:"Car",ryd:"Yds",rtd:"TD",rec:"Rec",cyd:"Yds",ctd:"TD",pan:"Pancakes",ska:"Sacks allowed",tkl:"Tkl",sck:"Sacks",tfl:"TFL",pd:"PD",ints:"Int"};
const LEADERS=[
  {l:"Passing yards",pos:["QB"],v:s=>s.pyd||0},{l:"Passing touchdowns",pos:["QB"],v:s=>s.ptd||0},
  {l:"Rushing yards",pos:["RB","QB"],v:s=>s.ryd||0},{l:"Rushing touchdowns",pos:["RB","QB"],v:s=>s.rtd||0},
  {l:"Receiving yards",pos:["WR","WR2"],v:s=>s.cyd||0},{l:"Receptions",pos:["WR","WR2"],v:s=>s.rec||0},{l:"Receiving touchdowns",pos:["WR","WR2"],v:s=>s.ctd||0},
  {l:"Sacks",pos:["EDGE","DT","LB"],v:s=>s.sck||0,f:v=>v.toFixed(1).replace(/\.0$/,"")},{l:"Tackles",pos:["EDGE","DT","LB","CB","S"],v:s=>s.tkl||0},
  {l:"Interceptions",pos:["CB","S","LB"],v:s=>s.ints||0}];

/* round 87: attributes (core 93_attrs), by position group: they make up the rating and grow with age. Round 91
   (engine 14): they play in the drive engine (50_drives fbShapeOf, FB14), and training focus comes to football. */
const ATTRS={
  name:{arm:"Arm",acc:"Accuracy",spd:"Speed",hnd:"Hands",blk:"Blocking",str:"Strength",rsh:"Pass rush",cov:"Coverage",tkl:"Tackling",vis:"Vision"},
  desc:{arm:"the deep ball: touchdowns",acc:"fewer picks, drives that keep going",spd:"breakaways",hnd:"fewer drops and fumbles, drives that keep going",blk:"protection: drives that stall get further",str:"short yardage: drives that keep going",
    rsh:"sacks: their drives stall sooner",cov:"fewer touchdowns allowed, more picks",tkl:"stops breakaways, forces fumbles",vis:"reading the field (with each position's main job)"},
  band:{arm:"p",acc:"t",spd:"p",hnd:"t",blk:"t",str:"p",rsh:"t",cov:"m",tkl:"t",vis:"m"},
  group:p=>p==="QB"?"QB":p==="RB"?"RB":/^WR/.test(p)?"WR":p==="OT"?"OL":/^(EDGE|DT)$/.test(p)?"DL":p==="LB"?"LB":"DB",
  w:{QB:{arm:.3,acc:.4,vis:.2,spd:.1}, RB:{spd:.4,vis:.25,hnd:.15,blk:.1,str:.1}, WR:{spd:.4,hnd:.45,vis:.15},
     OL:{blk:.55,str:.35,vis:.1}, DL:{rsh:.5,str:.3,tkl:.15,spd:.05}, LB:{tkl:.4,cov:.2,vis:.2,rsh:.1,spd:.1}, DB:{cov:.5,spd:.3,tkl:.1,vis:.1}},
  lean:{},
  role:{arm:"Gunslinger",acc:"Field general",spd:"Burner",hnd:"Possession receiver",blk:"Road grader",str:"Mauler",rsh:"Pass rusher",cov:"Cover man",tkl:"Thumper",vis:"Instinctive"},
  roleBy:{QB:{spd:"Dual threat",vis:"Field general"}, RB:{spd:"Home-run hitter",vis:"Patient runner",str:"Power back",hnd:"Third-down back",blk:"Third-down back"},
    WR:{spd:"Deep threat",hnd:"Possession receiver",vis:"Route runner"}, OL:{blk:"Pass protector",str:"Mauler",vis:"Technician"},
    DL:{rsh:"Pass rusher",str:"Run stuffer",tkl:"Run stuffer"}, LB:{cov:"Coverage backer",rsh:"Blitzer",tkl:"Thumper"}, DB:{cov:"Lockdown corner",spd:"Ball hawk",tkl:"Enforcer"}},
  plays:()=>ENGINE_V>=14,   // round 91: the attributes play (engine 14)
  train:{"Passing game":{groups:["QB","WR"],keys:["arm","acc","hnd","spd","vis"]}, "Run game":{groups:["RB","OL"],keys:["blk","str","spd","vis","hnd"]},
         "Front seven":{groups:["DL","LB"],keys:["rsh","str","tkl","cov","spd"]}, "Secondary":{groups:["DB"],keys:["cov","spd","tkl","vis"]}}
};
