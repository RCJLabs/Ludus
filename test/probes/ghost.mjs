/* THE GHOST NEMESIS — who actually clears `d.nemesis`, caught in the act

   `named.mjs` measured that 81-82% of fighter-nemesis episodes end SILENTLY, most of them with the
   man still standing on his own house's roster — which no clear site in the file explains by reading.
   Weekly diffing could not go further: the clear rate turned out to be three times the visible episode
   rate, because most episodes are born and unmade INSIDE one week, between two week-end reads.

   So this stops diffing and traps the assignment itself: `Object.defineProperty(d, "nemesis", {set})`
   with a stack capture names the clearing function, and at each clear the fid is searched everywhere —
   the named house, every rival roster, the circuit. What it found, 12 houses x 300 weeks:

     · 736 of 868 nemeses are CIRCUIT men, named at ludus.jsx:14568 with a synthetic house
       ({name:f.house, fighters:d.circuit}, f.house drawn from SMALL_HOUSES) —
     · and 732 of them are unmade the SAME WEEK by nemesisWeek at ludus.jsx:10007, whose lookup
       `(d.rivals||[]).find(x=>x.name===n.house)` only knows the rival houses and can never resolve a
       small-house name. `still` is undefined, 10009 nulls him, no line is written.
     · worse, a HATED circuit man (he killed one of yours) EVICTS a standing rival-house nemesis first
       (the one-at-a-time rule at 9997 yields to hated) and then evaporates — so of 132 rival-born
       episodes, 111 ended as that eviction and only 17 ever ended through a real channel.

   The general lesson: when a weekly diff cannot attribute a transition, trap the write. A setter on
   the save's own field costs ten lines and answers "who did this" with a stack instead of a guess.

   FIXED IN v3.28.0 — on the repaired build this prints a different world, and should: same-week
   clears fall from ~740 to single digits, nemesisSettled becomes the top clearing function, and most
   title changes are hated handovers (sets, not clears — the eviction rule holds a hated name against
   the next killer). If "nemesisWeek · CIRCUIT man · dur:0w" ever dominates this table again, the
   lookup has regressed; the `named` check in test/checks/ holds the rule. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 12), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "NFA";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const sigs = {};
  let rivalSet = 0, circSet = 0, evictions = 0, rivalClear = 0, circClear = 0, sameWeek = 0;
  for(let h=0; h<H; h++){
    const d = A.newGameState("Gh"+h, "clean", `${SEED}-${h}`, null);
    let _nem = d.nemesis, setWk = null;
    const isCirc = v => v && (d.circuit||[]).some(f=>f.id===v.fid);
    Object.defineProperty(d, "nemesis", {
      get(){ return _nem; },
      set(v){
        if(v && (!_nem || _nem.fid!==v.fid)){
          if(isCirc(v)) circSet++; else rivalSet++;
          if(_nem && !isCirc(_nem) && isCirc(v)) evictions++;
          setWk = d.week;
        }
        if(_nem && !v){
          const n = _nem, circ = isCirc(n);
          if(circ) circClear++; else rivalClear++;
          const dur = d.week - (setWk==null ? n.since : setWk);
          if(dur === 0) sameWeek++;
          const fn = (new Error().stack||"").split("\n")[2].trim().split("(")[0].replace("at ","").trim();
          const named = (d.rivals||[]).find(x=>x.name===n.house);
          const holder = (d.rivals||[]).find(x=>x.fighters.some(f=>f.id===n.fid));
          const sig = [fn,
            circ ? "CIRCUIT man" : "rival man",
            "namedHouse:"+(named ? (named.retired?"retired":"live") : "ABSENT"),
            "fidIn:"+(holder ? (holder.name===n.house?"sameHouse":"otherHouse") : circ ? "circuit" : "nowhere"),
            "dur:"+(dur===0?"0w":dur<4?"1-3w":"4w+")].join(" · ");
          sigs[sig] = (sigs[sig]||0)+1;
        }
        _nem = v;
      },
      configurable: true
    });
    for(let w=0; w<W; w++){ if(d.over) break; R.lanista(d); }
  }
  return { sigs, rivalSet, circSet, evictions, rivalClear, circClear, sameWeek };
}, [H, W, SEED]);

console.log(`\n${H} houses x ${W}w · seed "${SEED}"`);
console.log(`nemeses named: ${out.rivalSet} rival men · ${out.circSet} circuit men`);
console.log(`clears: ${out.rivalClear} rival · ${out.circClear} circuit · ${out.sameWeek} cleared the same week they were named`);
console.log(`standing rival nemeses EVICTED by a hated circuit man: ${out.evictions}\n`);
console.log(`  every clear, by the function that did it and the state of the man at that instant:`);
for(const [k,v] of Object.entries(out.sigs).sort((a,b)=>b[1]-a[1]))
  console.log(`  ${String(v).padStart(5)}  ${k}`);

await browser.close(); server.close();
