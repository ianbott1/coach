/* ============ league life: college basketball (round 3, engine 27; core 93_lore) ============ */
/* The Division I record book (the NCAA tournament counts) and each program's last NCAA title. Years are the year a
   season ends (2025-26 is 2026). */
LEAGUE.lore={yOff:1, boss:"athletic director", college:1,
  recs:[
    {k:"pts",l:"points",s:[1381,"Pete Maravich","LSU",1970],c:[3667,"Pete Maravich","LSU",1970]},
    {k:"reb",l:"rebounds",s:[734,"Walt Dukes","Seton Hall",1953],c:[2201,"Tom Gola","La Salle",1955]},
    {k:"ast",l:"assists",s:[406,"Mark Wade","UNLV",1987],c:[1076,"Bobby Hurley","Duke",1993]},
    {k:"tpm",l:"three-pointers",s:[162,"Stephen Curry","Davidson",2008],c:[588,"Antoine Davis","Detroit Mercy",2023]},
    {k:"blk",l:"blocks",s:[207,"David Robinson","Navy",1986],c:[564,"Jarvis Varnado","Mississippi State",2010]},
    {k:"stl",l:"steals",c:[385,"John Linehan","Providence",2002]},
    {k:"W",l:"wins",team:1,s:[38,"Kentucky","Kentucky",2015]}],
  last:{Michigan:2026,Florida:2025,UConn:2024,Kansas:2022,Baylor:2021,Virginia:2019,Villanova:2018,"North Carolina":2017,
    Duke:2015,Kentucky:2012,Syracuse:2003,Maryland:2002,"Michigan State":2000,Arizona:1997,UCLA:1995,Arkansas:1994,UNLV:1990,
    Louisville:1986,Indiana:1987,Georgetown:1984,"NC State":1983,Marquette:1977,UTEP:1966,"Loyola Chicago":1963,Cincinnati:1962,
    "Ohio State":1960,"San Francisco":1956,"La Salle":1954,"Holy Cross":1947,"Oklahoma State":1946,Utah:1944,Stanford:1942,
    Wisconsin:1941,Oregon:1939},
  titleWord:"national title",
  hof:{name:"National Collegiate Basketball Hall of Fame", wait:10, min:2, max:5, v:3.5},
  awards:[
    {id:"poy",name:"Player of the Year",mvp:1,n:4},
    {id:"coy",name:"Coach of the Year",coach:1,n:4}],
  coach:{keep:0.55, x:0.0, h:9, mid:[], ret:0}
};
