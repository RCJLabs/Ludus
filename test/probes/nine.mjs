/* HOW MANY OF THE NINE DOES A PLAYER EVER MEET?

   `LANISTAE` holds nine rival lanistae, each written the way the three founders are — a name, a
   distinguishing trait, a blurb, and seven dials that drive real behaviour:

       poach        how hard he goes after your men     36 read sites
       bid          how hard he bids on the block       18
       train        how much he drills                  11
       bribe        the editor                           3
       sabotage     the grain, the water                 2
       grudgeDecay  how fast his anger cools             `rivalWeek`, line ~7123
       stature      the fame his house is pulled toward  line ~7210

   THREE of them — Solonius, Vettius, Tullius — are named in `RIVAL_SEED` and are in every game from
   week one. The other SIX exist only in `NEW_HOUSES`, and the only door into the bay is `bayRefill`,
   which fires when `liveRivals` drops under `BAY_FLOOR` (3) — that is, after a house retires.
   `probes/dynasty.mjs` measured retirement at **0.58 times per multi-decade campaign**.

   So the question is not whether the six are written — they are, fully, and every dial is read — but
   whether anybody meets them, and whether meeting one is a different game from meeting another.

     1 · HOW MANY DISTINCT LANISTAE a campaign ever fields, and how many the player actually FIGHTS
         rather than merely has in the table. A house the editor never matches you against is a name
         in a list.

     2 · AND WHETHER THE DIALS ARE A PERSONALITY OR A DECORATION — the question that decides the
         size of the item. `rivalWeek` picks each house's weekly move from `RIVAL_MOVES`, weighted by
         its own lanista's dials. Those weights are PURE FUNCTIONS of the house, so the intended
         difference is computed here exactly rather than sampled: no simulation, no seed, no rope.
         (`rivalWeek` is not on the handle and this needs no export to answer.) What simulation
         could add is how often each move's `when` gate opens, which is a fact about the house's
         state rather than about who is holding the dials.

     3 · AND WHAT A SECOND DOOR WOULD COST. The bay is pinned at three live houses by `BAY_FLOOR`,
         so a seventh face can only arrive by replacing one of the three. This counts how much of a
         campaign the bay actually spends at that floor.

   WHAT IT ANSWERED, over 16 campaigns and 3,923 played weeks:

       Solonius, Vettius, Tullius   in the bay 16/16, FOUGHT 16/16 — every game, all three
       the other six                in the bay 1-3 of 16, fought 0-3
       Rufinus and Pollio           NEVER FOUGHT, in sixteen campaigns
       distinct lanistae fought     THREE, of nine, every time

   and the dials are emphatically a personality: computed off `RIVAL_MOVES`' own weights, Pollio buys
   on 25% of his weeks against Cossutius's 6.5%, and the hostile dials span 0.7-2.2 / 0.5-2.0 /
   0.5-1.9. Two thirds of the written opposition sat behind a door opening once every other campaign.

   AFTER v3.197.0, which draws the three seats from all nine and tiers them by `stature`: every one
   of the nine is in the bay in 19-56% of campaigns and fought in 19-56%. The bay is still three
   houses and still opens soft/middling/hard; what changed is who is in it.

   Run: node test/probes/nine.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "NINE";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const seen = {}, fought = {}, campaigns = [];
  let weeks = 0, atFloor = 0, liveSum = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Nn"+h, "clean", `${SEED}-${h}`);
    const mine = new Set(), myFought = new Set();
    for(let w=0; w<W && !d.over; w++){
      try { R.lanista(d, {}); } catch(e){ break; }
      weeks++;
      const live = (d.rivals||[]).filter(x=>!x.retired);
      liveSum += live.length;
      if(live.length <= A.BAY_FLOOR) atFloor++;
      for(const r of live){ mine.add(r.name); seen[r.name] = (seen[r.name]||0)+1; }
    }
    /* FOUGHT, not merely present: `d.book.house` is the game's own record of cards against a house */
    const bk = (d.book && d.book.house) || {};
    for(const k of Object.keys(bk)) if((bk[k].n||0) > 0 && A.LANISTAE[k]) myFought.add(k);
    for(const k of myFought) fought[k] = (fought[k]||0)+1;
    campaigns.push({ h, weeks:d.week, seen:[...mine], fought:[...myFought] });
  }

  /* ---- 2: the weight vectors, computed ---- */
  const keys = Object.keys(A.LANISTAE);
  const moveKeys = Object.keys(A.RIVAL_MOVES);
  const vec = {};
  for(const k of keys){
    /* a house wearing this name, otherwise identical — the weights read only `h.name` through
       `lanistaOf`, so nothing else about the house can move them */
    const hh = { name:k, fame:900, grudge:30, warm:10, form:0, formTier:0, fighters:[], star:null };
    const raw = {}; let tot = 0;
    for(const m of moveKeys){
      let w = 1;
      try { w = A.RIVAL_MOVES[m].weight(hh); } catch(e){ w = 0; }
      if(!(w >= 0)) w = 0;
      raw[m] = w; tot += w;
    }
    vec[k] = { raw, share: Object.fromEntries(moveKeys.map(m=>[m, tot ? raw[m]/tot : 0])) };
  }

  return { seen, fought, campaigns, weeks, atFloor, liveSum, moveKeys, vec,
    keys, seeds: A.RIVAL_SEED.map(x=>x[0]), pool: A.NEW_HOUSES.map(x=>x.key), floor: A.BAY_FLOOR,
    dials: Object.fromEntries(keys.map(k=>[k, A.LANISTAE[k]])) };
}, [H, W, SEED]);

const pc = (a,b) => b ? `${(100*a/b).toFixed(0)}%` : "-";
const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length?v[Math.floor(v.length/2)]:0; };
const N = out.campaigns.length;

console.log(`\n=== 1. HOW MANY OF THE NINE DOES A CAMPAIGN MEET? (${N} campaigns, ${out.weeks} played weeks) ===`);
console.log(`  the bay is drawn from all nine as of v3.197.0 — RIVAL_SEED is kept only as a fallback`);
console.log(`  ${"house".padEnd(12)}${"".padEnd(8)}  in the bay      ever fought`);
for(const k of out.keys){
  const inBay = out.campaigns.filter(c=>c.seen.includes(k)).length;
  const f = out.fought[k]||0;
  console.log(`  ${k.padEnd(12)}${out.seeds.includes(k)?"(seed) ":"       "}  ${String(inBay).padStart(3)}/${N} ${pc(inBay,N).padStart(5)}   ${String(f).padStart(3)}/${N} ${pc(f,N).padStart(5)}`);
}
console.log(`  distinct per campaign: in the bay p50 ${med(out.campaigns.map(c=>c.seen.length))} · FOUGHT p50 ${med(out.campaigns.map(c=>c.fought.length))} — of nine`);
console.log(`  the bay sits at or under its floor of ${out.floor} on ${pc(out.atFloor,out.weeks)} of weeks · mean live houses ${(out.liveSum/out.weeks).toFixed(2)}`);

console.log(`\n=== 2. ARE THE DIALS A PERSONALITY? (RIVAL_MOVES weights, computed exactly) ===`);
const mk = out.moveKeys;
console.log(`  ${"house".padEnd(12)}` + mk.map(m=>m.slice(0,7).padStart(8)).join("") + `   poach  bribe  sabo`);
for(const k of out.keys){
  const D = out.dials[k], v = out.vec[k].share;
  console.log(`  ${k.padEnd(12)}` + mk.map(m=>`${(100*v[m]).toFixed(0)}%`.padStart(8)).join("")
    + `${String(D.poach).padStart(8)}${String(D.bribe).padStart(7)}${String(D.sabotage||"-").padStart(6)}`);
}
const spread = m => { const xs = out.keys.map(k=>out.vec[k].share[m]);
  return { lo:Math.min(...xs), hi:Math.max(...xs) }; };
console.log(`  spread across the nine, by move:`);
for(const m of mk){ const s = spread(m);
  console.log(`    ${m.padEnd(9)} ${(100*s.lo).toFixed(1)}% → ${(100*s.hi).toFixed(1)}%  (x${s.lo>0?(s.hi/s.lo).toFixed(2):"∞"})`); }
const hostile = ["poach","bribe","sabotage"];
for(const dkey of hostile){ const xs = out.keys.map(k=>out.dials[k][dkey]).filter(x=>x!=null);
  console.log(`    ${dkey.padEnd(9)} dial ${Math.min(...xs)} → ${Math.max(...xs)}  (x${(Math.max(...xs)/Math.min(...xs)).toFixed(2)}) on ${xs.length} of 9`); }
console.log("");

await browser.close(); server.close();
