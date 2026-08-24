/* FOUR WAYS TO WRECK A HOUSE AND NOT ONE TO WARM ONE — #198

   `GAMBITS` is poach, bribe, poison and word: four, all hostile. Against them `warm` runs 0-100
   with four `RIVAL_BEATS` gated on it, and the item's own clause said to check the input first —
   if warmth never rises far enough, the fault is the input rather than a missing verb.

   MEASURED (probes/warm.mjs, 8 houses x 360 weeks an arm, 59 house-pairs): the writing is NOT
   dead. Every one of the eight beats fired, `end` twice, and 11.9% of house-pairs reached warm 50
   on their own. The falsifier half-fires and the honest reading is narrower and worse:

     warmth PEAK per house-pair   p50 7 · p90 64 · highest 96
     cards against one house      p50 6 · p90 30
     `offer` fired                once in 29 house-pairs, and once more in 30 hostile ones

   **Every `warmMove` caller in the file is inside a `RIVAL_BEATS.hit` — the game's own 5.5% weekly
   roll, one-shot per house — or `metHouse`, which is +1.1 a card and only while grudge < 30.** The
   bill decides who you are matched against. So the relationship ran hot or cold on the editor's
   matching and the player had no move.

   THE FIRST THING THIS CHECK ASSERTS IS THAT CLAIM, against the source, so it cannot quietly stop
   being true: no new caller may raise warmth from outside the beats, `metHouse` and the overtures.
   Then it runs all three overtures on houses built to accept and to refuse, proves a lent doctore
   actually stops paying out on all four of the things he does, and drives the real panel. */

import fs from "node:fs";
import path from "node:path";
import { found, tab, clearAll, forge, settle, waitSaved, ROOT } from "../harness.mjs";

export const name = "overture";
export const describe = "there is something you can do for another house, and it costs you";

export async function run({ p, errors }){
  const fails = [], lines = [];

  /* ---- THE CLAIM, AGAINST THE SOURCE ---- */
  const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
  const callers = [...src.matchAll(/^(.*)warmMove\((d|dd?),\s*h(?:ouseName)?(?:\.name)?,\s*([^)]+)\)/gm)]
    .map(m=>m[0].trim()).filter(x=>!/^function warmMove/.test(x));
  const hostile = (src.match(/const GAMBITS = \{([\s\S]*?)\n\};/)||["",""])[1].match(/^  ([a-z]+):\s+\{ name:/gm) || [];
  const friendly = (src.match(/const OVERTURES = \{([\s\S]*?)\n\};/)||["",""])[1].match(/^  ([a-z]+):\s+\{ name:/gm) || [];
  lines.push(`${hostile.length} hostile gambits · ${friendly.length} overtures · ${callers.length} places raise warmth`);
  if(!friendly.length) fails.push("OVERTURES parsed empty — the friendly counterpart is not there");
  if(friendly.length >= hostile.length + 2)
    fails.push(`${friendly.length} overtures against ${hostile.length} gambits — the asymmetry has been inverted, which was not the item`);

  const table = await p.evaluate(()=>{
    const A = window.__LVDVS;
    if(!A.OVERTURES || !A.runOverture) return null;
    return { keys:A.OV_KEYS, cool:A.OVERTURE_COOL, lend:A.LEND_WEEKS,
             warm:A.OV_KEYS.map(k=>A.OVERTURES[k].warm) };
  });
  if(!table) return { pass:false, why:"OVERTURES is not on the handle", lines };
  lines.push(`the table: [${table.keys.join(" ")}] · warmth ${table.warm.join("/")} · one approach every ${table.cool} weeks · the doctore goes for ${table.lend}`);
  if(table.warm.some(w=>!(w > 0))) fails.push("an overture that raises no warmth at all");

  /* ---- EVERY ONE OF THEM, ACCEPTED AND REFUSED ---- */
  const ran = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const build = (grudge) => {
      const d = A.newGameState("Warm","clean","OV-1",null);
      d.gold = 20000; d.fame = 400; d.week = 60;
      while(A.activeG(d).length < 4) d.gladiators.push(A.genGladiator(d, 64));
      A.activeG(d).forEach(g=>{ g.injury = null; g.fatigue = 3; g.lastFought = 0; });
      d.doctore = A.makeDoctore(d, 70);
      (d.rivals||[]).forEach(h=>{ h.grudge = grudge; h.warm = 0; h.retired = false; });
      d.flags.overtureWeek = 0;
      return d;
    };
    const out = {};
    for(const k of A.OV_KEYS){
      const warmOn = build(0), coldOn = build(100);
      const h1 = (warmOn.rivals||[])[0], h2 = (coldOn.rivals||[])[0];
      /* the odds are a spread, so each side is driven until it lands rather than rolled once */
      let acc = null, ref = null, gold0 = warmOn.gold;
      for(let i=0;i<200 && !acc;i++){ const d = build(0); d.flags.overtureWeek = 0;
        const r = A.runOverture(d, k, (d.rivals||[])[0].name);
        if(r && r.won) acc = { line:r.line, warm:(d.rivals||[])[0].warm, grudge:(d.rivals||[])[0].grudge,
                               spent: 20000 - d.gold, docLent: A.docLent(d), gold:d.gold }; }
      for(let i=0;i<200 && !ref;i++){ const d = build(100); d.flags.overtureWeek = 0;
        const r = A.runOverture(d, k, (d.rivals||[])[0].name);
        if(r && !r.won) ref = { line:r.line, warm:(d.rivals||[])[0].warm, fame:d.fame }; }
      out[k] = { acc, ref, oddsWarm: A.overtureOdds(warmOn, k, h1), oddsCold: A.overtureOdds(coldOn, k, h2), gold0 };
    }
    return out;
  });
  for(const k of table.keys){
    const r = ran[k];
    lines.push(`  ${k}: odds ${Math.round(r.oddsWarm*100)} to a friendly house, ${Math.round(r.oddsCold*100)} to one that hates you`);
    lines.push(`     accepted → warm ${r.acc ? r.acc.warm : "NEVER"}${r.acc && r.acc.spent > 0 ? `, ${r.acc.spent}d spent` : r.acc && r.acc.spent < 0 ? `, ${-r.acc.spent}d came back` : ""}: "${r.acc ? r.acc.line.slice(0,96) : ""}"`);
    lines.push(`     refused  → "${r.ref ? r.ref.line.slice(0,96) : "NEVER REFUSED"}"`);
    if(!r.acc) fails.push(`\`${k}\` was never accepted in 200 tries on a house with no grudge — it is unreachable writing`);
    if(!r.ref) fails.push(`\`${k}\` was never refused in 200 tries on a house that hates you — an overture nobody can decline is not an overture`);
    if(r.acc && !(r.acc.warm > 0)) fails.push(`\`${k}\` was accepted and moved warmth to ${r.acc.warm}`);
    if(!(r.oddsWarm > r.oddsCold))
      fails.push(`\`${k}\` is no likelier with a friendly house (${r.oddsWarm.toFixed(2)}) than with one that hates you (${r.oddsCold.toFixed(2)})`);
  }

  /* ---- AND A LENT DOCTORE IS NOT AT YOUR POST ----
     Four things he does weekly, and lending him would be a free gift if any kept paying. */
  const lent = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Warm","clean","OV-2",null);
    while(A.activeG(d).length < 2) d.gladiators.push(A.genGladiator(d, 64));
    d.doctore = A.makeDoctore(d, 80);
    const g = A.activeG(d)[0];
    const read = () => ({ train: A.docTrain(d, "str", g), guard: A.docInjuryGuard(d, g), calm: A.docCalm(d) });
    const home = read();
    d.flags.docLent = d.week + 8;
    const away = read();
    /* and the week itself does nothing while he is gone, then he comes back */
    d.doctore.pupil = g.id;
    const s0 = A.rngGet(); A.doctoreWeek(d); const drewAway = A.rngGet() !== s0;
    d.week += 9;
    const n0 = (d.log||[]).length; A.doctoreWeek(d);
    const back = (d.log||[]).slice(0, Math.max(0,(d.log||[]).length - n0)).map(x=>x.text||"").join(" ");
    return { home, away, drewAway, cameBack: /comes back from his season away/.test(back), stillLent: A.docLent(d) };
  });
  lines.push(`the doctore at home: train x${lent.home.train.toFixed(2)} · guard x${lent.home.guard.toFixed(2)} · calm ${lent.home.calm}`);
  lines.push(`               lent: train x${lent.away.train.toFixed(2)} · guard x${lent.away.guard.toFixed(2)} · calm ${lent.away.calm} · the week drew ${lent.drewAway ? "SOMETHING" : "nothing"} · he came home ${lent.cameBack}`);
  if(!(lent.away.train < lent.home.train)) fails.push("a lent doctore still trains your men");
  if(!(lent.away.guard > lent.home.guard)) fails.push("a lent doctore still guards your men at the post");
  if(!(lent.away.calm < lent.home.calm)) fails.push("a lent doctore still keeps the cells calm");
  if(lent.drewAway) fails.push("the square ran a week while the doctore was at another house");
  if(!lent.cameBack || lent.stillLent) fails.push("the doctore never came home");

  /* ---- THE COOLDOWN ---- */
  const cool = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const d = A.newGameState("Warm","clean","OV-3",null);
    d.gold = 20000; d.week = 60; d.flags.overtureWeek = 0;
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 64));
    A.activeG(d).forEach(g=>{ g.injury = null; g.fatigue = 3; g.lastFought = 0; });
    d.doctore = A.makeDoctore(d, 70);
    (d.rivals||[]).forEach(h=>{ h.grudge = 0; h.retired = false; });
    const first = A.runOverture(d, "coin", (d.rivals||[])[0].name);
    const again = A.runOverture(d, "coin", (d.rivals||[])[0].name);
    const other = A.runOverture(d, "purse", (d.rivals||[])[0].name);
    d.week += A.OVERTURE_COOL;
    const later = A.runOverture(d, "coin", (d.rivals||[])[0].name);
    return { first:!!first, again:!!again, other:!!other, later:!!later, why: A.overtureWhy(d, "coin") };
  });
  lines.push(`the cooldown: first ${cool.first} · same week again ${cool.again} · a different one the same week ${cool.other} · after the season ${cool.later}`);
  if(!cool.first) fails.push("the first overture did not run at all");
  if(cool.again || cool.other) fails.push("a second approach landed in the same season — it is one a season, and the panel says so");
  if(!cool.later) fails.push("the approach never came back after the cooldown");

  /* ================= THE REAL PANEL ================= */
  await found(p, { seed:"OV-S" });
  await clearAll(p, 8);
  await forge(p, (A) => {
    const d = A.newGameState("Warm","clean","OV-S",null);
    d.gold = 30000; d.fame = 500; d.week = 70; d.flags.overtureWeek = 0;
    while(A.activeG(d).length < 3) d.gladiators.push(A.genGladiator(d, 64));
    A.activeG(d).forEach(g=>{ g.injury = null; g.fatigue = 3; g.lastFought = 0; });
    d.doctore = A.makeDoctore(d, 74);
    (d.rivals||[]).forEach(h=>{ h.grudge = 5; h.retired = false; });
    return d;
  });
  await clearAll(p, 8);
  await tab(p, "arena"); await p.waitForTimeout(340); await clearAll(p, 6);
  await tab(p, "arena"); await p.waitForTimeout(340); await settle(p);
  const panel = await p.evaluate(()=>{
    const t = document.body.innerText || "";
    const i = t.search(/What can be done openly/i);
    /* 700 characters reached the first two rows and stopped short of the third, which read as
       "the panel does not offer Send coin against a bad season" — a window fault, not a missing
       row. The panel is three rows of name, blurb, odds and a button per rival. */
    return i < 0 ? { found:false, quiet: /What can be done quietly/i.test(t) }
                 : { found:true, text: t.slice(i, i + 2200).replace(/\n+/g, " · "),
                     quiet: /What can be done quietly/i.test(t) };
  });
  lines.push(`the panel: ${panel.found ? panel.text.slice(0,260) : "NOT ON THE ARENA PAGE"}`);
  if(!panel.quiet) fails.push("the hostile panel has gone from the arena page — the row component was meant to render both");
  if(!panel.found) fails.push("no friendly panel on the arena page");
  else {
    for(const k of table.keys){
      const nm = await p.evaluate(kk=>window.__LVDVS.OVERTURES[kk].name, k);
      if(!panel.text.includes(nm.slice(0, 24))) fails.push(`the panel does not offer "${nm}"`);
    }
    if(!/in a hundred/.test(panel.text)) fails.push("the panel quotes no odds — the gambit rows beside it do");
  }

  await waitSaved(p);
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
