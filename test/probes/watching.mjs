/* WHAT IS IT LIKE TO WATCH A BOUT, THE HUNDREDTH TIME? — the arena as an experience.

     node test/probes/watching.mjs 200

   The arena's DRAWING is the best-tested surface in this game. Six checks hold it: `umbra` (a
   silhouette needs a wall behind it), `vocab` (27 distinct men), `backdrop` (every venue drawn as
   itself), `palette`, `legible`, `scene`. A proposal to make the sand prettier would be adding to
   the one part of the interface nobody has neglected.

   What NOTHING measures is the bout as a thing you sit through. A house fights hundreds of them —
   `depth` puts a long-lived house past 380 bouts — and every one is a stream of `beats`, each a
   line of prose with a vigour, a stamina, a crowd and a momentum attached. So the questions that
   decide whether the arena is worth watching are not about the drawing at all:

     · how many beats is a bout, and how many words is a beat?
     · how many DISTINCT lines does a player see across a career, against how many he reads?
     · do the bars move? a momentum meter that sits near zero is a decoration with a number on it.
     · how much of a bout is decisive, and how much is the fight clearing its throat?

   THE REPETITION NUMBER IS THE POINT. Everything else here is context for it. A bout can be
   beautifully drawn and beautifully written and still be dull on the hundredth reading, and the
   only thing that decides which is how much of the writing a career actually exhausts.

   This reads `doFight` directly rather than driving the screen: the beats ARE the experience, and
   the browser adds three minutes a run without adding a fact. `sand` already proves the screen
   renders them.

   ---- THE ANSWER, AND THE FIRST VERSION OF IT WAS A CATEGORY ERROR ----
   200 bouts through the pits. A bout is 20 beats, 7 rounds, 271 words. The bars are not
   decoration — mean |momentum| is 1.8 of a possible 3 and the crowd swings 50 points across a
   bout. 3,922 lines read from 2,567 distinct, or 1,794 once the fighters' names are stripped out.

   THIS PROBE THEN PUBLISHED "405 ways to graze a man against 3 ways to die" AND THAT IS WRONG.
   A distinct-shape count measures SURFACE FORMS, not writing. `crit` has 405 shapes and ZERO
   `push("crit", ...)` call sites: the kind is a damage band — `dmg>=18?"crit":dmg>=10?"hit":
   "graze"` — laid over one shared pool of TECHNIQUE and STYLE lines, templated again with a body
   part drawn from TARGETS. `death` has FOUR authored branches and no templating at all, so it
   reads as three shapes. The two numbers do not measure the same thing and cannot be compared.

   Stripping the fighters' names was the same correction made one step too early: it caught
   `Brennus feints` vs `Malchus feints` and stopped, while `${mt[0]}` went on inflating `crit`.

   ---- WHAT THE CORRECTED TABLE SAYS, WHICH IS BETTER ----

       kind        read   share  shapes  branch  re-read  how
       crit         642   16.4%     405       0      1.6  templated (no branch of its own)
       gas          579   14.8%     186       3      3.1  templated
       graze        536   13.7%     304       1      1.8  templated
       intro        414   10.6%     343       7      1.2  templated
       hit          261    6.7%     231       0      1.1  templated (no branch of its own)
       salute       200    5.1%       1       1    200.0  BRANCHED
       crowd        146    3.7%      17       4      8.6  templated
       spared       118    3.0%       3       2     39.3  BRANCHED
       death         60    1.5%       3       4     20.0  BRANCHED

   **EVERY BEAT IN A BOUT IS TEMPLATED EXCEPT THREE, AND THOSE THREE ARE THE THREE THAT REPEAT.**
   The exchanges take a name, a body part, a technique and a style and wear many coats on few
   sentences. The salute, the missio and the death each take a fixed sentence per branch and wear
   it every time. The asymmetry is not one of EFFORT — `death` has more authored branches than
   `graze` has — it is one of TECHNIQUE, and the technique is already in the file, everywhere else.

   `death` also has four branches and reaches three, so part of it is reachability, the shape #288
   found in the rebellion ladder.

   ---- TWO OF THE THREE HAVE SINCE BEEN CUT, AND THE TABLE ABOVE IS LEFT AS IT WAS ----
   It is the finding, not the current state, and overwriting it would delete the only record of
   what the game was when the question was asked. Where they stand now, same 200 bouts:

       kind       read  shapes  branch  re-read   was              release
       death        60       7      14      8.6   3 · 4 · 20.0     #292, v3.288.0
       salute      200     181      16      1.1   1 · 1 · 200.0    #293, v3.289.0
       spared      118       3       2     39.3   unchanged        —

   The salute is the larger of the two by a distance: it fires on EVERY bout where the death fires
   on a few percent, and one sentence was carrying 5.1% of every line a player reads.

   NOTE WHAT THE `shapes` COLUMN DOES THERE AND DO NOT MISREAD IT. Sixteen authored branches came
   back as 181 surface forms, because the branches substitute a class, an origin, a patron's name
   and a pronoun the way the exchanges substitute a body part. That is the SAME inflation this
   probe's own header was written to warn about, and it is not a claim that 181 sentences were
   written. Sixteen were. The honest pair of numbers is `branch` and `re-read`.

   `spared` is the one left. It is not measured differently from the other two and wants the same
   cut; it is simply next.

   AND THE REACHABILITY QUESTION IS NOW ANSWERED ELSEWHERE. "`death` has four branches and reaches
   three" (above) is a statement about THIS SAMPLE, which fights week-one houses, and it cannot
   tell rare from dead. `probes/reachable.mjs` sweeps both tables over constructed state and proves
   each entry selectable: 27 of 27, none shadowed. Read the two together — this one for what a
   player meets, that one for what exists to be met.

      NOT A DRAWING PROBLEM. Six checks hold the arena's visuals and they pass. Whatever is wrong with
   watching the four hundredth bout of a career, it is not the picture. */
import { serve, open, clearAll, found } from "../harness.mjs";
import { readFileSync } from "node:fs";

/* ---- HOW MANY SENTENCES A HUMAN ACTUALLY WROTE, read from the source ----
   A distinct-shape count measures SURFACE FORMS, not writing. `crit` came back with 405 shapes
   and has ZERO `push("crit", ...)` call sites in the bout engine: the kind is a damage band
   (`dmg>=18?"crit":dmg>=10?"hit":"graze"`) over one shared pool of TECHNIQUE and STYLE lines,
   further templated with a body part drawn from TARGETS. `death` has four authored branches
   and no templating, so it reads as "three shapes". Comparing the two numbers as if both meant
   "how much was written" is a category error, and this probe made it before it caught it. */
const authored = (() => {
  const src = readFileSync(new URL("../../src/ludus.jsx", import.meta.url), "utf8").split("\n");
  /* the single-bout engine: from its `const beats = []` to the next one */
  const starts = [];
  src.forEach((l,i)=>{ if(/^\s*const beats = \[\];\s*$/.test(l)) starts.push(i); });
  const a = starts[0], b = starts[1] != null ? starts[1] : src.length;
  const out = {};
  for(let i=a;i<b;i++){
    const m = src[i].match(/push\("([a-z]+)"/g) || [];
    for(const hit of m){ const k = hit.slice(6, -1); out[k] = (out[k]||0) + 1; }
  }

  /* ---- AND A BEAT WHOSE VARIANTS LIVE IN A TABLE — #292 ----
     Counting `push("death", …)` CALL SITES was the whole rule, and it stopped being enough the
     moment a beat was templated properly: v3.288.0 moved eleven death variants into a `DEATHS`
     table with `when`/`say`, the way `TELLS` and `FREEDMEN` are shaped, and the call site went to
     ONE. Eleven pieces of writing read as one branch, and the table called the beat "branched"
     immediately after it had been templated.

     A table is countable in a way an inline chain is not — which is half the reason the extraction
     was the right shape rather than raising `bulk`'s cap. The entries are counted here and added
     to the kind the table is named for. The rule is still narrow: it knows `DEATHS -> death`, and
     a second templated beat will want its own line. Naming that is better than a regex that
     guesses at plurals.

     AND THE SECOND ONE ARRIVED ONE RELEASE LATER, exactly as that paragraph said it would:
     v3.289.0 templated the salute into `SALUTES`, sixteen entries on the same `when`/`say` shape.
     The rule stays a named map rather than a regex over plurals — a guess that turned `CRUX` into
     `crux` or `TELLS` into `tell` would be a wrong number with nothing saying so, which is the
     single fault this project has shipped most often. */
  const TABLES = { DEATHS: "death", SALUTES: "salute" };
  for(const [tbl, kind] of Object.entries(TABLES)){
    const t = src.findIndex(l => l.startsWith(`const ${tbl} = [`));
    if(t < 0) continue;
    let n = 0;
    for(let i = t + 1; i < src.length && !/^\];/.test(src[i]); i++)
      if(/^\s*\{\s*when:/.test(src[i])) n++;
    if(n) out[kind] = (out[kind] || 0) + n - 1;   /* the call site it replaced already counted once */
  }
  return { counts: out, from: a+1, to: b };
})();

const N = +(process.argv[2] || 200);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20);

const out = await p.evaluate(([N])=>{
  const A = window.__LVDVS;
  const miss = ["newGameState","doFight","activeG","makePitCard","pitMen","makePitOffer"]
    .filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const texts = new Map();            /* line -> times read, verbatim */
  const shapes = new Map();           /* line -> times read, with the NAMES taken out */
  const byKind = {};                  /* kind -> Map(shape -> count): the POOL each kind draws on */
  const kinds = {};
  const perBout = [];
  let bouts = 0, thrown = 0;

  for(let i=0;i<N && bouts<N;i++){
    const d = A.newGameState("Wt","clean",`WATCH-${i}`);
    const men = A.activeG(d);
    if(!men.length) continue;
    /* THE PITS, because they are always open — `sand` uses them for the same reason. */
    let o = null;
    try { A.makePitCard(d); const pm = A.pitMen(d) || [];
      o = A.makePitOffer(d, men[0], "standard", pm.length ? pm[0].id : null); }
    catch(e){ thrown++; continue; }
    if(!o) continue;

    /* ---- AND TO EXHAUSTION, WHICH THE FIRST CUT OF THIS DID NOT DO ----
       `doFight` comes back with a `crux` pending on 26.8% of standard bouts (#116). A bout left
       pending is not a bout: its beats are the first half of a fight. `charter.mjs` names this
       and drives it out; so does this, carrying `pd.beats` forward the way the game does. */
    let res = null;
    try {
      res = A.doFight(d, men[0].id, o, "measured", null, null, null, "none");
      let n = 0;
      while(res && res.crux && n++ < 6){
        const pd = res.pending; if(!pd) break; pd.beats = res.beats;
        res = A.doFight(d, men[0].id, o, "measured", null, pd, "cover", "none");
      }
    } catch(e){ thrown++; continue; }
    const bs = ((res && res.beats) || []).filter(b=>b && b.text);
    if(!bs.length) continue;
    bouts++;

    /* ---- AND THE SAME LINE WITH THE NAMES OUT, WHICH IS THE REAL QUESTION ----
       "2,567 distinct lines" counts `Brennus feints` and `Malchus feints` as two pieces of
       writing. They are one piece of writing and two men. Every name in this bout is stripped and
       the line counted again, so the two numbers can be read against each other: verbatim says
       what a player's eye meets, SHAPED says how much was actually written. */
    const names = [];
    for(const g of (d.gladiators||[])) if(g && g.name) names.push(g.name);
    if(o && o.oppName) names.push(o.oppName);
    if(res && res.oppName) names.push(res.oppName);
    for(const b of bs) if(b && b.who) names.push(b.who);
    const strip = t => { let x = t;
      for(const n of names){ if(!n) continue;
        x = x.split(n).join("\u00b7"); }
      return x.replace(/\u00b7(\u2019|')s\b/g, "\u00b7").replace(/\s+/g, " ").trim(); };

    let words = 0, momAbs = 0, crowdMin = 101, crowdMax = -1, rounds = 0;
    for(const b of bs){
      const t = String(b.text).trim();
      texts.set(t, (texts.get(t)||0) + 1);
      const sh = strip(t);
      shapes.set(sh, (shapes.get(sh)||0) + 1);
      const k = b.kind || "(none)";
      (byKind[k] || (byKind[k] = new Map())).set(sh, (byKind[k].get(sh)||0) + 1);
      kinds[b.kind||"(none)"] = (kinds[b.kind||"(none)"]||0) + 1;
      words += t.split(/\s+/).length;
      momAbs += Math.abs(b.mom||0);
      if(b.crowd != null){ if(b.crowd < crowdMin) crowdMin = b.crowd; if(b.crowd > crowdMax) crowdMax = b.crowd; }
      if((b.round||0) > rounds) rounds = b.round||0;
    }
    perBout.push({ beats:bs.length, words, rounds,
      momMean:+(momAbs/bs.length).toFixed(2),
      crowdSwing: crowdMax >= 0 ? +(crowdMax - crowdMin).toFixed(1) : 0 });
  }

  const lines = [...texts.entries()].sort((a,b)=>b[1]-a[1]);
  const shp = [...shapes.entries()].sort((a,b)=>b[1]-a[1]);
  return { bouts, thrown, perBout, kinds,
    distinct: lines.length,
    read: lines.reduce((n,[,c])=>n+c, 0),
    top: lines.slice(0, 8).map(([t,c])=>({ c, t: t.slice(0, 58) })),
    once: lines.filter(([,c])=>c===1).length,
    shDistinct: shp.length,
    shOnce: shp.filter(([,c])=>c===1).length,
    shTop: shp.slice(0, 8).map(([t,c])=>({ c, t: t.slice(0, 58) })),
    pools: Object.fromEntries(Object.entries(byKind).map(([k,m])=>
      [k, { pool:m.size, read:[...m.values()].reduce((a,b)=>a+b,0) }])) };
}, [N]);

await browser.close(); server.close();
if(out.why){ console.log("PROBE COULD NOT RUN:", out.why); process.exit(1); }
if(!out.bouts){ console.log("no bout could be fought — the bill offered nothing"); process.exit(1); }

const med = (a,k) => { const s=a.map(x=>x[k]).sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
const mean = (a,k) => (a.reduce((n,x)=>n+x[k],0)/a.length).toFixed(1);
const B = out.perBout;

console.log(`\nWHAT IS IT LIKE TO WATCH A BOUT?  ${out.bouts} bouts`
  + (out.thrown ? ` · ${out.thrown} threw` : "") + `\n`);
console.log(`  a bout is   ${med(B,"beats")} beats (mean ${mean(B,"beats")}) `
  + `· ${med(B,"rounds")} rounds · ${med(B,"words")} words to read (mean ${mean(B,"words")})`);
console.log(`  per beat    ${(B.reduce((n,x)=>n+x.words,0)/B.reduce((n,x)=>n+x.beats,0)).toFixed(1)} words`);
console.log(`  momentum    mean |mom| per beat ${mean(B,"momMean")} of a possible 3`);
console.log(`  the crowd   swings ${med(B,"crowdSwing")} points across a bout (mean ${mean(B,"crowdSwing")})`);

console.log(`\n  THE WRITING — ${out.read} lines read, ${out.distinct} of them distinct`);
console.log(`    a player reads each line ${(out.read/out.distinct).toFixed(1)} times on average `
  + `over ${out.bouts} bouts`);
console.log(`    ${out.once} lines (${(out.once/out.distinct*100).toFixed(0)}%) were seen exactly once`);
console.log(`    the most-read lines:`);
for(const l of out.top) console.log(`      ${String(l.c).padStart(4)}x  "${l.t}"`);

console.log(`\n  THE SAME, WITH THE NAMES TAKEN OUT — the writing rather than the eye`);
console.log(`    ${out.shDistinct} distinct SHAPES against ${out.distinct} distinct lines `
  + `· inflation ${(out.distinct/out.shDistinct).toFixed(2)}x`);
console.log(`    each shape read ${(out.read/out.shDistinct).toFixed(1)} times over ${out.bouts} bouts`);
console.log(`    ${out.shOnce} shapes (${(out.shOnce/out.shDistinct*100).toFixed(0)}%) seen exactly once`);
console.log(`    the most-read shapes:`);
for(const l of out.shTop) console.log(`      ${String(l.c).padStart(4)}x  "${l.t}"`);

const ks = Object.entries(out.kinds).sort((a,b)=>b[1]-a[1]);
const tot = ks.reduce((n,[,v])=>n+v,0);
console.log(`\n  THE BEATS, BY KIND — SURFACE FORMS AGAINST AUTHORED BRANCHES`);
console.log(`  (authored = push("kind",...) call sites in the bout engine, src lines `
  + `${authored.from}-${authored.to})`);
console.log(`  A kind with many shapes and few branches is TEMPLATED — one sentence wearing`);
console.log(`  many coats. A kind where the two are close is BRANCHED, and its shape count is`);
console.log(`  a fair count of the writing. They are not comparable to each other.\n`);
console.log(`    ${"kind".padEnd(9)} ${"read".padStart(6)} ${"share".padStart(7)} `
  + `${"shapes".padStart(7)} ${"branch".padStart(7)} ${"re-read".padStart(8)}  how`);
for(const [k,v] of ks){
  const P = out.pools[k] || { pool:0 };
  const br = authored.counts[k] || 0;
  const rr = P.pool ? (v/P.pool).toFixed(1) : "-";
  /* ---- TWO WAYS TO GET VARIETY, AND THEY ARE NOT THE SAME THING — #292 ----
     `shapes >> branches` is TEMPLATED: one sentence wearing many coats, a name and a wound and a
     technique substituted in. `shapes ~ branches` is WRITTEN OUT: a sentence per condition, no
     substitution. Both are legitimate and the file uses both; what a reader feels is the RE-READ
     column, not which technique produced it.

     Calling the second one "branched" as if it were a fault is what this classifier did until
     v3.288.0 — and it said it about `death` in the same run that took the death from four
     variants to fourteen. A label that goes the wrong way when the thing improves is worse than
     no label. */
  const how = !br ? "templated (no branch of its own)"
    : P.pool / br >= 4 ? "templated"
    : br >= 8 ? "written out"
    : "thin — few branches, few forms";
  console.log(`    ${String(k).padEnd(9)} ${String(v).padStart(6)} `
    + `${(v/tot*100).toFixed(1).padStart(6)}% ${String(P.pool).padStart(7)} `
    + `${String(br).padStart(7)} ${String(rr).padStart(8)}  ${how}`);
}
console.log("");
