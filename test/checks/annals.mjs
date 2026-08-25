/* THE HOUSE HAS THREE MEMORIES AND THE READER SAW ONE OF THEM — #204

   The item says `d.freed`, `d.fallen` and the Annals exist and "nothing mechanical reads it".
   **Measured against the file that is false**: eleven places read `d.freed` or `d.fallen` — the
   `FREEDMEN` table, the `legends` acclaim term, the vow, `buried20`, a rite, the burial counsel, the
   killer's name, the kin who come looking. And the dead are plentiful: 38.5 a house, on the books
   98.3% of weeks.

   What is true is narrower, and it is the item's own clause — "this may be an item about the input
   rather than the reader". Measured over 8 houses x 420 weeks an arm (probes/annals.mjs):

     list         control       free:true      retire:true     read by
     d.fallen     38.5/house    34.1           31.3            seven mechanics
     d.freed      **0.00**      1.50           0.00            FREEDMEN, and `legends`
     d.retired    0.00          0.00           **13.25**       NOTHING but the Annals' list

   `d.freed` has two sources — `grantRudis` behind the gate #190 measured, and `sagaFree`, which has
   one caller — so the reference player puts NOBODY on it and six entries of writing are unreachable.
   `d.retired` is fed nine times as richly by a player who presses the button, a ripe candidate stands
   there on 92.6% of weeks, and nothing had ever looked at him. Now `freedWeek` reads both: 91 events
   in 8 of 8 houses, against 0.

   THE PROPERTY THIS CHECK GUARDS: **it must cost no draw while both lists are empty.** That is why
   the reference player's signature does not move, and one stray roll above the pool test would
   re-phase every seeded house in the project. */

import fs from "node:fs";
import path from "node:path";
import { found, tab, clearAll, forge, settle, waitSaved, ROOT } from "../harness.mjs";

export const name = "annals";
export const describe = "a man who left free is remembered, whichever way he left";

export async function run({ p, errors }){
  const fails = [], lines = [];
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");

  /* ---- THE ITEM'S PREMISE, AGAINST THE SOURCE ---- */
  const readers = [...src.matchAll(/\(d\.(freed|fallen)\|\|\[\]\)/g)].length;
  lines.push(`places in the file that read d.freed or d.fallen: ${readers}`);
  if(readers < 5) fails.push(`only ${readers} places read the house's dead and freed — the release rests on there being many, and if that has changed the reasoning is stale`);

  /* ---- BOTH LISTS FEED THE READER ---- */
  const both = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const mk = () => { const d = A.newGameState("Ann","clean","AN-1",null);
      d.freed = []; d.retired = []; d.fallen = []; d.week = 100; d.pendingEvent = null;
      while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 60));
      return d; };
    const drive = (d) => { for(let i=0;i<400 && !d.pendingEvent;i++) A.freedWeek(d);
      return d.pendingEvent && d.pendingEvent.id; };
    const onFreed = mk(); onFreed.freed.push({ name:"Aulus Freed", week:10, wins:12, cls:"Murmillo" });
    const onRetired = mk(); onRetired.retired.push({ name:"Aulus Retired", week:10, wins:12, cls:"Murmillo" });
    const empty = mk();
    /* and it must cost NOTHING while both are empty */
    A.rngSet(9191);
    for(let i=0;i<500;i++) A.freedWeek(empty);
    const seed = A.rngGet();
    return { fromFreed: drive(onFreed), fromRetired: drive(onRetired),
             emptyRaised: !!empty.pendingEvent, seed,
             freedName: onFreed.pendingEvent && onFreed.pendingEvent.text,
             retName: onRetired.pendingEvent && onRetired.pendingEvent.text };
  });
  lines.push(`a man on d.freed → "${both.fromFreed}" · a man on d.retired → "${both.fromRetired}" · both empty → ${both.emptyRaised ? "RAISED SOMETHING" : "nothing"}`);
  lines.push(`the seed after 500 calls on an empty house: ${both.seed}`);
  if(both.fromFreed !== "freedman") fails.push("a man on d.freed no longer reaches the FREEDMEN table at all");
  if(both.fromRetired !== "freedman")
    fails.push("a man on d.retired reaches nothing — that is the whole of this release, and d.retired is read by no other mechanic in the file");
  if(both.emptyRaised) fails.push("an empty house raised a freedman event out of nowhere");
  if(both.seed !== 9191)
    fails.push(`five hundred freedWeek calls on a house with both lists empty moved the seed 9191 → ${both.seed} — every seeded house in the project re-phases`);
  if(both.retName && !/Aulus Retired/.test(both.retName))
    fails.push(`the event raised off d.retired does not name the man: "${String(both.retName).slice(0,80)}"`);

  /* ---- AND THE ACCLAIM TERM ---- */
  const leg = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const mk = () => { const d = A.newGameState("Ann","clean","AN-2",null);
      d.freed = []; d.retired = []; while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 60));
      return d; };
    const val = d => { const t = A.acclaimTerms(d).find(x=>x.k === "legends"); return t ? t.v : null; };
    const none = mk();
    const f = mk(); f.freed.push({ name:"A", week:1, wins:12 });
    const r = mk(); r.retired.push({ name:"B", week:1, wins:12 });
    const small = mk(); small.retired.push({ name:"C", week:1, wins:4 });
    return { none:val(none), freed:val(f), retired:val(r), small:val(small) };
  });
  lines.push(`the "legends" acclaim term: nobody ${leg.none} · one freed with 12 wins ${leg.freed} · one RETIRED with 12 wins ${leg.retired} · one retired with 4 wins ${leg.small}`);
  if(leg.none !== 0) fails.push("a house that has freed and retired nobody still scores legends");
  if(leg.retired !== leg.freed)
    fails.push(`a retired man with twelve wins is worth ${leg.retired} to the town and a freed one ${leg.freed} — the town does not know the difference and neither should the term`);
  if(leg.small !== 0) fails.push("a man with four wins counts as a legend");

  /* ---- THE RECORD IS THE SAME SHAPE ----
     `FREEDMEN` reads `f.name`, `f.wins` and `f.cls` off whichever list it drew from. */
  const shape = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Ann","clean","AN-3",null);
    while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 60));
    const g = A.activeG(d)[0];
    g.age = 34; g.wins = 11;
    A.retireG(d, g.id);
    const r = (d.retired||[])[0];
    return r ? { keys:Object.keys(r).sort(), name:r.name, wins:r.wins, cls:r.cls } : null;
  });
  lines.push(`a retired man's record: ${shape ? shape.keys.join(", ") : "NOBODY RETIRED"}`);
  if(!shape) fails.push("retireG put nobody on d.retired");
  else {
    for(const k of ["name","wins","cls","week"]) if(!shape.keys.includes(k))
      fails.push(`a retired man's record has no "${k}" — FREEDMEN reads it off whichever list it drew from`);
  }

  /* ================= AND THE ROLL SHOWS HIM ================= */
  await found(p, { seed:"AN-S" });
  await clearAll(p, 8);
  await forge(p, (A) => {
    const d = A.newGameState("Ann","clean","AN-S",null);
    d.gold = 20000; d.week = 90;
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 62));
    d.retired = [{ name:"Vetus Longinus", week:40, age:33, wins:11, cls:"Murmillo", scars:3 }];
    d.freed = [{ name:"Liber Naso", week:30, wins:12, cls:"Thraex" }];
    d.fallen = [{ name:"Mortuus Faber", week:20 }];
    return d;
  });
  await clearAll(p, 8);
  /* ---- THE ROLL IS ON A PAGE, AND GUESSING WHICH ONE PROVED NOTHING ----
     The first cut went to the villa, found no "remembered" anywhere, and PASSED — a screen
     assertion that never fires is a check proving nothing, which is `scene`'s vacuity lesson. It
     walks the places and says which one carried it, and fails if none does. */
  let roll = null, where = null;
  for(const place of ["villa","ludus","arena","men","market"]){
    await tab(p, place); await p.waitForTimeout(330); await clearAll(p, 6);
    await tab(p, place); await p.waitForTimeout(320); await settle(p);
    const got = await p.evaluate(()=>{
      /* the Annals are a `Sect`, and a Sect is a FOLD — `innerText` does not report what is shut
         inside one, so the first walk found nothing on any page and blamed the page. #201 lost a
         placement to the same thing. Open every fold, then read. */
      document.querySelectorAll("details").forEach(x=>{ x.open = true; });
      const t = (document.body.innerText || "");
      const m = t.match(/(\d+)\s+remembered/i);
      return m ? { n:+m[1] } : null;
    });
    if(got){ roll = got; where = place; break; }
  }
  lines.push(`the Roll of the House: ${roll ? `"${roll.n} remembered" on the ${where} page` : "NOT ON ANY PAGE"}`);
  if(!roll) fails.push("the Roll of the House is on none of the five places — it counts all three lists and is the only screen that shows the retired at all");
  else if(roll.n !== 3)
    fails.push(`the Roll counts ${roll.n} where the house holds one freed, one retired and one fallen — all three lists are its sum, and the retired are the ones this release connects`);

  await waitSaved(p);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
