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

   WHAT THIS GATE DOES NOT PROVE, which matters as much as what it does. It only sees sections that
   RENDER, and nine of the 33 authored <Sect> blocks do not render on REACH-1 at week 26: five sit
   behind call-site conditions this house never meets (gold >= 4000, monuReady, owedList, an open
   election, an unhonoured death), two live in the gladiator modal, which is not a face. Extracting
   one of those is green by luck rather than by proof, and luck reads exactly like proof.

   TO PROVE ONE ANYWAY: replace its call-site condition with `true &&`, build:test, run this, then
   revert. Forcing the five named above took the count 34 -> 39, +5 exactly, with 0 page errors —
   which is what proved them. Read the errors, do not just count them: `X is not defined` is a real
   scope break, `Cannot read properties of undefined` is only the absent state you forced.

   BASELINE, v3.92.0: 14 faces, 28 sections, 0 page errors on REACH-1 at week 26 — and the COUNT
   is path-sensitive by one or two: the gatekeeper's lessons render as sections and which of them
   stand on a face depends on the order the walk arrived, which changed when the tab bar gave way
   to the scene's doors. The NAMES listing is the real guard; the count is the tripwire.
   Before that, v3.89.0: 27. The trail down:
   36 until v3.85.0 moved five archival panels into the `stand` sheet and folded the villa's
   one-panel `Cells` face into `The House` (30); 31 with the armoury face; 27 when the scene drew
   the yard, the square, unrest and the cells at night out of the panel list entirely — those four
   live as rooms now, their panels opening as documents.

   Usage: node test/probes/faces.mjs [expected-total]     FACES_NAMES=1 to list what rendered
          FACES_WEEKS=n to change the depth (default 26)
*/
import { serve, open, found, tab, clearAll } from "../harness.mjs";
const WANT = process.argv[2] ? +process.argv[2] : null;
/* HOW DEEP TO RUN BEFORE LOOKING. The gate only proves the sections that actually RENDER, and a
   good few are gated on the state of the house — "The house so far" wants `S.week > 20`, the road
   to Rome wants fame or a primus. Walked at week 16 those panels are not on the page, so breaking
   one would not have shown. 26 weeks is the depth `open` already uses for its cross-build
   signature, and it lights the week-20 gates. Both depths are baselined; quote the one you ran. */
const WEEKS = +(process.env.FACES_WEEKS || 26);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p, errors } = await open(port);
await found(p, { seed:"REACH-1" });
for(let w=0; w<WEEKS; w++){ const ok = await p.evaluate(()=>{
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

let total = 0; const rows = []; const SEEN = new Set();
for(const t of ["ludus","familia","arena","market","villa"]){
  await tab(p, t); await p.waitForTimeout(360); await clearAll(p, 6);
  await tab(p, t); await p.waitForTimeout(300);
  if(t === "ludus") for(const d of await dump())
    console.log(`  seen: ${d.tag.padEnd(4)} ${(d.label||"(no label)").padEnd(18)} ${d.modal?"in a modal":"on the page"}  ${d.tag==="div"&&!d.modal?"FACE SWITCHER":"not a face"}  [${d.tabs}]`);
  const fs = await faces();
  const list = fs.length ? fs : [null];
  for(const f of list){
    if(f){ await show(f); await p.waitForTimeout(320); }
    const before = errors.length;
    /* names, not just a count. A count going 34 -> 34 while one panel silently swapped for another
       is a real way to be fooled, and the names cost nothing. They also say what the gate DOESN'T
       cover: any authored <Sect> whose title never appears here did not render on this house, so
       extracting it is unproven and wants a hand-check. */
    const seen = await p.evaluate(()=>[...document.querySelectorAll("details.sect")]
      .map(d=>((d.querySelector("summary")||{}).innerText||"").split("\n")[0].trim()));
    seen.forEach(t2=>SEEN.add(t2));
    total += seen.length;
    rows.push({ where: f ? `${t} · ${f}` : t, n: seen.length, err: errors.length - before });
  }
}
/* AND THE MODAL, which is a face by every measure except the one the switcher uses. A gladiator's
   record has its own five-way chip row and its own <Sect> panels, and none of it is on a tab — so
   the walk above cannot see it, and the last two sections left in App live there. Opened here: a
   roster card is a button.panel that calls setSelId, and the record chips are the one tablist the
   selector above deliberately throws away, because inside .modalwrap is exactly where they are. */
const modalRows = [];
{
  await tab(p, "familia"); await p.waitForTimeout(300); await clearAll(p, 6);
  await tab(p, "familia"); await p.waitForTimeout(300);
  await show("THE ROSTER"); await p.waitForTimeout(320);
  const opened = await p.evaluate(()=>{
    const b=[...document.querySelectorAll("button.panel")].find(x=>x.offsetParent!==null);
    if(!b) return false; b.click(); return true; });
  if(!opened) console.log("  the modal could not be opened — no roster card on this house");
  else {
    await p.waitForTimeout(360);
    const chips = await p.evaluate(()=>[...document.querySelectorAll('.modalwrap [role=tablist] button[role=tab]')]
      .map(b=>(b.innerText||"").trim()).filter(Boolean));
    for(const c of chips){
      await p.evaluate(l=>{ const b=[...document.querySelectorAll('.modalwrap [role=tablist] button[role=tab]')]
        .find(x=>(x.innerText||"").trim()===l); if(b) b.click(); }, c);
      await p.waitForTimeout(260);
      const before = errors.length;
      const seen = await p.evaluate(()=>[...document.querySelectorAll(".modalwrap details.sect")]
        .map(d=>((d.querySelector("summary")||{}).innerText||"").split("\n")[0].trim()));
      seen.forEach(t2=>SEEN.add(t2));
      total += seen.length;
      modalRows.push({ where: `a man's record · ${c}`, n: seen.length, err: errors.length - before });
    }
  }
}
rows.push(...modalRows);

console.log(`\nDOES EVERY FACE STILL RENDER?  (pinned REACH-1, week ${WEEKS})\n`);
for(const r of rows) console.log(`  ${r.where.padEnd(30)} ${String(r.n).padStart(2)} sections${r.err ? `   ${r.err} ERRORS` : ""}`);
console.log(`\n  ${rows.length} faces · ${total} sections · ${errors.length} page errors`);
if(process.env.FACES_NAMES) console.log("  saw: " + [...SEEN].sort().join(" | "));
if(WANT != null) console.log(`  ${total === WANT && !errors.length ? `INTACT — ${WANT} expected and ${WANT} rendered` : `BROKEN — expected ${WANT}, got ${total}, ${errors.length} errors`}`);
[...new Set(errors.map(e=>String(e).split("\n")[0]))].slice(0,4).forEach(e=>console.log(`    ${e.slice(0,140)}`));
console.log();
await browser.close();
server.close();
