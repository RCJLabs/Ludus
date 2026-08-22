/* HOW MUCH OF EACH FACE IS READING MATTER — the measurement the overhaul actually needs

   Three phases of this overhaul moved code, reordered panels and refuted merges, and a player
   cannot see any of it. The reason is that none of it changed WHAT IS ON THE TABS — 32 sections
   before, 32 after, same titles, same heights.

   The game already has the mechanism for reference material: nine SHEETS, full-screen and reached
   from a tile — THE HOUSES OF CAPUA, THE RECORD BOOK, ROLL OF THE HOUSE, WHAT CAPUA SAYS and five
   more. Reference panels are ALSO sitting inline on the tabs as sections, which is the duplication
   worth measuring: a section a player can do nothing with is reading matter competing for the same
   space as the week's work.

   So: per face, every section, and whether it carries a control that changes the house. Controls are
   counted as btn, optrow AND chip — `reach` counts only the first two, and the 42 drill chips on the
   Doctore's Board are real actions it cannot see. Face switchers (role=tab) are excluded.

   Usage: node test/probes/reading.mjs [weeks]
*/
import { serve, open, found, tab, clearAll, installRope } from "../harness.mjs";
const W = +(process.argv[2] || 26);
const PLAYED = !!process.env.PLAYED;
const { server, port } = await serve({ page: process.env.PAGE || "dist/test.html" });
const { browser, p, errors } = await open(port);
await found(p, { seed:"REACH-1" });
/* A SECTION IS NOT "READING" BECAUSE ONE HOUSE SHOWED NO BUTTONS. `The blood of the house` takes
   seekMatch and offers it the moment the lanista can be matched; the pinned house simply cannot.
   Folding a panel on a single house's evidence would hide a real action, so this runs on a played
   house too and the two are unioned by the caller. */
if(PLAYED){
  await installRope(p);
  await p.evaluate(w=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const d = A.newGameState("Rd", "clean", "REACH-1", null);
    for(let i=0;i<w;i++){ if(d.over) break; R.lanista(d); }
    let key=null; for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)) key=k;
    if(key) localStorage.setItem(key, JSON.stringify(d));
  }, W);
  await p.reload({ waitUntil:"domcontentloaded" }); await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test((x.innerText||"").trim())); if(b) b.click(); });
  await p.waitForTimeout(1100); await clearAll(p, 8);
} else {
  for(let w=0; w<W; w++){ const ok = await p.evaluate(()=>{
    const b=[...document.querySelectorAll("button")].find(x=>/^end week/i.test((x.innerText||"").trim()));
    if(b){ b.click(); return true; } return false; }); if(!ok) break;
    await p.waitForTimeout(140); await clearAll(p, 3); }
}

const faces = () => p.evaluate(()=>[...document.querySelectorAll('div[role=tablist]')]
  .filter(d=>!d.closest('.modalwrap')&&!d.closest('.modal'))
  .flatMap(d=>[...d.querySelectorAll('button[role=tab]')]).map(b=>(b.innerText||"").split("\n").find(x=>/[a-z]/i.test(x))||""));

const rows = [];
for(const t of ["ludus","familia","arena","market","villa"]){
  await tab(p, t); await p.waitForTimeout(340); await clearAll(p, 6); await tab(p, t); await p.waitForTimeout(300);
  const n = (await faces()).length;
  for(let fi=0; fi<Math.max(1,n); fi++){
    let label=null;
    if(n){ label = await p.evaluate(i=>{ const b=[...document.querySelectorAll('div[role=tablist]')]
      .filter(d=>!d.closest('.modalwrap')&&!d.closest('.modal'))
      .flatMap(d=>[...d.querySelectorAll('button[role=tab]')])[i];
      if(!b) return null; b.click();
      return ((b.getAttribute("aria-label")||b.innerText||"").split(",")[0].replace(/\s+/g," ").replace(/^\d+\s*/,"").trim()); }, fi);
      await p.waitForTimeout(300); }
    const got = await p.evaluate(()=>{
      const all=[...document.querySelectorAll("details.sect")], was=all.map(d=>d.open);
      all.forEach(d=>d.open=true);
      const out = all.map(d=>{
        const ctl=[...d.querySelectorAll("button.btn, button.optrow, button.chip")]
          .filter(b=>b.getAttribute("role")!=="tab" && !b.closest("summary"));
        return { title:(((d.querySelector("summary")||{}).innerText||"").split("\n").map(x=>x.trim()).find(x=>/[a-z]/i.test(x))||"?").slice(0,32),
          h: Math.round(d.getBoundingClientRect().height), n: ctl.length,
          live: ctl.filter(b=>!b.disabled).length };
      });
      all.forEach((d,i)=>d.open=was[i]);
      return out; });
    for(const g of got) rows.push({ where: `${t}${label?" · "+label:""}`, ...g });
  }
}
const byFace = {};
for(const r of rows) (byFace[r.where] || (byFace[r.where]=[])).push(r);
console.log(`\nHOW MUCH OF EACH FACE IS READING MATTER  (${PLAYED?"a house the rope played":"a house left alone"})\n`);
let tot=0, dead=0, totPx=0, deadPx=0;
for(const [f, list] of Object.entries(byFace)){
  const d = list.filter(x=>x.n===0);
  tot += list.length; dead += d.length;
  totPx += list.reduce((a,x)=>a+x.h,0); deadPx += d.reduce((a,x)=>a+x.h,0);
  console.log(`  ${f}  —  ${list.length} sections, ${d.length} with nothing to do (${d.reduce((a,x)=>a+x.h,0)}px of ${list.reduce((a,x)=>a+x.h,0)}px)`);
  for(const x of list) console.log(`     ${x.n? String(x.n).padStart(3)+" controls" : "  reading  "}  ${String(x.h).padStart(5)}px  ${x.title}`);
}
console.log(`\n  ${dead} of ${tot} sections carry nothing to do — ${deadPx} of ${totPx}px (${Math.round(deadPx/totPx*100)}%)`);
console.log(`  ${errors.length} page errors`);
console.log("  READING: " + rows.filter(r=>r.n===0).map(r=>r.title).join(" | ") + "\n");
await browser.close(); server.close();
