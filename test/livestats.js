/* Game stats a tap away while a game is on (round 79, Ian: "in-game stats"). In a real browser, all seven: a live game shows "Game stats so far", it opens, and it stays open through the next redraw.
     node test/livestats.js          last line: MATCH or MISMATCH */
const {chromium}=require('playwright'),path=require('path');
const G=[['football-coach.html','Alabama'],['football-coach-pro.html','Kansas City'],['basketball-coach.html','Duke'],['basketball-coach-pro.html','Boston'],['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
(async()=>{const b=await chromium.launch();let bad=0;
for(const [f,t] of G){const p=await b.newPage({viewport:{width:1265,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),f));await p.waitForTimeout(400);
await p.evaluate(([t])=>{newDynasty(t,5,'T');S.title=false;S.guide=false;render();for(let k=0;k<8&&!live;k++)doAdvance()},[t]);
let got=null;for(let i=0;i<3000&&!got;i++){got=await p.evaluate((i)=>{ if(!live||live.done)return 'done'; if(live.ask)answerLive(live.ask.dp.opts[0][0]); else liveTick(); render(); const d=document.querySelector('details.livestats'); if(d&&live.drives.length>=3){ d.open=true; d.dispatchEvent(new Event('toggle')); return {txt:d.innerText.slice(0,260),sc:liveH()+'-'+liveA()} } return null },i)}
// stays open after a redraw
const still=await p.evaluate(()=>{ if(live&&!live.done&&!live.ask)liveTick(); render(); const d=document.querySelector('details.livestats'); return d?d.open:null });
console.log('=== '+f,JSON.stringify(got),'open after redraw:',still,errs.slice(0,1)); if(!got||got==='done'||still!==true||errs.length)bad++; await p.close()}
await b.close();console.log(bad?'MISMATCH '+bad:'MATCH game stats open while a game is on');process.exit(bad?1:0)})();
