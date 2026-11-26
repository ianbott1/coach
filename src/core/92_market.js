/* ============ the college roster economy (engine 26): revenue sharing, NIL and the transfer portal ============
   The real sport now runs on this loop (House v. NCAA, approved June 2025): a school may share about $20.5M a year
   with its athletes (2025-26), $21.3M in 2026-27 (a 4% rise), most of it to football; roster limits replace
   scholarship limits (football 105, men's basketball 15); and players move in one short winter window (football,
   2026-27: ten days from the first business day after Jan 1, so Jan 4-13, 2027; NCAA Division I Cabinet, Oct 2026).
   Every program gets a budget by conference and prestige, every player a market value, and every winter:

     1. Asks. Each returning player (not a senior: they graduate) wants paying what the market would pay him. His
        program pays it or doesn't (the computer's programs, and your staff unless you say otherwise, pay their most
        important players first, up to most of their two-deep money). Whether he enters the portal comes from why he'd
        go (buried behind a better starter, a new head coach, a star at a smaller program, a losing team, an unhappy
        or unloyal man: his traits and morale from the people layer, core 93_morale) and whether he was paid.
     2. The portal. Every program with a need (he'd start, or clearly beat its backup) and the money bids on each
        entrant, best first; you bid on the ones you choose, at the price you choose. He signs where the package is
        best for him: the money against his value, playing time, the program's level and its season, and a little
        that's his own (home, a coach he likes: a hash). Nobody gets a first look. Those nobody wants leave the
        division (to the FCS, or to his studies).
     3. Fills. A slot left empty goes to the next man up from the rest of the roster (the 85 the two-deep doesn't show).

   Determinism: nothing here draws from the season's dice. Every decision is a hash of the player, the program and
   the year, so the offseason screen's preview is the market that runs at the commit, and every other draw of the
   offseason is as it was. The league switches it on with LEAGUE.market; only seasons on engine MARKET_V or later use
   it (an older season's offseason runs as it was played). */
const MARKET_V=26;
function pxOn(){ return !!(typeof LEAGUE!=="undefined"&&LEAGUE.market)&&typeof ENGINE_V!=="undefined"&&ENGINE_V>=MARKET_V }
const MKT_DEF={
  cap:21.3,                    // the 2026-27 revenue-sharing cap, $M a school
  p4:["SEC","B1G","B12","ACC","IND"],
  twoDeep:0.45,                // share of a program's budget on the players the two-deep shows (the rest: the other 85)
  keepShare:0.65,              // how much of the two-deep money a staff spends keeping its own before the portal
  cpuShare:0.92,               // ... and how much it will have spent once the portal is done
  v0:1.2, r0:82, k:9.5, floor:0.02,   // market value: v0 $M at rating r0, x e every k points
  pos:{}, maxIn:6, rosterLimit:105, window:"Jan 4-13", base:0.20, depth:"two-deep", when:"winter",
  buried:0.50, coach:0.12, losing:0.15, unpaid:0.45, noise:0.6, reserve:0.5, p4Pull:0.35, posPush:{},
  // the pull up a level: a Group of Six player good enough to start at a Power Four program (upRef: a low Power Four
  // program's level), or a star at a Power Four program below the contenders (upTop), worth more to the ones above
  up:0.75, upAbove:6, upRef:1560, upTop:1850, upP4:0.5,
  p4Base:15, p4Top:23, p4lo:1550, p4span:450, g6Base:1.5, g6Top:4.5, g6lo:1250, g6span:400
};
function MK(){ return Object.assign({},MKT_DEF,(typeof LEAGUE!=="undefined"&&LEAGUE.market)||{}) }
const pxH=s=>new RNG(strHash(s)).r();
const pxKey=(t,p)=>t+"|"+p.n+"|"+p.p;
function pxMoney(x){ x=+x||0; return x>=0.995?"$"+(Math.round(x*10)/10).toFixed(1)+"M":"$"+Math.max(5,Math.round(x*1000/5)*5)+"K" }
function pxConf(u,t){ return (u&&u.conf&&u.conf[t])||(typeof CONF!=="undefined"&&CONF[t])||"" }
function pxBig(u,t){ return MK().p4.indexOf(pxConf(u,t))>=0 }
function pxTyp(u,t){ return eloToRating((u.program&&u.program[t])||1500) }

/* a program's budget, $M: the cap's share for this sport plus what its collective adds, by conference and prestige;
   donors follow winning. tot: the whole roster; two: the two-deep's part (what your decisions spend) */
function pxBudget(u,t,rec){
  const M=MK(), p=(u.program&&u.program[t])||1500, big=pxBig(u,t), cl=x=>Math.max(0,Math.min(1,x));
  let b=big?M.p4Base+M.p4Top*Math.pow(cl((p-M.p4lo)/M.p4span),1.4):M.g6Base+M.g6Top*cl((p-M.g6lo)/M.g6span);
  const w=rec&&rec[t]?rec[t][0]:null, n=rec&&rec[t]?rec[t][0]+rec[t][1]:0;
  if(w!=null&&n)b*=w/n>=0.8?1.12:w/n>=0.68?1.06:w/n<=0.3?0.95:1;
  const tot=Math.round(b*10)/10, two=Math.round(tot*M.twoDeep*10)/10;
  return {tot:tot,two:two,rest:Math.round((tot-two)*10)/10,big:big};
}
/* what the open market pays him a year, $M: rating, position, and a young man's room to grow */
function pxValue(pl){
  const M=MK(), mult=(M.pos&&M.pos[pl.p])||1, up=Math.max(0,(pl.pot||pl.r)-pl.r)*((pl.c||0)<=1?0.35:0.15);
  return Math.max(M.floor,Math.round(M.v0*Math.exp((pl.r+up-M.r0)/M.k)*mult*1000)/1000);
}

/* ---- the asks: why each returning player might go, and what keeping him costs ---- */
/* one player at slot k of program t's roster R: {ask, push (without money), why, money (the push if unpaid)} */
function pxMind(u,t,R,k,ctx){
  const M=MK(), pl=R[k], L=POS.length, i=k%L, st=k<L, tr=typeof traitsOf==="function"?traitsOf(pl):{am:10,lo:10};
  const V=pxValue(pl), typ=ctx.typ, above=pl.r-typ, why=[];
  let push=M.base;
  if(!st){ const s=R[i]; if(s&&(s.c||0)<3&&s.r>=pl.r+3&&pl.r>=typ-12){ push+=M.buried; why.push(["start",M.buried]) } }
  if(ctx.newCoach){ push+=M.coach; why.push(["coach",M.coach]) }
  let up=0;
  const ref=ctx.big?M.upTop:M.upRef, gap=pl.r-eloToRating(ref);
  if((!ctx.big||ctx.prog<M.upTop-100)&&st&&gap>=-M.upAbove){ up=(M.up+0.03*Math.min(10,gap+M.upAbove))*(ctx.big?M.upP4:1); push+=up; why.push(["up",up]) }
  if(M.posPush[pl.p]){ push+=M.posPush[pl.p] }
  if(ctx.big&&ctx.losing&&st&&above>=4){ push+=M.losing; why.push(["losing",M.losing]) }
  const mo=pl.moC;
  if(mo!=null&&mo<40){ push+=0.12; why.push(["unhappy",0.12]) } else if(mo!=null&&mo>=75)push-=0.04;
  push+=(10-tr.lo)*0.010+(tr.am-10)*0.006-(pl.tr||0)*0.03;
  // what he asks to stay: his value; less for a loyal man, more where a bigger program will pay for him
  const ask=Math.max(M.floor,Math.round(V*(1-(tr.lo-10)*0.02)*(up?1.35:1)*1000)/1000);
  // unpaid, a good player has offers; a fringe one has fewer
  const money=(st?M.unpaid:M.unpaid*0.75)*(pl.r>=typ-6?1:0.55);
  return {k:k,i:i,pl:pl,V:V,ask:ask,push:Math.max(0,push),up:up,money:money,why:why,st:st};
}
/* the chance he enters, paid or not: paying him meets the money, but a bigger program's pull only a little */
function pxEnterP(m,paid){ return Math.max(0.01,Math.min(0.95,paid?m.push-m.up*0.2:m.push+m.money)) }
const PX_WHY={start:"wants to start",coach:"new head coach",up:"moving up",losing:"tired of losing",unhappy:"unhappy",money:"wants a bigger deal"};
function pxWhyOf(m,paid){
  const w=m.why.slice(); if(!paid)w.push(["money",m.money]);
  w.sort((a,b)=>b[1]-a[1]); return w.length&&w[0][1]>=0.06?PX_WHY[w[0][0]]:"wants a change" }
function pxCtx(u,t,rec,nc){
  const typ=pxTyp(u,t), r=rec&&rec[t];
  return {typ:typ,big:pxBig(u,t),prog:(u.program&&u.program[t])||1500,newCoach:!!(u.coach&&u.coach[t]&&u.coach[t].since===u.year+1)||!!(nc&&nc.has(t)),
          losing:!!(r&&r[0]<=Math.max(3,Math.round((r[0]+r[1])*0.34)))};
}
/* every returning player's mind at program t */
function pxMinds(u,t,rec,R,nc,feat){
  R=R||u.roster[t]; const ctx=pxCtx(u,t,rec,nc), out=[]; out.pro=[];
  R.forEach((pl,k)=>{ if(!pl||(pl.c||0)>=3)return; const x=pxPro(u,t,pl,k,feat);
    if(x)out.pro.push({k:k,pl:pl,r:x.r,featured:feat===k}); else out.push(pxMind(u,t,R,k,ctx)) });
  return out;
}
/* the draft: a player good enough declares at the window (the league's own rule, LEAGUE.market.pro: football's
   underclassmen in January, basketball's before the spring window closes), so nobody is paid to stay and then leaves.
   A featured player (your choice in the season) is likelier to stay, as before. A hash: the preview is the commit */
function pxPro(u,t,pl,k,feat){
  const f=typeof LEAGUE!=="undefined"&&LEAGUE.market&&LEAGUE.market.pro; if(!f)return null;
  const x=f(pl); if(!x||!(x.p>0))return null;
  return pxH(pxKey(t,pl)+"|"+u.year+"|pro")<x.p*(feat===k?0.34:1)?x:null;
}
/* the featured player's slot, for the screen's view: yours, unless you're moving */
function pxFeatUI(t){ return typeof S!=="undefined"&&S&&t===S.myTeam&&!(S.off&&S.off.move&&S.off.move!==S.myTeam)&&S.featured!=null?S.featured:null }
/* the staff's plan (and every computer program's): pay the players who matter most, as far as most of the money goes */
function pxStaffKeep(u,t,rec,R,minds){
  const M=MK(), B=pxBudget(u,t,rec), L=POS.length, keep={};
  minds=minds||pxMinds(u,t,rec,R,null,pxFeatUI(t)); let pay=0;
  minds.slice().sort((a,b)=>{ const w=m=>POS[m.i].w*(m.st?1:0.35)*Math.max(1,m.pl.r-pxTyp(u,t)+12); return w(b)-w(a) })
    .forEach(m=>{ const key=pxKey(t,m.pl); if(pay+m.ask<=B.two*M.keepShare){ keep[key]=1; pay+=m.ask } else keep[key]=0 });
  return keep;
}
/* the plan that counts for program t: a person's choices over the staff's, else the staff's */
function pxKeepOf(u,t,rec,R,minds,ch){
  const staff=pxStaffKeep(u,t,rec,R,minds), mine=ch&&ch.keep||{};
  Object.keys(mine).forEach(k=>{ if(k in staff)staff[k]=mine[k]?1:0 });
  return staff;
}

/* copies of program t's roster as the window will see them: the season's morale and trust banked (as the season's
   end does, Season.bankCareers), so the screen's preview reads each man as the commit will */
function pxBanked(u,t){
  const R=(u.roster[t]||[]).map(p=>p?Object.assign({},p):p);
  if(typeof SEA==="undefined"||!SEA||!SEA.ppl||SEA.year!==u.year||!SEA.roster)return R;
  const live=SEA.roster[t]||[];
  R.forEach((pl,i)=>{ if(!pl)return; const li=live[i]&&live[i].n===pl.n?i:live.findIndex(x=>x&&x.n===pl.n), src=li>=0?live[li]:null;
    if(src&&src.mo!=null){ pl.moC=Math.round(src.mo); if(src.tr)pl.tr=src.tr; else delete pl.tr } });
  return R;
}

/* what a bid is worth to him, before the part that's his own: the money against his value, playing time (more to a
   man who left to start), the program against the one he left (more to a man moving up), the Power Four's stage for a
   man from the Group of Six, and the season it just had */
function pxBidBase(u,e,t,ratio,starts,wp){
  const M=MK(), wSt=e.why==="wants to start"?1.0:0.55, wUp=e.why==="moving up"?200:300;
  return Math.log(ratio)+(starts?wSt:0)+((u.program[t]||1500)-(u.program[e.from]||1500))/wUp
    +(pxBig(u,t)&&!pxBig(u,e.from)?M.p4Pull:0)+(wp-0.5)*0.8;
}

/* ---- the window ----
   u: the universe (rosters as the season ended); rec: the season's records; U_CH: people's choices by team.
   dry: on copies of the rosters (the offseason screen's preview); else on the universe itself.
   Returns the report: entrants, moves, each program's money, and each person's part. */
function pxMarket(u,rec,U_CH,dry,nc){
  const M=MK(), L=POS.length, year=u.year, people=new Set(Object.keys(U_CH||{}));
  const RO={}; NAMES.forEach(t=>{ RO[t]=dry?pxBanked(u,t):u.roster[t] });
  const B={}, pay={}, left={}, nIn={}, ents=[], rep={n:0,signed:0,unsigned:0,in:{},out:{},kept:{},targets:{},money:{},grad:{},fills:{},pro:{}};
  const push=(o,t,x)=>{ (o[t]=o[t]||[]).push(x) }, fillP={};
  // 1. the asks
  NAMES.forEach(t=>{
    B[t]=pxBudget(u,t,rec); pay[t]=0; nIn[t]=0;
    const ch=U_CH&&U_CH[t], feat=ch&&ch.featured!=null?ch.featured:null;
    const R=RO[t], minds=pxMinds(u,t,rec,R,nc,feat), keep=pxKeepOf(u,t,rec,R,minds,ch);
    const gone=minds.pro.slice();
    // the ones declaring for the draft leave first: the league's draft takes them with the seniors
    minds.pro.forEach(x=>{ push(rep.pro,t,x); if(!dry&&x.featured)u.pipeline=(u.pipeline||0)+1 });
    minds.forEach(m=>{ const key=pxKey(t,m.pl), paid=!!keep[key], p=pxEnterP(m,paid);
      if(pxH(key+"|"+year+"|enter")<p){ gone.push(m); ents.push({key:key,from:t,pl:m.pl,n:m.pl.n,p:m.pl.p,i:m.i,r:m.pl.r,pot:m.pl.pot,c:m.pl.c,
          st:m.st,V:m.V,why:pxWhyOf(m,paid),paid:paid}) }
      else{ const cost=paid?m.ask:Math.round(m.ask*0.5*1000)/1000; pay[t]+=cost; m.pl.nil=cost;
        if(people.has(t)&&paid)push(rep.kept,t,{n:m.pl.n,p:m.pl.p,r:m.pl.r,ask:m.ask}) } });
    // they leave: a starter's backup steps up, and the slots left empty wait for the market
    gone.sort((a,b)=>a.k-b.k).forEach(m=>{ R[m.k]=null });
    POS.forEach((_,i)=>{ if(!R[i]&&R[BK(i)]){ R[i]=R[BK(i)]; R[BK(i)]=null } });
    left[t]=Math.round((B[t].two-pay[t])*1000)/1000;
  });
  rep.n=ents.length;
  ents.forEach(e=>push(rep.out,e.from,{n:e.n,p:e.p,r:e.r,why:e.why}));
  // 2. the market, best first
  const wpOf=t=>{ const r=rec&&rec[t]; return r&&r[0]+r[1]?r[0]/(r[0]+r[1]):0.5 };
  // the depth he'd join: the two best non-seniors, and where a spot is empty the next man up from the rest (about typ-9)
  const depth=(R,i,t)=>{ const D=[R[i],R[BK(i)]].filter(p=>p&&(p.c||0)<3).sort((a,b)=>b.r-a.r), nx=pxTyp(u,t)-9;
    return [D[0]?D[0].r:nx,D[1]?D[1].r:nx] };
  ents.sort((a,b)=>b.V-a.V||(a.key<b.key?-1:1));
  const offersBy={}; people.forEach(t=>{ const ch=U_CH[t]; offersBy[t]={}; ((ch&&ch.offers)||[]).forEach(o=>{ offersBy[t][o[0]]=+o[1]||1 }); rep.targets[t]=[] });
  const tgt={};   // a person's targets, reported once each
  ents.forEach(e=>{
    const bids=[];
    NAMES.forEach(t=>{ if(t===e.from)return;
      const R=RO[t], [st,bk]=depth(R,e.i,t), starts=e.r>st+1;
      if(people.has(t)){ const lvl=offersBy[t][e.key]; if(!lvl)return;
        const o=Math.round(e.V*lvl*1000)/1000;
        if(o>left[t]+1e-9){ tgt[t+"|"+e.key]={n:e.n,p:e.p,got:false,why:"your budget had run out by then"}; return }
        if(!starts&&!(e.r>bk)){ tgt[t+"|"+e.key]={n:e.n,p:e.p,got:false,why:`no room at ${e.p}: your players there are better`}; return }
        bids.push({t:t,o:o,start:starts,you:true}); return }
      if(nIn[t]>=M.maxIn)return;
      const cs=e.r>st+2, up=!cs&&e.r>bk+4&&(u.program[t]||1500)>=(u.program[e.from]||1500)-40&&e.why!=="wants to start";
      if(!cs&&!up)return;
      const gain=POS[e.i].w*(e.r-(cs?st:bk))*(cs?1:0.35), need=Math.max(0,Math.min(1,gain/2.2));
      const o=Math.round(e.V*(0.85+0.45*need)*1000)/1000;
      if(o>Math.max(0,left[t]-B[t].two*(1-M.cpuShare)))return;
      bids.push({t:t,o:o,start:starts});
    });
    if(!bids.length){ rep.unsigned++; return }
    bids.forEach(b=>{ const n1=pxH(e.key+"|"+b.t+"|"+year+"|u"), n2=pxH(e.key+"|"+b.t+"|"+year+"|v");
      b.base=pxBidBase(u,e,b.t,b.o/e.V,b.start,wpOf(b.t));
      b.u=b.base+(n1+n2-1)*M.noise });
    e.bb=bids.map(b=>({t:b.t,base:Math.round(b.base*1000)/1000}));
    bids.sort((a,b)=>b.u-a.u||(a.t<b.t?-1:1));
    // none good enough for him: he drops a level (the FCS) or stops
    if(bids[0].u<M.reserve){ rep.unsigned++; bids.filter(b=>b.you).forEach(b=>{ tgt[b.t+"|"+e.key]={n:e.n,p:e.p,got:false,why:"turned everyone down"} }); return }
    const w=bids[0], R=RO[w.t];
    bids.filter(b=>b.you&&b!==w).forEach(b=>{ tgt[b.t+"|"+e.key]={n:e.n,p:e.p,got:false,why:`chose ${w.t}`,to:w.t} });
    // he signs: at his position he takes the best spot he beats; seniors (leaving anyway) are passed first
    const pl=e.pl, i=e.i, C=[R[i],R[BK(i)],pl].filter(Boolean).sort((a,b)=>((a.c||0)>=3)-((b.c||0)>=3)||b.r-a.r);
    R[i]=C[0]||null; R[BK(i)]=C[1]||null; const out=C[2]||null;
    if(out){ if((out.c||0)>=3)push(rep.grad,w.t,out); else push(rep.out,w.t,{n:out.n,p:out.p,r:out.r,why:"lost his spot to a transfer"}) }
    left[w.t]=Math.round((left[w.t]-w.o)*1000)/1000; nIn[w.t]++; rep.signed++;
    pl.nil=w.o; pl.xf=(pl.xf||0)+1; pl.xfFrom=e.from; pl.xfY=year; delete pl.moC; delete pl.tr;
    push(rep.in,w.t,{n:e.n,p:e.p,r:e.r,from:e.from,o:w.o,start:R[i]===pl});
    if(w.you)tgt[w.t+"|"+e.key]={n:e.n,p:e.p,got:true,o:w.o,start:R[i]===pl};
    e.to=w.t;
  });
  // 3. the next man up, from the rest of the roster
  NAMES.forEach(t=>{ const R=RO[t], typ=pxTyp(u,t);
    POS.forEach((_,i)=>{ if(!R[i]&&R[BK(i)]){ R[i]=R[BK(i)]; R[BK(i)]=null }
      [i,BK(i)].forEach(k=>{ if(R[k])return; const g=new RNG(strHash(t+"|"+year+"|fill|"+k));
        const pl=makePlayer(g,typ-g.range(5,13),g.int(3),i); pl.nil=MK().floor; R[k]=pl; push(rep.fills,t,pl.n); if(dry)push(fillP,t,pl) }) });
    rep.money[t]={tot:B[t].tot,two:B[t].two,rest:B[t].rest,kept:Math.round(pay[t]*1000)/1000,
      portal:Math.round((B[t].two-pay[t]-left[t])*1000)/1000,left:left[t]};
  });
  // a person's targets, in their order: signed, chose elsewhere, or never entered
  people.forEach(t=>{ const ch=U_CH[t]; rep.targets[t]=((ch&&ch.offers)||[]).map(o=>{ const x=tgt[t+"|"+o[0]];
    if(x)return x; const e=ents.find(y=>y.key===o[0]), nm=String(o[0]).split("|")[1];
    if(!e)return {n:nm,got:false,why:"stayed where he was: he never entered the portal"};
    if(e.from===t)return {n:nm,got:false,why:"he's leaving you"};
    return {n:nm,got:false,why:e.to?`chose ${e.to}`:"went unsigned"} }) });
  rep.ents=ents.map(e=>({key:e.key,from:e.from,n:e.n,p:e.p,i:e.i,r:e.r,pot:e.pot,c:e.c,V:e.V,why:e.why,to:e.to||null,st:e.st,bb:e.bb||[]}));
  rep.rosters=dry?RO:null; if(dry)Object.defineProperty(rep,"fillP",{value:fillP});   // the screen's: not kept
  return rep;
}

/* ---- the screen's view of the market (your choices as they stand), cached until they change ---- */
let _pxPrev=null;
function pxPreview(t,P){
  const key=JSON.stringify([U.year,t,SEA&&SEA.year,S.off&&S.off.move,S.featured,P&&P.keep||{},P&&P.offers||[]]);
  if(_pxPrev&&_pxPrev.key===key&&_pxPrev.u===U)return _pxPrev.rep;
  const UC={[t]:{keep:(P&&P.keep)||{},offers:(P&&P.offers)||[],featured:pxFeatUI(t)}};
  // the other people in a hot seat: their staff's plans, until they choose
  if(isHotSeat())S.coaches.forEach((c,i)=>{ if(i!==(S.turn||0)&&c&&c.myTeam&&c.myTeam!==t&&!UC[c.myTeam])UC[c.myTeam]=(S.pending&&S.pending[c.myTeam])||{} });
  // a coach on the move: the program he leaves and the one he takes both have a new head coach by the window
  const nc=S.off&&S.off.move&&S.off.move!=="retire"&&S.off.move!==S.myTeam?new Set([S.myTeam,S.off.move]):null;
  const rep=pxMarket(U,SEA.rec,UC,true,nc);
  _pxPrev={key:key,u:U,rep:rep}; return rep;
}
/* his choice, as it stands without the last bit that's his own: likely, a battle, a long shot. Your bid against the
   best of the others the market saw for him, on the same terms it weighs; the noise is the part that's his */
function pxChance(t,e,lvl,P){
  const rep=pxPreview(t,P), u=U, M=MK(), wpOf=x=>{ const r=SEA.rec[x]; return r&&r[0]+r[1]?r[0]/(r[0]+r[1]):0.5 };
  // the depth he'd join, as the market sees it when he signs: a spot filled after the window (the next man up from the
  // rest of the roster) counts as the market counts an empty one
  const F=(rep.fillP&&rep.fillP[t])||[], R=rep.rosters[t], D=[R[e.i],R[BK(e.i)]].filter(p=>p&&(p.c||0)<3&&p.n!==e.n&&F.indexOf(p)<0).sort((a,b)=>b.r-a.r), nx=pxTyp(u,t)-9;
  const starts=e.r>(D[0]?D[0].r:nx)+1;
  if(!starts&&!(e.r>(D[1]?D[1].r:nx)))return 0;      // no room: your players there are better (the market won't send him)
  const mine=pxBidBase(u,e,t,lvl,starts,wpOf(t));
  const E=rep.ents.find(x=>x.key===e.key), others=(E&&E.bb||[]).filter(b=>b.t!==t).map(b=>b.base).sort((a,b)=>b-a);
  // his own part, played out a few hundred times on fixed dice (the same answer every time the screen asks): against
  // every other bid, and against his walking away (no deal good enough)
  const g=new RNG(strHash(e.key+"|chance")), nz=()=>(g.r()+g.r()-1)*M.noise, K=300; let win=0;
  for(let s=0;s<K;s++){ const um=mine+nz(); if(um<M.reserve)continue; let best=true;
    for(let j=0;j<others.length;j++){ if(others[j]+M.noise<um)break; if(others[j]+nz()>um){ best=false; break } }
    if(best)win++ }
  return Math.max(0.03,Math.min(0.97,win/K)) }
function pxChanceWord(c){ return c>=0.65?"likely":c>=0.35?"a battle":"a long shot" }

/* what a season's history keeps of the window: the league's counts, and the part of the teams people coach (the
   season's team and, after a move, the new one; all 132 would cost the save tens of thousands of characters) */
function pxHistory(rep,my){
  if(!rep)return null; const T=new Set([my].concat(Object.keys(rep.targets||{}))), pick=o=>{ const x={}; T.forEach(t=>{ if(o&&o[t])x[t]=o[t] }); return x };
  return {n:rep.n,signed:rep.signed,unsigned:rep.unsigned,in:pick(rep.in),out:pick(rep.out),kept:pick(rep.kept),
    targets:pick(rep.targets),money:pick(rep.money)};
}

/* ---- the offseason screen: the budget, your players' asks, and the portal ---- */
const pxOpen={};
function pxTeam(){ return S.off&&S.off.move&&S.off.move!=="retire"?S.off.move:S.myTeam }
/* your money as your choices stand: what you've agreed to pay, and what offers out would cost if all signed */
function pxLedger(t,P){
  const nc=S.off&&S.off.move&&S.off.move!=="retire"&&S.off.move!==S.myTeam?new Set([S.myTeam,S.off.move]):null;
  const B=pxBudget(U,t,SEA.rec), minds=pxMinds(U,t,SEA.rec,pxBanked(U,t),nc,pxFeatUI(t)), keep=pxKeepOf(U,t,SEA.rec,null,minds,{keep:P.keep||{}});
  const kept=minds.filter(m=>keep[pxKey(t,m.pl)]).reduce((s,m)=>s+m.ask,0);
  const rep=pxPreview(t,P), ents={}; rep.ents.forEach(e=>ents[e.key]=e);
  const offers=(P.offers||[]).filter(o=>ents[o[0]]).reduce((s,o)=>s+ents[o[0]].V*o[1],0);
  return {B:B,minds:minds,keep:keep,kept:kept,offers:offers,rep:rep,ents:ents};
}
function pxBlock(){
  if(!pxOn()||!S.off)return null; const t=pxTeam(), L=pxLedger(t,S.off.picks);
  return L.kept>L.B.two+1e-6?"Over budget by "+pxMoney(L.kept-L.B.two):null;
}
const PX_LV=[[1,"Offer"],[1.25,"Strong offer"],[1.5,"Top offer"],[2,"Twice his value"]];
const PX_LINE={"wants to start":"He's behind a better player and wants to start somewhere.",
  "new head coach":"The coach who recruited him is gone.",
  "moving up":"Bigger programs will pay him more than you can, and play him on a bigger stage.",
  "tired of losing":"He wants to win before he's done.",
  "unhappy":"He hasn't been happy here.",
  "wants a bigger deal":"He wants to be paid what the market says he's worth.",
  "wants a change":"He's thinking about a change."};
function pxScreenHTML(num){
  const P=S.off.picks, t=pxTeam(), M=MK(), L=pxLedger(t,P), B=L.B, rep=L.rep;
  const yr=c=>(LEAGUE.classes&&LEAGUE.classes[Math.min(3,(c||0)+1)])||"";   // the year he'll be
  const left=B.two-L.kept;
  let h=`<div class="grouphead">${num}. Roster budget &mdash; ${pxMoney(B.tot)}</div>`;
  h+=`<div class="note">Revenue sharing and NIL: since the House settlement a school can share up to $${M.cap}M a year with its athletes (2026-27). Most schools give about ${Math.round((M.share||0.75)*100)}% of it to ${esc(M.sport||"football")}, and a collective adds more. Bigger programs and better seasons raise more. Roster limit: ${M.rosterLimit}. ${pxMoney(B.rest)} goes to the players outside your ${esc(M.depth)}; the other ${pxMoney(B.two)} is yours to spend on the ${POS.length*2} below and on the portal. Money you don't spend isn't carried over.</div>`;
  h+=`<div class="budgetleft ${left>=0?'done':''}">${left<0?pxMoney(-left)+" over budget":`Keeping ${pxMoney(L.kept)} &middot; ${pxMoney(left)} left for the portal`}${L.offers?` &middot; offers out ${pxMoney(L.offers)}`:""}</div>`;
  h+=`<div class="budbar"><i style="width:${Math.min(100,L.kept/Math.max(0.01,B.two)*100).toFixed(0)}%"></i></div>`;
  // your players: what each asks, and whether he stays
  const outN=new Set((rep.out[t]||[]).filter(o=>o.why!=="lost his spot to a transfer").map(o=>o.n));
  const rows=L.minds.slice().sort((a,b)=>b.ask-a.ask), staff=pxStaffKeep(U,t,SEA.rec,null,L.minds);
  h+=`<div class="grouphead">${num+1}. Your players: what they ask</div>`;
  h+=`<div class="note">Each returning player asks to be paid what the market would pay him; seniors graduate. Pay him and most stay; let him go and the good ones test the portal. Money doesn't buy minutes: a player stuck behind a better starter may go anyway. ${outN.size?`<b>As it stands, ${nOf(outN.size,"player")} would enter the portal.</b>`:"As it stands, nobody would leave."}</div>`;
  const prow=m=>{ const key=pxKey(t,m.pl), paid=!!L.keep[key], go=outN.has(m.pl.n);
    const why=pxWhyOf(m,paid), p=pxEnterP(m,paid), word=go?"<b>would enter the portal</b>":p>=0.3?"might go":"staying";
    return `<div class="drow dnrow"><div class="fmain"><div class="fname">${esc(m.pl.n)} <span class="dpos">${esc(m.pl.p)}</span>${m.st?"":` <span class="planwhy">backup</span>`}</div>
      <div class="fnote">rated ${m.pl.r} &middot; ${yr(m.pl.c)} next season &middot; asks ${pxMoney(m.ask)} &middot; ${word}${go||p>=0.3?" &middot; "+esc(PX_LINE[why]||why):""}${!!staff[key]!==paid?' <span class="planyou">your change</span>':""}</div></div>
      <button class="skip small ${paid?'dnpick':''}" data-pxkeep="${esc(key)}" data-v="${paid?0:1}">${paid?"Paying "+pxMoney(m.ask):"Pay "+pxMoney(m.ask)}</button></div>` };
  const open=pxOpen.mine, show=open?rows:rows.slice(0,8);
  const pros=(rep.pro[t]||[]);
  if(pros.length)h+=`<div class="note"><b>Declaring for the ${esc(M.draft||"draft")}:</b> ${pros.map(x=>`${esc(x.pl.n)} (${esc(x.pl.p)}, ${x.r})`).join(", ")}. ${pros.length===1?"He doesn't":"They don't"} ask to be paid.</div>`;
  h+=show.map(prow).join("")+(rows.length>8?`<button class="skip small" data-pxmore="mine">${open?"Show the first eight":"Show all "+rows.length}</button>`:"");
  // the portal
  const ents=rep.ents.filter(e=>e.from!==t), mineK=new Set((P.offers||[]).map(o=>o[0]));
  h+=`<div class="grouphead">${num+2}. Transfer portal &mdash; window ${esc(M.window)}</div>`;
  h+=`<div class="note">${nOf(rep.n,"player")} would enter this ${esc(M.when)}. Every program with a need and the money bids; each player signs where the deal is best for him: the money against his value, playing time, the program and its season. Nobody gets a first look, and the money is your only limit. An offer is charged only if he signs. <b>Likely</b>: most like him would pick you. <b>A battle</b>: about half. <b>A long shot</b>: most go elsewhere.</div>`;
  const depthWord=e=>{ const D=(rep.rosters[t]||[]).filter(p=>p&&p.p===e.p&&(p.c||0)<3&&p.n!==e.n).sort((a,b)=>b.r-a.r);
    return !D[0]||e.r>D[0].r+1?`he'd start${D[0]?" over "+esc(D[0].n):""}`:!D[1]||e.r>D[1].r?`he'd back up ${esc(D[0].n)}`:`he wouldn't make your top two at ${esc(e.p)}` };
  const erow=(e,lvl)=>{ const on=!!lvl, c=pxChance(t,e,lvl||1,P), nxt=PX_LV.find(x=>x[0]>(lvl||0));
    return `<div class="drow dnrow"><div class="fmain"><div class="fname">${esc(e.n)} <span class="dpos">${esc(e.p)}</span></div>
      <div class="fnote">${esc(e.from)} &middot; rated ${e.r} &middot; ${yr(e.c)} next season &middot; ${esc(e.why)} &middot; worth ${pxMoney(e.V)} &middot; ${depthWord(e)} &middot; ${on?`your offer ${pxMoney(e.V*lvl)}: `:""}<b>${pxChanceWord(c)}</b></div></div>
      ${nxt?`<button class="skip small" data-pxoff="${esc(e.key)}" data-lv="${nxt[0]}">${on?"Raise to":esc(nxt[1])} ${pxMoney(e.V*nxt[0])}</button>`:""}${on?`<button class="skip small" data-pxoff="${esc(e.key)}" data-lv="0">Withdraw</button>`:""}</div>` };
  const mine=(P.offers||[]).map(o=>[L.ents[o[0]],o[1]]).filter(x=>x[0]&&x[0].from!==t);
  h+=`<div class="divhead">Your offers</div>`+(mine.length?mine.map(x=>erow(x[0],x[1])).join(""):`<div class="note">None yet: the staff sign nobody unless you do.</div>`);
  const leaving=(rep.out[t]||[]);
  if(leaving.length)h+=`<div class="note">Leaving you: ${leaving.map(o=>`${esc(o.n)} (${esc(o.p)}, ${o.r}), ${esc(o.why)}`).join("; ")}.</div>`;
  const rest=ents.filter(e=>!mineK.has(e.key)), reach=rest.filter(e=>pxChance(t,e,1,P)>=0.35&&e.r>=pxTyp(U,t)-10).slice(0,30), far=rest.filter(e=>reach.indexOf(e)<0&&pxChance(t,e,1,P)>0).slice(0,12);
  const list=(Ls,k)=>{ if(!Ls.length)return ""; const o=pxOpen[k], sh=o?Ls:Ls.slice(0,6);
    return sh.map(e=>erow(e,0)).join("")+(Ls.length>6?`<button class="skip small" data-pxmore="${k}">${o?"Show the first six":"Show all "+Ls.length}</button>`:"") };
  h+=`<div class="divhead">In the portal, within your reach</div>`+(reach.length?list(reach,"reach"):`<div class="note">Nobody in the portal looks likely to pick you at his price.</div>`);
  if(far.length)h+=`<div class="divhead">The best of the rest: long shots</div>`+list(far,"far");
  return h;
}
function pxBind(){
  const P=()=>S.off.picks;
  document.querySelectorAll("[data-pxkeep]").forEach(b=>b.onclick=()=>{ const p=P(); p.keep=Object.assign({},p.keep||{},{[b.dataset.pxkeep]:+b.dataset.v}); save(); render() });
  document.querySelectorAll("[data-pxoff]").forEach(b=>b.onclick=()=>{ const p=P(), k=b.dataset.pxoff, lv=+b.dataset.lv;
    const L=(p.offers||[]).filter(o=>o[0]!==k); if(lv)L.push([k,lv]); p.offers=L; save(); render() });
  document.querySelectorAll("[data-pxmore]").forEach(b=>b.onclick=()=>{ pxOpen[b.dataset.pxmore]=!pxOpen[b.dataset.pxmore]; render() });
}
/* the banner after the window: who came, who went, who you kept, what it cost */
function pxBannerHTML(Mk,t){
  if(!Mk)return ""; const I=(Mk.in||{})[t]||[], O=(Mk.out||{})[t]||[], K=(Mk.kept||{})[t]||[], T=(Mk.targets||{})[t]||[], $=(Mk.money||{})[t];
  let h=`<div class="bnews"><b>Transfer portal:</b> ${nOf(Mk.n,"player")} entered nationally, ${Mk.signed} signed with new programs.${$?` You spent ${pxMoney($.kept+$.portal)} of ${pxMoney($.two)} on your ${esc(MK().depth)}.`:""}</div>`;
  if(I.length)h+=`<div class="bnews"><b>In:</b> ${I.map(p=>`${esc(p.n)} (${esc(p.p)}, ${p.r}, from ${esc(p.from)}, ${pxMoney(p.o)}${p.start?", starting":""})`).join(", ")}.</div>`;
  if(O.length)h+=`<div class="bnews small"><b>Out:</b> ${O.map(p=>`${esc(p.n)} (${esc(p.p)}, ${p.r}): ${esc(p.why)}`).join("; ")}.</div>`;
  const miss=T.filter(x=>!x.got);
  if(miss.length)h+=`<div class="bnews small"><b>Targets you missed:</b> ${miss.map(x=>`${esc(x.n)} ${esc(x.why)}`).join("; ")}.</div>`;
  if(K.length)h+=`<div class="bnews small"><b>Paid to stay:</b> ${K.slice(0,6).map(p=>`${esc(p.n)} (${pxMoney(p.ask)})`).join(", ")}${K.length>6?` and ${K.length-6} more`:""}.</div>`;
  return h;
}
/* the staff's plan card's lines */
function pxPlanRow(P,you){
  const t=pxTeam(), L=pxLedger(t,P), n=L.minds.filter(m=>L.keep[pxKey(t,m.pl)]).length, st=pxStaffKeep(U,t,SEA.rec,null,L.minds), mine=Object.keys(P.keep||{}).filter(k=>k in st&&!!P.keep[k]!==!!st[k]).length, o=(P.offers||[]).length;
  return `<div class="planrow"><b>Budget</b> keep ${nOf(n,"player")} for ${pxMoney(L.kept)} of ${pxMoney(L.B.two)}${mine?you:""}</div>
    <div class="planrow"><b>Transfer portal</b> ${o?nOf(o,"offer")+" of yours"+you:"no offers: add players below if you want them."}</div>`;
}
