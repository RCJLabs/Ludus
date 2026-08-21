/* DOES EVERY FACE STILL RENDER? — the gate for the section extraction

   The tab overhaul lifts each `<Sect>` out of App to module scope. That moves markup away from the
   scope it was written in, and JavaScript does not complain until a player opens that panel:
   `blood` renders the lanista's wife from a `w` computed in the block above it, and lifted out it
   threw "w is not defined" on a build that compiled without a murmur.

   A STATIC GATE WAS TRIED FIRST AND ABANDONED, which is worth writing down. The idea was to collect
   every name App declares at any depth and flag any an extracted section uses without declaring or
   receiving. Matching against a known declaration set keeps the obvious false positives away — but
   these panels are mostly PROSE, and the prose is full of ordinary words that are also names in a
   26,000-line file. Four rounds of refinement — excluding attribute names, then searching only
   brace regions, then dropping string literals and keeping only `${…}` from template literals —
   took `square` from 31 suspects to 18, and the survivors were `him`, `at`, `freed`: English, inside
   nested JSX inside an expression. A correct version needs a real parser, and a regex that is nearly
   right is worse than none, because it teaches you to ignore it.

   So the gate is the complete one instead, and it is cheaper than the thing it replaces: open every
   FACE of every tab and count what renders. `reach` walks 114 seconds and enumerates every button;
   this only needs the section count and the error log. The faces matter more than the tabs — the
   first diagnostic probe walked all six tabs but only each tab's DEFAULT face, and reported "total
   errors: 0" on a build whose section count had fallen from 32 to 20, because villa has four faces
   and the broken ones were the three it never opened.

   Usage: node test/probes/faces.mjs [expected-total]
*/
import { serve, open, found, tab, clearAll } from "../harness.mjs";
const WANT = process.argv[2] ? +process.argv[2] : null;

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p, errors } = await open(port);
await found(p, { seed:"REACH-1" });
for(let w=0; w<16; w++){ const ok = await p.evaluate(()=>{
    const b=[...document.querySelectorAll("button")].find(x=>/^end week$/i.test((x.innerText||"").trim()));
    if(b){ b.click(); return true; } return false; });
  if(!ok) break; await p.waitForTimeout(160); await clearAll(p, 3); }

/* THE SELECTOR IS THE PROBE. The first draft asked for `[role=tablist] button[role=tab]` and
   reported 42 faces and 130 sections against a truth of 10 and 32 — it had matched the MAIN TAB BAR
   as well as the face switcher, so it walked every tab inside every tab and its rows read
   "market · ARENA" and "villa · LUDUS". Three things in this app carry role=tablist:

     nav.bar[aria-label="Sections"]        the six tabs along the bottom — NOT a face
     div[aria-label="Familia sections"]    the two faces of Familia
     div[aria-label="Villa sections"]      the four faces of Villa
     div[aria-label="Record sections"]     inside the gladiator modal — not on a tab at all

   So: div, and not inside a modal. `dump()` prints every tablist on the page with the verdict
   beside it, because a count that filters something should show what it threw away. */
const PICK = `[...document.querySelectorAll('div[role=tablist]')].filter(d => !d.closest('.modalwrap') && !d.closest('.modal'))`;
const faces = () => p.evaluate(`${PICK}.flatMap(d=>[...d.querySelectorAll('button[role=tab]')]).map(b=>(b.innerText||"").trim())`);
const show = f => p.evaluate(l=>{ const b=[...document.querySelectorAll('div[role=tablist]')]
  .filter(d => !d.closest('.modalwrap') && !d.closest('.modal'))
  .flatMap(d=>[...d.querySelectorAll('button[role=tab]')])
  .find(x=>(x.innerText||"").trim()===l); if(b) b.click(); }, f);
const dump = () => p.evaluate(()=>[...document.querySelectorAll('[role=tablist]')].map(d=>({
  tag: d.tagName.toLowerCase(), label: d.getAttribute("aria-label")||"", modal: !!(d.closest('.modalwrap')||d.closest('.modal')),
  tabs: [...d.querySelectorAll('button[role=tab]')].map(b=>(b.innerText||"").trim()).join(", ").slice(0,60) })));

let total = 0; const rows = [];
for(const t of ["ludus","familia","arena","armory","market","villa"]){
  await tab(p, t); await p.waitForTimeout(360); await clearAll(p, 6);
  await tab(p, t); await p.waitForTimeout(300);
  if(t === "ludus") for(const d of await dump())
    console.log(`  seen: ${d.tag.padEnd(4)} ${(d.label||"(no label)").padEnd(18)} ${d.modal?"in a modal":"on the page"}  ${d.tag==="div"&&!d.modal?"FACE SWITCHER":"not a face"}  [${d.tabs}]`);
  const fs = await faces();
  const list = fs.length ? fs : [null];
  for(const f of list){
    if(f){ await show(f); await p.waitForTimeout(320); }
    const before = errors.length;
    const n = await p.evaluate(()=>document.querySelectorAll("details.sect").length);
    total += n;
    rows.push({ where: f ? `${t} · ${f}` : t, n, err: errors.length - before });
  }
}
console.log(`\nDOES EVERY FACE STILL RENDER?\n`);
for(const r of rows) console.log(`  ${r.where.padEnd(30)} ${String(r.n).padStart(2)} sections${r.err ? `   ${r.err} ERRORS` : ""}`);
console.log(`\n  ${rows.length} faces · ${total} sections · ${errors.length} page errors`);
if(WANT != null) console.log(`  ${total === WANT && !errors.length ? `INTACT — ${WANT} expected and ${WANT} rendered` : `BROKEN — expected ${WANT}, got ${total}, ${errors.length} errors`}`);
[...new Set(errors.map(e=>String(e).split("\n")[0]))].slice(0,4).forEach(e=>console.log(`    ${e.slice(0,140)}`));
console.log();
await browser.close();
server.close();
