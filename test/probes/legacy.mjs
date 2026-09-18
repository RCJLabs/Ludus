/* WHAT THE LEGACY LADDER COSTS IN HOUSES — a brainstorm instrument, not an item.

     node test/probes/legacy.mjs 60 420

   `LEGACIES` is the only thing in this game that crosses a run: six boons, merged into the next
   house through `mergeLegacy`/`applyLegacy`. Nothing has ever measured it. #282 settled that a
   house meets a fifth of what is written and closed that as the bargain — which makes the ladder
   ACROSS runs the one place the rest of the fifth could live, so what it costs is worth knowing.

   The thresholds, read off the table: freed 12 · buried 60 · bouts 900 · primus 3 · rome 1 ·
   years 40. This counts what one house actually delivers into each, and divides.

   ---- THE ANSWER, so nobody runs this cold and re-derives it ----
   60 houses, 420w cap, the MOST rope — median life 131w, which is already a stronger player than
   #282's reference arm at 51w, so for an ordinary house every figure here is worse again.

     legacy                 needs        median/house   houses to earn it
     The Long Tenure        40 years          8               4.0
     The Long Bill          60 buried         7               6.5
     A Thousand Afternoons  900 bouts        56              11.8
     The Primacy            3 held            0              15.0
     The Wooden Sword       12 freed          0              26.7
     The Imperial Sand      1 Rome win        0              30.0

   ONE boon is inside a campaign anybody will play. The median house contributes ZERO to three of
   the six. And `applyLegacy`'s whole display is on the TITLE SCREEN — the one system that crosses
   a run is visible only between runs, never during one.

   This is the structural counterpart to #282: if a run shows a fifth of what is written ON
   PURPOSE, the ladder across runs is where the rest was supposed to live, and it is priced as
   though houses lived four hundred weeks. Not filed as an item — it is a design argument, and it
   wants a decision before it wants code.

   ---- AND THE BUG THIS PROBE HAD FIRST, because it is the recurring one ----
   Stepping `R.lanista` alone advanced `d.week` without running the week's attrition, so nothing
   ever killed a house and the first run reported a median life of 370w against #282's 51w. It did
   not crash; it produced a finding. The two irreconcilable medians are the only reason it was
   caught. `depth.mjs` calls both, and so does the game. */
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
    /* ---- THE WEEK HAS TO END, WHICH THE FIRST CUT OF THIS DID NOT DO ----
       Stepping the rope alone advances `d.week` but never runs the week's attrition, so nothing
       killed a house and this reported a median life of 370w against #282's 51w — a probe bug
       that produced a finding rather than a crash, which is the shape this project keeps hitting.
       `depth.mjs` calls both, and so does the game. */
    for(; w<W; w++){
      if(d.over) break;
      try { R.lanista(d, MOST); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
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
