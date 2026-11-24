/* Moves made before the day's game survive a reload, and the numbers with them (round 107: ten promotions before week 1
   were gone after a reload, the depth chart back as it was; numbers reshuffled with the depth chart: Grokbot).
     node test/promo-reload.js [distDir]      last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
let bad=0; (async()=>{ const b=await chromium.launch();
 for(const [f,t] of [['football-coach-pro.html','Green Bay'],['basketball-coach-pro.html','Orlando'],['soccer-coach.html','Southampton']]){
 const ctx=await b.newContext(); const p=await ctx.newPage(); const url='file://'+path.join(process.argv[2]||path.join(__dirname,'..','dist'),f);
 await p.goto(url); await p.waitForTimeout(400); await p.click('#qstart'); await p.waitForTimeout(900);
 const nums=()=>p.evaluate(()=>{ const t=S.myTeam,o={}; SEA.roster[t].forEach((q,i)=>{ if(q)o[q.n]=shirtNo(t,i) }); return o });
 const ord=()=>p.evaluate(()=>SEA.roster[S.myTeam].slice(0,POS.length).map(q=>q&&q.n).join(','));const n0=await nums();
 const did=await p.evaluate(()=>{ let k=0; for(let i=0;i<POS.length;i++){ try{ promote(i); k++ }catch(e){} } save(); return k });
 await p.waitForTimeout(3000); const n1=await nums(); const o1=await ord();
 await p.goto(url); await p.waitForTimeout(800); await p.click('[data-slot="1"]'); await p.waitForTimeout(1500); const n2=await nums(); const o2=await ord();
 const d=(a,b)=>Object.keys(a).filter(k=>b[k]!==undefined&&a[k]!==b[k]).length;
  const ok=did>0&&o1===o2&&!d(n0,n1)&&!d(n0,n2); if(!ok)bad++; console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${did} promotions before the game; after a reload the depth chart ${o1===o2?'kept':'went back'}; numbers changed ${d(n0,n1)} on the swaps, ${d(n0,n2)} on the reload`); await ctx.close() }
  await b.close(); console.log(bad?'MISMATCH '+bad:'MATCH moves before the game survive a reload'); process.exit(bad?1:0) })();
