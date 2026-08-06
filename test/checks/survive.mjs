/* Can a new house still get off the ground? Five of them, thirty weeks each,
   taking whatever the arena offers. The oldest check there is, and the one that
   has caught the most: an economy change that quietly bankrupted every opening,
   a modal that trapped the week, a crash on the first death. */

import { found, endWeek, clearAll, tab, click, slot, waitSaved } from "../harness.mjs";

export const name = "survive";
export const describe = "five new houses live thirty weeks";

export async function run({ p, errors }){
  const lines = [], runs = [];
  for(let r=0; r<5; r++){
    await found(p);
    for(let w=0; w<30; w++){
      /* take a bout if one is going */
      await tab(p, "arena"); await p.waitForTimeout(180);
      if(await click(p, /choose a bout/i)){
        await p.waitForTimeout(280);
        await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")]
          .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
          const bs=w?[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled):[];
          if(bs.length) bs[0].click(); });
        await p.waitForTimeout(260);
        await clearAll(p);
      }
      await clearAll(p);
      if(!(await endWeek(p))) break;
      await clearAll(p);
      const d = await slot(p);
      if(!d || d.over) break;
    }
    await waitSaved(p);
    const d = await slot(p);
    if(!d){ runs.push(null); continue; }
    runs.push({ week:d.week, gold:d.gold, fame:Math.round(d.fame),
      men:(d.gladiators||[]).filter(g=>g.status==="active").length,
      bouts:(d.book&&d.book.n)||0, over:d.over ? (d.over.kind||"ended") : null });
  }
  const live = runs.filter(Boolean);
  for(const x of live)
    lines.push(`week ${String(x.week).padStart(2)} · gold ${String(x.gold).padStart(6)} · fame ${String(x.fame).padStart(4)} · ${x.men} men · ${x.bouts} bouts${x.over?` · ENDED: ${x.over}`:""}`);
  const standing = live.filter(x=>!x.over).length;
  lines.push(`${standing} of ${live.length} houses still standing`);
  return {
    pass: live.length === 5 && standing >= 3 && errors.length === 0,
    why: live.length < 5 ? "a house produced no save at all"
       : standing < 3 ? `only ${standing} of 5 houses survived thirty weeks`
       : errors.length ? `${errors.length} page errors` : null,
    lines,
  };
}
