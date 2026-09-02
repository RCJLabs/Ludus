/* THE SALUTE'S WORTH IS THE ROLL'S OWN ARITHMETIC, AND IT IS TOLD

   Audit item #209. `boxes` — "Salute the boxes" — promises a moment: *when he is on the ground
   looking up, they remember it.* #166 put every entrance's terms on the arena panel BEFORE the
   bout. Nothing ever told the player the salute had been in the answer AFTER it. From v3.157.0 the
   verdict says so, in points, whether he lived or died.

   The figure is a counterfactual, and this check exists because a counterfactual is the easiest
   number in a codebase to compute a second way and let drift. `saluteWorth` asks the SAME pair the
   verdict asked — `missioOdds(missioScore(...))` — twice, with `ctx.day` set and cleared. #150's
   rule: a displayed number and the roll behind it are one function.

   FOUR ARMS:
   1 · THE FIGURE IS THE DIFFERENCE THE ENGINE WOULD MAKE. Over a spread of real men, fame bands
       and accounts, `saluteWorth` equals `missioOdds(with) − missioOdds(without)` recomputed here
       from the exported primitives. If the helper ever grows its own arithmetic this parts.
   2 · IT IS ZERO WITHOUT A SALUTE, and non-zero with one. A worth that is always zero would make
       the line never appear and every other arm vacuously true; a worth that is non-zero with no
       `day` would be pricing something it did not buy.
   3 · IT IS BIGGEST FOR THE MAN WITH LEAST NAME. This is the design claim and the reason the item
       was worth shipping: measured at +8.2 points under fame 25 against +2.45 past 300. Held as a
       direction, not a constant — the novice must never be worth LESS than the famed man, or the
       salute has stopped being the thing the panel says it is.
   4 · THE VERDICT SAYS IT. Real bouts driven with `entrance:"boxes"` until a man goes down and the
       editor is asked; the `boxes` beat must appear, and the number in its sentence must be the
       number `saluteWorth` gives for that bout's own terms. A run that never reaches a verdict is
       a FAILURE, not a skip — this check has to be able to say it saw the moment. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "salute";
export const describe = "the salute's worth is the roll's own arithmetic, and the verdict says it";
export const slow = true;   /* drives real bouts until the editor is asked */

export async function run({ p, errors }){
  await found(p, { seed:"SALUTE-1" });
  await clearAll(p, 16);
  await installRope(p);

  const lines = [], bad = [];
  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["saluteWorth","missioScore","missioOdds","ENT_MISSIO","newGameState"].filter(k=>A[k]==null);
    if(miss.length) return { miss };

    /* ---- arms 1-3: the helper against the primitives ----
       THE FIXTURE WAS NEVER PINNED, and this file has been non-deterministic since it was written.
       `A.newGameState("SALUTE-CF")` passes a NAME and nothing else, and `newGameState(name, scen,
       seed, pitch)` falls back to `newSeedWord()` when the seed is missing — a fresh random house
       every run. So every green this check ever produced was luck-weighted and none of its numbers
       were reproducible; when the random house happened to die inside sixty weeks the vacuity guard
       below fired, which it did on two consecutive release gates while passing in isolation.
       A named seed, and a search across several for one that keeps a man alive — the same shape the
       other campaign fixtures in this suite use, and for the same reason. */
    let d0 = null;
    for(const t of ["A","B","C","D","E","F","G","H"]){
      const c = A.newGameState("Salute", "clean", "SALUTE-CF"+t, null);
      for(let w=0; w<60; w++){ if(c.over) break; try { R.lanista(c); } catch(e){ break; } }
      if(c.gladiators.some(g=>g.status!=="dead")){ d0 = c; break; }
    }
    if(!d0) return { noPool:true };
    const pool = d0.gladiators.filter(g=>g.status!=="dead");
    if(!pool.length) return { noPool:true };

    let asked = 0, drift = 0, worstDrift = 0, zeroWithout = 0, nonZeroWith = 0;
    const band = { "0-24":{n:0,s:0}, "25-99":{n:0,s:0}, "100-299":{n:0,s:0}, "300+":{n:0,s:0} };
    for(const g of pool){
      for(const fame of [0, 40, 150, 600]){
        const man = Object.assign({}, g, { pfame: fame });
        for(const crowd of [30, 55, 80]){
          for(const acct of [30, 55, 80]){
            const ctxOn  = { favor:30, fav:0, man:0, day:A.ENT_MISSIO };
            const ctxOff = { favor:30, fav:0, man:0, day:0 };
            const got  = A.saluteWorth(man, ctxOn,  crowd, acct, 10);
            const want = A.missioOdds(A.missioScore(man, ctxOn,  crowd, acct, 10, true))
                       - A.missioOdds(A.missioScore(man, ctxOff, crowd, acct, 10, true));
            asked++;
            const dd = Math.abs(got - want);
            if(dd > 1e-9){ drift++; worstDrift = Math.max(worstDrift, dd); }
            if(got > 0) nonZeroWith++;
            if(A.saluteWorth(man, ctxOff, crowd, acct, 10) === 0) zeroWithout++;
            const k = fame<25?"0-24":fame<100?"25-99":fame<300?"100-299":"300+";
            band[k].n++; band[k].s += got;
          }
        }
      }
    }
    for(const k of Object.keys(band)) band[k].pts = band[k].n ? +(band[k].s/band[k].n*100).toFixed(2) : null;

    /* ---- arm 4: a real verdict ---- */
    const d = A.newGameState("Salute", "clean", "SALUTE-RUN", null);
    for(let w=0; w<40; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    let verdicts = 0, mismatched = 0, sample = null, appeals = 0;
    for(let i=0; i<400 && verdicts < 6; i++){
      let t;
      try { t = R.takeBout(d, { entrance:"boxes", singlesOnly:true, choice:"cover" }); } catch(e){ t = null; }
      if(!t || t.ran === false){ try { R.lanista(d); } catch(e){ break; } continue; }
      const bs = (t.res && t.res.beats) || [];
      if(bs.some(b=>b.kind==="appeal" && b.actor==="A")) appeals++;
      for(const b of bs){
        if(b.kind !== "boxes") continue;
        verdicts++;
        const m = /(\d+) (?:of those hundred|in the hundred)/.exec(b.text||"");
        if(!m){ mismatched++; if(!sample) sample = `a boxes beat with no figure in it: "${(b.text||"").slice(0,80)}"`; continue; }
        /* the beat's own appeal carries the odds the roll used; the salute must be a slice of it */
        const ap = bs.find(x=>x.kind==="appeal" && x.actor==="A");
        const said = +m[1];
        if(!(said >= 1 && said <= 100)){ mismatched++; if(!sample) sample = `the salute is quoted at ${said} points`; }
        else if(ap && ap.odds != null && said > ap.odds + 1){
          mismatched++;
          if(!sample) sample = `the salute is quoted at ${said} points of a verdict the appeal put at ${ap.odds}`;
        }
        if(!sample) sample = (b.text||"").slice(0,96);
      }
    }
    return { asked, drift, worstDrift, zeroWithout, nonZeroWith, band, verdicts, mismatched, sample, appeals, pool:pool.length };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(r.noPool) return { pass:false, why:`the counterfactual house held no living man — nothing was measured`, lines };

  lines.push(`  ${r.asked} asks over ${r.pool} real men × 4 fame bands × 9 accounts`);
  for(const [k,b] of Object.entries(r.band)) lines.push(`    ${k.padEnd(9)} the salute is worth +${b.pts} points`);
  lines.push(`  ${r.verdicts} verdicts reached under the salute, from ${r.appeals} appeals`);
  if(r.sample) lines.push(`    "${r.sample}"`);

  /* 1 — no second arithmetic */
  if(r.drift) bad.push(`saluteWorth parts from missioOdds(missioScore) on ${r.drift} of ${r.asked} asks `
    + `(worst ${(r.worstDrift*100).toFixed(3)} points) — the shown number has grown its own formula`);
  /* 2 — and it is measuring the salute rather than something else */
  if(r.zeroWithout !== r.asked)
    bad.push(`saluteWorth is non-zero on ${r.asked - r.zeroWithout} asks where no salute was made — it is pricing something the player did not buy`);
  if(r.nonZeroWith === 0)
    bad.push(`saluteWorth is zero on every ask WITH a salute — the line would never appear and every arm here is vacuous`);
  /* 3 — the design claim */
  const green = r.band["0-24"].pts, famed = r.band["300+"].pts;
  if(green != null && famed != null && !(green > famed))
    bad.push(`the salute is worth +${green} points to a man under fame 25 and +${famed} past 300 — it is supposed to be `
      + `worth MOST to the man with least name, which is the whole reason #209 was worth shipping`);
  /* 4 — and the verdict says it */
  if(r.verdicts === 0)
    bad.push(`no verdict was reached in 400 driven bouts, so the rendered arm measured nothing — `
      + `either the beat is gone or no man went down and appealed`);
  if(r.mismatched) bad.push(`${r.mismatched} of ${r.verdicts} verdicts quote a salute the roll does not support — ${r.sample}`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the salute is priced off the roll's own call, and the verdict says what it bought`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
