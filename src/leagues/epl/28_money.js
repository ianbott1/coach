/* ============ the money: English football (engine 27) ============ */
/* Review round 3 (branch soccer-fo). A club earns what its division pays and what its own support brings in, pays its
   squad out of that, and answers to the league's spending rule. All in millions of pounds a year, at real levels:

   - Premier League central money, 2024-25: an equal share of £96.9M (broadcast £89.0M and central commercial £7.9M),
     merit of £2.7M a place (£2.6M for 20th to £53.1M for the champions) and facility fees of £8.9M to £24.9M by how
     often a club is on television (https://www.nbcsports.com/soccer/news/premier-league-prize-money-how-much-is-each-table-position-worth).
     A club's own money (matchday, commercial, Europe) comes from its stature: about £45M at a promoted club to £550M
     at the top, so total revenue runs about £150M to £720M (Deloitte: the twenty clubs earned £6.8bn in 2024-25,
     https://www.deloitte.com/uk/en/services/consulting/research/annual-review-of-football-finance-premier-league-clubs.html).
   - The Championship: about £11M a club from the EFL's television deal and the Premier League's solidarity payment
     (https://www.footballtransfers.com/en/transfer-news/uk-championship/2026/05/efl-tv-money-parachute-payments-explained-championship-league-one-league-two),
     its own money £8M to £60M; £942M across the 24 clubs in 2024-25, wages 93% of revenue in 2023-24 (Deloitte,
     https://www.deloitte.com/uk/en/services/financial-advisory/research/annual-review-of-football-finance-football-league-clubs.html,
     https://www.deloitte.com/uk/en/about/press-room/deloitte-annual-review-of-football-finance-european-football-market-revenue.html).
   - Parachute payments: 55% of the equal share in the first season down, 45% in the second, 20% in a third for a club
     that had been up more than one season; they stop on promotion
     (https://en.wikipedia.org/wiki/Premier_League_parachute_and_solidarity_payments).
   - The spending rule from 2026-27, the Squad Cost Ratio: squad costs (players' and the head coach's wages, the
     amortisation of transfer fees, agents' fees) against football revenue plus the net profit on player sales. Over
     85% (the green line) a club pays a levy; over the red line, 115%, on 1 March it loses six points plus one for
     every £6.5M over (https://www.premierleague.com/en/news/4467022/new-premier-league-financial-system-explained).
     The Championship moved to its own squad cost rule at 85% of income from 2026-27 (owners may add up to £15M a
     season, https://fcbusiness.co.uk/news/efl-clubs-approve-changes-to-financial-control-rules/); the EFL hasn't
     published its sanctions, so the game uses the Premier League's for both.

   The game follows twelve men a club (six positions, a first choice and the man behind him). They are the core of a
   squad of 25: the rest of the squad, the bonuses and the manager bring a club's wage bill to about 2.4 times theirs
   (SQ27, calibrated so that the Premier League's wages run about 60% of revenue). At a club of stars the twelve are a
   bigger share of the bill (sq27, top flight only: down to three quarters of SQ27 at the top of the stature scale).
   That, the green line for letting men go (keep27), signings from abroad (abroad27) and players' ambition (AMB27) keep
   the big clubs big over a career: without them the top of the league wore down to the middle (test/longrun.js:
   starters' spread 9.2 to 6.8 in twenty seasons, wins' spread down a quarter). League One and below keep the wage
   budgets they had: their money isn't the story, and the rule is the top two divisions'. */
const M27={eq:96.9, merit:2.65, fac:[8.9,24.9], ch:11,
  chute:[0.55,0.45,0.20],
  own:{PL:[45,2.5,1420,2176], CH:[8,2.0,1300,1700]},
  board:{PL:0.70, CH:0.95},         // the board's own line: squad costs against revenue (the Championship's owners fund the gap)
  kit:{PL:0.40,CH:0.20},            // the summer's money for fees: a share of revenue (the Premier League spent £3.0bn gross in summer 2025 on £6.8bn
                                    // of revenue, the Championship £240M on £942M, and £145M the summer before)
  green:0.85, red:1.15, ptsBase:6, ptsPer:6.5,
  relWage:0.6,                      // a relegation clause: wages cut by 40% on going down (common in English contracts)
  amortMax:5};                      // fees amortised over the contract, five years at most (the Premier League's cap)
const SQ27=+((typeof process!=="undefined"&&process.env&&process.env.SQ27)||2.4);
const fo27=()=>typeof eng27==="function"&&eng27();
const ledgerDiv=d=>d==="PL"||d==="CH";
/* where a club is expected to finish in its division, by stature (for the merit payment before a ball is kicked) */
function expPos27(u,t,d){ const T=NAMES.filter(x=>(u.conf&&u.conf[x]||CONF[x])===d); return T.filter(x=>(u.program[x]||0)>(u.program[t]||0)).length+1 }
function stZ27(u,t,d){ const O=M27.own[d]; if(!O)return 0; return Math.max(-0.25,Math.min(1.15,((u.program[t]||1500)-O[2])/(O[3]-O[2]))) }
/* the parachute this coming season: by seasons since the drop */
function chute27(u,t){ const P=u.para&&u.para[t]; if(!P)return 0; const k=P.k||0; if(k>2||(k===2&&!P.long))return 0; return Math.round(M27.eq*M27.chute[k]*10)/10 }
/* a season's revenue, in parts (null below the Championship) */
function rev27(u,t,d,pos){
  d=d||CONF[t]; if(!ledgerDiv(d))return null;
  const z=stZ27(u,t,d), O=M27.own[d], own=Math.round(O[0]*Math.exp(O[1]*z)*10)/10;
  if(d==="PL"){ const p=pos||expPos27(u,t,d), zf=Math.max(0,Math.min(1,z));
    const tv=M27.eq, merit=Math.round(M27.merit*(21-Math.min(20,p))*10)/10, fac=Math.round((M27.fac[0]+(M27.fac[1]-M27.fac[0])*zf)*10)/10;
    return {tv:tv, merit:merit, fac:fac, own:own, chute:0, tot:Math.round((tv+merit+fac+own)*10)/10} }
  const tv=M27.ch, ch=chute27(u,t);
  return {tv:tv, merit:0, fac:0, own:own, chute:ch, tot:Math.round((tv+own+ch)*10)/10} }
/* the amortisation the twelve carry: each fee spread over its contract, five years at most */
const amort27=R=>R.reduce((s,p)=>s+(p&&p.am&&(p.amY||0)>0?p.am:0),0);
/* squad costs, the whole squad's, and the ratio the rule reads */
const SQ_TOP=0.25;
/* round 3 (soccer-spread): a Championship bill is flatter (few stars, more men on similar money), so the twelve are a
   smaller share of it than at a top-flight club: SQ_CH times SQ27. Squad costs at SQ27 read 59-61% of revenue
   (test/soccer-fo.js), against the real league's wages of 93%; at SQ_CH they read about 70%. The board's line is
   unchanged, so its wage room for the twelve is a sixth smaller (about three quarters of it in use, from two thirds) */
const SQ_CH=+((typeof process!=="undefined"&&process.env&&process.env.SQ_CH)||1.2);
function sq27(u,t,d){ d=d||CONF[t]; return d==="CH"?SQ27*SQ_CH:d!=="PL"?SQ27:SQ27*(1-SQ_TOP*Math.max(0,Math.min(1,stZ27(u,t,d)))) }   // the top flight's stars
function cost27(R,sq){ return Math.round((sq||SQ27)*(payroll(R)+amort27(R))*10)/10 }
function scr27(u,t,R,d,pos,sales){ const r=rev27(u,t,d,pos); if(!r)return null; const c=cost27(R||u.roster[t],sq27(u,t,d)); return {rev:r, cost:c, sales:sales||0, ratio:c/Math.max(1,r.tot+(sales||0))} }
/* the board's wage budget for the twelve, engine 27 (the top two divisions): its line on revenue, less the fees the
   twelve already carry. The old budgets (90 to 320 in the top flight, wages a quarter of it: the review's "the model
   doesn't bind at the top") stay for seasons begun on engine 26 and below, and for League One down */
function budget27(u,t,d){ d=d||CONF[t]; const r=rev27(u,t,d); if(!r)return null;
  return Math.max(1,Math.round((r.tot*M27.board[d]/sq27(u,t,d)-amort27(u.roster[t]||[]))*100)/100) }
/* a club up this summer (or, before the drop and rise are made, one going up) */
const prom27=(u,t)=>CONF[t]!=="PL"||!!(u.moved&&u.moved.year===u.year&&u.moved.moves&&u.moved.moves[t]==="PL");
/* the summer's money for fees: a share of revenue (a promoted club's board finds more, to stay up), less instalments
   still owed and any levy, plus what's due from sales made by instalments and half of last summer's leftover */
function kitty27(u,t,d){ d=d||CONF[t]; const r=rev27(u,t,d); if(!r)return null;
  const prom=d==="PL"&&prom27(u,t);
  const owe=owed27(u,t,u.year), due=due27(u,t,u.year), levy=(u.levy&&u.levy[t])||0;   // instalments made last summer fall due now
  return Math.max(0,Math.round((r.tot*M27.kit[d]*(prom?1.5:1)-owe+due-levy+((u.kitty&&u.kitty[t])||0))*10)/10) }
/* instalments: owed by a buyer, due to a seller, by the summer they fall in */
function owed27(u,t,y){ return ((u.inst&&u.inst[t])||[]).filter(x=>x.y===y&&x.f>0).reduce((s,x)=>s+x.f,0) }
function due27(u,t,y){ return ((u.inst&&u.inst[t])||[]).filter(x=>x.y===y&&x.f<0).reduce((s,x)=>s-x.f,0) }
/* a fee in instalments: 40% now, the rest in two equal parts over the next two summers (the selling club the same) */
function inst27(u,buyer,seller,fee,y){ u.inst=u.inst||{}; const later=Math.round(fee*0.3*10)/10;
  [[buyer,1],[seller,-1]].forEach(([t,s])=>{ if(!t)return; const L=u.inst[t]=u.inst[t]||[]; [y+1,y+2].forEach(yy=>L.push({y:yy,f:s*later})) });
  return Math.round((fee-2*later)*10)/10 }
/* a signing's book: the fee spread over the contract */
function book27(p,fee,yrs){ const n=Math.max(1,Math.min(M27.amortMax,yrs)); p.fee=fee; p.am=Math.round(fee/n*100)/100; p.amY=n }
const bookLeft27=p=>p&&p.am?Math.round(p.am*(p.amY||0)*10)/10:0;

/* homegrown: three seasons with an English or Welsh club before 21. The Premier League's squad list is 25, at most 17 of
   them not homegrown (players under 21 don't count against it:
   https://www.premierleague.com/en/news/4097471/premier-league-squad-lists-explained). Here, of the twelve, at most
   8 over 21 who aren't homegrown (17 of 25). The academy's graduates are homegrown; of the men the game began with, a
   share by division (most of the lower leagues' players came through English clubs) */
const HG_MAX=8;
function hg27(p,d){ if(!p)return false; if(p.hg==null){ const sh={PL:0.45,CH:0.65,L1:0.8,L2:0.85}[d]||0.9; p.hg=p.academy||hash01("hg|"+p.n+"|"+p.p)<sh?1:0 } return !!p.hg }
function nonHG27(R,d){ return R.filter(p=>p&&!hg27(p,d)&&(p.age||25)>21).length }
/* would bringing p in (and pushing out "out") break the Premier League's squad list? */
function hgBreak27(R,p,out,d){ if(d!=="PL"||hg27(p,d)||(p.age||25)<=21)return false; const n=nonHG27(R.filter(q=>q!==out),d); return n+1>HG_MAX&&n+1>nonHG27(R,d) }

/* release clauses: some players at clubs outside the top flight's top seven have one, more often lower down (a
   relegation or a "bigger club" clause): the club can't refuse a bid that meets it */
function rcl27(u,t,p){ if(!p)return null; if(p.rcl===undefined){ const d=CONF[t];
    const big=d==="PL"&&expPos27(u,t,d)<=7, sh=big?0:d==="PL"?0.12:d==="CH"?0.2:0.1;
    p.rcl=hash01("rc|"+p.n+"|"+p.p)<sh?Math.round(tFee(p,true)*1.6*10)/10:null }
  return p.rcl }

/* the season just played, closed: revenue by where each club finished, squad costs, the ratio, any levy for next summer */
function close27(u,sea){
  if(!sea||!sea.table||u.finY===u.year)return; u.finY=u.year; u.finLast={}; u.levy={};
  ["PL","CH"].forEach(d=>{ const T=sea.table(d); T.forEach((t,i)=>{
    const R=(sea.roster&&sea.roster[t])||u.roster[t]||[], sales=(u.saleP&&u.saleP[t])||0, x=scr27(u,t,R,d,i+1,sales); if(!x)return;
    const ded=(sea.ded&&sea.ded[t])||0, over=x.cost-M27.green*(x.rev.tot+sales);
    const levy=over>0?Math.round(over*(x.ratio-M27.green)*10)/10:0;
    if(levy>0)u.levy[t]=levy;
    u.finLast[t]={d:d,pos:i+1,rev:x.rev,cost:x.cost,sales:sales,ratio:Math.round(x.ratio*1000)/1000,levy:levy,ded:ded} }) });
  u.saleP={};
}
/* 1 March: the red line. Squad costs on the season's rosters (January's deals in) against the revenue the table
   points to now; over 115%, six points and one for every £6.5M over (sea.ded, read by LEAGUE.points) */
function assess27(sea){
  if(!fo27()||sea._ded27===sea.year)return; sea._ded27=sea.year; sea.ded=sea.ded||{};
  ["PL","CH"].forEach(d=>{ const T=sea.table(d); T.forEach((t,i)=>{
    const sales=((U&&U.saleP&&U.saleP[t])||0)+(typeof jSales27==='function'?jSales27(sea,t):0), x=scr27(U,t,sea.roster[t],d,i+1,sales); if(!x)return;   // January's sales too (99_fo_jan)
    const red=M27.red*(x.rev.tot+sales), over=x.cost-red;
    if(over>0)sea.ded[t]=M27.ptsBase+Math.floor(over/M27.ptsPer) }) });
  sea.dedNote=Object.keys(sea.ded).length?Object.assign({},sea.ded):null;
}
const MAR1=(()=>{ const D=LEAGUE.dates||[]; for(let k=0;k<D.length;k++){ const [m,dd]=String(D[k]).split(" "); if(m==="Mar"||m==="Apr"||m==="May")return k } return -1 })();

/* what a selling club asks: the fee the market sets (tFee: his wages, age, contract and place in the side), more for its
   best man, more from a bigger club, less from one that must sell; never more than a release clause */
function ask27(u,t,p,starter,must){
  let f=tFee(p,starter); const R=u.roster[t]||[];
  if(R.every(q=>!q||q===p||q.r<=p.r))f*=1.2;                                   // their best player
  if(must)f*=0.85;
  const c=rcl27(u,t,p); if(c&&f>c)f=c;
  return Math.max(0.05,Math.round(f*10)/10) }
/* the board's line is where a club stops signing; the line where it lets men go is the spending rule's green line in the
   top flight (85%, against the board's 70%): a club over its budget holds its players and buys nothing, as real ones
   do (Liverpool's wages were 63% of revenue in 2023-24), and sells or releases only past the green line, where the levy
   starts. In the Championship the board's line (95%) is already past the rule's (85%). Without it the big clubs, whose
   twelve run near their line, released a man a summer and the top of the league wore down */
function keep27(u,t){ const d=CONF[t], b=budgetOf(u,t); if(!fo27()||d!=="PL")return b; const r=rev27(u,t,d); if(!r)return b;
  return Math.max(b,Math.round((r.tot*M27.green/sq27(u,t,d)-amort27(u.roster[t]||[]))*100)/100) }
/* a club over that line must sell (a relegated club with top-flight wages, a club whose revenue fell) */
const mustSell27=(u,t)=>ledgerDiv(CONF[t])&&payroll(u.roster[t])>keep27(u,t)+0.01;
/* the computer's summer market (engine 27). Clubs buy as real ones do: the richest first and most (a share of revenue
   to spend, so the big clubs spend most), a promoted club's board finds half as much again to stay up, clubs over their
   line sell. A club buys a starter upgrade it can pay for now (40% of a fee of £20M or more down, the rest over two
   summers) and fit under its wage line, from its own division (a club its size or smaller) or up to two below; three
   at most a summer. The seller's backup steps up; a seller with money buys in turn. The home market draws nothing:
   its order comes from the money and the rosters (only a man from abroad is drawn, abroad27). */
const AMB27=6, AMB27_PROM=4;   // in the top flight a man more than 6 above a buying club's level (eloToRating of its stature) won't
                                 // go there; a promoted club's money talks, four more (the Championship's owners pay over the odds
                                 // for a promotion push: its wages were 93% of revenue, so it isn't held)
const M27_BUYS=[3,2,1];   // a summer's fee signings for the twelve, at most, by tier: a Championship club's market is smaller (its clubs spent
                          // £240M gross in summer 2025 to the top flight's £3.0bn: Deloitte, cited at the top of this file)
function market27(u,rep,pool,leave,prog,humans,rng){
  const H=new Set(humans||[]), tierOf=t=>DIVS[CONF[t]].tier;
  const clubs=NAMES.filter(t=>!H.has(t)&&u.roster[t]&&tierOf(t)<=3);
  const K={}, buys={}, must={};
  clubs.forEach(t=>{ const d=CONF[t]; K[t]=ledgerDiv(d)?kitty27(u,t,d):tKitty(u,t,payroll(u.roster[t])); must[t]=mustSell27(u,t) });
  rep.market=rep.market||[]; u.saleP=u.saleP||{};
  if(rng)abroad27(u,rep,pool,leave,clubs,K,buys,rng);   // first: a big club's scouts look abroad before they look down the table
  for(let round=0;round<3;round++){
    const order=clubs.filter(t=>K[t]>0.3&&(buys[t]||0)<M27_BUYS[tierOf(t)-1]).sort((a,b)=>K[b]-K[a]||(a<b?-1:1));
    order.forEach(B=>{
      const R=u.roster[B], dB=CONF[B], cap=budgetOf(u,B), top=dB==="PL"?eloToRating(u.program[B]||1500)+AMB27+(prom27(u,B)?AMB27_PROM:0):99; let best=null;
      NAMES.forEach(Sl=>{ const S2=u.roster[Sl]; if(Sl===B||H.has(Sl)||!S2)return; const dt=tierOf(Sl)-tierOf(B); if(dt<0||dt>2)return;
        if(!tWilling(u,B,Sl,prog).ok)return;
        S2.forEach((p,j)=>{ if(!p||p.keep||!p.k||p.loan||(p.age-age26(p))>31)return;
          if(p.r>top)return;                                               // a man well above the club's level wants a bigger stage
          const i=j%POS.length, s=R[i], gain=s?p.r-s.r:20; if(gain<3)return;
          const fee=ask27(u,Sl,p,j<POS.length,must[Sl]), down=fee>=10?Math.round(fee*0.4*10)/10:fee; if(down>K[B])return;
          const out=R[BK(i)], wage=nflAsk(p.r,p.p,p.age);
          if(payroll(R)+wage-(out&&out.k?out.k.sal:0)>cap)return;
          if(hgBreak27(R,p,out,dB))return;
          const v=gain*posW(POS[i])/(0.2+down/K[B])*(must[Sl]?1.15:1);
          if(!best||v>best.v)best={v:v,Sl:Sl,j:j,p:p,fee:fee,wage:wage} }) });
      if(!best)return;
      const {Sl,j,p,fee,wage}=best, S2=u.roster[Sl];
      S2[j]=null; if(j<POS.length&&S2[BK(j)]){ S2[j]=S2[BK(j)]; S2[BK(j)]=null }
      const now=fee>=10?inst27(u,B,Sl,fee,u.year):fee;
      K[B]-=now; if(K[Sl]!=null)K[Sl]+=now*0.8;                           // a seller puts part of what it's paid back into the squad
      u.saleP[Sl]=Math.round(((u.saleP[Sl]||0)+fee-bookLeft27(p))*10)/10;
      leave(Sl,p,"sold to "+B);
      p.k={sal:wage,yrs:nflYears(p.age,p.p)}; book27(p,fee,p.k.yrs); p.rcl=undefined; delete p.loanGot;
      p.yrsHere=0; p.joined=u.year+1; p.keep=true; p.from=Sl;
      const out=nflPlace(R,p);
      if(out){ rep.released[B].push({n:out.n,p:out.p,r:out.r,sal:(out.k&&out.k.sal)||0,why:"market"}); if(out.r>=58){out.from=B;pool.push(out)} else leave(B,out,"released") }
      buys[B]=(buys[B]||0)+1; must[Sl]=mustSell27(u,Sl);
      rep.market.push({to:B,from:Sl,n:p.n,p:p.p,r:p.r,age:p.age,fee:fee,dTo:dB,dFrom:CONF[Sl]});
    });
  }
  // what's left of each kitty: half carries over (as yours does)
  u.kitty=u.kitty||{}; clubs.forEach(t=>{ if(ledgerDiv(CONF[t]))u.kitty[t]=Math.round(Math.max(0,K[t])*0.5*10)/10 });
}
/* signings from abroad: much of the Premier League's money leaves it. Summer 2025: £3.0bn gross, £1.2bn net, so
   two fifths of what the clubs paid went out of the league, most of it abroad
   (https://www.deloitte.com/uk/en/about/press-room/deloitte-premier-league-spending-record-eclipsed.html). A top-flight club with the money signs a man from abroad at its own level (its stature: eloToRating) where a starter has fallen below
   it, one a summer and before the home market, inside its buys and its wage line. Without it the only men better than a big club's starters
   were at the other big clubs, and over a career the top of the league wore down to the middle (test/longrun.js). */
const ABROAD27={lift:2.5, min:3, top:7};   // a man 2.5 above the club's level, for a starter at least 3 below that; the seven biggest clubs
function abroad27(u,rep,pool,leave,clubs,K,buys,rng){
  clubs.filter(t=>CONF[t]==="PL"&&expPos27(u,t,"PL")<=ABROAD27.top&&K[t]>0.3&&(buys[t]||0)<M27_BUYS[0]).sort((a,b)=>K[b]-K[a]||(a<b?-1:1)).forEach(B=>{
    const R=u.roster[B], lvl=eloToRating(u.program[B]||1500), cap=budgetOf(u,B);
    let i=-1, gap=0; POS.forEach((_,k)=>{ const g=lvl+ABROAD27.lift-(R[k]?R[k].r:0); if(g>gap){gap=g;i=k} });
    if(i<0||gap<ABROAD27.min)return;
    const age=22+rng.int(6), p=nflPlayer(rng,lvl,age,i);
    p.r=Math.max(p.r,Math.round(lvl+ABROAD27.lift)); p.pot=Math.max(p.pot,p.r); p.k={sal:nflAsk(p.r,p.p,p.age),yrs:nflYears(p.age,p.p)};
    if(R[i]&&p.r<R[i].r+ABROAD27.min)return;
    const fee=tFee(p,true), down=fee>=10?Math.round(fee*0.4*10)/10:fee; if(down>K[B])return;
    const out=R[BK(i)]; if(payroll(R)+p.k.sal-(out&&out.k?out.k.sal:0)>cap)return;
    p.hg=0; if(hgBreak27(R,p,out,"PL"))return;
    const now=fee>=10?inst27(u,B,null,fee,u.year):fee; K[B]-=now;
    book27(p,fee,p.k.yrs); p.yrsHere=0; p.joined=u.year+1; p.keep=true; p.from="abroad";
    const o=nflPlace(R,p);
    if(o){ rep.released[B].push({n:o.n,p:o.p,r:o.r,sal:(o.k&&o.k.sal)||0,why:"market"}); if(o.r>=58){o.from=B;pool.push(o)} else leave(B,o,"released") }
    buys[B]=(buys[B]||0)+1;
    rep.market.push({to:B,from:null,abroad:true,n:p.n,p:p.p,r:p.r,age:p.age,fee:fee,dTo:"PL",dFrom:null}) });
}

/* ---- loans (engine 27) ----
   A young player goes out on loan for a season to a club a division or two down that he'd start for (its wage bill
   takes his wages); he comes home the next summer with a better one behind him for the minutes (LOAN_DEV: a starter's
   season worth a point more of development, a bench season a little). A club lends one man a summer at most, and
   borrows one. You can borrow a bigger club's young backup who'd start for you, for the season. */
const LOAN_DEV={start:1.2,bench:0.3}, LOAN_AGE=21;
function loanDest27(u,from,p,humans){ const i=POS.findIndex(P=>P.p===p.p), tf=tierOfClub(from); let best=null;
  NAMES.forEach(t=>{ if(t===from||(humans&&humans.indexOf(t)>=0)||!u.roster[t])return; const d=tierOfClub(t)-tf; if(d<1||d>2)return;
    const R=u.roster[t]; if(R.some(q=>q&&q.loan))return; if(R[i]&&p.r<R[i].r+2)return;
    if(payroll(R)+((p.k&&p.k.sal)||0)>budgetOf(u,t)*1.02)return;
    if(!best||(u.program[t]||0)>(u.program[best]||0))best=t });
  return best }
function loanOut27(u,t,p,dest,rep,pool,leave){ const R=u.roster[t], j=R.indexOf(p); if(j<0)return false; const B=u.roster[dest];
  R[j]=null; if(j<POS.length&&R[BK(j)]){ R[j]=R[BK(j)]; R[BK(j)]=null }
  p.loan={from:t,y:u.year+1};
  const out=nflPlace(B,p); if(out){ rep.released[dest].push({n:out.n,p:out.p,r:out.r,sal:(out.k&&out.k.sal)||0,why:"loan"}); if(out.r>=58){out.from=dest;pool.push(out)} else leave(dest,out,"released") }
  (rep.loans=rep.loans||[]).push({n:p.n,p:p.p,r:p.r,age:p.age,from:t,to:dest}); return true }
/* the summer's start: everyone on loan goes home, the minutes he had noted for his development */
function loanBack27(u,rep,pool,leave){
  NAMES.forEach(t=>{ const R=u.roster[t]; if(!R)return; R.forEach((p,i)=>{ if(!p||!p.loan)return;
    const home=p.loan.from, H=u.roster[home]; p.loanGot=i<POS.length?"start":"bench"; R[i]=null; delete p.loan;
    (rep.loanBack=rep.loanBack||[]).push({n:p.n,p:p.p,from:t,to:home,got:p.loanGot});
    if(!H){ leave(t,p,"loan ended"); return }
    const k=POS.findIndex(P=>P.p===p.p), s=H[k], b=H[BK(k)];
    if(s&&b&&p.r<b.r&&p.r<s.r&&!(p.age<=23&&(p.pot||p.r)>b.r+2)){ p.from=home; pool.push(p); return }   // not good enough for his own club's twelve: let go (a prospect who'll pass the backup stays)
    const out=nflPlace(H,p); if(out){ rep.released[home].push({n:out.n,p:out.p,r:out.r,sal:(out.k&&out.k.sal)||0,why:"loan back"}); if(out.r>=58){out.from=home;pool.push(out)} else leave(home,out,"released") } });
    POS.forEach((_,i)=>{ if(!R[i]&&R[BK(i)]){ R[i]=R[BK(i)]; R[BK(i)]=null } }) }) }
/* the summer's loans: yours out and in, then the computer's (a top-two-division club's young backup with a ceiling) */
function loans27(u,rep,pool,leave,U_CH){
  const humans=Object.keys(U_CH);
  humans.forEach(t=>{ const ch=U_CH[t]||{}, R=u.roster[t]; if(!R)return;
    (ch.loans||[]).forEach(key=>{ const p=R.find(q=>q&&tKey(t,q)===key); if(!p){ (rep.loans=rep.loans||[]).push({n:key.split("|")[1],from:t,done:false,why:"no longer here"}); return }
      const dest=loanDest27(u,t,p,humans); if(!dest){ (rep.loans=rep.loans||[]).push({n:p.n,p:p.p,from:t,done:false,why:"no club a division or two down that he'd start for"}); return }
      loanOut27(u,t,p,dest,rep,pool,leave) });
    (ch.loansIn||[]).forEach(key=>{ const [from]=key.split("|"), F=u.roster[from], p=F&&F.find(q=>q&&tKey(from,q)===key);
      if(!p||p.loan){ (rep.loans=rep.loans||[]).push({n:key.split("|")[1],to:t,done:false,why:"no longer available"}); return }
      const i=POS.findIndex(P=>P.p===p.p);
      if(payroll(R)+p.k.sal-((R[BK(i)]&&R[BK(i)].k)?R[BK(i)].k.sal:0)>budgetOf(u,t)+0.05){ (rep.loans=rep.loans||[]).push({n:p.n,p:p.p,from:from,to:t,done:false,why:"his wages wouldn't fit the wage budget"}); return }
      if(hgBreak27(R,p,R[BK(i)],CONF[t])){ (rep.loans=rep.loans||[]).push({n:p.n,p:p.p,from:from,to:t,done:false,why:"the squad list's homegrown rule"}); return }
      loanOut27(u,from,p,t,rep,pool,leave); p.keep=true }) });
  NAMES.forEach(t=>{ if(humans.indexOf(t)>=0||!ledgerDiv(CONF[t]))return; const R=u.roster[t];
    const c=R.map((p,j)=>({p:p,j:j})).filter(x=>x.p&&x.j>=POS.length&&!x.p.keep&&!x.p.loan&&x.p.age<=LOAN_AGE&&(x.p.pot||x.p.r)>=x.p.r+5&&R[x.j-POS.length]&&x.p.r<R[x.j-POS.length].r-4)
      .sort((a,b)=>(b.p.pot-b.p.r)-(a.p.pot-a.p.r))[0];
    if(!c)return; const dest=loanDest27(u,t,c.p,humans); if(dest)loanOut27(u,t,c.p,dest,rep,pool,leave) });
}
/* who you could borrow: a bigger club's young backup (21 or under) who'd start for you */
function loanInList27(u,my,humans){ const R=u.roster[my], out=[];
  NAMES.forEach(t=>{ if(t===my||(humans&&humans.indexOf(t)>=0)||!u.roster[t])return;
    if(tierOfClub(t)>tierOfClub(my)||(tierOfClub(t)===tierOfClub(my)&&(u.program[t]||0)<=(u.program[my]||0)+50))return;
    u.roster[t].forEach((p,j)=>{ if(!p||j<POS.length||p.loan||p.age>LOAN_AGE)return; const i=j%POS.length; if(R[i]&&p.r<R[i].r+1)return;
      out.push({key:tKey(t,p),n:p.n,p:p.p,i:i,team:t,age:p.age,r:p.r,pot:p.pot,wage:p.k.sal}) }) });
  return out.sort((a,b)=>b.r-a.r) }
