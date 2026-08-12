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

  /* ---- WHAT THE SCREEN SAYS, NOT JUST WHETHER IT THREW ----
     This check has always asked whether a panel renders. A player reported "He loses about NaN in a
     hundred, and a loss here is his life" on every man in a pair chooser — `fieldAverage` returns the
     average man in a field and carried the six stats and nothing else, so `power`'s read of `morale`
     was `clamp(undefined,0,100)`, which is NaN, and NaN went straight to the screen. Nothing threw.
     Nothing was going to throw. A number that has become the word NaN is a rendering fault the only
     way to catch is to READ THE SCREEN, so from v3.1.0 every face this check opens is scanned for the
     four things a template says when a value went missing under it. */
  const BAD_TEXT = [
    { re:/\bNaN\b/,             what:"NaN",              why:"a number that arithmetic lost — a missing field on an object somebody priced" },
    { re:/\bundefined\b/,       what:"undefined",         why:"a field read off an object that has not got it" },
    { re:/\[object Object\]/,   what:"[object Object]",   why:"an object interpolated where a string was wanted" },
    { re:/\bInfinity\b/,        what:"Infinity",          why:"a division by nought that reached the screen" },
  ];
  const spoiled = [];
  async function readScreen(where){
    const t = await p.evaluate(()=>document.body.innerText || "");
    for(const B of BAD_TEXT){
      if(!B.re.test(t)) continue;
      /* the line it is on, so the fault can be found rather than hunted */
      const line = (t.split("\n").find(l=>B.re.test(l)) || "").trim().slice(0, 110);
      spoiled.push({ where, what:B.what, why:B.why, line });
    }
  }

  /* ---- AND THE SHAPE OF THE FACE, NOT JUST ITS CONTENTS ----
     v3.1.0 counted every section on every face for the first time, on a founded house at week 17:

       ludus                12 sections, and one of them a section INSIDE a section
       armory                7, every weapon family 24 to 37 lines long
       villa · The Cells     4, three of which held one paragraph and one button each
       market                4, two of which said "build the room first" in 61 and 63 characters
       villa · The House     4, the last of which was 100 characters

     Nesting is a hard fault and is asserted: a `details` inside a `details` puts a thing two clicks
     down, and "What you are doing without" — the six things a doctore is worth — was two clicks down on
     the tab a player opens every week. THE THIN ONES ARE COUNTED AND PRINTED, NOT ASSERTED, because
     "this section is too short" is a judgement and `probe` already paid for the lesson that a rule
     which flags seven false positives teaches people to add exemptions without thinking. */
  const shape = [];
  async function readShape(where){
    const a = await p.evaluate(()=>{
      const all = [...document.querySelectorAll("details.sect")];
      const was = all.map(d=>d.open);
      const depth = d => { let n = 0, x = d.parentElement;
        while(x){ if(x.tagName === "DETAILS") n++; x = x.parentElement; } return n; };
      /* shallowest first, or a nested section is still hidden when it is read */
      all.slice().sort((x,y)=>depth(x)-depth(y)).forEach(d=>{ d.open = true; });
      const rows = all.map(d=>{
        const sum = d.querySelector("summary");
        const title = ((sum && sum.innerText) || "").split("\n")[0].trim();
        const body = (d.innerText||"").replace(sum ? sum.innerText : "", "").trim();
        return { title, depth:depth(d), chars:body.length, buttons:d.querySelectorAll("button").length };
      });
      all.forEach((d,i)=>{ d.open = was[i]; });
      return rows;
    });
    shape.push({ where, rows:a });
  }

  /* ---- AND WHAT THE TAB SAYS BEFORE A PLAYER SCROLLS, from v3.3.0 ----
     The header is fixed on every tab and already carries the coin, the fame, the favour and the unrest
     word, so no tab needs to repeat those. What each tab owes is the answer to its OWN question, above
     the fold, at a phone width — and measured with a fold probe, three did not give it:

       arena   led with "What can be done quietly" and its three bribe options with their odds, filling
               the whole first screen. A player who opened the Arena to see what bouts were on offer got
               a bribery menu, and TO THE SAND was below the fold.
       market  answered in a line of flavour text at y=361, under two staff sections.
       villa · Coin & Council  opened with three CLOSED sections and then the moneylenders, and said
               nothing about coin on the face named for it.

     `ludus` (the week's work, v3.2.0), `familia` ("What the men need") and `armory` ("The racks") already
     answered. So this asserts the answer is in the first screen and names the fault if it is not. */
  const FOLD = 844;
  const ANSWERS = {
    arena:  { re:/to the sand|choose a bout|on the imperial sand|on the road/i, what:"the card, or why there is none" },
    market: { re:/the block|room for|the cells are full/i,                      what:"what room is in the cells and what is on the block" },
    ludus:  { re:/this week|nothing new is asking/i,                            what:"what the week is asking for" },
    familia:{ re:/what the men need|the roster/i,                              what:"what the men need" },
    armory: { re:/the racks/i,                                                  what:"what the racks are holding" },
  };
  const foldMiss = [];
  async function readFold(tabKey, where){
    const A = ANSWERS[tabKey]; if(!A) return;
    const seen = await p.evaluate(cut=>{
      const out = [];
      const walk = el => { for(const c of el.children){
        const y = c.getBoundingClientRect().top + window.scrollY;
        if(y > cut) continue;
        const t = (c.innerText||"").trim();
        if(!t) continue;
        if(t.length <= 160 || !c.children.length) out.push(t); else walk(c); } };
      const sc = document.querySelector(".scroll > div"); if(sc) walk(sc);
      return out.join(" \n ");
    }, FOLD);
    if(!A.re.test(seen)) foldMiss.push({ where, what:A.what });
  }

  /* the whole tab, face by face, and the count for each so a silent collapse shows */
  async function sweepTab(t){
    await tab(p, t); await p.waitForTimeout(260);
    await clearAll(p, 10);            /* the gatekeeper arrives when you do, not before */
    await tab(p, t); await p.waitForTimeout(200);
    const fs = await faces(p);
    if(!fs.length){ const n = await openAll(p); await p.waitForTimeout(340);
      visited.push(`${t} (+${n} sections)`); await readScreen(t); await readShape(t);
      await readFold(t, t); return; }
    const per = [];
    for(const f of fs){
      await showFace(p, f); await p.waitForTimeout(300);
      const n = await openAll(p); await p.waitForTimeout(340);
      per.push(`${f} ${n}`);
      await readScreen(`${t} · ${f}`);
      await readShape(`${t} · ${f}`);
      if(f === fs[0]) await readFold(t, `${t} · ${f}`);
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
  if(man){ await p.waitForTimeout(420); visited.push("a man's page"); await readScreen("a man's page"); await clearAll(p, 8); }

  await tab(p, "arena"); await p.waitForTimeout(260);
  if(await click(p, /choose a bout/i)){
    await p.waitForTimeout(320); visited.push("the arena wizard");
    await readScreen("the arena wizard");
    /* and the CHOOSER behind it, which is where the NaN was: pick each card in turn and read the
       list of your own men under it, because the sine warning is per man and per card */
    const cards = await p.evaluate(()=>[...document.querySelectorAll("button.optrow")].length);
    for(let i=0; i<Math.min(cards, 6); i++){
      const took = await p.evaluate(n=>{ const b=[...document.querySelectorAll("button.optrow")][n];
        if(b){ b.click(); return true; } return false; }, i);
      if(!took) break;
      await p.waitForTimeout(300);
      await readScreen(`the chooser, card ${i+1}`);
    }
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

  /* what the screen said, which is a separate question from whether it threw */
  const seen = new Set();
  const uniq = spoiled.filter(x=>{ const k = x.what + "|" + x.line; if(seen.has(k)) return false;
    seen.add(k); return true; });
  lines.push(uniq.length
    ? `THE SCREEN SAID: ${uniq.map(x=>`${x.what} on ${x.where} — "${x.line}"`).join(" | ")}`
    : `nothing on any face read NaN, undefined, [object Object] or Infinity`);
  for(const x of uniq)
    errors.push(`"${x.what}" is on the screen on ${x.where} — ${x.why}. The line reads: "${x.line}"`);

  /* the shape of every face: sections counted, nesting held, thin ones printed */
  const nested = [], thin = [];
  for(const f of shape) for(const r of f.rows){
    if(r.depth > 0) nested.push(`"${r.title}" inside a section on ${f.where}`);
    if(r.chars < 120 && r.buttons <= 1) thin.push(`${f.where}: "${r.title}" ${r.chars}c ${r.buttons}b`);
  }
  lines.push(`sections by face: ${shape.filter(f=>f.rows.length).map(f=>`${f.where} ${f.rows.length}`).join(" · ")}`);
  /* ---- AND THE ONE FACE WITH A MEASURED CEILING, from v3.4.0 ----
     The armory was a `Sect` per weapon FAMILY: seven of them for the weapon slot, each 24 to 37 lines,
     and all seven fitted on one screen closed (y=578 to 803) — so they cost CLICKS, not scroll, and
     comparing a sica to a gladius meant opening two boxes. It is one open list now, cheapest first, with
     the family on each row as a tag and a filter that says what it is hiding: over 343 house-weeks the
     yard holds a mean of 2.41 of six classes, and "in our styles" keeps 58% of the racks. */
  { const arm = shape.find(f=>f.where === "armory");
    if(arm){
      lines.push(`the armory carries ${arm.rows.length} section${arm.rows.length===1?"":"s"} `
        + `(${arm.rows.map(r=>r.title).join(", ")}) — it was seven, one per weapon family`);
      if(arm.rows.length > 2)
        errors.push(`the armory is back to ${arm.rows.length} sections (${arm.rows.map(r=>r.title).join(", ")}). `
          + `It was one per weapon family until v3.4.0 and all seven fitted on one screen closed, so the `
          + `seven headings were costing clicks rather than scroll — one flat list, cheapest first, with `
          + `the family as a tag on the row`);
    } }
  lines.push(foldMiss.length
    ? `ABOVE THE FOLD: ${foldMiss.map(x=>`${x.where} does not say ${x.what}`).join(" | ")}`
    : `every tab says what it is for in its first ${FOLD}px`);
  for(const x of foldMiss)
    errors.push(`${x.where} does not say ${x.what} above the fold at a phone width. The header already `
      + `carries the coin, the fame, the favour and the unrest on every tab — what a tab owes is the `
      + `answer to its own question, and the arena led with a bribery menu until v3.3.0`);
  lines.push(thin.length
    ? `thin sections (under 120 characters, one button or none) — printed, not asserted: ${thin.join(" | ")}`
    : `no section on any face is under 120 characters`);
  for(const n of nested)
    errors.push(`a section inside a section: ${n}. Two levels of disclosure puts a thing two clicks down `
      + `on a tab a player already scrolls — the six things a doctore is worth sat there until v3.1.0`);

  lines.push(errors.length ? `errors: ${errors.slice(0,4).join(" | ")}` : "errors: none");
  return { pass: errors.length === 0, why: errors.length ? `${errors.length} page errors` : null, lines };
}
