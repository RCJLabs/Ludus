/* #126 — HOW FAR IS EVERY ACTION FROM THE THUMB?

   Five releases of UI work were argued from screen text, fold position and section counts, and not one
   of them measured what a player actually spends: TAPS. "The build UI is three taps down" was a line in
   an audit item, not a figure. Counted, it is wrong — building is on the ludus tab, whose deepest action
   is two taps — and the real cost turned out to be somewhere else entirely.

   DEPTH, defined the way a thumb experiences it:
     1  the tab itself
     +1 if the action sits behind a FACE chip (the villa's four faces, the familia's two)
     +1 for each <details class=sect> it sits inside that was CLOSED when the player arrived
   Scroll is deliberately NOT folded into that. A tap and a scroll are different costs, and lumping them
   is how "above the fold" got argued for three releases without either number being written down.

   MEASURED at week 16 of a founded house, about 43 live actions that change it:
     1 tap   23      2 taps  13      3 taps  7 (16%)      deeper than 3   NONE
   So "three taps down" is the FLOOR of the deep end rather than the norm, and the audit item's example
   was not even in it. The seven are all on the villa, behind a face chip AND a closed section:
     THE COLLEGIUM        found it
     THE HOUSEHOLD        three women to take on
     THROW A PARTY        send invitations
     WHAT YOU CAN DO...   set the tables · go down to the block   (opened by default from v3.11.0)
   which is the same set of systems the middle-game measurement found nothing pointing at — the party
   above all, whose lever moves the census ladder from rung 1.50 to 2.70 and sat three taps and two and a
   half screens from the tab bar.

   AND THE REAL COST IS SCROLL: about 79% of the things that change the house sit below the first 844
   pixels, the furthest past y=3,000 on the market — three and a half screens down.

   WHAT THIS HOLDS. Depth is structural, not sampled: given a state it is arithmetic on the DOM, so a bar
   on it needs no margin and gets none. Nothing may be deeper than three taps; the three-tap population
   may not grow; and every PLACE a player can arrive — a plain tab, or a face behind a chip — must offer
   something at the shallowest depth that place can offer, which is 1 on a tab and 2 on a face. The SCROLL
   is printed rather than barred, because the y of a button depends on how many men are in the yard and
   how many slavers are at the block, which is the RNG's business and not the layout's.

   THAT LAST BAR FOUND ONE THING AND WAS WRONG ONCE. Wrong first: it asked every TAB for a one-tap
   action, which the familia and the villa cannot give because their actions all sit behind a face chip
   by construction — the bar failed both for being built as designed. Restated per place, it caught
   `villa · The Cells`, whose only two actions — the feast and walking the cells — were both inside one
   folded section, so its shallowest action cost 3 where 2 was possible. Folding the only actionable
   panel on a face saves no scroll and costs a tap; it opens by default now.

   THREE PROBE FAULTS BEFORE ANY OF IT READ TRUE, kept because each is a way of measuring nothing:
     · the first arm advanced 60 weeks by pressing End Week and nothing else, which is `ends`'s `idle`
       policy — a house that does nothing dies of the ledger. It went bankrupt near week 55 and the probe
       reported seven actions, all one tap deep: FOUND A HOUSE HERE, RESTORE A HOUSE FROM A TRAIL.
     · reading every `button` counted the section SUMMARIES as actions — "The Lanista 45, hale",
       "Feats 0/19" — which are the COST of depth rather than things at the bottom of it.
     · and it counted the gatekeeper's teaching panel, which is an INLINE panel and not a `.modalwrap`,
       exactly as the note over the harness's `clearAll` says. */

import { found, endWeek, clearAll, tab, settle, ROOT } from "../harness.mjs";
import fs from "node:fs";
import path from "node:path";

export const name = "reach";
export const describe = "nothing a player does is more than three taps from the tab bar";
export const slow = true;   /* walks every face of every tab in a real browser */

const MAX_TAPS = 3, DEEP_CAP = 12, FOLD = 844;

/* a thing that CHANGES the house, as against a thing that shows you something. The record sheets and
   the per-man rows are openers and sit at the bottom of the ludus tab on purpose; counting them as
   buried actions overstated the scroll by about a third. */
const OPENER = /^(the lanista|the stands|the house|feats|what capua says|the annals|the record book|the chronicle|roll of the house|carry it out|copy the ledger|back to the records|the year ahead|what the marks mean)/i;
/* a man's row on the ludus tab opens his card; it is navigation, and it is one row per man, so left in
   it both inflates the count and makes it depend on the size of the yard */
const MANROW = /^[A-Z][a-z]+ (restless|watchful|compliant|content|sullen|hale|broken|willing|bitter|eager|calm|grim|steady)/;
const TEACH = /^(understood|i know my trade|i know the work|carry on|so be it|the doctore nods|next|go on|begin|done|got it|skip|think again|take me there)$/i;

export async function run({ p, errors }){
  const lines = [], fails = [];
  /* a FIXED house: the tally at the end of this check is meant to be diffed across builds, and a
     random roster moves every y in it (#: the first two rows read 38 actions then 40). */
  await found(p, { seed:"REACH-1" });
  for(let w=0; w<16; w++){ if(!(await endWeek(p))) break; await clearAll(p); }
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

  const read = (where, faceCost, teach) => p.evaluate(([where, faceCost, teach])=>{
    const TE = new RegExp(teach, "i");
    const out = [];
    const all = [...document.querySelectorAll("details.sect")];
    const depthOf = el => { let n = 0, x = el.parentElement;
      while(x){ if(x.tagName === "DETAILS") n++; x = x.parentElement; } return n; };
    const was = all.map(d=>d.open);
    /* ---- AND FIRST, THE STATE A PLAYER IS ACTUALLY IN ----
       Everything below this is read with every section FORCED OPEN, which is right for counting taps
       (a shut section hides its buttons) and right for diffing builds (it is deterministic). It is
       the wrong state for scrolling, and scrolling is the complaint. A player arrives with 6 of 32
       sections open; the other 26 are a 44px summary line, not a 649px panel. So the arrival
       geometry is captured BEFORE anything is opened, and the two are reported side by side. Quoting
       the open figure as though it were the lived one would inflate every pixel in this check. */
    const arrival = all.map(d=>{ const r = d.getBoundingClientRect();
      return { where, title: ((d.querySelector("summary")||{}).innerText||"").split("\n")[0].trim().slice(0,32),
        top: Math.round(r.top + window.scrollY), h: Math.round(r.height), open: d.open }; });
    const arrivalH = (()=>{ const sc = document.querySelector(".scroll > div");
      return sc ? Math.round(sc.getBoundingClientRect().height) : 0; })();
    /* shallowest first, or nested content is never laid out and its y cannot be read */
    all.slice().sort((a,b)=>depthOf(a)-depthOf(b)).forEach(d=>{ d.open = true; });
    const scroll = document.querySelector(".scroll > div");
    for(const b of [...(scroll||document).querySelectorAll("button.btn, button.optrow")]){
      if(b.getAttribute("role") === "tab") continue;
      if(b.closest(".modalwrap")) continue;
      if(b.closest("summary")) continue;
      const label = (b.innerText||"").replace(/\s+/g," ").trim();
      if(!label || TE.test(label)) continue;
      let closed = 0, x = b.parentElement;
      while(x){ if(x.tagName === "DETAILS"){ const i = all.indexOf(x); if(i < 0 || !was[i]) closed++; } x = x.parentElement; }
      const sect = b.closest("details.sect");
      const head = sect ? ((sect.querySelector("summary")||{}).innerText||"").split("\n")[0].trim() : "";
      out.push({ where, label: label.slice(0, 44), taps: 1 + faceCost + closed, group: head.slice(0, 32),
        y: Math.round(b.getBoundingClientRect().top + window.scrollY), disabled: b.disabled });
    }
    /* ---- AND THE GEOMETRY, WHICH IS WHAT A PLAYER ACTUALLY SCROLLS PAST ----
       Everything above measures where the ACTIONS are. The complaint this instrument was built for
       is scrolling to FIND things, and most of what a player scrolls past is not a button — it is a
       section of prose, a table, a picture of the yard. A 135-line panel costs the same scroll
       whether it carries a control or none at all, so a yardstick that sees only buttons cannot
       score a restructure that moves reading matter. The first prototype proved it: the training
       square moved two places up the ludus tab and the action-only reading was IDENTICAL, 2534
       before and after, because ludus carries 2 of the pinned house's 44 actions.
       Measured while every section is open, which is the same state the buttons are read in. */
    const sects = [];
    for(const d of all){
      const r = d.getBoundingClientRect();
      const head = ((d.querySelector("summary")||{}).innerText||"").split("\n")[0].trim();
      sects.push({ where, title: head.slice(0, 32),
        top: Math.round(r.top + window.scrollY), h: Math.round(r.height),
        openByDefault: was[all.indexOf(d)] });
    }
    const sc = document.querySelector(".scroll > div");
    const faceH = sc ? Math.round(sc.getBoundingClientRect().height) : 0;
    all.forEach((d,i)=>{ d.open = was[i]; });
    return { actions: out, sects, faceH, arrival, arrivalH };
  }, [where, faceCost, teach.source.replace(/^\^|\$$/g, "")]);

  const rows = [], sects = [], faceH = {}, arrivals = [], arrivalH = {};
  const take = (where, r) => { rows.push(...r.actions); sects.push(...r.sects); faceH[where] = r.faceH;
    arrivals.push(...r.arrival); arrivalH[where] = r.arrivalH; };
  for(const t of ["ludus","familia","arena","market","villa"]){
    await tab(p, t); await p.waitForTimeout(340); await clearAll(p, 8);
    await tab(p, t); await p.waitForTimeout(340);
    const fs = await faces();
    /* ---- AND NOTHING HERE IS A PIXEL UNTIL THE PAGE HAS STOPPED TURNING ----
       `.leaf` animates the wrapper for 420ms on every tab change and `tab()` changes it twice
       (home, then the door), so the 340ms above was not enough for a room with no faces: this
       check has been reading `ludus`'s arrival geometry off a ROTATING element, whose rect is the
       box of the rotated shape. A face-click bought the other four rooms another 340ms and hid
       it. See the note over `settle`. */
    if(!fs.length){ await settle(p); take(t, await read(t, 0, TEACH)); continue; }
    for(const f of fs){
      await showFace(f); await p.waitForTimeout(340); await settle(p);
      take(`${t} · ${f}`, await read(`${t} · ${f}`, 1, TEACH));
    }
  }

  /* each action once, at the SHALLOWEST place it can be reached */
  const best = new Map();
  for(const r of rows){
    const was = best.get(r.label.toLowerCase());
    if(!was || r.taps < was.taps || (r.taps === was.taps && r.y < was.y)) best.set(r.label.toLowerCase(), r);
  }
  const live = [...best.values()].filter(r=>!r.disabled);
  /* ---- AND OPENERS ARE TOLD BY WHERE THEY ARE, NOT ONLY BY WHAT THEY SAY ----
     OPENER is a hand-kept list of labels, so adding a twelfth tile to the records grid made it an
     ACTION: `Where Things Stand` landed in the tally as the deepest doer in the game at y=3,673 and
     the row reported furthest y +557 on a build that had only moved reading matter into a sheet.
     Every one of those tiles lives inside the records & annals section and every one opens a sheet,
     so the section is the test. The label list stays for the openers that sit elsewhere. */
  const RECORDS = /records & annals/i;
  const doers = live.filter(r=>!OPENER.test(r.label) && !MANROW.test(r.label) && !RECORDS.test(r.group||""));

  if(doers.length < 12){
    fails.push(`only ${doers.length} live actions found across the six tabs [measured 39 at week 16] — `
      + `the house is probably not alive: 60 weeks of pressing End Week and nothing else bankrupts it, `
      + `and this check then measures the title screen`);
    return { pass:false, why:fails[0], lines };
  }

  const hist = {};
  for(const r of doers) hist[r.taps] = (hist[r.taps]||0)+1;
  lines.push(`${live.length} live buttons · ${doers.length} change the house, ${live.length - doers.length} open a sheet`);
  lines.push(`taps: ${Object.keys(hist).sort().map(t=>`${t} tap${t==="1"?"":"s"} ${hist[t]}`).join(" · ")}`
    + `  [measured 18 / 14 / 7, and nothing deeper than ${MAX_TAPS}]`);

  const deep = doers.filter(r=>r.taps >= 3);
  { const g = {};
    for(const r of deep){ const k = `${r.where} :: ${r.group || "(no heading)"}`; (g[k] || (g[k] = [])).push(r); }
    lines.push(`three taps or more — ${deep.length} of ${doers.length} `
      + `(${Math.round(deep.length/doers.length*100)}%): `
      + Object.keys(g).sort().map(k=>`${k} ×${g[k].length}`).join(" | ")); }

  const tooDeep = doers.filter(r=>r.taps > MAX_TAPS);
  if(tooDeep.length)
    fails.push(`${tooDeep.length} action${tooDeep.length===1?"":"s"} sit more than ${MAX_TAPS} taps from the `
      + `tab bar: ${tooDeep.slice(0,4).map(r=>`"${r.label}" (${r.taps}, ${r.where})`).join(", ")}. Depth is `
      + `arithmetic on the DOM rather than a sample, so this bar needs no margin — a fourth level of `
      + `disclosure is a decision somebody made, not noise`);
  if(deep.length > DEEP_CAP)
    fails.push(`${deep.length} actions are three taps down, past the ${DEEP_CAP} allowed [measured 7] — `
      + `the three-tap population is meant to shrink, and it is where the middle game's four unpointed `
      + `systems already live`);

  /* ---- AND THE FIRST VERSION OF THIS BAR WAS IMPOSSIBLE TO PASS ----
     It asked that every TAB offer something at one tap. The familia and the villa carry face chips, so
     every action on them costs 2 by construction and the bar failed both for existing as designed. The
     claim that is actually worth holding is per FACE: you arrive somewhere, and something there is
     actionable without unfolding anything. That is `taps === 1 + faceCost`, which is 1 on a plain tab
     and 2 on a face — the shallowest thing that place can offer. */
  const byPlace = {};
  for(const r of doers){
    const faceCost = r.where.includes(" · ") ? 1 : 0;
    const v = byPlace[r.where] || (byPlace[r.where] = { n:0, min:9, maxY:0, floor:1 + faceCost });
    v.n++; v.min = Math.min(v.min, r.taps); v.maxY = Math.max(v.maxY, r.y); }
  lines.push(`by place: ${Object.entries(byPlace).map(([t,v])=>`${t} ${v.n} actions, shallowest ${v.min} of a possible ${v.floor}, furthest y=${v.maxY}`).join(" · ")}`);
  for(const [t,v] of Object.entries(byPlace))
    if(v.min > v.floor)
      fails.push(`nothing on ${t} can be done without opening a section — the shallowest action there is `
        + `${v.min} taps where ${v.floor} is what that place could offer. Somewhere a player arrives should `
        + `have something actionable on arrival, which is the fault v3.3.0 fixed on the arena and v3.1.0 `
        + `on the market`);

  /* the scroll: printed, because the y of a button depends on how many men are in the yard */
  const far = doers.filter(r=>r.y > FOLD).sort((a,b)=>b.y-a.y);
  lines.push(`AND THE SCROLL, printed not barred: ${far.length} of ${doers.length} `
    + `(${Math.round(far.length/doers.length*100)}%) sit below the first ${FOLD}px [measured 79%] — `
    + `furthest ${far.length ? `y=${far[0].y} "${far[0].label}" on ${far[0].where}` : "none"}`);
  if(far.length) lines.push(`   the five furthest: `
    + far.slice(0,5).map(r=>`y=${r.y} ${r.label} (${r.where})`).join(" | "));

  /* ---- THE YARDSTICK FOR THE NAVIGATION OVERHAUL ----
     Everything above is printed and most of it is not barred, which is right — the y of a button
     depends on how many men are in the yard, and a bar on that would fire on a good week. But a
     restructure of the tabs has to be scored against what it replaced, and "better" without a
     BEFORE is an opinion. #185 captured `open`'s signature before moving the crux default and that
     is the only reason the 55% could be quoted at all.
     So the same move `survive` made in #142 and the runner made in #179: write the numbers down,
     one row a build, and let ten releases of them answer a question that no single run can. The
     row is deliberately the SHAPE of the navigation and not its prose — counts, the tap histogram,
     the share below the fold, and the furthest y per place — so two builds diff cleanly.
     It records and does nothing else. No bar is set on it here; the three-tap ceiling above is the
     only bar this check enforces, and it is untouched. */
  /* ---- AND THE NUMBER THE REORDER ACTUALLY MOVES ----
     Phase C reorders the sections inside each face. "Better" needs to be a figure before the change,
     or it is taste with a version number on it — the training-square move was reverted for exactly
     that, when the pinned house said furthest y was 2534 before and 2534 after.
     What a reorder can move is this: the action-free panel a player scrolls THROUGH to reach the
     last action on a face. Reference prose above an action pushes that action down by its own
     height; the same prose below it costs nothing. So per face: how many pixels of section carrying
     no action sit above the furthest action, and which sections they are. That sum is the ceiling on
     what reordering that face can win, and it is measured, not guessed.
     Printed, not barred. It moves with the number of men in the yard like everything else here. */
  {
    const acts = {};
    for(const r of doers){ const k = `${r.where} :: ${r.group}`; acts[k] = (acts[k]||0) + 1; }
    const rows2 = [];
    for(const [face, v] of Object.entries(byPlace)){
      const mine = sects.filter(x => x.where === face).sort((a,b)=>a.top-b.top);
      const dead = mine.filter(x => !acts[`${face} :: ${x.title}`] && x.top < v.maxY);
      const px = dead.reduce((a,x)=>a+x.h, 0);
      const live = mine.filter(x => acts[`${face} :: ${x.title}`]);
      if(px > 0) rows2.push({ face, px, n: v.n, maxY: v.maxY, names: dead.sort((a,b)=>b.h-a.h), live });
    }
    rows2.sort((a,b)=>b.px-a.px);
    if(rows2.length){
      lines.push(`AND WHAT A REORDER COULD WIN — action-free panel sitting ABOVE the furthest action:`);
      for(const r of rows2.slice(0,6))
        lines.push(`   ${r.face.padEnd(24)} ${String(r.px).padStart(5)}px above y=${r.maxY} `
          + `(${r.n} actions) — dead: ${r.names.slice(0,3).map(x=>`${x.title} ${x.h}px`).join(", ")}`
          + `\n${" ".repeat(30)}live: ${r.live.map(x=>`${x.title} (${acts[`${r.face} :: ${x.title}`]})`).join(", ") || "none"}`);
      /* NOT SUMMED ACROSS FACES, and the first version of this line did sum them. The gatekeeper's
         lesson sits above the tab content on every face, so it appears in six of these rows — it is
         ONE panel counted six times, and adding the rows up produced a headline number that no
         player could ever scroll past. The worst single face is the figure that means something. */
      lines.push(`   the worst single face is ${rows2[0].face} at ${rows2[0].px}px. NOT summed: the `
        + `gatekeeper's lesson sits above every tab, so it is one panel appearing in ${rows2.filter(r=>r.names.some(x=>/gatekeeper/i.test(x.title))).length} rows here, not several`);
    }
    /* ---- AND THE SAME THING IN THE STATE A PLAYER ARRIVES IN ----
       All of the above is measured with every section open. On arrival most are shut, and a shut
       section is a summary line rather than a panel — so this is the number that says what a
       reorder is actually worth, and it is the smaller one. */
    {
      const byFace = {};
      for(const x of arrivals){ const f = byFace[x.where] || (byFace[x.where] = []); f.push(x); }
      const out2 = [];
      for(const [face, list] of Object.entries(byFace)){
        const v = byPlace[face]; if(!v) continue;
        const sorted = list.slice().sort((a,b)=>a.top-b.top);
        const lastLive = sorted.filter(x => acts[`${face} :: ${x.title}`]).pop();
        const cut = lastLive ? lastLive.top : 0;
        const dead = sorted.filter(x => !acts[`${face} :: ${x.title}`] && x.top < cut);
        out2.push({ face, px: dead.reduce((a,x)=>a+x.h,0), n: dead.length,
          openH: faceH[face] || 0, arriveH: arrivalH[face] || 0 });
      }
      out2.sort((a,b)=>b.px-a.px);
      lines.push(`AND THE SAME ON ARRIVAL, with sections in their default state — the number that counts:`);
      for(const r of out2.slice(0,6))
        lines.push(`   ${r.face.padEnd(24)} face is ${String(r.arriveH).padStart(5)}px on arrival vs `
          + `${String(r.openH).padStart(5)}px fully open · ${r.px}px of action-free section above the last action (${r.n})`);
      /* ---- AND WHERE THE ARRIVAL HEIGHT ACTUALLY COMES FROM ----
         If reordering shut sections wins almost nothing, the height is somewhere else, and guessing
         where would be the same mistake again. So: what share of each face is section at all, and
         what are the tallest things standing open before a player touches anything. */
      /* ---- THE SIX THAT STAND OPEN ----
         This turned out to be the whole of it. Reordering shut sections wins 0-754px a face; these
         six cost more than every reorder on every face put together, and a player has not asked for
         any of them. Listed with the height each one adds to the face it is on. */
      const openOnes = arrivals.filter(x=>x.open).sort((a,b)=>b.h-a.h);
      lines.push(`AND THE ${openOnes.length} THAT STAND OPEN BEFORE A PLAYER TOUCHES ANYTHING — `
        + `${openOnes.reduce((a,x)=>a+x.h,0)}px between them, against 0-754px for every reorder:`);
      for(const x of openOnes) lines.push(`   ${String(x.h).padStart(5)}px  ${x.title.padEnd(32)} ${x.where}`);
      lines.push(`AND WHAT THAT ARRIVAL HEIGHT IS MADE OF — section vs everything else:`);
      for(const [face, list] of Object.entries(byFace).sort((a,b)=>(arrivalH[b[0]]||0)-(arrivalH[a[0]]||0)).slice(0,6)){
        const tot = arrivalH[face] || 0;
        const sect = list.reduce((a,x)=>a+x.h, 0);
        const open = list.filter(x=>x.open).sort((a,b)=>b.h-a.h);
        lines.push(`   ${face.padEnd(24)} ${String(tot).padStart(5)}px = ${String(sect).padStart(5)}px of `
          + `${list.length} sections (${open.length} open) + ${String(tot-sect).padStart(5)}px that is not a section`
          + (open.length ? ` · open: ${open.slice(0,3).map(x=>`${x.title} ${x.h}px`).join(", ")}` : ""));
      }
    }
    {
    }
  }

  /* ---- WHAT A PLAYER SCROLLS PAST, PRINTED ---- */
  {
    const byFace = {};
    for(const x of sects){ const f = byFace[x.where] || (byFace[x.where] = { n:0, h:0, tall:null });
      f.n++; f.h += x.h; if(!f.tall || x.h > f.tall.h) f.tall = x; }
    const faces = Object.entries(byFace).sort((a,b)=>b[1].h - a[1].h);
    lines.push(`AND THE GEOMETRY — ${sects.length} sections across ${faces.length} faces, `
      + `${Math.round(Object.values(faceH).reduce((a,b)=>a+b,0)).toLocaleString()}px of face in all:`);
    for(const [f, v] of faces.slice(0, 6))
      lines.push(`   ${f.padEnd(28)} ${String(v.n).padStart(2)} sections · ${String(v.h).padStart(5)}px`
        + ` · tallest "${v.tall.title}" ${v.tall.h}px`);
    const tall = sects.slice().sort((a,b)=>b.h - a.h).slice(0, 5);
    lines.push(`   the five tallest anywhere: ` + tall.map(x=>`${x.title} ${x.h}px (${x.where})`).join(" | "));
    const openN = sects.filter(x=>x.openByDefault).length;
    lines.push(`   ${openN} of ${sects.length} sections stand OPEN before a player touches anything`);
  }

  try {
    const NAV = path.join(ROOT, "test", "nav-tally.json");
    const was = fs.existsSync(NAV) ? JSON.parse(fs.readFileSync(NAV, "utf8")) : [];
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;
    const places = {};
    for(const [t, x] of Object.entries(byPlace)) places[t] = { n:x.n, min:x.min, maxY:x.maxY };
    const geo = {};
    for(const x of sects){ const g = geo[x.where] || (geo[x.where] = { n:0, h:0 }); g.n++; g.h += x.h; }
    for(const k of Object.keys(geo)) geo[k].faceH = faceH[k] || 0;
    const row = { v, buttons: live.length, doers: doers.length,
      taps: hist, belowFold: far.length,
      foldPct: +(far.length/doers.length*100).toFixed(1),
      furthestY: far.length ? far[0].y : 0,
      sections: sects.length,
      sectionPx: sects.reduce((a,x)=>a+x.h, 0),
      openByDefault: sects.filter(x=>x.openByDefault).length,
      /* ---- AND THE ARRIVAL FIGURES, BECAUSE THE ROW COULD NOT SEE PHASE E ----
         Every number above is measured with the sections forced open, so folding a panel by default
         moves NONE of them: the first phase E change took villa/Standing from 2,151px to 1,546px on
         arrival and this row read "same" across the board. A yardstick that cannot score the change
         being made is not a yardstick for it. */
      arrivePx: Object.values(arrivalH).reduce((a,b)=>a+b,0),
      openSects: arrivals.filter(x=>x.open).length,
      openPx: arrivals.filter(x=>x.open).reduce((a,x)=>a+x.h,0),
      places, geo };
    const all = [...was, row];
    fs.writeFileSync(NAV, JSON.stringify(all, null, 0).replace(/\},\{"v"/g, "},\n{\"v\"") + "\n");
    if(all.length > 1){
      const prev = all[all.length - 2];
      const d = (a, b) => { const n = b - a; return n === 0 ? "same" : (n > 0 ? `+${n}` : `${n}`); };
      lines.push(`the nav tally, ${all.length} builds: against ${prev.v} — `
        + `actions ${d(prev.doers, row.doers)} · below the fold ${d(prev.belowFold, row.belowFold)} `
        + `(${prev.foldPct}% → ${row.foldPct}%) · furthest y ${d(prev.furthestY, row.furthestY)}`
        + ` · sections ${d(prev.sections||0, row.sections)} · section px ${d(prev.sectionPx||0, row.sectionPx)}`
        + `\n      and on arrival: ${row.arrivePx}px of face ${d(prev.arrivePx||0, row.arrivePx)} · `
        + `${row.openSects} sections standing open ${d(prev.openSects||0, row.openSects)} · `
        + `${row.openPx}px of them ${d(prev.openPx||0, row.openPx)}`);
    } else lines.push(`the nav tally starts here: ${row.doers} actions, ${row.foldPct}% below the fold, furthest y=${row.furthestY}`);
  } catch(e){ lines.push(`could not write the nav tally: ${e.message}`); }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
