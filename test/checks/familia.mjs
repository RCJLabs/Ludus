/* A ROW OF MEN LOOKS LIKE MEN, AND THE BLOCK STILL KEEPS ITS SECRETS

   Audit item #214: "a man's own drawing lives on his page only. The roster rows and the block are
   name + tags + bars … a glance at the familia should look like a yard, and an infirmary row
   should LOOK hurt." TRUE, and worse than stated. `ScnMan` — twenty-two distinct drawings after
   v3.144.0 — had exactly ONE call site in the program: the yard band of the drawn ludus, capped at
   six men. Measured on a nine-man house at week 71 (`probes/familia.mjs`):

     9 rows · 51 tags · 190 words · 4 bars a row · ZERO drawn shapes

   Every axis the figure carries already had a tag, so the case for drawing him was never that the
   information was missing. It is that twenty tags is not a glance.

   From v3.162.0 the same figure stands on every roster row and every block row. The page grew
   3,003 -> 3,066px — seven pixels a row — and the median row did not move at all.

   THE ARM THAT MATTERS IS THE THIRD ONE. On the block you are looking at a man you have not
   bought and may not have scouted; `readLevel` is the whole design of that page. The figure draws
   renown as the reach of his shadow, the men he has killed as its darkness, and his wins as the
   palm over his shoulder — three facts that are NOT yours to know about a stranger. `noRec` drops
   all three, and this check plants the same man twice with opposite records to prove it, because
   a leak like that is invisible in a diff and permanent once shipped.

   FIVE ARMS:
   1 · EVERY ROW DRAWS A MAN. A roster row and a block row each carry a glyph with real shapes in it.
   2 · AND THE GLYPHS ARE NOT ALL THE SAME PICTURE. Men who differ must draw differently, or this
       is decoration that costs 3,000 elements and says nothing.
   3 · THE BLOCK DOES NOT LEAK. Two block men identical but for wins, kills and renown must draw
       BYTE-IDENTICAL glyphs. On the roster, that same pair must draw DIFFERENTLY — the paired
       assertion is what stops arm 3 passing because the glyph ignores the record everywhere.
   4 · NO CONTROL INSIDE A CONTROL. The glyph is `aria-hidden` and holds nothing focusable and no
       `.scn` hotspot: the row is already a button, and `scene` counts `.scn`.
   5 · AND ENOUGH MEN WERE SEEN TO MEAN ANY OF IT. */
import { found, clearAll, installRope, forge, tab, settle } from "../harness.mjs";

export const name = "familia";
export const describe = "a row of men looks like men, and the block still keeps its secrets";
export const slow = true;   /* plays a house, then plants a matched pair on both pages */

/* the record the leak arm moves: the top of every scale the drawing reads */
const LOUD = { wins: 40, kills: 9, pfame: 585 };
const MUTE = { wins: 0,  kills: 0, pfame: 0   };

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"GLANCE-1" });
  await clearAll(p, 14);
  await installRope(p);

  /* ---- ONE PLAYED HOUSE, BUILT BEFORE IT IS PLANTED ----
     Doing the play inside `forge`'s builder runs hundreds of weeks between the write and the
     reload, and the app's 500ms autosave lands in that window and overwrites the plant. */
  const st = await p.evaluate(([MUTE_, LOUD_])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    let best = null;
    for(const tag of ["A","B","C","D"]){
      const d = A.newGameState("Glance", "clean", "GLANCE-"+tag, null);
      for(let w=0; w<60; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
      if(d.over) continue;
      const n = d.gladiators.filter(g=>!A.isGone(g)).length;
      if(!best || n > best.n) best = { d, n };
    }
    if(!best) return null;
    const d = best.d;
    /* ---- THE MATCHED PAIR, on both pages ----
       The same man twice, differing ONLY in the three facts the block must not tell you. Cloned
       from a real man so every other axis — class, scars, kit, sex — is identical by construction
       rather than by a list of fields somebody remembered to copy. */
    const seed = d.gladiators.find(g=>!A.isGone(g));
    if(!seed) return null;
    const twin = (tag, rec) => Object.assign(JSON.parse(JSON.stringify(seed)),
      { id: 900000 + tag, name: "Twin" + tag, nick: null, named: null, injury: null, status:"active",
        fatigue: 10, scars: [] }, rec);
    d.gladiators.push(twin(1, MUTE_), twin(2, LOUD_));
    d.market = [twin(3, MUTE_), twin(4, LOUD_)].map(g=>Object.assign(g,
      { price: 400, scouted: false, soldOn: null, slaver: null, contested: null }));
    return { d, n: best.n };
  }, [MUTE, LOUD]).catch(()=>null);
  if(!st) return { pass:false, why:`no fixture house survived — nothing was measured`, lines };

  await forge(p, (A, R, arg) => ({ plant: arg.d }), st);
  await clearAll(p, 14);

  const read = async (what) => {
    await tab(p, what === "roster" ? "men" : "market");
    await p.waitForTimeout(500); await clearAll(p, 8); await settle(p);
    return p.evaluate((what)=>{
      const rows = what === "roster"
        ? [...document.querySelectorAll("button.panel")].filter(b=>b.querySelector(".tag") && b.querySelector(".disp"))
        : [...document.querySelectorAll("details.entry.card")];
      return rows.map(b=>{
        const svg = b.querySelector("svg.manglyph");
        const name = (b.querySelector(".disp")||{}).innerText || "";
        return { name: String(name).trim(),
          has: !!svg,
          shapes: svg ? svg.querySelectorAll("*").length : 0,
          hidden: svg ? svg.getAttribute("aria-hidden") === "true" : null,
          scn: svg ? svg.querySelectorAll(".scn").length : 0,
          focusable: svg ? svg.querySelectorAll("[tabindex],button,a,input").length : 0,
          ink: svg ? svg.innerHTML : null };
      });
    }, what);
  };

  const ros = await read("roster"), blk = await read("block");
  if(!ros.length) return { pass:false, why:`no roster rows on the familia page — the selector found nothing`, lines };
  if(!blk.length) return { pass:false, why:`no block rows on the market page — the selector found nothing`, lines };

  const drawn = a => a.filter(x=>x.has && x.shapes > 0).length;
  const distinct = a => new Set(a.filter(x=>x.ink).map(x=>x.ink)).size;
  lines.push(`the roster: ${ros.length} rows, ${drawn(ros)} draw a man, ${distinct(ros)} distinct drawings`);
  lines.push(`the block:  ${blk.length} rows, ${drawn(blk)} draw a man, ${distinct(blk)} distinct drawings`);

  /* CASE-FOLDED, because `.disp` is CSS-uppercased and `innerText` returns what is PAINTED, not
     what was written — the same trap that let `dense`'s named guard pass its own sabotage. */
  const pair = (a, mute, loud) => {
    const has = (r, n) => new RegExp("^twin" + n + "\\b", "i").test(r.name);
    const x = a.find(r=>has(r,mute)), y = a.find(r=>has(r,loud));
    return (x && y) ? { same: x.ink === y.ink, x, y } : null;
  };
  const rp = pair(ros, 1, 2), bp = pair(blk, 3, 4);
  lines.push(`the matched pair — the same man with ${LOUD.wins} wins, ${LOUD.kills} kills and ${LOUD.pfame} renown against none:`);
  lines.push(`  on the roster they draw ${rp ? (rp.same ? "THE SAME" : "differently") : "— not found"}`
    + ` · on the block they draw ${bp ? (bp.same ? "the same" : "DIFFERENTLY") : "— not found"}`);

  /* 1 — every row draws a man */
  if(drawn(ros) < ros.length)
    bad.push(`${ros.length - drawn(ros)} of ${ros.length} roster rows draw no man — the familia is back to tags`);
  if(drawn(blk) < blk.length)
    bad.push(`${blk.length - drawn(blk)} of ${blk.length} block rows draw no man`);
  /* 2 — and not all the same picture */
  if(ros.length >= 3 && distinct(ros) < 2)
    bad.push(`all ${ros.length} roster glyphs are the same drawing — the figure is decoration, not a reading`);
  /* 3 — the leak, and its pair */
  if(!rp) bad.push(`the matched pair never reached the roster — arm 3 measured nothing`);
  else if(rp.same)
    bad.push(`on the ROSTER the same man with ${LOUD.wins} wins and ${LOUD.kills} kills draws identically to one with `
      + `none — his record is not reaching his own drawing, so arm 3's block half proves nothing`);
  if(!bp) bad.push(`the matched pair never reached the block — the leak arm measured nothing`);
  else if(!bp.same)
    bad.push(`ON THE BLOCK a man's wins, kills and renown are IN HIS DRAWING — that is past \`readLevel\`, `
      + `which is the whole design of that page, and it is information the player has not bought`);
  /* 4 — no control inside a control */
  for(const [what, a] of [["roster", ros], ["block", blk]]) for(const x of a){
    if(x.has && x.hidden !== true) bad.push(`a ${what} glyph is not aria-hidden — the row already reads out his name and class`);
    if(x.scn) bad.push(`a ${what} glyph carries ${x.scn} .scn hotspot(s) inside a row that is already a control`);
    if(x.focusable) bad.push(`a ${what} glyph holds ${x.focusable} focusable element(s) inside a control`);
  }
  /* 5 — and enough was seen to mean anything */
  if(ros.length < 4) bad.push(`only ${ros.length} roster rows were rendered — too few to say the glyphs differ`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the familia looks like a yard, and the block draws a stranger as a stranger`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
