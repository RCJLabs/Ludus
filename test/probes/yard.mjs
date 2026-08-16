/* WHY THE YARD SHRINKS — the first seam from keep.mjs, asked as its own question

   `keep.mjs` counted men in and out of the ACTIVE set: early net +116, mid -63, late -65 across 72
   houses. A house that is richer every year is net-losing men every year, and nobody had asked whether
   that is the roster cap, the market drying up, or deaths outrunning buying.

   TWO INSTRUMENT CORRECTIONS ON THE SEAM'S OWN NUMBER, before anything new:
   · keep.mjs's men row diffs the ACTIVE set, so a man carried off injured counts as "left" and counts
     again as "arrived" when he heals. Both columns are inflated by every injury. This probe counts a
     true ARRIVAL (an id newly on the books) and a true EXIT (a man's status entering GONE — the game's
     own list: dead, freed, escaped, retired, departed, sold), so the causes can be read off the status
     that carried him out.
   · the buy-gate state is read EVERY WEEK as the rope's own buy step sees it (active-and-uninjured < 5,
     not rosterFull), split by what actually blocked: the cap, an empty stall, or nothing affordable at
     the step's own price bar (price <= spare()*0.5). A fire count alone cannot separate those — the
     walk.mjs lesson, doors before fires.

   CAVEAT, stated rather than hidden: the gate is sampled before `R.lanista(d)` runs, and the feast/walk
   steps inside it can spend gold before the buy step reads spare(). The sampled "affordable" is
   therefore an upper bound on what the buy step saw. The buys themselves are counted off the roster
   diff, not off the sample. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 72), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "YARD";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const eras = ["early","mid","late"];
  const era = w => w < 90 ? "early" : w < 180 ? "mid" : "late";
  const zero = () => ({ early:0, mid:0, late:0 });
  const weeks = zero(), arrived = zero(), rosterFullW = zero();
  const exits = {};                         /* status -> era counts */
  const want = zero(), blockedCap = zero(), blockedEmpty = zero(), blockedPrice = zero(), openBuy = zero();
  const marketPrices = { early:[], mid:[], late:[] }, spares = { early:[], mid:[], late:[] };
  const yardSize = { early:[], mid:[], late:[] };

  for(let h=0; h<H; h++){
    const d = A.newGameState("Yd"+h, "clean", `${SEED}-${h}`, null);
    let ids = new Set(d.gladiators.map(g=>g.id));
    let gone = new Set(d.gladiators.filter(g=>A.isGone(g)).map(g=>g.id));
    for(let w=0; w<W; w++){
      if(d.over) break;
      const e = era(d.week);
      /* the gate, as the buy step will see it this week */
      const reserve = Math.max(700, A.weeklyBill(d) * 12);
      const spare = d.gold - reserve;
      const fit = A.activeG(d).filter(g=>!g.injury).length;
      const full = A.rosterFull(d);
      if(fit < 5){
        want[e]++;
        const stall = (d.market||[]);
        const afford = stall.filter(x=>x.price <= spare*0.5);
        if(full) blockedCap[e]++;
        else if(!stall.length) blockedEmpty[e]++;
        else if(!afford.length) blockedPrice[e]++;
        else openBuy[e]++;
        if(stall.length) marketPrices[e].push(Math.min(...stall.map(x=>x.price)));
      }
      if(full) rosterFullW[e]++;
      spares[e].push(Math.round(spare));
      yardSize[e].push(A.activeG(d).length);

      R.lanista(d);
      if(d.over) break;
      weeks[e]++;
      for(const g of d.gladiators){
        if(!ids.has(g.id)){ ids.add(g.id); arrived[e]++; }
        if(A.isGone(g) && !gone.has(g.id)){
          gone.add(g.id);
          exits[g.status] = exits[g.status] || zero();
          exits[g.status][e]++;
        }
      }
    }
  }
  return { weeks, arrived, exits, want, blockedCap, blockedEmpty, blockedPrice, openBuy,
    rosterFullW, marketPrices, spares, yardSize, eras };
}, [H, W, SEED]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };
const per = (n,w) => w ? (n/w*1000).toFixed(0) : "-";
const E = out.eras;

console.log(`\n${H} houses x ${W}w · seed "${SEED}" · arrivals are new ids on the books, exits are the game's own GONE statuses\n`);
console.log(`  era     weeks   arrived    exits(all)   net     per 1k wks: in / out`);
for(const e of E){
  const ex = Object.values(out.exits).reduce((s,v)=>s+v[e],0);
  console.log(`  ${e.padEnd(6)} ${String(out.weeks[e]).padStart(6)}  ${String(out.arrived[e]).padStart(7)}  ${String(ex).padStart(11)}  ${String(out.arrived[e]-ex).padStart(5)}     ${per(out.arrived[e],out.weeks[e]).padStart(4)} / ${per(ex,out.weeks[e])}`);
}
console.log(`\n  EXITS BY THE STATUS THAT CARRIED HIM OUT — the raw material, per era:`);
console.log(`    status      early    mid   late`);
for(const [k,v] of Object.entries(out.exits).sort((a,b)=>(b[1].early+b[1].mid+b[1].late)-(a[1].early+a[1].mid+a[1].late)))
  console.log(`    ${k.padEnd(10)} ${String(v.early).padStart(6)} ${String(v.mid).padStart(6)} ${String(v.late).padStart(6)}`);

console.log(`\n  THE BUY GATE, sampled each week the rope would WANT a man (active-and-uninjured < 5):`);
console.log(`    era     want-wks   cap-blocked   stall-empty   none-affordable   open(could buy)`);
for(const e of E)
  console.log(`    ${e.padEnd(6)} ${String(out.want[e]).padStart(8)}  ${String(out.blockedCap[e]).padStart(11)}  ${String(out.blockedEmpty[e]).padStart(11)}  ${String(out.blockedPrice[e]).padStart(15)}  ${String(out.openBuy[e]).padStart(15)}`);
console.log(`\n    rosterFull weeks (all weeks): ${E.map(e=>`${e} ${out.rosterFullW[e]}`).join(" · ")}`);
console.log(`    cheapest man on the stall (median, want-weeks only): ${E.map(e=>`${e} ${med(out.marketPrices[e])}d`).join(" · ")}`);
console.log(`    spare() over the reserve (median, all weeks):        ${E.map(e=>`${e} ${med(out.spares[e])}d`).join(" · ")}`);
console.log(`    men in the yard (median, all weeks):                 ${E.map(e=>`${e} ${med(out.yardSize[e])}`).join(" · ")}`);

await browser.close(); server.close();
