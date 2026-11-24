/* On a laptop or desktop, a Needs a decision card's buttons show above the side column's pinned Play button without
   scrolling (round 107, Instinct: the sticky Play area covered the cards). node test/side-decision.js [dist]  last line: MATCH or MISMATCH */
const {chromium}=require('playwright'), path=require('path');
let bad=0,seen=0; (async()=>{ const b=await chromium.launch();
 for(const [w,h] of [[1280,800],[1265,720],[1440,900]]) for(const [f,t] of [['football-coach.html','Auburn'],['basketball-coach-pro.html','Orlando'],['basketball-coach.html','Minnesota'],['hockey-coach-pro.html','Florida'],['soccer-coach.html','Southampton'],['baseball-coach-pro.html','Seattle'],['football-coach-pro.html','Green Bay']]){
 const p=await (await b.newContext({viewport:{width:w,height:h}})).newPage();
 await p.goto('file://'+path.join(process.argv[2]||path.join(__dirname,'..','dist'),f)); await p.waitForTimeout(300);
 await p.evaluate(t=>{ newDynasty(t,7,'T'); S.title=false; S.guide=false; render() },t); await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{ const sb=document.querySelector('.sidebtn'); if(!sb)return 'no side'; const B=sb.getBoundingClientRect(); const bt=[...document.querySelectorAll('#side .attnbtn, #side .attn button')]; if(!bt.length)return 'no decision';
   return bt.map(e=>{ const R=e.getBoundingClientRect(); return R.bottom<=B.top+1&&R.top>=0?'seen':'covered' }).join(',') });
  if(/covered/.test(r))bad++; if(/seen/.test(r))seen++; console.log(`${/covered/.test(r)?'  FAIL':'  ok  '} ${w}x${h} ${f}: ${r}`); await p.close() }
  await b.close(); const ok=!bad&&seen>0; console.log(ok?'MATCH a decision card is seen above the pinned Play button':'MISMATCH '+bad); process.exit(ok?0:1) })();
