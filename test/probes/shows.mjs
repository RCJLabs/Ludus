/* WHAT EACH FACE ACTUALLY SHOWS — the inventory that should have existed before any UI proposal.

     node test/probes/shows.mjs

   WHY THIS EXISTS, written plainly because the reason is an error and not a plan.

   A brainstorm proposed two screens for this game: a weekly digest of what the week did, and a
   readable end-of-house record. Both were already built and had been for a long time — `Morning`
   ("THE WEEK THAT WAS", coin/fame/standing/unrest deltas, the week's lines) and the annals modal
   (every man, his fate, his record, his scars, whether he got what he wanted, whether a fire was
   burned for him), plus a chronicle viewer with filters, a search box and year grouping, plus a
   closing screen carrying served, bouts, win rate, buried, freed, walked out, killed, a named
   verdict, the best man, the best and worst style, the nemesis house and the worst year.

   The proposals were made on `grep 'function Annals'` returning nothing. It returns nothing because
   the reader is inline JSX inside App, not a named component. **In a 36,000-line single-file app,
   searching for a component name is not an instrument for "does this screen exist"** — and it
   produces a confident, specific, wrong answer rather than an error, which is the shape this
   project keeps getting caught by.

   So: the instrument. `faces.mjs` already walks every face of every tab and counts what renders;
   this walks the same ground and records WHAT IS IN each panel, so a question about the interface
   can be answered by reading a table instead of by guessing at a grep.

   IT NAMES ITS OWN BLIND SPOT, which is the part `faces.mjs` had to write in prose. The 33 authored
   <Sect> titles are read out of `src/ludus.jsx` and diffed against what actually rendered, so the
   run ends with the list of sections this house never reached. Those are the ones where "it does
   not exist" and "I did not get to it" look identical, and telling them apart is the whole job.

   ---- RECONCILED AGAINST `faces.mjs`, because two instruments disagreeing is how the last one
   was caught ----
   `faces.mjs` counts section OCCURRENCES and reports 28 across 14 faces; this counts DISTINCT
   titles and reports 24. Both are right and they meet exactly:

       24 distinct  =  18 authored in SECT  +  6 <Sect> blocks authored elsewhere
       33 authored  =  18 reached  +  15 never reached

   `faces.mjs`'s header says "nine of the 33 authored <Sect> blocks do not render", and then names
   seven reasons. The number is stale: fifteen do not render on this house at this week, and the
   arithmetic above closes on both sides. Its count of 28 is unaffected — only the prose. */
import { serve, open, found, tab, clearAll, forge, installRope } from "../harness.mjs";
import { readFileSync } from "node:fs";

/* ---- WHICH PLAYER THIS INVENTORIES, AND IT USED TO BE A PLAYER WHO DID NOTHING — #297 ----
   The loop below clicked "end week" and NOTHING ELSE. It never booked a bout, never bought a man,
   never took a single action, and the run it published as "the reference player" was that. Two
   consequences, and the second is why the first went unnoticed for eleven releases:

     · "15 of 33 sections never reached" was not a reading about CONTENT. It was a reading about a
       house that does nothing. Six of the fifteen — `rome`, `works`, `monuments`, `aedileship`,
       `rivals`, `owed` — are plainly things such a house cannot have.
     · A house that does nothing DIES AT WEEK 43. Measured, on this seed.

   And the probe could not tell you. Asked for 400 weeks it stopped at 43, walked the title screen
   that was left, found five face tabs and no sections at all, and printed **"32 of 33 never
   reached"** — a post-mortem published in the same words as a live reading. Zero rendered sections
   was the only tell, and nothing in the output said the house was over.

   TWO ARMS NOW, and the output names which one ran:

     rope   (default) a house played forward by `R.lanista` under the full option set — the same
            acting player `revolt.mjs` uses — planted through `forge` so the UI renders it.
     idle   the old behaviour, kept so the published figure can be reproduced and compared. It is
            NOT a reference player and this file will not call it one again.

   Guard below: an inventory that finds no section at all is a broken reading, not an empty game,
   and it exits non-zero rather than printing zeros in the language of a finding. */
const PLAY  = (process.env.SHOWS_PLAY || "rope").toLowerCase();
const WEEKS = +(process.env.SHOWS_WEEKS || (PLAY === "idle" ? 26 : 120));

/* the acting player, as `revolt.mjs` spells it */
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

/* the authored set, read from source: every `<Sect title=...>` under the SECT table */
const authored = (() => {
  const src = readFileSync(new URL("../../src/ludus.jsx", import.meta.url), "utf8").split("\n");
  const a = src.findIndex(l => /^const SECT = \{/.test(l));
  const out = [];
  let cur = null;
  for (let i = a; i < src.length && out.length < 60; i++) {
    if (/^const SECT_LIVE = \{/.test(src[i])) break;
    const k = src[i].match(/^  ([a-zA-Z][a-zA-Z0-9]*): *\(S/);
    if (k) cur = k[1];
    const t = src[i].match(/<Sect[^>]*title=\{?["`]([^"`]{0,48})/);
    if (t && cur) { out.push({ key: cur, title: t[1] }); cur = null; }
  }
  return out;
})();

const { server, port } = await serve({ page: "dist/test.html" });
const { browser, p, errors } = await open(port);
await found(p, { seed: "REACH-1" });

let played = null;          /* { week, ended } — what house the inventory below is of */
if (PLAY === "idle") {
  /* the old walk, kept and now INSTRUMENTED: it used to break out of this loop and say nothing */
  let w = 0, stopped = null;
  for (; w < WEEKS; w++) {
    const ok = await p.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find(x => /^end week/i.test((x.innerText || "").trim()));
      if (b) { b.click(); return true; } return false;
    });
    if (!ok) { stopped = w; break; }
    await p.waitForTimeout(160); await clearAll(p, 3);
  }
  played = { week: stopped == null ? WEEKS : stopped, ended: stopped != null,
    how: `idle — "end week" and no other action, ${WEEKS} asked` };
} else {
  /* `found()` RELOADS THE PAGE and the rope is installed per document, so it has to go back on
     before the builder runs — `stature` does the same, one line under its own `found`. Without it
     the builder throws "Cannot read properties of undefined (reading 'lanista')" at week 1 and
     `forge` plants a house one week old. The instrumentation above caught that on the first run:
     it printed the throw and the week rather than the 33-section inventory it would have been. */
  await installRope(p);
  /* ---- THE ROPE BUILDS THE HOUSE, THE UI RENDERS IT ----
     `R.lanista` plays a headless `d`; the React state is not reachable from outside, so the two
     are joined the way `stature` joins them — `forge` plants the state into every save slot and
     reloads. The step BEFORE the one that ends the house is what gets planted, so the inventory
     is always of a house that is still standing. */
  const built = await forge(p, (A, R, arg) => {
    const d = A.newGameState("Shows", "clean", "REACH-1", null);
    let before = null;
    for (let w = 0; w < arg.W; w++) {
      before = JSON.parse(JSON.stringify(d));
      try { R.lanista(d, arg.MOST); }
      catch (e) { return { plant: before, week: before.week, ended: true, threw: true,
        why: "the rope threw: " + String((e && e.message) || e) }; }
      if (d.over) return { plant: before, week: before.week, ended: true,
        why: String((d.over && (d.over.kind || d.over.how)) || d.over) };
    }
    return { plant: d, week: d.week, ended: false, why: null };
  }, { W: WEEKS, MOST });
  played = { week: built.week, ended: !!built.ended, why: built.why, threw: !!built.threw,
    how: `rope — R.lanista under the full option set, ${WEEKS} asked` };
  /* A THROW IS A BROKEN RUN, NOT A SHORT-LIVED HOUSE, and the difference matters because the
     inventory that follows would be perfectly well-formed and about the wrong house. */
  if (played.threw) {
    console.log(`\nNOT A READING — the builder threw at week ${played.week}: ${played.why}`);
    console.log(`The house planted is that many weeks old, so every count below would be about a`);
    console.log(`house this arm never meant to build. Fix the builder; do not read the numbers.\n`);
    await browser.close(); server.close();
    process.exit(1);
  }
}

/* the face switcher, not the tab bar — `faces.mjs` explains why this selector is the probe */
const PICK = `[...document.querySelectorAll('div[role=tablist]')].filter(d => !d.closest('.modalwrap') && !d.closest('.modal'))`;
const faces = () => p.evaluate(`${PICK}.flatMap(d=>[...d.querySelectorAll('button[role=tab]')]).map(b=>(b.innerText||"").trim())`);
const show = f => p.evaluate(l => {
  const b = [...document.querySelectorAll('div[role=tablist]')]
    .filter(d => !d.closest('.modalwrap') && !d.closest('.modal'))
    .flatMap(d => [...d.querySelectorAll('button[role=tab]')])
    .find(x => (x.innerText || "").trim() === l);
  if (b) b.click();
}, f);

/* WHAT IS IN A PANEL. Buttons are the thing that makes a section a place you DO something rather
   than a place you read; the rest is how much there is to read and how it is presented. */
const readPanels = sel => p.evaluate(s => [...document.querySelectorAll(s)].map(d => {
  const sum = d.querySelector("summary");
  const title = ((sum || {}).innerText || "").split("\n")[0].trim();
  const body = d.cloneNode(true);
  const bs = body.querySelector("summary"); if (bs) bs.remove();
  const text = (body.innerText || "").replace(/\s+/g, " ").trim();
  return {
    title,
    buttons: d.querySelectorAll("button").length - (sum ? 0 : 0),
    words: text ? text.split(" ").length : 0,
    tracks: d.querySelectorAll(".track").length,
    tags: d.querySelectorAll(".tag").length,
    rows: d.querySelectorAll(".rowname").length,
    svgs: d.querySelectorAll("svg").length,
    first: text.slice(0, 72),
  };
}), sel);

const SEEN = new Map();          /* title -> the richest reading of that panel */
const rows = [];
const note = (where, list) => {
  for (const s of list) {
    const prev = SEEN.get(s.title);
    if (!prev || s.words > prev.words) SEEN.set(s.title, { ...s, where });
  }
  rows.push({ where, n: list.length });
};

for (const t of ["ludus", "familia", "arena", "market", "villa"]) {
  await tab(p, t); await p.waitForTimeout(360); await clearAll(p, 6);
  await tab(p, t); await p.waitForTimeout(300);
  const fs = await faces();
  for (const f of (fs.length ? fs : [null])) {
    if (f) { await show(f); await p.waitForTimeout(320); }
    note(f ? `${t} · ${f}` : t, await readPanels("details.sect"));
  }
}

/* the gladiator's record is a face by every measure but the switcher's — see `faces.mjs` */
{
  await tab(p, "familia"); await p.waitForTimeout(300); await clearAll(p, 6);
  await tab(p, "familia"); await p.waitForTimeout(300);
  await show("THE ROSTER"); await p.waitForTimeout(320);
  const opened = await p.evaluate(() => {
    const b = [...document.querySelectorAll("button.panel")].find(x => x.offsetParent !== null);
    if (!b) return false; b.click(); return true;
  });
  if (!opened) console.log("  the man's record could not be opened — no roster card on this house");
  else {
    await p.waitForTimeout(360);
    const chips = await p.evaluate(() => [...document.querySelectorAll('.modalwrap [role=tablist] button[role=tab]')]
      .map(b => (b.innerText || "").trim()).filter(Boolean));
    for (const c of chips) {
      await p.evaluate(l => {
        const b = [...document.querySelectorAll('.modalwrap [role=tablist] button[role=tab]')]
          .find(x => (x.innerText || "").trim() === l);
        if (b) b.click();
      }, c);
      await p.waitForTimeout(260);
      note(`a man's record · ${c}`, await readPanels(".modalwrap details.sect"));
    }
  }
}

await browser.close(); server.close();

const pad = (s, n) => String(s).padEnd(n).slice(0, n);
console.log(`\nWHAT EACH FACE SHOWS  (pinned REACH-1)\n`);
console.log(`  the house it inventories: ${played.how}`);
console.log(`  reached week ${played.week}` + (played.ended
  ? ` and THE HOUSE ENDED THERE${played.why ? ` (${played.why})` : ""} — the reading below is of `
    + `the last week it was still standing`
  : ` and was still standing`));
console.log("");
for (const r of rows) console.log(`  ${pad(r.where, 30)} ${String(r.n).padStart(2)} sections`);

const all = [...SEEN.values()].sort((a, b) => b.words - a.words);
const occ = rows.reduce((a, r) => a + r.n, 0);

/* ---- NO SECTION AT ALL IS A BROKEN READING, NOT AN EMPTY GAME — #297 ----
   Asked for 400 weeks on the idle arm, this walked the title screen a dead house had left behind,
   found five face tabs with nothing in them, and reported "32 of 33 never reached". Every number
   below is (authored − reached), so a walk that reaches NOTHING reports everything as missing, in
   the same words it would use for a real finding. The only tell was a zero. */
if (!all.length) {
  console.log(`\n  NOT A READING — no section rendered on any of the ${rows.length} faces.`);
  console.log(`  A walk that reaches nothing reports every authored section as never reached, which`);
  console.log(`  reads as a finding about the game and is a fault in this probe's run.`);
  console.log(played.ended
    ? `  The house ended at week ${played.week}${played.why ? ` (${played.why})` : ""}, so this walked whatever was left.`
    : `  The house was still standing, so the face walk itself is broken — start there.`);
  console.log("");
  process.exit(1);   /* the browser and server are already closed above */
}
console.log(`\n  ${rows.length} faces · ${occ} section occurrences · ${all.length} distinct `
  + `· ${errors.length} page errors`);
console.log(`  (\`faces.mjs\` counts the occurrences; this counts the distinct. They should agree.)\n`);
console.log(`  ${pad("section", 30)} ${pad("where", 22)} btn  words  rows  mtr  tag  svg`);
for (const s of all) {
  console.log(`  ${pad(s.title, 30)} ${pad(s.where, 22)} `
    + `${String(s.buttons).padStart(3)} ${String(s.words).padStart(6)} `
    + `${String(s.rows).padStart(5)} ${String(s.tracks).padStart(4)} `
    + `${String(s.tags).padStart(4)} ${String(s.svgs).padStart(4)}`);
}

/* the file's own claim, at the SHEETS table: "Twelve of the game's thirty-three sections contain
   no <button> anywhere in their source". That is a claim about SOURCE and this is a reading of one
   rendered house, so they can differ honestly — but they should not differ wildly. */
const ro = all.filter(s => s.buttons === 0);
console.log(`\n  READ-ONLY HERE (no button rendered): ${ro.length} of ${all.length} reached`);
console.log(`    ${ro.map(s => s.title).join(" · ") || "(none)"}`);

/* ---- THE TITLES COME BACK UPPERCASED ----
   `<Sect>`'s summary is `text-transform:uppercase`, and `innerText` returns the TRANSFORMED text.
   The first cut of this compared them to the mixed-case source titles and reported "33 of 33 never
   reached" while `THE TEMPLE` sat in the table three lines above it. It was absurd enough to catch
   in a glance, which is the only reason it did not ship — a case fold that fails on nine of
   thirty-three rather than all of them would have read as a finding.

   Template-literal titles (`The ${ST.name...} rack`) are matched on their literal head. */
const norm = t => String(t).toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const seenTitles = [...SEEN.keys()].map(norm);

/* ---- MATCHING A TEMPLATE TITLE, WHICH THE FIRST CUT GOT BACKWARDS ----
   Two titles are template literals — `The ${ST.name.toLowerCase()}` and
   `The ${SLOT_NAME[slot].toLowerCase()} rack`. Matching on their literal HEAD means matching on
   "THE", which every second title in this game starts with, so both matched the first panel they
   met and vanished from the missed list by luck. Match on every literal fragment of four
   characters or more instead, and say so when a title has none — an unmatchable title is not a
   reached one and must not be counted as either. */
const frags = t => t.split(/\$\{[^}]*\}/).map(norm).filter(f => f.replace(/ /g, "").length >= 4);
const hit = a => {
  const fs = frags(a.title);
  if (!fs.length) return "indeterminate";
  return seenTitles.some(t => fs.every(f => t.includes(f))) ? "reached" : "missed";
};
const verdict = authored.map(a => ({ ...a, v: hit(a) }));
const missed = verdict.filter(a => a.v === "missed");
const vague  = verdict.filter(a => a.v === "indeterminate");

/* and the other direction: what rendered that the SECT table does not author. `faces.mjs` counts
   `details.sect` elements, and not every one of them comes from `SECT` — the gatekeeper's line and
   the moneylenders are rendered elsewhere. A section inventory that only walks the table would
   miss them, which is the same mistake in a different coat. */
const authoredNorm = authored.flatMap(a => frags(a.title));
const foreign = [...SEEN.values()].filter(s2 => {
  const t = norm(s2.title);
  return !verdict.some(a => a.v === "reached" && frags(a.title).every(f => t.includes(f)));
});

console.log(`\n  AUTHORED BUT NEVER REACHED ON THIS HOUSE: ${missed.length} of ${authored.length}`);
for (const m of missed) console.log(`    ${pad(m.key, 16)} "${m.title}"`);
if (vague.length) {
  console.log(`\n  UNMATCHABLE BY TITLE (a template with no literal to match on): ${vague.length}`);
  for (const m of vague) console.log(`    ${pad(m.key, 16)} "${m.title}"  — hand-check`);
}
if (foreign.length) {
  console.log(`\n  RENDERED BUT NOT IN THE SECT TABLE: ${foreign.length}`);
  for (const f of foreign) console.log(`    ${pad(f.title, 32)} ${f.where}`);
  console.log(`    (a <Sect> can be authored outside SECT; an inventory that walked only the`);
  console.log(`     table would have reported these as nonexistent.)`);
}
console.log(`\n  Those are the ones where "it does not exist" and "I did not get to it" look the`);
console.log(`  same. Nothing above them is evidence about a section in that list.\n`);
