const path=require('path');const {load}=require(require('path').join(__dirname,'..','harness.js'));
for(const [f,shp,keys] of [['basketball-coach-pro.html','bbShapeT',['id','pd']],['basketball-coach.html','bbShapeT',['id','pd']],['football-coach-pro.html','fbShapeT',['d.cov','d.str','d.tkl','d.rsh','d.spd']],['football-coach.html','fbShapeT',['d.cov','d.str','d.tkl','d.rsh','d.spd']]]){
  const A=load({file:path.join(require('path').join(__dirname,'..','..','dist'),f),expose:['S','SEA','NAMES','newDynasty','sportPlanFit',shp]});
  const out={}; for(const seed of [5,77,901]){ A.newDynasty(A.NAMES[0],seed,'T');
    const get=(T,k)=>k.includes('.')?T[k.split('.')[0]][k.split('.')[1]]:T[k];
    for(const k of keys){ const v=A.NAMES.map(t=>get(A[shp](t),k)); (out[k]=out[k]||[]).push(...v) }
    for(const pl of ['safe','aggressive']){ (out['fit.'+pl]=out['fit.'+pl]||[]).push(...A.NAMES.map(t=>A.sportPlanFit(t,pl))) } }
  const st=a=>{const m=a.reduce((x,y)=>x+y,0)/a.length; return `mean ${m.toFixed(3)} sd ${Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/a.length).toFixed(3)}`};
  console.log(f); for(const k in out)console.log('  ',k.padEnd(14),st(out[k])) }
