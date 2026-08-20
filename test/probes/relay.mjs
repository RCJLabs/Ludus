/* #169 — WHAT THE PLAYER ACTUALLY SEES AFTER A WORD FROM THE BOX

   #169 was opened off a trace, not off a screen, and it was opened with a clause: "falsifies if the
   modal is not in fact fed the returned beats on a second crux, in which case this is engine-only."
   This probe is that clause. It drives a real browser through a real bout and records, after every
   word from the box, WHICH BEATS THE ARENA ACTUALLY SHOWS — off `.arena[aria-label]`, which is the
   beat's own text, so nothing here reconstructs the log from the engine.

   WHAT THE TRACE SAID. All four engines carry

       if(res.unfinished){ return { ..., beats: res.beats, crux:true, ... }; }
       if(pending) res.beats = pending.beats.concat(res.beats);

   so the accumulated log is joined on only when the bout ENDS. A resume that comes to the balance
   again returns the segment since the LAST crux and nothing before it. Traced in memory: 12 beats,
   then a resume returning 8 rather than 20, then 17 rather than 29.

   AND WHY THAT IS WORSE ON SCREEN THAN IN MEMORY. `FightModal` holds its own cursor `i`, is not
   keyed, and `speak` re-sets `fight` on the same mounted component — so `i` survives the change:

       const beats = fight.beats;
       const done  = i >= beats.length-1;
       const b     = beats[Math.min(i, beats.length-1)];

   The player watches 12 beats, `i` finishes at 11, and the word from the box hands the modal an
   array of 8. `done` is true on arrival and `b` is the LAST of the eight. The prediction, then, is
   not "the log is shorter" — it is that answering a crux that leads to another crux shows the
   player NOTHING: the arena snaps to the end of the segment its order bought and stops.

   THE INSTRUMENT, and what would make it lie:
   · beats are read off the arena's `aria-label` on a poll, so a beat shown for less than the poll
     interval could be missed. The poll is 100ms against the modal's own 640-1150ms a beat, and the
     speed chip is LEFT AT 1x on purpose.
   · a segment that shows one beat and a segment that shows none are different claims, so the label
     at the moment the crux options appear is recorded separately from the ones after the answer.
   · cruxes are chance. The probe fights bouts until it has one with two stops, and says how many it
     had to fight; a run that never finds one is reported as that and not as a pass.

   Usage: node test/probes/relay.mjs [bouts to try] [seed]
*/
import { serve, open, found, clearAll, click, tab, waitSaved } from "../harness.mjs";

const TRIES = +(process.argv[2] || 8);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const errors = [];
p.on("pageerror", e => errors.push(String(e && e.message || e)));

/* everything below acts inside the topmost overlay, the way `sand` does */
const inTop = (sel, skip) => p.evaluate(([sel, skip])=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return null;
  const rx = skip ? new RegExp(skip, "i") : null;
  const e = [...w.querySelectorAll(sel)].filter(x=>!x.disabled
    && !(rx && rx.test((x.innerText||"").trim())))[0];
  if(!e) return null;
  e.click();
  return (e.innerText||"").split("\n")[0].trim().slice(0,40) || "(unlabelled)";
}, [sel, skip||null]);

const nthInTop = (sel, n, skip) => p.evaluate(([sel, n, skip])=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return null;
  const rx = skip ? new RegExp(skip, "i") : null;
  const list = [...w.querySelectorAll(sel)].filter(x=>!x.disabled
    && !(rx && rx.test((x.innerText||"").trim())));
  if(!list[n]) return null;
  list[n].click();
  return (list[n].innerText||"").split("\n")[0].trim().slice(0,40) || "(unlabelled)";
}, [sel, n, skip||null]);

const liveInTop = (sel, skip) => p.evaluate(([sel, skip])=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return 0;
  const rx = skip ? new RegExp(skip, "i") : null;
  return [...w.querySelectorAll(sel)].filter(x=>!x.disabled
    && !(rx && rx.test((x.innerText||"").trim()))).length;
}, [sel, skip||null]);

/* the state of the sand, in one read: the beat on screen and whether a word is being asked for */
const sandState = () => p.evaluate(()=>{
  const a = document.querySelector(".arena");
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; const scope = w || document;
  const t = (scope.innerText || "").replace(/\s+/g, " ");
  const chips = [...scope.querySelectorAll("button.chip")].map(x=>(x.innerText||"").trim());
  return {
    on: !!a,
    beat: a ? (a.getAttribute("aria-label") || "") : null,
    /* THE CRUX PANEL NAMES ITSELF, and nothing else in the game says these words. The first
       detector counted "more than one live button and no skip", which reads the VERDICT screen
       as a crux and turned a bout that stopped twice into one that stopped four times. */
    crux: /FROM THE BOX/i.test(t),
    over: !a || /return to the ludus/i.test(t),
    /* `{!done && <button ...>Pause}` — no play control means the modal has finished its array.
       This is the difference between "shown fast" and "not shown at all". */
    done: !chips.some(c=>/^(pause|play)$/i.test(c)),
    skip: /skip to the verdict/i.test(t),
  };
});

/* watch the arena until it asks for a word, or ends, or goes quiet. Returns the distinct beats
   shown IN ORDER — the same beat twice running counts once, a beat that comes back later counts
   again, because that is what a replay looks like from the seat. */
const watch = async (ms) => {
  const seen = [];
  let last = null, quiet = 0, st = null, doneAt = null;
  for(let t=0; t<ms; t+=100){
    st = await sandState();
    if(st.beat != null && st.beat !== last){ seen.push(st.beat); last = st.beat; quiet = 0; }
    else quiet += 100;
    if(st.done && doneAt == null) doneAt = seen.length;
    if(st.crux || st.over) break;
    if(!st.on) break;
    if(st.done && quiet >= 900) break;
    if(quiet >= 4000) break;
    await p.waitForTimeout(100);
  }
  return { seen, st, doneAt };
};

/* ---------------- set the house up, the way `sand` does ---------------- */
await found(p);
await clearAll(p);
const ready = await p.evaluate(()=>{
  const A = window.__LVDVS; if(!A) return { why:"no test handle" };
  let key = null, s = null;
  for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
    try { const x = JSON.parse(localStorage.getItem(k)); if(x && x.gladiators){ key = k; s = x; } } catch(e){} }
  if(!s) return { why:"no save to set up" };
  s.gold = 40000; s.fame = 900;
  s.flags = s.flags || {}; s.flags.noLessons = 1;
  s.charter = { i:0, done:true, skipped:true };
  for(const l of A.LESSONS) (s.flags.learned = s.flags.learned || {})[l.id] = 1;
  while(A.activeG(s).length < 6 && !A.rosterFull(s)){
    const m = A.genGladiator(s, 70); m.id = s.nextId++; m.status = "active";
    m.kit = A.defaultKit(m.cls); m.fatigue = 0; m.strain = 0; m.lastFought = -9; m.wins = 4;
    s.gladiators.push(m);
  }
  /* a bill with a plain single on it — the crux is `stopAtCrux` on the ordinary engine */
  for(let i=0;i<40;i++){
    s.week++; A.makeGames(s);
    const singles = ((s.games&&s.games.offers)||[]).filter(o=>!o.melee && !o.pair && !o.venatio);
    if(singles.length){ s.games.offers = singles; break; }
  }
  /* THE OPPONENT IS MADE A TWIN of the best man in the yard, deliberately: a crux wants
     `vA<=82 || vB<=78` with two clear rounds between and comes round up to three times, so a
     lopsided bout ends before the second one and fishing for a two-stop bout at random takes
     all afternoon. What is under test is a screen, and it does not care who wins. */
  const mine = A.activeG(s)[0];
  for(const o of ((s.games&&s.games.offers)||[])){
    if(!o.opp || !mine) continue;
    for(const k of A.STATS) o.opp[k] = mine[k];
    o.opp.cls = mine.cls; o.opp.kit = A.defaultKit(mine.cls); o.opp.wins = 6; o.opp.traits = [];
    o.stakes = "standard";
  }
  localStorage.setItem(key, JSON.stringify(s));
  return { men:A.activeG(s).length, offers:((s.games&&s.games.offers)||[]).length };
});
if(ready.why){ console.log(ready.why); await browser.close(); server.close(); process.exit(1); }

/* ---- AND EVERY ATTEMPT WAS THE SAME BOUT ----
   `restock` restores the save and reloads, and the save carries `rngState`, which the load path
   puts straight back into the generator. Eight tries came back with the same seventeen beats and
   the same missio, to the word, and the report read "no bout came to the balance twice" when what
   it had measured was one bout eight times. The state is walked deliberately per attempt. */
const restock = async (attempt) => {
  await waitSaved(p);
  await p.evaluate((attempt)=>{
    for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
      try {
        const s = JSON.parse(localStorage.getItem(k)); if(!s || !s.gladiators) continue;
        for(const g of s.gladiators){ if(g.status!=="active") continue;
          g.lastFought = -9; g.fatigue = 0; g.strain = 0; g.injury = null; }
        const live = () => s.gladiators.filter(g=>g.status==="active");
        const seed = s.gladiators[0]; let guard = 0;
        while(live().length < 4 && seed && guard++ < 8){
          const c = JSON.parse(JSON.stringify(seed));
          c.id = (s.nextId = (s.nextId||900) + 1);
          c.status = "active"; c.injury = null; c.fatigue = 0; c.strain = 0; c.lastFought = -9;
          c.name = `${seed.name} ${["Secundus","Tertius","Quartus","Quintus"][guard%4]}`;
          s.gladiators.push(c);
        }
        s.gold = Math.max(s.gold, 20000);
        s.rngState = (2654435761 * (attempt + 1)) >>> 0;
        localStorage.setItem(k, JSON.stringify(s));
      } catch(e){}
    }
  }, attempt);
  await p.reload({ waitUntil:"domcontentloaded" });
  await p.waitForTimeout(1000);
  await click(p, /take up the keys/i);
  await p.waitForTimeout(1000);
  await clearAll(p, 14);
};

await p.reload({ waitUntil:"domcontentloaded" });
await p.waitForTimeout(1100);
await click(p, /take up the keys/i);
await p.waitForTimeout(1200);
await clearAll(p, 16);

/* ---------------- fight, and watch ---------------- */
const runs = [];
for(let attempt=0; attempt<TRIES; attempt++){
  await restock(attempt);
  await tab(p, "arena"); await p.waitForTimeout(320);
  await clearAll(p, 8);
  await tab(p, "arena"); await p.waitForTimeout(280);
  if(!(await click(p, /choose a bout/i))) continue;
  await p.waitForTimeout(800);
  if(!(await nthInTop("button.optrow", 0, "‹ back"))) { await clearAll(p, 6); continue; }
  await p.waitForTimeout(700);
  let picked = 0;
  for(let i=0;i<12;i++){
    if(await liveInTop("button.btn-blood")) break;
    if(picked >= 1 && await liveInTop("button.btn:not(.btn-ghost):not(.btn-blood)", "^(sound|pause|\\d+×)")){
      if(await inTop("button.btn:not(.btn-ghost):not(.btn-blood)", "^(sound|pause|\\d+×)")){
        await p.waitForTimeout(650); continue; }
    }
    if(!(await nthInTop("button.optrow", picked, "‹ back"))) break;
    picked++; await p.waitForTimeout(320);
  }
  if(!(await inTop("button.btn-blood"))){ await clearAll(p, 8); continue; }
  await p.waitForTimeout(1200);
  if(!(await p.evaluate(()=>!!document.querySelector(".momtrack")))){ await clearAll(p, 10); continue; }

  /* the speed chip is deliberately NOT pressed — a beat has to stay on screen long enough
     to be sampled, and a probe that speeds the modal up cannot tell "shown fast" from "skipped" */
  const segs = [];
  for(let seg=0; seg<6; seg++){
    const { seen, st, doneAt } = await watch(46000);
    segs.push({ seen, ended: !!st.over, asked: !!st.crux, doneAt });
    if(st.over) break;
    if(!st.crux){
      /* not a crux — the skip, or the verdict button, or nothing */
      const hit = await inTop("button.btn, button.btn-blood", "^(sound|pause|play|\\d+×|‹ back)");
      if(!hit) break;
      await p.waitForTimeout(700);
      continue;
    }
    /* a word from the box */
    await inTop("button.btn, button.btn-blood, button.optrow", "^(sound|pause|play|\\d+×|‹ back)");
    await p.waitForTimeout(500);
  }
  const stops = segs.filter(s=>s.asked).length;
  runs.push({ attempt, stops, segs });
  await clearAll(p, 12);
}

/* ---------------- report ---------------- */
console.log(`\n#169 — WHAT THE PLAYER SEES AFTER A WORD FROM THE BOX\n`);
console.log(`  a house of ${ready.men} men, ${ready.offers} single offer(s) on the bill\n`);
for(const r of runs){
  console.log(`  bout ${r.attempt+1} — ${r.stops} word${r.stops===1?"":"s"} asked for`);
  r.segs.forEach((s,i)=>{
    const head = i === 0 ? "from the horn" : `after word ${i}`;
    console.log(`    ${head.padEnd(14)} ${String(s.seen.length).padStart(3)} beats shown`
      + (s.doneAt != null ? ` (finished after ${s.doneAt})` : "")
      + (s.asked ? "  → a word is asked for" : s.ended ? "  → the verdict" : "  → (neither)"));
    if(s.seen.length <= 3) for(const b of s.seen) console.log(`        "${String(b).slice(0,88)}"`);
    else console.log(`        first "${String(s.seen[0]).slice(0,64)}"\n        last  "${String(s.seen[s.seen.length-1]).slice(0,64)}"`);
  });
}
/* THE PAIRED READING. A word answered on a bout that then ENDS is the control: the join happens,
   the modal is handed the whole log and plays on. A word answered on a bout that comes to the
   balance AGAIN is the case. Both are the same button on the same screen. */
const mids = [], lasts = [];
for(const r of runs) r.segs.forEach((s,i)=>{
  if(i === 0) return;
  (r.segs[i].asked ? mids : lasts).push(s.seen.length);
});
const avg = a => a.length ? (a.reduce((x,y)=>x+y,0)/a.length).toFixed(1) : "—";
const twoStop = runs.filter(r=>r.stops >= 2);
console.log(`\n  ${runs.length} bouts fought: ${runs.filter(r=>r.stops===0).length} never stopped, `
  + `${runs.filter(r=>r.stops===1).length} stopped once, ${twoStop.length} stopped twice or more`);
console.log(`  from the horn, a bout shows ${avg(runs.map(r=>r.segs[0].seen.length))} beats on average`);
console.log(`  a word answered on a bout that then STOPS AGAIN shows ${avg(mids)} beats  [${mids.join(" ")}]`);
console.log(`  a word answered on a bout that then ENDS shows       ${avg(lasts)} beats  [${lasts.join(" ")}]`);
if(!twoStop.length) console.log(`\n  NO BOUT IN ${TRIES} TRIES CAME TO THE BALANCE TWICE — the clause is untested, not satisfied`);
else if(mids.every(n=>n <= 1))
  console.log(`\n  THE READING: every word answered on a bout that stopped again showed ONE beat and stopped.`
    + ` The order was given and the arena snapped to the end of what it bought. The clause is satisfied:`
    + ` #169 is on the screen, not only in the engine.`);
else
  console.log(`\n  THE READING: the segment the order bought WAS shown (${mids.join(", ")} beats).`
    + ` The clause FALSIFIES and #169 is engine-only.`);
if(errors.length) console.log(`\n  ${errors.length} page errors: ${errors.slice(0,2).join(" | ")}`);
console.log();

await browser.close();
server.close();
