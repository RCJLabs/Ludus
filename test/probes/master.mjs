/* IS THERE ANYTHING LEFT TO GATE? — #232 phase 5's verify-first, which the item does not state

   Phase 5 asks to "require a won spar to convert g.teaching/g.learning into a granted technique or
   g.mastery (currently pure wins/pfame + time/fee thresholds)". Two things have to be true before
   that is a good idea, and the item asserts neither:

     1 · MASTERY HAS TO BE REACHABLE TODAY. `canMaster` wants an active man with 12 wins and 55
         renown, and `makeMaster` is a player action — `makeMasterOf`, behind a click. Adding a
         second gate to a thing almost nobody reaches deletes it rather than deepening it. So this
         counts, over played houses: how many men ever clear MASTERY_GATE, how long they take, and
         how many are still alive when they get there.

     2 · THE SQUARE HAS TO BE REACHABLE AT ALL. It is not. `d.pendingSpar` is written in exactly two
         places — `holdTourney`'s final and `EVENTS.feud`'s first answer — and `regimen:"spar"` is a
         weekly TRAINING pairing, not a bout. There is no way for a player to put two of his own men
         in the square because he wants to. So "require a won spar" has a missing prerequisite, and
         this measures how often the two existing doors actually open.

   And the thing the gate would have to be sized against: how often does a man beat somebody at
   least as good as he is? If the answer is "almost never", the bar is a wall.

   Run: node test/probes/master.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 14), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "MSTR";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const houses = [];
  let sparDoors = 0, feudDoors = 0, tourneyDoors = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Ms"+h, "capua", `${SEED}-${h}`);
    const row = { h, weeks:0, men:0, eligible:0, mastered:0, everEligible:new Set(),
      firstAt:null, aliveAtGate:0, deadBefore:0, twoUp:0, opened:0, feudSeen:0 };
    const seen = new Set(), mark = new Set();
    for(let w=0; w<W && !d.over; w++){
      /* THE MARKER IS GONE BY THE TIME THE WEEK RETURNS. `endWeek` resolves `d.pendingSpar` inside
         the same `lanista` call, so watching the field after the week reports zero spars on a build
         where spars are happening — which the first draft of this probe published as "the square
         never opens in 2,815 weeks". The aftermath is what survives, so count the chronicle. */
      try { R.lanista(d, {}); } catch(e){ break; }
      row.weeks++;
      /* `chron` UNSHIFTS — the newest line is at index 0 and the log rolls off the far end. Slicing
         from the old length reads the OLDEST entries, which is how the first two drafts of this
         probe reported "0 spars in 2,815 weeks" twice, once blaming the marker and once the
         chronicle text. Newest few, deduped by week and line. */
      for(const L of (d.log||[]).slice(0, 14)){
        const t = L.text || "", key = `${L.week}|${t.slice(0,40)}`;
        if(mark.has(key)) continue;
        mark.add(key);
        if(/wooden swords and the doctore counting/.test(t)){ row.opened++; sparDoors++; feudDoors++; }
        else if(/came out on top of the lot|the whole yard against itself for an afternoon/.test(t)){
          row.opened++; sparDoors++; tourneyDoors++; }
        else if(/In The Yard|will not let it go/.test(t)) row.feudSeen++;
      }
      for(const g of (d.gladiators||[])){
        if(!seen.has(g.id)){ seen.add(g.id); row.men++; }
        if(A.canMaster(d, g)){
          if(!row.everEligible.has(g.id)){
            row.everEligible.add(g.id);
            if(row.firstAt == null) row.firstAt = d.week;
          }
        }
        if(g.mastery) row.mastered++;
      }
      /* two men in the yard who could stand up to each other at all */
      const act = A.activeG(d).filter(g=>g.status==="active");
      if(act.length >= 2) row.twoUp++;
    }
    row.eligible = row.everEligible.size;
    delete row.everEligible;
    houses.push(row);
  }

  /* ---- and how hard is "beat somebody at least as good as you" ---- */
  const d0 = A.newGameState("Bar", "clean", `${SEED}-bar`, null);
  const man = q => { const g = A.genGladiator(d0, q); g.id = d0.nextId++; g.status="active";
    g.mine = true; g.kit = A.defaultKit(g.cls); return g; };
  let up = 0, upWon = 0, even = 0, evenWon = 0;
  for(let i=0;i<1500;i++){
    const a = man(45+Math.floor(Math.random()*45)), b = man(45+Math.floor(Math.random()*45));
    const va = A.gladValue(a), vb = A.gladValue(b);
    if(!(va>0 && vb>0)) continue;
    const res = A.simulateSpar(A.clone(a), A.clone(b), "measured", { d:d0 }, {});
    const aWon = res.winner === "A";
    if(vb >= va * 1.15){ up++; if(aWon) upWon++; }
    else if(Math.abs(vb - va) / Math.max(va,vb) < 0.08){ even++; if(aWon) evenWon++; }
  }

  /* ---- 4. AND WITH THE DOOR OPEN, IS THE GATE A GATE OR A WALL? ----
     A lanista who wants a master picks the matchup himself: his candidate against the best man in
     the yard the candidate can still be priced at or under. One afternoon a week. This counts how
     many weeks that takes, played out on real houses, and how much of the roster it costs. */
  const proving = (()=>{ const rows = [];
    for(let h=0; h<8; h++){
      const d = A.newGameState("Pr"+h, "capua", `${SEED}-pr-${h}`);
      let tries = 0, proved = 0, hurt = 0, mastered = 0, firstProve = null, firstMaster = null;
      for(let w=0; w<W && !d.over; w++){
        try { R.lanista(d, {}); } catch(e){ break; }
        /* the candidate: the man closest to the mastery gate who has not proved it */
        const act = A.activeG(d).filter(g=>g.status==="active");
        const cand = act.filter(g=>!g.mastery && !A.provedIt(g))
          .sort((x,y)=>(y.wins||0)+(y.pfame||0)/10 - ((x.wins||0)+(x.pfame||0)/10))[0];
        if(cand){
          /* the cheapest man who still prices at or above him — beating a giant proves nothing extra */
          const foe = act.filter(g=>g.id!==cand.id && A.gladValue(g) >= A.gladValue(cand))
            .sort((x,y)=>A.gladValue(x)-A.gladValue(y))[0];
          if(foe && A.squareReady(d, cand, foe)){
            const before = act.filter(g=>g.status==="active").length;
            if(A.challengeSquare(d, cand.id, foe.id)){
              tries++;
              const p = d.pendingSpar; d.pendingSpar = null;
              let res = A.doSpar(d, p.aid, p.bid, null, null, p.kind);
              if(res && res.crux){ res.pending.beats = res.beats; res = A.doSpar(d, p.aid, p.bid, res.pending, "run"); }
              if(A.activeG(d).filter(g=>g.status==="active").length < before) hurt++;
              if(A.provedIt(cand) && firstProve == null){ firstProve = d.week; }
            }
          }
        }
        for(const g of A.activeG(d)){
          if(A.canMaster(d, g)){ if(A.makeMaster(d, g)){ mastered++; if(firstMaster==null) firstMaster = d.week; } }
        }
        proved = d.gladiators.filter(g=>A.provedIt(g)).length;
      }
      rows.push({ h, tries, proved, hurt, mastered, firstProve, firstMaster, week:d.week });
    }
    return rows; })();

  return { houses, sparDoors, feudDoors, tourneyDoors, proving,
    bar: { up, upWon, even, evenWon } };
}, [H, W, SEED]);

const sum = (a,k) => a.reduce((s,x)=>s+(x[k]||0),0);
const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length?v[Math.floor(v.length/2)]:null; };

console.log(`\n=== 1. IS MASTERY REACHABLE? (${out.houses.length} houses x up to ${W} weeks) ===`);
const totMen = sum(out.houses,"men"), totElig = sum(out.houses,"eligible");
console.log(`  ${totMen} men ever in the cells · ${totElig} of them cleared MASTERY_GATE (${(100*totElig/Math.max(1,totMen)).toFixed(1)}%)`);
console.log(`  houses that ever had one: ${out.houses.filter(h=>h.eligible>0).length} of ${out.houses.length}`);
console.log(`  first eligible man arrived at week: ${out.houses.filter(h=>h.firstAt).map(h=>h.firstAt).sort((a,b)=>a-b).join(", ") || "never"}`);
console.log(`  per house: ${out.houses.map(h=>`${h.eligible}/${h.men}`).join(" · ")}`);

console.log(`\n=== 2. HOW OFTEN DOES THE SQUARE OPEN AT ALL? ===`);
console.log(`  ${out.sparDoors} spars over ${sum(out.houses,"weeks")} played weeks — ${out.feudDoors} from a feud, ${out.tourneyDoors} from a tournament`);
console.log(`  per house: ${out.houses.map(h=>h.opened).join(" · ")} · ${out.houses.filter(h=>h.opened>0).length} of ${out.houses.length} houses saw one at all`);
console.log(`  and there is NO third door: the player cannot put two of his men in the square because he wants to`);

console.log(`\n=== 3. HOW HARD IS "BEAT SOMEBODY AT LEAST AS GOOD AS YOU"? ===`);
const B = out.bar;
console.log(`  against a man worth 15% more: ${B.upWon} of ${B.up} (${(100*B.upWon/Math.max(1,B.up)).toFixed(1)}%)`);
console.log(`  against a man worth the same:  ${B.evenWon} of ${B.even} (${(100*B.evenWon/Math.max(1,B.even)).toFixed(1)}%)`);
console.log(`\n=== 4. WITH THE DOOR OPEN: IS THE GATE A GATE OR A WALL? ===`);
const P = out.proving;
console.log(`  ${P.length} houses, one afternoon a week when there was a matchup worth having:`);
for(const x of P) console.log(`    h${x.h}: ${String(x.tries).padStart(3)} afternoons · ${x.proved} men proved it · ${x.mastered} became masters`
  + ` · first proof w${x.firstProve||"-"} · first master w${x.firstMaster||"-"} · ${x.hurt} afternoons cost somebody the roster · house ended w${x.week}`);
const tot = k => P.reduce((s,x)=>s+(x[k]||0),0);
console.log(`  totals: ${tot("tries")} afternoons · ${tot("proved")} proved · ${tot("mastered")} masters · ${tot("hurt")} left a man off the roster`);
console.log("");

await browser.close(); server.close();
