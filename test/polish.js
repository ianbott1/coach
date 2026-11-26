/* Playtest slips (review round, "polish"): each check reproduces a slip a tester saw on the live games and fails if it
   comes back. One check a finding, in plain node on the built games (no browser).
     node test/polish.js            last line: MATCH or MISMATCH */
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'golden.js'),'utf8');const m={exports:{}};
new Function('require','module',src.slice(0,src.indexOf('const args'))+'\nmodule.exports={load};')(require,m);
const DIST=process.env.DIST||path.join(__dirname,'..','dist');
const FILE={cfb:'football-coach.html',nfl:'football-coach-pro.html',ncaab:'basketball-coach.html',nba:'basketball-coach-pro.html',nhl:'hockey-coach-pro.html',epl:'soccer-coach.html',mlb:'baseball-coach-pro.html'};
// the golden loader, with one more door: ev(code) runs code inside the game's own scope
function load(lg){
  const f=path.join(DIST,FILE[lg]); const tmp=path.join(require('os').tmpdir(),'polish-'+process.pid+'-'+lg+'.html');
  const html=fs.readFileSync(f,'utf8').replace(/\n\s*return \{ leagueId\(\)/,'$&');
  // golden's load() builds `return { leagueId(){...}, ...}`: add ev by wrapping the file's script with a global hook
  const s=html.split('<script>'); const js=s[1].split('</script>');
  js[0]=js[0].replace(/\(async function\(\)\{[\s\S]*?\}\)\(\);\s*$/,'')+'\nglobalThis.__ev=(c)=>eval(c);\n';
  fs.writeFileSync(tmp,s[0]+'<script>'+js.join('</script>'));
  const api=m.exports.load(tmp); fs.unlinkSync(tmp); const ev=globalThis.__ev; api.ev=ev; return api;
}
let bad=0; const ok=(c,msg)=>{ if(!c){bad++;console.log('FAIL',msg)} else console.log('ok  ',msg) };
const only=process.argv[2];
const checks=[];
const check=(name,fn)=>checks.push([name,fn]);
module.exports={load,ok,check};

// Coordinator (round 110 build): an eliminated pro basketball team's "Sim to your next game, or the end" and "Enter the
// offseason" first asked "Keep Work it inside from your last game?". The carried-plan question is only for a game you play.
check('carried plan asked only before your own game (all seven)',()=>{
  for(const lg of Object.keys(FILE)){
    const api=load(lg), ev=api.ev; api.newDynasty(ev('NAMES[NAMES.length-1]'),5,'T');
    let asked=0, wrong=[], n=0;
    const probe=()=>{ ev('plan="aggressive";S.planStep=-1;S.planOk=null'); const c=ev('planCarried()'), mine=ev('SEA.phase==="done"||spectating()');
      if(c&&mine)wrong.push(api.SEA.phase+' step '+api.SEA.step); if(c)asked++ };
    while(api.SEA.phase!=='done'&&n++<3000){ probe(); ev('plan="balanced"'); ev('simAdvance()') }
    probe(); ok(api.SEA.phase==='done'&&!wrong.length&&asked>0,`${lg}: asked before ${asked} of your games, never on a sim-on or the season's end${wrong.length?' (asked at '+wrong.slice(0,3).join(', ')+')':''}`);
  }
});

// Playtest: a college center (Guidry) averaged 3.8 points and 0.0 rebounds over 30 games; a pro backup center (Anwar
// Dabney) 3.8, 0.0, 0.0. Every man who plays has a whole line: a big who played ten games has rebounds, and a backup's
// games are the games he played.
check('basketball backups have whole lines (college and pro)',()=>{
  for(const lg of ['ncaab','nba']){
    const api=load(lg), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); let n=0;
    while(api.SEA.phase==='week'&&n++<400)ev('simAdvance()');
    const zero=[], bigs=[];
    for(const t of api.ev('NAMES')){ (api.SEA.roster[t]||[]).forEach((p,i)=>{ const s=p&&p.st2; if(!s||!(s.g>=10))return;
      if(!(s.reb>0))zero.push(`${t} ${p.n} (slot ${i}) ${s.g} games, ${(s.pts/s.g).toFixed(1)} ppg, 0 rebounds`);
      if(i===9)bigs.push(s.reb/s.g) }) }
    const avg=bigs.reduce((a,b)=>a+b,0)/Math.max(1,bigs.length);
    ok(!zero.length&&avg>=1.5,`${lg}: no one with 10+ games is without a rebound${zero.length?' ('+zero.length+': '+zero.slice(0,2).join('; ')+')':''}; backup centers ${avg.toFixed(1)} rpg`);
  }
});

// Playtest (pro football): backups' lines were only what the log named them for (a corner with interceptions and no
// tackle, a receiver whose every catch was a touchdown) and every box score had an "Other receivers" row. The third and
// fourth receivers and the nickel and dime backs play every game they're healthy.
check('football backups have whole lines; no "Other receivers" row (pro)',()=>{
  const api=load('nfl'), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); let n=0;
  while(api.SEA.phase==='week'&&n++<400)ev('simAdvance()');
  const bad=[]; let rec=0, td=0, dbs=0;
  for(const t of ev('NAMES')){ const R=api.SEA.roster[t]||[]; [12,13].forEach(i=>{ const s=R[i]&&R[i].st2; if(s&&s.g){ rec+=s.rec||0; td+=s.ctd||0 } });
    [18,19].forEach(i=>{ const s=R[i]&&R[i].st2; if(!s||!s.g)return; dbs++; if((s.ints||0)>0&&!(s.tkl>0))bad.push(`${t} ${R[i].n}: ${s.ints} INT, no tackle`) }) }
  const g=[].concat(...api.SEA.weeks.map(w=>w.games))[0]; const step=api.SEA.weeks.findIndex(w=>w.games.includes(g));
  const box=ev('sportBoxPlayers')(g,ev('boxLines')(g,g.week!=null?g.week:step,true)).replace(/<[^>]+>/g,' ');
  ok(!bad.length&&rec>3*td&&dbs>=50&&!/Other receivers/.test(box)&&/Tight ends and backs/.test(box),`backup receivers ${rec} catches for ${td} touchdowns; ${dbs} nickel and dime backs with lines${bad.length?'; '+bad.slice(0,2).join('; '):''}; box: ${/Other receivers/.test(box)?'Other receivers':'tight ends and backs'}`);
});

// Playtest: soccer's words in other sports: the live Highlights buttons "Every chance" and "Full match" (basketball,
// hockey, football, baseball), the sim-ahead stop "a top side, a cup tie" (pro basketball), "A good side".
check('no soccer wording outside soccer (six games)',()=>{
  const W=/Every chance|Full match|top side|good side|cup tie|a side rated|a side that started|better side/;
  for(const lg of ['cfb','nfl','ncaab','nba','nhl','mlb']){
    const api=load(lg), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); let n=0;
    while(!api.live&&n++<30)api.doAdvance();
    const live=(global.__nodes.app||{}).innerHTML||'';
    const txt=[live,ev('helpPanel()'),ev('simSheetHTML()'),JSON.stringify(ev('firstJobs()')),JSON.stringify(ev('ACH'))].join(' ').replace(/<[^>]+>/g,' ');
    const m=txt.match(W); ok(!!api.live&&!m&&/Full game/.test(txt),`${lg}: ${m?'says "'+m[0]+'": ...'+txt.slice(Math.max(0,m.index-60),m.index+40).replace(/\s+/g,' ')+'...':'its own words (Full game, '+ev('hlAllLabel()')+')'}`);
  }
  const api=load('epl'), ev=api.ev; ok(ev('hlAllLabel()')==='Every chance'&&ev('hlFullLabel()')==='Full match'&&/top side, a cup tie/.test(ev('SIM_BIG')),'soccer keeps Every chance, Full match, a top side, a cup tie');
});

// Playtest: pro basketball's plan said "Over forty minutes the better team wins"; the pros play 48 (college 40).
check('a game is as long as its league plays it (basketball, hockey, soccer)',()=>{
  const want={ncaab:/Over forty minutes/,nba:/Over forty-eight minutes/,nhl:/Over sixty minutes/,epl:/Over ninety minutes/};
  for(const lg of Object.keys(want)){ const api=load(lg), d=api.ev('PLANS.safe.d'); ok(want[lg].test(d),`${lg}: "${d.slice(0,80)}"`) }
});

// Playtest (college basketball): "Cooper Achterberg buries a three" while he sat with three fouls; "heads to the bench
// with 3 fouls" said again after half-time for the same man on the same fouls. A man named for a basket is on that team
// and on the floor; a second sit on the same fouls says he stays on the bench.
check('basketball play-by-play names men on the floor (college and pro)',()=>{
  for(const lg of ['ncaab','nba']){
    const api=load(lg), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); let games=0, named=0, offN=0, bad=[], sits=[], g=0;
    while(games<(lg==='nba'?40:30)&&g++<400){ api.doAdvance(); let n=0;
      while(api.live&&!api.live.done&&n++<800){ if(api.live.ask){ const o=api.live.ask.dp.opts; const sit=o.find(x=>x[0]!=='play'); api.answerLive((sit||o[0])[0]) } else api.liveTick() }
      const L=api.live; if(!L||!L.done)continue; games++;
      ev('live').drives.forEach(d=>{ (d.ev||[]).forEach(e=>{ const t=ev('bbEventText')(L.g,e,d), tm=e.side==='home'?L.g.home:L.g.away;
        if(e.k==='sit')sits.push((e.again?'again ':'')+t.text);
        if(e.k!=='three'&&e.k!=='inside')return; named++;
        const roster=(api.SEA.roster[tm]||[]).map(p=>p&&p.n); const x=d.star&&d.star[e.side], off=x&&(x[1]===false||x[2])?ev('bbStar')(tm):null; if(off)offN++;
        const who=(roster.find(n=>n&&t.text.includes(n.split(' ').slice(-1)[0]))||'');
        if(t.team!==tm||!who)bad.push(`${tm}: "${t.text}" (not on its roster)`);
        else if(off&&who===off)bad.push(`${tm}: "${t.text}" while ${off} sat`) }) }) }
    ok(!bad.length&&named>50,`${lg}: ${named} baskets named in ${games} games (${offN} while a star sat), each by a man on the floor${bad.length?'; '+bad.slice(0,3).join('; '):''}; sits: ${sits.length} (${sits.filter(x=>x.startsWith('again')).length} "stays on the bench")`);
  }
});

// Playtest, the board and the season's words: college basketball's board said "missed the NCAA tournament" before the
// conference tournament, and "Selection Sunday decides the rest" to an 11-20 team; college football said "bowl snub"
// before the bowls were set and its grade rose after a bowl loss; pro basketball's grade fell A- to B+ the moment a
// 62-20 team clinched; "Off the mark" showed after an 82-game sim with no word of which game.
check('the board judges only what has happened (four games)',()=>{
  { const api=load('ncaab'), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); let n=0;
    while(!/^ct/.test(api.SEA.phase)&&n++<400)ev('simAdvance()');
    let early=[], hopeless=0, hopeLosing=[];
    while(/^ct/.test(api.SEA.phase)&&n++<500){ for(const t of ev('NAMES')){ const r=api.SEA.seasonResult(t), alive=api.SEA.ctAlive(t), rec=api.SEA.rec[t];
        if(alive&&r)early.push(`${t} (${api.SEA.phase}, still in its tournament): "${r}"`);
        if(!api.SEA.marchHope(t)){ hopeless++; if(r!=='Missed the NCAA tournament')early.push(`${t} out with no hope: "${r}"`) }
        if(rec[0]<=rec[1]&&api.SEA.marchHope(t)&&!alive)hopeLosing.push(t) }
      ev('simAdvance()') }
    ok(!early.length&&!hopeLosing.length&&hopeless>100,`ncaab conference tournaments: no team alive in one is told it missed the NCAA tournament; ${hopeless} team-rounds out with no hope are${early.length?'; '+early.slice(0,2).join('; '):''}`);
  }
  { const api=load('cfb'), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); let n=0;
    while(api.SEA.phase==='week'&&n++<40)ev('simAdvance()');
    const pre=ev('NAMES').map(t=>api.SEA.seasonResult(t)).filter(Boolean);
    while(api.SEA.phase!=='bowls'&&n++<60)ev('simAdvance()');
    const P=api.SEA.bowlPairs||[], heads=P.filter(p=>/^Headed to the /.test(api.SEA.seasonResult(p.a))).length;
    const exp=ev('expectations()'), before={}; P.forEach(p=>[p.a,p.b].forEach(t=>{ const r=api.SEA.rec[t]; before[t]=ev('seasonGrade')(r[0],r[1],api.SEA.seasonResult(t),exp) }));
    ev('simAdvance()'); const order=['F','D','C-','C','C+','B-','B','B+','A-','A','A+']; let rose=[];
    P.forEach(p=>{ const t=p.a, g=api.SEA.bowls.find(x=>x.home===t||x.away===t); const L=g&&g.loser; if(!L)return; const r=api.SEA.rec[L], aft=ev('seasonGrade')(r[0],r[1],api.SEA.seasonResult(L),exp);
      if(order.indexOf(aft.g)>order.indexOf(before[L].g))rose.push(`${L} ${before[L].g} to ${aft.g}`) });
    ok(!pre.length&&heads===P.length&&P.length>30&&!rose.length,`cfb: no result before the selection show (${pre.length}: ${pre.slice(0,2).join(', ')}); ${heads} of ${P.length} bowl teams "headed to" theirs; no bowl loser's grade rose${rose.length?' ('+rose.slice(0,3).join(', ')+')':''}`); }
  for(const lg of ['nba','nhl','mlb']){ const api=load(lg), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); let n=0;
    while(api.SEA.phase==='week'&&n++<400)ev('simAdvance()');
    while(!(api.SEA.seeds&&Object.keys(api.SEA.seeds).length)&&n++<500)ev('simAdvance()');
    const exp=ev('expectations()'), order=['F','D','C-','C','C+','B-','B','B+','A-','A','A+']; let fell=[], k=0;
    for(const t of Object.keys(api.SEA.seeds)){ const r=api.SEA.rec[t], res=api.SEA.seasonResult(t); if(!/^Made the/.test(res))continue; k++;
      const a=ev('seasonGrade')(r[0],r[1],'',exp), b=ev('seasonGrade')(r[0],r[1],res,exp); if(order.indexOf(b.g)<order.indexOf(a.g))fell.push(`${t} ${r[0]}-${r[1]} ${a.g} to ${b.g}`) }
    ok(k>=8&&!fell.length,`${lg}: ${k} teams into the playoffs, no grade falls on getting in${fell.length?' ('+fell.slice(0,2).join(', ')+')':''}`) }
  { const api=load('nba'), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); ev('render()'); ev('achToastHTML()'); let n=0;
    ev('simRun(SEA.step+30)'); let t=(global.__nodes.app||{}).innerHTML.match(/<div class="achtoast">[\s\S]*?<\/div><\/div>/)?.[0]||''; t=t.replace(/<[^>]+>/g,' ').replace(/&middot;/g,'·');
    ok(/Off the mark Win your first game · \S/.test(t.replace(/\s+/g,' ')),`nba: after a sim the toast names the first win's game: "${t.replace(/\s+/g,' ').trim().slice(0,90)}"`) }
});

// Playtest (pro basketball): the second round's boxes read "to be decided" after the first round had finished, until
// a game of it was played; the column was "Semifinals" beside "Conference Finals". Each box fills as soon as its teams
// are known; the rounds are named as the league names them.
check('pro basketball bracket fills as soon as a pairing is known (and hockey\'s)',()=>{ for(const lg of ['nba','nhl']){
  const api=load(lg), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); let n=0, checked=0; const bad=[];
  while(api.SEA.phase==='week'&&n++<400)ev('simAdvance()');
  while(api.SEA.phase!=='done'&&n++<700){ ev('SEA.userTeam=S.myTeam; SEA.advance()');
    for(const sd of ev('Object.keys(LEAGUE.conf.sides)')){ const h=ev('confBracket')(sd), txt=h.replace(/<[^>]+>/g,' ');
      if(lg==='nba'&&(/>Semifinals</.test(h)||!/Conference Semifinals/.test(h)))bad.push('labels: '+txt.slice(0,80));
      const r1=(api.SEA.series.r1||[]).filter(x=>x.side===sd), r2=(api.SEA.series.r2||[]).filter(x=>x.side===sd);
      if(r1.length===4&&r1.some(x=>x.winner)&&!r2.length){ checked++; const cols=h.split('class="bcol"'); const semi=cols[2]||'';
        if(r1.every(x=>x.winner)&&/to be decided/.test(semi))bad.push(`${sd}, step ${api.SEA.step}: the first round is over and the semifinals still read "to be decided"`);
        r1.filter(x=>x.winner).forEach(x=>{ if(semi.indexOf(x.winner.replace(/&/g,'&amp;'))<0)bad.push(`${sd}: ${x.winner} won its series and isn't in the next round's box`) }) } } }
  ok(checked>0&&!bad.length,`${lg}: ${checked} looks between the rounds with the second round filled${bad.length?'; '+[...new Set(bad)].slice(0,3).join('; '):''}`);
} });

// Playtest (pro basketball): an assistant rated +45 beside a tooltip whose scale stopped at +40 ("+40 one of the best").
// Ratings run from about -58 to +68; the scale says +40 or more is one of the best, as the grade words do.
check('the staff rating\'s scale covers every rating shown (seven games)',()=>{
  for(const lg of Object.keys(FILE)){ const api=load(lg), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T');
    const h=api.view('team'); const tips=h.match(/title="How good he is at the job:[^"]*"/g)||[]; const q=(h.match(/class="stq[^"]*"[^>]*>([+\-]?\d+)</g)||[]).map(x=>+x.replace(/.*>/,'').replace('<',''));
    ok(tips.length>0&&tips.every(t=>/\+40 or more one of the best, -40 or less/.test(t)),`${lg}: ${tips.length} staff ratings (${q.join(', ')}), the scale open at both ends`) }
});

// Playtest (pro basketball): asking OKC about a forward said only "Nobody of yours at his position would get him." The
// answer says who of yours comes closest and what stands in the way (words only; the trade model is untouched).
check('asking about a player says what stands in the way (pro basketball)',()=>{
  const api=load('nba'), ev=api.ev; api.newDynasty(ev('NAMES[0]'),5,'T'); for(let i=0;i<15;i++)ev('simAdvance()');
  if(!ev('tdState().open')){ ok(false,'trades closed on day 15'); return }
  let no=0, said=0; const ex=[];
  for(const t of ev('tdClubs()').slice(0,8)){ (api.SEA.roster[t]||[]).forEach((p,b)=>{ if(!p)return; ev(`TD_UI={club:${JSON.stringify(t)},ask:${b}}`);
      const h=ev('tradesView()').replace(/<[^>]+>/g,' ').replace(/\s+/g,' '); if(!/Nobody of yours at his position would get him/.test(h))return; no++;
      const m=h.match(/would get him[^.]*\.(.*?)(With your first-round pick|Two for two|$)/); const why=(m&&m[1]||'').trim(); if(why.length>20){ said++; if(ex.length<2)ex.push(`${t} on ${p.n}: ${why.slice(0,110)}`) } }) }
  ok(no>=10&&said===no,`${said} of ${no} "nobody would get him" answers say why (${ex.join(' | ')})`);
});

if(require.main===module){ (async()=>{ for(const [name,fn] of checks){ if(only&&!name.includes(only))continue; console.log('--',name); try{ await fn() }catch(e){ bad++; console.log('FAIL',name,'crashed:',e.stack.split('\n').slice(0,3).join(' | ')) } }
  console.log(bad?`MISMATCH ${bad} check(s) failed`:'MATCH every playtest slip stays fixed'); process.exit(bad?1:0) })() }
