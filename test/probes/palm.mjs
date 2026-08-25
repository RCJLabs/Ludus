/* WHAT A MAN'S RECORD ACTUALLY LOOKS LIKE, ACROSS REAL PLAY

   `vocab` reports the yard figure at ONE distinct drawing over the record axis: wins, renown and
   the men he has killed reach the picture nowhere. Before drawing them, this asks the only
   question that decides whether the drawing is worth making — WHERE ARE THE MEN?

   #206 is the standing example of what happens when that question is skipped: `TELLS.cold` cannot
   fire, because `formOf(o)` is 0 for every opponent the game generates. The tell is written, read
   and dead. A band placed above where men actually stand is the same bug with a picture on it.

   So this walks real houses week by week and records EVERY ACTIVE MAN EVERY WEEK — not a snapshot
   of the survivors, which would be the same "never lost vs. lost and refilled" fault `keep.mjs`
   was rewritten to avoid. It reports the distribution of each term by era, and the share of
   man-weeks that would fall in each band of a proposed ladder, so a band that never draws is
   visible BEFORE it is drawn rather than after nobody notices it.

     node test/probes/palm.mjs 24 420 PALM
*/
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "PALM";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const era = w => w < 90 ? "early" : w < 180 ? "mid" : "late";
  const ERAS = ["early","mid","late"];
  const TERMS = ["wins","pfame","kills","losses","fans"];
  const vals = {}; for(const t of TERMS){ vals[t] = { early:[], mid:[], late:[], all:[] }; }
  let manWeeks = 0, houses = 0;
  /* the top of the ladder each term ever reaches, so a band above it is visibly dead */
  const peak = {}; for(const t of TERMS) peak[t] = 0;
  /* how far a man gets in his life, taken at the moment he leaves the yard for any reason */
  const finals = [];
  const seenGone = new Set();

  for(let h=0; h<H; h++){
    const d = A.newGameState("P"+h, "clean", `${SEED}-${h}`, null);
    houses++;
    for(let w=0; w<W; w++){
      if(d.over) break;
      R.lanista(d);
      if(d.over) break;
      const e = era(d.week);
      for(const g of (d.gladiators||[])){
        if(g.status !== "active") {
          if(!seenGone.has(g.id)){ seenGone.add(g.id);
            finals.push({ wins:g.wins||0, pfame:Math.round(g.pfame||0), kills:g.kills||0 }); }
          continue;
        }
        manWeeks++;
        for(const t of TERMS){
          const v = t === "pfame" ? Math.round(g.pfame||0) : (g[t]||0);
          vals[t][e].push(v); vals[t].all.push(v);
          if(v > peak[t]) peak[t] = v;
        }
      }
    }
  }
  return { vals, manWeeks, houses, peak, finals };
}, [H, W, SEED]);

await browser.close(); server.close();

const q = (a, f) => { if(!a.length) return 0; const s = a.slice().sort((x,y)=>x-y);
  return s[Math.min(s.length-1, Math.floor(f * s.length))]; };
const share = (a, lo, hi) => a.length ? (a.filter(v => v >= lo && v < hi).length / a.length * 100) : 0;

console.log(`=== a man's record, over ${out.houses} houses and ${out.manWeeks.toLocaleString()} man-weeks\n`);
console.log(`  ${"term".padEnd(8)} ${"p50".padStart(6)} ${"p75".padStart(6)} ${"p90".padStart(6)} ${"p97".padStart(6)} ${"max".padStart(6)}   by era (p50 / p90)`);
for(const t of Object.keys(out.vals)){
  const a = out.vals[t].all;
  const byEra = ["early","mid","late"].map(e=>{
    const v = out.vals[t][e]; return `${e}:${q(v,.5)}/${q(v,.9)}`; }).join("  ");
  console.log(`  ${t.padEnd(8)} ${String(q(a,.5)).padStart(6)} ${String(q(a,.75)).padStart(6)} `
    + `${String(q(a,.9)).padStart(6)} ${String(q(a,.97)).padStart(6)} ${String(out.peak[t]).padStart(6)}   ${byEra}`);
}

/* THE PROPOSED LADDER, measured against where the men actually are. A band under 2% of man-weeks
   is a band nobody will ever see; a band over 70% is a band that says nothing. */
const LADDERS = {
  wins:  [0,1,2,4,7,12],
  pfame: [0,20,40,60,90,140],
  kills: [0,1,2,4],
};
console.log(`\n=== the proposed bands, as a share of all man-weeks`);
for(const [term, cuts] of Object.entries(LADDERS)){
  const a = out.vals[term].all;
  console.log(`\n  ${term}`);
  for(let i=0;i<cuts.length;i++){
    const lo = cuts[i], hi = cuts[i+1] == null ? Infinity : cuts[i+1];
    const pc = share(a, lo, hi);
    const bar = "#".repeat(Math.round(pc / 2));
    console.log(`    ${String(lo).padStart(4)}..${hi===Infinity?"  +":String(hi-1).padStart(3)}  `
      + `${pc.toFixed(1).padStart(5)}%  ${bar}${pc < 2 ? "   <-- almost never drawn" : ""}`);
  }
}

const F = out.finals;
const fq = (k, f) => { const s = F.map(x=>x[k]).sort((a,b)=>a-b); return s.length ? s[Math.floor(f*s.length)] : 0; };
console.log(`\n=== and where a man ENDS, taken as he leaves the yard (${F.length} men)`);
console.log(`  wins   p50 ${fq("wins",.5)}   p90 ${fq("wins",.9)}   p99 ${fq("wins",.99)}`);
console.log(`  pfame  p50 ${fq("pfame",.5)}   p90 ${fq("pfame",.9)}   p99 ${fq("pfame",.99)}`);
console.log(`  kills  p50 ${fq("kills",.5)}   p90 ${fq("kills",.9)}   p99 ${fq("kills",.99)}`);
