/* WHAT HAS NO CHECK EVER TOUCHED.
   ================================
   The suite can tell you which checks pass. It cannot tell you what it never
   looked at, and those are not the same question — a check that never reaches a
   state looks exactly like a check that reaches it and finds nothing wrong.

   That is not a hypothetical in this repo. `survive` ran for weeks never buying
   a man. Two checks asserted against distributions borrowed from a different
   policy. The card check counted Rome and a tour down the coast as though they
   were a Capuan bill, and read 84% single combats where the real figure was 57.
   Every one of those was invisible from the pass column.

   So: build the test bundle, which wraps every function on the handle in a
   counter, run each check against a fresh page, and read the counters back.

   Run it with `npm run coverage`.

   ONE HONEST CAVEAT, because a coverage number nobody qualifies is worse than
   none. The counter only sees calls made THROUGH the handle. When a check drives
   the real UI and the game calls simulateMelee from inside doMelee, that call is
   the module-scope binding and does not touch the wrapper. So "never called" here
   means "no check reaches this directly", not "this code never runs". Read the
   list as a list of things no check can make an assertion about — which is the
   useful reading anyway. */

import fs from 'node:fs';
import path from 'node:path';
import { writeSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { serve, open, ROOT } from './harness.mjs';

const say = (...a) => writeSync(1, a.join(' ') + '\n');
const DIM = '\x1b[2m', YEL = '\x1b[33m', OFF = '\x1b[0m';

/* its own file, so a sweep and a test run cannot catch each other mid-write */
const page = `dist/cov-${process.pid}.html`;
say('building the test bundle…');
execFileSync(process.execPath, ['build.js', '--test', `--out=${page}`], { cwd: ROOT, stdio: 'inherit' });

const dir = path.join(ROOT, 'test', 'checks');
const checks = [];
for(const f of fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).sort()){
  const m = await import(path.join(dir, f));
  if(m.name && typeof m.run === 'function') checks.push(m);
}

const { server, port } = await serve({ page });
const per = {}, union = new Set();
let names = [];

for(const c of checks){
  let session = null;
  try {
    session = await open(port);
    await session.p.evaluate(()=>{ const A = window.__LVDVS;
      if(A && A.__calls) for(const k of Object.keys(A.__calls)) A.__calls[k] = 0; });
    try { await c.run({ p:session.p, errors:session.errors, port }); } catch(e){ /* a failing check still covers ground */ }
    const calls = await session.p.evaluate(()=>(window.__LVDVS && window.__LVDVS.__calls) || {});
    names = Object.keys(calls);
    const touched = names.filter(k => calls[k] > 0);
    per[c.name] = touched;
    for(const k of touched) union.add(k);
    say(`  ${c.name.padEnd(10)} touched ${String(touched.length).padStart(3)} of ${names.length}`);
  } catch(e){
    say(`  ${c.name.padEnd(10)} ${YEL}could not be run: ${e.message.split('\n')[0]}${OFF}`);
  } finally { if(session) await session.browser.close().catch(()=>{}); }
}
server.close();

const never = names.filter(k => !union.has(k)).sort();
say('');
say(`=== ${union.size} of ${names.length} exposed functions are reached by at least one check ===`);
say('');
say(`${YEL}  never called by any check (${never.length}):${OFF}`);
for(let i=0;i<never.length;i+=4) say('     ' + never.slice(i,i+4).map(x=>x.padEnd(20)).join(''));
say('');

/* and which single check is carrying which part of the game, so that when one is
   deleted or quietly stops reaching something, it is known what went dark with it */
const only = {};
for(const k of union){
  const who = Object.keys(per).filter(c => per[c].includes(k));
  if(who.length === 1) (only[who[0]] = only[who[0]] || []).push(k);
}
say('  reached by exactly one check — if that check goes quiet, so does this:');
for(const [c, ks] of Object.entries(only).sort((a,b)=>b[1].length - a[1].length))
  say(`     ${c.padEnd(10)} ${String(ks.length).padStart(3)}  ${ks.slice(0,7).join(', ')}${ks.length>7?', …':''}`);
say('');
say(`${DIM}  the counter only sees calls made through the test handle; a check that drives`);
say(`  the UI exercises plenty of code that does not show up here.${OFF}`);

fs.writeFileSync(path.join(ROOT, 'test', '.coverage.json'),
  JSON.stringify({ per, never, names }, null, 1));

fs.rmSync(path.join(ROOT, page), { force: true });
/* leave the tree holding a shipping build, as the test runner does */
execFileSync(process.execPath, ['build.js'], { cwd: ROOT, stdio: 'ignore' });
