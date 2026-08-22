/* THE HARNESS, TESTED AGAINST THE GAME — because every tool here fails SILENTLY

   Three releases running, the change was sound and a MEASURING ASSUMPTION was what broke. Every
   one of them was quiet:

     v3.99.0  `endWeek()` matched the button with /^end week$/ — anchored at both ends. The week's
              close made it read "End week · 2 unanswered", the matcher stopped finding it,
              endWeek() returned FALSE, and every check that advances a week through the screen
              played a shorter game. Nothing threw. `reach` noticed only because its HOUSE came out
              different — arena down three actions, the villa up six — which reads exactly like a
              game fault. The tell was the clock: 51 seconds against 114.
     v3.98.0  `scroll` counted a button as on-screen if its rect had a size. Chrome does not zero
              the rects of a closed <details>'s descendants, so folding the whole villa away moved
              the page height by 503px and the button count by nothing.
     v3.97.0  the buy button, a read-level sentence and the scout fee all went silent at once,
              because innerText is "" for anything display:none — hidden text does not error, it
              simply is not there.

   The pattern is not that the suite is rotten. Audited: the page-text checks DO force their
   sections open, the anchored matchers that remain are on labels that cannot grow a suffix, and
   the rect reads that remain are position, not visibility. The pattern is that when a tool does
   break, nothing says so — the tool returns false, the count comes back low, and eighty checks
   carry on measuring something other than what they name.

   So this check drives the harness's own contract and asserts the OUTCOME rather than the call:
   not "did endWeek find a button" but "did the week actually move".
*/
import { found, endWeek, tab, click, clearAll, slot, waitSaved , forge } from "../harness.mjs";

export const name = "guards";
export const describe = "the harness still reaches what it claims to reach, and says so when it cannot";

/* every door the scene carries, and the place each must land on */
const DOORS = [
  ["ludus",   "ludus"],
  ["men",     "men"],
  ["familia", "men"],
  ["armory",  "men"],
  ["arena",   "arena"],
  ["market",  "market"],
  ["villa",   "villa"],
];

export async function run({ p, errors }){
  const lines = [], fails = [];

  /* ---- 1. found() builds the house it was asked for ---- */
  await found(p, { seed:"GUARDS" });
  await clearAll(p);
  await waitSaved(p);
  const born = await slot(p);
  if(!born) return { pass:false, why:"found() left no save in the slot — every check here starts with one", lines };
  lines.push(`found(): week ${born.week}, ${(born.gladiators||[]).length} men, ${Math.round(born.gold)}d`);

  /* ---- 2. endWeek() MOVES THE WEEK ----
     The assertion is the outcome, not the click. A matcher that stops finding the button returns
     false and is ignored by most callers; a week that does not advance is unmistakable. */
  /* ---- AND THE FIXTURE HAS TO CARRY THE SUFFIX, OR THIS PROVES NOTHING ----
     Written without this, the check passed with the broken /^end week$/ matcher restored: a
     founding owes nothing, so DUE_N is 0, the button reads exactly "End Week", and the anchored
     pattern still matched. The fault only exists once the label GROWS — which is the whole shape
     of it. A levy falling due this week is an urgency-3 row by construction, so the button must
     read "End week · 1 unanswered" before the week is advanced. */
  await forge(p, (A, R) => {
    const d = A.newGameState("Guards","clean","GUARDS-DUE",null);
    d.deadlines = [{ id: 9101, kind:"levy", amount: 200, due: d.week }];
    return d; }); await clearAll(p, 8); await waitSaved(p);

  const primed = await slot(p);
  const label = await p.evaluate(()=>{ const b=[...document.querySelectorAll("button")]
    .find(x=>/^end week/i.test((x.innerText||"").trim())); return b ? (b.innerText||"").trim() : null; });
  lines.push(`with a levy due, the button reads "${label}"`);
  if(!label || !/unanswered/i.test(label))
    fails.push(`the end-week button reads "${label}" with a levy due — the fixture no longer makes the label grow, so this check cannot see the fault it exists for`);

  const w0 = primed ? primed.week : born.week;
  const went = await endWeek(p);
  await clearAll(p, 8); await waitSaved(p);
  const after = await slot(p);
  const w1 = after ? after.week : w0;
  lines.push(`endWeek(): returned ${went} · week ${w0} → ${w1}`);
  if(!went) fails.push("endWeek() returned false — its matcher no longer finds the button, and every check that advances a week through the screen is quietly playing a shorter game");
  else if(w1 <= w0) fails.push(`endWeek() reported success and the week did not move (${w0} → ${w1}) — the press landed on something that is not the week`);

  /* ---- 3. every door the harness knows still opens ---- */
  const reached = [];
  for(const [key, want] of DOORS){
    const okp = await tab(p, key);
    await p.waitForTimeout(120);
    const at = await p.evaluate(()=>{ const sh=document.querySelector("[data-place]");
      return sh ? sh.getAttribute("data-place") : null; });
    reached.push(`${key}${okp && at===want ? "" : `→${at||"nowhere"}!`}`);
    if(!okp || at !== want)
      fails.push(`tab("${key}") did not land on ${want} (reached ${at||"nowhere"}) — a door the scene carries has moved or been renamed`);
  }
  lines.push(`doors: ${reached.join(" · ")}`);

  /* ---- 4. click() finds a control by its words, and says so when it does not ----
     Both directions matter: a matcher that finds nothing must return false rather than throw, and
     one that should find something must not come back empty. */
  await tab(p, "ludus"); await p.waitForTimeout(160);
  const hitsNothing = await click(p, /a button by this name does not exist anywhere/i);
  const hitsEndWeek = await click(p, /^end week/i);
  lines.push(`click(): a name that cannot match → ${hitsNothing} · the week's own button → ${hitsEndWeek}`);
  if(hitsNothing !== false) fails.push("click() reported success on a name nothing carries — it is matching something it should not");
  if(hitsEndWeek !== true) fails.push("click() could not find the end-week button by its first words — the harness's own prefix matcher is broken");
  await clearAll(p, 8);

  /* ---- 5. clearAll() actually clears ---- */
  const stuck = await p.evaluate(()=>{
    const w=[...document.querySelectorAll(".modalwrap")]
      .sort((a,b)=>(+getComputedStyle(b).zIndex||50)-(+getComputedStyle(a).zIndex||50))[0];
    return w ? ((w.innerText||"").trim().split("\n")[0]||"").slice(0,40) : null;
  });
  lines.push(`clearAll(): ${stuck ? `left "${stuck}" standing` : "nothing left in the way"}`);
  if(stuck) fails.push(`clearAll() left "${stuck}" on screen — checks that assume a clear page after it are reading through an overlay`);

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
