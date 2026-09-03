/* WHAT THE YARD DUEL ACTUALLY ROLLS TODAY — the curve a spar has to reproduce

   Phase queue #232's own verify-first: "instrument the current i===0 branch to log its aWins rate
   and injury rate across a probe run and confirm the power()-comparison outcome distribution a
   6-ish-round simulateSpar should reproduce, so the visible bout isn't cosmetically decorating a
   coin-flip it silently changes the odds of."

   `EVENTS.feud`'s i===0 branch is two power() calls and one comparison:

     pa = power(A,"measured",B.cls,0,1);  pb = power(B,"measured",A.cls,0,1);
     aWins = pa*(0.8+R()*0.5) > pb*(0.8+R()*0.5)

   Each side's roll is uniform on [0.8, 1.3] — a 1.625x spread between the worst and best draw a
   man can get, applied independently to both. That is a LOT of noise on top of the power ratio,
   and the point of this probe is to say exactly how much: what a given power gap is worth in
   win-rate today, so a rounds-based resolver can be checked against it rather than guessed at.

   Reported as a curve (win rate by power ratio), a summary decisiveness figure (the ratio at which
   the better man wins ~75% of the time), and the flat injury rate the branch applies to the loser.

   Run: node test/probes/spar.mjs */
import { serve, open } from "../harness.mjs";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(()=>{
  const A = window.__LVDVS;
  const d = A.newGameState("Spar", "clean", "SPAR", null);

  /* the men a house actually has: genGladiator's own quality band, across the range a yard holds */
  const man = q => { const g = A.genGladiator(d, q); g.id = d.nextId++; g.status = "active"; g.mine = true;
    g.kit = A.defaultKit(g.cls); return g; };

  /* the branch's own two lines, verbatim */
  const powerOf = (x, foe) => A.power(Object.assign(A.clone(x), { mods:A.kitMods(x.kit, x.cls, x) }), "measured", foe.cls, 0, 1);

  const N = 20000;
  const buckets = new Map();   /* ratio band -> {n, betterWon} */
  const band = r => Math.min(2.0, Math.max(1.0, Math.round(r*20)/20));   /* 0.05-wide bands on the >=1 side */
  let coin = 0, coinN = 0;

  for(let i=0;i<N;i++){
    const a = man(40 + Math.floor(Math.random()*55));
    const b = man(40 + Math.floor(Math.random()*55));
    const pa = powerOf(a, b), pb = powerOf(b, a);
    if(!(pa>0) || !(pb>0)) continue;
    /* the comparison, verbatim — note both sides draw their own 0.8-1.3 */
    const aWins = pa*(0.8+Math.random()*0.5) > pb*(0.8+Math.random()*0.5);
    const hi = pa>=pb ? "a" : "b";
    const ratio = pa>=pb ? pa/pb : pb/pa;
    const k = band(ratio);
    if(!buckets.has(k)) buckets.set(k, { n:0, better:0 });
    const B0 = buckets.get(k);
    B0.n++;
    if((hi==="a") === aWins) B0.better++;
    if(ratio < 1.02){ coinN++; if((hi==="a")===aWins) coin++; }
  }

  const rows = [...buckets.entries()].filter(([,v])=>v.n>=60).sort((a,b)=>a[0]-b[0])
    .map(([k,v])=>({ ratio:k, n:v.n, win:+(v.better/v.n*100).toFixed(1) }));

  /* where does the better man actually become a favourite worth the name */
  const at = pct => { const hit = rows.find(r=>r.win>=pct); return hit ? hit.ratio : null; };

  /* ---- AND THE SAME CURVE OFF THE NEW RESOLVER, at a sweep of swings ----
     Six rounds average out noise the single roll never had to, so the per-round draw has to be
     wide to land back on the measured curve. This is what sized SPAR_SWING. */
  const sweep = [];
  for(const sw of [0.5, 0.7, 0.9, 1.06, 1.2, 1.4]){
    const bk = new Map();
    let rounds = 0, yields = 0, runs = 0, hardest = 0;
    for(let i=0;i<6000;i++){
      const a = man(40 + Math.floor(Math.random()*55));
      const b = man(40 + Math.floor(Math.random()*55));
      const pa = powerOf(a, b), pb = powerOf(b, a);
      if(!(pa>0) || !(pb>0)) continue;
      const res = A.simulateSpar(A.clone(a), A.clone(b), "measured", { d }, { swing:sw });
      const hi = pa>=pb ? "A" : "B";
      const ratio = pa>=pb ? pa/pb : pb/pa;
      const k = band(ratio);
      if(!bk.has(k)) bk.set(k, { n:0, better:0 });
      const B1 = bk.get(k); B1.n++; if(res.winner===hi) B1.better++;
      rounds += res.rounds; if(res.yielded) yields++; runs++; hardest = Math.max(hardest, res.hardest);
    }
    const r2 = [...bk.entries()].filter(([,v])=>v.n>=40).sort((a,b)=>a[0]-b[0])
      .map(([k,v])=>({ ratio:k, n:v.n, win:+(v.better/v.n*100).toFixed(1) }));
    const pick2 = t => { const h = r2.find(r=>Math.abs(r.ratio-t)<0.001); return h ? h.win : null; };
    sweep.push({ swing:sw, at1_00:pick2(1.00), at1_10:pick2(1.10), at1_15:pick2(1.15),
      at1_20:pick2(1.20), at1_30:pick2(1.30), at1_40:pick2(1.40),
      rounds:+(rounds/Math.max(1,runs)).toFixed(2), yieldPct:+(yields/Math.max(1,runs)*100).toFixed(1), hardest });
  }

  /* ---- WHAT THE LOSER SHOULD ACTUALLY CARRY OUT ----
     The branch rolled a flat 16% on the loser regardless of how the fight went. A rounds-based
     spar can key it on what he actually wore — but the AGGREGATE has to stay near 16%, or the
     yard duel has quietly become more (or less) dangerous than the thing it replaced. This finds
     the coefficient that holds the old rate while making WHICH duels hurt somebody mean something. */
  const hurt = [];
  for(const k of [0.28, 0.34, 0.40, 0.46]){
    let n = 0, hurtN = 0, lowHP = 0, hiHP = 0, lowN = 0, hiN = 0;
    for(let i=0;i<5000;i++){
      const a = man(40 + Math.floor(Math.random()*55)), b = man(40 + Math.floor(Math.random()*55));
      const res = A.simulateSpar(A.clone(a), A.clone(b), "measured", { d }, {});
      const vL = res.winner==="A" ? res.vB : res.vA;
      const chance = Math.min(0.34, Math.max(0.03, (100-vL)/100 * k));
      const did = Math.random() < chance;
      n++; if(did) hurtN++;
      if(vL <= 44){ lowN++; if(did) lowHP++; } else { hiN++; if(did) hiHP++; }
    }
    hurt.push({ k, rate:+(hurtN/n*100).toFixed(1),
      yielded:+(lowHP/Math.max(1,lowN)*100).toFixed(1), onCount:+(hiHP/Math.max(1,hiN)*100).toFixed(1) });
  }

  /* the one thing that must be true no matter how it is tuned: nobody can die in here */
  let deaths = 0, worst = 100;
  for(let i=0;i<3000;i++){
    const a = man(40 + Math.floor(Math.random()*55)), b = man(40 + Math.floor(Math.random()*55));
    const res = A.simulateSpar(A.clone(a), A.clone(b), "aggressive", { d }, {});
    worst = Math.min(worst, Math.min(res.vA, res.vB));
    if(res.beats.some(x=>x.kind==="death" || x.kind==="fall" || x.kind==="appeal")) deaths++;
  }

  return { rows, coin:+(coin/Math.max(1,coinN)*100).toFixed(1), coinN,
    at60:at(60), at75:at(75), at90:at(90), injury:0.16, N, sweep, deaths, worst:+worst.toFixed(1),
    floor: A.SPAR_YIELD - A.SPAR_CAP, yieldAt:A.SPAR_YIELD, cap:A.SPAR_CAP, hurt };
});

console.log(`the current yard duel — ${out.N} pairings, power ratio vs how often the better man wins`);
console.log(`  a dead-level pair (ratio < 1.02, n=${out.coinN}): ${out.coin}% — a coin, as it should be`);
for(const r of out.rows) console.log(`  ratio ${r.ratio.toFixed(2)} · n ${String(r.n).padStart(5)} · better man wins ${String(r.win).padStart(5)}%`);
console.log(`  becomes a 60% favourite at ratio ${out.at60} · 75% at ${out.at75} · 90% at ${out.at90 ?? "never in range"}`);
console.log(`  the loser's injury roll is flat: ${out.injury*100}% regardless of how the fight went`);
console.log(`\nsimulateSpar against that curve, by per-round swing (win% for the better man at each ratio):`);
const base = { "1.00":51.1, "1.10":66.2, "1.15":76.0, "1.20":80.5, "1.30":91.2, "1.40":96.2 };
console.log(`  the branch being replaced      · 1.00 ${base["1.00"]} · 1.10 ${base["1.10"]} · 1.15 ${base["1.15"]} · 1.20 ${base["1.20"]} · 1.30 ${base["1.30"]} · 1.40 ${base["1.40"]}`);
for(const s of out.sweep){
  const err = [[s.at1_00,base["1.00"]],[s.at1_10,base["1.10"]],[s.at1_15,base["1.15"]],[s.at1_20,base["1.20"]],[s.at1_30,base["1.30"]],[s.at1_40,base["1.40"]]]
    .filter(([a])=>a!=null).map(([a,b])=>Math.abs(a-b));
  const mae = err.length ? (err.reduce((x,y)=>x+y,0)/err.length).toFixed(1) : "—";
  console.log(`  swing ${s.swing.toFixed(2)} · 1.00 ${s.at1_00} · 1.10 ${s.at1_10} · 1.15 ${s.at1_15} · 1.20 ${s.at1_20} · 1.30 ${s.at1_30} · 1.40 ${s.at1_40}  ⟶ mean miss ${mae} pts · ${s.rounds} rounds · ${s.yieldPct}% end on a yield`);
}
console.log(`\nthe floor: ${out.deaths} deaths/falls/appeals in 3000 aggressive spars · lowest HP any man reached: ${out.worst}`);
console.log(`  the arithmetic floor is SPAR_YIELD(${out.yieldAt}) - SPAR_CAP(${out.cap}) = ${out.floor}; measured worst ${out.worst} ${out.worst>=out.floor?"holds it":"BREAKS IT"}`);
console.log(`\nthe loser's injury, keyed on what he wore (the branch it replaces: a flat 16.0% on everyone):`);
for(const h of out.hurt) console.log(`  k ${h.k.toFixed(2)} · aggregate ${String(h.rate).padStart(4)}% · when he yielded ${String(h.yielded).padStart(4)}% · when it went to the count ${String(h.onCount).padStart(4)}%`);

await browser.close(); server.close();
