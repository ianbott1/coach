/* A man moved to another slot keeps his season in his career (round 83). Before, careers were banked by slot and name
   together, so a promoted man, the man he replaced, and baseball's pitchers who traded jobs (round 82) lost the season:
   on round 82, 0 of 4. In a real browser, baseball: trade the ace's and the closer's jobs, promote a backup, play the
   season out, start the next: each of the four has his season.      node test/careers-moved.js   last line: MATCH or MISMATCH */
const {chromium}=require('playwright'),path=require('path');(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),'baseball-coach-pro.html'));await p.waitForTimeout(300);
const r=await p.evaluate(()=>{newDynasty('Seattle',5,'T');S.title=false;S.guide=false;for(let i=0;i<5;i++)simAdvance();
  const R=SEA.roster[S.myTeam], who=[R[BS_SP[0]].n,R[BS_CL].n,R[BK(0)].n,R[0].n]; swapRoles(BS_SP[0],BS_CL); promote(0);
  let n=0; while(SEA.phase!=="done"&&n<400){simAdvance();n++} const y=SEA.year;
  openOffseason(); const O=S.off; if(O&&O.act&&O.act.userOpen)O.move=S.myTeam; if(LEAGUE.ui.offseasonBlock()!==null)Object.keys(O.picks.resign).forEach(k=>O.picks.resign[k]=false); commitOffseason();
  return who.map(nm=>{let q=null;NAMES.forEach(t=>{const x=U.roster[t].find(z=>z&&z.n===nm);if(x)q=x});return [nm,q?(q.hist||[]).filter(e=>e.y===y&&e.s&&e.s.g>0).length:'gone']})});
console.log(JSON.stringify(r)); const bad=r.filter(x=>x[1]===0).length; await b.close();
console.log(bad?'MISMATCH '+bad+' lost their season':'MATCH a moved man keeps his season');process.exit(bad?1:0)})();
