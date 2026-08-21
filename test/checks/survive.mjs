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
   already carries a version of it.

   ---- THE SENTENCE IN BOLD ABOVE IS WITHDRAWN — #176, v3.70.0 ----
   `standing` is NOT inert, and the run that said so could not have known. Re-measured over 240
   houses on four seed prefixes, the same opening-purse lever:

     opening gold 800 -> 150     standing 77% -> 58%  (-18.3 points)     men -25.2%
     #142 read, at 60 houses     standing 65% -> 65%  (  0.0 points)     men -26.6%

   The instrument agrees with #142 on the quantity #142 sampled well and disagrees on the one it did
   not, which is the signature of sampling noise rather than of a changed game or a broken probe.
   Broken out prefix by prefix, the four independent 60-house runs read **-16, -9, -3 and -16
   houses**, mean -11.0 with an sd of **6.3**. #142's 0 sits 1.8 sd from that mean — unlucky, not
   impossible, and one of the four prefixes here read only -3. **Sixty houses cannot separate "inert"
   from "falls by a fifth."** That is #136's rule for the sixth time, and this is the first time it
   caught a figure that had become the JUSTIFICATION FOR A BAR DESIGN.

   What follows from the withdrawal: the conjunction is NOT "gated on a dead term". Both halves move
   under an economic squeeze, `men` more than `standing` (-25% against -18 points), which is the
   defensible half of the original sentence and all that survives of it. The bars are NOT moved on
   this — it corrects the rationale, not the threshold, and where the threshold belongs is #175's
   question. The other two levers are not re-run: #142's own explanation of `bill x3` is sound (at 26
   weeks the bill is 30-40d and tripling it is nothing against purses) and `purses x0.3` has no
   lever reachable without patching the engine, which the handle cannot do (#173).

   AND THE FOUR DEFINITIONS WERE A RED HERRING, which is worth recording because it was my
   hypothesis. `open.mjs` reads `fit>0` and ignores `d.over`; this check reads `!over && yard>0`. On
   800 identical houses they differ by up to 17 points in LEVEL (88 / 74 / 77 / 91). They do not
   differ in RESPONSE: under the same squeeze they fall -22.5, -22.5, -21.3 and -20.4 points. The
   guess was that `open`'s blindness to `over` hid the bankruptcies an economic squeeze causes; at
   the hardest setting only **7 of 240** houses had ended while still holding a fit man. The level
   difference is real and matters to anyone quoting an absolute rate. It is not what broke #142. */
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

/* ---- #175: THE COST OF A RED SUITE, COUNTED — AND THE PAIR IS NOT WHAT IT READS AS ----
   #155 settled the BAR and this does not reopen it. What nobody had counted is the COST. Scored
   over the tally's FIRST run of each build — the extra rows exist only because a failure had just
   happened, so pooling them answers no question — this check trips a bar on **7 of 57 builds =
   12.3%** (95% Wilson 6.1-23.2%). One release in eight. All seven were followed by a passing re-run
   on the same build; four of them (v3.33.0, v3.43.0, v3.62.0, v3.66.0) were additionally proven false
   by an identical 60-house signature, which is proof rather than evidence. For the other three the
   green re-run is all the record holds — a bad draw and a fixed regression look alike from one. The pile costs 32 extra runs, about **7 hours**
   of suite time. The conjunction alone is 5.6% against #142's derived 2.7%, and the collapse net is
   4.5% against the 2.0% its own 54% per-house rate predicts.

   The drift that looked real is not: pooled over every row `standing` falls from 2.98 to 2.47
   between halves (t -1.94), but that is the CONDITIONING — over first runs only it is 2.85 to 2.56,
   t -0.79. The opening has not got harder. The re-runs make it look as though it had.

   AND `open.mjs`, the instrument used to prove those failures false, DOES NOT USE THIS WORD THE SAME
   WAY. On 800 identical houses the four available readings of "standing" are 88% (`!over && yard>0`,
   this check), 74% (`!over && fit>0`), 77% (`fit>0`, which is `open.mjs`), 91% (`yard>0`). Exact
   signature equality is unaffected and the false-failure proofs stand. But a figure CALIBRATED on
   one of these does not transfer to another, and #142's "standing is nearly inert" was read off the
   77% one. */
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

/* ---- ONE DRAW: FIVE FRESH HOUSES, PLAYED AND SCORED ----
   Lifted out of `run` whole so a second one can be taken. `found` leaves the seed field empty, and
   an empty seed is a house nobody has run — so two draws are two independent samples, which is the
   entire basis of the retry below. */
async function oneDraw({ p, errors, port }){
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

  for(const x of runs) if(x.why) lines.push(x.why);
  const live = runs.map(x=>x.r).filter(Boolean);
  for(const x of live)
    lines.push(`week ${String(x.week).padStart(2)} · gold ${String(x.gold).padStart(6)} · fame ${String(x.fame).padStart(4)} · ${x.yard} in the yard (${x.fit} fit) · ${x.bouts} bouts · ${x.bought} bought${x.over?` · ENDED: ${x.over}`:""}`);

  const standing = live.filter(x=>!x.over && x.yard > 0).length;
  const men = live.reduce((n,x)=>n+x.yard, 0);
  const menUp = live.filter(x=>!x.over).reduce((n,x)=>n+x.yard, 0);
  const ended = live.filter(x=>x.over).length;
  lines.push(`${standing} of ${live.length} houses still standing after ${WEEKS} weeks, ${men} men between them (this policy scores 4-7)`
    + (men > menUp ? ` — of which ${men - menUp} ${men - menUp === 1 ? "is" : "are"} in the ${ended} house${ended===1?"":"s"} that ENDED, leaving ${menUp} with the houses still going` : ``));

  /* THE STATISTICAL BARS — the ones a draw can trip by luck, and the only ones that are retried */
  const bars = [];
  if(!standing) bars.push(`not one of ${HOUSES} houses came through ${WEEKS} weeks able to field a man`
    + (men ? ` (the ${men} men in the line above are all inside houses that had already ended — see #175)` : ``));
  if(!men) bars.push(`${HOUSES} houses, ${WEEKS} weeks, and not a man left in any yard`);
  if(standing < BOTH_HOUSE && men < BOTH_MEN)
    bars.push(`${standing} of ${HOUSES} houses standing AND only ${men} men between them — the opening has been gutted`);
  else if(standing < FLOOR)
    lines.push(`only ${standing} houses standing, but ${men} men still in their yards — a bad run of luck, not a gutting`);
  else if(men < MEN)
    lines.push(`only ${men} men between them, but ${standing} houses still standing — a bad run of luck, not a gutting`);

  /* THE HARD FAULTS — never a draw artifact, so never retried */
  const hard = [];
  if(live.length < HOUSES) hard.push(`${HOUSES - live.length} of ${HOUSES} houses produced no save at all`);

  /* ---- A DOOR TO EXERCISE THE RETRY, BECAUSE OTHERWISE IT SHIPS UNRUN ----
     The second draw only happens on a bar trip, which is 11.5% of runs, so the release that adds it
     will almost certainly not execute it — that is exactly how v3.67.0's honesty clause shipped
     having only ever been tested against hand-built fixtures. `SURVIVE_FORCE_FIRST=1` makes the
     FIRST draw report a bar it did not trip, and nothing else: the second draw is real, the bars are
     real, and the pass/fail that comes out is the genuine article. It is off unless the variable is
     set, and it says so in the output so no run can be misread as a real trip. */
  if(process.env.SURVIVE_FORCE_FIRST === "1" && !oneDraw.__forced){
    oneDraw.__forced = true;
    bars.push(`FORCED BY SURVIVE_FORCE_FIRST=1 — not a real trip, this draw actually read (${standing},${men})`);
  }

  return { lines, live, standing, men, menUp, ended, bars, hard };
}

export async function run({ p, errors, port }){
  const lines = [];
  const A = await oneDraw({ p, errors, port });
  lines.push(...A.lines);

  /* ---- #175: A SECOND DRAW, TAKEN ONLY WHEN THE FIRST TRIPS A BAR ----
     Scored over the first run of each build in the committed tally — the extra rows exist only
     because a failure had just happened, so pooling them answers no question — this check trips a
     bar on **7 of 61 builds, 11.5%**, and each one cost a full 13.4-minute suite re-run plus a
     human deciding to order it. #155 settled that it cannot be cut by loosening; five Chromiums is
     the ceiling, and seven cost two false failures of a worse kind. The item named one remaining
     candidate — the check taking the cross-build signature itself — and rejected it, because that
     needs a baseline the check does not have.
     A SECOND DRAW NEEDS NO BASELINE. `found` leaves the seed empty, so every draw is a house nobody
     has run, and two draws are two independent samples of the same build.
     AND THE EXPERIMENT HAS ALREADY BEEN RUN, BY HAND, NINE TIMES. Every failing draw in the tally
     was followed by another run of the same build, and **all nine came back clean — 0 of 9**. That
     is what this automates. Under independence the confirmed rate is 11.5% squared, about **1.3%**;
     the observed retry-failure rate is 0 of 9, whose 95% upper bound is 30%, so 1.3% is the estimate
     the arithmetic supports and the record does not contradict.
     WHAT IT COSTS: this check is 269 seconds of a 13.4-minute suite, so a second draw adds
     0.115 x 4.5 = about **half a minute per release on average**, against the 1.5 minutes of expected
     machine time it removes and the human round-trip it removes entirely.
     WHAT IT COSTS IN POWER, stated plainly because it is the risk: if a real regression trips a bar
     with probability q, confirming halves nothing and squares it — a gutting that fails every draw
     is still caught every time, but a MARGINAL regression at q = 0.5 is caught 25% of the time
     rather than 50%. That is a real loss and it is accepted on this ground: a five-house draw could
     never see a marginal regression anyway (#176 established that even SIXTY houses cannot separate
     "inert" from "falls by a fifth"), and both draws are written to the tally, so the evidence for
     where the bar belongs keeps accumulating rather than being hidden by the retry.
     Page errors and houses that produced no save are NOT retried — those are never draw artifacts. */
  let B = null;
  if(A.bars.length && !A.hard.length){
    lines.push(`— the first draw tripped a bar (${A.standing},${A.men}); taking a SECOND draw of `
      + `${HOUSES} fresh houses before calling it, because 9 of 9 such draws in the tally came back `
      + `clean when re-run by hand (#175) —`);
    B = await oneDraw({ p, errors, port });
    lines.push(...B.lines);
  }

  const seen = B || A;
  const standing = seen.standing, men = seen.men, menUp = seen.menUp, ended = seen.ended;
  const allErrors = errors || [];
  /* ---- WHAT ACTUALLY FAILS ----
     `standing` means the house can still field somebody; the absence of an end-flag is not the same
     thing, and for a long time this check accepted it as if it were. `men` sums the yards of every
     house that produced a save, ENDED OR NOT, which v3.67.0 stopped hiding — the line above says how
     many of the men are inside houses that had already gone under. The bars are unchanged by both
     that fix and by the retry: `menUp <= men` always, so correcting the sum can only make them fire
     MORE, and re-scored against all seven first-run failures it un-fails none of them.
     ---- AND v3.74.0 IS THE FIRST DRAW WHERE THE TWO READINGS DISAGREE ----
     It came in at **standing 1, men 5, menUp 1, ended 2** and PASSED, because the conjunction asks
     `men < 4` and 5 is not. Had it asked `menUp < 4` it would have FIRED: one house standing with
     one man actually in its yard, and four of the five men counted sitting inside two houses that
     had already gone under. That is the case v3.67.0 said would eventually decide this — recorded,
     COUNTED, and not acted on, because one draw is one draw and #136's rule has fired six times in
     this project on exactly that temptation. When there are enough such rows to score, the question
     is whether the conjunction's second term should read the yards of the houses still going.
     v3.75.0 IS THE SECOND, and it is the same shape as the first: **standing 1, men 8, menUp 1,
     ended 2**, against v3.74.0's standing 1, men 5, menUp 1, ended 2. Two of the eleven rows that
     carry the split now disagree, both with ONE house standing and ONE man actually in its yard,
     both passing only because the men of two dead houses are counted with the living. Still not
     acted on — two draws is two draws, #136's rule has fired six times on smaller temptations than
     this, and a bar moved on n=2 is exactly the mistake #142 started the tally to avoid. Today the
     count is two, of eleven rows that can show it.
     The CONFIRMED bars are the second draw's when a second draw was taken, and the first draw's
     otherwise. Hard faults from either draw always fail — a house that produced no save at all is
     not a bad draw, and neither is a page error. */
  const fails = [...A.hard, ...(B ? B.hard : []), ...seen.bars];
  if(B && !B.bars.length)
    lines.push(`the second draw read (${B.standing},${B.men}) and tripped nothing — the first was the `
      + `tail, not the build. Both draws are in the tally, so the first is not hidden. If this build `
      + `is genuinely suspect the proof is unchanged: \`node test/probes/open.mjs\` here and on the `
      + `last build, and diff the SIG line — identical house for house means no path a new house executes differs`);
  if(B && B.bars.length)
    lines.push(`TWO independent draws of ${HOUSES} fresh houses BOTH tripped a bar — (${A.standing},${A.men}) `
      + `then (${B.standing},${B.men}). At the tally's rate that is about a 1.3% coincidence, so this `
      + `is the build and not the draw. Confirm with \`node test/probes/open.mjs\` against the last build`);
  if(allErrors.length) fails.push(`${allErrors.length} page errors: ${allErrors.slice(0,2).join(" | ")}`);

  /* ---- and the observation goes on the pile, whatever it was ---- */
  const was = readTally();
  /* `menUp` and `ended` are new in v3.67.0 and are recorded rather than acted on: the rows before
     that release do not carry them, so anything read off them must say so and count only the rows
     that have them. */
  /* BOTH draws go on the pile, marked. Recording only the survivor would make the retry launder the
     record: the first-run rate is the number #175 is about, and the whole point of the tally is that
     in ten releases the bar's position is answerable off evidence. `draw` is 1 or 2; rows before
     v3.71.0 carry neither it nor `menUp`, so anything read off them must say so and count only the
     rows that have them. Scoring the FIRST draw of each build is still exactly what it was. */
  const row = (dr, draw) => ({ v: version(), standing: dr.standing, men: dr.men, menUp: dr.menUp,
    ended: dr.ended, houses: dr.live.length, weeks: WEEKS, draw,
    pass: !(dr.bars.length || dr.hard.length) });
  const mineAll = B ? [row(A,1), row(B,2)] : [row(A,1)];
  /* ---- A FORCED RUN IS NOT AN OBSERVATION ----
     `SURVIVE_FORCE_FIRST=1` makes the first draw report a bar it did not trip. Writing that to the
     tally would put a failure into the permanent record that never happened, and the first-run
     failure rate — the number #175 is entirely about — is read straight off these rows. So a forced
     run reports and does not record. Found by asking what the test hook would leave behind before
     running it, which is cheaper than finding it in the tally afterwards. */
  const forced = process.env.SURVIVE_FORCE_FIRST === "1";
  let wrote = !forced;
  if(forced) lines.push(`SURVIVE_FORCE_FIRST=1 — this run is NOT written to the tally, because a forced `
    + `trip is not an observation and the first-run rate is read off these rows`);
  else {
    try { fs.writeFileSync(TALLY, JSON.stringify([...was, ...mineAll], null, 0).replace(/\},\{/g, "},\n{") + "\n"); }
    catch(e){ wrote = false; lines.push(`could not write the tally: ${e.message}`); }
  }
  const all = [...was, ...mineAll];
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
