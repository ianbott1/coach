/* ============ league life: college football (round 3, engine 27; core 93_lore) ============ */
/* The FBS record book (bowl games count, as the NCAA has counted them since 2002) and each program's last national
   title (the AP poll's, then the BCS's and the Playoff's). Years are the season's. */
LEAGUE.lore={yOff:0, boss:"athletic director", college:1,
  recs:[
    {k:"pyd",l:"passing yards",s:[5967,"Bailey Zappe","Western Kentucky",2021],c:[19217,"Case Keenum","Houston",2011]},
    {k:"ptd",l:"touchdown passes",s:[60,"Joe Burrow","LSU",2019],c:[155,"Case Keenum","Houston",2011]},
    {k:"ryd",l:"rushing yards",s:[2628,"Barry Sanders","Oklahoma State",1988],c:[6405,"Donnel Pumphrey","San Diego State",2016]},
    {k:"cyd",l:"receiving yards",s:[2060,"Trevor Insley","Nevada",1999],c:[5278,"Corey Davis","Western Michigan",2016]},
    {k:"sck",l:"sacks",s:[24,"Terrell Suggs","Arizona State",2002]},
    {k:"ints",l:"interceptions",s:[14,"Al Worley","Washington",1968],c:[29,"Al Brosky","Illinois",1952]},
    {k:"W",l:"wins",team:1,s:[16,"Indiana","Indiana",2025]}],
  last:{Indiana:2025,"Ohio State":2024,Michigan:2023,Georgia:2022,Alabama:2020,LSU:2019,Clemson:2018,"Florida State":2013,
    Auburn:2010,Florida:2008,Texas:2005,USC:2004,Miami:2001,Oklahoma:2000,Tennessee:1998,Nebraska:1997,Washington:1991,
    Colorado:1990,"Georgia Tech":1990,"Notre Dame":1988,"Penn State":1986,BYU:1984,Pittsburgh:1976,"Michigan State":1966,
    Arkansas:1964,Minnesota:1960,"Ole Miss":1960,Syracuse:1959,Iowa:1958,Maryland:1953,Army:1945,"Texas A&M":1939,TCU:1938,SMU:1935},
  titleWord:"national title",
  hof:{name:"College Football Hall of Fame", wait:10, min:8, max:16, v:1.6, aa:1},
  awards:[
    {id:"heis",name:"Heisman Trophy",mvp:1,n:4,vote:[928,[3,2,1]]},
    {id:"coy",name:"Coach of the Year",coach:1,n:3}],
  coach:{keep:0.85, x:0.08, h:2.4, mid:[[0.55,0.04]], ret:0}
};
