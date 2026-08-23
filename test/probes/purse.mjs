/* CAN A GREAT HOUSE EVER SAVE? — income against the bill, by era

   `estate` says a year-12 house has 38.6x the fame of a young one, 6.1x the gold, and an 8.3x
   weekly bill. And the census ladder is where that lands: 83% of late weeks the house is short of
   the COIN the next rung asks, and 45% of late weeks it is READY IN EVERY TERM BUT THE COIN. The
   best any house ever held at once across ten runs was 27,593d, against rung 7's ask of 80,000d.

   That is a stock reading, and a stock cannot tell you whether the ladder is priced wrong or the
   economy is. The question this asks is the FLOW one: week by week, what came IN and what went
   OUT, early against late. If income scales with the bill, a house that wants 80,000d can save for
   it and the ladder is merely long. If the bill outgrows income, no amount of play ever gets
   there, and every late house is famous and broke by construction.

   MEASURED THE ONLY WAY THAT IS HONEST: the gold delta across each week, split by sign, on the
   same reference player `estate` and `late` use. Not by re-deriving the purse from the bout tables
   — that would be a second implementation of the economy, and it would be the one with the bug.
*/
import { serve, open, found, clearAll, installRope, inside } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"PURSE" });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const YW = A.WEEKS_PER_YEAR || 18;
  const eras = [["year 1-3",0,3],["year 3-7",3,7],["year 7-12",7,12],["year 12+",12,999]];
  const box = eras.map(()=>({ w:0, in:0, out:0, bill:0, peak:0, netPos:0 }));
  let houses = 0, reachedLate = 0;
  for(let h=0; h<H; h++){
    const d = A.newGameState("Purse","clean","PURSE-"+h,null);
    houses++; let sawLate = false;
    for(let w=0; w<W && !d.over; w++){
      const g0 = d.gold;
      const bill = (()=>{ try { return A.weeklyBill(d) || 0; } catch(e){ return 0; } })();
      R.lanista(d);
      const dg = d.gold - g0;
      const yr = Math.floor((d.week-1)/YW);
      const i = eras.findIndex(e=>yr>=e[1] && yr<e[2]); if(i<0) continue;
      const b = box[i];
      b.w++; b.bill += bill;
      if(dg >= 0){ b.in += dg; b.netPos++; } else b.out += -dg;
      if(d.gold > b.peak) b.peak = d.gold;
      if(yr >= 12 && !sawLate){ sawLate = true; reachedLate++; }
    }
  }
  return { eras:eras.map((e,i)=>({ name:e[0], ...box[i] })), houses, reachedLate, rope:R.say() };
}, [H, W]);

await browser.close(); server.close();
const f = v => Math.round(v).toLocaleString();
console.log(`=== CAN A GREAT HOUSE EVER SAVE? ===`);
console.log(`  ${out.houses} houses x up to ${W} weeks · ${out.reachedLate} reached year 12+\n`);
console.log(`  ${"era".padEnd(10)} ${"weeks".padStart(6)} ${"mean net/wk".padStart(12)} ${"up weeks".padStart(9)} ${"mean bill".padStart(10)} ${"peak held".padStart(10)}`);
for(const e of out.eras){
  if(!e.w) continue;
  const net = (e.in - e.out) / e.w;
  console.log(`  ${e.name.padEnd(10)} ${String(e.w).padStart(6)} ${(net>=0?"+":"")+f(net)+"d"} `.padEnd(32)
    + `${(Math.round(e.netPos/e.w*100)+"%").padStart(9)} ${(f(e.bill/e.w)+"d").padStart(10)} ${(f(e.peak)+"d").padStart(10)}`);
}
const late = out.eras[out.eras.length-1];
if(late && late.w){
  const net = (late.in - late.out) / late.w;
  console.log(`\n  AT THE LATE RATE, saving the 80,000d rung 7 asks takes `
    + (net > 0 ? `${Math.round(80000/net).toLocaleString()} weeks (${Math.round(80000/net/18)} years) of never spending a denarius on anything else.`
               : `FOREVER — the late house loses ${f(-net)}d a week on average.`));
}
console.log(`\n  rope: ${out.rope}`);
