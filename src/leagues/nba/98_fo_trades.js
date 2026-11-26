/* ============ pro basketball: the trade machine (the front office, Nov 2026) ============ */
/* Ian: "it should feel like running a real NBA front office". Seasons on the front office's rules (u.foV) trade here;
   older seasons keep core 98_trades until their summer.

   - Any positions, up to three players a side, and draft picks: each club's first- and second-round picks in the next
     four drafts, a first with an optional top-4, top-10 or lottery (top-14) protection (it stays with them if it lands
     there). The pick ledger is the universe's (u.nbaPk), carried at each season's end; the draft reads it
     (LEAGUE.pickOwner, core 91_draftnight).
   - Salary matching by where each payroll lands (24_cap, NBA$.m1/m2): under the cap after the trade anything fits;
     under the first apron 200% + $0.25M, + $9.1M or 125% + $0.25M; over it no more than goes out; over the second apron
     no two contracts added up to take back a bigger one. A computer club won't go past its owner's limit.
   - What a club wants depends on where it stands (tdWin: a contender wants now, a club out of it later, picks and
     cap room), what the deal does to its tax bill, and a premium in proportion to what it gives up now. It won't take a
     deal that is bad by plain arithmetic whatever its situation (NT.SLACK: no buying low from sellers to sell high to
     buyers). Close to yes, it says what would do it: a counteroffer.
   - No limit on trades a season (it was three); the same club once a week (TD_GAP). Free agents signed this summer
     can't be traded until Dec 15 (the real rule).
   - The deadline (Feb 5) draws a flurry: the computer's contenders buy from its sellers in the last two weeks.
   Nothing is drawn: the same question gets the same answer, and a reload replays every deal from its day. */
const NT={MAXP:3, PREM:3, PROP:0.5, SLACK:14, CLOSE:28, TAXK:0.9, SALK:0.18, YRS:4};
const ntOn=()=>LEAGUE.id==="nba"&&nbaFO()&&typeof SEA!=="undefined"&&SEA&&SEA.roster&&SEA.roster[NAMES[0]]&&SEA.roster[NAMES[0]].length>2*POS.length;
/* ---- the pick ledger ---- */
const ntKey=(y,rd,o)=>y+"|"+rd+"|"+o;
function ntSeasonTrades(sea){ sea=sea||SEA; const o=[]; (typeof tdAllTrades==="function"?tdAllTrades():[]).forEach(x=>o.push(x)); ((sea&&sea.cpuTr)||[]).forEach(x=>o.push(x));
  // only what has happened by the day being played: a reload replays a day with the later days' moves already kept
  return o.filter(x=>x&&x.nba&&(x.y===undefined||x.y===sea.year)&&(x.step||0)<=sea.step).sort((a,b)=>(a.step||0)-(b.step||0)) }
function ntLedger(){ const L=Object.assign({},(U&&U.nbaPk)||{}); ntSeasonTrades().forEach(x=>(x.pk||[]).forEach(q=>{ L[ntKey(q.y,q.rd,q.o)]={to:q.to,prot:q.prot||0} })); return L }
const ntOwner=(L,y,rd,o)=>{ const e=L[ntKey(y,rd,o)]; return e?e.to:o };
function ntPicksOf(t,L){ L=L||ntLedger(); const out=[];
  for(let y=SEA.year;y<SEA.year+NT.YRS;y++)for(let rd=1;rd<=2;rd++)NAMES.forEach(o=>{ if(ntOwner(L,y,rd,o)===t){ const e=L[ntKey(y,rd,o)]; out.push({y:y,rd:rd,o:o,prot:e?e.prot||0:0}) } });
  return out }
const ntPickName=q=>`${q.y+1} ${q.rd===1?"first":"second"}${q.o?` (${esc(q.o)})`:""}${q.prot?`, top-${q.prot} protected`:""}`;
/* where a pick will land: this season's record, then regressing to the middle the further out it is */
function ntPct(t){ const r=(SEA.rec||{})[t]||[0,0]; return ((r[0]||0)+5)/((r[0]||0)+(r[1]||0)+10) }
function ntSlotNow(o){ return NAMES.filter(x=>ntPct(x)<ntPct(o)||(ntPct(x)===ntPct(o)&&x<o)).length+1 }
function ntSlotAt(q){ const s=ntSlotNow(q.o), k=Math.min(1,(q.y-SEA.year)*0.45); return s+(15.5-s)*k }
/* a first's worth in Elo of strength two years on (a #1 pick about a star's ceiling, a late first a rotation man);
   a protected one counts only the chance it conveys */
const NT_PV=[[1,58],[3,48],[5,40],[10,28],[15,19],[20,14],[25,10],[30,7]];
function ntPickV(q){ if(q.rd===2)return 2.5; const s=ntSlotAt(q); let v=7;
  for(let i=1;i<NT_PV.length;i++)if(s<=NT_PV[i][0]){ const [a,x]=NT_PV[i-1],[b,y]=NT_PV[i]; v=x+(y-x)*(s-a)/(b-a); break }
  if(q.prot){ const spread=4+3*(q.y-SEA.year), conv=1/(1+Math.exp(-(s-q.prot-0.5)/spread)); v*=conv }
  return v*Math.pow(0.92,q.y-SEA.year) }
/* ---- rosters after a deal: each man to an open place at his own spot, else a neighbouring one; holes in front filled
   from behind; too many and the lowest-rated man not just acquired is waived; too few and the club signs a man to the
   minimum (from the day's own seed: no dice) ---- */
function ntReslot(R,outI,inP,t,seed){
  const X=R.slice(); while(X.length<3*POS.length)X.push(null); outI.forEach(i=>X[i]=null);
  const waived=[], signed=[], pos=p=>Math.max(0,POS.findIndex(P=>P.p===p.p)), near=h=>[0,1,-1,2,-2,3,-3,4,-4].map(d=>h+d).filter(j=>j>=0&&j<POS.length);
  inP.slice().sort((a,b)=>b.r-a.r).forEach(p=>{
    let at=-1; near(pos(p)).some(j=>[0,1,2].some(k=>{ if(!X[j+POS.length*k]){ at=j+POS.length*k; return true } return false }));
    if(at<0){ let wi=-1; X.forEach((q,i)=>{ if(q&&inP.indexOf(q)<0&&i>=POS.length&&(wi<0||q.r<X[wi].r))wi=i }); if(wi>=0){ waived.push(X[wi]); at=wi } }
    if(at>=0)X[at]=p });
  POS.forEach((_,i)=>{ const L=[X[i],X[BK(i)],X[BK(BK(i))]], o=L.filter(Boolean);
    // the order at the spot stays (your depth chart), the men just close up
    [i,BK(i),BK(BK(i))].forEach((j,k)=>X[j]=o[k]||null) });
  POS.forEach((_,i)=>{ if(X[i])return; near(i).slice(1).some(j=>{ for(const k of [2,1]){ const s=j+POS.length*k; if(X[s]){ X[i]=X[s]; X[s]=null; return true } } return false }) });
  X.forEach((q,i)=>{ if(q)return; const rng=new RNG(strHash((t||"")+"|"+(seed||0)+"|"+i)), p=nflPlayer(rng,44+rng.range(0,5),23+rng.int(9),i%POS.length);
    p.k={sal:nbaMin(p.age),yrs:1,v:2}; p.fill=1; X[i]=p; signed.push(p) });
  return {X:X,waived:waived,signed:signed} }
/* a club's own reading of a roster: at each spot the best man most, the second some, the third a little */
function ntVal(R,fut){ let s=0; POS.forEach((P,i)=>{ const v=x=>x?(fut?tdFut(x):x.r):0, L=[R[i],R[BK(i)],R[BK(BK(i))]].map(v).sort((a,b)=>b-a); s+=P.w*(0.84*L[0]+0.13*L[1]+0.03*L[2]) }); return ratingToElo(s) }
const ntPay=R=>R.reduce((s,p)=>s+(p&&p.k&&p.k.sal||0),0);
const ntSum=L=>L.reduce((s,p)=>s+(p&&p.k?p.k.sal:0),0);
/* traded this season? a free agent signed this summer can't be until Dec 15 */
function ntLocked(p){ return !!(p&&p.faY===SEA.year&&tdDay((LEAGUE.dates||[])[SEA.step]||"")<tdDay("Dec 15")) }
/* the salary rule for one side: what it sends, what it takes back */
function ntMatch(pay0,out,inn,nOut,nIn,maxOut){
  const pay1=pay0-out+inn; if(inn<=out+0.001)return {ok:true,pay1:pay1};
  if(pay1<=NBA$.cap+0.1)return {ok:true,pay1:pay1};
  if(pay1>NBA$.ap2&&nOut>1&&inn>maxOut+0.001)return {ok:false,pay1:pay1,why:"over the second apron, contracts can't be added together to take back a bigger one"};
  const lim=nbaTakeBack(out,pay0,pay1);
  return inn<=lim+0.001?{ok:true,pay1:pay1}:{ok:false,pay1:pay1,lim:lim,why:pay1>NBA$.ap1?`over the first apron, no more salary can come back than goes out (${nbaMoney(out)})`:`${nbaMoney(out)} out takes back at most ${nbaMoney(lim)}`} }
/* ---- a deal, from both sides. d = {t, a:[my slots], b:[their slots], pa:[my picks], pb:[their picks]};
   pa/pb picks are {y,rd,o,prot} ---- */
function ntDeal(my,t,a,b,pa,pb,sea){
  sea=sea||SEA; pa=pa||[]; pb=pb||[];
  const M=sea.roster[my], T=sea.roster[t]; if(!M||!T||my===t)return null;
  const give=a.map(i=>M[i]), get=b.map(j=>T[j]);
  if(give.some(p=>!p)||get.some(p=>!p))return null;
  const d={my:my,t:t,a:a.slice(),b:b.slice(),pa:pa.slice(),pb:pb.slice(),give:give,get:get};
  const bad=w=>Object.assign(d,{legal:false,yes:false,why:w});
  if(!a.length&&!b.length&&!pa.length&&!pb.length)return bad("nothing in it");
  if(a.length>NT.MAXP||b.length>NT.MAXP)return bad(`no more than ${NT.MAXP} players a side`);
  if(!(give.length+pa.length)||!(get.length+pb.length))return bad("each side has to give something");
  const hurt=(tm,i)=>sea.talent.active(tm).some(e=>e.idx===i);
  if(a.some(i=>hurt(my,i)))return bad("an injured man can't be traded");
  if(b.some(j=>hurt(t,j)))return bad("they won't trade a man who's hurt");
  const lk=give.concat(get).find(ntLocked); if(lk)return bad(`${lk.n} signed this summer and can't be traded until Dec 15`);
  const so=ntSum(give), si=ntSum(get), pm=ntPay(M), pt=ntPay(T);
  const mm=ntMatch(pm,so,si,give.length,get.length,Math.max(0,...give.map(p=>p.k.sal))), mt=ntMatch(pt,si,so,get.length,give.length,Math.max(0,...get.map(p=>p.k.sal)));
  d.out=so; d.inn=si; d.payM=mm.pay1; d.payT=mt.pay1;
  if(!mm.ok)return bad("Salaries don't match for you: "+mm.why);
  if(!mt.ok)return bad("Salaries don't match for them: "+mt.why);
  const lim=nbaBudget(U,t); if(mt.pay1>Math.max(lim,pt)+0.05)return bad(`it takes them to ${nbaMoney(mt.pay1)}, past what their owner will pay`);
  d.legal=true;
  const seed=sea.step*977+(a.join("")+"|"+b.join("")).length;
  const XM=ntReslot(M,a,get,my,seed), XT=ntReslot(T,b,give,t,seed+1);
  d.XM=XM; d.XT=XT;
  // the club's side, as it weighs it
  const w=tdWin(t), dNow=ntVal(XT.X,false)-ntVal(T,false), dFut=ntVal(XT.X,true)-ntVal(T,true);
  const dPk=pa.reduce((s,q)=>s+ntPickV(q),0)-pb.reduce((s,q)=>s+ntPickV(q),0);
  const taxT=(nbaTaxBill(ntPay(XT.X))-nbaTaxBill(pt))*NT.TAXK;          // their owner pays this in Elo
  const salT=(ntPay(XT.X)-pt)*NT.SALK*(1-w);                            // a club out of it likes the room
  const score=w*dNow+(1-w)*(dFut+dPk)-taxT-salT-NT.PROP*Math.max(0,-dNow);
  const plain=0.5*dNow+0.5*(dFut+dPk)-taxT*0.5;
  d.score=score; d.plain=plain; d.w=w;
  d.yes=score>=NT.PREM&&plain>=-NT.SLACK;
  if(!d.yes)d.why=plain<-NT.SLACK?"it's too much for them to give up"
    :w>0.7&&dNow<0?"they're contending: they want help now"
    :w<0.4&&dFut+dPk<0?"they're building for later: they want young players and picks"
    :taxT>Math.abs(dNow)*0.5&&taxT>4?"it adds to their tax bill"
    :"it doesn't do enough for them";
  // and yours, as your staff read it (rating points now and in two years)
  d.now=(teamRating(XM.X)-teamRating(M));
  d.fut=(ntVal(XM.X,true)-ntVal(M,true)-dPk)/R_SLOPE;
  return d }
/* ---- what would get it done: the cheapest single addition from you (a pick, a player) or a piece of theirs left out ---- */
function ntCounter(d){
  if(!d||!d.legal||d.yes||d.score<NT.PREM-NT.CLOSE)return null;
  const my=d.my, t=d.t, M=SEA.roster[my], L=ntLedger(), C=[];
  const myCost=x=>-(x.now+x.fut);
  ntPicksOf(my,L).forEach(q=>{ if(d.pa.some(z=>z.y===q.y&&z.rd===q.rd&&z.o===q.o))return; C.push(ntDeal(my,t,d.a,d.b,d.pa.concat([q]),d.pb)) });
  if(d.a.length<NT.MAXP)M.forEach((p,i)=>{ if(!p||d.a.indexOf(i)>=0)return; C.push(ntDeal(my,t,d.a.concat([i]),d.b,d.pa,d.pb)) });
  if(d.b.length>1)d.b.forEach(j=>C.push(ntDeal(my,t,d.a,d.b.filter(x=>x!==j),d.pa,d.pb)));
  d.pb.forEach(q=>C.push(ntDeal(my,t,d.a,d.b,d.pa,d.pb.filter(z=>z!==q))));
  const ok=C.filter(x=>x&&x.yes).sort((x,y)=>myCost(x)-myCost(y));
  return ok[0]||null }
/* ---- what they'd take for one of theirs: packages of yours (up to three players, a pick on top), cheapest for you ---- */
function ntAskFor(t,j){
  const my=S.myTeam, M=SEA.roster[my], T=SEA.roster[t]; if(!T[j])return [];
  const cand=M.map((p,i)=>i).filter(i=>M[i]&&!SEA.talent.active(my).some(e=>e.idx===i)&&!ntLocked(M[i]));
  const out=[], seen={}, L=ntLedger(), picks=ntPicksOf(my,L).filter(q=>q.y<=SEA.year+2);
  const tryD=(a,pa)=>{ const d=ntDeal(my,t,a,[j],pa,[]); if(d&&d.yes){ const k=a.slice().sort().join(",")+"|"+pa.map(q=>ntKey(q.y,q.rd,q.o)).join(","); if(!seen[k]){ seen[k]=1; out.push(d) } return true } return false };
  const combos=[]; cand.forEach((x,ii)=>{ combos.push([x]); cand.slice(ii+1).forEach((y,jj)=>{ combos.push([x,y]); cand.slice(ii+jj+2).forEach(z=>combos.push([x,y,z])) }) });
  combos.forEach(a=>{ if(!tryD(a,[])){ const d=ntDeal(my,t,a,[j],[],[]); if(d&&d.legal&&d.score>=NT.PREM-NT.CLOSE)picks.some(q=>tryD(a,[q])) } });
  picks.forEach(q=>tryD([],[q]));
  return out.sort((x,y)=>(y.now+y.fut)-(x.now+x.fut)).slice(0,4) }
/* ---- offers for one of yours: each club's best for you, of its own men and picks ---- */
function ntShop(i){
  const my=S.myTeam, out=[];
  tdClubs().forEach(t=>{ if(tdRecent(t))return; const T=SEA.roster[t], L=ntLedger(), pk=ntPicksOf(t,L).filter(q=>q.y<=SEA.year+2);
    let best=null; const cand=T.map((p,j)=>j).filter(j=>T[j]&&!SEA.talent.active(t).some(e=>e.idx===j)&&!ntLocked(T[j]));
    const consider=d=>{ if(d&&d.yes&&(d.now>0||d.fut>0)&&(!best||d.now+d.fut>best.now+best.fut))best=d };
    cand.forEach((x,ii)=>{ consider(ntDeal(my,t,[i],[x])); cand.slice(ii+1).forEach(y=>consider(ntDeal(my,t,[i],[x,y]))) });
    pk.filter(q=>q.rd===1).forEach(q=>{ consider(ntDeal(my,t,[i],[],[],[q])); cand.forEach(x=>consider(ntDeal(my,t,[i],[x],[],[q]))) });
    if(best)out.push(best) });
  return out.sort((x,y)=>(y.now+y.fut)-(x.now+x.fut)).slice(0,5) }
/* ---- carrying it out (and replaying it) ---- */
function ntRecord(d){ const x={nba:1,t:d.t,my:d.my,a:d.a,b:d.b,gn:d.give.map(p=>p.n),qn:d.get.map(p=>p.n),y:SEA.year,d:(LEAGUE.dates||[])[SEA.step]||"",step:SEA.step,
    pk:d.pa.map(q=>Object.assign({},q,{to:d.t})).concat(d.pb.map(q=>Object.assign({},q,{to:d.my})))};
  return x }
function nbaTdApply(sea,x){
  const my=x.my||S.myTeam, M=sea.roster[my], T=sea.roster[x.t]; if(!M||!T)return false;
  const fa=(R,names)=>names.map(n=>R.findIndex(p=>p&&p.n===n));
  const a=fa(M,x.gn), b=fa(T,x.qn); if(a.some(i=>i<0)||b.some(j=>j<0))return false;
  const give=a.map(i=>M[i]), get=b.map(j=>T[j]);
  const e0=rosterElo(M), f0=rosterElo(T), seed=x.step*977+(x.a.join("")+"|"+x.b.join("")).length;
  const XM=ntReslot(M,a,get,my,seed), XT=ntReslot(T,b,give,x.t,seed+1);
  [[my,M,XM],[x.t,T,XT]].forEach(([tm,R,Z])=>{ const inj=(sea.talent.inj[tm]||[]).map(e=>({e:e,n:R[e.idx]&&R[e.idx].n}));
    for(let i=0;i<Z.X.length;i++)R[i]=Z.X[i]; R.length=Z.X.length;
    inj.forEach(o=>{ const k=R.findIndex(p=>p&&p.n===o.n); if(k>=0)o.e.idx=k });          // an injury goes with the man
    Z.waived.forEach(p=>{ p.waivedBy=tm }) });
  get.forEach(p=>{ p.tdFrom=x.t }); give.forEach(p=>{ p.tdFrom=my });
  sea.talent.base[my]+=rosterElo(M)-e0; sea.talent.base[x.t]+=rosterElo(T)-f0;
  x.w=[XM.waived.map(p=>p.n),XT.waived.map(p=>p.n)]; x.f=[XM.signed.map(p=>p.n),XT.signed.map(p=>p.n)];
  return true }
function ntDo(d){
  S.promos=S.promos||{}; const k=SEA.step, x=ntRecord(d);
  if(!nbaTdApply(SEA,x))return; (S.promos[k]=S.promos[k]||[]).push({tr:x});
  NT_UI={done:x}; save(); render() }
/* at the season's end, into next season's rosters (the universe's): the men by name, the picks into the ledger */
function nbaTdCarry(u,x){
  const my=x.my||S.myTeam, M=u.roster[my], T=u.roster[x.t];
  (x.pk||[]).forEach(q=>{ u.nbaPk=u.nbaPk||{}; u.nbaPk[ntKey(q.y,q.rd,q.o)]={to:q.to,prot:q.prot||0} });
  if(!M||!T)return;
  const sea={roster:{[my]:M,[x.t]:T},talent:{inj:{},base:{},active:()=>[]}};
  const fa=(R,names)=>names.map(n=>R.findIndex(p=>p&&p.n===n)); const a=fa(M,x.gn), b=fa(T,x.qn); if(a.some(i=>i<0)||b.some(j=>j<0))return;
  const give=a.map(i=>M[i]), get=b.map(j=>T[j]), seed=x.step*977+(x.a.join("")+"|"+x.b.join("")).length;
  [[M,ntReslot(M,a,get,my,seed)],[T,ntReslot(T,b,give,x.t,seed+1)]].forEach(([R,Z])=>{ for(let i=0;i<Z.X.length;i++)R[i]=Z.X[i] });
  get.concat(give).forEach(p=>{ p.yrsHere=0; p.joined=SEA.year }) }
/* the draft reads the ledger: a protected first that lands inside its protection stays home */
LEAGUE.pickOwner=function(u,orig,rd,pos){ const e=u&&u.nbaPk&&u.nbaPk[ntKey(u.year,rd,orig)]; if(!e)return null;
  return rd===1&&e.prot&&pos<=e.prot?orig:e.to };

/* ---- the computer's deadline: its contenders buy from its sellers, the last two weeks (every third day and the day
   itself), a deal or two a time; a veteran for a younger man, a first, or both. Engine code for these seasons: a reload
   makes the same deals ---- */
function ntCpuDay(sea){
  const last=ctDeadline(), left=last-sea.step; if(left<0||left>14||(left%3&&left!==0))return;
  if(sea._ntDay===sea.step)return; sea._ntDay=sea.step;
  const humans=sea.humans||[], clubs=NAMES.filter(t=>humans.indexOf(t)<0&&sea.roster[t]).sort((a,b)=>ntPct(b)-ntPct(a)||(a<b?-1:1));
  const done=(sea.cpuTr||[]).filter(x=>x.nba), used={}; done.forEach(x=>{ if(sea.step-x.step<7){ used[x.my]=1; used[x.t]=1 } });
  const n=clubs.length, buyers=clubs.slice(0,Math.round(n*0.35)), sellers=clubs.slice(n-Math.round(n*0.4));
  const most=left===0?3:1; let made=0;
  const L=ntLedger();
  buyers.forEach(B=>{ if(made>=most||used[B])return; let best=null;
    sellers.forEach(Sl=>{ if(used[Sl]||Sl===B)return; const RB=sea.roster[B], RS=sea.roster[Sl];
      RS.forEach((q,j)=>{ if(!q||q.age<26||j>=2*POS.length)return;                      // a seller moves a veteran in its rotation
        RB.forEach((p,i)=>{ if(!p||p.age>25&&p.k.sal<q.k.sal*0.4)return;
          const fwd=ntDeal(B,Sl,[i],[j],[],[],sea); if(!fwd||!fwd.legal)return;
          // both sides by their own lights: the seller's from fwd, the buyer's from the mirror
          const pk=ntPicksOf(B,L).filter(z=>z.rd===1&&z.y===sea.year+1)[0];
          [[],pk?[pk]:[]].forEach(pa=>{ const s=ntDeal(B,Sl,[i],[j],pa,[],sea), r=s&&s.legal?ntDeal(Sl,B,[j],[i],[],pa,sea):null;
            if(!s||!s.yes||!r||!r.yes)return; const v=s.score+r.score; if(!best||v>best.v)best={v:v,d:s} }) }) }) });
    if(best){ const d=best.d, x={nba:1,t:d.t,my:d.my,a:d.a,b:d.b,gn:d.give.map(p=>p.n),qn:d.get.map(p=>p.n),y:sea.year,d:(LEAGUE.dates||[])[sea.step]||"",step:sea.step,cpu:1,
        pk:d.pa.map(q=>Object.assign({},q,{to:d.t}))};
      if(nbaTdApply(sea,x)){ (sea.cpuTr=sea.cpuTr||[]).push(x); used[d.my]=used[d.t]=1; made++ } } }) }
LEAGUE.trade.on=ntOn;
LEAGUE.trade.cpu=function(sea){ if(!nbaFO())return false; ntCpuDay(sea); return true };

/* ---- the Trades tab ---- */
let NT_UI={};
const ntSg=v=>(v>=0?"+":"")+v.toFixed(1);
function ntLine(d){ return `<span style="color:${d.now>=0?"var(--good,#7fd17f)":"var(--bad,#e88)"}">${ntSg(d.now)} now</span>, <span style="color:var(--muted)">${ntSg(d.fut)} in two years</span>` }
function ntPl(t,p){ const i=SEA.roster[t].indexOf(p);
  return `${plLink(t,p.n)} <span style="color:var(--muted)">${esc(p.p)} ${p.r}, ${p.age}, ${nbaMoney(p.k.sal)}${p.k.yrs>1?` x${p.k.yrs}`:" expiring"}${p.k.opt?(p.k.opt==="P"?", player option":", team option"):""}${p.k.rk?", rookie deal":""}${i>=2*POS.length?", reserve":""}</span>` }
function ntSide(d,mine){ const P=mine?d.give:d.get, Q=mine?d.pa:d.pb, t=mine?d.my:d.t;
  return P.map(p=>ntPl(t,p)).concat(Q.map(q=>esc(ntPickName(q)))).join("; ")||"nothing" }
function ntDealHTML(d,btn){ return `<div class="prow2" style="align-items:center"><div class="pmain">
  <div class="pname">You give: ${ntSide(d,true)}</div><div class="psub">${esc(d.t)} give: ${ntSide(d,false)}</div>
  <div class="psub">Salary ${nbaMoney(d.out)} out, ${nbaMoney(d.inn)} in &middot; your payroll ${nbaMoney(d.payM)} (${esc(NBA_TIERW[nbaTier(d.payM)])}) &middot; your team: ${ntLine(d)}</div>
  ${(d.XM.waived.length||d.XM.signed.length)?`<div class="psub">${d.XM.waived.length?`To make room you'd waive ${d.XM.waived.map(p=>esc(p.n)).join(", ")}. `:""}${d.XM.signed.length?`You'd sign ${nOf(d.XM.signed.length,"player")} to the minimum to fill the roster.`:""}</div>`:""}
  </div>${btn!==false?`<button class="promo" data-ntgo="${ntCode(d)}">Trade</button>`:""}</div>` }
const ntCode=d=>[esc(d.t),d.a.join("."),d.b.join("."),d.pa.map(q=>[q.y,q.rd,esc(q.o),q.prot||0].join("~")).join("."),d.pb.map(q=>[q.y,q.rd,esc(q.o),q.prot||0].join("~")).join(".")].join("|");
function ntDecode(s){ const [t,a,b,pa,pb]=s.split("|"), n=x=>x?x.split(".").map(Number):[], pk=x=>x?x.split(".").map(z=>{ const [y,rd,o,pr]=z.split("~"); return {y:+y,rd:+rd,o:o.replace(/&amp;/g,"&"),prot:+pr} }):[];
  return ntDeal(S.myTeam,t.replace(/&amp;/g,"&"),n(a),n(b),pk(pa),pk(pb)) }
function ntState(){ const T=LEAGUE.trade; if(SEA.phase!=="week")return {open:false,why:"Trades are closed until next season."};
  if(tdDay((LEAGUE.dates||[])[SEA.step]||"")>tdDay(T.by))return {open:false,why:`The trade deadline (${T.by}) has passed.`};
  return {open:true,why:`The trade deadline is ${T.by}.`} }
function ntCapSheet(){ const my=S.myTeam, R=SEA.roster[my], pay=ntPay(R), tier=nbaTier(pay), rp=nbaRepeater(U,my), tax=nbaTaxBill(pay,rp), lim=nbaBudget(U,my), md=nbaMood(U,my);
  const row=(l,v,on)=>`<div style="display:flex;justify-content:space-between;padding:2px 0${on?";font-weight:600":""}"><span>${l}</span><span>${v}</span></div>`;
  return `<div class="card" style="padding:8px 12px;margin:6px 0">${row("Payroll",nbaMoney(pay),1)}${row("Where it sits",esc(NBA_TIERW[tier]))}
    ${row("Cap",nbaMoney(NBA$.cap))}${row("Tax line",nbaMoney(NBA$.tax))}${row("First apron",nbaMoney(NBA$.ap1))}${row("Second apron",nbaMoney(NBA$.ap2))}
    ${row("Your owner will pay up to",nbaMoney(lim)+(md<0?" (he wants out of the tax)":md>0?" (a step up, for last season)":""))}${tax>0?row("Luxury tax bill at this payroll"+(rp?" (repeater)":""),`<span class="dn">${nbaMoney(tax)}</span>`,1):pay<NBA$.floor?row("Short of the salary floor",nbaMoney(NBA$.floor-pay)):""}
    <div class="fnote" style="margin-top:4px">${tier==="room"?"Under the cap, salary you take in fits inside your room.":tier==="cap"||tier==="tax"?"Over the cap: what you take back is matched to what you send (about twice a small contract, a big one plus $9.1M or a quarter more).":tier==="ap1"?"Over the first apron: you can't take back more salary than you send.":"Over the second apron: no more salary back than out, and no adding contracts together to match a bigger one."}</div></div>` }
function ntBuilder(){
  const my=S.myTeam, C=tdClubs(), t=NT_UI.club&&C.indexOf(NT_UI.club)>=0?NT_UI.club:null;
  let h=`<div class="grouphead">Build a trade</div><div class="card" style="padding:8px 12px"><div class="confpick"><select data-ntclub><option value="">Choose a club</option>${C.map(c=>`<option${c===t?" selected":""}>${esc(c)}</option>`).join("")}</select></div>`;
  if(!t)return h+`<div class="fnote">Pick a club, then the players and picks on each side: up to ${NT.MAXP} players a side.</div></div>`;
  const B=NT_UI.b||(NT_UI.b={a:[],b:[],pa:[],pb:[]}), L=ntLedger(), T=SEA.roster[t], M=SEA.roster[my];
  const w=tdWin(t), mood=w>0.7?"contending: they want help now":w<0.4?"out of it: they want young players, picks and room":"in the middle: now and later both count";
  h+=`<div class="fnote" style="margin:6px 0">${esc(t)} are ${esc(mood)}. Payroll ${nbaMoney(ntPay(T))}, ${esc(NBA_TIERW[nbaTier(ntPay(T))])}.${tdRecent(t)?` They've traded with you in the last ${TD_GAP} days: not yet.`:""}</div>`;
  const hurt=(tm,i)=>SEA.talent.active(tm).some(e=>e.idx===i);
  const pRow=(tm,p,i,side,on)=>`<label class="prow2" style="align-items:center;gap:8px;cursor:pointer"><input type="checkbox" data-ntpick="${side}|${i}"${on?" checked":""}${hurt(tm,i)||ntLocked(p)?" disabled":""}><div class="pmain"><div class="pname sm">${ntPl(tm,p)}${hurt(tm,i)?` <span class="outtag">OUT</span>`:ntLocked(p)?` <span class="outtag">Dec 15</span>`:""}</div></div></label>`;
  const kRow=(q,side,on)=>{ const k=ntKey(q.y,q.rd,q.o), pr=on?(B[side].find(z=>ntKey(z.y,z.rd,z.o)===k)||{}).prot||0:q.prot;
    return `<div class="prow2" style="align-items:center;gap:8px"><label style="display:flex;gap:8px;align-items:center;cursor:pointer;flex:1"><input type="checkbox" data-ntpk="${side}|${esc(k)}"${on?" checked":""}><span class="pname sm">${esc(ntPickName(Object.assign({},q,{prot:pr})))}</span><span class="psub" style="margin-left:6px">${q.rd===1?`on today's records ~#${Math.round(ntSlotAt(q))}`:""}</span></label>${on&&side==="pa"&&q.rd===1&&q.o===my&&!q.prot?``:""}${on&&side==="pa"&&q.rd===1&&q.o===my?`<button class="promo" data-ntprot="${esc(k)}">${pr?`Top-${pr}`:"No protection"}</button>`:""}</div>` };
  h+=`<div class="fnote" style="margin-top:8px"><b>You give</b></div>`+M.map((p,i)=>p?pRow(my,p,i,"a",B.a.indexOf(i)>=0):"").join("")+
     `<details style="margin:4px 0"${B.pa.length?" open":""}><summary class="fnote">Your picks</summary>${ntPicksOf(my,L).map(q=>kRow(q,"pa",B.pa.some(z=>ntKey(z.y,z.rd,z.o)===ntKey(q.y,q.rd,q.o)))).join("")}</details>`;
  h+=`<div class="fnote" style="margin-top:8px"><b>${esc(t)} give</b></div>`+T.map((p,j)=>p?pRow(t,p,j,"b",B.b.indexOf(j)>=0):"").join("")+
     `<details style="margin:4px 0"${B.pb.length?" open":""}><summary class="fnote">Their picks</summary>${ntPicksOf(t,L).map(q=>kRow(q,"pb",B.pb.some(z=>ntKey(z.y,z.rd,z.o)===ntKey(q.y,q.rd,q.o)))).join("")}</details>`;
  const d=ntDeal(my,t,B.a,B.b,B.pa,B.pb);
  if(d&&(B.a.length||B.b.length||B.pa.length||B.pb.length)){
    h+=`<div class="grouphead" style="margin-top:8px">The deal</div>`;
    if(!d.legal)h+=`<div class="note">${esc(d.why[0].toUpperCase()+d.why.slice(1))}.</div>`;
    else if(NT_UI.asked===ntCode(d)){
      if(tdRecent(t))h+=`<div class="note">Not yet: they've traded with you in the last ${TD_GAP} days.</div>`;
      else if(d.yes)h+=`<div class="note"><b>${esc(t)} would do it.</b></div>`+ntDealHTML(d);
      else { const c=ntCounter(d); h+=`<div class="note"><b>No:</b> ${esc(d.why)}.${c?" But they'd do this:":""}</div>`+(c?ntDealHTML(c):"") } }
    else h+=ntDealHTML(d,false)+`<button class="promo" data-ntask="${ntCode(d)}">Ask ${esc(t)}</button>`;
  }
  return h+`</div>` }
function ntView(){
  const my=S.myTeam, st=ntState(), R=SEA.roster[my];
  let h=`<div class="note">${esc(st.why)} Any positions, up to ${NT.MAXP} players a side, and picks in the next ${NT.YRS} drafts (a first can be protected). Salaries must match by where each payroll lands. A club weighs now against later by where it stands, and what the deal does to its tax bill.</div>`;
  if(NT_UI.done){ const x=NT_UI.done; h+=`<div class="card" style="padding:10px 12px;margin:8px 0"><b>Done.</b> ${x.gn.map(esc).join(", ")||"Picks"}${x.pk.filter(q=>q.to===x.t).length?` and ${x.pk.filter(q=>q.to===x.t).map(ntPickName).join(", ")}`:""} to ${esc(x.t)}; ${x.qn.map(esc).join(", ")||"picks"}${x.pk.filter(q=>q.to===my).length?` and ${x.pk.filter(q=>q.to===my).map(ntPickName).join(", ")}`:""} to you.${x.w&&x.w[0].length?` Waived: ${x.w[0].map(esc).join(", ")}.`:""}${x.f&&x.f[0].length?` Signed to fill the roster: ${x.f[0].map(esc).join(", ")}.`:""}</div>` }
  h+=ntCapSheet();
  h+=ntNewsHTML();
  const done=ntSeasonTrades().filter(x=>!x.cpu&&(x.my===my||x.t===my));
  if(done.length)h+=`<div class="grouphead">Your trades this season</div><div class="card" style="padding:6px 12px">${done.map(x=>`<div style="margin:4px 0">${esc(x.d)}: ${x.gn.map(esc).join(", ")||"picks"} to ${esc(x.t)} for ${x.qn.map(esc).join(", ")||"picks"}${x.pk.length?` (picks: ${x.pk.map(q=>esc(ntPickName(q))+" to "+esc(q.to)).join("; ")})`:""}</div>`).join("")}</div>`;
  if(!st.open)return h;
  h+=ntBuilder();
  // shop one of yours
  h+=`<div class="grouphead">Shop a player</div>`;
  if(NT_UI.shop!=null&&R[NT_UI.shop]){ const i=NT_UI.shop, O=ntShop(i);
    h+=`<div class="card" style="padding:8px 12px"><div style="margin-bottom:6px">Offers for ${ntPl(my,R[i])} <button class="promo" data-ntshop="-1">Back</button></div>`+
      (O.length?O.map(d=>ntDealHTML(d)).join(""):`<div class="fnote">No club would give you something you'd want for him today.</div>`)+`</div>` }
  else h+=`<div class="card" style="padding:6px 12px"><details><summary class="fnote">Pick a man to see what clubs would give for him</summary>${R.map((p,i)=>p&&!SEA.talent.active(my).some(e=>e.idx===i)&&!ntLocked(p)?`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${ntPl(my,p)}</div></div><button class="promo" data-ntshop="${i}">Shop</button></div>`:"").join("")}</details></div>`;
  // ask what they'd want
  if(NT_UI.club&&NT_UI.askFor!=null){ const t=NT_UI.club, T=SEA.roster[t], j=NT_UI.askFor;
    if(T[j]){ const O=tdRecent(t)?[]:ntAskFor(t,j);
      h+=`<div class="grouphead">What would ${esc(t)} want for ${esc(T[j].n)}?</div><div class="card" style="padding:8px 12px"><button class="promo" data-ntaskfor="-1">Back</button>`+
        (O.length?O.map(d=>ntDealHTML(d)).join(""):`<div class="fnote">Nothing of yours would get him${tdWin(t)>0.7?": they're contending and he helps them win now":""}.</div>`)+`</div>` } }
  else if(NT_UI.club){ const t=NT_UI.club, T=SEA.roster[t];
    h+=`<div class="grouphead">What would ${esc(t)} want?</div><div class="card" style="padding:6px 12px"><details><summary class="fnote">Pick one of theirs</summary>${T.map((q,j)=>q&&!SEA.talent.active(t).some(e=>e.idx===j)?`<div class="prow2" style="align-items:center"><div class="pmain"><div class="pname">${ntPl(t,q)}</div></div><button class="promo" data-ntaskfor="${j}">Ask</button></div>`:"").join("")}</details></div>` }
  return h }
function ntNewsHTML(){ const L=((SEA&&SEA.cpuTr)||[]).filter(x=>x.nba&&x.cpu); if(!L.length)return "";
  return `<div class="grouphead">Around the league: deadline deals</div><div class="card" style="padding:6px 12px">`+L.map(x=>`<div style="margin:4px 0">${esc(x.d)}: ${esc(x.my)} get ${x.qn.map(n=>plLink(x.my,n)).join(", ")} from ${esc(x.t)} for ${x.gn.map(n=>plLink(x.t,n)).join(", ")}${x.pk.length?` and ${x.pk.map(q=>esc(ntPickName(q))).join(", ")}`:""}</div>`).join("")+`</div>` }
function ntBind(){
  const B=()=>NT_UI.b||(NT_UI.b={a:[],b:[],pa:[],pb:[]});
  document.querySelectorAll("[data-ntclub]").forEach(s=>s.onchange=()=>{ NT_UI={club:s.value||null}; render() });
  document.querySelectorAll("[data-ntpick]").forEach(c=>c.onchange=()=>{ const [side,i]=c.dataset.ntpick.split("|"), L=B()[side], k=+i; const at=L.indexOf(k);
    if(at>=0)L.splice(at,1); else if(L.length<NT.MAXP)L.push(k); NT_UI.asked=null; render() });
  document.querySelectorAll("[data-ntpk]").forEach(c=>c.onchange=()=>{ const [side,key]=c.dataset.ntpk.split("|").length>2?[c.dataset.ntpk.split("|")[0],c.dataset.ntpk.split("|").slice(1).join("|")]:c.dataset.ntpk.split("|");
    const k=key.replace(/&amp;/g,"&"), L=B()[side], at=L.findIndex(z=>ntKey(z.y,z.rd,z.o)===k);
    if(at>=0)L.splice(at,1); else { const [y,rd,...o]=k.split("|"), on=ntLedger()[k]; L.push({y:+y,rd:+rd,o:o.join("|"),prot:on?on.prot||0:0}) } NT_UI.asked=null; render() });
  document.querySelectorAll("[data-ntprot]").forEach(b=>b.onclick=()=>{ const k=b.dataset.ntprot.replace(/&amp;/g,"&"), q=B().pa.find(z=>ntKey(z.y,z.rd,z.o)===k); if(!q)return;
    const P=[0,4,10,14]; q.prot=P[(P.indexOf(q.prot||0)+1)%P.length]; NT_UI.asked=null; render() });
  document.querySelectorAll("[data-ntno]").forEach(b=>b.onclick=()=>{ NT_UI={no:b.dataset.ntno}; render() });
  document.querySelectorAll("[data-ntask]").forEach(b=>b.onclick=()=>{ NT_UI.asked=b.dataset.ntask; render() });
  document.querySelectorAll("[data-ntshop]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.ntshop; NT_UI={club:NT_UI.club,shop:i<0?null:i}; render() });
  document.querySelectorAll("[data-ntaskfor]").forEach(b=>b.onclick=()=>{ const i=+b.dataset.ntaskfor; NT_UI={club:NT_UI.club,askFor:i<0?null:i}; render() });
  document.querySelectorAll("[data-ntgo]").forEach(b=>b.onclick=()=>{ const d=ntDecode(b.dataset.ntgo);
    if(!d||!d.yes||!ntState().open||tdRecent(d.t))return; tapTwice(b,"Confirm",()=>ntDo(d)) });
}
LEAGUE.trade.view=ntView; LEAGUE.trade.bind=ntBind;
/* an offer that comes to you near the deadline: the club keenest on one of your men, its best offer for you */
LEAGUE.trade.offerCard=function(){
  const st=ntState(); if(!st.open)return ""; const last=tdLastOpen(), left=last-SEA.step; if(left<0||left>=21||left%3)return "";
  const k=SEA.year+"|"+SEA.step; if(NT_UI.no===k)return "";
  const my=S.myTeam, R=SEA.roster[my]; let pick=null;
  const key="ntOff|"+k; if(!NT_UI[key]){ R.map((p,i)=>i).filter(i=>R[i]&&i<2*POS.length&&!SEA.talent.active(my).some(e=>e.idx===i)&&!ntLocked(R[i])).sort((a,b)=>R[b].r-R[a].r).slice(0,4).forEach(i=>{ const p=R[i]; ntShop(i).slice(0,1).forEach(d=>{ if(!pick||d.score>pick.score)pick=d }) }); NT_UI[key]=pick?ntCode(pick):"-" }
  const d=NT_UI[key]!=="-"?ntDecode(NT_UI[key]):null; if(!d||!d.yes)return "";
  return `<div class="card" style="padding:10px 12px;margin:8px 0"><div class="olab">A trade offer &middot; ${esc(st.why)}</div>
    <div style="margin:6px 0">${esc(d.t)} call about ${esc(d.give.map(p=>p.n).join(", "))}.</div>${ntDealHTML(d)}
    <button class="promo" data-ntno="${k}">Not now</button></div>` };
LEAGUE.trade.news=function(){ const L=((SEA&&SEA.cpuTr)||[]).filter(x=>x.nba&&x.cpu); if(!L.length||SEA.phase!=="week")return ""; const k=SEA.step-L[L.length-1].step; if(k<0||k>7)return ""; return ntNewsHTML() };
