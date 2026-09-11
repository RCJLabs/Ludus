/* THE DOOR WITH NO LEVER WAS ALSO THE BRAKE — #260 phase 2.

   (`bury` was free in BOTH directories; checked before writing, in checks and probes.)

   v3.251.0 found one door with no lever at all in the whole suite: `holdMunera`, the rite over your
   own dead. It was built as `bury` so the sweep could price it, and the price turned out to be the
   game's headline arc.

   `probes/survey.mjs` takes a policy now, and the reference against `bury:true` on the same houses,
   two independent seed sets, 16 x 420 each:

                        house-weeks   risings   rebellion-weeks   as % of weeks   stage 3
     reference             3,538         26           423             12.0%          55
     reference (set 2)     3,260         26           260              8.0%          51
     bury                  4,368          9            55              1.3%           2
     bury (set 2)          4,164          3            24              0.6%           3

   THE MECHANISM IS NOT SUBTLE. `RITES` prices a rite at unrest **-7** and full games at **-19**,
   per man, inside a six-week window; `riteLapse` closes that window costing nothing in unrest at
   all, so silence is not punished — it simply forgoes the discount. The reference player lapses
   **377 of 387** dead men (97.4%) because nothing in this suite could call the function. A house
   that buries its dead is spending its unrest down every time one of them falls, and the rising
   that the README names as a headline system mostly stops happening to it.

   SO "THE THREE-STAGE REBELLION ARC" IS, IN LARGE PART, A FACT ABOUT THE REFERENCE PLAYER. That is
   the answer #260 phase 2 was looking for, and it is the strong form of it: not a figure conditioned
   on a partial player, but a whole system whose prominence is.

   ---- AND THE FIRST ATTRIBUTION WAS WRONG, ON A SEED SET ----
   Five levers were run singly and TWO looked like the brake: `bury` at 1.3% and `court` at 0.6%
   against the reference's 12.0%. `court` was a fluke. On the second seed set it reads **6.9% with
   25 risings against the reference's 26** — no effect at all — while `bury` replicated at 0.6%.
   One seed set produced one real finding and one false one, and nothing but the second set could
   tell them apart. `checks/young.mjs` and `checks/tells.mjs` learned this the same month; it is
   still the cheapest mistake to make in this project and the hardest to see from the inside.

   THE EMPTY-YARD HYPOTHESIS WAS ALSO WRONG, and is worth recording for the same reason. The
   complete-player arm reads rebellion 0.0% and it also frees, retires and sells its way to an empty
   yard — and a house with no men cannot rise, so the reading looked unusable. Measured, the three
   shedding levers ALONE keep **22 of 26 risings on both seed sets**. The collapse is not the empty
   yard. Checking that took two runs and would have cost a false headline.

   ---- AND THE SABOTAGE NAMED THE MECHANISM RATHER THAN JUST PROVING THE CHECK CAN GO RED ----
   The obvious sabotage is to stop the lever firing. The useful one was to make it take the game's
   OWN free door instead: `holdMunera(d, gid, "none")` — the pit, unrest **+4**, no discount. The
   factor falls from 4.9 to **1.4** and eight of sixteen houses go back to stage 3. So the brake is
   not "calling `holdMunera`", it is the unrest the RITE spends; the free door is worse than
   silence, which is #224's gap stated as an experiment rather than an argument, and it is why the
   `bury` lever declines to offer `none` at all.

   THE BARS ARE DIRECTION AND MAGNITUDE, NOT THE NUMBER. The rebellion share is 8-12% under the
   reference and 0.6-1.3% under `bury` — an order of magnitude, measured twice — so the bar is set
   at a factor of two and the figures are reported beside it. FOUR ARMS. */
import { installRope } from "../harness.mjs";

export const name = "bury";
export const describe = "the rite over your own dead is the brake on the rising, and nothing in this suite could pull it until v3.251.0";

const HOUSES = 16, WEEKS = 420;

/* ---- MEASURED AT THIS EXACT FRAME ON FIVE SEED SETS, not at the probe's ----
   The header's table is `probes/survey.mjs`'s frame and says so; these are this file's own, and
   they are NOT the same statistic — survey counts rebellion-WEEKS at stage 3 and this counts
   HOUSES that ever reached it. The first cut of this block quoted survey's 51-55 against this
   check's 2-3 as though they were one number, which is the label fault this project keeps meeting,
   made here in the act of writing about it.

     seed set      ref lapse   ref share   ref st3   bury share   bury st3   factor
     BURYCHK         98.0%        9.0%        9         1.8%         2         4.9
     BURYCHK-B       94.1%        6.7%        9         0.8%         1         7.9
     BURYCHK-C       95.3%       10.0%        6         1.3%         2         7.5
     BURYCHK-D       95.8%       10.6%        8         1.4%         2         7.4
     BURYCHK-E       95.7%        8.2%        7         1.5%         3         5.5

   Every bar is a factor rather than a count, because the counts move with the seed and the factor
   does not. */
const LAPSE_FLOOR = 0.80;  /* the reference lapses this share of its dead; measured 94.1-98.0% */
const BRAKE       = 2.0;   /* ref's rebellion share over bury's; measured 4.9x-7.9x */
/* THE LOOSEST BAR HERE, AND DELIBERATELY. Stage 3 is a count of houses between 1 and 9, so the
   ratio is a quotient of small numbers: measured 0.11-0.43 over the five sets, which is a wider
   spread than anything else in this file. 0.70 keeps the claim (the deep end is answered) without
   resting it on one house's luck. */
const STAGE3_CUT  = 0.70;

export async function run({ p }){
  const lines = [], bad = [];
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","holdMunera","unhonoured","RITES","activeG"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function")
      return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };

    const arm = (o) => {
      let weeks = 0, risings = 0, rebWeeks = 0, stage3 = 0, marked = 0, lapsed = 0, answered = 0;
      const ends = {};
      for(let i=0;i<H;i++){
        const d = A.newGameState("Bu", "clean", `BURYCHK-${i}`);
        /* every man ever marked, held by identity — `markUnburied` caps the list at fourteen, so
           reading it at the end counts the cap and not the dead (the fault #260 found in `survey`) */
        const seen = []; let prev = [];
        let wasRebel = false, top = 0;
        for(let w=0; w<W; w++){
          if(d.over) break;
          try { R.lanista(d, o); } catch(e){ break; }
          weeks++;
          { const cur = d.unburied || [], had = new Set(prev);
            for(const m of cur) if(!had.has(m)) seen.push(m);
            prev = cur.slice(); }
          const reb = d.rebellion;
          if(reb){ rebWeeks++; if(!wasRebel) risings++; wasRebel = true;
            const st = reb.stage || 0; if(st > top) top = st; }
          else wasRebel = false;
        }
        if(top >= 3) stage3++;
        marked += seen.length;
        lapsed += seen.filter(m=>m.lapsed).length;
        answered += seen.filter(m=>m.done && !m.lapsed).length;
        const k = d.over ? d.over.kind : "survived";
        ends[k] = (ends[k]||0) + 1;
      }
      return { weeks, risings, rebWeeks, stage3, marked, lapsed, answered, ends,
        share: weeks ? rebWeeks / weeks : 0 };
    };
    return { ref:arm({}), bury:arm({ bury:true }) };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { ref, bury } = r;
  const pct = x => (100*x).toFixed(1);
  const endStr = e => Object.entries(e).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(", ");

  /* 1 — the reference lapses nearly all of them */
  const lapseRate = ref.marked ? ref.lapsed / ref.marked : 0;
  lines.push(`${HOUSES} houses to week ${WEEKS}: the reference marked ${ref.marked} men unburied and let ${ref.lapsed} of them lapse (${pct(lapseRate)}%), answering ${ref.answered} [measured 94.1-98.0% over five seed sets] · ${endStr(ref.ends)}`);
  if(!(lapseRate >= LAPSE_FLOOR))
    bad.push(`the reference player lapsed only ${pct(lapseRate)}% of its dead against a bar of ${pct(LAPSE_FLOOR)}% [measured 94.1-98.0%] — `
      + `it has no policy that buries anyone, so a fall in this rate means `+"`riteLapse`"+`'s window or `+"`markUnburied`"+`'s list has changed shape and every figure below rests on it`);

  /* 2 — and the rite is the brake */
  const factor = bury.share > 0 ? ref.share / bury.share : Infinity;
  lines.push(`rebellion-weeks: reference ${ref.rebWeeks} of ${ref.weeks} (${pct(ref.share)}%), ${ref.risings} risings, ${ref.stage3} houses reaching stage 3`);
  lines.push(`   burying them: ${bury.rebWeeks} of ${bury.weeks} (${pct(bury.share)}%), ${bury.risings} risings, ${bury.stage3} at stage 3 — a factor of ${factor === Infinity ? "∞" : factor.toFixed(1)} [measured 4.9x-7.9x over five seed sets, and it still lapses a third of them itself] · ${endStr(bury.ends)}`);
  if(!(factor >= BRAKE))
    bad.push(`burying the dead cut the rebellion share by a factor of ${factor === Infinity ? "∞" : factor.toFixed(1)} against a bar of ${BRAKE} `
      + `[measured 4.9x-7.9x: ${pct(ref.share)}% against ${pct(bury.share)}%] — the rite has stopped being the brake on the rising, `
      + `and #260 phase 2's finding that the arc's prominence is a fact about the reference player rests on exactly this`);
  if(!(bury.stage3 <= ref.stage3 * STAGE3_CUT))
    bad.push(`${bury.stage3} of ${HOUSES} houses reached rebellion stage 3 while burying their dead, against ${ref.stage3} that did not `
      + `[measured 1-3 against 6-9 houses over five seed sets] — the deep end of the arc is no longer answered by the rite`);
  if(bury.risings > ref.risings)
    bad.push(`a house that buries its dead rose MORE often (${bury.risings}) than one that does not (${ref.risings}) — the direction of the whole finding has reversed`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
