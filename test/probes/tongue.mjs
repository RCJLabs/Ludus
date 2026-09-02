/* #223 — WHAT THE CHRONICLE ACTUALLY SAYS, AND HOW OFTEN IT SAYS IT AGAIN

   The item: "6,274 lines over 16 runs, 1,408 distinct — but the top of the table is boilerplate:
   the mercy line 616 times (15.6% of all weeks), festival announcements ~1,215 combined, 'the
   bench where he sat is empty' 230. The story organ's most common sentences are its least
   story-like. Recommend variant pools keyed to the man and the count — the third mercy in a month
   is a REPUTATION, and the line should know it."

   THE MEASUREMENT THAT DECIDES IT is not "how many lines repeat" — every game repeats lines, and a
   festival announcing itself every year is a CALENDAR doing its job, not a story failing. It is:

     1 · how much of what a player reads in a week is a sentence he has read before
     2 · WHICH lines carry the repetition, and whether those are the ones that should be unique
     3 · and whether the game already owns pools it is not drawing from

   A line is counted by its SHAPE, not its text: names, numbers and places are stripped, so
   "Gannicus is spared" and "Spiculus is spared" are one line, which is what a reader experiences.
   Counting raw text would report a healthy 1,408 distinct and miss the whole item.

     node test/probes/tongue.mjs 16 300 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 300);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"TONGUE" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  /* THE SHAPE OF A LINE, not its text. Proper nouns, numbers and quoted names are what make two
     tellings of the same sentence look distinct to a counter and identical to a reader. */
  const shape = t => String(t||"")
    .replace(/\d+/g, "#")
    .replace(/\b[A-Z][a-z]{2,}\b/g, "N")
    .replace(/[""'']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  const seen = new Map();          /* shape -> count */
  const byKind = {};
  let lines = 0, weeks = 0, houses = 0;
  const perWeek = [];

  for(let h=0; h<H; h++){
    houses++;
    const d = A.newGameState("Tongue", "clean", "TONGUE-"+h, null);
    let lastTop = null;
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d); } catch(e){ break; }
      weeks++;
      /* everything written this week: the log is newest-first, so take entries above the last
         one we saw. `kept` catches anything that rolled off a long week. */
      const log = (d.log||[]);
      let fresh = [];
      if(lastTop == null) fresh = log.slice();
      else { const i = log.indexOf(lastTop); fresh = i < 0 ? log.slice() : log.slice(0, i); }
      lastTop = log[0] || lastTop;
      perWeek.push(fresh.length);
      for(const e of fresh){
        lines++;
        const s = shape(e.text);
        seen.set(s, (seen.get(s)||0) + 1);
        byKind[e.kind||"info"] = (byKind[e.kind||"info"]||0) + 1;
      }
    }
  }

  const rows = [...seen.entries()].sort((a,b)=>b[1]-a[1]);
  /* ---- CONCENTRATION IS THE MEASURE, not "how many lines repeat" ----
     At 27,000 lines over 900-odd shapes nearly everything repeats eventually, so "99% are a shape
     you have read before" is true of any game and says nothing. What a reader actually feels is
     how much of a week is the SAME HANDFUL of sentences: the share of all lines taken by the ten
     and the fifty most common shapes. */
  const share = k => rows.slice(0, k).reduce((n,r)=>n+r[1], 0);
  const top10 = share(10), top50 = share(50);
  /* and the three families this release touched, each by the event rather than the sentence */
  const fam = { "the bout result":0, "the medicus table":0, "a man let up":0, "a festival announced":0 };
  for(const [sh, n] of rows){
    /* ORDER MATTERS AND THE FIRST CUT GOT IT WRONG: "let up" also matches the bout-result bucket,
       so the mercy family reported 0.0% while its lines were being counted as bout results. */
    if(/still alive somewhere|turned your thumb|another one let up|cells have begun to keep count/.test(sh))
      fam["a man let up"] += n;
    else if(/medicus|the table|palus on N/.test(sh)) fam["the medicus table"] += n;
    else if(/at the pits|at the N|died on the sand|took victory|had the better of|was beaten|let up|walked off|came off/.test(sh))
      fam["the bout result"] += n;
    else if(/are announced/.test(sh)) fam["a festival announced"] += n;
  }
  const famShapes = {};
  for(const k of Object.keys(fam)) famShapes[k] = 0;
  for(const [sh] of rows){
    if(/medicus|the table|palus on N/.test(sh)) famShapes["the medicus table"]++;
    else if(/are announced/.test(sh)) famShapes["a festival announced"]++;
  }
  const repeated = rows.filter(r=>r[1] > 1).reduce((n,r)=>n+r[1], 0);
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { p50:s[Math.floor(s.length/2)], p90:s[Math.floor(s.length*0.9)], max:s[s.length-1] }; };
  return { houses, weeks, lines, distinct: rows.length, repeated, byKind, top10, top50, fam, famShapes,
    perWeek: q(perWeek), top: rows.slice(0, 18).map(([s,n])=>({ n, s })),
    onceOnly: rows.filter(r=>r[1]===1).length };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.weeks} weeks over ${out.houses} houses · ${out.lines} chronicle lines`);
  console.log(`  ${out.distinct} distinct SHAPES · ${out.onceOnly} said exactly once`);
  console.log(`  ${out.repeated} of ${out.lines} lines (${(out.repeated/out.lines*100).toFixed(1)}%) are a shape the player has read before`);
  console.log(`  lines a week: ${JSON.stringify(out.perWeek)}`);
  console.log(`  CONCENTRATION: the 10 commonest shapes are ${(out.top10/out.lines*100).toFixed(1)}% of everything read;`
    + ` the 50 commonest are ${(out.top50/out.lines*100).toFixed(1)}%`);
  console.log(`  by family: ${Object.entries(out.fam).map(([k,v])=>`${k} ${(v/out.lines*100).toFixed(1)}%`).join(" · ")}`);
  console.log(`  by kind: ${Object.entries(out.byKind).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
  console.log(`\nTHE TOP OF THE TABLE — what a player reads over and over:`);
  for(const r of out.top)
    console.log(`  ${String(r.n).padStart(4)} (${(r.n/out.lines*100).toFixed(1)}%)  ${r.s.slice(0,96)}`);
}
console.log("\n" + JSON.stringify({ lines:out.lines, distinct:out.distinct, repeated:out.repeated }));
await browser.close(); server.close();
