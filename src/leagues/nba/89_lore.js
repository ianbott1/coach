/* ============ league life: pro basketball (round 3, engine 27; core 93_lore) ============ */
/* Years are the year a season ends (2025-26 is 2026). Regular-season records, as the NBA keeps them. */
LEAGUE.lore={yOff:1, debut:20, boss:"owner", reg:true,
  recs:[
    {k:"pts",l:"points",s:[4029,"Wilt Chamberlain","Philadelphia Warriors",1962],c:[43440,"LeBron James","LA Lakers",2026]},
    {k:"reb",l:"rebounds",s:[2149,"Wilt Chamberlain","Philadelphia Warriors",1961],c:[23924,"Wilt Chamberlain","LA Lakers",1973]},
    {k:"ast",l:"assists",s:[1164,"John Stockton","Utah",1991],c:[15806,"John Stockton","Utah",2003]},
    {k:"tpm",l:"three-pointers",s:[402,"Stephen Curry","Golden State",2016]},
    {k:"stl",l:"steals",s:[301,"Alvin Robertson","San Antonio",1986],c:[3265,"John Stockton","Utah",2003]},
    {k:"blk",l:"blocks",s:[456,"Mark Eaton","Utah",1985],c:[3830,"Hakeem Olajuwon","Toronto",2002]},
    {k:"W",l:"wins",team:1,s:[73,"Golden State","Golden State",2016]}],
  last:{Atlanta:1958,Boston:2024,Brooklyn:0,Charlotte:0,Chicago:1998,Cleveland:2016,Dallas:2011,Denver:2023,Detroit:2004,
    "Golden State":2022,Houston:1995,Indiana:0,"LA Clippers":0,"LA Lakers":2020,Memphis:0,Miami:2013,Milwaukee:2021,Minnesota:0,
    "New Orleans":0,"New York":2026,"Oklahoma City":2025,Orlando:0,Philadelphia:1983,Phoenix:0,Portland:1977,Sacramento:1951,
    "San Antonio":2014,Toronto:2019,Utah:0,Washington:1978},
  titleWord:"championship",
  hof:{name:"Naismith Memorial Basketball Hall of Fame", wait:3, min:1, max:4, v:9, retire:1},
  awards:[
    {id:"mvp",name:"Most Valuable Player",mvp:1,n:3,vote:[100,[10,7,5,3,1]]},
    {id:"dpoy",name:"Defensive Player of the Year",val:s=>(s.stl||0)*3+(s.blk||0)*3+(s.reb||0)*0.5,n:3,vote:[100,[5,3,1]]},
    {id:"roy",name:"Rookie of the Year",rookie:1,n:3,vote:[100,[5,3,1]]},
    {id:"coy",name:"Coach of the Year",coach:1,n:3,vote:[100,[5,3,1]]}],
  coach:{keep:0.9, x:0.18, h:2.2, mid:[[0.3,0.07],[0.6,0.07]], ret:0.02}
};
