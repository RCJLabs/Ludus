/* DOES THE THREE-STAGE RISING EVER PLAY OUT?

   `updateRebellion` is a three-stage machine and the UI has a line for each:

       stage 1   unrest >= 50   "Whispers move between the cells after dark."
       stage 2   unrest >= 65   "Conspiracy — steel is missing, and eyes follow the guards."
       stage 3   unrest >= 78   "The spark is lit. Tonight decides everything."

   and it falls back down again — under 40, 55, 68 respectively — so a house that cools off loses a
   stage rather than the whole arc. One caller, one stage per week, so the rising should take a
   minimum of three weeks to reach its night and can hang at a stage for as long as the unrest holds.

   THE SURVEY SAYS OTHERWISE. Over 14 campaigns: **7 rebellions, observed on exactly 7 house-weeks,
   0 falling edges** — every one seen for a single week and none ever defused — while rebellion is the
   second commonest ending, 5 of 14. Either the arc is not playing out, or the survey cannot see it.

     1 · EVERY RISING, WEEK BY WEEK. The stage sequence from the week it appears to the week it goes,
         so "one week" can be told apart from "three weeks the survey sampled badly".
     2 · HOW EACH ONE ENDED — defused back to nothing, the house over, or the run simply stopping.
     3 · AND THE UNREST UNDER IT, because the machine is a function of one number: what unrest does
         in the weeks around a rising decides whether the stages can be held at all.

   Run: node test/probes/rising.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "RISE";
const SURVEY_WAY = process.argv[5] === "survey";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED,SURVEYWAY])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const risings = [];
  let weeks = 0, unrestHi = 0, unrestSum = 0;
  const peak = [];

  for(let h=0; h<H; h++){
    /* THE SURVEY'S OWN CONSTRUCTION, to isolate why it sees 7 rebellion-weeks where this sees ~270:
       one argument, so the scenario falls back to `clean` and the seed word is random. Note that
       "capua" is NOT a scenario key either — `SCENARIOS[scen] || SCENARIOS.clean` returns clean
       without a word, which 32 probe call sites in this repo are quietly relying on. */
    const d = SURVEYWAY ? A.newGameState("Survey", "clean", `${SEED}-${h}`) : A.newGameState("Rs"+h, "clean", `${SEED}-${h}`);
    let cur = null, hiUnrest = 0;
    for(let w=0; w<W && !d.over; w++){
      try { R.lanista(d, {}); } catch(e){ break; }
      weeks++;
      const u = d.unrest || 0;
      unrestSum += u; if(u > unrestHi) unrestHi = u;
      if(u > hiUnrest) hiUnrest = u;
      const st = d.rebellion ? d.rebellion.stage : 0;
      if(st > 0){
        if(!cur){ cur = { h, from:d.week, stages:[], unrest:[], end:null }; risings.push(cur); }
        cur.stages.push(st); cur.unrest.push(Math.round(u));
      } else if(cur){ cur.end = "cooled"; cur.to = d.week; cur = null; }
    }
    if(cur){ cur.end = d.over ? (d.over.kind || "over") : "run ended"; cur.to = d.week; }
    peak.push(Math.round(hiUnrest));
  }
  return { risings, weeks, unrestHi:Math.round(unrestHi), unrestMean:+(unrestSum/Math.max(1,weeks)).toFixed(1), peak,
    gates: { up:[50,65,78], down:[40,55,68] } };
}, [H, W, SEED, SURVEY_WAY]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length?v[Math.floor(v.length/2)]:0; };
console.log(`\n=== EVERY RISING (${out.risings.length} over ${out.weeks} played weeks) ===`);
console.log(`  the machine climbs at unrest ${out.gates.up.join(" / ")} and falls back under ${out.gates.down.join(" / ")}`);
for(const r of out.risings)
  console.log(`  h${String(r.h).padStart(2)} w${String(r.from).padStart(3)}-${String(r.to||"?").padStart(3)}  ${String(r.stages.length).padStart(2)}wk  stages ${r.stages.join("")}  unrest ${r.unrest.join(",")}  → ${r.end}`);
const lens = out.risings.map(r=>r.stages.length);
console.log(`\n  weeks per rising: p50 ${med(lens)} · max ${Math.max(0,...lens)}`);
const ends = {}; for(const r of out.risings) ends[r.end] = (ends[r.end]||0)+1;
console.log(`  how they ended: ${Object.entries(ends).map(([k,v])=>`${k} ${v}`).join(" · ") || "-"}`);
const reached = s => out.risings.filter(r=>r.stages.includes(s)).length;
console.log(`  reached stage 1: ${reached(1)} · stage 2: ${reached(2)} · stage 3: ${reached(3)}  (of ${out.risings.length})`);
console.log(`\n  unrest across all weeks: mean ${out.unrestMean} · highest ever ${out.unrestHi}`);
console.log(`  each house's peak unrest: ${out.peak.join(" · ")}`);
console.log(`    — the arc needs 50 to start, 65 for the steel and 78 for the night`);
console.log("");
await browser.close(); server.close();
