/* Soccer's 80' call is a read (round 95, engine 18; Grokbot's point 6: late calls whose options really differ). Before,
   it had one right answer in every state (down one, push 180 of 180; up one, sit back 180 of 182; level, go for the win
   172 of 201). Now how to chase, see it out or go for it depends on their back line's legs, shown on the call a little
   off. Engine games at random gaps, your side home or away; at the call each option is played on from that moment on
   fresh luck (call-weight's method), valued in league points (a draw a third of a win).
   Passes when, in each state (down one, level, up one):
     reading the legs as Pearl does beats your assistant and each answer always taken;
     no answer is the best one in more than 70% of the calls.
     node test/sc-final.js [file.html] [games=700] [runs=200]    last line: MATCH or MISMATCH */
const path=require('path'); const {load}=require('./harness.js');
const args=process.argv.slice(2), file=args.find(a=>a.endsWith('.html'))||path.join(__dirname,'..','dist','soccer-coach.html');
const nums=args.filter(a=>/^\d+$/.test(a)).map(Number), G=nums[0]||700, RUNS=nums[1]||200;
const A=load({file,expose:['SEA','NAMES','LEAGUE','newDynasty','makeLiveGame','RNG','mulberry32','impactDefault','gameCtx']});
A.newDynasty(A.NAMES[3],7,'T');
const val=(r,home)=>{ const m=home?r.h:r.a, t=home?r.a:r.h; return m>t?1:m<t?0:A.LEAGUE.drawVal };
const pearl=dp=>{ const t=dp.legs.theirs, o=dp.opts.map(x=>x[0]); if(t<=55&&o.includes('press'))return 'press'; if(t>=74)return o.includes('sit')?'sit':'probe'; return 'probe' };
const T=Object.keys(A.SEA.roster), by={};
for(let g=0;g<G;g++){ const seed=(g*2654435761+17)>>>0, rr=new A.RNG(seed^0xabc), home=rr.r()<0.5, gap=(rr.r()+rr.r()+rr.r()-1.5)*300;
  const th=T[rr.int(T.length)], ta=T[(T.indexOf(th)+1+rr.int(T.length-1))%T.length], ctx=A.gameCtx(th,ta,A.SEA.year,0);
  const gargs=[1500+gap/2,1500-gap/2,'balanced','balanced',home,false,ctx,[]];
  let hit=-1, dp=null; { const e=A.makeLiveGame(new A.RNG(seed),...gargs); let i=0,n=0;
    while(n++<4000){ const r=e.next(); if(r.done)break; if(r.ask){ if(r.ask.k==='final'&&hit<0){ hit=i; dp=r.ask } i++; e.reply(A.impactDefault(r.ask)) } } }
  if(hit<0||!dp.legs)continue;
  const out={}; for(const [o] of dp.opts){ let s=0; for(let m=0;m<RUNS;m++){ const rng=new A.RNG(seed), e=A.makeLiveGame(rng,...gargs); let i=0,n=0,r;
      while(n++<4000){ r=e.next(); if(r.done)break; if(r.ask){ let a=A.impactDefault(r.ask); if(i===hit){ a=o; rng.f=A.mulberry32((seed^Math.imul(m+1,0x9E3779B1))>>>0); rng.sp=null } i++; e.reply(a) } }
      s+=val(r,home) } out[o]=s/RUNS }
  const k=dp.h.replace(/\d+/g,'N').replace(/, ten minutes left/,''); (by[k]=by[k]||[]).push({out,p:pearl(dp)}) }
let bad=0;
for(const k of Object.keys(by)){ const B=by[k], ks=Object.keys(B[0].out).filter(x=>x!=='normal'), avg=f=>100*B.reduce((s,r)=>s+r.out[f(r)],0)/B.length;
  const best={}; B.forEach(r=>{ const m=Math.max(...ks.map(x=>r.out[x])); ks.forEach(x=>{ if(r.out[x]===m)best[x]=(best[x]||0)+1 }) });
  const P=avg(r=>r.p), fixed=ks.map(x=>[x,avg(()=>x)]), asst=avg(()=>'normal'), top=Math.max(...Object.values(best))/B.length;
  const ok=P>asst&&fixed.every(([,v])=>P>v)&&top<=0.7; if(!ok)bad++;
  console.log(`  ${k.padEnd(10)} ${String(B.length).padStart(3)} calls | reading the legs ${P.toFixed(1)} | assistant ${asst.toFixed(1)} | ${fixed.map(([x,v])=>'always '+x+' '+v.toFixed(1)).join(' | ')} | best answer ${JSON.stringify(best)}${ok?'':'  FAIL'}`) }
if(Object.keys(by).length<3){ bad++; console.log('  fewer than three states seen') }
console.log(bad?'MISMATCH':'MATCH');
