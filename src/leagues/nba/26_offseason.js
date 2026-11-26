/* ============ offseason: pro football ============ */
/* Players have ages and contracts. Each offseason, in order:
     1. expiring contracts are re-signed or let go (you choose for your team)
     2. everyone ages: better until about 27, flat, then decline after 30
        (quarterbacks three years later, running backs two years sooner)
     3. some retire
     4. the draft, worst record first, playoff teams by how far they went
     5. free agency, under a hard salary cap
     6. empty spots are filled with replacement-level players
   Salaries are in millions and cover the twenty players the sim tracks. */
const NFL_CAP=NBA$.cap;                      // the NBA's 2026-27 cap, $164.961M (24_cap: the front office's numbers)
/* Bird rights, simply: a team may go over the cap to re-sign its own players
   (and in trades), up to the real tax line, $200.428M; free agents from other
   teams must fit under the cap. With a hard cap for everything, good teams
   couldn't keep their own players and the league flattened within a few years
   (as the NFL's hard cap is meant to do). */
const TAX_LINE=NBA$.tax;
/* How well run a franchise is, from its slow-moving strength: good
   organisations develop players better, scout better, and free agents take
   a little less to join them. Without it the draft and free agency flatten
   the league within a few years. */
// centred on this league's own average franchise (pro football's was 1690)
const orgEdge=(u,t)=>Math.max(-1.5,Math.min(1.5,(u.program[t]-1500)/(+((typeof process!=="undefined"&&process.env&&process.env.NBA_OE)||100))));
const AGE_SHIFT={};                           // every position ages alike
const POS_PAY={};                             // and is paid alike
const MAX_DEAL=Math.round(NFL_CAP*0.35*10)/10; // a max contract: 35% of the cap

/* What the market pays veterans, scaled so payrolls of the players the sim
   tracks sit near the cap (Nov 2026: hockey payrolls were ~25 against 104,
   so the cap never bit). Rookie scales and minimums are real and stay. */
const PAY=+((typeof process!=="undefined"&&process.env&&process.env.PAY_NBA)||2.1);
const MAX_SAL=0.35*NFL_CAP;      // the league's maximum contract, as a share of the cap
function nflAsk(r,pos,age){ return nbaAsk(r,age) }   // the front office (Nov 2026): the real market's shape, 24_cap
function nflAskOld(r,pos,age){
  const x=Math.max(0,(r-55)/35);
  // scaled to this league's ratings: a typical starter (~64) about $15M, a
  // star (77+) the max, so payrolls sit near the cap and it binds
  let s=Math.min(MAX_DEAL,(2+120*Math.pow(x,1.6))*(POS_PAY[pos]||1));
  const a=age-(AGE_SHIFT[pos]||0);
  if(a>=31)s*=0.78; else if(a>=29)s*=0.9;
  return Math.round(Math.max(2,Math.min(MAX_SAL,s*PAY))*10)/10;   // veterans' pay, scaled to the cap; the minimum is real
}
function nflYears(age,pos,r){ return r!=null?nbaYears(age,r):age<=26?4:age<=29?3:age<=31?2:1 }
function payroll(roster){return roster.reduce((s,p)=>s+(p&&p.k?p.k.sal:0),0)}
const ROOKIE_ROOM=10;
const NBA_FA_R=50;                          // who reaches free agency rather than leaving the league (the front office: the bench too; was 58)                        // what re-signing leaves free for the draft class
/* Which expiring players a team keeps: the best first, while they fit. Worth
   keeping means a starter at least as good as the league's middle starter, or a useful backup at a fair price,
   not past 32 (round 63: the bar was 66 and kept about a quarter of expiring deals). */
const RS_BAR=+((typeof process!=="undefined"&&process.env&&process.env.NB_RS)||61), RB_BAR=+((typeof process!=="undefined"&&process.env&&process.env.NB_RB)||54);
function nflResignPlan(R,u,t){
  const exp=[], keep={}; let pay=0; RESIGN_WHY={};
  if(!u&&typeof U!=="undefined"&&U&&U.roster&&typeof S!=="undefined"&&S&&U.roster[S.myTeam]===R){u=U;t=S.myTeam}   // the staff's plan (core 94_staffplan) for your own club
  const lim=u&&t?nbaBudget(u,t):TAX_LINE;          // the owner's limit (24_cap), the tax line when it isn't known
  R.forEach((p,i)=>{if(!p)return;
    if(nbaExpiring(p))exp.push(i); else pay+=p.k.sal});
  exp.sort((a,b)=>R[b].r-R[a].r).forEach(i=>{
    const p=R[i], ask=nflAsk(p.r,p.p,p.age+1);
    // teams keep their useful players: RS_BAR/RB_BAR sit at the league's median starter and backup
    const worth=(i<POS.length?p.r>=RS_BAR:p.r>=RB_BAR&&ask<=12*PAY)&&p.age<=33&&!p.k.dec;
    keep[i]=worth&&pay+ask<=lim-ROOKIE_ROOM;
    // why, from the same rule (the screen's reason used to be a fixed string)
    RESIGN_WHY[i]=keep[i]?(i<POS.length?"a starter worth what he's asking":"useful depth at a fair price")
      :p.k.dec?"his option declined"
      :p.age>33?`his age: ${p.age+1} next season`
      :i<POS.length&&p.r<RS_BAR?`rated ${p.r}: below what the staff want in a starter`
      :i>=POS.length&&p.r<RB_BAR?`rated ${p.r}: not enough to keep as a backup`
      :i>=POS.length&&ask>12*PAY?`asking ${money2(ask)}: too much for a backup`
      :`no room under the owner's limit for his ${money2(ask)} ask`;      // your own players: up to what the owner will pay
    if(keep[i])pay+=ask;
  });
  return keep;
}

function nflPlayer(rng,target,age,posIdx){
  const P=POS[posIdx].p, a=age-(AGE_SHIFT[P]||0);
  // young players sit below the level they'll reach; veterans at or past it
  const ageAdj=a<=23?-5:a<=25?-2:a<=29?1:a<=31?0:-3;
  const r=Math.round(Math.max(40,Math.min(97,rng.gauss(target+ageAdj,5))));
  const room=a<=23?rng.gauss(9,4):a<=25?rng.gauss(5,3):a<=27?rng.gauss(2,1.5):0;
  const pot=Math.round(Math.max(r,Math.min(99,r+room)));
  const pl={n:playerName(rng),p:P,i:posIdx,c:age,age:age,r:r,pot:pot,hz:0,prod:0,st:0};
  // a deal signed in seasons past: some run over what he'd get now, some under (from his name: no dice)
  const y=1+rng.int(nflYears(age,P)), was=0.8+(strHash(pl.n+"|k")%56)/100;
  pl.k=nbaK(pl,Math.round(Math.max(nbaMin(age),Math.min(nbaMax(age),nflAsk(r,P,age)*was))*10)/10,y);
  return pl;
}

function nflRoster(rng,programElo){
  const target=eloToRating(programElo);
  const ageBag=[23,24,25,26,26,27,27,28,29,30,31,32];
  const r=POS.map((_,i)=>nflPlayer(rng,target,rng.pick(ageBag),i));
  POS.forEach((_,i)=>{
    const b=nflPlayer(rng,target-rng.range(5,13),rng.pick([22,23,24,25,28,31,33]),i);
    b.r=Math.min(b.r,r[i].r); b.k=nbaK(b,Math.round(Math.max(nbaMin(b.age),Math.min(nbaMax(b.age),nflAsk(b.r,b.p,b.age)*(0.8+(strHash(b.n+"|k")%56)/100)))*10)/10,b.k.yrs);
    r.push(b);
  });
  // and a third man at each spot (the front office: fifteen on a roster), on the minimum
  POS.forEach((_,i)=>{
    const c=nflPlayer(rng,target-rng.range(9,17),rng.pick([21,22,23,24,27,30,33]),i);
    c.r=Math.min(c.r,r[BK(i)].r); c.k=nbaK(c,nbaMin(c.age),1+rng.int(2));
    r.push(c);
  });
  // nobody starts past the second apron (the front office: a payroll of fifteen is the real thing)
  const pay=payroll(r);
  if(pay>NBA$.ap2-4){const f=(NBA$.ap2-4)/pay; r.forEach(p=>p.k.sal=Math.max(nbaMin(p.age),Math.round(p.k.sal*f*10)/10))}
  return distinctSurnames(r);   // round 49: no surname twice on a new roster (core 21_names)
}

/* the draft: worst regular season first; playoff teams after, by the round
   they went out in; the champion picks last */
/* The draft order: the fourteen teams that missed the playoffs draw for
   the top four picks (the real odds, worst record first), the rest of them
   follow worst first, then the playoff teams, worst record first. */
const LOTTERY_ODDS=[140,140,140,125,105,90,75,60,45,30,20,15,10,5];      // per thousand
function nflDraftOrder(rec,elo,rng){
  const S2=(typeof SEA!=="undefined"&&SEA&&SEA.field)?SEA:null;
  const pct=t=>rec[t][0]/Math.max(1,rec[t][0]+rec[t][1]);
  const worstFirst=(a,b)=>pct(a)-pct(b)||elo[a]-elo[b];
  const inPO=t=>S2&&S2.field.indexOf(t)>=0;
  const lot=NAMES.filter(t=>!inPO(t)).sort(worstFirst), po=NAMES.filter(inPO).sort(worstFirst);
  if(!rng||lot.length!==14)return lot.concat(po);                 // no draw without a finished season
  const pool=lot.slice(), w=LOTTERY_ODDS.slice(), top=[];
  for(let k=0;k<4;k++){
    let x=rng.r()*w.reduce((a,b)=>a+b,0), i=0;
    while(x>w[i]){x-=w[i];i++}
    top.push(pool[i]); pool.splice(i,1); w.splice(i,1);
  }
  return top.concat(pool,po);
}

function nflProspects(rng,n,sh){
  const out=[];
  for(let i=0;i<n;i++){
    const q=i/n;
    const posIdx=rng.int(POS.length);
    const age=19+rng.int(4);                    // one-and-dones to four-year seniors
    // NBA rookies: mostly below the league's typical starter at first, with ceilings
    const r0=Math.round(Math.max(42,Math.min(78,rng.gauss(+((typeof process!=="undefined"&&process.env&&process.env.NBA_PR)||57)-12*Math.pow(q,0.7),3.5*DRAFT_K.sd))));
    const pot0=Math.round(Math.min(99,r0+Math.max(3,rng.gauss(15-6*q,5))));
    const {r,pot}=sh?draftShape(sh,r0,pot0,42,84):{r:r0,pot:pot0};      // core/91_draftnight
    out.push({n:playerName(rng),p:POS[posIdx].p,i:posIdx,c:age,age:age,r:r,pot:pot,
              hz:0,prod:0,st:0,from:rng.pick(LEAGUE.draftTeams)});
  }
  return out;
}
/* The coming draft class, made when the offseason opens so a coach can see
   it and build a board. Seeded by the year, so reopening the screen or
   reloading a save shows the same class. sr/spot are a scout's estimates:
   how far off depends on how well run the franchise is (as for the
   computer's own picks). */
function nflDraftClass(u,team){
  if(!u.draftClass||u.draftClass.year!==u.year){
    const rng=new RNG((((u.seed||0)*2654435761)^(u.year*7919)^0x5bd1e995)>>>0);
    const list=nflProspects(rng,Math.round(2*30*DRAFT_K.deep),new RNG((((u.seed||0)*2654435761)^(u.year*7919)^0x7ab1)>>>0)); list.forEach((p,i)=>p.pid=i);
    // no two prospects in one class share a name (two "Tanner Mbeki"s: Grokbot); renamed by hash, so no draw moves
    { const seen=new Set(); list.forEach(p=>{ let n=p.n, k=0; while(seen.has(n)&&k<LAST.length){ n=n.split(" ")[0]+" "+LAST[(strHash(p.n+"|"+p.pid)+k)%LAST.length]; k++ } p.n=n; seen.add(n) }) }
    u.draftClass={year:u.year,list:list};
  }
  const C=u.draftClass;
  if(team&&C.scoutedFor!==team){
    C.list.forEach(p=>{ const x=scoutRead(u,team,p,false); p.sr=x.sr; p.spot=x.spot });   // core/91_draftnight
    C.scoutedFor=team;
  }
  return C;
}
/* Who will be a free agent: the players other teams' re-signing rules won't
   keep (their own choice, for a person coaching one). Ratings are this
   season's; players age before free agency opens. key identifies a player
   across the offseason. */
const faKey=(team,p)=>team+"|"+p.n+"|"+p.p;
function nflFreeAgentPreview(u,myTeam,users){
  const out=[];
  NAMES.forEach(t=>{
    if(t===myTeam)return;
    const R=u.roster[t], plan=(users&&users[t]&&users[t].resign)||nflResignPlan(R,u,t);
    R.forEach((p,i)=>{ if(!p||!nbaExpiring(p)||plan[i])return;
      if(p.r<NBA_FA_R||p.age>=33)return;                  // likely to retire or go unsigned
      out.push({key:faKey(t,p),n:p.n,p:p.p,team:t,age:p.age+1,r:p.r,pot:p.pot,
                ask:Math.round(Math.min(nbaMax(p.age+1),nflAsk(p.r,p.p,p.age+1)*1.1)*10)/10});   // a signing's markup never passes the maximum contract (Instinct: a $22.9M ask over a $20.8M max)
    });
  });
  return out.sort((a,b)=>(b.r+(b.pot-b.r)*0.3-b.age*0.2)-(a.r+(a.pot-a.r)*0.3-a.age*0.2));
}
/* ---- trades ----
   A player's worth to a front office: rating, some of his ceiling while he
   is young, less once he is past 29, and less the more he is paid. */
function tradeValue(p){
  const young=Math.max(0,27-p.age)/5;
  return p.r+(p.pot-p.r)*0.4*young-Math.max(0,p.age-29)*1.5-p.k.sal/PAY*0.25;
}
const tradeKey=(t,p)=>t+"|"+p.n+"|"+p.p;
/* Offers for one of your players under contract past this season: up to
   three teams each offer a player (also under contract) at one of your
   weakest spots, worth about the same, who helps them at the position they
   get, and leaves both of you under the cap. Deterministic, so the screen
   shows the same offers until something changes. */
function nflTradeOffers(u,myTeam,idx,humans){
  const R=u.roster[myTeam], give=R[idx]; if(!give||give.k.yrs<2)return [];
  const gv=tradeValue(give), myPay=payroll(R);
  // my weakest starting spots, by how far below the league's typical starter they are
  const need=POS.map((P,i)=>({i:i,gap:R[i]?R[i].r:0})).sort((a,b)=>a.gap-b.gap).slice(0,4).map(x=>x.i);
  const offers=[];
  NAMES.forEach(t=>{
    if(t===myTeam||(humans&&humans.indexOf(t)>=0))return;
    const T=u.roster[t], theirPay=payroll(T);
    // do they want him? he has to beat their starter or their backup at his spot
    const gi=POS.findIndex(P=>P.p===give.p);
    if(!(T[gi]&&give.r>T[BK(gi)].r+1))return;
    let best=null;
    T.forEach((q,j)=>{
      if(!q||q.k.yrs<2||need.indexOf(j%POS.length)<0)return;
      if(j<POS.length&&(!T[BK(j)]||T[BK(j)].r<q.r-8))return;   // they won't gut a spot
      const qv=tradeValue(q); if(qv<gv*0.88||qv>gv*1.08)return;
      if(myPay-give.k.sal+q.k.sal>TAX_LINE||theirPay-q.k.sal+give.k.sal>TAX_LINE)return;
      const fit=Math.abs(qv-gv)-(R[j%POS.length]?(q.r-R[j%POS.length].r)*0.5:0);
      if(!best||fit<best.fit)best={fit:fit,q:q,j:j};
    });
    if(best)offers.push({team:t,give:tradeKey(myTeam,give),get:tradeKey(t,best.q),
      n:best.q.n,p:best.q.p,r:best.q.r,pot:best.q.pot,age:best.q.age,sal:best.q.k.sal,yrs:best.q.k.yrs,fit:best.fit});
  });
  return offers.sort((a,b)=>a.fit-b.fit).slice(0,3);
}
/* carry out an agreed trade: find both players now (after aging), swap them */
function nflApplyTrade(u,myTeam,T,rep,leave,pool){
  const [tt]=T.get.split("|"), mine=u.roster[myTeam], theirs=u.roster[tt];
  const gi=mine.findIndex(p=>p&&tradeKey(myTeam,p)===T.give), qi=theirs?theirs.findIndex(p=>p&&tradeKey(tt,p)===T.get):-1;
  const [,gn,gp]=T.give.split("|"), [,qn,qp]=T.get.split("|");
  if(gi<0||qi<0){rep.trade[myTeam]={done:false,gave:gn,gp:gp,got:qn,qp:qp,with:tt,
      why:gi<0?gn+" retired before it could go through":qn+" retired before it could go through"};return}
  const give=mine[gi], get=theirs[qi];
  mine[gi]=null; theirs[qi]=null;
  // each lands where he fits; whoever drops off the end is released
  [[mine,get,myTeam],[theirs,give,tt]].forEach(([R,p,t])=>{
    p.yrsHere=0; p.joined=u.year+1; p.keep=true;
    const i=POS.findIndex(P=>P.p===p.p);
    if(!R[i]){R[i]=p} else if(!R[BK(i)]){ if(p.r>R[i].r){R[BK(i)]=R[i];R[i]=p}else R[BK(i)]=p }
    else { const out=nflPlace(R,p); if(out){rep.released[t].push({n:out.n,p:out.p,r:out.r}); if(out.r>=NBA_FA_R){out.from=t;pool.push(out)} else leave(t,out,"released")} }
  });
  rep.trade[myTeam]={done:true,gave:give.n,gp:give.p,got:get.n,qp:get.p,r:get.r,with:tt};
}
const rookieSal=o=>nbaRookieSal(o);   // the real rookie scale (24_cap): $15.2M for the first pick, the minimum in the second round

/* what a player adds at his spot: over the backup, or over the starter. Fifteen deep (the front office), a third man
   at each spot plays when a man ahead of him is hurt: worth about a third of a backup's place */
const NBA_DEEP=R=>R&&R.length>2*POS.length;
const NBA_TH=0.35;
function nflGain(roster,p){
  const s=roster[p.i], b=roster[BK(p.i)], w=POS[p.i].w, deep=NBA_DEEP(roster), th=deep?roster[BK(BK(p.i))]:null;
  const val=x=>x?x.r+(x.pot-x.r)*0.25:0;
  if(!s)return val(p)*w*3;
  if(val(p)>val(s))return (val(p)-val(s))*w*2+ (val(s)-val(b))*w+(deep?Math.max(0,val(b)-val(th))*w*NBA_TH:0);
  if(!deep)return Math.max(0,val(p)-val(b))*w;
  if(val(p)>val(b))return (val(p)-val(b))*w+Math.max(0,val(b)-val(th))*w*NBA_TH;
  return th?Math.max(0,val(p)-val(th))*w*NBA_TH:val(p)*w*0.5;
}
/* put a player in: he starts or backs up by rating (or, fifteen deep, is the third man); whoever drops off is returned */
function nflPlace(roster,p){
  p.i=POS.findIndex(P=>P.p===p.p);
  const s=roster[p.i], b=roster[BK(p.i)], deep=NBA_DEEP(roster), ti=BK(BK(p.i)), th=deep?roster[ti]:null;
  let out=null;
  if(!s){roster[p.i]=p}
  else if(!deep){ if(p.r>s.r){out=b;roster[BK(p.i)]=s;roster[p.i]=p} else {out=b;roster[BK(p.i)]=p} }
  else if(p.r>s.r){out=th;roster[ti]=b||null;roster[BK(p.i)]=s;roster[p.i]=p}
  else if(!b||p.r>b.r){out=b?th:null;if(b)roster[ti]=b;roster[BK(p.i)]=p}
  else {out=th;roster[ti]=p}
  return out;
}
/* the order at one spot, best first: starter, backup, third man */
function nbaSortSpot(R,i){ const L=[R[i],R[BK(i)],R[BK(BK(i))]], o=L.filter(Boolean).sort((a,b)=>b.r-a.r); [i,BK(i),BK(BK(i))].forEach((j,k)=>R[j]=o[k]||null) }

function nflRun(u,rng,healthy,elo,rec,choices){
  const U_CH=choices.users||(choices.userTeam?{[choices.userTeam]:choices}:{});
  // draft night: its own dice, on the rosters as the season ended (core/91_draftnight)
  const DN=draftNight(u,rec,elo,U_CH,2);
  const chFor=t=>U_CH[t]||null, ut=choices.userTeam;
  if(ut&&choices.coach){const c=choices.coach;
    u.coach[ut]={n:c.n,q:c.q,t:0,hired:true,arch:c.arch,rec:c.rec||0}}
  const rep={resigned:{},released:{},retired:{},grew:{},drafted:{},signed:{},filled:{},opts:{}};
  NAMES.forEach(t=>{rep.resigned[t]=[];rep.released[t]=[];rep.retired[t]=[];rep.grew[t]=[];
    rep.drafted[t]=[];rep.signed[t]=[];rep.filled[t]=[];rep.opts[t]=[]});
  // the season's bills and the owner's mood (24_cap: finances), on the payroll each club ended the season with
  rep.bills={}; rep.mood={};
  if(u.foV){ const champ=typeof SEA!=="undefined"&&SEA&&SEA.year===u.year?SEA.champion:null;
    NAMES.forEach(t=>{ const pay=payroll(u.roster[t]); rep.bills[t]=Object.assign({pay:Math.round(pay*10)/10},nbaSeasonBill(u,t,pay));
      rep.mood[t]=nbaMoodOf(u,t,pay,rec[t][0],rec[t][1],champ) });
    NAMES.forEach(t=>{ if(rep.bills[t].tax>0){ u.nbaTaxY=u.nbaTaxY||{}; u.nbaTaxY[t]=(u.nbaTaxY[t]||[]).concat([u.year]).slice(-5) } });
    u.nbaOwn={y:u.year,m:rep.mood,s:1} }               // the owner's limit this summer and next season reads it (nbaMood)
  // the front office (Nov 2026): a career from before comes onto the real cap sheet this summer (24_cap)
  nbaMigrate(u);
  NAMES.forEach(t=>{ const R=u.roster[t]; while(R.length<3*POS.length)R.push(null) });   // fifteen: a third man at each spot
  // options on next season, the last of a deal: the player's (he opts out when the market pays more) and the club's
  // (yours as you chose it; the computer's keeps a man worth his money)
  NAMES.forEach(t=>{ const ch=chFor(t), R=u.roster[t];
    R.forEach((p,i)=>{ if(!p||!p.k||p.k.yrs!==2||!p.k.opt)return;
      if(p.k.opt==="P"){ const out=nbaOptOut(p); if(out)p.k.yrs=1; rep.opts[t].push({n:p.n,p:p.p,k:"P",out:out}); p.k.opt=null; return }
      const keep=ch&&ch.topt&&ch.topt[i]!==undefined?!!ch.topt[i]:nbaTeamKeeps(p);
      if(keep)p.k.opt=null; else { p.k.yrs=1; p.k.dec=1 }
      rep.opts[t].push({n:p.n,p:p.p,k:"T",out:!keep}) }) });
  const pool=[];                                        // free agents
  const risers=[],fallers=[];
  u.alumni=u.alumni||{};
  const leave=(t,p,why)=>{
    if(p.joined>u.year)return;   // arrived this summer and let go before a game: never played here (round 50: a rookie drafted, cut, and listed as a 2026 alumnus: Instinct)
    u.alumni[t]=u.alumni[t]||[];
    u.alumni[t].push({n:p.n,p:p.p,from:Math.min(u.year,p.joined||u.year-(p.yrsHere||1)),to:u.year,   // never after "to" (it read 2027-2026)
      peak:p.peak||p.r,yrs:p.yrsHere||1,draft:p.draft||null,
      line:LEAGUE.records.alumniLine({p:p.p,car:p.car,yrs:p.yrsHere||1}),why:why,
      // career totals with the franchise, for its leaders (six numbers)
      car:p.car?{pts:p.car.pts||0,reb:p.car.reb||0,ast:p.car.ast||0,tpm:p.car.tpm||0,blk:p.car.blk||0,stl:p.car.stl||0}:null});
    if(u.alumni[t].length>40){u.alumni[t].sort((a,b)=>b.peak-a.peak);u.alumni[t].length=40}
  };

  NAMES.forEach(t=>{
    const before=u.program[t], c=u.coach[t], R=u.roster[t], ch=chFor(t);
    const plan=(ch&&ch.resign)?ch.resign:nflResignPlan(R,u,t);
    // the organisation moves slowly: results nudge it, they don't define it
    u.program[t]+=0.05*(elo[t]-u.program[t])+c.q*COACH_BUILD*0.4+rng.gauss(0,9);
    u.program[t]=Math.max(1320,Math.min(1740,u.program[t]));   // round 54: basketball's own range (was pro football's 1480-1920: after one summer every weak club sat at 1480, and the rebuild jobs were gone)
    c.t++;
    // 1. contracts that end now
    for(let i=0;i<R.length;i++){
      const p=R[i]; if(!p)continue;
      p.yrsHere=(p.yrsHere||0)+1;
      if(p.k.yrs>1){p.k.yrs--;continue}
      const ask={sal:nflAsk(p.r,p.p,p.age+1),yrs:nflYears(p.age+1,p.p,p.r)};
      const keep=!!plan[i]&&!p.k.dec;
      if(keep){p.k=nbaK(p,ask.sal,ask.yrs);rep.resigned[t].push({n:p.n,p:p.p,r:p.r,sal:ask.sal,yrs:ask.yrs})}
      else{R[i]=null;rep.released[t].push({n:p.n,p:p.p,r:p.r,why:"expired"});
        if(p.r>=NBA_FA_R&&p.age<=33){p.from=t;pool.push(p)} else leave(t,p,"released")}
    }
    // 2. aging
    let devMod=(ch&&ch.phil&&PHILOSOPHY[ch.phil])?PHILOSOPHY[ch.phil].dev*0.5:0;
    const ocq=(u.oc&&u.oc[t])?u.oc[t].q:0, dcq=(u.dc&&u.dc[t])?u.dc[t].q:0;
    R.forEach((p,i)=>{
      if(!p)return;
      const was=p.r; p.age++; p.c=p.age;
      const a=p.age-(AGE_SHIFT[p.p]||0);
      const base=a<=22?3.4:a<=23?2.7:a<=24?1.9:a<=25?1.1:a<=26?0.4:a<=27?-0.2:a<=28?-0.8:a<=29?-1.5:a<=30?-2.3:a<=31?-3.3:a<=32?-4.3:-5.5;
      const side=(ocq+dcq)*0.01;                      // both ends: both assistants
      const org=a<=29?orgEdge(u,t)*0.75:0;
      let g=rng.gauss(base+c.q*0.02+devMod+side+org+featDev(ch,i)+(typeof moraleDev==="function"?moraleDev(p):0),2.0);
      // a breakout season: now and then a young player jumps a level, and
      // sometimes carries a franchise with him (the spread needs a source)
      if(a<=25&&rng.r()<+((typeof process!=="undefined"&&process.env&&process.env.NBA_LEAP)||0.07)){
        const leap=rng.range(4,9); p.pot=Math.max(p.pot,Math.round(p.r+g+leap+2)); g+=leap; p.leap=u.year;
      }
      p.r=Math.round(Math.max(35,Math.min(g>0?p.pot:99,p.r+g)));
      if(a>=27)p.pot=Math.max(p.r,Math.min(p.pot,p.r+1));
      p.peak=Math.max(p.peak||0,p.r);
      if(p.r-was>=5)rep.grew[t].push({n:p.n,p:p.p,age:p.age,from:was,to:p.r,leap:p.leap===u.year});   // the report's "big summers"
    });
    // 3. retirement
    R.forEach((p,i)=>{
      if(!p)return;
      const a=p.age-(AGE_SHIFT[p.p]||0);
      const odds=a>=36?0.9:a>=35?0.6:a>=34?0.35:a>=33?0.18:a>=32?0.08:0;
      if(rng.r()<odds+(p.r<55&&a>=29?0.3:0)){R[i]=null;rep.retired[t].push({n:p.n,p:p.p,age:p.age,r:p.r});leave(t,p,"retired")}
    });
    // a starter's empty spot goes to his backup first (and a backup's to the third man)
    POS.forEach((_,i)=>nbaSortSpot(R,i));
    const d=u.program[t]-before;
    if(d>30)risers.push([t,Math.round(d)]); if(d<-30)fallers.push([t,Math.round(d)]);
  });

  // agreed trades go through now: after contracts and aging, before the draft
  rep.trade={};
  Object.keys(U_CH).forEach(t=>{const ch=U_CH[t]; if(ch&&ch.trade)nflApplyTrade(u,t,ch.trade,rep,leave,pool)});
  NAMES.forEach(t=>POS.forEach((_,i)=>nbaSortSpot(u.roster[t],i)));

  // 4. the draft: drawn before the summer began (draft night), placed now
  delete u.draftClass;
  const picks=placeDraftNight(u,DN,rep,pool,leave,"draft");
  // the pick ledger: this draft's picks are made
  if(u.nbaPk)Object.keys(u.nbaPk).forEach(k=>{ if(+k.split("|")[0]<=u.year)delete u.nbaPk[k] });
  // rookie-scale deals: four years, the club's option on the fourth; a second-rounder two at the minimum
  NAMES.forEach(t=>u.roster[t].forEach(p=>{ if(!p||!p.drafted||p.joined!==u.year+1||!p.draft||p.k.v)return;
    p.k=p.draft.overall<=30?{sal:nbaRookieSal(p.draft.overall),yrs:4,v:2,rk:1,opt:"T"}:{sal:nbaMin(p.age),yrs:2,v:2} }));

  // a draft class can tip a team over: release the worst-value backups until it fits
  NAMES.forEach(t=>{
    const R=u.roster[t];
    while(payroll(R)>nbaBudget(u,t)){
      let wi=-1,wv=-1;
      R.forEach((p,i)=>{if(!p||i<POS.length)return; const v=p.k.sal/Math.max(1,p.r-45); if(v>wv){wv=v;wi=i}});
      if(wi<0){ // only starters left over: the most overpaid starter goes
        R.forEach((p,i)=>{if(!p)return; const v=p.k.sal/Math.max(1,p.r-45); if(v>wv){wv=v;wi=i}})}
      const out=R[wi]; R[wi]=null; rep.released[t].push({n:out.n,p:out.p,r:out.r,cap:true});
      if(out.r>=NBA_FA_R){out.from=t;pool.push(out)} else leave(t,out,"released");
    }
  });

  // 5. free agency (the front office, Nov 2026): days of bidding. Each day the clubs make the offers they can pay for
  // (cap room, the mid-level exception the payroll allows, or the minimum) and each player weighs his: the money against
  // his market, the years he wants, winning, the role he'd have, the club he played for (nbaFaPref). Stars wait for the
  // market to come to them; role players sign early. Your targets are your offers, at the price and years you set.
  pool.forEach(p=>{p.ask=nflAsk(p.r,p.p,p.age); p.i=POS.findIndex(P=>P.p===p.p)});
  rep.targets={};
  const mleUsed={}, offers=[];                          // the mid-level exception: once a summer
  const styleOf=t=>{const ch=chFor(t); if(ch&&ch.fa)return ch.fa;
    const rk=NAMES.slice().sort((a,b)=>elo[b]-elo[a]).indexOf(t);
    // bad teams with room are the big spenders, as in the real league; only a
    // few rebuild through youth
    return rk<8?"contend":rk>=28?"young":"balanced"};
  const limit={contend:0.99,balanced:0.93,young:0.85}, maxAge={contend:34,balanced:31,young:27};
  const live=o=>!o.dead&&!o.p.signed;
  const fits=(o,sp)=>o.sal<=nbaMin(o.p.age)+0.05||(sp.how!=="min"&&o.sal<=sp.amt+0.05);
  const sign=(o,d)=>{ const p=o.p, t=o.t, R=u.roster[t], sp=nbaSpend(u,t,R,mleUsed), how=o.sal<=nbaMin(p.age)+0.05?"min":sp.how;
    if(how==="mle")mleUsed[t]=1;
    p.signed=true; p.k=nbaK(p,o.sal,o.yrs); p.faY=u.year+1; p.yrsHere=0; p.joined=u.year+1; if(o.user)p.keep=true;
    const out=nflPlace(R,p), n=offers.filter(x=>x.p===p&&!x.dead).length;
    rep.signed[t].push({n:p.n,p:p.p,r:p.r,age:p.age,sal:o.sal,yrs:o.yrs,from:p.from,how:how,day:d+1,bids:n,target:!!o.user});
    offers.forEach(x=>{ if(x.p===p&&x!==o&&!x.dead){x.dead=1; x.lost=o} }); o.won=1;
    if(out){rep.released[t].push({n:out.n,p:out.p,r:out.r,why:"fa"}); if(out.r>=NBA_FA_R&&!out.signed){out.from=t;out.ask=nflAsk(out.r,out.p,out.age);out.i=POS.findIndex(P=>P.p===out.p);pool.push(out)} else leave(t,out,"released")} };
  // your targets: an offer each, from the first day, at your price (or his ask and about 10%) and years
  const tgt={};
  Object.keys(U_CH).forEach(t=>{
    const ch=U_CH[t]; if(!ch||!ch.targets||!ch.targets.length||!u.roster[t])return;
    rep.targets[t]=[];
    ch.targets.forEach(key=>{
      const p=pool.find(x=>!x.signed&&faKey(x.from,x)===key), [team,n,pos]=key.split("|");
      if(!p){rep.targets[t].push({n:n,p:pos,from:team,got:false,why:"wasn't on the market (retired or re-signed)"});return}
      const b=nbaBid(ch,key,p), o={t:t,p:p,sal:b.sal,yrs:b.yrs,user:1,nz:0,key:key,team:team};
      offers.push(o); (tgt[t]=tgt[t]||[]).push(o) }) });
  for(let d=0;d<NBA_FAD;d++){
    // the clubs' offers: the better teams first (a little luck in it); each can have two out at a time, within its room
    const pull={}; NAMES.forEach(t=>pull[t]=elo[t]+rng.gauss(0,+((typeof process!=="undefined"&&process.env&&process.env.NBA_FAN)||45)));
    const shoppers=NAMES.slice().sort((a,b)=>pull[b]-pull[a]);
    shoppers.forEach(t=>{
      if(tgt[t]&&tgt[t].some(live)&&d<2)return;        // yours wait a day or two on your own offers before your style shops
      const mine=offers.filter(o=>o.t===t&&live(o)); if(mine.length>=2)return;
      const R=u.roster[t], st=styleOf(t), sp=nbaSpend(u,t,R,mleUsed);
      const out=mine.filter(o=>o.sal>nbaMin(o.p.age)+0.05).reduce((s,o)=>s+o.sal,0);
      const room=sp.how==="room"?sp.amt*limit[st]-out:sp.how==="mle"&&!out?sp.amt:0;
      const free=Math.max(0,NBA$.floor-payroll(R)-out);   // under the salary floor the shortfall is paid anyway: that money is free to spend
      let best=null,bv=0;
      pool.forEach(p=>{if(p.signed||p.age>maxAge[st]||p.from===t||mine.some(o=>o.p===p))return;
        const bk=R[BK(p.i)]; if(bk&&bk.keep)return;    // would cut a target you just signed
        let cost=Math.round(p.ask*(1+Math.max(0,rng.gauss(0.05,0.08))+(room>2*p.ask?0.05:0))*(1-orgEdge(u,t)*0.06)*10)/10;   // a club flush with room bids up
        if(cost>room&&cost>nbaMin(p.age)+0.05){ if(room>=p.ask*0.8)cost=Math.round(room*10)/10; else return }   // what they have, if it's close
        const v=nflGain(R,p)-Math.max(0,cost-free)/PAY*0.08;
        if(v>bv){bv=v;best=[p,cost]}});
      if(!best||bv<0.8)return;
      const [p,cost]=best;
      offers.push({t:t,p:p,sal:cost,yrs:nflYears(p.age,p.p,p.r),nz:rng.gauss(0,0.03),d:d});
    });
    // the players: the best decide first; each takes his best offer once it clears what he's holding out for, or on
    // the last day whatever is best; an offer the club can no longer pay for (its room went on someone else) falls away
    pool.filter(p=>!p.signed&&offers.some(o=>o.p===p&&!o.dead)).sort((a,b)=>b.r-a.r).forEach(p=>{
      const L=offers.filter(o=>o.p===p&&!o.dead).map(o=>({o:o,s:nbaFaPref(u,p,o,elo)})).sort((a,b)=>b.s-a.s);
      if(L[0].s<nbaFaHold(p,d)&&d<NBA_FAD-1)return;
      for(const x of L){ const sp=nbaSpend(u,x.o.t,u.roster[x.o.t],mleUsed);
        if(!fits(x.o,sp)){ x.o.dead=1; x.o.broke=1; continue }
        sign(x.o,d); break }
    });
  }
  // how your offers went
  Object.keys(tgt).forEach(t=>tgt[t].forEach(o=>{ const p=o.p, e={n:p.n,p:p.p,from:o.team};
    if(o.won){ rep.targets[t].push(Object.assign(e,{got:true,sal:o.sal,yrs:o.yrs})); return }
    let why;
    if(o.broke)why=`your ${money2(o.sal)} offer didn't fit: ${(()=>{ const sp=nbaSpend(u,t,u.roster[t],mleUsed); return sp.how==="room"?"only "+money2(sp.amt)+" of cap room left":sp.how==="mle"?"over the cap, only the "+money2(sp.amt)+" mid-level exception":"over the cap with the exception used, only a minimum deal" })()}`;
    else if(o.lost){ const w=o.lost, a=nbaFaPref(u,p,o,elo,1), b=nbaFaPref(u,p,w,elo,1), r=[];
      if(b.money>a.money+0.04)r.push("more money"); if(b.yrs>a.yrs+0.02)r.push(w.yrs>o.yrs?"more years":"the years he wanted"); if(b.win>a.win+0.02)r.push("a better team");
      if(b.role>a.role+0.02)r.push(b.role>0?"a starting job":"a bigger role"); if(b.home>a.home)r.push("his old club");
      why=`signed with ${w.t} (${money2(w.sal)} for ${nOf(w.yrs,"year")}${r.length?": "+r.join(", "):""})` }
    else why=p.signed?"signed elsewhere":"didn't sign with anyone";
    rep.targets[t].push(Object.assign(e,{got:false,why:why,bid:o.sal})) }));
  pool.filter(p=>!p.signed).forEach(p=>leave(p.from,p,"unsigned"));
  NAMES.forEach(t=>u.roster[t].forEach(p=>{if(p)delete p.keep}));

  // 6. fill the gaps, and put the best man at each spot
  NAMES.forEach(t=>{
    const R=u.roster[t];
    for(let i=0;i<R.length;i++)if(!R[i]){
      const p=i<2*POS.length?nflPlayer(rng,53+rng.range(0,5),24+rng.int(8),i%POS.length):nflPlayer(rng,45+rng.range(0,5),22+rng.int(10),i%POS.length);
      p.k={sal:nbaMin(p.age),yrs:1,v:2}; p.joined=u.year+1; R[i]=p;
      rep.filled[t].push({n:p.n,p:p.p,r:p.r});
    }
    POS.forEach((_,i)=>{const s=R[i],b=R[BK(i)]; if(b.r>s.r+1){R[i]=b;R[BK(i)]=s}});
    POS.forEach((_,i)=>{const b=R[BK(i)],c=R[BK(BK(i))]; if(b&&c&&c.r>b.r+1){R[BK(i)]=c;R[BK(BK(i))]=b}});
    R.forEach((p,i)=>{p.i=i%POS.length});
    const c=u.coach[t];
    u.trueBase[t]=rosterElo(R)+(c.t<=1?ROOKIE_DIP:0)+rng.gauss(0,ROSTER_NOISE*0.6);
    u.perceived[t]=0.55*elo[t]+0.45*rosterElo(R)+rng.gauss(0,PERCEPT_N*0.6);
  });
  if(ut&&choices.phil)u.phil=choices.phil;
  NAMES.forEach(t=>u.roster[t].forEach(p=>{ if(p&&p.k&&p.k.dec)p.k.dec=0 }));
  u.foV=1;                                              // the front office's rules from this season on (24_cap)
  u.year++;
  if(u.nbaOwn)u.nbaOwn={y:u.year,m:u.nbaOwn.m,s:0};
  risers.sort((a,b)=>b[1]-a[1]); fallers.sort((a,b)=>a[1]-b[1]);
  if(typeof S!=="undefined"&&S)S.lastNbaRep={rep:rep,picks:picks};     // for tests (test/nba-turnover.js)
  return {risers:risers.slice(0,5),fallers:fallers.slice(0,5),
    draft:{picks:picks}, contracts:rep,
    cap:Object.fromEntries(NAMES.map(t=>[t,Math.round(payroll(u.roster[t])*10)/10]))};
}

/* the cap the season reads: a season begun before the front office (no u.foV) keeps the numbers it was played on, so
   it replays exactly (the computer's deadline deals check the tax line) */
Object.defineProperty(LEAGUE,"cap",{get(){ return nbaFO()?NBA$.cap:165 },enumerable:true,configurable:true});
Object.defineProperty(LEAGUE,"taxLine",{get(){ return nbaFO()?NBA$.tax:200 },enumerable:true,configurable:true});
LEAGUE.offseason={
  newRoster:nflRoster,
  init(u){ u.foV=1 },                                   // a new career is on the front office's rules from the start
  run:nflRun,
  /* the user's choices, as the offseason screen starts them: re-sign the
     starters worth keeping, spend in free agency like a middling team, draft
     the best player available */
  open(u,t,wins){
    const R=u.roster[t], resign=nflResignPlan(R,u,t), asks={}, topt={};
    R.forEach((p,i)=>{if(nbaExpiring(p))asks[i]={sal:nflAsk(p.r,p.p,p.age+1),yrs:nflYears(p.age+1,p.p,p.r),out:p.k.yrs>1};
      if(p&&p.k.opt==="T"&&p.k.yrs===2)topt[i]=nbaTeamKeeps(p)});
    nflDraftClass(u,t);                              // made now, so the screen can show it
    return {pool:NFL_CAP, picks:{resign:resign, asks:asks, fa:"balanced", draft:"bpa", board:[], targets:[], bids:{}, block:null, trade:null, topt:topt}};
  },
  choices(P){return {resign:P.resign, topt:P.topt||null, fa:P.fa, draft:P.draft, board:P.board||[], targets:P.targets||[], bids:P.bids||null, trade:P.trade||null,
                       hand:P.hand||null, handDone:!!P.handDone, workouts:P.workouts||[]}},   // draft night's picks (core/91_draftnight)
  faStyles:{contend:{l:"Spend to contend",d:"Chase the best players available, whatever their age. Uses nearly every dollar."},
            balanced:{l:"Balanced",d:"Fill real holes with players in their prime. Leaves a little room."},
            young:{l:"Stay young",d:"Only players 27 and under, and keep cap space for later."}},
  workouts:3,
  draftRounds:2,
  draftStyles:{bpa:{l:"Best available",d:"Take the best player on the board, whatever the position."},
               need:{l:"Draft for need",d:"Fill the weakest spots on the roster, even if it means reaching."},
               upside:{l:"Swing for upside",d:"Raw prospects with the highest ceilings. Slower to pay off."}}
};

/* what a season is judged against, and how it is graded */
LEAGUE.goals={
  /* what the job demands, by franchise strength: wins over 82 games, and a
     par for the playoffs (how far the job expects you to go) */
  byWins:true,
  /* engine 25: from what the season's own chances say this roster should win (core expectedWins): the tier and the
     number both, so a target is the club's expected wins, not its standing */
  expectations(p,xw){
    if(xw!=null){ const w=Math.round(xw);
      if(xw>=54)return {w:w,par:2.2,l:"Built to win now. A conference final is the floor.",t:"CONTEND"};
      if(xw>=47)return {w:w,par:1.3,l:"Make the playoffs and win a series.",t:"WIN A SERIES"};
      if(xw>=40)return {w:w,par:0.4,l:"Get into the playoffs, through the play-in if you have to.",t:"MAKE THE PLAYOFFS"};
      if(xw>=31)return {w:w,par:0,l:`Draft well and show progress. ${w+2} wins would be a statement.`,t:"REBUILD"};
      return {w:w,par:0,l:`The bottom of the league. ${w+2} wins would be real movement.`,t:"START OVER"} }
    if(p>=1600)return {w:55,par:2.2,l:"Built to win now. A conference final is the floor.",t:"CONTEND"};
    if(p>=1540)return {w:47,par:1.3,l:"Make the playoffs and win a series.",t:"WIN A SERIES"};
    if(p>=1480)return {w:41,par:0.4,l:"Get into the playoffs, through the play-in if you have to.",t:"MAKE THE PLAYOFFS"};
    if(p>=1420)return {w:34,par:0,l:"Draft well and show progress. Thirty-five wins would be a statement.",t:"REBUILD"};
    return {w:27,par:0,l:"The bottom of the league. Twenty-five wins would be real movement.",t:"START OVER"};
  },
  /* the playoff part, as it stands (Grokbot: "win a series" still unmet after three series wins) */
  clauseLine(e,my){
    if(!e.par)return null;
    const sea=SEA, all=[].concat(...Object.values(sea.series||{})).filter(x=>x&&x.w&&(x.w[my]!==undefined||x.a===my||x.b===my));
    const won=all.filter(x=>x.winner===my).length, out=all.some(x=>x.winner&&x.winner!==my);
    // between the last regular-season day and the seeding, the seeds aren't set yet: read the table as it stands, or
    // a 71-11 first seed read "Missed the playoffs" for a screen (Instinct, round 42)
    const unseeded=sea.phase!=="week"&&!(sea.field&&sea.field.length)&&typeof sea.seedsNow==="function", sn=unseeded?sea.seedsNow():null;
    const inP=!!(sea.seeds&&sea.seeds[my])||!!(sn&&Object.values(sn).some(a=>a.slice(0,6).indexOf(my)>=0));
    const want=e.par>=2.2?2:e.par>=1.3?1:0, what=want===2?"reach the conference final":want===1?"win a series":"";
    if(sn&&Object.values(sn).some(a=>a.slice(6,10).indexOf(my)>=0))return `Into the play-in: win it to make the playoffs${want?` and ${what}`:""}.`;
    if(sea.phase==="week")return want?`Still to do: make the playoffs and ${what}.`:"Still to do: make the playoffs.";
    if(!inP&&!all.length)return "Missed the playoffs.";
    if(won>=want)return want?`${won} series won: done.`:"Into the playoffs: done.";
    return out?`In the playoffs, but out before you could ${what}.`:`In the playoffs. Still to do: ${what}.`;
  },
  isTitle(result){ return /NBA CHAMPIONS/i.test(result) },
  firstTitle:"First championship of your tenure.",
  grade(wins,losses,result,exp){
    // review round (playtest: a 62-20 pro basketball team fell A- to B+ the moment it clinched): in the playoffs and
    // still alive is a season in progress too, at par or better
    // no result yet (a season in progress, as the seat badge asks): the playoffs at par
    const po=!result?(exp.par||0):/NBA CHAMPIONS/i.test(result)?5:/NBA Finals/.test(result)?3.6:/conference finals/.test(result)?2.6:
      /conference semifinals/.test(result)?1.7:/first round/.test(result)?0.9:/Made the playoffs/.test(result)?Math.max(0.9,exp.par||0):
      /play-in/.test(result)?0.2:-(exp.par>=0.4?0.8:0);
    let s=(wins-exp.w)*0.13+po-(exp.par||0);
    if(wins<losses)s-=(exp.w>=41?0.8:0.2);
    const g=s>=4?"A+":s>=2.6?"A":s>=1.6?"A-":s>=0.9?"B+":s>=0.2?"B":s>=-0.6?"B-":
            s>=-1.4?"C+":s>=-2.2?"C":s>=-3.2?"C-":s>=-4.4?"D":"F";
    const l=s>=2.6?"Far beyond what anyone expected.":s>=0.9?"Ahead of schedule.":
            s>=-0.6?"About what was expected.":s>=-2.2?"Short of the mark.":"A bad year, and everyone knows it.";
    return {g:g,l:l,miss:s<-0.6};
  }
};

/* the history book: what only the pros record */
LEAGUE.historyExtras=function(sea,off,my){
  const C=off.contracts||{};
  return {id:"nfl",
    draft:((off.draft&&off.draft.picks)||[]).filter(d=>d.team===my||d.d.round===1&&d.d.pick<=10)
      .map(d=>({n:d.n,p:d.p,team:d.team,r:d.r,pot:d.pot,from:d.from,d:d.d,made:d.made,pid:d.pid})),
    signed:(C.signed&&C.signed[my])||[], resigned:(C.resigned&&C.resigned[my])||[],
    released:(C.released&&C.released[my])||[], retired:(C.retired&&C.retired[my])||[], grew:(C.grew&&C.grew[my])||[], payroll:C.cap?C.cap[my]:null,
    targets:(C.targets&&C.targets[my])||[], trade:(C.trade&&C.trade[my])||null,
    boardGone:(C.boardGone&&C.boardGone[my])||[],
    bill:(C.bills&&C.bills[my])||null, mood:C.mood?C.mood[my]||0:0,
    payroll:off.cap?off.cap[my]:null};
};
LEAGUE.migrateHistory=function(h){return {id:"nfl"}};
LEAGUE.seasonLine=function(h,t,r,seed){
  if(h.pnote&&h.pnote[t])return h.pnote[t]+(seed?" \u00b7 No. "+seed+" seed":"");
  // seasons banked before round 46 kept no play-in note: your own season's result says it (Muse, round 21: one season,
  // "Lost in the play-in" and "Missed the playoffs" on one page)
  if(h.team===t&&h.result&&/play-in/i.test(h.result))return "Lost in the play-in";
  if(h.champion===t)return "NBA champions";
  if(seed)return "Playoffs, No. "+seed+" seed";
  return r[0]>r[1]?"Missed the playoffs":"Losing season";
};
/* home field: the base edge plus the stadium, nothing to do with prestige */
LEAGUE.homeField=(u,t)=>LEAGUE.tuning.hfa+(LEAGUE.venues[t]||0)*0.5;
LEAGUE.trade={by:"Feb 5"};   // round 83: the deadline, early February
