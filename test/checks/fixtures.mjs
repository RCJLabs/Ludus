/* A FORGED FIXTURE MUST SURVIVE THE LOAD — and nothing may yield between writing it and reading it

   `room` went red for the first time in its life and the fault was not in the game. It forges the
   widest line the interface can be asked to draw — the longest class against the longest house
   against the longest name and nick, taken from the game's own tables — writes it over every man
   at the rope, and then called `waitSaved()` before reloading.

   That is backwards after writing state by hand. `waitSaved` exists to let the app's DEBOUNCED
   AUTOSAVE flush, and the app is still running with its own house in memory. During the wait its
   autosave writes that house over the fixture; the reload loads the app's men, not the forged
   ones; and the check then measures a random house against a line it composed itself and reports
   that the line "is not on the panel". It had been passing on the wrong fixture some of the time —
   a vacuous pass, in the one check that had never once gone red.

   The rule is mechanical, so it is checked mechanically: BETWEEN WRITING A STATE INTO A SLOT AND
   RELOADING THE PAGE, NOTHING MAY YIELD. No waitSaved, no waitForTimeout, no clearAll, no click.
   The app is awake for every millisecond of that gap and it saves on a timer.

   This reads the test tree rather than the game — like `bulk` and `scope`, it costs nothing and
   catches the fault at the moment it is written rather than the release after.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

export const name = "fixtures";
export const describe = "nothing yields between forging a save and loading it";

/* the harness-level calls that hand control back to the browser, and so to its autosave */
const YIELDS = /await\s+(waitSaved|clearAll|endWeek|found|installRope|tab|click|top|slot|p\.waitForTimeout|p\.keyboard|p\.click)\s*\(/;
const WRITE  = /localStorage\.setItem\([^,]+,\s*JSON\.stringify/;
const RELOAD = /await\s+p\.reload\s*\(/;
/* a new function body starts here — what follows is a DEFINITION, not the next thing to happen */
const NEWFN  = /^\s*(const|let|var)\s+\w+\s*=\s*(async\s*)?\(|^\s*(export\s+)?(async\s+)?function\s/;

export async function run(){
  const lines = [], fails = [];
  const files = [];
  for(const dir of ["checks", "probes"]){
    const d = path.join(ROOT, "test", dir);
    if(!fs.existsSync(d)) continue;
    for(const f of fs.readdirSync(d)) if(f.endsWith(".mjs")) files.push(path.join(d, f));
  }
  files.sort();

  let forges = 0, clean = 0;
  for(const f of files){
    const src = fs.readFileSync(f, "utf8").split("\n");
    for(let i = 0; i < src.length; i++){
      if(!WRITE.test(src[i])) continue;
      forges++;
      const gap = [];
      let landed = null;
      for(let j = i + 1; j < Math.min(i + 40, src.length); j++){
        const l = src[j];
        if(RELOAD.test(l)){ landed = j; break; }
        /* a function being DEFINED below the write is not the next thing that runs */
        if(NEWFN.test(l) && !/=>\s*\{?\s*$/.test(src[i])) { landed = -1; break; }
        const m = l.match(YIELDS);
        if(m) gap.push(`${m[1]}()`);
      }
      const where = `${path.basename(f)}:${i + 1}`;
      if(landed === -1 || landed === null){
        /* a forge with no reload after it is not necessarily wrong — some write a slot the app is
           about to be pointed at by other means — so this is reported, not barred */
        lines.push(`   ${where.padEnd(24)} written, no reload follows it directly`);
        continue;
      }
      if(gap.length){
        fails.push(`${where} yields ${gap.length}× before reloading (${gap.join(", ")}) — `
          + `the app is awake for that whole gap and its autosave will write its own house over the fixture`);
      } else clean++;
    }
  }

  lines.unshift(`${forges} forged fixtures across ${files.length} files · ${clean} write and reload with nothing in between`);
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
