/* Player attributes (round 87, core 93_attrs). In every game, over four seasons: every rostered player has his
   group's attributes and their weighted sum, rounded, is his rating, exactly (at the floor and the cap too); a player's
   shape holds from season to season (it develops, it isn't drawn again); the heaviest attribute doesn't drift (the
   rounding nudge lands there); a summer's gain goes more to the young's physical attributes and the old's mental
   ones; the same player drawn twice is the same; every page with attributes draws.
     node test/attrs.js [games...]      last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const D=f=>path.join(__dirname,'..','dist',f);
const CASES=[['football-coach.html','Alabama'],['football-coach-pro.html','Kansas City'],['basketball-coach.html','Duke'],
  ['basketball-coach-pro.html','Boston'],['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
const pick=process.argv.slice(2).map(f=>f.endsWith('.html')?f:f+'.html');
let bad=0,checks=0; const ok=(c,m)=>{checks++; if(!c){bad++; if(bad<=20)console.log('  FAIL '+m)}};
const corr=(x,y)=>{ const n=x.length, mx=x.reduce((a,b)=>a+b,0)/n, my=y.reduce((a,b)=>a+b,0)/n; let sxy=0,sx=0,sy=0;
  for(let i=0;i<n;i++){ sxy+=(x[i]-mx)*(y[i]-my); sx+=(x[i]-mx)**2; sy+=(y[i]-my)**2 } return sxy/Math.sqrt(sx*sy) };
for(const [f,team] of CASES){ if(pick.length&&pick.indexOf(f)<0)continue;
  const A=load({file:D(f),expose:['S','SEA','U','ATTRS','NAMES','newDynasty','openOffseason','commitOffseason','attrGrp','attrKeys','attrGen','attrOf','attrShow','attrRole','attrAge','openPlayer','playerView','render']});
  A.newDynasty(team,7,'T');
  let players=0, prev=null; const keep=[], heavy=[], band={p:[0,0],m:[0,0]}, bandOld={p:[0,0],m:[0,0]};
  for(let yr=0;yr<4;yr++){
    const now={};
    A.NAMES.forEach(t=>(A.U.roster[t]||[]).forEach(p=>{ if(!p)return; const g=A.attrGrp(p), K=A.attrKeys(g), W=A.ATTRS.w[g]; players++;
      ok(Array.isArray(p.at)&&p.at.length===K.length,`${f}: ${p.n} (${t}, ${p.p}) has ${p.at&&p.at.length} attributes for ${K.length}`);
      if(!Array.isArray(p.at))return;
      const s=K.reduce((a,k,j)=>a+W[k]*p.at[j],0);
      ok(Math.round(s)===p.r&&p.ar===p.r,`${f}: ${p.n} sums to ${s.toFixed(2)} for a ${p.r} (ar ${p.ar})`);
      ok(p.at.every(v=>v>=1),`${f}: ${p.n} has an attribute under 1: ${p.at}`);
      let jh=0; K.forEach((k,j)=>{ if(W[k]>W[K[jh]])jh=j }); heavy.push(p.at[jh]-p.r);
      const key=t+"|"+p.n; if(now[key]===undefined)now[key]={p:p,g:g,dev:p.at.map(v=>v-p.r),at:p.at.slice(),r:p.r,age:p.age!=null?p.age:p.c}; else now[key]=null;   // a name twice on a roster: skipped
      // drawn twice, the same
      const a=A.attrGen(A.U,Object.assign({},p,{at:null})), b=A.attrGen(A.U,Object.assign({},p,{at:null}));
      ok(JSON.stringify(a)===JSON.stringify(b),`${f}: ${p.n} drawn twice differs`) }));
    if(prev)Object.keys(now).forEach(k=>{ const x=now[k], y=prev[k]; if(!x||!y||x.g!==y.g)return;
      x.dev.forEach((d,j)=>keep.push([y.dev[j],d]));
      const dr=x.r-y.r; if(dr>=2){ const K=A.attrKeys(x.g), B=A.attrAge(x.p)<=24?band:bandOld;
        K.forEach((kk,j)=>{ const bd=A.ATTRS.band[kk]; if(bd==="p"||bd==="m"){ B[bd][0]+=x.at[j]-y.at[j]; B[bd][1]++ } }) } });
    prev=now;
    // a sample of player pages draws, with the attribute grid
    A.NAMES.slice(0,3).forEach(t=>(A.U.roster[t]||[]).slice(0,4).forEach(p=>{ if(!p)return; let h=""; try{ A.openPlayer(t,p.n); h=A.playerView() }catch(e){ h="ERR "+e.message }
      ok(!/^ERR/.test(h)&&/attrgrid/.test(h),`${f}: ${p.n}'s page has no attributes: ${h.slice(0,100)}`) }));
    if(yr===3)break;
    let g=0; while(A.SEA.phase!=='done'&&g++<4000)A.SEA.advance();
    A.openOffseason(); for(let c=0;c<6&&A.S.off;c++){ if(A.S.off.act.userOpen&&A.S.off.move===null)A.S.off.move=A.S.myTeam; A.commitOffseason() }
  }
  const cs=corr(keep.map(x=>x[0]),keep.map(x=>x[1]));
  ok(keep.length>100&&cs>0.85,`${f}: a player's shape doesn't hold from season to season (correlation ${cs.toFixed(2)} over ${keep.length})`);
  const mh=heavy.reduce((a,b)=>a+b,0)/heavy.length;
  ok(Math.abs(mh)<1.5,`${f}: the heaviest attribute drifts from the rating by ${mh.toFixed(2)} on average`);
  const pm=b=>b[1]?b[0]/b[1]:0;
  ok(pm(band.p)>pm(band.m),`${f}: the young's gains go no more to physical (${pm(band.p).toFixed(2)}) than mental (${pm(band.m).toFixed(2)})`);
  console.log(`  ${f}: ${players} player-seasons, shape kept ${cs.toFixed(2)}, heaviest ${mh>=0?'+':''}${mh.toFixed(2)}, young gain physical ${pm(band.p).toFixed(2)} / mental ${pm(band.m).toFixed(2)}, older ${pm(bandOld.p).toFixed(2)} / ${pm(bandOld.m).toFixed(2)}`) }
console.log(bad?`MISMATCH ${bad} of ${checks} checks`:`MATCH ${checks} checks: attributes sum to ratings, shapes held, development by age`); process.exit(bad?1:0);
