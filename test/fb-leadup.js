/* Football's full match: the drive up to a call, shown before the call is asked (HL_SPORT.leadUp), and the drive the
   engine pushes after the answer (round 101). Scripted, like two-point.js, since the two-point call is rare in play:
   engine games run until calls come, the lead-up is built as the live game builds it, then the answer is given and
   the pushed drive's clips are asked for as the live game asks. Checks: a fourth down's lead-up ends on the fourth
   down the call asked about (the spot; the distance where the engine's numbers allow it), the drive after the answer
   is the lead-up's plays and then picks up where they ended (a made fourth down from that spot, the plays adding to
   where the drive ended); a two-point call's lead-up is the drive and its touchdown, and nothing of it is shown again;
   the drive keeps the plays the screen showed for the box score; every call's fourth and N is one the drive reached (engine 20).
     node test/fb-leadup.js     last line: MATCH or MISMATCH */
const path=require('path'); const {load}=require('./harness.js');
let bad=0, checks=0; const ok=(c,m)=>{ checks++; if(!c){ bad++; if(bad<=10)console.log('  FAIL '+m) } };
for(const [f,team] of [['football-coach.html','Alabama'],['football-coach-pro.html','Denver']]){
  const A=load({file:path.join(__dirname,'..','dist',f),settable:['live'],expose:['makeLiveGame','RNG','newDynasty','SEA','S','HL_SPORT','live']});
  A.newDynasty(team,5,'T'); const teams=Object.keys(A.SEA.roster), g={home:teams[0],away:teams[1]};
  const n={fourth:0,two:0,conv:0,distOff:0};
  for(let s=1;s<1500&&(n.two<25||n.conv<25);s++){
    const e=A.makeLiveGame(new A.RNG(s),1700,1700,'balanced','balanced',true); let k=0, r;
    while(k++<2000){ r=e.next(); if(r.done)break; if(!r.ask)continue;
      const stage=e.stage, L={g:g,drives:e.drives,eng:e}; let U=null;
      if(stage==='fourth'||stage==='two'){ try{ U=A.HL_SPORT.leadUp(L,r) }catch(err){ ok(false,`${f} seed ${s}: leadUp threw ${err.message}`) } }
      const pend=e.pend&&e.pend.res&&{start:e.pend.start,stall:e.pend.res.stall,togo:e.pend.res.togo||3};
      const go=r.ask.opts.find(o=>o[0]==='go'), ans=stage==='two'?r.ask.opts[s%2][0]:go&&s%3?'go':r.ask.opts[s%r.ask.opts.length][0];
      e.reply(ans);
      if(!U)continue;
      const key=U.key; A.live=Object.assign({},L,{leadShown:key});
      // the engine pushes the drive on its next step
      const before=e.drives.length; let r2=e.next(); while(r2&&!r2.done&&!r2.drive&&!r2.ask&&e.drives.length===before)r2=e.next();
      const d=e.drives[before]; if(!d){ A.live=null; continue }
      ok(d.n===key.n&&d.start===key.start&&!!d.home===key.home,`${f} seed ${s}: the pushed drive isn't the one the lead-up showed`);
      const cs=A.HL_SPORT.clips(A.live,d,'full'); A.live=null;
      ok(Array.isArray(d._pb)&&d.pbShown,`${f} seed ${s}: the drive after the call kept no plays`);
      if(key.all){ n.two++; ok(U.clips.some(c=>c.kind==='td')&&U.clips[0].kind==='drive'||U.clips[0].kind==='td',`${f} seed ${s}: two-point lead-up without its touchdown`);
        ok(cs.length===0,`${f} seed ${s}: shown again after the two-point call (${cs.map(c=>c.kind)})`); continue }
      n.fourth++;
      const P=key.plays, end=key.end;
      ok(end===Math.max(1,Math.min(99,pend.stall))||Math.abs(end-pend.stall)<=0,`${f} seed ${s}: lead-up ends at ${end}, the call at ${pend.stall}`);
      // the fourth and N the plays left, against the call's
      { let spot=key.start, mark=Math.min(100,spot+10); P.forEach(p=>{ spot+=p.g; if(spot>=mark||p.t==='pen')mark=Math.min(100,spot+10) }); const left=mark-spot, goal=pend.stall+pend.togo>=100; if(!(goal?mark===100:left===pend.togo))n.distOff++ }
      const dc=cs.find(c=>c.kind==='drive');
      if(d.cv){ n.conv++; ok(dc&&dc.plays.length&&dc.plays[0].from===end&&dc.plays[0].down===4,`${f} seed ${s}: the made fourth down doesn't pick up where the lead-up ended (${dc&&dc.plays[0]&&dc.plays[0].from} vs ${end})`);
        if(dc){ const last=dc.plays.reduce((t,p)=>t+p.g,dc.plays[0].from), nx=cs.find(c=>c.kind!=="drive"&&c.kind!=="conv"), want=nx&&nx.los!=null?nx.los:d.kind==='TD'?100:(d.stall!=null?d.stall:d.lost);
          ok(last===Math.max(1,Math.min(99,want)),`${f} seed ${s}: after the made fourth down the plays end at ${last}, the drive at ${want}`) } }
      else ok(!dc,`${f} seed ${s}: the lead-up's plays shown again after a ${d.kind}`);
    }
  }
  console.log(`  ${f.padEnd(26)} ${n.fourth} fourth-down lead-ups (${n.conv} made, ${n.distOff} where the engine's fourth and N can't be reached), ${n.two} two-point lead-ups`);
  ok(n.two>=10&&n.conv>=10,`${f}: too few calls to say (${n.two} two-point, ${n.conv} made fourth downs)`);
  ok(n.distOff===0,`${f}: ${n.distOff} fourth-down calls whose distance the drive couldn't reach (engine 20 draws it from the drive)`);
}
console.log(bad?`MISMATCH ${bad} of ${checks}`:`MATCH ${checks} checks`);
