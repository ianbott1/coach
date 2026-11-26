/* Report (run by hand): what the people's morale does to a league's calibration. Plays careers with every game simmed
   (no live games), on the current engine (people on) and with ENGINE_NOW=24 (people off), same seeds, and prints the
   league's numbers side by side: home win rate, the better side's (by preseason rating) win rate, wins spread (sd),
   and how far morale's edge reached.
     node test/probes/morale-calib.js dist/<file>.html [seasons per career, 2] [careers, 3]
   Run once as is and once with ENGINE_NOW=24; compare. */
const path=require('path');const {load}=require('../harness.js');
const file=process.argv[2], Y=+(process.argv[3]||2), C=+(process.argv[4]||3);
const TEAM={'football-coach.html':'Alabama','football-coach-pro.html':'Kansas City','basketball-coach.html':'Duke','basketball-coach-pro.html':'Boston',
  'hockey-coach-pro.html':'Boston','soccer-coach.html':'Arsenal','baseball-coach-pro.html':'Seattle'};
let home=0,games=0,fav=0,favN=0,sds=[],edges=[],marg=0;
for(let c=0;c<C;c++){
  const A=load({file:path.resolve(file),expose:['S','SEA','NAMES','LEAGUE','newDynasty','doAdvance','live','openOffseason','commitOffseason','moraleEdge']});
  A.newDynasty(TEAM[path.basename(file)],101+c*37,'T'); A.S.watchMode='never';
  for(let y=0;y<Y;y++){
    const pre=Object.assign({},A.SEA.preseason);
    let g=0; while(A.SEA.phase==='week'&&g++<600)A.doAdvance();
    const E=A.SEA;
    E.weeks.forEach(W=>(W.games||[]).forEach(x=>{ if(x.cup||!x.winner&&!x.draw)return; games++; if(!x.neutral&&x.winner===x.home)home++; marg+=x.margin||0;
      if(x.winner&&pre[x.home]!=null&&pre[x.away]!=null&&pre[x.home]!==pre[x.away]){ favN++; if(x.winner===(pre[x.home]>pre[x.away]?x.home:x.away))fav++ } }));
    const w=A.NAMES.map(t=>E.rec[t][0]), m=w.reduce((a,b)=>a+b,0)/w.length; sds.push(Math.sqrt(w.reduce((a,b)=>a+(b-m)*(b-m),0)/w.length));
    if(E.ppl)A.NAMES.forEach(t=>edges.push(A.moraleEdge(E,t,false)));
    while(A.SEA.phase!=='done'&&g++<900)A.doAdvance();
    A.openOffseason(); for(let k=0;k<5&&A.S.off;k++){ if(A.S.off.act&&A.S.off.act.userOpen&&A.S.off.move===null)A.S.off.move=A.S.myTeam; A.commitOffseason() }
    A.S.watchMode='never';
  }
}
const sd=sds.reduce((a,b)=>a+b,0)/sds.length, ea=edges.map(Math.abs);
console.log(`${path.basename(file)} ENGINE_NOW=${process.env.ENGINE_NOW||'current'}: ${games} games, home ${(home/games*100).toFixed(1)}%, better side ${(fav/favN*100).toFixed(1)}%, margin ${(marg/games).toFixed(2)}, wins sd ${sd.toFixed(2)}`+
  (edges.length?`, morale edge at season's end: mean |${(ea.reduce((a,b)=>a+b,0)/ea.length).toFixed(1)}| elo, max ${Math.max(...ea).toFixed(1)}`:''));
