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

import { found, endWeek, clearAll, tab, click, slot, waitSaved, open, ROOT } from "../harness.mjs";
import fs from "node:fs";
import path from "node:path";

/* ---- #130: THE SAMPLE NOW ACCUMULATES, BECAUSE IT COULD NOT BE MADE BIGGER ----
   Everything above is the record of trying to calibrate a bar against a distribution nobody could
   afford to sample. The head says it plainly: twelve runs put a 95% interval on 1-in-12 of roughly
   1.5% to 35%, the cure is more houses, and more houses is the one thing this check cannot cheaply
   have — 7 Chromiums on 4 cores started missing clicks and cost two false failures of a different
   kind. So HOUSES stays at 5 and the sample stays small WITHIN a run.

   What nobody tried is making it accumulate ACROSS runs. Every observation this check has ever made
   was written into the head comment by hand, one paragraph at a time, and #125 is what that practice
   costs: a figure copied into prose is a figure nobody can recompute. The pair (standing, men) and
   the version that produced it go into a file now, and the check prints the pooled distribution it
   has collected. In ten releases the bar can be set on evidence instead of on an argument, and the
   evidence will carry which build each observation came from — which is the whole of #130, because
   "twelve runs of one build" is a sample that cannot see a reshuffle.

   The file is in the repo ON PURPOSE. This container is ephemeral and anything outside the tree is
   gone with it, and the tally is only worth having if it survives the session that wrote it. It is
   append-only, one line per run, and a run that cannot write it says so and carries on rather than
   failing — a tally is evidence for the next person, not a thing the suite depends on. */
const TALLY = path.join(ROOT, "test", "survive-tally.json");
const readTally = () => { try { const j = JSON.parse(fs.readFileSync(TALLY, "utf8"));
  return Array.isArray(j) ? j : []; } catch(e){ return []; } };
const version = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version || "?"; }
  catch(e){ return "?"; } };

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

   ---- AND THE BAR WAS MEASURED PROPERLY IN v2.87.0, AFTER A FALSE ALARM OF MINE ----
   v2.76.0 saw this check fail on a byte-identical build, and the note written then said the
   conjunction "trips on luck about one run in four". That was one failure in the first handful of
   runs, which is not a rate. **Thirty-five real runs of this check were collected across the
   session's releases and tallied:**

     houses standing   1 in 3 runs · 2 in 10 · 3 in 17 · 4 in 4 · 5 in 1
     men between them  min 2 · median 6 · max 12
     HARD FAILS (standing < 2 AND men < 5)   **1 of 35 = 2.9%**
     and 0 of the 27 runs since v2.79.0

   So the bar is calibrated about where it was designed to be — the note above budgets for 1.6% of
   healthy runs failing, and 1 failure in 35 is consistent with that at this n. **The conjunction is
   doing exactly its job**: three runs came in with only one house standing, and because two of them
   still had five or more men between their yards, the check called those a bad week and passed. Only
   the third was weak on both readings at once, which is the thing the bar is for.

   NOTHING WAS CHANGED. The one-in-four figure is retracted; it was a rate quoted off four samples.

   Neither is a precision instrument for difficulty and they are not meant to be.
   They catch the thing this check has always caught — a change that quietly guts
   every opening — and the per-house line is printed every run so drift is visible
   long before either bar is touched.

   ---- AND THEN IT SCORED 1 OF 5, AND THE ALARM WAS MINE ----

   v2.68.0 saw 3, 3, 4, 2 and then 1 standing across a session's runs. Thirteen of
   twenty-five is 52% against the 70% above, which has a 4.4% chance of happening if
   70% is true — enough to go looking. Two measurements, both worth keeping:

   THE OPENING HAS NOT MOVED. A fixed handle policy over 200 houses returned 72
   standing, 36.0%, with identical endings to one decimal on FOUR builds spanning
   v2.5x to v2.68.0 — the same to the house, which means those releases do not touch
   a single code path a new house executes, `endWeek` included. If you ever need to
   ask "did I just break the opening", that probe answers it in two minutes and its
   answer is unambiguous because the streams are identical when nothing relevant
   changed.

   THE BAR IS CALIBRATED. Re-bootstrapped by pooling four runs of THIS check on the
   current build — its own policy, not a handle imitation: 5 + 2 + 3 + 3 = **13 of 20
   standing, 65%, one standard error 10.7 points**. The original 70% sits inside that.
   So the 1-of-5 was the false failure the bar is designed to tolerate, and what it
   costs is worth writing down, because it depends entirely on a rate nobody can
   measure precisely at this sample size:

     true rate        70%    65%    55%    50%
     runs that fail   3.1%   5.7%  13.1%  18.8%    (5 houses, floor of 2)

   At 65% it cries wolf about one run in eighteen. That is the price of five houses
   and it is the right price on this machine — its own note above records that seven
   Chromiums on four cores made houses miss clicks, so buying power with more houses
   would cost accuracy somewhere worse. Raise WEEKS if you want more signal.

   ---- HOW A NEW HOUSE ACTUALLY DIES, WHICH IS NOT WHAT THE LEDGER ROW SAYS ----

   Of the seven failures in those twenty houses: **five were the yard emptying and two
   were the ledger** — and three of the five still had coin in the box when the last
   man went, holding 248, 360 and 96 denarii. The balance reference says debt is 85%
   of endings and "the ledger is the competent player's only enemy", and that was
   measured over long runs of a good policy. It is not true of the opening. Early, you
   die of attrition with money in hand; later, you die of the ledger. A reader who
   carries the table's headline into the first twenty-six weeks will tune the wrong
   dial. */
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
   above stop describing what you see, it is the game that moved, not this comment.

   ---- AND IN v2.76.0 IT WAS NOT THE GAME THAT MOVED ----

   This check failed the v2.76.0 suite at **1 of 5 standing and 3 men between them** — both bars at
   once, which the paragraph above calls the only thing it was ever able to detect and says "no
   amount of bad luck produces on a healthy build". `src/ludus.jsx` in that build was **byte-
   identical** to v2.75.0's, which passed: `git diff 753714a -- src/ludus.jsx` was empty. The
   release added a check file and three documents and touched no game code at all.

   Re-run three more times on that same identical build:

     1 / 5 with 3 men  (the suite run, FAIL) · 4 / 5 with 7 · 2 / 5 with 10 · 4 / 5 with 7

   So both-weak-together does happen on luck, at something like one run in four, and the claim in
   the paragraph above is falsified by a build that could not have changed the opening.

   THE BAR WAS DELIBERATELY NOT TOUCHED. The comment above is right that loosening a threshold in
   the same breath as its failure is the worst possible look, and it is right again that the fix is
   evidence rather than a nudge — four samples is how the last bad bar got set. What is needed is
   the actual distribution of (houses standing, men) over ten or more runs of an unchanged build,
   and then a threshold set against it. That is a job of its own and it is written down as one.

   ---- AND IN v2.91.0 THAT JOB WAS DONE. TWELVE RUNS, ONE BUILD ----

   Run twelve times back to back on 96ebc0c, nothing else on the machine (this check takes five
   browsers and its own notes blame CPU contention for two false failures, so it got the box):

     standing  1 · 2 · 2 · 3 · 3 · 3 · 3 · 3 · 4 · 4 · 4 · 5      median 3
     men       4 · 3 · 5 · 4 · 6 · 6 · 6 · 6 · 6 · 6 · 11 · 6     median 6

   ONE FAILURE IN TWELVE — the run at 1 standing with 4 men, which trips `standing < BOTH_HOUSE &&
   men < BOTH_MEN`. Pooled with the 35 runs counted in task #50, which found one failure, that is
   **2 failures in 47 runs, about one in twenty-four**. (Pooling across builds is the thing this
   project keeps warning about; it is defensible only for the FAILURE RATE of a check on builds that
   did not touch the opening, and the twelve above stand on their own regardless.)

   SO THE "ONE RUN IN FOUR" ABOVE IS RETRACTED. It came from four samples and it is not what the
   check does: 1 of 12 here, 2 of 47 pooled.

   AND THE BAR IS STILL NOT TOUCHED, on purpose. Twelve runs put a 95% interval on 1-in-12 of
   roughly 1.5% to 35% — enough to rule out one-in-four, nowhere near enough to pin the rate. The
   one obvious tightening (BOTH_MEN 5 → 4) would have passed the single failing run and cost nothing
   visible, and that is exactly the objection: it would be a constant fitted to ONE event, which is
   the same mistake as MEN = 6 with the sign flipped. A bar is moved when the evidence says where to
   put it, not when a run it caught looks survivable in hindsight.
   What IS on record now is the distribution, so the next person has the sample rather than an
   argument. If a build fails this check, look at the pair before believing it: (1, 4) and (2, 3)
   are inside measured ordinary variance, and a real gutting drives both to nothing.

   ---- AND v2.92.0 DREW THE WORST HAND YET, WHICH SHARPENED THE DIAGNOSIS ----

   The v2.92.0 suite failed here at **(1 standing, 1 man)** — worse than anything in the twelve above,
   and low enough to trip the `men < MEN` bar on its own. Three runs immediately after, same build:

     (3, 8) PASS · (5, 6) PASS

   so the tally on this build family is **2 failures in 15 runs, about one in eight**.

   THE CHANGE IN THAT RELEASE WAS PROVED INERT BEFORE LUCK WAS BLAMED, which is the only honest order
   to do this in. v2.92.0 added "sold" to `GONE`, and `isGone` is read in forty places — so the
   question is whether a 26-week clean house can ever hold a man at `status === "sold"`. It cannot:
   the whole file has exactly ONE producer of that status, `sellTheHouse`, and this check never strips
   a house. Every other sale either deletes the row or writes `status = "departed"`. So `isGone`
   returns the same answer for every man this check will ever see.

   AND THE BAR IS STILL RIGHT — the SAMPLE is what is small. (1, 1) is not a threshold being too
   strict; five houses holding one man between them IS a gutted opening on any reading. The check is
   correctly describing the sample it was given, and the sample is drawn from a distribution wide
   enough to produce that about one run in eight. The cure is therefore more houses, not a looser bar
   — and that is the one thing this check cannot cheaply have: HOUSES is already 5 browsers, and the
   note above records that 7 Chromiums on 4 cores started missing clicks and cost two false failures
   of a different kind. Raising HOUSES trades a known false-failure mode for a worse one.
   So: unchanged, again, and deliberately. A failure here is worth exactly one re-run before it is
   worth investigating.

   ---- AND THE "RATE HAS DOUBLED" READING WAS SELECTION BIAS OF MY OWN MAKING, v2.96.0 ----

   After the v2.95.0 suite failed here at (1, 1), I pooled every run on the v2.89-v2.95 family and got
   4 failures in 20 — about one in five, against the one in twelve measured above — and wrote it up as a
   possible drift in the opening. It is not. THE POOL WAS ENRICHED FOR FAILURES BECAUSE I ONLY EVER
   RE-RAN AFTER A FAILURE. Every extra run in that tally was conditioned on a failure having just
   happened, which is the opposite of a random sample.

   The controlled answer, twelve runs back to back on v2.95.0 (c311b7b), machine to itself:

     standing  3 · 5 · 4 · 4 · 2 · 3 · 3 · 1 · 2 · 4 · 3 · —      median 3
     men       8 · 8 · 6 · 9 · 8 · 4 · 3 · 10 · 2 · 6 · 9 · —     median 8
     FAILURES: **NONE**

   Pooled with the twelve at 96ebc0c (one failure), that is **1 failure in 24 controlled runs, about
   4%** — consistent with the original measurement and nowhere near one in five. The (1, 1) and (1, 4)
   draws were the tail, and v2.95.0 was independently proved inert by an A/B of HEAD~1 against HEAD
   over six fixed seeds that produced a byte-identical 26-week trail.

   THE RULE THAT COMES OUT OF IT: never pool opportunistic re-runs with scheduled ones. A rerun you
   did BECAUSE something failed is not a sample from the same distribution, and mixing the two will
   always make a flaky check look worse than it is. If a rate matters, run a fixed number of runs
   decided in advance and count all of them.  */
/* ---- #142: MOVED 5 -> 4 ON THE EVIDENCE THE NOTE ABOVE ASKED FOR ----
   The v2.87.0 note identified this exact tightening and refused it, correctly: at the time it would
   have been a constant fitted to ONE event. The tally now holds 37 runs across 24 builds with no
   drift in the opening (mean standing 3.11 in the first half against 2.95 in the second, mean men
   5.44 against 5.11), so pooling is defensible and the distribution can set the bar:

     standing   0:1  1:3  2:8  3:12  4:8  5:5          men   2:4 3:2 4:9 5:4 6:9 7:5 8:2 10:2

     bar                                fires on the 37 healthy runs
     standing<2 AND men<5  (was)        3  = 8.1%      3.15.0(1,2) 3.20.0(1,4) 3.33.0(0,4)
     standing<2 AND men<4  (is)         1  = 2.7%      3.15.0(1,2)
     standing<1 AND men<4               0  = 0.0%

   8.1% against a design budget of 1.6% is the thing being fixed. 4 is chosen over the 0% options
   because a run at (1,3) SHOULD fail — that is weak on both readings at once, which is what the
   conjunction is for — and because two of the three retired failures are now known not to be the
   game: v3.33.0's (0,4) was proven a false failure by a cross-build signature (60 houses played on
   v3.32.0 and v3.33.0 gave identical results house for house), and v2.68.0's was investigated for
   two hours and found nothing. The survivor, (1,2), is left failing on purpose.

   ---- AND THE SENSITIVITY WAS MEASURED, WHICH MATTERS MORE THAN THE FALSE-FAILURE RATE ----
   A quieter bar is only an improvement if it still catches the thing the check exists for. Three
   gutting levers, each measured headlessly over 60 houses x 26 weeks so the reading is not itself
   a 5-house lottery:

     clean                    39 of 60 standing · 128 men
     weekly bill x3           44 · 123          <- NOT a gutting: at 26 weeks a house has 3-5 men
     opening gold 800 -> 150  39 ·  94             and no buildings, so the bill is ~30-40d and
     bout purses x0.3         40 · 104             tripling it is nothing against purses

   **`standing` is nearly inert and `men` is the half that responds.** That is the diagnosis under
   both symptoms: the conjunction is GATED on the dead term, so it fires when standing dips by
   luck and would sit quiet while the economy moved. It is left as a conjunction anyway, because
   the two absolute guards above it (`!standing`, `!men`) are the catastrophe net and this is the
   middle ground — but nobody should mistake this check for an economy regression detector. At five
   houses it cannot be one: the gold gutting above is a 27% fall in men that scales to roughly
   10.7 -> 7.8 on five houses, which is inside ordinary variance. **A fixed-policy headless run over
   60 houses is the instrument for that** — it separated all three levers cleanly, and `policy`
   already carries a version of it. */
/* ---- #155: THE POOLED RATE WAS THREE THINGS AT ONCE, AND #142'S BAR IS ON BUDGET ----
   An item was opened claiming this check fires three times more often than #142 derived — 2.7%
   against an observed 9%. It does not, and the item's own clause named the escape: the two figures
   were not comparable. Re-scored against today's constants over 58 recorded runs:

     the conjunction   standing < 2 AND men < 4      2 = 3.4%    against #142's derived 2.7%
     the collapse      standing === 0                2 = 3.4%    against about 1.4% expected
     neither           3.20.0 (1,4)                  1           failed under constants since retired

   #142's 2.7% was derived for the CONJUNCTION and for nothing else. Counting the catastrophe net's
   firings against it, and counting a run that failed under BOTH_MEN = 5, is counting three
   populations as one. The conjunction is doing exactly what it was set to do.

   THE COLLAPSE IS NOT A BUG EITHER, and its old comment claimed it could not happen: the per-house
   standing rate across the whole tally is 58%, so all five falling together has about a 1.4% chance
   a run — once in seventy-odd — and over fifty-eight runs it has come up twice. Both were proven
   false by a cross-build signature (60 headless houses, identical house for house), which is now
   named in the failure message itself so the next reader does not rediscover it.

   Over-dispersion was checked before any of this was written, because "the runs are not independent"
   would have been a different item: variance on `standing` is 1.52 against a binomial 1.22 at the
   observed rate, a factor of 1.25, which is mild and does not need a model.

   WHAT IS NOT DONE: the bar is not widened, HOUSES is not raised. The rate the bar was derived for
   is the rate it delivers, and a check that stops firing is not the goal. What was actually wrong
   was the SUMMARY LINE, which pooled everything into one percentage — and that single number is
   what opened the item. It splits by bar now. */
const BOTH_MEN  = 4;   /* both weak together is the failure; either alone is a bad week */
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
  /* ---- THE COLLAPSE: NOTHING LEFT ANYWHERE ----
     This comment used to read "Neither of these happens by bad luck", and #155 measured that it does.
     Over 57 recorded runs the per-house standing rate is about 58%, so all five falling together has
     roughly a 1.3% chance a run — about once in seventy-six — and it has come up twice, at v3.33.0
     and v3.43.0, BOTH proven false by a cross-build signature over 60 headless houses. The guard
     stays exactly as it is, because a run where nobody can field a man is worth stopping for. What
     changes is that it now says what to do next, so the next reader does not spend two hours
     rediscovering it. */
  if(!standing) fails.push(`not one of ${HOUSES} houses came through ${WEEKS} weeks able to field a man`
    + ` — measured at about a 1.3% chance a run on five houses, and twice out of twice so far it has`
    + ` been luck rather than the build. Before believing it: \`node test/probes/open.mjs\` on this`
    + ` build and on the last, and diff the SIG line. Identical house for house means no path a new`
    + ` house executes differs and this is the tail`);
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

  /* ---- and the observation goes on the pile, whatever it was ---- */
  const was = readTally();
  const mine = { v: version(), standing, men, houses: live.length, weeks: WEEKS, pass: fails.length === 0 };
  let wrote = true;
  try { fs.writeFileSync(TALLY, JSON.stringify([...was, mine], null, 0).replace(/\},\{/g, "},\n{") + "\n"); }
  catch(e){ wrote = false; lines.push(`could not write the tally: ${e.message}`); }
  const all = [...was, mine];
  if(all.length > 1){
    const failed = all.filter(x=>!x.pass).length;
    const builds = new Set(all.map(x=>x.v)).size;
    const st = all.map(x=>x.standing).sort((a,b)=>a-b), mn = all.map(x=>x.men).sort((a,b)=>a-b);
    const q = (a,f) => a[Math.min(a.length-1, Math.floor(a.length*f))];
    lines.push(`THE POOLED TALLY, ${all.length} run${all.length===1?"":"s"} across ${builds} build${builds===1?"":"s"}`
      + ` [#130 — the head's own figures were 1 of 12 and 2 of 47, all hand-copied from one build family]:`);
    /* ---- AND THE POOLED RATE IS THREE DIFFERENT THINGS — #155 ----
       This line said "failures N of M (X%)" and nothing else, and that single number opened a
       roadmap item claiming the check fires three times more often than #142 derived. It does not.
       The recorded pairs are re-scored against the CURRENT constants and split by which bar they
       trip, because pooling them answers no question anybody has:
         · the conjunction is the bar #142 derived at 2.7%, and it is the only one that figure was
           ever about.
         · `standing === 0` is the catastrophe net, whose own comment used to say it does not happen
           by bad luck. At a measured per-house standing rate near 58% all five falling has about a
           1.3% chance a run, so over fifty-odd runs it happens, and it has — twice, both proven
           false by cross-build signature.
         · and some recorded failures trip NEITHER bar now, because they failed under constants that
           have since been retired. Counting those against the current bar is counting the past twice.
       Re-scoring rather than trusting the stored `pass` flag is the point: the flag is what the bar
       said on the day, and the bars have moved. */
    const trips = e => { const r = [];
      if(e.standing === 0) r.push("no house standing");
      if(e.men === 0) r.push("no man anywhere");
      if(e.standing < BOTH_HOUSE && e.men < BOTH_MEN) r.push("the conjunction");
      return r; };
    const nowFail = all.filter(e=>trips(e).length);
    const byBar = {};
    for(const e of nowFail) for(const t of trips(e)) byBar[t] = (byBar[t]||0)+1;
    const retired = all.filter(e=>!e.pass && !trips(e).length);
    const pc = n => (n/all.length*100).toFixed(1);
    lines.push(`   failures as RECORDED ${failed} of ${all.length} (${pc(failed)}%)`
      + ` · re-scored against today's bars ${nowFail.length} (${pc(nowFail.length)}%)`
      + (retired.length ? ` · ${retired.length} of the recorded ones trip no current bar at all `
        + `(${retired.map(e=>`${e.v} (${e.standing},${e.men})`).join(", ")}) — they failed under constants since retired` : ""));
    lines.push(`   and by WHICH bar, which is the only comparison #142's 2.7% supports: `
      + (Object.entries(byBar).map(([k,v])=>`${k} ${v} (${pc(v)}%)`).join(" · ") || "none")
      + ` — the conjunction is the bar that figure was derived for`);
    lines.push(`   standing min ${st[0]} / median ${q(st,0.5)} / max ${st[st.length-1]}`
      + ` · men min ${mn[0]} / median ${q(mn,0.5)} / max ${mn[mn.length-1]}`
      + ` · per-house standing ${(st.reduce((a,b)=>a+b,0)/all.length/HOUSES*100).toFixed(0)}%`
      + `, so all ${HOUSES} falling together has about a `
      + `${(Math.pow(1 - st.reduce((a,b)=>a+b,0)/all.length/HOUSES, HOUSES)*100).toFixed(1)}% chance a run`);
    lines.push(`   every pair so far: ${all.map(x=>`${x.v} (${x.standing},${x.men})${x.pass?"":" FAIL"}`).join(" · ")}`);
    if(all.length < 20)
      lines.push(`   ${20 - all.length} more run${20-all.length===1?"":"s"} before this is worth setting a bar on`
        + ` — at ${all.length} the 95% interval on the failure rate is still most of the range`);
  } else if(wrote){
    lines.push(`THE POOLED TALLY starts here: 1 run recorded at v${mine.v}. #130 — the sample this bar `
      + `is calibrated on was twelve runs of one build family, all of it hand-copied into the comment `
      + `above. It accumulates in test/survive-tally.json from now on, and must be committed with the `
      + `release that produced it or it is worth nothing`);
  }
  return { pass: fails.length === 0, why: fails.join("; ") || null, lines };
}
