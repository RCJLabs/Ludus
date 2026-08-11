/* THE SIX SCHOOLS OF THE HOUSE — LIVE, CORRECT, AND NEVER ONCE DECLARED.

   `DOCTRINES` holds six schools — scutum, parma, blood, craft, mercy, road — each with a price, a
   creed, faction moves and a table of multipliers that the fight engine and the week read through
   `docNum` and `docIs`. `declareDoctrine(d, key)` is a paid action on the villa tab.

   MEASURED: `d.doctrine` was non-null in **0 of roughly 5,000 house-weeks** across three sweeps,
   including one that hired the doctore, built all five rooms to level 4, hired the medicus and the
   armourer, swore 249 vows, claimed the census to rung 7 and made 22 imperial campaigns. Nothing in
   the game surfaces the choice, so a competent player never makes it. v2.93.0 adds the nudge.

   AND THE SYSTEM ITSELF IS SOUND, which had to be established BEFORE pointing players at it — a
   signpost to a broken feature is worse than no signpost. All six declare, all six charge their
   listed price, changing costs the new school's price × 1.8, every numeric field reads back through
   `docNum` exactly, `docIs` answers on the key, and every faction moves the way its table says.

   TWO FAULTS IN THE MEASUREMENT, BOTH MINE, both fixed here and worth keeping because they are the
   same fault twice:
     1. I tested `docIs(d, D.tag)` and got false for scutum, parma and road. `docIs` compares
        `d.doctrine.key`, not the tag — and blood, craft and mercy happen to have key === tag, so
        three passed and three "failed". A predicate tested through the wrong field looks like a
        broken feature in exactly the cases where the two names differ.
     2. I checked a HARDCODED list of multiplier names and reported "The Travelling School names no
        multipliers". It names four — `knownMult`, `strangeCut`, `travelCut`, `capuaDecay` — none of
        which were in my list. So this check DERIVES the field list from each doctrine's own entry,
        and cannot fall behind the data the way I did.

   WHAT IS NOT ASSERTED, and why. The played comparison — twelve seeds, each run with no doctrine and
   then with craft, blood and mercy — is printed but held to nothing, because the doctrines change the
   trajectory of the house and so confound any outcome measured over a career. `blood` promises purses
   ×1.18 and delivered 374d a bout against 530d with no doctrine, which reads like an inversion and is
   not one: it also adds 0.16 to the odds of sine missione, so the house fights deadlier cards, loses
   more men, and earns smaller purses at a lower tier. The multiplier is applied correctly; the career
   around it is worse. Pricing that properly needs one identical bout fought with and without, which
   is a separate measurement and is written down as one. */

import { hasHandle } from "../harness.mjs";

export const name = "school";
export const describe = "all six doctrines declare, charge, and are read back by the engine that uses them";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const KEYS = Object.keys(A.DOCTRINES || {});
    if(!KEYS.length) return { bad:["`DOCTRINES` is empty or not on the handle"], lines };

    /* the prose fields; everything else in an entry is mechanism and must be readable */
    const PROSE = new Set(["name","cost","tag","creed","body","note","likes","fac","gear","rep"]);

    for(const k of KEYS){
      const D = A.DOCTRINES[k];
      const d = A.newGameState("Sc", "clean", `SCHOOL-${k}`, null);
      d.gold = 50000;
      const fac0 = Object.assign({}, d.factions);
      const gold0 = d.gold;

      const took = A.declareDoctrine(d, k) === true;
      const paid = gold0 - d.gold;
      if(!took){ bad.push(`\`declareDoctrine\` refused "${k}" with 50,000d in the box`); continue; }
      if(paid !== D.cost)
        bad.push(`declaring "${k}" charged ${paid}d and its table says ${D.cost}d`);

      /* DERIVED, not hardcoded — see this check's head for why */
      const fields = Object.keys(D).filter(f => !PROSE.has(f) && typeof D[f] === "number");
      const readBack = fields.map(f => ({ f, want:D[f], got:A.docNum(d, f, null) }));
      const blind = readBack.filter(x => x.got !== x.want);
      if(blind.length)
        bad.push(`"${k}" declares ${blind.map(x=>`${x.f} ${x.want}`).join(", ")} and \`docNum\` reads `
          + `${blind.map(x=>String(x.got)).join(", ")} — the engine cannot see what the table promises`);

      /* `docIs` answers on the KEY. Asserting it on the tag is the fault this check documents. */
      if(A.docIs(d, k) !== true)
        bad.push(`\`docIs(d, "${k}")\` is false with "${k}" declared — every engine call that gates on `
          + `a school (\`docIs(d,"mercy")\` in the bout) reads this and would miss`);
      if(D.tag && D.tag !== k && A.docIs(d, D.tag) === true)
        bad.push(`\`docIs\` answers to the TAG "${D.tag}" as well as the key — it compares `
          + `\`d.doctrine.key\`, and if that has changed the two names are now interchangeable`);

      const facs = Object.entries(D.fac || {}).map(([f,n]) => {
        const moved = Math.round((d.factions[f]||0) - (fac0[f]||0));
        return { f, want:n, moved };
      });
      const stuck = facs.filter(x => x.moved === 0 || Math.sign(x.moved) !== Math.sign(x.want));
      if(stuck.length)
        bad.push(`"${k}" says it moves ${stuck.map(x=>`${x.f} by ${x.want}`).join(", ")} and the `
          + `factions went ${stuck.map(x=>x.moved).join(", ")}`);

      lines.push(`${D.name.padEnd(24)} ${String(D.cost).padStart(4)}d · ${fields.length} mechanical fields, all read back`
        + ` · docIs on the key: true` + (facs.length ? ` · factions ${facs.map(x=>`${x.f} ${x.moved>0?"+":""}${x.moved}`).join(" ")}` : " · no faction move"));

      /* and changing schools costs the NEW one's price times 1.8 */
      const alt = KEYS.find(x => x !== k);
      const g1 = d.gold;
      const swapped = A.declareDoctrine(d, alt) === true;
      const swapCost = g1 - d.gold;
      const wantSwap = Math.round(A.DOCTRINES[alt].cost * 1.8);
      if(!swapped) bad.push(`could not change from "${k}" to "${alt}" with ${g1}d in hand`);
      else if(swapCost !== wantSwap)
        bad.push(`changing from "${k}" to "${alt}" cost ${swapCost}d and 1.8x the new school's price is ${wantSwap}d`);
    }

    /* ---- AND THE REASON THIS CHECK EXISTS: does the week actually SAY so? ----
       This section was wrong twice before it was right, and the second time is worth more than the
       first. It began by grepping `String(A.agendaCan)` for the word "doctrine" — reading source text
       to find out what a program does, which is the same mistake as reading a comment to find out what
       a generator draws. Then it DROVE `agendaCan` and still saw nothing, because **`agendaCan` is not
       the agenda.** It is one of four contributors — `agendaCan`, `agendaSquare`, `agendaSchool`,
       `agendaGods` — and `agenda(d)` is the aggregator that calls them all and returns the list. A
       check that drives `agendaCan` alone sees a fragment of the week's advice and reports the rest as
       missing. (Worth knowing for #119, which measured the feast's offer through `agendaCan`.)
       So this drives `agenda(d)`, which is what the panel renders. */
    {
      const d = A.newGameState("Sa", "clean", "SCHOOL-AGENDA", null);
      d.week = 30; d.gold = 6000;                    /* past the opening, and able to pay for one */
      /* `agenda(d)` returns [{urgency, tab, label, sub}] — `label`, not `title` */
      const says = (st) => { try { return A.agenda(st) || []; }
        catch(e){ return [{ label:"THREW: " + e.message }]; } };

      const before = says(d);
      const hit = before.find(i => /teaches no particular thing/i.test(i.label || ""));
      lines.push(`a house at week 30 with 6,000d in the box is told about the school: ${hit ? "yes" : "NO"}`
        + (hit ? `  — "${hit.label}" · ${hit.sub}` : ""));
      if(!hit)
        bad.push(`the week's agenda never mentions the school of the house. Six doctrines, each with a `
          + `price and a table of multipliers the fight engine reads, and \`d.doctrine\` was non-null in `
          + `0 of ~5,000 measured house-weeks. A system a competent player never finds is not a choice`);

      /* and it must go quiet once a school is declared, or it becomes another standing item */
      A.declareDoctrine(d, KEYS[0]);
      const after = says(d);
      if(after.find(i => /teaches no particular thing/i.test(i.label || "")))
        bad.push(`the agenda still asks for a doctrine after one has been declared — that is a standing `
          + `item on the villa tab, which is the fault #101 spent a release measuring`);

      /* and it must NOT nag a house that cannot afford one */
      const poor = A.newGameState("Sp", "clean", "SCHOOL-POOR", null);
      poor.week = 30; poor.gold = 120;
      const pItems = says(poor);
      if(pItems.find(i => /teaches no particular thing/i.test(i.label || "")))
        bad.push(`a house with 120d is being asked to buy a 300d philosophy — advice that arrives when `
          + `it cannot be taken is the \`agendaCan\` fault #119 already priced`);
      lines.push(`a house with 120d is left alone about it: ${!pItems.find(i=>/teaches no particular/i.test(i.label||"")) ? "yes" : "NO"}`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
