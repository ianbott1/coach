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
    +(s?`<div class="say tight momentsay"><span class="facewrap ${s.who}">${staffFace(s.who)}</span>
      <div class="saybody"><span class="sayname">${esc(STAFF[s.who].name)}</span><span class="saytext">${esc(s.line)}</span></div></div>`:"");
}

/* ============ the box score (round 73) ============
   From the game's own record only: the team numbers the engine counted and the scorers the run of play named. Every
   number here adds up to the score (test/boxscore.js). A sport's player-by-player lines are kept out where they are
   drawn per player rather than counted in the game (they would not add up). Each sport: sportBox(g) -> HTML. */
function boxHTML(g,open){
  if(!MOMENTS_ON||!g||!g.drives||!g.drives.length||typeof sportBox!=="function")return "";
  let b=""; try{ b=sportBox(g)||"" }catch(e){ b="" } if(!b)return "";
  return `<details class="boxscore"${open?" open":""}><summary>Box score</summary>${b}</details>` }
/* a team table: first column the label, then a column per side */
function boxTeams(g,rows,homeFirst){ const A=tAb(g.away), H=tAb(g.home);
  return statTable(["",homeFirst?H:A,homeFirst?A:H],rows.filter(Boolean).map(r=>({c:[esc(r[0]),homeFirst?r[2]:r[1],homeFirst?r[1]:r[2]].map(String)}))) }
