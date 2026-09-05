/* THE DIE'S OWN DRAWS — before and after #245 phase 2, counted where the survey cannot.

   `survey.mjs`'s events column counts every question the rope answered, and for many keys that is
   two things added together: `stash` fired 44 times in 3,616 weeks at 0.7% eligibility, and
   `whispers` / `stolenSteel` / `warTax` fired while never once eligible to the scan — raised by the
   purse, the rising, the revolt, not drawn. The die is one caller: it calls `make()`, and no raised
   event does. So every make() is wrapped here to count the calls that return a question, which is
   exactly "drawn by the die", on either build, seeded. Reports per-event die draws, the tier shares,
   and the run's length and endings — the second thing #245 has to answer for, since a heavier rare
   tier is mostly a heavier bad tier.

     node test/probes/dice.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "AUDIT";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const drew = {}; const raw = {};
  for(const k of Object.keys(A.EVENTS)){ const f = A.EVENTS[k].make; if(typeof f !== "function") continue; raw[k] = f;
    A.EVENTS[k].make = function(d){ const ev = f.call(this, d); if(ev) drew[k] = (drew[k]||0) + 1; return ev; }; }
  const endings = {}; let weeks = 0; const ends = [];
  /* #245 phase 3 — freshness is about WHEN a house first meets an event, so per house: the quarter
     of the run each first die draw fell in, and how many distinct events the die ever gave it */
  const firsts = [0,0,0,0], distinct = [], byQuarterWeeks = [0,0,0,0];
  for(let h=0; h<H; h++){ const d = A.newGameState("Dice"+h, "clean", `${SEED}-${h}`, null);
    const seen = new Set(); let before = {};
    for(let w=0; w<W; w++){ if(d.over) break; before = { ...drew }; try { R.lanista(d); } catch(e){ break; } weeks++;
      const q = Math.min(3, Math.floor(w / (W/4))); byQuarterWeeks[q]++;
      for(const k of Object.keys(drew)) if((drew[k]||0) > (before[k]||0) && !seen.has(k)){ seen.add(k); firsts[q]++; } }
    distinct.push(seen.size);
    const K = d.over ? d.over.kind : "survived"; endings[K] = (endings[K]||0) + 1; ends.push(d.week); }
  for(const k of Object.keys(raw)) A.EVENTS[k].make = raw[k];
  const W8 = (A.EV_DIE && Object.fromEntries(Object.entries(A.EV_DIE).map(([k,v])=>[k,v.w]))) || null;
  return { weeks, endings, endAt: ends.sort((a,b)=>a-b), drew, tiers: W8, firsts, byQuarterWeeks, distinct: distinct.sort((a,b)=>a-b) };
}, [H,W,SEED]);
console.log(JSON.stringify(out));
await browser.close(); server.close();
