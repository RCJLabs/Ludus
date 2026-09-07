/* EVERY MAN WHO DOES NOT FIGHT — audit item #249, phase 2.

   (`faces` was free in both directories; checked before writing.)

   The item says "the doctore, the medicus, the armourer, the patrons, the wife, the children and
   every rival lanista are text", and asks for a shadow-figure apiece off the `.umbra` surface. Two
   things about that did not survive reading the file.

   THE DOCTORE WAS NOT TEXT. `DoctoreBust` had drawn him at two sites since it was written — a
   seeded head-and-shoulders in the same flat SVG as the fighters. What the item is right about is
   that it stopped there: the medicus and the armourer stood in rooms of their own with nothing but
   a name, and nine rival lanistae had a trait, a blurb, six multipliers and a crest, and no face.

   AND A LANISTA IS NOT A SHADOW. `.umbra` is a LIT GROUND for a shadow to be a shadow on, and what
   it carries is `Fighter` — a man in kit, in a pose, on the sand. Giving that silhouette to the
   medicus would say he fights. The vocabulary for a man who does not fight already existed, and the
   item's own risk note asks for exactly this: "stay inside the glyph vocabulary the figure already
   has". So the bust was generalised — `Bust`, taking the house's colour and the odds of a scar —
   rather than a pose set drawn, and the item's stated risk ("nine umbrae is a pose set") does not
   arise.

   FOUR ARMS, all read off the rendered DOM.

   1 · THE LANISTA HAS A FACE, AND IT WEARS HIS OWN COLOURS. The bust's shoulders must be filled
       with the crest ground phase 1 gave that house — which is what ties the two phases together
       and is the one thing here that can be checked against the model rather than against taste.
   2 · SO DO THE MEDICUS AND THE ARMOURER, who are the two the item was right about.
   3 · AND THE DOCTORE STILL WEARS THE PLAYER'S. Generalising a component that was already shipping
       for one man must not change that man: his call site passes no colour, so his shoulders are
       still the house's oxblood.
   4 · AND TWO MEN DO NOT HAVE THE SAME FACE. The whole drawing is seeded off the name; if that
       comes loose — a refactor that drops the argument, a default that swallows it — every bust in
       the game becomes one man, and nothing else here would notice. */
import { found, clearAll, installRope, tab, settle } from "../harness.mjs";

const OXBLOOD = "#8d3b2c";

export const name = "faces";
export const describe = "the men who do not fight have faces, and a rival lanista wears his own house's colours";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"FACES-1" });
  await clearAll(p, 10);
  await installRope(p);

  const want = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","crestOf","lanistaOf","bLevel"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const d = A.newGameState("Faces", "clean", "FACESCHK");
    for(let w=0; w<120; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    d.gold = 9000;
    d.buildings = Object.assign({}, d.buildings, { valetudinarium:2, armamentarium:2 });
    d.medicus  = { id:9001, name:"Philon", origin:"Kos",   skill:71, wage:16, fee:180, weeks:24 };
    d.armourer = { id:9002, name:"Rufio",  origin:"Capua", skill:58, wage:14, fee:150, weeks:11 };
    const live = (d.rivals||[]).filter(x=>!x.retired)[0];
    const keys = Object.keys(localStorage).filter(q=>/ludus-slot-\d/.test(q));
    const b = JSON.stringify(d); for(const k of keys) localStorage.setItem(k, b);
    const st = window.storage; if(st && !st.__facesShut){ const real = st.set.bind(st);
      st.set = (k,v)=>/ludus-slot-\d/.test(k)?Promise.resolve({key:k,value:v}):real(k,v); st.__facesShut = true; }
    return live ? { house:live.name, lanista:A.lanistaOf(live.name).name, ground:A.crestOf(live.name).c1,
      doctore: d.doctore ? d.doctore.name : null } : null;
  });
  if(!want) return { pass:false, why:(want && want.why) || "the played house has no live rival", lines };
  if(want.why) return { pass:false, why:want.why, lines };

  await p.reload({ waitUntil:"domcontentloaded" });
  await p.waitForTimeout(1100);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")].find(x=>/take up the keys/i.test(x.innerText||"")); if(b) b.click(); });
  await p.waitForTimeout(1100);
  await clearAll(p, 10);

  /* every bust on a page, with the name it sits beside and the colour of its shoulders */
  const readBusts = () => p.evaluate(()=>[...document.querySelectorAll('svg[viewBox="0 0 100 100"]')].map(v=>{
    const paths = [...v.querySelectorAll("path")];
    const shoulder = paths.find(x=>(x.getAttribute("d")||"").startsWith("M14,100"));
    let near = ""; let e = v.parentElement;
    for(let i=0;i<5&&e;i++){ const s=(e.innerText||"").replace(/\s+/g," ").trim(); if(s.length>2 && s.length<300){ near = s.slice(0,70); break; } e = e.parentElement; }
    return { ground: shoulder ? shoulder.getAttribute("fill") : null, near, ink: v.innerHTML.length };
  }));

  /* 2 & 3 · the staff rooms */
  let staff = [];
  for(const t of ["market","ludus","familia","villa","arena"]){
    await tab(p, t); await p.waitForTimeout(460); await clearAll(p, 8); await settle(p);
    await p.evaluate(()=>{ for(const d of document.querySelectorAll("details")) d.open = true; });
    await p.waitForTimeout(320);
    const b = await readBusts();
    if(b.length) staff = staff.concat(b.map(x=>Object.assign({ tab:t }, x)));
    if(staff.some(x=>/Philon/.test(x.near)) && staff.some(x=>/Rufio/.test(x.near))) break;
  }
  const byName = n => staff.find(x=>new RegExp(n).test(x.near));
  lines.push(`busts on the staff pages: ${staff.length} — ${staff.map(x=>`${(x.near.split(" ")[0]||"?")}:${x.ground}`).join(" · ")}`);
  for(const [who, nm] of [["the medicus","Philon"], ["the armourer","Rufio"]]){
    const f = byName(nm);
    if(!f) bad.push(`${who} (${nm}) has no bust — he stands in a room of his own with nothing but a name, which is what #249 was filed about`);
    else if(f.ground !== OXBLOOD)
      bad.push(`${who}'s shoulders are ${f.ground} and he is YOUR man — the house's own oxblood ${OXBLOOD} is what a hire of yours wears`);
  }
  /* ---- THE DOCTORE IS BEHIND THE DRAWN SQUARE, NOT IN A LIST ----
     The first draft swept the tabs for his bust, never found it, and PASSED — printing "his panel
     was not reached" and asserting nothing, which is the inert-arm shape this suite keeps catching.
     His panel is a hotspot in the drawn ludus: `ScnSquare` is a `role="button"` on the scene whose
     aria-label names him. It is opened here, so the arm bites. */
  if(want.doctore){
    await tab(p, "ludus"); await p.waitForTimeout(500); await clearAll(p, 8); await settle(p);
    const hit = await p.evaluate(()=>{ const g = [...document.querySelectorAll('[role="button"]')]
      .find(x=>/^The training square/i.test(x.getAttribute("aria-label")||""));
      if(!g) return false; g.dispatchEvent(new MouseEvent("click", { bubbles:true })); return true; });
    await p.waitForTimeout(800); await settle(p);
    const dcs = await readBusts();
    const dc = dcs.find(x=>new RegExp(want.doctore).test(x.near)) || dcs[0];
    lines.push(`  the doctore (${want.doctore}): ${hit ? "" : "the square would not open — "}`
      + `${dc ? `drawn, shoulders ${dc.ground}` : "NO BUST"}`);
    if(!hit) bad.push(`the training square would not open from the drawn ludus, so the doctore's face went unmeasured`);
    else if(!dc) bad.push(`the doctore has no bust on his own panel — he is the one man in this set who already had one, `
      + `and generalising the component for the others has taken his away`);
    else if(dc.ground !== OXBLOOD)
      bad.push(`the doctore's shoulders are ${dc.ground}, not the house's ${OXBLOOD} — generalising a component that was `
        + `already shipping for one man must not change that man`);
  }
  /* 4 · two men, two faces */
  const uniq = new Set(staff.map(x=>x.ink));
  if(staff.length >= 2 && uniq.size === 1)
    bad.push(`every bust on the page draws the same amount of ink (${[...uniq][0]}) — the whole figure is seeded off the `
      + `name, and if that has come loose every man in the game has one face`);

  /* 1 · the lanista, in his own colours */
  await tab(p, "villa"); await p.waitForTimeout(500); await clearAll(p, 8); await settle(p);
  await p.evaluate(()=>{ for(const d of document.querySelectorAll("details")) d.open = true; });
  await p.waitForTimeout(300);
  await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/^the houses(\n|$)/i.test((x.innerText||"").trim())); if(b) b.click(); });
  await p.waitForTimeout(900); await settle(p);
  const opened = await p.evaluate((house)=>{
    const btns = [...document.querySelectorAll("button")].filter(x=>/^treat$/i.test((x.innerText||"").trim()));
    const rx = new RegExp(house, "i");
    for(const b of btns){ let e=b;
      for(let i=0;i<5&&e;i++){ const s=(e.innerText||""); if(s.length>320) break;
        if(rx.test(s)){ b.click(); return true; } e=e.parentElement; } }
    return false; }, want.house);
  await p.waitForTimeout(800); await settle(p);
  const sheetBusts = await p.evaluate(()=>{ const m = document.querySelector(".modal"); if(!m) return null;
    return [...m.querySelectorAll('svg[viewBox="0 0 100 100"]')].map(v=>{
      const sh = [...v.querySelectorAll("path")].find(x=>(x.getAttribute("d")||"").startsWith("M14,100"));
      return sh ? sh.getAttribute("fill") : null; }); });

  if(!opened || !sheetBusts) bad.push(`House ${want.house}'s sheet did not open, so the lanista's face went unmeasured`);
  else {
    lines.push(`  ${want.lanista} of House ${want.house}: ${sheetBusts.length} bust${sheetBusts.length===1?"":"s"} `
      + `on his sheet, shoulders ${sheetBusts.join(", ") || "—"} [his crest ground is ${want.ground}]`);
    if(!sheetBusts.length)
      bad.push(`House ${want.house}'s sheet draws no face — nine lanistae have a trait, a blurb, six multipliers and a crest, `
        + `and the one screen that is about a single house shows none of him`);
    else if(sheetBusts[0] !== want.ground)
      bad.push(`${want.lanista}'s shoulders are ${sheetBusts[0]} and his crest ground is ${want.ground} — the face is supposed to `
        + `wear the colours phase 1 gave the house, and that is the one thing on this panel that can be checked against the model`);
  }

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the doctore in the house's colours, the medicus and the armourer beside him, and the lanista in his own`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
