/* A ONE-LINE DEFINITION WHERE THE NUMBER IS — #275

   (`terms` was free in BOTH directories; checked before writing.)

   ---- THE ITEM SAID ELEVEN AND NAMED THE WRONG FOUR ----
   "Bearing" is not a quantity: the man's sheet prints `demeanor(g.defiance)` under that label, so
   bearing and defiance are ONE number with two names — which is also why a search for "defiance"
   misses the lesson that defines it. Eleven is TEN.

   And of the four #275 says have a lesson — `regard`, `acclaim`, `unrest`, `form` — only `form`
   does. Measured against all 35 lesson texts under every name a player could meet each term by
   (`probes/terms.mjs`):

     DEFINED IN A LESSON   bearing/defiance · favour · form
     MENTIONED ONLY        fatigue (what moves it, not what it is) · standing (the VERB)
     NAMED NOWHERE         regard · acclaim · known · welcome · morale · unrest

   `welcome` is the one claim of the item's that holds.

   ---- AND THE ANSWER IS THE LABEL, NOT A LEGEND ----
   The risk note is #101's wallpaper fault, and the standing panel had already found the shape a
   release ago: it printed "Unrest — ends a run", the gloss inside the label, costing no line. That
   string is sourced from `TERM_SAYS` now instead of being hardcoded beside it.

   ---- WHAT THIS RELEASE DOES NOT DO, AND WHY ----
   Only TWO of the six have a labelled print site to extend: `unrest` and `morale`. `regard`,
   `acclaim`, `known` and `welcome` reach the screen as bare word-chips or inside prose — there is
   no label to hang a definition on, and adding one would be exactly the furniture the item's own
   risk note forbids. That is the finding, not an omission: the gap is not that the words are
   missing, it is that four of these quantities are never printed beside their own name.

   FOUR ARMS. */
import { hasHandle } from "../harness.mjs";

export const name = "terms";
export const describe = "every quantity no lesson defines carries a gloss, and it lives in the label rather than in a legend";

/* measured in probes/terms.mjs against all 35 lesson texts */
const NO_LESSON = ["regard", "acclaim", "known", "welcome", "unrest", "morale"];
const HAS_LESSON = ["defiance", "favour", "form"];

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["TERM_NAME","TERM_SAYS","termLabel","LESSONS"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const labels = {};
    for(const k of Object.keys(A.TERM_NAME)) labels[k] = A.termLabel(k);
    return { names:A.TERM_NAME, says:A.TERM_SAYS, labels, unknown:A.termLabel("nothingLikeThis") };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };

  const lines = [], fails = [];
  lines.push(`${Object.keys(out.names).length} quantities named, ${Object.keys(out.says).length} carry a gloss:`);
  for(const k of Object.keys(out.names)) lines.push(`   ${k.padEnd(10)} ${out.labels[k]}`);

  /* ---- 1. every term no lesson names carries a gloss ---- */
  for(const k of NO_LESSON){
    if(!out.says[k])
      fails.push(`\`${k}\` is named in none of the 35 lessons and carries no gloss either — measured in ` +
        `\`probes/terms.mjs\` under every name a player could meet it by`);
    else if(!/ — /.test(out.labels[k]))
      fails.push(`\`${k}\`'s label is "${out.labels[k]}" — the gloss is supposed to be IN the label, which is ` +
        `what makes it cost no line`);
  }

  /* ---- 2. AND ONE THE GATEKEEPER ALREADY DEFINES DOES NOT GET A SECOND, SHORTER ONE ---- */
  for(const k of HAS_LESSON)
    if(out.says[k])
      fails.push(`\`${k}\` has a lesson of its own AND a gloss — a term defined twice in two lengths is the ` +
        `furniture #275's risk note is about, and #101 spent a release removing it`);

  /* ---- 3. the label is the name where there is nothing to add ---- */
  for(const k of Object.keys(out.names)){
    if(!out.labels[k]) fails.push(`\`${k}\` produces no label at all`);
    if(!out.says[k] && out.labels[k] !== out.names[k])
      fails.push(`\`${k}\` has no gloss but its label is "${out.labels[k]}" rather than its plain name`);
  }
  if(out.unknown !== "nothingLikeThis")
    fails.push(`a term nobody declared produced "${out.unknown}" — it should fall back to the key`);

  /* ---- 4. and the glosses say what the thing IS ---- */
  for(const [k, v] of Object.entries(out.says)){
    if(!v || v.length < 8) fails.push(`\`${k}\`'s gloss is "${v}"`);
    if(/^[A-Z]/.test(v)) fails.push(`\`${k}\`'s gloss starts a sentence — it runs on from the name after a dash`);
    if(v.length > 44) fails.push(`\`${k}\`'s gloss is ${v.length} characters — it shares a row with the number`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
