/* THE ENDING CURVE — #247 phase 1, the instrument.

   Fourteen of sixteen houses end, and two endings take almost all of them: debt and the cells.
   `probes/pace.mjs` arm 4 established the split and the era medians; this asks the three questions
   that decide whether #247 is one item or three, and it asks them of thirty-two houses so each
   shape has a real count behind it rather than six deaths and a shrug.

     1 · WHEN DID THE HOUSE FIRST KNOW? Per house, the first week of each marker the game already
         owns: gold under nothing, `runway` (#229) under RUNWAY_WARN and under zero, each of the
         three `debtStage` bands, unrest at the rising's own threshold of 50, and each rebellion
         stage. Against the week it died, that is a LEAD TIME — how long the house was dying
         before anything said so, and how long after the first word it had to act.

     2 · WHAT THE APPROACH LOOKS LIKE. Gold, unrest, roster and runway are sampled every week, and
         reported both by era (comparable with pace.mjs) and INDEXED ON DEATH: the medians at forty,
         twenty, ten, five and one week before the end. An era median cannot tell a house that fell
         off a cliff from one that bled out; this can.

     3 · WHAT KILLED IT, IN ITS OWN WORDS. `over.kind` is the verdict; the last twelve chronicle
         lines are the evidence. They are kept verbatim for the report, tallied by `kind`, and
         normalised to shapes (proper nouns and digits struck out, pace.mjs's idiom) so the
         sentences that recur across deaths of one kind rise to the top by count. NOTHING here
         classifies a death by reading prose — the probe reports frequencies and the reading is
         done by a person, which is the only honest way round.

   Seeded (the seed is the THIRD argument of newGameState — probe.mjs's fifth rule), so a phase-2
   or phase-3 retune can be measured against this run like for like.

     node test/probes/ending.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 32), W = +(process.argv[3] || 420), SEED = process.argv[4] || "END";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const q = a => { if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y);
    const at = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), min:s[0], max:s[s.length-1] }; };
  const shape = t => String(t||"").replace(/[A-Z][a-z]+/g, "_").replace(/\d+/g, "#").slice(0, 64);
  /* every marker the game already owns, read off the state — no new bookkeeping in the source */
  const MARKS = {
    goldNeg:  d => d.gold < 0,
    short:    d => { const r = A.runway(d); return r != null && r < A.RUNWAY_WARN; },
    blood:    d => { const r = A.runway(d); return r != null && r < A.RUNWAY_BAD; },
    dry:      d => { const r = A.runway(d); return r != null && r <= 0; },
    debt1:    d => (d.flags.debtStage||0) >= 1,
    debt2:    d => (d.flags.debtStage||0) >= 2,
    debt3:    d => (d.flags.debtStage||0) >= 3,
    unrest50: d => d.unrest >= 50,
    rising:   d => !!(d.rebellion && d.rebellion.stage >= 1),
    stage2:   d => !!(d.rebellion && d.rebellion.stage >= 2),
    stage3:   d => !!(d.rebellion && d.rebellion.stage >= 3),
  };
  const MK = Object.keys(MARKS);
  const BACK = [40, 20, 10, 5, 1];               /* weeks before the end, for the indexed approach */
  const houses = [];
  for(let h=0; h<H; h++){
    const d = A.newGameState("End"+h, "clean", `${SEED}-${h}`);
    const first = {}, series = [];
    for(let w=0; w<W; w++){
      if(d.over) break;
      const r = A.runway(d);
      series.push({ week:d.week, gold:Math.round(d.gold), unrest:Math.round(d.unrest),
        roster:A.activeG(d).length, runway: r == null ? null : r, fame:Math.round(d.fame) });
      for(const k of MK){ if(first[k] == null){ let on = false; try { on = !!MARKS[k](d); } catch(e){}
        if(on) first[k] = d.week; } }
      try { R.lanista(d); } catch(e){ break; }
    }
    const last = (d.log||[]).slice(0, 12).map(l=>({ text:String((l&&l.text)||l).slice(0, 150),
      kind:(l&&l.kind)||"info", week:(l&&l.week)||null }));
    houses.push({ h, end: d.over ? d.over.kind : "survived", week:d.week, over:d.over || null,
      goldAtEnd:Math.round(d.gold), unrestAtEnd:Math.round(d.unrest), rosterAtEnd:A.activeG(d).length,
      fameAtEnd:Math.round(d.fame), booksAtEnd:(d.gladiators||[]).filter(g=>!A.isGone(g)).length,
      yearAtEnd:A.yearOf(d), first, last, series });
  }
  return { houses, W, marks:MK, back:BACK,
    consts: { RUNWAY_WARN:A.RUNWAY_WARN, RUNWAY_BAD:A.RUNWAY_BAD, CREDIT:A.CREDIT_WEEKS || null } };
}, [H, W, SEED]);
await browser.close(); server.close();

/* ---- the reading, on this side, where it can be re-run against a saved run ---- */
const q = a => { if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y);
  const at = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
  return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), min:s[0], max:s[s.length-1] }; };
/* proper nouns struck out AND runs of them collapsed, so "Publius Terentius Nerva asked" and
   "Claudia Maior asked" are one sentence rather than two — pace.mjs's normaliser leaves the name
   COUNT in the key, and a house's men are named at every length */
const shape = t => String(t||"").replace(/[A-Z][a-z]+/g, "_").replace(/(?:_ )+_?/g, "_ ")
  .replace(/\d+/g, "#").slice(0, 64);
const P = (n, w) => String(n).padEnd(w);
const N = (v, w) => String(v == null ? "—" : v).padStart(w);
const HS = out.houses, died = HS.filter(x=>x.end !== "survived");
const byEnd = {}; for(const x of HS) (byEnd[x.end] = byEnd[x.end] || []).push(x);
const order = Object.keys(byEnd).sort((a,b)=>byEnd[b].length - byEnd[a].length);

console.log(`\nTHE ENDING CURVE — ${HS.length} houses x ${out.W} weeks, seed ${process.argv[4] || "END"}`);
console.log(`${died.length} of ${HS.length} ended; ${HS.length - died.length} were still standing at the wall.\n`);

console.log(`HOW THEY END`);
for(const k of order){ const g = byEnd[k], wk = q(g.map(x=>x.week));
  console.log(`  ${P(k, 12)} ${N(g.length, 3)}  week p10/p50/p90 ${N(wk.p10,4)} ${N(wk.p50,4)} ${N(wk.p90,4)}`
    + `   gold at the end p50 ${N(q(g.map(x=>x.goldAtEnd)).p50, 7)}  unrest p50 ${N(q(g.map(x=>x.unrestAtEnd)).p50, 3)}`
    + `  men ${N(q(g.map(x=>x.rosterAtEnd)).p50, 2)}`); }

console.log(`\n1 · WHEN THE HOUSE FIRST KNEW — the week each marker first read true, and how many weeks`);
console.log(`    of play it had left after it (p50; "—" is a marker that never fired)`);
for(const k of order){ const g = byEnd[k];
  console.log(`  ${k} (${g.length})`);
  for(const m of out.marks){
    const hit = g.filter(x=>x.first[m] != null);
    if(!hit.length){ console.log(`      ${P(m, 9)} never`); continue; }
    const at = q(hit.map(x=>x.first[m])), lead = q(hit.map(x=>x.week - x.first[m]));
    console.log(`      ${P(m, 9)} ${N(hit.length, 3)}/${N(g.length,2)} houses · first at week p50 ${N(at.p50, 4)}`
      + ` · then ${N(lead.p50, 4)} more weeks (p10 ${N(lead.p10,4)}, p90 ${N(lead.p90,4)})`);
  }
}

/* ---- THE OPENING, which is where a quarter of all houses are lost ---- */
{ const AT = [1, 4, 8, 12, 16, 20, 26, 32, 40, 52];
  const early = HS.filter(x=>x.end !== "survived" && x.week <= out.W/4);
  const rest  = HS.filter(x=>!early.includes(x));
  const row = (name, g) => { if(!g.length) return;
    const cells = AT.map(w=>{ const v = g.map(x=>{ const s = x.series.find(y=>y.week === w); return s ? s.gold : null; })
      .filter(v=>v != null); return N(v.length ? q(v).p50 : "—", 8); });
    console.log(`  ${P(name, 26)}${cells.join("")}`); };
  console.log(`\n1b · THE OPENING — gold p50 at week …, and who is already gone`);
  console.log(`  ${P("", 26)}` + AT.map(w=>String("w"+w).padStart(8)).join(""));
  row(`died inside era one (${early.length})`, early);
  row(`everyone else (${rest.length})`, rest);
  const em = {}; for(const x of early) em[x.end] = (em[x.end]||0)+1;
  console.log(`  the era-one dead: ` + (Object.entries(em).map(([k,n])=>`${k} ${n}`).join(" · ") || "none")
    + ` · of ${HS.length} houses, ${Math.round(1000*early.length/HS.length)/10}%`);
}

console.log(`\n2 · THE APPROACH, INDEXED ON DEATH — the p50 of each figure this many weeks before the end`);
console.log(`      ${P("", 12)} ` + out.back.map(b=>String(b).padStart(9)).join("") + `${"end".padStart(9)}`);
for(const k of order){ const g = byEnd[k]; if(k === "survived") continue;
  for(const f of ["gold", "unrest", "roster"]){
    const row = out.back.map(b=>{
      const vals = g.map(x=>{ const s = x.series[x.series.length - 1 - b]; return s ? s[f] : null; }).filter(v=>v != null);
      return N(vals.length ? q(vals).p50 : "—", 9); });
    const endVals = g.map(x=>f === "gold" ? x.goldAtEnd : f === "unrest" ? x.unrestAtEnd : x.rosterAtEnd);
    console.log(`  ${P(k, 12)} ${P(f, 7)}` + row.join("") + N(q(endVals).p50, 9));
  }
}

console.log(`\n    and by era, the same run (comparable with probes/pace.mjs arm 4)`);
for(const k of order){ const g = byEnd[k];
  const era = f => [0,1,2,3].map(e=>{ const vals = [];
    for(const x of g) for(const s of x.series) if(Math.min(3, Math.floor((s.week-1)/(out.W/4))) === e) vals.push(s[f]);
    return N(vals.length ? q(vals).p50 : "—", 8); }).join("");
  console.log(`  ${P(k, 12)} gold   ` + era("gold"));
  console.log(`  ${P("", 12)} unrest ` + era("unrest"));
}

console.log(`\n3 · WHAT KILLED IT, IN ITS OWN WORDS — the last twelve lines of every death, by kind,`);
console.log(`    and the sentences that recur across deaths of one kind`);
for(const k of order){ if(k === "survived") continue;
  const g = byEnd[k], kinds = {}, shapes = {};
  for(const x of g) for(const l of x.last){ kinds[l.kind] = (kinds[l.kind]||0)+1;
    const s = shape(l.text); (shapes[s] = shapes[s] || { n:0, eg:l.text })[0]; shapes[s].n++; }
  console.log(`  ${k} (${g.length} deaths, ${g.length*12} lines): `
    + Object.entries(kinds).sort((a,b)=>b[1]-a[1]).map(([kk,n])=>`${kk} ${n}`).join(" · "));
  const top = Object.entries(shapes).sort((a,b)=>b[1].n - a[1].n).slice(0, 6);
  for(const [, v] of top) console.log(`      ${N(v.n, 3)}x  ${v.eg.slice(0, 108)}`);
}

console.log(`\n    and one death in full, the commonest kind:`);
{ const k = order.find(x=>x !== "survived"), x = byEnd[k][0];
  console.log(`    house ${x.h}, ${k} at week ${x.week} (year ${x.yearAtEnd}), ${x.goldAtEnd}d, unrest ${x.unrestAtEnd}, ${x.rosterAtEnd} men`);
  for(const l of x.last) console.log(`      w${N(l.week, 4)} ${P(l.kind, 6)} ${l.text.slice(0, 104)}`); }

console.log(`\nJSON ${JSON.stringify({ endings:Object.fromEntries(order.map(k=>[k, byEnd[k].length])),
  weeks:Object.fromEntries(order.map(k=>[k, q(byEnd[k].map(x=>x.week)).p50])) })}`);
