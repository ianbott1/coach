/* ============ RNG ============ */
/* a string to a 32-bit number (FNV-1a): names to stable seeds */
function strHash(x){ let h=2166136261; x=String(x); for(let i=0;i<x.length;i++)h=Math.imul(h^x.charCodeAt(i),16777619)>>>0; return h }
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* The order games are tried on a schedule day: those whose teams have most left first, jittered.
   It drew the jitter inside Array.sort's comparator, so the draws, and every one after, hung on
   how many comparisons the sort made, which isn't fixed for a comparator that changes its mind:
   on the same save one build in about four came out different (measured in pro basketball: a
   reload replayed the season on another schedule, 36-46 became 49-33; Grokbot's 54-28 to 53-29).
   Seasons begun from Nov 2026 (schedV 2) draw each game's jitter once and sort on that; a season
   already under way keeps the old draw, which is what it has been getting nearly every time. */
/* "1 goal", "2 goals": a count and its word ("1 GOALS, 1 ASSISTS": Grokbot) */
function nOf(n,w,ws){ return n+" "+(+String(n).replace(/,/g,"")===1?w:(ws||w+"s")) }
let SCHED_V=1;
/* round 71: the engine's version for a season, kept in the universe (u.engV) so a season begun on an older engine replays
   on it (a mid-season save would otherwise re-simulate its played weeks differently). 2: football's kicks (KICK2). */
let ENGINE_V=1; const ENGINE_NOW=+((typeof process!=="undefined"&&process.env&&process.env.ENGINE_NOW)||27);   // 27: the hockey front office (the real 2026-27 cap, twenty-three and a reserve list, restricted and unrestricted free agency, offer sheets, arbitration, buyouts, retained salary: leagues/nhl 24_hkcap); football game day (the weekly game plan on both sides of the ball, fourth downs, two-point tries, timeouts and challenges at real rates, interceptions); baseball's front office (the 26-man and 40-man, the farm, service time and arbitration, the tax, the qualifying offer, a market where players choose: leagues/mlb 24_fo); a league with a memory (records, Hall of Fame, awards night, the coaching carousel at real rates, owners); soccer's money (revenue by division, wages, the squad cost rule and its points deduction, transfer windows with fees, bids and counters, the computer's market, loans, the homegrown quota); soccer's scorers held to one man's season (no 65-goal striker: soccer 75_screens scPace); 26: hockey game day (the goalie pull as real benches pull, lines and legs, the timeout: HK_GD_V); soccer's matchday (the team sheet and formation, five changes in three windows, condition and rotation); the college roster economy (revenue sharing, NIL, the transfer portal: core 92_market); box scores, leaders and awards a stats fan believes (stats lines in all seven, MVP and Heisman by slot, baseball's walks); long-career integrity (ratings held to the opening league, ceilings, aging by position, the summer's own dice); baseball's dugout (handedness and platoons, a named bullpen with roles and rest, pitch counts and times through the order, the lineup card, holds, the call is who: BS_V26); 25: the review round: game day as coaching (basketball timeouts and runs: BB_GD_V), results like the real leagues (board targets from expected wins, in-season drift and injuries by league, shown chances refit), the people; 24: round 110, the opponent counts double against your fit (planVsK) and your assistant reads the plan as well as your staff (assistantPlan); 23: round 109, a person's plan is worth what his roster suits it over the opponent's (planVs); 3: round 72, football's defenses keep to their usual scheme more (FB_FAVW3)
                                      // 4: round 74, players' lines from the game's own record (Season._creditV4)
                                      // 5: round 75, baseball's hitters and pitchers by their own ratings (BS5)
                                      // 6: round 77, baseball's running game, named relievers, the scorer's decisions (BS6)
                                      // 7: round 79, baseball: a pinch hitter can't pinch-hit twice
                                      // 8: round 80, football: a drive after a strategy call starts where it stood
                                      // 9: round 85, the computer's clubs trade with each other on deadline day (core 98_trades_cpu)
                                      // 10-12: rounds 87-89, the attributes play (baseball, basketball, hockey and soccer)
                                      // 13: round 90, hockey's goals and assists credited with less lean and more rating (HK13)
                                      // 19: round 101, football: a touchdown's yards never longer than the field the drive had
                                      // 20: round 106, football: a stalled drive's fourth and N follows how far it got (10 - gain from a fresh first down at least; the goal line when goal to go)
                                      // 21: round 107, the box score's lines agree with its own scoring (football: a man's touchdown yards inside his yards)
function schedOrder(pool,left,rng){
  if(SCHED_V<2){ pool.sort((x,y)=>(left[y.home]+left[y.away])-(left[x.home]+left[x.away])+rng.gauss(0,0.8)); return pool }
  const key=pool.map((g,i)=>({g:g,i:i,k:left[g.home]+left[g.away]+rng.gauss(0,0.8)}));
  key.sort((a,b)=>(b.k-a.k)||(a.i-b.i));
  key.forEach((x,i)=>pool[i]=x.g); return pool;
}
class RNG{
  // mulberry32 with its state on the object (this.a), so a save can keep it: the same numbers as the
  // closure, which hid it (a schedule lock needs it: rebuild)
  constructor(seed){ this.a=seed|0; this.sp=null;
    this.f=()=>{ let a=this.a|0; a=a+0x6D2B79F5|0; this.a=a; let t=Math.imul(a^a>>>15,1|a);
      t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296 } }
  r(){return this.f()}
  int(n){return Math.floor(this.f()*n)}
  range(a,b){return a+this.f()*(b-a)}
  pick(a){return a[this.int(a.length)]}
  gauss(m,s){
    if(this.sp!==null){const v=this.sp;this.sp=null;return m+s*v}
    let u=0,v=0;while(u===0)u=this.f();while(v===0)v=this.f();
    const R=Math.sqrt(-2*Math.log(u));this.sp=R*Math.sin(2*Math.PI*v);
    return m+s*R*Math.cos(2*Math.PI*v)}
  shuffle(a){for(let i=a.length-1;i>0;i--){const j=this.int(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
}

/* ============ home fields ============ */
/* Not every stadium is the same place. A handful are genuinely miserable to
   visit; most are ordinary; some are half empty in November. */

function homeField(u,t){
  if(LEAGUE.homeField)return LEAGUE.homeField(u,t);
  const prog=(u&&u.program&&u.program[t])!==undefined?u.program[t]:1500;
  const base=39+Math.max(0,Math.min(1,(prog-1150)/900))*30;
  return Math.round(base+(LEAGUE.venues[t]||8));
}

/* a venue against the rest of its league: the pros' home edges differ by a
   few Elo, college's by tens, so where it ranks is what reads true */
function venueLabel(v,all){
  if(all&&all.length>4){ const lo=Math.min(...all), hi=Math.max(...all);
    if(hi-lo<1)return "a normal road game";
    const above=all.filter(x=>x>v).length/all.length;
    if(above<0.1)return "one of the toughest places to play in the "+(LEAGUE.classes&&LEAGUE.classes.length?"country":"league");
    if(above<0.3)return "a tough place to play";
    if(above<0.8)return "a normal road game";
    return "an easier trip than most" }
  if(v>=88)return "one of the hardest places to play in the country";
  if(v>=76)return "a genuinely hostile road trip";
  if(v>=64)return "a real home-field edge";
  if(v>=52)return "a normal road game";
  return "not a difficult place to visit";
}

/* ============ team identity ============ */
function _hx(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
function _lum(c){const [r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
  return .2126*r+.7152*g+.0722*b}
function _mix(c,t,p){return c.map((v,i)=>Math.round(v+(t[i]-v)*p))}
const _READ={};
function teamColor(t){                    // raw brand color
  return LEAGUE.colors[t]||"#F4A63A";
}
function teamInk(t){                      // brand color, lightened until legible on dark
  if(_READ[t])return _READ[t];
  let c=_hx(LEAGUE.colors[t]||"#F4A63A"), p=0;
  while(_lum(c)<0.30&&p<0.85){p+=0.08;c=_mix(_hx(LEAGUE.colors[t]||"#F4A63A"),[255,255,255],p)}
  const out="#"+c.map(v=>v.toString(16).padStart(2,"0")).join("");
  _READ[t]=out; return out;
}

/* ============ constants ============ */
const K=32;                  // Elo update factor

function divisionOf(u,t){
  const c=(u&&u.conf&&u.conf[t])||CONF[t];
  const D=LEAGUE.conf.divisions[c]; if(!D)return null;
  for(const k in D)if(D[k].indexOf(t)>=0)return k;
  // a newcomer joins whichever side is thinner
  const sizes=Object.keys(D).map(k=>[k,D[k].length]).sort((a,b)=>a[1]-b[1]);
  D[sizes[0][0]].push(t);
  return sizes[0][0];
}
function hasDivisions(c){return !!LEAGUE.conf.divisions[c]}
function divisionNames(c){return LEAGUE.conf.divisions[c]?Object.keys(LEAGUE.conf.divisions[c]).sort():[]}
const NAMES=LEAGUE.teams.map(t=>t[0]);
let CONF=Object.fromEntries(LEAGUE.teams.map(t=>[t[0],t[2]]));
function syncConf(u){
  if(u&&u.conf)NAMES.forEach(t=>{if(u.conf[t])CONF[t]=u.conf[t]});
  else if(u){u.conf={};NAMES.forEach(t=>u.conf[t]=CONF[t])}
}

/* ============ Elo ============ */
/* Games are played by the sport layer's drive engine (playGame). */
function eloUpdate(eW,eL,mAbs,winHome,neutral){
  const hfa=neutral?0:LEAGUE.tuning.hfa;
  const diff=winHome?(eW+hfa-eL):(eW-eL-hfa);
  const exp=1/(1+Math.pow(10,-diff/400));
  const mov=Math.log(mAbs+1)*(2.2/(0.001*diff+2.2));
  return K*mov*(1-exp);
}

/* ============ talent ============ */
const REST_HZ=0.5, INJ_HAZARD=0.085,QB_SHARE=0.18,DEV_SD=4.2,AR_SD=5,AR_DECAY=0.8,
      COLLAPSE_P=0.018,BREAKOUT_P=0.018;
const BODY=["OL","WR1","RB1","EDGE","CB1","LB","TE","S"];
function iscale(r){return 0.70+0.45*Math.max(0,Math.min(1,(r-1150)/900))}
/* The per-step rates below (drift, injuries, sudden swings) were set for a
   season of a dozen or so steps. A league with many more (the NBA plays 90
   game dates) sets tuning.talentSteps: rates are scaled so a whole season
   varies as much as one of that many steps, and injuries last as many games.
   Unset, nothing changes. */
/* engine 25 (review round): a league's injuries (tuning.inj25 {hz, mul, cap}): how often a starter goes down (a share of
   the old rate), what it costs (his drop to the backup, times a draw from mul; it was 1.05-2.1 everywhere) and the most
   one injury can cost in rating points. College basketball's thin benches let one injury cost up to ~460 points (a
   starter in the 80s over a backup in the 30s): a tester saw one injury move a game's chance from 49% to 82%. Unset,
   the old rates. Same draws either way. */
function injTune25(){ const T=typeof ENGINE_V!=="undefined"&&ENGINE_V>=25&&LEAGUE.tuning&&LEAGUE.tuning.inj25;
  return {hz:T&&T.hz||1, mul:T&&T.mul||[1.05,2.1], cap:T&&T.cap||1e9} }
function talentScale(){const T=LEAGUE.tuning&&LEAGUE.tuning.talentSteps; return T?T/LEAGUE.weeks:1}
/* engine 25: how much a rating gap counts in a league's games (tuning.gap25; unset, 1): the spread of a league's results
   without re-rating every club (and with the same ratings, the shown chances' curve: wpK25) */
function gapScale25(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=25&&LEAGUE.tuning&&LEAGUE.tuning.gap25?LEAGUE.tuning.gap25:1 }

/* ============ engine 26: long careers (review round 2, test/longrun.js) ============ */
/* A league in its twentieth season should look like the real league, as it does in its first. Measured on engine 25:
   ratings passed the 0-99 scale (104 in hockey, 100 in baseball), the NBA's best player rose 75 to 89, hockey's goals a
   game 6.2 to 8.4, baseball hit .400 in a third of late seasons. Causes: a breakout raised a man's potential with no
   ceiling, so leaps compounded; development spread gains by age so the league's shape leaned (hockey: toward Skating);
   every offseason ran on one random tape (core 99_app commitOffseason). Players peaked at 25. The fix, for summers
   that close a season played on engine 26 (a season begun on 25 keeps its own summer):
   - a ceiling for each man, drawn once from his name (no dice): his scouted potential plus what it hides; a
     breakout reveals it and can't pass it, and nothing passes 99 (ceil26, develop26)
   - an aging curve that rises to 25, holds 26-28, eases at 29 and falls faster from 31, by position in each league
     (quarterbacks, goalies, keepers and pitchers later: each league's AGE26) (ageBase26)
   - each summer the league's ratings are re-centred on its own opening mean and spread (REF26: the starters of ten
     fresh universes), with each man rounded by his own hash so a small shift moves the league, not nobody
     (recentre26); the attributes' average lean likewise (attrRecentre26, core 93_attrs)
   - the summer's dice are the career's own (core 99_app offseasonRng). */
function eng26(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=26 }
/* engine 27 (review round 3, league life): see core 93_lore */
function eng27(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=27 }
/* the mean summer change before the cap at potential, by effective age (age less the position's shift) */
function ageBase26(a){ return a<=21?2.8:a<=22?2.4:a<=23?1.9:a<=24?1.5:a<=25?1.2:a<=26?1.0:a<=27?0.9:a<=28?0.8:a<=29?0.5
  :a<=30?-0.2:a<=31?-1.0:a<=32?-2.0:a<=33?-3.0:a<=34?-4.0:-5.4 }
const CEIL26_SD=4;   // how much a scouted potential hides: |N(0,4)|, mean +3.2, one man in fourteen 7 or more
function ceil26(u,p){
  if(p.cl==null){ const R=new RNG((strHash("ceil|"+((u&&u.seed)||0)+"|"+p.n+"|"+String(p.p).replace(/\d+$/,""))>>>0)||1);
    const b=p.pot||p.r;   // less hidden near the top: a scouted 90 hides little (the top 1% held its level)
    p.cl=Math.min(99,Math.max(b,Math.round(b+Math.abs(R.gauss(0,CEIL26_SD*Math.max(0.2,Math.min(1,(99-b)/25))))))) }
  return Math.min(99,p.cl) }
/* one man's summer (the pro leagues): mu his mean change, a his effective age. o.leap the breakout odds (young men),
   o.floor the lowest rating, o.step the most one summer can add (soccer) */
function develop26(u,p,a,mu,rng,o){
  let g=rng.gauss(mu,2.0);
  if(o.leap&&a<=25&&rng.r()<o.leap){
    const L=rng.range(4,9), cl=ceil26(u,p), room=cl-Math.round(p.r+g);
    if(room>=2){ const leap=Math.min(L,room); p.pot=Math.max(p.pot,Math.min(cl,Math.round(p.r+g+leap+2))); g+=leap; p.leap=u.year } }
  // where a gain stops: a young man (to 25) at his ceiling, not at the scouts' potential; a man in his prime at the
  // potential or a point past his best so far, so a bad summer can be won back (capped at the potential alone, a
  // 28-year-old at it could only lose, and the league peaked at 25; capped at the ceiling, prime men drifted upward
  // and the best player climbed 82 to 89 in twenty NFL seasons)
  const top=a<=25?Math.max(p.pot,ceil26(u,p)):Math.max(p.pot,Math.min(ceil26(u,p),(p.peak||p.r)+1));
  const step=o.step?Math.min(g,o.step):g;
  p.r=Math.round(Math.max(o.floor||35,Math.min(g>0?top:99,p.r+step)));
  if(a>=29)p.pot=Math.max(p.r,Math.min(p.pot,p.r+1));
  p.pot=Math.min(99,Math.max(p.pot,p.r)) }
/* the starters' mean and spread as a career opens (ten fresh universes each, Nov 2026). Soccer by division (the
   pyramid's levels are its own: held as one, the Premier League's spread was squeezed to 4 in twenty summers) */
const REF26={nfl:{m:66.7,s:5.85,t:81.6}, nba:{m:59.6,s:6.16,t:74.2}, nhl:{m:59.6,s:5.97,t:73.8}, mlb:{m:59.2,s:5.57,t:73.8},
  cfb:{m:61.1,s:10.86}, ncaab:{m:61.9,s:10.96},
  epl:{PL:{m:70.8,s:10.15,t:93.8},CH:{m:58.3,s:7.04,t:75.7},L1:{m:52.8,s:7.63,t:71.0},L2:{m:47.9,s:6.71,t:62.9},NL:{m:41.8,s:6.48,t:57.3},
    NN:{m:37.6,s:6.72,t:53.0},NS:{m:38.8,s:6.70,t:54.1}}};   // t: the top 1% of starters (at least three men), its mean (college: no ceilings, and its tails held without it: test/longrun.js)
/* each position's starters against the league's (soccer: against their division's), as a career opens (same universes) */
const REFPOS26={nfl:{QB:-1.7,RB:0.9,WR:0.3,S:0.3}, cfb:{QB:0.4,RB:0.4,DT:-0.3,CB:-0.4,S:-0.3}, nba:{SF:0.3}, ncaab:{SG:0.3,C:-0.3},
  nhl:{D:-0.3}, epl:{}, mlb:{SS:-0.4,LF:-0.4,DH:-0.3,SP:0.3,CL:0.6}};
function hash01(x){ return (strHash(x)%100003)/100003 }
function recentre26(u){
  const R=REF26[LEAGUE.id]; if(!R||!u||!u.roster)return null;
  const byDiv=R.m==null, groups={};
  NAMES.forEach(t=>{ const g=byDiv?(u.conf&&u.conf[t]):"all"; if(g&&(!byDiv||R[g]))(groups[g]=groups[g]||[]).push(t) });
  const lo=LEAGUE.id==="epl"?20:(LEAGUE.id==="cfb"||LEAGUE.id==="ncaab")?30:35, out={};
  Object.keys(groups).forEach(g=>{
    const ref=byDiv?R[g]:R, T=groups[g];
    const st=[]; T.forEach(t=>(u.roster[t]||[]).forEach((p,i)=>{ if(p&&p.r!=null&&i<POS.length)st.push(p.r) }));
    if(st.length<10)return;
    const m=st.reduce((s,x)=>s+x,0)/st.length, s=Math.sqrt(st.reduce((q,x)=>q+(x-m)*(x-m),0)/st.length); if(!(s>0))return;
    // the level is held both ways; the spread only from above: never wider than it opened (a narrower league is the
    // market's doing: weak clubs fill their gaps in free agency, and stretching it back would move every man each summer)
    const k=Math.min(1,ref.s/s), map=(v,h)=>Math.floor(ref.m+(v-m)*k+h);
    T.forEach(t=>(u.roster[t]||[]).forEach(p=>{ if(!p||p.r==null)return;
      const h=hash01("rc|"+p.n+"|"+u.year);
      p.r=Math.max(lo,Math.min(99,map(p.r,h)));
      if(p.pot!=null)p.pot=Math.min(99,Math.max(p.r,map(p.pot,h)));
      if(p.cl!=null)p.cl=Math.min(99,Math.max(p.pot!=null?p.pot:p.r,map(p.cl,h))) }));
    // the top 1% held too, from above (each man's hidden ceiling made a few more stars than the opening league had: the
    // NBA's top three 74 to 78 in ten summers): what lies past the top tenth is drawn in toward it
    if(ref.t){ const v=[]; T.forEach(t=>(u.roster[t]||[]).forEach((p,i)=>{ if(p&&p.r!=null&&i<POS.length)v.push(p.r) })); v.sort((a,b)=>b-a);
      const n=Math.max(3,Math.round(v.length*0.01)), top=v.slice(0,n).reduce((a,b)=>a+b,0)/n, q=v[Math.floor(v.length*0.10)];
      if(top>ref.t&&top>q+1){ const k2=Math.max(0,(ref.t-q)/(top-q)), tm=(x,h)=>x>q?Math.floor(q+(x-q)*k2+h):x;
        T.forEach(t=>(u.roster[t]||[]).forEach(p=>{ if(!p||p.r==null)return; const h=hash01("rt|"+p.n+"|"+u.year);
          p.r=tm(p.r,h); if(p.pot!=null)p.pot=Math.min(99,Math.max(p.r,tm(p.pot,h))); if(p.cl!=null)p.cl=Math.min(99,Math.max(p.pot!=null?p.pot:p.r,tm(p.cl,h))) })) } }
    out[g]={m:Math.round(m*100)/100,s:Math.round(s*100)/100} });
  // each position held at its opening place in the league (a later peak would otherwise lift a whole position: soccer's
  // keepers +2.3 against the field in six summers, its scoring 1.49 to 1.2 a side; pro football's quarterbacks likewise)
  const RP=REFPOS26[LEAGUE.id]||{}, res={}, gm={};
  Object.keys(groups).forEach(g=>{ const st=[]; groups[g].forEach(t=>(u.roster[t]||[]).forEach((p,i)=>{ if(p&&p.r!=null&&i<POS.length)st.push(p) }));
    if(!st.length)return; const m=st.reduce((a,p)=>a+p.r,0)/st.length;
    st.forEach(p=>{ const P=String(p.p).replace(/\d+$/,""), x=res[P]=res[P]||[0,0]; x[0]+=p.r-m; x[1]++ }) });
  const sh={}; Object.keys(res).forEach(P=>{ if(res[P][1]>=8)sh[P]=(RP[P]||0)-res[P][0]/res[P][1] }); out.pos=sh;
  NAMES.forEach(t=>(u.roster[t]||[]).forEach(p=>{ if(!p||p.r==null)return; const d=sh[String(p.p).replace(/\d+$/,"")]; if(!d)return;
    const h=hash01("rp|"+p.n+"|"+u.year), mv=v=>Math.floor(v+d+h);
    p.r=Math.max(lo,Math.min(99,mv(p.r)));
    if(p.pot!=null)p.pot=Math.min(99,Math.max(p.r,mv(p.pot)));
    if(p.cl!=null)p.cl=Math.min(99,Math.max(p.pot!=null?p.pot:p.r,mv(p.cl))) }));
  const first=byDiv?out[LEAGUE.conf.order[0]]:out.all; if(!first)return null;
  return Object.assign({m:first.m,s:first.s,pos:out.pos},byDiv?{div:out}:{}) }
/* college: the programs' spread held to the opening one (with no anchor, football's programs drifted apart every
   year: sd 204 to 283 Elo in twenty seasons, its weakest rosters with them); the level both ways, the spread from above */
function programRecentre26(u){
  if(!u||!u.program||!LEAGUE.teams)return;
  if(!programRecentre26.ref){ const E=LEAGUE.teams.map(t=>t[1]), m=E.reduce((s,x)=>s+x,0)/E.length;
    programRecentre26.ref={m:m,s:Math.sqrt(E.reduce((q,x)=>q+(x-m)*(x-m),0)/E.length)} }
  const ref=programRecentre26.ref, P=NAMES.map(t=>u.program[t]).filter(v=>v!=null); if(P.length<10)return;
  const m=P.reduce((s,x)=>s+x,0)/P.length, s=Math.sqrt(P.reduce((q,x)=>q+(x-m)*(x-m),0)/P.length); if(!(s>0))return;
  const k=Math.min(1,ref.s/s);
  NAMES.forEach(t=>{ if(u.program[t]!=null)u.program[t]=ref.m+(u.program[t]-m)*k }) }

class Talent{
  constructor(rng,base,roster){
    this.rng=rng;this.base=Object.assign({},base);
    this.roster=roster||null;
    this.slope={};this.ar={};this.inj={};this.log={};
    const K=talentScale();
    NAMES.forEach(t=>{this.slope[t]=rng.gauss(0,DEV_SD)*K;this.ar[t]=0;
      this.inj[t]=[];this.log[t]=[]});
  }
  eff(t,w){
    let s=0; this.inj[t].forEach(e=>{if(e.w>0)s+=e.m});
    return this.base[t]+this.slope[t]*w+this.ar[t]+s;
  }
  active(t){return this.inj[t].filter(e=>e.w>0)}
  advance(w){
    const r=this.rng, K=talentScale();
    NAMES.forEach(t=>{
      this.inj[t].forEach(e=>e.w--);
      this.inj[t].filter(e=>e.w<=0).forEach(e=>
        this.log[t].push({wk:w,kind:"back",what:e.k,mag:0}));
      this.inj[t]=this.inj[t].filter(e=>e.w>0);
      const sc=iscale(this.base[t]);
      // starters rested in a decided game: the minutes they sat can't hurt them (REST_HZ; the same dice, so a rest
      // only ever removes an injury, never adds one elsewhere)
      const rest=(typeof SEA!=="undefined"&&SEA&&SEA.talent===this&&SEA.restAt&&SEA.restAt[t]===w-1)?REST_HZ:1;
      const IJ=injTune25();
      if(r.r()<INJ_HAZARD*K*rest*IJ.hz*(typeof deployHazard==="function"?deployHazard(t):1)*(typeof sportInjMul==="function"&&typeof SEA!=="undefined"&&SEA&&SEA.talent===this?sportInjMul(t,w):1)){   // soccer (engine 26): a club whose starters were short of condition   // hockey: riding your top players gets more of them hurt
        if(this.roster){
          // pick a starter, weighted toward the positions that take hits
          const idx=pickInjuredPos(r);
          const pl=this.roster[t][idx];
          if(!this.inj[t].some(e=>e.idx===idx)){
            const sev=r.r();
            const wk=Math.max(1,Math.round((sev<0.12?14:r.pick([1,2,2,3,4,5,6]))/K));
            const m=Math.max(-IJ.cap,injuryCost(this.roster[t],idx)*r.range(IJ.mul[0],IJ.mul[1]));
            this.inj[t].push({m:m,w:wk,k:pl.p,idx:idx,who:pl.n,rating:pl.r});
            this.log[t].push({wk:w,kind:"injury",what:pl.p,who:pl.n,
                              mag:Math.round(m),weeks:wk});
          }
        }else{
          let m,wk,k;
          if(r.r()<QB_SHARE){m=-r.range(85,190)*sc;wk=r.pick([2,3,4,5,6,14]);k="QB1"}
          else{m=-r.range(20,75)*sc;wk=r.pick([1,2,2,3,4,6]);k=r.pick(BODY)}
          this.inj[t].push({m:m,w:wk,k:k});
          this.log[t].push({wk:w,kind:"injury",what:k,mag:Math.round(m),weeks:wk});
        }
      }
      if(r.r()<COLLAPSE_P*K){const d=-r.range(40,110)*sc;this.base[t]+=d;
        this.log[t].push({wk:w,kind:"collapse",what:"locker room",mag:Math.round(d)})}
      else if(r.r()<BREAKOUT_P*K){const d=r.range(35,95)*sc;this.base[t]+=d;
        this.log[t].push({wk:w,kind:"breakout",what:"scheme unlock",mag:Math.round(d)})}
      this.ar[t]=this.ar[t]*AR_DECAY+r.gauss(0,AR_SD);
    });
  }
}


/* ============ coaches ============ */
const FIRST=["Mike","Dave","Chris","Brian","Kevin","Jim","Tom","Matt","Scott","Ryan",
"Marcus","Jalen","Andre","Terrance","Luis","Miguel","Sean","Pat","Dan","Greg","Curt",
"Lance","Wes","Hakeem","Devon","Rashad","Trent","Cole","Brady","Nate","Emmanuel","Kirk",
"Josh","Barry","Hugh","Lincoln","Deion","Willie","Herman","Vance","Bronco","Kalani"];
const LAST=["Whitaker","Bowden","Delgado","Okafor","Hargrove","Castellano","Boone","Mueller",
"Sandoval","Petrino","Kiffin","Vasquez","Ferrell","Njoku","Sutherland","Barclay","Rossi",
"Hollins","Amaya","Kowalski","Reeves","Chatman","Okoye","Vandiver","Prescott","Blackmon",
"Mahoney","Salazar","Tuiasosopo","Ferentz","Lindgren","Abara","Doucet","Yarborough",
"Ellsworth","Cormier","Nkemdiche","Stallings","Renfro","Pelini","Cristobal","Satterfield"];

let COACH_ID=1;
function newCoach(rng,prestige){
  // better programs attract better coaches
  const tier=Math.max(0,Math.min(1,(prestige-1150)/900));
  const q=rng.gauss(-24+tier*52, 26);
  return {id:COACH_ID++, n:rng.pick(FIRST)+" "+rng.pick(LAST),
          q:Math.round(Math.max(-58,Math.min(68,q))), t:0, hired:true,
          w:0,l:0,titles:0,confs:0,fired:0,stops:[]};
}

/* Roll a season's results into every coach's career. */
function recordCoaches(u,rec,champion,confChamps,year,drw){
  u.coachLog=u.coachLog||{};
  NAMES.forEach(t=>{
    const c=u.coach[t]; if(!c)return;
    if(c.w===undefined){c.w=0;c.l=0;c.titles=0;c.confs=0;c.fired=0;c.stops=[]}
    if(!c.stops.length||c.stops[c.stops.length-1].team!==t)
      c.stops.push({team:t,from:year,to:year,w:0,l:0,titles:0});
    const st=c.stops[c.stops.length-1];
    c.w+=rec[t][0]; c.l+=rec[t][1];
    st.w+=rec[t][0]; st.l+=rec[t][1]; st.to=year;
    if(drw){ c.d=(c.d||0)+(drw[t]||0); st.d=(st.d||0)+(drw[t]||0) }   // soccer's draws
    if(champion===t){c.titles++; st.titles++}
    if(confChamps&&Object.values(confChamps).indexOf(t)>=0)c.confs++;
  });
}

/* Snapshot of everyone currently employed, for browsing. */
function coachTable(u){
  const out=[];
  NAMES.forEach(t=>{
    const c=u.coach[t]; if(!c)return;
    out.push({team:t,n:c.n,q:c.q,t:c.t,you:!!c.you,
      w:c.w||0,l:c.l||0,d:c.d||0,titles:c.titles||0,confs:c.confs||0,   // soccer: draws too (the table read 54-0-48, Muse)
      stops:(c.stops||[]).slice()});
  });
  return out;
}

function coachGrade(q){
  if(q>=38)return "elite";
  if(q>=18)return "strong";
  if(q>=-5)return "solid";
  if(q>=-25)return "shaky";
  return "overmatched";
}

/* ============ decisions ============ */
const ARCHETYPES=[
 {k:"proven", l:"Proven winner",  bump:16, sd:16,
  d:"Has won at this level before. Expensive, and the expectations arrive with him."},
 {k:"riser",  l:SPORT.riser.l, bump:2, sd:36, d:SPORT.riser.d},
 {k:"builder",l:"Program builder", bump:-4, sd:19, rec:9,
  d:"Wins on the recruiting trail before he wins on Saturdays. Slow burn, high floor."},
 {k:"retread",l:"Veteran retread", bump:-7, sd:11,
  d:"Been fired twice. Knows exactly what he is, and so does everyone else."}
];

function coachCandidates(rng,prestige){
  const tier=Math.max(0,Math.min(1,(prestige-1150)/900));
  const pool=rng.shuffle(ARCHETYPES.slice()).slice(0,3);
  return pool.map(A=>{
    const q=Math.round(Math.max(-58,Math.min(68,
      rng.gauss(-24+tier*52+A.bump, A.sd))));
    // scouting is imperfect: you see a noisy read, not the number
    const seen=q+rng.gauss(0,13);
    return {n:rng.pick(FIRST)+" "+rng.pick(LAST), q:q, arch:A.k, al:A.l, d:A.d,
            rec:A.rec||0, grade:coachGrade(seen)};
  });
}

const PHILOSOPHY={
  win_now: {l:"Win now",  d:"Veterans get every rep. Better this year, thinner next.",
            elo:44, dev:-3.0},
  balanced:{l:"Balanced", d:"Play the best guy at every spot.", elo:0, dev:0},
  build:   {l:"Build",    d:"Young players play through mistakes. Costs you this year.",
            elo:-38, dev:3.2}
};

/* ============ your coaching career ============ */
/* You are the head coach, not the athletic director. You get hired, you get
   fired, and your record follows you to the next job. */
function repGrade(r){
  if(r>=46)return "a national name";
  if(r>=26)return "a hot commodity";
  if(r>=8)return "well regarded";
  if(r>=-10)return "unproven";
  if(r>=-28)return "a hard sell";
  return "radioactive";
}

/* Which jobs would take you, given what you've done. */
function jobMarket(u,rng,rep,openings,current){
  const ceiling=1300+Math.max(0,rep+40)*10;      // reputation opens bigger doors
  const floor=Math.max(1120,ceiling-620);
  const opts=openings.filter(t=>t!==current)
    .filter(t=>u.program[t]<=ceiling&&u.program[t]>=floor)
    .sort((a,b)=>u.program[b]-u.program[a]);
  const picked=[];
  if(opts.length)picked.push(opts[0]);
  if(opts.length>2)picked.push(opts[Math.floor(opts.length/2)]);
  if(opts.length>1)picked.push(opts[opts.length-1]);
  // nobody in range: the weakest opening will still talk to you (a firing is never a forced retirement)
  if(!picked.length){ const last=openings.filter(t=>t!==current).sort((a,b)=>u.program[a]-u.program[b])[0]; if(last)picked.push(last) }
  return [...new Set(picked)].slice(0,3);
}

/* Bigger programs come calling when you overperform at a small one. */
function poachOffers(u,rng,rep,openings,current){
  if(rep<18)return [];
  const mine=u.program[current];
  return openings.filter(t=>t!==current&&u.program[t]>mine+150
    &&u.program[t]<=1240+Math.max(0,rep+30)*12)
    .sort((a,b)=>u.program[b]-u.program[a]).slice(0,2);
}

function repDelta(wins,losses,expWins,program,titles){
  const wp=wins/Math.max(1,wins+losses);
  let d=(wins-expWins)*1.7;
  if(titles.natl)d+=22;
  else if(titles.playoff)d+=8;
  else if(titles.conf)d+=6;
  if(wp<0.34&&wins<expWins)d-=6;   // only if you also missed the mark
  // winning at a small program counts for more
  d*= program<1500?1.25 : program>1850?0.82 : 1.0;
  return d;
}

/* ============ program continuity ============ */
const COACH_ONFIELD=0.55,  // how much coach quality shows up on the field
      COACH_BUILD=0.34,    // how much it compounds into the program each year
      ROOKIE_DIP=-22;
const ROSTER_NOISE=48;
const CARRY=0.45,CHURN_SD=95,RECRUIT=0.16,PROG_NOISE=22,
      // program strength's range: a league may set its own (basketball's is wider)
      P_FLOOR=(LEAGUE.tuning&&LEAGUE.tuning.pFloor)||1120,P_CEIL=(LEAGUE.tuning&&LEAGUE.tuning.pCeil)||2010,HOT_SEAT=0.42,COACH_SD=62,COACH_DIP=-18,PERCEPT_N=34;

/* round 109: a team's strength is made before its season's engine is set (a new career; the offseason, still on the
   finished season's), so a weight gated on the engine (soccer's keeper, posW) is read on the engine the season will play */
function atEngine(v,fn){ const e=ENGINE_V; ENGINE_V=v||e; try{ return fn() }finally{ ENGINE_V=e } }
function newUniverse(seed){
  const rng=new RNG(seed);
  const u={seed:seed,year:2026,program:{},perceived:{},trueBase:{},
           tenure:{},bad:{},history:[],rng:seed,engV:ENGINE_NOW};   // round 71: on the current engine
  u.coach={}; u.roster={}; u.oc={}; u.dc={}; u.conf={};
  u.nextRealign=2026+4+rng.int(4);
  LEAGUE.teams.forEach(t=>u.conf[t[0]]=t[2]);
  LEAGUE.teams.forEach(([n,e])=>{
    u.program[n]=e; u.perceived[n]=e;
    u.roster[n]=LEAGUE.offseason.newRoster(rng,e);
    u.oc[n]=newCoordinator(rng,e,"oc"); u.dc[n]=newCoordinator(rng,e,"dc");
    u.trueBase[n]=atEngine(u.engV,()=>rosterElo(u.roster[n]))+rng.gauss(0,26);   // round 109: on the engine its first season plays (soccer's keeper weight)
    u.tenure[n]=1+rng.int(6); u.bad[n]=0;
    const c=newCoach(rng,e); c.t=u.tenure[n]; c.hired=false;
    u.coach[n]=c;
  });
  u._rngState=seed*7919+13;
  if(LEAGUE.onNewUniverse)LEAGUE.onNewUniverse(u);   // a league's own setup of a new career, no dice (pro football's front office)
  NAMES.forEach(t=>distinctStaff(u,t));
  if(LEAGUE.offseason&&LEAGUE.offseason.init)LEAGUE.offseason.init(u);   // a league's own new-universe settings (pro basketball's front office); none elsewhere
  return u;
}

function seatHeat(u,rec,elo,t){
  // expectation is the program's own baseline; heat is falling short of it repeatedly
  const w=rec[t][0], l=rec[t][1], wp=w/Math.max(1,w+l);
  const shortfall=(u.program[t]-elo[t])/((typeof LEAGUE!=="undefined"&&LEAGUE.seatSpread)||45);   // hockey's strengths sit closer together: the same shortfall is a bigger miss
  let heat=u.bad[t]*1.4 + Math.max(0,shortfall) + (wp<HOT_SEAT?1.2:0);
  if(u.coach[t]&&u.coach[t].t<=1)heat-=1.6;         // rookies get a grace year
  if(u.coach[t]&&u.coach[t].q>=30)heat-=0.6;
  return heat;
}

/* Offseason runs in two acts so the player can decide in between.
   Act 1: the coaching carousel. Act 2: rosters, recruiting, development. */
/* The coaching carousel, once per offseason for the whole league.
   users: {team: fired} for every team a person coaches, fired meaning they
   have missed expectations two years running (decided from their grades,
   see openOffseason). A person's job is theirs to lose that way, never the
   carousel's. Each person's part comes back in the ...By maps; the plain
   userOpen/staffOpen/candidates are the first user's, for one-coach games. */
/* no two people on one staff share a first name (a head coach Curt with an
   assistant Curt reads like a bug): a repeat is swapped for another name,
   picked by hash so the game's random draws don't move */
function distinctStaff(u,t){
  const c=u.coach&&u.coach[t], first=x=>x&&x.n?x.n.split(" ")[0]:null;
  const taken=new Set(); if(c&&first(c))taken.add(first(c));
  ["oc","dc"].forEach(sd=>{ const x=u[sd]&&u[sd][t]; if(!x||!x.n)return;
    let f=first(x);
    if(taken.has(f)){ let h=strHash(x.n+"|"+t+"|"+sd);
      for(let k=0;k<FIRST.length&&taken.has(f);k++)f=FIRST[(h+k)%FIRST.length];
      x.n=f+x.n.slice(x.n.indexOf(" ")) }
    taken.add(f) });
}
/* no two players on one roster share a name (two Cooper Nwosus read as one
   player, a senior two years running): a repeat gets another first name, by
   hash so no random draw moves */
function distinctRoster(u,t,seen){
  const R=u.roster&&u.roster[t]; if(!R)return;
  seen=seen||new Set();
  R.forEach((p,i)=>{ if(!p||!p.n)return;
    if(seen.has(p.n)){ const sp=p.n.indexOf(" "), last=sp>0?p.n.slice(sp):""; let h=strHash(p.n+"|"+t+"|"+i), n=p.n;
      const F=typeof PNAMES_F!=="undefined"?PNAMES_F:FIRST;
      for(let k=0;k<F.length&&seen.has(n);k++)n=F[(h+k)%F.length]+last;
      p.n=n }
    seen.add(p.n) });
}
/* across the league: no two players anywhere share a name (in team order, so
   the same save always settles the same way) */
/* the player you featured last season: a pro develops this much faster (college: 3.8, in developRoster) */
const FEAT_DEV_PRO=2.5;
function featDev(ch,i){ return ch&&ch.featured!==null&&ch.featured!==undefined&&ch.featured===i?FEAT_DEV_PRO:0 }
/* a surname for commentary: with a first initial when someone else in this game
   shares it (Instinct: "my goalie saving my own player's shot") */
function surnameIn(n,g){
  if(!n)return ""; const last=n.split(" ").slice(-1)[0], R=typeof SEA!=="undefined"&&SEA&&SEA.roster;
  if(!R||!g)return last;
  let c=0; [g.home,g.away].forEach(t=>(R[t]||[]).forEach(p=>{ if(p&&p.n&&p.n.split(" ").slice(-1)[0]===last)c++ }));
  const dup=c>1;
  return dup?n[0]+". "+last:last;
}
function distinctLeague(u){
  if(!u.roster)return;
  // college: thousands of players for about 3,000 possible names, so names stay
  // distinct within a roster only (a league-wide rule would run out of names)
  if(LEAGUE.classes&&LEAGUE.classes.length){ NAMES.forEach(t=>distinctRoster(u,t)); return }
  const all=[], count=new Map();
  NAMES.forEach(t=>(u.roster[t]||[]).forEach((p,i)=>{ if(!p||!p.n)return; all.push({p,t,i}); count.set(p.n,(count.get(p.n)||0)+1) }));
  const taken=new Set(count.keys()), F=typeof PNAMES_F!=="undefined"?PNAMES_F:FIRST;
  // a name held twice: one keeps it (see the sort);
  // the other gets a first name nobody in the league has with his surname
  const byName=new Map(); all.forEach(x=>{ if(count.get(x.p.n)>1){ if(!byName.has(x.p.n))byName.set(x.p.n,[]); byName.get(x.p.n).push(x) } });
  byName.forEach(list=>{
    // a player on a team someone coaches keeps his name (the recaps name him), then the longest-serving
    const mine=new Set(typeof S!=="undefined"&&S?[S.myTeam].concat((S.coaches||[]).map(c=>c.myTeam)):[]);
    // (round 74, engine 4: a man who has played a season keeps it over one who joined the league this summer: a keeper you
    // sold was renamed at his new club because a squad-filler at yours was drawn with his name)
    const vet=x=>ENGINE_V>=4&&x.p.peak!==undefined?1:0;
    list.sort((a,b)=>(vet(b)-vet(a))||((mine.has(b.t)?1:0)-(mine.has(a.t)?1:0))||((b.p.yrsHere||0)-(a.p.yrsHere||0))||((b.p.age||0)-(a.p.age||0)));
    list.slice(1).forEach(x=>{ const p=x.p, sp=p.n.indexOf(" "), last=sp>0?p.n.slice(sp):"", h=strHash(p.n+"|"+x.t+"|"+x.i);
      for(let k=0;k<F.length;k++){ const n=F[(h+k)%F.length]+last; if(!taken.has(n)){ p.n=n; taken.add(n); break } } });
  });
}
function offseasonCoaching(u,rng,rec,elo,users){
  users=users||{};
  const isUser=t=>Object.prototype.hasOwnProperty.call(users,t);
  const userTeam=Object.keys(users)[0];
  const fired=[],hires=[],poached=[];
  if(!u.coach){u.coach={};NAMES.forEach(t=>{u.coach[t]=newCoach(rng,u.program[t]);u.coach[t].hired=false})}
  const mid27={}; if(eng27()&&typeof loreMid==="function")loreMid().forEach(m=>{ if(!isUser(m.t))mid27[m.t]=m });

  NAMES.forEach(t=>{
    const wp=rec[t][0]/Math.max(1,rec[t][0]+rec[t][1]);
    u.bad[t]= wp<HOT_SEAT ? u.bad[t]+1 : 0;
    if(u.coach[t]&&u.coach[t].you){
      if(isUser(t)&&users[t]){fired.push(t);u.bad[t]=0}
      return;
    }
    const heat=seatHeat(u,rec,elo,t);
    const change=(heat>=4.6)||(wp<0.25&&u.coach[t].t>=2);
    // engine 27 (league life): the real leagues' rate of change (LEAGUE.lore.coach, sources in leagues/<id>/89_lore.js
    // and CHANGELOG-review/league-life.md). A club that fired its coach in season (core 93_lore loreMid) changes now;
    // the rest by the old rule (keep: how often a hot seat ends in a firing) and a smaller chance below it (x, from
    // heat h; the top flight only where LEAGUE.lore.top says), by hash so no other dice move
    const LC=eng27()&&LEAGUE.lore&&LEAGUE.lore.coach;
    if(LC){ if(mid27[t]||(change&&hash01("fire|"+(u.seed||0)+"|"+t+"|"+u.year)<LC.keep)||(!change&&LC.x>0&&heat>LC.h&&u.coach[t].t>=1&&loreTop(t)
        &&hash01("fire2|"+(u.seed||0)+"|"+t+"|"+u.year)<LC.x*Math.min(1,(heat-LC.h)/2))){fired.push(t);u.bad[t]=0}
      return }
    if(change&&rng.r()<0.82){fired.push(t);u.bad[t]=0}
  });

  // engine 26, college: a long-serving coach retires (no coach ever did: a 68-rated coach at the top program kept it for
  // twenty seasons, and UCLA won 6 of 20 titles in one career). From his tenth season, 5% a year and 2.5 more each year
  // after (about sixteen seasons for one who is never fired); drawn from a hash, so no other dice move
  const retired=[];
  // engine 27: a pro coach retires or steps away too (from his sixth season, LEAGUE.lore.coach.ret a year)
  if(eng27()&&LEAGUE.lore&&LEAGUE.lore.coach&&LEAGUE.lore.coach.ret)NAMES.forEach(t=>{
    const c=u.coach[t]; if(!c||c.you||isUser(t)||fired.indexOf(t)>=0||!(c.t>=5))return;
    if(hash01("pret|"+(u.seed||0)+"|"+t+"|"+u.year)<LEAGUE.lore.coach.ret*(1+(c.t-5)*0.15)){
      retired.push({team:t,name:c.n,q:c.q,t:c.t});
      u.coach[t]=newCoach(rng,u.program[t]); u.coach[t].since=u.year+1;
      hires.push({team:t,name:u.coach[t].n,q:u.coach[t].q,reason:"replacing "+c.n+", who retired"}) } });
  if(eng26()&&(LEAGUE.id==="cfb"||LEAGUE.id==="ncaab"))NAMES.forEach(t=>{
    const c=u.coach[t]; if(!c||c.you||isUser(t)||fired.indexOf(t)>=0||!(c.t>=10))return;
    if(hash01("cret|"+(u.seed||0)+"|"+t+"|"+u.year)<Math.min(0.35,0.05+0.025*(c.t-10))){
      retired.push({team:t,name:c.n,q:c.q,t:c.t});
      u.coach[t]=newCoach(rng,u.program[t]); u.coach[t].since=u.year+1;
      hires.push({team:t,name:u.coach[t].n,q:u.coach[t].q,reason:"replacing "+c.n+", who retired"}) } });
  const openings=fired.slice().sort((a,b)=>u.program[b]-u.program[a]);
  openings.forEach(job=>{
    if(isUser(job))return;                        // a person's job: they're told, then it's filled
    if(rng.r()>0.42)return;
    const cands=NAMES.filter(t=>fired.indexOf(t)<0 && !u.coach[t].you && u.coach[t].q>=22
      && u.program[t] < u.program[job]-140 && u.coach[t].t>=2
      && rec[t][0]>=rec[t][1]);
    if(!cands.length)return;
    cands.sort((a,b)=>u.coach[b].q-u.coach[a].q);
    const from=cands[0], c=u.coach[from];
    poached.push({to:job,from:from,name:c.n,q:c.q});
    u.coach[job]=Object.assign({},c,{t:0,hired:true,since:u.year+1});   // his record travels with him
    u.coach[from]=newCoach(rng,u.program[from]); u.coach[from].since=u.year+1;
    hires.push({team:from,name:u.coach[from].n,q:u.coach[from].q,reason:"replacing "+c.n});
    fired.splice(fired.indexOf(job),1);
    if(fired.indexOf(from)<0)fired.push(from);
  });

  // a hot coordinator can be the man a program hires
  const coordMoves=[];
  fired.slice().forEach(job=>{
    if(isUser(job))return;
    if(rng.r()>0.30)return;
    const pool=NAMES.filter(t=>fired.indexOf(t)<0 && u.oc[t] && u.oc[t].q>=26
      && u.program[t] < u.program[job]+90);
    if(!pool.length)return;
    const from=rng.pick(pool);
    const side=(u.dc[from]&&u.dc[from].q>u.oc[from].q)?"dc":"oc";
    const co=side==="oc"?u.oc[from]:u.dc[from];
    if(!co||co.q<26)return;
    coordMoves.push({name:co.n,from:from,to:job,side:side});
    u.coach[job]={id:COACH_ID++,n:co.n,q:Math.round(co.q*0.85),t:0,hired:true,since:u.year+1,
                  w:0,l:0,titles:0,confs:0,fired:0,stops:[]};
    const fresh=newCoordinator(rng,u.program[from],side);
    if(side==="oc")u.oc[from]=fresh; else u.dc[from]=fresh;
    fired.splice(fired.indexOf(job),1);
  });

  const userOpenBy={}, candidatesBy={}, staffOpenBy={};
  Object.keys(users).forEach(t=>{userOpenBy[t]=fired.indexOf(t)>=0; staffOpenBy[t]={oc:false,dc:false}});
  // your coordinator took a head job: you hire his replacement, as when one leaves any other way
  // (Grokbot: "takes the head job at Kansas City" and a stranger was simply in his chair)
  coordMoves.forEach(m=>{ if(isUser(m.from))staffOpenBy[m.from][m.side]=true });
  const openJobs=fired.slice();
  Object.keys(users).forEach(t=>{candidatesBy[t]=userOpenBy[t]?coachCandidates(rng,u.program[t]):null});

  fired.forEach(t=>{
    if(isUser(t))return;                          // a person's job, not an AI hire
    if(u.coach[t].hired&&u.coach[t].t===0)return;
    const old=u.coach[t].n;
    u.coach[t]=newCoach(rng,u.program[t]); u.coach[t].since=u.year+1;   // his first season (coachYear)
    // engine 27: about a third of interim coaches keep the job (by hash)
    const m=mid27[t]; if(m&&hash01("keep|"+t+"|"+u.year)<0.35){ u.coach[t].n=m.i;
      hires.push({team:t,name:m.i,q:u.coach[t].q,reason:"the interim coach, kept on after "+m.n+" was fired"}); return }
    hires.push({team:t,name:u.coach[t].n,q:u.coach[t].q,reason:"replacing "+(m?m.n:old)});
  });

  // ordinary staff churn everywhere else
  NAMES.forEach(t=>{
    ["oc","dc"].forEach(side=>{
      const st=side==="oc"?u.oc:u.dc;
      if(!st[t]){st[t]=newCoordinator(rng,u.program[t],side);return}
      st[t].t=(st[t].t||0)+1;
      const leaves = st[t].q>=34 ? rng.r()<0.20 : (st[t].q<=-26 ? rng.r()<0.30 : rng.r()<0.09);
      if(leaves){
        if(isUser(t)){staffOpenBy[t][side]=true;}
        else st[t]=newCoordinator(rng,u.program[t],side);
      }
    });
  });

  NAMES.forEach(t=>distinctStaff(u,t));
  return {fired:fired,hires:hires,poached:poached,retired:retired,openJobs:openJobs,coordMoves:coordMoves,
          userOpenBy:userOpenBy,staffOpenBy:staffOpenBy,candidatesBy:candidatesBy,
          userOpen:!!userOpenBy[userTeam],candidates:candidatesBy[userTeam]||null,
          staffOpen:staffOpenBy[userTeam]||{oc:false,dc:false}};
}

