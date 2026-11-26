/* ============ the specialists: pro football's kicker and punter ============ */
/* Every club carries a kicker and a punter beside its twenty (u.spec[team] = {K, P}), each with a name, an age and a
   rating. The kicker's rating moves the odds of every field goal he tries (src/football/50_drives: fgOdds, a shift in the
   kick's log-odds of (r - 70) / 15: an 85-rated kicker makes a 47-yarder about 90% of the time, a 55-rated one about 54%,
   the league's curve at 70); the punter's moves how far his punts go ((r - 70) * 0.3 yards on the 45-yard mean). Ratings
   centre on 70, so the league's scoring and kicking stay where the curve has them. Only the odds and the mean move,
   never a draw.
   They're a front-office career's alone: made when its contracts convert (foMigrate), so college football, and a pro
   career begun before this, play exactly as they did. Their pay is in the depth money (FO_DEPTH). They age and change
   each summer from a hash of the club and year, not the season's dice, so nothing else the summer draws moves. */
const FO_SPEC_MID=70, FO_SPEC_KQ=15, FO_SPEC_PQ=0.3;
function foSpecRng(t,role,year,n){ return new RNG(strHash(t+"|"+role+"|"+year+"|"+(n||0))) }
function foSpecMake(t,role,year,young){ const R=foSpecRng(t,role,year,young?1:0);
  const r=Math.round(Math.max(52,Math.min(90,R.gauss(young?66:FO_SPEC_MID,young?4:6)))), age=young?22+R.int(3):23+R.int(13);
  // the kicker the games already named stays the kicker (75_screens: kickerName, before a club had one)
  const n=role==="K"&&!young&&typeof kickerName==="function"?kickerName(t):playerName(R);
  return {n:n,r:r,age:age,p:role} }
function foSpecInit(u){ if(!u||u.spec)return; u.spec={};
  NAMES.forEach(t=>{ if(u.roster[t])u.spec[t]={K:foSpecMake(t,"K",u.year,false),P:foSpecMake(t,"P",u.year,false)} }) }
/* a summer: a year older, a little better young and worse old; past it, or not good enough, and a young one comes in */
function foSpecYear(u){ if(!u)return; if(!u.spec){ foSpecInit(u); return }
  NAMES.forEach(t=>{ const S=u.spec[t]; if(!S)return;
    ["K","P"].forEach(role=>{ const x=S[role], R=foSpecRng(t,role,u.year,2);
      const d=x.age<=26?1.5:x.age<=32?0:-1.5, r=Math.round(Math.max(45,Math.min(92,x.r+d+R.gauss(0,1.8))));
      x.age++; x.r=r;
      if(x.age>=39||(x.age>=27&&x.r<60)||(x.age>=35&&R.r()<0.25)){ const nw=foSpecMake(t,role,u.year+1,true); nw.was=x.n; S[role]=nw } }) }) }
/* what a game knows of them: [kick log-odds shift, punt yards] a side */
function fbKickCtx(h,a){ const sp=typeof U!=="undefined"&&U&&U.spec; if(!sp||!sp[h]||!sp[a])return undefined;
  const f=t=>[Math.round((sp[t].K.r-FO_SPEC_MID)/FO_SPEC_KQ*1000)/1000, Math.round((sp[t].P.r-FO_SPEC_MID)*FO_SPEC_PQ*100)/100];
  return {home:f(h),away:f(a)} }
function fbSpecName(t){ const sp=typeof U!=="undefined"&&U&&U.spec; return sp&&sp[t]?sp[t].K.n:null }
/* the line on the offseason screen */
function foSpecLine(t){ const S=U&&U.spec&&U.spec[t]; if(!S)return "";
  const one=(x,w)=>`${w} ${esc(x.n)} (rated ${x.r}, ${x.age}${x.was?`; replaces ${esc(x.was)}`:""})`;
  return `<div class="note">Specialists: ${one(S.K,"kicker")}; ${one(S.P,"punter")}. A better kicker makes more of the long ones; a better punter leaves them further to go.</div>` }

{ const mig0=foMigrate; foMigrate=function(u){ const was=u&&u.capV>=1; mig0(u); if(u&&!was&&u.capV>=1)foSpecInit(u) } }
{ const run1=LEAGUE.offseason.run; LEAGUE.offseason.run=function(u,rng,healthy,elo,rec,choices){ const out=run1.call(this,u,rng,healthy,elo,rec,choices);
    if(u&&u.foV>=1)foSpecYear(u); return out } }
