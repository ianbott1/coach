/* ============ pro basketball: the cap sheet (the front office, Nov 2026) ============ */
/* The real 2026-27 numbers (verified Nov 2026):
     cap $164.961M, tax line $200.428M, first apron $209.015M, second apron $221.686M, minimum team salary $148.465M,
     mid-level exceptions: non-taxpayer $15.044M, taxpayer $6.064M, room $9.366M     https://pr.nba.com/2026-27-salary-cap/
     bi-annual exception $5.477M       https://www.yardbarker.com/nba/articles/values_of_202627_mid_level_bi_annual_exceptions/s1_14822_44014426
     maximum salaries 25/30/35% of the cap by service (0-6, 7-9, 10+ years): $41.240M, $49.488M, $57.736M
                                       https://www.yardbarker.com/nba/articles/nba_maximum_salaries_for_202627/s1_14822_44013796
     minimum salaries by service 0..10+: $1.358M .. $3.877M
                                       https://www.yardbarker.com/nba/articles/nba_minimum_salaries_for_202627/s1_14822_44016395
     the rookie scale's first year, by pick (#1 $15.2M ... #30 $3.0M)  https://www.profootballnetwork.com/?p=1454081
     luxury tax per dollar over the line, in brackets: 1.00, 1.25, 3.50, 4.75, then +0.50 a bracket; repeaters 3.00, 3.25,
     5.50, 6.75 ...                    https://www.shamsports.com/cbaglossary/luxurytax.htm
     the 2026-27 bracket, $6.064M      https://www.salaryswish.com/luxury-tax/2027
     trade salary matching, 2026-27: under the first apron, out up to $9.1M takes back 200% + $0.25M, $9.1M-$35.2M takes
     back out + $9.1M, over $35.2M 125% + $0.25M; over the first apron 100%; over the second apron no aggregating
                                       https://fanspo.com/nba/trade-machine/rules
   The game tracks every player on a roster (fifteen), so a payroll here is the real thing, not a share of it.

   Careers begun before this (no u.foV) keep their old contracts until their next summer, when they are rescaled
   (nbaMigrate): a season under way replays exactly as it was played (the computer's deadline deals read the cap). */
const NBA$={cap:164.961, tax:200.428, ap1:209.015, ap2:221.686, floor:148.465,
  mleNT:15.044, mleT:6.064, mleRoom:9.366, bae:5.477,
  max:[41.240,49.488,57.736],
  min:[1.358,2.185,2.449,2.538,2.626,2.846,3.066,3.286,3.507,3.524,3.877],
  br:6.064, rate:[1,1.25,3.5,4.75], rep:[3,3.25,5.5,6.75],
  m1:9.1, m2:35.2};
const nbaFO=u=>!!((u||(typeof U!=="undefined"?U:null))||{}).foV;      // this career is on the front office's rules
/* years of service, from age: most come in at 20-22 */
const nbaSvc=age=>Math.max(0,Math.min(15,(age|0)-21));
const nbaMin=age=>NBA$.min[Math.min(10,nbaSvc(age))];
const nbaMax=age=>{ const s=nbaSvc(age); return s>=10?NBA$.max[2]:s>=7?NBA$.max[1]:NBA$.max[0] };
/* What the market pays, by rating: the stars at the max, a good starter about the mid-level and up, the end of the
   bench at the minimum. Set so a club of fifteen pays about the cap and the best-run spend into the tax (measured:
   test/nba-cap.js prints the league's payrolls). */
const NBA_PAYC=[[42,0],[46,3],[50,6.2],[54,11.5],[57,16.5],[60,23.5],[63,31.5],[66,40],[69,47],[72,55],[76,62]];
function nbaMarket(r){ const C=NBA_PAYC; if(r<=C[0][0])return 0; for(let i=1;i<C.length;i++)if(r<=C[i][0]){ const [a,x]=C[i-1],[b,y]=C[i]; return x+(y-x)*(r-a)/(b-a) } return C[C.length-1][1] }
function nbaAsk(r,age){
  let s=nbaMarket(r); if(age>=32)s*=0.72; else if(age>=30)s*=0.85; else if(age>=29)s*=0.93;
  return Math.round(Math.max(nbaMin(age),Math.min(nbaMax(age),s))*10)/10 }
function nbaYears(age,r){ return r<52?1+(age<=25?1:0):age<=24?4:age<=27?4:age<=29?3:age<=31?2:1 }
/* the rookie scale's first year, by overall pick; second-rounders sign for the rookie minimum */
const NBA_RK=[[1,15.2],[5,10.0],[10,6.6],[15,5.1],[20,4.0],[25,3.3],[30,3.0]];
function nbaRookieSal(o){ if(o>30)return NBA$.min[0]; for(let i=1;i<NBA_RK.length;i++)if(o<=NBA_RK[i][0]){ const [a,x]=NBA_RK[i-1],[b,y]=NBA_RK[i]; return Math.round((x+(y-x)*(o-a)/(b-a))*10)/10 } return 3.0 }
/* an option on a deal's last year, from the player's own name (no dice): a good player's deal often ends in his option,
   a fringe player's in the club's */
function nbaOptFor(p,yrs){ if(yrs<2)return null; const h=strHash(p.n+"|opt"); return p.r>=63&&h%3===0?"P":p.r<57&&h%4===0?"T":null }
const nbaK=(p,sal,yrs,extra)=>Object.assign({sal:sal,yrs:yrs,v:2},nbaOptFor(p,yrs)?{opt:nbaOptFor(p,yrs)}:{},extra||{});
/* the luxury tax on a payroll */
function nbaTaxBill(pay,repeater){ let over=pay-NBA$.tax, b=0, i=0; const R=repeater?NBA$.rep:NBA$.rate;
  while(over>0){ const x=Math.min(over,NBA$.br), r=i<4?R[i]:R[3]+0.5*(i-3); b+=x*r; over-=x; i++ } return Math.round(b*10)/10 }
/* where a payroll sits */
function nbaTier(pay){ return pay<NBA$.cap?"room":pay<NBA$.tax?"cap":pay<NBA$.ap1?"tax":pay<NBA$.ap2?"ap1":"ap2" }
const NBA_TIERW={room:"under the cap",cap:"over the cap",tax:"in the tax",ap1:"over the first apron",ap2:"over the second apron"};
/* salary matching: the most a club may take back for what it sends, by where it lands (fanspo's 2026-27 table) */
function nbaTakeBack(out,payBefore,payAfterIn){
  if(payAfterIn<=NBA$.cap+0.1)return Infinity;                          // room absorbs it
  if(payAfterIn>NBA$.ap1)return out;                                    // over the first apron: 100%
  return out<=NBA$.m1?2*out+0.25:out<=NBA$.m2?out+NBA$.m1:1.25*out+0.25 }
/* the owner's spending limit: what he'll pay into, by how big and well run the franchise is (a game rule) */
const NBA_BIG={"New York":2,"LA Lakers":2,"Golden State":2,"Boston":1,"LA Clippers":1,"Brooklyn":1,"Chicago":1,"Philadelphia":1,"Houston":1,"Dallas":1,"Miami":1,"Toronto":1};
function nbaBudget(u,t){ const pr=(u&&u.program&&u.program[t])||1500, big=NBA_BIG[t]||0;
  const s=(pr-1500)/100+big*0.6;
  const k=s>=1.6?4:s>=0.9?3:s>=0.2?2:s>=-0.6?1:0, m=nbaFO(u)?nbaMood(u,t):0;
  return NBA_TIERS()[m<0?Math.min(k,2):m>0?Math.min(4,k+1):k] }
const nbaMoney=x=>"$"+(+x).toFixed(1)+"M";
/* old contracts on the new scale (once, the summer a career comes onto these rules): each man paid what the market
   pays him now, a drafted man on his pick's rookie scale; his years left stay */
function nbaMigrate(u){
  if(u.foV)return; NAMES.forEach(t=>(u.roster[t]||[]).forEach(p=>{ if(!p||!p.k||p.k.v)return;
    const rk=p.draft&&p.draft.overall&&(u.year-p.draft.year)<4;
    p.k=nbaK(p,rk?nbaRookieSal(p.draft.overall):nbaAsk(p.r,p.age),p.k.yrs||1,rk?{rk:1}:null) })) }
/* options on a deal's last year. A player opts out when the market would pay him clearly more (and he's young enough to
   want the years); the club keeps its option when he's worth it. Both read the player as the summer opens (no dice). */
const nbaOptOut=p=>!!(p&&p.k&&p.k.opt==="P"&&p.k.yrs===2&&p.age<=30&&nbaAsk(p.r,p.age+1)>p.k.sal*1.15);
const nbaTeamKeeps=p=>p.r>=54||nbaAsk(p.r,p.age+1)>=p.k.sal*0.85;
const nbaExpiring=p=>!!(p&&p.k&&(p.k.yrs<=1||nbaOptOut(p)));
/* what a club can spend on another team's free agent this summer: its cap room, or once a summer the mid-level exception
   its payroll allows (non-taxpayer below the first apron, taxpayer below the second), never past the owner's limit;
   a minimum deal anyone can give */
function nbaSpend(u,t,R,used){ const pay=payroll(R), lim=nbaBudget(u,t);
  if(pay<NBA$.cap-1)return {amt:Math.min(NBA$.cap-pay,Math.max(0,lim-pay)),how:"room"};
  if(!(used&&used[t])){ const m=pay+NBA$.mleNT<=NBA$.ap1?NBA$.mleNT:pay+NBA$.mleT<=NBA$.ap2?NBA$.mleT:0;
    if(m&&pay+m<=lim+1)return {amt:m,how:"mle"} }
  return {amt:0,how:"min"} }
/* Free agency: days of bidding (26_offseason nflRun). What a player makes of an offer: the money against his market,
   the years he wants (a veteran wants security, a young man about what his age gets), winning (more to a veteran), the
   role he'd have at that club (a starter's minutes, a backup's, the end of the bench), and a nod to the club he played
   for. A game rule, set so the money decides most signings and the rest decide the close ones. */
const NBA_FAD=5;
function nbaFaPref(u,p,o,elo,parts){
  const R=u.roster[o.t], pY=nbaYears(p.age,p.r), s=R[p.i], b=R[BK(p.i)];
  const money=o.sal/Math.max(p.ask||0,nbaMin(p.age));
  const yrs=p.age>=30?0.03*Math.max(-2,Math.min(2,o.yrs-pY)):-0.03*Math.abs(o.yrs-pY);
  const e=elo&&elo[o.t]!=null?elo[o.t]:1500, win=(e-1500)/100*(p.age>=29?0.10:0.06);
  const role=(!s||p.r>s.r?0.07:!b||p.r>b.r?0:-0.10)*(p.r>=56?1:0.5);
  const home=o.t===p.from?0.04:0;
  if(parts)return {money:money,yrs:yrs,win:win,role:role,home:home};
  return money+yrs+win+role+home+(o.nz||0) }
/* what he holds out for on day d: the better he is, the longer he waits for the market */
const nbaFaHold=(p,d)=>(p.r>=63?1.08:p.r>=57?1.03:0.98)-0.05*d;
/* your offer to a target: the price and years you set, or his ask and about 10% for the years he wants */
function nbaBid(ch,key,p){ const b=ch&&ch.bids&&ch.bids[key];
  const sal=b&&b.sal?Math.max(nbaMin(p.age),Math.min(nbaMax(p.age),+b.sal)):Math.min(nbaMax(p.age),p.ask*1.1);
  return {sal:Math.round(sal*10)/10,yrs:b&&b.yrs?Math.max(1,Math.min(5,b.yrs|0)):nbaYears(p.age,p.r)} }
/* The owner and the tax (finances). The payroll a club ends the season on is what it pays: over the tax line it pays the
   tax (at the repeater's rates if it paid in three of the four seasons before), under the floor it pays the shortfall to
   its players. An owner who paid the tax for a losing season cuts the limit to the tax line for the next one; one who
   paid it for a title, or a season well past what the job expects, lets it out a tier. A game rule. */
const NBA_TIERS=()=>[NBA$.cap+10,NBA$.tax-6,NBA$.tax,NBA$.ap1,NBA$.ap2];
function nbaRepeater(u,t){ const Y=(u&&u.nbaTaxY&&u.nbaTaxY[t])||[], y=u?u.year:0; return Y.filter(x=>x<y&&x>=y-4).length>=3 }
/* the season's bill for a club, as its season ends: tax, or the floor's shortfall */
function nbaSeasonBill(u,t,pay){ return {tax:nbaTaxBill(pay,nbaRepeater(u,t)),short:Math.max(0,Math.round((NBA$.floor-pay)*10)/10),rep:nbaRepeater(u,t)} }
/* the owner's mood after a season: -1 (back under the tax), +1 (spend), 0 */
function nbaMoodOf(u,t,pay,w,l,champ){ if(nbaTaxBill(pay)<=0)return 0;
  const exp=LEAGUE.goals.expectations((u.program&&u.program[t])||1500), wp=w/Math.max(1,w+l), ew=exp.w/82;
  return champ===t||wp>=ew+0.08?1:wp<ew-0.06?-1:0 }
/* the mood that holds now: kept from the summer for the season that follows (u.nbaOwn), or, with the season over and
   the summer not yet run, read from the season just played */
function nbaMood(u,t){
  if(u&&u.nbaOwn&&u.nbaOwn.y===u.year&&(u.nbaOwn.s||!(typeof SEA!=="undefined"&&SEA&&SEA.year===u.year&&SEA.phase==="done")))return u.nbaOwn.m[t]||0;
  if(typeof SEA!=="undefined"&&SEA&&SEA.phase==="done"&&SEA.year===(u&&u.year)&&SEA.rec&&SEA.rec[t]&&SEA.roster&&SEA.roster[t])
    return nbaMoodOf(u,t,payroll(SEA.roster[t]),SEA.rec[t][0],SEA.rec[t][1],SEA.champion);
  return 0 }
