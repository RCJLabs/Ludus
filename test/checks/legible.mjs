/* CAN YOU READ THE WORDS IN THE DRAWING?

   Reported from real play: *"The road to the sand text is a bit tough to read."* It was, at
   **1.39:1** across the 47% of its width that hangs off the road and over open sand — but it was
   not the worst. "a keeper of slaves" sat at **1.03:1**, dark ink on the dark top of the drawing:
   not faint, gone. ELEVEN OF NINETEEN labels were under the 4.0:1 that `palette` holds the rest of
   the app's text to, and nothing anywhere could tell, because no check has ever asked whether a
   word in the drawn ludus can be read against what is behind it.

   THE CAUSE WAS A HAND-SET FLAG. Both scene text helpers took a `lit` boolean, chosen per call
   site, and the note above them said which ground a label falls on is a fact about the drawing so
   it should be written down rather than guessed. That was right, and it drifted anyway: the sand
   has been RE-AIMED TWICE since those flags were set — v3.141.0 lit the yard, v3.143.0 took the
   whole app dark — and a boolean written against the old gradient cannot know either happened.
   v3.145.0 derives the ink from the sand's own stop table instead, so this check's real job is to
   fail if that derivation is ever bypassed, replaced by a literal, or aimed at the wrong ground.

   HOW IT MEASURES, and this is the whole of why it can see what the eye sees: for every text in
   the drawing it walks a grid across the glyph box, and at each point takes the ENTIRE stack of
   shapes beneath with `elementsFromPoint`, resolving gradients at that exact point and compositing
   the layers bottom-up by their own opacity. A mean over the box would have averaged the road's
   two grounds together and reported a comfortable number nobody sees. The worst sample is the one
   that matters, and where across the label it falls is what tells a wrong COLOUR apart from a
   label lying across two grounds.

   TWO INSTRUMENT FAULTS ARE BUILT INTO THE GUARDS BELOW, because the first two runs of this were
   confidently wrong in the direction that looks like success:

   · `elementsFromPoint` is a VIEWPORT query. At the phone's 844px the drawing is mostly scrolled
     off, every sample lands outside the window and comes back empty — and it printed "99.00:1,
     0 under floor" for all nineteen labels. Hence the tall viewport, and hence `blind` below: a
     label nothing sampled is a FAILURE, never a pass.
   · the colour parser tested only LENGTH, so hex("rgb(28, 22, 16)") parsed "rg","b(","28" and
     returned [NaN,NaN,NaN] — truthy, so the rgb() fallback behind it never ran. Every ratio was
     NaN, and since NaN < 99 is false the worst case stayed at its initial value. Both the parser
     and the sample loop refuse non-finite numbers now rather than letting them read as clean.
*/
import { found, clearAll, forge, installRope, settle, tab } from "../harness.mjs";

export const name = "legible";
export const describe = "every word in the drawn ludus can be read against what is behind it";

/* THE SAME NUMBER `palette` HOLDS THE CHROME TO. The drawing's labels are text a player reads, so
   there is one answer for text in this project rather than a softer one for the pretty parts. */
const FLOOR = 4.0;

const MEASURE = `(()=>{
  const svg = document.querySelector('svg[aria-label^="The ludus"]'); if(!svg) return null;
  const chan = c => { c/=255; return c<=.03928 ? c/12.92 : Math.pow((c+.055)/1.055, 2.4); };
  const lum = ([r,g,b]) => .2126*chan(r) + .7152*chan(g) + .0722*chan(b);
  const ratio = (a,b) => { const x=lum(a), y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
  const finite = c => Array.isArray(c) && c.length >= 3 && c.every(v=>Number.isFinite(v));
  const hex = h => { const q = String(h||"").trim().replace(/^#/,"");
    if(!/^[0-9a-fA-F]+$/.test(q)) return null;
    if(q.length === 3) return [0,1,2].map(i=>parseInt(q[i]+q[i],16));
    if(q.length >= 6)  return [0,1,2].map(i=>parseInt(q.slice(i*2,i*2+2),16));
    return null; };
  const rgbOf = s => { const m = String(s||"").match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    const n = m[1].split(",").map(v=>parseFloat(v));
    return { c:[n[0],n[1],n[2]], a: n.length > 3 ? n[3] : 1 }; };
  const mix = (under, over, a) => under.map((v,i)=> v*(1-a) + over[i]*a);

  const gradAt = (id, el, ux, uy) => {
    const g = svg.querySelector("#" + CSS.escape(id)); if(!g) return null;
    const stops = [...g.querySelectorAll("stop")].map(s=>{ const cs = getComputedStyle(s);
      return { o: parseFloat(s.getAttribute("offset") || "0"),
               c: hex(s.getAttribute("stop-color") || cs.stopColor) || (rgbOf(cs.stopColor)||{}).c || [0,0,0],
               a: parseFloat(s.getAttribute("stop-opacity") != null ? s.getAttribute("stop-opacity") : (cs.stopOpacity || "1")) };
    }).sort((a,b)=>a.o-b.o);
    if(!stops.length) return null;
    let t = 0.5; const radial = g.tagName.toLowerCase() === "radialgradient";
    if(!radial){
      const box = el.getBBox();
      const x1 = parseFloat(g.getAttribute("x1") != null ? g.getAttribute("x1") : "0");
      const x2 = parseFloat(g.getAttribute("x2") != null ? g.getAttribute("x2") : "1");
      const y1 = parseFloat(g.getAttribute("y1") != null ? g.getAttribute("y1") : "0");
      const y2 = parseFloat(g.getAttribute("y2") != null ? g.getAttribute("y2") : "0");
      const fx = box.width ? (ux - box.x)/box.width : 0, fy = box.height ? (uy - box.y)/box.height : 0;
      const dx = x2-x1, dy = y2-y1, den = dx*dx + dy*dy;
      t = den ? ((fx-x1)*dx + (fy-y1)*dy)/den : 0;
    }
    t = Math.max(0, Math.min(1, t));
    let lo = stops[0], hi = stops[stops.length-1];
    for(let i=0;i<stops.length-1;i++) if(t >= stops[i].o && t <= stops[i+1].o){ lo = stops[i]; hi = stops[i+1]; break; }
    const k = (hi.o - lo.o) ? (t - lo.o)/(hi.o - lo.o) : 0;
    return { c:[0,1,2].map(i=>lo.c[i]*(1-k) + hi.c[i]*k), a: lo.a*(1-k) + hi.a*k };
  };

  const groundAt = (sx, sy) => {
    const stack = document.elementsFromPoint(sx, sy);
    const ctm = svg.getScreenCTM(); if(!ctm) return null;
    const pt = svg.createSVGPoint(); pt.x = sx; pt.y = sy;
    const u = pt.matrixTransform(ctm.inverse());
    const layers = [];
    for(const el of stack){
      const tag = el.tagName.toLowerCase();
      if(tag === "text" || tag === "tspan") continue;
      if(!svg.contains(el) && el !== svg) break;
      const cs = getComputedStyle(el);
      const fill = el.getAttribute("fill") || cs.fill;
      if(!fill || fill === "none" || fill === "transparent") continue;
      const op = parseFloat(el.getAttribute("opacity") != null ? el.getAttribute("opacity") : (cs.opacity || "1"))
               * parseFloat(el.getAttribute("fill-opacity") != null ? el.getAttribute("fill-opacity") : (cs.fillOpacity || "1"));
      if(!(op > 0)) continue;
      const m = String(fill).match(/url\\(#([^)]+)\\)/);
      if(m){ const gr = gradAt(m[1], el, u.x, u.y); if(gr) layers.push({ c:gr.c, a:op*gr.a }); continue; }
      const h = hex(fill); if(h){ layers.push({ c:h, a:op }); continue; }
      const r = rgbOf(fill); if(r) layers.push({ c:r.c, a:op*r.a });
    }
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    let out = hex(bodyBg) || (rgbOf(bodyBg)||{}).c || [0,0,0];
    for(let i = layers.length - 1; i >= 0; i--){
      const L = layers[i]; if(!L || !finite(L.c)) continue;
      out = mix(out, L.c, Math.max(0, Math.min(1, L.a)));
    }
    return finite(out) ? out : null;
  };

  const texts = [...svg.querySelectorAll("text")];
  const prev = texts.map(t=>t.style.pointerEvents);
  texts.forEach(t=>{ t.style.pointerEvents = "none"; });
  const out = [];
  for(const t of texts){
    const r = t.getBoundingClientRect();
    if(!r.width || !r.height) continue;
    const cs = getComputedStyle(t);
    const ink = hex(t.getAttribute("fill") || "") || (rgbOf(cs.fill)||{}).c;
    if(!finite(ink)) continue;
    const COLS = Math.max(6, Math.min(40, Math.round(r.width/6)));
    let worst = Infinity, best = 0, at = null, n = 0;
    for(let i=0;i<COLS;i++){
      const g = groundAt(r.left + r.width*((i+0.5)/COLS), r.top + r.height*0.55);
      if(!g) continue;
      const v = ratio(ink, g);
      if(!Number.isFinite(v)) continue;
      n++;
      if(v < worst){ worst = v; at = +((i+0.5)/COLS).toFixed(2); }
      if(v > best) best = v;
    }
    out.push({ n, text:(t.textContent||"").slice(0,30), ink:(t.getAttribute("fill")||cs.fill),
      worst: n ? +worst.toFixed(2) : 0, best: +best.toFixed(2), at, w: Math.round(r.width) });
  }
  texts.forEach((t,i)=>{ t.style.pointerEvents = prev[i] || ""; });
  return out;
})()`;

export async function run({ p, errors }){
  const bad = [], lines = [];
  /* THE DRAWING IS 720 UNITS TALL AND elementsFromPoint IS A VIEWPORT QUERY — at the phone's own
     height every sample lands off-screen and comes back empty. The browser is this check's own,
     closed after it, so nothing else can inherit the size. */
  await p.setViewportSize({ width: 390, height: 2400 });
  await found(p, { seed:"LEG" });
  await clearAll(p);
  await installRope(p);
  /* something in every room, so no label is measured on an empty one */
  await forge(p, (A, R) => {
    const d = A.newGameState("Lannisious","clean","LEG-YARD",null);
    d.gold = 40000; d.week = 120;
    d.doctore = d.doctore || { name:"Arminius", wage:40, skill:70 };
    return d; });
  await clearAll(p, 8);
  await tab(p, "ludus"); await p.waitForTimeout(420); await clearAll(p, 6);
  await tab(p, "ludus"); await p.waitForTimeout(420); await settle(p);

  const rows = await p.evaluate(MEASURE);
  if(!rows || !rows.length) return { pass:false, why:"no scene on screen, or it carries no words", lines };

  const blind = rows.filter(r => !r.n);
  const seen = rows.filter(r => r.n);
  const under = seen.filter(r => r.worst < FLOOR).sort((a,b)=>a.worst-b.worst);
  const worst = seen.reduce((m,r)=> r.worst < m.worst ? r : m, seen[0]);

  lines.push(`${seen.length} words in the drawing, against the stack actually under each one`);
  for(const r of under.slice(0,6))
    lines.push(`  ${String(r.worst).padStart(5)}:1  ${r.ink.padEnd(9)} "${r.text}"`
      + (r.best / r.worst > 1.8 ? ` — SPLIT, ${r.best}:1 elsewhere on the same label` : ""));
  lines.push(`worst word: ${worst.worst}:1 "${worst.text}" against a floor of ${FLOOR}:1`);

  /* a label nothing looked at is not a label that passed */
  if(blind.length)
    bad.push(`${blind.length} label${blind.length===1?"":"s"} got ZERO samples — the measurement is not `
      + `reaching them, so this check is proving nothing about ${blind.map(r=>JSON.stringify(r.text)).join(", ")}`);
  for(const r of under.slice(0,3))
    bad.push(`"${r.text}" is ${r.worst}:1 against what is behind it`
      + (r.best / r.worst > 1.8
        ? ` at ${Math.round((r.at||0)*100)}% across, and ${r.best}:1 elsewhere on the same label — `
          + `it lies across TWO grounds and is coloured for one of them`
        : ` — under the ${FLOOR}:1 the rest of the app's text is held to`));
  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push("every room name, caption and man's name clears the floor on every part of itself");
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
