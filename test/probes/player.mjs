/* THE PARTIAL PLAYER — #260's verify-first. Which of the game's doors does the reference player
   never open, and which of the numbers this project publishes are conditioned on that?

     node test/probes/player.mjs 16 420 6            # houses, weeks, seed prefixes
     node test/probes/player.mjs 16 420 6 court,loan # only these arms

   THE ITEM'S PREMISE IS PARTLY WRONG AND THE INVENTORY IS THE FIRST HALF OF THE ANSWER. #260 says
   three doors have "no lever at all": selling a man, `holdMunera` and `makeOffering`. Selling
   shipped as `sell` at v3.249.0; `makeOffering` has had `rites` since v3.130.0 and `stageMunus` has
   had `munus`; only `holdMunera` was really shut, and it is opened here (`bury`, #260, and the
   whole of #261). What the item got right is the shape: the default rope leaves eighteen doors
   shut, and every figure the project quotes is a figure about that rope.

   ---- THE TRAP THIS FILE IS BUILT AROUND ----
   `R()` is ONE global stream. A lever that fires once in week 3 re-phases every draw after it, so
   the arm's endings, coin and fame all differ from the reference whether or not the lever changed
   anything. Reading those differences as effect is the fault this project has met most often.

   So nothing here is compared against a single reference run. The reference is run on the SAME
   seed prefixes as every arm, and the spread of the reference's own figures ACROSS prefixes is the
   noise floor: a delta inside that band has not been shown to be the lever. Counts also carry a
   2*sqrt(N) floor under the band, because three or six prefixes that happen to agree exactly
   estimate a spread of zero and a zero band would make every delta significant — which is what the
   first cut of this file did to the `ruin` row, on three houses in three thousand weeks.

   AND EVERY ARM REPORTS WHETHER ITS LEVER FIRED. A lever that never pulls is byte-identical to the
   reference and reads as "changes nothing" — #259's `solvent` lever came back byte-identical twice
   before that was noticed. The counters are the sabotage guard: no fire, no finding. Three levers
   had no counter at all (`booking`, `yard`, `favours`); `R.booked` was added for the first, and the
   other two are read off the rope's own event tally and its `favour:<rank>` bumps. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), P = +(process.argv[4] || 6);
const ONLY = (process.argv[5] || "").split(",").filter(Boolean);

/* the levers that are OFF unless a caller asks. `on(k)` is `o[k] !== false`, so everything not
   listed here is already inside every figure this project publishes.
   A counter name beginning `~` sums every key with that prefix. */
const ARMS = [
  ["court",     { court:true },                    ["courted"]],
  ["gambit",    { gambit:true },                   ["gambitWon","gambitLost"]],
  ["loan",      { loan:"murena" },                 ["borrowed","repaid","cleared"]],
  ["payoff",    { loan:"murena", payoff:true },    ["borrowed","repaid","cleared"]],
  ["works",     { works:true },                    ["commissioned"]],
  ["sell",      { sell:true },                     ["soldMan","soldSteel","soldPaper"]],
  ["munus",     { munus:true },                    ["staged"]],
  ["rites",     { rites:true },                    ["offering","vow"]],
  ["bury",      { bury:true },                     ["buried:games","buried:rite"]],
  ["yard",      { yard:true },                     ["ev:yard"]],
  ["booking",   { booking:true },                  ["booked"]],
  ["favours",   { favours:true },                  ["~favour:"]],
  ["lot",       { lot:true },                      ["lot"]],
  ["overture",  { overture:true },                 ["overtureTaken","overtureRefused"]],
  ["free",      { free:true },                     ["freed"]],
  ["mastery",   { mastery:true },                  ["mastered"]],
  ["signature", { signature:true },                ["signature"]],
  ["retire",    { retire:true },                   ["retired"]],
  ["tour",      { tour:true },                     ["setOut"]],
  /* THE COMPLETE PLAYER — every door at once. Not a policy anybody would run: it is the arm a
     gate check can afford, because one run proves every lever alive where nineteen runs would not
     fit in the suite. A counter that reads 0 here is either a dead lever or one crowded out by the
     others, and either is worth stopping for. */
  ["all", { court:true, gambit:true, loan:"murena", payoff:true, works:true, sell:true, munus:true,
            rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true,
            free:true, mastery:true, signature:true, retire:true, tour:true },
    ["courted","gambitWon","gambitLost","borrowed","repaid","cleared","commissioned","soldMan",
     "soldSteel","soldPaper","staged","offering","vow","buried:games","buried:rite","ev:yard",
     "booked","~favour:","lot","overtureTaken","overtureRefused","freed","mastered","signature",
     "retired","setOut"]],
  /* AND THE SAME WITHOUT THE LENDER, because `loan` is not a door like the others: it takes the
     house's whole life. All-on with it reads 3,212 house-weeks against the reference's 10,800, and
     `yard` and `lot` — cards that arrive once in a long run — never came up at all. So the arm a
     check can hold liveness on is this one, and the lender is proved separately. */
  ["most", { court:true, gambit:true, works:true, sell:true, munus:true,
            rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true,
            free:true, mastery:true, signature:true, retire:true, tour:true },
    ["courted","gambitWon","gambitLost","commissioned","soldMan",
     "soldSteel","soldPaper","staged","offering","vow","buried:games","buried:rite","ev:yard",
     "booked","~favour:","lot","overtureTaken","overtureRefused","freed","mastered","signature",
     "retired","setOut"]],
];

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const use = ARMS.filter(a=>!ONLY.length || ONLY.includes(a[0]));
const t0 = Date.now();
const out = await p.evaluate(([H, W, P, use])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG","liquidate","riseOf"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const med = a => { if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y);
    return s[Math.floor(0.5*s.length)]; };

  /* ONE PREFIX'S WORTH OF ONE ARM. The seed word is the prefix and the house index and nothing
     else, so arm and reference meet the same founding roll house for house. */
  const run = (o, pre) => {
    const rows = [], fired = {};
    const bk0 = R.stats().booked || 0;
    for(let i=0;i<H;i++){
      const d = A.newGameState("Pl", "clean", `${pre}-${i}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        let did = null; try { did = R.lanista(d, o); } catch(e){ break; }
        if(!did) continue;
        for(const k of Object.keys(did)){
          if(typeof did[k] === "number") fired[k] = (fired[k]||0) + did[k];
          /* `did.events` is an OBJECT of id -> count, not a number: the first cut summed the
             object's values whole and printed a wall of [object Object]. It is also the only
             record that `yard` had a door to open at all. */
          else if(k === "events" && did[k] && typeof did[k] === "object")
            for(const id of Object.keys(did[k])) fired["ev:"+id] = (fired["ev:"+id]||0) + did[k][id];
        }
      }
      let fund = 0; try { fund = A.liquidate(d).total; } catch(e){}
      rows.push({ end: d.over ? d.over.kind : "alive", week:d.week,
        gold:Math.round(d.gold), fund:Math.round(fund), fame:Math.round(d.fame||0),
        roster:A.activeG(d).length, unrest:Math.round(d.unrest||0),
        /* `d.rank` does not exist. The census rung is `d.rise.rank`, and the first cut of this
           file read the missing field and published a column of zeros for every arm. */
        rank:A.riseOf(d),
        honoured:d.honoured||0, unburied:(d.unburied||[]).length });
    }
    fired.booked = (R.stats().booked || 0) - bk0;
    return { fired, rows };
  };

  /* counts SUM across prefixes; p50 rows are re-taken over the union of every house */
  const COUNTS = ["alive","debt","rebellion","ruin","died","weeks","honoured","unburied"];
  const MEDS   = ["goldP50","fundP50","fameP50","rosterP50","unrestP50","rankP50"];
  const KEYS = COUNTS.concat(MEDS);
  const figs = (rows) => {
    const e = k => rows.filter(r=>r.end === k).length;
    return { alive:e("alive"), debt:e("debt"), rebellion:e("rebellion"), ruin:e("ruin"),
      died:e("lanistaDied"), weeks:rows.reduce((n,r)=>n+r.week,0),
      honoured:rows.reduce((n,r)=>n+r.honoured,0),
      unburied:rows.reduce((n,r)=>n+r.unburied,0),
      goldP50:med(rows.map(r=>r.gold)), fundP50:med(rows.map(r=>r.fund)),
      fameP50:med(rows.map(r=>r.fame)), rosterP50:med(rows.map(r=>r.roster)),
      unrestP50:med(rows.map(r=>r.unrest)), rankP50:med(rows.map(r=>r.rank)) };
  };
  const gather = (per) => {
    const all = []; for(const x of per) all.push(...x.rows);
    const fired = {};
    for(const x of per) for(const k of Object.keys(x.fired)) fired[k] = (fired[k]||0) + x.fired[k];
    return { figs:figs(all), perFigs:per.map(x=>figs(x.rows)), fired, n:all.length };
  };

  const pres = []; for(let j=0;j<P;j++) pres.push(`PLAYER${j}`);
  const ref = gather(pres.map(pre=>run({}, pre)));
  const band = {};
  for(const k of KEYS){
    const v = ref.perFigs.map(f=>f[k]);
    const range = Math.max(...v) - Math.min(...v);
    /* a SUM over prefixes wanders about sqrt(P) times as far as one prefix does; the range is a
       crude stand-in for a sd at this many samples, so range*P is deliberately the conservative
       side of that. A median re-taken over the union does not scale, so its band is the range. */
    const raw = COUNTS.includes(k) ? range * P : range;
    const floor = COUNTS.includes(k) ? 2 * Math.sqrt(Math.max(0, ref.figs[k])) : 0;
    band[k] = { lo:Math.min(...v), hi:Math.max(...v), band:Math.max(raw, floor), floor:Math.round(floor) };
  }

  const arms = [];
  for(const [nm, o, counters] of use){
    const g = gather(pres.map(pre=>run(o, pre)));
    const pulls = counters.reduce((n,c)=>n + (c[0] === "~"
      ? Object.keys(g.fired).filter(k=>k.startsWith(c.slice(1))).reduce((m,k)=>m+g.fired[k],0)
      : (g.fired[c]||0)), 0);
    const refPulls = counters.reduce((n,c)=>n + (c[0] === "~"
      ? Object.keys(ref.fired).filter(k=>k.startsWith(c.slice(1))).reduce((m,k)=>m+ref.fired[k],0)
      : (ref.fired[c]||0)), 0);
    arms.push({ nm, figs:g.figs, fired:g.fired, pulls, refPulls, counters });
  }
  return { KEYS, COUNTS, ref:ref.figs, refN:ref.n, band, arms, refFired:ref.fired };
}, [H, W, P, use]);

if(out.why){ console.log("HANDLE:", out.why); await browser.close(); server.close(); process.exit(1); }

const pad = (s,n)=>String(s).padEnd(n), rp = (s,n)=>String(s).padStart(n);
const K = out.KEYS;
console.log(`\nTHE PARTIAL PLAYER — ${H} houses x ${W} weeks x ${P} prefixes an arm, ${use.length} levers`
  + `  (${Math.round((Date.now()-t0)/1000)}s, ${out.refN} reference houses)\n`);

console.log("THE REFERENCE, pooled, and the band its own prefixes span:");
for(const k of K)
  console.log(`  ${pad(k,10)} ${rp(out.ref[k],8)}   per prefix ${out.band[k].lo}..${out.band[k].hi}`
    + `   band ${Math.round(out.band[k].band)}${out.band[k].floor && out.band[k].band === out.band[k].floor ? " (the sqrt floor — the prefixes agreed)" : ""}`);

console.log(`\nARMS — delta against the reference; * clears the reference's own band.`);
console.log(`  ${pad("lever",10)} ${rp("pulls",7)}  ${K.map(k=>rp(k.slice(0,7),8)).join("")}`);
for(const a of out.arms){
  const cells = K.map(k=>{
    const dv = a.figs[k] - out.ref[k];
    return rp((dv>0?"+":"") + dv + (Math.abs(dv) > out.band[k].band ? "*" : " "), 8);
  }).join("");
  console.log(`  ${pad(a.nm,10)} ${rp(a.pulls,7)}  ${cells}`);
}

console.log(`\nDID THE LEVER FIRE?  (and what the reference did on the same counter)`);
for(const a of out.arms){
  const detail = a.counters.map(c=>{
    const v = c[0] === "~" ? Object.keys(a.fired).filter(k=>k.startsWith(c.slice(1)))
      .map(k=>`${k} ${a.fired[k]}`).join(", ") : `${c} ${a.fired[c]||0}`;
    return v || `${c} 0`;
  }).join(" · ");
  console.log(`  ${pad(a.nm,10)} ${a.pulls === 0 ? "NEVER PULLED — this arm measured nothing" : detail}`
    + (a.refPulls ? `   [reference: ${a.refPulls}]` : ""));
}

console.log(`\nWHAT MOVED:`);
for(const a of out.arms){
  const moved = K.filter(k=>Math.abs(a.figs[k]-out.ref[k]) > out.band[k].band)
    .map(k=>`${k} ${out.ref[k]}→${a.figs[k]}`);
  console.log(`  ${pad(a.nm,10)} ${a.pulls === 0 ? "(never pulled)" : moved.length ? moved.join(" · ") : "nothing clears the band"}`);
}
console.log(`\nthe reference's own week: ${Object.entries(out.refFired).filter(([k])=>!k.startsWith("ev:"))
  .sort((a,b)=>b[1]-a[1]).slice(0,16).map(([k,v])=>k+" "+v).join(", ")}`);
console.log(`the reference's own cards: ${Object.entries(out.refFired).filter(([k])=>k.startsWith("ev:"))
  .sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>k.slice(3)+" "+v).join(", ")}`);

await browser.close(); server.close();
