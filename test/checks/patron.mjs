/* #131'S FIRST PIECE: SOMETHING A GREAT HOUSE CAN LOSE.

   #131 measured that 97.7% of what a year-12 house is shown was already available in week one, and
   four explanations that would have made it a bug each failed. The estate table said what was true:
   a great house has ACQUIRED EVERYTHING AND IS AT RISK OF NOTHING — armourer, medicus, doctrine,
   blessing, wife, doctore, aedile and collegium all at 100% of late weeks, patrons at a mean favour
   of 94 of 100, unrest DOWN 60% from the early game.

   Patrons were the sharpest case, found by a search rather than a hunch: NOTHING in the file ever
   removed a patron or a room. Favour decayed; the man stayed. So they die now, and `patronWeek`
   already reseats an unheld rank at `ri(28,42)` — the existing refill IS the loss, so no recovery
   system had to be built beside it. `d.favor` is the weighted mean of them and the census ladder's
   `favorOk` and Rome both read it.

   THREE THINGS THIS CHECK KNOWS THAT THE FIRST DRAFT DID NOT, each caught by measuring:
     · the cost lands on the REPLACEMENT, not the death. `recomputeFavor` is a weighted MEAN, so
       removing one of two men both at 90 leaves standing at 90. Measured 90 -> 90 on the day -> 54
       once the seat refilled. The first version asserted the drop on the day and failed, correctly.
     · the gate must be LATE BY THE LANISTA'S OWN CLOCK. `PATRON_HELD` of 60 weeks is year FOUR:
       deaths landed at weeks 60-86 on houses that then died at 70-86, and `policy` read it as the
       late game going out of reach — best fame 1,645 against a control at 3,720, five subsystems
       dark. `PATRON_AGE` gates on his years instead, and his patrons are his contemporaries.
     · and never the last patron, which is the one that would ruin a save. */

import { hasHandle } from "../harness.mjs";

export const name = "patron";
export const describe = "a patron can be lost, never the last one, and mourning buys what it says";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["patronDies","patronOld","PATRON_HELD","PATRON_AGE","patronsOf","recomputeFavor","patronWeek"]
      .filter(k => A[k] == null);
    if(miss.length) return { miss };
    const old = d => { if(d.lanista) d.lanista.age = A.PATRON_AGE + 5; return d; };
    const ripe = (tag) => { const d = old(A.newGameState(tag,"clean","P-"+tag,null));
      A.patronsOf(d).forEach(x=>{ x.favor = 90; x.since = 1; });
      d.week = 1 + A.PATRON_HELD; A.recomputeFavor(d); return d; };

    /* ---- 1. THE LAST PATRON IS NOT TAKEABLE ---- */
    const d0 = ripe("Pt0");
    while(A.patronsOf(d0).length > 1) A.patronsOf(d0).pop();
    A.recomputeFavor(d0);
    const refusedLast = A.patronDies(d0, A.patronsOf(d0)[0].id, false);
    const stillThere = A.patronsOf(d0).length;

    /* ---- 2. THE LOSS IS REAL, AND WHERE THE COST ACTUALLY LANDS ---- */
    const d1 = ripe("Pt1");
    const favBefore = d1.favor, nBefore = A.patronsOf(d1).length;
    const target = A.patronOld(d1);
    const took = target ? A.patronDies(d1, target.id, false) : null;
    const favOnDeath = d1.favor;
    const goneFromList = target ? !A.patronsOf(d1).some(x=>x.id === target.id) : false;
    for(let w=0; w<40; w++){ A.patronWeek(d1); if(A.patronsOf(d1).length >= nBefore) break; }
    A.recomputeFavor(d1);
    const favAfter = d1.favor, nAfter = A.patronsOf(d1).length;

    /* ---- 3. THE GATE IS LATE, BY BOTH ITS TERMS ---- */
    const d2 = old(A.newGameState("Pt2","clean","P-Pt2",null));
    A.patronsOf(d2).forEach(x=>{ x.favor = 95; x.since = 1; });
    d2.week = 4;                                    const youngHouse = A.patronOld(d2);
    d2.week = 1 + A.PATRON_HELD;                    const oldHouse   = A.patronOld(d2);
    A.patronsOf(d2).forEach(x=>{ x.favor = 20; });  const coldMan    = A.patronOld(d2);
    const d2b = A.newGameState("Pt2b","clean","P-Pt2b",null);
    A.patronsOf(d2b).forEach(x=>{ x.favor = 95; x.since = 1; });
    d2b.week = 1 + A.PATRON_HELD;
    if(d2b.lanista) d2b.lanista.age = A.PATRON_AGE - 8;
    const youngLanista = A.patronOld(d2b);

    /* ---- 4. MOURNING BUYS THE NEXT MAN'S OPINION ---- */
    const warm = mourn => {
      const g = ripe("Pt3" + (mourn ? "m" : "n"));
      const t = A.patronOld(g); if(!t) return null;
      const was = t.favor, rank = t.rank;
      A.patronDies(g, t.id, mourn);
      for(let w=0; w<40; w++){
        A.patronWeek(g);
        const fresh = A.patronsOf(g).find(x=>x.rank === rank);
        if(fresh) return { favor: Math.round(fresh.favor), weeks: w+1, was };
      }
      return null;
    };
    const noMourn = warm(false), mourned = warm(true);

    /* ---- 5. THE EVENT BUILDS, RUNS, AND KNOWS WHERE IT IS ---- */
    const d4 = ripe("Pt4"); d4.gold = 9000;
    const ev = A.EVENTS.patronGone.make(d4);
    let spent = null;
    if(ev){ const g0 = d4.gold, n0 = A.patronsOf(d4).length;
      A.EVENTS.patronGone.run(d4, ev, 0);
      spent = { gold: g0 - d4.gold, lost: n0 - A.patronsOf(d4).length,
                gapSet: d4.flags.patronDied != null }; }
    const again = A.EVENTS.patronGone.make(d4);     /* the gap must shut it straight after */
    const d5 = ripe("Pt5"); d5.city = "pompeii";
    const awayEv = A.EVENTS.patronGone.make(d5);

    return { refusedLast:!!refusedLast, stillThere,
      favBefore, favOnDeath, favAfter, nBefore, nAfter, goneFromList, took:!!took,
      youngHouse:!!youngHouse, oldHouse:!!oldHouse, coldMan:!!coldMan, youngLanista:!!youngLanista,
      noMourn, mourned, held:A.PATRON_HELD, age:A.PATRON_AGE, gap:A.PATRON_GAP,
      evMade:!!ev, evTitle: ev ? ev.title : null, evDoors: ev ? ev.choices.length : 0,
      spent, again:!!again, awayEv:!!awayEv };
  });

  const lines = [], fails = [];
  if(out.miss) return { pass:false, lines:[], why:`${out.miss.join(", ")} not on the handle` };

  lines.push(`the last patron: ${out.refusedLast ? "TAKEN" : "refused"}, ${out.stillThere} still on the list`);
  lines.push(`a long-held man dies: favour ${out.favBefore} -> ${out.favOnDeath} on the day -> ${out.favAfter} `
    + `once the seat refilled (${out.nBefore} patrons again at ${out.nAfter})`
    + `  [the mean does not move on the day; the stranger is the cost]`);
  lines.push(`the gate: house 4w old ${out.youngHouse ? "OPEN" : "shut"} · past ${out.held}w ${out.oldHouse ? "open" : "SHUT"}`
    + ` · a man at favour 20 ${out.coldMan ? "OPEN" : "shut"} · lanista under ${out.age} ${out.youngLanista ? "OPEN" : "shut"}`);
  lines.push(`the next man of that rank: ${out.noMourn ? out.noMourn.favor : "-"} unmourned · `
    + `${out.mourned ? out.mourned.favor : "-"} mourned, against the dead man's ${out.mourned ? out.mourned.was : "-"}`);
  lines.push(`the event: ${out.evMade ? `"${out.evTitle}", ${out.evDoors} doors` : "DID NOT BUILD"}`
    + (out.spent ? ` · attending cost ${out.spent.gold}d and took ${out.spent.lost} patron` : "")
    + ` · it re-offers straight after: ${out.again ? "YES" : `no (${out.gap}w gap)`}`
    + ` · down the coast: ${out.awayEv ? "STILL FIRES" : "does not fire"}`);

  if(out.refusedLast || out.stillThere !== 1)
    fails.push(`the LAST patron was taken — \`recomputeFavor\` sets d.favor to 0 on an empty list, so a `
      + `house that can lose its last patron spirals instead of suffering. This is the one that ruins a save`);
  if(!out.took || !out.goneFromList)
    fails.push(`a long-held patron did not leave the list — the loss is the whole point`);
  if(!(out.favAfter < out.favBefore))
    fails.push(`standing did not fall once the seat refilled (${out.favBefore} -> ${out.favAfter}) — `
      + `\`d.favor\` is what the census ladder and Rome read. Note the cost lands on the REPLACEMENT: `
      + `the mean is unchanged the day he dies, which is why this is measured after the refill`);
  if(out.youngHouse)
    fails.push(`the gate opened on a house 4 weeks old — it needs ${out.held} weeks of service`);
  if(!out.oldHouse)
    fails.push(`the gate never opened on a house past ${out.held} weeks with a favoured patron and an old `
      + `lanista — then nothing is ever lost and #131 is unaddressed`);
  if(out.coldMan)
    fails.push(`a long-held patron at favour 20 was eligible — the loss should be of standing you HAVE`);
  if(out.youngLanista)
    fails.push(`the gate opened on a lanista under ${out.age} — the age term is what makes this a LATE `
      + `loss rather than one that guts a house in its fourth year, which is what it did before`);
  if(!out.noMourn || !out.mourned)
    fails.push(`the rank was never reseated within 40 weeks — the seat must refill or this is an `
      + `amputation rather than a loss`);
  else if(!(out.mourned.favor > out.noMourn.favor))
    fails.push(`mourning bought nothing: the heir arrived at ${out.mourned.favor} against `
      + `${out.noMourn.favor} unmourned, and the event's first door promises otherwise`);
  if(!out.evMade) fails.push(`the event did not build on a house meeting every term`);
  if(out.spent && out.spent.lost !== 1) fails.push(`running it removed ${out.spent.lost} patrons`);
  if(out.spent && !(out.spent.gold > 0)) fails.push(`attending the funeral cost ${out.spent.gold}d`);
  if(out.spent && !out.spent.gapSet) fails.push(`no gap was stamped, so it can fire again next week`);
  if(out.again)
    fails.push(`it offered again immediately — without the ${out.gap}w gap it takes one man after `
      + `another until the house is all strangers, which is a tax rather than a loss`);
  if(out.awayEv) fails.push(`it fired on a house down the coast — the family is in Capua`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
