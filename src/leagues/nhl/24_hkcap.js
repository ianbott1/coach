/* ============ pro hockey: the front office (review round 3, engine 27) ============ */
/* The real 2026-27 NHL numbers (verified Nov 2026):
     upper limit $104.0M, lower limit $76.9M        https://www.nhl.com/news/nhl-nhlpa-announce-team-payroll-range-for-2026-27-season
     the most one player may count, 20% of the upper limit: $20.8M
                                                    https://thehockeynews.com/nhl/vancouver-canucks/latest-news/a-look-at-the-nhl-salary-cap-rules-for-the-2026-27-season
     league minimum $850K (2026-27); entry-level maximum $1.0M (the 2026 draft); the longest contract, from Sept 16,
     2026: 7 years re-signing your own player, 6 years with a new club; qualifying offers 110% of a salary up to $1.25M,
     105% up to $1.75M, 100% above          https://capwages.com/articles/2025-memorandum-of-understanding
     offer sheet compensation by average annual value (2026): $1.576M none, to $2.388M a third, to $4.776M a second,
     to $7.163M a first and a third, to $9.551M a first, second and third, to $11.939M two firsts, a second and a
     third, above that four firsts         https://www.prohockeyrumors.com/2026/05/nhl-sets-offer-sheet-thresholds-for-2026.html
     buyouts: two-thirds of what's left (one-third under 26), over twice the years left
                                                    https://capwages.com/articles/nhl-salary-cap-explained
     retained salary: up to 50%, three retained contracts at a time, no more than 15% of the cap retained in all
                                                    https://www.puckpedia.com/salary-cap/retained-salary
     salary arbitration: rights by age at the first contract and years as a pro (18-20: 4, 21: 3, 22-23: 2, 24+: 1)
                                                    https://www.prohockeyrumors.com/2016/07/capology-101-arbitration-part-1.html
     the award's term is the other side's choice, one or two years; a club may walk away from a big award
                                                    https://flamesnation.ca/news/cba-school-article-12-salary-arbitration
     the 2027 trade deadline, March 1      https://www.yardbarker.com/nhl/articles/2027_nhl_trade_deadline_set_for_march_1/s1_16958_44098157
     a 23-man active roster against the cap          https://capwages.com/articles/nhl-salary-cap-explained
   The game keeps 2026-27 money every season (the ratings are held to the opening league too: core recentre26).

   The roster: the twelve the engine plays (a first unit and a man behind each, slots 0-11) and eleven more to make
   twenty-three (slots 12-22: a third man at each spot, the third goalie included, and a fourth forward at each spot and
   a fourth man on each side of the blue line), the bottom six and the extras. They play through injuries; the cap
   counts all twenty-three. Behind them the reserve list (u.hkRes): the club's prospects, in junior or the minors, their
   rights held or signed to entry-level deals (a signed one counts toward the fifty contracts). Dead money (u.hkDead):
   buyouts and salary retained in trades.

   Careers begun before this (no u.hkFO) keep their old contracts and the old $90M limit until their first summer on
   engine 27, when they come onto these rules (hkStart): a season under way replays exactly. */
const HK$={cap:104.0, floor:76.9, min:0.85, max:20.8, elc:1.0, yOwn:7, yNew:6, active:23, contracts:50,
  retMax:0.5, retN:3, retShare:0.15, walk:5.7, deadline:"Mar 1",
  // offer sheet tiers (AAV, $M) and what each costs in picks: [firsts, seconds, thirds]
  os:[[1.57596,[0,0,0]],[2.387832,[0,0,1]],[4.775666,[0,1,0]],[7.163498,[1,0,1]],[9.551332,[1,1,1]],[11.939166,[2,1,1]],[1e9,[4,0,0]]]};
const hkFO=u=>!!((u||(typeof U!=="undefined"?U:null))||{}).hkFO;      // this career is on the front office's rules
const hkSummer=()=>typeof ENGINE_V!=="undefined"&&ENGINE_V>=27;       // a summer run on engine 27 brings a career onto them
/* the roster's shape: at each of the six spots, its slots best first (four deep up front and on the blue line, three in goal) */
const HK_N=23;
const hkSlots=k=>k<5?[k,k+6,k+12,k+18]:[k,k+6,k+12];
const hkSpot=i=>i%POS.length;
const hkDeep=R=>!!(R&&R.length>2*POS.length);
/* the market: what a prime-age free agent's rating is worth a year (2026-27 money). Set so a club of twenty-three at
   market prices costs about the cap, the best few players near $16-17M (Kaprizov's $17M is the 2026-27 high), a
   regular in the top six about $6-9M, the bottom of the roster the minimum to $1.5M. */
const HK_MK=[[40,0.85],[42,1.0],[44,1.4],[46,2.1],[48,3.0],[50,3.8],[52,4.6],[54,5.4],[56,6.3],[58,7.2],[60,8.2],[62,9.2],[64,10.2],[66,11.3],[68,12.4],[70,13.6],[72,14.8],[75,16.4],[78,17.5],[82,18.6]];
const HK_MKK=+((typeof process!=="undefined"&&process.env&&process.env.HK_MKK)||1);
/* the market's level: the curve's shape is the league's (a star near the most anyone is paid, a fourth-liner the
   minimum); its level is set each summer so the league's twenty-three-man rosters at market prices cost what the
   clubs can spend, the cap and a little over (restricted men, entry-level deals and the minimum then bring the
   payrolls under it). The players' ratings, not dice: the same league gives the same index */
const HK_TOP=17.5;                                       // the most a man asks (Kaprizov's $17.0M is the 2026-27 high)
const HK_SPEND=+((typeof process!=="undefined"&&process.env&&process.env.HK_SPEND)||1.3);
let HK_IDX=1;
function hkIndex(u){
  const L=[]; NAMES.forEach(t=>((u&&u.roster&&u.roster[t])||[]).forEach(p=>{ if(p)L.push(hkMarket(p.r)*hkAgeK(p.age+1)) }));
  if(L.length<NAMES.length*HK_N*0.9)return HK_IDX=(u&&u.hkIdx)||1;
  const want=NAMES.length*HK$.cap*HK_SPEND*L.length/(NAMES.length*HK_N); let k=1;
  for(let it=0;it<8;it++){ const s=L.reduce((a,x)=>a+Math.max(HK$.min,Math.min(HK_TOP,x*k)),0); k*=want/s }
  return HK_IDX=u.hkIdx=Math.max(0.7,Math.min(1.8,Math.round(k*1000)/1000)) }
const hkUseIdx=u=>{ HK_IDX=(u&&u.hkIdx)||1 };
function hkMarket(r){ const C=HK_MK; if(r<=C[0][0])return C[0][1]; for(let i=1;i<C.length;i++)if(r<=C[i][0]){ const [a,x]=C[i-1],[b,y]=C[i]; return x+(y-x)*(r-a)/(b-a) } return C[C.length-1][1] }
const hkAgeK=a=>a>=36?0.5:a>=34?0.62:a>=33?0.72:a>=32?0.82:a>=31?0.9:a>=30?0.96:1;
const hk2=x=>Math.round(x*100)/100;
const hkClamp=x=>hk2(Math.max(HK$.min,Math.min(HK$.max,x)));
/* a man's ask on the open market (age: next season's) */
function hkAsk(r,age){ return hkClamp(Math.min(HK_TOP,hkMarket(r)*HK_MKK*HK_IDX*hkAgeK(age))) }
/* the years he'd sign for: long for a good young man, short for an old one or a fringe one; own: his club can give one
   more than a new club can (7 against 6) */
function hkYears(age,r,own){ const mx=own?HK$.yOwn:HK$.yNew;
  let y=age<=24?(r>=60?mx:r>=55?3:2):age<=27?(r>=60?mx-1:r>=55?4:2):age<=29?(r>=58?5:r>=52?3:2):age<=31?(r>=58?4:2):age<=33?(r>=56?2:1):1;
  if(r<50)y=Math.min(y,age<=26?2:1);
  return Math.max(1,Math.min(mx,y)) }
/* status when a deal ends: unrestricted at 27 (age next season 28+, as the game counts it) or seven accrued seasons;
   restricted before that, with arbitration rights from the years as a pro his age at his first contract asks for */
const hkUFA=p=>(p.age>=27)||((p.svc||0)>=7);
const hkArbNeed=p=>{ const a=p.a1||19; return a<=20?4:a===21?3:a<=23?2:1 };
const hkArb=p=>!hkUFA(p)&&(p.svc||0)>=hkArbNeed(p);
function hkStatus(p){ return hkUFA(p)?"UFA":hkArb(p)?"RFA-A":"RFA" }
const HK_STW={UFA:"unrestricted",RFA:"restricted",["RFA-A"]:"restricted, arbitration rights"};
/* the qualifying offer: 110% of a salary up to $1.25M, 105% up to $1.75M, the same above */
const hkQO=sal=>hkClamp(sal<=1.25?sal*1.10:sal<1.75?sal*1.05:sal);
/* what a restricted man takes to re-sign: he can't go elsewhere freely, so less than his market (a bridge deal); with
   arbitration rights he can make his club pay about what comparable men are paid; never under the qualifying offer */
function hkRfaAsk(p){ const mk=hkAsk(p.r,p.age+1), k=hkArb(p)?0.9:0.74; return hkClamp(Math.max(hkQO(p.k.sal),mk*k)) }
/* the arbitrator's award: what comparable men are paid, a little either way (the player's own hash: no dice) */
function hkAward(p){ const h=(strHash("arb|"+p.n+"|"+(p.age|0))%1000)/1000; return hkClamp(Math.max(hkQO(p.k.sal),hkAsk(p.r,p.age+1)*(0.86+0.12*h))) }
/* an entry-level deal: three years signed at 18-21, two at 22-23, one at 24 and up; the first round near the maximum */
const hkElcYrs=age=>age<=21?3:age<=23?2:1;
const hkElcSal=o=>hk2(o==null?HK$.min:o<=32?HK$.elc-(o-1)*(0.1/31):o<=64?HK$.min+0.075:HK$.min);
/* offer sheet compensation for an AAV */
function hkOsComp(aav){ for(const [t,c] of HK$.os)if(aav<=t)return c; return [4,0,0] }
const hkOsWords=c=>{ const w=[]; if(c[0])w.push(c[0]===1?"a first":c[0]===2?"two firsts":"four firsts"); if(c[1])w.push("a second"); if(c[2])w.push("a third"); return w.length?w.join(", ").replace(/, ([^,]*)$/," and $1"):"no picks" };
/* a buyout: two-thirds of what's left (one-third under 26), paid over twice the years: each year counts a third of
   his cap hit against the cap (a sixth under 26) for twice the years left */
const hkBuyHit=p=>hk2(p.k.sal*(p.age<26?1/6:1/3));
/* money: $850K, $4.78M, $10.5M */
const hkMoney=x=>{ x=+x||0; return x<1?"$"+Math.round(x*1000)+"K":"$"+(Math.round(x*100)/100).toString()+"M" };
/* the cap: twenty-three on the roster, plus dead money (buyouts, salary retained in trades) */
function hkDeadOf(u,t){ return ((u&&u.hkDead&&u.hkDead[t])||[]).reduce((s,d)=>s+(d.sal||0),0) }
function hkCapHit(u,t,R){ R=R||(u&&u.roster&&u.roster[t])||[]; return hk2(payroll(R)+hkDeadOf(u,t)) }
const hkResOf=(u,t)=>((u&&u.hkRes&&u.hkRes[t])||[]);
function hkContracts(u,t,R){ R=R||(u&&u.roster&&u.roster[t])||[]; return R.filter(p=>p&&p.k).length+hkResOf(u,t).filter(p=>p.k).length }
const hkRetained=(u,t)=>((u&&u.hkDead&&u.hkDead[t])||[]).filter(d=>d.why==="ret");

/* ---- coming onto the front office's rules (a new career at its start; an older one at its first summer on engine 27).
   No draws from the season's dice: every number here is the player's or the club's own hash ---- */
function hkSeedRng(u,tag){ return new RNG((strHash("hkfo|"+((u&&u.seed)||0)+"|"+tag)>>>0)||1) }
/* when he signed his first contract, and the pro seasons since */
function hkService(p){ if(p.a1!=null)return; const h=strHash("a1|"+p.n)%100;
  p.a1=h<45?19:h<70?20:h<82?21:h<92?22:23; p.svc=Math.max(0,(p.age|0)-p.a1) }
/* a deal signed in seasons past: an old one runs over what he'd get now, a restricted man's under (his name: no dice) */
function hkPriceOld(p){
  hkService(p);
  if(p.svc<3&&p.a1<=21){ p.k={sal:hkElcSal(1+strHash("pk|"+p.n)%64),yrs:Math.max(1,3-p.svc),v:3,elc:1}; return }
  const was=0.78+(strHash(p.n+"|hk")%50)/100, rfa=p.age<=26?0.8:1;
  p.k={sal:hkClamp(Math.min(HK_TOP,hkAsk(p.r,p.age)*was*rfa)),yrs:Math.max(1,Math.min(HK$.yOwn,(p.k&&p.k.yrs)||1)),v:3} }
function hkStart(u){
  if(u.hkFO){ hkUseIdx(u); return }
  u.hkDead=u.hkDead||{}; u.hkRes=u.hkRes||{};
  // the eleven more to make twenty-three, and the reserve list
  NAMES.forEach(t=>{
    const R=u.roster[t]; if(!R)return;
    const rng=hkSeedRng(u,"roster|"+t+"|"+u.year), tg=eloToRating(u.program[t]||1500);
    while(R.length<HK_N)R.push(null);
    for(let i=2*POS.length;i<HK_N;i++){ if(R[i])continue;
      const k=hkSpot(i), above=R[i-POS.length]||R[k], deep=i>=3*POS.length;
      const p=nflPlayer(rng,tg-rng.range(deep?11:8,deep?19:15),rng.pick([21,22,23,24,26,28,30,32,34]),k);
      if(above)p.r=Math.min(p.r,above.r); p.pot=Math.max(p.pot,p.r);
      hkService(p); p.k=null; p.hkNew=1+rng.int(2); R[i]=p }
    distinctSurnames(R.filter(Boolean));
    // the reserve list: a few prospects, their rights held (18-19) or signed to entry-level deals (20-22)
    const L=u.hkRes[t]=u.hkRes[t]||[];
    for(let j=L.length;j<6;j++){ const age=18+(j%5), p=nflPlayer(rng,47-(age<20?6:2)+rng.range(-3,3),age,rng.int(POS.length));
      p.pot=Math.max(p.r+6,Math.min(80,p.r+Math.round(rng.range(8,22)))); hkService(p); p.a1=Math.min(age,20); p.svc=Math.max(0,age-20);
      p.draft={year:u.year-Math.max(1,age-17),overall:20+rng.int(70),round:1+rng.int(3),team:t}; p.drafted=true; p.from=rng.pick(LEAGUE.draftTeams);
      if(age>=20)p.k={sal:hkElcSal(p.draft.overall),yrs:Math.max(1,3-p.svc),v:3,elc:1};
      L.push(p) } });
  // the market's level from the league as it now stands, then every deal priced on it
  hkIndex(u);
  NAMES.forEach(t=>{
    const R=u.roster[t]; if(!R)return;
    R.forEach(p=>{ if(!p)return;
      if(p.hkNew){ const yrs=p.hkNew, was=0.8+(strHash(p.n+"|hk")%45)/100; delete p.hkNew;
        p.k=p.svc<3&&p.a1<=21?{sal:hkElcSal(33+strHash("pk|"+p.n)%60),yrs:Math.max(1,3-p.svc),v:3,elc:1}:{sal:hkClamp(Math.min(HK_TOP,hkAsk(p.r,p.age)*was)),yrs:yrs,v:3} }
      else if(!(p.k&&p.k.v===3))hkPriceOld(p) });
    // nobody starts over the cap: the best paid come down (they signed before the cap rose)
    const cap=HK$.cap*0.985, elc=R.filter(p=>p&&p.k.elc).reduce((s,p)=>s+p.k.sal,0); let pay=payroll(R);
    if(pay>cap){ const f=(cap-elc)/(pay-elc); R.forEach(p=>{ if(p&&!p.k.elc)p.k.sal=hkClamp(p.k.sal*f) }) }
    // and none far under it: a club's deals were made to spend near the cap (on opening night 2025-26 the most room
    // any club had was 15%: PuckPedia), so a thin sheet's veterans signed for more
    const aim=HK$.cap*(0.86+0.13*(strHash("aim|"+t)%100)/100);
    if(pay<aim){ const f=(aim-elc)/Math.max(1,pay-elc); R.forEach(p=>{ if(p&&!p.k.elc)p.k.sal=hkClamp(Math.min(HK_TOP,p.k.sal*f)) }) }
  });
  u.hkFO=1 }
