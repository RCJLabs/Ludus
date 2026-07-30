import React, { useState, useEffect, useRef } from "react";
import { Coins, Star, Crown, Flame, Swords, Shield, Wine, Users, Landmark, ShoppingBag, X, ChevronRight, Check } from "lucide-react";

/* ================= LUDUS — a lanista's chronicle ================= */

const CSS = `
*,*::before,*::after{box-sizing:border-box}
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');
.lr{overflow-x:hidden;max-width:100%;background:#171210;background-image:radial-gradient(1100px 560px at 50% -8%, #2b2115 0%, #171210 62%);color:#e8d9b8;font-family:'Cormorant Garamond',Georgia,serif;min-height:100vh;font-size:17px;line-height:1.45}
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
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}.spurt{display:none}.hitflash{display:none}}
`;

const STATS = ["str","agi","end","tec","sho","dis"];
const STAT_NAMES = { str:"Strength", agi:"Agility", end:"Endurance", tec:"Technique", sho:"Showmanship", dis:"Discipline" };

const ORIGINS = {
  Thracian: { mod:{str:2,tec:1,sho:1,end:1,dis:-1,agi:0}, blurb:"fury of the mountain tribes",
    names:["Sitalkes","Rhaskos","Bithus","Cotys","Seuthes","Teres","Mucapor","Ziles","Dromas","Spartokos"] },
  Gaul: { mod:{str:3,end:2,tec:-1,agi:0,sho:0,dis:0}, blurb:"wild strength of the north",
    names:["Crixus","Gannicus","Brennus","Segovax","Ambiorix","Dumnorix","Litavicus","Viridomar","Orgetorix","Catuvolcus"] },
  Numidian: { mod:{agi:3,end:2,str:-1,tec:0,sho:0,dis:0}, blurb:"swift as desert wind",
    names:["Juba","Masinissa","Gulussa","Micipsa","Jugurtha","Naravas","Oxynta","Capussa","Barca","Adherbal"] },
  Greek: { mod:{tec:2,dis:2,sho:1,str:-1,agi:0,end:0}, blurb:"schooled in the old arts",
    names:["Nikandros","Theron","Lykos","Demetrios","Kallias","Philon","Xanthos","Alexios","Oenomaus","Hektor"] },
  Syrian: { mod:{sho:2,agi:2,tec:1,end:-1,str:0,dis:0}, blurb:"a flair the crowd adores",
    names:["Azizus","Malchus","Barates","Zabdas","Iarhai","Abgar","Sohaemus","Bassus"] },
  Iberian: { mod:{tec:2,agi:1,end:1,dis:1,str:0,sho:-1}, blurb:"born to the blade",
    names:["Indibilis","Mandonius","Audax","Ditalco","Minurus","Corocotta","Retogenes","Istolatius"] },
  Germanic: { mod:{str:2,end:3,sho:-1,dis:-1,agi:0,tec:0}, blurb:"relentless as winter",
    names:["Agron","Segimer","Chariovalda","Sigmund","Baldric","Warin","Theudobald","Duro"] },
};

const FNAMES = {
  Thracian:["Bendida","Zoila","Rhodope","Sitalka","Teuta","Berenike","Doris"],
  Gaul:["Boudica","Epona","Rigantona","Cartimandua","Damona","Solimara"],
  Numidian:["Tanit","Sophonisba","Zaina","Massyla","Kahina","Aelia"],
  Greek:["Achillia","Amazonia","Thalia","Kleio","Melite","Phoibe","Xanthe"],
  Syrian:["Zenobia","Bathzabbai","Aziza","Shamsi","Martha","Salma"],
  Iberian:["Ilerda","Bastia","Turia","Aracia","Baria","Nerea"],
  Germanic:["Ganna","Veleda","Alruna","Swanhild","Thusnelda","Frida"],
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
  gladius:  {slot:"weapon",art:"sword",  name:"Gladius",          price:0,   atk:.05,def:0,   spd:0,   sho:0,   styles:["Murmillo","Secutor","Hoplomachus"], desc:"Short, straight, brutally efficient."},
  gladius_f:{slot:"weapon",art:"sword",  name:"Noric Gladius",    price:260, atk:.09,def:.02, spd:.01, sho:.02, styles:["Murmillo","Secutor","Hoplomachus"], desc:"Folded northern steel. Holds its edge through a long day."},
  sica:     {slot:"weapon",art:"curved", name:"Sica",             price:0,   atk:.05,def:0,   spd:.02, sho:.03, styles:["Thraex"], desc:"The curved Thracian blade. Finds what hides behind a shield."},
  sica_f:   {slot:"weapon",art:"curved", name:"Serpent Sica",     price:280, atk:.09,def:0,   spd:.03, sho:.05, styles:["Thraex"], desc:"A wicked hook of a blade, chased with silver."},
  hasta:    {slot:"weapon",art:"spear",  name:"Hasta",            price:0,   atk:.06,def:.03, spd:-.01,sho:0,   styles:["Hoplomachus"], desc:"Keeps a man at arm's length — and then some."},
  hasta_f:  {slot:"weapon",art:"spear",  name:"Ash Hasta",        price:300, atk:.10,def:.04, spd:-.01,sho:.02, styles:["Hoplomachus"], desc:"Ash and iron, balanced to a hair."},
  fuscina:  {slot:"weapon",art:"trident",name:"Fuscina",          price:0,   atk:.06,def:.02, spd:.02, sho:.04, styles:["Retiarius"], desc:"Three points, and the reach to use them."},
  fuscina_f:{slot:"weapon",art:"trident",name:"Barbed Fuscina",   price:290, atk:.10,def:.02, spd:.02, sho:.06, styles:["Retiarius"], desc:"Barbed points that do not come free clean."},
  twin:     {slot:"weapon",art:"dual",   name:"Twin Blades",      price:420, atk:.13,def:-.08,spd:.03, sho:.11, styles:["Dimachaerus"], desc:"Two swords, no shield. Every wound you take is one the crowd sees."},
  twin_f:   {slot:"weapon",art:"dual",   name:"Dimachaerus Pair", price:700, atk:.16,def:-.07,spd:.03, sho:.16, styles:["Dimachaerus"], desc:"Matched blades, mirror-bright. Death in either hand."},
  securis:  {slot:"weapon",art:"axe",    name:"Securis",          price:350, atk:.15,def:-.04,spd:-.06,sho:.07, styles:["Murmillo","Secutor"], desc:"A headsman's axe. Slow, and final."},
  pugio:    {slot:"weapon",art:"dagger", name:"Pugio",            price:80,  atk:-.03,def:0,  spd:.09, sho:-.02,styles:[], desc:"A last resort — or a fast man's whole plan."},
  // --- OFFHAND ---
  scutum:   {slot:"offhand",art:"scutum", name:"Scutum",          price:0,   atk:0,  def:.15, spd:-.06,sho:0,   styles:["Murmillo","Secutor"], desc:"A wall you carry. Heavy as sin."},
  scutum_f: {slot:"offhand",art:"scutum", name:"Bronzed Scutum",  price:320, atk:0,  def:.18, spd:-.05,sho:.03, styles:["Murmillo","Secutor"], desc:"Oak faced in bronze. Turns an axe."},
  parmula:  {slot:"offhand",art:"parmula",name:"Parmula",         price:0,   atk:.02,def:.08, spd:-.01,sho:.01, styles:["Thraex","Dimachaerus"], desc:"Small and square. Trades cover for speed."},
  clipeus:  {slot:"offhand",art:"clipeus",name:"Clipeus",         price:0,   atk:0,  def:.11, spd:-.03,sho:.01, styles:["Hoplomachus"], desc:"The round Greek shield."},
  rete:     {slot:"offhand",art:"net",    name:"Rete",            price:0,   atk:.04,def:.03, spd:.01, sho:.07, styles:["Retiarius"], desc:"Cast well and the fight is already over."},
  offnone:  {slot:"offhand",art:"none",   name:"Free Hand",       price:0,   atk:.03,def:-.03,spd:.04, sho:.04, styles:[], desc:"Nothing to hide behind, and nothing to slow him."},
  // --- HELMS ---
  galea_m:  {slot:"helm",art:"crest",  name:"Crested Galea",      price:0,   atk:0,  def:.08, spd:-.02,sho:.03, styles:["Murmillo","Dimachaerus","Secutor"], desc:"Tall crest, broad brim, heavy as a bucket."},
  galea_s:  {slot:"helm",art:"smooth", name:"Secutor Helm",       price:0,   atk:0,  def:.11, spd:-.03,sho:-.02,styles:["Secutor"], desc:"Smooth and faceless, so a net finds no purchase."},
  galea_t:  {slot:"helm",art:"griffin",name:"Griffin Galea",      price:0,   atk:0,  def:.07, spd:-.02,sho:.06, styles:["Thraex"], desc:"Crowned with a griffin. The crowd knows it at fifty paces."},
  galea_h:  {slot:"helm",art:"brim",   name:"Brimmed Galea",      price:0,   atk:0,  def:.08, spd:-.02,sho:.03, styles:["Hoplomachus"], desc:"Wide brim, plumed. Greek fashion."},
  galea_x:  {slot:"helm",art:"silver", name:"Silvered Galea",     price:380, atk:0,  def:.10, spd:-.02,sho:.10, styles:[], desc:"Silver chasing and a scarlet plume. Editors remember a man in this."},
  helmnone: {slot:"helm",art:"bare",   name:"Bare Head",          price:0,   atk:.02,def:-.05,spd:.05, sho:.08, styles:[], desc:"Let them see his face. Let them learn his name."},
  // --- ARMOR ---
  manica:   {slot:"armor",art:"manica", name:"Manica",            price:0,   atk:0,  def:.06, spd:-.01,sho:0,   styles:[], desc:"Layered linen and leather down the sword arm."},
  ocreae:   {slot:"armor",art:"greaves",name:"Ocreae",            price:0,   atk:0,  def:.07, spd:-.02,sho:.01, styles:[], desc:"Bronze greaves. A man fights on his legs."},
  subarm:   {slot:"armor",art:"padded", name:"Subarmalis",        price:240, atk:0,  def:.14, spd:-.06,sho:0,   styles:[], desc:"Padded torso guard. Slow, but you keep your ribs."},
  gilded:   {slot:"armor",art:"gilded", name:"Gilded Harness",    price:520, atk:0,  def:.12, spd:-.04,sho:.12, styles:[], desc:"Gold leaf over good iron. Vanity that happens to work."},
  armnone:  {slot:"armor",art:"none",   name:"Bare",              price:0,   atk:.02,def:-.04,spd:.07, sho:.03, styles:[], desc:"Nothing but a loincloth and nerve."},
};
const SLOTS = ["weapon","offhand","helm","armor"];
const SLOT_NAME = { weapon:"Weapon", offhand:"Off-hand", helm:"Helm", armor:"Armor" };
const DEFAULT_KIT = {
  Murmillo:    {weapon:"gladius", offhand:"scutum",  helm:"galea_m",  armor:"manica"},
  Thraex:      {weapon:"sica",    offhand:"parmula", helm:"galea_t",  armor:"manica"},
  Hoplomachus: {weapon:"hasta",   offhand:"clipeus", helm:"galea_h",  armor:"ocreae"},
  Secutor:     {weapon:"gladius", offhand:"scutum",  helm:"galea_s",  armor:"manica"},
  Retiarius:   {weapon:"fuscina", offhand:"rete",    helm:"helmnone", armor:"manica"},
  Dimachaerus: {weapon:"twin",    offhand:"offnone", helm:"galea_m",  armor:"manica"},
};
const FINE_OF = { gladius:"gladius_f", sica:"sica_f", hasta:"hasta_f", fuscina:"fuscina_f", twin:"twin_f", scutum:"scutum_f" };
const defaultKit = cls => Object.assign({}, DEFAULT_KIT[cls] || DEFAULT_KIT.Murmillo);
const isBasic = id => !!GEAR[id] && GEAR[id].price===0;

/* Bought steel wears. House stock does not — it is maintained, that is what it is for. */
const wears = it => !!it && it.price > 0;
const wearOf = (g, s) => (g && g.wear && g.wear[s]!=null) ? clamp(g.wear[s], 0, 100) : 100;
const wearEff = c => 0.5 + c/200;
const wearWord = c => c>=85 ? "keen" : c>=60 ? "serviceable" : c>=35 ? "worn" : c>=15 ? "failing" : "all but gone";
const wearColour = c => c>=60 ? "#9aa86a" : c>=35 ? "#d8ac5f" : "#d96f5d";
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
    chron(d, `You gave him your word and then you kept it. That is not a thing the cells had a lot of evidence for.`, "good");
  }
}
/* you did the one thing he asked you not to */
function ambitionBroken(d, g){
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

const R = Math.random;
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
  return prior>0;
}
const retireEligible = g => g.age>=31 || scarBurden(g)>=20;

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
  blood: { weeks:4, gain:14, loss:11,
    ask:(d,p)=>`${p.name} wants a death at the next games. Not a bout — a death.`,
    done:"He got what he came for. He will remember that you provided it." },
  spectacle: { weeks:4, gain:12, loss:8,
    ask:(d,p)=>`${p.name} is bored. He wants a bout the city will still be talking about next month — a crowd on its feet.`,
    done:"The roar reached his box, and he stood with the rest of them." },
  mercy: { weeks:5, gain:13, loss:9,
    ask:(d,p)=>`${p.name} has grown sick of the killing. Show the crowd a beaten man spared and it will be noticed.`,
    done:"The thumb turned up, and she was watching you when it did." },
  win: { weeks:4, gain:11, loss:8,
    ask:(d,p)=>`${p.name} has money on your house at the coming games. See that it is not wasted.`,
    done:"He collected. That is the only kind of gratitude this one has." },
  party: { weeks:5, gain:12, loss:9,
    ask:(d,p)=>`${p.name} has let it be known — twice — that he has not been to your villa in some time.`,
    done:"He came, he drank your wine, and he left in a better humour than he arrived." },
  sell: { weeks:5, gain:16, loss:10,
    ask:(d,p,g)=>`${p.name} has taken an interest in ${g?fullName(g):"one of your men"} and would like to own him.`,
    done:"The man was delivered. Coin and goodwill both." },
  showman: { weeks:4, gain:13, loss:9,
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
  p.want = { kind, gid, weeks: WANTS[kind].weeks };
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
    p.favor = clamp(p.favor - 0.35, 0, 100);   // standing decays without attention
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
const REGIMENS = {
  palus: { name:"The Palus", short:"PALUS", desc:"Post work with the wooden sword. Steady, safe, and slow." },
  spar:  { name:"Sparring",  short:"SPAR",  desc:"Paired against another of your men. Both improve faster — and both can be hurt." },
  cond:  { name:"Conditioning", short:"COND", desc:"Running the hill, hauling stone. Builds wind and sheds fatigue." },
  rest:  { name:"Rest",      short:"REST",  desc:"A day out of the sun. Nothing gained but everything mended." },
};
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
    g.wear[s] = Math.max(0, g.wear[s] - n);
    if(g.wear[s] <= 0){
      if(isNamed(g,s)){ g.wear[s] = 25;
        chron(d, `${g.named.title} comes off the sand bent and notched, but it comes off the sand. The smith says he can save it.`, "bad");
        continue;
      }
      const broke = it.name;
      g.kit[s] = defaultKit(g.cls)[s];
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
      g.wear[s] = Math.min(100, g.wear[s] + L*2.2);
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

function makeDoctore(d, quality){
  const origin = pick(Object.keys(ORIGINS));
  const skill = clamp(quality + ri(-8,8), 30, 82);
  return { id:d.nextId++, name:pick(ORIGINS[origin].names), origin, fromHouse:false,
    spec: pick(STATS), skill, weeks:0,
    fee: rnd(skill*7 + 60), wage: rnd(8 + skill*0.22),
    past: `${ri(3,14)} years on the sand, and the scars to argue it` };
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
const rudisEligible = g=> !isAuctor(g) && g.wins>=10 && g.pfame>=90;
const fullName = g=> g.nick? `${g.name}, ${g.nick}` : g.name;

function chron(d, text, kind){ d.log.unshift({ week:d.week, text, kind:kind||"info" }); d.log = d.log.slice(0,40); }

function genGladiator(d, quality){
  const origin = pick(Object.keys(ORIGINS));
  const cls = pick(Object.keys(CLASSES));
  const fem = R() < 0.10;
  const g = { id:d.nextId++, sex: fem?"f":"m",
    name: pick(fem ? FNAMES[origin] : ORIGINS[origin].names), nick:null, origin, cls,
    morale:60, fatigue:0, wins:0, losses:0, kills:0, pfame:0, status:"active", injury:null,
    focus:CLASSES[cls].key[0], regimen:"palus", sparWith:null, age:ri(18,32), lastFought:-9, traits:[], legend:false, returnWeek:0,
    kit: defaultKit(cls), wear:{weapon:100,offhand:100,helm:100,armor:100}, scars:[], scarCap:{}, weeksAged:0 };
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

function makeMarket(d){
  d.market = [];
  for(let i=0;i<4;i++){
    const quality = R()<0.12 ? ri(75,92) : ri(30,68);
    d.market.push(genGladiator(d, quality));
  }
  /* a free man standing at the edge of the block, waiting to be spoken to */
  if(R()<0.3) d.market[ri(0,3)] = makeAuctoratus(d, ri(44,72));
}

function makeGames(d){
  if(d.rome && d.rome.travel<=0){
    if(d.rome.fought >= ROME_BOUTS){ d.games = null; return; }
    d.games = { festival:"the imperial games", offers:[makeImperialBout(d)], week:d.week };
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
    const sineOdds = 0.18 + (st==="blood" ? 0.22 : 0) - (st==="mercy" ? 0.13 : 0);
    const sine = F.allSine ? true : F.noSine ? false : (tier>=1 && R()<sineOdds);
    const pr = pickRivalOpp(d, tier);
    offers.push({ id:d.nextId++, tier, festival, opp:pr.opp, oppRef:pr.ref, rematch:pr.rematch, grudgeM:pr.grudgeM,
      stakes:sine?"sine":"standard",
      purse: rnd((t.purse[0]+R()*t.purse[1]) * (sine?1.8:1) * (pr.rematch?1.25:1) * (F.purse||1)
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
      purse: rnd((t.purse[0]+R()*t.purse[1]) * 1.7 * (F.purse||1)) });
  };
  const st = repStyle(d);
  const slots = (F.offers==null ? 2 : F.offers) + (st==="show" ? 1 : 0);
  add(1);
  if(slots>=2 && d.fame>=60 && R()<0.8) add(1);
  if(slots>=3 && d.fame>=TIERS[2].fame) add(2);
  if(slots>=4 && d.fame>=TIERS[3].fame && d.favor>=40 && R()<0.6) add(3);
  if(d.fame>=TIERS[1].fame && activeG(d).length>=2 && R()<0.45) addPair(d.fame>=TIERS[2].fame ? 2 : 1);
  if(d.fame>=TIERS[1].fame && activeG(d).length>=2 && R()<0.3){
    const tier = d.fame>=TIERS[2].fame ? 2 : 1;
    const size = ri(4,5);
    const field = [];
    for(let i=0;i<size;i++) field.push(pickRivalOpp(d, Math.max(0,tier-1)).opp);
    offers.push({ id:d.nextId++, tier, festival, melee:true, field, stakes:"melee",
      purse: rnd((TIERS[tier].purse[0]+R()*TIERS[tier].purse[1]) * 4.0 * (F.purse||1)) });
  }
  if(R()<0.5){
    const tier = d.fame>=TIERS[2].fame ? 2 : d.fame>=TIERS[1].fame ? 1 : 0;
    const opts = beastTier(tier);
    const [key, B] = pick(opts);
    offers.push({ id:d.nextId++, tier, festival, venatio:true, beast:key, stakes:"venatio",
      purse: rnd((TIERS[tier].purse[0]+R()*TIERS[tier].purse[1]) * B.purse * (F.purse||1)) });
  }
  if(d.fame>=TIERS[2].fame) add(2);
  if(d.fame>=TIERS[2].fame && R()<0.5) add(2);
  if(d.fame>=TIERS[3].fame && d.favor>=40 && R()<0.45) add(3);
  d.games = { festival, offers, week:d.week, fest:F.key };
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

function rivalWeekly(d){
  if(!d.rivals) return;
  d.rivals.forEach(h=>{
    const L = lanistaOf(h.name);
    h.grudge = clamp(h.grudge - 1*L.grudgeDecay, 0, 100);
    h.fighters.forEach(f=>{
      if(f.injury){ f.injury.weeks--; if(f.injury.weeks<=0) f.injury=null; }
      else { for(const k of CLASSES[f.cls].key) f[k] = clamp(f[k] + (0.25 + f.potential/300)*L.train, 5, 97); }
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

function pickRivalOpp(d, tier){
  if(!d.rivals) return { opp:genOpponent(tier), ref:null, rematch:false, grudgeM:false };
  const bands = [[22,46],[38,60],[54,76],[66,99]];
  const avg = f => STATS.reduce((s,k)=>s+f[k],0)/6;
  const pool = [];
  d.rivals.forEach(h=>h.fighters.forEach(f=>{ if(!f.injury) pool.push({h,f}); }));
  let fitPool;
  if(tier===3) fitPool = pool.slice().sort((a,b)=>avg(b.f)-avg(a.f)).slice(0,3);
  else fitPool = pool.filter(p=>{ const a=avg(p.f); return a>=bands[tier][0] && a<=bands[tier][1]; });
  if(!fitPool.length) fitPool = pool;
  if(!fitPool.length) return { opp:genOpponent(tier), ref:null, rematch:false, grudgeM:false };
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
  if(S.rome===undefined) S.rome = null;
  if(S.poach===undefined) S.poach = null;
  if(!S.defected) S.defected = [];
  if(!S.buildings) S.buildings = {};
  if(S.nemesis===undefined) S.nemesis = null;
  if(!S.gearCond) S.gearCond = {};
  if(!S.forged) S.forged = [];
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

function newGameState(name, scen){
  const S = SCENARIOS[scen] || SCENARIOS.clean;
  const d = { ver:16, nextId:1, name, week:1, gold:S.gold, fame:S.fame, favor:0, unrest:S.unrest, trainMult:1,
    gladiators:[], market:[], games:null, pendingEvent:null, log:[], fallen:[], freed:[],
    lastParty:-9, lastFeast:-9, over:null, milestone600:false, flags:{learned:{}}, escaped:[], rebellion:null, gear:{}, retired:[],
    doctore:null, doctoreMarket:[], doctoreOffer:null, ties:[], patrons:[], rome:null, romeOffer:null, poach:null, defected:[], nemesis:null, buildings:{}, gearCond:{}, forged:[], rep:{blood:0,show:0,craft:0,mercy:0}, departed:[], reSignOffer:null, annals:[] };
  d.rivals = makeRivals(d);
  S.men.forEach((band,i)=>{
    const g = genGladiator(d, ri(band[0], band[1]));
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
  makeMarket(d);
  makeDoctoreMarket(d);
  d.patrons = [makePatron(d,"magistrate"), makePatron(d,"merchant")];
  recomputeFavor(d);
  chron(d, `${S.name}. ${S.blurb}`);
  return d;
}

/* ================= FIGHT ENGINE ================= */

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
  let p = e("tec")*1.25 + e("str") + e("agi")*0.85 + e("dis")*0.3;
  p *= 0.85 + (f.morale/100)*0.3;
  p *= 1 - clamp(f.fatigue,0,100)/300;
  if(COUNTERS[f.cls]===oppCls) p *= 1.12;
  if(tactic==="aggressive") p *= 1.13;
  if(tactic==="defensive") p *= 0.9;
  if(tactic==="showboat") p *= 0.96;
  p *= 1 + clamp(mom||0,-3,3)*0.03;
  p *= 1 + (f.mods ? f.mods.atk*0.6 + f.mods.def*0.30 : 0);
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

  /* the moment the bout is genuinely in the balance and one word from the box would matter */
  const cruxNow = r => O.stopAtCrux && !ended && stakes!=="blood" && r>=3 && r<=6 && (vA<=74 || vB<=70);
  let crux = null;
  const startR = R0 ? R0.round : 0;

  for(let r=startR+1; r<=12 && !ended; r++){
    round = r;
    const moveA = pick(ATTACKS[A.cls]), moveB = pick(ATTACKS[B.cls]);
    const modA = 0.97+R()*0.06, modB = 0.97+R()*0.06;
    const pA = power(A,tA,B.cls,mom,modA) * (0.72+R()*0.56) * (sA<22?0.78:1);
    const pB = power(B,tB,A.cls,-mom,modB) * (0.72+R()*0.56) * (sB<22?0.78:1);
    sA -= (tA==="aggressive"?9:7) * (1 - A.mods.spd*0.5);
    sB -= (tB==="aggressive"?9:7) * (1 - B.mods.spd*0.5);
    const diff = Math.abs(pA-pB);
    if(diff < 7){
      crowd = clamp(crowd+2,0,100);
      mom = mom>0? mom-1 : mom<0? mom+1 : 0;
      push("clash", pick(CLASH_L)(A.name, B.name));
    } else {
      const atkIsA = pA>pB;
      const atk = atkIsA?A:B, def = atkIsA?B:A;
      const move = atkIsA?moveA:moveB;
      const tgt = pick(TARGETS);
      let dmg = 5 + diff/9 + atk.str/14;
      dmg *= takeMult(atkIsA?tB:tA) * tgt[2];
      if(ctx.guarded && atkIsA===false) dmg *= 0.44;
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
      crux = { vA, vB, sA, sB, crowd, mom, round:r, tB, tiredA, tiredB, c50, c80 };
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
      const spare = crowd*0.33 + A.pfame*0.3 + ctx.favor*0.5 + A.sho*0.2 + A.heart*0.1 + (100-vB)*0.15 + lean
        + (ctx.guarded?12:0) + R()*22 - (ctx.tier===0?8:0) - (ctx.hostile?18:0);
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
];
const lessonFor = (d, tab) => LESSONS.find(l => l.tab===tab && !(d.flags.learned||{})[l.id]);

/* ---- THE MEDICUS ----
   A wound is no longer a countdown. Let it mend, buy the surgeon, or send him out
   on it and find out what that costs. */
const CARE = {
  rest:    { name:"Let it mend",  desc:"The slow way. He is off the sand until it closes." },
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
const healSpeed   = d => 1 + bLevel(d,"valetudinarium")*0.45;          // extra weeks shaved per week
const scarGuard   = d => [1, 0.85, 0.70, 0.55][bLevel(d,"valetudinarium")];
const surgeonOK   = d => bLevel(d,"valetudinarium") >= 1;
const bathRest    = d => bLevel(d,"balneae")*3;                        // fatigue shed per week
const bathMorale  = d => bLevel(d,"balneae")*0.5;
const cellCalm    = d => bLevel(d,"carceres")*0.5;
const gearPrice   = (d,p) => { const F = festivalNow(d); return rnd(p * [1, 0.9, 0.8, 0.7][bLevel(d,"armamentarium")] * (F && F.gear ? F.gear : 1)); };
const palusTrain  = d => 1 + bLevel(d,"palus")*0.08;
const palusGuard  = d => [1, 0.9, 0.8, 0.7][bLevel(d,"palus")];

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

/* ---- POACHING ----
   A rival with a grudge does not only want to beat your men. He wants them.
   A discontented gladiator is a door left open, and they know which of yours is which. */
function poachTarget(d, h){
  const act = activeG(d).filter(g=>g.defiance>=45 && !isAuctor(g));
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
const romeReady = d => !d.rome && !d.romeOffer && !d.over && d.fame >= TIERS[4].fame
  && (!d.flags.romeDeclined || d.week - d.flags.romeDeclined >= 30)
  && patronsOf(d).some(p=>p.rank==="senator" && p.favor>=70)
  && activeG(d).length >= 2;

function offerRome(d){
  const sen = patronsOf(d).find(p=>p.rank==="senator" && p.favor>=70);
  d.romeOffer = { senator: sen ? sen.name : "a senator of Rome" };
  chron(d, `A letter under an imperial seal. ${d.romeOffer.senator} has put your house forward for the games at Rome.`, "good");
}

function makeImperialBout(d){
  const opp = genOpponent(3, ri(92, 99));
  opp.kit = kitFor(opp.cls, 3);
  opp.nick = opp.nick || pick(NICKS);
  const sine = R() < 0.5;
  return { id:d.nextId++, tier:4, festival:"the imperial games", imperial:true,
    opp, oppRef:null, rematch:false, grudgeM:false, stakes: sine ? "sine" : "standard",
    purse: rnd((TIERS[4].purse[0] + R()*TIERS[4].purse[1]) * (sine?1.5:1)) };
}

function romeWeek(d){
  const r = d.rome;
  if(!r) return;
  if(r.travel > 0){
    r.travel--;
    d.gold -= 40;
    chron(d, r.travel>0
      ? `The road north. Wagons, tolls, and men who have never been out of Campania looking at the hills.`
      : `Rome. The imperial sand is bigger than the whole of your ludus, and it is already stained.`, "event");
    return;
  }
  if(r.fought >= ROME_BOUTS){
    d.over = r.won >= 2 ? { kind:"triumph", won:r.won, name:d.name } : { kind:"romeFall", won:r.won, name:d.name };
  }
}

/* ---- THE MELEE (gregatim) ----
   Six or eight men on the sand at once, drawn from every house in Capua, and the
   editor pays the last one standing. Enter two of your own and you have accepted
   that they may be the last two — and the editor will not take two victors. */
function shuffled(a){ const c = a.slice(); for(let i=c.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [c[i],c[j]]=[c[j],c[i]]; } return c; }

function simulateMelee(ents, ctx){
  const beats = [];
  const n = ents.length;
  ents.forEach(e=>{ e.mods = kitMods(e.kit, e.cls, e); e.hpv = 100; e.stam = 55+e.end*0.6; e.out = false; e.dead = false; });
  let crowd = clamp(24 + ents.reduce((s,e)=>s+e.sho,0)/n/5, 0, 100), round = 0;
  const mine = i => ents[i].mine;
  const alive = () => ents.map((e,i)=>i).filter(i=>!ents[i].out);
  const push = (kind, text, extra) => beats.push(Object.assign({
    kind, text, round, melee:true,
    hp: ents.map(e=>clamp(e.hpv,0,100)), out: ents.map(e=>e.out), dead: ents.map(e=>e.dead),
    crowd: clamp(crowd,0,100), mom:0, vA:100, vB:100, sA:100, sB:100, a:null, b:null, actor:null
  }, extra||{}));

  const houses = [...new Set(ents.filter(e=>!e.mine).map(e=>e.house))];
  push("intro", `${n} on the sand at once — ${ents.filter(e=>e.mine).length} of yours against the best of ${houses.slice(0,3).join(", ")}. The editor pays the last one standing and nobody else.`);
  push("salute", `They do not salute each other. There is no pairing to salute.`);

  const drop = (i, killer) => {
    const e = ents[i];
    e.out = true;
    push("fall", `${e.name} goes down.`, { a:i, actor:"a" });
    const spare = crowd*0.25 + (e.pfame||0)*0.25 + (e.mine ? ctx.favor*0.45 : 30) + e.sho*0.15
      + (e.heart||50)*0.1 + (e.mine && ctx.patron ? ctx.patron.favor*0.11 : 0) + R()*22 - 16;
    if(spare >= 44){ push("spared", `Hands drag ${e.name} clear of the sand before the rest trample ${PR(e).him}.`, { a:i }); }
    else { e.dead = true; push("death", `${killer? killer.name+" finishes "+PR(e).him+" where "+PR(e).he+" lies." : PR(e).He+" does not get up, and the melee moves over "+PR(e).him+"."}`, { a:i }); }
  };

  for(let r=1; r<=26; r++){
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
  }

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
  const odds = oddsFor(backedHim ? p : 1-p);
  if(hit){
    const pay = rnd(bet.amount * odds);
    d.gold += pay;
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

function doMelee(d, ids, offer){
  const gs = ids.map(i=>d.gladiators.find(x=>x.id===i)).filter(g=>g && g.status==="active");
  if(gs.length<2) return null;
  const t = TIERS[offer.tier];
  const ents = gs.map(g=>{ const c = clone(g); c.kit = g.kit||defaultKit(g.cls); c.mine = true; c.gid = g.id; c.house = null; return c; });
  offer.field.forEach(o=>{ const c = clone(o); c.kit = o.kit||defaultKit(o.cls); c.mine = false; c.gid = null; ents.push(c); });
  const patron = topPatron(d);
  const res = simulateMelee(shuffled(ents), {
    favor:d.favor, patron: patron?{name:patron.name,favor:patron.favor}:null,
    tie:(a,b)=> (a&&b) ? tieBetween(d,a,b) : null });

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
  } else {
    d.fame = Math.max(0, d.fame+2);
    const stood = res.ents.filter(e=>e.mine && !e.out).length;
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
    if(e.dead){
      g.status = "dead";
      d.fallen.push({ name:fullName(g), week:d.week });
      const grieving = kinReact(d, g.id, "brother", -22, 12);
      d.unrest = clamp(d.unrest + 5 + grieving.length*3, 0, 100);
      dropTies(d, g.id);
      sum.push(`${g.name} is dead.`);
    } else if(e.out){
      g.losses++;
      const inj = injuryFor(pick(TARGETS)[0], true);
      g.injury = inj; g.status = "injured";
      g.morale = clamp(g.morale-6,0,100);
      sum.push(`${g.name} was carried off: ${inj.name.toLowerCase()}, ${inj.weeks} week${inj.weeks>1?"s":""}.`);
    }
  });

  chron(d, won ? `${res.ents[res.winner].name} was last one standing in the melee at ${offer.festival||"the games"} (+${offer.purse}d).`
    : `Your men were beaten in the melee at ${offer.festival||"the games"}.`, won?"good":"bad");
  serveWants(d, { type:"fight", gid:ids[0], win:won, oppDied:res.ents.some(e=>!e.mine&&e.dead),
    spared:false, crowd:rnd(res.crowd), tier:offer.tier, stakes:"melee" });
  if(d.games) d.games.offers = d.games.offers.filter(o=>o.id!==offer.id);
  return { beats:res.beats, sum, win:won, dead:res.ents.some(e=>e.mine&&e.dead), crowd:rnd(res.crowd),
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
      beats:res.beats, crux:true, venatio:true, beast:offer.beast, tier:offer.tier, stakes:"venatio", festival:offer.festival,
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
    g.status = "dead"; g.fateNote = "beasts";
    d.fallen.push({ name:fullName(g)+" — to the beasts", week:d.week });
    const grieving = kinReact(d, gid, "brother", -22, 12);
    d.unrest = clamp(d.unrest + 8 + grieving.length*3, 0, 100);
    d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-9,0,100); o.defiance=clamp(o.defiance+6,0,100); } });
    dropTies(d, gid);
    sum.push(`${g.name} is dead. There was not enough left to carry out whole.`);
  } else if(res.vA < 62 || res.forfeit){
    const inj = injuryFor(res.lastTarget, res.vA<40);
    g.injury = inj; g.status = "injured";
    sum.push(`Clawed open: ${inj.name.toLowerCase()}, ${inj.weeks} week${inj.weeks>1?"s":""} to mend.`);
  }

  chron(d, res.aDies
    ? `${g.name} was killed by ${B.name} at the morning hunt.`
    : res.killed ? `${g.name} killed ${B.name} before the crowd (+${offer.purse}d).`
    : `${g.name} survived the hunt without a kill.`, res.aDies?"bad":res.killed?"good":"info");
  serveWants(d, { type:"fight", gid, win:res.killed, oppDied:res.killed,
    spared:false, crowd:rnd(res.crowd), tier:offer.tier, stakes:"venatio" });
  if(d.games) d.games.offers = d.games.offers.filter(o=>o.id!==offer.id);
  return { beats:res.beats, sum, win:res.killed, dead:res.aDies, crowd:rnd(res.crowd),
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
    const purse = offer.purse; d.gold += purse;
    const fg = rnd(t.fameGain*1.6 + res.crowd/14);
    d.fame += fg;
    gs.forEach((g,i)=>{ if(!res.dead.A[i]){ g.wins++; g.pfame += rnd(fg*0.5); g.morale=clamp(g.morale+10,0,100);
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
      g.status = "dead";
      d.fallen.push({ name:fullName(g), week:d.week });
      const grieving = kinReact(d, g.id, "brother", -22, 12);
      d.unrest = clamp(d.unrest + (offer.stakes==="sine"?7:4) + grieving.length*3, 0, 100);
      dropTies(d, g.id);
      sum.push(`${g.name} is dead.`);
    } else if(res.down.A[i]){
      const inj = injuryFor(pick(TARGETS)[0], true);
      g.injury = inj; g.status = "injured";
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
  return { beats:res.beats, sum, win:res.win, dead:res.dead.A.some(Boolean), crowd:rnd(res.crowd),
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

const CRUX = {
  press: { label:"Press him", short:"PRESS",
    desc:"Onto the front foot. He hits harder and takes more doing it.",
    tactic:"aggressive", line:g=>`You put your voice across the sand and ${g.name} goes forward.` },
  cover: { label:"Cover up", short:"COVER",
    desc:"Behind the guard and wait. He wins less and lives more.",
    tactic:"measured", line:g=>`${g.name} hears it and gets everything behind the guard.` },
  cloth: { label:"Throw in the cloth", short:"THE CLOTH",
    desc:"Forfeit. He loses and lives, and Capua watches you do it.",
    tactic:null, line:g=>`` },
};

function doFight(d, gid, offer, tactic, bet, pending, choice){
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
  if(offer.stakes==="sine" && g.ambition && g.ambition.kind==="nokill") ambitionBroken(d, g);
  if(offer.rematch && g.ambition && g.ambition.kind==="revenge") ambitionMet(d, g);
  const F = (d.games && d.games.fest) ? CALENDAR.find(x=>x.key===d.games.fest) : null;
  const imperial = !!offer.imperial;
  const simCtx = { favor: imperial ? Math.min(d.favor, 20) : d.favor, tier: Math.min(offer.tier,3),
      hostile:!!bribeHouse, patron: imperial ? null : (patron ? {name:patron.name, favor:patron.favor} : null),
      repShow: (repStyle(d)==="show" ? 8 : 0) + (nem ? 10 : 0), guarded: choice==="cover" };
  let res;
  if(choice==="cloth"){
    /* you stop it yourself; there is no appeal to lose because nobody asked for one */
    res = { beats:[Object.assign({}, pending.crux, { kind:"end", actor:null, text:
      `A white cloth goes over the rail from your box. The editor's man steps between them and the crowd finds out what it thinks about that in one long noise. ${g.name} is walked off the sand on his own feet.`,
      vA:pending.crux.vA, vB:pending.crux.vB, sA:100, sB:100, crowd:pending.crux.crowd, mom:0 })],
      winner:"B", crowd:pending.crux.crowd, fell:false, vA:pending.crux.vA, vB:pending.crux.vB,
      aDies:false, bDies:false, lastTarget:"flank", spared:false, forfeit:true };
  } else {
    res = simulateFight(gc, oc, tacticNow, offer.stakes, simCtx,
      pending ? { from: pending.crux, resumeLine: C ? C.line(g) : undefined }
              : { stopAtCrux: !offer.imperial });
  }
  if(res.unfinished){
    return { pending:{ gid, offer, tactic, bet, crux:res.crux, bribeHouse },
      beats: res.beats, crux:true, tier:offer.tier, stakes:offer.stakes, festival:offer.festival,
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
    purse = offer.purse; d.gold += purse; g.wins++;
    const fineKit = F && F.fineBonus && GEAR[gc.kit.weapon] && GEAR[gc.kit.weapon].price>0;
    const fg = rnd((t.fameGain + res.crowd/18 + (offer.stakes==="sine"?6:0)) * (offer.stakes==="blood"?0.55:1)
      * (isF(g)?1.2:1) * (F? F.fame : 1) * (fineKit?1.25:1));
    if(fineKit) sum.push(`Vulcan's day, and the crowd saw whose steel he carried.`);
    d.fame += fg;
    g.pfame += fg + rnd(res.crowd/14) + (g.traits.includes("Glory-Seeker")?3:0);
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
    g.status = "dead";
    d.fallen.push({ name:fullName(g), week:d.week });
    d.gladiators.forEach(o=>{ if(o.status==="active"){ o.morale=clamp(o.morale-8,0,100); o.defiance=clamp(o.defiance+(offer.stakes==="sine"?5:3),0,100); } });
    const grieving = kinReact(d, gid, "brother", -22, 12);
    kinReact(d, gid, "rival", 3, 0);
    const dc = (F && F.deathCost) ? F.deathCost : 1;
    d.unrest = clamp(d.unrest + ((offer.stakes==="sine"?7:4) + grieving.length*3) * dc, 0, 100);
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
    g.injury = inj; g.status = "injured";
    sum.push(`${PR(g).He} is carried to the medicus: ${inj.name.toLowerCase()}, ${inj.weeks} week${inj.weeks>1?"s":""} to mend.`);
  } else if(win && res.vA<45 && R()<0.4){
    const inj = injuryFor(res.lastTarget, false);
    g.injury = inj; g.status = "injured";
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
  const betLines = settleBet(d, g, offer, bet, win, res);
  betLines.forEach(l=>sum.push(l));
  serveWants(d, { type:"fight", gid, win, oppDied:!!res.bDies, spared:!!res.spared,
    crowd:rnd(res.crowd), tier:offer.tier, stakes:offer.stakes });
  return { beats:res.beats, sum, win, dead:!!res.aDies, crowd:rnd(res.crowd), name:g.name,
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
  feud: {
    make(d){ const c=activeG(d); if(c.length<2) return null; const a=pick(c); let b=pick(c); let tries=0;
      while(b.id===a.id && tries++<10) b=pick(c); if(b.id===a.id) return null;
      return { id:"feud", title:"Bad Blood", text:`${a.name} and ${b.name} came to blows over a wager. The doctore awaits your word.`,
        choices:["The whip for both","Let them settle it with wooden swords"], data:{a:a.id,b:b.id} }; },
    run(d,ev,i){ const a=d.gladiators.find(g=>g.id===ev.data.a), b=d.gladiators.find(g=>g.id===ev.data.b);
      if(!a||!b) return "The quarrel cools on its own.";
      if(i===0){ [a,b].forEach(g=>{ g.dis=clamp(g.dis+2,5,99); g.defiance=clamp(g.defiance+6,0,100); g.morale=clamp(g.morale-10,0,100); });
        d.unrest=clamp(d.unrest+2,0,100);
        addTie(d, a.id, b.id, "rival", 45);
        return "The whip falls on both. Order is kept — and so is the grudge, now aimed at you as much as at each other."; }
      const w = R()<0.5?a:b, l = w===a?b:a;
      w.morale=clamp(w.morale+6,0,100); l.morale=clamp(l.morale-4,0,100);
      [a,b].forEach(g=>g.defiance=clamp(g.defiance-2,0,100));
      const t = tieBetween(d, a.id, b.id);
      if(t && t.kind==="rival"){ t.kind="brother"; t.strength=clamp(t.strength,30,100);
        return `${w.name} bests ${l.name} before the whole ludus, then puts a hand out and pulls ${PR(l).him} up. Whatever was between them died on the sand.`; }
      addTie(d, a.id, b.id, "brother", 32);
      return `${w.name} bests ${l.name} before the whole ludus. Respect settles the matter better than rope.`; } },
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
        L.status="dead"; L.fateNote="revolt"; d.fallen.push({ name:fullName(L)+" — in revolt", week:d.week });
        let lost=1;
        rebels.forEach(g=>{ if(g.id!==L.id){
          if(R()<0.45){ g.status="dead"; g.fateNote="revolt"; d.fallen.push({ name:fullName(g)+" — in revolt", week:d.week }); lost++; }
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
    upkeep += 10 + (isAuctor(g) ? g.auctor.wage : 0);
    if(g.status==="injured"){
      injured++;
      g.injury.weeks -= (g.injury.care==="surgeon" ? healSpeed(d)*1.6 : healSpeed(d));
      g.fatigue=clamp(g.fatigue-22,0,100);
      if(g.injury.weeks<=0){
        const part = g.injury.part, care = g.injury.care, sev = (g.injury.pen>=8);
        g.injury=null; g.status="active";
        const guard = scarGuard(d) * (care==="surgeon" ? 0.6 : 1);
        if(part && R() < (sev ? 0.75 : 0.45) * guard){
          const repeat = addScar(g, part, sev);
          chron(d, repeat
            ? `${g.name} leaves the medicus' table. That ${SCAR_WORD[part]||"wound"} has been opened twice now, and it will not come back all the way.`
            : `${g.name} rises from the medicus' table. ${PR(g).He} will carry the mark.`);
        } else chron(d, `${g.name} rises from the medicus' table, whole.`);
      }
    } else if(g.status==="active"){
      if(g.injury && g.injury.care==="through"){
        injured++;
        if(R()<0.13){
          const inj = g.injury;
          addScar(g, inj.part || "flank", true);
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
      g.fatigue = clamp(g.fatigue-10-bathRest(d), 0, 100);
      const reg = g.regimen || "palus";
      if(reg==="rest"){ g.fatigue=clamp(g.fatigue-30,0,100); g.morale=clamp(g.morale+4,0,100); }
      else if(reg==="cond"){
        const gain = (0.4 + g.potential/100*0.9) * d.trainMult * docTrain(d,"end",g) * ageTrain(g.age) * 0.7;
        g.end = clamp(g.end+gain, 5, statCap(g,"end"));
        g.fatigue = clamp(g.fatigue-8, 0, 100);
        g.morale = clamp(g.morale+1, 0, 100);
      } else {
        const mate = reg==="spar" ? sparPartner(d,g) : null;
        let mult = 1, injChance = 0;
        if(mate){
          const t = tieBetween(d, g.id, mate.id);
          const learn = clamp((mate[g.focus]-g[g.focus])*0.010, 0, 0.45);
          mult = SPAR_BASE + learn;
          injChance = SPAR_INJ * palusGuard(d);
          if(t && t.kind==="brother"){ mult *= 1.10; injChance *= 0.6; g.morale=clamp(g.morale+1,0,100); }
          else if(t && t.kind==="rival"){ mult *= 1.25; injChance *= 2; g.morale=clamp(g.morale-1,0,100); }
        }
        const gain = (0.5 + g.potential/100*1.3) * d.trainMult * docTrain(d, g.focus, g) * ageTrain(g.age) * palusTrain(d) * (fest && fest.train ? fest.train : 1) * mult * (g.traits.includes("Swift Learner")?1.3:1) * (g.fatigue>75?0.4:1);
        g[g.focus] = clamp(g[g.focus]+gain, 5, statCap(g, g.focus));
        g.fatigue = clamp(g.fatigue + (mate?14:13), 0, 100);
        const heavy = g.fatigue>85 ? 0.15 : 0;
        const risk = (heavy + injChance*(g.fatigue>70?1.6:1)) * docInjuryGuard(d, g);
        if(R()<risk && !g.traits.includes("Iron Hide")){
          const inj = INJURIES[ri(0,1)];
          g.injury={name:inj[0],weeks:inj[1],pen:inj[2]}; g.status="injured"; g.sparWith=null; g.regimen="palus";
          chron(d, mate
            ? `${mate.name} puts ${g.name} down harder than ${PR(mate).he} meant to. The medicus is called.`
            : `${g.name} tears something in training — driven too hard.`, "bad");
        }
      }
      if(g.age>PRIME[1]){
        const rate = (g.age-PRIME[1])*0.05;
        for(const k of Object.keys(DECAY_RATE)) g[k] = Math.max(8, g[k] - rate*DECAY_RATE[k]);
      }
      g.morale = clamp(g.morale + bathMorale(d), 0, 100);
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
  ambWeek(d);
  repairWeek(d);
  nemesisWeek(d);
  doctoreWeek(d);
  annalsSync(d);
  repWeek(d);
  patronWeek(d);
  if(!d.rome) poachWeek(d);
  romeWeek(d);
  if(romeReady(d) && R()<0.5) offerRome(d);
  sparSocial(d);
  weaveTies(d);
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
  upkeep += injured*8;
  upkeep += bUpkeep(d);
  if(d.doctore){ upkeep += docWage(d.doctore); d.doctore.weeks = (d.doctore.weeks||0)+1; }
  d.gold -= upkeep;
  const act = activeG(d);
  const bound = act.filter(g=>!isAuctor(g));
  const avgDef = bound.length ? bound.reduce((s,g)=>s+g.defiance,0)/bound.length : 10;
  const auctors = act.filter(isAuctor).length;
  d.unrest = clamp(d.unrest + (avgDef-34)/9 - 0.6 - docCalm(d) - cellCalm(d) - auctors*0.35, 0, 100);
  if(d.fame>60) d.fame -= 1;
  d.week++;
  chron(d, `Week ${d.week}. Upkeep paid: ${upkeep} denarii.`);
  if((d.week-1)%3===0 && !d.rome){ makeMarket(d); makeDoctoreMarket(d);
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
  d.munera = (!d.rome && !festivalNow(d) && R()<0.16) ? 1 : 0;
  d.games = null;
  if(d.rome && d.rome.travel<=0 && d.rome.fought<ROME_BOUTS){ makeGames(d); }
  else if(!d.rome && (festivalNow(d) || d.munera) && d.fame>=TIERS[1].fame){
    makeGames(d);
    if(d.games) chron(d, `Games are announced — ${d.games.festival}! Match offers await at the arena.`, "good");
  }
  d.pendingEvent = null;
  updateRebellion(d);
  if(!d.pendingEvent && !d.rome && R()<0.14){ const ev=EVENTS.ambition.make(d); if(ev) d.pendingEvent=ev; }
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
  if(d.gold < -250) d.over = { kind:"debt" };
  const alive = d.gladiators.some(g=>!isGone(g));
  if(!alive && d.gold<150) d.over = { kind:"ruin" };
}

function grantRudis(d, gid){
  const g = d.gladiators.find(x=>x.id===gid);
  if(!g || !rudisEligible(g)) return;
  g.status = "freed";
  d.freed.push({ name:fullName(g), week:d.week });
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
  return { id:d.nextId++, tier:0, festival:null, opp:genOpponent(0,q), stakes,
    purse: rnd((50+R()*40)*(sine?1.8: stakes==="blood"?0.7:1)) };
}

/* ================= UI ================= */

const BRONZE="#c99a4b", BLOOD="#b8463a", LAUREL="#8a9a5b";
const menace = o => { const a = STATS.reduce((s,k)=>s+o[k],0)/6; return a<38?"Green": a<52?"Seasoned": a<66?"Dangerous":"Lethal"; };
const PARTY = {
  modest:{ cost:150, favor:6, fame:3, label:"A Modest Gathering", desc:"Decent wine, a careful guest list, one exhibition bout." },
  lavish:{ cost:400, favor:14, fame:8, label:"A Lavish Banquet", desc:"Falernian wine, musicians, magistrates on the couches." },
  decadent:{ cost:900, favor:28, fame:18, label:"A Decadent Affair", desc:"Capua will speak of it for a season — one way or another." },
};

function gearUsed(d, id){
  return d.gladiators.filter(g=>!isGone(g))
    .reduce((s,g)=>s + (g.kit && SLOTS.some(sl=>g.kit[sl]===id) ? 1 : 0), 0);
}
const gearFree = (d,id) => isBasic(id) ? 99 : (d.gear[id]||0) - gearUsed(d,id);
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
    <div className="fill" style={{width:`${clamp(v/max*100,0,100)}%`, background:color}}/></div>;
}

const SKIN="#a8763e", SKIN_D="#7d5527", LEATHER="#4a3216", LEATHER_D="#33220f",
      STEEL="#c3c9d0", STEEL_D="#6d747d", BRASS="#c08e3a", BRASS_D="#8a6425", CLOTH="#8d3b2c",
      BLADE="#dfe5ec", BLADE_D="#565d67", GRIP="#2c1d0e";

/* A rendered gladiator. Everything he wears comes from his equipped kit, not his class.
   Weapons hang off a real arm: shoulder -> forearm -> fist -> grip -> guard -> blade,
   so a sword reads as held rather than growing out of him.
   Drawn facing RIGHT (+x is toward the opponent); side B is mirrored by the parent. */
function Fighter({ kit, pose, wounds, scars, fallen, dead, foe, fem }){
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
  /* house colours: your men fight in oxblood, the other house in slate blue */
  const PLUME = foe ? "#3f5f74" : CLOTH;
  const FACE  = gilt ? "#c9992f" : (foe ? "#3a5668" : "#8e3a2b");

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
    s.connect(f); f.connect(g); g.connect(master); s.start();
  };
  const tone = (f0, f1, dur, vol, type)=>{
    const c = ready(); if(!c || muted) return;
    const o = c.createOscillator(); o.type = type||"sine";
    o.frequency.setValueAtTime(f0, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(20,f1), c.currentTime+dur);
    const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+dur);
    o.connect(g); g.connect(master); o.start(); o.stop(c.currentTime+dur+0.02);
  };
  return {
    set mute(v){ muted = !!v; if(muted && crowdNode){ try{ crowdNode.g.gain.value = 0; }catch(e){} } },
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
      const target = muted ? 0 : Math.max(0, (level-25)/100) * 0.16;
      try{
        crowdNode.g.gain.setTargetAtTime(target, c.currentTime, 0.4);
        crowdNode.f.frequency.setTargetAtTime(500 + level*7, c.currentTime, 0.5);
      }catch(e){}
    },
    stopCrowd(){ if(crowdNode){ try{ crowdNode.g.gain.setTargetAtTime(0, ready().currentTime, 0.25); }catch(e){} } },
  };
})();
const BEAT_SFX = { clash:"clash", graze:"graze", hit:"hit", crit:"crit", fall:"fall",
  death:"death", spared:"spared", salute:"horn", end:"horn" };

function CrowdRow({ level }){
  const heads = 30;
  const dur = 2.4 - (level/100)*1.5;
  const bright = 0.25 + (level/100)*0.75;
  return (
    <div className="crowdrow">
      {Array.from({length:heads}).map((_,i)=>(
        <div key={i} className="chead" style={{
          height: 11 + (i%4)*2.5,
          opacity: bright * (0.55 + (i%3)*0.2),
          animation:`bob ${dur.toFixed(2)}s ease-in-out ${(i%7)*0.13}s infinite`
        }}/>
      ))}
    </div>
  );
}

function HPBar({ label, v, s, cls, flip }){
  return (
    <div style={{flex:1, textAlign: flip?"right":"left", minWidth:0}}>
      <div className="disp" style={{fontSize:10.5, letterSpacing:".07em", color:"#e0bd72", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{label}</div>
      <div className="dim" style={{fontSize:10, marginBottom:3}}>{cls}</div>
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

function FightModal({ fight, onClose, startMuted, onMute, onSpeak }){
  const [muted,setMuted] = useState(!!startMuted);
  useEffect(()=>{ SFX.mute = !!startMuted; }, [startMuted]);
  useEffect(()=>()=>SFX.stopCrowd(), []);
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
              onClick={()=>{ SFX.mute = !SFX.mute; if(SFX.mute) SFX.stopCrowd(); setMuted(SFX.mute); onMute(SFX.mute); }}>
              {muted? "Sound off":"Sound on"}
            </button>
            {!done && <button className="chip" onClick={()=>setPlaying(p=>!p)}>{playing? "Pause":"Play"}</button>}
            {!done && <button className="chip" onClick={()=>setSpeed(s=>s===1?2:1)}>{speed}×</button>}
            {done && !fight.crux && <button className="btn btn-ghost" style={{padding:"6px 10px"}} aria-label="Close" onClick={onClose}><X size={14}/></button>}
          </div>
        </div>

        {isPair ? (
          <div style={{marginBottom:6}}>
            <div className="flex items-end gap-2">
              <HPBar label={fight.A[0].name} v={b.hA[0]} s={b.sA} cls={fight.A[0].cls}/>
              <div className="disp dim" style={{fontSize:10,padding:"0 2px",whiteSpace:"nowrap"}}>{b.round>0? `RND ${b.round}`:"—"}</div>
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
          <div className="disp dim" style={{fontSize:10, padding:"0 2px", whiteSpace:"nowrap"}}>{b.round>0? `RND ${b.round}`:"—"}</div>
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
                color: b.dead[i] ? "#6b4038" : b.out[i] ? "#6b5a44" : e.mine ? "#e8a08c" : "#9dc0d4",
                textDecoration: b.out[i] ? "line-through" : "none", fontSize:9.5 }}>
                {e.name}{b.dead[i] ? " ✝" : ""}
              </span>
            ))}
          </div>
        )}
        <div className={`arena ${shaking? "arenashake":""}`}>
          <CrowdRow level={b.crowd}/>
          <div className="roar" style={{opacity: b.crowd/130}}/>
          <div className="dust"/>
          {isMelee ? (<>
            {meleeA && <div className="fig" style={{left:`calc(50% - 130px)`}}>
              <div className={b.kind==="clash"?"bob":""}>
                <Fighter fem={meleeA.fem} kit={meleeA.kit} scars={meleeA.scars}
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
                  <Fighter fem={fight.A[i].fem} kit={fight.A[i].kit} scars={fight.A[i].scars} pose={pairPose("A",i)}
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
              <Fighter fem={fight.A.fem} kit={fight.A.kit} scars={fight.A.scars} pose={poseFor("A")} wounds={woundsFor("A")} fallen={fallenSide==="A"} dead={deadSide==="A"}/>
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
            <span className="disp dim" style={{fontSize:8.5,letterSpacing:".08em"}}>MOMENTUM</span>
            <div className="momtrack" style={{flex:1}}>
              <div className="momfill" style={{ left: momPct<50? `${momPct}%`:"50%", right: momPct<50? "50%":`${100-momPct}%` }}/>
            </div>
          </div>
        </div>

        <div className="caption" role="log" aria-live="polite" aria-atomic="true"
          style={{marginTop:10, color: b.kind==="crit"||b.kind==="death"? "#eab6a8" : b.kind==="crowd"? "#e0bd72":"#e8d9b8"}}>
          {b.text}
        </div>

        {!done && <button className="btn btn-ghost" style={{width:"100%",marginTop:4}} onClick={()=>{setPlaying(false); setI(beats.length-1);}}>Skip to the verdict</button>}

        {done && fight.crux && onSpeak && (
          <div className="panel" style={{marginTop:8,padding:12,borderColor:"#c99a4b"}}>
            <div className="disp" style={{fontSize:13,fontWeight:700,letterSpacing:".1em",marginBottom:4,color:"#e8d092"}}>ONE WORD FROM THE BOX</div>
            <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:9}}>
              He can hear you from here, and he will only hear you once.
            </div>
            {Object.entries(CRUX).map(([k,c])=>(
              <button key={k} className={`btn ${k==="cloth"?"btn-blood":""}`} style={{width:"100%",marginBottom:7}} onClick={()=>onSpeak(k)}>
                {k==="cloth" && fight.venatio ? "Call the handlers in"
                  : k==="cloth" && fight.pair ? "Throw in the cloth for both"
                  : c.label}
              </button>
            ))}
            <div className="dim" style={{fontSize:13.5,fontStyle:"italic"}}>
              {fight.venatio
                ? "There is no editor in a hunt and no appeal to make. The handlers come only if you call them, and only you can."
                : fight.pair
                ? "Whatever you say, you say to both of them."
                : "Press: he hits harder and takes more doing it. Cover: he wins less and lives more. The cloth: he loses and lives, and Capua watches you call it."}
            </div>
          </div>
        )}

        {done && !fight.crux && (
          <div className="panel" style={{marginTop:8, padding:12, borderColor: fight.dead? "#7c2a22" : fight.win? "#5a6a35":"#4e3c26"}}>
            <div className="disp" style={{fontSize:13, fontWeight:700, marginBottom:6, color: fight.dead? "#d98476": fight.win? "#b9c58a":"#e0bd72"}}>
              {fight.dead? "A DEATH IN THE HOUSE" : fight.win? "VICTORY" : "DEFEAT"}
            </div>
            {fight.sum.map((s,k)=><div key={k} style={{fontSize:15.5, padding:"2px 0"}}>{s}</div>)}
            <button className="btn" style={{marginTop:10, width:"100%"}} onClick={onClose}>Return to the ludus</button>
          </div>
        )}
      </div>
    </div>
  );
}

const OVER_TEXT = {
  triumph: o=>({ title:"THE SAND AT ROME", text:`Your men took ${o.won} of three on the imperial sand, in front of the only crowd that has ever mattered. A freedman of the palace finds you afterward with a wooden case and no expression: a rudis cut from imperial oak, and a deed to land in Campania. ${o.name} need never send anyone to the sand again. Whether that is a reward or a joke is left to you. In Capua they will say you were lucky. In Rome they simply say your name.` }),
  romeFall: o=>({ title:"SWALLOWED BY ROME", text:`${o.won===1?"One bout of three":"Nothing"}. The imperial sand took your best men in an afternoon and the crowd had forgotten them before the awnings came down. What is left of ${o.name} goes home down the Appian Way in two wagons instead of six, and the houses of Capua are careful not to laugh where you can hear them. A lanista who has been to Rome and come back like this does not get asked twice.` }),
  rebellion: o=>({ title:"THE HOUSE BURNS", text:`In the dead of night, ${o.leader} breaks his chains. The cells empty like a wound opening. By dawn your ludus is ash, your guards are fled or dead, and your name is a warning told to other lanistae. His name, they say, is already on the road to legend.` }),
  debt: ()=>({ title:"THE CREDITORS COME", text:"Hard men with soft voices arrive at your gate bearing a magistrate's seal. The ludus, the familia, the very sand of your training square — seized, itemized, sold. Capua forgets you before the next games." }),
  ruin: ()=>({ title:"AN EMPTY HOUSE", text:"No men. No coin. A lanista with an empty ludus is only a man with a large, quiet building. The gates are shuttered, and the wind moves the sand where champions might have trained." }),
};

const SLOTS_N = 3;
const LEGACY_KEY = "ludus-save-v1";
const slotKey = i => `ludus-slot-${i}`;

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
  const [held,setHeld] = useState(null);
  const [retrainFor,setRetrainFor] = useState(null);
  const [stake,setStake] = useState(0);
  const [against,setAgainst] = useState(false);

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

  const mut = fn => { const d = clone(S); fn(d); setS(d); };

  const clearTransient = ()=>{ setFight(null); setSelId(null); setEvResult(null); setGearPick(null); setAsk(null); setFGid(null); };
  const begin = ()=>{ clearTransient();
    if(!slot){ let free=1; for(let i=1;i<=SLOTS_N;i++) if(!slots[i]){ free=i; break; } setSlot(free); }
    setS(newGameState(nameIn.trim()||"House of Aurelius", bonus)); setScreen("game"); setTab("ludus"); };
  const openSlot = i => { const d = slots[i]; if(!d) { setSlot(i); setScreen("intro"); return; }
    clearTransient(); setSlot(i); setS(d); setScreen("game"); setTab("ludus"); };
  const toTitle = ()=>{ clearTransient(); setS(null); setSlot(null); setScreen("title"); };
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
    if(!g || g.status!=="active" || g.lastFought>=d.week) return;
    const bet = makeBet(g, offer.opp);
    if(bet) d.gold -= bet.amount;
    const res = doFight(d, fGid, offer, tactic, bet);
    if(res.crux){ setHeld({ base:d, res }); setFight(res); setFGid(null); setStake(0); setAgainst(false); return; }
    setS(d); setFight(res); setFGid(null); setStake(0); setAgainst(false);
  };
  /* the one word from the box */
  const speak = choice => {
    if(!held) return;
    const d = held.base;
    const p = held.res.pending;
    p.beats = held.res.beats;
    const res = p.venatio ? doVenatio(d, p.gid, p.offer, p.tactic, p, choice)
      : p.pair ? doPairFight(d, p.ids, p.offer, p.tactic, p, choice)
      : doFight(d, p.gid, p.offer, p.tactic, p.bet, p, choice);
    setHeld(null); setS(d); setFight(res);
  };
  const meleeGo = (offer)=>{
    if(pairSel.length<2) return;
    const d = clone(S);
    const res = doMelee(d, pairSel, offer);
    if(!res) return;
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
    if(!g || g.status!=="active" || g.lastFought>=d.week) return;
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
    g.dis=clamp(g.dis+2,5,99); g.defiance=clamp(g.defiance+6,0,100); g.morale=clamp(g.morale-12,0,100); d.unrest=clamp(d.unrest+2,0,100);
    chron(d, `The whip speaks to ${g.name}. The yard is silent after.`); });
  const sellG = id => { const g=S.gladiators.find(x=>x.id===id); if(!g) return;
    const v = rnd(gladValue(g)*0.55);
    setAsk({ title:"Sell Him On", danger:true, confirm:`Take ${v} denarii`,
      text:`A buyer offers ${v} denarii for ${fullName(g)}. The other men will see him led out through the gate, and draw their own conclusions.`,
      run:()=>{ mut(d=>{ d.gold+=v;
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
    if(d.gold<g.price || count>=8) return;
    d.gold-=g.price; d.market.splice(i,1); d.gladiators.push(g);
    chron(d, isAuctor(g)
      ? `${g.name} of ${g.origin} signs for ${g.price} denarii and ${g.auctor.bouts} bouts. He swears the same sacramentum as every man in the cells — burned, bound, beaten, slain — and he chose it, which they find harder to watch than they expected.`
      : `${g.name} of ${g.origin} joins the ludus for ${g.price} denarii. ${PR(g).He} swears the sacramentum: to be burned, bound, beaten, and slain by the sword.`); });
  const buyGear = id => mut(d=>{ const it=GEAR[id]; if(!it || d.gold<it.price) return;
d.gold-=gearPrice(d,it.price); d.gear[id]=(d.gear[id]||0)+1;
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
      g.injury.care = "surgeon";
      if(g.status!=="injured") g.status = "injured";
      chron(d, `The surgeon works on ${g.name} by lamplight. ${fee} denarii, and worth it if ${PR(g).he} fights again.`);
      return;
    }
    g.injury.care = care;
    if(care==="through"){ g.status = "active";
      g.morale = clamp(g.morale-6,0,100); g.defiance = clamp(g.defiance+4,0,100);
      chron(d, `${g.name} is sent back to the post on an open wound.`, "bad"); }
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
    g.wear = g.wear || {}; g.wear[slot] = 100;
    g.morale = clamp(g.morale+16, 0, 100);
    g.defiance = clamp(g.defiance-6, 0, 100);
    chron(d, `The smith works six weeks of nights on one piece for ${g.name} and hands it over without a word. ${title}. It is his, and it is not going back on the rack.`, "good"); });
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
      d.rome = { travel:2, fought:0, won:0 };
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
    d.gold-=120; d.lastFeast=d.week;
    d.gladiators.forEach(g=>{ if(!isGone(g)){ g.morale=clamp(g.morale+9,0,100); g.defiance=clamp(g.defiance-4,0,100); } });
    d.unrest=clamp(d.unrest-7,0,100);
    chron(d, "Meat and honeyed wine for the familia. Songs in the cells past midnight."); });

  if(screen==="loading") return <div className="lr" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><style>{CSS}</style><div className="disp dim">Lighting the torches...</div></div>;

  if(screen==="title") return (
    <div className="lr" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{CSS}</style>
      <div style={{maxWidth:460,width:"100%"}}>
        <div className="disp" style={{fontSize:46,fontWeight:900,textAlign:"center",letterSpacing:".22em",color:"#e8d092"}}>LVDVS</div>
        <div className="dim" style={{textAlign:"center",fontStyle:"italic",marginTop:2,marginBottom:18}}>Blood, sand, and the fortunes of a Roman house.</div>
        <div className="tag tag-gold" style={{marginBottom:8}}>The Records</div>
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
    </div>
  );

  if(screen==="intro") return (
    <div className="lr" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{CSS}</style>
      <div style={{maxWidth:460,width:"100%"}}>
        <div className="disp" style={{fontSize:46,fontWeight:900,textAlign:"center",letterSpacing:".22em",color:"#e8d092"}}>LVDVS</div>
        <div className="dim" style={{textAlign:"center",fontStyle:"italic",marginTop:2,marginBottom:18}}>Blood, sand, and the fortunes of a Roman house.</div>
        <div className="panel" style={{padding:14, marginBottom:12}}>
          <div className="tag" style={{marginBottom:8}}>Name your house</div>
          <input className="sel" style={{width:"100%",boxSizing:"border-box"}} value={nameIn} onChange={e=>setNameIn(e.target.value)} maxLength={30}/>
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
  const eligible = roster.filter(g=>g.status==="active" && g.lastFought < S.week);
  const selG = selId!=null ? S.gladiators.find(g=>g.id===selId) : null;
  const gamesWeeksAway = (3 - (S.week % 3)) % 3;
  const standings = [ ...(S.rivals||[]).map(h=>({name:`House ${h.name}`, lan:lanistaOf(h.name), fame:h.fame, grudge:h.grudge})),
    {name:S.name, fame:S.fame, you:true} ].sort((a,b)=>b.fame-a.fame);

  return (
    <div className="lr" style={{display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <style>{CSS}</style>

      <div style={{position:"sticky",top:0,zIndex:20,background:"linear-gradient(180deg,#1d1610,rgba(23,18,16,.96))",borderBottom:"1px solid #3e2f1f",padding:"10px 14px"}}>
        <div className="flex items-center justify-between gap-2">
          <div style={{minWidth:0}}>
            <div className="disp" style={{fontSize:15,fontWeight:900,color:"#e8d092",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{S.name.toUpperCase()}</div>
            <div className="dim" style={{fontSize:12.5}}>Year {yearOf(S)}, week {yearWeek(S)} · {fameTitle(S.fame)}</div>
          </div>
          <button className="btn" onClick={advance} disabled={!!S.pendingEvent || !!S.doctoreOffer || !!S.romeOffer || !!S.reSignOffer || !!S.over}>End Week</button>
        </div>
        <div className="flex items-center gap-3" style={{marginTop:7,fontSize:13.5,flexWrap:"wrap"}}>
          <span className="flex items-center gap-1 gold"><Coins size={13} aria-hidden="true"/>{rnd(S.gold)}</span>
          <span className="flex items-center gap-1" style={{color:"#d8c08a"}}><Star size={13} aria-hidden="true"/>{rnd(S.fame)}</span>
          <span className="flex items-center gap-1" style={{color:"#bfa8c8"}}><Crown size={13} aria-hidden="true"/>{rnd(S.favor)}</span>
          <span className="flex items-center gap-1" style={{color:"#cf5a49",marginLeft:"auto"}}><Flame size={13} aria-hidden="true"/>{unrestWord(S.unrest)}</span>
        </div>
      </div>

      <div style={{flex:1,width:"100%",maxWidth:640,margin:"0 auto",padding:"14px 14px 20px"}}>

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
          <div className="panel" style={{padding:16,textAlign:"center"}}>
            <div className="disp" style={{fontSize:21,fontWeight:900,letterSpacing:".15em",color:"#e8d092"}}>{S.name.toUpperCase()}</div>
            <div className="dim" style={{fontStyle:"italic"}}>A ludus of Capua — {fameTitle(S.fame)}</div>
            <div className="flex justify-center gap-4" style={{marginTop:8,fontSize:14.5}}>
              <span>Familia {roster.length}/8</span>
              <span className="blood">Fallen {S.fallen.length}</span>
              <span className="gold">Freed {S.freed.length}</span>
            </div>
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
          {S.nemesis && (
            <div className="panel" style={{padding:13,borderColor:"#7c2a22"}}>
              <div className="flex items-center justify-between" style={{marginBottom:5}}>
                <span className="tag tag-blood">The name in the cells</span>
                <span className="rowval dim" style={{fontSize:12.5}}>House {S.nemesis.house}</span>
              </div>
              <div className="disp" style={{fontSize:15,fontWeight:700,color:"#d96f5d"}}>{S.nemesis.name}</div>
              <div style={{fontSize:15,marginTop:3}}>They call him {S.nemesis.title}.</div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:4}}>
                {S.nemesis.hated
                  ? "He killed one of yours and is still walking around Capua. Every week he does, the cells are a little worse."
                  : "He has beaten this house twice. Your men send someone else out when his name is on the card."}
              </div>
            </div>
          )}

          {(()=>{ const st = repStyle(S), tot = repTotal(S);
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
            ); })()}

          {(()=>{ const now = festivalNow(S), soon = nextFestivals(S, 3);
            return (
              <div className="panel" style={{padding:13, borderColor: now? "#8a6a2c":undefined}}>
                <div className="flex items-center justify-between" style={{marginBottom:6}}>
                  <span className="tag tag-gold">The Year</span>
                  <span className="dim" style={{fontSize:13}}>{YEAR_WEEKS} weeks · year {yearOf(S)}</span>
                </div>
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
                    return <div key={i} title={f?f.name:""} style={{flex:1,height:cur?9:6,borderRadius:2,
                      background: cur ? "#e8d092" : f ? (f.rest? "#5a6a35":"#8a6a2c") : "#2b2115"}}/>;
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
          </div>

          <div className="panel" style={{padding:13}}>
            <div className="flex items-center justify-between" style={{marginBottom:6}}>
              <span className="tag tag-gold">The Training Square</span>
              {S.doctore && <span className="dim" style={{fontSize:13}}>{S.doctore.wage}d / week</span>}
            </div>
            {S.doctore ? (<div>
              <div className="disp" style={{fontSize:15,fontWeight:700,color:"#e8d092"}}>
                {S.doctore.name}{S.doctore.nick? <span style={{color:"#d8c08a"}}>, {S.doctore.nick}</span>:null}
              </div>
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",margin:"5px 0"}}>
                <span className="tag">{docWord(S.doctore.skill)}</span>
                <span className="tag tag-gold">{STAT_NAMES[S.doctore.spec]}</span>
                {S.doctore.fromHouse && <span className="tag tag-gold">✦ of this house</span>}
              </div>
              <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>{S.doctore.past}.</div>
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
            <div className="tag tag-gold" style={{marginBottom:8}}>The Houses of Capua</div>
            {standings.map((h,i)=>(
              <div key={h.name} className="flex items-center justify-between" style={{padding:"5px 0",borderBottom:"1px dotted #33271a"}}>
                <div className="rowname" style={{fontSize:15.5, color:h.you?"#e8d092":undefined}}>
                  <span className="dim" style={{marginRight:8,fontSize:13}}>{i+1}</span>
                  {h.name}
                  {!h.you && <span className="dim" style={{fontSize:12.5,marginLeft:7,fontStyle:"italic"}}>{grudgeWord(h.grudge)}</span>}
                  {!h.you && h.lan.trait && <div className="dim" style={{fontSize:12.5,marginTop:1}}>{h.lan.name} — {h.lan.trait}</div>}
                </div>
                <div className={`rowval ${h.you?"gold":"dim"}`} style={{fontSize:14}}>{rnd(h.fame)} fame</div>
              </div>
            ))}
            <div className="dim" style={{fontSize:13.5,marginTop:6,fontStyle:"italic"}}>Their men fill the card at the games. Beat them and their masters remember; kill them and they never forget.</div>
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
            <div className="tag" style={{marginBottom:8}}>The Chronicle</div>
            {S.log.map((e,i)=>(
              <div key={i} style={{padding:"4px 0",borderBottom:"1px dotted #33271a",fontSize:15,color:e.kind==="bad"?"#d98476":e.kind==="good"?"#cbc08e":e.kind==="event"?"#b9a8c8":"#cfc0a0"}}>
                <span className="dim" style={{fontSize:12.5}}>W{e.week}</span> — {e.text}
              </div>
            ))}
          </div>
          {(S.annals||[]).length>0 && (()=>{ const R2 = houseRecord(S);
            return (
              <div className="panel" style={{padding:13}}>
                <div className="flex items-center justify-between" style={{marginBottom:7}}>
                  <span className="tag tag-gold">The Annals</span>
                  <span className="dim" style={{fontSize:13}}>{R2.served} through these gates</span>
                </div>
                <div className="grid grid-cols-3 gap-2" style={{fontSize:14.5,marginBottom:8}}>
                  <div><div className="dim" style={{fontSize:12.5}}>Won</div>{R2.w}</div>
                  <div><div className="dim" style={{fontSize:12.5}}>Lost</div>{R2.l}</div>
                  <div><div className="dim" style={{fontSize:12.5}}>Killed</div>{R2.k}</div>
                  <div><div className="dim" style={{fontSize:12.5}}>Buried</div><span className="blood">{R2.lost}</span></div>
                  <div><div className="dim" style={{fontSize:12.5}}>Freed</div><span className="gold">{R2.freed}</span></div>
                  <div><div className="dim" style={{fontSize:12.5}}>Walked out</div>{R2.out}</div>
                </div>
                {R2.best && R2.best.wins>0 && (
                  <div className="dim" style={{fontSize:14,fontStyle:"italic",marginBottom:8}}>
                    The best of them was {R2.best.nick? `${R2.best.name}, ${R2.best.nick}` : R2.best.name} — {R2.best.wins} victories.
                  </div>
                )}
                <button className="btn" style={{width:"100%"}} onClick={()=>setAnnals(true)}>Read the annals</button>
              </div>
            ); })()}

          <div className="panel" style={{padding:13}}>
            {S.flags.noLessons && (
              <button className="btn btn-ghost" style={{width:"100%",marginBottom:9}}
                onClick={()=>mut(d=>{ d.flags.noLessons = 0; d.flags.learned = {}; })}>Ask the gatekeeper again</button>
            )}
            <div className="tag" style={{marginBottom:6}}>The Ledger</div>
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
                {kinOf(S,g.id,"brother").length>0 && <span className="tag" style={{borderColor:"#5a6a35",color:"#b9c58a"}}>{kinOf(S,g.id,"brother").length} brother{kinOf(S,g.id,"brother").length>1?"s":""}</span>}
                {kinOf(S,g.id,"rival").length>0 && <span className="tag tag-blood">bad blood</span>}
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
          <div className="panel" style={{padding:13}}>
            <div className="tag" style={{marginBottom:8}}>Choose your man</div>
            {eligible.length===0 ? <div className="dim" style={{fontStyle:"italic",fontSize:15}}>No one is fit to fight this week — rested, healthy, and unfought only.</div> : (
              <div>
                {eligible.map(g=>{
                  const on = fGid===g.id;
                  const kit = g.kit || defaultKit(g.cls);
                  return (
                    <button key={g.id} className={`optrow ${on?"on":""}`} onClick={()=>setFGid(on? null : g.id)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="disp" style={{fontSize:13.5,color:on?"#e8d092":"#e8d9b8"}}>{fullName(g)}</span>
                        {on ? <Check size={15} style={{color:"#c99a4b",flexShrink:0}}/> : <span className="dim" style={{fontSize:13}}>{g.wins}–{g.losses}</span>}
                      </div>
                      <div className="dim" style={{fontSize:13.5,marginTop:2}}>
                        {g.cls} · {GEAR[kit.weapon] ? GEAR[kit.weapon].name : "unarmed"}{GEAR[kit.offhand] && GEAR[kit.offhand].art!=="none" ? ` & ${GEAR[kit.offhand].name}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-2" style={{marginTop:10,flexWrap:"wrap"}}>
              {[["aggressive","Aggressive"],["measured","Measured"],["defensive","Defensive"],["showboat","Showboat"]].map(([k,l])=>(
                <button key={k} className={`chip ${tactic===k?"on":""}`} onClick={()=>setTactic(k)}>{l}</button>
              ))}
            </div>
            <div style={{borderTop:"1px dotted #33271a",marginTop:11,paddingTop:9}}>
              <div className="flex items-center justify-between" style={{marginBottom:6}}>
                <span className="tag">The bookmakers</span>
                {stake>0 && <span className="gold" style={{fontSize:13.5}}>{stake}d at risk</span>}
              </div>
              <div className="flex gap-2" style={{flexWrap:"wrap",marginBottom:7}}>
                <button className={`chip ${stake===0?"on":""}`} onClick={()=>{setStake(0); setAgainst(false);}}>No wager</button>
                {STAKES_OPTS.map(v=>(
                  <button key={v} className={`chip ${stake===v?"on":""}`} disabled={S.gold<v}
                    style={S.gold<v?{opacity:.4}:undefined} onClick={()=>setStake(v)}>{v}d</button>
                ))}
              </div>
              {stake>0 && (
                <div className="grid grid-cols-2 gap-2">
                  <button className={`chip ${!against?"on":""}`} onClick={()=>setAgainst(false)}>Back your man</button>
                  <button className={`chip ${against?"on":""}`} style={against?{borderColor:"#7c2a22",color:"#d98476",background:"#2a1512"}:undefined}
                    onClick={()=>setAgainst(true)}>Have him lose</button>
                </div>
              )}
              {stake>0 && against && (
                <div className="blood" style={{fontSize:13.5,fontStyle:"italic",marginTop:6}}>
                  He will be told to go down. He will do it, and he will know you asked. If the editor's men are watching the bookmakers, the house pays for it.
                </div>
              )}
              {stake===0 && <div className="dim" style={{fontSize:13.5,fontStyle:"italic"}}>Coin can be laid on any bout — on your man, or against him.</div>}
            </div>
          </div>

          <div className="panel" style={{padding:13}}>
            <div className="flex items-center justify-between" style={{marginBottom:6}}>
              <div className="disp" style={{fontSize:14,fontWeight:700}}>THE GAMES</div>
              {S.games && <span className="dim" style={{fontSize:13,fontStyle:"italic"}}>{S.games.festival}</span>}
            </div>
            {S.fame<TIERS[1].fame && <div className="dim" style={{fontSize:15}}>No editor books an unknown house. Build 25 fame in the pits and the invitations will come.</div>}
            {S.fame>=TIERS[1].fame && (!S.games || S.games.offers.length===0) && (()=>{
              const nxt = nextFestivals(S,1)[0];
              const away = nxt ? weeksUntil(S,nxt) : 0;
              return <div className="dim" style={{fontSize:15}}>
                {S.games ? "The festival's matches are done."
                  : festivalNow(S) && festivalNow(S).rest ? "The Saturnalia. No editor in Capua is booking anyone this week."
                  : away===0 ? "The editors are quiet this week."
                  : `${nxt.name} in ${away} week${away===1?"":"s"}. Offers expire when the week ends.`}
              </div>; })()}
            {S.games && S.games.offers.filter(o=>o.pair).map(o=>{
              const chosen = pairSel.map(id=>S.gladiators.find(g=>g.id===id)).filter(Boolean);
              const t = chosen.length===2 ? tieBetween(S, chosen[0].id, chosen[1].id) : null;
              return (
                <div key={o.id} style={{borderTop:"1px dotted #33271a",paddingTop:10,marginTop:10}}>
                  <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginBottom:5}}>
                    <span className="tag tag-gold">{TIERS[o.tier].name}</span>
                    <span className="tag tag-blood">Pair bout</span>
                    <span className="gold" style={{marginLeft:"auto",fontSize:14.5}}>{o.purse}d purse</span>
                  </div>
                  <div style={{fontSize:15.5}}>{o.opps.map(x=>x.nick?`${x.name}, ${x.nick}`:x.name).join(" and ")}</div>
                  <div className="dim" style={{fontSize:14}}>{o.opps.map(x=>x.cls).join(" · ")} — two men, and they have fought together before.</div>
                  <div className="dim" style={{fontSize:13.5,margin:"7px 0 4px"}}>Choose two of yours ({pairSel.length}/2):</div>
                  {eligible.map(g=>(
                    <button key={g.id} className={`optrow ${pairSel.includes(g.id)?"on":""}`} style={{marginBottom:5,padding:9}} onClick={()=>togglePair(g.id)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="disp" style={{fontSize:13,color:pairSel.includes(g.id)?"#e8d092":"#e8d9b8"}}>{g.name}</span>
                        <span className="dim" style={{fontSize:12.5}}>{g.cls}</span>
                      </div>
                    </button>
                  ))}
                  {t && <div style={{fontSize:14.5,margin:"4px 0",color:t.kind==="brother"?"#b9c58a":"#d98476"}}>
                    {t.kind==="brother"
                      ? "Brothers. Each will fight harder for having the other at his shoulder."
                      : "Bad blood. Neither will cover the other, and both will be worse for it."}
                  </div>}
                  {chosen.length===2 && !t && <div className="dim" style={{fontSize:14.5,margin:"4px 0"}}>They barely know each other. They will fight their own fights.</div>}
                  <button className="btn btn-blood" style={{width:"100%",marginTop:6}} disabled={pairSel.length!==2} onClick={()=>fightPair(o)}>
                    {pairSel.length!==2 ? "Choose two men" : "Send them out together"}
                  </button>
                </div>
              );
            })}
            {S.games && S.games.offers.filter(o=>!o.pair && !o.venatio && !o.melee).map(o=>(
              <div key={o.id} style={{borderTop:"1px dotted #33271a",paddingTop:10,marginTop:10}}>
                <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginBottom:5}}>
                  <span className={`tag ${o.imperial?"tag-gold":"tag-gold"}`}>{TIERS[o.tier].name}</span>
                  {o.imperial && <span className="tag tag-gold">✦ Rome</span>}
                  {o.stakes==="sine" && <span className="tag tag-blood">Sine missione</span>}
                  {o.rematch && <span className="tag tag-blood">Rematch</span>}
                  {nemesisIn(S,o.opp) && <span className="tag tag-blood">✦ {nemesisIn(S,o.opp).title}</span>}
                  {!o.rematch && o.grudgeM && <span className="tag">Old foe</span>}
                  <span className="gold" style={{marginLeft:"auto",fontSize:14.5}}>{o.purse}d purse</span>
                </div>
                <div style={{fontSize:15.5}}>{o.opp.nick? `${o.opp.name}, ${o.opp.nick}` : o.opp.name} · House of {o.opp.house}</div>
                <div className="dim" style={{fontSize:14}}>{o.opp.cls} · {o.opp.origin}{o.opp.wins!=null? ` · ${o.opp.wins}–${o.opp.losses}${o.opp.kills?` · ${o.opp.kills} kills`:""}`:""} · looks {menace(o.opp).toLowerCase()}</div>
                {fGid && (()=>{ const me=S.gladiators.find(g=>g.id===fGid); if(!me) return null;
                  const p=winChance(me,o.opp);
                  return <div style={{fontSize:13.5,marginTop:3}}>
                    <span className="dim">Bookmakers: </span>
                    <span className="gold">{oddsWord(oddsFor(p))}</span>
                    <span className="dim"> on {me.name}</span>
                    <span className="dim"> · {oddsWord(oddsFor(1-p))} against</span>
                  </div>; })()}
                <button className="btn btn-blood" style={{width:"100%",marginTop:8}} disabled={!fGid} onClick={()=>fightOffer(o)}>Send him to the sand</button>
              </div>
            ))}
          </div>

          {S.games && S.games.offers.filter(o=>o.melee).map(o=>{
            const chosen = pairSel.map(id=>S.gladiators.find(g=>g.id===id)).filter(Boolean);
            const bros = chosen.length===2 && (()=>{ const t=tieBetween(S,chosen[0].id,chosen[1].id); return t && t.kind==="brother"; })();
            return (
              <div key={o.id} className="panel" style={{padding:13,borderColor:"#7c2a22"}}>
                <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginBottom:5}}>
                  <div className="disp" style={{fontSize:14,fontWeight:700}}>THE MELEE</div>
                  <span className="tag tag-blood">Last man standing</span>
                  <span className="gold" style={{marginLeft:"auto",fontSize:14.5}}>{o.purse}d purse</span>
                </div>
                <div style={{fontSize:15}}>{o.field.length} men from the other houses go on the sand at once. Enter as many of yours as you dare.</div>
                <div className="blood" style={{fontSize:14,margin:"6px 0"}}>
                  The editor pays one man and no others. If yours are the last two upright, they will be made to finish it.
                </div>
                <div className="dim" style={{fontSize:13.5,margin:"7px 0 4px"}}>Enter which men ({pairSel.length} chosen):</div>
                {eligible.map(g=>(
                  <button key={g.id} className={`optrow ${pairSel.includes(g.id)?"on":""}`} style={{marginBottom:5,padding:9}} onClick={()=>togglePair(g.id)}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="disp" style={{fontSize:13,color:pairSel.includes(g.id)?"#e8d092":"#e8d9b8"}}>{g.name}</span>
                      <span className="dim" style={{fontSize:12.5}}>{g.cls}</span>
                    </div>
                  </button>
                ))}
                {bros && <div className="blood" style={{fontSize:14.5,margin:"4px 0",fontStyle:"italic"}}>
                  These two are brothers. Think about what you are asking for.
                </div>}
                <button className="btn btn-blood" style={{width:"100%",marginTop:6}} disabled={pairSel.length<2} onClick={()=>meleeGo(o)}>
                  {pairSel.length<2 ? "Enter at least two" : `Enter ${pairSel.length} men`}
                </button>
              </div>
            );
          })}

          {S.games && S.games.offers.filter(o=>o.venatio).map(o=>{
            const B = BEASTS[o.beast];
            const me = fGid ? S.gladiators.find(g=>g.id===fGid) : null;
            const reach = me ? reachVsBeast(me.kit || defaultKit(me.cls)) : 1;
            return (
              <div key={o.id} className="panel" style={{padding:13,borderColor:"#6b4a2c"}}>
                <div className="flex items-center gap-1" style={{flexWrap:"wrap",marginBottom:5}}>
                  <div className="disp" style={{fontSize:14,fontWeight:700}}>THE MORNING HUNT</div>
                  <span className="gold" style={{marginLeft:"auto",fontSize:14.5}}>{o.purse}d purse</span>
                </div>
                <div style={{fontSize:15.5,textTransform:"capitalize"}}>{B.name}</div>
                <div className="dim" style={{fontSize:14,fontStyle:"italic",margin:"2px 0 6px"}}>{B.desc}</div>
                <div className="blood" style={{fontSize:14,marginBottom:6}}>
                  No missio. A beast does not see a raised finger, and the handlers are slow when the crowd is enjoying itself.
                </div>
                {me && (
                  <div style={{fontSize:14,marginBottom:6}}>
                    {reach>=1.2 ? <span className="laurel">{me.name} carries the reach for this — a hunting spear is the whole trick.</span>
                     : reach<0.9 ? <span className="blood">{me.name} has nothing longer than his arm. He will have to get close.</span>
                     : <span className="dim">{me.name}'s weapon will serve, but a spear would serve better.</span>}
                    {me.pfame>=60 && <div className="blood" style={{marginTop:3}}>{PR(me).He} is too well known for this. Sending {PR(me).him} will be taken as an insult by everyone in the cells.</div>}
                  </div>
                )}
                <button className="btn btn-blood" style={{width:"100%"}} disabled={!fGid} onClick={()=>huntOffer(o)}>Send him to the beast</button>
              </div>
            );
          })}

          <div className="panel" style={{padding:13}}>
            <div className="disp" style={{fontSize:14,fontWeight:700,marginBottom:4}}>THE PITS</div>
            <div className="dim" style={{fontSize:14.5,marginBottom:8}}>Always open, always hungry. Small purses, no glory to lose — and the crowd down there rarely votes for mercy.</div>
            <div className="flex gap-2" style={{flexWrap:"wrap",marginBottom:8}}>
              {[["blood","First blood"],["standard","To surrender"],["sine","To the death"]].map(([k,l])=>(
                <button key={k} className={`chip ${pitStakes===k?"on":""}`} onClick={()=>setPitStakes(k)}>{l}</button>
              ))}
            </div>
            {fGid && stake>0 && <div className="dim" style={{fontSize:13.5,marginBottom:7,fontStyle:"italic"}}>
              Odds in the pits are set after the pairings are made. Down here nobody much minds who wins, which cuts both ways.
            </div>}
            <button className="btn" style={{width:"100%"}} disabled={!fGid} onClick={fightPit}>
              Fight in the pits{stake>0 ? ` · ${stake}d ${against?"against him":"on him"}` : ""}
            </button>
          </div>
        </div>)}

        {tab==="market" && (<div className="flex flex-col gap-3">
          <div className="dim" style={{fontSize:14,fontStyle:"italic"}}>The slaver's block. Fresh stock every third week. Roster holds 8 men.</div>
          {S.market.map(g=>(
            <div key={g.id} className="panel" style={{padding:12,borderColor:isAuctor(g)?"#5a7a8a":g.legend?"#8a6a2c":undefined}}>
              <div className="flex items-center justify-between">
                <div className="disp" style={{fontSize:15,fontWeight:700}}>{g.name}</div>
                <span className="gold" style={{fontSize:15}}>{g.price}d</span>
              </div>
              <div className="flex items-center gap-1" style={{flexWrap:"wrap",margin:"5px 0"}}>
                <span className="tag">{g.cls}</span><span className="tag">{g.origin}</span>
                {isF(g) && <span className="tag" style={{borderColor:"#8a6a9c",color:"#c8aad4"}}>Gladiatrix</span>}
                {isAuctor(g) && <span className="tag" style={{borderColor:"#5a7a8a",color:"#9dc0d4"}}>Auctoratus · free</span>}
                <span className="tag" style={{borderColor:g.age>31?"#7c2a22":g.age<=PRIME[1]?"#5a6a35":undefined,
                  color:g.age>31?"#d98476":g.age<=PRIME[1]?"#b9c58a":undefined}}>{ageTag(g.age)} · {g.age}</span>
                {(g.scars||[]).length>0 && <span className="tag">{g.scars.length} scar{g.scars.length>1?"s":""}</span>}
              </div>
              <div style={{fontSize:14.5,fontStyle:"italic",color:g.legend?"#e0bd72":"#cfc0a0"}}>
                {g.legend? "There is something in this one's eyes the arena has not yet seen." : `The doctore's eye: ${potentialWord(g.potential)}. At ${g.age}, ${ageWord(g.age)}.`}
              </div>
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

          <div className="panel" style={{padding:13}}>
            <div className="flex items-center justify-between" style={{marginBottom:6}}>
              <span className="tag tag-gold">Those Who Watch</span>
              <span className="dim" style={{fontSize:13}}>house standing {rnd(S.favor)}</span>
            </div>
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
                </div>
              );
            })}
            <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:9}}>
              A patron kept warm leans on the editor when your man is in the sand. One left to go cold talks at the baths instead.
            </div>
          </div>
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
          <div className="panel" style={{padding:13,borderColor:"#4a5a35"}}>
            <div className="flex items-center justify-between">
              <div className="disp" style={{fontSize:14,fontWeight:700}}>A FEAST FOR THE FAMILIA</div>
              <span className="gold">120d</span>
            </div>
            <div className="dim" style={{fontSize:14.5,margin:"4px 0 8px"}}>Meat, honeyed wine, and a night without the whip. Loyalty is cheaper than rebellion.</div>
            <button className="btn" style={{width:"100%"}} disabled={S.gold<120 || S.week-S.lastFeast<3} onClick={feast}>
              {S.week-S.lastFeast<3? `The men feasted recently — ${3-(S.week-S.lastFeast)} week${3-(S.week-S.lastFeast)>1?"s":""}` : S.gold<120? "Not enough coin" : "Set the tables"}
            </button>
          </div>
        </div>)}

        {tab==="armory" && (<div className="flex flex-col gap-3">
          <div className="dim" style={{fontSize:14.5,fontStyle:"italic"}}>Standard kit is always on the racks. Fine pieces must be bought, and each one arms a single man — equip them from his page.</div>
          {SLOTS.map(slot=>(
            <div key={slot} className="panel" style={{padding:13}}>
              <div className="disp" style={{fontSize:13,fontWeight:700,marginBottom:6}}>{SLOT_NAME[slot].toUpperCase()}</div>
              {Object.entries(GEAR).filter(([,it])=>it.slot===slot).map(([id,it])=>{
                const owned = S.gear[id]||0, free = gearFree(S,id);
                return (
                  <div key={id} style={{borderTop:"1px dotted #33271a",paddingTop:8,marginTop:8}}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="disp" style={{fontSize:13.5,color:it.price?"#e8d9b8":"#b9a37c"}}>{it.name}</div>
                      {it.price>0
                        ? <span className="gold" style={{fontSize:14,whiteSpace:"nowrap"}}>{it.price}d{owned?` · ${owned} owned`:""}</span>
                        : <span className="tag">Standard</span>}
                    </div>
                    <div className="dim" style={{fontSize:14,fontStyle:"italic",margin:"2px 0 3px"}}>{it.desc}</div>
                    <GearStats it={it}/>
                    {it.styles && it.styles.length>0 && <div className="dim" style={{fontSize:12.5,marginTop:2}}>Suits: {it.styles.join(", ")}</div>}
                    {it.price>0 && (
                      <button className="btn" style={{width:"100%",marginTop:7}} disabled={S.gold<it.price} onClick={()=>buyGear(id)}>
                        {S.gold<it.price ? "Not enough coin" : `Buy for ${it.price}d`}
                      </button>
                    )}
                    {owned>0 && free===0 && <div className="dim" style={{fontSize:12.5,marginTop:3}}>All owned pieces are in use.</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>)}

      </div>

      <nav role="tablist" aria-label="Sections" style={{position:"sticky",bottom:0,zIndex:20,background:"#14100c",borderTop:"1px solid #3e2f1f",display:"flex"}}>
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
              <button className="btn btn-ghost" style={{padding:"6px 10px"}} aria-label="Close" onClick={()=>setSelId(null)}><X size={14}/></button>
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
            {selG.ambition && (
              <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610",
                borderColor: selG.ambition.met? "#5a6a35" : selG.ambition.broken? "#7c2a22" : "#4e3c26"}}>
                <div className="flex items-center justify-between gap-2" style={{marginBottom:4}}>
                  <span className="tag">What he wants</span>
                  {selG.ambition.promised && !selG.ambition.met && !selG.ambition.broken &&
                    <span className="rowval tag tag-gold">You gave your word</span>}
                </div>
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
              </div>
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
                  <div className="grid grid-cols-3 gap-2">
                    {["rest","surgeon","through"].map(c=>{
                      const off = c==="surgeon" && (!surgeonOK(S) || S.gold<fee);
                      return (
                        <button key={c} className={`focusbtn ${care===c?"on":""}`} disabled={off}
                          style={off?{opacity:.4}:undefined} onClick={()=>setCare(selG.id,c)}>
                          {c==="rest"?"MEND":c==="surgeon"?"SURGEON":"WORK ON"}
                          {c==="surgeon" && <span className="sub">{surgeonOK(S)? fee+"d" : "needs medicus"}</span>}
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
            {tiesOf(S, selG.id).length>0 && (
              <div className="panel" style={{padding:10,marginBottom:9,background:"#1c1610"}}>
                <div className="tag" style={{marginBottom:6}}>The cells</div>
                {tiesOf(S, selG.id).map((t,i)=>{
                  const o = S.gladiators.find(x=>x.id===tieOther(t,selG.id));
                  if(!o) return null;
                  const bro = t.kind==="brother";
                  return (
                    <div key={i} className="flex items-center justify-between gap-2" style={{padding:"3px 0",fontSize:14.5}}>
                      <span>
                        <span style={{color: bro?"#b9c58a":"#d98476"}}>{bro? "Brother":"Bad blood"}</span>
                        <span className="dim"> · </span>{o.name}
                      </span>
                      <span className="dim" style={{fontSize:13,whiteSpace:"nowrap"}}>{tieWord(t)}</span>
                    </div>
                  );
                })}
                <div className="dim" style={{fontSize:13,fontStyle:"italic",marginTop:4}}>
                  {kinOf(S,selG.id,"brother").length
                    ? "What happens to them happens to {PR(selG).him} — and they would follow {PR(selG).him} out of the gate."
                    : "Spite sharpens a fighter, and costs them sleep."}
                </div>
              </div>
            )}
            <div style={{position:"relative",height:176,borderRadius:10,overflow:"hidden",
              border:"1px solid #4e3c26",marginBottom:10,
              background:"linear-gradient(#100c08 0%,#241a0e 22%,#6d5531 66%,#9a7844 100%)"}}>
              <div style={{position:"absolute",left:"50%",bottom:10,transform:"translateX(-50%)"}}>
                <Fighter fem={isF(selG)} kit={selG.kit || defaultKit(selG.cls)} scars={selG.scars} pose="idle" wounds={[]}/>
              </div>
              <div className="dim" style={{position:"absolute",bottom:5,left:9,fontSize:11,fontStyle:"italic"}}>as he takes the sand</div>
            </div>
            <div className="tag tag-gold" style={{marginBottom:6}}>Kit</div>
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
            <div className="tag" style={{marginBottom:6}}>This week</div>
            <div className="grid grid-cols-2 gap-2" style={{marginBottom:6}}>
              {Object.entries(REGIMENS).map(([k,r])=>(
                <button key={k} className={`focusbtn ${(selG.regimen||"palus")===k?"on":""}`}
                  onClick={()=>{ if(k==="spar") setSparPick(selG.id); else setRegimen(selG.id,k); }}>
                  {r.name.toUpperCase()}
                </button>
              ))}
            </div>
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
            {(selG.regimen==="palus"||selG.regimen==="spar") && (<>
              <div className="tag" style={{marginBottom:6}}>Drilling</div>
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
                <button className="btn btn-ghost" style={{padding:"6px 10px"}} aria-label="Close" onClick={()=>setGearPick(null)}><X size={14}/></button>
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
              </div>
            </div>
          );
        };
        return (
          <div className="modalwrap" role="dialog" aria-modal="true" style={{zIndex:64}} onClick={()=>setAnnals(false)}>
            <div className="modal" tabIndex={-1} onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between" style={{marginBottom:4}}>
                <div className="disp" style={{fontSize:15,fontWeight:900,letterSpacing:".12em",color:"#e8d092"}}>THE ANNALS</div>
                <button className="btn btn-ghost" style={{padding:"6px 10px"}} aria-label="Close" onClick={()=>setAnnals(false)}><X size={14}/></button>
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
                <button className="btn btn-ghost" style={{padding:"6px 10px"}} aria-label="Close" onClick={()=>setSparPick(null)}><X size={14}/></button>
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
              <button className="btn btn-ghost" style={{padding:"6px 10px"}} aria-label="Close" onClick={()=>setXfer(null)}><X size={14}/></button>
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

      {fight && <FightModal fight={fight} startMuted={!!S.flags.mute}
        onClose={()=>{ if(held) return; SFX.stopCrowd(); setFight(null); }}
        onSpeak={fight.crux ? speak : null}
        onMute={v=>mut(d=>{ d.flags.mute = v?1:0; })}/>}

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
            {(()=>{ const R2 = houseRecord(S); return (
              <div className="panel" style={{padding:11,marginTop:12,background:"#1c1610"}}>
                <div className="dim" style={{fontSize:13.5,marginBottom:5}}>
                  {R2.years} year{R2.years===1?"":"s"} · {S.week} weeks · fame {rnd(S.fame)}
                </div>
                <div className="grid grid-cols-3 gap-2" style={{fontSize:14.5}}>
                  <div><div className="dim" style={{fontSize:12.5}}>Served</div>{R2.served}</div>
                  <div><div className="dim" style={{fontSize:12.5}}>Won</div>{R2.w}</div>
                  <div><div className="dim" style={{fontSize:12.5}}>Buried</div><span className="blood">{R2.lost}</span></div>
                  <div><div className="dim" style={{fontSize:12.5}}>Freed</div><span className="gold">{R2.freed}</span></div>
                  <div><div className="dim" style={{fontSize:12.5}}>Walked out</div>{R2.out}</div>
                  <div><div className="dim" style={{fontSize:12.5}}>Killed</div>{R2.k}</div>
                </div>
                {R2.best && R2.best.wins>0 && <div className="dim" style={{fontSize:14,fontStyle:"italic",marginTop:6}}>
                  {R2.best.nick? `${R2.best.name}, ${R2.best.nick}` : R2.best.name} won more than any of them — {R2.best.wins}, and {fateOf(R2.best).verb(R2.best)}.
                </div>}
              </div>
            ); })()}
            <button className="btn" style={{width:"100%",marginTop:10}} onClick={()=>setAnnals(true)}>Read the annals</button>
            <button className="btn btn-blood" style={{width:"100%",marginTop:8}} onClick={restart}>Begin anew</button>
          </div>
        </div>
      )}
    </div>
  );
}
