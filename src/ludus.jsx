import React, { useState, useEffect, useRef } from "react";
import { Coins, Star, Crown, Flame, Swords, Shield, Wine, Users, Landmark, ShoppingBag, X, ChevronRight, Check, Settings } from "lucide-react";

/* ================= LUDUS — a lanista's chronicle ================= */

const CSS = `
*,*::before,*::after{box-sizing:border-box}
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');
.lr{overflow-x:clip;max-width:100%;background:#171210;background-image:radial-gradient(1100px 560px at 50% -8%, #2b2115 0%, #171210 62%);color:#e8d9b8;font-family:'Cormorant Garamond',Georgia,serif;min-height:100vh;font-size:17px;line-height:1.45}
.shell{position:relative;min-height:100vh}
.scroll{width:100%}
.bar{flex:0 0 auto}
.disp{font-family:'Cinzel',serif;letter-spacing:.1em}
.panel{background:linear-gradient(165deg,#261d15,#1d1610);border:1px solid #3e2f1f;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.35)}
.btn{font-family:'Cinzel',serif;letter-spacing:.07em;font-size:12px;text-transform:uppercase;padding:10px 14px;border-radius:8px;border:1px solid #6d5426;background:linear-gradient(180deg,#3a2c18,#2a1f10);color:#dfc389;cursor:pointer;transition:filter .15s}
.btn:hover{filter:brightness(1.18)}
.btn:disabled{opacity:.38;cursor:not-allowed}
.btn-blood{border-color:#7c2a22;background:linear-gradient(180deg,#5c221b,#411713);color:#eab6a8}
.btn-ghost{background:transparent;border-color:#4a3a26;color:#b9a37c}
.gold{color:#d8ac5f}.blood{color:#d96f5d}.laurel{color:#9aa86a}.dim{color:#b09b7d}
.tag{display:inline-block;font-family:'Cinzel',serif;font-size:10px;letter-spacing:.09em;text-transform:uppercase;padding:2px 7px;border:1px solid #4a3a26;border-radius:99px;color:#b9a37c}
.tag-blood{border-color:#7c2a22;color:#d98476}
.tag-gold{border-color:#8a6a2c;color:#e0bd72}
.track{height:7px;border-radius:99px;background:#120d09;border:1px solid #33271a;overflow:hidden}
.fill{height:100%;border-radius:99px;transition:width .4s}
.tabbtn{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 2px 7px;color:#a08d6b;font-family:'Cinzel',serif;font-size:9px;letter-spacing:.04em;text-transform:uppercase;background:none;border:none;cursor:pointer;border-top:2px solid transparent;overflow:hidden;white-space:nowrap}
.tabbtn.on{color:#e0bd72;border-top-color:#c99a4b}
.modalwrap{position:fixed;inset:0;background:rgba(10,7,5,.84);display:flex;align-items:flex-end;justify-content:center;z-index:50}
.modal{width:100%;max-width:560px;box-sizing:border-box;max-height:92vh;overflow-y:auto;background:linear-gradient(170deg,#292017,#1a1410);border:1px solid #4e3c26;border-radius:14px 14px 0 0;padding:18px}
@media(min-width:640px){.modalwrap{align-items:center}.modal{border-radius:14px}}
.tickline{padding:4px 0;border-bottom:1px dotted #33271a;animation:tick .35s ease-out}
@keyframes tick{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.sel{background:#1a1410;border:1px solid #4a3a26;color:#e8d9b8;border-radius:7px;padding:8px 10px;font-family:'Cormorant Garamond',Georgia,serif;font-size:15px}
.chip{font-family:'Cinzel',serif;font-size:10px;letter-spacing:.07em;text-transform:uppercase;padding:6px 10px;border-radius:99px;border:1px solid #4a3a26;background:none;color:#b9a37c;cursor:pointer}
.chip.on{border-color:#c99a4b;color:#e0bd72;background:#2b2115}
.focusbtn{font-family:'Cinzel',serif;font-size:12px;letter-spacing:.04em;min-height:46px;padding:8px 4px;
  border-radius:8px;border:1px solid #4a3a26;background:#1a1410;color:#b9a37c;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;line-height:1.15;transition:border-color .15s}
.focusbtn:hover{border-color:#6d5426}
.focusbtn.on{border-color:#c99a4b;color:#e8d092;background:linear-gradient(180deg,#3a2c18,#2a1f10)}
.focusbtn .sub{font-family:'Cormorant Garamond',Georgia,serif;font-size:10.5px;letter-spacing:0;opacity:.75}
.arena{position:relative;overflow:hidden;border-radius:10px;border:1px solid #4e3c26;height:232px;
  background:linear-gradient(#0d0a07 0%,#14100b 26%,#2a2013 29%,#3f2f1a 33%,#6d5531 58%,#9a7844 100%)}
.v-pit{background:linear-gradient(#0a0806 0%,#100d09 30%,#241c12 34%,#4a3a22 62%,#6b5433 100%)!important;border-color:#3e2f1f!important}
.v-yard{background:linear-gradient(#0f0d0c 0%,#1a1715 24%,#3a3630 28%,#6e6a62 40%,#a8a498 72%,#c9c5b8 100%)!important;border-color:#6d6656!important}
.v-field{background:linear-gradient(#0b0d08 0%,#131710 26%,#26301c 31%,#3d4b2a 55%,#5c6f3c 100%)!important;border-color:#4a5a35!important}
.v-amphi{background:linear-gradient(#0d0a07 0%,#181209 22%,#3a2c18 27%,#6d5531 55%,#a88a52 100%)!important;border-color:#6d5426!important}
.v-imperial{background:linear-gradient(#0d0a09 0%,#1c1510 20%,#4a3820 26%,#8a6c3c 52%,#cba765 100%)!important;border-color:#c99a4b!important}
.v-harbour{background:linear-gradient(#0a0c0e 0%,#121820 24%,#2c3038 29%,#6a6250 56%,#9d9068 100%)!important;border-color:#5a6270!important}
.wound{position:absolute;border-radius:50%;background:#7c1d14;pointer-events:none}
.arenashake{animation:shk .3s}
@keyframes shk{0%,100%{transform:translate(0,0)}20%{transform:translate(-4px,2px)}40%{transform:translate(4px,-2px)}60%{transform:translate(-3px,-1px)}80%{transform:translate(3px,1px)}}
.crowdrow{position:absolute;top:0;left:0;right:0;height:56px;display:flex;align-items:flex-end;justify-content:center;gap:3px;padding:0 4px;overflow:hidden}
.chead{width:9px;border-radius:99px 99px 2px 2px;background:#0b0806;flex:0 0 auto}
.roar{position:absolute;inset:0;pointer-events:none;transition:opacity .5s;
  background:radial-gradient(70% 46% at 50% 2%, rgba(255,186,92,.22), transparent 72%)}
.dust{position:absolute;left:0;right:0;bottom:0;height:52px;pointer-events:none;
  background:radial-gradient(60% 100% at 50% 100%, rgba(224,189,114,.13), transparent 70%)}
.fig{position:absolute;bottom:14px;transition:transform .26s cubic-bezier(.3,1.5,.5,1);transform-origin:50% 100%}
.bob{animation:bob 2.4s ease-in-out infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
.spurt{position:absolute;width:5px;height:5px;border-radius:99px;background:#a81d14;pointer-events:none;animation:spr .72s ease-out forwards}
@keyframes spr{0%{opacity:.95;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.35)}}
.hitflash{position:absolute;inset:0;pointer-events:none;background:rgba(200,40,25,.16);animation:flash .3s ease-out forwards}
@keyframes flash{to{opacity:0}}
.momtrack{height:5px;border-radius:99px;background:#120d09;border:1px solid #33271a;position:relative;overflow:hidden}
.momfill{position:absolute;top:0;bottom:0;background:linear-gradient(90deg,#8a6a2c,#d8ac5f);transition:all .3s}
.caption{min-height:52px;font-size:16.5px;line-height:1.34}
:focus-visible{outline:2px solid #e0bd72;outline-offset:2px;border-radius:6px}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.rowname{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rowval{flex-shrink:0;white-space:nowrap}
.flex{display:flex}.flex-col{flex-direction:column}
.items-center{align-items:center}.items-end{align-items:flex-end}
.justify-between{justify-content:space-between}.justify-center{justify-content:center}
.gap-1{gap:4px}.gap-2{gap:8px}.gap-3{gap:12px}.gap-4{gap:16px}
.gap-x-4{column-gap:16px}.gap-y-2{row-gap:8px}
.grid{display:grid}
.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
.grid-cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}
.selbtn{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;
  background:#1a1410;border:1px solid #4a3a26;color:#e8d9b8;border-radius:7px;padding:9px 11px;
  font-family:'Cormorant Garamond',Georgia,serif;font-size:15px;text-align:left;cursor:pointer;transition:border-color .15s}
.selbtn:hover{border-color:#6d5426}
.optrow{width:100%;text-align:left;padding:11px;margin-bottom:7px;cursor:pointer;color:inherit;font:inherit;
  background:linear-gradient(165deg,#261d15,#1d1610);border:1px solid #3e2f1f;border-radius:10px}
.optrow.on{border-color:#c99a4b;background:linear-gradient(165deg,#332816,#241b11)}
.reduce-motion *,.reduce-motion *::before,.reduce-motion *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}
.lr.large-text{font-size:19.5px}
/* colourblind-friendly: the confusable pair here is "good" green vs "bad" red — remap green to a blue that reads clear against the red for red-green colour vision */
.lr.cb .laurel{color:#5aa9e6}
.lr.cb .dot-good{background:#5aa9e6}
.sect{border:1px solid #3e2f1f;border-radius:10px;background:linear-gradient(165deg,#241b11,#1d1610);overflow:hidden}
.sect>summary{list-style:none;cursor:pointer;padding:12px 13px;display:flex;align-items:center;justify-content:space-between;gap:8px;
  font-family:'Cinzel',serif;font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:#d8ac5f}
.sect>summary::-webkit-details-marker{display:none}
.sect>summary .chev{font-size:15px;color:#8a6a2c;line-height:1;transition:transform .15s;flex:0 0 auto}
.sect[open]>summary .chev{transform:rotate(180deg)}
.sect>.sectbody{padding:0 13px 13px}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}.spurt{display:none}.hitflash{display:none}}
`;

/* Colourblind remap. Status colour across the game is green = good, red = bad, with
   amber/tan in between — and green vs red is exactly the pair red-green colour vision
   cannot separate. When the pref is on, cbc() turns the greens blue at the few colour
   helpers and the Bar fill they all pass through; reds and ambers stay as they are. */
let CB_ON = false;
const CB_GREEN = { "#9aa86a":"#5aa9e6", "#8a9a5b":"#4e9fd8", "#b9c58a":"#8fc3ea" };
const cbc = c => (CB_ON && typeof c==="string" && CB_GREEN[c.toLowerCase()]) || c;

const STATS = ["str","agi","end","tec","sho","dis"];
const STAT_NAMES = { str:"Strength", agi:"Agility", end:"Endurance", tec:"Technique", sho:"Showmanship", dis:"Discipline" };

const ORIGINS = {
  Thracian: { mod:{str:2,tec:1,sho:1,end:1,dis:-1,agi:0}, blurb:"fury of the mountain tribes",
    names:["Sitalkes","Rhaskos","Bithus","Cotys","Seuthes","Teres","Mucapor","Ziles","Dromas","Spartokos","Amatokos","Medokos","Kersebleptes","Rhoemetalces","Sadalas","Bergaios","Diegylis","Zibelmios","Rhescuporis","Beithys","Tarutinos","Auluzenes","Dolens","Zipoites","Skostokos","Rholes","Oroles","Dromichaetes","Burebista","Napris"] },
  Gaul: { mod:{str:3,end:2,tec:-1,agi:0,sho:0,dis:0}, blurb:"wild strength of the north",
    names:["Crixus","Gannicus","Brennus","Segovax","Ambiorix","Dumnorix","Litavicus","Viridomar","Orgetorix","Catuvolcus","Vercingetorix","Cingetorix","Divico","Camulogenus","Boduognatus","Indutiomarus","Cassivellaunus","Commius","Correus","Lucterius","Acco","Eporedorix","Sedullus","Vertico","Bituitus","Cavarillus","Teutomatus","Gutuater","Convictolitavis","Adiatorix"] },
  Numidian: { mod:{agi:3,end:2,str:-1,tec:0,sho:0,dis:0}, blurb:"swift as desert wind",
    names:["Juba","Masinissa","Gulussa","Micipsa","Jugurtha","Naravas","Oxynta","Capussa","Barca","Adherbal","Syphax","Vermina","Massiva","Hiempsal","Mastanabal","Gauda","Bocchus","Bogud","Iarbas","Tacfarinas","Firmus","Nubel","Gildo","Mazippa","Bomilcar","Hanno","Gala","Aptasa","Sacar","Zabari"] },
  Greek: { mod:{tec:2,dis:2,sho:1,str:-1,agi:0,end:0}, blurb:"schooled in the old arts",
    names:["Nikandros","Theron","Lykos","Demetrios","Kallias","Philon","Xanthos","Alexios","Oenomaus","Hektor","Aristion","Diophantos","Menandros","Timon","Kleon","Polydeukes","Herakleides","Sostratos","Kritias","Aineas","Melanthios","Pyrrhos","Isidoros","Nikias","Damon","Leonidas","Kastor","Straton","Zenon","Agathon"] },
  Syrian: { mod:{sho:2,agi:2,tec:1,end:-1,str:0,dis:0}, blurb:"a flair the crowd adores",
    names:["Azizus","Malchus","Barates","Zabdas","Iarhai","Abgar","Sohaemus","Bassus","Odainath","Wahballat","Zenobios","Mocimu","Hairan","Antiochos","Seleukos","Zabbaios","Nasor","Themarsa","Ogelos","Taimarsu","Bariki","Zabdibol","Yedibel","Nebuzabad","Worod","Marinos","Zabdilah","Alaphata","Male","Simon"] },
  Iberian: { mod:{tec:2,agi:1,end:1,dis:1,str:0,sho:-1}, blurb:"born to the blade",
    names:["Indibilis","Mandonius","Audax","Ditalco","Minurus","Corocotta","Retogenes","Istolatius","Viriathus","Tautalus","Olyndicus","Caros","Megaravicus","Allucius","Culchas","Bilistages","Cerdubelus","Luxinius","Turrus","Colua","Besadines","Cordus","Attenes","Balarus","Tanginus","Elandus","Turaius","Sanga","Ambon","Docilico"] },
  Germanic: { mod:{str:2,end:3,sho:-1,dis:-1,agi:0,tec:0}, blurb:"relentless as winter",
    names:["Agron","Segimer","Chariovalda","Sigmund","Baldric","Warin","Theudobald","Duro","Arminius","Segestes","Inguiomerus","Maroboduus","Catualda","Chariomerus","Ariovistus","Nasua","Cimberius","Flavus","Italicus","Baetorix","Actumerus","Vadomarius","Gundomar","Ricmer","Radbod","Wulfric","Adalhard","Gernot","Hildebrand","Ansgar"] },
};

const FNAMES = {
  Thracian:["Bendida","Zoila","Rhodope","Sitalka","Teuta","Berenike","Doris","Kotyto","Meda","Rhescupa","Bithynis","Seuthia","Zibela","Amytis","Tereia"],
  Gaul:["Boudica","Epona","Rigantona","Cartimandua","Damona","Solimara","Nantosuelta","Rosmerta","Sirona","Andarta","Belisama","Bricta","Sequana","Divona","Icovellauna"],
  Numidian:["Tanit","Sophonisba","Zaina","Massyla","Kahina","Aelia","Dihya","Kella","Iaia","Numida","Salammbo","Tanaquil","Bomilca","Iarbia","Tinhinan"],
  Greek:["Achillia","Amazonia","Thalia","Kleio","Melite","Phoibe","Xanthe","Lysandra","Kallisto","Theodora","Eirene","Areta","Glykera","Chryseis","Melissa"],
  Syrian:["Zenobia","Bathzabbai","Aziza","Shamsi","Martha","Salma","Julia","Domna","Maesa","Mamaea","Soaemias","Nafsha","Amtallat","Batzabai","Marthein"],
  Iberian:["Ilerda","Bastia","Turia","Aracia","Baria","Nerea","Segia","Contrebia","Numantia","Complega","Uxama","Tagia","Arsia","Belia","Cauca"],
  Germanic:["Ganna","Veleda","Alruna","Swanhild","Thusnelda","Frida","Ramis","Gudrun","Sigrun","Brunhild","Ostara","Waldrada","Hildegund","Ermengard","Adela"],
};
/* Pronouns, so the chronicle is not talking about the wrong person. */
const PR = g => (g && g.sex==="f")
  ? { he:"she", him:"her", his:"her", He:"She", Him:"Her", His:"Her", man:"woman", Man:"Woman" }
  : { he:"he", him:"him", his:"his", He:"He", Him:"Him", His:"His", man:"man", Man:"Man" };
const isF = g => !!g && g.sex==="f";

const CLASSES = {
  Murmillo: { key:["str","end"], desc:"Heavy shield and gladius. The wall that advances." },
  Thraex: { key:["tec","agi"], desc:"Curved sica and small shield. Finds every gap." },
  Hoplomachus: { key:["tec","dis"], desc:"Spear and dagger in the Greek fashion. Keeps his distance." },
  Secutor: { key:["str","dis"], desc:"Smooth helm, heavy shield. Bred to hunt net-men." },
  Retiarius: { key:["agi","sho"], desc:"Net and trident, no helm. Nowhere, then everywhere." },
  Dimachaerus: { key:["agi","tec"], desc:"A blade in each hand and nothing to hide behind." },
};
const COUNTERS = { Murmillo:"Thraex", Thraex:"Hoplomachus", Hoplomachus:"Secutor", Secutor:"Retiarius", Retiarius:"Dimachaerus", Dimachaerus:"Murmillo" };

/* ================= EQUIPMENT =================
   atk raises power, def cuts incoming damage, spd eases stamina drain, sho works the crowd.
   Gear outside a man's own style still works, but clumsily. */
const GEAR = {
  // --- WEAPONS ---
  gladius:  {slot:"weapon",art:"sword",  name:"Gladius",          stock:1, price:30,   atk:.05,def:0,   spd:0,   sho:0,   styles:["Murmillo","Secutor","Hoplomachus"], desc:"Short, straight, brutally efficient."},
  gladius_f:{slot:"weapon",art:"sword",  name:"Noric Gladius",    price:260, atk:.09,def:.02, spd:.01, sho:.02, styles:["Murmillo","Secutor","Hoplomachus"], desc:"Folded northern steel. Holds its edge through a long day."},
  sica:     {slot:"weapon",art:"curved", name:"Sica",             stock:1, price:32,   atk:.05,def:0,   spd:.02, sho:.03, styles:["Thraex"], desc:"The curved Thracian blade. Finds what hides behind a shield."},
  sica_f:   {slot:"weapon",art:"curved", name:"Serpent Sica",     price:280, atk:.09,def:0,   spd:.03, sho:.05, styles:["Thraex"], desc:"A wicked hook of a blade, chased with silver."},
  hasta:    {slot:"weapon",art:"spear",  name:"Hasta",            stock:1, price:34,   atk:.06,def:.03, spd:-.01,sho:0,   styles:["Hoplomachus"], desc:"Keeps a man at arm's length — and then some."},
  hasta_f:  {slot:"weapon",art:"spear",  name:"Ash Hasta",        price:300, atk:.10,def:.04, spd:-.01,sho:.02, styles:["Hoplomachus"], desc:"Ash and iron, balanced to a hair."},
  fuscina:  {slot:"weapon",art:"trident",name:"Fuscina",          stock:1, price:36,   atk:.06,def:.02, spd:.02, sho:.04, styles:["Retiarius"], desc:"Three points, and the reach to use them."},
  fuscina_f:{slot:"weapon",art:"trident",name:"Barbed Fuscina",   price:290, atk:.10,def:.02, spd:.02, sho:.06, styles:["Retiarius"], desc:"Barbed points that do not come free clean."},
  twin_b:   {slot:"weapon",art:"dual",   name:"Paired Blades",     stock:1, price:38,  atk:.06,def:-.07,spd:.03, sho:.05, styles:["Dimachaerus"], desc:"Two plain swords off the rack. Nothing to hide behind and nothing to boast of."},
  twin:     {slot:"weapon",art:"dual",   name:"Twin Blades",      price:420, atk:.13,def:-.08,spd:.03, sho:.11, styles:["Dimachaerus"], desc:"Two swords, no shield. Every wound you take is one the crowd sees."},
  twin_f:   {slot:"weapon",art:"dual",   name:"Dimachaerus Pair", price:700, atk:.16,def:-.07,spd:.03, sho:.16, styles:["Dimachaerus"], desc:"Matched blades, mirror-bright. Death in either hand."},
  securis:  {slot:"weapon",art:"axe",    name:"Securis",          price:350, atk:.15,def:-.04,spd:-.06,sho:.07, styles:["Murmillo","Secutor"], desc:"A headsman's axe. Slow, and final."},
  pugio:    {slot:"weapon",art:"dagger", name:"Pugio",            price:80,  atk:-.03,def:0,  spd:.09, sho:-.02,styles:[], desc:"A last resort — or a fast man's whole plan."},
  // --- OFFHAND ---
  scutum:   {slot:"offhand",art:"scutum", name:"Scutum",          stock:1, price:45,   atk:0,  def:.15, spd:-.06,sho:0,   styles:["Murmillo","Secutor"], desc:"A wall you carry. Heavy as sin."},
  scutum_f: {slot:"offhand",art:"scutum", name:"Bronzed Scutum",  price:320, atk:0,  def:.18, spd:-.05,sho:.03, styles:["Murmillo","Secutor"], desc:"Oak faced in bronze. Turns an axe."},
  parmula:  {slot:"offhand",art:"parmula",name:"Parmula",         stock:1, price:30,   atk:.02,def:.08, spd:-.01,sho:.01, styles:["Thraex","Dimachaerus"], desc:"Small and square. Trades cover for speed."},
  clipeus:  {slot:"offhand",art:"clipeus",name:"Clipeus",         stock:1, price:34,   atk:0,  def:.11, spd:-.03,sho:.01, styles:["Hoplomachus"], desc:"The round Greek shield."},
  rete:     {slot:"offhand",art:"net",    name:"Rete",            stock:1, price:28,   atk:.04,def:.03, spd:.01, sho:.07, styles:["Retiarius"], desc:"Cast well and the fight is already over."},
  offnone:  {slot:"offhand",art:"none",   name:"Free Hand",       stock:1, price:0,   atk:.03,def:-.03,spd:.04, sho:.04, styles:[], desc:"Nothing to hide behind, and nothing to slow him."},
  // --- HELMS ---
  galea_m:  {slot:"helm",art:"crest",  name:"Crested Galea",      stock:1, price:40,   atk:0,  def:.08, spd:-.02,sho:.03, styles:["Murmillo","Dimachaerus","Secutor"], desc:"Tall crest, broad brim, heavy as a bucket."},
  galea_s:  {slot:"helm",art:"smooth", name:"Secutor Helm",       stock:1, price:42,   atk:0,  def:.11, spd:-.03,sho:-.02,styles:["Secutor"], desc:"Smooth and faceless, so a net finds no purchase."},
  galea_t:  {slot:"helm",art:"griffin",name:"Griffin Galea",      stock:1, price:38,   atk:0,  def:.07, spd:-.02,sho:.06, styles:["Thraex"], desc:"Crowned with a griffin. The crowd knows it at fifty paces."},
  galea_h:  {slot:"helm",art:"brim",   name:"Brimmed Galea",      stock:1, price:38,   atk:0,  def:.08, spd:-.02,sho:.03, styles:["Hoplomachus"], desc:"Wide brim, plumed. Greek fashion."},
  galea_x:  {slot:"helm",art:"silver", name:"Silvered Galea",     price:380, atk:0,  def:.10, spd:-.02,sho:.10, styles:[], desc:"Silver chasing and a scarlet plume. Editors remember a man in this."},
  helmnone: {slot:"helm",art:"bare",   name:"Bare Head",          stock:1, price:0,   atk:.02,def:-.05,spd:.05, sho:.08, styles:[], desc:"Let them see his face. Let them learn his name."},
  // --- ARMOR ---
  manica:   {slot:"armor",art:"manica", name:"Manica",            stock:1, price:26,   atk:0,  def:.06, spd:-.01,sho:0,   styles:[], desc:"Layered linen and leather down the sword arm."},
  ocreae:   {slot:"armor",art:"greaves",name:"Ocreae",            stock:1, price:24,   atk:0,  def:.07, spd:-.02,sho:.01, styles:[], desc:"Bronze greaves. A man fights on his legs."},
  subarm:   {slot:"armor",art:"padded", name:"Subarmalis",        price:240, atk:0,  def:.14, spd:-.06,sho:0,   styles:[], desc:"Padded torso guard. Slow, but you keep your ribs."},
  gilded:   {slot:"armor",art:"gilded", name:"Gilded Harness",    price:520, atk:0,  def:.12, spd:-.04,sho:.12, styles:[], desc:"Gold leaf over good iron. Vanity that happens to work."},
  armnone:  {slot:"armor",art:"none",   name:"Bare",              stock:1, price:0,   atk:.02,def:-.04,spd:.07, sho:.03, styles:[], desc:"Nothing but a loincloth and nerve."},

  // --- MORE WEAPONS ---
  gladius_m:{slot:"weapon",art:"sword",  name:"Legion Gladius",    price:130, atk:.07,def:.01, spd:.01, sho:.01, styles:["Murmillo","Secutor","Hoplomachus"], desc:"Army pattern, army price. More blade than the rack, less than the master's."},
  spatha:   {slot:"weapon",art:"sword",  name:"Spatha",            price:360, atk:.13,def:.01, spd:-.02,sho:.05, styles:["Murmillo","Secutor"], desc:"A long cavalry sword. Reach and weight, at the cost of a quick hand."},
  sica_m:   {slot:"weapon",art:"curved", name:"Honed Sica",        price:130, atk:.07,def:0,   spd:.025,sho:.04, styles:["Thraex"], desc:"A working sica kept sharp enough to shave. No silver, all edge."},
  falx:     {slot:"weapon",art:"curved", name:"Falx",              price:400, atk:.16,def:-.05,spd:-.03,sho:.09, styles:["Thraex"], desc:"The two-handed Dacian hook. It takes a shield arm off at the elbow, and the crowd with it."},
  hasta_m:  {slot:"weapon",art:"spear",  name:"Iron Hasta",        price:150, atk:.08,def:.035,spd:-.01,sho:.01, styles:["Hoplomachus"], desc:"A soldier's spear, plain and true, and longer in the reach than the rack's."},
  venabulum:{slot:"weapon",art:"spear",  name:"Venabulum",         price:330, atk:.12,def:.03, spd:0,   sho:.05, styles:["Hoplomachus"], desc:"A boar spear with a crossbar, made to stop a charge dead on the point."},
  fuscina_m:{slot:"weapon",art:"trident",name:"Iron Fuscina",      price:150, atk:.08,def:.02, spd:.02, sho:.05, styles:["Retiarius"], desc:"Heavier heads, deeper barbs. It holds what it catches."},
  fuscina_x:{slot:"weapon",art:"trident",name:"Neptune's Fuscina", price:470, atk:.12,def:.02, spd:.03, sho:.13, styles:["Retiarius"], desc:"Silver-tined and sea-god blessed. The mob names the fish before the net is even cast."},
  twin_m:   {slot:"weapon",art:"dual",   name:"Matched Pair",      price:210, atk:.10,def:-.075,spd:.03,sho:.08, styles:["Dimachaerus"], desc:"Two decent swords sold as a set. A step up from whatever came off the rack."},
  dolabra:  {slot:"weapon",art:"axe",    name:"Dolabra",           stock:1, price:95,  atk:.08,def:-.02,spd:-.02,sho:.03, styles:["Murmillo","Secutor"], desc:"A pioneer's pick-axe pressed into the arena. Ugly, cheap, and it bites."},
  bipennis: {slot:"weapon",art:"axe",    name:"Bipennis",          price:560, atk:.18,def:-.05,spd:-.07,sho:.13, styles:["Murmillo","Secutor"], desc:"A double-headed axe. One swing decides the afternoon — if it lands."},
  pugio_f:  {slot:"weapon",art:"dagger", name:"Fine Pugio",        price:190, atk:0,  def:.01, spd:.10, sho:.03, styles:[], desc:"A gentleman's killing knife, balanced for the throw and the close."},
  sicula:   {slot:"weapon",art:"dagger", name:"Sicula",            price:160, atk:-.01,def:0,  spd:.08, sho:.04, styles:["Thraex"], desc:"A little curved dagger, sister to the sica. For work done inside a man's guard."},
  // --- MORE OFF-HAND ---
  scutum_x: {slot:"offhand",art:"scutum", name:"Legion Scutum",    price:490, atk:0,  def:.20, spd:-.05,sho:.05, styles:["Murmillo","Secutor"], desc:"Full army pattern, curved and iron-rimmed. A door with a handle."},
  parmula_f:{slot:"offhand",art:"parmula",name:"Bronze Parmula",   price:220, atk:.02,def:.10, spd:-.01,sho:.05, styles:["Thraex","Dimachaerus"], desc:"Faced in bronze and kept bright. Small, quick, and it catches the light."},
  clipeus_f:{slot:"offhand",art:"clipeus",name:"Bronze Clipeus",   price:260, atk:0,  def:.13, spd:-.03,sho:.05, styles:["Hoplomachus"], desc:"A hoplite's round shield in beaten bronze. Old-country pride."},
  rete_f:   {slot:"offhand",art:"net",    name:"Weighted Rete",    price:210, atk:.05,def:.03, spd:.01, sho:.11, styles:["Retiarius"], desc:"Lead weights sewn to the rim. It falls faster and it falls right."},
  // --- MORE HELMS ---
  galea_mf: {slot:"helm",art:"crest",  name:"Bronze Crested Galea",price:260, atk:0,  def:.10, spd:-.02,sho:.06, styles:["Murmillo","Dimachaerus","Secutor"], desc:"A tall crest in beaten bronze. Weight up top, and your name up in the stands."},
  galea_sf: {slot:"helm",art:"smooth", name:"Iron Secutor Helm",   price:250, atk:0,  def:.13, spd:-.03,sho:0,   styles:["Secutor"], desc:"Round, smooth, two small eyeholes. The net finds nothing to hold — and neither does the air."},
  galea_tf: {slot:"helm",art:"griffin",name:"Silvered Griffin",    price:270, atk:0,  def:.09, spd:-.02,sho:.10, styles:["Thraex"], desc:"The griffin picked out in silver. Capua knows the Thracian before he draws."},
  galea_hf: {slot:"helm",art:"brim",   name:"Plumed Galea",        price:250, atk:0,  def:.10, spd:-.02,sho:.07, styles:["Hoplomachus"], desc:"Wide brim, tall plume, Greek to the bone. Made to be looked at."},
  // --- MORE ARMOR ---
  manica_f: {slot:"armor",art:"manica", name:"Scaled Manica",      price:180, atk:0,  def:.09, spd:-.01,sho:.02, styles:[], desc:"Iron scales down the sword arm over the linen. Turns a cut the padding would let through."},
  ocreae_f: {slot:"armor",art:"greaves",name:"Bronze Ocreae",      price:170, atk:0,  def:.10, spd:-.02,sho:.04, styles:[], desc:"Tall bronze greaves, chased and fitted. A man fights on his legs, so guard them well."},
  lorica:   {slot:"armor",art:"padded", name:"Lorica Squamata",    price:430, atk:0,  def:.17, spd:-.08,sho:.06, styles:[], desc:"A shirt of iron scales. Heavy as a bad conscience — but little gets through."},
};
const SLOTS = ["weapon","offhand","helm","armor"];
const SLOT_NAME = { weapon:"Weapon", offhand:"Off-hand", helm:"Helm", armor:"Armor" };
/* Sub-sections within each armory tab, named by the art of the piece. */
const ART_NAME = {
  sword:"Straight Blades", curved:"Curved Blades", spear:"Spears & Reach", trident:"Tridents",
  dual:"Paired Blades", axe:"Heavy Arms", dagger:"Sidearms",
  scutum:"Tower Shields", parmula:"Small Shields", clipeus:"Round Shields", net:"The Net",
  crest:"Crested Helms", smooth:"Faced Helms", griffin:"Griffin Helms", brim:"Brimmed Helms",
  silver:"Showpieces", bare:"Bare-headed",
  manica:"Arm Guards", greaves:"Greaves", padded:"Body Armour", gilded:"Showpieces",
};
const artName = (slot, art) => art==="none" ? (slot==="offhand" ? "Free Hand" : "Unarmoured") : (ART_NAME[art] || art);
const DEFAULT_KIT = {
  Murmillo:    {weapon:"gladius", offhand:"scutum",  helm:"galea_m",  armor:"manica"},
  Thraex:      {weapon:"sica",    offhand:"parmula", helm:"galea_t",  armor:"manica"},
  Hoplomachus: {weapon:"hasta",   offhand:"clipeus", helm:"galea_h",  armor:"ocreae"},
  Secutor:     {weapon:"gladius", offhand:"scutum",  helm:"galea_s",  armor:"manica"},
  Retiarius:   {weapon:"fuscina", offhand:"rete",    helm:"helmnone", armor:"manica"},
  Dimachaerus: {weapon:"twin_b",  offhand:"offnone", helm:"galea_m",  armor:"manica"},
};
const FINE_OF = { gladius:"gladius_f", sica:"sica_f", hasta:"hasta_f", fuscina:"fuscina_f", twin_b:"twin", twin:"twin_f", scutum:"scutum_f" };
const defaultKit = cls => Object.assign({}, DEFAULT_KIT[cls] || DEFAULT_KIT.Murmillo);
const isBasic = id => !!GEAR[id] && GEAR[id].price===0;
/* what a man wears when the house owns him nothing */
const BARE = { weapon:null, offhand:"offnone", helm:"helmnone", armor:"armnone" };
const bareKit = cls => Object.assign({}, BARE, { weapon: DEFAULT_KIT[cls] ? DEFAULT_KIT[cls].weapon : "gladius" });
const emptyKit = () => Object.assign({}, BARE);

function gearUsed(d, id){
  return d.gladiators.filter(g=>!isGone(g))
    .reduce((s,g)=>s + (g.kit && SLOTS.some(sl=>g.kit[sl]===id) ? 1 : 0), 0);
}
const gearFree = (d,id) => isBasic(id) ? 99 : (d.gear[id]||0) - gearUsed(d,id);
/* Bought steel wears. House stock does not — it is maintained, that is what it is for. */
const wears = it => !!it && !it.stock && it.price > 0;
const wearOf = (g, s) => (g && g.wear && g.wear[s]!=null) ? clamp(g.wear[s], 0, 100) : 100;
const wearEff = c => 0.5 + c/200;
const wearWord = c => c>=85 ? "keen" : c>=60 ? "serviceable" : c>=35 ? "worn" : c>=15 ? "failing" : "all but gone";
const wearColour = c => cbc(c>=60 ? "#9aa86a" : c>=35 ? "#d8ac5f" : "#d96f5d");
const isNamed = (g, s) => !!(g && g.named && g.named.slot===s);

function kitMods(kit, cls, g){
  const m = { atk:0, def:0, spd:0, sho:0, clumsy:[] };
  if(!kit) return m;
  for(const s of SLOTS){
    const it = GEAR[kit[s]];
    if(!it) continue;
    const alien = it.styles && it.styles.length && !it.styles.includes(cls);
    const k = alien ? 0.5 : 1;
    const eff = wears(it) ? wearEff(wearOf(g, s)) : 1;
    const named = isNamed(g, s) ? 0.05 : 0;
    m.atk += ((it.atk||0)*eff + named)*k - (alien?0.045:0);
    m.def += ((it.def||0)*eff + named)*k;
    m.spd += (it.spd||0);
    m.sho += ((it.sho||0)*eff + (named?0.03:0))*k;
    if(alien) m.clumsy.push(it.name);
  }
  // a shield in the off-hand is meaningless when both hands hold a blade
  if(GEAR[kit.weapon] && GEAR[kit.weapon].art==="dual" && GEAR[kit.offhand] && GEAR[kit.offhand].art!=="none"){
    m.def -= 0.05; m.spd -= 0.03;
  }
  m.atk = clamp(m.atk, -0.24, 0.26);
  m.def = clamp(m.def, -0.25, 0.34);
  return m;
}
function kitArt(kit, slot){
  const it = GEAR[(kit||{})[slot]];
  return it ? it.art : null;
}
function kitFor(cls, tier){
  const k = defaultKit(cls);
  const cap = [0, 120, 400, 9999][clamp(tier,0,3)];
  const suits = id => { const it=GEAR[id]; return (!it.styles.length || it.styles.includes(cls)) && it.price<=cap; };
  const poolOf = slot => Object.keys(GEAR).filter(id=>GEAR[id].slot===slot && suits(id));
  const rough = tier===0;
  const swap = (slot, chance)=>{ if(R()<chance){ const p=poolOf(slot); if(p.length) k[slot]=pick(p); } };

  swap("weapon", 0.4);
  if(tier>=2 && R()<0.4 && FINE_OF[k.weapon]) k.weapon = FINE_OF[k.weapon];

  if(GEAR[k.weapon].art==="dual") k.offhand = "offnone";
  else {
    swap("offhand", 0.32);
    if(tier>=2 && R()<0.3 && FINE_OF[k.offhand]) k.offhand = FINE_OF[k.offhand];
  }
  if(rough && R()<0.4) k.helm = "helmnone";
  else if(tier>=3 && R()<0.45) k.helm = "galea_x";
  else swap("helm", 0.25);

  if(rough && R()<0.45) k.armor = "armnone";
  else if(tier>=3 && R()<0.4) k.armor = "gilded";
  else k.armor = pick(tier>=2 ? ["manica","ocreae","subarm","subarm"] : ["manica","ocreae","armnone"]);
  return k;
}

const TRAITS = {
  Showman:"The crowd is his second weapon.",
  Stoic:"Pain and fear find no purchase.",
  Brutal:"Kills come easy. Men fear him.",
  Defiant:"Fire in the eyes. Great — and dangerous.",
  "Swift Learner":"Drinks in the doctore's lessons.",
  "Iron Hide":"Wounds close where others fester.",
  "Glory-Seeker":"Fights for the roar, not the coin.",
  Broken:"The spirit left him long ago.",
};

const NICKS = ["the Beast of Capua","the Shadow","Doom of the Sands","the Fury","the Mountain","the Serpent","Bringer of Rain","the Butcher","Slayer of Giants","the Ghost","the Lion","Breaker of Men","the Unchained","the Storm"];
/* ---- THE ANNALS ----
   The chronicle keeps forty lines and then forgets. This does not. One entry per
   man who ever wore your colours, opened when he arrives and closed when he goes,
   whatever way he goes. */
const FATES = {
  dead:     { label:"Killed",            colour:"#d96f5d", verb:g=>`died on the sand` },
  beasts:   { label:"Killed by a beast", colour:"#d96f5d", verb:g=>`was killed at the hunt` },
  revolt:   { label:"Died in revolt",    colour:"#d96f5d", verb:g=>`died the night the cells rose` },
  freed:    { label:"Given the rudis",   colour:"#e0bd72", verb:g=>`was given the rudis` },
  retired:  { label:"Released",          colour:"#c0b492", verb:g=>`was released from the sacramentum` },
  departed: { label:"Served his term",   colour:"#9dc0d4", verb:g=>`served out his contract and left` },
  escaped:  { label:"Escaped",           colour:"#bfa8c8", verb:g=>`went out through the open gates` },
  defected: { label:"Defected",          colour:"#bfa8c8", verb:g=>`left for another house` },
  sold:     { label:"Sold",              colour:"#9c8a6f", verb:g=>`was sold on` },
  levied:   { label:"Taken for the legions", colour:"#9c8a6f", verb:g=>`was levied for the war` },
};
const fateOf = a => FATES[a.fate] || { label:"Still on the sand", colour:"#e8d9b8", verb:()=>"is still fighting" };

function annalsEntry(d, g){
  return { id:g.id, name:g.name, nick:g.nick, origin:g.origin, cls:g.cls, sex:g.sex||"m",
    auctor:isAuctor(g), joined:d.week, left:null, fate:null,
    age:g.age, wins:g.wins, losses:g.losses, kills:g.kills, pfame:rnd(g.pfame),
    scars:(g.scars||[]).length, amb:g.ambition? g.ambition.kind:null, ambMet:false };
}
function annalsClose(d, g, fate){
  d.annals = d.annals || [];
  let a = d.annals.find(x=>x.id===g.id);
  if(!a){ a = annalsEntry(d, g); d.annals.push(a); }
  if(a.left) return;
  a.left = d.week; a.fate = fate;
  a.wins=g.wins; a.losses=g.losses; a.kills=g.kills; a.pfame=rnd(g.pfame);
  a.age=g.age; a.scars=(g.scars||[]).length; a.nick=g.nick;
  a.ambMet = !!(g.ambition && g.ambition.met);
}
function annalsSync(d){
  d.annals = d.annals || [];
  for(const g of d.gladiators){
    let a = d.annals.find(x=>x.id===g.id);
    if(!a){ a = annalsEntry(d, g); d.annals.push(a); }
    if(a.left) continue;
    a.wins=g.wins; a.losses=g.losses; a.kills=g.kills; a.pfame=rnd(g.pfame);
    a.age=g.age; a.scars=(g.scars||[]).length; a.nick=g.nick; a.auctor=isAuctor(g);
    a.ambMet = !!(g.ambition && g.ambition.met);
    if(isGone(g)) { a.left = d.week; a.fate = g.fateNote || g.status; }
  }
}
/* the house's own record, for the ledger and the ending */
/* ---- THE BOOK ----
   The house has been accumulating history for fifty versions with no way to ask it
   anything. These are counters, not a log — a full campaign costs a few hundred bytes. */
function newBook(){
  return { n:0, w:0, dead:0, killed:0, purse:0, crowd:0, rounds:0,
    tier:{}, cls:{}, stakes:{}, city:{}, house:{}, kind:{},
    best:null, longest:null, biggest:null, worst:null };
}
const bk = (o,k) => (o[k] = o[k] || { n:0, w:0 });
function bookBout(d, o){
  d.book = d.book || newBook();
  const B = d.book;
  B.n++; if(o.win) B.w++;
  if(o.died) B.dead++;
  if(o.killed) B.killed++;
  B.purse += o.purse || 0;
  B.crowd += o.crowd || 0;
  B.rounds += o.rounds || 0;
  const put = (grp,key) => { const e = bk(grp, key); e.n++; if(o.win) e.w++; };
  put(B.tier, "T"+(o.tier==null?0:o.tier));
  if(o.cls) put(B.cls, o.cls);
  put(B.stakes, o.stakes || "standard");
  put(B.city, o.city || "capua");
  put(B.kind, o.kind || "single");
  if(o.oppHouse && LANISTAE[o.oppHouse]) put(B.house, o.oppHouse);
  if(o.purse && (!B.biggest || o.purse > B.biggest.purse))
    B.biggest = { purse:o.purse, name:o.name, week:d.week, festival:o.festival || "the pits" };
  if(o.rounds && (!B.longest || o.rounds > B.longest.rounds))
    B.longest = { rounds:o.rounds, name:o.name, opp:o.opp, week:d.week };
}
/* everything else the book knows, it derives */
function bookOf(d){
  const B = d.book || newBook();
  const A = d.annals || [];
  const R2 = houseRecord(d);
  const rate = e => e.n ? Math.round(e.w/e.n*100) : 0;
  const rank = grp => Object.entries(grp).map(([k,e])=>({ k, n:e.n, w:e.w, pc:rate(e) }))
    .filter(x=>x.n>=4).sort((a,b)=>b.pc-a.pc);
  const fates = {};
  A.forEach(a=>{ const f = a.fate || "serving"; fates[f] = (fates[f]||0)+1; });
  const best = A.reduce((m,a)=> (!m || (a.wins*3+(a.pfame||0)) > (m.wins*3+(m.pfame||0))) ? a : m, null);
  return { B, A, R2, rate, rank, fates, best,
    winPc: B.n ? Math.round(B.w/B.n*100) : 0,
    avgCrowd: B.n ? Math.round(B.crowd/B.n) : 0,
    avgRounds: B.n ? (B.rounds/B.n).toFixed(1) : "0",
    perBout: B.n ? Math.round(B.purse/B.n) : 0 };
}

function houseRecord(d){
  const A = d.annals || [];
  const served = A.length;
  const w = A.reduce((s,a)=>s+a.wins,0), l = A.reduce((s,a)=>s+a.losses,0);
  const k = A.reduce((s,a)=>s+a.kills,0);
  const lost = A.filter(a=>["dead","beasts","revolt"].includes(a.fate)).length;
  const freed = A.filter(a=>a.fate==="freed").length;
  const out = A.filter(a=>["retired","departed"].includes(a.fate)).length;
  const best = A.reduce((m,a)=> (!m || a.wins>m.wins) ? a : m, null);
  return { served, w, l, k, lost, freed, out, best, years:yearOf(d) };
}

/* ---- WHAT THE RACKS WILL HOLD ----
   Fifty-four kinds of thing and nowhere to put them. A ludus armoury was a room,
   and a room has walls. House issue is unlimited — it is issue. Bought steel takes
   space, and steel kept in a crowded room is steel nobody is maintaining. */
const rackCap   = d => 8 + bLevel(d,"armamentarium")*7;        // 8 / 15 / 22 / 29
const rackUsed  = d => Object.entries(d.gear||{}).reduce((n,[id,c])=> n + (wears(GEAR[id])?(c||0):0), 0);
const rackOver  = d => Math.max(0, rackUsed(d) - rackCap(d));
const rackStrain= d => { const o = rackOver(d); return o ? 1 + Math.min(0.75, o*0.07) : 1; };
const rackRent  = d => rackOver(d) * 4;                         // a week of it, in coin
const rackWord  = d => { const u = rackUsed(d), c = rackCap(d);
  return u > c ? "overfull" : u >= c-1 ? "full" : u >= c*0.7 ? "filling" : "room enough"; };
/* what a piece fetches when it goes back out the door */
const resaleRate = d => 0.42 + (d.armourer ? 0.13 : 0) + (docIs(d,"scutum")||docIs(d,"parma") ? 0.05 : 0);
function sellGear(d, id){
  const it = GEAR[id];
  if(!it || isBasic(id) || (d.gear[id]||0) - gearUsed(d,id) <= 0) return 0;
  const pool = (d.gearCond && d.gearCond[id]) || [];
  const cond = pool.length ? Math.min(...pool) : 100;
  const i = pool.indexOf(cond);
  if(i >= 0) d.gearCond[id] = pool.filter((_,k)=>k!==i);
  d.gear[id] = (d.gear[id]||1) - 1;
  if(d.gear[id] <= 0) delete d.gear[id];
  const paid = rnd(it.price * resaleRate(d) * (0.45 + cond/180));
  d.gold += paid;
  return paid;
}
function rackWeek(d){
  const rent = rackRent(d);
  if(!rent) return;
  d.gold -= rent;
  if(d.week % 6 === 0)
    chron(d, `The armoury is past what it will hold. ${rackUsed(d)} pieces in a room built for ${rackCap(d)}, stacked against the wall and going off in the damp.`, "bad");
}

/* ---- WHERE A PIECE CAME FROM ----
   Fifty-four kinds of steel told apart by four numbers. A piece with a history is
   the same four numbers and a different object entirely, and the story is carried
   by the slot rather than the item, so it survives the man who earned it. */
const PROV = {
  forged:  { colour:"#c99a4b", crowd:5, morale:8, dread:0,
    line:p=>`Made for him by your own smith, week ${p.week}.` },
  spoils:  { colour:"#d8ac5f", crowd:7, morale:6, dread:0,
    line:p=>`Taken off ${p.from}${p.house?` of House ${p.house}`:""} on the sand, after.` },
  gift:    { colour:"#bfa8c8", crowd:6, morale:5, dread:0,
    line:p=>`Sent up from ${p.from} with no note and no explanation.` },
  imperial:{ colour:"#e8d092", crowd:11, morale:10, dread:0,
    line:p=>`Carried onto the imperial sand at Rome and carried off it again.` },
  primacy: { colour:"#e8d092", crowd:8, morale:7, dread:0,
    line:p=>`He held the primacy of Capua in this.` },
  dead:    { colour:"#7c2a22", crowd:4, morale:-7, dread:1,
    line:p=>`${p.from} was wearing this when he died in it. The cells know which piece it is.` },
};
const provOf   = (g,s) => (g && g.prov && g.prov[s]) || null;
const provAny  = g => (g && g.prov) ? SLOTS.filter(s=>g.prov[s]) : [];
const provCrowd= g => provAny(g).reduce((n,s)=>n + PROV[g.prov[s].kind].crowd, 0);
const provDread= g => provAny(g).some(s=>PROV[g.prov[s].kind].dread);
function giveProv(d, g, slot, kind, extra){
  if(!g || !GEAR[g.kit && g.kit[slot]]) return false;
  if(!wears(GEAR[g.kit[slot]])) return false;        // only real steel carries a story
  g.prov = g.prov || {};
  if(g.prov[slot]) return false;                     // one history to a piece
  g.prov[slot] = Object.assign({ kind, week:d.week }, extra||{});
  const P = PROV[kind];
  g.morale = clamp(g.morale + P.morale, 0, 100);
  if(P.morale > 0) remember(d, g, "steel", P.morale/8);
  return true;
}
const clearProv = (g, slot) => { if(g && g.prov) delete g.prov[slot]; };
/* a piece somebody died in does not vanish — it goes back on the rack, and the
   next man to be handed it knows exactly what it is */
function retireSteel(d, g){
  if(!g || !g.kit) return;
  d.deadSteel = d.deadSteel || [];
  for(const s of SLOTS){
    const it = GEAR[g.kit[s]];
    if(!wears(it)) continue;
    if(d.deadSteel.some(x=>x.id===g.kit[s] && x.slot===s)) continue;
    d.deadSteel.push({ id:g.kit[s], slot:s, from:g.name, week:d.week });
  }
  d.deadSteel = d.deadSteel.slice(-6);
}
function claimDeadSteel(d, g, slot){
  const list = d.deadSteel || [];
  const i = list.findIndex(x=>x.slot===slot && x.id===(g.kit&&g.kit[slot]));
  if(i < 0 || provOf(g, slot)) return false;
  const rec = list[i];
  d.deadSteel = list.filter((_,k)=>k!==i);
  giveProv(d, g, slot, "dead", { from:rec.from });
  chron(d, `${g.name} is handed the piece ${rec.from} died in. He takes it, because the alternative is going out without one.`, "bad");
  return true;
}

/* ---- ARMING A MAN ----
   Fifty-four pieces, four slots, eight men. Doing that by hand every time somebody
   is bought or something breaks is not a decision, it is bookkeeping. */
function gearAvailable(d, g, slot){
  return Object.entries(GEAR).filter(([id,it])=>{
    if(it.slot !== slot) return false;
    if(g.kit && g.kit[slot] === id) return true;      // what he already carries counts
    return isBasic(id) || gearFree(d, id) > 0;
  }).map(([id])=>id);
}
/* score a piece the way the fight engine will actually read it */
function gearScore(d, g, id){
  const it = GEAR[id]; if(!it) return -99;
  const alien = it.styles && it.styles.length && !it.styles.includes(g.cls);
  const cond = wears(it) ? condOf(d, g, it) : 100;
  const scale = wears(it) ? (0.5 + cond/200) : 1;
  let s = (it.atk*0.6 + it.def*0.30) * scale * 100;
  s += it.sho * 8;
  s += it.spd * 5;
  if(alien) s -= 22;                                   // clumsy is rarely worth it
  if(wears(it) && cond < 25) s -= 14;                  // about to go
  const D = doctrineOf(d);
  if(D && D.gear && D.gear[it.slot]) s += 3;           // the school's own kind of steel
  return s;
}
const condOf = (d, g, it) => {
  if(!wears(it)) return 100;
  const w = g.wear && g.wear[it.slot];
  return w==null ? 100 : w;
};
function bestKitFor(d, g){
  const out = {};
  for(const s of SLOTS){
    const pool = gearAvailable(d, g, s);
    if(!pool.length){ out[s] = (g.kit && g.kit[s]) || BARE[s]; continue; }
    out[s] = pool.reduce((m,id)=> gearScore(d,g,id) > gearScore(d,g,m) ? id : m, pool[0]);
  }
  return out;
}
function armFromRack(d, gid){
  const g = d.gladiators.find(x=>x.id===gid);
  if(!g || g.status!=="active") return null;
  const was = Object.assign({}, g.kit);
  const now = bestKitFor(d, g);
  const changed = SLOTS.filter(s=>was[s]!==now[s]);
  if(!changed.length) return { changed:[] };
  g.kit = now;
  g.wear = g.wear || {};
  changed.forEach(s=>{ if(g.wear[s]==null) g.wear[s] = 100; });
  changed.forEach(s=>{ clearProv(g, s); claimDeadSteel(d, g, s); });
  return { changed, was, now };
}
/* a kit you liked, kept by name */
const kitName = (d,g) => { const w = GEAR[g.kit && g.kit.weapon];
  return `${g.cls} · ${w ? w.name : "bare"}`; };
function saveKit(d, gid){
  const g = d.gladiators.find(x=>x.id===gid); if(!g) return false;
  d.kits = d.kits || [];
  const slots = Object.assign({}, g.kit);
  const name = kitName(d, g);
  const ex = d.kits.find(k=>k.name===name);
  if(ex) ex.slots = slots;
  else d.kits = [{ id:d.nextId++, name, cls:g.cls, slots }, ...d.kits].slice(0, 8);
  return true;
}
function applyKit(d, gid, kid){
  const g = d.gladiators.find(x=>x.id===gid);
  const K = (d.kits||[]).find(k=>k.id===kid);
  if(!g || !K || g.status!=="active") return null;
  const out = {}, missing = [];
  for(const s of SLOTS){
    const want = K.slots[s];
    if(want && (isBasic(want) || gearFree(d,want)>0 || g.kit[s]===want)) out[s] = want;
    else { out[s] = BARE[s]; if(want && GEAR[want]) missing.push(GEAR[want].name); }
  }
  g.kit = out;
  g.wear = g.wear || {};
  SLOTS.forEach(s=>{ if(g.wear[s]==null) g.wear[s] = 100; });
  return { missing };
}
const dropKit = (d, kid) => { d.kits = (d.kits||[]).filter(k=>k.id!==kid); };
/* what is wrong with what he is carrying */
function kitFaults(d, g){
  const out = [];
  if(!g.kit) return out;
  for(const s of SLOTS){
    const it = GEAR[g.kit[s]];
    if(!it) continue;
    if(it.styles && it.styles.length && !it.styles.includes(g.cls)) out.push({ s, why:"unfamiliar", name:it.name });
    if(wears(it) && (g.wear&&g.wear[s]||100) < 25) out.push({ s, why:"failing", name:it.name });
  }
  const better = bestKitFor(d, g);
  const gain = SLOTS.reduce((n,s)=> n + Math.max(0, gearScore(d,g,better[s]) - gearScore(d,g,g.kit[s])), 0);
  if(gain > 6) out.push({ s:null, why:"better on the rack", gain:Math.round(gain) });
  return out;
}

/* ---- THE DOCTRINE ----
   Reputation is something you drift into. This is something you declare, in front
   of Capua, and then have to live inside. Every one of them costs as much as it
   gives, and changing your mind costs more than either. */
const DOCTRINES = {
  scutum:  { name:"The Heavy Shield", cost:400, tag:"scutarii",
    creed:"Wood and weight. A man who cannot be moved does not need to be quick.",
    body:"The house teaches the murmillo and the secutor and grudgingly tolerates everything else. Capua's big-shield partisans will adopt you outright.",
    likes:["Murmillo","Secutor"], train:1.22, other:0.86, fac:{scut:22,parm:-18},
    gear:{ armor:0.82, offhand:0.82 }, note:"Shields and armour 18% cheaper." },
  parma:   { name:"The Small Shield", cost:400, tag:"parmularii",
    creed:"Feet first. Everything else is an excuse for standing still.",
    body:"Thraex, hoplomachus, net and twin blades. The parmularii will carry your name up and down the tiers; the scutarii will not.",
    likes:["Thraex","Hoplomachus","Retiarius","Dimachaerus"], train:1.22, other:0.86, fac:{parm:22,scut:-18},
    gear:{ weapon:0.88 }, note:"Blades 12% cheaper." },
  blood:   { name:"The Red School", cost:300, tag:"blood",
    creed:"They did not walk here to watch two men be careful.",
    body:"Sine missione where the editor will take it, and he will pay for it. The upper tiers will love you and everything else in this house will pay for that love.",
    purse:1.18, sineOdds:0.16, fac:{mob:20,front:-16}, unrest:0.55, health:0.7, rep:"blood",
    note:"Purses ×1.18, and the cells and your own health carry it." },
  craft:   { name:"The Long Apprenticeship", cost:500, tag:"craft",
    creed:"Anyone can teach a man to swing. We are teaching him to still be here in ten years.",
    body:"Slow, expensive, and it makes fighters who last. The front rows will talk about your house at dinner.",
    train:1.12, injure:0.7, purse:0.9, fac:{front:20,mob:-14}, rep:"craft",
    note:"Training +12%, injuries −30%, purses ×0.90." },
  mercy:   { name:"The Open Hand", cost:350, tag:"mercy",
    creed:"A man who knows he will be let up fights better than a man who knows he will not.",
    body:"Cloth thrown early, wounds properly treated, the rudis given rather than earned twice over. Capua thinks it is soft and the cells know exactly what it is.",
    missio:14, unrest:-0.7, regard:0.35, fameMult:0.9, fac:{front:14,mob:-10}, rep:"mercy",
    note:"Missio +14, unrest falls, regard climbs, fame ×0.90." },
  road:    { name:"The Travelling School", cost:350, tag:"the road",
    creed:"Capua is one town. There are others, and they have not heard our excuses yet.",
    body:"Wagons kept ready and men used to strange sand. Local standing builds fast down the bay; the standing you have here does not keep itself.",
    knownMult:1.7, strangeCut:0.55, travelCut:2, capuaDecay:0.5,
    note:"Local standing builds 70% faster and strangers are half as unforgiving." },
};
const DOC_KEYS = Object.keys(DOCTRINES);
const doctrineOf = d => (d.doctrine && DOCTRINES[d.doctrine.key]) || null;
const docIs = (d,k) => !!(d.doctrine && d.doctrine.key===k);
const docNum = (d, field, dflt) => { const D = doctrineOf(d); return (D && D[field]!=null) ? D[field] : dflt; };
function declareDoctrine(d, key){
  const D = DOCTRINES[key]; if(!D) return false;
  const changing = !!d.doctrine;
  const fee = changing ? rnd(D.cost*1.8) : D.cost;
  if(d.gold < fee) return false;
  d.gold -= fee;
  const was = d.doctrine ? DOCTRINES[d.doctrine.key].name : null;
  d.doctrine = { key, since:d.week };
  for(const [f,n] of Object.entries(D.fac||{})) facMove(d, f, n);
  if(D.rep) addRep(d, D.rep, 18);
  if(changing){
    d.fame = Math.max(0, d.fame-20);
    d.gladiators.forEach(g=>{ if(g.status==="active"){ g.morale = clamp(g.morale-8,0,100); } });
    d.unrest = clamp(d.unrest+6, 0, 100);
    chron(d, `The house is turned over from ${was} to ${D.name}. Everything the men were taught last year is now the wrong thing, and Capua watches a lanista change his mind in public.`, "bad");
  } else {
    d.gladiators.forEach(g=>{ if(g.status==="active") g.morale = clamp(g.morale+6,0,100); });
    chron(d, `${d.name} declares itself: ${D.name}. ${D.creed}`, "good");
  }
  return true;
}
/* what it is worth, week to week */
const docTrainMult = (d,g) => { const D = doctrineOf(d); if(!D || !D.train) return 1;
  if(!D.likes) return D.train;
  return D.likes.includes(g.cls) ? D.train : (D.other||1); };
const docGearMult = (d,slot) => { const D = doctrineOf(d); return (D && D.gear && D.gear[slot]) || 1; };
const docInjure   = d => docNum(d,"injure",1);
const docPurse    = d => docNum(d,"purse",1);
const docMissio   = d => docNum(d,"missio",0);
const docUnrest   = d => docNum(d,"unrest",0);
const docRegard   = d => docNum(d,"regard",0);
const docFame     = d => docNum(d,"fameMult",1);
const docKnown    = d => docNum(d,"knownMult",1);
const docStrange  = d => docNum(d,"strangeCut",1);
const docHealth   = d => docNum(d,"health",1);

/* ---- TWO OF YOUR MEN, IN FRONT OF YOU ----
   The cells have kept feuds since v0.19 and not one of them has ever arrived.
   This is the morning it does: both of them in the yard, everybody watching, and
   you standing there having to say something. */
const FEUD_CAUSES = {
  card:    { when:(d,a,b)=>Math.abs(a.wins-b.wins)>=4,
    say:(a,b)=>`${b.name} has taken ${a.name}'s place on three cards running and neither of them has said a word about it until now.` },
  blood:   { when:(d,a,b)=>(a.kills||0)>0 || (b.kills||0)>0,
    say:(a,b)=>`One of them killed a man the other had trained beside. It was a year ago and it is not a year ago.` },
  condemned:{ when:(d,a,b)=>isDamn(a)||isDamn(b),
    say:(a,b)=>`${isDamn(a)?a.name:b.name} was condemned to this place and the other chose it or was at least bought for it, and that has never stopped mattering.` },
  ear:     { when:(d,a,b)=>!!(d.ear && d.ear.who==="man" && (d.ear.gid===a.id||d.ear.gid===b.id)),
    say:(a,b)=>`One of them has worked out that the other has been carrying what is said in the cells up to the house.` },
  favour:  { when:(d,a,b)=>Math.abs(regardOf(a)-regardOf(b))>=25,
    say:(a,b)=>`One of them is your favourite and both of them know exactly which, and it has been sitting in that room for months.` },
  plain:   { when:()=>true,
    say:(a,b)=>`Nobody will say what started it. It has been going a long time and this morning it stopped being quiet.` },
};
const FEUD_KEYS = Object.keys(FEUD_CAUSES);
function ripeFeud(d){
  const cands = tieList(d).filter(t=>t.kind==="rival" && t.strength>=52).map(t=>{
    const a = d.gladiators.find(g=>g.id===t.a), b = d.gladiators.find(g=>g.id===t.b);
    if(!a||!b||a.status!=="active"||b.status!=="active"||refusing(a)||refusing(b)) return null;
    return { t, a, b, heat: t.strength + (a.defiance+b.defiance)/4 - (a.morale+b.morale)/6 };
  }).filter(Boolean);
  return cands.sort((x,y)=>y.heat-x.heat)[0] || null;
}
function feudWeek(d){
  if(d.pendingEvent || d.over || d.rome || d.city || d.travel) return;
  const f = ripeFeud(d);
  if(!f) return;
  if(R() > 0.055 + Math.max(0, f.heat-60)*0.004) return;
  const key = shuffled(FEUD_KEYS).find(k=>{ try { return FEUD_CAUSES[k].when(d,f.a,f.b); } catch(e){ return false; } }) || "plain";
  d.pendingEvent = { id:"feud", title:"In The Yard",
    text:`${fullName(f.a)} and ${fullName(f.b)} are standing eight feet apart in the training square and the rest of the familia has stopped working to watch. ${FEUD_CAUSES[key].say(f.a, f.b)} The doctore has not moved and is not going to. This is yours.`,
    choices:["Put them on the sand", `Take ${f.b.name} off the card for a month`, `Say ${f.a.name} is in the right`, "Walk away and let them settle it"],
    data:{ aid:f.a.id, bid:f.b.id, key } };
}

/* ---- WHAT CARRIES ----
   Feats are per-run. This is the other book: things Capua remembers about the
   trade itself, written by every house you have ever run and read by every house
   you run after. It survives losing, which is the entire point of it. */
const TRADE_KEY = "ludus-trade-v1";
const LEGACIES = {
  freed:   { name:"The Wooden Sword", need:12, unit:"men freed",
    say:"Lanistae talk. Yours is a house men have walked out of, and it reaches the block before you do.",
    boon:"New men arrive with 6 more regard for you." },
  buried:  { name:"The Long Bill", need:60, unit:"men buried",
    say:"You have put a great many people in the ground and the trade knows your name for it.",
    boon:"The block fears you: bought men cost 6% less." },
  bouts:   { name:"A Thousand Afternoons", need:900, unit:"bouts fought",
    say:"There is nothing on that sand you have not already seen twice.",
    boon:"Every new house starts +40 fame and already knows the week." },
  primus:  { name:"The Primacy", need:3, unit:"times held",
    say:"The title has been in your hands often enough that Capua assumes it will be again.",
    boon:"Patrons start 8 warmer." },
  rome:    { name:"The Imperial Sand", need:1, unit:"bouts won at Rome",
    say:"You have stood on the only floor that matters and walked off it.",
    boon:"Every new house begins with a senator already watching." },
  years:   { name:"The Long Tenure", need:40, unit:"years at the head of a house",
    say:"Boys who watched your first games have grandsons now.",
    boon:"Your lanista begins three years younger and in better health." },
};
const LEG_KEYS = Object.keys(LEGACIES);
const blankLegacy = () => ({ freed:0, buried:0, bouts:0, primus:0, rome:0, years:0, houses:0, best:null });
const legacyEarned = (L,k) => !!(L && LEGACIES[k] && (L[k]||0) >= LEGACIES[k].need);
function legacyFrom(d){
  const R2 = houseRecord(d);
  return { freed:R2.freed, buried:R2.lost, bouts:(d.book&&d.book.n)||0,
    primus:(d.flags.primusHeld||0), rome:Math.max((d.rome&&d.rome.won)||0, d.flags.romeBest||0), years:R2.years, houses:1,
    best:R2.best ? { name:R2.best.name, wins:R2.best.wins, house:d.name } : null };
}
function mergeLegacy(L, add){
  const out = Object.assign(blankLegacy(), L||{});
  for(const k of ["freed","buried","bouts","primus","rome","years","houses"]) out[k] = (out[k]||0) + (add[k]||0);
  if(add.best && (!out.best || add.best.wins > out.best.wins)) out.best = add.best;
  return out;
}
function applyLegacy(d, L){
  if(!L) return;
  d.legacy = L;
  if(legacyEarned(L,"bouts")){ d.fame += 40; d.flags.learned = Object.assign({loop:1}, d.flags.learned||{}); }
  if(legacyEarned(L,"years") && d.lanista){
    d.lanista.age = Math.max(22, d.lanista.age-3);
    d.lanista.health = clamp(d.lanista.health+6, 0, 100);
  }
  if(legacyEarned(L,"rome")){ const s = makePatron(d, "senator"); s.favor = 45; d.patrons.push(s); }
  if(legacyEarned(L,"primus")) patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor+8,0,100); });
  if(legacyEarned(L,"freed")) d.gladiators.forEach(g=>{ g.regard = clamp(regardOf(g)+6,0,100); });
  recomputeFavor(d);
}
const legacyPrice = d => legacyEarned(d.legacy,"buried") ? 0.94 : 1;
const legacyRegard = d => legacyEarned(d.legacy,"freed") ? 6 : 0;

/* ---- MASTERY, AND A SECOND STYLE ----
   Six stats forever is not a career. A man who has been at this long enough stops
   getting bigger and starts getting particular. */
const MASTERY_GATE = { wins:12, pfame:55 };
const masterOf = g => (g && g.mastery) || null;
const canMaster = (d,g) => g && g.status==="active" && !g.mastery && !g.learning
  && g.wins>=MASTERY_GATE.wins && g.pfame>=MASTERY_GATE.pfame;
const MASTERY = {
  Murmillo:    { name:"The Wall", say:"Nobody has moved him off a mark in three years. He does not so much win as refuse to lose." },
  Thraex:      { name:"The Gap", say:"He has stopped looking for openings and started making them, which is a different trade entirely." },
  Hoplomachus: { name:"The Length", say:"He fights at exactly the distance he chooses and nobody has yet closed it on him." },
  Secutor:     { name:"The Patient Man", say:"He has learned to be walked backward for six exchanges and win on the seventh." },
  Retiarius:   { name:"The Cast", say:"The net leaves his hand at a moment nobody watching can predict, including the man it lands on." },
  Dimachaerus: { name:"Both Hands", say:"He has stopped thinking of them as two swords. The crowd cannot follow it and neither can the other man." },
};
/* what a master is worth, in his own style */
const masteryPower = g => masterOf(g) ? 1.055 : 1;
const masteryCrowd = g => masterOf(g) ? 6 : 0;
function makeMaster(d, g){
  if(!canMaster(d,g)) return false;
  g.mastery = { cls:g.cls, week:d.week };
  g.pfame += 15;
  g.morale = clamp(g.morale+14, 0, 100);
  remember(d, g, "mastered");
  d.fame += 12;
  addRep(d, "craft", 8);
  chron(d, `${fullName(g)} is a master of his style now, and the doctore says so out loud, which he does not do. ${MASTERY[g.cls].say}`, "good");
  return true;
}
/* the second style: slow, expensive, and it costs him what he was */
const SECOND_WEEKS = 8;
const secondFee = (d,g) => rnd(340 + g.pfame*2.2);
const canSecond = (d,g) => g && g.status==="active" && !!g.mastery && !g.second && !g.learning && !!d.doctore;
function startSecond(d, gid, to){
  const g = d.gladiators.find(x=>x.id===gid);
  if(!g || !canSecond(d,g) || to===g.cls || !CLASSES[to]) return false;
  const fee = secondFee(d,g);
  if(d.gold < fee) return false;
  d.gold -= fee;
  g.learning = { to, weeks:SECOND_WEEKS, from:g.cls };
  chron(d, `${fullName(g)} goes to the far post with the doctore to be taught the ${to.toLowerCase()}'s trade from nothing. Eight weeks off every card, and a master of one style spending them as a beginner in another.`, "info");
  return true;
}
function learnWeek(d){
  for(const g of d.gladiators){
    if(g.status!=="active" || !g.learning) continue;
    g.learning.weeks--;
    g.fatigue = clamp(g.fatigue+4, 0, 100);
    if(g.learning.weeks > 0) continue;
    const to = g.learning.to;
    g.second = { cls:g.cls, learned:d.week };     // the style he came from
    g.cls = to;
    g.kit = defaultKit(to);
    for(const k of CLASSES[to].key) g[k] = clamp(g[k]+3, 8, 99);
    g.learning = null;
    g.morale = clamp(g.morale+10, 0, 100);
    remember(d, g, "taught");
    addRep(d, "craft", 10);
    d.fame += 8;
    chron(d, `${fullName(g)} comes back off the far post a ${to.toLowerCase()}, and keeps the ${g.second.cls.toLowerCase()} in his hands for whenever it is wanted. There are not five men in Campania who can do both.`, "good");
  }
}
/* a man with two styles takes whichever the card needs */
const stylesOf = g => g ? [g.cls, g.second && g.second.cls].filter(Boolean) : [];
function switchStyle(d, gid, to){
  const g = d.gladiators.find(x=>x.id===gid);
  if(!g || !g.second || g.lastFought>=d.week) return false;
  if(!stylesOf(g).includes(to) || to===g.cls) return false;
  const was = g.cls;
  g.second = { cls:was, learned:g.second.learned };
  g.cls = to;
  g.kit = defaultKit(to);
  if(g.mastery && g.mastery.cls!==to) { /* mastery belongs to the style he mastered */ }
  return true;
}

/* ---- THE SACRAMENTUM ----
   Uri, vinciri, verberari, ferroque necari — to be burned, bound, beaten, and
   killed by the sword. A free man swore it and it bound him. A slave had it said
   over him, which is not the same act at all, and the house knows the difference. */
const OATH = "uri, vinciri, verberari, ferroque necari";
const OATH_EN = "to be burned, to be bound, to be beaten, and to be killed by the sword";
const SWEARING = {
  quick: { name:"Get it said", cost:0, regard:0, yard:0, mercy:0,
    desc:"The doctore reads it out at the post while the rest of them carry on. Two minutes.",
    line:(d,g)=>`The words are said over ${g.name} at the post and the yard does not stop working to hear them.` },
  proper:{ name:"Properly, with the familia stood down", cost:40, regard:9, yard:3, mercy:3,
    desc:"Everyone off the sand, the whole thing spoken through, and his name said last.",
    line:(d,g)=>`The familia is stood down and the oath is spoken through end to end, with ${g.name}'s name said last and every man there to hear it.` },
  feast: { name:"With wine afterward", cost:150, regard:16, yard:7, mercy:6,
    desc:"The oath, and then a table. It buys nothing you can point to and they remember it for years.",
    line:(d,g)=>`The oath, and then wine and a table until dark. It buys nothing you could put in a ledger, and ${g.name} will be telling somebody about it in five years.` },
};
const SW_KEYS = Object.keys(SWEARING);
function swearIn(d, gid, key){
  const g = d.gladiators.find(x=>x.id===gid);
  const S2 = SWEARING[key];
  if(!g || !S2 || g.sworn) return false;
  if(d.gold < S2.cost) return false;
  d.gold -= S2.cost;
  g.sworn = { how:key, week:d.week, free:isAuctor(g) };
  /* a man who swears it himself is doing something a slave cannot */
  const mult = isAuctor(g) ? 1.4 : isDamn(g) ? 0.6 : 1;
  if(S2.regard) remember(d, g, "sworn", S2.regard/10 * mult);
  g.morale = clamp(g.morale + S2.regard*0.6, 0, 100);
  if(S2.yard) d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id){
    o.morale = clamp(o.morale + S2.yard, 0, 100);
    o.regard = clamp(regardOf(o) + S2.yard*0.5, 0, 100); } });
  if(S2.mercy) addRep(d, "mercy", S2.mercy);
  chron(d, S2.line(d, g), key==="quick" ? "info" : "good");
  return true;
}
const unsworn = d => activeG(d).filter(g=>!g.sworn);

/* ---- DAMNATIO AD LUDUM ----
   Rome had three sentences involving the arena. Two were executions. This one was
   not: condemned to the school, and a man who survived his term earned the rudis
   out of it. He arrives owning nothing, knowing nothing, and despised by every man
   in the cells who chose this life or was at least bought for it. */
const CRIMES = [
  { what:"arson in the insulae", bouts:14, note:"A fire in a tenement block. Eleven dead, and he says it was the lamp." },
  { what:"killing a freedman in a wine shop", bouts:16, note:"There were witnesses and there was a knife, and he does not dispute either." },
  { what:"robbery on the Appian road", bouts:12, note:"Took a cart at knife-point outside Sinuessa. The magistrate wanted an example." },
  { what:"forging a magistrate's seal", bouts:10, note:"A clerk with a steady hand and an opinion about his wages." },
  { what:"striking his master", bouts:18, note:"He will not say why and nobody in the cells asks him twice." },
  { what:"sedition in the market", bouts:13, note:"Said the wrong thing loudly in front of the wrong people." },
];
const isDamn = g => !!(g && g.damnatus);
const damnLeft = g => isDamn(g) ? Math.max(0, g.damnatus.bouts - (g.wins + g.losses)) : 0;
function makeDamnatus(d, crime){
  const g = genGladiator(d, ri(14, 34));           // he has never held a sword
  g.damnatus = { what:crime.what, note:crime.note, bouts:crime.bouts, since:d.week };
  g.price = 0;
  g.morale = ri(22, 40);
  g.defiance = ri(8, 26);                          // he is not defiant, he is finished
  g.regard = ri(30, 46);
  g.potential = clamp(g.potential - 12, 15, 99);
  g.traits = g.traits.filter(t=>t!=="Glory-Seeker");
  return g;
}
/* the yard does not want him */
function damnArrive(d, g){
  d.gladiators.push(g);
  d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id){
    o.morale = clamp(o.morale-5, 0, 100);
    o.regard = clamp(regardOf(o)-4, 0, 100); } });
  d.unrest = clamp(d.unrest+4, 0, 100);
  chron(d, `${fullName(g)} is delivered to the gate by two of the magistrate's men and a piece of paper. ${g.damnatus.note} He owes the sand ${g.damnatus.bouts} bouts. The cells watch him carried in and nobody moves to make room.`, "info");
}
/* and when the paper is finished with, so is the sentence */
function damnCheck(d, g){
  if(!isDamn(g) || g.status!=="active") return false;
  if(damnLeft(g) > 0) return false;
  const w = g.damnatus.bouts;
  g.damnatus = null;
  g.regard = clamp(regardOf(g)+26, 0, 100);
  g.morale = clamp(g.morale+24, 0, 100);
  remember(d, g, "servedOut");
  d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id) o.morale = clamp(o.morale+4,0,100); });
  d.unrest = clamp(d.unrest-6, 0, 100);
  addRep(d, "mercy", 6);
  chron(d, `${fullName(g)} has fought out his sentence — ${w} bouts, every one of them survived. The paper is discharged and he is a gladiator of this house like any other, which is a sentence of a different kind and he knows it.`, "good");
  return true;
}

/* ---- THE AUCTORATUS ----
   A free man who sold himself to the sand: paid up front, contracted for a fixed
   number of bouts, unsellable, and carrying almost no defiance because nobody
   made him do this. He is the one man in the cells who is not a grievance —
   until his term runs out and every slave in the yard watches him walk. */
const isAuctor = g => !!(g && g.auctor);
const auctorLeft = g => g.auctor ? Math.max(0, g.auctor.bouts - g.auctor.served) : 0;
const AUCTOR_WHY = [
  "Debts he will not name, and a creditor who will.",
  "A farm gone to a senator's surveyor and four mouths still at home.",
  "Discharged from the legions with nothing but the walk south.",
  "He killed a man in Neapolis and this is the cleaner version of what came next.",
  "He watched the games as a boy and has wanted nothing else since, which is worse.",
  "A wife's funeral to pay for, and no family left to shame.",
];
function makeAuctoratus(d, quality){
  const g = genGladiator(d, quality);
  g.auctor = { bouts: ri(6,12), served:0,
    fee: rnd(140 + quality*5.2 + ri(0,50)),
    wage: rnd(8 + quality*0.13),
    why: pick(AUCTOR_WHY) };
  g.price = g.auctor.fee;
  g.defiance = ri(2, 12);
  g.morale = clamp(g.morale + 12, 0, 100);
  return g;
}
/* his term is up */
function auctorReSign(d, g){
  const fee = rnd(g.auctor.fee * 1.35 + g.wins*22);
  return { fee, wage: rnd(g.auctor.wage*1.2), bouts: ri(5,10) };
}
function auctorDepart(d, g){
  g.status = "departed";
  d.departed = d.departed || [];
  d.departed.push({ name:fullName(g), week:d.week, wins:g.wins, bouts:g.auctor.bouts });
  dropTies(d, g.id);
  /* the enslaved men watch a man leave through the front gate */
  const slaves = activeG(d).filter(x=>!isAuctor(x));
  slaves.forEach(o=>{ o.defiance = clamp(o.defiance+7,0,100); o.morale = clamp(o.morale-4,0,100); });
  d.unrest = clamp(d.unrest + 4 + slaves.length, 0, 100);
  d.fame += 5;
  chron(d, `${fullName(g)} has served his term. He collects what is owed, walks out through the front gate in his own clothes, and every man in the yard watches him do it.`, "bad");
}

/* ---- FOUNDING ----
   Five ways in. Each one is a different problem to be holding on week one. */
/* ---- HOW HARD CAPUA IS ----
   Five openings decide where you start. Nothing decided the pressure. This is an
   axis you set at founding and live inside: it does not touch the fight engine,
   only what the town asks of you and how much it forgives. */
const PITCHES = {
  patron: { name:"With a patron behind you", tag:"forgiving",
    blurb:"Somebody with money has taken an interest. The purses are fatter, the town is slower to turn, and there is always a little more time than you think.",
    purse:1.18, upkeep:0.85, unrest:0.72, market:0.88, grudge:0.7, heal:1.2, mercy:8, start:400 },
  plain:  { name:"On your own account", tag:"as it was",
    blurb:"No patron, no debts, no advantages. The trade as it actually was, which was hard enough.",
    purse:1, upkeep:1, unrest:1, market:1, grudge:1, heal:1, mercy:0, start:0 },
  hard:   { name:"With a name to live down", tag:"unforgiving",
    blurb:"Something happened before you took this house and Capua has not forgotten it. Everything costs more and nobody is inclined to give you the benefit of anything.",
    purse:0.88, upkeep:1.2, unrest:1.3, market:1.15, grudge:1.4, heal:0.85, mercy:-7, start:-150 },
  brutal: { name:"Nobody is coming", tag:"ruinous",
    blurb:"No patron will see you, the moneylenders know your name, and the editors book you last. Houses have been run out of Capua on less. Most of them deserved it.",
    purse:0.78, upkeep:1.35, unrest:1.55, market:1.3, grudge:1.7, heal:0.75, mercy:-14, start:-300 },
};
const PITCH_KEYS = Object.keys(PITCHES);
const pitchOf = d => PITCHES[(d && d.pitch) || "plain"] || PITCHES.plain;
const pit = (d, k, dflt) => { const P = pitchOf(d); return P[k]!=null ? P[k] : (dflt==null?1:dflt); };

const SCENARIOS = {
  clean: { name:"A Clean Start", tag:"The even hand",
    blurb:"A sound little ludus, three decent men and coin enough to breathe. Nothing is wrong, which is its own kind of pressure.",
    gold:800, fame:5, unrest:12, men:[[38,55],[38,55],[38,55]] },
  inherited: { name:"Your Uncle's Debts", tag:"Hard",
    blurb:"Six men, a full block, and a creditor who was owed before you were. The upkeep alone will eat you if you stand still.",
    gold:260, fame:22, unrest:26, men:[[30,48],[30,48],[30,48],[30,48],[34,52],[34,52]],
    buildings:{ carceres:1 } },
  champion: { name:"One Good Man", tag:"Fragile",
    blurb:"A name the editors already know, and nobody behind him. Everything the house has is standing in one cell, and it can die on any given afternoon.",
    gold:520, fame:70, unrest:14, men:[[80,90]], legendFirst:true },
  veterans: { name:"The Old Guard", tag:"A closing window",
    blurb:"Four men who have all done this a long time. Skilled, scarred, and every one of them past the top of the hill. Whatever you build, build it fast.",
    gold:700, fame:45, unrest:18, men:[[58,72],[58,72],[58,72],[58,72]], old:true },
  castoffs: { name:"Another House's Leavings", tag:"Volatile",
    blurb:"Five men Tullius did not want, sold cheap and told so to their faces. There is talent in here somewhere and not one of them owes you anything.",
    gold:640, fame:10, unrest:38, men:[[34,64],[34,64],[34,64],[34,64],[34,64]], defiant:true },
};
const SC_KEYS = Object.keys(SCENARIOS);

/* ---- AMBITIONS ----
   Every man wants one thing and will not say so. Give it to him and he is yours;
   step on it and he remembers that instead. */
const AMBITIONS = {
  freedom:  { line:g=>`To hold the rudis before ${PR(g).he} is thirty.`,
    met:"He has it, and he is the only one who knew how much it mattered.",
    ask:g=>`${g.name} catches you crossing the yard and asks for a number. Not a speech and not a promise — a number. How many more.`,
    press:g=>`${g.name} asks again, and this time he has counted. He knows what his record is and he knows what other houses give the rudis for.`,
    despair:g=>`${g.name} has stopped asking about the rudis. He trains, he fights, and he has taken the number out of his head, which is worse than carrying it.` },
  nokill:   { line:g=>`Never to be sent out sine missione.`,
    met:"You have never once put ${name} on a card with no appeal. He counts.",
    ask:g=>`${g.name} has seen the card. He wants to know whether his name is ever going on the part of it where no appeal is heard.`,
    press:g=>`${g.name} asks it flatly this time, in front of two others. Sine missione. Ever. Yes or no.`,
    despair:g=>`${g.name} has stopped asking what the stakes are. He puts on whatever you give him and goes out, and something behind his face has closed.` },
  nobeast:  { line:g=>`Never to be put in front of an animal.`,
    met:"Whatever else you have asked of him, you never asked that.",
    ask:g=>`${g.name} watched them cart the morning's cages past the gate and did not eat afterward. He would like to know if there is an animal in his future.`,
    press:g=>`${g.name} says he will fight anyone in Capua and he means anyone. He says it twice so that you understand which word is doing the work.`,
    despair:g=>`${g.name} no longer looks at the cages when they go past, which is not the same as not minding.` },
  nickname: { line:g=>`To be given a name by the crowd.`,
    met:"The crowd named him. He pretends not to care and has not stopped standing straighter.",
    ask:g=>`${g.name} wants to know why the crowd calls the others something and calls him nothing. He is pretending this is a joke.`,
    press:g=>`${g.name} raises it again and does not pretend this time. He has been in this house long enough to be somebody and he is not.`,
    despair:g=>`${g.name} has stopped mentioning the crowd. He fights the same and he no longer looks up at them afterward.` },
  champion: { line:g=>`To win at the Ludi Romani, where the whole city can see it.`,
    met:"He won at the great games, in front of everyone he was ever going to.",
    ask:g=>`${g.name} asks when the great games are. Not the local card — the Ludi Romani, where the whole city goes. He has thought about this more than you have.`,
    press:g=>`${g.name} asks again about the Ludi Romani and does not accept the answer he got last time. He does not want a purse. He wants everyone there to see it.`,
    despair:g=>`${g.name} does not ask about the great games any more. Whatever he was going to be, he has decided he will be it here.` },
  beside:   { line:g=>`To go out on the sand beside someone he trusts.`,
    met:"He fought shoulder to shoulder with his own, and came off it a different man.",
    ask:g=>`${g.name} would like to go out beside someone he trusts, once, before whatever happens happens. He is embarrassed to be asking.`,
    press:g=>`${g.name} asks a second time. He has watched pairs go out and come back holding each other up, and he has done every bout of his alone.`,
    despair:g=>`${g.name} has stopped asking to be paired with anyone. He goes out alone and he has made his peace with going out alone.` },
  revenge:  { line:g=>`To face the house that marked him.`,
    met:"He got his hands on them, and whatever he was carrying he has put down.",
    ask:g=>`${g.name} wants a name on the card. A particular one. He touches the scar while he says it and does not notice he is doing it.`,
    press:g=>`${g.name} asks for the matching again. He has been waiting and he has stopped being polite about the waiting.`,
    despair:g=>`${g.name} does not ask for the matching any more. He still touches the scar.` },
};
const AMB_KEYS = Object.keys(AMBITIONS);
const ambState = g => { const a = g && g.ambition; if(!a) return null;
  return a.met ? "met" : a.broken ? "broken" : a.despair ? "despair"
    : a.voiced>=2 ? "pressed" : a.voiced>=1 ? "asked" : "silent"; };
function giveAmbition(d, g){
  const pool = AMB_KEYS.filter(k=>{
    if(k==="champion") return g.potential>=62;
    if(k==="nickname") return !g.nick;
    if(k==="revenge") return (g.scars||[]).length>0;
    return true;
  });
  g.ambition = { kind: pick(pool.length?pool:["freedom"]), met:false, broken:false,
    voiced:0, since:0, promised:false, despair:false };
}
/* he asked, and you answered, and now he is watching what you do */
function ambDespair(d, g){
  const a = g.ambition;
  if(!a || a.met || a.broken || a.despair) return;
  a.despair = true;
  g.morale = clamp(g.morale-30, 0, 100);
  g.defiance = clamp(g.defiance+25, 0, 100);
  d.unrest = clamp(d.unrest + (a.promised?11:7), 0, 100);
  kinReact(d, g.id, "brother", -9, 6);
  chron(d, AMBITIONS[a.kind].despair(g), "bad");
  if(a.promised) chron(d, `He had your word on it, which he mentioned to people.`, "bad");
}
function ambWeek(d){
  for(const g of d.gladiators){
    const a = g.ambition;
    if(g.status!=="active" || !a || a.met || a.broken || a.despair) continue;
    if(a.voiced>=2 && d.week - a.since >= 12) ambDespair(d, g);
  }
}
/* he got what he wanted */
function ambitionMet(d, g){
  const a = g.ambition;
  if(!a || a.met || a.broken) return;
  a.met = true;
  const kept = a.promised;
  g.morale = clamp(g.morale + (kept?34:24), 0, 100);
  g.defiance = clamp(g.defiance - (kept?26:18), 0, 100);
  d.unrest = clamp(d.unrest - (kept?7:4), 0, 100);
  if(a.despair){ a.despair = false; g.morale = clamp(g.morale+10,0,100); }
  chron(d, `${fullName(g)}: ${AMBITIONS[a.kind].met.replace("${name}", g.name)}`, "good");
  if(kept){
    d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id) o.morale = clamp(o.morale+4,0,100); });
    d.flags.keptWord = 1;
    remember(d, g, "kept");
    chron(d, `You gave him your word and then you kept it. That is not a thing the cells had a lot of evidence for.`, "good");
  }
}
/* you did the one thing he asked you not to */
function ambitionBroken(d, g){
  remember(d, g, "broke");
  const a = g.ambition;
  if(!a || a.broken || a.met) return;
  a.broken = true;
  const betrayed = a.promised;
  g.morale = clamp(g.morale - (betrayed?38:26), 0, 100);
  g.defiance = clamp(g.defiance + (betrayed?26:18), 0, 100);
  d.unrest = clamp(d.unrest + (betrayed?10:6), 0, 100);
  kinReact(d, g.id, "brother", betrayed?-14:-8, betrayed?9:5);
  chron(d, betrayed
    ? `${fullName(g)} had your word and you spent it. There is no version of this he does not understand.`
    : `${fullName(g)} asked you for one thing without ever asking. He has stopped expecting it.`, "bad");
  if(betrayed){
    d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id){ o.morale = clamp(o.morale-6,0,100); o.defiance = clamp(o.defiance+5,0,100); } });
    chron(d, `The whole yard knows what you promised him. They have drawn the obvious conclusion about what yours is worth.`, "bad");
  }
}
const ambWord = g => g && g.ambition ? AMBITIONS[g.ambition.kind].line(g) : "";

/* ---- THE OTHER LANISTAE ----
   Three men, not three numbers. Each runs his house a particular way, and the
   difference shows up in how long he holds a grudge and what he does about it. */
const LANISTAE = {
  Solonius: { name:"Marcus Solonius", trait:"the schemer",
    blurb:"Smiles first, pays second, and has never once been in the room when it happened.",
    grudgeDecay:1.6, poach:2.2, bribe:1.8, train:1.0, bid:1.0 },
  Vettius: { name:"Quintus Vettius Bassus", trait:"who forgets nothing",
    blurb:"Keeps a ledger of slights and settles it a year late, when you have stopped watching.",
    grudgeDecay:0.35, poach:1.0, bribe:1.0, train:1.0, bid:1.1, sabotage:1.9 },
  Tullius: { name:"Gaius Tullius Rufus", trait:"who is simply better at this",
    blurb:"No theatre and no grudges. His men are drilled harder than yours and he can outbid you whenever he likes.",
    grudgeDecay:1.0, poach:0.8, bribe:1.2, train:1.55, bid:1.6 },
};
const lanistaOf = h => LANISTAE[h] || { name:"House "+h, trait:"", blurb:"",
  grudgeDecay:1, poach:1, bribe:1, train:1, bid:1 };

/* ---- WHAT THEY DO UNWATCHED ----
   The cells whisper and the ear reports. But nothing actually happens down there
   that you did not arrange. These are things the block does on its own, most of
   which you never find out about, and all of which have already happened by the
   time you do. */
const YARD = {
  taught:   { w:9, need:d=>activeG(d).length>=3,
    run:(d)=>{ const men = activeG(d).filter(g=>g.wins>=4);
      const green = activeG(d).filter(g=>g.wins<=1 && !g.learning);
      if(!men.length || !green.length) return null;
      const t = pick(men), s = pick(green);
      if(t.id===s.id) return null;
      const k = pick(CLASSES[t.cls].key);
      s[k] = clamp(s[k]+ri(2,4), 8, 99);
      addTie(d, t.id, s.id, "brother", ri(12,22));
      return `${t.name} has been taking ${s.name} out to the post after the others have gone in. Nobody asked him to and nobody was told.`; } },
  theft:    { w:7, need:d=>rackUsed(d)>=1,
    run:(d)=>{ const g = pick(activeG(d).filter(x=>regardOf(x)<45));
      if(!g) return null;
      const owned = Object.keys(d.gear||{}).filter(id=>wears(GEAR[id]) && (d.gear[id]||0)>0);
      if(!owned.length) return null;
      const id = pick(owned);
      d.gear[id] = d.gear[id]-1;
      if(d.gear[id]<=0) delete d.gear[id];
      return `A ${GEAR[id].name.toLowerCase()} is not in the racks and has not been in the racks for a while. Nobody says anything, which means several of them know.`; } },
  feud:     { w:8, need:d=>activeG(d).length>=3,
    run:(d)=>{ const men = shuffled(activeG(d)).slice(0,2);
      if(men.length<2) return null;
      const t = tieBetween(d, men[0].id, men[1].id);
      if(t && t.kind==="brother") return null;
      addTie(d, men[0].id, men[1].id, "rival", ri(14,26));
      return `Something has gone wrong between ${men[0].name} and ${men[1].name} and neither of them will say what. They have stopped eating at the same end of the bench.`; } },
  kindness: { w:8, need:d=>d.gladiators.some(g=>g.status==="injured"),
    run:(d)=>{ const hurt = pick(d.gladiators.filter(g=>g.status==="injured"));
      const carer = pick(activeG(d).filter(x=>x.id!==hurt.id));
      if(!hurt || !carer) return null;
      hurt.morale = clamp(hurt.morale+9, 0, 100);
      addTie(d, hurt.id, carer.id, "brother", ri(10,18));
      return `${carer.name} has been sitting with ${hurt.name} at night. He does not do it where anybody can see him doing it.`; } },
  shrine:   { w:6, need:()=>true,
    run:(d)=>{ activeG(d).forEach(g=>{ g.morale = clamp(g.morale+3,0,100); });
      d.unrest = clamp(d.unrest-1.5, 0, 100);
      return `There is a shrine in the corner of the cell block that was not there last month. Nobody will say whose it is or what is in it.`; } },
  dice:     { w:7, need:d=>activeG(d).length>=3,
    run:(d)=>{ const men = shuffled(activeG(d)).slice(0,2);
      if(men.length<2) return null;
      men[0].morale = clamp(men[0].morale+5,0,100);
      men[1].morale = clamp(men[1].morale-6,0,100);
      addTie(d, men[0].id, men[1].id, "rival", ri(6,12));
      return `${men[1].name} owes ${men[0].name} something he cannot pay, over dice, and the whole block is enjoying it more than either of them.`; } },
  name:     { w:6, need:d=>activeG(d).some(g=>!g.yardName && g.wins>=2),
    run:(d)=>{ const g = pick(activeG(d).filter(x=>!x.yardName && x.wins>=2));
      if(!g) return null;
      g.yardName = pick(["the Ox","Wet Feet","Sunday","Little Rome","the Priest","Nine Toes","Hen","the Consul","Half-Ear","Mouse"]);
      return `The others have started calling ${g.name} "${g.yardName}". He pretends not to like it.`; } },
  language: { w:5, need:d=>new Set(activeG(d).map(g=>g.origin)).size>=3,
    run:(d)=>{ activeG(d).forEach(g=>{ g.morale = clamp(g.morale+2,0,100); });
      return `Seven languages in that block and they have quietly built an eighth out of pieces of all of them. None of it is for your benefit.` } },
  grief:    { w:8, need:d=>(d.annals||[]).some(a=>["dead","beasts"].includes(a.fate)),
    run:(d)=>{ const gone = pick((d.annals||[]).filter(a=>["dead","beasts"].includes(a.fate)));
      if(!gone) return null;
      d.unrest = clamp(d.unrest+1.5, 0, 100);
      return `They still set out a portion for ${gone.name} on the day he died. Nobody has told them to stop and nobody is going to.`; } },
  wall:     { w:5, need:d=>(d.book&&d.book.n)>=12,
    run:(d)=>{ activeG(d).forEach(g=>{ g.regard = clamp(regardOf(g)+1,0,100); });
      return `Somebody has been keeping a tally on the cell wall — every bout this house has fought, scratched in, going back further than you would have thought any of them cared to remember.`; } },
};
const YARD_KEYS = Object.keys(YARD);
/* you hear about it if you have an ear, and sometimes anyway */
function yardWeek(d){
  if(d.over || d.rome || d.city || d.travel) return;
  if(activeG(d).length < 2) return;
  if(R() > 0.16) return;
  const fit = YARD_KEYS.filter(k=>{ try { return YARD[k].need(d); } catch(e){ return false; } });
  if(!fit.length) return;
  const tot = fit.reduce((n,k)=>n+YARD[k].w,0);
  let r = R()*tot, k = fit[0];
  for(const x of fit){ r -= YARD[x].w; if(r<=0){ k=x; break; } }
  let line = null;
  try { line = YARD[k].run(d); } catch(e){ return; }
  if(!line) return;
  /* it happened either way. whether you learn of it depends on who is listening. */
  const hears = d.ear ? (d.ear.who==="man" ? 0.85 : 0.55) : 0.3;
  d.yardSeen = (d.yardSeen||0) + 1;
  if(R() < hears) chron(d, line, k==="theft" || k==="grief" ? "bad" : "info");
  else d.yardMissed = (d.yardMissed||0) + 1;
}

/* ---- THE HOUSEHOLD ----
   Eighty men have been fed, nursed, buried and washed by nobody at all. A ludus was
   a household before it was a business, and the people who kept it running were
   mostly women and mostly not on anybody's roster. */
const HOUSEHOLD = {
  cook:   { name:"Cook", wage:5, blurb:"Forty men eat twice a day and somebody has been doing that for nothing.",
    good:d=>{ d.gladiators.forEach(g=>{ if(g.status==="active") g.fatigue = clamp(g.fatigue-2.2,0,100); }); },
    line:"The food is better and the men are less tired than the ledger says they should be." },
  nurse:  { name:"Nurse", wage:6, blurb:"The medicus sets bones. Somebody sits up with them afterward.",
    good:d=>{ d.gladiators.forEach(g=>{ if(g.status==="injured" && g.injury && R()<0.22) g.injury.weeks = Math.max(0, g.injury.weeks-1); }); },
    line:"Wounds close a week early about a fifth of the time, which over a year is a man." },
  keeper: { name:"Housekeeper", wage:5, blurb:"Somebody has to know where everything is and who is lying.",
    good:d=>{ d.unrest = clamp(d.unrest-0.5, 0, 100); },
    line:"The cells are quieter by half a point a week and nobody can say exactly why." },
  wife:   { name:"The lanista's wife", wage:0, blurb:"She was here before the ludus was and has opinions about all of it.",
    good:d=>{ if(d.lanista) d.lanista.health = clamp(d.lanista.health+0.35, 0, 100); },
    line:"You last longer at this than a man doing it alone, which is most of them." },
};
const HH_KEYS = Object.keys(HOUSEHOLD);
const HH_NAMES = ["Vibia","Fulvia","Sallustia","Cornelia","Hostilia","Lollia","Pomponia","Statilia","Cispia","Naevia","Aebutia","Rubria"];
/* a woman on the sand drew a crowd and cost you the respectable half of the town.
   Rome banned senators' daughters from it, then banned it outright under Severus. */
const femCrowd  = g => isF(g) ? 12 : 0;
const femPurse  = g => isF(g) ? 1.15 : 1;
const femFront  = g => isF(g) ? -4 : 0;      // the front rows think it is vulgar
const femMob    = g => isF(g) ? 7 : 0;       // the upper tiers do not
function femBout(d, g){
  if(!isF(g)) return;
  const fr = facOf(d, "front");
  if(fr > 22) facMove(d, "front", femFront(g)*0.22);
  if(facOf(d, "mob") < 82) facMove(d, "mob", femMob(g)*0.22);
  if(R() < 0.05) addRep(d, "show", 3);
}
const houseFolk = d => d.household || {};
const hasFolk = (d,k) => !!(d.household && d.household[k]);
function makeFolk(d, kind){
  const used = new Set(Object.values(houseFolk(d)).map(f=>f.name));
  return { kind, name: pick(HH_NAMES.filter(n=>!used.has(n))) || pick(HH_NAMES),
    weeks:0, since:d.week, skill:ri(38,78) };
}
function hireFolk(d, kind){
  const H = HOUSEHOLD[kind];
  if(!H || hasFolk(d, kind)) return false;
  const fee = rnd(H.wage * 18);
  if(kind !== "wife" && d.gold < fee) return false;
  if(kind !== "wife") d.gold -= fee;
  d.household = Object.assign({}, houseFolk(d), { [kind]: makeFolk(d, kind) });
  chron(d, kind==="wife"
    ? `${d.household[kind].name} has been running the domestic half of this house since before there was a ludus in it, and has now been told so out loud.`
    : `${d.household[kind].name} takes the ${H.name.toLowerCase()}'s place at ${H.wage} denarii a week. Nobody on the sand will ever mention her and the house will not run without her.`, "good");
  return true;
}
function householdWeek(d){
  const hh = houseFolk(d);
  for(const k of Object.keys(hh)){
    const f = hh[k]; if(!f) continue;
    f.weeks++;
    d.gold -= HOUSEHOLD[k].wage;
    try { HOUSEHOLD[k].good(d); } catch(e){}
    /* they leave a house that is coming apart */
    if(k!=="wife" && f.weeks>8 && (d.unrest>78 || d.gold< -80) && R()<0.05){
      delete d.household[k];
      chron(d, `${f.name} is gone in the morning without saying anything to anybody. She was owed two weeks and did not ask for them.`, "bad");
    }
  }
}
/* who is in the yard who is not fighting */
function householdCount(d){ return Object.keys(houseFolk(d)).length; }

/* ---- COIN THAT BEHAVES LIKE COIN ----
   Gold has been one number since v0.1. A lanista's actual problem was almost never
   whether he was rich — it was whether he could put his hand on it this week. An
   editor who pays in sixty days is not the same as an editor who pays. */
const OWED_WEEKS = { games:2, booking:3, city:4, imperial:5 };
const owedList = d => (d.owed || []).filter(x=>!x.paid);
const owedTotal = d => owedList(d).reduce((n,x)=>n + x.amount, 0);
const liquid = d => d.gold;
/* a purse that is not cash yet */
function bookPurse(d, amount, from, kind){
  const wait = OWED_WEEKS[kind] || 2;
  d.owed = [...(d.owed||[]), { id:d.nextId++, amount:rnd(amount), from, kind, due:d.week + wait, paid:false, chased:false }];
  return amount;
}
/* the editor who is slow, and the one who is not good for it */
function owedWeek(d){
  d.owed = d.owed || [];
  for(const x of owedList(d)){
    if(d.week < x.due) continue;
    const late = d.week - x.due;
    /* most people pay. some take a while. a few need asking twice. */
    const pays = 0.44 + late*0.13 + (aedileOn(d) && d.aedile.friendly ? 0.16 : 0)
      + (repStyle(d)==="craft" ? 0.14 : 0) + (repStyle(d)==="mercy" ? 0.08 : 0)
      - (repStyle(d)==="blood" ? 0.14 : 0) - (owedList(d).length>=4 ? 0.06 : 0);
    if(R() < pays){
      x.paid = true;
      d.gold += x.amount;
      if(late >= 2) chron(d, `${x.from} settles at last — ${x.amount} denarii, ${late} week${late===1?"":"s"} after it was due, and no apology offered.`, "good");
    } else if(late >= 4 && !x.chased){
      x.chased = true;
      chron(d, `${x.from} has not paid the ${x.amount} denarii and has stopped being at home when your man calls.`, "bad");
    } else if(late >= 8){
      x.paid = true;                             // written off
      x.writtenOff = true;
      d.fame = Math.max(0, d.fame - 3);
      chron(d, `You write off the ${x.amount} denarii ${x.from} owes. Chasing it further would cost more than it is worth and everybody involved knows that, which is how it was always going to end.`, "bad");
    }
  }
  d.owed = (d.owed||[]).filter(x=>!x.paid || d.week - x.due < 3);
}
/* you can turn paper into cash at a price */
const discountRate = d => 0.62 + (repStyle(d)==="craft" ? 0.06 : 0) + (aedileOn(d) && d.aedile.friendly ? 0.05 : 0);
function sellDebt(d, id){
  const x = owedList(d).find(y=>y.id===id);
  if(!x) return 0;
  x.paid = true; x.sold = true;
  const got = rnd(x.amount * discountRate(d));
  d.gold += got;
  chron(d, `A man who buys other men's debts gives you ${got} for the ${x.amount} ${x.from} owes. He will get all of it eventually. That is the whole of his trade.`, "info");
  return got;
}
const cashWord = d => { const l = liquid(d), o = owedTotal(d);
  return l < 100 && o > 200 ? "rich on paper" : l < 100 ? "short" : o > l ? "owed more than you hold" : "solvent"; };

/* ---- THE MAN ACROSS THE SAND ----
   Three names with rosters and a grudge number. A grudge is only one direction a
   long acquaintance can go. This is the other: standing across the sand from the
   same man for years and arriving somewhere neither of you chose. */
const REGARD_HOUSE = { cold:0, civil:25, warm:50, thick:75 };
const houseWord = v => v>=75?"thick as thieves" : v>=50?"on good terms" : v>=25?"civil" : "nothing between you";
const houseOf = (d,h) => (d.rivals||[]).find(x=>x.name===h) || null;
const warmth = (d,h) => { const r = houseOf(d,h); return r ? clamp(r.warm||0, 0, 100) : 0; };
function warmMove(d, h, n){
  const r = houseOf(d,h); if(!r) return;
  r.warm = clamp((r.warm||0) + n, 0, 100);
  if(n > 0) r.grudge = clamp(r.grudge - n*0.4, 0, 100);
}
/* eight things two lanistae end up doing to each other over a decade */
const RIVAL_BEATS = {
  drink:   { need:c=>c.met>=6 && c.warm<40 && c.grudge<40, w:6,
    say:(L,c)=>`${L.name} is at the same table as you after the games, which has happened before, and this time neither of you gets up first. He is better company than he has any right to be.`,
    hit:(d,h)=>{ warmMove(d,h,10); } },
  respect: { need:c=>c.met>=10 && c.beaten>=3 && c.lost>=3, w:5,
    say:(L,c)=>`${L.name} has beaten your men ${c.lost} times and yours have beaten his ${c.beaten}, and at some point in the last few years the thing between you stopped being about winning.`,
    hit:(d,h)=>{ warmMove(d,h,14); } },
  loan:    { need:c=>c.warm>=34 && c.poor, w:26,
    say:(L,c)=>`${L.name} sends four hundred denarii with a note that says only: pay it when you have it, and do not make a thing of it.`,
    hit:(d,h)=>{ d.gold += 400; warmMove(d,h,6); } },
  warning: { need:c=>c.warm>=38, w:7,
    say:(L,c)=>`${L.name} finds you before the card goes up. The man they have matched against yours is not what the bill says he is, and he thought you would want to know.`,
    hit:(d,h)=>{ d.flags.warned = d.week; warmMove(d,h,4); } },
  offer:   { need:c=>c.warm>=50 && c.met>=14, w:5,
    say:(L,c)=>`${L.name} asks, without any of the usual circling, whether you would take one of his men for a season. He is not selling. He wants the boy taught something you do better than he does.`,
    hit:(d,h)=>{ warmMove(d,h,8); d.fame += 6; } },
  bitter:  { need:c=>c.grudge>=55 && c.warm<25, w:24,
    say:(L,c)=>`${L.name} looks at you across the editor's table and says, pleasantly, that he hopes your house has a good year. Everyone at the table understands what has been said.`,
    hit:(d,h)=>{ const r=houseOf(d,h); if(r) r.grudge = clamp(r.grudge+6,0,100); } },
  old:     { need:c=>c.met>=22 && c.years>=8, w:9,
    say:(L,c)=>`You and ${L.name} have been doing this to each other for ${c.years} years. There is nobody left in Capua who remembers the trade the way the two of you do, and he said so out loud, which cost him something.`,
    hit:(d,h)=>{ warmMove(d,h,16); d.fame += 8; } },
  end:     { need:c=>c.met>=26 && c.years>=11 && c.warm>=52, w:30,
    say:(L,c)=>`${L.name} is not at the games. He is not at the next one either. A letter comes eventually — he has sold up and gone to a farm near Nola, and the last line asks you to look in on his doctore, who is too old to place anywhere.`,
    hit:(d,h)=>{ const r=houseOf(d,h); if(r) r.retired = true; warmMove(d,h,10); d.fame += 10; } },
};
const RB_KEYS = Object.keys(RIVAL_BEATS);
function rivalArc(d){
  if(d.over || d.rome || d.city || d.travel || d.pendingEvent) return;
  d.metHouse = d.metHouse || {};
  for(const h of (d.rivals||[])){
    if(h.retired) continue;
    const m = d.metHouse[h.name] || { met:0, beaten:0, lost:0, seen:[] };
    const B = d.book && d.book.house && d.book.house[h.name];
    const c = { met:m.met, beaten:B? B.w : 0, lost:B? (B.n - B.w) : 0,
      warm:warmth(d,h.name), grudge:h.grudge||0, years:yearOf(d), poor:d.gold < 200 };
    const fit = RB_KEYS.filter(k=>!(m.seen||[]).includes(k) && (()=>{ try{ return RIVAL_BEATS[k].need(c); }catch(e){ return false; } })());
    if(!fit.length) continue;
    if(R() > 0.055) continue;
    const tot = fit.reduce((n,k)=>n+RIVAL_BEATS[k].w,0);
    let r = R()*tot, k = fit[0];
    for(const x of fit){ r -= RIVAL_BEATS[x].w; if(r<=0){ k=x; break; } }
    const L = lanistaOf(h.name);
    try { RIVAL_BEATS[k].hit(d, h.name); } catch(e){}
    m.seen = [...(m.seen||[]), k];
    d.metHouse[h.name] = m;
    chron(d, RIVAL_BEATS[k].say(L, c), k==="bitter" ? "bad" : "good");
    return;
  }
}
/* every card against a house is a meeting */
function metHouse(d, h){
  if(!h) return;
  d.metHouse = d.metHouse || {};
  const m = d.metHouse[h] || { met:0, beaten:0, lost:0, seen:[] };
  m.met++;
  d.metHouse[h] = m;
  /* familiarity by itself, once the grudge is not in the way */
  const r = houseOf(d, h);
  if(r && (r.grudge||0) < 30) warmMove(d, h, 1.1);
}

/* ---- HOUSE REPUTATION ----
   The arena remembers how you win, not just that you did. Four running tallies,
   decayed weekly, that decide which offers arrive and which Romans court you. */
const REP_KINDS = {
  blood: { name:"Butchers", adj:"bloody",
    line:"Capua books you when it wants a body on the sand.", patron:"magistrate" },
  show:  { name:"Showmen", adj:"showy",
    line:"They come for the spectacle, and you have never disappointed them.", patron:"noble" },
  craft: { name:"Technicians", adj:"skilled",
    line:"The men who know the sand watch your bouts and take notes.", patron:"senator" },
  mercy: { name:"A Merciful House", adj:"merciful",
    line:"Beaten men look to your box first. That is worth more than it sounds.", patron:"merchant" },
};
const REP_ORDER = ["blood","show","craft","mercy"];
const repOf = (d,k) => (d.rep && d.rep[k]) || 0;
const repTotal = d => REP_ORDER.reduce((s,k)=>s+repOf(d,k), 0);
function repStyle(d){
  const tot = repTotal(d);
  if(tot < 14) return null;
  const top = REP_ORDER.reduce((m,k)=> repOf(d,k)>repOf(d,m) ? k : m, REP_ORDER[0]);
  return repOf(d,top)/tot >= 0.36 ? top : null;
}
const repShare = (d,k) => { const t = repTotal(d); return t? repOf(d,k)/t : 0; };
function addRep(d, k, n){
  if(!d.rep) d.rep = { blood:0, show:0, craft:0, mercy:0 };
  d.rep[k] = clamp(d.rep[k] + n, 0, 120);
}
function repWeek(d){
  if(!d.rep) d.rep = { blood:0, show:0, craft:0, mercy:0 };
  for(const k of REP_ORDER) d.rep[k] = Math.max(0, d.rep[k] * 0.985);
  const st = repStyle(d);
  if(st){
    const p = patronsOf(d).find(x=>x.rank===REP_KINDS[st].patron);
    if(p) p.favor = clamp(p.favor + 0.35, 0, 100);
    if(st==="blood") d.unrest = clamp(d.unrest + 0.35, 0, 100);
    if(st==="mercy") d.unrest = clamp(d.unrest - 0.35, 0, 100);
    recomputeFavor(d);
  }
}

/* ---- THE FESTIVAL YEAR ----
   Six festivals in their real order through the Roman year, on the same 18-week
   clock the men age by. The year recurs, so it can be planned around. */
const CALENDAR = [
  { w:2,  key:"quinquatria", name:"the Quinquatria", month:"March",
    blurb:"Minerva's five days. The schools of Capua put their arms on show and every doctore in the city is watching.",
    purse:0.9, fame:1.0, tier:0, offers:2, train:1.35 },
  { w:5,  key:"floralia", name:"the Floralia", month:"May",
    blurb:"Flowers, drink and theatre. The mob wants a show, not a funeral — and will not forgive one.",
    purse:1.1, fame:1.25, tier:0, offers:2, noSine:true, crowd:14, deathCost:2.2 },
  { w:8,  key:"apollinares", name:"the Ludi Apollinares", month:"July",
    blurb:"Apollo's games, and the first serious money of the summer.",
    purse:1.15, fame:1.1, tier:0, offers:3 },
  { w:11, key:"vulcanalia", name:"the Vulcanalia", month:"August",
    blurb:"Vulcan's day. Fires in the street, and every armourer in Campania cutting his price to be seen.",
    purse:1.0, fame:1.05, tier:0, offers:2, gear:0.75, fineBonus:true },
  { w:14, key:"romani", name:"the Ludi Romani", month:"September",
    blurb:"The great games. Fifteen days for Jupiter, the whole city in the stands, and editors who can afford whoever they want.",
    purse:1.6, fame:1.5, tier:1, offers:4 },
  { w:17, key:"saturnalia", name:"the Saturnalia", month:"December",
    blurb:"The world turned over. No games are held, the familia is served at your own table, and for one week nobody is anybody's property.",
    purse:0, fame:0, tier:0, offers:0, rest:true },
];
const YEAR_WEEKS = 18;
/* the year has weather now, and the weather has opinions */
const SEASONS = [
  { at:1,  key:"spring", name:"Spring", months:"March to May",
    line:"Mild mornings and a dry square. The best weeks of the year for putting work into a man.",
    train:1.09, fat:1.0,  upkeep:0, unrest:0,    purse:1.0,  heal:1.0, pits:1.0, crowd:0 },
  { at:5,  key:"summer", name:"Summer", months:"May to August",
    line:"The season of games, and the sand is hot enough to burn a man who goes down on it. Everything takes more out of them.",
    train:1.0,  fat:1.18, upkeep:0, unrest:0.25, purse:1.12, heal:0.9, pits:1.0, crowd:6 },
  { at:11, key:"autumn", name:"Autumn", months:"September to November",
    line:"The great games, the harvest money, and a city with coin in its hand. The best purses of the year.",
    train:1.0,  fat:1.0,  upkeep:0, unrest:0,    purse:1.18, heal:1.0, pits:1.0, crowd:3 },
  { at:15, key:"winter", name:"Winter", months:"December to February",
    line:"The sand is wet and the cells are cold. Almost nobody is putting on games and the pits pay what they feel like.",
    train:0.88, fat:0.92, upkeep:4, unrest:0.55, purse:0.82, heal:1.35, pits:0.45, crowd:-7 },
];
const seasonOf = d => { const w = ((d.week-1) % YEAR_WEEKS) + 1;
  let s = SEASONS[0]; for(const x of SEASONS) if(w >= x.at) s = x; return s; };
const seasonTrain  = d => seasonOf(d).train;
const seasonFat    = d => seasonOf(d).fat;
const seasonUpkeep = d => seasonOf(d).upkeep;
const seasonPurse  = d => seasonOf(d).purse;
const seasonHeal   = d => seasonOf(d).heal;
const seasonCrowd  = d => seasonOf(d).crowd;
const yearWeek = d => ((d.week-1) % YEAR_WEEKS) + 1;
const yearOf = d => Math.floor((d.week-1) / YEAR_WEEKS) + 1;
const festivalNow = d => CALENDAR.find(f=>f.w===yearWeek(d)) || null;
const weeksUntil = (d, f) => { const y = yearWeek(d); return f.w>=y ? f.w-y : (YEAR_WEEKS-y)+f.w; };
const nextFestivals = (d, n) => CALENDAR.slice().sort((a,b)=>weeksUntil(d,a)-weeksUntil(d,b)).slice(0,n);
/* funeral games fall outside the calendar, and pay for what they are */
const MUNERA = ["funeral games for the house of Calavius","funeral games for a magistrate's father",
  "funeral games for an old soldier of Sulla","funeral games for a merchant with no sons"];
const HOUSES = ["Ovidius","Calavius","Magnetius","Pelorus","Herennius","Blossius"];
const INJURIES = [["Split brow",1,4],["Gashed shoulder",2,6],["Torn thigh",3,8],["Cracked ribs",3,7],["Pierced side",4,9],["Mangled hand",4,10]];

const TIERS = [
  { name:"The Pits", fame:0, purse:[50,40], app:10, fameGain:3 },
  { name:"Local Games", fame:25, purse:[130,80], app:30, fameGain:8 },
  { name:"Arena of Capua", fame:120, purse:[280,160], app:60, fameGain:16 },
  { name:"The Primus", fame:300, purse:[850,300], app:150, fameGain:40 },
  { name:"The Imperial Games", fame:600, purse:[2200,900], app:400, fameGain:90 },
];
const FAME_TIERS = [[0,"Unknown"],[40,"Noticed"],[120,"Respected"],[300,"Renowned"],[600,"Legend of Capua"]];

/* ================= HELPERS ================= */

/* ---- CARRYING A HOUSE OUT OF THE APP ----
   A seed shares an opening. This shares an actual house, mid-campaign, in a string
   somebody can paste into a message. Base64 of the save, with a checksum so a
   truncated paste fails loudly rather than loading a half-house. */
const HOUSE_TAG = "LVDVS1";
function b64enc(s){
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for(let i=0;i<bytes.length;i+=0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i+0x8000));
  return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function b64dec(t){
  const s = String(t||"").replace(/-/g,"+").replace(/_/g,"/");
  const bin = atob(s + "===".slice((s.length+3)%4));
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
/* fnv-1a, enough to catch a paste that lost its tail */
function sum32(s){
  let h = 2166136261>>>0;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619)>>>0; }
  return h.toString(36);
}
/* deflate takes a 42,000-character paste down to about 9,000, which is the
   difference between shareable and not. It is async, so both ends are promises. */
const CAN_ZIP = typeof CompressionStream !== "undefined";
async function zipStr(s){
  const cs = new CompressionStream("deflate-raw");
  const w = cs.writable.getWriter(); w.write(new TextEncoder().encode(s)); w.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  let bin = "", b = new Uint8Array(buf);
  for(let i=0;i<b.length;i+=0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i+0x8000));
  return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function unzipStr(t){
  const s = String(t||"").replace(/-/g,"+").replace(/_/g,"/");
  const bin = atob(s + "===".slice((s.length+3)%4));
  const b = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) b[i] = bin.charCodeAt(i);
  const ds = new DecompressionStream("deflate-raw");
  const w = ds.writable.getWriter();
  /* a damaged paste rejects the writer as well as the reader — swallow both,
     or the failure escapes the caller's try/catch as an unhandled rejection */
  w.write(b).catch(()=>{});
  w.close().catch(()=>{});
  return new TextDecoder().decode(await new Response(ds.readable).arrayBuffer());
}
async function exportHouse(d){
  const body = JSON.stringify(d);
  const sum = sum32(body);
  if(CAN_ZIP){
    try { return `${HOUSE_TAG}z.${sum}.${await zipStr(body)}`; } catch(e){}
  }
  return `${HOUSE_TAG}.${sum}.${b64enc(body)}`;
}
async function importHouse(text){
  const raw = String(text||"").trim().replace(/\s+/g,"");
  const parts = raw.split(".");
  const zipped = parts[0] === HOUSE_TAG+"z";
  if(parts.length !== 3 || (parts[0] !== HOUSE_TAG && !zipped))
    return { err:"That is not a house. It should begin LVDVS1 and have two full stops in it." };
  let body;
  try { body = zipped ? await unzipStr(parts[2]) : b64dec(parts[2]); }
  catch(e){ return { err:"The text is damaged — some of it did not survive being copied." }; }
  if(sum32(body) !== parts[1])
    return { err:"The house is incomplete. Something was cut off when it was pasted." };
  let d;
  try { d = JSON.parse(body); }
  catch(e){ return { err:"The house will not read. It may be from a much older version." }; }
  if(!d || typeof d !== "object" || !Array.isArray(d.gladiators))
    return { err:"That is a valid string but it is not a ludus." };
  try { d = migrate(d); } catch(e){ return { err:"The house is from a version this build cannot repair." }; }
  return { house:d, name:d.name, week:d.week, men:d.gladiators.filter(g=>!isGone(g)).length,
    fame:Math.round(d.fame), ver:d.ver };
}

/* ---- THE FIRST YEAR ----
   Twenty-eight lessons explain the machinery as it arrives. None of them tells a
   new lanista what to actually do on a Tuesday. This is ten things, in the order
   a man would learn them, each finished by doing it rather than by reading it. */
const CHARTER = [
  { id:"train", tab:"men", title:"Put them to work",
    how:"Everyone in the yard has a week and none of it spends itself. Open a man and set what he works on.",
    done:d=>activeG(d).some(g=>g.regimen && g.regimen!=="palus") || (d.flags.everTrained||0)>0 },
  { id:"fight", tab:"arena", title:"Send one out",
    how:"The pits are always open and they are how a house eats before it has a name. Take a bout at first blood — nobody dies at those stakes.",
    done:d=>(d.book && d.book.n) >= 1 },
  { id:"week", tab:"ludus", title:"End the week",
    how:"Nothing resolves until you do. Training, wounds, the rivals moving, the coin going out — all of it happens at once when the week ends.",
    done:d=>d.week >= 2 },
  { id:"buy", tab:"market", title:"Buy a man",
    how:"Three is not a house. The block lies about what it is selling, so pay to have one looked over if the price is worth it.",
    done:d=>d.gladiators.filter(g=>!isGone(g)).length >= 4 },
  { id:"arm", tab:"armory", title:"Arm somebody properly",
    how:"House issue keeps a man alive and does nothing else. Buy a real piece, then arm him off the rack.",
    done:d=>rackUsed(d) > 0 || d.gladiators.some(g=>SLOTS.some(s=>wears(GEAR[g.kit&&g.kit[s]]))) },
  { id:"games", tab:"arena", title:"Take a card at the games",
    how:"The games run every third week once Capua has heard of you. The purses are a different order of thing and so is the risk.",
    done:d=>(d.book && Object.keys(d.book.tier||{}).some(k=>k!=="T0")) },
  { id:"watch", tab:"arena", title:"Look at a man before you fight him",
    how:"Pay to have an opponent watched. What comes back is specific — that he tires, that he drops his arm — and you pick a plan against it.",
    done:d=>(d.flags.everWatched||0) > 0 },
  { id:"quiet", tab:"villa", title:"Keep the cells quiet",
    how:"Unrest is the only number that ends a run outright. A feast costs 120 denarii and buys more than it looks like it does.",
    done:d=>(d.flags.everFeast||0) > 0 || d.unrest < 12 },
  { id:"cloth", tab:"arena", title:"Let a beaten man up",
    how:"A bout can be stopped partway. Throw the cloth when one of them is done and you have spent a purse to buy a man's life — his, or the other house's. Every man in your cells keeps a list, and this goes on it.",
    done:d=>(d.flags.everCloth||0) > 0 || activeG(d).some(g=>(g.memory||[]).length > 0) },
  { id:"year", tab:"ludus", title:"Stand for a year",
    how:"Eighteen weeks is a year. Get there with a house still standing and you have done the difficult part.",
    done:d=>d.week >= YEAR_WEEKS + 1 },
];
const charterAt = d => (d.charter && !d.charter.done && !d.charter.skipped)
  ? CHARTER[d.charter.i] || null : null;
function charterWeek(d){
  if(!d.charter || d.charter.done || d.charter.skipped) return;
  let moved = false;
  /* skip anything already true — a player who worked it out gets no homework */
  while(d.charter.i < CHARTER.length){
    let ok = false;
    try { ok = !!CHARTER[d.charter.i].done(d); } catch(e){ ok = false; }
    if(!ok) break;
    d.charter.i++; moved = true;
  }
  if(d.charter.i >= CHARTER.length && !d.charter.done){
    d.charter.done = true;
    d.gold += 250;
    d.fame += 12;
    chron(d, `A year of it. You have bought men, buried some, argued with the stands and kept the cells from burning, and the house is still here. Nobody hands you anything for that except the next week.`, "good");
  }
  return moved;
}
const charterSkip = d => { if(d.charter) d.charter.skipped = true; };

/* ---- THE AGENDA ----
   Thirty versions of bolting panels onto columns. This is the one list that says
   what actually wants an answer this week, and where the answer is. */
function agenda(d){
  const A = [];
  const add = (urgency, tab, label, sub) => A.push({ urgency, tab, label, sub });
  if(d.pendingEvent) add(3, "ludus", d.pendingEvent.title, "a decision is waiting");
  if(d.succession) add(3, "ludus", "The house has no head", "somebody must take it up");
  /* anything with a date on it */
  for(const x of deadlines(d)){
    const n = x.due - d.week;
    if(n > 2) continue;
    const lbl = x.kind==="booking" ? `${x.name} is contracted for ${x.festName}`
      : x.kind==="challenge" ? `${x.name} was named in public`
      : `A levy of ${x.amount}d`;
    add(n<=0?3:2, x.kind==="levy"?"villa":"arena", lbl, n<=0?"due this week":n===1?"due next week":`${n} weeks`);
  }
  { const waiting = patronsOf(d).filter(p=>p.want && p.want.due && p.want.due - d.week <= 2);
    if(waiting.length===1) add(waiting[0].want.due<=d.week?3:2, "villa", `${waiting[0].name} is still waiting`, WANTS[waiting[0].want.kind].label.toLowerCase());
    else if(waiting.length>1) add(waiting.some(p=>p.want.due<=d.week)?3:2, "villa",
      `${waiting.length} patrons are still waiting`, waiting.map(p=>p.name.split(" ").pop()).join(", ")); }
  if(d.romeOffer) add(3, "ludus", "Rome has sent for you", `${d.romeOffer.due - d.week} weeks to answer`);
  /* men */
  for(const g of activeG(d)){
    if(refusing(g)) add(3, "men", `${g.name} will not go out`, "and the block is watching");
    else if(g.ambition && g.ambition.despair) add(2, "men", `${g.name} has stopped asking`, "for the thing he wanted");

  }
  { const going = activeG(d).filter(g=>SLOTS.some(s=>wears(GEAR[g.kit&&g.kit[s]]) && (g.wear&&g.wear[s]||100) < 25));
    if(going.length === 1) add(1, "armory", `${going[0].name}'s steel is close to going`, "have it mended");
    else if(going.length > 1) add(1, "armory", `${going.length} men have steel close to going`, going.map(g=>g.name).join(", "));
    const wrong = activeG(d).filter(g=>!going.includes(g) && kitFaults(d,g).some(f=>f.why==="unfamiliar"));
    if(wrong.length === 1) add(1, "armory", `${wrong[0].name} is carrying the wrong thing`, "it is not his style");
    else if(wrong.length > 1) add(1, "armory", `${wrong.length} men are carrying the wrong thing`, "none of it is their style"); }
  for(const m of unhonoured(d)) if(!m.done)
    add(2, "villa", `${m.name} is not buried properly`, `${RITE_WINDOW-(d.week-m.week)} weeks to decide`);
  /* the town */
  if(d.election && !d.election.done) add(2, "villa", "The aedileship is open", `${Math.max(0,3-(d.week-d.election.week))} weeks to the vote`);
  if(d.games && d.games.offers && d.games.offers.length && activeG(d).some(g=>canFight(g) && g.lastFought<d.week))
    add(2, "arena", d.games.festival, `${d.games.offers.length} on the card`);
  if(d.poach) add(2, "men", `${(d.gladiators.find(x=>x.id===d.poach.gid)||{}).name} is being talked to`, `House ${d.poach.house}`);
  if(d.loan && owes(d) > d.loan.principal*2) add(2, "villa", `${loanLender(d).name} is owed ${owes(d)}d`, "and it is getting away from you");
  if(d.reSignOffer) add(2, "men", "A contract is up", "he can re-sign or walk");
  { const worn = activeG(d).filter(g=>strainOf(g) > 62);
    if(worn.length===1) add(1, "men", `${worn[0].name} is worked past what he has`, strainWord(strainOf(worn[0])));
    else if(worn.length>1) add(1, "men", `${worn.length} men are worked past what they have`, worn.map(g=>g.name).join(", ")); }
  { const p = pactOf(d);
    if(p){ const pace = pactPace(d);
      if(pace === "impossible") add(3, "arena", `${pactOwed(d)} cards owed and ${pactLeft(d)} weeks left`, "it cannot be done now");
      else if(pace === "behind") add(2, "arena", `${pactOwed(d)} cards still owed on your word`, `${pactLeft(d)} weeks to give them`); } }
  { const rp = ruinPending(d);
    if(rp) add(3, "villa", `This house has ${rp.weeks} week${rp.weeks===1?"":"s"} to change something`,
      rp.kind==="banned" ? "the aedile is preparing to strike you off"
      : rp.kind==="disgrace" ? "the editors are not asking any more"
      : "a rival is taking it apart"); }
  { const onPlan = activeG(d).filter(g=>seasonOfMan(g));
    const risk = onPlan.filter(g=>g.fatigue > 70 || strainOf(g) > 66);
    if(risk.length) add(1, "men", `${risk.length===1?risk[0].name+" is":risk.length+" men are"} being run into the ground on a season`,
      "a broken season pays nothing"); }
  { const un = unsworn(d);
    if(un.length === 1) add(1, "men", `${un[0].name} has not been sworn in`, "open his page to have the oath said");
    else if(un.length > 1) add(1, "men", `${un.length} men have not been sworn in`, un.map(g=>g.name).join(", ")); }
  for(const g of activeG(d)) if(canMaster(d,g)) add(1, "men", `${g.name} has earned his mastery`, "the doctore would say so out loud");
  { const f = ripeFeud(d); if(f) add(2, "men", `${f.a.name} and ${f.b.name} are close to it`, "the yard has noticed"); }
  if(d.doctoreOffer) add(2, "market", "A doctore is offering", "he will not wait long");
  if(d.unrest >= 70) add(2, "ludus", "The cells are close to fire", unrestWord(d.unrest));
  if(d.lanista && d.lanista.health < 30 && !d.heir) add(2, "ludus", "You are failing and have named nobody", "the house dies with you");
  { const br = inBreach(d);
    if(br.length) add(lawOf(d).heat>=45?3:2, "villa",
      `The house is in breach of ${br.length===1?"an edict":br.length+" edicts"}`, lawWord(d)); }
  if(d.gold >= 9000 && !WORK_KEYS.some(k=>workOn(d,k)) && WORK_KEYS.some(k=>!workDone(d,k)))
    add(1, "villa", `${Math.round(d.gold)}d sitting in the box`, "there are things a house this old can build");
  if(liquid(d) < 120 && owedTotal(d) >= 250)
    add(2, "villa", `${owedTotal(d)}d owed to you and ${Math.round(liquid(d))} in the box`, "rich on paper is not rich");
  { const bad = owedList(d).filter(x=>d.week - x.due >= 4);
    if(bad.length) add(1, "villa", `${bad[0].from} has stopped paying`, `${bad[0].amount}d, ${d.week - bad[0].due} weeks late`); }
  if(bayHolder(d)) add(2, "arena", `House ${bayHolder(d)} has the bay`, `${baySince(d)} weeks and Capua has noticed`);
  else { const rust = Object.keys(CITIES).filter(k=>k!==d.city && (d.known&&d.known[k]||0) >= 12);
    if(rust.length && !d.city && !d.travel)
      add(1, "arena", `They are forgetting you in ${CITIES[rust[0]].name}`, "standing built down there is bleeding away"); }
  if(rackOver(d)) add(2, "armory", `The armoury is ${rackOver(d)} past what it holds`, `${rackRent(d)}d a week and everything wearing faster`);
  if((d.deadSteel||[]).length) add(1, "armory", `${d.deadSteel.length} piece${d.deadSteel.length===1?"":"s"} came back off a body`, "somebody will have to carry it");
  if((d.market||[]).length && d.gold > 500 && activeG(d).length < 6)
    add(1, "market", "There are men on the block", `${d.market.length} standing`);
  return A.sort((a,b)=>b.urgency-a.urgency);
}
const URG = { 3:{c:"#d96f5d",w:"now"}, 2:{c:"#d8ac5f",w:"soon"}, 1:{c:"#b09b7d",w:"when you can"} };

/* ---- SEEDED RANDOMNESS ----
   Every roll in this game came out of Math.random, which means no house could
   ever be handed to anybody else and no measurement could ever be repeated.
   One mulberry32 behind the same R() everything already calls. */
let RNG = (Math.random()*4294967296)>>>0;
const R = () => {
  RNG = (RNG + 0x6D2B79F5) >>> 0;
  let t = RNG;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rngGet = () => RNG;
const rngSet = n => { RNG = (n>>>0); };
/* a seed anyone can read down a telephone */
const SEED_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function seedToNum(s){
  const t = String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(!t) return (Math.random()*4294967296)>>>0;
  let h = 2166136261>>>0;
  for(let i=0;i<t.length;i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619)>>>0; }
  return h>>>0;
}
function newSeedWord(){
  let n = (Math.random()*4294967296)>>>0, out = "";
  for(let i=0;i<8;i++){ out += SEED_CHARS[n % SEED_CHARS.length]; n = Math.floor(n/SEED_CHARS.length) || ((Math.random()*4294967296)>>>0); }
  return out.slice(0,4) + "-" + out.slice(4,8);
}
const ri = (a,b)=>a+Math.floor(R()*(b-a+1));
const pick = a=>a[Math.floor(R()*a.length)];
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const clone = s=>JSON.parse(JSON.stringify(s));
const rnd = v=>Math.round(v);
const fameTitle = f=>{ let t=FAME_TIERS[0][1]; for(const p of FAME_TIERS) if(f>=p[0]) t=p[1]; return t; };
const activeG = d=>d.gladiators.filter(g=>g.status==="active");
const GONE = ["dead","freed","escaped","retired","departed"];
const isGone = g => GONE.includes(g.status);
const gladValue = g=>rnd((90 + STATS.reduce((s,k)=>s+g[k],0)*1.1 + g.potential*1.8 + g.wins*14) * agePrice(g.age));

/* ---- AGE ----
   A man grows into his body, holds it a few years, then loses it a piece at a time.
   The craft (tec/sho/dis) stays; the engine (str/agi/end) is what goes. */
const WEEKS_PER_YEAR = YEAR_WEEKS;
const PRIME = [23, 28];
const ageTrain = a => a<20 ? 1.3 : a<23 ? 1.15 : a<=PRIME[1] ? 1.0 : a<=31 ? 0.72 : 0.42;
const agePrice = a => a<=21 ? 1.05 : a<=PRIME[1] ? 1.0 : a<=31 ? 0.74 : 0.5;
const DECAY_RATE = { agi:1.4, end:1.2, str:1.0 };
const ageWord = a => a<PRIME[0] ? "still filling out" : a<=PRIME[1] ? "in his prime" : a<=31 ? "past his peak" : a<=34 ? "an old lion" : "long past the sand";
const ageTag  = a => a<PRIME[0] ? "Young" : a<=PRIME[1] ? "Prime" : a<=31 ? "Past peak" : "Veteran";

/* ---- SCARS ----
   Wounds no longer heal clean. Where a man is cut twice, something never comes back. */
const SCAR_STAT = { brow:"dis", shoulder:"str", arm:"str", hand:"tec", thigh:"agi", flank:"end" };
const SCAR_WORD = { brow:"brow", shoulder:"shoulder", arm:"arm", hand:"hand", thigh:"thigh", flank:"flank" };
const statCap = (g,k) => 99 - ((g.scarCap && g.scarCap[k]) || 0);
const scarBurden = g => g.scarCap ? Object.values(g.scarCap).reduce((s,v)=>s+v,0) : 0;
/* ---- WHAT NEVER QUITE CLOSES ----
   Scars cost a stat and cap it. But a man carried off four times is not the same
   fighter with marks drawn on him — something in him stops working properly, and
   it is the kind of thing he only finds out about in the eleventh round. */
const LASTING = {
  knee:   { name:"a knee that goes", part:"thigh",
    say:"It holds all week and then it does not, usually at the worst moment.",
    stam:1.14, latePow:0.93, fatigue:1.12 },
  wind:   { name:"no wind since the ribs", part:"flank",
    say:"He was never quick but he used to be able to keep going. Now there is a point past which there is nothing.",
    stam:1.22, latePow:0.9 },
  hand:   { name:"a hand that will not close", part:"hand",
    say:"He can hold a sword. He cannot hold it the way he used to at the end of a long one.",
    atk:0.985, latePow:0.90 },
  eye:    { name:"the eye on that side", part:"brow",
    say:"He turns his whole head now where he used to turn his eyes, and men who have fought him know it.",
    guard:0.982, latePow:0.92, read:0.8 },
  arm2:   { name:"a shoulder that hangs", part:"shoulder",
    say:"It sits lower than the other one and he has stopped pretending otherwise. The medicus says it mended.",
    atk:0.985, guard:0.985, latePow:0.93, heal:0.85 },
};
const LAST_KEYS = Object.keys(LASTING);
const lastingOf = g => (g && g.lasting) || [];
/* A veteran does not die at a novice's rate. He has been down before, he knows how
   to go down, and the editor has more reason to lean the other way. Without this the
   2% per bout that is right for one afternoon compounds to a coin flip over a career. */
const veteranGuard = g => {
  if(!g) return 0;
  const w = g.wins || 0;
  return Math.min(11, w*0.5 + Math.min(4, (g.pfame||0)/45));
};
const hasLasting = (g,k) => lastingOf(g).includes(k);
const lastNum = (g, field, dflt) => lastingOf(g).reduce((n,k)=>{
  const L = LASTING[k]; return (L && L[field]!=null) ? n * L[field] : n; }, dflt==null?1:dflt);
/* the wounds that gave it to him */
function checkLasting(d, g, part){
  if(!g) return null;
  const hits = (g.scars||[]).filter(s=>s.part===part).length;
  if(hits < 3) return null;
  const k = LAST_KEYS.find(x=>LASTING[x].part===part && !hasLasting(g,x));
  if(!k) return null;
  g.lasting = [...lastingOf(g), k];
  g.morale = clamp(g.morale-12, 0, 100);
  remember(d, g, "hurt");
  chron(d, `${fullName(g)} has been opened up in the same place too many times. ${LASTING[k].say} He has ${LASTING[k].name} now and he will have it for the rest of it.`, "bad");
  return k;
}

function addScar(g, target, severe){
  const t = TARGETS.find(x=>x[0]===target) || TARGETS[3];
  g.scars = g.scars || [];
  g.scarCap = g.scarCap || {};
  const prior = g.scars.filter(s=>s.part===target).length;
  const deep = !!severe || prior>0;
  g.scars.push({ part:target, x:t[1][0], y:t[1][1], big:deep });
  const k = SCAR_STAT[target] || "end";
  g[k] = Math.max(6, g[k] - (prior>0 ? 3 : 1));
  g.scarCap[k] = Math.min(34, (g.scarCap[k]||0) + (prior>0 ? 7 : 2));
  g.lastCheck = target;
  return prior>0;
}
const retireEligible = g => g.age>=31 || scarBurden(g)>=20;

/* ---- THE BODY REMEMBERS ----
   A fighter is the sum of everything that has happened to him. Years past his
   prime, every old scar, every hurt that never mended right — they add up into
   a body that breaks a little easier than it used to. It is what makes a grizzled
   veteran worth watching and a worry to send out on the same afternoon. */
function bodyWear(g){
  if(!g) return 0;
  const yrs  = Math.max(0, (g.age||24) - PRIME[1]) * 0.045;   // the years past his peak
  const scar = scarBurden(g) * 0.011;                          // what the old wounds cost
  const last = lastingOf(g).length * 0.10;                     // and what never closed
  return clamp(yrs + scar + last, 0, 0.85);
}
const wornWord = w => w<0.12 ? "sound" : w<0.26 ? "seasoned" : w<0.44 ? "battle-worn"
  : w<0.64 ? "breaking down" : "held together with linen";
const wornColour = w => w<0.12 ? "#8a9c6a" : w<0.26 ? "#b5a06a" : w<0.44 ? "#cf9a4b"
  : w<0.64 ? "#d07a4a" : "#cf5a49";
/* a grave wound can leave something permanent on its own — no need to be opened
   three times, only to be opened badly once, and the more worn the body the likelier */
function graveLasting(d, g, part, care){
  if(!g || !part) return null;
  const k = LAST_KEYS.find(x=>LASTING[x].part===part && !hasLasting(g,x));
  if(!k) return null;
  const careMult = care==="surgeon" ? 0.45 : care==="convalesce" ? 0.3 : 1;
  const risk = (0.12 + bodyWear(g)*0.55) * scarGuard(d) * careMult;
  if(R() >= risk) return null;
  g.lasting = [...lastingOf(g), k];
  g.morale = clamp(g.morale-10, 0, 100);
  remember(d, g, "hurt");
  chron(d, `${fullName(g)} rises from the table, but not whole. ${LASTING[k].say} He has ${LASTING[k].name} now, and it does not go away.`, "bad");
  return k;
}
/* a worn body takes a felling harder than a young one — longer to mend, and it hurts more */
function agonyWear(g, inj){
  const w = bodyWear(g);
  if(w <= 0.22 || !inj) return;
  inj.weeks = Math.ceil(inj.weeks * (1 + w*0.55));
  inj.pen   = Math.round(inj.pen  * (1 + w*0.38));
}
/* one turn of the year on a man's body */
function ageManOneYear(d, g){
  const before = g.age;
  g.age = (g.age||24) + 1;
  const cross = (lo) => before <= lo && g.age > lo;
  if(cross(PRIME[1]))      chron(d, `${g.name} is ${g.age} now. The doctore has started resting him a day the younger men do not get.`);
  else if(cross(31))       chron(d, `${g.name} turns ${g.age}. He is a veteran of the sand, and the sand is beginning to ask for it back.`, "bad");
  else if(cross(34))       chron(d, `${g.name} is ${g.age}. Old for this. Every card now, someone in the crowd wonders aloud if it is his last.`, "bad");
}

/* ---- PATRONS ----
   Favor was a number. It is four or five Romans with names, appetites and long memories,
   and one of them has his hand on the editor's thumb when your man is in the sand. */
const PRAENOMINA = ["Marcus","Quintus","Gaius","Lucius","Titus","Publius","Gnaeus","Aulus","Decimus","Servius"];
const NOMINA = ["Cornelius","Claudius","Valerius","Aemilius","Julius","Fabius","Sempronius","Licinius","Calpurnius","Terentius"];
const COGNOMINA = ["Varro","Longinus","Crassus","Rufus","Pulcher","Scaevola","Cato","Nerva","Gracchus","Bibulus"];
const FEM_NOMINA = ["Cornelia","Claudia","Valeria","Aemilia","Julia","Fabia","Licinia","Terentia","Antonia","Servilia"];
const FEM_COG = ["Maior","Minor","Secunda","Tertia","Pulchra","Rufina"];

const RANKS = {
  magistrate: { name:"Magistrate", weight:1.2, fameGate:0,
    blurb:"He puts on the games. What he wants, the sand gets.",
    wants:["blood","spectacle","party"] },
  merchant:   { name:"Merchant", weight:0.8, fameGate:0,
    blurb:"Coin first, always. He would buy your best man tomorrow.",
    wants:["sell","win","party"] },
  noble:      { name:"Noblewoman", weight:1.0, fameGate:60,
    blurb:"She has favourites, and she is not quiet about them.",
    wants:["showman","mercy","party"] },
  senator:    { name:"Senator", weight:1.5, fameGate:220,
    blurb:"The road to Rome runs through men like him.",
    wants:["win","spectacle","mercy"] },
};
const rankKeys = ["magistrate","merchant","noble","senator"];
const patronWord = f => f<15 ? "affronted" : f<32 ? "cool" : f<52 ? "civil" : f<72 ? "warm" : f<88 ? "a friend of the house" : "devoted";
const patronColor = f => f<15 ? "#cf5a49" : f<32 ? "#9c8a6f" : f<72 ? "#cfc0a0" : "#e0bd72";

function makePatron(d, rank){
  const fem = rank==="noble";
  const name = fem
    ? `${pick(FEM_NOMINA)} ${pick(FEM_COG)}`
    : `${pick(PRAENOMINA)} ${pick(NOMINA)} ${pick(COGNOMINA)}`;
  return { id:d.nextId++, name, rank, favor:ri(28,42), want:null, since:d.week, served:0, slighted:0 };
}
const patronsOf = d => d.patrons || (d.patrons = []);
/* The house's standing is what all of them together think of you. */
function recomputeFavor(d){
  const ps = patronsOf(d);
  if(!ps.length){ d.favor = 0; return; }
  let num=0, den=0;
  for(const p of ps){ const w = RANKS[p.rank].weight; num += p.favor*w; den += w; }
  d.favor = clamp(rnd(num/den), 0, 100);
}
const topPatron = d => patronsOf(d).reduce((m,p)=> (!m || p.favor>m.favor) ? p : m, null);

/* ---- WHAT THEY WANT ----
   A want is a small contract with a deadline. Meeting it buys real standing;
   letting it lapse is remembered longer. */
const WANTS = {
  blood: { label:"a death on the sand", weeks:4, gain:14, loss:11,
    ask:(d,p)=>`${p.name} wants a death at the next games. Not a bout — a death.`,
    done:"He got what he came for. He will remember that you provided it." },
  spectacle: { label:"a bout Capua will talk about", weeks:4, gain:12, loss:8,
    ask:(d,p)=>`${p.name} is bored. He wants a bout the city will still be talking about next month — a crowd on its feet.`,
    done:"The roar reached his box, and he stood with the rest of them." },
  mercy: { label:"a beaten man spared", weeks:5, gain:13, loss:9,
    ask:(d,p)=>`${p.name} has grown sick of the killing. Show the crowd a beaten man spared and it will be noticed.`,
    done:"The thumb turned up, and she was watching you when it did." },
  win: { label:"a victory he has money on", weeks:4, gain:11, loss:8,
    ask:(d,p)=>`${p.name} has money on your house at the coming games. See that it is not wasted.`,
    done:"He collected. That is the only kind of gratitude this one has." },
  party: { label:"an invitation to your table", weeks:5, gain:12, loss:9,
    ask:(d,p)=>`${p.name} has let it be known — twice — that he has not been to your villa in some time.`,
    done:"He came, he drank your wine, and he left in a better humour than he arrived." },
  sell: { label:"a man sold to him", weeks:5, gain:16, loss:10,
    ask:(d,p,g)=>`${p.name} has taken an interest in ${g?fullName(g):"one of your men"} and would like to own him.`,
    done:"The man was delivered. Coin and goodwill both." },
  showman: { label:"your showiest man on the card", weeks:4, gain:13, loss:9,
    ask:(d,p,g)=>`${p.name} asks after ${g?g.name:"your showiest man"} by name. She would like to see him fight.`,
    done:"He fought, she watched, and half of Capua watched her watching." },
};

function askWant(d, p){
  const opts = RANKS[p.rank].wants.filter(k=>WANTS[k]);
  const kind = pick(opts);
  const act = activeG(d);
  let gid = null;
  if(kind==="sell" && act.length) gid = act.reduce((m,g)=>gladValue(g)>gladValue(m)?g:m, act[0]).id;
  if(kind==="showman" && act.length) gid = act.reduce((m,g)=>g.sho>m.sho?g:m, act[0]).id;
  if((kind==="sell"||kind==="showman") && !gid) return;
  const g = gid ? d.gladiators.find(x=>x.id===gid) : null;
  p.want = { kind, gid, weeks: WANTS[kind].weeks, due: d.week + WANTS[kind].weeks };
  chron(d, WANTS[kind].ask(d,p,g), "event");
}

/* Something happened in the ludus; see which patron cares. */
function serveWants(d, ev){
  for(const p of patronsOf(d)){
    const w = p.want; if(!w) continue;
    let hit = false;
    if(ev.type==="fight"){
      if(w.kind==="blood" && ev.oppDied) hit = true;
      if(w.kind==="spectacle" && ev.crowd>=78) hit = true;
      if(w.kind==="mercy" && ev.spared) hit = true;
      if(w.kind==="win" && ev.win && ev.tier>=1) hit = true;
      if(w.kind==="showman" && ev.gid===w.gid) hit = true;
    } else if(ev.type==="party" && w.kind==="party") hit = true;
    else if(ev.type==="sell" && w.kind==="sell" && ev.gid===w.gid) hit = true;
    if(!hit) continue;
    p.favor = clamp(p.favor + WANTS[w.kind].gain, 0, 100);
    p.served++; p.want = null;
    chron(d, `${p.name}: ${WANTS[w.kind].done}`, "good");
  }
  recomputeFavor(d);
}

/* ---- CALLING IT IN ----
   Standing has only ever sat on the missio roll. These four owe you something,
   and each of them can do exactly one thing that nobody else in Capua can. */
const FAVOURS = {
  magistrate: { title:"A word with the other house", cost:30, wait:22,
    ask:"He knows every lanista in Campania and has leverage on most of them. He will make one of them let a thing drop.",
    can:d=>(d.rivals||[]).some(h=>h.grudge>=25 && warmth(d,h.name)<45),
    run(d,p){
      const h = (d.rivals||[]).sort((a,b)=>b.grudge-a.grudge)[0];
      const was = Math.round(h.grudge);
      h.grudge = clamp(h.grudge-55, 0, 100);
      if(d.poach && d.poach.house===h.name) d.poach = null;
      if(d.nemesis && d.nemesis.house===h.name && !d.nemesis.hated) d.nemesis = null;
      return `${p.name} has a word with ${lanistaOf(h.name).name}. Whatever was said, the man has stopped writing your name down — grudge ${was} to ${Math.round(h.grudge)}.`;
    } },
  merchant: { title:"He stands the house a season", cost:28, wait:26,
    ask:"He will carry your upkeep for ten weeks and not mention it again, which from him is remarkable and probably expensive later.",
    can:()=>true,
    run(d,p){ d.flags.underwritten = (d.flags.underwritten||0) + 10;
      return `${p.name} tells his steward to settle your accounts for the next ten weeks. He does not say why and you do not ask.`; } },
  noble: { title:"A story at the baths", cost:26, wait:20,
    ask:"She will tell a story about another house. It will not be true and it will not need to be.",
    can:d=>(d.rivals||[]).some(h=>h.fame>20),
    run(d,p){
      const h = (d.rivals||[]).sort((a,b)=>b.fame-a.fame)[0];
      const lost = Math.min(h.fame, rnd(60+R()*40));
      h.fame -= lost;
      h.grudge = clamp(h.grudge+18, 0, 100);
      addRep(d, "show", 6);
      return `${p.name} tells a story about House ${h.name} at the baths, and by the market it has grown two heads. It costs them ${lost} fame. They will work out who started it.`;
    } },
  senator: { title:"A name dropped in Rome", cost:34, wait:30,
    ask:"He will say your house's name somewhere it carries. Rome is a long way off and it hears a great deal.",
    can:()=>true,
    run(d,p){ const n = rnd(45+R()*35);
      d.fame += n; d.flags.romeEarly = 1;
      return `${p.name} mentions your house in a room in Rome. You will never know which room. Fame +${n}, and the imperial invitation will not wait as long as it would have.`; } },
};
const favourReady = (d,p) => { const F = FAVOURS[p.rank]; if(!F) return false;
  return p.favor >= F.cost && (!p.calledAt || d.week - p.calledAt >= F.wait) && F.can(d); };
const favourWait = (d,p) => { const F = FAVOURS[p.rank];
  return (p.calledAt && d.week - p.calledAt < F.wait) ? F.wait - (d.week - p.calledAt) : 0; };
function callFavour(d, pid){
  const p = patronsOf(d).find(x=>x.id===pid);
  if(!p || !favourReady(d,p)) return null;
  const F = FAVOURS[p.rank];
  p.favor = clamp(p.favor - F.cost, 0, 100);
  p.calledAt = d.week;
  recomputeFavor(d);
  const line = F.run(d, p);
  chron(d, line, "good");
  return line;
}

function patronWeek(d){
  const ps = patronsOf(d);
  // word of a rising house reaches further up the ladder
  for(const rk of rankKeys){
    if(ps.some(p=>p.rank===rk)) continue;
    if(d.fame >= RANKS[rk].fameGate && (RANKS[rk].fameGate===0 || R()<0.14)){
      const p = makePatron(d, rk);
      ps.push(p);
      chron(d, `${p.name} has begun asking about your house. ${RANKS[rk].blurb}`, "good");
      break;
    }
  }
  for(const p of ps){
    if(p.want){
      p.want.weeks--;
      if(p.want.weeks<=0){
        p.favor = clamp(p.favor - WANTS[p.want.kind].loss, 0, 100);
        p.slighted++;
        chron(d, `${p.name} asked, and you did not answer. He has stopped asking.`, "bad");
        p.want = null;
      }
    } else if(R()<0.09) askWant(d, p);
    p.favor = clamp(p.favor - 0.35*lanPatronDecay(d), 0, 100);   // standing decays without attention
    if(p.favor>=85 && R()<0.10){
      const gift = rnd(120 + p.favor*3);
      d.gold += gift;
      chron(d, `A gift arrives from ${p.name} — ${gift} denarii and no explanation. That is how it is done.`, "good");
    }
    if(p.favor<=10 && R()<0.09){
      d.fame = Math.max(0, d.fame-6);
      chron(d, `${p.name} has been saying things about your house at the baths. None of them useful.`, "bad");
    }
  }
  recomputeFavor(d);
}

/* ---- REGIMENS ----
   How a man trains, not just what he trains. The palus is safe and steady;
   sparring is the fastest way to make a fighter and the fastest way to break one. */
/* Eight things a man can be made to do with his week, and none of them are free. */
const REGIMENS = {
  palus:   { name:"The Palus", short:"PALUS", focus:true, rate:1.0, fat:12,
    desc:"Post work with the wooden sword. Whatever you point him at, steadily, and safely." },
  weights: { name:"The Weights", short:"WEIGHTS", gains:{str:1.55}, costs:{agi:0.30}, fat:16,
    desc:"Stone and halteres until the arms give out. He will be stronger and he will be slower." },
  pila:    { name:"The Pila", short:"PILA", gains:{tec:0.95, dis:0.55}, fat:12,
    desc:"Throwing and recovering at the marks. Precision and patience, in that order." },
  sand:    { name:"Footwork", short:"FOOT", gains:{agi:1.05, tec:0.40}, fat:11,
    desc:"The measured square, all week, at walking pace. Dull, and it is where bouts are won." },
  hill:    { name:"The Hill", short:"HILL", gains:{end:1.25}, fat:-9,
    desc:"Running the hill and hauling stone. Builds wind and works the fatigue out of him." },
  spar:    { name:"Sparring", short:"SPAR", learn:true, fat:14,
    desc:"Paired against another of your men. He learns whatever his partner is better at — and either of them can be hurt." },
  crowd:   { name:"Playing to the Yard", short:"CROWD", gains:{sho:1.35}, costs:{dis:0.28}, fat:10,
    desc:"Flourishes, the turn, the pause before the kill. Sells tickets and teaches him to think about being watched." },
  rest:    { name:"Rest", short:"REST", fat:-24, mend:true,
    desc:"A day out of the sun. Nothing gained, everything mended, and strain finally comes off." },
};
const REG_KEYS = Object.keys(REGIMENS);
/* work him past what he has and it stops coming back with a night's sleep */
const strainOf = g => clamp(g.strain||0, 0, 100);
const strainWord = s => s<12?"fresh" : s<32?"working" : s<55?"worn thin" : s<75?"overworked" : "run into the ground";
const strainDrag = g => 1 - strainOf(g)/150;          // gains fall away
const strainRisk = g => 1 + strainOf(g)/90;           // and he starts breaking
const SPAR_BASE = 1.45, SPAR_INJ = 0.015;
function sparPartner(d, g){
  if(g.regimen!=="spar" || !g.sparWith) return null;
  const p = d.gladiators.find(x=>x.id===g.sparWith);
  return (p && p.status==="active" && p.regimen==="spar" && p.sparWith===g.id) ? p : null;
}
const regimenWord = (d,g) => {
  if(g.regimen==="rest") return "Resting";
  if(g.regimen==="cond") return "Conditioning";
  if(g.regimen==="spar"){ const p = sparPartner(d,g); return p ? `Sparring with ${p.name}` : "Sparring — no partner"; }
  return `At the palus · ${STAT_NAMES[g.focus]}`;
};

/* ---- THE CELL BLOCK ----
   Men locked together for years do not stay strangers. They pair off at the palus,
   they take sides, and when one of them dies on the sand the others are in the room.
   Bonds are the warmest thing in the ludus and the most dangerous thing you own. */
const MAX_TIES = 3;
const tieList = d => d.ties || (d.ties = []);
const tiesOf = (d,id) => tieList(d).filter(t=>t.a===id || t.b===id);
const tieOther = (t,id) => t.a===id ? t.b : t.a;
const tieBetween = (d,a,b) => tieList(d).find(t=>(t.a===a&&t.b===b)||(t.a===b&&t.b===a));
const kinOf = (d,id,kind) => tiesOf(d,id).filter(t=>t.kind===kind).map(t=>tieOther(t,id));
const tieWord = t => t.kind==="brother"
  ? (t.strength>=70 ? "would die for him" : t.strength>=40 ? "close" : "friendly")
  : (t.strength>=70 ? "hatred" : t.strength>=40 ? "bad blood" : "friction");

function addTie(d, a, b, kind, strength){
  if(a===b) return null;
  const ex = tieBetween(d,a,b);
  if(ex){
    if(ex.kind===kind){ ex.strength = clamp(ex.strength + 12, 1, 100); return ex; }
    ex.kind = kind; ex.strength = clamp(strength||30, 1, 100); return ex;   // feeling turns
  }
  if(tiesOf(d,a).length>=MAX_TIES || tiesOf(d,b).length>=MAX_TIES) return null;
  const t = { a, b, kind, strength: clamp(strength||28, 1, 100), since: d.week };
  tieList(d).push(t);
  return t;
}
const dropTies = (d,id) => { d.ties = tieList(d).filter(t=>t.a!==id && t.b!==id); };

/* Brothers feel what happens to each other. Returns the men who reacted. */
function kinReact(d, id, kind, moraleDelta, defianceDelta){
  const hit = [];
  for(const t of tiesOf(d,id)){
    if(t.kind!==kind) continue;
    const o = d.gladiators.find(g=>g.id===tieOther(t,id));
    if(!o || o.status!=="active") continue;
    const w = 0.4 + t.strength/100*0.6;
    o.morale = clamp(o.morale + moraleDelta*w, 0, 100);
    o.defiance = clamp(o.defiance + defianceDelta*w, 0, 100);
    hit.push(o);
  }
  return hit;
}

/* Ties form at the palus: same origin, same drills, or simply years in the same room. */
/* Men who spar all week end up knowing each other, one way or the other. */
function sparSocial(d){
  const done = new Set();
  for(const g of activeG(d)){
    const p = sparPartner(d,g);
    if(!p || done.has(g.id)) continue;
    done.add(g.id); done.add(p.id);
    const t = tieBetween(d, g.id, p.id);
    if(!t){
      if(R()<0.12 && addTie(d, g.id, p.id, "brother", 25))
        chron(d, `${g.name} and ${p.name} have been paired at the palus long enough to stop counting bruises. They eat together now.`);
    } else if(t.kind==="rival"){
      if(R()<0.06){ t.kind="brother"; t.strength=clamp(t.strength,30,100);
        chron(d, `Whatever ${g.name} and ${p.name} were owed each other, they have beaten out of one another at the post. It is finished.`);
      } else t.strength = clamp(t.strength+2, 1, 100);
    } else t.strength = clamp(t.strength+2, 1, 100);
  }
}

function repairSpar(d){
  for(const g of d.gladiators){
    if(isGone(g) || g.regimen!=="spar") continue;
    if(!sparPartner(d,g)){ g.regimen = "palus"; g.sparWith = null; }
  }
}

function weaveTies(d){
  const act = activeG(d);
  d.ties = tieList(d).filter(t=>{
    const A = d.gladiators.find(g=>g.id===t.a), B = d.gladiators.find(g=>g.id===t.b);
    return A && B && !isGone(A) && !isGone(B);
  });
  for(const t of tieList(d)){
    const A = d.gladiators.find(g=>g.id===t.a), B = d.gladiators.find(g=>g.id===t.b);
    if(!A || !B || A.status!=="active" || B.status!=="active") continue;
    let g = 1.2;
    if(A.focus===B.focus && A.regimen!=="rest" && B.regimen!=="rest") g += 1.6;
    if(sparPartner(d,A) && sparPartner(d,A).id===B.id) g += 2.4;
    if(t.kind==="brother"){
      A.morale = clamp(A.morale + 0.5, 0, 100);
      B.morale = clamp(B.morale + 0.5, 0, 100);
    } else {
      A.morale = clamp(A.morale - 0.6, 0, 100);
      B.morale = clamp(B.morale - 0.6, 0, 100);
      const k = CLASSES[A.cls].key[0], k2 = CLASSES[B.cls].key[0];   // spite is a whetstone
      A[k] = clamp(A[k] + 0.10, 5, statCap(A,k));
      B[k2] = clamp(B[k2] + 0.10, 5, statCap(B,k2));
    }
    t.strength = clamp(t.strength + g, 1, 100);
  }
  if(act.length<2 || R()>0.22) return;
  const a = pick(act);
  const pool = act.filter(g=>g.id!==a.id && !tieBetween(d,a.id,g.id) && tiesOf(d,g.id).length<MAX_TIES);
  if(!pool.length || tiesOf(d,a.id).length>=MAX_TIES) return;
  const b = pool.reduce((best,g)=>{
    let s = R()*10;
    if(g.origin===a.origin) s += 9;
    if(g.focus===a.focus && g.regimen!=="rest") s += 6;
    if(g.cls===a.cls) s += 3;
    return s > best.s ? {g,s} : best;
  }, {g:pool[0], s:-1}).g;
  const warm = (a.morale+b.morale)/2 > 48 && d.unrest < 70;
  const kind = warm && R()<0.78 ? "brother" : "rival";
  if(!addTie(d, a.id, b.id, kind, ri(20,34))) return;
  chron(d, kind==="brother"
    ? (a.origin===b.origin
        ? `${a.name} and ${b.name} have taken to speaking their own tongue in the dark. Two ${a.origin}s in a Roman cell.`
        : `${a.name} and ${b.name} have started working the palus together, and eating together after.`)
    : `${a.name} and ${b.name} have stopped speaking. The doctore has begun keeping them at opposite ends of the square.`);
}

/* ---- MENTOR AND PROTEGE ----
   An old hand takes a green one under his wing. The boy learns faster and drifts
   toward what the veteran is good at; the bond runs deeper than an ordinary tie.
   When one of them is carried out, the other takes it harder than the ledger does.
   Formed by the "mentor" event; stored as g.mentor / g.protege (with names kept so
   grief can still speak after the man is off the books). */
const bestStatKey = g => STATS.reduce((b,k)=> (g[k]||0)>(g[b]||0)?k:b, STATS[0]);
const isMentored = g => !!(g.mentor || g.protege);
function mentorWeek(d){
  for(const g of d.gladiators){
    if(g.status!=="active") continue;
    /* the boy's side */
    if(g.mentor){
      const m = d.gladiators.find(x=>x.id===g.mentor);
      if(!m || m.status!=="active"){
        const nm = g.mentorName || (m && m.name) || "the old hand";
        g.morale = clamp(g.morale-14,0,100); g.defiance = clamp(g.defiance+6,0,100);
        g.mentor = null; g.mentorName = null;
        chron(d, `${g.name} lost the man who taught him. ${nm} is gone, and the boy works the palus alone now, harder and with something behind it.`, "bad");
      } else {
        if(g.regimen && g.regimen!=="rest"){
          const bk = bestStatKey(m);
          g[bk] = clamp((g[bk]||10) + 0.6, 5, statCap(g,bk));
          g.morale = clamp(g.morale+0.5,0,100);
        }
        if(g.wins>=5){   /* the teaching is done */
          m.protege = null; m.protegeName = null; g.mentor = null; g.mentorName = null;
          remember(d, m, "taught");
          if(tieBetween(d,g.id,m.id)) addTie(d,g.id,m.id,"brother",0); else addTie(d,g.id,m.id,"brother",52);
          m.morale = clamp(m.morale+8,0,100);
          chron(d, `${m.name} watched ${g.name} take his fifth. The boy is made — the teaching is done, and the two of them are something else now.`, "good");
        }
      }
    }
    /* the old man's side — his boy taken from him */
    if(g.protege){
      const r = d.gladiators.find(x=>x.id===g.protege);
      if(!r || r.status!=="active"){
        const nm = g.protegeName || (r && r.name) || "the boy";
        g.morale = clamp(g.morale-12,0,100);
        g.protege = null; g.protegeName = null;
        chron(d, `${g.name} has no one to bring on now. ${nm} is gone, and the old man has gone quiet with it.`, "bad");
      }
    }
  }
}

/* ---- THE DOCTORE ----
   The man who runs the training square. A hired one is competent and costly;
   one of your own, freed and choosing to stay, is worth more than any of them —
   both at the palus and in what the men see when they look at him. */
const docWord = s => s<45 ? "a competent hand" : s<60 ? "a hard man on the sand"
  : s<75 ? "a true doctore" : s<88 ? "famed across Campania" : "the finest in Capua";
/* The doctore can drill the whole yard, or take one man and work only on him.
   The second is far better for that man and worse for everybody else. */
const docPupil = d => (d.doctore && d.doctore.pupil) || null;
const docTrain = (d, stat, g) => {
  const doc = d.doctore; if(!doc) return 1;
  const p = docPupil(d);
  const isPupil = p && g && g.id===p;
  const share = !p ? 0.32 : isPupil ? 0.85 : 0.13;
  return (1 + doc.skill/100*share) * (doc.spec===stat ? 1.28 : 1);
};
const docInjuryGuard = (d, g) => {
  const doc = d.doctore; if(!doc) return 1;
  const isPupil = docPupil(d) && g && g.id===docPupil(d);
  return 1 - doc.skill/200 * (isPupil ? 1.8 : 1);
};

/* What a week of his undivided attention can turn up. */
const DOC_LESSONS = {
  potential: { weight:3, run:(d,doc,g)=>{ const n = ri(2,4); g.potential = clamp(g.potential+n, 20, 99);
    return `${doc.name} spends the week on ${g.name}'s footwork and finds something nobody had looked for. There is more in ${PR(g).him} than the block suggested.`; } },
  trait: { weight:2, run:(d,doc,g)=>{
    const pool = ["Swift Learner","Stoic","Iron Hide","Showman"].filter(t=>!g.traits.includes(t));
    if(!pool.length) return null;
    const t = pick(pool); g.traits.push(t);
    return `${doc.name} drills one thing into ${g.name} all week until it stops being a thing ${PR(g).he} thinks about. ${t}.`; } },
  read: { weight:2, run:(d,doc,g)=>{ if(g.read) return null; g.read = true;
    return `${doc.name} has watched ${g.name} for six days and will now tell you exactly what ${PR(g).he} is — which is not what you were hoping, and not nothing either.`; } },
  steady: { weight:3, run:(d,doc,g)=>{ if(g.defiance<12) return null;
    g.defiance = clamp(g.defiance-11,0,100); g.dis = clamp(g.dis+2, 5, statCap(g,"dis")); g.morale = clamp(g.morale+6,0,100);
    return `${doc.name} takes the fight out of ${g.name}'s eyes and puts it in ${PR(g).his} hands, which is the entire trade of this profession.`; } },
  mend: { weight:2, run:(d,doc,g)=>{
    const caps = Object.keys(g.scarCap||{}).filter(k=>g.scarCap[k]>0);
    if(!caps.length) return null;
    const k = pick(caps);
    g.scarCap[k] = Math.max(0, g.scarCap[k]-5);
    return `${doc.name} works ${g.name}'s old ${STAT_NAMES[k].toLowerCase()} wound every morning until it gives back a little of what it took. It will never be what it was. It is better than it was on Monday.`; } },
};
function docLesson(d, g){
  const doc = d.doctore; if(!doc) return;
  const odds = doc.skill/340 * (doc.fromHouse ? 1.5 : 1);
  if(R() > odds) return;
  const bag = [];
  for(const [k,L] of Object.entries(DOC_LESSONS)) for(let i=0;i<L.weight;i++) bag.push(k);
  const line = DOC_LESSONS[pick(bag)].run(d, doc, g);
  if(line) chron(d, line, "good");
}
const RETRAIN_WEEKS = 3, RETRAIN_FEE = 240;
const WEAR_RATE = { weapon:[3,6], offhand:[2,5], helm:[1,3], armor:[2,4] };
/* a bout takes something out of everything he carries */
function wearKit(d, g, hard){
  if(!g.kit) return;
  g.wear = g.wear || {};
  for(const s of SLOTS){
    const it = GEAR[g.kit[s]];
    if(!wears(it)) continue;
    if(g.wear[s]==null) g.wear[s] = 100;
    const [lo,hi] = WEAR_RATE[s];
    let n = ri(lo,hi) * (hard?1.5:1);
    if(isNamed(g,s)) n *= 0.5;
    n *= perkWear(d) * armourerWear(d) * rackStrain(d);
    g.wear[s] = Math.max(0, g.wear[s] - n);
    if(g.wear[s] <= 0){
      if(isNamed(g,s)){ g.wear[s] = 25;
        chron(d, `${g.named.title} comes off the sand bent and notched, but it comes off the sand. The smith says he can save it.`, "bad");
        continue;
      }
      const broke = it.name;
      const spare = defaultKit(g.cls)[s];
      g.kit[s] = (GEAR[spare] && gearFree(d, spare) > 0) ? spare : BARE[s];
      g.wear[s] = 100;
      chron(d, `${g.name}'s ${broke.toLowerCase()} finally goes — ${s==="weapon"?"snapped at the tang":s==="offhand"?"split through the boss":"beaten out of any use"}. He finishes on house stock.`, "bad");
    }
  }
}
/* the armoury keeps what he carries in order */
function repairWeek(d){
  const L = bLevel(d,"armamentarium");
  if(!L) return;
  for(const g of d.gladiators){
    if(isGone(g) || !g.kit) continue;
    g.wear = g.wear || {};
    for(const s of SLOTS){
      const it = GEAR[g.kit[s]];
      if(!wears(it)) continue;
      if(g.wear[s]==null) g.wear[s] = 100;
      g.wear[s] = Math.min(100, g.wear[s] + L*2.2*armourerMend(d));
    }
  }
}
const repairFee = (d, g) => {
  let n = 0;
  for(const s of SLOTS){ const it = GEAR[g.kit && g.kit[s]];
    if(wears(it)) n += (100 - wearOf(g,s)) * (it.price/900); }
  return rnd(n * [1, .85, .72, .6][bLevel(d,"armamentarium")]);
};
/* a piece made for one man and nobody else */
const FORGE_FEE = 700;
const FORGE_NAMES = ["Vulcan's Tooth","the Grey Wife","Long Answer","Nightwork","the Quiet Argument","Second Thoughts","the Last Word","Winter"];
const forgeReady = (d, g) => bLevel(d,"armamentarium")>=3 && g && !g.named
  && SLOTS.some(s=>wears(GEAR[g.kit && g.kit[s]]));
/* A week of the doctore's whole attention, resolved. */
function doctoreWeek(d){
  const doc = d.doctore;
  if(!doc || !doc.pupil) return;
  const g = d.gladiators.find(x=>x.id===doc.pupil);
  if(!g || g.status!=="active"){
    if(doc.retrainTo){ chron(d, `${doc.name} loses his pupil mid-lesson and the whole thing is abandoned.`); }
    doc.pupil = null; doc.retrainTo = null; doc.retrainLeft = 0;
    return;
  }
  g.morale = clamp(g.morale+2, 0, 100);
  if(doc.retrainTo){
    doc.retrainLeft = (doc.retrainLeft||0) - 1;
    if(doc.retrainLeft > 0){
      chron(d, `${g.name} spends another week unlearning everything he knows. ${doc.retrainLeft} to go.`);
      return;
    }
    const was = g.cls;
    g.cls = doc.retrainTo;
    g.kit = defaultKit(g.cls);
    g.focus = CLASSES[g.cls].key[0];
    for(const k of CLASSES[g.cls].key) g[k] = clamp(g[k]+3, 5, statCap(g,k));
    g.morale = clamp(g.morale+8, 0, 100);
    doc.pupil = null; doc.retrainTo = null; doc.retrainLeft = 0;
    chron(d, `${g.name} comes off the square a ${g.cls.toLowerCase()}. He went on as a ${was.toLowerCase()} three weeks ago and ${doc.name} has taken him apart and put him back the other way round.`, "good");
    return;
  }
  docLesson(d, g);
}
const docCalm = d => d.doctore ? (d.doctore.fromHouse ? 1.2 : 0.4) : 0;
const docWage = doc => doc ? doc.wage : 0;

/* ---- THE DOCTORE ----
   The most-mentioned man in the game and the least realised: a training multiplier
   with a name. He was a gladiator who lived, which is rare, and he has opinions
   about how you are running this. */
const DOC_PASTS = [
  { tag:"who was let up", line:"Fought eleven years and was let up twice, which he mentions when a man of yours goes down and not otherwise." },
  { tag:"who bought himself out", line:"Bought his own freedom a coin at a time over nine years and has never once said what it cost him." },
  { tag:"who was freed at Rome", line:"Given the rudis on the imperial sand in front of people who did not know his name an hour before." },
  { tag:"who broke", line:"Went out one afternoon and could not do it, and was sold on, and came back to the trade the only way left to him." },
  { tag:"who taught the man who killed him", line:"Trained a boy in another house who later put a man of his in the ground. He does not blame the boy." },
  { tag:"who never lost", line:"Nineteen and none against, and retired the week his hand stopped closing properly." },
];
const DOC_CREEDS = {
  hard:   { name:"drives them", line:"Believes a man who has not been broken in the yard breaks on the sand.",
    train:1.12, strain:1.22, regard:-0.35 },
  patient:{ name:"is patient with them", line:"Would rather have a man in four years than a corpse in two.",
    train:0.94, strain:0.78, regard:0.4, injure:0.86 },
  crafty: { name:"teaches the trick of it", line:"Thinks the sand is won before either of them moves, and drills accordingly.",
    train:1.0, tec:1.18, crowd:2 },
  kind:   { name:"is fond of them", line:"Knows every man's name, where he is from, and which of them are lying about it.",
    train:0.97, regard:0.7, calm:0.35 },
};
const DOC_CREED_KEYS = Object.keys(DOC_CREEDS);
const docCreed = d => (d.doctore && DOC_CREEDS[d.doctore.creed]) || null;
const docCreedNum = (d, k, dflt) => { const C = docCreed(d); return C && C[k]!=null ? C[k] : (dflt==null?1:dflt); };
/* what he says about the week, in his own register */
function docSays(d){
  if(!d.doctore) return null;
  const C = DOC_CREEDS[d.doctore.creed]; if(!C) return null;
  const men = activeG(d);
  const worn = men.filter(g=>g.fatigue > 58).length;
  const green = men.filter(g=>g.wins === 0).length;
  const hurt = d.gladiators.filter(g=>g.status==="injured").length;
  const opts = [];
  if(worn >= 2) opts.push(d.doctore.creed==="hard"
    ? `Half of them are hanging off the post and he says that is what the post is for.`
    : `He wants ${worn} of them rested and has said so twice, which for him is shouting.`);
  if(green >= 2 && d.week > 8) opts.push(`He has ${green} who have never been out and he is drilling them like it is the only thing that matters, because it is.`);
  if(hurt) opts.push(d.doctore.creed==="patient"
    ? `He has been down to the infirmary twice this week and he does not think either of them should go out next month.`
    : `He looked in on the infirmary and said nothing at all about it.`);
  if(d.unrest > 55) opts.push(`He hears what they say in the block and he has started telling you some of it.`);
  if(!opts.length) opts.push(`Nothing to report from the yard, which from him is a good week.`);
  return pick(opts);
}
function makeDoctore(d, quality){
  const origin = pick(Object.keys(ORIGINS));
  const skill = clamp(quality + ri(-8,8), 30, 82);
  const P = pick(DOC_PASTS);
  return { id:d.nextId++, name:pick(ORIGINS[origin].names), origin, fromHouse:false,
    spec: pick(STATS), skill, weeks:0,
    creed: pick(DOC_CREED_KEYS), tag:P.tag, pastLine:P.line,
    fee: rnd(skill*7 + 60), wage: rnd(8 + skill*0.22),
    past: `${ri(3,14)} years on the sand, and the scars to argue it` };
}
/* ---- FORM ----
   Morale is how he lives. Momentum is inside one bout. This is the four weeks
   between them: how the last few afternoons went, carried out to the next one.
   Deliberately small — it is felt at the edges, not in the middle. */
const formOf = g => clamp(g.form || 0, -100, 100);
const formWord = v => v>=58?"in form" : v>=24?"sharp" : v>-24?"level" : v>-58?"off his stride" : "shaken";
const formColour = v => cbc(v>=24?"#9aa86a" : v>-24?"#b09b7d" : "#d96f5d");
const formPower = g => 1 + formOf(g)/100 * 0.036;      // ±3.6% at the extremes
const formStam  = g => 1 - formOf(g)/100 * 0.04;       // and he tires a shade slower on a run
function formShift(d, g, n, note){
  if(!g) return;
  g.form = clamp(formOf(g) + n, -100, 100);
  g.formLog = [note, ...(g.formLog||[])].slice(0, 4);
}
function formWeek(d){
  for(const g of d.gladiators){
    if(isGone(g)) continue;
    const f = formOf(g);
    if(!f) continue;
    /* four quiet weeks and he is neither hot nor cold again */
    g.form = Math.abs(f) < 5 ? 0 : f*0.78 - Math.sign(f)*3;
  }
}

/* ---- WHERE IT HAPPENS ----
   Every bout in this game has been fought in the same rectangle. Footing scales
   how much a man's speed is worth to him, which is the whole of the difference
   between a stone floor and a wet field. */
/* ---- A MAN THE TIERS KNOW BY NAME ----
   The stands have opinions about styles and none at all about men. Renown is what
   Capua thinks he is worth. This is whether it likes him, which is a different
   thing and worth more, and it is why a favourite is dangerous to own: he earns
   more alive than any other man and costs more than any other man to lose. */
const favourOf = g => clamp((g && g.favour) || 0, 0, 100);
const favWord  = v => v>=82?"the darling of Capua" : v>=62?"they chant for him" : v>=40?"a name in the stands"
  : v>=18?"known by sight" : "one more man on the sand";
const favColour= v => v>=62?"#e8d092" : v>=40?"#c99a4b" : v>=18?"#b09b7d" : "#8d7e65";
/* what the affection is worth */
const favPurse  = g => 1 + favourOf(g)/100 * 0.22;
const favMissio = g => favourOf(g)/100 * 15;          // they lean, they do not overrule
const favCrowd  = g => rnd(favourOf(g)/100 * 9);
/* and what it costs to lose him */
const favGrief  = g => favourOf(g)/100;
function favourBout(d, g, res, offer){
  if(!g) return;
  const crowd = res.crowd || 0;
  const close = res.beats ? res.beats.some(b=>b.kind==="clash") : false;
  const won = !!res.win;
  /* they warm to a man who gives them an afternoon, not a man who wins tidily */
  let n = 0;
  n += (crowd - 46) * 0.10;
  if(won) n += 3.2;
  if(close) n += 1.6;
  if(res.spared) n += 3.4;                        // a man let up is a man they asked for
  if(g.nick) n += 0.8;
  n += (g.sho - 50) * 0.045;
  if(offer && offer.tier >= 2) n += 1.4;
  if(offer && offer.imperial) n += 8;
  if(!won && crowd < 40) n -= 2.6;
  g.favour = clamp(favourOf(g) + n, 0, 100);
}
/* affection is short — they forget a man who stops appearing */
function favourWeek(d){
  for(const g of d.gladiators){
    if(isGone(g)) continue;
    const idle = d.week - (g.lastFought||0);
    if(idle > 2 && favourOf(g) > 0) g.favour = clamp(favourOf(g) - 1.3, 0, 100);
  }
}
/* the stands notice when one of theirs is sold or buried */
function favourLost(d, g, how){
  const f = favGrief(g);
  if(f < 0.2) return;
  const shock = rnd(f * (how==="dead" ? 14 : how==="sold" ? 18 : 0));
  if(how==="freed"){
    d.fame += rnd(f * 16);
    FAC_KEYS.forEach(k=>facMove(d, k, rnd(f*7)));
    chron(d, `Capua takes the freeing of ${g.name} personally, in the way a town takes anything it had decided was its own. ${favWord(favourOf(g))}, and now he is somebody's neighbour.`, "good");
    return;
  }
  d.unrest = clamp(d.unrest + shock*0.5, 0, 100);
  d.fame = Math.max(0, d.fame - shock);
  FAC_KEYS.forEach(k=>facMove(d, k, -rnd(f*9)));
  chron(d, how==="dead"
    ? `The tiers do not make a noise when ${g.name} goes down. That is the noise. He was ${favWord(favourOf(g))} and Capua will remember whose house he fought for.`
    : `Selling ${g.name} is not a private arrangement. He was ${favWord(favourOf(g))}, and the stands find out inside a day.`, "bad");
}

/* ---- THE WEATHER ON THE DAY ----
   The seasons already decide the year. This decides the afternoon. Footing is the
   same dial the venues use, so a wet field and a dry courtyard are the same
   mechanism arriving from two directions. */
const WEATHER = {
  fair:    { name:"Fair", footing:1.00, stam:1.00, crowd:0,  purse:1.00, open:1,
    say:"Dry, still, and nothing to blame afterward." },
  perfect: { name:"A good day for it", footing:1.03, stam:0.96, crowd:8, purse:1.06, open:1,
    say:"Cool, bright, and half of Capua has decided to be here." },
  hot:     { name:"Blazing", footing:1.01, stam:1.24, crowd:-5, purse:1.00, open:1,
    say:"The sand is white and nobody in the upper tiers has any shade at all." },
  rain:    { name:"Rain", footing:0.84, stam:1.08, crowd:-16, purse:0.86, open:1,
    say:"It has been coming down since dawn and the sand is not sand any more." },
  wind:    { name:"A hard wind", footing:0.96, stam:1.02, crowd:-3, purse:0.97, open:1,
    say:"The awnings are cracking and anything thrown goes where the wind says." },
  cold:    { name:"Bitter", footing:0.93, stam:1.12, crowd:-9, purse:0.92, open:1,
    say:"Cold enough that the men do not want to take their cloaks off, and the crowd came anyway." },
};
const W_KEYS = Object.keys(WEATHER);
/* what the sky does, by season */
const SEASON_SKY = {
  Spring: ["fair","fair","perfect","perfect","rain","wind"],
  Summer: ["hot","hot","hot","fair","fair","perfect"],
  Autumn: ["fair","fair","perfect","rain","rain","wind"],
  Winter: ["cold","cold","cold","rain","rain","fair"],
};
/* a wind that goes where it likes matters more to a net than to a shield */
const windHurts = ["Retiarius"];
function skyFor(d, offer){
  const s = seasonOf(d).name;
  const pool = SEASON_SKY[s] || SEASON_SKY.Spring;
  return pool[Math.floor(R()*pool.length)];
}
const SKY = k => WEATHER[k] || WEATHER.fair;
/* an awning is worth something, and a courtyard more */
const shelterOf = v => v==="yard" ? 0.72 : v==="greek" ? 0.5 : v==="amphi" ? 0.32 : v==="imperial" ? 0.38 : 0;
const dampen = (n, sh) => 1 + (n - 1) * (1 - sh);
function skyMods(k, venue, cls){
  const W = SKY(k), sh = shelterOf(venue);
  return {
    footing: dampen(W.footing, sh) * (k==="wind" && windHurts.includes(cls) ? 0.95 : 1),
    stam:    dampen(W.stam, sh),
    crowd:   rnd(W.crowd * (1 - sh)),
    purse:   dampen(W.purse, sh),
  };
}

const VENUES = {
  pit:     { name:"The pit behind the ludus", crowd:-22, footing:0.88, missio:-5, fame:0.72,
    say:"Packed earth, a rope, and whoever from the house is not working. Nobody is here who was not already here." },
  forum:   { name:"The forum stands", crowd:2, footing:0.97, missio:3, fame:1.0,
    say:"Boards and scaffold thrown up across the market for the week. The whole town can see, and the whole town is standing." },
  amphi:   { name:"The amphitheatre", crowd:9, footing:1.0, missio:0, fame:1.15,
    say:"Stone, tiers, and an awning that does not quite reach. It is older than anything in Rome and it sounds like it." },
  yard:    { name:"A magistrate's courtyard", crowd:-16, footing:1.12, missio:12, fame:0.86,
    say:"Marble underfoot, forty people who have eaten well, and a silence between exchanges you can hear your own breathing in." },
  field:   { name:"A field outside the walls", crowd:-9, footing:0.80, missio:6, fame:0.92,
    say:"Turf cut for the occasion, no seating, and the family of the dead man standing at the front where the editor would be." },
  bowl:    { name:"The stone bowl", crowd:12, footing:1.0, missio:-3, fame:1.1,
    say:"Their amphitheatre is older than Capua's and they will tell you so before the first exchange." },
  harbour: { name:"The harbour ground", crowd:6, footing:0.91, missio:-4, fame:1.05,
    say:"Trodden sand between the warehouses, gulls, and a crowd that has been drinking since the ships came in." },
  greek:   { name:"The Greek theatre", crowd:4, footing:1.06, missio:8, fame:1.08,
    say:"They have put a fighting floor into a theatre and the acoustics are wasted on none of it." },
  imperial:{ name:"The imperial sand", crowd:20, footing:1.0, missio:-2, fame:1.4,
    say:"You have read about this floor your whole life. It is smaller than you expected and it is not smaller at all." },
};
const CITY_VENUE = { pompeii:"bowl", neapolis:"greek", puteoli:"harbour" };
function venueFor(d, offer){
  if(offer.imperial) return "imperial";
  if(offer.city) return CITY_VENUE[offer.city] || "forum";
  if(offer.tier===0 && !offer.festival) return "pit";
  if(offer.munera || (offer.festival && /funeral/.test(offer.festival))) return "field";
  if(offer.booking && R()<0.45) return "yard";
  if(offer.tier>=2) return "amphi";
  return "forum";
}
const VEN = k => VENUES[k] || VENUES.forum;

/* ---- THE ELECTION ----
   Capua elected its aediles, and the aedile is the man who puts on the games.
   Pompeii's walls are still covered in the graffiti; this is what it was for. */
const ELECTION_WEEK = 13;
const PLATFORMS = [
  { key:"blood",  say:"promises the biggest card in twenty years and does not say who pays for it",
    likes:d=>repStyle(d)==="blood" || repStyle(d)==="show" },
  { key:"thrift", say:"promises to spend nothing and repair the drains, which is either honest or a threat",
    likes:d=>false },
  { key:"order",  say:"promises a quiet town, and has views about the schools that keep armed men in it",
    likes:d=>d.unrest<30 },
  { key:"glory",  say:"promises Capua will be spoken of in Rome again, at whatever cost to Capua",
    likes:d=>d.fame>250 },
  { key:"people", say:"promises bread, shade over the seats, and free places for the poor",
    likes:d=>repStyle(d)==="mercy" },
];
const backLevels = [
  { n:0,   label:"Nothing",            odds:0 },
  { n:180, label:"A quiet contribution", odds:11 },
  { n:520, label:"Openly, with your name on it", odds:26 },
  { n:1300,label:"Everything you can spare", odds:44 },
];
function makeCandidate(d, plat){
  return { id:d.nextId++, name:`${pick(PRAENOMINA)} ${pick(NOMINA)} ${pick(COGNOMINA)}`,
    plat:plat.key, say:plat.say, base:ri(28,52), backing:0, rival:null };
}
function callElection(d){
  const pool = shuffled(PLATFORMS).slice(0,3);
  const cands = pool.map(p=>makeCandidate(d,p));
  /* the other houses have their own men in this */
  (d.rivals||[]).forEach(h=>{ if(R()<0.55){ const c = pick(cands);
    c.base += ri(6,15); c.rival = c.rival ? c.rival : h.name; } });
  d.election = { week:d.week, cands, backed:null, spent:0, done:false };
  chron(d, `The names are going up on the walls again. ${cands.map(c=>c.name.split(" ")[2]).join(", ")} are standing for aedile, and the aedile is the man who decides whose men are on the card.`, "event");
}
function backCandidate(d, cid, level){
  const E = d.election; if(!E || E.done) return false;
  const L = backLevels[level]; if(!L) return false;
  if(d.gold < L.n) return false;
  d.gold -= L.n;
  E.backed = cid; E.spent = L.n; E.level = level;
  const c = E.cands.find(x=>x.id===cid);
  if(c) c.backing = L.odds;
  if(L.n >= 520) addRep(d, "show", 5);
  chron(d, L.n===0
    ? `You stay out of it.`
    : `${L.n} denarii goes to ${c?c.name:"a candidate"}${L.n>=520? ", and it is not a secret" : ", quietly"}.`, "info");
  return true;
}
function resolveElection(d){
  const E = d.election; if(!E || E.done) return;
  E.done = true;
  const scored = E.cands.map(c=>({ c, s: c.base + c.backing + (PLATFORMS.find(p=>p.key===c.plat).likes(d)?9:0) + ri(0,22) }));
  scored.sort((a,b)=>b.s-a.s);
  const won = scored[0].c;
  const backedHim = E.backed === won.id;
  const backedAny = E.backed != null;
  d.aedile = { name:won.name, plat:won.plat, friendly: backedHim, hostile: backedAny && !backedHim,
    since:d.week, until:d.week + YEAR_WEEKS };
  if(backedHim){
    patronsOf(d).forEach(p=>{ if(p.rank==="magistrate") p.favor = clamp(p.favor+18,0,100); }); recomputeFavor(d);
    d.fame += 14;
    chron(d, `${won.name} takes the aedileship, and he took it with your money. For the next year the man who decides who is on the card owes you a favour he has not forgotten yet.`, "good");
  } else if(backedAny){
    d.fame = Math.max(0, d.fame-8);
    patronsOf(d).forEach(p=>{ if(p.rank==="magistrate") p.favor = clamp(p.favor-14,0,100); }); recomputeFavor(d);
    chron(d, `${won.name} takes the aedileship. He knows exactly whose name was on the other man's subscription list, because everyone does.`, "bad");
  } else {
    chron(d, `${won.name} takes the aedileship. You backed nobody and he has no particular view of you, which is its own kind of position.`);
  }
}
const aedileOn = d => d.aedile && d.week < d.aedile.until ? d.aedile : null;
const aedilePurse = d => { const a = aedileOn(d); return a ? (a.friendly?1.14 : a.hostile?0.89 : 1) : 1; };
const aedileOffers = d => { const a = aedileOn(d); return a ? (a.friendly?1 : a.hostile?-1 : 0) : 0; };
const aedileMissio = d => { const a = aedileOn(d); return a ? (a.friendly?9 : a.hostile?-8 : 0) : 0; };
function electionWeek(d){
  if(d.rome || d.over) return;
  const wk = ((d.week-1) % YEAR_WEEKS) + 1;
  if(wk === ELECTION_WEEK && (!d.election || d.election.done)) callElection(d);
  else if(d.election && !d.election.done && d.week - d.election.week >= 3) resolveElection(d);
}

/* ---- THE MEDICUS AND THE ARMOURER ----
   The infirmary and the armoury were building levels. The building is the room;
   these are the men in it, and men can be bought away or simply leave. */
const STAFF = {
  medicus:  { name:"Medicus", room:"valetudinarium",
    blurb:"The room is only a room. What matters is who is standing in it at the moment somebody is carried in.",
    wants:"a house that does not fill his table every week",
    quitOn:d=>d.unrest>72 || repStyle(d)==="blood",
    quitLine:n=>`${n} gives notice. He does not make a speech about it; he has simply been carried enough of your men and would rather do something else.` },
  armourer: { name:"Armourer", room:"armamentarium",
    blurb:"Anyone can hand a man a sword. Keeping thirty pieces of steel alive through a season is a trade.",
    wants:"steel worth his attention",
    quitOn:d=>d.gold < -120,
    quitLine:n=>`${n} has not been paid on time twice and will not wait for a third. His tools go with him, because they were always his.` },
};
const STAFF_KEYS = Object.keys(STAFF);
function makeStaff(d, kind, quality){
  const origin = pick(Object.keys(ORIGINS));
  const skill = clamp(quality + ri(-8,8), 28, 84);
  return { id:d.nextId++, kind, name:pick(ORIGINS[origin].names), origin, skill, weeks:0,
    fee: rnd(skill*5 + 40), wage: rnd(6 + skill*0.18) };
}
function makeStaffMarket(d){
  d.staffMarket = {};
  for(const k of STAFF_KEYS){
    if(d[k]) continue;
    d.staffMarket[k] = [makeStaff(d, k, ri(32,56)), makeStaff(d, k, ri(48,76))];
  }
}
const staffSkill = (d,k) => d[k] ? d[k].skill : 0;
/* the building is the floor; the man is the multiplier */
const medicusMult  = d => 1 + staffSkill(d,"medicus")/100 * 0.85;
const medicusGuard = d => staffSkill(d,"medicus")/100 * 0.55;   // keeps a wound from setting badly
const armourerCut  = d => 1 - staffSkill(d,"armourer")/100 * 0.18;
const armourerWear = d => 1 - staffSkill(d,"armourer")/100 * 0.25;
const armourerMend = d => 1 + staffSkill(d,"armourer")/100 * 1.1;
function staffWeek(d){
  for(const k of STAFF_KEYS){
    const s = d[k]; if(!s) continue;
    s.weeks++;
    d.gold -= s.wage;
    /* he has somewhere else to be */
    if(s.weeks > 6 && STAFF[k].quitOn(d) && R()<0.06){
      chron(d, STAFF[k].quitLine(s.name), "bad");
      d[k] = null;
      continue;
    }
    if(s.weeks > 10 && R()<0.02 && (d.rivals||[]).some(h=>h.grudge>=40 && warmth(d,h.name)<45)){
      const h = pick((d.rivals||[]).filter(x=>x.grudge>=40));
      chron(d, `${lanistaOf(h.name).name} has offered ${s.name} better than you pay him, and ${s.name} took it. There was no argument about it at all.`, "bad");
      d[k] = null;
    }
  }
}

function makeDoctoreMarket(d){
  if(d.doctore) { d.doctoreMarket = []; return; }
  d.doctoreMarket = [makeDoctore(d, ri(34,58)), makeDoctore(d, ri(46,74))];
}
/* A man you freed, or released honourably, may offer to stay and teach. */
function doctoreFromGladiator(d, g, kind){
  const spec = CLASSES[g.cls].key[0];
  const skill = clamp(rnd(35 + g.wins*2 + g.pfame*0.15 + (g.tec+g.dis)/8), 34, 96);
  return { id:d.nextId++, name:g.name, nick:g.nick, origin:g.origin, cls:g.cls, fromHouse:true,
    spec, skill, weeks:0, fee:0, wage: rnd((8 + skill*0.22)*0.5), kind,
    past: kind==="rudis"
      ? `${g.wins} victories and the wooden sword to show for them`
      : `${g.wins} victories, and released before the sand could take him` };
}
function offerDoctore(d, g, kind){
  let p = (kind==="rudis" ? 0.45 : 0.3)
    + (d.unrest<35 ? 0.25 : 0) + (g.morale>70 ? 0.15 : 0) - (d.unrest>60 ? 0.3 : 0);
  if(R() < clamp(p, 0.05, 0.95)){ d.doctoreOffer = doctoreFromGladiator(d, g, kind); return true; }
  return false;
}
const potentialWord = p=> p<50?"a modest ceiling": p<70?"promise in him": p<85?"exceptional promise":"a fire the arena has not yet seen";
const demeanor = dv=> dv<25?"Compliant": dv<45?"Watchful": dv<65?"Restless": dv<85?"Defiant":"A storm barely chained";
const unrestWord = u=> u<25?"Docile": u<45?"Restless": u<65?"Simmering": u<80?"Mutinous":"On the edge of fire";
const rudisEligible = g=> !isAuctor(g) && g.wins>=10 && g.pfame>=180;
const fullName = g=> g.nick? `${g.name}, ${g.nick}` : g.name;

function chron(d, text, kind){ d.log.unshift({ week:d.week, text, kind:kind||"info" }); d.log = d.log.slice(0,40); }

/* two men in one house answering to the same name is nobody's idea of a roster */
function freshName(d, pool, fem){
  const taken = new Set([
    ...(d.gladiators||[]).filter(g=>!isGone(g)).map(g=>g.name),
    ...(d.market||[]).map(g=>g.name),
  ]);
  const open = pool.filter(n=>!taken.has(n));
  if(open.length) return pick(open);
  /* the man's own people are all spoken for — reach across the provinces for an
     unused name of the right sex before ever handing out a duplicate */
  const wider = [].concat(...(fem ? Object.values(FNAMES) : Object.values(ORIGINS).map(o=>o.names)))
    .filter(n=>!taken.has(n));
  return pick(wider.length ? wider : pool);
}
function genGladiator(d, quality){
  const origin = pick(Object.keys(ORIGINS));
  const cls = pick(Object.keys(CLASSES));
  const fem = R() < 0.10;
  const g = { id:d.nextId++, sex: fem?"f":"m",
    name: freshName(d, fem ? FNAMES[origin] : ORIGINS[origin].names, fem), nick:null, origin, cls,
    morale:60, fatigue:0, wins:0, losses:0, kills:0, pfame:0, fans:0, status:"active", injury:null,
    focus:CLASSES[cls].key[0], regimen:"palus", sparWith:null, age:ri(18,32), lastFought:-9, traits:[], legend:false, returnWeek:0,
    kit: defaultKit(cls), wear:{weapon:100,offhand:100,helm:100,armor:100}, strain:0, form:0, formLog:[], regard:ri(38,54), memory:[], scars:[], scarCap:{}, weeksAged:0 };
  for(const s of STATS) g[s] = clamp(24 + quality*0.5 + ri(-9,9) + (ORIGINS[origin].mod[s]||0)*2.2, 8, 92);
  for(const k of CLASSES[cls].key) g[k] = clamp(g[k]+6, 8, 95);
  g.potential = clamp(quality + ri(-12,22) - Math.max(0, g.age-PRIME[1])*3, 20, 99);
  if(g.age>PRIME[1]){ // veterans arrive already worn, and already schooled
    for(const k of ["tec","dis"]) g[k] = clamp(g[k] + (g.age-PRIME[1])*0.8, 8, 95);
    const n = ri(0, Math.min(3, g.age-PRIME[1]));
    for(let i=0;i<n;i++) addScar(g, pick(TARGETS)[0], false);
  }
  g.heart = ri(25,95);
  g.defiance = ri(6,42);
  if(R()<0.55) g.traits.push(pick(Object.keys(TRAITS)));
  if(R()<0.16){ const t=pick(Object.keys(TRAITS)); if(!g.traits.includes(t)) g.traits.push(t); }
  if(quality>=78 && R()<0.55){ if(!g.traits.includes("Defiant")) g.traits.push("Defiant"); g.legend=true; g.potential=clamp(g.potential+10,90,99); }
  if(g.traits.includes("Defiant")) g.defiance = clamp(g.defiance+22,0,100);
  if(g.traits.includes("Broken")){ g.defiance = Math.max(2,g.defiance-25); g.sho = Math.max(8,g.sho-8); }
  giveAmbition(d, g);
  g.price = rnd(90 + quality*4.5 + g.potential*2 + (g.legend?150:0) + ri(0,40));
  return g;
}

function genOpponent(tier, q){
  const quality = (q!==undefined? q : [34,50,66,82][tier] + ri(-6,10));
  const origin = pick(Object.keys(ORIGINS));
  const cls = pick(Object.keys(CLASSES));
  const fem = R() < 0.07;
  const o = { sex: fem?"f":"m", name: pick(fem ? FNAMES[origin] : ORIGINS[origin].names), house:pick(HOUSES), cls, origin, nick:null,
    morale:62, fatigue:0, injury:null, traits:[], heart:ri(30,90), pfame:0, kit:kitFor(cls, tier) };
  for(const s of STATS) o[s] = clamp(24 + quality*0.52 + ri(-8,8) + (ORIGINS[origin].mod[s]||0)*2, 8, 94);
  for(const k of CLASSES[cls].key) o[k] = clamp(o[k]+5, 8, 95);
  if(tier>=2) o.nick = pick(NICKS);
  return o;
}

/* ---- WHAT THE SELLER IS NOT SAYING ----
   The block used to show you a man's exact numbers. It shows you the seller's
   account of them now, which is a different document. */
const FLAWS = {
  wound:   { name:"An old wound", tell:"favours one side when he thinks nobody is watching",
    hint:"There is something in how he stands.", apply(g){ const k = pick(["str","agi","end"]);
      g[k] = Math.max(10, g[k]-9); g.scarCap = g.scarCap||{}; g.scarCap[k] = (g.scarCap[k]||0)+8;
      (g.scars = g.scars||[]).push({ part:"flank", big:false }); } },
  broken:  { name:"Broken already", tell:"does what he is told the instant he is told it",
    hint:"He is very quiet, and quiet in the wrong way.", apply(g){ if(!g.traits.includes("Broken")) g.traits.push("Broken");
      g.defiance = Math.max(2, g.defiance-25); g.sho = Math.max(8, g.sho-10); g.heart = Math.max(15, (g.heart||50)-20); } },
  trouble: { name:"Trouble", tell:"has been sold twice in a year and nobody will say why",
    hint:"He looks at you rather than past you.", apply(g){ g.defiance = clamp(g.defiance+32, 0, 100);
      if(!g.traits.includes("Defiant")) g.traits.push("Defiant"); } },
  slow:    { name:"Slower than he looks", tell:"is built like a wall and moves like one",
    hint:"He carries the weight well. Whether he carries it fast is another question.",
    apply(g){ g.agi = Math.max(10, g.agi-13); } },
  hollow:  { name:"No wind in him", tell:"is spent by the fourth exchange and always has been",
    hint:"He is breathing harder than the walk here justifies.", apply(g){ g.end = Math.max(10, g.end-14); } },
  limit:   { name:"He is what he is", tell:"has been at this three years and has not improved once",
    hint:"There is a settled quality to him.", apply(g){ g.potential = Math.max(18, g.potential-26); } },
};
const FLAW_KEYS = Object.keys(FLAWS);
/* what you actually know about him */
const readLevel = (d, g) => g.scouted ? 2 : (d.doctore ? 1 : 0);
const SCOUT_FEE = (d,g) => rnd(35 + g.price*0.10);
const bandOf = (v, lvl) => { const w = lvl>=2 ? 0 : lvl>=1 ? 7 : 14;
  return [Math.max(5, Math.round(v-w)), Math.min(99, Math.round(v+w))]; };
const bandWord = v => v<32?"poor" : v<46?"fair" : v<58?"sound" : v<70?"strong" : v<82?"very strong" : "exceptional";
/* the seller's version, which is generous */
function sellerSays(g){
  const s = {};
  for(const k of STATS) s[k] = clamp(g[k] + ri(0, g.flaw?9:5), 8, 99);
  return s;
}

/* ---- THE MEN WHO SELL MEN ----
   The block has been a price and a concealed flaw. Somebody is standing behind it,
   and he has been doing this longer than you have, and he remembers exactly how the
   last four went. */
const SLAVERS = {
  batiatus: { name:"Lentulus", full:"Lentulus, who deals in war captives",
    line:"Buys off the legions at the docks and does not pretend the men are anything but what they are.",
    lies:0.2, markup:0.92, flaw:1.15, origins:["Gaul","Thracian","Germanic"], quality:-4 },
  syrian:   { name:"Ashur", full:"Ashur of the eastern block",
    line:"Talks constantly, knows every man's history, and half of what he tells you is true and useful.",
    lies:0.55, markup:1.0, flaw:0.85, origins:["Syrian","Numidian","Greek"], quality:2 },
  honest:   { name:"Verrus", full:"Verrus, who has been at this thirty years",
    line:"Slow, expensive, and has never once sold a man who was not what he said he was.",
    lies:0.05, markup:1.28, flaw:0.25, origins:null, quality:8 },
  bones:    { name:"Cossutius", full:"Cossutius, at the far end",
    line:"Sells what the others would not take. Something is wrong with most of it and the prices say so.",
    lies:0.7, markup:0.62, flaw:2.1, origins:null, quality:-14 },
};
const SLAVER_KEYS = Object.keys(SLAVERS);
const slaverOf = k => SLAVERS[k] || SLAVERS.syrian;
const dealings = (d,k) => (d.slavers && d.slavers[k]) || { bought:0, scouted:0, burned:0, warm:0 };
function dealt(d, k, field, n){
  d.slavers = d.slavers || {};
  const x = Object.assign({ bought:0, scouted:0, burned:0, warm:0 }, d.slavers[k]);
  x[field] = (x[field]||0) + (n==null?1:n);
  d.slavers[k] = x;
}
/* he remembers, and it shows in the price */
const slaverPrice = (d,k) => { const x = dealings(d,k);
  return clamp(1 - x.bought*0.022 + x.burned*0.05, 0.82, 1.2); };
const slaverWord = (d,k) => { const x = dealings(d,k);
  const n = x.bought;
  return x.burned >= 2 ? "will not meet your eye" : n >= 6 ? "knows exactly what you want"
    : n >= 3 ? "has your measure" : n >= 1 ? "has sold to you before" : "has never dealt with you"; };
/* what he says about a man he is selling */
function slaverPitch(d, g){
  const S = slaverOf(g.slaver);
  const honest = R() > S.lies;
  if(g.flaw && !honest) return pick([
    `He says the man has never been beaten by anybody worth naming.`,
    `He says there is nothing to look into and you are welcome to look.`,
    `He does not mention anything and moves on to the price.`,
  ]);
  if(g.flaw && honest) return S.lies > 0.4
    ? `He is very keen to talk about something else.`
    : `He says there is something you should have looked at, and does not say what.`;
  if(!g.flaw && honest) return pick([
    `He says the man is sound and, for once, he is not selling you anything.`,
    `He has nothing to add. That is usually the tell that there is nothing to add.`,
  ]);
  return `He is enthusiastic in a way that tells you nothing at all.`;
}

function makeMarket(d){
  d.market = [];
  /* three of the four sellers are standing there on any given week */
  const here = shuffled(SLAVER_KEYS).slice(0, 3);
  for(let i=0;i<4;i++){
    const sk = here[i % here.length];
    const S = SLAVERS[sk];
    const quality = clamp((R()<0.12 ? ri(75,92) : ri(30,68)) + S.quality, 18, 95);
    const g = genGladiator(d, quality);
    g.slaver = sk;
    if(S.origins && S.origins.length) g.origin = pick(S.origins);
    /* roughly a third of the block has something wrong with it — more at some stalls */
    if(R() < 0.34 * S.flaw){
      g.flaw = pick(FLAW_KEYS);
      FLAWS[g.flaw].apply(g);
      g.price = rnd(g.price * 0.82);          // and it is priced a little keen
    }
    g.price = rnd(g.price * S.markup * slaverPrice(d, sk));
    g.pitch = slaverPitch(d, g);
    g.shown = sellerSays(g);
    g.scouted = false;
    const wm = warMarket(d);
    if(wm !== 1){ g.price = rnd(g.price * wm); if(wm < 1) g.warCaptive = 1; }
    g.price = rnd(g.price * pit(d,"market"));
    d.market.push(g);
  }
  /* a free man standing at the edge of the block, waiting to be spoken to */
  if(R()<0.3){ const a = makeAuctoratus(d, ri(44,72));
    a.shown = Object.assign({}, ...STATS.map(k=>({[k]:a[k]}))); a.scouted = true;
    d.market[ri(0,3)] = a; }
}

function makeGames(d){
  if(d.rome && d.rome.travel<=0){
    if(d.rome.fought >= ROME_BOUTS){ d.games = null; return; }
    d.games = { festival:"the imperial games", offers:[makeImperialBout(d)], week:d.week };
    d.games.offers.forEach(o=>{ if(!o.venue) o.venue = venueFor(d, o); if(!o.sky) o.sky = skyFor(d, o); });
    return;
  }
  const F = d.munera
    ? { key:"munera", name:pick(MUNERA), purse:2.0, fame:1.2, tier:0, offers:2, allSine:true }
    : festivalNow(d);
  if(!F || F.rest){ d.games = null; return; }
  const festival = F.name;
  const offers = [];
  const add = (tier0)=>{
    const tier = clamp(tier0 + (F.tier||0), 0, 3);
    const t = TIERS[tier];
    const sineOdds = 0.18 + (st==="blood" ? 0.22 : 0) - (st==="mercy" ? 0.13 : 0)
      + docNum(d,"sineOdds",0) - (docIs(d,"mercy") ? 0.12 : 0);
    const sine = F.allSine ? true : F.noSine ? false : (tier>=1 && R()<sineOdds);
    const pr = pickRivalOpp(d, tier);
    offers.push({ id:d.nextId++, tier, festival, opp:pr.opp, oppRef:pr.ref, rematch:pr.rematch, grudgeM:pr.grudgeM,
      stakes:sine?"sine":"standard",
      purse: rnd((t.purse[0]+R()*t.purse[1]) * (sine?1.8:1) * (pr.rematch?1.25:1) * (F.purse||1) * seasonPurse(d)
        * (st==="craft" ? 1.18 : 1)) });
  };
  const addPair = (tier)=>{
    const t = TIERS[tier];
    const ot = tier>=2 ? tier-1 : tier;
    const p1 = pickRivalOpp(d, ot);
    let p2 = pickRivalOpp(d, ot), guard = 0;
    while(guard++<6 && p2.ref && p1.ref && p2.ref.fid===p1.ref.fid) p2 = pickRivalOpp(d, ot);
    if(p2.ref && p1.ref && p2.ref.fid===p1.ref.fid){ p2 = { opp:genOpponent(ot), ref:null }; }
    offers.push({ id:d.nextId++, tier, festival, pair:true, opps:[p1.opp, p2.opp],
      oppRefs:[p1.ref, p2.ref], stakes:"standard",
      purse: rnd((t.purse[0]+R()*t.purse[1]) * 1.7 * (F.purse||1) * seasonPurse(d)) });
  };
  const st = repStyle(d);
  /* a name on the bill is a bout that is going to happen */
  const bk = bookedFor(d, F.key);
  if(bk){
    const pr = pickAnyOpp(d, bk.tier);
    offers.push({ id:d.nextId++, tier:bk.tier, festival, booking:bk.id, bookedGid:bk.gid,
      opp:pr.opp, oppRef:pr.ref, rematch:false, grudgeM:false, stakes:"standard", purse:bk.balance });
  }
  const ch = (d.deadlines||[]).find(x=>x.kind==="challenge" && !x.met && d.week<=x.due);
  if(ch){
    const h = (d.rivals||[]).find(y=>y.name===ch.house);
    const f = h && h.fighters.find(y=>y.id===ch.fid);
    if(f){ const oc = clone(f); oc.house = h.name;
      offers.push({ id:d.nextId++, tier:2, festival, challenge:ch.id, nemGrudge:!!ch.nem, sagaBout:!!ch.saga, bookedGid:ch.gid,
        opp:oc, oppRef:{house:h.name,fid:f.id}, rematch:true, grudgeM:true, stakes:"standard", purse:ch.purse }); }
  }
  const slots = (F.offers==null ? 2 : F.offers) + (st==="show" ? 1 : 0) + aedileOffers(d);
  add(1);
  if(slots>=2 && d.fame>=60 && R()<0.8) add(1);
  if(slots>=3 && d.fame>=TIERS[2].fame) add(2);
  if(slots>=4 && d.fame>=TIERS[3].fame && d.favor>=40 && R()<0.6) add(3);
  if(d.fame>=TIERS[1].fame && activeG(d).length>=2 && R()<0.45) addPair(d.fame>=TIERS[2].fame ? 2 : 1);
  if(d.primus && d.primus.mine && R()<0.45){ const o = makeDefenceOffer(d); if(o) offers.push(o); }
  else if(d.primus && !d.primus.mine && activeG(d).some(primusEligible) && d.fame>=TIERS[2].fame && R()<0.6){
    const o = makePrimusOffer(d, 3); if(o) offers.push(o);
  }
  if(d.fame>=TIERS[1].fame && activeG(d).length>=2 && R()<0.3){
    const tier = d.fame>=TIERS[2].fame ? 2 : 1;
    const size = ri(4,5);
    const field = [];
    for(let i=0;i<size;i++) field.push(pickRivalOpp(d, Math.max(0,tier-1)).opp);
    offers.push({ id:d.nextId++, tier, festival, melee:true, field, stakes:"melee",
      purse: rnd((TIERS[tier].purse[0]+R()*TIERS[tier].purse[1]) * 4.0 * (F.purse||1) * seasonPurse(d)) });
  }
  if(R()<0.5){
    const tier = d.fame>=TIERS[2].fame ? 2 : d.fame>=TIERS[1].fame ? 1 : 0;
    const opts = beastTier(tier);
    const [key, B] = pick(opts);
    offers.push({ id:d.nextId++, tier, festival, venatio:true, beast:key, stakes:"venatio",
      purse: rnd((TIERS[tier].purse[0]+R()*TIERS[tier].purse[1]) * B.purse * (F.purse||1) * seasonPurse(d)) });
  }
  if(d.fame>=TIERS[2].fame) add(2);
  if(d.fame>=TIERS[2].fame && R()<0.5) add(2);
  if(d.fame>=TIERS[3].fame && d.favor>=40 && R()<0.45) add(3);
  offers.forEach(o=>{ if(!o.venue) o.venue = venueFor(d, o); if(!o.sky) o.sky = skyFor(d, o); });
  { const p = pactOf(d);
    if(p && PACTS[p.kind] && PACTS[p.kind].exclusive && offers.length > 1){
      const keep = offers.slice(0, 1);
      offers.length = 0; offers.push(...keep);
    } }
  d.games = { festival, offers, week:d.week, fest:F.key,
    exclusive: !!(pactOf(d) && PACTS[pactOf(d).kind] && PACTS[pactOf(d).kind].exclusive) };
}

/* ================= RIVAL HOUSES ================= */

const RIVAL_SEED = [["Solonius",60,[30,50]],["Vettius",150,[42,62]],["Tullius",330,[58,80]]];
const grudgeWord = g => g<15?"Cordial": g<40?"Cool": g<70?"Bitter":"Blood feud";

function makeRivalFighter(d, house, quality){
  const origin = pick(Object.keys(ORIGINS));
  const cls = pick(Object.keys(CLASSES));
  const fem = R() < 0.07;
  const f = { id:d.nextId++, sex: fem?"f":"m", name: pick(fem ? FNAMES[origin] : ORIGINS[origin].names), nick:null, house, cls, origin,
    morale:62, fatigue:0, injury:null, traits:[], heart:ri(30,90), pfame:ri(0,30),
    kit:kitFor(cls, quality>=58?2:quality>=42?1:0),
    wins:ri(0,6), losses:ri(0,3), kills:0, beatYou:0, lostToYou:0,
    potential: clamp(quality+ri(-10,15), 20, 95) };
  for(const s of STATS) f[s] = clamp(24 + quality*0.52 + ri(-8,8) + (ORIGINS[origin].mod[s]||0)*2, 8, 94);
  for(const k of CLASSES[cls].key) f[k] = clamp(f[k]+5, 8, 95);
  if(f.wins>=5) f.nick = pick(NICKS);
  if(R()<0.10) f.kills = ri(1,2);
  return f;
}

function makeRivals(d){
  return RIVAL_SEED.map(seed=>({ name:seed[0], fame:seed[1]+ri(-10,15), grudge:ri(0,10),
    fighters: Array.from({length:4}, ()=>makeRivalFighter(d, seed[0], ri(seed[2][0], seed[2][1]))) }));
}

/* ---- WHAT THE OTHER HOUSES DID ----
   They have been training, poaching and buying invisibly for forty versions. Once
   a week one of them does something you can watch, and it is reported. */
const RIVAL_MOVES = {
  buy: { weight:h=>1 + (lanistaOf(h.name).bid-1)*2, when:(d,h)=>h.fighters.length<7 && d.market.length,
    run(d,h){ const L=lanistaOf(h.name);
      const best = d.market.filter(g=>!isAuctor(g)).sort((a,b)=>gladValue(b)-gladValue(a))[0];
      if(!best) return null;
      d.market = d.market.filter(g=>g.id!==best.id);
      const f = makeRivalFighter(d, h.name, 55);
      ["str","agi","end","tec","sho","dis","potential"].forEach(k=>{ f[k]=best[k]; });
      f.name = best.name; f.origin = best.origin; f.cls = best.cls; f.sex = best.sex;
      h.fighters.push(f);
      return `${L.name} buys ${best.name} off the block. He was standing where you could see him this morning.`; } },
  sell: { weight:()=>1, when:(d,h)=>h.fighters.length>3 && d.market.length<7,
    run(d,h){ const L=lanistaOf(h.name);
      const worst = h.fighters.slice().sort((a,b)=>gladValue(a)-gladValue(b))[0];
      if(!worst) return null;
      h.fighters = h.fighters.filter(f=>f.id!==worst.id);
      const g = genGladiator(d, clamp(rnd(STATS.reduce((s,k)=>s+worst[k],0)/6), 20, 90));
      g.name = worst.name; g.origin = worst.origin; g.cls = worst.cls;
      STATS.forEach(k=>{ g[k]=worst[k]; });
      g.price = rnd(gladValue(g)*0.85);
      g.shown = sellerSays(g); g.scouted = false; g.soldBy = h.name;
      d.market.push(g);
      return `${L.name} puts ${worst.name} on the block. Whatever the reason, it is on the block now and you can look at it.`; } },
  retrain: { weight:h=>lanistaOf(h.name).train, when:(d,h)=>h.fighters.length>0,
    run(d,h){ const L=lanistaOf(h.name);
      const f = pick(h.fighters); const was = f.cls;
      const to = pick(Object.keys(CLASSES).filter(c=>c!==was));
      f.cls = to; f.kit = kitFor(to, 2);
      for(const k of CLASSES[to].key) f[k] = clamp(f[k]+4, 8, 96);
      return `${L.name} has taken ${f.name} off the card for a month and put him back on it as a ${to.toLowerCase()}. He went in a ${was.toLowerCase()}.`; } },
  free: { weight:()=>0.7, when:(d,h)=>h.fighters.some(f=>f.wins>=9),
    run(d,h){ const L=lanistaOf(h.name);
      const f = h.fighters.filter(x=>x.wins>=9).sort((a,b)=>b.wins-a.wins)[0];
      h.fighters = h.fighters.filter(x=>x.id!==f.id);
      h.fame += 22;
      if(d.nemesis && d.nemesis.fid===f.id) d.nemesis = null;
      return `${L.name} gives ${f.name} the rudis in front of the whole of Capua. ${f.wins} victories, and he walks out of the gate a free man. Your own cells heard about it before you did.`; } },
  doctore: { weight:h=>lanistaOf(h.name).train, when:(d,h)=>!h.doctore,
    run(d,h){ const L=lanistaOf(h.name); h.doctore = true;
      return `${L.name} has hired a doctore out of Ravenna at a price people are talking about. His men will be better in a month.`; } },
  tour: { weight:()=>0.8, when:(d,h)=>!h.away,
    run(d,h){ const L=lanistaOf(h.name); h.away = ri(3,6);
      return `House ${h.name} loads its wagons for the coast. ${L.name} will be showing his men to somebody else for a few weeks.`; } },
  won: { weight:()=>1.6, when:(d,h)=>h.fighters.length>0,
    run(d,h){ const L=lanistaOf(h.name); const f = pick(h.fighters);
      f.wins++; f.pfame += ri(4,9); h.fame += ri(5,11);
      if(!f.nick && f.wins>=5) f.nick = pick(NICKS);
      return `${f.name} of House ${h.name} took a card at ${pick(["Nola","Cales","Suessa","Atella","Teanum"])} and came back with it. ${L.name} has made sure Capua knows.`; } },
  boast: { weight:()=>0.9, when:(d,h)=>h.fighters.length>0,
    run(d,h){ const L=lanistaOf(h.name); const f = h.fighters.slice().sort((a,b)=>b.pfame-a.pfame)[0];
      const yours = activeG(d).sort((a,b)=>b.pfame-a.pfame)[0];
      if(!f) return null;
      return yours
        ? `${L.name} was heard at the baths putting ${f.name} above ${yours.name}, and putting it in a way that would carry.`
        : `${L.name} was heard at the baths listing his own men in order, at length.`; } },
  lost: { weight:()=>1.1, when:(d,h)=>h.fighters.length>2,
    run(d,h){ const f = pick(h.fighters);
      h.fighters = h.fighters.filter(x=>x.id!==f.id);
      h.fame = Math.max(0, h.fame-8);
      if(d.nemesis && d.nemesis.fid===f.id) d.nemesis = null;
      const beat = f.beatYou ? ` He had beaten this house ${f.beatYou===1?"once":f.beatYou+" times"}.` : "";
      return `${f.name} of House ${h.name} was killed on somebody else's sand this week.${beat}`; } },
};
const RM_KEYS = Object.keys(RIVAL_MOVES);
function rivalTurn(d){
  if(!d.rivals || !d.rivals.length || d.rome) return;
  d.rivals.forEach(h=>{ if(h.away){ h.away--; if(h.away<=0) h.away = 0; } });
  if(R() > 0.7) return;
  const h = pick(d.rivals.filter(x=>!x.away).length ? d.rivals.filter(x=>!x.away) : d.rivals);
  const bag = [];
  for(const k of RM_KEYS){ const M = RIVAL_MOVES[k];
    let ok = false; try { ok = M.when(d,h); } catch(e){ ok = false; }
    if(!ok) continue;
    const w = Math.max(0.2, M.weight(h));
    for(let i=0;i<Math.round(w*10);i++) bag.push(k);
  }
  if(!bag.length) return;
  const key = pick(bag);
  let line = null;
  try { line = RIVAL_MOVES[key].run(d, h); } catch(e){ line = null; }
  if(!line) return;
  d.rivalLog = [{ text:line, week:d.week, house:h.name }, ...(d.rivalLog||[])].slice(0, 8);
  chron(d, line, "info");
}

function rivalWeekly(d){
  if(!d.rivals) return;
  d.rivals.forEach(h=>{
    const L = lanistaOf(h.name);
    h.grudge = clamp(h.grudge - 1*L.grudgeDecay, 0, 100);
    h.fighters.forEach(f=>{
      if(f.injury){ f.injury.weeks--; if(f.injury.weeks<=0) f.injury=null; }
      else { for(const k of CLASSES[f.cls].key) f[k] = clamp(f[k] + (0.25 + f.potential/300)*L.train*(h.doctore?1.3:1), 5, 97); }
      f.fatigue = 0;
    });
    const fit = h.fighters.filter(f=>!f.injury);
    if(fit.length && R()<0.55){
      const f = pick(fit);
      if(R()<0.56){
        f.wins++; f.pfame += ri(3,8); h.fame += ri(2,5);
        if(!f.nick && f.wins>=5) f.nick = pick(NICKS);
        if(R()<0.10) f.kills++;
      } else {
        f.losses++; h.fame += 1;
        if(R()<0.05){ h.fighters = h.fighters.filter(x=>x.id!==f.id); }
        else if(R()<0.4){ const inj=pick(INJURIES); f.injury={name:inj[0],weeks:inj[1],pen:inj[2]}; }
      }
    }
    if(h.fame>60) h.fame -= 1;
    while(h.fighters.length<4) h.fighters.push(makeRivalFighter(d, h.name, clamp(rnd(h.fame/4)+ri(15,35), 25, 85)));
  });
}

/* ---- A MAN WHO WILL NOT GO OUT ----
   Men have only ever left this house by dying, by the rudis, by sale, or in a
   revolt of the whole cell block. The commonest human failure — one man, sitting
   down, on a Tuesday — was missing. */
const REFUSE_REASONS = {
  used:    { when:(d,g)=>g.memory && g.memory.some(m=>m.kind==="hurt"),
    say:g=>`You sent him out on a wound that had not closed, and he has decided that was the last time.` },
  kin:     { when:(d,g)=>g.memory && g.memory.some(m=>m.kind==="soldKin" || m.kind==="duel"),
    say:g=>`Whatever happened to the man he called brother, he has stopped being able to put it down.` },
  word:    { when:(d,g)=>g.memory && g.memory.some(m=>m.kind==="broke" || m.kind==="refused"),
    say:g=>`He asked you for one thing. He is not asking for anything now.` },
  blood:   { when:(d,g)=>g.memory && g.memory.some(m=>m.kind==="sine"),
    say:g=>`He has been put on too many cards with no mercy in them and he has done the arithmetic.` },
  plain:   { when:()=>true,
    say:g=>`There is no particular reason he will give. He has simply had enough, and today is the day.` },
};
const refusing = g => !!(g && g.refusing);
const canFight = g => g && g.status==="active" && !refusing(g) && !g.learning && !(g.benched && g.benched.weeks>0);
function refuseCandidate(d){
  return activeG(d).filter(g=>!isAuctor(g) && !refusing(g) &&
    (regardRefuse(g) || (regardOf(g)<32 && g.defiance>62 && g.morale<32)))
    .sort((a,b)=>regardOf(a)-regardOf(b))[0] || null;
}
function refuseWeek(d){
  if(d.over || d.rome) return;
  /* a man already sitting keeps sitting, and the others do the arithmetic */
  for(const g of activeG(d)){
    if(!refusing(g)) continue;
    g.refusing.weeks++;
    d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id)
      o.defiance = clamp(o.defiance + 0.9, 0, 100); });
    d.unrest = clamp(d.unrest + 0.8, 0, 100);
  }
  if(d.pendingEvent) return;
  const g = refuseCandidate(d);
  if(!g) return;
  const odds = 0.05 + Math.max(0, (24 - regardOf(g)))*0.011;
  if(R() > odds) return;
  const key = shuffled(Object.keys(REFUSE_REASONS)).find(k=>{
    try { return REFUSE_REASONS[k].when(d,g); } catch(e){ return false; } }) || "plain";
  g.refusing = { since:d.week, weeks:0, reason:key };
  d.pendingEvent = { id:"refusal", title:"He Will Not Go Out",
    text:`${fullName(g)} is sitting on the boards with his back to the wall and will not put his hands up. ${REFUSE_REASONS[key].say(g)} The doctore has asked him twice. The other men are not looking at him and are not looking away either.`,
    choices:["The whip", "Talk to him", (g.ambition && !g.ambition.met && !g.ambition.broken) ? "Give him the thing he wants" : "Let him sit", "Take him off the card"],
    data:{ gid:g.id, key } };
}
function endRefusal(d, g){
  if(!g || !g.refusing) return 0;
  const w = g.refusing.weeks;
  g.refusing = null;
  return w;
}
/* The three ways a sitting man is brought back to his feet — used both by the
   moment it first happens and by his page afterwards, so he is never stuck.
   method: "whip" | "talk" | "give" | "sit". Returns the line to show. */
function applyRefusal(d, g, method){
  const others = () => d.gladiators.filter(o=>o.status==="active" && o.id!==g.id);
  if(method==="whip"){
    endRefusal(d, g);
    remember(d, g, "whipped");
    g.morale = clamp(g.morale-16,0,100);
    g.defiance = clamp(g.defiance+6,0,100);
    g.fatigue = clamp(g.fatigue+12,0,100);
    g.broken = true;
    others().forEach(o=>{ o.morale = clamp(o.morale-7,0,100); o.defiance = clamp(o.defiance+5,0,100);
      o.regard = clamp(regardOf(o)-5,0,100); });
    d.unrest = clamp(d.unrest+8,0,100);
    addRep(d, "blood", 5);
    return `He goes out. Everyone watches him go out and everyone knows exactly how it was arranged. It works, in that he is on the sand. It works in no other way at all.`;
  }
  if(method==="talk"){
    const p = clamp(0.16 + regardOf(g)*0.011 + (hasLT(d,"merciful")?0.14:0) - (hasLT(d,"hard")?0.08:0), 0.05, 0.8);
    if(R() < p){
      endRefusal(d, g);
      remember(d, g, "heard", 1);
      g.morale = clamp(g.morale+13,0,100);
      g.defiance = clamp(g.defiance-9,0,100);
      return `You sit down on the boards with him, which nobody in this house has ever seen a lanista do, and after a while he gets up. Nothing was promised. Something was heard.`;
    }
    g.morale = clamp(g.morale-4,0,100);
    others().forEach(o=>{ o.defiance = clamp(o.defiance+2,0,100); });
    return `You talk. He listens to all of it, politely, and does not move. There is nothing further to say and both of you know it.`;
  }
  if(method==="give" && g.ambition && !g.ambition.met && !g.ambition.broken){
    endRefusal(d, g);
    ambitionMet(d, g);
    remember(d, g, "kept");
    g.defiance = clamp(g.defiance-18,0,100);
    others().forEach(o=>{ o.morale = clamp(o.morale+6,0,100); o.regard = clamp(regardOf(o)+5,0,100); });
    d.unrest = clamp(d.unrest-9,0,100);
    return `You give him the thing he had stopped asking for. He is on his feet before you have finished saying it, and the whole block heard which way that went.`;
  }
  /* he sits, and the arithmetic goes round the cells */
  g.morale = clamp(g.morale-3,0,100);
  others().forEach(o=>{ o.defiance = clamp(o.defiance+6,0,100); });
  d.unrest = clamp(d.unrest+5,0,100);
  return `You leave him where he is. By the evening every man in the block has worked out that sitting down is a thing that can be done and survived.`;
}

/* ---- MUNERA ----
   Funeral games were exactly that: combat staged at a rich man's tomb by his heirs.
   Holding them for a dead gladiator inverts the whole institution, which is the point.
   It costs real coin and returns nothing you can spend. */
const RITES = {
  none:   { key:"none", name:"Nothing", cost:()=>0, unrest:4, regard:-6, fame:0, mercy:0,
    desc:"He goes into the ground and the week goes on. Nobody says anything about it, which is how you know.",
    line:(d,m)=>`${m.name} is buried without ceremony. The yard trains at the usual hour.` },
  rite:   { key:"rite", name:"A rite at the gate", cost:m=>rnd(70 + m.pfame*1.1), unrest:-7, regard:5, fame:2, mercy:5,
    desc:"Wine, a fire, his name said aloud, and the familia stood down for the afternoon. No crowd, no card.",
    line:(d,m)=>`They burn a fire at the gate for ${m.name} and every man in the house is stood down to watch it. It is not much. It is done properly.` },
  games:  { key:"games", name:"Games in his name", cost:m=>rnd(320 + m.pfame*3.4 + m.wins*22), unrest:-19, regard:14, fame:11, mercy:14,
    desc:"A card at your own expense with his name on the bill — the thing free men are given. Capua will come and Capua will talk.",
    line:(d,m)=>`Munera for ${m.name}, paid for out of the house, with his name on the bill where the dead man's usually goes. Capua turns out for it, half of them to see whether you would really do it.` },
};
const RITE_KEYS = ["none","rite","games"];
const RITE_WINDOW = 6;
const unhonoured = d => (d.unburied||[]).filter(m=>d.week - m.week <= RITE_WINDOW);
function markUnburied(d, g){
  d.unburied = d.unburied || [];
  d.unburied.push({ gid:g.id, name:fullName(g), week:d.week,
    pfame:Math.round(g.pfame||0), wins:g.wins||0,
    kin: tieList(d).filter(t=>(t.a===g.id||t.b===g.id) && t.kind==="brother")
      .map(t=>t.a===g.id?t.b:t.a) });
  if(d.unburied.length > 14) d.unburied = d.unburied.slice(-14);
}
function holdMunera(d, gid, key){
  const M = RITES[key]; if(!M) return false;
  const m = (d.unburied||[]).find(x=>x.gid===gid);
  if(!m || m.done) return false;
  const c = M.cost(m);
  if(d.gold < c) return false;
  d.gold -= c;
  m.done = key;
  d.unrest = clamp(d.unrest + M.unrest, 0, 100);
  d.fame += M.fame;
  if(M.mercy) addRep(d, "mercy", M.mercy);
  activeG(d).forEach(g=>{
    const close = (m.kin||[]).includes(g.id);
    if(M.regard > 0) remember(d, g, "munera", (M.regard/10) * (close ? 1.7 : 1));
    else g.regard = clamp(regardOf(g) + M.regard*(close?1.8:1), 0, 100);
    g.morale = clamp(g.morale + (M.regard>0 ? (close?9:5) : (close?-9:-3)), 0, 100);
  });
  const a = (d.annals||[]).find(x=>x.id===gid);
  if(a && key!=="none") a.munera = key;
  d.honoured = (d.honoured||0) + (key==="games" ? 1 : 0);
  chron(d, M.line(d, m), key==="none" ? "bad" : "good");
  return true;
}

/* ---- WHAT HE MAKES OF YOU ----
   Every man in these cells has bonds with the others, a thing he privately wants,
   and until now no opinion whatsoever about the person who owns him. */
const REGARD = {
  cloth:     { n: 22, say:"You stopped a bout to keep him alive." },
  surgeon:   { n: 11, say:"You paid the surgeon for him when the cheap answer was there." },
  kept:      { n: 20, say:"You gave him your word and then you kept it." },
  freedKin:  { n: 15, say:"You gave the rudis to a man he called brother." },
  rested:    { n:  4, say:"You took him off the sand when he had nothing left." },
  named:     { n: 12, say:"You had steel made for him alone." },
  collegium: { n:  9, say:"You put the house into a burial society, so there would be a stone." },
  munera:    { n: 13, say:"You held games for one of them, out of your own coin, for nothing." },
  servedOut: { n: 18, say:"You kept him alive long enough to fight his sentence out." },
  sworn:     { n: 10, say:"You had the oath said over him properly, in front of everybody." },
  steel:     { n: 12, say:"You put a piece into his hands that meant something." },
  mastered:  { n: 12, say:"You kept him on the sand long enough to become a master of it." },
  taught:    { n: 16, say:"You paid to have him taught a second trade at an age when nobody bothers." },
  sided:     { n: 14, say:"There was a thing in the yard and you took his part in front of everybody." },
  against:   { n:-21, say:"There was a thing in the yard and you took the other man's part in front of everybody.", bad:true },
  watched:   { n:-11, say:"Two men went at each other in the square and you stood there and let it run.", bad:true },
  heard:     { n: 17, say:"You sat down on the boards with him and listened." },
  spared:    { n:  8, say:"You let a beaten man live when the crowd wanted otherwise." },
  feast:     { n:  3, say:"You fed the familia properly, more than once." },
  broke:     { n:-24, say:"You promised him a thing and then spent it elsewhere.", bad:true },
  soldKin:   { n:-20, say:"You sold a man he called brother.", bad:true },
  whipped:   { n:-14, say:"You had him whipped.", bad:true },
  hurt:      { n:-16, say:"You sent him out on a wound that had not closed.", bad:true },
  sine:      { n: -9, say:"You put him on a card with no mercy in it.", bad:true },
  refused:   { n:-13, say:"He asked you for the one thing he wanted and you said no.", bad:true },
  duel:      { n:-26, say:"You left him on the sand until he had to finish a man from his own cells.", bad:true },
  lapsed:    { n:-12, say:"You stopped the burial dues after men had gone into the ground under them.", bad:true },
};
const REGARD_KEYS = Object.keys(REGARD);
const regardOf = g => clamp(g.regard==null ? 50 : g.regard, 0, 100);
const regardWord = v => v>=82?"would follow you anywhere" : v>=64?"trusts you" : v>=46?"takes you as he finds you"
  : v>=28?"has his doubts" : v>=12?"does not trust you" : "hates you";
const regardColour = v => cbc(v>=64?"#9aa86a" : v>=46?"#b09b7d" : v>=28?"#d8ac5f" : "#d96f5d");
function remember(d, g, kind, mult){
  if(!g || !REGARD[kind]) return;
  const R2 = REGARD[kind];
  g.regard = clamp(Math.round(regardOf(g) + R2.n*(mult==null?1:mult)), 0, 100);
  g.memory = g.memory || [];
  if(!g.memory.some(m=>m.kind===kind)) g.memory.push({ kind, week:d.week });
  else { const m = g.memory.find(x=>x.kind===kind); m.week = d.week; m.again = (m.again||1)+1; }
  if(g.memory.length > 8) g.memory = g.memory.slice(-8);
}
const rememberAll = (d, kind, mult) => activeG(d).forEach(g=>remember(d, g, kind, mult));
/* what it is worth on the sand and in the yard */
const regardPower  = g => 0.97 + regardOf(g)/100*0.06;      // 0.97 at nothing, 1.03 at everything
const regardCalm   = g => (regardOf(g)-50)*0.016;           // drifts his defiance
const regardLoyal  = g => regardOf(g) >= 70;                 // will not be poached
const regardRefuse = g => regardOf(g) <= 18;                 // and one day will not go out

/* ---- READING A MAN BEFORE YOU FIGHT HIM ----
   You have been picking a word and watching. There is a week between the card
   going up and the bout, and it is worth spending. */
const TELLS = {
  tires:   { plan:"outlast", when:o=>o.end<47,
    say:o=>`${o.name} is blowing hard by the sixth exchange. He has been for years and he knows it, which is why he goes early.` },
  reach:   { plan:"reach", when:o=>o.tec<47,
    say:o=>`${o.name} does not know what to do about a man who will not let him close. He walks onto things.` },
  open:    { plan:"wait", when:o=>o.dis<47,
    say:o=>`${o.name} drops his shield-arm for a beat every time he lands one. Every time.` },
  quick:   { plan:"crowd", when:o=>o.agi>=62,
    say:o=>`${o.name} is a great deal quicker than he looks and he uses the whole square doing it.` },
  strong:  { plan:"wait", when:o=>o.str>=68,
    say:o=>`${o.name} hits hard enough that the third one puts a man down whatever he is wearing. Do not trade with him.` },
  showman: { plan:"crowd", when:o=>o.sho>=62,
    say:o=>`${o.name} plays to the tiers between exchanges. It is worth something to him and it costs him a breath each time.` },
  green:   { plan:"press", when:o=>(o.wins||0)<=2,
    say:o=>`${o.name} has almost no bouts behind him. Whatever he does under pressure, he has not done it often.` },
  cold:    { plan:"press", when:o=>formOf(o) <= -30,
    say:o=>`${o.name} has had a bad month and it is on him. He starts slowly now, and he did not used to.` },
  veteran: { plan:"outlast", when:o=>(o.wins||0)>=9,
    say:o=>`${o.name} has been doing this a long time and has a habit of letting the other man tire himself out first.` },
};
const TELL_KEYS = Object.keys(TELLS);
const PLANS = {
  none:    { name:"No plan", desc:"Send him out and see.", tell:null },
  outlast: { name:"Let him spend himself", desc:"Give ground early, take the bout long.", tell:"tires" },
  reach:   { name:"Keep him at the end of it", desc:"Never let him inside. Nothing pretty.", tell:"reach" },
  wait:    { name:"Wait for the opening", desc:"Absorb, and go once, when it comes.", tell:"open" },
  crowd:   { name:"Crowd him", desc:"Stay on his chest and give him no room to be clever.", tell:"quick" },
  press:   { name:"Break him early", desc:"Everything in the first three exchanges.", tell:"green" },
};
const PLAN_KEYS = Object.keys(PLANS);
/* what a plan is worth depends entirely on whether you read him right */
function planEffect(plan, opp){
  const P = PLANS[plan];
  if(!P || !P.tell) return { pow:1, stam:1, guard:1, right:null };
  const matches = TELL_KEYS.filter(k=>TELLS[k].plan===plan && TELLS[k].when(opp));
  if(matches.length) return { pow:1.052, stam:0.93, guard:0.955, right:true };
  return { pow:0.974, stam:1.04, guard:1.028, right:false };
}
const watchCost = (d, offer) => rnd(28 + offer.tier*22 + (offer.purse||0)*0.045);
const tellsOf = (d, offer) => {
  const o = offer.opp;
  const found = TELL_KEYS.filter(k=>{ try { return TELLS[k].when(o); } catch(e){ return false; } });
  const n = d.doctore ? 3 : 2;
  return shuffled(found).slice(0, n);
};
function watchHim(d, offer){
  d.flags.everWatched = (d.flags.everWatched||0) + 1;
  if(!offer || offer.watched) return false;
  const c = watchCost(d, offer);
  if(d.gold < c) return false;
  d.gold -= c;
  offer.watched = tellsOf(d, offer);
  if(!offer.watched.length) offer.watched = ["nothing"];
  return true;
}

/* ---- THE HEIR ----
   The lanista dies and the house does not have to. What survives is the sand, the
   men and the debts; what does not is everything Capua thought of the last man. */
const HEIRS = {
  son:     { name:"A son", fameKeep:0.72, favorKeep:0.50, unrest:6, morale:-4, gold:0,
    line:"He has grown up in this yard. He knows what the men are called and which of them lie about their fatigue, and they have watched him do it since he was nine, which cuts both ways.",
    took:n=>`${n} takes his father's chair. He has been in this yard his whole life and the men are not sure yet whether that is reassuring.` },
  nephew:  { name:"A nephew", fameKeep:0.62, favorKeep:0.62, unrest:12, morale:-9, gold:900,
    line:"Your brother's boy, with his brother's money and no idea what any of these men are called. Capua will give him the benefit of the doubt for about a season.",
    took:n=>`${n} arrives from Neapolis with a chest of his own coin and a very clear idea of how this will be run. The cells will teach him otherwise.` },
  doctore: { name:"Your freed doctore", fameKeep:0.48, favorKeep:0.34, unrest:-16, morale:14, gold:0,
    line:"He was on that sand himself and every man in the cells knows it. They would follow him anywhere. Capua will take rather longer, because Capua knows it too.",
    took:n=>`${n} — who fought on that sand and was freed off it — takes the house. The cells are quieter tonight than they have been in years. The magistrate's people are noticeably cooler.` },
};
const heirEligible = d => {
  const out = [];
  if(d.lanista && d.lanista.age >= 40) out.push("son");
  out.push("nephew");
  if(d.doctore && d.doctore.fromHouse) out.push("doctore");
  return out;
};
function nameHeir(d, kind){
  if(!HEIRS[kind]) return false;
  const nm = kind==="doctore" && d.doctore ? d.doctore.name
    : `${pick(PRAENOMINA)} ${pick(NOMINA)} ${pick(COGNOMINA)}`;
  d.heir = { kind, name:nm, named:d.week };
  chron(d, kind==="doctore"
    ? `You put it in writing that ${nm} takes the house if you do not. He reads it twice and says nothing at all.`
    : `You put ${nm}'s name to the house in the event of your death. It is a small piece of paper and it changes what this place is.`, "good");
  return true;
}
/* the house goes on; almost nothing about your standing does */
function succeed(d){
  const H = d.heir && HEIRS[d.heir.kind];
  if(!H) return false;
  const old = d.lanista;
  const nm = d.heir.name;
  d.generation = (d.generation||1) + 1;
  d.fame = Math.max(0, rnd(d.fame * H.fameKeep));
  patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor * H.favorKeep, 0, 100); });
  recomputeFavor(d);
  d.unrest = clamp(d.unrest + H.unrest, 0, 100);
  d.gold += H.gold;
  d.gladiators.forEach(g=>{ if(g.status==="active") g.morale = clamp(g.morale + H.morale, 0, 100); });
  /* he starts with nothing Capua can hold against him, and nothing it credits him for */
  d.lanista = { name:nm, age: d.heir.kind==="doctore" ? ri(34,44) : ri(22,31),
    health: ri(84,95), traits:[], since:d.week, wonBets:0, quietStanding:0, styleRun:0, styleWas:null };
  if(d.heir.kind==="doctore") d.doctore = null;
  d.heir = null;
  d.forebears = [...(d.forebears||[]), { name:old.name, age:old.age, traits:old.traits.slice(),
    from:old.since||1, to:d.week, gen:d.generation-1 }];
  chron(d, `${H.took(nm)} ${old.name} is carried out of a gate he came in through forty years ago, and the week's training goes ahead because it was always going to.`, "event");
  d.over = null;
  return true;
}

/* ---- DEADLINES ----
   Nothing in this house has ever had to be done by a particular week. Five things
   do now, and the calendar stops being scenery. */
const EDITORS = ["Aulus Vibius","Publius Sittius","the aedile Norbanus","Marcus Blossius","the younger Calavius"];
const DL = {
  booking:   { name:"A booking", colour:"#c99a4b" },
  challenge: { name:"A challenge", colour:"#d96f5d" },
  levy:      { name:"A levy", colour:"#d8ac5f" },
};
const dueIn = (d, x) => x.due - d.week;
const deadlines = d => (d.deadlines||[]).slice().sort((a,b)=>a.due-b.due);
function addDeadline(d, obj){ d.deadlines = d.deadlines || []; obj.id = d.nextId++; d.deadlines.push(obj); return obj; }
const dropDeadline = (d, id) => { d.deadlines = (d.deadlines||[]).filter(x=>x.id!==id); };
const bookedFor = (d, key) => (d.deadlines||[]).find(x=>x.kind==="booking" && x.festKey===key && !x.met);

/* an editor contracts one named man for one named festival */
function offerBooking(d){
  if((d.deadlines||[]).some(x=>x.kind==="booking")) return null;
  const men = activeG(d).filter(g=>g.pfame>=25 && !isAuctor(g));
  if(!men.length || d.city || d.travel || d.rome) return null;
  const g = pick(men);
  const soon = nextFestivals(d, 3).filter(f=>!f.rest && weeksUntil(d,f)>=2 && weeksUntil(d,f)<=6);
  if(!soon.length) return null;
  const f = pick(soon);
  const due = d.week + weeksUntil(d, f);
  const tier = d.fame>=TIERS[2].fame ? 2 : 1;
  const total = rnd((TIERS[tier].purse[0] + R()*TIERS[tier].purse[1]) * 1.5);
  return { editor: pick(EDITORS), gid:g.id, name:g.name, festKey:f.key, festName:f.name,
    due, advance: rnd(total*0.35), balance: rnd(total*0.65), tier };
}
function takeBooking(d, o){
  d.gold += o.advance;
  addDeadline(d, { kind:"booking", gid:o.gid, name:o.name, festKey:o.festKey, festName:o.festName,
    due:o.due, advance:o.advance, balance:o.balance, tier:o.tier, editor:o.editor, met:false });
  chron(d, `${o.editor} contracts ${o.name} for ${o.festName} — ${o.advance} down and ${o.balance} on the day. The name is on the bill now and bills get read.`, "good");
}
function failBooking(d, x){
  const back = x.advance * 2;
  d.gold -= back;
  d.fame = Math.max(0, d.fame - 22);
  patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-9,0,100); }); recomputeFavor(d);
  facMove(d, "front", -6);
  chron(d, `${x.name} did not appear at ${x.festName}. ${x.editor} takes ${back} denarii back — twice what he advanced — and mentions it to the others, which is the part that costs.`, "bad");
}
/* a rival names one of your men and a week */
function offerChallenge(d){
  if((d.deadlines||[]).some(x=>x.kind==="challenge")) return null;
  const h = (d.rivals||[]).filter(x=>x.grudge>=45).sort((a,b)=>b.grudge-a.grudge)[0];
  if(!h || d.city || d.travel || d.rome) return null;
  const men = activeG(d).filter(g=>g.pfame>=20);
  if(!men.length) return null;
  const g = men.reduce((m,x)=>x.pfame>m.pfame?x:m, men[0]);
  const f = h.fighters.filter(x=>!x.injury && x.name!==g.name).sort((a,b)=>b.pfame-a.pfame)[0];
  if(!f) return null;
  return { house:h.name, lan:lanistaOf(h.name).name, gid:g.id, name:g.name, fid:f.id, foe:f.name,
    due: d.week + ri(3,5), purse: rnd(500 + R()*500) };
}
/* the magistrate wants money by a date */
function offerLevy(d){
  if((d.deadlines||[]).some(x=>x.kind==="levy")) return null;
  if(d.fame < 90 || d.city || d.travel || d.rome) return null;
  const amt = rnd(140 + d.fame*0.5 + R()*140);
  return { amount:amt, due: d.week + ri(3,6), what: pick([
    "repairs to the amphitheatre's awnings","the aedile's games next spring",
    "a road the town has been promising for nine years","a statue nobody asked for"]) };
}

function deadlineWeek(d){
  for(const x of deadlines(d)){
    if(d.week < x.due) continue;
    if(x.kind==="booking"){
      if(!x.met) failBooking(d, x);
      dropDeadline(d, x.id);
    } else if(x.kind==="challenge"){
      if(!x.met){
        d.fame = Math.max(0, d.fame-14);
        facMove(d, "mob", -5);
        const h = (d.rivals||[]).find(y=>y.name===x.house);
        if(h) h.grudge = clamp(h.grudge-12, 0, 100);
        d.gladiators.forEach(o=>{ if(o.status==="active") o.morale = clamp(o.morale-6,0,100); });
        chron(d, x.saga
          ? `The day of the reckoning came, and ${x.name} did not stand on the sand for it. Whatever the crowd was building toward, it lets the breath out all at once. A story you do not finish is a story people stop telling.`
          : x.nem
          ? `The day came and went and ${x.name} did not stand. ${x.lan} does not have to say a word — House ${x.house} spent the season demanding the grudge match, and your house did not make it.`
          : `${x.name} did not answer ${x.lan}'s challenge. House ${x.house} says nothing about it publicly, which is how they say the most.`, "bad");
        if(x.nem && d.nemHouse){ d.nemHouse.stage = 2; d.nemHouse.heat = clamp(d.nemHouse.heat-20, 25, 100); d.flags.nemCool = d.week; }
        if(x.saga && d.saga){ d.saga.stage = 2; d.saga.renown = clamp(d.saga.renown-30, 30, 100); }
      }
      dropDeadline(d, x.id);
    } else if(x.kind==="levy"){
      if(d.gold >= x.amount){
        d.gold -= x.amount;
        patronsOf(d).forEach(p=>{ if(p.rank==="magistrate") p.favor = clamp(p.favor+9,0,100); }); recomputeFavor(d);
        chron(d, `The levy is paid — ${x.amount} denarii toward ${x.what}. Nobody thanks you and everybody notices.`);
      } else {
        d.fame = Math.max(0, d.fame-16);
        patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-12,0,100); }); recomputeFavor(d);
        chron(d, `The levy falls due and the house cannot meet it. The magistrate's clerk writes the shortfall down in a hand that has done this before.`, "bad");
      }
      dropDeadline(d, x.id);
    }
  }
  /* new obligations arrive */
  if(!d.city && !d.travel && !d.rome && !d.over){
    if(R()<0.10){ const o = offerBooking(d); if(o) d.pendingEvent = { id:"booking",
      title:"A Name on the Bill", text:`${o.editor} is putting on ${o.festName} and wants ${o.name} specifically, by name, on the bill. ${o.advance} denarii now and ${o.balance} on the day. If ${o.name} is not standing on that sand in ${o.due-d.week} weeks, the advance comes back doubled and the story goes round Capua ahead of you.`,
      choices:[`Sign for it — ${o.advance}d now`, "Do not promise a man five weeks out"], data:{ o } }; }
    else if(R()<0.06){ const c = offerChallenge(d); if(c) d.pendingEvent = { id:"challenge",
      title:"Named in Public", text:`${c.lan} has named ${c.name} in front of the editors and half of Capua — his ${c.foe} against your man, inside ${c.due-d.week} weeks, for a purse of ${c.purse}. He did it loudly and on purpose. Everyone is now waiting to see whether you answer.`,
      choices:["Accept it", "Let it pass"], data:{ c } }; }
    else if(R()<0.07){ const l = offerLevy(d); if(l){ addDeadline(d, Object.assign({kind:"levy"}, l));
      chron(d, `A levy is laid on the schools of Capua toward ${l.what} — ${l.amount} denarii, due in ${l.due-d.week} weeks.`, "bad"); } }
  }
}

/* ---- THE CELLS AT NIGHT ----
   Everything in this house is hidden behind a word like "restless". Somebody has
   to be listening for you, and there are only two kinds of somebody. */
const EAR_FEE = 14;
const earOn = d => !!(d.ear && (d.ear.who==="gate" || d.gladiators.some(g=>g.id===d.ear.gid && g.status==="active")));
const earInside = d => !!(d.ear && d.ear.who==="man");
/* every fragment is drawn from something actually true */
const WHISPERS = [
  { deep:false, when:d=>activeG(d).some(g=>g.defiance>=62),
    say:d=>{ const g = pick(activeG(d).filter(x=>x.defiance>=62));
      return `${g.name} does most of the talking after the lamps go out. The others do not interrupt him.`; } },
  { deep:false, when:d=>activeG(d).some(g=>g.morale<=30),
    say:d=>{ const g = pick(activeG(d).filter(x=>x.morale<=30));
      return `${g.name} has stopped eating with the rest of them. He sits with his back to the door.`; } },
  { deep:false, when:d=>activeG(d).some(g=>strainOf(g)>=48),
    say:d=>{ const g = pick(activeG(d).filter(x=>strainOf(x)>=48));
      return `${g.name} cannot get up off the boards in the morning without making a noise about it. He thinks nobody hears.`; } },
  { deep:false, when:d=>tieList(d).some(t=>t.kind==="brother"&&t.strength>=45),
    say:d=>{ const t = pick(tieList(d).filter(x=>x.kind==="brother"&&x.strength>=45));
      const a = d.gladiators.find(g=>g.id===t.a), b = d.gladiators.find(g=>g.id===t.b);
      return a&&b ? `${a.name} and ${b.name} sit together at every meal now and talk about nothing at all, which is what men do when they mean it.` : null; } },
  { deep:false, when:d=>tieList(d).some(t=>t.kind==="rival"&&t.strength>=40),
    say:d=>{ const t = pick(tieList(d).filter(x=>x.kind==="rival"&&x.strength>=40));
      const a = d.gladiators.find(g=>g.id===t.a), b = d.gladiators.find(g=>g.id===t.b);
      return a&&b ? `Whatever is between ${a.name} and ${b.name}, it has stopped being about the sand. One of them has moved his bedding.` : null; } },
  { deep:false, when:d=>!!d.nemesis,
    say:d=>`Somebody said ${d.nemesis.name}'s name in the dark and the whole room went quiet for a moment, which is its own kind of answer.` },
  { deep:false, when:d=>d.unrest>=52,
    say:d=>`The talking stops when anyone from the house walks past the cells. It did not used to stop.` },
  { deep:true,  when:d=>activeG(d).some(g=>g.ambition && !g.ambition.met && !g.ambition.broken),
    say:d=>{ const g = pick(activeG(d).filter(x=>x.ambition && !x.ambition.met && !x.ambition.broken));
      return `${g.name} wants one thing and has not told you: ${ambWord(g).toLowerCase().replace(/\.$/,"")}. He has told the others.`; } },
  { deep:true,  when:d=>!!(d.rebellion && d.rebellion.leaderId && !d.flags.leaderKnown),
    say:d=>{ const L = d.gladiators.find(g=>g.id===d.rebellion.leaderId);
      return L ? `They are not all talking. One of them is being listened to, and it is ${L.name}.` : null; } },
  { deep:true,  when:d=>!!d.poach,
    say:d=>{ const g = d.gladiators.find(x=>x.id===d.poach.gid);
      return g ? `${g.name} has been at the wall after dark three nights this week. He is not exercising.` : null; } },
  { deep:true,  when:d=>activeG(d).some(g=>g.ambition && g.ambition.promised && !g.ambition.met),
    say:d=>{ const g = pick(activeG(d).filter(x=>x.ambition && x.ambition.promised && !x.ambition.met));
      return `${g.name} has told two other men what you promised him. He repeats it the way people repeat a thing they are not sure of.`; } },
  { deep:true,  when:d=>!!(d.primus && d.primus.mine) && activeG(d).some(g=>g.id!==d.primus.gid && primusEligible(g)),
    say:d=>{ const g = pick(activeG(d).filter(x=>x.id!==d.primus.gid && primusEligible(x)));
      return `${g.name} has worked out his own record against the man holding the primacy and he did not need to write it down.`; } },
];
function listenWeek(d){
  d.heard = [];
  if(!earOn(d)) return;
  const inside = earInside(d);
  const pool = WHISPERS.filter(w=>{ if(w.deep && !inside) return false;
    try { return w.when(d); } catch(e){ return false; } });
  const want = inside ? ri(3,4) : ri(1,2);
  const bag = shuffled(pool).slice(0, want);
  for(const w of bag){ let line = null;
    try { line = w.say(d); } catch(e){ line = null; }
    if(line) d.heard.push(line);
  }
  if(inside){
    const ear = d.gladiators.find(g=>g.id===d.ear.gid);
    if(ear){
      ear.morale = clamp(ear.morale-1.1, 0, 100);
      d.ear.risk = (d.ear.risk||0) + 1.0;
      if(R() < d.ear.risk/700){
        /* they work out who has been listening */
        d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==ear.id){
          o.morale = clamp(o.morale-13,0,100); o.defiance = clamp(o.defiance+11,0,100); } });
        ear.morale = clamp(ear.morale-30, 0, 100);
        ear.defiance = clamp(ear.defiance+18, 0, 100);
        d.unrest = clamp(d.unrest+16, 0, 100);
        dropTies(d, ear.id);
        chron(d, `They have worked out who has been carrying what they say up to the house. ${fullName(ear)} eats alone now and will for as long as he is here.`, "bad");
        d.ear = null;
      }
    } else d.ear = null;
  } else d.gold -= EAR_FEE;
}

/* ---- THE MONEYLENDER ----
   There is a way out of a bad month. It makes the next three worse, and it is
   very hard to stop taking once you have started. */
const LENDERS = {
  gratus:  { name:"Novius Gratus", rate:0.035, patience:12, cap:1400,
    blurb:"Polite, quick, and cheaper than the others. He is cheaper because he does not need to argue.",
    hard:true },
  murena:  { name:"Titus Murena", rate:0.058, patience:20, cap:2400,
    blurb:"Expensive and unhurried. He has been doing this since before the Social War and has never once raised his voice.",
    hard:false },
  scaeva:  { name:"Scaeva", rate:0.082, patience:8, cap:900,
    blurb:"Lends to anyone, at a price that says so. Nobody knows his other name and nobody asks for it.",
    hard:true },
};
const LEND_KEYS = Object.keys(LENDERS);
const owes = d => d.loan ? Math.max(0, Math.round(d.loan.owed)) : 0;
const loanWeeks = d => d.loan ? d.week - d.loan.taken : 0;
const loanLender = d => d.loan ? LENDERS[d.loan.who] : null;
function borrow(d, who, amount){
  const L = LENDERS[who]; if(!L) return false;
  if(d.loan) return false;
  const take = Math.min(amount, L.cap);
  d.gold += take;
  d.loan = { who, principal:take, owed:take, taken:d.week, missed:0, warned:0 };
  chron(d, `${L.name} counts out ${take} denarii on your own table and does not write anything down, which is not reassuring. ${Math.round(L.rate*100)} in the hundred, every week, until it is gone.`, "bad");
  return true;
}
function repay(d, amount){
  if(!d.loan) return 0;
  const pay = Math.min(Math.max(0, Math.floor(amount)), d.gold, owes(d));
  if(pay <= 0) return 0;
  d.gold -= pay;
  d.loan.owed -= pay;
  if(d.loan.owed <= 0.5){
    const L = loanLender(d);
    d.loan = null;
    d.flags.everBorrowed = 1;
    chron(d, `The debt to ${L.name} is closed. He is warm about it, which costs him nothing.`, "good");
  }
  return pay;
}
function loanWeek(d){
  const L = d.loan && LENDERS[d.loan.who];
  if(!L) return;
  d.loan.owed *= (1 + L.rate);
  const w = loanWeeks(d);
  /* he is patient exactly as long as he said he would be */
  if(w >= L.patience && !d.loan.warned){
    d.loan.warned = d.week;
    chron(d, `${L.name}'s man is at the gate. He does not come in. He wants you to know he was here.`, "bad");
  }
  if(w >= L.patience + 8 && d.loan.missed < 1 && owes(d) > d.loan.principal){
    d.loan.missed = 1;
    d.fame = Math.max(0, d.fame - 12);
    patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-8,0,100); }); recomputeFavor(d);
    if(d.lanista) d.lanista.health = clamp(d.lanista.health-3,0,100);
    chron(d, `Word has got round Capua that you are carrying ${L.name}'s paper. Editors are still polite. They are polite in a slightly different way.`, "bad");
  }
  if(L.hard && w >= L.patience + 16 && d.loan.missed < 2){
    d.loan.missed = 2;
    const men = activeG(d).filter(g=>!isAuctor(g)).sort((a,b)=>gladValue(b)-gladValue(a));
    const t = men[Math.floor(men.length/2)] || men[0];
    if(t){
      const worth = rnd(gladValue(t)*0.7);
      d.loan.owed = Math.max(0, d.loan.owed - worth);
      annalsClose(d, t, "sold");
      t.status = "departed"; t.fateNote = "sold";
      dropTies(d, t.id);
      d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-11,0,100); o.defiance=clamp(o.defiance+8,0,100); } });
      d.unrest = clamp(d.unrest+9,0,100);
      chron(d, `${L.name} takes ${fullName(t)} against the debt. Nobody asks you first. ${worth} denarii comes off the total and the yard watches him go through the gate with a stranger's hand on his arm.`, "bad");
    }
  }
  if(owes(d) > d.loan.principal * 4.0 || (L.hard && w >= L.patience + 30)){
    d.over = { kind:"foreclosed", lender:L.name, owed:owes(d), name:d.name };
  }
}
const canBorrow = d => !d.loan && !d.over;

/* ---- THE FACTIONS ----
   Capua was a meter. It is four constituencies now, two of which have hated each
   other since before you were born and cannot both be pleased. */
const HEAVY = ["Murmillo","Secutor"];       // the big shield
const FACTIONS = {
  parm:  { name:"The Parmularii", short:"PARM", seat:"the small shield",
    want:"A light man winning on his feet. Thraex, hoplomachus, net-man, twin blades — anything that moves.",
    opposed:"scut" },
  scut:  { name:"The Scutarii", short:"SCUT", seat:"the big shield",
    want:"A murmillo or a secutor walking a man down behind a wall of wood. They have hated the parmularii since before you were born.",
    opposed:"parm" },
  mob:   { name:"The Mob", short:"MOB", seat:"the upper tiers",
    want:"Blood, sine missione, and a crowd on its feet. They pay for the cheap seats and they are most of the noise.",
    opposed:"front" },
  front: { name:"The Front Rows", short:"FRONT", seat:"the magistrate's end",
    want:"Craft. A bout won cleanly, a man spared, technique they can discuss afterward. They are the ones with money.",
    opposed:"mob" },
};
const FAC_KEYS = Object.keys(FACTIONS);
const facOf = (d,k) => (d.factions && d.factions[k]!=null) ? d.factions[k] : 40;
const facWord = v => v>=78?"partisan" : v>=60?"warm" : v>=40?"indifferent" : v>=22?"cold" : "hostile";
const facColour = v => cbc(v>=60?"#9aa86a" : v>=40?"#b09b7d" : v>=22?"#d8ac5f" : "#d96f5d");
const isHeavy = cls => HEAVY.includes(cls);
function facMove(d, k, n){
  if(!d.factions) d.factions = { parm:40, scut:40, mob:40, front:40 };
  d.factions[k] = clamp(d.factions[k] + n, 0, 100);
  /* the shield rivalry is zero-sum; you cannot court both */
  const o = FACTIONS[k].opposed;
  if(o && n > 0) d.factions[o] = clamp(d.factions[o] - n*0.55, 0, 100);
}
function facWeek(d){
  if(!d.factions) d.factions = { parm:40, scut:40, mob:40, front:40 };
  for(const k of FAC_KEYS) d.factions[k] += (40 - d.factions[k]) * 0.014;   // memories fade
}
/* what they are worth to you */
const facTop = d => FAC_KEYS.reduce((m,k)=> facOf(d,k)>facOf(d,m) ? k : m, FAC_KEYS[0]);
const facCrowd = (d, cls) => {
  const shield = isHeavy(cls) ? "scut" : "parm";
  return (facOf(d,shield)-40)*0.22 + (facOf(d,"mob")-40)*0.10;
};
const facPurse = d => 1 + (facOf(d, facTop(d)) - 40) * 0.0035;
const facFame  = (d, cls) => 1 + (facOf(d, isHeavy(cls)?"scut":"parm") - 40) * 0.004;
/* what a bout does to them */
function facAfterBout(d, g, res, offer, tactic, choice){
  const shield = isHeavy(g.cls) ? "scut" : "parm";
  const win = res.winner === "A";
  if(win) facMove(d, shield, 3.4); else facMove(d, shield, -1.1);
  if(res.bDies) facMove(d, "mob", 4.2);
  if(offer.stakes === "sine") facMove(d, "mob", 2.6);
  if(res.crowd >= 82) facMove(d, "mob", 2.0);
  if(win && res.vA >= 72) facMove(d, "front", 3.6);
  if(res.spared && !res.bDies) facMove(d, "front", 2.4);
  if(choice === "cloth"){ facMove(d, "front", 3.0); d.flags.everCloth = (d.flags.everCloth||0)+1; }
  if(tactic === "showboat") facMove(d, "mob", 1.8);
  if(win && isFavourite(g)) facMove(d, "mob", 2.6);   /* the mob loves to watch its own win */
}

/* ---- THE CIRCUIT OF CAPUA ----
   Half the men your gladiators fought used to be generated on the spot and thrown
   away. There is a standing pool of independents now: they train, they age, they
   keep a record against you, and they remember which of your men they have met. */
const SMALL_HOUSES = ["the Ludus Pompeianus","the school at Atella","Rufio's yard","the Praenestine school",
  "the Nolan ludus","Bassus' stable","no house at all","the Suessan school"];
const CIRCUIT_SIZE = 16;
function makeCircuitMan(d, tier){
  const o = genOpponent(tier==null ? ri(0,2) : tier);
  o.id = d.nextId++;
  o.house = pick(SMALL_HOUSES);
  o.wins = ri(0,6); o.losses = ri(0,5); o.kills = ri(0,2);
  o.beatYou = 0; o.lostToYou = 0; o.killedYours = 0;
  o.age = ri(20,31);
  o.met = {};
  return o;
}
const CIRCUIT_MIX = [0,0,0,0,0,0,1,1,1,1,1,2,2,2,3,3];   // a pyramid, not a flat field
function seedCircuit(d){
  d.circuit = [];
  for(let i=0;i<CIRCUIT_SIZE;i++) d.circuit.push(makeCircuitMan(d, CIRCUIT_MIX[i % CIRCUIT_MIX.length]));
}
/* they get better, they get old, and they go the way everyone in this trade goes */
function circuitWeek(d){
  if(!d.circuit || !d.circuit.length) return;
  for(const f of d.circuit){
    f.weeks = (f.weeks||0)+1;
    if(f.weeks % 4 === 0) for(const k of CLASSES[f.cls].key) f[k] = clamp(f[k] + 0.35, 8, 96);
    if(f.weeks % WEEKS_PER_YEAR === 0){ f.age++;
      if(f.age > 30) for(const k of STATS) f[k] = Math.max(8, f[k] - 0.7); }
  }
  /* somebody always stops turning up */
  if(R() < 0.07){
    const i = Math.floor(R()*d.circuit.length);
    const gone = d.circuit[i];
    d.circuit[i] = makeCircuitMan(d, CIRCUIT_MIX[i % CIRCUIT_MIX.length]);
    if(gone.beatYou || gone.lostToYou)
      chron(d, `${gone.name} of ${gone.house} is not on any card this season. Somebody says the sand, somebody says a fever, and nobody says it twice.`, "info");
    if(d.nemesis && d.nemesis.fid===gone.id) d.nemesis = null;
  }
}
const metWord = (f, g) => { const m = f && f.met && f.met[g.id]; if(!m) return null;
  const n = m.w + m.l;
  if(!n) return null;
  const times = k => k===1 ? "once" : k===2 ? "twice" : k+" times";
  return m.w > m.l ? `He has beaten ${g.name} ${times(m.w)}.`
    : m.l > m.w ? `${g.name} has put him down ${times(m.l)}.`
    : `They have met ${times(n)} and settled nothing.`;
};
function circuitRecord(d, f, g, youWon, died){
  if(!f || !f.id) return;
  const live = (d.circuit||[]).find(x=>x.id===f.id);
  if(!live) return;
  live.met = live.met || {};
  const m = live.met[g.id] = live.met[g.id] || { w:0, l:0 };
  if(youWon){ live.losses++; live.lostToYou=(live.lostToYou||0)+1; m.l++; }
  else { live.wins++; live.beatYou=(live.beatYou||0)+1; m.w++; live.pfame=(live.pfame||0)+ri(3,7);
    if(!live.nick && live.wins>=6) live.nick = pick(NICKS); }
  if(died){ const i=(d.circuit||[]).indexOf(live); if(i>=0) d.circuit[i] = makeCircuitMan(d, CIRCUIT_MIX[i % CIRCUIT_MIX.length]); }
}
/* the whole card is drawn from men who exist */
function pickAnyOpp(d, tier){
  const bands = [[22,46],[38,60],[54,76],[66,99]];
  const avg = f => STATS.reduce((s,k)=>s+f[k],0)/6;
  const pool = (d.circuit||[]).filter(f=>{ const a=avg(f); return a>=bands[tier][0]-12 && a<=bands[tier][1]+12; });
  if(!pool.length) return { opp: genOpponent(editorBought(d) ? Math.max(0, tier-1) : tier), ref:null, known:false };
  /* somebody with a score to settle turns up more often */
  const grudged = pool.filter(f=>f.beatYou>0 || f.lostToYou>0);
  const f = (grudged.length && R()<0.55) ? pick(grudged) : pick(pool);
  const o = clone(f);
  o.kit = f.kit || kitFor(f.cls, tier);
  return { opp:o, ref:{ circuit:true, fid:f.id }, known:(f.beatYou+f.lostToYou)>0 };
}

function pickRivalOpp(d, tier){
  if(!d.rivals){ const a = pickAnyOpp(d, tier); return { opp:a.opp, ref:a.ref, rematch:false, grudgeM:false }; }
  const bands = [[22,46],[38,60],[54,76],[66,99]];
  const avg = f => STATS.reduce((s,k)=>s+f[k],0)/6;
  const pool = [];
  d.rivals.forEach(h=>{ if(h.away) return; h.fighters.forEach(f=>{ if(!f.injury) pool.push({h,f}); }); });
  let fitPool;
  if(tier===3) fitPool = pool.slice().sort((a,b)=>avg(b.f)-avg(a.f)).slice(0,3);
  else fitPool = pool.filter(p=>{ const a=avg(p.f); return a>=bands[tier][0] && a<=bands[tier][1]; });
  if(!fitPool.length) fitPool = pool;
  if(!fitPool.length){ const a = pickAnyOpp(d, tier); return { opp:a.opp, ref:a.ref, rematch:false, grudgeM:false }; }
  const rem = fitPool.filter(p=>p.f.beatYou>0);
  const chosen = (rem.length && R()<0.6) ? pick(rem) : pick(fitPool);
  return { opp: clone(chosen.f), ref:{house:chosen.h.name, fid:chosen.f.id},
    rematch: chosen.f.beatYou>0, grudgeM: chosen.f.lostToYou>0 };
}

function migrate(S){
  if(!S.rivals) S.rivals = makeRivals(S);
  if(!S.escaped) S.escaped = [];
  if(!S.gear) S.gear = {};
  if(!S.retired) S.retired = [];
  if(S.doctore===undefined) S.doctore = null;
  if(!S.doctoreMarket) S.doctoreMarket = [];
  if(S.doctoreOffer===undefined) S.doctoreOffer = null;
  if(!S.ties) S.ties = [];
  if(!S.arcs) S.arcs = [];
  if(S.nemHouse===undefined) S.nemHouse = null;
  if(S.saga===undefined) S.saga = null;
  if(!S.crest) S.crest = { c1:"#8d3b2c", c2:"#c99a4b", sym:"gladius", motto:"" };
  if(S.rome===undefined) S.rome = null;
  if(S.poach===undefined) S.poach = null;
  if(!S.defected) S.defected = [];
  if(!S.buildings) S.buildings = {};
  if(S.nemesis===undefined) S.nemesis = null;
  if(S.primus===undefined) S.primus = null;
  if(S.city===undefined) S.city = null;
  if(S.travel===undefined) S.travel = null;
  if(!S.known) S.known = {};
  if(!S.feats) S.feats = {};
  if(!S.lanista) S.lanista = makeLanista(S);
  if(S.collegium===undefined) S.collegium = null;
  if(S.war===undefined) S.war = null;
  if(!S.circuit || !S.circuit.length) seedCircuit(S);
  if(!S.factions) S.factions = { parm:40, scut:40, mob:40, front:40 };
  if(S.loan===undefined) S.loan = null;
  if(S.ear===undefined) S.ear = null;
  if(!S.heard) S.heard = [];
  S.gladiators.forEach(g=>{ if(g.regard==null) g.regard = ri(38,54); if(!g.memory) g.memory = [];
    if(g.form==null) g.form = 0; if(!g.formLog) g.formLog = []; if(g.fans==null) g.fans = 0; });
  if(!S.deadlines) S.deadlines = [];
  if(S.doctrine===undefined) S.doctrine = null;
  if(!S.kits) S.kits = [];
  if(!S.deadSteel) S.deadSteel = [];
  if(!S.bay) S.bay = { holder:null, since:0, weeks:0 };
  if(S.mark===undefined) S.mark = null;
  if(S.after===undefined) S.after = null;
  if(!S.metHouse) S.metHouse = {};
  if(!S.owed) S.owed = [];
  if(!S.household) S.household = {};
  if(!S.works) S.works = {};
  if(!S.slavers) S.slavers = {};
  if(S.pact===undefined) S.pact = null;
  if(!S.gambits) S.gambits = {};
  if(S.pendingLesson===undefined) S.pendingLesson = null;
  if(!S.law) S.law = { cap:99, tax:0, women:false, sineFee:0, damnati:false, edicts:[], heat:0, fines:0 };
  if(S.yardSeen==null) S.yardSeen = 0;
  if(S.yardMissed==null) S.yardMissed = 0;
  if(!S.pitch) S.pitch = "plain";
  (S.rivals||[]).forEach(h=>{ if(h.warm==null) h.warm = 0; });
  if(!S.charter) S.charter = { i:0, done:true, skipped:true };   // a house already underway is past this
  if(!S.rivalLog) S.rivalLog = [];
  if(!S.unburied) S.unburied = [];
  if(!S.book) S.book = newBook();
  if(S.medicus===undefined) S.medicus = null;
  if(S.armourer===undefined) S.armourer = null;
  if(!S.staffMarket) S.staffMarket = {};
  if(S.election===undefined) S.election = null;
  if(S.aedile===undefined) S.aedile = null;
  if(!S.rise) S.rise = { rank:0, standing:0 };
  S.gladiators.forEach(g=>{ if(g.sworn===undefined) g.sworn = { how:"proper", week:1, free:isAuctor(g) }; });
  if(!S.seed) S.seed = newSeedWord();
  if(S.rngState==null) S.rngState = rngGet();
  if(S.honoured==null) S.honoured = 0;
  if(S.heir===undefined) S.heir = null;
  if(S.succession===undefined) S.succession = null;
  if(!S.generation) S.generation = 1;
  if(!S.forebears) S.forebears = [];
  if(!S.gearCond) S.gearCond = {};
  if(!S.forged) S.forged = [];
  S.gladiators.forEach(g=>{ if(g.strain==null) g.strain = 0;
    if(g.regimen==="cond") g.regimen = "hill";
    if(!REGIMENS[g.regimen]) g.regimen = "palus"; });
  S.gladiators.forEach(g=>{ if(!g.wear){ g.wear = {}; SLOTS.forEach(s=>{ g.wear[s] = 100; }); } });
  if(!S.rep) S.rep = { blood:0, show:0, craft:0, mercy:0 };
  if(!S.departed) S.departed = [];
  if(S.reSignOffer===undefined) S.reSignOffer = null;
  if(!S.annals){
    S.annals = [];
    let nid = -1;
    const back = (list, fate) => (list||[]).forEach(f=>{
      S.annals.push({ id:nid--, name:f.name, nick:null, origin:"", cls:"", sex:"m", auctor:fate==="departed",
        joined:1, left:f.week, fate, age:f.age||0, wins:f.wins||0, losses:0, kills:0, pfame:0,
        scars:f.scars||0, amb:null, ambMet:false });
    });
    back(S.fallen,"dead"); back(S.freed,"freed"); back(S.escaped,"escaped");
    back(S.retired,"retired"); back(S.departed,"departed"); back(S.defected,"defected");
  }
  if(!S.flags.learned) S.flags.learned = {};
  S.gladiators.forEach(g=>{ if(!g.sex) g.sex = "m"; if(!g.ambition) giveAmbition(S, g); });
  (S.market||[]).forEach(g=>{ if(!g.ambition) giveAmbition(S, g); });
  if(S.romeOffer===undefined) S.romeOffer = null;
  if(!S.patrons || !S.patrons.length){
    S.patrons = [makePatron(S,"magistrate"), makePatron(S,"merchant")];
    const seed = clamp(S.favor||30, 10, 90);          // an existing house keeps the standing it earned
    S.patrons.forEach(p=>{ p.favor = clamp(seed + ri(-8,8), 0, 100); });
  }
  S.gladiators.forEach(g=>{
    if(!g.regimen){ g.regimen = g.focus==="rest" ? "rest" : "palus"; }
    if(g.focus==="rest") g.focus = CLASSES[g.cls] ? CLASSES[g.cls].key[0] : "str";
    if(g.sparWith===undefined) g.sparWith = null;
  });
  S.gladiators.forEach(g=>{
    if(!g.scars) g.scars = [];
    if(!g.scarCap) g.scarCap = {};
    if(g.weeksAged==null) g.weeksAged = 0;
    if(g.age==null) g.age = ri(20,28);
  });
  S.gladiators.forEach(g=>{ if(!g.kit) g.kit = defaultKit(g.cls); });
  (S.market||[]).forEach(g=>{ if(!g.kit) g.kit = defaultKit(g.cls); });
  (S.rivals||[]).forEach(h=>h.fighters.forEach(f=>{ if(!f.kit) f.kit = defaultKit(f.cls); }));
  if(S.rebellion===undefined) S.rebellion = null;
  if(!S.ver || S.ver<16) S.ver = 16;
  return S;
}

function newGameState(name, scen, seed, pitch){
  const sw = (seed && String(seed).trim()) ? String(seed).trim().toUpperCase() : newSeedWord();
  rngSet(seedToNum(sw));
  const S = SCENARIOS[scen] || SCENARIOS.clean;
  const d = { ver:16, nextId:1, name, week:1, gold:S.gold, fame:S.fame, favor:0, unrest:S.unrest, trainMult:1,
    gladiators:[], market:[], games:null, pendingEvent:null, log:[], fallen:[], freed:[],
    seed: null, rngState: 0,
    lastParty:-9, lastFeast:-9, over:null, milestone600:false, flags:{learned:{}}, escaped:[], rebellion:null, gear:{}, retired:[],
    doctore:null, doctoreMarket:[], doctoreOffer:null, ties:[], patrons:[], rome:null, romeOffer:null, poach:null, defected:[], nemesis:null, nemHouse:null, saga:null, arcs:[], crest:{ c1:"#8d3b2c", c2:"#c99a4b", sym:"gladius", motto:"" }, primus:null, city:null, travel:null, known:{}, feats:{}, lanista:null, collegium:null, war:null, circuit:[], factions:{parm:40,scut:40,mob:40,front:40}, loan:null, ear:null, heard:[], works:{}, slavers:{}, pact:null, gambits:{}, pendingLesson:null, law:null, doctrine:null, kits:[], deadSteel:[], bay:null, mark:null, after:null, metHouse:{}, owed:[], household:{}, yardSeen:0, yardMissed:0, deadlines:[], rivalLog:[], unburied:[], honoured:0, book:null, medicus:null, armourer:null, staffMarket:{}, election:null, aedile:null, heir:null, succession:null, generation:1, forebears:[], buildings:{}, gearCond:{}, forged:[], rep:{blood:0,show:0,craft:0,mercy:0}, departed:[], reSignOffer:null, annals:[], rise:{ rank:0, standing:0 } };
  d.rivals = makeRivals(d);
  const solo = S.men.length === 1;
  S.men.forEach((band,i)=>{
    const g = genGladiator(d, ri(band[0], band[1]));
    /* the racks hold what you were left, and you were not left much */
    if(solo){ d.gear = Object.assign({}, d.gear); SLOTS.forEach(s=>{ const id = defaultKit(g.cls)[s];
      if(GEAR[id] && GEAR[id].price>0) d.gear[id] = (d.gear[id]||0)+1; }); g.kit = defaultKit(g.cls); }
    else { const w = defaultKit(g.cls).weapon;
      d.gear[w] = (d.gear[w]||0)+1;
      g.kit = bareKit(g.cls); }
    if(S.legendFirst && i===0){ g.legend = true; g.nick = pick(NICKS); g.wins = ri(6,10); g.pfame = ri(55,80);
      if(!g.traits.includes("Defiant")) g.traits.push("Defiant"); g.defiance = clamp(g.defiance+20,0,100); }
    if(S.old){ g.age = ri(30,34); g.potential = clamp(g.potential-18, 20, 70);
      for(const k of ["tec","dis"]) g[k] = clamp(g[k]+6, 8, 95);
      const n = ri(1,3); for(let j=0;j<n;j++) addScar(g, pick(TARGETS)[0], R()<0.4); }
    if(S.defiant){ g.defiance = clamp(g.defiance+26, 0, 100); g.morale = clamp(g.morale-14, 0, 100); }
    d.gladiators.push(g);
  });
  if(S.buildings) d.buildings = Object.assign({}, S.buildings);
  d.scenario = scen || "clean";
  d.seed = sw;
  d.charter = { i:0, done:false, skipped:false };
  d.pitch = pitch || "plain";
  d.gold = Math.max(60, d.gold + pit(d, "start", 0));
  d.gladiators.forEach(g=>{ g.sworn = { how:"proper", week:1, free:false }; });
  d.rngState = rngGet();
  d.lanista = makeLanista(d);
  seedCircuit(d);
  makeMarket(d);
  makeDoctoreMarket(d);
  d.patrons = [makePatron(d,"magistrate"), makePatron(d,"merchant")];
  recomputeFavor(d);
  chron(d, `${S.name}. ${S.blurb}`);
  return d;
}

/* ================= FIGHT ENGINE ================= */

/* ---- WHAT EACH STYLE ACTUALLY DOES ----
   Six classes that fought identically with different numbers. A signature is one
   move per style that behaves differently from a plain exchange — its own odds,
   its own payoff, and its own way of going wrong. */
const SIGNATURES = {
  Retiarius: { move:"cast", odds:0.28, name:"the cast",
    win:{ dmg:1.9, stam:14, crowd:9 }, fail:{ selfStam:16, guard:0.72, crowd:4 },
    hit:(a,b)=>`${a} puts the net over ${b} and drags him off his feet.`,
    miss:(a,b)=>`The net goes out and comes back empty. ${a} is a man with a stick until he has gathered it.` },
  Dimachaerus:{ move:"flurry", odds:0.34, name:"the flurry",
    win:{ dmg:1.7, stam:10, crowd:8 }, fail:{ selfStam:10, guard:0.76, crowd:3 },
    hit:(a,b)=>`Both blades land inside a heartbeat and ${b} cannot answer either of them.`,
    miss:(a,b)=>`${a} comes on with both and finds nothing, and there is nothing in either hand to hide behind.` },
  Murmillo:  { move:"bash", odds:0.42, name:"the shield",
    win:{ dmg:1.2, stam:6, crowd:4, stagger:1 }, fail:{ selfStam:9, guard:0.9, crowd:1 },
    hit:(a,b)=>`${a} walks straight through him behind the shield and ${b} gives ground he will not get back.`,
    miss:(a,b)=>`${a} leans into the shield and ${b} is simply not there any more.` },
  Secutor:   { move:"shove", odds:0.40, name:"the press",
    win:{ dmg:1.15, stam:8, crowd:3, stagger:1 }, fail:{ selfStam:10, guard:0.88, crowd:1 },
    hit:(a,b)=>`${a} closes it down and keeps closing until ${b} has nowhere to put his feet.`,
    miss:(a,b)=>`${a} drives forward into empty sand and has to turn, which costs him.` },
  Thraex:    { move:"hook", odds:0.33, name:"the hook",
    win:{ dmg:1.5, stam:7, crowd:6 }, fail:{ selfStam:9, guard:0.78, crowd:2 },
    hit:(a,b)=>`The sica comes round the shield rim the way it was made to and finds what is behind it.`,
    miss:(a,b)=>`${a} reaches round the shield and leaves his own side open doing it.` },
  Hoplomachus:{ move:"lunge", odds:0.31, name:"the reach",
    win:{ dmg:1.45, stam:6, crowd:5 }, fail:{ selfStam:11, guard:0.75, crowd:2 },
    hit:(a,b)=>`${a} takes him at the full length of the spear, from a distance ${b} cannot answer.`,
    miss:(a,b)=>`The lunge falls short and ${a} is a long way forward with a long weapon.` },
};
const sigOf = cls => SIGNATURES[cls] || null;
/* a man goes for it when he is winning, or when he is desperate */
function triesSignature(g, mom, stam, tac){
  const S = sigOf(g.cls); if(!S) return false;
  let p = S.odds;
  p *= tac==="aggressive" ? 1.35 : tac==="defensive" ? 0.5 : 1;
  if(mom > 0) p *= 1.2;
  if(stam < 30) p *= 0.6;
  p *= 0.85 + (g.tec||50)/330;
  return R() < clamp(p, 0.04, 0.7);
}

const ATTACKS = {
  Murmillo:[["thrust","drives the gladius in a short brutal thrust"],["bash","hammers forward from behind the great shield"],["chop","brings the blade down in a butcher's arc"]],
  Thraex:[["slash","whips the sica around the guard"],["hook","hooks the curved blade past the shield rim"],["cut","carves a quick diagonal"]],
  Hoplomachus:[["lunge","lunges the spear out at full reach"],["jab","stabs short and fast, twice"],["sweep","sweeps the shaft low at the legs"]],
  Secutor:[["thrust","punches the blade through the gap"],["shove","drives shield-first, relentless"],["stab","stabs over the shield rim"]],
  Retiarius:[["cast","flicks the net out like a striking snake"],["trident","drives the three points forward"],["dart","darts inside the reach and away again"]],
  Dimachaerus:[["cross","scissors both blades across the guard"],["flurry","comes on in a blur of two edges"],["offhand","feints high and buries the off-hand blade low"]],
};
const TARGETS = [["arm",[70,54],1],["shoulder",[56,42],1.05],["thigh",[54,96],1.1],["flank",[52,68],1.15],["brow",[56,26],1.25],["hand",[76,60],0.9]];
const CLASH_L = [
  (a,b)=>`Steel screams on steel — neither ${a} nor ${b} yields a hand's breadth.`,
  (a,b)=>`They circle, testing, sand grinding under their heels.`,
  (a,b)=>`Shields crash together and spring apart. The crowd rumbles.`,
  (a,b)=>`${a} feints; ${b} does not buy it. Nothing given, nothing taken.`,
];
const INJ_BY_TARGET = { brow:"Split brow", shoulder:"Gashed shoulder", thigh:"Torn thigh", flank:"Cracked ribs", arm:"Gashed shoulder", hand:"Mangled hand" };
function injuryFor(target, severe){
  const want = severe && (target==="flank") ? "Pierced side" : INJ_BY_TARGET[target];
  const found = INJURIES.find(i=>i[0]===want);
  const inj = found || pick(INJURIES);
  return { name:inj[0], weeks:inj[1], pen:inj[2], part:target };
}

function power(f, tactic, oppCls, mom, atkMod){
  const pen = f.injury ? f.injury.pen : 0;
  const e = k => Math.max(5, f[k]-pen);
  const ft = f.footing||1;
  let p = e("tec")*1.25*(0.5+ft*0.5) + e("str") + e("agi")*0.85*ft*ft + e("dis")*0.3;
  p *= 0.85 + (f.morale/100)*0.3;
  { const ft = clamp(f.fatigue,0,100);
    p *= 1 - (ft<=45 ? ft/560 : (45/560 + (ft-45)/230)); }
  if(COUNTERS[f.cls]===oppCls) p *= 1.12;
  if(tactic==="aggressive") p *= 1.13;
  if(tactic==="defensive") p *= 0.9;
  if(tactic==="showboat") p *= 0.96;
  p *= 1 + clamp(mom||0,-3,3)*0.03;
  p *= 1 + (f.mods ? f.mods.atk*0.6 + f.mods.def*0.30 : 0);
  p *= f.regardMult || 1;
  p *= atkMod||1;
  return p;
}

function simulateFight(A, B, tA, stakes, ctx, opts){
  const O = opts || {};
  const R0 = O.from || null;
  const tB = R0 ? R0.tB : pick(["aggressive","measured","defensive"]);
  const beats = [];
  A.mods = kitMods(A.kit, A.cls, A); B.mods = kitMods(B.kit, B.cls, B);
  const smA = 55+A.end*0.6, smB = 55+B.end*0.6;
  let crowd = R0 ? R0.crowd : clamp(12 + (A.sho+B.sho)/8 + (A.traits.includes("Showman")?8:0) + (A.mods.sho+B.mods.sho)*22
    + ((A.scars?A.scars.length:0) + (B.scars?B.scars.length:0))*1.2
    + (isF(A)?9:0) + (isF(B)?6:0) + (ctx.repShow||0), 0, 100);
  let vA = R0 ? R0.vA : 100, vB = R0 ? R0.vB : 100;
  let sA = R0 ? R0.sA : smA, sB = R0 ? R0.sB : smB, mom = R0 ? R0.mom : 0;
  let tiredA = R0? R0.tiredA : false, tiredB = R0? R0.tiredB : false,
      c50 = R0? R0.c50 : false, c80 = R0? R0.c80 : false;
  let bLegged = R0 ? !!R0.bLegged : false;      /* his legs have been worked — a lasting thing */
  const cruxCount = R0 ? (R0.count||0) : 0;      /* how many times you have spoken already */
  const order = O.order || null;                 /* the tactical order you gave at the last crux */
  let orderSigA = !!(order && order.sig);        /* force your man's signature on the first resumed round */
  const orderTgt = order && order.target || null;/* aim your blows at one place */
  if(order && order.breather){ sA = Math.min(smA, sA + smA*0.24); mom = clamp(mom-1,-3,3); crowd = clamp(crowd-6,0,100); }
  if(order && order.debuff==="legs") bLegged = true;
  let aDies=false, bDies=false, fell=false, winner=null, ended=false, lastTarget="flank", spared=false;
  const takeMult = t => t==="aggressive"?1.12 : t==="defensive"?0.82 : t==="showboat"?1.08 : 1;
  const oppName = B.nick? `${B.name}, ${B.nick}` : B.name;
  const prA = PR(A), prB = PR(B);
  let round = R0 ? R0.round : 0;
  const push = (kind, text, extra) => beats.push(Object.assign({
    kind, text, actor:null, round,
    vA:clamp(vA,0,100), vB:clamp(vB,0,100),
    sA:clamp(sA/smA*100,0,100), sB:clamp(sB/smB*100,0,100),
    crowd:clamp(crowd,0,100), mom:clamp(mom,-3,3)
  }, extra||{}));

  if(!R0){
    push("intro", `${A.name} steps onto the sand against ${oppName} of the House of ${B.house} — a ${B.cls.toLowerCase()} of ${B.origin} blood.`);
    push("salute", `They turn to the editor's box, raise their arms, and salute. Then the horn.`);
    if(COUNTERS[A.cls]===B.cls) push("intro", `The pairing favours your fighter: ${A.cls} against ${B.cls}.`);
    else if(COUNTERS[B.cls]===A.cls) push("intro", `An ill pairing — the ${B.cls.toLowerCase()} was made to break the ${A.cls.toLowerCase()}.`);
    if(stakes==="sine") push("intro", `The lanistae have agreed: sine missione. No mercy will be asked, and none given.`);
  } else push("crux", O.resumeLine || `${A.name} hears you and answers.`);

  /* the moments the bout is in the balance and a word from the box would matter. it
     comes round more than once now — up to three times — with a beat or two between,
     so a fight is coached, not decided by one call. */
  const lastCruxR = R0 ? (R0.round||0) : -99;
  const cruxNow = r => O.stopAtCrux && !ended && stakes!=="blood"
    && cruxCount < 3 && r>=3 && r<=11 && (r-lastCruxR)>=2 && (vA<=82 || vB<=78);
  let crux = null;
  const startR = R0 ? R0.round : 0;

  for(let r=startR+1; r<=12 && !ended; r++){
    round = r;
    const moveA = pick(ATTACKS[A.cls]), moveB = pick(ATTACKS[B.cls]);
    const modA = 0.97+R()*0.06, modB = 0.97+R()*0.06;
    A.footing = ctx.footing || 1; B.footing = ctx.footing || 1;
    const PL = ctx.plan || { pow:1, stam:1, guard:1 };
    const pA = power(A,tA,B.cls,mom,modA) * PL.pow * (0.72+R()*0.56) * (sA<22?0.78:1) * (A.sigOpen||1) * (round>=6 ? (A.lastLate||1) : 1);
    const pB = power(B,tB,A.cls,-mom,modB) * (0.72+R()*0.56) * (sB<22?0.78:1) * (B.sigOpen||1) * (bLegged?0.9:1);
    A.sigOpen = 1; B.sigOpen = 1;
    sA -= (tA==="aggressive"?9:7) * (1 - A.mods.spd*0.5) * PL.stam * (A.formStam||1) * (ctx.sky||1) * (A.lastStam||1);
    sB -= (tB==="aggressive"?9:7) * (1 - B.mods.spd*0.5) * (bLegged?1.25:1);
    /* one of them may go for the thing his style is for — or you may have ordered it */
    const forcedSig = orderSigA; orderSigA = false;
    const sigTurn = (()=>{
      let aGo = triesSignature(A, mom, sA, tA);
      const bGo = triesSignature(B, -mom, sB, tB);
      if(forcedSig && sigOf(A.cls)) aGo = true;
      if(!aGo && !bGo) return null;
      const isA = aGo && (!bGo || forcedSig || pA >= pB);
      return { isA, g:isA?A:B, foe:isA?B:A, S:sigOf((isA?A:B).cls) };
    })();
    if(sigTurn && sigTurn.S){
      const { isA, g, foe, S } = sigTurn;
      const edge = (isA ? pA-pB : pB-pA) / 60;
      const landed = R() < clamp(0.42 + edge*0.5 + (g.tec-50)/300 + (isA&&forcedSig?0.12:0), 0.16, 0.9);
      if(landed){
        const tgt = pick(TARGETS);
        let dmg = (5 + Math.abs(pA-pB)/9 + g.str/14) * S.win.dmg * tgt[2] * (1 + g.mods.atk*0.7) * (1 - foe.mods.def);
        dmg = Math.max(3, dmg);
        if(isA){ vB = clamp(vB-dmg,0,100); sB -= S.win.stam; mom = clamp(mom+1,-3,3); lastTarget = tgt; }
        else   { vA = clamp(vA-dmg,0,100); sA -= S.win.stam; mom = clamp(mom-1,-3,3); lastTarget = tgt; }
        crowd = clamp(crowd + S.win.crowd, 0, 100);
        push("crit", S.hit(g.name, foe.name), { sig:S.move, target:tgt });
      } else {
        if(isA){ sA -= S.fail.selfStam; A.sigOpen = S.fail.guard; mom = clamp(mom-1,-3,3); }
        else   { sB -= S.fail.selfStam; B.sigOpen = S.fail.guard; mom = clamp(mom+1,-3,3); }
        crowd = clamp(crowd + S.fail.crowd, 0, 100);
        push("graze", S.miss(g.name, foe.name), { sig:S.move });
      }
      round++;
      continue;
    }
    const diff = Math.abs(pA-pB);
    if(diff < 7){
      crowd = clamp(crowd+2,0,100);
      mom = mom>0? mom-1 : mom<0? mom+1 : 0;
      push("clash", pick(CLASH_L)(A.name, B.name));
    } else {
      const atkIsA = pA>pB;
      const atk = atkIsA?A:B, def = atkIsA?B:A;
      const move = atkIsA?moveA:moveB;
      const tgt = (atkIsA && orderTgt) ? (TARGETS.find(t=>t[0]===orderTgt) || pick(TARGETS)) : pick(TARGETS);
      let dmg = 5 + diff/9 + atk.str/14;
      dmg *= takeMult(atkIsA?tB:tA) * tgt[2];
      if(ctx.guarded && atkIsA===false) dmg *= 0.44;
      if(!atkIsA) dmg *= PL.guard;
      dmg *= 1 + atk.mods.atk*0.7;
      dmg *= 1 - def.mods.def;
      dmg = clamp(dmg, 3, 32);
      if(atkIsA) vB -= dmg; else vA -= dmg;
      mom = clamp(mom + (atkIsA?1:-1), -3, 3);
      crowd = clamp(crowd + dmg/2.6 + atk.sho/22 + atk.mods.sho*14 + (tA==="showboat"&&atkIsA?3:0), 0, 100);
      lastTarget = tgt[0];
      const kind = dmg>=18?"crit" : dmg>=10?"hit":"graze";
      const txt = dmg>=18 ? `${atk.name} ${move[1]} — ${def.name}'s ${tgt[0]} opens wide and the crowd ROARS!`
        : dmg>=10 ? `${atk.name} ${move[1]}; blood springs from ${def.name}'s ${tgt[0]}!`
        : `${atk.name} ${move[1]}. The edge only kisses ${def.name}'s ${tgt[0]}.`;
      push(kind, txt, { actor: atkIsA?"A":"B", dmg:rnd(dmg), target:tgt[0], tx:tgt[1][0], ty:tgt[1][1], move:move[0] });
      if(stakes==="blood" && dmg>=8){
        winner = atkIsA?"A":"B"; ended = true;
        push("end", `Blood is drawn — the bout is called. ${atk.name} stands the victor.`);
        break;
      }
    }
    if(sA<22 && !tiredA){ tiredA=true; push("gas", `${A.name}'s arms grow heavy; breath comes ragged.`, {actor:"A"}); }
    if(sB<22 && !tiredB){ tiredB=true; push("gas", `${B.name} is flagging — sweat and blood in ${prB.his} eyes.`, {actor:"B"}); }
    if(crowd>=50 && !c50){ c50=true; push("crowd", `The crowd begins to chant — the sound rolls around the walls.`); }
    if(crowd>=80 && !c80){ c80=true; push("crowd", `CAPUA IS ON ITS FEET!`); }
    if(vA<=20 || vB<=20) break;
    if(cruxNow(r)){
      crux = { vA, vB, sA, sB, crowd, mom, round:r, tB, tiredA, tiredB, c50, c80, count:cruxCount+1, bLegged };
      push("crux", vA<=58 && vA<vB
        ? `${A.name} is hurt and going backwards. The crowd is looking at your box.`
        : vB<=58 && vB<vA
        ? `${B.name} is badly used and giving ground. There is a bout here to be taken.`
        : `Neither of them has an answer yet, and both are tiring. The crowd is looking at your box.`);
      break;
    }
  }
  if(crux) return { beats, crux, unfinished:true };

  if(!ended){
    if(vA<=20 && vB<=20){ winner = vA>=vB?"A":"B"; fell=true; push("fall", `Both men are ruined — but ${winner==="A"?B.name:A.name} falls first!`, {actor:winner==="A"?"B":"A"}); }
    else if(vA<=20){ winner="B"; fell=true; push("fall", `${A.name} falls to the sand!`, {actor:"A"}); }
    else if(vB<=20){ winner="A"; fell=true; push("fall", `${B.name} falls to the sand!`, {actor:"B"}); }
    else {
      winner = (100-vB) >= (100-vA) ? "A" : "B";
      push("end", `The horn sounds with both still standing. The editor weighs the blood spilt — and raises his hand toward ${winner==="A"?A.name:oppName}.`);
    }
  }

  if(fell && stakes!=="blood"){
    const loserIsA = winner==="B";
    if(stakes==="sine"){
      if(loserIsA){ aDies=true; push("death", `${B.name} finishes it without ceremony. ${A.name} of your house is dead.`, {actor:"A"}); }
      else { bDies=true; push("death", `${A.name} does what was agreed. ${B.name} will not rise.`, {actor:"B"}); }
    } else if(loserIsA){
      push("appeal", `${A.name} raises two fingers — the appeal. The arena holds its breath...`, {actor:"A"});
      const pat = ctx.patron;
      const lean = pat ? pat.favor*0.12 : 0;
      const spare = crowd*0.33 + A.pfame*0.3 + ctx.favor*0.5 + (ctx.fav||0) + A.sho*0.2 + A.heart*0.1 + (100-vB)*0.15 + lean
        + (ctx.guarded?12:0) + R()*22 - (ctx.tier===0?8:0) - (ctx.hostile?18:0) - (ctx.strange||0) + (ctx.aedile||0) + (ctx.venue||0) + (ctx.doctrine||0);
      if(spare>=42){
        spared = true;
        push("spared", pat && pat.favor>=70
          ? `${pat.name} raises a hand from the editor's box before the crowd has finished deciding. MISSIO — ${prA.he} is spared, and every lanista in Capua saw who spoke for you.`
          : `MISSIO. The editor's hand opens. ${prA.He} is spared — carried bleeding from the sand.`, {actor:"A"}); }
      else { aDies=true; push("death", `The thumb turns. The blow falls true. ${A.name} dies as gladiators die — on the sand, before the crowd.`, {actor:"A"}); }
    } else {
      push("appeal", `${B.name} raises two fingers in appeal...`, {actor:"B"});
      if(crowd>62 && R()<0.55){ bDies=true; push("death", `The crowd howls for blood, and the editor grants it. ${A.name} sends ${prB.him} across the river.`, {actor:"B"}); }
      else { spared = true; push("spared", `Missio — the beaten fighter is spared, and the crowd salutes your victor.`, {actor:"B"}); }
    }
  }

  return { beats, winner, crowd, fell, vA, vB, aDies, bDies, lastTarget, spared };
}

/* ---- LESSONS ----
   The old man who keeps the gate has seen four lanistae come and go. He offers
   what he knows, once, on the tab where it is any use, and then leaves you to it. */
const LESSONS = [
  { id:"loop", tab:"ludus", title:"The Week",
    text:"A week is all you get at a time. Set what each man does, take what fights you want, spend what you dare — then end it. Everything happens at once when you do: training, wounds mending, the rivals moving, the coin going out." },
  { id:"unrest", tab:"ludus", title:"The Fire in the Cells",
    text:"Watch that red bar more closely than the gold. People who are worked, whipped and buried get to talking. Feasts, victories and freedom cool it. If it reaches its height, none of the rest of this matters." },
  { id:"men", tab:"men", title:"They Are Not Numbers",
    text:"Everyone here has an origin, a temper and a ceiling you cannot see. Bearing tells you how much fire is in them — the best fighters carry the most, which is the whole problem with owning them." },
  { id:"regimen", tab:"men", title:"The Palus and the Pair",
    text:"Post work is safe and slow. Sparring is far faster, and a man learns most from someone better than himself — but partners get hurt, and two men who hate each other will go too hard. Conditioning builds wind and sheds fatigue. Rest mends." },
  { id:"arena", tab:"arena", title:"Stakes",
    text:"First blood ends at the first real wound and nobody dies. To surrender leaves it to the editor and the crowd. To the death is exactly that. The pits are always open and pay badly; the games come every third week once anyone has heard of you." },
  { id:"bets", tab:"arena", title:"The Bookmakers",
    text:"You may lay coin on your own fighter, or against them. Against means they are told to go down — and they will know you asked, whatever the crowd sees. The familia remembers that longer than the whip." },
  { id:"armory", tab:"armory", title:"Steel and Style",
    text:"Standard kit is always free on the racks. Bought pieces arm one man at a time. Gear outside a man's own style still works, but clumsily — a net-man in a legionary's shield is worse than useless." },
  { id:"market", tab:"market", title:"The Slaver's Block",
    text:"Age is most of the price. A fighter is in their prime from 23 to 28; before that they are still growing, after it they start giving pieces back. Veterans come cheap, already scarred, and already schooled." },
  { id:"villa", tab:"villa", title:"Those Who Watch",
    text:"Favor is not a number you bank — it is what four particular Romans think of you. Keep one of them warm and he leans on the editor when your man is in the sand. Let them all go cold and you will notice at the worst moment." },

  /* ---- everything the house grew after the first nine lessons were written ---- */
  { id:"agenda", tab:"ludus", title:"What Wants Answering",
    when:d=>d.week>=2,
    text:"That list at the top is the only part of this screen you have to read. It is everything with your name on it this week, worst first, and each line will put you where the answer is. When it says now, it means this week and not the next one." },
  { id:"season", tab:"ludus", title:"The Year Turns",
    when:d=>d.week>=10,
    text:"Eighteen weeks to a year, and the weather in them is not decoration. Spring is when a man learns fastest. Summer is the season of games and the sand burns anyone who goes down on it. Autumn brings the harvest money and the best purses you will see. Winter shuts the sand, costs you four denarii a man extra, and mends wounds faster than any other season, because there is nothing else for anybody to do." },
  { id:"book", tab:"ludus", title:"What The House Has Done",
    when:d=>(d.book&&d.book.n)>=25,
    text:"The record book keeps everything: which style has actually served you, which stakes you should stop accepting, which of the three great houses is quietly taking you apart. Most lanistae have a feeling about these things. You can have the number." },
  { id:"heir", tab:"ludus", title:"After You",
    when:d=>d.lanista && (d.lanista.age>=48 || d.lanista.health<55),
    text:"You are not a permanent fixture. Age, a house on the edge of fire, and every man you bury take something out of you, and when it runs out the school is sold off in pieces the morning after — unless you have put a name to it. A son, a nephew, or the doctore you freed. They inherit the men and the debts and none of your reputation." },

  { id:"drills", tab:"men", title:"The Week's Work",
    text:"Eight things a man can do with his week, and none of them are free. The weights build strength half again as fast and take his speed. The hill works the tiredness out of him instead of in. Sparring teaches him whatever his partner is better at, which is not always what you picked. And watch the strain: it is the deep tiredness a night does not touch, it eats what he gains, and only rest takes it off." },
  { id:"regard", tab:"men", title:"What He Makes Of You",
    when:d=>activeG(d).some(g=>(g.memory||[]).length>0),
    text:"He is keeping a list. The bout you stopped to save him, the promise you kept, the brother you freed — and the brother you sold, the wound you sent him out on, the night you left him on the sand until he had to finish one of his own. A man who would follow you anywhere fights measurably harder and cannot be bought at any price. One who hates you will one day sit down and not get up." },
  { id:"form", tab:"men", title:"Lately",
    when:d=>activeG(d).some(g=>Math.abs(formOf(g))>=24),
    text:"Form is the four weeks between his last bout and his next. Three straight wins and he walks out expecting to win; carried off twice and he has not been right since. It is a small thing and it fades inside a month, but it is the difference between sending him out now and sending him out later." },
  { id:"refusal", tab:"men", title:"A Man Who Sits Down",
    when:d=>activeG(d).some(g=>refusing(g)) || activeG(d).some(g=>regardOf(g)<=26),
    text:"Sooner or later one of them will not go out, and the reason will be something you did. Open his page in the familia and settle it there — any week, not just the day it starts. The whip works and costs you every other man in the room. Talking is free and unreliable and depends entirely on what you have been to him. Giving him the thing he wanted works outright. And leaving him where he is teaches the whole block that sitting down can be survived." },

  { id:"stands", tab:"arena", title:"Four Crowds, Not One",
    when:d=>d.fame>=60,
    text:"Capua is not one crowd. The parmularii want the small shield, the scutarii want the big one, and they have hated each other since before you were born — you cannot please both. The mob in the upper tiers wants blood; the front rows want craft and can afford to. Whoever is warmest to you sets the purses you are offered." },
  { id:"venue", tab:"arena", title:"Where It Happens",
    when:d=>d.fame>=40,
    text:"The ground decides who you should send. A magistrate's courtyard is marble and favours a quick man; a field cut outside the walls is turf and favours a heavy one. It is on every offer before you commit, and it is worth reading." },
  { id:"watch", tab:"arena", title:"A Week To Look At Him",
    when:d=>d.games && d.games.offers && d.games.offers.length>0,
    text:"You can pay to have an opponent watched before the bout. What comes back is specific: that he is blowing by the sixth, that he drops his arm every time he lands one, that he has almost no bouts behind him. Then pick a plan against what you were told. Read him right and it is worth seven bouts in a hundred; read him wrong and it costs five." },
  { id:"circuit", tab:"arena", title:"Down The Bay",
    when:d=>d.fame>=150,
    text:"Three towns will have you: Pompeii wants blood, Neapolis knows the styles, Puteoli has money and nothing to spend it on. Nothing you built here travels with you — the editor there weighs what he has seen himself, and a man of yours who falls in front of a town that has never heard of him is spared about half the time. Win there enough and they learn the name." },

  { id:"lenders", tab:"villa", title:"Three Men With Coin",
    when:d=>d.gold<400,
    text:"Novius Gratus is cheap because he does not need to argue and he collects in gladiators. Titus Murena is dear and unhurried and never touches your men. Scaeva lends to anybody at a price that explains why. It compounds every week, it is entirely survivable if you pay it down, and it is very hard to stop taking once you have started." },
  { id:"aedile", tab:"villa", title:"The Man Who Runs The Games",
    when:d=>!!d.election || !!d.aedile,
    text:"Once a year Capua elects the aedile, and the aedile decides whose men are on the card, what they are paid, and whether anyone leans forward when one of them is down. You can back a candidate quietly, or openly with your name on the list, or stay out of it. Back the winner and you have the games for a year. Back the loser and he knows exactly whose name was on the other list." },
  { id:"collegium", tab:"villa", title:"A Stone With His Name",
    when:d=>d.week>=14,
    text:"Three denarii a week per man puts the house into a burial society. It never wins you a bout. What it does is halve what a death costs the cells, because men who know what happens to them afterward take a burial differently. It is the easiest line to cut in a bad month, and stopping it after men have gone into the ground under it costs double what stopping it before does." },
  { id:"munera", tab:"villa", title:"Games For Your Own Dead",
    when:d=>(d.unburied||[]).some(m=>!m.done),
    text:"Funeral games are what a rich man's sons stage at his tomb. Nobody has ever staged them for a gladiator. You have six weeks to burn a fire at the gate with his name said aloud, or put on a full card at your own expense — or do nothing, which costs no money and which the men notice more than either of the others." },

  { id:"scout", tab:"market", title:"The Seller's Version",
    text:"Those numbers are what the man selling him says. He overstates a sound man by about two points a stat and a flawed one by twice that, and roughly a third of the block has something wrong with it — an old wound, a spirit already broken, a temper sold twice in a year. Your doctore narrows the range. Paying to have him looked over gives you the number and names the problem." },
  { id:"staff", tab:"market", title:"The Men In The Rooms",
    when:d=>BKEYS.some(k=>bLevel(d,k)>0),
    text:"The infirmary and the armoury are rooms. What matters is who is standing in them. A good medicus mends faster and keeps a wound from setting badly; a good armourer makes steel cheaper, longer-lasting and quicker to repair. Both will leave — one if you fill his table every week, the other if you pay him late twice — and a rival with a grudge can buy either out from under you." },

  { id:"wear", tab:"armory", title:"Steel Does Not Last",
    when:d=>d.gladiators.some(g=>SLOTS.some(s=>wears(GEAR[g.kit&&g.kit[s]]))),
    text:"House stock is maintained and lasts forever. Bought steel wears every bout and eventually breaks in the middle of one. Watch the condition, have it mended before it goes, and remember that a fine blade at nothing left is worse than the plain one on the rack." },
];
const lessonFor = (d, tab) => LESSONS.find(l => {
  if(l.tab!==tab || (d.flags.learned||{})[l.id]) return false;
  if(!l.when) return true;
  try { return !!l.when(d); } catch(e){ return false; }
});

/* ---- THE MEDICUS ----
   A wound is no longer a countdown. Let it mend, buy the surgeon, or send him out
   on it and find out what that costs. */
const CARE = {
  rest:    { name:"Let it mend",  desc:"The slow way. He is off the sand until it closes." },
  convalesce: { name:"Full convalescence", desc:"Bed, broth and no hurry. Slower to heal, but he rises clean — scars and lasting hurts rarely take hold, and his spirits mend with him." },
  surgeon: { name:"The surgeon",  desc:"Cut, cleaned and stitched properly. Halves the time and most of the scarring." },
  through: { name:"Work him through it", desc:"He fights and trains on it. The wound does not close, and it may set badly." },
};
const surgeonFee = (d, inj) => rnd((55 + inj.pen*14) * [1, 0.85, 0.75, 0.65][bLevel(d,"valetudinarium")]);

/* ---- THE LUDUS ITSELF ----
   Five things you can build, three levels each. Every one is a standing cost that
   changes a rate rather than adding a resource — the house becomes a shape you can see. */
const BUILDINGS = {
  valetudinarium: { name:"Valetudinarium", short:"Medicus' room",
    desc:"A clean room, a table, and someone who has done this before.",
    levels:["A corner of the store room and a bucket.","A proper table, boiled linen, a Greek who knows the trade.","Bright, aired, and better appointed than most physicians in Capua."],
    cost:[420, 950, 1900], upkeep:[4, 9, 15] },
  balneae: { name:"Balneae", short:"Bath house",
    desc:"Hot water at the end of a day at the post is worth more than a speech.",
    levels:["A trough and a brazier.","Two rooms, hot and cold, and a slave to tend the fire.","Hypocaust, oil, and a masseur. The familia talks about it in the market."],
    cost:[380, 880, 1750], upkeep:[4, 8, 14] },
  carceres: { name:"Carceres", short:"The cells",
    desc:"Men who sleep dry and separate wake up less certain about the wall.",
    levels:["Straw, and a door that mostly shuts.","Boards off the floor, a window, a latrine that drains.","Individual cells, blankets, and a yard they may use unwatched."],
    cost:[460, 1000, 2000], upkeep:[5, 10, 17] },
  armamentarium: { name:"Armamentarium", short:"Armoury",
    desc:"A smith on the premises buys better and mends what would be thrown out.",
    levels:["A rack and a whetstone.","A forge in the corner and a smith three days a week.","Your own armourer, and Capua's dealers quoting you their second price first."],
    cost:[400, 900, 1800], upkeep:[4, 9, 15] },
  palus: { name:"Palus", short:"Training ground",
    desc:"Posts, weights, sand raked daily. Where the work actually happens.",
    levels:["Three posts in bare dirt.","Raked sand, weighted wasters, a covered colonnade for the rain.","A second yard, a sand pit, and every apparatus the schools of Capua use."],
    cost:[440, 980, 1950], upkeep:[4, 9, 16] },
};
const BKEYS = Object.keys(BUILDINGS);
const bLevel = (d, k) => (d.buildings && d.buildings[k]) || 0;
const bUpkeep = d => BKEYS.reduce((s,k)=>{ const L=bLevel(d,k); return s + (L? BUILDINGS[k].upkeep[L-1] : 0); }, 0);
/* the rates each one moves */
const healSpeed   = (d,g) => (1 + bLevel(d,"valetudinarium")*0.45) * medicusMult(d) * pit(d,"heal") * (g? lastNum(g,"heal") : 1);
const scarGuard   = d => [1, 0.85, 0.70, 0.55][bLevel(d,"valetudinarium")];
const surgeonOK   = d => bLevel(d,"valetudinarium") >= 1;
const bathRest    = d => bLevel(d,"balneae")*3 + workPerk(d,"rest");                        // fatigue shed per week
const bathMorale  = d => bLevel(d,"balneae")*0.5;
const cellCalm    = d => bLevel(d,"carceres")*0.5;
const gearPrice   = (d,p,slot) => { const F = festivalNow(d);
  return rnd(p * [1, 0.9, 0.8, 0.7][bLevel(d,"armamentarium")] * (F && F.gear ? F.gear : 1)
    * perkGear(d) * armourerCut(d) * (slot ? docGearMult(d, slot) : 1)); };
const palusTrain  = d => 1 + bLevel(d,"palus")*0.08;
const palusGuard  = d => [1, 0.9, 0.8, 0.7][bLevel(d,"palus")];

/* ---- FEATS ----
   Things a house does once and is afterwards. Each pays on the day and most of
   them leave something behind — the perks are small and permanent and stack. */
const PERKS = {
  drill:   "The doctore's methods are talked about. Training +6%.",
  order:   "The cells run themselves. Unrest falls a little faster every week.",
  name:    "The name carries. Fame +1 a week.",
  steel:   "Your armourer is known. Gear costs 8% less and wears slower.",
  standing:"Editors take your calls. Every patron warms a shade faster.",
  nerve:   "The familia has seen worse. Morale drifts up, not down, after a death.",
};
const FEATS = {
  firstblood: { name:"First Blood", desc:"Win a bout.", gold:60,
    test:d=>houseRecord(d).w >= 1 },
  fivewins:   { name:"A Working House", desc:"Twenty victories.", gold:250, fame:15,
    test:d=>houseRecord(d).w >= 20 },
  hundred:    { name:"A Hundred on the Sand", desc:"A hundred victories.", gold:900, fame:60, perk:"name",
    test:d=>houseRecord(d).w >= 100 },
  rudis:      { name:"The Wooden Sword", desc:"Give a man the rudis.", gold:200, fame:25, perk:"order",
    test:d=>houseRecord(d).freed >= 1 },
  threefree:  { name:"A Merciful House", desc:"Free three men.", gold:500, fame:40, perk:"nerve",
    test:d=>houseRecord(d).freed >= 3 },
  primus:     { name:"Primus of Capua", desc:"Hold the primacy of the city.", gold:600, fame:50, perk:"standing",
    test:d=>!!(d.primus && d.primus.mine) || !!d.flags.everPrimus },
  lion:       { name:"The Numidian", desc:"Kill a lion in the arena.", gold:400, fame:35,
    test:d=>!!d.flags.killedLion },
  cloth:      { name:"The White Cloth", desc:"Stop a bout to save a man's life.", gold:0, fame:0, perk:"nerve",
    test:d=>!!d.flags.threwCloth },
  word:       { name:"A Word Kept", desc:"Promise a man his one wish and deliver it.", gold:300, fame:20, perk:"order",
    test:d=>!!d.flags.keptWord },
  forge:      { name:"Named Steel", desc:"Have a piece forged for one man.", gold:0, fame:30, perk:"steel",
    test:d=>(d.forged||[]).length >= 1 },
  school:     { name:"A Proper School", desc:"Build every part of the ludus to its second level.", gold:0, fame:45, perk:"drill",
    test:d=>BKEYS.every(k=>bLevel(d,k)>=2) },
  circuit:    { name:"The Circuit", desc:"Win on the sand of all three towns down the bay.", gold:700, fame:55, perk:"name",
    test:d=>CITY_KEYS.every(k=>knownIn(d,k) >= 10) },
  wealth:     { name:"Coin Enough", desc:"Hold ten thousand denarii.", gold:0, fame:40, perk:"steel",
    test:d=>d.gold >= 10000 },
  full:       { name:"A Full Block", desc:"Keep eight fighters at once.", gold:150, fame:15,
    test:d=>d.gladiators.filter(g=>!isGone(g)).length >= 8 },
  quiet:      { name:"A Quiet House", desc:"Thirty weeks without the unrest passing twenty.", gold:400, fame:30, perk:"order",
    test:d=>(d.flags.quietRun||0) >= 30 },
  stone:      { name:"The Stone", desc:"Bury ten men under the society's own name.", gold:0, fame:35, perk:"nerve",
    test:d=>!!(d.collegium && d.collegium.buried >= 10) },
  munera:     { name:"Munera", desc:"Hold full games in the name of three of your own dead.", gold:0, fame:45, perk:"order",
    test:d=>(d.honoured||0) >= 3 },
  decade:     { name:"Ten Years a Lanista", desc:"Run the house for ten years.", gold:800, fame:70, perk:"standing",
    test:d=>yearOf(d) >= 10 },
  rome:       { name:"The Sand at Rome", desc:"Win on the imperial sand.", gold:0, fame:100, perk:"standing",
    test:d=>!!(d.rome && d.rome.won >= 1) },
};
const FEAT_KEYS = Object.keys(FEATS);
const hasFeat = (d,k) => !!(d.feats && d.feats[k]);
const perkOn = (d,p) => FEAT_KEYS.some(k=>hasFeat(d,k) && FEATS[k].perk===p);
/* the small permanent things a feat leaves behind */
const perkTrain = d => perkOn(d,"drill") ? 1.06 : 1;
const perkCalm  = d => perkOn(d,"order") ? 0.45 : 0;
const perkFame  = d => perkOn(d,"name") ? 1 : 0;
const perkGear  = d => perkOn(d,"steel") ? 0.92 : 1;
const perkWear  = d => perkOn(d,"steel") ? 0.85 : 1;
const perkPatron= d => perkOn(d,"standing") ? 1.5 : 1;
const perkNerve = d => perkOn(d,"nerve") ? 0.7 : 1;

function featWeek(d){
  d.feats = d.feats || {};
  d.flags.quietRun = d.unrest <= 20 ? (d.flags.quietRun||0)+1 : 0;
  if(d.primus && d.primus.mine) d.flags.everPrimus = 1;
  for(const k of FEAT_KEYS){
    if(d.feats[k]) continue;
    let ok = false;
    try { ok = FEATS[k].test(d); } catch(e){ ok = false; }
    if(!ok) continue;
    const F = FEATS[k];
    d.feats[k] = d.week;
    if(F.gold) d.gold += F.gold;
    if(F.fame) d.fame += F.fame;
    d.gladiators.forEach(g=>{ if(g.status==="active") g.morale = clamp(g.morale+3,0,100); });
    chron(d, `${F.name}. ${F.desc}${F.gold?` +${F.gold} denarii.`:""}${F.fame?` +${F.fame} fame.`:""}${F.perk?` ${PERKS[F.perk]}`:""}`, "good");
  }
}

/* ---- THE AFTERMATH ----
   You opened the gates. Somewhere south, a fire you fed for years is loose in dry
   country, and it takes about two years to come back and find you. */
const WAR = [
  { at:0,  name:"A band in the hills",
    line:n=>`Word from the south: ${n} and a few dozen others have taken a villa near Nola and burned the press. Nobody in Capua is calling it a war yet.`,
    standing:0.5, unrest:0.25, defFloor:0 },
  { at:11, name:"An army",
    line:n=>`It is thousands now. A praetor went south with two cohorts of whatever he could raise and came back with considerably less. They have stopped calling ${n} a runaway and started calling him a general, which is worse for everybody including him.`,
    standing:1.1, unrest:0.6, defFloor:18, market:1.25 },
  { at:27, name:"The legions",
    line:n=>`Rome has stopped sending praetors. Eight legions are in the field and a man named Crassus has bought the command with his own money. Whatever happens now happens quickly.`,
    standing:1.5, unrest:0.5, defFloor:22, market:0.75 },
  { at:44, name:"The road",
    line:n=>`It is over. They took the last of them in Lucania and there was no formal surrender because there was nobody left with the standing to offer one. Six thousand are being crucified along the road from Capua to Rome, at intervals, so that the whole of it can be walked.`,
    standing:0.4, unrest:-0.4, defFloor:0, market:0.55 },
];
const warStage = d => { if(!d.war) return null;
  let s = WAR[0]; for(const w of WAR) if(d.war.weeks >= w.at) s = w; return s; };
const warIdx = d => d.war ? WAR.indexOf(warStage(d)) : -1;

function warWeek(d){
  if(!d.flags.spartacusAtLarge) return;
  if(!d.war) d.war = { weeks:0, stage:0, name:d.flags.spartacusAtLarge, taxed:0, levied:0, done:false };
  if(d.war.done) return;
  d.war.weeks++;
  const idx = warIdx(d);
  if(idx > d.war.stage){
    d.war.stage = idx;
    chron(d, WAR[idx].line(d.war.name), idx===3 ? "info" : "bad");
    if(idx===3){
      /* the magistrate has a long memory and a short list */
      d.fame = Math.max(0, d.fame-20);
      patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-14,0,100); });
      recomputeFavor(d);
      chron(d, `Nobody in Capua has forgotten which gate he walked out of. The magistrate is polite. He is also no longer available on the days you call.`, "bad");
    }
  }
  const S = warStage(d);
  patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor - S.standing*0.35, 0, 100); });
  recomputeFavor(d);
  d.unrest = clamp(d.unrest + S.unrest, 0, 100);
  /* the men know it can be done, because they watched it done */
  if(S.defFloor) d.gladiators.forEach(g=>{
    if(g.status==="active" && !isAuctor(g) && g.defiance < S.defFloor) g.defiance = clamp(g.defiance+0.5, 0, 100); });
  if(d.war.weeks >= 58){ d.war.done = true;
    chron(d, `The road is quiet again. It takes a long time to walk past six thousand of anything.`, "info"); }
}
/* the block after a war is a buyer's market, and everyone knows why */
const warMarket = d => { const S = warStage(d); return (S && !d.war.done && S.market) ? S.market : 1; };

/* ---- THE COLLEGIUM ----
   A burial society. The men pay in, and when one of them dies there is a stone
   with his name on it instead of a pit. It never wins a bout. It is the cheapest
   humane thing in this game and the easiest line to cut in a bad month. */
const COLL_FEE = 180;
const COLL_DUES = 3;
const collDues = d => d.collegium ? activeG(d).length * COLL_DUES : 0;
const collOn = d => !!(d.collegium && !d.collegium.lapsed);
function foundCollegium(d){
  if(d.collegium || d.gold < COLL_FEE) return false;
  d.gold -= COLL_FEE;
  d.collegium = { since:d.week, buried:0, lapsed:0 };
  d.gladiators.forEach(g=>{ if(g.status==="active"){ g.morale = clamp(g.morale+9,0,100); g.defiance = clamp(g.defiance-5,0,100); } });
  d.unrest = clamp(d.unrest-5, 0, 100);
  addRep(d, "mercy", 8);
  rememberAll(d, "collegium");
  chron(d, `You put the house into a burial society and the men are told at the post. Nobody thanks you. By the evening every one of them knows exactly what it means, which is that whatever happens on the sand, there will be a stone with his own name on it.`, "good");
  return true;
}
function lapseCollegium(d, chosen){
  if(!d.collegium || d.collegium.lapsed) return;
  d.collegium.lapsed = d.week;
  rememberAll(d, "lapsed", d.collegium.buried ? 1 : 0.5);
  const seen = d.collegium.buried;
  d.gladiators.forEach(g=>{ if(g.status==="active"){
    g.morale = clamp(g.morale-(seen?22:12),0,100);
    g.defiance = clamp(g.defiance+(seen?16:8),0,100); } });
  d.unrest = clamp(d.unrest + (seen?14:7), 0, 100);
  chron(d, seen
    ? `The dues stop. ${seen===1?"One man":`${seen} men`} went into the ground under that society and every man still in the cells watched it happen. They know precisely what has been taken back.`
    : `The dues stop before anyone needed them. The men notice anyway; it is the sort of thing they count.`, "bad");
}
/* what it does on the day it matters */
const collSoften = d => collOn(d) ? 0.5 : 1;
function collBury(d, g){
  if(!collOn(d)) return;
  d.collegium.buried++;
  const a = (d.annals||[]).find(x=>x.id===g.id);
  if(a) a.stone = true;
  chron(d, `${fullName(g)} is buried under the society's stone — his name, his style, and the number of his victories cut into it. It is not much. It is more than the pit.`, "info");
}

/* ---- THE LANISTA ----
   You have been a number in the corner of the screen for thirty versions. You have
   an age now, and a body, and the job takes both. */
const LAN_TRAITS = {
  hard:      { name:"Hard", earn:"a house Capua calls butchers, kept that way",
    line:"The men do as they are told quickly and look at the floor while they do it." },
  merciful:  { name:"Merciful", earn:"a house Capua calls merciful, kept that way",
    line:"Word gets round which houses bury their men and which ones free them." },
  shrewd:    { name:"Shrewd", earn:"five wagers won",
    line:"The bookmakers have stopped giving you the tourist's price." },
  respected: { name:"Respected", earn:"standing held above 65 for twenty weeks",
    line:"Doors open on the first knock. Patrons cool half as fast." },
  marked:    { name:"Marked", earn:"caught arranging a bout",
    line:"Every editor in Campania has heard. They are polite about it, which is worse.", bad:true },
  ailing:    { name:"Ailing", earn:"your health broken below thirty",
    line:"You are slower up the stairs than you were, and the yard has noticed.", bad:true },
};
const LAN_KEYS = Object.keys(LAN_TRAITS);
const hasLT = (d,k) => !!(d.lanista && d.lanista.traits && d.lanista.traits.includes(k));
const healthWord = h => h>=80?"hale" : h>=60?"well enough" : h>=40?"tired" : h>=22?"failing" : "not long";
const healthColour = h => cbc(h>=60?"#9aa86a" : h>=35?"#d8ac5f" : "#d96f5d");

function makeLanista(d){
  return { name:`${pick(PRAENOMINA)} ${pick(NOMINA)} ${pick(COGNOMINA)}`, age: ri(34,46), health: ri(78,92),
    traits: [], since: 1, wonBets: 0, quietStanding: 0, styleRun: 0, styleWas: null };
}
/* the job, week by week */
function lanistaWeek(d){
  const L = d.lanista; if(!L || d.over) return;
  let h = L.health;
  if(L.age > 42) h -= (L.age-42)*0.045;
  if(d.unrest > 60) h -= 0.16;
  if(d.rebellion && d.rebellion.stage >= 2) h -= 0.3;
  if(bLevel(d,"balneae")) h += bLevel(d,"balneae")*0.09;
  if(hasLT(d,"ailing")) h -= 0.05;
  h += 0.06;                                   // an ordinary week mends a little
  L.health = clamp(h, 0, 100);

  /* traits are earned by how you actually run the place */
  const st = repStyle(d);
  if(st && st===L.styleWas) L.styleRun++; else { L.styleWas = st; L.styleRun = 0; }
  const add = k => { if(!L.traits.includes(k)){ L.traits.push(k);
    chron(d, `${L.name}: ${LAN_TRAITS[k].name}. ${LAN_TRAITS[k].line}`, LAN_TRAITS[k].bad?"bad":"good"); } };
  if(L.styleRun >= 15 && st==="blood") add("hard");
  if(L.styleRun >= 15 && st==="mercy") add("merciful");
  if(L.wonBets >= 5) add("shrewd");
  L.quietStanding = d.favor >= 65 ? L.quietStanding+1 : 0;
  if(L.quietStanding >= 20) add("respected");
  if(d.flags.caughtFixing) add("marked");
  if(L.health < 30) add("ailing");

  /* a man who is old, well, and has somebody to hand it to simply stops */
  if(L.age >= 62 && L.health >= 45 && d.heir && yearOf(d) >= 6 && R() < 0.06){
    d.over = { kind:"oldAge", name:d.name, lan:L.name, age:L.age, years:yearOf(d), heir:d.heir.name };
  } else if(L.health <= 0){
    if(d.heir && HEIRS[d.heir.kind]) d.succession = { lan:L.name, age:L.age, heir:d.heir.name, kind:d.heir.kind };
    else d.over = { kind:"lanistaDied", name:d.name, lan:L.name, age:L.age, years:yearOf(d) };
  }
}
const lanTrain  = d => hasLT(d,"ailing") ? 0.92 : 1;
const lanCalm   = d => (hasLT(d,"merciful")?0.3:0) + (hasLT(d,"hard")?-0.15:0);
const lanDefiance = d => hasLT(d,"hard") ? -0.3 : 0;
const lanMorale = d => (hasLT(d,"merciful")?0.25:0) + (hasLT(d,"hard")?-0.2:0);
const lanPatronDecay = d => hasLT(d,"respected") ? 0.5 : hasLT(d,"marked") ? 1.8 : 1;
const lanVig = d => hasLT(d,"shrewd") ? 0.06 : VIG;

/* ---- THE LANISTA'S RISE ----
   A ludus is a slaver's trade, and a slaver is no gentleman. But coin and a
   loud arena buy a man his way up out of that, rung by rung, until the same
   people who would not have dined with you send their sons to your sand.
   d.rise lives at the top of the save so a heir inherits the family's standing. */
const RISE_RANKS = [
  { name:"Lanista",                 short:"a keeper of slaves",
    blurb:"A man who buys other men and sells their blood. The city needs you; it does not receive you." },
  { name:"Man of Means",            short:"a man with coin",     fame:40,  favor:0,  cost:400,
    blurb:"Your purse is heavy enough that a merchant stands when you enter. It is a start.",
    perk:"The good bookings come to you first. Purses run a touch richer." },
  { name:"Citizen of Standing",     short:"a citizen of note",   fame:120, favor:40, cost:1200,
    blurb:"You have paid for a name. Men who once looked past you now nod in the forum.",
    perk:"Editors weigh your word in the box. Missio comes a little easier when you ask it." },
  { name:"Friend of the Magistracy", short:"a friend of the town", fame:250, favor:55, cost:3000,
    blurb:"The magistrates take your calls. The town's purse and yours are on speaking terms.",
    perk:"Standing pays its own rents — clients and gifts arrive every week." },
  { name:"Eques",                   short:"of the equestrian order", fame:450, favor:65, cost:8000,
    blurb:"The census counts you among the knights. There is a ring on your hand that says so.",
    perk:"Every ledger tilts your way — purses, the box, and the weekly income all grow." },
  { name:"Known in Rome",           short:"a name in the capital", fame:600, favor:75, cost:15000,
    blurb:"They speak of your house in the capital. A slaver climbed all the way, and the climb is the story." },
];
const riseOf   = d => (d.rise ? d.rise.rank : 0);
const riseRank = d => RISE_RANKS[riseOf(d)] || RISE_RANKS[0];
const riseName = d => riseRank(d).name;
const riseNext = d => RISE_RANKS[riseOf(d)+1] || null;
/* the graduated perks — all keyed to the rung you stand on */
const risePurse   = d => 1 + riseOf(d)*0.03;   // better bookings the higher you climb
const riseFav     = d => riseOf(d)*3;          // your name carries weight in the editor's box
const riseStipend = d => riseOf(d) >= 3 ? (riseOf(d)-2)*8 : 0;  // rents and clients, from Friend upward
/* how close you are to being received at the next rung */
function riseWeek(d){
  if(d.over || d.succession) return;
  if(!d.rise) d.rise = { rank:0, standing:0 };
  if(riseStipend(d) > 0) d.gold += riseStipend(d);
  const nx = riseNext(d);
  if(!nx){ d.rise.standing = 100; return; }
  const meets = d.fame >= (nx.fame||0) && d.favor >= (nx.favor||0);
  let s = d.rise.standing;
  if(meets){
    /* the town gets used to you faster the further past the gate you already are */
    const over = (d.fame - (nx.fame||0)) / 200 + (d.favor - (nx.favor||0)) / 60;
    s += 4 + clamp(over, 0, 5);
    if(d.unrest > 60) s -= 3;                 // a house in uproar is no advertisement
  } else {
    s -= 2;                                    // slip below the gate and the goodwill cools
  }
  d.rise.standing = clamp(s, 0, 100);
}
const riseNeed = d => {
  const nx = riseNext(d); if(!nx) return null;
  return { fame: nx.fame||0, favor: nx.favor||0, cost: nx.cost||0,
    fameOk: d.fame >= (nx.fame||0), favorOk: d.favor >= (nx.favor||0),
    goldOk: d.gold >= (nx.cost||0), full: d.rise && d.rise.standing >= 100 };
};
const canClaimRise = d => {
  const n = riseNeed(d); return !!(n && n.fameOk && n.favorOk && n.goldOk && n.full);
};
function claimRise(d){
  if(!canClaimRise(d)) return false;
  const nx = riseNext(d);
  d.gold -= nx.cost;
  d.rise.rank++;
  d.rise.standing = 0;
  d.fame += ri(10, 18);                        // the elevation is itself talked about
  patronsOf(d).forEach(p => p.favor = clamp(p.favor + ri(3,6), 0, 100));
  recomputeFavor(d);
  chron(d, `${d.name} is received as ${nx.name} — ${nx.short}.`, "good");
  return true;
}

/* ---- THE CIRCUIT ----
   Three towns down the bay who have never heard of you. Your standing in Capua
   buys nothing on their sand; what you have there, you earn there. */
/* ---- THE CLOSING ACCOUNT ----
   The ending has been the same ending whether you got there in forty weeks or two
   hundred, freed twelve men or buried thirty. The house is carrying an enormous
   amount of history by then. This reads it. */
function closing(d){
  const R2 = houseRecord(d);
  const B = (d.book || {});
  const A = d.annals || [];
  const bouts = B.n || 0;
  const winPc = bouts ? Math.round((B.w||0)/bouts*100) : 0;
  const ratio = R2.lost ? (R2.freed / R2.lost) : (R2.freed ? 99 : 0);
  /* the house that took you apart */
  let nemesisHouse = null;
  for(const [h,e] of Object.entries(B.house||{})){
    const pc = e.n ? Math.round(e.w/e.n*100) : 50;
    if(e.n >= 4 && (!nemesisHouse || pc < nemesisHouse.pc)) nemesisHouse = { h, pc, n:e.n, w:e.w };
  }
  /* your best style and your worst */
  const styles = Object.entries(B.cls||{}).filter(([,e])=>e.n>=4)
    .map(([k,e])=>({ k, pc:Math.round(e.w/e.n*100), n:e.n })).sort((a,b)=>b.pc-a.pc);
  /* the men you let out, by name */
  const freedMen = A.filter(a=>a.fate==="freed").map(a=>a.nick? `${a.name}, ${a.nick}` : a.name);
  /* the worst single year */
  const byYear = {};
  A.forEach(a=>{ if(["dead","beasts","revolt"].includes(a.fate)){
    const y = Math.max(1, Math.ceil((a.to || d.week)/YEAR_WEEKS)); byYear[y] = (byYear[y]||0)+1; } });
  const worstYear = Object.entries(byYear).sort((a,b)=>b[1]-a[1])[0];
  return { R2, bouts, winPc, ratio, nemesisHouse, styles, freedMen, worstYear,
    best:R2.best, years:R2.years, weeks:d.week, purse:Math.round(B.purse||0),
    gen:d.generation||1, doctrine:doctrineOf(d), feats:Object.keys(d.feats||{}).length };
}
/* what Capua concluded, and it does not flatter */
const VERDICTS = [
  { id:"merciful", when:c=>c.R2.freed>=4 && c.ratio>=1.5,
    name:"They will say you were a merciful man",
    say:c=>`${c.R2.freed} men walked out of this house on their own legs and ${c.R2.lost} did not. That is a ratio almost nobody in this trade can claim, and the ones who can are not usually the ones with your standings.` },
  { id:"butcher", when:c=>c.R2.lost>=8 && c.ratio<0.3,
    name:"They will say you were a butcher",
    say:c=>`${c.R2.lost} buried against ${c.R2.freed} freed. The house made money and the yard emptied and refilled around you, and there is a version of this trade where that is simply competence.` },
  { id:"builder", when:c=>c.gen>1,
    name:"They will say the house outlived you",
    say:c=>`${c.gen} lanistae, ${c.years} years, and it was still standing when you were not. Most houses are one man's idea and go into the ground with him.` },
  { id:"unlucky", when:c=>c.bouts>=40 && c.winPc<42,
    name:"They will say you were unlucky",
    say:c=>`${c.winPc} bouts in a hundred, across ${c.bouts} of them. That is not a run of bad afternoons, that is a house that was consistently sent against better men, and everyone watching could see it.` },
  { id:"feared", when:c=>c.bouts>=40 && c.winPc>=58,
    name:"They will say your men were the ones to beat",
    say:c=>`${c.winPc}% across ${c.bouts} bouts. Houses arranged their cards around yours, which is a compliment nobody ever pays out loud.` },
  { id:"small", when:c=>c.bouts<25,
    name:"They will not say very much at all",
    say:c=>`${c.bouts} bouts is not a career, it is an attempt. Capua has forgotten larger houses than this one inside a season.` },
  { id:"steady", when:()=>true,
    name:"They will say you knew the work",
    say:c=>`${c.bouts} bouts, ${c.R2.served} men through the gate, ${c.years} years of it. No legend and no scandal — a house that did the thing it was for, which is rarer than either.` },
];
const verdictOf = c => VERDICTS.find(v=>{ try { return v.when(c); } catch(e){ return false; } }) || VERDICTS[VERDICTS.length-1];

/* ---- THE MORNING AFTER ----
   Everything in this game lands the instant it is earned. A man dies and the unrest
   is there before the body is cold. This is the week afterward: the yard quiet, the
   town saying something, and one of them not meeting your eye. No new state — it
   reads what already happened and delivers it late. */
const AFTERS = {
  buried: { w:10, when:(d,m)=>m.deaths>0,
    say:(d,m)=>{ const n = m.deaths;
      return `${n===1?"The bench where he sat is empty":"Two benches are empty"} and nobody has moved along to fill it. They will by next week.`; },
    hit:(d,m)=>{ d.unrest = clamp(d.unrest + m.deaths*1.6, 0, 100);
      activeG(d).forEach(g=>{ g.morale = clamp(g.morale-3, 0, 100); }); } },
  killed: { w:9, when:(d,m)=>m.kills>0,
    say:(d,m)=>`Somebody from the other house came to the gate to ask after the body. He was not let in and he did not expect to be.`,
    hit:(d,m)=>{ (d.rivals||[]).forEach(h=>{ if(R()<0.4) h.grudge = clamp(h.grudge+2,0,100); }); } },
  triumph:{ w:8, when:(d,m)=>m.crowdBest >= 62,
    say:(d,m)=>`Half of Capua is still talking about ${m.star}. Two men who have never fought at the games asked the doctore what he does differently.`,
    hit:(d,m)=>{ d.fame += 5; activeG(d).forEach(g=>{ g.morale = clamp(g.morale+4,0,100); }); } },
  flat:   { w:1, when:(d,m)=>m.bouts>=2 && m.crowdBest < 30 && d.fame >= 120 && R()<0.25,
    say:(d,m)=>`Nobody has said anything about last week's card, which is its own kind of review.`,
    hit:(d,m)=>{ d.fame = Math.max(0, d.fame-3); FAC_KEYS.forEach(k=>facMove(d,k,-1.5)); } },
  spared: { w:7, when:(d,m)=>m.spared>0,
    say:(d,m)=>`The man you let up is still alive somewhere, and every man in your cells knows exactly how that decision was made.`,
    hit:(d,m)=>{ activeG(d).forEach(g=>{ g.regard = clamp(regardOf(g)+2,0,100); }); d.unrest = clamp(d.unrest-1.5,0,100); } },
  carried:{ w:9, when:(d,m)=>m.hurt>0,
    say:(d,m)=>`${m.hurtName} is in the infirmary and the yard works around the space where he usually stands.`,
    hit:(d,m)=>{ activeG(d).forEach(g=>{ if(R()<0.5) g.morale = clamp(g.morale-2,0,100); }); } },
  purse:  { w:6, when:(d,m)=>m.purse >= 320,
    say:(d,m)=>`The coin from last week is spent before it is counted — the butcher, the smith, and a man from the magistrate's office who had heard about it already.`,
    hit:(d,m)=>{ d.gold -= rnd(m.purse*0.05); } },
  quiet:  { w:5, when:(d,m)=>m.bouts===0 && activeG(d).length>=3,
    say:(d,m)=>`A week with nobody on the sand. The men train, eat, and get on each other's nerves in the usual order.`,
    hit:(d,m)=>{ d.gladiators.forEach(g=>{ if(g.status==="active") g.defiance = clamp(g.defiance+1.2,0,100); }); } },
};
const AFTER_KEYS = Object.keys(AFTERS);
/* the ledger of a week, kept while it happens */
function weekMark(d, field, n, extra){
  d.mark = d.mark || { bouts:0, deaths:0, kills:0, spared:0, hurt:0, purse:0, crowdBest:0, star:null, hurtName:null };
  if(field==="crowdBest"){ if(n > d.mark.crowdBest){ d.mark.crowdBest = n; d.mark.star = extra; } return; }
  if(field==="hurt"){ d.mark.hurt++; d.mark.hurtName = extra || d.mark.hurtName; return; }
  d.mark[field] = (d.mark[field]||0) + (n==null?1:n);
}
function afterWeek(d){
  /* deliver last week's, then start this week's ledger */
  const m = d.after;
  d.after = d.mark || null;
  d.mark = null;
  if(!m || d.over || d.rome) return;
  const fit = AFTER_KEYS.filter(k=>{ try { return AFTERS[k].when(d, m); } catch(e){ return false; } });
  if(!fit.length) return;
  /* one morning in three has nothing worth saying, and the rest are weighted */
  if(R() < 0.3) return;
  const tot = fit.reduce((n,k)=>n + (AFTERS[k].w||5), 0);
  let r = R()*tot, k = fit[0];
  for(const c of fit){ r -= (AFTERS[c].w||5); if(r <= 0){ k = c; break; } }
  try { AFTERS[k].hit(d, m); } catch(e){}
  chron(d, AFTERS[k].say(d, m), k==="triumph"||k==="spared" ? "good" : k==="buried"||k==="flat" ? "bad" : "info");
}

/* ---- A REASON TO LEAVE CAPUA ----
   Three cities, five venues and Rome all sit behind travelling, and the audit found
   that a house which never leaves never sees any of it. Nothing new is built here.
   Staying home is simply given a price, and the bay is given a memory. */
const BAY_DECAY = 0.55;                       // local standing bleeds while you are not there
function bayWeek(d){
  if(d.rome || d.over) return;
  d.known = d.known || {};
  for(const k of Object.keys(CITIES)){
    if(d.city === k) continue;
    const v = d.known[k] || 0;
    if(v > 0) d.known[k] = Math.max(0, v - BAY_DECAY);
  }
  /* somebody else is down there taking the work */
  d.bay = d.bay || { holder:null, since:0, weeks:0 };
  const away = d.week - (d.flags.lastTravelled || 0);
  if(!d.city && away >= 30 && !d.bay.holder && R() < 0.028){
    const h = pick(d.rivals || []);
    if(h){
      d.bay.holder = h.name; d.bay.since = d.week; d.bay.weeks = 0;
      chron(d, `Word comes up from Puteoli that House ${h.name} has been fighting the whole bay while you have been minding Capua. They are calling ${lanistaOf(h.name).name}'s men the ones worth crossing the water for.`, "bad");
    }
  }
  if(d.bay.holder){
    d.bay.weeks++;
    if(d.city){                                  // you turned up
      const h = d.bay.holder;
      d.bay = { holder:null, since:0, weeks:0 };
      const r = (d.rivals||[]).find(x=>x.name===h);
      if(r) r.grudge = clamp(r.grudge + 12, 0, 100);
      chron(d, `You are on the sand at ${CITIES[d.city].name} and House ${h} is not. Whatever they were building down here stops being theirs today.`, "good");
    } else if(d.bay.weeks % 8 === 0){
      d.fame = Math.max(0, d.fame - 4);
      chron(d, `House ${d.bay.holder} takes another card down the bay. Capua notices which houses travel and which do not.`, "info");
    }
  }
}
const bayHolder = d => (d.bay && d.bay.holder) || null;
const baySince  = d => d.bay && d.bay.holder ? d.week - d.bay.since : 0;
/* what the bay is worth to you right now, so the offer can say it plainly */
function bayWorth(d, key){
  const C = CITIES[key]; if(!C) return null;
  const k = knownIn(d, key);
  return { purse:C.purse, known:Math.round(k),
    strangerMercy: Math.round(100 - Math.max(0, 19 - k*0.19)*2.6),
    rusting: (d.known && d.known[key] > 0 && d.city !== key) };
}

const CITIES = {
  pompeii: { name:"Pompeii", travel:1, purse:1.2, taste:"blood",
    blurb:"A loud, rich, vulgar little town with a stone amphitheatre older than Rome's and an appetite to match.",
    crowd:"They came to see somebody bleed and they are not subtle about it." },
  neapolis: { name:"Neapolis", travel:1, purse:1.05, taste:"craft",
    blurb:"Greek to the bone. They watch the footwork, they know the styles, and they have opinions about both.",
    crowd:"This crowd can tell a feint from a flinch, which is not always to your advantage." },
  puteoli: { name:"Puteoli", travel:2, purse:1.4, taste:"show",
    blurb:"The port. Every trader on the bay passes through and every one of them will pay to be entertained.",
    blurbx:"", crowd:"Sailors, factors and freedmen with money and nothing to spend it on until you arrived." },
};
const CITY_KEYS = Object.keys(CITIES);
const awayIn = d => (d.city && CITIES[d.city]) ? CITIES[d.city] : null;
const knownIn = (d,k) => (d.known && d.known[k]) || 0;
const cityTier = (d,k) => knownIn(d,k) >= 60 ? 3 : knownIn(d,k) >= 30 ? 2 : 1;

function setOut(d, key){
  const C = CITIES[key]; if(!C || d.rome || d.travel || d.city===key) return false;
  d.travel = { to:key, weeks:C.travel, home:false };
  d.flags.lastTravelled = d.week;
  d.games = null;
  chron(d, `The wagons go south for ${C.name}. ${C.blurb}`, "event");
  return true;
}
function comeHome(d){
  if(!d.city || d.travel) return false;
  d.travel = { to:null, weeks:CITIES[d.city].travel, home:true };
  d.games = null;
  chron(d, `You break camp and start back up the road to Capua.`, "event");
  return true;
}
function travelWeek(d){
  if(d.travel){
    d.travel.weeks--;
    d.gold -= 25;
    if(d.travel.weeks<=0){
      if(d.travel.home){ d.city = null; chron(d, `Capua again. The gate needs oiling and somebody has been sleeping in your chair.`, "event"); }
      else { d.city = d.travel.to;
        const C = CITIES[d.city];
        d.known = d.known || {};
        if(!d.known[d.city]) d.known[d.city] = 0;
        chron(d, `${C.name}. ${C.crowd} Nobody here has heard of your house, which is the point.`, "event"); }
      d.travel = null;
    }
    return;
  }
}
function makeCityGames(d){
  const key = d.city, C = CITIES[key];
  if(!C) return;
  const tier = cityTier(d, key);
  const offers = [];
  const n = 2 + (knownIn(d,key)>=45 ? 1 : 0);
  for(let i=0;i<n;i++){
    const t = TIERS[tier];
    const pr = pickAnyOpp(d, tier);
    const opp = pr.opp;
    opp.kit = opp.kit || kitFor(opp.cls, tier);
    const sine = C.taste==="blood" ? R()<0.3 : R()<0.12;
    offers.push({ id:d.nextId++, tier, festival:`the games at ${C.name}`, city:key,
      opp, oppRef:pr.ref, rematch:false, grudgeM:false, stakes: sine?"sine":"standard",
      purse: rnd((t.purse[0]+R()*t.purse[1]) * C.purse * (sine?1.6:1)) });
  }
  offers.forEach(o=>{ if(!o.venue) o.venue = venueFor(d, o); if(!o.sky) o.sky = skyFor(d, o); });
  d.games = { festival:`the games at ${C.name}`, offers, week:d.week, city:key };
}

/* ---- THE PRIMUS OF CAPUA ----
   One man in the city holds it. He is not always yours, and holding it is worse
   than winning it — because the whole of Campania now wants the bout, and so
   does the second-best man in your own cells. */
const PRIMUS_GATE = { wins:5, pfame:35 };
const primusEligible = g => g && g.status==="active" && g.wins>=PRIMUS_GATE.wins && g.pfame>=PRIMUS_GATE.pfame;
const holdsPrimus = (d,g) => !!(d.primus && d.primus.mine && g && d.primus.gid===g.id);
const primusMine = d => !!(d.primus && d.primus.mine);

function seedPrimus(d){
  const pool = (d.rivals||[]).flatMap(h=>h.fighters.map(f=>({h,f})));
  if(!pool.length) return;
  /* the best three are all plausible; which of them holds it should not be fixed forever */
  const ranked = pool.slice().sort((a,b)=>(b.f.wins*3+b.f.pfame)-(a.f.wins*3+a.f.pfame));
  const top = ranked.slice(0, Math.min(3, ranked.length));
  const bag = []; top.forEach((x,i)=>{ for(let k=0;k<3-i;k++) bag.push(x); });
  const best = pick(bag);
  d.primus = { mine:false, house:best.h.name, fid:best.f.id, name:best.f.name,
    nick:best.f.nick, cls:best.f.cls, since:d.week, defences:0 };
}
function primusTake(d, g, fromName){
  d.primus = { mine:true, gid:g.id, name:g.name, nick:g.nick, cls:g.cls, since:d.week, defences:0 };
  d.fame += 60;
  g.pfame += 30;
  g.morale = clamp(g.morale+20, 0, 100);
  d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id) o.morale = clamp(o.morale+6,0,100); });
  d.unrest = clamp(d.unrest-5, 0, 100);
  patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor+8,0,100); }); recomputeFavor(d);
  chron(d, `${fullName(g)} is Primus of Capua. ${fromName? fromName+" carried the title into that bout and did not carry it out." : "The title was standing empty and he took it."} There is one man in this city the whole city can name, and tonight he is yours.`, "good");
}
function primusLose(d, toName, killed){
  const g = d.primus && d.primus.mine ? d.gladiators.find(x=>x.id===d.primus.gid) : null;
  if(g && !killed){ g.morale = clamp(g.morale-18,0,100); g.defiance = clamp(g.defiance+8,0,100); }
  d.fame = Math.max(0, d.fame-25);
  d.gladiators.forEach(o=>{ if(o.status==="active") o.morale = clamp(o.morale-5,0,100); });
  chron(d, `The primacy of Capua leaves this house${toName? " with "+toName : ""}. It was held ${d.primus? d.week-d.primus.since : 0} weeks and ${d.primus&&d.primus.defences? "defended "+d.primus.defences+" times":"never defended"}.`, "bad");
  d.primus = null;
}
/* the title moves among the other houses too, so the city is never still */
function primusWeek(d){
  if(!d.primus){ if(R()<0.25) seedPrimus(d); return; }
  if(d.primus.mine){
    const g = d.gladiators.find(x=>x.id===d.primus.gid);
    if(!g || isGone(g)){ primusLose(d, null, true); return; }
    d.fame += 3;
    g.pfame = clamp(g.pfame+1.5, 0, 200);
    patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor+0.25,0,100); }); recomputeFavor(d);
    /* the second-best man in your own cells has noticed */
    const rival = activeG(d).filter(x=>x.id!==g.id && primusEligible(x))
      .sort((a,b)=>b.pfame-a.pfame)[0];
    if(rival){ rival.defiance = clamp(rival.defiance+0.8, 0, 100); }
    return;
  }
  const h = (d.rivals||[]).find(x=>x.name===d.primus.house);
  const still = h && h.fighters.some(f=>f.id===d.primus.fid);
  if(!still){ d.primus = null; return; }
  if(R()<0.05) seedPrimus(d);   // somebody else in the city takes it
}
function makePrimusOffer(d, tier){
  const p = d.primus;
  if(!p || p.mine) return null;
  const h = (d.rivals||[]).find(x=>x.name===p.house);
  const f = h && h.fighters.find(x=>x.id===p.fid);
  if(!f) return null;
  const opp = clone(f);
  opp.house = h.name;
  opp.kit = f.kit || kitFor(f.cls, 3);
  return { id:d.nextId++, tier:Math.max(3,tier), festival:"the primacy of Capua", primus:true,
    opp, oppRef:{ house:h.name, fid:f.id }, rematch:false, grudgeM:false,
    stakes: R()<0.3 ? "sine" : "standard",
    purse: rnd(1400 + R()*700) };
}
function makeDefenceOffer(d){
  const p = d.primus;
  if(!p || !p.mine) return null;
  const pr = pickRivalOpp(d, 3);
  const opp = pr.opp;
  opp.wins = Math.max(opp.wins||0, ri(7,14));
  opp.pfame = Math.max(opp.pfame||0, ri(55,90));
  return { id:d.nextId++, tier:3, festival:"the primacy of Capua", primus:true, defence:true,
    opp, oppRef:pr.ref, rematch:!!pr.rematch, grudgeM:!!pr.grudgeM,
    stakes: R()<0.25 ? "sine" : "standard",
    purse: rnd(1200 + R()*600) };
}

/* ---- NEMESIS ----
   A man from another house who has beaten yours twice stops being an opponent and
   becomes a name they say in the cells. Killing one of yours makes it worse. */
const NEM_TITLES = ["the Capuan","the Butcher of the Sand","the Wall","Twice-Over","the One Who Waits","the Quiet One"];
function nemesisCheck(d, h, f){
  if(!h || !f) return;
  const hated = (f.killedYours||0) > 0;
  if(!hated && (f.beatYou||0) < 2) return;
  if(d.nemesis && d.nemesis.fid===f.id){ d.nemesis.hated = d.nemesis.hated || hated; return; }
  if(d.nemesis && !hated) return;                 // one at a time unless this one has killed
  f.nemTitle = f.nemTitle || pick(NEM_TITLES);
  d.nemesis = { fid:f.id, house:h.name, name:f.name, title:f.nemTitle, hated, since:d.week };
  chron(d, hated
    ? `The cells have a name for ${f.name} of House ${h.name} now. They call him ${f.nemTitle}, and they do not say it loudly.`
    : `${f.name} of House ${h.name} has beaten this house twice. The men have started calling him ${f.nemTitle}.`, "bad");
}
const nemesisIn = (d, opp) => d.nemesis && opp && opp.name===d.nemesis.name ? d.nemesis : null;
function nemesisWeek(d){
  const n = d.nemesis; if(!n) return;
  const h = (d.rivals||[]).find(x=>x.name===n.house);
  const still = h && h.fighters.some(f=>f.id===n.fid);
  if(!still){ d.nemesis = null; return; }
  if(n.hated){
    d.gladiators.forEach(g=>{ if(g.status==="active"){ g.morale = clamp(g.morale-1.2,0,100); g.defiance = clamp(g.defiance+0.6,0,100); } });
  }
}
function nemesisSettled(d, killed){
  const n = d.nemesis; if(!n) return [];
  const out = [];
  d.gladiators.forEach(g=>{ if(g.status==="active"){
    g.morale = clamp(g.morale + (killed?18:11), 0, 100);
    g.defiance = clamp(g.defiance - (killed?9:5), 0, 100); } });
  d.unrest = clamp(d.unrest - (killed?7:4), 0, 100);
  d.fame += killed ? 22 : 12;
  out.push(killed
    ? `${n.name} is dead on your sand. Whatever the cells were carrying about him, they put it down tonight.`
    : `${n.name} was beaten in front of everyone who had heard the name. That is most of Capua.`);
  chron(d, out[0], "good");
  d.nemesis = null;
  return out;
}

/* ---- THE NEMESIS HOUSE ----
   One rival stops being a fighter and becomes a whole house you feud with for a
   season: it declares itself when the bad blood runs deep, escalates in the
   chronicle, drags a shared prospect between you, and comes to a head in a named
   grudge match you build toward. Its own state (d.nemHouse), separate from the
   single fighter-nemesis (d.nemesis). */
const NEM_BEATS = {
  low: [
    (L,h)=>`${L} let it be known at the baths that your house fights above its station and below its weight.`,
    (L,h)=>`A man of House ${h} spat at the gate of yours on his way past. Nobody saw who, which is the point.`,
    (L,h)=>`${L} has been buying the crowd cheap by naming your house the one worth beating.`,
  ],
  mid: [
    (L,h)=>`${L} offered the editors coin to put your men on harder cards. The editors, being editors, mentioned it to you.`,
    (L,h)=>`House ${h} paraded past your yard in full colours on the way to the games. Slowly.`,
    (L,h)=>`Word from the market: ${L} has a wager standing that none of your men lasts the season against his.`,
  ],
  high: [
    (L,h)=>`${L} said your name in the forum, and the men who carried it back to you did not soften it.`,
    (L,h)=>`House ${h} has stopped pretending it is about the sand. It is about you now, and Capua knows it.`,
    (L,h)=>`${L} will not take a cup from your hand or a bout on even terms. There is one way this ends and both houses have started saying so.`,
  ],
};
function nemLog(d, text){ (d.rivalLog = d.rivalLog || []).unshift({ text, week:d.week, house:(d.nemHouse&&d.nemHouse.house)||"" }); d.rivalLog = d.rivalLog.slice(0,8); }
function nemBeat(d){
  const n = d.nemHouse; if(!n) return;
  const L = lanistaOf(n.house).name;
  const tier = n.heat>=60 ? "high" : n.heat>=30 ? "mid" : "low";
  const line = pick(NEM_BEATS[tier])(L, n.house);
  chron(d, line, "bad"); nemLog(d, line);
  n.heat = clamp(n.heat + 3, 0, 100);
}
function nemClash(d, houseName, delta){
  const n = d.nemHouse;
  if(n && houseName && houseName===n.house) n.heat = clamp(n.heat + delta, 0, 100);
}
function declareNemHouse(d){
  if(d.nemHouse || !d.rivals) return;
  if(d.week < 14 || d.fame < 40) return;
  if(d.flags.nemCool && d.week - d.flags.nemCool < 20) return;
  const cand = d.rivals.filter(h=>!h.retired && (h.grudge>=45 || h.fighters.some(f=>(f.killedYours||0)>0 || (f.beatYou||0)>=2)));
  if(!cand.length) return;
  const h = cand.sort((a,b)=>b.grudge-a.grudge)[0];
  const L = lanistaOf(h.name).name;
  d.nemHouse = { house:h.name, heat: clamp(h.grudge*0.5+22, 20, 55), stage:1, since:d.week };
  chron(d, `It has a name now. Whatever it was between your house and House ${h.name}, ${L} said the thing in public this week that cannot be taken back — and Capua has settled in to watch which of you is standing at the end of the season.`, "bad");
  nemLog(d, `House ${h.name} is your house's declared rival. ${L} means to end you.`);
}
function issueGrudgeMatch(d){
  const n = d.nemHouse; if(!n) return false;
  if((d.deadlines||[]).some(x=>x.kind==="challenge")) return false;
  const h = houseOf(d, n.house); if(!h) return false;
  const men = activeG(d).filter(g=>g.pfame>=18);
  if(!men.length) return false;
  const g = men.reduce((m,x)=>x.pfame>m.pfame?x:m, men[0]);
  const f = h.fighters.filter(x=>!x.injury && x.name!==g.name).sort((a,b)=>b.pfame-a.pfame)[0];
  if(!f) return false;
  const L = lanistaOf(h.name).name;
  addDeadline(d, { kind:"challenge", nem:true, gid:g.id, name:g.name, house:h.name, lan:L,
    fid:f.id, foe:f.name, due:d.week+ri(4,7), purse: rnd(700 + R()*600), met:false });
  n.stage = 3;
  chron(d, `${L} has named the day and the men: ${f.name} of his house against ${g.name} of yours, and made it a thing the whole of Capua will attend. This is the one the season has been walking toward.`, "bad");
  nemLog(d, `The grudge match is set — ${g.name} against ${f.name}.`);
  return true;
}
function settleNemHouse(d, won){
  const n = d.nemHouse; if(!n) return;
  const h = houseOf(d, n.house);
  if(won){
    d.fame += 40;
    d.gladiators.forEach(g=>{ if(g.status==="active"){ g.morale=clamp(g.morale+16,0,100); g.defiance=clamp(g.defiance-8,0,100); } });
    d.unrest = clamp(d.unrest-8,0,100);
    if(h){ h.grudge = clamp(h.grudge-40,0,100); h.fame = Math.max(0, h.fame-20); }
    addRep(d, "craft", 10);
    chron(d, `It is finished. House ${n.house} was beaten where it chose to fight, before the crowd it chose to fight before, and ${lanistaOf(n.house).name} has nothing left to say. Your house is the one still standing at the end of the season.`, "good");
    nemLog(d, `The grudge with House ${n.house} is settled — your way.`);
    d.flags.nemWon = (d.flags.nemWon||0)+1;
    d.flags.nemCool = d.week; d.nemHouse = null;
  } else {
    if(h) h.grudge = clamp(h.grudge+10,0,100);
    d.gladiators.forEach(g=>{ if(g.status==="active") g.morale=clamp(g.morale-8,0,100); });
    d.unrest = clamp(d.unrest+5,0,100);
    n.heat = clamp(n.heat-30, 25, 100); n.stage = 2;   // not over; they will come again
    chron(d, `${lanistaOf(n.house).name} got what he named the day for. House ${n.house} took the grudge match, and there is no pretending otherwise. It is not finished — but tonight it is theirs.`, "bad");
    d.flags.nemCool = d.week;
  }
}
function nemHouseWeek(d){
  const n = d.nemHouse;
  if(!n){ if(R()<0.4) declareNemHouse(d); return; }
  const h = houseOf(d, n.house);
  if(!h || h.retired){
    chron(d, `Whatever it was going to be between you and House ${n.house}, it will not be. ${!h?"They folded and sold up before it came to blood.":`${lanistaOf(n.house).name} has gone to a farm near Nola, and the grudge with him.`} The cells are almost disappointed.`, "info");
    d.nemHouse = null; d.flags.nemCool = d.week; return;
  }
  if(R()<0.20) nemBeat(d);
  if(n.stage<2 && n.heat>=38 && !n.prospect){ n.prospect = 1; n.stage = 2; scheduleArc(d, "nemProspect", ri(1,3), { house:n.house }); }
  if(n.stage>=2 && n.heat>=72 && !(d.deadlines||[]).some(x=>x.kind==="challenge" && x.nem)){
    if(!(d.flags.nemCool && d.week - d.flags.nemCool < 6)) issueGrudgeMatch(d);
  }
  if(n.stage<3) n.heat = clamp(n.heat + 1.4, 0, 100);
}

/* ---- THE CHAMPION'S ROAD ----
   One of your own men rises far enough that the crowd starts telling a story about
   him, and the story wants an ending. A personal saga on d.saga (one at a time):
   he rises, the crowd names his equal, they meet in a reckoning, and then the road
   forks on the one thing every gladiator is really fighting for — the wooden sword.
   Modelled on the nemesis-house arc; renown is its meter, and it culminates in a
   choice about his freedom. */
const SAGA_BEATS = {
  low: [
    (n)=>`The pit crowd has started chanting ${n}'s name before he is on the sand. He hears it. Everyone hears him hear it.`,
    (n)=>`A potter in the forum is selling little clay ${n}s, arms raised. He is becoming a thing people own a piece of.`,
    (n)=>`Two other lanistae asked after ${n} at the baths this week, careful not to seem to.`,
  ],
  mid: [
    (n)=>`Mothers point ${n} out to their sons in the street now. The boy is a long way from the ditch he was bought out of.`,
    (n)=>`${n}'s name is scratched on the amphitheatre wall in a dozen hands, and painted over in none of them.`,
    (n)=>`An editor offered a purse just to have ${n} walk out and salute, and fight no one. You have not answered yet.`,
  ],
  high: [
    (n)=>`They are betting on ${n} in towns that have never seen him. A man can be famous now in places he will never stand.`,
    (n)=>`The crowd has begun to shout for the rudis when ${n} wins, before the editor has even raised his hand.`,
    (n)=>`${n} carries himself like a man who has understood something about what he is worth, and is waiting to see if you have.`,
  ],
};
function sagaLog(d, text){ (d.rivalLog = d.rivalLog || []).unshift({ text, week:d.week, house:"" }); d.rivalLog = d.rivalLog.slice(0,8); }
function sagaBeat(d){
  const s = d.saga; if(!s) return;
  const g = d.gladiators.find(x=>x.id===s.gid); if(!g) return;
  const tier = s.renown>=64 ? "high" : s.renown>=34 ? "mid" : "low";
  const line = pick(SAGA_BEATS[tier])(g.name);
  chron(d, line, "good"); sagaLog(d, line);
  s.renown = clamp(s.renown + 2, 0, 100);
}
function igniteSaga(d){
  if(d.saga || d.city || d.travel || d.rome) return;
  const cand = activeG(d).filter(g=>!isAuctor(g) && !isDamn(g) && g.pfame>=40 && g.wins>=8);
  if(!cand.length) return;
  if(d.flags.sagaCool && d.week - d.flags.sagaCool < 18) return;
  const g = cand.reduce((m,x)=>x.pfame>m.pfame?x:m, cand[0]);
  d.saga = { gid:g.id, name:g.name, stage:1, renown: clamp(g.pfame*0.5+18, 22, 55), since:d.week, foe:null };
  chron(d, `${fullName(g)} is becoming someone. There is a difference between a gladiator the crowd will watch and one it comes to see, and ${g.name} crossed it this week without asking your leave. The house has a champion, and a champion has a story that will want an ending.`, "good");
  sagaLog(d, `${g.name} is the crowd's champion now — his road has begun.`);
}
function nameRival(d){
  const s = d.saga; if(!s) return;
  const g = d.gladiators.find(x=>x.id===s.gid); if(!g) return;
  const houses = (d.rivals||[]).filter(h=>!h.retired && h.fighters.length);
  let best=null;
  for(const h of houses) for(const f of h.fighters){
    if(f.injury) continue;
    const sc = (f.pfame||0) + (f.beatYou||0)*10 - Math.abs((f.pfame||0)-(g.pfame||0))*0.15;
    if(!best || sc>best.sc) best={ h, f, sc };
  }
  if(!best) return;
  s.foe = { fid:best.f.id, house:best.h.name, name:best.f.name };
  s.stage = 2;
  const line = `The crowd has decided who ${g.name}'s equal is: ${best.f.name} of House ${best.h.name}. It has decided this the way crowds do, out loud and all at once, and now the only question anyone in Capua is asking is when the two of them meet.`;
  chron(d, line, "bad"); sagaLog(d, `${g.name}'s road runs through ${best.f.name} of House ${best.h.name}.`);
}
function issueReckoning(d){
  const s = d.saga; if(!s || !s.foe) return false;
  if((d.deadlines||[]).some(x=>x.kind==="challenge")) return false;
  const g = d.gladiators.find(x=>x.id===s.gid); if(!g || g.status!=="active") return false;
  const h = houseOf(d, s.foe.house);
  if(!h){ s.stage = 1; s.foe = null; return false; }   // the rival's house folded; his story finds another equal
  let f = h.fighters.find(x=>x.id===s.foe.fid && !x.injury);
  if(!f) f = h.fighters.filter(x=>!x.injury).sort((a,b)=>b.pfame-a.pfame)[0];
  if(!f) return false;
  s.foe = { fid:f.id, house:h.name, name:f.name };
  addDeadline(d, { kind:"challenge", saga:true, gid:g.id, name:g.name, house:h.name, lan:lanistaOf(h.name).name,
    fid:f.id, foe:f.name, due:d.week+ri(4,7), purse: rnd(600 + R()*500), met:false });
  s.stage = 3;
  chron(d, `It is set. ${g.name} against ${f.name}, named and dated, the bout the whole season has been leaning toward. Capua will close its shops for it.`, "bad");
  sagaLog(d, `The reckoning is set — ${g.name} against ${f.name}.`);
  return true;
}
function sagaFree(d, g){
  /* the champion's freedom — the road's best ending. Frees him with full ceremony,
     without the strict rudis gate, because the story has earned it. */
  g.status = "freed";
  (d.freed = d.freed || []).push({ name:fullName(g), week:d.week, wins:g.wins||0, cls:g.cls });
  d.fame += 80;
  patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor+5,0,100); }); recomputeFavor(d);
  d.unrest = clamp(d.unrest-14, 0, 100);
  addRep(d, "mercy", 20);
  d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale = clamp(o.morale+8,0,100); o.defiance = clamp(o.defiance-10,0,100); o.regard = clamp(regardOf(o)+7,0,100); } });
  if(g.ambition && g.ambition.kind==="freedom") ambitionMet(d, g);
  { tieList(d).filter(t=>(t.a===g.id||t.b===g.id) && t.kind==="brother").forEach(t=>{
      const o = d.gladiators.find(x=>x.id===(t.a===g.id?t.b:t.a));
      if(o && o.status==="active") remember(d, o, "freedKin"); }); }
  kinReact(d, g.id, "brother", 16, -10);
  favourLost(d, g, "freed"); dropTies(d, g.id);
  chron(d, `${fullName(g)} takes the wooden sword in front of a Capua that has come only to see it. He does not weep and he does not gloat; he raises the rudis once, the way he raised the gladius a hundred times, and walks out of your house a free man. They will tell this for years, and every telling is your house's name.`, "good");
  offerDoctore(d, g, "rudis");
}
function endSaga(d, g){
  if(!d.saga) return;
  const nm = d.saga.name;
  d.flags.sagaCool = d.week;
  if(g && g.status==="dead") chron(d, `The story the crowd was telling about ${nm} ends the way half of them always do — on the sand, mid-sentence. They will finish it for him, and it will not be true, and it will not matter.`, "bad");
  d.saga = null;
}
function sagaWeek(d){
  const s = d.saga;
  if(!s){ if(R()<0.5) igniteSaga(d); return; }
  const g = d.gladiators.find(x=>x.id===s.gid);
  if(!g || g.status!=="active"){ endSaga(d, g); return; }
  if(s.stage>=4) return;   // reckoning won — the freedom fork is scheduled and fires with priority via fireArc
  if(R()<0.22) sagaBeat(d);
  if(s.stage<2 && s.renown>=42) nameRival(d);
  if(s.stage===2 && s.renown>=70 && !(d.deadlines||[]).some(x=>x.kind==="challenge")) issueReckoning(d);
  if(s.stage<3) s.renown = clamp(s.renown + 1.2, 0, 100);
}

/* ---- THE FAVOURITE ----
   The crowd does not love skill; it loves spectacle. A man who wins with flair and
   a full house builds a following (g.fans) that fills the stands and fattens the
   purse — and turns on you if you bench him, sell him, or bury him. Distinct from
   renown: fans are the mob's affection, quick to earn and quick to cool. */
const fansOf = g => clamp(g && g.fans!=null ? g.fans : 0, 0, 100);
const isFavourite = g => fansOf(g) >= 55;
const fanWord = v => v>=82?"an idol of the mob" : v>=55?"a crowd favourite" : v>=30?"a following of his own" : v>=12?"a few admirers" : "unknown to the crowd";
const fanPurse = g => 1 + fansOf(g)/100 * 0.4;    /* the seats fill for the name alone */
function fanGain(res, g, tactic){
  return clamp((res.crowd-38)/8 + (tactic==="showboat"?4:0) + ((g.sho||0)>58?2:0)
    + (g.traits && g.traits.includes("Showman")?3:0) + (res.bDies?2:0), 0, 15);
}
/* the mob does not forgive losing one of its own */
function loseFavourite(d, g, how){
  const f = fansOf(g);
  if(f < 40) return;
  const bite = how==="sold" ? 1 : how==="dead" ? 0.8 : 0.5;
  facMove(d, "mob", -(6 + f/12) * bite);
  d.unrest = clamp(d.unrest + (3 + f/22) * bite, 0, 100);
  d.fame = Math.max(0, d.fame - rnd((6 + f/14) * bite));
  if(how==="sold") chron(d, `The mob does not care what ${g.name} cost or fetched. It cared that he was theirs, and you sold him, and it will remember that longer than he does.`, "bad");
}
function favouriteWeek(d){
  for(const g of d.gladiators){
    if(g.status!=="active") continue;
    if(g.fans==null){ g.fans = 0; continue; }
    const idle = d.week - (g.lastFought!=null ? g.lastFought : d.week);
    if(idle >= 2) g.fans = clamp(g.fans - (2 + (idle>=5?2:0)), 0, 100);   /* the crowd forgets a man it cannot see */
  }
}

/* ---- POACHING ----
   A rival with a grudge does not only want to beat your men. He wants them.
   A discontented gladiator is a door left open, and they know which of yours is which. */
function poachTarget(d, h){
  /* a man who would follow you anywhere does not take another house's coin */
  const act = activeG(d).filter(g=>g.defiance>=45 && !isAuctor(g) && !regardLoyal(g));
  if(!act.length) return null;
  return act.reduce((m,g)=> (g.defiance + gladValue(g)/60) > (m.defiance + gladValue(m)/60) ? g : m, act[0]);
}
function startPoach(d){
  if(d.poach || !d.rivals) return;
  const cands = d.rivals.filter(x=>x.grudge>=35);
  if(!cands.length) return;
  const h = cands.sort((a,b)=>(b.grudge*lanistaOf(b.name).poach)-(a.grudge*lanistaOf(a.name).poach))[0];
  const g = poachTarget(d, h);
  if(!g) return;
  d.poach = { house:h.name, gid:g.id, weeks:3 };
  chron(d, `${g.name} was seen at the wall after dark, talking to a man in ${lanistaOf(h.name).name}'s colours. ${PR(g).He} did not come to you about it.`, "bad");
}
function defect(d, p){
  const g = d.gladiators.find(x=>x.id===p.gid);
  const h = d.rivals && d.rivals.find(x=>x.name===p.house);
  if(!g || g.status!=="active"){ d.poach = null; return; }
  g.status = "escaped"; g.fateNote = "defected";
  d.defected = d.defected || [];
  d.defected.push({ name:fullName(g), house:p.house, week:d.week });
  if(h){
    const f = makeRivalFighter(d, h.name, 55);
    ["str","agi","end","tec","sho","dis","potential"].forEach(k=>{ f[k] = g[k]; });
    f.name = g.name; f.nick = g.nick; f.cls = g.cls; f.origin = g.origin; f.kit = g.kit;
    f.wins = g.wins; f.losses = g.losses; f.kills = g.kills; f.pfame = g.pfame;
    f.beatYou = 0; f.lostToYou = 0; f.wasYours = true;
    h.fighters.push(f);
    h.grudge = clamp(h.grudge - 10, 0, 100);
  }
  const kin = kinReact(d, g.id, "brother", -14, 8);
  dropTies(d, g.id);
  d.unrest = clamp(d.unrest + 8 + kin.length*3, 0, 100);
  d.gladiators.forEach(o=>{ if(o.status==="active") o.defiance = clamp(o.defiance+4,0,100); });
  d.fame = Math.max(0, d.fame - 10);
  chron(d, `${fullName(g)} is gone. House ${p.house} paraded him at the market this morning in their colours, and your cells watched from the yard.`, "bad");
  d.poach = null;
}
function poachWeek(d){
  if(d.poach){
    d.poach.weeks--;
    if(d.poach.weeks<=0) defect(d, d.poach);
    return;
  }
  const eager = (d.rivals||[]).reduce((m,h)=>Math.max(m, h.grudge>=35 ? lanistaOf(h.name).poach : 0), 0);
  if(R() < 0.07*Math.max(1,eager)) startPoach(d);
}

/* ---- ROME ----
   The invitation is the end of the run whichever way it falls. Three bouts on the
   imperial sand, where a lanista's Capuan standing buys him precisely nothing. */
const ROME_BOUTS = 3;
const ROME_FAME = 1000;      // the imperial games are the summit, not the next rung up
const ROME_COOLDOWN = 45;    // weeks the city forgets you between campaigns
const romeReady = d => !d.rome && !d.romeOffer && !d.over && d.fame >= ROME_FAME - (d.flags.romeEarly?150:0)
  && (d.flags.primusHeld||0) >= 1                                          // prove it in Capua first
  && (!d.flags.romeDeclined || d.week - d.flags.romeDeclined >= 30)
  && (!d.flags.romeReturned || d.week - d.flags.romeReturned >= ROME_COOLDOWN)
  && patronsOf(d).some(p=>p.rank==="senator" && p.favor>=70)
  && activeG(d).length >= 2;

/* ---- WHAT THEY ASK YOU FOR ----
   They remember, they refuse, they form ties and they carry ambitions, and in ninety
   versions not one of them has ever asked you for anything directly. A man who has
   been here long enough and thinks well enough of you will come and stand in front
   of your table. Saying no is always allowed and always costs. */
const ASKS = {
  brother: { w:10, need:(d,g)=>{ const t = tieList(d).find(x=>(x.a===g.id||x.b===g.id) && x.kind==="brother" && (x.strength||0)>=40);
      if(!t) return false; const o = d.gladiators.find(x=>x.id===(t.a===g.id?t.b:t.a));
      return !!(o && o.status==="active"); },
    say:(d,g)=>{ const t = tieList(d).find(x=>(x.a===g.id||x.b===g.id) && x.kind==="brother" && (x.strength||0)>=40);
      if(!t) return null;
      const o = d.gladiators.find(x=>x.id===(t.a===g.id?t.b:t.a));
      return { text:`${fullName(g)} asks that ${o.name} not be sold. He does not ask for himself and he has clearly been working up to it for some weeks.`,
        choices:["Give him your word","Promise nothing"], oid:o.id }; },
    yes:(d,g,ex)=>{ d.flags.noSell = [...(d.flags.noSell||[]), ex.oid];
      g.regard = clamp(regardOf(g)+16,0,100); remember(d, g, "kept");
      activeG(d).forEach(x=>{ x.regard = clamp(regardOf(x)+3,0,100); });
      return `You give it. It costs you nothing today and it is now a thing you have said out loud in front of a man who will remember it.`; },
    no:(d,g)=>{ g.regard = clamp(regardOf(g)-14,0,100); g.morale = clamp(g.morale-10,0,100);
      remember(d, g, "refused");
      return `You promise nothing, which is the honest answer. He says he understands, and he does, and it does not help.`; } },
  match:   { w:9, need:(d,g)=>g.wins >= 4 && (d.circuit||[]).some(f=>f.beatYou>0),
    say:(d,g)=>{ const f = pick((d.circuit||[]).filter(x=>x.beatYou>0)) || {name:"the man"};
      return { text:`${fullName(g)} wants a particular man. ${f.name} put him down in front of a house that laughed, and he has been carrying it since, and he would like it seen to.`,
        choices:["Arrange it","Tell him he fights who he is given"], fid:f.id, fname:f.name }; },
    yes:(d,g,ex)=>{ d.flags.wantMatch = { gid:g.id, fid:ex.fid, until:d.week+14 };
      g.regard = clamp(regardOf(g)+11,0,100); g.morale = clamp(g.morale+12,0,100); g.form = clamp(formOf(g)+18,-100,100);
      return `You will put it in front of the editor. He does not thank you and he trains differently from that afternoon on.`; },
    no:(d,g)=>{ g.regard = clamp(regardOf(g)-9,0,100); g.morale = clamp(g.morale-8,0,100);
      return `He fights who he is given. That is the arrangement, he knows it is the arrangement, and he asked anyway.`; } },
  year:    { w:8, need:(d,g)=>rudisEligible(g) && regardOf(g) >= 60,
    say:(d,g)=>({ text:`${fullName(g)} has earned the wooden sword and knows it. He is asking for one more year before you give it to him — he wants to go out at the top and he would like the house to have the season.`,
      choices:["One more year, then","Free him now"] }),
    yes:(d,g)=>{ g.plan = null; g.regard = clamp(regardOf(g)+14,0,100);
      d.flags.oneMoreYear = { gid:g.id, until:d.week + YEAR_WEEKS };
      activeG(d).forEach(x=>{ x.morale = clamp(x.morale+5,0,100); });
      return `He stays. Every man in that block watched somebody choose another year of this and could not tell you why it made them feel better.`; },
    no:(d,g)=>{ grantRudis(d, g.id);
      return `You free him anyway, over his own objection, which is a strange way to be generous and is generous.`; } },
  burial:  { w:7, need:(d,g)=>!d.collegium && (d.fallen||[]).length >= 2,
    say:(d,g)=>({ text:`${fullName(g)} asks about the burial society, on behalf of men who did not want to ask. Three denarii a week each, and a name cut in stone instead of a ditch.`,
      choices:["Start it","Not this year"] }),
    yes:(d,g)=>{ d.collegium = { since:d.week, buried:0 };
      activeG(d).forEach(x=>{ x.regard = clamp(regardOf(x)+8,0,100); x.morale = clamp(x.morale+8,0,100); });
      d.unrest = clamp(d.unrest-8,0,100);
      return `It is started. The men pay into it themselves and it is somehow still the best thing you have done for them.`; },
    no:(d,g)=>{ activeG(d).forEach(x=>{ x.regard = clamp(regardOf(x)-5,0,100); });
      d.unrest = clamp(d.unrest+6,0,100);
      return `Not this year. He nods, and goes back to the yard, and tells them, and you do not hear about it again in words.`; } },
  woman:   { w:6, need:(d,g)=>g.wins >= 6 && regardOf(g) >= 55 && !g.flags,
    say:(d,g)=>({ text:`There is a woman in the town. ${fullName(g)} would like leave to see her on the days he is not fighting, which is not a thing a man in his position is owed and he knows that too.`,
      choices:["Let him go","He stays behind the wall"] }),
    yes:(d,g)=>{ g.flags = 1; g.regard = clamp(regardOf(g)+18,0,100); g.morale = clamp(g.morale+14,0,100);
      g.defiance = clamp(g.defiance+6,0,100);
      return `He goes on the quiet days and comes back every time. He now has a reason to want to live through this, which cuts both ways and you knew that when you said yes.`; },
    no:(d,g)=>{ g.regard = clamp(regardOf(g)-12,0,100); g.morale = clamp(g.morale-14,0,100);
      return `He stays behind the wall. It is the correct decision for a lanista and you are not required to feel any particular way about it.`; } },
};
const ASK_KEYS = Object.keys(ASKS);
function askWeek(d){
  if(d.over || d.rome || d.city || d.travel || d.pendingEvent) return;
  const men = activeG(d).filter(g=>regardOf(g) >= 45 && ((g.wins||0)+(g.losses||0)) >= 3 && !(d.flags.asked||[]).includes(g.id));
  if(!men.length) return;
  if(R() > 0.06) return;
  const g = pick(men);
  const fit = ASK_KEYS.filter(k=>{ try { return ASKS[k].need(d, g); } catch(e){ return false; } });
  if(!fit.length) return;
  const tot = fit.reduce((n,k)=>n + ASKS[k].w, 0);
  let x = R()*tot, k = fit[0];
  for(const c of fit){ x -= ASKS[c].w; if(x<=0){ k=c; break; } }
  let ex = null;
  try { ex = ASKS[k].say(d, g); } catch(e){ return; }
  if(!ex) return;
  d.flags.asked = [...(d.flags.asked||[]), g.id];
  d.pendingEvent = { id:"ask", title:"He Wants A Word", text:ex.text,
    choices:ex.choices, data:{ k, gid:g.id, ex } };
}

/* ---- WAYS TO BE FINISHED ----
   Debt, ruin, rebellion, and the lanista dying. But there is now a law with heat, a
   reputation the town holds, patrons who can turn, and rivals with grudges — four
   systems that generate pressure and cannot conclude anything. They can now. */
const RUINS = {
  banned:  { need:d=>lawOf(d).heat >= 90 && (lawOf(d).edicts||[]).length >= 2 && inBreach(d).length >= 2 && lawOf(d).fines > 0,
    warnAt:72,
    warn:d=>`A man from the aedile's office has been in the forum asking who else has dealt with your house, which is not a thing he does idly.`,
    title:"STRUCK FROM THE ROLL",
    text:o=>`The aedile does not send for you. He publishes. Your house is struck from the roll of ludi permitted to supply the games at Capua, and the notice is nailed up where the notices go, and it names ${o.edicts} edicts by number.

There is no appeal because there is no procedure to appeal to. Men who owe you money stop being at home. ${o.name} sells the racks to Verrus at a price that is an opinion about you, and the men go, one at a time, to houses that are still on the roll.

Nothing burned. Nobody died. It took four years to build and eleven days to be told it was over.` },
  disgrace:{ need:d=>repOf(d,"blood") >= 88 && d.favor <= 6 && facOf(d,"front") <= 12,
    warnAt:0,
    warn:d=>`The front rows have stopped coming to your cards. Not all of them and not loudly, but the good seats are emptier every time and the editor has noticed before you did.`,
    title:"NOBODY WILL BOOK YOU",
    text:o=>`It is not a decision anybody makes. The editors simply stop asking, one after another, over about two months, and each of them has a reason that is not the reason.

You are the house that kills, and Capua has decided it would rather watch something else. The pits will still have you. The pits do not pay enough to feed ${o.men} men and you have known that for some time.

${o.name} goes out the way houses actually go out, which is quietly, and to a great deal of politeness.` },
  ruined:  { need:d=>(d.rivals||[]).some(h=>(h.grudge||0)>=95) && d.fame < 120 && d.gladiators.filter(g=>!isGone(g)).length <= 2,
    warnAt:0,
    warn:d=>`House ${((d.rivals||[]).find(h=>(h.grudge||0)>=80)||{name:"a rival"}).name} is buying every man you look at, a day before you look at him, and paying too much on purpose.`,
    title:"THEY TOOK IT APART",
    text:o=>`No single thing did it. ${o.rival} outbid you on the block for a year, took two of your men with money you could not match, and made sure every editor in Capua heard about the afternoon at the amphitheatre.

You are down to ${o.men} men and a yard, and he has fourteen and the aedile's ear. There is a version of this where you hold on for another season and both of you know exactly what it looks like.

He sends nothing, says nothing, and does not come to watch you close. That is the part you will think about.` },
};
const RUIN_KEYS = Object.keys(RUINS);
function ruinWeek(d){
  if(d.over || d.rome) return;
  for(const k of RUIN_KEYS){
    const R2 = RUINS[k];
    let hit = false;
    try { hit = R2.need(d); } catch(e){ hit = false; }
    if(!hit) continue;
    /* it never lands without warning first */
    d.flags.ruinWarn = d.flags.ruinWarn || {};
    if(!d.flags.ruinWarn[k]){
      d.flags.ruinWarn[k] = d.week;
      chron(d, R2.warn(d), "bad");
      return;
    }
    if(d.week - d.flags.ruinWarn[k] < 6) return;
    const rival = ((d.rivals||[]).sort((a,b)=>(b.grudge||0)-(a.grudge||0))[0]||{name:"a rival"}).name;
    d.over = { kind:k, name:d.name, men:d.gladiators.filter(g=>!isGone(g)).length,
      edicts:(lawOf(d).edicts||[]).length, rival, years:yearOf(d) };
    return;
  }
  /* pressure that comes off means the warning lapses */
  if(d.flags.ruinWarn) for(const k of Object.keys(d.flags.ruinWarn)){
    let still = false;
    try { still = RUINS[k].need(d); } catch(e){}
    if(!still){ delete d.flags.ruinWarn[k];
      chron(d, `Whatever was about to happen to this house has stopped being about to happen.`, "good"); }
  }
}
const ruinPending = d => { const w = d.flags && d.flags.ruinWarn; if(!w) return null;
  const k = Object.keys(w)[0]; return k ? { kind:k, since:w[k], weeks: 6 - (d.week - w[k]) } : null; };

/* ---- WHAT YOU CAN DO BACK ----
   They poach, they sabotage, they bribe editors and they send men round. Since v0.2
   you have had no way to do any of it in return. Every one of these costs coin, may
   fail publicly, and puts heat on a house that the magistrate is already watching. */
const GAMBITS = {
  poach:   { name:"Put money in front of his best man", cost:d=>rnd(420 + d.fame*1.2),
    blurb:"A quiet offer, through somebody else, to the man who wins his cards. It is not legal and it is extremely common.",
    odds:d=>0.42 + facPurse(d)*0.06 - lawOf(d).heat*0.002,
    win:(d,h)=>{ const r = (h.fighters||[]).slice().sort((a,b)=>(b.wins||0)-(a.wins||0))[0];
      if(!r) return `There was nobody worth the money.`;
      h.fighters = (h.fighters||[]).filter(x=>x!==r);
      const g = genGladiator(d, clamp(52 + (r.wins||0)*2.4, 52, 88));
      g.name = r.name; g.wins = r.wins||0; g.pfame = 40 + (r.wins||0)*5; g.regard = 44;
      if(d.gladiators.filter(x=>!isGone(x)).length < 8) d.gladiators.push(g);
      h.grudge = clamp(h.grudge + 30, 0, 100);
      return `${r.name} walks out of House ${h.name} in the night and into yours. Everybody knows. Nobody can prove it.`; },
    lose:(d,h)=>{ h.grudge = clamp(h.grudge + 18, 0, 100);
      return `The man tells his lanista, who tells the town. The money is gone and so is any doubt about what kind of house you run.`; },
    heat:9 },
  bribe:   { name:"Buy the editor's ear", cost:d=>rnd(300 + d.fame*0.9),
    blurb:"He decides who is matched against whom. He is not well paid and he has expensive habits.",
    odds:d=>0.58 + (aedileOn(d) && d.aedile.friendly ? 0.14 : 0) - lawOf(d).heat*0.0025,
    win:(d,h)=>{ d.flags.editorBought = d.week + 12; h.grudge = clamp(h.grudge + 14, 0, 100);
      return `For the next few months your men are matched softly and House ${h.name}'s are not. Nobody says a word about it because everybody does it.`; },
    lose:(d,h)=>{ d.fame = Math.max(0, d.fame - 22); lawOf(d).heat = clamp(lawOf(d).heat + 14, 0, 100);
      return `He takes the money and mentions it at dinner to somebody who mentions it to the aedile.`; },
    heat:12 },
  poison:  { name:"Get at his steel", cost:d=>rnd(220 + d.fame*0.5),
    blurb:"A man who works his armoury, a file, and three of his best blades that will go at exactly the wrong moment.",
    odds:d=>0.5 - lawOf(d).heat*0.003,
    win:(d,h)=>{ h.fame = Math.max(35, (h.fame||100) - 40);
      (h.fighters||[]).slice(0,2).forEach(x=>{ x.wins = Math.max(0,(x.wins||0)-1); });
      h.grudge = clamp(h.grudge + 26, 0, 100);
      return `Two of his men go down in a fortnight on afternoons they should have won, and House ${h.name} cannot work out why.`; },
    lose:(d,h)=>{ lawOf(d).heat = clamp(lawOf(d).heat + 22, 0, 100); d.fame = Math.max(0, d.fame - 30);
      h.grudge = clamp(h.grudge + 34, 0, 100);
      return `His armourer catches it, and the man you paid gives your name up before anybody has to hit him.`; },
    heat:16 },
  word:    { name:"Put a word about", cost:d=>rnd(140 + d.fame*0.4),
    blurb:"Nothing that can be traced. Six conversations in the right places about what happened in his cells last winter.",
    odds:d=>repStyle(d)==="craft" ? 0.72 : 0.6,
    win:(d,h)=>{ h.fame = Math.max(35, (h.fame||100) - 55); h.grudge = clamp(h.grudge + 10, 0, 100);
      return `Within a month House ${h.name} is a house people have heard something about, and nobody can say what or from whom.`; },
    lose:(d,h)=>{ d.fame = Math.max(0, d.fame - 15); h.grudge = clamp(h.grudge + 20, 0, 100);
      return `It gets back to him with your name attached inside a week, because six conversations is two too many.`; },
    heat:5 },
};
const GAM_KEYS = Object.keys(GAMBITS);
const gambitDone = (d,k) => (d.gambits||{})[k] || 0;
const gambitReady = d => !d.flags.gambitWeek || d.week - d.flags.gambitWeek >= 6;
function runGambit(d, k, houseName){
  const G = GAMBITS[k]; if(!G || !gambitReady(d)) return null;
  const h = (d.rivals||[]).find(x=>x.name===houseName); if(!h) return null;
  const cost = G.cost(d);
  if(d.gold < cost) return null;
  d.gold -= cost;
  d.flags.gambitWeek = d.week;
  d.gambits = Object.assign({}, d.gambits||{}, { [k]: gambitDone(d,k)+1 });
  /* it gets harder each time you use the same trick */
  const p = clamp(G.odds(d) - gambitDone(d,k)*0.07, 0.12, 0.86);
  const won = R() < p;
  lawOf(d).heat = clamp(lawOf(d).heat + (won ? G.heat*0.4 : G.heat), 0, 100);
  addRep(d, "blood", won ? 2 : 5);
  const line = won ? G.win(d, h) : G.lose(d, h);
  chron(d, line, won ? "good" : "bad");
  return { won, line, cost };
}
const editorBought = d => !!(d.flags.editorBought && d.week < d.flags.editorBought);

/* ---- WHAT BECAME OF THEM ----
   The rudis is the moral centre of this game and a freed man has always vanished
   into a list. He is a person with a trade and nowhere else to use it, and Capua is
   not a large town. He comes back. */
const FREEDMEN = {
  doctore: { w:10, name:"He comes back to teach",
    need:(d,f)=>!d.doctore && f.wins >= 8,
    say:(d,f)=>`${f.name} is at the gate with nothing to say for himself except that he has been three months at a trade he is not good at, and he knows this yard.`,
    run:(d,f)=>{ const doc = makeDoctore(d, clamp(40 + f.wins*2.2, 40, 82));
      doc.name = f.name.split(",")[0]; doc.fromHouse = true; doc.fee = 0;
      doc.tag = "who was freed here"; doc.pastLine = `Fought ${f.wins} times under your colours and was given the wooden sword for it. He does not need telling how any of this works.`;
      d.doctore = doc;
      activeG(d).forEach(g=>{ g.morale = clamp(g.morale+9,0,100); g.regard = clamp(regardOf(g)+7,0,100); });
      return `He takes the doctore's place for nothing but keep. Every man in that block just watched what the wooden sword is actually worth.`; } },
  lanista: { w:8, name:"He sets up on his own",
    need:(d,f)=>f.wins >= 10 && (d.rivals||[]).length < 5,
    say:(d,f)=>`${f.name} has bought two men and a yard on the Neapolis road. He learned the trade somewhere and everybody knows where.`,
    run:(d,f)=>{ d.fame += 25; addRep(d, "craft", 8);
      return `There is a fourth house in the bay now and it fights the way yours does, which people notice and say out loud.` } },
  crowd:   { w:9, name:"He is in the front row",
    need:(d,f)=>true,
    say:(d,f)=>`${f.name} is in the stands, in a decent seat, on the afternoon one of yours goes out. He does not shout. He is simply there and a number of people notice him being there.`,
    run:(d,f)=>{ FAC_KEYS.forEach(k=>facMove(d, k, 4)); d.fame += 8;
      activeG(d).forEach(g=>{ g.regard = clamp(regardOf(g)+4,0,100); });
      return `The block hears about it before you do.` } },
  gift:    { w:7, name:"He sends something",
    need:(d,f)=>true,
    say:(d,f)=>`A cart from ${f.name}, who is apparently doing well enough at something to send one. Wine, oil, and forty denarii he does not explain.`,
    run:(d,f)=>{ d.gold += 40; activeG(d).forEach(g=>{ g.morale = clamp(g.morale+6,0,100); });
      return `The men drink it and talk about him for a week, which is worth considerably more than the wine.` } },
  bad:     { w:6, name:"It did not go well",
    need:(d,f)=>true,
    say:(d,f)=>`Word comes that ${f.name} is sleeping under the arches by the river. A free man with one trade and nobody buying it, which is most of them.`,
    run:(d,f)=>{ d.unrest = clamp(d.unrest+5,0,100);
      activeG(d).forEach(g=>{ g.morale = clamp(g.morale-4,0,100); });
      return `The cells hear it the same day and it takes something off the wooden sword for a while.` } },
  back:    { w:7, name:"He asks to come back",
    need:(d,f)=>d.gladiators.filter(g=>!isGone(g)).length < 8,
    say:(d,f)=>`${f.name} wants to fight again. Not sold, not bound — signed, for money, like any auctoratus. He has thought about it and he would rather do the thing he is good at.`,
    run:(d,f)=>{ const g = genGladiator(d, clamp(48 + f.wins*2, 48, 88));
      g.name = f.name.split(",")[0]; g.wins = f.wins; g.pfame = 60 + f.wins*4; g.regard = 82; g.sworn = "feast";
      g.auctor = { bouts: ri(6,12), served:0, wage: rnd(14 + f.wins*1.4) };
      d.gladiators.push(g);
      return `He signs for ${g.auctor.bouts} bouts at ${g.auctor.wage} a week. Every man in that block watches a free man choose this on purpose.` } },
};
const FM_KEYS = Object.keys(FREEDMEN);
function freedWeek(d){
  if(d.over || d.rome || d.city || d.travel || d.pendingEvent) return;
  /* a man who was freed here outranks the week's random draw */
  const pool = (d.freed||[]).filter(f=>!f.became && d.week - f.week >= 5);
  if(!pool.length) return;
  if(R() > 0.11) return;
  const f = pick(pool);
  const fit = FM_KEYS.filter(k=>{ try { return FREEDMEN[k].need(d, f); } catch(e){ return false; } });
  if(!fit.length) return;
  const tot = fit.reduce((n,k)=>n + FREEDMEN[k].w, 0);
  let x = R()*tot, k = fit[0];
  for(const c of fit){ x -= FREEDMEN[c].w; if(x<=0){ k=c; break; } }
  f.became = k;
  const F = FREEDMEN[k];
  d.pendingEvent = { id:"freedman", title:F.name, text:F.say(d, f),
    choices:["Go on"], data:{ k, man:{ name:f.name, wins:f.wins||0, cls:f.cls } } };
}

/* ---- WHAT YOU HAVE PROMISED ----
   A booking is one afternoon. Nothing in this game has ever held a house to anything
   longer than that. These are standing obligations: a season with one editor, an
   exclusive that shuts every other door, and a debt paid in men rather than coin. */
const PACTS = {
  season:  { name:"A season with one editor", weeks:YEAR_WEEKS, need:6,
    blurb:d=>`Six cards over the year, whenever he asks, at a fixed rate. He pays better than the open market and he does not ask twice.`,
    pay:d=>rnd(180 + d.fame*0.5), bonus:d=>rnd(900 + d.fame*2.2),
    kept:"He pays the balance without being asked and puts it about that your house keeps its word.",
    broke:"He does not shout. He tells four people who matter, quietly, over a month.",
    keptRun:d=>{ d.fame += 40; addRep(d, "craft", 10); patronsOf(d).forEach(p=>{ p.favor=clamp(p.favor+8,0,100); }); recomputeFavor(d); },
    brokeRun:d=>{ d.fame = Math.max(0, d.fame-45); addRep(d, "blood", 6);
      patronsOf(d).forEach(p=>{ p.favor=clamp(p.favor-16,0,100); }); recomputeFavor(d); } },
  exclusive:{ name:"An exclusive with the aedile", weeks:24, need:4,
    blurb:d=>`Four cards, and your men appear at no other editor's games in Capua for half a year. He is paying for the right to say your house is his.`,
    pay:d=>rnd(320 + d.fame*0.9), bonus:d=>rnd(1600 + d.fame*3),
    kept:"He is re-elected largely on the back of afternoons your men gave him, and he knows it.",
    broke:"He does not need to do anything. The aedile's office simply stops answering.",
    exclusive:true,
    keptRun:d=>{ d.fame += 55; if(d.aedile) d.aedile.friendly = true; lawOf(d).heat = clamp(lawOf(d).heat-20,0,100); },
    brokeRun:d=>{ d.fame = Math.max(0, d.fame-60); if(d.aedile){ d.aedile.friendly=false; d.aedile.hostile=true; }
      lawOf(d).heat = clamp(lawOf(d).heat+25,0,100); } },
  debt:    { name:"A debt paid in men", weeks:30, need:8,
    blurb:d=>`He forgives what you owe and you owe him eight afternoons instead. It is a worse rate than coin and it is available when coin is not.`,
    pay:()=>0, bonus:()=>0, forgives:true,
    kept:"The tablet is broken in front of you. Whatever else is true, you do not owe that man anything.",
    broke:"He wants the coin now, all of it, and he has been extremely patient about it up to this exact moment.",
    keptRun:d=>{ d.loan = null; d.fame += 15; activeG(d).forEach(g=>{ g.morale=clamp(g.morale+6,0,100); }); },
    brokeRun:d=>{ if(d.loan) d.loan.owed = rnd((d.loan.owed||400) * 1.4); d.fame = Math.max(0, d.fame-20); } },
};
const PACT_KEYS = Object.keys(PACTS);
const pactOf = d => d.pact || null;
const pactLeft = d => { const p = pactOf(d); return p ? Math.max(0, p.until - d.week) : 0; };
const pactOwed = d => { const p = pactOf(d); return p ? Math.max(0, p.need - p.done) : 0; };
const pactPace = d => { const p = pactOf(d); if(!p) return null;
  const left = pactLeft(d), owed = pactOwed(d);
  return owed === 0 ? "kept" : left <= 0 ? "failed" : owed > left ? "impossible" : owed >= left*0.6 ? "behind" : "comfortable"; };
const pactBlocks = (d, offer) => { const p = pactOf(d); if(!p) return false;
  const P = PACTS[p.kind]; if(!P || !P.exclusive) return false;
  return !!(offer && offer.festival && !offer.city && offer.editor !== p.editor); };
function offerPact(d){
  if(d.pact || d.over || d.rome || d.city || d.travel || d.pendingEvent) return;
  if(d.week < 20 || d.fame < 55) return;
  if((d.flags.pactsSeen||0) >= 3) return;
  if(R() > 0.045) return;
  const fit = PACT_KEYS.filter(k=>k !== "debt" || (d.loan && d.loan.owed > 0));
  const k = pick(fit); if(!k) return;
  const P = PACTS[k];
  d.flags.pactsSeen = (d.flags.pactsSeen||0) + 1;
  d.pendingEvent = { id:"pact", title:P.name,
    text:`${P.blurb(d)}${P.pay(d) ? ` Each card pays ${P.pay(d)} denarii, and there is ${P.bonus(d)} at the end of it if you finish.` : ""} ${P.need} cards, ${P.weeks} weeks.`,
    choices:["Give him your word", "Stay free"], data:{ k } };
}
function takePact(d, k){
  const P = PACTS[k]; if(!P) return;
  d.pact = { kind:k, need:P.need, done:0, until:d.week + P.weeks, began:d.week,
    editor:`the editor`, rate:P.pay(d), bonus:P.bonus(d) };
  chron(d, `You give your word: ${P.need} cards inside ${P.weeks} weeks. ${P.exclusive ? "And nobody else's games until it is done." : "It is not a thing you can quietly stop doing."}`, "info");
}
/* every card taken counts toward it */
function pactBout(d, offer){
  const p = pactOf(d); if(!p || !offer || !offer.festival) return;
  p.done++;
  if(p.rate) d.gold += p.rate;
}
function pactWeek(d){
  const p = pactOf(d); if(!p) return;
  if(pactOwed(d) === 0){
    const P = PACTS[p.kind];
    d.gold += p.bonus || 0;
    try { P.keptRun(d); } catch(e){}
    chron(d, `The word you gave is kept — ${p.need} cards inside ${d.week - p.began} weeks. ${P.kept}`, "good");
    d.pact = null; d.flags.pactsKept = (d.flags.pactsKept||0) + 1;
    return;
  }
  if(d.week >= p.until){
    const P = PACTS[p.kind];
    try { P.brokeRun(d); } catch(e){}
    chron(d, `The season runs out with ${pactOwed(d)} cards still owed. ${P.broke}`, "bad");
    d.pact = null; d.flags.pactsBroke = (d.flags.pactsBroke||0) + 1;
  }
}

/* ---- WHAT THE STANDS SAY ----
   Four factions with real standings, eleven beat kinds carrying full state, and not
   one voice among them. The stands disagree with each other on the same blow, and
   which of them you hear depends on who is in that venue and what they make of you. */
const LIGHT = ["Retiarius","Thraex","Dimachaerus","Hoplomachus"];
const VOICES = {
  parm: { who:"the parmularii", cheers:g=>LIGHT.includes(g.cls),
    good:["there, that is what the small shield is for","let him work, he is doing it properly","that is the whole art of it and the rest of you are asleep",
      "he does not need a door to hide behind","this is why we come","that is footwork, that is not luck",
      "he has been reading him for four rounds and there it is","the small shield, the small shield",
      "he did not have to be there and he was","let the butchers watch and learn something",
      "that is a man who has been taught, not a man who was bought","the whole thing turned on where he put his feet"],
    bad:["he is being crowded and they know it","get off him and let him fight","that is not fighting, that is leaning",
      "somebody get him off the wall","he has nowhere to go and they have made sure of it",
      "that is not a bout, that is a siege","he cannot breathe out there"],
    flat:["somebody starts a chant and it does not take"] },
  scut: { who:"the scutarii", cheers:g=>!LIGHT.includes(g.cls),
    good:["on the shield, on the shield, exactly on the shield","that is how it is done and it has always been how it is done",
      "walk through him","he has not moved a foot backwards all afternoon","let the other one dance",
      "he does not need to be clever, he needs to be there","the shield does not get tired",
      "that is weight and it beats art every afternoon of the year","stand, and let him come to you, and there it is",
      "no dancing, no nonsense, a man doing a job","he has been walking forward since the salute"],
    bad:["he is being pulled apart out there","hold, will you hold","he has lost his shape",
      "he is chasing and you cannot chase a man like that","the guard is gone, the guard has been gone for rounds",
      "somebody tell him to plant his feet"],
    flat:["a slow handclap starts on the shield side and stops"] },
  mob: { who:"the upper tiers", cheers:()=>true,
    good:["blood, blood, blood","finish him","that one felt like something","again, do that again","kill",
      "there it is, there it is","hit him again in the same place","that is what we came up the hill for",
      "do not let him up","the whole tier is on its feet and none of them could tell you why",
      "somebody starts a chant with his name in it and it takes"],
    bad:["what is this","get somebody out there who can do it","we paid for this",
      "boo, and it spreads","somebody throws something and misses","this is a rehearsal, not a bout",
      "put the beasts on, put anything on"],
    flat:["the upper tiers have started talking amongst themselves"] },
  front: { who:"the front rows", cheers:()=>true,
    good:["a small noise of approval that costs them nothing","one of them says, to nobody, that the boy has been taught well",
      "polite, and meant","a senator's man leans forward, which is as much as they ever do",
      "an aedile nods once and goes back to his conversation","somebody remarks that the house has clearly spent money on him",
      "two of them stop talking, which is the loudest thing they do","a magistrate's wife applauds and is looked at"],
    bad:["they look at their hands","somebody says loudly that this is beneath the town","a man in the front row does not look up at all",
      "a senator leaves early and makes sure it is noticed","somebody asks whether they intend to do this all afternoon",
      "the word vulgar is used, clearly, by somebody who wanted it heard"],
    flat:["the front rows are discussing something else entirely"] },
};
const V_KEYS = Object.keys(VOICES);
/* who is loud in this venue, and how do they feel about your house */
function crowdVoice(d, beat, g, offer){
  if(!beat || !g) return null;
  const loud = { crit:1, fall:1, appeal:1, spared:1, death:1, crowd:0.9, hit:0.45, gas:0.5, graze:0.2, clash:0.25 }[beat.kind];
  if(!loud) return null;
  if(R() > loud * 0.26) return null;
  /* the mob is louder in a big house, the front rows in a small one */
  const V2 = VEN(offer && offer.venue);
  const w = { parm:10, scut:10, mob: V2 && V2.crowd >= 0 ? 14 : 6, front: V2 && V2.crowd >= 0 ? 8 : 12 };
  const tot = V_KEYS.reduce((n,k)=>n + w[k], 0);
  let x = R()*tot, k = V_KEYS[0];
  for(const c of V_KEYS){ x -= w[c]; if(x<=0){ k=c; break; } }
  const F = VOICES[k];
  const standing = d ? facOf(d, k) : 40;
  const forHim = F.cheers(g);
  /* a faction that dislikes your house says less and means it less */
  if(standing < 20 && R() < 0.5) return null;
  const winning = beat.kind==="crit" || beat.kind==="spared" || (beat.actor==="A" && beat.kind==="hit");
  const line = (forHim && winning) ? pick(F.good)
    : (!forHim && winning) ? pick(F.bad)
    : (forHim && !winning) ? pick(F.bad)
    : pick(F.good);
  /* they use his name once he is somebody */
  const named = favourOf(g) >= 45 && R() < 0.4;
  return { who:F.who, line: named ? line.replace(/\bhe\b/, g.name).replace(/\bhim\b/, g.name) : line, fac:k };
}
/* the loudest thing the stands can do is nothing at all */
const SILENCES = [
  "The noise stops. That is the noise.",
  "Nobody in that whole house says anything, which is worse than any of it.",
  "Eight thousand people decide at the same moment not to make a sound.",
  "Somewhere up in the cheap tiers a single voice carries, and then stops itself.",
  "The quiet goes on a beat longer than anybody in that place is comfortable with.",
  "A house that was screaming a moment ago is now only a great many people breathing.",
];
function crowdSilence(beat, res){
  if(!beat || beat.kind !== "fall") return null;
  if(R() > 0.35) return null;
  return pick(SILENCES);
}

/* ---- A SEASON, NOT A WEEK ----
   Eight drills chosen weekly, each independent, none constraining another: that is
   bookkeeping, not strategy. A plan declares what a man is being made into over a
   season, runs itself, and pays only if you let it finish. */
const PLANSEASON = {
  wall:    { name:"Make him a wall", weeks:YEAR_WEEKS,
    blurb:"Stone, the post, and the measured square until he can be hit all afternoon and still be standing.",
    drills:["weights","palus","sand","weights","palus","hill","weights","sand","palus","weights","hill","palus","sand","weights","palus","hill","rest","palus"],
    pays:{ str:5, end:6, dis:3 }, trait:"Iron Hide",
    done:"He does not go backwards any more. Men who have fought him say it is like working against a door." },
  quick:   { name:"Make him quick", weeks:YEAR_WEEKS,
    blurb:"Footwork, the pila, and the hill, over and over, until the distance is something he owns.",
    drills:["sand","pila","hill","sand","pila","sand","hill","pila","sand","hill","sand","pila","hill","sand","pila","sand","rest","hill"],
    pays:{ agi:7, tec:4, end:3 }, trait:"Swift Learner",
    done:"He is somewhere else by the time the blow arrives, and he has stopped thinking about it." },
  crowd:   { name:"Make him theirs", weeks:12,
    blurb:"Flourishes, the turn, the pause before the kill. It is not how you win. It is how you are paid.",
    drills:["crowd","palus","crowd","spar","crowd","sand","crowd","palus","crowd","spar","crowd","rest"],
    pays:{ sho:9, tec:3 }, trait:"Showman",
    done:"The stands know him before the herald finishes, which is worth more than most of what he can do with a sword." },
  smith:   { name:"Teach him the trade", weeks:14,
    blurb:"Sparring and the post, matched against better men every week, learning the thing that cannot be drilled alone.",
    drills:["spar","palus","spar","pila","spar","palus","spar","sand","spar","palus","spar","pila","rest","spar"],
    pays:{ tec:8, dis:4, agi:2 }, trait:"Stoic",
    done:"He has stopped making the mistakes and started making other men make them." },
  mend:    { name:"Bring him back", weeks:8,
    blurb:"Rest, the hill, and nothing that will open anything. Slow, and the only thing that works.",
    drills:["rest","hill","rest","sand","hill","rest","hill","sand"],
    pays:{ end:4, dis:2 }, heal:true,
    done:"He is not the man he was and he is a great deal closer to it than he was two months ago." },
};
const PS_KEYS = Object.keys(PLANSEASON);
const seasonOfMan = g => (g && g.plan) || null;
const planWeeksLeft = g => { const p = seasonOfMan(g); return p ? Math.max(0, p.weeks - p.done) : 0; };
const planPct = g => { const p = seasonOfMan(g); return p ? Math.round(p.done / p.weeks * 100) : 0; };
function startPlan(d, g, k){
  const P = PLANSEASON[k];
  if(!P || !g || seasonOfMan(g)) return false;
  const C = docCreed(d);
  const weeks = Math.max(6, Math.round(P.weeks * (C && C.train > 1 ? 0.9 : C && C.train < 1 ? 1.1 : 1)));
  g.plan = { kind:k, weeks, done:0, began:d.week, broke:false };
  chron(d, `${fullName(g)} goes on a season: ${P.name.toLowerCase()}. ${weeks} weeks of it, and it is worth nothing at all until it is finished.`, "info");
  return true;
}
function breakPlan(d, g, why){
  const p = seasonOfMan(g); if(!p) return;
  const P = PLANSEASON[p.kind];
  g.plan = null;
  g.morale = clamp(g.morale - 6, 0, 100);
  remember(d, g, "broken");
  chron(d, `${fullName(g)} comes off his season at ${Math.round(p.done/p.weeks*100)} in the hundred. ${why||"The work is not wasted and it is not finished either."}`, "bad");
}
/* the drill for this week comes off the plan, not off you */
const planDrill = g => { const p = seasonOfMan(g); if(!p) return null;
  const P = PLANSEASON[p.kind]; if(!P) return null;
  return P.drills[p.done % P.drills.length] || "palus"; };
function planWeek(d, g){
  const p = seasonOfMan(g); if(!p) return;
  if(g.status !== "active"){ if(g.status === "injured" && PLANSEASON[p.kind].heal){} else return; }
  p.done++;
  if(p.done < p.weeks) return;
  /* it finished, and finishing is the whole point */
  const P = PLANSEASON[p.kind];
  for(const [k,v] of Object.entries(P.pays||{})) g[k] = clamp(g[k] + v, 8, statCap(g,k));
  if(P.trait && !(g.traits||[]).includes(P.trait) && TRAITS[P.trait]) g.traits = [...(g.traits||[]), P.trait];
  g.morale = clamp(g.morale + 14, 0, 100);
  g.regard = clamp(regardOf(g) + 9, 0, 100);
  g.plan = null;
  d.fame += 6;
  chron(d, `${fullName(g)} finishes his season. ${P.done}`, "good");
}

/* ---- SOMEWHERE TO PRACTISE ----
   Every decision in this game is permanent from the first morning. A person who has
   never seen the arena has to risk a man to find out what it is. This is somebody
   else's bout, on somebody else's sand, with nothing of yours in it. */
function demoFight(){
  const d = newGameState("The House of Batiatus", "champion", "DEMO-SAND");
  d.fame = 240; d.favor = 30;
  const a = activeG(d)[0];
  if(!a) return null;
  a.name = "Oenomaus"; a.nick = "the Wall"; a.cls = "Murmillo";
  a.kit = defaultKit("Murmillo");
  STATS.forEach(k=>{ a[k] = 64; });
  a.str = 72; a.end = 70; a.wins = 8; a.losses = 2; a.pfame = 70; a.fatigue = 0; a.lastFought = -9;
  const offer = makePitOffer(d, a, "standard");
  offer.venue = "amphi"; offer.sky = "fair"; offer.tier = 2;
  offer.opp.name = "Barca"; offer.opp.cls = "Thraex"; offer.opp.kit = defaultKit("Thraex");
  STATS.forEach(k=>{ offer.opp[k] = 62; });
  offer.opp.wins = 7; offer.opp.losses = 3;
  const res = doFight(d, a.id, offer, "measured");
  const out = res.crux ? (()=>{ const p = res.pending; p.beats = res.beats;
    return doFight(d, p.gid, p.offer, p.tactic, p.bet, p, "cloth"); })() : res;
  out.demo = true;
  out.crux = false; out.pending = null;
  out.sum = [`Somebody else's afternoon, on somebody else's sand. Nothing here is yours and nothing here counts.`,
    `That is the whole of it. You choose who goes out and against whom, and then you watch. The men decide the rest, out of what you have trained into them and what they think of you.`];
  return out;
}

/* ---- THE YEARS THAT COME AFTER ----
   Measured: a mature house faces seven demands a week and sees nothing it has not
   seen before — first-time events fall from 86 in the opening thirty weeks to zero
   past week 150. The late game asks more and gives less. These are things that only
   a house with a decade behind it can be offered. */
const LATE = {
  memoir:  { need:d=>yearOf(d) >= 8, w:8,
    title:"A Man From Rome With Questions",
    text:d=>`He is writing something about the trade and somebody told him your house was worth the journey. He wants to know how many you have buried, how many you have freed, and whether you would say the whole thing was worth doing. He writes down everything you say, including the pauses.`,
    choices:["Tell him the truth", "Tell him what he came for", "Send him away"],
    run:(d,i)=>{ if(i===0){ const R2=houseRecord(d); d.fame += 20 + R2.freed*4;
        addRep(d, R2.freed > R2.lost ? "mercy" : "blood", 8);
        return `You give him the numbers and he does not flinch at any of them, which is somehow worse. ${R2.freed} out on their own legs and ${R2.lost} not.`; }
      if(i===1){ d.fame += 45; addRep(d, "show", 10);
        return `You give him the version with the good afternoons in it and none of the others. It will be read by people who have never smelled the place.`; }
      d.fame = Math.max(0, d.fame-8);
      return `You send him off. Whatever he writes now, it will not have your name spelled right in it.` } },
  boy:     { need:d=>yearOf(d) >= 6 && activeG(d).length >= 3, w:9,
    title:"Somebody's Son At The Gate",
    text:d=>`A boy of about fifteen at the gate who says his father fought here and that he wants to do the same. He is not lying about the father. He is too young and too thin and he has walked a long way to say it.`,
    choices:["Take him on", "Send him to the kitchens", "Send him home"],
    run:(d,i)=>{ if(i===0){ const g=genGladiator(d, ri(30,48)); g.age=16; g.potential=clamp(g.potential+12,20,99);
        g.regard=68; d.gladiators.push(g); d.unrest = clamp(d.unrest+4,0,100);
        return `${g.name} is signed. Half the block thinks you have done him no favours and the other half remembers being him.`; }
      if(i===1){ d.gold -= 40; activeG(d).forEach(g=>{ g.morale=clamp(g.morale+5,0,100); g.regard=clamp(regardOf(g)+3,0,100); });
        return `He carries water and sleeps warm and does not go on the sand. Every man in that block noticed which of the two things you chose.`; }
      d.unrest = clamp(d.unrest+2,0,100);
      return `You send him back down the road. It is the right answer and nobody in the yard says a word to you about it for a week.` } },
  rival:   { need:d=>yearOf(d) >= 7 && (d.rivals||[]).some(h=>(h.grudge||0) >= 45), w:8,
    title:"An Offer From Across The Sand",
    text:d=>{ const h=(d.rivals||[]).find(x=>(x.grudge||0)>=45)||{name:"a rival"};
      return `${lanistaOf(h.name).name} proposes that the two houses stop bidding against each other on the block. It would save you both a great deal of money and it is, strictly speaking, the sort of arrangement the aedile exists to prevent.`; },
    choices:["Shake on it", "Refuse, and let him know why"],
    run:(d,i)=>{ const h=(d.rivals||[]).find(x=>(x.grudge||0)>=45);
      if(i===0){ d.flags.cartel = d.week; if(h) h.grudge = clamp(h.grudge-25,0,100);
        lawOf(d).heat = clamp(lawOf(d).heat + 18, 0, 100);
        return `You shake on it in a doorway. Men on the block will cost both of you less for a while and there is now a thing about you that somebody could tell the magistrate.`; }
      if(h) h.grudge = clamp(h.grudge+12,0,100);
      addRep(d, "craft", 6); d.fame += 10;
      return `You tell him no, and you tell him why, and he takes it better than you expected because he had to ask.` } },
  tired:   { need:d=>yearOf(d) >= 9 && d.lanista && d.lanista.age >= 52, w:7,
    title:"A Morning You Do Not Get Up",
    text:d=>`There is no reason for it. The house runs, the men are fed, the ledger is in order, and you lie there listening to the yard start without you and cannot think of one thing you want to walk out into.`,
    choices:["Get up anyway", "Give the week to the doctore", "Sit in the sun"],
    run:(d,i)=>{ if(i===0){ if(d.lanista) d.lanista.health = clamp(d.lanista.health-6,0,100);
        d.fame += 4;
        return `You get up. It is what you have always done and it is most of why you are still here and it costs something every time.`; }
      if(i===1){ if(d.doctore) d.trainMult = 1.12; if(d.lanista) d.lanista.health = clamp(d.lanista.health+8,0,100);
        return `${d.doctore ? d.doctore.name : "The doctore"} takes the week and does it better than you would have, which is the part you will think about afterward.`; }
      if(d.lanista) d.lanista.health = clamp(d.lanista.health+14,0,100);
      d.unrest = clamp(d.unrest+5,0,100); d.fame = Math.max(0, d.fame-6);
      return `You sit in the sun until the afternoon and nothing at all falls over. It turns out the house does not need you every single day, which is either a relief or the other thing.` } },
};
const LATE_KEYS = Object.keys(LATE);
function lateWeek(d){
  if(d.over || d.rome || d.city || d.travel || d.pendingEvent) return;
  d.flags.lateSeen = d.flags.lateSeen || [];
  const fit = LATE_KEYS.filter(k=>!d.flags.lateSeen.includes(k) && (()=>{ try{ return LATE[k].need(d); }catch(e){ return false; } })());
  if(!fit.length) return;
  if(R() > 0.045) return;
  const tot = fit.reduce((n,k)=>n+LATE[k].w,0);
  let x = R()*tot, k = fit[0];
  for(const c of fit){ x -= LATE[c].w; if(x<=0){ k=c; break; } }
  d.flags.lateSeen = [...d.flags.lateSeen, k];
  const L = LATE[k];
  d.pendingEvent = { id:"late", title:L.title, text:L.text(d), choices:L.choices, data:{ k } };
}

/* ---- TWO MOMENTS THAT ONLY HAPPEN ONCE ----
   The first purchase is a trap the game never warns you about, and the first death
   is the emotional centre of the whole thing arriving with no framing at all. Both
   fire exactly once per house and never again. */
const SPLIT2 = String.fromCharCode(10,10);
const FIRST_BUY = {
  title:"Before You Buy Anybody",
  text:`The man selling has told you what these men are. He is not obliged to be right and he is not obliged to be honest — the numbers on the block are his account of them, out by a couple either way on a sound man and further on one who is not.

About a third of the men standing there have something wrong that he has not mentioned: an old wound, a temper that has been sold twice already, no wind at all past the fourth round. Paying to have one looked over costs coin you do not have this week and it is very often the cheapest money you will ever spend.

Buy the cheap one if you must. Everybody does. Just know which of the two things you are doing.`,
};
const FIRST_DEATH = {
  title:"The First One",
  text:(d,name)=>`${name} is dead, and the arithmetic of it is short: you paid for him, fed him, and he is gone, and there is nothing at the end of that sentence.

The cells took it harder than the ledger did. Every man in that block watched a decision get made about somebody they ate beside, and they will each have formed a view about what kind of house this is. That view is worth real points on the sand and it does not reset.

A man who goes down can be let up. The cloth costs you the purse and it costs you nothing else, and the men who see you throw it fight measurably harder for you afterward. It is the strongest thing in this game and it looks like weakness, which is most of why it works.`,
};
function firstBuyWarn(d){
  if(d.flags.sawFirstBuy) return null;
  if(!(d.market||[]).some(g=>!isAuctor(g) && !g.paragon)) return null;
  d.flags.sawFirstBuy = 1;
  d.pendingLesson = { title:FIRST_BUY.title, text:FIRST_BUY.text };
  return true;
}
function firstDeathWord(d, name){
  if(d.flags.sawFirstDeath) return;
  d.flags.sawFirstDeath = 1;
  d.pendingLesson = { title:FIRST_DEATH.title, text:FIRST_DEATH.text(d, name) };
}

/* ---- THE DOCTORE'S OPINION ----
   The agenda says what is pending. It has never said what is wise. This is one
   sentence of concrete advice, read off the actual state of the house, for a
   player who is looking at six tabs and does not know which one to open. */
const COUNSEL = [
  { w:100, when:d=>d.gold < 0,
    say:d=>`You are into the moneylenders and the week does not care. Put somebody on the sand at first blood — nobody dies at those stakes and the purse is real.` },
  { w:96, when:d=>d.unrest >= 68,
    say:d=>`The cells are close to going up. A feast is a hundred and twenty denarii and it is the cheapest thing you will ever buy.` },
  { w:92, when:d=>activeG(d).some(g=>refusing(g)),
    say:d=>`${(activeG(d).find(g=>refusing(g))||{name:'A man'}).name} is sitting down and the whole block is doing the arithmetic. Whatever you do about it, do it this week.` },
  { w:88, when:d=>d.gladiators.filter(g=>!isGone(g)).length <= 2,
    say:d=>`Two men is not a house. Buy somebody before the next card, even a flawed one — an empty yard earns nothing at all.` },
  { w:84, when:d=>activeG(d).filter(g=>canFight(g) && g.lastFought < d.week && g.fatigue < 55).length === 0 && activeG(d).length > 0,
    say:d=>`Nobody is fit to go out. Rest the worst of them this week; a man sent out tired is a man sent out to lose.` },
  { w:80, when:d=>activeG(d).some(g=>g.fatigue >= 62 && g.regimen !== "rest"),
    say:d=>`${(activeG(d).find(g=>g.fatigue>=62)||{name:'A man'}).name} is worn through and still on the palus. Put him on rest before you put him on a card.` },
  { w:76, when:d=>d.games && d.games.offers && d.games.offers.length && activeG(d).some(g=>canFight(g) && g.lastFought < d.week),
    say:d=>`There is a card up and men who can take it. The games are where the money is; the pits are where you survive between them.` },
  { w:72, when:d=>activeG(d).some(g=>kitFaults(d,g).some(f=>f.why==="unfamiliar")),
    say:d=>`${(activeG(d).find(g=>kitFaults(d,g).some(f=>f.why==="unfamiliar"))||{name:'A man'}).name} is carrying something that is not his style. Arm him off the rack — it costs nothing and it is worth a good deal.` },
  { w:68, when:d=>d.gold > 900 && activeG(d).some(g=>!SLOTS.some(s=>wears(GEAR[g.kit&&g.kit[s]]))),
    say:d=>`You have coin and men carrying house issue. Real steel is the single cheapest thing that makes a man win.` },
  { w:64, when:d=>activeG(d).some(g=>canMaster(d,g)),
    say:d=>`${(activeG(d).find(g=>canMaster(d,g))||{name:'A man'}).name} has earned his mastery and nobody has said so out loud. Do it — it costs nothing and it is worth ten bouts in a hundred.` },
  { w:60, when:d=>owedList(d).some(x=>d.week - x.due >= 4) && d.gold < 300,
    say:d=>`You are owed money and short of it at the same time. Sell the paper at a discount — a purse you cannot spend is not a purse.` },
  { w:56, when:d=>d.gold > 2200 && BKEYS.some(k=>bLevel(d,k) < 3),
    say:d=>`There is coin sitting still. A wing of the ludus pays every week for the rest of the run; coin in a box does not.` },
  { w:66, when:d=>activeG(d).some(g=>rudisEligible(g)),
    say:d=>`${(activeG(d).find(g=>rudisEligible(g))||{name:'A man'}).name} has earned the rudis. Freeing him costs you a fighter and buys you something the whole block is watching for.` },
  { w:38, when:d=>!d.doctore && d.gold > 700,
    say:d=>`You have no doctore. A man who knows the trade is worth a third again on everything the yard does all week.` },
  { w:44, when:d=>d.week > 26 && !d.collegium && d.gold > 500,
    say:d=>`No burial society. Three denarii a man a week halves what a death does to the cells, and there will be deaths.` },
  { w:40, when:d=>d.games && d.games.offers && d.games.offers.length && d.gold > 400 && !(d.flags.everWatched),
    say:d=>`You have never paid to have an opponent watched. It is worth seven bouts in a hundred and it is the only way to know what you are sending a man into.` },
  { w:20, when:()=>true,
    say:d=>`Nothing is urgent. Train them, keep the cells fed, and take what cards you are offered — a house is built out of quiet weeks more than loud ones.` },
];
function counsel(d){
  const fit = COUNSEL.filter(c=>{ try { return c.when(d); } catch(e){ return false; } });
  if(!fit.length) return null;
  return fit.reduce((m,c)=>c.w>m.w?c:m, fit[0]);
}
const doctoreName = d => d.doctore ? d.doctore.name : "The doctore";

/* ---- IS THAT GOOD? ----
   Fame 340. Unrest 44. Regard 61. Nothing has ever said whether those are numbers
   to be pleased about. These are the real quartiles of a plausibly-played house,
   sampled every week across twenty-six campaigns, so the answer is measured rather
   than asserted. Bands are [week, 25th, 50th, 75th]. */
const NORMS = {
  fame:   [[0,26,35,50],[20,54,78,108],[40,82,105,127],[60,65,103,186],[80,81,141,298],
           [100,123,196,402],[120,135,279,488],[140,193,366,795],[160,296,645,1018],[180,271,738,1113]],
  gold:   [[0,422,554,717],[20,627,1194,1890],[40,934,1689,2125],[60,1121,1886,2610],[80,1380,2301,3359],
           [100,1921,2757,6472],[120,1964,3039,16624],[140,2035,9675,30792],[160,2800,19851,42300],[180,3771,26189,49981]],
  regard: [[0,45,47,51],[20,48,56,63],[40,55,62,70],[60,57,67,75],[80,60,71,81],
           [100,62,73,83],[120,65,73,83],[140,64,74,84],[160,68,76,87],[180,70,81,98]],
  men:    [[0,3,4,6],[20,5,6,6],[40,6,6,7],[60,5,6,7],[80,4,6,6],
           [100,3,5,6],[120,3,5,6],[140,3,4,6],[160,2,3,6],[180,2,3,5]],
};
/* unrest and favor are not "higher is better", so they read differently */
const normOf = (kind, week) => {
  const rows = NORMS[kind]; if(!rows) return null;
  let r = rows[0];
  for(const x of rows) if(week >= x[0]) r = x;
  return { lo:r[1], mid:r[2], hi:r[3] };
};
/* where a value sits, and the word for it */
function standing(kind, v, week){
  if(week < 6) return null;              // nobody is behind anybody in the first month
  const n = normOf(kind, week); if(!n) return null;
  const band = v >= n.hi ? 3 : v >= n.mid ? 2 : v >= n.lo ? 1 : 0;
  const word = ["behind most houses","a little behind","about typical","ahead of most houses"][band];
  return { band, word, n, colour:cbc(["#d96f5d","#d8ac5f","#b09b7d","#9aa86a"][band]) };
}
/* the two that are better low */
function standingLow(kind, v, marks){
  const m = marks || [12, 30, 55];
  const band = v >= m[2] ? 0 : v >= m[1] ? 1 : v >= m[0] ? 2 : 3;
  const word = ["dangerously high","higher than most","about typical","quieter than most"][band];
  return { band, word, colour:cbc(["#d96f5d","#d8ac5f","#b09b7d","#9aa86a"][band]) };
}

/* ---- WHY IT WENT THAT WAY ----
   The arena is watched, not driven, which means a new lanista sees his man die and
   has no idea whether he was under-armed, exhausted, badly matched or unlucky. This
   reads the bout back and says what actually decided it, in order of weight. */
function readBout(d, g, offer, res, ctx){
  const R2 = [];
  const opp = offer.opp || {};
  const push = (w, s) => R2.push({ w, s });
  const won = !!res.win;

  /* the ground and the sky */
  const V = VEN(offer.venue), W = SKY(offer.sky);
  const quick = (g.agi||50) - (g.str||50);
  if(V.footing <= 0.92 && quick > 12) push(7, `The footing was against him — ${V.name.toLowerCase()} suits a heavy man and he is not one.`);
  if(V.footing >= 1.04 && quick > 12 && won) push(5, `The footing suited him. He is quick and it was somewhere he could be quick.`);
  if(offer.sky === "rain") push(5, `It rained, which took the sand away from anybody trying to move on it.`);
  if(offer.sky === "hot" && (g.end||50) < 48) push(6, `It was blazing and he has never had much wind.`);

  /* what he was carrying */
  const m = kitMods(g.kit, g.cls, g);
  if(m.clumsy && m.clumsy.length) push(9, m.clumsy.length===1
    ? `He went out carrying a piece that is not his style, and it showed in his hands.`
    : `He went out carrying ${m.clumsy.length} pieces that are not his style, and it showed in his hands.`);
  if(m.atk + m.def < -0.05) push(8, `He was under-armed for that card. The other man had the better of it before either of them moved.`);
  else if(m.atk + m.def > 0.25 && won) push(4, `He was well armed and it did half the work.`);
  const worn = SLOTS.filter(s=>wears(GEAR[g.kit&&g.kit[s]]) && (g.wear&&g.wear[s]||100) < 30);
  if(worn.length) push(6, `His ${GEAR[g.kit[worn[0]]].name.toLowerCase()} was close to gone before the first exchange.`);

  /* the state he was in */
  if(g.fatigue >= 55) push(9, `He went out at ${Math.round(g.fatigue)} fatigue, which is most of a man's edge before anything else happens.`);
  else if(g.fatigue >= 38) push(4, `He was not fresh.`);
  if(strainOf(g) > 55) push(6, `He is carrying deep strain from the yard and it does not rest off in a week.`);
  if(lastingOf(g).length) push(7, `${LASTING[lastingOf(g)[0]].name.replace(/^a /,"His ").replace(/^the /,"His ")} — past the sixth round he is not the same man.`);
  if(formOf(g) <= -30) push(5, `He has been off his stride for weeks and it has not turned round on its own.`);
  else if(formOf(g) >= 40 && won) push(3, `He has been in form and it carried.`);
  if(regardOf(g) <= 22) push(6, `He thinks very little of this house, and a man who thinks little of you does not spend himself for you.`);

  /* the matching */
  const gap = (opp.wins||0) - (g.wins||0);
  if(gap >= 6) push(8, `He was matched against a man with ${opp.wins} behind him and ${g.wins===0?"none":g.wins} of his own.`);
  else if(gap <= -6 && won) push(3, `He was the harder man on that card and it went the way it should.`);
  if(offer.tier >= 3 && (g.pfame||0) < 60) push(6, `That was a tier ${offer.tier} card and he is not a tier ${offer.tier} man yet.`);
  const cnt = COUNTERS[opp.cls] === g.cls;
  const has2 = COUNTERS[g.cls] === opp.cls;
  if(cnt) push(9.5, `The ${opp.cls.toLowerCase()} is the wrong match for a ${g.cls.toLowerCase()} and everyone at the editor's table knew it.`);
  else if(has2 && won) push(4, `The style match was his, and against a ${opp.cls.toLowerCase()} that is worth a good deal.`);

  /* what you told him to do */
  if(ctx && ctx.plan && ctx.plan.right === false) push(7, `The plan was wrong for him. You had him ${ctx.plan.label || "fighting to a plan"} and that was not what the man in front of him needed.`);
  else if(ctx && ctx.plan && ctx.plan.right === true) push(4, `You read him correctly beforehand and it was worth about seven bouts in a hundred.`);

  /* and the room */
  if(!offer.city && facOf(d, "front") < 22 && res.crowd < 40) push(4, `The front rows have gone cold on this house, and a cold house gets no help when a decision is being made.`);
  if(res.crowd >= 76) push(3, `The crowd was with him from the third exchange, which is worth more than it sounds.`);
  if(offer.stakes === "sine") push(5, `There was no mercy on that card. There was never going to be a decision to lean on.`);

  R2.sort((a,b)=>b.w - a.w);
  const top = R2.slice(0, 3).map(x=>x.s);
  if(!top.length) top.push(won
    ? `Nothing decided it but the two of them. He was the better man on the day.`
    : `Nothing was wrong with any of it. Some afternoons the other man is simply better and there is nothing in the ledger to blame.`);
  return top;
}

/* ---- THE LAW ----
   Rome legislated this trade constantly — caps on how many armed men a private
   citizen could keep, the tax on every sale, bans on who could be put on the sand.
   You have never once been told you cannot do something. */
const EDICTS = {
  numbers: { name:"On the keeping of armed men", w:9,
    say:"The Senate has taken an interest in how many trained fighters private citizens keep behind walls. There have been incidents. There is a number now.",
    check:d=>d.gladiators.filter(g=>!isGone(g)).length > (d.law && d.law.cap || 6),
    broke:d=>`You are keeping ${d.gladiators.filter(g=>!isGone(g)).length} where the edict allows ${d.law.cap}.`,
    set:d=>{ d.law.cap = Math.max(4, d.gladiators.filter(g=>!isGone(g)).length - ri(1,3)); } },
  vectigal:{ name:"The tax on the sale of gladiators", w:8,
    say:"A levy on every man bought or sold, payable by the buyer, collected by a man who does not accept excuses and keeps his own ledger.",
    check:()=>false,
    set:d=>{ d.law.tax = 0.08 + R()*0.06; } },
  women:   { name:"On women upon the sand", w:6,
    say:"A decree of the Senate. It names no house and everybody knows which houses it means.",
    check:d=>activeG(d).some(g=>isF(g)),
    broke:d=>`You have ${activeG(d).filter(g=>isF(g)).length} on the roster in defiance of it.`,
    set:d=>{ d.law.women = true; } },
  sine:    { name:"On fights without mercy", w:7,
    say:"Not banned. Licensed. Every card without missio now needs the magistrate's seal, and the seal is not free.",
    check:()=>false,
    set:d=>{ d.law.sineFee = ri(40, 90); } },
  damnati: { name:"On the condemned", w:6,
    say:"The courts want their sentences served where they can be seen. A house holding condemned men will account for them.",
    check:d=>activeG(d).some(g=>isDamn(g)),
    broke:d=>`There are ${activeG(d).filter(g=>isDamn(g)).length} condemned men in your cells and the paperwork has not been kept.`,
    set:d=>{ d.law.damnati = true; } },
};
const EDICT_KEYS = Object.keys(EDICTS);
const lawOf = d => d.law || (d.law = { cap:99, tax:0, women:false, sineFee:0, damnati:false, edicts:[], heat:0, fines:0 });
const hasEdict = (d,k) => lawOf(d).edicts.includes(k);
const inBreach = d => lawOf(d).edicts.filter(k=>{ try { return EDICTS[k].check(d); } catch(e){ return false; } });
const lawWord = d => { const h = lawOf(d).heat;
  return h>=70?"the magistrate has your name on a list" : h>=40?"you are being watched" : h>=15?"noticed once or twice" : "nobody is looking at you"; };
/* an edict arrives, and it is aimed at houses like yours */
function edictWeek(d){
  const L = lawOf(d);
  if(d.over || d.rome || d.city || d.travel) return;
  if(d.week < 22 || L.edicts.length >= 3) return;
  if(R() > 0.055) return;
  const fit = EDICT_KEYS.filter(k=>!hasEdict(d,k));
  if(!fit.length) return;
  const tot = fit.reduce((n,k)=>n+EDICTS[k].w, 0);
  let x = R()*tot, k = fit[0];
  for(const c of fit){ x -= EDICTS[c].w; if(x<=0){ k=c; break; } }
  L.edicts = [...L.edicts, k];
  try { EDICTS[k].set(d); } catch(e){}
  const E = EDICTS[k];
  chron(d, `An edict is read out in the forum: ${E.name.toLowerCase()}. ${E.say}`, "bad");
  if(d.pendingEvent){ lawOf(d).heat = clamp(lawOf(d).heat + 6, 0, 100); return; }
  d.pendingEvent = { id:"edict", title:"An Edict Is Read Out",
    text:`${E.name}. ${E.say}${EDICTS[k].check(d) ? " " + E.broke(d) : ""}`,
    choices:["Comply", "Carry on and hope"], data:{ k } };
}
/* the inspector, who does not send word */
function lawWeek(d){
  const L = lawOf(d);
  if(d.over || d.rome || d.city || d.travel) return;
  const breach = inBreach(d);
  L.heat = clamp(L.heat + (breach.length ? breach.length*1.6 : -0.9), 0, 100);
  if(!breach.length || d.pendingEvent) return;
  if(R() > 0.03 + L.heat*0.0012) return;
  const fine = rnd((160 + d.fame*0.6) * breach.length);
  d.pendingEvent = { id:"inspector", title:"He Did Not Send Word",
    text:`A man from the aedile's office is standing in your yard with a wax tablet, and he has been there long enough to have counted things. ${breach.map(k=>EDICTS[k].broke(d)).join(" ")} He can write down what he has seen, or he can be persuaded that he saw something else.`,
    choices:[`Pay the fine · ${fine}d`, `Buy the tablet · ${rnd(fine*0.55)}d`, "Let him write it down"],
    data:{ fine, breach } };
}
const lawTax   = d => lawOf(d).tax || 0;
const lawSine  = d => lawOf(d).sineFee || 0;
const lawCap   = d => lawOf(d).cap || 99;

/* ---- A MAN BETTER THAN YOU DESERVE ----
   Everything on the block scales with the house looking at it. Nothing has ever
   arrived that is simply out of your league. This is one man, once, whose price you
   can only meet by taking the house apart — and a decade of consequence either way. */
const PARAGONS = [
  { name:"Verus", origin:"Thracian",
    tale:"Twenty-nine bouts and the crowd at Praeneste stood for the whole of the last one. His lanista is dead and the estate is being broken up by a nephew who does not want any of it." },
  { name:"Priscus", origin:"Gaul",
    tale:"He fought the same man to a standstill in front of the emperor and they were both given the wooden sword, and then he sold himself back into it because there was nothing else he knew how to do." },
  { name:"Flamma", origin:"Syrian",
    tale:"Refused the rudis four times, which people say is either courage or a kind of illness. Nobody who has seen him on the sand argues that he does not belong there." },
  { name:"Spiculus", origin:"Numidian",
    tale:"A man with a house and land, given to him by somebody important, who lost both in a way nobody will discuss and is on the block by Thursday." },
];
const paragonOf = d => (d.market||[]).find(g=>g.paragon) || null;
function makeParagon(d){
  const P = pick(PARAGONS.filter(p=>!(d.flags.paragonSeen||[]).includes(p.name))) || pick(PARAGONS);
  const g = genGladiator(d, ri(88, 97));
  g.name = P.name; g.origin = P.origin;
  g.paragon = { tale:P.tale };
  STATS.forEach(k=>{ g[k] = clamp(g[k] + ri(14, 26), 20, 96); });
  g.potential = clamp(g.potential + ri(10,18), 60, 99);
  g.wins = ri(18, 34); g.losses = ri(2, 7); g.kills = ri(3, 11);
  g.pfame = ri(180, 320);
  g.age = ri(26, 31);
  g.nick = pick(NICKS);
  g.flaw = null; g.scouted = true;
  g.defiance = clamp(g.defiance + ri(12, 24), 0, 100);   // the best man you will ever own
  g.regard = ri(24, 40);                                  // and he owes you nothing yet
  g.sworn = null;
  g.price = rnd(gladValue(g) * 2.4);
  d.flags.paragonSeen = [...(d.flags.paragonSeen||[]), P.name];
  return g;
}
/* what he is worth against what you have */
const paragonReach = (d,g) => {
  const worth = d.gold + owedTotal(d) + Object.entries(d.gear||{})
    .reduce((n,[id,c])=>n + (GEAR[id]&&wears(GEAR[id]) ? GEAR[id].price*0.5*c : 0), 0);
  return { worth:Math.round(worth), price:g.price, short:Math.max(0, g.price - Math.round(worth)) };
};
/* everything you could turn into coin by Thursday */
function liquidate(d, g){
  const out = { steel:0, steelN:0, men:0, menN:0, debt:0, debtN:0 };
  for(const [id,c] of Object.entries(d.gear||{})){
    const it = GEAR[id]; if(!wears(it)) continue;
    const free = (c||0) - gearUsed(d,id);
    if(free > 0){ out.steel += rnd(it.price * resaleRate(d) * free); out.steelN += free; }
  }
  for(const x of owedList(d)){ out.debt += rnd(x.amount * discountRate(d)); out.debtN++; }
  const spare = activeG(d).filter(x=>!isDamn(x) && !isAuctor(x)).sort((a,b)=>gladValue(a)-gladValue(b));
  for(const m of spare.slice(0, Math.max(0, spare.length-1))){ out.men += rnd(gladValue(m)*0.55); out.menN++; }
  out.total = out.steel + out.debt + out.men;
  return out;
}
function sellTheHouse(d){
  const L = liquidate(d);
  for(const [id,c] of Object.entries(Object.assign({}, d.gear||{}))){
    const it = GEAR[id]; if(!wears(it)) continue;
    let free = (c||0) - gearUsed(d,id);
    while(free-- > 0) sellGear(d, id);
  }
  for(const x of owedList(d).slice()) sellDebt(d, x.id);
  const spare = activeG(d).filter(x=>!isDamn(x) && !isAuctor(x)).sort((a,b)=>gladValue(a)-gladValue(b));
  const sold = spare.slice(0, Math.max(0, spare.length-1));
  for(const m of sold){
    d.gold += rnd(gladValue(m)*0.55);
    favourLost(d, m, "sold");
    annalsClose(d, m, "sold"); m.status = "sold";
    d.gladiators.forEach(o=>{ if(o.status==="active"){ remember(d, o, "sold"); o.morale = clamp(o.morale-9,0,100); } });
  }
  d.unrest = clamp(d.unrest + sold.length*5, 0, 100);
  chron(d, `The house is stripped to the walls. ${L.steelN} pieces of steel out the door, ${L.debtN? `every debt sold at a discount, ` : ""}and ${sold.length} men led out through the gate in one morning. Everybody in Capua knows exactly what you are about to do.`, "bad");
  return L;
}

function paragonWeek(d){
  if(d.over || d.rome || d.city || d.travel) return;
  if(d.flags.paragonDone || paragonOf(d)) return;
  if(d.week < 30 || d.fame < 120) return;
  if((d.flags.paragonSeen||[]).length >= 2) return;
  if(R() > 0.018) return;
  const g = makeParagon(d);
  d.market = [g, ...(d.market||[])];
  d.flags.paragonWeek = d.week;
  chron(d, `There is a man on the block this morning that the whole of Capua has come out to look at. ${fullName(g)}. ${g.paragon.tale} They want ${g.price} denarii and they are not going to have to wait long for it.`, "event");
}
/* he does not stay long */
function paragonExpire(d){
  const g = paragonOf(d);
  if(!g) return;
  if(d.week - (d.flags.paragonWeek||d.week) < 3) return;
  d.market = (d.market||[]).filter(x=>x.id!==g.id);
  d.flags.paragonDone = 1;
  const h = pick(d.rivals||[]);
  if(h){ h.fame += 60; h.grudge = clamp(h.grudge - 5, 0, 100);
    chron(d, `${fullName(g)} goes to House ${h.name}. ${lanistaOf(h.name).name} paid it without haggling, in front of people, which was most of the point.`, "bad"); }
  else chron(d, `${fullName(g)} is sold out of Capua entirely and that is the last anybody here sees of him.`, "bad");
}

/* ---- THE WEEK THAT IS NOT A WEEK ----
   Every turn has been seven days of identical shape, costing the same attention
   whether anything was in it or not. Measured: after week 75 a campaign sees a
   third as many new things per band while the weeks keep arriving at the same rate.
   This lets an empty stretch pass as one decision and a full one slow down. */
function weekWeight(d){
  if(d.over || d.rome || d.travel) return { kind:"held", n:1 };
  let load = 0;
  if(d.pendingEvent) load += 4;
  if(d.games && d.games.offers && d.games.offers.length
     && activeG(d).some(g=>canFight(g) && g.lastFought < d.week)) load += 3;
  if(d.city) load += 2;
  load += Math.min(4, deadlines(d).filter(x=>x.due - d.week <= 2).length * 2);
  load += activeG(d).filter(g=>refusing(g)).length * 3;
  if(d.election && !d.election.done) load += 2;
  if((d.unburied||[]).some(m=>!m.done)) load += 1;
  if(d.poach || d.doctoreOffer || d.reSignOffer || d.romeOffer) load += 2;
  if(activeG(d).some(g=>canMaster(d,g))) load += 1;
  if(owedList(d).some(x=>d.week - x.due >= 4)) load += 1;
  if(d.unrest >= 68) load += 2;
  return load >= 5 ? { kind:"full", n:1, load }
       : load >= 1 ? { kind:"ordinary", n:1, load }
       : { kind:"quiet", n:1, load };
}
/* how far you can safely skip: to the next thing that wants you */
function weeksToSomething(d, cap){
  const lim = cap || 6;
  let n = 0;
  const probe = clone(d);
  for(let i=0;i<lim;i++){
    /* the things that are already dated */
    const dl = deadlines(probe).filter(x=>x.due - probe.week <= i+1);
    if(dl.length && i>0) break;
    if(probe.games && probe.games.week > probe.week && i>0) break;
    n++;
  }
  return Math.max(1, Math.min(lim, n));
}
const QUIET_LINES = [
  "Four quiet weeks. They train, they eat, they argue about nothing, and the doctore reports that nothing needs reporting.",
  "A stretch of nothing. The yard works, the racks are counted, and the only thing anybody remembers afterward is the weather.",
  "Weeks pass in the way weeks pass when a house is running properly, which is to say nobody could tell you what happened in any of them.",
  "The season turns over without asking your opinion. Drills, meals, mending, and a great deal of sitting on the wall watching the road.",
];
/* run several weeks as one, stopping the moment something wants you */
function skipWeeks(d, want){
  const start = d.week;
  let ran = 0;
  for(let i=0;i<want;i++){
    endWeek(d);
    ran++;
    if(d.pendingEvent || d.over || d.succession || d.romeOffer || d.doctoreOffer || d.reSignOffer) break;
    if(d.games && d.games.week === d.week && d.games.offers && d.games.offers.length) break;
  }
  if(ran >= 2) chron(d, `${pick(QUIET_LINES)}`, "info");
  return { ran, from:start, to:d.week };
}

/* ---- THE LONG MIDDLE ----
   Measured: gold climbs from 638 a week to 27,569 while bouts stay flat at three.
   The entire buildable game costs 26,580d, so a house past week 100 has more money
   than uses for it and nothing new arrives. These are things only a rich, old house
   can do, and each one costs more than everything else put together. */
const WORKS = {
  spina:   { name:"A spina for the yard", cost:7000, years:2,
    blurb:"A stone spine down the middle of the training square, the way the real ones have. They will fight around it every day for the rest of their lives.",
    done:"The men train around stone now, and the first time one of them goes out to a venue with a spina he does not have to think about it.",
    perk:"crowd", n:4, say:"+4 crowd on every bout, forever." },
  baths:   { name:"Baths worth the name", cost:9500, years:2,
    blurb:"Not the plunge in the corner. Hot rooms, a masseur, and the kind of place a man will talk in.",
    done:"They come out of it different. Whatever the medicus does, this does the other half.",
    perk:"rest", n:6, say:"Six more fatigue shed every week, on top of everything else." },
  chapel:  { name:"A proper shrine", cost:5500, years:1,
    blurb:"Nemesis in stone, with a priest who comes on the right days. The men built one themselves out of nothing; this is the answer to that.",
    done:"Somebody who is not you decided the house was worth a god, and then you agreed with him in stone.",
    perk:"calm", n:1.1, say:"Unrest falls 1.1 a week, forever." },
  school:  { name:"A school under your name", cost:12000, years:3,
    blurb:"Boys sent to you to be trained and sent back. It is not a ludus, it is a reputation with a roof, and Capua has not had one in thirty years.",
    done:"There are men in three towns who learned it here, and they say so.",
    perk:"fame", n:3, say:"+3 fame a week, and the block hears about it." },
  tomb:    { name:"A tomb for the house", cost:8500, years:2,
    blurb:"Not a plot. A tomb, on the road out, with room for every man who ever wore your colours and space for the names to be cut.",
    done:"Every man in that block has now seen exactly where he is going, and it is not a ditch.",
    perk:"regard", n:0.4, say:"Every man's regard climbs 0.4 a week, and a death costs the cells far less." },
};
const WORK_KEYS = Object.keys(WORKS);
const worksOf = d => d.works || {};
const workDone = (d,k) => { const w = worksOf(d)[k]; return !!(w && w.left <= 0); };
const workOn   = (d,k) => { const w = worksOf(d)[k]; return w && w.left > 0 ? w : null; };
const workAny  = d => WORK_KEYS.filter(k=>workDone(d,k));
const workPerk = (d, kind) => WORK_KEYS.reduce((n,k)=>
  (workDone(d,k) && WORKS[k].perk===kind) ? n + WORKS[k].n : n, 0);
function beginWork(d, k){
  const W = WORKS[k];
  if(!W || worksOf(d)[k]) return false;
  if(d.gold < W.cost) return false;
  d.gold -= W.cost;
  d.works = Object.assign({}, worksOf(d), { [k]: { left: W.years * YEAR_WEEKS, began: d.week } });
  chron(d, `Work begins on ${W.name.toLowerCase()}. ${W.cost} denarii gone in a morning, and nothing to show for it for ${W.years} years.`, "info");
  return true;
}
function worksWeek(d){
  const w = worksOf(d);
  for(const k of Object.keys(w)){
    if(w[k].left <= 0) continue;
    w[k].left--;
    if(w[k].left <= 0){
      const W = WORKS[k];
      d.fame += 30;
      activeG(d).forEach(g=>{ g.morale = clamp(g.morale+8,0,100); });
      chron(d, `${W.name} is finished. ${W.done}`, "good");
    }
  }
  /* what the finished ones do, week by week */
  if(workPerk(d,"calm"))   d.unrest = clamp(d.unrest - workPerk(d,"calm"), 0, 100);
  if(workPerk(d,"fame"))   d.fame += workPerk(d,"fame");
  if(workPerk(d,"regard")) activeG(d).forEach(g=>{ g.regard = clamp(Math.round((regardOf(g) + workPerk(d,"regard"))*10)/10, 0, 100); });
}

/* ---- ROME REMEMBERS ----
   The gate moved to fame 1000 with a cooldown, so Rome became a summit you can
   revisit. The content still assumed one visit. This is what the second one is:
   the same city, which has seen you, and an editor who kept the notes. */
const ROME_EDITORS = [
  { name:"Aulus Didius Gallus", note:"keeps a wax tablet on every house that has ever fought here and refers to it in front of you." },
  { name:"Sextus Afranius Burrus", note:"says almost nothing and has already decided what your men are worth." },
  { name:"Titus Vinius", note:"is charming, thorough, and has bankrupted two houses this year by being both." },
];
const romeRuns    = d => (d.flags && d.flags.romeRuns) || 0;
const romeBest    = d => (d.flags && d.flags.romeBest) || 0;
const romeTriumphs= d => (d.flags && d.flags.romeTriumph) || 0;
/* the city's standing opinion of you, which is not fame */
const romeStanding = d => clamp(romeRuns(d)*12 + romeTriumphs(d)*26 + romeBest(d)*8, 0, 100);
const romeWord = d => { const v = romeStanding(d);
  return v>=78?"they know your house in Rome" : v>=50?"Rome has heard of you" : v>=22?"a name they half recognise" : "nobody at all"; };
const romeEditor = d => ROME_EDITORS[Math.min(ROME_EDITORS.length-1, romeRuns(d))] || ROME_EDITORS[0];
/* what a second visit is not: the same visit */
function romeGreeting(d){
  const n = romeRuns(d), t = romeTriumphs(d), b = romeBest(d);
  if(n === 0) return `Nobody here has heard of you and the man taking your names spells them wrong twice.`;
  if(t > 0)   return `${romeEditor(d).name} knows the house. You took ${b} of three the last time and he has the tablet open at the page.`;
  if(b > 0)   return `They remember you took ${b === 1 ? "one" : String(b)}. It was not enough to be talked about and it was enough not to be forgotten.`;
  return `They remember that you came and that you took nothing, and somebody says so within earshot on the first afternoon.`;
}
/* a house Rome knows is offered better and worse */
const romePurseMult = d => 1 + romeStanding(d)/100 * 0.45;
const romeSineOdds  = d => 0.5 + romeStanding(d)/100 * 0.22;   // they want more from a house they know

function offerRome(d){
  const sen = patronsOf(d).find(p=>p.rank==="senator" && p.favor>=70);
  d.romeOffer = { senator: sen ? sen.name : "a senator of Rome", due: d.week + 4, run: romeRuns(d)+1 };
  chron(d, romeRuns(d)===0
    ? `A letter under an imperial seal. ${d.romeOffer.senator} has put your house forward for the games at Rome.`
    : `Another letter under the same seal. ${d.romeOffer.senator} does not explain why Rome wants you again, and the letter is shorter than the first one was.`, "good");
}

function makeImperialBout(d){
  const hard = !!(d.flags && d.flags.romeHardCard);
  const opp = genOpponent(3, hard ? ri(97, 99) : ri(92, 99));
  if(hard){ d.flags.romeHardCard = 0; opp.wins = (opp.wins||0) + ri(4,9); }
  opp.kit = kitFor(opp.cls, 3);
  opp.nick = opp.nick || pick(NICKS);
  const sine = R() < romeSineOdds(d);
  return { id:d.nextId++, tier:4, festival:"the imperial games", imperial:true,
    opp, oppRef:null, rematch:false, grudgeM:false, stakes: sine ? "sine" : "standard",
    editor: romeEditor(d).name,
    purse: rnd((TIERS[4].purse[0] + R()*TIERS[4].purse[1]) * (sine?1.5:1) * romePurseMult(d)) };
}

/* three things Rome does to a house that keeps coming back */
const ROME_TURNS = {
  matched: { need:d=>romeRuns(d)>=1, w:8,
    say:d=>`${romeEditor(d).name} has matched your man against somebody he has clearly thought about. It is not a favour and it is not an insult. It is the card he thinks will fill the seats.`,
    hit:d=>{ d.flags.romeHardCard = 1; } },
  watched:  { need:d=>romeTriumphs(d)>=1, w:9,
    say:d=>`Somebody in the imperial box asks who owns the house from Capua. Nobody answers immediately, which is answer enough, and your name is said aloud in a place where names are not usually said aloud.`,
    hit:d=>{ d.fame += 40; patronsOf(d).forEach(p=>{ if(p.rank==="senator") p.favor = clamp(p.favor+14,0,100); }); recomputeFavor(d); } },
  offer:    { need:d=>romeStanding(d)>=55, w:7,
    say:d=>`A man from a Roman familia asks, without much circling, what it would take to buy your best. He names a figure that is not an insult, which is the insulting part.`,
    hit:d=>{ d.flags.romeBid = 1; } },
};
const RT_KEYS = Object.keys(ROME_TURNS);

function romeWeek(d){
  const r = d.rome;
  if(!r) return;
  if(r.travel > 0){
    r.travel--;
    d.gold -= 40;
    chron(d, r.travel>0
      ? `The road north. Wagons, tolls, and men who have never been out of Campania looking at the hills.`
      : `Rome. The imperial sand is bigger than the whole of your ludus, and it is already stained. ${romeGreeting(d)}`, "event");
    return;
  }
  /* the city has its own business with you */
  if(r.fought > 0 && r.fought < ROME_BOUTS && !r.turned){
    const fit = RT_KEYS.filter(k=>{ try{ return ROME_TURNS[k].need(d); }catch(e){ return false; } });
    if(fit.length && R() < 0.55){
      const tot = fit.reduce((n,k)=>n+ROME_TURNS[k].w,0);
      let x = R()*tot, k = fit[0];
      for(const c of fit){ x -= ROME_TURNS[c].w; if(x<=0){ k=c; break; } }
      r.turned = true;
      try { ROME_TURNS[k].hit(d); } catch(e){}
      chron(d, ROME_TURNS[k].say(d), k==="matched" ? "info" : "good");
    }
  }
  if(r.fought >= ROME_BOUTS){
    const won = r.won, triumph = won >= 2;
    const purse = rnd((triumph ? 1700 + won*750 : 500 + won*320) * romePurseMult(d));
    d.gold += purse;
    d.fame += triumph ? 280 : 90;
    d.flags.romeRuns = (d.flags.romeRuns||0) + 1;
    d.flags.romeBest = Math.max(d.flags.romeBest||0, won);
    d.flags.romeReturned = d.week;
    if(triumph){ addRep(d, "show", 8); d.flags.romeTriumph = (d.flags.romeTriumph||0) + 1; }
    activeG(d).forEach(g=>{ g.morale = clamp(g.morale + (triumph ? 12 : -6), 0, 100); });
    d.rome = null;                     // the house comes home — Rome is a milestone, not the grave
    d.pendingRome = { won, triumph, purse };
  }
}

/* ---- THE MELEE (gregatim) ----
   Six or eight men on the sand at once, drawn from every house in Capua, and the
   editor pays the last one standing. Enter two of your own and you have accepted
   that they may be the last two — and the editor will not take two victors. */
function shuffled(a){ const c = a.slice(); for(let i=c.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; }

function simulateMelee(ents, ctx, opts){
  const O = opts || {}; const R0 = O.from || null;
  const beats = [];
  const n = ents.length;
  ents.forEach((e,i)=>{ e.mods = kitMods(e.kit, e.cls, e);
    if(R0){ e.hpv = R0.hp[i]; e.stam = R0.stam[i]; e.out = R0.out[i]; e.dead = R0.dead[i]; e.withdrew = R0.withdrew[i]; }
    else { e.hpv = 100; e.stam = 55+e.end*0.6; e.out = false; e.dead = false; e.withdrew = false; } });
  let crowd = R0 ? R0.crowd : clamp(24 + ents.reduce((s,e)=>s+e.sho,0)/n/5, 0, 100);
  let round = R0 ? R0.round : 0;
  const mine = i => ents[i].mine;
  const alive = () => ents.map((e,i)=>i).filter(i=>!ents[i].out);
  const push = (kind, text, extra) => beats.push(Object.assign({
    kind, text, round, melee:true,
    hp: ents.map(e=>clamp(e.hpv,0,100)), out: ents.map(e=>e.out), dead: ents.map(e=>e.dead),
    crowd: clamp(crowd,0,100), mom:0, vA:100, vB:100, sA:100, sB:100, a:null, b:null, actor:null
  }, extra||{}));

  const snapshot = () => ({ hp:ents.map(e=>e.hpv), stam:ents.map(e=>e.stam),
    out:ents.map(e=>e.out), dead:ents.map(e=>e.dead), withdrew:ents.map(e=>!!e.withdrew), crowd, round });
  const houses = [...new Set(ents.filter(e=>!e.mine).map(e=>e.house))];
  if(R0) push("crux", O.resumeLine || `The sand rearranges itself around what you just did.`);
  else push("intro", `${n} on the sand at once — ${ents.filter(e=>e.mine).length} of yours against the best of ${houses.slice(0,3).join(", ")}. The editor pays the last one standing and nobody else.`);
  if(!R0) push("salute", `They do not salute each other. There is no pairing to salute.`);

  /* held when the field has thinned far enough that you can see it coming */
  let crux = null;
  const cruxNow = r => { if(!O.stopAtCrux || r<4) return false;
    const up = ents.map((e,i)=>i).filter(i=>!ents[i].out);
    const mineUp = up.filter(i=>ents[i].mine);
    if(mineUp.length < 1) return false;
    return (up.length<=4 && mineUp.length>=2) || mineUp.some(i=>ents[i].hpv<=45);
  };

  const drop = (i, killer) => {
    const e = ents[i];
    e.out = true;
    push("fall", `${e.name} goes down.`, { a:i, actor:"a" });
    const spare = crowd*0.25 + (e.pfame||0)*0.25 + (e.mine ? ctx.favor*0.45 : 30) + e.sho*0.15
      + (e.heart||50)*0.1 + (e.mine && ctx.patron ? ctx.patron.favor*0.11 : 0) + R()*22 - 16;
    if(spare >= 44){ push("spared", `Hands drag ${e.name} clear of the sand before the rest trample ${PR(e).him}.`, { a:i }); }
    else { e.dead = true; push("death", `${killer? killer.name+" finishes "+PR(e).him+" where "+PR(e).he+" lies." : PR(e).He+" does not get up, and the melee moves over "+PR(e).him+"."}`, { a:i }); }
  };

  const startR = R0 ? R0.round : 0;
  for(let r=startR+1; r<=26; r++){
    round = r;
    let liv = alive();
    if(liv.length<=1) break;
    const mineLeft = liv.filter(mine), foesLeft = liv.filter(i=>!mine(i));

    /* nobody left but your own — the editor will not take two victors */
    if(foesLeft.length===0 && mineLeft.length>1){
      const [x,y] = mineLeft;
      const t = ctx.tie && ctx.tie(ents[x].gid, ents[y].gid);
      push("appeal", t && t.kind==="brother"
        ? `${ents[x].name} and ${ents[y].name} are the only two left standing. They look at the editor's box. The editor does not lower his hand.`
        : `${ents[x].name} and ${ents[y].name} are the last two on the sand, and only one purse is on offer.`,
        { a:x, b:y });
      // they finish it, and neither of them wants to
      let guard = 0;
      while(!ents[x].out && !ents[y].out && guard++<12){
        const px = power(ents[x],"measured",ents[y].cls,0,0.97+R()*0.06)*(0.74+R()*0.52);
        const py = power(ents[y],"measured",ents[x].cls,0,0.97+R()*0.06)*(0.74+R()*0.52);
        const aw = px>py, atk = aw?ents[x]:ents[y], def = aw?ents[y]:ents[x];
        const dmg = clamp((5 + Math.abs(px-py)/9 + atk.str/13)*(1+atk.mods.atk*0.7)*(1-def.mods.def), 3, 30);
        def.hpv -= dmg;
        crowd = clamp(crowd+dmg/3.5, 0, 100);
        push(dmg>=16?"crit":"hit", `${atk.name} strikes at ${def.name}. Neither of them is looking at the crowd.`,
          { a: aw?x:y, b: aw?y:x, actor:"a", dmg:rnd(dmg) });
        if(def.hpv<=20) drop(aw?y:x, atk);
      }
      break;
    }

    /* pair everyone off; allies are kept apart while enemies remain */
    const order = shuffled(liv);
    const pairs = [];
    const pool = order.slice();
    while(pool.length>1){
      const a = pool.shift();
      let k = pool.findIndex(b => mine(a)!==mine(b) || ents[a].house!==ents[b].house);
      if(k<0) k = 0;
      const b = pool.splice(k,1)[0];
      pairs.push([a,b]);
    }
    let offscreen = 0;
    for(const [a,b] of pairs){
      if(ents[a].out || ents[b].out) continue;
      const A = ents[a], B = ents[b];
      A.stam -= 6; B.stam -= 6;
      const pa = power(A,"measured",B.cls,0,0.97+R()*0.06)*(A.stam<22?0.78:1)*(0.74+R()*0.52);
      const pb = power(B,"measured",A.cls,0,0.97+R()*0.06)*(B.stam<22?0.78:1)*(0.74+R()*0.52);
      const aw = pa>pb, atk = aw?A:B, def = aw?B:A;
      const ai = aw?a:b, di = aw?b:a;
      const tgt = pick(TARGETS);
      const dmg = clamp((8 + Math.abs(pa-pb)/6.5 + atk.str/10)*tgt[2]*(1+atk.mods.atk*0.7)*(1-def.mods.def), 4, 36);
      def.hpv -= dmg;
      crowd = clamp(crowd + dmg/5.5, 0, 100);
      const involved = A.mine || B.mine;
      if(involved){
        const move = pick(ATTACKS[atk.cls]);
        push(dmg>=18?"crit":dmg>=10?"hit":"graze",
          `${atk.name} ${move[1]} — ${def.name}'s ${tgt[0]} takes it.`,
          { a:ai, b:di, actor:"a", dmg:rnd(dmg), target:tgt[0], tx:tgt[1][0], ty:tgt[1][1] });
      } else offscreen++;
      if(def.hpv<=20) drop(di, atk);
    }
    if(offscreen>0 && R()<0.28)
      push("clash", `Across the sand, ${offscreen===1?"another pair grind at each other":"the other pairs grind at each other"} and the dust comes up.`);
    if(crowd>=84 && !beats.some(x=>x.kind==="crowd")) push("crowd", `CAPUA IS ON ITS FEET!`);
    if(cruxNow(r)){
      const up = ents.map((e,i)=>i).filter(i=>!ents[i].out);
      const mineUp = up.filter(i=>ents[i].mine);
      crux = snapshot();
      push("crux", mineUp.length>=2 && up.length<=4
        ? `${mineUp.length} of yours are still up and there are only ${up.length} men left on this sand. You can see where this is going. So can they.`
        : `${ents[mineUp.sort((a,b)=>ents[a].hpv-ents[b].hpv)[0]].name} is badly used and the field has not thinned enough to save him.`,
        { a: mineUp[0] });
      break;
    }
  }
  if(crux) return { beats, crux, unfinished:true };

  const left = alive();
  const winner = left.length===1 ? left[0] : (left.length ? left.reduce((m,i)=>ents[i].hpv>ents[m].hpv?i:m, left[0]) : -1);
  if(winner>=0) push("end", ents[winner].mine
    ? `${ents[winner].name} is the last one standing. The editor's purse is yours.`
    : `${ents[winner].name} of ${ents[winner].house} is the last one standing. Yours are not.`,
    { a:winner });
  else push("end", `There is no one left upright. The editor keeps his purse.`);
  return { beats, winner, ents, crowd };
}

/* ---- VENATIO ----
   The morning hunt. Big purses, a roaring crowd, and no honour in it at all —
   a beast does not accept a raised finger, and the men know what that means. */
const BEASTS = {
  wolves:  { name:"a pack of wolves", art:"wolf",  tier:0, hp:72,  pow:60, hide:.02, spd:1.28, fear:1.15, purse:1.3,
    desc:"Three of them, and they have never been taught to come one at a time." },
  boar:    { name:"a great boar", art:"boar", tier:0, hp:98,  pow:66, hide:.12, spd:.95, fear:1.05, purse:1.4,
    desc:"Half a ton of bad temper on short legs. It goes low, and it goes through things." },
  leopard: { name:"a leopard", art:"cat", tier:1, hp:88,  pow:64, hide:.05, spd:1.38, fear:1.35, purse:1.75,
    desc:"It will be behind him before the crowd has finished sitting down." },
  bear:    { name:"a bear of the north", art:"bear", tier:1, hp:134, pow:78, hide:.18, spd:.85, fear:1.3, purse:1.8,
    desc:"It fights standing, like a man, and it does not tire like one." },
  aurochs: { name:"an aurochs", art:"bull", tier:2, hp:165, pow:84, hide:.22, spd:.80, fear:1.4, purse:2.0,
    desc:"Black, and taller at the shoulder than the man sent against it." },
  lion:    { name:"a Numidian lion", art:"lion", tier:2, hp:124, pow:90, hide:.10, spd:1.15, fear:1.65, purse:2.2,
    desc:"The crowd came for this. So did the lion." },
};
const BEAST_SCALE = 2.05;
const BEAST_MOVES = {
  wolf: [["dart","comes in low from the flank"],["snap","snaps at the back of a leg"],["swarm","two of them press in at once"]],
  boar: [["charge","drives forward with its head down"],["gore","hooks upward with a tusk"],["barrel","barrels in at shin height"]],
  cat:  [["pounce","is airborne before anyone has moved"],["rake","rakes out with both forepaws"],["circle","slides around the outside, patient"]],
  bear: [["rear","rises onto its hind legs and comes down"],["maul","takes hold with both arms"],["swipe","swings a paw the size of a shield"]],
  bull: [["charge","charges the length of the sand"],["toss","gets a horn underneath"],["stamp","wheels and stamps"]],
  lion: [["spring","springs, all of it at once"],["claw","opens a stripe with one forepaw"],["jaws","gets its jaws to the shoulder"]],
};
/* A spear is how a man is meant to meet a beast; a shield is much less use than usual. */
const reachVsBeast = kit => {
  const a = kitArt(kit,"weapon");
  return a==="spear" ? 1.20 : a==="trident" ? 1.15 : a==="axe" ? 1.07
    : a==="dual" ? 0.95 : a==="dagger" ? 0.86 : 1.0;
};
const beastTier = t => Object.entries(BEASTS).filter(([,b])=>b.tier<=t);

function simulateVenatio(A, key, tA, ctx, opts){
  const B = BEASTS[key];
  const O = opts || {};
  const R0 = O.from || null;
  const prA = PR(A);
  const beats = [];
  A.mods = kitMods(A.kit, A.cls, A);
  const reach = reachVsBeast(A.kit);
  const smA = 55 + A.end*0.6;
  let vA = R0 ? R0.vA : 100, vB = R0 ? R0.vB : 100;
  let sA = R0 ? R0.sA : smA, crowd = R0 ? R0.crowd : clamp(20 + B.fear*12 + A.sho/9, 0, 100);
  let mom = R0 ? R0.mom : 0, round = R0 ? R0.round : 0;
  let ended = false, aDies = false, killed = false, lastTarget = "flank";
  const push = (kind, text, extra) => beats.push(Object.assign({
    kind, text, actor:null, round, vA:clamp(vA,0,100), vB:clamp(vB,0,100),
    sA:clamp(sA/smA*100,0,100), sB:100, crowd:clamp(crowd,0,100), mom:clamp(mom,-3,3), venatio:true
  }, extra||{}));

  if(!R0){
    push("intro", `They open the gate at the far end and let out ${B.name}. ${B.desc}`);
    push("salute", `${A.name} salutes no one. There is no one on the sand to salute.`);
    if(reach>=1.2) push("intro", `${prA.He} has the reach of a hunting spear, which is the only sane way to meet this.`);
    else if(reach<0.9) push("intro", `${prA.He} has nothing longer than ${prA.his} arm. The crowd notices before ${prA.he} does.`);
  } else push("crux", O.resumeLine || `${A.name} hears you.`);

  const cruxNow = r => O.stopAtCrux && !ended && r>=3 && r<=7 && (vA<=58 || vB<=42);
  let crux = null;
  const startR = R0 ? R0.round : 0;

  for(let r=startR+1; r<=14 && !ended; r++){
    round = r;
    const move = pick(ATTACKS[A.cls]);
    const bmove = pick(BEAST_MOVES[B.art]);
    const pA = power(A, tA, null, mom, 0.97+R()*0.06) * reach * (sA<22?0.74:1) * (0.74+R()*0.52);
    const pB = B.pow * BEAST_SCALE * (0.6 + B.spd*0.4) * (0.78+R()*0.5) * (1 + (100-vB)/100*0.12);   // a wounded beast is worse
    sA -= (tA==="aggressive"?10:8) * (1 - A.mods.spd*0.5);
    const diff = Math.abs(pA-pB);
    if(diff < 9){
      crowd = clamp(crowd+3,0,100);
      mom = mom>0? mom-1 : mom<0? mom+1 : 0;
      push("clash", pick([`${A.name} and the beast circle, neither giving ground.`,
        `A feint, a false rush — the sand between them stays empty.`,
        `${A.name} keeps the point between them. It is all that is keeping ${prA.him} alive.`]));
    } else if(pA>pB){
      const dmg = clamp((6 + diff/8 + A.str/12) * (1 + A.mods.atk*0.7) * (1 - B.hide), 4, 34) * (100/B.hp);
      vB -= dmg;
      mom = clamp(mom+1,-3,3);
      crowd = clamp(crowd + dmg/3 * B.fear + A.sho/24, 0, 100);
      push(dmg>=18?"crit":dmg>=10?"hit":"graze",
        dmg>=18 ? `${A.name} ${move[1]} and buries it deep — the beast screams!`
        : dmg>=10 ? `${A.name} ${move[1]}; the beast takes it and wheels away bleeding.`
        : `${A.name} ${move[1]}. It scores the hide and little more.`,
        { actor:"A", dmg:rnd(dmg) });
    } else {
      const tgt = pick(TARGETS);
      let dmg = clamp((7 + diff/7 + B.pow/9) * tgt[2] * (1 - A.mods.def*0.55), 5, 38);
      if(ctx.guarded) dmg *= 0.5;
      vA -= dmg;
      mom = clamp(mom-1,-3,3);
      crowd = clamp(crowd + dmg/2.4 * B.fear, 0, 100);
      lastTarget = tgt[0];
      push(dmg>=20?"crit":dmg>=11?"hit":"graze",
        dmg>=20 ? `It ${bmove[1]} — ${A.name}'s ${tgt[0]} opens to the bone and the crowd comes to its feet!`
        : dmg>=11 ? `It ${bmove[1]}. Blood down ${prA.his} ${tgt[0]}.`
        : `It ${bmove[1]}; ${prA.he} turns most of it aside.`,
        { actor:"B", dmg:rnd(dmg), target:tgt[0], tx:tgt[1][0], ty:tgt[1][1] });
    }
    if(sA<22 && !beats.some(x=>x.kind==="gas")) push("gas", `${A.name}'s arms are going. The beast has not slowed at all.`, {actor:"A"});
    if(crowd>=82 && !beats.some(x=>x.kind==="crowd")) push("crowd", `CAPUA IS ON ITS FEET!`);
    if(vB<=0){ ended = true; killed = true;
      push("end", `It goes down and stays down. ${A.name} stands over it with the crowd screaming ${prA.his} house's name — and no one's name at all.`); break; }
    if(cruxNow(r)){
      crux = { vA, vB, sA, crowd, mom, round:r };
      push("crux", vA<=vB
        ? `${A.name} is being taken apart and there is no editor's box in this — only your own.`
        : `The beast is hurt and slowing. ${A.name} has not seen it yet.`);
      break;
    }
    if(vA<=20){ ended = true;
      push("fall", `${A.name} is down.`, {actor:"A"});
      /* no missio here — only the handlers, and whether anyone wants them to hurry */
      const pull = 0.26 + crowd*0.0022 + (ctx.patron? ctx.patron.favor*0.0018 : 0) + A.pfame*0.0012;
      if(R() < pull){
        push("spared", `The handlers come in with irons and torches and drive it back off ${prA.him}. ${prA.He} is dragged out of the sand alive.`, {actor:"A"});
      } else {
        aDies = true;
        push("death", `No one comes. The beast is still on ${prA.him} when the crowd stops cheering, and that takes a while.`, {actor:"A"});
      }
      break;
    }
  }
  if(crux) return { beats, crux, unfinished:true };
  if(!ended){
    push("end", `The horn goes. They get ropes on it and drag it off, still alive. ${A.name} walks out on ${prA.his} own feet, which is the most that was on offer.`);
  }
  return { beats, killed, aDies, crowd, vA, vB, lastTarget };
}

/* ---- THE BOOKMAKERS ----
   Wager on your own man at the bookmakers' odds, or arrange for him to lose
   and bet against him. The coin is good. Being caught is not. */
const VIG = 0.12;
const STAKES_OPTS = [50, 150, 400];
function winChance(g, opp){
  const A = clone(g); A.kit = g.kit || defaultKit(g.cls); A.mods = kitMods(A.kit, A.cls, A);
  const B = clone(opp); B.kit = opp.kit || defaultKit(opp.cls); B.mods = kitMods(B.kit, B.cls, B);
  const pa = power(A, "measured", B.cls, 0, 1), pb = power(B, "measured", A.cls, 0, 1);
  // a power edge compounds across twelve rounds, so the raw ratio badly understates
  // the true chance; sharpen it on the odds scale to match measured outcomes
  const raw = clamp(pa/(pa+pb), 0.02, 0.98);
  const or = Math.pow(raw/(1-raw), 8.0);
  return clamp(or/(1+or), 0.05, 0.95);
}
const oddsFor = p => Math.max(1.05, (1/clamp(p,0.02,0.98)) * (1-VIG));
const oddsWord = o => `${o.toFixed(2)} to 1`;

function settleBet(d, g, offer, bet, won, res){
  if(!bet || !bet.amount) return [];
  const out = [];
  const p = bet.chance;
  const backedHim = !bet.against;
  const hit = backedHim ? won : !won;
  const odds = Math.max(1.05, (1/clamp(backedHim ? p : 1-p, 0.02, 0.98)) * (1-lanVig(d)));
  if(hit){
    const pay = rnd(bet.amount * odds);
    d.gold += pay;
    if(d.lanista) d.lanista.wonBets = (d.lanista.wonBets||0)+1;
    out.push(`The bookmakers pay ${pay} denarii at ${oddsWord(odds)}.`);
  } else {
    out.push(`Your ${bet.amount} denarii stays with the bookmakers.`);
  }
  if(bet.against){
    // he knows what he was told to do, whatever the crowd saw
    g.morale = clamp(g.morale-15, 0, 100);
    g.defiance = clamp(g.defiance+9, 0, 100);
    const kin = kinReact(d, g.id, "brother", -8, 5);
    let caught = 0.22 + (res.crowd>70 ? 0.18 : 0) - clamp(g.sho/400, 0, 0.16) + (offer.tier>=2 ? 0.12 : 0);
    if(won) caught += 0.3;   // he was told to lose and did not
    if(R() < clamp(caught, 0.05, 0.9)){
      d.flags.caughtFixing = (d.flags.caughtFixing||0) + 1;
      d.fame = Math.max(0, d.fame - 18);
      patronsOf(d).forEach(pt=>{ pt.favor = clamp(pt.favor-14, 0, 100); });
      recomputeFavor(d);
      d.unrest = clamp(d.unrest+9, 0, 100);
      d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-6,0,100); o.defiance=clamp(o.defiance+5,0,100); } });
      out.push(`It was noticed. The editor's men were watching the bookmakers, not the sand.`);
      chron(d, `Word is out that the bout was arranged. Capua has a word for lanistae who sell the sand, and it is not lanista.`, "bad");
    } else {
      out.push(`No one asked a question worth answering. ${g.name} has not looked at you since.`);
      chron(d, `${g.name} lost as ${PR(g).he} was told to. ${PR(g).He} walked back up the tunnel without a word.`, "bad");
    }
    if(kin.length) out.push(`${kin.map(o=>o.name).join(" and ")} saw what he was made to do.`);
  }
  return out;
}

const MELEE_CRUX = {
  finish:  { label:"Let them finish it",
    desc:"Say nothing. The sand decides, and it may decide that two of yours are the last two." },
  pullone: { label:"Pull one out",
    desc:"He walks off the sand. No share, no wound — and if he was the second of yours, there is no one left for the editor to make him fight." },
  pullall: { label:"Pull them all out",
    desc:"Forfeit. Nobody wins and nobody dies, and Capua watches you call it." },
};
function doMelee(d, ids, offer, pending, choice){
  const gs = ids.map(i=>d.gladiators.find(x=>x.id===i)).filter(g=>g && g.status==="active");
  if(gs.length<2) return null;
  const t = TIERS[offer.tier];
  const ents = gs.map(g=>{ const c = clone(g); c.kit = g.kit||defaultKit(g.cls); c.mine = true; c.gid = g.id; c.house = null; return c; });
  offer.field.forEach(o=>{ const c = clone(o); c.kit = o.kit||defaultKit(o.cls); c.mine = false; c.gid = null; ents.push(c); });
  const patron = topPatron(d);
  const mctx = { favor:d.favor, patron: patron?{name:patron.name,favor:patron.favor}:null,
    tie:(a,b)=> (a&&b) ? tieBetween(d,a,b) : null };
  const field = pending ? pending.ents : shuffled(ents);
  let res, withdrew = [];
  if(pending && choice && choice!=="finish"){
    const cx = JSON.parse(JSON.stringify(pending.crux));
    const upMine = field.map((e,i)=>i).filter(i=>field[i].mine && !cx.out[i]);
    const take = choice==="pullall" ? upMine
      : upMine.sort((a,b)=>cx.hp[a]-cx.hp[b]).slice(0,1);
    take.forEach(i=>{ cx.out[i]=true; cx.withdrew[i]=true; withdrew.push(field[i].gid); });
    const names = take.map(i=>field[i].name);
    if(choice==="pullall"){
      res = { beats:[Object.assign({}, {kind:"end", text:
        `Your man${names.length>1?"s come":" comes"} off the sand at your word and the melee closes over the space ${names.length>1?"they":"he"} left. The editor's face is worth exactly nothing to you and you look at it anyway.`,
        round:cx.round, melee:true, hp:cx.hp, out:cx.out, dead:cx.dead, crowd:cx.crowd, mom:0,
        vA:100, vB:100, sA:100, sB:100, a:null, b:null, actor:null })],
        winner:-1, ents:field, crowd:cx.crowd, forfeit:true };
      field.forEach((e,i)=>{ e.out = cx.out[i]; e.dead = cx.dead[i]; e.withdrew = cx.withdrew[i]; e.hpv = cx.hp[i]; });
    } else {
      res = simulateMelee(field, mctx, { from:cx,
        resumeLine:`${names[0]} is walked off the sand at your word. Whatever the crowd thinks of that, he will not be the last man standing and he will not have to be.` });
    }
  } else {
    res = simulateMelee(field, mctx, pending ? { from:pending.crux, resumeLine:"You say nothing at all, which is also a decision." } : { stopAtCrux:true });
  }
  if(res.unfinished){
    return { pending:{ ids, offer, crux:res.crux, ents:field, melee:true },
      beats:res.beats, crux:true, melee:true, tier:offer.tier, festival:offer.festival, stakes:"melee", venue:offer.venue, factions:d.factions,
      ents: field.map(e=>({ name:e.name, cls:e.cls, kit:e.kit, scars:e.scars||[], mine:!!e.mine, house:e.house,
        out:!!e.out, dead:!!e.dead, fem:isF(e) })) };
  }
  if(pending) res.beats = pending.beats.concat(res.beats);

  const sum = [`Appearance fees: ${t.app*gs.length} denarii.`];
  d.gold += t.app*gs.length;
  gs.forEach(g=>{ g.lastFought = d.week; g.fatigue = clamp(g.fatigue+28,0,100); wearKit(d, g, true); if(isAuctor(g)) g.auctor.served++; });

  const won = res.winner>=0 && res.ents[res.winner].mine;
  const winnerGid = won ? res.ents[res.winner].gid : null;
  if(won){
    d.gold += offer.purse;
    const fg = rnd(t.fameGain*2 + res.crowd/12);
    d.fame += fg;
    const w = d.gladiators.find(g=>g.id===winnerGid);
    if(w){ w.wins++; w.pfame += rnd(fg*0.7); w.morale = clamp(w.morale+8,0,100);
      for(const k of CLASSES[w.cls].key) w[k] = clamp(w[k]+0.9, 5, statCap(w,k)); }
    sum.push(`Purse: ${offer.purse} denarii. Fame of the house +${fg}.`);
  } else if(res.forfeit){
    gs.forEach(g=>{ g.losses++; g.defiance = clamp(g.defiance-6,0,100); });
    d.fame = Math.max(0, d.fame-11);
    d.unrest = clamp(d.unrest-6, 0, 100);
    addRep(d, "mercy", 9);
    patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-5,0,100); }); recomputeFavor(d);
    d.gladiators.forEach(o=>{ if(o.status==="active") o.morale = clamp(o.morale+5,0,100); });
    sum.push(`You called them off a melee. The purse is gone and so is a piece of your name, and every man in the cells knows which of those you chose.`);
  } else {
    d.fame = Math.max(0, d.fame+2);
    const stood = res.ents.filter(e=>e.mine && !e.out).length;
    res.ents.forEach(e=>{ if(!e.mine) return; const x = d.gladiators.find(y=>y.id===e.gid);
      if(x && !isGone(x)) formShift(d, x, e.out ? -14 : 20, e.out ? "went down in the melee" : "stood at the end of the melee"); });
    bookBout(d, { win:!!res.ents[res.winner] && !!res.ents[res.winner].mine, purse:offer.purse,
      crowd:res.crowd, tier:offer.tier, stakes:"melee", city:offer.city, kind:"melee",
      name:gs.map(x=>x.name).join(", "), festival:offer.festival });
    if(stood){
      const share = rnd(offer.purse*0.22*stood);
      d.gold += share;
      d.fame += rnd(t.fameGain*0.5);
      res.ents.forEach(e=>{ if(e.mine && !e.out){ const g=d.gladiators.find(x=>x.id===e.gid); if(g) g.pfame += rnd(t.fameGain*0.4); } });
      sum.push(`${stood===1?"One of yours was still upright":"Your men were still upright"} at the end — a survivor's share of ${share} denarii.`);
    } else sum.push(`The purse goes to another house.`);
  }

  /* two of yours left alone on the sand is a thing the ludus does not forget */
  const forced = res.beats.some(b=>b.kind==="appeal" && b.a!=null && b.b!=null
    && res.ents[b.a] && res.ents[b.b] && res.ents[b.a].mine && res.ents[b.b].mine);
  if(forced){
    const pairIds = res.ents.filter(e=>e.mine).map(e=>e.gid);
    const t2 = pairIds.length>=2 ? tieBetween(d, pairIds[0], pairIds[1]) : null;
    const brothers = t2 && t2.kind==="brother";
    d.unrest = clamp(d.unrest + (brothers?18:9), 0, 100);
    d.gladiators.forEach(o=>{ if(o.status==="active"){
      o.morale = clamp(o.morale-(brothers?16:8),0,100);
      o.defiance = clamp(o.defiance+(brothers?12:6),0,100); } });
    if(t2) d.ties = tieList(d).filter(x=>x!==t2);
    const w2 = winnerGid ? d.gladiators.find(g=>g.id===winnerGid) : null;
    if(w2){ w2.morale = clamp(w2.morale-(brothers?30:14),0,100); w2.defiance = clamp(w2.defiance+(brothers?16:7),0,100); }
    sum.push(brothers
      ? `They were brothers. You entered them both, and the editor would not take two victors.`
      : `Your last two had to finish it between themselves.`);
    chron(d, brothers
      ? `The melee came down to two of your own, and they had trained at the same post. Whatever the survivor is now, he is not what he was on the way in.`
      : `The melee ended with two of your own facing each other on the sand.`, "bad");
  }

  res.ents.forEach(e=>{
    if(!e.mine) return;
    const g = d.gladiators.find(x=>x.id===e.gid);
    if(!g) return;
    if(e.withdrew){ sum.push(`${g.name} was taken off the sand before it finished.`); return; }
    if(e.dead){
      g.status = "dead"; firstDeathWord(d, fullName(g)); firstDeathWord(d, fullName(g));
      d.fallen.push({ name:fullName(g), week:d.week });
      if(d.lanista) d.lanista.health = clamp(d.lanista.health - 1.3*collSoften(d)*(isDamn(g)?0.55:1)*(workPerk(d,"regard")?0.7:1)/docHealth(d), 0, 100);
      collBury(d, g);
      markUnburied(d, g);
    if(d.lanista) d.lanista.health = clamp(d.lanista.health - 1.3, 0, 100);
      const grieving = kinReact(d, g.id, "brother", -22, 12);
      d.unrest = clamp(d.unrest + (5 + grieving.length*3) * collSoften(d), 0, 100);
      dropTies(d, g.id);
      sum.push(`${g.name} is dead.`);
    } else if(e.out){
      g.losses++;
      const inj = injuryFor(pick(TARGETS)[0], true);
      g.injury = inj; g.status = "injured"; weekMark(d, "hurt", 1, fullName(g));
      g.morale = clamp(g.morale-6,0,100);
      sum.push(`${g.name} was carried off: ${inj.name.toLowerCase()}, ${inj.weeks} week${inj.weeks>1?"s":""}.`);
    }
  });

  chron(d, won ? `${res.ents[res.winner].name} was last one standing in the melee at ${offer.festival||"the games"} (+${offer.purse}d).`
    : `Your men were beaten in the melee at ${offer.festival||"the games"}.`, won?"good":"bad");
  serveWants(d, { type:"fight", gid:ids[0], win:won, oppDied:res.ents.some(e=>!e.mine&&e.dead),
    spared:false, crowd:rnd(res.crowd), tier:offer.tier, stakes:"melee" });
  if(d.games) d.games.offers = d.games.offers.filter(o=>o.id!==offer.id);
  return { beats:res.beats, sum, win:won, dead:res.ents.some(e=>e.mine&&e.dead), crowd:rnd(res.crowd), venue:offer.venue, factions:d.factions,
    melee:true, tier:offer.tier, festival:offer.festival, stakes:"melee",
    ents: res.ents.map(e=>({ name:e.name, cls:e.cls, kit:e.kit, scars:e.scars||[], mine:!!e.mine, house:e.house,
      out:!!e.out, dead:!!e.dead, fem:isF(e) })) };
}

function doVenatio(d, gid, offer, tactic, pending, choice){
  const g = d.gladiators.find(x=>x.id===gid);
  if(!g || g.status!=="active") return null;
  const B = BEASTS[offer.beast];
  const t = TIERS[offer.tier];
  const gc = clone(g); gc.kit = g.kit || defaultKit(g.cls);
  const patron = topPatron(d);
  const C = choice ? CRUX[choice] : null;
  const tacticNow = (C && C.tactic) ? C.tactic : tactic;
  const vctx = { patron: patron?{name:patron.name,favor:patron.favor}:null, guarded: choice==="cover" };
  let res;
  if(choice==="cloth"){
    res = { beats:[Object.assign({}, pending.crux, { kind:"end", actor:null, venatio:true, sB:100, text:
      `You are on your feet before you decide to be. The handlers come over the rail with irons and burning straw and get between them, and the crowd makes a sound you will hear for a week. ${g.name} is dragged out under it, alive.`,
      })], killed:false, aDies:false, crowd:pending.crux.crowd, vA:pending.crux.vA, vB:pending.crux.vB,
      lastTarget:"flank", forfeit:true };
  } else {
    res = simulateVenatio(gc, offer.beast, tacticNow, vctx,
      pending ? { from: pending.crux, resumeLine: C ? C.line(g) : undefined } : { stopAtCrux:true });
  }
  if(res.unfinished){
    return { pending:{ gid, offer, tactic, crux:res.crux, venatio:true },
      beats:res.beats, crux:true, venatio:true, beast:offer.beast, tier:offer.tier, stakes:"venatio", festival:offer.festival, venue:offer.venue, factions:d.factions,
      A:{ name:g.name, nick:g.nick, cls:g.cls, origin:g.origin, sub:"your house", kit:gc.kit, scars:gc.scars||[], fem:isF(g) },
      B:{ name:B.name, cls:"beast", sub:"the hunt" } };
  }
  if(pending) res.beats = pending.beats.concat(res.beats);

  if(g.ambition && g.ambition.kind==="nobeast") ambitionBroken(d, g);
  if(isAuctor(g)) g.auctor.served++;
  wearKit(d, g, true);
  g.lastFought = d.week;
  g.fatigue = clamp(g.fatigue+30, 0, 100);
  d.gold += t.app;
  const sum = [`Appearance fee: ${t.app} denarii.`];

  addRep(d, "blood", 6);
  if(res.killed) formShift(d, g, 22, `took the ${offer.beast}`);
  else if(!res.dead) formShift(d, g, -18, `was driven off the ${offer.beast}`);
  bookBout(d, { win:!!res.killed, died:!!res.dead, killed:!!res.killed, purse:offer.purse,
    crowd:res.crowd, rounds:res.beats ? Math.max(...res.beats.map(b=>b.round||0)) : 0,
    tier:offer.tier, cls:g.cls, stakes:"venatio", city:offer.city, kind:"venatio",
    name:fullName(g), opp:offer.beast, festival:offer.festival });
  if(res.killed && offer.beast==="lion") d.flags.killedLion = 1;
  if(res.killed){
    const purse = offer.purse;
    d.gold += purse;
    g.wins++;
    const fg = rnd((t.fameGain*1.35 + res.crowd/14) * B.fear);
    d.fame += fg;
    g.pfame += rnd(fg*0.35);            // the crowd cheers the kill, not the man
    sum.push(`Purse: ${purse} denarii. Fame of the house +${fg}.`);
    sum.push(`The renown of a hunt is thin — the mob remembers the beast.`);
  } else if(res.forfeit){
    d.fame = Math.max(0, d.fame-7);
    addRep(d, "mercy", 8);
    d.unrest = clamp(d.unrest-5, 0, 100);
    g.defiance = clamp(g.defiance-10, 0, 100);
    d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==gid) o.morale = clamp(o.morale+6,0,100); });
    sum.push(`No purse, and the editor will not forget being made to stop his own hunt. Neither will the cells.`);
  } else if(!res.aDies){
    sum.push(`No kill. The house takes only the fee.`);
  }

  /* the men do not think of this as fighting */
  const highborn = g.pfame >= 60;
  g.morale = clamp(g.morale - (highborn ? 22 : 12), 0, 100);
  g.defiance = clamp(g.defiance + (highborn ? 11 : 6), 0, 100);
  d.unrest = clamp(d.unrest + (highborn ? 7 : 4), 0, 100);
  d.gladiators.forEach(o=>{ if(o.id!==gid && o.status==="active"){
    o.morale = clamp(o.morale-3,0,100); o.defiance = clamp(o.defiance+2,0,100); } });
  kinReact(d, gid, "brother", -9, 5);
  if(highborn) sum.push(`A man of his renown, sent to the beasts. The whole ludus heard about it before he was back through the gate.`);

  if(res.aDies){
    g.status = "dead"; firstDeathWord(d, fullName(g)); g.fateNote = "beasts";
    d.fallen.push({ name:fullName(g)+" — to the beasts", week:d.week });
    if(d.lanista) d.lanista.health = clamp(d.lanista.health - 1.3*collSoften(d)*(isDamn(g)?0.55:1)*(workPerk(d,"regard")?0.7:1)/docHealth(d), 0, 100);
    favourLost(d, g, "dead");
    weekMark(d, "deaths");
    retireSteel(d, g);
    collBury(d, g);
    markUnburied(d, g);
    const grieving = kinReact(d, gid, "brother", -22, 12);
    d.unrest = clamp(d.unrest + (8 + grieving.length*3) * collSoften(d), 0, 100);
    d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-9*perkNerve(d),0,100); o.defiance=clamp(o.defiance+6,0,100); } });
    dropTies(d, gid);
    sum.push(`${g.name} is dead. There was not enough left to carry out whole.`);
  } else if(res.vA < 62 || res.forfeit){
    const inj = injuryFor(res.lastTarget, res.vA<40);
    g.injury = inj; g.status = "injured"; weekMark(d, "hurt", 1, fullName(g));
    sum.push(`Clawed open: ${inj.name.toLowerCase()}, ${inj.weeks} week${inj.weeks>1?"s":""} to mend.`);
  }

  chron(d, res.aDies
    ? `${g.name} was killed by ${B.name} at the morning hunt.`
    : res.killed ? `${g.name} killed ${B.name} before the crowd (+${offer.purse}d).`
    : `${g.name} survived the hunt without a kill.`, res.aDies?"bad":res.killed?"good":"info");
  serveWants(d, { type:"fight", gid, win:res.killed, oppDied:res.killed,
    spared:false, crowd:rnd(res.crowd), tier:offer.tier, stakes:"venatio" });
  if(d.games) d.games.offers = d.games.offers.filter(o=>o.id!==offer.id);
  return { beats:res.beats, sum, win:res.killed, dead:res.aDies, crowd:rnd(res.crowd), venue:offer.venue, factions:d.factions,
    venatio:true, beast:offer.beast, tier:offer.tier, stakes:"venatio", festival:offer.festival,
    A:{ name:g.name, nick:g.nick, cls:g.cls, origin:g.origin, sub:"your house", kit:gc.kit, scars:gc.scars||[], fem:isF(g) },
    B:{ name:B.name, cls:"beast", sub:"the hunt" } };
}

function doPairFight(d, ids, offer, tactic, pending, choice){
  const gs = ids.map(i=>d.gladiators.find(x=>x.id===i));
  if(gs.length!==2 || gs.some(g=>!g || g.status!=="active")) return null;
  const t = TIERS[offer.tier];
  const clones = gs.map(g=>{ const c = clone(g); c.kit = g.kit || defaultKit(g.cls); return c; });
  const opps = offer.opps.map(o=>{ const c = clone(o); c.kit = o.kit || defaultKit(o.cls); return c; });
  const patron = topPatron(d);
  const tie = tieBetween(d, gs[0].id, gs[1].id);
  const C = choice ? CRUX[choice] : null;
  const tacticNow = (C && C.tactic) ? C.tactic : tactic;
  const pctx = { d, favor:d.favor, tier:offer.tier, tie, patron: patron?{name:patron.name,favor:patron.favor}:null,
    guarded: choice==="cover" };
  let res;
  if(choice==="cloth"){
    const cx = pending.crux;
    res = { beats:[Object.assign({}, cx, { kind:"end", actor:null, slot:null, pair:true,
      hA:cx.hpA, hB:cx.hpB, dA:cx.dnA, dB:cx.dnB, xA:cx.ddA, xB:cx.ddB,
      vA:cx.hpA[0], vB:cx.hpB[0], sA:100, sB:100,
      text:`The cloth goes over the rail and both of them stop where they stand. Whatever the editor says afterward, they walk off this sand together.` })],
      win:false, crowd:cx.crowd, dead:{A:[false,false],B:[false,false]}, down:{A:cx.dnA,B:cx.dnB},
      hp:{A:cx.hpA,B:cx.hpB}, forfeit:true };
  } else {
    res = simulatePair(clones, opps, tacticNow, offer.stakes, pctx,
      pending ? { from: pending.crux, resumeLine: C ? C.line(gs[0]) : undefined } : { stopAtCrux:true });
  }
  if(res.unfinished){
    return { pending:{ ids, offer, tactic, crux:res.crux, pair:true },
      beats:res.beats, crux:true, pair:true, tier:offer.tier, stakes:offer.stakes, festival:offer.festival,
      A:clones.map(c=>({ name:c.name, nick:c.nick, cls:c.cls, kit:c.kit, scars:c.scars||[], sub:"your house", fem:isF(c) })),
      B:opps.map(o=>({ name:o.name, nick:o.nick, cls:o.cls, kit:o.kit, scars:o.scars||[], sub:o.house?`House ${o.house}`:"the pits", fem:isF(o) })) };
  }
  if(pending) res.beats = pending.beats.concat(res.beats);

  const sum = [`Appearance fees: ${t.app*2} denarii.`];
  d.gold += t.app*2;
  gs.forEach(g=>{ g.lastFought = d.week; g.fatigue = clamp(g.fatigue+24, 0, 100); wearKit(d, g, false); if(isAuctor(g)) g.auctor.served++; });

  if(res.win){
    const purse = rnd(offer.purse * (d.city?1:facPurse(d))); d.gold += purse;
    gs.forEach(x=>formShift(d, x, 16, "took a pair bout"));
    bookBout(d, { win:true, purse, crowd:res.crowd, tier:offer.tier, cls:gs[0]&&gs[0].cls,
      stakes:offer.stakes, city:offer.city, kind:"pair", name:gs.map(x=>x.name).join(" and "),
      oppHouse: offer.opp && offer.opp.house, festival:offer.festival });
    const fg = rnd(t.fameGain*1.6 + res.crowd/14);
    d.fame += fg;
    gs.forEach((g,i)=>{ if(!res.dead.A[i]){ g.wins++; g.pfame += rnd(fg*0.7); g.morale=clamp(g.morale+10,0,100);
      for(const k of CLASSES[g.cls].key) g[k] = clamp(g[k]+0.7, 5, statCap(g,k)); } });
    sum.push(`Purse: ${purse} denarii. Fame of the house +${fg}.`);
    if(tie && tie.kind==="brother") sum.push(`They fought as one man. Whatever is between them is stronger tonight.`);
  } else if(res.forfeit){
    gs.forEach(g=>{ g.losses++; g.defiance = clamp(g.defiance-7,0,100); });
    d.fame = Math.max(0, d.fame-8);
    d.unrest = clamp(d.unrest-5, 0, 100);
    addRep(d, "mercy", 8);
    patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-4,0,100); }); recomputeFavor(d);
    sum.push(`You stopped it with both of them still on their feet. The purse is gone and so is a little of your name.`);
  } else {
    gs.forEach((g,i)=>{ if(!res.dead.A[i]) g.losses++; });
    d.fame = Math.max(0, d.fame+1);
    gs.forEach(g=>{ g.morale=clamp(g.morale-9,0,100); });
    sum.push(`Beaten. The house takes only the fees.`);
  }
  // opponents killed
  const kills = res.dead.B.filter(Boolean).length;
  if(kills){ d.fame += 4*kills; sum.push(`${kills===2?"Both":"One"} of theirs will not leave the sand.`); }

  // your dead and wounded
  gs.forEach((g,i)=>{
    if(res.dead.A[i]){
      g.status = "dead"; firstDeathWord(d, fullName(g)); firstDeathWord(d, fullName(g));
      d.fallen.push({ name:fullName(g), week:d.week });
      if(d.lanista) d.lanista.health = clamp(d.lanista.health - 1.3*collSoften(d)*(isDamn(g)?0.55:1)*(workPerk(d,"regard")?0.7:1)/docHealth(d), 0, 100);
      collBury(d, g);
      markUnburied(d, g);
    if(d.lanista) d.lanista.health = clamp(d.lanista.health - 1.3, 0, 100);
      const grieving = kinReact(d, g.id, "brother", -22, 12);
      d.unrest = clamp(d.unrest + ((offer.stakes==="sine"?7:4) + grieving.length*3) * collSoften(d), 0, 100);
      dropTies(d, g.id);
      sum.push(`${g.name} is dead.`);
    } else if(res.down.A[i]){
      const inj = injuryFor(pick(TARGETS)[0], true);
      g.injury = inj; g.status = "injured"; weekMark(d, "hurt", 1, fullName(g));
      sum.push(`${g.name} is carried off: ${inj.name.toLowerCase()}, ${inj.weeks} week${inj.weeks>1?"s":""}.`);
    }
  });
  d.gladiators.forEach(o=>{ if(o.status==="active" && !ids.includes(o.id)) o.morale = clamp(o.morale+(res.win?2:-2),0,100); });
  gs.forEach(x=>{ if(x.ambition && x.ambition.kind==="beside" && tie && tie.kind==="brother") ambitionMet(d, x); });
  if(tie){ tie.strength = clamp(tie.strength + (res.win?9:5), 1, 100);
    if(tie.kind==="rival" && res.win && R()<0.35){ tie.kind = "brother";
      chron(d, `${gs[0].name} and ${gs[1].name} came off the sand together with their arms around each other. Whatever it was, it is over.`, "good"); } }
  else if(R()<0.45) addTie(d, gs[0].id, gs[1].id, "brother", 30);

  chron(d, res.win
    ? `${gs[0].name} and ${gs[1].name} took the pair bout at ${offer.festival||"the games"}.`
    : `${gs[0].name} and ${gs[1].name} were beaten in the pair bout at ${offer.festival||"the games"}.`, res.win?"good":"bad");
  serveWants(d, { type:"fight", gid:gs[0].id, win:res.win, oppDied:kills>0,
    spared:res.beats.some(b=>b.kind==="spared" && b.actor==="A"), crowd:rnd(res.crowd), tier:offer.tier, stakes:offer.stakes });
  if(d.games) d.games.offers = d.games.offers.filter(o=>o.id!==offer.id);
  return { beats:res.beats, sum, win:res.win, dead:res.dead.A.some(Boolean), crowd:rnd(res.crowd), venue:offer.venue, factions:d.factions,
    pair:true, tier:offer.tier, stakes:offer.stakes, festival:offer.festival,
    A:clones.map((c,i)=>({ name:c.name, nick:c.nick, cls:c.cls, kit:c.kit, scars:c.scars||[], sub:"your house", fem:isF(c) })),
    B:opps.map(o=>({ name:o.name, nick:o.nick, cls:o.cls, kit:o.kit, scars:o.scars||[], sub:o.house?`House ${o.house}`:"the pits", fem:isF(o) })) };
}

/* ---- PAIR BOUTS ----
   Two of yours against two of theirs. One man leads each exchange and his partner
   presses in behind him; how much that partner is worth depends entirely on what
   the two of them are to each other. Written apart from simulateFight on purpose —
   the single bout is the most tested code in the game and does not need touching. */
const ASSIST = 0.35;
function assistMult(d, a, b){
  const t = (a && b) ? tieBetween(d, a.id, b.id) : null;
  if(!t) return 1;
  return t.kind==="brother" ? 1 + t.strength/100*0.7 : 1 - t.strength/100*0.45;
}
function simulatePair(As, Bs, tA, stakes, ctx, opts){
  const O = opts || {}; const R0 = O.from || null;
  const beats = [];
  const tB = R0 ? R0.tB : pick(["aggressive","measured","defensive"]);
  As.forEach(f=>{ f.mods = kitMods(f.kit, f.cls, f); });
  Bs.forEach(f=>{ f.mods = kitMods(f.kit, f.cls, f); });
  const smA = As.map(f=>55+f.end*0.6), smB = Bs.map(f=>55+f.end*0.6);
  const hp = R0 ? { A:[...R0.hpA], B:[...R0.hpB] } : { A:[100,100], B:[100,100] };
  const st = R0 ? { A:[...R0.stA], B:[...R0.stB] } : { A:[...smA], B:[...smB] };
  const down = R0 ? { A:[...R0.dnA], B:[...R0.dnB] } : { A:[false,false], B:[false,false] };
  const dead = R0 ? { A:[...R0.ddA], B:[...R0.ddB] } : { A:[false,false], B:[false,false] };
  let crowd = R0 ? R0.crowd : clamp(10 + (As[0].sho+As[1].sho+Bs[0].sho+Bs[1].sho)/18
    + (As.reduce((s,f)=>s+(f.scars?f.scars.length:0),0))*0.9, 0, 100);
  let mom = R0 ? R0.mom : 0, round = R0 ? R0.round : 0, ended = false;
  const lead = s => { const arr = down[s]; return arr[0] ? (arr[1] ? -1 : 1) : 0; };
  const mate = s => { const l = lead(s); if(l<0) return -1; const o = 1-l; return down[s][o] ? -1 : o; };
  const push = (kind, text, extra) => beats.push(Object.assign({
    kind, text, actor:null, slot:null, round,
    hA:[clamp(hp.A[0],0,100), clamp(hp.A[1],0,100)],
    hB:[clamp(hp.B[0],0,100), clamp(hp.B[1],0,100)],
    dA:[...down.A], dB:[...down.B], xA:[...dead.A], xB:[...dead.B],
    vA:clamp(hp.A[lead("A")<0?0:lead("A")],0,100), vB:clamp(hp.B[lead("B")<0?0:lead("B")],0,100),
    sA:clamp(st.A[0]/smA[0]*100,0,100), sB:clamp(st.B[0]/smB[0]*100,0,100),
    crowd:clamp(crowd,0,100), mom:clamp(mom,-3,3), pair:true
  }, extra||{}));

  const nm = f => f.nick ? `${f.name}, ${f.nick}` : f.name;
  if(R0) push("crux", O.resumeLine || `They hear you and change.`);
  else push("intro", `${As[0].name} and ${As[1].name} take the sand together against ${nm(Bs[0])} and ${nm(Bs[1])} of the House of ${Bs[0].house||"another"}.`);
  const bond = ctx.tie;
  if(bond && bond.kind==="brother") push("intro", `Your two came up the tunnel shoulder to shoulder. They have trained at the same post for weeks, and it shows before a blow is struck.`);
  else if(bond && bond.kind==="rival") push("intro", `Your two will not look at each other. Whatever is between them, the crowd can smell it, and so can the pair across the sand.`);
  else push("intro", `Your two have no particular use for each other. They will fight their own fights.`);
  push("salute", `Four men salute the editor's box. Then the horn.`);
  if(!R0 && stakes==="sine") push("intro", `Sine missione. No appeals will be heard from anyone on this sand.`);

  const cruxNow = r => O.stopAtCrux && !ended && r>=3 && r<=7 &&
    (down.A[0] || down.A[1] || hp.A[0]<=52 || hp.A[1]<=52 || hp.B[0]<=40);
  let crux = null;
  const startR = R0 ? R0.round : 0;

  for(let r=startR+1; r<=16 && !ended; r++){
    round = r;
    const la = lead("A"), lb = lead("B");
    if(la<0 || lb<0) break;
    const ma = mate("A"), mb = mate("B");
    const asA = ma>=0 ? ASSIST * assistMult(ctx.d, As[la], As[ma]) : 0;
    const asB = mb>=0 ? ASSIST : 0;
    const move = pick(ATTACKS[As[la].cls]);
    const moveB = pick(ATTACKS[Bs[lb].cls]);
    const pA = (power(As[la], tA, Bs[lb].cls, mom, 0.97+R()*0.06) * (st.A[la]<22?0.78:1))
      * (1 + asA) * (0.74+R()*0.52);
    const pB = (power(Bs[lb], tB, As[la].cls, -mom, 0.97+R()*0.06) * (st.B[lb]<22?0.78:1))
      * (1 + asB) * (0.74+R()*0.52);
    st.A[la] -= (tA==="aggressive"?9:7) * (1 - As[la].mods.spd*0.5);
    st.B[lb] -= 7 * (1 - Bs[lb].mods.spd*0.5);
    if(ma>=0) st.A[ma] -= 3;
    if(mb>=0) st.B[mb] -= 3;
    const diff = Math.abs(pA-pB);
    if(diff < 8){
      crowd = clamp(crowd+2,0,100);
      mom = mom>0? mom-1 : mom<0? mom+1 : 0;
      push("clash", pick(CLASH_L)(As[la].name, Bs[lb].name));
    } else {
      const aWins = pA>pB;
      const atk = aWins ? As[la] : Bs[lb], def = aWins ? Bs[lb] : As[la];
      const tgt = pick(TARGETS);
      let dmg = clamp((5 + diff/8 + atk.str/13) * 1.18 * tgt[2] * (1 + atk.mods.atk*0.7) * (1 - def.mods.def), 3, 32);
      if(ctx.guarded && !aWins) dmg *= 0.5;
      if(aWins) hp.B[lb] -= dmg; else hp.A[la] -= dmg;
      mom = clamp(mom + (aWins?1:-1), -3, 3);
      crowd = clamp(crowd + dmg/4.2 + atk.sho/30 + atk.mods.sho*9, 0, 100);
      const kind = dmg>=18?"crit" : dmg>=10?"hit":"graze";
      const helper = aWins ? (ma>=0 && R()<0.3 ? As[ma] : null) : (mb>=0 && R()<0.3 ? Bs[mb] : null);
      const txt = helper
        ? `${helper.name} draws the guard wide and ${atk.name} ${(aWins?move:moveB)[1]} — ${def.name}'s ${tgt[0]} opens!`
        : dmg>=18 ? `${atk.name} ${(aWins?move:moveB)[1]} — ${def.name}'s ${tgt[0]} opens wide and the crowd ROARS!`
        : dmg>=10 ? `${atk.name} ${(aWins?move:moveB)[1]}; blood springs from ${def.name}'s ${tgt[0]}!`
        : `${atk.name} ${(aWins?move:moveB)[1]}. The edge only kisses ${def.name}'s ${tgt[0]}.`;
      push(kind, txt, { actor: aWins?"A":"B", slot: aWins?la:lb, dmg:rnd(dmg), target:tgt[0], tx:tgt[1][0], ty:tgt[1][1] });
    }
    // anyone below the line goes down, and the sand decides what happens next
    for(const side of ["A","B"]){
      const arr = side==="A" ? As : Bs;
      for(let i=0;i<2;i++){
        if(down[side][i] || hp[side][i] > 20) continue;
        down[side][i] = true;
        push("fall", `${arr[i].name} goes down!`, { actor:side, slot:i });
        const isYours = side==="A";
        if(stakes==="sine"){
          dead[side][i] = true;
          push("death", `No mercy was on offer. ${arr[i].name} does not rise.`, { actor:side, slot:i });
        } else {
          const f = arr[i];
          const pat = ctx.patron;
          const spare = crowd*0.33 + (f.pfame||0)*0.3 + (isYours?ctx.favor:35)*0.5 + f.sho*0.2 + (f.heart||50)*0.1
            + (pat && isYours ? pat.favor*0.12 : 0) + R()*22 - (ctx.tier===0?8:0) - (ctx.hostile&&isYours?18:0);
          if(spare>=42) push("spared", `${f.name} raises two fingers — and the editor's hand opens. He is dragged clear.`, { actor:side, slot:i });
          else { dead[side][i] = true; push("death", `The thumb turns for ${f.name}. It is done quickly.`, { actor:side, slot:i }); }
        }
      }
    }
    if(cruxNow(r) && !(down.A[0]&&down.A[1]) && !(down.B[0]&&down.B[1])){
      crux = { hpA:[...hp.A], hpB:[...hp.B], stA:[...st.A], stB:[...st.B],
        dnA:[...down.A], dnB:[...down.B], ddA:[...dead.A], ddB:[...dead.B], crowd, mom, round:r, tB };
      push("crux", (down.A[0]||down.A[1])
        ? `One of yours is down and the other is alone out there. The crowd is looking at your box.`
        : `It is going badly and both of them know it. The crowd is looking at your box.`);
      break;
    }
    if(down.A[0] && down.A[1]){ ended = true; push("end", `Both of your men are down. The bout is lost.`); }
    else if(down.B[0] && down.B[1]){ ended = true; push("end", `Both of theirs are down. ${As.filter((f,i)=>!down.A[i]).map(f=>f.name).join(" and ")} stand alone on the sand — and Capua is on its feet.`); }
    if(crowd>=80 && r>3 && !beats.some(b=>b.kind==="crowd")) push("crowd", `CAPUA IS ON ITS FEET!`);
  }
  if(crux) return { beats, crux, unfinished:true };
  if(!ended){
    const aStand = down.A.filter(x=>!x).length, bStand = down.B.filter(x=>!x).length;
    const win = aStand>=bStand;
    push("end", `The horn sounds. ${win? "The editor raises his hand toward your house." : "The editor raises his hand toward the other house."}`);
    return { beats, win, crowd, dead, down, hp };
  }
  return { beats, win: !(down.A[0] && down.A[1]), crowd, dead, down, hp };
}

/* The word from the box. Press/cover/the cloth are the old three; the rest are
   orders that reach into the exchange itself. Each carries an `order` the fight
   engine reads on the next round, and a `when` that keeps it off the card when it
   would make no sense. */
const CRUX = {
  press: { label:"Press him", short:"PRESS",
    desc:"Front foot. He hits harder and takes more doing it.",
    tactic:"aggressive", line:g=>`You put your voice across the sand and ${g.name} goes forward.` },
  cover: { label:"Cover up", short:"COVER",
    desc:"Behind the guard. He wins less and lives more.",
    tactic:"measured", line:g=>`${g.name} hears it and gets everything behind the guard.` },
  finish: { label:"Go for the finish", short:"FINISH", tactic:"aggressive", order:{ sig:true },
    desc:"His one move, now — whatever it costs. It ends the bout or leaves him wide open.",
    when:cx=>cx.vA==null || cx.vB==null || cx.vA >= cx.vB-6 || (cx.sA==null||cx.sA>=45),
    line:g=>`${g.name} sets his feet for the one thing his style is for.` },
  legs: { label:"Work his legs", short:"LEGS", tactic:"measured", order:{ target:"thigh", debuff:"legs" },
    desc:"Take him apart a piece at a time. Slower, but he stops moving.",
    when:cx=>cx.vB==null || cx.vB>=42,
    line:g=>`${g.name} stops hunting the kill and starts hunting the legs.` },
  breather: { label:"Wave him off", short:"BREATHE", tactic:"defensive", order:{ breather:true },
    desc:"Give ground and get your wind. You lose the crowd and the front foot, not the bout.",
    when:cx=>cx.sA==null || cx.sA<=45 || cx.vA<=55,
    line:g=>`${g.name} gives ground on purpose, hands high, dragging air back into his chest.` },
  cloth: { label:"Throw in the cloth", short:"THE CLOTH",
    desc:"Forfeit. He loses and lives, and Capua watches you call it.",
    tactic:null, line:g=>`` },
};

function doFight(d, gid, offer, tactic, bet, pending, choice, plan){
  const g = d.gladiators.find(x=>x.id===gid);
  const t = TIERS[offer.tier];
  let bribeHouse = null;
  if(offer.tier>0 && d.flags.editorBribed){ bribeHouse = d.flags.editorBribed; delete d.flags.editorBribed; }
  const gc = clone(g); gc.kit = g.kit || defaultKit(g.cls);
  if(bet && bet.against){ for(const k of ["str","agi","tec","dis"]) gc[k] = Math.max(5, gc[k]*0.74); }
  const C = choice ? CRUX[choice] : null;
  const tacticNow = (C && C.tactic) ? C.tactic : tactic;
  const oc = clone(offer.opp); oc.kit = offer.opp.kit || defaultKit(offer.opp.cls);
  const patron = topPatron(d);
  const nem = nemesisIn(d, offer.opp);
  if(nem){ gc.morale = clamp(gc.morale - (nem.hated?14:8), 0, 100); }
  /* these are bout-start effects — only on the opening call, never on a coached resume */
  if(!pending && offer.stakes==="sine" && g.ambition && g.ambition.kind==="nokill") ambitionBroken(d, g);
  if(!pending && offer.rematch && g.ambition && g.ambition.kind==="revenge") ambitionMet(d, g);
  const F = (d.games && d.games.fest) ? CALENDAR.find(x=>x.key===d.games.fest) : null;
  const imperial = !!offer.imperial;
  const away = offer.city ? CITIES[offer.city] : null;
  const localStanding = offer.city ? 12 + knownIn(d, offer.city)*0.45 : 0;
  if(!pending && g.injury && g.injury.care==="work") remember(d, g, "hurt");
  if(!pending && offer.stakes==="sine") remember(d, g, "sine");
  if(!offer.venue) offer.venue = venueFor(d, offer);
  if(!offer.sky) offer.sky = skyFor(d, offer);
  const V = VEN(offer.venue);
  const W = skyMods(offer.sky, offer.venue, g.cls);
  const planKey = (pending && pending.plan) || plan || offer.plan || "none";
  const PE = planEffect(planKey, offer.opp);
  const wasG = { fatigue:g.fatigue, wins:g.wins, pfame:g.pfame, cls:g.cls, agi:g.agi, str:g.str, end:g.end,
    kit:Object.assign({},g.kit), wear:Object.assign({},g.wear||{}), strain:strainOf(g), form:formOf(g),
    regard:regardOf(g), lasting:lastingOf(g).slice() };
  gc.regardMult = regardPower(g) * formPower(g) * lastNum(g,"atk") * lastNum(g,"guard") * ((g.mastery && g.mastery.cls===g.cls) ? masteryPower(g) : 1);
  gc.lastStam = lastNum(g,"stam");
  gc.lastLate = lastNum(g,"latePow");
  gc.formStam = formStam(g);
  if(offer.stakes==="sine" && lawSine(d) && !offer.sealed){ d.gold -= lawSine(d); offer.sealed = 1; }
  const simCtx = { plan:PE, fav:favMissio(g) + veteranGuard(g) + (away ? 0 : riseFav(d)) + pit(d,"mercy",0), doctrine:docMissio(d), footing:V.footing * W.footing, sky:W.stam, venue:V.missio, aedile: away ? 0 : aedileMissio(d), strange: away ? Math.max(0, 19 - knownIn(d, offer.city)*0.19) * docStrange(d) : 0,
      favor: imperial ? Math.min(d.favor, 20) : (away ? localStanding : d.favor), tier: Math.min(offer.tier,3),
      hostile:!!bribeHouse, patron: imperial ? null : (patron ? {name:patron.name, favor:patron.favor} : null),
      repShow: workPerk(d,"crowd") + femCrowd(g) + favCrowd(g) + W.crowd + provCrowd(g) + ((g.mastery && g.mastery.cls===g.cls) ? masteryCrowd(g) : 0) + (repStyle(d)==="show" ? 8 : 0) + (nem ? 10 : 0) + (away ? 0 : facCrowd(d, g.cls)) + seasonCrowd(d) + V.crowd,
      guarded: choice==="cover" };
  let res;
  if(choice==="cloth"){
    /* you stop it yourself; there is no appeal to lose because nobody asked for one */
    d.flags.threwCloth = 1;
    remember(d, g, "cloth");
    res = { beats:[Object.assign({}, pending.crux, { kind:"end", actor:null, text:
      `A white cloth goes over the rail from your box. The editor's man steps between them and the crowd finds out what it thinks about that in one long noise. ${g.name} is walked off the sand on his own feet.`,
      vA:pending.crux.vA, vB:pending.crux.vB, sA:100, sB:100, crowd:pending.crux.crowd, mom:0 })],
      winner:"B", crowd:pending.crux.crowd, fell:false, vA:pending.crux.vA, vB:pending.crux.vB,
      aDies:false, bDies:false, lastTarget:"flank", spared:false, forfeit:true };
  } else {
    res = simulateFight(gc, oc, tacticNow, offer.stakes, simCtx,
      pending ? { from: pending.crux, resumeLine: C ? C.line(g) : undefined, stopAtCrux: !offer.imperial, order: C ? C.order : null }
              : { stopAtCrux: !offer.imperial });
  }
  if(res.unfinished){
    return { pending:{ gid, offer, tactic, bet, plan:planKey, crux:res.crux, bribeHouse },
      beats: res.beats, crux:true, tier:offer.tier, stakes:offer.stakes, festival:offer.festival, venue:offer.venue, factions:d.factions,
      A:{ name:g.name, nick:g.nick, cls:g.cls, origin:g.origin, sub:"your house", kit:gc.kit, scars:gc.scars||[], fem:isF(g) },
      B:{ name:offer.opp.name, nick:offer.opp.nick, cls:offer.opp.cls, origin:offer.opp.origin,
          sub:offer.opp.house? `House ${offer.opp.house}`:"the pits", kit:oc.kit, scars:oc.scars||[], fem:isF(offer.opp) } };
  }
  if(pending) res.beats = pending.beats.concat(res.beats);
  if(imperial){
    res.beats.splice(1, 0, Object.assign({}, res.beats[0], { kind:"intro", actor:null,
      text:`The box above the sand is not a magistrate's. Whatever your patrons are worth in Capua, they are worth nothing here.` }));
  }
  const intro = [];
  if(offer.rematch) intro.push(`The crowd remembers their last meeting — this one has beaten your house before. Capua wants redemption, or blood.`);
  else if(offer.grudgeM) intro.push(`They have met before, and he left the sand beaten. He fights tonight with something to erase.`);
  if(bribeHouse) intro.push(`You mark new rings on the editor's fingers — House ${bribeHouse}'s coin, no doubt.`);
  if(nem) intro.push(nem.hated
    ? `${offer.opp.name} — ${nem.title} — is across the sand, and he is the man who killed one of yours. ${g.name} knows exactly who that is.`
    : `${offer.opp.name}, whom your own men call ${nem.title}, is across the sand for the third time.`);
  if(intro.length){
    const base = res.beats[0];
    res.beats.splice(1, 0, ...intro.map(t=>Object.assign({}, base, { kind:"intro", text:t, actor:null })));
  }
  const win = res.winner==="A";
  const where = offer.festival || "the pits";
  g.lastFought = d.week;
  g.fatigue = clamp(g.fatigue+26, 0, 100);
  wearKit(d, g, offer.stakes==="sine");
  if(isAuctor(g)) g.auctor.served++;
  d.gold += t.app;
  let purse = 0;
  const sum = [`Appearance fee: ${t.app} denarii.`];

  if(win){
    purse = rnd(offer.purse * (away?1:facPurse(d)) * (away?1:aedilePurse(d)) * docPurse(d) * W.purse * favPurse(g) * femPurse(g) * fanPurse(g) * risePurse(d) * pit(d,"purse"));
    /* the pits pay out of a bag at the rope. an editor pays when his clerk gets to it. */
    const onCredit = offer.imperial ? "imperial" : offer.city ? "city" : offer.booking ? "booking" : offer.festival ? "games" : null;
    if(onCredit && purse >= 140){
      const now = rnd(purse * 0.35);
      d.gold += now;
      bookPurse(d, purse - now, offer.editor || (offer.festival ? `the editor of ${offer.festival}` : "the editor"), onCredit);
    } else d.gold += purse;
    weekMark(d,"purse",purse); g.wins++;
    const fineKit = F && F.fineBonus && GEAR[gc.kit.weapon] && GEAR[gc.kit.weapon].price>0;
    const fg = rnd((t.fameGain + res.crowd/18 + (offer.stakes==="sine"?6:0)) * (offer.stakes==="blood"?0.55:1)
      * (isF(g)?1.2:1) * (F? F.fame : 1) * (fineKit?1.25:1) * (away?1:facFame(d, g.cls)) * V.fame * docFame(d));
    if(fineKit) sum.push(`Vulcan's day, and the crowd saw whose steel he carried.`);
    if(away){
      const fit = repStyle(d)===away.taste;
      const gained = rnd((7 + res.crowd/16 + (fit?5:0)) * docKnown(d));
      d.known[offer.city] = clamp(knownIn(d,offer.city) + gained, 0, 100);
      sum.push(`${away.name} is beginning to know the name — local standing ${Math.round(knownIn(d,offer.city))}.${fit? " They like the kind of house you are." : ""}`);
    }
    d.fame += fg;
    g.pfame += fg + rnd(res.crowd/14) + (g.traits.includes("Glory-Seeker")?3:0);
    if(d.saga && d.saga.gid===g.id && d.saga.stage<3) d.saga.renown = clamp(d.saga.renown + (res.bDies?7:5) + (res.crowd>=80?3:0), 0, 100);
    { const wasFav = isFavourite(g); g.fans = clamp(fansOf(g) + fanGain(res, g, tacticNow), 0, 100);
      if(!wasFav && isFavourite(g)) sum.push(`The crowd has taken ${g.name} for its own — he is a favourite of the sand now, and favourites fill seats.`); }
    g.morale = clamp(g.morale+10, 0, 100);
    for(const k of CLASSES[g.cls].key) g[k] = clamp(g[k]+0.7, 5, statCap(g,k));
    sum.push(`Purse: ${purse} denarii. Fame of the house +${fg}.`);
    d.gladiators.forEach(o=>{ if(o.id!==gid && o.status==="active") o.morale = clamp(o.morale+2,0,100); });
    kinReact(d, gid, "brother", 4, -1);
    kinReact(d, gid, "rival", -3, 1);
    if(g.ambition && g.ambition.kind==="champion" && offer.tier>=2 && d.games && d.games.fest==="romani") ambitionMet(d, g);
    if(!g.nick && g.wins>=5){ g.nick = pick(NICKS);
      if(g.ambition && g.ambition.kind==="nickname") ambitionMet(d, g);
      sum.push(`The crowd has given ${PR(g).him} a name: ${g.name}, ${g.nick}!`); }
  } else if(res.forfeit){
    g.losses++;
    d.fame = Math.max(0, d.fame-9);
    g.morale = clamp(g.morale-4, 0, 100);
    g.defiance = clamp(g.defiance-8, 0, 100);
    d.unrest = clamp(d.unrest-4, 0, 100);
    addRep(d, "mercy", 8);
    patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-5,0,100); }); recomputeFavor(d);
    d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==gid) o.morale = clamp(o.morale+4,0,100); });
    sum.push(`You stopped it. The purse is forfeit and the editor will remember being made to look foolish — but every man in your cells saw who called it.`);
  } else {
    g.losses++;
    d.fame = Math.max(0, d.fame+1);
    g.morale = clamp(g.morale-9, 0, 100);
    sum.push(`Defeat. The house takes only the appearance fee.`);
  }

  if(res.bDies){
    g.kills++; g.pfame += 6; d.fame += 4;
    if(!g.traits.includes("Brutal")) d.gladiators.forEach(o=>{ if(o.status==="active") o.defiance = clamp(o.defiance+1.5,0,100); });
    sum.push(`A kill recorded. The cells are quieter tonight.`);
  }
  if(res.aDies){
    g.status = "dead"; firstDeathWord(d, fullName(g));
    d.fallen.push({ name:fullName(g), week:d.week });
    if(d.lanista) d.lanista.health = clamp(d.lanista.health - 1.3*collSoften(d)*(isDamn(g)?0.55:1)*(workPerk(d,"regard")?0.7:1)/docHealth(d), 0, 100);
    favourLost(d, g, "dead");
    loseFavourite(d, g, "dead");
    weekMark(d, "deaths");
    retireSteel(d, g);
    collBury(d, g);
    markUnburied(d, g);
    d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-8,0,100); o.defiance=clamp(o.defiance+(offer.stakes==="sine"?5:3),0,100); } });
    const grieving = kinReact(d, gid, "brother", -22, 12);
    kinReact(d, gid, "rival", 3, 0);
    const dc = (F && F.deathCost) ? F.deathCost : 1;
    d.unrest = clamp(d.unrest + ((offer.stakes==="sine"?7:4) + grieving.length*3) * dc * collSoften(d), 0, 100);
    if(dc>1){ d.fame = Math.max(0, d.fame-8);
      patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-6,0,100); }); recomputeFavor(d);
      sum.push(`A death at the Floralia. The mob came for flowers and got a funeral, and they will remember which house gave it to them.`); }
    if(grieving.length){
      const names = grieving.map(o=>o.name).join(" and ");
      chron(d, `${names} ${grieving.length>1?"were":"was"} at the gate when they carried ${g.name} out. ${grieving.length>1?"Neither":"He"} said anything, which is worse.`, "bad");
      sum.push(`${names} watched him die. That will not be forgotten in the cells.`);
    }
    dropTies(d, gid);
    sum.push(`${g.name} is dead. ${PR(g).His} cell stands empty tonight.`);
  } else if(!win && res.fell){
    const inj = injuryFor(res.lastTarget, true);
    agonyWear(g, inj);
    g.injury = inj; g.status = "injured"; weekMark(d, "hurt", 1, fullName(g));
    sum.push(`${PR(g).He} is carried to the medicus: ${inj.name.toLowerCase()}, ${inj.weeks} week${inj.weeks>1?"s":""} to mend.${bodyWear(g)>0.4?" An old body does not shrug these off the way it used to.":""}`);
  } else if(win && res.vA<45 && R()<0.4){
    const inj = injuryFor(res.lastTarget, false);
    agonyWear(g, inj);
    g.injury = inj; g.status = "injured"; weekMark(d, "hurt", 1, fullName(g));
    sum.push(`Victory, but not unmarked: ${inj.name.toLowerCase()}, ${inj.weeks} week${inj.weeks>1?"s":""} to mend.`);
  }
  if(offer.stakes==="sine") d.gladiators.forEach(o=>{ if(o.status==="active") o.defiance=clamp(o.defiance+1,0,100); });

  if(offer.oppRef && d.rivals){
    const h = d.rivals.find(x=>x.name===offer.oppRef.house);
    const f = h ? h.fighters.find(x=>x.id===offer.oppRef.fid) : null;
    if(h && f){
      const wasNem = d.nemesis && d.nemesis.fid===f.id;
      if(win){
        f.losses++; f.lostToYou = (f.lostToYou||0)+1;
        h.grudge = clamp(h.grudge+6, 0, 100);
        if(wasNem) nemesisSettled(d, !!res.bDies).forEach(l=>sum.push(l));
        if(res.bDies){
          h.fighters = h.fighters.filter(x=>x.id!==f.id);
          h.grudge = clamp(h.grudge+20, 0, 100);
          h.fame = Math.max(0, h.fame-8);
          sum.push(`House ${h.name} will not forget this death.`);
        } else {
          f.injury = injuryFor(res.lastTarget, false);
        }
      } else {
        f.wins++; f.beatYou = (f.beatYou||0)+1; f.pfame += ri(4,9); h.fame += 4;
        if(!f.nick && f.wins>=5) f.nick = pick(NICKS);
        if(res.aDies){ f.kills++; f.killedYours = (f.killedYours||0)+1;
          sum.push(`He has taken one of yours now. The cells will hear the name before you get home.`); }
        nemesisCheck(d, h, f);
      }
      nemClash(d, h.name, win ? (res.bDies?16:8) : (res.aDies?22:12));
    }
  }

  chron(d, win? `${g.name} ${res.bDies?"killed "+offer.opp.name:"took victory"} at ${where} (+${purse+t.app}d).` :
    res.aDies? `${g.name} died on the sand at ${where}.` : `${g.name} was beaten at ${where}.`, win?"good":"bad");
  if(d.games) d.games.offers = d.games.offers.filter(o=>o.id!==offer.id);
  if(offer.imperial && d.rome){
    d.rome.fought++;
    if(win) d.rome.won++;
    sum.push(`Imperial bout ${d.rome.fought} of ${ROME_BOUTS} — ${d.rome.won} won.`);
  }
  if(isF(g)) patronsOf(d).forEach(p=>{
    if(p.rank==="senator") p.favor = clamp(p.favor-2,0,100);
    if(p.rank==="noble") p.favor = clamp(p.favor+3,0,100);
  });
  if(res.bDies) addRep(d, "blood", 7);
  if(offer.stakes==="sine") addRep(d, "blood", 5);
  if(res.crowd>=90) addRep(d, "show", 3);
  if(tactic==="showboat") addRep(d, "show", 6);
  if(isF(g)) addRep(d, "show", 2);
  if(win && res.vA>=72) addRep(d, "craft", 8);
  if(win && tactic==="defensive") addRep(d, "craft", 7);
  if(res.spared && !res.bDies) addRep(d, "mercy", 3);
  if(offer.primus){
    if(offer.defence){
      if(!win){ primusLose(d, offer.opp.name, false); sum.push(`The primacy is lost.`); }
      else { if(d.primus && d.primus.mine){ d.primus.defences++;
        d.fame += 18; g.pfame += 8;
        sum.push(`The primacy holds. ${d.primus.defences} defended.`); } }
    } else if(win){
      primusTake(d, g, offer.opp.name);
      sum.push(`Primus of Capua.`);
    } else sum.push(`He does not take it. The title stays where it was.`);
  }
  if(offer.booking){ const x = (d.deadlines||[]).find(y=>y.id===offer.booking);
    if(x){ x.met = true; d.fame += 10;
      patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor+5,0,100); }); recomputeFavor(d);
      sum.push(`The booking is honoured. ${x.editor} pays the balance without being asked.`); } }
  if(offer.challenge){ const x = (d.deadlines||[]).find(y=>y.id===offer.challenge);
    if(x){ x.met = true;
      d.fame += win ? 26 : 8;
      facMove(d, "mob", win?7:3);
      sum.push(win ? `You answered ${x.lan} in public and your man won it.` : `The challenge was answered. That is most of what it was for.`);
      if(x.nem) settleNemHouse(d, win);
      if(x.saga && d.saga && d.saga.gid===g.id){
        if(win){ d.saga.stage = 4; d.saga.renown = 100; scheduleArc(d, "sagaFreedom", ri(1,2), {});
          sum.push(`${g.name} has beaten the man the crowd named his equal. There is only one thing left they will accept.`);
          chron(d, `${g.name} put ${x.foe} down in front of all of Capua. The chant that went up was not his name. It was one word, over and over: the rudis.`, "good"); }
        else { d.saga.stage = 2; d.saga.renown = clamp(d.saga.renown-25, 30, 100);
          chron(d, `${g.name} met ${x.foe} and did not win it. The story does not end here — the crowd will want it told again — but tonight it belongs to the other man.`, "bad"); }
      } } }
  if(win) formShift(d, g, offer.tier>=2 ? 24 : 18, `beat ${offer.opp.name}`);
  else formShift(d, g, res.aDies ? 0 : -22, `lost to ${offer.opp.name}`);
  if(res.bDies) formShift(d, g, 7, `killed ${offer.opp.name}`);
  if(g.status==="injured") formShift(d, g, -13, `carried off against ${offer.opp.name}`);
  bookBout(d, { win, died:!!res.aDies, killed:!!res.bDies, purse, crowd:res.crowd,
    rounds:res.beats ? Math.max(...res.beats.map(b=>b.round||0)) : 0,
    tier:offer.tier, cls:g.cls, stakes:offer.stakes, city:offer.city,
    kind: offer.imperial?"rome" : offer.primus?"primacy" : offer.booking?"contracted" : "single",
    oppHouse: offer.opp && offer.opp.house, name:fullName(g), opp:offer.opp && offer.opp.name,
    festival:offer.festival });
  if(PE.right===true) sum.push(`The plan held. ${PLANS[planKey].name} was the right read of him.`);
  else if(PE.right===false) sum.push(`The plan was wrong. He was not the man you took him for.`);
  if(!away) facAfterBout(d, g, res, offer, tacticNow, choice);
  if(win && res.bDies && offer.opp && offer.opp.kit){
    const s = shuffled(SLOTS).find(x=>wears(GEAR[offer.opp.kit[x]]) && !provOf(g,x) && GEAR[g.kit[x]]);
    if(s && R() < 0.38){
      const id = offer.opp.kit[s];
      d.gear[id] = (d.gear[id]||0)+1;
      d.gearCond = d.gearCond || {}; (d.gearCond[id] = d.gearCond[id] || []).push(ri(55,85));
      g.kit = Object.assign({}, g.kit, { [s]: id });
      g.wear = Object.assign({}, g.wear||{}, { [s]: ri(55,85) });
      giveProv(d, g, s, "spoils", { from:offer.opp.name, house:offer.opp.house });
      chron(d, `${g.name} comes off the sand carrying ${offer.opp.name}'s ${GEAR[id].name.toLowerCase()}. Nobody stops him and nobody asks for it back.`, "good");
    }
  }
  if(offer.imperial && win) SLOTS.forEach(s=>{ if(wears(GEAR[g.kit[s]])) giveProv(d, g, s, "imperial"); });
  if(holdsPrimus(d,g)) SLOTS.forEach(s=>{ if(wears(GEAR[g.kit[s]]) && !provOf(g,s)) giveProv(d, g, s, "primacy"); });
  favourBout(d, g, { crowd:res.crowd, beats:res.beats, win, spared:res.beats && res.beats.some(b=>b.kind==="spared" && b.actor==="A") }, offer);
  weekMark(d, "bouts");
  pactBout(d, offer);
  femBout(d, g);
  if(offer.opp && offer.opp.house) metHouse(d, offer.opp.house);
  weekMark(d, "crowdBest", res.crowd, fullName(g));
  if(res.bDies) weekMark(d, "kills");
  if(res.beats && res.beats.some(b=>b.kind==="spared")) weekMark(d, "spared");
  if(isDamn(g)) damnCheck(d, g);
  if(offer.oppRef && offer.oppRef.circuit){
    const f = (d.circuit||[]).find(x=>x.id===offer.oppRef.fid);
    circuitRecord(d, offer.oppRef.fid ? {id:offer.oppRef.fid} : null, g, win, !!res.bDies);
    if(f && !win){ f.killedYours = (f.killedYours||0) + (res.aDies?1:0);
      nemesisCheck(d, { name:f.house, grudge:0, fighters:d.circuit }, f); }
    if(f && win && d.nemesis && d.nemesis.fid===f.id) nemesisSettled(d, !!res.bDies).forEach(l=>sum.push(l));
  }
  const betLines = settleBet(d, g, offer, bet, win, res);
  betLines.forEach(l=>sum.push(l));
  serveWants(d, { type:"fight", gid, win, oppDied:!!res.bDies, spared:!!res.spared,
    crowd:rnd(res.crowd), tier:offer.tier, stakes:offer.stakes });
  { let last = -9;
    for(let i=0;i<res.beats.length;i++){
      const b = res.beats[i];
      if(i - last < 2) continue;
      const s = crowdSilence(b, res);
      if(s){ b.stands = { line:s, silent:true }; last = i; continue; }
      const v = crowdVoice(d, b, g, offer);
      if(v){ b.stands = v; last = i; }
    } }
  const reading = readBout(d, wasG, offer, { win, crowd:res.crowd }, { plan:{ right:PE.right, label: PLANS[planKey] && PLANS[planKey].name } });
  return { beats:res.beats, sum, reading, win, dead:!!res.aDies, crowd:rnd(res.crowd), name:g.name, venue:offer.venue, factions:d.factions,
    A:{ name:g.name, nick:g.nick, cls:g.cls, origin:g.origin, sub:"your house", kit:gc.kit, scars:gc.scars||[], fem:isF(g) },
    B:{ name:offer.opp.name, nick:offer.opp.nick, cls:offer.opp.cls, origin:offer.opp.origin, sub:offer.opp.house? `House ${offer.opp.house}`:"the pits", kit:oc.kit, scars:oc.scars||[], fem:isF(offer.opp) },
    tier:offer.tier, stakes:offer.stakes, festival:offer.festival };
}

/* ================= EVENTS ================= */

const EVENTS = {
  fever: {
    make(d){ if(!activeG(d).length) return null;
      return { id:"fever", title:"Fever in the Cells", text:"A sickness creeps along the cell block. The medicus wants coin for herbs and clean water.",
        choices:["Pay 60 denarii for the medicus","Let it pass — strong men endure"] }; },
    run(d,ev,i){ if(i===0){ d.gold-=60; return "The fever breaks within days. Coin well spent."; }
      const t = pick(activeG(d)); if(!t) return "The sickness passes on its own.";
      t.injury={name:"Wasting fever",weeks:2,pen:7}; t.status="injured"; t.morale=clamp(t.morale-8,0,100);
      return `${t.name} burns with fever for two weeks. The cells mutter about your thrift.`; } },
  bodyguard: {
    make(d){ const c=activeG(d); if(!c.length) return null; const t=pick(c);
      return { id:"bodyguard", title:"A Noble's Request", text:`A merchant of standing fears for his life on the road to Neapolis. He asks to hire ${t.name} as bodyguard for two weeks, and pays well.`,
        choices:[`Send ${t.name} — 120 denarii`,"Refuse. Your men train, they do not fetch"], data:{tid:t.id} }; },
    run(d,ev,i){ const t=d.gladiators.find(g=>g.id===ev.data.tid);
      if(i===0 && t && t.status==="active"){ t.status="away"; t.returnWeek=d.week+2; d.gold+=120;
        if(R()<0.4){ const pt=pick(patronsOf(d)); if(pt){ pt.favor=clamp(pt.favor+7,0,100); recomputeFavor(d); }
          return `${t.name} departs with the merchant's caravan. Word of the favor reaches ${pt?pt.name:"useful ears"}.`; }
        return `${t.name} departs with the merchant's caravan.`; }
      return "You send the merchant on his way with polite words and no sword."; } },
  bargain: {
    make(d){ if(d.gladiators.filter(g=>!isGone(g)).length>=8) return null;
      const g = genGladiator(d, ri(35,60)); g.price = rnd(g.price*0.6);
      if(d.gold < g.price) return null;
      return { id:"bargain", title:"A Slaver's Bargain", text:`A slaver passing through offers ${g.name}, a ${g.origin} ${g.cls.toLowerCase()}, at a price that smells of desperation — his, not yours.`,
        choices:[`Buy him for ${g.price} denarii`,"Pass"], data:{g} }; },
    run(d,ev,i){ if(i===0){ d.gold-=ev.data.g.price; d.gladiators.push(ev.data.g);
        return `${ev.data.g.name} joins the ludus, still wearing the road's dust.`; }
      return "The slaver shrugs and moves on to the next town."; } },
  rivalOffer: {
    make(d){ const c=activeG(d); if(!c.length) return null;
      const best = c.reduce((m,g)=>gladValue(g)>gladValue(m)?g:m, c[0]);
      const offer = rnd(gladValue(best)*1.5);
      const house = d.rivals && d.rivals.length ? pick(d.rivals).name : pick(HOUSES);
      return { id:"rivalOffer", title:"A Rival Comes Calling", text:`Good ${house} arrives with wine and flattery. He offers ${offer} denarii for ${fullName(best)}.`,
        choices:[`Sell for ${offer} denarii`,"Refuse — he is not for sale"], data:{tid:best.id, offer, house} }; },
    run(d,ev,i){ const t=d.gladiators.find(g=>g.id===ev.data.tid);
      if(i===0 && t){ d.gold+=ev.data.offer; annalsClose(d, t, "sold"); d.gladiators=d.gladiators.filter(g=>g.id!==t.id);
        const h = d.rivals && d.rivals.find(x=>x.name===ev.data.house);
        if(h){ h.grudge = clamp(h.grudge-8,0,100); h.fighters.push(makeRivalFighter(d, h.name, ri(45,65))); }
        d.gladiators.forEach(o=>{ if(o.status==="active") o.defiance=clamp(o.defiance+4,0,100); });
        d.unrest=clamp(d.unrest+3,0,100);
        return `${t.name} is led away in another house's colors. The familia watches in silence — sold like cattle, one mutters.`; }
      if(t){ t.morale=clamp(t.morale+6,0,100); t.defiance=clamp(t.defiance-3,0,100); }
      return "You refuse. Word travels to the cells, as you intended."; } },
  bribe: {
    make(d){ if(d.gold<100) return null;
      return { id:"bribe", title:"The Magistrate's Hint", text:"At the baths, the magistrate's man remarks — twice — how costly the upkeep of public favor has become.",
        choices:["Pay 100 denarii toward 'the public good'","Decline with a principled smile"] }; },
    run(d,ev,i){ const mag = patronsOf(d).find(p=>p.rank==="magistrate") || patronsOf(d)[0];
      if(i===0){ d.gold-=100; if(mag){ mag.favor=clamp(mag.favor+16,0,100); recomputeFavor(d); }
        return `Coin changes hands. ${mag?mag.name+" is warmer than he was":"Doors begin to open"}.`; }
      d.fame+=2; if(mag){ mag.favor=clamp(mag.favor-8,0,100); recomputeFavor(d); }
      return "Some admire a lanista who cannot be bought. The magistrate is not among them."; } },
  escape: {
    make(d){ if(d.unrest<40 || !activeG(d).length) return null; const t=pick(activeG(d));
      return { id:"escape", title:"An Attempt in the Night", text:`The guards drag ${t.name} back from the outer wall before dawn. The whole ludus is awake, watching what you do next.`,
        choices:["Make an example of him","Mercy — double the guard, spare the man"], data:{tid:t.id} }; },
    run(d,ev,i){ const t=d.gladiators.find(g=>g.id===ev.data.tid);
      if(i===0){ if(t){ t.morale=clamp(t.morale-15,0,100); t.dis=clamp(t.dis+3,5,99); }
        d.unrest=clamp(d.unrest-14,0,100);
        d.gladiators.forEach(o=>{ if(o.status==="active"){ o.defiance=clamp(o.defiance+4,0,100); o.morale=clamp(o.morale-6,0,100); } });
        return "The lesson is written in blood on the training square. Order returns — the kind that waits."; }
      d.unrest=clamp(d.unrest-5,0,100);
      d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale+5,0,100); o.defiance=clamp(o.defiance-2,0,100); } });
      return `You spare ${t?PR(t).him:"him"}. Some call it weakness. In the cells, they call it something else.`; } },
  affair: {
    make(d){ const c=activeG(d).filter(g=>g.sho>40); if(!c.length) return null; const t=pick(c);
      return { id:"affair", title:"A Noblewoman's Eye", text:`A senator's wife has taken a very particular interest in ${fullName(t)}. Gifts have begun arriving. So have whispers.`,
        choices:["Look away — and accept the gifts (150 denarii)","Forbid it. Scandal buries houses"], data:{tid:t.id} }; },
    run(d,ev,i){ const t=d.gladiators.find(g=>g.id===ev.data.tid);
      if(i===0){ d.gold+=150;
        if(R()<0.3){ d.fame=Math.max(0,d.fame-12); return "The gifts were sweet. The scandal, when it breaks, is not (-12 fame)."; }
        if(t) t.morale=clamp(t.morale+6,0,100);
        return "Gold flows, discretion holds. For now."; }
      if(t) t.morale=clamp(t.morale-8,0,100);
      return `You end it before it begins. ${t?PR(t).He:"He"} does not thank you.`; } },
  grain: {
    make(d){ return { id:"grain", title:"Grain Prices Rise", text:"A poor harvest in Sicilia. The porridge that builds your men grows dear.",
      choices:["Pay the difference — 40 denarii","Thin the porridge"] }; },
    run(d,ev,i){ if(i===0){ d.gold-=40; return "Your men eat as gladiators should. Barley and strength."; }
      d.gladiators.forEach(o=>{ if(o.status==="active") o.morale=clamp(o.morale-6,0,100); });
      d.unrest=clamp(d.unrest+2,0,100);
      return "Thin porridge, thin patience. The cells notice everything."; } },
  doctore: {
    make(d){ if(d.doctore) return null;
      const cand = makeDoctore(d, ri(62,80));
      return { id:"doctore", title:"A Doctore of Renown", text:`A scarred veteran of the Capuan schools presents himself at your gate — ${cand.name} of ${cand.origin}, ${cand.past}. He is ${docWord(cand.skill)}, and he knows it. His asking price is ${cand.fee} denarii, and ${cand.wage} a week thereafter.`,
        choices:["Hear him out — he waits at the square","Send him on his way"], data:{cand} }; },
    run(d,ev,i){ if(i===0){ d.doctoreMarket = [ev.data.cand, ...(d.doctoreMarket||[])].slice(0,3);
        return `${ev.data.cand.name} waits at the training square. Take him on from the Ludus, or leave him standing.`; }
      return "He departs for a rival house. You may yet hear his voice across the city."; } },
  plea: {
    make(d){ const act=activeG(d); if(act.length<2) return null;
      const strong = tieList(d).filter(t=>t.kind==="brother" && t.strength>=45);
      if(!strong.length) return null;
      const t = pick(strong);
      const A = d.gladiators.find(g=>g.id===t.a), B = d.gladiators.find(g=>g.id===t.b);
      if(!A || !B || A.status!=="active" || B.status!=="active") return null;
      const asker = R()<0.5?A:B, about = asker===A?B:A;
      return { id:"plea", title:"A Word at the Gate", text:`${asker.name} stops you crossing the yard, which ${PR(asker).he} has never done. ${about.name} is not fit, ${PR(asker).he} says — not this week, whatever the ledger says. ${PR(asker).He} does not ask for ${PR(asker).him}self. ${PR(asker).He} waits for an answer.`,
        choices:[`Rest ${about.name} — he does not fight this week`,"Tell him the card is set"], data:{ask:asker.id, sub:about.id} }; },
    run(d,ev,i){ const A=d.gladiators.find(g=>g.id===ev.data.ask), B=d.gladiators.find(g=>g.id===ev.data.sub);
      if(!A||!B) return "The matter passes.";
      if(i===0){ B.lastFought = d.week; B.regimen="rest"; B.sparWith=null;
        A.morale=clamp(A.morale+14,0,100); B.morale=clamp(B.morale+8,0,100);
        A.defiance=clamp(A.defiance-6,0,100); B.defiance=clamp(B.defiance-4,0,100);
        d.unrest=clamp(d.unrest-3,0,100);
        const t2=tieBetween(d,A.id,B.id); if(t2) t2.strength=clamp(t2.strength+10,1,100);
        return `${B.name} rests. ${A.name} says nothing about it afterward, but ${PR(A).he} watches you differently now.`; }
      A.morale=clamp(A.morale-12,0,100); A.defiance=clamp(A.defiance+8,0,100);
      d.unrest=clamp(d.unrest+3,0,100);
      return `You tell ${PR(A).him} the card is set. ${PR(A).He} nods, the way someone nods when they have learned something they suspected.`; } },
  mentor: {
    make(d){
      if(d.city||d.travel||d.rome) return null;
      const act = activeG(d);
      if(act.length<3) return null;
      const vets = act.filter(g=>!isMentored(g) && g.wins>=4 && (g.age>=29 || g.wins>=8));
      const rooks = act.filter(g=>!isMentored(g) && g.wins<=1 && g.age<=26);
      if(!vets.length || !rooks.length) return null;
      let best=null;
      for(const v of vets) for(const r of rooks){ if(v.id===r.id) continue;
        const t = tieBetween(d,v.id,r.id);
        const s = (t&&t.kind==="brother"?t.strength:0) + (v.origin===r.origin?20:0) + (v.cls===r.cls?8:0) + regardOf(v)/6;
        if(!best || s>best.s) best={v,r,s};
      }
      if(!best || best.s<14) return null;
      const {v,r} = best;
      return { id:"mentor", title:"The Old Hand",
        text:`${fullName(v)} has taken to standing at the edge of the square when ${r.name} drills — saying little, correcting less, but the boy has started setting his feet the way ${PR(v).he} does. ${v.name} has never asked you for a thing. ${PR(v).He} asks now: let him bring ${r.name} on himself.`,
        choices:[`Let ${v.name} teach the boy`, "Every man learns alone"], data:{ vid:v.id, rid:r.id } }; },
    run(d,ev,i){
      const v=d.gladiators.find(g=>g.id===ev.data.vid), r=d.gladiators.find(g=>g.id===ev.data.rid);
      if(!v||!r||v.status!=="active"||r.status!=="active") return "The moment passes; one of them is no longer in the yard.";
      if(i!==0){ v.morale=clamp(v.morale-5,0,100); v.defiance=clamp(v.defiance+3,0,100);
        return `You tell ${v.name} the boy will learn as ${PR(v).he} did — the hard way, from strangers across the sand. ${PR(v).He} nods once, and does not offer again.`; }
      v.protege=r.id; v.protegeName=r.name; r.mentor=v.id; r.mentorName=v.name;
      addTie(d,v.id,r.id,"brother",36);
      v.morale=clamp(v.morale+6,0,100); r.morale=clamp(r.morale+8,0,100); r.defiance=clamp(r.defiance-4,0,100);
      remember(d,v,"heard");
      return `Before the others are awake ${v.name} has ${r.name} at the far post, walking him through a thing too slow to be a drill and too deliberate to be anything else. Whatever the old man knows, the boy will have it now.`; } },
  /* ===== ARC: the foundling (a boy at the gate, and what he becomes weeks later) ===== */
  foundling: {
    make(d){
      if(d.city||d.travel||d.rome) return null;
      if(d.fame < 12) return null;
      if((d.arcs||[]).some(a=>a.id==="foundlingBack")) return null;
      if(d.flags.foundlingCool && d.week - d.flags.foundlingCool < 24) return null;
      if(activeG(d).length >= ((d.law && d.law.cap) || 99)) return null;
      const origin = pick(Object.keys(ORIGINS));
      const nm = freshName(d, ORIGINS[origin].names, false);
      return { id:"foundling", title:"A Boy at the Gate",
        text:`A boy no older than fourteen has slept against the gate three nights running. He says his name is ${nm}, that he has nowhere and nothing, and that he would rather die on the sand than in a ditch — which he says as though he has weighed both. He is half-starved and looks at the men in the yard the way other boys look at gods.`,
        choices:["Put him to the kitchens and see", "Buy his bond and start him at the palus · 80d", "Send him on his way"],
        data:{ name:nm, origin } }; },
    run(d,ev,i){
      d.flags.foundlingCool = d.week;
      if(i===1){
        if(d.gold<80) return `You reach for the coin to buy his bond and find the house cannot spare even that. ${ev.data.name} watches you decide it, and says nothing.`;
        d.gold-=80; scheduleArc(d, "foundlingBack", ri(8,10), { path:"palus", name:ev.data.name });
        return `Eighty denarii makes the boy yours. ${ev.data.name} is put at the far post with a wooden sword too big for him, and does not set it down when the others stop.`; }
      if(i===2){
        scheduleArc(d, "foundlingBack", ri(10,13), { path:"sent", name:ev.data.name });
        return `You send ${ev.data.name} off with bread, a copper, and the name of a farm that might take him. He does not look back, which plainly costs him something.`; }
      scheduleArc(d, "foundlingBack", ri(6,8), { path:"kitchen", name:ev.data.name });
      return `${ev.data.name} is put to the pots, the water, and the raking of the sand. He works like a boy afraid the offer will be taken back.`; } },
  foundlingBack: {
    make(){ return null; },
    build(d, data){
      const nm = data.name || "the boy";
      if(data.path==="palus") return { id:"foundlingBack", title:"The Boy is Made", data,
        text:`The boy whose bond you bought a season ago is not a boy any longer. ${nm} has put on shoulders and taken every bruise the palus had without once asking to stop. The doctore, who does not praise, has stopped correcting him. He is ready to swear, if you will have him.`,
        choices:[`Give ${nm} the oath — he is one of yours`, "Sell his bond on while it is worth something"] };
      if(data.path==="kitchen") return { id:"foundlingBack", title:"The Kitchen Boy", data,
        text:`${nm} has been slipping from the kitchens at night to copy the drills by moonlight. One of the men caught him at it and, instead of a cuff, showed him how to set his feet. The yard has quietly decided he is theirs. He wants the sand.`,
        choices:[`Put ${nm} to the palus properly`, "He stays where he is of use"] };
      return { id:"foundlingBack", title:"The One You Turned Away", data,
        text:`Word comes up the road: the boy you turned away, ${nm}, is fighting in the pits at Nola under a lanista who takes anyone. They say he is quick, that he wins more than he should, and that he tells whoever asks that he learned it watching your yard through the gate.`,
        choices:[`Send for him — buy out his contract · 140d`, "Leave him to the life he chose"] }; },
    run(d,ev,i){
      const data = ev.data, nm = data.name || "the boy";
      const raise = (potBonus, age, wins)=>{
        const g = genGladiator(d, ri(24,40));
        g.name = nm; g.age = age; g.wins = wins||0; g.losses = 0; g.kills = 0; g.pfame = 0; g.nick = null;
        g.potential = clamp(g.potential + potBonus, 32, 99);
        g.price = 0; g.morale = 72; g.regard = 64; g.defiance = ri(4,16);
        g.sworn = { how:"proper", week:d.week, free:false }; g.status = "active"; g.lastFought = -9;
        d.gladiators.push(g);
        d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id) o.morale = clamp(o.morale+2,0,100); });
        d.unrest = clamp(d.unrest-3,0,100);
        return g; };
      if(data.path==="palus"){
        if(i===0){ raise(14, ri(16,18), 0);
          chron(d, `${nm} takes the oath. The house raised this one out of nothing, and every man in the cells knows it.`, "good");
          return `${nm} says the sacramentum in a voice that does not shake. He is yours now — young, unproven, and made entirely of this house.`; }
        d.gold += 120;
        return `You sell ${nm}'s bond to a passing lanista for 120 denarii. He goes quietly. The men who taught him watch the gate a beat too long.`; }
      if(data.path==="kitchen"){
        if(i===0){ raise(6, ri(15,17), 0);
          chron(d, `${nm} leaves the kitchens for the palus. The cook complains; the yard does not.`, "good");
          return `${nm} is put to the sand properly — behind the others, and training like a boy making up a lost year in a season.`; }
        d.unrest = clamp(d.unrest+2,0,100);
        return `You tell ${nm} the kitchens are where he is worth something. He nods, and stops slipping out at night — which is its own kind of answer.`; }
      if(i===0){
        if(d.gold<140) return `You would send for ${nm}, but the house cannot spare the 140 denarii to buy him back. By the time it can, he may be another man's.`;
        d.gold -= 140; raise(18, ri(17,19), ri(1,3));
        chron(d, `${nm} comes back up the road to the house he learned to fight by watching. Not grateful, exactly. Home.`, "good");
        return `You buy out ${nm}'s contract. He walks back through the gate he once slept against and takes a place at the post as though he had never left.`; }
      return `You leave ${nm} to Nola and the pits. Some weeks on, the word simply stops coming, the way it does. You never hear how it ended — only that it did.`; } },
  /* ===== ARC: a life owed (a mercy on the sand, repaid weeks later) ===== */
  owedLife: {
    make(d){
      if(d.city||d.travel||d.rome) return null;
      if(!d.flags.everCloth) return null;
      if(d.flags.owedDone) return null;
      if((d.arcs||[]).some(a=>a.id==="owedBack")) return null;
      if(R()>0.5) return null;
      return { id:"owedLife", title:"A Man Who Remembers",
        text:`A freedman you do not know waits at the gate with his cap in his hands. He was on the sand against one of yours, he says, on a day you threw the cloth and let him live. He has done well enough since to be able to say thank you — and he would like to. He does not say how.`,
        choices:["Hear him out", "Tell him the debt is nothing — send him off"] }; },
    run(d,ev,i){
      d.flags.owedDone = 1;
      if(i===0){ scheduleArc(d, "owedBack", ri(3,6), {});
        return `You tell him to come back when he has something to say rather than something to feel. He grins — not the answer you expected — and goes.`; }
      d.gladiators.forEach(o=>{ if(o.status==="active") o.regard = clamp(regardOf(o)+3,0,100); });
      return `You send him off, his thanks unspent. The cells hear that a lanista who spares a man is remembered for it, which is worth more down there than whatever he was carrying.`; } },
  owedBack: {
    make(){ return null; },
    build(d, data){
      if(!activeG(d).length) return null;
      return { id:"owedBack", title:"The Debt Paid", data,
        text:`The freedman is back, and this time he has something. He deals in men and rumours down the coast, and he has heard which Capuan house has put quiet coin on taking one of yours — and which of your own has been listening. He will give you the name. Or he will hand you a purse and call it square, if you would rather not know.`,
        choices:["Take the name", "Take the purse · 180d"] }; },
    run(d,ev,i){
      if(i===0){
        const men = activeG(d);
        if(!men.length) return `He gives you a name — but the man he names is no longer in your cells. The warning arrives after the door has already shut.`;
        const target = men.reduce((m,g)=> gladValue(g)>gladValue(m)?g:m, men[0]);
        target.regard = clamp(regardOf(target)+18,0,100);
        remember(d, target, "heard");
        chron(d, `A warning bought with an old mercy: ${target.name} was being courted by another house. He knows now that you know.`, "info");
        return `He gives you the name. You have a quiet word with ${target.name}, who did not know he had been for sale — and now cannot be, not to them.`; }
      d.gold += 180;
      return `You take the purse. Whatever the name was, it goes back down the coast with him, and the house is 180 denarii the richer for a kindness you had half forgotten.`; } },
  /* ===== the mob calls for its favourite by name ===== */
  crowdCalls: {
    make(d){
      if(d.city||d.travel||d.rome) return null;
      const favs = activeG(d).filter(isFavourite);
      if(!favs.length) return null;
      if(d.flags.calledFav && d.week - d.flags.calledFav < 8) return null;
      const g = favs.reduce((m,x)=>fansOf(x)>fansOf(m)?x:m, favs[0]);
      return { id:"crowdCalls", title:"They Want Him",
        text:`The mob has taken to chanting ${g.name}'s name outside the amphitheatre on days he is not even fighting. An editor noticed — editors always do — and sent word: put ${g.name} on his next card and there is a purse in it fatter than the bout is worth, because the seats fill for the name alone.`,
        choices:[`Promise ${g.name} to the crowd`, "He fights when you say he fights"], data:{ gid:g.id } }; },
    run(d,ev,i){
      d.flags.calledFav = d.week;
      const g = d.gladiators.find(x=>x.id===ev.data.gid);
      if(!g || g.status!=="active") return "The moment, and the man, have passed.";
      if(i===0){
        const advance = rnd(60 + fansOf(g)*3);
        d.gold += advance; facMove(d, "mob", 5);
        g.fans = clamp(fansOf(g)+6, 0, 100); g.morale = clamp(g.morale+6, 0, 100);
        return `You give your word. ${g.name} will fight the games, and the editor's clerk counts out ${advance} denarii on the strength of a name before a blow is struck.`; }
      facMove(d, "mob", -5); g.fans = clamp(fansOf(g)-8, 0, 100); d.unrest = clamp(d.unrest+2, 0, 100);
      return `You tell them ${g.name} fights when you decide it, not when a crowd decides it for you. It is the correct answer, and it is not free.`; } },
  /* ===== ARC: the shared prospect (the poaching war of a nemesis-house feud) ===== */
  /* ===== ARC: the champion's freedom (the fork at the end of a personal saga) ===== */
  sagaFreedom: {
    make(){ return null; },
    build(d){
      const s = d.saga; if(!s) return null;
      const g = d.gladiators.find(x=>x.id===s.gid);
      if(!g || g.status!=="active") return null;
      const price = rnd(gladValue(g) * 0.9);
      return { id:"sagaFreedom", title:"The Wooden Sword", data:{ gid:g.id, price },
        text:`${fullName(g)} has done everything the sand can ask of a man and more than you had a right to expect the day you bought him. The crowd chants for the rudis at the end of his bouts now — for his freedom, to your face, as though it were theirs to give. He has never once asked; he is a slave and knows better. He is also the finest thing your house has ever made, and both of you know what that is worth on an open market. The road forks here.`,
        choices:[`Grant ${g.name} the rudis — let him walk free`, "Keep him — the house is not done with him", `Sell him at his height · ${price}d`] }; },
    run(d,ev,i){
      const g = d.gladiators.find(x=>x.id===ev.data.gid);
      if(!g){ d.saga=null; return "He is gone before the choice could be made."; }
      d.flags.sagaCool = d.week;
      if(i===0){
        sagaFree(d, g); d.saga = null;
        return `You grant ${g.name} the wooden sword. It is the most expensive thing you will do this year, and the men will fight the harder for having watched you do it. The house is poorer by its champion and richer by something that will not fit in the ledger.`; }
      if(i===2){
        const price = ev.data.price || rnd(gladValue(g)*0.9);
        d.gold += price;
        const sore = tieList(d).filter(t=>(t.a===g.id||t.b===g.id) && t.kind==="brother")
          .map(t=>d.gladiators.find(x=>x.id===(t.a===g.id?t.b:t.a))).filter(o=>o&&o.status==="active");
        sore.forEach(o=>remember(d, o, "soldKin"));
        annalsClose(d, g, "sold"); favourLost(d, g, "sold"); dropTies(d, g.id);
        d.gladiators = d.gladiators.filter(x=>x.id!==g.id);
        d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-12,0,100); o.defiance=clamp(o.defiance+8,0,100); o.regard=clamp(regardOf(o)-14,0,100); } });
        d.unrest = clamp(d.unrest+14, 0, 100); d.fame = Math.max(0, d.fame-20); addRep(d, "blood", 6);
        d.saga = null;
        chron(d, `${fullName(g)} is sold at the height of his worth to a house that could meet the number. The crowd that chanted for his freedom watched him led out in another lanista's colours, and has drawn the obvious conclusion about yours.`, "bad");
        return `${price} denarii, and the finest man you ever owned goes out the gate in someone else's train. The coin is real. So is the silence in the cells tonight.`; }
      g.morale = clamp(g.morale-16, 0, 100); g.defiance = clamp(g.defiance+12, 0, 100);
      d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id) o.defiance = clamp(o.defiance+4,0,100); });
      d.unrest = clamp(d.unrest+8, 0, 100); d.saga = null;
      chron(d, `You keep ${g.name}. The crowd's chant for the rudis curdles into something else when it becomes plain it is not coming, and ${g.name} salutes you afterward with a correctness that is worse than any defiance. He is still yours — that was the question, and that is the answer.`, "bad");
      return `${g.name} stays. He is the best fighter in Capua and he will go on being it for you, for exactly as long as that arrangement holds — which both of you have just begun to count.`; } },
  nemProspect: {
    make(){ return null; },
    build(d, data){
      const houseName = (d.nemHouse && d.nemHouse.house) || data.house;
      if(!houseName || !houseOf(d, houseName)) return null;
      const L = lanistaOf(houseName).name;
      const cost = rnd(220 + d.fame*0.6);
      const origin = pick(Object.keys(ORIGINS));
      const nm = freshName(d, ORIGINS[origin].names, false);
      return { id:"nemProspect", title:"The Prospect", data:{ house:houseName, name:nm, cost },
        text:`A free swordsman has come up from the south with his name ahead of him — ${nm}: young, quick, expensive, and not yet anyone's. ${L} of House ${houseName} wants him as badly as you do, and has said so where you would hear it. Whoever takes ${nm} takes something off the other, and both of you know it.`,
        choices:[`Outbid ${L} — take ${nm} · ${cost}d`, "Let them have him — he is not worth a war"] }; },
    run(d,ev,i){
      const data = ev.data, nm = data.name || "the prospect", houseName = data.house;
      const n = d.nemHouse, L = lanistaOf(houseName).name;
      if(i===0){
        if(d.gold < data.cost) return `You reach to outbid ${L} and find the coin is not there. ${nm} watches two lanistae discover which of them is the poorer, and signs with the other.`;
        d.gold -= data.cost;
        const g = genGladiator(d, ri(58,74));
        g.name = nm; g.age = ri(19,23); g.wins=0; g.losses=0; g.kills=0; g.nick=null; g.pfame=ri(6,14);
        g.price=0; g.morale=70; g.regard=58; g.defiance=ri(8,22);
        g.sworn={how:"proper",week:d.week,free:false}; g.status="active"; g.lastFought=-9;
        d.gladiators.push(g);
        if(n) n.heat = clamp(n.heat+12,0,100);
        const hh = houseOf(d, houseName); if(hh) hh.grudge = clamp(hh.grudge+10,0,100);
        chron(d, `${nm} signs with your house over House ${houseName}'s open hand. ${L} will remember being outbid in public.`, "good");
        return `${nm} is yours — young and good and dear, and ${L} watched you take him, which was most of why you did.`; }
      const hh = houseOf(d, houseName);
      if(hh){ const f = makeRivalFighter(d, houseName, 68); f.name = nm; f.pfame = ri(6,14); hh.fighters.push(f); hh.fame += 6; }
      if(n) n.heat = clamp(n.heat+16,0,100);
      d.gladiators.forEach(o=>{ if(o.status==="active") o.morale=clamp(o.morale-3,0,100); });
      return `You let ${nm} go south to House ${houseName}. He is good, and now he is theirs — and your men noted that you decided he was not worth the fight. It will be answered on the sand.`; } },
  poached: {
    make(d){ if(!d.poach) return null;
      const g = d.gladiators.find(x=>x.id===d.poach.gid);
      if(!g || g.status!=="active") return null;
      const price = rnd(gladValue(g)*0.6);
      const opts = [`Match their offer — ${price} denarii and better quarters`, "Put him in irons for a week", "Say nothing and watch him"];
      return { id:"poached", title:"A Man at the Wall", text:`House ${d.poach.house} has been talking to ${fullName(g)} — freedom in three years, they say, and a bed of his own. ${PR(g).He} has not denied it. In ${d.poach.weeks} week${d.poach.weeks===1?"":"s"} ${PR(g).he} will have made up ${PR(g).his} mind.`,
        choices:opts, data:{ gid:g.id, price } }; },
    run(d,ev,i){ const g = d.gladiators.find(x=>x.id===ev.data.gid);
      if(!g){ d.poach=null; return "The matter resolves itself."; }
      if(i===0){
        if(d.gold < ev.data.price) return `You cannot find the coin, and ${PR(g).he} can count.`;
        d.gold -= ev.data.price;
        g.defiance = clamp(g.defiance-22,0,100); g.morale = clamp(g.morale+16,0,100);
        d.poach = null;
        return `${g.name} takes the offer and stays. ${PR(g).He} does not thank you, but ${PR(g).he} stops looking at the wall.`;
      }
      if(i===1){
        g.defiance = clamp(g.defiance+14,0,100); g.morale = clamp(g.morale-20,0,100);
        d.unrest = clamp(d.unrest+7,0,100);
        kinReact(d, g.id, "brother", -10, 7);
        if(R()<0.55){ d.poach = null; return `A week on the chain and the whispering stops. So does most of what was left of ${PR(g).him}.`; }
        d.poach.weeks = Math.max(1, d.poach.weeks);
        return `A week on the chain. ${PR(g).He} comes out quieter, and no less decided.`;
      }
      if(R()<0.35){ d.poach = null; return `Nothing comes of it. Either they lost interest or he did.`; }
      return `You let it lie. He notices that too.`; } },
  primacy: {
    make(d){ if(!d.primus || !d.primus.mine) return null;
      const holder = d.gladiators.find(x=>x.id===d.primus.gid);
      const rival = activeG(d).filter(x=>x.id!==d.primus.gid && primusEligible(x))
        .sort((a,b)=>b.pfame-a.pfame)[0];
      if(!holder || !rival || d.week - d.primus.since < 6) return null;
      return { id:"primacy", title:"He Wants the Bout",
        text:`${rival.name} has as many wins as ${holder.name} had when you sent him for the primacy, and he has been counting. He is not asking to leave. He is asking for the one bout in this city that means anything, against the man who sleeps four doors down.`,
        choices:["Make the match", "Tell him the title stays where it is", "Tell him to wait"],
        data:{ hid:holder.id, rid:rival.id } }; },
    run(d,ev,i){
      const holder = d.gladiators.find(x=>x.id===ev.data.hid);
      const rival = d.gladiators.find(x=>x.id===ev.data.rid);
      if(!holder || !rival) return "The moment passes.";
      if(i===0){
        /* two of yours, and the title only fits one head */
        const pa = power(Object.assign(clone(holder),{mods:kitMods(holder.kit,holder.cls,holder)}),"measured",rival.cls,0,1);
        const pb = power(Object.assign(clone(rival),{mods:kitMods(rival.kit,rival.cls,rival)}),"measured",holder.cls,0,1);
        const challengerWins = pb*(0.8+R()*0.5) > pa*(0.8+R()*0.5);
        addRep(d, "show", 6);
        d.fame += 14;
        const t = tieBetween(d, holder.id, rival.id);
        if(t) d.ties = tieList(d).filter(x=>x!==t);
        holder.fatigue = clamp(holder.fatigue+22,0,100); rival.fatigue = clamp(rival.fatigue+22,0,100);
        remember(d, holder, "duel"); remember(d, rival, "duel");
        if(challengerWins){
          d.primus = { mine:true, gid:rival.id, name:rival.name, nick:rival.nick, cls:rival.cls, since:d.week, defences:0 };
          holder.morale = clamp(holder.morale-24,0,100); holder.defiance = clamp(holder.defiance+10,0,100);
          rival.morale = clamp(rival.morale+22,0,100); rival.pfame += 20;
          return `${rival.name} takes it off ${holder.name} in front of the whole city, and neither of them can go back to how the yard was on Monday. The primacy stays in this house. It has changed cells.`;
        }
        rival.morale = clamp(rival.morale-16,0,100); rival.defiance = clamp(rival.defiance+9,0,100);
        holder.morale = clamp(holder.morale+12,0,100); holder.pfame += 10;
        if(d.primus) d.primus.defences++;
        return `${holder.name} puts him down and helps him up, which is worse. ${rival.name} has his answer and will have to live in the same building as it.`;
      }
      if(i===1){
        rival.morale = clamp(rival.morale-20,0,100);
        rival.defiance = clamp(rival.defiance+16,0,100);
        d.unrest = clamp(d.unrest+5,0,100);
        if(rival.ambition && !rival.ambition.met && !rival.ambition.broken) ambitionBroken(d, rival);
        remember(d, rival, "refused");
        return `You tell him no. He does not argue, which is the part you will think about later.`;
      }
      rival.morale = clamp(rival.morale-7,0,100);
      rival.defiance = clamp(rival.defiance+5,0,100);
      return `You tell him to wait. He has been waiting. He goes back to the post and hits it harder than the wood deserves.`; } },
  feud: {
    make(){ return null; },
    run(d,ev,i){
      const a = d.gladiators.find(x=>x.id===ev.data.aid);
      const b = d.gladiators.find(x=>x.id===ev.data.bid);
      if(!a||!b) return "It resolves itself before you get there.";
      const t = tieBetween(d, a.id, b.id);
      const others = () => d.gladiators.filter(o=>o.status==="active" && o.id!==a.id && o.id!==b.id);

      if(i===0){
        /* the only honest answer this trade has */
        const pa = power(Object.assign(clone(a),{mods:kitMods(a.kit,a.cls,a)}),"measured",b.cls,0,1);
        const pb = power(Object.assign(clone(b),{mods:kitMods(b.kit,b.cls,b)}),"measured",a.cls,0,1);
        const aWins = pa*(0.8+R()*0.5) > pb*(0.8+R()*0.5);
        const [w, l] = aWins ? [a,b] : [b,a];
        if(t) d.ties = tieList(d).filter(x=>x!==t);
        [a,b].forEach(g=>{ g.fatigue = clamp(g.fatigue+20,0,100); });
        w.morale = clamp(w.morale+16,0,100); w.pfame += 4; formShift(d, w, 10, `settled it with ${l.name}`);
        l.morale = clamp(l.morale-18,0,100); l.defiance = clamp(l.defiance+7,0,100); formShift(d, l, -12, `lost to ${w.name} in the yard`);
        if(R()<0.16){ const inj = INJURIES[ri(0,2)];
          l.injury={name:inj[0],weeks:inj[1],pen:inj[2]}; l.status="injured"; l.sparWith=null; l.regimen="palus"; }
        d.unrest = clamp(d.unrest-5,0,100);
        others().forEach(o=>{ o.morale = clamp(o.morale+4,0,100); });
        addRep(d, "craft", 4);
        return `You put them on the sand in front of everybody with wooden swords and the doctore counting. ${w.name} has the better of it. Whatever it was is finished, in the only way this trade knows how to finish anything.`;
      }

      if(i===1){
        b.benched = { weeks:4, why:`kept apart from ${a.name}` };
        b.morale = clamp(b.morale-9,0,100);
        b.regard = clamp(regardOf(b)-6,0,100);
        if(t) t.strength = clamp(t.strength-30, 0, 100);
        d.unrest = clamp(d.unrest+3,0,100);
        return `${b.name} is taken off every card for a month and given the far end of the yard to work in. It does not settle anything. It stops it happening today, which some weeks is the whole of the job.`;
      }

      if(i===2){
        remember(d, a, "sided");
        remember(d, b, "against");
        a.morale = clamp(a.morale+14,0,100);
        b.morale = clamp(b.morale-20,0,100);
        b.defiance = clamp(b.defiance+13,0,100);
        if(t) t.strength = clamp(t.strength+14, 0, 100);
        d.unrest = clamp(d.unrest+4,0,100);
        others().forEach(o=>{ o.regard = clamp(regardOf(o)-3,0,100); });
        return `You say ${a.name} has the right of it, out loud, where everybody can hear. ${a.name} will not forget that and neither will ${b.name}, and neither will any of the others, who have all just learned that this is a house where the lanista picks.`;
      }

      /* you were there and you did nothing */
      [a,b].forEach(g=>{ remember(d, g, "watched");
        g.fatigue = clamp(g.fatigue+14,0,100); g.morale = clamp(g.morale-6,0,100); });
      const hurt = R()<0.42 ? pick([a,b]) : null;
      if(hurt){ const inj = INJURIES[ri(1,4)];
        hurt.injury={name:inj[0],weeks:inj[1],pen:inj[2]}; hurt.status="injured"; hurt.sparWith=null; hurt.regimen="palus"; }
      if(t) t.strength = clamp(t.strength+18, 0, 100);
      d.unrest = clamp(d.unrest+9,0,100);
      others().forEach(o=>{ o.defiance = clamp(o.defiance+5,0,100); o.regard = clamp(regardOf(o)-4,0,100); });
      addRep(d, "blood", 5);
      return hurt
        ? `You turn round and go back inside. It goes on for a while. ${hurt.name} is carried to the medicus afterward and nobody in the yard will say who started what.`
        : `You turn round and go back inside. It goes on for a while and stops on its own, and every man out there watched you decide it was not your business.`;
    } },
  refusal: {
    make(){ return null; },
    run(d,ev,i){
      const g = d.gladiators.find(x=>x.id===ev.data.gid);
      if(!g) return "The matter resolves itself.";
      const method = i===0 ? "whip" : i===1 ? "talk"
        : (i===2 && g.ambition && !g.ambition.met && !g.ambition.broken) ? "give" : "sit";
      return applyRefusal(d, g, method);
    } },
  booking: {
    make(){ return null; },
    run(d,ev,i){ if(i!==0) return `You decline to promise a man five weeks out. It is the correct answer and it costs you the advance.`;
      takeBooking(d, ev.data.o);
      return `Signed. ${ev.data.o.name}'s name goes on the bill for ${ev.data.o.festName}, and now it has to be true.`; } },
  challenge: {
    make(){ return null; },
    run(d,ev,i){ const c = ev.data.c;
      if(i!==0){
        d.fame = Math.max(0, d.fame-9);
        facMove(d, "mob", -4);
        return `You let it pass. ${c.lan} does not gloat, which somehow travels further.`;
      }
      addDeadline(d, { kind:"challenge", gid:c.gid, name:c.name, house:c.house, lan:c.lan,
        fid:c.fid, foe:c.foe, due:c.due, purse:c.purse, met:false });
      d.fame += 6;
      facMove(d, "mob", 4);
      return `You answer it in front of the same people who heard him ask. ${c.name} against ${c.foe}, inside ${c.due-d.week} weeks.`; } },
  sacramentum: {
    make(d){ const men = unsworn(d);
      if(!men.length || d.city || d.travel || d.rome) return null;
      const g = men[0];
      const free = isAuctor(g), cond = isDamn(g);
      return { id:"sacramentum", title:"The Oath",
        text:`${fullName(g)} has not yet been sworn in. ${free
          ? `He is a free man and the words are his to say — uri, vinciri, verberari, ferroque necari, and he says them knowing exactly what he is signing away.`
          : cond
          ? `He is condemned, so the words are said over him rather than by him, and everybody standing there understands the difference.`
          : `He is property, so the words are said over him — ${OATH}, ${OATH_EN}. It changes nothing legally. The house has always thought it changes something.`}`,
        choices: SW_KEYS.map(k=>`${SWEARING[k].name}${SWEARING[k].cost?` · ${SWEARING[k].cost}d`:""}`),
        data:{ gid:g.id } }; },
    run(d,ev,i){
      const key = SW_KEYS[i] || "quick";
      const g = d.gladiators.find(x=>x.id===ev.data.gid);
      if(!g) return "The man is no longer in the cells.";
      if(d.gold < SWEARING[key].cost){ swearIn(d, g.id, "quick");
        return `You cannot afford the occasion, so the words are said at the post and that is that.`; }
      swearIn(d, g.id, key);
      return isAuctor(g) && key!=="quick"
        ? `${g.name} says it himself, which is the part nobody in the cells will forget: a man who was free this morning agreeing to be burned, bound, beaten and killed by the sword.`
        : SWEARING[key].line(d, g); } },
  romeReturn: {
    make(){ return null; },
    run(d,ev,i){
      if(ev.data.triumph && i===1){
        d.over = { kind:"triumph", won:ev.data.won, name:d.name, chosen:true };
        return `You lay the house down at its height, on the imperial laurel, with the ledger open at its best page. Few lanistae ever get to choose the moment. Fewer still choose this one.`;
      }
      return ev.data.triumph
        ? `The house carries on — a Roman name now, with everything that brings to the gate. Rome remembers a while, and may send for you again.`
        : `You put Rome behind you and go back to the sand you know. There is another card to make and men to make it with.`;
    } },
  late: {
    make(){ return null; },
    run(d,ev,i){ const L = LATE[ev.data.k];
      try { return L.run(d, i); } catch(e){ return "It passes."; } } },
  ask: {
    make(){ return null; },
    run(d,ev,i){
      const A = ASKS[ev.data.k];
      const g = d.gladiators.find(x=>x.id===ev.data.gid);
      if(!g || !A) return `He has gone back to the yard.`;
      try { return i===0 ? A.yes(d, g, ev.data.ex||{}) : A.no(d, g, ev.data.ex||{}); }
      catch(e){ return `Whatever was said, it is said.`; } } },
  freedman: {
    make(){ return null; },
    run(d,ev){ const F = FREEDMEN[ev.data.k];
      try { return F.run(d, ev.data.man || { name:"He", wins:0 }); } catch(e){ return `He is seen about the town.`; } } },
  pact: {
    make(){ return null; },
    run(d,ev,i){
      if(i!==0) return `You keep your hands free. There will be another offer and it will not be from him.`;
      takePact(d, ev.data.k);
      const P = PACTS[ev.data.k];
      return `It is done on a handshake and written down anyway. ${P.need} cards, ${P.weeks} weeks, and everybody in Capua will know inside a fortnight whether you kept it.`;
    } },
  edict: {
    make(){ return null; },
    run(d,ev,i){
      const E = EDICTS[ev.data.k];
      if(i===0){
        addRep(d, "craft", 4);
        patronsOf(d).forEach(p=>{ if(p.rank==="magistrate") p.favor = clamp(p.favor+9,0,100); }); recomputeFavor(d);
        lawOf(d).heat = clamp(lawOf(d).heat - 12, 0, 100);
        return `You send word that the house will comply. It costs you nothing today and it will cost you something on a day you have not thought about yet.`;
      }
      lawOf(d).heat = clamp(lawOf(d).heat + 14, 0, 100);
      addRep(d, "blood", 3);
      return `You do nothing at all, which is what most houses will do, and the difference between you and most houses is that somebody is already writing your name down.`;
    } },
  inspector: {
    make(){ return null; },
    run(d,ev,i){
      const L = lawOf(d);
      if(i===0){
        d.gold -= ev.data.fine;
        L.fines += ev.data.fine;
        L.heat = clamp(L.heat - 25, 0, 100);
        return `You pay it in front of him and he writes the receipt out slowly. It is the cheapest thing that happened to you this month and it does not feel like it.`;
      }
      if(i===1){
        const bribe = rnd(ev.data.fine*0.55);
        d.gold -= bribe;
        if(R() < 0.72){
          L.heat = clamp(L.heat - 8, 0, 100);
          return `The tablet is scraped clean in front of you and he leaves without writing anything. He will be back, and he will remember the arrangement, and so will you.`;
        }
        L.heat = clamp(L.heat + 22, 0, 100);
        d.fame = Math.max(0, d.fame - 14);
        patronsOf(d).forEach(p=>{ if(p.rank==="magistrate") p.favor = clamp(p.favor-20,0,100); }); recomputeFavor(d);
        return `He takes the money, writes it all down anyway, and adds a line about the money. There is no version of this you come out of well.`;
      }
      L.heat = clamp(L.heat + 18, 0, 100);
      d.fame = Math.max(0, d.fame - 6);
      return `You let him write. He is thorough, he is not unkind about it, and the aedile's office now holds an account of exactly what this house is.`;
    } },
  bayCall: {
    make(d){ if(d.city || d.travel || d.rome || d.fame < 90) return null;
      const men = activeG(d).filter(g=>g.pfame >= 22);
      if(!men.length) return null;
      const key = pick(Object.keys(CITIES));
      const C = CITIES[key];
      const g = men.reduce((m,x)=>x.pfame>m.pfame?x:m, men[0]);
      const purse = rnd((160 + g.pfame*3.4) * C.purse);
      return { id:"bayCall", title:"Asked For By Name",
        text:`A letter from ${C.name}, from an editor who has heard about ${fullName(g)} and would like the town to see him. ${C.crowd} He offers ${purse} denarii and the crossing is ${C.travel} week${C.travel===1?"":"s"} each way. ${bayHolder(d)===null ? "" : `House ${bayHolder(d)} has been working that coast for ${baySince(d)} weeks and will not be pleased.`}`,
        choices:[`Take the road to ${C.name}`, "Write back that you are needed here"],
        data:{ key, gid:g.id, purse } }; },
    run(d,ev,i){
      const C = CITIES[ev.data.key];
      if(i!==0){
        d.fame = Math.max(0, d.fame - 3);
        return `You write back that the house cannot spare the men. It is true, and it is also the answer a smaller house gives.`;
      }
      d.gold += rnd(ev.data.purse * 0.3);
      setOut(d, ev.data.key);
      return `The advance comes up front and the wagons go out inside the week. ${C.name} has asked for one of your men by name, which has not happened before.`; } },
  damnatio: {
    make(d){ if(d.city || d.travel || d.rome) return null;
      if(d.gladiators.filter(g=>!isGone(g)).length >= 8) return null;
      const n = ri(1,2);
      const crimes = shuffled(CRIMES).slice(0,n);
      const fee = rnd(60 + n*45);
      return { id:"damnatio", title:"Condemned To The School",
        text:`A clerk from the magistrate's office with ${n===1?"a man":"two men"} and the paperwork for ${n===1?"him":"them"}. ${crimes.map(c=>c.what).join(", and ")}. The court has sentenced ${n===1?"him":"them"} to the ludus rather than the beasts, which is a mercy in the way that a longer road is a mercy. The city will pay you ${fee} denarii to take ${n===1?"him":"them"} off its hands, and they cannot be sold on — they belong to the sentence until it is served.`,
        choices:["Take them and the fee", "Send the clerk away"],
        data:{ crimes, fee } }; },
    run(d,ev,i){
      if(i!==0){
        patronsOf(d).forEach(p=>{ if(p.rank==="magistrate") p.favor = clamp(p.favor-7,0,100); }); recomputeFavor(d);
        return `You send the clerk back with his paperwork. The magistrate's office will remember that you were particular.`;
      }
      d.gold += ev.data.fee;
      const made = ev.data.crimes.map(c=>{ const g = makeDamnatus(d, c); damnArrive(d, g); return g; });
      patronsOf(d).forEach(p=>{ if(p.rank==="magistrate") p.favor = clamp(p.favor+8,0,100); }); recomputeFavor(d);
      addRep(d, "blood", 4);
      return `${made.map(g=>g.name).join(" and ")} ${made.length===1?"is":"are"} signed for. ${ev.data.fee} denarii, and the yard is colder than it was this morning.`; } },
  warTax: {
    make(d){ if(!d.war || d.war.done || warIdx(d)<1 || d.war.taxed>=3) return null;
      const take = rnd(180 + d.fame*0.6 + R()*160);
      if(d.gold < take*0.6) return null;
      return { id:"warTax", title:"A Levy for the South",
        text:`A clerk with an escort and a wax tablet. Every ludus in Campania is contributing to the cost of putting the thing down, and the schools that produced it are contributing rather more. He has your name written at the top of the second column, which he lets you see.`,
        choices:[`Pay the ${take} denarii`, "Tell him the house has nothing"], data:{ take } }; },
    run(d,ev,i){ d.war.taxed++;
      if(i===0){ if(d.gold < ev.data.take) return "You cannot find it, and he writes that down too.";
        d.gold -= ev.data.take;
        patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor+5,0,100); }); recomputeFavor(d);
        return `Paid, receipted, and noted. It buys you nothing except not being the house that refused.`; }
      d.fame = Math.max(0, d.fame-14);
      patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-11,0,100); }); recomputeFavor(d);
      return `You tell him the house has nothing. He believes you and writes it down anyway, in the second column, under your name.`; } },
  warLevy: {
    make(d){ if(!d.war || d.war.done || warIdx(d)<2 || d.war.levied>=2) return null;
      const men = activeG(d).filter(g=>!isAuctor(g));
      if(men.length<3) return null;
      const t = men.sort((a,b)=>(b.str+b.dis)-(a.str+a.dis))[0];
      return { id:"warLevy", title:"They Want Bodies",
        text:`The legions are taking anyone who can hold a line, and a magistrate's man has come to the ludus with a list. He wants ${t.name}. He is not offering to buy him — he is offering not to remember, later, that he had to ask twice.`,
        choices:[`Hand ${t.name} over`, "Refuse, and be remembered for it", "Buy his way off the list — 400d"],
        data:{ gid:t.id } }; },
    run(d,ev,i){ const g = d.gladiators.find(x=>x.id===ev.data.gid);
      d.war.levied++;
      if(!g) return "The matter resolves itself.";
      if(i===0){ annalsClose(d, g, "levied"); g.status="departed"; g.fateNote="levied";
        d.departed = d.departed||[]; d.departed.push({ name:fullName(g), week:d.week, wins:g.wins, bouts:0 });
        dropTies(d, g.id);
        d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-9,0,100); o.defiance=clamp(o.defiance+7,0,100); } });
        d.unrest = clamp(d.unrest+7,0,100);
        patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor+6,0,100); }); recomputeFavor(d);
        return `${g.name} is marched out of the gate in a file of men from four different houses. Whatever happens to him now happens somewhere nobody in this yard will hear about.`; }
      if(i===2){ if(d.gold<400) return "You do not have it, and he waits while you find that out.";
        d.gold -= 400; g.morale = clamp(g.morale+14,0,100);
        return `Four hundred denarii and his name comes off the list. ${g.name} was standing close enough to hear the number.`; }
      d.fame = Math.max(0, d.fame-10);
      patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor-13,0,100); }); recomputeFavor(d);
      return `You refuse. He does not argue. He simply writes, and everybody in the room understands that the writing is the point.`; } },
  warWord: {
    make(d){ if(!d.war || d.war.done || warIdx(d)!==1 || d.flags.hadWord) return null;
      const free = activeG(d).filter(g=>!isAuctor(g));
      const n = Math.min(3, Math.max(0, free.length - 2));
      if(free.length < 3) return null;
      return { id:"warWord", title:"Word From the South",
        text:`A man you do not know is in your yard before dawn with no weapon and a message he will only say once. ${d.war.name} remembers who opened the gate. There is a place in the column for anyone from this house who wants one, and there is coin for you if you look the other way while ${n===1?"one of your men walks":`${n} of your men walk`} south.`,
        choices:[`Look the other way — ${n} of them`, "Turn the messenger in", "Send him away and say nothing"],
        data:{ n } }; },
    run(d,ev,i){ d.flags.hadWord = 1;
      if(i===0){ const n = (ev.data && ev.data.n) || 1;
        const go = activeG(d).filter(g=>!isAuctor(g)).sort((a,b)=>b.defiance-a.defiance).slice(0, n);
        go.forEach(g=>{ annalsClose(d, g, "escaped"); g.status="escaped"; g.fateNote="escaped"; dropTies(d,g.id); });
        d.gold += rnd(420+R()*260);
        d.unrest = clamp(d.unrest-8,0,100);
        d.gladiators.forEach(o=>{ if(o.status==="active") o.morale=clamp(o.morale+7,0,100); });
        d.flags.lookedAway = 1;
        return `${go.length===1?"One of them is":`${go.length} of them are`} gone by first light and the gate was not forced. The coin is under the feed sack where he said it would be. You have now done this twice, and the second time was for money.`; }
      if(i===1){ d.fame += 22; d.war.weeks += 3;
        patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor+16,0,100); }); recomputeFavor(d);
        d.unrest = clamp(d.unrest+12,0,100);
        d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-14,0,100); o.defiance=clamp(o.defiance+11,0,100); } });
        d.flags.turnedHimIn = 1;
        return `You hand the messenger to the magistrate's men and Capua is briefly very warm about it. Your own cells are not. Somebody in the south now knows exactly which house did that, and so does every man in this one.`; }
      return `You send him back down the road empty-handed. He does not seem surprised, which is somehow the worst of it.`; } },
  theRoad: {
    make(d){ if(!d.war || warIdx(d)!==3 || d.flags.sawTheRoad) return null;
      return { id:"theRoad", title:"The Road to Rome",
        text:`The crucifixions begin outside Capua and go north from there. ${d.war.name} is not among them — nobody found him, or nobody who found him said so — but three men you owned are, at intervals, in the first mile. You could go and stand there. Most of Capua is going.`,
        choices:["Walk the first mile", "Send the familia to walk it", "Keep the gate shut"] }; },
    run(d,ev,i){ d.flags.sawTheRoad = 1;
      if(i===0){ if(d.lanista) d.lanista.health = clamp(d.lanista.health-4,0,100);
        addRep(d, "mercy", 6);
        return `You walk it. You knew two of the faces and one of them, at the end, knew yours. There is no lesson in it and you will not be repeating the walk.`; }
      if(i===1){ d.gladiators.forEach(g=>{ if(g.status==="active"){
          g.morale = clamp(g.morale-20,0,100); g.defiance = clamp(g.defiance-24,0,100); } });
        d.unrest = clamp(d.unrest-22,0,100);
        addRep(d, "blood", 10);
        return `You send them out under guard to walk the first mile and look at it properly. They come back quiet and they stay quiet for a long time. It works exactly as well as you were told it would, which is the thing you will have to live with.`; }
      d.gladiators.forEach(g=>{ if(g.status==="active") g.morale=clamp(g.morale+4,0,100); });
      return `You keep the gate shut and the yard working. The sound of Capua going north to look carries over the wall for most of the day.`; } },
  ambition: {
    make(d){
      const act = activeG(d).filter(g=>{ const a=g.ambition;
        return a && !a.met && !a.broken && !a.despair
          && (a.voiced===0 ? d.week-(a.since||0) >= 5 : a.voiced===1 && d.week-a.since >= 9); });
      if(!act.length) return null;
      /* he raises it when it is on his mind — a hunt on the card, the great games near */
      const topical = g => { const k=g.ambition.kind;
        if(k==="nobeast") return d.games && d.games.offers.some(o=>o.venatio) ? 3 : 1;
        if(k==="nokill") return d.games && d.games.offers.some(o=>o.stakes==="sine") ? 3 : 1;
        if(k==="beside") return d.games && d.games.offers.some(o=>o.pair) ? 3 : 1;
        if(k==="champion") return weeksUntil(d, CALENDAR.find(f=>f.key==="romani")) <= 4 ? 3 : 1;
        if(k==="revenge") return d.games && d.games.offers.some(o=>o.opp && o.opp.house) ? 2 : 1;
        if(k==="nickname") return g.wins>=4 ? 3 : 1;
        if(k==="freedom") return g.wins>=6 ? 3 : 1;
        return 1; };
      const bag = []; act.forEach(g=>{ const w=topical(g); for(let i=0;i<w;i++) bag.push(g); });
      const g = pick(bag);
      const a = g.ambition;
      const second = a.voiced>=1;
      return { id:"ambition", title: second ? "He Asks Again" : "A Man Asks",
        text: second ? AMBITIONS[a.kind].press(g) : AMBITIONS[a.kind].ask(g),
        choices: second
          ? ["Give him your word", "Tell him plainly it will not happen", "Give him nothing"]
          : ["Give him your word", "Tell him no, and tell him why", "Say nothing and walk on"],
        data:{ gid:g.id, second } }; },
    run(d,ev,i){
      const g = d.gladiators.find(x=>x.id===ev.data.gid);
      if(!g || !g.ambition) return "The moment passes.";
      const a = g.ambition;
      a.voiced = Math.min(2, (a.voiced||0)+1);
      a.since = d.week;
      const second = ev.data.second;
      if(i===0){
        const already = a.promised;
        a.promised = true;
        g.morale = clamp(g.morale + (already? 4 : 12), 0, 100);
        g.defiance = clamp(g.defiance - (already? 2 : 7), 0, 100);
        return already
          ? `He takes your word a second time, and you can both hear that it is worth less than it was. Whatever happens now, he will remember which of you said it.`
          : `You give him your word. He does not say thank you — he repeats it back to you, once, to be sure of the shape of it.`;
      }
      if(i===1){
        g.morale = clamp(g.morale - (second?14:6), 0, 100);
        g.defiance = clamp(g.defiance + (second?10:3), 0, 100);
        if(a.promised){ ambitionBroken(d, g); return `You tell him no, and he reminds you what you said last time. That is the end of that.`; }
        return second
          ? `You tell him it will not happen. He nods as though he already knew, which he did, and goes back to the post.`
          : `You tell him no and you tell him why. He would rather have the answer than the waiting, and he says so.`;
      }
      g.morale = clamp(g.morale - (second?18:10), 0, 100);
      g.defiance = clamp(g.defiance + (second?14:6), 0, 100);
      d.unrest = clamp(d.unrest+3, 0, 100);
      return second
        ? `You give him nothing at all, twice. He will not ask a third time.`
        : `You walk on. He stands there a moment longer than he needs to before going back to work.`; } },
  auctoratus: {
    make(d){ if(d.gladiators.filter(g=>!isGone(g)).length>=8) return null;
      const q = clamp(ri(42,68) + Math.round(d.fame/40), 30, 84);
      const g = makeAuctoratus(d, q);
      if(d.gold < g.auctor.fee) return null;
      return { id:"auctoratus", title:"A Free Man at the Gate",
        text:`${g.name} of ${g.origin} is standing in your yard and nobody brought him. He is free, he is not drunk, and he wants to sign. ${g.auctor.why} He asks ${g.auctor.fee} denarii in hand and ${g.auctor.wage} a week, for ${g.auctor.bouts} bouts — after which he walks out the way he came in.`,
        choices:[`Take the oath from him — ${g.auctor.fee}d`, "Send him home"], data:{g} }; },
    run(d,ev,i){ const g = ev.data.g;
      if(i===0){
        if(d.gold < g.auctor.fee) return "You count the coin twice and it is still not there. He nods and goes.";
        d.gold -= g.auctor.fee;
        d.gladiators.push(g);
        d.unrest = clamp(d.unrest-3, 0, 100);
        return `${g.name} swears the sacramentum with everyone else's words — burned, bound, beaten, slain — and means every one of them, which the men in the cells find harder to watch than they expected.`;
      }
      return `You send him back down the road. There will be another one; there always is.`; } },
  sabotage: {
    make(d){ if(!d.rivals || !activeG(d).length) return null;
      const h = d.rivals.filter(x=>x.grudge>=30).sort((a,b)=>(b.grudge*(lanistaOf(b.name).sabotage||1))-(a.grudge*(lanistaOf(a.name).sabotage||1)))[0];
      if(!h) return null;
      return { id:"sabotage", title:"A Rat in the Granary", text:`Your cook swears the grain was tampered with — and that he saw a man in House ${h.name}'s colors near the stores after dark.`,
        choices:["Post paid watchmen — 80 denarii","Let it lie"], data:{house:h.name} }; },
    run(d,ev,i){ const h = d.rivals && d.rivals.find(x=>x.name===ev.data.house);
      if(i===0){ d.gold-=80; if(h) h.grudge=clamp(h.grudge-8,0,100);
        return "The watchmen catch a shadow at the wall and break his fingers. Nothing is proven — but nothing is poisoned, either."; }
      if(R()<0.6){ const t=pick(activeG(d));
        if(t){ t.injury={name:"Poisoned gut",weeks:2,pen:8}; t.status="injured";
          return `${t.name} doubles over at morning drills — poison, the medicus says. House ${ev.data.house} sends no apology.`; } }
      return "Days pass. Nothing comes of it. This time."; } },
  bribedEditor: {
    make(d){ if(!d.rivals || d.fame<TIERS[1].fame) return null;
      const h = d.rivals.filter(x=>x.grudge>=50).sort((a,b)=>(b.grudge*lanistaOf(b.name).bribe)-(a.grudge*lanistaOf(a.name).bribe))[0];
      if(!h) return null;
      return { id:"bribedEditor", title:"The Editor's New Rings", text:`Word from the baths: House ${h.name} has been generous with the editor of the coming games. If one of your men falls, the thumb may already be turned.`,
        choices:["Outbid them — 150 denarii","Let them waste their coin"], data:{house:h.name} }; },
    run(d,ev,i){ if(i===0){ d.gold-=150; return "Gold answers gold. The editor's smile, when you next see it, is yours again."; }
      d.flags.editorBribed = ev.data.house;
      return "You keep your purse shut. Pray your men keep their feet."; } },
  thugs: {
    make(d){ if(!d.rivals) return null;
      const h = d.rivals.find(x=>x.grudge>=65); const c=activeG(d);
      if(!h || !c.length) return null; const t=pick(c);
      return { id:"thugs", title:"Blood in the Street", text:`${t.name} returns from an errand bloodied — three men with clubs, professional about it. The tavern keeper says they drank on House ${h.name}'s coin.`,
        choices:["Answer in kind — send your own men","Bind his wounds and bide your time"], data:{house:h.name, tid:t.id} }; },
    run(d,ev,i){ const h = d.rivals && d.rivals.find(x=>x.name===ev.data.house);
      const t = d.gladiators.find(g=>g.id===ev.data.tid);
      if(t && t.status==="active"){ t.injury={name:"Beaten in the streets",weeks:1,pen:5}; t.status="injured"; }
      if(i===0){ if(h){ const vic=h.fighters.filter(f=>!f.injury); if(vic.length){ const v=pick(vic); const inj=pick(INJURIES); v.injury={name:inj[0],weeks:2,pen:inj[2]}; }
          h.grudge=clamp(h.grudge+10,0,100); }
        return `Two can play at shadows. One of House ${ev.data.house}'s men wakes in a gutter, and Capua takes note of the feud.`; }
      if(h) h.grudge=clamp(h.grudge-6,0,100);
      d.gladiators.forEach(o=>{ if(o.status==="active") o.morale=clamp(o.morale-3,0,100); });
      return "You swallow the insult. The familia mutters that the house does not answer blood — but the feud cools, a little."; } },
  whispers: {
    make(d){ if(!d.rebellion || d.rebellion.stage!==1 || d.flags.s1done) return null;
      return { id:"whispers", title:"Whispers in the Dark", text:"Your body-slave reports voices in the cells past midnight — the same voice, always, low and steady, and the others listening. An informant among the kitchen slaves offers a name, for coin.",
        choices:["Pay 60 denarii for the name","Trust the whip to keep order"] }; },
    run(d,ev,i){ const L = d.rebellion ? d.gladiators.find(g=>g.id===d.rebellion.leaderId) : null;
      if(i===0){ d.gold-=60; d.flags.leaderKnown=true;
        return L ? `The informant leans close: it is ${fullName(L)}. You watch him at drills the next morning — and find him already watching you.`
          : "The informant takes your coin and names a man already gone from your ludus. The voice in the dark continues."; }
      return "You double the night guard and let the whispers whisper. Words never broke a gate — but they have opened a few."; } },
  stolenSteel: {
    make(d){ if(!d.rebellion || d.rebellion.stage!==2 || d.flags.s2done) return null;
      return { id:"stolenSteel", title:"Stolen Steel", text:"The doctore counts the practice blades twice, then a third time. One is missing — and a kitchen knife besides. Somewhere in your house, edges are being hidden against a chosen night.",
        choices:["Lockdown — turn out every cell","Set a quiet watch — 60 denarii"] }; },
    run(d,ev,i){ if(i===0){ d.unrest=clamp(d.unrest-10,0,100);
        d.gladiators.forEach(g=>{ if(g.status==="active"){ g.morale=clamp(g.morale-8,0,100); g.defiance=clamp(g.defiance+3,0,100); } });
        return "The blades are found beneath a loose stone, and the familia stands in the cold while the cells are stripped. Order is restored — the brittle kind."; }
      d.gold-=60; d.flags.leaderKnown=true; d.flags.forewarned=1; d.unrest=clamp(d.unrest-4,0,100);
      const L = d.rebellion ? d.gladiators.find(g=>g.id===d.rebellion.leaderId) : null;
      return L ? `Your watchers earn their coin. They mark who passes what, and to whom — and every path leads back to ${fullName(L)}. When the night comes, you will not be surprised.`
        : "Your watchers earn their coin, though the ringleader stays a shadow. When the night comes, you will not be surprised."; } },
  uprising: {
    make(d){ if(!d.rebellion || d.rebellion.stage!==3) return null;
      const keys = ["fight"]; const choices = ["Meet them with steel"];
      if(d.gold>=300){ keys.push("guards"); choices.push("Send for the magistrate's guards — 300 denarii"); }
      keys.push("open"); choices.push("Open the gates — let them go");
      return { id:"uprising", title:"The Night of Fire", text:"It begins with a scream cut short. Then torchlight where no torch should be, and the sound of a cell door — not forced, but unlocked. They are coming up from the cells, armed with stolen steel and four hundred nights of grievance. The ones who came up first are the ones who ate together. You have moments.",
        choices, data:{ keys, leaderId:d.rebellion.leaderId } }; },
    run(d,ev,i){ const key = ev.data.keys[i];
      const act = activeG(d);
      let L = d.gladiators.find(g=>g.id===ev.data.leaderId && g.status==="active");
      if(!L && act.length) L = act.reduce((m,g)=>g.defiance>m.defiance?g:m, act[0]);
      const reset = ()=>{ d.rebellion=null; delete d.flags.s1done; delete d.flags.s2done; delete d.flags.leaderKnown; delete d.flags.forewarned; };
      if(!L){ reset(); return "The cells hold no one with fight left in him. The night passes."; }
      const kin = kinOf(d, L.id, "brother");
      const rebels = act.filter(g=>!isAuctor(g) && (g.id===L.id || kin.includes(g.id) || g.defiance>=55 || (g.defiance>=40 && g.morale<45)));
      const loyal = act.filter(g=>!rebels.some(r=>r.id===g.id) && (isAuctor(g) || g.defiance<45));
      if(key==="open"){
        rebels.forEach(g=>{ g.status="escaped"; });
        d.escaped.push({ name:fullName(L), count:rebels.length, week:d.week });
        d.flags.spartacusAtLarge = fullName(L);
        d.fame = Math.max(0, d.fame-30);
        d.unrest = 12;
        d.gladiators.forEach(g=>{ if(g.status==="active") g.defiance=clamp(g.defiance-12,0,100); });
        reset();
        chron(d, `${fullName(L)} and ${rebels.length>1? (rebels.length-1)+" others" : "no other"} pass through your opened gates into the dark.`, "bad");
        return `You meet ${L.name} in the yard, sword lowered, and open the gates yourself. He studies you a long moment — searching for the trick — then leads his men into the night. Capua will call you weak. The men who remain call you something quieter. And somewhere south, a fire you fed for years is loose in dry country.`;
      }
      let houseS = 40 + loyal.reduce((s,g)=>s+(g.str+g.dis)/2,0)*0.4 + (d.trainMult>1?15:0) + (d.doctore? d.doctore.skill*0.25 : 0);
      if(key==="guards"){ d.gold-=300; houseS+=80; }
      if(d.flags.forewarned) houseS+=30;
      const rebelS = rebels.reduce((s,g)=>s+(g.str+g.tec)/2,0)*0.5 * (L.legend?1.3:1.05);
      if(R() < houseS/(houseS+rebelS)){
        L.status="dead"; L.fateNote="revolt"; d.fallen.push({ name:fullName(L)+" — in revolt", week:d.week }); collBury(d, L);
        let lost=1;
        rebels.forEach(g=>{ if(g.id!==L.id){
          if(R()<0.45){ g.status="dead"; g.fateNote="revolt"; d.fallen.push({ name:fullName(g)+" — in revolt", week:d.week }); collBury(d, g); lost++; }
          else { g.defiance=25; g.morale=18; if(R()<0.3 && !g.traits.includes("Broken")) g.traits.push("Broken"); }
        }});
        d.unrest=15; d.fame=Math.max(0, d.fame-15);
        d.gladiators.forEach(g=>{ if(g.status==="active") g.morale=clamp(g.morale-6,0,100); });
        reset();
        chron(d, `Revolt in the night — put down in blood. ${lost} dead, ${fullName(L)} among them.`, "bad");
        return `Steel answers steel in the torchlit yard. ${key==="guards"? "The magistrate's guards break the rebels against the colonnade" : "Your loyal men and hired blades hold the stair"}, and by grey dawn it is finished. ${L.name} dies at the gate he could not open${lost>1? `, and ${lost-1} of his conspirators with him` : ", alone in his fury"}. The survivors kneel in the sand and do not raise their eyes. Capua hears of it — a house that bleeds itself is watched with new doubt.`;
      }
      d.over = { kind:"rebellion", leader: fullName(L) };
      return "The stair is lost.";
    } },
};

function pickEvent(d){
  const keys = Object.keys(EVENTS).sort(()=>R()-0.5);
  for(const k of keys){
    const ev = EVENTS[k].make(d);
    if(ev) return ev;
  }
  return null;
}

/* ---- EVENT ARCS ----
   A choice now can plant a beat that arrives weeks later. A scheduled beat names
   an EVENTS entry that has build(d,data) instead of a random make() — so the
   weekly roll never surfaces it, but fireArc raises it when its week comes, ahead
   of the random event. If the context is gone by then (build returns null) the
   beat quietly lapses. */
function scheduleArc(d, id, weeks, data){ (d.arcs || (d.arcs=[])).push({ id, fire: d.week + Math.max(1, weeks|0), data: data||{} }); }
function fireArc(d){
  if(d.pendingEvent || d.rome || d.over) return;
  const arcs = d.arcs || (d.arcs = []);
  const idx = arcs.findIndex(a => a.fire <= d.week && EVENTS[a.id] && EVENTS[a.id].build);
  if(idx < 0) return;
  const a = arcs.splice(idx, 1)[0];
  const ev = EVENTS[a.id].build(d, a.data);
  if(ev) d.pendingEvent = ev;   /* build returned null -> the moment passed, the beat is spent */
}

/* ================= WEEK RESOLUTION & ACTIONS ================= */

function updateRebellion(d){
  const act = activeG(d);
  if(!act.length){ d.rebellion=null; return; }
  const sway = g => isAuctor(g) ? -99 : g.defiance + kinOf(d,g.id,"brother").length*9;
  const leader = act.reduce((m,g)=> sway(g) > sway(m) ? g : m, act[0]);
  if(d.rebellion) d.rebellion.leaderId = leader.id;
  const st = d.rebellion ? d.rebellion.stage : 0;
  if(st>0 && d.unrest < [0,40,55,68][st]){
    if(st===1){ d.rebellion=null; delete d.flags.s1done; delete d.flags.s2done; delete d.flags.leaderKnown; delete d.flags.forewarned; }
    else d.rebellion.stage = st-1;
    chron(d, "The heat in the cells cools. For now.");
    return;
  }
  if(st===0 && d.unrest>=50){
    d.rebellion = { stage:1, leaderId:leader.id };
    d.pendingEvent = EVENTS.whispers.make(d);
    d.flags.s1done = true;
    chron(d, "Something has changed in how the yard falls silent when you pass.", "bad");
  } else if(st===1 && d.unrest>=65){
    d.rebellion.stage = 2;
    d.pendingEvent = EVENTS.stolenSteel.make(d);
    d.flags.s2done = true;
    chron(d, "The doctore reports blades missing from the racks.", "bad");
  } else if(st===2 && d.unrest>=78){
    d.rebellion.stage = 3;
    d.pendingEvent = EVENTS.uprising.make(d);
    chron(d, "Tonight, the ludus does not sleep.", "bad");
  }
}

function endWeek(d){
  const fest = d.rome ? null : festivalNow(d);
  repairSpar(d);
  d.gladiators.forEach(g=>{ if(g.status==="away" && d.week+1>=g.returnWeek){ g.status="active"; chron(d, `${g.name} returns from ${PR(g).his} post at the noble's villa.`); } });
  let upkeep=0, injured=0;
  d.gladiators.forEach(g=>{
    if(isGone(g)) return;
    upkeep += (10 + seasonUpkeep(d)) * pit(d,"upkeep") + (isAuctor(g) ? g.auctor.wage : 0);
    /* the years turn on every man, injured or not — one for every year in your keeping */
    g.weeksAged = (g.weeksAged||0) + 1;
    if(g.weeksAged >= YEAR_WEEKS){ g.weeksAged -= YEAR_WEEKS; ageManOneYear(d, g); }
    if(g.status==="injured"){
      injured++;
      const rate = g.injury.care==="surgeon" ? healSpeed(d,g)*1.6 : g.injury.care==="convalesce" ? healSpeed(d,g)*0.72 : healSpeed(d,g);
      g.injury.weeks -= rate * seasonHeal(d);
      if(g.injury.care==="convalesce") g.morale = clamp(g.morale+3, 0, 100);   // rest of the spirit as well as the body
      g.fatigue=clamp(g.fatigue-22,0,100);
      if(g.injury.weeks<=0){
        const part = g.injury.part, care = g.injury.care, sev = (g.injury.pen>=8);
        g.injury=null; g.status="active";
        const careGuard = care==="surgeon" ? 0.6 : care==="convalesce" ? 0.4 : 1;
        const guard = scarGuard(d) * careGuard;
        if(part && R() < (sev ? 0.75 : 0.45) * guard){
          const repeat = addScar(g, part, sev);
          const lasted = checkLasting(d, g, part) || (sev ? graveLasting(d, g, part, care) : null);
          chron(d, repeat
            ? `${g.name} leaves the medicus' table. That ${SCAR_WORD[part]||"wound"} has been opened twice now, and it will not come back all the way.`
            : lasted ? `${g.name} leaves the table alive. Not every part of him came with him.`
            : `${g.name} rises from the medicus' table. ${PR(g).He} will carry the mark.`);
        } else if(part && sev && graveLasting(d, g, part, care)){
          /* no fresh scar, but a grave wound left its own quiet ruin */
        } else chron(d, `${g.name} rises from the medicus' table, whole.`);
      }
    } else if(g.status==="active"){
      if(g.injury && g.injury.care==="through"){
        injured++;
        if(R() < 0.13 * (1 - medicusGuard(d))){
          const inj = g.injury;
          addScar(g, inj.part || "flank", true);
          checkLasting(d, g, inj.part || "flank");
          g.injury = { name:inj.name, weeks:inj.weeks+2, pen:inj.pen+3, part:inj.part, care:"rest" };
          g.status = "injured";
          g.morale = clamp(g.morale-10,0,100); g.defiance = clamp(g.defiance+6,0,100);
          d.unrest = clamp(d.unrest+3,0,100);
          chron(d, `${g.name}'s ${SCAR_WORD[inj.part]||"wound"} has set badly. It was never going to close while ${PR(g).he} was using it.`, "bad");
        } else if(R()<0.3){
          g.injury.pen = Math.min(16, g.injury.pen+2);
          g.injury.weeks++;
        }
      }
      g.fatigue = clamp(g.fatigue-13-bathRest(d), 0, 100);
      const reg = planDrill(g) || g.regimen || "palus";
      if(seasonOfMan(g)) planWeek(d, g);
      if(reg==="rest"){ g.fatigue=clamp(g.fatigue-30,0,100); g.morale=clamp(g.morale+4,0,100);
        if(strainOf(g)>45) remember(d, g, "rested");
        g.strain = clamp(strainOf(g)-11, 0, 100); }
      else {
        const D = REGIMENS[reg] || REGIMENS.palus;
        const mate = reg==="spar" ? sparPartner(d,g) : null;
        /* what this week's work is actually pointed at */
        let targets = {};
        if(D.focus) targets[g.focus] = D.rate;
        else if(D.gains) targets = Object.assign({}, D.gains);
        else if(D.learn && mate){
          /* he learns whatever his partner is better at, not whatever you wanted */
          const best = STATS.reduce((m,k)=> (mate[k]-g[k]) > (mate[m]-g[m]) ? k : m, STATS[0]);
          targets[(mate[best]-g[best]) > 3 ? best : g.focus] = 1.0;
        }   /* a spar with no partner is turned into post work by repairSpar */

        let mult = 1, injChance = 0;
        if(mate){
          const t = tieBetween(d, g.id, mate.id);
          const k = Object.keys(targets)[0] || g.focus;
          const learn = clamp((mate[k]-g[k])*0.010, 0, 0.45);
          mult = SPAR_BASE + learn;
          injChance = SPAR_INJ * palusGuard(d);
          if(t && t.kind==="brother"){ mult *= 1.10; injChance *= 0.6; g.morale=clamp(g.morale+1,0,100); }
          else if(t && t.kind==="rival"){ mult *= 1.25; injChance *= 2; g.morale=clamp(g.morale-1,0,100); }
        }
        const base = (0.5 + g.potential/100*1.3) * d.trainMult * ageTrain(g.age)
          * palusTrain(d) * perkTrain(d) * lanTrain(d) * seasonTrain(d) * docTrainMult(d,g) * docCreedNum(d,"train") * (fest && fest.train ? fest.train : 1)
          * mult * (g.traits.includes("Swift Learner")?1.3:1)
          * (g.fatigue>75?0.4:1) * strainDrag(g);
        for(const [k,w] of Object.entries(targets)){
          const gain = base * w * docTrain(d, k, g);
          g[k] = clamp(g[k]+gain, 5, statCap(g, k));
        }
        if(D.costs) for(const [k,w] of Object.entries(D.costs)) g[k] = Math.max(8, g[k] - base*w*0.55);
        g.fatigue = clamp(g.fatigue + ((D.fat==null?13:D.fat) * (D.fat>0?seasonFat(d):1)) + (mate?1:0), 0, 100);
        if(D.fat < 0) g.morale = clamp(g.morale+1, 0, 100);
        /* worked past what he has, and it does not come off with a night's sleep */
        const over = Math.max(0, g.fatigue - 55) * 0.105 + (D.fat>=15 ? 1.2 : 0);
        g.strain = clamp(strainOf(g) + over - (D.fat<0 ? 3.4 : 0.4), 0, 100);
        const heavy = g.fatigue>88 ? 0.11 : 0;
        const risk = (heavy + injChance*(g.fatigue>70?1.6:1)) * docInjuryGuard(d, g) * strainRisk(g) * docInjure(d);
        if(R()<risk && !g.traits.includes("Iron Hide")){
          const inj = INJURIES[ri(0,1)];
          g.injury={name:inj[0],weeks:inj[1],pen:inj[2]}; g.status="injured"; g.sparWith=null; g.regimen="palus";
          chron(d, mate
            ? `${mate.name} puts ${g.name} down harder than ${PR(mate).he} meant to. The medicus is called.`
            : strainOf(g)>50
            ? `${g.name} has been worked past what he had left, and something in him finally gives.`
            : `${g.name} tears something in training — driven too hard.`, "bad");
        }
      }
      if(g.age>PRIME[1]){
        const rate = (g.age-PRIME[1])*0.05;
        for(const k of Object.keys(DECAY_RATE)) g[k] = Math.max(8, g[k] - rate*DECAY_RATE[k]);
      }
      /* old wounds ache in the cold — a well-worn man moves stiff through the wet months */
      if(seasonOf(d).key==="winter" && bodyWear(g) > 0.28 && R() < bodyWear(g)*0.22){
        g.morale = clamp(g.morale-5, 0, 100);
        g.fatigue = clamp(g.fatigue+8, 0, 100);
        const bath = bLevel(d,"balneae");
        chron(d, bath>=2
          ? `${g.name}'s old wounds pull in the cold, but the hot rooms take the worst of it out of him.`
          : `${g.name}'s old wounds ache in the wet months. ${PR(g).He} moves stiff all week.`, "bad");
        if(bath>=2){ g.morale = clamp(g.morale+3, 0, 100); g.fatigue = clamp(g.fatigue-5, 0, 100); }
      }
      g.morale = clamp(g.morale + bathMorale(d), 0, 100);
      g.morale = clamp(g.morale + lanMorale(d), 0, 100);
      g.defiance = clamp(g.defiance - regardCalm(g), 0, 100);
      if(docRegard(d)) g.regard = clamp(regardOf(g) + docRegard(d), 0, 100);
      g.defiance = clamp(g.defiance + lanDefiance(d), 0, 100);
      const target = 52 + (d.week - g.lastFought > 6 ? -6 : 4);
      g.morale = clamp(g.morale + (target-g.morale)*0.15, 0, 100);
      let dd = 0;
      if(g.morale<40) dd+=0.8;
      if(g.morale>72) dd-=0.6;
      if(g.traits.includes("Defiant")) dd+=0.6;
      if(g.traits.includes("Broken")) dd-=0.4;
      if(g.traits.includes("Stoic")) dd-=0.2;
      if(rudisEligible(g)) dd+=1.5;
      g.defiance = clamp(g.defiance+dd, 0, 100);
    }
  });
  if(fest && fest.rest){
    d.gladiators.forEach(g=>{ if(g.status==="active"){ g.morale=clamp(g.morale+14,0,100); g.defiance=clamp(g.defiance-7,0,100); } });
    d.unrest = clamp(d.unrest-11, 0, 100);
    chron(d, `The Saturnalia. The kitchen serves the familia at your own table and takes their orders, the cells stand unlocked, and for a week nobody in this house is anybody's property. It costs a week's takings and it is the cheapest peace you will ever buy.`, "good");
  }
  d.gladiators.forEach(g=>{
    if(g.status!=="active" || !isAuctor(g) || auctorLeft(g)>0) return;
    if(!d.reSignOffer && g.morale>=58 && R()<0.6){
      d.reSignOffer = Object.assign({ gid:g.id, name:fullName(g) }, auctorReSign(d, g));
    } else auctorDepart(d, g);
  });
  deadlineWeek(d);
  listenWeek(d);
  loanWeek(d);
  for(const g of d.gladiators) if(g.benched && g.benched.weeks>0 && --g.benched.weeks<=0) g.benched = null;
  feudWeek(d);
  learnWeek(d);
  charterWeek(d);
  yardWeek(d);
  lateWeek(d);
  offerPact(d);
  pactWeek(d);
  edictWeek(d);
  lawWeek(d);
  askWeek(d);
  ruinWeek(d);
  paragonWeek(d);
  paragonExpire(d);
  { const C = docCreed(d);
    if(C){ if(C.regard) activeG(d).forEach(g=>{ g.regard = clamp(regardOf(g) + C.regard, 0, 100); });
      if(C.calm) d.unrest = clamp(d.unrest - C.calm, 0, 100); } }
  worksWeek(d);
  householdWeek(d);
  owedWeek(d);
  rivalArc(d);
  bayWeek(d);
  favourWeek(d);
  formWeek(d);
  electionWeek(d);
  rackWeek(d);
  staffWeek(d);
  refuseWeek(d);
  facWeek(d);
  rivalTurn(d);
  circuitWeek(d);
  warWeek(d);
  lanistaWeek(d);
  riseWeek(d);
  featWeek(d);
  travelWeek(d);
  if(!d.city && !d.travel) primusWeek(d);
  ambWeek(d);
  repairWeek(d);
  nemesisWeek(d);
  if(!d.city && !d.travel) nemHouseWeek(d);
  if(!d.city && !d.travel) sagaWeek(d);
  favouriteWeek(d);
  doctoreWeek(d);
  annalsSync(d);
  repWeek(d);
  patronWeek(d);
  if(!d.rome && !d.city && !d.travel) poachWeek(d);
  romeWeek(d);
  if(romeReady(d) && R()<0.3) offerRome(d);
  sparSocial(d);
  weaveTies(d);
  mentorWeek(d);
  d.gladiators.forEach(g=>{
    if(isGone(g)) return;
    g.weeksAged = (g.weeksAged||0) + 1;
    if(g.weeksAged >= WEEKS_PER_YEAR){
      g.weeksAged = 0; g.age = (g.age||24) + 1;
      if(g.age===PRIME[0]) chron(d, `${g.name} turns ${g.age}. The doctore says ${PR(g).he} has finally grown into ${PR(g).his} frame.`);
      else if(g.age===PRIME[1]+1) chron(d, `${g.name} turns ${g.age}. ${PR(g).He} is a step slower off the mark than ${PR(g).he} was, and ${PR(g).he} knows it.`);
      else if(g.age===32) chron(d, `${g.name} turns ${g.age}. Old for the sand. The younger men have started calling him doctore, half in jest.`);
      else if(g.age>=35) chron(d, `${g.name} turns ${g.age}. Every year past this one is borrowed.`, "bad");
    }
  });
  upkeep += injured*8*pit(d,"upkeep");
  upkeep += bUpkeep(d);
  upkeep += collDues(d);
  if(d.flags.underwritten > 0){ d.flags.underwritten--; upkeep = 0; }
  if(d.doctore){ upkeep += docWage(d.doctore); d.doctore.weeks = (d.doctore.weeks||0)+1; }
  d.gold -= upkeep;
  const act = activeG(d);
  const bound = act.filter(g=>!isAuctor(g));
  const avgDef = bound.length ? bound.reduce((s,g)=>s+g.defiance,0)/bound.length : 10;
  const auctors = act.filter(isAuctor).length;
  d.unrest = clamp(d.unrest + (avgDef-34)/9 - 0.6 - docCalm(d) - cellCalm(d) - auctors*0.35 - perkCalm(d) - lanCalm(d) - (collOn(d)?0.4:0) + (seasonOf(d).unrest + docUnrest(d)) * pit(d,"unrest"), 0, 100);
  if(d.fame>60) d.fame -= 1;
  d.week++;
  if(d.lanista && (d.week-1) % WEEKS_PER_YEAR === 0){
    d.lanista.age++;
    if([50,60,70].includes(d.lanista.age))
      chron(d, `${d.lanista.name} turns ${d.lanista.age}. The stairs up to the gallery are further than they were.`, "event");
  }
  chron(d, `Week ${d.week}. Upkeep paid: ${upkeep} denarii.`);
  afterWeek(d);
  if((d.week-1)%3===0 && !d.rome && !d.city && !d.travel){ makeMarket(d); makeDoctoreMarket(d); makeStaffMarket(d);
    const rich = (d.rivals||[]).map(h=>({h,L:lanistaOf(h.name)})).sort((a,b)=>b.L.bid-a.L.bid)[0];
    if(rich && rich.L.bid>=1.4 && d.market.length>1 && R()<0.45){
      const best = d.market.reduce((m,g)=>gladValue(g)>gladValue(m)?g:m, d.market[0]);
      d.market = d.market.filter(g=>g.id!==best.id);
      const f = makeRivalFighter(d, rich.h.name, 55);
      ["str","agi","end","tec","sho","dis","potential"].forEach(k=>{ f[k]=best[k]; });
      f.name = best.name; f.origin = best.origin; f.cls = best.cls; f.kit = best.kit;
      rich.h.fighters.push(f);
      chron(d, `${rich.L.name} took ${best.name} off the block before you had finished looking at him. He did not haggle.`, "bad");
    }
  }
  rivalWeekly(d);
  if(d.romeOffer && d.romeOffer.due && d.week > d.romeOffer.due){
    d.romeOffer = null;
    d.flags.romeDeclined = d.week;
    d.fame = Math.max(0, d.fame-12);
    patronsOf(d).forEach(p=>{ if(p.rank==="senator") p.favor = clamp(p.favor-22,0,100); }); recomputeFavor(d);
    chron(d, `The invitation to Rome went unanswered long enough to be an answer. The place on the bill has gone to another house.`, "bad");
  }
  d.munera = (!d.rome && !d.city && !d.travel && !festivalNow(d) && R()<0.16) ? 1 : 0;
  d.games = null;
  if(d.travel){ /* on the road */ }
  else if(d.city){ if(R()<0.75) makeCityGames(d); }
  else if(d.rome && d.rome.travel<=0 && d.rome.fought<ROME_BOUTS){ makeGames(d); }
  else if(!d.rome && !d.city && (festivalNow(d) || d.munera) && d.fame>=TIERS[1].fame){
    makeGames(d);
    if(d.games) chron(d, `Games are announced — ${d.games.festival}! Match offers await at the arena.`, "good");
  }
  d.pendingEvent = null;
  updateRebellion(d);
  if(d.pendingRome){ const pr = d.pendingRome; d.pendingRome = null;
    d.pendingEvent = { id:"romeReturn", title: pr.triumph ? "Home in Triumph" : "The Long Road Home",
      text: pr.triumph
        ? `${pr.won} of ${ROME_BOUTS} won on the imperial sand, and the house comes home to Capua under the laurel — ${pr.purse}d in the strongbox and your name spoken in rooms you will never stand in. The games at Capua will look small for a while. What you make of it now is yours to decide.`
        : `${pr.won} of ${ROME_BOUTS} on the imperial sand. Not the triumph the letter promised — but the house walked off Rome's floor on its own feet, which more than one great name has not. You come home lighter than you went. Capua is still Capua, and there is work in the morning.`,
      choices: pr.triumph
        ? ["Carry on — there is more to build", "Lay the house down here, at its height"]
        : ["Take up the work again"],
      data:{ won:pr.won, triumph:pr.triumph } };
  }
  if(!d.pendingEvent && !d.rome && R()<0.14){ const ev=EVENTS.ambition.make(d); if(ev) d.pendingEvent=ev; }
  freedWeek(d);
  fireArc(d);   /* a beat planted weeks ago comes due — ahead of the week's random event */
  if(!d.pendingEvent && !d.rome && R()<0.45){ const ev=pickEvent(d); if(ev) d.pendingEvent=ev; }
  if(d.flags.spartacusAtLarge && R()<0.25){
    d.flags.sparkCount = (d.flags.sparkCount||0)+1;
    const n = d.flags.spartacusAtLarge;
    const SL = [
      `Word from the south: ${n} has not been taken. Runaways drift to him like iron to lodestone.`,
      `${n}'s band raided a villa near Nola. They say he fights like a man with nothing left to fear.`,
      `Three hundred now, the road-talk says, and ${n} at their head. Rome pretends not to hear.`,
      `A praetor marches south against ${n}. The wine shops are already taking wagers.`,
      `They are calling it a war now. Your name is spoken in the same breath as his — the house that forged him.`,
    ];
    chron(d, SL[Math.min(d.flags.sparkCount-1, SL.length-1)], "event");
    if(d.flags.sparkCount===5) d.fame += 25;
  }
  if(!d.milestone600 && d.fame>=600){ d.milestone600=true; chron(d, "Your name is spoken in Rome itself. The house has become legend.", "good"); }
  if(d.gold < (d.loan ? -420 : -250)) d.over = { kind:"debt" };
  const alive = d.gladiators.some(g=>!isGone(g));
  if(!alive && d.gold<150) d.over = { kind:"ruin" };
  /* the game says mercy is the strongest long game; it should be able to end that way */
  else if(!alive && houseRecord(d).freed >= 5 && houseRecord(d).freed > houseRecord(d).lost)
    d.over = { kind:"closed", name:d.name, freed:houseRecord(d).freed, years:yearOf(d) };
}

function grantRudis(d, gid){
  { const gp = d.gladiators.find(x=>x.id===gid); if(gp && gp.plan) gp.plan = null; }
  { const gf = d.gladiators.find(x=>x.id===gid); if(gf) favourLost(d, gf, "freed"); }
  { const g0 = d.gladiators.find(x=>x.id===gid);
    if(g0) tieList(d).filter(t=>(t.a===gid||t.b===gid) && t.kind==="brother").forEach(t=>{
      const o = d.gladiators.find(x=>x.id===(t.a===gid?t.b:t.a));
      if(o && o.status==="active") remember(d, o, "freedKin"); }); }
  const g = d.gladiators.find(x=>x.id===gid);
  if(!g || !rudisEligible(g)) return;
  g.status = "freed";
  d.freed.push({ name:fullName(g), week:d.week, wins:g.wins||0, cls:g.cls });
  d.fame += 60;
  patronsOf(d).forEach(p=>{ p.favor = clamp(p.favor+4,0,100); });
  recomputeFavor(d);
  d.unrest = clamp(d.unrest-12, 0, 100);
  d.gladiators.forEach(o=>{ if(o.status==="active") o.defiance=clamp(o.defiance-8,0,100); });
  if(d.rebellion && d.rebellion.leaderId===g.id){
    d.rebellion=null; delete d.flags.s1done; delete d.flags.s2done; delete d.flags.leaderKnown; delete d.flags.forewarned;
    d.unrest=clamp(d.unrest-15,0,100);
    chron(d, "The fire goes out of the cells — the man they would have followed walks free, and hope does what the whip could not.", "good");
  }
  addRep(d, "mercy", 16);
  if(g.ambition && g.ambition.kind==="freedom" && g.age<30) ambitionMet(d, g);
  kinReact(d, gid, "brother", 14, -8);
  dropTies(d, gid);
  chron(d, `${fullName(g)} receives the rudis before a roaring crowd — a free man. Every man in your ludus watches him take it.`, "good");
  if(!offerDoctore(d, g, "rudis"))
    chron(d, `${PR(g).He} walks out the gate into legend, and does not look back.`);
}

function retireG(d, gid){
  const g = d.gladiators.find(x=>x.id===gid);
  if(!g || isGone(g) || !retireEligible(g)) return;
  g.status = "retired";
  d.retired = d.retired || [];
  d.retired.push({ name:fullName(g), week:d.week, age:g.age, wins:g.wins, scars:(g.scars||[]).length });
  d.fame += 12;
  addRep(d, "mercy", 10);
  d.unrest = clamp(d.unrest-9, 0, 100);
  d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale+5,0,100); o.defiance=clamp(o.defiance-4,0,100); } });
  kinReact(d, gid, "brother", 8, -5);
  dropTies(d, gid);
  if(d.rebellion && d.rebellion.leaderId===g.id){
    d.rebellion=null; delete d.flags.s1done; delete d.flags.s2done; delete d.flags.leaderKnown; delete d.flags.forewarned;
    d.unrest=clamp(d.unrest-8,0,100);
  }
  chron(d, `${fullName(g)} is released from the sacramentum at ${g.age}, after ${g.wins} victories. ${PR(g).He} walks out with ${PR(g).his} scars and ${PR(g).his} name, which is more than most leave with.`, "good");
  offerDoctore(d, g, "retired");
}

function makePitOffer(d, g, stakes){
  const q = clamp(rnd(STATS.reduce((s,k)=>s+g[k],0)/6) + ri(-8,8), 22, 90);
  const sine = stakes==="sine";
  const pr = pickAnyOpp(d, 0);
  return { id:d.nextId++, tier:0, festival:null, opp:pr.opp, oppRef:pr.ref, stakes,
    purse: rnd((50+R()*40)*(sine?1.8: stakes==="blood"?0.7:1) * seasonOf(d).pits), venue:"pit" };
}

/* ================= UI ================= */

const BRONZE="#c99a4b", BLOOD="#b8463a", LAUREL="#8a9a5b";
const menace = o => { const a = STATS.reduce((s,k)=>s+o[k],0)/6; return a<38?"Green": a<52?"Seasoned": a<66?"Dangerous":"Lethal"; };
const PARTY = {
  modest:{ cost:150, favor:6, fame:3, label:"A Modest Gathering", desc:"Decent wine, a careful guest list, one exhibition bout." },
  lavish:{ cost:400, favor:14, fame:8, label:"A Lavish Banquet", desc:"Falernian wine, musicians, magistrates on the couches." },
  decadent:{ cost:900, favor:28, fame:18, label:"A Decadent Affair", desc:"Capua will speak of it for a season — one way or another." },
};

const pct = v => `${v>0?"+":""}${Math.round(v*100)}%`;
function GearStats({ it, cls }){
  const alien = it.styles && it.styles.length && cls && !it.styles.includes(cls);
  const rows = [["atk","Attack",it.atk],["def","Guard",it.def],["spd","Speed",it.spd],["sho","Crowd",it.sho]].filter(r=>r[2]);
  return (
    <div>
      <div className="flex gap-2" style={{flexWrap:"wrap",fontSize:13}}>
        {rows.map(r=>(
          <span key={r[0]} style={{color: r[2]>0 ? "#9aa86a" : "#cf5a49"}}>{r[1]} {pct(r[2])}</span>
        ))}
      </div>
      {alien && <div className="blood" style={{fontSize:13,fontStyle:"italic",marginTop:2}}>Not of his style — clumsy in his hands.</div>}
    </div>
  );
}

function Bar({v, max=100, color, label}){
  return <div className="track" role="progressbar" aria-valuenow={Math.round(clamp(v,0,max))}
    aria-valuemin={0} aria-valuemax={max} aria-label={label||undefined}>
    <div className="fill" style={{width:`${clamp(v/max*100,0,100)}%`, background:cbc(color)}}/></div>;
}

const SKIN="#a8763e", SKIN_D="#7d5527", LEATHER="#4a3216", LEATHER_D="#33220f",
      STEEL="#c3c9d0", STEEL_D="#6d747d", BRASS="#c08e3a", BRASS_D="#8a6425", CLOTH="#8d3b2c",
      BLADE="#dfe5ec", BLADE_D="#565d67", GRIP="#2c1d0e";

/* A rendered gladiator. Everything he wears comes from his equipped kit, not his class.
   Weapons hang off a real arm: shoulder -> forearm -> fist -> grip -> guard -> blade,
   so a sword reads as held rather than growing out of him.
   Drawn facing RIGHT (+x is toward the opponent); side B is mirrored by the parent. */
const Fighter = React.memo(function Fighter({ kit, pose, wounds, scars, fallen, dead, foe, fem, col }){
  const K = kit || {};
  const wArt = kitArt(K,"weapon") || "sword";
  const oArt = kitArt(K,"offhand") || "none";
  const hArt = kitArt(K,"helm") || "bare";
  const aArt = kitArt(K,"armor") || "none";
  const dual = wArt==="dual";
  const gilt = aArt==="gilded";
  const hasManica  = aArt==="manica" || aArt==="gilded" || aArt==="padded";
  const hasGreaves = aArt==="greaves" || aArt==="gilded";
  const hasChest   = aArt==="padded" || aArt==="gilded";
  const MET = gilt ? "#d9a842" : BRASS, MET_D = gilt ? "#9c7420" : BRASS_D;
  /* house colours: your men fight in the house's chosen colours (default oxblood),
     the other house in slate blue */
  const PLUME = foe ? "#3f5f74" : (col && col.c1 ? col.c1 : CLOTH);
  const FACE  = gilt ? "#c9992f" : (foe ? "#3a5668" : (col && col.c2 ? col.c2 : "#8e3a2b"));

  const POSES = {
    idle:    { x:0,  y:0,  rot:0,  arm:0,   armRot:0 },
    clash:   { x:10, y:0,  rot:-4, arm:7,   armRot:-8 },
    lunge:   { x:26, y:1,  rot:-9, arm:17,  armRot:-14 },
    recoil:  { x:-13,y:0,  rot:11, arm:-5,  armRot:16 },
    stagger: { x:-9, y:3,  rot:16, arm:-8,  armRot:26 },
    gas:     { x:-4, y:4,  rot:8,  arm:-4,  armRot:20 },
    victor:  { x:6,  y:0,  rot:-2, arm:2,   armRot:-58 },
    fallen:  { x:6,  y:28, rot:76, arm:-6,  armRot:12 },
  };
  const P = POSES[pose] || POSES.idle;
  const striking = pose==="lunge" || pose==="clash";
  const armT = `translate(${P.arm},0) rotate(${P.armRot},58,48)`;
  const offT = `translate(${P.arm*0.35},0)`;

  const helm = ()=>{
    if(hArt==="bare") return (<g>
      <circle cx="56" cy="26" r="11" fill={SKIN}/>
      <path d="M45,23 Q54,10 66,20 Q60,16 54,17 Q48,18 45,23Z" fill="#2a1b0f"/>
      {fem && <path d="M46,24 Q40,30 43,38 Q48,34 48,28Z" fill="#2a1b0f"/>}
      <circle cx="64" cy="27" r="1.7" fill="#2a1b0f"/>
      <path d="M66,30 Q69,32 66,34" stroke={SKIN_D} strokeWidth="1.3" fill="none"/>
    </g>);
    if(hArt==="smooth") return (<g>
      <ellipse cx="56" cy="25" rx="12" ry="14" fill={STEEL}/>
      <path d="M66,20 Q71,25 66,31Z" fill={STEEL_D}/>
      <ellipse cx="56" cy="25" rx="12" ry="14" fill="none" stroke={STEEL_D} strokeWidth="1.4"/>
      <circle cx="64" cy="22" r="2.2" fill="#100b06"/><circle cx="57" cy="22" r="2.2" fill="#100b06"/>
      <path d="M46,31 Q56,37 67,31" stroke={STEEL_D} strokeWidth="1.4" fill="none"/>
    </g>);
    if(hArt==="brim") return (<g>
      <ellipse cx="56" cy="26" rx="12" ry="13" fill={BRASS}/>
      <path d="M56,12 Q62,3 70,2 Q63,9 61,14Z" fill={PLUME}/>
      <rect x="42" y="30" width="32" height="3.4" rx="1.5" fill={BRASS_D}/>
      <rect x="55" y="20" width="12" height="4.8" rx="1.5" fill="#100b06"/>
      <path d="M67,25 L71,27 L67,30Z" fill={BRASS_D}/>
    </g>);
    if(hArt==="griffin") return (<g>
      <ellipse cx="56" cy="26" rx="12" ry="13.5" fill={BRASS}/>
      <path d="M49,13 Q56,0 64,13 Q56,8 49,13Z" fill={PLUME}/>
      <path d="M64,12 Q72,8 73,16" stroke={BRASS_D} strokeWidth="2.4" fill="none"/>
      <rect x="55" y="21" width="12" height="4.8" rx="1.5" fill="#100b06"/>
      <path d="M67,26 L71,28 L67,31Z" fill={BRASS_D}/>
    </g>);
    if(hArt==="silver") return (<g>
      <ellipse cx="56" cy="26" rx="12.5" ry="14" fill="#cfd2d6"/>
      <path d="M47,11 Q56,-4 66,11 Q56,6 47,11Z" fill={PLUME}/>
      <path d="M66,9 Q75,5 77,14" stroke={PLUME} strokeWidth="2.6" fill="none"/>
      <rect x="41" y="31" width="34" height="3.6" rx="1.6" fill="#9aa0a6"/>
      <rect x="55" y="21" width="12" height="5" rx="1.5" fill="#0d0906"/>
      <path d="M67,26 L72,28 L67,32Z" fill="#9aa0a6"/>
      <path d="M45,20 Q56,16 67,20" stroke="#eef1f4" strokeWidth="1.1" fill="none"/>
    </g>);
    return (<g>
      <ellipse cx="56" cy="26" rx="12.5" ry="14" fill={STEEL}/>
      <path d="M48,12 Q56,-2 65,12 Q56,7 48,12Z" fill={PLUME}/>
      <rect x="41" y="31" width="34" height="3.6" rx="1.6" fill={STEEL_D}/>
      <rect x="55" y="21" width="12" height="5" rx="1.5" fill="#100b06"/>
      <path d="M67,26 L72,28 L67,32Z" fill={STEEL_D}/>
    </g>);
  };

  /* shield or net, held in front of the torso */
  const shieldOrNet = ()=>{
    if(dual) return null;
    if(oArt==="scutum") return (<g transform={offT}>
      <rect x="64" y="38" width="21" height="56" rx="5" fill={FACE} stroke={MET_D} strokeWidth="2.2"/>
      <ellipse cx="74.5" cy="66" rx="5" ry="5.4" fill={MET}/>
      <path d="M68,45 L81,45 M68,87 L81,87" stroke={MET} strokeWidth="1.5"/>
    </g>);
    if(oArt==="clipeus") return (<g transform={offT}>
      <circle cx="73" cy="66" r="14" fill={FACE} stroke={MET_D} strokeWidth="2.2"/>
      <circle cx="73" cy="66" r="4.4" fill={MET}/>
    </g>);
    if(oArt==="parmula") return (<g transform={offT}>
      <rect x="64" y="54" width="18" height="23" rx="3" fill={FACE} stroke={MET_D} strokeWidth="2"/>
      <circle cx="73" cy="65.5" r="3.6" fill={MET}/>
    </g>);
    if(oArt==="net") return (<g transform={offT} opacity=".9">
      <path d="M50,54 L60,58 L64,66 L56,68Z" fill={SKIN}/>
      <circle cx="67" cy="66" r="4.4" fill={SKIN_D}/>
      <path d="M70,64 L92,72 L82,90 L66,81Z" fill="none" stroke="#9c8560" strokeWidth="1.4"/>
      <path d="M74,66 L78,85 M82,69 L86,87 M68,72 L90,80" stroke="#9c8560" strokeWidth=".9"/>
    </g>);
    return null;
  };

  /* the off hand of a dual wielder: its own arm, fist and blade angled low */
  const offBlade = ()=> dual ? (
    <g transform={`${offT} rotate(20,56,56)`}>
      <path d="M52,48 L61,52 L63,60 L54,58Z" fill={SKIN}/>
      <path d="M58,54 L69,58 L67,66 L56,62Z" fill={SKIN}/>
      {hasManica && <rect x="57" y="54" width="13" height="10" rx="3" fill={LEATHER} transform="rotate(16,63,59)"/>}
      <circle cx="72" cy="63" r="4.4" fill={SKIN_D}/>
      <rect x="74.5" y="57.5" width="2.6" height="11" rx="1.1" fill={BLADE_D}/>
      <path d="M77,60.5 L98,62 L103,63.5 L98,65 L77,66.5Z" fill={BLADE} stroke={BLADE_D} strokeWidth=".9"/>
    </g>
  ) : null;

  /* main arm: shoulder, forearm, fist, then whatever he grips */
  const mainArm = ()=>{
    const grip = (()=>{
      if(wArt==="spear") return (<g>
        <rect x="58" y="46.4" width="62" height="3.8" rx="1.9" fill="#6b4a22" stroke="#4a3216" strokeWidth=".6"/>
        <rect x="116" y="45" width="5" height="6.6" rx="1.4" fill={BLADE_D}/>
        <path d="M120,43.2 L137,48.3 L120,53.4Z" fill={BLADE} stroke={BLADE_D} strokeWidth=".8"/>
      </g>);
      if(wArt==="trident") return (<g>
        <rect x="56" y="46.4" width="52" height="4" rx="2" fill="#6b4a22" stroke="#4a3216" strokeWidth=".6"/>
        <rect x="106" y="38" width="3.6" height="22" rx="1.5" fill={BLADE} stroke={BLADE_D} strokeWidth=".6"/>
        <path d="M109,40 L122,40 M109,48.4 L122,48.4 M109,57 L122,57" stroke={BLADE} strokeWidth="3" strokeLinecap="butt"/>
        <path d="M121,38 L129,40 L121,42Z M121,46.4 L129,48.4 L121,50.4Z M121,55 L129,57 L121,59Z" fill={BLADE} stroke={BLADE_D} strokeWidth=".5"/>
      </g>);
      if(wArt==="curved") return (<g>
        <rect x="74.5" y="41.5" width="2.6" height="13" rx="1.1" fill={BLADE_D}/>
        <path d="M77,45 Q97,36 108,51 Q99,44 77,50Z" fill={BLADE} stroke={BLADE_D} strokeWidth=".9"/>
      </g>);
      if(wArt==="axe") return (<g>
        <rect x="58" y="46" width="42" height="4.2" rx="1.9" fill="#6b4a22" stroke="#4a3216" strokeWidth=".6"/>
        <path d="M94,48 Q106,32 115,41 Q108,48 115,56 Q106,64 94,49Z" fill={BLADE} stroke={BLADE_D} strokeWidth="1"/>
      </g>);
      if(wArt==="dagger") return (<g>
        <rect x="74.5" y="43" width="2.4" height="10" rx="1" fill={BLADE_D}/>
        <path d="M77,45.5 L90,47 L95,48.2 L90,49.4 L77,51Z" fill={BLADE} stroke={BLADE_D} strokeWidth=".8"/>
      </g>);
      return (<g>
        <rect x="74.5" y="41.5" width="2.6" height="13" rx="1.1" fill={BLADE_D}/>
        <path d="M77,45 L102,46.4 L108,48.2 L102,50 L77,51.4Z" fill={BLADE} stroke={BLADE_D} strokeWidth=".9"/>
      </g>);
    })();
    return (
      <g transform={armT}>
        <path d="M54,41 L63,43 L66,51 L57,53Z" fill={SKIN}/>
        <path d="M60,45 L72,47 L72,55 L60,54Z" fill={SKIN}/>
        {hasManica && <rect x="58" y="44.5" width="15" height="10.5" rx="3.5" fill={LEATHER}/>}
        <circle cx="74" cy="49.5" r="4.8" fill={SKIN_D}/>
        <rect x="71.5" y="46" width="5" height="7" rx="2" fill={GRIP}/>
        {grip}
      </g>
    );
  };

  return (
    <svg width="118" height="146" viewBox="0 0 128 146" style={{ overflow:"visible",
      opacity: dead?0.85:1, filter: dead? "grayscale(.55) brightness(.68)":"none",
      transform:`translate(${P.x}px,${P.y}px) rotate(${P.rot}deg)`,
      transition:"transform .24s cubic-bezier(.34,1.45,.5,1), filter .5s, opacity .5s",
      transformOrigin:"56px 134px" }}>
      <ellipse cx="58" cy="135" rx={fallen||dead?30:17} ry="4" fill="rgba(28,16,8,.34)"/>
      {striking && <path d="M78,32 Q114,52 82,84" stroke="rgba(255,240,208,.17)" strokeWidth={pose==="lunge"?4.5:2.5} strokeLinecap="round" fill="none"/>}
      <path d="M44,84 L54,84 L57,130 L45,130Z" fill={SKIN_D}/>
      {hasGreaves && <rect x="43" y="112" width="14" height="12" rx="2.5" fill={MET_D}/>}
      <path d="M44,128 L58,128 L61,134 L43,134Z" fill={LEATHER_D}/>
      <path d="M54,82 L65,82 L68,130 L56,130Z" fill={SKIN}/>
      {hasGreaves && <rect x="55" y="110" width="14" height="13" rx="2.5" fill={MET}/>}
      <path d="M55,128 L71,128 L74,134 L54,134Z" fill={LEATHER}/>
      {fem ? (<g>
        <path d="M47,41 Q56,37 66,41 L63,80 Q56,84 49,80Z" fill={SKIN}/>
        <path d="M63,43 L60,79 Q56,82 52,80" stroke={SKIN_D} strokeWidth="1" fill="none" opacity=".5"/>
        <rect x="46" y="48" width="21" height="7.5" rx="3" fill={LEATHER} stroke={LEATHER_D} strokeWidth=".8"/>
        <path d="M50,64 Q56,66 62,64" stroke={SKIN_D} strokeWidth=".9" fill="none" opacity=".45"/>
      </g>) : (<g>
        <path d="M45,40 Q56,36 67,40 L64,80 Q56,84 48,80Z" fill={SKIN}/>
        <path d="M64,42 L61,79 Q56,82 51,80" stroke={SKIN_D} strokeWidth="1.1" fill="none" opacity=".55"/>
        <path d="M47,52 Q56,57 65,52" stroke={SKIN_D} strokeWidth="1.2" fill="none"/>
        <path d="M50,62 Q56,64 62,62 M50,69 Q56,71 62,69" stroke={SKIN_D} strokeWidth=".9" fill="none" opacity=".5"/>
      </g>)}
      {hasChest && (<g>
        <path d="M45,41 Q56,37 67,41 L65,68 Q56,72 47,68Z" fill={gilt? "#c99a3c":"#6d5738"} stroke={gilt? "#8a6520":"#4d3d26"} strokeWidth="1.2"/>
        {gilt && <path d="M50,47 Q56,51 62,47 M50,57 Q56,61 62,57" stroke="#8a6520" strokeWidth="1" fill="none"/>}
      </g>)}
      {gilt && <ellipse cx="64" cy="42" rx="8" ry="5" fill="#d9a842" stroke="#8a6520" strokeWidth="1"/>}
      <path d="M46,76 L66,76 L69,95 Q56,99 43,95Z" fill={LEATHER}/>
      <rect x="43" y="72" width="26" height="6" rx="2" fill={gilt? "#a8801f":LEATHER_D}/>
      {shieldOrNet()}
      {offBlade()}
      {mainArm()}
      {helm()}
      {(scars||[]).map((s,i)=>(
        <path key={`s${i}`} d={`M${s.x-4},${s.y+3} L${s.x+4},${s.y-3}`} stroke="#7d4a3c" strokeWidth={s.big?2.6:1.7} strokeLinecap="round" opacity=".8"/>
      ))}
      {wounds.map((w,i)=>(
        <path key={i} d={`M${w.x-4},${w.y-3} L${w.x+4},${w.y+3}`} stroke="#8f1a12" strokeWidth={w.big?3.2:2} strokeLinecap="round" opacity=".92"/>
      ))}
      {dead && <ellipse cx="58" cy="136" rx="26" ry="4.5" fill="rgba(126,20,12,.5)"/>}
    </svg>
  );
});

/* ---- HOUSE IDENTITY ---- the colours a house fights in, its crest and its motto */
const HOUSE_COLOURS = [
  ["#8d3b2c","Oxblood"], ["#7c2a22","Blood"], ["#b0603a","Terracotta"], ["#c99a4b","Gold"],
  ["#8a6a2c","Ochre"], ["#6d5426","Bronze"], ["#2f5e4a","Legion green"], ["#3f5f74","Slate"],
  ["#3a5668","Deep blue"], ["#5c4a6b","Imperial purple"], ["#6b1f2a","Wine"], ["#4a4a52","Iron"],
  ["#c0c0c8","Silver"], ["#2c2c30","Black"],
];
const CREST_SYMS = ["gladius","laurel","star","trident","bars","chevron"];
const HOUSE_MOTTOS = [
  "Blood buys bread", "We do not kneel", "The sand remembers", "Bought, not broken",
  "Steel and patience", "No man dies cheap", "The wall that advances", "Every name is earned",
  "First on the sand", "What the crowd wants", "We were slaves once", "Made in Capua",
];
function Crest({ crest, size=22 }){
  const c1 = (crest && crest.c1) || "#8d3b2c";
  const c2 = (crest && crest.c2) || "#c99a4b";
  const sym = (crest && crest.sym) || "gladius";
  const SYM = {
    gladius: <g stroke={c2} strokeWidth="3.2" fill={c2} strokeLinecap="round">
      <line x1="50" y1="28" x2="50" y2="70"/><line x1="39" y1="37" x2="61" y2="37"/><circle cx="50" cy="75" r="3.4"/></g>,
    laurel: <g stroke={c2} strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M50,78 Q33,62 36,36"/><path d="M50,78 Q67,62 64,36"/>
      <path d="M39,46 l-6,-4 M39,57 l-7,-3 M61,46 l6,-4 M61,57 l7,-3"/></g>,
    star: <path d="M50,28 L57,46 L76,46 L60,58 L66,76 L50,64 L34,76 L40,58 L24,46 L43,46 Z" fill={c2}/>,
    trident: <g stroke={c2} strokeWidth="3.2" fill="none" strokeLinecap="round">
      <line x1="50" y1="36" x2="50" y2="76"/><path d="M37,36 L37,50 M63,36 L63,50 M37,36 Q50,26 63,36"/></g>,
    bars: <g fill={c2}><rect x="28" y="34" width="44" height="7" rx="2.5"/><rect x="28" y="50" width="44" height="7" rx="2.5"/><rect x="28" y="66" width="44" height="7" rx="2.5"/></g>,
    chevron: <path d="M28,70 L50,40 L72,70 L62,70 L50,54 L38,70 Z" fill={c2}/>,
  };
  return (
    <svg width={size} height={Math.round(size*1.14)} viewBox="0 0 100 114" aria-hidden="true" style={{flexShrink:0,display:"block"}}>
      <path d="M50,4 L92,16 V56 Q92,92 50,110 Q8,92 8,56 V16 Z" fill={c1} stroke="#160f09" strokeWidth="4"/>
      <path d="M50,10 L86,20 V55 Q86,87 50,103 Q14,87 14,55 V20 Z" fill="none" stroke={c2} strokeWidth="1.6" opacity=".55"/>
      {SYM[sym] || SYM.gladius}
    </svg>
  );
}

/* A beast for the morning hunt. One quadruped, six sets of bones.
   Drawn facing RIGHT like the fighter; the arena mirrors it. */
function Beast({ art, pose, wounds, dead }){
  const A = {
    wolf: { len:78, ht:34, leg:30, coat:"#6e6152", dark:"#4b4139", head:"lean", tail:"brush", ear:"prick" },
    boar: { len:74, ht:38, leg:22, coat:"#4e4036", dark:"#332a22", head:"snout", tail:"tuft",  ear:"small", tusk:true, hump:true },
    cat:  { len:84, ht:33, leg:32, coat:"#c2963f", dark:"#8a6a24", head:"round", tail:"long",  ear:"round", spots:true },
    bear: { len:80, ht:48, leg:28, coat:"#4a3a2c", dark:"#31261c", head:"round", tail:"tuft",  ear:"round", hump:true, bulk:true },
    bull: { len:96, ht:50, leg:34, coat:"#2f2822", dark:"#1d1815", head:"blunt", tail:"long",  ear:"small", horns:true, hump:true },
    lion: { len:88, ht:38, leg:32, coat:"#b98a44", dark:"#8a6224", head:"round", tail:"long",  ear:"round", mane:true },
  }[art] || {};
  const P = { idle:{x:0,rot:0}, lunge:{x:22,rot:-5}, recoil:{x:-12,rot:6}, dead:{x:0,rot:0} }[pose] || {x:0,rot:0};
  const bodyY = 96 - A.ht;
  const noseX = 34 + A.len;
  return (
    <svg width="150" height="146" viewBox="0 0 160 146" style={{ overflow:"visible",
      opacity: dead?0.85:1, filter: dead? "grayscale(.5) brightness(.65)":"none",
      transform: dead ? "translate(6px,26px) rotate(14deg)" : `translate(${P.x}px,0) rotate(${P.rot}deg)`,
      transition:"transform .24s cubic-bezier(.34,1.4,.5,1), filter .5s", transformOrigin:"80px 130px" }}>
      <ellipse cx="80" cy="132" rx={dead?46:34} ry="4.5" fill="rgba(28,16,8,.34)"/>
      {/* rear legs */}
      <path d={`M42,${bodyY+A.ht-4} L54,${bodyY+A.ht-4} L56,128 L44,128Z`} fill={A.dark}/>
      <path d={`M52,${bodyY+A.ht-4} L64,${bodyY+A.ht-4} L65,128 L54,128Z`} fill={A.dark}/>
      {/* body */}
      <path d={`M34,${bodyY+A.ht} Q30,${bodyY+6} 46,${bodyY+2}
        Q${A.hump?70:64},${bodyY-(A.hump?9:2)} ${noseX-16},${bodyY+4}
        Q${noseX+2},${bodyY+10} ${noseX-6},${bodyY+A.ht-6}
        Q60,${bodyY+A.ht+6} 34,${bodyY+A.ht}Z`} fill={A.coat}/>
      {A.bulk && <ellipse cx="62" cy={bodyY+14} rx="26" ry="13" fill={A.coat}/>}
      {A.spots && <g fill={A.dark} opacity=".65">
        <circle cx="52" cy={bodyY+12} r="3"/><circle cx="64" cy={bodyY+9} r="2.6"/><circle cx="74" cy={bodyY+14} r="3"/>
        <circle cx="58" cy={bodyY+22} r="2.4"/><circle cx="70" cy={bodyY+24} r="2.8"/><circle cx="84" cy={bodyY+18} r="2.4"/>
      </g>}
      {/* front legs */}
      <path d={`M${noseX-26},${bodyY+A.ht-6} L${noseX-14},${bodyY+A.ht-6} L${noseX-13},128 L${noseX-25},128Z`} fill={A.coat}/>
      <path d={`M${noseX-20},${bodyY+A.ht-6} L${noseX-8},${bodyY+A.ht-6} L${noseX-6},128 L${noseX-18},128Z`} fill={A.dark}/>
      {/* tail */}
      {A.tail==="long" && <path d={`M34,${bodyY+8} Q10,${bodyY+2} 14,${bodyY+30}`} stroke={A.coat} strokeWidth="5" fill="none" strokeLinecap="round"/>}
      {A.tail==="brush" && <path d={`M34,${bodyY+10} Q14,${bodyY+16} 12,${bodyY+34}`} stroke={A.coat} strokeWidth="8" fill="none" strokeLinecap="round"/>}
      {A.tail==="tuft" && <path d={`M34,${bodyY+10} Q24,${bodyY+10} 22,${bodyY+18}`} stroke={A.coat} strokeWidth="6" fill="none" strokeLinecap="round"/>}
      {/* mane */}
      {A.mane && <circle cx={noseX-16} cy={bodyY+12} r="20" fill={A.dark}/>}
      {/* head */}
      <g>
        {A.head==="lean" && <path d={`M${noseX-20},${bodyY+2} L${noseX+12},${bodyY+10} L${noseX+12},${bodyY+18} L${noseX-18},${bodyY+20}Z`} fill={A.coat}/>}
        {A.head==="snout" && <path d={`M${noseX-22},${bodyY+2} L${noseX+10},${bodyY+12} L${noseX+10},${bodyY+20} L${noseX-20},${bodyY+24}Z`} fill={A.coat}/>}
        {A.head==="blunt" && <rect x={noseX-20} y={bodyY+2} width="30" height="22" rx="7" fill={A.coat}/>}
        {(A.head==="round"||!A.head) && <ellipse cx={noseX-4} cy={bodyY+12} rx="16" ry="13" fill={A.coat}/>}
        {/* eye */}
        <circle cx={noseX-2} cy={bodyY+8} r="2" fill="#120c07"/>
        {/* ears */}
        {A.ear==="prick" && <path d={`M${noseX-16},${bodyY+1} L${noseX-11},${bodyY-9} L${noseX-6},${bodyY+2}Z`} fill={A.dark}/>}
        {A.ear==="round" && <circle cx={noseX-14} cy={bodyY+1} r="4.5" fill={A.dark}/>}
        {A.ear==="small" && <ellipse cx={noseX-15} cy={bodyY+4} rx="4" ry="3" fill={A.dark}/>}
        {A.tusk && <g><path d={`M${noseX+8},${bodyY+18} Q${noseX+16},${bodyY+14} ${noseX+13},${bodyY+7}`} stroke="#e6ded0" strokeWidth="3" fill="none" strokeLinecap="round"/></g>}
        {A.horns && <g stroke="#ded4c2" strokeWidth="4.5" fill="none" strokeLinecap="round">
          <path d={`M${noseX-16},${bodyY+2} Q${noseX-24},${bodyY-14} ${noseX-6},${bodyY-12}`}/>
          <path d={`M${noseX+4},${bodyY+2} Q${noseX+14},${bodyY-14} ${noseX+2},${bodyY-16}`}/>
        </g>}
        {/* jaws */}
        <path d={`M${noseX+2},${bodyY+16} L${noseX+12},${bodyY+15} L${noseX+11},${bodyY+19} L${noseX+2},${bodyY+19}Z`} fill="#2a1410"/>
      </g>
      {(wounds||[]).map((w,i)=>(
        <path key={i} d={`M${44+i*14},${bodyY+10+ (i%2)*10} l8,7`} stroke="#8f1a12" strokeWidth={w.big?3.2:2} strokeLinecap="round" opacity=".9"/>
      ))}
      {dead && <ellipse cx="80" cy="133" rx="40" ry="5" fill="rgba(126,20,12,.5)"/>}
    </svg>
  );
}

/* ---- SOUND ----
   Synthesised in the browser, so the standalone file stays one file. Nothing is
   created until the player's first tap, because browsers will not allow it before. */
const SFX = (()=>{
  let ctx = null, master = null, muted = false, crowdNode = null;
  let room = null, dry = null, wet = null, weather = null;
  /* the venue is a room, and a room is a convolution plus how much of it you hear */
  const ROOMS = {
    pit:      { size:0.16, mix:0.05, tone:2600, size2:0.34 },   // packed earth, no walls
    field:    { size:0.10, mix:0.02, tone:3000, size2:0.30 },   // outdoors, nothing to bounce off
    forum:    { size:0.34, mix:0.12, tone:2400, size2:0.55 },   // boards and buildings
    yard:     { size:0.55, mix:0.30, tone:3400, size2:0.75 },   // marble, and forty people
    amphi:    { size:1.10, mix:0.26, tone:1900, size2:1.00 },   // stone tiers
    bowl:     { size:1.25, mix:0.30, tone:1750, size2:1.00 },
    greek:    { size:0.95, mix:0.34, tone:2500, size2:0.90 },   // built to carry a voice
    harbour:  { size:0.40, mix:0.10, tone:2200, size2:0.60 },
    imperial: { size:1.60, mix:0.32, tone:1600, size2:1.00 },   // the largest room in the world
  };
  const ready = ()=>{
    if(ctx) return ctx;
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    }catch(e){ ctx = null; }
    return ctx;
  };
  const noiseBuf = (c, secs)=>{
    const n = Math.floor(c.sampleRate*secs), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for(let i=0;i<n;i++) d[i] = Math.random()*2-1;
    return b;
  };
  const burst = (freq, q, dur, vol, type)=>{
    const c = ready(); if(!c || muted) return;
    const s = c.createBufferSource(); s.buffer = noiseBuf(c, dur);
    const f = c.createBiquadFilter(); f.type = type||"bandpass"; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+dur);
    s.connect(f); f.connect(g); g.connect(master);
    if(room && room.cv) { try{ g.connect(room.cv); }catch(e){} }
    s.start();
  };
  const tone = (f0, f1, dur, vol, type)=>{
    const c = ready(); if(!c || muted) return;
    const o = c.createOscillator(); o.type = type||"sine";
    o.frequency.setValueAtTime(f0, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,f1), c.currentTime+dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+dur);
    o.connect(g); g.connect(master);
    if(room && room.cv) { try{ g.connect(room.cv); }catch(e){} }
    o.start(); o.stop(c.currentTime+dur+0.02);
  };
  /* an impulse response, decaying noise, cheap and convincing enough */
  const impulse = (c, secs, decay)=>{
    const n = Math.max(1, Math.floor(c.sampleRate*secs));
    const b = c.createBuffer(2, n, c.sampleRate);
    for(let ch=0; ch<2; ch++){
      const d2 = b.getChannelData(ch);
      for(let i=0;i<n;i++) d2[i] = (Math.random()*2-1) * Math.pow(1 - i/n, decay);
    }
    return b;
  };
  const buildRoom = (c)=>{
    if(room) return room;
    dry = c.createGain(); dry.gain.value = 1; dry.connect(master);
    const cv = c.createConvolver();
    wet = c.createGain(); wet.gain.value = 0;
    const damp = c.createBiquadFilter(); damp.type = "lowpass"; damp.frequency.value = 2400;
    cv.connect(damp); damp.connect(wet); wet.connect(master);
    room = { cv, damp, set:false };
    return room;
  };
  /* everything an event plays goes through here */
  const out = ()=>{ const c = ready(); if(!c) return master;
    buildRoom(c); return dry; };
  return {
    set mute(v){ muted = !!v;
      if(muted && crowdNode){ try{ crowdNode.g.gain.value = 0; }catch(e){} }
      if(muted && weather){ try{ weather.g.gain.value = 0; }catch(e){} } },
    get mute(){ return muted; },
    tap(){ burst(1800, 1, 0.03, 0.10, "highpass"); },
    clash(){ burst(3200, 6, 0.10, 0.22); burst(5200, 9, 0.06, 0.14); },
    graze(){ burst(2400, 4, 0.07, 0.14); },
    hit(){ burst(1400, 2, 0.10, 0.20); tone(150, 70, 0.14, 0.22); },
    crit(){ burst(900, 1.4, 0.18, 0.26); tone(110, 42, 0.34, 0.32); },
    fall(){ tone(90, 38, 0.45, 0.30); burst(600, 1, 0.20, 0.14, "lowpass"); },
    death(){ tone(140, 46, 0.85, 0.30); setTimeout(()=>tone(70, 34, 0.7, 0.20), 120); },
    spared(){ tone(330, 494, 0.30, 0.16, "triangle"); setTimeout(()=>tone(494, 660, 0.35, 0.13, "triangle"), 130); },
    horn(){ tone(196, 196, 0.55, 0.16, "sawtooth"); setTimeout(()=>tone(294, 294, 0.45, 0.11, "sawtooth"), 90); },
    /* the crowd is a bed, not an event */
    crowd(level){
      const c = ready(); if(!c) return;
      if(!crowdNode){
        const s = c.createBufferSource(); s.buffer = noiseBuf(c, 2); s.loop = true;
        const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
        const g = c.createGain(); g.gain.value = 0;
        s.connect(f); f.connect(g); g.connect(master); s.start();
        crowdNode = { s, f, g };
      }
      const target = muted ? 0 : Math.max(0, (level-25)/100) * 0.16 * (this._size==null?1:this._size);
      try{
        crowdNode.g.gain.setTargetAtTime(target, c.currentTime, 0.4);
        crowdNode.f.frequency.setTargetAtTime(500 + level*7, c.currentTime, 0.5);
      }catch(e){}
    },
    stopCrowd(){ if(crowdNode){ try{ crowdNode.g.gain.setTargetAtTime(0, ready().currentTime, 0.25); }catch(e){} } },
    /* where we are, and what the sky is doing */
    place(venue, sky){
      const c = ready(); if(!c) return;
      buildRoom(c);
      const R2 = ROOMS[venue] || ROOMS.forum;
      try{
        room.cv.buffer = impulse(c, Math.max(0.08, R2.size), 2.2 + R2.size);
        room.damp.frequency.setTargetAtTime(R2.tone, c.currentTime, 0.2);
        wet.gain.setTargetAtTime(muted ? 0 : R2.mix, c.currentTime, 0.3);
      }catch(e){}
      this._size = R2.size2;
      this.rain(sky);
    },
    /* rain on the sand, wind in the awnings */
    rain(sky){
      const c = ready(); if(!c) return;
      if(!weather){
        const s = c.createBufferSource(); s.buffer = noiseBuf(c, 3); s.loop = true;
        const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = 0.4;
        const g = c.createGain(); g.gain.value = 0;
        s.connect(f); f.connect(g); g.connect(master); s.start();
        weather = { s, f, g };
      }
      const on = { rain:[0.055, 2400, 0.5], wind:[0.040, 700, 0.7], cold:[0.014, 900, 0.6] }[sky];
      try{
        weather.g.gain.setTargetAtTime(muted || !on ? 0 : on[0], c.currentTime, 0.6);
        if(on){ weather.f.frequency.setTargetAtTime(on[1], c.currentTime, 0.6);
                weather.f.Q.setTargetAtTime(on[2], c.currentTime, 0.6); }
      }catch(e){}
    },
    stopWeather(){ if(weather){ try{ weather.g.gain.setTargetAtTime(0, ready().currentTime, 0.3); }catch(e){} } },
  };
})();
const BEAT_SFX = { clash:"clash", graze:"graze", hit:"hit", crit:"crit", fall:"fall",
  death:"death", spared:"spared", salute:"horn", end:"horn" };

/* the stands are four constituencies and they do not sit together */
const FAC_TINT = { parm:"#7d6a9c", scut:"#8a6a3c", mob:"#8c4438", front:"#5c6f4a" };
/* ---- THE PLAN OF THE HOUSE ----
   A ludus was a square of cells around a yard. The game's subject has been pure
   abstraction for ninety versions. This is the place, drawn, changing as it is
   built, with the men standing in it. */
function LudusPlan({ S }){
  const B = k => bLevel(S, k);
  const has = k => workDone(S, k);
  const men = activeG(S);
  const hurt = S.gladiators.filter(g=>g.status==="injured").length;
  const W = 300, H = 226;
  const stone = "#4a3c28", lit = "#6d5531", dim = "#2b2318", floor = "#3a2f1e";
  /* a room's fill deepens with its level */
  const lvl = (k, base) => { const n = B(k); return n===0 ? dim : n===1 ? "#3c3120" : n===2 ? "#4e3f27" : base; };
  const label = (x, y, t, on) => (
    <text x={x} y={y} fontSize="7.2" fill={on ? "#c9b489" : "#8f7e62"}
      fontFamily="Cormorant Garamond, Georgia, serif" textAnchor="middle" letterSpacing="0.4">{t}</text>
  );
  /* men stand about the yard */
  const spots = [[118,120],[150,112],[178,126],[132,142],[164,146],[106,138],[190,110],[146,130]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`A plan of the ludus. ${BKEYS.reduce((n,k)=>n+B(k),0)} of 15 wings built, ${men.length} men in the yard${hurt?`, ${hurt} in the infirmary`:""}.`}
      style={{display:"block",borderRadius:8,background:"#1a1510"}}>
      <defs>
        <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b5533"/><stop offset="100%" stopColor="#8a6d40"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="#1a1510"/>
      {/* the outer wall */}
      <rect x="10" y="10" width={W-20} height={H-20} rx="3" fill={floor} stroke={stone} strokeWidth="2.5"/>
      {/* the yard */}
      <rect x="86" y="70" width="128" height="96" rx="2" fill="url(#sand)" opacity="0.85"/>
      {has("spina") && <rect x="132" y="102" width="36" height="32" rx="3" fill="#5a4a30" stroke="#7d6640" strokeWidth="1"/>}
      {label(150, 62, "THE YARD", true)}

      {/* cells along the north — carceres */}
      {[0,1,2,3,4,5].map(i=>(
        <rect key={i} x={30+i*40} y="22" width="34" height="34" rx="1.5"
          fill={lvl("carceres", lit)} stroke={stone} strokeWidth="1"/>
      ))}
      {label(150, 17, `CARCERES ${B("carceres")||""}`, B("carceres")>0)}

      {/* palus posts down the west side */}
      <rect x="22" y="70" width="56" height="96" rx="2" fill={lvl("palus", lit)} stroke={stone} strokeWidth="1"/>
      {[0,1,2].map(i=>(
        <g key={i}>
          <rect x={46} y={82+i*30} width="7" height="18" rx="2" fill={B("palus")>i ? "#8a6d40" : "#3a3020"}/>
        </g>
      ))}
      {label(50, 176, `PALUS ${B("palus")||""}`, B("palus")>0)}

      {/* armoury and infirmary down the east */}
      <rect x="222" y="70" width="56" height="44" rx="2" fill={lvl("armamentarium", lit)} stroke={stone} strokeWidth="1"/>
      {[0,1,2].map(i=>(
        <rect key={i} x={234+i*13} y="82" width="3" height="20" fill={B("armamentarium")>i ? "#c9b489" : "#3a3020"}/>
      ))}
      {label(250, 124, `ARMOURY ${B("armamentarium")||""}`, B("armamentarium")>0)}

      <rect x="222" y="122" width="56" height="44" rx="2" fill={lvl("valetudinarium", lit)} stroke={stone} strokeWidth="1"/>
      {[0,1,2].map(i=>(
        <rect key={i} x={232} y={130+i*11} width="36" height="6" rx="1.5"
          fill={i < hurt ? "#7c2a22" : (B("valetudinarium")>i ? "#5a4a30" : "#3a3020")}/>
      ))}
      {label(250, 176, `INFIRMARY ${B("valetudinarium")||""}`, B("valetudinarium")>0)}

      {/* baths along the south */}
      <rect x="86" y="180" width={has("baths") ? 128 : 74} height="26" rx="2"
        fill={lvl("balneae", lit)} stroke={stone} strokeWidth="1"/>
      {B("balneae")>0 && <ellipse cx={has("baths")?150:123} cy="193" rx={has("baths")?42:22} ry="8" fill="#3d5560" opacity="0.7"/>}
      {label(has("baths")?150:123, 197, `BALNEAE ${B("balneae")||""}`, B("balneae")>0)}

      {/* the great works stand where they were built */}
      {has("chapel") && (<g>
        <rect x="22" y="22" width="34" height="34" rx="1.5" fill="#3f3a2a" stroke="#8a9a5b" strokeWidth="1.2"/>
        <path d="M 32 46 L 39 30 L 46 46 Z" fill="#8a9a5b" opacity="0.8"/>
      </g>)}
      {has("school") && (<g>
        <rect x="244" y="22" width="34" height="34" rx="1.5" fill="#3f3629" stroke="#c99a4b" strokeWidth="1.2"/>
        {[0,1,2].map(i=><rect key={i} x={250+i*9} y="30" width="4" height="18" fill="#c99a4b" opacity="0.75"/>)}
      </g>)}
      {has("tomb") && (<g>
        <rect x="238" y="186" width="42" height="22" rx="1.5" fill="#332b20" stroke="#b09b7d" strokeWidth="1.2"/>
        <rect x="256" y="190" width="6" height="14" fill="#b09b7d" opacity="0.7"/>
      </g>)}

      {/* the gate */}
      <rect x="130" y={H-14} width="40" height="8" rx="1" fill="#2a2318" stroke={stone} strokeWidth="1.5"/>

      {/* and the men, standing about in it */}
      {men.slice(0,8).map((g,i)=>{
        const [x,y] = spots[i] || spots[0];
        const c = refusing(g) ? "#d96f5d" : g.learning ? "#d8ac5f" : lastingOf(g).length ? "#a8563f" : "#e8d9b8";
        return (
          <g key={g.id} opacity="0.95">
            <circle cx={x} cy={y-5} r="2.6" fill={c}/>
            <rect x={x-1.6} y={y-2} width="3.2" height="7.5" rx="1.4" fill={c}/>
          </g>
        );
      })}
      {hurt>0 && <text x={250} y="166" fontSize="6.5" fill="#d96f5d" textAnchor="middle"
        fontFamily="Cormorant Garamond, Georgia, serif">{hurt} on the tables</text>}
    </svg>
  );
}

const CrowdRow = React.memo(function CrowdRow({ level, factions, venue }){
  const V = VEN(venue||"forum");
  const heads = V.crowd <= -16 ? 14 : V.crowd <= -9 ? 20 : 30;
  const dur = 2.4 - (level/100)*1.5;
  const bright = 0.25 + (level/100)*0.75;
  /* each block of seats is a faction, warmer ones lit brighter */
  const blocks = FAC_KEYS.map(k=>({ k, v: factions ? (factions[k]==null?40:factions[k]) : 40 }));
  return (
    <div className="crowdrow" aria-hidden="true">
      {Array.from({length:heads}).map((_,i)=>{
        const b = blocks[Math.floor(i / (heads/blocks.length)) % blocks.length];
        const warm = 0.45 + (b.v/100)*0.75;
        return (
          <div key={i} className="chead" style={{
            height: 11 + (i%4)*2.5,
            background: FAC_TINT[b.k],
            opacity: Math.min(1, bright * warm * (0.5 + (i%3)*0.22)),
            animation:`bob ${(dur/(0.75+b.v/200)).toFixed(2)}s ease-in-out ${(i%7)*0.13}s infinite`
          }}/>
        );
      })}
    </div>
  );
}, (a,b)=> Math.round(a.level/8)===Math.round(b.level/8) && a.venue===b.venue && a.factions===b.factions);

function HPBar({ label, v, s, cls, flip }){
  return (
    <div style={{flex:1, textAlign: flip?"right":"left", minWidth:0}}>
      <div className="disp" style={{fontSize:11, letterSpacing:".07em", color:"#e0bd72", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{label}</div>
      <div className="dim" style={{fontSize:11, marginBottom:3}}>{cls}</div>
      <div className="track" style={{height:6}} role="progressbar" aria-label={`${label} health`}
        aria-valuenow={Math.round(clamp((v-20)/80*100,0,100))} aria-valuemin={0} aria-valuemax={100}>
        <div className="fill" style={{width:`${clamp((v-20)/80*100,0,100)}%`, marginLeft: flip? "auto":0,
          background: v>60? "linear-gradient(90deg,#6a7a3a,#9aa86a)" : v>35? "linear-gradient(90deg,#8a6a2c,#d8ac5f)" : "linear-gradient(90deg,#7c2a22,#cf5a49)"}}/>
      </div>
      <div className="track" style={{height:3, marginTop:2, opacity:.75}}>
        <div className="fill" style={{width:`${clamp(s,0,100)}%`, marginLeft: flip? "auto":0, background:"#5e7f8a"}}/>
      </div>
    </div>
  );
}

function FightModal({ fight, onClose, startMuted, onMute, onSpeak, houseCol }){
  const [muted,setMuted] = useState(!!startMuted);
  useEffect(()=>{ SFX.mute = !!startMuted; }, [startMuted]);
  useEffect(()=>{ SFX.place(fight.venue || "forum", fight.sky); }, [fight.venue, fight.sky]);
  useEffect(()=>()=>{ SFX.stopCrowd(); SFX.stopWeather(); }, []);
  const [i,setI] = useState(0);
  const [playing,setPlaying] = useState(true);
  const [speed,setSpeed] = useState(1);
  const [spurts,setSpurts] = useState([]);
  const [shaking,setShaking] = useState(false);
  const beats = fight.beats;
  const done = i >= beats.length-1;
  const b = beats[Math.min(i, beats.length-1)];
  const sidRef = useRef(0);

  useEffect(()=>{
    if(!playing || done) return;
    const kind = beats[i].kind;
    const base = kind==="crit"||kind==="fall"||kind==="death"||kind==="appeal" ? 1150
      : kind==="intro"||kind==="salute" ? 900 : kind==="hit" ? 780 : 640;
    const t = setTimeout(()=>setI(v=>v+1), base/speed);
    return ()=>clearTimeout(t);
  },[i, playing, done, speed, beats]);

  useEffect(()=>{
    const bt = beats[i]; if(!bt) return;
    const s = BEAT_SFX[bt.kind];
    if(s && SFX[s]) SFX[s]();
    SFX.crowd(bt.crowd);
    if(bt.kind==="crit"||bt.kind==="hit"||bt.kind==="graze"||bt.kind==="death"){
      const n = bt.kind==="crit"? 9 : bt.kind==="hit"? 6 : 3;
      const side = bt.actor==="A" ? "B" : "A";
      const id = ++sidRef.current;
      const drops = Array.from({length:n}).map((_,k)=>({
        k, dx:(side==="B"?1:-1)*(8+Math.random()*30), dy:-6+Math.random()*34
      }));
      setSpurts(s=>[...s, {id, side, drops, y:bt.ty||60}]);
      setTimeout(()=>setSpurts(s=>s.filter(x=>x.id!==id)), 760);
      if(bt.kind==="crit"||bt.kind==="death"){ setShaking(true); setTimeout(()=>setShaking(false), 320); }
    }
  },[i, beats]);

  const woundsFor = side => beats.slice(0,i+1)
    .filter(x=>(x.kind==="hit"||x.kind==="crit") && x.actor && x.actor!==side && x.tx!=null)
    .map(x=>({ x:x.tx, y:x.ty, big:x.kind==="crit" })).slice(-7);

  const downSide = ["fall","appeal","spared","death"].includes(b.kind) ? b.actor : null;
  const poseFor = side => {
    if(downSide) return downSide===side ? "fallen" : "victor";
    if(b.kind==="clash") return "clash";
    if(b.kind==="gas" && b.actor===side) return "gas";
    if(b.kind==="crit"||b.kind==="hit"||b.kind==="graze"){
      if(b.actor===side) return "lunge";
      return b.kind==="crit" ? "stagger" : "recoil";
    }
    return "idle";
  };
  const deadSide = (()=>{ const dth = beats.slice(0,i+1).find(x=>x.kind==="death"); return dth? dth.actor : null; })();
  const fallenSide = (()=>{ const f = beats.slice(0,i+1).find(x=>x.kind==="fall"); return f? f.actor : null; })();

  const isPair = !!fight.pair;
  const isBeast = !!fight.venatio;
  const isMelee = !!fight.melee;
  const meleeA = isMelee && b.a!=null ? fight.ents[b.a] : null;
  const meleeB = isMelee && b.b!=null ? fight.ents[b.b] : null;
  const pairPose = (side, i) => {
    const dn = side==="A" ? b.dA : b.dB;
    if(dn[i]) return "fallen";
    if(b.kind==="clash") return "clash";
    if((b.kind==="crit"||b.kind==="hit"||b.kind==="graze")){
      if(b.actor===side && b.slot===i) return "lunge";
      if(b.actor!==side && b.slot!=null && (side==="A"? b.dA:b.dB)[i]===false){
        const leadHit = (side==="A" ? b.hA:b.hB)[i];
        return i===0 && leadHit<100 ? (b.kind==="crit"?"stagger":"recoil") : "idle";
      }
    }
    if(b.kind==="end" && !dn[i]) return "victor";
    return "idle";
  };
  const pairWounds = (side,i) => beats.slice(0,beats.indexOf(b)+1)
    .filter(x=>(x.kind==="hit"||x.kind==="crit") && x.actor && x.actor!==side && x.tx!=null && i===0)
    .map(x=>({x:x.tx,y:x.ty,big:x.kind==="crit"})).slice(-5);
  const hasSolo = !isPair && !isMelee;
  const reachOff = k => { const a = kitArt(k,"weapon"); return a==="spear"||a==="trident" ? 20 : a==="axe" ? 8 : a==="dagger" ? -10 : 0; };
  const stance = side => {
    if(isPair || isMelee) return 130;
    if(isBeast) return side==="A" ? 138 : 160;
    const base = 130 + reachOff(side==="A" ? fight.A.kit : (fight.B && fight.B.kit));
    const p = poseFor(side);
    if(p==="lunge") return base - 7;
    if(p==="clash") return base - 3;
    if(p==="recoil"||p==="stagger"||p==="gas") return base + 9;
    if(p==="victor") return base - 2;
    if(p==="fallen") return base + 3;
    return base;
  };
  const closeA = stance("A"), closeB = stance("B");
  const nameA = (isPair||isMelee) ? "" : (fight.A.nick? `${fight.A.name}, ${fight.A.nick}` : fight.A.name);
  const nameB = (isPair||isMelee) ? "" : (fight.B.nick? `${fight.B.name}, ${fight.B.nick}` : fight.B.name);
  const momPct = ((b.mom||0)+3)/6*100;

  return (
    <div className="modalwrap" role="dialog" aria-modal="true">
      <div className="modal" tabIndex={-1}>
        <div className="flex items-center justify-between" style={{marginBottom:8}}>
          <div className="disp" style={{fontSize:13, fontWeight:700, letterSpacing:".12em"}}>
            {fight.stakes==="sine" ? <span className="blood">SINE MISSIONE</span> : fight.festival ? fight.festival.toUpperCase() : "THE PITS"}
          </div>
          <div className="flex items-center gap-2">
            <button className="chip" aria-label={SFX.mute? "Unmute sound":"Mute sound"}
              onClick={()=>{ SFX.mute = !SFX.mute; if(SFX.mute){ SFX.stopCrowd(); SFX.stopWeather(); }
                else SFX.place(fight.venue||"forum", fight.sky); setMuted(SFX.mute); onMute(SFX.mute); }}>
              {muted? "Sound off":"Sound on"}
            </button>
            {!done && <button className="chip" onClick={()=>setPlaying(p=>!p)}>{playing? "Pause":"Play"}</button>}
            {!done && <button className="chip" onClick={()=>setSpeed(s=>s===1?2:1)}>{speed}×</button>}
            {done && !fight.crux && <button className="btn btn-ghost" style={{padding:"10px 10px"}} aria-label="Close" onClick={onClose}><X size={14}/></button>}
          </div>
        </div>

        {isPair ? (
          <div style={{marginBottom:6}}>
            <div className="flex items-end gap-2">
              <HPBar label={fight.A[0].name} v={b.hA[0]} s={b.sA} cls={fight.A[0].cls}/>
              <div className="disp dim" style={{fontSize:11,padding:"0 2px",whiteSpace:"nowrap"}}>{b.round>0? `RND ${b.round}`:"—"}</div>
              <HPBar label={fight.B[0].name} v={b.hB[0]} s={b.sB} cls={fight.B[0].cls} flip/>
            </div>
            <div className="flex items-end gap-2" style={{marginTop:4}}>
              <HPBar label={fight.A[1].name} v={b.hA[1]} s={b.sA} cls={fight.A[1].cls}/>
              <div style={{width:34}}/>
              <HPBar label={fight.B[1].name} v={b.hB[1]} s={b.sB} cls={fight.B[1].cls} flip/>
            </div>
          </div>
        ) : (
        <div className="flex items-end gap-2" style={{marginBottom:6}}>
          <HPBar label={isMelee ? (meleeA? meleeA.name : "—") : nameA}
            v={isMelee ? (b.a!=null? b.hp[b.a]:100) : b.vA} s={b.sA}
            cls={isMelee ? (meleeA? (meleeA.mine? meleeA.cls+" · yours" : meleeA.cls+" · "+meleeA.house) : "") : `${fight.A.cls} · ${fight.A.sub}`}/>
          <div className="disp dim" style={{fontSize:11, padding:"0 2px", whiteSpace:"nowrap"}}>{b.round>0? `RND ${b.round}`:"—"}</div>
          <HPBar label={isMelee ? (meleeB? meleeB.name : "—") : (isBeast ? fight.B.name : nameB)}
            v={isMelee ? (b.b!=null? b.hp[b.b]:100) : b.vB} s={b.sB}
            cls={isMelee ? (meleeB? (meleeB.mine? meleeB.cls+" · yours" : meleeB.cls+" · "+meleeB.house) : "") : (isBeast ? "the hunt" : `${fight.B.cls} · ${fight.B.sub}`)} flip/>
        </div>
        )}

        {isMelee && (
          <div className="flex gap-1" style={{flexWrap:"wrap",marginBottom:6}}>
            {fight.ents.map((e,i)=>(
              <span key={i} className="tag" style={{
                borderColor: b.dead[i] ? "#5a1a14" : b.out[i] ? "#3e2f1f" : e.mine ? "#8a3a2b" : "#3d5a6b",
                color: b.dead[i] ? "#6b4038" : b.out[i] ? "#8f7e62" : e.mine ? "#e8a08c" : "#9dc0d4",
                textDecoration: b.out[i] ? "line-through" : "none", fontSize:11 }}>
                {e.name}{b.dead[i] ? " ✝" : ""}
              </span>
            ))}
          </div>
        )}
        <div className={`arena v-${fight.venue||"forum"} ${shaking? "arenashake":""}`}
          role="img" aria-label={b && b.text ? b.text : "The arena"}>
          <CrowdRow level={b.crowd} factions={fight.factions} venue={fight.venue}/>
          <div className="roar" style={{opacity: b.crowd/130}}/>
          <div className="dust"/>
          {isMelee ? (<>
            {meleeA && <div className="fig" style={{left:`calc(50% - 130px)`}}>
              <div className={b.kind==="clash"?"bob":""}>
                <Fighter foe={meleeA && !meleeA.mine} col={meleeA && meleeA.mine ? houseCol : null} fem={meleeA.fem} kit={meleeA.kit} scars={meleeA.scars}
                  pose={b.actor==="a" && (b.kind==="hit"||b.kind==="crit"||b.kind==="graze") ? "lunge"
                    : b.out[b.a] ? "fallen" : b.kind==="end" ? "victor" : "idle"}
                  wounds={[]} fallen={b.out[b.a]} dead={b.dead[b.a]}/>
              </div>
            </div>}
            {meleeB && <div className="fig" style={{right:`calc(50% - 130px)`, transform:"scaleX(-1)"}}>
              <div className={b.kind==="clash"?"bob":""}>
                <Fighter foe={!meleeB.mine} fem={meleeB.fem} kit={meleeB.kit} scars={meleeB.scars}
                  pose={b.out[b.b] ? "fallen" : (b.kind==="hit"||b.kind==="crit") ? "recoil" : "idle"}
                  wounds={[]} fallen={b.out[b.b]} dead={b.dead[b.b]}/>
              </div>
            </div>}
          </>) : isPair ? (<>
            {[1,0].map(i=>(
              <div key={`a${i}`} className="fig" style={{ left:`calc(50% - ${118 + (i===0?4:44)}px)`,
                bottom: i===0 ? 14 : 40, zIndex: i===0?3:2, opacity: i===0?1:0.88, transform:`scale(${i===0?1:0.86})`, transformOrigin:"50% 100%" }}>
                <div className={pairPose("A",i)==="idle" && !b.dA[i] ? "bob":""}>
                  <Fighter col={houseCol} fem={fight.A[i].fem} kit={fight.A[i].kit} scars={fight.A[i].scars} pose={pairPose("A",i)}
                    wounds={pairWounds("A",i)} fallen={b.dA[i]} dead={b.xA[i]}/>
                </div>
              </div>
            ))}
            {[1,0].map(i=>(
              <div key={`b${i}`} className="fig" style={{ right:`calc(50% - ${118 + (i===0?4:44)}px)`,
                bottom: i===0 ? 14 : 40, zIndex: i===0?3:2, opacity: i===0?1:0.88,
                transform:`scaleX(-1) scale(${i===0?1:0.86})`, transformOrigin:"50% 100%" }}>
                <div className={pairPose("B",i)==="idle" && !b.dB[i] ? "bob":""}>
                  <Fighter foe fem={fight.B[i].fem} kit={fight.B[i].kit} scars={fight.B[i].scars} pose={pairPose("B",i)}
                    wounds={pairWounds("B",i)} fallen={b.dB[i]} dead={b.xB[i]}/>
                </div>
              </div>
            ))}
          </>) : (<>
          <div className="fig" style={{left:`calc(50% - ${closeA}px)`}}>
            <div className={poseFor("A")==="idle" && !downSide ? "bob":""}>
              <Fighter col={houseCol} fem={fight.A.fem} kit={fight.A.kit} scars={fight.A.scars} pose={poseFor("A")} wounds={woundsFor("A")} fallen={fallenSide==="A"} dead={deadSide==="A"}/>
            </div>
          </div>
          {isBeast ? (
            <div className="fig" style={{right:`calc(50% - 160px)`, transform:"scaleX(-1)", bottom:12}}>
              <div className={poseFor("B")==="idle" && !downSide ? "bob":""}>
                <Beast art={BEASTS[fight.beast].art} pose={
                  b.kind==="end" && fight.win ? "dead"
                  : b.actor==="B" && (b.kind==="hit"||b.kind==="crit"||b.kind==="graze") ? "lunge"
                  : b.actor==="A" && (b.kind==="hit"||b.kind==="crit") ? "recoil" : "idle"}
                  wounds={woundsFor("B")} dead={fight.win && (b.kind==="end")}/>
              </div>
            </div>
          ) : (
          <div className="fig" style={{right:`calc(50% - ${closeB}px)`, transform:"scaleX(-1)"}}>
            <div className={poseFor("B")==="idle" && !downSide ? "bob":""}>
              <Fighter foe fem={fight.B.fem} kit={fight.B.kit} scars={fight.B.scars} pose={poseFor("B")} wounds={woundsFor("B")} fallen={fallenSide==="B"} dead={deadSide==="B"}/>
            </div>
          </div>
          )}
          </>)}
          {spurts.map(sp=>(
            <div key={sp.id} style={{position:"absolute",
              left: sp.side==="A" ? `calc(50% - ${closeA}px + 62px)` : undefined,
              right: sp.side==="B" ? `calc(50% - ${closeB}px + 62px)` : undefined,
              bottom: `${158-sp.y}px`}}>
              {sp.drops.map(d=>(
                <div key={d.k} className="spurt" style={{"--dx":`${d.dx}px`, "--dy":`${d.dy}px`}}/>
              ))}
            </div>
          ))}
          {(b.kind==="crit"||b.kind==="death") && <div className="hitflash" key={`f${i}`}/>}
          <div style={{position:"absolute",bottom:4,left:8,right:8,display:"flex",alignItems:"center",gap:6}}>
            <span className="disp dim" style={{fontSize:11,letterSpacing:".08em"}}>MOMENTUM</span>
            <div className="momtrack" style={{flex:1}}>
              <div className="momfill" style={{ left: momPct<50? `${momPct}%`:"50%", right: momPct<50? "50%":`${100-momPct}%` }}/>
            </div>
          </div>
        </div>

        <div className="caption" role="log" aria-live="polite" aria-atomic="true"
          style={{marginTop:10, color: b.kind==="crit"||b.kind==="death"? "#eab6a8" : b.kind==="crowd"? "#e0bd72":"#e8d9b8"}}>
          {b.text}
        </div>
        {b.stands && (
          <div style={{marginTop:5,fontSize:14.5,fontStyle:"italic",
            color: b.stands.silent ? "#8d7e65" : (FAC_TINT[b.stands.fac] ? "#cfc0a0" : "#cfc0a0")}}>
            {b.stands.silent ? b.stands.line : <>
              <span style={{color:FAC_TINT[b.stands.fac]||"#9aa86a"}}>“{b.stands.line}”</span>
              <span className="dim" style={{fontSize:13}}> — {b.stands.who}</span>
            </>}
          </div>
        )}

        {!done && <button className="btn btn-ghost" style={{width:"100%",marginTop:4}} onClick={()=>{setPlaying(false); setI(beats.length-1);}}>Skip to the verdict</button>}

        {done && fight.crux && onSpeak && (()=>{
          /* solo human bouts get the full, contextual set of orders and can be coached
             more than once; hunts, pairs and melees keep the single old three. */
          const solo = !fight.melee && !fight.venatio && !fight.pair;
          const cx = beats[beats.length-1] || {};
          const base = fight.melee ? MELEE_CRUX
            : solo ? CRUX
            : { press:CRUX.press, cover:CRUX.cover, cloth:CRUX.cloth };
          const entries = Object.entries(base).filter(([k,c]) => !c.when || c.when(cx));
          const sig = solo && fight.A ? SIGNATURES[fight.A.cls] : null;
          return (
          <div className="panel" style={{marginTop:8,padding:12,borderColor:"#c99a4b"}}>
            <div className="disp" style={{fontSize:13,fontWeight:700,letterSpacing:".1em",marginBottom:4,color:"#e8d092"}}>
              {solo ? "FROM THE BOX" : "ONE WORD FROM THE BOX"}
            </div>
            <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:9}}>
              {solo ? "He can hear you between the exchanges. Say the word and watch it land."
                : "He can hear you from here, and he will only hear you once."}
            </div>
            {entries.map(([k,c])=>{
              const label = (k==="cloth" && fight.venatio) ? "Call the handlers in"
                : (k==="cloth" && fight.pair) ? "Throw in the cloth for both"
                : (k==="finish") ? (sig ? `Go for ${sig.name}` : "Go for the finish")
                : c.label;
              return (
                <button key={k} className={`btn ${(k==="cloth"||k==="pullall")?"btn-blood":""}`}
                  style={{width:"100%",marginBottom: solo?4:7, textAlign: solo?"left":"center"}} onClick={()=>onSpeak(k)}>
                  <span>{label}</span>
                  {solo && c.desc && <span className="dim" style={{display:"block",fontSize:12,fontStyle:"italic",fontWeight:400,marginTop:1,whiteSpace:"normal"}}>{c.desc}</span>}
                </button>
              );
            })}
            <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:solo?4:0}}>
              {fight.melee
                ? "Pulling a man off the sand costs you his share and nothing else — and if he was your second, the editor has nobody left to make him fight."
                : fight.venatio
                ? "There is no editor in a hunt and no appeal to make. The handlers come only if you call them, and only you can."
                : fight.pair
                ? "Whatever you say, you say to both of them."
                : "Whatever you call, he answers for the next exchange or two — then the crowd looks to your box again."}
            </div>
          </div>
          );
        })()}

        {done && !fight.crux && (
          <div className="panel" style={{marginTop:8, padding:12, borderColor: fight.dead? "#7c2a22" : fight.win? "#5a6a35":"#4e3c26"}}>
            <div className="disp" style={{fontSize:13, fontWeight:700, marginBottom:6, color: fight.dead? "#d98476": fight.win? "#b9c58a":"#e0bd72"}}>
              {fight.dead? "A DEATH IN THE HOUSE" : fight.win? "VICTORY" : "DEFEAT"}
            </div>
            {fight.sum.map((s,k)=><div key={k} style={{fontSize:15.5, padding:"2px 0"}}>{s}</div>)}
            {fight.reading && fight.reading.length>0 && (
              <div className="panel" style={{padding:11,marginTop:9,background:"#1c1610",
                borderColor: fight.win ? "#4e3c26" : "#7c2a22"}}>
                <div className="tag" style={{marginBottom:4}}>What decided it</div>
                {fight.reading.map((s,k)=>(
                  <div key={k} style={{fontSize:14.5,borderTop:k?"1px dotted #33271a":"none",paddingTop:k?5:0,marginTop:k?5:0}}>{s}</div>
                ))}
              </div>
            )}
            <button className="btn" style={{marginTop:10, width:"100%"}} onClick={onClose}>Return to the ludus</button>
          </div>
        )}
      </div>
    </div>
  );
}

const OVER_TEXT = {
  lanistaDied: o=>({ title:"THE STAIRS TO THE GALLERY", text:`${o.lan} does not come down to the yard one morning. He was ${o.age}, he had run ${o.name} for ${o.years} year${o.years===1?"":"s"}, and the work had been taking pieces off him for a while in a way that everyone had noticed and nobody had said. The doctore finds him. The men are told at the post and go back to it, because there is nothing else in the day for them to do. What happens to this house now is somebody else's business — a nephew, a creditor, or the block. You do not get to see which.` }),
  triumph: o=>({ title:"THE SAND AT ROME", text:`Your men took ${o.won} of three on the imperial sand, in front of the only crowd that has ever mattered. A freedman of the palace finds you afterward with a wooden case and no expression: a rudis cut from imperial oak, and a deed to land in Campania. ${o.name} need never send anyone to the sand again. Whether that is a reward or a joke is left to you. In Capua they will say you were lucky. In Rome they simply say your name.` }),
  romeFall: o=>({ title:"SWALLOWED BY ROME", text:`${o.won===1?"One bout of three":"Nothing"}. The imperial sand took your best men in an afternoon and the crowd had forgotten them before the awnings came down. What is left of ${o.name} goes home down the Appian Way in two wagons instead of six, and the houses of Capua are careful not to laugh where you can hear them. A lanista who has been to Rome and come back like this does not get asked twice.` }),
  rebellion: o=>({ title:"THE HOUSE BURNS", text:`In the dead of night, ${o.leader} breaks his chains. The cells empty like a wound opening. By dawn your ludus is ash, your guards are fled or dead, and your name is a warning told to other lanistae. His name, they say, is already on the road to legend.` }),
  foreclosed: o=>({ title:"THE PAPER IS CALLED IN", text:`${o.lender} does not come himself. Two men with a magistrate's clerk arrive at the hour the gate opens and read out a number — ${o.owed} denarii — that has not had any relation to what you borrowed for a long time. They take the sand, the racks, the cells and the men in them. Nobody in Capua is surprised, and one or two are relieved it was not them. ${o.name} is a line in somebody's ledger now, and it balances.` }),
  debt: ()=>({ title:"THE CREDITORS COME", text:"Hard men with soft voices arrive at your gate bearing a magistrate's seal. The ludus, the familia, the very sand of your training square — seized, itemized, sold. Capua forgets you before the next games." }),
  closed: o=>({ title:"THE GATES STAND OPEN", text:`You free the last of them on a Tuesday, which is not a day anybody chooses for anything. ${o.freed} men have walked out of ${o.name} on their own legs across ${o.years} year${o.years===1?"":"s"}, and there is nobody left in the cells to see the last one go. The sand will be a yard for something else inside a year and the racks are already sold. Capua thinks you have lost your mind, and one lanista in Neapolis writes to ask how it was done.` }),
  oldAge: o=>({ title:"THE LONG TENURE", text:`${o.lan} is ${o.age} and has been doing this for ${o.years} year${o.years===1?"":"s"}. There is no single morning it ends. There is a winter where the walk down to the square gets long, and a spring where somebody else has already set the drills before he arrives, and by summer the house is being run by ${o.heir} and everybody has agreed not to say so. He keeps the ledger. It is the part he was always best at.` }),
  banned: o=>({ title:RUINS.banned.title, text:RUINS.banned.text(o) }),
  disgrace: o=>({ title:RUINS.disgrace.title, text:RUINS.disgrace.text(o) }),
  ruined: o=>({ title:RUINS.ruined.title, text:RUINS.ruined.text(o) }),
  ruin: ()=>({ title:"AN EMPTY HOUSE", text:"No men. No coin. A lanista with an empty ludus is only a man with a large, quiet building. The gates are shuttered, and the wind moves the sand where champions might have trained." }),
};

const SLOTS_N = 3;
const LEGACY_KEY = "ludus-save-v1";
const slotKey = i => `ludus-slot-${i}`;

/* Device-wide preferences, kept apart from the save slots. */
const PREFS_KEY = "ludus-prefs-v1";
const DEFAULT_PREFS = { sound: true, reduceMotion: false, largeText: false, colorblind: false, guideDone: false };

/* A house at a glance, for the title screen. */
function saveSummary(s){
  if(!s) return null;
  return { name:s.name, week:s.week, fame:rnd(s.fame), title:fameTitle(s.fame),
    men:s.gladiators.filter(g=>!isGone(g)).length,
    fallen:(s.fallen||[]).length, freed:(s.freed||[]).length,
    over: s.over ? s.over.kind : null, savedAt: s.savedAt || null };
}
const whenWord = ts => {
  if(!ts) return "";
  const mins = Math.floor((Date.now()-ts)/60000);
  if(mins<1) return "just now";
  if(mins<60) return `${mins} min ago`;
  const h = Math.floor(mins/60);
  if(h<24) return `${h} hour${h>1?"s":""} ago`;
  const dd = Math.floor(h/24);
  return `${dd} day${dd>1?"s":""} ago`;
};
/* Transfer codes: base64 of the save, unicode-safe both ways. */
function encodeSave(s){
  try{ return btoa(unescape(encodeURIComponent(JSON.stringify(s)))); }catch(e){ return ""; }
}
function decodeSave(txt){
  try{
    const raw = decodeURIComponent(escape(atob((txt||"").trim())));
    const o = JSON.parse(raw);
    if(!o || !Array.isArray(o.gladiators) || typeof o.week!=="number") return null;
    return migrate(o);
  }catch(e){ return null; }
}

/* A portrait bust for the doctore — a grizzled man off the sand, drawn in the
   same flat SVG as the fighters. Seeded off his name so a given doctore always
   wears the same face, and every doctore is his own man. */
function DoctoreBust({ name, size=56 }){
  let h = 2166136261 >>> 0;
  const s = name || "doctore";
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  const rnd = () => { h = (Math.imul(h, 1103515245) + 12345) >>> 0; return h / 4294967296; };
  const pick = arr => arr[Math.floor(rnd()*arr.length)];
  const skin  = pick(["#a8763e","#b5823f","#9a6a37","#c18d54","#8c6033"]);
  const skinD = "#6f4a22";
  const hair  = pick(["#2a1b0f","#3a2c1c","#5b4a38","#8a8076","#9a938a"]);   // last two grey — old men
  const beard = rnd() < 0.8;
  const bald  = rnd() < 0.24;
  const scar  = rnd() < 0.6;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{display:"block"}} aria-hidden="true">
      <rect x="0" y="0" width="100" height="100" fill="#1c1610"/>
      {/* shoulders and the oxblood of the house */}
      <path d="M14,100 Q17,73 34,67 L66,67 Q83,73 86,100 Z" fill="#8d3b2c"/>
      <path d="M40,69 Q50,79 60,69 L60,67 L40,67 Z" fill="#6f2c20"/>
      {/* neck */}
      <rect x="43" y="55" width="14" height="16" rx="4" fill={skinD}/>
      {/* ears, head */}
      <circle cx="31" cy="43" r="3.6" fill={skin}/><circle cx="69" cy="43" r="3.6" fill={skin}/>
      <ellipse cx="50" cy="41" rx="19" ry="22" fill={skin}/>
      {/* hair */}
      {!bald
        ? <path d="M31,39 Q30,17 50,16 Q70,17 69,39 Q64,27 50,26 Q36,27 31,39 Z" fill={hair}/>
        : <path d="M33,33 Q40,23 50,23 Q60,23 67,33 Q60,29 50,29 Q40,29 33,33 Z" fill={hair} opacity="0.45"/>}
      {/* brow, eyes, nose */}
      <path d="M38,36 Q43,33 47,36" stroke={skinD} strokeWidth="1.6" fill="none"/>
      <path d="M53,36 Q57,33 62,36" stroke={skinD} strokeWidth="1.6" fill="none"/>
      <circle cx="42.5" cy="40" r="2" fill="#241a12"/>
      <circle cx="57.5" cy="40" r="2" fill="#241a12"/>
      <path d="M50,41 L48,49 Q50,51 52,49" stroke={skinD} strokeWidth="1.4" fill="none"/>
      {/* mouth or beard */}
      {beard
        ? <path d="M35,49 Q37,66 50,68 Q63,66 65,49 Q58,58 50,58 Q42,58 35,49 Z" fill={hair}/>
        : <path d="M44,54 Q50,57 56,54" stroke={skinD} strokeWidth="1.6" fill="none"/>}
      {/* a mark the sand left on him */}
      {scar && <path d="M60,28 L67,47" stroke="#9a4a3a" strokeWidth="1.7" fill="none"/>}
    </svg>
  );
}

/* A collapsible section. Uncontrolled <details> so the browser owns the
   open/closed state and it survives the game's frequent re-renders; the
   initial state is set once on mount. */
function Sect({ title, note, open, children }){
  const ref = useRef(null);
  useEffect(()=>{ if(ref.current) ref.current.open = !!open; }, []);
  return (
    <details className="sect" ref={ref}>
      <summary>
        <span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis"}}>{title}</span>
        <span style={{display:"flex",alignItems:"center",gap:8,flex:"0 0 auto"}}>
          {note!=null && note!=="" && <span className="dim" style={{fontSize:12,letterSpacing:0,textTransform:"none",fontFamily:"'Cormorant Garamond',Georgia,serif"}}>{note}</span>}
          <span className="chev" aria-hidden="true">⌄</span>
        </span>
      </summary>
      <div className="sectbody">{children}</div>
    </details>
  );
}

export default function App(){
  const [screen,setScreen] = useState("loading");
  const [S,setS] = useState(null);
  const [tab,setTab] = useState("ludus");
  const [selId,setSelId] = useState(null);
  const [fight,setFight] = useState(null);
  const [evResult,setEvResult] = useState(null);
  const [nameIn,setNameIn] = useState("House of Aurelius");
  const [bonus,setBonus] = useState("clean");
  const [fGid,setFGid] = useState(null);
  const [tactic,setTactic] = useState("measured");
  const [pitStakes,setPitStakes] = useState("standard");
  const [gearPick,setGearPick] = useState(null);
  const [ask,setAsk] = useState(null);
  const [slots,setSlots] = useState({});
  const [slot,setSlot] = useState(null);
  const [saved,setSaved] = useState(0);
  const [xfer,setXfer] = useState(null);
  const [xferIn,setXferIn] = useState("");
  const [sparPick,setSparPick] = useState(null);
  const [pairSel,setPairSel] = useState([]);
  const [annals,setAnnals] = useState(false);
  const [sheet,setSheet] = useState(null);
  const [rack,setRack] = useState("weapon");
  const [seedIn,setSeedIn] = useState("");
  useEffect(()=>{ if(tab==="market" && S && !S.flags.sawFirstBuy) mut(d=>{ firstBuyWarn(d); }); }, [tab]);
  const [pitchIn,setPitchIn] = useState("plain");
  const [legacy,setLegacy] = useState(null);
  const [carry,setCarry] = useState(null);      // {mode:"out"|"in", text, err, found}
  useEffect(()=>{ (async ()=>{
    try { const r = await window.storage.get(TRADE_KEY);
      setLegacy(r && r.value ? JSON.parse(r.value) : blankLegacy()); }
    catch(e){ setLegacy(blankLegacy()); }
  })(); }, []);

  // Device-wide preferences (sound, accessibility), loaded once and persisted
  // apart from the save slots so they survive switching or wiping houses.
  const [prefs,setPrefs] = useState(DEFAULT_PREFS);
  CB_ON = !!prefs.colorblind;   /* keep the module remap in step with the pref, before any colour helper runs this render */
  const [showGuide,setShowGuide] = useState(false);
  const [guideStep,setGuideStep] = useState(0);
  const [showSettings,setShowSettings] = useState(false);
  const [allTodos,setAllTodos] = useState(false);
  const [showChron,setShowChron] = useState(false);
  useEffect(()=>{ (async ()=>{
    try { const r = await window.storage.get(PREFS_KEY);
      setPrefs({ ...DEFAULT_PREFS, ...(r && r.value ? JSON.parse(r.value) : {}) }); }
    catch(e){ setPrefs({ ...DEFAULT_PREFS }); }
  })(); }, []);
  const setPref = (k,v) => setPrefs(p => { const n = { ...p, [k]: v };
    (async()=>{ try { await window.storage.set(PREFS_KEY, JSON.stringify(n)); } catch(e){} })();
    return n; });
  // Keep the audio engine in step with the sound preference.
  useEffect(()=>{ SFX.mute = !prefs.sound; if(!prefs.sound) SFX.stopCrowd(); }, [prefs.sound]);
  // The header (top) and nav (bottom) are position:fixed over a naturally
  // scrolling body. Measure their real heights so the content always pads
  // clear of them — this avoids viewport-height units, which mobile Chrome
  // mis-reports (it was cutting off the nav and the last on-screen controls).
  useEffect(()=>{
    const root = document.documentElement;
    const hdr = document.querySelector(".shell > .bar");
    const nav = document.querySelector('.shell > nav[role="tablist"]');
    const set = () => {
      if (hdr) root.style.setProperty("--hdr-h", hdr.offsetHeight + "px");
      if (nav) root.style.setProperty("--nav-h", nav.offsetHeight + "px");
    };
    set();
    const ro = typeof ResizeObserver!=="undefined" ? new ResizeObserver(set) : null;
    if (ro){ if(hdr) ro.observe(hdr); if(nav) ro.observe(nav); }
    window.addEventListener("resize", set);
    window.addEventListener("orientationchange", set);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
    };
  }, [screen]);
  const [plan,setPlan] = useState("none");
  const [held,setHeld] = useState(null);
  const [retrainFor,setRetrainFor] = useState(null);
  const [stake,setStake] = useState(0);
  const [against,setAgainst] = useState(false);
  const [arenaWiz,setArenaWiz] = useState(false);   /* the guided to-the-sand flow */
  const [arenaStep,setArenaStep] = useState(0);      /* 0 where · 1 who · 2 ready */
  const [arenaPick,setArenaPick] = useState(null);   /* the chosen occasion */

  useEffect(()=>{ (async()=>{
    const found = {};
    for(let i=1;i<=SLOTS_N;i++){
      try{ const r = await window.storage.get(slotKey(i)); found[i] = (r && r.value) ? migrate(JSON.parse(r.value)) : null; }
      catch(e){ found[i] = null; }
    }
    if(!found[1]){ // a house saved before slots existed keeps its place
      try{ const r = await window.storage.get(LEGACY_KEY);
        if(r && r.value){ found[1] = migrate(JSON.parse(r.value)); await window.storage.set(slotKey(1), JSON.stringify(found[1])); }
      }catch(e){}
    }
    setSlots(found);
    setScreen("title");
  })(); },[]);

  useEffect(()=>{
    if(!S || screen!=="game" || !slot) return;
    const t = setTimeout(async()=>{
      const stamped = { ...S, savedAt: Date.now() };
      try{ await window.storage.set(slotKey(slot), JSON.stringify(stamped)); setSaved(Date.now()); }catch(e){}
      setSlots(v=>({ ...v, [slot]: stamped }));
    }, 500);
    return ()=>clearTimeout(t);
  },[S,screen,slot]);

  /* a house that ends writes what it did into the trade's memory, once */
  useEffect(()=>{ if(!S || !S.over || S.legacyWritten) return;
    (async ()=>{
      const merged = mergeLegacy(legacy, legacyFrom(S));
      try { await window.storage.set(TRADE_KEY, JSON.stringify(merged)); } catch(e){}
      setLegacy(merged);
      setS(Object.assign({}, S, { legacyWritten:1 }));
    })();
  }, [S && S.over]);

  const mut = fn => { const d = clone(S); fn(d); d.rngState = rngGet(); setS(d); };

  const clearTransient = ()=>{ setFight(null); setSelId(null); setEvResult(null); setGearPick(null); setAsk(null); setFGid(null); setArenaWiz(false); setArenaStep(0); setArenaPick(null); };
  const begin = ()=>{ clearTransient();
    if(!slot){ let free=1; for(let i=1;i<=SLOTS_N;i++) if(!slots[i]){ free=i; break; } setSlot(free); }
    const d0 = newGameState(nameIn.trim()||"House of Aurelius", bonus, seedIn, pitchIn);
    applyLegacy(d0, legacy);
    setS(d0); setSeedIn(""); setScreen("game"); setTab("ludus");
    if(!prefs.guideDone){ setGuideStep(0); setShowGuide(true); } };
  const openSlot = i => { const d = slots[i]; if(!d) { setSlot(i); setScreen("intro"); return; }
    clearTransient(); setSlot(i); rngSet(d.rngState || seedToNum(d.seed)); setS(d); setScreen("game"); setTab("ludus"); };
  const toTitle = ()=>{ clearTransient(); setS(null); setSlot(null); setScreen("title"); };
  const carryOut = ()=>{ if(!S) return;
    setCarry({ mode:"out", text:"" });
    exportHouse(S).then(t=>setCarry(c=>c && c.mode==="out" ? Object.assign({},c,{text:t}) : c)); };
  const carryIn = ()=>{ setCarry({ mode:"in", text:"", err:null, found:null }); };
  const watchOne = ()=>{ try { const f = demoFight(); if(f) setFight(f); } catch(e){} };
  const readHouse = t => {
    setCarry(c=>Object.assign({}, c, { text:t, err:null, found:null }));
    if(!t.trim()) return;
    importHouse(t).then(r=>setCarry(c=>
      (c && c.text===t) ? Object.assign({}, c, { err:r.err||null, found:r.house? r : null }) : c));
  };
  const takeHouse = ()=>{
    if(!carry || !carry.found) return;
    const d = carry.found.house;
    let free = null;
    for(let i=1;i<=SLOTS_N;i++) if(!slots[i]){ free = i; break; }
    const target = free || slot || 1;
    clearTransient();
    rngSet(d.rngState || seedToNum(d.seed));
    setSlot(target); setS(d); setCarry(null); setScreen("game"); setTab("ludus");
  };
  const wipeSlot = i => { const sum = saveSummary(slots[i]); if(!sum) return;
    setAsk({ title:"Strike the Ledger", danger:true, confirm:"Erase it",
      text:`${sum.name} — week ${sum.week}, ${sum.men} men, ${sum.fallen} fallen. Erase this house and the slot stands empty for another.`,
      run: async()=>{ try{ await window.storage.delete(slotKey(i)); }catch(e){}
        if(i===1){ try{ await window.storage.delete(LEGACY_KEY); }catch(e){} }
        setSlots(v=>({ ...v, [i]:null })); } }); };
  const restart = toTitle;
  const importSave = i => { const o = decodeSave(xferIn);
    if(!o){ setAsk({ title:"Unreadable", confirm:"So be it", text:"That is not a ledger this house can read. Check the transfer code and try again.", run:()=>{} }); return; }
    (async()=>{ try{ await window.storage.set(slotKey(i), JSON.stringify(o)); }catch(e){}
      setSlots(v=>({ ...v, [i]:o })); setXfer(null); setXferIn("");
      setAsk({ title:"Ledger Restored", confirm:"Good", text:`${o.name} takes its place in the records — week ${o.week}, ${o.gladiators.filter(g=>!isGone(g)).length} men.`, run:()=>{} });
    })(); };
  const advance = ()=> mut(d=>endWeek(d));
  const [skipped,setSkipped] = useState(null);
  const runOn = () => mut(d=>{ const r = skipWeeks(d, weeksToSomething(d, 6)); setSkipped(r); });

  const chooseEv = i => {
    const d = clone(S);
    const ev = d.pendingEvent;
    if(!ev) return;
    const msg = EVENTS[ev.id].run(d, ev, i);
    d.pendingEvent = null;
    chron(d, msg, "event");
    setS(d); setEvResult(msg);
  };

  const makeBet = (g, opp)=> stake>0 && S.gold>=stake
    ? { amount:stake, against, chance:winChance(g, opp) } : null;
  const fightOffer = (offer)=>{
    if(!fGid) return;
    const d = clone(S);
    const g = d.gladiators.find(x=>x.id===fGid);
    if(!g || !canFight(g) || g.lastFought>=d.week) return;
    const bet = makeBet(g, offer.opp);
    if(bet) d.gold -= bet.amount;
    const res = doFight(d, fGid, offer, tactic, bet, null, null, offer.watched ? plan : "none");
    if(res.crux){ setHeld({ base:d, res }); setFight(res); setFGid(null); setStake(0); setAgainst(false); return; }
    setS(d); setFight(res); setFGid(null); setStake(0); setAgainst(false); setPlan("none");
  };
  /* the one word from the box */
  const speak = choice => {
    if(!held) return;
    const d = held.base;
    const p = held.res.pending;
    p.beats = held.res.beats;
    const res = p.melee ? doMelee(d, p.ids, p.offer, p, choice)
      : p.venatio ? doVenatio(d, p.gid, p.offer, p.tactic, p, choice)
      : p.pair ? doPairFight(d, p.ids, p.offer, p.tactic, p, choice)
      : doFight(d, p.gid, p.offer, p.tactic, p.bet, p, choice);
    /* the bout may come to the balance again — keep it held so the next word lands too */
    if(res.crux){ setHeld({ base:d, res }); setFight(res); return; }
    setHeld(null); setS(d); setFight(res);
  };
  const meleeGo = (offer)=>{
    if(pairSel.length<2) return;
    const d = clone(S);
    const res = doMelee(d, pairSel, offer);
    if(!res) return;
    if(res.crux){ setHeld({ base:d, res }); setFight(res); setPairSel([]); setFGid(null); return; }
    setS(d); setFight(res); setPairSel([]); setFGid(null);
  };
  const huntOffer = (offer)=>{
    if(!fGid) return;
    const d = clone(S);
    const res = doVenatio(d, fGid, offer, tactic);
    if(!res) return;
    if(res.crux){ setHeld({ base:d, res }); setFight(res); setFGid(null); return; }
    setS(d); setFight(res); setFGid(null); setStake(0); setAgainst(false);
  };
  const fightPair = (offer)=>{
    if(pairSel.length!==2) return;
    const d = clone(S);
    const res = doPairFight(d, pairSel, offer, tactic);
    if(!res) return;
    if(res.crux){ setHeld({ base:d, res }); setFight(res); setPairSel([]); setFGid(null); return; }
    setS(d); setFight(res); setPairSel([]); setFGid(null);
  };
  const togglePair = id => setPairSel(v => v.includes(id) ? v.filter(x=>x!==id) : (v.length>=2 ? [v[1], id] : [...v, id]));
  const fightPit = ()=>{
    if(!fGid) return;
    const d = clone(S);
    const g = d.gladiators.find(x=>x.id===fGid);
    if(!g || !canFight(g) || g.lastFought>=d.week) return;
    const offer = makePitOffer(d, g, pitStakes);
    const bet = makeBet(g, offer.opp);
    if(bet) d.gold -= bet.amount;
    const res = doFight(d, fGid, offer, tactic, bet);
    if(res.crux){ setHeld({ base:d, res }); setFight(res); setFGid(null); setStake(0); setAgainst(false); return; }
    setS(d); setFight(res); setFGid(null); setStake(0); setAgainst(false);
  };

  const rewardG = id => mut(d=>{ const g=d.gladiators.find(x=>x.id===id); if(!g||d.gold<50) return;
    d.gold-=50; g.morale=clamp(g.morale+12,0,100); g.defiance=clamp(g.defiance-6,0,100); d.unrest=clamp(d.unrest-1,0,100);
    chron(d, `Wine and comfort sent to ${g.name}'s cell. Small coin, long memory.`); });
  const whipG = id => mut(d=>{ const g=d.gladiators.find(x=>x.id===id); if(!g) return;
    remember(d, g, "whipped");
    g.dis=clamp(g.dis+2,5,99); g.defiance=clamp(g.defiance+6,0,100); g.morale=clamp(g.morale-12,0,100); d.unrest=clamp(d.unrest+2,0,100);
    chron(d, `The whip speaks to ${g.name}. The yard is silent after.`); });
  const sellG = id => { const g=S.gladiators.find(x=>x.id===id); if(!g || isDamn(g)) return;
    const v = rnd(gladValue(g)*0.55);
    setAsk({ title:"Sell Him On", danger:true, confirm:`Take ${v} denarii`,
      text:`A buyer offers ${v} denarii for ${fullName(g)}. The other men will see him led out through the gate, and draw their own conclusions.`,
      run:()=>{ mut(d=>{ d.gold+=v;
        { const gg = d.gladiators.find(x=>x.id===id); if(gg){ favourLost(d, gg, "sold"); loseFavourite(d, gg, "sold"); } }
        tieList(d).filter(t=>(t.a===id||t.b===id) && t.kind==="brother").forEach(t=>{
          const o = d.gladiators.find(x=>x.id===(t.a===id?t.b:t.a));
          if(o && o.status==="active") remember(d, o, "soldKin"); });
        const sore = kinReact(d, id, "brother", -16, 9);
        const gone = d.gladiators.find(x=>x.id===id);
        if(gone) annalsClose(d, gone, "sold");
        d.gladiators=d.gladiators.filter(x=>x.id!==id);
        dropTies(d, id);
        d.gladiators.forEach(o=>{ if(o.status==="active") o.defiance=clamp(o.defiance+3,0,100); });
        d.unrest=clamp(d.unrest+2+sore.length*3,0,100);
        serveWants(d, { type:"sell", gid:id });
        chron(d, sore.length
          ? `${g.name} sold for ${v} denarii. ${sore.map(o=>o.name).join(" and ")} watched the gate close behind him and looked at you a moment too long.`
          : `${g.name} sold for ${v} denarii. The familia watches the gate close behind ${PR(g).him}.`); });
        setSelId(null); } }); };
  const retire = id => { const g=S.gladiators.find(x=>x.id===id); if(!g) return;
    setAsk({ title:"Release Him", confirm:"Let him go",
      text:`${fullName(g)} is ${g.age}, with ${g.wins} victories and ${(g.scars||[]).length} scars on him. Release him from the sacramentum now and he leaves on his own feet. Keep him on the sand and the crowd will watch him find out he is slow.`,
      run:()=>{ mut(d=>retireG(d,id)); setSelId(null); } }); };
  const freeG = id => { const g=S.gladiators.find(x=>x.id===id); if(!g) return;
    setAsk({ title:"Grant the Rudis", confirm:"Give him the wooden sword",
      text:`${fullName(g)} has earned his freedom in blood. Hand him the rudis before the crowd and he walks out a free man — and every man still in your cells will watch him go.`,
      run:()=>{ mut(d=>grantRudis(d,id)); setSelId(null); } }); };
  const setFocus = (id,f)=> mut(d=>{ const g=d.gladiators.find(x=>x.id===id); if(g) g.focus=f; });
  const setRegimen = (id,r)=> mut(d=>{ const g=d.gladiators.find(x=>x.id===id); if(!g) return;
    d.flags.everTrained = (d.flags.everTrained||0) + 1;
    if(g.regimen==="spar" && g.sparWith){ const old=d.gladiators.find(x=>x.id===g.sparWith);
      if(old && old.sparWith===g.id){ old.regimen="palus"; old.sparWith=null; } }
    g.regimen = r; g.sparWith = null; });
  const setSpar = (id, mateId)=> mut(d=>{ const g=d.gladiators.find(x=>x.id===id), m=d.gladiators.find(x=>x.id===mateId);
    if(!g || !m || m.status!=="active") return;
    [g,m].forEach(x=>{ if(x.sparWith){ const o=d.gladiators.find(y=>y.id===x.sparWith);
      if(o && o.id!==g.id && o.id!==m.id && o.sparWith===x.id){ o.regimen="palus"; o.sparWith=null; } } });
    g.regimen="spar"; g.sparWith=m.id; m.regimen="spar"; m.sparWith=g.id; });
  const buyG = id => mut(d=>{ const i=d.market.findIndex(m=>m.id===id); if(i<0) return;
    const g=d.market[i]; const count=d.gladiators.filter(x=>!isGone(x)).length;
    if(g.slaver){ dealt(d, g.slaver, "bought"); if(g.flaw && g.scouted) dealt(d, g.slaver, "burned"); }
    const tax = rnd(g.price * lawTax(d));
    if(d.gold < g.price + tax || count>=8) return;
    d.gold -= g.price + tax; d.market.splice(i,1);
    if(tax) chron(d, `${tax} denarii to the vectigal on top of the price, collected before the man is off the block.`, "info");
    const w = defaultKit(g.cls).weapon;
    if(gearFree(d,w)<=0) d.gear[w] = (d.gear[w]||0)+1;   // he comes with the blade he was sold with
    g.kit = bareKit(g.cls);
    d.gladiators.push(g);
    if(g.paragon){
      d.flags.paragonDone = 1; d.flags.paragonBought = d.week;
      d.fame += 70; addRep(d, "show", 10);
      FAC_KEYS.forEach(k=>facMove(d, k, 8));
      d.gladiators.forEach(o=>{ if(o.status==="active" && o.id!==g.id){ o.morale = clamp(o.morale+10,0,100); o.defiance = clamp(o.defiance+4,0,100); } });
      chron(d, `${fullName(g)} is yours. Capua watched you pay it and the men in your cells watched the wagon come in, and nobody in either place is going to forget which morning this was.`, "good");
      return;
    }
    chron(d, isAuctor(g)
      ? `${g.name} of ${g.origin} signs for ${g.price} denarii and ${g.auctor.bouts} bouts. He swears the same sacramentum as every man in the cells — burned, bound, beaten, slain — and he chose it, which they find harder to watch than they expected.`
      : `${g.name} of ${g.origin} joins the ludus for ${g.price} denarii. ${PR(g).He} swears the sacramentum: to be burned, bound, beaten, and slain by the sword.`); });
  const scout = gid => mut(d=>{ const g = d.market.find(x=>x.id===gid); if(!g || g.scouted) return;
    const fee = SCOUT_FEE(d,g);
    if(d.gold < fee) return;
    d.gold -= fee;
    g.scouted = true;
    if(g.slaver){ dealt(d, g.slaver, "scouted"); if(g.flaw) dealt(d, g.slaver, "burned"); }
    chron(d, g.flaw
      ? `You pay to have ${g.name} looked over properly. He ${FLAWS[g.flaw].tell}. ${g.slaver? slaverOf(g.slaver).name : "The seller"} does not meet your eye about it.`
      : `You pay to have ${g.name} looked over properly. He is exactly what ${g.slaver? slaverOf(g.slaver).name : "the man"} said he was, which happens.`,
      g.flaw ? "bad" : "good"); });
  const takeHouseApart = () => mut(d=>{ sellTheHouse(d); });
  const sellOne = id => mut(d=>{ const paid = sellGear(d, id);
    if(paid) chron(d, `${GEAR[id].name} goes back out the door for ${paid} denarii. The armoury is a room, not a warehouse.`, "info"); });
  const buyGear = id => mut(d=>{ const it=GEAR[id]; if(!it || d.gold<it.price) return;
d.gold-=gearPrice(d,it.price,it.slot); d.gear[id]=(d.gear[id]||0)+1;
    d.gearCond = d.gearCond || {}; (d.gearCond[id] = d.gearCond[id] || []).push(100);
    chron(d, `The armourer delivers: ${it.name} (${it.price}d).`); });
  const equip = (gid, slot, id) => mut(d=>{ const g=d.gladiators.find(x=>x.id===gid); if(!g) return;
    if(!g.kit) g.kit = defaultKit(g.cls);
    if(g.kit[slot]===id) return;
    if(!isBasic(id) && gearFree(d,id)<=0) return;
    if(g.named && g.named.slot===slot) return;
    g.wear = g.wear || {}; d.gearCond = d.gearCond || {};
    const old = GEAR[g.kit[slot]];
    if(wears(old)){ (d.gearCond[g.kit[slot]] = d.gearCond[g.kit[slot]] || []).push(wearOf(g, slot)); }
    g.kit[slot] = id;
    const now = GEAR[id];
    if(wears(now)){
      const pool = d.gearCond[id] || [];
      g.wear[slot] = pool.length ? pool.splice(pool.indexOf(Math.max(...pool)),1)[0] : 100;
    } else g.wear[slot] = 100;
  });
  /* strip every man back to house issue, returning bought steel to the rack — for
     starting a loadout over from scratch. Nothing is sold; named weapons stay. */
  const unequipAll = () => mut(d=>{
    d.gearCond = d.gearCond || {}; let n = 0;
    d.gladiators.forEach(g=>{
      if(isGone(g)) return;
      if(!g.kit){ g.kit = defaultKit(g.cls); return; }
      g.wear = g.wear || {};
      const def = defaultKit(g.cls);
      SLOTS.forEach(s=>{
        if(g.named && g.named.slot===s) return;   // a forged, named piece stays with him
        const cur = g.kit[s];
        if(cur === def[s]) return;
        const old = GEAR[cur];
        if(wears(old)){ (d.gearCond[cur] = d.gearCond[cur] || []).push(wearOf(g, s)); n++; }
        g.kit[s] = def[s]; g.wear[s] = 100;
      });
    });
    chron(d, n
      ? `Every man is stripped back to house issue. ${n} piece${n>1?"s go":" goes"} back on the rack, and the yard's loadout starts over from nothing but the standard kit.`
      : "There was nothing but house issue to strip. The rack stands as it was.", "info");
  });
  const setCrest = patch => mut(d=>{ d.crest = Object.assign({ c1:"#8d3b2c", c2:"#c99a4b", sym:"gladius", motto:"" }, d.crest||{}, patch); });
  const takeRise = () => mut(d=>{ claimRise(d); });
  const build = k => mut(d=>{ const L = bLevel(d,k); if(L>=3) return;
    const cost = BUILDINGS[k].cost[L];
    if(d.gold < cost) return;
    d.gold -= cost;
    d.buildings = Object.assign({}, d.buildings, {[k]: L+1});
    chron(d, `${BUILDINGS[k].name} ${L? "improved":"built"}. ${BUILDINGS[k].levels[L]}`, "good"); });
  const setCare = (id, care) => mut(d=>{ const g=d.gladiators.find(x=>x.id===id); if(!g || !g.injury) return;
    if(care==="surgeon"){
      const fee = surgeonFee(d, g.injury);
      if(d.gold < fee || !surgeonOK(d)) return;
      d.gold -= fee;
      g.injury.care = "surgeon"; remember(d, g, "surgeon");
      if(g.status!=="injured") g.status = "injured";
      chron(d, `The surgeon works on ${g.name} by lamplight. ${fee} denarii, and worth it if ${PR(g).he} fights again.`);
      return;
    }
    g.injury.care = care;
    if(care==="through"){ g.status = "active";
      g.morale = clamp(g.morale-6,0,100); g.defiance = clamp(g.defiance+4,0,100);
      chron(d, `${g.name} is sent back to the post on an open wound.`, "bad"); }
    else if(care==="convalesce"){ g.status = "injured";
      g.morale = clamp(g.morale+4,0,100);
      chron(d, `${g.name} is given the long bed. No sand, no post, no hurry — he rises when he rises.`); }
    else g.status = "injured"; });
  const mendKit = gid => mut(d=>{ const g=d.gladiators.find(x=>x.id===gid); if(!g) return;
    const fee = repairFee(d, g);
    if(fee<=0 || d.gold<fee) return;
    d.gold -= fee;
    g.wear = g.wear || {};
    for(const s of SLOTS) if(wears(GEAR[g.kit[s]])) g.wear[s] = 100;
    chron(d, `${g.name}'s kit goes to the armoury and comes back straightened, edged and oiled. ${fee} denarii.`); });
  const forgeFor = (gid, slot) => mut(d=>{ const g=d.gladiators.find(x=>x.id===gid); if(!g) return;
    if(!forgeReady(d,g) || d.gold<FORGE_FEE) return;
    if(!wears(GEAR[g.kit[slot]])) return;
    d.gold -= FORGE_FEE;
    const title = pick(FORGE_NAMES.filter(t=>!(d.forged||[]).includes(t))) || pick(FORGE_NAMES);
    d.forged = [...(d.forged||[]), title];
    g.named = { slot, title, made:d.week };
    giveProv(d, g, slot, "forged");
    g.wear = g.wear || {}; g.wear[slot] = 100;
    g.morale = clamp(g.morale+16, 0, 100);
    g.defiance = clamp(g.defiance-6, 0, 100);
    chron(d, `The smith works six weeks of nights on one piece for ${g.name} and hands it over without a word. ${title}. It is his, and it is not going back on the rack.`, "good"); });
  const askFavour = pid => mut(d=>{ callFavour(d, pid); });
  const doMaster = gid => mut(d=>{ const g=d.gladiators.find(x=>x.id===gid); if(g) makeMaster(d,g); });
  const teachSecond = (gid,to) => mut(d=>{ startSecond(d,gid,to); });
  const useStyle = (gid,to) => mut(d=>{ switchStyle(d,gid,to); });
  const chooseHeir = kind => mut(d=>{ nameHeir(d, kind); });
  const takeUpHouse = () => mut(d=>{ succeed(d); d.succession = null; });
  const setEar = (who, gid) => mut(d=>{
    if(!who){ d.ear = null; d.heard = []; return; }
    d.ear = who==="gate" ? { who:"gate", since:d.week } : { who:"man", gid, since:d.week, risk:0 };
    chron(d, who==="gate"
      ? `The old man on the gate is given a small retainer and no instructions beyond keeping his ears open.`
      : `You put one of your own inside the thing you want to hear. He does not ask why and that is worse.`, "info"); });
  const haveWatched = oid => mut(d=>{
    const o = (d.games ? d.games.offers : []).find(x=>x.id===oid);
    if(o) watchHim(d, o); });
  const takeLoan = (who, amt) => mut(d=>{ borrow(d, who, amt); });
  const payLoan = amt => mut(d=>{ repay(d, amt); });
  const hireStaff = (kind, id) => mut(d=>{
    const list = (d.staffMarket||{})[kind] || [];
    const s = list.find(x=>x.id===id);
    if(!s || d.gold < s.fee || d[kind]) return;
    d.gold -= s.fee; d[kind] = s; d.staffMarket = Object.assign({}, d.staffMarket, {[kind]:[]});
    chron(d, `${s.name} takes the ${STAFF[kind].name.toLowerCase()}'s place at ${s.wage} denarii a week.`, "good"); });
  const letStaffGo = kind => mut(d=>{ const s = d[kind]; if(!s) return;
    d[kind] = null;
    chron(d, `${s.name} is let go. He packs without comment.`, "info"); });
  const armHim = gid => mut(d=>{ const r = armFromRack(d, gid);
    if(r && r.changed.length) chron(d, `${(d.gladiators.find(x=>x.id===gid)||{}).name} is re-armed off the rack — ${r.changed.length} piece${r.changed.length===1?"":"s"} changed.`, "info"); });
  const armAll = () => mut(d=>{ let n=0;
    for(const g of activeG(d)){ const r = armFromRack(d, g.id); if(r && r.changed.length) n++; }
    chron(d, n ? `The armourer goes down the line and re-arms ${n} man${n===1?"":"men"} out of the racks.` : `Everyone is already carrying the best of what the house owns.`, "info"); });
  const keepKit = gid => mut(d=>{ saveKit(d, gid); });
  const useKit = (gid,kid) => mut(d=>{ applyKit(d, gid, kid); });
  const forgetKit = kid => mut(d=>{ dropKit(d, kid); });
  const declare = key => mut(d=>{ declareDoctrine(d, key); });
  const backHim = (cid, lvl) => mut(d=>{ backCandidate(d, cid, lvl); });
  const doRite = (gid, key) => mut(d=>{ holdMunera(d, gid, key); });
  const joinCollegium = () => mut(d=>{ foundCollegium(d); });
  const stopCollegium = () => mut(d=>{ lapseCollegium(d, true); });
  const takeRoad = key => mut(d=>{ setOut(d, key); });
  const goHome = () => mut(d=>{ comeHome(d); });
  const setPupil = gid => mut(d=>{ if(!d.doctore) return;
    if(d.doctore.retrainTo) return;
    d.doctore.pupil = (d.doctore.pupil===gid) ? null : gid; });
  const startRetrain = (gid, cls) => mut(d=>{ const doc=d.doctore; if(!doc || d.gold<RETRAIN_FEE) return;
    const g = d.gladiators.find(x=>x.id===gid); if(!g || g.status!=="active" || g.cls===cls) return;
    d.gold -= RETRAIN_FEE;
    doc.pupil = gid; doc.retrainTo = cls; doc.retrainLeft = RETRAIN_WEEKS;
    chron(d, `${doc.name} takes ${g.name} off the roster for ${RETRAIN_WEEKS} weeks. He intends to make a ${cls.toLowerCase()} of him.`); });
  const stopRetrain = () => mut(d=>{ if(!d.doctore) return;
    d.doctore.pupil = null; d.doctore.retrainTo = null; d.doctore.retrainLeft = 0;
    chron(d, `The retraining is called off. The fee is not coming back.`); });
  const hireDoc = did => mut(d=>{ const c=(d.doctoreMarket||[]).find(x=>x.id===did);
    if(!c || d.doctore || d.gold<c.fee) return;
    d.gold -= c.fee; d.doctore = c; d.doctoreMarket = [];
    chron(d, `${c.name} takes the training square. His voice carries to the far wall before the first morning is out.`, "good"); });
  const dismissDoc = () => { const doc=S.doctore; if(!doc) return;
    setAsk({ title:"Dismiss the Doctore", danger:doc.fromHouse, confirm:"Send him away",
      text: doc.fromHouse
        ? `${doc.name} stayed when he could have walked. Turn him out now and the familia will hear about it before the gate shuts behind him.`
        : `${doc.name} has drilled your men for ${doc.weeks} week${doc.weeks===1?"":"s"} at ${doc.wage} denarii a week. Dismiss him and the square is yours to run.`,
      run:()=>mut(d=>{ const was=d.doctore; d.doctore=null; makeDoctoreMarket(d);
        if(was.fromHouse){ d.unrest=clamp(d.unrest+8,0,100);
          d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-8,0,100); o.defiance=clamp(o.defiance+5,0,100); } });
          chron(d, `${was.name} is turned out of the ludus he chose to stay in. They watch him go, and say nothing at all.`, "bad");
        } else chron(d, `${was.name} collects his wages and leaves the square empty.`);
      }) }); };
  const answerReSign = accept => mut(d=>{
    const o = d.reSignOffer; if(!o) return;
    const g = d.gladiators.find(x=>x.id===o.gid);
    d.reSignOffer = null;
    if(!g) return;
    if(accept && d.gold>=o.fee){
      d.gold -= o.fee;
      g.auctor = { bouts:o.bouts, served:0, fee:o.fee, wage:o.wage, why:g.auctor.why };
      g.morale = clamp(g.morale+12,0,100);
      chron(d, `${fullName(g)} signs again — ${o.fee} in hand, ${o.bouts} more bouts. He had somewhere to go and did not go.`, "good");
    } else auctorDepart(d, g);
  });
  const answerRome = accept => mut(d=>{
    const o = d.romeOffer; if(!o) return;
    d.romeOffer = null;
    if(accept){
      d.rome = { travel:2, fought:0, won:0, turned:false, run:romeRuns(d)+1 };
      d.games = null;
      d.gladiators.forEach(g=>{ if(g.status==="active"){ g.morale=clamp(g.morale+8,0,100); g.defiance=clamp(g.defiance+4,0,100); } });
      chron(d, `You accept. The wagons are loaded within the week, and everyone in the cells knows where they are going.`, "good");
    } else {
      d.flags.declinedRome = (d.flags.declinedRome||0)+1;
      d.flags.romeDeclined = d.week;
      d.fame = Math.max(0, d.fame-25);
      patronsOf(d).forEach(p=>{ if(p.rank==="senator") p.favor = clamp(p.favor-30,0,100); });
      recomputeFavor(d);
      d.gladiators.forEach(g=>{ if(g.status==="active") g.morale=clamp(g.morale+4,0,100); });
      chron(d, `You decline Rome. The senator's letters stop coming, and Capua remains the whole of the world.`, "info");
    }
  });
  const takeOffer = accept => mut(d=>{ const o=d.doctoreOffer; if(!o) return;
    d.doctoreOffer = null;
    if(accept){ const old=d.doctore; d.doctore=o; d.doctoreMarket=[];
      d.unrest=clamp(d.unrest-5,0,100);
      d.gladiators.forEach(g=>{ if(g.status==="active") g.morale=clamp(g.morale+5,0,100); });
      chron(d, old ? `${o.name} takes the square from ${old.name}. The men train harder for a man who wore their chains.` 
                   : `${o.name} stays, and takes the training square. The men train harder for a man who wore their chains.`, "good");
    } else chron(d, `${o.name} takes his freedom and the road with it. You will not see him again.`);
  });
  const host = kind => mut(d=>{ const p=PARTY[kind];
    if(d.gold<p.cost || d.week-d.lastParty<2) return;
    d.gold-=p.cost; d.favor+=p.favor; d.fame+=p.fame; d.lastParty=d.week;
    let extra="";
    const show = activeG(d).sort((a,b)=>b.sho-a.sho)[0];
    if(show){ const bf=rnd(show.sho/12); d.fame+=bf; extra+=` ${show.name} spars for the guests to gasps and applause (+${bf} fame).`;
      if(R()<0.08){ const inj=INJURIES[0]; show.injury={name:inj[0],weeks:inj[1],pen:inj[2]}; show.status="injured"; extra+=" A careless blade — he takes a small wound."; } }
    if(kind!=="modest" && R()<0.25){ d.favor+=8; d.gold+=100; extra+=" A magistrate lingers past the last cup — you have found a patron (+8 favor, a gift of 100 denarii)."; }
    if(kind==="decadent" && R()<0.2){ d.fame=Math.max(0,d.fame-8); extra+=" Word of certain excesses escapes the villa walls (-8 fame)."; }
    chron(d, `You host ${p.label.toLowerCase()}. Capua's better sort attend.${extra}`, "good");
    const bump = kind==="modest"?5:kind==="lavish"?9:15;
    patronsOf(d).forEach(pt=>{ pt.favor = clamp(pt.favor+bump, 0, 100); });
    serveWants(d, { type:"party", kind }); });
  const feast = ()=> mut(d=>{ if(d.gold<120 || d.week-d.lastFeast<3) return;
    d.gold-=120; d.lastFeast=d.week; d.flags.everFeast=(d.flags.everFeast||0)+1;
    if(d.lanista) d.lanista.health = clamp(d.lanista.health + 3, 0, 100);
    rememberAll(d, "feast");
    d.gladiators.forEach(g=>{ if(!isGone(g)){ g.morale=clamp(g.morale+9,0,100); g.defiance=clamp(g.defiance-4,0,100); } });
    d.unrest=clamp(d.unrest-7,0,100);
    chron(d, "Meat and honeyed wine for the familia. Songs in the cells past midnight."); });

  if(screen==="loading") return <div className="lr" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><div className="disp dim">Lighting the torches...</div></div>;

  const CarrySheet = ()=> !carry ? null : (
    <div className="modalwrap" role="dialog" aria-modal="true" onClick={()=>setCarry(null)}>
      <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
        <div className="disp" style={{fontSize:18,color:"#e8d092",marginBottom:6}}>
          {carry.mode==="out" ? "CARRY THIS HOUSE OUT" : "BRING A HOUSE IN"}
        </div>
        {carry.mode==="out" ? (<>
          <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>
            Everything about this house, in one string. Copy it into a message and somebody else can pick it up exactly where you left it.
          </div>
          <textarea readOnly value={carry.text} onFocus={e=>e.target.select()}
            style={{width:"100%",height:120,boxSizing:"border-box",background:"#100d0a",color:"#b09b7d",
              border:"1px solid #4e3c26",borderRadius:8,padding:9,fontSize:11,fontFamily:"monospace",resize:"none"}}/>
          <div className="dim" style={{fontSize:13,marginTop:5}}>
            {carry.text ? `${carry.text.length} characters` : "packing it up…"} · week {S?S.week:0} · {S?S.gladiators.filter(g=>!isGone(g)).length:0} men
          </div>
          <button className="btn" style={{width:"100%",marginTop:8}}
            onClick={()=>{ try{ navigator.clipboard.writeText(carry.text); }catch(e){} }}>Copy it</button>
        </>) : (<>
          <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>
            Paste a house here. It goes into an empty record and does not touch the ones you have.
          </div>
          <textarea value={carry.text} onChange={e=>readHouse(e.target.value)} placeholder="LVDVS1...."
            style={{width:"100%",height:120,boxSizing:"border-box",background:"#100d0a",color:"#b09b7d",
              border:"1px solid "+(carry.err?"#7c2a22":carry.found?"#5a6a35":"#4e3c26"),borderRadius:8,padding:9,
              fontSize:11,fontFamily:"monospace",resize:"none"}}/>
          {carry.err && <div className="blood" style={{fontSize:14,marginTop:6}}>{carry.err}</div>}
          {carry.found && (
            <div className="panel" style={{padding:10,marginTop:7,borderColor:"#5a6a35"}}>
              <div className="disp" style={{fontSize:15,color:"#e8d092"}}>{carry.found.name}</div>
              <div className="dim" style={{fontSize:14}}>
                week {carry.found.week} · {carry.found.men} men · {carry.found.fame} fame
              </div>
            </div>
          )}
          <button className="btn" style={{width:"100%",marginTop:8}} disabled={!carry.found} onClick={takeHouse}>
            {carry.found ? "Take it up" : "Nothing to take up yet"}
          </button>
        </>)}
        <button className="btn btn-ghost" style={{width:"100%",marginTop:6}} onClick={()=>setCarry(null)}>Close</button>
      </div>
    </div>
  );

  if(screen==="title") return (
    <div className="lr" style={{display:"flex",alignItems:"safe center",justifyContent:"center",padding:20}}>
      <style>{CSS}</style>
      <CarrySheet/>
      {fight && <FightModal fight={fight} startMuted={!prefs.sound} houseCol={S && S.crest}
        onClose={()=>{ SFX.stopCrowd(); setFight(null); }}
        onSpeak={null} onMute={v=>setPref("sound", !v)}/>}
      <div style={{maxWidth:460,width:"100%"}}>
        <div className="disp" style={{fontSize:46,fontWeight:900,textAlign:"center",letterSpacing:".22em",color:"#e8d092"}}>LVDVS</div>
        <div className="dim" style={{textAlign:"center",fontStyle:"italic",marginTop:2,marginBottom:18}}>Blood, sand, and the fortunes of a Roman house.</div>
        <div className="flex items-center justify-between" style={{marginBottom:8}}>
          <span className="tag tag-gold">The Records</span>
          <span className="flex gap-2">
            <button className="btn btn-ghost" style={{padding:"10px 10px",fontSize:12}} onClick={watchOne}>Watch a bout</button>
            <button className="btn btn-ghost" style={{padding:"10px 10px",fontSize:12}} onClick={carryIn}>Bring one in</button>
          </span>
        </div>
        {[1,2,3].map(i=>{
          const sum = saveSummary(slots[i]);
          return (
            <div key={i} className="panel" style={{padding:13,marginBottom:9,borderColor: sum? (sum.over?"#7c2a22":"#5a4a2c") : undefined}}>
              {sum ? (<div>
                <div className="flex items-center justify-between gap-2">
                  <div className="disp" style={{fontSize:15,fontWeight:700,color:"#e8d092",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sum.name}</div>
                  <span className="dim" style={{fontSize:12,whiteSpace:"nowrap"}}>{whenWord(sum.savedAt)}</span>
                </div>
                <div className="dim" style={{fontSize:14,margin:"3px 0 5px"}}>Week {sum.week} · {sum.title} · {sum.fame} fame</div>
                <div className="flex gap-3" style={{fontSize:14}}>
                  <span>{sum.men} men</span>
                  <span className="blood">{sum.fallen} fallen</span>
                  <span className="gold">{sum.freed} freed</span>
                </div>
                {sum.over && <div className="blood" style={{fontSize:14,fontStyle:"italic",marginTop:4}}>This house has fallen. Its ledger is closed.</div>}
                <div className="grid grid-cols-2 gap-2" style={{marginTop:9}}>
                  <button className="btn" onClick={()=>openSlot(i)}>{sum.over? "View the end":"Take up the keys"}</button>
                  <button className="btn btn-ghost" onClick={()=>wipeSlot(i)}>Strike it out</button>
                </div>
              </div>) : (<div>
                <div className="dim" style={{fontSize:15,fontStyle:"italic",marginBottom:8}}>An empty slot. Some ludus in Capua stands shuttered, waiting for a lanista.</div>
                <button className="btn" style={{width:"100%"}} onClick={()=>openSlot(i)}>Found a house here</button>
              </div>)}
            </div>
          );
        })}
        <button className="btn btn-ghost" style={{width:"100%",marginTop:4}} onClick={()=>{ setXfer({mode:"import"}); setXferIn(""); }}>Restore a house from a transfer code</button>
        <div className="dim" style={{textAlign:"center",fontSize:12.5,marginTop:10,fontStyle:"italic"}}>Three houses may run at once. Each keeps its own ledger between visits.</div>
      </div>
      {ask && (
        <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:70}} onClick={()=>setAsk(null)}>
          <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()} style={{borderColor: ask.danger? "#7c2a22":"#4e3c26"}}>
            <div className={`disp ${ask.danger?"blood":""}`} style={{fontSize:15,fontWeight:700,letterSpacing:".1em",marginBottom:8}}>{ask.title.toUpperCase()}</div>
            <div style={{fontSize:16}}>{ask.text}</div>
            <button className={`btn ${ask.danger?"btn-blood":""}`} style={{width:"100%",marginTop:14}}
              onClick={()=>{ const r=ask.run; setAsk(null); r(); }}>{ask.confirm}</button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setAsk(null)}>Think again</button>
          </div>
        </div>
      )}
    </div>
  );

  if(screen==="intro") return (
    <div className="lr" style={{display:"flex",alignItems:"safe center",justifyContent:"center",padding:20}}>
      <style>{CSS}</style>
      <div style={{maxWidth:460,width:"100%"}}>
        <div className="disp" style={{fontSize:46,fontWeight:900,textAlign:"center",letterSpacing:".22em",color:"#e8d092"}}>LVDVS</div>
        <div className="dim" style={{textAlign:"center",fontStyle:"italic",marginTop:2,marginBottom:18}}>Blood, sand, and the fortunes of a Roman house.</div>
        <div className="panel" style={{padding:14, marginBottom:12}}>
          <div className="tag" style={{marginBottom:8}}>Name your house</div>
          <input className="sel" aria-label="The name of your house" style={{width:"100%",boxSizing:"border-box"}} value={nameIn} onChange={e=>setNameIn(e.target.value)} maxLength={30}/>
          {legacy && legacy.houses>0 && (
            <div className="panel" style={{padding:11,margin:"14px 0 4px",background:"#1c1610",borderColor:"#4e3c26"}}>
              <div className="flex items-center justify-between" style={{marginBottom:4}}>
                <span className="tag tag-gold">What Capua remembers of you</span>
                <span className="rowval dim" style={{fontSize:12.5}}>{legacy.houses} house{legacy.houses===1?"":"s"}</span>
              </div>
              <div className="dim" style={{fontSize:13.5,marginBottom:6}}>
                {legacy.bouts} bouts · {legacy.freed} freed · {legacy.buried} buried · {legacy.years} years
                {legacy.best && ` · the best of them was ${legacy.best.name}, ${legacy.best.wins}–`}
              </div>
              {LEG_KEYS.map(k=>{ const L2 = LEGACIES[k], got = legacyEarned(legacy,k), have = legacy[k]||0;
                return (
                  <div key={k} style={{borderTop:"1px dotted #33271a",padding:"5px 0"}}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rowname disp" style={{fontSize:12.5,color:got?"#e8d092":"#8d7e65"}}>{L2.name}</span>
                      <span className="rowval dim" style={{fontSize:12}}>{Math.min(have,L2.need)}/{L2.need} {L2.unit}</span>
                    </div>
                    {got && <div className="dim" style={{fontSize:13,fontStyle:"italic"}}>{L2.say} <span className="laurel">{L2.boon}</span></div>}
                  </div>
                ); })}
            </div>
          )}
          <div className="tag" style={{margin:"16px 0 5px"}}>How hard Capua is</div>
          <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginBottom:6}}>
            The opening decides where you start. This decides what the town asks of you every week after.
          </div>
          {PITCH_KEYS.map(k=>{ const P = PITCHES[k];
            return (
              <button key={k} className={`optrow ${pitchIn===k?"on":""}`} style={{marginBottom:6,padding:10,
                borderColor: pitchIn===k ? "#c99a4b" : undefined}} onClick={()=>setPitchIn(k)}>
                <div className="flex items-center justify-between gap-2">
                  <span className="disp" style={{fontSize:13,color:pitchIn===k?"#e8d092":"#b09b7d"}}>{P.name}</span>
                  <span className="rowval dim" style={{fontSize:12}}>{P.tag}</span>
                </div>
                <div className="dim" style={{fontSize:13.5,marginTop:2,textAlign:"left"}}>{P.blurb}</div>
                {pitchIn===k && k!=="plain" && (
                  <div style={{fontSize:12.5,marginTop:4,textAlign:"left",color:k==="patron"?"#9aa86a":"#d8ac5f"}}>
                    purses ×{P.purse.toFixed(2)} · upkeep ×{P.upkeep.toFixed(2)} · unrest ×{P.unrest.toFixed(2)} · the block ×{P.market.toFixed(2)} · mending ×{P.heal.toFixed(2)} · missio {P.mercy>0?"+":""}{P.mercy}
                  </div>
                )}
              </button>
            ); })}
          <div className="tag" style={{margin:"14px 0 5px"}}>The seed</div>
          <input className="sel" aria-label="Seed — leave empty for a house nobody has run" style={{width:"100%",boxSizing:"border-box",letterSpacing:".12em"}}
            value={seedIn} onChange={e=>setSeedIn(e.target.value.toUpperCase())} maxLength={16}
            placeholder="leave empty for a house nobody has run"/>
          <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:4}}>
            The same seed builds the same Capua — the same men on the block, the same rivals, the same opening. What you do with it is still yours.
          </div>
        </div>
        <div className="panel" style={{padding:14, marginBottom:14}}>
          <div className="tag" style={{marginBottom:8}}>How you came by it</div>
          {SC_KEYS.map(k=>{ const S2 = SCENARIOS[k], on = bonus===k;
            return (
              <button key={k} className={`optrow ${on?"on":""}`} style={{marginBottom:7}} onClick={()=>setBonus(k)}>
                <div className="flex items-center justify-between gap-2">
                  <span className="disp" style={{fontSize:13.5,color:on?"#e8d092":"#e8d9b8"}}>{S2.name}</span>
                  <span className="rowval tag">{S2.tag}</span>
                </div>
                <div className="dim" style={{fontSize:14,marginTop:3}}>{S2.blurb}</div>
                <div className="flex gap-3" style={{fontSize:13,marginTop:5}}>
                  <span className="gold">{S2.gold}d</span>
                  <span style={{color:"#d8c08a"}}>{S2.fame} fame</span>
                  <span>{S2.men.length} {S2.men.length===1?"man":"men"}</span>
                  <span className="blood">unrest {S2.unrest}</span>
                </div>
              </button>
            ); })}
        </div>
        <button className="btn" style={{width:"100%",padding:"13px",fontSize:14}} onClick={begin}>Take the Keys</button>
        <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={toTitle}>Back to the records</button>
        <div className="dim" style={{textAlign:"center",fontSize:12.5,marginTop:10,fontStyle:"italic"}}>Slot {slot||1} of {SLOTS_N}. Your ledger keeps itself between visits.</div>
      </div>
    </div>
  );

  const roster = S.gladiators.filter(g=>!isGone(g));
  const eligible = roster.filter(g=>canFight(g) && g.lastFought < S.week);
  const selG = selId!=null ? S.gladiators.find(g=>g.id===selId) : null;
  const gamesWeeksAway = (3 - (S.week % 3)) % 3;
  const standings = [ ...(S.rivals||[]).map(h=>({name:`House ${h.name}`, lan:lanistaOf(h.name), fame:h.fame, grudge:h.grudge})),
    {name:S.name, fame:S.fame, you:true} ].sort((a,b)=>b.fame-a.fame);

  const MARKS = [
    ["Gladiatrix", "#c8aad4", "A woman on the sand. She fights as anyone does; the difference is at the gate, where the novelty draws a bigger crowd and better fame, and in the boxes, where the senator disapproves and the noblewoman does not."],
    ["Auctoratus · N left", "#9dc0d4", "A free man who sold himself to the arena. Paid up front and by the week rather than bought, contracted for a set number of bouts, and gone when they are served. He cannot be sold, the rudis means nothing to him, and he will not rise with the others."],
    ["✦ Primus of Capua", "#e8d092", "There is one man in this city the whole city can name, and for now he is yours. Worth fame every week — and a queue of challengers on nearly every card."],
    ["✦ rare fire", "#e8d092", "Something in this one the arena has not seen yet. A ceiling far above the block price, and usually a temper to match."],
    ["Firebrand", "#d96f5d", "You bought his name from an informer. He is the one the cells would follow. Free him and the whole conspiracy dies with the gesture."],
    ["Given up", "#d96f5d", "He asked you twice for the one thing he wanted and you did not answer. He has stopped asking, which costs more than either answer would have."],
    ["Your word", "#e8d092", "You promised him that thing. Keep it and he is yours entirely and the yard hears about it. Spend it and they hear about that instead."],
    ["With the doctore", "#e8d092", "He has the doctore's whole attention this week — far better for him, measurably worse for everyone else at the post."],
    ["Being remade · Nw", "#e8d092", "Three weeks off the sand while the doctore takes his style apart and rebuilds him as something else."],
    ["Kit failing", "#d96f5d", "Something he carries is close to breaking. Bought steel dulls and splits; have it seen to at the armoury before it goes in the middle of a bout."],
    ["A named piece", "#e8d092", "Steel your own smith made for this man alone. Better, slower to wear, unsellable, and it bends rather than breaks."],
    ["Young · Prime · Past peak · Veteran", "#b09b7d", "Where he stands on the hill. A man is in his prime from 23 to 28; before that he is still filling out, after it he starts giving pieces back."],
  ];
  const SHEETS = {
    lanista: { title:"THE LANISTA", body:()=>{ const L = S.lanista; if(!L) return null;
      const got = LAN_KEYS.filter(k=>hasLT(S,k));
      return (<>
        <div className="disp" style={{fontSize:17,fontWeight:700,color:"#e8d092"}}>{L.name}</div>
        <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:9}}>
          {L.age} years old · {yearOf(S)} year{yearOf(S)===1?"":"s"} at the head of this house
        </div>
        <div className="flex items-center justify-between" style={{fontSize:14,marginBottom:9}}>
          <span>Rank</span><span style={{color:riseOf(S)>0?"#e8d092":"#cfc0a0"}}>{riseName(S)}{riseNext(S)?"":" · the top rung"}</span>
        </div>
        <div className="flex items-center justify-between" style={{fontSize:14}}>
          <span>Health</span><span style={{color:healthColour(L.health)}}>{healthWord(L.health)}</span>
        </div>
        <Bar v={L.health} label="health" color={`linear-gradient(90deg,#4a3a24,${healthColour(L.health)})`}/>
        <div className="dim" style={{fontSize:14,fontStyle:"italic",margin:"7px 0 12px"}}>
          {L.health>=80 ? "You are as well as a man in this trade gets."
           : L.health>=60 ? "The years are on you but not heavily."
           : L.health>=40 ? "You sleep badly and have stopped pretending otherwise."
           : L.health>=22 ? "The medicus has started giving you the look he gives the men."
           : "You should put your affairs in order. You will not, but you should."}
        </div>
        <div className="dim" style={{fontSize:13.5,marginBottom:8}}>
          Age, a house on the edge of fire, and every man you bury take something out of you. Feasts, a bath house and an ordinary quiet week put a little back.
        </div>
        <div className="tag tag-gold" style={{margin:"0 0 4px"}}>After you</div>
        {S.heir ? (
          <div className="panel" style={{padding:9,marginBottom:10,background:"#1c1610",borderColor:"#5a6a35"}}>
            <div className="flex items-center justify-between gap-2">
              <span className="disp" style={{fontSize:13.5,color:"#e8d092"}}>{S.heir.name}</span>
              <span className="rowval dim" style={{fontSize:12.5}}>{HEIRS[S.heir.kind].name}</span>
            </div>
            <div className="dim" style={{fontSize:14,marginTop:3}}>{HEIRS[S.heir.kind].line}</div>
          </div>
        ) : (<>
          <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:7}}>
            Name nobody and this house is sold off in pieces the morning after you die. Name somebody and it goes on without you, carrying its men, its debts and none of your reputation.
          </div>
          {heirEligible(S).map(k=>(
            <button key={k} className="optrow" style={{marginBottom:6,padding:10}} onClick={()=>chooseHeir(k)}>
              <div className="flex items-center justify-between gap-2">
                <span className="disp" style={{fontSize:13,color:"#e8d092"}}>{HEIRS[k].name}</span>
                <span className="rowval dim" style={{fontSize:12}}>
                  keeps {Math.round(HEIRS[k].fameKeep*100)}% fame · {Math.round(HEIRS[k].favorKeep*100)}% standing
                </span>
              </div>
              <div className="dim" style={{fontSize:13.5,marginTop:2}}>{HEIRS[k].line}</div>
            </button>
          ))}
        </>)}
        {(S.forebears||[]).length>0 && (<>
          <div className="tag tag-gold" style={{margin:"12px 0 4px"}}>Those who had it before you</div>
          {(S.forebears||[]).map((f,i)=>(
            <div key={i} style={{borderTop:"1px dotted #33271a",padding:"6px 0"}}>
              <div className="flex items-center justify-between gap-2">
                <span className="rowname" style={{fontSize:14}}>{f.name}</span>
                <span className="rowval dim" style={{fontSize:12}}>died at {f.age} · week {f.to}</span>
              </div>
              {f.traits.length>0 && <div className="dim" style={{fontSize:13}}>{f.traits.map(t=>LAN_TRAITS[t].name).join(", ")}</div>}
            </div>
          ))}
        </>)}
        <div className="tag tag-gold" style={{margin:"12px 0 4px"}}>What Capua makes of you</div>
        {got.length===0 && <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>Nothing yet. You have not been at it long enough to be a type.</div>}
        {LAN_KEYS.map(k=>{ const T = LAN_TRAITS[k], has = hasLT(S,k);
          return (
            <div key={k} style={{borderTop:"1px dotted #33271a",padding:"6px 0",opacity:has?1:0.45}}>
              <div className="flex items-center justify-between gap-2">
                <span className="rowname disp" style={{fontSize:13,color:has?(T.bad?"#d96f5d":"#e8d092"):"#8d7e65"}}>{T.name}</span>
                <span className="rowval dim" style={{fontSize:12}}>{has? "yours" : T.earn}</span>
              </div>
              <div className="dim" style={{fontSize:14}}>{T.line}</div>
            </div>
          ); })}
      </>); } },
    factions: { title:"THE STANDS", body:()=>(<>
      <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:10}}>
        Capua is not one crowd. It is four, and two of them have hated each other since before you were born.
      </div>
      {FAC_KEYS.map(k=>{ const v = facOf(S,k), F = FACTIONS[k];
        return (
          <div key={k} style={{borderTop:"1px dotted #33271a",padding:"9px 0"}}>
            <div className="flex items-center justify-between gap-2">
              <span className="rowname disp" style={{fontSize:13.5,color:facColour(v)}}>{F.name}</span>
              <span className="rowval" style={{fontSize:12.5,color:facColour(v)}}>{facWord(v)} · {Math.round(v)}</span>
            </div>
            <Bar v={v} label={F.name} color={`linear-gradient(90deg,#4a3a24,${facColour(v)})`}/>
            <div className="dim" style={{fontSize:14,marginTop:4}}>{F.want}</div>
            <div className="dim" style={{fontSize:13,fontStyle:"italic"}}>They sit at {F.seat}. Courting them cools {FACTIONS[F.opposed].name.toLowerCase()}.</div>
          </div>
        ); })}
      <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:10}}>
        Whoever is warmest to you sets the purses you are offered; the shield factions set how loud the stands are when a man of that style walks out, and what a win is worth in fame. They all drift back toward indifference if you stop giving them reasons.
      </div>
    </>) },
    standings: { title:"THE HOUSES OF CAPUA", body:()=>(<>
<div className="panel" style={{padding:13}}>
  <div className="tag tag-gold" style={{marginBottom:8}}>The Houses of Capua</div>
  {standings.map((h,i)=>(
    <div key={h.name} className="flex items-center justify-between" style={{padding:"5px 0",borderBottom:"1px dotted #33271a"}}>
      <div className="rowname" style={{fontSize:15.5, color:h.you?"#e8d092":undefined}}>
        {!h.you && (S.rivals||[]).find(x=>x.name===h.name && x.away) && <span className="dim" style={{fontSize:12}}>away · </span>}
        {!h.you && (S.rivals||[]).find(x=>x.name===h.name && x.doctore) && <span className="laurel" style={{fontSize:12}}>doctore · </span>}
        <span className="dim" style={{marginRight:8,fontSize:13}}>{i+1}</span>
        {h.name}
        {!h.you && warmth(S,h.name)>=25
          ? <span style={{fontSize:12.5,marginLeft:7,fontStyle:"italic",color:warmth(S,h.name)>=50?"#9aa86a":"#b09b7d"}}>{houseWord(warmth(S,h.name))}</span>
          : !h.you && <span className="dim" style={{fontSize:12.5,marginLeft:7,fontStyle:"italic"}}>{grudgeWord(h.grudge)}</span>}
        {!h.you && h.lan.trait && <div className="dim" style={{fontSize:12.5,marginTop:1}}>{h.lan.name} — {h.lan.trait}</div>}
        {!h.you && (()=>{ const m=(S.metHouse||{})[h.name];
          return m && m.met>=4 ? <div className="dim" style={{fontSize:12,marginTop:1,fontStyle:"italic"}}>
            {m.met} cards against him{(S.rivals||[]).find(x=>x.name===h.name && x.retired) ? " · gone to a farm near Nola" : ""}
          </div> : null; })()}
      </div>
      <div className={`rowval ${h.you?"gold":"dim"}`} style={{fontSize:14}}>{rnd(h.fame)} fame</div>
    </div>
  ))}
  <div className="dim" style={{fontSize:13.5,marginTop:6,fontStyle:"italic"}}>Their men fill the card at the games. Beat them and their masters remember; kill them and they never forget.</div>
</div>
    </>) },
    book: { title:"THE RECORD BOOK", body:()=>{ const K = bookOf(S), B = K.B;
      const Row = ({l,v,sub}) => (
        <div className="flex items-center justify-between gap-2" style={{borderTop:"1px dotted #33271a",padding:"5px 0"}}>
          <span className="rowname" style={{fontSize:14.5}}>{l}{sub && <span className="dim" style={{fontSize:12.5}}> · {sub}</span>}</span>
          <span className="rowval" style={{fontSize:14,color:"#e0bd72"}}>{v}</span>
        </div>);
      const Table = ({title, rows, fmt}) => rows.length ? (
        <>
          <div className="tag tag-gold" style={{margin:"12px 0 3px"}}>{title}</div>
          {rows.map(r=>(
            <div key={r.k} className="flex items-center justify-between gap-2" style={{borderTop:"1px dotted #33271a",padding:"5px 0"}}>
              <span className="rowname" style={{fontSize:14.5}}>{fmt? fmt(r.k) : r.k}</span>
              <span className="rowval" style={{fontSize:13.5}}>
                <span style={{color:r.pc>=55?"#9aa86a":r.pc>=45?"#b09b7d":"#d96f5d"}}>{r.pc}%</span>
                <span className="dim"> · {r.w}–{r.n-r.w}</span>
              </span>
            </div>
          ))}
        </>) : null;
      return (<>
        <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>
          Everything this house has done, since the day you were given the keys to it.
        </div>
        <div className="tag tag-gold" style={{marginBottom:3}}>The house</div>
        {romeRuns(S)>0 && <Row l="Rome" v={romeWord(S)}
          sub={`${romeRuns(S)} visit${romeRuns(S)===1?"":"s"}${romeTriumphs(S)?`, ${romeTriumphs(S)} taken`:""}, best ${romeBest(S)} of 3`}/>}
        <Row l="Seed" v={S.seed || "—"} sub="the same one builds the same Capua"/>
        <Row l="Years standing" v={K.R2.years} sub={(S.generation||1)>1 ? `${S.generation} lanistae` : null}/>
        <Row l="Bouts fought" v={B.n} sub={B.n? `${K.winPc}% won` : null}/>
        <Row l="Men and women served" v={K.R2.served}/>
        <Row l="Victories" v={K.R2.w}/>
        <Row l="Killed by your men" v={B.killed}/>
        <Row l="Buried" v={K.R2.lost} sub={S.collegium? `${S.collegium.buried} under the stone` : null}/>
        <Row l="Freed" v={K.R2.freed} sub={S.honoured? `${S.honoured} given games` : null}/>
        <Row l="Purses taken" v={`${Math.round(B.purse)}d`} sub={B.n? `${K.perBout}d a bout` : null}/>
        <Row l="Average crowd" v={K.avgCrowd}/>
        {B.biggest && <Row l="Largest single purse" v={`${B.biggest.purse}d`} sub={`${B.biggest.name}, week ${B.biggest.week}`}/>}
        {B.longest && <Row l="Longest bout" v={`${B.longest.rounds} rounds`} sub={`${B.longest.name} against ${B.longest.opp}`}/>}
        <Table title="By tier" rows={K.rank(B.tier)}/>
        <Table title="By style" rows={K.rank(B.cls)}/>
        <Table title="By stakes" rows={K.rank(B.stakes)}/>
        <Table title="By kind of bout" rows={K.rank(B.kind)}/>
        <Table title="Where" rows={K.rank(B.city)} fmt={k=>k==="capua"?"Capua":CITIES[k]?CITIES[k].name:k}/>
        <Table title="Against the great houses" rows={K.rank(B.house)} fmt={k=>"House "+k}/>
        {K.best && (<>
          <div className="tag tag-gold" style={{margin:"12px 0 3px"}}>The best man it ever had</div>
          <div style={{borderTop:"1px dotted #33271a",padding:"6px 0"}}>
            <div className="disp" style={{fontSize:14.5,color:"#e8d092"}}>{K.best.nick? `${K.best.name}, ${K.best.nick}` : K.best.name}</div>
            <div className="dim" style={{fontSize:14}}>
              {K.best.wins}–{K.best.losses}{K.best.kills? `, ${K.best.kills} killed`:""} · {FATES[K.best.fate] ? FATES[K.best.fate].label.toLowerCase() : "still serving"}
            </div>
          </div>
        </>)}
        <div className="tag tag-gold" style={{margin:"12px 0 3px"}}>How they ended</div>
        {Object.entries(K.fates).sort((a,b)=>b[1]-a[1]).map(([f,c])=>(
          <div key={f} className="flex items-center justify-between gap-2" style={{borderTop:"1px dotted #33271a",padding:"5px 0"}}>
            <span className="rowname" style={{fontSize:14.5,color:FATES[f]? FATES[f].colour : "#b09b7d"}}>
              {FATES[f] ? FATES[f].label : "Still serving"}
            </span>
            <span className="rowval dim" style={{fontSize:13.5}}>{c}</span>
          </div>
        ))}
        {(S.forebears||[]).length>0 && (<>
          <div className="tag tag-gold" style={{margin:"12px 0 3px"}}>The line</div>
          {[...(S.forebears||[]), { name:S.lanista.name, age:S.lanista.age, to:null, traits:S.lanista.traits }].map((f,i)=>(
            <div key={i} className="flex items-center justify-between gap-2" style={{borderTop:"1px dotted #33271a",padding:"5px 0"}}>
              <span className="rowname" style={{fontSize:14.5}}>{f.name}</span>
              <span className="rowval dim" style={{fontSize:13}}>{f.to? `died at ${f.age}, week ${f.to}` : `holds it now, ${f.age}`}</span>
            </div>
          ))}
        </>)}
      </>); } },
    glossary: { title:"WHAT THE MARKS MEAN", body:()=>(<>
      <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:10}}>
        Every tag on a man says something the ledger does not.
      </div>
      <div className="tag tag-gold" style={{marginBottom:4}}>The styles</div>
      {Object.entries(CLASSES).map(([c,C])=>(
        <div key={c} style={{borderTop:"1px dotted #33271a",padding:"7px 0"}}>
          <div className="flex items-center justify-between gap-2">
            <span className="rowname disp" style={{fontSize:13,color:"#e8d092"}}>{c}</span>
            <span className="rowval dim" style={{fontSize:12}}>{C.key.map(k=>STAT_NAMES[k]).join(" · ")}</span>
          </div>
          <div className="dim" style={{fontSize:14}}>{C.desc}</div>
          <div style={{fontSize:13,color:"#9aa86a"}}>Beats {COUNTERS[c]} · beaten by {Object.keys(COUNTERS).find(k=>COUNTERS[k]===c)}</div>
        </div>
      ))}
      <div className="tag tag-gold" style={{margin:"12px 0 4px"}}>Where they came from</div>
      {Object.entries(ORIGINS).map(([o,O])=>{
        const up = Object.entries(O.mod).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]).map(([k])=>STAT_NAMES[k]);
        const dn = Object.entries(O.mod).filter(([,v])=>v<0).map(([k])=>STAT_NAMES[k]);
        return (
          <div key={o} style={{borderTop:"1px dotted #33271a",padding:"6px 0"}}>
            <div className="flex items-center justify-between gap-2">
              <span className="rowname disp" style={{fontSize:13}}>{o}</span>
              <span className="rowval" style={{fontSize:12,color:"#9aa86a"}}>{up.join(", ")||"—"}{dn.length?<span className="blood"> · {dn.join(", ")} short</span>:null}</span>
            </div>
            <div className="dim" style={{fontSize:14}}>The {O.blurb}.</div>
          </div>
        );
      })}
      <div className="tag tag-gold" style={{margin:"12px 0 4px"}}>Marks on a man</div>
      {MARKS.map(([t,col,txt])=>(
        <div key={t} style={{borderTop:"1px dotted #33271a",padding:"7px 0"}}>
          <span className="tag" style={{borderColor:col,color:col,marginBottom:3,display:"inline-block"}}>{t}</span>
          <div className="dim" style={{fontSize:14}}>{txt}</div>
        </div>
      ))}
      <div className="tag tag-gold" style={{margin:"12px 0 4px"}}>Bearing</div>
      <div className="dim" style={{fontSize:14,marginBottom:6}}>
        How much fire is in him. The best fighters carry the most, which is the whole problem with owning them.
      </div>
      {[[10,"Compliant"],[35,"Watchful"],[55,"Restless"],[75,"Defiant"],[92,"A storm barely chained"]].map(([v,l])=>(
        <div key={l} className="flex items-center justify-between gap-2" style={{fontSize:14,padding:"2px 0"}}>
          <span className="rowname">{l}</span>
          <span className="rowval dim" style={{fontSize:12.5}}>{v<25?"no trouble in him":v<45?"watching you":v<65?"talking to others":v<85?"one reason away":"the yard follows him"}</span>
        </div>
      ))}
      <div className="tag tag-gold" style={{margin:"12px 0 4px"}}>The weapon on his card</div>
      <div className="dim" style={{fontSize:14}}>
        The gold tag is whatever he is actually carrying. Gear outside his own style still works, but clumsily — a net-man behind a legionary's shield is worse than useless.
      </div>
    </>) },
    house:  { title:"THE HOUSE",          body:()=>(<><div className="panel" style={{padding:13}}>
  <div className="flex items-center justify-between" style={{marginBottom:7}}>
    <span className="tag tag-gold">The House</span>
    <span className="dim" style={{fontSize:13}}>{bUpkeep(S)}d / week</span>
  </div>
  {BKEYS.map(k=>{
    const B = BUILDINGS[k], L = bLevel(S,k), next = L<3 ? B.cost[L] : null;
    return (
      <div key={k} style={{borderTop:"1px dotted #33271a",paddingTop:9,marginTop:9}}>
        <div className="flex items-center justify-between gap-2">
          <span className="disp" style={{fontSize:13.5,color:L?"#e8d092":"#b09b7d"}}>{B.name}</span>
          <span className="rowval dim" style={{fontSize:12.5}}>{B.short}</span>
        </div>
        <div className="flex gap-1" style={{margin:"5px 0"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{flex:1,height:5,borderRadius:99,background:i<L?"#c99a4b":"#33271a"}}/>
          ))}
        </div>
        <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>
          {L ? B.levels[L-1] : B.desc}
        </div>
        {next!=null ? (
          <button className="btn" style={{width:"100%",marginTop:7}} disabled={S.gold<next} onClick={()=>build(k)}>
            {S.gold<next ? `${L? "Improve":"Build"} · ${next}d — not enough coin` : `${L? "Improve":"Build"} · ${next}d`}
          </button>
        ) : <div className="tag tag-gold" style={{marginTop:6}}>As good as any in Capua</div>}
      </div>
    );
  })}
</div></>) },
    feats:  { title:"FEATS OF THE HOUSE", body:()=>(<>{(()=>{ const got = FEAT_KEYS.filter(k=>hasFeat(S,k));
  return (
    <div className="panel" style={{padding:13}}>
      <div className="flex items-center justify-between" style={{marginBottom:7}}>
        <span className="tag tag-gold">Feats of the House</span>
        <span className="dim" style={{fontSize:13}}>{got.length}/{FEAT_KEYS.length}</span>
      </div>
      {got.length===0 && <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:7}}>Nothing yet that anyone would write down.</div>}
      {FEAT_KEYS.map(k=>{ const F = FEATS[k], done = hasFeat(S,k);
        return (
          <div key={k} style={{borderTop:"1px dotted #33271a",padding:"6px 0"}}>
            <div className="flex items-center justify-between gap-2">
              <span className="rowname disp" style={{fontSize:13,color:done?"#e8d092":"#8d7e65"}}>{F.name}</span>
              {done
                ? <span className="rowval laurel" style={{fontSize:12}}>year {Math.floor((S.feats[k]-1)/YEAR_WEEKS)+1}</span>
                : <span className="rowval dim" style={{fontSize:12}}>—</span>}
            </div>
            <div className="dim" style={{fontSize:13.5,opacity:done?1:0.6}}>{F.desc}</div>
            {F.perk && <div style={{fontSize:13,color:done?"#9aa86a":"#5a5240"}}>{PERKS[F.perk]}</div>}
          </div>
        ); })}
    </div>
  ); })()}</>) },
    repute: { title:"WHAT CAPUA SAYS",    body:()=>(<>{(()=>{ const st = repStyle(S), tot = repTotal(S);
  if(tot < 6) return null;
  return (
    <div className="panel" style={{padding:13}}>
      <div className="flex items-center justify-between" style={{marginBottom:6}}>
        <span className="tag tag-gold">What Capua Says</span>
        {st && <span className="disp" style={{fontSize:13,color:"#e8d092"}}>{REP_KINDS[st].name.toUpperCase()}</span>}
      </div>
      {REP_ORDER.map(k=>(
        <div key={k} style={{marginBottom:5}}>
          <div className="flex items-center justify-between" style={{fontSize:13.5}}>
            <span className={st===k?"gold":"dim"}>{REP_KINDS[k].name}</span>
            <span className="rowval dim" style={{fontSize:12.5}}>{Math.round(repShare(S,k)*100)}%</span>
          </div>
          <Bar v={repShare(S,k)*100} label={REP_KINDS[k].name}
            color={st===k? "linear-gradient(90deg,#8a6a2c,#d8ac5f)" : "#5a4a34"}/>
        </div>
      ))}
      <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:6}}>
        {st ? REP_KINDS[st].line : "Nobody has decided what kind of house this is yet."}
      </div>
    </div>
  ); })()}</>) },
  };

  return (
    <div className={`lr shell${prefs.reduceMotion?" reduce-motion":""}${prefs.largeText?" large-text":""}${prefs.colorblind?" cb":""}`}>
      <style>{CSS}</style>

      <div className="bar" style={{position:"fixed",top:0,left:0,right:0,zIndex:20,background:"linear-gradient(180deg,#1d1610,rgba(23,18,16,.96))",borderBottom:"1px solid #3e2f1f",padding:"calc(10px + env(safe-area-inset-top)) 14px 10px"}}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2" style={{minWidth:0}}>
            {S.crest && <Crest crest={S.crest} size={26}/>}
            <div style={{minWidth:0}}>
              <div className="disp" style={{fontSize:15,fontWeight:900,color:"#e8d092",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{S.name.toUpperCase()}{(S.generation||1)>1 && <span style={{fontSize:12,color:"#b09b7d"}}> · {["","","II","III","IV","V","VI","VII"][S.generation]||S.generation}</span>}</div>
              <div className="dim" style={{fontSize:12.5}}>{seasonOf(S).name} · year {yearOf(S)}, week {yearWeek(S)} · {S.travel? "on the road" : S.city? CITIES[S.city].name : fameTitle(S.fame)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2" style={{flexShrink:0}}>
            <button className="btn btn-ghost" aria-label="Settings" style={{padding:"10px 10px"}} onClick={()=>setShowSettings(true)}><Settings size={16} aria-hidden="true"/></button>
            {(()=>{ const W = weekWeight(S);
              const blocked = !!S.pendingEvent || !!S.doctoreOffer || !!S.romeOffer || !!S.reSignOffer || !!S.over;
              if(W.kind==="quiet" && !blocked){
                const n = weeksToSomething(S, 6);
                return (
                  <span className="flex gap-2">
                    <button className="btn btn-ghost" onClick={advance}>End Week</button>
                    <button className="btn" onClick={runOn} style={{whiteSpace:"nowrap"}}>
                      Let it run · {n}w
                    </button>
                  </span>
                );
              }
              return <button className="btn" onClick={advance} disabled={blocked}>End Week</button>;
            })()}
          </div>
        </div>
        <div className="flex items-center gap-3" style={{marginTop:7,fontSize:13.5,flexWrap:"wrap"}}>
          <span className="flex items-center gap-1 gold"><Coins size={13} aria-hidden="true"/>{rnd(S.gold)}</span>
          <span className="flex items-center gap-1" style={{color:"#d8c08a"}}><Star size={13} aria-hidden="true"/>{rnd(S.fame)}</span>
          <span className="flex items-center gap-1" style={{color:"#bfa8c8"}}><Crown size={13} aria-hidden="true"/>{rnd(S.favor)}</span>
          {S.loan && (
            <span className="flex items-center gap-1" style={{color: owes(S)>S.loan.principal*2 ? "#d96f5d":"#d8ac5f"}}>
              <Coins size={13} aria-hidden="true"/>−{owes(S)}
            </span>
          )}
          {S.lanista && S.lanista.health < 45 && (
            <span className="flex items-center gap-1" style={{color:healthColour(S.lanista.health)}}>
              <Flame size={13} aria-hidden="true"/>you: {healthWord(S.lanista.health)}
            </span>
          )}
          <span className="flex items-center gap-1" style={{color:"#cf5a49",marginLeft:"auto"}}><Flame size={13} aria-hidden="true"/>{unrestWord(S.unrest)}</span>
        </div>
      </div>

      <div className="scroll" style={{width:"100%"}}><div style={{width:"100%",maxWidth:640,margin:"0 auto",padding:"calc(var(--hdr-h,84px) + 14px) 14px calc(var(--nav-h,72px) + 14px)"}}>

        {(()=>{ const L = lessonFor(S, tab); if(!L || S.flags.noLessons) return null;
          return (
            <div className="panel" style={{padding:13,marginBottom:12,borderColor:"#6d5426",background:"linear-gradient(165deg,#2b2216,#1d1610)"}}>
              <div className="flex items-center justify-between gap-2" style={{marginBottom:5}}>
                <span className="tag tag-gold">The gatekeeper — {L.title}</span>
              </div>
              <div style={{fontSize:15.5}}>{L.text}</div>
              <div className="grid grid-cols-2 gap-2" style={{marginTop:10}}>
                <button className="btn" onClick={()=>mut(d=>{ d.flags.learned = Object.assign({}, d.flags.learned, {[L.id]:1}); })}>Understood</button>
                <button className="btn btn-ghost" onClick={()=>mut(d=>{ d.flags.noLessons = 1; })}>I know my trade</button>
              </div>
            </div>
          ); })()}


        {tab==="ludus" && (<div className="flex flex-col gap-3">
          {(()=>{ const ALL = agenda(S), AG = allTodos ? ALL : ALL.slice(0, 7), rest = ALL.length - AG.length;
            const TABN = { ludus:"Ludus", men:"Familia", arena:"Arena", armory:"Armory", market:"Market", villa:"Villa" };
            const banners = [];
            if(S.war && !S.war.done) banners.push(["#7c2a22", warStage(S).name, "the war in the south"]);
            if(S.primus) banners.push([S.primus.mine?"#c99a4b":"#4e3c26", S.primus.mine?"Primus of Capua":`Primacy · ${S.primus.house}`, S.primus.mine?S.primus.name:""]);
            if(S.nemesis) banners.push(["#7c2a22", S.nemesis.name, "has your measure"]);
            if(S.saga){ const sg = S.gladiators.find(x=>x.id===S.saga.gid);
              if(sg) banners.push(["#c99a4b", sg.name, S.saga.stage>=3?"his reckoning is set":"the crowd's champion"]); }
            if(aedileOn(S)) banners.push([S.aedile.friendly?"#5a6a35":S.aedile.hostile?"#7c2a22":"#3e2f1f", "The aedile", S.aedile.friendly?"owes you":S.aedile.hostile?"knows whose list":"neutral"]);
            if(S.city) banners.push(["#6d5426", CITIES[S.city].name, "you are on the circuit"]);
            if(S.travel) banners.push(["#6d5426", "On the road", `${S.travel.weeks}w`]);
            if(canClaimRise(S)) banners.push(["#c99a4b", `Received as ${riseNext(S).name}`, "your standing awaits"]);
            return (<>
              {banners.length>0 && (
                <div className="flex gap-2" style={{flexWrap:"wrap"}}>
                  {banners.map((b,i)=>(
                    <div key={i} className="panel" style={{padding:"10px 9px",borderColor:b[0],flex:"1 1 auto",minWidth:0}}>
                      <div className="disp" style={{fontSize:12,color:"#e8d092",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b[1]}</div>
                      {b[2] && <div className="dim" style={{fontSize:11.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b[2]}</div>}
                    </div>
                  ))}
                </div>
              )}
              <div className="panel" style={{padding:9}}>
            <LudusPlan S={S}/>
            <div className="flex items-center justify-between" style={{marginTop:6}}>
              <span className="dim" style={{fontSize:13,fontStyle:"italic"}}>
                {(()=>{ const built = BKEYS.reduce((n,k)=>n+bLevel(S,k),0), works = workAny(S).length;
                  return built===0 ? "Four walls, a yard, and whatever you brought with you."
                    : works>0 ? `${built} of 15 wings raised, and ${works} thing${works===1?"":"s"} that will outlast you.`
                    : `${built} of 15 wings raised.`; })()}
              </span>
              <span className="rowval dim" style={{fontSize:12.5}}>{activeG(S).length} in the yard</span>
            </div>
          </div>

          {(()=>{ const C = charterAt(S); if(!C) return null;
                const i = S.charter.i;
                return (
                  <div className="panel" style={{padding:13,borderColor:"#6d5426",background:"#1c1610"}}>
                    <div className="flex items-center justify-between" style={{marginBottom:5}}>
                      <span className="tag tag-gold">The first year</span>
                      <span className="rowval dim" style={{fontSize:12.5}}>{i+1} of {CHARTER.length}</span>
                    </div>
                    <div className="disp" style={{fontSize:15.5,color:"#e8d092"}}>{C.title}</div>
                    <div style={{fontSize:15,marginTop:3}}>{C.how}</div>
                    <div className="flex gap-2" style={{marginTop:8}}>
                      <button className="btn" style={{flex:1}} onClick={()=>setTab(C.tab)}>Take me there</button>
                      <button className="btn btn-ghost" style={{whiteSpace:"nowrap"}}
                        onClick={()=>setAsk({ title:"Leave Off The Charter", confirm:"I know the work",
                          text:"You will stop being told what to do next. Nothing else changes and it cannot be turned back on.",
                          run:()=>mut(d=>{ charterSkip(d); }) })}>I know the work</button>
                    </div>
                  </div>
                ); })()}
              <div className="panel" style={{padding:13, borderColor: AG.some(a=>a.urgency===3)?"#7c2a22":AG.length?"#6d5426":"#3e2f1f"}}>
                <div className="flex items-center justify-between" style={{marginBottom:6}}>
                  <span className="tag tag-gold">This week</span>
                  <span className="rowval dim" style={{fontSize:12.5}}>
                    {seasonOf(S).name.toLowerCase()} · year {yearOf(S)}, week {yearWeek(S)}
                  </span>
                </div>
                {AG.length===0
                  ? <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>
                      Nothing is asking anything of you. Train them, or find them something to do.
                    </div>
                  : AG.map((a,i)=>(
                      <button key={i} className="optrow" style={{padding:"10px 9px",marginBottom:5,borderColor:URG[a.urgency].c}}
                        onClick={()=>setTab(a.tab)}>
                        <div className="flex items-center justify-between gap-2">
                          <span style={{fontSize:14.5,color:a.urgency===3?"#e8d9b8":"#cfc0a0",textAlign:"left"}}>{a.label}</span>
                          <span className="rowval" style={{fontSize:12,color:URG[a.urgency].c,whiteSpace:"nowrap"}}>{URG[a.urgency].w}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="dim" style={{fontSize:13,textAlign:"left"}}>{a.sub}</span>
                          <span className="rowval" style={{fontSize:11.5,color:"#8e7e5c",whiteSpace:"nowrap"}}>{TABN[a.tab]||""} ›</span>
                        </div>
                      </button>
                    ))}
                {(()=>{ const C = counsel(S); if(!C) return null;
                  return (
                    <div style={{borderTop:"1px dotted #4e3c26",marginTop:8,paddingTop:8}}>
                      <div className="flex gap-2" style={{alignItems:"flex-start"}}>
                        {S.doctore && <div style={{flex:"0 0 auto",width:46,height:46,borderRadius:"50%",overflow:"hidden",border:"1px solid #5a6a4a"}}>
                          <DoctoreBust name={S.doctore.name} size={46}/>
                        </div>}
                        <div style={{minWidth:0}}>
                          <span className="tag" style={{borderColor:"#5a6a4a",color:"#9aa86a"}}>The doctore</span>
                          <div style={{fontSize:14.5,fontStyle:"italic",color:"#cfc0a0",marginTop:3}}>{C.say(S)}</div>
                        </div>
                      </div>
                    </div>
                  ); })()}
                {rest > 0 && (
                  <button className="btn btn-ghost" style={{width:"100%",marginTop:3,padding:"10px 9px",fontSize:11}} onClick={()=>setAllTodos(true)}>
                    Show {rest} more
                  </button>
                )}
                {allTodos && ALL.length > 7 && (
                  <button className="btn btn-ghost" style={{width:"100%",marginTop:3,padding:"10px 9px",fontSize:11}} onClick={()=>setAllTodos(false)}>
                    Show fewer
                  </button>
                )}
              </div>
            </>); })()}
          <div className="panel" style={{padding:16,textAlign:"center"}}>
            <div className="disp" style={{fontSize:21,fontWeight:900,letterSpacing:".15em",color:"#e8d092"}}>{S.name.toUpperCase()}</div>
            <div className="dim" style={{fontStyle:"italic"}}>A ludus of Capua — {fameTitle(S.fame)}</div>
            <div className="flex justify-center gap-4" style={{marginTop:8,fontSize:14.5}}>
              <span>Familia {roster.length}/8</span>
              <span className="blood">Fallen {S.fallen.length}</span>
              <span className="gold">Freed {S.freed.length}</span>
            </div>
            {(()=>{ const reg = activeG(S);
              const avgReg = reg.length ? reg.reduce((n,g)=>n+regardOf(g),0)/reg.length : 0;
              const rows = [
                ["Fame", rnd(S.fame), standing("fame", S.fame, S.week)],
                ["Coin", rnd(S.gold), standing("gold", S.gold, S.week)],
                ["The cells", `${Math.round(S.unrest)} unrest`, standingLow("unrest", S.unrest)],
                ["What they make of you", Math.round(avgReg), standing("regard", avgReg, S.week)],
              ].filter(r=>r[2]);
              return (
                <div style={{marginTop:10,borderTop:"1px dotted #33271a",paddingTop:7}}>
                  <div className="dim" style={{fontSize:12,marginBottom:4,letterSpacing:".08em"}}>
                    AGAINST A HOUSE {S.week} WEEKS OLD
                  </div>
                  {rows.map(([label,v,st],i)=>(
                    <div key={i} className="flex items-center justify-between gap-2" style={{padding:"3px 0"}}>
                      <span className="rowname" style={{fontSize:13.5}}>{label}</span>
                      <span className="flex items-center gap-2">
                        <span className="rowval" style={{fontSize:13.5,color:"#e0bd72"}}>{v}</span>
                        <span style={{fontSize:12,color:st.colour,whiteSpace:"nowrap",minWidth:118,textAlign:"right"}}>{st.word}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ); })()}
          </div>
          {S.rome && (
            <div className="panel" style={{padding:14,borderColor:"#c99a4b",background:"linear-gradient(165deg,#2f2415,#1d1610)"}}>
              <div className="disp" style={{fontSize:15,fontWeight:900,letterSpacing:".14em",color:"#e8d092",marginBottom:5}}>ROME</div>
              {S.rome.travel>0 ? (
                <div style={{fontSize:15.5}}>On the road north — {S.rome.travel} week{S.rome.travel>1?"s":""} of wagons and tolls. Nothing happens in Capua now.</div>
              ) : (
                <div>
                  <div style={{fontSize:15.5}}>Bout {Math.min(S.rome.fought+1, ROME_BOUTS)} of {ROME_BOUTS} on the imperial sand. <span className="gold">{S.rome.won} won.</span></div>
                  <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:4}}>
                    Two of three carries the house home made. One or none and it does not come home at all.
                  </div>
                </div>
              )}
              <div className="flex gap-1" style={{marginTop:8}}>
                {Array.from({length:ROME_BOUTS}).map((_,i)=>(
                  <div key={i} style={{flex:1,height:6,borderRadius:99,
                    background: i<S.rome.won ? "#c99a4b" : i<S.rome.fought ? "#7c2a22" : "#33271a"}}/>
                ))}
              </div>
            </div>
          )}
          {(S.rivalLog||[]).length>0 && (
            <div className="panel" style={{padding:13}}>
              <div className="flex items-center justify-between" style={{marginBottom:6}}>
                <span className="tag">The other houses</span>
                <span className="rowval dim" style={{fontSize:12.5}}>
                  {(S.rivals||[]).filter(h=>h.away).length? `${(S.rivals||[]).filter(h=>h.away).length} away` : "all in Capua"}
                </span>
              </div>
              {(S.rivalLog||[]).slice(0,5).map((r,i)=>(
                <div key={i} style={{borderTop:"1px dotted #33271a",padding:"6px 0"}}>
                  <div style={{fontSize:14.5}}>{r.text}</div>
                  <div className="dim" style={{fontSize:12}}>week {r.week}</div>
                </div>
              ))}
            </div>
          )}


          {(()=>{ const on = earOn(S), inside = earInside(S);
            const ear = inside ? S.gladiators.find(g=>g.id===S.ear.gid) : null;
            return (
              <div className="panel" style={{padding:13, borderColor: on? "#4e3c26":undefined}}>
                <div className="flex items-center justify-between" style={{marginBottom:5}}>
                  <span className="tag">The cells at night</span>
                  {on && <span className="rowval dim" style={{fontSize:12.5}}>
                    {inside ? `${ear? ear.name : "—"} is listening` : `the gatekeeper · ${EAR_FEE}d a week`}</span>}
                </div>
                {(S.yardMissed||0) > 0 && (
                  <div className="dim" style={{fontSize:13,fontStyle:"italic",marginBottom:6}}>
                    {S.yardMissed} thing{S.yardMissed===1?"":"s"} {S.yardMissed===1?"has":"have"} happened in that block that nobody told you about.
                  </div>
                )}
                {!on ? (<>
                  <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>
                    Everything about these men reaches you as a word like "restless". Somebody has to be listening, and there are only two kinds of somebody.
                  </div>
                  <button className="btn btn-ghost" style={{width:"100%",marginBottom:6}} disabled={S.gold<EAR_FEE*4}
                    onClick={()=>setEar("gate")}>Pay the gatekeeper · {EAR_FEE}d a week</button>
                  <div className="dim" style={{fontSize:13.5,marginBottom:5}}>Or put one of your own inside it. He hears far more, and if they work out who he is, it costs the whole yard.</div>
                  {activeG(S).filter(g=>!isAuctor(g)).map(g=>(
                    <button key={g.id} className="optrow" style={{marginBottom:5,padding:9}} onClick={()=>setEar("man", g.id)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="disp" style={{fontSize:13}}>{g.name}</span>
                        <span className="rowval dim" style={{fontSize:12.5}}>{demeanor(g.defiance).toLowerCase()}</span>
                      </div>
                    </button>
                  ))}
                </>) : (<>
                  {(S.heard||[]).length===0
                    ? <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>Nothing worth carrying up this week.</div>
                    : (S.heard||[]).map((h,i)=>(
                        <div key={i} style={{borderTop:"1px dotted #33271a",padding:"7px 0",fontSize:15}}>{h}</div>
                      ))}
                  {inside && (
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:7}}>
                      {(S.ear.risk||0) > 90 ? "He is going to be found out. It is a question of which week."
                       : (S.ear.risk||0) > 45 ? "He has been at this a while now. Men notice a man who is always nearby."
                       : "Nobody suspects him yet."}
                    </div>
                  )}
                  <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setEar(null)}>
                    {inside ? "Take him off it" : "Stop the retainer"}
                  </button>
                </>)}
              </div>
            ); })()}





          <div className="grid grid-cols-2 gap-2">
            {[["house","The House", `${BKEYS.filter(k=>bLevel(S,k)>0).length}/5 built`],
              ["feats","Feats", `${FEAT_KEYS.filter(k=>hasFeat(S,k)).length}/${FEAT_KEYS.length}`],
              ["repute","What Capua Says", repStyle(S)? REP_KINDS[repStyle(S)].name : "undecided"],
              ["annals","The Annals", `${(S.annals||[]).length} served`],
              ["lanista","The Lanista", S.lanista? `${S.lanista.age}, ${healthWord(S.lanista.health)}` : "—"],
              ["factions","The Stands", FACTIONS[facTop(S)].short + " " + facWord(facOf(S,facTop(S)))],
              ["book","The Record Book", `${(S.book&&S.book.n)||0} bouts`],
              ["carry","Carry It Out", "share this house"],
              ["standings","The Houses", (()=>{ const me = [...(S.rivals||[]).map(h=>h.fame), S.fame].sort((a,b)=>b-a);
                return `${me.indexOf(S.fame)+1} of ${me.length} in Capua`; })()],
              ["chron","The Chronicle", `${S.log.length} line${S.log.length===1?"":"s"}`]].map(([k,l,sub])=>(
              <button key={k} className="optrow" style={{padding:11}}
                onClick={()=>k==="annals"? setAnnals(true) : k==="carry"? carryOut() : k==="chron"? setShowChron(true) : setSheet(k)}>
                <div className="disp" style={{fontSize:12.5,color:"#e8d092"}}>{l}</div>
                <div className="dim" style={{fontSize:13.5,marginTop:2}}>{sub}</div>
              </button>
            ))}
          </div>

          {(()=>{ const now = festivalNow(S), soon = nextFestivals(S, 3);
            return (
              <div className="panel" style={{padding:13, borderColor: now? "#8a6a2c":undefined}}>
                <div className="flex items-center justify-between" style={{marginBottom:6}}>
                  <span className="tag tag-gold">The Year</span>
                  <span className="dim" style={{fontSize:13}}>year {yearOf(S)} · week {yearWeek(S)}</span>
                </div>
                {(()=>{ const Sn = seasonOf(S);
                  return (
                    <div style={{marginBottom:8}}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="disp" style={{fontSize:14,fontWeight:700,
                          color: Sn.key==="winter"?"#9dc0d4" : Sn.key==="summer"?"#d8ac5f" : Sn.key==="autumn"?"#c99a4b":"#9aa86a"}}>
                          {Sn.name.toUpperCase()}
                        </span>
                        <span className="rowval dim" style={{fontSize:12.5}}>{Sn.months}</span>
                      </div>
                      <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:2}}>{Sn.line}</div>
                      <div className="flex gap-3" style={{fontSize:12.5,marginTop:4,flexWrap:"wrap"}}>
                        {Sn.purse!==1 && <span style={{color:Sn.purse>1?"#9aa86a":"#d96f5d"}}>purses ×{Sn.purse.toFixed(2)}</span>}
                        {Sn.train!==1 && <span style={{color:Sn.train>1?"#9aa86a":"#d96f5d"}}>training ×{Sn.train.toFixed(2)}</span>}
                        {Sn.fat!==1 && <span style={{color:Sn.fat<1?"#9aa86a":"#d96f5d"}}>fatigue ×{Sn.fat.toFixed(2)}</span>}
                        {Sn.upkeep>0 && <span className="blood">+{Sn.upkeep}d a man</span>}
                        {Sn.heal!==1 && <span style={{color:Sn.heal>1?"#9aa86a":"#d96f5d"}}>mending ×{Sn.heal.toFixed(2)}</span>}
                        {Sn.pits!==1 && <span className="blood">pits ×{Sn.pits.toFixed(2)}</span>}
                      </div>
                    </div>
                  ); })()}
                {now ? (<div style={{marginBottom:8}}>
                  <div className="disp" style={{fontSize:15,fontWeight:700,color:"#e8d092"}}>{now.name.replace(/^the /,"").toUpperCase()}</div>
                  <div style={{fontSize:15,marginTop:3}}>{now.blurb}</div>
                </div>) : (S.munera ? (<div style={{marginBottom:8}}>
                  <div className="disp" style={{fontSize:14,fontWeight:700,color:"#d96f5d"}}>FUNERAL GAMES</div>
                  <div style={{fontSize:15,marginTop:3}}>A death in a noble house, and the old kind of games to mark it. Double purses, and every bout sine missione — that is what these were for.</div>
                </div>) : <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>No festival this week. The pits are always open.</div>)}
                <div className="flex gap-1" style={{marginBottom:6}}>
                  {Array.from({length:YEAR_WEEKS}).map((_,i)=>{ const w=i+1;
                    const f=CALENDAR.find(x=>x.w===w), cur=w===yearWeek(S);
                    const sn = SEASONS.slice().reverse().find(x=>w>=x.at) || SEASONS[0];
                    const base = sn.key==="winter"?"#2a3238" : sn.key==="summer"?"#33291a" : sn.key==="autumn"?"#2f2617" : "#25301f";
                    return <div key={i} title={f?f.name:sn.name} style={{flex:1,height:cur?9:6,borderRadius:2,
                      background: cur ? "#e8d092" : f ? (f.rest? "#5a6a35":"#8a6a2c") : base}}/>;
                  })}
                </div>
                {soon.filter(f=>weeksUntil(S,f)>0).slice(0,2).map(f=>(
                  <div key={f.key} className="flex items-center justify-between gap-2" style={{fontSize:14,padding:"2px 0"}}>
                    <span className="rowname dim">{f.name} <span style={{fontSize:12.5}}>· {f.month}</span></span>
                    <span className="rowval" style={{fontSize:13,color:"#c0b492"}}>{weeksUntil(S,f)} week{weeksUntil(S,f)===1?"":"s"}</span>
                  </div>
                ))}
              </div>
            ); })()}



          <div className="panel" style={{padding:13}}>
            <div className="flex items-center justify-between" style={{marginBottom:6}}>
              <span className="tag tag-gold">The Training Square</span>
              {S.doctore && <span className="dim" style={{fontSize:13}}>{S.doctore.wage}d / week</span>}
            </div>
            {S.doctore ? (<div>
              <div className="flex gap-3" style={{alignItems:"center",marginBottom:6}}>
                <div style={{flex:"0 0 auto",width:60,height:60,borderRadius:"50%",overflow:"hidden",border:"1px solid #6d5426"}}>
                  <DoctoreBust name={S.doctore.name} size={60}/>
                </div>
                <div style={{minWidth:0}}>
                  <div className="disp" style={{fontSize:15,fontWeight:700,color:"#e8d092"}}>
                    {S.doctore.name}{S.doctore.nick? <span style={{color:"#d8c08a"}}>, {S.doctore.nick}</span>:null}
                  </div>
                  <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginTop:5}}>
                    <span className="tag">{docWord(S.doctore.skill)}</span>
                    <span className="tag tag-gold">{STAT_NAMES[S.doctore.spec]}</span>
                    {S.doctore.fromHouse && <span className="tag tag-gold">✦ of this house</span>}
                  </div>
                </div>
              </div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>{S.doctore.past}.</div>
              {S.doctore.tag && (<>
                <div style={{fontSize:14.5,marginTop:5,color:"#cfc0a0"}}>
                  <span className="laurel">{S.doctore.name}, {S.doctore.tag}.</span> {S.doctore.pastLine}
                </div>
                {docCreed(S) && (
                  <div className="panel" style={{padding:9,marginTop:7,background:"#1c1610"}}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="disp" style={{fontSize:13,color:"#e8d092"}}>He {docCreed(S).name}</span>
                      <span className="rowval dim" style={{fontSize:12}}>
                        {(()=>{ const C=docCreed(S), b=[];
                          if(C.train!==1 && C.train!=null) b.push(`training ×${C.train.toFixed(2)}`);
                          if(C.strain!=null) b.push(`strain ×${C.strain.toFixed(2)}`);
                          if(C.regard) b.push(`regard ${C.regard>0?"+":""}${C.regard}/wk`);
                          if(C.calm) b.push(`unrest −${C.calm}/wk`);
                          if(C.injure) b.push(`injuries ×${C.injure.toFixed(2)}`);
                          return b.join(" · "); })()}
                      </span>
                    </div>
                    <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:2}}>{docCreed(S).line}</div>
                    {docSays(S) && <div style={{fontSize:14,marginTop:5,borderTop:"1px dotted #33271a",paddingTop:5}}>{docSays(S)}</div>}
                  </div>
                )}
              </>)}
              <div style={{fontSize:14.5,marginTop:6}}>
                Training <span className="laurel">+{Math.round((docTrain(S,"__none")-1)*100)}%</span> to all,
                <span className="laurel"> +{Math.round((docTrain(S,S.doctore.spec)-1)*100)}%</span> to {STAT_NAMES[S.doctore.spec].toLowerCase()}.
                Fewer men torn in training{S.doctore.fromHouse? ", and the cells quieter for it":""}.
              </div>
              {(()=>{ const p = docPupil(S) ? S.gladiators.find(g=>g.id===docPupil(S)) : null;
                return (
                  <div className="panel" style={{padding:10,marginTop:9,background:"#1c1610",borderColor:p?"#c99a4b":"#4e3c26"}}>
                    <div className="tag tag-gold" style={{marginBottom:5}}>His week</div>
                    {p ? (
                      <div>
                        <div style={{fontSize:15}}>
                          {S.doctore.retrainTo
                            ? <>Remaking <span className="gold">{p.name}</span> as a {S.doctore.retrainTo.toLowerCase()} — {S.doctore.retrainLeft} week{S.doctore.retrainLeft===1?"":"s"} left.</>
                            : <>Working only on <span className="gold">{p.name}</span>.</>}
                        </div>
                        <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:3}}>
                          {S.doctore.retrainTo
                            ? "He trains at nothing else until it is finished."
                            : "Far more for him, far less for everyone else — and some weeks the doctore turns something up."}
                        </div>
                        <button className="btn btn-ghost" style={{width:"100%",marginTop:7}}
                          onClick={()=>S.doctore.retrainTo ? stopRetrain() : setPupil(p.id)}>
                          {S.doctore.retrainTo ? "Call it off" : "Back to the whole yard"}
                        </button>
                      </div>
                    ) : (
                      <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>
                        Drilling the whole familia. Send him to one man from that man's page and the rest of the yard will feel it.
                      </div>
                    )}
                  </div>
                ); })()}
              <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={dismissDoc}>Dismiss him</button>
            </div>) : (<div>
              <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>
                No one runs the square but you. A doctore drills harder than a lanista can, and a man you freed will drill hardest of all.
              </div>
              {(S.doctoreMarket||[]).length===0 && <div className="dim" style={{fontSize:14}}>No one worth the wage is looking for work. Ask again after the next market.</div>}
              {(S.doctoreMarket||[]).map(c=>(
                <div key={c.id} style={{borderTop:"1px dotted #33271a",paddingTop:9,marginTop:9}}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="disp" style={{fontSize:14}}>{c.name} of {c.origin}</span>
                    <span className="gold" style={{fontSize:14,whiteSpace:"nowrap"}}>{c.fee}d + {c.wage}/wk</span>
                  </div>
                  <div className="flex items-center gap-1" style={{flexWrap:"wrap",margin:"4px 0"}}>
                    <span className="tag">{docWord(c.skill)}</span>
                    <span className="tag tag-gold">{STAT_NAMES[c.spec]}</span>
                  </div>
                  <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>{c.past}.</div>
                  <button className="btn" style={{width:"100%",marginTop:7}} disabled={S.gold<c.fee} onClick={()=>hireDoc(c.id)}>
                    {S.gold<c.fee ? "Not enough coin" : `Take him on — ${c.fee}d`}
                  </button>
                </div>
              ))}
            </div>)}
          </div>
          <div className="panel" style={{padding:13}}>
            <div className="flex items-center justify-between" style={{marginBottom:4}}>
              <span className="tag tag-blood">Unrest in the cells</span>
              <span className="blood" style={{fontSize:14}}>{unrestWord(S.unrest)}</span>
            </div>
            <Bar v={S.unrest} color="linear-gradient(90deg,#6a3a1a,#b8463a)"/>
            {S.rebellion && <div className="blood" style={{fontSize:14.5,marginTop:5,fontStyle:"italic"}}>
              {["","Whispers move between the cells after dark.","Conspiracy — steel is missing, and eyes follow the guards.","The spark is lit. Tonight decides everything."][S.rebellion.stage]}
            </div>}
            <div className="dim" style={{fontSize:13.5,marginTop:6}}>Cruelty, wasted deaths, and denied freedom feed it. Victories, feasts, and the rudis cool it. At its height, the house burns.</div>
            {(()=>{ const bros=(S.ties||[]).filter(t=>t.kind==="brother").length, riv=(S.ties||[]).filter(t=>t.kind==="rival").length;
              if(!bros && !riv) return null;
              return <div className="dim" style={{fontSize:13.5,marginTop:5,fontStyle:"italic"}}>
                In the cells: {bros} bond{bros===1?"":"s"}, {riv} feud{riv===1?"":"s"}. Fighters who trust each other are worth more on the sand and more dangerous in the dark.
              </div>; })()}
          </div>
          {S.week<=2 && (
            <div className="panel" style={{padding:13}}>
              <div className="tag tag-gold" style={{marginBottom:6}}>The lanista's first lessons</div>
              <div style={{fontSize:15}}>Fight in the pits to earn coin and fame — first blood keeps your men alive; anything bloodier down there is a coin flip with a blade. At 25 fame the editors take notice and the games open, where famed men are far more likely to be spared. Train between bouts, watch fatigue, and mind the fire in your men — the best fighters are often the most dangerous to own.</div>
            </div>
          )}
          <div className="panel" style={{padding:13}}>
            {S.flags.noLessons && (
              <button className="btn btn-ghost" style={{width:"100%",marginBottom:9}}
                onClick={()=>mut(d=>{ d.flags.noLessons = 0; d.flags.learned = {}; })}>Ask the gatekeeper again</button>
            )}
            <div className="tag" style={{marginBottom:6}}>The Ledger</div>
            {S.flags.underwritten > 0 && (
              <div className="panel" style={{padding:9,marginBottom:9,background:"#1c1610",borderColor:"#5a6a35"}}>
                <span className="laurel" style={{fontSize:14.5}}>The merchant is carrying your upkeep — {S.flags.underwritten} week{S.flags.underwritten===1?"":"s"} left.</span>
              </div>
            )}
            <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:8}}>
              This house is written down after every change{saved? ` — last kept ${whenWord(saved)}`:""}. Lift it out as a transfer code to carry it elsewhere, or keep it safe against a bad week.
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn btn-ghost" onClick={()=>setXfer({mode:"export"})}>Copy the ledger</button>
              <button className="btn btn-ghost" onClick={toTitle}>Back to the records</button>
            </div>
          </div>
        </div>)}

        {tab==="men" && (<div className="flex flex-col gap-3">
          <button className="optrow" style={{padding:10}} onClick={()=>setSheet("glossary")}>
            <div className="flex items-center justify-between gap-2">
              <span className="disp" style={{fontSize:12.5,color:"#e8d092"}}>What the marks mean</span>
              <span className="rowval dim" style={{fontSize:12.5}}>styles · origins · tags</span>
            </div>
          </button>
          {roster.length===0 && <div className="panel dim" style={{padding:16,textAlign:"center",fontStyle:"italic"}}>The cells stand empty. The market has men, if you have coin.</div>}
          {roster.map(g=>(
            <button key={g.id} className="panel" style={{width:"100%",textAlign:"left",padding:12,cursor:"pointer",color:"inherit",font:"inherit",borderColor:g.legend?"#8a6a2c":undefined}} onClick={()=>setSelId(g.id)}>
              <div className="flex items-center justify-between gap-2">
                <div className="disp" style={{fontSize:15,fontWeight:700}}>{g.name}{g.nick?<span style={{color:"#d8c08a"}}>, {g.nick}</span>:null}</div>
                <span className="dim" style={{fontSize:13.5,whiteSpace:"nowrap"}}>{g.wins}–{g.losses}{g.kills?` · ${g.kills} kills`:""}</span>
              </div>
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",margin:"6px 0"}}>
                <span className="tag">{g.cls}</span><span className="tag">{g.origin}</span>
                {g.legend && <span className="tag tag-gold">✦ rare fire</span>}
                {isF(g) && <span className="tag" style={{borderColor:"#8a6a9c",color:"#c8aad4"}}>Gladiatrix</span>}
                {isAuctor(g) && <span className="tag" style={{borderColor:"#5a7a8a",color:"#9dc0d4"}}>Auctoratus · {auctorLeft(g)} left</span>}
                {(()=>{ const bad = SLOTS.filter(s=>wears(GEAR[g.kit&&g.kit[s]]) && wearOf(g,s)<35).length;
                  return bad ? <span className="tag tag-blood">Kit failing</span> : null; })()}
                {Math.abs(formOf(g))>=24 && <span className="tag" style={{borderColor:formColour(formOf(g)),color:formColour(formOf(g))}}>{formWord(formOf(g))}</span>}
                {refusing(g) && <span className="tag tag-blood">Will not go out · {g.refusing.weeks}w</span>}
                {holdsPrimus(S,g) && <span className="tag tag-gold">✦ Primus of Capua</span>}
                {g.named && <span className="tag tag-gold">{g.named.title}</span>}
                {g.ambition && g.ambition.despair && <span className="tag tag-blood">Given up</span>}
                {g.ambition && g.ambition.promised && !g.ambition.met && !g.ambition.broken && <span className="tag tag-gold">Your word</span>}
                {docPupil(S)===g.id && <span className="tag tag-gold">{S.doctore.retrainTo? `Being remade · ${S.doctore.retrainLeft}w` : "With the doctore"}</span>}
                {S.rebellion && S.flags.leaderKnown && S.rebellion.leaderId===g.id && <span className="tag tag-blood">Firebrand</span>}
                {g.kit && GEAR[g.kit.weapon] && GEAR[g.kit.weapon].price>0 && <span className="tag tag-gold">{GEAR[g.kit.weapon].name}</span>}
                {g.status==="injured" && <span className="tag tag-blood">{g.injury.name} · {g.injury.weeks}w</span>}
                {g.status==="away" && <span className="tag">Away</span>}
                {rudisEligible(g) && <span className="tag tag-gold">Rudis earned</span>}
                {g.age>PRIME[1] && <span className="tag" style={{borderColor:g.age>31?"#7c2a22":undefined, color:g.age>31?"#d98476":undefined}}>{ageTag(g.age)} · {g.age}</span>}
                {(g.scars||[]).length>0 && <span className="tag">{g.scars.length} scar{g.scars.length>1?"s":""}</span>}
                {bodyWear(g)>=0.44 && <span className="tag" style={{borderColor:wornColour(bodyWear(g)),color:wornColour(bodyWear(g))}}>{wornWord(bodyWear(g))}</span>}
                {kinOf(S,g.id,"brother").length>0 && <span className="tag" style={{borderColor:"#5a6a35",color:"#b9c58a"}}>{kinOf(S,g.id,"brother").length} brother{kinOf(S,g.id,"brother").length>1?"s":""}</span>}
                {kinOf(S,g.id,"rival").length>0 && <span className="tag tag-blood">bad blood</span>}
                {isFavourite(g) && <span className="tag tag-gold">♦ crowd favourite</span>}
              </div>
              {g.status==="active" && <div className="dim" style={{fontSize:13.5,marginBottom:5}}>{regimenWord(S,g)}</div>}
              <div className="flex gap-3" style={{fontSize:12.5}}>
                <div style={{flex:1}}><span className="dim">Morale</span><Bar v={g.morale} color={LAUREL}/></div>
                <div style={{flex:1}}><span className="dim">Fatigue</span><Bar v={g.fatigue} color={BRONZE}/></div>
                <div style={{flex:1}}><span className="dim">Bearing</span><div style={{fontSize:13,color:g.defiance>60?"#cf5a49":"#cfc0a0"}}>{demeanor(g.defiance)}</div></div>
              </div>
            </button>
          ))}
        </div>)}

        {tab==="arena" && (<div className="flex flex-col gap-3">
          {S.nemHouse && (()=>{ const n = S.nemHouse; const L = lanistaOf(n.house).name;
            const grudgeLive = (S.deadlines||[]).some(x=>x.kind==="challenge" && x.nem && !x.met);
            const stageWord = grudgeLive ? "The grudge match is set — answer it on the sand"
              : n.stage>=2 ? "A season-long feud, building toward a reckoning"
              : "A house that means to end yours";
            const beat = (S.rivalLog||[]).find(r=>r.house===n.house);
            return (
              <div className="panel" style={{padding:13, borderColor:"#7c2a22", background:"#2a1512"}}>
                <div className="flex items-center justify-between" style={{marginBottom:4}}>
                  <span className="tag tag-blood">The Feud · House {n.house}</span>
                  <span className="rowval" style={{fontSize:12.5, color:"#d98476"}}>{L}</span>
                </div>
                <div className="dim" style={{fontSize:14, fontStyle:"italic", marginBottom:6}}>{stageWord}.</div>
                <Bar v={n.heat} label="bad blood" color="linear-gradient(90deg,#5a1a14,#d96f5d)"/>
                {beat && <div style={{fontSize:13.5, marginTop:6, color:"#cdb89a"}}>{beat.text}</div>}
                {grudgeLive && <div className="blood" style={{fontSize:13.5, marginTop:5, fontWeight:600}}>
                  The grudge match is on the card below — it will not wait past its day.
                </div>}
              </div>
            ); })()}
          {(()=>{ const rivals = (S.rivals||[]).filter(h=>!h.retired);
            if(!rivals.length || S.week < 16) return null;
            const ready = gambitReady(S);
            return (
              <div className="panel" style={{padding:12}}>
                <div className="flex items-center justify-between" style={{marginBottom:4}}>
                  <span className="tag tag-blood">What can be done quietly</span>
                  <span className="rowval dim" style={{fontSize:12}}>
                    {ready ? lawWord(S) : `not for ${6 - (S.week - (S.flags.gambitWeek||0))} weeks`}
                  </span>
                </div>
                <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginBottom:6}}>
                  They have been doing all of this to you since the day you opened. None of it is legal and all of it is ordinary.
                </div>
                {GAM_KEYS.map(k=>{ const G = GAMBITS[k], cost = G.cost(S);
                  const p = clamp(G.odds(S) - gambitDone(S,k)*0.07, 0.12, 0.86);
                  return (
                    <div key={k} style={{borderTop:"1px dotted #33271a",paddingTop:7,marginTop:7}}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rowname" style={{fontSize:14.5}}>{G.name}</span>
                        <span className="rowval gold" style={{fontSize:13}}>{cost}d</span>
                      </div>
                      <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:1}}>{G.blurb}</div>
                      <div style={{fontSize:12.5,marginTop:2,color:p>=0.55?"#9aa86a":p>=0.35?"#d8ac5f":"#d96f5d"}}>
                        about {Math.round(p*100)} in a hundred{gambitDone(S,k)>0 ? ` · you have tried this ${gambitDone(S,k)} time${gambitDone(S,k)>1?"s":""}` : ""}
                      </div>
                      {ready && S.gold >= cost && (
                        <div className="flex gap-2" style={{marginTop:5}}>
                          {rivals.map(h=>(
                            <button key={h.name} className="btn btn-ghost" style={{flex:1,padding:"10px 6px",fontSize:11}}
                              onClick={()=>setAsk({ title:G.name, danger:true, confirm:`Against ${h.name} · ${cost}d`,
                                text:`${G.blurb} About ${Math.round(p*100)} in a hundred it works. If it does not, it will be known that you tried, and the magistrate is ${lawWord(S)}.`,
                                run:()=>mut(d=>{ runGambit(d, k, h.name); }) })}>
                              {h.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ); })}
              </div>
            ); })()}
          {(()=>{ const p = pactOf(S); if(!p) return null;
            const P = PACTS[p.kind], pace = pactPace(S);
            const col = pace==="impossible" ? "#d96f5d" : pace==="behind" ? "#d8ac5f" : "#9aa86a";
            return (
              <div className="panel" style={{padding:12,borderColor:col}}>
                <div className="flex items-center justify-between" style={{marginBottom:3}}>
                  <span className="tag tag-gold">Your word is given</span>
                  <span className="rowval" style={{fontSize:12.5,color:col}}>
                    {pactOwed(S)} owed · {pactLeft(S)} weeks
                  </span>
                </div>
                <div className="disp" style={{fontSize:14.5,color:"#e8d092"}}>{P.name}</div>
                <Bar v={p.done/p.need*100} label="" color={`linear-gradient(90deg,#4a3a24,${col})`}/>
                <div className="dim" style={{fontSize:13.5,marginTop:3}}>
                  {p.done} of {p.need} given{p.rate ? `, ${p.rate}d a card` : ""}{p.bonus ? `, ${p.bonus}d at the end of it` : ""}.
                  {P.exclusive ? " Nobody else's games in Capua until it is done." : ""}
                </div>
                {pace==="impossible" && <div className="blood" style={{fontSize:13.5,marginTop:3}}>
                  There are not enough weeks left. Whatever happens now, it will be remembered as broken.
                </div>}
              </div>
            ); })()}
          <div className="panel" style={{padding:14}}>
            <div className="disp" style={{fontSize:15,fontWeight:700,letterSpacing:".04em",marginBottom:3}}>TO THE SAND</div>
            <div className="dim" style={{fontSize:14.5,marginBottom:11}}>
              {(()=>{ const n=((S.games&&S.games.offers)||[]).length;
                return `The pits are always open.${n? ` ${n} ${n===1?"card":"cards"} at the games this week.` : S.fame<TIERS[1].fame ? " Win to 25 fame in the pits and the editors will start sending cards." : " No games this week."}`; })()}
            </div>
            <button className="btn btn-blood" style={{width:"100%"}}
              onClick={()=>{ setArenaPick(null); setArenaStep(0); setFGid(null); setPairSel([]); setArenaWiz(true); }}>
              Choose a bout ›
            </button>
            {eligible.length===0 && <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:8}}>No one is fit to fight this week — rest and heal, then come back.</div>}
          </div>

          {(()=>{ const C = awayIn(S);
            if(S.travel) return (
              <div className="panel" style={{padding:13,borderColor:"#6d5426"}}>
                <div className="tag tag-gold" style={{marginBottom:5}}>On the road</div>
                <div style={{fontSize:15.5}}>
                  {S.travel.home ? "Back up the road to Capua" : `South for ${CITIES[S.travel.to].name}`} — {S.travel.weeks} week{S.travel.weeks===1?"":"s"}.
                </div>
                <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:3}}>Wagons, tolls, and nothing to fight for until you arrive.</div>
              </div>
            );
            if(C) return (
              <div className="panel" style={{padding:13,borderColor:"#6d5426"}}>
                <div className="flex items-center justify-between" style={{marginBottom:5}}>
                  <span className="tag tag-gold">{C.name}</span>
                  <span className="rowval dim" style={{fontSize:12.5}}>known here {Math.round(knownIn(S,S.city))}/100</span>
                </div>
                <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>{C.crowd}</div>
                <Bar v={knownIn(S,S.city)} label="local standing" color="linear-gradient(90deg,#6d5426,#d8ac5f)"/>
                <div className="dim" style={{fontSize:13.5,marginTop:5}}>
                  Capua counts for nothing on this sand — the editor here weighs what he has seen with his own eyes. Purses ×{C.purse.toFixed(2)}.
                </div>
                <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={goHome}>Break camp and go home</button>
              </div>
            );
            return (
              <div className="panel" style={{padding:13}}>
                <div className="disp" style={{fontSize:14,fontWeight:700,marginBottom:3}}>THE CIRCUIT</div>
                <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>
                  Three towns down the bay who have never heard of you. Nothing you have built in Capua travels — but neither do your grudges.
                </div>
                {bayHolder(S) && (
                  <div className="panel" style={{padding:10,marginBottom:8,background:"#2a1512",borderColor:"#7c2a22"}}>
                    <div className="tag tag-blood" style={{marginBottom:3}}>House {bayHolder(S)} has the bay</div>
                    <div style={{fontSize:14.5}}>
                      {baySince(S)} weeks of taking every card down the coast while your wagons stood in the yard.
                    </div>
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:3}}>
                      Turn up anywhere down there and it stops being theirs. Stay home and Capua keeps noticing.
                    </div>
                  </div>
                )}
                {CITY_KEYS.map(k=>{ const c = CITIES[k];
                  return (
                    <div key={k} style={{borderTop:"1px dotted #33271a",paddingTop:9,marginTop:9}}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="disp" style={{fontSize:13.5,color:knownIn(S,k)?"#e8d092":"#b09b7d"}}>{c.name}</span>
                        <span className="rowval dim" style={{fontSize:12.5}}>{c.travel}wk · purses ×{c.purse.toFixed(2)}</span>
                      </div>
                      <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:2}}>{c.blurb}</div>
                      {knownIn(S,k)>0 ? (<>
                        <div className="dim" style={{fontSize:13}}>They know you there: {Math.round(knownIn(S,k))}/100 — tier {cityTier(S,k)} cards.</div>
                        {!S.city && !S.travel && <div style={{fontSize:13,color:"#d8ac5f"}}>
                          Bleeding away at {BAY_DECAY.toFixed(2)} a week while you are not in it.
                        </div>}
                      </>) : (
                        <div className="dim" style={{fontSize:13}}>
                          A stranger there. A man of yours who goes down is spared about {bayWorth(S,k).strangerMercy}% of the time, against every time at home.
                        </div>
                      )}
                      <button className="btn" style={{width:"100%",marginTop:6}} disabled={!!S.rome} onClick={()=>takeRoad(k)}>Take the road · {c.travel} week{c.travel>1?"s":""}</button>
                    </div>
                  ); })}
              </div>
            ); })()}
        </div>)}

        {tab==="market" && (<div className="flex flex-col gap-3">
          {STAFF_KEYS.map(k=>{ const s = S[k], ST = STAFF[k], lvl = bLevel(S, ST.room);
            const mkt = (S.staffMarket||{})[k] || [];
            return (
              <div key={k} className="panel" style={{padding:13, borderColor: s? "#4e3c26":undefined}}>
                <div className="flex items-center justify-between" style={{marginBottom:5}}>
                  <span className="tag tag-gold">The {ST.name}</span>
                  {s && <span className="rowval dim" style={{fontSize:12.5}}>{s.wage}d / week</span>}
                </div>
                {!lvl ? (
                  <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>
                    You have no {ST.room==="valetudinarium"?"infirmary":"armoury"} for him to work in. Build the room first.
                  </div>
                ) : s ? (<>
                  <div className="disp" style={{fontSize:15,color:"#e8d092"}}>{s.name} <span className="dim" style={{fontSize:13}}>of {s.origin}</span></div>
                  <Bar v={s.skill} label="skill" color="linear-gradient(90deg,#4a3a24,#c99a4b)"/>
                  <div className="dim" style={{fontSize:14,marginTop:4}}>
                    {k==="medicus"
                      ? `Wounds close ${Math.round((medicusMult(S)-1)*100)}% faster than the room alone, and a wound is ${Math.round(medicusGuard(S)*100)}% less likely to set badly.`
                      : `Steel costs ${Math.round((1-armourerCut(S))*100)}% less, wears ${Math.round((1-armourerWear(S))*100)}% slower, and mends ${Math.round((armourerMend(S)-1)*100)}% faster.`}
                  </div>
                  <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:3}}>
                    {s.weeks} weeks in the house. He wants {ST.wants}.
                  </div>
                  <button className="btn btn-ghost" style={{width:"100%",marginTop:7}} onClick={()=>letStaffGo(k)}>Let him go</button>
                </>) : (<>
                  <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:7}}>{ST.blurb}</div>
                  {mkt.length===0
                    ? <div className="dim" style={{fontSize:14}}>Nobody is looking for a place this week.</div>
                    : mkt.map(c=>(
                        <button key={c.id} className="optrow" style={{marginBottom:6,padding:10}}
                          disabled={S.gold<c.fee} onClick={()=>hireStaff(k,c.id)}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="disp" style={{fontSize:13,color:"#e8d092"}}>{c.name} <span className="dim">of {c.origin}</span></span>
                            <span className="rowval gold" style={{fontSize:12.5}}>{c.fee}d · {c.wage}d/wk</span>
                          </div>
                          <div className="dim" style={{fontSize:13.5,marginTop:2}}>
                            {c.skill>=68?"Very good, and knows it." : c.skill>=50?"Sound enough." : "Cheap, and it will show."} · skill {c.skill}
                          </div>
                        </button>
                      ))}
                </>)}
              </div>
            ); })}
          <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>The slaver's block. Fresh stock every third week. Roster holds 8 men.</div>
          {(()=>{ const here = [...new Set((S.market||[]).map(g=>g.slaver).filter(Boolean))];
            if(!here.length) return null;
            return (
              <div className="panel" style={{padding:11}}>
                <div className="tag tag-gold" style={{marginBottom:5}}>Who is standing at the block</div>
                {here.map(k=>{ const S2 = slaverOf(k), x = dealings(S,k);
                  return (
                    <div key={k} style={{borderTop:"1px dotted #33271a",paddingTop:6,marginTop:6}}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rowname" style={{fontSize:14.5}}>{S2.full}</span>
                        <span className="rowval dim" style={{fontSize:12,whiteSpace:"nowrap"}}>{slaverWord(S,k)}</span>
                      </div>
                      <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:1}}>{S2.line}</div>
                      {(x.bought>0 || x.burned>0) && (
                        <div style={{fontSize:12.5,marginTop:2,color:x.burned>=2?"#d96f5d":"#8f7e62"}}>
                          {x.bought} bought from him{x.burned>0 ? `, ${x.burned} not what he said` : ""}
                          {slaverPrice(S,k)<1 ? ` · prices you ${Math.round((1-slaverPrice(S,k))*100)}% keener` : slaverPrice(S,k)>1 ? ` · ${Math.round((slaverPrice(S,k)-1)*100)}% dearer for you` : ""}
                        </div>
                      )}
                    </div>
                  ); })}
              </div>
            ); })()}
          {(()=>{ const p = paragonOf(S); if(!p) return null;
            const R2 = paragonReach(S, p), L = liquidate(S);
            const canNow = S.gold >= p.price, canAfter = S.gold + L.total >= p.price;
            const left = 3 - (S.week - (S.flags.paragonWeek||S.week));
            return (
              <div className="panel" style={{padding:13,borderColor:"#c99a4b",background:"#1c1610"}}>
                <div className="flex items-center justify-between" style={{marginBottom:4}}>
                  <span className="tag tag-gold">✦ The whole town has come to look</span>
                  <span className="rowval dim" style={{fontSize:12.5}}>{left>0?`${left} week${left===1?"":"s"} to decide`:"today or not at all"}</span>
                </div>
                <div className="disp" style={{fontSize:17,color:"#e8d092"}}>{fullName(p)}</div>
                <div className="dim" style={{fontSize:13.5,marginTop:1}}>
                  {p.origin} · {p.cls} · {p.wins}–{p.losses}{p.kills?`, ${p.kills} killed`:""} · {rnd(p.pfame)} renown · {p.age}
                </div>
                <div style={{fontSize:15,fontStyle:"italic",marginTop:5}}>{p.paragon.tale}</div>
                <div className="flex items-center justify-between gap-2" style={{marginTop:8}}>
                  <span className="rowname" style={{fontSize:15}}>They want</span>
                  <span className="rowval gold" style={{fontSize:16}}>{p.price}d</span>
                </div>
                <div className="dim" style={{fontSize:13.5}}>
                  You have {Math.round(S.gold)} in the box{R2.short>0 && ` — ${R2.short} short`}.
                </div>
                {canNow ? (
                  <button className="btn" style={{width:"100%",marginTop:8}} onClick={()=>buyG(p.id)}>
                    Pay it
                  </button>
                ) : (
                  <>
                    <div className="panel" style={{padding:10,marginTop:8,background:"#2a1512",borderColor:"#7c2a22"}}>
                      <div className="tag tag-blood" style={{marginBottom:3}}>Or take the house apart</div>
                      <div className="dim" style={{fontSize:13.5}}>
                        {L.steelN} pieces of steel off the racks, {L.debtN} debt{L.debtN===1?"":"s"} sold at a discount, and {L.menN} men led out through the gate — about <span className="gold">{L.total}d</span>.
                      </div>
                      <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:3}}>
                        {canAfter ? "It would be enough. Every man left will remember the morning it happened." : `It would still leave you ${p.price - S.gold - L.total} short, which settles it.`}
                      </div>
                    </div>
                    <button className="btn btn-ghost" style={{width:"100%",marginTop:6}} disabled={!canAfter}
                      onClick={()=>setAsk({ title:"Strip The House", danger:true, confirm:"Sell it all",
                        text:`Everything not on a man's back, every debt owed to you, and every gladiator but one. It raises about ${L.total} denarii and it cannot be undone.`,
                        run:takeHouseApart })}>
                      {canAfter ? "Take the house apart" : "Not even then"}
                    </button>
                  </>
                )}
              </div>
            ); })()}
          {S.market.filter(g=>!g.paragon).map(g=>(
            <div key={g.id} className="panel" style={{padding:12,borderColor:isAuctor(g)?"#5a7a8a":g.legend?"#8a6a2c":undefined}}>
              <div className="flex items-center justify-between">
                <div className="disp" style={{fontSize:15,fontWeight:700}}>{g.name}</div>
                <span className="gold" style={{fontSize:15}}>{g.price}d</span>
              </div>
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",margin:"5px 0"}}>
                <span className="tag">{g.cls}</span><span className="tag">{g.origin}</span>
                {isF(g) && <span className="tag" style={{borderColor:"#8a6a9c",color:"#c8aad4"}}>Gladiatrix</span>}
                {favourOf(g)>=40 && <span className="tag" style={{borderColor:favColour(favourOf(g)),color:favColour(favourOf(g))}}>{favWord(favourOf(g))}</span>}
                {masterOf(g) && g.mastery.cls===g.cls && <span className="tag tag-gold">✦ {MASTERY[g.mastery.cls].name}</span>}
                {g.benched && g.benched.weeks>0 && <span className="tag" style={{borderColor:"#6d5426",color:"#d8ac5f"}}>Kept apart · {g.benched.weeks}w</span>}
                {g.learning && <span className="tag" style={{borderColor:"#6d5426",color:"#d8ac5f"}}>At the far post · {g.learning.weeks}w</span>}
                {g.second && <span className="tag">Two trades</span>}
                {lastingOf(g).length>0 && <span className="tag tag-blood">{LASTING[lastingOf(g)[0]].name}</span>}
                {g.yardName && <span className="tag" style={{borderColor:"#5a6a4a",color:"#9aa86a"}}>"{g.yardName}"</span>}
                {!g.sworn && <span className="tag" style={{borderColor:"#6d5426",color:"#d8ac5f"}}>Not yet sworn</span>}
                {isDamn(g) && <span className="tag" style={{borderColor:"#7c2a22",color:"#d98476"}}>Condemned · {damnLeft(g)} to serve</span>}
                {isAuctor(g) && <span className="tag" style={{borderColor:"#5a7a8a",color:"#9dc0d4"}}>Auctoratus · free</span>}
                {g.warCaptive && <span className="tag tag-blood">Taken in the south</span>}
                {g.soldBy && <span className="tag">Sold on by House {g.soldBy}</span>}
                {g.slaver && <span className="tag" style={{borderColor:"#5a6a4a",color:"#9aa86a"}}>{slaverOf(g.slaver).name}</span>}
                <span className="tag" style={{borderColor:g.age>31?"#7c2a22":g.age<=PRIME[1]?"#5a6a35":undefined,
                  color:g.age>31?"#d98476":g.age<=PRIME[1]?"#b9c58a":undefined}}>{ageTag(g.age)} · {g.age}</span>
                {(g.scars||[]).length>0 && <span className="tag">{g.scars.length} scar{g.scars.length>1?"s":""}</span>}
              </div>
              {(()=>{ const lvl = readLevel(S, g), src2 = lvl>=1 ? g : (g.shown || g);
                return (<>
                  {g.pitch && !g.scouted && (
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginBottom:3}}>{g.pitch}</div>
                  )}
                  <div style={{fontSize:14.5,fontStyle:"italic",color:g.legend?"#e0bd72":"#cfc0a0"}}>
                    {g.legend ? "There is something in this one's eyes the arena has not yet seen."
                     : lvl>=2 ? `Assessed: ${potentialWord(g.potential)}. At ${g.age}, ${ageWord(g.age)}.`
                     : lvl>=1 ? `Your doctore walks round him once. ${potentialWord(g.potential)}, he thinks. At ${g.age}, ${ageWord(g.age)}.`
                     : `The seller talks him up and up. At ${g.age}, ${ageWord(g.age)}.`}
                  </div>
                  <div className="grid grid-cols-3 gap-2" style={{margin:"6px 0"}}>
                    {STATS.map(k=>{ const [lo,hi] = bandOf(src2[k], lvl);
                      return (
                        <div key={k}>
                          <div className="dim" style={{fontSize:12}}>{STAT_NAMES[k].slice(0,4)}</div>
                          <div style={{fontSize:14, color: lvl>=2 ? "#e8d9b8" : "#c0b492"}}>
                            {lvl>=2 ? rnd(g[k]) : `${lo}–${hi}`}
                          </div>
                        </div>
                      ); })}
                  </div>
                  {lvl<2 && (
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic"}}>
                      {lvl>=1
                        ? (g.flaw ? `${FLAWS[g.flaw].hint} Your doctore would want a closer look.` : "Your doctore finds nothing to object to, which is not the same as a guarantee.")
                        : "Nobody here has looked at him properly. The numbers are the seller's."}
                    </div>
                  )}
                  {lvl>=2 && (
                    <div className="panel" style={{padding:9,marginTop:6,background:"#1c1610",
                      borderColor: g.flaw ? "#7c2a22" : "#5a6a35"}}>
                      {g.flaw
                        ? <><span className="blood" style={{fontSize:14.5}}>{FLAWS[g.flaw].name}.</span>
                            <span className="dim" style={{fontSize:14}}> He {FLAWS[g.flaw].tell}.</span></>
                        : <span className="laurel" style={{fontSize:14.5}}>Nothing hidden. He is what he appears to be.</span>}
                    </div>
                  )}
                  {!g.scouted && !isAuctor(g) && (()=>{ const fee = SCOUT_FEE(S,g);
                    return <button className="btn btn-ghost" style={{width:"100%",marginTop:7}}
                      disabled={S.gold<fee} onClick={()=>scout(g.id)}>
                      {S.gold<fee ? `Have him looked over · ${fee}d` : `Have him looked over · ${fee}d`}
                    </button>; })()}
                </>); })()}
              {isAuctor(g) && (
                <div className="panel" style={{padding:9,marginTop:6,background:"#1c1610",borderColor:"#5a7a8a"}}>
                  <div style={{fontSize:14}}>Not for sale — he is free, and offering. {g.auctor.fee}d in hand, {g.auctor.wage}d a week, {g.auctor.bouts} bouts, then he walks.</div>
                  <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:3}}>{g.auctor.why}</div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2" style={{margin:"8px 0 2px",fontSize:12}}>
                {STATS.map(k=>(
                  <div key={k}><span className="dim">{STAT_NAMES[k].slice(0,4)}</span><Bar v={g[k]} color={CLASSES[g.cls].key.includes(k)?BRONZE:"#6a5a40"}/></div>
                ))}
              </div>
              <button className="btn" style={{width:"100%",marginTop:8}} disabled={S.gold<g.price || roster.length>=8} onClick={()=>buyG(g.id)}>
                {roster.length>=8? "The cells are full" : S.gold<g.price
                  ? "Not enough coin" : isAuctor(g) ? `Take his oath — ${g.price} denarii` : `Buy for ${g.price} denarii`}
              </button>
            </div>
          ))}
        </div>)}

        {tab==="villa" && (<div className="flex flex-col gap-3">
          <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>Favor opens doors fame cannot — sway in the arena when your man falls, and a seat at the primus when you have earned one.</div>

          <Sect title="House Colours" note={(S.crest&&S.crest.motto)||"colours, crest & motto"}>
            <div className="flex items-center gap-3" style={{marginBottom:11}}>
              <Crest crest={S.crest} size={54}/>
              <div>
                <div className="disp" style={{fontSize:15,color:"#e8d092"}}>{S.name}</div>
                {S.crest && S.crest.motto && <div style={{fontSize:14.5,fontStyle:"italic",color:"#cfc0a0"}}>“{S.crest.motto}”</div>}
                <div className="dim" style={{fontSize:12.5,marginTop:2}}>Your men fight in these colours — the plume they wear and the face of their shields.</div>
              </div>
            </div>
            <div className="tag" style={{marginBottom:6}}>The field</div>
            <div className="flex gap-2" style={{flexWrap:"wrap",marginBottom:11}}>
              {HOUSE_COLOURS.map(([hex,nm])=>(
                <button key={hex} aria-label={nm} title={nm} onClick={()=>setCrest({c1:hex})}
                  style={{width:30,height:30,borderRadius:8,background:hex,cursor:"pointer",padding:0,
                    border:(S.crest&&S.crest.c1===hex)?"2px solid #e8d092":"1px solid #3e2f1f"}}/>
              ))}
            </div>
            <div className="tag" style={{marginBottom:6}}>The device</div>
            <div className="flex gap-2" style={{flexWrap:"wrap",marginBottom:11}}>
              {HOUSE_COLOURS.map(([hex,nm])=>(
                <button key={hex} aria-label={nm} title={nm} onClick={()=>setCrest({c2:hex})}
                  style={{width:30,height:30,borderRadius:8,background:hex,cursor:"pointer",padding:0,
                    border:(S.crest&&S.crest.c2===hex)?"2px solid #e8d092":"1px solid #3e2f1f"}}/>
              ))}
            </div>
            <div className="tag" style={{marginBottom:6}}>The crest</div>
            <div className="flex gap-2" style={{flexWrap:"wrap",marginBottom:11}}>
              {CREST_SYMS.map(sym=>(
                <button key={sym} aria-label={sym} onClick={()=>setCrest({sym})}
                  style={{padding:5,borderRadius:8,background:"#1a1410",cursor:"pointer",lineHeight:0,
                    border:(S.crest&&S.crest.sym===sym)?"2px solid #e8d092":"1px solid #3e2f1f"}}>
                  <Crest crest={Object.assign({}, S.crest, { sym })} size={34}/>
                </button>
              ))}
            </div>
            <div className="tag" style={{marginBottom:6}}>The motto</div>
            <div className="flex gap-2" style={{flexWrap:"wrap"}}>
              <button className={`chip ${!S.crest||!S.crest.motto?"on":""}`} onClick={()=>setCrest({motto:""})}>None</button>
              {HOUSE_MOTTOS.map(m=>(
                <button key={m} className={`chip ${S.crest&&S.crest.motto===m?"on":""}`} onClick={()=>setCrest({motto:m})}>{m}</button>
              ))}
            </div>
          </Sect>

          <Sect title="Those Who Watch" note={`standing ${rnd(S.favor)}`} open>
            {(S.patrons||[]).length===0 && <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>No one of consequence has heard of you yet.</div>}
            {(S.patrons||[]).map(p=>{
              const w = p.want, item = w ? WANTS[w.kind] : null;
              const sub = w && w.gid ? S.gladiators.find(g=>g.id===w.gid) : null;
              return (
                <div key={p.id} style={{borderTop:"1px dotted #33271a",paddingTop:9,marginTop:9}}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="disp" style={{fontSize:14,color:patronColor(p.favor)}}>{p.name}</span>
                    <span className="tag">{RANKS[p.rank].name}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2" style={{margin:"4px 0 3px"}}>
                    <span style={{fontSize:14,color:patronColor(p.favor)}}>{patronWord(p.favor)}</span>
                    <span className="dim" style={{fontSize:12.5}}>
                      {p.served>0 && `${p.served} favour${p.served>1?"s":""} kept`}{p.served>0&&p.slighted>0 && " · "}{p.slighted>0 && `${p.slighted} slighted`}
                    </span>
                  </div>
                  <div className="track" style={{height:5}}>
                    <div className="fill" style={{width:`${p.favor}%`, background: p.favor<20? "linear-gradient(90deg,#7c2a22,#cf5a49)" : "linear-gradient(90deg,#6a5a2c,#d8ac5f)"}}/>
                  </div>
                  {w ? (
                    <div className="panel" style={{padding:9,marginTop:7,background:"#1c1610",borderColor:"#5a4a2c"}}>
                      <div className="flex items-center justify-between gap-2" style={{marginBottom:3}}>
                        <span className="tag tag-gold">He asks</span>
                        <span className="dim" style={{fontSize:12.5,whiteSpace:"nowrap"}}>{w.weeks} week{w.weeks===1?"":"s"} left</span>
                      </div>
                      <div style={{fontSize:14.5}}>{item.ask(S, p, sub)}</div>
                    </div>
                  ) : <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:4}}>{RANKS[p.rank].blurb}</div>}
                  {(()=>{ const F = FAVOURS[p.rank]; if(!F) return null;
                    const ready = favourReady(S, p), wait = favourWait(S, p);
                    return (
                      <div className="panel" style={{padding:9,marginTop:7,background:"#1c1610",
                        borderColor: ready ? "#c99a4b" : "#3e2f1f"}}>
                        <div className="flex items-center justify-between gap-2" style={{marginBottom:3}}>
                          <span className="tag" style={ready?{borderColor:"#c99a4b",color:"#e8d092"}:undefined}>{F.title}</span>
                          <span className="rowval dim" style={{fontSize:12.5}}>{F.cost} standing</span>
                        </div>
                        <div className="dim" style={{fontSize:13.5,fontStyle:"italic"}}>{F.ask}</div>
                        <button className={`btn ${ready?"":"btn-ghost"}`} style={{width:"100%",marginTop:6}}
                          disabled={!ready} onClick={()=>askFavour(p.id)}>
                          {wait ? `He has done enough for now · ${wait} week${wait===1?"":"s"}`
                            : p.favor < F.cost ? `Not owed enough · ${Math.round(p.favor)}/${F.cost}`
                            : !F.can(S) ? "Nothing for him to do just now"
                            : "Call it in"}
                        </button>
                      </div>
                    ); })()}
                </div>
              );
            })}
            <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:9}}>
              A patron kept warm leans on the editor when your man is in the sand. One left to go cold talks at the baths instead.
            </div>
          </Sect>

          {(()=>{ const rk = riseRank(S), nx = riseNext(S), need = riseNeed(S), can = canClaimRise(S);
            const stand = S.rise ? S.rise.standing : 0;
            return (
            <Sect title="Your Standing" note={rk.name} open={can}>
              <div className="disp" style={{fontSize:15,color:"#e8d092"}}>{rk.name}</div>
              <div className="dim" style={{fontSize:13.5,fontStyle:"italic",margin:"3px 0 9px"}}>{rk.blurb}</div>
              {riseOf(S)>0 && rk.perk && (
                <div className="panel" style={{padding:9,marginBottom:10,background:"#171712",borderColor:"#3e4a30"}}>
                  <span className="tag" style={{color:"#a9c98a",borderColor:"#3e4a30"}}>What it buys</span>
                  <div style={{fontSize:14,marginTop:3}}>{rk.perk}</div>
                </div>
              )}
              {nx ? (
                <div className="panel" style={{padding:11,background:"#1c1610",borderColor:can?"#c99a4b":"#3e2f1f"}}>
                  <div className="flex items-center justify-between gap-2" style={{marginBottom:5}}>
                    <span className="disp" style={{fontSize:13.5,color:can?"#e8d092":"#cfc0a0"}}>Next: {nx.name}</span>
                    <span className="tag">{nx.short}</span>
                  </div>
                  <div className="tag" style={{marginBottom:5}}>The town must grow used to you</div>
                  <div className="track" style={{height:6,marginBottom:9}}>
                    <div className="fill" style={{width:`${stand}%`, background: stand>=100? "linear-gradient(90deg,#6a5a2c,#e8d092)" : "linear-gradient(90deg,#4a4030,#c99a4b)"}}/>
                  </div>
                  {[["Renown", need.fame, rnd(S.fame), need.fameOk],
                    ["Patrons' favour", need.favor, rnd(S.favor), need.favorOk],
                    ["The price of the name", need.cost, rnd(S.gold), need.goldOk]].filter(r=>r[1]>0).map(([lbl,req,have,ok])=>(
                    <div key={lbl} className="flex items-center justify-between gap-2" style={{fontSize:13.5,padding:"2px 0"}}>
                      <span style={{color:ok?"#a9c98a":"#cfc0a0"}}>{ok?"✓":"·"} {lbl}</span>
                      <span className="rowval dim" style={{color:ok?"#a9c98a":undefined}}>{have} / {req}</span>
                    </div>
                  ))}
                  <button className={`btn ${can?"":"btn-ghost"}`} style={{width:"100%",marginTop:8}} disabled={!can} onClick={takeRise}>
                    {can ? `Take your place as ${nx.name}`
                      : !need.full ? "The town is not yet used to you"
                      : `Pay ${nx.cost}d to be received`}
                  </button>
                </div>
              ) : (
                <div className="panel" style={{padding:11,background:"#1c1610",borderColor:"#c99a4b"}}>
                  <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>There is no higher rung. A slaver climbed all the way to Rome, and men will tell the story long after the sand forgets your name.</div>
                </div>
              )}
            </Sect>
          ); })()}
          <Sect title="Throw a party" note="favor & fame">
          {Object.entries(PARTY).map(([k,p])=>(
            <div key={k} className="panel" style={{padding:13}}>
              <div className="flex items-center justify-between">
                <div className="disp" style={{fontSize:14,fontWeight:700}}>{p.label.toUpperCase()}</div>
                <span className="gold">{p.cost}d</span>
              </div>
              <div className="dim" style={{fontSize:14.5,margin:"4px 0 8px"}}>{p.desc} <span style={{color:"#bfa8c8"}}>+{k==="modest"?5:k==="lavish"?9:15} with every patron</span> · <span style={{color:"#d8c08a"}}>+{p.fame} fame</span></div>
              <button className="btn" style={{width:"100%"}} disabled={S.gold<p.cost || S.week-S.lastParty<2} onClick={()=>host(k)}>
                {S.week-S.lastParty<2? `The villa recovers — ${2-(S.week-S.lastParty)} week${2-(S.week-S.lastParty)>1?"s":""}` : S.gold<p.cost? "Not enough coin" : "Send invitations"}
              </button>
            </div>
          ))}
          </Sect>
          {lawOf(S).edicts.length>0 && (
            <Sect title="What the law says" note={lawWord(S)}>
              {lawOf(S).edicts.map(k=>{ const E = EDICTS[k], bad = (()=>{ try{ return E.check(S); }catch(e){ return false; } })();
                return (
                  <div key={k} style={{borderTop:"1px dotted #33271a",paddingTop:7,marginTop:7}}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rowname" style={{fontSize:14.5,color:bad?"#d98476":"#cfc0a0"}}>{E.name}</span>
                      {bad && <span className="tag tag-blood">in breach</span>}
                    </div>
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:1}}>
                      {bad ? E.broke(S)
                        : k==="numbers" ? `The edict allows ${lawCap(S)}. You keep ${S.gladiators.filter(g=>!isGone(g)).length}.`
                        : k==="vectigal" ? `${Math.round(lawTax(S)*100)}% on every man you buy.`
                        : k==="sine" ? `${lawSine(S)} denarii for the seal on every card without missio.`
                        : "The house is within it."}
                    </div>
                  </div>
                ); })}
              {lawOf(S).fines>0 && <div className="dim" style={{fontSize:13,marginTop:6}}>Paid in fines: {lawOf(S).fines}d</div>}
            </Sect>
          )}

          {(S.gold >= 4000 || Object.keys(S.works||{}).length>0) && (
            <Sect title="Great works" note={`${workAny(S).length} of ${WORK_KEYS.length}`}>
              <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:7}}>
                Things a house builds when it has outgrown buying men. They cost more than everything else put together and take years to finish.
              </div>
              {WORK_KEYS.map(k=>{ const W = WORKS[k], on = workOn(S,k), done = workDone(S,k);
                return (
                  <div key={k} style={{borderTop:"1px dotted #33271a",paddingTop:8,marginTop:8}}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="disp" style={{fontSize:13.5,color:done?"#e8d092":on?"#d8ac5f":"#b09b7d"}}>{W.name}</span>
                      <span className="rowval dim" style={{fontSize:12.5}}>
                        {done ? "standing" : on ? `${on.left} weeks` : `${W.cost}d · ${W.years} years`}
                      </span>
                    </div>
                    <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:2}}>{done ? W.done : W.blurb}</div>
                    {done && <div className="laurel" style={{fontSize:13.5,marginTop:3}}>{W.say}</div>}
                    {on && <Bar v={100 - on.left/(W.years*YEAR_WEEKS)*100} label="" color="linear-gradient(90deg,#4a3a24,#c99a4b)"/>}
                    {!done && !on && (
                      <button className="btn btn-ghost" style={{width:"100%",marginTop:6}}
                        disabled={S.gold < W.cost} onClick={()=>mut(d=>{ beginWork(d, k); })}>
                        {S.gold < W.cost ? `${W.cost}d — not yet` : `Begin it · ${W.cost}d`}
                      </button>
                    )}
                  </div>
                ); })}
            </Sect>
          )}

          <Sect title="The household" note={`${householdCount(S)} of ${HH_KEYS.length}`}>
            <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:7}}>
              A ludus was a household before it was a business. None of these people will ever be on a card and the place does not run without them.
            </div>
            {HH_KEYS.map(k=>{ const H = HOUSEHOLD[k], f = houseFolk(S)[k], fee = rnd(H.wage*18);
              return (
                <div key={k} style={{borderTop:"1px dotted #33271a",paddingTop:8,marginTop:8}}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="disp" style={{fontSize:13.5,color:f?"#e8d092":"#b09b7d"}}>
                      {f ? `${f.name} · ${H.name.toLowerCase()}` : H.name}
                    </span>
                    <span className="rowval dim" style={{fontSize:12.5}}>{f ? `${f.weeks}w · ${H.wage}d/wk` : (k==="wife" ? "—" : `${fee}d · ${H.wage}d/wk`)}</span>
                  </div>
                  <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:2}}>{f ? H.line : H.blurb}</div>
                  {!f && <button className="btn btn-ghost" style={{width:"100%",marginTop:6}}
                    disabled={k!=="wife" && S.gold<fee}
                    onClick={()=>mut(d=>{ hireFolk(d, k); })}>
                    {k==="wife" ? "She has always been here" : `Take her on · ${fee}d`}
                  </button>}
                </div>
              ); })}
          </Sect>

          {owedList(S).length>0 && (
            <Sect title="Owed to the house" note={`${owedTotal(S)}d · ${cashWord(S)}`}>
              <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginBottom:6}}>
                An editor who pays in sixty days is not the same as an editor who pays. You can wait, or sell the paper at {Math.round(discountRate(S)*100)}% to a man who does nothing else.
              </div>
              {owedList(S).map(x=>{ const late = S.week - x.due;
                return (
                  <div key={x.id} style={{borderTop:"1px dotted #33271a",paddingTop:7,marginTop:7}}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rowname" style={{fontSize:14.5}}>{x.from}</span>
                      <span className="rowval gold" style={{fontSize:13.5}}>{x.amount}d</span>
                    </div>
                    <div className="flex items-center justify-between gap-2" style={{marginTop:2}}>
                      <span style={{fontSize:13,color: late>=4?"#d96f5d" : late>0?"#d8ac5f" : "#8d7e65"}}>
                        {late >= 4 ? `${late} weeks late and not at home` : late > 0 ? `${late} week${late===1?"":"s"} late` : `due in ${x.due - S.week}`}
                      </span>
                      <button className="btn btn-ghost" style={{padding:"10px 9px",fontSize:12}}
                        onClick={()=>mut(d=>{ sellDebt(d, x.id); })}>
                        Sell it for {rnd(x.amount*discountRate(S))}d
                      </button>
                    </div>
                  </div>
                ); })}
            </Sect>
          )}

          {(()=>{ const D = doctrineOf(S);
            return (
              <Sect title="The doctrine of the house" note={D? D.name : "none set"}>
                {D ? (<>
                  <div className="disp" style={{fontSize:16,color:"#e8d092"}}>{D.name}</div>
                  <div style={{fontSize:15,fontStyle:"italic",marginTop:3}}>{D.creed}</div>
                  <div className="dim" style={{fontSize:14,marginTop:5}}>{D.body}</div>
                  <div className="laurel" style={{fontSize:13.5,marginTop:5}}>{D.note}</div>
                </>) : (
                  <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>
                    This house has no school. It does what the week asks and Capua forms its own opinion, which is the opinion you deserve.
                  </div>
                )}
                <div style={{marginTop:9}}>
                  {DOC_KEYS.filter(k=>!docIs(S,k)).map(k=>{ const X = DOCTRINES[k];
                    const fee = D ? rnd(X.cost*1.8) : X.cost;
                    return (
                      <button key={k} className="optrow" style={{marginBottom:6,padding:10}}
                        disabled={S.gold<fee} onClick={()=>declare(k)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="disp" style={{fontSize:13,color:"#e8d092"}}>{X.name}</span>
                          <span className="rowval gold" style={{fontSize:12.5}}>{fee}d</span>
                        </div>
                        <div className="dim" style={{fontSize:13.5,marginTop:2,textAlign:"left"}}>{X.note}</div>
                      </button>
                    ); })}
                </div>
                {D && <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:4}}>
                  Turning the house over costs nearly twice as much, twenty fame, and a week of every man wondering what the last year was for.
                </div>}
              </Sect>
            ); })()}

          {S.election && !S.election.done && (
            <Sect title="The aedileship" note={`${Math.max(0, 3-(S.week-S.election.week))}w to the vote`} open>
              <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>
                The names are on the walls. The aedile is the man who decides whose gladiators are on the card, what they are paid, and — when one of them is down and looking up — whether he leans forward.
              </div>
              {S.election.cands.map(c=>{
                const mine = S.election.backed===c.id;
                return (
                  <div key={c.id} style={{borderTop:"1px dotted #33271a",paddingTop:9,marginTop:9}}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="disp" style={{fontSize:13.5,color:mine?"#e8d092":undefined}}>{c.name}</span>
                      {c.rival && <span className="tag tag-blood">House {c.rival} is behind him</span>}
                    </div>
                    <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:2}}>He {c.say}.</div>
                    {mine ? (
                      <div className="laurel" style={{fontSize:13.5,marginTop:5}}>Your money is on him — {S.election.spent}d.</div>
                    ) : S.election.backed ? null : (
                      <div className="grid grid-cols-3 gap-2" style={{marginTop:6}}>
                        {[1,2,3].map(l=>(
                          <button key={l} className="btn btn-ghost" disabled={S.gold<backLevels[l].n}
                            onClick={()=>backHim(c.id,l)}>{backLevels[l].n}d</button>
                        ))}
                      </div>
                    )}
                  </div>
                ); })}
              {!S.election.backed && (
                <button className="btn" style={{width:"100%",marginTop:9}} onClick={()=>backHim(null,0)}>
                  Stay out of it
                </button>
              )}
            </Sect>
          )}

          {aedileOn(S) && (
            <Sect title="The aedile" note={`${S.aedile.until - S.week}w left`}>
              <div className="disp" style={{fontSize:14.5,color:"#e8d092"}}>{S.aedile.name}</div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:3}}>
                {S.aedile.friendly
                  ? "He took the office with your money and has not forgotten it. One extra bout on every card, purses a seventh higher, and he leans forward when one of yours is down."
                  : S.aedile.hostile
                  ? "He knows whose name was on the other man's list. One fewer bout on every card, purses a ninth lighter, and he does not look your way when a decision is being made."
                  : "He has no particular view of you, which is its own kind of position."}
              </div>
            </Sect>
          )}

          {unhonoured(S).filter(m=>!m.done).length > 0 && (
            <Sect title="Not yet buried properly" note={`${RITE_WINDOW}w to decide`} open>
              <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>
                Funeral games are what a rich man's sons stage at his tomb. Nobody has ever staged them for a gladiator, which is exactly what makes it worth doing.
              </div>
              {unhonoured(S).filter(m=>!m.done).map(m=>(
                <div key={m.gid} style={{borderTop:"1px dotted #33271a",paddingTop:9,marginTop:9}}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="disp" style={{fontSize:14}}>{m.name}</span>
                    <span className="rowval dim" style={{fontSize:12.5}}>
                      {m.wins} victories · {RITE_WINDOW - (S.week - m.week)} week{RITE_WINDOW-(S.week-m.week)===1?"":"s"} left
                    </span>
                  </div>
                  {(m.kin||[]).length>0 && (
                    <div className="dim" style={{fontSize:13.5,marginTop:2}}>
                      {(m.kin||[]).map(k=>{ const b=S.gladiators.find(x=>x.id===k); return b?b.name:null; }).filter(Boolean).join(" and ")} called him brother, and {(m.kin||[]).length>1?"they are":"he is"} watching what you do about it.
                    </div>
                  )}
                  {RITE_KEYS.map(k=>{ const R2 = RITES[k], c = R2.cost(m);
                    return (
                      <button key={k} className={`optrow ${k==="none"?"":""}`} style={{marginTop:6,padding:9}}
                        disabled={S.gold<c} onClick={()=>doRite(m.gid,k)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="disp" style={{fontSize:13,color:k==="none"?"#a08e70":"#e8d092"}}>{R2.name}</span>
                          <span className="rowval" style={{fontSize:12.5,color:c>S.gold?"#d96f5d":c?"#d8ac5f":"#8d7e65"}}>{c? c+"d" : "costs nothing"}</span>
                        </div>
                        <div className="dim" style={{fontSize:13.5,marginTop:2}}>{R2.desc}</div>
                      </button>
                    ); })}
                </div>
              ))}
            </Sect>
          )}

          {(()=>{ const L = loanLender(S);
            if(!L) return (
              <div className="panel" style={{padding:13}}>
                <div className="disp" style={{fontSize:14,fontWeight:700,marginBottom:3}}>THE MONEYLENDERS</div>
                <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:8}}>
                  Three men in Capua will put coin on your table this afternoon. Every one of them is a worse idea than he looks and a better one than a bad month.
                </div>
                {LEND_KEYS.map(k=>{ const M = LENDERS[k];
                  return (
                    <div key={k} style={{borderTop:"1px dotted #33271a",paddingTop:9,marginTop:9}}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="disp" style={{fontSize:13.5}}>{M.name}</span>
                        <span className="rowval" style={{fontSize:12.5,color:M.rate>0.07?"#d96f5d":M.rate>0.05?"#d8ac5f":"#9aa86a"}}>
                          {Math.round(M.rate*1000)/10}% a week
                        </span>
                      </div>
                      <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:2}}>{M.blurb}</div>
                      <div className="dim" style={{fontSize:13,marginTop:2}}>
                        Up to {M.cap}d · quiet for {M.patience} weeks{M.hard? " · he collects in men" : " · he does not take men"}
                      </div>
                      <div className="grid grid-cols-3 gap-2" style={{marginTop:6}}>
                        {[300,700,M.cap].filter((v,i,a)=>a.indexOf(v)===i && v<=M.cap).map(v=>(
                          <button key={v} className="btn btn-ghost" onClick={()=>takeLoan(k,v)}>{v}d</button>
                        ))}
                      </div>
                    </div>
                  ); })}
              </div>
            );
            const o = owes(S), w = loanWeeks(S), late = w >= L.patience;
            return (
              <div className="panel" style={{padding:13, borderColor: late?"#7c2a22":"#6d5426"}}>
                <div className="flex items-center justify-between" style={{marginBottom:4}}>
                  <div className="disp" style={{fontSize:14,fontWeight:700}}>OWED TO {L.name.toUpperCase()}</div>
                  <span className="rowval" style={{fontSize:14,color:late?"#d96f5d":"#d8ac5f"}}>{o}d</span>
                </div>
                <div className="dim" style={{fontSize:14}}>
                  Borrowed {S.loan.principal}d, {w} week{w===1?"":"s"} ago, at {Math.round(L.rate*1000)/10}% a week. It grows whether you look at it or not.
                </div>
                <Bar v={Math.min(100, o/(S.loan.principal*4.0)*100)} label="debt"
                  color={late?"linear-gradient(90deg,#5a1a14,#d96f5d)":"linear-gradient(90deg,#4a3a24,#d8ac5f)"}/>
                <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:4}}>
                  {o > S.loan.principal*2.4 ? "This is very near the number at which he stops discussing it."
                   : late && L.hard ? "He has been patient and he has stopped. He collects in men when there is no coin."
                   : late ? "He has been patient longer than he said. He will not say anything about that."
                   : `He has said nothing yet. He said nothing for ${L.patience} weeks, and this is week ${w}.`}
                </div>
                <div className="grid grid-cols-3 gap-2" style={{marginTop:8}}>
                  {[200,600,o].filter((v,i,a)=>v>0 && a.indexOf(v)===i).map(v=>(
                    <button key={v} className="btn" disabled={S.gold<Math.min(v,o)} onClick={()=>payLoan(v)}>
                      {v>=o ? `Clear it · ${o}d` : `${v}d`}
                    </button>
                  ))}
                </div>
              </div>
            ); })()}

          <Sect title="The collegium" note={collOn(S)? `${collDues(S)}d/wk` : "burial society"}>
            {!S.collegium ? (<>
              <div style={{fontSize:15}}>
                A burial society. The house pays {COLL_DUES} denarii a week for every man on the roster, and when one of them dies there is a stone with his name on it, his style and the number of his victories — instead of a pit outside the wall.
              </div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:5}}>
                It will never win you a bout. But men who know what happens to them afterward take a death in the house differently.
              </div>
              <button className="btn" style={{width:"100%",marginTop:8}} disabled={S.gold<COLL_FEE} onClick={joinCollegium}>
                {S.gold<COLL_FEE ? `Found it · ${COLL_FEE}d — not enough coin` : `Found it · ${COLL_FEE}d, then ${COLL_DUES}d a man each week`}
              </button>
            </>) : S.collegium.lapsed ? (
              <div>
                <div className="blood" style={{fontSize:15}}>The dues stopped in week {S.collegium.lapsed}.</div>
                <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:4}}>
                  {S.collegium.buried
                    ? `${S.collegium.buried} went into the ground under it before you cut it. That is not a thing the cells forget.`
                    : "Nobody had needed it yet. They counted it anyway."}
                </div>
              </div>
            ) : (
              <div>
                <div style={{fontSize:15}}>Paid up. {S.collegium.buried
                  ? `${S.collegium.buried} ${S.collegium.buried===1?"man has":"men have"} gone into the ground under it with ${S.collegium.buried===1?"his":"their"} own name${S.collegium.buried===1?"":"s"} on the stone.`
                  : "Nobody has needed it yet."}</div>
                <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:4}}>
                  A death here costs half the unrest it otherwise would, and the yard is quieter for knowing why.
                </div>
                <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={stopCollegium}>Stop the dues</button>
              </div>
            )}
          </Sect>

          <Sect title="A feast for the familia" note="120d">
            <div className="dim" style={{fontSize:14.5,margin:"4px 0 8px"}}>Meat, honeyed wine, and a night without the whip. Loyalty is cheaper than rebellion.</div>
            <button className="btn" style={{width:"100%"}} disabled={S.gold<120 || S.week-S.lastFeast<3} onClick={feast}>
              {S.week-S.lastFeast<3? `The men feasted recently — ${3-(S.week-S.lastFeast)} week${3-(S.week-S.lastFeast)>1?"s":""}` : S.gold<120? "Not enough coin" : "Set the tables"}
            </button>
          </Sect>
        </div>)}

        {tab==="armory" && (<div className="flex flex-col gap-3">
          {(()=>{ const u = rackUsed(S), c = rackCap(S), over = rackOver(S);
            return (
              <div className="panel" style={{padding:12, borderColor: over? "#7c2a22" : u>=c-1 ? "#6d5426" : "#3e2f1f"}}>
                <div className="flex items-center justify-between" style={{marginBottom:4}}>
                  <span className="tag tag-gold">The racks</span>
                  <span className="rowval" style={{fontSize:13,color:over?"#d96f5d":u>=c-1?"#d8ac5f":"#9aa86a"}}>
                    {u} of {c} · {rackWord(S)}
                  </span>
                </div>
                <Bar v={Math.min(100, u/c*100)} label="" color={over
                  ? "linear-gradient(90deg,#5a1a14,#d96f5d)" : "linear-gradient(90deg,#4a3a24,#c99a4b)"}/>
                <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:4}}>
                  {over
                    ? `Past what the room holds. Everything wears ${Math.round((rackStrain(S)-1)*100)}% faster and it costs ${rackRent(S)} denarii a week to keep it stacked against the wall.`
                    : `House issue does not count — it is issue. A bigger armoury holds seven more.`}
                </div>
                {(()=>{ const eq = S.gladiators.reduce((n,g)=> n + (isGone(g)||!g.kit ? 0 : SLOTS.filter(s=>!(g.named&&g.named.slot===s) && wears(GEAR[g.kit[s]])).length), 0);
                  return (
                    <button className="btn btn-ghost" style={{width:"100%",marginTop:9}} disabled={eq===0}
                      onClick={()=>setAsk({ title:"Strip Every Man",
                        confirm:`Rack all ${eq} piece${eq>1?"s":""}`,
                        text:`Every gladiator goes back to plain house issue, and ${eq} bought piece${eq>1?"s go":" goes"} back on the rack — ready to hand out again from scratch. Nothing is sold and nothing is lost; you are only starting the loadout over. Named weapons stay with the men who earned them.`,
                        run:()=>unequipAll() })}>
                      {eq ? `Strip all men to the rack · ${eq}` : "Every man is on house issue"}
                    </button>
                  ); })()}
              </div>
            ); })()}

          {(S.deadSteel||[]).length>0 && (
            <div className="panel" style={{padding:11,borderColor:"#7c2a22"}}>
              <div className="tag tag-blood" style={{marginBottom:4}}>Off the dead</div>
              <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginBottom:5}}>
                Pieces that came back off a body. Somebody will end up carrying them, and he will know it.
              </div>
              {S.deadSteel.map((x,i)=>(
                <div key={i} className="flex items-center justify-between gap-2" style={{borderTop:"1px dotted #33271a",padding:"4px 0"}}>
                  <span className="rowname" style={{fontSize:14}}>{GEAR[x.id] ? GEAR[x.id].name : x.id}</span>
                  <span className="rowval dim" style={{fontSize:12.5}}>{x.from}, week {x.week}</span>
                </div>
              ))}
            </div>
          )}

          {activeG(S).length>0 && (
            <div className="panel" style={{padding:11}}>
              <div className="flex items-center justify-between gap-2">
                <div style={{minWidth:0}}>
                  <div className="disp" style={{fontSize:13,color:"#e8d092"}}>Arm the whole line</div>
                  <div className="dim" style={{fontSize:13.5}}>
                    {(()=>{ const n = activeG(S).filter(g=>kitFaults(S,g).length).length;
                      return n ? `${n} man${n===1?" is":"men are"} carrying less than the racks can give ${n===1?"him":"them"}.`
                        : "Everyone is carrying the best of what the house owns."; })()}
                  </div>
                </div>
                <button className="btn" style={{whiteSpace:"nowrap"}} onClick={armAll}>Go down the line</button>
              </div>
            </div>
          )}

          <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>The racks hold what you have bought and nothing else. Every piece arms one man at a time — equip it from his page. A free hand, a bare head and a bare chest cost nothing and always will.</div>

          <div className="grid grid-cols-4 gap-2">
            {SLOTS.map(slot=>{
              const owned = Object.entries(GEAR).filter(([id,it])=>it.slot===slot).reduce((n,[id])=>n+(S.gear[id]||0),0);
              const idle  = Object.entries(GEAR).filter(([id,it])=>it.slot===slot).reduce((n,[id])=>n+gearFree(S,id),0);
              return (
                <button key={slot} className={`focusbtn ${rack===slot?"on":""}`} onClick={()=>setRack(slot)}>
                  {SLOT_NAME[slot].toUpperCase()}
                  <span className="sub">{owned? `${owned} owned${idle?`, ${idle} idle`:""}` : "house stock"}</span>
                </button>
              );
            })}
          </div>

          {SLOTS.filter(s=>s===rack).map(slot=>{
            const items = Object.entries(GEAR).filter(([,it])=>it.slot===slot);
            const arts = [...new Set(items.map(([,it])=>it.art))];
            return (
            <div key={slot} className="panel" style={{padding:13}}>
              <div className="flex items-center justify-between" style={{marginBottom:2}}>
                <span className="disp" style={{fontSize:13,fontWeight:700}}>{SLOT_NAME[slot].toUpperCase()}</span>
                <span className="rowval dim" style={{fontSize:12.5}}>{items.length} pieces</span>
              </div>
              {arts.map(art=>{
                const group = items.filter(([,it])=>it.art===art).sort((a,b)=>(a[1].price||0)-(b[1].price||0));
                return (
                  <div key={art} style={{marginTop:14}}>
                    <div className="tag tag-gold" style={{marginBottom:2}}>{artName(slot, art)}</div>
                    {group.map(([id,it])=>{
                      const owned = S.gear[id]||0, free = gearFree(S,id);
                      return (
                        <div key={id} style={{borderTop:"1px dotted #33271a",paddingTop:8,marginTop:8}}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="disp" style={{fontSize:13.5,color:it.price?"#e8d9b8":"#b9a37c"}}>{it.name}</div>
                            {it.price>0
                              ? <span className="gold" style={{fontSize:14,whiteSpace:"nowrap"}}>{it.price}d{owned?` · ${owned} owned`:""}</span>
                              : <span className="tag">Costs nothing</span>}
                          </div>
                          <div className="dim" style={{fontSize:14,fontStyle:"italic",margin:"2px 0 3px"}}>{it.desc}</div>
                          <GearStats it={it}/>
                          {it.styles && it.styles.length>0 && <div className="dim" style={{fontSize:12.5,marginTop:2}}>Suits: {it.styles.join(", ")}</div>}
                          {it.price>0 && (
                            <button className={`btn ${it.stock?"btn-ghost":""}`} style={{width:"100%",marginTop:7}} disabled={S.gold<gearPrice(S,it.price,it.slot)} onClick={()=>buyGear(id)}>
                              {S.gold<gearPrice(S,it.price,it.slot) ? "Not enough coin"
                                : `${it.stock?"Order":"Buy"} for ${gearPrice(S,it.price,it.slot)}d${free>0?` · ${free} on the rack`:""}`}
                            </button>
                          )}
                          {!it.stock && it.price>0 && free>0 && (
                            <button className="btn btn-ghost" style={{width:"100%",marginTop:5,fontSize:12.5,padding:"10px 10px"}}
                              onClick={()=>sellOne(id)}>
                              Sell one back · about {rnd(it.price*resaleRate(S)*0.85)}d
                            </button>
                          )}
                          {it.price>0 && owned>0 && free===0 && <div className="dim" style={{fontSize:12.5,marginTop:3}}>Every one you own is on a man.</div>}
                          {owned>0 && free===0 && <div className="dim" style={{fontSize:12.5,marginTop:3}}>All owned pieces are in use.</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );})}
        </div>)}

      </div></div>

      <nav className="bar" role="tablist" aria-label="Sections" style={{position:"fixed",left:0,right:0,bottom:0,zIndex:20,background:"#14100c",borderTop:"1px solid #3e2f1f",display:"flex",paddingBottom:"env(safe-area-inset-bottom)"}}>
        {[["ludus","Ludus",Landmark],["men","Familia",Users],["arena","Arena",Swords],["armory","Armory",Shield],["market","Market",ShoppingBag],["villa","Villa",Wine]].map(([k,l,I])=>(
          <button key={k} role="tab" aria-selected={tab===k} aria-label={l}
            className={`tabbtn ${tab===k?"on":""}`} onClick={()=>setTab(k)}><I size={17} aria-hidden="true"/>{l}</button>
        ))}
      </nav>

      {selG && (
        <div className="modalwrap" role="dialog" aria-modal="true" onClick={()=>setSelId(null)}>
          <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{marginBottom:4}}>
              <div className="disp" style={{fontSize:17,fontWeight:900}}>{selG.name}{selG.nick?<span style={{color:"#d8c08a"}}>, {selG.nick}</span>:null}</div>
              <button className="btn btn-ghost" style={{padding:"10px 10px"}} aria-label="Close" onClick={()=>setSelId(null)}><X size={14}/></button>
            </div>
            <div className="dim" style={{fontSize:14.5,marginBottom:8}}>{selG.cls} — {CLASSES[selG.cls].desc} {ORIGINS[selG.origin].blurb.charAt(0).toUpperCase()+ORIGINS[selG.origin].blurb.slice(1)}.</div>
            <div className="flex gap-3" style={{fontSize:14.5,flexWrap:"wrap",marginBottom:8}}>
              <span>Record <b>{selG.wins}–{selG.losses}</b></span>
              <span>Kills <b>{selG.kills}</b></span>
              <span>Renown <b>{rnd(selG.pfame)}</b></span>
              <span>Age <b>{selG.age}</b></span>
            </div>
            <div style={{fontSize:15,fontStyle:"italic",marginBottom:8,color:selG.legend?"#e0bd72":"#cfc0a0"}}>
              The doctore's eye: {selG.read ? `potential ${rnd(selG.potential)}, heart ${rnd(selG.heart)}` : potentialWord(selG.potential)}. Bearing: {demeanor(selG.defiance).toLowerCase()}{selG.read? ` (${rnd(selG.defiance)})`:""}. At {selG.age} {PR(selG).he} is {ageWord(selG.age)}.
            </div>
            {fansOf(selG)>=12 && (
              <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",borderColor:isFavourite(selG)?"#8a6a2c":"#3e2f1f"}}>
                <div className="flex items-center justify-between" style={{marginBottom:6}}>
                  <span className={`tag ${isFavourite(selG)?"tag-gold":""}`}>{isFavourite(selG)?"♦ Crowd Favourite":"The crowd"}</span>
                  <span className="rowval dim" style={{fontSize:12.5}}>{fanWord(fansOf(selG))}</span>
                </div>
                <Bar v={fansOf(selG)} label="following" color="linear-gradient(90deg,#6d5426,#e0bd72)"/>
                {isFavourite(selG) && <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:5}}>
                  The seats fill for his name — a fatter purse when he fights, and a mob that will not forgive you for benching, selling, or burying him.
                </div>}
              </div>
            )}
            {bodyWear(selG) >= 0.12 && (()=>{ const w = bodyWear(selG);
              return (
                <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",borderColor:wornColour(w)}}>
                  <div className="flex items-center justify-between" style={{marginBottom:6}}>
                    <span className="tag" style={{color:wornColour(w),borderColor:wornColour(w)}}>The body</span>
                    <span className="rowval" style={{fontSize:13,color:wornColour(w)}}>{wornWord(w)}</span>
                  </div>
                  <div className="track" style={{height:6}}>
                    <div className="fill" style={{width:`${Math.round(w/0.85*100)}%`, background:`linear-gradient(90deg,#4a3a24,${wornColour(w)})`}}/>
                  </div>
                  <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:6}}>
                    {w<0.26 ? `${PR(selG).He} has taken his knocks and carries them well.`
                     : w<0.44 ? `The years and the wounds are on him. He goes down harder to mend when he goes down, and the cold finds his old hurts.`
                     : w<0.64 ? `A worn body. Send him out knowing a felling costs him more than it once did, and that some of it may not come back.`
                     : `He is held together with linen and habit. Every card is a gamble with what is left of him.`}
                  </div>
                </div>
              );
            })()}
            {(selG.scars||[]).length>0 && (()=>{
              const byPart = {};
              selG.scars.forEach(s=>{ byPart[s.part]=(byPart[s.part]||0)+1; });
              const cap = selG.scarCap||{};
              return (
                <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",borderColor:"#5a3a2c"}}>
                  <div className="tag tag-blood" style={{marginBottom:5}}>Old wounds</div>
                  <div style={{fontSize:14.5}}>
                    {Object.entries(byPart).map(([p,n])=>(
                      <span key={p} style={{marginRight:10}}>{n>1? `Twice-cut ${SCAR_WORD[p]}` : `Scarred ${SCAR_WORD[p]}`}</span>
                    ))}
                  </div>
                  {Object.keys(cap).length>0 && (
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:4}}>
                      {PR(selG).He} will never train past {Object.entries(cap).map(([k,v])=>`${STAT_NAMES[k]} ${99-v}`).join(", ")}.
                    </div>
                  )}
                </div>
              );
            })()}
            {(()=>{ const mine = (S.kits||[]).filter(k=>k.cls===selG.cls);
              return (
                <div className="panel" style={{padding:10,marginTop:8,marginBottom:9,background:"#1c1610",borderColor:"#3e2f1f"}}>
                  <div className="flex items-center justify-between" style={{marginBottom:4}}>
                    <span className="tag">Kits you keep</span>
                    <button className="btn btn-ghost" style={{padding:"10px 9px",fontSize:12}} onClick={()=>keepKit(selG.id)}>
                      Keep this one
                    </button>
                  </div>
                  {mine.length===0
                    ? <div className="dim" style={{fontSize:13.5,fontStyle:"italic"}}>
                        Nothing kept for a {selG.cls.toLowerCase()} yet. Keep a kit and you can put it on the next one in a tap.
                      </div>
                    : mine.map(k=>(
                        <div key={k.id} className="flex items-center justify-between gap-2" style={{borderTop:"1px dotted #33271a",padding:"5px 0"}}>
                          <span className="rowname" style={{fontSize:14}}>{k.name}</span>
                          <span className="flex gap-1">
                            <button className="btn btn-ghost" style={{padding:"10px 9px",fontSize:12}} onClick={()=>useKit(selG.id,k.id)}>Put it on him</button>
                            <button className="btn btn-ghost" style={{padding:"10px 8px",fontSize:12}} onClick={()=>forgetKit(k.id)}>×</button>
                          </span>
                        </div>
                      ))}
                </div>
              ); })()}
            {isAuctor(selG) && (
              <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",borderColor:"#5a7a8a"}}>
                <div className="flex items-center justify-between gap-2" style={{marginBottom:4}}>
                  <span className="tag" style={{borderColor:"#5a7a8a",color:"#9dc0d4"}}>Under contract</span>
                  <span className="rowval dim" style={{fontSize:13}}>{selG.auctor.wage}d / week</span>
                </div>
                <div style={{fontSize:15}}>{auctorLeft(selG)} of {selG.auctor.bouts} bouts still owed.</div>
                <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:3}}>{selG.auctor.why}</div>
                <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:4}}>
                  A free man. He cannot be sold, the rudis means nothing to him, and he will not be in the yard when the cells rise.
                </div>
              </div>
            )}
            {(()=>{ const v = formOf(selG); if(Math.abs(v)<7) return null;
              return (
                <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",borderColor:formColour(v)}}>
                  <div className="flex items-center justify-between">
                    <span className="tag">Form</span>
                    <span className="rowval" style={{fontSize:13,color:formColour(v)}}>{formWord(v)}</span>
                  </div>
                  {(selG.formLog||[]).length>0 && (
                    <div className="dim" style={{fontSize:13.5,marginTop:3}}>
                      Lately: {(selG.formLog||[]).slice(0,3).join(", ")}.
                    </div>
                  )}
                  <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:2}}>
                    {v>=24 ? "He is walking out expecting to win, and it is worth something."
                     : "He has not been right since. A few quiet weeks will settle it."}
                  </div>
                </div>
              ); })()}
            {!selG.sworn && (()=>{
              const free = isAuctor(selG), cond = isDamn(selG);
              const swear = key => mut(d=>{ const g = d.gladiators.find(x=>x.id===selG.id); if(g && !g.sworn) swearIn(d, g.id, key); });
              return (
                <div className="panel" style={{padding:11,marginBottom:9,background:"#241b11",borderColor:"#6d5426"}}>
                  <div className="tag" style={{marginBottom:4,borderColor:"#6d5426",color:"#d8ac5f"}}>Not yet sworn</div>
                  <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>
                    {free
                      ? `The oath is his to say — ${OATH}, and he says it knowing what it signs away.`
                      : cond
                      ? `He is condemned, so the words are said over him rather than by him.`
                      : `${OATH} — ${OATH_EN}. Said over him, as the house has always done it.`}
                  </div>
                  <div className="dim" style={{fontSize:13,marginTop:9,marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Have the oath said</div>
                  {SW_KEYS.map(k=>{ const S2 = SWEARING[k], afford = S.gold >= S2.cost;
                    return (
                      <button key={k} className="optrow" disabled={!afford} style={{display:"block",marginBottom:6,opacity:afford?1:0.5}}
                        onClick={()=>{ if(afford) swear(k); }}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="disp" style={{fontSize:12.5,color:"#e8d092"}}>{S2.name}</span>
                          <span className="rowval gold" style={{fontSize:12.5}}>{S2.cost? `${S2.cost}d` : "free"}</span>
                        </div>
                        <div className="dim" style={{fontSize:12.5,marginTop:2,lineHeight:1.35}}>{S2.desc}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}
            {selG.sworn && selG.sworn.how!=="quick" && (
              <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",borderColor:"#4e3c26"}}>
                <div className="tag" style={{marginBottom:3}}>Sworn in</div>
                <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>
                  {selG.sworn.free
                    ? `He said it himself: ${OATH}. A free man agreeing ${OATH_EN}.`
                    : `${OATH} — ${OATH_EN}. Said over him in week ${selG.sworn.week}, ${SWEARING[selG.sworn.how].name.toLowerCase()}.`}
                </div>
              </div>
            )}
            {(canMaster(S,selG) || masterOf(selG) || selG.learning || selG.second) && (
              <div className="panel" style={{padding:11,marginBottom:9,background:"#1c1610",
                borderColor: selG.learning ? "#6d5426" : masterOf(selG) ? "#c99a4b" : "#4e3c26"}}>
                {selG.learning ? (<>
                  <div className="tag tag-gold" style={{marginBottom:3}}>At the far post</div>
                  <div style={{fontSize:15}}>Being taught the {selG.learning.to.toLowerCase()}'s trade — {selG.learning.weeks} week{selG.learning.weeks===1?"":"s"} left.</div>
                  <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:3}}>He is on no card until it is finished, and he is a beginner again while it lasts.</div>
                </>) : (<>
                  {masterOf(selG) && (<>
                    <div className="flex items-center justify-between" style={{marginBottom:3}}>
                      <span className="tag tag-gold">{MASTERY[selG.mastery.cls].name}</span>
                      <span className="rowval dim" style={{fontSize:12.5}}>master of the {selG.mastery.cls.toLowerCase()}</span>
                    </div>
                    <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>{MASTERY[selG.mastery.cls].say}</div>
                    {selG.mastery.cls!==selG.cls && <div className="blood" style={{fontSize:13.5,marginTop:3}}>He is fighting as a {selG.cls.toLowerCase()} at present, so none of it counts.</div>}
                  </>)}
                  {canMaster(S,selG) && (
                    <button className="btn" style={{width:"100%",marginTop:6}} onClick={()=>doMaster(selG.id)}>
                      Name him a master of the {selG.cls.toLowerCase()}
                    </button>
                  )}
                  {selG.second && (
                    <div style={{marginTop:masterOf(selG)?8:0}}>
                      <div className="tag" style={{marginBottom:4}}>Two trades</div>
                      <div className="grid grid-cols-2 gap-2">
                        {stylesOf(selG).map(c=>(
                          <button key={c} className={`focusbtn ${selG.cls===c?"on":""}`}
                            disabled={selG.lastFought>=S.week} onClick={()=>useStyle(selG.id,c)}>
                            {c.toUpperCase()}
                            <span className="sub">{selG.cls===c?"in his hands":"put him in it"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {canSecond(S,selG) && (
                    <div style={{marginTop:8}}>
                      <div className="tag" style={{marginBottom:3}}>A second trade · {secondFee(S,selG)}d · {SECOND_WEEKS} weeks off every card</div>
                      <div className="dim" style={{fontSize:13.5,marginBottom:5}}>
                        There are not five men in Campania who can fight two styles. It costs him two months as a beginner.
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(CLASSES).filter(c=>c!==selG.cls).map(c=>(
                          <button key={c} className="focusbtn" disabled={S.gold<secondFee(S,selG)}
                            onClick={()=>teachSecond(selG.id,c)}>{c.toUpperCase()}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {!masterOf(selG) && !canMaster(S,selG) && !selG.second && (
                    <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>
                      A master is made at {MASTERY_GATE.wins} victories and {MASTERY_GATE.pfame} renown. He has {selG.wins} and {rnd(selG.pfame)}.
                    </div>
                  )}
                </>)}
              </div>
            )}
            {isDamn(selG) && (
              <div className="panel" style={{padding:11,marginBottom:9,background:"#2a1512",borderColor:"#7c2a22"}}>
                <div className="flex items-center justify-between" style={{marginBottom:3}}>
                  <span className="tag tag-blood">Condemned to the school</span>
                  <span className="rowval" style={{fontSize:13,color:"#d98476"}}>{damnLeft(selG)} of {selG.damnatus.bouts} left</span>
                </div>
                <div style={{fontSize:15}}>Sentenced for {selG.damnatus.what}.</div>
                <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:3}}>{selG.damnatus.note}</div>
                <Bar v={100 - damnLeft(selG)/selG.damnatus.bouts*100} label="sentence" color="linear-gradient(90deg,#5a1a14,#d98476)"/>
                <div className="dim" style={{fontSize:13.5,marginTop:4}}>
                  He cannot be sold — he belongs to the sentence until it is served. Fight it out and he becomes a gladiator of this house like any other.
                </div>
              </div>
            )}
            {refusing(selG) && (()=>{
              const canGive = selG.ambition && !selG.ambition.met && !selG.ambition.broken;
              const bring = (method, title) => { let msg="";
                mut(d=>{ const g = d.gladiators.find(x=>x.id===selG.id); if(g && g.refusing) msg = applyRefusal(d, g, method); });
                if(msg) setAsk({ title, confirm:"So it goes", text:msg, run:()=>{} }); };
              return (
                <div className="panel" style={{padding:11,marginBottom:9,background:"#2a1512",borderColor:"#7c2a22"}}>
                  <div className="tag tag-blood" style={{marginBottom:4}}>He will not go out</div>
                  <div style={{fontSize:15}}>{REFUSE_REASONS[selG.refusing.reason].say(selG)}</div>
                  <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:4}}>
                    {selG.refusing.weeks===0
                      ? "It began this week. He cannot be put on any card until it is settled — do it here."
                      : `${selG.refusing.weeks} week${selG.refusing.weeks===1?"":"s"} now, and he still cannot be carded. Settle it here. Every week he sits, the rest of the block adds it up.`}
                  </div>
                  <div className="dim" style={{fontSize:13,marginTop:9,marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Get him on his feet</div>
                  <button className="optrow" style={{display:"block",marginBottom:6}} onClick={()=>bring("talk","You Talk to Him")}>
                    <div className="disp" style={{fontSize:12.5,color:"#e8d092"}}>Talk to him</div>
                    <div className="dim" style={{fontSize:12.5,marginTop:2,lineHeight:1.35}}>Costs nothing and may fail — it turns on what you have been to him. The better he regards you, the likelier he rises.</div>
                  </button>
                  {canGive && (
                    <button className="optrow" style={{display:"block",marginBottom:6}} onClick={()=>bring("give","You Give Him What He Wants")}>
                      <div className="disp" style={{fontSize:12.5,color:"#e8d092"}}>Give him what he wants</div>
                      <div className="dim" style={{fontSize:12.5,marginTop:2,lineHeight:1.35}}>Grant the thing he stopped asking for. He is on his feet at once — and the whole block sees it.</div>
                    </button>
                  )}
                  <button className="optrow" style={{display:"block",borderColor:"#7c2a22"}} onClick={()=>bring("whip","The Whip")}>
                    <div className="blood" style={{fontSize:12.5,fontWeight:700}}>The whip</div>
                    <div className="dim" style={{fontSize:12.5,marginTop:2,lineHeight:1.35}}>He goes out for certain, but breaks something in him — and every other man loses heart and hardens against you.</div>
                  </button>
                </div>
              );
            })()}
            {(()=>{ const v = regardOf(selG), mem = (selG.memory||[]).slice().reverse();
              return (
                <Sect title="What he makes of you" note={regardWord(v)}>
                  <Bar v={v} label="regard" color={`linear-gradient(90deg,#4a3a24,${regardColour(v)})`}/>
                  {mem.length===0
                    ? <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:4}}>
                        Nothing has passed between you yet that he would count either way.
                      </div>
                    : <div style={{marginTop:5}}>
                        {mem.slice(0,5).map((m,i)=>(
                          <div key={i} style={{fontSize:14,padding:"2px 0",color:REGARD[m.kind].bad?"#d9a89e":"#cfc0a0"}}>
                            {REGARD[m.kind].say}{m.again>1 && <span className="dim"> ({m.again} times)</span>}
                          </div>
                        ))}
                      </div>}
                  {regardLoyal(selG) && <div className="laurel" style={{fontSize:13.5,marginTop:5}}>No other house's coin will move him.</div>}
                  {regardRefuse(selG) && <div className="blood" style={{fontSize:13.5,marginTop:5}}>He does what he is told and not one thing more.</div>}
                </Sect>
              ); })()}
            {selG.ambition && (
              <Sect title="What he wants" note={selG.ambition.met?"granted":selG.ambition.broken?"broken":selG.ambition.promised?"your word given":""}>
                <div style={{fontSize:15}}>{ambWord(selG)}</div>
                {(()=>{ const st = ambState(selG);
                  const line = {
                    silent:  ["dim","He has not mentioned it. He would not."],
                    asked:   ["gold","He has raised it with you once."],
                    pressed: ["blood","He has raised it twice. There will not be a third time."],
                    despair: ["blood","He has stopped asking. That is not the same as having stopped wanting it."],
                    met:     ["laurel","He has it. He will not forget who gave it to him."],
                    broken:  ["blood","You did the one thing. He has stopped expecting anything."],
                  }[st] || ["dim",""];
                  return <div className={line[0]} style={{fontSize:13.5,fontStyle:"italic",marginTop:3}}>{line[1]}</div>;
                })()}
              </Sect>
            )}
            {selG.traits.length>0 && <div style={{marginBottom:8}}>
              {selG.traits.map(t=><div key={t} style={{fontSize:14.5}}><span className="tag tag-gold" style={{marginRight:6}}>{t}</span><span className="dim">{TRAITS[t]}</span></div>)}
            </div>}
            {selG.injury && (()=>{ const care = selG.injury.care || "rest"; const fee = surgeonFee(S, selG.injury);
              return (
                <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",borderColor:"#7c2a22"}}>
                  <div className="flex items-center justify-between gap-2" style={{marginBottom:5}}>
                    <span className="tag tag-blood">{selG.injury.name}</span>
                    <span className="rowval dim" style={{fontSize:13}}>{Math.max(1,Math.ceil(selG.injury.weeks))} week{Math.ceil(selG.injury.weeks)>1?"s":""}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["rest","convalesce","surgeon","through"].map(c=>{
                      const off = c==="surgeon" && (!surgeonOK(S) || S.gold<fee);
                      return (
                        <button key={c} className={`focusbtn ${care===c?"on":""}`} disabled={off}
                          style={off?{opacity:.4}:undefined} onClick={()=>setCare(selG.id,c)}>
                          {c==="rest"?"MEND":c==="convalesce"?"CONVALESCE":c==="surgeon"?"SURGEON":"WORK ON"}
                          {c==="surgeon" && <span className="sub">{surgeonOK(S)? fee+"d" : "needs medicus"}</span>}
                          {c==="convalesce" && <span className="sub">slow &amp; clean</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:6}}>{CARE[care].desc}</div>
                  {care==="through" && <div className="blood" style={{fontSize:13.5,marginTop:3}}>
                    He fights at a penalty and the wound will not close. It may set badly and leave something permanent.
                  </div>}
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2" style={{marginBottom:10}}>
              {STATS.map(k=>(
                <div key={k}>
                  <div className="flex justify-between" style={{fontSize:13}}>
                    <span className="dim">{STAT_NAMES[k]}</span>
                    <span>{rnd(selG[k])}{statCap(selG,k)<99 && <span className="blood" style={{fontSize:11.5}}> /{statCap(selG,k)}</span>}</span>
                  </div>
                  <Bar v={selG[k]} color={CLASSES[selG.cls].key.includes(k)?BRONZE:"#6a5a40"}/>
                </div>
              ))}
              <div>
                <div className="flex justify-between" style={{fontSize:13}}><span className="dim">Morale</span><span>{rnd(selG.morale)}</span></div>
                <Bar v={selG.morale} color={LAUREL}/>
              </div>
              <div>
                <div className="flex justify-between" style={{fontSize:13}}><span className="dim">Fatigue</span><span>{rnd(selG.fatigue)}</span></div>
                <Bar v={selG.fatigue} color={BRONZE}/>
              </div>
            </div>
            {(tiesOf(S, selG.id).length>0 || selG.mentor || selG.protege) && (
              <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610"}}>
                <div className="tag" style={{marginBottom:6}}>Bonds</div>
                {selG.mentor && (()=>{ const m=S.gladiators.find(x=>x.id===selG.mentor);
                  return (
                    <button className="optrow" style={{width:"100%",marginBottom:5,padding:8}} disabled={!m} onClick={()=>m&&setSelId(m.id)}>
                      <div className="flex items-center justify-between gap-2" style={{fontSize:14.5}}>
                        <span><span style={{color:"#e8d092"}}>Taught by</span><span className="dim"> · </span>{m?m.name:(selG.mentorName||"—")}</span>
                        <span className="dim" style={{fontSize:13,whiteSpace:"nowrap"}}>the old hand</span>
                      </div>
                    </button>
                  ); })()}
                {selG.protege && (()=>{ const r=S.gladiators.find(x=>x.id===selG.protege);
                  return (
                    <button className="optrow" style={{width:"100%",marginBottom:5,padding:8}} disabled={!r} onClick={()=>r&&setSelId(r.id)}>
                      <div className="flex items-center justify-between gap-2" style={{fontSize:14.5}}>
                        <span><span style={{color:"#e8d092"}}>Bringing on</span><span className="dim"> · </span>{r?r.name:(selG.protegeName||"—")}</span>
                        <span className="dim" style={{fontSize:13,whiteSpace:"nowrap"}}>{r?`toward his fifth · ${clamp(r.wins,0,5)}/5`:"his protégé"}</span>
                      </div>
                    </button>
                  ); })()}
                {tiesOf(S, selG.id).map((t,i)=>{
                  const o = S.gladiators.find(x=>x.id===tieOther(t,selG.id));
                  if(!o) return null;
                  const bro = t.kind==="brother";
                  return (
                    <button key={i} className="optrow" style={{width:"100%",marginBottom:5,padding:8}} onClick={()=>setSelId(o.id)}>
                      <div className="flex items-center justify-between gap-2" style={{fontSize:14.5}}>
                        <span>
                          <span style={{color: bro?"#b9c58a":"#d98476"}}>{bro? "Brother":"Bad blood"}</span>
                          <span className="dim"> · </span>{o.name}
                        </span>
                        <span className="dim" style={{fontSize:13,whiteSpace:"nowrap"}}>{tieWord(t)}</span>
                      </div>
                    </button>
                  );
                })}
                <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:4}}>
                  {selG.protege
                    ? `He is teaching ${selG.protegeName||"a green one"} what he knows — lose either of them and the other feels it.`
                    : selG.mentor
                    ? `${selG.mentorName||"An old hand"} is bringing him on. He learns faster for it, and would not take that loss well.`
                    : kinOf(S,selG.id,"brother").length
                    ? `What happens to them happens to ${PR(selG).him} — and they would follow ${PR(selG).him} out of the gate.`
                    : "Spite sharpens a fighter, and costs them sleep."}
                </div>
              </div>
            )}
            {S.saga && S.saga.gid===selG.id && (()=>{ const s = S.saga;
              const word = s.stage>=4 ? "The crowd wants the wooden sword for him"
                : s.stage===3 ? `His reckoning is set${s.foe?` — against ${s.foe.name}`:""}`
                : s.stage>=2 && s.foe ? `The crowd has named his equal: ${s.foe.name} of House ${s.foe.house}`
                : "A champion the crowd comes to see";
              return (
                <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",borderColor:"#8a6a2c"}}>
                  <div className="flex items-center justify-between" style={{marginBottom:6}}>
                    <span className="tag tag-gold">The Champion's Road</span>
                    <span className="rowval" style={{fontSize:12,color:"#e0bd72"}}>Act {Math.min(s.stage,4)} of 4</span>
                  </div>
                  <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:6}}>{word}.</div>
                  <Bar v={s.renown} label="renown" color="linear-gradient(90deg,#6d5426,#e0bd72)"/>
                </div>
              ); })()}
            <div style={{position:"relative",height:176,borderRadius:10,overflow:"hidden",
              border:"1px solid #4e3c26",marginBottom:10,
              background:"linear-gradient(#100c08 0%,#241a0e 22%,#6d5531 66%,#9a7844 100%)"}}>
              <div style={{position:"absolute",left:"50%",bottom:10,transform:"translateX(-50%)"}}>
                <Fighter col={S.crest} fem={isF(selG)} kit={selG.kit || defaultKit(selG.cls)} scars={selG.scars} pose="idle" wounds={[]}/>
              </div>
              <div className="dim" style={{position:"absolute",bottom:5,left:9,fontSize:11,fontStyle:"italic"}}>as he takes the sand</div>
            </div>
            <div className="flex items-center justify-between" style={{marginBottom:6}}>
              <span className="tag tag-gold">Kit</span>
              <button className="btn btn-ghost" style={{padding:"10px 10px",fontSize:12}} onClick={()=>armHim(selG.id)}>
                Arm him from the rack
              </button>
            </div>
            {lastingOf(selG).length>0 && (
              <div className="panel" style={{padding:11,marginBottom:9,background:"#2a1512",borderColor:"#7c2a22"}}>
                <div className="tag tag-blood" style={{marginBottom:4}}>What never closed</div>
                {lastingOf(selG).map(k=>(
                  <div key={k} style={{borderTop:"1px dotted #33271a",paddingTop:5,marginTop:5}}>
                    <div style={{fontSize:14.5,color:"#d98476"}}>{LASTING[k].name}</div>
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:1}}>{LASTING[k].say}</div>
                  </div>
                ))}
                <div className="dim" style={{fontSize:13,marginTop:5}}>
                  Past the sixth round he is at ×{lastNum(selG,"latePow").toFixed(2)}, and he spends wind {Math.round((lastNum(selG,"stam")-1)*100)}% faster all the way through.
                </div>
              </div>
            )}
            {isF(selG) && (
              <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",borderColor:"#8a6a9c"}}>
                <div className="tag" style={{marginBottom:3,borderColor:"#8a6a9c",color:"#bfa8c8"}}>A woman on the sand</div>
                <div className="dim" style={{fontSize:14}}>
                  The upper tiers will not shut up about her and the front rows think it is vulgar. Crowd +{femCrowd(selG)}, purses ×{femPurse(selG).toFixed(2)}, and the two halves of the amphitheatre move in opposite directions every time she goes out.
                </div>
              </div>
            )}
            {(()=>{ const v = favourOf(selG); if(v < 8) return null;
              return (
                <div className="panel" style={{padding:11,marginBottom:9,background:"#1c1610",borderColor:favColour(v)}}>
                  <div className="flex items-center justify-between" style={{marginBottom:3}}>
                    <span className="tag">What Capua makes of him</span>
                    <span className="rowval" style={{fontSize:13,color:favColour(v)}}>{favWord(v)}</span>
                  </div>
                  <Bar v={v} label="" color="linear-gradient(90deg,#4a3a24,#e8d092)"/>
                  <div className="dim" style={{fontSize:13.5,marginTop:4}}>
                    Purses ×{favPurse(selG).toFixed(2)} when he is on the card{v>=25 ? `, and they are ${Math.round(favMissio(selG))} less willing to watch him die.` : "."}
                  </div>
                  {v>=40 && <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:3}}>
                    Selling him or burying him is not a private arrangement any more.
                  </div>}
                </div>
              ); })()}
            {provCrowd(selG)>0 && (
              <div className="panel" style={{padding:9,marginBottom:7,background:"#1c1610",borderColor:"#6d5426"}}>
                <div className="laurel" style={{fontSize:13.5}}>
                  The crowd knows his steel when he walks out — {provCrowd(selG)} to them.
                </div>
                {provDread(selG) && <div className="blood" style={{fontSize:13.5,marginTop:2}}>
                  And the cells know which piece he is wearing.
                </div>}
              </div>
            )}
            {(()=>{ const faults = kitFaults(S, selG);
              if(!faults.length) return null;
              return (
                <div className="panel" style={{padding:9,marginBottom:7,background:"#1c1610",
                  borderColor: faults.some(f=>f.why!=="better on the rack") ? "#7c2a22" : "#6d5426"}}>
                  {faults.map((f,i)=>(
                    <div key={i} style={{fontSize:13.5,color:f.why==="unfamiliar"?"#d98476":f.why==="failing"?"#d96f5d":"#d8ac5f"}}>
                      {f.why==="unfamiliar" ? `${f.name} is not his style — he carries it clumsily.`
                        : f.why==="failing" ? `${f.name} is close to going.`
                        : `There is better on the rack for him.`}
                    </div>
                  ))}
                </div>
              ); })()}
            {(()=>{ const kit = selG.kit || defaultKit(selG.cls); const m = kitMods(kit, selG.cls, selG); return (
              <div style={{marginBottom:12}}>
                {SLOTS.map(slot=>{
                  const cur = GEAR[kit[slot]];
                  return (
                    <div key={slot} style={{marginBottom:7}}>
                      <div className="flex items-center justify-between gap-2" style={{marginBottom:3}}>
                        <span className="dim" style={{fontSize:13}}>{SLOT_NAME[slot]}</span>
                        {cur && <span style={{fontSize:12.5}}><GearStats it={cur} cls={selG.cls}/></span>}
                      </div>
                      {provOf(selG,slot) && (
                        <div style={{fontSize:12.5,fontStyle:"italic",marginBottom:3,
                          color:PROV[provOf(selG,slot).kind].colour}}>
                          {PROV[provOf(selG,slot).kind].line(provOf(selG,slot))}
                        </div>
                      )}
                      <button className="selbtn" onClick={()=>setGearPick({gid:selG.id, slot})}>
                        <span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {isNamed(selG,slot) ? <span className="gold">{selG.named.title}</span> : (cur ? cur.name : "—")}
                          {cur && cur.styles && cur.styles.length && !cur.styles.includes(selG.cls)
                            ? <span className="blood" style={{fontSize:13}}> · unfamiliar</span> : null}
                          {wears(cur) && <span style={{fontSize:12.5, color:wearColour(wearOf(selG,slot))}}> · {wearWord(wearOf(selG,slot))}</span>}
                        </span>
                        <ChevronRight size={15} style={{color:"#9c8a6f",flexShrink:0}}/>
                      </button>
                      {wears(cur) && (
                        <div className="track" style={{height:4,marginTop:3}}>
                          <div className="fill" style={{width:`${wearOf(selG,slot)}%`, background:wearColour(wearOf(selG,slot))}}/>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="panel" style={{padding:9,marginTop:8,background:"#1c1610"}}>
                  <div className="flex gap-3" style={{flexWrap:"wrap",fontSize:14}}>
                    <span className="dim">Kit total:</span>
                    <span style={{color:m.atk>=0?"#9aa86a":"#cf5a49"}}>Attack {pct(m.atk)}</span>
                    <span style={{color:m.def>=0?"#9aa86a":"#cf5a49"}}>Guard {pct(m.def)}</span>
                    <span style={{color:m.spd>=0?"#9aa86a":"#cf5a49"}}>Speed {pct(m.spd)}</span>
                    <span style={{color:m.sho>=0?"#9aa86a":"#cf5a49"}}>Crowd {pct(m.sho)}</span>
                  </div>
                  {m.clumsy.length>0 && <div className="blood" style={{fontSize:13,fontStyle:"italic",marginTop:4}}>Ill-suited to his style: {m.clumsy.join(", ")}.</div>}
                </div>
                {(()=>{ const fee = repairFee(S, selG);
                  if(fee<=0) return null;
                  return <button className="btn btn-ghost" style={{width:"100%",marginTop:7}} disabled={S.gold<fee} onClick={()=>mendKit(selG.id)}>
                    {S.gold<fee ? `Have it seen to · ${fee}d — not enough coin` : `Have it seen to · ${fee}d`}
                  </button>; })()}
                {forgeReady(S, selG) && (
                  <div style={{marginTop:7}}>
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginBottom:5}}>
                      Your armourer can make one piece for one man, and it will never be anybody else's.
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {SLOTS.filter(s=>wears(GEAR[kit[s]])).map(s=>(
                        <button key={s} className="btn" disabled={S.gold<FORGE_FEE} onClick={()=>forgeFor(selG.id, s)}>
                          Forge his {SLOT_NAME[s].toLowerCase()} · {FORGE_FEE}d
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {selG.named && (
                  <div className="panel" style={{padding:9,marginTop:7,background:"#1c1610",borderColor:"#c99a4b"}}>
                    <div className="disp gold" style={{fontSize:14}}>{selG.named.title}</div>
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:2}}>
                      Made for him in year {Math.floor((selG.named.made-1)/YEAR_WEEKS)+1}. It wears half as fast, it cannot be taken off him, and it will not break — only bend.
                    </div>
                  </div>
                )}
              </div>
            ); })()}
            {S.doctore && selG.status==="active" && (
              <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",
                borderColor: docPupil(S)===selG.id ? "#c99a4b" : "#4e3c26"}}>
                <div className="flex items-center justify-between gap-2" style={{marginBottom:5}}>
                  <span className="tag tag-gold">The doctore</span>
                  <span className="rowval dim" style={{fontSize:12.5}}>{STAT_NAMES[S.doctore.spec]} · {docWord(S.doctore.skill)}</span>
                </div>
                {S.doctore.retrainTo && docPupil(S)===selG.id ? (
                  <div style={{fontSize:15}}>Being remade as a {S.doctore.retrainTo.toLowerCase()} — {S.doctore.retrainLeft} week{S.doctore.retrainLeft===1?"":"s"} left.</div>
                ) : S.doctore.retrainTo ? (
                  <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>He is busy remaking someone else.</div>
                ) : (<>
                  <button className={`btn ${docPupil(S)===selG.id?"":"btn-ghost"}`} style={{width:"100%"}} onClick={()=>setPupil(selG.id)}>
                    {docPupil(S)===selG.id ? "He has him this week" : "Put the doctore on him"}
                  </button>
                  <button className="btn btn-ghost" style={{width:"100%",marginTop:6}} disabled={S.gold<RETRAIN_FEE}
                    onClick={()=>setRetrainFor(retrainFor===selG.id?null:selG.id)}>
                    {S.gold<RETRAIN_FEE ? `Remake his style · ${RETRAIN_FEE}d — not enough coin` : `Remake his style · ${RETRAIN_FEE}d`}
                  </button>
                  {retrainFor===selG.id && (
                    <div style={{marginTop:7}}>
                      <div className="dim" style={{fontSize:13.5,marginBottom:5}}>{RETRAIN_WEEKS} weeks off the sand. He keeps everything he is and learns to carry it differently.</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(CLASSES).filter(c=>c!==selG.cls).map(c=>(
                          <button key={c} className="focusbtn" onClick={()=>{ startRetrain(selG.id,c); setRetrainFor(null); }}>
                            {c.toUpperCase()}
                            <span className="sub">{CLASSES[c].key.map(k=>STAT_NAMES[k].slice(0,3)).join(" ")}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>)}
              </div>
            )}
            {(()=>{ const p = seasonOfMan(selG);
              if(p){ const P = PLANSEASON[p.kind];
                return (
                  <div className="panel" style={{padding:11,marginBottom:9,background:"#1c1610",borderColor:"#c99a4b"}}>
                    <div className="flex items-center justify-between" style={{marginBottom:3}}>
                      <span className="tag tag-gold">On a season</span>
                      <span className="rowval" style={{fontSize:12.5,color:"#e0bd72"}}>{planWeeksLeft(selG)} weeks left</span>
                    </div>
                    <div className="disp" style={{fontSize:14.5,color:"#e8d092"}}>{P.name}</div>
                    <Bar v={planPct(selG)} label="" color="linear-gradient(90deg,#4a3a24,#c99a4b)"/>
                    <div className="dim" style={{fontSize:13.5,marginTop:3}}>
                      This week: {REGIMENS[planDrill(selG)] ? REGIMENS[planDrill(selG)].name : "the post"}. It pays{" "}
                      {Object.entries(P.pays).map(([k,v])=>`+${v} ${STAT_NAMES[k].toLowerCase()}`).join(", ")}
                      {P.trait ? ` and makes him ${P.trait}` : ""}, and only when it is finished.
                    </div>
                    <button className="btn btn-ghost" style={{width:"100%",marginTop:7}}
                      onClick={()=>setAsk({ title:"Come Off The Season", danger:true, confirm:"Take him off it",
                        text:`He is ${planPct(selG)} in the hundred through. Coming off now keeps what he has gained week by week and loses the whole of what finishing would have paid.`,
                        run:()=>mut(d=>{ const g=d.gladiators.find(x=>x.id===selG.id); if(g) breakPlan(d, g, "You wanted him back on the card."); }) })}>
                      Take him off it
                    </button>
                  </div>
                ); }
              if(selG.status !== "active") return null;
              return (
                <div className="panel" style={{padding:11,marginBottom:9}}>
                  <div className="tag tag-gold" style={{marginBottom:4}}>Put him on a season</div>
                  <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginBottom:6}}>
                    Months of one thing, drilled in order, worth nothing until it is done and a great deal more than a week of picking when it is.
                  </div>
                  {PS_KEYS.map(k=>{ const P = PLANSEASON[k];
                    return (
                      <button key={k} className="optrow" style={{padding:10,marginBottom:6}}
                        onClick={()=>mut(d=>{ const g=d.gladiators.find(x=>x.id===selG.id); if(g) startPlan(d, g, k); })}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="disp" style={{fontSize:13,color:"#e8d092"}}>{P.name}</span>
                          <span className="rowval dim" style={{fontSize:12}}>{P.weeks} weeks</span>
                        </div>
                        <div className="dim" style={{fontSize:13.5,textAlign:"left",marginTop:2}}>{P.blurb}</div>
                        <div style={{fontSize:12.5,textAlign:"left",marginTop:2,color:"#9aa86a"}}>
                          {Object.entries(P.pays).map(([s,v])=>`+${v} ${STAT_NAMES[s].toLowerCase()}`).join(" · ")}
                          {P.trait ? ` · ${P.trait}` : ""}
                        </div>
                      </button>
                    ); })}
                </div>
              ); })()}
            {!seasonOfMan(selG) && <div className="tag" style={{marginBottom:6}}>This week</div>}
            <div className="grid grid-cols-2 gap-2" style={{marginBottom:6, display: seasonOfMan(selG) ? "none" : undefined}}>
              {REG_KEYS.map(k=>{ const r = REGIMENS[k], on = (selG.regimen||"palus")===k;
                const what = r.focus ? "your pick" : r.learn ? "his partner's best"
                  : r.gains ? Object.keys(r.gains).map(s=>STAT_NAMES[s].slice(0,4)).join("+")
                  : "mends";
                return (
                  <button key={k} className={`focusbtn ${on?"on":""}`}
                    onClick={()=>{ if(k==="spar") setSparPick(selG.id); else setRegimen(selG.id,k); }}>
                    {r.short}
                    <span className="sub">{what}{r.costs? ` · −${Object.keys(r.costs).map(s=>STAT_NAMES[s].slice(0,4)).join("")}`:""}</span>
                  </button>
                ); })}
            </div>
            <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:8}}>
              {REGIMENS[selG.regimen||"palus"].desc}
            </div>
            {(()=>{ const s = strainOf(selG); if(s<8) return null;
              return (
                <div className="panel" style={{padding:9,marginBottom:8,background:"#1c1610",
                  borderColor: s>55?"#7c2a22" : s>30?"#6d5426" : "#4e3c26"}}>
                  <div className="flex items-center justify-between" style={{fontSize:14}}>
                    <span>Strain</span>
                    <span style={{color: s>55?"#d96f5d" : s>30?"#d8ac5f" : "#b09b7d"}}>{strainWord(s)}</span>
                  </div>
                  <Bar v={s} label="strain" color={s>55?"#d96f5d":s>30?"#d8ac5f":"#5a4a34"}/>
                  <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:3}}>
                    Deep tiredness that a night does not touch. It eats what he gains and it is how men tear things. Only rest takes it off.
                  </div>
                </div>
              ); })()}
            <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginBottom:8}}>
              {REGIMENS[selG.regimen||"palus"].desc}
              {(()=>{ const p = sparPartner(S, selG); if(!p) return null;
                const t = tieBetween(S, selG.id, p.id);
                return <span> Paired with <span style={{color:"#e0bd72"}}>{p.name}</span>
                  {t && t.kind==="brother" ? " — they trust each other, and it shows."
                   : t && t.kind==="rival" ? <span className="blood"> — there is bad blood here. They will go too hard.</span>
                   : "."}</span>;
              })()}
              {selG.regimen==="spar" && !sparPartner(S,selG) && <span className="blood"> No partner set — he works the post instead.</span>}
            </div>
            {(REGIMENS[selG.regimen||"palus"].focus || selG.regimen==="spar") && (<>
              <div className="tag" style={{marginBottom:6}}>
                {selG.regimen==="spar" ? "Drilling — his fallback if no partner is set" : "Drilling"}
              </div>
              <div className="grid grid-cols-2 gap-2" style={{marginBottom:12}}>
                {STATS.map(k=>(
                  <button key={k} className={`focusbtn ${selG.focus===k?"on":""}`} onClick={()=>setFocus(selG.id,k)}>
                    {STAT_NAMES[k].toUpperCase()}
                    <span className="sub">{rnd(selG[k])}{statCap(selG,k)<99 && <span className="blood"> / {statCap(selG,k)}</span>}</span>
                  </button>
                ))}
              </div>
            </>)}
            <div className="grid grid-cols-2 gap-2">
              <button className="btn" disabled={S.gold<50} onClick={()=>rewardG(selG.id)}>Reward · 50d</button>
              <button className="btn btn-ghost" onClick={()=>whipG(selG.id)}>The whip</button>
              {isAuctor(selG)
                ? <button className="btn btn-ghost" disabled>Not yours to sell</button>
                : <button className="btn btn-ghost" onClick={()=>sellG(selG.id)}>Sell · {rnd(gladValue(selG)*0.55)}d</button>}
              {isAuctor(selG)
                ? <button className="btn btn-ghost" disabled>Contract · {auctorLeft(selG)} bouts</button>
                : rudisEligible(selG)
                ? <button className="btn" style={{borderColor:"#c99a4b",color:"#e8d092"}} onClick={()=>freeG(selG.id)}>Grant the rudis</button>
                : retireEligible(selG)
                ? <button className="btn" onClick={()=>retire(selG.id)}>Release him</button>
                : <button className="btn btn-ghost" disabled>Rudis: 10 wins, 90 renown</button>}
            </div>
          </div>
        </div>
      )}

      {gearPick && (()=>{
        const g = S.gladiators.find(x=>x.id===gearPick.gid);
        if(!g) return null;
        const kit = g.kit || defaultKit(g.cls);
        const opts = Object.entries(GEAR).filter(([id,it])=>it.slot===gearPick.slot && (isBasic(id) || gearFree(S,id)>0 || kit[gearPick.slot]===id));
        const dualLock = gearPick.slot==="offhand" && GEAR[kit.weapon] && GEAR[kit.weapon].art==="dual";
        return (
          <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:60}} onClick={()=>setGearPick(null)}>
            <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between" style={{marginBottom:4}}>
                <div className="disp" style={{fontSize:14,fontWeight:700,letterSpacing:".1em"}}>{SLOT_NAME[gearPick.slot].toUpperCase()}</div>
                <button className="btn btn-ghost" style={{padding:"10px 10px"}} aria-label="Close" onClick={()=>setGearPick(null)}><X size={14}/></button>
              </div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:10}}>
                For {g.name} — {g.cls}.{dualLock ? " Both his hands are full; a shield would only hinder him." : ""}
              </div>
              {opts.map(([id,it])=>{
                const on = kit[gearPick.slot]===id;
                const alien = it.styles && it.styles.length && !it.styles.includes(g.cls);
                const spare = isBasic(id) ? null : (S.gear[id]||0);
                return (
                  <button key={id} className={`optrow ${on?"on":""}`}
                    onClick={()=>{ equip(g.id, gearPick.slot, id); setGearPick(null); }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="disp" style={{fontSize:13.5,color:on?"#e8d092":"#e8d9b8"}}>{it.name}</span>
                      {on ? <span className="tag tag-gold">Worn</span>
                          : spare!=null ? <span className="dim" style={{fontSize:12.5,whiteSpace:"nowrap"}}>{spare} owned</span>
                          : <span className="tag">Standard</span>}
                    </div>
                    <div className="dim" style={{fontSize:13.5,fontStyle:"italic",margin:"3px 0 4px"}}>{it.desc}</div>
                    <GearStats it={it} cls={g.cls}/>
                    {alien && !on && <div className="dim" style={{fontSize:12.5,marginTop:2}}>Suits: {it.styles.join(", ")}</div>}
                  </button>
                );
              })}
              <button className="btn btn-ghost" style={{width:"100%",marginTop:4}} onClick={()=>setGearPick(null)}>Leave as he is</button>
            </div>
          </div>
        );
      })()}

      {sheet && SHEETS[sheet] && (
        <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:62}} onClick={()=>setSheet(null)}>
          <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{marginBottom:10}}>
              <div className="disp" style={{fontSize:15,fontWeight:900,letterSpacing:".12em",color:"#e8d092"}}>{SHEETS[sheet].title}</div>
              <button className="btn btn-ghost" style={{padding:"10px 10px"}} aria-label="Close" onClick={()=>setSheet(null)}><X size={14}/></button>
            </div>
            {SHEETS[sheet].body()}
            <button className="btn" style={{width:"100%",marginTop:12}} onClick={()=>setSheet(null)}>Close</button>
          </div>
        </div>
      )}

      {showChron && (
        <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:62}} onClick={()=>setShowChron(false)}>
          <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{marginBottom:10}}>
              <div className="disp" style={{fontSize:15,fontWeight:900,letterSpacing:".12em",color:"#e8d092"}}>THE CHRONICLE</div>
              <button className="btn btn-ghost" style={{padding:"10px 10px"}} aria-label="Close" onClick={()=>setShowChron(false)}><X size={14}/></button>
            </div>
            {S.log.length===0
              ? <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>Nothing written down yet. The house is new.</div>
              : S.log.map((e,i)=>(
                  <div key={i} style={{padding:"4px 0",borderBottom:"1px dotted #33271a",fontSize:15,color:e.kind==="bad"?"#d98476":e.kind==="good"?"#cbc08e":e.kind==="event"?"#b9a8c8":"#cfc0a0"}}>
                    <span className="dim" style={{fontSize:12.5}}>W{e.week}</span> — {e.text}
                  </div>
                ))}
            <button className="btn" style={{width:"100%",marginTop:12}} onClick={()=>setShowChron(false)}>Close</button>
          </div>
        </div>
      )}

      {showSettings && (()=>{
        const Row = ({label, desc, on, onToggle}) => (
          <button className={`optrow${on?" on":""}`} onClick={onToggle} aria-pressed={on} style={{display:"block",marginBottom:8}}>
            <div className="flex items-center justify-between gap-2">
              <span className="disp" style={{fontSize:12.5,color:"#e8d092"}}>{label}</span>
              <span className="chip" style={{pointerEvents:"none",...(on?{borderColor:"#c99a4b",color:"#e0bd72",background:"#2b2115"}:{})}}>{on?"On":"Off"}</span>
            </div>
            {desc && <div className="dim" style={{fontSize:12.5,marginTop:3,lineHeight:1.35}}>{desc}</div>}
          </button>
        );
        return (
          <div className="modalwrap" role="dialog" aria-modal="true" aria-label="Settings" style={{zIndex:64}} onClick={()=>setShowSettings(false)}>
            <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between" style={{marginBottom:12}}>
                <div className="disp" style={{fontSize:15,fontWeight:900,letterSpacing:".12em",color:"#e8d092"}}>SETTINGS</div>
                <button className="btn btn-ghost" style={{padding:"10px 10px"}} aria-label="Close" onClick={()=>setShowSettings(false)}><X size={14}/></button>
              </div>

              <div className="tag" style={{marginBottom:8}}>Sound</div>
              <Row label="Sound effects" desc="The clash of arms and the roar of the crowd."
                on={prefs.sound} onToggle={()=>setPref("sound", !prefs.sound)}/>

              <div className="tag" style={{display:"block",marginTop:12,marginBottom:8}}>Accessibility</div>
              <Row label="Reduce motion" desc="Stills the shake, blood, and other movement in the arena."
                on={prefs.reduceMotion} onToggle={()=>setPref("reduceMotion", !prefs.reduceMotion)}/>
              <Row label="Larger text" desc="Enlarges the body text throughout the house."
                on={prefs.largeText} onToggle={()=>setPref("largeText", !prefs.largeText)}/>
              <Row label="Colourblind-friendly" desc="Turns the 'good' greens on meters and status to a blue that reads clear against the reds."
                on={prefs.colorblind} onToggle={()=>setPref("colorblind", !prefs.colorblind)}/>
              <Row label="Show tips" desc="The gatekeeper's notes on each part of the ludus."
                on={!S.flags.noLessons} onToggle={()=>mut(d=>{ const off = !S.flags.noLessons; d.flags.noLessons = off?1:0; if(!off) d.flags.learned = {}; })}/>
              <button className="btn btn-ghost" style={{width:"100%",marginTop:8}}
                onClick={()=>{ setShowSettings(false); setGuideStep(0); setShowGuide(true); }}>Replay the opening guide</button>

              <div className="tag" style={{display:"block",marginTop:12,marginBottom:8}}>This house</div>
              <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginBottom:9,lineHeight:1.4}}>
                Kept automatically{saved? ` — last saved ${whenWord(saved)}`:""}. Slot {slot||1} of {SLOTS_N}.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-ghost" onClick={()=>{ setShowSettings(false); setXfer({mode:"export"}); }}>Copy transfer code</button>
                <button className="btn btn-ghost" onClick={()=>{ setShowSettings(false); toTitle(); }}>Switch houses</button>
              </div>

              <div className="dim" style={{fontSize:12,textAlign:"center",marginTop:14,fontStyle:"italic"}}>LVDVS — Blood &amp; Sand</div>
              <button className="btn" style={{width:"100%",marginTop:10}} onClick={()=>setShowSettings(false)}>Done</button>
            </div>
          </div>
        );
      })()}

      {S.succession && (()=>{ const H = HEIRS[S.succession.kind];
        return (
          <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:70}}>
            <div className="modal" tabIndex={-1}>
              <div className="disp" style={{fontSize:15,fontWeight:900,letterSpacing:".12em",color:"#e8d092",marginBottom:9}}>THE HOUSE GOES ON</div>
              <div style={{fontSize:15.5,marginBottom:9}}>
                {S.succession.lan} is dead at {S.succession.age}. The sand is still there, the men are still in the cells, and the debts have not noticed.
              </div>
              <div className="panel" style={{padding:11,marginBottom:10,background:"#1c1610",borderColor:"#c99a4b"}}>
                <div className="disp" style={{fontSize:14.5,color:"#e8d092",marginBottom:3}}>{S.succession.heir}</div>
                <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>{H.line}</div>
              </div>
              <div className="dim" style={{fontSize:14,marginBottom:10}}>
                The familia, the buildings, the racks and every obligation carry over. Fame falls to {Math.round(H.fameKeep*100)}% and standing with every patron to {Math.round(H.favorKeep*100)}% — they knew the father, not the son.
                {H.unrest<0 ? " The cells will be calmer for it." : H.unrest>8 ? " The cells will need convincing." : ""}
              </div>
              <button className="btn" style={{width:"100%"}} onClick={takeUpHouse}>Take up the house</button>
            </div>
          </div>
        ); })()}

      {annals && (()=>{
        const A = (S.annals||[]).slice().sort((a,b)=>(a.left||9999)-(b.left||9999) || a.joined-b.joined);
        const living = A.filter(a=>!a.left), gone = A.filter(a=>a.left);
        const R2 = houseRecord(S);
        const row = a => {
          const f = fateOf(a);
          return (
            <div key={a.id} style={{borderTop:"1px dotted #33271a",padding:"7px 0"}}>
              <div className="flex items-center justify-between gap-2">
                <span className="rowname disp" style={{fontSize:13.5,color:a.left?"#c0b492":"#e8d092"}}>
                  {a.nick? `${a.name}, ${a.nick}` : a.name}
                </span>
                <span className="rowval" style={{fontSize:12.5,color:f.colour}}>{f.label}</span>
              </div>
              <div className="dim" style={{fontSize:13.5,marginTop:2}}>
                {[a.cls, a.origin].filter(Boolean).join(" · ")}{a.auctor? " · auctoratus":""}
                {a.cls||a.origin? " — ":""}{a.wins}–{a.losses}
                {a.kills? `, ${a.kills} killed`:""}{a.scars? `, ${a.scars} scar${a.scars>1?"s":""}`:""}
              </div>
              <div className="dim" style={{fontSize:13}}>
                {a.left
                  ? `Year ${Math.floor((a.joined-1)/YEAR_WEEKS)+1} to year ${Math.floor((a.left-1)/YEAR_WEEKS)+1}${a.age? `, ${a.age} years old`:""}.`
                  : `Since year ${Math.floor((a.joined-1)/YEAR_WEEKS)+1}. Still standing.`}
                {a.ambMet && <span className="laurel"> He got what he wanted.</span>}
                {a.stone && <span style={{color:"#9dc0d4"}}> Buried under his own name.</span>}
                {a.munera==="games" && <span className="laurel"> The house held games for him.</span>}
                {a.munera==="rite" && <span style={{color:"#b9c58a"}}> A fire was burned at the gate for him.</span>}
              </div>
            </div>
          );
        };
        return (
          <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:64}} onClick={()=>setAnnals(false)}>
            <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between" style={{marginBottom:4}}>
                <div className="disp" style={{fontSize:15,fontWeight:900,letterSpacing:".12em",color:"#e8d092"}}>THE ANNALS</div>
                <button className="btn btn-ghost" style={{padding:"10px 10px"}} aria-label="Close" onClick={()=>setAnnals(false)}><X size={14}/></button>
              </div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:10}}>
                {S.name} — {R2.years} year{R2.years===1?"":"s"}, {R2.served} men and women through these gates,
                {" "}{R2.w} victories, {R2.lost} buried, {R2.freed} freed.
              </div>
              {living.length>0 && (<>
                <div className="tag tag-gold" style={{marginBottom:2}}>Still on the sand</div>
                {living.map(row)}
              </>)}
              {gone.length>0 && (<>
                <div className="tag" style={{margin:"12px 0 2px"}}>Gone</div>
                {gone.map(row)}
              </>)}
              <button className="btn" style={{width:"100%",marginTop:12}} onClick={()=>setAnnals(false)}>Close the book</button>
            </div>
          </div>
        );
      })()}

      {S.reSignOffer && !fight && (
        <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:57}}>
          <div className="modal" tabIndex={-1} style={{borderColor:"#8a6a2c"}}>
            <div className="disp" style={{fontSize:15,fontWeight:700,letterSpacing:".1em",marginBottom:8,color:"#e8d092"}}>HIS TERM IS UP</div>
            <div style={{fontSize:16}}>
              {S.reSignOffer.name} has served every bout he contracted for and is owed nothing further. He is standing in the yard in his own clothes with the gate open behind him, and he has not walked through it. He will sign again for {S.reSignOffer.fee} denarii and {S.reSignOffer.wage} a week, for {S.reSignOffer.bouts} more bouts.
            </div>
            <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:8}}>
              Let him go and the familia watches a man leave through the front gate, which is the one thing you cannot afford them to think about.
            </div>
            <button className="btn" style={{width:"100%",marginTop:12,borderColor:"#c99a4b",color:"#e8d092"}}
              disabled={S.gold<S.reSignOffer.fee} onClick={()=>answerReSign(true)}>
              {S.gold<S.reSignOffer.fee ? "Not enough coin" : `Sign him again — ${S.reSignOffer.fee}d`}
            </button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>answerReSign(false)}>Let him walk</button>
          </div>
        </div>
      )}

      {S.romeOffer && !fight && (
        <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:58}}>
          <div className="modal" tabIndex={-1} style={{borderColor:"#c99a4b"}}>
            <div className="disp" style={{fontSize:15,fontWeight:700,letterSpacing:".12em",marginBottom:8,color:"#e8d092"}}>A LETTER FROM ROME</div>
            <div style={{fontSize:16}}>
              {S.romeOffer.senator} has put your house forward for the imperial games. Three bouts on the greatest sand in the world, in front of the only crowd that has ever mattered — and purses that would buy Capua twice over.
            </div>
            <div className="panel" style={{padding:11,marginTop:10,background:"#1c1610",borderColor:"#7c2a22"}}>
              <div className="blood" style={{fontSize:14.5}}>
                Understand what is being offered. Half the imperial bouts are fought sine missione. Your patrons have no reach in that city — nobody up in that box owes you anything. Whatever happens there ends this house, one way or the other.
              </div>
            </div>
            <button className="btn" style={{width:"100%",marginTop:12,borderColor:"#c99a4b",color:"#e8d092"}} onClick={()=>answerRome(true)}>Load the wagons</button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>answerRome(false)}>Capua is enough</button>
          </div>
        </div>
      )}

      {S.doctoreOffer && !fight && (
        <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:55}}>
          <div className="modal" tabIndex={-1} style={{borderColor:"#8a6a2c"}}>
            <div className="disp" style={{fontSize:15,fontWeight:700,letterSpacing:".1em",marginBottom:8,color:"#e8d092"}}>HE ASKS TO STAY</div>
            <div style={{fontSize:16}}>
              {S.doctoreOffer.kind==="rudis"
                ? `${S.doctoreOffer.name} does not leave with the crowd. He finds you after, the rudis still in his hand, and says he has nowhere to be — and that the young ones in your cells hold a blade like farmers.`
                : `${S.doctoreOffer.name} takes his release, then stops at the gate. He is too old for the sand and he knows it. He asks whether the square needs a voice.`}
            </div>
            <div className="panel" style={{padding:11,marginTop:10,background:"#1c1610"}}>
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginBottom:4}}>
                <span className="tag">{docWord(S.doctoreOffer.skill)}</span>
                <span className="tag tag-gold">{STAT_NAMES[S.doctoreOffer.spec]}</span>
                <span className="tag tag-gold">✦ of this house</span>
              </div>
              <div className="dim" style={{fontSize:14}}>{S.doctoreOffer.wage} denarii a week — half what a hired man would ask.</div>
              {S.doctore && <div className="blood" style={{fontSize:14,marginTop:4}}>{S.doctore.name} would give up the square.</div>}
            </div>
            <button className="btn" style={{width:"100%",marginTop:12,borderColor:"#c99a4b",color:"#e8d092"}} onClick={()=>takeOffer(true)}>Give him the square</button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>takeOffer(false)}>Let him go free</button>
          </div>
        </div>
      )}

      {sparPick!=null && (()=>{
        const me = S.gladiators.find(g=>g.id===sparPick);
        if(!me) return null;
        const mates = S.gladiators.filter(g=>g.status==="active" && g.id!==me.id);
        return (
          <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:62}} onClick={()=>setSparPick(null)}>
            <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between" style={{marginBottom:4}}>
                <div className="disp" style={{fontSize:14,fontWeight:700,letterSpacing:".1em"}}>PAIR HIM AT THE POST</div>
                <button className="btn btn-ghost" style={{padding:"10px 10px"}} aria-label="Close" onClick={()=>setSparPick(null)}><X size={14}/></button>
              </div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:10}}>
                Both men improve faster than they would alone, and a man learns most from someone better than him. Both can also be hurt.
              </div>
              {mates.length===0 && <div className="dim" style={{fontSize:15}}>There is no one else fit to stand against him.</div>}
              {mates.map(m=>{
                const t = tieBetween(S, me.id, m.id);
                const edge = m[me.focus] - me[me.focus];
                const busy = m.regimen==="spar" && m.sparWith && m.sparWith!==me.id;
                return (
                  <button key={m.id} className={`optrow ${me.sparWith===m.id?"on":""}`} onClick={()=>{ setSpar(me.id, m.id); setSparPick(null); }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="disp" style={{fontSize:13.5}}>{m.name}</span>
                      <span className="dim" style={{fontSize:12.5,whiteSpace:"nowrap"}}>{m.cls}</span>
                    </div>
                    <div style={{fontSize:14,marginTop:3}}>
                      {edge>=6 ? <span className="laurel">Better than him at {STAT_NAMES[me.focus].toLowerCase()} — much to learn</span>
                       : edge<=-6 ? <span className="dim">Weaker at {STAT_NAMES[me.focus].toLowerCase()} — little to learn</span>
                       : <span className="dim">Evenly matched at {STAT_NAMES[me.focus].toLowerCase()}</span>}
                    </div>
                    {t && <div style={{fontSize:13.5,marginTop:2,color:t.kind==="brother"?"#b9c58a":"#d98476"}}>
                      {t.kind==="brother" ? "Brothers — they will look after each other" : "Bad blood — they will go too hard, and one may not walk away"}
                    </div>}
                    {busy && <div className="dim" style={{fontSize:13,marginTop:2}}>Currently paired with someone else; that pairing breaks.</div>}
                  </button>
                );
              })}
              <button className="btn btn-ghost" style={{width:"100%",marginTop:4}} onClick={()=>{ setRegimen(sparPick,"palus"); setSparPick(null); }}>Put him back on the post</button>
            </div>
          </div>
        );
      })()}

      {xfer && (
        <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:65}} onClick={()=>setXfer(null)}>
          <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between" style={{marginBottom:6}}>
              <div className="disp" style={{fontSize:14,fontWeight:700,letterSpacing:".1em"}}>{xfer.mode==="export"? "LIFT THE LEDGER":"RESTORE A LEDGER"}</div>
              <button className="btn btn-ghost" style={{padding:"10px 10px"}} aria-label="Close" onClick={()=>setXfer(null)}><X size={14}/></button>
            </div>
            {xfer.mode==="export" ? (<div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:8}}>Every man, every denarius, every line of the chronicle, written small. Keep it somewhere safe.</div>
              <textarea className="sel" readOnly value={encodeSave(S)} onFocus={e=>e.target.select()}
                style={{width:"100%",boxSizing:"border-box",height:120,fontSize:11,fontFamily:"monospace",resize:"none"}}/>
              <button className="btn" style={{width:"100%",marginTop:8}} onClick={()=>{
                const t = encodeSave(S);
                if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(()=>{});
                setXfer({mode:"export", copied:true});
              }}>{xfer.copied? "Copied to hand":"Copy it"}</button>
            </div>) : (<div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:8}}>Paste a transfer code below, then choose which slot it takes.</div>
              <textarea className="sel" value={xferIn} onChange={e=>setXferIn(e.target.value)} placeholder="Paste the ledger here"
                style={{width:"100%",boxSizing:"border-box",height:110,fontSize:11,fontFamily:"monospace",resize:"none"}}/>
              <div className="dim" style={{fontSize:13,margin:"8px 0 5px"}}>Restore into which slot? Anything there is struck out.</div>
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(i=>{ const sum=saveSummary(slots[i]);
                  return <button key={i} className="btn" disabled={!xferIn.trim()} onClick={()=>importSave(i)}>
                    {i}{sum? " ·  full":" ·  empty"}
                  </button>; })}
              </div>
            </div>)}
          </div>
        </div>
      )}

      <CarrySheet/>
      {showGuide && (()=>{
        const STEPS = [
          { t:"The House is Yours", b:"You are the lanista now — you own the men, the debts, and every decision. The work is to build a house of gladiators famous enough to be remembered and rich enough to survive being famous. Here is where the week turns." },
          { t:"The Familia", b:"Your men live under Familia. Each has a temper, a ceiling you cannot see, and a fire in him — the best fighters carry the most. Set what each one trains, and watch morale and the fire in the cells more closely than the gold." },
          { t:"The Market", b:"Buy men and steel under Market. The seller's numbers are his opinion, not the truth — a cheap man is cheap for a reason. Bought kit arms one fighter; the racks arm everyone else for free." },
          { t:"The Sand", b:"Fame is won in the Arena. Tap “Choose a bout” and it walks you through it — where he fights, who he faces, and how. First blood keeps men alive; anything bloodier is a gamble with a life. Reach 25 fame and the great games open to you." },
          { t:"The Week Turns", b:"Nothing happens until you end the week — and then everything does at once: training, wounds mending, rivals moving, coin going out. End it when you have set what you dare. The gatekeeper leaves a note on each tab as you arrive; you can silence him in Settings." },
        ];
        const st = clamp(guideStep, 0, STEPS.length-1);
        const S0 = STEPS[st], last = st===STEPS.length-1;
        const done = ()=>{ setShowGuide(false); setPref("guideDone", true); };
        return (
          <div className="modalwrap" role="dialog" aria-modal="true" aria-label="Opening guide" style={{zIndex:66}}>
            <div className="modal" tabIndex={-1} style={{maxWidth:440,borderColor:"#c99a4b"}}>
              <div className="flex items-center justify-between" style={{marginBottom:8}}>
                <div className="disp" style={{fontSize:12,letterSpacing:".12em",color:"#b09b7d"}}>A FEW WORDS BEFORE YOU START · {st+1}/{STEPS.length}</div>
                <button className="btn btn-ghost" style={{padding:"6px 10px",fontSize:11}} onClick={done}>Skip</button>
              </div>
              <div className="disp" style={{fontSize:19,color:"#e8d092",letterSpacing:".08em",marginBottom:8}}>{S0.t}</div>
              <div style={{fontSize:16,lineHeight:1.5,marginBottom:14}}>{S0.b}</div>
              <div className="flex items-center gap-1" style={{marginBottom:12,justifyContent:"center"}}>
                {STEPS.map((_,i)=>(<span key={i} style={{width:7,height:7,borderRadius:99,background:i===st?"#c99a4b":"#4a3a26"}}/>))}
              </div>
              <div className="flex gap-2">
                {st>0 && <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setGuideStep(st-1)}>‹ Back</button>}
                <button className="btn" style={{flex:2}} onClick={()=> last ? done() : setGuideStep(st+1)}>{last ? "To the ludus" : "Next ›"}</button>
              </div>
            </div>
          </div>
        );
      })()}
      {S && S.pendingLesson && (
        <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:65}}>
          <div className="modal" tabIndex={-1} style={{maxWidth:430,borderColor:"#c99a4b"}}>
            <div className="disp" style={{fontSize:18,color:"#e8d092",letterSpacing:".1em",marginBottom:8}}>
              {S.pendingLesson.title.toUpperCase()}
            </div>
            {S.pendingLesson.text.split(SPLIT2).map((p,i)=>(
              <div key={i} style={{fontSize:15.5,marginBottom:9}}>{p}</div>
            ))}
            <button className="btn" style={{width:"100%",marginTop:4}}
              onClick={()=>mut(d=>{ d.pendingLesson = null; })}>The doctore nods</button>
          </div>
        </div>
      )}
      {skipped && skipped.ran>=2 && (
        <div className="modalwrap" role="dialog" aria-modal="true" onClick={()=>setSkipped(null)}>
          <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
            <div className="disp" style={{fontSize:17,color:"#e8d092",marginBottom:6}}>
              WEEKS {skipped.from}–{skipped.to-1}
            </div>
            <div className="dim" style={{fontSize:14.5,fontStyle:"italic",marginBottom:9}}>
              {skipped.ran} weeks went by without asking anything of you.
            </div>
            {(S.log||[]).filter(l=>l.week>=skipped.from).slice(0,8).map((l,i)=>(
              <div key={i} style={{borderTop:"1px dotted #33271a",padding:"6px 0",fontSize:14.5}}>
                <span className="dim" style={{fontSize:12.5}}>wk {l.week} · </span>{l.text}
              </div>
            ))}
            <button className="btn" style={{width:"100%",marginTop:9}} onClick={()=>setSkipped(null)}>Carry on</button>
          </div>
        </div>
      )}
      {ask && (
        <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:70}} onClick={()=>setAsk(null)}>
          <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()} style={{borderColor: ask.danger? "#7c2a22":"#4e3c26"}}>
            <div className={`disp ${ask.danger?"blood":""}`} style={{fontSize:15,fontWeight:700,letterSpacing:".1em",marginBottom:8}}>{ask.title.toUpperCase()}</div>
            <div style={{fontSize:16}}>{ask.text}</div>
            <button className={`btn ${ask.danger?"btn-blood":""}`} style={{width:"100%",marginTop:14}}
              onClick={()=>{ const r=ask.run; setAsk(null); r(); }}>{ask.confirm}</button>
            <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} onClick={()=>setAsk(null)}>Think again</button>
          </div>
        </div>
      )}

      {fight && <FightModal fight={fight} startMuted={!prefs.sound} houseCol={S && S.crest}
        onClose={()=>{ if(held) return; SFX.stopCrowd(); setFight(null); }}
        onSpeak={fight.crux ? speak : null}
        onMute={v=>setPref("sound", !v)}/>}

      {arenaWiz && !fight && (()=>{
        const OFF = (S.games && S.games.offers) || [];
        const singles = OFF.filter(o=>!o.pair && !o.venatio && !o.melee);
        const pairs = OFF.filter(o=>o.pair), melees = OFF.filter(o=>o.melee), hunts = OFF.filter(o=>o.venatio);
        const gamesReady = S.fame >= TIERS[1].fame;
        let pick = arenaPick;
        if(pick && pick.o){ const live = OFF.find(o=>o.id===pick.o.id); if(!live) pick = null; else pick = {...pick, o:live}; }
        const step = pick ? arenaStep : 0;
        const me = fGid ? S.gladiators.find(g=>g.id===fGid) : null;
        const chosen = pairSel.map(id=>S.gladiators.find(g=>g.id===id)).filter(Boolean);
        const close = ()=>{ setArenaWiz(false); setArenaStep(0); setArenaPick(null); };
        const goPick = occ => { setArenaPick(occ); setFGid(null); setPairSel([]); setPlan("none"); setArenaStep(1); };
        const startFight = fn => { setArenaWiz(false); fn(); };
        const steps = [["Where",0],["Your man",1],["Ready",2]];
        const header = (
          <div className="flex items-center justify-between" style={{marginBottom:11}}>
            <div className="flex items-center gap-2" style={{flexWrap:"wrap"}}>
              {steps.map(([l,n])=>(
                <span key={n} className="disp" style={{fontSize:11,letterSpacing:".05em",
                  color: step===n?"#e8d092":step>n?"#9aa86a":"#6d5d47"}}>{n>0?"› ":""}{n+1}. {l}</span>
              ))}
            </div>
            <button className="btn btn-ghost" style={{padding:"8px 10px"}} aria-label="Close" onClick={close}><X size={14}/></button>
          </div>
        );
        const occRow = (occ, title, sub, right, tags)=>(
          <button className="optrow" style={{marginBottom:7,width:"100%"}} onClick={()=>goPick(occ)}>
            <div className="flex items-center justify-between gap-2">
              <span className="disp" style={{fontSize:14,color:"#e8d9b8"}}>{title}</span>
              {right}
            </div>
            {tags}
            {sub && <div className="dim" style={{fontSize:13.5,marginTop:2}}>{sub}</div>}
          </button>
        );

        let body;
        if(step===0){
          body = (<>
            <div className="disp" style={{fontSize:15,fontWeight:700,marginBottom:2}}>WHERE WILL HE FIGHT?</div>
            <div className="dim" style={{fontSize:14,marginBottom:10}}>Pick the card. You choose your man next.</div>
            {occRow({kind:"pits"}, "The Pits", "Always open. Small purses, and the crowd rarely votes for mercy.",
              <span className="dim" style={{fontSize:12.5}}>your stakes</span>)}
            {gamesReady && singles.map(o=> occRow({kind:"single",o},
              (o.imperial?"✦ ":"")+(o.opp.nick?`${o.opp.name}, ${o.opp.nick}`:o.opp.name),
              `${o.opp.cls} · ${o.opp.house? (o.opp.house.startsWith("the")||o.opp.house.startsWith("no")?o.opp.house:"House "+o.opp.house) : o.opp.origin}`,
              <span className="gold" style={{fontSize:14}}>{o.purse}d</span>,
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginTop:3}}>
                <span className="tag tag-gold">{TIERS[o.tier].name}</span>
                {o.imperial && <span className="tag tag-gold">✦ Rome</span>}
                {o.primus && <span className="tag tag-gold">✦ {o.defence?"Defend primacy":"For the primacy"}</span>}
                {o.booking && <span className="tag tag-gold">✦ Contracted</span>}
                {o.nemGrudge && <span className="tag tag-blood">✦ The Grudge</span>}
                {o.sagaBout && <span className="tag tag-gold">✦ The Reckoning</span>}
                {o.challenge && !o.nemGrudge && !o.sagaBout && <span className="tag tag-blood">✦ Challenge</span>}
                {o.stakes==="sine" && <span className="tag tag-blood">Sine missione</span>}
                {o.rematch && <span className="tag tag-blood">Rematch</span>}
                {nemesisIn(S,o.opp) && <span className="tag tag-blood">✦ {nemesisIn(S,o.opp).title}</span>}
              </div>
            ))}
            {gamesReady && pairs.map(o=> occRow({kind:"pair",o}, "Pair Bout",
              o.opps.map(x=>x.name).join(" & "),
              <span className="gold" style={{fontSize:14}}>{o.purse}d</span>,
              <div style={{marginTop:3}}><span className="tag tag-gold">{TIERS[o.tier].name}</span> <span className="tag tag-blood">Two men</span></div>))}
            {gamesReady && melees.map(o=> occRow({kind:"melee",o}, "The Melee",
              `${o.field.length} men on the sand at once`,
              <span className="gold" style={{fontSize:14}}>{o.purse}d</span>,
              <div style={{marginTop:3}}><span className="tag tag-blood">Last man standing</span></div>))}
            {gamesReady && hunts.map(o=> occRow({kind:"hunt",o}, "The Morning Hunt",
              BEASTS[o.beast].name,
              <span className="gold" style={{fontSize:14}}>{o.purse}d</span>,
              <div style={{marginTop:3}}><span className="tag">Beast · no missio</span></div>))}
            {!gamesReady && <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:4}}>
              No editor books an unknown house yet. Win in the pits to 25 fame and the games open.
            </div>}
            {gamesReady && !singles.length && !pairs.length && !melees.length && !hunts.length &&
              <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:4}}>
                {(()=>{ const nxt=nextFestivals(S,1)[0]; const away=nxt?weeksUntil(S,nxt):0;
                  return S.games? "The festival's matches are done — the pits remain." : away? `${nxt.name} in ${away} week${away===1?"":"s"}. The pits are open until then.` : "The editors are quiet this week. The pits remain."; })()}
              </div>}
          </>);
        } else if(step===1){
          const multi = pick.kind==="pair" || pick.kind==="melee";
          const needTwo = pick.kind==="pair";
          const enough = multi ? eligible.length>=2 : eligible.length>=1;
          const valid = needTwo ? pairSel.length===2 : multi ? pairSel.length>=2 : !!fGid;
          const occTitle = pick.kind==="pits" ? "The pits"
            : pick.kind==="single" ? `Against ${pick.o.opp.nick?`${pick.o.opp.name}, ${pick.o.opp.nick}`:pick.o.opp.name}`
            : pick.kind==="pair" ? "Pair bout" : pick.kind==="melee" ? "The melee"
            : `The hunt · ${BEASTS[pick.o.beast].name}`;
          body = (<>
            <button className="btn btn-ghost" style={{fontSize:12,padding:"6px 10px",marginBottom:9}} onClick={()=>{ setArenaStep(0); setArenaPick(null); }}>‹ Back</button>
            <div className="disp" style={{fontSize:15,fontWeight:700,marginBottom:2}}>
              {multi ? (needTwo?"CHOOSE TWO MEN":"ENTER YOUR MEN") : "CHOOSE YOUR MAN"}
            </div>
            <div className="dim" style={{fontSize:13.5,marginBottom:10}}>{occTitle}</div>
            {!enough ? (
              <div className="dim" style={{fontStyle:"italic",fontSize:15}}>
                {eligible.length===0 ? "No one is fit to fight this week — rested, healthy and unfought only."
                  : "This needs at least two fit men, and only one is ready."}
              </div>
            ) : eligible.map(g=>{
              const on = multi ? pairSel.includes(g.id) : fGid===g.id;
              const kit = g.kit || defaultKit(g.cls);
              return (
                <button key={g.id} className={`optrow ${on?"on":""}`} style={{marginBottom:6,width:"100%"}}
                  onClick={()=> multi ? togglePair(g.id) : setFGid(on?null:g.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="disp" style={{fontSize:13.5,color:on?"#e8d092":"#e8d9b8"}}>{fullName(g)}</span>
                    {on ? <Check size={15} style={{color:"#c99a4b",flexShrink:0}}/> : <span className="dim" style={{fontSize:13}}>{g.wins}–{g.losses}</span>}
                  </div>
                  <div className="dim" style={{fontSize:13.5,marginTop:2}}>
                    {g.cls} · {GEAR[kit.weapon]?GEAR[kit.weapon].name:"unarmed"}{GEAR[kit.offhand]&&GEAR[kit.offhand].art!=="none"?` & ${GEAR[kit.offhand].name}`:""}
                  </div>
                  {pick.kind==="single" && (()=>{ const w=metWord(pick.o.opp,g); return w?<div style={{fontSize:13,marginTop:2,color:"#d8ac5f"}}>{w}</div>:null; })()}
                </button>
              );
            })}
            {needTwo && chosen.length===2 && (()=>{ const t=tieBetween(S,chosen[0].id,chosen[1].id);
              return <div style={{fontSize:14,marginTop:2,color:t&&t.kind==="brother"?"#b9c58a":t?"#d98476":"#8f7e62"}}>
                {t? (t.kind==="brother"?"Brothers — each fights harder for the other at his shoulder.":"Bad blood — neither will cover the other."):"They barely know each other."}
              </div>; })()}
            {enough && <button className="btn" style={{width:"100%",marginTop:10}} disabled={!valid} onClick={()=>setArenaStep(2)}>
              {valid ? "Next ›" : needTwo ? `Choose two (${pairSel.length}/2)` : multi ? "Enter at least two" : "Choose a man"}
            </button>}
          </>);
        } else {
          const backBtn = <button className="btn btn-ghost" style={{fontSize:12,padding:"6px 10px",marginBottom:9}} onClick={()=>setArenaStep(1)}>‹ Back</button>;
          const tacticRow = (
            <div style={{marginTop:11}}>
              <div className="tag" style={{marginBottom:6}}>How he fights</div>
              <div className="flex gap-2" style={{flexWrap:"wrap"}}>
                {[["aggressive","Aggressive"],["measured","Measured"],["defensive","Defensive"],["showboat","Showboat"]].map(([k,l])=>(
                  <button key={k} className={`chip ${tactic===k?"on":""}`} onClick={()=>setTactic(k)}>{l}</button>
                ))}
              </div>
            </div>
          );
          const wagerRow = (
            <div style={{borderTop:"1px dotted #33271a",marginTop:12,paddingTop:10}}>
              <div className="flex items-center justify-between" style={{marginBottom:6}}>
                <span className="tag">The bookmakers</span>
                {stake>0 && <span className="gold" style={{fontSize:13.5}}>{stake}d at risk</span>}
              </div>
              <div className="flex gap-2" style={{flexWrap:"wrap",marginBottom:7}}>
                <button className={`chip ${stake===0?"on":""}`} onClick={()=>{setStake(0);setAgainst(false);}}>No wager</button>
                {STAKES_OPTS.map(v=>(<button key={v} className={`chip ${stake===v?"on":""}`} disabled={S.gold<v} style={S.gold<v?{opacity:.4}:undefined} onClick={()=>setStake(v)}>{v}d</button>))}
              </div>
              {stake>0 && (<div className="grid grid-cols-2 gap-2">
                <button className={`chip ${!against?"on":""}`} onClick={()=>setAgainst(false)}>Back your man</button>
                <button className={`chip ${against?"on":""}`} style={against?{borderColor:"#7c2a22",color:"#d98476",background:"#2a1512"}:undefined} onClick={()=>setAgainst(true)}>Have him lose</button>
              </div>)}
              {stake>0 && against && <div className="blood" style={{fontSize:13,fontStyle:"italic",marginTop:6}}>He will be told to go down, and he will know you asked.</div>}
            </div>
          );
          if(pick.kind==="pits"){
            body = (<>
              {backBtn}
              <div className="disp" style={{fontSize:15,fontWeight:700,marginBottom:2}}>THE PITS</div>
              <div className="dim" style={{fontSize:14,marginBottom:9}}>{me?`${me.name} takes whoever the pits put in front of him.`:""}</div>
              <div className="tag" style={{marginBottom:6}}>Stakes</div>
              <div className="flex gap-2" style={{flexWrap:"wrap"}}>
                {[["blood","First blood"],["standard","To surrender"],["sine","To the death"]].map(([k,l])=>(
                  <button key={k} className={`chip ${pitStakes===k?"on":""}`} onClick={()=>setPitStakes(k)}>{l}</button>
                ))}
              </div>
              <div className="dim" style={{fontSize:12.5,fontStyle:"italic",marginTop:5}}>
                {pitStakes==="blood"?"Ends at the first real wound — nobody dies."
                  :pitStakes==="standard"?"A beaten man is left to the editor and the crowd."
                  :"No mercy asked or given."}
              </div>
              {tacticRow}
              {wagerRow}
              <button className="btn btn-blood" style={{width:"100%",marginTop:13}} disabled={!fGid} onClick={()=>startFight(fightPit)}>
                Send {me?me.name:"him"} to the pits{stake>0?` · ${stake}d ${against?"against":"on"} him`:""}
              </button>
            </>);
          } else if(pick.kind==="single"){ const o=pick.o; const p=me?winChance(me,o.opp):0.5;
            body = (<>
              {backBtn}
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginBottom:5}}>
                <span className="tag tag-gold">{TIERS[o.tier].name}</span>
                {o.imperial && <span className="tag tag-gold">✦ Rome</span>}
                {o.primus && <span className="tag tag-gold">✦ {o.defence?"Defend the primacy":"For the primacy"}</span>}
                {o.booking && <span className="tag tag-gold">✦ Contracted</span>}
                {o.nemGrudge && <span className="tag tag-blood">✦ The Grudge</span>}
                {o.sagaBout && <span className="tag tag-gold">✦ The Reckoning</span>}
                {o.challenge && !o.nemGrudge && !o.sagaBout && <span className="tag tag-blood">✦ The challenge</span>}
                {o.stakes==="sine" && <span className="tag tag-blood">Sine missione</span>}
                {o.rematch && <span className="tag tag-blood">Rematch</span>}
                {nemesisIn(S,o.opp) && <span className="tag tag-blood">✦ {nemesisIn(S,o.opp).title}</span>}
                <span className="gold" style={{marginLeft:"auto",fontSize:14.5}}>{o.purse}d purse</span>
              </div>
              <div style={{fontSize:15.5}}>{me?me.name:"—"} <span className="dim">against</span> {o.opp.nick?`${o.opp.name}, ${o.opp.nick}`:o.opp.name}</div>
              <div className="dim" style={{fontSize:14}}>{o.opp.cls} · {o.opp.origin}{o.opp.wins!=null?` · ${o.opp.wins}–${o.opp.losses}${o.opp.kills?` · ${o.opp.kills} kills`:""}`:""} · looks {menace(o.opp).toLowerCase()}</div>
              {o.opp.house && <div className="dim" style={{fontSize:13}}>{o.opp.house.startsWith("the")||o.opp.house.startsWith("no")?o.opp.house:"House "+o.opp.house}</div>}
              {o.venue && <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:3}}>{VEN(o.venue).say}</div>}
              {o.sky && <div className="dim" style={{fontSize:13.5,fontStyle:"italic",marginTop:2,color:"#9dc0d4"}}>{SKY(o.sky).say}{shelterOf(o.venue)>0.3?" There is a roof of a kind over most of it.":""}</div>}
              {me && (()=>{ const w=metWord(o.opp,me); return w?<div style={{fontSize:14,marginTop:2,color:"#d8ac5f"}}>{w}</div>:null; })()}
              {!o.watched ? (
                <button className="btn btn-ghost" style={{width:"100%",marginTop:8}} disabled={S.gold<watchCost(S,o)} onClick={()=>haveWatched(o.id)}>Have him watched · {watchCost(S,o)}d</button>
              ) : (
                <div className="panel" style={{padding:9,marginTop:8,background:"#1c1610",borderColor:"#6d5426"}}>
                  <div className="tag tag-gold" style={{marginBottom:4}}>What they saw</div>
                  {o.watched[0]==="nothing" ? <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>Nothing to report. He does everything correctly and nothing twice.</div>
                    : o.watched.map((k,i)=><div key={i} style={{fontSize:14.5,padding:"3px 0"}}>{TELLS[k].say(o.opp)}</div>)}
                  <div className="tag" style={{margin:"7px 0 4px"}}>The plan</div>
                  <div className="grid grid-cols-2 gap-2">
                    {PLAN_KEYS.map(k=>{ const hints=o.watched[0]!=="nothing"&&o.watched.some(t=>TELLS[t].plan===k);
                      return <button key={k} className={`focusbtn ${plan===k?"on":""}`} onClick={()=>setPlan(k)} style={hints?{borderColor:"#c99a4b"}:undefined}>{PLANS[k].name}<span className="sub">{hints?"fits what they saw":PLANS[k].desc}</span></button>; })}
                  </div>
                </div>
              )}
              {me && <div style={{fontSize:13.5,marginTop:6}}><span className="dim">Bookmakers: </span><span className="gold">{oddsWord(oddsFor(p))}</span><span className="dim"> on {me.name} · {oddsWord(oddsFor(1-p))} against</span></div>}
              {tacticRow}
              {wagerRow}
              <button className="btn btn-blood" style={{width:"100%",marginTop:13}} disabled={!fGid} onClick={()=>startFight(()=>fightOffer(o))}>Send {me?me.name:"him"} to the sand</button>
            </>);
          } else if(pick.kind==="pair"){ const o=pick.o;
            body = (<>
              {backBtn}
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginBottom:5}}>
                <span className="tag tag-gold">{TIERS[o.tier].name}</span><span className="tag tag-blood">Pair bout</span>
                <span className="gold" style={{marginLeft:"auto",fontSize:14.5}}>{o.purse}d purse</span>
              </div>
              <div style={{fontSize:15.5}}>{chosen.map(g=>g.name).join(" & ")} <span className="dim">against</span> {o.opps.map(x=>x.name).join(" & ")}</div>
              <div className="dim" style={{fontSize:14}}>{o.opps.map(x=>x.cls).join(" · ")} — they have fought together before.</div>
              {tacticRow}
              <button className="btn btn-blood" style={{width:"100%",marginTop:13}} disabled={pairSel.length!==2} onClick={()=>startFight(()=>fightPair(o))}>Send them out together</button>
            </>);
          } else if(pick.kind==="melee"){ const o=pick.o;
            body = (<>
              {backBtn}
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginBottom:5}}>
                <div className="disp" style={{fontSize:14,fontWeight:700}}>THE MELEE</div><span className="tag tag-blood">Last man standing</span>
                <span className="gold" style={{marginLeft:"auto",fontSize:14.5}}>{o.purse}d purse</span>
              </div>
              <div style={{fontSize:15}}>{o.field.length} men from the other houses. You enter {pairSel.length}.</div>
              <div className="blood" style={{fontSize:14,margin:"6px 0"}}>The editor pays one man. If your two are the last upright, they will be made to finish it.</div>
              <button className="btn btn-blood" style={{width:"100%",marginTop:11}} disabled={pairSel.length<2} onClick={()=>startFight(()=>meleeGo(o))}>Enter {pairSel.length} men</button>
            </>);
          } else if(pick.kind==="hunt"){ const o=pick.o; const B=BEASTS[o.beast]; const reach=me?reachVsBeast(me.kit||defaultKit(me.cls)):1;
            body = (<>
              {backBtn}
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginBottom:5}}>
                <div className="disp" style={{fontSize:14,fontWeight:700}}>THE MORNING HUNT</div>
                <span className="gold" style={{marginLeft:"auto",fontSize:14.5}}>{o.purse}d purse</span>
              </div>
              <div style={{fontSize:15.5,textTransform:"capitalize"}}>{B.name}</div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic",margin:"2px 0 6px"}}>{B.desc}</div>
              <div className="blood" style={{fontSize:14,marginBottom:6}}>No missio. A beast does not see a raised finger.</div>
              {me && <div style={{fontSize:14,marginBottom:6}}>
                {reach>=1.2?<span className="laurel">{me.name} carries the reach — a hunting spear is the whole trick.</span>:reach<0.9?<span className="blood">{me.name} has nothing longer than his arm. He will have to get close.</span>:<span className="dim">{me.name}'s weapon will serve, but a spear would serve better.</span>}
                {me.pfame>=60 && <div className="blood" style={{marginTop:3}}>{PR(me).He} is too well known for this — the cells will take it as an insult.</div>}
              </div>}
              {tacticRow}
              <button className="btn btn-blood" style={{width:"100%",marginTop:13}} disabled={!fGid} onClick={()=>startFight(()=>huntOffer(o))}>Send {me?me.name:"him"} to the beast</button>
            </>);
          }
        }
        return (
          <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:55}} onClick={close}>
            <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
              {header}
              {body}
            </div>
          </div>
        );
      })()}

      {(S.pendingEvent || evResult) && !fight && (
        <div className="modalwrap" role="dialog" aria-modal="true">
          <div className="modal" tabIndex={-1}>
            {evResult ? (<>
              <div className="disp" style={{fontSize:15,fontWeight:700,marginBottom:8}}>IT IS DECIDED</div>
              <div style={{fontSize:16}}>{evResult}</div>
              <button className="btn" style={{width:"100%",marginTop:12}} onClick={()=>setEvResult(null)}>So be it</button>
            </>) : (<>
              <div className="disp" style={{fontSize:15,fontWeight:700,marginBottom:8}}>{S.pendingEvent.title.toUpperCase()}</div>
              <div style={{fontSize:16,marginBottom:6}}>{S.pendingEvent.text}</div>
              {S.pendingEvent.choices.map((c,i)=>(
                <button key={i} className="btn" style={{width:"100%",marginTop:8}} onClick={()=>chooseEv(i)}>{c}</button>
              ))}
            </>)}
          </div>
        </div>
      )}

      {S.over && !fight && (
        <div className="modalwrap" role="dialog" aria-modal="true">
          <div className="modal" tabIndex={-1} style={{borderColor:"#7c2a22"}}>
            <div className="disp blood" style={{fontSize:19,fontWeight:900,marginBottom:8,letterSpacing:".12em"}}>{OVER_TEXT[S.over.kind](S.over).title}</div>
            <div style={{fontSize:16.5}}>{OVER_TEXT[S.over.kind](S.over).text}</div>
            {(()=>{ const c = closing(S), R2 = c.R2, V = verdictOf(c); return (<>
              <div className="panel" style={{padding:11,marginTop:12,background:"#1c1610"}}>
                <div className="dim" style={{fontSize:13.5,marginBottom:5}}>
                  {R2.years} year{R2.years===1?"":"s"} · {S.week} weeks · fame {rnd(S.fame)}
                  {c.gen>1 && ` · ${c.gen} lanistae`}
                  {c.doctrine && ` · ${c.doctrine.name}`}
                </div>
                <div className="grid grid-cols-3 gap-2" style={{fontSize:14.5}}>
                  <div><div className="dim" style={{fontSize:12.5}}>Served</div>{R2.served}</div>
                  <div><div className="dim" style={{fontSize:12.5}}>Bouts</div>{c.bouts}{c.bouts>0 && <span className="dim" style={{fontSize:12}}> · {c.winPc}%</span>}</div>
                  <div><div className="dim" style={{fontSize:12.5}}>Buried</div><span className="blood">{R2.lost}</span></div>
                  <div><div className="dim" style={{fontSize:12.5}}>Freed</div><span className="gold">{R2.freed}</span></div>
                  <div><div className="dim" style={{fontSize:12.5}}>Walked out</div>{R2.out}</div>
                  <div><div className="dim" style={{fontSize:12.5}}>Killed</div>{R2.k}</div>
                </div>
              </div>

              <div className="panel" style={{padding:12,marginTop:9,background:"#1c1610",borderColor:"#6d5426"}}>
                <div className="disp" style={{fontSize:15,color:"#e8d092",marginBottom:4}}>{V.name}</div>
                <div style={{fontSize:15}}>{V.say(c)}</div>
              </div>

              <div className="panel" style={{padding:11,marginTop:9,background:"#1c1610"}}>
                <div className="tag tag-gold" style={{marginBottom:5}}>The account</div>
                {c.best && c.best.wins>0 && (
                  <div style={{fontSize:14.5,borderTop:"1px dotted #33271a",paddingTop:5}}>
                    <span className="dim">The best of them was </span>
                    {c.best.nick? `${c.best.name}, ${c.best.nick}` : c.best.name}
                    <span className="dim"> — {c.best.wins} won, and {fateOf(c.best).verb(c.best)}.</span>
                  </div>
                )}
                {c.styles.length>0 && (
                  <div style={{fontSize:14.5,borderTop:"1px dotted #33271a",paddingTop:5,marginTop:5}}>
                    <span className="dim">Your best style was the </span>{c.styles[0].k.toLowerCase()}
                    <span className="dim"> at {c.styles[0].pc}%{c.styles.length>1 ? `, your worst the ${c.styles[c.styles.length-1].k.toLowerCase()} at ${c.styles[c.styles.length-1].pc}%.` : "."}</span>
                  </div>
                )}
                {c.nemesisHouse && (
                  <div style={{fontSize:14.5,borderTop:"1px dotted #33271a",paddingTop:5,marginTop:5}}>
                    <span className="dim">House {c.nemesisHouse.h} took you apart — </span>{c.nemesisHouse.w} of {c.nemesisHouse.n}
                    <span className="dim">, and they will remember it longer than you will.</span>
                  </div>
                )}
                {c.worstYear && (
                  <div style={{fontSize:14.5,borderTop:"1px dotted #33271a",paddingTop:5,marginTop:5}}>
                    <span className="dim">Year {c.worstYear[0]} was the worst of it — </span>{c.worstYear[1]} buried
                    <span className="dim">.</span>
                  </div>
                )}
                {c.purse>0 && (
                  <div style={{fontSize:14.5,borderTop:"1px dotted #33271a",paddingTop:5,marginTop:5}}>
                    <span className="dim">Purses taken: </span>{c.purse}d
                    <span className="dim">{c.feats? ` · ${c.feats} feat${c.feats===1?"":"s"} to the house.` : "."}</span>
                  </div>
                )}
                {c.freedMen.length>0 && (
                  <div style={{fontSize:14.5,borderTop:"1px dotted #33271a",paddingTop:6,marginTop:6}}>
                    <div className="dim" style={{fontSize:13}}>Walked out on their own legs</div>
                    <div className="gold" style={{fontSize:14.5,marginTop:2}}>{c.freedMen.join(" · ")}</div>
                  </div>
                )}
              </div>
            </>); })()}
            <button className="btn" style={{width:"100%",marginTop:10}} onClick={()=>setAnnals(true)}>Read the annals</button>
            <button className="btn btn-blood" style={{width:"100%",marginTop:8}} onClick={restart}>Begin anew</button>
          </div>
        </div>
      )}
    </div>
  );
}
