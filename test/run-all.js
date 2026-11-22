/* Every test with a verdict, in every game, in one command.
     node test/run-all.js           the full suite (the long-run history checks too)
     node test/run-all.js --quick   everything but the long-run history checks (before a release)
     node test/run-all.js --fast    the quick tier: fingerprints in short, and the cheap checks (on every change)
   Builds all five games first. Prints a table and the failures' last lines;
   exits 1 if anything failed. (Measurement reports - calibrate, advisors,
   calls, the engine harnesses, the long-run recorders - aren't verdicts, so
   they're run by hand.) */
const {spawn,execFileSync}=require('child_process'), path=require('path'), fs=require('fs');
const ROOT=path.join(__dirname,'..'), D=f=>path.join(ROOT,'dist',f);
const quick=process.argv.includes('--quick'), fast=process.argv.includes('--fast');   // --fast: the quick tier, run on every change (round 80)
const G={cfb:'football-coach.html', nfl:'football-coach-pro.html', ncaab:'basketball-coach.html',
         nba:'basketball-coach-pro.html', nhl:'hockey-coach-pro.html', epl:'soccer-coach.html', mlb:'baseball-coach-pro.html'};
const T=[];
// --resume LOG: skip the tests a previous run of the same build logged as ok (a restarted machine lost the rest)
const resumeLog=(i=>i>=0&&process.argv[i+1])(process.argv.indexOf('--resume')), done0=new Set(resumeLog?require('fs').readFileSync(resumeLog,'utf8').split('\n').map(l=>(l.match(/^  ok   (.*) \(\d+s\)$/)||[])[1]).filter(Boolean):[]);
const add=(name,args,opt={})=>{ if(!done0.has(name))T.push(Object.assign({name,args,timeout:600000},opt)) };   // one CPU, four at a time
// in every game
for(const [lg,f] of Object.entries(G)){
  add(`golden ${lg}`,['golden.js',D(f)],{timeout:1200000});   /* round 79: mlb passed 600s beside the browser tests */
  add(`hotseat ${lg}`,['hotseat.js',D(f)],{timeout:2400000});   // round 56: baseball's is 4 min alone, past 600s beside the browser tests (round 77: 10 min alone, past 1200s beside them)
  add(`storage ${lg}`,['storage.js',D(f)],{fast:true});
  add(`golden in short ${lg}`,['golden.js',D(f),'--fast'],{fast:true,only:'fast'});   // round 80: one career, one season: the quick tier's fingerprint
  add(`reload ${lg}`,['reload.js',D(f)]);
}
// across games
add('saves (all six)',['saves.js'],{fast:true}); add('layouts (all six)',['layouts.js'],{timeout:1800000});   /* round 53: 559s with six games; a seventh passed 600s beside the others */
add('sim and skip (all six)',['sim-and-skip.js'],{fast:true}); add('sim ahead (all six)',['sim-ahead.js'],{fast:true}); add('objectives (all six)',['objectives.js','3']); add('goals and seat badge',['goals.js']);
add('migrate old saves (college football)',['migrate.js']);
// college football
add('h2h (cfb)',['h2h.js',D(G.cfb)]); add('moves (cfb)',['moves.js',D(G.cfb)]);
add('firing (cfb)',['firing.js',D(G.cfb)],{timeout:2700000});   /* ~410s alone; over 900s when it shares the CPU with the browser tests (round 38); round 94: 1365s alone, past 1500s beside them */ add('clinch marks (nfl)',['clinch.js',D(G.nfl),'120'],{fast:true});
add('plans (cfb)',['plans.js',D(G.cfb)],{fast:true}); add('the plan line after the game (all seven)',['plan-line.js'],{fast:true}); add('soccer\'s 80\' call is a read on their legs',['sc-final.js'],{fast:true}); add('a hurt man is never in a clip (six games)',['hl-hurt.js'],{fast:true}); add('a live football game names who is playing (cfb, nfl)',['fb-live-names.js'],{fast:true}); add("basketball's full match plays every possession (browser)",['bb-full.js'],{fast:true,timeout:1200000}); add("baseball's full match plays every at-bat (browser)",['bs-full.js'],{fast:true,timeout:1500000}); add('a baseball call inside an inning: the score never steps back (browser)',['bs-call-hold.js'],{fast:true,timeout:1200000}); add('the team card\'s figures open their pages (all seven, browser)',['golinks.js'],{fast:true,timeout:900000}); add('a conference title loss isn\'t the end of the season (cfb)',['cfb-conf.js'],{fast:true,timeout:900000}); add('rested starters leave the clips (cfb)',['fb-rest.js'],{fast:true,timeout:900000}); add('Full match plays each stretch before its moments, none lost (soccer, hockey, browser)',['full-order.js'],{timeout:1200000}); add('call verdicts (nfl)',['fb-verdicts.js',D(G.nfl),'60']); add('verdicts agree with the post-game line (nfl)',['verdict-agree.js',D(G.nfl)]); add('your players (all six)',['people.js']); add('a game is recorded once (cfb, nfl, epl)',['double-finish.js'],{fast:true});  add('the two-point call (cfb, nfl)',['two-point.js'],{fast:true}); add('postseason: only your own games (all six)',['postseason-gate.js']);
// pro football
add('rules (nfl)',['nfl.js',D(G.nfl),'3','8'],{timeout:1200000});   /* ~190s alone; ran 400-500s beside the browser tests and passed 600s in round 72 */ add('draft board (nfl)',['draftboard.js',D(G.nfl)]);
add('free-agent targets (nfl)',['fatargets.js',D(G.nfl)]); add('trades (nfl)',['trades.js',D(G.nfl)]);
// college basketball
add('bracket (ncaab)',['bb-bracket.js','12']); add('screens (ncaab)',['bb-screens.js']);
add('transfer portal (ncaab)',['bb-portal.js','4']);
add('March vs history (ncaab)',['bb-march.js','2','100'],{long:true});
// pro basketball
add('playoffs (nba)',['nba-playoffs.js','4']); add('screens (nba)',['nba-screens.js']);
add('NBA history (nba)',['nba-history.js','2','100'],{long:true});
add('draft labels hold their bands (pro)',['draft-labels.js','16'],{long:true});
// pro hockey
add('playoffs (nhl)',['nhl-playoffs.js','3']); add('clinch marks (nhl)',['nhl-clinch.js','4']);
add('screens (nhl)',['nhl-screens.js']); add('NHL history (nhl)',['nhl-history.js','2','60'],{long:true});
// English football
add('rules (epl)',['epl-rules.js','4']); add('screens (epl)',['epl-screens.js']); add('strength predicts the table (epl)',['epl-predict.js']); add('decisions (epl)',['sc-decisions.js']); add('FA Cup (epl)',['epl-cup.js','6']); add('transfer window (epl)',['transfers.js']); add('reads (nhl)',['hk-reads.js']); add('reads (ncaab)',['bb-reads.js','college']); add('reads (nba)',['bb-reads.js','pro']); add('reads (cfb)',['fb-reads.js','college','8000']); add('reads (nfl)',['fb-reads.js','pro','8000']);
add('players\' stats pages and leaders (all seven)',['stats.js'],{timeout:1800000});
add('highlights keep the suspense (browser)',['hl-suspense.js'],{timeout:400000});
add('saves survive the browser closing the database (all seven)',['idb-close.js']);
add('reported cases (all six)',['regressions.js'],{timeout:1800000});   /* ~375s alone; past 600s beside the browser tests (round 47) */ add('what your calls did (all six)',['call-impact.js']); add('recruiting board (cfb, ncaab)',['recruiting.js']); add('lines and ice time (nhl)',['lines.js']); add('two-tap confirms in a browser',['confirm-taps.js']); add('cards name only choices made (browser)',['card-honest.js']); add('late calls in close finishes (all six)',['late-calls.js']); add('the season story (four games)',['story.js']); add('full storage never hides a career (browser)',['storage-full.js']); add('simming plays like the computer coaches',['sim-parity.js']); add('what is at stake (all six)',['stakes.js']); add('the live chance is honest (all six)',['live-wp.js'],{timeout:1200000}); add('an old copy says so (browser)',['version.js']); add('no shared surname on a new roster (all six)',['names.js']); add('highlights play and change nothing (browser)',['highlights.js']); add('one clock: the header keeps a clip\'s time (all seven, browser)',['clocks.js','--check'],{timeout:1500000}); add('the fixed bar hides no control (five sports, laptop and phone, browser)',['bar-cover.js']); add('the score stays in sight at a call and after it (four sports, phone and laptop, browser)',['score-visible.js'],{timeout:900000}); add('the win chance on every call screen, as it stands (all seven, browser)',['callwp.js'],{timeout:900000}); add('the rewatch plays the game on the pitch (all seven, browser)',['rewatch.js'],{timeout:1200000}); add('box scores add up, big moments are true (all seven)',['boxscore.js'],{fast:true,timeout:1500000}); add('the coach\'s notes come, go, and stay gone (all seven, browser)',['guide.js'],{timeout:900000}); add('the box score opens however you press it, and under Rewatch (all seven, browser)',['boxclick.js'],{fast:true,timeout:1500000}); add('the roster sorts by any column (all seven, browser)',['rostersort.js'],{fast:true,timeout:900000}); add('game stats while a game is on (all seven, browser)',['livestats.js'],{fast:true,timeout:900000}); add('Skip stops for a close finish (all seven)',['skipfinish.js'],{fast:true,timeout:900000}); add('football clips show what happened: returns, conversions, pursuit (browser)',['fb-clips.js'],{fast:true,timeout:900000}); add('hockey puts the right men on the ice',['hk-lines.js'],{fast:true,timeout:900000}); add('basketball puts the right men on the floor',['bb-floor.js'],{fast:true,timeout:900000}); add('soccer\'s monthly awards are true',['months.js'],{fast:true,timeout:900000}); add('any game in the league replays to its score, names agree, nothing changes (all seven)',['replay.js'],{timeout:1800000}); add('watch any game in the league (all seven, browser)',['watchany.js'],{fast:true,timeout:1200000}); add('every box score toggle opens to a box (all seven, old seasons and postseasons)',['sheets.js'],{timeout:1500000}); add('players\' lines add up to the game, league-wide (all seven)',['statsum.js','--check'],{fast:true,timeout:1500000}); add('an older season replays as it was played (all seven)',['engine-replay.js'],{timeout:2700000});   /* twelve old builds: past 1500s beside the browser tests (round 92) */ add('baseball plays like MLB',['bs-calibrate.js']); add('first-round picks in deals: held, made, drafted, replayed (browser)',['picks.js'],{fast:true,timeout:1500000}); add('player attributes: they sum to the rating, hold their shape, develop by age (all seven)',['attrs.js'],{fast:true,timeout:1500000}); add('a baseball rating means the same however a player leans',['attrs-bs.js'],{fast:true,timeout:900000}); add('a basketball rating means the same however a player leans, and a shape shows (both)',['attrs-bb.js'],{fast:true,timeout:1500000}); add('hockey and soccer ratings mean the same however a player leans, and shapes show',['attrs-hs.js'],{fast:true,timeout:1500000}); add('a football rating means the same however a player leans, and shapes show (both)',['attrs-fb.js'],{fast:true,timeout:1500000}); add('every club plays to its opening roster, the report says so (all seven)',['styles.js'],{fast:true,timeout:900000}); add('a shared seat replays both coaches\' promotions and trades (browser)',['hotseat-moves.js'],{fast:true,timeout:900000}); add('a moved man keeps his season in his career (browser)',['careers-moved.js'],{fast:true,timeout:900000}); add('trades in the season: offers, asks, kept, replayed, shut at the deadline, carried on (five pro games, browser)',['trades.js'],{fast:true,timeout:1500000}); add('baseball\'s pitchers trade jobs, kept and replayed (browser)',['bs-staff.js'],{fast:true,timeout:900000}); add('baseball\'s pitchers trade jobs, kept and replayed (browser)',['bs-staff.js'],{fast:true,timeout:900000}); add('baseball\'s players look like MLB\'s',['bs-players.js','--check'],{timeout:1800000}); add('every game speaks its own sport (all seven)',['wrong-sport.js'],{timeout:1500000}); add('a reload in a real browser gives back the season (all seven)',['reload-browser.js'],{timeout:1500000});

(async()=>{
  const t0=Date.now();
  process.stdout.write('building all six games... ');
  for(const lg of Object.keys(G))execFileSync('python3',['build.py',lg],{cwd:ROOT,stdio:'ignore'});
  console.log('done');
  // round 80: as many at once as there are cores (it ran four on two: each took twice as long, and slow ones timed out
  // and had to be run again), one browser at a time (Chromium is several processes of its own), longest first by the
  // last run's times (test/timings.json), so the long ones don't start last
  const TIMES=(()=>{ try{ return JSON.parse(fs.readFileSync(path.join(__dirname,'timings.json'),'utf8')) }catch(e){ return {} } })();
  const isBrowser=t=>t.browser||/browser|layouts|cards name|two-tap|highlights play|one clock|score stays|fixed bar|win chance on every|rewatch|box score opens|roster sorts|game stats while|reload in a real/.test(t.name);
  const todo=T.filter(t=>!(quick&&t.long)&&(fast?t.fast:t.only!=='fast')).sort((a,b)=>(TIMES[b.name]||300)-(TIMES[a.name]||300)), results=[];
  const W=Math.max(1,Math.min(4,+(process.env.WORKERS||require('os').cpus().length)));
  let browsers=0;
  const run=t=>new Promise(res=>{
    const s=Date.now(), p=spawn('node',t.args.map((a,i)=>i===0?path.join(__dirname,a):a),{cwd:ROOT,env:Object.assign({},process.env,{TEAM:''})});
    let out=''; p.stdout.on('data',d=>out+=d); p.stderr.on('data',d=>out+=d);
    const kill=setTimeout(()=>{p.kill('SIGKILL'); out+='\nTIMEOUT'},t.timeout);
    p.on('close',()=>{clearTimeout(kill);
      const lines=out.trim().split('\n'), last=lines[lines.length-1]||'';
      const ok=/^(MATCH|AGREE)/.test(last)&&!/TIMEOUT/.test(out);
      results.push({name:t.name,ok,last,secs:Math.round((Date.now()-s)/1000),tail:lines.slice(-6).join('\n')}); res()});
  });
  // round 82: two browser tests at once on two cores (one at a time left a core idle once only browser tests were left:
  // the round 81 run took 112 minutes); BROWSERS=1 to go back
  const MAXB=Math.max(1,+(process.env.BROWSERS||1));
  const pick=()=>{ const i=todo.findIndex(t=>!isBrowser(t)||browsers<MAXB); return i<0?null:todo.splice(i,1)[0] };
  const worker=async()=>{ while(todo.length){ const t=pick(); if(!t){ await new Promise(r=>setTimeout(r,500)); continue }
    const br=isBrowser(t); if(br)browsers++; await run(t); if(br)browsers--;
    const r=results[results.length-1]; console.log(`${r.ok?'  ok  ':'  FAIL'} ${r.name} (${r.secs}s)`) } };
  await Promise.all([...Array(W)].map(worker));
  // the times for next run's order (a full run's; a fast run adds its own)
  try{ const out=Object.assign({},TIMES); results.forEach(r=>{ if(r.ok)out[r.name]=r.secs }); fs.writeFileSync(path.join(__dirname,'timings.json'),JSON.stringify(out,null,1)) }catch(e){}
  const bad=results.filter(r=>!r.ok);
  console.log(`\n${results.length-bad.length} of ${results.length} passed${fast?' (fast tier)':quick?' (quick: long-run history checks skipped)':''}, ${Math.round((Date.now()-t0)/1000)}s`);
  bad.forEach(r=>console.log(`\n--- ${r.name}\n${r.tail}`));
  console.log(bad.length?'MISMATCH '+bad.length+' failed':'MATCH everything passed');
  process.exit(bad.length?1:0);
})();
