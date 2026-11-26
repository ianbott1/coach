/* ============ reach and replay (review round 3: share) ============
   What a player can hand a friend, with no server: everything here is worked out from the game itself.
   - A league code: a short line that starts the same league on anyone's device (the world seed, your club, the
     engine, and a check that this copy of the game makes the same league from that seed).
   - The weekly challenge: a seed fixed by the calendar week, a club and a goal the week picks, and a result code
     that carries your calls, not your results. Checking it plays the season again here, from the same seed, with
     the same calls: the result is believed only if it comes out the same. Every game you played live is played
     again from its own dice and your answers; nothing in the code is taken on trust but your choices.
   - A save as a file with a version and a checksum (core 99 downloadBackup), and older files still open.
   - The season in review: the record, the season's moments and its awards, as text to copy or a picture (canvas).
   Nothing here moves a simulated result: a game plays as it did, whether or not it is shared. */
const SHARE_ON=true;
let SHARE_QUIET=false;   // a challenge being checked: nothing saved, nothing drawn
let SHARE_RUN=null;      // its claims while it replays (core 99 rebuild calls shReplayStep)

/* ---- hashing and the text the codes are written in ---- */
// cyrb53: a 53-bit hash, plenty for a check that catches typos and edits
function shHash(str,seed){
  let h1=0xdeadbeef^(seed|0), h2=0x41c6ce57^(seed|0);
  for(let i=0;i<str.length;i++){ const ch=str.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677) }
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return 4294967296*(2097151&h2)+(h1>>>0);
}
const SH_ALPHA="0123456789ABCDEFGHJKMNPQRSTVWXYZ";   // Crockford's base 32: no I, L, O or U to misread
function shB32(n,len){ let s=""; n=Math.floor(Math.abs(n)); for(let i=0;i<len;i++){ s=SH_ALPHA[n%32]+s; n=Math.floor(n/32) } return s }
function shSum(str,len){ return shB32(shHash(String(str),0x5eed),len||6) }
// a typed code read back: the letters people confuse taken as the ones meant
function shNorm(s){ return String(s||"").toUpperCase().replace(/\s+/g,"").replace(/O/g,"0").replace(/[IL]/g,"1").replace(/U/g,"V") }
const SH_B64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
// text -> LZW (core 15_store) -> URL-safe base 64: about two thirds of the JSON's length for a season of calls
function shPack(str){ const z=lzwPack(str).slice(SAVE_TAG.length); let acc=0, n=0, out="";
  for(let i=0;i<z.length;i++){ acc=(acc<<15)|(z.charCodeAt(i)-32); n+=15; while(n>=6){ n-=6; out+=SH_B64[(acc>>>n)&63] } acc&=(1<<n)-1 }
  if(n>0)out+=SH_B64[(acc<<(6-n))&63]; return out }
function shUnpack(b){ let acc=0, n=0, out=""; for(let i=0;i<b.length;i++){ const v=SH_B64.indexOf(b[i]); if(v<0)throw new Error("not a code");
    acc=(acc<<6)|v; n+=6; if(n>=15){ n-=15; out+=String.fromCharCode(((acc>>>n)&0x7fff)+32); acc&=(1<<n)-1 } }
  return lzwUnpack(SAVE_TAG+out) }
function shLeagueId(){ return String(LEAGUE.id).toUpperCase() }

/* ---- a sandbox: the game's own globals, put back however the run ends ---- */
function shSandbox(fn){
  const K={S:S,U:U,SEA:SEA,live:live,plan:plan,flash:flash,view:view,reveal:reveal,lockNew:lockNew,run:SHARE_RUN,q:SHARE_QUIET};
  SHARE_QUIET=true; live=null;
  try{ return fn() }
  finally{ S=K.S; U=K.U; SEA=K.SEA; live=K.live; plan=K.plan; flash=K.flash; view=K.view; reveal=K.reveal; lockNew=K.lockNew;
    SHARE_RUN=K.run; SHARE_QUIET=K.q; SCOUT_RANK={key:null}; if(typeof TD_CLASS!=="undefined")TD_CLASS=null }
}
// a new career from a seed, as newDynasty makes it, its season built and nothing played
function shFresh(team,seed,name){ freshCareer(team,seed,name||""); rebuild(); }

/* ============ the league code ============
   NBA-3H7K2-04-26-QX7M: the game, the world seed and your club (base 32), the engine it was made on, and a check
   made from all of that and the league this copy of the game builds from the seed (its rosters and programs). The
   check catches a typo, and a code from a version of the game whose league from that seed is another one. */
function shWorldPrint(seed){ const u=newUniverse(seed>>>0), R=u.roster||{};
  return shSum(JSON.stringify(NAMES.map(t=>[Math.round((u.program||{})[t]||0),(R[t]||[]).map(p=>p?[p.n,p.p,p.r]:0)])),4) }
function leagueCode(seed,team){ const i=NAMES.indexOf(team); if(i<0)return "";
  const s=shB32(seed>>>0,7).replace(/^0+(?=.)/,""), t=shB32(i,2), e=String(ENGINE_NOW);
  return [shLeagueId(),s,t,e,shSum([shLeagueId(),s,t,e,shWorldPrint(seed)].join("|"),4)].join("-") }
function shFromB32(s){ let n=0; for(const c of s){ const v=SH_ALPHA.indexOf(c); if(v<0)return NaN; n=n*32+v } return n }
/* {seed, team, eng} or {why} */
function readLeagueCode(text){
  const raw=String(text||"").toUpperCase().replace(/\s+/g,"").split("-").filter(Boolean), parts=raw.map((x,i)=>i?shNorm(x):x);
  if(parts.length!==5)return {why:"A league code has five parts, like "+shLeagueId()+"-3H7K2-04-"+ENGINE_NOW+"-QX7M."};
  const [g,s,t,e,c]=parts;
  if(g!==shLeagueId()){ const other={CFB:"College Football Coach",NFL:"Pro Football Coach",NCAAB:"College Basketball Coach",NBA:"Pro Basketball Coach",NHL:"Pro Hockey Coach",EPL:"Soccer Coach",MLB:"Pro Baseball Coach"}[g];
    return {why:other?`That's a code for ${other}. Open it there.`:"That isn't a league code for this game."} }
  const seed=shFromB32(s), i=shFromB32(t);
  if(!isFinite(seed)||!isFinite(i)||!NAMES[i]||seed<=0||seed>0xffffffff)return {why:"That code has a mistake in it. Check it against the one you were sent."};
  if(c!==shSum([g,s,t,e,shWorldPrint(seed)].join("|"),4))
    return {why:"That code doesn't check out: a typo, or a code from another version of the game, whose league from that seed isn't this one."};
  return {seed:seed, team:NAMES[i], eng:+e, older:+e!==ENGINE_NOW};
}
function careerCode(){ try{ return S&&S.seed&&S.coaches&&S.coaches[0]?leagueCode(S.seed,S.coaches[0].myTeam||S.myTeam):"" }catch(e){ return "" } }

/* ============ the weekly challenge ============ */
function chWeek(d){ d=d||new Date(); const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())), day=t.getUTCDay()||7;
  t.setUTCDate(t.getUTCDate()+4-day); const y=t.getUTCFullYear(), w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);
  return y+"-W"+String(w).padStart(2,"0") }
const CH_TITLE={cfb:"the national title",nfl:"the Super Bowl",ncaab:"the national title",nba:"the NBA title",nhl:"the Stanley Cup",epl:"the Premier League",mlb:"the World Series"};
const CH_POST={cfb:"Reach a bowl game or the playoff",nfl:"Make the playoffs",ncaab:"Make the NCAA tournament",nba:"Make the playoffs (the play-in alone doesn't count)",
  nhl:"Make the playoffs",epl:"Finish in the top half of the Premier League",mlb:"Make the postseason"};
// where in the league the week's club comes from (0 the best, 1 the worst), by goal: a title for a good side that isn't
// the favourite, the postseason for a side picked to miss it, the forecast beaten with one of the worst
const CH_BANDS={pro:{title:[0.12,0.3],post:[0.55,0.75],wins:[0.85,1]},epl:{title:[0.1,0.3],post:[0.55,0.75],wins:[0.85,1]},
  cfb:{title:[0.03,0.1],post:[0.55,0.7],wins:[0.8,0.95]},ncaab:{title:[0.01,0.04],post:[0.2,0.3],wins:[0.75,0.95]}};
const CH_KINDS=["wins","post","title"];
function chPool(){ const P=NAMES.filter(t=>LEAGUE.id!=="epl"||CONF[t]==="PL").sort((a,b)=>PRE_RANK[a]-PRE_RANK[b]); return P }
function chSpec(id){
  const m=/^(\d{4})-W(\d\d)$/.exec(String(id||"")); if(!m)return null;
  const h=shHash(LEAGUE.id+"|"+id+"|weekly"), seed=100000+(h%900000), kind=CH_KINDS[(+m[1]*53+ +m[2])%3];
  const B=(CH_BANDS[LEAGUE.id]||CH_BANDS.pro)[kind], P=chPool(), N=P.length;
  const lo=Math.min(N-1,Math.floor(B[0]*N)), hi=Math.max(lo,Math.min(N-1,Math.ceil(B[1]*N)-1));
  const team=P[lo+Math.floor(h/900000)%(hi-lo+1)];
  return {id:id, seed:seed, kind:kind, team:team, pick:P.indexOf(team)+1, of:N};
}
/* the target for the forecast goal: the club's expected wins from the season's own chances, as the board's are (core
   expectedWins), plus one and a quarter of the season's own spread; worked out on a new league, so the same for all */
function chTarget(spec){
  if(spec.kind!=="wins")return null;
  return shSandbox(()=>{ shFresh(spec.team,spec.seed,"");
    const W=LEAGUE.weeks; let x=0, v=0;
    SEA.sched.forEach(g=>{ if(g.week>=W||g.cup||(g.home!==spec.team&&g.away!==spec.team))return; const opp=g.home===spec.team?g.away:g.home;
      let q; try{ q=planFree(()=>winProb(spec.team,opp,g.home===spec.team,!!g.neutral)) }catch(e){ return } if(isFinite(q)){ x+=q; v+=q*(1-q) } });
    return {xw:Math.round(x*10)/10, w:Math.ceil(x+1.25*Math.sqrt(v))} });
}
function chGoalText(spec,tgt){
  const ord=n=>ordinal(n);
  if(spec.kind==="title")return `Win ${CH_TITLE[LEAGUE.id]||"the title"} with ${spec.team}, picked ${ord(spec.pick)} of ${spec.of}.`;
  if(spec.kind==="post")return `${CH_POST[LEAGUE.id]||"Make the playoffs"} with ${spec.team}, picked ${ord(spec.pick)} of ${spec.of}.`;
  return `Win ${tgt?tgt.w:"more"} games or more with ${spec.team}, picked ${ord(spec.pick)} of ${spec.of}. The forecast says ${tgt?tgt.xw:"fewer"}.`;
}
// (the season's end only: soccer's seasonResult freezes the table the first time it's asked, so a mid-season look
// would settle the final positions there and then)
function chResult(my){ const r=(SEA.regRec||SEA.rec)[my]||[0,0];
  return {w:r[0],l:r[1],d:(SEA.drw&&SEA.drw[my])||0,o:(SEA.otl&&SEA.otl[my])||0,res:SEA.phase==="done"?SEA.seasonResult(my)||"":""} }
function chMet(spec,tgt,my,R){
  if(spec.kind==="title")return SEA.champion===my;
  if(spec.kind==="wins")return !!tgt&&R.w>=tgt.w;
  if(LEAGUE.id==="cfb")return !!(SEA.myBowl&&SEA.myBowl(my))||(SEA.field||[]).indexOf(my)>=0;
  if(LEAGUE.id==="ncaab")return (SEA.field||[]).indexOf(my)>=0;
  if(LEAGUE.id==="epl")return CONF[my]==="PL"&&LEAGUE.position(my)>0&&LEAGUE.position(my)<=10;
  return !!(SEA.seeds&&SEA.seeds[my]);
}
function chRecText(R){ return LEAGUE.draws?`${R.w}-${R.d}-${R.l}`:LEAGUE.tracksOT?`${R.w}-${R.l-R.o}-${R.o}`:`${R.w}-${R.l}` }

/* ---- starting one ---- */
function chStart(slotN,name,id){
  const spec=chSpec(id||chWeek()); if(!spec)return false;
  const tgt=chTarget(spec);
  slot=slotN; saveRev=null; staleTab=false;
  S={myTeam:null,uStart:null,seasonSeed:0,steps:0,history:[],seed:0,title:false,introDone:true,setup:{name:name||"",seed:spec.seed,ready:true}};
  newDynasty(spec.team,spec.seed,name||"");
  S.challenge={id:spec.id,kind:spec.kind,team:spec.team,tgt:tgt,eng:ENGINE_NOW,year:SEA.year};
  save(); render(); return true;
}
function chOpen(){ const C=S&&S.challenge; return !!(C&&!isHotSeat()&&SEA&&!(S.history||[]).length&&SEA.year===C.year&&S.myTeam===C.team) }

/* ---- the result code: your choices, your live games' scores, and the season's end, checked by replaying ---- */
// what you chose: the only things a replay takes from the code (core 99 rebuild reads each)
const CH_INPUTS=["plans","calls","planMid","promos","fires","chLog","talks","featured","deploy","xiLog","xiFm"];
function chMake(){
  const C=S.challenge; if(!C||SEA.phase!=="done")return null;
  const my=S.myTeam, inp=chPackInputs(S,SEA.year);
  const lv={}; Object.keys(S.played||{}).forEach(k=>{ const L=(S.played[k]||[]).filter(p=>p.team===my).map(p=>[p.mine,p.theirs,p.cup?1:0]); if(L.length)lv[k]=L });
  const R=chResult(my);
  const P={v:1,g:LEAGUE.id,id:C.id,e:ENGINE_NOW,n:S.career.name,y:SEA.year,st:S.steps,in:inp,lv:lv,r:R};
  const body=shPack(JSON.stringify(P));
  return `CC1.${LEAGUE.id}.${C.id}.${body}.${shSum(body+"|"+C.id+"|"+LEAGUE.id,8)}`;
}
/* the choices, short: the season's calls as numbers into a list of the answers given, and only the plans that weren't
   the balanced one (a plan not kept is balanced: core 99 planFor). A baseball season played live: 3.8k -> under 2k. */
function chPackInputs(X,year){
  const pre=year+":", inp={};
  CH_INPUTS.forEach(k=>{ const v=X[k]; if(v===undefined||v===null)return;
    if(k==="calls"){ const D=[], K=[]; Object.keys(v).filter(x=>x.indexOf(pre)===0&&v[x]&&v[x].length).sort((a,b)=>parseFloat(a.slice(pre.length))-parseFloat(b.slice(pre.length))||(a<b?-1:1))
        .forEach(x=>{ K.push([x.slice(pre.length)].concat(v[x].map(a=>{ let i=D.indexOf(a); if(i<0){ i=D.length; D.push(a) } return i }))) });
      inp.calls={d:D,k:K}; return }
    if(k==="planMid"){ const o={}; Object.keys(v).forEach(x=>{ if(x.indexOf(pre)===0&&v[x]&&v[x].length)o[x.slice(pre.length)]=v[x] }); inp.planMid=o; return }
    if(k==="plans"){ const o={}; Object.keys(v).forEach(x=>{ const b=String(x).split("#")[0], base=v[b]||"balanced";
        if(x.indexOf("#")>=0?v[x]!==base:v[x]!=="balanced")o[x]=v[x] }); inp.plans=o; return }
    inp[k]=v });
  return JSON.parse(JSON.stringify(inp));
}
function chUnpackInputs(inp,year){
  const out={}, pre=year+":"; inp=JSON.parse(JSON.stringify(inp||{}));
  Object.keys(inp).forEach(k=>{ if(CH_INPUTS.indexOf(k)<0)return; const v=inp[k];
    if(k==="calls"&&v&&Array.isArray(v.k)){ const o={}; v.k.forEach(r=>{ if(Array.isArray(r)&&r.length)o[pre+r[0]]=r.slice(1).map(i=>v.d[i]) }); out.calls=o; return }
    if(k==="planMid"&&v){ const o={}; Object.keys(v).forEach(x=>{ o[pre+x]=v[x] }); out.planMid=o; return }
    out[k]=v });
  return out;
}
/* the season played again, your live games too, from the code's choices: {ok, why, name, team, R, met, spec, tgt} */
function chCheck(code){
  const txt=String(code||"").replace(/\s+/g,""), m=/^CC1\.([a-z]+)\.(\d{4}-W\d\d)\.([A-Za-z0-9_-]+)\.([0-9A-Z]{8})$/.exec(txt);
  if(!m)return {ok:false,why:"That isn't a challenge result code. It starts CC1. and is one long line: copy all of it."};
  if(m[1]!==LEAGUE.id)return {ok:false,why:"That result is from another of the Coach games. Check it there."};
  if(shSum(m[3]+"|"+m[2]+"|"+m[1],8)!==m[4])return {ok:false,why:"That code has been changed or cut short: its check doesn't match."};
  let P; try{ P=JSON.parse(shUnpack(m[3])) }catch(e){ return {ok:false,why:"That code is damaged: it doesn't read back."} }
  if(!P||P.v!==1||P.id!==m[2]||P.g!==m[1]||!P.r||!P.in)return {ok:false,why:"That code is damaged: it doesn't read back."};
  const spec=chSpec(P.id), out={ok:false,name:String(P.n||"A coach").slice(0,40),team:spec.team,spec:spec,claim:P.r};
  if(P.e!==ENGINE_NOW){ out.why=`That result was played on engine ${P.e}; this copy of the game plays engine ${ENGINE_NOW}, so it can't be replayed here. Check it on the same version.`; return out }
  const tgt=out.tgt=chTarget(spec);
  return shSandbox(()=>{
    freshCareer(spec.team,spec.seed,P.n||"");
    Object.assign(S,chUnpackInputs(P.in,P.y||SEA.year));
    S.played={}; S.steps=Math.max(0,Math.min(2000,P.st|0));
    SHARE_RUN={claims:P.lv||{},done:0,bad:null};
    try{ rebuild() }catch(e){ out.why="That season doesn't replay: "+String(e&&e.message||e); return out }
    const run=SHARE_RUN, my=spec.team, want=Object.values(P.lv||{}).reduce((a,L)=>a+L.length,0);
    if(run.bad){ out.why=run.bad; return out }
    if(run.done!==want){ out.why=`It claims ${want} games played live; ${run.done} of them came round in the replay.`; return out }
    if(SEA.phase!=="done"){ out.why="That season isn't finished: the code stops before the end of it."; return out }
    const R=out.R=chResult(my), C=P.r;
    if(R.w!==C.w||R.l!==C.l||R.d!==(C.d||0)||R.o!==(C.o||0)||R.res!==C.res){
      out.why=`It claims ${chRecText(Object.assign({d:0,o:0},C))}${C.res?", "+C.res.toLowerCase():""}; replayed from its own calls it comes out ${chRecText(R)}${R.res?", "+R.res.toLowerCase():""}.`; return out }
    out.met=chMet(spec,tgt,my,R); out.ok=true; return out });
}
/* one step of the replay (called from rebuild): your games that day played again live, from the day's dice and your
   answers, as startLive and liveTick play them, and each score held to the code's */
function shReplayStep(i){
  const R=SHARE_RUN, pk=callKey(i,SEA.year), C=R&&R.claims[pk]; if(!C||R.bad)return;
  const my=S.myTeam, half=!!SEA.half, todo=C.filter(c=>!LEAGUE.splitCup||!!c[2]===half); if(!todo.length)return;
  if(SEA.phase==="week"&&!SEA.half&&typeof bsV26==="function"&&bsV26()&&typeof cpuDeadline==="function")cpuDeadline(SEA);   // as startLive
  const mineNow=SEA.phase==="week"&&SEA.gamesFor?SEA.gamesFor(my,i):null, pl=planFor(i,SEA.half);
  const n0=((S.played[pk]||[]).filter(p=>!LEAGUE.splitCup||!!p.cup===half)).length;
  todo.forEach((c,k)=>{ if(R.bad)return; const j=n0+k;
    const g=SEA.phase==="week"?(mineNow?mineNow[j]:SEA.nextGame(my)):(SEA.phase!=="done"?SEA.postMatchup(my):null);
    if(!g){ R.bad=`It claims a game on ${shDay(i)} that isn't on the schedule there.`; return }
    const F=shPlayLive(g,i,SEA.half?1:(mineNow?j:0),pl); R.done++;
    if(F.mine!==c[0]||F.theirs!==c[1]){ R.bad=`Its game against ${F.other} on ${shDay(i)} replays ${F.mine}-${F.theirs}, not ${c[0]}-${c[1]}.`; return }
    S.played[pk]=(S.played[pk]||[]).concat([F]) });
}
function shDay(i){ try{ const d=typeof storyGameLabel==="function"?storyGameLabel(i):""; return d||("step "+(i+1)) }catch(e){ return "step "+(i+1) } }
// a live game, start to finish, with the recorded answers: the result as finishLive records it
function shPlayLive(g,step,slotN,pl){
  const my=S.myTeam, home=g.home===my, e=SEA.matchupElo(g,pl), rng=new RNG(liveSeed(step));
  const oppPlan=cpuPlanOf(opponentOf(g),home?e.a-e.h:e.h-e.a);
  const knock=SEA.phase!=="week"||!!g.cup, ctx=typeof gameCtx==="function"?gameCtx(g.home,g.away,SEA.year,step,SEA):undefined;
  const ck=callKey(step)+(slotN?"#"+slotN:""), pm=((S.planMid&&S.planMid[ck])||[]).map(x=>x.slice());
  const eng=makeLiveGame(rng,e.h,e.a,home?pl:oppPlan,home?oppPlan:pl,home,knock,ctx,pm); if(eng)eng.plog=true;
  const ans=(S.calls&&S.calls[ck])||[], drives=[]; let ai=0, guard=0;
  while(guard++<40000){ const r=eng.next();
    if(r.done){ if(Array.isArray(r.drives)&&r.drives.length>drives.length)for(let k=drives.length;k<r.drives.length;k++)drives.push(r.drives[k]); break }
    if(r.ask){ eng.reply(ai<ans.length?ans[ai++]:r.ask.opts[r.ask.opts.length-1][0]); continue }
    if(r.drive)drives.push(r.drive) }
  const F={team:my,other:home?g.away:g.home,mine:home?eng.h:eng.a,theirs:home?eng.a:eng.h,
    drives:drives.map(d=>{ if(!d||!(d.pl||d.pbShown||d._ev))return d; const {pl,_pb,pbShown,_ev,...r}=d; return r })};
  if(LEAGUE.tracksOT){ F.ot=eng.ot||0; F.so=!!eng.so }
  if(eng.rest&&eng.rest[home?"home":"away"])F.rested=true;
  if(g.cup)F.cup=true;
  if(LEAGUE.draws){ F.draw=!!eng.draw; if(eng.pens)F.pens=((eng.pens==="home")===home)?"mine":"theirs" }
  return F;
}
function chLine(X){ // the result in one line, for a message to a friend
  const R=X.R||X.claim, met=X.met;
  return `${X.name}, ${X.team}: ${chRecText(Object.assign({d:0,o:0},R))}${R.res?", "+R.res.toLowerCase():""}. Challenge ${met?"met":"not met"}.` }

/* ============ the season in review ============ */
function shPlain(s){ return String(s||"").replace(/<[^>]+>/g,"").replace(/&ndash;/g,"–").replace(/&mdash;/g,"—").replace(/&middot;/g,"·").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim() }
/* what a season's card says, from its history entry (h) and, while that season is still the one loaded, its games */
function reviewOf(h){
  if(!h)return null; const my=h.team||S.myTeam, live0=SEA&&SEA.year===h.year&&SEA.rec&&SEA.rec[my];
  const R={team:my,year:h.year,coach:(h.coach&&h.coach.name)||(S.career&&S.career.name)||"",rec:h.rec||"",result:h.result||"",grade:h.grade||"",
    gradeLine:h.gradeLine||"",group:(h.group&&h.group.name)||"",groupRec:(h.group&&h.group.rec)||"",moments:[],awards:[],game:(LEAGUE.text&&LEAGUE.text.gameName)||"Coach"};
  if(h.pos)R.place=`${ordinal(h.pos)} in ${R.group}`; else if(h.rank&&ranksMean())R.place=`Finished No. ${h.rank}`;
  // the moments: from the games while the season is loaded, else what the history kept
  if(live0){
    const G=[].concat(...SEA.weeks.map(w=>w.games||[])); if(typeof SEA.postPools==="function"){ try{ G.push(...[].concat(...SEA.postPools())) }catch(e){} }
    const mine=G.filter(g=>g&&g.hp!==undefined&&(g.home===my||g.away===my)), seen=new Set(), byK={};
    mine.forEach(g=>{ if(seen.has(g))return; seen.add(g); (momentsOf(g,my)||[]).forEach(x=>{ (byK[x.k]=byK[x.k]||[]).push({x:x,g:g}) }) });
    MOMENT_ORDER.forEach(k=>{ const L=byK[k]; if(!L||!L.length||R.moments.length>=4)return; const f=L[0];
      R.moments.push(`${f.x.h}${L.length>1?` (${L.length} this season)`:""}. ${shPlain(f.x.l)}`) });
    // the longest winning run, and the biggest win
    let run=0, best=0; mine.filter(g=>!g.cup).forEach(g=>{ if(g.winner===my){ run++; best=Math.max(best,run) } else run=0 });
    if(best>=3)R.moments.push(`${best} wins in a row.`);
    const big=mine.filter(g=>g.winner===my).sort((a,b)=>(b.margin||0)-(a.margin||0))[0];
    if(big&&(big.margin||0)>=MG("rout")*(SPORT.id==="football"?1:0.4)){ const o=big.home===my?big.away:big.home, a=big.home===my?big.hp:big.ap, b=big.home===my?big.ap:big.hp;
      R.moments.push(`The biggest win: ${a}-${b} against ${o}.`) }
  }
  if(h.bestWin)R.moments.push(`The best win: ${h.bestWin.rank?"No. "+h.bestWin.rank+" ":""}${h.bestWin.opp}, ${h.bestWin.score}.`);
  if(h.story&&typeof storyRowLine==="function"){ const t=shPlain(storyRowLine(h.story)); if(t)R.moments.push(t) }
  if(!R.moments.length&&(h.miles||[]).length)(h.miles||[]).slice(0,3).forEach(m=>R.moments.push(shPlain(m.t||m.l||m)));
  // the awards: the league's player of the year race, and your men on the league's team of the year
  let mvp=h.awards&&h.awards.mvp, team=h.awards&&h.awards.team;
  if(!mvp&&live0&&SEA.phase==="done"){ try{ mvp=SEA.mvpRace(3); team=SEA.awardTeam(my) }catch(e){} }
  const AW=(LEAGUE.awards&&LEAGUE.awards.mvp)||"MVP";
  if(mvp&&mvp[0]){ const w=mvp[0]; R.awards.push(`${AW}: ${w.n} (${w.p}, ${w.t})${w.t===my?", yours":""}.`);
    const yours=mvp.slice(1).filter(x=>x.t===my); yours.forEach(x=>R.awards.push(`${x.n} (${x.p}) finished ${ordinal(mvp.indexOf(x)+1)} for the ${AW}.`)) }
  const ours=team&&team.list?team.list.filter(x=>x.team===my):[];
  if(ours.length)R.awards.push(`On the league's team of the year: ${ours.slice(0,5).map(x=>`${x.n} (${x.pos})`).join(", ")}${ours.length>5?` and ${ours.length-5} more`:""}.`);
  if(S.challenge&&S.challenge.code&&S.challenge.team===my&&h.year===S.challenge.year){ R.challenge=`Weekly challenge ${S.challenge.id}: ${S.challenge.met?"met":"not met"}.` }
  return R;
}
function reviewText(R){
  const L=[`${R.team} — ${R.year} in review`,`${R.coach}${R.coach?", ":""}${R.rec}${R.groupRec&&R.groupRec!==R.rec?` (${R.groupRec} in ${R.group})`:""}`];
  if(R.result)L.push(R.result.charAt(0)+R.result.slice(1).toLowerCase().replace(/\b(nba|nfl|nhl|ncaa|fa)\b/g,x=>x.toUpperCase()));
  if(R.place&&!/\d/.test(R.result))L.push(R.place+".");
  if(R.grade)L.push(`The board: ${R.grade}. ${R.gradeLine}`);
  if(R.moments.length){ L.push("","The season's moments:"); R.moments.forEach(m=>L.push("- "+m)) }
  if(R.awards.length){ L.push("","Awards:"); R.awards.forEach(a=>L.push("- "+a)) }
  if(R.challenge)L.push("",R.challenge);
  L.push("",String((LEAGUE.text&&LEAGUE.text.site)||"ianbott1.github.io/coach"));
  return L.join("\n");
}
/* the picture: drawn straight onto a canvas (any 2D context: the tests hand it one that records what it's told) */
const RV_W=1080, RV_H=1350;
function reviewDraw(cx,R){
  const ink=teamColor(R.team), ink2=typeof teamInk==="function"?teamInk(R.team):ink;
  const mono="ui-monospace,Menlo,Consolas,monospace", disp="Impact,'Arial Black','Helvetica Neue',sans-serif", body="'Helvetica Neue',Helvetica,Arial,sans-serif";
  const font=(sz,f)=>{ cx.font=`${sz}px ${f}` };
  const fit=(t,max,sz,f)=>{ font(sz,f); let w=cx.measureText?cx.measureText(t).width:t.length*sz*0.55; while(w>max&&sz>14){ sz-=2; font(sz,f); w=cx.measureText?cx.measureText(t).width:t.length*sz*0.55 } return sz };
  const wrap=(t,x,y,max,sz,lh,f,col,maxLines)=>{ font(sz,f); cx.fillStyle=col; const words=String(t).split(" "); let line="", n=0;
    const W=s=>cx.measureText?cx.measureText(s).width:s.length*sz*0.52;
    for(const w of words){ const tryL=line?line+" "+w:w; if(W(tryL)>max&&line){ cx.fillText(line,x,y+n*lh); n++; line=w; if(maxLines&&n>=maxLines)return n } else line=tryL }
    if(line){ cx.fillText(line,x,y+n*lh); n++ } return n };
  cx.fillStyle="#10131C"; cx.fillRect(0,0,RV_W,RV_H);
  cx.fillStyle=ink; cx.fillRect(0,0,RV_W,14);
  cx.textAlign="left"; font(28,mono); cx.fillStyle="#7C879C"; cx.fillText(`${R.year} IN REVIEW`,64,96);
  cx.textAlign="right"; cx.fillText(String(R.coach||"").toUpperCase(),RV_W-64,96); cx.textAlign="left";
  const tsz=fit(String(R.team).toUpperCase(),RV_W-128,110,disp); cx.fillStyle=ink2; cx.fillText(String(R.team).toUpperCase(),64,220);
  font(120,disp); cx.fillStyle="#E9E5DA"; cx.fillText(R.rec,64,360);
  let y=420; if(R.result){ wrap(R.result,64,y,RV_W-128,40,48,disp,"#F4A63A",2); y+=R.result.length>40?100:60 }
  if(R.place&&!/\d/.test(R.result)){ font(30,body); cx.fillStyle="#B4BCCB"; cx.fillText(R.place,64,y); y+=50 }
  if(R.grade){ font(30,body); cx.fillStyle="#B4BCCB"; cx.fillText(`The board: ${R.grade}. ${R.gradeLine}`.slice(0,70),64,y); y+=56 }
  cx.fillStyle="#2A3145"; cx.fillRect(64,y,RV_W-128,3); y+=56;
  if(R.moments.length){ font(26,mono); cx.fillStyle="#7C879C"; cx.fillText("THE SEASON'S MOMENTS",64,y); y+=46;
    R.moments.slice(0,5).forEach(m=>{ const n=wrap(m,84,y,RV_W-168,30,38,body,"#E9E5DA",2); cx.fillStyle=ink; cx.fillRect(64,y-22,6,26); y+=n*38+14 }) ; y+=20 }
  if(R.awards.length&&y<RV_H-260){ font(26,mono); cx.fillStyle="#7C879C"; cx.fillText("AWARDS",64,y); y+=46;
    R.awards.slice(0,3).forEach(a=>{ const n=wrap(a,84,y,RV_W-168,30,38,body,"#E9E5DA",2); cx.fillStyle="#F2C14E"; cx.fillRect(64,y-22,6,26); y+=n*38+14 }) }
  if(R.challenge){ font(28,body); cx.fillStyle="#F4A63A"; cx.fillText(R.challenge,64,RV_H-150) }
  cx.fillStyle="#2A3145"; cx.fillRect(64,RV_H-118,RV_W-128,3);
  font(40,disp); cx.fillStyle="#F4A63A"; cx.fillText(String(R.game).toUpperCase(),64,RV_H-56);
  font(22,mono); cx.fillStyle="#7C879C"; cx.textAlign="right"; cx.fillText("ianbott1.github.io/coach",RV_W-64,RV_H-56); cx.textAlign="left";
  return tsz;
}
function reviewImage(R){
  return new Promise((res,rej)=>{ try{ const cv=document.createElement("canvas"); cv.width=RV_W; cv.height=RV_H; const cx=cv.getContext("2d"); reviewDraw(cx,R);
    cv.toBlob(b=>b?res(b):rej(new Error("no image")),"image/png") }catch(e){ rej(e) } });
}
async function reviewDownload(R){
  try{ const b=await reviewImage(R), a=document.createElement("a"); a.href=URL.createObjectURL(b);
    a.download=`${String(R.team).replace(/[^A-Za-z0-9]+/g,"-")}-${R.year}-review.png`; document.body.appendChild(a); a.click();
    setTimeout(()=>{ try{ URL.revokeObjectURL(a.href); a.remove() }catch(e){} },1500); return true }catch(e){ return false }
}
async function shCopy(t){ try{ await navigator.clipboard.writeText(t); return true }catch(e){ return false } }
function reviewPanelHTML(h){ const R=reviewOf(h); if(!R)return "";
  return `<div class="shbox" id="shreview"><div class="grouphead" style="border:none;padding-left:0">The season in review</div>
    <pre class="shtext">${esc(reviewText(R))}</pre>
    <div class="cardacts"><button class="wbtn" id="rvcopy">Copy the review</button><button class="wbtn" id="rvimg">Download it as a picture</button></div>
    <div class="note" id="rvmsg"></div></div><!--/shreview-->` }

/* ============ on the screens ============ */
let SH_UI={panel:null,msg:"",check:null,code:"",busy:false};
function shFreeSlot(slots){ const f=(slots||[]).find(x=>x.empty); return f?f.n:0 }
function shareTitleHTML(slots){
  if(!SHARE_ON)return ""; const id=chWeek(), spec=chSpec(id), free=shFreeSlot(slots), P=SH_UI.panel;
  const name=`<input id="shname" class="seedbox namebox" maxlength="26" placeholder="Coach name (optional)" value="${esc(SH_UI.name||"")}">`;
  let h=`<div class="shtitle"><button class="introskip wide" id="shweek">This week's challenge<small>${esc(spec.team)} &middot; ${esc(spec.kind==="wins"?"beat the forecast":spec.kind==="post"?"reach the postseason":"win it all")}</small></button>`;
  if(P==="week")h+=`<div class="shbox"><div class="note"><b>${esc(id)}.</b> ${esc(chGoalText(spec,null))} Everyone who plays this week starts the same league from the same seed. At the end of the season you get a result code: send it to a friend and their game replays your season to check it.</div>
    ${free?`${name}<button class="advance" id="shweekgo">Start the challenge in slot ${free}</button>`:`<div class="note">Every slot is full. Replace a career first (Start a new career), then come back.</div>`}</div>`;
  h+=`<button class="introskip wide" id="shcode">Start from a league code</button>`;
  if(P==="code")h+=`<div class="shbox"><input id="shcodein" class="seedbox" placeholder="${esc(shLeagueId())}-3H7K2-04-${ENGINE_NOW}-QX7M" value="${esc(SH_UI.code||"")}" autocomplete="off" spellcheck="false">
    ${name}${free?`<button class="advance" id="shcodego">Start this league in slot ${free}</button>`:`<div class="note">Every slot is full. Replace a career first, then come back.</div>`}</div>`;
  h+=`<button class="introskip wide" id="shcheck">Check a friend's challenge result</button>`;
  if(P==="check")h+=chCheckBoxHTML();
  if(SH_UI.msg)h+=`<div class="note" role="status">${esc(SH_UI.msg)}</div>`;
  return h+`</div>` }
function chCheckBoxHTML(){
  const X=SH_UI.check;
  return `<div class="shbox"><textarea id="shresin" class="shcodebox" rows="3" placeholder="Paste the code, CC1..." spellcheck="false">${esc(SH_UI.res||"")}</textarea>
    <button class="advance" id="shresgo">${SH_UI.busy?"Replaying the season…":"Check it"}</button>
    ${X?`<div class="shverdict ${X.ok?(X.met?"good":"ok"):"bad"}" role="status">${X.ok
      ?`<b>It checks out.</b> ${esc(chLine(X))} Replayed here from the same seed and the same calls: ${esc(X.spec.id)}, ${esc(chGoalText(X.spec,X.tgt))}`
      :`<b>It doesn't check out.</b> ${esc(X.why)}`}</div>`:""}</div>` }
function shRunCheck(txt,done){ SH_UI.res=txt; SH_UI.busy=true; SH_UI.check=null; render();
  setTimeout(()=>{ let X; try{ X=chCheck(txt) }catch(e){ X={ok:false,why:"That season doesn't replay: "+String(e&&e.message||e)} } SH_UI.busy=false; SH_UI.check=X; if(done)done(X); render() },30) }
function shareTitleBind(slots){
  const on=(id,f)=>{ const b=el(id); if(b)b.onclick=f };
  const nm=()=>{ const x=el("shname"); return x&&x.value?String(x.value).trim().slice(0,26):"" };
  on("shweek",()=>{ SH_UI.panel=SH_UI.panel==="week"?null:"week"; SH_UI.msg=""; render() });
  on("shcode",()=>{ SH_UI.panel=SH_UI.panel==="code"?null:"code"; SH_UI.msg=""; render() });
  on("shcheck",()=>{ SH_UI.panel=SH_UI.panel==="check"?null:"check"; SH_UI.msg=""; render() });
  on("shweekgo",()=>{ const n=shFreeSlot(slots); if(!n)return; SH_UI.panel=null; chStart(n,nm()) });
  on("shcodego",()=>{ const n=shFreeSlot(slots), x=el("shcodein"), v=x?x.value:""; SH_UI.code=v; SH_UI.name=nm();
    const L=readLeagueCode(v); if(L.why){ SH_UI.msg=L.why; render(); return }
    if(!n)return; SH_UI.panel=null; SH_UI.msg=""; startFromCode(n,L,nm()) });
  on("shresgo",()=>{ const x=el("shresin"); shRunCheck(x?x.value:"") });
}
function startFromCode(n,L,name){
  slot=n; saveRev=null; staleTab=false;
  S={myTeam:null,uStart:null,seasonSeed:0,steps:0,history:[],seed:0,title:false,introDone:true,setup:{name:name||"",seed:L.seed,ready:true}};
  newDynasty(L.team,L.seed,name||"");
  if(L.older){ flash=null; S.codeNote=`This league code was made on engine ${L.eng}. It starts the same league; the games play on this version's engine (${ENGINE_NOW}), so results will differ from your friend's.`; save(); render() }
}
/* the new-career screen: a league code instead of a seed and a club */
function shareSetupHTML(){
  return `<div class="grouphead" style="border:none;padding-left:0">League code</div>
    <input id="ccode" class="seedbox" placeholder="${esc(shLeagueId())}-3H7K2-04-${ENGINE_NOW}-QX7M" value="${esc((S.setup&&S.setup.code)||"")}" autocomplete="off" spellcheck="false">
    <span class="seedhint">Sent a league code? Paste it here and you start in that league with that ${esc(ORG_WORD)}, as your friend did.</span>
    ${S.setup&&S.setup.codeMsg?`<div class="note" role="alert">${esc(S.setup.codeMsg)}</div>`:""}` }
function shareSetupGo(grab){
  const x=el("ccode"), v=x&&x.value?String(x.value).trim():""; if(!v)return false;
  grab(); S.setup.code=v; const L=readLeagueCode(v);
  if(L.why){ S.setup.codeMsg=L.why; render(); return true }
  if((S.setup.coaches||1)>1){ S.setup.codeMsg="A league code starts a career for one coach. Pick Just me, or leave the code out and share the world seed."; render(); return true }
  S.setup.codeMsg=""; startFromCode(slot,L,S.setup.name); return true }
/* the team page: the challenge in hand, the result code at the end, and this league's code */
function shareTeamHTML(my){
  if(!SHARE_ON||!S||!SEA||!S.myTeam)return ""; let h="";
  if(S.codeNote)h+=`<div class="note">${esc(S.codeNote)} <button class="skip small" id="shnote">OK</button></div>`;
  const C=S.challenge;
  if(C&&chOpen()){
    const spec=chSpec(C.id), R=chResult(my), done=SEA.phase==="done";
    if(done&&!C.code){ try{ C.code=chMake(); C.met=chMet(spec,C.tgt,my,R); C.line=chRecText(R)+(R.res?", "+R.res.toLowerCase():"") }catch(e){} }
    h+=`<div class="shbox shch"><div class="grouphead" style="border:none;padding-left:0">Weekly challenge ${esc(C.id)}</div>
      <div class="note">${esc(chGoalText(spec,C.tgt))}</div>
      ${done?`<div class="shverdict ${C.met?"good":"bad"}"><b>Challenge ${C.met?"met":"not met"}.</b> ${esc(C.line||"")}</div>
        ${C.code?`<div class="note">Your result code. Send it to a friend: their game replays your season from the same seed and your calls, and says whether it checks out.</div>
        <textarea class="shcodebox" id="shmycode" rows="3" readonly>${esc(C.code)}</textarea>
        <div class="cardacts"><button class="wbtn" id="shcopycode">Copy the code</button></div><div class="note" id="shcopymsg"></div>`:""}`
      :`<div class="note">So far: ${esc(chRecText(R))}.${C.tgt&&spec.kind==="wins"?` ${Math.max(0,C.tgt.w-R.w)} more wins to the target.`:""}</div>`}
      <details class="shmore" ${SH_UI.panel==="check"?"open":""}><summary>Check a friend's result</summary>${chCheckBoxHTML()}</details></div>`;
  }
  if(SEA.phase==="done"&&!isHotSeat())h+=`<button class="cardbtn" id="shrv">The season in review: copy it or save it as a picture</button>`;
  const code=careerCode();
  if(code)h+=`<details class="shmore"><summary>Share this league</summary><div class="note">League code <b class="shcode">${esc(code)}</b>. It starts this league from the beginning, on any device, with ${esc((S.coaches&&S.coaches[0]&&S.coaches[0].myTeam)||my)}.</div>
    <div class="cardacts"><button class="wbtn" id="shcopylc">Copy the league code</button></div><div class="note" id="shlcmsg"></div></details>`;
  return h?`<div class="shteam">${h}<!--/shteam--></div>`:"" }
function shareBind(){
  try{ if(typeof document==="undefined")return;
    const on=(id,f)=>{ const b=el(id); if(b)b.onclick=f };
    const msg=(id,t)=>{ const m=el(id); if(m)m.textContent=t };
    on("shnote",()=>{ delete S.codeNote; save(); render() });
    on("shrv",()=>{ try{ cardFor=seasonEntry(S.myTeam); cardMsg=""; render(); window.scrollTo(0,0) }catch(e){} });
    on("shcopycode",async()=>{ msg("shcopymsg",await shCopy(S.challenge&&S.challenge.code||"")?"Copied.":"The clipboard is blocked here: select the code and copy it.") });
    on("shcopylc",async()=>{ msg("shlcmsg",await shCopy(careerCode())?"Copied.":"The clipboard is blocked here: select the code and copy it.") });
    if(S&&S.myTeam)on("shresgo",()=>{ const x=el("shresin"); SH_UI.panel="check"; shRunCheck(x?x.value:"") });
    if(cardFor){ const R=()=>reviewOf(cardFor);
      on("rvcopy",async()=>{ msg("rvmsg",await shCopy(reviewText(R()))?"Copied.":"The clipboard is blocked here.") });
      on("rvimg",async()=>{ msg("rvmsg","Drawing…"); msg("rvmsg",await reviewDownload(R())?"Saved to your downloads.":"Couldn't make the picture on this device.") }) }
  }catch(e){}
}

/* ============ a save as a file ============
   COACH SAVE 2, then a line of what it is (the game, the club, the coach, the season, the engine and build it was
   saved on, its length and a checksum), then the save itself as the game stores it. A file from before (the save
   alone) still opens. A file whose checksum doesn't match is refused before anything is read from it. */
const SAVE_FILE_V=2;
function saveFileText(d){
  const body=lzwPack(saveText(d));
  const head={game:LEAGUE.id,team:d.myTeam||null,coach:(d.career&&d.career.name)||"",
    season:(d.seasonNow&&d.seasonNow.year)||(d.uStart&&d.uStart.year)||null,seasons:(d.history||[]).length,
    engine:(d.uStart&&d.uStart.engV)||ENGINE_NOW,build:typeof BUILD_ID!=="undefined"?BUILD_ID:"dev",
    saved:new Date().toISOString().slice(0,10),length:body.length,sum:shSum(body,8)};
  return "COACH SAVE "+SAVE_FILE_V+"\n"+JSON.stringify(head)+"\n"+body }
const SH_GAME={cfb:"College Football Coach",nfl:"Pro Football Coach",ncaab:"College Basketball Coach",nba:"Pro Basketball Coach",nhl:"Pro Hockey Coach",epl:"Soccer Coach",mlb:"Pro Baseball Coach"};
/* {d, head} or {why} */
function readSaveFile(text){
  text=String(text||""); let body, head=null;
  if(/^COACH SAVE \d+\r?\n/.test(text)){
    const m=/^COACH SAVE (\d+)\r?\n([^\n]*?)\r?\n/.exec(text);
    if(!m)return {why:"That backup file is damaged: its first lines don't read."};
    try{ head=JSON.parse(m[2]) }catch(e){ return {why:"That backup file is damaged: its first lines don't read."} }
    body=text.slice(m[0].length).replace(/[\r\n]+$/,"");
    if(head.game&&head.game!==LEAGUE.id)return {why:`That's a backup from ${SH_GAME[head.game]||"another game"}. Open it there.`};
    if(head.length!==body.length||shSum(body,8)!==head.sum)return {why:"That backup file is damaged or cut short: its checksum doesn't match, so nothing was read from it."};
  }else body=text.trim();
  try{ const d=unsaveDup(JSON.parse(lzwUnpack(body)));
    if(!d||!d.myTeam)return {why:"That file isn't a backup from this game."};
    const lg=saveLeague(d); if(lg!==LEAGUE.id)return {why:SH_GAME[lg]?`That's a backup from ${SH_GAME[lg]}. Open it there.`:"That file isn't a backup from this game."};
    return {d:repairPlayed(migrateSave(d)),head:head} }catch(e){ return {why:"That file isn't a backup from this game, or it's damaged."} }
}
