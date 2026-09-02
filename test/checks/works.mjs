/* THE CENSUS COUNTS THE STONE, AND SOMEBODY ELSE IS PUTTING SOME UP

   Audit item #217: "Median era gold 991 -> 4,163 -> 4,361 -> 3,480, and the two big sinks — public
   works and monuments — engaged 0 times in 16 runs (rope). The shelf exists and nothing pulls a
   house toward it. Recommend the works become the named late-game ladder: agenda items when the box
   can afford one, rivals racing you to them, the census noticing."

   THE FIRST RECOMMENDATION WAS BUILT TWO RELEASES BEFORE THE ITEM WAS WRITTEN, and the "nothing
   pulls a house toward it" is measurably false. Over 2,829 weeks of reference play
   (`probes/works.mjs`): a work was commissionable — open, unstarted, deposit affordable — on
   **75.9% of all weeks**, and the agenda named one and said why on the same 75.9%. #138 built that
   line, #141 taught it to name the work this house's own state argues for. Three weeks in four the
   house was told, by name, with a price and a reason.

   AND THE "(rope)" IS THE WHOLE OF THE ZERO. `beginWork`'s only callers were two villa buttons
   until #138 gave the reference player a `works:true` policy, and that policy was made OPT-IN on
   the record: "switching it on re-bases what a long-lived house owns and earns (five perk streams),
   and flipping the default is its own release with every affected figure re-measured." So every
   gold figure in this audit was taken from a player that never builds. Switched on, the same twelve
   houses commission 33 works and FINISH 28.

   WHAT WAS ACTUALLY WRONG IS THE THIRD RECOMMENDATION, and the file had already written down why it
   was missing. `censusWorth` counts the box, the debts, the racks, the men and the wings, and its
   note says the works were "left out DELIBERATELY, because the measurement was taken without them
   and a term nobody has measured is a term nobody should ship." Measured at last:

     the same twelve houses, census worth      built 10,150   ·   did not build 26,075
     stone standing, uncounted                 median 12,500, max 42,500

   A house that used the game's one late-game sink was counted at a THIRD of the house that sat on
   its coin. The ladder punished the shelf. "The census counts what you have; it does not take it"
   is written on the panel, and stone is the most obviously had thing a house owns.

   AFTER: 34,535 against 13,231, and the bay is on the ladder too — rival houses build the same five
   works at the same prices, and finishing one you are still paying instalments on is a line.

   FIVE ARMS:
   1 · THE CENSUS COUNTS IT, by what has actually been paid and not a denarius more.
   2 · AND THE LADDER FEELS IT — the rung's coin gate reads the same worth.
   3 · THE DOOR IS OPEN AND THE HOUSE IS TOLD, over real play. This is the arm that refutes the
       item, and it must keep refuting it.
   4 · THE BAY BUILDS TOO, over real play.
   5 · AND BEING SECOND IS SAID OUT LOUD. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "works";
export const describe = "the census counts the stone, and the bay is building too";
export const slow = true;   /* plays long houses, twice */

const OPEN_FLOOR = 0.40;    /* measured 75.9%; under 40% the shelf is out of reach again */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"WORKS-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate((FLOOR)=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","censusWorth","beginWork","workDef","workDone","workOn","worksWeek",
      "ALL_WORK_KEYS","WORK_KEYS","WORK_DEPOSIT","workWeekly","riseNeed","rivalStone","activeG"]
      .filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const clone = x => JSON.parse(JSON.stringify(x));
    const head = s => (s.log && s.log[0]) || null;

    /* 1 — a house, and the same house with a spina on it */
    const base = A.newGameState("Works", "clean", "WORKS-K", null);
    for(let w=0; w<40; w++){ if(base.over) break; try { R.lanista(base); } catch(e){ break; } }
    const W = A.workDef("spina");
    const plain = A.censusWorth(base);

    const built = clone(base);
    built.works = Object.assign({}, built.works||{}, { spina:{ left:0, began:1, paid:W.cost, owed:0 } });
    const builtWorth = A.censusWorth(built);

    const half = clone(base);
    const paidSoFar = Math.ceil(W.cost*A.WORK_DEPOSIT) + A.workWeekly(W)*4;
    half.works = Object.assign({}, half.works||{}, {
      spina:{ left: 10, began:1, paid:paidSoFar, owed: W.cost - paidSoFar } });
    const halfWorth = A.censusWorth(half);

    /* a save from before the instalment repricing carries no `owed` and was bought outright */
    const legacy = clone(base);
    legacy.works = Object.assign({}, legacy.works||{}, { spina:{ left:0, began:1 } });
    const legacyWorth = A.censusWorth(legacy);

    /* 2 — and the rung's coin gate reads the same worth */
    const needPlain = A.riseNeed(plainState(base)), needBuilt = A.riseNeed(plainState(built));
    function plainState(s){ return s; }
    const rungMoved = !!(needPlain && needBuilt && needBuilt.worth > needPlain.worth);

    /* 3, 4 and 5 — over real play, with the works policy on so the door is walked through */
    let weeks = 0, openWeeks = 0, nagWeeks = 0, mine = 0, rivStarted = 0, rivDone = 0;
    let secondLine = 0;
    for(let h=0; h<5; h++){
      const d = A.newGameState("Works", "clean", "WORKS-R"+h, null);
      const seen = new Set(), rseen = new Set();
      for(let w=0; w<380; w++){
        if(d.over) break;
        try { R.lanista(d, { works:true }); } catch(e){ break; }
        weeks++;
        const buildable = A.ALL_WORK_KEYS.filter(k=>!A.workDone(d,k) && !A.workOn(d,k)
          && A.workOpen(d,k) && d.gold >= Math.ceil(A.workDef(k).cost*A.WORK_DEPOSIT));
        if(buildable.length) openWeeks++;
        if(buildable.length && !A.ALL_WORK_KEYS.some(k=>A.workOn(d,k))) nagWeeks++;
        for(const k of A.ALL_WORK_KEYS) if(A.workDone(d,k) && !seen.has(k)){ seen.add(k); mine++; }
        for(const rh of (d.rivals||[])){
          if(rh.work && !rseen.has(rh.name+":"+rh.work.k)){ rseen.add(rh.name+":"+rh.work.k); rivStarted++; }
          for(const k of (rh.built||[])) if(!rseen.has("up:"+rh.name+":"+k)){ rseen.add("up:"+rh.name+":"+k); rivDone++; }
        }
      }
    }

    /* ---- 4 ON A BENCH TOO, AND FOR THE REASON `scion` GIVES ----
       A rival puts up stone about once in nine years of his good ones, so over a check-sized run the
       bay finishes one or two. Asserting a RATE on that is a coin flip wearing an assertion's
       clothes, which has cost this suite four false reds in four releases. The campaign number is
       reported below and not asserted; what is asserted is that the mechanism runs: a house at the
       bar commissions, and a house one week from done finishes and gains by it. */
    const rivBench = (()=>{
      const s = clone(base); const rh = (s.rivals||[])[0];
      if(!rh) return null;
      rh.fame = A.RIV_WORK_BAR + 500; rh.work = null; rh.built = [];
      let started = 0;
      for(let i=0; i<400 && !rh.work; i++) { try { A.rivalStone(s, rh); } catch(e){} }
      started = rh.work ? 1 : 0;
      let finished = 0, gained = 0;
      if(rh.work){ const fameWas = rh.fame; rh.work.left = 1;
        try { A.rivalStone(s, rh); } catch(e){}
        finished = (rh.built||[]).length ? 1 : 0; gained = Math.round(rh.fame - fameWas); }
      return { started, finished, gained, still: !!rh.work };
    })();

    /* 5 on a bench — the race, driven, because it wants both sides mid-flight at once */
    const race = clone(base);
    race.works = Object.assign({}, race.works||{}, { spina:{ left:5, began:1, paid:100, owed:W.cost-100 } });
    const rh = (race.rivals||[])[0];
    let raced = null;
    if(rh){ rh.work = { k:"spina", left:1, began:1 };
      const was = head(race);
      try { A.rivalStone(race, rh); } catch(e){}
      const h2 = head(race);
      raced = (h2 && h2 !== was) ? String(h2.text).slice(0, 70) : null;
      if(raced) secondLine = 1; }

    return { plain, builtWorth, halfWorth, legacyWorth, cost:W.cost, paidSoFar, rungMoved,
      weeks, openWeeks, nagWeeks, mine, rivStarted, rivDone, raced, secondLine, rivBench,
      openPc: weeks ? +(openWeeks/weeks*100).toFixed(1) : 0,
      nagPc: weeks ? +(nagWeeks/weeks*100).toFixed(1) : 0 };
  }, OPEN_FLOOR);

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };

  lines.push(`a house worth ${r.plain} · with a finished spina (${r.cost}d) ${r.builtWorth}`
    + ` · half-built (${r.paidSoFar}d paid) ${r.halfWorth} · a pre-instalment save ${r.legacyWorth}`);
  lines.push(`  the rung's own coin gate moves with it: ${r.rungMoved}`);
  lines.push(`  over ${r.weeks} played weeks: a work was commissionable on ${r.openPc}% · the agenda named `
    + `one on ${r.nagPc}% · the house finished ${r.mine}`);
  lines.push(`  the bay over those weeks: ${r.rivStarted} commissioned, ${r.rivDone} finished (reported, not `
    + `asserted) · on the bench a rival commissions ${r.rivBench ? r.rivBench.started : "—"} and finishes `
    + `${r.rivBench ? r.rivBench.finished : "—"} for ${r.rivBench ? r.rivBench.gained : "—"} fame`);
  lines.push(`  being second: ${r.raced ? `"${r.raced}…"` : "NOTHING WAS SAID"}`);

  /* 1 — the census counts it, and counts it right */
  if(r.builtWorth - r.plain !== r.cost)
    bad.push(`a finished spina moved the census by ${r.builtWorth - r.plain} and it cost ${r.cost} — the `
      + `works were left out of \`censusWorth\` deliberately pending a measurement, and a house that used `
      + `the game's one late-game sink was counted at a third of one that sat on its coin`);
  if(r.halfWorth - r.plain !== r.paidSoFar)
    bad.push(`a half-built spina with ${r.paidSoFar}d paid moved the census by ${r.halfWorth - r.plain} — `
      + `stone counts what has been paid on it and not a denarius more`);
  if(r.legacyWorth - r.plain !== r.cost)
    bad.push(`a work from a save before the instalment repricing counts ${r.legacyWorth - r.plain} of its `
      + `${r.cost} — it carries no \`owed\` figure because it was bought outright, which is what it cost`);
  /* 2 — and the ladder feels it */
  if(!r.rungMoved)
    bad.push(`the rung's coin gate does not move when the house puts up stone — \`riseNeed\` reads `
      + `\`censusWorth\` and the panel says "the census counts what you have"`);
  /* 3 — the door is open and the house is told */
  if(!r.weeks) bad.push(`no weeks were played — arms 3, 4 and 5 measured nothing`);
  else {
    if(r.openPc < OPEN_FLOOR*100)
      bad.push(`a work was commissionable on only ${r.openPc}% of ${r.weeks} weeks — it was 75.9% when `
        + `#217 said "nothing pulls a house toward it", and that share IS the pull`);
    if(!r.nagPc)
      bad.push(`the agenda never named a work in ${r.weeks} weeks — #138 built that line and #141 taught `
        + `it to name the one this house needs, and it is the whole of the item's first recommendation`);
    if(!r.mine)
      bad.push(`the reference player finished no work in ${r.weeks} weeks with \`works:true\` on — the `
        + `policy exists so that "0 engagements" can be shown to be the rope and not the game`);
  }
  /* 4 — and the bay is on the ladder. The bench carries the mechanism; this one carries the WIRING,
     at a bar the rate cannot flip: the bay commissions about twelve over a run this size, and all
     that is asked is one. `rivalStone` on the handle proves the function works and nothing else —
     if its call in `rivalWeekly` went, only this would notice. */
  if(!r.rivStarted)
    bad.push(`no rival house commissioned anything in ${r.weeks} played weeks — the bay puts up about `
      + `twelve over a run this size, so this is the call in \`rivalWeekly\` having gone rather than `
      + `a quiet season`);
  if(!r.rivBench)
    bad.push(`the fixture house has no rivals, so the arm that checks the bay builds measured nothing`);
  else {
    if(!r.rivBench.started)
      bad.push(`a rival house at ${r.plain != null ? "the fame bar" : "the bar"} never commissioned anything `
        + `in 400 rolls — a rival is name, fame, grudge, form, star and fighters, and stone you are the `
        + `only man in the bay putting up is a purchase rather than a ladder`);
    else if(!r.rivBench.finished)
      bad.push(`a rival work one week from done did not finish — masons in and nothing ever standing`);
    else if(r.rivBench.gained <= 0)
      bad.push(`a rival finished a great work and it was worth ${r.rivBench.gained} fame to him — the town `
        + `turning out to see it is the whole of why he built it`);
  }
  /* 5 — and being second is said */
  if(!r.secondLine)
    bad.push(`a rival finished the very work this house is still paying instalments on and the chronicle `
      + `said nothing — being second to a spina is a different thing from not having one`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`stone is counted, the door is open, and the bay is building too`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
