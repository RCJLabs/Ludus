/* The coast could not be driven headless. setOut and comeHome were functions of
   the save at module scope — exactly what the file's first rule demands — but
   neither was on the handle, and the actions check's name-list did not miss
   them. The cost was paid in full during the v2.46 audit: two entire 12-house
   campaign batches accepted a town's invitation, had no way home, spent three
   hundred weeks stranded, and reported half the game dark — freedman, primus,
   kin, court, saga, the market — three confident wrong findings before the
   instrument was caught.

   This check drives the round trip the audit could not: out, arrive, fight the
   town's card, wear out the welcome, and come home. It also holds the residency
   costs from v2.46.0 — a fresh visitor's card against a stale resident's.

   ---- AND THEN IT HAPPENED AGAIN, ONE LAYER UP, ever since v2.93.0 ----
   Everything above passed the whole time. The plumbing worked, the round trip
   was driven every run, and NOBODY WAS DRIVING IT: `__ROPE.lanista` had no
   travel step, and `comeHome` has exactly one caller in the game — the UI
   button at ludus.jsx:18653. No weekly phase brings a house back. So the
   reference player every long probe in this project leans on took the `bayCall`
   invitation at its default answer, went south, and stood in that town for the
   rest of its life. The identical stranding this check was written for, in the
   one player it never thought to point at.
   MEASURED before the fix, 10 houses x 420 weeks (`test/probes/road.mjs`):
     5 of 10 houses ever left, and 5 of 5 of those made ONE departure and ZERO
     returns — 246, 363, 175, 264 and 150 weeks in a single town. 54% of all
     house-weeks were spent on the coast; 71% of every card was a town's.
   After: departures 11, returns 11, never more than 7 weeks in one town, 4%.
   That 54% is where #132's "91% of a late house's cards are somewhere else"
   came from — a number published as the reference player's POLICY when it was
   the shape of its cage.
   So the last section holds the thing the first four cannot: that the player
   this suite measures with actually comes home. A tour is a round trip or it is
   an emigration, and an emigration silently re-bases every late-game figure the
   project publishes. */

import { hasHandle } from "../harness.mjs";

export const name = "roads";
export const describe = "a tour can be driven headless — out, around the bay, and home";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const d = A.newGameState("Rd","clean","ROADS1",null);
    d.gold = 9000; d.fame = 300;
    const week = () => { d.pendingEvent = null; A.endWeek(d); };

    /* out — and the gate refuses a second departure mid-road */
    const outOk = A.setOut(d, "pompeii");
    const outTwice = A.setOut(d, "neapolis");
    week();
    const arrived = d.city === "pompeii" && !d.travel;
    const clocked = A.stayWeeks(d) >= 0 && d.flags.cityArrived != null;

    /* the town's card exists and is the town's */
    A.makeCityGames(d);
    const card = (d.games && d.games.offers) || [];
    const cardOk = card.length >= 2 && card.every(o=>o.city === "pompeii");

    /* a fresh visitor against a stale resident: same state, only the stay moved */
    const draw = () => { A.makeCityGames(d); return ((d.games&&d.games.offers)||[]).map(o=>o.purse||0); };
    const med = a => { const s = a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)] || 0; };
    const freshP = [], staleP = [];
    d.flags.cityArrived = d.week;          for(let i=0;i<30;i++) freshP.push(...draw());
    d.flags.cityArrived = d.week - 16;     for(let i=0;i<30;i++) staleP.push(...draw());
    const welFresh = (d.flags.cityArrived = d.week, A.welcomeOf(d));
    const welStale = (d.flags.cityArrived = d.week - 16, A.welcomeOf(d));
    d.flags.cityArrived = d.week;

    /* home — and the stay clock is wiped */
    const homeOk = A.comeHome(d);
    week();
    const home = d.city == null && !d.travel;
    const wiped = d.flags.cityArrived == null && A.stayWeeks(d) === 0;

    /* ---- DOES THE REFERENCE PLAYER COME HOME? ----
       FORCED, not observed. The obvious version plays houses and waits for `bayCall` to send one
       south, and that version can pass while saying nothing: the invitation needs fame 90 and a man
       at pfame 22, and over 6 houses of 220 weeks it may not fire at all. A bar that is vacuous
       whenever the RNG is quiet is the free-pass shape #128 was about. So the house is PUT on the
       coast with `setOut` and the only question asked is whether the reference player gets it back.
       The bound is the game's own arithmetic: `travel` weeks out, the welcome wears once `stayWeeks`
       passes STAY_FRESH=6, `travel` weeks back — nine for Pompeii. The bar is 25, which is loose
       enough to survive a change to either constant and still catch the fault, since the thing it is
       catching does not take 25 weeks or 250: it never happens at all. */
    /* ---- #136: SIX HOUSES WAS NOT ENOUGH, AND THE BAR COUNTED THE DEAD ----
       This read 5 of 6 on a build whose only change was one extra key in `EVENTS` with its `make`
       neutered to `return null` — a reshuffle of `pickEvent`, not a fault. Two things were wrong and
       both are mine: six houses is a sample where one bad draw is 17%, and a house that DIED on the
       coast was counted as one that failed to come home. It cannot come home; it is dead. The dead
       are counted apart now and the bar is on the houses that were alive to make the trip. */
    const HOUSES = 16, WEEKS = 220, PATIENCE = 25;
    const stranded = [];
    for(let h=0; h<HOUSES; h++){
      const g = A.newGameState("Rf"+h, "clean", `ROADF-${h}`, null);
      for(let w=0; w<25; w++){ if(g.over) break; R.lanista(g); }   /* a house on its feet first */
      if(g.over || g.city || g.rome) continue;
      if(!A.setOut(g, "pompeii")) continue;
      let took = null;
      for(let w=0; w<PATIENCE; w++){
        R.lanista(g);
        if(g.over) break;
        if(!g.city && !g.travel){ took = w+1; break; }
      }
      stranded.push({ h, took, dead: !!g.over, where: g.city || null });
    }
    const cameBack = stranded.filter(x=>x.took != null).length;
    const died = stranded.filter(x=>x.took == null && x.dead).length;
    const sent = stranded.length;
    const couldReturn = sent - died;          /* the population the bar is actually about */
    const slowest = Math.max(0, ...stranded.map(x=>x.took||0));

    /* and the same thing observed over natural play, PRINTED rather than barred — it is the figure
       that moved (54% -> 4%) but it rides on whether `bayCall` fired, which is not a contract */
    let outs = 0, backs = 0, roadW = 0, allW = 0, worstStay = 0;
    for(let h=0; h<HOUSES; h++){
      const g = A.newGameState("Rp"+h, "clean", `ROADP-${h}`, null);
      let prev = null, run = 0;
      for(let w=0; w<WEEKS; w++){
        if(g.over) break;
        allW++;
        if(g.city){ roadW++; run++; if(run > worstStay) worstStay = run; } else run = 0;
        if(g.city !== prev){
          if(g.city) outs++; else if(prev) backs++;
          prev = g.city;
        }
        R.lanista(g);
      }
    }
    return { outOk, outTwice, arrived, clocked, cardOk, cardN: card.length,
      sent, cameBack, died, couldReturn, slowest, stranded, PATIENCE,
      freshMed: med(freshP), staleMed: med(staleP),
      welFresh: +welFresh.toFixed(2), welStale: +welStale.toFixed(2),
      homeOk, home, wiped,
      outs, backs, roadW, allW, worstStay, HOUSES, WEEKS };
  });

  const lines = [], fails = [];
  lines.push(`out ${out.outOk ? "went" : "REFUSED"} · arrived ${out.arrived} · ${out.cardN} offers on the town's card`);
  lines.push(`a fresh visitor's median purse ${out.freshMed}d (welcome ${out.welFresh}) · sixteen weeks resident ${out.staleMed}d (welcome ${out.welStale})`);
  lines.push(`home ${out.home}, the stay clock ${out.wiped ? "wiped" : "STILL RUNNING"}`);

  if(!out.outOk) fails.push("setOut refused a plain departure");
  if(out.outTwice) fails.push("a house already on the road was allowed to set out again");
  if(!out.arrived) fails.push("one week out of Capua did not arrive at Pompeii");
  if(!out.clocked) fails.push("arrival did not start the stay clock");
  if(!out.cardOk) fails.push("the town's card was missing or not the town's");
  if(!(out.welStale < out.welFresh)) fails.push("sixteen weeks of residence left the welcome as warm as a first morning");
  if(!(out.staleMed < out.freshMed * 0.85))
    fails.push(`a stale resident's median purse is ${out.staleMed}d against a fresh visitor's ${out.freshMed}d — residence is supposed to cost`);
  if(!out.homeOk || !out.home) fails.push("comeHome did not bring the house home");
  if(!out.wiped) fails.push("coming home did not wipe the stay clock");

  const pc = (n,dn) => dn ? `${Math.round(n/dn*100)}%` : "-";
  lines.push(`put on the coast and left to the reference player: ${out.cameBack} of ${out.couldReturn} came home`
    + ` (${out.died} of ${out.sent} died there and could not), slowest ${out.slowest}w of ${out.PATIENCE} allowed`
    + (out.cameBack < out.sent
        ? ` · STRANDED: ${out.stranded.filter(x=>x.took==null).map(x=>`house ${x.h} ${x.dead?"died in":"still in"} ${x.where||"?"}`).join(", ")}`
        : ""));
  lines.push(`over natural play, ${out.HOUSES} houses x ${out.WEEKS}w: ${out.outs} departures · ${out.backs} returns`
    + ` · ${out.roadW} of ${out.allW} weeks on the coast (${pc(out.roadW,out.allW)})`
    + ` · longest unbroken spell away ${out.worstStay}w  [printed, not barred — it rides on whether \`bayCall\` fired.`
    + ` A spell can span TWO towns: \`setOut\` refuses only a departure to the town you are standing in,`
    + ` so an invitation arriving on the coast hops the house sideways without it ever seeing Capua]`);

  /* ---- THE BAR THE FIRST FOUR SECTIONS COULD NOT CARRY ----
     Not "did a house come home" — `comeHome` was always fine, and the section above proves it every
     run. This is whether the REFERENCE PLAYER uses it, which is the thing that was false ever since
     `__ROPE.lanista` was written in v2.93.0, while every other assertion here passed. */
  if(!out.sent)
    fails.push(`no house could be put on the coast at all — this section proves nothing when it sends `
      + `nobody, and a bar that quietly measures an empty set is the fault it was written to prevent`);
  else if(!out.couldReturn)
    fails.push(`every one of ${out.sent} houses died on the coast, so nothing was left to make the trip `
      + `and this section measured an empty set`);
  else if(!out.cameBack)
    fails.push(`${out.couldReturn} houses were put in Pompeii and NOT ONE came home inside ${out.PATIENCE} weeks `
      + `— the reference player has no way back from the coast, which is the v2.46 stranding again: `
      + `every late-game figure this project publishes is then measured on an emigrated house`);
  else if(out.cameBack < out.couldReturn)
    fails.push(`only ${out.cameBack} of ${out.couldReturn} LIVING houses came home inside ${out.PATIENCE} `
      + `weeks [measured: all of them, slowest 8] — coming home is conditional on something it should not `
      + `be. The dead are already excluded, so this is not a house that simply ran out of road`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
