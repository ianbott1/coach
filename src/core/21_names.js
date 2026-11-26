/* Player surnames, wider (round 49). Each sport drew from 55 to 61 surnames, so six rosters in ten shared one, college
   football's nearly all, often three deep ("Pettigrew x3"). playerName still draws a first name and a surname from its
   own list, the same two draws as before, so every result is unchanged; the surname is then read through this wider
   list by a hash of the pair: the same draws, more names. */
const WIDE_LAST=["Abernathy","Achterberg","Adebayo","Agbaje","Aguilar","Ahlgren","Akintola","Alcorn","Aldana","Alvarado",
"Amadi","Ambrose","Ancheta","Arceneaux","Archuleta","Arnaud","Arrington","Ashby","Atwater","Ayodele","Babineaux","Bachman",
"Baek","Balogun","Bancroft","Barbosa","Barksdale","Battaglia","Beaumont","Becerra","Belanger","Benavides","Bergeron",
"Bertrand","Bjornstad","Blackwood","Blanchard","Bolden","Bonilla","Bouchard","Boudreaux","Brannigan","Brathwaite",
"Breckenridge","Brisbane","Brockman","Bustamante","Cabrera","Calloway","Camacho","Carrasco","Castile","Cervantes",
"Chukwu","Cisneros","Claiborne","Coleridge","Contreras","Corriveau","Covington","Crenshaw","Cuthbert","Dabney","Dalby",
"Dandridge","Dearborn","Desrosiers","Dimitrov","Dorsett","Draper","Dubois","Dumont","Duquette","Eberhardt","Egwu",
"Ellington","Emenike","Escobar","Espinoza","Etheridge","Ezeh","Fairbanks","Falcone","Farrow","Faulkner","Fennell",
"Figueroa","Fitzgerald","Fontenot","Forsberg","Fullerton","Gaines","Galloway","Garnett","Gauthier","Gentry","Giordano",
"Goodwin","Granger","Greaves","Grigsby","Guidry","Gustafson","Haddad","Halvorsen","Hammond","Harlan","Hartsfield",
"Hatcher","Haverford","Hebert","Hendrix","Hinojosa","Holloway","Huckaby","Ibekwe","Ingram","Iwobi","Jaramillo","Jessup",
"Juarez","Kaminski","Karlsson","Keane","Kettering","Kimbrough","Kingsley","Kirkwood","Kofi","Krueger","Lachance",
"Lafleur","Landry","Langston","Laroche","Ledbetter","Lemieux","Lindqvist","Lockhart","Lombardi","Lundgren","Maddox",
"Malone","Mancini","Marchand","Marlowe","Mbeki","McCullough","Medeiros","Mendoza","Merriweather","Mitchum","Moncrief",
"Montague","Moreau","Moynihan","Munoz","Nakamura","Navarro","Ndiaye","Nesbitt","Nordstrom","Nunez","Obi","Ochoa",
"Odom","Ogbonna","Olsen","Onyeka","Orozco","Ouellette","Pacheco","Padilla","Pankratz","Paquette","Pemberton","Penick",
"Peralta","Perrault","Pinckney","Plummer","Poirier","Prioleau","Quarles","Quintero","Radcliffe","Ramsey","Rasmussen",
"Redmond","Rigsby","Rinaldi","Rochester","Rousseau","Rutherford","Saavedra","Sakamoto","Salinger","Santana","Saucier",
"Schaefer","Seabrook","Sepulveda","Shackleford","Silvestri","Simmonds","Slocum","Soto","Spearman","Stanhope",
"Steadman","Strickland","Sundqvist","Swann","Tafoya","Takahashi","Talbert","Tanaka","Teague","Thornbury","Toussaint",
"Trujillo","Tubman","Underhill","Uzoma","Valdez","Valentin","Vanterpool","Varga","Villanueva","Waddell","Wakefield",
"Walcott","Watanabe","Wexler","Whitlock","Wilder","Winslow","Woodard","Wyatt","Yancey","Yeboah","Ybarra","Zamora",
"Zeller","Zielinski","Zimmerman"];
function wideLast(f,l,base){ const pool=wideLast.pool||(wideLast.pool=Array.from(new Set(base.concat(WIDE_LAST))));
  return pool[strHash(f+"/"+l)%pool.length] }
/* a new roster (a league's first day): no surname twice, a repeat re-read by hash, so no draw moves. Rosters later
   fill from drafts, classes and transfers, where a shared surname can still come (real rosters have them too), and
   commentary then adds the initial (surnameIn). */
function distinctSurnames(r){ const pool=wideLast.pool||[], seen=new Set(), last=n=>n.slice(n.indexOf(" ")+1);
  r.forEach((p,i)=>{ if(!p||!p.n||!pool.length)return; let l=last(p.n);
    if(seen.has(l)){ const h=strHash(p.n+"|"+i); for(let k=0;k<pool.length&&seen.has(l);k++)l=pool[(h+k)%pool.length]; p.n=p.n.slice(0,p.n.indexOf(" ")+1)+l }
    seen.add(l) });
  return r }
/* college: a summer's newcomers take a first name and a surname nobody else on their roster has (playtest: four
   Kel'els, two Spearmans and two Guidrys on one college basketball roster). Only men nobody has met yet are renamed:
   the freshmen the computer signed and the walk-ons who fill a spot. Everyone who was on a roster before (returners,
   transfers) and a recruit you signed off your board keep their names; a new career renames before its first screen.
   By hash, so no draw moves; a name is changed only where a free one exists. */
function distinctNewcomers(u,known){
  if(!u.roster||!(LEAGUE.classes&&LEAGUE.classes.length))return;
  const F=typeof PNAMES_F!=="undefined"?PNAMES_F:FIRST, L=wideLast.pool||(typeof PNAMES_L!=="undefined"?PNAMES_L:[]);
  const first=n=>n.slice(0,n.indexOf(" ")), last=n=>n.slice(n.indexOf(" ")+1);
  NAMES.forEach(t=>{ const R=u.roster[t]; if(!R)return;
    const kept=x=>known.has(x)||x.board, fs=new Set(), ls=new Set();
    R.forEach(p=>{ if(p&&p.n&&p.n.indexOf(" ")>0&&kept(p)){ fs.add(first(p.n)); ls.add(last(p.n)) } });
    R.forEach((p,i)=>{ if(!p||!p.n||p.n.indexOf(" ")<0||kept(p))return; let f=first(p.n), l=last(p.n); const h=strHash(p.n+"|"+t+"|"+i);
      if(fs.has(f))for(let k=0;k<F.length;k++){ const g=F[(h+k)%F.length]; if(!fs.has(g)){ f=g; break } }
      if(ls.has(l))for(let k=0;k<L.length;k++){ const g=L[(h+k)%L.length]; if(!ls.has(g)){ l=g; break } }
      p.n=f+" "+l; fs.add(f); ls.add(l) }) });
}
