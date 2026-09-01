/* NOTHING URGENT FALLS OFF THE END OF THE PANEL

   Audit item #211, and the correction that closed it. The item said the shown block is a novelty
   filter — "75% of what fills it is there for being new against 3% for being urgent" — and asked
   that urgency outrank novelty in the late game. It already does, and the sentence it was written
   from describes `agendaTop`, which **has no call sites in the game** (nor do `agWord` or `agAge`;
   `agendaRanked` is called only by the suite). Three audit items were written off a comment that
   claimed a dead filter was the player's screen.

   WHAT THE PLAYER IS SHOWN is two things, and only one of them can hide anything:
     · the MORNING REPORT — every row, grouped 3 / 2 / 1. No cap, no filter. Cannot hide.
     · the LUDUS PANEL — `agenda(S)` minus the men's rows, `.slice(0, 7)`.

   THE PANEL IS THE ONLY RISK, AND IT RESTS ENTIRELY ON A SORT. `agenda` ends
   `A.sort((a,b) => b.urgency - a.urgency)`, so the seven kept are the seven most urgent and an
   urgency-3 row can fall off the end only if a house holds more than seven of them at once.
   Measured over 2,382 weeks: the panel overflows on 20% of early weeks and 57% of late ones — the
   cap bites constantly — and an urgent row fell off it **0 times**, because urgency-3 runs flat
   near 1.5 a week while urgency-2 more than doubles across a run (2.11 -> 5.04). What the cap cuts
   is furniture, which is the design.

   Nothing guarded any of that. Remove the sort from `agenda` and the panel becomes seven rows in
   construction order, with urgent business silently among the cut — no test would have noticed.

   THREE ARMS, and the third is what keeps the other two honest:
   1 · `agenda` comes back sorted by urgency, descending, on every week of real play.
   2 · no urgency-3 row ever sits outside the first seven house rows.
   3 · THE CAP WAS ACTUALLY EXERCISED. If the panel never overflowed, arm 2 passed on nothing —
       the same vacuity that let #211 stand on a dead function for a hundred releases. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "attend";
export const describe = "nothing urgent falls off the end of the ludus panel";
export const slow = true;   /* plays houses and reads the agenda every week */

/* what the panel keeps — the same figure as the `.slice(0, 7)` in App */
const PANEL = 7;

export async function run({ p, errors }){
  await found(p, { seed:"ATTEND-1" });
  await clearAll(p, 16);
  await installRope(p);

  const lines = [], bad = [];
  const r = await p.evaluate((PANEL)=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["agenda","newGameState","activeG"].filter(k=>A[k]==null);
    if(miss.length) return { miss };

    const sum = { weeks:0, rows:0, u3:0, over:0, hidden:0, unsorted:0, worst:0, sample:null, houses:0 };
    for(let h=0; h<6; h++){
      const d = A.newGameState("ATTEND-RUN-"+h);
      sum.houses++;
      for(let w=0; w<220; w++){
        if(d.over) break;
        try { R.lanista(d); } catch(e){ break; }
        sum.weeks++;
        let all = [];
        try { all = A.agenda(d) || []; } catch(e){ return { threw: e.message }; }
        sum.rows += all.length;
        sum.u3 += all.filter(a=>a.urgency>=3).length;
        /* 1 — the sort the slice depends on */
        for(let i=1;i<all.length;i++) if(all[i].urgency > all[i-1].urgency){
          sum.unsorted++;
          if(!sum.sample) sum.sample = `urgency ${all[i].urgency} ("${String(all[i].label||"").slice(0,42)}") `
            + `sits below urgency ${all[i-1].urgency} ("${String(all[i-1].label||"").slice(0,42)}")`;
        }
        /* 2 and 3 — the panel's own list, and what the cap cuts from it */
        const house = all.filter(a=>a.tab!=="men");
        sum.worst = Math.max(sum.worst, house.length);
        if(house.length > PANEL){
          sum.over++;
          const cut = house.slice(PANEL).filter(a=>a.urgency>=3);
          if(cut.length){
            sum.hidden += cut.length;
            if(!sum.sample) sum.sample = `"${String(cut[0].label||"").slice(0,52)}" is urgency ${cut[0].urgency} `
              + `and sits at position ${house.indexOf(cut[0])+1} of ${house.length}`;
          }
        }
      }
    }
    return sum;
  }, PANEL);

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(r.threw) return { pass:false, why:`agenda threw during play: ${r.threw}`, lines };

  const overPc = r.weeks ? (r.over / r.weeks * 100).toFixed(1) : "0";
  lines.push(`${r.weeks} weeks over ${r.houses} houses · ${(r.rows/Math.max(1,r.weeks)).toFixed(2)} rows a week, `
    + `${(r.u3/Math.max(1,r.weeks)).toFixed(2)} of them urgent`);
  lines.push(`  the panel keeps ${PANEL}; the house list ran over it on ${r.over} weeks (${overPc}%), longest ${r.worst}`);
  lines.push(`  urgent rows cut by the cap: ${r.hidden} · rows out of urgency order: ${r.unsorted}`);
  if(r.sample) lines.push(`    ${r.sample}`);

  /* 1 — the sort */
  if(r.unsorted)
    bad.push(`agenda came back out of urgency order on ${r.unsorted} readings — the panel's \`.slice(0, 7)\` `
      + `keeps the FIRST seven and is only the most urgent seven while this holds`);
  /* 2 — the cap never cuts urgent business */
  if(r.hidden)
    bad.push(`${r.hidden} urgency-3 rows fell outside the panel's ${PANEL} — urgent business is off the `
      + `ludus screen, which is the fault #211 feared and did not find`);
  /* 3 — and the cap was exercised, or arm 2 proved nothing */
  if(!r.over)
    bad.push(`the house list never exceeded ${PANEL} in ${r.weeks} weeks, so the cap was never tested and `
      + `arm 2 passed on nothing — measured at v3.159.0 it overflowed on 20% of early weeks and 57% of late ones`);
  if(r.weeks < 200)
    bad.push(`only ${r.weeks} weeks were played — too few to say anything about a cap that bites on a fifth of them`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the cap bit on ${overPc}% of weeks and never once cut an urgent row`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
