/* HOW MUCH READING MATTER IS ON EACH FACE — and it may only ever go down

   THIS CHECK EXISTS BECAUSE OF A MISTAKE MADE IN THE RELEASE THAT ADDED IT. v3.152.0's brief was
   to make the pages less text-dense. It put a picture at the top of the arena and a three-column
   ledger over the circuit's towns — how far, what it pays, what mercy costs — and called that an
   overhaul. Measured afterwards the arena had gone from **612 words to 642**, because every figure
   in the new ledger was still sitting in the paragraph underneath it. The ledger was not a
   replacement, it was a fourth place to read the same thing, and nothing anywhere could tell.

   A redesign that only ADDS is the easy failure mode of exactly the work the game is now doing, and
   it is invisible from inside the diff: the new panel looks like progress, the old prose is
   untouched so it never appears in the review, and the page silently gets longer. So the ceiling
   below is the same instrument `bulk` is for the source — a written number per place that ratchets
   ONE WAY. Lower it when a place genuinely sheds words. Raising one is allowed, but it costs a
   sentence in this file saying what arrived and why it could not be paid for by removing something.

   ---- AND IT WAS MEASURING FIVE OF NINE PLACES, which is the v3.153.0 correction ----

   The first cut walked the five TABS and read whatever face each happened to be showing. Three of
   those tabs have faces behind a chip row, and a tab remembers the face it was left on, so what it
   actually measured was five arbitrary places out of nine — and for the villa it was the LIGHTEST
   of its three. The House reads 308 words. **Standing read 456**, half again as much, and was the
   second-densest place in the game after the arena. The check reported the villa as comfortable
   every run while the page a player actually complained about was never once looked at.

   That is this project's most-repeated fault wearing a new hat — `surface` reporting nine record
   sheets it had never opened, `legible` scoring nineteen labels nothing had sampled, `sand` passing
   a broken beast that was never drawn. A measurement that quietly covers less than it claims reads
   exactly like a clean bill of health. So the table below is PLACES, not tabs: every face of every
   tab, named, pressed by name, and asserted to have landed before its number is believed.

   WHY WORDS AND NOT PIXELS. Pixels went UP on the arena in v3.152.0 and were right to, because a
   picture arrived. Height was never the complaint — "all pages can be pretty text dense" was, and
   words are what that names. A face that swaps five stacked panels for a ledger gets shorter here
   and may not get much shorter on screen; that is the trade this design makes on purpose. `scroll`
   holds the pixels.

   AND A FACE THAT READ NOTHING IS NOT A FACE THAT PASSED. innerText of a face that never mounted is
   "", which is under every ceiling here and would report as the cleanest page in the game. Every
   place has a FLOOR as well, the face is asserted to be the one asked for, and the run fails if
   fewer than all nine were read. */
import { found, endWeek, clearAll, tab } from "../harness.mjs";

export const name = "dense";
export const describe = "no face carries more reading matter than the last release left on it";
export const slow = true;   /* reads the rendered text of every face in a real browser */

/* `saw` is what THIS run reads today, so the drift column means something on a PASSING run — the
   lesson `scroll` paid for, where "2.2 measured" sat beside a page that had crept to 2.8 and every
   run passed in silence. `max` is set off the widest of four seeds twelve weeks apart (DENSE-1
   here, plus V-1/V-2/V-3), because a ceiling pinned to one seed's exact reading would go red on a
   roster one man longer. The four seeds' spread, for whoever moves these:

       ludus 142-146 · arena 567-569 · roster 105-128 · board 138-188 · armoury 161-182
       market 384-392 · villa/house 308-312 · villa/standing 368-379 · villa/council 178-181

   The two that move are the ones whose length is a fact about the SAVE — the roster and the
   doctore's board are one row per man. */
const PLACES = [
  { tab:"ludus",   face:null,                  max:160, min:60,  saw:142 },
  { tab:"arena",   face:null,                  max:590, min:250, saw:567 },
  { tab:"familia", face:"THE ROSTER",          max:150, min:50,  saw:105 },
  { tab:"familia", face:"THE DOCTORE'S BOARD", max:210, min:60,  saw:138 },
  { tab:"familia", face:"THE ARMOURY",         max:205, min:60,  saw:161 },
  /* 379 in v3.154.0, and the small number is the honest one: the market has no prose to cut. Its
     length is four man-cards, and what came out of them was two constants — "Not yet sworn", true
     of 3,524 of 3,524 men measured over 960 played weeks, and the price printed in a button four
     lines below the price. The block's panel says the sworn fact once now. */
  { tab:"market",  face:null,                  max:410, min:180, saw:379 },
  /* RATCHETED DOWN 330 -> 320 IN v3.153.0. `yard` found the plate had pushed the House face's
     first pressable thing to y=896 on an 844px phone, and the fix was to stop printing what the
     sticky header prints: Coin, Fame and Standing were on screen twice, 150px apart. "The name"
     went with them — it said the identical string as the note on The House As A Name five rows
     below. 296 now, and the work is back above the fold at 826. */
  { tab:"villa",   face:"THE HOUSE",           max:320, min:140, saw:296 },
  /* WAS 456 BEFORE v3.153.0, and unmeasured. The Temple's five gods each carried their own
     twenty-word boon and their own PAIR of full-width buttons; `vowStake` does not take a god, so
     "Vow · 154d" was one figure rendered five times. Five rows and one pair of controls: 373. */
  { tab:"villa",   face:"STANDING",            max:400, min:150, saw:373 },
  { tab:"villa",   face:"COIN & COUNCIL",      max:200, min:80,  saw:178 },
];

/* ---- THE NAMED GUARDS, because the ceiling above is NOT enough on its own ----
   That is a finding, not a hunch, and both arms were proved by putting the fault back. The whole
   v3.152.0 regression trips the ceiling (642 against 590). But restoring ONLY the town header's
   "1wk · purses ×1.20" put the arena at **579, which is under the ceiling and passes**: a
   duplication small enough to fit in the slack a stable ceiling needs is invisible to it, and
   three of those are a paragraph.

   So the specific things that came out are named here as well. The totals catch drift; these catch
   the exact thing coming back, and say which. */
const GONE = {
  /* the circuit's ledger prints both of these; the town paragraphs used to print them again */
  arena: [
    { find:"spared about", why:"the circuit ledger's Spared column already carries that figure" },
    { find:"purses ×",     why:"the circuit ledger's Purse column already carries that figure" },
  ],
};
/* and the altar's shape, which is a COUNT rather than a phrase: five gods, ONE pair of controls.
   Five "Vow · 154d" buttons were five renderings of one number, and a ceiling would not have felt
   the difference — they are only three words each. Proved by putting the five back: the face went
   to 383 words and PASSED, because 383 is under 400.

   AND THE FIRST VERSION OF THIS GUARD PASSED THE SABOTAGE TOO, which is the more useful half of
   that experiment. It matched `startsWith("Vow ·")` against `innerText`, and `.btn` uppercases in
   CSS — `innerText` returns the RENDERED text, so every button came back "VOW · 154D" and nothing
   ever matched. A guard that cannot fail reads exactly like a guard that found nothing wrong. The
   comparison is case-folded now, and the count is asserted to have SEEN the controls at all, so a
   renamed button fails loudly instead of quietly matching zero. */
const ONE_OF = [
  { face:"STANDING", starts:"Vow ·",   what:"vow", n:1,
    why:"`vowStake` does not take a god — the pledge is one figure, so it belongs under one control" },
  { face:"STANDING", starts:"Offer ·", what:"offering", n:1,
    why:"the offering acts on the row you are on; one per god is the stack the ledger replaced" },
];

export async function run({ p, errors }){
  await found(p, { seed:"DENSE-1" });
  for(let w=0; w<12; w++){ if(!(await endWeek(p))) break; await clearAll(p, 12); }
  await clearAll(p, 20);

  const lines = [], bad = [];
  /* the face chips are their own tablist, labelled "<Tab> sections". Pressed BY NAME, and the name
     is read back, because a tab remembers the face it was left on — arriving is not landing. */
  const press = async (name) => p.evaluate(n=>{
    const l = [...document.querySelectorAll('[role=tablist]')]
      .find(x => /sections\s*$/i.test(x.getAttribute("aria-label")||""));
    if(!l) return null;
    const b = [...l.querySelectorAll("button[role=tab]")]
      .find(x => (x.innerText||"").trim().toUpperCase().startsWith(n.toUpperCase()));
    if(!b) return null;
    b.click(); return true;
  }, name);
  const showing = () => p.evaluate(()=>{
    const l = [...document.querySelectorAll('[role=tablist]')]
      .find(x => /sections\s*$/i.test(x.getAttribute("aria-label")||""));
    if(!l) return null;
    const b = [...l.querySelectorAll("button[role=tab]")].find(x => x.getAttribute("aria-selected")==="true");
    return b ? (b.innerText||"").trim() : null;
  });
  const read = () => p.evaluate(()=>{
    const m = document.querySelector("main") || document.body;
    const t = (m.innerText || "").replace(/\s+/g, " ").trim();
    const btn = [...m.querySelectorAll("button")].map(b=>(b.innerText||"").trim()).filter(Boolean);
    return { words: t ? t.split(" ").length : 0, text: t, btn };
  });

  let read_ok = 0;
  for(const f of PLACES){
    const key = f.face ? `${f.tab}/${f.face.toLowerCase()}` : f.tab;
    /* twice: the first press opens the tab, `clearAll` answers whatever it raised, the second
       lands on it. A place measured with a teaching panel over it is not the place. */
    const got = await tab(p, f.tab);
    await p.waitForTimeout(380); await clearAll(p, 8);
    await tab(p, f.tab); await p.waitForTimeout(380);
    if(got === false){ bad.push(`the ${f.tab} tab could not be reached — ${key} measured nothing`); continue; }
    if(f.face){
      if(!await press(f.face)){
        bad.push(`the "${f.face}" face of the ${f.tab} tab is not there to press — ${key} measured nothing`);
        continue;
      }
      await p.waitForTimeout(420); await clearAll(p, 6);
      const at = await showing();
      if(!at || !at.toUpperCase().startsWith(f.face.toUpperCase())){
        bad.push(`asked for "${f.face}" on the ${f.tab} tab and it is showing "${at}" — a tab remembers`
          + ` the face it was left on, so this number would be another place's wearing ${key}'s name`);
        continue;
      }
    }
    const r = await read();
    read_ok++;
    const drift = r.words - f.saw;
    lines.push(`  ${key.padEnd(26)} ${String(r.words).padStart(4)} words  ceiling ${String(f.max).padStart(4)}`
      + `  ${drift === 0 ? "as measured" : (drift > 0 ? "+" : "") + drift + " since it was set"}`);

    if(r.words < f.min)
      bad.push(`${key} read ${r.words} words, under the ${f.min} that proves it rendered — this measured nothing`);
    else if(r.words > f.max)
      bad.push(`${key} is ${r.words} words against a ceiling of ${f.max}`
        + ` — ${drift} more than the last release left on it. If something new belongs there,`
        + ` something old has to go, or the ceiling needs raising in test/checks/dense.mjs with a reason`);

    for(const g of (GONE[f.tab] || []))
      if(r.text.includes(g.find))
        bad.push(`"${g.find}" is back on the ${f.tab} — ${g.why}, and printing it in the prose`
          + ` underneath is the duplication this check was written for`);

    for(const o of ONE_OF){
      if(o.face !== f.face) continue;
      const want = o.starts.toUpperCase();
      const n = r.btn.filter(b => b.toUpperCase().startsWith(want)).length;
      if(n > o.n)
        bad.push(`${key} carries ${n} "${o.starts}…" buttons where ${o.n} is allowed — ${o.why}`);
      /* ZERO IS NOT A PASS. If the control is renamed this guard silently matches nothing and the
         five could come back under the new name unopposed — which is how its first version behaved
         against the whole sabotage. It has to find the one it expects. */
      else if(n === 0)
        bad.push(`${key} has no "${o.starts}…" button at all, so the ${o.what} guard matched nothing`
          + ` — either the altar is not rendering or the control was renamed and this check went blind`);
    }
  }

  if(read_ok < PLACES.length)
    bad.push(`only ${read_ok} of ${PLACES.length} places were read — the rest of this run proves nothing`);
  lines.unshift(`the reading matter in each place, at seed DENSE-1, week 12:`);
  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`all ${PLACES.length} places are at or under what the last release left on them`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
