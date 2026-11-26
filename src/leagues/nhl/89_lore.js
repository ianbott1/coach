/* ============ league life: pro hockey (round 3, engine 27; core 93_lore) ============ */
/* Years are the year a season ends (2025-26 is 2026). Regular-season records, as the NHL keeps them. */
LEAGUE.lore={yOff:1, debut:20, boss:"owner", reg:true,
  recs:[
    {k:"goals",l:"goals",s:[92,"Wayne Gretzky","Edmonton",1982],c:[929,"Alex Ovechkin","Washington",2026]},
    {k:"ast",l:"assists",s:[163,"Wayne Gretzky","Edmonton",1986],c:[1963,"Wayne Gretzky","NY Rangers",1999]},
    {k:"pts",l:"points",s:[215,"Wayne Gretzky","Edmonton",1986],c:[2857,"Wayne Gretzky","NY Rangers",1999]},
    {k:"so",l:"shutouts",pos:["G"],s:[22,"George Hainsworth","Montreal",1929],c:[125,"Martin Brodeur","St. Louis",2015]},
    {k:"sog",l:"shots on goal",s:[550,"Phil Esposito","Boston",1971]},
    {k:"W",l:"wins",team:1,s:[65,"Boston","Boston",2023]}],
  last:{Anaheim:2007,Boston:2011,Buffalo:0,Calgary:1989,Carolina:2026,Chicago:2015,Colorado:2022,Columbus:0,Dallas:1999,
    Detroit:2008,Edmonton:1990,Florida:2025,"Los Angeles":2014,Minnesota:0,Montreal:1993,Nashville:0,"New Jersey":2003,
    "NY Islanders":1983,"NY Rangers":1994,Ottawa:0,Philadelphia:1975,Pittsburgh:2017,"San Jose":0,Seattle:0,"St. Louis":2019,
    "Tampa Bay":2021,Toronto:1967,Utah:0,Vancouver:0,Vegas:2023,Washington:2018,Winnipeg:0},
  titleWord:"Stanley Cup",
  hof:{name:"Hockey Hall of Fame", wait:3, min:0, max:4, v:9, retire:1},
  awards:[
    {id:"hart",name:"Hart Trophy",mvp:1,n:3,vote:[194,[10,7,5,3,1]]},
    {id:"norris",name:"Norris Trophy",pos:["D","D2"],n:3,vote:[194,[10,7,5,3,1]]},
    {id:"vezina",name:"Vezina Trophy",pos:["G"],n:3},
    {id:"calder",name:"Calder Trophy",rookie:1,n:3,vote:[194,[10,7,5,3,1]]},
    {id:"ross",name:"Art Ross Trophy",lead:"pts"},
    {id:"richard",name:"Rocket Richard Trophy",lead:"goals"},
    {id:"adams",name:"Jack Adams Award",coach:1,n:3}],
  coach:{keep:0.92, x:0.26, h:1.6, mid:[[0.3,0.07],[0.55,0.07],[0.8,0.05]], ret:0.02}
};
