/* THE READING THE PLAYER GETS, BEFORE AND AFTER, IS ONE TEST — #302

   `readBout` is the eighteen-rule reading behind "What decided it", and until this check it was
   held by NOTHING: no check, no probe, not on the test handle. A system the player reads after
   every bout, with no cover at all, while `crit` and `graze` have six checks between them.

   #302 gave it a second job — called without a `res` it is the pre-flight warning on the booking
   modal — and the whole argument for doing it that way rather than writing a second rule set is
   that there is then only ONE set of conditions. That argument is worth exactly as much as
   something holding it, which is this.

   FOUR ARMS:

     1  every key in `PRE_SAY` is a key the engine actually pushes, READ OUT OF THE SOURCE. The
        first cut of this arm checked them against the keys a 4,000-pairing sweep happened to
        produce and went red on `kit_thin`, `kit_worn` and `lasting` — three rules that plainly
        exist twenty lines above the ones that did fire. The sweep cannot reach them (it does not
        vary kit strength, wear on a worn-out slot, or a lasting injury), and "my sample did not
        produce it" is not "the engine does not push it". That is the fault this project has
        shipped most often, committed inside a check written against it, and it is why this arm
        now reads `push(w, "key")` out of `readBout` itself.
     2  pre-flight never emits an OUTCOME rule. `won` is false in pre mode so the "and he won"
        branches stand down and the two crowd rules are guarded — if one ever leaks through, the
        player is being told before the bout what only makes sense after it.
     3  which `PRE_SAY` entries a sweep actually selects — REPORTED, NOT FAILED. #293's rule cuts
        both ways: a branch no input can reach is a comment, but a sweep that does not reach one
        cannot tell unreachable from merely unvaried. This arm prints the gap and names it as a
        limit of the sweep, because that is all it can honestly be.
     4  nothing renders `undefined`, `NaN` or `[object`. `PRE_SAY` reaches for `o.opp.wins`,
        `o.tier` and a worn kit slot, and a pre-flight runs on an offer the player has not taken,
        so the fields are not guaranteed the way they are after a bout.
*/
import fs from "node:fs";
import path from "node:path";
import { ROOT, hasHandle } from "../harness.mjs";

export const name = "reads";
export const describe = "the reading before the bout and the reading after it are the same test";

/* rules that only make sense once the bout has happened — none may appear in a pre-flight */
const OUTCOME = ["kit_good", "counter_his", "outclassed_him", "crowd", "cold_room", "plan", "nothing"];

export async function run({ p }){
  const lines = [], fails = [];
  if(!await hasHandle(p)) return { pass:false, why:"no test handle — build with `node build.js --test`", lines };

  const out = await p.evaluate(([OUTCOME])=>{
    const A = window.__LVDVS;
    const miss = ["readBout","PRE_SAY","newGameState","activeG","CLASSES","defaultKit"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    const d = A.newGameState("Rd","clean","READS-1");
    const men = A.activeG(d);
    if(!men.length) return { why:"no gladiator to build a pairing from" };
    const base = men[0], CLS = Object.keys(A.CLASSES);

    let s = 0x6C078965;
    const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const one = a => a[Math.floor(rnd() * a.length)];

    const preKeys = new Set(), postKeys = new Set(), leaked = [], dirty = [];
    let pre = 0, post = 0, threw = 0;

    for(let i=0;i<4000;i++){
      const cls = one(CLS), kit = A.defaultKit(one(CLS));
      const wear = {}; for(const k of Object.keys(kit)) wear[k] = one([100, 80, 25, 5]);
      const g = Object.assign({}, base, { cls, kit, wear,
        agi:one([30,45,60,78]), str:one([30,45,60,78]), end:one([35,47,55,70]),
        fatigue:one([5,40,56,72]), wins:one([0,2,5,12]), pfame:one([5,40,59,80]),
        strain:one([0,20,56,90]), regard:one([10,21,40,70]), form:one([-60,-31,0,45]), formLog:[] });
      const opp = Object.assign({}, base, { name:"Foe", cls:one(CLS), wins:one([0,3,7,14]) });
      const offer = { opp, venue:one(["pit","forum","amphi","greek"]),
        sky:one(["fair","rain","hot","cold","wind","perfect"]), tier:one([1,2,3,4]),
        stakes:one(["standard","sine"]), city:one([null,"puteoli"]), id:i };

      let a = null, b = null;
      try { a = A.readBout(d, g, offer); } catch(e){ threw++; continue; }          /* pre-flight */
      try { b = A.readBout(d, g, offer, { win:one([true,false]), crowd:one([20,39,60,80]) }, null); }
      catch(e){ threw++; continue; }
      pre += a.length; post += b.length;
      for(const x of a){
        preKeys.add(x.k);
        if(OUTCOME.indexOf(x.k) >= 0 && leaked.length < 4) leaked.push(x.k);
        const t = String(x.s == null ? "" : x.s);
        if((!t.trim() || /\bundefined\b|\bNaN\b|\[object /.test(t)) && dirty.length < 4)
          dirty.push(`${x.k}: "${t.slice(0, 70)}"`);
      }
      for(const x of b) postKeys.add(x.k);
    }
    return { preKeys:[...preKeys].sort(), postKeys:[...postKeys].sort(),
      said:Object.keys(A.PRE_SAY).sort(), leaked, dirty, pre, post, threw };
  }, [OUTCOME]);

  if(out.why) return { pass:false, why:out.why, lines };

  /* a sweep that produced nothing finds nothing wrong — #296's rule, in a check that drives
     rather than scans, where an empty result means the pairing builder stopped working. */
  if(!out.pre || !out.post){
    fails.push(`the sweep produced ${out.pre} pre-flight and ${out.post} post-bout lines — every arm `
      + `below reads those, so a sweep that yields nothing passes every one of them`);
    return { pass:false, why:fails[0], lines };
  }
  if(out.threw) fails.push(`readBout threw on ${out.threw} swept pairings`);

  /* ---- ARM 1: NO GHOST PRE-FLIGHT LINES, READ OUT OF THE SOURCE ---- */
  const src = fs.readFileSync(path.join(ROOT, "src", "ludus.jsx"), "utf8");
  const body = (src.match(/function readBout\(d, g, offer, res, ctx\)\{[\s\S]*?\n\}/) || [""])[0];
  const pushed = [...new Set([...body.matchAll(/push\(\s*[\d.]+\s*,\s*"(\w+)"/g)].map(m => m[1]))].sort();
  if(pushed.length < 10){
    fails.push(`only ${pushed.length} rule keys parsed out of readBout — the scan is reading a shape `
      + `that has moved, and a scan that finds nothing finds no ghosts either`);
  } else {
    const ghosts = out.said.filter(k => pushed.indexOf(k) < 0);
    if(ghosts.length)
      fails.push(`PRE_SAY names ${ghosts.join(", ")}, which \`readBout\` never pushes — a pre-flight `
        + `line keyed to a rule that does not exist can never appear`);
    lines.push(`PRE_SAY keys that are real rules in the source: ${out.said.length - ghosts.length} of ${out.said.length}`
      + ` · ${pushed.length} rule keys in readBout`);
  }

  /* ---- ARM 2: NO OUTCOME RULE BEFORE THE OUTCOME ---- */
  if(out.leaked.length)
    fails.push(`${[...new Set(out.leaked)].join(", ")} appeared in a PRE-FLIGHT — those rules read `
      + `whether he won or what the crowd reached, and cannot be known before the card is taken`);
  lines.push(`outcome rules leaking into the pre-flight: ${out.leaked.length}`);

  /* ---- ARM 3: EVERY PRE-FLIGHT LINE IS REACHABLE ---- */
  const unreached = out.said.filter(k => out.preKeys.indexOf(k) < 0);
  lines.push(`PRE_SAY entries a swept pairing selected: ${out.said.length - unreached.length} of ${out.said.length}`
    + (unreached.length ? ` · not reached here: ${unreached.join(", ")}` : ""));
  if(unreached.length)
    lines.push(`   REPORTED, NOT FAILED: this sweep does not vary kit strength, a worn-out slot or a `
      + `lasting injury, so it cannot tell unreachable from unvaried. Arm 1 has already proved they `
      + `are real rules; whether a real house meets them is a question for a probe.`);

  /* ---- ARM 4: NOTHING RENDERS BADLY ---- */
  if(out.dirty.length) fails.push(`pre-flight lines render badly: ${out.dirty.join(" · ")}`);
  lines.push(`pre-flight lines read: ${out.pre} · post-bout: ${out.post} · bad renders: ${out.dirty.length}`);
  lines.push(`rules the engine pushes at all: ${out.postKeys.length}`);

  if(!fails.length) lines.push("the warning before and the explanation after are one set of conditions");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
