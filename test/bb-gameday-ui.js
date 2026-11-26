/* Basketball game day in the built games (round 111): timeouts in live games, both basketballs. A few weeks of live
   games: the run call draws its evidence and staff, the live bar's Timeout button (two taps) asks what you change and
   is shown as called until the break, the run of play says TIMEOUT, every game finishes and its result card draws,
   and a reload of a game played with a timeout gives back the same score.
     node test/bb-gameday-ui.js          last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js'); let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
for(const [f,team] of [['basketball-coach.html','Duke'],['basketball-coach-pro.html','Boston']]){
  const A=load({file:path.join(process.env.DIST||path.join(__dirname,'..','dist'),f),
    expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','render','setActMidGame','liveActsHTML','liveCallView','evidenceHTML','playsHTML','ENGINE_V','callImpact','liveSeed','makeLiveGame','RNG']});
  A.newDynasty(team,7,'T'); const o={rotBar:0,rotPend:0,rotRow:0,legs:0,games:0,runAsk:0,runDraw:0,mine:0,mineDraw:0,btn:0,pend:0,toRow:0,done:0,same:0,checked:0};
  ok(A.ENGINE_V>=25,`${f}: a new career plays engine ${A.ENGINE_V}`);
  for(let w=0;w<8;w++){ A.doAdvance(); if(!A.live)continue; o.games++; let n=0, pressed=false, rotd=false;
    while(A.live&&!A.live.done&&n++<6000){ const L=A.live;
      if(L.ask){ const dp=L.ask.dp;
        if(dp.k==="timeout"||dp.k==="tomine"){ const h=A.liveCallView(); if(dp.k==="timeout")o.runAsk++; else o.mine++;
          if(/Your timeouts/.test(h)&&/The staff room/.test(h)&&(dp.k==="tomine"||!dp.withDef||/How .* are scoring/.test(h)))dp.k==="timeout"?o.runDraw++:o.mineDraw++ }
        A.answerLive(dp.k==="timeout"?dp.opts[w%dp.opts.length][0]:dp.opts[0][0]) }
      else { if(!rotd&&L.drives.length===1&&!L.ask){ const h=A.liveActsHTML(); if(/Rotation \(your starters' legs: fresh\)/.test(h)&&/aria-pressed="true"[^>]*>Usual rotation/.test(h))o.rotBar++;
          A.setActMidGame(w%2?"rot:deep":"rot:tight"); rotd=true; if(/From the next stretch/.test(A.liveActsHTML()))o.rotPend++ }
        if(!pressed&&L.drives.length===3&&!L.ask){ const h=A.liveActsHTML(); if(/Call a timeout/.test(h))o.btn++;
          A.setActMidGame("to"); pressed=true; if(/Called: at the next break/.test(A.liveActsHTML()))o.pend++ }
        A.liveTick() } }
    if(A.live&&A.live.done)o.done++;
    if(A.live&&A.live.drives.some(d=>(d.ev||[]).some(e=>e.k==="rot")))o.rotRow++;
    if(A.live&&A.live.eng.legs(A.live.userIsHome?"home":"away")<(w%2?101:95)&&A.live.eng.legs(A.live.userIsHome?"home":"away")<=100)o.legs++;
    const g=A.live&&A.live.g; if(A.live&&A.live.drives.some(d=>(d.ev||[]).some(e=>e.k==="to")))o.toRow++;
    if(g&&A.live.args){ o.checked++; // the same game rebuilt from its arguments and answers: the same score
      const e=A.makeLiveGame(new A.RNG(A.liveSeed(A.live.step)),...A.live.args); let i=0,r,gg=0; while(gg++<4000){ r=e.next(); if(r.done)break; if(r.ask)e.reply(A.live.replay[i++]) }
      if(r&&r.done&&r.h===A.live.eng.h&&r.a===A.live.eng.a)o.same++ } }
  ok(o.games>=6&&o.done===o.games,`${f}: ${o.done} of ${o.games} live games finished`);
  ok(o.btn===o.games&&o.pend===o.games,`${f}: the Timeout button shows, and says it's called until the break (${o.pend} of ${o.games})`);
  ok(o.mine===o.games&&o.mineDraw===o.mine,`${f}: your own timeout asks what you change, with its evidence (${o.mineDraw} of ${o.mine})`);
  ok(o.runDraw===o.runAsk,`${f}: the run call draws its evidence (${o.runDraw} of ${o.runAsk} asked)`);
  ok(o.toRow===o.games,`${f}: the run of play says TIMEOUT (${o.toRow} of ${o.games})`);
  ok(o.rotBar===o.games&&o.rotPend===o.games&&o.rotRow===o.games,`${f}: the rotation buttons show the usual one in force, a change says when, and the run of play has it (${o.rotRow} of ${o.games})`);
  ok(o.legs===o.games,`${f}: a tight rotation tires your starters' legs; deep keeps them fresh (${o.legs} of ${o.games})`);
  ok(o.same===o.checked,`${f}: a game rebuilt with its timeouts gives back its score (${o.same} of ${o.checked})`);
}
console.log(bad?`MISMATCH ${bad}`:'MATCH basketball timeouts in live games'); process.exit(bad?1:0);
