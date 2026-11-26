/* ============ league life: pro football (round 3, engine 27; core 93_lore) ============ */
/* The real record book as the game opens (regular season, as the NFL keeps it), each team's last title (the Super Bowl
   or, before it, the NFL or AFL championship), the Hall of Fame's rule, the awards and the carousel's rate. Years are
   the season's. Sources: CHANGELOG-review/league-life.md. */
LEAGUE.lore={yOff:0, debut:22, boss:"owner", reg:true,
  recs:[
    {k:"pyd",l:"passing yards",s:[5477,"Peyton Manning","Denver",2013],c:[89214,"Tom Brady","Tampa Bay",2022]},
    {k:"ptd",l:"touchdown passes",s:[55,"Peyton Manning","Denver",2013],c:[649,"Tom Brady","Tampa Bay",2022]},
    {k:"ryd",l:"rushing yards",s:[2105,"Eric Dickerson","LA Rams",1984],c:[18355,"Emmitt Smith","Arizona",2004]},
    {k:"cyd",l:"receiving yards",s:[1964,"Calvin Johnson","Detroit",2012],c:[22895,"Jerry Rice","Seattle",2004]},
    {k:"sck",l:"sacks",s:[22.5,"Michael Strahan","NY Giants",2001],c:[200,"Bruce Smith","Washington",2003]},
    {k:"ints",l:"interceptions",s:[14,"Dick \"Night Train\" Lane","LA Rams",1952],c:[81,"Paul Krause","Minnesota",1979]},
    {k:"W",l:"wins",team:1,s:[16,"New England","New England",2007]}],
  last:{Buffalo:1965,Miami:1973,"New England":2018,"NY Jets":1968,Baltimore:2012,Cincinnati:0,Cleveland:1964,Pittsburgh:2008,
    Houston:0,Indianapolis:2006,Jacksonville:0,Tennessee:1961,Denver:2015,"Kansas City":2023,"Las Vegas":1983,"LA Chargers":1963,
    Dallas:1995,"NY Giants":2011,Philadelphia:2024,Washington:1991,Chicago:1985,Detroit:1957,"Green Bay":2010,Minnesota:1969,
    Atlanta:0,Carolina:0,"New Orleans":2009,"Tampa Bay":2020,Arizona:1947,"LA Rams":2021,"San Francisco":1994,Seattle:2025},
  titleWord:"championship",
  hof:{name:"Pro Football Hall of Fame", wait:5, min:3, max:5, v:9, retire:1},
  awards:[
    {id:"mvp",name:"Most Valuable Player",mvp:1,n:5,vote:[50,[10,5,3,2,1]]},
    {id:"opoy",name:"Offensive Player of the Year",pos:["QB","RB","WR","WR2"],n:5,vote:[50,[10,5,3,2,1]]},
    {id:"dpoy",name:"Defensive Player of the Year",pos:["EDGE","DT","LB","CB","S"],n:5,vote:[50,[10,5,3,2,1]]},
    {id:"oroy",name:"Offensive Rookie of the Year",pos:["QB","RB","WR","WR2"],rookie:1,n:5,vote:[50,[10,5,3,2,1]]},
    {id:"droy",name:"Defensive Rookie of the Year",pos:["EDGE","DT","LB","CB","S"],rookie:1,n:5,vote:[50,[10,5,3,2,1]]},
    {id:"coy",name:"Coach of the Year",coach:1,n:5,vote:[50,[10,5,3,2,1]]}],
  coach:{keep:0.9, x:0.08, h:2.2, mid:[[0.45,0.06],[0.7,0.06]], ret:0.025}
};
