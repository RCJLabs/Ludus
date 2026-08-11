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

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
