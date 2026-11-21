/* A season begun on an older engine replays as it was played (round 74: players' lines moved to engine 4). Plays part of
   a season on an older build (OLD=dir of its pages; by default round 73's pages, from git), saves it, loads the save into this build and
   compares every game, the standings and every player's season line.
     OLD=dir node test/engine-replay.js [file-prefix]       last line: MATCH or MISMATCH */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const src=fs.readFileSync(path.join(__dirname,'golden.js'),'utf8');
const mk=()=>{const m={exports:{}};new Function('require','module',src.slice(0,src.indexOf('const args'))+'\nmodule.exports={load};')(require,m);return m.exports.load};
// the older build: OLD=dir, or the pages of the last engine-3 release (round 73, 787c225) out of the repository's history
// (round 75: and engine 4's, round 74 at 422d434: a season begun there replays too)
const OLD_REVS=['787c225','422d434','d4e4511','ccb8bef','45aadc8','6ca161d','b56cce8','0be3e6a','953f097','30013f3','98999e1','a2b6b14','e8f58c2','446b6e3'];   // engines 3 to 16 (rounds 73, 74, 76, 77, 79, 84, 86, 87, 88, 89, 90, 91, 92, 93)
const pages=rev=>{ const d=path.join(require('os').tmpdir(),'engine-replay-'+rev); try{ fs.mkdirSync(d,{recursive:true});
  for(const c of ['football-coach','football-coach-pro','basketball-coach','basketball-coach-pro','hockey-coach-pro','soccer-coach','baseball-coach-pro']){ const f=path.join(d,c+'.html');
    if(!fs.existsSync(f))fs.writeFileSync(f,require('child_process').execSync(`git show ${rev}:${c}.html`,{cwd:path.join(__dirname,'..'),maxBuffer:64<<20})) } }catch(e){ return path.join(d,'missing') } return d };
const OLDS=process.env.OLD?[process.env.OLD]:OLD_REVS.map(pages);
const NEW=process.env.DIST||path.join(__dirname,'..','dist');
const only=process.argv.slice(2).find(a=>!a.startsWith('--'));
const h=o=>crypto.createHash('md5').update(JSON.stringify(o)??'undefined').digest('hex').slice(0,8);
const CASES=[['football-coach.html','Alabama',6],['football-coach-pro.html','Kansas City',7],['basketball-coach.html','Duke',12],['basketball-coach-pro.html','Boston',30],
  ['hockey-coach-pro.html','Boston',30],['soccer-coach.html','Arsenal',14],['baseball-coach-pro.html','Seattle',50]];
const step=api=>{api.doAdvance();let n=0;while(api.live&&!api.live.done&&n++<5000){api.live.ask?api.answerLive(api.live.ask.dp.opts[(n+api.SEA.step)%api.live.ask.dp.opts.length][0]):api.liveTick()}};
const state=api=>{ const E=api.SEA, lines={};
  Object.keys(E.roster||{}).forEach(t=>(E.roster[t]||[]).forEach(p=>{ if(p&&p.st2)lines[t+'|'+p.n]=p.st2 }));
  return {games:E.weeks.map(w=>w.games.map(g=>[g.home,g.away,g.hp,g.ap])),rec:E.rec,lines:lines} };
(async()=>{ let bad=0;
  for(const OLD of OLDS){ if(!fs.existsSync(OLD)){ console.log(`  no older build at ${OLD}`); bad++; continue } console.log(`  from ${path.basename(OLD)}`);
  for(const [f,team,steps] of CASES.filter(c=>!only||c[0].startsWith(only))){
    const A=mk()(path.join(OLD,f)); A.newDynasty(team,3,'T'); for(let i=0;i<steps;i++)step(A);
    const B=mk()(path.join(NEW,f)); await B.loadSave(JSON.stringify(A.S));
    const a=state(A), b=state(B), diffs=Object.keys(a).filter(k=>h(a[k])!==h(b[k]));
    // and on into the season, both builds: the old season keeps its old lines
    for(let i=0;i<4;i++){ step(A); step(B) }
    const a2=state(A), b2=state(B), d2=Object.keys(a2).filter(k=>h(a2[k])!==h(b2[k]));
    const ok=!diffs.length&&!d2.length; if(!ok)bad++;
    console.log(`  ${ok?'ok  ':'FAIL'} ${f}: ${steps} steps on the older build, reloaded here${diffs.length?' ('+diffs.join(', ')+' differ)':''}; 4 more on each${d2.length?' ('+d2.join(', ')+' differ)':''}`);
  } }
  console.log(bad?`MISMATCH ${bad}`:'MATCH an older season replays as it was played'); process.exit(bad?1:0) })();
