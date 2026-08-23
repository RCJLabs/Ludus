/* EVERY VENUE IS DRAWN AS ITSELF — #193

   The arena's backdrop is one class: `` className={`arena v-${fight.venue||"forum"} …`} ``. `VENUES`
   has nine keys and the stylesheet had **six** `.v-` rules. `forum` is the base — the bare `.arena`
   gradient IS the warm Capuan sand — so eight keys want a rule of their own and two did not have
   one: **`bowl`, Pompeii's stone amphitheatre, and `greek`, the theatre at Neapolis.** Both fell
   through to Capua, on **308 of 5,688 bouts, 5.4%**, in exactly the system built to be a change of
   scene. Puteoli had `.v-harbour`; the other two coast towns looked like the place you left.

   THE BAR THIS HOLDS IS THE SHAPE, NOT THE TWO KEYS. A tenth venue added later with no rule goes
   red here rather than shipping as Capua for a year, and it holds the thing that actually matters
   about a backdrop: that a player can tell one from another. The unit is CIE76 ΔE in Lab, because
   "these hex codes differ" is not the question. **2.3 is the just-noticeable difference for two
   patches side by side**; these are seen minutes apart, so the floor here is deliberately set at
   that JND and the real spread is printed rather than asserted — the eight rules run 9.5 to 28.8,
   and pinning the check to today's spread would make every future palette tweak a red run.

   IT READS PIXELS, NOT THE STYLESHEET. The rules are written in `var(--ground)`-style tokens whose
   values live elsewhere, so the source text proves nothing. The real element is mounted with the
   real class, the COMPUTED `background-image` is taken — the browser has already resolved every
   var() to rgb stops — and those stops go through a canvas `createLinearGradient` so the
   interpolation is the browser's own. **The host must sit inside `.lr`**, which is where every
   token in this file is declared: `paint.mjs`'s first cut appended to `document.body`, var()
   substitution failed, the whole declaration became invalid at computed-value time, and it
   reported `.v-pit` — 64% of all bouts — as having no gradient at all. That guard is asserted here
   rather than assumed, because a probe fault that mimics the bug is the worst kind.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, found, clearAll } from "../harness.mjs";

export const name = "backdrop";
export const describe = "every venue has a backdrop of its own, and no two of them look alike";
export const slow = true;   /* mounts the real element in a real browser */

const JND = 2.3;            /* CIE76: two patches side by side stop being the same colour */

export async function run({ p, errors }){
  const lines = [], bad = [];
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");
  const VEN = [...(src.match(/const VENUES = \{([\s\S]*?)\n\};/)||["",""])[1]
    .matchAll(/^  ([a-z]+):\s*\{/gm)].map(m=>m[1]);
  const CSS = [...src.matchAll(/^\.v-([a-z]+)\{/gm)].map(m=>m[1]);
  lines.push(`VENUES ${VEN.length} [${VEN.join(" ")}]  ·  .v- rules ${CSS.length} [${CSS.join(" ")}]`);
  if(!VEN.length) bad.push("VENUES parsed EMPTY — this check is reading a shape that has moved");
  if(!CSS.length) bad.push("no .v- rules parsed — this check is reading a shape that has moved");

  /* `forum` is the base and is the ONE key allowed to have no rule of its own. Anything else
     without one is being drawn as the Capuan sand whatever its name says. */
  const BASE = "forum";
  const naked = VEN.filter(k => k !== BASE && !CSS.includes(k));
  if(naked.length)
    bad.push(`${naked.join(", ")} ${naked.length===1?"has":"have"} no \`.v-\` rule and ${naked.length===1?"is":"are"} drawn as the bare .arena — `
      + `a venue drawn as somewhere else is #193`);
  const orphan = CSS.filter(k => !VEN.includes(k));
  if(orphan.length) lines.push(`rules with no venue behind them (printed, not asserted): ${orphan.join(", ")}`);

  await found(p);
  await clearAll(p, 8);

  const out = await p.evaluate(([VEN, CSS, BASE])=>{
    const scope = document.querySelector(".lr");
    if(!scope) return { fatal:"no .lr in the document — the token scope this check depends on is gone" };
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-9999px;top:0;width:320px";
    scope.appendChild(host);
    const tok = getComputedStyle(host).getPropertyValue("--ground").trim();

    const N = 21;
    const strip = (cls)=>{
      const el = document.createElement("div");
      el.className = "arena" + (cls ? " v-" + cls : "");
      host.appendChild(el);
      const bg = getComputedStyle(el).backgroundImage || "";
      const h = el.getBoundingClientRect().height || 232;
      host.removeChild(el);
      const stops = [...bg.matchAll(/rgba?\(([^)]+)\)\s*([\d.]+)%/g)].map(m=>{
        const n = m[1].split(",").map(x=>parseFloat(x));
        return { c:[n[0],n[1],n[2]], at:parseFloat(m[2])/100 };
      });
      if(stops.length < 2) return { px:null, bg };
      const cv = document.createElement("canvas"); cv.width = 1; cv.height = Math.round(h);
      const ctx = cv.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, 0, cv.height);
      for(const s of stops) g.addColorStop(Math.min(1, Math.max(0, s.at)), `rgb(${s.c[0]},${s.c[1]},${s.c[2]})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1, cv.height);
      const px = [];
      for(let i=0;i<N;i++){
        const y = Math.min(cv.height-1, Math.round(i/(N-1)*(cv.height-1)));
        const d = ctx.getImageData(0, y, 1, 1).data;
        px.push([d[0], d[1], d[2]]);
      }
      return { px, bg };
    };
    const lab = ([r,g,b])=>{
      const f = v => { v/=255; return v<=0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
      const R=f(r), G=f(g), B=f(b);
      const X=(R*0.4124+G*0.3576+B*0.1805)/0.95047, Y=R*0.2126+G*0.7152+B*0.0722, Z=(R*0.0193+G*0.1192+B*0.9505)/1.08883;
      const k = t => t>0.008856 ? Math.cbrt(t) : (7.787*t + 16/116);
      const fx=k(X), fy=k(Y), fz=k(Z);
      return [116*fy-16, 500*(fx-fy), 200*(fy-fz)];
    };
    const dE = (a,b)=>{ const x=lab(a), y=lab(b);
      return Math.sqrt((x[0]-y[0])**2 + (x[1]-y[1])**2 + (x[2]-y[2])**2); };

    const S = { "(bare .arena)": strip(null) };
    for(const k of VEN) S[k] = strip(CSS.includes(k) ? k : null);
    const dead = Object.keys(S).filter(k => !S[k].px);
    const mean = (a,b)=>{ const A=S[a].px, B=S[b].px; if(!A||!B) return null;
      let t=0; for(let i=0;i<A.length;i++) t += dE(A[i], B[i]); return t/A.length; };
    const pairs = [];
    const ruled = VEN.filter(k=>CSS.includes(k));
    for(let i=0;i<ruled.length;i++) for(let j=i+1;j<ruled.length;j++)
      pairs.push({ a:ruled[i], b:ruled[j], d:mean(ruled[i], ruled[j]) });
    const fromBase = {};
    for(const k of VEN) fromBase[k] = mean("(bare .arena)", k);
    scope.removeChild(host);
    return { tok, dead, pairs, fromBase, ruled };
  }, [VEN, CSS, BASE]);

  if(out.fatal) return { pass:false, why:out.fatal, lines };

  /* the guard that makes every number below mean anything */
  lines.push(`host inside .lr · --ground resolves to "${out.tok}"`);
  if(!out.tok)
    bad.push("the mounted element resolves --ground to nothing — it is outside the token scope, "
      + "every var()-written gradient reads as absent, and nothing this check measures is real");
  if(out.dead.length)
    bad.push(`${out.dead.join(", ")} computed to no gradient at all — either the rule is gone or the token scope is wrong`);

  lines.push(`distance from the bare .arena, which is what a ruleless venue is drawn as:`);
  for(const k of VEN.slice().sort((a,b)=>(out.fromBase[b]||0)-(out.fromBase[a]||0)))
    lines.push(`   ${k.padEnd(10)} ΔE ${out.fromBase[k] == null ? "  -" : out.fromBase[k].toFixed(1).padStart(5)}${k===BASE?"   (the base itself, 0 by design)":""}`);
  /* a venue with a rule of its own that is a hair from the base has a rule in name only */
  for(const k of out.ruled){
    const d = out.fromBase[k];
    if(d != null && d < JND)
      bad.push(`.v-${k} is ΔE ${d.toFixed(1)} from the bare .arena — it has a rule and is drawn as Capua anyway`);
  }

  const sorted = out.pairs.filter(x=>x.d != null).sort((a,b)=>a.d-b.d);
  if(sorted.length){
    lines.push(`${sorted.length} pairs of ruled venues · closest ${sorted[0].a}/${sorted[0].b} ΔE ${sorted[0].d.toFixed(1)}`
      + ` · furthest ${sorted[sorted.length-1].a}/${sorted[sorted.length-1].b} ΔE ${sorted[sorted.length-1].d.toFixed(1)}`);
    for(const q of sorted.slice(0, 4)) lines.push(`   ${q.a.padEnd(10)} vs ${q.b.padEnd(10)} ΔE ${q.d.toFixed(1)}`);
    for(const q of sorted) if(q.d < JND)
      bad.push(`${q.a} and ${q.b} are ΔE ${q.d.toFixed(1)} apart — under the ${JND} an eye needs, so they are the same place with two names`);
  } else bad.push("no pair of ruled venues could be compared — the fixture measured nothing");

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push("every venue is drawn as itself, and no two backdrops are within the eye's floor");
  return { pass: bad.length === 0, why: bad.slice(0,4).join("; ") || null, lines };
}
