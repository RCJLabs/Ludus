/* CAN ANY POLICY CLIMB THE WHOLE CENSUS LADDER? — the third arm nobody ran

   `estate` measured two houses. The spender (rooms, rites, parties) ends blocked on COIN for 83% of
   late weeks — ready in every term but the coin on 45% — and peaks at 27,593d against rung 7's ask
   of 80,000d. The miser (`{build:false, rites:false, party:false}`) peaks at 83,339d and clears the
   coin easily, but is short of FAVOUR on 93% of late weeks and never passes rung 5.

   From that pair I concluded the ladder asks for a combination the economy makes contradictory. That
   conclusion has a hole in it, and the hole is in the FIXTURE, not the game: the miser turns off
   three levers at once, and only two of them are expensive. Rung 7 wants favour 90, favour decays at
   0.35 a patron a week, and a decadent party is +15 warm to every patron for 900d — about 21d a week
   to hold the line. Parties are not what makes a house poor; rooms and rites are.

   So the arm that decides it was never run: NO ROOMS, NO RITES, PARTIES ON. If that house holds
   80,000d and favour 90 together, the ladder is climbable and my "contradictory" reading was an
   artefact of a fixture that bundled a cheap lever with two dear ones — which is the same shape as
   every other fault in this file.

   Three arms, same seeds, everything else identical.
*/
import { serve, open, found, clearAll, installRope, inside } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"LADDER" });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const YW = A.WEEKS_PER_YEAR || 18;
  const ARMS = [
    ["spender  (rooms, rites, parties)", {}],
    ["miser    (none of the three)",     { build:false, rites:false, party:false }],
    ["thrift   (parties only)",          { build:false, rites:false }],
  ];
  const res = [];
  for(const [label, opts] of ARMS){
    const a = { label, lateW:0, peakGold:0, topRung:0, favSum:0, goldSum:0,
                shortWorth:0, shortFee:0, shortFav:0, shortFame:0, notFull:0,
                readyAll:0, atTop:0, alive:0, houses:0,
                worthSum:0, costSum:0, feeSum:0, standSum:0 };
    for(let h=0; h<H; h++){
      const d = A.newGameState("Lad","clean","LAD-"+h, null); a.houses++;
      for(let w=0; w<W && !d.over; w++){
        const yr = Math.floor((d.week-1)/YW);
        if(yr >= 12){
          a.lateW++; a.favSum += (d.favor||0); a.goldSum += (d.gold||0);
          let need = null; try { need = A.riseNeed(d); } catch(e){}
          if(!need) a.atTop++;                      /* riseNext is null: rung 7, nothing above */
          else {
            /* FIVE terms, not three. `full` is the STANDING METER at 100, not the top of the
               ladder, and `goldOk` reads censusWorth — gold plus what is owed you plus gear plus
               the men plus every room you have built — not cash. The cash test is `feeOk`, which
               is a separate, much smaller number. Reading `full` as "at the top" and `goldOk` as
               "has the coin" is how the first cut of this got the whole shape wrong. */
            if(!need.fameOk)  a.shortFame++;
            if(!need.favorOk) a.shortFav++;
            if(!need.goldOk)  a.shortWorth++;
            if(!need.feeOk)   a.shortFee++;
            if(!need.full)    a.notFull++;
            if(need.fameOk && need.favorOk && need.goldOk && need.feeOk && need.full) a.readyAll++;
            a.worthSum += need.worth; a.costSum += need.cost; a.feeSum += need.fee;
            a.standSum += ((d.rise||{}).standing||0);
          }
        }
        a.peakGold = Math.max(a.peakGold, d.gold||0);
        a.topRung  = Math.max(a.topRung, (d.rise||{}).rank||0);
        R.lanista(d, opts);
      }
      if(!d.over) a.alive++;
    }
    res.push(a);
  }
  return { res, rope:R.say() };
}, [H, W]);

await browser.close(); server.close();
const f = v => Math.round(v).toLocaleString();
const pc = (n, d) => d ? Math.round(n/d*100) + "%" : "-";
console.log(`=== CAN ANY POLICY CLIMB THE WHOLE LADDER? ===  ${H} houses x ${W} weeks\n`);
console.log(`  ${"arm".padEnd(34)} ${"top".padStart(4)} ${"peak gold".padStart(10)} ${"mean favour".padStart(12)} ${"mean gold".padStart(10)}`);
for(const a of out.res)
  console.log(`  ${a.label.padEnd(34)} ${String(a.topRung).padStart(4)} ${f(a.peakGold).padStart(10)} `
    + `${(a.lateW ? (a.favSum/a.lateW).toFixed(1) : "-").padStart(12)} ${(a.lateW ? f(a.goldSum/a.lateW) : "-").padStart(10)}`);
console.log(`\n  WHAT BLOCKS THE NEXT RUNG, as a share of late weeks. Five terms, all of which must hold:`);
console.log(`    fame/favour are the gates · WORTH is censusWorth (gold + owed + gear + men + rooms), not cash`);
console.log(`    FEE is the cash actually handed over · STANDING is a meter that fills 4-9 a week while you`);
console.log(`    are over the fame and favour gates, and falls 2 a week when you are not\n`);
console.log(`  ${"arm".padEnd(34)} ${"late w".padStart(7)} ${"fame".padStart(6)} ${"favour".padStart(7)} ${"worth".padStart(7)} ${"fee".padStart(6)} ${"meter".padStart(7)} ${"READY".padStart(7)} ${"rung 7".padStart(7)}`);
for(const a of out.res)
  console.log(`  ${a.label.padEnd(34)} ${String(a.lateW).padStart(7)} ${pc(a.shortFame,a.lateW).padStart(6)} `
    + `${pc(a.shortFav,a.lateW).padStart(7)} ${pc(a.shortWorth,a.lateW).padStart(7)} ${pc(a.shortFee,a.lateW).padStart(6)} `
    + `${pc(a.notFull,a.lateW).padStart(7)} ${pc(a.readyAll,a.lateW).padStart(7)} ${pc(a.atTop,a.lateW).padStart(7)}`);
console.log(`\n  and the raw quantities in the late game, mean per week:`);
console.log(`  ${"arm".padEnd(34)} ${"worth".padStart(10)} ${"the ask".padStart(9)} ${"fee".padStart(8)} ${"meter".padStart(7)}`);
for(const a of out.res){ const n = a.lateW - a.atTop || 1;
  console.log(`  ${a.label.padEnd(34)} ${f(a.worthSum/n).padStart(10)} ${f(a.costSum/n).padStart(9)} `
    + `${f(a.feeSum/n).padStart(8)} ${(a.standSum/n).toFixed(0).padStart(7)}`); }
console.log(`\n  rope: ${out.rope}`);
