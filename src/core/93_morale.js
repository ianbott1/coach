/* ============ the people (round 111): who they are, how they feel, and what they ask of you ============
   Ian: the human layer that makes Football Manager and OOTP addictive. Every player in the league has a few durable
   traits (ambition, loyalty, temperament, professionalism, leadership), fixed by his name so they never need a draw
   and an old save's players have them too. Each season every player carries a morale (0-100), moved after every game
   by what's true of him: the result, whether he played, whether he expects to, his form, his contract, a losing run,
   and what you did (benching him, starting the kid over him, a promise kept or broken). Morale is the season's own,
   like a player's stats: kept on the Season's roster copy, rebuilt by the replay, banked into the universe at the
   season's end (moC, tr) so the next season starts from where this one left him.

   What it does, modestly and measured (test/morale.js): a club's starters' morale and its dressing room's chemistry
   move its chance in a level game by up to MO_WP (2 points), and a buzzing crowd adds a little at home (FAN_WP). Over
   the summer a happy, professional player develops a touch faster (moraleDev, in each league's aging). Every team in
   the league plays by the same rules; only yours gets asked.

   What it asks: one decision at a time, never more than about one a week of games (TALK_GAP): a player wants more
   minutes, a veteran you benched, a rookie who wants a mentor, a rift after a losing run, a trade request, contract
   talk, a leader to name captain, and the press after a big game. Each has two or three answers whose effects depend on
   the man (his traits are shown: that's the evidence), and are remembered (trust, a promise, the captaincy). Leave it
   and your assistant answers, which changes nothing: a simmed season is never worse for it.

   Determinism: nothing here draws from the season's dice. Every choice is keyed by its own hash (strHash), so the games'
   random numbers are exactly as they were; only the strength edge moves results, and only on engine PEOPLE_V seasons.
   Your answers are kept in S.talks ("year:step" -> answer) and replayed by rebuild at the same point. */
const PEOPLE_ON=!(typeof process!=="undefined"&&process.env&&process.env.PEOPLE_ON==="0");
const PEOPLE_V=25;                       // the engine on which morale plays (20_engine ENGINE_NOW)
const MO_WP=+((typeof process!=="undefined"&&process.env&&process.env.MO_WP)||0.02);   // a level game's chance, at the extremes of morale
const FAN_WP=0.008;                      // a crowd at the extremes, at home
const MO_MID=68.5, MO_SPAN=25;             // a starting unit's morale: where it's neutral, and how far is "all the way"
function pplOn(){ return PEOPLE_ON&&typeof ENGINE_V!=="undefined"&&ENGINE_V>=PEOPLE_V }
function pplCollege(){ return !!(LEAGUE.classes&&LEAGUE.classes.length) }

/* ---- traits: 1-20 each, a triangle around 10, from the name (no dice) ---- */
const TRAIT_KEYS=[["am","ambition"],["lo","loyalty"],["te","temperament"],["pr","professionalism"],["le","leadership"]];
const _TRAITS=new Map();
function traitsOf(p){
  if(!p||!p.n)return {am:10,lo:10,te:10,pr:10,le:10};
  let t=_TRAITS.get(p.n); if(t)return t;
  const h=k=>strHash("psy|"+k+"|"+p.n), u=x=>(x%10007)/10007;
  const v=k=>{ const a=h(k), b=h(k+"2"); return Math.max(1,Math.min(20,1+Math.round((u(a)+u(b))/2*19))) };
  t={am:v("am"),lo:v("lo"),te:v("te"),pr:v("pr"),le:v("le")};
  // leaders are rarer than the rest: the top of the scale is earned
  if(t.le>14&&(h("lx")%3))t.le-=3;
  _TRAITS.set(p.n,t); return t }
function ageOf(p){ return pplCollege()?18+(p.c||0):(p.age||p.c||27) }
function isVet(p){ return pplCollege()?(p.c||0)>=3:ageOf(p)>=30 }
function isYoung(p){ return pplCollege()?(p.c||0)===0:ageOf(p)<=22 }
/* his personality in a few words, the strongest traits first (the evidence a conversation is answered on) */
function traitWords(p){
  const t=traitsOf(p), out=[];
  const W={am:["driven","content with his lot"],lo:["loyal to the club","a mercenary streak"],te:["unflappable","a short fuse"],
    pr:["a model professional","cuts corners"],le:["a leader in the room","keeps to himself"]};
  TRAIT_KEYS.map(([k])=>[k,t[k]]).sort((a,b)=>Math.abs(b[1]-10.5)-Math.abs(a[1]-10.5)).forEach(([k,v])=>{
    if(v>=14)out.push(W[k][0]); else if(v<=6)out.push(W[k][1]) });
  return out.slice(0,3) }
function moWord(m){ return m>=82?"delighted":m>=68?"happy":m>=52?"settled":m>=38?"uneasy":m>=24?"unhappy":"furious" }
function moTone(m){ return m>=68?"ok":m<38?"no":"" }
function moBase(p){ const t=traitsOf(p); return 60+(t.pr-10)*0.45+(t.te-10)*0.3+(p.tr||0)*2.5 }

/* ---- the season's state (sea.ppl): not saved, rebuilt by the replay ---- */
function gamesPer(sea){ try{ return sea.sched.length*2/NAMES.length }catch(e){ return 17 } }
function pplInit(sea,u){
  if(!pplOn()||!sea.roster)return;
  const G=gamesPer(sea), P={fan:{},chem:{},run:{},cap:{},roles:{},duel:{},prom:{},asked:{},news:[],q:[],pend:null,last:-99,said:null,n:0,
    f:Math.max(0.2,Math.min(1.3,Math.sqrt(17/Math.max(1,G)))), gap:LEAGUE.daily?7:2, G:G};
  Object.defineProperty(sea,"ppl",{value:P,writable:true,enumerable:false});
  NAMES.forEach(t=>{ P.fan[t]=u&&u.fans&&u.fans[t]!=null?55+(u.fans[t]-55)*0.6:55;
    P.cap[t]=u&&u.caps&&u.caps[t]||null; P.chem[t]=60; P.run[t]={n:0,won:null};
    const R=sea.roster[t]||[];
    R.forEach(p=>{ if(!p)return; const b=moBase(p); p.mo=Math.round(b+(p.moC!=null?(p.moC-b)*0.4:0)) });
    // a captain still on the roster steadies the room
    if(P.cap[t]&&!R.some(p=>p&&p.n===P.cap[t]))P.cap[t]=null;
    if(P.cap[t]){ const c=R.find(p=>p&&p.n===P.cap[t]); P.chem[t]+=Math.max(0,traitsOf(c).le-10)*0.5 }
    P.roles[t]=R.slice(0,POS.length).map(p=>p?p.n:null) });
  pplMid(sea);
}
/* a club's morale on the field: its starting unit, weighted by position, plus the room's chemistry */
function teamMorale(sea,t){
  const P=sea.ppl, R=sea.roster&&sea.roster[t]; if(!P||!R)return MO_MID;
  const hurt=new Set(sea.talent.active(t).map(e=>e.idx)); let s=0,W=0;
  POS.forEach((Q,i)=>{ const p=hurt.has(i)?R[BK(i)]:R[i]; if(!p||p.mo==null)return; const w=Q.w||1; s+=w*p.mo; W+=w });
  return (W?s/W:MO_MID)+((P.chem[t]||60)-60)*0.35 }
/* the strength it's worth (elo points): both sides, every game, on engine PEOPLE_V */
function moraleEdge(sea,t,home){
  if(!pplOn()||!sea||!sea.ppl||!sea.roster)return 0;
  // in elo, from a chance: the league's own curve at a level game (wpScale: its logistic scale; dp/dd = ln10/4s)
  const k=(typeof wpScale==="function"?wpScale("balanced"):400)*4/Math.LN10;
  let e=Math.max(-1,Math.min(1,(teamMorale(sea,t)-(sea.ppl.mid||MO_MID))/MO_SPAN))*MO_WP*k;
  if(home)e+=Math.max(-1,Math.min(1,((sea.ppl.fan[t]||55)-55)/40))*FAN_WP*k;
  return e }
/* the summer: a happy, professional player grows a touch faster; a miserable one stalls (each league's aging adds it) */
function moraleDev(p){
  if(!PEOPLE_ON||!p||p.moC==null)return 0;
  const t=traitsOf(p);
  return Math.max(-0.8,Math.min(0.8,(p.moC-60)/40*0.5+(t.pr-10)/10*0.3+(p.mentor?0.4:0))) }

/* after every game (Season._resolve): queued, and read at the step's end */
function pplNote(sea,r){
  if(!sea.ppl||!r||!r.home)return;
  const sh=r.shift||0, ew=r.winner?(sea.elo[r.winner]-sh):0, el=r.loser?(sea.elo[r.loser]+sh):0;
  sea.ppl.q.push({h:r.home,a:r.away,w:r.winner||null,d:!!r.draw,m:r.margin||0,cup:!!r.cup,po:sea.phase!=="week",up:!!(r.winner&&ew<el-60)});
  // two stars meeting: your best player against theirs, game by game (a rivalry between players)
  const my=sea.userTeam; if(!my||(r.home!==my&&r.away!==my))return;
  const opp=r.home===my?r.away:r.home, a=starOf(sea,my), b=starOf(sea,opp); if(!a||!b)return;
  const k=a.n+"|"+b.n, D=sea.ppl.duel[k]=sea.ppl.duel[k]||{a:a.n,b:b.n,tb:opp,pa:a.p,pb:b.p,g:0,w:0,l:0,xa:0,xb:0};
  D.g++; if(r.winner===my)D.w++; else if(r.winner)D.l++; D.tb=opp;
  const pr=(p)=>p.last&&p.last.week===sea.step&&typeof statProd==="function"?statProd(p.last.pos,Object.assign({g:1},p.last.line)):0;
  D.xa+=pr(a); D.xb+=pr(b) }
function starOf(sea,t){ const R=sea.roster[t]; if(!R)return null; const hurt=new Set(sea.talent.active(t).map(e=>e.idx));
  let best=null; R.slice(0,POS.length).forEach((p,i)=>{ if(p&&!hurt.has(i)&&(!best||p.r>best.r))best=p }); return best }

/* the end of a step: every club that played */
function pplStep(sea,phase,at){
  if(at===undefined)at=sea.step;
  const P=sea.ppl; if(!P||!sea.roster){ if(P)P.q=[]; return }
  const by={}; P.q.forEach(g=>{ [g.h,g.a].forEach(t=>{ (by[t]=by[t]||[]).push(g) }) }); P.q=[];
  const f=P.f, RN=n=>n+(P.G>50?2:P.G>20?1:0);
  Object.keys(by).forEach(t=>{
    const R=sea.roster[t]; if(!R)return;
    const hurt=new Set(sea.talent.active(t).map(e=>e.idx)), run=P.run[t];
    by[t].forEach(g=>{
      const won=g.w===t, lost=!!g.w&&!won, big=(g.po?1.5:1)*(g.up?1.4:1);
      if(!g.cup||g.po){ if(g.d){ run.n=0; run.won=null } else if(run.won===won)run.n++; else { run.won=won; run.n=1 } }
      // the fans: results, a big night bigger, and back toward the middle
      const fan=P.fan[t]; P.fan[t]=Math.max(5,Math.min(98,fan+(won?2.4:lost?-2.4:0)*big*f+(55-fan)*0.035*f));
      P.chem[t]=Math.max(20,Math.min(95,P.chem[t]+(won?0.5:lost?-0.5:0)*f+(60-P.chem[t])*0.03*f));
      R.forEach((p,i)=>{ if(!p)return; const T=traitsOf(p), tf=1.3-(T.te-1)/19*0.6, st=i<POS.length?p:R[i-POS.length];
        let d=(won?2:lost?-2:0)*big*tf;
        const active=i<POS.length?!hurt.has(i):hurt.has(i-POS.length);
        if(i<POS.length)d+=active?0.6:-0.3;
        else if(active)d+=0.8;
        else if(st&&wantsToStart(p,st))d-=0.3+T.am/20;
        else d-=0.05;
        const fm=typeof formOf==="function"&&p.st2?formOf(p,p.p||POS[i%POS.length].p):null; if(fm==="hot")d+=0.8; else if(fm==="cold")d-=0.6;
        if(!pplCollege()&&p.k&&p.k.yrs<=1&&T.am>=13&&T.lo<=9)d-=0.5;
        if(lost&&run.n>=RN(3)&&T.te<=7)d-=0.8;
        p.mo=Math.max(3,Math.min(97,p.mo+d*f+(moBase(p)-p.mo)*0.07*f)) }) });
    // a leader steps up: a losing run, and a man the room listens to calls them together (once a run)
    if(run.won===false&&run.n===RN(3)&&!g0(by[t]).po){ const L=R.filter(p=>p&&traitsOf(p).le>=15&&p.mo>=45).sort((a,b)=>traitsOf(b).le-traitsOf(a).le)[0];
      if(L){ P.chem[t]=Math.min(95,P.chem[t]+5); R.forEach(p=>{ if(p)p.mo=Math.min(97,p.mo+2) });
        if(t===sea.userTeam)P.news.push({s:at,k:"lead",n:L.n,cap:P.cap[t]===L.n}) } }
  });
  // what the coaches did since the last step: a starter now on the bench (by choice: an injured man keeps his slot)
  NAMES.forEach(t=>{ const R=sea.roster[t]; if(!R)return; const was=P.roles[t]||[], now=R.slice(0,POS.length).map(p=>p?p.n:null);
    was.forEach((n,i)=>{ if(!n||now.indexOf(n)>=0)return; const j=R.findIndex(p=>p&&p.n===n); if(j<POS.length)return;   // gone, or still starting
      const p=R[j], T=traitsOf(p), took=R[j-POS.length], kid=took&&ageOf(took)+4<=ageOf(p);
      p.mo=Math.max(3,p.mo-(10+T.am*0.4)*(1.3-(T.te-1)/19*0.6)*(kid?1.4:1)); p.bench=sea.step;
      if(took){ took.mo=Math.min(97,took.mo+5) }
      if(t===sea.userTeam)P.news.push({s:at,k:"bench",n:p.n,by:took?took.n:null,kid:!!kid}) });
    P.roles[t]=now });
  // promises: kept when he's starting, broken when the time runs out
  const my=sea.userTeam;
  Object.keys(P.prom).forEach(n=>{ const pr=P.prom[n], R=sea.roster[pr.t]||[], i=R.findIndex(p=>p&&p.n===n);
    if(i<0){ delete P.prom[n]; return }
    const p=R[i];
    if(i<POS.length){ p.mo=Math.min(97,p.mo+8); p.tr=Math.min(3,(p.tr||0)+1); delete P.prom[n]; if(pr.t===my)P.news.push({s:at,k:"kept",n:n}) }
    else if(sea.step>=pr.by){ p.mo=Math.max(3,p.mo-16); p.tr=Math.max(-3,(p.tr||0)-2); P.chem[pr.t]=Math.max(20,P.chem[pr.t]-3); delete P.prom[n];
      if(pr.t===my)P.news.push({s:at,k:"broke",n:n}) } });
  if(my&&!(sea.humans&&sea.humans.length>1)&&by[my])talkNext(sea,by[my],phase);
  pplMid(sea);
}
/* the league's own middle: a club's morale counts against it, so the edge is about being happier than the rest */
function pplMid(sea){ let s=0,n=0; NAMES.forEach(t=>{ if(sea.roster[t]){ s+=teamMorale(sea,t); n++ } }); sea.ppl.mid=n?s/n:MO_MID }
function g0(L){ return L[L.length-1]||{} }
function wantsToStart(p,st){ const T=traitsOf(p); return p.r>=st.r-3||(T.am>=14&&p.r>=st.r-6) }

/* ---- conversations: one at a time, at most one a TALK_GAP ---- */
const TALK_KINDS={
  press:  {h:"The press want you"},
  trade:  {h:"wants out"},
  bench:  {h:"isn't taking the bench well"},
  minutes:{h:"wants more minutes"},
  rift:   {h:"A rift in the room"},
  contract:{h:"wants to talk contract"},
  mentor: {h:"wants a mentor"},
  role:   {h:"wants a bigger role"},
  captain:{h:"A leader in the room"}
};
function talkGate(sea,k,n,pct){ return (strHash(sea.year+"|"+sea.step+"|"+k+"|"+(n||""))%100)<pct }
function talkNext(sea,games,phase){
  const P=sea.ppl, my=sea.userTeam, R=sea.roster[my]; if(!R||P.pend&&!P.pend.done)return;
  if(sea.step-P.last<P.gap)return;
  const reg=phase==="week", run=P.run[my], RN=n=>n+(P.G>50?2:P.G>20?1:0), g=g0(games), won=g.w===my, lost=!!g.w&&!won;
  const once=(k,n)=>!P.asked[k+"|"+(n||"")], mk=(k,o)=>{ P.asked[k+"|"+(o.n||"")]=1; P.last=sea.step; P.n++; P.pend=Object.assign({id:sea.step,y:sea.year,k:k,done:null},o) };
  const opp=g.h===my?g.a:g.h, riv=LEAGUE.rivals&&LEAGUE.rivals.name?!!LEAGUE.rivals.name(my,opp):false;
  // the press: after a play-off game, a run of three (or six), a rivalry, sometimes an upset. The players' own questions
  // come first in the season; in the play-offs the press does
  const streak=run.n===RN(3)||run.n===RN(6);
  const press=g.w&&(g.po||streak&&!g.cup||riv&&talkGate(sea,"pressr",opp,25)||g.up&&talkGate(sea,"pressu",opp,20));
  const doPress=()=>mk("press",{won:won,lost:lost,opp:opp,po:!!g.po,up:!!g.up,run:streak?run.n:0,riv:riv,m:g.m});
  if(press&&!reg){ doPress(); return }
  if(!reg)return;
  const hurt=new Set(sea.talent.active(my).map(e=>e.idx)), live=R.map((p,i)=>({p:p,i:i})).filter(x=>x.p&&!hurt.has(x.i));
  // a trade request (college: thinking about the portal): miserable, and not the kind to stay out of loyalty
  const tr=live.filter(x=>x.p.mo<25&&(traitsOf(x.p).am>=12||traitsOf(x.p).lo<=8)&&once("trade",x.p.n)).sort((a,b)=>b.p.r-a.p.r)[0];
  if(tr){ mk("trade",{n:tr.p.n}); return }
  // a veteran you benched
  const bn=live.filter(x=>x.i>=POS.length&&x.p.bench!=null&&sea.step-x.p.bench<=P.gap+1&&x.p.mo<50&&isVet(x.p)&&once("bench",x.p.n))[0];
  if(bn){ mk("bench",{n:bn.p.n,st:R[bn.i-POS.length]?R[bn.i-POS.length].n:null}); return }
  // a backup who thinks he should be starting
  const mn=live.filter(x=>x.i>=POS.length&&R[x.i-POS.length]&&wantsToStart(x.p,R[x.i-POS.length])&&x.p.mo<46&&once("minutes",x.p.n)).sort((a,b)=>a.p.mo-b.p.mo)[0];
  if(mn&&talkGate(sea,"minutes",mn.p.n,70)){ mk("minutes",{n:mn.p.n,st:R[mn.i-POS.length].n,slot:mn.i-POS.length}); return }
  // a starter who wants more of the team run through him: driven, unhappy, and the club losing more than it wins
  const W=sea.rec&&sea.rec[my], losing=W&&W[1]>W[0];
  const rl=live.filter(x=>x.i<POS.length&&x.p.mo<48&&traitsOf(x.p).am>=13&&once("role",x.p.n)).sort((a,b)=>a.p.mo-b.p.mo)[0];
  if(rl&&(losing||rl.p.mo<40)&&talkGate(sea,"role",rl.p.n,60)){ mk("role",{n:rl.p.n}); return }
  // a rift after a losing run: the loudest man and the shortest fuse
  if(lost&&run.n>=RN(3)&&P.chem[my]<58&&once("rift","")){ const S1=R.filter(Boolean).sort((a,b)=>(b.r+traitsOf(b).am)-(a.r+traitsOf(a).am))[0];
    const S2=R.filter(p=>p&&p!==S1).sort((a,b)=>traitsOf(a).te-traitsOf(b).te)[0];
    if(S1&&S2){ mk("rift",{n:S1.n,n2:S2.n}); return } }
  if(press){ doPress(); return }
  // contract talk: a leading player in his last year, happy enough to want to stay
  if(!pplCollege()){ const top=R.slice(0,POS.length).filter(Boolean).sort((a,b)=>b.r-a.r).slice(0,3);
    const ct=top.filter(p=>p.k&&p.k.yrs<=1&&p.mo>=55&&traitsOf(p).am>=11&&once("contract",p.n))[0];
    if(ct&&talkGate(sea,"contract",ct.n,40)){ mk("contract",{n:ct.n}); return } }
  // a rookie who wants a veteran's guidance
  const rk=live.filter(x=>isYoung(x.p)&&(x.p.pot||0)-x.p.r>=8&&x.p.mo>=40&&once("mentor",x.p.n)).sort((a,b)=>b.p.pot-a.p.pot)[0];
  const vet=R.filter(p=>p&&isVet(p)).sort((a,b)=>traitsOf(b).le-traitsOf(a).le)[0];
  if(rk&&vet&&(P.mentors||0)<2&&talkGate(sea,"mentor",rk.p.n,25)){ P.mentors=(P.mentors||0)+1; mk("mentor",{n:rk.p.n,n2:vet.n}); return }
  // a captain: a room with nobody leading it, and a man it listens to
  if(!P.cap[my]&&once("captain","")){ const L=R.filter(p=>p&&traitsOf(p).le>=14&&p.mo>=55).sort((a,b)=>traitsOf(b).le-traitsOf(a).le||b.r-a.r)[0];
    if(L&&talkGate(sea,"captain",L.n,45)){ mk("captain",{n:L.n}); return } }
}
/* the answers each kind offers; def is your assistant's (it changes nothing) */
function talkOpts(T){
  const O={
    press:T.won?[["praise","Praise the players"],["challenge","Demand more"],["deflect","Keep it short"]]
                :[["protect","Take the blame"],["challenge","Call them out"],["deflect","Keep it short"]],
    trade:[["promise","Promise him a bigger role"],["refuse","He's going nowhere"],["listen","Say you'll listen to offers"]],
    bench:[["explain","Explain the decision"],["challenge","Tell him to win it back"],["mentor","Ask him to lead from the bench"]],
    minutes:[["start","Start him next game"],["earn","Tell him to earn it"],["promise","Promise him his chance"]],
    rift:[["star","Back your star"],["meeting","Clear the air as a team"],["captain","Leave it to the senior players"]],
    contract:[["promise","Promise talks in the "+(typeof OFFW==="function"?OFFW():"summer")],["focus","Ask him to focus on the season"]],
    mentor:[["pair","Pair him with a veteran"],["staff","Extra sessions with the staff"]],
    captain:[["name","Name him captain"],["wait","Not yet"]],
    role:[["feature","Run more through him"],["buyin","Tell him to buy in"]]
  };
  return O[T.k]||[] }
const TALK_DEF={role:"assist",press:"deflect",trade:"assist",bench:"assist",minutes:"assist",rift:"captain",contract:"assist",mentor:"assist",captain:"wait"};
function talkFind(sea,n){ const R=sea.roster[sea.userTeam]||[]; return R.find(p=>p&&p.n===n)||null }
/* apply an answer: what changes, and a line saying how it landed. Deterministic from the men and the moment. */
function applyTalk(sea,T,a){
  const P=sea.ppl, my=sea.userTeam, R=sea.roster[my]||[], p=T.n?talkFind(sea,T.n):null, q=T.n2?talkFind(sea,T.n2):null;
  const t=p?traitsOf(p):null, add=(x,v)=>{ if(x)x.mo=Math.max(3,Math.min(97,x.mo+v)) }, all=v=>R.forEach(x=>add(x,v)),
    chem=v=>{ P.chem[my]=Math.max(20,Math.min(95,P.chem[my]+v)) }, fan=v=>{ P.fan[my]=Math.max(5,Math.min(98,P.fan[my]+v)) },
    trust=(x,v)=>{ if(x)x.tr=Math.max(-3,Math.min(3,(x.tr||0)+v)) };
  let out="", tone="";
  const assist=a==="assist";
  if(T.k==="press"){
    const starters=R.slice(0,POS.length).filter(Boolean), avg=k=>starters.reduce((s,x)=>s+traitsOf(x)[k],0)/Math.max(1,starters.length);
    if(a==="praise"){ starters.forEach(x=>add(x,2+(traitsOf(x).am>=13?1:0))); fan(T.won?2:-2); out=T.won?"The players liked hearing it. So did the fans.":"Praise after that? The fans didn't buy it."; tone=T.won?"ok":"no" }
    else if(a==="protect"){ all(3); chem(2); fan(-1); out="You took it on yourself. The room noticed; a few fans wanted someone else's head."; tone="ok" }
    else if(a==="challenge"){ starters.forEach(x=>{ const y=traitsOf(x); add(x,y.pr>=12?2:y.te<=7?-4:-1) }); chem(-1); fan(T.lost?3:1);
      out=avg("pr")>=11?"Your professionals took it as it was meant. The fans loved it.":"It stung. Not everyone in there took it as a challenge."; tone=avg("pr")>=11?"ok":"no" }
    else { out="Nothing to see. The story moves on."; tone="" }
  }else if(assist){ out="Your assistant had a quiet word. Nothing changes, for better or worse."; tone="" }
  else if(T.k==="trade"){
    if(a==="promise"){ add(p,12); P.prom[p.n]={t:my,by:sea.step+P.gap*2}; out=`${p.n} will hold you to it. If he isn't starting soon, it gets worse.`; tone="ok" }
    else if(a==="refuse"){ if(t.te>=12){ add(p,-2); out=`${p.n} took it like a pro. He isn't happy, but he'll play.`; tone="" } else { add(p,-10); chem(-4); trust(p,-1); out=`${p.n} took it badly, and the room heard about it.`; tone="no" } }
    else { add(p,8); chem(-3); fan(-2); out=`${p.n} is calmer. His teammates have noticed he's halfway out the door.`; tone="" }
  }else if(T.k==="bench"){
    if(a==="explain"){ const v=t.lo>=12?7:t.lo<=7?1:4; add(p,v); if(v>=4)trust(p,1); out=v>=4?`${p.n} didn't like it, but he respects you for saying it to his face.`:`${p.n} heard you out. He doesn't agree.`; tone=v>=4?"ok":"" }
    else if(a==="challenge"){ if(t.te>=12||t.pr>=14){ add(p,5); out=`${p.n} is going to make you pick him again. Good.`; tone="ok" } else { add(p,-6); chem(-3); out=`${p.n} heard it as a slight. It's in the room now.`; tone="no" } }
    else { if(t.le>=13){ add(p,4); chem(5); out=`${p.n} is leading the young ones. The room is better for it.`; tone="ok" } else { add(p,-4); out=`${p.n} doesn't see himself as a coach yet. He wants to play.`; tone="no" } }
  }else if(T.k==="minutes"){
    if(a==="start"){ add(p,8); trust(p,1); out=`${p.n} starts next game. ${T.st?T.st+" knows what that means for him.":""}`; tone="ok" }
    else if(a==="earn"){ if(t.pr>=12){ add(p,4); out=`${p.n} went straight back to work. He'll push hard for the spot.`; tone="ok" } else { add(p,-7); trust(p,-1); out=`${p.n} heard "no", and he's sulking.`; tone="no" } }
    else { add(p,7); P.prom[p.n]={t:my,by:sea.step+P.gap*2}; out=`${p.n} is waiting on that chance now. Don't make him wait too long.`; tone="" }
  }else if(T.k==="rift"){
    if(a==="star"){ add(p,6); add(q,-10); chem(-3); out=`${p.n} has your backing. ${q?q.n:"The other side"} feels hung out to dry.`; tone="no" }
    else if(a==="meeting"){ const L=R.some(x=>x&&traitsOf(x).le>=14); chem(L?7:2); all(L?2:-1); out=L?"It got loud, then it got better. The senior players carried it.":"It didn't clear the air much. Nobody in there leads the room."; tone=L?"ok":"" }
    else { out="You let the senior players sort it out."; tone="" }
  }else if(T.k==="contract"){
    if(a==="promise"){ add(p,6); trust(p,1); P.asked["promised|"+p.n]=1; out=`${p.n} is happy to wait for the ${typeof OFFW==="function"?OFFW():"summer"}. He'll remember if the call never comes.`; tone="ok" }
    else { if(t.pr>=12){ add(p,1); out=`${p.n} understands. The season first.`; tone="" } else { add(p,-5); out=`${p.n} took that as a no.`; tone="no" } }
  }else if(T.k==="mentor"){
    if(a==="pair"){ add(p,6); p.mentor=1; if(q){ const v=traitsOf(q); add(q,v.le>=12?3:v.am>=14?-3:0) } out=`${p.n} is with ${q?q.n:"a veteran"} now.${q&&traitsOf(q).am>=14&&traitsOf(q).le<12?" The veteran would rather be worrying about his own game.":""}`; tone="ok" }
    else { add(p,3); out=`${p.n} gets the extra sessions. It's not quite what he asked for.`; tone="" }
  }else if(T.k==="role"){
    if(a==="feature"){ add(p,8); R.forEach(x=>{ if(x&&x!==p&&traitsOf(x).am>=13)add(x,-2) }); chem(-1); out=`${p.n} has the ball more. A couple of other ambitious men have noticed.`; tone="ok" }
    else { if(t.pr>=12||t.lo>=14){ add(p,3); chem(1); out=`${p.n} bought in. The team comes first, he says, and seems to mean it.`; tone="ok" } else { add(p,-6); trust(p,-1); out=`${p.n} heard it as a lecture.`; tone="no" } }
  }else if(T.k==="captain"){
    if(a==="name"){ const prev=P.cap[my]?talkFind(sea,P.cap[my]):null; if(prev&&prev!==p)add(prev,-8); P.cap[my]=p.n; add(p,6); chem(4+Math.max(0,t.le-14)); out=`${p.n} is your captain.`; tone="ok" }
    else { out=`${p.n} keeps leading without the armband.`; tone="" }
  }
  T.done=a; P.said={id:T.id,st:sea.step,k:T.k,n:T.n,a:a,l:out,tone:tone};
  return out }
/* your club's next game starts: a question still open is answered (yours from the log, else your assistant's) */
function pplResolve(sea){
  const P=sea.ppl; if(!P||!P.pend||P.pend.done)return;
  const T=P.pend, a=(sea.talkLog&&sea.talkLog[T.y+":"+T.id])||TALK_DEF[T.k]||"assist";
  applyTalk(sea,T,a) }
/* yours, at the click */
function answerTalk(a){
  const T=SEA&&SEA.ppl&&SEA.ppl.pend; if(!T||T.done)return;
  if(!talkOpts(T).some(o=>o[0]===a))return;
  S.talks=S.talks||{}; S.talks[T.y+":"+T.id]=a; SEA.talkLog=S.talks;
  if(T.k==="minutes"&&a==="start"&&T.slot!=null){ const R=SEA.roster[S.myTeam]; if(R&&R[BK(T.slot)]&&R[BK(T.slot)].n===T.n&&typeof promote==="function"){ applyTalk(SEA,T,a); promote(T.slot); return } }
  applyTalk(SEA,T,a); save(); render() }

/* ---- on screen ---- */
function talkWho(n){ const R=SEA.roster[S.myTeam]||[], i=R.findIndex(p=>p&&p.n===n); return i<0?null:{p:R[i],i:i,pos:R[i].p||POS[i%POS.length].p} }
function traitLine(p){ const w=traitWords(p); return w.length?w.join(", "):"nothing out of the ordinary" }
/* what's being asked, in words: the man, his situation, his character (the evidence; never the answer) */
function talkText(T){
  const A=T.n?talkWho(T.n):null, B=T.n2?talkWho(T.n2):null, p=A&&A.p, nm=x=>esc(x||"");
  const who=A?`${nm(T.n)} (${esc(A.pos)}, ${p.r})`:"", ch=p?` He's ${esc(traitLine(p))}.`:"", college=pplCollege();
  const res=T.won?"win":T.lost?(LEAGUE.draws?"defeat":"loss"):"draw";
  switch(T.k){
    case "press": return {h:T.po?"The press, after a play-off game":T.up?(T.won?"The press want the upset story":"The press smell a crisis"):T.run?`The press, after ${T.run} straight ${T.won?"wins":"defeats"}`:`The press, after the ${esc(T.opp)} game`,
      b:`Microphones after the ${res} against ${esc(T.opp)}. What you say reaches the dressing room and the stands.`};
    case "trade": return {h:college?`${nm(T.n)} is thinking about transferring`:`${nm(T.n)} wants out`,
      b:`${who}, and ${moWord(p.mo)}. He wants a ${college?"fresh start somewhere else":"trade"}.${ch}`};
    case "bench": return {h:`${nm(T.n)} isn't taking the bench well`,
      b:`You started ${nm(T.st)} over him. ${who}, ${college?"a "+esc(classTag(p.c)||"senior"):ageOf(p)+" years old"}, and ${moWord(p.mo)}.${ch}`};
    case "minutes": { const st=SEA.roster[S.myTeam][T.slot];
      return {h:`${nm(T.n)} wants to start`,b:`${who} behind ${nm(T.st)}${st?` (${st.r})`:""}, and ${moWord(p.mo)}.${ch}`} }
    case "rift": return {h:`A rift: ${nm(T.n)} and ${nm(T.n2)}`,
      b:`The losing has got personal. ${nm(T.n)} is ${esc(traitLine(p))}; ${nm(T.n2)} is ${esc(B?traitLine(B.p):"unsettled")}. Chemistry: ${moWord(SEA.ppl.chem[S.myTeam])}.`};
    case "contract": return {h:`${nm(T.n)} wants to talk about a new deal`,
      b:`${who}, in the last year of his contract and ${moWord(p.mo)}.${ch}`};
    case "mentor": return {h:`${nm(T.n)} wants a mentor`,
      b:`${who}, ${college?"a freshman":ageOf(p)+" years old"}, ceiling ${p.pot}. He'd like time with ${nm(T.n2)}${B?`, who is ${esc(traitLine(B.p))}`:""}.`};
    case "role": return {h:`${nm(T.n)} wants a bigger role`,
      b:`${who}, ${moWord(p.mo)}, and he thinks the team would win more with more through him.${ch}`};
    case "captain": return {h:`Make ${nm(T.n)} captain?`,
      b:`The room listens to him. ${who}, ${moWord(p.mo)}.${ch}`};
  }
  return {h:"",b:""} }
/* one of the staff on it: each voice leans its own way (the bold answer, the kind one, the careful one), never the answer */
const TALK_STAFF={
  bears:{role:"Give him the ball! Give everyone the ball!",press:"Tell them we're coming for everyone. Then leave.",trade:"Nobody leaves the bears. NOBODY.",bench:"Tell him to win it back. Bears earn things.",
    minutes:"Start him! Chaos is a ladder.",rift:"Back the star. Stars win games.",contract:"Make him sweat. Then pay him.",mentor:"Throw him in. That's mentoring.",captain:"Armband! Now! Big ceremony!"},
  pearl:{role:"He just wants to help! Let him!",press:"Say something nice about them. They worked so hard!",trade:"Maybe he just needs someone to listen?",bench:"Tell him why. He deserves to hear it from you.",
    minutes:"He's waited so patiently. Promise him something!",rift:"Get everyone in one room. Hugs, maybe?",contract:"Tell him we love him! Talks in the summer!",mentor:"Everyone needs a friend in a new place!",captain:"He'd be SO good at it."},
  capy:{role:"Some men are better for being asked to share. Others, I fear, simply resent it.",press:"I would say as little as possible. It has rarely failed anyone.",trade:"I'd want to know his character before promising anything. Promises, I find, come due.",
    bench:"It depends rather on the man, doesn't it. Some take a challenge; some take offence.",minutes:"A promise is only as good as the date it's kept by.",
    rift:"Whether a meeting helps depends, I suspect, on who's in the room to lead it.",contract:"A professional will wait. Others, in my experience, hear 'no'.",
    mentor:"Some veterans enjoy it. Others would rather mind their own game.",captain:"An armband changes a man, sometimes. Not always for the better."}
};
function talkStaff(T){
  const order=["capy","pearl","bears"], who=order[strHash(T.y+"|"+T.id+"|"+T.k)%3], line=TALK_STAFF[who]&&TALK_STAFF[who][T.k];
  if(!line||typeof STAFF==="undefined"||!STAFF[who])return "";
  return `<div class="say tight"><span class="facewrap ${who}">${staffFaceOf(who)}</span><div class="saybody"><span class="sayname">${esc(staffNameOf(who))}</span><span class="saytext">${esc(staffLineOf(who,line))}</span></div></div>` }
/* the card in "Needs a decision": the question, or how your answer landed */
function talkHTML(my){
  if(!SEA||!SEA.ppl||my!==S.myTeam||isHotSeat())return "";
  const P=SEA.ppl, T=P.pend, said=P.said;
  if(T&&!T.done){ const x=talkText(T); if(!x.h)return "";
    return `<div class="attn talk"><div class="attnmain"><div class="fname">${x.h}</div><div class="cdesc">${x.b}</div></div>
      <div class="attnbtns">${talkOpts(T).map(([a,l])=>`<button class="attnbtn" data-talk="${a}">${esc(l)}</button>`).join("")}</div></div>
      <div class="fnote talknote">Play on and your assistant has a quiet word instead.</div>`+talkStaff(T) }
  if(said&&said.st===SEA.step)return `<div class="note talkdone ${said.tone||""}">${esc(said.l)}</div>`;
  return "" }
/* the team card's line: the dressing room, the fans, the captain */
function roomLineHTML(my){
  if(!SEA||!SEA.ppl||!SEA.roster||!SEA.roster[my])return "";
  const P=SEA.ppl, m=teamMorale(SEA,my), f=P.fan[my], fw=f>=80?"buzzing":f>=64?"happy":f>=46?"content":f>=30?"restless":"angry";
  const tag=(v,t)=>`<span class="${v>=64?"ok":v<38?"no":""}" style="color:${v>=64?"var(--good,#7bd88f)":v<38?"var(--bad,#ff7a7a)":"inherit"}">${t}</span>`;
  return `<div class="roomline fnote" title="How your players feel (their morale, and how they get on) and how your supporters feel. A happy room plays a little better; a buzzing crowd helps a little at home.">Dressing room: ${tag(m,moWord(m))} &middot; Fans: ${tag(f,fw)}${P.cap[my]?` &middot; Captain: ${esc(P.cap[my])}`:""}</div>` }
/* the player's page: who he is, and how he is */
function personHTML(p,team){
  if(!SEA||!SEA.ppl||!p)return "";
  const w=traitWords(p), tr=p.tr||0, cap=SEA.ppl.cap[team]===p.n;
  return `<div class="fnote" style="margin:-4px 0 10px">${cap?"<b>Captain</b> &middot; ":""}${p.mo!=null?`${esc(moWord(p.mo).replace(/^./,c=>c.toUpperCase()))}`:""}${w.length?` &middot; ${esc(w.join(", "))}`:""}${team===S.myTeam&&tr?` &middot; ${tr>0?"trusts you":"doesn't trust you"}`:""}</div>` }
/* the week's news: what happened in your room */
function peopleNews(my){
  if(!SEA||!SEA.ppl)return [];
  const out=[];
  SEA.ppl.news.filter(x=>x.s===SEA.step-1).forEach(x=>{
    if(x.k==="lead")out.push({p:70,k:"room",tone:"gold",h:`${x.n} calls a players' meeting`,b:x.cap?"The captain, doing what captains do.":"Nobody asked him to. The room listened."});
    if(x.k==="bench")out.push({p:66,k:"room",tone:"muted",h:`${x.n} to the bench`,b:x.kid?`${x.by} gets the start, and he's younger. ${x.n} has noticed.`:`${x.by||"Someone else"} starts. ${x.n} isn't pleased.`});
    if(x.k==="kept")out.push({p:62,k:"room",tone:"gold",h:`${x.n} gets his chance`,b:"You said you would. He hasn't forgotten."});
    if(x.k==="broke")out.push({p:72,k:"room",tone:"flag",h:`${x.n} is still waiting`,b:"The chance you promised hasn't come. He's stopped expecting it."});
  });
  return out }

/* ---- the staff room: characters or real names (round 111) ----
   Ian's cast (Two Bears, Pearl, the Apprehensive Capybara) or a real-sounding staff with jobs, by a setting (S.staffReal):
   realistic by default in the pro leagues, the characters in college. The same three voices and the same advice; the
   realistic staff don't bark or ask for cake. */
const STAFF_ROLES={
  football:{bears:"Assistant head coach",pearl:"Quality control coach",capy:"Senior assistant"},
  basketball:{bears:"Lead assistant",pearl:"Video coordinator",capy:"Assistant coach"},
  hockey:{bears:"Associate coach",pearl:"Video coach",capy:"Assistant coach"},
  soccer:{bears:"Assistant manager",pearl:"Performance analyst",capy:"First-team coach"},
  baseball:{bears:"Third-base coach",pearl:"Analytics coordinator",capy:"Bench coach"}
};
function staffReal(){ try{ if(S&&S.staffReal!=null)return !!S.staffReal }catch(e){} return !pplCollege() }
function staffPerson(who){
  const team=(typeof S!=="undefined"&&S&&S.myTeam)||"", h=strHash("staff|"+who+"|"+team);
  const F=["Mike","Dave","Chris","Brian","Kevin","Paula","Tom","Matt","Dana","Ryan","Marcus","Andre","Luis","Sean","Pat","Greg","Jen","Wes","Nate","Erin","Rob","Tess","Gary","Lena"];
  const L=["Kessler","Reyes","Abbott","Doyle","Whitfield","Okafor","Brennan","Castillo","Lindqvist","Marsh","Pruitt","Haddad","Sutton","Varga","Delaney","Moreau","Tanaka","Ruiz","Fenwick","Osei"];
  const sp=(typeof SPORT!=="undefined"&&SPORT.id)||"football";
  return {n:F[h%F.length]+" "+L[(h>>>8)%L.length],role:(STAFF_ROLES[sp]||STAFF_ROLES.football)[who]||"Assistant"} }
function staffNameOf(who){ if(!staffReal())return STAFF[who]?STAFF[who].name:who; const x=staffPerson(who); return x.n+", "+x.role.toLowerCase() }
function staffFaceOf(who){
  if(!staffReal())return staffFace(who);
  const x=staffPerson(who), ini=x.n.split(" ").map(w=>w[0]).join(""), col={bears:"#C9A173",pearl:"#E8C494",capy:"#9BA7B4"}[who]||"#9BA7B4";
  return `<svg viewBox="0 0 40 40" class="face" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="${col}"/><text x="20" y="25" text-anchor="middle" font-size="13" font-family="system-ui,sans-serif" font-weight="700" fill="#14171F">${esc(ini)}</text></svg>` }
const STAFF_WHIMSY=/\bbears?\b|mascot|woof|squirrel|treat bag|capybara|chocolate cake|cookies and cream|tail going|spin in a circle|is it dinner|can we go outside|\bBALL\b|someone's at the door/i;
const STAFF_PLAIN={bears:["Be aggressive here. Make them deal with us.","I'd go for it. Fortune favours the side that takes the risk.","Push. Sitting back is how you lose this.","Attack. That's my whole view."],
  pearl:["I'd go with what we've just seen.","The last few minutes say a lot. I'd trust them.","I'd back the players here.","Let's go with what's in front of us."],
  capy:["I'd be careful here.","I'd keep it steady.","I'd rather not take the risk.","Nothing rash, if it were up to me."]};
/* a line said by the realistic staff: the barks and the cake go; a line that is nothing but character becomes plain advice */
function staffLineOf(who,line){
  if(!staffReal()||typeof line!=="string")return line;
  let t=line.replace(/^(Woof! |SQUIRREL\. |Ooh, ooh, ooh! |Was that the treat bag\? \.\.\. Anyway\. |Someone's at the door! \.\.\. No\. False alarm\. )/,"")
    .replace(/ (Woof!|\(Tail going\. Very hard\.\)|Can we go outside after\?|Also, is it dinner\? It smells like dinner\.|I'm going to spin in a circle about this\.|Ball\. BALL\. Sorry — the actual ball\. Carry on\.)$/,"");
  if(STAFF_WHIMSY.test(t)){ const L=STAFF_PLAIN[who]||STAFF_PLAIN.capy; t=L[strHash(line)%L.length] }
  return t }
