/* THE SCROLL — how many screens a room costs to read

   The armoury was 4,821px on an 844px screen: five and a half screens of continuous scroll, and
   the cost was not prose. Thirty-one buttons came to 1,426px of it, because every piece of gear
   carried a full-width BUY button whether or not you were considering it. v3.96.0 made the rack
   a ledger page — name, dotted leader, sum, one line each — and it came to 2,061px.

   That is the kind of number that creeps back. A page grows one panel at a time, each addition
   defensible on its own, and nobody measures the total until it is six screens again. So the
   rooms are measured here with a ceiling on each, in screens rather than pixels because a screen
   is the unit the reader actually pays in.

   INSTRUMENT NOTE, off this project's record: the armoury is a FACE of the men tab and shares
   its header, so the two pages measured identically at 4,821 and 4,875 and it looked at first
   like the chip had failed to land. It had not — what differs between them is below the fold.
   The check asserts it is on the face it thinks it is before it believes a number.
*/
import { found, tab, clearAll } from "../harness.mjs";

export const name = "scroll";
export const describe = "no room costs more screens to read than it is allowed";

/* Ceilings in screens of 844px. Each is the measured figure plus room to breathe — the point is
   to catch drift, not to freeze a layout. Raise one only with the reason, as bulk's are raised. */
/* `face` is the chip this room must be showing before its number means anything. THE FACE IS
   STICKY: mView survives leaving the tab and coming back, so measuring men straight after the
   armoury measures the ARMOURY under the name "men" — 17 entry rows and 2.5 screens, which is
   the rack's figure wearing the roster's label. Each room now names its face, clicks it, and
   asserts it landed. */
const ROOMS = [
  { key:"armory", face:/armoury/i,  max:3.0, why:"a ledger page of racks; 2.4 measured at v3.96.0, was 5.7" },
  { key:"arena",  face:null,        max:3.0, why:"three towns and the pits; 2.2 measured" },
  { key:"market", face:null,        max:4.4, why:"the block, the staff and the slavers — people, not priced objects, and a man for sale needs his stats visible to be compared. 3.6 measured" },
  { key:"villa",  face:/the house/i,max:3.0, why:"2.0 measured; its length is collapsibles, which are already folded" },
  /* the roster is the one room whose length is a function of the SAVE, not the layout: one card
     per man. This check founds its own house, so it reads 1.3 screens on the three men it starts
     with; the ceiling is set for a full yard (the 5.8 screens a played house measured), and it is
     deliberately loose because a card is what a man IS here. The honest way down, if it is ever
     wanted, is fewer words per card — not folding the men away behind rows. */
  { key:"men",    face:/roster/i,   max:6.2, why:"one card per man; 1.3 screens at founding here, 5.8 measured on a full yard" },
];
const SCREEN = 844;

export async function run({ p, errors }){
  const lines = [], fails = [];
  await found(p, { seed:"SCROLL" });
  await clearAll(p);
  await p.waitForTimeout(250);

  const dismiss = async () => { for(let i=0;i<4;i++){
    if(!await p.evaluate(()=>!!document.querySelector(".modalwrap"))) return;
    if(!await p.evaluate(()=>{ const b=[...document.querySelectorAll(".modalwrap button")]
      .find(x=>/think again|close|not now|leave it/i.test((x.innerText||"")+(x.getAttribute("aria-label")||"")));
      if(b){ b.click(); return true; } return false; })) await p.keyboard.press("Escape");
    await p.waitForTimeout(200); } };

  for(const r of ROOMS){
    if(!await tab(p, r.key)){ fails.push(`could not reach ${r.key}`); continue; }
    await dismiss(); await p.waitForTimeout(240);
    /* put the room on the face this row is about, whatever the last row left showing */
    if(r.face){
      await p.evaluate(src=>{ const rx = new RegExp(src, "i");
        const c = [...document.querySelectorAll("button[role=tab]")]
          .find(b => rx.test((b.innerText||"") + " " + (b.getAttribute("aria-label")||"")));
        if(c) c.click(); }, r.face.source);
      await p.waitForTimeout(260);
    }

    const m = await p.evaluate(`(()=>{
      const wrap = document.querySelector(".scroll > div");
      const btns = [...document.querySelectorAll(".scroll button")];
      const seen = el => { const q = el.getBoundingClientRect(); return q.width > 0 && q.height > 0; };
      const es = [...document.querySelectorAll("details.entry")];
      return {
        place: document.querySelector("[data-place]").getAttribute("data-place"),
        face: (()=>{ const c=[...document.querySelectorAll("button[role=tab]")].find(b=>/\\bon\\b/.test(b.className));
                     return c ? (c.innerText||"").trim().slice(0,20) : null; })(),
        px: wrap ? Math.round(wrap.getBoundingClientRect().height) : 0,
        buttons: btns.filter(seen).length,
        entries: es.length,
        entriesOpen: es.filter(e=>e.open).length,
      };
    })()`);

    /* the armoury is a face of men — assert the face, not just the tab, before trusting the number */
    const wantPlace = r.key === "armory" ? "men" : r.key;
    if(m.place !== wantPlace){
      fails.push(`${r.key} measured on "${m.place}", not "${wantPlace}" — the number would be another room's`);
      continue;
    }
    if(r.face && !r.face.test(m.face || "")){
      fails.push(`${r.key}: wanted the ${r.face.source} face, the page is showing "${m.face}" — the armoury and the roster are both the men tab and their numbers look alike, so this is asserted rather than assumed`);
      continue;
    }

    const screens = m.px / SCREEN;
    lines.push(`${r.key.padEnd(7)} ${String(m.px).padStart(5)}px = ${screens.toFixed(1)} screens (max ${r.max.toFixed(1)}) · ${m.buttons} buttons on screen`
      + (m.entries ? ` · ${m.entries} entry rows, ${m.entriesOpen} open` : ""));
    if(screens > r.max)
      fails.push(`${r.key} is ${screens.toFixed(1)} screens, past the ${r.max.toFixed(1)} it is allowed — ${r.why}`);
    /* a ledger page whose rows all arrive open is a ledger page in name only */
    if(m.entries && m.entriesOpen === m.entries && m.entries > 2)
      fails.push(`${r.key}: all ${m.entries} entry rows arrive open, which is the long page again under a new class`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
