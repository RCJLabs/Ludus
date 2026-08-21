/* THE SAME PRICE WRITTEN TWICE — the class, guarded, after six instances of it.

   #150, #162, #165, #160, #166 and #174 are one fault six times: a number the engine rolls, written
   again somewhere that only DISPLAYS or GATES it. Every one of them was invisible until the two
   copies stopped agreeing, and then the panel offered a press the engine refused, or quoted a price
   it would not charge.

   Like `layers`, this reads the SOURCE rather than the screen, because that is the only place the
   fault exists — on screen the copies agree right up until they do not.

   WHAT IT LOOKS FOR is arithmetic of the shape `<number> + <field>*<number>`, which is how every
   price, wage, fee and fine in this file is written. It reports one that appears on BOTH SIDES of
   the App boundary (`export default function App`), or in both the engine and the reference player
   — the rope is a consumer of the engine exactly the way the panel is, and #174's own sweep missed
   its copy of `160 + fame*0.5` by walking `src/ludus.jsx` alone and reporting five where there were
   six.

   IT DOES NOT FAIL ON ENGINE-INTERNAL REPEATS, and it prints them instead. `55 + end*0.6` is written
   six times across the four fight engines and `1 + mods.atk*0.7` four times.

   ---- AND THEY ARE NOT THE SAME FAULT, WHICH THIS COMMENT USED TO CLAIM — #178 ----
   The sentence here read "they are the same failure mode at a different altitude", and that framing
   opened an item. Measuring it closed the item against the framing. What makes the class above
   dangerous is that a CONSUMER — a panel, a gate, a reference player — silently stops agreeing with
   what the engine will do, so a price is quoted that will not be charged or a press is offered that
   will be refused. There is an observer being misled, and that is the whole harm.
   Six engines each computing a fighter's starting stamina have no observer between them. A
   divergence there would be a DESIGN DECISION — melee wanting tougher men than venatio is a thing
   somebody might choose — not a fault. The evidence matches: across every release in the repository,
   v3.2.0 to v3.71.0, the six sites have **never** differed, where #174's single cross-boundary copy
   had already drifted (unrounded against the engine's `rnd`, disagreeing on every odd fame). And no
   consumer outside `src/ludus.jsx` holds a copy of any of them.
   So the list below is a REPRICING MAP and not a fault list: it says where a change to one of these
   numbers would have to be made in more than one place. Read it that way. It is still worth printing
   every run, because a number that grows is a number worth looking at.

   THE FILTER TRACKS BLOCK-COMMENT STATE rather than line shape, and that is not a detail: this
   file's comments are indented prose whose continuation lines start with words, so a version that
   skipped only lines BEGINNING with a marker counted four paragraphs describing #174's price as four
   copies of it. The sweep was reporting its own documentation. */

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

export const name = "copies";
export const describe = "no price is written on both sides of the App boundary, or in both the engine and the rope";

/* strip comments, keep everything else — a `${rnd(160+S.fame*0.5)}` inside a template literal is
   code, and is exactly where four of #174's six copies lived */
function strip(txt){
  const out = [];
  let inBlock = false;
  for(const raw of txt.split("\n")){
    let code = "";
    for(let j = 0; j < raw.length; j++){
      if(inBlock){ if(raw[j] === "*" && raw[j+1] === "/"){ inBlock = false; j++; } continue; }
      if(raw[j] === "/" && raw[j+1] === "*"){ inBlock = true; j++; continue; }
      if(raw[j] === "/" && raw[j+1] === "/") break;
      code += raw[j];
    }
    out.push(code);
  }
  return out;
}

const RE = /(\d+(?:\.\d+)?)\s*\+\s*([A-Za-z_$][\w$.]*)\s*\*\s*(\d+(?:\.\d+)?)/g;
/* the holder is not part of the price: d.fame, S.fame and f.end are the same field on different
   states, and a copy that changed only the holder is still a copy */
const keyOf = m => `${m[1]} + ${m[2].replace(/^[A-Za-z_$][\w$]*\./, "")}*${m[3]}`;

export async function run(){
  const srcPath = path.join(ROOT, "src", "ludus.jsx");
  const ropePath = path.join(ROOT, "test", "harness.mjs");
  const src = strip(fs.readFileSync(srcPath, "utf8"));
  const rope = strip(fs.readFileSync(ropePath, "utf8"));

  const appAt = src.findIndex(l => /export default function App/.test(l));
  if(appAt < 0) return { pass:false, why:"no `export default function App` in src/ludus.jsx", lines:[] };

  const seen = new Map();   /* key -> { engine:[], panel:[], rope:[] } */
  const note = (key, where, line) => {
    if(!seen.has(key)) seen.set(key, { engine:[], panel:[], rope:[] });
    seen.get(key)[where].push(line);
  };
  src.forEach((line, i) => { for(const m of line.matchAll(RE))
    note(keyOf(m), i < appAt ? "engine" : "panel", i + 1); });
  rope.forEach((line, i) => { for(const m of line.matchAll(RE))
    note(keyOf(m), "rope", i + 1); });

  const lines = [], fails = [];
  lines.push(`the App boundary is src/ludus.jsx:${appAt + 1}; `
    + `${seen.size} distinct price-shaped expressions, ${src.length + rope.length} lines scanned`);

  /* ---- the fault: one price on both sides of a boundary ---- */
  for(const [key, at] of seen){
    const sides = [];
    if(at.engine.length) sides.push(`engine ${at.engine.join(",")}`);
    if(at.panel.length)  sides.push(`panel ${at.panel.join(",")}`);
    if(at.rope.length)   sides.push(`rope ${at.rope.join(",")}`);
    if(at.engine.length && at.panel.length)
      fails.push(`\`${key}\` is written in the engine AND the panel — ${sides.join(" · ")}`
        + ` — the panel must read the engine's function, not the arithmetic (#174)`);
    else if(at.engine.length && at.rope.length)
      fails.push(`\`${key}\` is written in the engine AND the reference player — ${sides.join(" · ")}`
        + ` — the rope must read the engine's function, not the arithmetic (#174)`);
    else if(at.panel.length && at.rope.length)
      fails.push(`\`${key}\` is written in the panel AND the reference player — ${sides.join(" · ")}`);
  }

  /* ---- and the same shape one altitude down, reported rather than failed ---- */
  const inside = [...seen.entries()]
    .filter(([,at]) => at.engine.length > 1 && !at.panel.length && !at.rope.length)
    .sort((a,b) => b[1].engine.length - a[1].engine.length);
  if(inside.length){
    lines.push(`${inside.length} written more than once INSIDE the engine — a REPRICING MAP, not a `
      + `fault list (#178): no consumer sits between two engines, so a divergence here would be a `
      + `design decision. Where a change would have to be made twice:`);
    for(const [key, at] of inside.slice(0, 6))
      lines.push(`   ${key.padEnd(22)} ${at.engine.length} sites — ${at.engine.join(", ")}`);
  } else lines.push("nothing is written more than once inside the engine either");

  if(!fails.length) lines.push("no price crosses the App boundary or reaches the rope as arithmetic");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
