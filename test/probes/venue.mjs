/* NINE VENUES, SIX BACKDROPS — AND WHICH ONES A HOUSE ACTUALLY FIGHTS IN

   The arena's backdrop is one class: `<div className={`arena v-${fight.venue||"forum"} …`}>` at
   src/ludus.jsx:18481. `VENUES` has nine keys. The stylesheet has six `.v-` rules. A venue with no
   rule is drawn with `.arena`'s own gradient, which is the warm Capuan sand — so the question is
   not "is there a bug" but WHICH venues fall through and HOW OFTEN a played house is in one.

   The class list is parsed off the stylesheet and the venue list off `VENUES`, both printed, so a
   bad regex shrinks the denominator visibly. The counts come off `offer.venue` — the field the
   renderer reads — captured on every bout the rope fights, through all four doors.

   FALSIFIER: if the venues with no rule are ones a house is almost never in, this is a rounding
   error in the art and not an item.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "VEN";
const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const VEN_KEYS = [...(src.match(/const VENUES = \{([\s\S]*?)\n\};/)||["",""])[1]
  .matchAll(/^  ([a-z]+):\s*\{/gm)].map(m=>m[1]);
const CSS = [...src.matchAll(/^\.v-([a-z]+)\{/gm)].map(m=>m[1]);
const CITY_VENUE = ((src.match(/const CITY_VENUE = \{([^}]*)\}/)||["",""])[1]).trim();
console.log(`VENUES parsed: ${VEN_KEYS.length} [${VEN_KEYS.join(" ")}]`);
console.log(`.v- rules in the stylesheet: ${CSS.length} [${CSS.join(" ")}]`);
console.log(`no rule: [${VEN_KEYS.filter(k=>!CSS.includes(k)).join(" ")}]  ·  rule with no venue: [${CSS.filter(k=>!VEN_KEYS.includes(k)).join(" ")}]`);
console.log(`CITY_VENUE = ${CITY_VENUE}\n`);
if(!VEN_KEYS.length || !CSS.length) throw new Error("a list parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const seen = {}, byTier = {};
  let bouts = 0, noVenue = 0;
  for(const door of ["doFight","doPairFight","doMelee","doVenatio"]){
    const orig = A[door]; if(typeof orig !== "function") continue;
    A[door] = function(dd, who, offer, ...rest){
      bouts++;
      const v = (offer && offer.venue) || "(unset — renders as forum)";
      if(!(offer && offer.venue)) noVenue++;
      seen[v] = (seen[v]||0) + 1;
      const t = offer ? ("tier "+(offer.tier==null?"?":offer.tier)) : "?";
      (byTier[v] = byTier[v] || {})[t] = ((byTier[v]||{})[t]||0) + 1;
      return orig.call(this, dd, who, offer, ...rest);
    };
  }
  let houses = 0, weeks = 0;
  /* the coast is where two of the three unruled venues live, so the arm TOURS —
     `road` is on by default and comes home, which is the reference player */
  for(let h=0; h<H; h++){
    const d = A.newGameState("Venue","clean",SEED+"-"+h, null); houses++;
    for(let w=0; w<W && !d.over; w++){ R.lanista(d); weeks++; }
  }
  return { seen, byTier, bouts, noVenue, houses, weeks, rope:R.say() };
}, [H, W, SEED]);

await browser.close(); server.close();
const tot = out.bouts || 1;
console.log(`=== ${out.houses} houses, ${out.weeks} house-weeks, ${out.bouts} bouts through the four doors`);
console.log(`  ${"venue".padEnd(34)} ${"bouts".padStart(7)} ${"share".padStart(7)}  backdrop`);
for(const [k,v] of Object.entries(out.seen).sort((a,b)=>b[1]-a[1])){
  const has = CSS.includes(k);
  console.log(`  ${k.padEnd(34)} ${String(v).padStart(7)} ${(v/tot*100).toFixed(1).padStart(6)}%  ${has ? ".v-"+k : "*** NO RULE — falls through to .arena ***"}`);
}
const missing = Object.entries(out.seen).filter(([k])=>!CSS.includes(k)).reduce((s,[,v])=>s+v,0);
console.log(`\n  ${missing} of ${out.bouts} bouts (${(missing/tot*100).toFixed(1)}%) are fought at a venue with no backdrop rule.`);
console.log(`\n  rope: ${out.rope}`);
