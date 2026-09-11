/* THE THIN TAIL OF THE DIE — #262's verify-first: gate, or tickets?

     node test/probes/tail.mjs 16 420 2 [policy]     # houses, weeks, seed sets

   #262 lists eight events that barely appear over 3,538 weeks — `primacy` 4, `licence` 8,
   `uprising` 8, `doctore` 9, `stolenSteel` 12, `crowdCalls` 12, `mentor` 13, `patronGone` 13 —
   against a head of `ambition` 191 and `refusal` 190. The item asks the only question that decides
   what to do about it: **is each one rare because its GATE is rare, or because its TICKETS are few?**
   A gate nobody passes is not answered by more tickets.

   THE DIE'S OWN CONTRACT SAYS WHAT TO MEASURE. `pickEvent` draws a key from the pool with
   probability proportional to `evWeight`, calls `make(d)`, and moves to the next key if it returns
   nothing. So the tickets decide the ORDER and never the outcome, and an event's expected share of
   the draws is its weight over the weight of everything ELIGIBLE that week — ineligible keys cost
   nothing when they are skipped. Three numbers per event, then:

     ELIGIBLE   the share of weeks its `make()` would return something — the gate
     EXPECTED   sum over the weeks it was eligible of w_k / (weight of all eligible that week)
     DRAWN      what the die actually gave it

   DRAWN well under EXPECTED means the die is not delivering what its own weights promise, and more
   tickets would help. DRAWN at about EXPECTED with ELIGIBLE near zero means the gate is the whole
   story and tickets are the wrong lever — which is what the item suspects and what #245's note
   already says.

   ---- BOTH OF THOSE WERE THE WRONG POPULATION IN THE FIRST CUT, AND IT SHOWED ----
   It read `did.events`, which is every card the rope ANSWERED, and compared it against a weight
   share that assumed the die was rolled every eligible week. Two things fell out immediately:
   `stolenSteel` and `whispers` reported "eligible 0.0% of weeks" and 28 and 36 appearances, which
   is impossible for anything the die picks; and almost every event on the board read a ratio of
   0.18-0.32, which is not thirty-six independent findings, it is one constant wearing thirty-six
   hats. The constant is `R()<0.45` at the call site — **the die is rolled on 45% of weeks**, and
   only when no question is already standing.

   Both are fixed exactly rather than modelled. `pickEvent` writes `d.flags.evLast[k] = d.week` on
   success and NOTHING ELSE IN THE PROGRAM WRITES THAT FIELD, so watching it transition counts the
   die's own draws and excludes every card raised by `fireArc` or by its own system. And the ratio
   is taken on SHARES — each event's share of the draws against its share of the expected weight —
   which divides the roll rate out instead of trying to estimate it. The raw appearances are kept
   beside the draws, because the gap between them is its own finding: it is exactly the set of
   events that reach the player without the die.

   THE ELIGIBILITY PROBE MUST NOT MOVE THE STREAM. `make()` calls `R()`, so asking thirty-six of
   them every week would re-phase the run being measured. `rngGet`/`rngSet` bracket the whole sweep
   and put the stream back, on `probes/pace.mjs`'s precedent — it is the same measurement made
   there, extended with the weights and the draws so the three can be read against each other.

   AND WHOSE WEEKS THESE ARE IS PART OF THE ANSWER, after #260. v3.252.0 measured the event mix
   moving hard with policy — `ludusNight` 179 -> 11 and `thugs` 15 -> 179 between the reference and
   a player who opens seventeen doors — so an arm is taken under a second policy too. A tail that
   is only a tail for the reference player is a fact about the rope, and #262 would be asking the
   wrong question of it. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SETS = +(process.argv[4] || 2);
const POLICY = process.argv[5] || "ref";
const MOST = { court:true, gambit:true, works:true, sell:true, munus:true, rites:true, bury:true,
  yard:true, booking:true, favours:true, lot:true, overture:true, free:true, mastery:true,
  signature:true, retire:true, tour:true };
const OPTS = POLICY === "most" ? MOST : {};

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, SETS, OPTS])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["EVENTS","EV_DIE","EV_DRAWN","evPool","evWeight","EV_FRESH","rngGet","rngSet","newGameState"]
    .filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const clone = x => JSON.parse(JSON.stringify(x));
  const KEYS = A.EV_DRAWN.slice();

  const row = {}; for(const k of KEYS) row[k] = { elig:0, expect:0, drawn:0, raised:0, pooled:0 };
  let weeks = 0, asked = 0, eligWeeks = 0, eligSum = 0;

  for(let s=0;s<SETS;s++) for(let i=0;i<H;i++){
    const d = A.newGameState("Ta","clean",`TAIL${s}-${i}`);
    for(let w=0;w<W;w++){
      if(d.over) break;
      /* ---- the week's eligibility, on clones, with the stream put back ---- */
      if(!d.rome && !d.travel){
        const st = A.rngGet();
        const base = clone(d); base.pendingEvent = null;
        const pool = A.evPool(base);          /* what the cooldowns leave in play this week */
        const live = [];
        for(const k of pool){
          let ev = null; try { ev = A.EVENTS[k].make(clone(base)); } catch(x){}
          if(ev) live.push(k);
        }
        A.rngSet(st);
        if(live.length){
          let sum = 0; for(const k of live) sum += A.evWeight(d, k);
          for(const k of live){ row[k].elig++; row[k].expect += A.evWeight(d, k) / sum; }
          eligWeeks++; eligSum += live.length;
        }
        for(const k of pool) row[k].pooled++;
        asked++;
      }
      /* `evLast` before and after: `pickEvent` is the only writer, so a key whose stamp changed
         is a key the DIE gave out this week. Everything else in `did.events` arrived some other
         way and is counted separately. */
      const was = Object.assign({}, (d.flags && d.flags.evLast) || {});
      let did=null; try{ did = R.lanista(d, OPTS); }catch(e){ break; }
      weeks++;
      { const now = (d.flags && d.flags.evLast) || {};
        for(const k of Object.keys(now)) if(row[k] && now[k] !== was[k]) row[k].drawn++; }
      if(did && did.events) for(const k of Object.keys(did.events))
        if(row[k]) row[k].raised += did.events[k];
    }
  }
  return { KEYS, row, weeks, asked, eligWeeks,
    eligMean: eligWeeks ? eligSum/eligWeeks : 0,
    die: A.EV_DIE, fresh: A.EV_FRESH };
}, [H, W, SETS, OPTS]);

if(out.why){ console.log("HANDLE:", out.why); await browser.close(); server.close(); process.exit(1); }

const pad=(s,n)=>String(s).padEnd(n), rp=(s,n)=>String(s).padStart(n);
console.log(`\nTHE THIN TAIL — ${H} houses x ${W} weeks x ${SETS} sets, policy "${POLICY}"`);
console.log(`${out.weeks} house-weeks, ${out.asked} of them at home and askable, ${out.eligMean.toFixed(1)} events eligible on the median askable week\n`);

const TAIL = ["primacy","licence","uprising","doctore","stolenSteel","crowdCalls","mentor","patronGone"];
const totDrawn = out.KEYS.reduce((n,k)=>n+out.row[k].drawn, 0);
const totExp   = out.KEYS.reduce((n,k)=>n+out.row[k].expect, 0);
const rows = out.KEYS.map(k=>{
  const r = out.row[k], w = (out.die[k]||{w:1}).w;
  /* SHARE against SHARE — the die is rolled on 45% of weeks and only when nothing is already
     standing, and neither of those is per-event, so comparing shares divides both out */
  const sa = totDrawn ? r.drawn/totDrawn : 0, se = totExp ? r.expect/totExp : 0;
  return { k, w, cool:(out.die[k]||{cool:0}).cool,
    eligPct: out.asked ? 100*r.elig/out.asked : 0,
    expect: r.expect, drawn: r.drawn, raised: r.raised,
    ratio: se > 0 ? sa/se : null };
}).sort((a,b)=>a.drawn-b.drawn);

console.log(`  ${pad("event",14)}${rp("tix",4)}${rp("cool",5)}${rp("elig%",8)}${rp("expect",8)}${rp("drawn",7)}${rp("raised",8)}${rp("share/share",12)}   verdict`);
for(const r of rows){
  const v = r.ratio == null ? (r.raised ? "NOT THE DIE — it arrives some other way" : "never eligible, never raised")
    : r.eligPct < 2 ? "GATE — eligible almost never, and the die pays it"
    : r.ratio < 0.7 ? "TICKETS — under its own weight"
    : r.ratio > 1.4 ? "over its weight"
    : "the die is paying what it promises";
  console.log(`  ${pad(r.k,14)}${rp(r.w,4)}${rp(r.cool,5)}${rp(r.eligPct.toFixed(1),8)}${rp(r.expect.toFixed(1),8)}${rp(r.drawn,7)}${rp(r.raised,8)}`
    + `${rp(r.ratio == null ? "—" : r.ratio.toFixed(2), 12)}   ${TAIL.includes(r.k) ? "[#262] " : ""}${v}`);
}
console.log(`\n  ${totDrawn} draws off the die in ${out.asked} askable weeks (${(100*totDrawn/Math.max(1,out.asked)).toFixed(0)}% — the call site rolls R()<0.45 and only when no question is standing)`);

console.log(`\nTHE EIGHT #262 NAMES:`);
for(const k of TAIL){
  const r = rows.find(x=>x.k === k);
  if(!r){ console.log(`  ${pad(k,14)} not a drawn event — it is raised by its own system and never sees the die`); continue; }
  console.log(`  ${pad(k,14)} eligible on ${r.eligPct.toFixed(1)}% of askable weeks · ${r.w} tickets · share of draws ${r.ratio == null ? "—" : r.ratio.toFixed(2)}x its share of the weight · ${r.drawn} off the die, ${r.raised} raised in all`);
}

await browser.close(); server.close();
