/* DOES THE LATE GAME HAVE ANYTHING ON THE LIST THAT IS ITS OWN?

   Three numbers are already on file, measured through two reference players over 8 houses of 400 weeks:
   urgent items fall from about 0.95 a week in year 1-3 to about 0.62 in year 12+; new items from 4.85 to
   2.7; distinct labels a player ever sees from ~260 to ~150. And the count of AVAILABLE items GROWS over
   the same span, 7.5 to 12.2. So the late list is not short. It is long and stale.

   That leaves a question the three numbers do not answer, and it is the one that decides what to build:
   is the late list long because late systems are adding to it, or because EARLY items never stop firing?

   So every label is stamped with the eras it is ever seen in, and sorted into:
     EARLY-ONLY   never seen after year 7
     PERENNIAL    seen in the first era and still seen in the last
     LATE-ONLY    never seen before year 7 — the late game's own content
   and each is weighted by how often it is actually SHOWN (urgency >= 3 or age <= AG_FRESH, which is
   agendaTop's own rule) rather than merely available, because a player reads the shown block.

   THE FALSIFIABLE FORM. If the late game has content of its own, LATE-ONLY labels should be a decent
   share of what a year-12 house is shown, and some of them should be urgent. If instead year 12 is
   reading the same perennial furniture as year 1 — "There are men on the block", "#d sitting in the
   box" — then the quietness is not a shortage of items at all; it is that nothing NEW is ever asked of a
   great house, and the fix is content rather than tuning.

   AND THE PROBE FAULT TO AVOID, which has bitten every long-run measurement in this project: the
   reference lanista must actually PLAY. A house that presses End Week and nothing else is bankrupt by
   week 55 and never reaches year 12 at all, so the late eras would be measured on a handful of survivors
   selected for having done nothing. R.lanista ends the week itself — no endWeek after it.

   AND THE ONE THIS PROBE ACTUALLY MADE. The first run reported 171 LATE-ONLY labels carrying 29% of what
   a year-12 house reads, which would have meant the late game had plenty of its own content and the
   problem was only its urgency. Reading the list gave it away: "Dromas has earned his mastery",
   "Boudica could be taught a move of his own", "Sostratos is not buried properly". Those are LATE-ONLY
   because DROMAS did not exist in year one — the item is perennial and the man is new. agKey normalises
   digits to # and stops there, so every per-man line is a fresh label each time the yard turns over,
   which also inflates the "distinct labels a player sees" figure that the quietness item rests on.
   So the key here strips NAMES too, gathered from the house's own people rather than guessed at. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 8), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const ERAS = [[1,52,"year 1-3"],[53,120,"year 3-7"],[121,220,"year 7-12"],[221,9999,"year 12+"]];
  const era = w => (ERAS.find(e=>w>=e[0]&&w<=e[1])||ERAS[3])[2];
  const eraNames = ERAS.map(e=>e[2]);
  /* per label: which eras it was AVAILABLE in, which it was SHOWN in, and its best urgency */
  const lab = new Map();
  /* every name this house has ever known, so a per-man line collapses onto its template. Taken off the
     state rather than pattern-matched for capitals, which would eat Rome, Capua and Pompeii. */
  const known = new Set();
  const learn = d => {
    for(const g of (d.gladiators||[])) if(g && g.name) known.add(g.name);
    for(const g of (d.market||[])) if(g && g.name) known.add(g.name);
    for(const g of (d.fallen||[])) if(g && g.name) known.add(g.name);
    for(const h of (d.rivals||[])) if(h && h.name) known.add(h.name);
    for(const s of (d.staff||[])) if(s && s.name) known.add(s.name);
    for(const s of Object.values(d.patrons||{})) if(s && s.name) known.add(s.name);
    if(d.doctore && d.doctore.name) known.add(d.doctore.name);
    if(d.lanista && d.lanista.name) known.add(d.lanista.name);
    if(d.heir && d.heir.name) known.add(d.heir.name);
  };
  const KEY = label => {
    let t = String(label||"");
    for(const n of known) if(n && t.includes(n)) t = t.split(n).join("~");
    return A.agKey(t);
  };
  const shownBy = {}, urgentBy = {}, weeks = {};
  for(const n of eraNames){ shownBy[n] = 0; urgentBy[n] = 0; weeks[n] = 0; }
  let died = 0, reached = 0;
  for(let h=0; h<H; h++){
    const d = A.newGameState("Lt"+h, "clean", `LATE-${h}`, null);
    let far = false;
    for(let w=0; w<W; w++){
      if(d.over){ died++; break; }
      const E = era(d.week);
      weeks[E]++; if(E === eraNames[eraNames.length-1]) far = true;
      learn(d);
      const rank = A.agendaRanked(d);
      const top = A.agendaTop(rank);
      const topKeys = new Set(top.map(a=>KEY(a.label)));
      for(const a of rank){
        const k = KEY(a.label);
        let r = lab.get(k);
        if(!r){ r = { k, avail:{}, shown:{}, urg:0, urgSum:0, urgN:0, eraUrg:{} }; lab.set(k, r); }
        r.avail[E] = (r.avail[E]||0) + 1;
        r.urg = Math.max(r.urg, a.urgency||0);
        r.eraUrg[E] = Math.max(r.eraUrg[E]||0, a.urgency||0);
        r.urgSum += (a.urgency||0); r.urgN++;
        if(topKeys.has(k)){
          r.shown[E] = (r.shown[E]||0) + 1;
          shownBy[E]++;
          if((a.urgency||0) >= 3) urgentBy[E]++;
        }
      }
      R.lanista(d);   /* ends the week itself */
    }
    if(far) reached++;
  }
  return { labs:[...lab.values()], names:eraNames, nNames:known.size, reached, shownBy, urgentBy, weeks, died, H, W, rope:R.say() };
}, [H,W]);
await browser.close(); server.close();

const N = out.names, FIRST = N[0], LAST = N[N.length-1];
const cls = r => {
  const seen = N.filter(n => r.avail[n]);
  if(!seen.length) return "unseen";
  const early = seen.includes(FIRST) || seen.includes(N[1]);
  const late = seen.includes(LAST) || seen.includes(N[2]);
  return early && late ? "PERENNIAL" : late ? "LATE-ONLY" : "EARLY-ONLY";
};
const groups = { "EARLY-ONLY":[], "PERENNIAL":[], "LATE-ONLY":[] };
for(const r of out.labs){ const c = cls(r); if(groups[c]) groups[c].push(r); }

console.log(`=== WHAT A GREAT HOUSE IS ASKED FOR ===`);
console.log(`  ${out.H} houses x up to ${out.W} weeks · ${out.reached} reached year 12+ · ${out.died} ended somewhere`);
console.log(`  weeks by era: ${N.map(n=>`${n} ${out.weeks[n]}`).join(" · ")}`);
console.log(`  ${out.labs.length} distinct labels once ${out.nNames} names are normalised out\n`);

console.log(`  kind          labels   of the SHOWN block in ${LAST}   urgent among them`);
for(const k of ["EARLY-ONLY","PERENNIAL","LATE-ONLY"]){
  const g = groups[k];
  const sh = g.reduce((n,r)=>n + (r.shown[LAST]||0), 0);
  const pct = out.shownBy[LAST] ? (sh/out.shownBy[LAST]*100) : 0;
  const urg = g.filter(r=>r.urg >= 3).length;
  console.log(`  ${k.padEnd(12)} ${String(g.length).padStart(6)}   ${pct.toFixed(1).padStart(24)}%   `
    + `${urg} of ${g.length} labels can reach urgency 3`);
}

console.log(`\n  and the same split in every era, as a share of what is SHOWN:`);
for(const k of ["EARLY-ONLY","PERENNIAL","LATE-ONLY"]){
  const g = groups[k];
  console.log(`  ${k.padEnd(12)} ` + N.map(n=>{
    const sh = g.reduce((a,r)=>a + (r.shown[n]||0), 0);
    return `${n} ${(out.shownBy[n] ? sh/out.shownBy[n]*100 : 0).toFixed(1)}%`; }).join(" · "));
}
console.log(`\n  THE SHOWN BLOCK IN ${LAST.toUpperCase()}, most often first — this is what a great house reads:`);
const late = out.labs.filter(r=>r.shown[LAST]).sort((a,b)=>(b.shown[LAST]||0)-(a.shown[LAST]||0));
for(const r of late.slice(0,18)){
  const share = (r.shown[LAST]/out.weeks[LAST]*100).toFixed(0);
  console.log(`    ${String(share).padStart(3)}% of weeks  urg<=${r.urg}  ${cls(r).padEnd(10)}  ${r.k}`);
}

console.log(`\n  AND THE LATE-ONLY LABELS IN FULL — the late game's own content, such as it is:`);
const lo = groups["LATE-ONLY"].sort((a,b)=>(b.shown[LAST]||0)-(a.shown[LAST]||0));
if(!lo.length) console.log(`    NONE. Every label a year-12 house sees, it could have seen in year one.`);
for(const r of lo.slice(0,20))
  console.log(`    shown ${String(r.shown[LAST]||0).padStart(4)}w  urg<=${r.urg}  mean urg ${(r.urgSum/r.urgN).toFixed(1)}  ${r.k}`);

console.log(`\n  urgent items per week, by era: `
  + N.map(n=>`${n} ${(out.urgentBy[n]/Math.max(1,out.weeks[n])).toFixed(2)}`).join(" · "));
console.log(`  rope: ${out.rope}`);

/* ---- AVAILABLE IN THE LAST ERA AND NEVER SHOWN THERE ----
   agendaTop's rule is `urgency >= 3 || age <= AG_FRESH`, so a label sitting at urgency 3 CANNOT be
   withheld. A late-only label that is available in year 12+ and never shown there is therefore either
   never urgent in that era (whatever its lifetime maximum was) or never fresh — it has been on the list
   so long that its age has run past AG_FRESH and it simply never rises again. That second case is
   content the house owns, that the game knows about, and that the player is never pointed at. */
const stale = out.labs.filter(r => (r.avail[LAST]||0) > 0 && !(r.shown[LAST]||0))
  .sort((a,b)=>(b.avail[LAST]||0)-(a.avail[LAST]||0));
console.log(`\n  AVAILABLE IN ${LAST.toUpperCase()} AND NEVER ONCE SHOWN THERE — ${stale.length} labels:`);
console.log(`    weeks   best urgency in that era   lifetime best   label`);
for(const r of stale.slice(0, 18))
  console.log(`    ${String(r.avail[LAST]).padStart(5)}   ${String(r.eraUrg[LAST]||0).padStart(24)}   `
    + `${String(r.urg).padStart(13)}   ${cls(r).padEnd(10)} ${r.k.slice(0,50)}`);
const urgentStale = stale.filter(r => (r.eraUrg[LAST]||0) >= 3);
console.log(`\n  of those, ${urgentStale.length} reached urgency 3 IN THAT ERA and were still never shown,`);
console.log(`  which agendaTop's own rule says is impossible — if any appear, the rule is not what ranks the block.`);
for(const r of urgentStale.slice(0,8)) console.log(`    ${r.k.slice(0,60)}`);
