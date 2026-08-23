/* WHICH OF A GREAT HOUSE'S QUANTITIES DOES THE GAME NEVER ASK ABOUT?

   #131 measured that 97% of what a year-12 house is shown was available in week one, and named the
   fix as late content rather than tuning. `estate` then listed what is actually DISTINCTIVE about a
   late house — 3 rooms and 9 room-levels, 36 men on the books, 156 towns known, 3 children, 13.6
   law heat, 3 standing edicts, 29 buried and 14 of them unburied, 19 rivals met. That is the raw
   material. What nobody has established is which of those the week's list is BLIND to, and a grep
   cannot tell you: a quantity can be read by a predicate three functions away from any label.

   So this asks causally. Take a house played to year 12, and for each quantity apply two
   perturbations — an empty arm and a heaped arm — and diff the SET OF AGENDA LABELS either side. A
   quantity you can take to zero and to twenty without the morning list changing a word is a
   quantity the game does not ask about, whatever the source says.

   WHAT THIS CANNOT SEE, said plainly rather than discovered later: a quantity may drive an EVENT,
   a section's contents, a mark, or a number printed on a panel, none of which is an agenda label.
   Silence here means "raises no business on the week's list", not "is unused". The agenda is the
   thing #131 measured and the thing a player works from, which is why it is the thing measured.

   AND A SILENCE HERE CAN STILL BE THE PROBE'S. This reported LAW HEAT silent. Driven properly —
   `heat.mjs`, 14 houses x 400 weeks, with a gambit lever added to the rope because it had none —
   an ordinary house is in breach on 38% of its weeks, past heat 45 on 16%, and the `banned` ending
   fires at 0.4%. The law is live. What this diff cannot see is heat's actual work, which is on the
   URGENCY of a row that is not present every week: the urgency counter below only compares rows
   present in BOTH label sets, so a term that decides how loudly an intermittent row speaks slips
   through both halves. Before filing anything on this list as dead, drive it deliberately.

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
  const labels = d => { try { return new Set(A.agenda(d).map(r=>norm(r.label))); } catch(e){ return new Set(); } };
  /* ---- AND URGENCY IS A CHANGE TOO ----
     The first cut diffed label SETS only, and reported law heat silent across 50 perturbations.
     It is not: at src:3350 the breach row is raised from urgency 2 to 3 the moment heat passes 45.
     A quantity that decides how loudly the week speaks is not one the week ignores — my diff was
     throwing that away before it could be seen. Both are counted now, separately, because "adds a
     row" and "makes an existing row shout" are different kinds of content. */
  const urgs = d => { try { const m = {}; for(const r of A.agenda(d)) m[norm(r.label)] = Math.max(m[norm(r.label)]||0, r.urgency||0); return m; } catch(e){ return {}; } };

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

  const tally = Q.map(q=>({ name:q[0], moved:0, changed:0, louder:0, tried:0, base:0, examples:[] }));
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
      const base = labels(d), baseU = urgs(d);
      for(const mut of [low, high]){
        if(!mut) continue;
        t.tried++;
        const c = clone(d);
        const before = read(c);
        try { mut(c); } catch(e){ continue; }
        const after = read(c);
        if(after === before) continue;          /* the mutation did not bite — not evidence */
        t.moved++;
        const now = labels(c), nowU = urgs(c);
        const gone = [...base].filter(x=>!now.has(x));
        const born = [...now].filter(x=>!base.has(x));
        const louder = Object.keys(nowU).filter(k=>baseU[k] != null && nowU[k] !== baseU[k]);
        if(gone.length || born.length){
          t.changed++;
          if(t.examples.length < 2) t.examples.push(`${before}→${after}: ${[...gone.map(g=>"-"+g), ...born.map(b=>"+"+b)].slice(0,2).join(" ")}`);
        } else if(louder.length){
          t.louder = (t.louder||0) + 1;
          if(t.examples.length < 2) t.examples.push(`${before}→${after}: urgency only — "${louder[0]}" ${baseU[louder[0]]}→${nowU[louder[0]]}`);
        }
      }
    }
    }
  }
  return { tally, houses, lateHouses, samples, rope:R.say() };
}, [H, W]);

await browser.close(); server.close();
console.log(`=== WHAT THE WEEK'S LIST NOTICES ===  ${out.lateHouses} of ${out.houses} houses reached the late game · ${out.samples} week-samples, each perturbed both ways\n`);
console.log(`  ${"quantity".padEnd(22)} ${"late".padStart(6)} ${"probes".padStart(7)} ${"moved".padStart(6)} ${"list changed".padStart(13)}`);
const mute = [];
for(const t of out.tally){
  const verdict = !t.moved ? "UNTESTED" : t.changed ? `${t.changed}/${t.moved}`
    : t.louder ? `urg only ${t.louder}/${t.moved}` : "*** SILENT ***";
  console.log(`  ${t.name.padEnd(22)} ${String(t.base).padStart(6)} ${String(t.tried).padStart(7)} ${String(t.moved).padStart(6)} ${verdict.padStart(13)}`);
  for(const e of t.examples) console.log(`      ${e}`);
  if(t.moved && !t.changed && !t.louder) mute.push(t.name);
}
console.log(`\n  ${mute.length} quantities can be emptied or heaped without the morning list changing a word:`);
mute.forEach(m=>console.log(`    ${m}`));
console.log(`\n  rope: ${out.rope}`);
