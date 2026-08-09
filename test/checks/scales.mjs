/* EVERY WORD-SCALE IN THE GAME, AGAINST THE RANGE ITS QUANTITY ACTUALLY TAKES.

   This exists because the same fault has now shipped three times. #79: fame ran past the last
   thing that read it. #85: the street finished loving you by year eight and had nothing left to
   say. And v2.71.0: `menace`, the one opponent reading a player is given without paying, had a
   top band beginning at mean 66 while the game's men run to 99 — one word covering a quoted
   chance of 96% down to 13%, which is every hard decision in the game. Three of a shape is a
   pattern, so this sweeps all seventeen of them at once rather than waiting for the fourth.

   THE TEST is mechanical and it cuts both ways: a band can be too WIDE, swallowing the range
   where the decisions are, or it can be unreachable, in which case the word is never said at all.
   Sampled over real play, both showed up.

   WHAT IT FOUND. `formWord` — the four weeks between a man's last bout and his next — had bands
   at 58 and 24, and `formWeek` decays every man every week by `f*0.78 - 3`. The biggest thing
   that moves it is +24 for a win at the great games. So three straight wins, which is the example
   the lesson about form gives in those words, comes to 15.7 then 28.0 then **37.6** — a band short
   of "in form" at 58, whose only road is a win EVERY week (fixed point 71.5) and fatigue, the card
   and the infirmary see to that. Measured over **4,862 man-weeks**: form ran from **-50.5 to
   +42.4**, "in form" said **0 times**, "shaken" **0 times**, "level" **97%** of all man-weeks.
   The bands are 34 and 14 now, where the quantity lives.

   AND WHAT IT DID NOT FIND, which took as long. `houseWord`'s top two bands were unseen in 2,310
   samples, maximum warmth 43.4 — but warmth rises 1.1 per MEETING with a house whose grudge is
   under 30, plus 6 to 16 from the rival-relationship beats whose `need` gates my six houses had
   not met in 160 weeks. Not reached in that sample is not unreachable, and it is not claimed.
   `pietyWord` sat at 30 for every one of 960 weeks — because the probe never once made an
   offering, which is the temple's own finding (#91) and not a fault in the scale. `cityFavWord`
   took no samples at all: nothing ever toured the coast. And `fanWord` and `wearWord` concentrate
   most of their mass in one word because most men are unknown and most steel is serviceable,
   which is the game being steady rather than the word being wrong. A mass share is not evidence
   on its own, which is why this check asserts on REACHABILITY and on the share of the RANGE, and
   only reports the mass. */

import { hasHandle } from "../harness.mjs";

export const name = "scales";
export const describe = "every word a player reads can be said, and none covers the whole range";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], note = [];

    /* the scales, each with the fn that words it and the range its quantity can take. The
       ranges are the CLAMPS in the source, not guesses: a scale is asked to word its own
       full range, and every one of its words must come out. */
    const SCALES = [
      { id:"formWord",    fn:A.formWord,    lo:-100, hi:100, what:"a man's last four weeks" },
      { id:"wearWord",    fn:A.wearWord,    lo:0, hi:100, what:"a bought piece's condition" },
      { id:"houseWord",   fn:A.houseWord,   lo:0, hi:100, what:"how a rival house feels" },
      { id:"acclaimWord", fn:A.acclaimWord, lo:0, hi:100, what:"your name in the street" },
      { id:"patronWord",  fn:A.patronWord,  lo:0, hi:100, what:"what a patron thinks" },
      { id:"strainWord",  fn:A.strainWord,  lo:0, hi:100, what:"a man's deep tiredness" },
      { id:"favWord",     fn:A.favWord,     lo:0, hi:100, what:"whether Capua loves him" },
      { id:"fanWord",     fn:A.fanWord,     lo:0, hi:100, what:"his own following" },
      { id:"demeanor",    fn:A.demeanor,    lo:0, hi:100, what:"how defiant a man is" },
      { id:"unrestWord",  fn:A.unrestWord,  lo:0, hi:100, what:"the fire in the cells" },
      { id:"grudgeWord",  fn:A.grudgeWord,  lo:0, hi:100, what:"a rival's anger" },
      { id:"pietyWord",   fn:A.pietyWord,   lo:0, hi:100, what:"what the priests think" },
      { id:"healthWord",  fn:A.healthWord,  lo:0, hi:100, what:"the man in the chair" },
      { id:"regardWord",  fn:A.regardWord,  lo:0, hi:100, what:"what a man makes of you" },
      { id:"facWord",     fn:A.facWord,     lo:0, hi:100, what:"a faction in the stands" },
      { id:"bandWord",    fn:A.bandWord,    lo:0, hi:100, what:"a stat, in words" },
      { id:"cityFavWord", fn:A.cityFavWord, lo:0, hi:100, what:"a town down the coast" },
    ];

    /* ---- 1. EVERY WORD MUST BE SAYABLE, AND NONE MAY SWALLOW THE RANGE ---- */
    const rows = [];
    for(const sc of SCALES){
      if(typeof sc.fn !== "function"){ bad.push(`${sc.id} is not on the handle`); continue; }
      const runs = [];                       /* one entry per contiguous band, in order */
      const step = (sc.hi - sc.lo) / 400;
      let last = null;
      for(let v = sc.lo; v <= sc.hi + 1e-9; v += step){
        let w = null; try { w = sc.fn(v); } catch(e){ w = "*threw*"; }
        if(w !== (last && last.word)){ last = { word:w, lo:v, hi:v }; runs.push(last); }
        else last.hi = v;
      }
      const widest = runs.reduce((m,r)=>Math.max(m, r.hi-r.lo), 0);
      const share = widest / (sc.hi - sc.lo);
      rows.push({ id:sc.id, what:sc.what, words:runs.length,
        share:+share.toFixed(3), widest:+widest.toFixed(1),
        bands:runs.map(r=>`${r.word} ${Math.round(r.lo)}–${Math.round(r.hi)}`) });
      if(runs.some(r=>r.word==="*threw*")) bad.push(`${sc.id} throws somewhere in its own range`);
      /* a band covering most of the quantity's range is the `menace` fault */
      if(share > 0.5)
        bad.push(`${sc.id} (${sc.what}) has one band covering ${Math.round(share*100)}% of its `
          + `range — ${runs.find(r=>r.hi-r.lo===widest).word} from ${Math.round(runs.find(r=>r.hi-r.lo===widest).lo)} `
          + `to ${Math.round(runs.find(r=>r.hi-r.lo===widest).hi)} — so the word says nothing across it`);
      if(runs.length < 3)
        bad.push(`${sc.id} has only ${runs.length} words for a range of ${sc.hi - sc.lo}`);
    }

    /* ---- 2. AND THE TOP BAND MUST BE REACHABLE BY THE MECHANICS THAT MOVE IT ----
       this is the half that reading a table cannot answer, and it is where the fault was. Form
       is the one scale whose movers are few enough to drive exactly: `formShift` for what a bout
       gives, `formWeek` inside endWeek for the decay. Three straight wins is the example the
       lesson gives, so three straight wins is what gets driven. */
    const d = A.newGameState("Sc","clean","SCALES-1",null);
    const g = A.activeG(d)[0];
    const walk = [];
    for(let k=0;k<3;k++){
      A.formShift(d, g, 24, "beat somebody at the great games");
      d.pendingEvent = null;
      try { A.endWeek(d); } catch(e){ break; }
      const now = A.formOf(A.activeG(d).find(x=>x.id===g.id) || g);
      walk.push({ week:d.week, form:+now.toFixed(1), word:A.formWord(now) });
    }
    const after3 = walk.length ? walk[walk.length-1] : null;
    /* THE BAR IS THE GAME'S OWN PROMISE, not my judgement of what form ought to feel like. The
       lesson called "Lately" says, in these words: "Three straight wins and he walks out
       expecting to win." So three straight wins must read as the top of the scale. A first
       version of this asserted only that it should not read the same as a man who had never
       fought — which the old bands PASSED, because 37.5 was "sharp", one band short of the thing
       the lesson had promised. If the lesson's example ever changes, this bar changes with it. */
    const topOf = A.formWord(100);
    if(!after3) bad.push(`three weeks of a man winning could not be driven at all`);
    else if(after3.word !== topOf)
      bad.push(`three straight wins at the great games leaves a man on ${after3.form}, which the game `
        + `calls "${after3.word}" and not "${topOf}" — and the lesson about form offers three straight `
        + `wins as its own example of a man who walks out expecting to win`);
    /* and the top of the scale must be reachable by the best a man can actually do: a win every
       week, whose fixed point is where the decay and the gain balance */
    const f = A.clone(d);
    const fg = A.activeG(f)[0];
    let peak = 0;
    for(let k=0;k<40;k++){
      A.formShift(f, fg, 24, "won again");
      f.pendingEvent = null;
      try { A.endWeek(f); } catch(e){ break; }
      const now = A.formOf(A.activeG(f).find(x=>x.id===fg.id) || fg);
      peak = Math.max(peak, now);
    }
    const topWord = topOf;
    if(A.formWord(peak) !== topWord)
      bad.push(`a man winning every week for forty weeks peaks at form ${peak.toFixed(1)}, which the `
        + `game calls "${A.formWord(peak)}" — "${topWord}" cannot be reached by any man at all`);

    /* ---- 3. AND THE EDGE THE GAME TALKS AT MUST MATCH THE EDGE IT WORDS AT ----
       the lesson about form and the tag on a man's row both gate on FORM_TELL; if that drifts
       from where `formWord` stops saying "level", the game shows a tag that says nothing */
    if(A.formWord(A.FORM_TELL) === A.formWord(0))
      bad.push(`FORM_TELL is ${A.FORM_TELL} and the game still calls that "${A.formWord(A.FORM_TELL)}" — `
        + `the tag lights on a man it has nothing to say about`);
    if(A.formWord(A.FORM_TELL - 0.01) !== A.formWord(0))
      bad.push(`the word changes below FORM_TELL (${A.FORM_TELL}), so a man reads "sharp" with no tag`);

    return { bad, note, rows, walk, after3, peak:+peak.toFixed(1),
      formTell:A.FORM_TELL, topWord, peakWord:A.formWord(peak) };
  });

  const lines = [];
  lines.push(`${out.rows.length} word-scales, each walked across the range its quantity can take:`);
  for(const r of out.rows)
    lines.push(`  ${r.id.padEnd(12)} ${String(r.words).padStart(2)} words · widest band ${String(r.widest).padStart(5)}`
      + ` (${String(Math.round(r.share*100)).padStart(2)}% of range) · ${r.what}`);
  lines.push(`three straight wins at the great games: `
    + out.walk.map(w=>`w${w.week} form ${w.form} "${w.word}"`).join(" → "));
  lines.push(`a man winning every week for forty peaks at form ${out.peak}, which reads "${out.peakWord}"`
    + ` — the top word is "${out.topWord}"`);
  lines.push(`FORM_TELL is ${out.formTell}, and that is where the word stops being "level"`);
  for(const n of out.note) lines.push(`  ${n}`);

  const fails = [...out.bad];
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
