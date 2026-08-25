/* CAN YOU READ THE WORDS IN THE DRAWING?

   Reported from real play: *"The road to the sand text is a bit tough to read."*

   The drawn ludus carries eleven labels and every one of them is painted in a literal, against a
   ground that is itself a stack of gradients and washes. When the yard took the light in v3.141.0
   the room names went from glowing to invisible, and the fix was to write which ground a label
   falls on AT THE CALL SITE rather than guess it — because guessing is what had broken. That note
   is still true and nothing has ever checked it. The road's label is the case it missed: the road
   is a WEDGE, 107px across where the label sits, and the label is 205px wide, so half of it hangs
   out over bright sand while being drawn in the colour picked for the dark road.

   SO THIS MEASURES IT RATHER THAN LOOKING AT IT. For every text in the drawing it walks a grid of
   sample points across the glyph box, and at each point it takes the whole stack of shapes beneath
   with `elementsFromPoint` and COMPOSITES them bottom-up — resolving gradients at that point, and
   blending each layer by its own opacity. That is what the eye is actually looking at, and it is
   the only way to catch a label that is legible down the middle and gone at both ends: a mean over
   the box would average the two grounds together and report a number nobody sees.

     node test/probes/legible.mjs
*/
import { serve, open, found, clearAll, forge, installRope, settle, tab } from "../harness.mjs";

const { server, port } = await serve({ page:"dist/test.html" });
/* A TALL VIEWPORT, AND THAT IS THE INSTRUMENT AND NOT A PREFERENCE. `elementsFromPoint` is a
   VIEWPORT query: at 844px tall the drawing is mostly scrolled off, every sample lands outside the
   window and comes back empty — and the first run of this printed "99.00:1, 0 under floor" for all
   nineteen labels, which reads as a clean bill of health and is the absence of any measurement at
   all. The whole scene has to be on screen at once. */
const { browser, p } = await open(port, { width:390, height:2400 });
await found(p, { seed:"LEG" }); await clearAll(p); await installRope(p);
/* a house with something in every room, so no label is measured on an empty one */
await forge(p, (A,R)=>{
  const d = A.newGameState("Lannisious","clean","LEG-YARD",null);
  d.gold = 40000; d.week = 120;
  d.doctore = d.doctore || { name:"Arminius", wage:40, skill:70 };
  return d; });
await clearAll(p, 8);
await tab(p, "ludus"); await p.waitForTimeout(420); await clearAll(p, 6);
await tab(p, "ludus"); await p.waitForTimeout(420); await settle(p);

const rows = await p.evaluate(`(()=>{
  const svg = document.querySelector('svg[aria-label^="The ludus"]'); if(!svg) return null;

  const chan = c => { c/=255; return c<=.03928 ? c/12.92 : Math.pow((c+.055)/1.055, 2.4); };
  const lum = ([r,g,b]) => .2126*chan(r) + .7152*chan(g) + .0722*chan(b);
  const ratio = (a,b) => { const x=lum(a), y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  /* IT MUST ACTUALLY BE HEX. The first cut tested only LENGTH, so hex("rgb(28, 22, 16)") parsed
     "rg","b(","28" and handed back [NaN,NaN,NaN] — truthy, so the rgb() fallback behind it never
     ran, every ratio came out NaN, and since NaN < 99 is false the worst-case stayed at its
     initial 99. Nineteen labels reported a clean 99:1 and "0 under floor". */
  const hex = h => { const q = String(h||"").trim().replace(/^#/,"");
    if(!/^[0-9a-fA-F]+$/.test(q)) return null;
    if(q.length === 3) return [0,1,2].map(i=>parseInt(q[i]+q[i],16));
    if(q.length >= 6)  return [0,1,2].map(i=>parseInt(q.slice(i*2,i*2+2),16));
    return null; };
  const finite = c => Array.isArray(c) && c.length >= 3 && c.every(v=>Number.isFinite(v));
  /* the browser hands computed colours back as rgb()/rgba() */
  const rgbOf = s => { const m = String(s||"").match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    const n = m[1].split(",").map(v=>parseFloat(v));
    return { c:[n[0],n[1],n[2]], a: n.length > 3 ? n[3] : 1 }; };

  const mix = (under, over, a) => under.map((v,i)=> v*(1-a) + over[i]*a);

  /* a gradient resolved AT THE POINT, in the element's own box — not at its middle */
  const gradAt = (id, el, ux, uy) => {
    const g = svg.querySelector("#" + CSS.escape(id)); if(!g) return null;
    const stops = [...g.querySelectorAll("stop")].map(s=>{
      const cs = getComputedStyle(s);
      return { o: parseFloat(s.getAttribute("offset") || "0"),
               c: hex(s.getAttribute("stop-color") || cs.stopColor) || rgbOf(cs.stopColor)?.c || [0,0,0],
               a: parseFloat(s.getAttribute("stop-opacity") ?? cs.stopOpacity ?? "1") };
    }).sort((a,b)=>a.o-b.o);
    if(!stops.length) return null;
    let t = 0.5, radial = g.tagName.toLowerCase() === "radialgradient";
    if(!radial){
      const box = el.getBBox();
      const x1 = parseFloat(g.getAttribute("x1") ?? "0"), x2 = parseFloat(g.getAttribute("x2") ?? "1");
      const y1 = parseFloat(g.getAttribute("y1") ?? "0"), y2 = parseFloat(g.getAttribute("y2") ?? "0");
      const fx = box.width  ? (ux - box.x) / box.width  : 0;
      const fy = box.height ? (uy - box.y) / box.height : 0;
      const dx = x2 - x1, dy = y2 - y1;
      const den = dx*dx + dy*dy;
      t = den ? ((fx - x1)*dx + (fy - y1)*dy) / den : 0;
    }
    t = Math.max(0, Math.min(1, t));
    let lo = stops[0], hi = stops[stops.length-1];
    for(let i=0;i<stops.length-1;i++) if(t >= stops[i].o && t <= stops[i+1].o){ lo = stops[i]; hi = stops[i+1]; break; }
    const k = (hi.o - lo.o) ? (t - lo.o) / (hi.o - lo.o) : 0;
    return { c: [0,1,2].map(i => lo.c[i]*(1-k) + hi.c[i]*k), a: lo.a*(1-k) + hi.a*k, radial };
  };

  /* what a pixel actually IS: the whole stack under it, composited bottom-up */
  const groundAt = (sx, sy) => {
    const stack = document.elementsFromPoint(sx, sy);
    const ctm = svg.getScreenCTM(); if(!ctm) return null;
    const pt = svg.createSVGPoint(); pt.x = sx; pt.y = sy;
    const u = pt.matrixTransform(ctm.inverse());
    const layers = [];
    for(const el of stack){
      const tag = el.tagName.toLowerCase();
      if(tag === "text" || tag === "tspan") continue;         /* that is the thing being read */
      if(!svg.contains(el) && el !== svg) { layers.push({ el:null, page:true }); break; }
      const cs = getComputedStyle(el);
      const fill = el.getAttribute("fill") || cs.fill;
      if(!fill || fill === "none" || fill === "transparent") continue;
      const op = parseFloat(el.getAttribute("opacity") ?? cs.opacity ?? "1")
               * parseFloat(el.getAttribute("fill-opacity") ?? cs.fillOpacity ?? "1");
      if(!(op > 0)) continue;
      const m = String(fill).match(/url\\(#([^)]+)\\)/);
      if(m){ const gr = gradAt(m[1], el, u.x, u.y); if(gr) layers.push({ c:gr.c, a:op*gr.a, radial:gr.radial }); continue; }
      const h = hex(fill); if(h){ layers.push({ c:h, a:op }); continue; }
      const r = rgbOf(fill); if(r) layers.push({ c:r.c, a:op*r.a });
    }
    /* topmost first -> paint from the bottom up */
    let out = hex(getComputedStyle(document.body).backgroundColor) || rgbOf(getComputedStyle(document.body).backgroundColor)?.c || [0,0,0];
    let radial = false;
    for(let i = layers.length - 1; i >= 0; i--){
      const L = layers[i]; if(!L || L.page || !L.c) continue;
      if(L.radial) radial = true;
      out = mix(out, L.c, Math.max(0, Math.min(1, L.a)));
    }
    return { c: out, radial };
  };

  /* text must not intercept its own hit test */
  const texts = [...svg.querySelectorAll("text")];
  const prev = texts.map(t=>t.style.pointerEvents);
  texts.forEach(t=>{ t.style.pointerEvents = "none"; });

  const out = [];
  for(const t of texts){
    const r = t.getBoundingClientRect();
    if(!r.width || !r.height) continue;
    const cs = getComputedStyle(t);
    const ink = hex(t.getAttribute("fill") || "") || rgbOf(cs.fill)?.c;
    if(!finite(ink)) continue;
    const COLS = Math.max(6, Math.min(40, Math.round(r.width / 6)));
    let worst = 99, worstAt = null, best = 0, radial = false;
    const cells = [];
    for(let i=0;i<COLS;i++){
      /* sample on the glyph's own middle band, where the ink actually is */
      const sx = r.left + r.width * ((i + 0.5) / COLS);
      const sy = r.top + r.height * 0.55;
      const g = groundAt(sx, sy);
      if(!g || !finite(g.c)) continue;          /* a sample that could not be resolved is not a pass */
      const v = ratio(ink, g.c);
      if(!Number.isFinite(v)) continue;
      if(g.radial) radial = true;
      cells.push(+v.toFixed(2));
      if(v < worst){ worst = v; worstAt = +((i + 0.5) / COLS).toFixed(2); }
      if(v > best) best = v;
    }
    out.push({ n:cells.length, text:(t.textContent||"").slice(0,34), fill:(t.getAttribute("fill")||cs.fill),
      x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width),
      worst:+worst.toFixed(2), best:+best.toFixed(2), at:worstAt, radial, cells });
  }
  texts.forEach((t,i)=>{ t.style.pointerEvents = prev[i] || ""; });
  return out;
})()`);

await browser.close(); server.close();

if(!rows){ console.log("no scene on screen"); process.exit(1); }
const FLOOR = 4.5;
console.log(`=== the words in the drawn ludus, against what is actually behind them\n`);
console.log(`  ${"label".padEnd(36)} ${"ink".padEnd(9)} ${"worst".padStart(6)} ${"best".padStart(6)}  where`);
const blind = rows.filter(r=>!r.n);
if(blind.length) console.log(`  !! ${blind.length} of ${rows.length} labels got ZERO samples — the instrument is not looking at them:\n     ${blind.map(r=>JSON.stringify(r.text)).join(", ")}\n`);
for(const r of rows.slice().filter(r=>r.n).sort((a,b)=>a.worst-b.worst)){
  const flag = r.worst < FLOOR ? "  <-- under " + FLOOR + ":1" : "";
  console.log(`  ${JSON.stringify(r.text).padEnd(36)} ${String(r.fill).padEnd(9)} `
    + `${r.worst.toFixed(2).padStart(6)} ${r.best.toFixed(2).padStart(6)}  ${Math.round((r.at||0)*100)}% across${flag}`);
}
const bad = rows.filter(r=>r.n && r.worst < FLOOR);
console.log(`\n  ${rows.filter(r=>r.n).length} labels measured (${blind.length} blind) · ${bad.length} under ${FLOOR}:1`);
/* the shape of the failure matters as much as the number: a label that is fine down the middle and
   gone at both ends is a label on the wrong ground, not a label in the wrong colour */
for(const r of bad){
  console.log(`\n  ${JSON.stringify(r.text)} — ${r.worst}:1 worst, ${r.best}:1 best, ${r.w}px wide`);
  console.log(`    across it: ${r.cells.join(" ")}`);
  console.log(`    ${r.best / r.worst > 1.8 ? "SPLIT — it crosses two grounds; the colour is right for one of them"
    : "FLAT — it is the wrong colour for the one ground it is on"}`);
}
