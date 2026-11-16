/* Every box score toggle in Scores opens to something (round 79). On a season begun on an older engine (787c225, engine 3:
   no game logs), and through a whole new season into its postseason: count Scores' box toggles and the empty ones.
     node test/sheets.js [file-prefix]          last line: MATCH or MISMATCH */
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'golden.js'),'utf8');
const mk=()=>{const m={exports:{}};new Function('require','module',src.slice(0,src.indexOf('const args'))+'\nmodule.exports={load};')(require,m);return m.exports.load};
const NEW=process.env.DIST||path.join(__dirname,'..','dist'), only=process.argv[2];
const old=rev=>{ const d=path.join(require('os').tmpdir(),'engine-replay-'+rev); fs.mkdirSync(d,{recursive:true}); return f=>{ const p=path.join(d,f); if(!fs.existsSync(p))fs.writeFileSync(p,require('child_process').execSync(`git show ${rev}:${f}`,{cwd:path.join(__dirname,'..'),maxBuffer:64<<20})); return p } };
const CASES=[['football-coach.html','Alabama',6],['football-coach-pro.html','Kansas City',7],['basketball-coach.html','Duke',12],['basketball-coach-pro.html','Boston',30],['hockey-coach-pro.html','Boston',30],['soccer-coach.html','Arsenal',14],['baseball-coach-pro.html','Seattle',50]];
const step=api=>{api.doAdvance();let n=0;while(api.live&&!api.live.done&&n++<5000){api.live.ask?api.answerLive(api.live.ask.dp.opts[0][0]):api.liveTick()}};
// a sheet drawn when opened (data-sheet): what opening it draws
const count=(html,api)=>{ const all=html.match(/<details class="boxscore"[\s\S]*?<\/details>/g)||[];
  return {n:all.length,empty:all.filter(x=>{ const m=/data-sheet="(\d+)"/.exec(x), body=m?(api.SHEETS[m[1]]?api.SHEETS[m[1]]():""):x; return !/<table/.test(body) }).length} };
(async()=>{ let bad=0; const O=old('787c225');
  for(const [f,team,steps] of CASES.filter(c=>!only||c[0].startsWith(only))){
    const A=mk()(O(f)); A.newDynasty(team,3,'T'); for(let i=0;i<steps;i++)step(A);
    const B=mk()(path.join(NEW,f)); await B.loadSave(JSON.stringify(A.S)); const c1=count(B.view('scores'),B);
    const C=mk()(path.join(NEW,f)); C.newDynasty(team,4,'T'); let g=0, c2={n:0,empty:0}; while(C.SEA.phase!=='done'&&g++<400){ step(C); if(C.SEA.phase!=='week'||g%5===0){ const c=count(C.view('scores'),C); c2.n+=c.n; c2.empty+=c.empty } }
    const c3=count(C.view('scores'),C); const ok=!c1.empty&&!c2.empty&&!c3.empty; if(!ok)bad++;
    console.log(`  ${ok?'ok  ':'FAIL'} ${f}: an engine-3 season, ${c1.n} box toggles in Scores (${c1.empty} empty); a new season's screens (every fifth, and the postseason), ${c2.n} (${c2.empty} empty); its last screen ${c3.n} (${c3.empty} empty)`) }
  console.log(bad?`MISMATCH ${bad}`:'MATCH every box score toggle opens to a box'); process.exit(bad?1:0) })();
