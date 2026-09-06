/* THE CLIFF — #247a, the measurement before the warning.

   v3.207.0 measured the debt death and found it is not a slope. Indexed on death, a house dying of
   debt is carrying 4,359 and 2,105 denarii TEN WEEKS OUT (two seed sets) and about a thousand one
   week out, then goes under the creditors' line. The two instruments that exist both miss it: the
   `debtStage` ladder fired before 16 of 35 deaths, and #229's `runway` went under RUNWAY_WARN for
   88 houses of 88 — every survivor too, at a median week of 18 to 26. A marker that fires for every
   house that has ever lived cannot tell anybody anything.

   So the question this asks is not "is the house short" — they all are, all the time. It is:

     WHAT SEPARATES A SHORT WEEK THAT KILLS FROM A SHORT WEEK THAT DOES NOT?

   Every house-week where `runway < RUNWAY_WARN` is a CASE. A case is FATAL if the house dies of debt
   within DEAD_IN weeks of it. Each candidate signal below is read on every case, and what comes back
   is its separation: how often it reads true on the fatal cases against how often it reads true on
   all the others. A signal that reads true on both is another RUNWAY_WARN and is worth nothing.

     cashShort   the runway with the PAPER TAKEN OUT. `runway` is (gold + owedTotal) / bill, and
                 `owedTotal` is money that has not arrived and might not: `owedWeek` pays on a roll,
                 chases at four weeks late and writes off at eight. A house with 200 in the box and
                 3,000 booked reads a long runway and is one bad week from the line.
     paperHeavy  the same thing stated as a share: more than half of what the runway is counting is
                 not in the box.
     sinking     gold is lower than it was four weeks ago AND lower than eight weeks ago — a trend,
                 which no single-week reading can see.
     cannotSell  `liquidate` — steel on the racks, spare men, paper at a discount — would not raise
                 enough to clear the creditors' line. The house that can still sell its way out is
                 not dying; this is the one that cannot.
     goingBad    something owed to the house has been chased or written off in the last six weeks.
     deep        gold is already under water.
     burnShort   THE RUNWAY WITH THE INCOME IN IT. `runway` is gold-and-paper over the BILL, and the
                 agenda says what that means in as many words: "the box would carry this house N more
                 weeks", "Nd a week goes out whatever happens". It is the runway of a house that has
                 stopped earning. Every house that is earning reads it as alarming and it never means
                 anything. This is the same question asked of the actual weekly NET over the last
                 eight weeks: at the rate the box is really emptying, how long has it got? A house
                 whose net is positive is not on a runway at all.
     burnDeep    the same, under four weeks, which is where the agenda already says it in blood.
     oneBadWeek  THE BOX IS SMALLER THAN A NORMAL WEEK'S SWING. Read off the per-house tails, a
                 house near the end is not sliding gently: it moves by hundreds or thousands a week
                 in both directions, on purses, gear, a levy, a man bought. The question that shape
                 asks is not "how many weeks of bill is in the box" but "is there enough in the box
                 to take one ordinary week going the wrong way" — gold against the mean absolute
                 weekly change over the last eight.
     doomed      oneBadWeek AND burning AND cannot sell out of it: the three together.

   Prints, per signal: rate on the fatal cases, rate on the rest, and the LIFT (fatal ÷ rest). And
   for the fatal cases only, how many weeks of warning each signal would have given — a signal that
   fires a week before the end is a headstone, not a warning.

     node test/probes/cliff.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 32), W = +(process.argv[3] || 420), SEED = process.argv[4] || "CLIFF";
const DEAD_IN = 10;
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED, DEAD_IN])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","runway","weeklyBill","creditLine","owedTotal","owedList","liquidate","RUNWAY_WARN","RUNWAY_BAD"]
    .filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const houses = [], cases = [];
  for(let h=0; h<H; h++){
    const d = A.newGameState("Cl"+h, "clean", `${SEED}-${h}`);
    const weeks = [];
    for(let w=0; w<W; w++){
      if(d.over) break;
      const gold = d.gold, bill = A.weeklyBill(d), owed = A.owedTotal(d);
      const rw = A.runway(d);
      let sell = 0; try { sell = (A.liquidate(d) || {}).total || 0; } catch(e){}
      /* what the agenda actually SAYS this week, so the shipped line can be scored like a signal */
      let row = null; try { row = A.moneyRow(d); } catch(e){}
      const said = row ? (row.key || "runway") : null;
      let swing = null; try { swing = A.swingOf ? A.swingOf(d) : null; } catch(e){}
      const line = A.creditLine(d);
      const bad6 = (d.owed||[]).filter(x=>(x.chased || x.writtenOff) && d.week - x.due <= 6).length;
      weeks.push({ week:d.week, gold:Math.round(gold), bill, owed:Math.round(owed), net:null,
        rw: rw == null ? null : rw, cash: bill > 0 ? Math.floor(gold / bill) : null,
        sell:Math.round(sell), line:Math.round(line), bad6, roster:A.activeG(d).length,
        said, exposedNow: swing != null && gold < swing, swingNow: swing });
      try { R.lanista(d); } catch(e){ break; }
    }
    const end = d.over ? d.over.kind : "survived";
    houses.push({ h, end, week:d.week, n:weeks.length, tail: weeks.slice(-14),
      /* what the last week actually had to do: the gap between the last sampled box and the line
         it had to cross, against one week's bill and against an ordinary week's swing */
      fellBy: weeks.length ? Math.round(weeks[weeks.length-1].gold - weeks[weeks.length-1].line) : null,
      lastBill: weeks.length ? weeks[weeks.length-1].bill : null,
      warned: !!(d.flags && d.flags.debtStage) });
    /* EVERY week is a case, not only the short ones. The first cut scored candidates against the
       weeks the shipped row already fires on, which cannot compare an alternative that fires
       somewhere else — and the whole question is whether a different set of weeks is the right one
       to speak on. A case is fatal if the debt took the house inside DEAD_IN weeks of it. */
    for(let i=0; i<weeks.length; i++){
      const x = weeks[i];
      const fatal = end === "debt" && (d.week - x.week) <= DEAD_IN;
      const back = k => weeks[i-k] || null;
      const g4 = back(4), g8 = back(8);
      /* the real burn: what the box actually lost a week over the last eight, income and all */
      const burn = g8 ? (g8.gold - x.gold) / 8 : null;
      const burnRw = (burn != null && burn > 0) ? Math.floor(x.gold / burn) : null;
      /* how big an ordinary week is for this house, in either direction */
      let swing = null;
      if(g8){ let sum = 0, n = 0;
        for(let k = 1; k <= 8; k++){ const a = weeks[i-k], b = weeks[i-k+1];
          if(a && b){ sum += Math.abs(b.gold - a.gold); n++; } }
        swing = n ? sum / n : null; }
      const oneBad = swing != null && swing > 0 && x.gold < swing;
      const cannotSell = (x.gold + x.sell) < -x.line;
      const burnDeep = burnRw != null && burnRw < A.RUNWAY_BAD;
      cases.push({ h, week:x.week, fatal, toEnd: d.week - x.week, end,
        sig: {
          cashShort:  x.cash != null && x.cash < A.RUNWAY_WARN,
          paperHeavy: (x.gold + x.owed) > 0 && x.owed / (x.gold + x.owed) > 0.5,
          sinking:    !!(g4 && g8 && x.gold < g4.gold && x.gold < g8.gold),
          cannotSell,
          goingBad:   x.bad6 > 0,
          deep:       x.gold < 0,
          short:      x.rw != null && x.rw < A.RUNWAY_WARN,      /* the shipped #229 line */
          blood:      x.rw != null && x.rw < A.RUNWAY_BAD,
          burnShort:  burnRw != null && burnRw < A.RUNWAY_WARN,
          burnDeep,
          oneBadWeek: oneBad,
          doomed:     oneBad && burnDeep && cannotSell,
          bad2:       oneBad && burnDeep,
          bad3:       oneBad && cannotSell,
          /* THE THREE DESIGNS, scored against each other on the same weeks */
          optA:       oneBad || (x.rw != null && x.rw < A.RUNWAY_WARN),
          optB:       oneBad,
          optC:       oneBad || (x.rw != null && x.rw < A.RUNWAY_BAD),
          SHIPPED:    !!x.said,          /* whatever `moneyRow` actually returned this week */
        }, burnRw, swing: swing == null ? null : Math.round(swing) });
    }
  }
  return { houses, cases, warn:A.RUNWAY_WARN };
}, [H, W, SEED, DEAD_IN]);
await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const q = a => { if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y);
  return { n:s.length, p10:s[Math.floor(.1*s.length)], p50:s[Math.floor(.5*s.length)], p90:s[Math.floor(.9*s.length)], max:s[s.length-1] }; };
const P = (s, w) => String(s).padEnd(w), N = (v, w) => String(v == null ? "—" : v).padStart(w);
const ends = {}; for(const x of out.houses) ends[x.end] = (ends[x.end]||0)+1;
const fatal = out.cases.filter(c=>c.fatal), rest = out.cases.filter(c=>!c.fatal);
const KEYS = Object.keys(out.cases[0] ? out.cases[0].sig : {});

console.log(`\nTHE CLIFF — ${out.houses.length} houses, seed ${SEED}: `
  + Object.entries(ends).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · "));
console.log(`${out.cases.length} house-weeks — ${fatal.length} of them inside ${DEAD_IN} weeks of a death by debt, ${rest.length} not.`);
{ const sh = out.cases.filter(c=>c.sig.short), shf = sh.filter(c=>c.fatal);
  console.log(`The shipped #229 line speaks on ${sh.length} of them and is right ${(100*shf.length/(sh.length||1)).toFixed(1)}% of the time it does.\n`); }

console.log(`WHEN TO SPEAK — each design over every week, not only the weeks the old one covers`);
console.log(`  ${P("", 12)}${"weeks spoken".padStart(14)}${"right".padStart(9)}${"of the deaths reached".padStart(23)}`);
for(const k of ["short", "blood", "optB", "optC", "optA", "SHIPPED"]){
  const on = out.cases.filter(c=>c.sig[k]), hitF = on.filter(c=>c.fatal);
  const reached = new Set(hitF.map(c=>c.h)).size, all = new Set(fatal.map(c=>c.h)).size;
  /* and how much warning it gave: per dying house, the earliest week it spoke inside the window */
  const byHouse = {};
  for(const c of hitF) byHouse[c.h] = Math.max(byHouse[c.h] || 0, c.toEnd);
  const L = q(Object.values(byHouse));
  console.log(`  ${P(k, 12)}${N(on.length, 14)}${(100*hitF.length/(on.length||1)).toFixed(1).padStart(8)}%`
    + `${N(`${reached}/${all}`, 23)}    lead p50 ${N(L ? L.p50 : null, 3)}`);
}
console.log(`  short = runway < WARN (shipped) · blood = runway < BAD · optB = exposure alone`);
console.log(`  optC = exposure or runway < BAD · optA = exposure or runway < WARN\n`);

console.log(`SEPARATION — how often each signal reads true, and what it is worth`);
console.log(`  ${P("", 12)}${"on the fatal".padStart(14)}${"on the rest".padStart(14)}${"lift".padStart(8)}   warning given (weeks before the end)`);
for(const k of KEYS){
  const a = fatal.filter(c=>c.sig[k]).length / (fatal.length || 1);
  const b = rest.filter(c=>c.sig[k]).length / (rest.length || 1);
  /* per fatal house: the earliest short week the signal read true, as a lead over the death */
  const byHouse = {};
  for(const c of fatal) if(c.sig[k]) byHouse[c.h] = Math.max(byHouse[c.h] || 0, c.toEnd);
  const leads = Object.values(byHouse), houses = new Set(fatal.map(c=>c.h)).size;
  const L = q(leads);
  console.log(`  ${P(k, 12)}${(100*a).toFixed(0).padStart(13)}%${(100*b).toFixed(0).padStart(13)}%${(b ? (a/b).toFixed(1) : "∞").padStart(8)}`
    + `   ${N(leads.length, 3)}/${N(houses, 2)} houses, p50 ${N(L ? L.p50 : null, 3)}, best ${N(L ? L.max : null, 3)}`);
}

/* ---- AND IS IT A CLIFF PER HOUSE, OR ONLY IN THE MEDIAN? ----
   v3.207.0 read the fall off a median ACROSS houses indexed on death, and a median can look like a
   cliff when every house in it is sliding at a different time. So: each dying house's own last
   fourteen weeks, gold and the week's change, against its own bill. */
console.log(`\nEACH DEBT DEATH'S OWN LAST FOURTEEN WEEKS — gold, and (the week's change)`);
const debts = out.houses.filter(x=>x.end === "debt");
for(const hh of debts.slice(0, 8)){
  const t = hh.tail;
  const cells = t.map((x, i)=>{ const dg = i ? x.gold - t[i-1].gold : null;
    return `${x.gold}${dg == null ? "" : ` (${dg > 0 ? "+" : ""}${dg})`}`; });
  console.log(`  house ${String(hh.h).padStart(2)} died w${hh.week}, bill ~${t.length ? t[t.length-1].bill : "—"}: ` + cells.join("  "));
}
{ /* and the shape of it, over every debt death: the last week's drop against the bill */
  const drops = [], slides = [];
  for(const hh of debts){ const t = hh.tail; if(t.length < 6) continue;
    const last = t[t.length-1].gold - t[t.length-2].gold;
    const five = t[t.length-1].gold - t[t.length-6].gold;
    drops.push(Math.round(last)); slides.push(Math.round(five)); }
  const D = q(drops), S = q(slides);
  console.log(`\n  the LAST week's change, over ${drops.length} debt deaths: p10 ${N(D&&D.p10,7)} p50 ${N(D&&D.p50,7)} p90 ${N(D&&D.p90,7)}`);
  console.log(`  the last FIVE weeks' change:                p10 ${N(S&&S.p10,7)} p50 ${N(S&&S.p50,7)} p90 ${N(S&&S.p90,7)}`);
  const cliffs = drops.filter((v,i)=>slides[i] < 0 && v / slides[i] > 0.6).length;
  console.log(`  ${cliffs} of ${drops.length} lost more than three fifths of their last five weeks' fall in the final week alone`);
}
/* ---- TWO POPULATIONS, AND THE WARNING ONLY REACHES ONE OF THEM ----
   The tails split by size: a house on a small bill drifts under water and dies there; a house on a
   large one swings thousands a week and crosses the whole line from comfortably positive in one. */
{ console.log(`\nWHAT THE LAST WEEK HAD TO DO — the gap from the last sampled box to the creditors'`);
  console.log(`line, in weeks of that house's own bill, against whether the ladder had spoken`);
  const rows = out.houses.filter(x=>x.end === "debt" && x.lastBill != null)
    .map(x=>({ h:x.h, bill:x.lastBill, fell:x.fellBy, mult: x.lastBill > 0 ? x.fellBy / x.lastBill : null, warned:x.warned }))
    .sort((a,b)=>a.bill - b.bill);
  for(const r of rows) console.log(`  house ${String(r.h).padStart(2)}  bill ${N(r.bill,4)}  had to lose ${N(r.fell,6)}`
    + ` = ${N(r.mult == null ? null : r.mult.toFixed(1), 6)} weeks of its own bill   ${r.warned ? "warned" : "NOT WARNED"}`);
  const small = rows.filter(r=>r.bill < 150), big = rows.filter(r=>r.bill >= 150);
  const rate = a => a.length ? `${a.filter(r=>r.warned).length}/${a.length}` : "—";
  const mm = a => { const v = a.map(r=>r.mult).filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)].toFixed(1) : "—"; };
  console.log(`\n  bill under 150 (${small.length} deaths): warned ${rate(small)}, median last-week fall ${mm(small)} weeks of bill`);
  console.log(`  bill 150 and over (${big.length} deaths): warned ${rate(big)}, median last-week fall ${mm(big)} weeks of bill`);
}

/* ---- AND WHAT THE HOUSE IS ACTUALLY TOLD, scored the same way ----
   The signals above are candidates. This is the shipped agenda row: which sentence it chose on each
   week of every house, and how often each one was chosen inside ten weeks of a death by debt. */
{ const rows = {}, W2 = [];
  for(const hh of out.houses) for(const x of (hh.tail || [])) W2.push({ said:x.said, h:hh.h });
  /* the tail alone is too short — score every case week instead, where the row was read */
  const seen = {}, hit = {};
  for(const c of out.cases){ /* cases carry no row; recount from the per-week rows below */ }
  console.log(`\nWHAT THE AGENDA SAID, on the weeks it said anything`);
  const byKey = {};
  for(const hh of out.houses){ const fatalHouse = hh.end === "debt";
    for(const x of (hh.tail || [])){ if(!x.said) continue;
      const b = byKey[x.said] = byKey[x.said] || { n:0, fatal:0 };
      b.n++; if(fatalHouse && hh.week - x.week <= 10) b.fatal++; } }
  for(const [k, b] of Object.entries(byKey).sort((a,b)=>b[1].n - a[1].n))
    console.log(`  ${P(k, 10)} said on ${N(b.n, 5)} of the sampled tail weeks, ${N(b.fatal, 4)} of them `
      + `inside ten weeks of a debt death (${(100*b.fatal/b.n).toFixed(0)}%)`);
  console.log(`  (tail weeks only — the last fourteen of every house, which is where the question lives)`);
}

console.log(`\nJSON ${JSON.stringify({ cases: out.cases.length, fatal: fatal.length,
  lift: Object.fromEntries(KEYS.map(k=>{ const a = fatal.filter(c=>c.sig[k]).length/(fatal.length||1);
    const b = rest.filter(c=>c.sig[k]).length/(rest.length||1); return [k, +(b ? a/b : 0).toFixed(2)]; })) })}`);
