/* ============ big moments (round 73) ============
   Instinct (Nov 12): "He had a hat-trick and the game said nothing ... hat-tricks, shut-outs, comebacks, walk-offs each
   get a banner and a staff reaction." A game you played says, on its result card, the night's big moment: each sport
   reads its own (sportMoments: a hat-trick, a walk-off, the last shot); every sport has the comeback and the shutout.
   Read from the game's own record, after it is played. Nothing here moves a game. */
const MOMENTS_ON=true;
const MOMENT_COMEBACK={football:14,basketball:15,hockey:3,soccer:2,baseball:4};   // down this many, and won
const MOMENT_SHUTOUT={football:1,hockey:1,baseball:1};                              // the sports where nil is rare
const MOMENT_ORDER=["walkoff","buzzer","winner","ot","late","hattrick","comeback","shutout","so"];
function momentsOf(g,my){
  if(!MOMENTS_ON||!g||!g.drives||!g.drives.length||!my)return [];
  const meHome=g.home===my, sp=(typeof SPORT!=="undefined"&&SPORT.id)||"football", opp=meHome?g.away:g.home;
  let out=[]; try{ out=typeof sportMoments==="function"?sportMoments(g,my,meHome)||[]:[] }catch(e){ out=[] }
  const mine=meHome?g.hp:g.ap, theirs=meHome?g.ap:g.hp;
  if(g.winner===my){
    // the comeback: the deepest the game had you behind
    let down=0; g.drives.forEach(d=>{ const s=d.sh!==undefined?[d.sh,d.sa]:[d.h,d.a]; if(s[0]===undefined)return; const m=meHome?s[0]-s[1]:s[1]-s[0]; if(-m>down)down=-m });
    const th=MOMENT_COMEBACK[sp]||10;
    if(down>=th)out.push({k:"comeback", h:"Comeback", l:`${down} down against ${esc(opp)}, and you won ${mine}&ndash;${theirs}.`});
    if(MOMENT_SHUTOUT[sp]&&theirs===0)out.push({k:"shutout", h:"Shutout", l:`${esc(opp)} didn't score.`}) }
  return out.sort((a,b)=>MOMENT_ORDER.indexOf(a.k)-MOMENT_ORDER.indexOf(b.k));
}
/* on the result card: the biggest moment as the banner, any others as a line under it, and one of the staff on it */
function momentHTML(g,my,seed){
  const M=momentsOf(g,my); if(!M.length)return "";
  const top=M[0], more=M.slice(1);
  const s=typeof staffAside==="function"?staffAside("m_"+top.k,(seed|0)+(g.hp|0)*7+(g.ap|0)*3):null;
  return `<div class="momentcard"><div class="mhead">${esc(top.h)}</div><div class="mline">${top.l}</div>${more.map(x=>`<div class="mline more"><b>${esc(x.h)}.</b> ${x.l}</div>`).join("")}</div>`
    +(s?`<div class="say tight momentsay"><span class="facewrap ${s.who}">${staffFaceOf(s.who)}</span>
      <div class="saybody"><span class="sayname">${esc(staffNameOf(s.who))}</span><span class="saytext">${esc(staffLineOf(s.who,s.line))}</span></div></div>`:"");
}

/* ============ the box score (round 73) ============
   From the game's own record only: the team numbers the engine counted and the scorers the run of play named. Every
   number here adds up to the score (test/boxscore.js). A sport's player-by-player lines are kept out where they are
   drawn per player rather than counted in the game (they would not add up). Each sport: sportBox(g) -> HTML. */
/* round 79: the game's numbers so far, a tap away while it's on (Ian: "in-game stats"): the box score's team table from
   the stretches played. It stays open, or shut, as you left it, through the game's redraws. */
let liveStatsOpen=false;
function liveStatsHTML(){
  if(!MOMENTS_ON||typeof live==="undefined"||!live||!live.g||!live.drives||!live.drives.length||typeof sportBox!=="function")return "";
  const H=typeof liveH==="function"?liveH():0, A=typeof liveA==="function"?liveA():0;
  let b=""; try{ b=sportBox(Object.assign({},live.g,{drives:live.drives.slice(),h:H,a:A,hp:H,ap:A,live:true}))||"" }catch(e){ b="" } if(!b)return "";
  return `<details class="boxscore livestats"${liveStatsOpen?" open":""}><summary>Game stats so far</summary>${b}</details>` }
function boxHTML(g,open,step){
  if(!MOMENTS_ON||!g||!g.drives||!g.drives.length||typeof sportBox!=="function")return "";
  let b=""; try{ b=sportBox(g)||"" }catch(e){ b="" } if(!b)return "";
  // round 74: the players' lines, where they come from the game's own record (engine 4) and so add up to it
  let p=""; try{ const L=boxLines(g,step,true); if(L&&typeof sportBoxPlayers==="function")p=(typeof sportSheetNote==="function"?sportSheetNote(g,L):"")+(sportBoxPlayers(g,L)||"") }catch(e){ p="" }
  return `<details class="boxscore"${open?" open":""}><summary>Box score</summary>${b}${p}</details>` }
/* each side's players' lines for one game, from their game logs (round 74): [{n, i (roster place), pos, s (the line)}] */
// all (round 81): also the men who have moved clubs since (their row for that game is in their log wherever they are
// now): for a box score drawn when opened; the Scores toggle asks only the club's own roster
function boxLines(g,step,all){
  if(typeof ENGINE_V==="undefined"||ENGINE_V<4||step===undefined||step===null||typeof SEA==="undefined"||!SEA||!SEA.roster)return null;
  const out={home:[],away:[]}, w=glStride();
  ["home","away"].forEach(sd=>{ const tm=g[sd], oi=NAMES.indexOf(sd==="home"?g.away:g.home), hf=sd==="home"?1:0;
    // every roster, the opponent's too (round 85: a man traded to the club he'd played against left the box score of that
    // game); his row's opponent and ground already say which side he was on
    const pool=all?NAMES.flatMap(t=>(SEA.roster[t]||[]).map((p,i)=>[p,t===tm?i:-1])):(SEA.roster[tm]||[]).map((p,i)=>[p,i]);
    pool.forEach(([p,i])=>{ if(!p||!p.gl)return;
      for(let j=p.gl.length-w;j>=0;j-=w){ if(p.gl[j]<step)break;
        // (round 82: and the score: a cup week can hold a league game and a cup tie with the same club at the same ground,
        // and the box score showed the other game's lines)
        if(p.gl[j]===step&&p.gl[j+1]===oi&&(p.gl[j+2]&1)===hf&&((p.gl[j+2]&2)>0)===!!g.cup&&(p.gl[j+3]===undefined||p.gl[j+3]===(sd==="home"?g.hp:g.ap))&&(p.gl[j+4]===undefined||p.gl[j+4]===(sd==="home"?g.ap:g.hp))){ const P=POS[p.gl[j+5]]; if(!P)break; const o={}; (STAT_KEYS[P.p]||[]).forEach((k,q)=>o[k]=p.gl[j+6+q]);
          out[sd].push({n:p.n,i:i,pos:P.p,s:o}); break } } }) });
  return out.home.length||out.away.length?out:null;
}
/* "J. Smith": a name short enough for a box score's column */
function boxName(n){ const w=String(n||"").split(" "); return w.length>1?w[0][0]+". "+w.slice(1).join(" "):String(n||"") }
/* one side's table under its name */
function boxSide(g,sd,head,rows){ return rows.length?`<div class="boxhead">${esc(g[sd])}</div>`+statTable(head,rows,1):"" }
/* a team table: first column the label, then a column per side */
function boxTeams(g,rows,homeFirst){ const A=tAb(g.away), H=tAb(g.home);
  return statTable(["",homeFirst?H:A,homeFirst?A:H],rows.filter(Boolean).map(r=>({c:[esc(r[0]),homeFirst?r[2]:r[1],homeFirst?r[1]:r[2]].map(String)}))) }

/* ---- round 79: any game's sheet, from the players' game logs (Ian: "When you go to scores ... you should be able to
   click on a game to see the box scores and team and player stats"). The computer's games keep no play-by-play, but
   every player's line is logged, so any game this season has its box: each side's players by position group, with
   the columns their player pages use, and the sport's own note (baseball's decisions). Engine 4 seasons on. */
function gameSheet(g,step){
  const BL=boxLines(g,step,true); if(!BL)return "";
  const side=sd=>{ const groups=[]; BL[sd].forEach(x=>{ const cols=typeof statCols==="function"?statCols(x.pos):[], key=cols.map(c=>c[0]).join("|");
      const o=Object.assign({g:1},x.s); if(!Object.keys(x.s).some(k=>x.s[k]))return;
      let G=groups.find(y=>y.key===key); if(!G){ G={key:key,cols:cols,rows:[]}; groups.push(G) }
      G.rows.push({c:[esc(boxName(x.n))+` <span style="color:var(--muted)">${esc(x.pos)}</span>`].concat(cols.map(c=>esc(String(c[1](o)))))}) });
    return groups.length?`<div class="boxhead">${esc(g[sd])}</div>`+groups.map(G=>statTable([""].concat(G.cols.map(c=>c[0])),G.rows,1)).join(""):"" };
  const note=typeof sportSheetNote==="function"?sportSheetNote(g,BL):"";
  return note+side("away")+side("home");
}

/* round 81: watch a computer game. Played again from the dice it was played on (Season._rp), with what it was played
   with; shown only when it ends exactly as recorded. Nothing is stored: the drives live as long as the watch. */
function replayGame(g,step){
  try{ if(!SEA||!SEA._rp||g.drives)return g.drives?g:null;
    const k=[step,g.home,g.away,g.cup?1:0].join("|"), E=SEA._rp.get(k); if(!E)return null;
    const r=new RNG(0); r.a=E.ra; r.sp=E.rs;
    const gs=playGame(r,E.eh,E.ea,E.ph||"balanced",E.pa||"balanced",E.go?JSON.parse(E.go):null);
    const h=gs.h, a=gs.a, hp=g.hp!==undefined?g.hp:g.h, ap=g.ap!==undefined?g.ap:g.a;
    if(h!==hp||a!==ap)return null;
    if(E.st){ const st=JSON.parse(E.st); (gs.drives||[]).forEach((d,i)=>{ const x=st[i]; if(!x)return; if(x[0])d.by=x[0]; (d.ev||[]).forEach((e,j)=>{ const y=x[1]&&x[1][j]; if(!y)return; if(y[0])e.nm=y[0]; if(y[1])e.an=y[1]; if(y[2])e.dp=y[2]; if(y[3])e.un=y[3] }) }) }
    return Object.assign({},g,{drives:gs.drives,replayed:true}) }catch(e){ return null } }
