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
  simulateFight:  { max: 466, why: "a bout is a state machine; the loop writes twenty closure bindings. See the comment above it." },
  simulateMelee:  { max: 239, why: "the same shape as simulateFight — eighteen rounds mutating the field in place" },
  simulatePair:   { max: 232, why: "and the same again over sixteen; the four engines share this and it is the shape, not neglect" },
  doFight:        { max: 357, why: "a long sequential ledger, but its purse branch alone reads eleven enclosing locals — the seams are not narrow" },
  FightModal:     { max: 399, why: "one React render; splitting it moves JSX around without making anything measurable" },
  EVENTS:         { max: 1078, why: "a table of fifty-eight events, not a function — length here is content, and the note on how the week's one question is drawn sits between the table and pickEvent, which is where this check attributes it. Raised 1080 -> 1110 for roomFire (#131's second loss, v3.30.0): a designed event is the sanctioned way this table grows, and the headroom is deliberately a few lines, not a hundred, so drift still says stop" },
  LESSONS:        { max: 308, why: "a table of thirty-five notes, not a function — and half its length is now the four ways a lesson can be lost, written above the entries they happened to" },
  /* ---- AND THIS ALLOWANCE USED TO BE ON THE WRONG NAME ----
     It read `takeUpTheHouse: 7000` with the reason "the App component and everything under it". That
     was never a fact about `takeUpTheHouse`, which is one line — it was a fact about POSITION. The
     regex below did not match `export default function App`, because of the `default`, so App was not
     a definition and whatever happened to be the last real one before it absorbed the entire
     component. v3.8.0 added `endTheLine` beside `takeUpTheHouse` and the 7,000 lines moved to the new
     function, which is how this was found: the check failed naming a two-line function as 7,021 lines.
     `default` is in the regex now, App is measured as itself, and the allowance says what it is. */
  /* ---- AND THIS ALLOWANCE WAS EARNED DOWN, WHICH IS THE POINT OF HAVING IT ----
     7,200 was "the whole screen — every tab, every face, every panel", written when App held all
     thirty-two <Sect> panels inline. The overhaul lifted every one of them into SECT below, and App
     is 5,946 lines. Leaving the old number would have handed the file 1,254 lines of silent headroom
     and this check would have stopped meaning anything for a year. So it comes down to where the
     work actually landed, plus room to breathe — an allowance that never tightens after a split is
     an allowance that only ever ratchets the wrong way. */
  /* ---- AND THE THIRD ACT OF THE SAME FAULT, FIXED IN v3.126.0 ----
     App's figure ran to the END OF THE FILE, because the sweep measured a definition as the distance
     to the NEXT one and there is none after `export default function App` — the test handle's members
     are indented, so nothing terminated it. **App read 6,100 where the component is 5,786**, and every
     line added to the handle landed on the App component's allowance: three of the five reds in
     v3.116.0-v3.121.0, and by v3.125.0 App sat at exactly 6,100 of 6,100 with an export having to be
     folded onto an existing line to fit. The sweep ends a definition at its own closing line now.
     THE ALLOWANCES CAME DOWN WITH THE MEASUREMENTS, which is the rule the SECT split wrote two acts
     ago: each one moved by exactly the number of lines its figure moved, so the headroom either side
     is identical and nothing was handed 419 lines of silence. App keeps the zero headroom it had. */
  App:            { max: 5786, why: "the whole screen minus its panels — tabs, faces, state and handlers, and nothing else: the test handle after it is no longer charged here. Was 7,200 when the thirty-two <Sect> panels were inline; they are in SECT now and this came down with them" },
  SECT:           { max: 1483, why: "a registry of thirty-two panels, not a function — length here is content, the same argument EVENTS makes. Each entry is one <Sect> lifted out of App verbatim, so the total is the markup that was already there; what changed is that a face is now a readable list of what it shows, in order, which is the whole point of the overhaul. It grows when the game gains a panel, and the headroom is a hundred lines rather than a thousand so drift still says stop" },
  Fighter:        { max: 298, why: "the man on the sand, drawn — one SVG in one function" },
  /* ---- AND THIS ONE WAS SITTING EXACTLY ON THE LIMIT ----
     `agenda` measured 200 lines against a limit of 200, so it had been one line from red for some
     time and the thing that finally tripped it was a comment. It is not an algorithm that grew; it
     is a RULE LIST — a sequence of `add(urgency, tab, label, sub)` calls, one per thing the week can
     ask for — and it has already shed five named helpers (agendaCan, agendaSquare, agendaSchool,
     agendaFolk, agendaGods). What is left is the residue, and its length is the number of questions
     the game knows how to ask: measured over 2,306 house-weeks it raises 88 distinct lines, 22 on
     ludus, 22 on the villa, 20 on the men, 15 in the arena, 5 in the market, 4 in the armory.
     Ten lines of headroom, not a hundred, on the same argument EVENTS makes — a designed question is
     the sanctioned way this grows, and drift still says stop. */
  agenda:         { max: 210, why: "a rule list, not a function that grew — one add() per thing the week can ask for, 88 distinct lines measured over 2,306 house-weeks, and five helpers already split out of it" },
  /* ---- AND THIS ONE GREW BECAUSE THE HOUSE GAINED A SECOND GROUND ----
     v3.95.0 named the structural colours and gave the ludus parchment behind every door. Both
     halves land here: the palette is two declaration blocks (night and paper, the same 32 names
     twice), and the ledger re-points those names plus the dozen component surfaces whose grounds
     are gradients rather than single colours — .btn, .panel, .track and the rest — which a
     variable cannot reach on its own. It is a STYLESHEET, not a function: length here is content,
     the same argument EVENTS and SECT make. It grows when the game gains a surface, and the
     headroom is a dozen lines rather than a hundred so drift still says stop. */
  /* ---- RAISED 248 -> 256 FOR THE FACES, v3.107.0 ----
     Four @font-face rules and a three-line note. The three families were an at-import that never
     loaded once — it must precede every other rule and sat under the box-sizing line, so every
     browser dropped it silently — and they are embedded now rather than re-linked, because the
     build writes an offline shell. Those four rules are content the stylesheet has to carry, the
     same argument EVENTS and SECT make, and the headroom is seven lines rather than fifty so
     drift still says stop. The whole account is in src/fonts.js. */
  /* ---- RAISED 256 -> 258 FOR TWO VENUE BACKDROPS, v3.123.0 ----
     `.v-bowl` and `.v-greek`. `VENUES` has nine keys and the stylesheet had six rules, so two of
     the nine — Pompeii's stone amphitheatre and the theatre at Neapolis — were drawn as the Capuan
     forum, on 5.4% of every bout fought. That is the case this allowance's own note contemplates:
     it is a STYLESHEET and it grows when the game gains a surface, which is why v3.107.0 raised it
     for four @font-face rules and wrote down why. Two rules, two lines, and the headroom is back to
     one so drift still says stop. The note explaining them sits ABOVE `const CSS`, outside the
     span this sweep measures and outside the bytes the browser is sent. */
  CSS:            { max: 253, why: "the stylesheet, plus the four @font-face rules the embedded faces need and the eight venue backdrops" },
};

export async function run(){
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8").split("\n");

  /* ---- EVERY TOP-LEVEL DEFINITION, BY ITS OWN CLOSING LINE ----
     This measured a definition as the distance to the NEXT one, which charged every definition with
     whatever followed it — and the file's convention is that a note goes ABOVE the thing it
     describes, so a note above X was charged to W. The last definition in the file had nothing after
     it at all and absorbed everything to EOF: **App read 6,100 where the component is 5,786**, the
     314 being the test handle, so every line added to the handle landed on the App component's
     allowance. That is the third act of one fault. The first was `export default function App` not
     matching the regex, so `takeUpTheHouse` — a two-line function — measured 7,021. The second was
     the allowance being earned down 7,200 -> 6,100 after the SECT split, with the rule this fix
     obeys: an allowance that never tightens is one that only ratchets the wrong way.

     Measured across the file: **517 of 1,469 definitions were inflated, 3,189 lines charged to the
     wrong owner.** A definition ends at the first line, at column zero, that begins with a closing
     token — `}`, `};`, `];`, `});`, or the backtick that ends a template literal. Everything inside
     a top-level definition in this file is indented, so that line is its end and nothing else is.
     Verified against all twelve guarded names before it shipped.

     STILL CRUDE ON PURPOSE — it is measuring bulk, not parsing JavaScript. It never crosses into the
     next definition, so no figure can grow; a definition whose end cannot be found falls back to the
     old distance and is COUNTED, because a parser that quietly stops attributing is a check that
     quietly stops meaning anything. */
  const DEF = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|const|let)\s+([A-Za-z_$][\w$]*)/;
  const CLOSE = /^[}\])`;]/;
  const starts = [];
  for(let i=0;i<src.length;i++){ const m = src[i].match(DEF); if(m) starts.push({ name:m[1], at:i }); }
  const defs = [];
  for(let n=0;n<starts.length;n++){
    const s = starts[n];
    const stop = n+1 < starts.length ? starts[n+1].at : src.length;
    let end = -1;
    for(let j=s.at+1;j<stop;j++) if(CLOSE.test(src[j])){ end = j; break; }
    /* ---- AND THE SHORT ONES END WHERE THEY STOP BEING INDENTED ----
       201 definitions have no closing token at column zero: they are short arrow consts whose
       continuation lines are indented and whose `;` is indented with them. Every continuation of a
       top-level definition IS indented, so the last indented line is the end — but only as the
       FALLBACK, never as the rule. Tried as the rule it breaks on template literals, whose contents
       sit at column zero: `CSS` measured 1 line instead of 252. It also broke on App at 1,335,
       because line 22982 is `</div></>) },` — a JSX close at column zero that is not a closing
       token this regex knows. The closer comes first and the indent only catches what it misses. */
    if(end < 0){
      let j = s.at + 1;
      while(j < stop && (src[j] === "" || /^\s/.test(src[j]))) j++;
      end = j - 1;
      while(end > s.at && src[end].trim() === "") end--;
    }
    defs.push({ name:s.name, at:s.at, lines: end - s.at + 1, closed: CLOSE.test(src[end] || "") });
  }

  const big = defs.filter(f => f.lines > LIMIT).sort((a,b)=>b.lines-a.lines);
  const lines = [], fails = [];
  const held = defs.reduce((n,f)=>n+f.lines, 0);
  const loose = defs.filter(f=>!f.closed).length;
  lines.push(`${src.length.toLocaleString()} lines, ${defs.length} top-level definitions, ${big.length} over ${LIMIT}`);
  /* what belongs to no definition — the notes between them, the imports, the test handle. Printed
     rather than asserted: it is a fact about the file's shape, and a rule on it would be a second
     ratchet nobody has measured. But a SUDDEN collapse in what is attributed would mean the end
     detection has stopped working, and that is the failure this line exists to make visible. */
  lines.push(`   ${held.toLocaleString()} lines sit inside a definition · ${(src.length-held).toLocaleString()} between them`
    + ` · ${defs.length-loose} end on a closing token, ${loose} on their last indented line`);
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
  /* ---- AND NO CHECK MAY QUIETLY REPLACE ANOTHER ----
     Twice in one session I wrote a new check to a filename that was already taken — `board`, which
     held the wager panel's odds against what settleBet pays, and `crown`, which drives the primacy
     itself. Both times the file was silently replaced, both times the suite went green, and both
     times the ONLY tell was a total that did not move: 83 checks after adding an 84th, 85 after
     adding an 86th. A check deleted and replaced in one stroke leaves no red line anywhere.

     So: every check's declared `name` must match its filename, and no two may share one. Either
     mistake now fails here instead of costing a check nobody notices is gone. */
  { const dir = path.join(ROOT, "test", "checks");
    const seen = new Map(), namedWrong = [];
    for(const f of fs.readdirSync(dir).filter(x=>x.endsWith(".mjs"))){
      const base = f.replace(/\.mjs$/, "");
      const src = fs.readFileSync(path.join(dir, f), "utf8");
      const m = src.match(/export\s+const\s+name\s*=\s*["'`]([^"'`]+)["'`]/);
      if(!m){ namedWrong.push(`${f} declares no name`); continue; }
      if(m[1] !== base) namedWrong.push(`${f} calls itself "${m[1]}"`);
      if(seen.has(m[1])) namedWrong.push(`"${m[1]}" is declared by both ${seen.get(m[1])} and ${f}`);
      seen.set(m[1], f);
    }
    lines.push(`${seen.size} checks on disk, each named for its own file`);
    for(const w of namedWrong)
      fails.push(`${w} — a check whose name and filename disagree can be replaced by the next one written, and the suite stays green because the total never moves`);
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
