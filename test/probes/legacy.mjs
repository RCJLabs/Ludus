/* WHAT THE LEGACY LADDER COSTS IN HOUSES — a brainstorm instrument, not an item.

     node test/probes/legacy.mjs 60 420

   `LEGACIES` is the only thing in this game that crosses a run: six boons, merged into the next
   house through `mergeLegacy`/`applyLegacy`. Nothing has ever measured it. #282 settled that a
   house meets a fifth of what is written and closed that as the bargain — which makes the ladder
   ACROSS runs the one place the rest of the fifth could live, so what it costs is worth knowing.

   The thresholds, read off the table: freed 12 · buried 60 · bouts 900 · primus 3 · rome 1 ·
   years 40. This counts what one house actually delivers into each, and divides.

   ---- THE ANSWER, so nobody runs this cold and re-derives it ----
   60 houses, 420w cap, the MOST rope — median life 370w, mean 311w, and 3 of 60 dead inside
   thirty weeks.

     legacy                 needs        median/house   houses to earn it
     The Primacy            3 held            2               1.2
     The Long Bill          60 buried        30               2.1
     The Long Tenure        40 years         21               2.2
     The Wooden Sword       12 freed          4               2.3
     The Imperial Sand      1 Rome win        0               2.9
     A Thousand Afternoons  900 bouts       341               3.1

   THE LADDER IS NOT MISPRICED. Every boon lands inside one to three houses, which is a campaign
   anybody who likes the game will play. It was worth measuring because nothing ever had — and the
   answer is that this system is fine, so the finding here is not about `LEGACIES` at all.

   ---- WHAT IT ACTUALLY FOUND, WHICH IS ABOUT THE INSTRUMENTS ----
   THE ROPE ENDS ITS OWN WEEK. `lanista` finishes with `fin(A.endWeek,[d])` (harness.mjs:1603) and
   the harness's own `play()` loops it ALONE, as do `abroad`, `answer`, `asked` and most of the
   gate. Calling `endWeek` after it runs a SECOND, EMPTY week: the player acts every other week and
   the weekly bill lands twice per action. Confirmed three ways — the rope read, `d.week` at
   exactly 2x the iteration count on 24 of 24 houses, and `git log -S`, which dates the rope's own
   `endWeek` to v3.96.0.

   `depth.mjs` was written at v3.278.0, a hundred and eighty-two releases later, and added a second
   one. #282's headline numbers are measured on a game nobody plays. Corrected, reference arm:

     #282 as published          corrected
     median life      51w         348w
     meets            16/85       36/85     (19% -> 42%)
     dead inside 30w  22 of 80    1 of 30

   THIS PROBE HAD IT BOTH WAYS BEFORE IT HAD IT RIGHT. The first cut stepped the rope alone and
   reported 370w; I "corrected" it to match `depth.mjs` and got 131w; neither crashed, both
   produced findings, and the two irreconcilable medians are the only reason any of it surfaced.
   A probe that agrees with an existing instrument is not thereby right — it may only have copied
   the instrument's bug. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 60), W = +(process.argv[3] || 420);
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };
const NEED = { freed:12, buried:60, bouts:900, primus:3, rome:1, years:40 };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","houseRecord","endWeek"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const rows = [];
  for(let i=0;i<H;i++){
    const d = A.newGameState("Lg","clean",`LEG-${i}`);
    let w = 0;
    /* ---- ONE CALL IS ONE WEEK: THE ROPE ENDS IT ITSELF ----
       `lanista` finishes with `fin(A.endWeek,[d])` (harness.mjs:1603) and the harness's own
       `play()` loops it alone. Calling `endWeek` after it runs a SECOND, empty week — the player
       acts every other week and the weekly bill lands twice per action. Measured: `d.week` came
       out at exactly 2x the iteration count on 24 of 24 houses.

       This probe had it both ways before it had it right. The first cut stepped the rope with no
       `endWeek` at all and reported a 370w median life; the second copied `depth.mjs` and added
       one, which double-stepped. Neither crashed. Both produced findings. */
    for(; w<W; w++){
      if(d.over) break;
      try { R.lanista(d, MOST); } catch(e){}
    }
    const Rc = A.houseRecord(d);
    rows.push({ weeks:d.week, over:d.over ? d.over.kind : null,
      freed:Rc.freed||0, buried:Rc.lost||0, bouts:(d.book&&d.book.n)||0,
      years:Rc.years||0, primus:(d.flags&&d.flags.primusHeld)||0,
      rome:Math.max((d.rome&&d.rome.won)||0, (d.flags&&d.flags.romeBest)||0) });
  }
  return { rows };
}, [H, W, MOST]);

await browser.close(); server.close();
if(out.why){ console.log("PROBE COULD NOT RUN:", out.why); process.exit(1); }

const rows = out.rows, n = rows.length;
const med = a => { const s=[...a].sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
const sum = a => a.reduce((x,y)=>x+y,0);
const col = k => rows.map(r=>r[k]);

console.log(`\n${n} houses, cap ${W}w — median life ${med(col("weeks"))}w, mean ${(sum(col("weeks"))/n).toFixed(0)}w\n`);
console.log("what ONE house delivers into the ladder:");
console.log("  legacy     need   median/house   mean/house   houses needed (at the mean)   houses that did it alone");
for(const k of Object.keys(NEED)){
  const v = col(k), m = sum(v)/n, solo = v.filter(x=>x>=NEED[k]).length;
  const houses = m > 0 ? (NEED[k]/m) : Infinity;
  console.log(`  ${k.padEnd(9)} ${String(NEED[k]).padStart(5)} ${String(med(v)).padStart(13)} `
    + `${m.toFixed(2).padStart(12)} ${(houses===Infinity?"never":houses.toFixed(1)).padStart(28)} `
    + `${String(solo).padStart(24)}`);
}
const dead = Object.keys(NEED).filter(k=>sum(col(k))===0);
console.log(`\nnever moved at all by any of ${n} houses: ${dead.length ? dead.join(", ") : "(none)"}`);
console.log(`houses that died inside 30w: ${col("weeks").filter(x=>x<30).length} of ${n}`);
