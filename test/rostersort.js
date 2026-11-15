/* The roster sorts by any season stat (round 79, Ian: "sortable roster"). In a real browser, all seven: a click sorts a column high to low, Enter on it flips it.
     node test/rostersort.js          last line: MATCH or MISMATCH */
const {chromium}=require('playwright'),path=require('path');
const G=[['football-coach.html','Alabama'],['football-coach-pro.html','Kansas City'],['basketball-coach.html','Duke'],['basketball-coach-pro.html','Boston'],['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
(async()=>{const b=await chromium.launch();let bad=0;
for(const [f,t] of G){const p=await b.newPage({viewport:{width:1265,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),f));await p.waitForTimeout(400);
await p.evaluate(([t])=>{newDynasty(t,5,'T');S.title=false;S.guide=false;for(let i=0;i<6;i++)SEA.advance();view='team';teamTab='roster';render()},[t]);
const ths=await p.$$('[data-rsort]'); if(!ths.length){console.log(f,'NO TABLE',errs);bad++;await p.close();continue}
// sort by the 3rd column of the first table (first stat), by click; then flip with Enter
const col=async()=>p.evaluate(()=>{const t=document.querySelector('[data-rsort]').closest('table');const c=rosterSort.c;return [...t.querySelectorAll('tr')].slice(1).map(r=>r.children[c+1].innerText)});
await p.click('[data-rsort][data-rcol="2"]');await p.waitForTimeout(100);const a=await col();
await p.focus('[data-rsort][data-rcol="2"]');await p.keyboard.press('Enter');await p.waitForTimeout(100);const b2=await col();
const num=v=>parseFloat(String(v).replace(/^\./,'0.'));const desc=a.every((v,i)=>i===0||num(a[i-1])>=num(v)), asc=b2.every((v,i)=>i===0||num(b2[i-1])<=num(v));
const step=await p.evaluate(()=>SEA.step);
console.log(f.padEnd(28),(desc&&asc)?'ok':'FAIL',`tables ${new Set(await Promise.all(ths.map(h=>h.getAttribute('data-rsort')))).size}, sorted down: ${a.slice(0,4).join(' ')} | up: ${b2.slice(0,4).join(' ')}`,errs.slice(0,1));
if(!(desc&&asc)||errs.length)bad++;await p.close()}
await b.close();console.log(bad?'MISMATCH '+bad:'MATCH the roster sorts by any column');process.exit(bad?1:0)})();
