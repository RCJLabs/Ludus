/* The pit fills the weeks the arena does not, and it has to stay worth walking to.

   Measured before this check existed: half the weeks in a campaign have no card
   on offer, and the pit that fills them paid 165 denarii in year one and 163 in
   year twelve while a card went from 399 to 1917. The best man on the whole
   sixteen-man circuit rose from 74 to 80 across twelve years; the man you sent
   down to fight him rose from 60 to 86. The rope had frozen, and half the game
   was standing on it.

   Two things now move with the house — what the towns pay, and who they can get
   to turn out — and both have a floor that keeps the opening exactly as it was.
   This check guards the shape of both: flat at the start, climbing after, and
   capped, because a rope behind a wine shop is not the Ludi Romani. */

import { hasHandle } from "../harness.mjs";

export const name = "rope";
export const describe = "the pit climbs with the house, from a floor and to a ceiling";

/* the bands are wide: what matters is direction and the two flat ends */
const EARLY_FAME = 120;      // at or under this the draw must be exactly 1
const MIN_CLIMB  = 2.0;      // a famous house must be worth at least this much more
const MAX_CLIMB  = 3.2;      // and never so much that the rope rivals a card

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const av = f => (f.str+f.agi+f.end+f.tec+f.sho+f.dis)/6;
    const med = a => { const s=a.slice().sort((x,y)=>x-y); return Math.round(s[Math.floor(s.length/2)]); };

    /* ---- what the rope pays, same man, only the house's name moving ---- */
    const d = A.newGameState("Rope","clean","ROPE",null);
    d.gold = 200000;
    while(A.activeG(d).length < 4 && !A.rosterFull(d)){
      const m=(d.market||[])[0]; if(!m || !A.buyFromBlock(d, m.id, null)) break; }
    const mine = A.activeG(d)[0];
    if(!mine) return { fatal:"could not stock a house" };

    /* pitMen hands back one card per week and caches it — draw a fresh night
       each time or this measures the same three men three hundred times */
    const night = () => { A.makePitCard(d); return A.pitMen(d); };

    const purse = [];
    for(const fame of [40, 120, 600, 1400, 2600, 4000]){
      d.fame = fame;
      const q = [];
      for(let i=0;i<300;i++){
        const top = night().slice().sort((x,y)=>av(y)-av(x))[0];
        q.push(A.makePitOffer(d, mine, "standard", top ? top.id : null).purse);
      }
      purse.push({ fame, med: med(q), draw: +A.pitDraw(d).toFixed(3) });
    }

    /* ---- who the bay puts up, as your own standard rises ---- */
    const bay = [];
    for(const std of [55, 75, 95]){
      const e = A.newGameState("Std"+std, "clean", "STD"+std, null);
      e.gladiators.forEach(g=>{ for(const k of A.STATS) g[k] = std; });
      const tops = [], mids = [];
      for(let i=0;i<40;i++){
        const men = A.CIRCUIT_MIX.map(t => A.makeCircuitMan(e, t)).map(av).sort((x,y)=>y-x);
        tops.push(men[0]); mids.push(men[Math.floor(men.length/2)]);
      }
      bay.push({ std, top: med(tops), mid: med(mids) });
    }

    /* ---- and the card is still a choice, not one man three times ---- */
    d.fame = 4000;
    let distinct = 0, nights = 0;
    for(let i=0;i<200;i++){
      const card = night();
      if(card.length < 2) continue;
      nights++;
      const a = card.map(av);
      if(Math.max(...a) - Math.min(...a) > 4) distinct++;
    }
    return { purse, bay, spread: nights ? distinct/nights : 0, seats: A.PIT_NIGHT };
  });

  if(out.fatal) return { pass:false, why:out.fatal, lines:[] };

  const lines = [], fails = [];
  const base = out.purse[0].med;
  lines.push("what the rope pays, same man, only the house's name moving:");
  for(const r of out.purse)
    lines.push(`   fame ${String(r.fame).padStart(4)} → ${String(r.med).padStart(4)}d  (${(r.med/base).toFixed(2)}× · draw ${r.draw})`);
  lines.push("who the bay puts up:");
  for(const r of out.bay)
    lines.push(`   your men at ${r.std} → best of the sixteen ${r.top}, the middle of them ${r.mid}`);
  lines.push(`a night at the rope offers a real choice ${(out.spread*100).toFixed(0)}% of the time (${out.seats} men on the card)`);

  /* the floor: a house nobody has heard of gets the old local rate, exactly */
  const early = out.purse.filter(r => r.fame <= EARLY_FAME);
  if(early.some(r => r.draw !== 1))
    fails.push(`the draw is not 1 at or under fame ${EARLY_FAME} — the opening moved`);

  /* the climb, and the ceiling */
  const climb = out.purse[out.purse.length-1].med / base;
  if(climb < MIN_CLIMB) fails.push(`a famous house is only worth ${climb.toFixed(2)}× at the rope — under ${MIN_CLIMB}, the pit has gone flat again`);
  if(climb > MAX_CLIMB) fails.push(`a famous house is worth ${climb.toFixed(2)}× at the rope — over ${MAX_CLIMB}, the rope is competing with the arena`);
  const last = out.purse[out.purse.length-1], second = out.purse[out.purse.length-2];
  if(last.draw !== second.draw) fails.push("the draw has no ceiling — it is still climbing at fame 4000");

  /* the bay: the top climbs to meet you, the bottom stays a bottom */
  const [lo, , hi] = out.bay;
  if(hi.top - lo.top < 12) fails.push(`the best man in the bay only moves ${hi.top-lo.top} points between a house at 55 and one at 95`);
  if(hi.mid - lo.mid > 12) fails.push(`the middle of the circuit moved ${hi.mid-lo.mid} points — the bottom of the pyramid is supposed to stay a bottom`);
  if(out.spread < 0.5) fails.push(`only ${(out.spread*100).toFixed(0)}% of nights offer a choice — the head of the bill is crowding the card out`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
