/* round 85 (engine 9): the computer's clubs trade with each other on deadline day. The clubs at the top buy now from
   the clubs at the bottom: one man for one at the same position, the buyer's younger or cheaper man for the seller's
   better one now, when both come out ahead by their own lights (the buyer leans to now, the seller to later). Each club
   makes one deal at most; at most one deal for every eight clubs. Your clubs (and every coach's in a shared seat) take no
   part. Nothing is drawn: the deals come from the rosters and the records on that day, so a reload makes them again.

   This is engine code: a season on engine 9 replays these deals on a reload, so the rules here are frozen (the CT_*
   values and the ct* readings below are their own, apart from the user's trades, which can be tuned without changing a
   computer deal). Changing them needs an engine bump. */
const CT_BUY=0.85, CT_SELL=0.25, CT_PREM=2, CT_PROP=1, CT_PER=8;
function ctFut(p){ const a=p.age||27, young=Math.max(0,27-a)/5;
  const f=Math.max(30,p.r+(p.pot!=null&&p.pot>p.r?(p.pot-p.r)*0.5*young:0)-Math.max(0,a-29)*1.5);
  return p.k&&p.k.yrs<=1?f*(a<=26?0.8:0.4):f }   // a young man re-signs more often than not (round 85)
function ctVal(R,fut){ let s=0; POS.forEach((P,i)=>{ const v=x=>x?(fut?ctFut(x):x.r):0, x=v(R[i]), y=v(R[BK(i)]); s+=P.w*(0.88*Math.max(x,y)+0.12*Math.min(x,y)) }); return ratingToElo(s) }
function ctAfter(R,i,p){ const X=R.slice(); X[i]=p; const s=i%POS.length, b=BK(s); if(X[s]&&X[b]&&X[b].r>X[s].r){ const t=X[s]; X[s]=X[b]; X[b]=t } return X }
function ctPay(R){ return R.reduce((s,p)=>s+(p&&p.k&&p.k.sal||0),0) }
const ctGrp=i=>POS[i%POS.length].p.replace(/\d+$/,"");
// deadline day: the last day trades are open (the league's deadline, or soccer's January window)
function ctDeadline(){ const T=LEAGUE.trade, D=LEAGUE.dates||[]; if(!T)return -1; let last=-1;
  const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], m0=M.indexOf(String(D[0]||"Jan 1").split(" ")[0]);
  const day=s=>{ const [m,d]=String(s||"").split(" "); return ((M.indexOf(m)-m0+12)%12)*31+(+d||0) };
  for(let k=0;k<D.length;k++){ const m=String(D[k]).split(" ")[0]; if(T.window?T.window.indexOf(m)>=0:day(D[k])<=day(T.by))last=k }
  return last }
function ctScore(sea,A,give,i,get,w){   // club A gives the man at slot i, gets "get": what it makes of that
  const R=sea.roster[A], R2=ctAfter(R,i,get), dNow=ctVal(R2,false)-ctVal(R,false);
  return {s:w*dNow+(1-w)*(ctVal(R2,true)-ctVal(R,true))-CT_PROP*Math.max(0,-dNow),R2:R2} }
function cpuDeadline(sea){
  if(LEAGUE.trade&&LEAGUE.trade.cpu&&LEAGUE.trade.cpu(sea))return;   // a league's own deadline (pro basketball's front office)
  if(!LEAGUE.trade||!sea.roster||sea._ctDone===sea.year)return;
  if(sea.step!==ctDeadline())return; sea._ctDone=sea.year;
  const humans=sea.humans||[], cap=LEAGUE.taxLine||LEAGUE.cap, rec=sea.rec||{};
  const pct=t=>{ const r=rec[t]||[0,0]; return ((r[0]||0)+5)/((r[0]||0)+(r[1]||0)+10) };
  const hurt=(t,i)=>sea.talent.active(t).some(e=>e.idx===i);
  const groups={}; NAMES.forEach(t=>{ const g=LEAGUE.trade.sameDiv?CONF[t]:"all"; (groups[g]=groups[g]||[]).push(t) });
  const out=[], used={}, most=Math.max(1,Math.round(NAMES.length/CT_PER));
  Object.keys(groups).sort().forEach(g=>{ if(LEAGUE.trade.cpuSkip&&LEAGUE.trade.cpuSkip(g))return;   // a division whose January the league runs itself (soccer's top two, engine 27)
    const clubs=groups[g].filter(t=>humans.indexOf(t)<0&&sea.roster[t]).sort((a,b)=>pct(b)-pct(a)||(a<b?-1:1)), n=clubs.length;
    const buyers=clubs.slice(0,Math.round(n*0.3)), sellers=clubs.slice(n-Math.round(n*0.35));
    buyers.forEach(B=>{ if(out.length>=most||used[B])return; let best=null;
      sellers.forEach(Sl=>{ if(used[Sl]||Sl===B)return; const RB=sea.roster[B], RS=sea.roster[Sl];
        RB.forEach((p,a)=>{ if(!p||hurt(B,a))return; RS.forEach((q,b)=>{ if(!q||ctGrp(a)!==ctGrp(b)||hurt(Sl,b))return;
          const xb=ctScore(sea,B,p,a,q,CT_BUY); if(xb.s<CT_PREM)return; const xs=ctScore(sea,Sl,q,b,p,CT_SELL); if(xs.s<CT_PREM)return;
          const cf=LEAGUE.trade.capFit?LEAGUE.trade.capFit(sea,{my:B,t:Sl,M:RB,M2:xb.R2,T:RS,T2:xs.R2}):null;   // a league's own cap (pro hockey: the seller keeps salary)
          if(cf?cf.over:cap&&((ctPay(xb.R2)>cap&&ctPay(xb.R2)>ctPay(RB))||(ctPay(xs.R2)>cap&&ctPay(xs.R2)>ctPay(RS))))return;
          const v=xb.s+xs.s; if(!best||v>best.v)best={v:v,B:B,Sl:Sl,a:a,b:b,gn:p.n,qn:q.n,ret:cf&&cf.ret||null} }) }) });
      if(best){ used[best.B]=used[best.Sl]=1; const x={my:best.B,t:best.Sl,a:best.a,b:best.b,gn:best.gn,qn:best.qn,y:sea.year,d:(LEAGUE.dates||[])[sea.step]||"",cpu:1,step:sea.step};
        if(best.ret)x.ret=best.ret;
        if(tdApply(sea,x))out.push(x) } }) });
  sea.cpuTr=(sea.cpuTr||[]).concat(out) }
// the deals of the day, for the news (a buyer's new man, his old club)
function cpuTradesHTML(){ const L=((SEA&&SEA.cpuTr)||[]).filter(x=>!LEAGUE.trade.sameDiv||CONF[x.my]===CONF[S.myTeam]); if(!L.length)return "";   // soccer: your division's
  return `<div class="grouphead">Around the league: deadline deals</div><div class="card" style="padding:6px 12px">`+L.map(x=>{ const g=SEA.roster[x.my].find(p=>p&&p.n===x.qn), q=SEA.roster[x.t].find(p=>p&&p.n===x.gn);
    return `<div style="margin:4px 0">${esc(x.my)} get ${g?plLink(x.my,g.n):esc(x.qn)}${g?` <span style="color:var(--muted)">${esc(POS[SEA.roster[x.my].indexOf(g)%POS.length].p)} ${g.r}</span>`:""} from ${esc(x.t)} for ${q?plLink(x.t,q.n):esc(x.gn)}${q?` <span style="color:var(--muted)">${q.r}, ${q.age||""}</span>`:""}</div>` }).join("")+`</div>` }
// on the home screen for a while after deadline day (three weeks of football, a week of the daily leagues)
function cpuNewsCard(){ if(LEAGUE.trade&&LEAGUE.trade.on&&LEAGUE.trade.on())return LEAGUE.trade.news?LEAGUE.trade.news():""; const L=(SEA&&SEA.cpuTr)||[]; if(!L.length||SEA.phase!=="week")return ""; const k=SEA.step-L[0].step; if(k<1||k>(LEAGUE.daily?7:3))return ""; return cpuTradesHTML() }
