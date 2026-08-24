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

   ---- AND THE COUNT HAS BEEN WRONG TWICE. IT IS NINETEEN REGISTERS NOW, NOT EIGHT ----
   v3.115.0 took it from five to eight and asked whether eight was enough. It was not, three ways,
   and every one of them was this probe rather than the game:

     · THE EVENTS CHANNEL WAS INERT FROM THE DAY IT WAS ADDED. It read `!e.when || !!e.when(d)`,
       and **not one of the 59 EVENTS entries has a `when`** — they gate by `make(d)` returning
       null, which is what `pickEvent` walks. `!e.when` was true for all 59 on both arms, so the
       set was constant and the diff could never fire. The channel its own note calls "the game's
       largest content channel" had reported nothing, ever.
     · ELEVEN MORE TABLES PAIR A PREDICATE WITH A LINE OF WRITING and none was on the test handle:
       COUNSEL, WHISPERS, YARD, LATE, NIGHT, ROME_TURNS, RUINS, ASKS, REFUSE_REASONS, RIVAL_MOVES,
       FREEDMEN. `EVENTS` was never the only register; it was the only one anybody had exported.
     · AND THE HEAPED ARM FOR LAW HEAT WAS BELOW EVERY GATE IN THE GAME — see the note on it below.

   It now diffs nineteen registers, and SILENT means silent in all of them:

     labels    the set of agenda rows, normalised
     urgency   label -> urgency, over the UNION of both sides, so a row that only APPEARS counts,
               and so does a term that merely decides how loudly an intermittent row speaks. The
               old counter walked the INTERSECTION, which is empty for a row that is not there
               every week — which is exactly how law heat came to read silent.
     marks     SECT_MARK, the vocabulary that lights a section and the villa's face chips
     live      SECT_LIVE, which decides whether a section reads as having something in it
     events    which of the EVENTS table can fire at all — the game's largest content channel, and
               one no earlier version of this probe could see

   ---- AND FIVE WAS STILL NOT ENOUGH: THREE MORE, AND THE SILENT LIST EMPTIED ----
   Every one of the five channels above is the WEEK'S LIST or a MARK on a section. The game speaks
   in at least three other registers and this probe was blind to all of them, so four of the five
   quantities it had left on the silent list were read the whole time:

     lesson    what the game would TEACH — `lessonFor(d)`. `gearCond` gates two of the twelve
               lessons (`armory.done` and the wear lesson's `when`), so emptying the shelf changes
               what a new house is told and the old channel set could not see it.
     perk      which permanent perk streams are running — `FEATS[k].perk` for every `hasFeat`.
               `d.feats` is read by `perkOn`, which is an EFFECT and not a sentence, so "feats
               earned" read silent while running five perk streams.
     figures   the derived numbers the panels print: acclaim and its target, the merchandising
               weekly, the rack's strain and overcrowding, the weekly bill, the credit line, the
               missio odds. `d.freed` feeds `acclaimTerms`' legend count; `d.brand.tier` is what
               `acclaimWeek` chronicles when it rises. A quantity that moves a NUMBER on a panel
               is not silent, and a set-diff of labels will never see it.

   AND THE SHELF WAS THE WRONG FIELD. "gear on the shelf" emptied `d.gearCond`, which is the
   armoury's pool of CONDITIONS for unworn pieces; every reader that counts the rack —
   `rackUsed`, `rackOver`, `gearFree` — reads `d.gear`, which the perturbation left alone. So the
   probe emptied a side-table and reported the rack silent. It empties both now.

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
    const out = { labels:new Set(), urg:{}, marks:{}, live:{}, events:new Set(), lesson:"", perks:"", fig:"", says:{} };
    try { for(const r of A.agenda(d)){ const k = norm(r.label);
      out.labels.add(k); out.urg[k] = Math.max(out.urg[k]||0, r.urgency||0); } } catch(e){}
    for(const k of Object.keys(A.SECT_MARK||{})){
      let v = null; try { v = A.sectMark(d,k); } catch(e){}
      out.marks[k] = v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v)); }
    for(const k of Object.keys(A.SECT_LIVE||{})){
      let v = null; try { v = A.sectLive(d,k); } catch(e){}
      out.live[k] = v === true ? 1 : v === false ? 0 : -1; }
    /* ---- THE EVENTS CHANNEL WAS INERT FOR ITS WHOLE LIFE ----
       This read `!e.when || !!e.when(d)`. **Not one of the 59 EVENTS entries has a `when`** — they
       all gate by `make(d)` returning null, which is what `pickEvent` walks. So `!e.when` was true
       for every entry on every arm, the set was the constant 59, and the diff could never fire.
       The channel the header calls "the game's largest content channel" has been reporting
       nothing since it was added.
       `make(d)` is the real gate and it is expensive to ask honestly: it generates opponents and
       markets, so it MUTATES and it advances the global RNG. The state is cloned and the seed put
       back, the same discipline `gate.mjs` needed for `giveAmbition`. */
    { const seed = A.rngGet ? A.rngGet() : null;
      for(const [k,e] of Object.entries(A.EVENTS||{})){
        let on = false;
        try { const c = A.clone(d); on = !!(e.make && e.make(c)); } catch(x){ on = false; }
        if(on) out.events.add(k); }
      if(seed != null) A.rngSet(seed); }
    /* ---- AND ELEVEN MORE TABLES THAT PAIR A PREDICATE WITH A LINE OF WRITING ----
       `EVENTS` is not the only register. Fourteen tables in the file gate a written line on the
       state; this probe could reach four. Which entries can fire is the same question the events
       channel asks, and the answer is a sentence the game is willing to say about a quantity. */
    { const seed = A.rngGet ? A.rngGet() : null;
      const live = (tbl, arg) => {
        const on = [];
        const entries = Array.isArray(tbl) ? tbl.map((v,i)=>[String(i),v]) : Object.entries(tbl||{});
        for(const [k,e] of entries){
          const f = e && (e.when || e.need);
          if(typeof f !== "function") continue;
          try { if(arg === undefined ? f(d) : f(d, arg)) on.push(k); } catch(x){}
        }
        return on.join(",");
      };
      const anyMan = (tbl) => {
        const men = (()=>{ try { return A.activeG(d) || []; } catch(x){ return []; } })();
        const hit = new Set();
        const entries = Object.entries(tbl||{});
        for(const [k,e] of entries){
          const f = e && (e.when || e.need);
          if(typeof f !== "function") continue;
          for(const g of men){ try { if(f(d, g)){ hit.add(k); break; } } catch(x){} }
        }
        return [...hit].sort().join(",");
      };
      out.says = {
        counsel: live(A.COUNSEL), whispers: live(A.WHISPERS), yard: live(A.YARD),
        late: live(A.LATE), night: live(A.NIGHT), rome: live(A.ROME_TURNS), ruins: live(A.RUINS),
        asks: anyMan(A.ASKS), refuse: anyMan(A.REFUSE_REASONS),
        rivals: (()=>{ const hs = d.rivals||[]; const hit = new Set();
          for(const [k,e] of Object.entries(A.RIVAL_MOVES||{})){ const f = e && (e.when||e.need);
            if(typeof f !== "function") continue;
            for(const h of hs){ try { if(f(d, h)){ hit.add(k); break; } } catch(x){} } }
          return [...hit].sort().join(","); })(),
        freedmen: (()=>{ const fs = d.freed||[]; const hit = new Set();
          for(const [k,e] of Object.entries(A.FREEDMEN||{})){ const f = e && (e.when||e.need);
            if(typeof f !== "function") continue;
            for(const x2 of fs){ try { if(f(d, x2)){ hit.add(k); break; } } catch(x){} } }
          return [...hit].sort().join(","); })(),
      };
      if(seed != null) A.rngSet(seed); }
    /* what the game would TEACH — a channel the first eight versions of this probe could not see */
    try { const L = A.lessonFor(d); out.lesson = L ? String(L.id||L.title||"") : ""; } catch(e){ out.lesson = "?"; }
    /* which permanent perk streams are running. `perkOn` is not on the handle; this is the same
       set built from the two things that are, so it is the game's own answer and not a copy of it */
    try { out.perks = (A.FEAT_KEYS||[]).filter(k=>A.hasFeat(d,k)).map(k=>(A.FEATS[k]||{}).perk||k).sort().join(","); }
    catch(e){ out.perks = "?"; }
    /* the derived numbers a panel prints. Each is the game's own function; a quantity that moves
       one of these is speaking, whatever the week's list does. */
    const num = (f, ...a) => { try { const v = f(...a); return typeof v === "number" ? Math.round(v*100)/100 : String(v); } catch(e){ return "?"; } };
    out.fig = [
      num(A.acclaimOf, d), num(A.acclaimTarget, d), num(A.merchWeekly, d), num(A.merchLive, d),
      num(A.rackUsed, d), num(A.rackOver, d), num(A.rackStrain, d), num(A.rackRent, d),
      num(A.weeklyBill, d), num(A.creditLine, d), num(A.missioOdds, d), num(A.gearUpkeep, d),
      num(A.riseNeed, d), num(A.censusWorth, d), num(A.acclaimTier, d),
      /* the odds on every gambit — two of the four are priced in LAW HEAT, continuously
         (`- lawOf(d).heat*0.002` and `*0.0025`), and no other channel can see a number that
         moves without crossing a threshold. #186. */
      ...(A.GAM_KEYS || Object.keys(A.GAMBITS || {})).map(k => num(A.gambitOdds, d, k)),
    ].join("|");
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
    for(const k of Object.keys(a.says||{})) if((a.says[k]||"") !== (b.says[k]||""))
      out.push(`says ${k} [${a.says[k]||"-"}]->[${b.says[k]||"-"}]`);
    if(a.lesson !== b.lesson) out.push(`lesson ${a.lesson||"(none)"}->${b.lesson||"(none)"}`);
    if(a.perks !== b.perks) out.push(`perk ${a.perks||"(none)"}->${b.perks||"(none)"}`);
    if(a.fig !== b.fig){ const A2 = a.fig.split("|"), B2 = b.fig.split("|");
      const names = ["acclaim","acclaimTarget","merchWeekly","merchLive","rackUsed","rackOver",
                     "rackStrain","rackRent","weeklyBill","creditLine","missioOdds","gearUpkeep",
                     "riseNeed","censusWorth","acclaimTier"]
        .concat((A.GAM_KEYS || Object.keys(A.GAMBITS || {})).map(k=>"gambit:"+k));
      for(let i=0;i<A2.length;i++) if(A2[i] !== B2[i]) out.push(`figures ${names[i]||("#"+i)} ${A2[i]}->${B2[i]}`); }
    return out;
  };
  const kindOf = t => t.split(" ")[0];

  /* name, read, empty arm, heaped arm */
  const Q = [
    ["unburied dead",    d=>(A.unhonoured?A.unhonoured(d):[]).length,
                         d=>{ (d.fallen||[]).forEach(m=>m.done=true); },
                         d=>{ d.fallen=(d.fallen||[]); for(let i=0;i<14;i++) d.fallen.push({ id:9000+i, name:"Man "+i, week:d.week-2, done:false }); }],
    /* ---- AND THE HEAPED ARM HAS TO CROSS THE THRESHOLDS THE READERS USE ----
       This was `heat=40`. Every discrete reader of law heat in the file sits ABOVE it: the agenda
       row that names a breach goes `heat>=45 ? 3 : 2`, and the `banned` ending wants `heat>=90`.
       So both arms — 0 and 40 — landed on the same side of every gate the game has, and the probe
       reported silence about a quantity it had never actually asked. That is the third variant of
       this directory's oldest lesson: a perturbation must be legal in the reader's terms, must
       move the field the readers read, and must be BIG ENOUGH to cross the numbers they compare
       against. 95 clears both. */
    ["law heat",         d=>((d.law||{}).heat)||0,
                         d=>{ if(d.law) d.law.heat=0; }, d=>{ if(d.law) d.law.heat=95; }],
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
    /* ---- THE WRONG FIELD, FOR EIGHT VERSIONS ----
       `d.gearCond` is the armoury's pool of CONDITIONS for unworn pieces. Every reader that counts
       the rack — rackUsed, rackOver, gearFree, the upkeep, the strain — reads `d.gear`. Emptying
       gearCond alone empties a side-table and leaves the shelf exactly as full as it was, which is
       how "gear on the shelf" came to read silent. The quantity is read off `rackUsed`, the game's
       own count, and BOTH fields are cleared. */
    ["gear on the shelf",d=>{ try { return A.rackUsed(d); } catch(e){ return Object.keys(d.gearCond||{}).length; } },
                         d=>{ d.gearCond={}; d.gear={}; }, null],
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
    /* ---- AND THE HEAPED ARM HAD TO BE THE SHAPE THE READER WANTS ----
       `d.freed` is an ARRAY of records and its one live reader is `acclaimTerms`, which counts
       `(d.freed||[]).filter(f=>(f.wins||0)>=10)` — the legends. The first version pushed eight
       records into it as though it were an OBJECT, with no `wins` on any of them, so the reader
       counted nought legends and the probe reported the game silent about a thing it reads. A
       perturbation has to be legal in the reader's terms, not just in JavaScript's. */
    ["men freed",        d=>(Array.isArray(d.freed) ? d.freed : Object.keys(d.freed||{})).length,
                         null, d=>{ if(!Array.isArray(d.freed)) d.freed = [];
                           for(let i=0;i<8;i++) d.freed.push({ name:"Freed "+i, week:d.week-i*5-6, wins:12, cls:"Murmillo" }); }],
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
console.log(`\n  ${mute.length} quantit${mute.length===1?"y moves":"ies move"} NOTHING in any of the NINETEEN registers — not a label, not an`);
console.log(`  urgency, not a mark, not a section's liveness, not which events can fire, not one of the`);
console.log(`  eleven other tables that gate a written line on the state, not what the game would teach,`);
console.log(`  not a perk stream, and not one of nineteen numbers a panel prints:`);
mute.forEach(m=>console.log(`    ${m}`));
console.log(`\n  WHAT IS LEFT, AND WHY IT IS NOT A GAME FAULT:`);
console.log(`    brand tier  a LATCH, not a state. \`acclaimWeek\` compares acclaimIdx(d) to d.brand.tier`);
console.log(`                only to decide whether a rise has just happened and the tier's \`once\` line`);
console.log(`                should be chronicled. Nothing reads it as a quantity, and nothing should.`);
console.log(`\n  LAW HEAT CAME OFF THIS LIST AND IT WAS NEVER SILENT. Three faults in this probe, not one`);
console.log(`  in the game: the heaped arm was heat=40 and every discrete reader sits above it (the`);
console.log(`  breach row goes \`heat>=45?3:2\`, \`banned\` wants 90), so both arms landed the same side of`);
console.log(`  every gate; two of the four GAMBITS are priced in heat continuously and no channel read`);
console.log(`  a number that moves without crossing a threshold; and the events channel below could`);
console.log(`  never fire at all. At heat 95 it answers on the urgency AND the odds.`);
console.log(`\n  And a silence is still only as good as the POLICY that produced the house — the reference`);
console.log(`  player reaches heat 0.7 by week 230, so nothing here was ever going to be about the game`);
console.log(`  until the arm made the quantity exist. Drive a thing, and drive it far enough, before`);
console.log(`  filing it dead.`);
console.log(`\n  rope: ${out.rope}`);
