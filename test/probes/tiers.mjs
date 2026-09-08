/* THE RARE TIER'S LIFT, ACROSS AS MANY SEED BASES AS YOU LIKE — `checks/die.mjs` arm 6's instrument

   Arm 6 asks whether the weighted die actually reaches the four-ticket tier, by running the SAME
   eighteen houses twice — once on the real tickets, once with every ticket 1 and every cooldown 0 —
   and taking the rare tier's share of draws over the weeks both runs reached. The floor is +2 points
   of lift, pooled over three bases.

   THAT ARM HAS BEEN REPAIRED TWICE FOR THE SAME REASON, and its own header records both: 9.1 points
   became 0.7 "on a release that added no draws at all", and v3.233.0 took `DIE-RUN` from 3.8 to 1.6.
   Across five bases on one build the lift read 1.6 · 8.1 · 6.6 · 5.1 · 5.6 — a six-point spread. So
   whenever a release re-phases the stream and the lift moves, the question is always the same one:
   is this the build, or is it three draws of a statistic with a six-point spread?

   This answers it. Same construction as the arm, any number of bases, and it reports the WEIGHTED
   and FLAT shares separately — because a lift can fall two different ways and they mean opposite
   things. The weighted arm falling is the die failing. The FLAT arm rising is the baseline moving,
   which is a fact about what the houses were doing, not about the weighting.

   Run: node test/probes/tiers.mjs [bases] [houses] [weeks] [prefix] */
import { serve, open } from "../harness.mjs";
const B = +(process.argv[2] || 6), H = +(process.argv[3] || 18), W = +(process.argv[4] || 260);
const PRE = process.argv[5] || "DIE";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([B,H,W,PRE])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const runDie = (base) => {
    const drew = {}, raw = {}; let weeks = 0;
    const perHouse = Array.from({length:H}, ()=>({ weeks:0, draws:[] }));
    let cur = null;
    for(const k of A.EV_DRAWN){ const f = A.EVENTS[k].make; raw[k] = f;
      A.EVENTS[k].make = function(d){ const ev = f.call(this, d);
        if(ev){ drew[k] = (drew[k]||0)+1; if(cur) cur.draws.push({ k, w:d.week }); } return ev; }; }
    try {
      for(let h=0; h<H; h++){ const d = A.newGameState("Die"+h, "clean", `${base}-${h}`, null);
        cur = perHouse[h];
        for(let w=0; w<W; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } weeks++; cur.weeks++; } }
    } finally { cur = null; for(const k of Object.keys(raw)) A.EVENTS[k].make = raw[k]; }
    return { weeks, drew, perHouse };
  };
  const matched = (run, other, RK) => { let total=0, rare=0, span=0;
    for(let h=0; h<run.perHouse.length; h++){
      const cap = Math.min(run.perHouse[h].weeks, (other.perHouse[h]||{weeks:0}).weeks); span += cap;
      for(const x of run.perHouse[h].draws) if(x.w <= cap){ total++; if(RK.has(x.k)) rare++; } }
    return { total, rare, span, share: total ? rare/total : 0 }; };
  const shareOf = (run, keys) => { const total = Object.values(run.drew).reduce((a,b)=>a+b,0);
    const rare = keys.reduce((s,k)=>s+(run.drew[k]||0),0); return { total, rare, share: total?rare/total:0 }; };

  const rareKeys = A.EV_DRAWN.filter(k=>A.evTune(k).w >= 4);
  const RK = new Set(rareKeys);
  const bases = [];
  let wR=0,wT=0,fR=0,fT=0,pR=0,pT=0; const wKeys={}, fKeys={};
  for(let i=0;i<B;i++){
    const base = i===0 ? `${PRE}-RUN` : `${PRE}-ALT${i}`;
    const wRun = runDie(base);
    const keep = {}; for(const k of Object.keys(A.EV_DIE)){ keep[k] = { ...A.EV_DIE[k] }; A.EV_DIE[k].w = 1; A.EV_DIE[k].cool = 0; }
    let fRun; try { fRun = runDie(base); } finally { for(const k of Object.keys(keep)) Object.assign(A.EV_DIE[k], keep[k]); }
    const w = matched(wRun, fRun, RK), f = matched(fRun, wRun, RK);
    const ps = shareOf(wRun, rareKeys);
    wR+=w.rare; wT+=w.total; fR+=f.rare; fT+=f.total; pR+=ps.rare; pT+=ps.total;
    for(const k of rareKeys){ wKeys[k] = (wKeys[k]||0) + (wRun.drew[k]||0); fKeys[k] = (fKeys[k]||0) + (fRun.drew[k]||0); }
    bases.push({ base, span:w.span, wShare:+(w.share*100).toFixed(1), fShare:+(f.share*100).toFixed(1),
      lift:+((w.share-f.share)*100).toFixed(1), pool:+(ps.share*100).toFixed(1),
      wTot:w.total, fTot:f.total, wLived:wRun.weeks, fLived:fRun.weeks });
  }
  return { bases, rare:rareKeys.length, wKeys, fKeys,
    pooled:{ w:+(100*wR/wT).toFixed(1), f:+(100*fR/fT).toFixed(1), lift:+((100*wR/wT)-(100*fR/fT)).toFixed(1),
             abs:+(100*pR/pT).toFixed(1), wTot:wT, fTot:fT } };
}, [B,H,W,PRE]);

console.log(`THE RARE TIER'S LIFT — ${B} bases x ${H} houses x ${W} weeks, prefix ${PRE}, ${out.rare} four-ticket-and-up keys\n`);
console.log(`  base          span    weighted%   flat%    lift    pooled%   draws w/f     weeks lived w/f`);
for(const b of out.bases)
  console.log(`  ${b.base.padEnd(12)} ${String(b.span).padStart(5)}   ${String(b.wShare).padStart(7)}  ${String(b.fShare).padStart(7)} ${String(b.lift).padStart(7)}   ${String(b.pool).padStart(7)}   ${String(b.wTot).padStart(4)}/${String(b.fTot).padEnd(4)}   ${b.wLived}/${b.fLived}`);
const L = out.bases.map(b=>b.lift).sort((a,b)=>a-b);
console.log(`\n  POOLED: weighted ${out.pooled.w}% · flat ${out.pooled.f}% · lift ${out.pooled.lift} · unmatched pooled absolute ${out.pooled.abs}%`);
console.log(`  the rare tier, key by key (weighted / flat, every base pooled, UNMATCHED):`);
for(const k of Object.keys(out.wKeys).sort((a,b)=>(out.fKeys[b]||0)-(out.fKeys[a]||0)))
  console.log(`     ${k.padEnd(14)} ${String(out.wKeys[k]||0).padStart(4)} / ${String(out.fKeys[k]||0).padStart(4)}`);
console.log(`  per-base lift: min ${L[0]} · median ${L[Math.floor(L.length/2)]} · max ${L[L.length-1]} · spread ${(L[L.length-1]-L[0]).toFixed(1)}`);
await browser.close(); server.close();
