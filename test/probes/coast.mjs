/* #133 — DOES A TOUR PAY FOR ITSELF?

   Opened when the road step landed in v3.21.0 and deliberately left half-measured. Three arms of
   whole houses put the shuttling house at a median 175 weeks against 261 stuck and 259 never leaving
   — but those were LIFESPANS, censored at the wall, n=10, and lifespan is the noisiest statistic in
   this game (`ends` saw its medians swing 36w to 20w between two runs of one build). They were a
   reason to look, not a finding, and the roadmap said so.

   THE FALSIFICATION NAMED AT THE TIME: *if a tour pays for itself, a returning house should end
   RICHER than one that never went, and it does not have to live longer to show it.* So this measures
   coin and name rather than survival.

   THE DESIGN IS THE ONE THAT WORKED ON #135. Controlled pairs: the same seed played twice, identical
   but for `road`, control first so it cannot inherit RNG state. Two things make it sharper than the
   first pass:

     · ONLY PAIRS WHERE THE TOUR ACTUALLY HAPPENED COUNT. A house tours only if `bayCall` fires,
       which needs fame 90 and a man at pfame 22. In every other pair the two arms are the same house
       doing the same things, and averaging those in dilutes the effect toward zero while looking like
       more data. They are counted and excluded.
     · COMPARED AT THE LAST WEEK BOTH WERE ALIVE, not at a fixed horizon. A dead house's gold is not
       a worse result than a live one's, it is a different question — and mixing them is what made the
       first pass unreadable.

   Fixed checkpoints are also printed, among pairs still alive at each, because a tour might pay early
   and cost late or the reverse, and a single endpoint would hide it.

   HOW IT COULD BE WRONG: the arms diverge in RNG from the first different draw, so no single pair
   means anything and only the mean over many does. And `road:false` DECLINES the invitation rather
   than merely skipping the return — that is the right control (a house that leaves once and cannot
   come back is neither arm), but it means the two arms answer one fewer event, which is itself a
   difference. Printed, not hidden. */
import { serve, open } from "../harness.mjs";
const SEEDS = +(process.argv[2] || 24), WEEKS = +(process.argv[3] || 320);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([SEEDS, WEEKS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const CHECK = [80, 160, 240, 320].filter(w => w <= WEEKS);

  const play = (seed, road) => {
    const d = A.newGameState("Co", "clean", seed, null);
    const traj = [];
    let departures = 0, awayWeeks = 0, prevCity = null;
    let w = 0;
    for(; w < WEEKS; w++){
      if(d.over) break;
      if(d.city){ awayWeeks++; }
      if(d.city !== prevCity){ if(d.city) departures++; prevCity = d.city; }
      traj.push({ w: d.week, gold: d.gold, fame: d.fame });
      R.lanista(d, road ? {} : { road:false });
    }
    return { traj, departures, awayWeeks, lived: w, alive: !d.over,
      endGold: d.gold, endFame: d.fame, kind: d.over ? d.over.kind : "alive" };
  };

  const at = (t, i) => (i < t.traj.length ? t.traj[i] : null);
  let toured = 0, untoured = 0;
  const pairs = [];
  for(let s = 0; s < SEEDS; s++){
    const seed = `COAST-${s}`;
    const c = play(seed, false);          /* control FIRST */
    const t = play(seed, true);
    if(!t.departures){ untoured++; continue; }   /* the tour never happened — nothing to compare */
    toured++;
    /* the last week BOTH were still playing */
    const n = Math.min(c.traj.length, t.traj.length);
    if(!n) continue;
    const cEnd = c.traj[n-1], tEnd = t.traj[n-1];
    pairs.push({ s, n, cGold:cEnd.gold, tGold:tEnd.gold, cFame:cEnd.fame, tFame:tEnd.fame,
      cLived:c.lived, tLived:t.lived, departures:t.departures, awayWeeks:t.awayWeeks,
      cKind:c.kind, tKind:t.kind,
      checks: CHECK.map(cw => { const i = cw - 1;
        const a = at(c, i), b = at(t, i);
        return (a && b) ? { cw, cGold:a.gold, tGold:b.gold, cFame:a.fame, tFame:b.fame } : null; }) });
  }
  return { pairs, toured, untoured, SEEDS, WEEKS, CHECK, rope:R.say() };
}, [SEEDS, WEEKS]);
await browser.close(); server.close();
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
const med = a => { if(!a.length) return 0; const b=a.slice().sort((x,y)=>x-y); return b[Math.floor(b.length/2)]; };
const f = v => Math.round(v).toLocaleString();
const P = out.pairs;
console.log(`=== #133 — DOES A TOUR PAY FOR ITSELF? ===`);
console.log(`  ${out.SEEDS} seeds x ${out.WEEKS} weeks, controlled pairs, control (never leaves) run first`);
console.log(`  ${out.toured} pairs where the treated house ACTUALLY TOURED · ${out.untoured} where it never left`);
console.log(`  (the untoured pairs are identical houses and are excluded — averaging them in would`);
console.log(`   dilute the effect toward zero while looking like more data)\n`);
if(!P.length){ console.log(`  NO TOURING PAIRS — nothing can be concluded from this run.`); process.exit(0); }
console.log(`  AT THE LAST WEEK BOTH HOUSES WERE STILL PLAYING (n=${P.length}):`);
console.log(`    weeks compared over        median ${med(P.map(x=>x.n))}w`);
console.log(`    departures per touring house  median ${med(P.map(x=>x.departures))} · weeks away median ${med(P.map(x=>x.awayWeeks))}`);
console.log(`    GOLD   never leaves ${f(mean(P.map(x=>x.cGold))).padStart(9)}   toured ${f(mean(P.map(x=>x.tGold))).padStart(9)}`
  + `   difference ${((mean(P.map(x=>x.tGold-x.cGold))>=0)?"+":"")+f(mean(P.map(x=>x.tGold-x.cGold)))}`);
console.log(`    FAME   never leaves ${f(mean(P.map(x=>x.cFame))).padStart(9)}   toured ${f(mean(P.map(x=>x.tFame))).padStart(9)}`
  + `   difference ${((mean(P.map(x=>x.tFame-x.cFame))>=0)?"+":"")+f(mean(P.map(x=>x.tFame-x.cFame)))}`);
const richer = P.filter(x=>x.tGold > x.cGold).length, famer = P.filter(x=>x.tFame > x.cFame).length;
console.log(`    the touring house was RICHER in ${richer} of ${P.length} pairs · more famous in ${famer} of ${P.length}`);
console.log(`    [the sign test is the honest read here — a mean over paired runs that diverge in RNG`);
console.log(`     is dragged by any single runaway house]`);
console.log(`\n  AT FIXED WEEKS, among pairs where both were still playing then:`);
console.log(`    week      n     gold: stay / tour            fame: stay / tour        tour richer`);
for(let i=0;i<out.CHECK.length;i++){
  const rows = P.map(x=>x.checks[i]).filter(Boolean);
  if(!rows.length){ console.log(`    ${String(out.CHECK[i]).padStart(4)}      0`); continue; }
  const rg = rows.filter(r=>r.tGold > r.cGold).length;
  console.log(`    ${String(out.CHECK[i]).padStart(4)}   ${String(rows.length).padStart(4)}`
    + `   ${f(mean(rows.map(r=>r.cGold))).padStart(9)} / ${f(mean(rows.map(r=>r.tGold))).padStart(9)}`
    + `   ${f(mean(rows.map(r=>r.cFame))).padStart(8)} / ${f(mean(rows.map(r=>r.tFame))).padStart(8)}`
    + `   ${rg}/${rows.length}`);
}
console.log(`\n  and lifespans, printed because the item was opened on them and they are the WEAK statistic:`);
console.log(`    never leaves  median ${med(P.map(x=>x.cLived))}w   ·   toured  median ${med(P.map(x=>x.tLived))}w`);
console.log(`\n  rope: ${out.rope}`);
