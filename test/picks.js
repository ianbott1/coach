/* First-round picks in deals (round 86). In a real browser, pro basketball and pro football: a deal with their pick
   (you hold two first-rounders) and a deal with yours (you hold none); the season played out; on draft night your
   picks are the ones you hold, you make each one, the club holding your old pick drafts at its slot; a reload in the
   offseason gives the same draft; the summer goes through.      node test/picks.js     last line: MATCH or MISMATCH */
const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch();let bad=0;const ok=(c,m)=>{if(!c){bad++;console.log('  FAIL',m)}};
for(const [f,team] of [['basketball-coach-pro.html','Boston'],['football-coach-pro.html','Kansas City']])for(const kind of ['theirs','mine']){
  const p=await b.newPage({viewport:{width:1265,height:900}}),errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),f));await p.waitForTimeout(300);
  const r=await p.evaluate(([team,kind])=>{newDynasty(team,kind==='mine'?13:5,'P');S.title=false;S.guide=false;if(LEAGUE.trade.on&&LEAGUE.trade.on())return {skip:1};   /* pro basketball's front office: its own trade machine, tested by nba-fo.js */let n=0;while(!tdState().open&&n++<400)simAdvance();for(let i=0;i<3;i++)simAdvance();
    const my=S.myTeam, R=SEA.roster[my]; let d=null;
    if(kind==='theirs'){ for(let a=0;a<R.length&&!d;a++){ const L=tdShopPick(a); if(L.length)d=L[0] } }
    else { for(const t of tdClubs()){ for(let bb=0;bb<SEA.roster[t].length&&!d;bb++){ const L=tdAskPick(t,bb); if(L.length)d=L[0] } if(d)break } }
    if(!d)return {err:'no deal with a pick'}; tdDo(d); const other=d.t, line=`${d.give.n}${kind==='mine'?' + your pick':''} for ${d.t}'s ${d.get.n}${kind==='theirs'?' + their pick':''}`;
    n=0; while(SEA.phase!=="done"&&n++<800)simAdvance(); openOffseason(); const O=S.off; if(O.act&&O.act.userOpen)O.move=my;
    const order=dnOrder(), mine=dnPicksOf(my), first=mine.filter(o=>o<=order.length), theirFirst=dnPicksOf(other).filter(o=>o<=order.length);
    // draft night: make every pick of yours (the staff's choice), then the draft as it will run
    O.dn=true; O.picks.hand=[]; view='home'; render(); let k=0, screen='';
    while(k++<40){ const D=dnState(); if(!D.stop||D.stop.team!==my)break; screen=screen||document.body.innerText.slice(0,0); O.picks.hand=O.picks.hand.concat([D.stop.suggest]); render() }
    const shot=document.body.innerText.replace(/\s+/g,' ').match(/(Your (next )?pick[^.]*\.)/); const D=dnState();
    const got=D.picks.filter(x=>x.team===my).map(x=>x.overall), byOther=D.picks.filter(x=>x.team===other&&x.overall<=order.length).map(x=>x.overall);
    const a0=JSON.stringify(D.picks.map(x=>[x.overall,x.team,x.pid])); save(); stashCoach&&stashCoach(); rebuild(); const a1=JSON.stringify(dnState().picks.map(x=>[x.overall,x.team,x.pid]));
    let commitErr=null; try{ for(let c=0;c<6&&S.off;c++){ if(LEAGUE.ui.offseasonBlock()!==null&&S.off.picks.resign)Object.keys(S.off.picks.resign).forEach(q=>S.off.picks.resign[q]=false); commitOffseason() } }catch(e){commitErr=e.message}
    return {line,first,theirFirst,mineAll:mine,got,byOther,stop:!!D.stop,same:a0===a1,phase:SEA.phase,year:SEA.year,commitErr,shot:shot?shot[1]:''} },[team,kind]);
if(r.skip){console.log(f.padEnd(26),'its own trade machine: see test/nba-fo.js');await p.close();continue}
  if(r.err){ console.log(f,kind,r.err); bad++; await p.close(); continue }
  console.log(`${f} (${kind==='theirs'?'their pick to you':'your pick to them'}): ${r.line}; your first-rounders ${JSON.stringify(r.first)}, theirs ${JSON.stringify(r.theirFirst)}; your picks made ${JSON.stringify(r.got)}`);
  ok(r.first.length===(kind==='theirs'?2:0),`you hold ${kind==='theirs'?'two first-rounders':'no first-rounder'} (${r.first.length})`);
  ok(r.theirFirst.length===(kind==='theirs'?0:2),`they hold ${kind==='theirs'?'none':'two'} (${r.theirFirst.length})`);
  ok(JSON.stringify(r.got)===JSON.stringify(r.mineAll),'you make each pick you hold, and only those');
  ok(JSON.stringify(r.byOther)===JSON.stringify(r.theirFirst),'they draft at the first-round slots they hold');
  ok(!r.stop,'the draft runs to its end'); ok(r.same,'a reload in the offseason gives the same draft');
  ok(!r.commitErr&&r.phase!=="done",'the summer goes through'+(r.commitErr?': '+r.commitErr:''));
  ok(!errs.length,'page errors: '+errs.slice(0,2).join(' | '));
  await p.close() }
await b.close();console.log(bad?'MISMATCH '+bad:'MATCH first-round picks in deals: held, made, drafted, replayed');process.exit(bad?1:0)})();
