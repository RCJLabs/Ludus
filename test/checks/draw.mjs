/* #108 — THE WEEK ASKS ONE QUESTION, AND IT WAS NOT DRAWN FAIRLY.

   `pickEvent` shuffles the event keys and returns the first whose `make(d)` gives something back.
   The shuffle was `Object.keys(EVENTS).sort(()=>R()-0.5)`, which is not a shuffle: a comparator
   that ignores its arguments and returns a random sign leaves the result to the sort's internal
   access pattern, and V8's TimSort walks an array in a fixed order, so keys stay near where they
   started. The list is the declaration order of EVENTS. What the game asked you depended on where
   in the file the event was written.

   HOW BIG, because the first figure measured was four times too large and nearly got reported as
   the finding. Over 20,000 draws of the real 57-key list the old line put a key FIRST between
   1.05% and 5.38% of the time — a 5.1x spread. But `pickEvent` takes the first ELIGIBLE key, not
   position zero, and that washes most of it out: taking the first eligible key, 40,000 draws each,
   two adjacent events came out 1.03x, a block of six 1.14x, two at opposite ends 1.27x, six
   scattered 1.35x, and the seven a real house actually had 1.39x — against 1.01x to 1.06x for a
   real shuffle. So it is a **1.3 to 1.4x skew toward events written earlier in the file**.

   The file already contained the right shuffle. `shuffled()` is a Fisher-Yates written for the
   melee and used in nine other places; the one draw that decides what the game says to you was
   the one that did not call it.

   ONE THING THIS CHECK DELIBERATELY DOES NOT ASSERT. The sweep that started the item found
   `bodyguard` eligible in 43% and 41% of the weeks of two played arms and asked ZERO times in 272
   house-weeks. That is not explained by this fault — `bodyguard` sits early in the list, where the
   old sort FAVOURED it — so it is either small-sample noise or something else, and it is recorded
   here as an open question rather than dressed up as evidence for a fix it does not support. */

import { hasHandle } from "../harness.mjs";

export const name = "draw";
export const describe = "the week's one question is drawn fairly, whatever order the events are written in";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], note = [];
    const KEYS = Object.keys(A.EVENTS);
    const N = 20000;

    /* ---- 1. THE SHUFFLE ITSELF MUST BE ONE ----
       every key must come out first about as often as every other. This is the cheap half and it
       does not need a game state, so it is the assertion that will still be true in ten years. */
    const first = {};
    for(const k of KEYS) first[k] = 0;
    for(let i=0;i<N;i++) first[A.shuffled(KEYS)[0]]++;
    const pcs = KEYS.map(k=>first[k]/N*100);
    const spread = Math.max(...pcs) / Math.max(0.001, Math.min(...pcs));
    const fair = 100/KEYS.length;
    /* at 20,000 draws over 57 keys the noise floor measured 1.3x; 1.8x is comfortably clear of it
       and nowhere near the 5.1x the broken comparator produced */
    if(spread > 1.8)
      bad.push(`the event draw is not uniform: over ${N} shuffles a key came out first between `
        + `${Math.min(...pcs).toFixed(2)}% and ${Math.max(...pcs).toFixed(2)}% of the time, a `
        + `${spread.toFixed(1)}x spread against a fair ${fair.toFixed(2)}% — so what the week asks `
        + `depends on where in the file the event is written`);

    /* ---- 2. AND THE STATISTIC THAT ACTUALLY DECIDES WHAT IS ASKED ----
       the first ELIGIBLE key, which is what pickEvent returns. The shapes below are the ones that
       separated a real shuffle from the broken one: adjacent pairs barely showed it, scattered
       sets showed it most. */
    const shapes = [
      { name:"two at opposite ends", idx:[2, KEYS.length-3] },
      { name:"six scattered evenly", idx:[2,11,20,29,38,47].filter(i=>i<KEYS.length) },
      { name:"a contiguous block of six", idx:[20,21,22,23,24,25].filter(i=>i<KEYS.length) },
    ];
    const rows = [];
    for(const sh of shapes){
      const elig = sh.idx.map(i=>KEYS[i]);
      const set = new Set(elig), won = {};
      for(const k of elig) won[k] = 0;
      for(let i=0;i<N;i++){ const hit = A.shuffled(KEYS).find(k=>set.has(k)); if(hit) won[hit]++; }
      const ps = elig.map(k=>won[k]/N*100);
      const sp = Math.max(...ps) / Math.max(0.001, Math.min(...ps));
      rows.push({ name:sh.name, n:elig.length, ps:ps.map(x=>+x.toFixed(1)), sp:+sp.toFixed(2) });
      if(sp > 1.15)
        bad.push(`with ${sh.name} eligible, the first-eligible draw favours one over another `
          + `${sp.toFixed(2)}x (${ps.map(x=>x.toFixed(1)+"%").join(" / ")}) — position in the file `
          + `should not decide what the week asks`);
    }

    /* ---- 3. AND IT MUST STILL WORK AS A DRAW, on a real house ----
       a state a dozen weeks in, drawn from many times, each on its own clone because make()
       mutates — which is the reason cons63 tested the primacy's eligibility on a clone too */
    const d = A.newGameState("Dw","clean","DRAW-CHK",null);
    d.gold = 6000;
    while(A.activeG(d).length<5 && !A.rosterFull(d)){
      const m=(d.market||[])[0]; if(!m) break; if(!A.buyFromBlock(d,m.id,null)) break; }
    for(let w=0;w<10;w++){
      for(const g of A.activeG(d)) A.setRegimenOf(d,g.id,"palus");
      d.pendingEvent = null; try{ A.endWeek(d); }catch(e){ break; }
    }
    d.pendingEvent = null;
    const eligible = KEYS.filter(k=>{ try { return !!A.EVENTS[k].make(A.clone(d)); } catch(e){ return false; } });
    const won = {}; let nulls = 0;
    for(let i=0;i<2000;i++){
      const ev = A.pickEvent(A.clone(d));
      if(!ev){ nulls++; continue; }
      const id = ev.id || ev.key || "unnamed";
      won[id] = (won[id]||0) + 1;
    }
    const drawn = Object.keys(won);
    if(!drawn.length) bad.push(`pickEvent returned nothing at all in 2000 draws on a house at week ${d.week}`);
    for(const id of drawn)
      if(!eligible.includes(id))
        note.push(`pickEvent returned ${id}, which the eligibility probe did not list — make() reads state the clone test cannot see`);
    if(eligible.length >= 3 && drawn.length < 2)
      bad.push(`${eligible.length} events were eligible and 2000 draws produced only ${drawn.length}`);

    return { bad, note, KEYS:KEYS.length, N, spread:+spread.toFixed(2), fair:+fair.toFixed(2),
      lo:+Math.min(...pcs).toFixed(2), hi:+Math.max(...pcs).toFixed(2), rows,
      week:d.week, eligible:eligible.length, drawn:drawn.length, nulls,
      dist:Object.entries(won).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${(v/2000*100).toFixed(1)}%`) };
  });

  const lines = [];
  lines.push(`${out.KEYS} events · ${out.N} shuffles: a key comes out first ${out.lo}% to ${out.hi}%`
    + ` (fair is ${out.fair}%), a ${out.spread}× spread`);
  for(const r of out.rows)
    lines.push(`  first eligible of ${r.name.padEnd(26)} ${r.ps.map(x=>x+"%").join(" / ")} — ${r.sp}×`);
  lines.push(`on a house at week ${out.week}: ${out.eligible} events eligible, ${out.drawn} of them drawn in 2000`
    + (out.nulls ? ` (${out.nulls} drew nothing)` : ""));
  lines.push(`  ${out.dist.slice(0,8).join(" · ")}`);
  for(const n of out.note) lines.push(`  ${n}`);

  const fails = [...out.bad];
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
