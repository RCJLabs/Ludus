/* Campania will sell a lanista nine works and monuments, 336,500 denarii of stone.
   Every one of them wanted its whole price in a single morning.

   Measured across four ways of playing a careful twelve-year house — cards only,
   cards and works, thrifty and banking, and working the rope every empty week —
   the most any of them ever held at once was 8,485 denarii, and the best finished
   the campaign having built two of the nine. A spina is 7,000. The cheapest
   monument is 30,000. The amphitheatre of Capua is 150,000. The endgame was priced
   against an economy that does not exist, and the note in the source claiming a
   finished house sits on 414,000 was measured on a probe being handed free coin
   every week — the same mistake, one layer down.

   Stone is paid for as it rises now: a deposit to commission it, then a weekly
   draw for as long as it is going up. Nothing was repriced and nothing pays out
   sooner. This check holds the arithmetic honest — what the panel quotes has to be
   what the masons actually take, and the two together have to come to the price on
   the tin — and holds the door open: a house that could never assemble the whole
   sum must still be able to start.

   The monuments above the first tier remain out of reach of any play measured so
   far. That is a pricing decision and it is not this check's business; what this
   guards is that the instalment does what it says. */

import { hasHandle } from "../harness.mjs";

export const name = "stone";
export const describe = "a work is paid for as it rises, and the sums add up";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const YEAR = 18;
    const rows = [], bad = [];

    /* 1. the arithmetic: deposit plus every weekly instalment comes to the price */
    for(const k of A.ALL_WORK_KEYS){
      const W = A.WORKS[k] || A.MONUMENTS[k];
      const down = Math.ceil(W.cost * A.WORK_DEPOSIT);
      const weekly = A.workWeekly(W);
      const weeks = W.years * YEAR;
      const paid = down + weekly*weeks;
      rows.push({ k, cost:W.cost, down, weekly, weeks, paid });
      if(paid < W.cost) bad.push(`${k}: deposit and instalments come to ${paid}, under its price of ${W.cost}`);
      if(paid > W.cost + weekly) bad.push(`${k}: deposit and instalments come to ${paid}, over its price of ${W.cost} by more than one week`);
    }

    /* 2. the door: a house that could not buy it outright can still commission it */
    const d = A.newGameState("Stone","clean","STONE",null);
    const first = A.ALL_WORK_KEYS.find(k => A.workOpen(d,k)) || A.ALL_WORK_KEYS[0];
    const W = A.WORKS[first] || A.MONUMENTS[first];
    const down = Math.ceil(W.cost * A.WORK_DEPOSIT);
    d.gold = down + 10;                       /* the deposit and ten denarii */
    const started = A.beginWork(d, first);
    const paidOnStart = (W.cost) - d.gold;    /* what it actually took */

    /* 3. and the masons take the weekly, and stop when they are not paid */
    let drewFrom = 0, idleWeeks = 0;
    if(started){
      d.gold = A.workWeekly(W) * 3;
      const g0 = d.gold; A.worksWeek(d); drewFrom = g0 - d.gold;
      d.gold = 0;
      const leftBefore = A.workOn(d, first) ? A.workOn(d, first).left : -1;
      A.worksWeek(d); A.worksWeek(d);
      const leftAfter = A.workOn(d, first) ? A.workOn(d, first).left : -1;
      idleWeeks = leftBefore - leftAfter;      /* should be 0 — no coin, no week's work */
    }
    return { rows, bad, first, started, down, cost:W.cost, drewFrom,
      weekly:A.workWeekly(W), idleWeeks, deposit:A.WORK_DEPOSIT };
  });

  const lines = [], fails = [...out.bad];
  lines.push(`${out.rows.length} works and monuments, ${out.rows.reduce((n,r)=>n+r.cost,0).toLocaleString()} denarii of stone in all`);
  for(const r of out.rows.slice(0,4))
    lines.push(`   ${r.k.padEnd(9)} ${String(r.cost).padStart(7)}d = ${r.down}d down + ${r.weekly}d × ${r.weeks} weeks`);
  lines.push(`a house holding ${out.down + 10}d — ten denarii over the deposit on a ${out.cost}d work — ${out.started ? "can commission it" : "CANNOT commission it"}`);
  lines.push(`the masons drew ${out.drewFrom}d for a week's work (the quoted weekly is ${out.weekly}d)`);
  lines.push(`with an empty purse the site stood idle for ${out.idleWeeks === 0 ? "both weeks" : `only ${2-out.idleWeeks} of two weeks`}`);

  if(!out.started)
    fails.push(`a house with the deposit in hand could not commission a work — the instalment is not doing anything`);
  if(out.drewFrom !== out.weekly)
    fails.push(`the masons took ${out.drewFrom}d for a week the panel quotes at ${out.weekly}d`);
  if(out.idleWeeks !== 0)
    fails.push(`the work advanced ${out.idleWeeks} week(s) on an empty purse — unpaid stone should not rise`);
  if(!(out.deposit > 0 && out.deposit < 1))
    fails.push(`the deposit is ${out.deposit} — it has to be a fraction of the price, or this is just the old rule back`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
