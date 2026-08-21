/* WHERE DOES THE SCROLL ACTUALLY GO? — before cutting, condensing or folding anything.

   `reach` reports "about 79% of the things that change the house sit below the first 844 pixels" and
   v3.19.0 proved that reordering only moves that number around: the party rose 892px and the temple's
   offerings fell by the same 892. To reduce the aggregate something must be REMOVED, CONDENSED or
   FOLDED, and nothing yet says which.

   TWO THINGS THIS MEASURES THAT `reach` DOES NOT.

   First, `reach` OPENS EVERY SECTION before reading a y. It has to — a closed details lays out no
   content, so a button inside one has no y at all. But that means its 79% is the scroll of a page with
   every fold thrown open, which is not the page a player arrives at. The scroll a THUMB faces is the
   default state. If those two numbers differ a lot then the 79% is a fact about the probe's page and
   not about the player's, and the whole "80% problem" needs restating before anything is cut.

   Second, it counts ACTIONS below the fold, not PIXELS. A section 1,400px tall carrying one button and
   a section 200px tall carrying one button push everything under them equally far down, and only the
   first is worth condensing. So: pixels per section, actions per section, and the ratio.

   Reported per PLACE, because a place is where a thumb arrives — a plain tab, or a face behind a chip. */
import { serve, open, clearAll, found, endWeek, tab } from "../harness.mjs";
const W = +(process.argv[2] || 16);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p);
for(let w=0; w<W; w++){ if(!(await endWeek(p))) break; await clearAll(p); }
await clearAll(p, 20);

const faces = () => p.evaluate(()=>{
  const lists = [...document.querySelectorAll('[role=tablist]')]
    .filter(l => /\S+\s+sections\s*$/i.test(l.getAttribute("aria-label")||""));
  if(!lists.length) return [];
  return [...lists[0].querySelectorAll("button[role=tab]")]
    .map(b => b.getAttribute("aria-label") || (b.innerText||"").trim()).filter(Boolean);
});
const showFace = f => p.evaluate(l=>{ const b=[...document.querySelectorAll('[role=tablist] button[role=tab]')]
  .find(x=>(x.getAttribute("aria-label")||x.innerText||"").trim()===l); if(b) b.click(); }, f);

const read = (where) => p.evaluate((where)=>{
  const TEACH = /^(understood|i know my trade|i know the work|carry on|so be it|the doctore nods|next|go on|begin|done|got it|skip|think again|take me there)$/i;
  const OPENER = /^(the lanista|the stands|the house|feats|what capua says|the annals|the record book|the chronicle|roll of the house|carry it out|copy the ledger|back to the records|the year ahead|what the marks mean)/i;
  const MANROW = /^[A-Z][a-z]+ (restless|watchful|compliant|content|sullen|hale|broken|willing|bitter|eager|calm|grim|steady)/;
  const scroll = document.querySelector(".scroll > div");
  if(!scroll) return null;
  const doersIn = el => [...el.querySelectorAll("button.btn, button.optrow")].filter(b=>{
    if(b.getAttribute("role") === "tab" || b.disabled) return false;
    if(b.closest(".modalwrap") || b.closest("summary")) return false;
    const l = (b.innerText||"").replace(/\s+/g," ").trim();
    return l && !TEACH.test(l) && !OPENER.test(l) && !MANROW.test(l);
  }).length;

  /* AS THE PLAYER ARRIVES — every fold in whatever state the game chose */
  const shut = scroll.scrollHeight;
  const shutDoers = doersIn(scroll);

  /* and with every fold thrown open, which is the page `reach` measures */
  const all = [...scroll.querySelectorAll("details.sect")];
  const was = all.map(d=>d.open);
  const depthOf = el => { let n=0, x=el.parentElement; while(x){ if(x.tagName==="DETAILS") n++; x=x.parentElement; } return n; };
  all.slice().sort((a,b)=>depthOf(a)-depthOf(b)).forEach(d=>{ d.open = true; });
  const openH = scroll.scrollHeight;
  const openDoers = doersIn(scroll);

  /* per top-level section, open: how tall, how many things you can do, how much prose */
  const tops = all.filter(d => depthOf(d) === 0);
  const sects = tops.map(d=>{
    const sum = d.querySelector("summary");
    const head = ((sum||{}).innerText||"").split("\n")[0].trim();
    const body = d.getBoundingClientRect().height;
    const sumH = sum ? sum.getBoundingClientRect().height : 0;
    return { head: head.slice(0,34), h: Math.round(body), sumH: Math.round(sumH),
      wasOpen: was[all.indexOf(d)], acts: doersIn(d),
      chars: (d.innerText||"").replace(/\s+/g," ").trim().length };
  });
  /* whatever is NOT inside a top-level section: the face's own panels */
  const inSect = tops.reduce((s,d)=>s + d.getBoundingClientRect().height, 0);
  all.forEach((d,i)=>{ d.open = was[i]; });
  return { where, shut, openH, shutDoers, openDoers, sects,
    loose: Math.round(openH - inSect), fold: 844 };
}, where);

const places = [];
for(const t of ["ludus","familia","arena","market","villa"]){
  await tab(p, t); await p.waitForTimeout(340); await clearAll(p, 8);
  await tab(p, t); await p.waitForTimeout(340);
  const fs = await faces();
  if(!fs.length){ const r = await read(t); if(r) places.push(r); continue; }
  for(const f of fs){
    await showFace(f); await p.waitForTimeout(340);
    const r = await read(`${t} · ${f}`); if(r) places.push(r);
  }
}
await browser.close(); server.close();

const scr = n => `${(n/844).toFixed(1)} screens`;
console.log(`=== WHERE THE SCROLL GOES, at week ${W} of a played house ===\n`);
console.log(`  FIRST: is the page a player arrives at the page the probe measures?\n`);
console.log(`  place                          as it arrives      every fold open     inflation`);
let sumShut = 0, sumOpen = 0;
for(const r of places){ sumShut += r.shut; sumOpen += r.openH;
  console.log(`  ${r.where.padEnd(28)} ${String(r.shut).padStart(6)}px ${scr(r.shut).padStart(11)}`
    + ` ${String(r.openH).padStart(8)}px ${scr(r.openH).padStart(11)}`
    + ` ${((r.openH/r.shut-1)*100).toFixed(0).padStart(8)}%`
    + `   ${r.shutDoers}/${r.openDoers} actions`); }
console.log(`  ${"ALL SIX TABS".padEnd(28)} ${String(sumShut).padStart(6)}px ${scr(sumShut).padStart(11)}`
  + ` ${String(sumOpen).padStart(8)}px ${scr(sumOpen).padStart(11)} ${((sumOpen/sumShut-1)*100).toFixed(0).padStart(8)}%`);

console.log(`\n  AND WHERE THE PIXELS SIT — every top-level section, open, tallest first.`);
console.log(`  px/action is what says whether a section is worth condensing: a tall section with one`);
console.log(`  button pushes everything under it just as far as a short one with the same button.\n`);
const rows = [];
for(const r of places) for(const s of r.sects) rows.push({ ...s, where: r.where });
rows.sort((a,b)=>b.h-a.h);
console.log(`     px  screens  acts  px/act  chars  shut?  place :: section`);
for(const s of rows.slice(0, 30))
  console.log(`  ${String(s.h).padStart(5)}  ${(s.h/844).toFixed(1).padStart(7)}  ${String(s.acts).padStart(4)}  `
    + `${(s.acts ? Math.round(s.h/s.acts) : s.h).toString().padStart(6)}${s.acts?"":"*"} ${String(s.chars).padStart(6)}  `
    + `${(s.wasOpen?"open":"shut").padEnd(5)}  ${s.where} :: ${s.head}`);
console.log(`\n  * no actions at all — the section is entirely reading`);

const noAct = rows.filter(s=>!s.acts);
console.log(`\n  SECTIONS THAT ARE PURE READING: ${noAct.length} of ${rows.length}, `
  + `${noAct.reduce((n,s)=>n+s.h,0)}px between them (${scr(noAct.reduce((n,s)=>n+s.h,0))}), `
  + `${noAct.filter(s=>s.wasOpen).length} of them open on arrival`);
for(const s of noAct.filter(x=>x.wasOpen).sort((a,b)=>b.h-a.h).slice(0,10))
  console.log(`    ${String(s.h).padStart(5)}px  ${s.where} :: ${s.head}`);
