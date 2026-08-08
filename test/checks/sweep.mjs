/* Open everything and see if anything throws. Every tab, every collapsible on it,
   every sheet behind the records section, the man's page, the arena wizard. This
   is the cheap net: it does not know what any screen should say, only that
   rendering it did not blow up.

   IT WAS NOT OPENING EVERYTHING, AND IT SAID IT WAS.
   Three tabs are split into faces by their own switchers — the villa has four
   (vView: The House, Standing, Coin & Council, The Cells), the familia has two
   (mView: the roster and the training board), a man's page has several (gView) —
   and only ever one face is mounted at a time. This check clicked the tab and
   opened whatever collapsibles were in the DOM, which on the villa is four of the
   twenty-three sections written for it. It then reported "villa (+4 sections)" and
   passed, which reads like coverage and was 17% of one tab.

   What got through the hole: `VOW_BLESS_AT`, read at src/ludus.jsx:20396 to colour
   the vow panel and declared nowhere — one occurrence in the file, one in the built
   bundle, no binding in front of either. Any house with a vow standing that opened
   the temple hit a ReferenceError inside the render and got no screen. The temple is
   in the villa's *Standing* face, so this check never rendered it once. The other
   check that knows about vows, `temple`, settles them by calling resolveVow directly
   and renders nothing. One check had the screen and no vow; the other had the vow and
   no screen, and the crash sat between them for a release.

   So: every face of every tab, the counts reported per face so a collapse back to
   four is visible, and a second pass over the villa with a vow actually standing. */

import { found, endWeek, clearAll, tab, click, top, waitSaved } from "../harness.mjs";

export const name = "sweep";
export const describe = "every tab, section and sheet renders without throwing";
export const slow = true;   /* drives a real browser through the real screens */

export async function run({ p, errors }){
  await found(p);
  for(let w=0; w<16; w++){ if(!(await endWeek(p))) break; await clearAll(p); }
  await clearAll(p);

  const lines = [], visited = [];
  const TABS = ["ludus","familia","arena","armory","market","villa"];

  /* every face a tab has, by its own switcher. the tab bar's own buttons carry
     role=tab too, so a face switcher is told apart by living inside a tablist that
     is not the tab bar — hence the aria-label on the list rather than the button. */
  const faces = p => p.evaluate(()=>{
    /* the main tab bar is aria-label="Sections" and a face switcher is "Villa sections",
       "Familia sections", "Record sections" — so the switcher is the one with a word in
       front of it. Matching /sections/ alone handed back the tab bar, and four tabs then
       reported the whole game's tab list as their own faces. */
    const lists = [...document.querySelectorAll('[role=tablist]')]
      .filter(l => /\S+\s+sections\s*$/i.test(l.getAttribute("aria-label")||""));
    if(!lists.length) return [];
    return [...lists[0].querySelectorAll("button[role=tab]")]
      .map(b => b.getAttribute("aria-label") || (b.innerText||"").trim()).filter(Boolean);
  });
  const openAll = p => p.evaluate(()=>{ const s=[...document.querySelectorAll("details.sect")];
    s.forEach(x=>{ x.open = true; }); return s.length; });
  const showFace = (p, label) => p.evaluate(l=>{
    const b = [...document.querySelectorAll('[role=tablist] button[role=tab]')]
      .find(x => (x.getAttribute("aria-label")||"") === l);
    if(b){ b.click(); return true; } return false; }, label);

  /* the whole tab, face by face, and the count for each so a silent collapse shows */
  async function sweepTab(t){
    await tab(p, t); await p.waitForTimeout(260);
    await clearAll(p, 10);            /* the gatekeeper arrives when you do, not before */
    await tab(p, t); await p.waitForTimeout(200);
    const fs = await faces(p);
    if(!fs.length){ const n = await openAll(p); await p.waitForTimeout(340);
      visited.push(`${t} (+${n} sections)`); return; }
    const per = [];
    for(const f of fs){
      await showFace(p, f); await p.waitForTimeout(300);
      const n = await openAll(p); await p.waitForTimeout(340);
      per.push(`${f} ${n}`);
    }
    visited.push(`${t} [${per.join(" · ")}]`);
  }
  for(const t of TABS) await sweepTab(t);

  /* the sheets behind the records section on the ludus tab */
  await tab(p, "ludus"); await p.waitForTimeout(240);
  await p.evaluate(()=>{ const d=[...document.querySelectorAll("details.sect")]
    .find(x=>/records\s*&\s*annals/i.test((x.querySelector("summary")||{}).textContent||"")); if(d) d.open = true; });
  await p.waitForTimeout(300);
  const sheets = ["The Lanista","The Houses","The House","The Stands","What Capua Says",
    "Feats","The Record Book","The Annals","Roll of the House"];
  let opened = 0;
  for(const s of sheets){
    const hit = await p.evaluate(label=>{
      const b = [...document.querySelectorAll("button")].find(x=>x.innerText.trim().startsWith(label));
      if(b){ b.click(); return true; } return false; }, s);
    if(!hit) continue;
    await p.waitForTimeout(320);
    const t = await top(p);
    if(t) opened++;
    await clearAll(p, 6);
    await p.waitForTimeout(140);
    /* re-open the section, closing a sheet can collapse it */
    await p.evaluate(()=>{ const d=[...document.querySelectorAll("details.sect")]
      .find(x=>/records\s*&\s*annals/i.test((x.querySelector("summary")||{}).textContent||"")); if(d) d.open = true; });
    await p.waitForTimeout(120);
  }
  visited.push(`${opened} of ${sheets.length} record sheets`);

  /* a man's page, and the arena wizard as far as choosing a card */
  await tab(p, "familia"); await p.waitForTimeout(260);
  const man = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button.panel")][0];
    if(b){ b.click(); return true; } return false; });
  if(man){ await p.waitForTimeout(420); visited.push("a man's page"); await clearAll(p, 8); }

  await tab(p, "arena"); await p.waitForTimeout(260);
  if(await click(p, /choose a bout/i)){
    await p.waitForTimeout(320); visited.push("the arena wizard");
    await clearAll(p, 8);
  }

  /* ---- AND AGAIN WITH A VOW STANDING ----
     the state that shipped a ReferenceError. it cannot be reached by playing sixteen
     weeks and hoping, so the vow is put into the save and the save is taken up again —
     which is a real load of a real save, not a constructed component. */
  await waitSaved(p);
  const vowed = await p.evaluate(()=>{
    const A = window.__LVDVS; if(!A) return { why:"no handle" };
    let key = null, s = null;
    for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
      try { const x = JSON.parse(localStorage.getItem(k)); if(x && x.gladiators){ key = k; s = x; } } catch(e){} }
    if(!s) return { why:"no save to put a vow into" };
    /* fame enough that the villa shows the block the temple lives in, and coin for a stake */
    s.gold = Math.max(s.gold, 20000); s.fame = Math.max(s.fame, 2400); s.piety = 60;
    A.swearVow(s, "fortuna");
    if(!s.vow) return { why:"swearVow refused the state" };
    /* under the bar and over it, because the panel branches on exactly that */
    s.vow.bouts = 3;
    localStorage.setItem(key, JSON.stringify(s));
    return { stake:s.vow.stake, bouts:s.vow.bouts, until:s.vow.until, week:s.week };
  });

  let vowLine = `a vow standing: ${vowed.why || "could not be set up"}`;
  if(!vowed.why){
    await p.reload({ waitUntil:"domcontentloaded" });
    await p.waitForTimeout(1100);
    await click(p, /take up the keys/i);
    await p.waitForTimeout(1100);
    await clearAll(p, 14);
    let panels = 0, faceCount = 0, diag = null;
    for(const bouts of [3, 8]){
      if(bouts !== 3){
        await p.evaluate(n=>{ for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
          try{ const s=JSON.parse(localStorage.getItem(k)); if(s&&s.vow){ s.vow.bouts=n;
            localStorage.setItem(k, JSON.stringify(s)); } }catch(e){} } }, bouts);
        await p.reload({ waitUntil:"domcontentloaded" });
        await p.waitForTimeout(1100);
        await click(p, /take up the keys/i);
        await p.waitForTimeout(1100);
        await clearAll(p, 14);
      }
      await sweepTab("villa");
      faceCount++;
      /* sweepTab finishes on the LAST face, which is The Cells — the temple is on
         Standing, so the panel has to be looked for with Standing actually showing */
      await showFace(p, "Standing");
      await p.waitForTimeout(400);
      await openAll(p);
      await p.waitForTimeout(400);
      if(!diag) diag = await p.evaluate(()=>{
        let s=null; for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
          try{ const x=JSON.parse(localStorage.getItem(k)); if(x&&x.gladiators) s=x; }catch(e){} }
        const t = document.body.innerText||"";
        return `loaded vow=${s&&s.vow?`${s.vow.bouts} cards`:"none"} fame=${s?Math.round(s.fame):"?"}`
          + ` · "The Temple" on screen=${/The Temple/i.test(t)} · "A vow stands"=${/A vow stands/i.test(t)}`;
      });
      /* the panel must actually be on the screen — a pass built on it never rendering
         is the hole this whole second pass exists to close */
      if(await p.evaluate(()=>/A vow stands/i.test(document.body.innerText||"")
        && /card[s]? fought under it/i.test(document.body.innerText||"")
        && /comes back at/i.test(document.body.innerText||""))) panels++;
    }
    visited.length = visited.length - faceCount;   /* the villa lines above are the vow pass */
    if(diag) lines.push(`  ${diag}`);
    vowLine = `a vow standing (${vowed.stake}d, out in week ${vowed.until}): the panel rendered `
      + `${panels} of 2 times — under the bar at 3 cards and over it at 8`;
    if(panels < 2) errors.push(`the vow panel did not render (${panels} of 2) — the temple is in the villa's Standing face`);
  }

  lines.push(`opened: ${visited.join(", ")}`);
  lines.push(vowLine);
  lines.push(errors.length ? `errors: ${errors.slice(0,4).join(" | ")}` : "errors: none");
  return { pass: errors.length === 0, why: errors.length ? `${errors.length} page errors` : null, lines };
}
