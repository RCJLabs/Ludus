/* HOW FAR APART ARE THE ARENA BACKDROPS, IN A UNIT A PLAYER'S EYE USES?

   #193: `VENUES` has nine keys and the stylesheet has six `.v-` rules. `forum` is the base — the
   bare `.arena` gradient IS the warm Capuan sand — so eight want a rule and two do not have one:
   **`bowl`, Pompeii's stone amphitheatre, and `greek`, the theatre at Neapolis.** Both fall through
   to Capua. `venue.mjs` counted the bouts: 6.4% of them are fought at a venue drawn as somewhere
   else.

   THE FALSIFIER IS THE WHOLE REASON THIS EXISTS: *falsifies if the two missing gradients would be
   indistinguishable from `.arena` anyway — `.v-amphi` and `.arena` already nearly are.* A count of
   missing rules cannot answer that. A distance can. If the six that exist are already within a
   hair of each other, then writing two more buys nothing and the item is a different, larger one
   about the palette; if they are far apart, the two holes are real.

   IT MEASURES PIXELS, NOT THE STYLESHEET. Reading the source text back would only prove that the
   text says what it says, and half these gradients are written in `var(--ground)`-style tokens
   whose values live somewhere else. So: mount the real element with the real class, take the
   COMPUTED `background-image` — which the browser has already resolved to rgb() stops — hand those
   stops to a canvas `createLinearGradient`, and read the pixels back with `getImageData`. The
   interpolation is then the browser's own rather than this file's arithmetic.

   THE UNIT IS CIE76 ΔE in Lab, because "these two hex codes differ" is not the question — the
   question is whether an eye would call them the same place. About 2.3 is the just-noticeable
   difference for adjacent patches; these are not adjacent, they are seen minutes apart, so the bar
   for "a change of scene" is much higher and the numbers are printed rather than judged here.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, ROOT } from "../harness.mjs";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const VEN = [...(src.match(/const VENUES = \{([\s\S]*?)\n\};/)||["",""])[1]
  .matchAll(/^  ([a-z]+):\s*\{/gm)].map(m=>m[1]);
const CSS = [...src.matchAll(/^\.v-([a-z]+)\{/gm)].map(m=>m[1]);
console.log(`VENUES ${VEN.length} [${VEN.join(" ")}]`);
console.log(`.v- rules ${CSS.length} [${CSS.join(" ")}]`);
console.log(`no rule of their own: [${VEN.filter(k=>!CSS.includes(k)).join(" ")}]  (forum is the base by design)\n`);
if(!VEN.length || !CSS.length) throw new Error("a list parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p);
await clearAll(p, 8);

const out = await p.evaluate(([VEN, CSS]) => {
  /* ---- THE HOST MUST SIT INSIDE THE TOKEN SCOPE, WHICH IS `.lr` AND NOT `:root` ----
     Every colour token in this file is declared on `.lr`. A probe element appended to
     `document.body` is outside it, so `var(--ground)` fails substitution and the whole
     `background` declaration becomes invalid at computed-value time — which for background-image
     is the initial value, `none`. The first cut of this did exactly that and reported `.v-pit`,
     the most-used backdrop in the game at 64% of bouts, as having no gradient at all. That is a
     probe fault that looks precisely like the bug it was hunting. */
  const scope = document.querySelector(".lr") || document.body;
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-9999px;top:0;width:320px";
  scope.appendChild(host);
  const tok = getComputedStyle(host).getPropertyValue("--ground").trim();

  const SAMPLES = 21;
  const readStrip = (cls) => {
    const el = document.createElement("div");
    el.className = "arena" + (cls ? " v-" + cls : "");
    host.appendChild(el);
    const cs = getComputedStyle(el);
    const bg = cs.backgroundImage || "";
    const border = cs.borderTopColor || "";
    const h = el.getBoundingClientRect().height || 232;
    host.removeChild(el);
    /* the computed value is `linear-gradient(rgb(a, b, c) 0%, rgb(...) 26%, …)` — the browser has
       already substituted every var() and normalised every hex. Pull the stops in order. */
    const stops = [...bg.matchAll(/rgba?\(([^)]+)\)\s*([\d.]+)%/g)].map(m=>{
      const n = m[1].split(",").map(x=>parseFloat(x));
      return { c:[n[0],n[1],n[2]], at: parseFloat(m[2])/100 };
    });
    if(stops.length < 2) return { bg, stops:stops.length, px:null, border };
    /* and the browser's own interpolation, not this file's: the same stops through canvas */
    const cv = document.createElement("canvas"); cv.width = 1; cv.height = Math.round(h);
    const ctx = cv.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, cv.height);
    for(const s of stops) g.addColorStop(Math.min(1, Math.max(0, s.at)), `rgb(${s.c[0]},${s.c[1]},${s.c[2]})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1, cv.height);
    const px = [];
    for(let i=0;i<SAMPLES;i++){
      const y = Math.min(cv.height-1, Math.round(i/(SAMPLES-1)*(cv.height-1)));
      const d = ctx.getImageData(0, y, 1, 1).data;
      px.push([d[0], d[1], d[2]]);
    }
    return { bg, stops:stops.length, px, border };
  };

  /* sRGB -> Lab, so the distance is one an eye uses rather than one a byte does */
  const lab = ([r,g,b]) => {
    const f = v => { v/=255; return v<=0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    const R=f(r), G=f(g), B=f(b);
    const X=(R*0.4124+G*0.3576+B*0.1805)/0.95047, Y=R*0.2126+G*0.7152+B*0.0722, Z=(R*0.0193+G*0.1192+B*0.9505)/1.08883;
    const k = t => t>0.008856 ? Math.cbrt(t) : (7.787*t + 16/116);
    const fx=k(X), fy=k(Y), fz=k(Z);
    return [116*fy-16, 500*(fx-fy), 200*(fy-fz)];
  };
  const dE = (a,b) => { const x=lab(a), y=lab(b);
    return Math.sqrt((x[0]-y[0])**2 + (x[1]-y[1])**2 + (x[2]-y[2])**2); };

  const strips = {};
  strips["(bare .arena)"] = readStrip(null);
  for(const k of VEN) strips[k] = readStrip(CSS.includes(k) ? k : null);

  /* the distance between two backdrops is the MEAN over the strip, and the worst single band is
     printed too — a gradient can match at the horizon and diverge entirely at the sand */
  const dist = (a, b) => {
    const A = strips[a], B = strips[b];
    if(!A || !B || !A.px || !B.px) return null;
    let sum = 0, worst = 0;
    for(let i=0;i<A.px.length;i++){ const d = dE(A.px[i], B.px[i]); sum += d; if(d > worst) worst = d; }
    return { mean: sum/A.px.length, worst };
  };
  const keys = Object.keys(strips);
  const matrix = {};
  for(const a of keys){ matrix[a] = {}; for(const b of keys) matrix[a][b] = dist(a, b); }
  const info = {}; for(const k of keys) info[k] = { stops:strips[k].stops, border:strips[k].border, bg:strips[k].bg,
    top: strips[k].px ? strips[k].px[0] : null, mid: strips[k].px ? strips[k].px[10] : null,
    foot: strips[k].px ? strips[k].px[20] : null };
  scope.removeChild(host);
  return { matrix, keys, info, tok, scoped: scope !== document.body };
}, [VEN, CSS]);

await browser.close(); server.close();

if(!out.tok){
  console.log(`\nFATAL: the host resolved --ground to "" — it is outside the token scope and every`);
  console.log(`gradient written in var() will read as absent. Nothing below is quotable.`);
  process.exit(1);
}
console.log(`host mounted inside ${out.scoped ? "the game's own .lr token scope" : "document.body"}; --ground resolves to ${out.tok}\n`);
const has = k => CSS.includes(k);
console.log("the strip each venue is actually painted with — top / mid / foot, and the border:");
for(const k of out.keys){
  const i = out.info[k];
  const rgb = c => c ? `${String(c[0]).padStart(3)},${String(c[1]).padStart(3)},${String(c[2]).padStart(3)}` : "   -";
  const tag = k === "(bare .arena)" ? "" : has(k) ? `.v-${k}` : "*** NO RULE — drawn as the bare .arena ***";
  console.log(`  ${k.padEnd(14)} ${rgb(i.top)}  →  ${rgb(i.mid)}  →  ${rgb(i.foot)}   ${i.stops} stops  ${tag}`);
}

const rows = out.keys.filter(k=>k !== "(bare .arena)");
for(const k of out.keys) if(!out.info[k].top)
  console.log(`  !! ${k}: ${out.info[k].stops} stops parsed from ${String(out.info[k].bg).slice(0,220)}`);
console.log(`\n  distance from the bare .arena (which is what a venue with no rule is drawn as) — mean ΔE down the strip, worst band:`);
for(const k of rows.slice().sort((a,b)=>(out.matrix["(bare .arena)"][b]?.mean||0)-(out.matrix["(bare .arena)"][a]?.mean||0))){
  const d = out.matrix["(bare .arena)"][k];
  console.log(`     ${k.padEnd(10)} ${d ? d.mean.toFixed(1).padStart(6) : "     -"}   worst ${d ? d.worst.toFixed(1).padStart(6) : "-"}   ${has(k) ? "" : "<- has no rule, so this is 0 by construction"}`);
}

console.log(`\n  and every pair, mean ΔE — how far one change of scene is from another:`);
const w = 10;
console.log("     " + "".padEnd(w) + rows.map(k=>k.slice(0,7).padStart(8)).join(""));
for(const a of rows){
  console.log("     " + a.padEnd(w) + rows.map(b=>{
    const d = out.matrix[a][b];
    return (a===b ? "·" : d ? d.mean.toFixed(0) : "?").padStart(8);
  }).join(""));
}
const ruled = rows.filter(has);
const pairs = [];
for(let i=0;i<ruled.length;i++) for(let j=i+1;j<ruled.length;j++){
  const d = out.matrix[ruled[i]][ruled[j]]; if(d) pairs.push({ a:ruled[i], b:ruled[j], d:d.mean }); }
pairs.sort((x,y)=>x.d-y.d);
console.log(`\n  the ${ruled.length} venues that HAVE a rule, closest pair to furthest:`);
for(const q of pairs) console.log(`     ${q.a.padEnd(10)} vs ${q.b.padEnd(10)} ΔE ${q.d.toFixed(1)}`);
console.log(`\n  >>> #193 FALSIFIES if the existing backdrops are already indistinguishable.`);
console.log(`      The closest pair that both have a rule is ${pairs[0].a}/${pairs[0].b} at ΔE ${pairs[0].d.toFixed(1)};`);
console.log(`      the furthest is ${pairs[pairs.length-1].a}/${pairs[pairs.length-1].b} at ΔE ${pairs[pairs.length-1].d.toFixed(1)}.`);
console.log(`      2.3 is the just-noticeable difference for two patches side by side.`);
