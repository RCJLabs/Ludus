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

/* ---- WHAT THE BAR IS, AND WHY IT IS THERE ----
   Measured over twenty houses on exactly the policy below: seventy per cent come
   through twenty-six weeks with a man still in the yard, and the ones that do keep
   a median of three or four. That is the game, not a fault — the opening is meant
   to be hard. But it means a bar of "two of three houses" would have failed one run
   in five with nothing wrong, and a check nobody trusts is worse than no check.

   So five houses, which cost nothing now they run side by side, and two bars taken
   off the bootstrapped distribution rather than off a hope:

     at least two still standing   passes 98.4% of healthy runs
     at least six men between them passes 98.3%, median is sixteen

   Neither is a precision instrument for difficulty and they are not meant to be.
   They catch the thing this check has always caught — a change that quietly guts
   every opening — and the per-house line is printed every run so drift is visible
   long before either bar is touched. */
const HOUSES = 5;    /* free now that they run side by side */
const WEEKS  = 26;   /* past the first winter, the first deaths, the first hard week */
const FLOOR  = 2;    /* houses that must still be able to field somebody */
const MEN    = 6;    /* and men left between all of them; sixteen is the healthy median */
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
    if(now && inYard(now) < KEEP){
      await tab(p, "market"); await p.waitForTimeout(300);
      /* and within his means. The first draft clicked whatever buy button it found
         first, which is the top of the block: three houses bought a man they could
         just afford and then could not afford the month, and ended in debt and ruin
         with men still in the yard. So: the cheapest man who fills the gap, and only
         if there is still a month in the purse behind him. */
      const took = await p.evaluate(RESERVE=>{
        const price = b => { const m=(b.innerText||"").match(/([\d,]+)\s*D\b/i); return m?+m[1].replace(/,/g,""):Infinity; };
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
  lines.push(`${standing} of ${live.length} houses still standing after ${WEEKS} weeks, ${men} men between them (the healthy median is 16)`);

  const fails = [];
  if(live.length < HOUSES) fails.push(`${HOUSES - live.length} of ${HOUSES} houses produced no save at all`);
  if(standing < FLOOR) fails.push(`only ${standing} of ${HOUSES} houses came through ${WEEKS} weeks with a man left in the yard`);
  if(men < MEN) fails.push(`${men} men left across ${HOUSES} houses — under ${MEN}, and the opening has been gutted`);
  if(allErrors.length) fails.push(`${allErrors.length} page errors: ${allErrors.slice(0,2).join(" | ")}`);
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
