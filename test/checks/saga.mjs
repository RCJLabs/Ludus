/* THE HOUSE'S HERO STORY SURVIVES A WOUND, AND ENDS OUT LOUD

   Audit item #222: "13 of 16 houses started one; 12 reached stage 2; 5 reached 'his reckoning is
   set'; 0 reached the finale — the game's built-in hero story has never once paid off. Recommend
   the reckoning be guaranteed to schedule within a named window, and a LOSS close the story too."

   THE HEADLINE IS RIGHT AND THE DIAGNOSIS IS NOT. `sagaWeek` read

       if(!g || g.status !== "active"){ endSaga(d, g); return; }

   and "not active" includes INJURED. So a gashed shoulder — four weeks on the tables, then back to
   the palus — DELETED the house's hero story: `d.saga` nulled, an eighteen-week cooldown set, and
   not one line in the chronicle, because `endSaga` only ever spoke when the man was dead.

   MEASURED OVER 9,750 WEEKS AND 103 SAGAS (`probes/saga.mjs`, 40 houses):

     ended on the champion going INJURED   69 of 103   67%
     ended on his death                    19
     reached stage 3, the reckoning        29 (28%)
     a saga's life                         median 3 weeks

   The reckoning was never the problem. The story was being deleted by a wound that heals, three
   weeks in, and the item read the wreckage at the wrong end.

   AFTER: a wound sets the story aside instead of ending it — renown slips toward the floor of the
   stage he has reached, so a long convalescence costs momentum and never the story — and a loss or
   an unanswered reckoning CLOSES it rather than resetting to stage 2, which is the item's own
   second recommendation. Sagas ignite less (103 -> 64, because they now live rather than churn)
   and reach much further: stage 2 73% -> 92%, stage 3 28% -> 64%, median life 3 -> 15 weeks.

   THE FINALE IS STILL RARE — 1 saga in 64 took the wooden sword, against 1 in 103 before, and
   this release does not claim to have fixed that. What it fixes is that the story now survives to
   its third act and closes as a story when it closes. Half of all reckonings are still unanswered.

   FIVE ARMS:
   1 · A WOUND DOES NOT END IT. A champion planted injured, run for weeks, and the saga is still
       there when he walks back into the yard.
   2 · DEATH DOES. The one ending that was always honoured must stay honoured, or arm 1 has simply
       made the story unkillable.
   3 · EVERY ENDING SPEAKS. A story that stops with nothing in the chronicle was never a story;
       four of the five ways it could stop used to be silent.
   4 · AND IT GETS SOMEWHERE, over real play — a third act reached often enough to be a feature.
   5 · WITH ENOUGH SAGAS TO MEAN IT. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "saga";
export const describe = "the house's hero story survives a wound, and ends out loud";
export const slow = true;   /* plays real houses for the rate arm */

const STAGE3_FLOOR = 0.40;   /* measured 64%; under 40% the story is back to not reaching its own third act */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"SAGA-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate((FLOOR)=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","activeG","sagaWeek","endSaga"].filter(k=>A[k]==null);
    if(miss.length) return { miss };

    /* ---- a real house carried to a real saga, then the champion is hurt ---- */
    const build = (tag) => {
      const d = A.newGameState("Saga", "clean", "SAGA-K"+tag, null);
      for(let w=0; w<260 && !d.saga; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
      return d.saga ? d : null;
    };
    let d = null;
    for(const t of ["A","B","C","D","E","F"]){ d = build(t); if(d) break; }
    if(!d) return { noSaga:true };

    const clone = x => { try { return structuredClone(x); } catch(e){ return JSON.parse(JSON.stringify(x)); } };
    const champ = s => s.gladiators.find(g=>g.id === s.saga.gid);
    /* ---- WHAT "IT SPOKE" ACTUALLY MEANS, after two wrong answers ----
       `chron` unshifts onto `d.log`. The first cut read `d.chronicle`, a field that does not
       exist. The second counted `log.length + kept.length` — which is FLAT BY CONSTRUCTION once
       the log is full, because every new line pops one off the end that is either discarded or
       moved to `kept`. Both cuts reported all four endings silent while all four were speaking.
       What a new line actually is: a different object at the head of the log. */
    const head = s => (s.log && s.log[0]) || null;
    const spokeSince = (s, was) => { const h = head(s);
      return !!h && h !== was && !!String(h.text||"").trim(); };

    /* 1 — a wound sets it aside */
    const hurt = clone(d);
    { const g = champ(hurt); g.status = "injured";
      g.injury = { name:"Gashed shoulder", part:"shoulder", weeks:6 }; }
    const beforeStage = hurt.saga.stage, beforeRenown = hurt.saga.renown;
    for(let w=0; w<5; w++){ try { A.sagaWeek(hurt); } catch(e){ break; } }
    const survivedHurt = !!hurt.saga;
    const renownFell = hurt.saga ? hurt.saga.renown <= beforeRenown : null;
    const stageHeld = hurt.saga ? hurt.saga.stage >= beforeStage : null;

    /* 2 — death still ends it */
    const dead = clone(d);
    { const g = champ(dead); g.status = "dead"; }
    const h0 = head(dead);
    try { A.sagaWeek(dead); } catch(e){}
    const endedOnDeath = !dead.saga, spokeOnDeath = spokeSince(dead, h0);

    /* and a man who has left the books ends it too */
    const sold = clone(d);
    { const g = champ(sold); g.status = "sold"; }
    try { A.sagaWeek(sold); } catch(e){}
    const endedOnSold = !sold.saga;

    /* 3 — every ending speaks. `endSaga` is called directly with each reason it can carry. */
    const spoke = {};
    for(const why of ["dead","gone","beaten","unanswered"]){
      const s = clone(d); const g = champ(s);
      if(why === "dead") g.status = "dead";
      const was = head(s);
      try { A.endSaga(s, why === "dead" ? g : null, why, "Spiculus"); } catch(e){}
      spoke[why] = { ended: !s.saga, said: spokeSince(s, was) ? 1 : 0,
        line: spokeSince(s, was) ? String(head(s).text).slice(0, 54) : null };
    }

    /* 4 — and it gets somewhere over real play */
    let ignited = 0, st2 = 0, st3 = 0, st4 = 0, hurtEnds = 0, weeks = 0;
    for(let h=0; h<10; h++){
      const e = A.newGameState("Saga", "clean", "SAGA-R"+h, null);
      const seen = new Map();
      for(let w=0; w<300; w++){
        if(e.over) break;
        try { R.lanista(e); } catch(err){ break; }
        weeks++;
        const s = e.saga;
        if(s){
          if(!seen.has(s.since)){ seen.set(s.since, { top:s.stage }); ignited++; }
          const rec = seen.get(s.since);
          if(s.stage > rec.top) rec.top = s.stage;
        }
      }
      for(const rec of seen.values()){ if(rec.top>=2) st2++; if(rec.top>=3) st3++; if(rec.top>=4) st4++; }
    }
    return { survivedHurt, renownFell, stageHeld, endedOnDeath, spokeOnDeath, endedOnSold, spoke,
      ignited, st2, st3, st4, weeks, beforeStage };
  }, STAGE3_FLOOR);

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(r.noSaga) return { pass:false, why:`no house ignited a saga in 260 weeks — nothing was measured`, lines };

  lines.push(`a champion hurt at stage ${r.beforeStage}: the story ${r.survivedHurt ? "waited for him" : "WAS DELETED"}`
    + `${r.survivedHurt ? ` (renown ${r.renownFell ? "slipped" : "held"}, stage ${r.stageHeld ? "kept" : "LOST"})` : ""}`);
  lines.push(`death ends it: ${r.endedOnDeath} · and says so: ${r.spokeOnDeath} · leaving the books ends it: ${r.endedOnSold}`);
  lines.push(`  every close speaks — ${Object.entries(r.spoke).map(([k,v])=>`${k} ${v.ended?"ends":"DOES NOT END"}/${v.said} line${v.said===1?"":"s"}`).join(" · ")}`);
  const pc = n => r.ignited ? `${(n/r.ignited*100).toFixed(0)}%` : "—";
  lines.push(`over ${r.weeks} played weeks: ${r.ignited} sagas · stage 2 ${pc(r.st2)} · stage 3 ${pc(r.st3)} · the finale ${r.st4}`);

  /* 1 — a wound sets it aside */
  if(!r.survivedHurt)
    bad.push(`a champion with a gashed shoulder ends the house's hero story — that is #222's real fault, `
      + `and it deleted 67% of all sagas before v3.165.0`);
  else if(!r.stageHeld)
    bad.push(`the story lost a stage while the champion was on the tables — a wound may cost him momentum, `
      + `never a stage he has already reached`);
  /* 2 — but death still does */
  if(!r.endedOnDeath) bad.push(`the champion's death does not end the saga — arm 1 has made the story unkillable`);
  if(!r.endedOnSold) bad.push(`a champion off the books does not end the saga — his story cannot go on without him`);
  /* 3 — and every close speaks */
  for(const [why, v] of Object.entries(r.spoke)){
    if(!v.ended) bad.push(`\`endSaga\` with reason "${why}" left the saga standing`);
    else if(!v.said) bad.push(`the "${why}" ending writes nothing to the chronicle — four of the five ways this `
      + `story could stop used to be silent, which is how it went a hundred releases without anyone noticing `
      + `it never landed`);
  }
  /* 4 and 5 — and it gets somewhere, on enough sagas to mean it */
  if(r.ignited < 6)
    bad.push(`only ${r.ignited} sagas ignited in ${r.weeks} weeks — too few for the rate arm to mean anything`);
  else if(r.st3 / r.ignited < STAGE3_FLOOR)
    bad.push(`only ${pc(r.st3)} of sagas reached their third act — it was 28% before v3.165.0 and 64% after, `
      + `and under ${(STAGE3_FLOOR*100)|0}% the story is back to not reaching its own reckoning`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`a wound sets the story aside, and every way it closes is spoken`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
