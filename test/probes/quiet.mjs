/* THE FAST-FORWARD BUTTON, AND THE DEAD MAN WHO TAKES IT AWAY FOR EVER

   `weekWeight(d)` scores the week and returns `quiet` only at load 0. That is the ONLY gate on the
   "Let it run · Nw" button at ludus.jsx:19575 — the game's single multi-week advance. Every other
   week you press End Week once.

   Until v3.22.0 one of the load terms had no window:

       if((d.unburied||[]).some(m=>!m.done)) load += 1;          // the fault

   Everything else that reads the unburied DOES have one. The agenda line uses `unhonoured(d)`, six
   weeks, and says so in its own text — "after this nobody can put it right". The villa section that
   offers the rites uses `unhonoured(S)` and is captioned "6w to decide". `markUnburied` keeps the
   last 14 men for ever and only `holdMunera` sets `done`, which the UI only offers inside the window.

   So the claim to test: ONCE A HOUSE LOSES ONE MAN IT DID NOT HONOUR INSIDE SIX WEEKS, `load` can
   never return to 0, and the fast-forward button never appears again for the rest of the run — over a
   liability the player has no remaining action to clear.

   MEASURED, 10 houses x 420 weeks: the term fired on 95.6% of all house-weeks, every one of the ten
   houses was stuck for good between week 10 and week 37, and EVERY house's last quiet week fell
   inside its first 13. Windowed, the last quiet week moves to 145-325 for seven of them and quiet
   weeks go 1.8% -> 4.1% of play. So the fast-forward was an early-game-only button by accident.

   THE PROBE STILL RUNS AFTER THE FIX, and its counterfactual column now points the other way: it
   reconstructs the OLD unwindowed load from the current windowed code, so the two columns stay
   "now" against "before". Left the first way round it silently drifted below the truth.

   WHAT WOULD FALSIFY IT: quiet weeks appearing late in a house's life anyway (some other term
   returning to 0 is not enough — the unburied term must), or the counterfactual moving nothing,
   which would mean load is above 0 for other reasons whenever this term fires and the button was
   never coming back regardless.

   THE COUNTERFACTUAL IS THE RISKY PART and it is kept as small as possible: the TOTAL comes from the
   game's own `weekWeight`, and only the single term is recomputed, off the game's own `unhonoured`.
   Re-implementing the whole scoring here is how a probe ends up measuring itself. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  if(typeof A.weekWeight !== "function")
    return { err:"weekWeight is not on the handle — rebuild with `node build.js --test`" };
  let weeks=0, quiet=0, quietCf=0, termFires=0, termOnly=0, everUnburied=0;
  const houses = [];
  for(let h=0;h<H;h++){
    const d = A.newGameState("Qt"+h,"clean",`QUIET-${h}`,null);
    let lastQuiet = null, lastQuietCf = null, firstStuck = null, hw = 0;
    for(let w=0;w<W;w++){
      if(d.over) break;
      weeks++; hw++;
      const ww = A.weekWeight(d);
      /* the two readings of the same fact, both off the game's own functions */
      const anyUndone   = (d.unburied||[]).some(m=>!m.done)            ? 1 : 0;
      const inWindow    = A.unhonoured(d).some(m=>!m.done)             ? 1 : 0;
      /* ---- THIS COLUMN INVERTED WHEN THE FIX LANDED, AND SAID SO IN THE OUTPUT ----
         It was `load - anyUndone + inWindow`, which reconstructs the WINDOWED reading from the
         unwindowed code. Once the game itself windowed the term, that expression subtracted a term
         the load no longer carried and the column drifted below the truth. It now reconstructs the
         OTHER direction — the OLD, unwindowed load from the current windowed code — so the probe
         keeps answering the same question after the thing it measured changed under it. */
      const oldLoad = ww.load - inWindow + anyUndone;
      if(anyUndone) termFires++;
      if(anyUndone && ww.load === 1) termOnly++;     /* the term is the ONLY thing holding it up */
      if(ww.kind === "quiet"){ quiet++; lastQuiet = d.week; }
      if(oldLoad <= 0){ quietCf++; lastQuietCf = d.week; }
      /* the first week the house is permanently carrying a man it can no longer put right */
      if(firstStuck === null && anyUndone && !inWindow) firstStuck = d.week;
      R.lanista(d);
    }
    houses.push({ h, weeks:hw, ended:d.over?d.over.kind:"alive", lastQuiet, lastQuietCf, firstStuck,
      unburied:(d.unburied||[]).length, honoured:A.n_honoured ? 0 : (d.honoured||0) });
    if((d.unburied||[]).length) everUnburied++;
  }
  return { weeks, quiet, quietCf, termFires, termOnly, everUnburied, houses, H, W, rope:R.say() };
}, [H,W]);
await browser.close(); server.close();
if(out.err){ console.error(out.err); process.exit(1); }
const pc = (n,d) => d ? `${(n/d*100).toFixed(1)}%` : "-";
console.log(`=== THE QUIET WEEK, AND WHAT TAKES IT AWAY ===`);
console.log(`  ${out.weeks} house-weeks over ${out.H} houses · ${out.everUnburied} houses ended with men unburied\n`);
console.log(`  weeks the game calls QUIET (load 0)              ${out.quiet}  (${pc(out.quiet,out.weeks)})`);
console.log(`  ...as it was BEFORE the term was windowed          ${out.quietCf}  (${pc(out.quietCf,out.weeks)})`);
console.log(`  weeks the unburied term fired at all             ${out.termFires}  (${pc(out.termFires,out.weeks)})`);
console.log(`  ...of which it was the ONLY thing above zero     ${out.termOnly}  (${pc(out.termOnly,out.weeks)})`);
console.log(`\n  PER HOUSE — "last quiet" is the last week the fast-forward button could appear.`);
console.log(`  A house that goes stuck early and never comes back is the claim; a house with a late`);
console.log(`  quiet week falsifies it.`);
console.log(`  house  weeks  ended        last quiet   last quiet (unwindowed)   first week stuck for good`);
for(const h of out.houses)
  console.log(`  ${String(h.h).padStart(5)}  ${String(h.weeks).padStart(5)}  ${h.ended.padEnd(11)}`
    + `  ${String(h.lastQuiet==null?"never":h.lastQuiet).padStart(10)}`
    + `   ${String(h.lastQuietCf==null?"never":h.lastQuietCf).padStart(21)}`
    + `   ${String(h.firstStuck==null?"-":h.firstStuck).padStart(25)}`);
console.log(`\n  rope: ${out.rope}`);
