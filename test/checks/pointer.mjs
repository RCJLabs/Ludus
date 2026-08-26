/* A SENTENCE THAT TELLS YOU WHERE TO GO IS A CLAIM, AND CLAIMS GET CHECKED

   The market's staff panel has now been wrong TWICE, in opposite directions, and both times it was
   found by accident.

   v3.1.0 shipped it saying *"build either on the villa's House page"*. The wings were not there —
   they were behind Records & Annals on the LUDUS tab, three taps away and not where anybody was
   sent. v3.3.0's fold probe happened to walk past it and the sentence was corrected to name the
   Ludus tab. Correct, for a hundred and forty-eight releases.

   Then **v3.151.0 moved the shelf.** The whole of Records & Annals went to the villa's House face,
   because what the house knows about itself is the villa's business. That release measured the
   move, updated `surface`'s route to it, wrote the ROADMAP entry — and left this sentence pointing
   at the tab the shelf had just left. It stayed wrong through v3.152.0 and v3.153.0. A hundred and
   fourteen checks ran on every one of those releases and not one of them was looking, because
   nothing in this project had ever asked whether a piece of copy that sends a player somewhere
   names the place the thing is at.

   That is a whole CLASS of fault and it is invisible to every instrument here: `dense` counts the
   words in the sentence, `surface` measures its type size, `legible` its contrast, `reach` how many
   taps to it. All of them pass on a sentence that is beautifully set, perfectly legible, correctly
   sized — and a lie. Copy rots when the thing it points at moves, and the release that moves the
   thing is exactly the release that will not think to grep for sentences about it.

   WHAT THIS CHECKS, and the third arm is the one that makes it worth having:

   1. the copy is THERE. A pointer that has been reworded is not a pointer that passed — if the
      phrase cannot be found the check fails rather than quietly asserting nothing about nothing.
      Every vacuity fault this project has hit was a measurement that covered less than it claimed.
   2. the place it names HOLDS the thing. Go to that tab, look for that section, find it.
   3. **and nowhere else does.** This is what catches a MOVE. If the shelf is on the villa and the
      copy says Ludus, arms 1 and 2 already fail — but if a section is duplicated onto two tabs, or
      moved to a third that the copy also does not name, only a sweep of every tab can say so. It
      is also what makes the failure message useful: it names where the thing actually went. */
import { found, clearAll, tab } from "../harness.mjs";

export const name = "pointer";
export const describe = "copy that sends a player somewhere names the place the thing is at";
export const slow = true;   /* walks every tab in a real browser looking for the destination */

/* `say` is matched against the rendered text of `on`; `holds` against SECTION TITLES on `at`.
   Both are needed: the phrase alone would pass if the sentence were right and the shelf gone, and
   the section alone would pass if the shelf were right and the sentence stale — which is the exact
   fault this file is named for. */
const POINTERS = [
  {
    what: "the market's staff panel, on where the infirmary and the armoury are raised",
    on:   "market",
    say:  /Raise either in the (\w+)\s*tab/i,
    at:   "villa",
    holds:/records\s*&\s*annals/i,
  },
  /* ---- A SECOND POINTER, AND A DIFFERENT KIND OF DESTINATION, ADDED IN v3.155.0 ----
     The doctore's board, with no doctore, says "Hire one from the Ludus". It is RIGHT — `openDoc`
     tags that sheet `tab:"ludus"` and it opens off the training square in the drawing. Which is
     exactly why it is worth pinning: a check with one entry guards a string, and a check with two
     guards the class. This one is the sentence that is currently true, so what it protects against
     is the day the square moves and nobody greps.

     It also made the check honest about what a DESTINATION is. The first version looked only for
     section titles, and the training square is not a section — it is a hotspot in the drawn ludus
     that opens a document. A tab holds what a player can get to from it, so `.scn` labels count
     too, and a pointer says which kind it means. */
  {
    what: "the doctore's board, on where a doctore is hired",
    on:   "familia",
    face: "THE DOCTORE'S BOARD",
    say:  /Hire one from the (\w+)/i,
    at:   "ludus",
    holds:/training square/i,
    kind: "scene",
  },
];

/* which tabs exist to be named, so a sentence naming a place that is not a tab fails too */
const TABS = ["ludus", "familia", "arena", "market", "villa"];
/* what the copy calls a tab, against what `tab()` calls it. The familia's chip reads FAMILIA and
   the harness key is "familia"; the roster face lives behind it. Kept explicit rather than
   lowercased, because "the Villa tab's House face" is prose and prose is not an identifier. */
const SPOKEN = { ludus:"ludus", familia:"familia", men:"familia", arena:"arena", market:"market", villa:"villa" };

export async function run({ p, errors }){
  await found(p);
  await clearAll(p, 20);

  const lines = [], bad = [];

  /* every section title on the tab we are standing on, faces included */
  const titles = async () => p.evaluate(()=>{
    const out = [];
    for(const s of document.querySelectorAll("details.sect > summary, details.sect summary"))
      out.push((s.innerText||"").replace(/\s+/g," ").trim());
    return out;
  });
  /* AND WHAT THE DRAWING ON THIS TAB OPENS. A tab holds what a player can reach from it, and the
     ludus tab holds nothing BUT this — zero sections, and the training square, the cells, the
     shrine and the rest are hotspots that open documents. A check that only knew about sections
     would say the ludus tab holds nothing and be wrong about every sentence pointing at it. */
  /* NOT THE ONES INSIDE A PLATE. From v3.152.0 each page opens on a cropped copy of the SAME
     drawing, so `.scn` matches eleven hotspots on every tab that has a picture — and the first run
     of this arm duly reported the training square as living on all five. A plate is a picture: its
     svg is `aria-hidden`, it takes no pointer events, and nothing in it opens anything. A tab holds
     what a player can REACH from it, so the decorative copy is excluded by where it sits. */
  const hotspots = () => p.evaluate(()=>
    [...document.querySelectorAll(".scn")].filter(x=>!x.closest(".plate"))
      .map(x=>(x.getAttribute("aria-label")||"").trim()).filter(Boolean));
  const faces = () => p.evaluate(()=>{
    const l = [...document.querySelectorAll('[role=tablist]')]
      .find(x => /sections\s*$/i.test(x.getAttribute("aria-label")||""));
    return l ? [...l.querySelectorAll("button[role=tab]")].map(b=>(b.innerText||"").trim()) : [];
  });
  const press = (n) => p.evaluate(nm=>{
    const l = [...document.querySelectorAll('[role=tablist]')]
      .find(x => /sections\s*$/i.test(x.getAttribute("aria-label")||""));
    if(!l) return false;
    const b = [...l.querySelectorAll("button[role=tab]")]
      .find(x => (x.innerText||"").trim().toUpperCase().startsWith(nm.toUpperCase()));
    if(!b) return false; b.click(); return true;
  }, n);

  /* ---- WHERE EVERY SECTION ACTUALLY IS, swept once, before any claim is judged ---- */
  const where = {};   /* tab -> [section titles across all its faces] */
  const scene = {};   /* tab -> [what its drawing opens] */
  for(const t of TABS){
    if(!await tab(p, t)){ bad.push(`could not reach the ${t} tab — this sweep is incomplete`); continue; }
    await p.waitForTimeout(360); await clearAll(p, 8);
    await tab(p, t); await p.waitForTimeout(360);
    const fs = await faces();
    const all = [], scn = await hotspots();
    if(!fs.length) all.push(...await titles());
    else for(const f of fs){
      if(!await press(f)) continue;
      await p.waitForTimeout(380); await clearAll(p, 6);
      all.push(...await titles());
    }
    where[t] = all; scene[t] = scn;
  }
  const swept = Object.keys(where).length;
  lines.push(`swept ${swept} tabs: `
    + TABS.map(t=>`${t} ${(where[t]||[]).length} sections${(scene[t]||[]).length?` + ${scene[t].length} in the drawing`:""}`).join(" · "));
  if(swept < TABS.length)
    bad.push(`only ${swept} of ${TABS.length} tabs were swept — "nowhere else holds it" proves nothing`);
  /* A TAB WITH NO SECTIONS IS USUALLY A TAB THAT WAS NOT READ, and `where` full of empty arrays
     would make every "nowhere else" arm pass for the same reason a blank page passes a word
     ceiling. But the first version of this guard failed every run on a TRUE reading: the ludus tab
     has zero sections and is supposed to — it is the drawn scene and two panels, and the twelve
     tiles it used to carry went to the villa in v3.151.0. Measured: sect 0, details 0, panels 2.
     So a bare tab is REPORTED rather than failed, and the vacuity guard is put where the claim
     actually rests — nothing read anywhere, or nothing read on the tab a pointer names. */
  const held = t => [...(where[t]||[]), ...(scene[t]||[])];
  const bare = TABS.filter(t => held(t).length === 0);
  if(bare.length) lines.push(`  no sections at all on: ${bare.join(", ")} — nothing there can hold anything`);
  if(TABS.every(t => held(t).length === 0))
    bad.push(`ZERO section titles on every tab — nothing was read anywhere, so "nowhere else holds it"`
      + ` is being asserted about nothing`);

  for(const P of POINTERS){
    /* 1 — the copy is there, and says which place */
    if(!await tab(p, P.on)){ bad.push(`could not reach the ${P.on} tab to read ${P.what}`); continue; }
    await p.waitForTimeout(360); await clearAll(p, 8);
    await tab(p, P.on); await p.waitForTimeout(360);
    /* THE SENTENCE MAY BE ON A FACE. `dense` learned this the hard way in v3.153.0 — a tab with a
       chip row shows whichever face it was left on, so reading a tab is not reading its pages. The
       doctore's board is one of the familia's three and the copy lives only there. */
    if(P.face){
      if(!await press(P.face)){
        bad.push(`${P.what}: the "${P.face}" face of the ${P.on} tab is not there to press, so the`
          + ` sentence could not be read at all`);
        continue;
      }
      await p.waitForTimeout(420); await clearAll(p, 6);
    }
    const text = await p.evaluate(()=>((document.querySelector("main")||document.body).innerText||"")
      .replace(/\s+/g," ").trim());
    const m = text.match(P.say);
    if(!m){
      bad.push(`${P.what}: the sentence matching ${P.say} is not on the ${P.on} tab at all.`
        + ` It was either reworded or is gated behind a state this check does not reach — either way`
        + ` nothing here is being checked, which is worse than a wrong pointer`);
      continue;
    }
    const named = (m[1]||"").toLowerCase();
    const key = SPOKEN[named];
    lines.push(`  ${P.on} says "${m[0]}" — it names the ${named} tab`);
    if(!key){
      bad.push(`${P.what} sends a player to the "${named}" tab and there is no such tab`);
      continue;
    }

    /* 2 and 3 — who actually holds it.
       THE ORDER OF THESE ARMS IS THE MESSAGE. The first cut tested "was anything read on the tab
       the copy names?" BEFORE asking where the section actually is, and against the real stale
       pointer it failed with "names the ludus tab and NOTHING was read there" — true, since the
       ludus has no sections, and useless, because the thing a reader needs is *the shelf is on the
       villa*. A check that fails for a true-but-secondary reason costs the same run and teaches
       less. Where-it-is is computed first now, and the vacuity arm only speaks when nothing was
       found anywhere, which is the one case where it IS the finding. */
    const look = P.kind === "scene" ? (t => scene[t]||[]) : (t => where[t]||[]);
    const holders = TABS.filter(t => look(t).some(x => P.holds.test(x)));
    lines.push(`  ${P.holds} is on: ${holders.length ? holders.join(", ") : "NO TAB AT ALL"}`);
    if(!holders.length){
      bad.push(`${P.what}: nothing matching ${P.holds} was found on ANY tab, so the sentence points`
        + ` at something that is not there — or this check has stopped being able to see it`
        + (bare.length ? ` (and ${bare.join(", ")} read no sections at all, so it may be the sweep)` : ""));
      continue;
    }
    if(!holders.includes(key))
      bad.push(`${P.what} sends a player to the ${named} tab, and ${P.holds} is on `
        + `${holders.join(" and ")} instead. The copy went stale when the section moved`);
    else if(holders.length > 1)
      bad.push(`${P.holds} is on ${holders.join(" and ")} — the sentence can only name one of them,`
        + ` so a player following it finds the thing on some runs and not others`);
    else if(key !== P.at)
      bad.push(`${P.what} names the ${named} tab and the section is there, but this check expected`
        + ` ${P.at} — one of the two is out of date and it is worth knowing which`);
  }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`every pointer names the tab that holds what it points at`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
