const {load}=require(require('path').join(__dirname,'..','harness.js'));
const A=load({file:require('path').join(__dirname,'..','..','dist','baseball-coach-pro.html'),expose:['S','SEA','NAMES','newDynasty','spCtx','attrOf','BS_SP','BK']});
const d=[]; for(const seed of [5,77,901]){ A.newDynasty(A.NAMES[0],seed,'T'); for(const t of A.NAMES){ const R=A.SEA.roster[t]; for(const i of A.BS_SP.concat(A.BS_SP.slice(0,2).map(A.BK))){ const p=R[i], a=p&&A.attrOf(p); if(a)d.push(a.stf-a.ctl) } } }
const m=d.reduce((x,y)=>x+y,0)/d.length; console.log('n',d.length,'stf-ctl mean',m.toFixed(2),'sd',Math.sqrt(d.reduce((x,y)=>x+(y-m)**2,0)/d.length).toFixed(2));
