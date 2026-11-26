/* ============ the transfer market: English football ============ */
/* Players under contract cost a fee as well as wages. A fee is set by what
   he earns (the pyramid's one wage scale), how young he is, how long his
   contract runs, and whether he's the selling club's starter. Players move
   up the pyramid, not down: one won't join a club in a lower division, and
   in the same division he wants a club of at least his own club's stature.
   Your transfer kitty is a share of what the club pays its squad and a little
   of what it earns, plus what you sell for, plus half of whatever you didn't
   spend last summer. Bigger
   clubs bid for your best players; you can take the money or keep them.
   Only your bids and sales move players between clubs: the computer's clubs
   rebuild through the academy and free transfers, as before, so the league
   behaves as it did. */
const KITTY_PAY=+((typeof process!=="undefined"&&process.env&&process.env.KP)||0.15);   // the kitty: a share of what the club pays its squad...
const KITTY_REV=+((typeof process!=="undefined"&&process.env&&process.env.KR)||0.015);   // ...and a little of what it earns
const KITTY_CARRY=0.5;         // of what's left at the end of the window
/* next season's division: during the summer, before the window runs, the
   season's promotions and relegations already decide it (as nflRun applies them) */
function tNextConf(t){
  if(typeof SEA==="undefined"||!SEA||SEA.phase!=="done"||!SEA.po||!SEA.po.PL||(U&&U.moved&&U.moved.year===SEA.year))return CONF[t];
  const P=SEA.po;
  if(P.PL.down.indexOf(t)>=0)return "CH";
  for(const [hi,lo] of [["CH","L1"],["L1","L2"],["L2","NL"]]){ if(P[hi].down.indexOf(t)>=0)return lo; if(P[lo].up.indexOf(t)>=0)return hi }
  if(P.CH.up.indexOf(t)>=0)return "PL";
  if(P.NN.up.indexOf(t)>=0||P.NS.up.indexOf(t)>=0)return "NL";
  if(P.NL.down.indexOf(t)>=0)return LEAGUE.region[t]==="S"?"NS":"NN";
  return CONF[t];
}
const tierOfClub=t=>DIVS[tNextConf(t)].tier;
function tFee(p,starter){
  const w=nflAsk(p.r,p.p,p.age), young=Math.max(0,26-p.age)*0.12;
  const yrs=Math.min(4,Math.max(1,p.k?p.k.yrs:2));
  let f=w*(2.4+young)*(0.6+0.2*yrs)*(starter?1.25:1);
  return Math.max(0.05,Math.round(f*10)/10);
}
// one decimal from £1M up to £100M: rounded to whole millions, last season's £17.5M wage bill read £17M on the summer
// page and £17.5M on the hub, and the summer's sums came out £0.5M short (Muse, rounds 19-20)
const money=x=>"£"+(x>=100?Math.round(x):x>=1?(+x).toFixed(1).replace(/\.0$/,""):(+x).toFixed(2))+"M";
/* would he join you? */
function tWilling(u,buyer,seller,prog){
  prog=prog||u.program;
  const tb=tierOfClub(buyer), ts=tierOfClub(seller);
  if(tb<ts)return {ok:true};
  if(tb>ts)return {ok:false,why:"won't drop a division"};
  if((prog[buyer]||1500)>=(prog[seller]||1500)-50)return {ok:true};
  return {ok:false,why:"won't leave for a smaller club"};
}
/* the kitty: set when the summer opens, from the season just played's wage bill
   (so re-signing or letting players go doesn't move it) */
function tKitty(u,t,pay){ return Math.round((pay*KITTY_PAY+budgetOf(u,t)*KITTY_REV)*10)/10+((u.kitty&&u.kitty[t])||0) }
const tKey=(t,p)=>t+"|"+p.n+"|"+p.p;
/* players who'd improve you, by position: under contract beyond this
   season, better than your starter (or, for a weak backup, than him) */
function tMarket(u,my,humans){
  const R=u.roster[my], out=[], F27=typeof fo27==="function"&&fo27();
  NAMES.forEach(t=>{
    if(t===my||(humans&&humans.indexOf(t)>=0))return;
    const T=u.roster[t], W=tWilling(u,my,t);
    T.forEach((p,j)=>{
      if(!p||!p.k||p.k.yrs<=1)return;                          // out of contract: a free transfer instead
      const i=j%POS.length, s=R[i], b=R[BK(i)];
      const better=s?p.r>=s.r+2:true, depth=b?p.r>=b.r+6&&p.r>=(s?s.r-3:0):false;
      if(!better&&!depth)return;
      if(F27&&p.loan)return;                                    // engine 27: on loan here, not theirs to sell
      out.push({key:tKey(t,p),n:p.n,p:p.p,i:i,team:t,age:p.age,r:p.r,pot:p.pot,
        fee:F27?ask27(u,t,p,j<POS.length,mustSell27(u,t)):tFee(p,j<POS.length), wage:nflAsk(p.r,p.p,p.age), willing:W.ok, why:W.why||"", starter:better,
        rc:F27?rcl27(u,t,p):null, hg:F27?hg27(p,CONF[t]):null, yrs:p.k.yrs});
    });
  });
  return out.sort((a,b)=>(b.r-a.r)||(a.fee-b.fee));
}
/* bids for your players: the biggest club he'd start for, at a premium */
function tOffers(u,my,humans){
  if(typeof fo27==="function"&&fo27())return tOffers27(u,my,humans);
  const R=u.roster[my], offers=[];
  R.forEach((p,j)=>{
    if(!p||!p.k||p.k.yrs<=1||p.r<55)return;
    const i=j%POS.length; let best=null;
    NAMES.forEach(t=>{
      if(t===my||(humans&&humans.indexOf(t)>=0))return;
      if(!tWilling(u,t,my).ok)return;
      const T=u.roster[t]; if(!(T[i]&&p.r>=T[i].r+3))return;
      const wage=nflAsk(p.r,p.p,p.age); if(payroll(T)+wage>budgetOf(u,t))return;
      if(!best||(u.program[t]||0)>(u.program[best]||0))best=t;
    });
    if(best)offers.push({key:tKey(my,p),n:p.n,p:p.p,r:p.r,age:p.age,team:best,fee:Math.round(tFee(p,j<POS.length)*1.1*10)/10,starter:j<POS.length});
  });
  return offers.sort((a,b)=>b.fee-a.fee).slice(0,3);
}
/* carry out the window for one club (called in the offseason run, after
   contracts, ageing, retirements and trades): sales first, then bids, in
   your order, while the money and the wage budget last */
const TW_ROOM=!(typeof process!=="undefined"&&process.env&&process.env.TW_ROOM==="0");   // round 90; TW_ROOM=0 for the control
function tWindow(u,t,ch,rep,pool,leave,prog){
  if(typeof fo27==="function"&&fo27())return tWindow27(u,t,ch,rep,pool,leave,prog);   // engine 27: the window you negotiate (below)
  const R=u.roster[t]; let kitty=ch.kitty!=null?ch.kitty:tKitty(u,t,payroll(R));
  const log=rep.transfers[t]=rep.transfers[t]||[];
  (ch.sales||[]).forEach(o=>{
    const j=R.findIndex(p=>p&&tKey(t,p)===o.key), [,n,pos]=o.key.split("|");
    if(j<0){log.push({out:true,n:n,p:pos,to:o.team,done:false,why:"retired before the deal"});return}
    const p=R[j]; R[j]=null; kitty+=o.fee;
    p.yrsHere=0; p.joined=u.year+1; p.k={sal:nflAsk(p.r,p.p,p.age),yrs:nflYears(p.age,p.p)};
    const B=u.roster[o.team], gone=nflPlace(B,p);
    if(gone){ if(gone.r>=58){gone.from=o.team;pool.push(gone)} else leave(o.team,gone,"released") }
    leave(t,p,"sold to "+o.team);
    log.push({out:true,n:p.n,p:p.p,r:p.r,to:o.team,fee:o.fee,done:true});
  });
  POS.forEach((_,i)=>{if(!R[i]&&R[BK(i)]){R[i]=R[BK(i)];R[BK(i)]=null}});
  (ch.bids||[]).forEach(key=>{
    const [st,n,pos]=key.split("|"), S2=u.roster[st]; const j=S2?S2.findIndex(p=>p&&tKey(st,p)===key):-1;
    if(j<0){log.push({n:n,p:pos,from:st,done:false,why:"retired or moved on before the window"});return}
    const p=S2[j], W=tWilling(u,t,st,prog);
    if(!W.ok){log.push({n:n,p:pos,from:st,done:false,why:W.why});return}
    // round 90: a newcomer pushes his position's backup out, whatever his rating; if that backup was bought this window,
    // the bid doesn't go through and costs nothing (two strikers bought, the first released the same summer: Brentford)
    { const i=POS.findIndex(P=>P.p===p.p), s0=R[i], b0=R[BK(i)];
      if(TW_ROOM&&s0&&b0&&b0.keep){log.push({n:n,p:pos,from:st,done:false,why:`no room at ${pos}: it would cut ${b0.n}, whom you just bought`});return} }
    const T=(ch.bidTerms||{})[key], fee=T?T.fee:tFee(p,j<POS.length), wage=T?T.wage:nflAsk(p.r,p.p,p.age);
    if(fee>kitty){log.push({n:n,p:pos,from:st,done:false,why:`${money(fee)} was more than you had left (${money(kitty)})`});return}
    if(payroll(R)+wage>budgetOf(u,t)){log.push({n:n,p:pos,from:st,done:false,why:`his ${money(wage)} a year wouldn't fit the wage budget`});return}
    S2[j]=null; if(j<POS.length&&S2[BK(j)]){S2[j]=S2[BK(j)];S2[BK(j)]=null}
    kitty-=fee; p.k={sal:wage,yrs:nflYears(p.age,p.p)}; p.yrsHere=0; p.joined=u.year+1; p.keep=true;
    const out=nflPlace(R,p);
    if(out){ rep.released[t].push({n:out.n,p:out.p,r:out.r}); if(out.r>=58){out.from=t;pool.push(out)} else leave(t,out,"released") }
    log.push({n:p.n,p:p.p,r:p.r,from:st,fee:fee,wage:wage,done:true});
  });
  u.kitty=u.kitty||{}; u.kitty[t]=Math.round(kitty*KITTY_CARRY*10)/10;
  rep.kittyLeft=rep.kittyLeft||{}; rep.kittyLeft[t]=Math.round(kitty*10)/10;
}

/* ---- engine 27: a window you negotiate (review round 3) ----
   A bid is an offer the selling club answers: it takes the asking price, counters a bid a little under it with the
   asking price, and a low one with more than it asked at first (it remembers being low-balled); it won't sell its best
   player to a club of its own standing for less than half as much again, unless his release clause is met (a club
   can't refuse that). A fee of £10M or more can be paid in instalments, 40% now and the rest over the next two
   summers. A player wanted by a bigger club too (a computer club that he'd start for, with the money) chooses it,
   unless you pay him a quarter more. The contract runs three to five years: the fee is amortised over it. Answers
   come from the rosters and the money, never dice: asking twice gets the same answer. */
function tAnswer27(u,my,seller,p,starter,offer,neg){
  const must=mustSell27(u,seller), ask=ask27(u,seller,p,starter,must), rc=rcl27(u,seller,p);
  if(rc&&offer>=rc-0.05)return {ok:true,clause:true,ask:ask,rc:rc};
  const R=u.roster[seller]||[], best=R.every(q=>!q||q===p||q.r<=p.r);
  const peer=tierOfClub(seller)===tierOfClub(my)&&(u.program[seller]||0)>=(u.program[my]||0)-100;
  const want=neg&&neg.want?neg.want:ask;
  if(best&&peer&&!must){ const top=Math.round(ask*1.5*10)/10; if(offer>=top-0.05)return {ok:true,ask:ask,rc:rc};
    return {ok:false,refuse:true,ask:ask,want:top,rc:rc,why:`not for sale: he's their best player${rc?`; his release clause is ${money(rc)}`:`, and they'd want ${money(top)}`}`} }
  if(offer>=want-0.05)return {ok:true,ask:ask,rc:rc};
  if(offer>=want*0.85)return {ok:false,counter:want,ask:ask,rc:rc,why:`they want ${money(want)}`};
  const up=Math.round(Math.max(want,ask*1.1)*10)/10;
  return {ok:false,counter:up,insult:true,ask:ask,rc:rc,why:`a low bid: they want ${money(up)} now`};
}
/* a computer club after the same man: the biggest that he'd start for, with the wage room, that he'd join, bigger than you */
function tRival27(u,my,seller,p,humans){
  if(hash01("rv|"+seller+"|"+p.n+"|"+u.year)>=T27_RIVAL_SHARE)return null;     // not every bigger club's scouts are on him
  const i=POS.findIndex(P=>P.p===p.p), wage=nflAsk(p.r,p.p,p.age); let best=null;
  NAMES.forEach(t=>{ if(t===my||t===seller||(humans&&humans.indexOf(t)>=0)||!u.roster[t])return;
    if(tierOfClub(t)>tierOfClub(my)||(tierOfClub(t)===tierOfClub(my)&&(u.program[t]||0)<=(u.program[my]||0)))return;
    if(!tWilling(u,t,seller).ok)return; const R=u.roster[t]; if(R[i]&&p.r<R[i].r+3)return;
    if(payroll(R)+wage-((R[BK(i)]&&R[BK(i)].k)?R[BK(i)].k.sal:0)>budgetOf(u,t))return;
    if(!best||(u.program[t]||0)>(u.program[best]||0))best=t });
  return best }
const T27_RIVAL_PAY=1.25, T27_INST=10, T27_RIVAL_SHARE=0.35;
/* the summer window, engine 27: your sales (the fees you agreed), then your agreed bids in your order */
function tWindow27(u,t,ch,rep,pool,leave,prog){
  const R=u.roster[t]; let kitty=ch.kitty!=null?ch.kitty:kitty27(u,t)||tKitty(u,t,payroll(R));
  const log=rep.transfers[t]=rep.transfers[t]||[]; u.saleP=u.saleP||{};
  (ch.sales||[]).forEach(o=>{
    const j=R.findIndex(p=>p&&tKey(t,p)===o.key), [,n,pos]=o.key.split("|");
    if(j<0){log.push({out:true,n:n,p:pos,to:o.team,done:false,why:"retired before the deal"});return}
    const p=R[j]; R[j]=null;
    const now=o.fee>=T27_INST?Math.round((o.fee-2*Math.round(o.fee*0.3*10)/10)*10)/10:o.fee;
    if(o.fee>=T27_INST)inst27(u,o.team,t,o.fee,u.year); kitty+=now;
    u.saleP[t]=Math.round(((u.saleP[t]||0)+o.fee-bookLeft27(p))*10)/10;
    p.yrsHere=0; p.joined=u.year+1; p.k={sal:nflAsk(p.r,p.p,p.age),yrs:nflYears(p.age,p.p)}; book27(p,o.fee,p.k.yrs); p.rcl=undefined; p.keep=true;
    const B=u.roster[o.team], gone=nflPlace(B,p);
    if(gone){ if(gone.r>=58){gone.from=o.team;pool.push(gone)} else leave(o.team,gone,"released") }
    leave(t,p,"sold to "+o.team);
    log.push({out:true,n:p.n,p:p.p,r:p.r,to:o.team,fee:o.fee,now:now,done:true});
  });
  POS.forEach((_,i)=>{if(!R[i]&&R[BK(i)]){R[i]=R[BK(i)];R[BK(i)]=null}});
  (ch.bids||[]).forEach(key=>{
    const [st,n,pos]=key.split("|"), S2=u.roster[st]; const j=S2?S2.findIndex(p=>p&&tKey(st,p)===key):-1;
    if(j<0){log.push({n:n,p:pos,from:st,done:false,why:"retired or moved on before the window"});return}
    const p=S2[j], W=tWilling(u,t,st,prog);
    if(!W.ok){log.push({n:n,p:pos,from:st,done:false,why:W.why});return}
    const i=POS.findIndex(P=>P.p===p.p), s0=R[i], b0=R[BK(i)];
    if(s0&&b0&&b0.keep){log.push({n:n,p:pos,from:st,done:false,why:`no room at ${pos}: it would cut ${b0.n}, whom you just bought`});return}
    const T=(ch.bidTerms||{})[key]||{}, fee=T.fee!=null?T.fee:ask27(u,st,p,j<POS.length), yrs=T.yrs||nflYears(p.age,p.p);
    let wage=T.wage!=null?T.wage:nflAsk(p.r,p.p,p.age);
    const rival=tRival27(u,t,st,p,rep.humans||[t]);
    if(rival&&!(T.pay>=T27_RIVAL_PAY)){log.push({n:n,p:pos,from:st,done:false,why:`he chose ${rival}, a bigger club`});return}
    const down=T.inst&&fee>=T27_INST?Math.round((fee-2*Math.round(fee*0.3*10)/10)*10)/10:fee;
    if(down>kitty+0.05){log.push({n:n,p:pos,from:st,done:false,why:`${money(down)} ${T.inst?"down ":""}was more than you had left (${money(kitty)})`});return}
    if(payroll(R)+wage-(b0&&b0.k&&!b0.keep?b0.k.sal:0)>budgetOf(u,t)+0.05){log.push({n:n,p:pos,from:st,done:false,why:`his ${money(wage)} a year wouldn't fit the wage budget`});return}
    if(hgBreak27(R,p,b0,CONF[t])){log.push({n:n,p:pos,from:st,done:false,why:`the squad list: he'd be a ninth player over 21 who isn't homegrown (17 of 25)`});return}
    S2[j]=null; if(j<POS.length&&S2[BK(j)]){S2[j]=S2[BK(j)];S2[BK(j)]=null}
    if(T.inst&&fee>=T27_INST)inst27(u,t,st,fee,u.year); kitty-=down;
    u.saleP[st]=Math.round(((u.saleP[st]||0)+fee-bookLeft27(p))*10)/10;
    leave(st,p,"sold to "+t);
    p.k={sal:wage,yrs:yrs}; book27(p,fee,yrs); p.rcl=undefined; p.yrsHere=0; p.joined=u.year+1; p.keep=true; p.from=st;
    const out=nflPlace(R,p);
    if(out){ rep.released[t].push({n:out.n,p:out.p,r:out.r}); if(out.r>=58){out.from=t;pool.push(out)} else leave(t,out,"released") }
    log.push({n:p.n,p:p.p,r:p.r,from:st,fee:fee,now:down,wage:wage,yrs:yrs,inst:!!(T.inst&&fee>=T27_INST),clause:!!T.clause,done:true});
  });
  u.kitty=u.kitty||{}; u.kitty[t]=Math.round(Math.max(0,kitty)*KITTY_CARRY*10)/10;
  rep.kittyLeft=rep.kittyLeft||{}; rep.kittyLeft[t]=Math.round(kitty*10)/10;
}

/* bids for your players, engine 27: clubs he'd go to (bigger, or a division up) that he'd start for, with the wage room;
   each bids nine tenths of what your club would ask. The biggest club for each man, the three best bids */
function tOffers27(u,my,humans){
  const R=u.roster[my], offers=[];
  R.forEach((p,j)=>{
    if(!p||!p.k||p.k.yrs<=1||p.r<55||p.loan||p.keep)return;
    const i=j%POS.length; let best=null;
    NAMES.forEach(t=>{
      if(t===my||(humans&&humans.indexOf(t)>=0)||!u.roster[t])return;
      if(!tWilling(u,t,my).ok)return;
      const T=u.roster[t]; if(!(T[i]&&p.r>=T[i].r+3))return;
      const wage=nflAsk(p.r,p.p,p.age); if(payroll(T)+wage-((T[BK(i)]&&T[BK(i)].k)?T[BK(i)].k.sal:0)>budgetOf(u,t))return;
      if(hgBreak27(T,p,T[BK(i)],tNextConf(t)))return;
      if(!best||(u.program[t]||0)>(u.program[best]||0))best=t;
    });
    if(best){ const ask=ask27(u,my,p,j<POS.length,false);
      offers.push({key:tKey(my,p),n:p.n,p:p.p,r:p.r,age:p.age,team:best,fee:Math.round(ask*0.9*10)/10,ask:ask,starter:j<POS.length}) }
  });
  return offers.sort((a,b)=>b.fee-a.fee).slice(0,3);
}
/* asking a bidder for more: it goes to its limit, worked out once (a little over your club's own price, more for a
   club that needs him more), or walks away */
function tMore27(u,o){ const lim=o.ask*(1.0+0.3*hash01("more|"+o.key+"|"+o.team+"|"+u.year)), want=Math.round(o.fee*1.15*10)/10;
  return want<=lim?{ok:true,fee:want}:{ok:false,why:`${o.team} walked away: ${money(want)} was more than they'd pay`} }
