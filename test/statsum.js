/* Do the players' lines add up to the game? (round 74). Plays a season in each game and, for every team-game in the
   league (yours and the computer's), sums the players' logged lines and sets them against what the game counted:
     basketball  the players' points and threes against the score (and the bench's share left over)
     football    touchdowns thrown against touchdowns caught, passing yards against receiving yards, the touchdowns
                 against the score
     hockey      goals and assists against the score; the goalie's goals against the other side's score
     soccer      goals against the score; the keeper's goals against the other side's score
     baseball    runs, RBI and home runs against the score
   Reports each sport's gaps; with --check exits 1 on any team-game that does not add up.
     node test/statsum.js [file-prefix] [--check] [--seasons N]     last line: MATCH or MISMATCH */
const path=require('path');const {load}=require('./harness.js');
const D=f=>path.join(process.env.DIST||path.join(__dirname,'..','dist'),f);
const CASES=[['basketball-coach-pro.html','Boston'],['basketball-coach.html','Duke'],['football-coach-pro.html','Kansas City'],['football-coach.html','Alabama'],
  ['hockey-coach-pro.html','Boston'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
const args=process.argv.slice(2), only=args.find(a=>!a.startsWith('--')&&!/^\d+$/.test(a)), CHECK=args.includes('--check');
const NS=+(args[args.indexOf('--seasons')+1]||1)||1;
let bad=0;
/* the season's levels: the leaders (and a few averages), to set against the real game's */
function levels(A,f){
  const sp=A.SPORT.id, all=[]; Object.keys(A.SEA.roster).forEach(t=>(A.SEA.roster[t]||[]).forEach((p,i)=>{ if(p&&p.st2&&p.st2.g)all.push({p:p,i:i,t:t,s:p.st2,pos:p.p}) }));
  const G=Math.max(...all.map(x=>x.s.g)), top=(pos,fn,min,low)=>{ const L=all.filter(x=>(!pos||pos.includes(x.pos))&&(!min||min(x.s))).map(x=>fn(x.s)).sort((a,b)=>low?a-b:b-a); return L.length?L[0]:NaN };
  const avg=(pos,fn,idx)=>{ const L=all.filter(x=>pos.includes(x.pos)&&(idx===undefined||x.i===idx)).map(x=>fn(x.s)); return L.length?L.reduce((a,b)=>a+b,0)/L.length:NaN };
  const r=v=>Number.isFinite(v)?(Math.abs(v)<10?v.toFixed(v<1&&v>0?3:1):Math.round(v)):'-'; let o=[];
  if(sp==='basketball'){ const pg=k=>s=>s[k]/s.g, q=s=>s.g>=G/3; o=[['ppg',top(0,pg('pts'),q)],['rpg',top(0,pg('reb'),q)],['apg',top(0,pg('ast'),q)],['spg',top(0,pg('stl'),q)],['bpg',top(0,pg('blk'),q)],['3PM',top(0,s=>s.tpm)],
    ['PG ppg avg',avg(['PG'],pg('pts'),0)],['C rpg avg',avg(['C'],pg('reb'),4)]] }
  if(sp==='football'){ o=[['pass yds',top(['QB'],s=>s.pyd)],['pass TD',top(['QB'],s=>s.ptd)],['INT thrown',top(['QB'],s=>s.int)],['QB yds avg',avg(['QB'],s=>s.pyd,0)],['rush yds',top(['RB'],s=>s.ryd)],['rush TD',top(['RB'],s=>s.rtd)],
    ['rec yds',top(['WR','WR2'],s=>s.cyd)],['rec',top(['WR','WR2'],s=>s.rec)],['rec TD',top(['WR','WR2'],s=>s.ctd)],['sacks',top(['EDGE','DT'],s=>s.sck)],['INT',top(['CB','S'],s=>s.ints)],['tackles',top(0,s=>s.tkl||0)]] }
  if(sp==='hockey'){ const SK=['C','LW','RW','D','D2']; o=[['goals',top(SK,s=>s.goals)],['points',top(SK,s=>s.pts)],['assists',top(SK,s=>s.ast)],['1st C pts avg',avg(['C'],s=>s.pts,0)],['1st D pts avg',avg(['D'],s=>s.pts,3)],
    ['save% top',top(['G'],s=>s.sv/(s.sv+s.ga),s=>s.g>=G/3)]];
    const NP=A.POS.length, slotAvg=(i,k)=>avg(SK.concat(['G']),s=>s[k]||0,i);
    console.log('    by slot (goals/pts): '+[0,1,2,3,4].map(i=>`${A.POS[i].p} ${slotAvg(i,'goals').toFixed(0)}/${slotAvg(i,'pts').toFixed(0)} depth ${slotAvg(i+NP,'goals').toFixed(0)}/${slotAvg(i+NP,'pts').toFixed(0)}`).join(', '));
    const best=all.filter(x=>SK.includes(x.pos)).sort((a,b)=>b.s.goals-a.s.goals).slice(0,5).map(x=>`${x.s.goals}g r${x.p.r} ${x.i<NP?A.POS[x.i].p:'depth '+A.POS[x.i-NP].p}`);
    console.log('    top scorers: '+best.join(', ')) }
  if(sp==='soccer'){ const O=['CB','FB','CM','W','ST']; o=[['goals',top(O,s=>s.goals)],['assists',top(O,s=>s.ast)],['ST goals avg',avg(['ST'],s=>s.goals,5)],['clean sheets',top(['GK'],s=>s.cs)]] }
  if(sp==='baseball'){ const H=['C','1B','2B','3B','SS','LF','CF','RF','DH'], P=['SP','SP2','SP3']; o=[['HR',top(H,s=>s.hr)],['RBI',top(H,s=>s.rbi)],['AVG',top(H,s=>s.h/s.ab,s=>s.ab>=3.1*G)],['R',top(H,s=>s.r)],['SB',top(H,s=>s.sb)],
    ['W',top(P,s=>s.w||0)],['SV',top(['CL'],s=>s.sv||0)],['ERA',top(P,s=>s.er*27/s.ip,s=>s.ip>=3*G,true)],['K',top(P,s=>s.k||0)],['GS max',top(P,s=>s.gs||0)]] }
  console.log(`  ${f} season ${A.SEA.year} (${G} games): `+o.map(([k,v])=>`${k} ${r(v)}`).join(', '));
}
for(const [f,team] of CASES.filter(c=>!only||c[0].startsWith(only))){
  const A=load({file:D(f),expose:['S','SEA','newDynasty','doAdvance','live','liveTick','answerLive','NAMES','POS','STAT_KEYS','glStride','SPORT','BENCH','BK','seasonRollover','startNextSeason']});
  A.newDynasty(team,5,'T');
  const games={}, w=A.glStride();
  for(let s=0;s<NS;s++){
    let guard=0;
    while(A.SEA.phase!=='done'&&guard++<500){ A.doAdvance(); let n=0; while(A.live&&!A.live.done&&n++<5000){A.live.ask?A.answerLive(A.live.ask.dp.opts[0][0]):A.liveTick()} }
    const yr=A.SEA.year;
    Object.keys(A.SEA.roster).forEach(tm=>(A.SEA.roster[tm]||[]).forEach(pl=>{ if(!pl||!pl.gl)return;
      for(let j=0;j+w<=pl.gl.length;j+=w){ const G=pl.gl.slice(j,j+w), P=A.POS[G[5]]; if(!P)continue;
        // the game, not the club he's with now: a man traded in the season (round 85: the computer's clubs trade on deadline
        // day) logged his earlier games for his old club; the opponent, the ground and the score name the side
        const opp=A.NAMES[G[1]], W=(A.SEA.weeks[G[0]]||{games:[]}).games, sc=g=>[g.hp!==undefined?g.hp:g.h,g.ap!==undefined?g.ap:g.a];
        const cand=W.filter(g=>{ const [h,a]=sc(g); return G[2]?(g.away===opp&&h===G[3]&&a===G[4]):(g.home===opp&&a===G[3]&&h===G[4]) }).map(g=>G[2]?g.home:g.away);   // a cup week: two clubs can meet one side on a step
        const club=cand.length===1?cand[0]:cand.indexOf(tm)>=0?tm:(cand[0]||tm);
        const key=[yr,club,G[0],G[1],G[2],G[3],G[4]].join('|'), g=games[key]=games[key]||{pf:G[3],pa:G[4],rows:[]};
        const o={pos:P.p,n:pl.n,r:pl.r}; (A.STAT_KEYS[P.p]||[]).forEach((k,i)=>o[k]=G[6+i]); g.rows.push(o) } }));
    levels(A,f);
    if(s<NS-1){ if(typeof A.startNextSeason==='function')A.startNextSeason(); else break }
  }
  const sp=A.SPORT.id, G=Object.values(games), sum=(rows,k,pos)=>rows.filter(r=>!pos||pos.includes(r.pos)).reduce((t,r)=>t+(r[k]||0),0);
  const out=[], tally={}; const note=(k,c)=>{ tally[k]=tally[k]||{n:0,off:0,ex:null,d:0}; tally[k].n++; if(!c.ok){tally[k].off++; if(!tally[k].ex)tally[k].ex=c.ex} tally[k].d+=c.d||0 };
  G.forEach(g=>{ const R=g.rows;
    if(sp==='basketball'){ const p=sum(R,'pts'), t=sum(R,'tpm'); note('players\' points no more than the score',{ok:p<=g.pf,ex:`${p} of ${g.pf}`,d:p/g.pf});
      note('threes no more than the points',{ok:t*3<=p,ex:`${t} threes, ${p} pts`}) }
    if(sp==='football'){ const ptd=sum(R,'ptd'), ctd=sum(R,'ctd'), pyd=sum(R,'pyd'), cyd=sum(R,'cyd'), rtd=sum(R,'rtd'), tds=ptd+rtd;
      note('TDs caught no more than TDs thrown',{ok:ctd<=ptd,ex:`${ptd} thrown, ${ctd} caught`});
      note('receiving yards no more than passing yards',{ok:cyd<=pyd,ex:`${pyd} passing, ${cyd} receiving`,d:pyd?cyd/pyd:0});
      note('TDs no more than the score allows',{ok:tds*6<=g.pf,ex:`${tds} TDs for ${g.pf} pts`})   /* a quarterback's own runs aren't a stat the game keeps */ }
    if(sp==='hockey'){ const gl=sum(R,'goals',['C','LW','RW','D','D2']), as=sum(R,'ast',['C','LW','RW','D','D2']), ga=sum(R,'ga',['G']);
      note('skaters\' goals no more than the score',{ok:gl<=g.pf,ex:`${gl} of ${g.pf}`,d:g.pf?gl/g.pf:1}); note('assists no more than two a goal',{ok:as<=2*g.pf,ex:`${as} assists, ${g.pf} goals`});
      note('goalie\'s goals against are the other side\'s',{ok:ga<=g.pa,ex:`${ga} against, they scored ${g.pa}`}) }
    if(sp==='soccer'){ const gl=sum(R,'goals'), ga=sum(R,'ga',['GK']); note('players\' goals no more than the score',{ok:gl<=g.pf,ex:`${gl} of ${g.pf}`,d:g.pf?gl/g.pf:1});
      note('keeper\'s goals against are the other side\'s',{ok:ga<=g.pa,ex:`${ga} against, they scored ${g.pa}`}) }
    if(sp==='baseball'){ const H=['C','1B','2B','3B','SS','LF','CF','RF','DH'], r=sum(R,'r',H), rbi=sum(R,'rbi',H), hr=sum(R,'hr',H), er=sum(R,'er');
      note('runs scored no more than the score',{ok:r<=g.pf,ex:`${r} of ${g.pf}`,d:g.pf?r/g.pf:1}); note('RBI no more than the runs',{ok:rbi<=g.pf,ex:`${rbi} RBI, ${g.pf} runs`});
      note('home runs no more than the runs',{ok:hr<=g.pf,ex:`${hr} HR, ${g.pf} runs`}); note('earned runs no more than the runs against',{ok:er<=g.pa,ex:`${er} ER, ${g.pa} against`}) } });
  console.log(`${f}: ${G.length} team-games`);
  Object.entries(tally).forEach(([k,t])=>{ console.log(`  ${t.off?'OFF ':'ok  '} ${k}: ${t.off} of ${t.n} off${t.off?` (e.g. ${t.ex})`:''}${t.d?`; mean share ${(t.d/t.n).toFixed(2)}`:''}`); bad+=t.off });
}
console.log(bad?`MISMATCH ${bad} team-game checks off`:'MATCH every line adds up'); process.exit(CHECK&&bad?1:0);
