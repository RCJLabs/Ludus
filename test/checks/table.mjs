/* The feast is the only lever against the only number that ends a run outright.

   Measured before this check existed, over five houses kept full for twelve
   years: feasting whenever the cooldown allowed held median unrest between
   nought and six for the whole campaign, at 8,640 denarii a house — about forty
   a week, against a card that pays nineteen hundred. Five houses that never
   feasted produced twenty-three rebellions and a hundred and twenty-one dead
   lanistas. The most dangerous number in the game was being bought off for two
   per cent of income by pressing one button every third week.

   It is priced against the house that sets the table now. This check holds the
   two ends: a house of three in its first spring still pays what it always did,
   and a large famous one pays several times that for a night that goes less far. */

import { hasHandle } from "../harness.mjs";

export const name = "table";
export const describe = "a feast is priced against the house that sets it";

const OPENING_WAS = 120;     // what three men in a shed paid before any of this
const OPENING_SLACK = 12;    // and how far the new formula may drift from it
const MIN_SPREAD = 4;        // a big famous house must pay at least this much more

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Table", "clean", "TABLE", null);
    d.gold = 500000;
    while(!A.rosterFull(d)){ const m=(d.market||[])[0]; if(!m || !A.buyFromBlock(d, m.id, null)) break; }
    const roster = d.gladiators.map(g => g.id);
    if(roster.length < 3) return { fatal:"could not stock a house to three men" };

    /* park the surplus in the infirmary so activeG reads exactly n */
    const sit = n => d.gladiators.forEach(g=>{
      g.status = roster.indexOf(g.id) < n ? "active" : "injured"; });

    const grid = [];
    for(const n of [3, 4, 6, 8]){
      sit(n);
      const live = A.activeG(d).length;
      const costs = [];
      for(const fame of [40, 300, 800, 1600, 2400, 3200]){ d.fame = fame; costs.push(A.feastCost(d)); }
      grid.push({ asked:n, live, reach:+A.feastReach(d).toFixed(2), costs });
    }

    /* and the night itself: the coin leaves, the unrest falls, and it falls less
       for a crowd than for a few */
    const nightAt = n => {
      sit(n); d.fame = 2000; d.unrest = 60; d.lastFeast = -9;
      d.gladiators.forEach(g=>{ g.morale = 50; });
      const g0 = d.gold, u0 = d.unrest, cost = A.feastCost(d);
      const ok = A.throwFeast(d);
      return { ok, paid: g0 - d.gold, quoted: cost, drop: +(u0 - d.unrest).toFixed(2) };
    };
    const few = nightAt(3), many = nightAt(8);
    return { grid, few, many, fames:[40, 300, 800, 1600, 2400, 3200] };
  });

  if(out.fatal) return { pass:false, why:out.fatal, lines:[] };

  const lines = [], fails = [];
  lines.push("  mouths  reach   " + out.fames.map(f=>String(f).padStart(6)).join(" "));
  for(const r of out.grid)
    lines.push(`  ${String(r.live).padStart(6)} ${String(r.reach).padStart(6)}   ${r.costs.map(c=>String(c).padStart(6)).join(" ")}`);
  lines.push(`a night for ${out.few.n||3}: ${out.few.paid}d, unrest −${out.few.drop} · for a full house: ${out.many.paid}d, unrest −${out.many.drop}`);

  const small = out.grid[0];                       // three men
  const big   = out.grid[out.grid.length-1];       // a full house
  const opening = small.costs[0];
  const richest = big.costs[big.costs.length-1];

  if(Math.abs(opening - OPENING_WAS) > OPENING_SLACK)
    fails.push(`a house of three in its first spring pays ${opening}d — the opening used to cost ${OPENING_WAS}d and should not have moved`);
  if(richest / opening < MIN_SPREAD)
    fails.push(`a large famous house pays only ${(richest/opening).toFixed(1)}× what a new one does — the table is not priced against the house`);
  if(big.reach >= small.reach)
    fails.push("one night goes as far for a full house as for three men — the reach does not thin out");
  if(!out.few.ok || !out.many.ok) fails.push("the feast would not fire with coin in hand and the cooldown clear");
  if(out.few.paid !== out.few.quoted || out.many.paid !== out.many.quoted)
    fails.push("the coin that left the purse is not the price the panel quotes");
  if(!(out.many.drop < out.few.drop))
    fails.push(`a full house lost ${out.many.drop} unrest against ${out.few.drop} for three men — the crowd is supposed to dilute it`);
  /* it still has to work, or unrest has no lever at all */
  if(out.many.drop < 3) fails.push(`a feast only moves unrest by ${out.many.drop} for a full house — that is no longer a lever`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
