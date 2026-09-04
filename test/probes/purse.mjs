/* IS THERE A POPULATION FOR "A PURSE OF HIS OWN"? — #233's verify-first, answered before building

   Phase queue item #233 wants a renown-qualified man to skim a cut of his own purses into `g.stash`
   until it crosses a fraction of `gladValue(g)`, at which point he asks for his freedom with his own
   money on the table. Its own verify-first names the falsifier and it is a sizing question, not a
   yes/no one:

     "Simulate the skim rate against gladValue(g)'s growth across representative careers to find how
      many post-threshold bouts it actually takes to cross a candidate stash trigger — falsifier: if
      under ~5% of active-roster men ever reach RUDIS_FAME (180 pfame), the same population
      rudisEligible already gates on, this event needs to be sized as rare, not as a common yard
      occurrence."

   And the risk section names the mirror failure, with a precedent: AMB_NEVER's nokill/nobeast
   ambitions measured 0 real "met" events out of 651 issued before their clock was fixed. A skim too
   small, or gated too close to full `rudisEligible`, is dead content in a game whose median career
   is 4-5 bouts.

   So this measures, in one played population:
     1. how far careers actually get — the renown ladder, bout counts, and how many men clear each
        candidate gate at all;
     2. for the men who DO clear a gate, how many further bouts they get afterwards, which is the
        entire window a stash has to accumulate in;
     3. what `gladValue(g)` is at that moment, which is what the stash has to reach a fraction of;
     4. what a bout actually pays, off the record book's own purse total.

   From those four it prices the feature directly: for a candidate skim rate and trigger fraction,
   how many men would ever fire the event, and after how many bouts.

   Run: node test/probes/purse.mjs */
import { serve, open } from "../harness.mjs";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(()=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const H = 12, WEEKS = 160;
  const men = [];            /* one row per man who ever stood in the cells */
  let bouts = 0, purse = 0, weeks = 0;

  for(let h = 0; h < H; h++){
    const d = A.newGameState(`Purse${h}`, "clean", `PURSE-${h}`, null);
    /* per-man high-water marks, sampled every week so a crossing can be dated */
    const seen = new Map();
    for(let w = 0; w < WEEKS && !d.over; w++){
      try { R.lanista(d, {}); } catch(e){ break; }
      if(d.over){ d.over = null; if(d.rebellion) d.rebellion = null; d.unrest = Math.min(d.unrest, 35); }
      weeks++;
      for(const g of (d.gladiators||[])){
        const b = (g.wins||0) + (g.losses||0);
        let s = seen.get(g.id);
        if(!s){ s = { id:g.id, gates:{}, bouts:0, pfame:0, value:0 }; seen.set(g.id, s); }
        s.bouts = b; s.pfame = Math.max(s.pfame, g.pfame||0); s.wins = g.wins||0;
        s.value = A.gladValue(g);
        /* the week each candidate gate was first cleared, and the bout count at that moment */
        for(const gate of [60, 90, 120, 150, 180]){
          if(!s.gates[gate] && (g.pfame||0) >= gate) s.gates[gate] = { w, bouts:b, value:A.gladValue(g) };
        }
        if(!s.rudis && A.rudisEligible(g)) s.rudis = { w, bouts:b };
      }
    }
    if(d.book){ bouts += d.book.n||0; purse += d.book.purse||0; }
    for(const s of seen.values()) if(s.bouts > 0 || s.pfame > 0) men.push(s);
  }

  const perBout = bouts ? purse/bouts : 0;
  const pct = (n, of) => +(n/Math.max(1,of)*100).toFixed(1);
  const fought = men.filter(m=>m.bouts > 0);

  /* 1. how far a career gets */
  const ladder = [60, 90, 120, 150, 180].map(gate=>{
    const hit = men.filter(m=>m.gates[gate]);
    const after = hit.map(m=>m.bouts - m.gates[gate].bouts);
    after.sort((a,b)=>a-b);
    const vals = hit.map(m=>m.gates[gate].value).sort((a,b)=>a-b);
    return { gate, n:hit.length, pctOfFought:pct(hit.length, fought.length),
      boutsAfterMedian: after.length ? after[Math.floor(after.length/2)] : 0,
      boutsAfterMax: after.length ? after[after.length-1] : 0,
      valueMedian: vals.length ? vals[Math.floor(vals.length/2)] : 0 };
  });
  const rudisN = men.filter(m=>m.rudis).length;

  /* 1b. the ceiling: what could a man POSSIBLY put aside, skimming every denarius he earns from
         the gate to the end of his career, against what he is actually worth? */
  const ceiling = [];
  for(const gate of [60, 90, 120]){
    const hit = men.filter(m=>m.gates[gate] && m.bouts > m.gates[gate].bouts);
    const ratios = hit.map(m=>((m.bouts - m.gates[gate].bouts) * perBout) / Math.max(1, m.gates[gate].value)).sort((a,b)=>a-b);
    ceiling.push({ gate, n:hit.length,
      p50: ratios.length ? +(ratios[Math.floor(ratios.length/2)]*100).toFixed(1) : 0,
      p90: ratios.length ? +(ratios[Math.floor(ratios.length*0.9)]*100).toFixed(1) : 0 });
  }

  /* 2. price the feature: for a skim and a trigger fraction, who ever fires it */
  const priced = [];
  for(const gate of [60, 90, 120]){
    for(const skim of [0.15, 0.20, 0.25, 0.30]){
      for(const frac of [0.10, 0.15, 0.20]){
        let fires = 0, boutsNeeded = [];
        for(const m of men){
          const at = m.gates[gate]; if(!at) continue;
          const after = m.bouts - at.bouts;
          if(after <= 0) continue;
          const target = at.value * frac;
          const need = Math.ceil(target / Math.max(1, perBout * skim));
          if(need <= after){ fires++; boutsNeeded.push(need); }
        }
        boutsNeeded.sort((a,b)=>a-b);
        priced.push({ gate, skim, frac, fires, pctOfFought:pct(fires, fought.length),
          needMedian: boutsNeeded.length ? boutsNeeded[Math.floor(boutsNeeded.length/2)] : null });
      }
    }
  }

  /* ---- 3. AND NOW THE REAL THING, PLAYED ----
     Everything above models the feature from career shapes. This plays the shipped code and counts
     what actually happens: how much men really put aside, how many ever get asked, and what the
     ask is worth when it comes. */
  const live = { houses:0, weeks:0, men:0, skimming:0, everStash:0, asked:0, freed:0,
    stashSeen:[], target:[], houseGold:[], bestStash:0, bestTarget:0,
    skimSet:new Set(), stashSet:new Set(), readySet:new Set() };
  for(let h = 0; h < 10; h++){
    const d = A.newGameState(`Live${h}`, "clean", `LIVE-${h}`, null);
    const seen = new Set();
    live.houses++;
    for(let w = 0; w < 160 && !d.over; w++){
      try { R.lanista(d, {}); } catch(e){ break; }
      if(d.over){ d.over = null; if(d.rebellion) d.rebellion = null; d.unrest = Math.min(d.unrest, 35); }
      live.weeks++;
      if(d.pendingEvent && d.pendingEvent.id === "stash"){
        live.asked++;
        const g0 = d.gladiators.find(x=>x.id===d.pendingEvent.data.gid);
        if(g0){ live.stashSeen.push(g0.stash||0); live.target.push(A.stashTarget(g0)); }
      }
      for(const g of (d.gladiators||[])){
        if(!seen.has(g.id)){ seen.add(g.id); live.men++; }
        if(A.skimReady(g)) live.skimSet.add(g.id);
        if((g.stash||0) > 0) live.stashSet.add(g.id);
        if(A.stashReady(d, g)) live.readySet.add(g.id);
        if((g.stash||0) > live.bestStash){ live.bestStash = g.stash||0; live.bestTarget = A.stashTarget(g); }
      }
    }
    live.houseGold.push(Math.round(d.gold));
  }
  live.skimming = live.skimSet.size; live.everStash = live.stashSet.size; live.ready = live.readySet.size;
  delete live.skimSet; delete live.stashSet; delete live.readySet;
  live.stashSeen.sort((a,b)=>a-b);
  live.stashMedian = live.stashSeen.length ? live.stashSeen[Math.floor(live.stashSeen.length/2)] : 0;
  live.targetMedian = live.target.length ? live.target[Math.floor(live.target.length/2)] : 0;

  /* ---- 4. THE ITEM'S SECOND FALSIFIER, WHICH IS THE ONE ABOUT CRUELTY ----
     "Run the refuse-and-keep branch through the same before/after gold-fame-acclaim comparison the
      RUDIS_TAX audit used — falsifier: if aggregate end-of-run gold is HIGHER for players who
      systematically refuse-and-keep than for players who always free or always hand back, the
      punishment side needs raising, not the skim rate lowering."
     Three ropes, identical seeds, differing only in how they answer this one question. */
  const arms = [];
  for(const [name, pick] of [["free him", 0], ["take the money", 1], ["give it back", 2]]){
    let gold = 0, fame = 0, unrest = 0, acclaim = 0, ended = 0, runs = 0;
    for(let h = 0; h < 10; h++){
      const d = A.newGameState(`Arm${h}`, "clean", `LIVE-${h}`, null);
      for(let w = 0; w < 160 && !d.over; w++){
        try { R.lanista(d, { answer:(ev)=> ev && ev.id === "stash" ? pick : null }); } catch(e){ break; }
        if(d.over){ ended++; d.over = null; if(d.rebellion) d.rebellion = null; d.unrest = Math.min(d.unrest, 35); }
      }
      runs++; gold += d.gold; fame += d.fame; unrest += d.unrest; acclaim += A.acclaimOf(d);
    }
    arms.push({ name, gold:Math.round(gold/runs), fame:Math.round(fame/runs),
      unrest:+(unrest/runs).toFixed(1), acclaim:+(acclaim/runs).toFixed(1), ended });
  }

  const bs = fought.map(m=>m.bouts).sort((a,b)=>a-b);
  return { H, weeks, menN:men.length, foughtN:fought.length, bouts, perBout:Math.round(perBout),
    boutsMedian: bs.length ? bs[Math.floor(bs.length/2)] : 0,
    boutsMax: bs.length ? bs[bs.length-1] : 0,
    ladder, rudisN, rudisPct:pct(rudisN, fought.length), priced, ceiling, live, arms,
    RUDIS_FAME:A.RUDIS_FAME, RUDIS_WINS:A.RUDIS_WINS };
});

console.log(`${out.H} houses, ${out.weeks} played weeks · ${out.menN} men ever in the cells, ${out.foughtN} of them fought`);
console.log(`  a career: median ${out.boutsMedian} bouts, longest ${out.boutsMax} · the book paid ${out.perBout}d a bout across ${out.bouts} of them`);
console.log(`\nthe renown ladder — how many of the men who fought ever get there, and what happens after:`);
for(const r of out.ladder)
  console.log(`  pfame ${String(r.gate).padStart(3)} · ${String(r.n).padStart(4)} men (${String(r.pctOfFought).padStart(5)}% of those who fought) `
    + `· median ${String(r.boutsAfterMedian).padStart(2)} more bouts after it (max ${r.boutsAfterMax}) · gladValue there ${r.valueMedian}d`);
console.log(`  rudisEligible (${out.RUDIS_WINS} wins AND ${out.RUDIS_FAME} pfame): ${out.rudisN} men — ${out.rudisPct}% of those who fought`);
console.log(`\nthe ceiling — skimming EVERY denarius he earns after the gate, as a share of what he is worth:`);
for(const cc of out.ceiling)
  console.log(`  pfame ${String(cc.gate).padStart(3)} · n ${String(cc.n).padStart(3)} · median career-total purse is ${cc.p50}% of his gladValue there (top tenth: ${cc.p90}%)`);
console.log(`\npricing the event — who would ever reach a stash of (fraction x gladValue) before his career ends:`);
for(const q of out.priced)
  console.log(`  gate ${String(q.gate).padStart(3)} · skim ${String(Math.round(q.skim*100)).padStart(2)}% · trigger ${Math.round(q.frac*100)}% of value `
    + `⟶ ${String(q.fires).padStart(4)} men fire it (${String(q.pctOfFought).padStart(5)}% of those who fought)`
    + (q.needMedian!=null ? ` · median ${q.needMedian} bouts to get there` : ""));

console.log(`\nand the shipped code, played: ${out.live.houses} houses over ${out.live.weeks} weeks`);
console.log(`  ${out.live.men} men seen · ${out.live.skimming} ever cleared the skim gate · ${out.live.everStash} ever held a denarius · ${out.live.ready} ever stood ready to ask`);
console.log(`  the fattest bag anybody reached: ${out.live.bestStash}d against a target of ${out.live.bestTarget}d`);
console.log(`  the ask came up ${out.live.asked} times · median bag ${out.live.stashMedian}d against a median target of ${out.live.targetMedian}d`);

console.log(`\nthe cruelty falsifier — ten houses each, same seeds, answering this one question three ways:`);
for(const a of out.arms)
  console.log(`  always "${a.name.padEnd(14)}" ⟶ end gold ${String(a.gold).padStart(6)} · fame ${String(a.fame).padStart(5)} · unrest ${String(a.unrest).padStart(5)} · acclaim ${String(a.acclaim).padStart(5)} · runs ended early ${a.ended}`);

await browser.close(); server.close();
