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
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "voice";
export const describe = "every table that gates a written line on the state can be reached from a test";

/* Tables whose predicate is over something OTHER than the house — a pair of men, a munus in
   progress — and which `asks` therefore cannot drive from a house-level perturbation. They are
   still required to be REACHABLE; this list only records that the probe reads them by hand or not
   at all, so the gap is written down rather than discovered again. */
const SUBJECT_BOUND = {
  AFTERS:      "when:(d,m) — needs a munus in progress, which a sampled week rarely has",
  FEUD_CAUSES: "when:(d,a,b) — needs a specific pair of men, so there is no house-level reading",
};

export async function run({ p }){
  const lines = [], fails = [];
  const raw = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");
  const src = raw.split("\n");

  /* every top-level definition, and which one a given line belongs to */
  const tops = [];
  for(let i=0;i<src.length;i++){
    const m = src[i].match(/^const ([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if(m) tops.push({ at:i, name:m[1] });
  }
  const owner = n => { let best = null;
    for(const t of tops){ if(t.at <= n) best = t.name; else break; } return best; };

  /* a REGISTER is a table entry that gates on the state and carries writing. The predicate is
     `when:` or `need:` taking `d` — the same shape `asks` evaluates. */
  const found = {};
  for(let i=0;i<src.length;i++)
    if(/\b(when|need)\s*:\s*(\(?d\b|\(d,)/.test(src[i])){
      const o = owner(i); if(o) found[o] = (found[o]||0) + 1;
    }
  const tables = Object.keys(found).sort();
  if(tables.length < 5)
    fails.push(`only ${tables.length} predicate tables parsed — this check is reading a shape that has moved`);

  /* the test handle, which is the only way a probe reaches anything */
  const hb = raw.match(/if \(process\.env\.LVDVS_TEST[\s\S]*$/);
  const handle = hb ? hb[0] : "";
  if(!handle) fails.push("could not find the test-handle block");

  lines.push(`${tables.length} tables gate a written line on the state:`);
  const unreachable = [];
  for(const t of tables){
    const on = new RegExp(`(^|[\\s,{])${t}([\\s,}]|$)`, "m").test(handle);
    const note = SUBJECT_BOUND[t] ? `  — subject-bound: ${SUBJECT_BOUND[t]}` : "";
    lines.push(`   ${t.padEnd(16)} ${String(found[t]).padStart(3)} predicates   ${on ? "on the handle" : "*** NOT REACHABLE ***"}${note}`);
    if(!on) unreachable.push(t);
  }
  if(unreachable.length)
    fails.push(`${unreachable.join(", ")} gate${unreachable.length===1?"s":""} written lines on the state and ${unreachable.length===1?"is":"are"} not on the test handle — `
      + `a register no probe can reach is a silence nobody can rule out, which is #186`);

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
  const live = await p.evaluate(tables=>{
    const A = window.__LVDVS, miss = [], sizes = {};
    for(const t of tables){ if(A[t] == null) miss.push(t); else sizes[t] = Array.isArray(A[t]) ? A[t].length : Object.keys(A[t]).length; }
    return { miss, sizes, events: A.EVENTS ? Object.keys(A.EVENTS).length : 0 };
  }, tables);
  lines.push(`on the running handle: ${Object.keys(live.sizes).length} of ${tables.length} tables, `
    + `${Object.values(live.sizes).reduce((s,x)=>s+x,0)} entries · EVENTS ${live.events}`);
  if(live.miss.length)
    fails.push(`${live.miss.join(", ")} ${live.miss.length===1?"is":"are"} named in the handle block but ${live.miss.length===1?"is":"are"} not actually on it at runtime`);

  if(!fails.length) lines.push("every register the game speaks in can be reached from a test");
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
