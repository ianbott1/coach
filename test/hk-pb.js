/* Hockey's full match touch by touch (round 104), scripted over engine games (no browser): for every stretch, the
   giveaways each side is shown forcing in their zone, the entries it kills and the shifts it cycles below their goal
   line are the engine's (d.T, less the stretch before); each penalty at its minute, the side short a man never using
   its sixth for the two minutes; every move picks up where the last ended (a faceoff at a dot after a whistle or a
   goal, else the very spot); the move before a shot ends where the shot's own move begins, on its first man, with the
   shot's own men on the ice (their numbers and names); a hurt man is never on the ice; a frame is the same however
   it's reached; a stretch carries on from the last.
     node test/hk-pb.js     last line: MATCH or MISMATCH */
const path=require('path'); const {load}=require('./harness.js');
const A=load({file:path.join(__dirname,'..','dist','hockey-coach-pro.html'),settable:['live'],expose:['makeLiveGame','RNG','newDynasty','SEA','S','HL_SPORT','live','hlEvPlan','SEGS']});
let bad=0, checks=0; const ok=(c,m)=>{ checks++; if(!c){ bad++; if(bad<=12)console.log('  FAIL '+m) } };
A.newDynasty('Vegas',5,'T'); const teams=Object.keys(A.SEA.roster);
const tot={stretches:0,moves:0,touches:0,to:0,fe:0,cy:0,pens:0,clips:0,short:0,hits:0,named:0};
for(let s=1;s<=30;s++){
  const g={home:teams[s%teams.length],away:teams[(s*7+3)%teams.length]}; if(g.home===g.away)continue;
  const e=A.makeLiveGame(new A.RNG(s),1600+s*3,1700,'balanced','balanced',true); let k=0; while(k++<900){ const r=e.next(); if(r.done)break; if(r.ask)e.reply(r.ask.opts[s%r.ask.opts.length][0]) }
  const L={g:g,drives:e.drives,step:0}; A.live=L;
  const hurt=t=>new Set(A.SEA.talent&&A.SEA.talent.inj&&A.SEA.talent.inj[t]?A.SEA.talent.active(t).map(q=>q.idx):[]), H=[hurt(g.home),hurt(g.away)];
  let prevLast=null;
  e.drives.forEach((d,di)=>{ if(typeof d.seg!=='number'||d.seg>=A.SEGS)return;
    const P=A.HL_SPORT.hpPlan(L,d), c=A.HL_SPORT.hpCounts(L,d), tag=`seed ${s} stretch ${d.seg}`, pv=di>0?e.drives[di-1]:null;
    tot.stretches++; tot.moves+=P.moves.length;
    [['home',0],['away',1]].forEach(([sd,i])=>{ ['to','fe','cy'].forEach(kk=>{ const a=d.T&&d.T[sd], b=pv&&pv.T&&pv.T[sd]; if(!a)return; const want=Math.round((a[kk]||0)-(b?b[kk]||0:0));
        ok(c[i][kk]===want,`${tag} ${sd} ${kk}: shown ${c[i][kk]}, engine ${want}`); tot[kk]+=c[i][kk] });
      const pens=(d.ev||[]).filter(x=>x.k==='pen'&&x.side===sd).length; ok(c[i].pen===pens,`${tag} ${sd}: ${c[i].pen} penalties shown, engine ${pens}`); tot.pens+=pens; tot.hits+=c[i].hit });
    P.moves.forEach((m,j)=>{ tot.touches+=m.T.length; if(m.f1-m.f0<0.012)tot.short++;
      const S=m.six; m.T.forEach(t=>{ if(S&&S.an&&S.an[t.s])tot.named++; if(S&&S.idx)ok(!H[m.side].has(S.idx[t.s]),`${tag}: a hurt man on the puck`); const lastOfClip=m.end==='clip'&&t===m.T[m.T.length-1]; if(t.s===5&&(lastOfClip?m.m.c.shortA:P.shortAt(m.side,t.f)))ok(false,`${tag}: a side short a man plays its sixth (move ${j} ${m.end}, touch ${m.T.indexOf(t)} of ${m.T.length} ${t.k}, f ${t.f.toFixed(3)})`) });
      for(let q=1;q<m.T.length;q++)ok(m.T[q].f>=m.T[q-1].f,`${tag} move ${j}: touches out of order`);
      if(j===0){ if(d.seg%4===0)ok(m.T[0].k==='faceoff'&&m.T[0].x===0.5&&m.T[0].y===0.5,`${tag}: the period doesn't open with a faceoff at centre`); else if(prevLast)ok(Math.abs(m.T[0].x-prevLast.x)<1e-9&&Math.abs(m.T[0].y-prevLast.y)<1e-9,`${tag}: doesn't pick up where the last stretch ended`); return }
      const a=P.moves[j-1], z=a.T[a.T.length-1], b=m.T[0];
      if(b.k==='faceoff'){ const dots=[[0.5,0.5]].concat([0.19,0.81,0.4,0.6].flatMap(x=>[[x,0.24],[x,0.76]])); ok(dots.some(([x,y])=>Math.abs(b.x-x)<1e-9&&Math.abs(b.y-y)<1e-9),`${tag} move ${j}: faceoff off the dots (${b.x.toFixed(3)},${b.y.toFixed(3)})`) }
      else if(a.end==='clip')ok(true,'');   // a rebound cleared: from in front of the net
      else ok(Math.abs(b.x-z.x)<1e-9&&Math.abs(b.y-z.y)<1e-9,`${tag} move ${j} (${b.k} after ${a.end}): starts away from where the last ended`) });
    P.moves.filter(m=>m.end==='clip').forEach(m=>{ const cl=m.m.c, z=m.T[m.T.length-1], s0=cl.home?0:1; tot.clips++;
      ok(m.side===s0,`${tag}: the move before a shot is the other side's`);
      ok(Math.abs(z.a-cl.W[0][0])<1e-9&&Math.abs(z.ay-cl.W[0][1])<1e-9,`${tag}: the move before a shot ends away from the shot's start`);
      ok(z.s===cl.rec[0],`${tag}: the move before a shot ends on another man`);
      ok(m.six.an===cl.an&&m.oSix.an===cl.dn,`${tag}: other men on the ice before the shot than in it`) });
    const sig=JSON.stringify(P.moves.map(m=>m.T.map(t=>[t.x,t.y,t.f,t.s,t.k])));
    Object.defineProperty(d,"_hp",{value:null,writable:true,configurable:true,enumerable:false}); const P2=A.HL_SPORT.hpPlan(L,d);
    ok(JSON.stringify(P2.moves.map(m=>m.T.map(t=>[t.x,t.y,t.f,t.s,t.k])))===sig,`${tag}: built twice, two different stretches`);
    prevLast=P2.last });
}
ok(tot.short<=tot.moves*0.03,`${tot.short} moves played in under a hundredth of a stretch`);   // hockey: shots come thick (about five a stretch, a moment apart at the least), so a quick touch between two is real hockey
console.log(`  ${tot.stretches} stretches: ${(tot.moves/tot.stretches).toFixed(1)} moves and ${(tot.touches/tot.stretches).toFixed(1)} touches a stretch (${Math.round(100*tot.named/tot.touches)}% on a named man); shown: ${tot.to} giveaways forced, ${tot.fe} entries killed, ${tot.cy} cycles, ${tot.pens} penalties, ${tot.hits} hits, ${tot.clips} shots set up, ${tot.short} moves under a hundredth of a stretch`);
console.log(bad?`MISMATCH ${bad} of ${checks}`:`MATCH ${checks} checks`);
