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
  lines.push(`${new Set(keys).size} panels in the registry · ${orphans.length} orphaned`);
  for(const k of orphans)
    fails.push(`SECT.${k} is reachable from nowhere — no call site, no document tag, no scene room. Give it a door or delete it`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
