/* ---- THE CHECKS ----
   `npm test` builds the test bundle, serves it, and walks each check in turn.

     npm test                 the fast tier — seconds
     npm test:all             every check, fast and slow
     npm test:slow            only the ones that drive a browser
     npm test book modals     only those, whatever tier they are in
     npm test -- --keep       leave the test bundle behind to poke at
     npm run coverage         not what passes — what no check ever touches

   A check is a module in checks/ exporting { name, describe, run(ctx) }, where
   run returns { pass, why, lines }. ctx carries a live page, the errors it has
   thrown, and the port. Add one by dropping a file in; nothing here needs telling.

   These grew out of the throwaway probes that verified two dozen releases. The
   comment at the top of each one says which bug it exists because of — that is
   the part worth keeping when the numbers inside it go stale.

   ---- WHY THERE ARE TWO TIERS ----

   Two kinds of check live here and they cost three orders of magnitude apart.
   Most reach into the game through the test handle, run a house for a hundred
   weeks in memory and answer in a second or two. Four drive a real browser
   through the real screens, and those take minutes — survive alone was twelve.

   They used to be one command, which meant the honest choice before a release
   was seventeen minutes or nothing, and the answer was too often nothing: two
   releases shipped on the fast checks alone, and a fault in survive sat
   undetected across several more because nobody had run it.

   So the tiers are named, `npm test` is the one you can afford to run on every
   save, and the slow tier says loudly that it was skipped. The slow checks also
   run concurrently now — they each get their own browser and their own storage,
   so there was never a reason for them to queue. */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { serve, open, ROOT } from "./harness.mjs";

const argv = process.argv.slice(2).filter(a => a !== "--");
const KEEP = argv.includes("--keep");
const ALL  = argv.includes("--all");
const SLOW = argv.includes("--slow");
const want = argv.filter(a => !a.startsWith("--"));

/* how many browsers at once. Each check gets its own, and they are the expensive
   part; more than a handful and they start queueing on the machine instead. */
const LANES = Math.max(1, Math.min(4, (await import("node:os")).cpus().length - 2));

const dir = path.join(ROOT, "test", "checks");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".mjs")).sort();
const all = [];
for(const f of files){
  const m = await import(path.join(dir, f));
  if(!m.name || typeof m.run !== "function") continue;
  all.push(m);
}

/* named checks win outright — you asked for those, you get those, whatever tier */
const pick = m => want.length ? want.includes(m.name)
  : SLOW ? !!m.slow
  : ALL  ? true
  : !m.slow;
const checks = all.filter(pick);
const skipped = all.filter(m => !checks.includes(m));

if(!checks.length){
  console.error(want.length ? `no checks matched: ${want.join(", ")}` : "no checks found");
  process.exit(2);
}

/* its own file, so two runs at once cannot catch each other mid-write */
const TESTPAGE = `dist/test-${process.pid}.html`;
console.log("building the test bundle…");
execFileSync(process.execPath, ["build.js", "--test", `--out=${TESTPAGE}`], { cwd: ROOT, stdio: "inherit" });

const { server, port } = await serve({ page: TESTPAGE });
const started = Date.now();

async function runOne(c){
  const t0 = Date.now();
  let session = null, res;
  try {
    session = await open(port);
    res = await c.run({ p: session.p, errors: session.errors, port });
  } catch(e){
    res = { pass:false, why:`threw: ${e.message}`, lines:[] };
  } finally {
    if(session) await session.browser.close().catch(()=>{});
  }
  return { c, res, secs: ((Date.now()-t0)/1000).toFixed(0) };
}

function report({ c, res, secs }){
  process.stdout.write(`\n▸ ${c.name.padEnd(10)} ${c.describe}\n`);
  for(const l of (res.lines || [])) console.log(`    ${l}`);
  if(res.pass) console.log(`  \x1b[32mPASS\x1b[0m  ${secs}s`);
  else console.log(`  \x1b[31mFAIL\x1b[0m  ${secs}s — ${res.why || "no reason given"}`);
}

/* The fast tier is cheap and its output reads best in order, so it goes in order.
   The slow tier is where the wall-clock is, and its checks are independent. */
const quick = checks.filter(c => !c.slow);
const heavy = checks.filter(c => !!c.slow);
const done = [];

for(const c of quick){ const r = await runOne(c); report(r); done.push(r); }

if(heavy.length){
  /* ---- ONE CHECK GETS THE MACHINE TO ITSELF ----
     survive opens five browsers of its own and plays five houses through the real
     screens at once. Sharing a lane with another browser check put seven Chromiums
     on four cores, and the policy it runs is full of waits and clicks: under that
     load houses missed the block, missed bouts, and came out of twenty-six weeks
     empty. It failed twice in four suite runs while passing every time it was run
     on its own — including on a build proved bit-identical to its parent.

     That is a measurement artefact and it was very nearly mistaken for a balance
     regression, twice. A check that declares `exclusive` runs alone, before the
     lanes open. */
  const alone = heavy.filter(c => c.exclusive);
  const shared = heavy.filter(c => !c.exclusive);
  const out = [];
  for(const c of alone){
    if(shared.length) console.log(`\n— ${c.name} runs alone; it opens browsers of its own —`);
    out.push(await runOne(c));
  }
  if(shared.length){
    if(shared.length > 1) console.log(`\n— ${shared.length} browser checks, ${Math.min(LANES, shared.length)} at a time —`);
    const queue = shared.slice();
    await Promise.all(Array.from({ length: Math.min(LANES, shared.length) }, async ()=>{
      while(queue.length){ const c = queue.shift(); out.push(await runOne(c)); }
    }));
  }
  /* report in the order they were declared, not the order they happened to finish */
  for(const c of heavy){ const r = out.find(x => x.c === c); if(r){ report(r); done.push(r); } }
}

server.close();
if(!KEEP) fs.rmSync(path.join(ROOT, TESTPAGE), { force: true });

const failed = done.filter(x => !x.res.pass).length;
const mins = ((Date.now()-started)/1000/60).toFixed(1);
console.log(`\n${done.length - failed}/${done.length} checks passed in ${mins} min`);
if(skipped.length){
  const slowSkipped = skipped.filter(m => m.slow);
  console.log(`\x1b[33mnot run: ${skipped.map(m=>m.name).join(", ")}\x1b[0m`);
  if(slowSkipped.length && !want.length)
    console.log(`\x1b[33mthose drive a real browser. Before a release: npm run test:all\x1b[0m`);
}
/* the shipping build is left in place, uninstrumented, so the tree is clean after */
execFileSync(process.execPath, ["build.js"], { cwd: ROOT, stdio: "ignore" });
process.exit(failed ? 1 : 0);
