/* ============ awards: college football ============ */
/* The Heisman race and the all-conference teams. The core calls _award after
   every week's games; mvpRace(n) is the award race, best first. */
extendSeason({
  allConfAll(){
    const out={};
    LEAGUE.conf.order.forEach(c=>{out[c]=this.allConference(c)});
    return out;
  },
  _award(w,games){
    if(!this.roster)return;
    const won={};
    games.forEach(g=>{won[g.winner]=1;won[g.loser]=0});
    NAMES.forEach(t=>{
      if(won[t]===undefined)return;                    // bye week
      const wp=this.rec[t][0]/Math.max(1,this.rec[t][0]+this.rec[t][1]);
      this.roster[t].forEach((pl,i)=>{
        if(!pl||!pl.st2||!pl.st2.g)return;
        const P=POS[i%POS.length];
        pl.st=pl.st2.g;
        // voters reward production, and reward it more on a winning team
        pl.prod=statProd(P.p,pl.st2)*LEAGUE.awards.weights[P.p]*(0.72+wp*0.52);
      });
    });
  },
  mvpRace(n){
    if(!this.roster)return [];
    const all=[];
    NAMES.forEach(t=>this.roster[t].forEach((pl,i)=>{
      const sp=ENGINE_V>=26?POS[i%POS.length].p:pl.p;   // engine 26: by the slot he played (see the pro MVP)
      if(pl&&(pl.st||0)>=6)all.push({t:t,n:pl.n,p:sp,r:pl.r,c:pl.c,
        prod:pl.prod||0,line:statLine(sp,pl.st2),
        rec:this.rec[t][0]+"-"+this.rec[t][1]});
    }));
    // engine 26 (stats): each man against his position's best eight, then the voters' premium (LEAGUE.awards.premium26).
    // By raw production a back won 92% of seasons; since 2000 the Heisman has gone to a quarterback about three years
    // in four, a back about one in six, a receiver now and then
    if(ENGINE_V>=26){ const scale={}, P=LEAGUE.awards.premium26||{};
      [...new Set(all.map(x=>x.p))].forEach(p=>{const top=all.filter(x=>x.p===p).map(x=>x.prod).sort((a,b)=>b-a).slice(0,8);
        scale[p]=top.length?top.reduce((a,b)=>a+b,0)/top.length:1});
      all.forEach(x=>x.score=x.prod/Math.max(1e-9,scale[x.p])*(P[x.p]||0.8));
      all.sort((a,b)=>b.score-a.score); return all.slice(0,n||10) }
    all.sort((a,b)=>b.prod-a.prod);
    return all.slice(0,n||10);
  },
  allConference(conf){
    if(!this.roster)return [];
    const out=[];
    POS.forEach((P,i)=>{
      const best=NAMES.filter(t=>CONF[t]===conf)
        .map(t=>({t:t,pl:this.roster[t][i]}))
        .sort((a,b)=>(b.pl.prod||0)-(a.pl.prod||0))[0];
      if(best)out.push({pos:P.p,team:best.t,n:best.pl.n,r:best.pl.r,c:best.pl.c});
    });
    return out;
  },
  /* the award team a team's history entry records: its conference's */
  awardTeam(my){
    const o=this.allConfAll(),k=CONF[my];
    return {group:k,list:(o[k]||[]).map(x=>({pos:x.pos,team:x.team,n:x.n,r:x.r,c:x.c}))};
  }
});
LEAGUE.awards.teamLabel=g=>"All-"+(LEAGUE.conf.names[g]||g);
