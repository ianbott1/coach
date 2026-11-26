/* ============ game screens: basketball ============ */
/* The scoreboard (visitors first, as on any arena's clock), the run of play
   segment by segment with names, the shot chart each read is made from, the
   call screen with the staff's advice, and the replay view. */

/* ---- names ---- */
/* the spot whose man the run of play names for a three or a bucket inside: a fixed pattern by the event's number (the
   two guards and the wing took every named three, however the roster shot); engine 26 (stats): by the shares the box
   score uses (position, rating, Shooting or Finishing), still by the event's number, so the clip and the box agree */
function bbSlot(team,kind,u){ u=u||0;
  if(typeof ENGINE_V==="undefined"||ENGINE_V<26)return kind==="three"?[1,2,0,1,2][u%5]:[4,3,4,2][u%4];
  const R=typeof SEA!=="undefined"&&SEA&&SEA.roster&&SEA.roster[team]; if(!R)return kind==="three"?[1,2,0,1,2][u%5]:[4,3,4,2][u%4];
  const k=kind==="three"?"tpm":"pts2", W=POS.map((P,i)=>{ const p=R[i]; if(!p)return 0; const r=ROLE26[P.p]||ROLE[P.p];
    return (k==="tpm"?r.tpm:r.pts)*Math.pow(Math.max(0.55,1+(p.r-60)/20*BB_SLOPE26),2)*bbLean(p,k) }), T=W.reduce((a,b)=>a+b,0);
  let x=((u*0.6180339887+0.31)%1)*T, i=0; while(i<4&&x>=W[i]){ x-=W[i]; i++ } return i }
function bbPlayer(team,i,u,bn,off){
  const R=SEA.roster&&SEA.roster[team]; if(!R)return null;
  // an injured player isn't on the floor (Grokbot: "OUT 4 more weeks", and he hit threes)
  const hurt=new Set(SEA.talent?SEA.talent.active(team).map(x=>x.idx):[]);
  const p=hurt.has(i)?null:R[i], b=hurt.has(BK(i))?null:R[BK(i)]; let pick=(b&&(bn||(u%10)<2))||!p?b:p;   // bn: the bench is in (round 93)
  // review round (playtest: a star "buries a three" while he sat with three fouls): the man sitting (off) isn't on the
  // floor either: his backup has it, or with no backup the next starter
  if(pick&&off&&pick.n===off)pick=b&&b!==pick?b:(()=>{ for(let k=1;k<5;k++){ const j=(i+k)%5, q=hurt.has(j)?null:R[j]; if(q&&q.n!==off)return q } return null })();
  return pick?pick.n:null;
}
/* the star a stretch has on the bench (foul trouble, fouled out), by name: the engine's star sits from the stretch it is
   called to the half (d.star: fouls, on the floor, fouled out) */
function bbOff(d,side,team){ try{ const x=d&&d.star&&d.star[side]; return x&&(x[1]===false||x[2])?bbStar(team):null }catch(e){ return null } }
function bbStar(team){ const R=SEA.roster&&SEA.roster[team]; if(!R)return "his star";
  const hurt=new Set(SEA.talent?SEA.talent.active(team).map(x=>x.idx):[]);
  let best=-1; for(let i=0;i<5;i++)if(R[i]&&!hurt.has(i)&&(best<0||R[i].r>R[best].r))best=i; return best>=0?R[best].n:"his star" }
// a surname shared on the ice or pitch gets its initial ("Sissoko scored on Sissoko": Instinct)
const surname=n=>{ if(!n)return ""; const L=n.split(" ").slice(-1)[0]; try{ const g=typeof live!=="undefined"&&live&&live.g; if(g&&typeof surnameIn==="function")return surnameIn(n,g) }catch(e){} return L };
const ordw=n=>["","first","second","third","fourth","fifth","sixth"][n]||n+"th";
const BB_CUE={
  threes:["{t} letting it fly from deep again","Another kick-out three for {t}","{t} spacing the floor and hunting threes"],
  paint:["{t} pound it inside again","{t} living in the paint","Another post touch for {t}"],
  pnr:["{t} run high pick-and-roll again","Ball screen, ball screen: {t} keep running it","{t} attack off the high screen"]
};
function pickOf(a,u){return a[u%a.length]}
function bbEventText(g,e,d){
  const surname=n=>surnameIn(n,g);   // an initial when both sides have the surname
  const tm=e.side==="home"?g.home:g.away, u=e.u||0, bn=!!(d&&d.bn&&d.bn[e.side]);
  const off=bbOff(d,e.side,tm);
  if(e.k==="three"){ const n=bbPlayer(tm,bbSlot(tm,"three",u),u,bn,off); return {team:tm,tag:"",text:e.n>1?`${e.n} threes in the stretch, ${surname(n)} with one`:`${n} buries a three`} }
  if(e.k==="inside"){ const n=bbPlayer(tm,bbSlot(tm,"inside",u),u,bn,off); return {team:tm,tag:"",text:`${e.n} buckets inside, ${surname(n)} with an and-one`} }
  if(e.k==="foul"){ const n=bbStar(tm); return {team:tm,tag:e.f>=BB.foulOut-2?"FOULS":"",text:`${n} picks up his ${ordw(e.f)} foul`} }
  if(e.k==="sit"){ return {team:tm,tag:"BENCH",text:e.again?`${bbStar(tm)} stays on the bench to start the half, still on ${e.f} fouls`:`${bbStar(tm)} heads to the bench with ${e.f} fouls`} }   // review round: the second sit on the same fouls read as a repeat
  if(e.k==="out"){ return {team:tm,tag:"FOULED OUT",text:`${bbStar(tm)} has fouled out`} }
  if(e.k==="to")return {team:tm,tag:"TIMEOUT",text:`${e.mine?"Timeout":"Timeout to stop the run"}${e.left!=null?` (${e.left} left)`:""}`};
  if(e.k==="rot")return {team:tm,tag:"BENCH",text:e.rot==="tight"?"Tighten the rotation: the starters play heavy minutes":e.rot==="deep"?"Go deep into the bench: fresh legs, more minutes for the second unit":"Back to the usual rotation"};
  if(e.k==="cue")return {team:tm,tag:"",text:pickOf(BB_CUE[e.cue],u).replace("{t}",tm),cue:true};
  return {team:tm,tag:"",text:""};
}
const shown=e=>e.k!=="cue"||((e.u||0)%3===0);
function segLabel(d){ return d.seg==="last"?"Last shot":segClock(d.seg) }
function rowsOf(g,drives){
  const rows=[];
  drives.forEach(d=>{
    if(d.seg==="last"){ const tm=d.side==="home"?g.home:g.away;
      rows.push({m:"0:02",team:tm,tag:d.made?"GOOD":"MISS",text:`${bbPlayer(tm,0,7)||"The point guard"} ${d.choice==="three"?"pulls up from three":"drives for two"}: ${d.made?"good!":"no good."}`,h:d.sh,a:d.sa,goal:d.made});
      return }
    const lab=segClock(d.seg);
    (d.ev||[]).filter(shown).forEach(e=>{ const t=bbEventText(g,e,d); rows.push({m:lab,team:t.team,tag:t.tag,text:t.text,h:d.sh,a:d.sa,cue:t.cue}) });
    const run=Math.abs(d.h-d.a)>=8, tm=d.h>=d.a?g.home:g.away;
    rows.push({m:lab,team:run?tm:"",tag:run?"RUN":"",text:run?`a ${Math.max(d.h,d.a)}-${Math.min(d.h,d.a)} stretch`:`${d.h}-${d.a} stretch, ${g.home} first`,h:d.sh,a:d.sa,seg:true,run:run});
  });
  return rows;
}
function driveScript(g,drives){ return rowsOf(g,drives).map(r=>({clock:r.m,team:r.team,outcome:r.tag,text:r.text,h:r.h,a:r.a,cue:r.cue,seg:r.seg})) }
/* a computer game: eight segments that add up to the final score */
function gameScript(g,rosterHome,rosterAway,seed){
  const rng=new RNG(seed), n=8, out=[];
  const split=(tot)=>{const w=Array.from({length:n},()=>0.6+rng.r()); const W=w.reduce((a,b)=>a+b,0);
    const v=w.map(x=>Math.floor(tot*x/W)); let r=tot-v.reduce((a,b)=>a+b,0); while(r-->0)v[rng.int(n)]++; return v};
  const hs=split(g.hp), as=split(g.ap); let sh=0,sa=0;
  for(let s=0;s<n;s++){sh+=hs[s]; sa+=as[s];
    const ev=rng.r()<0.4?[{side:rng.r()<0.5?"home":"away",k:"three",n:1,u:rng.int(100)}]:[];
    out.push({seg:s,h:hs[s],a:as[s],sh:sh,sa:sa,ev:ev})}
  return driveScript(g,out);
}
function liveGapFor(L,mult){
  const d=L.drives[L.drives.length-1];
  const n=d&&d.ev?d.ev.filter(shown).length:0;
  return Math.max(110,Math.round((1500+n*450)*0.52/mult));
}

/* ---- the scoreboard: visitors first ---- */
function scoreTop(g,H,A,label,cls,extra){
  return `<div class="wtop ${cls||""}">
    <div class="wlabel">${label}</div>
    <div class="wscore">
      <div class="wside ${A>H?'lead':''}"><span class="wt">${esc(g.away)}</span><span class="wn">${A}</span></div>
      <div class="wside ${H>A?'lead':''}"><span class="wt">${esc(g.home)}</span><span class="wn">${H}</span></div>
    </div>${extra||""}</div>`;
}
/* the flow: the lead after each segment, a line above the middle for the visitors */
function flowSVG(g,drives){
  const segs=drives.filter(d=>typeof d.seg==="number"), W=300, H=44, mid=H/2, n=Math.max(8,segs.length), bw=W/n;
  const ac=teamInk(g.away), hc=teamInk(g.home);
  const bars=segs.map((d,i)=>{ const v=d.a-d.h, h=Math.min(mid-2,Math.abs(v)*1.2+1);
    return `<rect x="${(i*bw+2).toFixed(1)}" y="${(v>=0?mid-h:mid).toFixed(1)}" width="${(bw-4).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${v>=0?ac:hc}"/>`}).join("");
  return `<div class="mom"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Each stretch">
    <line x1="0" y1="${mid}" x2="${W}" y2="${mid}" stroke="var(--line)"/>
    <line x1="${W/2}" y1="2" x2="${W/2}" y2="${H-2}" stroke="var(--line)" stroke-dasharray="2 3"/>${bars}</svg>
    <div class="momkey"><span style="color:${ac}">${esc(g.away)}</span><span>each stretch</span><span style="color:${hc}">${esc(g.home)}</span></div></div>`;
}
function liveScoreboard(){
  const g=live.g, my=S.myTeam, H=liveH(), A=liveA();
  const held=live.hold&&!live.ask, last=held?live.drives[live.hold.n-1]:live.drives[live.drives.length-1];   // round 93: while the score is held, the clock is the held one (pro basketball read END OF Q4 at 84-94, then finished 105-106)
  const lab=`<span class="live"></span>${live.hold&&!live.ask&&live.hold.clock?esc(live.hold.clock):!last?"TIP-OFF":esc(segLabel(last))}
      ${g.label?" &middot; "+esc(liveLabel(g)):(g.neutral?"":(g.home===my?" &middot; at home":" &middot; on the road"))}`;
  return scoreTop(g,H,A,lab,"",flowSVG(g,live.drives));
}

/* ---- the evidence ---- */
function evidenceHTML(g,my,d,dp){
  if(dp.k==="prep"){ const opp=g.home===my?"away":"home", R=dp.report, n=dp.n||6;
    return `<div class="evid"><div class="evh">${esc(g[opp])}: their last ${n} games</div>${styleRosterLine(g[opp])}
      ${STYLE_KEYS.map(k=>`<div class="evr"><span class="evk">${esc(STYLE[k].l)}</span><span class="evv">${R[k]} of ${n}</span></div>`).join("")}
      <div class="evn">Most teams have a way they like to score, but not every night. Get it right and the work you did in practice shows; get it wrong and you're out of position until you change it.</div>${splitNote(R)}</div>`; }
  // crunch time: their close finishes beside what they've run tonight
  if(dp.k==="close"){ const opp=g.home===my?"away":"home", R=dp.report, n=dp.n||6;
    return `<div class="evid"><div class="evh">${esc(g[opp])}: their last ${n} close finishes</div>
      ${STYLE_KEYS.map(k=>`<div class="evr"><span class="evk">${esc(STYLE[k].l)}</span><span class="evv">${R[k]} of ${n}</span></div>`).join("")}
      <div class="evn">Close teams often go to a closing play of their own. Some stay with whatever's working.</div>${splitNote(R)}</div>`
      +(d&&d.T?evidenceHTML(g,my,d,{k:"read"}).replace("How "+esc(g[opp])+" are scoring","What they've run tonight"):""); }
  // foul trouble: how tight tonight's referees are, against an ordinary crew by now (round 44)
/* the rule, said (round 48, Muse: "a rule the player can learn beats a lottery"): once a half, at a set count */
function foulRule(){ const o=BB.foulOut; return `Foul trouble comes to you once a half: a star with ${o-3} fouls or more before half-time, ${o-2} or more after it. Your assistant takes the ones not worth asking.` }
  if(dp.k==="fouls"){ const tight=dp.called>dp.avg*1.2, loose=dp.called<dp.avg*0.85;
    return `<div class="evid"><div class="evh">Tonight's referees</div>
      <div class="evr"><span class="evk">Fouls called on your team</span><span class="evv">${dp.called}</span></div>
      <div class="evr"><span class="evk">An ordinary crew, by now</span><span class="evv">about ${dp.avg}</span></div>
      <div class="evr"><span class="evk">Your star</span><span class="evv">${dp.f} of ${dp.out}</span></div>
      ${dp.rot&&dp.rot!=="normal"?`<div class="evr"><span class="evk">Your rotation</span><span class="evv">${dp.rot==="tight"?"tight: he's out there more":"deep: he's out there less"}</span></div>`:""}
      <div class="evn">${tight?"A tight crew: every bump is a whistle tonight.":loose?"A loose crew: they're letting them play.":"An ordinary crew so far."} Sitting him costs you now; a fifth foul costs you the finish, when he matters most.</div>
      <div class="evn">${foulRule()}</div></div>` }
  // round 111: behind in the last minute: their free throws tonight against the league's
  // (not tonight's free throws: a hot or cold night at the line says nothing about the next two, and the card says only
  // what bears on the call)
  if(dp.k==="defend"){ const opp=g.home===my?"away":"home";
    return `<div class="evid"><div class="evh">${esc(g[opp])} at the line</div>
      <div class="evr"><span class="evk">Free throws, the league over</span><span class="evv">${dp.avg}%</span></div>
      <div class="evr"><span class="evk">You're down</span><span class="evv">${dp.down}</span></div>
      <div class="evn">Fouling stops the clock and buys you more trips down the floor, at the price of their free throws. Playing it out lets them run a possession down, and gets you one more of your own.</div></div>` }
  // round 111: a timeout: how many you have, what one does, and (when the defense is this call's) what they're running
  if(dp.k==="timeout"||dp.k==="tomine"){
    return `<div class="evid"><div class="evh">Your timeouts</div>
      <div class="evr"><span class="evk">${dp.k==="tomine"?"Left after this one":"Left"}</span><span class="evv">${dp.left} of ${BB_GD.timeouts}</span></div>
      <div class="evn">${timeoutNote()}</div></div>`+(d&&d.T&&(dp.k==="tomine"||dp.withDef)?evidenceHTML(g,my,d,{k:"read"}):"") }
  if(dp.k!=="read"||!d||!d.T)return "";
  const opp=g.home===my?"away":"home", T=d.T[opp], n=Math.max(1,T.n), f=Math.max(1,T.fga);
  const share=Math.round(100*T.tpa/f), scr=(T.pnr/n*2).toFixed(1), paint=(T.paint/n*2).toFixed(1);
  // each number beside a team that isn't playing that way, measured on this engine (Nov 2026; the paint
  // had none: Instinct; pro threes read 38% against a measured 43%)
  const AV=BB.quarters?{three:43,paint:"14.0",pnr:"4.1"}:{three:39,paint:"9.9",pnr:"4.2"};
  // each row says what it measures: the share is the whole game so far, the other two a rate (Grokbot:
  // "18 of 43" under a "per ten minutes" header, counts that read as 40 threes a half)
  const per=BB.quarters?"a quarter":"every ten minutes";
  return `<div class="evid"><div class="evh">How ${esc(g[opp])} are scoring</div>
    <div class="evr ${share>=45?'hi':share<=31?'lo':''}"><span class="evk">Their shots from three, so far</span><span class="evv">${share}%</span></div>
    <div class="evr ${+paint>=bbPaintMark()[0]?'hi':+paint<=bbPaintMark()[1]?'lo':''}"><span class="evk">Points in the paint, ${per}</span><span class="evv">${paint}</span></div>
    <div class="evr ${T.pnr/n>=3.4?'hi':''}"><span class="evk">Pick-and-rolls run, ${per}</span><span class="evv">${scr}</span></div>
    ${firstReadTip()}<div class="evn">League average: ${AV.three}% of shots from three, ${AV.paint} points in the paint, ${AV.pnr} pick-and-rolls ${BB.quarters?"a quarter":"every ten minutes"}. A small sample: a stretch of hot or cold shooting can fool you.</div></div>`;
}

/* round 111: what a timeout does, said plainly (the rule, not the answer) */
function timeoutNote(){ return `A run is mostly hot shooting, and most of it fades on its own; a timeout takes away the little that carries into the next stretch, and it's your chance to change the defense. ${BB.quarters?"The end of a quarter stops a run by itself.":"Half-time stops a run by itself."} Keep one for the last possession and you can draw up the final shot; with none left it's a scramble the length of the floor.` }
/* ---- the run of play ---- */
function playsHTML(drives,my,g,limit){
  let rows=rowsOf(g,drives); if(limit)rows=rows.slice(-limit);
  // round 72: a stretch's rows all ended at its clock, and each said so ("Q1 6:00" three times: Instinct); the clock
  // heads the stretch once
  let prev=null;
  return rows.slice().reverse().map(r=>{ const same=r.m===prev; prev=r.m; return `<div class="play ${r.team===my?'mine':''} ${r.goal||r.run?'goalrow':''} ${r.cue?'cue':''} ${r.seg&&!r.run?'cue':''}${same?' samestretch':''}">
      <span class="pq">${same?"":esc(r.m)}</span>
      <div class="ptxt">${r.team&&!r.cue?`<b>${esc(r.team)}</b> `:""}${esc(r.text)}${r.tag?` <span class="dtag ${/RUN|GOOD/.test(r.tag)?'sc':/OUT|MISS/.test(r.tag)?'rd':'yl'}">${esc(r.tag)}</span>`:""}</div>
      <span class="pscore">${r.a}&ndash;${r.h}</span></div>` }).join("");
}
function liveView(){
  const g=live.g, my=S.myTeam;
  const venue=g.neutral?(g.site||"neutral site"):g.home;
  return `<div class="watchwrap">
    ${liveScoreboard()}
    ${typeof hlBox==="function"?hlBox():""}
    <div class="grouphead">Run of play</div>
    <div class="plays">${playsHTML(live.drives,my,g)||`<div class="empty">${owlMark(40)}<span>Tip-off at ${esc(venue)}&hellip;</span></div>`}</div>
    <div class="actionbar">
      <div class="wspeed">${SPEEDS.map(s=>`<button class="spbtn" data-speed="${s[0]}"
        aria-pressed="${(S.watchSpeed||"normal")===s[0]}">${s[2]}</button>`).join("")}</div>
      <div class="wctl">
        <button class="wbtn" id="wpause">${live.paused?"&#9654; Play":"&#10073;&#10073; Pause"}</button>
        <button class="wbtn ${live.paused?'hot':''}" id="wstep">Next stretch &rarr;</button>
        <button class="wbtn" id="wskip" title="Plays on at once and stops at your next call">Skip to next call</button>
      </div>
      <div class="whint">Space to pause &middot; arrows to step &middot; 1&ndash;4 sets speed</div>
    </div></div>`;
}
function liveCallView(){
  const dp=live.ask.dp, g=live.g, my=live.ask.team||S.myTeam;
  const mine=live.ask.mine, theirs=live.ask.theirs, last=live.drives[live.drives.length-1]||null;
  const whose=!live.h2h?"Your call"
    :esc((my===S.myTeam?S.career.name:S.coaches[live.h2h.coach].career.name)+"'s call · "+my);
  const desc=o=>{ const k=String(o).replace(/^to:/,""); return (dp.k==="read"||dp.k==="prep"||dp.k==="close"||dp.k==="timeout"||dp.k==="tomine")&&DEFENSES[k]?DEFENSES[k].d:"" };
  return `<div class="watchwrap">
    ${liveScoreboard()}
    <div class="callbox">
      <div class="wlabel">${whose}</div>
      <div class="calltitle">${esc(dp.h)}</div>
      <div class="callscore">${esc(my)} ${mine} &middot; ${esc(g.home===my?g.away:g.home)} ${theirs}</div>
      <div class="callsub">${esc(dp.b||"")}</div>
    </div>
    ${evidenceHTML(g,my,last,dp)}
    <div class="grouphead staffhead">The staff room</div>
    <div class="staffroom">${staffAdvice(dp,{mine:mine,theirs:theirs,q:live.drives.length}).map(s=>
      `<div class="say"><span class="facewrap ${s.who}">${staffFaceOf(s.who)}</span>
        <div class="saybody"><span class="sayname">${esc(staffNameOf(s.who))}</span>
        <span class="saytext">${esc(staffLineOf(s.who,s.line))}</span></div></div>`).join("")}</div>
    <div class="callopts">${dp.opts.map(o=>
      `<button class="advance callbtn" data-call="${esc(o[0])}">${esc(o[1])}${desc(o[0])?`<small>${esc(desc(o[0]))}</small>`:""}</button>`).join("")}</div>
    <div class="grouphead">Run of play</div>
    <div class="plays">${playsHTML(live.drives,my,g,5)}</div>
  </div>`;
}

/* ---- replays ---- */
function startWatch(g){
  if(!g||!SEA.roster)return;
  const drives=(g.drives&&g.drives.length)?g.drives:null;
  watch={g:g, script:drives?driveScript(g,drives):gameScript(g,SEA.roster[g.home],SEA.roster[g.away],watchSeed(g)),
         i:-1, paused:(S.watchStep===true)};
  reveal=null;
  tickWatch();
}
function watchView(){
  const g=watch.g, my=S.myTeam;
  const upto=watch.script.slice(0,Math.max(0,Math.min(watch.i+1,watch.script.length)));
  const cur=upto[upto.length-1]||null;
  const H=cur?cur.h:0, A=cur?cur.a:0, done=watch.i>=watch.script.length, tip=watch.i<0;
  const mine=(g.home===my)?H:A, theirs=(g.home===my)?A:H;
  const lab=done?`FINAL${g.ot?" / OT":""} &middot; ${watchRes(g,mine,theirs)}`
        :!done&&watch.hlClock&&typeof HL!=="undefined"&&HL.cur?`<span class="live"></span>${esc(watch.hlClock)}`:tip?`<span class="live"></span>TIP-OFF &middot; ${esc(g.title||g.site||(g.home===my?"at home":"on the road"))}`
        :`<span class="live"></span>${esc(cur.clock)}`;
  return `<div class="watchwrap">
    ${scoreTop(g,H,A,lab,done?(mine>theirs?'win':'loss'):'')}${typeof hlBox==="function"?hlBox():""}
    <div class="grouphead">Run of play</div>
    <div class="plays">${upto.slice().reverse().map(e=>`<div class="play ${e.team===my?'mine':''} ${/RUN|GOOD/.test(e.outcome||"")?'goalrow':''} ${e.cue||(e.seg&&!e.outcome)?'cue':''}">
      <span class="pq">${esc(e.clock)}</span>
      <div class="ptxt">${e.team&&!e.cue?`<b>${esc(e.team)}</b> `:""}${esc(e.text)}${e.outcome?` <span class="dtag ${/RUN|GOOD/.test(e.outcome)?'sc':/OUT|MISS/.test(e.outcome)?'rd':'yl'}">${esc(e.outcome)}</span>`:""}</div>
      <span class="pscore">${e.a}&ndash;${e.h}</span></div>`).join("")
      ||`<div class="empty">${owlMark(40)}<span>Waiting for the tip&hellip;</span></div>`}</div>
    <div class="actionbar">
      ${done?`<button class="advance" id="wdone">Back to the season</button>`
      :`<div class="wspeed">${SPEEDS.map(s=>`<button class="spbtn" data-speed="${s[0]}"
          aria-pressed="${(S.watchSpeed||"normal")===s[0]}">${s[2]}</button>`).join("")}</div>
        <div class="wctl">
          <button class="wbtn" id="wpause">${watch.paused?"&#9654; Play":"&#10073;&#10073; Pause"}</button>
          <button class="wbtn ${watch.paused?'hot':''}" id="wstep">Next &rarr;</button>
          <button class="wbtn" id="wskip">Skip</button>
        </div>
        <div class="whint">Space to pause &middot; arrows to step &middot; 1&ndash;4 sets speed</div>`}
    </div></div>`;
}

/* ---- after the game: were your reads right? ---- */
/* what the evidence said, when it pointed the other way: a read the numbers
   got wrong is a noisy sample, not a coin flip, and the verdict says so */
function readNote(e){
  if(e.k==="read"&&e.unclear)return " The numbers on the card hadn't shown it yet, so this one isn't counted against you.";
  if(e.k==="read"&&e.evid&&e.evid!==e.truth&&STYLE[e.evid])
    return e.right?` The numbers pointed to ${STYLE[e.evid].l}; your read was better than they were.`
      :` The numbers at the time pointed to ${STYLE[e.evid].l}: a short stretch can mislead.`;
  if(e.k==="prep"&&e.split){ const by=typeof e.split==="string"?" "+e.split:"";   // "3-3": their last games, by system
    return ` The report was split${by}, a coin flip, so it isn't graded either way.` }
  return "";
}
/* what you chose, for the start of the card's line: one line said "First read and second read: ... the answer was
   'Go long'" when that was the pre-match pick and the cross was for a later one (Grokbot) */
function readPickLabel(e){ if(e.waited)return "Wait and see"; const o=DEFENSES[e.pick]; return o?o.l:"" }
function readText(e){ return readTextBase(e)+readNote(e) }
function readTextBase(e){
  if(e.waited)return e.unclear?`You waited and saw: the report was split, so there was nothing to set up for. They came out ${STYLE[e.truth].l}.`:e.right?`You waited, and it paid: the report pointed to ${STYLE[e.fav].l}, and they came out ${STYLE[e.truth].l}.`:`You waited, and it cost you: the report was right, they came out ${STYLE[e.truth].l}.`;
  if(e.k==="read")return e.right?`Your read was right: they were ${STYLE[e.truth].l}.`
    :`They were ${STYLE[e.truth].l}: the answer was "${DEFENSES[STYLE[e.truth].answer].l}".`;
  if(e.k==="prep")return e.right?`Your game plan was right: they came out ${STYLE[e.truth].l}.`
    :`You game-planned for the wrong thing: they came out ${STYLE[e.truth].l}.`;
  if(e.k==="rest")return e.pick==="rest"?"You rested your starters: the bench finished it, and the minutes they sat can't hurt them (half the chance of a knock this week).":"You kept your starters in until it was safe.";
  if(e.k==="close")return e.right?`Right at crunch time: they closed ${STYLE[e.truth].l}.`
    :`They closed ${STYLE[e.truth].l}: the answer was "${DEFENSES[STYLE[e.truth].answer].l}".`;
  return "";
}
