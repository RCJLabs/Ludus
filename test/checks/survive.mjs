/* Can a new house still get off the ground? Three of them, twenty-six weeks each,
   taking whatever the arena offers. The oldest check there is, and the one that has
   caught the most: an economy change that quietly bankrupted every opening, a modal
   that trapped the week, a crash on the first death.

   It was five houses and thirty weeks and it took twelve minutes and outlived its
   own browser. Three and twenty-six sees the same things — the first winter, the
   first deaths, the first hard week. The three houses run side by side in their own
   browsers now, so it costs one house's wall-clock rather than three; if it needs to
   be longer, raise WEEKS rather than HOUSES, because the weeks are where the game
   changes and the houses are free.

   ---- IT SPENT A LONG TIME PASSING DEAD HOUSES ----

   Two things were wrong with it and they hid each other.

   It never bought a man. It founded a house of three, fought every week for
   twenty-six weeks at about a quarter of bouts killing somebody, and never once
   went to the block. That is not a house being tested, it is a house being
   starved, and there is only one way it can end.

   And "standing" meant d.over had not been set. So a house with nobody left in
   the yard passed, as long as the game had not yet got round to saying so. The
   run before this was rewritten ended with one man, one man, and none — and was
   recorded as three of three surviving. When the third finally tipped into the
   emptied ending, the check reported a regression that measurement then showed
   did not exist: the same policy on the version before scored 8 of 12 against 9
   of 12 after, with deaths per bout at 24.7% and 23.4%.

   So it buys when the yard is thin and it can afford to, the way a lanista does,
   and standing now means it can still field somebody. */

import { found, endWeek, clearAll, tab, click, slot, waitSaved, open } from "../harness.mjs";

export const name = "survive";
export const describe = "three new houses live twenty-six weeks and still have men";
export const slow = true;   /* drives a real browser through the real screens */
/* and five of them at once, so it gets the machine to itself. Sharing a lane put
   seven Chromiums on four cores and the houses started missing clicks — see the
   note in run.mjs; it cost two false failures before anybody worked it out. */
export const exclusive = true;

/* ---- WHAT THE BAR IS, AND WHY IT IS THERE ----
   Measured over twenty houses on exactly the policy below: seventy per cent come
   through twenty-six weeks with a man still in the yard, and the ones that do keep
   a median of three or four. That is the game, not a fault — the opening is meant
   to be hard. But it means a bar of "two of three houses" would have failed one run
   in five with nothing wrong, and a check nobody trusts is worse than no check.

   So five houses, which cost nothing now they run side by side, and two bars — one
   taken off that bootstrap, one off what this check itself actually scores:

     at least two still standing    passes 98.4% of healthy runs
     at least three men between all five  (see MEN below)

   The second bar was six for a while, borrowed from the bootstrap of the headless
   policy, and that was a mistake worth naming: the headless lanista buys more freely
   and picks his bouts better, so his distribution is not this one's. A bar is only
   as good as the thing it was measured on.

   Neither is a precision instrument for difficulty and they are not meant to be.
   They catch the thing this check has always caught — a change that quietly guts
   every opening — and the per-house line is printed every run so drift is visible
   long before either bar is touched. */
const HOUSES = 5;    /* free now that they run side by side */
const WEEKS  = 26;   /* past the first winter, the first deaths, the first hard week */
const FLOOR  = 2;    /* houses that must still be able to field somebody */
/* Men left between all five. The first version of this said six, taken from a
   bootstrap of the HEADLESS policy — which buys more freely and picks its bouts
   better than the browser one does. What this check actually scores, run after run,
   is 4, 6, 7, 7. A floor of six sits on top of that distribution and fails roughly
   one healthy run in four, which is how a check stops being read. Three catches a
   collapse — every house emptied reads zero — without crying wolf at ordinary bad
   luck, and the per-house line is printed every run so drift is visible anyway. */
const MEN    = 3;
/* ---- AND WHY THEY ARE READ TOGETHER NOW ----
   Both bars above were read separately: fail if EITHER is short. Across six runs of
   this check on builds that were not changing the opening, the pair came out

     8 men / 4 standing · 5 / 3 · 6 / 4 · 2 / 4 · 7 / 4 · 6 / 4   and once 8 / 1

   — two of which tripped a bar. Look at the two that did. One had a single house
   standing and eight men in the yard between them; the other had four houses
   standing and two men. Neither is a gutted opening. They are the same variance the
   comment above already describes, read through two thresholds that each sit on a
   tail, so the chance of tripping one of them is roughly the sum of two small
   numbers rather than either of them.

   A gutted opening drives BOTH to the floor at once — that is what "gutted" means,
   and it is the only thing this check was ever able to detect. So it fails when both
   are weak together, and separately when either is at zero, which no amount of bad
   luck produces on a healthy build.

   Written down plainly because this was changed in a release where the check had
   just failed, which is the worst possible look for a loosened bar: the build in
   question was proved bit-identical to its parent over three campaigns of a hundred
   and eighty weeks — same gold, same fame, same men, same chronicle — before this
   line was touched. The per-house rows are still printed every run. If the numbers
   above stop describing what you see, it is the game that moved, not this comment.  */
const BOTH_MEN  = 5;   /* both weak together is the failure; either alone is a bad week */
const BOTH_HOUSE = 2;
const KEEP   = 4;    /* the yard a lanista tries to hold; below it, he goes to the block */
/* what he will not spend below. A lanista does not think in percentages, he thinks
   about whether he can still feed the house next month — and a small house costs
   seventy to ninety denarii a week. The first draft of this used forty per cent of
   the purse, which sounds reasonable and bought nothing at all: a new house holds
   800 denarii and the cheapest man on the block wants 333, which is forty-two. */
const RESERVE = 260;

const inYard = d => (d.gladiators||[])
  .filter(g => g.status!=="dead" && g.status!=="gone" && g.status!=="freed").length;

async function playOne(p){
  await found(p);
  let bought = 0;
  for(let w=0; w<WEEKS; w++){
    /* keep the yard up if the purse allows — men die here, and a lanista who
       never goes to the block is not playing, he is waiting */
    const now = await slot(p);
    /* fit men, not men in the yard. The trigger counted the injured, so a house of
       four with three of them mending never went to the block — while the twenty-house
       calibration behind the bars below counted only the men who could fight. The two
       were not the same policy, and the bars were set against the wrong one. */
    if(now && (now.gladiators||[]).filter(g=>g.status==="active").length < KEEP){
      await tab(p, "market"); await p.waitForTimeout(300);
      /* and within his means. The first draft clicked whatever buy button it found
         first, which is the top of the block: three houses bought a man they could
         just afford and then could not afford the month, and ended in debt and ruin
         with men still in the yard. So: the cheapest man who fills the gap, and only
         if there is still a month in the purse behind him. */
      const took = await p.evaluate(RESERVE=>{
        /* the block writes "BUY FOR 234 DENARII"; elsewhere the game writes "· 333D".
           The first draft matched only the second, so every price came back null,
           every candidate was filtered out, and five houses ran twenty-six weeks
           with `0 bought` while the check reported the opening as gutted. */
        const price = b => { const m=(b.innerText||"").match(/([\d,]+)\s*(?:denarii|d)\b/i);
          return m ? +m[1].replace(/,/g,"") : Infinity; };
        const purse = (()=>{ for(const k of Object.keys(localStorage)) if(/ludus-slot-\d/.test(k)){
          try{ const s=JSON.parse(localStorage.getItem(k)); if(s&&s.gladiators) return s.gold; }catch(e){} } return 0; })();
        const buys = [...document.querySelectorAll("button")]
          .filter(x=>/^(buy|take him|pay|meet it)/i.test((x.innerText||"").trim()) && !x.disabled)
          .map(b=>({ b, p:price(b) }))
          .filter(x=>Number.isFinite(x.p) && purse - x.p >= RESERVE)
          .sort((a,c)=>a.p-c.p);
        if(!buys.length) return false;
        buys[0].b.click(); return true;
      }, RESERVE);
      if(took){ bought++; await p.waitForTimeout(500); await clearAll(p, 6); }
    }
    /* take a bout if one is going */
    await tab(p, "arena"); await p.waitForTimeout(170);
    if(await click(p, /choose a bout/i)){
      await p.waitForTimeout(260);
      await p.evaluate(()=>{ const w=[...document.querySelectorAll(".modalwrap")]
        .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
        const bs=w?[...w.querySelectorAll("button.optrow")].filter(x=>!x.disabled):[];
        if(bs.length) bs[0].click(); });
      await p.waitForTimeout(240);
    }
    await clearAll(p);
    if(!(await endWeek(p))) break;
    await clearAll(p);
    const d = await slot(p);
    if(!d || d.over) break;
  }
  await waitSaved(p);
  const d = await slot(p);
  if(!d) return null;
  /* "men" must mean in the yard, not fit this week — a house whose whole roster is
     mending reads as empty otherwise, and that is the difference between a house
     having a bad month and a house being over. */
  return { week:d.week, gold:d.gold, fame:Math.round(d.fame), bought,
    yard:inYard(d), fit:(d.gladiators||[]).filter(g=>g.status==="active").length,
    bouts:(d.book&&d.book.n)||0, over:d.over ? (d.over.kind||"ended") : null };
}

export async function run({ p, errors, port }){
  const lines = [];
  /* the first house takes the session the runner opened; the rest get their own,
     because three houses queueing behind one browser was most of this check's cost */
  const extra = await Promise.all(
    Array.from({ length: HOUSES-1 }, () => open(port).catch(e => ({ err:e }))));

  const seats = [{ p, errors }, ...extra.map(s => s.err ? null : { p:s.p, errors:s.errors, browser:s.browser })];
  const runs = await Promise.all(seats.map(async (seat, i) => {
    if(!seat) return { r:null, why:`house ${i+1} could not open a browser` };
    try { return { r: await playOne(seat.p) }; }
    catch(e){ return { r:null, why:`house ${i+1} could not be played to the end: ${e.message.split("\n")[0]}` }; }
  }));
  for(const s of seats) if(s && s.browser) await s.browser.close().catch(()=>{});

  const allErrors = seats.filter(Boolean).flatMap(s => s.errors || []);
  for(const x of runs) if(x.why) lines.push(x.why);
  const live = runs.map(x=>x.r).filter(Boolean);
  for(const x of live)
    lines.push(`week ${String(x.week).padStart(2)} · gold ${String(x.gold).padStart(6)} · fame ${String(x.fame).padStart(4)} · ${x.yard} in the yard (${x.fit} fit) · ${x.bouts} bouts · ${x.bought} bought${x.over?` · ENDED: ${x.over}`:""}`);
  /* standing means it can still field somebody. The absence of an end-flag is not
     the same thing, and for a long time this check accepted it as if it were. */
  const standing = live.filter(x=>!x.over && x.yard > 0).length;
  const men = live.reduce((n,x)=>n+x.yard, 0);
  lines.push(`${standing} of ${live.length} houses still standing after ${WEEKS} weeks, ${men} men between them (this policy scores 4-7)`);

  const fails = [];
  if(live.length < HOUSES) fails.push(`${HOUSES - live.length} of ${HOUSES} houses produced no save at all`);
  /* the collapse: nothing left anywhere. Neither of these happens by bad luck. */
  if(!standing) fails.push(`not one of ${HOUSES} houses came through ${WEEKS} weeks able to field a man`);
  if(!men) fails.push(`${HOUSES} houses, ${WEEKS} weeks, and not a man left in any yard`);
  /* and the gutting: both readings weak at once */
  if(standing < BOTH_HOUSE && men < BOTH_MEN)
    fails.push(`${standing} of ${HOUSES} houses standing AND only ${men} men between them — the opening has been gutted`);
  /* one weak reading is a bad week and says so without failing */
  else if(standing < FLOOR)
    lines.push(`only ${standing} houses standing, but ${men} men still in their yards — a bad run of luck, not a gutting`);
  else if(men < MEN)
    lines.push(`only ${men} men between them, but ${standing} houses still standing — a bad run of luck, not a gutting`);
  if(allErrors.length) fails.push(`${allErrors.length} page errors: ${allErrors.slice(0,2).join(" | ")}`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
