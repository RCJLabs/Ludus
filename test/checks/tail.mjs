/* THE THIN TAIL IS NOT THE DIE'S — #262, measured and closed.

   (`tail` was free in BOTH directories; checked before writing, in checks and probes.)

   #262 read a hard split off `survey`'s event tally — head `ambition` 191, `refusal` 190,
   `ludusNight` 179; tail `primacy` 4, `licence` 8, `uprising` 8, `doctore` 9, `stolenSteel` 12,
   `crowdCalls` 12, `mentor` 13, `patronGone` 13 — and asked the one question that decides what to
   do about it: is each tail event rare because its GATE is rare, or because its TICKETS are few?

   `probes/tail.mjs` answered it on 7,900 house-weeks, and the answer is that the question is being
   asked of the wrong machine.

   ---- SEVEN EVENTS HAVE THEIR OWN RAISER AND NEVER NEEDED THE DIE ----
   `pickEvent` is rolled on `R()<0.45`, and only when no question is already standing — 26% of
   askable weeks in practice. Alongside it, seven events are raised by their own code:

     ludusNight    its own `R()<0.5` every week (`src` line ~25718)      63 off the die, 453 raised
     ambition      its own `R()<0.14` every week (~22934)                64 off the die, 393 raised
     stash         unconditionally when nothing is pending (~22900)       0 off the die,  84 raised
     poached       `poachWeek` (~23209)                                   0 off the die,  48 raised
     whispers      the rebellion (~22559)                                 0 off the die,  36 raised
     stolenSteel   the rebellion (~22564)                                 0 off the die,  28 raised
     uprising      the rebellion (~22569)                                 5 off the die,  25 raised

   **So #262's "head" is not the die's head.** Off the die itself `ambition` and `ludusNight` get 64
   and 63 — mid-pack, and 0.98x and 0.90x their own share of the weight. Their dominance of the
   tally is two dedicated rolls running beside the die at 14% and 50% a week.

   ---- AND THE DIE IS PAYING WHAT ITS WEIGHTS PROMISE ----
   Comparing each event's share of the die's draws against its share of the expected weight on the
   weeks it was eligible, thirty of thirty-six sit between 0.7 and 1.4. Nothing is starved by the
   ordering. Of the eight names in the item:

     licence       NOT A DIE EVENT AT ALL — no `EV_DIE` entry, raised by its own system
     stolenSteel   NOT THE DIE — 0 draws in 7,900 weeks; the rebellion raises it
     primacy       GATE — eligible on 0.2% of weeks, already 8 tickets, already paid 2.20x its share
     uprising      GATE — eligible on 0.9%, already 8 tickets
     doctore       the die pays it 1.06x — eligible 11.1%, 2 tickets
     crowdCalls    the die pays it 1.02x — eligible  7.8%, 4 tickets
     mentor        the die pays it 1.17x — eligible 15.1%, 2 tickets
     patronGone    the die pays it 1.05x — eligible 10.4%, 2 tickets

   **Two are not the die's, two are gate-limited and already over-weighted, and four are the weights
   doing exactly what they were set to do.** Re-weighting the die — the item's proposed action, at
   its own stated cost of re-phasing every seeded fixture — would move four events and would not
   touch the split the item is actually about.

   ---- WHAT THIS FILE HOLDS IS THE PART NOTHING ELSE WATCHES ----
   `checks/die.mjs` already holds the table, the sampler's proportionality and the cooldown. What
   had no guard at all is the arrangement above: that seven events reach the player on their own
   rolls, and that the event tally every figure in this project quotes is therefore the SUM of two
   machines. If one of those raisers changes rate, every event figure moves and the die checks stay
   green. The eligibility sweep that produced the classification costs ten minutes and stays in the
   probe; what is cheap enough to hold every release is the raiser gap itself.

   FOUR ARMS' WORTH OF CLAIM ON ONE ARM. */
import { installRope } from "../harness.mjs";

export const name = "tail";
export const describe = "the event tally is two machines, not one — seven events are raised beside the die and two of them dominate the head";

const HOUSES = 16, WEEKS = 420;

/* ---- MEASURED AT THIS EXACT FRAME ON FIVE SEED SETS ----
     seed set     askable  drawn  draw%  ludusNight d/r  ratio   ambition d/r  ratio   never-drawn-but-raised
     TAILCHK         4017   1034  25.7%     33/210        6.4      28/214       7.6    3
     TAILCHK-B       2514    656  26.1%     22/131        6.0      21/127       6.0    4
     TAILCHK-C       2923    787  26.9%     27/146        5.4      29/160       5.5    4
     TAILCHK-D       3052    813  26.6%     29/185        6.4      33/167       5.1    4
     TAILCHK-E       3218    827  25.7%     25/205        8.2      31/180       5.8    4 */
const DRAW_LO = 0.15, DRAW_HI = 0.40;  /* the die's share of askable weeks; measured 25.7-26.9% */
const RAISER_MULT = 2.5;               /* raised over drawn for the two big raisers; measured 5.1-8.2 */
const NEVER_DRAWN = 3;                 /* events raised in play that the die never gives; measured 3-4 */

export async function run({ p }){
  const lines = [], bad = [];
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","EV_DRAWN","EV_DIE","EVENTS"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function")
      return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };

    const row = {}; for(const k of A.EV_DRAWN) row[k] = { drawn:0, raised:0 };
    let weeks=0, askable=0, totDrawn=0;
    for(let i=0;i<H;i++){
      const d = A.newGameState("Ta","clean",`TAILCHK-${i}`);
      for(let w=0;w<W;w++){
        if(d.over) break;
        if(!d.rome && !d.travel) askable++;
        /* `pickEvent` is the ONLY writer of `flags.evLast`, so a stamp that moved is a draw off the
           die and nothing else — the dedicated raisers call `make()` directly and write nothing */
        const was = Object.assign({}, (d.flags && d.flags.evLast) || {});
        let did=null; try{ did = R.lanista(d); }catch(e){ break; }
        weeks++;
        { const now = (d.flags && d.flags.evLast) || {};
          for(const k of Object.keys(now)) if(row[k] && now[k] !== was[k]){ row[k].drawn++; totDrawn++; } }
        if(did && did.events) for(const k of Object.keys(did.events))
          if(row[k]) row[k].raised += did.events[k];
      }
    }
    return { row, weeks, askable, totDrawn, hasLicence: A.EV_DIE.licence != null,
      licenceIsDrawn: A.EV_DRAWN.indexOf("licence") >= 0 };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { row, weeks, askable, totDrawn } = r;
  const rate = askable ? totDrawn/askable : 0;
  const mult = k => row[k] && row[k].drawn > 0 ? row[k].raised/row[k].drawn : (row[k] && row[k].raised ? Infinity : 0);
  const show = x => x === Infinity ? "∞" : x.toFixed(1);

  /* 1 — the die's own share of the weeks */
  lines.push(`${HOUSES} houses to week ${WEEKS}: ${weeks} house-weeks, ${askable} askable, ${totDrawn} draws off the die (${(100*rate).toFixed(1)}%) [five sets: 25.7-26.9%, and the call site rolls R()<0.45 when no question stands]`);
  if(!(rate >= DRAW_LO && rate <= DRAW_HI))
    bad.push(`the die was rolled on ${(100*rate).toFixed(1)}% of askable weeks, outside ${100*DRAW_LO}-${100*DRAW_HI}% [measured 25.7-26.9%] — `
      + `every per-event figure in #262 and in `+"`probes/tail.mjs`"+` is a share of this, so it moves with it`);

  /* 2 — and two events reach the player mostly without it */
  for(const k of ["ludusNight","ambition"]){
    const m = mult(k);
    lines.push(`${k}: ${row[k].drawn} off the die, ${row[k].raised} raised in all (${show(m)}x) — its own roll runs beside the die [five sets: 5.1-8.2x]`);
    if(!(m >= RAISER_MULT))
      bad.push(`${k} was raised only ${show(m)}x as often as the die gave it (${row[k].drawn} drawn, ${row[k].raised} raised) against a bar of ${RAISER_MULT} `
        + `[measured 5.1-8.2x] — its dedicated roll has stopped running or the die has taken it over, and #262 was closed on the finding that `
        + `this event's place at the head of the tally is that roll and not its tickets`);
  }

  /* 3 — and some are never the die's at all */
  const never = Object.keys(row).filter(k=>row[k].drawn === 0 && row[k].raised > 0);
  lines.push(`raised in play but never once drawn: ${never.length ? never.join(", ") : "none"} [five sets: 3-4, always stash, whispers, stolenSteel]`);
  if(!(never.length >= NEVER_DRAWN))
    bad.push(`only ${never.length} events were raised without the die ever giving them, against a bar of ${NEVER_DRAWN} [measured 3-4] — `
      + `#262's tail was explained by these having their own raisers, and if the die has started supplying them that explanation is gone`);

  /* 4 — and one of the item's eight was never a die event at all */
  lines.push(`licence: in EV_DIE? ${r.hasLicence ? "yes" : "no"} · in the drawn pool? ${r.licenceIsDrawn ? "yes" : "no"} [it is neither — #262 listed it among the die's tail and it never sees the die]`);
  if(r.hasLicence || r.licenceIsDrawn)
    bad.push(`\`licence\` is in the die's pool now — #262 was closed partly on it being raised by its own system and never drawn, `
      + `so that half of the finding needs re-reading`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
