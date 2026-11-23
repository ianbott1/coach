/* Soccer's full match touch by touch (round 103), scripted over engine games (no browser): for every stretch, the
   crosses, long balls and balls won high each side is shown making are the engine's (d.TA, less the stretch before),
   and each booking is a foul at its minute; every move picks up where the last ended (a kick-off from the centre spot,
   a goal kick from the six-yard box, a corner from the flag, else the very spot); each move before a shot ends where
   the shot's own move begins, on the man the shot's move starts with, in the same shirt number; a man on the pitch is
   never a hurt one; the side on the ball is the one the last move left it with; a frame is the same however it's
   reached (the plan is built twice and compared); a stretch carries on from the last.
     node test/sc-pb.js     last line: MATCH or MISMATCH */
const path=require('path'); const {load}=require('./harness.js');
const A=load({file:path.join(__dirname,'..','dist','soccer-coach.html'),settable:['live'],expose:['makeLiveGame','RNG','newDynasty','SEA','S','HL_SPORT','live','hlEvPlan','SC_UNIT']});
let bad=0, checks=0; const ok=(c,m)=>{ checks++; if(!c){ bad++; if(bad<=12)console.log('  FAIL '+m) } };
A.newDynasty('Arsenal',5,'T'); const teams=Object.keys(A.SEA.roster);
const tot={stretches:0,moves:0,touches:0,cr:0,lb:0,to:0,cards:0,clips:0,named:0,touchesNamed:0};
for(let s=1;s<=40;s++){
  const g={home:teams[s%teams.length],away:teams[(s*7+3)%teams.length]}; if(g.home===g.away)continue;
  const e=A.makeLiveGame(new A.RNG(s),1600+s*3,1700,'balanced','balanced',true); let k=0; while(k++<600){ const r=e.next(); if(r.done)break; if(r.ask)e.reply(r.ask.opts[s%r.ask.opts.length][0]) }
  const L={g:g,drives:e.drives,step:0}; A.live=L;
  const hurt=t=>new Set(A.SEA.talent&&A.SEA.talent.inj&&A.SEA.talent.inj[t]?A.SEA.talent.active(t).map(q=>q.idx):[]);
  const H=[hurt(g.home),hurt(g.away)];
  let prevLast=null;
  // the scoreboard's numbers at the end: the engine's shots and on target, the stretches' corners and fouls added up
  { const T=A.HL_SPORT.spTally(L,e.drives.length,null,null), D=e.drives.filter(d=>typeof d.seg==='number'&&!d.ot), last=D[D.length-1];
    [['home',0],['away',1]].forEach(([sd,i])=>{ ok(T.o[i].sh===last.st[sd][0]&&T.o[i].sot===last.st[sd][1],`seed ${s} ${sd}: the scoreboard's shots ${T.o[i].sh}/${T.o[i].sot}, engine ${last.st[sd]}`);
      const sum=D.reduce((t,d)=>{ const c=A.HL_SPORT.spCounts(L,d)[i]; return {corner:t.corner+c.corner,foul:t.foul+c.foul} },{corner:0,foul:0});
      ok(T.o[i].corner===sum.corner&&T.o[i].foul===sum.foul,`seed ${s} ${sd}: the scoreboard's corners and fouls aren't the stretches'`) });
    ok(T.pH>0.2&&T.pH<0.8,`seed ${s}: possession ${T.pH}`) }
  e.drives.forEach((d,di)=>{ if(d.ot||d.seg==null||typeof d.seg!=='number')return;
    const P=A.HL_SPORT.spPlan(L,d), c=A.HL_SPORT.spCounts(L,d), tag=`seed ${s} stretch ${d.seg}`;
    tot.stretches++; tot.moves+=P.moves.length;
    const pv=di>0?e.drives[di-1]:null;
    [['home',0],['away',1]].forEach(([sd,i])=>{ ['cr','lb','to'].forEach(kk=>{ const a=d.TA&&d.TA[sd], b=pv&&pv.TA&&pv.TA[sd], want=a?Math.round((a[kk]||0)-(b?b[kk]||0:0)):null;
        if(want!=null){ ok(c[i][kk]===want,`${tag} ${sd} ${kk}: shown ${c[i][kk]}, engine ${want}`); tot[kk]+=c[i][kk] } });
      const cards=(d.ev||[]).filter(x=>x.k==='yellow'&&x.side===sd).length; ok(c[i].card===cards,`${tag} ${sd}: ${c[i].card} bookings shown, engine ${cards}`); tot.cards+=cards;
      ok(c[i].foul>=cards,`${tag} ${sd}: fewer fouls than bookings`) });
    // continuity
    P.moves.forEach((m,j)=>{ tot.touches+=m.T.length;
      m.T.forEach(t=>{ const X=P.XI[m.side]; if(X.idx[t.s]>=0){ tot.touchesNamed++; ok(!H[m.side].has(X.idx[t.s]),`${tag}: a hurt man on the ball`) } });
      for(let q=1;q<m.T.length;q++)ok(m.T[q].f>=m.T[q-1].f,`${tag} move ${j}: touches out of order`);
      if(j===0){ if(d.seg===0||d.seg===9)ok(m.T[0].k==='kickoff',`${tag}: the half doesn't start with a kick-off`); else if(prevLast){ ok(m.side===prevLast.side&&Math.abs(m.T[0].x-prevLast.x)<1e-9&&Math.abs(m.T[0].y-prevLast.y)<1e-9,`${tag}: doesn't pick up where the last stretch ended`) } return }
      const a=P.moves[j-1], z=a.T[a.T.length-1], b=m.T[0];
      if(b.k==='kickoff')ok(b.x===0.5&&b.y===0.5,`${tag}: kick-off off the spot`);
      else if(b.k==='gk')ok(Math.abs(b.x-(m.side?0.94:0.06))<1e-9,`${tag}: goal kick off the six-yard box`);
      else if(b.k==='corner'&&a.end==='clip')ok(b.x<0.02||b.x>0.98,`${tag}: corner off the flag`);
      else ok(Math.abs(b.x-z.x)<1e-9&&Math.abs(b.y-z.y)<1e-9,`${tag} move ${j} (${b.k} after ${a.end}): starts away from where the last ended`);
      // the side on it
      const want=a.end==='clip'?null:(a.end==='foul'||a.end==='card'||a.end==='corner')?a.side:1-a.side; if(want!=null)ok(m.side===want,`${tag} move ${j}: the wrong side has it after a ${a.end}`) });
    // the move before each shot: ends where the shot's move begins, on its first man, same number
    P.moves.filter(m=>m.end==='clip').forEach(m=>{ const cl=m.m.c, z=m.T[m.T.length-1], s0=cl.home?0:1, w=cl.W[0]; tot.clips++;
      ok(m.side===s0,`${tag}: the move before a shot is the other side's`);
      ok(Math.abs(z.x-Math.max(0.02,Math.min(0.98,s0?1-w[0]:w[0])))<1e-9&&Math.abs(z.y-Math.max(0.02,Math.min(0.98,s0?1-w[1]:w[1])))<1e-9,`${tag}: the move before a shot ends away from the shot's start`);
      // the same man: the shot's first man by his shirt (a scorer not in the eleven, a man off the bench, wears his own)
      const X=P.XI[s0], want=cl.numsA?cl.numsA[cl.rec[0]]:null, inXI=cl.idxA?cl.idxA.every(i=>i<0||X.idx.indexOf(i)>=0):true;
      if(want!=null&&inXI)ok(X.nums[z.s]===want,`${tag}: shirt ${X.nums[z.s]} on the ball before the shot, ${want} starts the shot`) });
    // the same however it's reached
    const sig=JSON.stringify(P.moves.map(m=>m.T.map(t=>[t.x,t.y,t.f,t.s,t.k])));
    Object.defineProperty(d,"_sp",{value:null,writable:true,configurable:true,enumerable:false}); const P2=A.HL_SPORT.spPlan(L,d); ok(JSON.stringify(P2.moves.map(m=>m.T.map(t=>[t.x,t.y,t.f,t.s,t.k])))===sig,`${tag}: built twice, two different stretches`);
    prevLast=P2.last;
  });
}
console.log(`  ${tot.stretches} stretches: ${(tot.moves/tot.stretches).toFixed(1)} moves and ${(tot.touches/tot.stretches).toFixed(1)} touches a stretch (${Math.round(100*tot.touchesNamed/tot.touches)}% on a named man); shown: ${tot.cr} crosses, ${tot.lb} long balls, ${tot.to} won high, ${tot.cards} bookings, ${tot.clips} shots set up`);
console.log(bad?`MISMATCH ${bad} of ${checks}`:`MATCH ${checks} checks`);
