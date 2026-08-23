/* A ROW THAT PRINTS A COUNTDOWN RANKS ON IT — #187

   `agendaTop` shows a row for being urgent (`urgency >= 3`) or NEW (`age <= AG_FRESH`, three
   weeks). Counted statically, **49 of the 69 rows in `agenda` carry a LITERAL urgency of 1 or 2**,
   below the bar — so for most of the list the screen is a novelty filter, and driven over 12 houses
   x 420 weeks, **71-73% of everything on it is there for being new rather than for mattering**.
   That is largely the design: standing chores are meant to fall under the count and stay there.

   It is not the design when the row is holding a clock. Four rows print a countdown in their
   sub-line; three rank on it — the infirmary deadline at `n<=2 ? 3 : 2`, a patron's want the week
   it falls due, the pact when its pace is `impossible` — and the rite did not. `RITE_WINDOW` is
   six and `AG_FRESH` is three, so it was shown for the first half of its window and gone for the
   second: over 4,813 readings on two seeds, on screen on **100% of the weeks that said 5, 4, 3 or 2
   weeks left and 0.0% of the 1,590 that said 1 or 0.**

   The bar this holds is the one that matters and it is stated as a shape, not as a row: **a
   countdown must not be less visible at the end than at the beginning.** It is driven on the rite
   because the rite is the instance, and the two constants it depends on — `AG_FRESH` and
   `RITE_WINDOW` — are read off the handle rather than typed here, so a change to either moves the
   check with the game instead of leaving it asserting last year's arithmetic.

   The static half PRINTS every countdown row it can see and the form of its urgency, and does not
   assert on them. It sees only the ones whose sub is a literal template at the `add(` site — the
   aedile's runs through `voteWord(d)` and does not appear, which is worth knowing about the sweep
   rather than papering over. A literal urgency is not by itself a fault — the pact's is literal and it has a sibling at
   3 for the impossible case, which no parser is going to see. Printed-not-asserted is where the
   next one of these will show up.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "rank";
export const describe = "a row that prints a countdown ranks on it, and does not vanish as the clock runs out";

export async function run({ p }){
  const lines = [], fails = [];

  /* ---- STATIC: the shape of the scale, printed ---- */
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");
  const rows = [];
  for(const m of src.matchAll(/\badd\(/g)){
    let i = m.index + m[0].length, depth = 1, buf = "", args = [];
    while(i < src.length && args.length < 4){
      const c = src[i];
      if("([{".includes(c)) depth++;
      else if(")]}".includes(c)){ depth--; if(depth === 0) break; }
      if(c === "," && depth === 1){ args.push(buf.trim()); buf = ""; i++; continue; }
      buf += c; i++;
    }
    args.push(buf.trim());
    if(args.length < 3 || !/^["'`]/.test(args[1])) continue;
    rows.push({ line: src.slice(0, m.index).split("\n").length, urg: args[0], sub: args[3] || "" });
  }
  const lit = rows.filter(r => /^\d+$/.test(r.urg));
  const under = lit.filter(r => +r.urg < 3);
  lines.push(`${rows.length} agenda rows · ${lit.length} carry a literal urgency · ${under.length} of them below agendaTop's bar (${Math.round(under.length/rows.length*100)}%)`);
  const clocks = rows.filter(r => /\bweeks? to \w/.test(r.sub));
  lines.push(`${clocks.length} rows print a countdown — printed, not asserted:`);
  for(const c of clocks)
    lines.push(`   line ${c.line}  urgency ${/^\d+$/.test(c.urg) ? "LITERAL " + c.urg : "derived"}  ${c.sub.replace(/\s+/g," ").slice(0,58)}`);
  if(!rows.length) fails.push("no agenda rows parsed — this check is reading a shape that has moved");

  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines };

  /* ---- DRIVEN: the rite, week by week across its own window ---- */
  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], say = [];
    const FRESH = A.AG_FRESH, WIN = A.RITE_WINDOW;
    if(typeof FRESH !== "number" || typeof WIN !== "number")
      return { bad:["AG_FRESH or RITE_WINDOW is not on the handle"], say };
    say.push(`AG_FRESH ${FRESH} · RITE_WINDOW ${WIN} — both read off the handle`);

    /* one dead man left unburied, and the week walked across the whole window. `agendaTick` is
       what ages a row, so it is run every step exactly as endWeek runs it — a walk that does not
       tick reads every week as new and would pass this whether the fix were there or not. */
    const d = A.newGameState("Rank","clean","RANK-1",null);
    d.week = 40;
    const g = A.activeG(d)[0];
    A.markUnburied(d, g);
    g.status = "dead";
    const seen = [];
    for(let step = 0; step <= WIN; step++){
      let list = [];
      try { list = A.agendaRanked(d) || []; } catch(e){ bad.push("agendaRanked threw: " + e.message); break; }
      const row = list.find(r => /is not buried properly/i.test(r.label || ""));
      if(row){
        const on = A.agendaTop([row]).length > 0;
        const left = (String(row.sub||"").match(/^(\d+)/) || [])[1];
        seen.push({ left:+left, urg:row.urgency, age:row.age, on });
      }
      A.agendaTick(d);
      d.week++;
    }
    say.push(`the rite across its window: ${seen.map(x=>`${x.left}w→urg ${x.urg}${x.on?" ON":" off"}`).join(" · ")}`);
    if(seen.length < WIN)
      bad.push(`the rite row stood for ${seen.length} of the ${WIN} weeks of its window — the fixture is not driving what it thinks it is`);
    const off = seen.filter(x => !x.on);
    if(off.length)
      bad.push(`the rite is under the fold with ${off.map(x=>x.left+"w").join(", ")} left to decide — `
        + `a countdown that vanishes as it runs out is #187`);
    /* and the shape, not the row: the end of a clock may not be less visible than its start */
    const half = Math.floor(seen.length/2);
    const early = seen.slice(0, half).filter(x=>x.on).length / Math.max(1, half);
    const late  = seen.slice(half).filter(x=>x.on).length / Math.max(1, seen.length-half);
    say.push(`first half of the window on screen ${Math.round(early*100)}% · last half ${Math.round(late*100)}%`);
    if(late < early) bad.push(`the rite is on screen ${Math.round(early*100)}% of the first half of its window and ${Math.round(late*100)}% of the last — a countdown must not fade as it runs out`);
    /* AND THE CLOCK IS WHAT CARRIES THE WEEKS NOVELTY CANNOT. The freshness bar covers `age <=
       AG_FRESH` and nothing further, so every reading past it has to be on screen because the row
       RANKED, not because it was new. The first cut of this asserted it over the back half of the
       window — which includes a week freshness still covers — and read the urgency off a field
       called `urgency` that this fixture stores as `urg`. It failed on a build where the fix was
       working. An assertion has to be written against the arithmetic and the object that exist. */
    const past = seen.filter(x => x.age > FRESH);
    say.push(`${past.length} of the ${seen.length} weeks fall past the freshness bar and must rank: ${past.map(x=>`${x.left}w urg ${x.urg}`).join(", ") || "none"}`);
    if(!past.length) bad.push("no week of the window falls past AG_FRESH — the fixture is not ageing the row, so this proves nothing");
    for(const x of past) if(x.urg < 3)
      bad.push(`with ${x.left} weeks left the rite is at urgency ${x.urg} and age ${x.age}, past the freshness bar — it reaches the screen on novelty or not at all`);
    return { bad, say };
  });

  lines.push(...out.say);
  fails.push(...out.bad);
  if(!fails.length) lines.push("the rite ranks on the window it prints, and is on screen for every week of it");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
