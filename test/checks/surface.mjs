/* The floor under the interface: nothing set smaller than the type scale's
   smallest step, and every control a thumb can actually hit.

   The numbers come from v2.19.0. Before it the tab bar was 9px, END WEEK was
   37px tall, and the crest palette was forty-five 30px swatches. Chips are held
   to 36 rather than 44 on purpose — a six-chip training row at 44 would be a
   third taller for nothing. */

import { found, endWeek, clearAll, tab, click , forge } from "../harness.mjs";

export const name = "surface";
export const describe = "no type under the scale, no primary control under a thumb";
export const slow = true;   /* drives a real browser through the real screens */

const FLOOR_TEXT = 11.4;   /* --fs-micro is 11.5; allow for rounding */
const FLOOR_TAP  = 44;     /* buttons, rows, selects, the tab bar */
const FLOOR_CHIP = 36;     /* pills, deliberately denser */

export async function run({ p, errors }){
  await found(p);
  for(let w=0; w<12; w++){ if(!(await endWeek(p))) break; await clearAll(p); }
  await clearAll(p);

  /* ---- AND THE STATE THAT MADE IT HAPPEN ----
     The truncation was reported from a save in year twelve: fame 23,703, a house called
     House Lannisious, rivals with lanistae who have sentences attached to them. A house
     twelve WEEKS old has short names and three-digit numbers and clips nothing, so this
     check would have passed the whole way through the bug. The figures are pushed up to
     the size a long game actually reaches before anything is measured. */
  const grown = await forge(p, (A, R) => {
    let key = null, s = null;
    for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
      try { const x = JSON.parse(localStorage.getItem(k)); if(x && x.gladiators){ key = k; s = x; } } catch(e){} }
    if(!s) return null;
    s.name = "House of Lannisious";
    s.fame = 23703; s.gold = 25451; s.acclaim = 100;
    s.week = 12*18 + 17;
    for(const h of (s.rivals||[])) h.fame = 3000 + Math.round(h.fame||0);
    return { plant:s, name:s.name, fame:s.fame, week:s.week };
  });
  await clearAll(p, 16);

  const TABS = ["ludus","familia","arena","market","villa"];
  const lines = [], bad = [];
  if(grown) lines.push(`grown to ${grown.name}, fame ${grown.fame}, week ${grown.week} — the size a long game reaches`);
  for(const t of TABS){
    await tab(p, t);
    await p.waitForTimeout(300);
    await clearAll(p, 8);
    await tab(p, t);
    await p.waitForTimeout(240);
    /* every face of the tab, because three tabs mount one of several at a time and the
       villa keeps nineteen of its twenty-three sections behind chips */
    const faces = await p.evaluate(()=>{
      const l = [...document.querySelectorAll('[role=tablist]')]
        .filter(x=>/\S+\s+sections\s*$/i.test(x.getAttribute("aria-label")||""))[0];
      return l ? [...l.querySelectorAll("button[role=tab]")].map(b=>(b.innerText||"").trim()).filter(Boolean) : [];
    });
    for(const f of (faces.length ? faces : [null])){
      if(f) { await p.evaluate(t=>{ const b=[...document.querySelectorAll('[role=tablist] button[role=tab]')]
        .find(x=>(x.innerText||"").trim()===t); if(b) b.click(); }, f);
        await p.waitForTimeout(260); }
      await p.evaluate(()=>{ for(const s of document.querySelectorAll("details.sect")) s.open = true; });
      await p.waitForTimeout(300);
    const m = await p.evaluate(({FT,FP,FC})=>{
      let small = 0, smallest = 99;
      for(const e of document.querySelectorAll("div,span,button,summary")){
        if(e.offsetParent === null || e.children.length) continue;
        if(!(e.innerText||"").trim()) continue;
        const fs = parseFloat(getComputedStyle(e).fontSize||"16");
        if(fs < FT){ small++; smallest = Math.min(smallest, fs); }
      }
      const btns = [...document.querySelectorAll("button")].filter(e=>e.offsetParent!==null);
      const tiny = [];
      for(const e of btns){
        const r = e.getBoundingClientRect();
        if(r.height === 0) continue;
        const chip = /\bchip\b|\btag\b/.test(e.className||"");
        const floor = chip ? FC : FP;
        if(r.height < floor) tiny.push({ t:(e.innerText||"").trim().slice(0,18) || "(unlabelled)",
          h:Math.round(r.height), chip });
      }
      /* ---- AND NOTHING MAY BE CUT OFF ----
         A house called "House Glaber" read "House Glaber…", a lanista's line stopped at
         "who bought i", and a fame of 24,700 rendered "247…". Every one of them came from
         two CSS classes carrying white-space:nowrap with text-overflow:ellipsis, and one of
         them a max-width:64% inside a flex row sized by its own content. None of it was
         visible to a check, because a clipped element renders perfectly happily.
         The browser knows: an element whose scrollWidth exceeds its clientWidth is hiding
         part of itself. That is the whole test, and it applies to every screen at once.
         Marquees and deliberately scrollable strips opt out with data-scrolls. */
      const cut = [];
      for(const e of document.querySelectorAll("div,span,button,summary,td,th,li,p")){
        if(e.offsetParent === null) continue;
        if(e.closest("[data-scrolls]")) continue;
        const txt = (e.innerText||"").trim();
        if(!txt) continue;
        const cs = getComputedStyle(e);
        /* only elements that are actually clipping — a visible overflow is not a cut */
        if(!/hidden|clip/.test(cs.overflowX) && cs.textOverflow !== "ellipsis") continue;
        if(cs.overflowX === "auto" || cs.overflowX === "scroll") continue;
        const over = e.scrollWidth - e.clientWidth;
        if(over > 1) cut.push({ t: txt.slice(0,30), over, cls:(e.className||"").toString().slice(0,24) });
      }
      return { small, smallest: smallest===99? null : smallest, btns: btns.length, tiny, cut };
    }, { FT:FLOOR_TEXT, FP:FLOOR_TAP, FC:FLOOR_CHIP });

    const where = f ? `${t}/${f}` : t;
    lines.push(`${where.padEnd(22)} ${String(m.btns).padStart(3)} controls · ${m.tiny.length} under the floor · ${m.small} text under ${FLOOR_TEXT}px · ${m.cut.length} cut off`);
    if(m.small) bad.push(`${where}: ${m.small} text nodes under ${FLOOR_TEXT}px (smallest ${m.smallest}px)`);
    for(const x of m.tiny.slice(0,4))
      bad.push(`${where}: "${x.t}" is ${x.h}px tall, floor is ${x.chip?FLOOR_CHIP:FLOOR_TAP}`);
    for(const x of m.cut.slice(0,4))
      bad.push(`${where}: "${x.t}" is cut off — ${x.over}px of it is hidden${x.cls?` (.${x.cls})`:""}`);
    }
  }

  /* ---- AND THE SHEETS, WHICH IS WHERE IT WAS REPORTED FROM ----
     The Houses of Capua is a record sheet behind a section on the ludus tab, and no check
     had ever opened one. That is where "House Glaber…" and "247…" were. */
  await tab(p, "ludus");
  await p.waitForTimeout(260);
  await p.evaluate(()=>{ const d=[...document.querySelectorAll("details.sect")]
    .find(x=>/records\s*&\s*annals/i.test((x.querySelector("summary")||{}).textContent||"")); if(d) d.open = true; });
  await p.waitForTimeout(320);
  const SHEETS = ["The Lanista","The Houses","The House","The Stands","What Capua Says",
    "Feats","The Record Book","The Annals","Roll of the House"];
  let sheetsSeen = 0;
  for(const s of SHEETS){
    const hit = await p.evaluate(label=>{
      const b = [...document.querySelectorAll("button")].find(x=>x.innerText.trim().startsWith(label));
      if(b){ b.click(); return true; } return false; }, s);
    if(!hit) continue;
    await p.waitForTimeout(340);
    const m = await p.evaluate(()=>{
      const cut = [];
      const w = [...document.querySelectorAll(".modalwrap")]
        .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
      if(!w) return { open:false, cut };
      for(const e of w.querySelectorAll("div,span,button,summary,td,th,li,p")){
        if(e.offsetParent === null || e.closest("[data-scrolls]")) continue;
        const txt = (e.innerText||"").trim(); if(!txt) continue;
        const cs = getComputedStyle(e);
        if(!/hidden|clip/.test(cs.overflowX) && cs.textOverflow !== "ellipsis") continue;
        if(cs.overflowX === "auto" || cs.overflowX === "scroll") continue;
        const over = e.scrollWidth - e.clientWidth;
        if(over > 1) cut.push({ t:txt.slice(0,30), over, cls:(e.className||"").toString().slice(0,24) });
      }
      return { open:true, cut };
    });
    if(!m.open){ await clearAll(p, 6); continue; }
    sheetsSeen++;
    lines.push(`sheet ${s.padEnd(17)} ${m.cut.length} cut off`);
    for(const x of m.cut.slice(0,3))
      bad.push(`the "${s}" sheet: "${x.t}" is cut off — ${x.over}px hidden${x.cls?` (.${x.cls})`:""}`);
    await clearAll(p, 6);
    await p.waitForTimeout(140);
    await p.evaluate(()=>{ const d=[...document.querySelectorAll("details.sect")]
      .find(x=>/records\s*&\s*annals/i.test((x.querySelector("summary")||{}).textContent||"")); if(d) d.open = true; });
    await p.waitForTimeout(120);
  }
  lines.push(`${sheetsSeen} of ${SHEETS.length} record sheets read for cut-off text`);
  if(!sheetsSeen) bad.push("no record sheet could be opened, so the screen the truncation was reported from was not measured");

  if(errors.length) bad.push(`${errors.length} page errors`);
  return { pass: bad.length === 0, why: bad.slice(0,6).join("; ") || null, lines };
}
