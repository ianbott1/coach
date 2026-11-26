/* ============ the game: baseball ============ */
/* A game is nine innings (more if level), played plate appearance by plate appearance: each one a strikeout, a walk,
   a hit of some kind or an out, from the hitters' and the pitcher's strength. The live view moves an inning at a time;
   your calls come between at-bats.
   - The starters: each side's starting pitcher tires (a little worse each batter past his eighteenth) and goes to the
     bullpen when he's spent or hit hard; the closer gets the ninth with a lead of one to three.
   - Their hitters' approach (pull, patient, contact), and your pitching plan against it: the read, as in the other
     games. The right plan takes something off their bats; the wrong one gives a little.
   - Your calls: the scouting report, the read after the third, pulling your starter when he's tiring in a close
     game, a pinch hitter late with men in scoring position, and sending the runner late in a one-run game.
   Calibrated (test/bs-calibrate.js) against MLB 2023-25: about 4.4 runs a side, home sides winning 53%, a game in
   four or five decided by a run, extras about one game in twelve. */
const SEGS=9;
/* round 72 (engV 3): a starter tires more gently past his 18th batter, so a dealing starter is sometimes worth keeping
   (Muse: the bullpen call graded "pull" 14 of 14; measured, leaving him in won more replays in 0 of 50 calls) */
const BS_TIRED3=+((typeof process!=="undefined"&&process.env&&process.env.BS_T)||0.03);
const BS_PEN3=+((typeof process!=="undefined"&&process.env&&process.env.BS_P)||-0.10);   // and a bullpen a shade further from a fresh starter, so the runs stay where MLB's are (4.38 a side, was 4.39; one-run 25%, extra innings 8%); measured, keeping him won 30% of the calls, 48% for a starter who hadn't allowed a run
/* round 75 (engV 5): the players show. A hitter's own rating moves his at-bats (hit: per point above or below his
   lineup's average, zero-sum, so a team's runs stay its own), and the lineup bats in order of ability (the third best
   leading off, the best second, then the rest down the order) where it batted by position (the catcher led off every game). It was the
   team's strength alone: a hitter's rating against his production read 0.16-0.21 (MLB 0.4+), the home run leader 31-39.
   A starter's place in the rotation counts less (q: per rating point from the rotation's average; at 0.012 the best
   starters ran 1.4-1.5 ERAs over 220+ innings, MLB's best 1.9-2.9), the bullpen is closer to a fresh starter (pen;
   its ERA ran 4.56, MLB 3.6-4.3, and starters took 66% of the wins), and the league's offence (x) holds the runs where
   MLB's are. Seasons begun before keep engine 3's. */
const BS5={hit:+((typeof process!=="undefined"&&process.env&&process.env.BS5_H)||0.013), q:+((typeof process!=="undefined"&&process.env&&process.env.BS5_Q)||0.005),
  pen:+((typeof process!=="undefined"&&process.env&&process.env.BS5_P)||-0.07), x:+((typeof process!=="undefined"&&process.env&&process.env.BS5_X)||0.01)};
const BS5_HX={hr:2.6, bb:1.6, s2:1.4, s1:0.5, k:1.0};   // how a hitter's own edge splits across his line
const BS_ORDER5=[2,0,1,3,4,5,6,7,8];   // batting slot k: the hitter ranked BS_ORDER5[k] (0 the best): the third best leads off, the best bats second
function bsV5(){ return ENGINE_V>=5 }
/* round 77 (engV 6): the running game and the bullpen, by name.
   Steals: a runner's speed sets how often he goes, not just whether he makes it (the computer had sent one in thirty,
   and only an 80 percent bet: the leaders stole 6-10, MLB's 40-70). Burners (one in twenty) go most chances and make
   it nearly nine in ten; the fast often; the average now and then; the slow never. The bet: a 70 percent chance,
   about where a steal starts paying in MLB.
   Starters face one batter fewer (they went 5.5 innings and took 64% of the wins), and the league's offence comes
   down a touch for the extra running (x).
   The bullpen: the third starter's backup is the long man (in early, two innings at most), the closer's backup the
   set-up man (the eighth, and the ninth when the closer rests); the rest are still "bullpen". Each by his rating.
   The decisions are the scorer's: the win to the pitcher of record when his side took the lead for good (a starter
   short of five innings gives it to the first reliever), the loss to the pitcher who was on when they fell behind for
   good, the save to the last man if he came in to protect one to three runs. */
const BS6={stamCut:+((typeof process!=="undefined"&&process.env&&process.env.BS6_SC)||1), x:+((typeof process!=="undefined"&&process.env&&process.env.BS6_X)||-0.005), send:+((typeof process!=="undefined"&&process.env&&process.env.BS6_SEND)||0.70), burn:+((typeof process!=="undefined"&&process.env&&process.env.BS6_BURN)||0.45), fast:+((typeof process!=="undefined"&&process.env&&process.env.BS6_FAST)||0.28), avg:+((typeof process!=="undefined"&&process.env&&process.env.BS6_AVG)||0.16)};
const BS_SPEED6=[["a burner",0.14,"burn"],["fast",0.08,"fast"],["fast",0.08,"fast"],["fast",0.08,"fast"],["fast",0.08,"fast"],["average",0,"avg"],["average",0,"avg"],["average",0,"avg"],["average",0,"avg"],["average",0,"avg"],
  ["average",0,"avg"],["average",0,"avg"],["average",0,"avg"],["average",0,"avg"],["average",0,"avg"],["average",0,"avg"],["slow",-0.12,"slow"],["slow",-0.12,"slow"],["slow",-0.12,"slow"],["slow",-0.12,"slow"]];
function bsV6(){ return ENGINE_V>=6 }
/* round 87 (engine 10): the players' attributes (core 93_attrs) play. Each comes in through the game's context
   (gameCtx: ctx.at, by name, as ctx.rate does), never from a roster mid-game.
   - A hitter's edge over his lineup splits by attribute where engine 5 split it by rating: Power his home runs and a
     fifth of his doubles, Contact his singles, most of his doubles and half his strikeouts, Eye his walks and the other
     half. A hitter whose attributes all equal his rating bats exactly as on engine 9.
   - A pitcher's shape (against his own rating, so it adds nothing to how good he is): Stuff strikeouts and fewer hits,
     Control fewer walks and fewer home runs; Stamina how fast he tires past his eighteenth batter (letting a
     tiring starter face more batters was measured to cost runs: by then the bullpen is better).
   - The nine's Fielding (each man's against his rating) shades the singles they allow; Speed and a catcher's Arm set
     the steal, where a hash of the name did.
   Each term is recentred for its spread (exp is convex: a spread with no mean would add runs). Sizes by run value:
   two players of one rating are worth about the same however they lean (test/attrs-bs.js). */
const BS10={stf:+((typeof process!=="undefined"&&process.env&&process.env.BS10_S)||0.016), ctl:+((typeof process!=="undefined"&&process.env&&process.env.BS10_C)||0.0229),
  fld:+((typeof process!=="undefined"&&process.env&&process.env.BS10_F)||0.05), sta:+((typeof process!=="undefined"&&process.env&&process.env.BS10_T)||0.03),
  s2pow:0.2};
function bsV10(){ return ENGINE_V>=10 }
function bsSig(){ return (typeof attrScale==="function"?attrScale().s:5.8)*(typeof ATTR_SPREAD!=="undefined"?ATTR_SPREAD:0.8) }
const bsHalfVar=m=>0.5*m*m*bsSig()*bsSig();
// speed and arm from the attributes: about as many burners, fast, average and slow runners (and strong, average and
// weak arms) as the name hash gave, by where his attribute stands in the league
function bsZ(v){ const S=typeof attrScale==="function"?attrScale():{m:59,s:5.8}; return (v-S.m)/Math.sqrt(S.s*S.s+bsSig()*bsSig()) }
function bsSpeedAt(v){ const z=bsZ(v); return z>1.645?BS_SPEED6[0]:z>0.674?BS_SPEED6[1]:z<-0.842?BS_SPEED6[19]:BS_SPEED6[10] }
function bsArmAt(v){ const z=bsZ(v); return z>0.524?BS_ARM[0]:z<-0.842?BS_ARM[9]:BS_ARM[5] }
const BS6_RP=+((typeof process!=="undefined"&&process.env&&process.env.BS6_RP)||50);
function bsTired(){ return ENGINE_V>=3?BS_TIRED3:BS.tired }
function bsPen(){ return bsV5()?BS5.pen:ENGINE_V>=3?BS_PEN3:BS.pen }
const BS={
  // a plate appearance between average sides: strikeout, walk, hit by pitch, single, double, triple, home run (the rest an out in play)
  k:0.224, bb:0.080, hbp:0.011, s1:0.134, s2:0.043, s3:0.004, hr:0.028,   // round 57: 0.136 and 0.029 ran 4.52-4.57 a side in the real app
  edge:+((typeof process!=="undefined"&&process.env&&process.env.BS_E)||0.00031),   // per Elo point of gap: the log-odds a hit or walk shifts
  dp:0.12,            // an out in play with a man on first and fewer than two out: a double play this often
  sf:0.32,            // with a man on third and fewer than two out: a fly ball deep enough this often
  adv2:0.6,           // a single scores the runner from second this often; a double the runner from first
  tired:0.06,         // the starter, each batter past his eighteenth: this much worse
  stamina:[22,30],    // batters a starter faces before he's done, between these
  pen:-0.02,          // the bullpen against the side's own starter (a shade worse, the closer apart)
  closer:0.05,        // the closer, the ninth with a lead of one to three
  form:0.12,          // tonight's spread of a starter's form
  read:{right:-0.12, wrong:0.04},   // their hitters against your pitching plan
  steal:0.74, stealTry:0.035,       // a steal of second succeeds this often; the computer tries this often a chance
  pinch:0.1,          // a pinch hitter off the bench against a weak bat: this much better
  hfa:0.0             // home edge comes in the Elo
};
const APPROACH={
  pull:   {l:"Pull hitters, sitting on the fastball", counter:"away"},
  patient:{l:"Patient: working counts, taking walks", counter:"zone"},
  contact:{l:"Contact: putting everything in play", counter:"spin"}
};
const APPROACH_KEYS=["pull","patient","contact"];
const ANSWERS={
  away:{beats:"pull",   l:"Pitch them away: soft stuff on the outer edge", d:"Live on the outside corner and make them go the other way"},
  zone:{beats:"patient",l:"Attack the zone: strike one, every hitter",     d:"Get ahead early; no free passes to hitters who wait"},
  spin:{beats:"contact",l:"Change speeds: spin and offspeed",              d:"Breaking balls and changeups to miss barrels and get weak contact"}
};
/* the evidence each approach leaves: the pulled share of balls in play, pitches an at-bat, swings and misses an
   at-bat (round 58: the third was the strikeout rate, which the approach never moved, so only two tells carried
   anything and the read after three innings was right 53% of the time, below the scouting report's 69%: "a coin
   flip", Muse). The plate appearance itself is unchanged; these are what your hitting coach counts. */
const BS_TELL={pull:[0.66,3.7,1.0],patient:[0.44,4.5,0.85],contact:[0.42,3.6,0.45]}, BS_TELL_SD={pit:1.1,wh:0.9};
const BS_TELL_AVG=[0,1,2].map(i=>APPROACH_KEYS.reduce((s,k)=>s+BS_TELL[k][i],0)/3);
/* the likeliest approach given the evidence (each approach's chance of producing exactly this) */
function bsRead(T){ if(!T||!T.n||!T.pa)return null; const L={};
  APPROACH_KEYS.forEach(k=>{ const t=BS_TELL[k], q=t[0];
    let ll=T.pull*Math.log(q)+(T.bip-T.pull)*Math.log(1-q);
    ll-=Math.pow(T.pit-T.pa*t[1],2)/(2*T.pa*BS_TELL_SD.pit*BS_TELL_SD.pit);
    ll-=Math.pow((T.wh||0)-T.pa*t[2],2)/(2*T.pa*BS_TELL_SD.wh*BS_TELL_SD.wh); L[k]=ll });
  return APPROACH_KEYS.reduce((a,k)=>L[k]>L[a]?k:a,"pull") }
const ASSIST=["normal","Leave it to your assistant"];
function scoutReport(fav,seed){
  const r=mulberry32(seed>>>0), rep={pull:0,patient:0,contact:0};
  for(let i=0;i<6;i++){ rep[r()<0.55?fav:APPROACH_KEYS[Math.floor(r()*3)]]++ } return rep }
function prepCall(rep){
  return {k:"prep",h:"Before the first pitch: the scouting report",q:"Their last six games, by how their hitters went at it. Set the plan, or wait and see?",
    opts:Object.keys(ANSWERS).map(a=>[a,ANSWERS[a].l]).concat([["normal","Wait and see: leave it to your assistant"]]),report:Object.assign({},rep)};
}
function readCall(T,cur){
  return {k:"read",h:"After three innings",q:"How are their hitters going at it? Pick the plan.",
    opts:(cur&&ANSWERS[cur]?[["keep","Keep your plan: "+ANSWERS[cur].l]]:[]).concat(Object.keys(ANSWERS).filter(a=>a!==cur).map(a=>[a,ANSWERS[a].l])).concat([ASSIST]),
    tell:Object.assign({},T), best:bsRead(T)};
}
function pullCall(inn,lead,P,on){
  return {k:"pull",inn:inn,h:`${ordw(inn)} inning, ${lead>0?"up "+lead:lead<0?"down "+(-lead):"tied"}`,
    q:`${P.n||"Your starter"} has faced ${P.bf} batters${P.ra?` and given up ${nOf(P.ra,"run")}`:""}.${on?" "+on:""} Go to the bullpen?`,
    opts:[["pen","Go to the bullpen"],["stay","Leave him in"],ASSIST], bf:P.bf, ra:P.ra, sp:P.n||null};
}
function pinchCall(inn,lead,who,bench,on){
  return {k:"pinch",inn:inn,h:`${ordw(inn)} inning, ${lead>0?"up "+lead:lead<0?"down "+(-lead):"tied"}`,
    q:`${on}. ${who||"Your number nine"} is up. Pinch-hit${bench?" with "+bench:""}?`,
    opts:[["pinch",`Pinch-hit${bench?": "+bench.split(" ").slice(-1)[0]:""}`],["let","Let him hit"],ASSIST]};
}
/* engine 26: the bullpen calls name the men (who, not whether) */
const bsScoreH=(inn,lead)=>`${ordw(inn)} inning, ${lead>0?"up "+lead:lead<0?"down "+(-lead):"tied"}`;
function pullCall26(inn,lead,P,R,on){
  return {k:"pull",inn:inn,h:bsScoreH(inn,lead),
    q:`${P.n||"Your starter"} has thrown ${P.np} pitches to ${P.bf} batters${P.ra?` and given up ${nOf(P.ra,"run")}`:""}.${on?" "+on:""} Go to the bullpen?`,
    opts:R.map(penOpt26).concat([["stay","Leave him in"],ASSIST]), bf:P.bf, ra:P.ra, np:P.np, sp:P.n||null, tto:Math.floor(P.bf/9)+1, pen:R.map(penInfo26), v26:1};
}
function penCall26(inn,lead,C,R,on){
  return {k:"pen",inn:inn,h:bsScoreH(inn,lead)+(on?"":""),
    q:`${C.n} has thrown ${C.np} pitches${C.outs?`, ${nOf(C.outs,"out")}`:""}${C.ra?`, ${nOf(C.ra,"run")}`:""}. ${on} Make a change?`,
    opts:[["keep",`Leave ${C.n} in`]].concat(R.map(penOpt26)).concat([ASSIST]), cur:penInfo26(C), pen:R.map(penInfo26), v26:1};
}
function penuCall(inn,lead,X,R,want){
  return {k:"penu",inn:inn,h:bsScoreH(inn,lead),
    q:`You called for the bullpen. ${X.cur?X.cur.n+" has thrown "+X.cur.np+" pitches":(X.sp.n||"Your starter")+" has thrown "+X.sp.np+" pitches"}. Who comes in?`,
    opts:R.map(penOpt26).concat([["keep","Not yet"]]), cur:X.cur?penInfo26(X.cur):null, sp:X.cur?null:X.sp.n, np:X.cur?X.cur.np:X.sp.np, pen:R.map(penInfo26), want:want?want.n:null, v26:1};
}
function penOpt26(c){ return ["pen:"+c.n,`${c.n}: ${bsPenWords(c)}`] }
function penInfo26(c){ return {n:c.n,r:c.r,th:c.th,role:c.role,py:c.py||0,p2:c.p2||0,np:c.np,bf:c.bf,ra:c.ra} }
function pinchCall26(inn,lead,up,B,on,pn,th){
  return {k:"pinch",inn:inn,h:bsScoreH(inn,lead),
    q:`${on}. ${up||"Your hitter"} is up against ${pn||"their pitcher"}, a ${th==="L"?"left":"right"}-hander. Pinch-hit?`,
    opts:B.map(x=>["ph:"+x.n,`Pinch-hit with ${x.n} (${bsBatsWords(bsBats(x.n))})`]).concat([["let","Let him hit"],ASSIST]), pn:pn, th:th, v26:1};
}
function ibbCall(inn,lead,up,next,on){
  return {k:"ibb",inn:inn,h:bsScoreH(inn,lead),
    q:`${on}. ${up||"Their hitter"} is up, ${next||"a weaker hitter"} on deck. Walk him intentionally?`,
    opts:[["walk",`Walk ${up||"him"}`],["pitch","Pitch to him"],ASSIST], up:up, next:next};
}
function stealCall(inn,lead,runner,outs){
  return {k:"steal",inn:inn,h:`${ordw(inn)} inning, ${lead>0?"up "+lead:lead<0?"down "+(-lead):"tied"}`,
    q:`${runner||"Your runner"} on first, ${outs===0?"nobody":"one"} out. Send him?`,
    opts:[["send","Send him"],["hold","Hold him"],ASSIST]};
}
/* round 112 (engine 26): one plate appearance's pitches, from its own hash and its result (no game dice): the full
   match draws them pitch by pitch (72_highlights), and from engine 26 the engine counts them, so a pitcher's count on
   the screen is the count he tires by. A strikeout ends on strike three, a walk on ball four, a ball in play on the pitch
   the count leaves (MLB: about 3.9 pitches a plate appearance). */
function bsPitchSeq(q,z){ const r=mulberry32((z^0x9E3779B9)>>>0), o=q.o, out=[]; let b=0,s=0;
  const strike=()=>{ const x=r(); if(s===2)return x<0.55?"F":x<0.8?"C":"W"; return x<0.36?"C":x<0.62?"W":"F" };   // called, swinging, foul (a foul can't be strike three)
  const add=c=>{ out.push(c); if(c==="B")b++; else if(c==="F"){ if(s<2)s++ } else s++ };
  const pre=(stopP,maxB,maxS)=>{ for(let k=0;k<12;k++){ if(r()<stopP&&k>0)break; const ball=r()<(b<maxB?0.4:0); if(ball)add("B"); else { const c=strike(); if((c==="C"||c==="W")&&s>=maxS){ add("F") } else add(c) } } };
  if(o==="k"){ for(let k=0;k<14&&s<2;k++){ if(b<3&&r()<0.36)add("B"); else { const c=strike(); add(c) } } for(let k=0;k<3&&r()<0.22;k++){ if(b<3&&r()<0.4)add("B"); else add("F") } out.push(r()<0.25?"KC":"KS") }
  else if(o==="bb"){ for(let k=0;k<14&&b<3;k++){ if(r()<0.62||s>=2&&r()<0.8)add("B"); else { const c=strike(); if(s>=2&&c!=="F")add("F"); else add(c) } } out.push("B4") }
  else if(o==="hbp"){ pre(0.5,3,2); out.push("HBP") }
  else { pre(0.4,3,2); out.push("X") }
  return out }
function ordw(n){ return ["","1st","2nd","3rd","4th","5th","6th","7th","8th","9th"][n]||n+"th" }

/* ============ round 112 (engine 26): the dugout ============
   (design review, Nov 2026: baseball asked two questions a game and nobody managed a bullpen, wrote a lineup or
   pinch-hit for the platoon.) What a real manager decides, played by the engine:
   - Handedness. Every player bats left, right or both and throws left or right (from his name, so no dice move:
     about a third of hitters bat left and one in nine switch-hit; about 28% of plate appearances come against a
     left-hander, FanGraphs). A batter facing a pitcher of the other hand does better: the gap is FanGraphs' league
     platoon split (2012: left-handed batters .332 wOBA against right-handers, .291 against left-handers; right-handed
     batters .337 and .313; switch-hitters about even; blogs.fangraphs.com/basic-hitter-platoon-splits-2002-2012),
     centred on each batter's usual mix of pitchers, so his rating is still what he does over a season.
   - A named bullpen of nine: the closer, the set-up man and the long man from the roster, and six more arms (a
     second set-up man, the lefty specialist, three middle relievers and a mop-up man: bsCorps; with eight the
     busiest made 90-95 appearances, where MLB's busiest make about 80, clubs shuttling arms from the minors). Each pitches by his
     own rating. Rest carries between days: who pitched yesterday and how much (MLB relievers average 19 pitches an
     outing, baseball-reference 2024), and nobody goes three days running without paying for it (fastballs are about
     half a mile an hour slower on back-to-back days and more than two slower on a third straight day:
     tht.fangraphs.com/do-relief-pitchers-suffer-from-pitching-back-to-back-days).
   - A starter's pitches are counted (the full match's own pitches: bsPitchSeq) and he tires by them, and hitters do
     better each time through the order (MLB starters 2016-25: .713 OPS the first time, .747 the second, .780 the
     third; mlb.com/glossary/miscellaneous/third-time-through-the-order-penalty).
   - The manager's calls are the real ones: who comes in (not only whether), the pinch hitter (which one, by the
     platoon), the intentional walk. The computer and your assistant manage by the same rules (bsPenRank, penPlan). */
const BS_V26=26;   // the engine version these arrive with (core 20 ENGINE_NOW)
function bsV26(){ return typeof ENGINE_V!=="undefined"&&ENGINE_V>=BS_V26 }
const BS26_ENV=(k,d)=>{ const v=typeof process!=="undefined"&&process.env&&process.env[k]; return v!=null&&v!==""?+v:d };
const BS26={
  // the platoon gap (advantage less disadvantage) in the engine's log-odds, by the batter's hand; pL: the share of
  // plate appearances against a left-hander
  platL:BS26_ENV("BS26_PL",0.068), platR:BS26_ENV("BS26_PR",0.028), pL:0.30,
  // the starter: times through the order (each time from the second), tiring past p0 pitches (by his Stamina), and sp0
  // to hold the league's starters where they were
  tto:BS26_ENV("BS26_TTO",0.021), p0:BS26_ENV("BS26_P0",80), fat:BS26_ENV("BS26_FAT",0.004), sp0:BS26_ENV("BS26_SP0",-0.002),
  pPA:BS26_ENV("BS26_PPA",4.12),   // his limit in pitches, from his stamina in batters (set so starters average 86 pitches, AL 2024)
  // a reliever: rp0 at the league's usual reliever rating (BS6_RP), rq a point of rating
  rp0:BS26_ENV("BS26_RP0",-0.05), rq:BS26_ENV("BS26_RQ",0.008),
  b2b:0.02, b3:0.08, heavy:25, heavyPen:0.04,   // pitched yesterday; the third day running; a heavy day yesterday (25+ pitches)
  xPt:BS26_ENV("BS26_XPT",0.012),   // a rating point of hitting, in the platoon's log-odds (for choosing a pinch hitter)
  phMin:3, ibbGap:6,
  rest:BS26_ENV("BS26_REST",7), restC:BS26_ENV("BS26_RESTC",17), platMin:BS26_ENV("BS26_PLATMIN",2)   // the lineup card (bsLineup26)
};
const BS26_ROLE={cl:"closer",su:"set-up",su2:"set-up",lefty:"lefty specialist",mid:"middle relief",lr:"long relief",mop:"long relief"};
/* the hands, from the name (a hash, the same all career) */
// (kept by name: a replayed game asks them every plate appearance)
const BS_HANDK={b:new Map(),t:new Map()};
function bsBats(nm){ if(!nm)return "R"; let x=BS_HANDK.b.get(nm); if(x===undefined){ const h=strHash("bats|"+nm)%100; x=h<33?"L":h<44?"S":"R"; BS_HANDK.b.set(nm,x) } return x }
function bsThrows(nm){ if(!nm)return "R"; let x=BS_HANDK.t.get(nm); if(x===undefined){ x=strHash("throws|"+nm)%100<28?"L":"R"; BS_HANDK.t.set(nm,x) } return x }
const BS_HAND={L:"left",R:"right",S:"both sides"};
function bsBatsWords(b){ return b==="L"?"bats left":b==="S"?"a switch-hitter":"bats right" }
/* the batter's platoon term against a pitcher's hand (positive helps him); a switch-hitter always has the platoon side */
function bsPlat(b,t){ if(b==="S")return 0; const pL=BS26.pL;
  if(b==="L")return t==="R"?BS26.platL*pL:-BS26.platL*(1-pL);
  return t==="L"?BS26.platR*(1-pL):-BS26.platR*pL }
/* the six arms beyond the roster's three: a second set-up man, the lefty specialist, three middle relievers (one of them
   the arm a club shuttles up and down from its farm team) and the mop-up man. Their names and ratings come from the club and the years (a hash: an arm stays three seasons or so), the
   ratings about the league's usual reliever (BS6_RP), so they add nothing to any club on average */
const BS26_CORPS=[["su2","R",3],["lefty","L",-1],["mid","R",0],["mid","L",-2],["mop","R",-5],["mid","R",-3]];
function bsCorps(t,year,taken){ const out=[], seen=new Set(taken||[]);
  BS26_CORPS.forEach(([role,th,off],k)=>{ const r=mulberry32(strHash("corps|"+t+"|"+k+"|"+Math.floor((year+k)/3))>>>0); let n=null;
    for(let j=0;j<8&&(!n||seen.has(n));j++){ const f=PNAMES_F[Math.floor(r()*PNAMES_F.length)], l=PNAMES_L[Math.floor(r()*PNAMES_L.length)]; n=f+" "+(typeof wideLast==="function"?wideLast(f,l,PNAMES_L):l) }
    seen.add(n); out.push({n:n, r:Math.round(BS6_RP+off+(r()+r()+r()-1.5)*4), th:th, role:role}) });
  return out }
/* the season's pitching log, for rest between days: {team: {name: [[day, pitches], ...]}} (kept on the season, not saved:
   a load replays the season and keeps it again) */
function bsUse(sea){ if(!sea)return null; if(!sea._bsUse||sea._bsUse.y!==sea.year)Object.defineProperty(sea,"_bsUse",{value:{y:sea.year,t:{}},writable:true,configurable:true,enumerable:false}); return sea._bsUse }
function bsNoteUse(sea,t,B,step){ const U=bsUse(sea); if(!U||!B||!B.pit)return; const T=U.t[t]=U.t[t]||{}, D=U.d=U.d||{}, k=t+"|"+step;
  if(D[k])return; D[k]=1;   // once a game, however often the season credits it
  const S=(U.s=U.s||{})[t]=U.s[t]||{}, dec=B.dec||{};
  Object.keys(B.pit).forEach(nm=>{ const p=B.pit[nm]; if(!p||nm==="bullpen"||nm==="closer")return;
    if(p.np>0){ const L=T[nm]=T[nm]||[]; L.push([step,p.np]); if(L.length>3)L.shift() }
    if(nm===B.sp)return;   // the season's relief lines (the bullpen card): every reliever, on the roster or not
    const s=S[nm]=S[nm]||{g:0,outs:0,er:0,k:0,bb:0,np:0,w:0,l:0,sv:0,hld:0,bs:0};
    s.g++; s.outs+=p.outs||0; s.er+=p.er||0; s.k+=p.k||0; s.bb+=p.bb||0; s.np+=p.np||0;
    if(dec.w===nm)s.w++; if(dec.l===nm)s.l++; if(dec.sv===nm)s.sv++; if((dec.hld||[]).indexOf(nm)>=0)s.hld++; if((dec.bs||[]).indexOf(nm)>=0)s.bs++ }) }
/* a team's relievers this season, by name: {g, outs, er, k, bb, np, w, l, sv, hld, bs} */
function bsRelief(t){ const U=typeof SEA!=="undefined"&&SEA?bsUse(SEA):null; return U&&U.s&&U.s[t]||{} }
function bsRestOf(sea,t,nm,step){ const U=bsUse(sea), L=U&&U.t[t]&&U.t[t][nm]; let py=0,p2=0; (L||[]).forEach(([d,n])=>{ if(d===step-1)py+=n; else if(d===step-2)p2+=n }); return [py,p2] }
/* the bullpen today: [name, rating, throws left (1/0), role, pitches yesterday, pitches the day before] */
function bsPen26(t,step){ try{ if(typeof SEA==="undefined"||!SEA||!SEA.roster||!SEA.roster[t])return null; const R=SEA.roster[t], H=hurtSet(t), out=[];
    const cl=BS_CL, su=BK(BS_CL), lr=BK(BS_SP[2]), add=(p,role)=>{ if(p)out.push({n:p.n,r:p.r,th:bsThrows(p.n),role:role}) };
    const clOk=R[cl]&&!H.has(cl), suOk=R[su]&&!H.has(su);
    if(clOk){ add(R[cl],"cl"); if(suOk)add(R[su],"su") } else if(suOk)add(R[su],"cl");   // a hurt closer's set-up man closes
    if(R[lr]&&!H.has(lr))add(R[lr],"lr");
    bsCorps(t,SEA.year,R.filter(Boolean).map(p=>p.n)).forEach(c=>out.push(c));
    return out.map(c=>{ const [py,p2]=bsRestOf(SEA,t,c.n,step); return [c.n,c.r,c.th==="L"?1:0,c.role,py,p2] }) }catch(e){ return null } }
/* the bench today: the four best healthy backups not in the lineup (the backup catcher stays put) */
function bsBench26(t,lu){ try{ const R=SEA.roster[t], H=hurtSet(t), inLu=new Set(lu||[]), B=[], C=BS_HIT[0];
    BS_HIT.forEach(i=>[i,BK(i)].forEach(j=>{ const p=R[j]; if(!p||H.has(j)||inLu.has(p.n))return; if(i===C&&!(j===C&&!inLu.has(R[BK(C)]&&R[BK(C)].n)))return; B.push(p) }));
    return B.sort((a,b)=>b.r-a.r).slice(0,4).map(p=>p.n) }catch(e){ return [] } }
/* engine 26: the lineup card. The nine by position as before, with two of a manager's daily choices:
   - a day off: a regular sits about one day in fourteen, a catcher about one in six (MLB regulars start about 150 of
     162 games, catchers 120-130). Resting buys almost nothing at the plate (a hitter playing five days in seven
     against seven loses about 3 points of OBP: baseballprospectus.com/news/article/21090), so it's a schedule, not a
     tonic: by a hash of the day, no draws.
   - the platoon: a backup who bats from the other side starts against a starter of the hand the regular hits worst,
     when he's the better bat against him by BS26.platMin points (the same worth the pinch hitter is weighed by).
   The order is by ability against today's starter (engine 5's order: the third best leads off, the best bats second;
   the best orders gain about a win a season over a typical one, blogs.fangraphs.com/how-significant-is-batting-order,
   so the order is the book's and isn't asked). Returns {lu, c: the catcher, why: [[name in, name out, reason]]}. */
function bsLineup26(t,step,opp){ try{ const R=SEA.roster[t], H=hurtSet(t), y=SEA.year, sp=opp?spCtx(opp,step):null, th=sp?bsThrows(sp.n):"R", why=[];
    const v=p=>p.r+bsPlat(bsBats(p.n),th)/BS26.xPt;
    const P=BS_HIT.map((i,k)=>{ const reg=R[i], bk=R[BK(i)], regOk=reg&&!H.has(i), bkOk=bk&&!H.has(BK(i));
      if(!regOk)return bkOk?bk:reg||null;
      if(bkOk){ const rest=strHash("rest|"+t+"|"+i+"|"+y+"|"+step)%100<(i===BS_HIT[0]?BS26.restC:k===8?0:BS26.rest);
        if(rest){ why.push([bk.n,reg.n,"rest"]); return bk }
        if(i!==BS_HIT[0]&&bsBats(bk.n)!==bsBats(reg.n)&&v(bk)-v(reg)>=BS26.platMin){ why.push([bk.n,reg.n,"platoon"]); return bk } }
      return reg });
    const c=P[0]?P[0].n:null, rk=P.map((p,k)=>({p:p,k:k,v:p?v(p):0})).sort((a,b)=>(b.v-a.v)||(a.k-b.k));
    return {lu:BS_ORDER5.map(j=>rk[j]&&rk[j].p?rk[j].p.n:null), c:c, why:why, th:th} }catch(e){ return null } }
/* the relievers in order for a moment (sit: save, tie, eighth, high, early, blowout, other; lefties: the next three
   batters are mostly left-handed), the rested first */
const BS26_ORDER={save:["cl","su","su2","mid","lefty","lr","mop"], tie:["cl","su","su2","mid","lefty","lr","mop"], eighth:["su","su2","mid","lefty","cl","lr","mop"],
  high:["su2","su","mid","lefty","lr","mop","cl"], early:["lr","mop","mid","lefty","su2","su","cl"], blow:["mop","lr","mid","lefty","su2","su","cl"], other:["mid","lefty","mop","lr","su2","su","cl"]};
function bsPenFat(c){ return (c.py>0&&c.p2>0?BS26.b3:c.py>0?BS26.b2b:0)+(c.py>=BS26.heavy?BS26.heavyPen:0) }
function bsPenOk(c){ return !(c.py>0&&c.p2>0)&&c.py<BS26.heavy }
function bsPenRank(pen,used,sit,lefties){ const ord=BS26_ORDER[sit]||BS26_ORDER.other, o=lefties&&sit!=="save"&&sit!=="tie"?["lefty"].concat(ord.filter(r=>r!=="lefty")):ord;
  // in the low-leverage innings a man who pitched yesterday waits behind the next role (a long season: MLB's busiest
  // relievers make 75-80 appearances)
  const lo=sit==="early"||sit==="blow"||sit==="other", K=[], N=[];
  for(const c of pen){ if(used[c.n])continue; const x={c:c,k:o.indexOf(c.role)*100-c.r+(lo&&c.py>0?150:0)}; if(bsPenOk(c))K.push(x); else { x.f=bsPenFat(c); N.push(x) } }
  K.sort((a,b)=>a.k-b.k); N.sort((a,b)=>a.f-b.f||a.k-b.k);
  return K.concat(N).map(x=>x.c) }
function bsPenWords(c){ return `${BS26_ROLE[c.role]||"relief"}, ${c.th==="L"?"left":"right"}-handed${c.py>0&&c.p2>0?", third day running":c.py>=BS26.heavy?`, ${c.py} pitches yesterday`:c.py>0?", pitched yesterday":""}` }

function makeLiveGame(rng, eloH, eloA, planH, planA, humans, playoff, ctx){
  ctx=ctx||{}; const fav=ctx.fav||{};
  // engine 10: a player's attributes from the game's context (by side and name), and his rating
  const AT=bsV10()&&ctx.at?ctx.at:null, atMemo={home:{},away:{}};
  const atOf=(side,nm)=>{ if(!AT||!AT[side]||!nm)return null; const M=atMemo[side]; if(M[nm]!==undefined)return M[nm]; const v=AT[side][nm];
    if(!v)return (M[nm]=null); if(!Array.isArray(v))return (M[nm]=v); const o={}; attrKeys(v[0]).forEach((k,j)=>o[k]=v[j+1]); return (M[nm]=o) };
  const rOf=(side,nm)=>ctx.rate&&ctx.rate[side]&&nm?ctx.rate[side][nm]:null;
  const spTire=sd=>{ const n=ctx.sp&&ctx.sp[sd]&&ctx.sp[sd].n, a=atOf(sd,n), r=rOf(sd,n); return a&&a.sta!=null&&r!=null?Math.exp(-BS10.sta*(a.sta-r)-bsHalfVar(BS10.sta)):1 };   // engine 10: how fast he tires
  if(typeof humans!=="object"||humans===null)humans={home:!!humans, away:!humans};
  // engine 25 (review round): the gap counts LEAGUE.tuning.gap25 of itself (core gapScale25): clubs were spread wider than
  // MLB's (wins sd 14.6-15.2, the best record 111 on average; MLB ~13 and ~104) and favourites won 59% where 57% was shown
  const gap=(eloH-eloA)*(typeof GAP_SCALE!=="undefined"?GAP_SCALE:1)*gapScale25();
  const other=s=>s==="home"?"away":"home";
  const SPc=(ctx.sp)||{};
  const side0=sd=>({app:null, ans:null, prepd:false, sp:{n:(SPc[sd]&&SPc[sd].n)||null, q:(SPc[sd]&&SPc[sd].q)||0, form:rng.gauss(0,BS.form), bf:0, ra:0,
      stam:BS.stamina[0]+rng.int(BS.stamina[1]-BS.stamina[0]+1)-(bsV6()?BS6.stamCut:0), tm:spTire(sd)}, pen:false, closer:false, bat:0,
    tell:{pull:0,bip:0,pit:0,pa:0,k:0,wh:0,n:0}});
  const st={h:0,a:0,drives:[],seg:0,humans:humans,lines:{h:blankTeamLine(),a:blankTeamLine()},
    mode:{home:planH,away:planA}, late:{}, asked:{}, queue:[], ask:null, ot:0, done:false, playoff:!!playoff, S:{home:side0("home"),away:side0("away")}};
  st.gap=gap;
  const pickApp=side=>{ if(fav[side]&&rng.r()<0.6)return fav[side]; return APPROACH_KEYS[rng.int(3)] };
  st.S.home.app=pickApp("home"); st.S.away.app=pickApp("away");
  // engine 26: the named bullpen, its rest, and the starter's pitch count (no draws: everything below is read off the game)
  if(bsV26()&&ctx.pen26)["home","away"].forEach(sd=>{ const X=st.S[sd], L=ctx.pen26[sd]; if(!L)return;
    X.v26=true; X.pen26=L.map(a=>({n:a[0],r:a[1],th:a[2]?"L":"R",role:a[3],py:a[4]||0,p2:a[5]||0})); X.used={}; X.cur=null; X.bfAll=0; X.holdTo=0; X.want=false;
    X.th={}; X.pen26.forEach(c=>{ X.th[c.n]=c.th }); if(X.sp.n)X.th[X.sp.n]=bsThrows(X.sp.n);
    X.sp.np=0; X.sp.stamP=Math.round(X.sp.stam*BS26.pPA) });
  // who comes in late, and the intentional walk, are asked only where a choice gains on your assistant (core 94's gate,
  // as the starter's pull is); the bullpen you call for yourself (penu) is always asked
  if(bsV26()&&typeof SPREAD_KINDS!=="undefined"){ SPREAD_KINDS.pen=1; SPREAD_KINDS.ibb=1 }
  st.k26=0;   // the at-bat's place in the inning's log (the full match's index: its pitches are drawn from it)
  const lead=side=>side==="home"?st.h-st.a:st.a-st.h;
  const queueCall=(side,dp)=>{ const key=dp.k+(dp.h||"")+side; if(!humans[side]||st.asked[key])return false;
    st.asked[key]=true; st.queue.push({side:side,dp:dp}); if(dp.k!=="prep"&&dp.k!=="read"&&inn()>=8)(st.lateGot=st.lateGot||{})[side]=true; return true };
  const readIt=(side,p)=>{ if(rng.r()<p){ st.S[side].ans=APPROACH[st.S[other(side)].app].counter; st.S[side].prepd=false } };
  // the pitcher's edge for the side in the field: starter (form, fatigue, his place in the rotation) or the bullpen
  // engine 6: who's pitching out of the bullpen, by name (the long man early, the set-up man late), and his edge
  const relOuts=(fs,nm)=>{ const B=st.box&&st.box[fs]; return B&&B.pit[nm]?B.pit[nm].outs:0 };
  const relief=fs=>{ const X=st.S[fs], R=ctx&&ctx.pen&&ctx.pen[fs]; if(!R)return {n:"bullpen",q:0};
    if(R.setup&&(X.setupClose||(inn()>=8&&relOuts(fs,R.setup.n)<3)))return (X.rel=R.setup.n,R.setup);
    if(R.long&&relOuts(fs,R.long.n)<6&&(X.rel===R.long.n||(!X.rel&&inn()<=6)))return (X.rel=R.long.n,R.long);
    X.rel="bullpen"; return {n:"bullpen",q:0} };
  let pNow=null;   // engine 10: who is pitching this plate appearance (set by pitEdge)
  // engine 26: a reliever by his own rating and rest, and how many pitches he has thrown today; the starter by times
  // through the order and his pitch count
  const pitEdge26=X=>{ const C=X.cur; if(C){ pNow=C.n; const long=C.role==="lr"||C.role==="mop";
      return BS26.rp0+(C.r-BS6_RP)*BS26.rq-C.fat-Math.max(0,C.np-(long?55:30))*BS26.fat }
    const P=X.sp; pNow=P.n; return P.q+P.form+BS26.sp0-BS26.tto*Math.min(3,Math.floor(P.bf/9))-Math.max(0,P.np-BS26.p0)*BS26.fat*(P.tm||1) };
  const pitEdge=fs=>{ const X=st.S[fs]; pNow=null; if(X.v26)return pitEdge26(X); if(X.closer)return BS.closer; if(X.pen){ const R=bsV6()?relief(fs):null; if(R&&R.n!=="bullpen")pNow=R.n; return bsPen()+(R?R.q:0) }
    pNow=X.sp.n;
    const P=X.sp; return P.q+P.form-Math.max(0,P.bf-18)*bsTired()*(P.tm||1) };
  // the plan's effect on their bats: right read, wrong read
  const readEdge=(bat,fs)=>{ const A=st.S[bat].app, X=st.S[fs]; if(!X.ans)return 0; return ANSWERS[X.ans].beats===A?BS.read.right:(APPROACH[A].counter===X.ans?0:BS.read.wrong) };
  const modeMul=sd=>{ const m=st.mode[sd]; return m==="aggressive"?{hr:1.25,k:1.12,s1:0.94,bb:1}:m==="safe"?{hr:0.82,k:0.88,s1:1.06,bb:1.04}:{hr:1,k:1,s1:1,bb:1} };
  /* one plate appearance: the batting side (bat), the side in the field (fs) */
  let paNm=null;   // engine 26: the batter, for the platoon
  const thOf=(fs,n)=>{ const X=st.S[fs]; return X.th&&X.th[n]||bsThrows(n) };
  function pa(bat,fs,extra,hx){
    const e=(bat==="home"?gap:-gap)*BS.edge*100/100, pe=pitEdge(fs), re=readEdge(bat,fs), M=modeMul(bat);
    const x=e-pe+re+(extra||0)+(st.S[fs].v26?bsPlat(bsBats(paNm),thOf(fs,pNow)):0)+(bsV5()?BS5.x:0)+(bsV6()?BS6.x:0), up=Math.exp(x*2.2), dn=Math.exp(-x*1.6);
    const p={k:BS.k*dn*M.k, bb:BS.bb*up*M.bb, hbp:BS.hbp, s1:BS.s1*up*M.s1, s2:BS.s2*up, s3:BS.s3, hr:BS.hr*up*M.hr};
    // engine 17 (round 94): the plan your lineup suits, through its own outcomes (one-sided: twice the gap's log-odds a point)
    if(planAmpV()){ p.s1*=BS17.g; p.s2*=BS17.g; p.s3*=BS17.g; p.hr*=BS17.g; p.bb*=BS17.g }
    if(ctx.lz&&planAmpV()){ const pl=st.mode[bat], E=ctx.spz&&humans[bat]&&planVsV()?planVsTot(bsFitZ(ctx.lz[bat],pl),-bsVsZ(ctx.spz[fs],pl),BS17.cap):bsFitZ(ctx.lz[bat],pl), xe=2*E*BS.edge,   /* engine 23: a person's plan against the day's starter */ w=BS17.w, Ef=ctx.spz&&humans[fs]&&planVsV()?planVsTot(bsFitZ(ctx.lz[fs],st.mode[fs]),-bsVsZ(ctx.spz[bat],st.mode[fs]),BS17.cap):bsFitZ(ctx.lz[fs],st.mode[fs]),
        xg=(1-w)*BS17.u*((1-BS17.d)*xe-BS17.d*2*Ef*BS.edge);
      if(xg){ p.s1*=Math.exp(xg*2.2); p.s2*=Math.exp(xg*2.2); p.hr*=Math.exp(xg*2.2); p.bb*=Math.exp(xg*2.2); p.k*=Math.exp(-xg*1.6) }
      if(E&&w&&pl==="aggressive")p.hr*=Math.exp(w*BS17.ga*2.2*xe); else if(E&&w&&pl==="safe"){ p.s1*=Math.exp(w*BS17.gs*2.2*xe); p.bb*=Math.exp(w*BS17.gs*2.2*xe); p.k*=Math.exp(-w*BS17.gs*1.6*xe) } }
    // engine 5: the hitter's own edge (hx) shows most in his power and his eye, least in his singles (a star's .385 was all singles)
    if(hx&&typeof hx==="object"){ const H5=BS5_HX, h=BS5.hit, q=BS10.s2pow;   // engine 10: by attribute, each term recentred for its spread
      p.hr*=Math.exp(hx.pow*H5.hr-bsHalfVar(H5.hr*h)); p.s2*=Math.exp((q*hx.pow+(1-q)*hx.con)*H5.s2-bsHalfVar(H5.s2*h)*(q*q+(1-q)*(1-q)));
      p.s1*=Math.exp(hx.con*H5.s1-bsHalfVar(H5.s1*h)); p.bb*=Math.exp(hx.eye*H5.bb-bsHalfVar(H5.bb*h)); p.k*=Math.exp(-(hx.con+hx.eye)*0.5*H5.k-bsHalfVar(H5.k*h)*0.5) }
    else if(hx){ p.hr*=Math.exp(hx*BS5_HX.hr); p.bb*=Math.exp(hx*BS5_HX.bb); p.s2*=Math.exp(hx*BS5_HX.s2); p.s1*=Math.exp(hx*BS5_HX.s1); p.k*=Math.exp(-hx*BS5_HX.k) }
    if(AT){ const a=atOf(fs,pNow), r=rOf(fs,pNow);   // the pitcher's shape: against his own rating
      if(a&&r!=null&&a.stf!=null){ const sx=(a.stf-r)*BS10.stf, cx=(a.ctl-r)*BS10.ctl, vs=bsHalfVar(BS10.stf), vc=bsHalfVar(BS10.ctl);
        p.k*=Math.exp(sx-vs); p.s1*=Math.exp(-0.5*sx-0.25*vs); p.s2*=Math.exp(-0.6*sx-0.36*vs); p.bb*=Math.exp(-cx-vc); p.hr*=Math.exp(-0.6*sx-0.3*cx-0.36*vs-0.09*vc) }
      p.s1*=Math.exp(-BS10.fld*(fldDev[fs]||0)) }
    let u=rng.r(), o="out"; for(const k of ["k","bb","hbp","s1","s2","s3","hr"]){ if(u<p[k]){ o=k; break } u-=p[k] }
    // the evidence their approach leaves (for your read): pitches seen, pulled balls in play, strikeouts
    const T=st.S[bat].tell, tl=BS_TELL[st.S[bat].app]; T.pa++; T.pit+=Math.max(1,Math.round(rng.gauss(tl[1],BS_TELL_SD.pit)));
    T.wh=(T.wh||0)+Math.max(0,Math.round(rng.gauss(tl[2],BS_TELL_SD.wh)));
    if(o==="k")T.k++; else if(o!=="bb"&&o!=="hbp"){ T.bip++; if(rng.r()<tl[0])T.pull++ }
    st.S[fs].sp.bf+=st.S[fs].pen||st.S[fs].closer?0:1;
    return o;
  }
  // the half-inning in progress
  let H=null;   // {bat, fs, outs, b:[r1,r2,r3], runs, ev}
  const startHalf=(bat)=>{ if(st.box&&st.box[other(bat)])st.box[other(bat)].resp={};   // round 74: runners left on are gone
    H={bat:bat, fs:other(bat), outs:0, b:[0,0,0], bn:[null,null,null], runs:0, ev:H&&H.bat==="away"?H.ev:[], hits:0, n:0};
    if(st.seg>=SEGS&&!st.playoff){ H.b[1]=1; H.bn[1]=who(bat,(st.S[bat].bat+8)%9) }   // extra innings: a runner on second (the last man up)
  };
  let D=null;   // the inning's drive
  const inn=()=>st.seg+1;
  const score=(n,how)=>{ if(H.bat==="home")st.h+=n; else st.a+=n; H.runs+=n;
    if(st.S[H.fs].pen===false&&!st.S[H.fs].closer)st.S[H.fs].sp.ra+=n; else if(st.S[H.fs].cur)st.S[H.fs].cur.ra+=n };
  const walkoff=()=>H.bat==="home"&&st.seg>=SEGS-1&&st.h>st.a;
  const onDesc=()=>{ const b=H.b; const n=b.filter(Boolean).length; if(!n)return "Bases empty";
    if(n===3)return "Bases loaded"; return (b[0]&&b[1]?"Men on first and second":b[0]&&b[2]?"Men on first and third":b[1]&&b[2]?"Men on second and third":b[0]?"A man on first":b[1]?"A man on second":"A man on third")+(H.outs?`, ${H.outs} out`:", nobody out") };
  // the computer's manager: the bullpen when the starter is spent or hit hard; the closer for a save
  const cpuPen=fs=>{ const X=st.S[fs], P=X.sp; if(X.pen)return; if(P.bf>=P.stam||P.ra>=5||(P.bf>=18&&P.ra>=4))X.pen=true };
  // engine 5: the closer is rested one night in four (by the day, no draw): a set-up man takes that save (one man had
  // every save chance, 57 a season; MLB's leaders 35-50)
  const clRest=fs=>bsV5()&&((((ctx&&ctx.seed)||0)>>>(fs==="home"?3:7))&3)===0;
  const cpuCloser=fs=>{ const X=st.S[fs], L=lead(fs); if(inn()>=9&&L>=1&&L<=3&&!X.closer){ if(!clRest(fs)){ X.closer=true; X.pen=true }
      else if(bsV6()&&ctx&&ctx.pen&&ctx.pen[fs]&&ctx.pen[fs].setup&&!X.setupClose){ X.setupClose=true; X.pen=true } } };   // (engine 6: the set-up man closes when the closer rests)
  // the bullpen call: three batters before he's spent from the 5th (within three runs), and in a close game from the 6th
  // six batters before (round 58: it came in 18% of live games; Muse's first was game 114, "the best call in the game")
  // (round 59: after "leave him in", not again until he's faced three more or given up a run: it asked in back-to-back
  // innings, Instinct)
  const pullDue=fs=>{ const X=st.S[fs], P=X.sp; if(X.pen||inn()<5||inn()>8)return false; const L=Math.abs(lead(fs));
    if(P.stayBf!==undefined&&P.bf<P.stayBf+3&&P.ra===P.stayRa)return false;
    return (L<=3&&P.bf>=Math.max(18,P.stam-3))||(L<=2&&inn()>=6&&P.bf>=Math.max(15,P.stam-6)) };
  // round 56: every event names its man, from the day's lineup, and a pinch hitter stays in the slot for the rest of the
  // game (the log named a slot's starter or his backup at random, play by play: "three Devontes", Muse)
  const LU=side=>(ctx&&ctx.lineup&&ctx.lineup[side])||[], sub=st.sub={home:{},away:{}}, onFirst={home:null,away:null};
  const who=(side,slot)=>sub[side][slot]||LU(side)[slot]||null;
  const rateOf=(side,nm)=>ctx&&ctx.rate&&ctx.rate[side]&&nm?ctx.rate[side][nm]:null;
  const catcherOf=side=>bsV5()&&ctx&&ctx.catcher&&ctx.catcher[side]?ctx.catcher[side]:who(side,0);   // (engine 5: the order isn't by position)
  // engine 5: each hitter against his lineup's average (the day's nine), by rating
  const luMean={}; ["home","away"].forEach(sd=>{ const R=LU(sd).map(n=>rateOf(sd,n)).filter(x=>x!=null); luMean[sd]=R.length?R.reduce((a,b)=>a+b,0)/R.length:null });
  const hitEdge=(bat,nm)=>{ const r=rateOf(bat,nm), m=luMean[bat]; if(r==null||m==null)return 0;
    const a=atOf(bat,nm); if(a&&a.pow!=null)return {pow:(a.pow-m)*BS5.hit, con:(a.con-m)*BS5.hit, eye:(a.eye-m)*BS5.hit};   // engine 10
    return (r-m)*BS5.hit };
  // engine 10: the nine's fielding, each man's against his own rating (the DH fields nothing)
  const fldDev={}; ["home","away"].forEach(sd=>{ const L=LU(sd).map(n=>{ const a=atOf(sd,n), r=rateOf(sd,n); return a&&a.fld!=null&&r!=null?a.fld-r:null }).filter(x=>x!=null);
    fldDev[sd]=L.length?L.reduce((x,y)=>x+y,0)/L.length:0 });
  // the pinch hitter is worth it: he's the better hitter, and you're not ahead (the computer's rule, and your assistant's)
  // round 79 (engine 7): a man who has pinch-hit is in the game, so he can't pinch-hit again (Ian: asked twice in a game,
  // the same man both times)
  const benchFree=bat=>{ const ph=ctx&&ctx.bench&&ctx.bench[bat]; return !!ph&&!(ENGINE_V>=7&&Object.keys(sub[bat]).some(k=>sub[bat][k]===ph)) };
  const pinchWorth=(bat,slot)=>{ const ph=ctx&&ctx.bench&&ctx.bench[bat], b=rateOf(bat,who(bat,slot)), r=rateOf(bat,ph); return benchFree(bat)&&lead(bat)<=0&&(b==null||r==null||r>b) };
  /* ---- engine 26: the dugout (BS26). The computer's manager and your assistant follow the same rules; you are asked
     the ones that matter (callsDue) ---- */
  // the moment, for who comes in: a save (the ninth, up one to three), a tie late, the eighth with a lead, a close game
  // from the seventh, early, a blowout
  const sit26=fs=>{ const L=lead(fs), i=inn(); if(i>=9&&L>=1&&L<=3)return "save"; if(i>=9&&L===0)return fs==="home"||i>=10?"tie":"high";
    if(i===8&&L>=0&&L<=3)return "eighth"; if(Math.abs(L)>=5)return "blow"; if(i<=5)return "early"; if(i>=7&&Math.abs(L)<=2)return "high"; return "other" };
  // the next three batters: mostly left-handed (a switch-hitter doesn't count: he bats right against a lefty)
  const nextBats=bat=>{ const X=st.S[bat]; return [0,1,2].map(k=>bsBats(who(bat,(X.bat+k)%9))) };
  const lefties26=bat=>nextBats(bat).filter(b=>b==="L").length>=2;
  const penRank=fs=>bsPenRank(st.S[fs].pen26,st.S[fs].used,sit26(fs),lefties26(other(fs)));
  const halfStart=()=>H&&H.outs===0&&H.n===0;
  // who the computer would bring in now, or null to stay
  // (the ranking is read only when he'd make a change: it was a tenth of a replayed game)
  const penPlan26=fs=>{ const X=st.S[fs]; if(!X.v26||!H)return null; const L=lead(fs), i=inn(), hs=halfStart(); let c0;
    const top=()=>c0!==undefined?c0:(c0=penRank(fs)[0]||null);
    if(!X.cur){ const P=X.sp; let go=P.np>=P.stamP||P.ra>=5||(P.bf>=18&&P.ra>=4);
      if(!go&&hs&&i>=6&&P.np>=P.stamP-15)go=true;                       // he won't get through another inning
      if(!go&&hs&&i>=9&&L>=1&&L<=3)go=true;                             // the closer's inning
      if(!go&&i>=6&&P.bf>=18&&Math.abs(L)<=2&&(H.b[1]||H.b[2])&&P.np>=P.stamP-25)go=true;   // third time through, trouble, a close game
      return go?top():null }
    const C=X.cur, long=C.role==="lr"||C.role==="mop", sit=sit26(fs);
    if(C.bf<3&&!hs)return null;   // the three-batter rule: three batters, or the end of an inning
    let go=false;
    if(hs){ if(C.outs>=(long?(sit==="blow"?9:6):3)||C.np>=(long?45:22))go=true;
      else if(sit==="save"&&C.role!=="cl"||sit==="eighth"&&!/^(su|su2|cl)$/.test(C.role)||long&&i>=7&&Math.abs(L)<=3)go=true }
    else if(C.np>=(long?65:35)||C.ra>=3)go=true;
    else if(C.role==="lefty"&&bsBats(who(other(fs),st.S[other(fs)].bat%9))!=="L")go=true;   // his lefties are done
    else if(C.th!=="L"&&i>=7&&Math.abs(L)<=2&&(H.b[1]||H.b[2])&&lefties26(other(fs))&&top()&&top().th==="L")go=true;   // the lefty for the lefties
    const c=go?top():null; if(!c||c.n===C.n)return null;
    if(!bsPenOk(c)&&C.np<40&&C.ra<3)return null;   // nobody rested: he stays
    return c };
  const bringIn=(fs,c)=>{ const X=st.S[fs]; if(!c||X.used[c.n])return false; const was=X.cur?X.cur.n:X.sp.n;
    X.cur={n:c.n,r:c.r,th:c.th,role:c.role,bf:0,np:0,outs:0,ra:0,fat:bsPenFat(c),py:c.py,p2:c.p2}; X.used[c.n]=true; X.pen=true;
    if(H)H.ev.push({k:"pc",side:fs,inn:inn(),nm:c.n,was:was,role:c.role,th:c.th,u:(st.seg*31+X.bfAll*7)%100});
    return true };
  const findPen=(fs,n)=>(st.S[fs].pen26||[]).find(c=>c.n===n&&!st.S[fs].used[n])||null;
  // your starter is tiring (asked before the computer would take him out), in pitches
  const pullDue26=fs=>{ const X=st.S[fs], P=X.sp; if(X.cur||inn()<5||inn()>8)return false; const L=Math.abs(lead(fs));
    if(P.stayBf!==undefined&&P.bf<P.stayBf+3&&P.ra===P.stayRa)return false;
    return (L<=3&&P.np>=Math.max(70,P.stamP-12))||(L<=2&&inn()>=6&&P.np>=Math.max(60,P.stamP-24)) };
  // the pinch hitter by the platoon: a hitter's worth against this pitcher, in rating points
  const vsVal=(bat,nm,fs)=>{ const r=rateOf(bat,nm); return r==null?null:r+bsPlat(bsBats(nm),thOf(fs,(st.S[fs].cur?st.S[fs].cur.n:st.S[fs].sp.n)))/BS26.xPt };
  const bench26=bat=>{ const B=(ctx.bench26&&ctx.bench26[bat])||[], used=new Set(Object.keys(sub[bat]).map(k=>sub[bat][k])); return B.filter(n=>!used.has(n)) };
  const phPick=(bat,slot)=>{ const fs=other(bat), cur=vsVal(bat,who(bat,slot),fs); let best=null;
    bench26(bat).forEach(n=>{ const v=vsVal(bat,n,fs); if(v!=null&&(!best||v>best.v))best={n:n,v:v} });
    return best&&cur!=null&&best.v-cur>=BS26.phMin&&lead(bat)<=0?best.n:null };
  // the intentional walk: first base open, a man in scoring position, late and close, and the next man a much weaker hitter
  const ibbGap=fs=>{ const bat=other(fs), X=st.S[bat], a=rateOf(bat,who(bat,X.bat%9)), b=rateOf(bat,who(bat,(X.bat+1)%9)); return a==null||b==null?0:a-b };
  const ibbOpen=fs=>H&&!H.b[0]&&(H.b[1]||H.b[2]);
  const ibbSpot=fs=>ibbOpen(fs)&&inn()>=8&&Math.abs(lead(fs))<=1;   // asked of you
  const ibbWorth=fs=>ibbOpen(fs)&&inn()>=7&&Math.abs(lead(fs))<=2&&ibbGap(fs)>=BS26.ibbGap;   // the computer's rule, and your assistant's
  const pinch26=(bat,slot)=>{ const fs=other(bat), up=who(bat,slot), B=bench26(bat).map(n=>({n:n,v:vsVal(bat,n,fs)})).sort((a,b)=>(b.v||0)-(a.v||0)).slice(0,3), pn=st.S[fs].cur?st.S[fs].cur.n:st.S[fs].sp.n;
    const dp=pinchCall26(inn(),lead(bat),up,B,onDesc(),pn,thOf(fs,pn)); dp.k26=1; dp.pick=phPick(bat,slot); dp.best=B[0]?B[0].n:null; dp.upV=vsVal(bat,up,fs); dp.upR=rateOf(bat,up);
    dp.vals=B.map(x=>[x.n,Math.round(x.v||0),rateOf(bat,x.n),bsBats(x.n)]); dp.upBats=bsBats(up); return dp };
  const stay26=X=>{ X.holdTo=X.bfAll+3; if(!X.cur){ const P=X.sp; P.stamP=Math.max(P.stamP,P.np+12); P.stayBf=P.bf; P.stayRa=P.ra } };
  const cpu26=fs=>{ const X=st.S[fs]; if(humans[fs]&&X.holdTo>X.bfAll)return; const c=penPlan26(fs); if(c)bringIn(fs,c) };
  st.actsFor=function(side){ const X=st.S[side]; if(!X||!X.v26||!humans[side]||st.done)return [];
    const left=(X.pen26||[]).filter(c=>!X.used[c.n]).length; if(!left)return [];
    return [{id:"pen",l:"Go to the bullpen",on:X.want?true:undefined,pend:"Called: when you next take the field"}] };
  st.act=function(side,id){ const X=st.S[side]; if(!X||!X.v26||!humans[side]||st.done||id!=="pen")return false; X.want=true; return true };
  const doAB=()=>{
    const bat=H.bat, fs=H.fs, X=st.S[bat];
    const slot=X.bat%9; X.bat++;
    let extra=0; if(st.late[bat+"pinch"]){ st.late[bat+"pinch"]=false; const was=who(bat,slot), ph=ctx&&ctx.bench&&ctx.bench[bat];
      extra=bsV5()?0:bsPinchEdge(rateOf(bat,was),rateOf(bat,ph));   // (engine 5: his own rating, below)
      if(ph)sub[bat][slot]=ph; H.ev.push({k:"ph",side:bat,u:rng.int(100),inn:inn(),slot:slot,nm:ph||null,was:was}) }
    if(st.late[bat+"ph"]){ const ph=st.late[bat+"ph"], was=who(bat,slot); st.late[bat+"ph"]=null;   // engine 26: the man you chose
      sub[bat][slot]=ph; H.ev.push({k:"ph",side:bat,u:rng.int(100),inn:inn(),slot:slot,nm:ph,was:was}) }
    const ibb=!!st.late[fs+"ibb"]; if(ibb)st.late[fs+"ibb"]=false;   // engine 26: the intentional walk (no pitches, no dice)
    const nm=who(bat,slot), pre=H.bn.slice(), preB=H.b.slice(), ev0=H.ev.length, out0=H.outs;
    const run0=bat==="home"?st.h:st.a;   // round 74: the box score, counted
    paNm=nm; if(ibb){ if(!st.S[fs].pen)st.S[fs].sp.bf++; H.ev.push({k:"ibb",side:fs,u:(slot*29+st.seg*13)%100,inn:inn(),slot:slot,nm:nm}) }
    const o=ibb?"bb":bsV5()?pa(bat,fs,extra,hitEdge(bat,nm)):pa(bat,fs,extra-(slot>=6?0.02:slot<=3?-0.02:0)), L=st.lines[bat==="home"?"h":"a"];
    const b=H.b;
    // the strikeout that strands a rally: once a half-inning (round 56: four times in one inning, Muse)
    if(o==="k"){ H.outs++; L.k++; if(b[0]+b[1]+b[2]>=2&&rng.r()<0.6){ const u=rng.int(100); if(!H.kkSaid){ H.kkSaid=true; H.ev.push({k:"kk",side:fs,u:u,inn:inn(),on:b[0]+b[1]+b[2]}) } } }   // the same draws as before
    else if(o==="bb"||o==="hbp"){ L.bb++; if(b[0]){ if(b[1]){ if(b[2]){ score(1); H.ev.push({k:"rbi",side:bat,n:1,hit:o==="hbp"?-2:-1,u:(st.h*7+st.a*13+slot*3)%100,inn:inn(),slot:slot,nm:nm}) } b[2]=1 } b[1]=1 } b[0]=1; onFirst[bat]=nm }
    else if(o==="s1"){ L.h++; H.hits++; let n=b[2]; b[2]=0; if(b[1]){ if(rng.r()<BS.adv2)n++; else b[2]=1 } b[1]=0; if(b[0]){ if(!b[2]&&rng.r()<0.3)b[2]=1; else b[1]=1 } b[0]=1; onFirst[bat]=nm;
      if(n){ score(n); H.ev.push({k:"rbi",side:bat,n:n,hit:1,u:rng.int(100),inn:inn(),slot:slot,nm:nm}) } }
    else if(o==="s2"){ L.h++; H.hits++; let n=b[2]+b[1]; b[2]=0; b[1]=0; if(b[0]){ if(rng.r()<BS.adv2*0.7)n++; else b[2]=1 } b[0]=0; b[1]=1;
      if(n){ score(n); H.ev.push({k:"rbi",side:bat,n:n,hit:2,u:rng.int(100),inn:inn(),slot:slot,nm:nm}) } }
    else if(o==="s3"){ L.h++; H.hits++; const n=b[0]+b[1]+b[2]; b[0]=b[1]=0; b[2]=1; if(n){ score(n); H.ev.push({k:"rbi",side:bat,n:n,hit:3,u:rng.int(100),inn:inn(),slot:slot,nm:nm}) } }
    else if(o==="hr"){ L.h++; L.hr++; H.hits++; const n=1+b[0]+b[1]+b[2]; b[0]=b[1]=b[2]=0; score(n); H.ev.push({k:"hr",side:bat,n:n,u:rng.int(100),inn:inn(),slot:slot,nm:nm}) }
    else{ // an out in play
      if(b[0]&&H.outs<2&&rng.r()<BS.dp){ H.outs+=2; b[0]=0; if(H.outs<3&&b[2]&&rng.r()<0.4){ score(1); b[2]=0 } H.ev.push({k:"dp",side:fs,u:rng.int(100),inn:inn()}) }
      else if(b[2]&&H.outs<2&&rng.r()<BS.sf){ H.outs++; b[2]=0; score(1); H.ev.push({k:"rbi",side:bat,n:1,hit:0,u:rng.int(100),inn:inn(),slot:slot,nm:nm}) }
      else{ H.outs++; if(H.outs<3&&b[1]&&!b[2]&&rng.r()<0.3){ b[2]=1; b[1]=0 } } }
    if(H.outs>=3)L.lob+=b[0]+b[1]+b[2];
    // round 70, for the highlights only (no draws, nothing the game reads): who was on, who pitched, the game's last out
    const dp=H.ev.slice(ev0).some(e=>e.k==="dp"), q=[2,1,0].filter(i=>preB[i]).map(i=>pre[i]);
    if(dp){ const j=q.lastIndexOf(pre[0]); if(preB[0]&&j>=0)q.splice(j,1) }
    if(o==="bb"||o==="hbp"||o==="s1"||o==="s2"||o==="s3")q.push(nm);
    const occ=[2,1,0].filter(i=>b[i]); while(q.length>occ.length)q.shift(); H.bn=[null,null,null]; occ.forEach((i,k)=>{ H.bn[i]=q[k]||null });
    const Xf=st.S[fs], pn=Xf.v26?(Xf.cur?Xf.cur.n:Xf.sp.n):Xf.closer?"closer":Xf.pen?(bsV6()?relief(fs).n:"bullpen"):Xf.sp.n;
    H.ev.slice(ev0).forEach(e=>{ if(e.k!=="ph"){ e.r=[preB[0]?pre[0]:null,preB[1]?pre[1]:null,preB[2]?pre[2]:null]; e.p=pn } });
    bsCount(st,bat,fs,nm,o,run0,pre,preB,H.outs-out0,pn,H.ev.slice(ev0),inn()+bat);
    H.n++;
    if(Xf.v26){ const np=ibb?0:bsPitchSeq({o:o},strHash("bs|"+st.seg+"|"+st.k26+"|"+(nm||""))).length, Pp=bsBoxSide(st,fs).pit[pn];   // the full match's own pitches
      (Xf.cur||Xf.sp).np+=np; if(Pp){ Pp.np=(Pp.np||0)+np; Pp.bf=(Pp.bf||0)+1 } Xf.bfAll++; if(Xf.cur){ Xf.cur.bf++; Xf.cur.outs+=H.outs-out0 } }
    st.k26++;
    // round 101: the full match's at-bat log (the game on screen only; read off what just happened, no draws)
    if(D&&D.pl){ const E=H.ev.slice(ev0), ph=E.find(e=>e.k==="ph");
      D.pl.push({t:"pa",s:bat==="home"?0:1,nm:nm,slot:slot,o:o,dp:dp,sf:E.some(e=>e.k==="rbi"&&e.hit===0),out0:out0,outs:H.outs,
        pre:[preB[0]?pre[0]:null,preB[1]?pre[1]:null,preB[2]?pre[2]:null],post:[b[0]?H.bn[0]:null,b[1]?H.bn[1]:null,b[2]?H.bn[2]:null],
        runs:(bat==="home"?st.h:st.a)-run0,p:pn,ph:ph?ph.was:null,h:st.h,a:st.a,ibb:ibb?1:undefined}) }
    if(H.outs>out0&&st.seg>=SEGS-1)st.lastOut={k:"end",side:fs,bat:bat,nm:nm,slot:slot,how:o==="k"?"k":dp?"dp":(slot+st.seg)%2?"fly":"gb",r:[preB[0]?pre[0]:null,preB[1]?pre[1]:null,preB[2]?pre[2]:null],p:pn,outs:out0,u:(slot*37+st.seg*11)%100,inn:inn()};
  };
  const steal=(side)=>{ const ok=rng.r()<bsStealP(onFirst[side],catcherOf(other(side)),atOf(side,onFirst[side]),atOf(other(side),catcherOf(other(side)))); const b=H.b; b[0]=0; if(ok){ b[1]=1; H.bn[1]=H.bn[0] } H.bn[0]=null; if(!ok){ H.outs++; st.lastOut=null } H.ev.push({k:ok?"sb":"cs",side:side,u:rng.int(100),inn:inn(),nm:onFirst[side]});
    if(D&&D.pl)D.pl.push({t:ok?"sb":"cs",s:side==="home"?0:1,nm:onFirst[side],outs:H.outs,post:[H.b[0]?H.bn[0]:null,H.b[1]?H.bn[1]:null,H.b[2]?H.bn[2]:null],h:st.h,a:st.a});
    bsCountSteal(st,side,ok,onFirst[side]); st.k26++; if(!ok){ const Xf=st.S[other(side)]; bsCountOuts(st,other(side),Xf.v26?(Xf.cur?Xf.cur.n:Xf.sp.n):Xf.closer?"closer":Xf.pen?"bullpen":Xf.sp.n,1); if(Xf.cur)Xf.cur.outs++ } };
  st.log=[];
  const apply=(side,dp,v)=>{
    const X=st.S[side];
    if(dp.k==="prep"){ if(ANSWERS[v]){ const t=st.S[other(side)].app; X.ans=v; X.prepd=true;
      st.log.push({side:side,h:dp.h,k:"prep",pick:v,truth:t,right:ANSWERS[v].beats===t,split:(()=>{const a=Object.values(dp.report).sort((x,y)=>y-x);return a[0]===a[1]?a.filter(x=>x>0).join("-"):false})()}); { const L=st.log[st.log.length-1]; if(L.split)L.unclear=true } { const L=st.log[st.log.length-1], ks=Object.keys(dp.report).sort((a,b)=>dp.report[b]-dp.report[a]); if(!L.split&&ANSWERS[v]&&ANSWERS[v].beats===ks[0]){ L.followed=true; L.fav=ks[0] } }   /* round 71: set up for what the report said most */ }   // round 71: a split report isn't graded, so it isn't counted right either (Muse: a 2-2-2 read counted as right)
      else if(v!==undefined&&dp.report){ const t=st.S[other(side)].app, ks=Object.keys(dp.report).sort((a,b)=>dp.report[b]-dp.report[a]);
        st.log.push({side:side,h:dp.h,k:"prep",pick:"wait",waited:true,fav:ks[0],truth:t,right:ks[0]!==t,unclear:dp.report[ks[0]]===dp.report[ks[1]]}) } return }
    if(dp.k==="read"){ const t=st.S[other(side)].app, pick=v==="keep"?X.ans:ANSWERS[v]?v:null;
      if(pick){ st.log.push({side:side,h:dp.h,k:"read",pick:pick,truth:t,right:ANSWERS[pick].beats===t,evid:dp.best,fe:ANSWERS[pick].beats===dp.best}); if(pick!==X.ans)X.prepd=false; X.ans=pick }
      else { const was=X.ans; readIt(side,0.45); st.autoDid=X.ans!==was&&ANSWERS[X.ans]?"read them himself and switched to "+ANSWERS[X.ans].l.split(":")[0].toLowerCase():"read them himself and kept the plan as it was" }
      return }
    if(X.v26&&(dp.k==="pull"||dp.k==="pen"||dp.k==="penu")){ const c=typeof v==="string"&&v.indexOf("pen:")===0?findPen(side,v.slice(4)):v==="pen"?penRank(side)[0]:null;
      if(c){ bringIn(side,c); if(dp.k==="penu")X.want=false; return }
      if(v==="stay"||v==="keep"){ stay26(X); X.want=false; return }
      const w=penPlan26(side); if(w)bringIn(side,w); st.autoDid=w?`brought in ${w.n}`:X.cur?`left ${X.cur.n} in`:"left him in, by the computer's rule"; return }
    if(dp.k==="ibb"){ const go=v==="walk"||(v==="normal"&&ibbWorth(side)); if(go)st.late[side+"ibb"]=true; if(v==="normal")st.autoDid=go?"put him on":"pitched to him"; return }
    if(dp.k==="pinch"&&st.S[side].v26&&ctx.bench26){ const ph=typeof v==="string"&&v.indexOf("ph:")===0?v.slice(3):v==="pinch"?(dp.best||null):v==="normal"?dp.pick:null;
      if(ph&&bench26(side).indexOf(ph)>=0)st.late[side+"ph"]=ph; if(v==="normal")st.autoDid=ph?`sent up ${ph}`:"let him hit"; return }
    if(dp.k==="pull"){ if(v==="pen")X.pen=true; else if(v==="stay"){ X.sp.stam=Math.max(X.sp.stam,X.sp.bf+3); X.sp.stayBf=X.sp.bf; X.sp.stayRa=X.sp.ra } else { cpuPen(side); st.autoDid=X.pen?"went to the bullpen":"left him in, by the computer's rule" } return }
    if(dp.k==="pinch"){ if(v==="pinch"||(v==="normal"&&dp.worth))st.late[side+"pinch"]=true; if(v==="normal")st.autoDid=st.late[side+"pinch"]?"sent up the pinch hitter (he's the better bat)":"let him hit"; return }
    if(dp.k==="steal"){ const go=v==="send"||(v==="normal"&&dp.p>=BS_SEND); if(v==="normal")st.autoDid=go?"sent him (a good jump to be had)":"held him"; if(go&&H&&H.b[0]&&!H.b[1])steal(side); return }
  };
  /* the calls due before the next at-bat (people only; the computer manages as above) */
  function callsDue(){
    const bat=H.bat, fs=H.fs;
    // engine 26: your bullpen. Who comes in when you call for him (the button), when your starter tires, and when your
    // reliever is done late in a close game; and the intentional walk
    if(humans[fs]&&st.S[fs].v26){ const X=st.S[fs], sc=lead(fs);
      if(X.want&&halfStart()&&!st.asked["penu"+inn()+fs]){ st.asked["penu"+inn()+fs]=true; X.want=false; const R=penRank(fs).slice(0,3);
        if(R.length&&queueCall(fs,penuCall(inn(),sc,X,R,penPlan26(fs))))return true }
      if(!(X.holdTo>X.bfAll)){
        if(pullDue26(fs)&&!st.asked["pull"+inn()+fs]){ st.asked["pull"+inn()+fs]=true; const R=penRank(fs).slice(0,2);
          if(R.length&&queueCall(fs,pullCall26(inn(),sc,X.sp,R,H.b.some(Boolean)?onDesc()+".":"")))return true }
        if(X.cur&&inn()>=7&&Math.abs(sc)<=3){ const w=penPlan26(fs), key="pen"+inn()+fs+X.cur.n;
          if(w&&!st.asked[key]){ st.asked[key]=true; const R=[w].concat(penRank(fs).filter(c=>c.n!==w.n)).slice(0,2);
            if(queueCall(fs,penCall26(inn(),sc,X.cur,R,onDesc()+".")))return true } } }
      if(ibbSpot(fs)&&ibbGap(fs)>=6&&!st.asked["ibb"+inn()+fs]){ st.asked["ibb"+inn()+fs]=true; const B=st.S[bat];
        const dp=ibbCall(inn(),sc,who(bat,B.bat%9),who(bat,(B.bat+1)%9),onDesc()); dp.gap=ibbGap(fs); dp.worth=ibbWorth(fs); dp.team=ctx.team&&ctx.team[bat];
        if(queueCall(fs,dp))return true } }
    // your starter, tiring in a close game, with you in the field
    if(humans[fs]&&!st.S[fs].v26&&pullDue(fs)&&!st.asked["pull"+inn()+fs]){ st.asked["pull"+inn()+fs]=true; const X=st.S[fs];
      if(queueCall(fs,pullCall(inn(),lead(fs),X.sp,H.b.some(Boolean)?onDesc()+".":"")))return true }
    if(humans[bat]&&inn()>=7&&Math.abs(lead(bat))<=2){ const X=st.S[bat], slot=X.bat%9;
      // tied or behind only (round 56: the help says "when you're chasing", and a third of the calls came with a lead: Instinct)
      // round 58, measured on replays: a pinch hitter is worth asking you about tied or down one from the 8th (about 4
      // points on your assistant); in the 7th, or down two, about 2: those go to him
      if((H.b[1]||H.b[2])&&slot>=6&&lead(bat)<=0&&lead(bat)>=-1&&inn()>=8&&!st.asked["pinch"+inn()+bat]&&(X.v26&&ctx.bench26?bench26(bat).length>0:ENGINE_V<7||benchFree(bat))){ st.asked["pinch"+inn()+bat]=true;
        const dp=X.v26&&ctx.bench26?pinch26(bat,slot):pinchCall(inn(),lead(bat),who(bat,slot),ctx.bench&&ctx.bench[bat]||null,onDesc()); if(!dp.k26){ dp.worth=pinchWorth(bat,slot) } dp.team=ctx.team&&ctx.team[bat];
        if(queueCall(bat,dp))return true }
      // the steal: asked tied from the 8th (3 to 4 points on your assistant, measured); elsewhere he decides (1 to 2)
      if(H.b[0]&&!H.b[1]&&H.outs<2&&lead(bat)===0&&inn()>=8&&!st.asked["steal"+inn()+bat]){ st.asked["steal"+inn()+bat]=true;
        const rn=onFirst[bat], cn=catcherOf(other(bat)), dp=stealCall(inn(),lead(bat),rn,H.outs);
        dp.p=bsStealP(rn,cn,atOf(bat,rn),atOf(other(bat),cn)); dp.runner=rn; dp.catcher=cn; dp.speed=bsSpeed(rn,atOf(bat,rn))[0]; dp.arm=bsArm(cn,atOf(other(bat),cn))[0]; dp.team=ctx.team&&ctx.team[bat];
        if(queueCall(bat,dp))return true } }
    // one decision guaranteed in a one-run game from the 8th (round 59, Ian: "in a one-run game the player should never
    // be a spectator for three innings", Muse). If nothing worth asking has come by then, the first pinch-hit or steal
    // chance is yours, even where the replays put it under 3 points on your assistant.
    if(humans[bat]&&inn()>=8&&Math.abs(lead(bat))<=1&&!(st.lateGot&&st.lateGot[bat])){ const X=st.S[bat], slot=X.bat%9;
      if((H.b[1]||H.b[2])&&slot>=5&&ctx.bench&&ctx.bench[bat]&&!st.asked["pinch"+inn()+bat]&&(X.v26&&ctx.bench26?bench26(bat).length>0:ENGINE_V<7||benchFree(bat))){ st.asked["pinch"+inn()+bat]=true;
        const dp=X.v26&&ctx.bench26?pinch26(bat,slot):pinchCall(inn(),lead(bat),who(bat,slot),ctx.bench[bat],onDesc()); if(!dp.k26){ dp.worth=pinchWorth(bat,slot) } dp.team=ctx.team&&ctx.team[bat];
        if(queueCall(bat,dp))return true }
      if(H.b[0]&&!H.b[1]&&H.outs<2&&!st.asked["steal"+inn()+bat]){ st.asked["steal"+inn()+bat]=true;
        const rn=onFirst[bat], cn=catcherOf(other(bat)), dp=stealCall(inn(),lead(bat),rn,H.outs);
        dp.p=bsStealP(rn,cn,atOf(bat,rn),atOf(other(bat),cn)); dp.runner=rn; dp.catcher=cn; dp.speed=bsSpeed(rn,atOf(bat,rn))[0]; dp.arm=bsArm(cn,atOf(other(bat),cn))[0]; dp.team=ctx.team&&ctx.team[bat];
        if(queueCall(bat,dp))return true } }
    return false;
  }
  function cpuTurn(){
    const bat=H.bat, fs=H.fs;
    // yours: the computer's rule too, except while the pull call is still to be asked this inning (round 53: once
    // it had been asked, nothing took a spent starter out until the inning ended; leaving it to the assistant gave
    // up a run a game more than the computer, and won 39% to its 49%)
    if(st.S[fs].v26){ cpu26(fs); if(!humans[fs]&&!st.late[fs+"ibb"]&&ibbWorth(fs))st.late[fs+"ibb"]=true }
    else{ if(!humans[fs]||st.S[fs].pen||!pullDue(fs)||st.asked["pull"+inn()+fs])cpuPen(fs);
      cpuCloser(fs) }
    // the computer's steal: a chance like any other, taken only when the runner should make it (round 58)
    // (yours too, wherever you weren't asked: your assistant plays the computer's rule)
    if((!humans[bat]||!st.asked["steal"+inn()+bat])&&H.b[0]&&!H.b[1]&&H.outs<2&&(bsV6()?rng.r()<bsTryRate(onFirst[bat],atOf(bat,onFirst[bat]))&&bsStealP(onFirst[bat],catcherOf(fs),atOf(bat,onFirst[bat]),atOf(fs,catcherOf(fs)))>=BS6.send:rng.r()<BS.stealTry&&bsStealP(onFirst[bat],catcherOf(fs))>=BS_SEND))steal(bat);
    // and its pinch hitter, in the spots you're asked about (round 58: it never pinch-hit, while your assistant did)
    if(inn()>=7&&Math.abs(lead(bat))<=2&&(H.b[1]||H.b[2])&&(st.S[bat].bat%9)>=(st.S[bat].v26?5:6)&&!st.asked["pinch"+inn()+bat]){ st.asked["pinch"+inn()+bat]=true;
      if(st.S[bat].v26&&ctx.bench26){ const p=phPick(bat,st.S[bat].bat%9); if(p)st.late[bat+"ph"]=p }   // engine 26: the best bat on the bench against this pitcher
      else if(pinchWorth(bat,st.S[bat].bat%9))st.late[bat+"pinch"]=true }
  }
  function finishHalf(){
    st.lines[H.bat==="home"?"h":"a"];
    if(H.bat==="away"){ D.a=H.runs; D.ev=H.ev.slice() } else { D.h=H.runs; D.ev=H.ev.slice() }
  }
  st.next=function(){
    const fin=()=>({done:true,h:st.h,a:st.a,drives:st.drives});
    if(st.done)return fin();
    if(st.pendingSide){ const P=st.pendingSide, v=st.answer; st.pendingSide=null; st.answer=null; st.autoDid=null; apply(P.side,P.dp,v) }
    if(st.queue.length){ const Q=st.queue.shift(); st.pendingSide=Q;
      const r={ask:Q.dp,mine:Q.side==="home"?st.h:st.a,theirs:Q.side==="home"?st.a:st.h,q:st.seg,side:Q.side}; st.waiting=r; return r }
    if(st.seg===0&&!st.p0){ st.p0=true; ["home","away"].forEach(sd=>{ const o=other(sd);
      if(humans[sd]&&!humans[o]&&fav[o])queueCall(sd,prepCall(scoutReport(fav[o],(ctx.seed||0)+(o==="home"?1:2)))) });
      if(st.queue.length)return st.next() }
    if(st.seg===3&&!st.r1&&!H){ st.r1=true; ["home","away"].forEach(sd=>{ if(!humans[sd]){ readIt(sd,0.45); return } const O=st.S[other(sd)]; O.tell.n=1; queueCall(sd,readCall(O.tell,st.S[sd].ans)) });
      if(st.queue.length)return st.next() }
    // the inning
    if(!D){ D={seg:st.seg,h:0,a:0,sh:st.h,sa:st.a,ev:[]}; if(st.plog)D.pl=[]; st.k26=0; startHalf("away") }
    let guard=0;
    while(guard++<200){
      if(callsDue())return st.next();
      cpuTurn();
      if(H.outs<3)doAB();
      if(H.outs>=3||walkoff()){
        const wasBat=H.bat; const evs=H.ev; finishHalf();
        if(wasBat==="away"){
          // the home side needn't bat in the ninth (or later) if it's ahead
          if(st.seg>=SEGS-1&&st.h>st.a){ D.ev=evs; break }
          startHalf("home"); H.ev=evs; continue }
        break }
    }
    D.sh=st.h; D.sa=st.a; D.ev=H.ev; D.hits=[st.lines.h.h,st.lines.a.h];
    const walked=H.bat==="home"&&H.outs<3&&walkoff(), lo=st.lastOut; st.lastOut=null;
    st.drives.push(D); const out=D; D=null; H=null; st.seg++;
    if(st.seg>=SEGS&&st.h!==st.a){ st.done=true; if(lo&&!walked)out.last=lo }   // the out that ended it (round 70: the highlights' last moment)
    else if(st.seg>=SEGS){ st.ot=st.seg-SEGS+1 }
    if(st.seg>=30){ st.done=true }   // never, in practice
    if(st.done)out.box=bsBoxDone(st);   // round 74: the game's own box score, on its last inning
    return {drive:out,h:st.h,a:st.a};
  };
  st.reply=function(v){ st.answer=v; st.waiting=null };
  st.partial=function(){ return D };   // round 101: the inning under way (its at-bats so far), for a call that comes inside it
  return st;
}
/* each club's usual approach at the plate this season, and the seed for its scouting report */
function clubStyle(t,year){ return rosterStyle(t,year)||APPROACH_KEYS[strHash(t+"|"+year)%APPROACH_KEYS.length] }
/* round 92: the lineup's lean (the nine regulars, by position weight): pull hitters from Power, patient from Eye, contact from Contact */
const sportStyleAttrs={pull:"Power",patient:"Eye",contact:"Contact"};
function sportStyleScores(R){ const o={pull:0,patient:0,contact:0}; if(!R||typeof attrOf!=="function")return o;
  BS_HIT.forEach(i=>{ const p=R[i], A=p&&attrOf(p); if(!A)return; const w=POS[i].w; o.pull+=w*((A.pow||p.r)-p.r); o.patient+=w*((A.eye||p.r)-p.r); o.contact+=w*((A.con||p.r)-p.r) }); return o }
/* the day's starters: the rotation turns one a game (the fourth and fifth men are the starters' backups) */
function spCtx(t,step){
  try{ if(typeof SEA==="undefined"||!SEA||!SEA.roster||!SEA.roster[t])return null; const R=SEA.roster[t];
    // round 93 (engine 16): a postseason series opens with the ace and turns four men (a tester's Game 1 went to his fifth
    // starter); the regular season turns all five
    const ph=ENGINE_V>=16&&typeof LEAGUE!=="undefined"&&LEAGUE.post&&LEAGUE.post.phases&&step>=LEAGUE.weeks?LEAGUE.post.phases[step-LEAGUE.weeks]:null, gk=ph?+(/g(\d+)$/.exec(ph)||[])[1]:0;
    const k=gk?(gk-1)%4:(step+strHash(t))%5, idx=k<3?BS_SP[k]:BK(BS_SP[k-3]), p=R[idx]; if(!p)return null;
    const mean=(R[BS_SP[0]].r+R[BS_SP[1]].r+R[BS_SP[2]].r+(R[BK(BS_SP[0])]||R[BS_SP[0]]).r+(R[BK(BS_SP[1])]||R[BS_SP[1]]).r)/5;
    return {n:p.n, q:(p.r-mean)*(bsV5()?BS5.q:0.012)} }catch(e){ return null } }
/* ============ round 94 (engine 17): the plan your lineup suits ============
   (design: Ian, after Grokbot: baseball had no fit at all.) The nine regulars' lean, Power against Contact and Eye (the
   scouting report's roster line reads the same: sportStyleScores), taken against the league's spread: a power lineup
   suits Swing for the fences (the extra plays as home runs), a contact-and-eye lineup Small ball (more singles and walks,
   fewer strikeouts). One spread is worth BS17.e Elo (8 points on baseball's curve, 680), held to 15 points (BS17.cap). */
const BS17_ENV=k=>typeof process!=="undefined"&&process.env&&process.env[k]?+process.env[k]:0;
const BS17={e:BS17_ENV("BS17_E")||80, cap:BS17_ENV("BS17_CAP")||146, gs:BS17_ENV("BS17_GS")||1.4, ga:BS17_ENV("BS17_GA")||2.3, g:BS17_ENV("BS17_G")||0.985, w:typeof process!=="undefined"&&process.env&&process.env.BS17_W!=null?+process.env.BS17_W:0, u:BS17_ENV("BS17_U")||0.79, d:typeof process!=="undefined"&&process.env&&process.env.BS17_D!=null?+process.env.BS17_D:0.5};   // g: the league's run level held (suited plans everywhere hit more on 17)
const SPORT_FIT_FROM=17;   // core: the plan is in the chance from engine 17 here (round 94)
function bsLeanOf(R){ const o=sportStyleScores(R); return o.pull-(o.patient+o.contact)/2 }
/* the league's spread of that lean, from the opening rosters (core styleTable, made in the Season constructor), so a
   promotion or a trade before the first game can't move it between a play and its reload */
function sportLeanSD(S,T){ const v=T.filter(t=>S[t]).map(t=>S[t].pull-(S[t].patient+S[t].contact)/2), m=v.reduce((a,b)=>a+b,0)/(v.length||1);
  return Math.sqrt(v.reduce((a,b)=>a+(b-m)*(b-m),0)/(v.length||1)) }
function bsLeanSD(){ return typeof SEA!=="undefined"&&SEA&&SEA._styles&&SEA._styles.leanSD||0 }
/* the lineup's lean in league spreads (positive: power) */
function bsLeanZ(t){ if(!planAmpV()||typeof SEA==="undefined"||!SEA||!SEA.roster||!SEA.roster[t])return 0; const sd=bsLeanSD(); return sd>0?bsLeanOf(SEA.roster[t])/sd:0 }
function bsFitZ(z,pl){ if(!z||!pl||pl==="balanced")return 0; const v=BS17.e*(pl==="aggressive"?z:-z); return Math.max(-BS17.cap,Math.min(BS17.cap,v)) }
function sportPlanFit(t,pl){ return planAmpV()?bsFitZ(bsLeanZ(t),pl):0 }
function sportPlanFitC(t,pl){ return sportPlanFit(t,pl) }
/* round 109 (engine 23): the plan against the day's starter (Grokbot: "real counters tied to the opponent's scouting").
   A power arm (Stuff over Control) punishes Swing for the fences; a control artist, who walks no one, Small ball. His
   lean in league spreads (r109 bsp.js, 450 starters over three seasons: Stuff less Control, mean 0.3, sd 6.96), a spread
   worth a spread of lineup fit (BS17.e), held with the fit to the cap. Kept with the game (ctx.spz) so a replay plays it */
function bsSpZ(t,step){ try{ const sp=spCtx(t,step), R=SEA.roster[t], p=sp&&R.find(x=>x&&x.n===sp.n), A=p&&attrOf(p); return A?Math.round((A.stf-A.ctl-0.3)/6.96*1000)/1000:0 }catch(e){ return 0 } }
function bsVsZ(z,pl){ return !z||!pl||pl==="balanced"?0:BS17.e*(pl==="aggressive"?-z:z) }
function sportPlanVsC(o,pl){ return planVsV()?bsVsZ(bsSpZ(o,cardStepFor(o)),pl):0 }
function sportPlanCap(){ return BS17.cap }
/* round 109 (engine 23): today's starter in the chance (the engine always played him: a team's strength is the rotation's
   average, so the card read the same whoever pitched). Measured (r109 spq.js, 20,000 games a cell, equal clubs): a
   starter's q is worth 853 Elo a unit, so ten rating points over his rotation's mean about 43 Elo, 4 points of chance */
const BS23_SPQ=853;
function sportTonightEdge(t){ if(!planVsV()||typeof SEA==="undefined"||!SEA)return 0; const sp=spCtx(t,cardStepFor(t)); return sp&&sp.q?BS23_SPQ*sp.q:0 }
function sportPlanVsWhy(o,k,v){ const sp=spCtx(o,cardStepFor(o)), nm=sp?esc(sp.n):"their starter", z=bsSpZ(o,cardStepFor(o));   // round 110: his lean, as the card says it (the old "doesn't miss many bats" read as his strikeouts: Muse, 7 in 5.2 innings)
  return `${nm} starts for ${esc(o)}, leaning to ${z>=0?"Stuff over Control":"Control over Stuff"}` }
const PLAN_LEAN={safe:"contact and eye",aggressive:"power"};
/* round 110: the scouting card's line on tonight's starter (his Stuff and Control as shown, 1-20, and which way he leans:
   a power arm punishes Swing for the fences, a control pitcher Small ball), with his season so far */
function sportPlanEvidence(o){ try{ const sp=spCtx(o,cardStepFor(o)), R=SEA.roster[o], p=sp&&R.find(x=>x&&x.n===sp.n), A=p&&attrOf(p); if(!A)return null;
  const z=bsSpZ(o,cardStepFor(o)), lean=z>0.25?"leans to Stuff: misses bats, which hurts Swing for the fences":z<-0.25?"leans to Control: walks few, which hurts Small ball":"no strong lean";
  return `${esc(sp.n)} starts for ${esc(o)}: Stuff ${attrShow(A.stf)}, Control ${attrShow(A.ctl)}, ${lean} (${esc(bsSeasonLine(o,sp.n))})` }catch(e){ return null } }   // round 94: the reason line
function sportPlanFitLine(t,pl){ return planAmpV()?planFitWords(t,pl,{safe:"contact and eye",aggressive:"power"}):"" }
function gameCtx(h,a,year,step){ const K26=bsV26()?[bsLineup26(h,step,a),bsLineup26(a,step,h)]:null;   // engine 26: the lineup card
  const LH=K26&&K26[0]?K26[0].lu:lineupOf(h), LA=K26&&K26[1]?K26[1].lu:lineupOf(a), BH=benchBat(h), BA=benchBat(a);
  // engine 26: each bullpen by name with its rest, and each bench
  const G26=bsV26()?{ph:bsPen26(h,step),pa:bsPen26(a,step),bh:bsBench26(h,LH),ba:bsBench26(a,LA)}:null; if(G26&&!G26.ph&&!G26.pa)G26.ph=G26.pa=undefined;
  return {lz:planAmpV()?{home:Math.round(bsLeanZ(h)*1000)/1000,away:Math.round(bsLeanZ(a)*1000)/1000}:undefined, spz:planVsV()?{home:bsSpZ(h,step),away:bsSpZ(a,step)}:undefined, fav:{home:clubStyle(h,year),away:clubStyle(a,year)}, sp:{home:spCtx(h,step),away:spCtx(a,step)},
  lineup:{home:LH,away:LA}, bench:{home:BH,away:BA}, team:{home:h,away:a}, catcher:{home:K26&&K26[0]?K26[0].c:catcherName(h),away:K26&&K26[1]?K26[1].c:catcherName(a)},
  rate:{home:ratesOf(h),away:ratesOf(a)}, pen:{home:penCtx(h),away:penCtx(a)}, seed:strHash(h+"|"+a+"|"+year+"|"+step), at:bsV10()?{home:bsAttrs(h,step,LH,BH,G26&&G26.bh),away:bsAttrs(a,step,LA,BA,G26&&G26.ba)}:undefined,
  pen26:G26?{home:G26.ph,away:G26.pa}:undefined, bench26:G26?{home:G26.bh,away:G26.ba}:undefined} }
/* engine 10: the attributes of the men the engine reads today (the nine, the bench bat, the day's starter, the long man
   and the set-up man), by name, as [group, values in the group's order]: kept with each computer game for its replay
   (round 81), so short */
function bsAttrs(t,step,lu,bench,more){ try{ const R=SEA.roster[t]||[], want=new Set((lu||[]).concat([bench]).concat(more||[])); const sp=spCtx(t,step), pc=penCtx(t);
    if(sp)want.add(sp.n); if(pc){ if(pc.long)want.add(pc.long.n); if(pc.setup)want.add(pc.setup.n) }
    if(more&&R[BS_CL])want.add(R[BS_CL].n);   // engine 26: the closer pitches by his own attributes too
    const o={}; R.forEach(p=>{ if(!p||!p.n||!want.has(p.n)||o[p.n])return; const A=typeof attrOf==="function"?attrOf(p):null; if(!A)return; const g=attrGrp(p); o[p.n]=[g].concat(attrKeys(g).map(k=>A[k])) }); return o }catch(e){ return {} } }
/* engine 6: the named relievers: the long man (the third starter's backup) and the set-up man (the closer's), healthy,
   each with his edge by rating against the rotation's top three, as a starter's is */
function penCtx(t){ try{ if(typeof SEA==="undefined"||!SEA||!SEA.roster||!SEA.roster[t])return null; const R=SEA.roster[t], H=hurtSet(t), cl=POS.findIndex(P=>P.p==="CL");
    const lm=BK(BS_SP[2]), su=BK(cl), L=R[lm]&&!H.has(lm)?R[lm]:null, S=R[su]&&!H.has(su)&&!H.has(cl)?R[su]:null;
    // against the league's usual reliever (a backup's rating, ~BS6_RP), so naming them doesn't make the bullpen worse
    const q=p=>(p.r-BS6_RP)*BS5.q;
    return {long:L?{n:L.n,q:q(L)}:null, setup:S?{n:S.n,q:q(S)}:null} }catch(e){ return null } }
/* hitters' ratings by name, for the pinch hitter's edge */
function ratesOf(t){ try{ const o={}; (SEA.roster[t]||[]).forEach(p=>{ if(p&&p.n)o[p.n]=p.r }); return o }catch(e){ return {} } }
/* the day's nine: an injured regular's backup plays (round 56: the season's stats give his at-bats to the backup, and now
   the log does too); the bench bat is the best backup not already in it */
function hurtSet(t){ try{ return new Set(SEA.talent?SEA.talent.active(t).map(x=>x.idx):[]) }catch(e){ return new Set() } }
function lineupOf(t){ try{ const R=SEA.roster[t], H=hurtSet(t), P=BS_HIT.map(i=>{ const p=H.has(i)?R[BK(i)]:R[i]; return p||R[i]||null });
    if(!bsV5())return P.map(p=>p?p.n:null);
    // engine 5: in order of ability (ties by position, so the same nine always bat the same way)
    const rk=P.map((p,k)=>({p:p,k:k})).sort((a,b)=>((b.p?b.p.r:0)-(a.p?a.p.r:0))||(a.k-b.k));
    return BS_ORDER5.map(j=>rk[j]&&rk[j].p?rk[j].p.n:null) }catch(e){ return null } }
function catcherName(t){ try{ const R=SEA.roster[t], H=hurtSet(t), i=BS_HIT[0], p=H.has(i)?R[BK(i)]:R[i]; return p?p.n:null }catch(e){ return null } }
function benchBat(t){ try{ const R=SEA.roster[t], H=hurtSet(t); let b=null; BS_HIT.forEach(i=>{ if(H.has(i))return; const p=R[BK(i)]; if(p&&!H.has(BK(i))&&(!b||p.r>b.r))b=p }); return b?b.n:null }catch(e){ return null } }
/* the steal and the pinch hitter (round 58: neither call showed anything to decide on: "no runner speed, no catcher
   arm, no hitters' numbers", Muse). A runner's speed and a catcher's arm are his own (from his name: the same all
   career), and move the steal's odds; a pinch hitter helps by how much better a hitter he is than the man he bats
   for (or hurts, if he isn't). The computer, your assistant and the evidence you see all use the same numbers. */
const BS_SPEED=[["fast",0.08],["fast",0.08],["fast",0.08],["average",0],["average",0],["average",0],["average",0],["average",0],["slow",-0.12],["slow",-0.12]];
const BS_ARM=[["a strong arm",-0.08],["a strong arm",-0.08],["a strong arm",-0.08],["an average arm",0],["an average arm",0],["an average arm",0],["an average arm",0],["an average arm",0],["a weak arm",0.06],["a weak arm",0.06]];
function bsSpeed(nm,a){ if(a&&a.spd!=null)return bsSpeedAt(a.spd); return bsV6()?BS_SPEED6[strHash("spd|"+(nm||""))%20]:BS_SPEED[strHash("spd|"+(nm||""))%10] }
/* engine 6: how often the computer sends him, a chance (runner on first, second open, under two out) */
function bsTryRate(nm,a){ const k=bsSpeed(nm,a)[2]; return k==="burn"?BS6.burn:k==="fast"?BS6.fast:k==="avg"?BS6.avg:0 }
function bsArm(nm,a){ if(a&&a.arm!=null)return bsArmAt(a.arm); return BS_ARM[strHash("arm|"+(nm||""))%10] }
function bsStealP(runner,catcher,ar,ac){ return BS.steal+bsSpeed(runner,ar)[1]+bsArm(catcher,ac)[1] }
const BS_SEND=0.80;   // the computer (and your assistant) send a runner only this likely to make it
function bsPlayer(t,nm){ try{ return (SEA.roster[t]||[]).find(p=>p&&p.n===nm)||null }catch(e){ return null } }
function bsPinchEdge(batR,benchR){ if(batR==null||benchR==null)return BS.pinch; return Math.max(-0.12,Math.min(0.15,(benchR-batR)*0.012)) }
/* ---- round 74: the box score, counted as the game is played (no draws: nothing here moves a game) ----
   Each batter's at-bats, hits, home runs, walks, strikeouts, RBI, runs and steals, by name; each pitcher's outs, runs,
   strikeouts and walks, by name ("bullpen" for the relievers the roster doesn't carry, "closer" for the closer). Who
   scored: the lead runners first, then the batter on a home run. The decisions at the end: the starter's win if he went
   five and left ahead and the lead held; his loss if he left behind and they never caught up; the closer's save if he
   came in to protect one to three runs and finished it. Read by the season (teamLines, baseball 10_players). */
function bsBoxSide(st,sd){ st.box=st.box||{home:{bat:{},pit:{},seq:[]},away:{bat:{},pit:{},seq:[]}}; return st.box[sd] }
function bsCount(st,bat,fs,nm,o,run0,pre,preB,outs,pn,evs,half){
  const B=bsBoxSide(st,bat), F=bsBoxSide(st,fs);
  const runs=(bat==="home"?st.h:st.a)-run0;
  if(nm){ const b=B.bat[nm]=B.bat[nm]||{ab:0,h:0,hr:0,rbi:0,r:0,bb:0,sb:0,k:0};
    if(o==="bb"||o==="hbp")b.bb++; else b.ab++;
    if(o==="s1"||o==="s2"||o==="s3"||o==="hr")b.h++; if(o==="hr")b.hr++; if(o==="k")b.k++;
    evs.forEach(e=>{ if((e.k==="rbi"||e.k==="hr")&&e.side===bat)b.rbi+=e.n||1 }) }
  // round 107 (engine 21): who put each runner on is kept for the half-inning only. A man left on base stayed down to the
  // pitcher who put him on, and when he next reached on an out and scored, the run went to that pitcher (Muse: a starter
  // charged a run over six scoreless innings, the 7th's two runs already his reliever's)
  if(ENGINE_V>=21&&half!=null&&F.respK!==half){ F.resp={}; F.respK=half }
  const P=F.pit[pn]=F.pit[pn]||{outs:0,er:0,k:0,bb:0}, resp=F.resp=F.resp||{};
  // a run is charged to the pitcher who put that runner on (a reliever's inherited runners are the starter's); the
  // extra-inning runner on second is nobody's, so his run is unearned
  if(runs>0){ const lead=[2,1,0].filter(i=>preB[i]).map(i=>pre[i]); const sc=o==="hr"?lead.slice(0,runs-1).concat([nm]):lead.slice(0,runs);
    sc.forEach(r=>{ if(!r)return; const x=B.bat[r]=B.bat[r]||{ab:0,h:0,hr:0,rbi:0,r:0,bb:0,sb:0,k:0}; x.r++;
      const who=r===nm&&o==="hr"?pn:resp[r]; if(who){ const Q=F.pit[who]=F.pit[who]||{outs:0,er:0,k:0,bb:0}; Q.er++ } delete resp[r] }) }
  if(nm&&(o==="bb"||o==="hbp"||o==="s1"||o==="s2"||o==="s3"))resp[nm]=pn;
  P.outs+=outs;
  P.k+=o==="k"?1:0; P.bb+=o==="bb"||o==="hbp"?1:0;
  // the score as each pitcher works, for the decisions: [pitcher, lead before this batter, lead after]
  const lead=s=>s==="home"?st.h-st.a:st.a-st.h, after=lead(fs), before=after+runs;
  F.seq.push([pn,before,after]);
  // engine 6: the batting side's pitcher of record when it went ahead, and who was pitching when the other fell behind
  if(runs>0&&before>=0&&after<0){ const own=B.seq[B.seq.length-1]; B.aheadP=own?own[0]:null; F.behind=pn }
}
function bsCountOuts(st,fs,pn,n){ if(n>0){ const F=bsBoxSide(st,fs), P=F.pit[pn]=F.pit[pn]||{outs:0,er:0,k:0,bb:0}; P.outs+=n } }
function bsCountSteal(st,side,ok,nm){ const B=bsBoxSide(st,side); if(ok&&nm){ const b=B.bat[nm]=B.bat[nm]||{ab:0,h:0,hr:0,rbi:0,r:0,bb:0,sb:0,k:0}; b.sb++ } }
function bsBoxDone(st){
  const box=JSON.parse(JSON.stringify(st.box||{home:{bat:{},pit:{},seq:[]},away:{bat:{},pit:{},seq:[]}}));
  if(bsV26()&&st.S.home.v26)return bsBoxDone26(st,box);
  if(bsV6())return bsBoxDone6(st,box);
  ["home","away"].forEach(sd=>{ delete box[sd].resp; const F=box[sd], won=sd==="home"?st.h>st.a:st.a>st.h, sp=st.S[sd].sp.n, seq=F.seq; F.dec={};
    const spRows=seq.filter(x=>x[0]===sp), exit=spRows.length?spRows[spRows.length-1][2]:null, iExit=seq.map(x=>x[0]).lastIndexOf(sp);
    const later=seq.slice(iExit+1), held=later.every(x=>x[2]>0), caught=later.some(x=>x[2]>=0);
    const spOuts=F.pit[sp]?F.pit[sp].outs:0;
    if(sp&&won&&spOuts>=15&&exit!==null&&exit>0&&held)F.dec.w=sp;
    if(sp&&!won&&exit!==null&&exit<0&&!caught)F.dec.l=sp;
    const iCl=seq.findIndex(x=>x[0]==="closer");
    if(iCl>=0){ const lead0=seq[iCl][1], last=seq[seq.length-1][0];
      if(won&&lead0>=1&&lead0<=3&&last==="closer")F.dec.sv="closer";
      else if(!won&&lead0>=1&&!seq.slice(iCl).some(x=>x[0]!=="closer"))F.dec.l=F.dec.l||"closer" }
    delete F.seq });
  return box;
}
/* engine 6: the scorer's decisions (see BS6). F.seq: [pitcher, lead before, lead after] for each batter this side
   faced; F.aheadP: this side's pitcher of record when it last went ahead; F.behind: who was pitching when it last fell
   behind. F.sp: the starter. */
function bsBoxDone6(st,box){
  ["home","away"].forEach(sd=>{ const F=box[sd], won=sd==="home"?st.h>st.a:st.a>st.h, sp=st.S[sd].sp.n, seq=F.seq||[]; F.dec={}; F.sp=sp;
    const order=[]; seq.forEach(x=>{ if(order.indexOf(x[0])<0)order.push(x[0]) });
    if(won){ let w=F.aheadP||order[0]||sp; if(w===sp&&(F.pit[sp]?F.pit[sp].outs:0)<15)w=order[1]||"bullpen"; F.dec.w=w;
      const last=seq.length?seq[seq.length-1][0]:null;
      if(last&&last!==w&&last!==sp){ const i0=seq.findIndex(x=>x[0]===last), lead0=i0>=0?seq[i0][1]:0; if(lead0>=1&&lead0<=3)F.dec.sv=last } }
    else F.dec.l=F.behind||order[0]||sp;
    delete F.seq; delete F.resp; delete F.aheadP; delete F.behind });
  return box;
}
/* engine 26: the decisions by name, every reliever his own (no "bullpen"), and the holds and blown saves. The win: as
   engine 6 (the pitcher of record when his side went ahead for good; a starter needs five innings, or it goes to the
   first reliever). The save: the man who finished it, not the winner, who came in with a lead of one to three or pitched
   three innings. A hold: a reliever who came in with a lead of one to three, got an out, and left with the lead, and
   neither won nor saved it. A blown save: a reliever who came in with a lead of one to three and lost it. (MLB's rule
   also counts the tying run on deck; the box score's seq has no bases.) */
function bsBoxDone26(st,box){
  ["home","away"].forEach(sd=>{ const F=box[sd], won=sd==="home"?st.h>st.a:st.a>st.h, sp=st.S[sd].sp.n, seq=F.seq||[]; F.dec={}; F.sp=sp;
    const order=[], first={}, last={}; seq.forEach(x=>{ if(order.indexOf(x[0])<0){ order.push(x[0]); first[x[0]]=x[1] } last[x[0]]=x[2] });
    const outs=n=>F.pit[n]?F.pit[n].outs:0, fin=seq.length?seq[seq.length-1][0]:null;
    if(won){ let w=F.aheadP||order[0]||sp; if(w===sp&&outs(sp)<15)w=order[1]||sp; F.dec.w=w;
      if(fin&&fin!==w&&fin!==sp&&((first[fin]>=1&&first[fin]<=3)||(first[fin]>=1&&outs(fin)>=9)))F.dec.sv=fin }
    else F.dec.l=F.behind||order[0]||sp;
    const hld=[], bs=[]; order.forEach(n=>{ if(n===sp)return; const L0=first[n]; if(!(L0>=1&&L0<=3))return;
      const lost=seq.some(x=>x[0]===n&&x[2]<=0); if(lost){ bs.push(n); return }
      if(n!==fin&&n!==F.dec.w&&n!==F.dec.sv&&outs(n)>=1&&last[n]>=1)hld.push(n) });
    if(hld.length)F.dec.hld=hld; if(bs.length)F.dec.bs=bs;
    delete F.seq; delete F.resp; delete F.respK; delete F.aheadP; delete F.behind });
  return box;
}
function playGame(rng, eloH, eloA, planH, planA, opts){
  opts=opts||{};
  const humans=opts.decide?{home:!!opts.userIsHome,away:!opts.userIsHome}:{home:false,away:false};
  const e=makeLiveGame(rng,eloH,eloA,planH,planA,humans,opts.playoff,opts.ctx);
  let guard=0;
  while(guard++<400){
    const r=e.next();
    if(r.done)return {h:r.h,a:r.a,drives:r.drives,ot:e.ot,lines:e.lines};
    if(r.ask){ const v=opts.decide(r.ask,{mine:r.mine,theirs:r.theirs,q:r.q}); e.reply(v||r.ask.opts[r.ask.opts.length-1][0]) }
  }
  return {h:e.h,a:e.a,drives:e.drives,ot:0,lines:e.lines};
}
