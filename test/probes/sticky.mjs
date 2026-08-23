/* THE ARENA PANEL HAS THREE EXITS AND THEY CLEAR DIFFERENT THINGS

   `fightOffer` (src/ludus.jsx:21646) ends two ways:

     if(res.crux){ setHeld(...); setFight(res); setFGid(null); setStake(0); setAgainst(false); return; }
     setS(d); setFight(res); setFGid(null); setStake(0); setAgainst(false);
       setPitPick(null); setPlan("none"); setEntrance("none");

   so the three per-bout choices — the pit opponent, the plan and the entrance — are cleared on the
   exit where the bout ENDS and not on the exit where it stops at the balance. The resume at :21694
   (`setHeld(null); setS(d); setFight(res);`) does not clear them either, and `goPick` at :26210
   clears the plan and not the entrance. `tactic` is deliberately never cleared — it reads as a
   standing preference — but plan and entrance are written as per-bout and behave that way on one
   exit of three.

   The rope reads 55-61% of bouts stopping at the balance, so this is not a corner. But "the game
   will not let you" and "the probe never did it" look identical, so this drives the real screen:
   press an entrance, fight, answer the word from the box, come back, and READ THE CHIP.

   The control is the other exit. A bout that ends without a crux must come back with the chip
   cleared — if it does not, the finding is that nothing ever clears it and the two exits are the
   same, which is a different item and a worse one.

   ---- AND WHAT IT SHOULD SAY NOW THE FAULT IS GONE (v3.118.0) ----
   `quiet.mjs` had to be turned round after its fix landed, because a probe written to measure a
   fault reads as an accusation for ever unless somebody decides, at the time, what it means once
   the number is zero. So: from v3.118.0 all five senders call `spendOrders()` before they branch,
   and both columns below must read **0**. The paired reading, same two seeds, same bouts:

       stopped at the balance, chip still lit    8 of 8   ->   0 of 8
       ended outright, chip still lit            0 of 6   ->   0 of 6

   The `crux` column is the control that makes it a measurement rather than a hope: the attempts
   come back with the same crux/clean pattern before and after, so it is the same bouts either way.
   Attempts that print "(row not on screen)" are the card being consumed and the week not dealing
   another single; they are counted as neither and about a third of them do it.

   Usage: node test/probes/sticky.mjs [attempts] [seed]
*/
import { serve, open, found, clearAll, click, tab, waitSaved } from "../harness.mjs";

const TRIES = +(process.argv[2] || 10);
const SEED = process.argv[3] || "STICKY";
const WORD = "Work the mob";
/* the chips are UPPERCASED by the stylesheet, so innerText is "WORK THE MOB" and a comparison
   against the table's own casing matches nothing. The first run skipped all six attempts on it. */
const NAMES = ["Straight to the mark", "Work the mob", "Silent and grim", "Salute the boxes"]
  .map(x=>x.toUpperCase());
const WORD_U = WORD.toUpperCase();

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const errors = [];
p.on("pageerror", e => errors.push(String(e && e.message || e)));

const inTop = (sel, skip) => p.evaluate(([sel, skip])=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return null;
  const rx = skip ? new RegExp(skip, "i") : null;
  const e = [...w.querySelectorAll(sel)].filter(x=>!x.disabled
    && !(rx && rx.test((x.innerText||"").trim())))[0];
  if(!e) return null;
  e.click(); return (e.innerText||"").split("\n")[0].trim().slice(0,40) || "(unlabelled)";
}, [sel, skip||null]);

const nthInTop = (sel, n, skip) => p.evaluate(([sel, n, skip])=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return null;
  const rx = skip ? new RegExp(skip, "i") : null;
  const list = [...w.querySelectorAll(sel)].filter(x=>!x.disabled
    && !(rx && rx.test((x.innerText||"").trim())));
  if(!list[n]) return null;
  list[n].click(); return (list[n].innerText||"").split("\n")[0].trim().slice(0,40) || "(unlabelled)";
}, [sel, n, skip||null]);

/* WHICH ENTRANCE IS LIT. Exactly one of the four is `chip on` whenever the row is up, because
   `none` is a real key with a chip of its own — so "no chip lit" means the row is not on screen
   and is reported as such rather than as `none`. */
const litEntrance = () => p.evaluate((NAMES)=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; const scope = w || document;
  const chips = [...scope.querySelectorAll("button.chip")]
    .filter(b=>NAMES.includes((b.innerText||"").trim().toUpperCase()));
  if(!chips.length) return { row:false, lit:null };
  const on = chips.filter(b=>b.className.split(/\s+/).includes("on")).map(b=>(b.innerText||"").trim().toUpperCase());
  return { row:true, lit:on.length === 1 ? on[0] : on };
}, NAMES);

const pressEntrance = (word) => p.evaluate((word)=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; const scope = w || document;
  const b = [...scope.querySelectorAll("button.chip")].find(x=>(x.innerText||"").trim().toUpperCase() === word);
  if(!b) return false; b.click(); return true;
}, word);

/* a button in the top overlay whose text matches — `inTop` takes the FIRST live button that is
   not skipped, and at the man step every man is a <button>, so "NEXT ›" has to be named. */
const clickText = (re) => p.evaluate((src)=>{
  const rx = new RegExp(src, "i");
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return null;
  const b = [...w.querySelectorAll("button")].filter(x=>!x.disabled)
    .find(x=>rx.test((x.innerText||"").trim()));
  if(!b) return null; b.click(); return (b.innerText||"").trim().slice(0,30);
}, re.source || String(re));

const sandState = () => p.evaluate(()=>{
  const a = document.querySelector(".arena");
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; const scope = w || document;
  const t = (scope.innerText || "").replace(/\s+/g, " ");
  return { on:!!a, crux:/FROM THE BOX/i.test(t), over: !a || /return to the ludus/i.test(t) };
});

/* ---------------- set the house up ---------------- */
await found(p, { seed:SEED });
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
  for(let i=0;i<40;i++){
    s.week++; A.makeGames(s);
    const singles = ((s.games&&s.games.offers)||[]).filter(o=>!o.melee && !o.pair && !o.venatio);
    if(singles.length){ s.games.offers = singles; break; }
  }
  localStorage.setItem(key, JSON.stringify(s));
  return { men:A.activeG(s).length, offers:((s.games&&s.games.offers)||[]).length };
});
if(ready.why){ console.log(ready.why); await browser.close(); server.close(); process.exit(1); }

/* `twin` decides how even the bout is, which is what decides whether it stops at the balance.
   Both arms are wanted, so the opponent is made a twin for half the attempts and left alone for
   the other half — the control is a bout that ENDS, and it has to actually happen. */
const restock = async (attempt, twin) => {
  await waitSaved(p);
  await p.evaluate(([attempt, twin])=>{
    const A = window.__LVDVS;
    for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
      try {
        const s = JSON.parse(localStorage.getItem(k)); if(!s || !s.gladiators) continue;
        for(const g of s.gladiators){ if(g.status!=="active") continue;
          g.lastFought = -9; g.fatigue = 0; g.strain = 0; g.injury = null; }
        s.gold = Math.max(s.gold, 20000);
        s.rngState = (2654435761 * (attempt + 1)) >>> 0;
        /* ---- THE CARD IS CONSUMED BY THE BOUT ----
           Attempts 2 to 5 of the first working run all read "no entrance row", because a fought
           offer comes off `d.games.offers` and nothing here put a new card up. The week is walked
           forward to the next one that deals a single, exactly as the opening setup does. */
        for(let i=0;i<40;i++){
          const singles = ((s.games&&s.games.offers)||[]).filter(o=>!o.melee && !o.pair && !o.venatio);
          if(singles.length){ s.games.offers = singles; break; }
          s.week++; A.makeGames(s);
        }
        const mine = A.activeG(s)[0];
        for(const o of ((s.games&&s.games.offers)||[])){
          if(!o.opp || !mine) continue;
          if(twin){ for(const st of A.STATS) o.opp[st] = mine[st];
            o.opp.cls = mine.cls; o.opp.kit = A.defaultKit(mine.cls); o.opp.wins = 6; o.opp.traits = []; }
          else { for(const st of A.STATS) o.opp[st] = Math.max(8, Math.round(mine[st] * 0.45));
            o.opp.wins = 0; o.opp.traits = []; }
          o.stakes = "standard";
        }
        localStorage.setItem(k, JSON.stringify(s));
      } catch(e){}
    }
  }, [attempt, twin]);
  await p.reload({ waitUntil:"domcontentloaded" });
  await p.waitForTimeout(900);
  await click(p, /take up the keys/i);
  await p.waitForTimeout(900);
  await clearAll(p, 14);
};

/* walk into the arena's bout panel and stop with the entrance row on screen */
/* THE WIZARD IS THREE STEPS — "1. Where › 2. Your man › 3. Ready" — and the entrance row is on
   the third, and only for a bout off the CARD. Step one's first row is always THE PITS, whose
   panel has stakes, tactic and wager chips and NO entrance row at all; the first version of this
   probe took that row every time and reported six attempts of "no entrance row". */
const openBout = async () => {
  await tab(p, "arena"); await p.waitForTimeout(300);
  await clearAll(p, 8);
  await tab(p, "arena"); await p.waitForTimeout(260);
  if(!(await click(p, /choose a bout/i))) return false;
  await p.waitForTimeout(700);
  if(!(await nthInTop("button.optrow", 0, "‹ back|the pits"))) return false;   /* an arena bout, not the pit */
  await p.waitForTimeout(600);
  if(!(await nthInTop("button.optrow", 0, "‹ back"))) return false;            /* your man */
  await p.waitForTimeout(500);
  if(!(await clickText(/^next/i))) return false;                                /* on to "3. Ready" */
  await p.waitForTimeout(700);
  return (await litEntrance()).row;
};

await p.reload({ waitUntil:"domcontentloaded" });
await p.waitForTimeout(1000);
await click(p, /take up the keys/i);
await p.waitForTimeout(1100);
await clearAll(p, 16);

const rows = [];
for(let attempt=0; attempt<TRIES; attempt++){
  const twin = attempt % 2 === 0;
  await restock(attempt, twin);
  if(!(await openBout())){ rows.push({ attempt, twin, skip:"no entrance row" }); continue; }
  const before = await litEntrance();
  if(!(await pressEntrance(WORD_U))){ rows.push({ attempt, twin, skip:"no chip" }); continue; }
  await p.waitForTimeout(200);
  const pressed = await litEntrance();
  if(!(await inTop("button.btn-blood"))){ rows.push({ attempt, twin, skip:"could not send him out" }); continue; }
  /* watch the sand: answer every word from the box, then leave */
  let sawCrux = false;
  for(let t=0; t<160; t++){
    const st = await sandState();
    if(st.crux){ sawCrux = true; await nthInTop("button.optrow", 0, "‹ back"); await p.waitForTimeout(500); continue; }
    if(st.over || !st.on) break;
    await p.waitForTimeout(150);
  }
  await clearAll(p, 12);
  await p.waitForTimeout(400);
  const after = await openBout() ? await litEntrance() : { row:false, lit:null };
  rows.push({ attempt, twin, crux:sawCrux, before:before.lit, pressed:pressed.lit, after:after.lit, row:after.row });
}

await browser.close(); server.close();
console.log(`=== THE CHIP AFTER THE BOUT — ${rows.length} attempts, seed ${SEED}`);
console.log(`  ${"#".padStart(3)} ${"twin".padStart(5)} ${"crux".padStart(5)}  ${"before".padEnd(22)} ${"pressed".padEnd(15)} after`);
for(const r of rows){
  if(r.skip){ console.log(`  ${String(r.attempt).padStart(3)} ${String(r.twin).padStart(5)}        skipped: ${r.skip}`); continue; }
  console.log(`  ${String(r.attempt).padStart(3)} ${String(r.twin).padStart(5)} ${String(r.crux).padStart(5)}  ${String(r.before).padEnd(22)} ${String(r.pressed).padEnd(15)} ${r.row ? r.after : "(row not on screen)"}`);
}
const done = rows.filter(r=>!r.skip && r.row);
const cruxRows = done.filter(r=>r.crux), cleanRows = done.filter(r=>!r.crux);
const stuck = a => a.filter(r=>r.after === WORD_U).length;
console.log(`\n  bouts that stopped at the balance: ${cruxRows.length} · the chip was still "${WORD_U}" on ${stuck(cruxRows)} of them`);
console.log(`  bouts that ended outright:         ${cleanRows.length} · the chip was still "${WORD_U}" on ${stuck(cleanRows)} of them`);
if(errors.length) console.log(`\n  page errors: ${errors.slice(0,3).join(" | ")}`);
