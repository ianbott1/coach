/* Soccer: a save in the feed names the keeper who played (round 107, Muse: "Nunez gets down to keep out Gentry", Nunez the
   backup, Varga in goal). Every save line of a season's games against each side's keeper on the day.
     node test/sc-keeper.js [distDir]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const DIR=process.argv[2]||process.env.DIST||path.join(__dirname,'..','dist');
const A=load({file:path.join(DIR,'soccer-coach.html'),expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','skipLive','scEventText','scPlayer']});
A.newDynasty('Southampton',7,'T'); let saves=0, wrong=0; const ex=[];
for(let w=0;w<30;w++){ A.doAdvance(); const L=A.live; if(!L)continue; let m=0; while(A.live&&!A.live.done&&m++<5000){ if(A.live.ask){A.answerLive(A.live.ask.dp.opts[0][0]);continue} A.liveTick() }
  const g=L.g; L.drives.forEach(d=>(d.ev||[]).forEach(e=>{ if(e.k!=="save")return; saves++; const opp=e.side==="home"?g.away:g.home, r=A.scEventText(g,e,{}); const gk=A.scPlayer(opp,"GK",5);
    const sn=gk?gk.split(" ").slice(-1)[0]:""; if(!sn||r.text.indexOf(sn)!==0){ wrong++; if(ex.length<2)ex.push(r.text+' (keeper '+gk+')') } })) }
const ok=saves>=20&&!wrong; console.log(`${ok?'  ok  ':'  FAIL'} ${saves} saves in the feed, ${wrong} naming another man than the keeper ${ex.join('; ')}`);
console.log(ok?'MATCH a save names the keeper who played':'MISMATCH'); process.exit(ok?0:1);
