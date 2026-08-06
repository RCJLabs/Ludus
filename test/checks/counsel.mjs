/* The record book says something true, and says nothing when it has nothing.

   The tables have been honest since v2.18.0, but nobody reads twelve rows of
   percentages and works out that the sine missione cards are the reason. This
   check builds houses whose books have a known shape and requires the counsel to
   find it — and, just as importantly, to stay quiet over a house whose figures
   say nothing, because a book that always has an opinion is not worth reading. */

import { hasHandle } from "../harness.mjs";

export const name = "counsel";
export const describe = "the book finds what is in it, and holds its tongue when nothing is";

export async function run({ p }){
  if(!(await hasHandle(p))) return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const house = book => { const d = A.newGameState("Says","clean","COUNSEL",null); d.book = book; return d; };
    const e = (n,w,dr) => ({ n, w, d:dr||0 });
    const base = () => ({ n:0, w:0, drew:0, dead:0, killed:0, purse:0, crowd:0, rounds:0,
      tier:{}, cls:{}, stakes:{}, city:{}, house:{}, kind:{}, best:null, longest:null, biggest:null, worst:null });

    const cases = {};

    /* a house losing badly at one stakes and fine everywhere else */
    { const B = base(); B.n = 60; B.w = 33;
      B.stakes = { standard: e(45, 30), sine: e(15, 3) };
      B.tier = { T1: e(60, 33) };
      cases.stakes = A.bookSays(house(B)); }

    /* a house one rival keeps beating */
    { const B = base(); B.n = 40; B.w = 24;
      B.stakes = { standard: e(40, 24) };
      B.house = { Tullius: e(10, 2) };
      cases.rival = A.bookSays(house(B)); }

    /* a house reaching too high */
    { const B = base(); B.n = 50; B.w = 25;
      B.stakes = { standard: e(50, 25) };
      B.tier = { T0: e(25, 19), T3: e(25, 6) };
      cases.reach = A.bookSays(house(B)); }

    /* a house with nothing to say about it */
    { const B = base(); B.n = 40; B.w = 20;
      B.stakes = { standard: e(20, 10), sine: e(20, 10) };
      B.tier = { T1: e(20, 10), T2: e(20, 10) };
      B.cls = { Murmillo: e(20, 10), Thraex: e(20, 10) };
      cases.flat = A.bookSays(house(B)); }

    /* a house too young to have an opinion about */
    { const B = base(); B.n = 5; B.w = 3; B.stakes = { standard: e(5,3) };
      cases.young = A.bookSays(house(B)); }

    return cases;
  });

  const lines = [];
  for(const [k, said] of Object.entries(out))
    lines.push(`${k.padEnd(8)} ${said.length ? said.map(x=>`[${x.tone}] ${x.text.slice(0,88)}…`).join(" / ") : "(silent)"}`);

  const fails = [];
  const has = (k, re) => (out[k]||[]).some(x=>re.test(x.text));
  if(!has("stakes", /sine missione/i))       fails.push("did not notice a house losing at sine missione 3 of 15");
  if(!has("rival",  /House Tullius/))        fails.push("did not notice one house winning 8 of 10 against it");
  if(!has("reach",  /not ready for|being asked for less/i)) fails.push("did not notice a house winning 76% low and 24% high");
  if((out.young||[]).length)                 fails.push("gave an opinion on a house that had fought five bouts");
  if(!(out.flat||[]).length)                 fails.push("said nothing at all about a house with a flat book — it should say so once");
  if((out.flat||[]).length && !has("flat", /Nothing in the book stands out/))
    fails.push("invented an opinion about a house whose figures are flat");
  for(const said of Object.values(out))
    for(const x of said) if(!/\d/.test(x.text)) fails.push(`a sentence with no number in it: "${x.text.slice(0,60)}"`);

  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
