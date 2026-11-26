/* ============ league life: English football (round 3, engine 27; core 93_lore) ============ */
/* The Premier League's own book (since 1992-93), the league games only, and each club's last top-flight title. Years
   are the year a season ends (2025-26 is 2026). Clubs in the lower divisions are in the game but not in this book. */
LEAGUE.lore={yOff:1, debut:19, boss:"chairman", reg:true, lc:1, top:t=>CONF[t]==="PL",
  recs:[
    {k:"goals",l:"goals",s:[36,"Erling Haaland","Manchester City",2023],c:[260,"Alan Shearer","Newcastle United",2006]},
    {k:"ast",l:"assists",s:[21,"Bruno Fernandes","Manchester United",2026],c:[162,"Ryan Giggs","Manchester United",2014]},
    {k:"cs",l:"clean sheets",pos:["GK"],s:[24,"Petr Čech","Chelsea",2005],c:[202,"Petr Čech","Arsenal",2019]},
    {k:"P",l:"points",team:1,s:[100,"Manchester City","Manchester City",2018]}],
  last:{Arsenal:2026,"Aston Villa":1981,Bournemouth:0,Brentford:0,Brighton:0,Burnley:1960,Chelsea:2017,"Coventry City":0,
    "Crystal Palace":0,Everton:1987,Fulham:0,"Hull City":0,"Ipswich Town":1962,"Leeds United":1992,Liverpool:2025,
    "Manchester City":2024,"Manchester United":2013,"Newcastle United":1927,"Nottingham Forest":1978,Sunderland:1936,
    "Tottenham Hotspur":1961,"West Ham United":0,"Wolverhampton Wanderers":1959,"Leicester City":2016,Southampton:0,
    "Blackburn Rovers":1995,"Derby County":1975,"Sheffield Wednesday":1930,"Sheffield United":1898,Portsmouth:1950,
    "Preston North End":1890,"Huddersfield Town":1926,"West Bromwich Albion":1920},
  titleWord:"league title",
  hof:{name:"Premier League Hall of Fame", wait:1, min:0, max:4, v:7},
  awards:[
    {id:"pots",name:"Player of the Season",mvp:1,n:8},
    {id:"ypots",name:"Young Player of the Season",young:23,n:8},
    {id:"boot",name:"Golden Boot",lead:"goals"},
    {id:"glove",name:"Golden Glove",lead:"cs",pos:["GK"]},
    {id:"play",name:"Playmaker of the Season",lead:"ast"},
    {id:"mots",name:"Manager of the Season",coach:1}],
  coach:{keep:0.95, x:0.25, h:1.0, mid:[[0.15,0.25],[0.3,0.3],[0.45,0.3],[0.6,0.28],[0.75,0.2]], ret:0.01}
};
