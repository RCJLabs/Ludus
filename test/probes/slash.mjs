/* THE BACKSLASH THE PAGE NEVER SEES

   This project writes browser code inside template literals and hands it to `p.evaluate()`. Inside
   an UNTAGGED template literal JavaScript drops the backslash from every sequence that is not one
   of its own escapes, so a regex written there arrives at the page meaning something else:

       `/rgba?\([^)]+\)/`    reaches the page as   /rgba?([^)]+)/     an escaped paren became a GROUP
       `/\d+/`               reaches the page as   /d+/               digits became the letter d
       `/\bword\b/`          reaches the page as   /<BS>word<BS>/     \b is a real escape: BACKSPACE

   None of it throws. The regex compiles and matches the wrong thing, quietly.

   IT HAS BITTEN THIS PROJECT FOUR TIMES, each time costing a wrong measurement believed before it
   was caught. It is the one fault here with no guard at all, so this counts what is exposed.

   THE SCANNER HAS TO KNOW WHERE IT IS. A backslash is only eaten inside the LITERAL PART of a
   template — inside a `${ }` you are back in ordinary JavaScript and `\d` is fine — so this walks
   the file as a tokenizer rather than grepping: line and block comments, single and double quoted
   strings, template literals with `${}` nesting tracked to a depth, and regex literals told from
   division by what precedes the slash. Grep cannot tell those apart and would report every regex in
   the file.

     node test/probes/slash.mjs
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

import { scan, sources } from "../checks/slash.mjs";

/* ONE SCANNER, imported from the check rather than copied — a tokenizer kept in two places is two
   tokenizers within a release, and this one already had two faults worth not fixing twice. */
const files = sources();

let total = 0, seenTpls = 0, seenChars = 0;
const byFile = [];
for(const rel of files){
  let src; try { src = fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch(e){ continue; }
  const r = scan(src);
  seenTpls += r.tpls; seenChars += r.tplChars;
  if(r.hits.length){ byFile.push({ rel, hits:r.hits }); total += r.hits.length; }
}

console.log(`=== backslashes inside template literals that the page will never see\n`);
console.log(`  ${files.length} files scanned · ${seenTpls} template literals · ${seenChars.toLocaleString()} characters inside one\n`);
for(const f of byFile){
  console.log(`  ${f.rel}  —  ${f.hits.length}`);
  for(const h of f.hits.slice(0, 6))
    console.log(`    :${String(h.line).padStart(5)}  ${h.seq.padEnd(4)} ${h.kind === "backspace" ? "becomes U+0008" : "loses its backslash"}   ${h.text}`);
  if(f.hits.length > 6) console.log(`    ... and ${f.hits.length - 6} more`);
}
console.log(`\n  ${total} exposed sequence${total===1?"":"s"} across ${byFile.length} file${byFile.length===1?"":"s"}`);
if(!total) console.log(`  nothing is being eaten`);
