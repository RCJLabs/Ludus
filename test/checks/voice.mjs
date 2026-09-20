/* EVERY REGISTER THE GAME SPEAKS IN CAN BE REACHED FROM A TEST — #186

   `asks.mjs` asks which of a great house's quantities the game is BLIND to: perturb one, diff what
   the game says either side, and a quantity that moves nothing is content the player can never be
   told about. The verdict is only ever as good as the list of places it looks, and that list has
   been wrong three times — five channels, then eight, and eight was not enough either:

     · **the events channel was inert from the day it shipped.** It read `!e.when || !!e.when(d)`,
       and **not one of the 59 `EVENTS` entries has a `when`** — they gate by `make(d)` returning
       null, which is what `pickEvent` walks. So `!e.when` was true for every entry on both arms,
       the set was the constant 59, and the diff could never fire.
     · **eleven more tables pair a predicate over the state with a line of writing** — COUNSEL,
       WHISPERS, YARD, LATE, NIGHT, ROME_TURNS, RUINS, ASKS, REFUSE_REASONS, RIVAL_MOVES, FREEDMEN
       — and not one of them was on the test handle. `EVENTS` was never the only register; it was
       the only one anybody had exported.
     · and the heaped arm for law heat was `40` while every discrete reader sits above it, so both
       arms landed the same side of every gate the game has.

   With those fixed the silent list goes **two to one**, and the survivor is `brand tier`, a latch
   that nothing reads as a quantity and nothing should.

   THIS CHECK HOLDS THE STRUCTURAL HALF, which is the one that will rot again: a table that gates a
   written line on the state and is NOT on the test handle is a register no probe can see. It finds
   them the way the audit did — statically, by their own shape — so a twelfth table added next year
   goes red here rather than sitting unread until somebody thinks to grep. It also holds the
   `EVENTS` contract that the inert channel got wrong: every entry must carry the gate the game
   actually calls.

   ---- AND THE PROMISE IN THAT PARAGRAPH WAS NOT KEPT — #295 ----
   "a twelfth table added next year goes red here rather than sitting unread until somebody thinks
   to grep." Four tables were added in v3.288.0–v3.290.0 that gate written lines, this check stayed
   green through all three releases, and they were found by somebody thinking to grep.

   THE REASON IS ONE REGEX. The scan read `when:`/`need:` whose FIRST ARGUMENT IS `d` — the house —
   because that is the shape `asks` perturbs and `asks` is what #186 was repairing. A predicate over
   anything else was not a narrower case of the rule; it was invisible to it. The check's title said
   "gates a written line on the state" and its measurement said "gates a written line on the HOUSE",
   and nothing in its output distinguished the two. That is this project's most-shipped fault and it
   was sitting inside the check written to hold the same kind of gap.

   TEN SUBJECT-BOUND TABLES were found the moment the shape was widened — a man (`DEATHS`,
   `SALUTES`, `MISSIOS`, `TELLS`), his opponent (`MERCIES`), a crux (`CRUX`), a rival (`RIVAL_BEATS`),
   a munus field (`FIELD_TELLS`), a chronicle entry (`CHRON_FILTERS`), a closing tally (`VERDICTS`).
   **Three of the ten were not on the test handle**, which is the exact fault #186 built this check
   to catch, unread for nine releases:

     `VERDICTS`        7 entries — WHAT THE PLAYER READS WHEN THE HOUSE ENDS. `verdictOf` was
                       reachable and the table it chooses between was not, so no test could
                       enumerate the seven or show they were all selectable.
     `FIELD_TELLS`     6 entries — what a munus field looks like before you pick a plan.
     `CHRON_FILTERS`   4 entries — the four names over the chronicle.

   All three are exported as of #295 and this check now holds both classes.

   WHAT THE TWO CLASSES ARE FOR, because they are not the same question. A HOUSE-LEVEL register can
   be driven from a house-level perturbation, which is what `asks` does and why silence there is
   meaningful. A SUBJECT-BOUND register cannot — you have to construct the subject — so reachability
   is necessary but not sufficient, and `probes/reachable.mjs` (#293) is the instrument that sweeps
   constructed subjects and proves each entry actually selectable. This check says the door exists;
   that probe walks through it.

   AND THE PREDICATE MUST BE A FUNCTION. The first cut of the widened scan counted `need:12` in
   `LEGACIES` and `need:6` in `PACTS` — those are thresholds, not predicates — and attributed two
   more matches to `spiteWeight` and `pactBlocks`, which are functions rather than tables. Four
   false positives out of fourteen, in the first run of a check written to catch over-claims.

   ---- WHAT THE NEGATIVE CONTROL PROVED, AND WHAT IT COULD NOT ----
   PROVED: pulling the three exports back out turns this check red and names all three with the
   reason "gate written lines on a subject and are not on the test handle". A green arm nobody has
   seen go red is not evidence, and the widened scan is worth exactly what that control is worth.

   NOT PROVED: the runtime arm's OTHER path — a table named in the handle block that is absent at
   runtime. It cannot be constructed here: the block uses shorthand, so a name with no binding is
   a build error rather than a missing export, and the attempt took the handle away entirely. That
   path was unexercised before #295 as well; what changed is only that its message can no longer
   fire with a false reason. The first control caught it doing exactly that — announcing three
   tables as "named in the handle block but not actually on it at runtime" when they were named
   nowhere — and a check that fires correctly and explains itself wrongly sends the reader to the
   wrong place. This file is the one that is supposed to know that.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "voice";
export const describe = "every table that gates a written line — on the house or on a subject — can be reached from a test";

/* HOUSE-LEVEL TABLES THAT ALSO NEED A SECOND ARGUMENT — the house is the first, so `asks` can see
   them, but a house-level perturbation alone does not drive them. They are still required to be
   REACHABLE; this list only records that the probe reads them by hand or not at all, so the gap is
   written down rather than discovered again.

   RENAMED FROM `SUBJECT_BOUND` IN #295, because that name now means something else two arms down:
   a table whose predicate's FIRST argument is not the house at all. Two different ideas under one
   word in the same file is how a reader ends up sure of the wrong one. */
const ALSO_NEEDS = {
  AFTERS:      "when:(d,m) — needs a munus in progress, which a sampled week rarely has",
  FEUD_CAUSES: "when:(d,a,b) — needs a specific pair of men, so there is no house-level reading",
};

export async function run({ p }){
  const lines = [], fails = [];
  const raw = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");

  /* COMMENTS ARE BLANKED, AND THE LINE STRUCTURE IS KEPT so `owner()` still attributes by line.
     Two reasons, and the honest report on each. In the SOURCE scan it changes nothing today — no
     comment in `ludus.jsx` currently carries a predicate shape — and it is kept so that prose
     describing a pattern can never be counted as the pattern, which is the fault `tools.mjs` names
     and `promise.mjs` learned the hard way. In the HANDLE test it closes a real hole that is
     currently shut by luck: a table NAMED in a comment inside the handle block would read as
     exported. It does not fire today only because the names that appear there are written in
     backticks and the boundary classes below do not include one. That is not a design. */
  const blankComments = t => t
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(m.length - p1.length));
  const src = blankComments(raw).split("\n");

  /* every top-level definition, and which one a given line belongs to */
  const tops = [];
  for(let i=0;i<src.length;i++){
    const m = src[i].match(/^const ([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if(m) tops.push({ at:i, name:m[1] });
  }
  const owner = n => { let best = null;
    for(const t of tops){ if(t.at <= n) best = t.name; else break; } return best; };

  /* A REGISTER is a table entry that gates on something and carries writing, and there are TWO
     SHAPES OF IT. The predicate value must be a FUNCTION — `need:12` is a threshold, not a gate,
     and counting it put four false positives in the first run of this arm (see the header).

       HOUSE-LEVEL     `when:(d…)` — the house is the subject, so `asks` can drive it by
                       perturbing a quantity, and silence there is a finding about the game.
       SUBJECT-BOUND   the predicate takes anything else — a man, his opponent, a crux, a rival,
                       a field, a chronicle entry, a closing tally. `asks` cannot reach these from
                       a house-level perturbation; `probes/reachable.mjs` constructs the subject.

     A table with ANY house-level predicate counts as house-level: four of them carry a
     `when:()=>…` floor entry beside their `when:(d…)` gates, and reporting those twice would be
     two numbers for one table. */
  const PRED = /\b(when|need)\s*:\s*(?:function\s*\(\s*([A-Za-z_$][A-Za-z0-9_$]*)?|([A-Za-z_$][A-Za-z0-9_$]*)\s*=>|\(\s*([A-Za-z_$][A-Za-z0-9_$]*)?[^)]*\)\s*=>)/;
  const found = {}, bound = {}, subjOf = {};
  for(let i=0;i<src.length;i++){
    const m = src[i].match(PRED); if(!m) continue;
    const o = owner(i); if(!o) continue;
    const first = m[2] || m[3] || m[4] || null;
    if(first === "d") found[o] = (found[o]||0) + 1;
    else { bound[o] = (bound[o]||0) + 1; if(first) (subjOf[o] || (subjOf[o] = new Set())).add(first); }
  }
  for(const t of Object.keys(found)) delete bound[t];
  const tables = Object.keys(found).sort();
  const boundTables = Object.keys(bound).sort();
  if(tables.length < 5)
    fails.push(`only ${tables.length} predicate tables parsed — this check is reading a shape that has moved`);
  if(boundTables.length < 5)
    fails.push(`only ${boundTables.length} subject-bound tables parsed — #295 found ten, so this `
      + `scan is reading a shape that has moved and a table could go unheld without saying so`);

  /* the test handle, which is the only way a probe reaches anything */
  const hb = blankComments(raw).match(/if \(process\.env\.LVDVS_TEST[\s\S]*$/);
  const handle = hb ? hb[0] : "";
  if(!handle) fails.push("could not find the test-handle block");

  lines.push(`${tables.length} tables gate a written line on the HOUSE — the shape \`asks\` drives:`);
  const unreachable = [];
  for(const t of tables){
    const on = new RegExp(`(^|[\\s,{])${t}([\\s,}]|$)`, "m").test(handle);
    const note = ALSO_NEEDS[t] ? `  — also needs: ${ALSO_NEEDS[t]}` : "";
    lines.push(`   ${t.padEnd(16)} ${String(found[t]).padStart(3)} predicates   ${on ? "on the handle" : "*** NOT REACHABLE ***"}${note}`);
    if(!on) unreachable.push(t);
  }
  if(unreachable.length)
    fails.push(`${unreachable.join(", ")} gate${unreachable.length===1?"s":""} written lines on the state and ${unreachable.length===1?"is":"are"} not on the test handle — `
      + `a register no probe can reach is a silence nobody can rule out, which is #186`);

  /* ---- THE SECOND CLASS, WHICH THIS CHECK COULD NOT SEE FOR NINE RELEASES — #295 ---- */
  lines.push(`${boundTables.length} tables gate a written line on a SUBJECT rather than the house:`);
  const boundOut = [];
  for(const t of boundTables){
    const on = new RegExp(`(^|[\\s,{])${t}([\\s,}]|$)`, "m").test(handle);
    const who = subjOf[t] ? [...subjOf[t]].sort().join("/") : "()";
    lines.push(`   ${t.padEnd(16)} ${String(bound[t]).padStart(3)} predicates   ${on ? "on the handle" : "*** NOT REACHABLE ***"}`
      + `  — subject: \`${who}\``);
    if(!on) boundOut.push(t);
  }
  if(boundOut.length)
    fails.push(`${boundOut.join(", ")} gate${boundOut.length===1?"s":""} written lines on a subject and ${boundOut.length===1?"is":"are"} not on the test handle — `
      + `same fault as #186 in a shape this check could not see until #295`);
  lines.push(`   reachability is NECESSARY AND NOT SUFFICIENT for these: the subject has to be `
    + `constructed, which is \`probes/reachable.mjs\` (#293), not this check`);

  /* ---- AND THE EVENTS CONTRACT THE INERT CHANNEL GOT WRONG ---- */
  const evb = (raw.match(/\nconst EVENTS = \{([\s\S]*?)\n\};/) || ["",""])[1];
  const parts = evb.split(/^  (?=[A-Za-z_][A-Za-z0-9_]*:\s*\{)/m).filter(x=>x.trim());
  const keys = parts.map(x=>(x.match(/^([A-Za-z_][A-Za-z0-9_]*):/)||[])[1]).filter(Boolean);
  /* `\b` and not `^\s{4}`: five entries are written on ONE line — `match: { make(){ return null; },
     run(...){…} }` — so an indentation-anchored match missed them and this check's first run
     reported five events with no gate at all. They have one; they return null from it on purpose,
     being raised by their own systems rather than by the weekly roll. `\bmake\b` will not match
     `makeGames(`, because there is no word boundary after `make` there. */
  const withWhen = parts.filter(x=>/\bwhen\s*:/.test(x)).length;
  const gated = parts.filter(x=>/\b(make|build)\b\s*[(:]/.test(x)).length;
  lines.push(`EVENTS: ${keys.length} entries · ${gated} carry a make() or build() · ${withWhen} carry a when:`);
  if(!keys.length) fails.push("EVENTS parsed EMPTY");
  else if(gated < keys.length)
    fails.push(`${keys.length - gated} EVENTS entries carry neither make() nor build() — an entry with no gate can never fire, `
      + `and a probe that asks the wrong one reads the whole table as always-on`);
  /* the assumption that broke the channel, written down so it cannot be made silently again */
  if(withWhen)
    lines.push(`   ${withWhen} entries now carry a \`when:\` — a probe gating EVENTS must test make() as well, `
      + `because a table with both shapes cannot be read by either alone`);

  if(!await hasHandle(p)) return { pass:false, why:"no test handle — build with `node build.js --test`", lines };
  /* NAMED IN THE HANDLE BLOCK AND ACTUALLY ON IT AT RUNTIME ARE TWO DIFFERENT CLAIMS, which is
     why this second pass exists at all — and it now has to carry both classes, or three tables
     could be named, pass the static arm, and still be absent when a probe reaches for them. */
  const allTables = tables.concat(boundTables);
  const live = await p.evaluate(tables=>{
    const A = window.__LVDVS, miss = [], sizes = {};
    for(const t of tables){ if(A[t] == null) miss.push(t); else sizes[t] = Array.isArray(A[t]) ? A[t].length : Object.keys(A[t]).length; }
    return { miss, sizes, events: A.EVENTS ? Object.keys(A.EVENTS).length : 0 };
  }, allTables);
  lines.push(`on the running handle: ${Object.keys(live.sizes).length} of ${allTables.length} tables `
    + `(${tables.length} house-level + ${boundTables.length} subject-bound), `
    + `${Object.values(live.sizes).reduce((s,x)=>s+x,0)} entries · EVENTS ${live.events}`);
  /* NAMED-BUT-ABSENT IS A DIFFERENT FAULT FROM NEVER-NAMED, and saying so matters because the
     static arms above already report the second one with the right reason. The negative control
     for #295 — pulling three exports back out — made this arm announce that they were "named in
     the handle block but not actually on it at runtime", which was false about all three: they
     were not named anywhere. A check that fires correctly and explains itself wrongly sends the
     reader to the wrong place, and this file is the one that is supposed to know that. */
  const named = new Set([...tables, ...boundTables].filter(t =>
    new RegExp(`(^|[\\s,{])${t}([\\s,}]|$)`, "m").test(handle)));
  const ghost = live.miss.filter(t => named.has(t));
  if(ghost.length)
    fails.push(`${ghost.join(", ")} ${ghost.length===1?"is":"are"} named in the handle block but `
      + `${ghost.length===1?"is":"are"} not actually on it at runtime`);

  if(!fails.length) lines.push("every register the game speaks in — house-level and subject-bound — can be reached from a test");
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
