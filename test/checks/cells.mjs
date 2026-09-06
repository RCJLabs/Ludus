/* THE RISING IS ANSWERABLE, AND THE ANSWER IS PRICED — #247b, phase 1.

   v3.207.0 found that the cells take 29 of 88 seeded houses and that unlike the debt death this one
   is signposted at enormous length: every one of the 29 climbed all three rungs in order, the first
   standing a median of 96, 80 and 30 weeks before the end. The house is told, three times, for a
   hundred weeks, and dies anyway. That left two possibilities and dark.mjs's rule forbids guessing
   between them: either no lever answers a rising, or one does and the reference player never pulls
   it. `probes/cells.mjs` ran the same 48 seeds under six policies to find out.

   IT IS ANSWERABLE, COMPLETELY, AND THAT IS NOT THE GOOD NEWS. A policy that takes the three things
   a lanista can do for his men — the feast, the walk among the cells, a doctore of its own —
   whenever they are available holds unrest at a median of ZERO in every era of both seed sets,
   against 19-22 for the reference player from era one onward. Rebellion deaths fall from 7 of 48 to
   3, and to **0 of 48** for the policy that also frees, keeps the rites and builds.

   AND IT COSTS 101 TO 131 DENARII A WEEK, FOREVER. The same policy takes the median box in the last
   era from 4,929 and 5,649 down to 3,370 and 2,178, turns 7 rebellions into debt and ruin (deaths by
   debt 17 -> 23, by ruin 9 -> 13), and takes survivors from 11 of 48 to 7 — to 2 for `everything`.
   The lever is not missing. It is priced at about what the house earns, and the choice it offers is
   which death. That is #247b's actual shape and it is a different item from the one that was filed.

   THREE ARMS, seeded, 8 houses x 300 weeks, two policies.

   1 · THE ANSWER STILL WORKS. Under a policy that feasts and walks whenever it can, unrest sits at
       or under CALM_BAR, and the reference player sits at least GAP above it. Both halves matter: an
       absolute floor alone would pass if unrest stopped moving at all, and a gap alone would pass if
       both went to the ceiling together.
   2 · AND IT IS STILL NOT FREE. The calming policy must spend materially — over SPEND_FLOOR a week
       on feasts alone. If keeping the men sweet ever became cheap, the trade this item is about
       would have quietly disappeared and the measurement above would stop describing the game.
   3 · AND EVERY CALMING TERM IS CONNECTED. The weekly drift subtracts `docCalm`, `cellCalm`,
       `perkCalm`, `lanCalm` and the collegium, and a term that silently reads zero everywhere is a
       lever that has been unplugged rather than balanced. Each must be non-zero on some house-week.
       `perkCalm` and the collegium are late and optional and are reported, not held. */
import { found, clearAll, installRope } from "../harness.mjs";

const HOUSES = 8, WEEKS = 300;
const CALM_BAR = 2;       /* the calming policy measured a p50 of 0 in every era of both probe sets */
const NEAR_RUNG = 35;     /* and a p90 of 16 — it does not get near the whispers at 50 */
const GAP = 5;            /* while the reference player sits at 19-22 from era one */
const SPEND_FLOOR = 20;   /* denarii a week on feasts; measured 101-131 */

export const name = "cells";
export const describe = "the rising can be answered, and the answer still costs what the house earns";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"CELLS-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","activeG","throwFeast","walkTheCells","hireDoctore",
                  "docCalm","cellCalm","perkCalm","lanCalm","collOn"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    const terms = { doctore:0, cells:0, perk:0, lanista:0, collegium:0 };
    const run1 = (keep) => {
      const unrest = []; let spent = 0, feasts = 0, walks = 0, weeks = 0;
      const ends = {};
      for(let h=0; h<H; h++){
        const d = A.newGameState("Ce"+h, "clean", `CELLSCHK-${h}`);
        for(let w=0; w<W; w++){
          if(d.over) break;
          unrest.push(Math.round(d.unrest)); weeks++;
          /* the drift's calming terms, counted wherever they are alive */
          if(A.docCalm(d) > 0) terms.doctore++;
          if(A.cellCalm(d) > 0) terms.cells++;
          if(A.perkCalm(d) > 0) terms.perk++;
          if(A.lanCalm(d) !== 0) terms.lanista++;
          if(A.collOn(d)) terms.collegium++;
          if(keep){
            try { if(A.walkTheCells(d)) walks++; } catch(e){}
            if(d.gold > 300){ const was = d.gold;
              try { if(A.throwFeast(d)){ feasts++; spent += was - d.gold; } } catch(e){} }
            if(!d.doctore){ const mkt = (d.doctoreMarket || []).filter(c=>c && d.gold > (c.wage||0) * 30);
              if(mkt.length){ try { A.hireDoctore(d, mkt[0].id); } catch(e){} } }
          }
          try { R.lanista(d); } catch(e){ break; }
        }
        const k = d.over ? d.over.kind : "survived";
        ends[k] = (ends[k] || 0) + 1;
      }
      unrest.sort((a,b)=>a-b);
      return { p50: unrest.length ? unrest[Math.floor(unrest.length/2)] : null,
        p90: unrest.length ? unrest[Math.floor(0.9*unrest.length)] : null,
        weeks, spent: Math.round(spent), feasts, walks, ends };
    };
    const ref = run1(false), kept = run1(true);
    return { ref, kept, terms };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };

  const perWeek = r.kept.weeks ? r.kept.spent / r.kept.weeks : 0;
  const es = e => Object.entries(e).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · ");
  lines.push(`the reference player: unrest p50 ${r.ref.p50}, p90 ${r.ref.p90} over ${r.ref.weeks} weeks — ${es(r.ref.ends)}`);
  lines.push(`kept sweet (feast, walk, a doctore of its own): unrest p50 ${r.kept.p50}, p90 ${r.kept.p90} `
    + `over ${r.kept.weeks} weeks — ${es(r.kept.ends)}`);
  lines.push(`  and it cost ${r.kept.spent}d on ${r.kept.feasts} feasts and ${r.kept.walks} walks — ${perWeek.toFixed(0)}d a week`);

  /* 1 */
  if(r.kept.p50 > CALM_BAR)
    bad.push(`a house that feasts and walks whenever it can still sits at unrest ${r.kept.p50} `
      + `[bar ${CALM_BAR}] — the rising was answerable to a median of 0 in every era of both probe `
      + `sets, and #247b's whole finding is that the lever works and is priced, not that it is missing`);
  /* ---- AND IT MUST NOT GET NEAR THE FIRST RUNG, which is where the bar actually bites ----
     The p50 alone is too generous to catch a real weakening. With the feast's and the walk's whole
     effect removed — unrest, morale and defiance, all three channels — the calming policy still read
     a p50 of 4 against the reference's 12, because a doctore of its own is worth -1.2 a week on the
     drift by itself and the reference player hires one only sometimes. What separated them was the
     TAIL: p90 16 honest against 51 sabotaged, and 50 is where the whispers start. A policy that
     answers the rising does not arrive at the rung the rising fires from. */
  if(r.kept.p90 >= NEAR_RUNG)
    bad.push(`the calming policy reaches unrest ${r.kept.p90} at its 90th week [bar ${NEAR_RUNG}, and `
      + `the whispers are at 50] — measured 16. A house doing everything it can for its men should `
      + `not be arriving at the first rung of the ladder at all`);
  if(r.ref.p50 - r.kept.p50 < GAP)
    bad.push(`the reference player sits at unrest ${r.ref.p50} and the calming policy at ${r.kept.p50}, `
      + `a gap of ${r.ref.p50 - r.kept.p50} [bar ${GAP}] — either the calming stopped working or the `
      + `reference player started doing it, and neither can be told from the floor alone`);
  /* 2 */
  if(perWeek < SPEND_FLOOR)
    bad.push(`keeping the men sweet costs ${perWeek.toFixed(0)}d a week [floor ${SPEND_FLOOR}] — it was `
      + `101 to 131 when #247b was measured, and the item is the PRICE. A calm that costs nothing is `
      + `not a trade and the finding above no longer describes the game`);
  /* 3 */
  const dead = Object.entries(r.terms).filter(([k,n])=>!n && k !== "perk" && k !== "collegium");
  lines.push(`  the drift's calming terms, over ${r.ref.weeks + r.kept.weeks} house-weeks: `
    + Object.entries(r.terms).map(([k,n])=>`${k} ${n}`).join(" · "));
  if(dead.length)
    bad.push(`${dead.map(([k])=>k).join(", ")} never once read as calming in `
      + `${r.ref.weeks + r.kept.weeks} house-weeks — a term the drift subtracts that is always zero is `
      + `a lever unplugged rather than balanced`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the cells can be quieted, and quieting them still costs the house its box`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
