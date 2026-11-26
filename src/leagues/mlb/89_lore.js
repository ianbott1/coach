/* ============ league life: pro baseball (round 3, engine 27; core 93_lore) ============ */
/* Years are the season's. Regular-season records, as MLB keeps them. The awards go one to each league (AL, NL). */
LEAGUE.lore={yOff:0, debut:24, boss:"owner", reg:true, sides:1,
  recs:[
    {k:"hr",l:"home runs",s:[73,"Barry Bonds","San Francisco",2001],c:[762,"Barry Bonds","San Francisco",2007]},
    {k:"h",l:"hits",s:[262,"Ichiro Suzuki","Seattle",2004],c:[4256,"Pete Rose","Cincinnati",1986]},
    {k:"rbi",l:"runs batted in",s:[191,"Hack Wilson","Chicago Cubs",1930],c:[2297,"Hank Aaron","Milwaukee",1976]},
    {k:"w",l:"wins",pit:1,s:[41,"Jack Chesbro","New York Highlanders",1904],c:[511,"Cy Young","Boston",1911]},
    {k:"k",l:"strikeouts",pit:1,s:[383,"Nolan Ryan","California",1973],c:[5714,"Nolan Ryan","Texas",1993]},
    {k:"sv",l:"saves",pit:1,s:[62,"Francisco Rodriguez","LA Angels",2008],c:[652,"Mariano Rivera","NY Yankees",2013]},
    {k:"W",l:"wins",team:1,s:[116,"Seattle","Seattle",2001]}],
  last:{Arizona:2001,Atlanta:2021,Baltimore:1983,Boston:2018,"Chicago Cubs":2016,"Chicago White Sox":2005,Cincinnati:1990,
    Cleveland:1948,Colorado:0,Detroit:1984,Houston:2022,"Kansas City":2015,"LA Angels":2002,"LA Dodgers":2025,Miami:2003,
    Milwaukee:0,Minnesota:1991,"NY Mets":1986,"NY Yankees":2009,Sacramento:1989,Philadelphia:2008,Pittsburgh:1979,
    "San Diego":0,"San Francisco":2014,Seattle:0,"St. Louis":2011,"Tampa Bay":0,Texas:2023,Toronto:1993,Washington:2019},
  titleWord:"World Series",
  hof:{name:"Baseball Hall of Fame", wait:5, min:0, max:4, v:9, retire:1, pct:75, years:10},
  awards:[
    {id:"mvp",name:"Most Valuable Player",mvp:1,side:1,pitW:0.6,n:3,vote:[30,[14,9,8,7,6,5,4,3,2,1]]},
    {id:"cy",name:"Cy Young Award",pos:["SP","SP2","SP3","CL"],side:1,n:3,vote:[30,[7,4,3,2,1]]},
    {id:"roy",name:"Rookie of the Year",rookie:1,side:1,n:3,vote:[30,[5,3,1]]},
    {id:"moy",name:"Manager of the Year",coach:1,side:1,n:3,vote:[30,[5,3,1]]}],
  coach:{keep:0.9, x:0.04, h:2.4, mid:[[0.35,0.09],[0.65,0.08]], ret:0.03}
};
