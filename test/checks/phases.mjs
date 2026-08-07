/* The week was split into four phases in v2.40.0 — menWeek, ludusLedger,
   heldQuestions, weekReckoning — and every one of them was put on the handle
   SPECIFICALLY so a check could run one phase without running all of them. The
   v2.46 coverage sweep found that no check had ever called any of the four: the
   split's entire point was sitting unused while the sweep listed them among
   seventy-two dark functions.

   This check runs each phase alone and asserts the one thing each phase is for:
   the men's week accrues the bill, the ledger takes it and turns the week over,
   a held question beats the random beat, and the reckoning ends the house at
   the creditors' line. It also holds the one hard rule from INSTRUCTIONS.md
   that had no check at all: no class may be "unfamiliar" in its own default
   kit, a bug that is silent on screen and taxes a whole class forever. */

import { hasHandle } from "../harness.mjs";

export const name = "phases";
export const describe = "the week's four phases run alone, and no kit taxes its own class";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const res = {};

    /* 1. menWeek accrues the bill and works the men */
    { const d = A.newGameState("Ph1","clean","PHASE1",null);
      const ages = d.gladiators.map(g=>g.weeksAged||0);
      const men = A.menWeek(d, null);
      res.menWeek = { upkeep: men && men.upkeep, injured: men && men.injured,
        aged: d.gladiators.every((g,i)=>(g.weeksAged||0) === ages[i]+1) }; }

    /* 2. ludusLedger takes the bill and turns the week over */
    { const d = A.newGameState("Ph2","clean","PHASE2",null);
      d.gold = 1000; const w0 = d.week;
      const men = A.menWeek(d, null);
      const g0 = d.gold;
      A.ludusLedger(d, men);
      res.ledger = { paid: g0 - d.gold, weekTurned: d.week === w0+1, billed: men.upkeep }; }

    /* 3. a held question beats the week's random beat */
    { const d = A.newGameState("Ph3","clean","PHASE3",null);
      d.askBooking = { id: 901, editor:"An editor", festName:"the games", name:"Somebody",
        gid: d.gladiators[0] ? d.gladiators[0].id : 1, advance: 80, balance: 160, due: d.week + 4 };
      A.heldQuestions(d);
      res.held = { id: d.pendingEvent && d.pendingEvent.id, cleared: d.askBooking == null }; }

    /* 4. the reckoning ends the house at the creditors' line, and not before */
    { const d = A.newGameState("Ph4","clean","PHASE4",null);
      const line = A.creditLine(d);
      d.gold = line + 10; A.weekReckoning(d);
      const alive = !d.over;
      d.gold = line - 10; A.weekReckoning(d);
      res.reckoning = { line, aliveJustAbove: alive, over: d.over && d.over.kind }; }

    /* 5. the hard rule: every class is at home in its own default kit */
    { const clumsy = [];
      for(const cls of Object.keys(A.CLASSES)){
        const g = A.genOpponent(1, 60); g.cls = cls;
        const mods = A.kitMods(A.defaultKit(cls), cls, g);
        if(mods && mods.clumsy && mods.clumsy.length) clumsy.push(cls);
      }
      res.kits = { classes: Object.keys(A.CLASSES).length, clumsy }; }

    return res;
  });

  const lines = [], fails = [];
  lines.push(`menWeek billed ${out.menWeek.upkeep}d and aged every man a week`);
  lines.push(`ludusLedger took ${out.ledger.paid}d against a bill of ${out.ledger.billed}d and turned the week`);
  lines.push(`a seeded booking came up as "${out.held.id}" ahead of the random beat`);
  lines.push(`the creditors' line sits at ${out.reckoning.line}d — alive ten over it, "${out.reckoning.over}" ten under`);
  lines.push(`${out.kits.classes} classes, ${out.kits.clumsy.length} clumsy in their own kit`);

  if(!(out.menWeek.upkeep > 0)) fails.push("menWeek accrued no upkeep");
  if(!out.menWeek.aged) fails.push("menWeek did not age the men a week");
  if(!(out.ledger.paid >= out.ledger.billed)) fails.push(`the ledger took ${out.ledger.paid}d against a bill of ${out.ledger.billed}d`);
  if(!out.ledger.weekTurned) fails.push("ludusLedger did not turn the week over");
  if(out.held.id !== "booking") fails.push(`a seeded booking raised "${out.held.id}" instead of the booking question`);
  if(!out.held.cleared) fails.push("the ask was not consumed once raised");
  if(!out.reckoning.aliveJustAbove) fails.push("a house ten denarii above the creditors' line was ended");
  if(out.reckoning.over !== "debt") fails.push(`a house ten under the line ended as "${out.reckoning.over}" instead of debt`);
  if(out.kits.clumsy.length) fails.push(`${out.kits.clumsy.join(", ")} — clumsy in their own default kit, the silent tax the hard rule forbids`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
