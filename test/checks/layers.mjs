/* Every overlay declares its layer by name, and the names are ordered.

   This one reads the source rather than the screen, because the bug it guards
   against is invisible on screen until the two overlays happen to be open at the
   same moment. The week's digest at 58 painted over the answer to the question you
   had just been asked, which was sitting on the stylesheet's implicit 50 — eight
   hundred lines apart in the file, and nothing anywhere said which should win.

   So: no .modalwrap may carry a bare number, none may rely on the implicit
   default, and every name it uses must exist in Z. */

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

export const name = "layers";
export const describe = "no overlay writes a bare z-index, and every layer it names exists";

export async function run(){
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");

  /* the table itself */
  const table = src.match(/const Z = \{([\s\S]*?)\n\};/);
  if(!table) return { pass:false, why:"no Z table in src/ludus.jsx", lines:[] };
  const layers = {};
  for(const m of table[1].matchAll(/^\s*(\w+):\s*(\d+)/gm)) layers[m[1]] = +m[2];

  const lines = [`Z declares ${Object.keys(layers).length} layers: ` +
    Object.entries(layers).map(([k,v])=>`${k} ${v}`).join(" · ")];

  const fails = [];
  /* the ordering has to be strictly increasing, or a name tells you nothing */
  const vals = Object.values(layers);
  for(let i=1;i<vals.length;i++)
    if(vals[i] <= vals[i-1])
      fails.push(`Z is not in ascending order at "${Object.keys(layers)[i]}" (${vals[i]} after ${vals[i-1]})`);

  /* every overlay in the file */
  let bare = 0, implicit = 0, named = 0, unknown = [];
  for(const line of src.split("\n")){
    if(!line.includes('className="modalwrap"')) continue;
    const z = line.match(/zIndex:\s*(?:Z\.(\w+)|(\d+))/);
    if(!z){ implicit++; continue; }
    if(z[2] != null){ bare++; continue; }
    named++;
    if(!(z[1] in layers)) unknown.push(z[1]);
  }
  lines.push(`${named + bare + implicit} overlays: ${named} named, ${bare} bare numbers, ${implicit} relying on the stylesheet`);

  if(bare)     fails.push(`${bare} overlay(s) write a bare z-index instead of a name from Z`);
  if(implicit) fails.push(`${implicit} overlay(s) declare no layer at all and inherit the stylesheet's default`);
  for(const u of [...new Set(unknown)]) fails.push(`an overlay names Z.${u}, which is not in the table`);
  if(named + bare + implicit < 20) fails.push(`only found ${named+bare+implicit} overlays — the scan is probably broken, not the source`);

  /* the two that produced v2.18.1 must stay in the order that fixed it */
  if(layers.decide != null && layers.week != null && !(layers.decide > layers.week))
    fails.push(`Z.decide (${layers.decide}) is not above Z.week (${layers.week}) — the digest would cover the answer again`);

  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
