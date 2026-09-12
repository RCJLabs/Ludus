/* WHAT THE DIE WILL NOT SAY ON THE ROAD — #268's verify-first.

     node test/probes/camp.mjs 4 160 8      # houses, weeks, sample stride

   #268: "Count the die: of the 36 drawn events, how many `make()` gates return null on `d.city` —
   the number of cards that simply cannot fire away." The die itself IS rolled away: the call site
   is `if(!d.pendingEvent && !d.rome && R()<0.45)`, and only Rome blocks it. `evPool` filters on
   cooldown and nothing else. So every gate that shuts on the road shuts inside its own `make()`.

   THE MEASUREMENT IS PAIRED AT THE CALL, not across runs. `make()` draws from `R()`, so asking the
   same question of a house at home and the same house in Pompeii without resetting the stream
   compares two different rolls and reports `R() > 0.14` as a road gate. Each key is asked four
   times off ONE saved stream position — home, in a town, on the road between towns, and at Rome —
   and the stream is put back between each, so the only thing that differs is where the house is.
   The whole sweep is bracketed with `rngGet`/`rngSet` on `tail.mjs`'s precedent, so the run being
   sampled is not re-phased by the sampling.

   AND EVERY ASK GETS ITS OWN CLONE, because `make()` may write to `d` — several stamp a flag or a
   cooldown week on the way out. Asking thirty-six keys of one object would let the first mutation
   colour the thirty-five after it, differently in each of the four conditions, and the pairing
   would be gone by the tenth key.

   WHAT A FLAG TEST CANNOT SEE, and what the second arm is for: a touring house is not a Capua house
   with a field set. It has no buildings to burn, no doctore's board, no patrons in the room. So arm
   1 is the gate on the flag, holding everything else equal — the item's literal question — and arm
   2 is the realised eligibility under a real `tour:true` rope against the reference, which folds
   the state differences back in. A card can be open on the flag and still never fire away. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 4), W = +(process.argv[3] || 160), STRIDE = +(process.argv[4] || 8);
/* ARM 1 IS RUN UNDER THE FULL POLICY BY DEFAULT. The first pass used the reference rope and 15 of
   the 36 keys were never eligible at home in any sample, so they could not be classified at all —
   and publishing "8 of 21" when the denominator is 36 is the shape of fault this audit keeps
   catching. A house that opens every door reaches the gates a poor one never sees. */
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };
const DRIVE = process.argv[5] === "ref" ? {} : MOST;

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, STRIDE, DRIVE])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["EVENTS","EV_DRAWN","rngGet","rngSet","newGameState","CITY_KEYS","CITIES","setOut"]
    .filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const cp = x => JSON.parse(JSON.stringify(x));
  const KEYS = A.EV_DRAWN.slice();
  const TOWN = A.CITY_KEYS[0];

  /* the four places a house can be standing when the die is rolled */
  const WHERE = {
    home:  d => { d.city = null; d.travel = null; d.rome = null; },
    town:  d => { d.city = TOWN; d.travel = null; d.rome = null; },
    road:  d => { d.city = null; d.rome = null; d.travel = { to:TOWN, weeks:2, home:false }; },
    rome:  d => { d.city = null; d.travel = null; d.rome = { travel:0, fought:0, won:0 }; },
  };
  const PLACES = Object.keys(WHERE);

  const row = {}; for(const k of KEYS){ row[k] = {}; for(const q of PLACES) row[k][q] = 0; }
  let samples = 0;

  /* ---- 1. the gate on the flag, everything else held ---- */
  for(let i=0;i<H;i++){
    const d = A.newGameState("Cm","clean",`CAMP-${i}`);
    for(let w=0; w<W; w++){
      if(d.over) break;
      if(w % STRIDE === 0 && w >= STRIDE){
        const st0 = A.rngGet();
        samples++;
        for(const k of KEYS){
          const at = A.rngGet();
          for(const q of PLACES){
            A.rngSet(at);
            const e = cp(d); WHERE[q](e);
            let got = null; try { got = A.EVENTS[k].make(e); } catch(err){ got = null; }
            if(got) row[k][q]++;
          }
        }
        A.rngSet(st0);
      }
      try { R.lanista(d, DRIVE); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
    }
  }

  /* ---- 2. and what a real tour actually meets ---- */
  const realised = (opts, tag)=>{
    const seen = {}; for(const k of KEYS) seen[k] = 0;
    let weeks = 0, away = 0, asked = 0;
    for(let i=0;i<H;i++){
      const d = A.newGameState("Cm","clean",`CAMPR-${tag}-${i}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        weeks++; if(d.city || d.travel) away++;
        if(w % STRIDE === 0 && w >= STRIDE){
          const st = A.rngGet(); asked++;
          for(const k of KEYS){
            const e = cp(d);
            let got = null; try { got = A.EVENTS[k].make(e); } catch(err){ got = null; }
            if(got) seen[k]++;
          }
          A.rngSet(st);
        }
        try { R.lanista(d, opts); } catch(e){}
        try { A.endWeek(d); } catch(e){ break; }
      }
    }
    return { seen, weeks, away, asked };
  };
  const ref  = realised(DRIVE, "ref");
  const tour = realised(Object.assign({ tour:true }, DRIVE), "tour");

  return { KEYS, row, samples, places:PLACES, town:A.CITIES[TOWN].name, ref, tour };
}, [H, W, STRIDE, DRIVE]);

await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const pct = (n, of) => of ? (100*n/of).toFixed(1) : "0.0";
console.log(`\n#268 — THE DIE ON THE ROAD · ${H} houses x ${W} weeks, sampled every ${STRIDE}`);
console.log(`${out.samples} paired asks per key, off one stream position each · the town is ${out.town}\n`);

const shut = { town:[], road:[], rome:[] }, open_ = [];
console.log(`${"event".padEnd(16)} ${"HOME".padStart(7)} ${"TOWN".padStart(7)} ${"ROAD".padStart(7)} ${"ROME".padStart(7)}   verdict`);
for(const k of out.KEYS){
  const r = out.row[k], h = r.home;
  const v = h === 0 ? "never eligible at home either"
    : (r.town === 0 && r.road === 0) ? "HOME ONLY"
    : r.town === 0 ? "shut in town, open on the road"
    : r.road === 0 ? "open in town, shut on the road"
    : "open away";
  if(h > 0){ if(r.town === 0) shut.town.push(k); if(r.road === 0) shut.road.push(k);
    if(r.rome === 0) shut.rome.push(k);
    if(r.town > 0 || r.road > 0) open_.push(k); }
  console.log(`${k.padEnd(16)} ${pct(h,out.samples).padStart(6)}% ${pct(r.town,out.samples).padStart(6)}% ` +
    `${pct(r.road,out.samples).padStart(6)}% ${pct(r.rome,out.samples).padStart(6)}%   ${v}`);
}
const live = out.KEYS.filter(k=>out.row[k].home > 0);
console.log(`\n${out.KEYS.length} drawn events · ${live.length} ever eligible at home in this sample`);
console.log(`SHUT IN TOWN:     ${shut.town.length} of ${live.length} — ${shut.town.join(", ") || "none"}`);
console.log(`SHUT ON THE ROAD: ${shut.road.length} of ${live.length} — ${shut.road.join(", ") || "none"}`);
console.log(`SHUT AT ROME:     ${shut.rome.length} of ${live.length}`);

console.log(`\n---- 2. AND WHAT A REAL TOUR MEETS ----`);
for(const [tag, r] of [["ref", out.ref], ["tour", out.tour]])
  console.log(`${tag.padEnd(5)} ${r.weeks} weeks, ${pct(r.away, r.weeks)}% of them away · ${r.asked} weekly sweeps`);
console.log(`\n${"event".padEnd(16)} ${"ref".padStart(7)} ${"tour".padStart(7)}   change`);
for(const k of out.KEYS){
  const a = 100*out.ref.seen[k]/(out.ref.asked||1), b = 100*out.tour.seen[k]/(out.tour.asked||1);
  if(a < 0.5 && b < 0.5) continue;
  console.log(`${k.padEnd(16)} ${a.toFixed(1).padStart(6)}% ${b.toFixed(1).padStart(6)}%   ${(b-a>=0?"+":"")}${(b-a).toFixed(1)}`);
}
