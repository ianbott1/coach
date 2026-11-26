/* ============ pro baseball: the front office (engine 27, review round 3) ============
   A baseball GM's year: no salary cap, an owner's payroll limit by market, the competitive balance tax, service time
   with pre-arbitration, arbitration (super two included) and free agency after six years, the qualifying offer with
   draft-pick compensation, the 26-man active roster and the 40-man roster, and a farm system (Triple-A, Double-A and
   Single-A) with options and designations for assignment.

   The real rules (verified Nov 2026):
     competitive balance tax 2026: threshold $244M; base rate 20% the first year over, 30% the second consecutive, 50%
       the third and after; surcharges 12% on $20-40M over, 42.5% on $40-60M over (45% for a repeat payer), 60% on
       $60M+ over; $40M+ over moves the club's top draft pick back ten places
                                       https://www.mlb.com/glossary/transactions/competitive-balance-tax
     minimum salary 2026 $780,000      https://www.ksat.com/sports/2026/04/09/ap-study-mlb-average-salary-hits-a-record-534m-as-the-mets-lead-spending-again/
     qualifying offer for 2027 $23.15M, the mean of the 125 highest salaries; only for a player who was with his club
       all season and never had one; compensation and forfeits by the clubs' tax and revenue-sharing status
                                       https://www.mlb.com/glossary/transactions/qualifying-offer
                                       https://frontofficesports.com/article/mlb-qualifying-offer-figure-rises-amid-labor-strife/
     service time: 172 days a year; arbitration from three years (super two: the top 22% of the two-year class with 86
       days the season before); free agency after six
                                       https://www.mlb.com/glossary/transactions/salary-arbitration
     arbitration pays a share of the open market that rises each year (about 20-30%, 35-60%, 50-85% of a free agent's
       price for the same production)   https://blogs.fangraphs.com/an-arbitration-compensation-update
     2026 opening-day payrolls: Mets $352.2M, Dodgers $316.6M, Yankees $297.2M, Cleveland $62.3M, eight under $100M;
       average salary $5.34M, median $1.4M (the AP study above)
   The agreement behind these numbers expires December 1, 2026 and a lockout is expected; owners have proposed a hard
   cap the union opposes. The game keeps the 2026 rules (the last ones agreed) for every season after, and says so.

   What the game tracks: the 26 men on u.roster are the active roster (thirteen starters and the man behind each; the
   bullpen's six other arms are the club's own, named from the club and the year: 50_game bsCorps). The farm is
   u.farm[team], each man with a level (AAA, AA, A) and on40 when he is on the 40-man roster. Every rule here is a game
   rule set from the real one; where it is simplified the comment says how.

   Determinism: a career is on these rules from u.mlbFO (set for a new career on engine 27, and for an older one at its
   first summer after an engine-27 season). Nothing here draws from the season's dice. The farm's own development and
   fill-ins draw from the summer's own stream (mlbFarmRng), so the rest of the summer is unmoved by them. */
const MLB$={cbt:244, rate:[0.20,0.30,0.50], sur:[[20,0.12],[40,0.425],[60,0.60]], surRep:0.45, pickBack:40,
  min:0.78, qo:23.15, qoBig:50, super2:0.22, s2days:86, svcDay:172, arbFrac:[0.25,0.42,0.62,0.75],
  minor40:0.1, opts:3, ilMin:10};
const mlbFO=u=>!!((u||(typeof U!=="undefined"?U:null))||{}).mlbFO;
const mlbOn=u=>mlbFO(u)&&typeof ENGINE_V!=="undefined"&&ENGINE_V>=27;
const MLB_ENV=(k,d)=>{ const v=typeof process!=="undefined"&&process.env?process.env[k]:undefined; return typeof v==="string"&&v!==""&&isFinite(+v)?+v:d };

/* ---- markets: the owner's payroll limit (a game rule: real payrolls by market, 2026) ---- */
const MLB_MKT={"NY Yankees":4,"NY Mets":4,"LA Dodgers":4,
  "Philadelphia":3,"Boston":3,"Toronto":3,"Chicago Cubs":3,"San Francisco":3,"Houston":3,"Atlanta":3,"Texas":3,"San Diego":3,
  "Seattle":2,"Detroit":2,"St. Louis":2,"LA Angels":2,"Arizona":2,"Baltimore":2,"Minnesota":2,"Milwaukee":2,"Colorado":2,
  "Cincinnati":2,"Chicago White Sox":2,"Washington":2,
  "Kansas City":1,"Pittsburgh":1,"Cleveland":1,"Tampa Bay":1,"Miami":1,"Sacramento":1};
const MLB_TIERB=[0,MLB_ENV("MLB_B1",92),MLB_ENV("MLB_B2",150),MLB_ENV("MLB_B3",215),MLB_ENV("MLB_B4",320)];   // $M a season, payroll and tax together
const mlbTier=t=>MLB_MKT[t]||2;
/* revenue-sharing recipients: the small markets (the real list moves a little each year) */
const mlbRecipient=t=>mlbTier(t)<=1||["Milwaukee","Cincinnati","Colorado","Minnesota"].indexOf(t)>=0;
/* what the owner will spend this season, tax included: his market, how strong the franchise is, and his mood (a tax bill
   for a losing season tightens it a step; a title or a season well past what the job expects loosens it) */
function mlbBudget(u,t){
  const pr=(u&&u.program&&u.program[t])||1500, f=Math.max(0.8,Math.min(1.25,1+(pr-1500)/700));
  const m=(u&&u.mlbOwn&&u.mlbOwn[t])||0;
  return Math.round(MLB_TIERB[mlbTier(t)]*f*(1+0.1*m)) }

/* ---- the market: what a free agent is worth a year, $M, by rating. A 60 is the league's median regular, about two
   wins a season, and two wins cost $16-20M on the open market (about $8-9M a win); a bench man (54) about half a win;
   the best (75+) $45M and more, as the stars' deals of 2024-26 ran. Relievers and designated hitters are paid less; a man past 31 less. ---- */
const MLB_PAYC=[[48,0.78],[51,1.2],[54,3],[57,8],[60,MLB_ENV("MLB_P60",15)],[63,22],[66,28],[69,34],[72,40],[75,46],[79,52],[85,60]];
function mlbMarket(r,pos,age){
  const C=MLB_PAYC; let s=C[C.length-1][1];
  if(r<=C[0][0])s=C[0][1]; else for(let i=1;i<C.length;i++)if(r<=C[i][0]){ const [a,x]=C[i-1],[b,y]=C[i]; s=x+(y-x)*(r-a)/(b-a); break }
  const P=String(pos||"").replace(/\d+$/,"");
  if(P==="CL")s*=0.6; else if(P==="DH")s*=0.85;
  if(age>=34)s*=0.7; else if(age>=32)s*=0.82; else if(age>=31)s*=0.92;
  return Math.round(Math.max(MLB$.min,s)*100)/100 }
/* the years a free agent wants: a young star the most */
function mlbFaYears(age,r){ if(r<57)return age<=29?2:1; return age<=26?(r>=66?7:5):age<=28?(r>=66?6:4):age<=30?4:age<=32?3:age<=34?2:1 }

/* ---- service time ---- */
/* a man's years in the majors as a career opens, from his age (most debut at 22-25) and a hash of his name (no dice) */
function mlbSvcStart(p){ const h=(strHash("svc|"+p.n+"|"+p.p)%1000)/1000, deb=22+Math.floor(h*3.5);
  return Math.max(0,Math.min(18,Math.round(((p.age||25)-deb+(h*7%1))*1000)/1000)) }
/* where he stands for next season: "pre" (pre-arbitration), "arb" (with which year), "fa" (free agency at the end of his
   deal). s2: the super-two set (keys) for this winter */
function mlbClass(p,s2){ const s=p.svc||0;
  if(s>=6)return {c:"fa"};
  if(s>=3)return {c:"arb",y:Math.floor(s)-2+(p.s2?1:0)};
  if(s>=2&&s2&&s2.has(mlbKey(p))){ p.s2=1; return {c:"arb",y:1} }
  return {c:"pre"} }
const mlbKey=p=>p.n+"|"+p.p+"|"+(p.dob||p.age);
/* super two: the top 22% of the men with two to three years who had 86 days or more last season */
function mlbSuper2(all){ const two=all.filter(p=>p&&(p.svc||0)>=2&&(p.svc||0)<3&&!p.s2&&(p.svDays||0)>=MLB$.s2days).sort((a,b)=>b.svc-a.svc);
  const n=Math.round(two.length*MLB$.super2); return new Set(two.slice(0,n).map(mlbKey)) }

/* ---- what a season says about him: his line against what his rating promised, as rating points (-6..+6). The
   arbitration panel pays on production. Hitters by OPS-like runs; pitchers by ERA over their innings. ---- */
function mlbPerf(p){ const s=p&&p.st2; if(!s||!s.g)return 0; const P=String(p.p).replace(/\d+$/,"");
  if(P==="SP"||P==="CL"){ const ip=(s.ip||0)/3; if(ip<15)return 0; const era=s.er*9/ip, want=4.2-(p.r-60)*0.08;
    return Math.max(-6,Math.min(6,Math.round((want-era)*1.6*Math.min(1,ip/(P==="CL"?55:150))))) }
  const pa=(s.ab||0)+(s.bb||0); if(pa<150)return 0;
  const obp=((s.h||0)+(s.bb||0))/pa, iso=(s.hr||0)*3/Math.max(1,s.ab), v=obp+iso, want=0.38+(p.r-60)*0.006;
  return Math.max(-6,Math.min(6,Math.round((v-want)*60*Math.min(1,pa/500)))) }
/* the next salary of a man under the club's control: the pre-arbitration scale, or the arbitration award (a share of his
   market on the season he had, never below what he made) */
function mlbControlSal(p,cl){
  if(cl.c==="pre")return Math.round((MLB$.min+0.025*Math.floor(p.svc||0)+Math.max(0,p.r-60)*0.012)*100)/100;
  const perf=mlbPerf(p), M=mlbMarket(p.r+perf,p.p,p.age+1), f=MLB$.arbFrac[Math.max(0,Math.min(3,(cl.y||1)-1))];
  return Math.round(Math.max(p.k&&p.k.sal||MLB$.min,MLB$.min+(M-MLB$.min)*f)*100)/100 }

/* ---- the competitive balance tax on a season's payroll; rep: consecutive years over before this one ---- */
function mlbTaxBill(pay,rep){ const over=pay-MLB$.cbt; if(over<=0)return 0;
  let b=over*MLB$.rate[Math.min(2,rep||0)];
  MLB$.sur.forEach(([at,r],i)=>{ const top=i+1<MLB$.sur.length?MLB$.sur[i+1][0]:1e9, x=Math.max(0,Math.min(over,top)-at);
    b+=x*(i===1&&rep?MLB$.surRep:r) });
  return Math.round(b*10)/10 }
/* the tax payroll: the active roster, plus each 40-man man on the farm at a minor-league split (a game figure; the real
   one also counts benefits, about $17M a club, which the game leaves out) */
function mlbTaxPay(u,t,R){ R=R||u.roster[t]; return Math.round((payroll(R)+((u.farm&&u.farm[t])||[]).filter(p=>p.on40).length*MLB$.minor40)*10)/10 }
const mlbRep=(u,t)=>(u&&u.mlbTaxN&&u.mlbTaxN[t])||0;
/* what a club can add for next season inside its owner's limit, the tax it would pay included */
function mlbRoomFor(u,t,pay){ const B=mlbBudget(u,t), rep=mlbRep(u,t);
  let lo=0, hi=Math.max(0,B-pay);
  for(let k=0;k<20;k++){ const m=(lo+hi)/2; if(pay+m+mlbTaxBill(pay+m,rep)<=B)lo=m; else hi=m }
  return Math.round(lo*10)/10 }

/* ---- the 40-man roster and options ---- */
const mlb40=(u,t)=>(u.roster[t]||[]).filter(Boolean).length+((u.farm&&u.farm[t])||[]).filter(p=>p.on40).length;
const mlbOptsLeft=p=>Math.max(0,MLB$.opts-((p&&p.optY)||[]).length);
/* a man can be sent down without waivers while he has an option year left; a man with five years in the majors can
   refuse (simplified: he can't be optioned) */
const mlbCanOption=p=>mlbOptsLeft(p)>0&&(p.svc||0)<5;

/* ---- the farm ---- */
const MLB_LV=["AAA","AA","A"], MLB_LVW={AAA:"Triple-A",AA:"Double-A",A:"Single-A"};
const MLB_FARM={AAA:9,AA:7,A:7};   // places at each level (a game's farm: the men who matter, not the whole system)
function mlbFarmRng(u,salt){ return new RNG(((((u.seed||0)*2654435761)^((u.year|0)*40503)^strHash(salt||"farm"))>>>0)||1) }
/* where a prospect plays: by rating, with age pushing a man up */
const mlbLevelFor=p=>p.r>=54||(p.r>=50&&p.age>=24)?"AAA":p.r>=46||p.age>=22?"AA":"A";
/* a man for the farm: an organisation player (a minor-league free agent, or the system's own) */
function mlbFarmMan(rng,posIdx,lvl,u,t){
  const age=lvl==="AAA"?23+rng.int(6):lvl==="AA"?21+rng.int(4):19+rng.int(3);
  const base=lvl==="AAA"?51:lvl==="AA"?46:41;
  const r=Math.round(Math.max(36,Math.min(62,rng.gauss(base,3.2))));
  const room=age<=21?rng.gauss(10,4):age<=23?rng.gauss(7,3):age<=25?rng.gauss(4,2):rng.gauss(1,1);
  const p={n:playerName(rng),p:POS[posIdx].p,i:posIdx,c:age,age:age,r:r,pot:Math.round(Math.max(r,Math.min(84,r+room))),hz:0,prod:0,st:0,
    lvl:lvl,svc:0,k:{sal:0,yrs:0,t:"minor"},org:t};
  return p }
/* the farm a career opens with: each organisation's system, about the prospects its strength would develop */
function mlbFarmInit(u){
  u.farm={};
  NAMES.forEach(t=>{ const rng=mlbFarmRng(u,"init|"+t), F=[], edge=Math.max(-1.5,Math.min(1.5,((u.program[t]||1500)-1500)/100));
    MLB_LV.forEach(lv=>{ for(let k=0;k<MLB_FARM[lv];k++){ const p=mlbFarmMan(rng,k%POS.length,lv,u,t); p.r=Math.min(64,p.r+Math.round(edge)); p.pot=Math.max(p.pot,p.r); F.push(p) } });
    mlbNames(u,t,F); u.farm[t]=F });
  mlbProtect(u) }
/* no two men in an organisation share a name (renamed by hash, no dice) */
function mlbNames(u,t,F,keep){ const seen=new Set((u.roster[t]||[]).filter(Boolean).map(p=>p.n).concat((keep||[]).map(p=>p.n)));
  F.forEach(p=>{ let n=p.n, k=0; while(seen.has(n)&&k<PNAMES_L.length){ n=n.split(" ")[0]+" "+PNAMES_L[(strHash(p.n+"|"+t)+k)%PNAMES_L.length]; k++ } p.n=n; seen.add(n) }) }
/* the 40-man each winter: the best prospects at Triple-A and Double-A are protected (a man not on it can be taken in the
   Rule 5 draft after four or five years in the system: the game protects by quality instead), up to forty */
function mlbProtect(u,only){
  NAMES.forEach(t=>{ if(only&&only!==t)return; const F=(u.farm&&u.farm[t])||[], act=(u.roster[t]||[]).filter(Boolean).length;
    let room=40-act-F.filter(p=>p.on40).length;
    F.filter(p=>!p.on40&&p.lvl!=="A"&&(p.r>=53||p.pot>=66)).sort((a,b)=>mlbProsVal(b)-mlbProsVal(a)).forEach(p=>{ if(room>0){ p.on40=1; room-- } }) }) }
/* a prospect's worth to his club: now, and his ceiling while he is young */
const mlbProsVal=p=>p.r+(p.pot-p.r)*(p.age<=23?0.55:p.age<=25?0.35:0.1);
/* the farm's summer: each man ages and develops (more at a level that stretches him), moves up or down a level, and the
   men going nowhere are let go; then the levels are refilled with organisation players. On its own dice. */
function mlbFarmSummer(u,t,rep){
  const F=(u.farm&&u.farm[t])||[], rng=mlbFarmRng(u,"summer|"+t), out=[];
  const E=typeof orgEdge==="function"?orgEdge(u,t):0;
  F.forEach(p=>{ const was=p.r; p.age++; p.c=p.age; const a=p.age-(typeof age26==="function"?age26(p):0);
    const lvlUp=p.lvl==="AAA"?0.3:p.lvl==="AA"?0.5:0.6;   // playing every day at his level
    const mu=ageBase26(a)+lvlUp+(a<=27?E*0.6:0);
    develop26(u,p,a,mu,rng,{leap:MLB_ENV("MLB_FL",0.06),floor:30}); p.peak=Math.max(p.peak||0,p.r);
    if(p.r-was>=5&&rep)rep.push({n:p.n,p:p.p,age:p.age,from:was,to:p.r,lvl:p.lvl}) });
  // who stays: a 40-man man always (he is released through a designation, not here); otherwise not past 29, nor
  // a man well below his level's bar once he is no longer young
  const keep=F.filter(p=>p.on40||(p.age<=29&&!(p.age>=25&&p.r<44)&&!(p.age>=27&&p.r<48)));
  F.filter(p=>keep.indexOf(p)<0).forEach(p=>out.push(p));
  keep.forEach(p=>{ p.lvl=mlbLevelFor(p) });
  // the levels: the best stay, the rest move down, the last let go
  const byLv={AAA:[],AA:[],A:[]}; keep.forEach(p=>byLv[p.lvl].push(p));
  const F2=[];
  MLB_LV.forEach((lv,k)=>{ const L=byLv[lv].sort((a,b)=>(b.on40?100:0)+mlbProsVal(b)-(a.on40?100:0)-mlbProsVal(a));
    L.forEach((p,j)=>{ if(j<MLB_FARM[lv]||p.on40)F2.push(p); else if(k<2){ p.lvl=MLB_LV[k+1]; byLv[MLB_LV[k+1]].push(p) } else out.push(p) }) });
  // refill each level, a position at a time where the system is thinnest
  const fresh=[];
  MLB_LV.forEach(lv=>{ let n=F2.filter(p=>p.lvl===lv).length;
    while(n<MLB_FARM[lv]){ const have=POS.map((_,i)=>F2.filter(p=>p.i===i||p.p===POS[i].p).length), i=have.indexOf(Math.min(...have));
      const p=mlbFarmMan(rng,i,lv,u,t); F2.push(p); fresh.push(p); n++ } });
  mlbNames(u,t,fresh,F2.filter(p=>fresh.indexOf(p)<0));
  u.farm[t]=F2;
  return out }

/* the big leagues' young men still grow: a farm-built league is narrower than the one the game opens with, so the summer's
   re-centre no longer lifts the low end, and the 24-to-28 group would otherwise stall a year early (peak 26-29); the
   re-centre takes the level back, so the tilt is what's left: young men up, men past 30 a little faster down */
function mlbYoung(a){ const k=MLB_ENV("MLB_YB",0.75); return a<=25?k:a<=28?k*0.8:a<=29?k*0.3:a<=30?0:-k*0.5 }
/* the summer's re-centre (core recentre26) holds the majors' level and spread; it reads only the 26-man rosters, so the
   farm is moved the same way at the same moment, or it would drift above the league it feeds (each call-up then lifting
   the majors, and the re-centre taking it back from every man there). A front-office career only. */
function mlbFarmRecentre(u,rc){
  const R=typeof REF26!=="undefined"&&REF26.mlb; if(!rc||!(rc.s>0)||!R||!u||!u.mlbFO||!u.farm)return;
  const k=Math.min(1,R.s/rc.s), map=(v,h)=>Math.floor(R.m+(v-rc.m)*k+h);
  NAMES.forEach(t=>(u.farm[t]||[]).forEach(p=>{ const h=hash01("rcf|"+p.n+"|"+u.year);
    p.r=Math.max(30,Math.min(99,map(p.r,h))); if(p.pot!=null)p.pot=Math.min(99,Math.max(p.r,map(p.pot,h))) })) }
if(typeof recentre26==="function"){ const rc0=recentre26; recentre26=function(u){ const r=rc0(u); mlbFarmRecentre(u,r); return r } }
