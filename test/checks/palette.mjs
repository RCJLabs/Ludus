/* THE PALETTE — the house has two grounds, and everything must be legible on both

   v3.95.0 named the structural colours and gave the ludus a second ground: home is the drawn
   place and keeps its night palette, everything behind a door is the ledger and renders as ink
   on paper. That split can rot in three distinct ways, and every one of them bit during the
   build itself:

     A DARK LEFT STANDING. Any colour the palette does not reach stays night-coloured on paper.
       The header's fade was a literal rgba inside a gradient and ran cream-to-black; the
       gatekeeper's note was #2b2216, two points off --raise and so not folded in with it. Both
       looked like bugs in the theme and were actually colours nobody had named.
     INK TOO PALE TO READ. The dim and faint inks are LIGHTER than the body on a dark ground and
       must be DARKER on paper. Get the direction wrong and the text is still there, still the
       right colour by name, and unreadable.
     THE COLOURBLIND REMAP LOST. cbc() swapped three green LITERALS at the colour helpers. Those
       literals are names now, so the remap moved to the names — and nothing anywhere tested it,
       which is how a pref quietly stops working.

   The paintings are exempt on purpose and the check must know it: the drawn ludus, the fighter
   figures, and the six venue backdrops are pictures, not chrome. The ludus is lit by the same
   sun whichever ground the page is on.
*/
import { found, tab, clearAll, settle } from "../harness.mjs";

export const name = "palette";
export const describe = "home stays night, every door opens on paper, and nothing is left unreadable";

/* the measuring kit runs in the page: relative luminance and WCAG contrast */
const KIT = `
  const chan = c => { c/=255; return c<=.03928 ? c/12.92 : Math.pow((c+.055)/1.055, 2.4); };
  const lum = ([r,g,b]) => .2126*chan(r) + .7152*chan(g) + .0722*chan(b);
  const parse = s => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    const p = m[1].split(",").map(x=>parseFloat(x));
    if(p.length>3 && p[3]===0) return null; return [p[0],p[1],p[2]]; };
  /* alpha matters when asking "is this surface dark": the paper texture is laid on in stops of
     rgba(146,116,68,.13), whose RGB alone reads as a dark brown and tripped this check as six
     black panels that were never on the screen. A stop that sheer cannot darken anything. */
  const alphaOf = s => { const m = String(s).match(/rgba\\(([^)]+)\\)/);
    if(!m) return 1; const p = m[1].split(",").map(x=>parseFloat(x));
    return p.length>3 ? p[3] : 1; };
  const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((m,n)=>n-m); return (x+.05)/(y+.05); };
  /* a picture is not chrome: the scene, the figures, the venue backdrops */
  const painted = el => !!el.closest("svg, .scn, .arena, .v-pit, .v-yard, .v-field, .v-amphi, .v-imperial, .v-harbour");
  /* the ground a piece of text actually sits on */
  const groundOf = el => { let n = el;
    while(n && n !== document.documentElement){
      const c = parse(getComputedStyle(n).backgroundColor);
      if(c) return c;
      n = n.parentElement;
    }
    return [23,18,16]; };
`;

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"PALETTE" });
  await clearAll(p);
  await p.waitForTimeout(250);

  const dismiss = async () => { for(let i=0;i<4;i++){
    if(!await p.evaluate(()=>!!document.querySelector(".modalwrap"))) return;
    if(!await p.evaluate(()=>{ const b=[...document.querySelectorAll(".modalwrap button")]
      .find(x=>/think again|close|not now|leave it/i.test((x.innerText||"")+(x.getAttribute("aria-label")||"")));
      if(b){ b.click(); return true; } return false; })) await p.keyboard.press("Escape");
    await p.waitForTimeout(200); } };

  /* ---- 1. the two grounds ---- */
  await tab(p, "ludus"); await dismiss(); await p.waitForTimeout(200); await settle(p); /* the page turn is 420ms and the wait above is shorter — see settle() */
  const home = await p.evaluate(KIT + `(()=>{
    const sh = document.querySelector("[data-place]");
    return { place: sh.getAttribute("data-place"), L: lum(parse(getComputedStyle(sh).backgroundColor) || [23,18,16]) };
  })()`);
  lines.push(`the ludus: ground luminance ${home.L.toFixed(3)} (night)`);
  if(home.L > 0.22) fails.push(`home is not dark any more (luminance ${home.L.toFixed(3)}) — the drawn place is a place, not paper`);

  for(const place of ["men","arena","market","villa"]){
    if(!await tab(p, place)) { fails.push(`could not reach ${place}`); continue; }
    await dismiss(); await p.waitForTimeout(220);

    const r = await p.evaluate(KIT + `(()=>{
      const sh = document.querySelector("[data-place]");
      const ground = lum(parse(getComputedStyle(sh).backgroundColor) || [230,217,184]);

      /* A DARK LEFT STANDING — a painted background, big enough to see, still night-coloured.
         Gradients count: the header's fault lived in backgroundImage, not backgroundColor. */
      const darks = [];
      for(const el of document.querySelectorAll("body *")){
        if(painted(el)) continue;
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if(rect.width * rect.height < 5200) continue;
        if(cs.visibility === "hidden" || cs.display === "none") continue;
        const cols = [];
        const bc = parse(cs.backgroundColor);
        if(bc && alphaOf(cs.backgroundColor) >= 0.6) cols.push(bc);
        for(const m of String(cs.backgroundImage).matchAll(/rgba?\\([^)]+\\)/g)){
          const c = parse(m[0]); if(c && alphaOf(m[0]) >= 0.6) cols.push(c);
        }
        for(const c of cols) if(lum(c) < 0.20){
          darks.push({ cls:(el.className||"").toString().slice(0,26), tag:el.tagName,
                       L:+lum(c).toFixed(3), w:Math.round(rect.width), h:Math.round(rect.height) });
          break;
        }
      }

      /* INK TOO PALE — every run of real text against the ground it sits on */
      let worst = { ratio: 99, text:"", col:"" }, thin = 0, n = 0;
      const pale = [];
      for(const el of document.querySelectorAll("body *")){
        if(painted(el)) continue;
        const cs = getComputedStyle(el);
        if(cs.visibility === "hidden" || cs.display === "none") continue;
        if(+cs.opacity < 0.5) continue;            /* deliberately faded is not the same as unreadable */
        const own = [...el.childNodes].filter(x=>x.nodeType===3).map(x=>x.textContent.trim()).join(" ").trim();
        if(own.length < 6) continue;
        const rect = el.getBoundingClientRect();
        if(rect.width < 8 || rect.height < 8) continue;
        const fg = parse(cs.color); if(!fg) continue;
        const rr = ratio(fg, groundOf(el.parentElement || el));
        n++;
        if(rr < 4.0){ thin++; pale.push({ r:+rr.toFixed(2), col:cs.color,
          cls:(el.className||"").toString().slice(0,22), text:own.slice(0,26) }); }
        if(rr < worst.ratio) worst = { ratio:+rr.toFixed(2), text:own.slice(0,32), col:cs.color };
      }
      pale.sort((a,b)=>a.r-b.r);
      return { ground:+ground.toFixed(3), darks:darks.slice(0,6), nDark:darks.length,
               worst, thin, n, pale:pale.slice(0,6) };
    })()`);

    lines.push(`${place.padEnd(7)} ground ${r.ground} · ${r.n} text runs, ${r.thin} under 4.0:1 · worst ${r.worst.ratio}:1 "${r.worst.text}"`);
    if(r.ground < 0.55) fails.push(`${place} did not open on paper (ground luminance ${r.ground})`);
    if(r.nDark){
      for(const d of r.darks) lines.push(`    dark left standing: ${d.tag}.${d.cls} ${d.w}x${d.h} luminance ${d.L}`);
      fails.push(`${place} has ${r.nDark} dark surface${r.nDark===1?"":"s"} the palette never reached`);
    }
    if(r.thin > 0){
      for(const q of r.pale) lines.push(`    pale ink ${String(q.r).padStart(5)}:1  ${q.col.padEnd(20)} .${q.cls} "${q.text}"`);
      fails.push(`${place} has ${r.thin} text run${r.thin===1?"":"s"} under 4.0:1 (worst ${r.worst.ratio}:1 "${r.worst.text}")`);
    }
  }

  /* ---- 2. no name may reach an SVG presentation attribute ----
     var() is not valid in fill="" or stroke="" — the browser drops the whole attribute and the
     shape renders as nothing at all, with no error anywhere. Naming the colours nearly cost the
     crest exactly this way: four of the fourteen house colours happened to equal palette values,
     were folded into names, and the Crest paints them with fill={c1}. A crest that does not draw
     is a silent fault; this makes it a loud one. */
  await tab(p, "ludus"); await dismiss(); await p.waitForTimeout(200);
  const svg = await p.evaluate(`(()=>{
    const bad = [];
    for(const el of document.querySelectorAll("svg [fill],svg [stroke],svg[fill],svg[stroke]")){
      for(const a of ["fill","stroke"]){
        const v = el.getAttribute(a);
        if(v && v.includes("var(")) bad.push(el.tagName + "@" + a + "=" + v.slice(0,30));
      }
    }
    return { bad: bad.slice(0,5), n: bad.length, crests: document.querySelectorAll("svg path[fill]").length };
  })()`);
  lines.push(`svg attributes: ${svg.n} carrying var() (must be 0), ${svg.crests} painted paths on the page`);
  for(const b of svg.bad) lines.push(`    var() in an svg attribute: ${b}`);
  if(svg.n) fails.push(`${svg.n} svg fill/stroke attribute${svg.n===1?"":"s"} carry var() — those shapes are not drawing`);

  /* ---- 3. the colourblind remap, on both grounds ---- */
  const cb = await p.evaluate(`(()=>{
    const sh = document.querySelector("[data-place]");
    const read = () => getComputedStyle(sh).getPropertyValue("--laurel").trim();
    const before = read();
    sh.classList.add("cb");
    const after = read();
    sh.classList.remove("cb");
    return { before, after };
  })()`);
  /* measured on the ludus, where the svg pass left us — the remap must hold on either ground */
  lines.push(`colourblind: --laurel ${cb.before} -> ${cb.after} (on the night ground)`);
  if(cb.after === cb.before)
    fails.push("the colourblind pref no longer moves --laurel — the remap left cbc() for the palette and nothing carried it");

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
