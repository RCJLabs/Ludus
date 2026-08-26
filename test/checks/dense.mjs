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
   below is the same instrument `bulk` is for the source — a written number per face that ratchets
   ONE WAY. Lower it when a face genuinely sheds words. Raising one is allowed, but it costs a
   sentence in this file saying what arrived and why it could not be paid for by removing something.

   WHY WORDS AND NOT PIXELS. Pixels went UP in v3.152.0 and were right to: 2,214 to 2,386 on the
   arena, because a picture arrived. Height was never the complaint — "all pages can be pretty text
   dense" was, and words are what that names. A face that swaps a paragraph for a table gets shorter
   here and taller on screen, which is the trade this design makes on purpose.

   WHAT MAKES IT STABLE ENOUGH TO BE A GATE. Three seeds twelve weeks apart were measured before the
   numbers were set: the ludus and the villa came back identical on all three, the arena moved by
   nothing, the market by 8 and the familia by 15 — the two that carry a roster and a stock list.
   The ceilings carry that spread plus a little, and no more, because a ceiling with 20% of slack in
   it would not have caught the 30-word regression this check is named for.

   AND A FACE THAT READ NOTHING IS NOT A FACE THAT PASSED. innerText of a tab that never mounted is
   "", which is under every ceiling here and would report as the cleanest page in the game. Every
   face has a FLOOR as well, and the run fails if a tab could not be reached at all. */
import { found, endWeek, clearAll, tab } from "../harness.mjs";

export const name = "dense";
export const describe = "no face carries more reading matter than the last release left on it";
export const slow = true;   /* reads the rendered text of every face in a real browser */

/* `saw` is what THIS run reads today, so the drift column means something. `max` is set off the
   widest of four seeds — DENSE-1 here plus the three the note above describes — because a ceiling
   pinned to one seed's exact reading would go red on a roster one man longer. */
const FACES = [
  { key:"ludus",   max:160, min:60,  saw:142 },
  { key:"arena",   max:590, min:250, saw:567 },
  { key:"familia", max:150, min:50,  saw:105 },
  { key:"market",  max:410, min:180, saw:384 },
  { key:"villa",   max:330, min:140, saw:306 },
];

/* THE ONE PLACE THE REGRESSION SHOWED, and the ceiling above is NOT enough on its own — that is
   the finding, not a hunch. Both arms were proved by putting the fault back. The whole regression
   trips the ceiling (642 against 590). But restoring only the town header's "1wk · purses ×1.20"
   put the arena at **579, which is under the ceiling and passes**: a duplication small enough to
   fit in the slack a stable ceiling needs is invisible to it, and three of those are a paragraph.

   So the two phrases the circuit's paragraphs used to print — both drawn from the same `bayWorth`
   the ledger's columns are drawn from — are named here as well. The totals catch drift; this
   catches the specific thing coming back, and says which. */
const GONE = ["spared about", "purses ×"];

export async function run({ p, errors }){
  await found(p, { seed:"DENSE-1" });
  for(let w=0; w<12; w++){ if(!(await endWeek(p))) break; await clearAll(p, 12); }
  await clearAll(p, 20);

  const lines = [], bad = [];
  const read = async () => p.evaluate(()=>{
    const m = document.querySelector("main") || document.body;
    const t = (m.innerText || "").replace(/\s+/g, " ").trim();
    return { words: t ? t.split(" ").length : 0, text: t };
  });

  let over = 0;
  for(const f of FACES){
    /* twice: the first press opens the face, `clearAll` answers whatever it raised, the second
       lands on the face itself. A face measured with a teaching panel over it is not the face. */
    const got = await tab(p, f.key);
    await p.waitForTimeout(380); await clearAll(p, 8);
    await tab(p, f.key); await p.waitForTimeout(380);
    if(got === false){ bad.push(`the ${f.key} tab could not be reached — nothing here was measured`); continue; }
    const r = await read();
    const at = await p.evaluate(()=>{ const sh = document.querySelector("[data-place]");
      return sh ? sh.getAttribute("data-place") : null; });
    const drift = r.words - f.saw;
    lines.push(`  ${f.key.padEnd(8)} ${String(r.words).padStart(4)} words  ceiling ${String(f.max).padStart(4)}`
      + `  ${drift === 0 ? "as measured" : (drift > 0 ? "+" : "") + drift + " since it was set"}`);

    if(r.words < f.min)
      bad.push(`the ${f.key} face read ${r.words} words, under the ${f.min} that proves it rendered`
        + ` — this measured nothing${at ? ` (the shell says place "${at}")` : ""}`);
    else if(r.words > f.max){
      over++;
      bad.push(`the ${f.key} face is ${r.words} words against a ceiling of ${f.max}`
        + ` — ${r.words - f.saw} more than the last release left on it. If something new belongs there,`
        + ` something old has to go, or the ceiling needs raising in test/checks/dense.mjs with a reason`);
    }
    if(f.key === "arena") for(const g of GONE)
      if(r.text.includes(g))
        bad.push(`"${g}" is back on the arena — the circuit ledger already carries that figure,`
          + ` and printing it in the prose underneath is the duplication this check was written for`);
  }

  if(lines.length < FACES.length)
    bad.push(`only ${lines.length} of ${FACES.length} faces were read — the rest of this run proves nothing`);
  lines.unshift(`the reading matter on each face, at seed DENSE-1, week 12:`);
  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length && !over) lines.push(`every face is at or under what the last release left on it`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
