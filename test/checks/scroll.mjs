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
import { found, tab, clearAll, settle } from "../harness.mjs";

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
  { key:"armory", face:/armoury/i,  maxBtn:20, max:3.0, why:"a ledger page of racks; 2.4 measured at v3.96.0, was 5.7" },
  { key:"arena",  face:null,        maxBtn:14, max:3.0, why:"three towns and the pits; 2.2 measured" },
  /* EARNED DOWN, the way bulk's allowances are. This was 4.4 when a man on the block was 490px
     and four of them were two thirds of the page. The row put his six numbers on the line and
     the rest behind it: 2.1 measured. Leaving 4.4 would hand the page two screens of silent
     headroom and this ceiling would stop meaning anything. */
  { key:"market", face:null,        maxBtn:14, max:2.9, why:"the block, the staff and the slavers; 2.1 measured at v3.97.0, was 3.5 here and 4.6 on a played house" },
  { key:"villa",  face:/the house/i,maxBtn:12, max:3.0, why:"2.0 measured; its length is collapsibles, which are already folded" },
  /* ---- AND THIS CEILING WAS SET FROM A NUMBER THAT WAS NEVER THE ROSTER'S ----
     6.2 came from "5.8 screens measured on a played yard", and that measurement was the ARMOURY
     wearing the roster's name — the sticky-face fault this check now guards against, recorded
     before the guard existed. Measured properly, a played six-man yard is 1,752px: 2.1 screens,
     at 174px a man. The roster was never the crowded room; the market was.
     Its length is still a function of the SAVE rather than the layout — one card per man — so the
     ceiling has to cover a full house: 174px a man against the cells' cap, plus the page's own
     chrome. 4.5 screens holds a dozen men with room to spare, and a card stays a card, because a
     card is what a man IS here. */
  { key:"men",    face:/roster/i,   max:4.5, why:"one card per man at 174px; 1.3 screens on a founding's three, 2.1 on a played six. The old 6.2 was the armoury's figure mislabelled" },
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
    /* every number below is a pixel, and `.leaf` turns the page for 420ms on a tab change — the
       240ms above was short, so a room with no face was measured mid-rotation. See `settle`. */
    await settle(p);

    const m = await p.evaluate(`(()=>{
      const wrap = document.querySelector(".scroll > div");
      const btns = [...document.querySelectorAll(".scroll button")];
      /* ---- A RECT IS NOT VISIBILITY ----
         The first version of this counted a button as on-screen if its bounding rect had any
         size, and that over-reported for two releases: Chrome hides a closed <details>'s
         contents WITHOUT zeroing its descendants' rects. The villa's House Colours section
         measured 44px tall inside a 1,155px page while its .sectbody still reported a 951px
         box and every one of its 47 swatches a 44x44 rect — so folding the whole villa away
         changed the page height by 503px and the button count by nothing, which is what gave
         the fault away. Ask the ancestor, not the geometry.
         And the first correction over-shot the other way: a control inside a folded row's
         SUMMARY is on screen — that is where the block keeps its buy button, and excluding it
         reported the market as carrying two. A closed details hides its body, not its summary. */
      const seen = el => {
        const d = el.closest("details:not([open])");
        if(d){
          const sum = el.closest("summary");
          if(!sum || sum.parentElement !== d) return false;
        }
        const q = el.getBoundingClientRect();
        return q.width > 0 && q.height > 0;
      };
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
    /* ---- AND A SECOND CEILING, ON CHOICES ----
       Screens are not the only way a page crowds. The villa was TWO screens and carried
       FIFTY-FIVE buttons, forty-seven of them colour swatches, because its sections opened
       themselves on arrival — a short page can still hand the reader a wall of choices. This
       counts what is actually on screen (see `seen` above, which had to be taught the
       difference twice) and holds each room to a number. `men` has none: its controls are one
       card per man, so its count is a fact about the SAVE, not the layout. */
    if(r.maxBtn && m.buttons > r.maxBtn)
      fails.push(`${r.key} puts ${m.buttons} buttons on screen at once, past the ${r.maxBtn} it is allowed — a short page can still be a crowded one`);
    if(screens > r.max)
      fails.push(`${r.key} is ${screens.toFixed(1)} screens, past the ${r.max.toFixed(1)} it is allowed — ${r.why}`);
    /* a ledger page whose rows all arrive open is a ledger page in name only */
    if(m.entries && m.entriesOpen === m.entries && m.entries > 2)
      fails.push(`${r.key}: all ${m.entries} entry rows arrive open, which is the long page again under a new class`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
