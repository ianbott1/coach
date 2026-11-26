/* The people (core 93_morale): morale, conversations, the press and the fans, in one game per run.
     node test/morale.js [file.html]        last line: MATCH or MISMATCH
   Plays two seasons as a person would, answering every question the dressing room asks in turn (and leaving some to
   the assistant), and checks:
   - questions come one at a time, never closer than the league's gap (about a week of games), and every kind's
     answers say how they landed; your assistant's answer changes nobody's morale;
   - morale, the fans and the room stay in range, and what morale is worth on the field stays within its bound
     (MO_WP of a level game's chance, FAN_WP more at home);
   - a reload gives back the season played: every player's morale in the league, the fans, the room, the captains,
     the question still open, and every result, at mid-season, with a question answered and not yet played on;
   - the next season starts from where this one ended (morale carried, the captain kept). */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const src=fs.readFileSync(path.join(__dirname,'golden.js'),'utf8');
const mk=()=>{ const m={exports:{}};
  const s=src.slice(0,src.indexOf('const args')).replace('get S(){return S},','get S(){return S}, answerTalk:a=>answerTalk(a), talkOpts:T=>talkOpts(T), moraleEdge:(s,t,h)=>moraleEdge(s,t,h), teamMorale:(s,t)=>teamMorale(s,t), wpScale:p=>wpScale(p), MO_WP:()=>MO_WP, FAN_WP:()=>FAN_WP, PEOPLE_V:()=>PEOPLE_V, ENGINE_V:()=>ENGINE_V, talkHTML:t=>talkHTML(t), applyTalk:(s,T,a)=>applyTalk(s,T,a), TALK_DEF:()=>TALK_DEF, roomLineHTML:t=>roomLineHTML(t), weekNews:W=>weekNews(W),');
  if(s.indexOf('answerTalk:')<0)throw new Error('golden.js load() changed: cannot expose the people');
  new Function('require','module',s+'\nmodule.exports={load};')(require,m); return m.exports.load };
const file=process.argv.slice(2).find(a=>a.endsWith('.html'))||path.join(__dirname,'..','dist','basketball-coach-pro.html');
const h=o=>crypto.createHash('md5').update(JSON.stringify(o)??'undefined').digest('hex').slice(0,8);
let bad=0,checks=0; const ok=(c,m)=>{ checks++; if(!c){ bad++; if(bad<=15)console.log('  FAIL '+m) } };
const TEAM={cfb:'Alabama',ncaab:'Duke',nba:'Boston',nhl:'Boston',epl:'Arsenal',mlb:'Seattle',nfl:'Kansas City'};
const people=api=>{ const E=api.SEA, P=E.ppl; if(!P)return null;
  return {mo:api.NAMES.map(t=>(E.roster[t]||[]).map(p=>p?[p.n,Math.round(p.mo*1000),p.tr||0]:0)), fan:P.fan, chem:P.chem, cap:P.cap,
    pend:P.pend?[P.pend.id,P.pend.k,P.pend.n||'',P.pend.done]:null, games:E.weeks.map(w=>w.games.map(g=>[g.home,g.away,g.hp,g.ap])), rec:E.rec} };
(async()=>{
  const A=mk()(file), LG=A.leagueId(), team=TEAM[LG]||'Boston';
  A.newDynasty(team,7,'T');
  ok(A.ENGINE_V()>=A.PEOPLE_V(),`${LG}: a new career plays on the people's engine (${A.ENGINE_V()})`);
  const kinds={}, said={}; let lastY=null, asked=0, mine=0, assist=0, lastAt=null, gapBad=0, reloads=0, n=0;
  const k=A.wpScale('balanced')*4/Math.LN10, bound=(A.MO_WP()+A.FAN_WP())*k+1e-9;
  const step=()=>{ A.doAdvance(); let g=0; while(A.live&&!A.live.done&&g++<4000){ A.live.ask?A.answerLive(A.live.ask.dp.opts[A.live.ask.dp.opts.length-1][0]):A.liveTick() } };
  const reload=async(when)=>{ const B=mk()(file); await B.loadSave(JSON.stringify(A.S)); const a=people(A), b=people(B); reloads++;
    const d=Object.keys(a||{}).filter(x=>h(a[x])!==h(b&&b[x])); ok(!d.length,`${LG} ${when}: a reload differs in ${d.join(', ')}`) };
  for(let yr=0;yr<2;yr++){
    let g=0, half=false;
    const carried=yr===1?A.SEA.roster[A.S.myTeam].filter(p=>p&&p.moC!=null).length:0;
    if(yr===1)ok(carried>0,`${LG}: the second season starts with no carried morale`);
    while(A.SEA.phase!=='done'&&g++<500){
      const E=A.SEA, P=E.ppl, T=P&&P.pend;
      if(T&&!T.done){
        asked++; kinds[T.k]=(kinds[T.k]||0)+1;
        if(lastAt!==null&&T.id-lastAt<P.gap&&T.y===lastY){ gapBad++; console.log('   gap',T.y,lastAt,'->',T.id,T.k,E.phase) } lastAt=T.id; lastY=T.y;
        const html=A.talkHTML(A.S.myTeam); ok(/data-talk=/.test(html)&&/Needs a decision|attn talk/.test(html),`${LG}: an open question isn't on the team page`);
        if(n%4===3){ assist++;   // left to the assistant: nobody's morale moves for it (his answer, as the step opens)
          const before=h(E.roster[A.S.myTeam].map(p=>p&&[p.mo,p.tr])), fb=P.fan[A.S.myTeam], cb=P.chem[A.S.myTeam];
          A.applyTalk(E,T,A.TALK_DEF()[T.k]);
          ok(h(E.roster[A.S.myTeam].map(p=>p&&[p.mo,p.tr]))===before&&P.fan[A.S.myTeam]===fb&&P.chem[A.S.myTeam]===cb,`${LG}: your assistant's answer to ${T.k} moved someone`);
          step(); n++; continue }
        const o=A.talkOpts(T), a=o[(n>>2)%o.length][0]; n++; mine++;
        A.answerTalk(a); said[T.k+':'+a]=(E.ppl.said&&E.ppl.said.l)||'';
        ok(T.done===a&&E.ppl.said&&E.ppl.said.l,`${LG}: answering ${T.k} with ${a} said nothing`);
        // reload once mid-season with the answer given and the day not yet played
        if(!half&&E.step>=Math.max(...E.sched.map(x=>x.week))*0.4){ half=true; await reload(`season ${yr+1}, answered and not played`) }
      }
      step();
      const E2=A.SEA, P2=E2.ppl; if(!P2)continue;
      A.NAMES.forEach(t=>{ const e=A.moraleEdge(E2,t,true); if(Math.abs(e)>bound){ ok(false,`${LG}: ${t}'s morale is worth ${e.toFixed(1)} elo (bound ${bound.toFixed(1)})`) }
        if(!(P2.fan[t]>=5&&P2.fan[t]<=98&&P2.chem[t]>=20&&P2.chem[t]<=95))ok(false,`${LG}: ${t}'s fans or room out of range`) });
    }
    await reload(`end of season ${yr+1}`);
    const E=A.SEA, all=[].concat(...A.NAMES.map(t=>(E.roster[t]||[]).filter(Boolean).map(p=>p.mo)));
    ok(all.every(m=>m>=3&&m<=97),`${LG}: a player's morale out of range`);
    const tm=A.NAMES.map(t=>A.teamMorale(E,t)), ed=A.NAMES.map(t=>A.moraleEdge(E,t,false));
    console.log(`  ${LG} ${E.year}: team morale ${Math.min(...tm).toFixed(0)}-${Math.max(...tm).toFixed(0)} (mean ${(tm.reduce((a,b)=>a+b,0)/tm.length).toFixed(1)}), edge ${Math.min(...ed).toFixed(1)} to ${Math.max(...ed).toFixed(1)} elo, ${A.roomLineHTML(A.S.myTeam).replace(/<[^>]+>/g,'').replace(/&middot;/g,'|')}`);
    const cap=E.ppl.cap[A.S.myTeam];
    A.openOffseason(); for(let c=0;c<5&&A.S.off;c++){ if(A.S.off.act&&A.S.off.act.userOpen&&A.S.off.move===null)A.S.off.move=A.S.myTeam; A.commitOffseason() }
    if(cap&&A.SEA.roster[A.S.myTeam].some(p=>p&&p.n===cap))ok(A.SEA.ppl.cap[A.S.myTeam]===cap,`${LG}: the captain wasn't kept into the next season`);
  }
  ok(gapBad===0,`${LG}: ${gapBad} questions came closer together than the gap`);
  ok(asked>=4,`${LG}: only ${asked} questions in two seasons`);
  console.log(`  ${LG}: ${asked} questions in two seasons (${mine} answered, ${assist} left to the assistant): ${Object.keys(kinds).map(x=>x+' '+kinds[x]).join(', ')}; ${reloads} reloads`);
  console.log(bad?`MISMATCH ${bad} of ${checks} checks failed`:`MATCH ${checks} checks: the people hold up`);
  process.exit(bad?1:0);
})();
