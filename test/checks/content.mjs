/* NO PANEL LEFT UNREACHABLE — the overhaul must not lose content

   Four releases moved panels into sheets, faces, documents and a drawn scene. Every move risks the
   quiet failure: a panel still defined, still maintained, reachable from NOWHERE — content lost
   without a line of red anywhere. Asked for directly ("we need to make sure all content is still
   accessible from the new ui"), and the answer has to be a check, not a one-time audit, because the
   next move can orphan a panel just as silently.

   Every SECT entry must be reachable by at least one of:
     a call site        SECT.<id>(          rendered on a tab, face, or sheet
     a document tag     "tab:face:<id>"     an agenda item that opens it as a letter
     a scene document   doc:"<id>"          a room in the drawn ludus that opens it

   An entry none of these reach is an orphan: either give it a door or delete it — a defined panel
   with no door is worse than a deleted one, because it looks maintained.
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const name = "content";
export const describe = "every panel in the registry has at least one door";

export async function run(){
  const lines = [], fails = [];
  const s = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const keys = [...s.matchAll(/\n  (\w+): \(S(?:, X)?(?:, \w+)?\) =>/g)].map(m=>m[1])
    .concat([...s.matchAll(/\n  (\w+): S => \(/g)].map(m=>m[1]));
  const doors = k => ({
    called: (s.match(new RegExp(`SECT\\.${k}\\(`, "g"))||[]).length,
    tagged: (s.match(new RegExp(`:${k}"`, "g"))||[]).length,
    scene:  (s.match(new RegExp(`doc:"${k}"`, "g"))||[]).length,
  });
  const orphans = [];
  for(const k of new Set(keys)){
    const d = doors(k);
    if(!d.called && !d.tagged && !d.scene) orphans.push(k);
  }
  /* ---- A SCAN THAT RETURNS NOTHING MUST NOT READ AS NOTHING WRONG — #296 ----
     Every failure below is raised per ORPHAN, and an orphan can only be found among `keys`. So an
     empty `keys` gave an empty `orphans`, an empty `fails`, and `pass: true` — this check printed
     "0 panels in the registry · 0 orphaned" and went green.

     It was correct today (33 of 33) and the risk is entirely in the regex above, which admits
     `(S)`, `(S, X)`, `(S, X, one-more)` and `S => (` and nothing else. Every panel in SECT is
     `(S, X)` or `(S, X, one-more)` right now. A thirty-fourth written with a fourth parameter, a
     destructured argument, or `S => {` is invisible to the scan, and without this line nothing
     would have said so — if that panel were also orphaned, the check stays green and reports a
     smaller number than the truth. That is #295 in miniature.

     THIRTY IS THE FLOOR, NOT THIRTY-THREE. A cap of exactly today's count turns every legitimate
     new panel red and teaches the next reader to edit the number without looking, which is worse
     than no guard. This says "the scan is broken", not "the registry changed". */
  const panels = new Set(keys);
  /* written as `panels.size < 30` and not `N < 30` on purpose: `tools.mjs` arm 5 reads this file
     for a floor guard, and the first draft of that arm could not see a comparison hidden behind a
     one-letter const. Widening its regex to `\w+ < \d+` would have matched every numeric
     comparison in the suite, so the idiom stays legible here instead. */
  if(panels.size < 30)
    fails.push(`only ${panels.size} panels parsed out of SECT — the registry has thirty-odd, so this is the `
      + `scan reading a shape that has moved, not the source losing panels. Every failure this `
      + `check raises is per-orphan, so a scan that finds nothing finds nothing wrong`);
  lines.push(`${new Set(keys).size} panels in the registry · ${orphans.length} orphaned`);
  for(const k of orphans)
    fails.push(`SECT.${k} is reachable from nowhere — no call site, no document tag, no scene room. Give it a door or delete it`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
