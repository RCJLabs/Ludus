/* WHERE THE ELEVEN ARE PRINTED AGAINST WHERE THEY ARE DEFINED — #275's verify-first.

     node test/probes/terms.mjs

   #275: "The game runs on eleven derived quantities ... Four have a lesson of their own (`regard`,
   `acclaim`, `unrest`, and `form` for condition). `welcome` is not named in any of the 35 lesson
   texts at all."

   THE FIRST THING TO CHECK IS THE LIST ITSELF. "Bearing" is not a quantity: the man's sheet prints
   `demeanor(g.defiance)` under the label "Bearing", so `bearing` and `defiance` are one number with
   two names. That makes the eleven TEN — and it means a search for "defiance" in a lesson misses
   the lesson that defines it, because the lesson calls it Bearing.

   So each term is searched under every name a player could meet it by, and the answer is a pair:
   is it NAMED in a lesson at all, and is what the lesson says a DEFINITION or a passing mention. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const TERMS = {
  regard:   ["regard"],
  defiance: ["defiance", "bearing", "demeanor"],
  standing: ["standing"],
  favour:   ["favour", "favor", "patron"],
  acclaim:  ["acclaim"],
  known:    ["known", "local standing", "knows the name"],
  welcome:  ["welcome", "outstayed", "worn out your welcome"],
  unrest:   ["unrest"],
  morale:   ["morale", "heart in them", "spirits"],
  fatigue:  ["fatigue", "wind", "spent", "tired"],
  form:     ["form", "in form", "shaken"],
};

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([TERMS])=>{
  const A = window.__LVDVS;
  if(A.LESSONS == null) return { why:"the handle is missing LESSONS" };
  const lessons = A.LESSONS.map(l=>({ id:l.id, tab:l.tab,
    text:[l.title, l.body, l.text, l.say].filter(Boolean).join(" ") }));
  const hits = {};
  for(const [term, names] of Object.entries(TERMS)){
    hits[term] = [];
    for(const l of lessons){
      const found = names.filter(n=>new RegExp(`\\b${n}`, "i").test(l.text));
      if(found.length) hits[term].push({ id:l.id, by:found,
        /* the sentence it appears in, so a mention can be told from a definition */
        say:(l.text.match(new RegExp(`[^.]*\\b${found[0]}[^.]*\\.`, "i"))||[""])[0].trim().slice(0,150) });
    }
  }
  return { hits, n:lessons.length };
}, [TERMS]);

await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

console.log(`\n#275 — THE TERMS AGAINST THE ${out.n} LESSONS\n`);
let named = 0, silent = [];
for(const [term, hs] of Object.entries(out.hits)){
  if(hs.length){ named++;
    console.log(`${term.padEnd(10)} named in ${hs.length}: ${hs.map(h=>h.id).join(", ")}`);
    console.log(`${" ".repeat(11)}"${hs[0].say}"`);
  } else { silent.push(term); console.log(`${term.padEnd(10)} NOT NAMED IN ANY LESSON`); }
}
console.log(`\n${named} of ${Object.keys(out.hits).length} are named somewhere; ${silent.length} are not: ${silent.join(", ") || "none"}`);
