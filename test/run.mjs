/* ---- THE CHECKS ----
   `npm test` builds the test bundle, serves it, and walks each check in turn.

     npm test                 all of them
     npm test book modals     only those
     npm test -- --keep       leave dist/test.html behind to poke at

   A check is a module in checks/ exporting { name, describe, run(ctx) }, where
   run returns { pass, why, lines }. ctx carries a live page, the errors it has
   thrown, and the port. Add one by dropping a file in; nothing here needs telling.

   These grew out of the throwaway probes that verified two dozen releases. The
   comment at the top of each one says which bug it exists because of — that is
   the part worth keeping when the numbers inside it go stale. */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { serve, open, ROOT } from "./harness.mjs";

const argv = process.argv.slice(2).filter(a => a !== "--");
const KEEP = argv.includes("--keep");
const want = argv.filter(a => !a.startsWith("--"));

const dir = path.join(ROOT, "test", "checks");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".mjs")).sort();
const checks = [];
for(const f of files){
  const m = await import(path.join(dir, f));
  if(!m.name || typeof m.run !== "function") continue;
  if(want.length && !want.includes(m.name)) continue;
  checks.push(m);
}
if(!checks.length){
  console.error(want.length ? `no checks matched: ${want.join(", ")}` : "no checks found");
  process.exit(2);
}

/* its own file, so two runs at once cannot catch each other mid-write */
const TESTPAGE = `dist/test-${process.pid}.html`;
console.log("building the test bundle…");
execFileSync(process.execPath, ["build.js", "--test", `--out=${TESTPAGE}`], { cwd: ROOT, stdio: "inherit" });

const { server, port } = await serve({ page: TESTPAGE });
let failed = 0;
const started = Date.now();

for(const c of checks){
  const label = `${c.name.padEnd(9)} ${c.describe}`;
  process.stdout.write(`\n▸ ${label}\n`);
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
  const secs = ((Date.now()-t0)/1000).toFixed(0);
  for(const l of (res.lines || [])) console.log(`    ${l}`);
  if(res.pass) console.log(`  \x1b[32mPASS\x1b[0m  ${secs}s`);
  else { failed++; console.log(`  \x1b[31mFAIL\x1b[0m  ${secs}s — ${res.why || "no reason given"}`); }
}

server.close();
if(!KEEP) fs.rmSync(path.join(ROOT, TESTPAGE), { force: true });

const mins = ((Date.now()-started)/1000/60).toFixed(1);
console.log(`\n${checks.length - failed}/${checks.length} checks passed in ${mins} min`);
/* the shipping build is left in place, uninstrumented, so the tree is clean after */
execFileSync(process.execPath, ["build.js"], { cwd: ROOT, stdio: "ignore" });
process.exit(failed ? 1 : 0);
