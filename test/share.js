/* Reach and replay (review round 3, core 95_share), in all seven games, in Node:
   1. a league code starts the same league: two separate loads, one from (seed, club), one from the code read back,
      play the same steps and match game for game; a typo and another game's code are refused;
   2. the weekly challenge: a season played with live games (varied answers, a game plan changed mid-game, pre-game
      plans), the rest simmed; its result code, checked on a fresh load, replays to the same record and result; a
      code edited and re-signed (a claimed record, a claimed score), one from another engine and one cut short are all
      refused; a check leaves the career that ran it as it was;
   3. a save as a file: version and checksum on, read back to the same career; the old format still opens; a changed
      character, another game's file and Windows line endings;
   4. the season in review: its text and its picture (a canvas that records what it's told) carry the record, the
      result, the moments and the awards; the team page and the card show the challenge, its code and the review.
   Real figures the codes are held to (where people paste them):
     a league code fits one text message: 160 characters (GSM 7-bit), https://en.wikipedia.org/wiki/SMS#Message_size
     a result code fits one Discord message: 2,000 characters, https://discord.com/developers/docs/resources/message#create-message
       (a season played with the first ten of your games live; a whole baseball season live runs about 2,400)
     node test/share.js [game ...]      last line: MATCH or MISMATCH */
const path=require('path'), crypto=require('crypto'), {load}=require('./harness.js');
const D=f=>path.join(__dirname,'..','dist',f);
const GAMES={cfb:['football-coach.html','Alabama'],nfl:['football-coach-pro.html','Kansas City'],ncaab:['basketball-coach.html','Duke'],
  nba:['basketball-coach-pro.html','Boston'],nhl:['hockey-coach-pro.html','Boston'],epl:['soccer-coach.html','Arsenal'],mlb:['baseball-coach-pro.html','Seattle']};
const only=process.argv.slice(2).filter(a=>GAMES[a]);
const EX=['newDynasty','doAdvance','simAdvance','liveTick','answerLive','setPlanMidGame','S','SEA','live','plan','PLANS','NAMES','ENGINE_NOW',
  'leagueCode','readLeagueCode','startFromCode','careerCode','chWeek','chSpec','chStart','chMake','chCheck','chTarget','shPack','shUnpack','shSum',
  'saveFileText','readSaveFile','saveText','lzwPack','seasonEntry','reviewOf','reviewText','reviewDraw','myTeamView','cardView','cardFor','shareTitleHTML'];
const SMS=160, DISCORD=2000, LIVE=10;
let bad=0; const ok=(c,m)=>{ console.log((c?'  ok   ':'  FAIL ')+m); if(!c)bad++ };
const md5=o=>crypto.createHash('md5').update(JSON.stringify(o)).digest('hex').slice(0,10);
const games=E=>md5([E.weeks.map(w=>w.games.map(g=>[g.home,g.away,g.hp,g.ap])),E.rec]);
const mk=f=>load({file:D(f),expose:EX,settable:['plan','cardFor']});
function play(A,nLive){   // live for the first nLive games of yours, the rest simmed; varied answers and plans
  const P=Object.keys(A.PLANS||{balanced:1}); let g=0, k=0, nl=0;
  while(A.SEA.phase!=='done'&&g++<700){ k++;
    if(nl>=nLive||k%4===0){ A.simAdvance(); continue }
    A.plan=P[k%P.length]; A.doAdvance(); if(A.live)nl++;
    let n=0; while(A.live&&!A.live.done&&n++<6000){
      if(A.live.ask){ const o=A.live.ask.dp.opts; A.answerLive(o[(n+k)%o.length][0]) }
      else{ if(n===3&&P.length>1)A.setPlanMidGame(P[(k+1)%P.length]); A.liveTick() } } }
  A.plan='balanced';
}
const repack=(A,code,fn)=>{ const p=code.split('.'), P=JSON.parse(A.shUnpack(p[3])); fn(P); const b=A.shPack(JSON.stringify(P));
  return [p[0],p[1],p[2],b,A.shSum(b+'|'+p[2]+'|'+p[1],8)].join('.') };
(async()=>{
  for(const [lg,[f,team]] of Object.entries(GAMES)){ if(only.length&&only.indexOf(lg)<0)continue; const t0=Date.now(); console.log(lg);
    // ---- 1. the league code
    const A=mk(f), seed=482913, code=A.leagueCode(seed,team), L=A.readLeagueCode(code);
    ok(L.seed===seed&&L.team===team&&!L.older&&code.length<=SMS, `league code ${code} (${code.length} characters, one text message is ${SMS}) reads back as seed ${L.seed}, ${L.team}`);
    A.newDynasty(team,seed,'Coach One'); for(let i=0;i<6;i++)A.simAdvance();
    const B=mk(f), L2=B.readLeagueCode(code.toLowerCase().replace(/0/g,'o')); B.startFromCode(1,L2,'Coach One'); for(let i=0;i<6;i++)B.simAdvance();
    ok(games(A.SEA)===games(B.SEA)&&B.S.myTeam===team&&B.careerCode()===code, `a career begun from the code (typed in lower case, O for 0) plays the same ${B.S.steps} steps game for game (${games(B.SEA)})`);
    const typo=code.slice(0,-1)+(code.slice(-1)==='A'?'B':'A'), other=(lg==='nba'?'NHL':'NBA')+code.slice(code.indexOf('-'));
    const T1=B.readLeagueCode(typo), T2=B.readLeagueCode(other);
    ok(!!T1.why&&!!T2.why&&/another of|Open it there/.test(T2.why), `a typo is refused ("${T1.why}"), and so is another game's code ("${T2.why}")`);
    // ---- 2. the weekly challenge
    ok(A.chWeek(new Date(2026,10,26))==='2026-W48'&&A.chWeek(new Date(2027,0,1))==='2026-W53', 'the challenge week is the ISO week (26 Nov 2026 is 2026-W48, 1 Jan 2027 is 2026-W53)');
    const ids=['2026-W46','2026-W47','2026-W48'], specs=ids.map(id=>A.chSpec(id));
    ok(new Set(specs.map(x=>x.kind)).size===3&&specs.every(x=>A.NAMES.indexOf(x.team)>=0&&x.seed>=100000), `three weeks, three goals: ${specs.map(x=>`${x.id} ${x.kind} ${x.team} (${x.pick} of ${x.of})`).join('; ')}`);
    const id=specs.find(x=>x.kind==='wins').id, C=mk(f); C.chStart(1,'Test Coach',id); const tg=C.S.challenge.tgt;
    ok(!!tg&&tg.w>tg.xw&&C.S.myTeam===C.chSpec(id).team, `${id}: beat the forecast with ${C.S.myTeam}: ${tg&&tg.xw} expected, target ${tg&&tg.w}`);
    play(C,LIVE); const res=C.SEA.rec[C.S.myTeam], rc=C.chMake(), html=C.myTeamView();
    ok(!!rc&&rc.length<=DISCORD, `the result code is ${rc&&rc.length} characters (${LIVE} games live, ${C.S.steps} steps; one Discord message is ${DISCORD})`);
    ok(/Weekly challenge/.test(html)&&html.indexOf(rc)>=0&&/Challenge (met|not met)/.test(html)&&/Share this league/.test(html), 'the team page shows the challenge, its verdict, the result code and the league code');
    const V=mk(f), t1=Date.now(), X=V.chCheck(rc);
    ok(X.ok&&X.R.w===res[0]&&X.R.l===res[1]&&X.R.res===C.SEA.seasonResult(C.S.myTeam), `checked on a fresh load in ${Date.now()-t1} ms: ${X.ok?'it checks out':X.why} (${X.R&&X.R.w}-${X.R&&X.R.l}, ${X.R&&X.R.res}; ${X.met?'met':'not met'})`);
    V.newDynasty(team,7,'Bystander'); for(let i=0;i<3;i++)V.simAdvance(); const before=games(V.SEA)+V.S.steps+V.S.myTeam, X2=V.chCheck(rc);
    ok(X2.ok&&X2.R.w===X.R.w&&games(V.SEA)+V.S.steps+V.S.myTeam===before, 'checked again from inside another career: the same answer, and that career is as it was');
    const F1=V.chCheck(repack(V,rc,P=>{ P.r.w+=1; P.r.l-=1 })), k0=Object.keys(JSON.parse(V.shUnpack(rc.split('.')[3])).lv)[0];
    const F2=V.chCheck(repack(V,rc,P=>{ P.lv[k0][0][0]+=1 })), F3=V.chCheck(repack(V,rc,P=>{ P.e=P.e-1 })), F4=V.chCheck(rc.slice(0,rc.length-40)+rc.slice(-8));
    const F5=V.chCheck(repack(V,rc,P=>{ delete P.in.calls }));
    ok(!F1.ok&&/replayed/.test(F1.why), `a record edited and re-signed is refused: ${F1.why}`);
    ok(!F2.ok&&/replays/.test(F2.why), `a live score edited and re-signed is refused: ${F2.why}`);
    ok(!F3.ok&&/engine/.test(F3.why)&&!F4.ok&&!F5.ok, `another engine's ("${F3.why.slice(0,60)}..."), one cut short, and one with its calls taken out are refused`);
    // ---- 3. a save as a file
    const txt=C.saveFileText(C.S), R1=V.readSaveFile(txt), R0=V.readSaveFile(C.lzwPack(C.saveText(C.S)));
    ok(/^COACH SAVE 2\n/.test(txt)&&R1.d&&R1.head.game===lg&&R1.head.sum&&R0.d&&md5(R1.d)===md5(R0.d)&&R1.d.myTeam===C.S.myTeam,
      `a save file carries a version and a checksum (${txt.length} characters) and reads back as the old format does`);
    const lines=txt.split('\n'), bodyAt=lines[0].length+lines[1].length+2, flip=txt.slice(0,bodyAt+50)+String.fromCharCode(txt.charCodeAt(bodyAt+50)^1)+txt.slice(bodyAt+51);
    const R2=V.readSaveFile(flip), R3=V.readSaveFile(txt.replace(/\n/,'\r\n').replace(/(\}\r?)\n/,'$1\r\n')+'\r\n'), R4=V.readSaveFile(txt.replace('"game":"'+lg+'"','"game":"'+(lg==='nba'?'nhl':'nba')+'"'));
    ok(!R2.d&&/checksum/.test(R2.why)&&R3.d&&!R4.d&&/Open it there/.test(R4.why), `a changed character is refused ("${R2.why}"), Windows line endings open, another game's file is refused`);
    // ---- 4. the season in review
    const h=C.seasonEntry(C.S.myTeam), RV=C.reviewOf(h), rt=C.reviewText(RV), drawn=[];
    const ctx={fillText:t=>drawn.push(String(t)),fillRect(){},measureText:t=>({width:String(t).length*14}),set font(v){},set fillStyle(v){},set textAlign(v){}};
    C.reviewDraw(ctx,RV); const pic=drawn.join(' | ');
    ok(rt.indexOf(h.rec)>=0&&(!h.result||rt.toLowerCase().indexOf(h.result.toLowerCase().slice(0,12))>=0)&&RV.moments.length>0&&RV.awards.length>0&&/Weekly challenge/.test(rt),
      `the review as text: ${h.rec}, ${RV.moments.length} moments, ${RV.awards.length} awards, the challenge (${RV.moments[0]} / ${RV.awards[0]})`);
    ok(pic.indexOf(String(C.S.myTeam).toUpperCase())>=0&&pic.indexOf(h.rec)>=0&&/THE SEASON'S MOMENTS/.test(pic)&&/AWARDS/.test(pic)&&pic.indexOf(RV.awards[0].slice(0,20))>=0,
      `the review as a picture draws the club, the record, the moments and the awards (${drawn.length} lines of text)`);
    C.cardFor=h; const cv=C.cardView(); C.cardFor=null;
    ok(/The season in review/.test(cv)&&/Copy the review/.test(cv)&&/Download it as a picture/.test(cv)&&/This week's challenge/.test(C.shareTitleHTML([{n:1,empty:true}])), 'the season card shows the review with copy and picture; the title screen offers the week\'s challenge');
    console.log(`  (${Math.round((Date.now()-t0)/1000)}s)`);
  }
  console.log(bad?`MISMATCH ${bad} check(s) failed`:'MATCH a league code and a challenge replay to the same result, and a changed code is refused');
  process.exit(bad?1:0);
})().catch(e=>{ console.log(e&&e.stack); console.log('MISMATCH crashed: '+(e&&e.message)); process.exit(1) });
