/* THE DESK — an agenda row that names a panel must open it, unfolded, and land where it says

   v3.87.0 extended the agenda's destination syntax to a third part: "tab:face:panel", where the
   panel is a SECT registry id and a row carrying one opens that panel as a DOCUMENT in place. Two
   ways that can rot, and this check holds both:

   THE STATIC HALF: a typo'd panel id does not throw — the row silently falls back to travelling,
   which is exactly the invisible-failure shape this project distrusts (a dot that never lights
   looks like a tab with nothing in it). So every 3-part id in an add() call must name a real SECT
   entry, read off the source.

   THE RUNTIME HALF, on the pinned house's real morning: REACH-1 at week 17 raises doctrine,
   matchmakers and a waiting patron, all doc-bearing. Tap each row that opens a document and assert
   the letter appears WITH ITS PANEL UNFOLDED — Sect's per-sid memory would happily deliver a
   remembered-shut panel inside an opened letter, and the frame force-opens against that. Then prove
   "See it in the house" actually lands on the face the item names, because a footer that travels to
   the wrong room is worse than no footer.
*/
import { found, tab, clearAll, installRope } from "../harness.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const name = "desk";
export const describe = "an agenda row that names a panel opens it as a document, unfolded";

export async function run({ p, errors }){
  const lines = [], fails = [];

  /* ---- static: every named panel exists ---- */
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const ids = [...src.matchAll(/add\((?:[^,]+), "(\w+):(\w*):(\w+)"/g)].map(m=>({ tab:m[1], face:m[2], panel:m[3] }));
  const sectKeys = new Set([...src.matchAll(/\n  (\w+): \(S(?:, X)?(?:, \w+)?\) =>/g)].map(m=>m[1]));
  const bad = ids.filter(x=>!sectKeys.has(x.panel));
  lines.push(`${ids.length} agenda items name a panel · ${new Set(ids.map(x=>x.panel)).size} distinct panels`);
  for(const b of bad) fails.push(`"${b.tab}:${b.face}:${b.panel}" names a panel SECT does not have — the row will silently travel instead of opening`);

  /* ---- runtime: the pinned morning, PLAYED ----
     The first draft founded REACH-1 and clicked end-week sixteen times, then asserted the fixture
     from the MOCK — which was the rope-played morning. An idle house has no patrons to keep waiting
     and no fame for matchmakers, so the check failed on its own denominator, not on the game. The
     rope builds the same deterministic morning here that the mock was drawn from, the agenda is
     read ONCE off that exact state, and the save written from it is what the UI reloads — one
     state, three uses, nothing re-derived. */
  await found(p, { seed:"REACH-1" });
  await installRope(p);
  const rows = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const d = A.newGameState("Reach", "clean", "REACH-1", null);
    for(let i=0;i<16;i++){ if(d.over) break; R.lanista(d); }
    let key=null; for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)) key=k;
    if(key) localStorage.setItem(key, JSON.stringify(d));
    let list=[]; try { list = A.agenda(d)||[]; } catch(e){}
    return list.map(x=>({ label:x.label, doc:x.doc||null, dest:x.dest||null, tab:x.tab }));
  });
  await p.reload({ waitUntil:"domcontentloaded" }); await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/take up the keys/i.test((x.innerText||"").trim())); if(b) b.click(); });
  await p.waitForTimeout(1100); await clearAll(p, 8);
  await tab(p, "ludus"); await p.waitForTimeout(350); await clearAll(p, 6);
  await tab(p, "ludus"); await p.waitForTimeout(300);

  const docable = rows.filter(r=>r.doc);
  lines.push(`this morning raises ${rows.length} items, ${docable.length} carrying a document: `
    + docable.map(r=>`${r.doc} (${r.label.slice(0,28)})`).join(" · "));
  if(docable.length < 2) fails.push(`only ${docable.length} doc-bearing items on the played pinned morning — it carried `
    + `watch, doctrine and blood when this was written; if the rope or the agenda changed, re-read this morning before trusting the walk`);

  /* the agenda rows live in the REPORT SHEET since v3.93.0 — THIS WEEK left the home page — so
     each letter is opened the way a player opens it: the bar, then the row. */
  let opened = 0, unfolded = 0;
  for(const r of docable.filter(x=>x.tab === "ludus" || x.tab === "villa")){
    await p.evaluate(()=>{ const b=document.querySelector(".reportbar"); if(b) b.click(); });
    await p.waitForTimeout(350);
    const hit = await p.evaluate(lab=>{
      const w=[...document.querySelectorAll(".modalwrap")].pop();
      const b=[...(w?w.querySelectorAll("button.optrow"):[])].find(x=>(x.innerText||"").includes(lab.slice(0,30)));
      if(!b) return false; b.click(); return true; }, r.label);
    if(!hit){ await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")].pop();
      const c=[...(w?w.querySelectorAll("button"):[])].find(x=>/close/i.test(x.getAttribute("aria-label")||x.innerText||""));
      if(c) c.click(); }); await p.waitForTimeout(200); continue; }
    await p.waitForTimeout(350);
    const state = await p.evaluate(()=>{
      const w=[...document.querySelectorAll(".modalwrap")].pop(); if(!w) return null;
      const dets=[...w.querySelectorAll("details")];
      return { title:(w.querySelector(".disp")||{}).innerText||"", dets:dets.length, open:dets.filter(d=>d.open).length }; });
    if(state){ opened++;
      if(state.dets && state.open === state.dets) unfolded++;
      else fails.push(`the document for "${r.label.slice(0,32)}" opened with ${state.open} of ${state.dets} panels unfolded — Sect memory beat the frame`);
      await p.evaluate(()=>{ const b=[...document.querySelectorAll(".modalwrap button")]
        .find(x=>/put it down/i.test(x.innerText||"")); if(b) b.click(); });
      await p.waitForTimeout(220);
    }
  }
  lines.push(`${opened} documents opened from the ludus agenda, ${unfolded} fully unfolded`);
  if(!opened) fails.push("no document opened at all from the pinned morning's agenda");

  /* ---- and the footer travels to the face the item names ---- */
  const doctrine = docable.find(r=>r.doc==="doctrine");
  if(doctrine){
    await p.evaluate(()=>{ const b=document.querySelector(".reportbar"); if(b) b.click(); });
    await p.waitForTimeout(350);
    await p.evaluate(lab=>{ const w=[...document.querySelectorAll(".modalwrap")].pop();
      const b=[...(w?w.querySelectorAll("button.optrow"):[])].find(x=>(x.innerText||"").includes(lab.slice(0,30)));
      if(b) b.click(); }, doctrine.label);
    await p.waitForTimeout(320);
    await p.evaluate(()=>{ const b=[...document.querySelectorAll(".modalwrap button")]
      .find(x=>/see it in the house/i.test(x.innerText||"")); if(b) b.click(); });
    await p.waitForTimeout(420);
    const where = await p.evaluate(()=>{
      const face=[...document.querySelectorAll('div[role=tablist] button[role=tab]')]
        .find(b=>b.getAttribute("aria-selected")==="true");
      const doct=[...document.querySelectorAll("details.sect summary")]
        .some(x=>/doctrine of the house/i.test(x.innerText||""));
      return { face:(face&&(face.getAttribute("aria-label")||face.innerText).split(",")[0].trim())||null, doct }; });
    lines.push(`"see it in the house" from the doctrine letter landed on ${where.face} · the doctrine panel is ${where.doct?"on screen":"NOT on screen"}`);
    if(!where.doct) fails.push(`"see it in the house" left the doctrine letter for a face without the doctrine on it (${where.face})`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
