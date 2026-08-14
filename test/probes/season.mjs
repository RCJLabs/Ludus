/* IS A SEASON WORTH ITS WEEKS?

   `PLANSEASON` is five long training arcs — 8 to 18 weeks — that fix a man's drill for the duration
   and pay a block of stats and a named trait at the end. `planWeek` advances one only while he is
   `active`, `planDrill` overrides whatever regimen the player set, and the payout lands in a single
   lump on the final week or not at all.

   NO SEASON HAS EVER RUN IN THIS PROJECT. `startPlan` was off the handle until v3.23.0 and the
   reference player has no step for it, which `dark.mjs` confirmed the hard way: `breakPlan`'s gate
   was open on 0% of weeks because there was never a season to break. So the balance question has
   never been asked, and it is a real one — eighteen weeks is a fifth of a fighting career.

   THE DESIGN IS A CONTROLLED PAIR, NOT A POLICY COMPARISON. Two houses from the SAME SEED, identical
   in every way except that in one of them a named man is put on a season on week one. Everything else
   is the same reference player. A whole-house policy arm would answer a different and much noisier
   question — this asks what the season did TO THE MAN.

   The arms diverge in their RNG the moment the drills differ, which is why it is run over many seeds
   and reported as a mean rather than read off any single pair. Same seed, one difference, many pairs.

   WHAT IS MEASURED, and the last one is the point:
     · his six stats at the end of the season's own length
     · whether the trait was actually granted
     · WHETHER HE IS STILL ALIVE — a season does not stop him being sent to the sand, and the payout
       is a lump at the end, so a man who dies in week seventeen of eighteen got nothing at all
     · and the same at the season's length PLUS a tail, since a payout that arrives is worth more the
       longer he lives to use it

   HOW THIS COULD BE WRONG: `newGameState` reseeds the global RNG, so a pair built in the wrong order
   pins its own draws — `styles` paid two releases for that lesson. Each arm therefore builds its own
   state from the same seed string immediately before running, and the control runs FIRST so it cannot
   inherit anything from the treated arm. If the two arms' men differ at week 0 the pair is discarded
   and counted, because a pair that did not start identical measures nothing. */
import { serve, open } from "../harness.mjs";
const SEEDS = +(process.argv[2] || 24), TAIL = +(process.argv[3] || 40);
/* #135's control arm: `bench` keeps the trainee off the card entirely, so the death rate can be
   attributed to the season or to the bout policy rather than to both at once. */
const BENCH = process.argv[4] === "bench";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([SEEDS, TAIL, BENCH])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  if(!A.PLANSEASON || !A.startPlan) return { err:"PLANSEASON/startPlan not on the handle" };
  const KINDS = Object.keys(A.PLANSEASON);
  const S6 = A.STATS;
  const sum = g => S6.reduce((s,k)=>s+(g[k]||0), 0);

  /* ---- THE FIRST VERSION ASKED THE WRONG QUESTION, AND ITS OWN OUTPUT SAID SO ----
     Comparing stats after `weeks == P.weeks` assumed a season takes its advertised length. It does
     not: `still on` came back 20 to 23 of 24 for every kind, and `finished` 0 to 3. `planWeek`
     increments `p.done` ONLY while the man is `active`, so every week he spends injured is a week
     the season does not advance — and the reference player's men are injured often. So the advertised
     18 weeks is a floor, not a length, and a stat comparison at week 18 was measuring a season still
     in flight against a control that had been drilling freely the whole time.
     The first version also called a column `alive` when it tested `status === "active"`, which counts
     an injured man as dead. Both are fixed: this runs to COMPLETION or death, and reports the real
     calendar cost. */
  const run = (seed, kind, cap) => {
    const d = A.newGameState("Sn", "clean", seed, null);
    const men = A.activeG(d);
    if(!men.length) return null;
    const id = men[0].id;
    const start = A.STATS.reduce((s,k)=>s+(men[0][k]||0), 0);
    if(kind && !A.startPlan(d, men[0], kind)) return null;
    let wk = 0, activeWeeks = 0, hurtWeeks = 0, done = null;
    for(; wk < cap; wk++){
      if(d.over) break;
      const g = (d.gladiators||[]).find(x=>x.id === id);
      if(!g || g.status === "dead") break;
      if(g.status === "active") activeWeeks++; else hurtWeeks++;
      if(kind && !g.plan && done === null){ done = wk; break; }   /* the season ended */
      /* the bench applies to BOTH arms, so the comparison stays like for like */
      R.lanista(d, BENCH ? { bench:[id] } : {});
    }
    const g = (d.gladiators||[]).find(x=>x.id === id);
    return { id, start, weeks: wk, activeWeeks, hurtWeeks, done,
      dead: !g || g.status === "dead",
      stats: g ? A.STATS.reduce((s,k)=>s+(g[k]||0), 0) : null,
      traits: g ? (g.traits||[]).length : 0,
      stillOn: !!(g && g.plan), houseOver: !!d.over };
  };

  const rows = [];
  let voided = 0, mismatched = 0;
  const CAP = 260;
  for(const kind of KINDS){
    const P = A.PLANSEASON[kind];
    const acc = { kind, name:P.name, len:P.weeks, n:0, finished:0, diedFirst:0, houseDied:0,
      tookWeeks:[], hurt:0, ctlStats:0, seaStats:0, bothAlive:0, ctlTraits:0, seaTraits:0 };
    for(let s2=0; s2<SEEDS; s2++){
      const seed = `SEASON-${kind}-${s2}`;
      const c = run(seed, null, CAP);            /* control first, so it cannot inherit RNG state */
      const t = run(seed, kind, CAP);
      if(!c || !t){ voided++; continue; }
      if(c.start !== t.start || c.id !== t.id){ mismatched++; continue; }
      acc.n++;
      acc.hurt += t.hurtWeeks;
      if(t.done != null){ acc.finished++; acc.tookWeeks.push(t.done); }
      else if(t.dead) acc.diedFirst++;
      else if(t.houseOver) acc.houseDied++;
      /* stats compared only where BOTH men are alive — a dead man's total is not a training result */
      if(!c.dead && !t.dead && c.stats != null && t.stats != null){
        acc.bothAlive++; acc.ctlStats += c.stats; acc.seaStats += t.stats;
        acc.ctlTraits += c.traits; acc.seaTraits += t.traits;
      }
    }
    rows.push(acc);
  }
    return { rows, voided, mismatched, SEEDS, TAIL, pays:KINDS.map(k=>({ k,
    pays:A.PLANSEASON[k].pays, trait:A.PLANSEASON[k].trait||null, weeks:A.PLANSEASON[k].weeks })) };
}, [SEEDS, TAIL, BENCH]);
await browser.close(); server.close();
if(out.err){ console.error(out.err); process.exit(1); }
const f = v => (Math.round(v*10)/10).toFixed(1);
console.log(`=== IS A SEASON WORTH ITS WEEKS? ===  [${BENCH ? "TRAINEE BENCHED — never fought" : "trainee fights as usual"}]`);
console.log(`  ${out.SEEDS} seeds per season, control first, same seed both arms · tail ${out.TAIL} weeks`);
console.log(`  ${out.voided} pairs void (season would not start) · ${out.mismatched} discarded for not starting identical\n`);
console.log(`  what each season PAYS on paper:`);
for(const p of out.pays)
  console.log(`    ${p.k.padEnd(7)} ${String(p.weeks).padStart(2)}w  `
    + Object.entries(p.pays||{}).map(([k,v])=>`${k}+${v}`).join(" ").padEnd(24)
    + (p.trait ? `trait ${p.trait}` : ""));
const med = a => { if(!a.length) return null; const b=a.slice().sort((x,y)=>x-y); return b[Math.floor(b.length/2)]; };
console.log(`\n  HOW LONG A SEASON ACTUALLY TAKES. \`planWeek\` only advances while the man is ACTIVE,`);
console.log(`  so every injured week is a week it does not move. The advertised length is a FLOOR.`);
console.log(`    season  advertised   ever finished   median weeks taken   injured weeks   died first   house died`);
for(const r of out.rows){
  if(!r.n){ console.log(`    ${r.kind.padEnd(7)} no pairs`); continue; }
  const m = med(r.tookWeeks);
  console.log(`    ${r.kind.padEnd(7)} ${String(r.len).padStart(9)}w`
    + `   ${String(r.finished).padStart(3)}/${String(r.n).padStart(2)}`
    + `        ${String(m == null ? "never" : m + "w").padStart(12)}`
    + `   ${f(r.hurt/r.n).padStart(11)}`
    + `   ${String(r.diedFirst).padStart(10)}   ${String(r.houseDied).padStart(10)}`);
}
console.log(`\n  AND WHAT IT DID TO HIM, among pairs where BOTH men were alive at the end —`);
console.log(`  a dead man's stat total is not a training result, so those pairs are dropped, not zeroed:`);
console.log(`    season   pairs both alive   control   season    gain     traits ctl/season`);
for(const r of out.rows){
  if(!r.bothAlive){ console.log(`    ${r.kind.padEnd(7)}   0 — nobody survived both arms`); continue; }
  const gain = (r.seaStats - r.ctlStats)/r.bothAlive;
  console.log(`    ${r.kind.padEnd(7)} ${String(r.bothAlive).padStart(15)}   ${f(r.ctlStats/r.bothAlive).padStart(7)}`
    + ` ${f(r.seaStats/r.bothAlive).padStart(8)}  ${((gain>=0?"+":"")+f(gain)).padStart(6)}`
    + `        ${r.ctlTraits} vs ${r.seaTraits}`);
}
