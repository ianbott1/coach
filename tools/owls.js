/* round 96: each game's owl on its perch (the title screen's LOGO), saved as src/owls/<league>.svg for the landing page.
   The owl is drawn in each game's JS; run this after changing the art: node tools/owls.js (after python3 build.py site) */
const fs=require('fs'), path=require('path'); const {load}=require('../test/harness.js');
const G={cfb:'football-coach.html',nfl:'football-coach-pro.html',ncaab:'basketball-coach.html',nba:'basketball-coach-pro.html',nhl:'hockey-coach-pro.html',epl:'soccer-coach.html',mlb:'baseball-coach-pro.html'};
for(const [id,f] of Object.entries(G)){ const A=load({file:path.join(__dirname,'..','dist',f),expose:['LOGO']});
  const svg=A.LOGO.replace('class="logo"','class="owl"').replace(/<!--[^]*?-->/g,'').replace(/\n\s+/g,' ');
  fs.writeFileSync(path.join(__dirname,'..','src','owls',id+'.svg'),svg); console.log(id,svg.length) }
