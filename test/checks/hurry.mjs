/* THE FAST-FORWARD NEVER CARRIES A HOUSE PAST A NAMED DAY

   Audit item #210 opened as a bug — "`skipWeeks` breaks on seven things and a deadline is not one
   of them" — and that reading of the function is correct. The item was still REFUTED, because the
   function is not the path. On the player's path three separate things stand between the button
   and a missed day, and this check exists because none of them was guarded and any one of them
   could be removed by someone who did not know the other two were load-bearing:

   1 · `weekWeight` adds **2 to the load** for any deadline due within two weeks, and the button is
       offered only on a `quiet` week — which requires a load of **zero**. When a named day is
       close the fast-forward is not on the screen at all.
   2 · `weeksToSomething` looks ahead over its whole window and returns a count that stops SHORT of
       the nearest due week.
   3 · `runOn` is the only caller of `skipWeeks` in the program, and it passes that count. The raw
       function's missing break is unreachable from the UI.

   MEASURED before this was written (12 houses x 300 weeks, `hurry.mjs`): a deadline stands on
   44% of weeks; on the 28 weeks where a deadline stood AND the button was on screen, the offer
   stopped short **28 times out of 28** and **no deadline was missed**. Driving the raw function
   instead — which is what the item did — produces overruns that no player can reach, and two
   successive cuts of the probe reported exactly that before being pointed at the real path.

   THIS CHECK DOES NOT WAIT FOR LUCK. Twenty-eight qualifying weeks in 3,600 is too thin to gate a
   release on. It plants a deadline at each distance from 0 to 8 on a real played house and asks
   the two questions directly, so every distance is covered on every run:
     · near <= 2  the day must add AT LEAST 2 to the week's load ON ITS OWN — measured as a
                  difference, `weekWeight` with the day against `weekWeight` without it, because a
                  quiet week requires zero and that is the whole of what keeps the button hidden
     · near >= 3  the offer must end BEFORE the due week, and running it must leave the day standing

   Measuring the day's CONTRIBUTION rather than scrubbing a house clean is what makes this stable,
   and it took two failed cuts to learn: both tried to zero the other ten terms of `weekWeight`, and
   both failed on their own fixture — once to a card, once to `canMaster`. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "hurry";
export const describe = "the fast-forward never carries a house past a named day";
export const slow = true;   /* plays a house, then plants a deadline at every distance */

export async function run({ p, errors }){
  await found(p, { seed:"HURRY-1" });
  await clearAll(p, 16);
  await installRope(p);

  const lines = [], bad = [];
  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["weekWeight","weeksToSomething","skipWeeks","deadlines","newGameState"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const clone = d => { try { return structuredClone(d); } catch(e){ return JSON.parse(JSON.stringify(d)); } };

    /* ---- A REAL PLAYED HOUSE, AND MORE THAN ONE SEED TRIED FOR IT ----
       The first cut played one named seed for fifty weeks and used whatever came out. Houses die —
       7 of 16 in the survey, most inside four years — and on the release this check shipped in, that
       one house died and the whole check reported "the fixture house died before it could be used".
       A fixture that depends on a house surviving is a fixture that fails for a reason that has
       nothing to do with what is being measured. Several seeds are tried and the first LIVING one
       is used; only if none of them lives is there nothing to measure. */
    let base = null;
    for(const tag of ["A","B","C","D","E","F"]){
      const d = A.newGameState("HURRY-FIX-"+tag);
      for(let w=0; w<40; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
      if(!d.over && A.activeG(d).length >= 1){ base = d; break; }
    }
    if(!base) return { dead:true };

    const rows = [];
    for(const near of [0,1,2,3,4,5,6,7,8]){
      const d = clone(base);
      /* a clean slate of obligations, then exactly one, at a known distance */
      d.deadlines = [{ id: 990000+near, kind:"levy", amount: 40, what:"the aqueduct", due: d.week + near }];
      /* ---- THE DEADLINE'S OWN CONTRIBUTION, rather than a house scrubbed clean ----
         Two earlier cuts tried to zero the other ten terms of `weekWeight` so the day would be the
         only load. Both failed on their own fixture: one house read load 3 from a card, the next
         read 1 from `canMaster`, and a term like that cannot be cleared from the state without
         breaking the men it is about. Chasing eleven terms to isolate one is the wrong shape. The
         invariant is a DIFFERENCE — what does the day add? — so it is measured as one, by asking
         the game's own function twice, with the day and without it. Immune to whatever else the
         house is carrying, which is the point. */
      const bare = clone(d); bare.deadlines = [];
      const W = A.weekWeight(d), W0 = A.weekWeight(bare);
      const offer = A.weeksToSomething(d, 6);
      let ranTo = null, survived = null;
      const c = clone(d);
      try { A.skipWeeks(c, offer); ranTo = c.week - d.week;
        survived = (c.deadlines||[]).some(x=>x.id === 990000+near); } catch(e){ ranTo = "threw"; }
      rows.push({ near, load: W.load, bare: W0.load, adds: W.load - W0.load, offer, ranTo, survived });
    }
    return { rows, week: base.week, men: A.activeG(base).length };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(r.dead) return { pass:false, why:`the fixture house died before it could be used — nothing was measured`, lines };

  lines.push(`a played house at week ${r.week} with ${r.men} men, one levy planted at each distance:`);
  for(const x of r.rows)
    lines.push(`  due in ${x.near}w · the day adds ${x.adds} to a base load of ${x.bare}`
      + ` · offers ${x.offer}w, ran ${x.ranTo}w, the day ${x.survived ? "survived" : "WAS MISSED"}`);

  let hid = 0, held = 0;
  for(const x of r.rows){
    /* 1 — a day inside two weeks must load enough BY ITSELF to take the week out of `quiet`,
           which requires zero. That is the whole of what keeps the button off the screen. */
    if(x.near <= 2){
      if(x.adds >= 2) hid++;
      else bad.push(`a levy due in ${x.near} week${x.near===1?"":"s"} adds only ${x.adds} to the week's load — `
        + `it must add at least 2, because a quiet week requires zero and that is the only thing keeping `
        + `the fast-forward off the screen while a named day is close`);
    }
    /* 2 — outside that window the button can be offered, and the offer must then stop short */
    if(x.near >= 3){
      held++;
      if(x.offer >= x.near)
        bad.push(`with a levy due in ${x.near} weeks the offer is ${x.offer} — it must end BEFORE the due week`);
      if(x.ranTo === "threw") bad.push(`skipWeeks threw on the ${x.near}-week fixture`);
      else if(x.ranTo != null && x.ranTo >= x.near)
        bad.push(`the offer of ${x.offer}w actually advanced ${x.ranTo}w onto a day due in ${x.near}`);
      if(x.survived === false)
        bad.push(`running the offer the game itself computes MISSED a levy due in ${x.near} weeks — `
          + `this is the fault #210 opened, and it would now be real`);
    }
  }
  /* the vacuity guard, on both arms: neither may pass by never having run */
  if(hid < 3) bad.push(`only ${hid} of the 3 close distances were measured — the load arm proves nothing`);
  if(held < 6) bad.push(`only ${held} of the 6 far distances were driven — the lookahead is unproven`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the day hides the button inside two weeks, and the offer stops short of it outside them`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
