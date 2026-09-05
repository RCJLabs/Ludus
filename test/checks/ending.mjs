/* THE ENDING CURVE — #247 phase 1: the instrument, as a check.

   Fourteen houses in sixteen end, and #247 asked which shapes take them. `probes/ending.mjs`
   answered it on eighty-eight seeded houses (32 + 32 in the probe, 24 here) and the answer is
   THREE shapes, not the two the item was written off: debt 35, the cells 29, ruin 11, still
   standing 12, one emptied yard — and `banned` did not fire once. What each shape does on the way
   down is in ROADMAP.md under v3.207.0; what a check can hold is here.

   FIVE ARMS, seeded, 24 houses x 420 weeks under the reference player. Everything held below was
   measured true on BOTH probe sets before it was written down.

   1 · EVERY ENDING IS A KIND THE GAME CAN SHOW. `over.kind` has to be a key of `OVER_TEXT` — the
       end screen indexes it directly (`OVER_TEXT[S.over.kind](S.over).title`), so a kind nobody
       wrote a text for is not a curve problem, it is a crash on the last screen of the run.
   2 · THE CELLS SAY SO FIRST, AND SAY IT THREE TIMES. `updateRebellion` is a ladder — 50 unrest
       brings the whispers, 65 the stolen blades, 78 the night itself — and each rung is a question
       put to the player. Measured, every death by rebellion passed all three: 10 of 10, 9 of 9 and
       10 of 10 across the three sets, with the first rung standing a median of 96, 80 and 30 weeks
       before the end. The bar is the LADDER, not the top of it: stage 1 then 2 then 3, in that
       order, on every rebellion death. "It reached stage 3" is not enough and the first draft of
       this arm held only that — a sabotage that jumped a house from calm to the uprising in one
       week walked straight past it, because the week it jumped was a week `stage >= 1` read true.
       An ending whose approach is one week is an ending with no approach.
   3 · THE RUNWAY IS READABLE. #229's number is the instrument for the commonest death, so it may
       not be NaN on a living house, and it may be null only where `weeklyBill` is genuinely zero.
   4 · AND NO SHAPE MAY VANISH. The distribution goes to `ending-tally.json`, and a kind that a
       previous build reached on three or more houses may not fall to none. A regression floor, not
       an absolute one: this is a curve, every retune re-phases it, and the only thing that can be
       said across builds is that a way for a house to end has not been closed by accident.
   5 · REPORTED, NOT FAILED — the numbers phase 2 will turn into bars, and they are stated rather
       than held BECAUSE of how they moved: across the three seeded sets (32 + 32 + this check's 24)
       the `debtStage` ladder fired before 2 of 10, 6 of 14 and 8 of 11 deaths by debt — 16 of 35,
       and a spread wider than any effect a retune could claim. The stable finding is not the rate,
       it is the approach: gold p50 ten weeks out from a debt death is 4,359 and 2,105 on the two
       probe sets and about a thousand one week out, so the house is solvent until it is not. Both
       figures go on screen every run so phase 2 has a before it can trust. */
import fs from "node:fs";
import path from "node:path";
import { found, clearAll, installRope, ROOT } from "../harness.mjs";

const TALLY = path.join(ROOT, "test", "ending-tally.json");
const readTally = () => { try { const j = JSON.parse(fs.readFileSync(TALLY, "utf8")); return Array.isArray(j) ? j : []; } catch(e){ return []; } };
const version = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version || "?"; } catch(e){ return "?"; } };
const HOUSES = 24, WEEKS = 420;
const KEEP = 3;      /* a kind a prior build reached on this many houses may not fall to none */

export const name = "ending";
export const describe = "a house ends in a way the game can show, the cells warn first, and no ending shape has closed";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"END-1" });
  await clearAll(p, 12);
  await installRope(p);      /* found() reloads the page; the rope is injected, not built in */

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","OVER_TEXT","runway","weeklyBill","activeG"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    const ends = {}, rows = [];
    let weeks = 0, badRunway = 0, nullRunway = 0, nullWithBill = 0;
    for(let h=0; h<H; h++){
      const d = A.newGameState("End"+h, "clean", `ENDCHK-${h}`);
      let rising = null, debtStage = null, goldNeg = null;
      const rung = { 1:null, 2:null, 3:null };
      for(let w=0; w<W; w++){
        if(d.over) break;
        /* 3 — the runway, every week of every living house */
        let rw; try { rw = A.runway(d); } catch(e){ rw = NaN; }
        if(rw == null){ nullRunway++; let bill = 0; try { bill = A.weeklyBill(d); } catch(e){}
          if(bill > 0) nullWithBill++; }
        else if(!Number.isFinite(rw)) badRunway++;
        const st = (d.rebellion && d.rebellion.stage) || 0;
        if(rising == null && st >= 1) rising = d.week;
        if(rung[1] == null && st >= 1) rung[1] = d.week;
        if(rung[2] == null && st >= 2) rung[2] = d.week;
        if(rung[3] == null && st >= 3) rung[3] = d.week;
        if(debtStage == null && (d.flags.debtStage||0) >= 1) debtStage = d.week;
        if(goldNeg == null && d.gold < 0) goldNeg = d.week;
        try { R.lanista(d); } catch(e){ break; }
        weeks++;
      }
      const kind = d.over ? d.over.kind : "survived";
      ends[kind] = (ends[kind]||0) + 1;
      rows.push({ kind, week:d.week, rising, rung, debtStage, goldNeg, gold:Math.round(d.gold) });
    }
    return { ends, rows, weeks, badRunway, nullRunway, nullWithBill,
      known: Object.keys(A.OVER_TEXT) };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };

  const order = Object.entries(r.ends).sort((a,b)=>b[1]-a[1]);
  lines.push(`${HOUSES} houses x ${WEEKS} weeks (${r.weeks} played): `
    + order.map(([k,n])=>`${k} ${n}`).join(" · "));

  /* 1 — a kind the end screen can render */
  const unknown = Object.keys(r.ends).filter(k=>k !== "survived" && !r.known.includes(k));
  if(unknown.length)
    bad.push(`${unknown.join(", ")} is an \`over.kind\` with no OVER_TEXT — the end screen indexes `
      + `that table directly, so this house cannot show the player how its run finished`);

  /* 2 — the cells say so first */
  const reb = r.rows.filter(x=>x.kind === "rebellion");
  /* ONE RUNG A WEEK, which is the ladder's own guarantee: `updateRebellion` runs once inside
     `endWeek` and advances at most one stage per call, so three rungs cannot share a week unless
     something else has set the stage. Strict, therefore — and it has to be strict, because the
     jump sabotage sets all three at once and `<=` waved it through twice. */
  const climbed = x => x.rung[1] != null && x.rung[2] != null && x.rung[3] != null
    && x.rung[1] < x.rung[2] && x.rung[2] < x.rung[3];
  const jumped = reb.filter(x=>!climbed(x));
  const lead = reb.filter(x=>x.rung[1] != null).map(x=>x.week - x.rung[1]).sort((a,b)=>a-b);
  lines.push(`the ladder before the rebellion: ${reb.length - jumped.length} of ${reb.length} deaths `
    + `climbed all three rungs in order, first rung standing ${lead.length ? lead[0] : "—"} weeks at the `
    + `shortest and ${lead.length ? lead[Math.floor(lead.length/2)] : "—"} at the median`);
  if(jumped.length)
    bad.push(`${jumped.length} of ${reb.length} houses were taken by the cells without climbing the `
      + `ladder — whispers at 50, blades at 65, the night at 78, each of them a question put to the `
      + `player, and one rung a week is what \`updateRebellion\` itself allows. A house that `
      + `arrives at the uprising without climbing has an ending and no approach`);

  /* 3 — the runway is readable */
  lines.push(`runway: ${r.badRunway} NaN readings, ${r.nullRunway} null (${r.nullWithBill} of them with a bill to pay)`);
  if(r.badRunway) bad.push(`\`runway\` read NaN on ${r.badRunway} weeks — #229's number is the instrument for the commonest death`);
  if(r.nullWithBill) bad.push(`\`runway\` read null on ${r.nullWithBill} weeks where \`weeklyBill\` was above zero — it is null only when there is nothing to pay`);

  /* 5 — what phase 2 will turn into bars, stated before it does */
  const debts = r.rows.filter(x=>x.kind === "debt");
  const warned = debts.filter(x=>x.debtStage != null).length, red = debts.filter(x=>x.goldNeg != null).length;
  lines.push(`reported, not failed — of ${debts.length} deaths by debt, ${warned} had the debtStage ladder `
    + `fire first and ${red} were ever seen with negative gold on a sampled week `
    + `(16 and 21 of 35 across the three sets this was measured on — a rate that swings hard by seed)`);

  /* 4 — and no shape may vanish */
  let gone = [];
  try {
    const rows = readTally(), prior = rows[rows.length - 1];
    if(prior && prior.ends)
      gone = Object.entries(prior.ends).filter(([k,n])=>n >= KEEP && !(r.ends[k] > 0)).map(([k,n])=>`${k} (${n} then, none now)`);
    if(gone.length)
      bad.push(`an ending shape has closed since ${prior.v}: ${gone.join(", ")} — a kind ${KEEP} or more `
        + `houses reached on the last recorded run and no house reaches now. A retune re-phases this `
        + `curve and the counts move every build; a shape going to zero is a door, not a phase`);
    rows.push({ v: version(), houses: HOUSES, weeks: r.weeks, ends: r.ends,
      debtWarned: warned, debtRed: red, debts: debts.length,
      risingLead: lead.length ? lead[Math.floor(lead.length/2)] : null,
      risingMin: lead.length ? lead[0] : null, jumped: jumped.length, pass: bad.length === 0 });
    fs.writeFileSync(TALLY, JSON.stringify(rows, null, 1) + "\n");
    lines.push(`written to ending-tally.json — ${rows.length} run${rows.length===1?"":"s"} on record`
      + (prior ? `, last was ${prior.v}` : ", no prior to compare against"));
  } catch(e){ lines.push(`the tally could not be written (${e.message}) — reported, not failed`); }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`three shapes take a house down and every one of them can be shown, warned and read`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
