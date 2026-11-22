/* Highlights (round 51): the game's big moments drawn on a pitch, as Football Manager's 2D match does, while you watch.
   Nothing here decides anything. The engine has already played the stretch: a goal at 23', a save at 27'; a sport's
   choreographer (HL_SPORT, e.g. soccer 72_highlights) turns each event into a few seconds of movement that ends the
   way the event did. Shown in the live view's #hlpitch, one clip after another; the next stretch waits for them.
   Tap the pitch to skip. Off, goals only, or goals and big chances, in the ? panel (S.highlights). Without a canvas
   (tests, a reduced-motion setting) nothing plays and nothing waits. */
const HL={cv:null, x:null, clips:[], cur:null, t0:0, raf:0, done:null, idle:null};
function hlMode(){ return (S&&S.highlights)||"key" }
function hlCan(){
  if(typeof HL_SPORT==="undefined"||!HL_SPORT)return false;
  if(typeof requestAnimationFrame!=="function"||typeof document==="undefined"||!document.createElement)return false;
  if(typeof prefersReduced==="function"&&prefersReduced())return false;
  return true }
/* the pitch box in the live view: a place for the canvas, which moves in after each redraw (the redraw replaces the
   page; the canvas, and a clip half played, carry on) */
function hlBox(){ if(!hlCan()||hlMode()==="off")return ""; return `<div id="hlpitch" class="hlpitch" aria-label="Highlights"></div>` }
function hlMount(){
  if(!hlCan())return; const box=document.getElementById&&document.getElementById("hlpitch"); if(!box)return;
  if(!HL.cv){ const c=document.createElement("canvas"); if(!c||!c.getContext)return; HL.cv=c; HL.x=c.getContext("2d"); if(!HL.x){ HL.cv=null; return }
    c.className="hlcv"; c.onclick=()=>hlSkip(); }
  if(HL.cv.parentNode!==box){ try{ box.appendChild(HL.cv) }catch(e){ return } }
  if(!HL.leg&&document.createElement){ HL.leg=document.createElement("div"); HL.leg.className="hlleg"; HL.leg.setAttribute("style","font:500 11px/1.5 'Barlow',system-ui,sans-serif;color:#C9CEDA;padding:4px 2px 0") }
  if(HL.leg){ if(HL.leg.parentNode!==box){ try{ box.appendChild(HL.leg) }catch(e){} } HL.leg.innerHTML=HL.cur&&HL.cur.legend?hlLegendHTML(HL.cur.legend):""; HL.leg.style.display=HL.cur&&HL.cur.legend?"":"none" }
  // a sport with its own field on the live screen (football's, basketball's flow) shows the pitch only while a clip plays
  // football's replay plays on its own field: the drive chart steps aside while a clip runs (round 67)
  if(HL_SPORT.replaces&&box.parentNode&&box.parentNode.querySelector){ const f=box.parentNode.querySelector(HL_SPORT.replaces); if(f)f.style.display=HL.cur?"none":"" }
  if(HL_SPORT.collapseIdle&&!(HL_SPORT.ambient&&hlMode()==="full")){ box.style.display=HL.cur?"":"none"; if(!HL.cur)return }   // round 98: the full match keeps the court up between moments
  else if(HL_SPORT.collapseIdle)box.style.display=""
  const W=Math.max(240,Math.round(box.clientWidth||320)), H=Math.round(W*HL_SPORT.aspect), dpr=Math.min(2,window.devicePixelRatio||1);
  if(HL.cv.width!==W*dpr){ HL.cv.width=W*dpr; HL.cv.height=H*dpr; HL.cv.style.width=W+"px"; HL.cv.style.height=H+"px" }
  if(!HL.cur)hlDraw(null,0);
  hlAmbient();
}
/* the full match: while no clip plays and the game runs, the sport's idle picture is redrawn every frame (round 68) */
/* round 98: where the pitch stays on the live screen (soccer, hockey) the play between moments runs in every mode, so the
   ice is never empty; a sport that shows its court only for a clip (basketball) keeps it up in the full match alone. The
   pace is the mode's own: only the full match waits longer between stretches. */
function hlAmbOn(){ return !!(HL_SPORT.ambient&&(hlMode()==="full"||(!HL_SPORT.collapseIdle&&hlMode()!=="off"))) }
function hlAmbient(){
  if(HL.amb||!hlAmbOn()||HL.cur)return;
  const loop=()=>{ HL.amb=0; if(HL.cur||!hlAmbOn()||typeof live==="undefined"||!live||live.done||!HL.cv||!HL.cv.isConnected)return;
    hlDraw(null,0); HL.amb=requestAnimationFrame(loop) };
  HL.amb=requestAnimationFrame(loop) }
/* will this stretch play clips? Asked before the page is drawn, so it can keep the result back (round 66); the clips
   are kept for hlPlay */
function hlWillPlay(L,drive){
  HL.pending=null;
  if(!hlCan()||hlMode()==="off"||!L||L.ff||L.ask||!drive)return false;
  // not the pitch box: the screen before may be a call, with none; the live view drawn next has one (hlPlay checks)
  let clips=[]; try{ clips=HL_SPORT.clips(L,drive,hlMode())||[] }catch(e){ clips=[] }
  if(!clips.length)return false;
  HL.pending={drive:drive,clips:clips}; return true }
/* the clips are over (or skipped): the score, the run of play, the sound and the flash */
function hlRelease(quiet){
  if(typeof live==="undefined"||!live||!live.hold)return; const h=live.hold; live.hold=null;
  if(typeof feelSpell==="function")feelSpell(live,h.h,h.a,HL.sounded,HL.scored); HL.sounded=false; HL.scored=false;   // a clip that made its own sound (round 70) leaves the flash only
  if(!quiet&&typeof render==="function")render() }
/* the clips of the drives the engine adds at the end (overtime, a shoot-out), one after another; ms they take */
function hlPlayTail(L,drives){
  if(!hlCan()||hlMode()==="off"||!L)return 0;
  let clips=[]; drives.forEach(d=>{ try{ clips=clips.concat(HL_SPORT.clips(L,d,hlMode())||[]) }catch(e){} });
  if(!clips.length)return 0;
  HL.pending={drive:drives[0],clips:clips}; return hlPlay(L,drives[0]) }
/* this stretch's clips; returns how long they take (ms), for the next stretch to wait */
function hlPlay(L,drive){
  if(!hlCan()||hlMode()==="off"||!L||L.ff||L.ask||!drive)return 0;
  const box=document.getElementById&&document.getElementById("hlpitch"); if(!box)return 0;
  let clips=[]; if(HL.pending&&HL.pending.drive===drive)clips=HL.pending.clips; else { try{ clips=HL_SPORT.clips(L,drive,hlMode())||[] }catch(e){ clips=[] } }
  HL.pending=null;
  if(!clips.length)return 0;
  box.style.display=""; HL.cur={dur:1}; hlMount();
  const k=Math.sqrt(1/Math.max(0.2,speedMult()));   // slower watching, longer clips; never longer than half again
  clips.forEach(c=>{ c.dur=Math.round(c.base*Math.min(1.6,k)) });
  HL.clips=clips.slice(1); hlStart(clips[0]);
  return clips.reduce((t,c)=>t+c.dur+250,0);
}
/* round 73: which goal of the game this is for its scorer (Instinct: "He had a hat-trick and the game said nothing");
   name(x) names a goal's scorer as the run of play does. The third is a hat-trick on the banner. */
function hlGoalNo(L,e,name){ const n=name(e); if(!n)return 1; let k=0;
  for(const d of (L&&L.drives)||[])for(const x of d.ev||[]){ if(x.k==="goal"&&x.side===e.side&&name(x)===n)k++; if(x===e)return k } return k+1 }
function hlGoalWord(k,nm){ return k===3?`HAT-TRICK! ${nm}`:k===4?`FOUR GOALS! ${nm}`:k>4?`${k} GOALS! ${nm}`:`GOAL! ${nm}` }
/* ---- round 73: Rewatch plays the clips on the pitch (Instinct: "Rewatch is text only ... the pitch is the best thing
   in the game"). The rewatch reads the run of play row by row; a drive's clips play as its first row comes up, and the
   row waits for them, as the live game's stretch does. Which rows are whose: the script of the first k drives is the
   first rows of the whole script, so the rows drive k adds are where that prefix grows. A sport whose rows don't
   build that way gets no clips, and the text rewatch is as it was. */
function hlWatchPlan(w){
  const g=w&&w.g, drives=g&&g.drives;
  if(!hlCan()||hlMode()==="off"||!drives||!drives.length||typeof driveScript!=="function")return null;
  const full=w.script.map(r=>JSON.stringify(r)), end=[];
  try{ for(let k=1;k<=drives.length;k++){ const s=driveScript(g,drives.slice(0,k)); let n=0; while(n<s.length&&n<full.length&&JSON.stringify(s[n])===full[n])n++; end.push(n) } }catch(e){ return null }
  for(let k=1;k<end.length;k++)if(end[k]<end[k-1])return null;
  if(end[end.length-1]!==full.length)return null;
  return {end:end, next:0} }
/* the row r is about to show: the clips of every drive up to the one it belongs to, not yet played; ms they take */
function hlWatchAt(r){
  if(typeof watch==="undefined"||!watch||!watch.hl||hlMode()==="off")return 0;
  const P=watch.hl, g=watch.g, L={g:g, drives:g.drives}; let own=P.end.findIndex(e=>e>r); if(own<0)own=P.end.length-1;
  // a drive that adds no rows of its own goes with the one before it (round 75: a last inning with no new row, the home
  // side not batting in the ninth, never played its clips)
  while(own+1<P.end.length&&P.end[own+1]===P.end[own])own++;
  if(P.next>own)return 0;
  let clips=[]; for(let k=P.next;k<=own;k++){ try{ clips=clips.concat(HL_SPORT.clips(L,g.drives[k],hlMode())||[]) }catch(e){} }
  const d=g.drives[P.next]; P.next=own+1;
  if(!clips.length)return 0;
  HL.pending={drive:d,clips:clips}; return hlPlay(L,d) }
/* round 72: one clock (Instinct: the clip said 74' while the header said 70'). While a clip plays, the header shows the
   clip's own time, as the held score moves on with its goals (round 70); each sport says it in the header's words */
function hlHeadClock(c){ try{ return c&&HL_SPORT.headClock?HL_SPORT.headClock(c)||null:null }catch(e){ return null } }
function hlStart(c){ { const k=hlHeadClock(c); if(k&&typeof live!=="undefined"&&live&&live.hold&&live.hold.clock!==k){ const first=!live.hold.clock; live.hold.clock=k; if(!first&&typeof render==="function")render() } }
  // the rewatch's header follows the clip's time too (round 73)
  if(typeof watch!=="undefined"&&watch&&watch.hl&&(typeof live==="undefined"||!live||live.done)){ const k=hlHeadClock(c); if(watch.hlClock!==k){ watch.hlClock=k; HL.cur=c; if(typeof render==="function")render() } }
  HL.cur=c; if(HL.leg){ HL.leg.innerHTML=c.legend?hlLegendHTML(c.legend):""; HL.leg.style.display=c.legend?"":"none" } HL.t0=Date.now(); cancelAnimationFrame(HL.raf); HL.raf=requestAnimationFrame(hlFrame) }
function hlFrame(){
  const c=HL.cur; if(!c)return; const t=Math.min(1,(Date.now()-HL.t0)/c.dur);
  hlDraw(c,t);
  // the score on the page changes as the ball goes in, in the last clip of the stretch (round 67: Ian, "see the score
  // change as you cross the touchdown line"); earlier clips' goals show in the clip's own score bug
  // round 70: with clips still to come, a goal moves the held score on by one (c.after), so it ticks up as they go in
  const rv=c.reveal!=null?c.reveal:HL_SPORT.reveal;
  // round 72: a clip that has shown a score says so, and the full-screen flash after it stays away: it covered the rows
  // just as they changed, a second "GOAL!" over the one the clip had shown (Instinct: "harder to read")
  if(rv!=null&&t>=rv&&(c.after||c.scores))HL.scored=true;
  if(rv!=null&&t>=rv&&typeof live!=="undefined"&&live&&live.hold){
    if(!HL.clips.length&&!live.finishing){ if(c.after&&!c._ticked&&HL_SPORT.sound){ c._ticked=1; try{ if(HL_SPORT.sound(c))HL.sounded=true }catch(e){} } hlRelease() }
    else if(c.after&&!c._ticked){ c._ticked=1; live.hold.h=c.after[0]; live.hold.a=c.after[1]; if(HL_SPORT.sound){ try{ if(HL_SPORT.sound(c))HL.sounded=true }catch(e){} } if(typeof render==="function")render() } }
  if(t<1){ HL.raf=requestAnimationFrame(hlFrame); return }
  // a beat on the last frame, then the next clip
  setTimeout(()=>{ if(HL.cur!==c)return; const n=HL.clips.shift(); if(n)hlStart(n); else { HL.cur=null; hlDraw(null,0); hlMount(); hlRelease() } },250);
}
function hlSkip(){
  if(!HL.cur)return; HL.cur=null; HL.clips=[]; cancelAnimationFrame(HL.raf); hlDraw(null,0); hlMount(); hlRelease();
  // the next stretch was waiting for the clips: it comes now
  if(typeof live!=="undefined"&&live&&!live.done&&!live.paused&&!live.ask&&live.timer){ clearTimeout(live.timer); live.timer=setTimeout(liveTick,Math.min(400,liveGap())) }
  // a rewatch waiting on them goes on (round 73)
  if(typeof watch!=="undefined"&&watch&&watch.hlWait&&watch.timer){ clearTimeout(watch.timer); watch.timer=setTimeout(()=>{ watch.hlWait=false; watch.i++; tickWatch() },300) }
}
function hlDraw(c,t){
  const cv=HL.cv, x=HL.x; if(!cv||!x)return; const dpr=cv.width/(parseFloat(cv.style.width)||cv.width);
  x.setTransform(dpr,0,0,dpr,0,0); const W=cv.width/dpr, H=cv.height/dpr;
  HLK.t=t; HLK.now=Date.now();
  try{ hlPitch(x,W,H,dpr); if(c)HL_SPORT.frame(x,W,H,c,t); else HL_SPORT.idle(x,W,H); hlFinish(x,W,H) }catch(e){}
}
/* ---- round 101: the full match as events in time (soccer, hockey) ----
   Their engines play a stretch of minutes at once, with its goals and chances at their own minutes and the home side's
   share of the play (d.mom). The full match plays the stretch on a running clock: the play between moments, then each
   goal or chance as its clip at the minute it came, the clock stopped while it plays, the score moving as it goes in.
   HL_SPORT.evPB gives the sport's clock (t0, span, clock) and the between-moments length (ms). */
function hlEvPlan(L,d){ if(d._ev)return d._ev; const S=HL_SPORT.evPB; let clips=[]; try{ clips=HL_SPORT.clips(L,d,S.mode||"all")||[] }catch(e){}
  const sp=typeof speedMult==="function"?speedMult():1, k=Math.sqrt(1/Math.max(0.2,sp)), t0=S.t0(d), span=S.span(d);
  clips.forEach(c=>{ c.dur=Math.round(c.base*Math.min(1.6,k)); const m=c.e&&c.e.m; c.f=m!=null&&!(c.e&&c.e.so)?Math.max(0.03,Math.min(0.97,(m-t0-0.5)/span)):0.9 });
  clips.sort((a,b)=>a.f-b.f);
  const amb=S.ms(d)/Math.pow(Math.max(0.25,sp),0.75), seg=[]; let pf=0, at=0;
  clips.forEach(c=>{ const a=Math.max(0,(c.f-pf)*amb); seg.push({k:"amb",f0:pf,f1:c.f,at:at,ms:a}); at+=a; seg.push({k:"clip",c:c,at:at,ms:c.dur,f:c.f}); at+=c.dur+250; pf=c.f });
  const a=(1-pf)*amb; seg.push({k:"amb",f0:pf,f1:1,at:at,ms:a}); at+=a;
  return d._ev={seg:seg,tot:at,clips:clips} }
/* the shots the full match showed (not the goals: those are credited by name already): [side 0/1, "s", roster slot] */
function hlEvNames(L,d){ if(!d||!d._ev)return null; const g=L.g, out=[];
  d._ev.clips.forEach(c=>{ if(c.kind==="goal"||c.kind==="red"||!c.who||!c.tm)return; const tm=c.tm, R=(SEA.roster&&SEA.roster[tm])||[];   // c.tm: the side that shot
    const i=R.findIndex(p=>p&&p.n===c.who); if(i>=0)out.push([tm===g.home?0:1,"s",i]) });
  return out }
function hlEvPlayback(L,d){ if(!HL_SPORT.evPB||!d||d.seg==null||typeof d.seg!=="number"||d.so||(HL_SPORT.evPB.skip&&HL_SPORT.evPB.skip(d)))return 0; return Math.round(hlEvPlan(L,d).tot) }
let hlEvKey="", hlEvLab=0;
function hlEvDraw(x,W,H){
  const PB=live.pb, d=PB.d, P=hlEvPlan(live,d), S=HL_SPORT.evPB, el=PB.frozen!=null?PB.frozen:Date.now()-PB.at;
  let i=P.seg.findIndex(q=>el<q.at+q.ms+(q.k==="clip"?250:0)); if(i<0)i=P.seg.length-1; const q=P.seg[i];
  // the score: the goals of the clips already past, and this one's once it has gone in
  let h=PB.h0, a=PB.a0; const goal=c=>{ if(c.after){ h=c.after[0]; a=c.after[1] } };
  P.seg.slice(0,i).forEach(z=>{ if(z.k==="clip")goal(z.c) });
  let clock;
  if(q.k==="clip"){ const t=Math.min(1,(el-q.at)/Math.max(1,q.ms)), rv=q.c.reveal!=null?q.c.reveal:HL_SPORT.reveal;
    if(rv!=null&&t>=rv){ goal(q.c); if(q.c.after&&!q.c._snd){ q.c._snd=1; try{ if(HL_SPORT.sound)HL_SPORT.sound(q.c); else if(typeof sfx==="function"){ const mine=(q.c.e&&q.c.e.side==="home")===(live.g.home===S.myTeam); sfx(mine?"score":"against") } }catch(e){} } }
    clock=(HL_SPORT.headClock&&HL_SPORT.headClock(q.c))||S.clock(d,q.f);
    if(live.hold){ live.hold.h=h; live.hold.a=a; live.hold.clock=clock }
    HL_SPORT.frame(x,W,H,q.c,t) }
  else { const f=q.f0+(q.f1-q.f0)*Math.min(1,(el-q.at)/Math.max(1,q.ms)); clock=S.clock(d,f);
    if(live.hold){ live.hold.h=h; live.hold.a=a; live.hold.clock=clock }
    if(HL_SPORT.amb)HL_SPORT.amb(x,W,H) }
  // the page follows: a redraw when the score moves, the clock in the header otherwise
  const k=h+"|"+a; if(k!==hlEvKey){ const first=!hlEvKey; hlEvKey=k; if(!first)setTimeout(()=>{ if(live&&live.pb&&typeof render==="function")render() },0) }
  if(Date.now()-hlEvLab>500){ hlEvLab=Date.now(); try{ const lb=document.querySelector(".wtop .wlabel"); if(lb){ const t=lb.textContent||"", j=t.indexOf("·"); lb.innerHTML=`<span class="live"></span>${esc(clock)}${j>=0?" "+esc(t.slice(j).replace(/\s+/g," ")):""}` } if(typeof miniBar==="function")miniBar() }catch(e){} }
}
/* ---- the drawing kit (round 64: the pitches and players drawn to Football Manager's standard) ----
   The surface (grass, wood, ice, dirt, lines, nets) is painted once per size into an offscreen canvas and copied
   each frame; textures come from a seeded generator, never Math.random, so a frame is the same every time. */
const HLK={surf:null, key:"", t:0, now:0};
function hlPitch(x,W,H,dpr){
  const k=W+"x"+H+"@"+dpr;
  if(HLK.key!==k||!HLK.surf){ let c=null; try{ c=document.createElement("canvas") }catch(e){}
    if(c&&c.getContext){ c.width=Math.round(W*dpr); c.height=Math.round(H*dpr); const g=c.getContext("2d");
      if(g){ g.setTransform(dpr,0,0,dpr,0,0); HL_SPORT.pitch(g,W,H); HLK.surf=c; HLK.key=k } } }
  if(HLK.surf&&HLK.key===k){ x.save(); x.setTransform(1,0,0,1,0,0); x.drawImage(HLK.surf,0,0); x.restore() } else HL_SPORT.pitch(x,W,H);
}
/* a soft dark edge, as a broadcast camera sees a pitch under lights */
function hlFinish(x,W,H){
  const g=x.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.hypot(W,H)*0.62);
  g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,.28)"); x.fillStyle=g; x.fillRect(0,0,W,H) }
function hlHex(c){ return "#"+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("") }
function hlShade(hex,a){ const c=hlRGB(hex); return hlHex(a>=0?c.map(v=>v+(255-v)*a):c.map(v=>v*(1+a))) }
function hlLum(hex){ const c=hlRGB(hex).map(v=>{ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4) }); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2] }
/* speckle: n flecks of light and dark over a box, from a seed */
function hlSpeckle(x,L,T,w,h,n,seed,a){
  const r=mulberry32(seed>>>0);
  for(let i=0;i<n;i++){ const px=L+r()*w, py=T+r()*h, s=0.6+r()*1.4, d=r()<0.5;
    x.fillStyle=d?`rgba(0,0,0,${a*(0.4+r()*0.6)})`:`rgba(255,255,255,${a*(0.3+r()*0.5)})`; x.fillRect(px,py,s,s) } }
/* mown grass: bands (vertical or horizontal), each with a soft sheen across it, then fine speckle */
function hlGrass(x,L,T,w,h,o){
  o=o||{}; const n=o.bands||12, vert=o.vertical!==false, base=o.base||"#2E7D3A", alt=o.alt||"#358A42";
  x.fillStyle=base; x.fillRect(L,T,w,h);
  for(let i=0;i<n;i++){ const a=vert?[L+i*w/n,T,w/n,h]:[L,T+i*h/n,w,h/n];
    const g=vert?x.createLinearGradient(a[0],0,a[0]+a[2],0):x.createLinearGradient(0,a[1],0,a[1]+a[3]);
    const c=i%2?alt:base; g.addColorStop(0,hlShade(c,-0.04)); g.addColorStop(0.5,hlShade(c,0.03)); g.addColorStop(1,hlShade(c,-0.04));
    x.fillStyle=g; x.fillRect(a[0],a[1],a[2]+0.5,a[3]+0.5) }
  hlSpeckle(x,L,T,w,h,Math.round(w*h/40),o.seed||7,0.07);
  // light from above the main stand: a little brighter at the top
  const lg=x.createLinearGradient(0,T,0,T+h); lg.addColorStop(0,"rgba(255,255,230,.06)"); lg.addColorStop(1,"rgba(0,0,0,.08)"); x.fillStyle=lg; x.fillRect(L,T,w,h) }
/* painted lines: slightly translucent, with a faint shadow so they sit on the grass */
function hlLines(x,lw,fn){ x.save(); x.lineCap="round"; x.lineJoin="round";
  x.strokeStyle="rgba(0,0,0,.18)"; x.lineWidth=lw+1.2; x.translate(0.6,0.8); fn(); x.translate(-0.6,-0.8);
  x.strokeStyle="rgba(246,250,242,.92)"; x.lineWidth=lw; fn(); x.restore() }
/* a goal net seen from above: a frame and a mesh */
function hlNet(x,gx,y0,y1,depth,dir){
  const x1=gx+depth*dir; x.save(); x.fillStyle="rgba(255,255,255,.10)"; x.fillRect(Math.min(gx,x1),y0,Math.abs(depth),y1-y0);
  x.strokeStyle="rgba(255,255,255,.35)"; x.lineWidth=0.6; const st=Math.max(2,Math.abs(depth)/4);
  for(let yy=y0;yy<=y1+0.1;yy+=st){ x.beginPath(); x.moveTo(gx,yy); x.lineTo(x1,yy); x.stroke() }
  for(let k=0;k<=Math.abs(depth)+0.1;k+=st){ x.beginPath(); x.moveTo(gx+k*dir,y0); x.lineTo(gx+k*dir,y1); x.stroke() }
  x.strokeStyle="#F7F7F2"; x.lineWidth=2; x.beginPath(); x.moveTo(gx,y0); x.lineTo(x1,y0); x.lineTo(x1,y1); x.lineTo(gx,y1); x.stroke(); x.restore() }
/* a team's kit on the pitch: the shirt is the club's own colour (not the text colour lightened for a dark page), the
   trim and number contrast with it */
function hlKit(team,alt){
  const raw=(LEAGUE.colors&&LEAGUE.colors[team])||alt||"#888888", fill=alt||raw, L=hlLum(fill);
  return {fill:fill, trim:L>0.45?"#14161C":"#F6F4EE", num:L>0.45?"#14161C":"#FFFFFF"} }
/* a player from above: a shadow, a shaded disc in the kit, a trim ring, the number; the one the moment is about gets
   a ring and his name. o: {num, label, hot, dir (radians: which way he faces), alpha} */
function hlPlayer(x,px,py,r,kit,o){
  o=o||{}; x.save(); if(o.alpha!=null)x.globalAlpha=o.alpha;
  // a keeper's dive: the body laid out along the dive, a blur behind it
  // round 80: laid out, not grown (Ian: the goalie grew as he dived): longer by up to 45% and thinner, about the same size
  if(o.dive){ const a=o.dive.ang, k=1+o.dive.k*0.45, wd=0.9/Math.sqrt(k); x.translate(px,py); x.rotate(a);
    x.beginPath(); x.ellipse(r*0.3,r*0.4,r*k*1.02,r*wd*0.95,0,0,Math.PI*2); x.fillStyle="rgba(0,0,0,.28)"; x.fill();
    for(let q=2;q>=1;q--){ x.globalAlpha=(o.alpha!=null?o.alpha:1)*0.12*q; x.beginPath(); x.ellipse(-q*r*0.45*o.dive.k,0,r*k,r*wd,0,0,Math.PI*2); x.fillStyle=kit.fill; x.fill() }
    x.globalAlpha=o.alpha!=null?o.alpha:1; const g=x.createLinearGradient(0,-r,0,r); g.addColorStop(0,hlShade(kit.fill,0.25)); g.addColorStop(1,hlShade(kit.fill,-0.3));
    x.beginPath(); x.ellipse(0,0,r*k,r*wd,0,0,Math.PI*2); x.fillStyle=g; x.fill(); x.lineWidth=Math.max(1,r*0.2); x.strokeStyle=kit.trim; x.stroke();
    x.restore(); return }
  x.beginPath(); x.ellipse(px+r*0.28,py+r*0.38,r*1.02,r*0.82,0,0,Math.PI*2); x.fillStyle="rgba(0,0,0,.28)"; x.fill();
  if(o.hot){ const ph=(HLK.now%900)/900, rr=r*(1.55+0.35*Math.sin(ph*Math.PI*2));
    x.beginPath(); x.arc(px,py,rr,0,Math.PI*2); x.strokeStyle="rgba(255,226,92,.9)"; x.lineWidth=Math.max(1.5,r*0.22); x.stroke() }
  if(o.dir!=null){ x.beginPath(); const a=o.dir; x.moveTo(px+Math.cos(a)*r*1.45,py+Math.sin(a)*r*1.45);
    x.lineTo(px+Math.cos(a+0.55)*r*0.95,py+Math.sin(a+0.55)*r*0.95); x.lineTo(px+Math.cos(a-0.55)*r*0.95,py+Math.sin(a-0.55)*r*0.95); x.closePath();
    x.fillStyle=kit.trim; x.globalAlpha=(o.alpha!=null?o.alpha:1)*0.85; x.fill(); x.globalAlpha=o.alpha!=null?o.alpha:1 }
  const g=x.createRadialGradient(px-r*0.35,py-r*0.4,r*0.1,px,py,r*1.05); g.addColorStop(0,hlShade(kit.fill,0.28)); g.addColorStop(0.7,kit.fill); g.addColorStop(1,hlShade(kit.fill,-0.3));
  x.beginPath(); x.arc(px,py,r,0,Math.PI*2); x.fillStyle=g; x.fill();
  x.lineWidth=Math.max(1,r*0.2); x.strokeStyle=kit.trim; x.stroke();
  x.beginPath(); x.arc(px,py,r+x.lineWidth/2,0,Math.PI*2); x.lineWidth=0.8; x.strokeStyle="rgba(0,0,0,.45)"; x.stroke();
  if(o.num!=null&&r>=4.5){ x.font=`700 ${Math.round(r*(String(o.num).length>1?0.95:1.15))}px 'Barlow Condensed',Impact,sans-serif`; x.textAlign="center"; x.textBaseline="middle"; x.fillStyle=kit.num; x.fillText(String(o.num),px,py+r*0.06) }
  if(o.sub&&!o.label){ const fs=Math.max(8,Math.round(r*1.05)); x.font=`600 ${fs}px 'Barlow Condensed',Impact,sans-serif`; x.textAlign="center"; x.textBaseline="top";
    x.lineWidth=3; x.strokeStyle="rgba(0,0,0,.7)"; x.strokeText(o.sub,px,py+r+2); x.fillStyle="#fff"; x.fillText(o.sub,px,py+r+2) }
  if(o.label){ const fs=Math.max(10,Math.round(r*1.5)); x.font=`700 ${fs}px 'Barlow Condensed',Impact,sans-serif`; x.textAlign="center"; x.textBaseline="middle";
    const tw=x.measureText(o.label).width, ty=py-r-fs*0.9; x.fillStyle="rgba(10,12,18,.78)";
    hlRound(x,px-tw/2-6,ty-fs*0.62,tw+12,fs*1.24,fs*0.4); x.fill(); x.fillStyle=kit.fill; x.fillRect(px-tw/2-6,ty+fs*0.62-2,tw+12,2);
    x.fillStyle="#fff"; x.fillText(o.label,px,ty+1) }
  x.restore() }
function hlRound(x,l,t,w,h,r){ x.beginPath(); x.moveTo(l+r,t); x.lineTo(l+w-r,t); x.quadraticCurveTo(l+w,t,l+w,t+r); x.lineTo(l+w,t+h-r); x.quadraticCurveTo(l+w,t+h,l+w-r,t+h);
  x.lineTo(l+r,t+h); x.quadraticCurveTo(l,t+h,l,t+h-r); x.lineTo(l,t+r); x.quadraticCurveTo(l,t,l+r,t); x.closePath() }
/* the ball: its shadow on the ground (further and softer the higher it is), a trail behind it, the ball shaded.
   trail: screen points, oldest first. o: {fill, ring, kind:"ball"|"puck"|"oval"} */
function hlBall(x,px,py,r,lift,trail,o){
  o=o||{}; const fill=o.fill||"#FFFFFF";
  if(trail&&trail.length>1){ for(let i=1;i<trail.length;i++){ const a=i/trail.length; x.beginPath(); x.moveTo(trail[i-1][0],trail[i-1][1]); x.lineTo(trail[i][0],trail[i][1]);
    x.strokeStyle=`rgba(255,255,255,${0.42*a})`; x.lineWidth=r*1.3*a; x.lineCap="round"; x.stroke() } }
  const sh=1+lift*0.06; x.beginPath(); x.ellipse(px+lift*0.5,py+lift*0.75,r*sh,r*0.8*sh,0,0,Math.PI*2); x.fillStyle=`rgba(0,0,0,${Math.max(0.12,0.38-lift*0.012)})`; x.fill();
  const by=py-lift, R=r*(1+Math.min(0.5,lift*0.02));
  if(o.kind==="puck"){ x.beginPath(); x.ellipse(px,by,R*1.15,R*0.85,0,0,Math.PI*2); x.fillStyle="#0E0F12"; x.fill(); x.strokeStyle="#3A3D45"; x.lineWidth=1; x.stroke(); return }
  const g=x.createRadialGradient(px-R*0.35,by-R*0.35,R*0.1,px,by,R); g.addColorStop(0,hlShade(fill,0.5)); g.addColorStop(1,hlShade(fill,-0.35));
  x.beginPath(); if(o.kind==="oval")x.ellipse(px,by,R*1.35,R*0.85,o.rot||0,0,Math.PI*2); else x.arc(px,by,R,0,Math.PI*2); x.fillStyle=g; x.fill();
  x.lineWidth=0.9; x.strokeStyle=o.ring||"rgba(0,0,0,.6)"; x.stroke() }
/* a line the ball travelled or will travel: dashed for a pass, solid for a shot */
function hlPath(x,pts,col,dash,w){ if(!pts||pts.length<2)return; x.save(); x.setLineDash(dash||[]); x.lineWidth=w||1.6; x.strokeStyle=col; x.lineCap="round";
  x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.stroke(); x.restore() }
/* the score bug, top left, as a broadcast has it: two colour chips, the abbreviations, the score, the clock */
function hlBug(x,W,H,o){
  const fs=Math.max(10,Math.round(W/44)), pad=fs*0.5, ab=t=>(LEAGUE.abbr&&LEAGUE.abbr[t])||String(t||"").replace(/[^A-Za-z ]/g,"").split(" ").filter(Boolean).map((w,i,a)=>a.length>1?w[0]:w.slice(0,3)).join("").slice(0,3).toUpperCase();
  x.save(); x.font=`700 ${fs}px 'Barlow Condensed',Impact,sans-serif`; x.textBaseline="middle";
  const cells=[[ab(o.home),o.hk],[String(o.hs),null],[ab(o.away),o.ak],[String(o.as),null]];
  const cw=cells.map(([s])=>x.measureText(s).width+pad*2), clk=o.clock?x.measureText(o.clock).width+pad*2:0;
  const tw=cw.reduce((a,b)=>a+b,0)+clk+6, h=fs*1.7, l=8, t=8;
  x.fillStyle="rgba(10,12,18,.82)"; hlRound(x,l,t,tw,h,4); x.fill();
  let cx=l; cells.forEach(([s,k],i)=>{ if(k){ x.fillStyle=k.fill; x.fillRect(cx,t+3,3,h-6) }
    if(i%2===1){ x.fillStyle="rgba(255,255,255,.1)"; x.fillRect(cx,t,cw[i],h) }
    x.fillStyle="#fff"; x.textAlign="center"; x.fillText(s,cx+cw[i]/2+(k?1.5:0),t+h/2+1); cx+=cw[i]+(i===1?6:0) });
  if(o.clock){ x.fillStyle="rgba(255,226,92,.95)"; x.fillText(o.clock,cx+clk/2,t+h/2+1) }
  x.restore() }
/* the moment's headline, bottom centre: slides up in the team's colour and holds. s: 0..1 of its own time */
function hlBanner(x,W,H,text,kit,s){
  if(!text)return; const e=hlEase(Math.min(1,s*4)), fs=Math.max(15,Math.round(W/27)), bh=fs*1.6, y=H-bh-10+(1-e)*(bh+14);
  x.save(); x.globalAlpha=e; x.font=`800 ${fs}px 'Barlow Condensed',Impact,sans-serif`; const tw=Math.min(W-24,x.measureText(text).width+fs*1.6), l=(W-tw)/2;
  x.fillStyle="rgba(10,12,18,.86)"; hlRound(x,l,y,tw,bh,6); x.fill();
  if(kit){ x.fillStyle=kit.fill; x.fillRect(l,y,6,bh); x.fillRect(l+tw-6,y,6,bh) }
  x.textAlign="center"; x.textBaseline="middle"; x.fillStyle="#fff"; x.fillText(text,W/2,y+bh/2+1,tw-fs); x.restore() }
/* the key: each side's named players by number. L: [{team, kit:{fill}, list:[[no,name],...]}] */
function hlLegendHTML(L){ return L.filter(x=>x&&x.list&&x.list.length).map(x=>`<div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${x.kit.fill};margin-right:5px;vertical-align:0"></span><b style="color:#fff">${esc(x.team)}</b> ${x.list.map(([n,nm])=>`<span style="white-space:nowrap;margin-left:4px"><b style="font-family:'IBM Plex Mono',monospace;color:#F4C95D">${n}</b> ${esc(nm)}</span>`).join(" ")}</div>`).join("") }
/* a side's players by roster slots: [[shirt no, surname]] for the given roster indices */
/* round 97: a roster place as it plays tonight: a hurt starter's backup, a hurt backup's starter (Grokbot: an injured man
   on the ice; measured in clips: hockey 144 of 900, soccer 65 of 237, football 80 of 343 named a hurt man) */
function hlFit(team,i){ const R=SEA&&SEA.roster&&SEA.roster[team]; if(!R||i==null||i<0||!SEA.talent||!SEA.talent.inj||!SEA.talent.inj[team])return i;
  const H=new Set(SEA.talent.active(team).map(x=>x.idx)); if(!H.has(i))return i; const n=typeof POS!=="undefined"?POS.length:0, o=i<n?i+n:i-n;
  return R[o]&&!H.has(o)?o:i }
function hlNamed(team,idxs){ const R=SEA&&SEA.roster&&SEA.roster[team]; if(!R)return []; return idxs.map(i=>R[i]?[shirtNo(team,i),String(R[i].n).split(" ").slice(-1)[0]]:null) }
/* a stretch's clips cut to n: every goal stays (round 70: a two-goal stretch showed one, the cap took the later goal
   when saves came first); chances fill what's left, in minute order */
function hlTrim(out,n){ const goals=out.filter(c=>c.kind==="goal").length; let room=Math.max(0,n-goals); return out.filter(c=>c.kind==="goal"||room-->0) }
/* the two sides' kits, told apart on grass: a clash (or a green shirt) sends the away side to its change kit */
function hlKits(home,away){
  const d=(a,b)=>{ const A=hlRGB(a),B=hlRGB(b); return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]) };
  const green=h=>{ const c=hlRGB(h); return c[1]>c[0]+25&&c[1]>c[2]+15 };
  const hc=(LEAGUE.colors&&LEAGUE.colors[home])||"#C8102E", ac=(LEAGUE.colors&&LEAGUE.colors[away])||"#1D428A";
  const H=hlKit(home,green(hc)?"#F4F1E8":hc);
  let A=hlKit(away,ac); if(green(ac)||d(ac,H.fill)<110)A=hlKit(away,hlLum(H.fill)>0.35?"#1A1D26":"#F4F1E8");
  return [H,A] }
/* the line of commentary across the top, under the bug's height when there is one */
function hlTicker(x,W,H,text,top){
  if(!text)return; const fs=Math.max(10,Math.round(W/52)); x.save(); x.font=`500 ${fs}px 'Barlow',system-ui,sans-serif`; x.textBaseline="middle"; x.textAlign="left";
  let tt=text; while(tt.length>8&&x.measureText(tt).width>W-24)tt=tt.slice(0,-2); if(tt!==text)tt=tt.replace(/\s*\S*$/,"")+"\u2026";
  const y=top||8, h=fs*1.7, tw=x.measureText(tt).width+16, l=top>8?W-tw-8:8; x.fillStyle="rgba(10,12,18,.7)"; hlRound(x,l,y,tw,h,4); x.fill(); x.fillStyle="#E9ECF2"; x.fillText(tt,l+8,y+h/2+1); x.restore() }
/* shared drawing */
function hlDot(x,px,py,r,fill,ring,label,o){
  const L=hlLum(fill); hlPlayer(x,px,py,r,{fill:fill,trim:L>0.45?"#14161C":"#F6F4EE",num:L>0.45?"#14161C":"#FFFFFF"},Object.assign({label:label,hot:!!label},o||{})) }
/* the older sports' words: the top line becomes the ticker, the bottom the sliding banner in the side's colour */
function hlCaption(x,W,H,top,bottom,ink){
  if(top)hlTicker(x,W,H,top,8);
  if(bottom){ if(HLK.bText!==bottom){ HLK.bText=bottom; HLK.b0=HLK.now } const s=Math.max(0,(HLK.now-(HLK.b0||HLK.now))/1200);
    hlBanner(x,W,H,bottom,ink&&ink!=="#fff"?{fill:ink}:null,s) } else HLK.bText=null }
const hlEase=t=>t<0?0:t>1?1:t*t*(3-2*t);
const hlLerp=(a,b,t)=>a+(b-a)*t;
/* colours not close to any of these (the keepers', away from both sides') */
function hlRGB(s){ const m=/^#?([0-9a-f]{6})$/i.exec(String(s||"")); if(!m)return [200,200,200]; const n=parseInt(m[1],16); return [n>>16,(n>>8)&255,n&255] }
function hlFar(cands,avoid){ const d=(a,b)=>{ const A=hlRGB(a),B=hlRGB(b); return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]) };
  return cands.slice().sort((a,b)=>Math.min(...avoid.map(v=>d(b,v)))-Math.min(...avoid.map(v=>d(a,v)))) }
/* two team colours that can be told apart on grass: the away side goes white when they're close */
function hlInks(home,away){
  const hx=s=>{ const m=/^#?([0-9a-f]{6})$/i.exec(String(s||"")); if(!m)return [200,200,200]; const n=parseInt(m[1],16); return [n>>16,(n>>8)&255,n&255] };
  const a=teamInk(home), b=teamInk(away), A=hx(a), B=hx(b), d=Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]);
  const green=c=>c[1]>c[0]+30&&c[1]>c[2]+20;
  return [green(A)?"#F4F1E8":a, d<90||green(B)?(green(A)?"#1A1D26":"#F4F1E8"):b];
}
