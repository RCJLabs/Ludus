/* ONE DIE FOR SIXTY-ONE EVENTS — second phase queue #245, phase 1: the instrument, as a check

   `pickEvent(d)` is `for(k of shuffled(Object.keys(EVENTS))){ const ev = EVENTS[k].make(d); if(ev)
   return ev; }` — a uniform draw over whatever is eligible that week. Measured (`probes/pace.mjs`,
   12 x 420): thirteen events eligible on the median week, four or more on 99.9% of weeks, so an
   event eligible one week in a hundred must also win a 1-in-13 shuffle. The source wrote that
   arithmetic beside GRUDGE_SABOTAGE and fixed one threshold. Phase 2 of #245 replaces the shuffle
   with a weighted draw; this is the number it will be measured against, kept as a check so the
   reach of any event is a figure that cannot drift back to "nobody knows".

   TWO KINDS OF EVENT, and the first draft of the instrument conflated them: 36 of the 61 have a
   `make()` that can return something — those are DRAWN, and the die governs them. 25 have a
   `make()` that is exactly `{ return null; }` — feud, refusal, ask, booking, leagueYear, the arcs —
   those are RAISED by their own systems (`feudWeek`, `refuseWeek`, `askWeek`, `fireArc`) and the
   die never sees them. A reach floor on the raised ones would fail every one of them for the wrong
   reason; a reach floor that skips them would let a raised event go dead unseen. So: the drawn get
   an eligibility floor, the raised get a firing floor, and the split is read off `make.toString()`
   rather than written down here, so a new event lands in the right column by itself.

   FOUR ARMS, seeded, 4 houses x 220 weeks under the reference player:
   1 · THE DRAW IS A CROWD — the eligible set's median size is at least 2. This is the premise of
       #245; if it ever reads 1 the draw is a queue and the item's whole argument is gone.
   2 · THE REACH FLOOR — every drawn event is eligible on at least one week of the run. A drawn
       event that is never eligible is content nobody can meet, and its make() is the place to look.
   3 · THE RAISED ARE RAISED — the common raised events (refusal, leagueYear, booking, ask) fire at
       least once each in 880 weeks; they fired 280 / 184 / 113 / 45 in 3,616, so a zero is a broken
       raise site, not variance.
   4 · AND IT IS WRITTEN DOWN — the eligibility table goes to test/pace-tally.json, one line per run,
       so phase 2 has a before. Append-only, and a run that cannot write it says so and carries on. */
import fs from "node:fs";
import path from "node:path";
import { found, clearAll, installRope, ROOT } from "../harness.mjs";

const TALLY = path.join(ROOT, "test", "pace-tally.json");
const readTally = () => { try { const j = JSON.parse(fs.readFileSync(TALLY, "utf8")); return Array.isArray(j) ? j : []; } catch(e){ return []; } };
const version = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version || "?"; } catch(e){ return "?"; } };

export const name = "pace";
export const describe = "every event's reach is a number: the drawn are eligible, the raised are raised";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"PACE-1" });
  await clearAll(p, 12);
  await installRope(p);      /* found() reloads the page; the rope is injected, not built in */

  const measure = (SEEDP) => p.evaluate(([H, W, SEEDP])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    if(!A.EVENTS || !R || typeof R.lanista !== "function") return { why:"no EVENTS table or no rope on the handle" };
    const clone = x => JSON.parse(JSON.stringify(x));
    const keys = Object.keys(A.EVENTS);
    const raisedOnly = k => /\{\s*return\s+null;?\s*\}\s*$/.test(String(A.EVENTS[k].make || ""));
    const drawn = keys.filter(k=>typeof A.EVENTS[k].make === "function" && !raisedOnly(k));
    const raised = keys.filter(k=>typeof A.EVENTS[k].make === "function" && raisedOnly(k));
    const elig = {}, fired = {}, sizes = [];
    let scanned = 0, weeks = 0, longest = 0; const firstAt = {};
    for(let h=0; h<H; h++){
      const d = A.newGameState("Pace", "clean", `${SEEDP}-${h}`, null);
      let lived = 0;
      for(let w=0; w<W; w++){
        if(d.over) break;
        /* every week at home is scanned, on a clone with the standing question cleared: at the top
           of this loop last week's draw is still pending on three weeks in four, and the first
           draft skipped those and scanned 230 weeks of 871 */
        if(!d.rome && !d.city && !d.travel){
          /* AND THE SCAN DOES NOT MOVE THE THING IT MEASURES. `make()` on a clone still draws from
             the one global R(), so a scan of 36 makes a week re-phased the run underneath it — 871
             weeks played with 230 scans, 757 with 610. The stream is put back where it was, so the
             run is the reference run and the tally compares like with like across builds. */
          const st = A.rngGet();
          const base = clone(d); base.pendingEvent = null;
          let n = 0;
          for(const k of drawn){ let ev = null; try { ev = A.EVENTS[k].make(clone(base)); } catch(e){}
            if(ev){ n++; elig[k] = (elig[k]||0) + 1; if(firstAt[k] == null) firstAt[k] = lived; } }
          A.rngSet(st);
          sizes.push(n); scanned++;
        }
        let did; try { did = R.lanista(d); } catch(e){ break; }
        weeks++; lived++; longest = Math.max(longest, lived);
        for(const k of Object.keys((did && did.events) || {})) fired[k] = (fired[k]||0) + did.events[k];
      }
    }
    const s = sizes.slice().sort((a,b)=>a-b), at = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
    const pct = k => Math.round(1000 * (elig[k]||0) / Math.max(1, scanned)) / 10;
    const table = drawn.map(k=>[k, pct(k)]).sort((a,b)=>b[1]-a[1]);
    return { keys: keys.length, drawn: drawn.length, raised: raised.length, raisedKeys: raised, weeks, scanned, longest, firstAt,
      size: sizes.length ? { p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] } : null,
      atLeast4: sizes.length ? Math.round(1000 * sizes.filter(n=>n>=4).length / sizes.length) / 10 : 0,
      table, never: drawn.filter(k=>!(elig[k]>0)), fired };
  }, [4, 220, SEEDP]);
  const r = await measure("PACE");
  if(r.why) return { pass:false, why:r.why, lines };

  lines.push(`${r.keys} events: ${r.drawn} drawn by the die, ${r.raised} raised by their own systems · ${r.weeks} weeks played, ${r.scanned} scanned`);
  /* 1 */
  lines.push(`1. eligible set per scanned week: p10 ${r.size.p10} · p50 ${r.size.p50} · p90 ${r.size.p90} · max ${r.size.max} — four or more on ${r.atLeast4}% of weeks`);
  if(!r.size || r.size.p50 < 2) bad.push(`arm 1: the eligible set's median is ${r.size ? r.size.p50 : "?"} — the draw is a queue, not a die`);
  /* 2 — A REGRESSION FLOOR, NOT AN ABSOLUTE ONE. The first draft failed seven events for never
     being eligible under the reference player, and read their gates: owedLife wants a cloth the
     rope never throws, whispers an ear it never hires, stash a purse, stolenSteel a named blade,
     primacy the primus — rope-dark, the standing caveat of dark.mjs, not dead. What CAN be held is
     that reach does not fall to zero between builds: an event eligible on the last recorded run and
     never eligible now is a gate somebody shut. The never-eligible set is reported either way. */
  const top = r.table.slice(0, 6).map(([k,v])=>`${k} ${v}%`).join(" · "), floor = r.table.filter(([k,v])=>v>0).slice(-6).map(([k,v])=>`${k} ${v}%`).join(" · ");
  lines.push(`2. most eligible: ${top}`);
  lines.push(`2. rarest that are reachable: ${floor}`);
  /* only what a four-house sample can see: an event reachable at 0.2% last time is one week in
     six hundred, and a legitimate re-phasing of the run flips that to zero by luck, not by a gate */
  const prior = readTally().filter(x=>x && x.pass && Array.isArray(x.reach)).slice(-1)[0] || null;
  /* ---- AND THE FLOOR LEARNED EXPOSURE — v3.205.0 ----
     `roomFire` wants eight built wings; on the last recorded run two houses had them by weeks 72 and
     208, on this one none did, and the floor read "a gate somebody shut" for an event whose gate had
     not moved. Rows carry `firstAt` now — the week of its house each event was first eligible — and
     a prior only counts against a run whose longest house lived at least that long. Priors written
     before the field exist; against those the transitional rule holds: a zero fails only when both
     current sets scanned at least as much as the prior did, otherwise it is reported. */
  const exposed = k => !prior || !prior.firstAt || prior.firstAt[k] == null || (r.longest || 0) >= prior.firstAt[k];
  const wasReachable = prior ? new Set(prior.reach.filter(([k,v])=>v >= 1 && exposed(k)).map(([k])=>k)) : null;
  let shut = wasReachable ? r.never.filter(k=>wasReachable.has(k)) : [];
  const priorHasExposure = !!(prior && prior.firstAt);
  /* ---- AND A SECOND DRAW BEFORE CALLING IT — v3.205.0 ----
     The floor assumed the reference run keeps its shape across builds. It does not: on the phase-3
     release the four PACE houses re-phased to deaths at weeks 18 / 53 / 63 / 133 (634 weeks became
     263), and four state-gated events — poached, roomFire, bribedEditor, thugs — read "never" because
     no house lived long enough to hold the grudge, the booking or the purse they wait on. The opening
     measured on sixty houses was unmoved (51 → 55 standing). A gate somebody shut is shut on every
     seed; a run that never got there is not. So a tripped floor takes a second set of four houses,
     the way `survive` takes a second draw, and fails only on what is unreachable on both. */
  let second = null;
  if(shut.length){
    second = await measure("PACE2");
    if(!second.why){ let stillShut = shut.filter(k => second.never.includes(k));
      lines.push(`2. the floor tripped on ${shut.join(", ")} — a second set of four houses (${second.weeks} weeks played, ${second.scanned} scanned) ${stillShut.length ? `agrees on ${stillShut.join(", ")}` : "reaches every one of them"}`);
      if(stillShut.length && !priorHasExposure && (r.scanned < prior.scanned || second.scanned < prior.scanned)){
        lines.push(`2. reported, not failed: the prior (${prior.v}) carries no exposure field and a set scanned less than it did (${r.scanned} and ${second.scanned} against ${prior.scanned}) — ${stillShut.join(", ")} may be late-state, and this run's row carries the field for next time`);
        stillShut = []; }
      shut = stillShut; } }
  lines.push(`2. never eligible under the reference player (${r.never.length}): ${r.never.join(", ") || "none"}${prior ? ` — against the last recorded run, ${shut.length} of them were reachable then` : " — no prior run to compare against"}`);
  if(shut.length) bad.push(`arm 2: reach fell to zero on ${shut.join(", ")} on two seed sets — eligible on the last recorded run (${prior.v}) and never in ${r.scanned}${second && !second.why ? ` + ${second.scanned}` : ""} weeks now: a gate somebody shut`);
  /* 3 */
  const COMMON = ["refusal","leagueYear","booking","ask"];
  const dead = COMMON.filter(k=>!(r.fired[k]>0));
  lines.push(`3. raised events fired: ${COMMON.map(k=>`${k} ${r.fired[k]||0}`).join(" · ")} (of ${r.raised} raised: ${r.raisedKeys.join(", ")})`);
  if(dead.length) bad.push(`arm 3: raised event(s) that never fired in ${r.weeks} weeks — ${dead.join(", ")}: a broken raise site, not variance`);
  /* 4 */
  try {
    const rows = readTally();
    rows.push({ v: version(), weeks: r.weeks, scanned: r.scanned, longest: r.longest, firstAt: r.firstAt, drawn: r.drawn, raised: r.raised, p50: r.size.p50, atLeast4: r.atLeast4,
      top: r.table.slice(0, 6), floor: r.table.filter(([k,v])=>v>0).slice(-6), never: r.never,
      reach: r.table.filter(([k,v])=>v>0), pass: bad.length === 0 });
    fs.writeFileSync(TALLY, JSON.stringify(rows, null, 1) + "\n");
    lines.push(`4. written to pace-tally.json — ${rows.length} run${rows.length===1?"":"s"} on record`);
  } catch(e){ lines.push(`4. the tally could not be written (${e.message}) — reported, not failed`); }

  return { pass: bad.length === 0 && !errors.length, why: bad[0] || null, lines };
}
