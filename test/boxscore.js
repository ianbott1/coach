/* Box scores and big moments (round 73). Plays the first season's games in each sport and, for every game you played:
   the box score is drawn and its numbers add up (soccer and hockey: the goals listed are the score, hockey's shots are
   its goals and saves; basketball: makes and free throws are the points; football: the drives' points; baseball: the
   line score's runs), and each big moment is true of the game (a hat-trick scorer is credited with three goals in the
   box score and in his game log; a walk-off ended in the home half; the last shot was yours and made; a comeback was
   that far behind; a shutout conceded none). Also how often each moment comes up.
     node test/boxscore.js [file-prefix]            last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const D=f=>path.join(process.env.DIST||path.join(__dirname,'..','dist'),f);
const CASES=[['soccer-coach.html','Arsenal'],['hockey-coach-pro.html','Boston'],['basketball-coach-pro.html','Boston'],['basketball-coach.html','Duke'],
  ['football-coach-pro.html','Kansas City'],['football-coach.html','Alabama'],['baseball-coach-pro.html','Seattle']];
let bad=0,checks=0; const ok=(c,m)=>{checks++; if(!c){bad++; if(bad<=20)console.log('  FAIL '+m)}};
for(const [f,team] of CASES.filter(c=>!process.argv[2]||c[0].startsWith(process.argv[2]))){
  const A=load({file:D(f),expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','momentsOf','momentHTML','boxHTML','sportBox','scScorer','hkGoalNames','glStride','NAMES','POS','STAT_KEYS','SPORT','SEGS','HL_SPORT']});
  A.newDynasty(team,5,'T'); let guard=0, games=0; const cnt={};
  while(A.SEA.phase!=='done'&&guard++<400){ A.doAdvance(); let n=0; while(A.live&&!A.live.done&&n++<4000){A.live.ask?A.answerLive(A.live.ask.dp.opts[A.live.ask.dp.opts.length-1][0]):A.liveTick()}
    const step=A.SEA.step-1, W=A.SEA.weeks[step]; if(!W)continue; const my=A.S.myTeam;
    const g=W.games.find(x=>(x.home===my||x.away===my)&&x.drives&&x.drives.length); if(!g||g.__seen)continue; g.__seen=1; games++;
    const sp=A.SPORT.id, Dr=g.drives, last=Dr[Dr.length-1], tag=`${f} ${g.away} ${g.ap} at ${g.home} ${g.hp}`;
    const box=A.boxHTML(g); ok(/class="boxscore"/.test(box),`${tag}: no box score`);
    const goals=[]; Dr.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k==='goal')goals.push(e) }));
    if(sp==='soccer'){ ok(goals.filter(e=>e.side==='home').length===g.hp&&goals.filter(e=>e.side==='away').length===g.ap,`${tag}: the goals listed aren't the score`);
      const st=Dr.filter(d=>d.st).slice(-1)[0].st; ['home','away'].forEach(sd=>ok(st[sd][1]>=goals.filter(e=>e.side===sd&&e.m<=90).length&&st[sd][0]>=st[sd][1],`${tag}: ${sd} shots ${st[sd]} short of its goals`)) }
    if(sp==='hockey'){ const so=g.so?1:0, hg=goals.filter(e=>e.side==='home').length, ag=goals.filter(e=>e.side==='away').length;
      ok(hg+ag+so===g.hp+g.ap&&hg<=g.hp&&ag<=g.ap,`${tag}: the goals listed (${ag}-${hg}) aren't the score`);
      const sv={home:0,away:0}, sh={home:0,away:0}; Dr.forEach(d=>{ (d.sv||[]).forEach(x=>sv[x.side]++); if(d.shots){ sh.home+=d.shots[0]||0; sh.away+=d.shots[1]||0 } });
      const gl=sd=>goals.filter(e=>e.side===sd&&!e.en&&!e.extra).length;
      const bs=(box.match(/Shots on goal<\/td><td[^>]*>(\d+)<\/td><td[^>]*>(\d+)/)||[]).slice(1).map(Number);
      ok(bs.length===2&&bs[0]===gl('away')+sv.home&&bs[1]===gl('home')+sv.away,`${tag}: the box's shots ${bs} aren't goals and saves`);
      ['home','away'].forEach(sd=>{ const o=sd==='home'?'away':'home'; ok(Math.abs(sh[sd]-(gl(sd)+sv[o]))<=3,`${tag}: ${sd} ${sh[sd]} shots in the spells but ${gl(sd)} goals and ${sv[o]} saves against`) }) }
    if(sp==='basketball'){ const L=Dr.filter(d=>d.ln).slice(-1)[0].ln, p=x=>2*x.fgm2+3*x.tpm+x.ftm; ok(p(L.home)===g.hp&&p(L.away)===g.ap,`${tag}: the box's points ${p(L.away)}-${p(L.home)}`) }
    if(sp==='football'){ const p=h=>Dr.filter(d=>d.home===h).reduce((t,d)=>t+(d.pts||0),0); ok(p(true)===g.hp&&p(false)===g.ap,`${tag}: the drives' points ${p(false)}-${p(true)}`) }
    if(sp==='baseball'){ const r=k=>Dr.reduce((t,d)=>t+(d[k]||0),0); ok(r('h')===g.hp&&r('a')===g.ap&&last.sh===g.hp,`${tag}: the line score's runs ${r('a')}-${r('h')}`); ok(Array.isArray(last.hits),`${tag}: no hits on the line score`) }
    // the moments, true of the game
    const M=A.momentsOf(g,my), meHome=g.home===my, side=meHome?'home':'away';
    M.forEach(m=>{ cnt[m.k]=(cnt[m.k]||0)+1;
      if(m.k==='hattrick'){ const nm=x=>sp==='soccer'?A.scScorer(my,x.u||0).n:A.hkGoalNames(my,x).n, k=goals.filter(e=>e.side===side&&nm(e)===m.who).length;
        ok(k>=3,`${tag}: hat-trick for ${m.who} with ${k} goals`); ok(box.split(m.who).length-1>=3,`${tag}: the box score doesn't list ${m.who} three times`);
        const R=A.SEA.roster[my], pl=R.find(p=>p&&p.n===m.who), w=A.glStride(); let gg=-1;
        const oi=A.NAMES.indexOf(meHome?g.away:g.home);
        if(pl&&pl.gl)for(let j=pl.gl.length-w;j>=0;j-=w)if(pl.gl[j]===step&&pl.gl[j+1]===oi){ const keys=A.STAT_KEYS[A.POS[pl.gl[j+5]].p]; gg=pl.gl[j+6+keys.indexOf('goals')]; break }
        ok(gg>=3,`${tag}: ${m.who}'s game log has ${gg} goals for his hat-trick`)
        // the third goal's clip says so (Instinct: "the third goal should be a moment: a HAT-TRICK banner")
        let gn=0; Dr.forEach(d=>{ try{ (A.HL_SPORT.clips({g:g,drives:Dr},d,'goals')||[]).forEach(c=>{ if(c.kind==='goal'&&(c.gno||0)>=3&&m.who.split(' ').slice(-1)[0]===c.nm)gn++ }) }catch(e){} });
        ok(gn===k-2,`${tag}: ${k} goals for ${m.who} but ${gn} hat-trick clips`) }
      if(m.k==='walkoff'){ const pv=Dr[Dr.length-2]; ok(meHome&&g.winner===my&&last.seg>=A.SEGS-1&&(pv?pv.sh:0)<=last.sa&&last.sh>last.sa,`${tag}: a walk-off that wasn't`) }
      if(m.k==='buzzer')ok(last.seg==='last'&&last.side===side&&last.made&&g.winner===my,`${tag}: a buzzer-beater that wasn't`);
      if(m.k==='shutout')ok(g.winner===my&&(meHome?g.ap:g.hp)===0,`${tag}: a shutout that conceded`);
      if(m.k==='comeback'){ let down=0; Dr.forEach(d=>{ const s=d.sh!==undefined?[d.sh,d.sa]:[d.h,d.a]; if(s[0]===undefined)return; const x=meHome?s[0]-s[1]:s[1]-s[0]; if(-x>down)down=-x });
        ok(g.winner===my&&new RegExp('^'+down+' down').test(m.l),`${tag}: comeback "${m.l}" but ${down} down at worst`) }
      if(m.k==='winner'){ let k=-1; Dr.forEach((d,i)=>{ if(d.pts>0)k=i }); const d=Dr[k]; ok(d&&d.home===meHome&&g.winner===my&&(meHome?d.h-d.pts<=d.a:d.a-d.pts<=d.h),`${tag}: a game-winner that wasn't`) }
      if(m.k==='ot')ok(g.winner===my&&last.seg>=A.SEGS&&!last.so,`${tag}: an overtime winner that wasn't`);
      if(m.k==='late'){ ok(g.winner===my&&Math.abs(g.hp-g.ap)===1,`${tag}: a late winner in a ${g.hp}-${g.ap} game`) } });
    if(M.length)ok(/momentcard/.test(A.momentHTML(g,my,step))&&/saytext/.test(A.momentHTML(g,my,step)),`${tag}: the moment ${M[0].k} has no card or no staff line`);
  }
  console.log(`  ${f}: ${games} games; moments ${Object.entries(cnt).map(([k,v])=>`${k} ${v} (${Math.round(100*v/games)}%)`).join(', ')||'none'}`);
}
console.log(bad?`MISMATCH ${bad} of ${checks} checks`:`MATCH ${checks} checks`); process.exit(bad?1:0);
