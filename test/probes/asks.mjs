/* WHICH OF A GREAT HOUSE'S QUANTITIES DOES THE GAME NEVER SPEAK ABOUT?

   #131 measured that 97% of what a year-12 house is shown was available in week one, and named the
   fix as late content rather than tuning. `estate` listed what is actually DISTINCTIVE about a late
   house — 3 rooms and 9 room-levels, 36 men on the books, 156 towns known, 3 children, 13.6 law
   heat, 3 standing edicts, 29 buried and 14 of them unburied, 19 rivals met. That is the raw
   material. What nobody had established is which of those the game is BLIND to, and a grep cannot
   tell you: a quantity can be read by a predicate three functions from anything it moves.

   So this asks causally. Take a house played into its late game; for each quantity apply an empty
   arm and a heaped arm; diff what the game says, either side, on every sampled week.

   ---- IT USED TO DIFF ONE CHANNEL, AND THAT WAS NOT ENOUGH TO CONVICT ----
   The first version compared the SET OF AGENDA LABELS and nothing else. Three investigations that
   began from a "silent" verdict here found nothing to build — the census ladder was settled design,
   the `banned` ending was settled design, and the law was live all along. A verdict that keeps
   sending you at correct behaviour is too blunt to rank by.

   It now diffs five channels, and SILENT means silent in all of them:

     labels    the set of agenda rows, normalised
     urgency   label -> urgency, over the UNION of both sides, so a row that only APPEARS counts,
               and so does a term that merely decides how loudly an intermittent row speaks. The
               old counter walked the INTERSECTION, which is empty for a row that is not there
               every week — which is exactly how law heat came to read silent.
     marks     SECT_MARK, the vocabulary that lights a section and the villa's face chips
     live      SECT_LIVE, which decides whether a section reads as having something in it
     events    which of the EVENTS table can fire at all — the game's largest content channel, and
               one no earlier version of this probe could see

   TWO VERDICTS CHANGED ON THE SPOT. `children` read SILENT and answers 27 of 27 through section
   liveness (`live blood`). `piety` read as speaking through labels alone and also moves the temple
   MARK. The silent list went from seven to five.

   AND A SILENCE IS STILL ONLY AS GOOD AS THE POLICY THAT MADE THE HOUSE. This reported LAW HEAT
   silent, and the rope had no gambit lever — no policy in the suite had ever broken a law, and heat
   is a measure of exactly that. Driven with one (`heat.mjs`, 14 houses x 400 weeks), an honest
   house is in breach on 38% of its weeks, past heat 45 on 16%, and the `banned` ending fires at
   0.4%. It still reads silent below, on an honest house at 230 weeks, and that reading is about the
   player rather than the game. Before filing anything here as dead, drive it deliberately.

   AND THE PERTURBATION HAS TO BE LEGAL. Writing d.law.heat = 40 on a house whose law object does
   not exist tests nothing but my own typo, so every mutation reports whether it actually moved the
   quantity it names, and one that did not move is printed as UNTESTED rather than as silence.
*/
import { serve, open, found, clearAll, installRope, inside } from "../harness.mjs";

const H = +(process.argv[2] || 6), W = +(process.argv[3] || 230);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"ASKS" });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const clone = x => JSON.parse(JSON.stringify(x));
  const norm = t => String(t||"").replace(/\d+/g,"#").replace(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g,"~");

  /* ---- FIVE CHANNELS, BECAUSE ONE WAS NOT ENOUGH TO CONVICT ----
     The first version diffed AGENDA LABELS and nothing else, and called law heat silent. It is not:
     heat decides the URGENCY of the breach row, and that row is not present every week — so a
     set-diff misses it twice, once because urgency is not in the set and once because the
     intersection the urgency counter walked was empty.

     Worse, three investigations that began from a "silent" verdict here found nothing to build: the
     census ladder was settled design, `banned` was settled design, and the law was live all along.
     A verdict that keeps sending you at correct behaviour is too blunt to rank by.

     So every channel a week can speak through is diffed, and SILENT means silent in all of them:
       labels    the set of agenda rows, normalised
       urgency   label -> urgency, over the UNION so a row that only APPEARS still counts
       marks     SECT_MARK, the vocabulary that lights a section and the villa's face chips
       live      SECT_LIVE, which decides whether a section reads as having something in it
       events    which of the EVENTS table can fire at all — the game's largest content channel,
                 and one no earlier version of this probe could see
  */
  const chan = d => {
    const out = { labels:new Set(), urg:{}, marks:{}, live:{}, events:new Set() };
    try { for(const r of A.agenda(d)){ const k = norm(r.label);
      out.labels.add(k); out.urg[k] = Math.max(out.urg[k]||0, r.urgency||0); } } catch(e){}
    for(const k of Object.keys(A.SECT_MARK||{})){
      let v = null; try { v = A.sectMark(d,k); } catch(e){}
      out.marks[k] = v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v)); }
    for(const k of Object.keys(A.SECT_LIVE||{})){
      let v = null; try { v = A.sectLive(d,k); } catch(e){}
      out.live[k] = v === true ? 1 : v === false ? 0 : -1; }
    for(const [k,e] of Object.entries(A.EVENTS||{})){
      let on = false; try { on = !e.when || !!e.when(d); } catch(x){}
      if(on) out.events.add(k); }
    return out;
  };
  const diff = (a, b) => {
    const out = [];
    for(const x of a.labels) if(!b.labels.has(x)) out.push("label -"+x);
    for(const x of b.labels) if(!a.labels.has(x)) out.push("label +"+x);
    for(const k of new Set([...Object.keys(a.urg), ...Object.keys(b.urg)]))
      if((a.urg[k]||0) !== (b.urg[k]||0)) out.push(`urg ${k} ${a.urg[k]||0}->${b.urg[k]||0}`);
    for(const k of Object.keys(a.marks)) if(a.marks[k] !== b.marks[k]) out.push(`mark ${k}`);
    for(const k of Object.keys(a.live))  if(a.live[k]  !== b.live[k])  out.push(`live ${k}`);
    for(const x of a.events) if(!b.events.has(x)) out.push("event -"+x);
    for(const x of b.events) if(!a.events.has(x)) out.push("event +"+x);
    return out;
  };
  const kindOf = t => t.split(" ")[0];

  /* name, read, empty arm, heaped arm */
  const Q = [
    ["unburied dead",    d=>(A.unhonoured?A.unhonoured(d):[]).length,
                         d=>{ (d.fallen||[]).forEach(m=>m.done=true); },
                         d=>{ d.fallen=(d.fallen||[]); for(let i=0;i<14;i++) d.fallen.push({ id:9000+i, name:"Man "+i, week:d.week-2, done:false }); }],
    ["law heat",         d=>((d.law||{}).heat)||0,
                         d=>{ if(d.law) d.law.heat=0; }, d=>{ if(d.law) d.law.heat=40; }],
    ["edicts standing",  d=>(((d.law||{}).edicts)||[]).length,
                         d=>{ if(d.law) d.law.edicts=[]; }, null],
    ["towns known",      d=>Object.values(d.known||{}).reduce((s,v)=>s+(Array.isArray(v)?v.length:0),0),
                         d=>{ d.known={}; }, null],
    ["children",         d=>((d.domus||{}).children||[]).length,
                         d=>{ if(d.domus) d.domus.children=[]; }, null],
    ["rooms held",       d=>Object.keys(d.buildings||{}).length,
                         d=>{ d.buildings={}; }, null],
    ["men on the books", d=>(d.gladiators||[]).length,
                         null, null],
    ["gear on the shelf",d=>Object.keys(d.gearCond||{}).length,
                         d=>{ d.gearCond={}; }, null],
    ["household staff",  d=>Object.keys(d.household||{}).length,
                         d=>{ d.household={}; }, null],
    ["feats earned",     d=>Object.keys(d.feats||{}).length,
                         d=>{ d.feats={}; }, null],
    ["men killed by yours", d=>((d.book||{}).killed)||0,
                         d=>{ if(d.book) d.book.killed=0; }, d=>{ if(d.book) d.book.killed=60; }],
    ["acclaim",          d=>d.acclaim||0,
                         d=>{ d.acclaim=0; }, d=>{ d.acclaim=95; }],
    ["brand tier",       d=>((d.brand||{}).tier)||0,
                         d=>{ if(d.brand) d.brand.tier=0; }, d=>{ if(d.brand) d.brand.tier=3; }],
    ["ties",             d=>(d.ties||[]).length,
                         d=>{ d.ties=[]; }, null],
    ["rivals met",       d=>(d.rivals||[]).length,
                         null, null],
    ["patrons",          d=>A.patronsOf(d).length,
                         null, null],
    ["piety",            d=>d.piety||0,
                         d=>{ d.piety=0; }, d=>{ d.piety=100; }],
    ["men freed",        d=>Object.keys(d.freed||{}).length,
                         null, d=>{ d.freed=(d.freed||{}); for(let i=0;i<8;i++) d.freed["f"+i]={name:"Freed "+i, week:d.week-i*5}; }],
  ];

  const tally = Q.map(q=>({ name:q[0], moved:0, changed:0, tried:0, base:0, by:{}, examples:[] }));
  let houses = 0, lateHouses = 0, samples = 0;
  for(let h=0; h<H; h++){
    const d = A.newGameState("Asks","clean","ASKS-"+h, null); houses++;
    let sawLate = false;
    for(let w=0; w<W && !d.over; w++){
      R.lanista(d);
      /* ---- SAMPLE MANY WEEKS, NOT ONE ----
         The first cut perturbed each house ONCE, at the wall. It reported the law silent — and
         `late` had already shown "The house is in breach of an edict" on 14% of late weeks. Both
         cannot be true, and the probe was wrong: a quantity that only speaks when a CONDITION is
         met reads as mute on any week the condition happens not to hold. One snapshot per house
         measures the snapshot. */
      if(d.week < 145 || d.week % 7) continue;
      if(!sawLate){ sawLate = true; lateHouses++; }
      samples++;
    for(let i=0;i<Q.length;i++){
      const [name, read, low, high] = Q[i];
      const t = tally[i]; t.base = read(d);
      const base = chan(d);
      for(const mut of [low, high]){
        if(!mut) continue;
        t.tried++;
        const c = clone(d);
        const before = read(c);
        try { mut(c); } catch(e){ continue; }
        const after = read(c);
        if(after === before) continue;          /* the mutation did not bite — not evidence */
        t.moved++;
        const ds = diff(base, chan(c));
        if(ds.length){
          t.changed++;
          for(const one of ds) t.by[kindOf(one)] = (t.by[kindOf(one)]||0) + 1;
          if(t.examples.length < 2) t.examples.push(`${before}→${after}: ${ds.slice(0,2).join(" · ")}`);
        }
      }
    }
    }
  }
  return { tally, houses, lateHouses, samples, rope:R.say() };
}, [H, W]);

await browser.close(); server.close();
console.log(`=== WHAT THE WEEK'S LIST NOTICES ===  ${out.lateHouses} of ${out.houses} houses reached the late game · ${out.samples} week-samples, each perturbed both ways\n`);
console.log(`  ${"quantity".padEnd(22)} ${"late".padStart(8)} ${"probes".padStart(7)} ${"moved".padStart(6)} ${"answered".padStart(9)}   which channel answered`);
const mute = [];
for(const t of out.tally){
  const chans = Object.entries(t.by||{}).sort((x,y)=>y[1]-x[1]).map(([k,v])=>`${k} ${v}`).join(" · ");
  const verdict = !t.moved ? "UNTESTED" : t.changed ? `${t.changed}/${t.moved}` : "*** SILENT ***";
  const base = typeof t.base === "number" ? (Math.round(t.base*10)/10) : t.base;
  console.log(`  ${t.name.padEnd(22)} ${String(base).padStart(8)} ${String(t.tried).padStart(7)} ${String(t.moved).padStart(6)} ${verdict.padStart(9)}   ${chans || (t.moved ? "none" : "-")}`);
  for(const e of t.examples) console.log(`      ${e}`);
  if(t.moved && !t.changed) mute.push(t.name);
}
console.log(`\n  ${mute.length} quantities move NOTHING in any of the five channels — not a label, not an`);
console.log(`  urgency, not a mark, not a section's liveness, and not which events can fire:`);
mute.forEach(m=>console.log(`    ${m}`));
console.log(`\n  And a silence is still only as good as the POLICY that produced the house. Law heat read`);
console.log(`  silent here until the rope was given a gambit lever — it is live, and an honest house is`);
console.log(`  past heat 45 on 16% of a four-hundred-week game. Drive a thing before filing it dead.`);
console.log(`\n  rope: ${out.rope}`);
