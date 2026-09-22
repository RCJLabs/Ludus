/* A DEFINITION THE GAME NEVER CALLS, IN A FILE THAT TELLS THE PLAYER WHAT IT DOES — #306

   `boon.mjs` (#305) held six sentences: the legacies' `boon` strings, and the two helpers that
   pay them, which had been written and called by nothing since the legacies existed. It was
   written against ONE table because that is where the fault was found.

   THE FAULT IS NOT ABOUT LEGACIES. A helper that computes a promised effect and is never called
   looks exactly the same wherever it sits, and it is mechanically findable: a top-level definition
   whose name appears in the game exactly once — on its own line. Run against the build before
   #305, this scan names `legacyPrice` and `legacyRegard` at positions 2 and 3 of a 26-line list,
   in under a second. #305 found them by reading a review's finding.

   Run against the build after it, it named two more of the same kind: `perkFame` and `perkPatron`,
   the permanent rewards of FIVE OF THE NINETEEN FEATS — A Hundred on the Sand, The Circuit, Primus
   of Capua, Ten Years a Lanista, The Sand at Rome. A house won a hundred bouts, was told "the name
   carries, fame +1 a week", and carried nothing. Both are wired now.

   THE TEST HANDLE IS NOT A CALLER. Everything after `process.env.LVDVS_TEST` is cut before the
   scan: an export list mentions a name without using it, and four of the entries below survived
   precisely by being on the handle and looking used to a naive grep.

   COMMENTS ARE NOT CALLERS EITHER. This file argues with itself in prose and names its own
   functions constantly; `voice.mjs` paid for that once. Comments are blanked, preserving newlines
   so the line numbers stay true.

   THREE ARMS:

     0  the scan found a plausible number of definitions at all. A scan that parses nothing
        reports nothing dead and passes, which is the fault #296 was written for.
     1  THE RATCHET. Every definition the game never calls is on the list below, WITH A REASON.
        A new one fails. An entry that has since acquired a caller also fails, so the list can
        only ever get shorter — a suppression file that is allowed to grow is not a check.
     2  `PERKS` — the table this check was written by finding. Every key must reach a helper that
        has a live call site. `boon.mjs` holds `LEGACIES` the same way and this does not repeat
        it: two checks making the same assertion about one table is the fault they both exist for.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "claims";
export const describe = "nothing is written, promised to the player, and called by nobody";

/* ---- WHAT IS DEAD TODAY, AND WHY IT IS STILL HERE ----
   Ranked by what it costs the player. This is a work list, not a silence: an entry earns its place
   by saying what would have to happen for it to leave. */
const KNOWN = {
  /* a sentence the player would want and never sees */
  masterNeed:    "builds \"N more wins, N more renown\" toward a mastery and nothing prints it — the same gap #299 closed for the legacies",
  agAge:         "the agenda's ageing: `agendaTick` writes a first-seen week EVERY WEEK and these four read it",
  agendaRanked:  "  — so the game knows a demand has been standing nine weeks and never says so",
  agendaTop:     "  — a whole feature, saved into `flags.agSeen`, wired to no panel",
  agWord:        "  — \"new this week\" / \"3 weeks now\" / \"standing\", written and never spoken",
  pactBlocks:    "the PRECISE exclusivity rule (a festival, in Capua, another editor's). The live filter at `weekGames` truncates the week's offers to the first one instead, whoever's it is — so \"nobody else's games in Capua\" is enforced as \"one card a week\"",

  /* a number written twice, one copy dead — #150 */
  REGARD_HOUSE:  "the house-warmth thresholds, which `houseWord` on the next line re-types as 75/50/25",
  FEAST_FRESH:   "6, \"weeks at which a feast means everything again\" — `feastFresh` re-derives it as `gap - 3` clamped",

  /* said twice */
  pairWordSays:  "a second sentence for the pair-word; the deadline at `heldQuestions` and the agenda row already say it",

  /* derived tables and word ladders nothing reads */
  W_KEYS:        "Object.keys(WEATHER), read by nobody",
  REGARD_KEYS:   "Object.keys(REGARD), read by nobody",
  PIETY_WORDS:   "the piety tier words, read by nobody",
  MENACE_WORDS:  "a six-word menace ladder, read by nobody",
  DL:            "the deadline kinds' names and colours — the panel that would print them does not exist",
  bandWord:      "poor/fair/sound/strong/exceptional, read by nobody",

  /* plain dead helpers: no claim attached, delete on sight */
  emptyKit:      "no claim attached",
  rivalFlush:    "no claim attached; `rivalBroke` and `rivalCan` beside it are both live",
  wifeYears:     "no claim attached",
  widowOf:       "no claim attached",
  dueIn:         "no claim attached",
  doctoreName:   "no claim attached",
};

/* comments blanked, newlines kept so the line numbers below are the file's own */
const blank = src => src
  .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "))
  .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, a) => a + m.slice(a.length).replace(/./g, " "));

export async function run({ p }){
  const lines = [], fails = [];
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");

  /* the handle is not a caller — see the header */
  const cut = src.indexOf("if (process.env.LVDVS_TEST");
  const game = blank(cut > 0 ? src.slice(0, cut) : src);

  const defs = [];
  game.split("\n").forEach((L, i) => {
    let m = L.match(/^(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/);
    if(m) defs.push({ name:m[1], line:i+1 });
    m = L.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if(m) defs.push({ name:m[1], line:i+1 });
  });

  /* ---- ARM 0: THE SCAN FOUND SOMETHING TO SCAN ---- */
  if(cut <= 0)
    fails.push("the test handle's opening line was not found, so the export list is being counted "
      + "as call sites and every dead definition below reads as live");
  if(defs.length < 500){
    fails.push(`only ${defs.length} top-level definitions parsed out of a ${game.split("\n").length}-line `
      + `file — the shape has moved and a scan that finds nothing finds nothing dead`);
    return { pass:false, why:fails[0], lines };
  }

  const uses = new Map();
  for(const w of game.match(/[A-Za-z_$][\w$]*/g) || []) uses.set(w, (uses.get(w) || 0) + 1);
  const dead = defs.filter(d => (uses.get(d.name) || 0) <= 1);

  /* ---- ARM 1: THE RATCHET ---- */
  const fresh = dead.filter(d => !KNOWN[d.name]);
  if(fresh.length)
    fails.push(`${fresh.map(d=>`${d.name} (line ${d.line})`).join(", ")} — written and called by `
      + `NOTHING. If the player is told what it does, that sentence is false; if not, delete it. `
      + `Either way it does not go on the list below without a reason beside it`);

  const stale = Object.keys(KNOWN).filter(k => !dead.some(d => d.name === k));
  if(stale.length)
    fails.push(`${stale.join(", ")} now ${stale.length === 1 ? "has a caller" : "have callers"} and `
      + `must come off the list — a list that is allowed to keep entries it no longer needs stops `
      + `being a ratchet and becomes a place to put things`);

  lines.push(`top-level definitions the game defines: ${defs.length} · never called: ${dead.length}`
    + ` · all of them accounted for: ${fresh.length === 0 && stale.length === 0 ? "yes" : "no"}`);
  if(!fresh.length && !stale.length){
    const claims = ["masterNeed","agAge","agendaRanked","agendaTop","agWord","pactBlocks"]
      .filter(k => KNOWN[k]).length;
    lines.push(`   of those, ${claims} would be a sentence the player never gets or a rule enforced `
      + `some other way; the rest are duplications and plain dead helpers. See the list in this file.`);
  }

  /* ---- ARM 2: EVERY PERK REACHES A LIVE HELPER ---- */
  if(!await hasHandle(p)) return { pass:false, why:"no test handle — build with `node build.js --test`", lines };
  const keys = await p.evaluate(()=>{
    const A = window.__LVDVS;
    return A.PERKS ? { keys:Object.keys(A.PERKS), says:A.PERKS } : null;
  });
  if(!keys || keys.keys.length < 4){
    fails.push(`PERKS came off the handle with ${keys ? keys.keys.length : "nothing"} in it — this `
      + `arm cannot hold a table it cannot read`);
  } else {
    const paid = [], unpaid = [];
    for(const k of keys.keys){
      /* the helper is the line that asks `perkOn` about this key; it is live if anything calls it */
      const owner = (game.match(new RegExp(`^(?:const|let)\\s+([A-Za-z_$][\\w$]*)\\s*=[^\\n]*perkOn\\s*\\([^)]*["']${k}["']`, "m")) || [])[1];
      if(!owner){ unpaid.push(`${k} (no helper reads it)`); continue; }
      const n = uses.get(owner) || 0;
      if(n <= 1) unpaid.push(`${k} → ${owner} is defined and never called`);
      else paid.push(`${k}→${owner}`);
    }
    if(unpaid.length)
      fails.push(`${unpaid.join("; ")} — \`PERKS\` tells the player what that feat is permanently `
        + `worth and nothing in the game pays it`);
    lines.push(`perks whose promise reaches a live helper: ${paid.length} of ${keys.keys.length}`
      + ` · ${paid.join(" · ")}`);
  }

  if(!fails.length) lines.push("nothing is written, promised, and paid by nobody");
  return { pass: fails.length === 0, why: fails.slice(0, 2).join("; ") || null, lines };
}
