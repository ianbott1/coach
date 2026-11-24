/* A backup can be downloaded once a career exists, by clicking, in all seven (round 107; Muse, Nov 23: college
   football's Pittsburgh career had no way to export). At a laptop size and a phone size: the career is created, the
   "?" button is found and pressed as a person would (it must be the element under the pointer), "Download a backup"
   is pressed, and a .coach file arrives that restores the same career. Last line MATCH or MISMATCH.
     node test/backup-reach.js [game ...] */
const {chromium}=require('playwright'), path=require('path'), fs=require('fs');
const GAMES={'football-coach.html':'Pittsburgh','football-coach-pro.html':'Denver','basketball-coach.html':'Minnesota',
  'basketball-coach-pro.html':'Minnesota','hockey-coach-pro.html':'Toronto','soccer-coach.html':'Queens Park Rangers','baseball-coach-pro.html':'Seattle'};
const pick=process.argv.slice(2).map(f=>f.endsWith('.html')?f:f+'.html');
(async()=>{ const b=await chromium.launch(); let bad=0,n=0;
  for(const [f,team] of Object.entries(GAMES)){ if(pick.length&&pick.indexOf(f)<0)continue;
    for(const vp of [{width:1919,height:998},{width:390,height:844}]){ n++;
      const ctx=await b.newContext({viewport:vp,acceptDownloads:true}), p=await ctx.newPage(), errs=[]; p.on('pageerror',e=>errs.push(e.message));
      await p.goto('file://'+path.join(__dirname,'..','dist',f)); await p.waitForTimeout(500);
      let why='';
      try{
        await p.evaluate(t=>{ newDynasty(t,189324,'T'); S.title=false; save(); render() },team); await p.waitForTimeout(500);
        const hit=async sel=>p.evaluate(s=>{ const e=document.querySelector(s); if(!e)return 'missing'; const r=e.getBoundingClientRect();
          if(!r.width||!r.height)return 'zero size'; const x=r.left+r.width/2,y=r.top+r.height/2;
          if(x<0||y<0||x>innerWidth||y>innerHeight)return `off screen (${Math.round(x)},${Math.round(y)})`;
          const u=document.elementFromPoint(x,y); return u===e||e.contains(u)?'ok':'covered by '+(u&&(u.id||u.className||u.tagName)) },sel);
        let h=await hit('#hlp'); if(h!=='ok')throw new Error('the ? button: '+h);
        await p.click('#hlp'); await p.waitForTimeout(300);
        await p.evaluate(()=>{ const e=document.querySelector('#backupbtn'); if(e)e.scrollIntoView({block:'center'}) }); await p.waitForTimeout(200);
        h=await hit('#backupbtn'); if(h!=='ok')throw new Error('Download a backup: '+h);
        const [dl]=await Promise.all([p.waitForEvent('download',{timeout:5000}),p.click('#backupbtn')]);
        const file=await dl.path(), txt=fs.readFileSync(file,'utf8');
        const back=await p.evaluate(t=>{ const d=readBackup(t); return d?d.myTeam:null },txt);
                if(!back)throw new Error('the backup from inside the career does not read back');
        // and from the title screen, the slot's own Back up (Muse was back on the title screen when she looked)
        await p.evaluate(async()=>{ await save(); S.title=true; S._slots=null; render() }); await p.waitForTimeout(800);
        h=await hit('[data-bk]'); if(h!=='ok')throw new Error('the title screen Back up: '+h);
        const [dl2]=await Promise.all([p.waitForEvent('download',{timeout:5000}),p.click('[data-bk]')]);
        const txt2=fs.readFileSync(await dl2.path(),'utf8');
        const back2=await p.evaluate(t=>{ const d=readBackup(t); return d?d.myTeam+'/'+JSON.stringify(d.career||{}).length:null },txt2);
        if(!back2||back2.split('/')[0]!==team)throw new Error('the title screen backup reads back as '+back2);
        why=`${dl.suggestedFilename()}, ${txt.length} bytes; title screen ${dl2.suggestedFilename()}, ${txt2.length} bytes`;
      }catch(e){ why='FAIL '+e.message }
      const ok=!/^FAIL/.test(why)&&!errs.length; if(!ok)bad++;
      console.log(`${ok?'  ok  ':'  FAIL'} ${f} ${vp.width}x${vp.height}: ${why}${errs.length?'; page errors: '+errs.slice(0,2).join(' | '):''}`);
      await ctx.close() } }
  await b.close(); console.log(bad?`MISMATCH ${bad} of ${n} could not download a backup`:`MATCH all ${n} downloaded a backup`); process.exit(bad?1:0) })();
