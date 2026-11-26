/* ============ a league with a memory (review round 3, engine 27) ============ */
/* The league goes on around you: a record book that starts from the real one and falls on a date, a Hall of Fame by
   each sport's own rule, retired numbers, an awards night with finalists and the vote where the sport publishes one,
   coaches fired in season and after it at the real leagues' rates (core 20_engine offseasonCoaching), rivalries grown
   from playoff meetings, droughts and dynasties noticed, players retiring with a farewell, and the owner (or chairman,
   or athletic director) who decides how long you have. Each league's facts are in leagues/<id>/89_lore.js.
   Everything here is either read from the season (deterministic, so a reload rebuilds it) or banked once into U.lore
   at the season's end, before the next season's snapshot. History is kept short: only what the book shows. A season
   played on an engine before 27 banks nothing (loreOn). */
function loreOn(){ return typeof eng27==="function"&&eng27()&&typeof LEAGUE!=="undefined"&&!!LEAGUE.lore }
function loreY(y){ return (y==null?SEA.year:y)+(LEAGUE.lore.yOff||0) }                       // the season's own label year
function loreYs(y){ return LEAGUE.lore.yOff?(y-1)+"-"+String(y).slice(-2):String(y) }        // 2027 -> "2026-27"
function loreTop(t){ return !LEAGUE.lore.top||!!LEAGUE.lore.top(t) }
function loreHumans(){ const h=new Set(); if(typeof S!=="undefined"&&S){ if(S.myTeam)h.add(S.myTeam); (S.coaches||[]).forEach(c=>{ if(c&&c.myTeam)h.add(c.myTeam) }) } return h }
function loreU(){
  if(!U.lore)U.lore={v:1,rec:{},car:{},last:{},ch:[],fall:[],hof:[],elig:[],num:{},riv:{},aw:[],news:[],club:{},lw:{}};
  return U.lore }
const loreN=v=>typeof v==="number"?(Math.round(v*10)/10).toLocaleString("en-US"):String(v);
/* a record now: the game's own if it has fallen here, else the real one */
function loreRec(k,kind){ const L=LEAGUE.lore, lo=U&&U.lore, r=L.recs.find(x=>x.k===k); if(!r)return null;
  const own=lo&&lo[kind==="c"?"car":"rec"][k]; if(own)return own; const s=r[kind]; return s?[s[0],s[1],s[2],s[3]]:null }

/* ---- a player's numbers ---- */
/* the regular season (the league's games: no playoffs, no cups), from his game log; college counts every game, as
   the NCAA does. upto: before this step. posSet: only the games he played at these positions. */
function loreRegOf(p,upto,posSet){
  const o={g:0}, gl=p&&p.gl; if(!gl)return o; const w=glStride(), L=LEAGUE.lore, lim=Math.min(upto==null?1e9:upto,L.college?1e9:LEAGUE.weeks);
  for(let j=0;j+w<=gl.length;j+=w){ if(gl[j]>=lim||(!L.college&&(gl[j+2]&2)))continue;
    const Q=POS[gl[j+5]]; if(!Q||(posSet&&posSet.indexOf(Q.p)<0))continue; o.g++;
    (STAT_KEYS[Q.p]||[]).forEach((k,q)=>o[k]=(o[k]||0)+gl[j+6+q]) }
  return o }
/* the step on which his season total first reached v (the date a record fell) */
function loreStepAt(p,k,v,posSet){
  const gl=p&&p.gl; if(!gl)return null; const w=glStride(), L=LEAGUE.lore; let s=0;
  for(let j=0;j+w<=gl.length;j+=w){ if(!L.college&&(gl[j]>=LEAGUE.weeks||(gl[j+2]&2)))continue;
    const Q=POS[gl[j+5]]; if(!Q||(posSet&&posSet.indexOf(Q.p)<0))continue; const q=(STAT_KEYS[Q.p]||[]).indexOf(k); if(q<0)continue;
    s+=gl[j+6+q]; if(s>=v)return gl[j] }
  return null }
/* a date the way a fan says it: "Jan 4, 2031" (a winter league's autumn belongs to the year before its label) */
function loreDate(step,y){
  const d=LEAGUE.dates&&LEAGUE.dates[step]; if(!d)return loreYs(y);
  const m="JanFebMarAprMayJunJulAugSepOctNovDec".indexOf(String(d).slice(0,3))/3;
  return d+", "+(LEAGUE.lore.yOff&&m>=6?y-1:y) }
/* his career in a stat: before the game began (pre), and since */
function loreCareer(p,k){ const L=LEAGUE.lore; return ((p.pre&&p.pre[k])||0)+(L.lc?((p.lc&&p.lc[k])||0):((p.car&&p.car[k])||0)) }
function lorePosOf(p){ const h=p.hist&&p.hist[p.hist.length-1]; return (h&&h.p)||p.p }
function loreSeasons(p){ return ((p.pre&&p.pre.y)||0)+((p.hist||[]).length) }
/* the keys a man's career is told by: his position's records, then its milestone */
function loreKeys(pos){
  const K=[], sk=STAT_KEYS[pos]||[];
  LEAGUE.lore.recs.forEach(r=>{ if(!r.team&&sk.indexOf(r.k)>=0&&(!r.pos||r.pos.indexOf(pos)>=0)&&K.indexOf(r.k)<0)K.push(r.k) });
  const M=typeof milestoneSpec==="function"&&milestoneSpec(pos); if(M&&K.indexOf(M[0])<0&&sk.indexOf(M[0])>=0)K.push(M[0]);
  return K }
function loreLabel(k){ const r=LEAGUE.lore.recs.find(x=>x.k===k); if(r)return r.l;
  const M=SPORT.milestones||{}; for(const p in M)if(M[p]&&M[p][0]===k)return M[p][1]; return k }
function loreLine(p,noYrs){
  const pos=lorePosOf(p), K=loreKeys(pos).slice(0,2), n=noYrs?0:loreSeasons(p);
  const parts=K.map(k=>[k,loreCareer(p,k)]).filter(x=>x[1]>0).map(x=>loreN(Math.round(x[1]))+" "+loreLabel(x[0]));
  const s=(n?n+" season"+(n===1?"":"s"):"")+(parts.length?(n?", ":"")+parts.join(", "):"");
  return s?s.charAt(0).toUpperCase()+s.slice(1):s }
const lorePoss=t=>/s$/.test(t)?t+"'":t+"'s";
function loreMainTeam(p,fallback){ const c={}; (p.hist||[]).forEach(h=>c[h.t]=(c[h.t]||0)+1);
  let best=fallback, bn=0; Object.keys(c).forEach(t=>{ if(c[t]>bn){ bn=c[t]; best=t } }); return {t:best,n:bn} }

/* the years before the game began, estimated once from his first season here (a 31-year-old veteran had 0 career
   goals, so the milestones and the career records could never come): his rate this season over the seasons he
   must have played since his debut, a little under (a career's first and last years are its thinnest) */
function lorePre(p,t,sp){
  const L=LEAGUE.lore, H=p.hist||[], h0=H[H.length-1]; if(!h0||!h0.s||p.pre)return;
  const h=sp&&!L.college?{p:h0.p,s:loreRegOf(sp)}:h0;   // the league's games only (a cup run is no career)
  const yrs=Math.min(16,Math.max(0,L.college?((p.c||0)-(H.length-1)):((p.age||0)-(L.debut||22)-(H.length-1))));
  if(yrs<1||(L.top&&!L.top(t)))return;
  const full=(LEAGUE.schedule&&LEAGUE.schedule.games)||h.s.g||1, f=Math.min(1.5,full/Math.max(h.s.g||1,full*0.5)), o={y:yrs};
  // never more than about half the real career record: the all-time marks belong to careers played here
  loreKeys(h.p).forEach(k=>{ const v=h.s[k], R=L.recs.find(x=>x.k===k&&x.c); if(v>0)o[k]=Math.round(Math.min(v*f*yrs*0.7,R?R.c[0]*0.5:1e9)) });
  p.pre=o }
function loreValue(p){
  // a Hall of Fame case: seasons well above the league's starters (the engine's reference, REF26), the years before
  // the game began at his first season's level, and the honours
  const R0=REF26[LEAGUE.id], R=R0&&R0.m==null?R0.PL:R0; if(!R)return 0;
  const bar=R.t!=null?R.m+0.5*(R.t-R.m):R.m+1.2*R.s, sc=R.t!=null?(R.t-R.m)/2:R.s;
  const H=p.hist||[]; let v=0; H.forEach(h=>v+=Math.max(0,(h.r-bar)/sc));
  if(p.pre&&p.pre.y&&H[0])v+=p.pre.y*Math.max(0,(H[0].r-bar)/sc)*0.7;
  // and what he piled up: his best stat against the real career record (a 58,000-yard passer is most of the way in)
  let pr=0; loreKeys(lorePosOf(p)).forEach(k=>{ const R=LEAGUE.lore.recs.find(x=>x.k===k&&x.c); if(R)pr=Math.max(pr,Math.min(1.3,loreCareer(p,k)/R.c[0])) });
  v+=pr*8;
  const o=p.hon||{}; v+=(o.m||0)*1.5+(o.o||0)*0.6+(o.a||0)*(LEAGUE.lore.college?1.2:0.6);
  return Math.round(v*10)/10 }

/* ---- the owner ---- */
/* who decides, and how long they give you: fixed by the club (a hash), so nothing is stored and nothing drawn.
   pat 0 impatient (one bad year can do it), 1 measured (two misses in a row, the rule since round 1), 2 patient
   (three). A title in the last two seasons buys one more. */
function bossOf(t){
  const h=strHash("boss|"+t), L=LEAGUE.lore||{};
  const n=FIRST[h%FIRST.length]+" "+LAST[(h>>>7)%LAST.length], q=(h>>>14)%4;
  return {n:n,pat:q===0?0:q===3?2:1,w:L.boss||"owner"} }
function bossRun(team,H){
  // the seasons before this one at this club, newest first, while they run unbroken
  const mine=(H||[]).filter(h=>h.team===team).sort((a,b)=>b.year-a.year); let y=SEA.year-1, ten=0, miss=0, title=false, run=true;
  for(const h of mine){ if(h.year!==y)break; ten++; if(run&&seasonMissed(h))miss++; else run=false; if(ten<=2&&h.champion===team)title=true; y-- }
  return {ten:ten,miss:miss,title:title} }
function bossNeed(team,H){ const b=bossOf(team), r=bossRun(team,H); return [2,2,3][b.pat]+(r.title?1:0) }
/* fired at the season's end (engine 27's missedTwiceFor) */
function bossFires(team,H,now){
  if(!now||!now.miss)return false;
  const b=bossOf(team), r=bossRun(team,H);
  if(b.pat===0&&!r.title&&r.ten>=1&&/A bad year/.test(now.l||""))return true;
  return r.miss+1>=bossNeed(team,H) }
/* one more miss and the job goes */
function bossBrink(team,H){ const r=bossRun(team,H); return r.ten>=1&&r.miss+1>=bossNeed(team,H) }
function bossWord(b){ return ["impatient","measured","patient"][b.pat] }
function bossWhy(team,H){
  const b=bossOf(team), r=bossRun(team,H), need=bossNeed(team,H), left=need-r.miss;
  const who=`${b.w==="athletic director"?"Your athletic director":"The "+b.w}, ${b.n}`;
  if(r.ten<1)return `${who}, gives every new coach a first season.`;
  // the target missed last season, by name (rv3/fixes-odds: engine 27's line dropped it, so a hot seat read as failure
  // out of nowhere, Grokbot's complaint that seatWhy answered: "You missed last year's target (mid-table)")
  const last=(H||[]).find(h=>h.team===team&&h.year===SEA.year-1), aim=last&&last.exp?String(last.exp).replace(/^Target:\s*/i,"").replace(/\.$/,"").replace(/^[A-Z](?=[a-z])/,c=>c.toLowerCase()):"";   // "Win in March": "win in March"
  if(left<=1)return `${who}, has seen ${r.miss} season${r.miss===1?"":"s"} short of the target${aim?(r.miss===1?` (${aim})`:` (last season's: ${aim})`):""}. Miss this one and the job goes.`;
  if(b.pat===0&&!r.title)return `${who}, is impatient: a bad year costs the job, and two short of the target in a row do too.`;
  return `${who}, is ${bossWord(b)}: ${need} seasons in a row short of the target before a change${r.title?" (the title bought you one more)":""}.`;
}
function bossHTML(){
  if(!loreOn())return ""; const my=S.myTeam, b=bossOf(my);
  return `<div class="grouphead">Your ${esc(b.w)}</div><div class="note">${esc(b.n)} &middot; ${esc(bossWord(b))}. ${esc(bossWhy(my,S.history))}</div>`;
}

/* ---- the coaching carousel in season ---- */
/* at each checkpoint (LEAGUE.lore.coach.mid: [share of the season, rate]) a computer club well short of what its
   standing promised may fire its coach. By hash from the results to that point, so a reload fires the same men. */
function loreMid(){
  if(!loreOn()||!SEA||!SEA.weeks||typeof U==="undefined"||!U||!U.coach)return [];
  const C=LEAGUE.lore.coach; if(!C||!C.mid||!C.mid.length)return [];
  if(SEA._lmid&&SEA._lmid.k===SEA.step)return SEA._lmid.v;
  const out=[], gone=new Set(), hu=loreHumans(), groups={};
  NAMES.forEach(t=>{ const g=LEAGUE.lore.top?(U.conf&&U.conf[t])||CONF[t]:"all"; (groups[g]=groups[g]||[]).push(t) });
  const pct={}; Object.keys(groups).forEach(g=>{ const L=groups[g].slice().sort((a,b)=>(U.program[b]||0)-(U.program[a]||0));
    L.forEach((t,i)=>pct[t]=L.length>1?1-i/(L.length-1):0.5) });
  C.mid.forEach(([f,a],ci)=>{
    const cp=Math.max(1,Math.floor(LEAGUE.weeks*f)); if(SEA.step<=cp)return;
    const rec={};
    for(let w=0;w<cp&&w<SEA.weeks.length;w++)((SEA.weeks[w]&&SEA.weeks[w].games)||[]).forEach(g=>{ if(g.cup)return;
      [g.home,g.away].forEach(t=>{ if(!rec[t])rec[t]=[0,0,0] });
      if(g.winner&&g.loser){ rec[g.winner][0]++; rec[g.loser][1]++ } else { rec[g.home][2]++; rec[g.away][2]++ } });
    NAMES.forEach(t=>{ const r=rec[t], c=U.coach[t]; if(!r||!c||c.you||hu.has(t)||gone.has(t)||!loreTop(t))return;   // the top flight only (the lower divisions keep the old rule)
      const n=r[0]+r[1]+r[2]; if(n<3)return;
      const wp=LEAGUE.draws?(3*r[0]+r[2])/(3*n):(r[0]+0.5*r[2])/n, exp=0.25+0.5*pct[t], miss=exp-wp;
      const p=a*Math.max(0,Math.min(3,(miss-0.05)/0.15))*((c.t||0)<1?0.4:1);
      if(p>0&&hash01("lmid|"+(U.seed||0)+"|"+t+"|"+SEA.year+"|"+ci)<p){
        const h=strHash("lint|"+t+"|"+SEA.year), sur=String(c.n).split(" ").slice(-1)[0];
        let ln=LAST[(h>>>9)%LAST.length]; for(let k=1;ln===sur&&k<9;k++)ln=LAST[((h>>>9)+k)%LAST.length];
        gone.add(t); out.push({t:t,s:cp,n:c.n,i:FIRST[h%FIRST.length]+" "+ln,w:r[0],l:r[1],d:r[2]}) } });
  });
  SEA._lmid={k:SEA.step,v:out}; return out }

/* ---- awards night ---- */
function loreSide(t){ const sd=LEAGUE.conf&&LEAGUE.conf.sides; if(!sd)return "ALL"; return Object.keys(sd).find(s=>sd[s].indexOf(CONF[t])>=0)||"ALL" }
/* a voter's ballot: each candidate as he sees him (the score, a little noise of his own), the points by place */
function loreVote(cands,V,P,salt){
  const pts=cands.map(()=>0), fp=cands.map(()=>0);
  for(let v=0;v<V;v++){
    const seen=cands.map((c,i)=>{ const u1=hash01(salt+"|"+v+"|"+i)||1e-6, u2=hash01(salt+"|"+i+"|"+v+"|b");
      return c.sc*Math.exp(0.09*Math.sqrt(-2*Math.log(u1))*Math.cos(6.283185*u2)) });
    const ord=cands.map((c,i)=>i).sort((a,b)=>seen[b]-seen[a]);
    ord.slice(0,P.length).forEach((i,k)=>{ pts[i]+=P[k]; if(!k)fp[i]++ }) }
  return cands.map((c,i)=>Object.assign({},c,{pts:pts[i],fp:fp[i]})).sort((a,b)=>b.pts-a.pts||b.sc-a.sc) }
function loreAwards(){
  if(!loreOn()||!SEA||!SEA.roster||SEA.phase!=="done")return [];
  if(SEA._lawd)return SEA._lawd;
  const L=LEAGUE.lore, y=loreY(), out=[], rg=SEA.regRec||SEA.rec, mid=new Set(loreMid().map(x=>x.t));
  const wpOf=t=>{ const r=rg[t]||[0,0]; return r[0]/Math.max(1,r[0]+r[1]) };
  // every player who counts, once: his regular season and how the voters rate it (the MVP race's score, which weighs
  // each position against its own best eight and the voters' premium)
  const race=(typeof SEA.mvpRace==="function"?SEA.mvpRace(400):[]).filter(x=>loreTop(x.t));
  const sc={}; race.forEach(x=>sc[x.t+"|"+x.n]=x.score!=null?x.score:x.prod||0);
  const pool=[];
  NAMES.forEach(t=>{ if(!loreTop(t))return; (SEA.roster[t]||[]).forEach((p,i)=>{ if(!p)return;
    const pos=POS[i%POS.length].p, s=sc[t+"|"+p.n]; if(s==null)return;
    pool.push({p:p,n:p.n,t:t,pos:pos,sc:s,line:typeof statLine==="function"?statLine(pos,loreRegOf(p)):""}) }) });
  const sides=L.sides?Object.keys(LEAGUE.conf.sides):["ALL"];
  L.awards.forEach(A=>sides.forEach(sd=>{
    const inSide=t=>sd==="ALL"||loreSide(t)===sd, nm=A.name+(sd==="ALL"?"":" ("+sd+")");
    if(A.lead){ let best=null;
      NAMES.forEach(t=>{ if(!loreTop(t)||!inSide(t))return; (SEA.roster[t]||[]).forEach(p=>{ if(!p)return; const r=loreRegOf(p,null,A.pos||null), v=r[A.lead]||0;
        if(v>0&&(!best||v>best.v))best={n:p.n,t:t,pos:lorePosOf(p)||"",v:v} }) });
      if(best)out.push({id:A.id,name:nm,w:Object.assign(best,{line:loreN(best.v)+" "+loreLabel(A.lead)}),f:[]});
      return }
    let C;
    if(A.coach){
      C=NAMES.filter(t=>loreTop(t)&&inSide(t)&&U.coach&&U.coach[t]&&!mid.has(t)).map(t=>{ const wp=wpOf(t), lw=U.lore&&U.lore.lw&&U.lore.lw[t];
        const was=lw!=null?lw/1000:0.5; return {n:U.coach[t].n,t:t,pos:"",sc:Math.max(0.01,(wp-was)+0.6*(wp-0.5)+0.5+(SEA.champion===t?0.05:0)),
          line:`${rg[t][0]}-${rg[t][1]}${LEAGUE.draws&&SEA.drw?"-"+(SEA.drw[t]||0):""}${lw!=null?`, from ${Math.round(was*100)}% to ${Math.round(wp*100)}%`:""}`} });
    }else{
      C=pool.filter(x=>inSide(x.t)&&(!A.pos||A.pos.indexOf(x.pos)>=0));
      if(A.rookie)C=C.filter(x=>!(x.p.hist&&x.p.hist.length)&&!L.college&&(x.p.age||99)<=(L.debut||22)+(LEAGUE.id==="mlb"?3:1));
      if(A.young)C=C.filter(x=>(x.p.age||99)<=A.young);
      if(A.val)C=C.map(x=>Object.assign({},x,{sc:A.val(loreRegOf(x.p))*(0.6+0.8*wpOf(x.t))}));
      if(A.pitW)C=C.map(x=>Object.assign({},x,{sc:x.sc*(["SP","SP2","SP3","CL"].indexOf(x.pos)>=0?A.pitW:1)}));
    }
    C=C.filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc);
    if(!C.length)return;
    const nf=A.n||3; let F=C.slice(0,Math.max(nf,A.vote?A.vote[1].length:0));
    if(A.vote)F=loreVote(F,A.vote[0],A.vote[1],"aw|"+(U.seed||0)+"|"+A.id+"|"+sd+"|"+y);
    F=F.slice(0,nf);
    out.push({id:A.id,name:nm,vote:!!A.vote,voters:A.vote?A.vote[0]:0,w:F[0],f:F.slice(1)}) }));
  SEA._lawd=out; return out }

/* the honours men carry into the Hall of Fame case: m an MVP (or the sport's top award), o another voted award,
   a a place on the season's all-league team (college: the All-America team, the best at each place) */
function loreHonours(){
  const hon=(t,n,k)=>{ const p=(U.roster[t]||[]).find(x=>x&&x.n===n); if(!p)return; p.hon=p.hon||{}; p.hon[k]=(p.hon[k]||0)+1 };
  loreAwards().forEach(a=>{ const A=LEAGUE.lore.awards.find(x=>x.id===a.id)||{}; if(A.coach||A.lead||!a.w)return; hon(a.w.t,a.w.n,A.mvp?"m":"o") });
  const team=LEAGUE.lore.college?POS.map((P,i)=>{ let best=null;
      NAMES.forEach(t=>{ const p=(SEA.roster[t]||[])[i]; if(p&&(!best||(p.prod||0)>(best.p.prod||0)))best={p:p,t:t} });
      return best?{team:best.t,n:best.p.n}:null }).filter(Boolean)
    :(typeof SEA.allConference==="function"?SEA.allConference():[]);
  (team||[]).forEach(x=>{ if(x&&x.team&&loreTop(x.team))hon(x.team,x.n,"a") });
}

/* ---- the season banked (endSeason, before the summer) ---- */
let _loreBefore=null;
function loreBank(){
  if(!loreOn()||!U||!SEA)return;
  const L=LEAGUE.lore, lo=loreU(), y=loreY(), hu=loreHumans(), news=[];
  const first=!lo.init; lo.init=1;
  // the years before the game, for every man in his first season here (all of them, the first time)
  const live={}; NAMES.forEach(t=>(SEA.roster[t]||[]).forEach(p=>{ if(p)live[t+"|"+p.n]=p }));
  NAMES.forEach(t=>(U.roster[t]||[]).forEach(p=>{ if(p&&!p.pre&&(first||(p.hist&&p.hist.length===1)))lorePre(p,t,live[t+"|"+p.n]) }));
  // soccer: the Premier League's own career tallies (the game's careers count every division and cup)
  if(L.lc)NAMES.forEach(t=>{ if(!loreTop(t))return; (U.roster[t]||[]).forEach(p=>{ const sp=p&&live[t+"|"+p.n]; if(!sp)return;
    const r=loreRegOf(sp); loreKeys(lorePosOf(p)).forEach(k=>{ if(r[k]>0){ p.lc=p.lc||{}; p.lc[k]=(p.lc[k]||0)+r[k] } }) }) });
  // the records: the season's best against the book, then the careers
  const teamVal=(t,k)=>{ const r=(L.college?SEA.rec:(SEA.regRec||SEA.rec))[t]||[0,0]; return k==="P"?3*r[0]+((SEA.drw&&SEA.drw[t])||0):r[0] };
  L.recs.forEach(R=>{
    if(R.team){ const cur=loreRec(R.k,"s"); let best=null;
      NAMES.forEach(t=>{ if(!loreTop(t))return; const v=teamVal(t,R.k); if(!best||v>best.v)best={t:t,v:v} });
      if(best&&cur&&best.v>cur[0]){ lo.rec[R.k]=[best.v,best.t,best.t,y]; lo.fall.push([y,R.k,"s",best.t,best.t,best.v,cur[0],cur[1],cur[3]]) }
      return }
    if(R.s){ const cur=loreRec(R.k,"s"); let best=null;
      NAMES.forEach(t=>{ if(!loreTop(t))return; (SEA.roster[t]||[]).forEach(p=>{ if(!p)return; const v=loreRegOf(p,null,R.pos||null)[R.k]||0;
        if(v>0&&(!best||v>best.v))best={p:p,t:t,v:v} }) });
      if(best&&cur&&best.v>cur[0]){ const st=loreStepAt(best.p,R.k,cur[0]+(R.k==="sck"?0.5:1),R.pos||null);
        lo.rec[R.k]=[best.v,best.p.n,best.t,y,st!=null?loreDate(st,y):""];
        lo.fall.push([y,R.k,"s",best.p.n,best.t,best.v,cur[0],cur[1],cur[3],st!=null?loreDate(st,y):""]) } }
    if(R.c){ const cur=loreRec(R.k,"c"); let best=null;
      NAMES.forEach(t=>(U.roster[t]||[]).forEach(p=>{ if(!p)return; if(R.pos&&R.pos.indexOf(lorePosOf(p))<0)return; const v=loreCareer(p,R.k);
        if(v>0&&(!best||v>best.v))best={p:p,t:t,v:Math.round(v)} }));
      if(best&&cur&&best.v>cur[0]){ lo.car[R.k]=[best.v,best.p.n,best.t,y];
        if(cur[1]!==best.p.n)lo.fall.push([y,R.k,"c",best.p.n,best.t,best.v,cur[0],cur[1],cur[3]]) } }
  });
  if(lo.fall.length>60)lo.fall=lo.fall.slice(-60);
  // your club's own book, kept from the day the game began
  hu.forEach(t=>{ const C=lo.club[t]=lo.club[t]||{s:{},c:{}};
    L.recs.forEach(R=>{ if(R.team){ const v=teamVal(t,R.k), c=C.s[R.k]; if(!c||v>c[0])C.s[R.k]=[v,t,y]; return }
      (SEA.roster[t]||[]).forEach(p=>{ if(!p)return; const v=loreRegOf(p,null,R.pos||null)[R.k]||0, c=C.s[R.k]; if(v>0&&(!c||v>c[0]))C.s[R.k]=[v,p.n,y] });
      (U.roster[t]||[]).forEach(p=>{ if(!p)return; let v=0; (p.hist||[]).forEach(h=>{ if(h.t===t&&h.s)v+=h.s[R.k]||0 }); const c=C.c[R.k]; if(v>0&&(!c||v>c[0]||c[1]===p.n))C.c[R.k]=c&&c[1]!==p.n&&v<=c[0]?c:[v,p.n] }) }) });
  // the champion, and how long it had been
  const ch=SEA.champion;
  if(ch){ const was=lo.last[ch]!=null?lo.last[ch]:L.last[ch], prev=lo.ch.filter(x=>x[0]<y).sort((a,b)=>b[0]-a[0]);
    let run=0; for(const x of prev){ if(x[0]===y-1-run&&x[1]===ch)run++; else break }
    let line="";
    if(run>=1)line=run===1?`${ch} win it again: back-to-back ${L.titleWord}s.`:`${ch} make it ${["","","","three","four","five","six","seven","eight"][run+1]||run+1} in a row.`;
    else if(was===0)line=`The first ${L.titleWord} in ${lorePoss(ch)} history.`;
    else if(was&&y-was>=15)line=`${lorePoss(ch)} first ${L.titleWord} since ${loreYs(was)}: ${y-was} years.`;
    else{ const n=prev.filter(x=>x[1]===ch&&x[0]>y-10).length; if(n>=2)line=`${lorePoss(ch)} ${["","","third","fourth","fifth","sixth"][n+1]||(n+1)+"th"} ${L.titleWord} in ten years.`;
      else if(was)line=`${ch} win the ${L.titleWord}, their first since ${loreYs(was)}.` }
    lo.ch.push([y,ch]); if(lo.ch.length>40)lo.ch=lo.ch.slice(-40); lo.last[ch]=y;
    news.push(["gold",line||`${ch} are the champions.`,""]) }
  // rivalries grown in the postseason (soccer: the title race)
  const pairs={};
  if(LEAGUE.draws&&typeof SEA.table==="function"){ const tb=SEA.table(LEAGUE.conf.order[0]); if(tb&&tb.length>1)pairs[[tb[0],tb[1]].sort().join("|")]=tb[0] }
  else if(typeof SEA.postPools==="function")(SEA.postPools()||[]).forEach(pool=>{ const w={};
    (pool||[]).forEach(g=>{ if(!g||!g.home||!g.away)return; const k=[g.home,g.away].sort().join("|"); w[k]=w[k]||{}; if(g.winner)w[k][g.winner]=(w[k][g.winner]||0)+1 });
    Object.keys(w).forEach(k=>{ const ab=k.split("|"); pairs[k]=(w[k][ab[0]]||0)>=(w[k][ab[1]]||0)?ab[0]:ab[1] }) });
  Object.keys(pairs).forEach(k=>{ const r=lo.riv[k]||[0,0,y,y], a=k.split("|")[0]; r[0]++; if(pairs[k]===a)r[1]++; r[2]=y; lo.riv[k]=r });
  { const ks=Object.keys(lo.riv); if(ks.length>60)ks.sort((a,b)=>lo.riv[a][2]-lo.riv[b][2]).slice(0,ks.length-60).forEach(k=>delete lo.riv[k]) }
  // awards night, banked: the winners, and the honours men carry
  const aw=loreAwards();
  aw.slice(0,L.sides?2:1).forEach(a=>{ if(a.w&&!a.w.pos&&!a.vote&&!a.f.length)return;
    news.push([a.w.t===S.myTeam?"gold":"muted",`${a.name}: ${a.w.n} (${a.w.t})`,a.vote?`${a.w.pts} points, ${a.w.fp} of ${a.voters} first-place votes${a.f[0]?`; ${a.f[0].n} was second with ${a.f[0].pts}`:""}.`:(a.w.line?a.w.line+".":"")]) });
  if(aw.length){ lo.aw.push([y,aw.map(a=>[a.name,a.w.n,a.w.t,a.w.pos||""])]); if(lo.aw.length>30)lo.aw=lo.aw.slice(-30) }
  loreHonours();
  // each club's win share, for next year's coach of the year
  const rg=L.college?SEA.rec:(SEA.regRec||SEA.rec); lo.lw={};
  NAMES.forEach(t=>{ if(!loreTop(t)||!rg[t])return; lo.lw[t]=Math.round(1000*rg[t][0]/Math.max(1,rg[t][0]+rg[t][1])) });
  // records fallen this season, for the summer's news
  lo.fall.filter(f=>f[0]===y).forEach(f=>news.push(["flag",
    f[2]==="s"?(f[3]===f[4]?`${f[3]} ${LEAGUE.draws?"took":"won"} ${loreN(f[5])} ${loreLabel(f[1])==="wins"?"games":loreLabel(f[1])}, a league record`:`${f[3]} (${f[4]}) set the single-season record: ${loreN(f[5])} ${loreLabel(f[1])}`)
      :`${f[3]} (${f[4]}) is the career leader in ${loreLabel(f[1])}`,
    `The old mark: ${loreN(f[6])}, ${f[7]}${f[8]?", "+loreYs(f[8]):""}.${f[9]?" It fell on "+f[9]+".":""}`]));
  _loreBefore={y:y,news:news,list:[]};
  NAMES.forEach(t=>(U.roster[t]||[]).forEach((p,i)=>{ if(p)_loreBefore.list.push([p,t]) }));
}

/* ---- the summer (endSeason, after the offseason has run): who retired, the Hall of Fame, the carousel ---- */
function loreSummer(off){
  if(!loreOn()||!U||!U.lore||!_loreBefore)return;
  const L=LEAGUE.lore, lo=U.lore, B=_loreBefore, y=B.y, news=B.news, hu=loreHumans(); _loreBefore=null;
  // the summer copies the rosters, so a man is matched by his name (unique in a pro league; college: anywhere)
  const now=new Set(); NAMES.forEach(t=>(U.roster[t]||[]).forEach(p=>{ if(p)now.add(p.n) }));
  const H=L.hof||{}, gone=[];
  B.list.forEach(([p,t])=>{ if(now.has(p.n))return; const v=loreValue(p); gone.push({p:p,t:t,v:v}) });
  gone.sort((a,b)=>b.v-a.v);
  // farewells: the league's best careers to end this year
  gone.slice(0,L.college?1:3).forEach(x=>{ const p=x.p, n=loreSeasons(p); if(x.v<(H.v||9)*0.35||(!L.college&&n<8))return;
    news.push(["muted",L.college?`${p.n} of ${x.t} finishes his college career`:`${p.n} retires after ${n} seasons`,(loreLine(p,!L.college)||lorePosOf(p))+(p.hon&&p.hon.m?`. ${p.hon.m===1?"An":p.hon.m} ${LEAGUE.awards.mvp}${p.hon.m===1?"":"s"}.`:".")]) });
  // the Hall of Fame's pool: the careers worth a vote
  gone.forEach(x=>{ const p=x.p; if(x.v<(H.v||9)*0.5)return; if(H.aa&&!(p.hon&&p.hon.a))return;
    const mt=loreMainTeam(p,x.t); lo.elig.push({n:p.n,p:lorePosOf(p),t:mt.t,y:y,v:x.v,l:loreLine(p),a:(p.hon&&p.hon.a)||0,m:(p.hon&&p.hon.m)||0});
    // his club retires his number (soccer: no; college: four years make a legend)
    const sh=p.sh; if(LEAGUE.draws||sh==null)return;
    if(x.v>=(H.v||9)*0.8&&mt.n>=(L.college?3:6)){ const N=lo.num[mt.t]=lo.num[mt.t]||[]; if(N.some(z=>z[0]===sh)||N.length>=12)return;
      N.push([sh,p.n,y]); news.push(["muted",`${mt.t} will retire No. ${sh} for ${p.n}`,""]) } });
  lo.elig.sort((a,b)=>b.v-a.v); if(lo.elig.length>60)lo.elig=lo.elig.slice(0,60);
  // the ballot: waited long enough, by the sport's rule, best first
  const cy=L.yOff?y:y+1, ok=e=>cy-e.y>=(H.wait||5)+(L.yOff?0:1);
  const ballot=lo.elig.filter(ok).sort((a,b)=>b.v-a.v), cls=[];
  ballot.forEach(e=>{ if(cls.length<(H.max||4)&&e.v>=(H.v||9))cls.push(e) });
  ballot.forEach(e=>{ if(cls.length<(H.min||0)&&cls.indexOf(e)<0&&e.v>=(H.v||9)*0.6)cls.push(e) });
  cls.forEach((e,i)=>{ const pct=H.pct?Math.min(99.4,H.pct+5+(e.v-(H.v||9))*2.2+(cls.length-i)*0.6):0;
    lo.hof.push([cy,e.n,e.p,e.t,e.l,pct?Math.round(pct*10)/10:0]) });
  if(lo.hof.length>200)lo.hof=lo.hof.slice(-200);
  // off the ballot: in, or out of time (the baseball writers' ten years; elsewhere twenty)
  lo.elig=lo.elig.filter(e=>cls.indexOf(e)<0&&!(ok(e)&&cy-e.y-(H.wait||5)>=(H.years||20)));
  if(cls.length)news.push(["gold",`The ${H.name}'s class of ${cy}: ${cls.map(e=>e.n).join(", ")}`,
    cls.map(e=>`${e.n} (${e.t}, ${e.p}): ${e.l}${H.pct?`, ${loreN(lo.hof.find(h=>h[0]===cy&&h[1]===e.n)[5])}% of the vote`:""}`).join(". ")+"."]);
  // the carousel: in season and after it (yours is on your own page)
  // (the top flight's, and your own division's: soccer's lower leagues fire as often, and would bury the rest)
  const myG=CONF[S.myTeam], mid=loreMid(), midN=mid.filter(m=>!hu.has(m.t)&&(loreTop(m.t)||CONF[m.t]===myG));
  midN.slice(0,4).forEach(m=>news.push(["flag",`${m.t} fired ${m.n} in season`,`${m.w}-${m.l}${LEAGUE.draws?"-"+m.d:""} at the time. ${m.i} took over.`]));
  if(midN.length>4)news.push(["flag",`${midN.length-4} more ${midN.length-4===1?"coach":"coaches"} fired in season`,midN.slice(4).map(m=>m.t).join(", ")+"."]);
  const fired=((off&&off.fired)||[]).filter(t=>!hu.has(t)&&loreTop(t)&&!mid.some(m=>m.t===t));
  if(fired.length)news.push(["flag",`${fired.length} ${fired.length===1?"club":"clubs"} changed coach after the season`,
    fired.slice(0,6).join(", ")+(fired.length>6?` and ${fired.length-6} more`:"")+"."]);
  ((off&&off.retired)||[]).filter(r=>loreTop(r.team)).slice(0,2).forEach(r=>news.push(["muted",`${r.name} retires from ${r.team} after ${r.t} seasons`,""]));
  ((off&&off.poached)||[]).filter(x=>loreTop(x.to)).slice(0,2).forEach(x=>news.push(["muted",`${x.to} hired ${x.name} away from ${x.from}`,""]));
  lo.news.push({y:y,it:news.slice(0,14)}); if(lo.news.length>2)lo.news=lo.news.slice(-2);
}

/* ---- in season: the league's news this week ---- */
function loreWeekNews(my){
  if(!loreOn()||!SEA||!SEA.roster)return [];
  const out=[], L=LEAGUE.lore, st=SEA.step-1, y=loreY();
  // a coach fired this week
  loreMid().filter(m=>(m.s===st+1||m.s===st)&&(loreTop(m.t)||CONF[m.t]===CONF[my])).slice(0,2).forEach(m=>{ if(m.t===my)return;
    out.push({p:64,k:"fired",tone:"flag",h:`${m.t} fire ${m.n}`,b:`${m.w}-${m.l}${LEAGUE.draws?"-"+m.d:""} and short of what the club expected. ${m.i} takes over for now.`}) });
  // a record falls this week (the regular season)
  if(st>=0&&(L.college||st<LEAGUE.weeks))L.recs.forEach(R=>{ if(R.team||!R.s)return; const cur=loreRec(R.k,"s"); if(!cur)return;
    const ch=[]; NAMES.forEach(t=>{ if(!loreTop(t))return; (SEA.roster[t]||[]).forEach(p=>{ if(p&&p.st2&&(p.st2[R.k]||0)>cur[0])ch.push([p,t]) }) });
    // the first man past it this season breaks it; one who passes it later passes him, not the record
    const pre=ch.map(([p,t])=>[p,t,loreRegOf(p,st+1,R.pos||null)[R.k]||0,loreRegOf(p,st,R.pos||null)[R.k]||0]);
    if(pre.some(x=>x[3]>cur[0]))return;
    pre.forEach(([p,t,a,b])=>{
      if(a>cur[0]&&b<=cur[0])out.push({p:t===my?95:78,k:"record",tone:t===my?"gold":"flag",h:`${p.n} breaks the single-season record for ${loreLabel(R.k)}`,
        b:`${loreN(a)} for ${t}, past ${lorePoss(cur[1])} ${loreN(cur[0])}${cur[3]?" ("+loreYs(cur[3])+")":""}.`}) }) });
  // a playoff meeting with history
  const W=SEA.weeks[st]; if(W&&st>=LEAGUE.weeks&&U.lore&&U.lore.riv)(W.games||[]).forEach(g=>{ const r=U.lore.riv[[g.home,g.away].sort().join("|")];
    if(!r||r[0]<2||out.some(x=>x.k==="rivpo"))return;
    out.push({p:g.home===my||g.away===my?86:60,k:"rivpo",tone:"flag",h:`${g.home} and ${g.away} meet in the postseason again`,
      b:`Their ${ordinal(r[0]+1)} meeting since ${loreYs(r[3])}.`}) });
  return out }

/* ---- screens ---- */
function loreNightHTML(){
  const A=loreAwards(); if(!A.length)return "";
  return `<div class="grouphead">Awards night &middot; ${esc(loreYs(loreY()))}</div>`+A.map(a=>{
    const w=a.w, fin=a.f&&a.f.length?`<div class="nb">${a.vote?"Finalists":"Also shortlisted"}: ${a.f.map(x=>esc(x.n)+" ("+esc(x.t)+(a.vote?", "+x.pts+" points":"")+")").join(", ")}.</div>`:"";
    return `<div class="news ${w.t===S.myTeam?"gold":"muted"}"><div class="nh">${esc(a.name)}: ${esc(w.n)}, ${esc(w.t)}</div>
      <div class="nb">${w.line?esc(w.line)+". ":""}${a.vote?`${w.pts} points, ${w.fp} of ${a.voters} first-place votes.`:""}</div>${fin}</div>` }).join("") }
function loreSummerHTML(){
  if(!U||!U.lore||!U.lore.news||!U.lore.news.length)return "";
  const N=U.lore.news[U.lore.news.length-1]; if(!N.it.length)return "";
  return `<div class="grouphead">Around the league &middot; ${esc(loreYs(N.y))}</div>`+N.it.map(x=>`<div class="news ${x[0]}"><div class="nh">${esc(x[1])}</div>${x[2]?`<div class="nb">${esc(x[2])}</div>`:""}</div>`).join("") }
let loreTab="book";
function loreBookHTML(){
  if(!LEAGUE.lore)return `<div class="note">No record book in this game.</div>`;
  const L=LEAGUE.lore, lo=(U&&U.lore)||{rec:{},car:{},hof:[],aw:[],ch:[],num:{},riv:{},club:{},last:{},fall:[]}, my=S.myTeam;
  if(!eng27()&&!U.lore)return `<div class="note">The record book opens with the next season.</div>`;
  let h=`<div class="subtabs">${[["book","Records"],["hof","Hall of Fame"],["aw","Awards"],["titles","Titles"]].map(([k,l])=>`<button class="subtab" data-lt="${k}" aria-pressed="${loreTab===k}">${l}</button>`).join("")}</div>`;
  const row=(a,b,c)=>`<div class="stop"><span class="stopteam">${a}</span><span class="stopyr">${b||""}</span><span class="stoprec">${c||""}</span></div>`;
  if(loreTab==="book"){
    h+=`<div class="grouphead">Single season</div>`+L.recs.filter(R=>R.s).map(R=>{ const r=loreRec(R.k,"s"); if(!r)return "";
      return row(esc((R.team?"Most ":"")+loreLabel(R.k))+": "+loreN(r[0]),esc(R.team?r[1]:r[1]+", "+r[2]),esc(loreYs(r[3]))+(r[4]?" &middot; "+esc(r[4]):"")) }).join("");
    h+=`<div class="grouphead">Career</div>`+L.recs.filter(R=>R.c).map(R=>{ const r=loreRec(R.k,"c");
      return row(esc(loreLabel(R.k))+": "+loreN(r[0]),esc(r[1]),esc(lo.car[R.k]?"since "+loreYs(r[3]):"through "+loreYs(r[3]))) }).join("");
    const C=lo.club&&lo.club[my];
    if(C){ h+=`<div class="grouphead">${esc(my)}: club records since the game began</div>`+L.recs.map(R=>{ const s=C.s[R.k], c=C.c[R.k];
      return (s?row(esc((R.team?"Most ":"")+loreLabel(R.k))+" in a season: "+loreN(s[0]),esc(R.team?"":s[1]),esc(loreYs(s[2]))):"")+(c?row(esc(loreLabel(R.k))+" with the club: "+loreN(c[0]),esc(c[1]),""):"") }).join("") }
    const F=(lo.fall||[]).slice(-8).reverse();
    if(F.length)h+=`<div class="grouphead">Records fallen</div>`+F.map(f=>row(esc(f[3])+" &middot; "+loreN(f[5])+" "+esc(loreLabel(f[1]))+(f[2]==="c"?" (career)":""),esc(f[4]===f[3]?"":f[4]),esc(f[9]||loreYs(f[0])))).join("");
    const N=(lo.num&&lo.num[my])||[];
    if(N.length)h+=`<div class="grouphead">${esc(my)}: retired numbers</div>`+N.map(z=>row("No. "+z[0],esc(z[1]),esc(loreYs(z[2])))).join("");
  }
  if(loreTab==="hof"){
    const H=(lo.hof||[]).slice().reverse();
    h+=`<div class="grouphead">${esc((L.hof&&L.hof.name)||"Hall of Fame")}</div>`;
    h+=H.length?H.slice(0,40).map(x=>row(esc(x[1])+" &middot; "+esc(x[2]),esc(x[3]),"Class of "+x[0]+(x[5]?" &middot; "+loreN(x[5])+"%":""))+`<div class="fnote" style="padding:0 0 6px 0">${esc(x[4])}</div>`).join("")
      :`<div class="note">No class yet: a career here has to end, and the ${esc((L.hof&&L.hof.name)||"Hall")} waits ${(L.hof&&L.hof.wait)||5} years after it.</div>`;
    const E=(lo.elig||[]).slice(0,6);
    if(E.length)h+=`<div class="grouphead">Waiting</div>`+E.map(e=>row(esc(e.n)+" &middot; "+esc(e.p),esc(e.t),"last played "+esc(loreYs(e.y)))).join("");
    const mine=(lo.hof||[]).filter(x=>x[3]===my);
    if(mine.length)h+=`<div class="grouphead">${esc(my)} legends</div>`+mine.map(x=>row(esc(x[1]),esc(x[2]),"Class of "+x[0])).join("");
  }
  if(loreTab==="aw"){
    const A=(lo.aw||[]).slice(-10).reverse();
    h+=A.length?A.map(s=>`<div class="grouphead">${esc(loreYs(s[0]))}</div>`+s[1].map(a=>row(esc(a[0]),esc(a[1]),esc(a[2]))).join("")).join("")
      :`<div class="note">The first awards night comes at the end of this season.</div>`;
  }
  if(loreTab==="titles"){
    const C=(lo.ch||[]).slice().reverse();
    if(C.length)h+=`<div class="grouphead">Champions</div>`+C.slice(0,20).map(c=>row(esc(c[1]),"",esc(loreYs(c[0])))).join("");
    const y=SEA?loreY():0, last=t=>lo.last&&lo.last[t]!=null?lo.last[t]:L.last[t];
    const D=NAMES.filter(t=>loreTop(t)&&last(t)!=null).map(t=>({t:t,y:last(t)})).sort((a,b)=>(a.y||0)-(b.y||0)||a.t.localeCompare(b.t)).slice(0,8);
    h+=`<div class="grouphead">Longest waits</div>`+D.map(d=>row(esc(d.t),"",d.y?"last won "+esc(loreYs(d.y)):"never")).join("");
    const R=Object.keys(lo.riv||{}).map(k=>[k,lo.riv[k]]).filter(x=>x[1][0]>=2).sort((a,b)=>b[1][0]-a[1][0]||b[1][2]-a[1][2]).slice(0,6);
    if(R.length)h+=`<div class="grouphead">${LEAGUE.draws?"Title races":"Postseason rivalries"}</div>`+R.map(([k,r])=>{ const ab=k.split("|");
      return row(esc(ab[0]+" and "+ab[1]),r[0]+" meetings",LEAGUE.draws?"":esc(ab[0])+" won "+r[1]+", "+esc(ab[1])+" "+(r[0]-r[1])) }).join("");
    h+=`<div class="fnote">${esc(myTitleLine(my,last(my),y))}</div>`;
  }
  return h }
function myTitleLine(t,last,y){ const w=LEAGUE.lore.titleWord;
  return last===0?`${t} have never won the ${w}.`:last?`${t} last won the ${w} in ${loreYs(last)}${y-last>1?`, ${y-last} years ago`:""}.`:"" }
