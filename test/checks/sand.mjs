/* THE SCREEN THE GAME IS ABOUT, WHICH NOTHING HAD EVER RENDERED.

   Thirteen checks call `doFight`. Every one of them drives the engines in memory through the
   test handle and reads the beats as data. Four checks drive a browser — `modals`, `surface`,
   `survive`, `sweep` — and not one of them reaches the sand: `sweep` opens the wizard's first
   step and stops, and `survive` clicks into a bout as a side effect of its economy policy and
   never looks at what comes up.

   So the most-looked-at screen in the game had no test at all. What was living there: `occRow`
   returning a <button> with no `key` from four separate `.map`s, so React warned on every
   render of the bout wizard and reused the wrong DOM node when the bill changed underneath it.
   It was found by a scratch probe taking a photograph of an axe, which is not a process.

   It also took six attempts to get here, and the reason is worth keeping: the arena tab's own
   CHOOSE A BOUT is a `btn-blood`, the same class as the wizard's SEND HIM TO THE SAND, so a
   driver that reaches for "the blood button" closes the wizard it just opened. Everything here
   acts inside the topmost overlay and names what it is pressing.

   The arc, which is now driven end to end: pick a card → pick a man → NEXT → SEND HIM TO THE
   SAND → the sand runs → a crux offers six answers → answer it → the verdict → RETURN TO THE
   LUDUS. And the bout has to appear in the record book afterwards, because a screen that runs
   beautifully and books nothing is the fault this project has shipped twice. */

import { found, endWeek, clearAll, tab, click, waitSaved, slot } from "../harness.mjs";

export const name = "sand";
export const describe = "a bout runs in a real browser, from the card to the verdict";
export const slow = true;

const FLOOR_TAP = 44, FLOOR_CHIP = 36, FLOOR_TEXT = 11.4;

/* everything below acts inside the topmost overlay, never the page behind it */
const top = p => p.evaluate(()=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  return !!(ws[0] && ws[0].w);
});
const inTop = (p, sel, skip) => p.evaluate(([sel, skip])=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return null;
  const rx = skip ? new RegExp(skip, "i") : null;
  const e = [...w.querySelectorAll(sel)].filter(x=>!x.disabled
    && !(rx && rx.test((x.innerText||"").trim())))[0];
  if(!e) return null;
  e.click();
  return (e.innerText||"").split("\n")[0].trim().slice(0,32) || "(unlabelled)";
}, [sel, skip||null]);
const nthInTop = (p, sel, n, skip) => p.evaluate(([sel, n, skip])=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return null;
  const rx = skip ? new RegExp(skip, "i") : null;
  const list = [...w.querySelectorAll(sel)].filter(x=>!x.disabled
    && !(rx && rx.test((x.innerText||"").trim())));
  if(!list[n]) return null;
  list[n].click();
  return (list[n].innerText||"").split("\n")[0].trim().slice(0,32) || "(unlabelled)";
}, [sel, n, skip||null]);
const liveInTop = (p, sel, skip) => p.evaluate(([sel, skip])=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return 0;
  const rx = skip ? new RegExp(skip, "i") : null;
  return [...w.querySelectorAll(sel)].filter(x=>!x.disabled
    && !(rx && rx.test((x.innerText||"").trim()))).length;
}, [sel, skip||null]);

/* the surface floors, applied to whatever overlay is up. `surface` covers the six tabs and
   the nine record sheets; every overlay in the game was as unmeasured as the league table
   was before this, and the bout is four of them — the wizard, the sand, the crux, the night. */
const overlay = (p, where) => p.evaluate(([where, FT, FP, FC])=>{
  const ws = [...document.querySelectorAll(".modalwrap")]
    .map(w=>({ z:+getComputedStyle(w).zIndex||50, w })).sort((a,b)=>b.z-a.z);
  const w = ws[0] && ws[0].w; if(!w) return { where, none:true };
  const bad = [];
  for(const e of w.querySelectorAll("div,span,button,summary,td,th,li,p")){
    if(e.offsetParent === null || e.closest("[data-scrolls]")) continue;
    const txt = (e.innerText||"").trim(); if(!txt) continue;
    const cs = getComputedStyle(e);
    if(/hidden|clip/.test(cs.overflowX) || cs.textOverflow === "ellipsis"){
      if(cs.overflowX !== "auto" && cs.overflowX !== "scroll"){
        const over = e.scrollWidth - e.clientWidth;
        if(over > 1) bad.push(`"${txt.slice(0,28)}" is cut off, ${over}px hidden`);
      }
    }
    if(!e.children.length){
      const fs = parseFloat(cs.fontSize||"16");
      if(fs < FT) bad.push(`"${txt.slice(0,22)}" is set in ${fs}px`);
    }
  }
  for(const e of w.querySelectorAll("button")){
    if(e.offsetParent === null) continue;
    const r = e.getBoundingClientRect(); if(r.height === 0) continue;
    const chip = /\bchip\b|\btag\b/.test((e.className||"").toString());
    const floor = chip ? FC : FP;
    if(r.height < floor) bad.push(`"${(e.innerText||"").trim().slice(0,20)||"(unlabelled)"}" is ${Math.round(r.height)}px tall, floor ${floor}`);
  }
  return { where, bad, controls: w.querySelectorAll("button").length };
}, [where, FLOOR_TEXT, FLOOR_TAP, FLOOR_CHIP]);

export async function run({ p, errors }){
  const lines = [], bad = [];

  await found(p);
  for(let w=0; w<4; w++){ if(!(await endWeek(p))) break; await clearAll(p); }
  await clearAll(p);

  /* a house that can actually field a card: six fit men so a pair and a melee have somebody
     for them, coin so nothing is refused for price, and the guides put away because they
     stand in front of the yard and `clearAll` does not know their words */
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
    /* THE HUNT WANTS A PARTICULAR KIND OF MAN. A yard of six random classes left the beast
       card with nobody eligible for it, so the send button stayed dead and the check quietly
       covered one engine fewer than it reported. The roster is dealt on purpose. */
    const WANT_CLS = ["Hoplomachus","Retiarius","Murmillo","Secutor","Thraex","Dimachaerus"];
    let ci = 0;
    while(A.activeG(s).length < 6 && !A.rosterFull(s)){
      const m = A.genGladiator(s, 70); m.id = s.nextId++; m.status = "active";
      const want = WANT_CLS[ci++ % WANT_CLS.length];
      if(A.CLASSES && A.CLASSES[want]) m.cls = want;
      m.kit = A.defaultKit(m.cls); m.fatigue = 0; m.strain = 0; m.lastFought = -9; m.wins = 4;
      s.gladiators.push(m);
    }
    /* THE BILL IS DRAWN EVERY THIRD WEEK AND ITS SHAPE IS CHANCE. One run offered three
       singles and a hunt, the next a pair and a melee, so what this check covered moved
       run to run while the report said nothing about it. It keeps drawing until the bill
       holds the most kinds it can find, and then the check demands every kind it drew. */
    const kindsOf = st => [...new Set(((st.games&&st.games.offers)||[])
      .map(o=>o.melee ? "melee" : o.pair ? "pair" : o.venatio ? "hunt" : "single"))];
    let best = null, bestN = 0;
    for(let i=0;i<40;i++){
      s.week++; A.makeGames(s);
      const k = kindsOf(s);
      if(k.length > bestN){ bestN = k.length; best = JSON.parse(JSON.stringify(s.games)); }
      if(bestN >= 4) break;
    }
    if(best) s.games = best;
    localStorage.setItem(key, JSON.stringify(s));
    return { men:A.activeG(s).length, offers:kindsOf(s), classes:A.activeG(s).map(g=>g.cls),
      book:(s.book&&s.book.n)||0, drawnOver:s.week };
  });
  if(ready.why) return { pass:false, why:ready.why, lines };
  lines.push(`${ready.men} fit men (${ready.classes.join(", ")})`);
  lines.push(`a bill drawn over ${ready.drawnOver} weeks holding ${ready.offers.length} kind${ready.offers.length===1?"":"s"}: ${ready.offers.join(", ") || "nothing"}`);

  await p.reload({ waitUntil:"domcontentloaded" });
  await p.waitForTimeout(1100);
  await click(p, /take up the keys/i);
  await p.waitForTimeout(1200);
  await clearAll(p, 16);

  /* one bout of every kind the bill actually drew, plus the pits, which are always open */
  const ROW = {
    single: ["a single", "^(?!.*(the pits|pair bout|hunt|melee|naumachia)).*$", 1],
    pair:   ["a pair",   "pair bout", 2],
    melee:  ["a melee",  "melee|naumachia", 3],
    hunt:   ["a hunt",   "hunt", 1],
  };
  const WANT = ready.offers.filter(k=>ROW[k]).map(k=>ROW[k]);
  WANT.push(["the pits", "the pits", 1]);
  const drove = [];

  /* ---- A MAN WHO HAS FOUGHT THIS WEEK IS NOT AVAILABLE ----
     Five bouts through one week's screens is five bouts a real house would spread over five
     weeks: the single took one man, the pair two, the melee two and the hunt one, and by the
     time the pits came round the roster was spent and the wizard offered an empty list. The
     driver read that as "nothing would send them out", which is a shrug and not a finding.
     So the yard is stood back up between bouts — which is what the weeks between them do —
     rather than ending the week, because ending it redraws the bill this check chose. */
  const restock = async () => {
    await waitSaved(p);
    await p.evaluate(()=>{
      const A = window.__LVDVS;
      for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
        try {
          const s = JSON.parse(localStorage.getItem(k)); if(!s || !s.gladiators) continue;
          for(const g of s.gladiators){ if(g.status!=="active") continue;
            g.lastFought = -9; g.fatigue = 0; g.strain = 0; g.injury = null; }
          /* ---- AND THE ONES THE EARLIER ARMS BURIED, which the first restock could not reach ----
             This check fights four real bouts before it reaches the pits and men die in them. The
             reset above stands up the LIVING; a yard that lost enough of them offers an empty list,
             the driver picks nothing, and the run reports "nothing would send them out", which is a
             shrug and not a finding — it failed exactly that way once in the suite while passing
             alone. The yard is refilled from its own men so nothing about the roster is invented. */
          const live = () => s.gladiators.filter(g=>g.status==="active");
          const seed = s.gladiators[0];
          let guard = 0;
          while(live().length < 4 && seed && guard++ < 8){
            const c = JSON.parse(JSON.stringify(seed));
            c.id = (s.nextId = (s.nextId||900) + 1);
            c.status = "active"; c.injury = null; c.fatigue = 0; c.strain = 0; c.lastFought = -9;
            c.name = `${seed.name} ${["Secundus","Tertius","Quartus","Quintus"][guard%4]}`;
            s.gladiators.push(c);
          }
          s.gold = Math.max(s.gold, 20000);
          localStorage.setItem(k, JSON.stringify(s));
        } catch(e){}
      }
    });
    await p.reload({ waitUntil:"domcontentloaded" });
    await p.waitForTimeout(1000);
    await click(p, /take up the keys/i);
    await p.waitForTimeout(1000);
    await clearAll(p, 14);
  };

  for(const [label, rowRe, men] of WANT){
    await restock();
    await tab(p, "arena"); await p.waitForTimeout(320);
    await clearAll(p, 8);
    await tab(p, "arena"); await p.waitForTimeout(280);
    if(!(await click(p, /choose a bout/i))){ continue; }
    await p.waitForTimeout(800);
    if(!(await top(p))){ bad.push(`${label}: CHOOSE A BOUT did not open the wizard`); continue; }
    await overlay(p, "the wizard, step 1").then(o=>{ if(o.bad) for(const b of o.bad) bad.push(`the wizard: ${b}`); });

    /* step 1 — the card. Matching on the row's own text, because the pits, a pair, a melee
       and a hunt all sit in the same list and each takes a different number of men. */
    const card = await p.evaluate(([re])=>{
      const ws=[...document.querySelectorAll(".modalwrap")]
        .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z);
      const w = ws[0] && ws[0].w; if(!w) return null;
      const rx = new RegExp(re, "is");
      const row = [...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled)
        .find(x=>rx.test((x.innerText||"").replace(/\n/g," ")));
      if(!row) return null; row.click();
      return (row.innerText||"").split("\n")[0].trim().slice(0,30);
    }, [rowRe]);
    if(!card){ await clearAll(p, 6); continue; }
    await p.waitForTimeout(700);

    /* step 2 onward — KEEP CHOOSING UNTIL THE GAME WILL LET US GO, rather than encoding a
       guess about how many lists each path has. The first draft picked N rows and pressed
       NEXT, which worked for four of the five and failed on the pits: the pits offer the men
       standing at the rope in the same `.optrow` shape as your own roster, so the one click
       went to the wrong list and the send button stayed disabled on a house with six fit men.
       This asks the wizard instead — press the send if it is live, else advance, else choose
       one more row — which needs to know nothing about which list is which. */
    let picked = 0, steps = [];
    for(let i=0; i<12; i++){
      if(await liveInTop(p, "button.btn-blood")) break;
      if(picked >= men && await liveInTop(p, "button.btn:not(.btn-ghost):not(.btn-blood)", "^(sound|pause|\\d+×)")){
        const adv = await inTop(p, "button.btn:not(.btn-ghost):not(.btn-blood)", "^(sound|pause|\\d+×)");
        if(adv){ steps.push(adv); await p.waitForTimeout(650); continue; }
      }
      const got = await nthInTop(p, "button.optrow", picked, "‹ back");
      if(!got){
        /* nothing left to choose and still nothing live — advance if anything will */
        const adv = await inTop(p, "button.btn:not(.btn-ghost):not(.btn-blood)", "^(sound|pause|\\d+×)");
        if(!adv) break;
        steps.push(adv); await p.waitForTimeout(650); continue;
      }
      picked++;
      await p.waitForTimeout(320);
    }
    await overlay(p, "the wizard, choosing").then(o=>{ if(o.bad) for(const b of o.bad) bad.push(`${label}, choosing: ${b}`); });

    const sent = await inTop(p, "button.btn-blood");
    if(!sent){
      /* say WHAT was on the screen, because "nothing would send them out" is not a finding,
         it is a shrug — and three of this check's four faults so far were the driver's */
      const stuck = await p.evaluate(()=>{
        const ws=[...document.querySelectorAll(".modalwrap")]
          .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z);
        const w = ws[0] && ws[0].w; if(!w) return "(no overlay at all)";
        return [...w.querySelectorAll("button")].map(x=>
          `${x.disabled?"[disabled]":""}${(x.className||"").toString().split(/\s+/)[0]}:${(x.innerText||"").split("\n")[0].trim().slice(0,22)}`)
          .slice(0,14).join(" · ");
      });
      /* and say what the YARD held, because "no rows to choose" and "rows chosen and the send
         stayed dead" are different faults and the sentence above cannot tell them apart */
      const yard = await p.evaluate(()=>{
        /* off the save, the way `restock` reaches it — the live state is a React closure and there
           is no handle onto it, and a reporting line that always says "(no state)" is worse than
           none at all */
        for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
          try { const S = JSON.parse(localStorage.getItem(k)); if(!S || !S.gladiators) continue;
            const act = S.gladiators.filter(g=>g.status==="active");
            return `${act.length} active, ${act.filter(g=>!g.injury && (g.fatigue||0)<55).length} of them fit,`
              + ` ${S.gladiators.length - act.length} off the roster`;
          } catch(e){}
        }
        return "(no save to read)"; }).catch(()=>"(unreadable)");
      bad.push(`${label}: nothing would send them out after choosing ${picked} and ${steps.length} step${steps.length===1?"":"s"} — the yard held ${yard} — on screen: ${stuck}`);
      await clearAll(p, 8); continue; }
    await p.waitForTimeout(1500);

    /* ---- THE SAND ---- */
    const onSand = await p.evaluate(()=>!!document.querySelector(".momtrack"));
    if(!onSand){ bad.push(`${label}: "${sent}" did not put anybody on the sand`); await clearAll(p, 10); continue; }
    const scene = await p.evaluate(()=>{
      const t = (document.body.innerText||"").replace(/\s+/g," ");
      return { momentum:/MOMENTUM/i.test(t), crowd:/CROWD/i.test(t),
        rnd:((t.match(/RND\s*(\d+)/)||[])[1]) || null,
        bars: document.querySelectorAll(".momtrack, .track").length,
        figures: [...document.querySelectorAll("svg")].filter(s=>s.getBoundingClientRect().width>80).length,
        /* the melee does not draw two men — it cannot, there are up to six of them. It names
           its entrants as tags and strikes them through as they go out, which is the right
           picture for that engine and made a flat "somebody is drawn" assertion fail on it. */
        named: [...document.querySelectorAll("span.tag")].filter(s=>s.offsetParent!==null
          && (s.innerText||"").trim().length > 1).length,
        beat: (t.match(/(MOMENTUM|CROWD)\s*\d*\s*(.{20,120})/)||[])[2] || "" };
    });
    if(!scene.momentum || !scene.crowd) bad.push(`${label}: the sand is missing its ${!scene.momentum?"momentum":"crowd"} reading`);
    if(scene.figures < 1 && scene.named < 2)
      bad.push(`${label}: the sand shows neither a drawn fighter nor a named entrant`);
    await overlay(p, "the sand").then(o=>{ if(o.bad) for(const b of o.bad) bad.push(`the sand, ${label}: ${b}`); });

    /* fastest speed, then run it out — pressing whatever offers itself, which is how a crux
       is answered. A crux is the only thing that replaces the speed chips with real options. */
    await p.evaluate(()=>{ const c=[...document.querySelectorAll("button.chip")]
      .find(x=>/^\d+×$/.test((x.innerText||"").trim())); if(c){ c.click(); c.click(); } });
    let cruxes = 0, cruxOpts = 0, verdict = null, rounds = scene.rnd ? +scene.rnd : 0;
    for(let i=0;i<40;i++){
      const st = await p.evaluate(()=>{
        const ws=[...document.querySelectorAll(".modalwrap")]
          .map(w=>({z:+getComputedStyle(w).zIndex||50,w})).sort((a,b)=>b.z-a.z);
        const w = ws[0] && ws[0].w; const scope = w || document;
        const opts = [...scope.querySelectorAll("button.btn, button.btn-blood")].filter(x=>!x.disabled
          && !/^(sound|pause|play|\d+×|‹ back)/i.test((x.innerText||"").trim()));
        const t = (scope.innerText||"").replace(/\s+/g," ");
        return { sand: !!document.querySelector(".momtrack"),
          rnd: +((t.match(/RND\s*(\d+)/)||[])[1] || 0),
          skip: opts.some(x=>/skip to the verdict/i.test(x.innerText||"")),
          done: opts.some(x=>/return to the ludus/i.test(x.innerText||"")),
          nOpts: opts.length, text:t.slice(0,200) };
      });
      rounds = Math.max(rounds, st.rnd);
      if(st.done){ verdict = st.text; break; }
      /* a crux: options that are neither the speed chips nor the skip */
      if(st.nOpts > 1 && !st.skip){ cruxes++; cruxOpts = Math.max(cruxOpts, st.nOpts);
        await overlay(p, "a crux").then(o=>{ if(o.bad) for(const b of o.bad) bad.push(`a crux, ${label}: ${b}`); }); }
      const hit = await inTop(p, "button.btn, button.btn-blood, button.optrow", "^(sound|pause|play|\\d+×|‹ back)");
      if(!hit) await p.waitForTimeout(500);
      await p.waitForTimeout(650);
    }
    if(!verdict){ bad.push(`${label}: the bout never reached a verdict in forty presses`); await clearAll(p, 12); continue; }
    await overlay(p, "the night").then(o=>{ if(o.bad) for(const b of o.bad) bad.push(`the verdict, ${label}: ${b}`); });
    await inTop(p, "button.btn, button.btn-blood", "^(sound|pause|play|\\d+×)");
    await p.waitForTimeout(900);
    await clearAll(p, 12);
    drove.push({ label, card, sent, rounds, cruxes, cruxOpts, chose:picked, steps:steps.length, drawn:scene.figures, named:scene.named });
  }

  /* ---- AND IT HAS TO HAVE HAPPENED ----
     A screen that runs beautifully and books nothing is a fault this project has shipped
     twice: the pair booked only its wins and the melee only its losses, for fifty versions. */
  await waitSaved(p);
  const after = await slot(p);
  const booked = after && after.book ? (after.book.n||0) : 0;

  for(const d of drove)
    lines.push(`${d.label.padEnd(9)} "${d.card}" → chose ${d.chose}${d.steps?` +${d.steps} step${d.steps===1?"":"s"}`:""} → ${d.sent} → `
      + `${d.drawn?`${d.drawn} drawn`:`${d.named} named`}, ${d.rounds} rounds`
      + (d.cruxes ? `, ${d.cruxes} crux${d.cruxes===1?"":"es"} answered (${d.cruxOpts} ways)` : ", no crux")
      + " → the verdict");
  lines.push(`the record book went ${ready.book} → ${booked} bouts`);

  /* every kind the bill drew has to have been driven. A check that demands "at least two"
     quietly becomes "the pits, once" the week something breaks, and reports a pass. */
  const missed = WANT.map(w=>w[0]).filter(l=>!drove.some(d=>d.label===l));
  if(missed.length)
    bad.push(`the bill offered ${WANT.map(w=>w[0]).join(", ")} and ${missed.join(" and ")} could not be driven to a verdict`);
  if(drove.length < 2)
    bad.push(`only ${drove.length} kind${drove.length===1?"":"s"} of bout could be driven at all`);
  if(booked <= ready.book)
    bad.push(`${drove.length} bouts were fought through the real screens and the record book still says ${booked}`);
  if(!drove.some(d=>d.cruxes > 0))
    lines.push("  (no crux came up in any of them — the moment a word from the box would matter is chance, not a fault)");
  if(errors.length) bad.push(`${errors.length} page errors: ${errors.slice(0,2).join(" | ")}`);

  return { pass: bad.length === 0, why: bad.slice(0,5).join("; ") || null, lines };
}
