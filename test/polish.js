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

if(require.main===module){ (async()=>{ for(const [name,fn] of checks){ if(only&&!name.includes(only))continue; console.log('--',name); try{ await fn() }catch(e){ bad++; console.log('FAIL',name,'crashed:',e.stack.split('\n').slice(0,3).join(' | ')) } }
  console.log(bad?`MISMATCH ${bad} check(s) failed`:'MATCH every playtest slip stays fixed'); process.exit(bad?1:0) })() }
