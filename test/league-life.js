/* A league with a memory (review round 3, engine 27, branch league-life): the league goes on around you. Plays
   do-nothing careers in all seven games and measures, every season, what happened that the player didn't cause:
   coaching changes (in season and after it) against the real leagues' rates, records falling against the real book,
   Hall of Fame classes against each hall's rule and size, the awards night (finalists, the vote), the summer's news;
   then checks the owner's patience on made-up histories, and renders the screens (the record book, awards night,
   around the league) from the headless harness and reads their text.

     node test/league-life.js                 all seven, 16 seasons each (four at a time; about 25 minutes on 4 cores)
     node test/league-life.js --short         5 seasons each (about 4 minutes): the carousel, awards, screens, news
     node test/league-life.js nfl nhl --seasons 8
     node test/league-life.js --dist DIR      another build (DIR/<game>.html)
   The last line is MATCH or MISMATCH.

   Real figures (read November 2026):
   - Coaching changes a season, in season and after it, the top flight only:
     NFL 5-9, about 7 a year 2017-2025: https://www.si.com/nfl/nfl-head-coach-firings-by-year
     NBA about 7-8: in-season changes 2010-11 to 2018-19 were 3,4,4,1,3,5,0,3,1
       (https://hoopsrumors.com/2018/10/recent-history-of-in-season-nba-coaching-changes.html), seven new head coaches in
       the 2023 offseason (https://www.inkl.com/news/ranking-the-7-new-nba-head-coaches-who-made-the-best-hire), three
       in season in 2024-25 (https://www.cbssports.com/nba/news/the-nbas-coach-firing-epidemic-has-gotten-out-of-hand-and-it-isnt-solving-problems-for-former-champs)
     NHL about 9-11: 122 changes from March 2013 to May 2024, 39 head coaches in 2023-24
       (https://www.boston.com/sports/nhl/2024/05/13/coaching-carousel-spins-fast-nhl-job-security-doesnt-exist/), four in
       season by February 2025 (https://www.dailyfaceoff.com/news/how-well-every-mid-season-nhl-coaching-change-worked-2024-25)
     MLB 4-9: nine clubs changed managers in 2025, three in season
       (https://www.espn.in/mlb/story/_/id/46421908/mlb-manager-changes-tracker-hirings-firings-top-replacement-candidates)
     Premier League: the record is 10 sackings in a season (2008-09, 2013-14, 2017-18, 2021-22)
       (https://www.nationalworld.com/sport/football/premier-league-manager-sackings-record-4032177); 14 departures in
       2022-23 (https://theanalyst.com/eu/2023/05/premier-league-sackings-in-2022-23-managers)
     FBS: 31 openings in 2023-24 (https://www.deseret.com/2024/2/17/24075341/nearly-a-quarter-of-all-fbs-coaching-jobs-were-open-this-college-football-cycle),
       30 in 2024-25 (https://www.cbssports.com/college-football/news/from-top-to-bottom-college-football-has-never-seen-more-coaching-changes-study-shows-unprecedented-turnover)
     Division I basketball: about 51 in the 2026 cycle
       (https://www.espn.com/mens-college-basketball/story/_/id/48167700/coaching-carousel-tracker-firings-openings-candidates-hirings-buzz-2026)
   - Records: of the single-season marks in each league's book here, the real leagues broke about 0-3 a decade since
     2000 (the NFL's passing yards and touchdowns, receiving yards and sacks; the NBA's three-pointers; MLB's home runs,
     hits and saves; the Premier League's goals and assists; none in the NHL's). The game's book starts from the real
     one (leagues/<id>/89_lore.js), so its records should fall about as rarely.
   - Hall of Fame classes: Pro Football 3-5 modern-era players a year after five years retired
     (https://profootballhof.com/hall-of-famers/selection-process-faq); Hockey at most four men a year after three
     (https://hhof.com/induction/electionprocedures.html); Naismith three years after (https://www.thescore.com/news/1449560);
     the baseball writers 75% of ballots, ten years on the ballot, five years retired, about two a year
     (https://baseball-reference.com/about/hof_voting.shtml); the Premier League 3, 3 and 2 players in 2023-25
     (https://en.wikipedia.org/wiki/Premier_League_Hall_of_Fame); College Football 18 players in the 2026 class, first-team
     All-Americans, ten years after (https://www.thescore.com/ncaaf/news/3455549); National Collegiate Basketball about
     eight a year with coaches (https://www.foxsports.com/articles/cbk/jack-hartman-wayne-estes-among-8-chosen-for-national-collegiate-basketball-hall-of-fame)
   - Votes: NBA MVP 100 voters, 10-7-5-3-1 (https://wtop.com/nba/2022/05/nba-most-valuable-player-voting-2/); AP NFL 50
     voters, 10-5-3-2-1 (https://www.aol.com/articles/nfl-honors-votes-associated-press-140539640.html); Hart 191-194
     ballots, 10-7-5-3-1 (https://www.si.com/nhl/2025-hart-trophy-voting-results-full-tally-connor-hellebuyck-wins);
     BBWAA 30 a league, MVP 14-9-8-7-6-5-4-3-2-1 (https://www.mlb.com/news/2023-mlb-mvp-award-voting-results), Cy Young
     7-4-3-2-1 (https://www.mlb.com/news/2023-mlb-cy-young-award-voting-results); Heisman 870 media, 58 former winners
     and a fan vote, 3-2-1 (https://heisman.com/?p=11926)
*/
const fs=require('fs'), path=require('path'), cp=require('child_process');
const GAMES={cfb:'football-coach', nfl:'football-coach-pro', ncaab:'basketball-coach', nba:'basketball-coach-pro',
  nhl:'hockey-coach-pro', epl:'soccer-coach', mlb:'baseball-coach-pro'};
const argv=process.argv.slice(2);
const opt=(k,d)=>{ const i=argv.indexOf(k); return i>=0?argv[i+1]:d };
// coaching changes a season (the band, from the figures above, a little wider for a few seasons' noise)
const COACH={nfl:[5,9.5], nba:[5,10], nhl:[6.5,12], mlb:[4,9.5], epl:[7,14], cfb:[22,36], ncaab:[40,62]};
// Hall of Fame: the mean class once classes can come (the hall's wait and a career's end), and the most in one year
const HOF={nfl:[2.5,5,5], nba:[0.8,4,4], nhl:[0.5,4,4], mlb:[0.3,3.5,4], epl:[0.5,4,4], cfb:[5,16,16], ncaab:[1.5,5,5]};

/* ---------------- one career (a child process) ---------------- */
function career(lg,seasons,dist){
  const {load}=require('./harness.js');
  const A=load({file:path.join(dist,GAMES[lg]+'.html'),expose:['S','SEA','U','NAMES','LEAGUE','CONF','newDynasty','openOffseason',
    'commitOffseason','ENGINE_V','loreAwards','loreMid','loreWeekNews','loreNightHTML','loreSummerHTML','loreBookHTML','bossHTML',
    'bossFires','bossOf','bossBrink','loreY','loreTab'],settable:['loreTab']});
  A.newDynasty(A.NAMES[5],4242+lg.length*31,'T');
  const rows=[], top=lg==='epl'?A.LEAGUE.conf.order[0]:null, screens={};
  for(let y=1;y<=seasons;y++){
    const E=A.SEA, my=A.S.myTeam, seen=new Set(); let inSeason=0, g=0;
    while(E.phase!=='done'&&g++<4000){ E.advance(); A.loreWeekNews(my).forEach(x=>{ if(!seen.has(x.h)){ seen.add(x.h); inSeason++ } }) }
    const T=A.NAMES.filter(t=>!top||A.U.conf[t]===top), before={}; T.forEach(t=>before[t]=A.U.coach[t]&&A.U.coach[t].n);
    const mid=A.loreMid().filter(m=>T.indexOf(m.t)>=0).length, aw=A.loreAwards();
    const night=A.loreNightHTML().replace(/<[^>]+>/g,' ');
    // a vote adds up: no more points than the voters had to give, and the winner first
    let votesOk=true; aw.forEach(a=>{ if(!a.vote)return; const all=[a.w].concat(a.f||[]); if(all.some((x,i)=>i&&x.pts>a.w.pts))votesOk=false; if(a.w.fp>a.voters)votesOk=false });
    A.openOffseason();
    for(let c=0;c<6&&A.S.off;c++){ const O=A.S.off; if(O.act&&O.act.userOpen&&O.move===null)O.move=A.S.myTeam;
      if(A.LEAGUE.ui.offseasonBlock()!==null&&O.picks&&O.picks.resign)Object.keys(O.picks.resign).forEach(k=>O.picks.resign[k]=false);
      A.commitOffseason() }
    const lo=A.U.lore||{}, N=(lo.news||[]).slice(-1)[0]||{y:0,it:[]}, yl=N.y, cy=A.LEAGUE.lore.yOff?yl:yl+1;
    const ch=T.filter(t=>t!==my&&A.U.coach[t]&&A.U.coach[t].n!==before[t]).length;
    rows.push({ch:ch,mid:mid,news:N.it.length,inSeason:inSeason,aw:aw.length,fin:aw.filter(a=>a.f&&a.f.length).length,votesOk:votesOk,
      fallS:(lo.fall||[]).filter(f=>f[0]===yl&&f[2]==='s'&&!/^[WP]$/.test(f[1])).length,fallC:(lo.fall||[]).filter(f=>f[0]===yl&&f[2]==='c').length,
      hof:(lo.hof||[]).filter(h=>h[0]===cy).length,elig:(lo.elig||[]).length,night:/Awards night/.test(night),bytes:JSON.stringify(lo).length});
    if(y===seasons){
      screens.summer=A.loreSummerHTML().replace(/<[^>]+>/g,' ');
      ['book','hof','aw','titles'].forEach(k=>{ A.loreTab=k; screens[k]=A.loreBookHTML().replace(/<[^>]+>/g,' ').replace(/\s+/g,' ') });
      screens.boss=A.bossHTML().replace(/<[^>]+>/g,' ');
      screens.hofName=A.LEAGUE.lore.hof.name; screens.wait=A.LEAGUE.lore.hof.wait; screens.yOff=A.LEAGUE.lore.yOff;
      screens.classes=(lo.hof||[]).reduce((m,h)=>{ m[h[0]]=(m[h[0]]||0)+1; return m },{});
      screens.firstYear=2026+(A.LEAGUE.lore.yOff||0);
    }
  }
  // the owner's patience, on made-up histories (the rule in core 93_lore bossFires)
  const team=A.NAMES.find(t=>A.bossOf(t).pat===1), imp=A.NAMES.find(t=>A.bossOf(t).pat===0), pat=A.NAMES.find(t=>A.bossOf(t).pat===2);
  const Y=A.SEA.year, miss={miss:true,l:"Short of the mark."}, bad={miss:true,l:"A bad year, and everyone knows it."};
  const H=(t,ys)=>ys.map((m,i)=>({year:Y-1-i,team:t,miss:m,gradeLine:m?"Short of the mark.":"About what was expected."}));
  const own={
    measuredTwo:team?A.bossFires(team,H(team,[true]),miss):null, measuredOne:team?A.bossFires(team,H(team,[false]),miss):null,
    measuredFirst:team?A.bossFires(team,[],bad):null,
    impatientBad:imp?A.bossFires(imp,H(imp,[false]),bad):null, impatientFirst:imp?A.bossFires(imp,[],bad):null,
    patientTwo:pat?A.bossFires(pat,H(pat,[true]),miss):null, patientThree:pat?A.bossFires(pat,H(pat,[true,true]),miss):null,
    titleBuys:team?A.bossFires(team,[{year:Y-1,team:team,miss:true,gradeLine:"Short of the mark.",champion:null},{year:Y-2,team:team,miss:false,champion:team}],miss):null,
    pats:[team,imp,pat].map(t=>t?1:0).join("")};
  return {lg:lg,eng:A.ENGINE_V,rows:rows,screens:screens,own:own};
}
if(argv[0]==='--child'){ const r=career(argv[1],+argv[2],argv[3]); process.stdout.write(JSON.stringify(r)); process.exit(0) }

/* ---------------- the parent ---------------- */
const short=argv.includes('--short'), seasons=+opt('--seasons',short?5:16), dist=opt('--dist',path.join(__dirname,'..','dist'));
const leagues=Object.keys(GAMES).filter(l=>argv.includes(l)); if(!leagues.length)leagues.push(...Object.keys(GAMES));
const jobs=leagues.slice().sort((a,b)=>({ncaab:0,epl:1,mlb:2,cfb:3}[a]??9)-({ncaab:0,epl:1,mlb:2,cfb:3}[b]??9)), res={}, t0=Date.now();
function run(){ return new Promise(done=>{ let live=0;
  const next=()=>{ if(!jobs.length){ if(!live)done(); return } const lg=jobs.shift(); live++;
    const c=cp.spawn(process.execPath,[__filename,'--child',lg,String(seasons),dist],{stdio:['ignore','pipe','inherit']}); let out='';
    c.stdout.on('data',d=>out+=d); c.on('close',code=>{ try{ res[lg]=JSON.parse(out) }catch(e){ res[lg]={err:'exit '+code+' '+out.slice(-300)} } live--;
      console.log(`  ${lg} done (${Math.round((Date.now()-t0)/1000)}s)`); next() }) };
  for(let i=0;i<4;i++)next() }) }
run().then(()=>{
  let ok=true; const fail=m=>{ ok=false; console.log('  MISMATCH '+m) };
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
  let fallsAll=0, seasonsAll=0;
  for(const lg of leagues){ const R=res[lg]; if(!R||R.err){ fail(lg+': '+(R?R.err:'no result')); continue }
    const rows=R.rows, ch=mean(rows.map(r=>r.ch)), mid=mean(rows.map(r=>r.mid)), things=mean(rows.map(r=>r.news+r.inSeason));
    const falls=rows.reduce((s,r)=>s+r.fallS+r.fallC,0), perDecade=falls/rows.length*10; fallsAll+=falls; seasonsAll+=rows.length;
    const S=R.screens, from=S.firstYear+S.wait+(S.yOff?0:1), cls=Object.keys(S.classes).map(Number);
    const lastC=S.firstYear+seasons-1+(S.yOff?0:1), span=[]; for(let y=from+2;y<=lastC;y++)span.push(S.classes[y]||0);
    console.log(`${lg} (engine ${R.eng}, ${rows.length} seasons): coaching changes ${ch.toFixed(1)} a season (${mid.toFixed(1)} in season; real band ${COACH[lg].join('-')}) `+
      `| things the player didn't cause ${things.toFixed(1)} a season | records fallen ${falls} (${perDecade.toFixed(1)} a decade) `+
      `| Hall of Fame classes ${span.length?span.join(','):'none due yet'} | lore ${(rows[rows.length-1].bytes/1024).toFixed(1)} KB`);
    if(R.eng<27)fail(lg+': not engine 27');
    if(ch<COACH[lg][0]||ch>COACH[lg][1])fail(`${lg}: coaching changes ${ch.toFixed(1)} a season, outside ${COACH[lg].join('-')}`);
    if(things<5)fail(`${lg}: ${things.toFixed(1)} things a season the player didn't cause (five wanted)`);
    if(perDecade>8)fail(`${lg}: ${perDecade.toFixed(1)} records a decade (the real book falls 0-3 a decade)`);
    if(rows.some(r=>!r.aw||!r.night))fail(`${lg}: a season without an awards night`);
    if(rows.some(r=>!r.votesOk))fail(`${lg}: a vote that doesn't add up`);
    if(rows.some(r=>r.hof>HOF[lg][2]))fail(`${lg}: a Hall of Fame class above ${HOF[lg][2]}`);
    if(cls.some(y=>y<from))fail(`${lg}: a Hall of Fame class before anyone had waited ${S.wait} years`);
    if(!short&&span.length>=3){ const m=mean(span); if(m<HOF[lg][0]||m>HOF[lg][1])fail(`${lg}: Hall of Fame classes average ${m.toFixed(1)}, outside ${HOF[lg][0]}-${HOF[lg][1]}`) }
    if(rows[rows.length-1].bytes>40000)fail(`${lg}: the league's memory is ${rows[rows.length-1].bytes} bytes (keep it under 40 KB)`);
    if(!/Single season/.test(S.book)||!/Career/.test(S.book))fail(`${lg}: the record book doesn't show its records`);
    if(!S.hof.includes(S.hofName))fail(`${lg}: the Hall of Fame page doesn't name the ${S.hofName}`);
    if(!/Champions|Longest waits/.test(S.titles))fail(`${lg}: the titles page is empty`);
    if(!/Around the league/.test(S.summer))fail(`${lg}: no summer news`);
    if(!/measured|patient|impatient/.test(S.boss))fail(`${lg}: the owner isn't shown`);
    const o=R.own;
    if(o.measuredTwo!==true||o.measuredOne!==false||o.measuredFirst!==false)fail(`${lg}: a measured owner doesn't fire after two misses only (${JSON.stringify(o)})`);
    if(o.impatientBad===false||o.impatientFirst===true)fail(`${lg}: an impatient owner (${JSON.stringify(o)})`);
    if(o.patientTwo===true||o.patientThree===false)fail(`${lg}: a patient owner (${JSON.stringify(o)})`);
    if(o.titleBuys===true)fail(`${lg}: a title didn't buy a season`);
  }
  console.log(`all: ${fallsAll} records fallen in ${seasonsAll} seasons (${(fallsAll/Math.max(1,seasonsAll)*10).toFixed(1)} a decade a league)  (${Math.round((Date.now()-t0)/1000)}s)`);
  console.log(ok?'MATCH':'MISMATCH');
});
