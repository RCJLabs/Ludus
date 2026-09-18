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

   ---- THE ANSWER: THE WRITING IS INVERTED ----
   200 bouts through the pits. A bout is 20 beats, 7 rounds, 271 words. The bars are not
   decoration — mean |momentum| is 1.8 of a possible 3 and the crowd swings 50 points across a
   bout. 3,922 lines read from 2,567 distinct, or 1,794 once the fighters' names are stripped out
   (1.43x inflation — `Brennus feints` and `Malchus feints` are one piece of writing and two men).
   **81% of shapes are seen exactly once in 200 bouts.** The arena's writing is deep.

   IT IS DEEP IN THE WRONG PLACES.

       kind         read   share  shapes  re-reads
       crit          642   16.4%     405       1.6
       gas           579   14.8%     186       3.1
       graze         536   13.7%     304       1.8
       crux          486   12.4%     133       3.7
       intro         414   10.6%     343       1.2
       hit           261    6.7%     231       1.1
       salute        200    5.1%       1     200.0
       fall          178    4.5%      44       4.0
       appeal        178    4.5%      78       2.3
       crowd         146    3.7%      17       8.6
       spared        118    3.0%       3      39.3
       death          60    1.5%       3      20.0

   **The game is most eloquent about a graze and most repetitive about a death.** A man dying on
   the sand — the most significant thing that can happen in a gladiator game — draws on three
   lines. Missio draws on three. Every bout in a career opens on the same single sentence.
   Meanwhile a glancing blow has four hundred and five.

   AND THE PATTERN IS ALREADY ESTABLISHED, which is what makes this a small item rather than a
   large one. `spared` HAS context-sensitive variants: a patron raising his hand from the editor's
   box before the crowd has finished deciding, the top tiers on their feet and not asking. The
   machinery for conditional dramatic writing is built and working. There are three lines behind
   it.

   NOT A DRAWING PROBLEM. Six checks hold the arena's visuals and they pass. Whatever is wrong with
   watching the four hundredth bout of a career, it is not the picture. */
import { serve, open, clearAll, found } from "../harness.mjs";

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
console.log(`\n  THE BEATS, BY KIND, AND THE POOL EACH DRAWS ON`);
console.log(`  (a kind read often from a small pool is the writing a career wears out)\n`);
console.log(`    ${"kind".padEnd(10)} ${"read".padStart(6)} ${"share".padStart(7)} `
  + `${"shapes".padStart(7)} ${"re-reads".padStart(9)}`);
for(const [k,v] of ks){
  const P = out.pools[k] || { pool:0 };
  const rr = P.pool ? (v/P.pool).toFixed(1) : "-";
  console.log(`    ${String(k).padEnd(10)} ${String(v).padStart(6)} `
    + `${(v/tot*100).toFixed(1).padStart(6)}% ${String(P.pool).padStart(7)} ${String(rr).padStart(9)}`);
}
console.log("");
