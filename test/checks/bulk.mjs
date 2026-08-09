/* 22,700 lines in one file, and four functions held every balance change in it:
   simulateFight at 436 lines, endWeek at 425, FightModal at 388, doFight at 378.
   Between them they were where the last several bugs had been, and none of them
   could be exercised in pieces — a check could run a whole week or a whole bout,
   and nothing smaller.

   endWeek came apart cleanly, because a week is a sequence: the men are worked,
   the ledger is drawn, the held questions are asked, the reckoning is taken. Four
   named phases, 425 lines down to 142, and three campaigns of a hundred and eighty
   weeks each came out bit-identical afterwards — same gold, same fame, same men,
   same chronicle, to the denarius.

   simulateFight did not, and the reason is written above it in the source: a bout
   is a state machine whose state is the closure, twenty mutable bindings all
   written by the round loop. Lifting the loop means a twenty-field parcel and
   several hundred rewritten references in a file with no type checker, to arrive
   at a worse door on the same room.

   THIS CHECK IS THE PART THAT LASTS. Splitting a function once is an afternoon;
   the reason it grew is that nothing ever said stop. So: every top-level
   definition in the source is measured, and a new one over the line fails. The
   list below is the exceptions, each with the reason it is one. Adding to it is
   allowed and is meant to be uncomfortable — write down why. */

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

export const name = "bulk";
export const describe = "no new function grows past the line";

/* what a function may run to before somebody has to justify it */
const LIMIT = 200;

/* the ones already over it, and why each one is still there. A number here is the
   size it was measured at when it was written down — if a listed function GROWS
   past its allowance it fails too, so an exception is a ceiling and not a pass. */
const ALLOWED = {
  simulateFight:  { max: 470, why: "a bout is a state machine; the loop writes twenty closure bindings. See the comment above it." },
  simulateMelee:  { max: 260, why: "the same shape as simulateFight — eighteen rounds mutating the field in place" },
  simulatePair:   { max: 240, why: "and the same again over sixteen; the four engines share this and it is the shape, not neglect" },
  doFight:        { max: 360, why: "a long sequential ledger, but its purse branch alone reads eleven enclosing locals — the seams are not narrow" },
  FightModal:     { max: 400, why: "one React render; splitting it moves JSX around without making anything measurable" },
  EVENTS:         { max: 1000, why: "a table of fifty-seven events, not a function — length here is content" },
  LESSONS:        { max: 320, why: "a table of thirty-five notes, not a function — and half its length is now the four ways a lesson can be lost, written above the entries they happened to" },
  takeUpTheHouse: { max: 7000, why: "the App component and everything under it; a different task entirely" },
  Fighter:        { max: 300, why: "the man on the sand, drawn — one SVG in one function" },
};

export async function run(){
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8").split("\n");

  /* every top-level definition, by the line the next one starts on. Crude on
     purpose — it is measuring bulk, not parsing JavaScript. */
  const defs = [];
  let cur = null;
  for(let i=0;i<src.length;i++){
    const m = src[i].match(/^(?:export\s+)?(?:async\s+)?(?:function|const|let)\s+([A-Za-z_$][\w$]*)/);
    if(m){ if(cur) defs.push({ name:cur.name, at:cur.at, lines:i - cur.at }); cur = { name:m[1], at:i }; }
  }
  if(cur) defs.push({ name:cur.name, at:cur.at, lines:src.length - cur.at });

  const big = defs.filter(f => f.lines > LIMIT).sort((a,b)=>b.lines-a.lines);
  const lines = [], fails = [];
  lines.push(`${src.length.toLocaleString()} lines, ${defs.length} top-level definitions, ${big.length} over ${LIMIT}`);
  for(const f of big){
    const a = ALLOWED[f.name];
    lines.push(`   ${f.name.padEnd(16)} ${String(f.lines).padStart(5)} lines  ${a ? `(allowed to ${a.max})` : "*** NOT ON THE LIST ***"}  @${f.at+1}`);
    if(!a) fails.push(`${f.name} is ${f.lines} lines and nothing says it may be — split it, or add it to ALLOWED in this check with the reason`);
    else if(f.lines > a.max) fails.push(`${f.name} has grown to ${f.lines} lines, past the ${a.max} it was allowed — it is going the wrong way`);
  }
  /* and the ones that were split have to stay split */
  for(const n of ["menWeek","ludusLedger","heldQuestions","weekReckoning","boutAftermath"]){
    const f = defs.find(x=>x.name===n);
    if(!f) fails.push(`${n} is gone — endWeek and doFight have been put back together`);
  }
  const ew = defs.find(f=>f.name==="endWeek");
  if(ew){
    lines.push(`   endWeek is ${ew.lines} lines now — it was 425, and the four phases it shed are named functions`);
    if(ew.lines > 200) fails.push(`endWeek is back to ${ew.lines} lines`);
  }
  /* a listed exception that has quietly gone away should not stay on the list */
  const stale = Object.keys(ALLOWED).filter(n => !defs.some(f=>f.name===n));
  if(stale.length) lines.push(`   (no longer in the source, and can come off the list: ${stale.join(", ")})`);

  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
