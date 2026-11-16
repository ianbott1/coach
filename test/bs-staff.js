/* Baseball's pitching staff by role (round 82, Ian: "restructure the rotation and the bullpen"). In a real browser:
   the Pitching staff card lists five starters, the closer, the set-up and long men; tapping Move on one and then on
   another trades their jobs (the roster slots swap, the strength follows the slots); the trade is kept with its day,
   so a rebuild from the save plays the season the same way; an ace moved to the bullpen starts no more games.
     node test/bs-staff.js          last line: MATCH or MISMATCH */
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('FAIL',m)}};
const p=await b.newPage({viewport:{width:1265,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),'baseball-coach-pro.html'));await p.waitForTimeout(400);
await p.evaluate(()=>{newDynasty('Seattle',5,'T');S.title=false;S.guide=false;for(let i=0;i<10;i++)simAdvance();view='team';teamTab='roster';render()});
const roles=await p.$$eval('[data-role]',a=>a.map(x=>+x.dataset.role));
ok(roles.length===8,`8 jobs on the card (got ${roles.length})`);
const pre=await p.evaluate(()=>{const R=SEA.roster[S.myTeam];return {ace:R[BS_SP[0]].n,cl:R[BS_CL].n,base:SEA.talent.base[S.myTeam],aceGs:(R[BS_SP[0]].st2||{}).gs||0}});
await p.click(`[data-role="${roles[0]}"]`);await p.waitForTimeout(80);
const note=await p.evaluate(()=>document.body.innerText.includes('Now tap the job'));ok(note,'after the first tap the card asks for the second');
await p.click(`[data-role="${roles[5]}"]`);await p.waitForTimeout(80);
const mid=await p.evaluate(()=>{const R=SEA.roster[S.myTeam];return {ace:R[BS_SP[0]].n,cl:R[BS_CL].n,base:SEA.talent.base[S.myTeam],log:JSON.stringify(S.promos)}});
ok(mid.ace===pre.cl&&mid.cl===pre.ace,`the ace (${pre.ace}) and the closer (${pre.cl}) traded jobs: now ${mid.ace} starts, ${mid.cl} closes`);
ok(mid.base!==pre.base,`strength follows the jobs (${pre.base.toFixed(1)} to ${mid.base.toFixed(1)})`);
ok(/"j":/.test(mid.log),'the trade is kept in the save: '+mid.log);
// play on 30 days, then rebuild from the save: the same season
const after=await p.evaluate(()=>{for(let i=0;i<30;i++)simAdvance();const R=SEA.roster[S.myTeam];
  const a=JSON.stringify([SEA.rec,SEA.weeks.slice(0,SEA.step).map(W=>W.games.map(g=>[g.hp,g.ap]))]);
  const exAce=R.find(x=>x.n===window.__ace||false);rebuild();const b2=JSON.stringify([SEA.rec,SEA.weeks.slice(0,SEA.step).map(W=>W.games.map(g=>[g.hp,g.ap]))]);
  return {same:a===b2,len:a.length,step:SEA.step}});
ok(after.same,'a rebuild from the save plays the same 40 days ('+after.step+' steps)');
const gs=await p.evaluate(n=>{const R=SEA.roster[S.myTeam];const x=R.find(q=>q.n===n);return {gs:(x.st2||{}).gs||0,sv:(x.st2||{}).sv||0,ip:(x.st2||{}).ip||0}},pre.ace);
ok(gs.gs===pre.aceGs,`the ace in the closer's job started no more games (${pre.aceGs} before, ${gs.gs} after; ${gs.sv} saves, ${gs.ip} outs)`);
const shot=await p.evaluate(()=>{const t=[...document.querySelectorAll('.grouphead')].find(h=>h.textContent==='Pitching staff');return t?t.nextElementSibling.textContent+' | '+t.nextElementSibling.nextElementSibling.innerText.slice(0,400):'NO CARD'});
console.log(shot);ok(!errs.length,'page errors: '+errs.join(' | '));
await b.close();console.log(bad?'MISMATCH '+bad:'MATCH the staff trades jobs, kept and replayed');process.exit(bad?1:0)})();
