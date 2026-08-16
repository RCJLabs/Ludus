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

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasHandle } from "../harness.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

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
    /* ---- 4. WHAT A WORK'S `say` CLAIMS IS WHAT ITS PERK DOES — #140 ----
       The tomb's line read "a death costs the cells far less". Its second effect is real and lands
       somewhere else entirely: `workPerk(d,"regard")` multiplies the LANISTA's health loss by 0.7 at
       the four death sites, while the cells' share of a death is softened by `collSoften` — the
       burial society. One purchase's effect was being credited to another's. Both halves are pinned
       here by MECHANISM rather than by copy, so a rewiring makes the words and the code diverge
       loudly instead of quietly. */
    /* ---- 5. EVERY PERK IS DELIVERED AT THE SIZE ITS OWN TABLE NAMES — #141 ----
       #141 opened claiming four of the five works buy nothing, and its falsification clause refuted
       it: the chapel and the baths are not dead, they are INSURANCE. A house that neglects unrest
       dies of rebellion 6 times in 16 and 2 with a chapel, its peak unrest halved from 79 to 40 —
       under the arc's own gate of 70. The reference player never sees that because he feasts.
       So the VALUE of these perks is situational and cannot honestly be pinned by a check. Their
       DELIVERY can, and delivery is the whole of what makes them situational rather than dead: a
       perk silently disconnected would read exactly like a perk that does not matter, which is the
       distinction this item spent two releases getting wrong. Each kind is driven through the
       game's own `worksWeek` and must move its quantity by exactly what its table says. */
    const perkNotes = [];
    {
      const give = k => { const b = A.newGameState("Pw","clean","STONE-PERK-"+k,null);
        b.works = { [k]: { left:0, began:0, paid:0, owed:0, idle:0 } };
        while(A.activeG(b).length < 2) b.gladiators.push(A.genGladiator(b, 55));
        return b; };
      const near = (a, b2) => Math.abs(a - b2) < 0.051;
      /* calm — the chapel, and the one the whole item turned on */
      { const b = give("chapel"); b.unrest = 50; const n = A.workPerk(b, "calm");
        A.worksWeek(b);
        if(!near(50 - b.unrest, n)) bad.push(`the chapel's calm moved unrest by ${(50-b.unrest).toFixed(2)}, not the ${n} its table names`);
        else perkNotes.push(`calm ${n}/wk off unrest`); }
      /* fame — the school, the one perk that reaches the house on its own */
      { const b = give("school"); b.fame = 500; const n = A.workPerk(b, "fame");
        A.worksWeek(b);
        if(!near(b.fame - 500, n)) bad.push(`the school's fame moved by ${(b.fame-500).toFixed(2)}, not the ${n} its table names`);
        else perkNotes.push(`fame +${n}/wk`); }
      /* regard — the tomb's stated effect, beside the unstated one above */
      { const b = give("tomb"); const g = A.activeG(b)[0]; const was = A.regardOf(g);
        const n = A.workPerk(b, "regard"); A.worksWeek(b);
        if(!near(A.regardOf(g) - was, n)) bad.push(`the tomb's regard moved a man by ${(A.regardOf(g)-was).toFixed(2)}, not the ${n} its table names`);
        else perkNotes.push(`regard +${n}/wk per man`); }
      /* and the two that are READ elsewhere rather than applied here — they must at least register */
      for(const [k, kind] of [["baths","rest"],["spina","crowd"]]){
        const b = give(k), n = A.workPerk(b, kind);
        if(!(n > 0)) bad.push(`the ${k} no longer registers as a "${kind}" work — its perk is read at the `
          + `fatigue and bout sites and a zero here means it was silently disconnected`);
      }
    }

    /* the term the death sites actually read, called rather than reconstructed */
    const tPerk = (()=>{ const b = A.newGameState("Tp","clean","STONE-TP",null);
      b.works = {};
      const off = A.workPerk(b, "regard");
      b.works = { tomb: { left:0, began:0, paid:0, owed:0, idle:0 } };
      return { off, on: A.workPerk(b, "regard") }; })();
    const say = (A.WORKS.tomb && A.WORKS.tomb.say) || "";
    if(!(tPerk.off === 0 && tPerk.on > 0))
      bad.push(`the tomb no longer registers as a "regard" work (workPerk read ${tPerk.off} then ${tPerk.on}) — `
        + `the 0.7 on the lanista's death cost hangs off exactly that term`);
    if(/costs the cells/i.test(say))
      bad.push(`the tomb's say credits the CELLS with a death costing less; the tomb's term is on `
        + `d.lanista.health and the cells' share is softened by collSoften — the burial society`);

    return { rows, bad, first, started, down, cost:W.cost, drewFrom, tPerk, say, perkNotes,
      weekly:A.workWeekly(W), idleWeeks, deposit:A.WORK_DEPOSIT };
  });

  const lines = [], fails = [...out.bad];
  lines.push(`${out.rows.length} works and monuments, ${out.rows.reduce((n,r)=>n+r.cost,0).toLocaleString()} denarii of stone in all`);
  for(const r of out.rows.slice(0,4))
    lines.push(`   ${r.k.padEnd(9)} ${String(r.cost).padStart(7)}d = ${r.down}d down + ${r.weekly}d × ${r.weeks} weeks`);
  lines.push(`a house holding ${out.down + 10}d — ten denarii over the deposit on a ${out.cost}d work — ${out.started ? "can commission it" : "CANNOT commission it"}`);
  lines.push(`the masons drew ${out.drewFrom}d for a week's work (the quoted weekly is ${out.weekly}d)`);
  lines.push(`with an empty purse the site stood idle for ${out.idleWeeks === 0 ? "both weeks" : `only ${2-out.idleWeeks} of two weeks`}`);
  lines.push(`every perk delivered at its table's size: ${out.perkNotes.join(" · ")}`);

  /* ---- and WHERE that term sits, read off the source the way `layers` and `actions` do ----
     A handle call can say the tomb registers as a regard work; only the source can say the 0.7 is
     on the lanista and not on the cells, which is the whole of what the say got wrong. */
  {
    const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8")
      .split("\n").filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    const sites = src.split("\n").filter(l => /workPerk\(d,\s*["']regard["']\)\s*\?/.test(l));
    const onLanista = sites.filter(l => /lanista\.health/.test(l));
    lines.push(`the tomb's unstated second effect: workPerk "regard" reads ${out.tPerk.off} without it and `
      + `${out.tPerk.on} with it, and its 0.7 sits on ${onLanista.length} of ${sites.length} death sites, `
      + `every one of them the LANISTA's health`);
    if(!sites.length)
      fails.push(`no site multiplies a death by the tomb's regard perk any more — the say promises it`);
    else if(onLanista.length !== sites.length)
      fails.push(`${sites.length - onLanista.length} of ${sites.length} tomb-perk death sites are no longer on `
        + `d.lanista.health — if the effect has moved to the cells then the say must move with it`);
  }

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
