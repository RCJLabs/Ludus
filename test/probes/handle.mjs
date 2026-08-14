/* WHICH PLAYER ACTIONS CAN NO CHECK REACH?

   Four times now a system has read as dead content because the function behind it was not on the
   `__LVDVS` handle, so nothing outside a mounted component could drive it — and each time the cost
   was a confident wrong finding published first:

     setOut / comeHome   v2.46: two 12-house batches emigrated and reported half the game dark
     nameHeir            the heir was null in 8 of 8 houses and there were zero successions
     makeMarket          a whole block battery silently measured the founding stall five times
     holdMunera          v3.22: `d.honoured` read 0 in every measurement this project ever took

   `coverage` answers "what does no check touch", but only for things already ON the handle, so this
   blind spot is invisible to it. And `actions` holds a HAND-WRITTEN list of names: it catches an
   action that goes missing, but by construction it can never catch one that was never added.

   THE DEFINITION MATTERS AND IT IS NOT "MUTATES d". That would sweep in every internal helper and
   need a judgement call per row, which is how a sweep turns into a list nobody reads. The sharp
   definition is the one the file's own first rule uses: a PLAYER ACTION is a function the UI calls
   inside a `mut(d => ...)` closure. That closure IS the player doing something. `holdMunera` was
   reached exactly that way and by nothing else:

       const doRite = (gid, key) => mut(d=>{ holdMunera(d, gid, key); });      // 18649

   So: extract every `mut(d=>…)` body by balancing parens rather than by regex, take every call of
   the form `NAME(d` inside it, and difference that against the live handle read out of the test
   build. Anything in the difference is an action a player can take and no check can.

   HOW THIS COULD BE WRONG, since the instrument is the usual suspect:
     · a `mut` body that spans lines or nests parens defeats a flat regex — hence the balancer, and
       the count of bodies found is printed so a collapse to zero is visible rather than silent;
     · a call written `FN(state, …)` or through a local alias is missed. The raw list of EVERY
       identifier seen inside a mut body is printed for that reason, not just the filtered one;
     · a name may be defined inside the component rather than at module scope, in which case it is
       not a rule violation but a different one — so each hit is checked for a top-level definition
       and the two cases are reported apart. */
import { serve, open } from "../harness.mjs";
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

/* ---- STRIP COMMENTS FIRST, AND THE REASON IS EMBARRASSING ----
   The v3.23.0 note added to the `__LVDVS` block in src/ludus.jsx contains the words `mut(d => …)`
   while explaining this sweep, and `/\bmut\(\s*d\s*=>/` matched it. The closure count went 101 to
   102 the moment the instrument was documented, and the balancer then parsed prose. It changed no
   conclusion this time — the phantom body holds no calls — but a comment quoting a real call would
   have injected an action that does not exist, and a doc-comment is exactly where such a quote goes.
   So the source is stripped of block and line comments before anything is matched. */
const decomment = t => t.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "))
                        .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + m.slice(p.length).replace(/./g, " "));
const src = decomment(fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8"));
const lineOf = i => src.slice(0, i).split("\n").length;

/* ---- every `mut(d=>…)` body, by balancing parens ---- */
const bodies = [];
const re = /\bmut\(\s*d\s*=>/g;
let m;
while((m = re.exec(src))){
  let i = m.index + m[0].length, depth = 1, start = i;
  /* depth starts at 1 for the `(` of mut( — walk to its match */
  while(i < src.length && depth > 0){
    const c = src[i];
    if(c === "(") depth++;
    else if(c === ")") depth--;
    i++;
  }
  bodies.push({ text: src.slice(start, i - 1), at: lineOf(m.index), from: start, to: i - 1 });
}

/* ---- every call taking the save as its first argument ---- */
const CALL = /\b([A-Za-z_$][\w$]*)\s*\(\s*d\s*[,)]/g;
const seen = new Map();          /* name -> first line it is called from */
const allIdents = new Map();     /* the RAW material: every identifier called at all, filtered or not */
for(const b of bodies){
  let c;
  const any = /\b([A-Za-z_$][\w$]*)\s*\(/g;
  while((c = any.exec(b.text))) allIdents.set(c[1], (allIdents.get(c[1])||0)+1);
  CALL.lastIndex = 0;
  while((c = CALL.exec(b.text))) if(!seen.has(c[1])) seen.set(c[1], b.at);
}

/* ---- is it defined at module scope? `function f(` or `const f = ` at column 0 ---- */
const topLevel = new Set();
for(const line of src.split("\n")){
  let mm = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(line)
        || /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/.exec(line);
  if(mm) topLevel.add(mm[1]);
}

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const handle = await p.evaluate(()=> window.__LVDVS ? Object.keys(window.__LVDVS) : null);
await browser.close(); server.close();
if(!handle){ console.error("no __LVDVS handle — build with `node build.js --test`"); process.exit(1); }

const onHandle = new Set(handle);
const KEYWORDS = new Set(["if","for","while","switch","catch","return","typeof","function","await"]);
const rows = [...seen.entries()]
  .filter(([n]) => !KEYWORDS.has(n))
  .map(([name, at]) => ({ name, at, top: topLevel.has(name), on: onHandle.has(name) }))
  .sort((a,b)=> (a.on === b.on ? (a.top === b.top ? a.name.localeCompare(b.name) : (a.top?-1:1)) : (a.on?1:-1)));

/* ---- AND THE THREE-WAY SPLIT THE FIRST PASS DID NOT MAKE ----
   "Not on the handle" is not one condition. `swearIn`, `sellDebt` and `applyRefusal` all turned out
   to have callers in the weekly code as well as in a `mut` body, so a check driving `endWeek` runs
   them — they are exercised, just not as the PLAYER's own action. The severe class is the one where
   every caller is a mut body, which is `holdMunera`'s exact shape: the function can be reached by a
   click and by nothing else in the program. Counting the two together would have reported 19 dead
   systems where the real figure is smaller and sharper. */
const inMut = i => bodies.some(b => i >= b.from && i <= b.to);
const callerKinds = name => {
  const out = { ui:0, other:0, lines:[] };
  const rx = new RegExp(`\\b${name}\\s*\\(`, "g");
  let c;
  while((c = rx.exec(src))){
    const ln = lineOf(c.index);
    const head = src.slice(src.lastIndexOf("\n", c.index) + 1, c.index);
    if(/^(?:async\s+)?function\s*$/.test(head) || /^(?:const|let|var)\s+$/.test(head)) continue; /* the definition */
    if(inMut(c.index)) out.ui++; else { out.other++; out.lines.push(ln); }
  }
  return out;
};

const missing = rows.filter(r => !r.on && r.top);
const inside  = rows.filter(r => !r.on && !r.top);

console.log(`=== WHAT A PLAYER CAN DO AND NO CHECK CAN ===`);
console.log(`  ${bodies.length} \`mut(d=>…)\` closures parsed · ${rows.length} distinct functions called with the save`);
console.log(`  ${handle.length} keys on the handle · ${topLevel.size} module-scope definitions seen\n`);

if(!bodies.length){
  console.log(`  NO mut BODIES FOUND — the balancer or the pattern is broken, and every conclusion`);
  console.log(`  below would be "nothing is missing", which is exactly what a broken sweep says.`);
}

console.log(`  ON THE HANDLE, reachable — ${rows.filter(r=>r.on).length}:`);
console.log(`    ${rows.filter(r=>r.on).map(r=>r.name).join(", ") || "none"}\n`);

for(const r of missing) r.callers = callerKinds(r.name);
const uiOnly = missing.filter(r => !r.callers.other);
const alsoRun = missing.filter(r => r.callers.other);

console.log(`  *** REACHABLE BY A CLICK AND BY NOTHING ELSE — ${uiOnly.length}. This is the finding. ***`);
console.log(`  Every caller is a \`mut\` body, so no check can drive it and no weekly path runs it.`);
console.log(`  This is \`holdMunera\`'s exact shape.`);
for(const r of uiOnly)
  console.log(`    ${r.name.padEnd(26)} the UI calls it at line ${r.at}, and nothing else calls it at all`);
if(!uiOnly.length) console.log(`    none`);

console.log(`\n  off the handle but RUN ANYWAY by the weekly code — ${alsoRun.length}.`);
console.log(`  A check driving endWeek exercises these; what cannot be driven is the player's own`);
console.log(`  version of the action. Real, and a tier below the list above.`);
for(const r of alsoRun)
  console.log(`    ${r.name.padEnd(26)} UI at ${r.at} · also called at ${r.callers.lines.join(", ")}`);

console.log(`\n  called with the save but NOT defined at module scope — ${inside.length}.`);
console.log(`  These are a different thing: a closure inside the component, which the file's first`);
console.log(`  rule says should be lifted out. Listed, not counted as the finding.`);
for(const r of inside) console.log(`    ${r.name.padEnd(26)} line ${r.at}`);

console.log(`\n  THE RAW MATERIAL, so the filter above is visible rather than trusted —`);
console.log(`  every identifier called inside a mut body, whatever its first argument:`);
const raw = [...allIdents.entries()].filter(([n])=>!KEYWORDS.has(n)).sort((a,b)=>b[1]-a[1]);
for(let i=0;i<raw.length;i+=6)
  console.log(`    ${raw.slice(i,i+6).map(([n,c])=>`${n}(${c})`).join("  ")}`);
