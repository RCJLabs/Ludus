/* IS THERE A LIFE OUTSIDE THE WALL TO BUILD ON? — #239's three verify-first questions

   `ASKS.woman` is the only place in the file that admits a gladiator has a life past the gate, and
   winning it sets `g.flags = 1` — a field nothing ever reads again except the ask's own re-fire
   gate. The item wants that flag to become an object with a body: a partner, a child, a poach
   lever, a death line. It names three things to measure first, and the third turns out to decide
   the shape of the whole item.

   (1) HOW OFTEN IS HE EVEN ASKED. `askWeek` fires on 6% of weeks, picks ONE man, and marks him in
       `d.flags.asked` — so every man in the house gets at most ONE ask in his whole life, about
       anything. `woman` is the lowest-weighted of the five that compete for it (w:6 against
       brother 10, match 9, year 8, burial 7). Content depth has to be designed against the real
       number, not the hoped-for one.

   (2) WOULD A CHILD EVER GROW UP IN TIME. Phase 3 wants a grown child to walk in at the gate, the
       way `kinWeek` brings a dead man's kin. That needs the man's thread to outlive the years a
       child takes to reach draft age. So: from the week he'd pass the ask's gate, how many more
       weeks does he actually last?

   (3) AND CAN A MAN WITH A FAMILY EVER BE POACHED. Phase 4 is the item's own guardrail — the
       family must be a LIABILITY or the object is just a bigger free grant than the flag was.
       Its lever is `poachTarget`, which takes `g.defiance >= 45 && !regardLoyal(g)`, and
       `regardLoyal` is `regardOf(g) >= 70`. The ask needs `regardOf(g) >= 55` and its `yes` pays
       **+18 regard**. So the reward for saying yes may push the man straight past 70 and out of
       every poach pool in the game — which would mean the guardrail cannot be built on the lever
       the item picked. This counts the overlap before and after.

   WHAT IT ANSWERED, and what shipped on the back of it (16 houses x 400 weeks, 2,672 played weeks,
   seed OUT-A). All three questions refused the phase they were testing:

     (1) 33 asks of any kind — one every 81 weeks, 7.4% of the 447 men who ever stood in the cells.
         Asks fired, by kind: burial 12, brother 10, match 9, WOMAN 1. One in 2,672 weeks.
     (2) weeks a man lasts after first passing the woman gate: p25 5, median 17, p75 36, max 55 —
         against the ~250 a child would need. Phase 3 misses by a factor of fifteen.
     (3) of the 33 men at the moment they passed the gate, 5 (15.2%) were already poachable, and the
         ask's own +18 regard puts 33 of 33 (100.0%) at or past `regardLoyal`'s 70. The grant makes a
         man PERMANENTLY UNPOACHABLE, so phase 4's guardrail cannot be built on `poachTarget`.

   v3.193.0 shipped phases 1 and 5 only: `g.family = { name, since }` in place of `g.flags = 1` at
   identical numbers, both answers routed through `remember`, the name on his card, and the death
   line in `mournKin`. Phases 2-4 are refused on the numbers above. This probe still runs against
   that build — it reconstructs the gate rather than reading `g.flags` — and stays the standing
   instrument for how often the one conversation about a life outside the wall is ever had.

   Run: node test/probes/outside.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 400);
const SEED = process.argv[4] || "OUT";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  let weeks = 0, asked = 0, womanFired = 0, everQualified = 0, menSeen = 0;
  const byKind = {};
  const tenure = [];        /* weeks a man lasts AFTER he first passes the woman gate */
  let overlapNow = 0, qualifiedNow = 0, wouldLoyal = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Ot"+h, "capua", `${SEED}-${h}`);
    const seen = new Set(), qualAt = new Map(), lastSeen = new Map();
    for(let w=0; w<W && !d.over; w++){
      const askedWas = (d.flags.asked||[]).length;
      const pend = d.pendingEvent;
      try { R.lanista(d, {}); } catch(e){ break; }
      weeks++;
      /* the ask fired this week if the marked list grew */
      if((d.flags.asked||[]).length > askedWas) asked++;
      /* and which one it was, read off the event the week put up */
      if(pend && pend.id === "ask" && pend.data && pend.data.k){
        byKind[pend.data.k] = (byKind[pend.data.k]||0) + 1;
        if(pend.data.k === "woman") womanFired++;
      }
      for(const g of (d.gladiators||[])){
        if(!seen.has(g.id)){ seen.add(g.id); menSeen++; }
        if(g.status === "active") lastSeen.set(g.id, d.week);
        /* the moment he would first pass the woman gate */
        if(!qualAt.has(g.id) && g.status === "active"
           && (g.wins||0) >= 6 && A.regardOf(g) >= 55){
          qualAt.set(g.id, d.week); everQualified++;
          qualifiedNow++;
          /* could he be poached AT that moment, and would the ask's own reward end that? */
          if((g.defiance||0) >= 45 && A.regardOf(g) < 70) overlapNow++;
          if(A.regardOf(g) + 18 >= 70) wouldLoyal++;
        }
      }
    }
    for(const [gid, at] of qualAt){
      const end = lastSeen.get(gid);
      if(end != null) tenure.push(end - at);
    }
  }
  return { weeks, asked, womanFired, everQualified, menSeen, byKind, tenure:tenure.sort((a,b)=>a-b),
    overlapNow, qualifiedNow, wouldLoyal, houses:H };
}, [H, W, SEED]);

const pc = (a,b) => b ? `${(100*a/b).toFixed(1)}%` : "-";
const q = (a,k) => a.length ? a[Math.min(a.length-1, Math.floor(a.length*k))] : 0;

console.log(`\n=== 1. HOW OFTEN IS HE ASKED AT ALL? (${out.houses} houses, ${out.weeks} played weeks) ===`);
console.log(`  ${out.asked} asks of any kind — one every ${(out.weeks/Math.max(1,out.asked)).toFixed(0)} weeks · ${pc(out.asked,out.menSeen)} of the ${out.menSeen} men who ever stood in the cells`);
console.log(`  by kind: ${Object.entries(out.byKind).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "none"}`);
console.log(`  THE WOMAN ASK SPECIFICALLY: ${out.womanFired} times — one every ${out.womanFired?(out.weeks/out.womanFired).toFixed(0):"∞"} weeks, ${(out.womanFired/out.houses).toFixed(1)} per house`);

console.log(`\n=== 2. WOULD A CHILD EVER GROW UP IN TIME? ===`);
console.log(`  ${out.everQualified} men ever passed the ask's own gate (6 wins, 55 regard)`);
console.log(`  weeks they lasted after that: p25 ${q(out.tenure,0.25)} · median ${q(out.tenure,0.5)} · p75 ${q(out.tenure,0.75)} · p90 ${q(out.tenure,0.9)} · max ${out.tenure[out.tenure.length-1]||0}`);
console.log(`    [a child would need roughly 14 YEARS — about 250 weeks at 18 weeks a year — to reach the gate]`);

console.log(`\n=== 3. CAN A MAN WITH A FAMILY EVER BE POACHED? ===`);
console.log(`  of the ${out.qualifiedNow} men at the moment they passed the gate:`);
console.log(`    already poachable (defiance >= 45 AND regard < 70): ${out.overlapNow} (${pc(out.overlapNow,out.qualifiedNow)})`);
console.log(`    and the ask's own +18 regard would put ${out.wouldLoyal} (${pc(out.wouldLoyal,out.qualifiedNow)}) at or past regardLoyal's 70`);
console.log("");
await browser.close(); server.close();
