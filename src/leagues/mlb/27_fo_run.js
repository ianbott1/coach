/* ============ pro baseball: the front office's winter (engine 27) ============
   The summer of a career on the front office's rules (24_fo), in a baseball GM's order:
     0. the season's own record: service time, the farm moves made in it
     1. the season's bills: the competitive balance tax, and the owner's mood
     2. contracts: a man with six years is a free agent when his deal ends (re-signed, given the qualifying offer, or
        let go); a man under club control is tendered (pre-arbitration, or arbitration on the season he had) or not
     3. everyone ages (the farm on its own dice, by level), some retire
     4. the draft: every pick joins the farm at Single-A
     5. the farm's prospects ready to play take the empty places; free agency (days of bidding, each club inside its
        owner's limit, each man choosing his offer); the rest of the empty places from the farm, then fill-ins
     6. the 40-man: the best prospects protected; a man beaten by a prospect is optioned or designated for assignment */
function mlbMigrate(u){
  if(u.mlbFO)return;
  NAMES.forEach(t=>{ const tier=mlbTier(t);
    (u.roster[t]||[]).forEach(p=>{ if(!p)return;
      p.svc=mlbSvcStart(p);
      // a small market's men are younger in service (a later debut), a big market's veterans signed for more
      p.svc=Math.max(0,Math.round((p.svc+(tier>=4?1:tier>=3?0.5:tier<=1?-1.2:0))*1000)/1000);
      p.svDays=172;
      const cl=mlbClass(p,null);
      if(cl.c==="fa"){ const h=(strHash("deal|"+p.n)%1000)/1000, f=(tier>=4?1.5:tier>=3?1.2:tier<=1?0.7:0.95)*(0.85+h*0.3);
        p.k={sal:Math.round(Math.max(MLB$.min,mlbMarket(p.r,p.p,p.age)*f)*100)/100,yrs:Math.max(1,p.k&&p.k.yrs||1),t:"fa",v:3} }
      else { const k0={sal:MLB$.min}; p.k=k0; p.k={sal:mlbControlSal(Object.assign({},p,{k:k0}),cl),yrs:1,t:cl.c,y:cl.y,v:3} } }) });
  mlbFarmInit(u);
  u.mlbFO=1; u.mlbTaxN={}; u.mlbOwn={}; u.mlbPk={};
}

/* ---- the season's own record, folded into the universe as the summer opens ---- */
function mlbFold(u){
  if(u.mlbFoldY===u.year)return; u.mlbFoldY=u.year;   // once a summer (the summer screen folds it as it opens; a reload, again)
  const E=typeof SEA!=="undefined"&&SEA&&SEA.year===u.year?SEA:null, M=E&&E.mlb;
  if(M&&M.moves&&typeof mlbReplayMove==="function")M.moves.forEach(m=>mlbReplayMove(u,m));
  NAMES.forEach(t=>{ (u.roster[t]||[]).forEach(p=>{ if(!p)return;
      const d=M&&M.days&&M.days[t]&&M.days[t][p.n]!=null?M.days[t][p.n]:172;
      p.svDays=Math.min(172,d); p.svc=Math.round(((p.svc||0)+Math.min(1,d/MLB$.svcDay))*1000)/1000;
      p.qoOK=!M||!M.start||(M.start[t]&&M.start[t].indexOf(p.n)>=0) });
    ((u.farm&&u.farm[t])||[]).forEach(p=>{ const d=M&&M.days&&M.days[t]&&M.days[t][p.n]||0;
      if(d){ p.svc=Math.round(((p.svc||0)+Math.min(1,d/MLB$.svcDay))*1000)/1000; p.svDays=d } else p.svDays=0;
      // a 40-man man who spent part of the season in the minors uses an option year
      if(p.on40&&d<160){ p.optY=p.optY||[]; if(p.optY.indexOf(u.year)<0)p.optY.push(u.year) } }) });
}

function mlbRun27(u,rng,healthy,elo,rec,choices){
  mlbMigrate(u);
  const U_CH=choices.users||(choices.userTeam?{[choices.userTeam]:choices}:{});
  const DN=draftNight(u,rec,elo,U_CH,MLB_ROUNDS);
  const chFor=t=>U_CH[t]||null, ut=choices.userTeam, human=t=>!!U_CH[t];
  if(ut&&choices.coach){const c=choices.coach; u.coach[ut]={n:c.n,q:c.q,t:0,hired:true,arch:c.arch,rec:c.rec||0}}
  const rep={resigned:{},released:{},retired:{},grew:{},drafted:{},signed:{},filled:{},tendered:{},nontender:{},qo:{},bills:{},farmUp:{},farmGrew:{},dfa:{},opt:{},forfeit:{}};
  NAMES.forEach(t=>Object.keys(rep).forEach(k=>{ if(k!=="bills")rep[k][t]=[] }));
  const pool=[], risers=[], fallers=[];
  u.alumni=u.alumni||{};
  const leave=(t,p,why)=>{
    if(p.joined>u.year)return;
    u.alumni[t]=u.alumni[t]||[];
    u.alumni[t].push({n:p.n,p:p.p,from:Math.min(u.year,p.joined||u.year-(p.yrsHere||1)),to:u.year,peak:p.peak||p.r,yrs:p.yrsHere||1,draft:p.draft||null,
      line:LEAGUE.records.alumniLine({p:p.p,car:p.car,yrs:p.yrsHere||1}),why:why,
      car:p.car?{h:p.car.h||0,hr:p.car.hr||0,rbi:p.car.rbi||0,w:p.car.w||0,l:p.car.l||0,k:p.car.k||0,sv:p.car.sv||0}:null});
    if(u.alumni[t].length>40){u.alumni[t].sort((a,b)=>b.peak-a.peak);u.alumni[t].length=40}
  };

  // 0. the season's record
  mlbFold(u);
  // 1. the bills, on the payroll each club ended the season with, and the owner's mood for next season
  const champ=typeof SEA!=="undefined"&&SEA&&SEA.year===u.year?SEA.champion:null;
  u.mlbTaxN=u.mlbTaxN||{}; u.mlbOwn=u.mlbOwn||{}; u.mlbPk=u.mlbPk||{};
  NAMES.forEach(t=>{ const pay=mlbTaxPay(u,t), r0=mlbRep(u,t), tax=mlbTaxBill(pay,r0);
    const e=LEAGUE.goals.expectations((u.program&&u.program[t])||1500), w=rec[t][0], l=rec[t][1], wp=w/Math.max(1,w+l), ew=e.w/162;
    const m=champ===t||wp>=ew+0.06?1:tax>0&&wp<ew-0.04?-1:wp<ew-0.08?-1:0;
    rep.bills[t]={pay:pay,tax:tax,rep:r0,over:Math.round((pay-MLB$.cbt)*10)/10,mood:m,budget:mlbBudget(u,t)};
    u.mlbTaxN[t]=tax>0?r0+1:0;
    u.mlbOwn[t]=m });
  const payers=new Set(NAMES.filter(t=>rep.bills[t].tax>0));
  // the club's top pick moves back ten places next draft when it was $40M or more over (24_fo mlbPickOwner)
  u.mlbBack={y:u.year+1,t:NAMES.filter(t=>rep.bills[t].over>=MLB$.pickBack)};
  // super two for this winter
  const s2=mlbSuper2([].concat(...NAMES.map(t=>(u.roster[t]||[]).filter(Boolean))));

  // 2. contracts, and 3. aging and retirement (the order of the old summer, so its dice fall the same way per club)
  NAMES.forEach(t=>{
    const before=u.program[t], c=u.coach[t], R=u.roster[t], ch=chFor(t);
    u.program[t]+=0.05*(elo[t]-u.program[t])+c.q*COACH_BUILD*0.4+rng.gauss(0,9);
    u.program[t]=Math.max(1320,Math.min(1680,u.program[t]));
    c.t++;
    const plan=mlbPlan(u,t,s2,ch);
    for(let i=0;i<R.length;i++){
      const p=R[i]; if(!p)continue;
      p.yrsHere=(p.yrsHere||0)+1;
      if(p.k.yrs>1){p.k.yrs--;continue}
      const x=plan[i]; if(!x)continue;
      if(x.act==="sign"){ p.k={sal:x.sal,yrs:x.yrs,t:"fa",v:3}; rep.resigned[t].push({n:p.n,p:p.p,r:p.r,sal:x.sal,yrs:x.yrs}) }
      else if(x.act==="tender"){ p.k={sal:x.sal,yrs:1,t:x.cl.c,y:x.cl.y,v:3}; rep.tendered[t].push({n:p.n,p:p.p,r:p.r,sal:x.sal,c:x.cl.c,y:x.cl.y||0,perf:x.cl.c==="arb"?mlbPerf(p):0}) }
      else if(x.act==="qo"&&x.accept){ p.k={sal:MLB$.qo,yrs:1,t:"qo",v:3}; p.qoHad=1; rep.qo[t].push({n:p.n,p:p.p,r:p.r,accepted:true}) }
      else { R[i]=null;
        if(x.act==="qo"){ p.qoHad=1; p.qoFrom=t; rep.qo[t].push({n:p.n,p:p.p,r:p.r,accepted:false}) }
        if(x.act==="nontender")rep.nontender[t].push({n:p.n,p:p.p,r:p.r,sal:x.sal});
        rep.released[t].push({n:p.n,p:p.p,r:p.r,why:x.act==="nontender"?"non-tendered":"free agent"});
        if(p.r>=HK_POOL&&vetOK(p)){p.from=t;pool.push(p)} else leave(t,p,"released") }
    }
    // aging (the season's men), as before
    let devMod=(ch&&ch.phil&&PHILOSOPHY[ch.phil])?PHILOSOPHY[ch.phil].dev*0.5:0;
    const ocq=(u.oc&&u.oc[t])?u.oc[t].q:0, dcq=(u.dc&&u.dc[t])?u.dc[t].q:0;
    R.forEach((p,i)=>{ if(!p)return;
      const was=p.r; p.age++; p.c=p.age; const a=p.age-age26(p);
      const mu=ageBase26(a)+c.q*0.02+devMod+(ocq+dcq)*0.01+(a<=29?orgEdge(u,t)*0.75:0)+featDev(ch,i)+(typeof moraleDev==="function"?moraleDev(p):0);
      develop26(u,p,a,mu,rng,{leap:+((typeof process!=="undefined"&&process.env&&process.env.NBA_LEAP)||0.07),floor:35});
      p.peak=Math.max(p.peak||0,p.r);
      if(p.r-was>=5)rep.grew[t].push({n:p.n,p:p.p,age:p.age,from:was,to:p.r,leap:p.leap===u.year}) });
    R.forEach((p,i)=>{ if(!p)return; const a=p.age-age26(p);
      const odds=a>=36?0.9:a>=35?0.6:a>=34?0.35:a>=33?0.18:a>=32?0.08:0;
      if(rng.r()<odds+(p.r<55&&a>=29?0.3:0)){R[i]=null;rep.retired[t].push({n:p.n,p:p.p,age:p.age,r:p.r});leave(t,p,"retired")} });
    POS.forEach((_,i)=>{if(!R[i]&&R[BK(i)]){R[i]=R[BK(i)];R[BK(i)]=null}});
    const d=u.program[t]-before; if(d>30)risers.push([t,Math.round(d)]); if(d<-30)fallers.push([t,Math.round(d)]);
  });
  // the farm's summer (its own dice): development, levels, the men going nowhere let go, the levels refilled
  NAMES.forEach(t=>mlbFarmSummer(u,t,rep.farmGrew[t]).forEach(p=>{}));

  // agreed trades
  rep.trade={};
  Object.keys(U_CH).forEach(t=>{const ch=U_CH[t]; if(ch&&ch.trade)nflApplyTrade(u,t,ch.trade,rep,leave,pool)});
  NAMES.forEach(t=>POS.forEach((_,i)=>{const R=u.roster[t]; if(!R[i]&&R[BK(i)]){R[i]=R[BK(i)];R[BK(i)]=null}}));

  // 4. the draft: every pick to the farm
  delete u.draftClass;
  const picks=mlbPlaceDraft(u,DN,rep);
  Object.keys(u.mlbPk).forEach(k=>{ if(+k.split("|")[0]<=u.year)delete u.mlbPk[k] });

  // 5a. prospects ready to play take the empty places
  NAMES.forEach(t=>{ if(!human(t)||chFor(t).farmAuto!==false)mlbFillFromFarm(u,t,rep,56) });
  // 5b. free agency
  mlbMarket27(u,rng,elo,U_CH,pool,rep,payers,leave);
  // 5c. the rest of the empty places: the farm, then fill-ins (minor-league free agents)
  NAMES.forEach(t=>{ mlbFillFromFarm(u,t,rep,0);
    const R=u.roster[t];
    for(let i=0;i<R.length;i++)if(!R[i]){
      const p=nflPlayer(rng,53+rng.range(0,5),24+rng.int(8),i%POS.length);
      p.svc=Math.max(0,Math.round((mlbSvcStart(p)-1)*1000)/1000); p.k={sal:MLB$.min,yrs:1,t:mlbClass(p,null).c==="fa"?"fa":"pre",v:3}; p.joined=u.year+1; R[i]=p;
      rep.filled[t].push({n:p.n,p:p.p,r:p.r}) } });
  // 6. depth: a prospect who beats a man in the majors takes his place (the computer's clubs; yours by your choice)
  NAMES.forEach(t=>{ if(!human(t)||chFor(t).farmAuto!==false)mlbDepthMoves(u,t,rep,leave) });
  mlbProtect(u);
  NAMES.forEach(t=>u.roster[t].forEach(p=>{ if(p){ delete p.keep; delete p.qoOK } }));

  NAMES.forEach(t=>{
    const R=u.roster[t];
    POS.forEach((_,i)=>{const s=R[i],b=R[BK(i)]; if(b.r>s.r+1){R[i]=b;R[BK(i)]=s}});
    R.forEach((p,i)=>{p.i=i%POS.length});
    const c=u.coach[t];
    u.trueBase[t]=rosterElo(R)+(c.t<=1?ROOKIE_DIP:0)+rng.gauss(0,ROSTER_NOISE*0.6);
    u.perceived[t]=0.55*elo[t]+0.45*rosterElo(R)+rng.gauss(0,PERCEPT_N*0.6);
  });
  if(ut&&choices.phil)u.phil=choices.phil;
  u.year++;
  risers.sort((a,b)=>b[1]-a[1]); fallers.sort((a,b)=>a[1]-b[1]);
  if(typeof S!=="undefined"&&S)S.lastNbaRep={rep:rep,picks:picks};
  return {risers:risers.slice(0,5),fallers:fallers.slice(0,5),draft:{picks:picks},contracts:rep,
    cap:Object.fromEntries(NAMES.map(t=>[t,Math.round(payroll(u.roster[t])*10)/10]))};
}

/* ---- each club's winter plan for the men whose deals end: a free agent kept (at his market, while the owner's limit
   allows), given the qualifying offer, or let go; a man under control tendered at his salary or not. Yours: what you
   chose on the summer screen, the staff's plan otherwise ---- */
function mlbPlan(u,t,s2,ch){
  const R=u.roster[t], out={}, ending=[];
  let pay=0;
  R.forEach((p,i)=>{ if(!p)return; if(p.k.yrs>1){ pay+=p.k.sal; return } ending.push(i) });
  const B=mlbBudget(u,t), rep=mlbRep(u,t), fits=add=>pay+add+mlbTaxBill(pay+add,rep)<=B*0.97;
  // the men under control first (they're cheap), then the free agents best first
  const ctl=ending.filter(i=>mlbClass(R[i],s2).c!=="fa"), fa=ending.filter(i=>mlbClass(R[i],s2).c==="fa").sort((a,b)=>R[b].r-R[a].r);
  ctl.forEach(i=>{ const p=R[i], cl=mlbClass(p,s2), sal=mlbControlSal(p,cl);
    const mine=ch&&ch.tender&&ch.tender[i]!==undefined?!!ch.tender[i]:null;
    const worth=i<POS.length?p.r>=50:p.r>=47&&sal<=Math.max(2,mlbMarket(p.r,p.p,p.age+1)*1.3);
    const keep=mine!==null?mine:worth&&(sal<=3||fits(sal));
    out[i]={act:keep?"tender":"nontender",sal:sal,cl:cl}; if(keep)pay+=sal });
  fa.forEach(i=>{ const p=R[i], ask=mlbMarket(p.r,p.p,p.age+1), yrs=mlbFaYears(p.age+1,p.r);
    const mine=ch&&ch.resign&&ch.resign[i]!==undefined?!!ch.resign[i]:null, myQo=ch&&ch.qo&&ch.qo[i];
    const qoOK=p.qoOK!==false&&!p.qoHad;
    const want=(i<POS.length?p.r>=RS_BAR:p.r>=RB_BAR&&ask<=6)&&vetOK(p);
    const keep=mine!==null?mine:want&&fits(ask)&&mlbHash(t+"|"+p.n+"|"+u.year)<0.55;   // about half of the free agents a club wants to keep re-sign before the market opens
    if(keep){ out[i]={act:"sign",sal:ask,yrs:yrs}; pay+=ask; return }
    const offer=qoOK&&(ch?!!myQo:(ask>=MLB$.qo*0.85&&want&&fits(MLB$.qo)));
    if(offer){ const acc=mlbQoAccept(p,u); out[i]={act:"qo",accept:acc}; if(acc)pay+=MLB$.qo; return }
    out[i]={act:"go"} });
  return out }
const mlbHash=s=>(strHash(s)%10000)/10000;
/* a man takes the qualifying offer when the market would pay him less a year, and now and then when it's close and he
   wants another year to raise his price (about one in eight of those offered took it, 2012-25) */
function mlbQoAccept(p,u){ const M=mlbMarket(p.r,p.p,p.age+1);
  return M<MLB$.qo*0.7||(M<MLB$.qo&&(p.age+1>=33||mlbHash("qo|"+p.n+"|"+u.year)<0.2)) }

/* the draft's picks join the farm at Single-A (a college man at Double-A): minor-league deals, off the 40-man */
function mlbPlaceDraft(u,DN,rep){
  const byPid={}; DN.prospects.forEach(p=>byPid[p.pid]=p); const out=[];
  DN.picks.forEach(d=>{ const t=d.team, p=byPid[d.pid];
    p.draft={round:d.round,pick:d.pick,overall:d.overall,team:t,year:u.year};
    p.k={sal:0,yrs:0,t:"minor"}; p.joined=u.year+1; p.drafted=true; p.svc=0; p.lvl=p.age>=21?"AA":"A"; p.org=t; p.i=POS.findIndex(P=>P.p===p.p);
    u.farm[t]=u.farm[t]||[]; mlbNames(u,t,[p],u.farm[t]); u.farm[t].push(p);
    rep.drafted[t].push({n:p.n,p:p.p,r:p.r,pot:p.pot,from:p.from,d:p.draft,made:false,farm:p.lvl});
    out.push({n:p.n,p:p.p,team:t,r:p.r,pot:p.pot,from:p.from,d:p.draft,made:false,farm:p.lvl,pid:p.pid}) });
  if(DN.boardGone)rep.boardGone=DN.boardGone;
  return out }

/* who in the farm can play a place: his own position; any pitcher in the rotation; any hitter as the designated hitter */
function mlbFits(p,i){ const P=POS[i].p, q=String(p.p);
  if(q===P)return true; if(/^SP/.test(P)&&/^SP/.test(q))return true; if(P==="DH"&&!isPitcher(q))return true; return false }
/* a farm man joins the active roster at place k (a slot of the 26) */
function mlbCallUp(u,t,p,k){ const F=u.farm[t]; F.splice(F.indexOf(p),1);
  p.p=POS[k%POS.length].p; p.i=k%POS.length; p.lvl=null; p.on40=0; p.joined=p.joined||u.year+1;
  if(!p.k||p.k.t==="minor")p.k={sal:MLB$.min,yrs:1,t:"pre",v:3};
  if(typeof attrGen==="function"&&typeof attrOn==="function"&&attrOn()&&!Array.isArray(p.at)){ p.at=attrGen(u,p); p.ar=p.r }
  u.roster[t][k]=p }
function mlbFillFromFarm(u,t,rep,minR){
  const R=u.roster[t], F=(u.farm&&u.farm[t])||[];
  for(let k=0;k<R.length;k++){ if(R[k])continue;
    const c=F.filter(p=>p.lvl!=="A"&&mlbFits(p,k%POS.length)&&p.r>=minR).sort((a,b)=>b.r-a.r)[0]; if(!c)continue;
    if(!c.on40&&mlb40(u,t)>=40)mlbClear40(u,t,rep);
    rep.farmUp[t].push({n:c.n,p:POS[k%POS.length].p,r:c.r,age:c.age,from:c.lvl}); mlbCallUp(u,t,c,k) } }
/* room on the 40-man: the weakest 40-man man in the farm is taken off it (outrighted to Triple-A) */
function mlbClear40(u,t,rep){ const F=u.farm[t].filter(p=>p.on40).sort((a,b)=>mlbProsVal(a)-mlbProsVal(b))[0]; if(!F)return;
  F.on40=0; rep.dfa[t].push({n:F.n,p:F.p,r:F.r,to:"outrighted to Triple-A"}) }
/* a prospect who beats a man in the majors takes his place; the man goes down on an option, or is designated for
   assignment (another club may claim him; otherwise he goes to Triple-A, or a veteran leaves) */
function mlbDepthMoves(u,t,rep,leave){
  const R=u.roster[t], F=(u.farm&&u.farm[t])||[];
  for(let k=POS.length;k<R.length;k++){ const s=k%POS.length, b=R[k]; if(!b)continue;
    const c=F.filter(p=>p.lvl==="AAA"&&mlbFits(p,s)&&p.r>=b.r+3).sort((a,b2)=>b2.r-a.r)[0]; if(!c)continue;
    if(b.k&&b.k.sal>6)continue;                              // a man paid real money keeps his place
    R[k]=null;
    if(mlbCanOption(b)){ b.lvl="AAA"; b.on40=1; F.push(b); rep.opt[t].push({n:b.n,p:b.p,r:b.r}) }
    else { rep.dfa[t].push({n:b.n,p:b.p,r:b.r,to:mlbWaivers(u,t,b,leave)}) }
    rep.farmUp[t].push({n:c.n,p:POS[s].p,r:c.r,age:c.age,from:c.lvl}); mlbCallUp(u,t,c,k) } }
/* waivers: the club with the worst record whose man at that place is weaker, with room, claims him with his contract;
   unclaimed, a man with three years goes to free agency, a younger man to Triple-A off the 40-man */
function mlbWaivers(u,from,p,leave){
  const order=NAMES.slice().sort((a,b)=>(u.perceived[a]||0)-(u.perceived[b]||0)||(a<b?-1:1));
  for(const t of order){ if(t===from)continue; const R=u.roster[t], k=BK(POS.findIndex(P=>P.p===String(p.p)));
    if(k<POS.length||!R[k]||R[k].r>=p.r-2||mlb40(u,t)>=40)continue;
    if(mlbRoomFor(u,t,payroll(R))<p.k.sal)continue;
    const out=R[k]; R[k]=p; p.joined=u.year+1; p.yrsHere=0;
    if(mlbCanOption(out)){ out.lvl="AAA"; out.on40=1; u.farm[t].push(out) } else leave(t,out,"released");
    return "claimed by "+t }
  if((p.svc||0)>=3){ leave(from,p,"released"); return "released" }
  p.lvl="AAA"; p.on40=0; p.k={sal:0,yrs:0,t:"minor"}; u.farm[from].push(p); return "outrighted to Triple-A" }

/* ---- free agency: days of bidding (as pro basketball's, 24_cap nbaFaPref). Each day every club makes the offers its
   owner's limit allows (a contender to the limit, a rebuilding club little, and only for young men), and each man weighs
   his: the money against his market, the years, winning, the role he'd have, his old club. A man who turned down the
   qualifying offer costs the club that signs him draft picks, which go to the club he left. ---- */
const MLB_FAD=6;
function mlbFaPref(u,p,o,elo,parts){
  const R=u.roster[o.t], pY=mlbFaYears(p.age,p.r), s=R[p.i], b=R[BK(p.i)];
  const money=o.sal/Math.max(p.ask||0,MLB$.min);
  const yrs=(p.age>=30?0.035:0.02)*Math.max(-3,Math.min(2,o.yrs-pY));
  const e=elo&&elo[o.t]!=null?elo[o.t]:1500, win=(e-1500)/100*(p.age>=30?0.08:0.05);
  const role=(!s||p.r>s.r?0.06:!b||p.r>b.r?0:-0.08)*(p.r>=56?1:0.5);
  const home=o.t===p.from?0.03:0;
  if(parts)return {money:money,yrs:yrs,win:win,role:role,home:home};
  return money+yrs+win+role+home+(o.nz||0) }
const mlbFaHold=(p,d)=>(p.r>=66?1.08:p.r>=60?1.03:0.98)-0.04*d;
function mlbMarket27(u,rng,elo,U_CH,pool,rep,payers,leave){
  pool.forEach(p=>{ p.ask=mlbMarket(p.r,p.p,p.age); p.i=POS.findIndex(P=>P.p===p.p) });
  rep.targets={};
  const rank=NAMES.slice().sort((a,b)=>elo[b]-elo[a]);
  const styleOf=t=>{ const ch=U_CH[t]; if(ch&&ch.fa)return ch.fa; const k=rank.indexOf(t); return k<10?"contend":k>=22?"young":"balanced" };
  const share={contend:1,balanced:0.8,young:0.45}, maxAge={contend:36,balanced:32,young:28};
  const offers=[], live=o=>!o.dead&&!o.p.signed;
  const committed=t=>offers.filter(o=>o.t===t&&live(o)).reduce((s,o)=>s+o.sal,0);
  const roomOf=t=>mlbRoomFor(u,t,payroll(u.roster[t])+u.roster[t].filter(x=>!x).length*MLB$.min);
  const sign=(o,d)=>{ const p=o.p, t=o.t, R=u.roster[t];
    p.signed=true; p.k={sal:o.sal,yrs:o.yrs,t:"fa",v:3}; p.yrsHere=0; p.joined=u.year+1; if(o.user)p.keep=true;
    const out=nflPlace(R,p), n=offers.filter(x=>x.p===p&&!x.dead).length;
    rep.signed[t].push({n:p.n,p:p.p,r:p.r,age:p.age,sal:o.sal,yrs:o.yrs,from:p.from,day:d+1,bids:n,target:!!o.user,qo:!!p.qoFrom});
    offers.forEach(x=>{ if(x.p===p&&x!==o&&!x.dead){x.dead=1; x.lost=o} }); o.won=1;
    if(p.qoFrom&&p.qoFrom!==t)mlbForfeit(u,t,p.qoFrom,payers,rep,p);
    if(out){ rep.released[t].push({n:out.n,p:out.p,r:out.r,why:"fa"});
      if(mlbCanOption(out)&&(out.svc||0)<6){ out.lvl="AAA"; out.on40=1; u.farm[t].push(out); rep.opt[t].push({n:out.n,p:out.p,r:out.r}) }
      else if(out.r>=HK_POOL&&!out.signed){ out.from=t; out.ask=mlbMarket(out.r,out.p,out.age); out.i=POS.findIndex(P=>P.p===out.p); pool.push(out) } else leave(t,out,"released") } };
  // your targets: an offer each, from the first day, at your price (or his ask and about 10%) and years
  const tgt={};
  Object.keys(U_CH).forEach(t=>{ const ch=U_CH[t]; if(!ch||!ch.targets||!ch.targets.length||!u.roster[t])return;
    rep.targets[t]=[];
    ch.targets.forEach(key=>{ const p=pool.find(x=>!x.signed&&faKey(x.from,x)===key), [team,n,pos]=key.split("|");
      if(!p){ rep.targets[t].push({n:n,p:pos,from:team,got:false,why:"wasn't on the market (retired or re-signed)"}); return }
      const b=ch.bids&&ch.bids[key], o={t:t,p:p,sal:Math.round((b&&b.sal?+b.sal:p.ask*1.1)*100)/100,yrs:b&&b.yrs?b.yrs|0:mlbFaYears(p.age,p.r),user:1,nz:0,key:key,team:team};
      offers.push(o); (tgt[t]=tgt[t]||[]).push(o) }) });
  for(let d=0;d<MLB_FAD;d++){
    const pull={}; NAMES.forEach(t=>pull[t]=elo[t]+rng.gauss(0,45));
    NAMES.slice().sort((a,b)=>pull[b]-pull[a]).forEach(t=>{
      if(tgt[t]&&tgt[t].some(live)&&d<2)return;
      const mine=offers.filter(o=>o.t===t&&live(o)); if(mine.length>=2)return;
      const R=u.roster[t], st=styleOf(t), room=roomOf(t)*share[st]-committed(t);
      let best=null,bv=0;
      pool.forEach(p=>{ if(p.signed||p.age-age26(p)>maxAge[st]||p.from===t||mine.some(o=>o.p===p))return;
        const bk=R[BK(p.i)]; if(bk&&bk.keep)return;
        let cost=Math.round(p.ask*(1+Math.max(0,rng.gauss(0.04,0.07))+(room>3*p.ask&&p.ask>5?0.06:0))*(1-orgEdge(u,t)*0.04)*100)/100;
        cost=Math.max(MLB$.min,cost);
        if(cost>room&&cost>MLB$.min+0.05){ if(room>=p.ask*0.85)cost=Math.round(room*100)/100; else return }
        // a qualifying-offer man costs picks: worth a little less to a club
        const v=nflGain(R,p)-cost/PAY*0.08*Math.min(1.6,150/mlbBudget(u,t))-(p.qoFrom?0.25:0);   // a rich club minds the money less
        if(v>bv){bv=v;best=[p,cost]} });
      if(!best||bv<0.8)return;
      const [p,cost]=best; offers.push({t:t,p:p,sal:cost,yrs:mlbFaYears(p.age,p.r),nz:rng.gauss(0,0.03),d:d}) });
    pool.filter(p=>!p.signed&&offers.some(o=>o.p===p&&!o.dead)).sort((a,b)=>b.r-a.r).forEach(p=>{
      const L=offers.filter(o=>o.p===p&&!o.dead).map(o=>({o:o,s:mlbFaPref(u,p,o,elo)})).sort((a,b)=>b.s-a.s);
      if(L[0].s<mlbFaHold(p,d)&&d<MLB_FAD-1)return;
      for(const x of L){ const t=x.o.t, room=roomOf(t)+x.o.sal;
        if(x.o.sal>room+0.05&&x.o.sal>MLB$.min+0.05&&!x.o.user){ x.o.dead=1; x.o.broke=1; continue }
        sign(x.o,d); break } });
  }
  Object.keys(tgt).forEach(t=>tgt[t].forEach(o=>{ const p=o.p, e={n:p.n,p:p.p,from:o.team};
    if(o.won){ rep.targets[t].push(Object.assign(e,{got:true,sal:o.sal,yrs:o.yrs})); return }
    let why;
    if(o.lost){ const w=o.lost, a=mlbFaPref(u,p,o,elo,1), b=mlbFaPref(u,p,w,elo,1), r=[];
      if(b.money>a.money+0.04)r.push("more money"); if(b.yrs>a.yrs+0.02)r.push(w.yrs>o.yrs?"more years":"the years he wanted"); if(b.win>a.win+0.02)r.push("a better team");
      if(b.role>a.role+0.02)r.push(b.role>0?"a starting job":"a bigger role"); if(b.home>a.home)r.push("his old club");
      why=`signed with ${w.t} (${money2(w.sal)} for ${nOf(w.yrs,"year")}${r.length?": "+r.join(", "):""})` }
    else why=p.signed?"signed elsewhere":"didn't take your offer";
    rep.targets[t].push(Object.assign(e,{got:false,why:why,bid:o.sal})) }));
  pool.filter(p=>!p.signed).forEach(p=>leave(p.from,p,"unsigned"));
}
/* the picks a club gives up for a man who turned down a qualifying offer, by its status (a tax payer its second- and
   fifth-round picks, a revenue-sharing club its third, any other its second), go to the club he left. The real
   compensation is a new pick at the end of the first round, after the second competitive-balance round or after the
   fourth round by the losing club's status; the game's draft has a fixed number of picks, so the forfeited pick moves */
function mlbForfeit(u,t,to,payers,rep,p){
  const y=u.year+1, want=payers.has(t)?[2,5]:mlbRecipient(t)?[3]:[2];
  const got=[];
  want.forEach(r0=>{ let r=r0; while(r<=MLB_ROUNDS&&u.mlbPk[y+"|"+t+"|"+r])r++; if(r>MLB_ROUNDS)return; u.mlbPk[y+"|"+t+"|"+r]=to; got.push(r) });
  rep.forfeit[t].push({n:p.n,to:to,rounds:got}); (rep.comp=rep.comp||{})[to]=(rep.comp[to]||[]).concat([{n:p.n,from:t,rounds:got}]) }
/* whose pick it is: a forfeited pick, and the top pick of a club $40M or more over the tax moved back ten places */
LEAGUE.pickOwner=function(u,orig,rd,slot){
  if(!u||!u.mlbFO)return null;
  const own=u.mlbPk&&u.mlbPk[u.year+"|"+orig+"|"+rd];
  if(own)return own;
  return null };

/* ---- the summer screen's side: the universe made ready as the summer opens (a career's first summer on these rules
   comes onto them now; the season's service time and moves are folded in), the choices it starts with, and the market
   it previews ---- */
const mlbNext=u=>!!(u&&(u.mlbFO||(typeof ENGINE_V!=="undefined"&&ENGINE_V>=27)));
function mlbPrep(u){ if(!mlbNext(u))return; mlbMigrate(u); if(typeof SEA!=="undefined"&&SEA&&SEA.year===u.year&&SEA.phase==="done")mlbFold(u) }
function mlbS2(u){ return mlbSuper2([].concat(...NAMES.map(t=>(u.roster[t]||[]).filter(Boolean)))) }
LEAGUE.afterRebuild=function(u){ if(typeof S!=="undefined"&&S&&S.off&&typeof SEA!=="undefined"&&SEA&&S.off.year===SEA.year)mlbPrep(u) };
{ const O=LEAGUE.offseason, open0=O.open, choices0=O.choices;
  O.init=function(u){ if((u.engV||0)>=27)mlbMigrate(u) };   // a new career on engine 27 opens on the front office's rules
  O.open=function(u,t,wins){
    if(!mlbNext(u))return open0.call(O,u,t,wins);
    mlbPrep(u);
    const R=u.roster[t], s2=mlbS2(u), plan=mlbPlan(u,t,s2,null), resign={}, qo={}, tender={}, asks={};
    R.forEach((p,i)=>{ if(!p||p.k.yrs>1)return; const cl=mlbClass(p,s2), x=plan[i]||{};
      if(cl.c==="fa"){ asks[i]={sal:mlbMarket(p.r,p.p,p.age+1),yrs:mlbFaYears(p.age+1,p.r),c:"fa",qoOK:p.qoOK!==false&&!p.qoHad,acc:mlbQoAccept(p,u)};
        resign[i]=x.act==="sign"; qo[i]=x.act==="qo" }
      else { asks[i]={sal:mlbControlSal(p,cl),yrs:1,c:cl.c,y:cl.y||0,perf:cl.c==="arb"?mlbPerf(p):0,s2:!!p.s2}; tender[i]=x.act==="tender" } });
    nflDraftClass(u,t);
    return {pool:mlbBudget(u,t), picks:{resign:resign, qo:qo, tender:tender, asks:asks, fa:"balanced", draft:"bpa", board:[], targets:[], bids:{}, block:null, trade:null, farmAuto:true}} };
  O.choices=function(P){ const c=choices0.call(O,P); if(P&&P.tender)Object.assign(c,{tender:P.tender, qo:P.qo||{}, bids:P.bids||null, farmAuto:P.farmAuto!==false}); return c };
}
/* who will be a free agent (the summer screen's list): the men other clubs' plans let go, turn down a qualifying offer
   for, or don't tender. The same plan the summer runs (mlbPlan), so the list is the market */
const nflFreeAgentPreview0=nflFreeAgentPreview;
nflFreeAgentPreview=function(u,myTeam,users){
  if(!mlbNext(u))return nflFreeAgentPreview0(u,myTeam,users);
  mlbPrep(u); const s2=mlbS2(u), out=[];
  NAMES.forEach(t=>{ if(t===myTeam)return; const R=u.roster[t], plan=mlbPlan(u,t,s2,users&&users[t]||null);
    R.forEach((p,i)=>{ const x=plan[i]; if(!p||!x||x.act==="sign"||x.act==="tender"||(x.act==="qo"&&x.accept))return;
      if(p.r<HK_POOL||!vetOK(Object.assign({},p,{age:p.age+1})))return;
      out.push({key:faKey(t,p),n:p.n,p:p.p,team:t,age:p.age+1,r:p.r,pot:p.pot,ask:Math.round(mlbMarket(p.r,p.p,p.age+1)*1.1*10)/10,
        qo:x.act==="qo",nt:x.act==="nontender"}) }) });
  return out.sort((a,b)=>(b.r+(b.pot-b.r)*0.3-b.age*0.2)-(a.r+(a.pot-a.r)*0.3-a.age*0.2)) };
