// Grokbot's own cases: his team, its first opponent, the card's chance and its reason line, before and after each swap
const path=require('path'); const DIST=process.env.DIST||require('path').join(__dirname,'..','..','dist'); const {load}=require(require('path').join(__dirname,'..','harness.js'));
const CASES=[['football-coach-pro.html','Green Bay'],['basketball-coach.html','Minnesota'],['basketball-coach-pro.html','Orlando'],['hockey-coach-pro.html','Florida'],['soccer-coach.html','Southampton'],['baseball-coach-pro.html','Seattle'],['football-coach.html','TCU']];
const strip=h=>(h||'').replace(/<[^>]+>/g,'').replace(/&minus;/g,'-').replace(/&amp;/g,'&');
for(const [f,t] of CASES){ if(process.argv[2]&&!f.startsWith(process.argv[2]))continue;
  const A=load({file:path.join(DIST,f),expose:['S','SEA','newDynasty','POS','BK','swapDepth','planChances','planReasonHTML','plan','PLANS'],settable:['plan']});
  A.newDynasty(t,5,'T'); const my=A.S.myTeam, R=A.SEA.roster[my]; A.plan='balanced';
  const card=()=>{ const C=A.planChances(); const r=x=>Math.round(x*100); return `${r(C.p.safe)}/${r(C.p.balanced)}/${r(C.p.aggressive)}  ${strip(A.planReasonHTML(false))}` };
  console.log(`=== ${f} ${my} v ${A.planChances().opp}  plans ${A.PLANS.safe.l} / ${A.PLANS.balanced.l} / ${A.PLANS.aggressive.l}`);
  console.log(`   as it is     ${card()}`);
  for(let i=0;i<A.POS.length;i++){ const bk=R[A.BK(i)]; if(!R[i]||!bk)continue; const g=R[i].r-bk.r; if(g<12)continue;
    A.swapDepth(A.SEA,i,my); console.log(`   ${A.POS[i].p.padEnd(4)} ${R[A.BK(i)].r}->${R[i].r} (${g})  ${card()}`); A.swapDepth(A.SEA,i,my) } }
