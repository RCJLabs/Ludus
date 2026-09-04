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

   WHAT IT ANSWERED — four seeds x three arms x 16 houses = 192 campaigns of up to 520 weeks,
   everything conditioned on survival. The answer moved twice under its own instruments.

     1 · ABOUT 10% SURVIVE to week 520 (19 of 192), dying of debt, rebellion and ruin at a median
         last week of 79 to 249.

     2 · THE MATURE HOUSE IS AT EQUILIBRIUM, NOT BLEEDING — and the first reading of this probe got
         that backwards. Quoting the MEDIAN week, the late net is -14 to -172 in every arm of every
         seed, which reads as a steady bleed. It is not: purse income is spiky, the median week wins
         nothing at all, and the mean is what decides whether the box fills (the mean of the weekly
         change over a window IS gold-at-the-end minus gold-at-the-start over weeks). By the mean,
         the late net across the four seeds is **-47, +58, -10, +17, +23, -29, +24, -15** — hovering
         at zero. A treadmill in the exact sense #207 named, and not a decline.

     3 · THE SAND STOPS PAYING THE BILL, and this is the term. Bouts fought per week is FLAT at
         0.74-0.94 for a house's whole life. What collapses is how often it wins: the share of weeks
         carrying a winning purse falls from 54%/31% in the first era to 6-20% in the last, while
         the fixed bill goes 156 -> 505 and 73 -> 530. Arena income late runs about 360 a week
         against a bill of 505-735, and the gap is filled by the RESIDUAL (+268 to +580) — patrons,
         merch, the brand, sales. The core loop of the game covers roughly two thirds of the house's
         costs by year 15 and the rest comes from everywhere else.

     4 · AND A SURVIVOR STILL CANNOT AFFORD THE LADDER. Peak gold of all 19 survivors:
             14776 15110 15274 15488 15596 17143 18079 18106 18509 19836
             20430 21015 21471 22199 22483 24548 26921 | 79949 92365
         Seventeen of nineteen peak between 14,776 and 26,921 — against 42,500 for the five works
         and 72,500 for the cheapest monument. In seed D, 3 of 3 surviving builders finished ALL
         FIVE works and built ZERO monuments: they cleared 42,500 over two decades and had nothing
         for the 30,000 that comes next. `monuReady` works exactly as designed; there is no money on
         the other side of it.

   SO THE CONCLUSION FLIPPED. The obvious reading of (3) is that late income is broken and should be
   raised. It is not broken: the appearance fee is paid on EVERY bout, win or lose (`d.gold += t.app`
   before the branch), and it scales 10 -> 30 -> 60 -> 150 -> 400 across the tiers. A falling win
   rate against a rising bill is what #207 asked for in as many words — "a famous house should be
   BILLED like one" — and the house it produces sits at equilibrium rather than dying. The income
   curve is doing its job. What is inconsistent is the LADDER ABOVE IT: the monuments assume a house
   that accumulates, and the economy is designed for one that does not.

   TWO THINGS THIS PROBE NEARLY PUBLISHED, both caught by checking rather than by reasoning:
     · "the ladder is affordable exactly once, at a peak around year 15, and nothing signals the
       window" — built on two saver houses that peaked at 79,949 and 92,365 on the first two seeds.
       Seeds C and D refused it; their best saver survivor peaked at 26,921. Two in nineteen is an
       outlier. (Loans cannot explain them either: `LENDERS` caps at 900-2,400.)
     · "the appearance fee the defeat line promises does not exist" — it does, and it is paid
       unconditionally twenty lines above the branch that names it.

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
        gold:{}, net:{}, bill:{}, purse:{}, resid:{}, fame:{}, men:{}, bouts:{}, won:{}, trail:[] };
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
          /* THE THREE-WAY SPLIT. `d.after` is last week's ledger — `afterWeek` moves `d.mark` into
             it and starts a fresh one — and `purse` there is what the house WON (weekMark fires on
             the win branch), which is the dominant income term. `weeklyBill` is the fixed outflow
             exactly. What is left over is everything else in and out: other income against every
             discretionary purchase. Three terms, none of them inferred from the other two. */
          const bill = A.weeklyBill(d);
          const won = (d.after && d.after.purse) || 0;
          (row.net[era]   = row.net[era]   || []).push(dlt);
          (row.gold[era]  = row.gold[era]  || []).push(g);
          (row.bill[era]  = row.bill[era]  || []).push(bill);
          (row.purse[era] = row.purse[era] || []).push(won);
          (row.resid[era] = row.resid[era] || []).push(dlt - won + bill);
          (row.fame[era]  = row.fame[era]  || []).push(Math.round(d.fame||0));
          (row.men[era]   = row.men[era]   || []).push(A.activeG(d).length);
          /* AND WHETHER FLAT PURSE INCOME IS A FLAT PURSE OR A FALLING WIN RATE. `d.after.purse`
             is winnings only, so the two are indistinguishable in it — and they need opposite
             fixes. `bouts` is every bout fought that week, won or not. */
          (row.bouts[era] = row.bouts[era] || []).push((d.after && d.after.bouts) || 0);
          (row.won[era]   = row.won[era]   || []).push(won > 0 ? 1 : 0);
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
/* MEAN FOR THE FLOWS, MEDIAN FOR THE STOCKS, and both for the net. Purse income is spiky — a house
   wins on some weeks and not others — so the MEDIAN week's purse is 0 and the median week's net is
   negative even in a house that is getting richer. Only the mean decides whether the box fills: the
   mean of the weekly change over a window IS (gold at the end - gold at the start) / weeks. The
   first reading of this probe quoted the median and called the late game a bleed on that basis. */
const mean = a => { const v=[...a].filter(x=>x!=null);
  return v.length ? Math.round(v.reduce((s,x)=>s+x,0)/v.length) : null; };
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
    console.log(`  era        gold~   NET(mean)  net(med)   purses  bill  residual    fame  men  bouts/wk  paidwk  d/bout`);
    out.eras.forEach(([a,b], i)=>{
      const g = flat(surv,"gold",i);
      if(!g.length) return;
      const m = (f,w) => String(mean(flat(surv,f,i))).padStart(w);
      console.log(`  w${String(a).padStart(3)}-${String(b).padStart(3)} ${String(med(g)).padStart(7)}`
        + `${m("net",11)}${String(med(flat(surv,"net",i))).padStart(10)}`
        + `${m("purse",9)}${m("bill",6)}${m("resid",10)}`
        + `${String(med(flat(surv,"fame",i))).padStart(8)}${String(med(flat(surv,"men",i))).padStart(5)}`
        + `${(flat(surv,"bouts",i).reduce((s2,x)=>s2+x,0)/Math.max(1,flat(surv,"bouts",i).length)).toFixed(2).padStart(10)}`
        + `${(100*flat(surv,"won",i).reduce((s2,x)=>s2+x,0)/Math.max(1,flat(surv,"won",i).length)).toFixed(0).padStart(7)}%`
        + `${String(Math.round(flat(surv,"purse",i).reduce((s2,x)=>s2+x,0) / Math.max(1, flat(surv,"bouts",i).reduce((s2,x)=>s2+x,0)))).padStart(8)}`);
    });
    console.log(`    all flows are MEANS except net(med) — purse is spiky, so the median week wins nothing`);
    console.log(`    net = purses - bill + residual · residual is every other income against every purchase`);
    console.log(`  peak gold, survivors only: ${surv.map(r=>r.peak).sort((x,y)=>x-y).join(" · ")}`);
    console.log(`  reached monuReady: ${surv.filter(r=>r.ready).length} of ${surv.length}`
      + ` · works finished ${surv.map(r=>r.works).join("/")} of 5 · monuments ${surv.map(r=>r.monu).join("/")} of 4`);
  }
  /* and the same numbers over EVERYBODY, which is what a population median hides */
  console.log(`\n  (the whole population, for contrast — 94% of it is dying)`);
  out.eras.forEach(([a,b], i)=>{
    const g = flat(R2,"gold",i), nt = flat(R2,"net",i);
    if(!g.length) return;
    console.log(`  w${String(a).padStart(3)}-${String(b).padStart(3)} ${String(med(g)).padStart(7)}${String(mean(nt)).padStart(11)}${String(med(nt)).padStart(10)}`);
  });

  console.log(`\n=== 3 + 4. COULD A SURVIVOR EVER PAY? ===`);
  if(surv.length){
    const late = surv.flatMap(r=>[...(r.net[3]||[]), ...(r.net[4]||[])]);
    const rate = mean(late);
    const need = out.prices.works + out.prices.monu[0].cost;
    /* a short run has no late era at all, and "NEVER" on a null is a verdict the data did not give */
    console.log(`  a mature survivor banks a MEAN ${rate == null ? "(no late era in this run)" : `${rate} a week`} (median week: ${med(late)})`);
    console.log(`  the cheapest monument is ${need}d deep from nothing`);
    if(rate != null)
      console.log(`    at that rate: ${rate > 0 ? `${Math.round(need/rate)} weeks — ${(need/rate/18).toFixed(0)} years of banking every denarius` : `NEVER — the median week loses money`}`);
    console.log(`  and peak gold ever reached by a survivor: ${Math.max(...surv.map(r=>r.peak))} against ${need} needed`);
  }
}
console.log("");

await browser.close(); server.close();
