/* #211 — WHAT THE PLAYER IS ACTUALLY SHOWN, and whether anything urgent is ever hidden

   #211 restated #145's finding: "the shown block stays ~4.6 slots and 75% of what fills it is
   chosen for being NEW against 3% for being urgent", and recommended that urgency outrank novelty
   in the late game. That describes `agendaTop`:

       const agendaTop = list => list.filter(a => a.urgency >= 3 || a.age <= AG_FRESH);

   AND `agendaTop` HAS NO CALL SITES IN THE GAME. Nor does `agWord`, nor `agAge`, and
   `agendaRanked` — the age-aware sort — is called only by the suite. Counted in source:
   `agendaTop` six mentions, zero calls. The novelty layer is an instrument the checks reason with;
   no player has ever met it.

   WHAT THE PLAYER MEETS:
     · the LUDUS PANEL — `agenda(S)`, which ends `A.sort((a,b) => b.urgency - a.urgency)`, dropped
       of the men's rows and cut to `.slice(0, 7)`. The seven most urgent, and no age term anywhere.
     · the MORNING REPORT — every row of `AGN`, grouped into urgency 3 / 2 / 1 and sorted by when.
       No cap, no filter. The report bar badges the FULL count.

   So urgency already outranks novelty, and the late game shows more rather than the same.

   WHICH LEAVES ONE LIVE QUESTION, and it is the only place #211's fear could still bite: the
   panel's `slice(0, 7)`. The list is urgency-sorted, so an urgency-3 row can only fall off the end
   if a house holds MORE THAN SEVEN of them at once. This measures how often that happens, by era —
   and separately how the demand actually grows, which is the half of #145 that may still hold.

     node test/probes/attend.mjs 16 420 */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["agenda","newGameState"].filter(k=>A[k]==null);
  if(miss.length) return { miss };
  const PANEL = 7;
  const era = [0,1,2,3].map(()=>({ weeks:0, items:0, u3:0, u2:0, u1:0, house:0, over:0, hidden:0 }));
  const sum = { houses:H, weeks:0, everOver:0, everHidden:0, worstHouse:0, topCalls:0 };

  for(let h=0; h<H; h++){
    const d = A.newGameState("ATTEND-"+h);
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d); } catch(e){ break; }
      sum.weeks++;
      const e = Math.min(3, Math.floor(w/(W/4)));
      const all = A.agenda(d) || [];
      const house = all.filter(a=>a.tab!=="men");     /* what the ludus panel is given */
      const E = era[e];
      E.weeks++; E.items += all.length; E.house += house.length;
      E.u3 += all.filter(a=>a.urgency>=3).length;
      E.u2 += all.filter(a=>a.urgency===2).length;
      E.u1 += all.filter(a=>a.urgency<=1).length;
      if(house.length > PANEL){ E.over++; sum.everOver++; }
      /* an urgent row that falls off the end of the panel — the only way the cap can bite */
      const shown = house.slice(0, PANEL);
      const cutUrgent = house.slice(PANEL).filter(a=>a.urgency>=3).length;
      if(cutUrgent){ E.hidden += cutUrgent; sum.everHidden++; }
      sum.worstHouse = Math.max(sum.worstHouse, house.length);
      /* and confirm the sort the panel relies on actually holds */
      for(let i=1;i<all.length;i++) if(all[i].urgency > all[i-1].urgency) sum.unsorted = (sum.unsorted||0)+1;
    }
  }
  for(const E of era){
    E.perWeek  = E.weeks ? +(E.items/E.weeks).toFixed(2) : null;
    E.housePer = E.weeks ? +(E.house/E.weeks).toFixed(2) : null;
    E.u3per    = E.weeks ? +(E.u3/E.weeks).toFixed(2) : null;
    E.u2per    = E.weeks ? +(E.u2/E.weeks).toFixed(2) : null;
    E.overPc   = E.weeks ? +(E.over/E.weeks*100).toFixed(1) : null;
  }
  return { era, ...sum };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.weeks} weeks over ${out.houses} houses · the panel shows 7\n`);
  console.log("  era   items/wk   house rows/wk   urg3/wk   urg2/wk   weeks over 7   urgent rows hidden");
  out.era.forEach((E,i)=>console.log(
    `   ${i}    ${String(E.perWeek).padStart(7)}   ${String(E.housePer).padStart(13)}   ${String(E.u3per).padStart(7)}   ${String(E.u2per).padStart(7)}   ${String(E.overPc+"%").padStart(12)}   ${String(E.hidden).padStart(18)}`));
  console.log(`\n  most house rows ever held at once: ${out.worstHouse}`);
  console.log(`  weeks an urgent row fell off the panel: ${out.everHidden}`);
  console.log(`  agenda() rows found out of urgency order: ${out.unsorted||0}`);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
