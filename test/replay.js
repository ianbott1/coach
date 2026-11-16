/* Any game in the league can be watched (round 81). A whole season with its postseason in every game, then every
   computer game played again from its kept dice (replayGame):
     every one has a replay and ends with the recorded score;
     the names on the replay agree with that game's box score, after a season of injuries and moves (soccer's and
     hockey's scorers, football's touchdown scorers by surname in the run of play);
     replaying changes nothing: the season's dice, records, ratings and every player's line are the same after.
     node test/replay.js [file-prefix]          last line: MATCH or MISMATCH */
const path=require('path'), crypto=require('crypto'); const {load}=require('./harness.js'); let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const DIR=process.env.DIST||path.join(__dirname,'..','dist'), only=process.argv[2];
const GAMES=[['football-coach.html','Alabama'],['football-coach-pro.html','Kansas City'],['basketball-coach.html','Duke'],['basketball-coach-pro.html','Boston'],['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
const sur=n=>String(n).split(' ').slice(-1)[0];
for(const [f,team] of GAMES.filter(g=>!only||g[0].startsWith(only))){
  const A=load({file:path.join(DIR,f),expose:['SEA','NAMES','newDynasty','replayGame','gameSheet','driveScript']});
  A.newDynasty(team,5,'T'); let g=0; while(A.SEA.phase!=='done'&&g++<600)A.SEA.advance();
  const hash=()=>crypto.createHash('md5').update(JSON.stringify([A.SEA.rng.a,A.SEA.rng.sp,A.SEA.rec,A.SEA.elo,A.NAMES.map(t=>(A.SEA.roster[t]||[]).map(p=>p&&[p.n,p.st2,p.gl&&p.gl.length]))])).digest('hex');
  const h0=hash(); let n=0,rep=0,named=0,nameOk=0,post=0,postRep=0,gap=0;
  A.SEA.weeks.forEach((W,s)=>W.games.forEach(gm=>{ if(gm.drives||gm.hp===undefined||gm.home===A.SEA.userTeam||gm.away===A.SEA.userTeam)return; n++; const isPost=!!(gm.title||gm.cup||s>=(A.SEA.regWeeks||1e9)); if(isPost)post++;
    const r=A.replayGame(gm,s); if(!r)return; rep++; if(isPost)postRep++;
    const sheet=(A.gameSheet(gm,s)||'').replace(/<[^>]+>/g,' ');
    // (round 82: the 2 a season that once missed were the box score reading the other game of a cup week: fixed there)
    if(/hockey|soccer/.test(f)){ const goals=sheet.match(/\S+ (?:ST|W|CM|CB|FB|C|LW|RW|D) \d+/g)||[]; r.drives.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k!=='goal'||!e.nm||e.dp)return; named++; if(sheet.indexOf(sur(e.nm))>=0)nameOk++; else gap++ })) }
    if(/football/.test(f)){ A.driveScript(r,r.drives).forEach(row=>{ if(!(row.pts>=6))return; const m=/^([A-Z][\w'.-]+(?: [A-Z][\w'.-]+)*) /.exec(row.text||''); if(!m)return; named++; if(sheet.indexOf(sur(m[1]))>=0)nameOk++ }) } }));
  const h1=hash();
  ok(n>0&&rep===n,`${f}: ${rep} of ${n} computer games replay to their score (${postRep} of ${post} in the postseason or a cup)`);
  if(named)ok(nameOk===named,`${f}: names on the replays agree with the box score (${nameOk} of ${named})`);
  ok(h0===h1,`${f}: replaying them all changes nothing`) }
console.log(bad?`MISMATCH ${bad}`:'MATCH any game in the league can be watched'); process.exit(bad?1:0);
