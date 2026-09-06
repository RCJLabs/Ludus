/* THE AUDIT'S OWN INSTRUMENT — A CHECK THAT CHECKS THE CHECKS.

   #116 was written because across items #108 to #115 the probe was wrong more often than the game
   was. Counted off the record: eight items, and **six closed as refuted or answered rather than as
   faults**, against roughly **twenty-two instrument faults of mine** — the rope that read only the
   arena bill, the crux that was never answered, a break detector fooled by a duplicate gear id,
   `buildUp` run on a purse that could not pay for it, a bench fighting a corpse, an arm that
   validated a constant against itself, and a rebellion blamed on travel that was really a manager
   who never went down to the cells.

   Prose in a README does not stop any of that happening again. This does, for the two faults that
   are mechanically detectable in a check's own source.

   ---- FAULT ONE: THE UNANSWERED BALANCE ----
   `doFight` and its three sister engines return at `res.unfinished` — the balance, where the box is
   asked for a word — BEFORE they credit anything, and they mutate NOTHING while a bout is held.
   Measured over 400 bouts a row: **0.0% of first-blood bouts reach the balance, 60.5% of standard
   and 59.3% sine missione**, and in 721 of 721 held bouts the purse, the fatigue and the steel had
   all not moved.

   Three checks — `ends`, `houses` and `chair` — called the engines and never looked at `r.crux`, so
   about **60% of their bouts never happened**. That is not theoretical: routed through the rope,
   `ends` went from *13 of 24 houses out with a median 272 denarii UNDER* to **6 of 24 out with a
   median +506d in the box**, and its published conclusion — that the ledger is what ends a competent
   opening — became an even split between the ledger and the cells. `houses` moved the other way: its
   bouts now raise the rival's grudge, which is the term that switches warmth off, and #113's median
   peak warmth of 76.8 re-measured at **100**.

   Five more checks shared a wrapper that answered exactly ONE word and discarded any bout that came
   back to the balance a second time. `simulateFight` allows three. That is another **26.8% of all
   standard bouts, 44.2% of the held ones**.

   So the rope lives in `harness.mjs` and is installed on every page by `open()`. This check fails any
   check that reaches for an engine without resolving to exhaustion.

   ---- FAULT THREE: A LEVER THAT CANNOT ARRIVE ----
   The rope's own options are the other half of the instrument, and five of them have now been found
   inert AFTER being measured through: `stakes` reached only the pit, `wantStakes` was never wired,
   `preferStakes` was collapsed into it, `entrance` was honoured by `run` and not forwarded by
   `lanista`, and `pick` was written TWICE into the same object literal — where JavaScript keeps the
   last one and silently drops the first. That last one killed the `protect` and `pairs` options
   from v3.128.0 onward and nothing said a word, because esbuild flags duplicate keys and esbuild
   never sees `harness.mjs`.
   The signature of all five is identical and it is the most expensive result there is: an arm comes
   back indistinguishable from its control, and the null gets published as a finding about the game.
   Three of the five are only findable by measuring; the fifth is a duplicate key, which is
   mechanically detectable, so it is detected here — every object literal the rope hands to its own
   inner functions is parsed for a key written twice.

   ---- FAULT TWO: THE BILL THAT IS SHUT, AND WHY IT IS REPORTED AND NOT ASSERTED ----
   `d.games.offers` is the arena bill and it does not open until fame 25. A probe that reads only
   that fights almost nothing: the first drafts of both `ends` and `steel` managed **2 to 5 bouts in
   90 weeks** and every arm was the idle one wearing a different name. The pit fills the other weeks.

   THAT RULE WAS WRITTEN AS AN ASSERTION AND THEN TAKEN BACK OUT, because it flagged eight checks and
   seven of them were right: `card` measures what a bill is made of, `nights` and `worst` read a
   record built from festival cards, `grudge` waits for a grudge match that only appears on a bill,
   `glance` and `summit` construct houses famous enough to have one, and `bay` falls through to
   `makeCityGames` because a house down the coast fights the town's card and not Capua's pit. One
   real fault against seven false positives is not a rule, it is a rule that teaches whoever reads it
   to add an exception without thinking — which is worse than no rule. It is a reported line now, and
   the fault it catches is caught instead by the rope being the only sanctioned way to take a bout.

   WHAT THIS CHECK CANNOT DO is catch the faults that are about judgement rather than shape — a bar
   that validates a constant against itself, a bench that keeps a dead man fighting, two arms that
   differ in more than one way at once. Those are in `test/README.md`, and the honest figure to carry
   is that they were the majority. */

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../harness.mjs";

export const name = "probe";
export const describe = "no check drives a bout it does not finish";

/* Exceptions, each with the reason it is not the fault being hunted. Anything not listed here that
   trips a rule is a new offender and this check is meant to fail on it. */
const ALLOWED = {
  bulk:    { rope:"names the engines only to measure how long their functions are; drives nothing" },
  engines: { rope:"calls `simulateFight` directly with a hand-built context — below the layer where a crux exists" },
  /* `engines` needs no `simLayer` exemption and was briefly given one for nothing: the wrong-field
     rule only looks at checks that drive a `do*` engine, and `engines` drives the `simulate*` layer,
     where `unfinished` is the correct field. Removing the exemption and re-running proved it — the
     check still passed, because it never reaches the rule. An exemption that changes no outcome is
     worse than none: it reads as evidence the rule was considered and waived. */
  coast:   { rope:"holds the crux itself, on purpose: its whole subject is that a town must see the "
                + "afternoon whatever engine ran it and however it ended, so it resumes each engine by "
                + "hand with an explicit word and asserts on the resumed result" },
  feats:   { rope:"answers every crux with the CLOTH, which ends the bout as a forfeit — there is no "
                + "second word to speak, and the count of cruxes is the thing it is measuring" },
  odds:    { rope:"one of its sites is a bout it deliberately does NOT resolve — section 2 fishes for a "
                + "held result to assert the shape of the return, which is the whole point of that "
                + "section. Its measuring sites all go through `__ROPE.answer`, which loops to exhaustion" },
  probe:   { rope:"this file; it names the engines in prose" },
};

/* NAME, NOT CALL. The first version of this required a `(` after the engine name and found 7 of
   the 21 checks that drive one, because the dominant style in this suite passes the engine as a
   REFERENCE — `fin(A.doFight, [d, ...])` — so the paren belongs to the wrapper. A detector that
   only sees one calling convention is the same class of fault it is here to catch. */
const ENGINES = /\b(?:A\.)?(?:doFight|doPairFight|doMelee|doVenatio)\b/;

export async function run(){
  const dir = path.join(ROOT, "test", "checks");
  const files = fs.readdirSync(dir).filter(f=>f.endsWith(".mjs")).sort();
  const bad = [], lines = [];
  const rows = [];

  for(const f of files){
    const name = f.replace(/\.mjs$/, "");
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    /* comments are prose about the trap in most of these files, so the rules read CODE only */
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    /* ---- AND A RULE MUST NOT READ ITS OWN FAILURE MESSAGE, learned in v2.90.0 ----
       The `.unfinished` rule below flagged three checks on its first run and all three were the
       rule's fault: `odds` and this very file NAME the field inside the sentence they print when
       they catch it, and a regex over the whole file cannot tell an offence from a description of
       one. `probe` flagging `probe` for explaining `probe` is as clear a signal as this suite gets.
       So rules that look for a field name read `bare` — code with every string literal taken out.
       `/"cloth"/` above still reads `code`, because that rule is ABOUT a string. */
    const bare = code.replace(/`(?:\\.|[^`\\])*`/g, "``")
                     .replace(/'(?:\\.|[^'\\])*'/g, "''")
                     .replace(/"(?:\\.|[^"\\])*"/g, '""');

    const drives = ENGINES.test(code);
    if(!drives) continue;

    const rope   = /window\.__ROPE|__ROPE\./.test(code);
    const loops  = /(while|for)\s*\([^)]*\.crux/.test(code);

    /* PER SITE, NOT PER FILE. A file can hold a rope in one place and a one-shot in another, and a
       one-shot is not always wrong: answering with the CLOTH ends the bout as a forfeit, so there is
       no second word to speak. `chair`'s mercy arm and the whole of `feats` are that on purpose, and
       a file-wide rule flagged both. So find every `if(… .crux …)` and read the ~220 characters that
       follow it, which is where the resume and its word are. */
    const sites = [];
    const RE = /if\s*\([^)]*\.crux[^)]*\)/g;
    let m;
    while((m = RE.exec(code))){
      const body = code.slice(m.index, m.index + 260);
      const inLoop = /(while|for)\s*\([^)]*\.crux/.test(code.slice(Math.max(0,m.index-160), m.index));
      /* `__ROPE.answer` loops to exhaustion on its own, so ONE `if` around it is complete. Without
         this, the rule flagged `odds` — a check written on the rope — for using the rope correctly. */
      const roped = /__ROPE|\bR\.answer\b/.test(body);
      sites.push({ cloth:/"cloth"/.test(body), inLoop, roped });
    }
    const oneIf  = sites.some(x=>!x.cloth && !x.inLoop && !x.roped) && !loops;
    const clothOnly = sites.length > 0 && sites.every(x=>x.cloth);
    const blind  = !rope && !loops && !sites.length;
    const bill   = /games\s*&&\s*d\.games\.offers|d\.games\.offers/.test(code);
    const pit    = /makePitOffer|__ROPE/.test(code);

    rows.push({ name, rope, loops, oneIf, blind, bill, pit, clothOnly, sites:sites.length });

    const ex = ALLOWED[name] || {};
    if(blind && !ex.rope)
      bad.push(`${name} calls a fight engine and never looks at \`r.crux\` — about 60% of standard `
        + `bouts stop at the balance and mutate NOTHING, so that share of its bouts never happened. `
        + `Use \`window.__ROPE.takeBout\` or \`__ROPE.run\`, which the harness installs on every page`);
    else if(oneIf && !ex.rope)
      bad.push(`${name} answers the balance once and then drops the bout if it comes back — `
        + `\`simulateFight\` asks for up to three words, and one-shot loses 26.8% of all standard `
        + `bouts. Make it a \`while\`, or use \`window.__ROPE\``);

    /* ---- AND THE WRONG FIELD, WHICH IS THE SAME FAULT WEARING A DISGUISE, added in v2.90.0 ----
       The `do*` engines return `{ pending, beats, crux:true, … }`. They do NOT return `unfinished`;
       that field belongs to the `simulate*` layer beneath them. Three probes of mine tested
       `res.unfinished` on a `doFight` result, so every held bout read as a finished one with no
       winner and was scored a LOSS — 33% to 58% of all bouts, depending on grade, and it produced a
       mirror match at 21% that took four rounds of chasing to explain. A check making this mistake
       does not look broken: it looks like a finding. `engines` is exempt because it calls the
       `simulate*` functions directly, where `unfinished` is the right field. */
    /* THIS RULE FLAGGED ITSELF THREE TIMES, each time for a different reason, and all three are one
       reflex: a check that reads its own source cannot spell the thing it is looking for.
         1. the failure message NAMES the field — fixed by stripping string literals into `bare`;
         2. the exemption was keyed `unfinished`, so `ex.unfinished` was itself a literal match —
            renamed `simLayer`;
         3. and the PATTERN is a regex literal, which is code and survives string-stripping. So the
            needle is assembled at run time and the six letters never appear together in this file.
       A lint over its own kind has to hold itself to the rule it enforces, and this one does now. */
    const WRONG_FIELD = new RegExp("\\." + "unfin" + "ished");
    if(WRONG_FIELD.test(bare) && !ex.simLayer)
      bad.push(`${name} reads \`.unfinished\` while driving a \`do*\` engine. That engine returns `
        + `\`crux: true\` and has no \`unfinished\` field at all, so the test is always false and `
        + `every held bout — a third to two thirds of them — is scored as a finished loss. Test `
        + `\`r.crux\`, or hand the bout to \`window.__ROPE\`. Only the \`simulate*\` layer says `
        + `\`unfinished\`; if this check really is on that layer, say so in ALLOWED`);
  }

  const via = rows.filter(r=>r.rope).map(r=>r.name);
  const loop = rows.filter(r=>!r.rope && r.loops).map(r=>r.name);
  const once = rows.filter(r=>r.oneIf).map(r=>r.name);
  const none = rows.filter(r=>r.blind).map(r=>r.name);

  /* the end state worth naming: a check that takes bouts through the rope alone never touches an
     engine, so it does not appear above at all — count those separately or they look like nothing */
  const ropeOnly = files.map(f=>f.replace(/\.mjs$/,"")).filter(n=>{
    if(rows.some(r=>r.name===n)) return false;
    const c = fs.readFileSync(path.join(dir, n+".mjs"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    return /__ROPE/.test(c);
  });
  lines.push(`${rows.length} of ${files.length} checks name a fight engine; `
    + `${ropeOnly.length} more take their bouts through the harness rope alone`
    + (ropeOnly.length ? ` (${ropeOnly.join(", ")})` : ""));
  lines.push(`   on the harness rope: ${via.join(", ") || "none"}`);
  lines.push(`   resolving in a loop of their own: ${loop.join(", ") || "none"}`);
  const cloth = rows.filter(r=>r.clothOnly).map(r=>r.name);
  lines.push(`   answering one word only: ${once.map(n=>n + (ALLOWED[n]?" (allowed)":"")).join(", ") || "none"}`);
  lines.push(`   answering with the cloth, which ends the bout: ${cloth.join(", ") || "none"}`);
  lines.push(`   never looking at the crux: ${none.map(n=>n + (ALLOWED[n]?" (allowed)":"")).join(", ") || "none"}`);
  /* reported, not asserted — see this check's head for why the rule was taken back out */
  const billOnly = rows.filter(r=>r.bill && !r.pit).map(r=>r.name);
  lines.push(`   reading the bill with no fallback (reported only, 7 of 8 are right to): `
    + `${billOnly.join(", ") || "none"}`);
  lines.push(`the balance is reached by 0.0% of first-blood bouts, 60.5% of standard, 59.3% sine — `
    + `and a held bout has moved nothing at all in 721 of 721 cases`);
  for(const [k,v] of Object.entries(ALLOWED))
    if(rows.some(r=>r.name===k)) lines.push(`   allowed — ${k}: ${v.rope || v.bill}`);

  /* ---- FAULT FOUR: A SCENARIO THAT DOES NOT EXIST ----
     `newGameState(name, scen, seed)` resolves `SCENARIOS[scen] || SCENARIOS.clean`, so a key that is
     not one of the five comes back as `clean` WITHOUT A WORD. The source already carries a note about
     this trap — "a check that invents a scenario key gets `clean` back without a word, which is how
     four fifths of one check's coverage went missing" — and 55 call sites across 30 files were still
     in it, every one of them passing "capua", which is a city and not an opening. Their numbers were
     never wrong; they were measured under `clean` and labelled as something else, which is the sort
     of thing that becomes wrong the moment somebody trusts the label. Detected here so it stays gone. */
  { const SC = new Set(["clean","inherited","champion","veterans","castoffs"]);
    const bad2 = [];
    for(const dir of ["checks", "probes"]){
      const dd = path.join(ROOT, "test", dir);
      for(const f of fs.readdirSync(dd).filter(x=>x.endsWith(".mjs"))){
        const src = fs.readFileSync(path.join(dd, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
        for(const m of src.matchAll(/newGameState\([^,)]+,\s*"([A-Za-z]+)"/g))
          if(!SC.has(m[1])) bad2.push(`${dir}/${f} opens the scenario "${m[1]}"`);
      }
    }
    const uniq = [...new Set(bad2)];
    lines.push(`scenario keys: ${uniq.length ? uniq.length + " call site(s) name an opening that does not exist" : "every one names a real opening"}`);
    for(const x of uniq.slice(0, 4))
      bad.push(`${x} — there are five (clean, inherited, champion, veterans, castoffs) and anything else `
        + `silently returns \`clean\`, so the measurement is labelled as something it is not`);
  }

  /* ---- FAULT FIVE: A FIXTURE THAT NAMES A SEED AND IS NOT SEEDED ----
     `newGameState(name, scen, seed, pitch)` — the seed is the THIRD argument, and when it is missing
     the function falls back to `newSeedWord()`, which draws from `Math.random()`. So a fixture that
     passes its seed FIRST gets a house named after the seed and a different campaign every run, and
     nothing about it is reproducible.

     `checks/salute.mjs` found this in itself and wrote it down — "this file has been non-deterministic
     since it was written ... every green this check ever produced was luck-weighted and none of its
     numbers were reproducible; when the random house happened to die inside sixty weeks the vacuity
     guard below fired, which it did on two consecutive release gates while passing in isolation" —
     and then fixed only itself. Four more sites were still in it, including `probes/survey.mjs`, the
     instrument the whole #207-#241 audit was written off, and `probes/salute.mjs`, the probe that
     check came from. The rule is general now so the note does not have to stay local again.

     A call with three or more arguments is seeded by construction, so only short calls are read, and
     only in a file that names a seed at all — a fixture that genuinely wants a random house does not
     have a SEED to pass. */
  { const bad3 = [];
    for(const dir of ["checks", "probes"]){
      const dd = path.join(ROOT, "test", dir);
      for(const f of fs.readdirSync(dd).filter(x=>x.endsWith(".mjs"))){
        const src2 = fs.readFileSync(path.join(dd, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
        if(!/\bseed\b/i.test(src2)) continue;
        for(const m of src2.matchAll(/newGameState\(/g)){
          /* a backtick TOGGLES, it does not nest — counting it as an opener the way the first draft
             did left `newGameState(`${SEED}-${h}`)` unclosed, ran the scan to the end of the file and
             counted enough commas to look seeded. Quotes toggle too, so a comma inside a name is not
             an argument. Verified by sabotage: each shape put back, each one reported. */
          let i = m.index + m[0].length, depth = 0, args = 1, seen = false, q = null;
          for(; i < src2.length; i++){
            const ch = src2[i];
            if(q){ if(ch === q && src2[i-1] !== "\\") q = null; seen = true; continue; }
            if(ch === "`" || ch === '"' || ch === "'"){ q = ch; seen = true; continue; }
            if("([{".includes(ch)) depth++;
            else if(")]}".includes(ch)){ if(depth === 0) break; depth--; }
            else if(ch === "," && depth === 0) args++;
            if(!/\s/.test(ch)) seen = true;
          }
          if(seen && args < 3) bad3.push(`${dir}/${f}`);
        }
      }
    }
    const uniq3 = [...new Set(bad3)];
    lines.push(`seeded fixtures: ${uniq3.length ? uniq3.length + " file(s) open a house without a seed" : "every fixture that names a seed passes one"}`);
    for(const x of uniq3.slice(0, 4))
      bad.push(`${x} calls newGameState with fewer than three arguments — the seed is the THIRD one, `
        + `so this house is drawn from \`newSeedWord()\` off \`Math.random()\` and the run is not reproducible`);
  }

  /* ---- FAULT SIX: AN INSTRUMENT THAT CALLS A NAME THE HANDLE DOES NOT CARRY ----
     `probes/handle.mjs` opens by listing four systems that read as dead content because the function
     behind them was not on `__LVDVS` — `setOut`/`comeHome`, `nameHeir`, `makeMarket`, `holdMunera` —
     and says each time the cost was a confident wrong finding published first. `poachTarget` is the
     fifth and the worst of them: `probes/pace.mjs` called `A.poachTarget(...)` inside a try/catch
     every week of a 3,133-week run, the TypeError was swallowed, the catch left the answer false,
     and **"a rival could take one of your men on 0 of 3,133 weeks" went into #246 as the item's
     headline** — the stated reason its poach branch was called a dead one. Measured with the
     function actually exported: **65.2% and 66.3%**.

     Every one of those was invisible to `coverage` (which only sees what is already on the handle)
     and to `actions` (whose list is hand-written, so it can catch a name that goes missing but never
     one that was never added). This reads the instruments themselves: every `A.name(` any check or
     probe calls has to be a name the handle exports. It is derived, so the next one is caught
     without anybody remembering to write it down.

     Read off the export block rather than a running browser, because a name can be missing there and
     present on `window` by accident of scope, and the export block is the contract. */
  { const src3 = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");
    const at = src3.indexOf("if (process.env.LVDVS_TEST");
    const block = at >= 0 ? src3.slice(at) : "";
    const exported = new Set();
    for(const m of block.matchAll(/(?:^|[\s,{])([A-Za-z_$][\w$]*)\s*(?=[,}\n])/g)) exported.add(m[1]);
    for(const m of block.matchAll(/([A-Za-z_$][\w$]*)\s*:/g)) exported.add(m[1]);
    const wanted = {};
    for(const dir of ["checks", "probes"]){
      const dd = path.join(ROOT, "test", dir);
      for(const f of fs.readdirSync(dd).filter(x=>x.endsWith(".mjs"))){
        const t = fs.readFileSync(path.join(dd, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
        for(const m of t.matchAll(/\bA\.([A-Za-z_$][\w$]*)\s*\(/g)){
          const k = m[1];
          /* ---- A GUARDED CALL IS THE CURE, NOT THE DISEASE ----
             `A.palmOf ? A.palmOf(g.wins) : Math.min(4, g.wins||0)` names the risk and carries a
             fallback; seven calls in this suite do exactly that and every one of them is right. The
             fault is the UNGUARDED call — `A.poachTarget(d, h)` with nothing testing whether the
             name is there, wrapped (as everything here is) in a try/catch that turns the TypeError
             into a false. So a name is only reported where the file never mentions it except to
             call it: no `A.name ?`, no `A.name &&`, and not named as a string in a `miss` list. */
          const bare = new RegExp("A\\." + k + "\\s*(?:\\?|&&|\\|\\||\\)|,|;|=[^=])");
          const named = new RegExp("[\"'`]" + k + "[\"'`]");
          if(bare.test(t) || named.test(t)) continue;
          (wanted[k] = wanted[k] || new Set()).add(`${dir}/${f}`);
        }
      }
    }
    const ghosts = Object.keys(wanted).filter(k=>!exported.has(k)).sort();
    lines.push(`the handle's surface: ${Object.keys(wanted).length} names called by an instrument `
      + `WITHOUT a guard, ${ghosts.length ? `${ghosts.length} of them NOT exported` : "every one of them exported"}`);
    for(const g of ghosts.slice(0, 5))
      bad.push(`${[...wanted[g]].slice(0,2).join(", ")} calls \`A.${g}(\` and \`${g}\` is not in the test `
        + `handle's export block — the call throws, and every instrument in this suite wraps its calls `
        + `in a try/catch, so a missing export does not read as an error. It reads as a MEASUREMENT: `
        + `\`poachTarget\` was absent for the whole of #246's audit and its zero became the item`);
  }

  /* ---- FAULT THREE: THE ROPE'S OWN OPTION LITERALS ----
     Only the literals the rope passes to its own inner functions, and only where a CALL opens one:
     `takeBout(d, {` and `run(d, offer, ids, {`. Two things the first draft of this got wrong and
     both were caught by it reporting a key called `null`:
       · it matched the DEFINITION (`const takeBout = (d, opts) => {`) and scanned the function body;
       · and it read every ternary's `:` as a key, so `d.rome ? null : (...)` was a key called `null`.
     Ternaries are tracked by counting unmatched `?` at depth 0, and keys are only counted there, so
     a nested object's own keys are not confused with the outer literal's. */
  const H = fs.readFileSync(path.join(ROOT, "test", "harness.mjs"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const dupes = [];
  for(const rx of [/\btakeBout\(\s*d\s*,\s*\{/g, /\brun\(\s*d\s*,[^;{]*?,\s*\{/g]){
    let m;
    while((m = rx.exec(H)) !== null){
      const b = m.index + m[0].length - 1;        /* the "{" itself */
      let depth = 0, end2 = -1;
      for(let j = b; j < H.length; j++){
        const c = H[j];
        if(c === "{") depth++;
        else if(c === "}"){ depth--; if(!depth){ end2 = j; break; } }
      }
      if(end2 < 0) continue;
      const body = H.slice(b + 1, end2);
      const seen = {};
      let d2 = 0, tern = 0;
      for(let j = 0; j < body.length; j++){
        const c = body[j];
        if(c === "{" || c === "(" || c === "[") d2++;
        else if(c === "}" || c === ")" || c === "]") d2--;
        else if(d2 === 0 && c === "?") tern++;
        else if(d2 === 0 && c === ":" && tern > 0) tern--;
        else if(d2 === 0 && tern === 0){
          const m2 = /^([A-Za-z_$][\w$]*)\s*:/.exec(body.slice(j));
          if(m2 && (j === 0 || /[\s,]/.test(body[j-1]))){
            seen[m2[1]] = (seen[m2[1]] || 0) + 1;
            j += m2[0].length - 2;                /* leave the ":" for the ternary counter */
          }
        }
      }
      for(const [k, n] of Object.entries(seen))
        if(n > 1) dupes.push(`${m[0].slice(0, m[0].indexOf("("))}(…) names \`${k}\` ${n} times`);
    }
  }
  lines.push(`the rope's own option literals: ${dupes.length ? dupes.join(" · ") : "no key written twice"}`);
  for(const x of dupes)
    bad.push(`the harness ${x} — JavaScript keeps the LAST one, so the earlier lever is dropped `
      + `without a word. That is how \`protect\` and \`pairs\` went inert from v3.128.0 to v3.194.0`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
