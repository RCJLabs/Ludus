/* WHAT A LIFTED PANEL CALLS THAT NOBODY GAVE IT — the check the face gate cannot be

   The overhaul moved all thirty-two `<Sect>` panels out of App into the SECT registry at module
   scope. A panel that reads a name App used to hold in its closure now gets nothing, and JavaScript
   does not say so until the moment that line runs.

   The face-walk gate (test/probes/faces.mjs) opens every face and every record sheet and catches
   this at RENDER time, which is most of it — JSX expressions are arguments to createElement, so
   they evaluate as the element is built. What it cannot catch is a name used only inside an EVENT
   HANDLER, because nothing runs a handler by rendering it. That is not hypothetical: the gate read
   36 of 36 sections and 0 page errors on a build where four handlers called names that were not
   passed, and it took `sweep` and `surface` failing on 18 page errors apiece to find them —
   `setSheet`, `setAsk`, `setAnnals` and `setShowChron`, every one behind an onClick.

   AND A STATIC CHECK HERE ONLY WORKS BECAUSE OF WHERE IT LOOKS. Two earlier attempts at a static
   scope checker were abandoned, and the reason both times was that these panels are mostly PROSE:
   "A burial society" matches a local called `A`, "every man on the roster" matches one called `on`,
   "not enough coin" matches `enough`. Four rounds of filtering got one section from 31 suspects to
   18 and the survivors were `him`, `at`, `freed`. So this does not match bare words. It matches
   CALL POSITION — `name(` — which English does not produce. That single restriction is what turns
   an unusable heuristic into a check with no false positives on this file.

   It reports names, not counts, and it names the section and the line, because the fix is always
   the same one line: add it to SX.
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const name = "scope";
export const describe = "no lifted section calls a name App never handed it";

export async function run(){
  const lines = [], fails = [];
  const L = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8").split("\n");
  const appi = L.findIndex(x => x.startsWith("export default function App"));
  const secti = L.findIndex(x => x.startsWith("const SECT = {"));
  if(appi < 0 || secti < 0 || secti > appi)
    return { pass:false, why:"could not find SECT and App — this check is reading the wrong shape", lines };

  /* every name App declares at its own top level, including the useState pairs, which are declared
     by destructuring and were invisible to the first version of this scan */
  const decl = new Set();
  for(const x of L.slice(appi)){
    let m = x.match(/^\s{2}const (\w+)\s*=/);            if(m) decl.add(m[1]);
    m = x.match(/^\s{2}const \[([^\]]*)\]\s*=/);         if(m) (m[1].match(/\w+/g)||[]).forEach(n=>decl.add(n));
  }
  const sxLine = L.slice(appi).find(x => x.includes("const SX = {")) || "";
  const sx = new Set((sxLine.match(/const SX = \{([^}]*)\}/)?.[1] || "").match(/\w+/g) || []);

  /* An entry runs from its header to the line before the next one. Closing braces are NOT a reliable
     boundary here: sections lifted free-standing close with `    ); },` and sections lifted out of an
     IIFE close with `  },`, and a scan that keyed on one of them silently gave every entry a length
     of one line — which is why the first run of this found only one of the four faults. */
  const heads = [];
  for(let i = secti + 1; i < appi; i++){
    const m = L[i].match(/^  (\w+): \(S(?:, X)?(?:, (\w+))?\) =>/);
    if(m) heads.push({ i, name: m[1], param: m[2] || null });
  }
  const bad = new Map();
  heads.forEach((h, idx) => {
    const end = idx + 1 < heads.length ? heads[idx+1].i - 1 : appi - 1;
    const taken = new Set(((L[h.i].match(/const \{([^}]*)\}/)?.[1]) || "").split(",").map(s=>s.trim()).filter(Boolean));
    const local = new Set();
    for(let k = h.i; k <= end; k++){
      (L[k].match(/\bconst (\w+)\s*=/g)||[]).forEach(g => local.add(g.replace(/\bconst |\s*=/g,"").trim()));
      for(const g of (L[k].match(/\bconst [\[{]([^\]}]*)[\]}]/g)||[]))
        (g.match(/\w+/g)||[]).slice(1).forEach(n => local.add(n));
    }
    for(let k = h.i; k <= end; k++){
      for(const m2 of L[k].matchAll(/(?<![\w.$])([A-Za-z_$][\w$]*)\s*\(/g)){
        const n = m2[1];
        /* SX MEMBERSHIP IS NOT THE TEST, and the first version of this check thought it was. SX is
           only the bag App offers; what a section actually has is what its own header destructures
           out of X. `setSheet` sat in SX while `annals` took `{ carryOut, standings }` and nothing
           else — so the name was on offer, unclaimed, and the panel threw the moment the button was
           pressed. The check passed green over it, which is worse than not having run. */
        if(decl.has(n) && !taken.has(n) && !local.has(n) && n !== h.param){
          if(!bad.has(n)) bad.set(n, []);
          bad.get(n).push({ where: `${h.name} L${k+1}`, inSx: sx.has(n) });
        }
      }
    }
  });

  lines.push(`${heads.length} sections in SECT · SX carries ${sx.size} names · App declares ${decl.size} of its own`);
  if(!bad.size) lines.push(`   nothing a section calls is missing from SX`);
  for(const [n, hits] of [...bad.entries()].sort((a,b)=>b[1].length-a[1].length)){
    const fix = hits[0].inSx ? "SX has it — the section's header does not take it" : "not in SX at all";
    lines.push(`   ${n.padEnd(16)} called in ${hits.slice(0,3).map(h=>h.where).join(", ")}`
      + `${hits.length>3?` and ${hits.length-3} more`:""}  (${fix})`);
    fails.push(`${n} is called in ${hits[0].where} and that section never destructures it — ${fix}. The panel throws `
      + `the moment a player touches that control, and no amount of rendering finds it, because the call is in a `
      + `handler. This is what cost sweep and surface 18 page errors apiece`);
  }
  return { pass: fails.length === 0, why: fails.slice(0,2).join("; ") || null, lines };
}
