/* THE WEEKS LEFT IN THE BOX, SAID WHERE THE PLAYER IS

   Audit item #229: "The game's most common death has its instrument buried three taps deep. Debt
   killed 7 of 16, and the runway readout — 'the box would carry this house N more weeks' — lives on
   the villa's Coin & Council face, the least-visited place in the game. Recommend the runway
   surface itself where the player lives when it turns short. The number exists; its placement
   assumes a player who already knows he is dying."

   THE ITEM IS RIGHT AND IT UNDERSTATES THE FAULT BY A FACTOR OF THIRTY.

   THE NUMBER WAS NOT A FUNCTION. It was computed inside the Coin & Council render —
   `const weeks = bill > 0 ? Math.floor((S.gold + owed) / bill) : null;` — inside a JSX closure, so
   nothing else in the program could read it. There was no `runway(d)` to put anywhere else.

   AND THE AGENDA WAS POINTING THE OTHER WAY. Measured over 4,109 weeks and sixteen houses
   (`probes/runway.mjs`), on the 995 weeks a house held under eight weeks of coin:

       the agenda warned it was running out       1.7%
       the agenda told it to START BUILDING      57.1%

   and on the 436 weeks under four: 3.9% against 24.1%. The only line about running out was
   `if(d.gold < 0)` — a sentence for a house already past empty — and the line that did fire was the
   works nag, which reads `d.gold` and has no idea what the week costs. **A house three weeks from
   insolvency was told to put a deposit on a spina twenty-four times more often than it was told it
   was three weeks from insolvency.** Debt is the commonest death in the game.

   AFTER: warned on 100% of both bands, told to build on 0.4%, and the silence between the runway
   going short and the first word about it is zero weeks, from a maximum of ten.

   FIVE ARMS:
   ---- AND #247a MOVED THE BAND THIS CHECK HOLDS, ON A MEASUREMENT (v3.208.0) ----

   The arms below used to require a warning on every week under RUNWAY_WARN. Scored over every
   house-week of two seeded sets of 32 houses x 420 weeks, that band is 1,535 and 1,348 weeks of
   alarm which the house dies of debt inside ten weeks of on 7.9% and 8.2% — and it was true of all
   88 houses of v3.207.0's run, survivors included, from a median week of 18. The row speaks on
   EXPOSURE or a runway already in blood now: 692 and 706 weeks, right 12.4% and 12.5%, every house
   that dies of debt still reached, seven and eight weeks of warning. #229's promise is unchanged and
   `checks/cliff.mjs` holds its strongest form — every death by debt heard the row inside its last
   ten weeks — while the arms here hold it over the band that means something.

   1 · IT IS ONE FUNCTION, and the Coin & Council face quotes what it returns — read out of a real
       browser, because "the number exists" was always the half of this item that was true.
   2 · THE AGENDA SAYS IT WHERE IT MEANS IT, and everything it says now goes in blood.
   3 · AND EVERYWHERE THE TRIGGER HOLDS — over real play, with no silent band left.
   4 · AND IT DOES NOT TELL A DYING HOUSE TO BUILD.
   5 · ON HOUSES THAT ACTUALLY RAN SHORT, or every arm above passed on a rich one. */
import { found, clearAll, installRope, forge, tab, settle } from "../harness.mjs";

export const name = "runway";
export const describe = "the weeks left in the box, said where the player is";
export const slow = true;   /* plays houses to the edge, and reads a real face */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"RUNWAY-1" });
  await clearAll(p, 12);
  await installRope(p);

  /* ---- 2 to 5: the agenda, over real play and on a bench ---- */
  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","runway","weeklyBill","owedTotal","agenda",
      "RUNWAY_WARN","RUNWAY_BAD","RUNWAY_BUILD"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const clone = x => JSON.parse(JSON.stringify(x));
    const rowsOf = d => { try { return A.agenda(d) || []; } catch(e){ return []; } };
    const txt = r => String(r.label||"") + " " + String(r.sub||"");
    /* ---- THE SENTENCES, AND #247a GAVE THE ROW A THIRD ONE ----
       The exposure line — "An ordinary week moves Nd and there is Md in the box" — is a warning and
       this regex did not know it, so v3.208.0's gate reported a silent agenda on benches where the
       row was speaking. And `SPEND` was `/in the box/i`, which the new warning matches word for
       word: it is meant for the WORKS NAG ("Nd sitting in the box", "Nd in the box, and the spina
       unbuilt"), so it names what that line actually says instead. */
    const WARN = /under, and .*ends it|would carry this house|box is empty|ordinary week moves/i;
    const SPEND = /sitting in the box|unbuilt|start building|down of \d+d/i;

    /* 2 — a bench: one house, its box walked down, and what the agenda says at each depth */
    const base = A.newGameState("Runway", "clean", "RUNWAY-K", null);
    for(let w=0; w<50; w++){ if(base.over) break; try { R.lanista(base); } catch(e){ break; } }
    const bill = A.weeklyBill(base);
    const bench = [];
    for(const want of [20, 9, 6, 3, 1]){
      const s = clone(base);
      s.gold = bill * want; s.owed = [];
      const rw = A.runway(s), rows = rowsOf(s);
      const w = rows.find(x=>WARN.test(txt(x)));
      bench.push({ want, rw, said: !!w, urgency: w ? w.urgency : null,
        exposed: (()=>{ try { return !!A.exposed(s); } catch(e){ return false; } })(),
        swing: (()=>{ try { return A.swingOf(s); } catch(e){ return null; } })(),
        dest: w ? (w.dest||w.tab) : null,
        /* the number itself, in the sentence. Written as a RegExp built from a string this had one
           level of escaping too many and compiled to a literal backslash-b, so it reported every
           warning as not quoting its own figure. A plain search for the digits with a boundary
           either side does the same job and cannot be mis-escaped. */
        quotes: w ? new RegExp("(^|[^0-9])" + rw + "([^0-9]|$)").test(txt(w)) : null,
        spend: rows.some(x=>SPEND.test(txt(x))) });
    }

    /* 3, 4 and 5 — over real play */
    let weeks = 0, short8 = 0, short4 = 0, warned8 = 0, warned4 = 0, told8 = 0, spokeNull = 0;
    let danger = 0, warnedD = 0;
    const gaps = [];
    for(let h=0; h<6; h++){
      const d = A.newGameState("Runway", "clean", "RUNWAY-R"+h, null);
      let first = null, spoke = null;
      for(let w=0; w<320; w++){
        if(d.over) break;
        try { R.lanista(d); } catch(e){ break; }
        weeks++;
        const rw = A.runway(d), rows = rowsOf(d);
        const didWarn = rows.some(x=>WARN.test(txt(x)));
        if(didWarn && spoke == null) spoke = d.week;
        if(rw == null){ if(didWarn) spokeNull++; continue; }
        let expo = false; try { expo = !!A.exposed(d); } catch(e){}
        if(rw < A.RUNWAY_WARN){
          short8++; if(didWarn) warned8++;
          if(rows.some(x=>SPEND.test(txt(x)))) told8++;
        }
        /* the silence is measured from the row's OWN trigger, not from the WARN band. #247a stopped
           the row speaking between four and eight weeks on purpose, so a gap anchored on the eight
           would now be measuring the design rather than a fault. */
        if((rw < A.RUNWAY_BAD || expo) && first == null) first = d.week;
        if(rw < A.RUNWAY_BAD || expo){ danger++; if(didWarn) warnedD++; }
        if(rw < A.RUNWAY_BAD){ short4++; if(didWarn) warned4++; }
      }
      if(first != null) gaps.push(spoke == null ? 9999 : Math.max(0, spoke - first));
    }

    const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
      return { n:s.length, p50:s[Math.floor(s.length/2)], max:s[s.length-1] }; };
    return { bench, bill, weeks, short8, short4, told8, gaps:q(gaps), danger,
      warnD: danger ? +(warnedD/danger*100).toFixed(1) : null,
      warnAt: A.RUNWAY_WARN, badAt: A.RUNWAY_BAD,
      warn8: short8 ? +(warned8/short8*100).toFixed(1) : null,
      warn4: short4 ? +(warned4/short4*100).toFixed(1) : null,
      tell8: short8 ? +(told8/short8*100).toFixed(1) : null };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };

  /* ---- 1: and the face quotes the same function, out of a real browser ---- */
  const plant = await forge(p, (A, R, arg) => {
    const d = arg.d;
    return { plant:d, rw:A.runway(d), bill:A.weeklyBill(d) };
  }, { d: await p.evaluate(()=>{
        const A = window.__LVDVS, R = window.__ROPE;
        const d = A.newGameState("Runway", "clean", "RUNWAY-F", null);
        for(let w=0; w<50; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
        /* ---- THE FIXTURE HAS TO HAVE A BILL, AND FIFTY PLAYED WEEKS DO NOT GUARANTEE ONE ----
           `runway` divides by `weeklyBill`, and returns null when that is zero — which is what an
           EMPTIED house has. This fixture played fifty weeks on one seed and took whatever came
           out, so any change anywhere that moves the RNG stream can bury the last man and leave
           the face with nothing to say and this check reporting it as a missing sentence. It did
           exactly that on v3.190.0, where the only edit was to how a rival house picks a class.
           The house is restocked if the weeks emptied it: the claim under test is that the FACE
           quotes the FUNCTION, and it needs a house with men in it to be about anything. */
        d.over = null;
        if(!A.activeG(d).some(g=>g.status === "active")){
          for(let i=0;i<4;i++){
            const g = A.genGladiator(d, 55); g.id = d.nextId++; g.status = "active"; g.mine = true;
            g.kit = A.defaultKit(g.cls); d.gladiators.push(g);
          }
        }
        d.gold = A.weeklyBill(d) * 5; d.owed = [];
        return d;
      }) });

  let faceSaid = null;
  if(await tab(p, "villa")){
    await p.evaluate(()=>{ const c = [...document.querySelectorAll("button[role=tab]")]
      .find(b => /coin & council/i.test((b.innerText||"") + " " + (b.getAttribute("aria-label")||"")));
      if(c) c.click(); });
    await settle(p);
    faceSaid = await p.evaluate(()=>{ const m = (document.body.innerText||"")
      .match(/The box (?:would carry this house|is empty)[^\n]*/i); return m ? m[0] : null; });
  }

  lines.push(`a house at ${r.bill}d a week · the agenda at each depth:`);
  for(const b of r.bench)
    lines.push(`   ${String(b.want).padStart(2)} weeks of coin -> runway ${b.rw} · said ${b.said}`
      + ` · urgency ${b.urgency} · to ${b.dest} · quotes the number ${b.quotes} · told to build ${b.spend}`);
  lines.push(`  over ${r.weeks} played weeks: ${r.short8} under ${r.warnAt} and ${r.short4} under ${r.badAt}`);
  lines.push(`    warned on ${r.warn8}% and ${r.warn4}% · told to build on ${r.tell8}%`
    + ` · the silence ${JSON.stringify(r.gaps)} weeks`);
  lines.push(`    and on the ${r.danger} weeks the row's own trigger held (in blood, or under one `
    + `ordinary week of movement): warned on ${r.warnD}%`);
  lines.push(`  the Coin & Council face says: ${faceSaid ? `"${faceSaid}"` : "NOTHING"}`
    + ` · the function says ${plant.rw}`);

  /* 1 — one function, and the face quotes it */
  if(!faceSaid)
    bad.push(`the Coin & Council face carries no runway sentence at all — it is the one place the `
      + `number has always lived, and #229's "the number exists" is the half of the item that was true`);
  else if(plant.rw > 0 && !new RegExp("\\b" + plant.rw + "\\b").test(faceSaid))
    bad.push(`the face says "${faceSaid}" and \`runway()\` returns ${plant.rw} — the face computed the `
      + `number in its own render for the life of the feature, and a displayed number and the roll `
      + `behind it must be the same function, which is #150`);
  /* 2 — the agenda says it, and in blood when it is bad */
  for(const b of r.bench){
    /* the bar is `RUNWAY_WARN`, and the first cut of this loop expected a warning at NINE weeks
       because it keyed on the `want` list rather than on the constant the game reads. Nine is over
       the bar and correctly silent; the arm was asserting its own arithmetic. */
    /* ---- THE BAND MOVED, AND IT MOVED ON A MEASUREMENT — #247a ----
       This expected a warning at every depth under RUNWAY_WARN. v3.208.0 measured what that band is
       worth: over every house-week of two seeded sets of 32 houses, `runway < WARN` was true on
       1,535 and 1,348 weeks and the house died of debt inside ten weeks on 7.9% and 8.2% of them —
       and it was true of all 88 houses of v3.207.0's run, survivors included, from a median week of
       18. A warning every house hears always is not one. The row speaks on EXPOSURE (the box against
       what an ordinary week of this house moves) or a runway already in blood: 692 and 706 weeks at
       12.4% and 12.5%, every house that dies of debt still reached, seven or eight weeks of warning.
       So the expectation here is the row's own trigger. #229's promise — that a house running out is
       told where it lives — is not weakened by this; it is held over the band that means it, and
       `checks/cliff.mjs` holds the stronger form directly: every death by debt heard the row inside
       its last ten weeks, on pain of failure. */
    const shouldSpeak = b.rw < r.badAt || b.exposed;
    if(!shouldSpeak){ if(b.said) bad.push(`a house with ${b.rw} weeks of coin and ${b.swing}d of ordinary `
      + `week is warned it is running out — neither trigger holds and it is one of the 92% of short `
      + `weeks that are nothing`); continue; }
    if(!b.said){ bad.push(`a house with ${b.rw} weeks left in the box${b.exposed ? ` and less in it than `
      + `an ordinary week (${b.swing}d)` : ""} gets no word of it on the agenda — the only money line `
      + `was \`d.gold < 0\`, which is a sentence for a house already past empty`); continue; }
    /* the exposure sentence quotes the swing and the box rather than the runway, so the
       number-in-the-sentence rule applies to the line that carries the runway */
    if(!b.exposed && !b.quotes) bad.push(`the agenda warns at ${b.rw} weeks and does not say the number`);
    if(b.urgency !== 3)
      bad.push(`the warning at ${b.rw} weeks is urgency ${b.urgency} and should be 3 — everything the `
        + `row now speaks on is at or inside the blood threshold, and the first cut of #247a let a `
        + `house holding one week of bill rank BELOW one holding three`);
  }
  /* 3 — and everywhere it is short */
  if(!r.short8) bad.push(`no house ran short of coin in ${r.weeks} weeks — arms 3 and 4 measured nothing`);
  else {
    /* the 95% bar is over the band the row speaks on, which #247a narrowed from "under eight weeks"
       to "in blood or exposed" — see the note in arm 2. The under-eight figure stays on screen
       because it is the number that moved and somebody will want it. */
    if(r.warnD != null && r.warnD < 95)
      bad.push(`a house in real danger — under ${r.badAt} weeks of coin, or holding less than an `
        + `ordinary week of its own movement — was warned on ${r.warnD}% of those weeks. Before `
        + `v3.173.0 the whole short band was warned on 1.7%, and anything under 95% here is a band `
        + `where nothing speaks`);
    if(r.warn4 < 95) bad.push(`a house under four weeks of coin was warned on ${r.warn4}% of those weeks`);
    if(r.gaps && r.gaps.max > 2)
      bad.push(`a house went ${r.gaps.max} weeks between its runway going short and the first word `
        + `about it — the measured maximum was 10 before this release and it should be 0`);
    /* 4 — and is not told to spend */
    if(r.tell8 > 5)
      bad.push(`a house under eight weeks of coin was told to start building on ${r.tell8}% of those `
        + `weeks — it was 57.1%, because the works nag reads \`d.gold\` and not what the week costs`);
  }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`one function, said on the agenda before the box is empty, and no spending advice`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
