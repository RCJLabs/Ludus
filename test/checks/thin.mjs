/* A THIN HOUSE IS NEVER FORCED TO STAY THIN — #247c, phase 1.

   (Named `thin`, not `yard`: `yard` is taken, by the check that holds the Doctore's Board. I
   overwrote that file writing this one, and its own head comment warns about having done exactly
   the same thing to `board` — so this is the second time and the first one left a note. The tell
   here was `git status` reporting `test/checks/yard.mjs` as MODIFIED rather than new. Check the
   name before writing the file.)

   `ruin` — the house that cannot field a man and cannot buy one — took 11 of 88 seeded houses at a
   median week of 262 and 296 (v3.207.0), with roster p50 running 5 · 5 · 2 · 2 · 1 -> 0 over its
   last forty weeks and gold 5,426 -> 100. It was filed as "men out faster than in". It is not.

   `probes/yard.mjs` counted every week the reference player was thin — fewer than the five fit men
   its own policy keeps — and asked why it bought nobody, across two seeded sets of 24 houses (5,607
   thin weeks):

       nothing on the block at all                        0% and 0%
       could not afford the cheapest man at any reserve   4% and 3%
       an edict had capped the cells                     39% and 45%
       could have bought him, and the RESERVE said no    44% and 42%

   and on the houses that actually died of ruin, that last line is **67% and 78%**. The block is
   never empty. The house is almost never too poor. What stops the buying is the reference player's
   own rule — it holds twelve weeks of bill in reserve and spends at most half of what is over it —
   and by `dark.mjs`'s rule that makes #247c as filed a claim about the policy, not about the game.
   (The edict line is the other half and it is not a fault either: `CELLS_BY_RANK` starts at EIGHT,
   so a measured cap of 4.0 is a law, and the reference player wanting five men it may not legally
   keep is the law working.)

   WHAT A CHECK CAN HOLD is the part that is about the game: that the yard emptying is never FORCED.
   A house that is thin has somebody to buy, and can afford him. If either of those ever stops being
   true, ruin becomes unavoidable rather than chosen, and #247c becomes a real item.

   TWO ARMS, seeded, 10 houses x 320 weeks.

   1 · THERE IS ALWAYS SOMEBODY ON THE BLOCK. Measured 0% of 5,607 thin weeks with an empty market.
   2 · AND THE HOUSE CAN AFFORD HIM. Measured 3-4% of thin weeks unable to meet the cheapest price
       at any reserve. The bar is generous against both because they are floors under a mechanism,
       not a tuning target — what matters is that neither becomes the common case. */
import { found, clearAll, installRope } from "../harness.mjs";

const HOUSES = 10, WEEKS = 320, KEEP = 5;
const EMPTY_BAR = 0.05;   /* share of thin weeks with nothing on the block — measured 0.00 */
const BROKE_BAR = 0.15;   /* share unable to afford the cheapest man — measured 0.03-0.04 */

export const name = "thin";
export const describe = "a thin house always has somebody to buy and the coin to buy him";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"YARD-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([H, W, KEEP])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","activeG","rosterFull","weeklyBill","cellsCap","isGone"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    let thin = 0, empty = 0, broke = 0, full = 0, policy = 0, capped = 0, weeks = 0;
    const ends = {};
    for(let h=0; h<H; h++){
      const d = A.newGameState("Yc"+h, "clean", `YARDCHK-${h}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        weeks++;
        const fit = A.activeG(d).filter(g=>!g.injury).length;
        if(fit < KEEP){
          thin++;
          const block = (d.market || []).filter(x=>x && x.price != null);
          const cheapest = block.length ? Math.min(...block.map(x=>x.price)) : null;
          const spare = d.gold - Math.max(700, A.weeklyBill(d) * 12);
          if(A.cellsCap(d) < KEEP) capped++;
          if(A.rosterFull(d)) full++;
          else if(!block.length) empty++;
          else if(d.gold < cheapest) broke++;
          else if(cheapest > spare * 0.5) policy++;
        }
        try { R.lanista(d); } catch(e){ break; }
      }
      const k = d.over ? d.over.kind : "survived";
      ends[k] = (ends[k] || 0) + 1;
    }
    return { thin, empty, broke, full, policy, capped, weeks, ends };
  }, [HOUSES, WEEKS, KEEP]);

  if(r.why) return { pass:false, why:r.why, lines };
  if(!r.thin) return { pass:false, why:`no house was ever thin in ${r.weeks} weeks — nothing was measured`, lines };

  const pc = v => `${(100 * v / r.thin).toFixed(1)}%`;
  lines.push(`${r.weeks} house-weeks, ${r.thin} of them thin (under ${KEEP} fit men) — `
    + Object.entries(r.ends).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · "));
  lines.push(`  why nobody was bought: cells full ${pc(r.full)} · block empty ${pc(r.empty)} · `
    + `the reserve rule ${pc(r.policy)} · truly broke ${pc(r.broke)}`);
  lines.push(`  (and the cells were capped under ${KEEP} on ${pc(r.capped)} of them — \`CELLS_BY_RANK\` `
    + `starts at 8, so that is an edict and not the rank)`);

  if(r.empty / r.thin > EMPTY_BAR)
    bad.push(`a thin house found nothing at all on the block on ${pc(r.empty)} of those weeks `
      + `[bar ${Math.round(EMPTY_BAR*100)}%, measured 0.0% over 5,607 weeks]. #247c's finding is that `
      + `the yard emptying is never FORCED — there is always somebody to buy and the coin to buy him, `
      + `so ruin is a choice the player made. An empty block makes it unavoidable instead`);
  if(r.broke / r.thin > BROKE_BAR)
    bad.push(`a thin house could not afford the cheapest man on the block on ${pc(r.broke)} of those `
      + `weeks [bar ${Math.round(BROKE_BAR*100)}%, measured 3-4%] — the same finding from the other `
      + `side: if the men on the block are out of reach of a house that needs one, the yard empties `
      + `whatever the player does`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`a thin house is never out of men to buy, nor out of coin to buy one`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
