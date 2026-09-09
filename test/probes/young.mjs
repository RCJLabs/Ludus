/* THE YOUNG HOUSE THAT TIPS — #247's last leftover, and whether it has an answer

   (`young` was free in BOTH directories; checked before writing, in checks and probes.)

   #247's own text left two things open. The locked floor was priced and declined at v3.246.0. This
   is the other: *"the young house's death at week 25-41, which is this item's original phase 2 under
   a different diagnosis"* — 76.9% coverable against a built house's 100%, dying short 271d with 676d
   to its name.

   WHAT IS ALREADY ANSWERED, so that this does not re-ask it:
     · Is being poor early the cause? NO — phase 1 measured the era-one dead as no poorer at week 8
       or 16 than the era-one living, and `probes/opening.mjs` put the discriminant at 54.0/52.7 on
       100 at week 8 (50 knows nothing), rising to 66.9/60.6 only by week 16.
     · Should there be an EARLIER ALARM? NO, closed v3.228.0: four candidate alarms scored 4.8-9.3%
       precision against the money row's 19.3%, and the row already reaches 78-88% of these deaths
       with nine weeks of lead. `checks/cliff.mjs` arm 6 guards it.
     · Would shedding the locked floor help? NO, v3.246.0 — and a bare house has no floor to shed.

   SO THE ONE QUESTION LEFT IS WHETHER THE DEATH IS ANSWERABLE AT ALL, which is the shape #247b used
   on the rising and answered yes ("completely answerable, at 101-131 denarii a week"). A signal is
   only worth having if there is something to do when you hear it, and the young house's whole
   problem is that it has nothing to sell.

   THE METHOD IS PAIRED POLICIES ON IDENTICAL SEEDS. The rope's own levers are the restraint: `buy`,
   `build`, `folk`, `staff` and `doctore` are every discretionary line a young house has, and turning
   them off is the most austere player the game admits. If the young deaths do not fall under that,
   they are not answerable by restraint and the item is about something other than spending.

   THE CAVEAT, and it cuts against restraint: a house that never buys a man also never gets a man who
   wins, and `probes/opening.mjs` put the discriminant on the MEN rather than the box. So a fall in
   young deaths under thrift is the weak result and no fall is the strong one.

     node test/probes/young.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 128), W = +(process.argv[3] || 120), SEED = process.argv[4] || "YOUNG";
const CUT = 60;
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED, CUT])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","activeG","weeklyBill","liquidate","runway","moneyRow","creditLine","gladValue"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p25:at(.25), p50:at(.5), p75:at(.75), p90:at(.9) }; };
  const pc = (v,n) => n ? Math.round(1000*v/n)/10 : 0;

  const ARMS = {
    ref:     { note:"the rope as it plays", o:{} },
    nobuy:   { note:"never buys a man", o:{ buy:false } },
    nobuild: { note:"never puts up a room", o:{ build:false } },
    thrift:  { note:"buys nothing at all — no men, rooms, folk, staff or doctore",
               o:{ buy:false, build:false, folk:false, staff:false, doctore:false } },
    /* A `solvent` arm stood here — the rope, but not buying while the money row is red. It came
       back BYTE-IDENTICAL to `ref`, because the rope already buys 0 men on a red week (below). The
       lever was taken out of the harness rather than left as a no-op; the arm is recorded here so
       the question is not asked a second time without the answer. */
  };

  const run = (seed, o) => {
    const d = A.newGameState("Yg", "clean", seed);
    let lastRed = null, everRed = false, firstRed = null;
    /* ---- AND WHAT THE HOUSE DID AFTER IT WAS TOLD ----
       The row reaches these houses. The question that separates "the game is hard" from "the
       reference player is careless" is whether anybody kept BUYING after hearing it. A man arriving
       is the roster growing; the coin is the gold the same week, which is the purchase plus the
       week's bill and purses, so it is reported as a direction rather than a price. */
    let arrivedAfterRed = 0, arrivals = 0, spentAfterRed = 0;
    /* ---- AND "TOOK ANOTHER" IS NOT "BOUGHT ONE" ----
       The first cut counted the roster growing, called it buying, and reported 69.2% of the young
       dead taking another man after the row spoke — a figure that was IDENTICAL under a lever built
       to stop the rope buying, which is what gave it away. A man arrives from `bargain`, from
       `auctoratus`, from a damnatio and from the block, and only the last of those is a purchase the
       rope chose. `did.bought` is the rope's own bump on `buyFromBlock`. */
    let bought = 0, boughtAfterRed = 0;
    /* ---- AND "AFTER THE ROW FIRST SPOKE" IS NOT "WHILE THE ROW IS SPEAKING" ----
       The second label fault in this same probe. The row goes red and quiet again; a purchase in a
       quiet week still counts as "after" the first red week, so 15.4% bought "after the row spoke"
       while a lever that stops buying ON a red week changed nothing at all — byte-identical arms,
       which is what gave it away for the second time. `boughtWhileRed` is the one the lever is
       about, and the one a solvent player would be judged on. */
    let boughtWhileRed = 0, redWeeks = 0;
    for(let w=0; w<W; w++){
      if(d.over) break;
      let row = null; try { row = A.moneyRow(d); } catch(e){}
      if(row){ everRed = true; if(firstRed == null) firstRed = d.week;
        lastRed = { week:d.week, gold:Math.round(d.gold), fund:Math.round(A.liquidate(d).total) }; }
      const redNow = !!row; if(redNow) redWeeks++;
      const n0 = d.gladiators.length, g0 = d.gold;
      let did = null;
      try { did = R.lanista(d, o); } catch(e){ break; }
      const b = (did && did.bought) || 0;
      if(b){ bought += b; if(firstRed != null) boughtAfterRed += b; if(redNow) boughtWhileRed += b; }
      if(d.gladiators.length > n0){ arrivals++;
        if(firstRed != null){ arrivedAfterRed++; if(d.gold < g0) spentAfterRed += Math.round(g0 - d.gold); } }
    }
    const kind = d.over ? d.over.kind : "alive";
    const men = A.activeG(d);
    return { kind, week:d.week, young: kind === "debt" && d.week <= CUT,
      men:men.length, gold:Math.round(d.gold), bill:A.weeklyBill(d),
      fund:Math.round(A.liquidate(d).total), line:Math.round(A.creditLine(d)),
      best: men.length ? Math.round(Math.max(...men.map(g=>A.gladValue(g)))) : 0,
      wins: d.gladiators.reduce((n,g)=>n+(g.wins||0), 0), everRed, lastRed,
      arrivals, arrivedAfterRed, spentAfterRed, firstRed, bought, boughtAfterRed, boughtWhileRed, redWeeks };
  };

  const out = {};
  for(const [name, arm] of Object.entries(ARMS)){
    const rows = [];
    for(let i=0;i<H;i++) rows.push(run(`${SEED}-${i}`, arm.o));
    const ends = {}; rows.forEach(r=>{ ends[r.kind] = (ends[r.kind]||0)+1; });
    const young = rows.filter(r=>r.young);
    const debt = rows.filter(r=>r.kind === "debt");
    out[name] = { note:arm.note, houses:H, ends,
      youngDebt:young.length, youngPct:pc(young.length, H),
      allDebt:debt.length, alive:rows.filter(r=>r.kind === "alive").length,
      diedAt:q(rows.filter(r=>r.kind !== "alive").map(r=>r.week)),
      youngAt:q(young.map(r=>r.week)),
      /* what the young dead have in their hands the week they die */
      youngMen:q(young.map(r=>r.men)), youngFund:q(young.map(r=>r.fund)),
      youngBill:q(young.map(r=>r.bill)), youngWins:q(young.map(r=>r.wins)),
      youngBest:q(young.map(r=>r.best)),
      youngHeardRow:pc(young.filter(r=>r.everRed).length, young.length),
      /* and what was on the table the last time the row spoke */
      youngFundAtRed:q(young.filter(r=>r.lastRed).map(r=>r.lastRed.fund)),
      youngShortAtRed:q(young.filter(r=>r.lastRed).map(r=>-r.lastRed.gold)),
      nothingToSell:pc(young.filter(r=>r.fund < 100).length, young.length),
      /* the one that separates a hard game from a careless player */
      youngFirstRed:q(young.filter(r=>r.firstRed!=null).map(r=>r.firstRed)),
      youngArrivals:q(young.map(r=>r.arrivals)),
      youngArrivedAfterRed:pc(young.filter(r=>r.arrivedAfterRed > 0).length, young.length),
      youngBought:q(young.map(r=>r.bought)),
      youngBoughtAfterRed:pc(young.filter(r=>r.boughtAfterRed > 0).length, young.length),
      youngBoughtN:q(young.map(r=>r.boughtAfterRed)),
      youngRedWeeks:q(young.map(r=>r.redWeeks)),
      youngBoughtWhileRed:pc(young.filter(r=>r.boughtWhileRed > 0).length, young.length),
      youngBoughtWhileRedN:q(young.map(r=>r.boughtWhileRed)),
      allBoughtWhileRed:rows.reduce((n,r)=>n+r.boughtWhileRed,0),
      youngMenAfterRed:q(young.map(r=>r.arrivedAfterRed)),
      youngSpentAfterRed:q(young.filter(r=>r.spentAfterRed>0).map(r=>r.spentAfterRed)),
    };
  }
  return out;
}, [H, W, SEED, CUT]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
const f = x => x ? `p10 ${x.p10} · p50 ${x.p50} · p90 ${x.p90}` : "—";
console.log(`#247's LAST LEFTOVER — the young house that tips, ${H} x ${W}, seed ${SEED}, young = debt by week ${CUT}\n`);
for(const [k,a] of Object.entries(out)){
  console.log(`== ${k.toUpperCase()} — ${a.note} ==`);
  console.log(`  endings: ${Object.entries(a.ends).map(([x,n])=>`${x} ${n}`).join(" · ")}`);
  console.log(`  YOUNG DEBT DEATHS ${a.youngDebt}/${a.houses} = ${a.youngPct}% · all debt ${a.allDebt} · alive at ${W} ${a.alive} · died at ${f(a.diedAt)}`);
  console.log(`  the young dead, at the week they die: week ${f(a.youngAt)} · men ${f(a.youngMen)} · wins ${f(a.youngWins)} · best man ${f(a.youngBest)}d · bill ${f(a.youngBill)}d/wk`);
  console.log(`     · fire-sale ${f(a.youngFund)}d — nothing to sell (under 100d) on ${a.nothingToSell}% · heard the money row ${a.youngHeardRow}%`);
  console.log(`     · at its last red week: short ${f(a.youngShortAtRed)}d with ${f(a.youngFundAtRed)}d on the table`);
  console.log(`     · the row first spoke at ${f(a.youngFirstRed)} · men ARRIVED ${f(a.youngArrivals)} over the run, ${a.youngArrivedAfterRed}% of houses taking one after the row spoke (${f(a.youngMenAfterRed)} of them, ${f(a.youngSpentAfterRed)}d)`);
  console.log(`     · and BOUGHT off the block ${f(a.youngBought)} — after the row FIRST spoke, ${a.youngBoughtAfterRed}% of houses bought ${f(a.youngBoughtN)}`);
  console.log(`     · WHILE THE ROW WAS RED (${f(a.youngRedWeeks)} such weeks each): ${a.youngBoughtWhileRed}% of the young dead bought ${f(a.youngBoughtWhileRedN)} · over all ${a.houses} houses, ${a.allBoughtWhileRed} men bought on a red week\n`);
}
await browser.close(); server.close();
