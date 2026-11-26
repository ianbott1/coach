/* ============ pro baseball: the front office's season (engine 27) ============
   The injured list. When a starter goes down for ten days or more (MLB's 10-day IL), his place on the 26-man is free
   and his club calls up the best man at his position from Triple-A or Double-A (a 40-man man first). The better of the
   call-up and the bench player starts in his place; the other sits. When the starter is back, the call-up goes down.
   Every club does it the same way, the user's included. No dice: who goes up is read from the ratings (ties by name),
   so a season replays the same.
   The record of the season (sea.mlb) is folded into the universe as the summer opens (27_fo_run mlbFold):
     start  who was on each club's roster on opening day (a man traded in the season can't get the qualifying offer)
     up     each call-up's days in the majors (service time, and a man called up is added to the 40-man)
     down   each optioned man's days in the minors (an option year used at 20)
     log    the moves, for the roster tab's transactions
   A career without the front office (engine 26 and before, or a career that has not reached its first front-office
   summer) has no farm, and nothing here runs. */
const MLB_DAYS_SEASON=186;   // calendar days, March 26 to September 27 (LEAGUE.weeks)
function mlbSeaState(sea){
  if(sea.mlb)return sea.mlb;
  const M={start:{},up:{},down:{},log:[],now:{}};
  NAMES.forEach(t=>{ M.start[t]=((sea.roster&&sea.roster[t])||[]).filter(Boolean).map(p=>p.n); M.up[t]={}; M.down[t]={} });
  Object.defineProperty(sea,"mlb",{value:M,writable:true,enumerable:false,configurable:true});   // kept out of the season's own digest
  return M }
/* the best farm man to take the place at i (not one already up) */
function mlbIlPick(u,t,i,M){
  const F=(u.farm&&u.farm[t])||[], upN=new Set(Object.keys(M.now).filter(k=>k.indexOf(t+"|")===0).map(k=>M.now[k].up));
  const C=F.filter(p=>(p.lvl==="AAA"||p.lvl==="AA")&&mlbFits(p,i)&&!upN.has(p.n));
  C.sort((a,b)=>(b.on40?1:0)-(a.on40?1:0)||b.r-a.r||(a.n<b.n?-1:1));
  // a 40-man man unless a man off it is clearly better (he is added, and someone else may be outrighted in the winter)
  const on=C.find(p=>p.on40), off=C.find(p=>!p.on40);
  return on&&!(off&&off.r>=on.r+3)?on:(off||on||null) }
function mlbAfterWeek(sea,w){
  const u=typeof U!=="undefined"?U:null;
  if(!u||!u.mlbFO||!u.farm||!sea||!sea.roster||!sea.talent||sea.year!==u.year)return;
  const M=mlbSeaState(sea);
  NAMES.forEach(t=>{
    const R=sea.roster[t]; if(!R)return;
    const act=sea.talent.active(t), keys=new Set();
    // the men back from the IL: the call-up goes down, the bench player comes back
    act.forEach(e=>keys.add(t+"|"+e.idx));
    Object.keys(M.now).forEach(k=>{ if(k.indexOf(t+"|")!==0||keys.has(k))return; const x=M.now[k], b=BK(x.idx);
      if(!x.sits)R[b]=x.back||null; delete M.now[k];
      M.log.push({t:t,day:w+1,kind:"back",who:x.who,down:x.up,p:POS[x.idx].p}) });
    // the men going on it
    act.forEach(e=>{ const k=t+"|"+e.idx; if(M.now[k]||e.w<MLB$.ilMin)return;
      const i=e.idx, b=BK(i), bench=R[b]; if(!(i>=0&&i<POS.length)||!R[i])return;   // a starter (a bench man hurt: nobody comes up)
      const c=mlbIlPick(u,t,i,M); if(!c)return;
      if(bench&&c.r<=bench.r){   // the bench man is the better player: the call-up fills the place, and sits
        M.now[k]={idx:i,who:e.who,up:c.n,sits:1,from:c.lvl,day:w+1};
        M.log.push({t:t,day:w+1,kind:"il",who:e.who,days:e.w,up:c.n,from:c.lvl,starts:bench.n,p:POS[i].p}); return }
      const before=injuryCost(R,i), man=JSON.parse(JSON.stringify(c));
      man.p=bench?bench.p:POS[i].p; man.i=b; man.lvl=null; man.up=1;
      if(typeof attrOn==="function"&&attrOn()&&typeof attrGen==="function"&&(!Array.isArray(man.at)||man.ar!==man.r)){ man.at=attrGen(u,man); man.ar=man.r }
      R[b]=man; M.now[k]={idx:i,who:e.who,up:c.n,back:bench||null,from:c.lvl,day:w+1};
      const after=injuryCost(R,i); if(before<0&&after<0)e.m=e.m*after/before;   // the gap the injury leaves, with the call-up in it
      M.log.push({t:t,day:w+1,kind:"il",who:e.who,days:e.w,up:c.n,from:c.lvl,starts:c.n,p:POS[i].p}) });
    // the days: each call-up in the majors, each optioned man in the minors
    Object.keys(M.now).forEach(k=>{ if(k.indexOf(t+"|")!==0)return; const x=M.now[k];
      M.up[t][x.up]=(M.up[t][x.up]||0)+1 }) }) }
if(typeof LEAGUE!=="undefined"){ const _aw=LEAGUE.afterWeek; LEAGUE.afterWeek=function(sea,w){ if(_aw)_aw(sea,w); mlbAfterWeek(sea,w) } }
/* the season's days, on the 172-day service year: a man on the roster all season gets a full year, an optioned man
   loses his days down, a call-up gets his days up */
function mlbSvcDays(M,t,n,onRoster){
  const sc=MLB$.svcDay/MLB_DAYS_SEASON;
  if(onRoster){ const d=M&&M.down&&M.down[t]&&M.down[t][n]||0; return Math.max(0,Math.round(MLB$.svcDay-d*sc)) }
  const d=M&&M.up&&M.up[t]&&M.up[t][n]||0; return Math.round(d*sc) }
