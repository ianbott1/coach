/* Round 99 (Ian: "in my card I can't click on my team name, my record, the poll, myself"): every figure on the team card
   and the top bar opens its page, in all seven at phone and laptop width: the club's page, the standings, the ranking,
   the coach's page. Fails on 6473dcb (no links).   node test/golinks.js    last line: MATCH or MISMATCH */
const {chromium}=require('playwright'); const path=require('path');
const G=[['football-coach.html','Alabama'],['football-coach-pro.html','Denver'],['basketball-coach.html','Duke'],['basketball-coach-pro.html','Orlando'],['hockey-coach-pro.html','Vegas'],['soccer-coach.html','Arsenal'],['baseball-coach-pro.html','Seattle']];
(async()=>{ const b=await chromium.launch(); let bad=0;
 for(const [f,t] of G) for(const w of [390,1280]){ const pg=await b.newPage({viewport:{width:w,height:900}}); const errs=[]; pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('file://'+path.join(process.env.DIST||path.join(__dirname,'..','dist'),f)); await pg.waitForTimeout(200);
  await pg.evaluate(t=>{ try{localStorage.setItem('coach-guide-seen','1')}catch(e){} newDynasty(t,5,'T'); S.guide=false; render() },t);
  const keys=await pg.evaluate(()=>[...document.querySelectorAll('[data-go]')].map(e=>e.dataset.go));
  const res=[];
  for(let i=0;i<keys.length;i++){ await pg.evaluate(()=>{ view='team'; dynCoach=null; dynTeam=null; render() });
    const el=(await pg.$$('[data-go]'))[i]; if(!el){ res.push(keys[i]+':gone'); continue } await el.click();
    const st=await pg.evaluate(()=>({view,dynTab,dynTeam,dynCoach,stConf,h:(document.querySelector('main h2,main .grouphead')||{}).textContent||''}));
    const ok=keys[i]==='team'||keys[i]==='record'?st.view==='dyn'&&st.dynTeam:keys[i]==='group'?st.view==='stand':keys[i]==='rank'?st.view==='poll':keys[i]==='coach'?st.view==='dyn'&&st.dynCoach:false;
    if(!ok)bad++; res.push(keys[i]+(ok?':ok':':FAIL '+JSON.stringify(st))) }
  if(keys.length<5){ bad++; res.push('only '+keys.length+' links') } console.log(f.padEnd(26),w,res.join(' '),errs.length?'ERR '+errs[0]:''); await pg.close() }
 console.log(bad?'MISMATCH':'MATCH'); await b.close() })();
