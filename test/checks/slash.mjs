/* THE BACKSLASH THE PAGE NEVER SEES

   This project writes browser code inside template literals and hands it to `p.evaluate()`. Inside
   an UNTAGGED template literal JavaScript drops the backslash from every sequence that is not one
   of its own escapes, so a regex written there arrives at the page meaning something else:

       `/rgba?\([^)]+\)/`    reaches the page as   /rgba?([^)]+)/     an escaped paren became a GROUP
       `/\d+/`               reaches the page as   /d+/               digits became the letter d
       `/\bword\b/`          reaches the page as   /<BS>word<BS>/     \b IS an escape: BACKSPACE

   None of it throws. The regex compiles and matches the wrong thing, and the run reports a number
   that is confidently wrong. **It has bitten this project four times** — most memorably when
   `groundOf` measured a blood button's text at 1.19:1 against an actual 7:1, because `/rgba?\(/`
   had quietly become a capture group — and it was the one fault here with no guard at all.

   THE TREE IS CLEAN TODAY. Each of the four was fixed as it was found, so this check exists to
   stop the fifth, and its value is entirely in the failing case. That makes the sabotage test the
   important half of shipping it, not a formality.

   THE SCANNER HAS TO KNOW WHERE IT IS, because a backslash is only eaten inside the LITERAL part
   of a template — inside a `${ }` you are back in ordinary JavaScript and `\d` is correct there.
   So this tokenizes rather than greps: line and block comments, quoted strings, template literals
   with `${}` nesting tracked to a depth, and regex literals told apart from division. Grep would
   report every regex in the repository.

   ---- THE FIRST SCANNER WAS CONFIDENTLY WRONG, WHICH IS THE HAZARD IT EXISTS TO FIND ----
   It reported 143 sequences across 25 files, among them `.replace(/\bhimself\b/g, "herself")` in
   `src/ludus.jsx` — ordinary code with no template within a hundred lines. Two faults, both classic:

   · THE STACK WAS POPPED TWICE. On `${` it left template mode, but on the matching `}` it popped
     the whole template off, so the real closing backtick popped the one below it and every backtick
     after that meant the opposite of what it should.
   · A REGEX AFTER A KEYWORD READ AS DIVISION. The heuristic looked only at the previous character,
     and after `return` that is `n`, which looks like a value — so `return /x/` was scanned as
     division, its body read as code, and one apostrophe inside it desynced the rest of the file.

   Both produce the same symptom: the scanner believes it is inside a template when it is not, and
   every regex in the file looks like a finding. And the opposite failure is worse, because it looks
   like success — a scanner that never enters template state reports zero and cannot be told from a
   clean tree. So COVERAGE IS ASSERTED, not assumed: the run fails if it did not read a substantial
   quantity of template text, which is the same guard `legible` needed after printing "99:1, 0 under
   floor" for nineteen labels it had never sampled.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

export const name = "slash";
export const describe = "no backslash is eaten by a template literal before the page sees it";

/* the escapes a template literal honours. Everything else silently loses its backslash. */
const REAL = new Set(["n","t","r","f","v","0","x","u","\\","`","$","'","\"","\n"]);
/* honoured, and still almost certainly wrong: \b is a word boundary in a regex and U+0008 here */
const TRAP = new Set(["b"]);
/* after any of these a slash begins a regex, whatever the character before it looks like */
const KEYWORD = /(?:^|[^A-Za-z0-9_$])(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

/* the floor the run must clear to have looked at anything at all */
export const COVER = 50000;

export function scan(src){
  const hits = [];
  let tpls = 0, tplChars = 0;
  const stack = [];                              /* {t:"tpl"} | {t:"sub", depth:n} */
  const inTpl = () => stack.length && stack[stack.length-1].t === "tpl";
  let i = 0; const n = src.length;
  let prev = "", word = "";

  while(i < n){
    const c = src[i], c2 = src[i+1];
    if(inTpl()){
      tplChars++;
      if(c === "\\"){
        const e = c2;
        if(!REAL.has(e)){
          const line = src.slice(0, i).split("\n").length;
          const from = Math.max(0, src.lastIndexOf("\n", i) + 1);
          let to = src.indexOf("\n", i); if(to < 0) to = n;
          hits.push({ line, kind: TRAP.has(e) ? "backspace" : "dropped", seq: "\\" + e,
                      text: src.slice(from, to).trim().slice(0, 90) });
        }
        i += 2; continue;
      }
      if(c === "$" && c2 === "{"){ stack.push({ t:"sub", depth:0 }); i += 2; prev = "{"; word = ""; continue; }
      if(c === "`"){ stack.pop(); i++; prev = "`"; word = ""; continue; }
      i++; continue;
    }
    if(c === "/" && c2 === "/"){ while(i < n && src[i] !== "\n") i++; continue; }
    if(c === "/" && c2 === "*"){ i += 2; while(i < n && !(src[i] === "*" && src[i+1] === "/")) i++; i += 2; continue; }
    if(c === "'" || c === '"'){ const q = c; i++;
      while(i < n && src[i] !== q){ if(src[i] === "\\") i++; i++; }
      i++; prev = q; word = ""; continue; }
    if(c === "`"){
      /* String.raw is the one tag that keeps its backslashes, so scanning it would be a false
         positive. Nothing here uses it today; the exception is written down so that the day
         somebody does, this check does not have to be argued with. */
      if(/String\.raw\s*$/.test(src.slice(Math.max(0, i - 20), i))){
        i++; let d = 1;
        while(i < n && d > 0){ if(src[i] === "\\") i += 2; else { if(src[i] === "`") d--; i++; } }
        prev = "`"; word = ""; continue; }
      stack.push({ t:"tpl" }); tpls++; i++; continue; }
    if(c === "/" && (!/[A-Za-z0-9_$)\]]/.test(prev) || KEYWORD.test(word))){
      i++; let cls = false;
      while(i < n){ const d = src[i];
        if(d === "\\"){ i += 2; continue; }
        if(d === "[") cls = true;
        else if(d === "]") cls = false;
        else if(d === "/" && !cls) break;
        else if(d === "\n") break;
        i++; }
      i++; while(i < n && /[a-z]/.test(src[i])) i++;
      prev = "/"; word = ""; continue; }
    if(stack.length && stack[stack.length-1].t === "sub"){
      const top = stack[stack.length-1];
      if(c === "{") top.depth++;
      else if(c === "}"){ if(top.depth === 0){ stack.pop(); i++; prev = "}"; word = ""; continue; } top.depth--; }
    }
    if(/[A-Za-z0-9_$]/.test(c)) word += c; else if(!/\s/.test(c)) word = "";
    if(!/\s/.test(c)) prev = c;
    i++;
  }
  return { hits, tpls, tplChars };
}

/* every file that either writes browser code or is browser code */
export function sources(){
  const out = [];
  for(const dir of ["test/checks", "test/probes"]){
    const p = path.join(ROOT, dir);
    if(!fs.existsSync(p)) continue;
    for(const f of fs.readdirSync(p).filter(x=>x.endsWith(".mjs"))) out.push(path.join(dir, f));
  }
  for(const f of ["test/harness.mjs", "test/run.mjs", "src/ludus.jsx", "build.js"]) out.push(f);
  return out;
}

export async function run(){
  const bad = [], lines = [];
  const files = sources();
  let total = 0, tpls = 0, chars = 0, read = 0;
  const byFile = [];
  for(const rel of files){
    let src; try { src = fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch(e){ continue; }
    read++;
    const r = scan(src);
    tpls += r.tpls; chars += r.tplChars;
    if(r.hits.length){ byFile.push({ rel, hits:r.hits }); total += r.hits.length; }
  }

  lines.push(`${read} files · ${tpls.toLocaleString()} template literals · `
    + `${chars.toLocaleString()} characters inside one`);
  for(const f of byFile.slice(0,4)){
    lines.push(`  ${f.rel} — ${f.hits.length}`);
    for(const h of f.hits.slice(0,3))
      lines.push(`    :${h.line} ${h.seq} ${h.kind === "backspace" ? "becomes U+0008" : "loses its backslash"}  ${h.text}`);
  }

  /* A SCANNER THAT NEVER ENTERED A TEMPLATE REPORTS ZERO AND LOOKS CLEAN. */
  if(chars < COVER)
    bad.push(`only ${chars.toLocaleString()} characters of template literal were read across ${read} files — `
      + `under the ${COVER.toLocaleString()} this tree carries, so the scanner is not reaching the code it `
      + `is meant to read and a clean result here means nothing`);

  for(const f of byFile.slice(0,3)){
    const h = f.hits[0];
    bad.push(`${f.rel}:${h.line} writes ${h.seq} inside a template literal — `
      + (h.kind === "backspace"
        ? `\\b is a real escape and becomes U+0008, so a word boundary reaches the page as a backspace`
        : `the backslash is dropped before the page ever sees it, so the regex means something else`)
      + ` (${f.hits.length} in this file). Double it: \\${h.seq}`);
  }
  if(!bad.length) lines.push("every backslash written for the page reaches it");
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
