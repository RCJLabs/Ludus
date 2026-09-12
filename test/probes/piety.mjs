/* WHAT THE TEMPLE IS WORTH — #267's verify-first.

     node test/probes/piety.mjs 16 420 8      # houses, weeks, seed sets

   #267 says the temple is a switch: **0.8% of weeks blessed under the reference, 62-68% under a
   house that prays**, and #260's six-prefix sweep found no published figure moving either way. But
   ONE single-set reading in v3.252.0's attribution run put `rites` alone at **6.4% rebellion-weeks
   against the reference's 12.0%**, and it was never confirmed. That is exactly the shape `court`
   had before its second set read 6.9% with 25 risings against the reference's 26 — a fluke that
   would have shipped as a finding. So this runs the same eight paired `PYRE` sets `bury` and the
   free door were run on.

   WHAT A BLESSING ACTUALLY DOES, off the source rather than off the boon text, because those are
   four different numbers in four different systems:

     fortuna       `blessMercy` = 9, and it rides into `simCtx.fav` — the missio roll
     aesculapius   `blessHeal`  = 1.4 on the mending
     victoria      `blessPurse` = 1.10 and `blessFame` = 1.15
     mars          heart in the cold weeks · jupiter   patron warmth

   So the three things to read are the three things they touch: **wounds, purses, and mercy** — and
   the rebellion share beside them, because that is the claim that needs replicating. Nothing here
   measures "is the temple good"; it measures whether the four numbers move at all.

   AND WHY IT IS A SWITCH IS ARITHMETIC, NOT TASTE. `OFFERING_COOL` is **3** and a blessing runs
   **4-6 weeks**, so a house that prays whenever it is unblessed is blessed almost always, and one
   that never prays is never blessed. There is no third state and nothing escalates: the only brake
   is `cost: d => rnd(180 + pietyFame(d)*0.6)`, which makes a famous house pay more for the same
   thing rather than making the second blessing worth less than the first.

   ---- WHAT IT FOUND, WRITTEN BACK OVER THE PREMISE IT WAS BUILT ON (v3.263.0) ----
   16 houses x 420 weeks, eight paired `PYRE` sets. BOTH of the paragraphs above are wrong.

   **The rising does not move.** ref 8.1% (5.5-10.9) -> rites 8.4% (6.5-9.8); paired deltas
   -0.5 +1.1 -0.3 +1.2 +3.0 +4.4 -4.5 -1.7 — FOUR OF EIGHT LOWER, mean +0.35 the wrong way. The
   v3.252.0 single-set read does not replicate and #267's premise is dead.

   **And "there is no third state" is the arithmetic above run without the price in it.** The
   cooldown says a praying house should be blessed almost always; measured, it is blessed **40.8%**
   (36.3-43.0) of weeks, because `spare()` does not cover the altar in three weeks out of five. The
   third state is the ordinary one, and the brake I dismissed as "makes a famous house pay more" is
   the whole of what sets uptake. The item's 62-68% is the same policy on a richer house.

     blessed weeks     ref 0.8-2.1% (mean 1.1)  ->  36.3-43.0% (mean 40.8)   8/8
     hurt man-weeks    1.8%  ->  1.0%    6/8 lower, mean -0.77
     died per 100      76.7  ->  75.0    6/8 lower, mean -1.69, spread +6.9 to -8.3
     gold p50          1058  ->  617           fame p50   3158  ->  2336

   So praying is a paid, modest brake on the WOUND ledger and a net drain on purse and standing.
   The wound and death effects are directional and NOT solid enough to bar at a check frame; they
   are reported in `checks/piety.mjs` and not asserted, on `young`'s precedent.

   THE GOD-WEEKS COLUMN IS THIS ROPE'S, NOT THE GAME'S, and must not be published as a finding.
   `rites` walks `gods[(d.week + i) % 5]` and takes the FIRST it can afford, so the cheapest god
   wins the walk; aesculapius (160 + 0.5x fame, 6 weeks) is also the longest-lived. The skew to
   aesculapius and mars confounds how often the rope picks a god with how long his blessing rides,
   and the instrument cannot separate them. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SETS = +(process.argv[4] || 8);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, SETS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG","blessOf","GODS","GOD_KEYS"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const med = a => { if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(0.5*s.length)]; };

  const arm = (o, seed) => {
    let weeks=0, blessed=0, rebWeeks=0, risings=0, bouts=0, wins=0;
    let manWeeks=0, hurtWeeks=0, died=0, seen=0;
    const gods = {}; const gold=[], fame=[];
    for(let i=0;i<H;i++){
      const d = A.newGameState("Pi","clean",`${seed}-${i}`);
      let wasRebel=false;
      for(let w=0;w<W;w++){
        if(d.over) break;
        const bg = A.blessOf(d);
        if(bg){ blessed++; gods[bg] = (gods[bg]||0)+1; }
        if(d.rebellion){ rebWeeks++; if(!wasRebel) risings++; wasRebel=true; } else wasRebel=false;
        /* the mending, counted as man-weeks spent hurt over man-weeks lived — `blessHeal` is a
           multiplier on how fast a wound closes, so the rate is what it moves and not the count */
        const live = A.activeG(d);
        manWeeks += live.length;
        hurtWeeks += live.filter(g=>g.injury).length;
        let did=null; try{ did = R.lanista(d,o); }catch(e){ break; }
        weeks++;
        if(did){ if(typeof did.bout==="number") bouts += did.bout; if(typeof did.won==="number") wins += did.won; }
      }
      for(const g of (d.gladiators||[])){ seen++; if(g.status==="dead") died++; }
      gold.push(Math.round(d.gold)); fame.push(Math.round(d.fame||0));
    }
    return { weeks, blessed, rebWeeks, risings, bouts, wins, manWeeks, hurtWeeks, died, seen, gods,
      goldP50:med(gold), fameP50:med(fame) };
  };

  const res = [];
  for(let s=0;s<SETS;s++){
    const seed = `PYRE${s}`;
    res.push({ seed, ref:arm({}, seed), rites:arm({ rites:true }, seed) });
  }
  return { res };
}, [H, W, SETS]);

if(out.why){ console.log("HANDLE:", out.why); await browser.close(); server.close(); process.exit(1); }

const pad=(s,n)=>String(s).padEnd(n), rp=(s,n)=>String(s).padStart(n);
const pc = (a,b) => b ? (100*a/b) : 0;
console.log(`\nWHAT THE TEMPLE IS WORTH — ${H} houses x ${W} weeks, ${out.res.length} paired seed sets\n`);
console.log(`  ${pad("set",8)}${rp("blessed%",10)}${rp("reb% ref",10)}${rp("reb% rites",12)}${rp("hurt% ref",11)}${rp("hurt% rites",13)}${rp("died/100 ref",14)}${rp("rites",8)}`);
for(const r of out.res){
  console.log(`  ${pad(r.seed,8)}${rp(pc(r.rites.blessed,r.rites.weeks).toFixed(1),10)}`
    + `${rp(pc(r.ref.rebWeeks,r.ref.weeks).toFixed(1),10)}${rp(pc(r.rites.rebWeeks,r.rites.weeks).toFixed(1),12)}`
    + `${rp(pc(r.ref.hurtWeeks,r.ref.manWeeks).toFixed(1),11)}${rp(pc(r.rites.hurtWeeks,r.rites.manWeeks).toFixed(1),13)}`
    + `${rp(pc(r.ref.died,r.ref.seen).toFixed(1),14)}${rp(pc(r.rites.died,r.rites.seen).toFixed(1),8)}`);
}
const col = (k,f) => out.res.map(r=>f(r[k]));
const st = a => `${Math.min(...a).toFixed(1)}-${Math.max(...a).toFixed(1)} (mean ${(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)})`;
console.log(`\n  blessed weeks   ref ${st(col("ref",r=>pc(r.blessed,r.weeks)))} · rites ${st(col("rites",r=>pc(r.blessed,r.weeks)))}`);
console.log(`  rebellion share ref ${st(col("ref",r=>pc(r.rebWeeks,r.weeks)))} · rites ${st(col("rites",r=>pc(r.rebWeeks,r.weeks)))}`);
console.log(`  hurt man-weeks  ref ${st(col("ref",r=>pc(r.hurtWeeks,r.manWeeks)))} · rites ${st(col("rites",r=>pc(r.hurtWeeks,r.manWeeks)))}`);
console.log(`  died per 100    ref ${st(col("ref",r=>pc(r.died,r.seen)))} · rites ${st(col("rites",r=>pc(r.died,r.seen)))}`);
console.log(`  gold p50        ref ${st(col("ref",r=>r.goldP50))} · rites ${st(col("rites",r=>r.goldP50))}`);
console.log(`  fame p50        ref ${st(col("ref",r=>r.fameP50))} · rites ${st(col("rites",r=>r.fameP50))}`);

const dR = out.res.map(r=>pc(r.rites.rebWeeks,r.rites.weeks) - pc(r.ref.rebWeeks,r.ref.weeks));
const dH = out.res.map(r=>pc(r.rites.hurtWeeks,r.rites.manWeeks) - pc(r.ref.hurtWeeks,r.ref.manWeeks));
const dD = out.res.map(r=>pc(r.rites.died,r.rites.seen) - pc(r.ref.died,r.ref.seen));
const say = (nm,d,dir) => console.log(`  ${pad(nm,18)} ${d.map(x=>x.toFixed(1)).join(", ")}  —  ${d.filter(x=>dir>0?x>0:x<0).length}/${d.length} ${dir>0?"higher":"lower"} under rites, mean ${(d.reduce((a,b)=>a+b,0)/d.length).toFixed(2)}`);
console.log(`\nPAIRED, rites minus reference:`);
say("rebellion share", dR, -1);
say("hurt man-weeks", dH, -1);
say("died per 100", dD, -1);

const g = {}; for(const r of out.res) for(const k of Object.keys(r.rites.gods)) g[k] = (g[k]||0) + r.rites.gods[k];
console.log(`\n  which god rode, under rites: ${Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "none"}`);
await browser.close(); server.close();
