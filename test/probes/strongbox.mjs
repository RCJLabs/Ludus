/* IS THE LATE GAME A TREADMILL, OR IS IT A PLACE ALMOST NOBODY ARRIVES AT?

   Two findings from this session point at one another and neither of them settles the question.

     #207 measured the ledger and concluded the late game is a TREADMILL: median weekly net
     -23/-58/-68/-126 by era, median gold flat at about 4,000 from year four onward, and the
     house that survives coasts with nothing pressing it.

     #241 measured the late-game SINK and found it unreachable: the five WORKS cost 42,500 between
     them, `monuReady` gates the monument tier behind finishing all five, and the tier then asks
     30,000 to 150,000 more. Across 96 campaign runs the four monuments were finished 1 colossus,
     1 endow, 0 arena, 0 capua — and `capua`, which the source calls "the last sentence in the
     book", has never been built by anything at all.

   Those two look like the same fact, and the recommendation that follows from them is opposite
   depending on which way round it is. Because the thing #241 also found, and did not chase, is that
   **15 of 16 houses DIED in every arm it ran**, at a median last week of 194 to 264. So:

     if a house that SURVIVES still cannot afford the ladder, the prices are wrong and the late
     game is the treadmill #207 named;

     if a survivor accumulates perfectly well and the tier is simply behind a 94% mortality rate,
     the prices are right and the fault is that almost nobody gets there — a completely different
     item, and retuning four prices would be fixing the wrong end of it.

   EVERYTHING HERE IS CONDITIONED ON SURVIVAL. A population median over a population that is 94%
   dead is a statement about dying, not about the late game, and reading one as the other is how
   these two findings came to disagree.

     1 · WHO SURVIVES, and to when. Alive at year 10, 15, 20, 29 — and what kills the rest.
     2 · WHAT A SURVIVOR EARNS. The week-to-week change in the box, by era, for houses still
         standing — and the fixed bill underneath it, so "it earns nothing" and "it earns well and
         something eats it" can be told apart.
     3 · WHETHER A SURVIVOR COULD EVER PAY. Peak gold against the 42,500 the works cost and the
         86,500 the cheapest interesting monument sits behind, counted only over survivors.
     4 · AND WHAT THE LADDER WOULD COST IN TIME at the rate a survivor actually banks.

   WHAT IT ANSWERED — four seeds x three arms x 16 houses = 192 campaigns of up to 520 weeks.
   **The hypothesis this was written to test is refuted: it is not mortality, it is income.**

     1 · ABOUT 10% SURVIVE to week 520 (19 of 192). The rest die of debt, rebellion and ruin, at a
         median last week of 79 to 249 depending on arm and seed.
     2 · THE MATURE WEEK LOSES MONEY IN EVERY ARM OF EVERY SEED. Nine arm-medians for the weekly
         change in the box over weeks 271-520, conditioned on survival:
             -172 · -100 · -84 · -72 · -65 · -61 · -48 · -45 · -14
         Not one is positive. #207's "treadmill" is confirmed, and confirmed for the houses that
         LIVE — which is the part that had never been separated out.
     3 · AND A SURVIVOR STILL CANNOT AFFORD THE LADDER. Peak gold of all 19 survivors, sorted:
             14776 15110 15274 15488 15596 17143 18079 18106 18509 19836
             20430 21015 21471 22199 22483 24548 26921 | 79949 92365
         Seventeen of nineteen peak between 14,776 and 26,921 — against 42,500 for the five works
         and 72,500 for the cheapest monument. So the tier is not merely hidden behind mortality;
         the price is wrong against the economy that reaches it.
     4 · AND THE GATE IS NOT WHAT STOPS THEM. In seed D, 3 of 3 surviving BUILDERS finished all five
         works (5/5/5) and built ZERO monuments. They cleared 42,500 over two decades and had
         nothing left for the 30,000 that comes next.

   THE TWO OUTLIERS, AND THE STORY THEY NEARLY BOUGHT. Two saver houses peaked at 79,949 and 92,365
   — one holding a MEDIAN of 70,734 across weeks 181-270 — and both then drained back to about 4,000
   by week 520. On the first two seeds that looked like a finding: the ladder is affordable exactly
   once, at a peak around year 15, and nothing tells the player the window is open. Seeds C and D
   refused it. Their best saver survivor peaked at 26,921 and the other saver arm produced no
   survivor at all. Two houses in nineteen is an outlier, not a window, and it is written down here
   as an outlier because it was very nearly written up as a mechanic.

   (Loans cannot explain the two: `LENDERS` caps at 900-2,400 denarii, and seed B's figure is a
   MEDIAN over ninety weeks rather than a spike.)

   Run: node test/probes/strongbox.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 520);
const SEED = process.argv[4] || "LATE";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const ERAS = [[1,90],[91,180],[181,270],[271,360],[361,520]];

  const arm = (label, opts) => {
    const rows = [];
    for(let h=0; h<H; h++){
      const d = A.newGameState("Lt"+h, "capua", `${SEED}-${h}`);
      const row = { h, weeks:0, over:null, end:0, peak:0, works:0, monu:0, ready:null,
        gold:{}, net:{}, bill:{}, trail:[] };
      let prev = d.gold || 0;
      for(let w=0; w<W && !d.over; w++){
        try { R.lanista(d, opts); } catch(e){ break; }
        row.weeks++;
        const g = d.gold || 0;
        row.peak = Math.max(row.peak, g);
        /* the week's change in the box IS the net of everything — purses in, bill and every
           purchase out. Under the reference player that includes discretionary spend, which is
           why the fixed bill is carried alongside it rather than inferred from it. */
        const dlt = g - prev; prev = g;
        const era = ERAS.findIndex(([a,b])=>d.week>=a && d.week<=b);
        if(era >= 0){
          (row.net[era] = row.net[era] || []).push(dlt);
          (row.gold[era] = row.gold[era] || []).push(g);
          (row.bill[era] = row.bill[era] || []).push(A.weeklyBill(d));
        }
        if(row.ready == null && A.monuReady(d)) row.ready = d.week;
      }
      row.over = d.over ? (d.over.kind || "over") : null;
      row.end = d.week;
      row.works = A.WORK_KEYS.filter(k=>A.workDone(d,k)).length;
      row.monu  = A.MONU_KEYS.filter(k=>A.workDone(d,k)).length;
      rows.push(row);
    }
    return { label, rows };
  };

  return {
    /* THREE ARMS, and the third is what separates "it earns nothing" from "it earns well and
       something eats it". `saver` runs the house exactly as the reference does — it buys men, keeps
       a doctore, keeps its staff, because a house that stops doing those stops earning — and simply
       declines the two discretionary sinks, the rooms and the school. If a saver banks and the
       reference does not, the late game is a spending problem. If neither banks, the income does
       not cover the bill and the treadmill is real. */
    arms: [ arm("reference", {}), arm("saver", { build:false, school:false }),
            arm("builder", { works:true }) ],
    eras: ERAS,
    prices: { works: A.WORK_KEYS.reduce((n,k)=>n+A.workDef(k).cost,0),
      monu: A.MONU_KEYS.map(k=>({ k, cost:A.workDef(k).cost })) },
  };
}, [H, W, SEED]);

const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y);
  return v.length ? Math.round(v[Math.floor(v.length/2)]) : null; };
const pc = (a,b) => b ? `${(100*a/b).toFixed(0)}%` : "-";
const flat = (rows, field, era) => rows.flatMap(r=>r[field][era]||[]);

console.log(`\n  the ladder: five works ${out.prices.works}d · ${out.prices.monu.map(m=>`${m.k} ${m.cost}d`).join(" · ")}`);
console.log(`  so the cheapest monument sits ${out.prices.works + out.prices.monu[0].cost}d deep, and endow ${out.prices.works + 44000}d`);

for(const A2 of out.arms){
  const R2 = A2.rows, n = R2.length;
  const alive = wk => R2.filter(r=>r.end >= wk && !r.over);
  console.log(`\n########  ARM: ${A2.label}  (${n} houses x up to ${W} weeks)  ########`);
  console.log(`\n=== 1. WHO SURVIVES ===`);
  for(const [y,wk] of [[5,90],[10,180],[15,270],[20,360],[29,520]])
    console.log(`  lived to year ${String(y).padStart(2)} (week ${String(wk).padStart(3)}): `
      + `${String(R2.filter(r=>r.end>=wk).length).padStart(2)} of ${n} (${pc(R2.filter(r=>r.end>=wk).length,n)})`);
  const dead = R2.filter(r=>r.over);
  console.log(`  died: ${dead.length} of ${n} · median last week ${med(dead.map(r=>r.end))}`);
  const how = {}; for(const r of dead) how[r.over] = (how[r.over]||0)+1;
  console.log(`  of what: ${Object.entries(how).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "-"}`);

  /* THE SURVIVORS, and only them */
  const surv = R2.filter(r=>!r.over);
  console.log(`\n=== 2. WHAT A SURVIVOR EARNS (${surv.length} house${surv.length===1?"":"s"} still standing at ${W}) ===`);
  if(!surv.length) console.log(`  none survived — every figure below would be a statement about dying`);
  else {
    console.log(`  era          median gold   median weekly net   median fixed bill`);
    out.eras.forEach(([a,b], i)=>{
      const g = flat(surv,"gold",i), nt = flat(surv,"net",i), bl = flat(surv,"bill",i);
      if(!g.length) return;
      console.log(`  w${String(a).padStart(3)}-${String(b).padStart(3)}   ${String(med(g)).padStart(11)}   ${String(med(nt)).padStart(17)}   ${String(med(bl)).padStart(17)}`);
    });
    console.log(`  peak gold, survivors only: ${surv.map(r=>r.peak).sort((x,y)=>x-y).join(" · ")}`);
    console.log(`  reached monuReady: ${surv.filter(r=>r.ready).length} of ${surv.length}`
      + ` · works finished ${surv.map(r=>r.works).join("/")} of 5 · monuments ${surv.map(r=>r.monu).join("/")} of 4`);
  }
  /* and the same numbers over EVERYBODY, which is what a population median hides */
  console.log(`\n  (the whole population, for contrast — 94% of it is dying)`);
  out.eras.forEach(([a,b], i)=>{
    const g = flat(R2,"gold",i), nt = flat(R2,"net",i);
    if(!g.length) return;
    console.log(`  w${String(a).padStart(3)}-${String(b).padStart(3)}   ${String(med(g)).padStart(11)}   ${String(med(nt)).padStart(17)}`);
  });

  console.log(`\n=== 3 + 4. COULD A SURVIVOR EVER PAY? ===`);
  if(surv.length){
    const late = surv.flatMap(r=>[...(r.net[3]||[]), ...(r.net[4]||[])]);
    const rate = med(late);
    const need = out.prices.works + out.prices.monu[0].cost;
    /* a short run has no late era at all, and "NEVER" on a null is a verdict the data did not give */
    console.log(`  a mature survivor banks a median ${rate == null ? "(no late era in this run)" : `${rate} a week`}`);
    console.log(`  the cheapest monument is ${need}d deep from nothing`);
    if(rate != null)
      console.log(`    at that rate: ${rate > 0 ? `${Math.round(need/rate)} weeks — ${(need/rate/18).toFixed(0)} years of banking every denarius` : `NEVER — the median week loses money`}`);
    console.log(`  and peak gold ever reached by a survivor: ${Math.max(...surv.map(r=>r.peak))} against ${need} needed`);
  }
}
console.log("");

await browser.close(); server.close();
