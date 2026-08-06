/* Can a new house still get off the ground? Three of them, twenty-six weeks each,
   taking whatever the arena offers. The oldest check there is, and the one that has
   caught the most: an economy change that quietly bankrupted every opening, a modal
   that trapped the week, a crash on the first death.

   It was five houses and thirty weeks and it took twelve minutes and outlived its
   own browser. Three and twenty-six sees the same things — the first winter, the
   first deaths, the first hard week — in a third of the time. If it needs to be
   longer, raise WEEKS rather than HOUSES; the weeks are where the game changes. */

import { found, endWeek, clearAll, tab, click, slot, waitSaved } from "../harness.mjs";

export const name = "survive";
export const describe = "three new houses live twenty-six weeks";

const HOUSES = 3;    /* enough to see a pattern; five took twelve minutes and outlived its browser */
const WEEKS  = 26;   /* past the first winter, the first deaths, the first hard week */

export async function run({ p, errors }){
  const lines = [], runs = [];
  for(let r=0; r<HOUSES; r++){
    try {
      await found(p);
      for(let w=0; w<WEEKS; w++){
        /* take a bout if one is going */
        await tab(p, "arena"); await p.waitForTimeout(170);
        if(await click(p, /choose a bout/i)){
          await p.waitForTimeout(260);
          await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")]
            .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
            const bs=w?[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled):[];
            if(bs.length) bs[0].click(); });
          await p.waitForTimeout(240);
        }
        await clearAll(p);
        if(!(await endWeek(p))) break;
        await clearAll(p);
        const d = await slot(p);
        if(!d || d.over) break;
      }
      await waitSaved(p);
      const d = await slot(p);
      /* "men" must mean in the yard, not fit this week — a house whose whole roster is
         mending reads as empty otherwise, and that is the difference between a house
         having a bad month and a house being over. */
      runs.push(!d ? null : { week:d.week, gold:d.gold, fame:Math.round(d.fame),
        yard:(d.gladiators||[]).filter(g=>g.status!=="dead" && g.status!=="gone" && g.status!=="freed").length,
        fit:(d.gladiators||[]).filter(g=>g.status==="active").length,
        bouts:(d.book&&d.book.n)||0, over:d.over ? (d.over.kind||"ended") : null });
    } catch(e){
      /* a house that takes the browser down with it is a finding, not a lost run */
      lines.push(`house ${r+1} could not be played to the end: ${e.message.split("\n")[0]}`);
      runs.push(null);
    }
  }
  const live = runs.filter(Boolean);
  for(const x of live)
    lines.push(`week ${String(x.week).padStart(2)} · gold ${String(x.gold).padStart(6)} · fame ${String(x.fame).padStart(4)} · ${x.yard} in the yard (${x.fit} fit) · ${x.bouts} bouts${x.over?` · ENDED: ${x.over}`:""}`);
  const standing = live.filter(x=>!x.over).length;
  lines.push(`${standing} of ${live.length} houses still standing after ${WEEKS} weeks`);
  return {
    pass: live.length === HOUSES && standing >= 2 && errors.length === 0,
    why: live.length < HOUSES ? `${HOUSES - live.length} of ${HOUSES} houses produced no save at all`
       : standing < 2 ? `only ${standing} of ${HOUSES} houses survived ${WEEKS} weeks`
       : errors.length ? `${errors.length} page errors: ${errors.slice(0,2).join(" | ")}` : null,
    lines,
  };
}
