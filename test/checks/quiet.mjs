/* THE ONLY MULTI-WEEK ADVANCE IN THE GAME WAS AN EARLY-GAME-ONLY BUTTON BY ACCIDENT.

   `weekWeight(d)` scores the week and calls it `quiet` only at load 0, and that is the sole gate on
   "Let it run · Nw" (ludus.jsx:19573) — everywhere else the player presses End Week once per week.

   One of its load terms read the unburied dead WITHOUT a window:

       if((d.unburied||[]).some(m=>!m.done)) load += 1;

   Every other reader of that list has one. The agenda line uses `unhonoured(d)` — six weeks — and
   prints "after this nobody can put it right". The villa section offering the rites uses
   `unhonoured(S)` under a "6w to decide" caption. `markUnburied` keeps the last fourteen men for
   ever and only `holdMunera` clears one, which the UI offers inside the window alone.

   So past six weeks an entry became permanent, the player had no remaining action that could clear
   it, and load could never return to 0. MEASURED over 10 houses x 420 weeks: the term fired on
   95.6% of house-weeks, all ten houses were stuck for good between week 10 and week 37, and every
   house's LAST quiet week fell inside its first 13. Windowed, it moves to week 145-325 for seven of
   the ten, and quiet weeks go from 1.8% of play to 4.1%.

   IT WAS INVISIBLE BECAUSE NONE OF IT WAS REACHABLE. `weekWeight`, `unhonoured` and `holdMunera`
   were all off the handle — `holdMunera`'s only caller was the UI closure at 18649 — so no check
   could ask the week its shape or bury a man, and `d.honoured` read 0 in every measurement this
   project has ever taken. That is the file's first rule broken: an action a lanista can take must be
   a function of the save AND on the handle.

   This holds the rule rather than the number: a man past the window may not weigh on the week,
   because there is nothing left to do about him. It drives the rites end to end at the same time,
   since they had never once been driven. */

import { hasHandle } from "../harness.mjs";

export const name = "quiet";
export const describe = "a dead man you can no longer put right does not weigh on the week";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["weekWeight","unhonoured","holdMunera","markUnburied","RITES"]
      .filter(k=>A[k] == null);
    if(miss.length) return { miss };

    /* ---- 1. THE RULE, ON A HOUSE HELD STILL ----
       A quiet house, one dead man, walked across the window. Nothing else is allowed to move, so the
       load is attributable: it is built by hand rather than played into, because a played house has
       four other reasons to be busy and the term under test would be buried in them. */
    const d = A.newGameState("Qt","clean","QUIET-A",null);
    d.gold = 4000;
    const base = A.weekWeight(d).load;
    d.unburied = [{ gid:9001, name:"Verus", week:d.week, pfame:30, wins:4 }];
    const inside = A.weekWeight(d).load;
    d.week += A.RITE_WINDOW + 1;                    /* the man is now past putting right */
    const outside = A.weekWeight(d).load;
    const stillListed = (d.unburied||[]).length;    /* he is still on the books — that is the point */
    const uninside = A.unhonoured(d).length;

    /* ---- 2. AND THE WEEK GOES QUIET AGAIN ----
       The shape, not just the number, since `kind` is what the button reads. */
    const d2 = A.newGameState("Qt2","clean","QUIET-B",null);
    d2.gold = 4000;
    const kindClean = A.weekWeight(d2).kind;
    d2.unburied = [{ gid:9002, name:"Spiculus", week:d2.week, pfame:22, wins:2 }];
    const kindFresh = A.weekWeight(d2).kind;
    d2.week += A.RITE_WINDOW + 1;
    const kindStale = A.weekWeight(d2).kind;

    /* ---- 3. THE RITES, DRIVEN — never once done before this check ----
       `holdMunera` was off the handle, so the three rites, their costs and every number they move
       were dark. Each is run on its own house so one cannot pay for the next. */
    const rites = [];
    for(const key of (A.RITE_KEYS || ["none","rite","games"])){
      const g = A.newGameState("Qt-"+key,"clean",`QUIET-${key}`,null);
      g.gold = 9000; g.unrest = 50;
      g.unburied = [{ gid:7001, name:"Priscus", week:g.week, pfame:40, wins:6 }];
      const before = { gold:g.gold, unrest:g.unrest, fame:g.fame, honoured:g.honoured||0 };
      const took = A.holdMunera(g, 7001, key);
      const m = (g.unburied||[]).find(x=>x.gid===7001) || {};
      rites.push({ key, took: !!took, done: m.done || null,
        gold: Math.round(g.gold - before.gold), unrest: Math.round(g.unrest - before.unrest),
        fame: Math.round(g.fame - before.fame), honoured: (g.honoured||0) - before.honoured,
        loadAfter: A.weekWeight(g).load });
      /* and it cannot be done twice */
      rites[rites.length-1].twice = !!A.holdMunera(g, 7001, key);
    }

    /* ---- 4. OVER REAL PLAY, so the rule is not only true on a hand-built state ---- */
    let weeks = 0, quiet = 0, lastQuiet = null, stuckFrom = null;
    const g = A.newGameState("Qt3","clean","QUIET-C",null);
    for(let w=0; w<200; w++){
      if(g.over) break;
      weeks++;
      const ww = A.weekWeight(g);
      if(ww.kind === "quiet"){ quiet++; lastQuiet = g.week; }
      if(stuckFrom === null && (g.unburied||[]).some(x=>!x.done)
         && !A.unhonoured(g).some(x=>!x.done)) stuckFrom = g.week;
      R.lanista(g);
    }
    return { base, inside, outside, stillListed, uninside,
      kindClean, kindFresh, kindStale, rites,
      weeks, quiet, lastQuiet, stuckFrom, window:A.RITE_WINDOW };
  });

  const lines = [], fails = [];
  if(out.miss){
    return { pass:false, lines:[],
      why:`${out.miss.join(", ")} not on the handle — the week's shape and the rites are unreachable, `
        + `which is the fault this check exists for` };
  }

  lines.push(`load on a still house: ${out.base} clean · ${out.inside} with a man inside the ${out.window}w window`
    + ` · ${out.outside} once he is past it (he is still on the books: ${out.stillListed} listed, ${out.uninside} answerable)`);
  lines.push(`the week's shape: ${out.kindClean} clean -> ${out.kindFresh} with a fresh death -> ${out.kindStale} past the window`);
  for(const r of out.rites)
    lines.push(`  rite "${r.key}": ${r.took ? "held" : "REFUSED"} · marked ${r.done} · ${r.gold}d`
      + ` · unrest ${r.unrest >= 0 ? "+" : ""}${r.unrest} · fame ${r.fame >= 0 ? "+" : ""}${r.fame}`
      + ` · honoured +${r.honoured} · load after ${r.loadAfter}`
      + (r.twice ? " · TOOK IT TWICE" : ""));
  lines.push(`over ${out.weeks} weeks of real play: ${out.quiet} quiet, last at week ${out.lastQuiet == null ? "never" : out.lastQuiet}`
    + ` · first permanently unanswerable at week ${out.stuckFrom == null ? "-" : out.stuckFrom}`);

  /* ---- THE BAR ---- */
  if(!(out.inside > out.base))
    fails.push(`a man dead this week does not weigh on the week at all (load ${out.base} -> ${out.inside}) `
      + `— the term is gone rather than windowed, and a fresh death is exactly when it SHOULD count`);
  if(out.outside !== out.base)
    fails.push(`a man ${out.window} weeks dead still weighs ${out.outside - out.base} on the week `
      + `[the fault: it read the whole list with no window, so load never returned to 0 and "Let it run" `
      + `retired itself for the rest of the run — measured, every house's last quiet week fell inside `
      + `its first 13]. He is still listed and there is nothing left to do about him`);
  if(out.kindStale !== out.kindClean)
    fails.push(`the week is "${out.kindStale}" past the window against "${out.kindClean}" clean — `
      + `\`kind\` is the only gate on the game's single multi-week advance`);
  if(!out.stillListed)
    fails.push(`the man fell off d.unburied by himself — this check then proves nothing, because the `
      + `load term it is testing has nothing to read`);

  const byKey = Object.fromEntries(out.rites.map(r=>[r.key, r]));
  for(const r of out.rites){
    if(!r.took) fails.push(`the rite "${r.key}" refused a solvent house with an unburied man`);
    if(r.twice) fails.push(`the rite "${r.key}" was held twice on the same man`);
    if(r.done !== r.key) fails.push(`the rite "${r.key}" marked the man "${r.done}"`);
    if(r.loadAfter !== out.base && r.key)
      fails.push(`after the rite "${r.key}" the man still weighs on the week (load ${r.loadAfter}) — `
        + `answering a thing is supposed to take it off the pile`);
  }
  if(byKey.games && byKey.games.honoured !== 1)
    fails.push(`full games did not increment d.honoured (+${byKey.games.honoured}) — it is what the `
      + `munera lesson reads for "done", so the lesson never retires`);
  if(byKey.games && !(byKey.games.gold < 0))
    fails.push(`full games at your own expense cost ${byKey.games.gold}d`);
  if(byKey.games && byKey.rite && !(byKey.games.gold < byKey.rite.gold))
    fails.push(`a full card (${byKey.games.gold}d) does not cost more than a fire at the gate (${byKey.rite.gold}d)`);
  if(byKey.none && byKey.none.gold !== 0)
    fails.push(`doing nothing cost ${byKey.none.gold}d`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
