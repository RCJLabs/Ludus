/* #214 — WHAT A ROSTER ROW ACTUALLY IS, AND WHAT A GLANCE AT IT COSTS

   The item: "A man's own drawing (fatigue, injury, record, kit) lives on his page only. The roster
   rows and the block are name + tags + bars. Recommend the small figure on every roster and block
   row — a glance at the familia should look like a yard, and an infirmary row should LOOK hurt."

   TWO THINGS ARE TRUE BEFORE ANY MEASURING. `ScnMan` — the 35px yard figure, 22 distinct drawings
   after v3.144.0 — has exactly ONE call site in the whole program: the yard band of the drawn
   ludus, capped at six men. And the roster row draws no figure at all.

   BUT THE INTERESTING QUESTION IS NOT "IS THERE A FIGURE". It is whether the row already SAYS
   everything the figure would show, in which case this is #207 again — a recommendation for
   something the game already serves by another route. Every axis `ScnMan` carries has a tag:
   class, injury, scars, sex, record, and fatigue has a bar. So the case for the figure cannot be
   "the information is missing". It has to be that the row is not a glance.

   SO MEASURE THE GLANCE:
     · how tall a row is, how many tags it carries, and how many rows clear an 844px fold
     · how much of the row is TEXT — a row that is 100% words cannot be read at a glance whatever
       is in the words
     · and the same for the block, which the item names separately

     node test/probes/familia.mjs */
import { serve, open, found, clearAll, installRope, forge, tab, settle } from "../harness.mjs";

const FOLD = 844;   /* the phone the whole project measures against */

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"FAMILIA" }); await clearAll(p, 20); await installRope(p);

/* a real house with a real spread of men — some hurt, some fresh, some decorated.
   BUILT FIRST, PLANTED SECOND. Doing the seed search inside `forge`'s own builder runs 500-odd
   weeks between the write and the reload, and the app's 500ms autosave lands in that window and
   overwrites the plant — forge catches it and throws, which is exactly what it is for. */
const state = await p.evaluate(()=>{
  const A = window.__LVDVS, R = window.__ROPE;
  let best = null;
  for(const tag of ["A","B","C","D","E","F","G","H"]){
    const d = A.newGameState("Familia", "clean", "FAM-"+tag, null);
    for(let w=0; w<70; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    if(d.over) continue;
    const n = d.gladiators.filter(g=>!A.isGone(g)).length;
    if(!best || n > best.n) best = { d, n };
  }
  return best ? { d:best.d, n:best.n } : null;
});
if(!state){ console.log("every fixture house died"); await browser.close(); server.close(); process.exit(1); }
const built = await forge(p, (A, R, arg) => ({ plant: arg.d, week: arg.d.week,
  men: A.activeG(arg.d).length, all: arg.n }), state);
if(built.why){ console.log(built.why); await browser.close(); server.close(); process.exit(1); }
console.log(`a played house at week ${built.week} — ${built.all} on the books, ${built.men} active\n`);

/* CLEAR AFTER THE PLANT, NOT BEFORE IT. `forge` reloads, and the reload raises whatever lesson
   the planted week is owed — measured once as a modal sitting over the whole roster while the
   probe reported geometry for the page behind it. */
await clearAll(p, 14);
await tab(p, "men"); await p.waitForTimeout(500); await clearAll(p, 8); await settle(p);

const out = await p.evaluate((FOLD)=>{
  const A = window.__LVDVS;
  const k = Object.keys(localStorage).find(q=>/ludus-slot-\d/.test(q));
  const d = k ? JSON.parse(localStorage.getItem(k)) : null;

  /* the roster rows are the buttons carrying a .tag and a name */
  const rows = [...document.querySelectorAll("button.panel")]
    .filter(b => b.querySelector(".tag") && b.querySelector(".disp"));
  const read = b => {
    const r = b.getBoundingClientRect();
    const tags = [...b.querySelectorAll(".tag")].map(t=>(t.innerText||"").trim());
    const bars = b.querySelectorAll(".track, .fill").length;
    const svg  = b.querySelectorAll("svg").length;
    const shapes = b.querySelectorAll("svg *").length;
    const text = (b.innerText||"").replace(/\s+/g," ").trim();
    return { h: Math.round(r.height), y: Math.round(r.top), tags: tags.length, tagList: tags,
      bars, svg, shapes, words: text ? text.split(" ").length : 0, chars: text.length };
  };
  const R = rows.map(read);

  /* what the MEN themselves differ on — the axes a drawing could carry */
  const men = d ? d.gladiators.filter(g=>!A.isGone(g)) : [];
  const axes = { cls:new Set(), hurt:new Set(), scars:new Set(), spent:new Set(),
    wins:new Set(), kills:new Set(), fem:new Set() };
  for(const g of men){
    axes.cls.add(g.cls);
    axes.hurt.add(g.injury ? g.injury.part : "-");
    axes.scars.add(Math.min(4,(g.scars||[]).length));
    axes.spent.add((g.fatigue||0) > 55);
    axes.wins.add(A.palmOf ? A.palmOf(g.wins) : Math.min(4, g.wins||0));
    axes.kills.add(Math.min(4, g.kills||0));
    axes.fem.add(!!(A.isF && A.isF(g)));
  }

  const first = R.length ? R[0].y : null;
  return { rows:R, fold: R.filter(x=>x.y >= 0 && x.y + x.h <= FOLD).length, first,
    scrollY: Math.round(window.scrollY),
    axes: Object.fromEntries(Object.entries(axes).map(([k,v])=>[k, v.size])),
    men: men.length,
    /* and the block, for the same questions */
    scroll: Math.round(document.documentElement.scrollHeight) };
}, FOLD);

const R = out.rows;
if(!R.length){ console.log("no roster rows found — the selector is wrong, fix it before reading anything"); }
else {
  const sum = (f) => R.reduce((n,x)=>n+f(x),0);
  const q = a => { const s=a.slice().sort((x,y)=>x-y); return { min:s[0], p50:s[Math.floor(s.length/2)], max:s[s.length-1] }; };
  console.log(`THE ROSTER — ${R.length} rows, page ${out.scroll}px, first row at y=${out.first} (scrollY ${out.scrollY}), `
    + `${out.fold} row${out.fold===1?"":"s"} whole above the ${FOLD}px fold\n`);
  console.log(`  row height  ${JSON.stringify(q(R.map(x=>x.h)))}`);
  console.log(`  tags a row  ${JSON.stringify(q(R.map(x=>x.tags)))}   · ${sum(x=>x.tags)} tags in total`);
  console.log(`  words a row ${JSON.stringify(q(R.map(x=>x.words)))}  · ${sum(x=>x.words)} words in total`);
  console.log(`  bars a row  ${JSON.stringify(q(R.map(x=>x.bars)))}`);
  console.log(`  DRAWN SHAPES a row: ${JSON.stringify(q(R.map(x=>x.shapes)))}  (svg elements: ${sum(x=>x.svg)})`);
  console.log(`\n  the first three rows, tag by tag:`);
  for(const x of R.slice(0,3)) console.log(`    ${String(x.h).padStart(3)}px · ${x.tags} tags · ${x.words} words · ${x.shapes} shapes`
    + `\n       ${x.tagList.join(" | ")}`);
}
console.log(`\nWHAT THE MEN THEMSELVES DIFFER ON, in this house (${out.men} men):`);
for(const [k,v] of Object.entries(out.axes)) console.log(`  ${k.padEnd(7)} ${v} distinct value${v===1?"":"s"}`);

await browser.close(); server.close();
