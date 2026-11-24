/* A man keeps his shirt number when the depth chart changes, and after a reload (round 107, Grokbot: numbers reshuffled
   after a roster swap in college football, pro football and pro basketball). Every starter swapped with his backup,
   one at a time; and the save written and read back.
     node test/shirts.js [distDir]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const DIR=process.argv[2]||process.env.DIST||path.join(__dirname,'..','dist'); let bad=0;
for(const [f,t] of [['football-coach.html','TCU'],['football-coach-pro.html','Green Bay'],['basketball-coach-pro.html','Orlando'],['basketball-coach.html','Minnesota'],['hockey-coach-pro.html','Florida'],['soccer-coach.html','Southampton'],['baseball-coach-pro.html','Seattle']]){
  const A=load({file:path.join(DIR,f),expose:['S','SEA','newDynasty','shirtNo','POS','save','load','loadGame','KEYFOR']});
  A.newDynasty(t,9,'T'); const R=A.SEA.roster[t], P=A.POS.length;
  const nums=()=>{ const o={}; R.forEach((p,i)=>{ if(p)o[p.n]=A.shirtNo(t,i) }); return o };
  const n0=nums(); let moved=0, swaps=0; const ex=[];
  for(let i=0;i<P;i++){ if(!R[i]||!R[i+P])continue; swaps++; [R[i],R[i+P]]=[R[i+P],R[i]]; const n1=nums();
    Object.keys(n0).forEach(k=>{ if(n1[k]!==n0[k]){ moved++; if(ex.length<2)ex.push(`${k} ${n0[k]} to ${n1[k]}`) } }); [R[i],R[i+P]]=[R[i+P],R[i]] }
  // the roster as a save reads it back (players copied through JSON)
  const back=JSON.parse(JSON.stringify(R)); A.SEA.roster[t]=back; const n2={}; back.forEach((p,i)=>{ if(p)n2[p.n]=A.shirtNo(t,i) });
  const lost=Object.keys(n0).filter(k=>n2[k]!==n0[k]).length; A.SEA.roster[t]=R;
  const dup=(()=>{ const v=Object.values(n0); return v.length-new Set(v).size })();
  const ok=!moved&&!lost&&!dup; if(!ok)bad++;
  console.log(`${ok?'  ok  ':'  FAIL'} ${f}: ${swaps} starter-backup swaps, numbers changed ${moved}${ex.length?' ('+ex.join(', ')+')':''}; after a copy through the save ${lost}; worn twice ${dup}`) }
console.log(bad?`MISMATCH ${bad}`:'MATCH a man keeps his number'); process.exit(bad?1:0);
