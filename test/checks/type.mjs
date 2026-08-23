/* THE FACES, AND WHETHER THE PAGE IS ACTUALLY DRAWN IN THEM

   The game asked for three families through a Google Fonts at-import and never received one of
   them. At-import must precede every other rule in a stylesheet; it sat on line 8, under
   `*,*::before,*::after{box-sizing:border-box}`, so every browser dropped it in silence. Measured
   on the shipped build: ZERO requests to fonts.googleapis.com and `document.fonts` empty. Cinzel
   is on every button, tag, display heading and tab label; Cormorant Garamond is the body; IM Fell
   English is `.hand`, the parchment ledger's whole voice. All three had been falling back to bare
   `serif` and Georgia since the day they were named — through the entire ledger reskin, which is a
   typographic decision, taken against type nobody had ever seen.

   WHY NOTHING CAUGHT IT, AND WHY THIS CHECK DOES NOT ASK THE OBVIOUS QUESTION.
   `document.fonts.check("16px 'Cinzel'")` returns TRUE for a family that was never requested — the
   spec assumes an unlisted family is a system font. The one API you would reach for to test this
   confirms the bug is absent. `getComputedStyle().fontFamily` is worse: it reports the declared
   STACK, which is a string in the source, not a fact about the page.

   So this asks the browser what it actually PAINTED, through CDP's CSS.getPlatformFontsForNode —
   which returns the resolved family per node with a glyph count, and marks whether it is a custom
   font. That is the only reading here that cannot be satisfied by a fallback.

   AND THE ELEMENT HAS TO BE VISIBLE. A folded <details> paints no glyphs, so CDP honestly reports
   "(none)" for a perfectly good element — the motto lives inside a section and every section ships
   shut since v3.98.0, which cost this check a false negative on its first run. Sections are opened
   before anything is asked.
*/
import { found, clearAll, tab, forge, settle } from "../harness.mjs";

export const name = "type";
export const describe = "the page is drawn in the faces it names, and they come from the file";

/* every family the stylesheet names, the selector that carries it, and the face it must resolve to */
const WANT = [
  { sel:".disp",  family:/cinzel/i,             what:"display headings" },
  { sel:".tag",   family:/cinzel/i,             what:"tags" },
  { sel:".hand",  family:/fell/i,               what:"the motto, in the hand" },
];

export async function run({ p, errors }){
  const lines = [], fails = [];

  /* ---- 1. NOTHING MAY BE FETCHED. The faces are embedded so the offline shell is honest ---- */
  const reached = [];
  p.on("request", r=>{ const u = r.url();
    if(/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u)) reached.push(u.slice(0,60)); });

  await found(p, { seed:"TYPE" });
  await clearAll(p);
  await forge(p, (A, R) => { const d = A.newGameState("Type","clean","TYPE",null);
    d.crest = Object.assign({}, d.crest || {}, { motto:"Ferrum ante aurum" });
    return d; });
  await clearAll(p, 8);

  /* ---- 2. the faces are declared, and they are declared as DATA ---- */
  const faces = await p.evaluate(()=>{
    const out = [];
    for(const sh of document.styleSheets){
      let rules; try { rules = sh.cssRules; } catch(e){ continue; }
      for(const r of rules || []){
        if(r.constructor.name !== "CSSFontFaceRule" && r.type !== 5) continue;
        const src = r.style.getPropertyValue("src") || "";
        out.push({ family:(r.style.getPropertyValue("font-family")||"").replace(/["']/g,""),
                   style:r.style.getPropertyValue("font-style") || "normal",
                   weight:r.style.getPropertyValue("font-weight") || "400",
                   embedded: src.indexOf("data:") >= 0, bytes: src.length });
      }
    }
    return out;
  });
  lines.push(`@font-face rules: ${faces.length ? faces.map(f=>`${f.family} ${f.style} ${f.weight}${f.embedded?"":" *** LINKED ***"}`).join(" · ") : "(none at all)"}`);
  if(!faces.length)
    fails.push("no @font-face rule in the page at all — the faces are being asked for by a link again, or by an at-import that a browser will drop");
  for(const f of faces) if(!f.embedded)
    fails.push(`${f.family} ${f.style} is linked rather than embedded — the build writes an offline shell and this makes it a lie`);

  /* ---- 3. AND THE BROWSER ACTUALLY PAINTED THEM ---- */
  const cdp = await p.context().newCDPSession(p);
  await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
  const painted = async sel => {
    const { root } = await cdp.send("DOM.getDocument");
    const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: sel });
    if(!nodeId) return null;
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    return fonts || [];
  };

  for(const w of WANT){
    /* the villa carries the motto; the ludus carries the rest. Go everywhere, open everything. */
    for(const where of ["villa", "ludus"]){
      await tab(p, where); await p.waitForTimeout(320); await settle(p);
      await p.evaluate(()=>document.querySelectorAll("details").forEach(d=>d.open = true));
      await p.waitForTimeout(320);
      const got = await painted(w.sel);
      if(got && got.length) {
        const say = got.map(f=>`${f.familyName}${f.isCustomFont?"":" (system)"} x${f.glyphCount}`).join(", ");
        lines.push(`${w.what.padEnd(24)} ${w.sel.padEnd(7)} drawn in ${say}`);
        if(!got.some(f=>w.family.test(f.familyName)))
          fails.push(`${w.what} (${w.sel}) is drawn in ${say} — the face it names is not the face on the page, which is exactly the shape of the at-import that never loaded`);
        else if(!got.some(f=>w.family.test(f.familyName) && f.isCustomFont))
          fails.push(`${w.what} (${w.sel}) matched by name but the browser calls it a system font — it is not coming from the file`);
        break;
      }
      if(where === "ludus")
        fails.push(`no ${w.sel} was painted anywhere — either it is gone from the page or it is folded away, and a folded element paints no glyphs`);
    }
  }

  /* ---- 4. THE HAND HAS TO BE SOMEWHERE WORTH 54KB ----
     IM Fell English is 46% of the embedded type and was on exactly TWO elements when the faces
     went in — the motto and the doctore's word on the week — which is a lot of bytes for a face
     nobody meets. The stylesheet's own rule says where it belongs: "what the doctore says, and
     the notes in the margin", and the margin notes are the three voices a candidate's row already
     names — the rumour, the seller's patter, the doctore's opinion. So the block is where the
     hand has to show up, or the second half of that sentence has come unwired again. */
  await tab(p, "market"); await p.waitForTimeout(340); await settle(p);
  await p.evaluate(()=>document.querySelectorAll("details").forEach(d=>d.open = true));
  await p.waitForTimeout(340);
  const hands = await p.evaluate(()=>[...document.querySelectorAll(".hand")]
    .filter(e=>(e.innerText||"").trim()).map(e=>(e.innerText||"").trim().slice(0,40)));
  lines.push(`the hand on the block: ${hands.length} element${hands.length===1?"":"s"}${hands.length?` — e.g. "${hands[0]}"`:""}`);
  if(hands.length < 4)
    fails.push(`only ${hands.length} elements on the block are set in the hand — IM Fell English is 46% of the embedded type and the stylesheet says the margin notes carry it; the rumour, the patter and the doctore's read have come unwired`);
  else {
    const got = await painted(".hand");
    const say = (got||[]).map(f=>`${f.familyName} x${f.glyphCount}`).join(", ");
    if(!(got||[]).some(f=>/fell/i.test(f.familyName)))
      fails.push(`the block's margin notes are drawn in ${say || "nothing"} rather than IM Fell — the hand is declared and not delivered`);
  }

  /* ---- 5. and after all that, still nothing fetched ---- */
  lines.push(`requests to the font hosts: ${reached.length ? reached.join(" · ") : "none — the faces came from the file"}`);
  if(reached.length)
    fails.push(`the page fetched ${reached.length} font resource(s) from Google — the offline shell cannot promise what the network is holding`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
