/* ============ pro hockey: the summer on the front office's rules (engine 27) ============ */
/* A hockey GM's summer, in the real order:
     1. the draft (draft night's picks; three rounds), its picks to the reserve list unless one makes the team
     2. buyouts (June): a third of the cap hit (a sixth under 26) for twice the years left, as dead money
     3. contracts that end: an unrestricted man re-signs or goes to market; a restricted man is qualified or not (not:
        he's unrestricted), then signs, or goes to arbitration (with the rights: an award for one or two years, which a
        club may walk away from when it's big)
     4. aging and retirement (as before), the reserve list's prospects too: they sign entry-level deals at 20, come up
        when they're better than a man on the roster, and are let go when they don't make it
     5. offer sheets: a club with room may sign another club's qualified restricted man; his club matches or takes the
        picks the sheet's value calls for (the real 2026 table)
     6. free agency from July 1, five days: each club offers what its cap room allows (no more than six years; his own
        club can give seven), and each player weighs his offers: money, years, a winner, a role, his old club
     7. the empty places: a prospect up from the reserve list, else a depth man signed for the minimum
   No club may end the summer over the cap ($104.0M with dead money); a club under the $76.9M floor spends to reach it.
   The computer's clubs aim at the cap by where they stand: a contender at it, a club in the middle just under, a
   rebuild leaving room. */
const HK_AIM={contend:1.0, balanced:0.975, young:0.88};
const HK_FAD=5;
const HK_POOLR=46;                                      // who reaches the market rather than leaving the league
const HK_RESMAX=10;                                     // the reserve list's length (prospects the club keeps track of)
const hkStyle=(u,t,elo,ch)=>{ if(ch&&ch.fa)return ch.fa; const rk=NAMES.slice().sort((a,b)=>elo[b]-elo[a]).indexOf(t);
  return rk<10?"contend":rk>=NAMES.length-6?"young":"balanced" };
const hkFill=R=>R.filter(x=>!x).length*HK$.min;
/* the value a club puts on a man at his spot: his rating and some of his ceiling while young */
const hkVal=x=>x?x.r+Math.max(0,(x.pot||x.r)-x.r)*(x.age<=24?0.3:0.15):0;
/* the bars the computer keeps a man by: the first unit, the men behind them, the bottom of the roster */
const hkBar=i=>i<POS.length?56:i<2*POS.length?52:47;
/* the staff's re-sign plan: their most valuable first, while the money fits under the cap they aim at. An
   unrestricted man: true or false. A restricted one: "q" (qualify and sign), or false (not qualified: he goes to
   market). Reasons into RESIGN_WHY (core 94_staffplan) */
function hkResignPlan(u,t,R,aim){
  const keep={}; RESIGN_WHY={};
  const dead=hkDeadOf(u,t), exp=[]; let pay=dead;
  R.forEach((p,i)=>{ if(!p)return; if(p.k.yrs<=1)exp.push(i); else pay+=p.k.sal });
  const lim=HK$.cap*(aim||0.985)-hkFill(R.map((p,i)=>exp.indexOf(i)>=0?null:p))*0.4;
  exp.sort((a,b)=>hkVal(R[b])-hkVal(R[a])).forEach(i=>{
    const p=R[i], st=hkStatus(p), ask=st==="UFA"?hkAsk(p.r,p.age+1):hkRfaAsk(p), old=!vetOK(Object.assign({},p,{age:p.age+1}));
    const good=p.r>=hkBar(i)||(st!=="UFA"&&p.r>=hkBar(i)-3&&(p.pot||p.r)>=p.r+3);
    const fits=pay+ask<=lim;
    keep[i]=good&&!old&&fits?(st==="UFA"?true:"q"):false;
    RESIGN_WHY[i]=keep[i]?(st==="UFA"?(i<POS.length?"a first-unit player worth what he's asking":"useful at a fair price"):`restricted: qualify him and sign him for about ${hkMoney(ask)}`)
      :old?`his age: ${p.age+1} next season`
      :!good?`rated ${p.r}: not enough for ${i<POS.length?"the first unit":i<2*POS.length?"the top nine":"the roster"}`
      :`no room under the cap for his ${hkMoney(ask)} ask`;
    if(keep[i])pay+=ask });
  return keep }
/* a buyout the computer makes: an older man paid far over what he's worth now, with years left; the cap he frees has
   to buy a better man (one a summer at most) */
function hkCpuBuyout(u,t,R){
  let best=null; R.forEach((p,i)=>{ if(!p||p.k.elc||p.k.yrs<3||p.age<29)return;
    const over=p.k.sal-hkAsk(p.r,p.age+1); if(over<3||over<p.k.sal*0.45)return;
    if(!best||over>best.over)best={i:i,over:over} });
  return best?[best.i]:[] }
/* a qualified restricted man's deal: long (buying his free-agent years, near his market) if he's young and good, else
   a bridge of two or three years at his restricted price */
function hkRfaDeal(p){ const age=p.age+1, long=p.r>=60&&age<=25;
  return long?{sal:hkClamp(Math.max(hkRfaAsk(p),hkAsk(p.r,age)*0.9)),yrs:HK$.yOwn,long:1}:{sal:hkRfaAsk(p),yrs:p.r>=54?3:2} }
/* the free agent's view of an offer */
function hkFaPref(u,p,o,elo,parts){
  const R=u.roster[o.t], k=POS.findIndex(P=>P.p===p.p), L=hkSlots(k).map(j=>R[j]).filter(Boolean).sort((a,b)=>b.r-a.r);
  const pY=hkYears(p.age,p.r,o.t===p.from);
  const money=o.sal/Math.max(p.ask||0,HK$.min);
  const yrs=p.age>=30?0.035*Math.max(-2,Math.min(2,o.yrs-pY)):-0.025*Math.abs(o.yrs-pY);
  const e=elo&&elo[o.t]!=null?elo[o.t]:1500, win=(e-1500)/100*(p.age>=29?0.09:0.05);
  const at=L.filter(x=>x.r>p.r).length, role=(at===0?0.07:at===1?0.02:at===2?-0.04:-0.09)*(p.r>=52?1:0.5);
  const home=o.t===p.from?0.04:0;
  if(parts)return {money:money,yrs:yrs,win:win,role:role,home:home};
  return money+yrs+win+role+home+(o.nz||0) }
const hkFaHold=(p,d)=>(p.r>=64?1.08:p.r>=58?1.03:0.99)-0.05*d;
/* your offer to a target: the price and years you set, or his ask and about 10% for the years he wants */
function hkBid(ch,key,p,own){ const b=ch&&ch.bids&&ch.bids[key], mx=own?HK$.yOwn:HK$.yNew;
  const sal=b&&b.sal?Math.max(HK$.min,Math.min(HK$.max,+b.sal)):Math.min(HK$.max,p.ask*1.1);
  return {sal:hk2(sal),yrs:b&&b.yrs?Math.max(1,Math.min(mx,b.yrs|0)):hkYears(p.age,p.r,own)} }
/* the pick ledger (picks traded, offer sheets' compensation): the universe's, carried season to season; the draft
   reads it. Keys: draft year | round | original club */
const hkPkKey=(y,rd,o)=>y+"|"+rd+"|"+o;
function hkPickOwner(u,y,rd,o){ const e=u&&u.hkPk&&u.hkPk[hkPkKey(y,rd,o)]; return e?e.to:o }
function hkOwnsComp(u,t,c,y){ return (!c[0]||hkPickOwner(u,y,1,t)===t)&&(!c[1]||hkPickOwner(u,y,2,t)===t)&&(!c[2]||hkPickOwner(u,y,3,t)===t)&&(c[0]<2||[1,2,3].slice(0,c[0]-1).every(k=>hkPickOwner(u,y+k,1,t)===t)) }
function hkGiveComp(u,from,to,c,y){ u.hkPk=u.hkPk||{}; const L=[];
  for(let k=0;k<c[0];k++){ u.hkPk[hkPkKey(y+k,1,from)]={to:to}; L.push({y:y+k,rd:1}) }
  if(c[1]){ u.hkPk[hkPkKey(y,2,from)]={to:to}; L.push({y:y,rd:2}) }
  if(c[2]){ u.hkPk[hkPkKey(y,3,from)]={to:to}; L.push({y:y,rd:3}) }
  return L }
/* the deep roster: a man to his spot in order; whoever drops off the end is returned */
function hkPlace(R,p){ const k=POS.findIndex(P=>P.p===p.p); p.i=k;
  const S=hkSlots(k), L=S.map(j=>R[j]).filter(Boolean).concat([p]).sort((a,b)=>b.r-a.r);
  const out=L.length>S.length?L.pop():null; S.forEach((j,n)=>R[j]=L[n]||null); return out }
function hkSortSpots(R){ POS.forEach((_,k)=>{ const S=hkSlots(k), L=S.map(j=>R[j]).filter(Boolean).sort((a,b)=>b.r-a.r); S.forEach((j,n)=>R[j]=L[n]||null) }) }
/* what a man adds at his spot: the first two places are the engine's (seven-tenths and three-tenths of the minutes),
   the third and fourth play through injuries */
const HK_DW=[0.7,0.3,0.08,0.03];
function hkGain(R,p){ const k=POS.findIndex(P=>P.p===p.p), S=hkSlots(k), w=POS[k].w;
  const L=S.map(j=>R[j]).filter(Boolean).map(hkVal).sort((a,b)=>b-a), v=A=>A.reduce((s,x,n)=>s+(HK_DW[n]||0)*x,0);
  const M=L.concat([hkVal(p)]).sort((a,b)=>b-a).slice(0,S.length);
  return (v(M)-v(L))*w*3 }

function hkRun(u,rng,healthy,elo,rec,choices){
  const U_CH=choices.users||(choices.userTeam?{[choices.userTeam]:choices}:{});
  hkStart(u);                                           // a career from before comes onto the rules this summer
  hkIndex(u);                                           // this summer's market, from the league as the season left it
  NAMES.forEach(t=>{ const R=u.roster[t]; while(R.length<HK_N)R.push(null) });
  const DN=draftNight(u,rec,elo,U_CH,LEAGUE.offseason.draftRounds);
  const chFor=t=>U_CH[t]||null, ut=choices.userTeam;
  if(ut&&choices.coach){const c=choices.coach; u.coach[ut]={n:c.n,q:c.q,t:0,hired:true,arch:c.arch,rec:c.rec||0}}
  const rep={resigned:{},released:{},retired:{},grew:{},drafted:{},signed:{},filled:{},buyouts:{},rfa:{},arb:{},os:[],res:{},up:{},cap:{}};
  NAMES.forEach(t=>{ ["resigned","released","retired","grew","drafted","signed","filled","buyouts","rfa","arb","res","up"].forEach(k=>rep[k][t]=[]) });
  const pool=[], risers=[], fallers=[];
  u.alumni=u.alumni||{}; u.hkDead=u.hkDead||{}; u.hkRes=u.hkRes||{};
  const leave=(t,p,why)=>{
    if(p.joined>u.year)return;
    u.alumni[t]=u.alumni[t]||[];
    u.alumni[t].push({n:p.n,p:p.p,from:Math.min(u.year,p.joined||u.year-(p.yrsHere||1)),to:u.year,
      peak:p.peak||p.r,yrs:p.yrsHere||1,draft:p.draft||null,
      line:LEAGUE.records.alumniLine({p:p.p,car:p.car,yrs:p.yrsHere||1}),why:why,
      car:p.car?{goals:p.car.goals||0,ast:p.car.ast||0,pts:p.car.pts||0,sog:p.car.sog||0,sv:p.car.sv||0,so:p.car.so||0}:null});
    if(u.alumni[t].length>40){u.alumni[t].sort((a,b)=>b.peak-a.peak);u.alumni[t].length=40}
  };
  const toPool=(t,p,why)=>{ if(p.r>=HK_POOLR&&vetOK(Object.assign({},p,{age:p.age+(p.aged?0:1)}))){ p.from=t; pool.push(p) } else leave(t,p,why) };
  // dead money: a season of it gone
  NAMES.forEach(t=>{ u.hkDead[t]=(u.hkDead[t]||[]).filter(d=>{ d.yrs--; return d.yrs>0 }) });
  const nextDraft=u.year+1;

  NAMES.forEach(t=>{
    const before=u.program[t], c=u.coach[t], R=u.roster[t], ch=chFor(t), st=hkStyle(u,t,elo,ch);
    u.program[t]+=0.05*(elo[t]-u.program[t])+c.q*COACH_BUILD*0.4+rng.gauss(0,9);
    u.program[t]=Math.max(1300,Math.min(1720,u.program[t]));
    c.t++;
    R.forEach(p=>{ if(p){ hkService(p); p.svc++ } });
    hkResOf(u,t).forEach(p=>{ hkService(p); if(p.k)p.svc++ });
    // buyouts, in June: the years after this one, at a third of the cap hit (a sixth under 26) for twice as long
    const bo=ch?(ch.buyouts||[]).map(key=>R.findIndex(p=>p&&faKey(t,p)===key)).filter(i=>i>=0):hkCpuBuyout(u,t,R);
    bo.forEach(i=>{ const p=R[i]; if(!p||p.k.yrs<2)return; const left=p.k.yrs-1, hit=hkBuyHit(p);
      u.hkDead[t].push({n:p.n,p:p.p,sal:hit,yrs:2*left,why:"buyout"});
      rep.buyouts[t].push({n:p.n,p:p.p,r:p.r,age:p.age,sal:p.k.sal,left:left,hit:hit,yrs:2*left});
      R[i]=null; rep.released[t].push({n:p.n,p:p.p,r:p.r,why:"buyout"}); toPool(t,p,"bought out") });
    // contracts that end now
    const plan=(ch&&ch.resign)?ch.resign:hkResignPlan(u,t,R,HK_AIM[st]);
    for(let i=0;i<R.length;i++){
      const p=R[i]; if(!p)continue;
      p.yrsHere=(p.yrsHere||0)+1;
      if(p.k.yrs>1){p.k.yrs--;continue}
      const s=hkStatus(p), d=plan[i], age=p.age+1;
      if(s==="UFA"){
        if(d){ const sal=hkAsk(p.r,age), yrs=hkYears(age,p.r,true); p.k={sal:sal,yrs:yrs,v:3}; rep.resigned[t].push({n:p.n,p:p.p,r:p.r,sal:sal,yrs:yrs,st:s}) }
        else { R[i]=null; rep.released[t].push({n:p.n,p:p.p,r:p.r,why:"expired"}); toPool(t,p,"released") }
        continue }
      if(!d){ R[i]=null; rep.released[t].push({n:p.n,p:p.p,r:p.r,why:"not qualified"}); rep.rfa[t].push({n:p.n,p:p.p,r:p.r,q:false}); toPool(t,p,"not qualified"); continue }
      if(d==="arb"&&s==="RFA-A"||!ch&&s==="RFA-A"&&(strHash("file|"+p.n+"|"+u.year)%100)<12){
        // he files (or you take him there): the arbitrator's award; the club picks one or two years, and may walk away
        // from a big award (he's then unrestricted)
        const aw=hkAward(p), y2=ch&&ch.arbYrs&&ch.arbYrs[i]?ch.arbYrs[i]:(!ch&&aw<=hkAsk(p.r,age)*0.95?2:1);
        const walk=aw>=HK$.walk&&(ch?!!(ch.walk&&ch.walk[i]):aw>hkAsk(p.r,age)*1.02&&p.r<hkBar(i)+2);
        rep.arb[t].push({n:p.n,p:p.p,r:p.r,award:aw,yrs:y2,walked:walk,qo:hkQO(p.k.sal),filed:d==="arb"?"you":"he"});
        if(walk){ R[i]=null; rep.released[t].push({n:p.n,p:p.p,r:p.r,why:"walked away"}); toPool(t,p,"walked away"); continue }
        p.k={sal:aw,yrs:y2,v:3}; rep.resigned[t].push({n:p.n,p:p.p,r:p.r,sal:aw,yrs:y2,st:s,arb:1}); continue }
      // qualified: he signs his deal, long (buying his free-agent years) if he's young and good, else a bridge; a
      // sheet from another club may still come in free agency
      const {sal,yrs}=hkRfaDeal(p);
      p.k={sal:sal,yrs:yrs,v:3}; p.osY=u.year;
      rep.resigned[t].push({n:p.n,p:p.p,r:p.r,sal:sal,yrs:yrs,st:s}); rep.rfa[t].push({n:p.n,p:p.p,r:p.r,q:true,sal:sal,yrs:yrs});
    }
    // aging (as before), and the reserve list's prospects grow too
    let devMod=(ch&&ch.phil&&PHILOSOPHY[ch.phil])?PHILOSOPHY[ch.phil].dev*0.5:0;
    const ocq=(u.oc&&u.oc[t])?u.oc[t].q:0, dcq=(u.dc&&u.dc[t])?u.dc[t].q:0;
    const LEAP=+((typeof process!=="undefined"&&process.env&&process.env.NBA_LEAP)||0.07);
    const grow=(p,i,res)=>{ const was=p.r; p.age++; p.c=p.age; p.aged=1;
      const a=p.age-age26(p);
      const mu=ageBase26(a)+c.q*0.02+devMod+(ocq+dcq)*0.01+(a<=29?orgEdge(u,t)*0.75:0)+(res?0:featDev(ch,i)+(typeof moraleDev==="function"?moraleDev(p):0)+(typeof deployDev==="function"?deployDev(ch,i):0));
      develop26(u,p,a,mu,rng,{leap:LEAP,floor:35});
      p.peak=Math.max(p.peak||0,p.r);
      if(!res&&p.r-was>=5)rep.grew[t].push({n:p.n,p:p.p,age:p.age,from:was,to:p.r,leap:p.leap===u.year}) };
    R.forEach((p,i)=>{ if(p)grow(p,i,false) });
    R.forEach((p,i)=>{ if(!p)return; const a=p.age-age26(p);
      const odds=a>=36?0.9:a>=35?0.6:a>=34?0.35:a>=33?0.18:a>=32?0.08:0;
      if(rng.r()<odds+(p.r<55&&a>=29?0.3:0)){R[i]=null;rep.retired[t].push({n:p.n,p:p.p,age:p.age,r:p.r});leave(t,p,"retired")} });
    const L=u.hkRes[t]=hkResOf(u,t);
    L.forEach(p=>grow(p,0,true));
    // prospects: rights lapse at 21 unsigned; an entry-level deal at 20 for one worth it; a deal ended in the minors
    // is renewed for a man still coming, else he's let go
    u.hkRes[t]=L.filter(p=>{
      if(p.k&&p.k.yrs>1){ p.k.yrs--; return true }
      const worth=(p.pot||p.r)>=56||p.r>=50;
      if(!p.k&&p.age<20)return true;
      if(!p.k&&worth&&p.age<=21){ p.k={sal:hkElcSal(p.draft&&p.draft.overall),yrs:hkElcYrs(p.age),v:3,elc:1}; rep.res[t].push({n:p.n,p:p.p,r:p.r,pot:p.pot,elc:1}); return true }
      if(p.k&&worth&&p.age<=24){ p.k={sal:HK$.min,yrs:2,v:3,two:1}; return true }
      rep.res[t].push({n:p.n,p:p.p,r:p.r,pot:p.pot,gone:1}); return false });
    hkSortSpots(R);
    const dd=u.program[t]-before;
    if(dd>30)risers.push([t,Math.round(dd)]); if(dd<-30)fallers.push([t,Math.round(dd)]);
  });
  pool.forEach(p=>{ if(!p.aged){ p.age++; p.c=p.age } });

  // a trade agreed on the summer screen goes through now (as before)
  rep.trade={};
  Object.keys(U_CH).forEach(t=>{const ch=U_CH[t]; if(ch&&ch.trade)nflApplyTrade(u,t,ch.trade,rep,leave,pool)});
  NAMES.forEach(t=>hkSortSpots(u.roster[t]));

  // the draft: one who makes the team signs his entry-level deal now; the rest go on the reserve list, rights held
  delete u.draftClass;
  const picks=hkPlaceDraft(u,DN,rep,pool,leave);
  // the reserve list kept to its length: the least promising go
  NAMES.forEach(t=>{ const L=u.hkRes[t]; if(L.length>HK_RESMAX){ L.sort((a,b)=>hkVal(b)-hkVal(a)); L.splice(HK_RESMAX).forEach(p=>rep.res[t].push({n:p.n,p:p.p,r:p.r,pot:p.pot,gone:1})) } });

  // over the cap before July 1: the worst value goes (the bottom of the roster first)
  NAMES.forEach(t=>{ const R=u.roster[t];
    while(hkCapHit(u,t,R)+hkFill(R)>HK$.cap){ let wi=-1,wv=-1;
      R.forEach((p,i)=>{ if(!p||p.keep)return; const v=p.k.sal/Math.max(1,p.r-40)*(i<POS.length?0.6:1); if(v>wv){wv=v;wi=i} });
      if(wi<0)break; const out=R[wi]; R[wi]=null; rep.released[t].push({n:out.n,p:out.p,r:out.r,cap:true}); toPool(t,out,"released") } });

  // offer sheets. A club with room may sign another club's qualified restricted man (one rated 57 and up, not on an
  // entry-level deal's end in arbitration) to a sheet at his market price, if it holds the picks the sheet costs; his
  // club matches if the money fits and he's worth it to them, else takes the picks. Yours: your targets that are
  // restricted are your sheets; your restricted men are matched unless you said not to.
  rep.osMine={};
  const sheet=(from,p,t0,sal,yrs,user)=>{
    const comp=hkOsComp(sal), R0=u.roster[t0], i0=R0.indexOf(p); if(i0<0)return null;
    const ch0=chFor(t0), fits=hkCapHit(u,t0,R0)-p.k.sal+sal<=HK$.cap;
    const match=fits&&(ch0?!(ch0.nomatch&&ch0.nomatch[faKey(t0,p)]):hkVal(p)>=hkBar(i0)+2||sal<=hkAsk(p.r,p.age)*1.02);
    const e={n:p.n,p:p.p,r:p.r,age:p.age,from:t0,to:from,sal:sal,yrs:yrs,comp:comp,matched:match,user:user};
    if(match){ p.k={sal:sal,yrs:yrs,v:3}; delete p.osY }
    else { R0[i0]=null; p.k={sal:sal,yrs:yrs,v:3}; p.yrsHere=0; p.joined=u.year+1; p.keep=1; delete p.osY;
      e.picks=hkGiveComp(u,from,t0,comp,nextDraft); const out=hkPlace(u.roster[from],p); if(out)toPool(from,out,"released"); hkSortSpots(R0) }
    rep.os.push(e); return e };
  const rfaKey=(t,p)=>faKey(t,p);
  Object.keys(U_CH).forEach(t=>{ const ch=U_CH[t]; if(!ch||!ch.targets)return; rep.osMine[t]=[];
    ch.targets.forEach(key=>{ const [t0]=key.split("|"); if(t0===t)return; const R0=u.roster[t0]; if(!R0)return;
      const p=R0.find(x=>x&&rfaKey(t0,x)===key&&x.osY===u.year); if(!p)return;
      const b=hkBid(ch,key,Object.assign({},p,{ask:hkAsk(p.r,p.age)}),false), comp=hkOsComp(b.sal);
      if(hkCapHit(u,t,u.roster[t])+b.sal+hkFill(u.roster[t])>HK$.cap){ rep.osMine[t].push({n:p.n,p:p.p,from:t0,got:false,why:"you didn't have the cap room for the sheet"}); return }
      if(!hkOwnsComp(u,t,comp,nextDraft)){ rep.osMine[t].push({n:p.n,p:p.p,from:t0,got:false,why:`you don't hold the picks a ${hkMoney(b.sal)} sheet costs (${hkOsWords(comp)})`}); return }
      const e=sheet(t,p,t0,b.sal,b.yrs,1); if(e)rep.osMine[t].push({n:p.n,p:p.p,from:t0,got:!e.matched,sal:b.sal,yrs:b.yrs,comp:comp,why:e.matched?`${t0} matched your ${hkMoney(b.sal)} sheet`:""}) }) });
  // the computer's: rare, as in the real league (a club tight against the cap is the target)
  NAMES.forEach(t0=>{ const R0=u.roster[t0]; R0.forEach(p=>{ if(!p||p.osY!==u.year||p.r<57)return;
    const sal=hkClamp(hkAsk(p.r,p.age)*1.08), yrs=Math.min(HK$.yNew,5), comp=hkOsComp(sal);
    const tight=HK$.cap-hkCapHit(u,t0,R0)<sal-p.k.sal+1;
    if(!tight&&(strHash("os|"+p.n+"|"+u.year)%100)>=3)return;
    const cands=NAMES.filter(t=>t!==t0&&!chFor(t)&&hkStyle(u,t,elo,null)!=="young"&&HK$.cap*0.99-hkCapHit(u,t,u.roster[t])-hkFill(u.roster[t])>=sal&&hkOwnsComp(u,t,comp,nextDraft)&&hkGain(u.roster[t],p)>4)
      .sort((a,b)=>strHash("osc|"+a+p.n)-strHash("osc|"+b+p.n));
    if(cands.length&&(strHash("osg|"+p.n+"|"+u.year)%100)<(tight?25:40))sheet(cands[0],p,t0,sal,yrs,0) }) });
  NAMES.forEach(t=>u.roster[t].forEach(p=>{ if(p)delete p.osY }));

  // free agency from July 1: days of bidding
  pool.forEach(p=>{ p.ask=hkAsk(p.r,p.age); p.i=POS.findIndex(P=>P.p===p.p) });
  rep.targets={};
  const offers=[], live=o=>!o.dead&&!o.p.signed;
  const roomOf=(t,extra)=>HK$.cap-hkCapHit(u,t,u.roster[t])-hkFill(u.roster[t])+HK$.min-(extra||0);
  const sign=(o,d)=>{ const p=o.p, t=o.t, R=u.roster[t];
    p.signed=true; p.k={sal:o.sal,yrs:o.yrs,v:3}; p.faY=u.year+1; p.yrsHere=0; p.joined=u.year+1; if(o.user)p.keep=true;
    const out=hkPlace(R,p), n=offers.filter(x=>x.p===p&&!x.dead).length;
    rep.signed[t].push({n:p.n,p:p.p,r:p.r,age:p.age,sal:o.sal,yrs:o.yrs,from:p.from,day:d+1,bids:n,target:!!o.user});
    offers.forEach(x=>{ if(x.p===p&&x!==o&&!x.dead){x.dead=1; x.lost=o} }); o.won=1;
    if(out){ rep.released[t].push({n:out.n,p:out.p,r:out.r,why:"fa"}); if(!out.signed&&out.r>=HK_POOLR){ out.from=t; out.ask=hkAsk(out.r,out.age); out.i=POS.findIndex(P=>P.p===out.p); pool.push(out) } else leave(t,out,"released") } };
  const tgt={};
  Object.keys(U_CH).forEach(t=>{ const ch=U_CH[t]; if(!ch||!ch.targets||!ch.targets.length||!u.roster[t])return; rep.targets[t]=[];
    ch.targets.forEach(key=>{ const [team,n,pos]=key.split("|"); if(team!==t&&u.roster[team]&&u.roster[team].some(x=>x&&faKey(team,x)===key))return;   // a restricted man: his sheet above
      if((rep.osMine[t]||[]).some(x=>x.from===team&&x.n===n))return;
      const p=pool.find(x=>!x.signed&&faKey(x.from,x)===key);
      if(!p){ rep.targets[t].push({n:n,p:pos,from:team,got:false,why:"wasn't on the market (retired or re-signed)"}); return }
      const b=hkBid(ch,key,p,p.from===t), o={t:t,p:p,sal:b.sal,yrs:b.yrs,user:1,nz:0,key:key,team:team};
      offers.push(o); (tgt[t]=tgt[t]||[]).push(o) }) });
  for(let d=0;d<HK_FAD;d++){
    const pull={}; NAMES.forEach(t=>pull[t]=elo[t]+rng.gauss(0,45));
    NAMES.slice().sort((a,b)=>pull[b]-pull[a]).forEach(t=>{
      if(tgt[t]&&tgt[t].some(live)&&d<2)return;
      const mine=offers.filter(o=>o.t===t&&live(o)); if(mine.length>=2)return;
      const R=u.roster[t], ch=chFor(t), st=hkStyle(u,t,elo,ch);
      const out=mine.reduce((s,o)=>s+o.sal,0), room=roomOf(t,out)-HK$.cap*(1-HK_AIM[st]), free=Math.max(0,HK$.floor-hkCapHit(u,t,R)-out);
      const maxAge={contend:35,balanced:32,young:27}[st];
      let best=null,bv=0;
      pool.forEach(p=>{ if(p.signed||p.age-age26(p)>maxAge||mine.some(o=>o.p===p))return;
        const g=hkGain(R,p); if(g<=0)return;
        let cost=hk2(p.ask*(1+Math.max(0,rng.gauss(0.05,0.07))+(room>3*p.ask?0.05:0))*(1-orgEdge(u,t)*0.05));
        if(cost>room&&cost>HK$.min+0.05){ if(room>=p.ask*0.85&&room>HK$.min)cost=hk2(room); else return }
        const v=g-Math.max(0,cost-free-HK$.min)*0.3;
        if(v>bv){ bv=v; best=[p,cost] } });
      if(!best||bv<0.3)return;
      const [p,cost]=best;
      offers.push({t:t,p:p,sal:Math.max(HK$.min,cost),yrs:hkYears(p.age,p.r,p.from===t),nz:rng.gauss(0,0.03),d:d});
    });
    pool.filter(p=>!p.signed&&offers.some(o=>o.p===p&&!o.dead)).sort((a,b)=>b.r-a.r).forEach(p=>{
      const L=offers.filter(o=>o.p===p&&!o.dead).map(o=>({o:o,s:hkFaPref(u,p,o,elo)})).sort((a,b)=>b.s-a.s);
      if(L[0].s<hkFaHold(p,d)&&d<HK_FAD-1)return;
      for(const x of L){ if(x.o.sal>roomOf(x.o.t)+0.001&&x.o.sal>HK$.min+0.001){ x.o.dead=1; x.o.broke=1; continue } sign(x.o,d); break } });
  }
  Object.keys(tgt).forEach(t=>tgt[t].forEach(o=>{ const p=o.p, e={n:p.n,p:p.p,from:o.team};
    if(o.won){ rep.targets[t].push(Object.assign(e,{got:true,sal:o.sal,yrs:o.yrs})); return }
    let why;
    if(o.broke)why=`your ${hkMoney(o.sal)} offer didn't fit: only ${hkMoney(Math.max(0,roomOf(t)))} of cap room left`;
    else if(o.lost){ const w=o.lost, a=hkFaPref(u,p,o,elo,1), b=hkFaPref(u,p,w,elo,1), r=[];
      if(b.money>a.money+0.04)r.push("more money"); if(b.yrs>a.yrs+0.02)r.push(w.yrs>o.yrs?"more years":"the years he wanted"); if(b.win>a.win+0.02)r.push("a better team");
      if(b.role>a.role+0.02)r.push("a bigger role"); if(b.home>a.home)r.push("his old club");
      why=`signed with ${w.t} (${hkMoney(w.sal)} for ${nOf(w.yrs,"year")}${r.length?": "+r.join(", "):""})` }
    else why=p.signed?"signed elsewhere":"didn't sign with anyone";
    rep.targets[t].push(Object.assign(e,{got:false,why:why,bid:o.sal})) }));
  // a club still under the floor signs who's left, one-year deals at what it takes to get there
  NAMES.forEach(t=>{ const R=u.roster[t]; let g=0;
    while(hkCapHit(u,t,R)+hkFill(R)<HK$.floor&&g++<6){ const short=HK$.floor-hkCapHit(u,t,R)-hkFill(R);
      const p=pool.filter(x=>!x.signed).sort((a,b)=>hkGain(R,b)-hkGain(R,a))[0]; if(!p)break;
      const sal=hk2(Math.max(p.ask,Math.min(HK$.max,short+HK$.min))); sign({t:t,p:p,sal:sal,yrs:1},HK_FAD) } });
  pool.filter(p=>!p.signed).forEach(p=>leave(p.from,p,"unsigned"));
  NAMES.forEach(t=>u.roster[t].forEach(p=>{ if(p){ delete p.keep; delete p.aged } }));

  // the empty places: a prospect up from the reserve list who's ready, else a depth man for the minimum
  NAMES.forEach(t=>{ const R=u.roster[t], L=u.hkRes[t];
    // a prospect better than the last man at his spot comes up too (the last man goes, to the minors' depth: gone)
    L.slice().sort((a,b)=>b.r-a.r).forEach(p=>{ const k=POS.findIndex(P=>P.p===p.p), S=hkSlots(k), last=S.map(j=>R[j]);
      const open=last.indexOf(null)>=0, worst=last.filter(Boolean).sort((a,b)=>a.r-b.r)[0];
      if(p.r<46||!(open&&p.r>=48||worst&&p.r>worst.r+1))return;
      if(!p.k)p.k={sal:hkElcSal(p.draft&&p.draft.overall),yrs:hkElcYrs(p.age),v:3,elc:1};
      if(hkCapHit(u,t,R)+hkFill(R)-(open?HK$.min:worst.k.sal)+p.k.sal>HK$.cap)return;
      L.splice(L.indexOf(p),1); p.joined=u.year+1; p.yrsHere=0; delete p.two;
      const out=hkPlace(R,p); rep.up[t].push({n:p.n,p:p.p,r:p.r,age:p.age});
      if(out){ rep.released[t].push({n:out.n,p:out.p,r:out.r,why:"waived"}); leave(t,out,"waived") } });
    for(let i=0;i<R.length;i++)if(!R[i]){
      const deep=i>=2*POS.length, p=nflPlayer(rng,deep?44+rng.range(0,5):50+rng.range(0,5),24+rng.int(9),i%POS.length);
      hkService(p); p.k={sal:HK$.min,yrs:1,v:3}; p.joined=u.year+1; R[i]=p;
      rep.filled[t].push({n:p.n,p:p.p,r:p.r}) }
    // opening night: every club cap-compliant. Still over, the worst value below the top twelve is waived and a man
    // signed for the minimum takes his place
    for(let g=0;g<8&&hkCapHit(u,t,R)>HK$.cap+0.001;g++){ let wi=-1,wv=0;
      R.forEach((p,i)=>{ if(!p||i<2*POS.length||p.k.sal<=HK$.min+0.001)return; const v=(p.k.sal-HK$.min)/Math.max(1,p.r-38); if(v>wv){wv=v;wi=i} });
      if(wi<0)break; const out=R[wi]; rep.released[t].push({n:out.n,p:out.p,r:out.r,cap:true,why:"waived"}); leave(t,out,"waived");
      const p=nflPlayer(rng,44+rng.range(0,4),24+rng.int(9),wi%POS.length); hkService(p); p.k={sal:HK$.min,yrs:1,v:3}; p.joined=u.year+1; R[wi]=p;
      rep.filled[t].push({n:p.n,p:p.p,r:p.r}) }
    // and none under the floor: with nobody left worth signing, the one-year men are paid what it takes
    const short=HK$.floor-hkCapHit(u,t,R);
    if(short>0.001){ let C=R.filter(p=>p&&!p.k.elc&&p.k.yrs===1); if(!C.length)C=R.filter(p=>p&&!p.k.elc);
      C.forEach(p=>{ p.k.sal=hk2(Math.min(HK$.max,p.k.sal+short/C.length+0.005)) }); rep.floor=rep.floor||{}; rep.floor[t]=hk2(short) }
    hkSortSpots(R);
    R.forEach((p,i)=>{p.i=i%POS.length});
    const c=u.coach[t];
    u.trueBase[t]=rosterElo(R)+(c.t<=1?ROOKIE_DIP:0)+rng.gauss(0,ROSTER_NOISE*0.6);
    u.perceived[t]=0.55*elo[t]+0.45*rosterElo(R)+rng.gauss(0,PERCEPT_N*0.6);
    rep.cap[t]=hkCapHit(u,t,R);
  });
  // the ledger: this draft's picks are made
  if(u.hkPk)Object.keys(u.hkPk).forEach(k=>{ if(+k.split("|")[0]<=u.year)delete u.hkPk[k] });
  if(ut&&choices.phil)u.phil=choices.phil;
  u.hkFO=1;
  u.year++;
  risers.sort((a,b)=>b[1]-a[1]); fallers.sort((a,b)=>a[1]-b[1]);
  if(typeof S!=="undefined"&&S)S.lastNbaRep={rep:rep,picks:picks};
  return {risers:risers.slice(0,5),fallers:fallers.slice(0,5),draft:{picks:picks},contracts:rep,
    cap:Object.fromEntries(NAMES.map(t=>[t,rep.cap[t]]))};
}
/* draft night's picks, placed: one good enough for the roster signs his entry-level deal and plays; the rest go on the
   reserve list (rights held until 20, when the good ones sign) */
function hkPlaceDraft(u,DN,rep,pool,leave){
  const byPid={}; DN.prospects.forEach(p=>byPid[p.pid]=p);
  const out=[];
  DN.picks.forEach(d=>{
    const t=d.team, R=u.roster[t], p=byPid[d.pid];
    p.draft={round:d.round,pick:d.pick,overall:d.overall,team:t,year:u.year}; p.joined=u.year+1; p.drafted=true;
    p.a1=p.age; p.svc=0;
    const k=POS.findIndex(P=>P.p===p.p), S=hkSlots(k), worst=S.map(j=>R[j]).filter(Boolean).sort((a,b)=>a.r-b.r)[0];
    const made=p.r>=52&&(!worst||p.r>worst.r+2||S.some(j=>!R[j]));
    if(made){ p.k={sal:hkElcSal(d.overall),yrs:hkElcYrs(p.age),v:3,elc:1}; const o=hkPlace(R,p);
      if(o){ rep.released[t].push({n:o.n,p:o.p,r:o.r,why:"draft"}); if(o.r>=HK_POOLR){ o.from=t; pool.push(o) } else leave(t,o,"released") } }
    else (u.hkRes[t]=u.hkRes[t]||[]).push(p);
    rep.drafted[t].push({n:p.n,p:p.p,r:p.r,pot:p.pot,from:p.from,d:p.draft,made:made});
    out.push({n:p.n,p:p.p,team:t,r:p.r,pot:p.pot,from:p.from,d:p.draft,made:made,pid:p.pid});
  });
  if(DN.boardGone)rep.boardGone=DN.boardGone;
  return out }
