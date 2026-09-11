/* THE REFERENCE PLAYER IS A PARTIAL PLAYER — #260, measured and held.

   (`player` was free in BOTH directories; checked before writing, in checks and probes.)

   #260 asked which of the game's doors the reference rope never opens, and which of the numbers
   this project publishes are conditioned on that. `probes/player.mjs` answers it on 19 levers x 96
   houses x 420 weeks each, six seed prefixes an arm, and this holds the three parts of the answer
   that must not change quietly.

   THE ITEM'S OWN PREMISE WAS PARTLY WRONG, which is the first thing the sweep found. It named
   three doors with "no lever at all": selling a man, `holdMunera` and `makeOffering`. Selling
   shipped as `sell` at v3.249.0; `makeOffering` has had `rites` since v3.130.0 and `stageMunus` has
   had `munus`. Only `holdMunera` was really shut, and `bury` opens it here. The count is not seven
   doors either — it is NINETEEN, and all nineteen fire.

   WHAT ACTUALLY MOVES (96 x 420 an arm, delta against the reference on the same six prefixes, and
   nothing counted as moved unless it clears the spread of the reference's own prefixes):

     tour      goldP50 284 -> 14,612 · fundP50 3,441 -> 6,908 · fameP50 2,764 -> 5,584 · rank 5 -> 7
     loan      alive 21 -> 1 · weeks 21,585 -> 11,261 · fameP50 2,764 -> 641 · rank 5 -> 2
     payoff    alive 21 -> 2 · weeks 21,585 -> 10,538 · fameP50 2,764 -> 588 · rank 5 -> 2
     court     fameP50 2,764 -> 4,584
     munus     honoured 0 -> 1,405
     bury      honoured 0 -> 1,017
     the other thirteen   nothing clears the band

   So the answer to the item is: THIRTEEN OF NINETEEN ARE CONTENT A PLAYER CAN TAKE OR LEAVE, and
   six are not. Two of the six are the lender, which halves a house's life and quarters its fame;
   one is `tour`, which multiplies its purse fifty-fold and was already labelled "a measuring arm,
   not the reference player" in the harness; and two are the only routes to `d.honoured`.

   THREE THINGS ARE HELD HERE.

   1 — THE REFERENCE PULLS NONE OF THEM. This is not a statistic, it is the definition of the
   reference player, and it has been broken before: v3.236.0 found `booking` silently fielding the
   booked man for every rope in the suite, and it was caught by `tells` going red on an unrelated
   tell rather than by anything watching the default. Now something watches the default.

   2 — `d.honoured` IS ZERO FOR THE REFERENCE AND REACHABLE BY TWO POLICIES. #261 asks whether the
   zero is the game's or the instrument's. It is the instrument's: `stageMunus` on a funeral
   occasion and `holdMunera` with `games` both write it, and the rope had a lever for the first and
   none for the second. What that zero has been hiding is a FEAT and a LESSON — `munera` wants
   three held games for 45 fame and the `order` perk, and the villa lesson is `done` at one — so
   every reachability figure this project has published has been taken on a house that could not
   complete either.

   3 — THE LENDER IS NOT A DOOR LIKE THE OTHERS. Borrowing is the one lever that takes the house's
   life rather than adding to it, and anything that runs it is measuring a different game from the
   one every other check measures. That is worth a bar of its own.

   AND THE ALARM THAT FIRST STOOD HERE WAS A NUMBER I NEVER COUNTED — "eight checks in this suite
   pass `loan:`". #260's own sweep counted it at v3.254.0: **no check in this suite runs a borrowing
   rope at all.** Four touch the lender and every one of them is scoped to it — `debt` and `ledger`
   write `d.loan` as a fixture, `ends` calls `borrow` to reach the `foreclosed` ending, `quote`
   calls it twice to prove `canBorrow` gates the second. Three PROBES run the policy (`credit`,
   `fuse`, `standing`) and all three are about borrowing. The worry the phrase carried does not
   exist, and the figure that carried it was invented in the act of writing the warning.

   THE FRAME IS DELIBERATELY THE CHEAP ONE. Per-lever liveness for all nineteen needs 19 arms and
   belongs to the probe; the three rare ones (`yard`, `lot`, `mastery` — about 0.9 pulls a thousand
   house-weeks) will not fire reliably at any frame a gate check can afford, and the all-on arm is
   WORSE for them, not better: with the lender in it a house lives 3,212 weeks against the
   reference's 10,800 and the yard card never comes up at all. So the complete-player arm here runs
   without the lender, the lender gets its own arm, and the rare three are the probe's business.

   FIVE ARMS. */
import { installRope } from "../harness.mjs";

export const name = "player";
export const describe = "the reference player opens none of the nineteen opt-in doors, and two of those doors reach a counter the whole suite reads as zero";

const HOUSES = 16, WEEKS = 420;

/* every counter the nineteen levers bump. The reference must read zero on all of them. */
const COUNTERS = ["courted","gambitWon","gambitLost","borrowed","repaid","cleared","commissioned",
  "soldMan","soldSteel","soldPaper","staged","offering","vow","buried:games","buried:rite",
  "booked","lot","overtureTaken","overtureRefused","freed","mastered","signature","retired","setOut"];
/* `favour:<rank>` is four counters with a rank in the name, so it is matched by prefix */
const PREFIXES = ["favour:"];

/* ---- BARS, ALL SET WELL INSIDE WHAT WAS MEASURED AT THIS FRAME ----
   The claim is "these doors are shut, and opening them changes the game", not any particular
   number, so every bar below is a fraction of its measurement and the figures are reported beside
   it. What the frame gives is written into the block below, on five seed sets rather than one. */
/* MEASURED ON FIVE SEED SETS AT THIS EXACT FRAME, not on one. The first cut of this file took its
   bars off the probe's frame (48 houses, a different seed word) and would have been setting them
   from a sample it never ran. `checks/young.mjs` and `checks/tells.mjs` both went red this same
   stretch on bars tighter than the sample under them, so the five sets are the point:

     reference       pulls 0, 0, 0, 0, 0 · honoured 0, 0, 0, 0, 0 · 2,996-4,126 house-weeks
     most (17 on)    pulls 3,212-4,587 · honoured 99-199 · roster p50 0 in all five
     munus alone     honoured 245-273        bury alone   honoured 165-247
     lender alone    weeks 26%, 31%, 66%, 59%, 45% of the reference · fame 8-47% · 0 alive in all five */
const MOST_PULLS  = 400;   /* measured 3,212-4,587 */
const MOST_HONOUR = 40;    /* measured 99-199 */
const MUNUS_HONOUR = 60;   /* measured 245-273 */
const BURY_HONOUR  = 60;   /* measured 165-247 */
/* ONE BAR ON THE LENDER, NOT THREE. Weeks, fame and the census rung all say the same thing and all
   three wander together across seed sets (weeks 26-66%, fame 8-47%); asserting each of them is
   three chances to go red on one house's luck. Weeks is the direct form of the claim, its worst set
   is 66%, and the other two are reported beside it. */
const LOAN_SHORTER = 0.90; /* the lender's weeks against the reference's; measured 26-66% */

export async function run({ p }){
  const lines = [], bad = [];
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","activeG","liquidate","riseOf","holdMunera","unhonoured"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function")
      return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    const med = a => { if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y);
      return s[Math.floor(0.5*s.length)]; };

    const arm = (o) => {
      const rows = [], fired = {};
      const bk0 = R.stats().booked || 0;
      for(let i=0;i<H;i++){
        const d = A.newGameState("Pl", "clean", `PLAYERCHK-${i}`);
        for(let w=0; w<W; w++){
          if(d.over) break;
          let did = null; try { did = R.lanista(d, o); } catch(e){ break; }
          if(!did) continue;
          for(const k of Object.keys(did)) if(typeof did[k] === "number") fired[k] = (fired[k]||0)+did[k];
        }
        rows.push({ end:d.over ? d.over.kind : "alive", week:d.week, gold:Math.round(d.gold),
          fame:Math.round(d.fame||0), honoured:d.honoured||0, roster:A.activeG(d).length,
          rise:A.riseOf(d) });
      }
      fired.booked = (R.stats().booked || 0) - bk0;
      return { fired, weeks:rows.reduce((n,x)=>n+x.week,0),
        alive:rows.filter(x=>x.end==="alive").length,
        honoured:rows.reduce((n,x)=>n+x.honoured,0),
        goldP50:med(rows.map(x=>x.gold)), fameP50:med(rows.map(x=>x.fame)),
        rosterP50:med(rows.map(x=>x.roster)), riseP50:med(rows.map(x=>x.rise)) };
    };

    /* the complete player WITHOUT the lender — see the note at the top of the file */
    const MOST = { court:true, gambit:true, works:true, sell:true, munus:true, rites:true,
      bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
      mastery:true, signature:true, retire:true, tour:true };
    return { ref:arm({}), most:arm(MOST), loan:arm({ loan:"murena", payoff:true }),
      munus:arm({ munus:true }), bury:arm({ bury:true }) };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { ref, most, loan, munus, bury } = r;
  const sum = (f) => COUNTERS.reduce((n,k)=>n+(f[k]||0), 0)
    + Object.keys(f).filter(k=>PREFIXES.some(px=>k.startsWith(px))).reduce((n,k)=>n+f[k], 0);

  /* 1 — the reference opens none of them */
  const opened = COUNTERS.filter(k=>(ref.fired[k]||0) > 0)
    .concat(Object.keys(ref.fired).filter(k=>PREFIXES.some(px=>k.startsWith(px)) && ref.fired[k] > 0));
  lines.push(`${HOUSES} houses to week ${WEEKS} (${ref.weeks} house-weeks): the reference pulled ${sum(ref.fired)} of the nineteen opt-in levers' counters · gold p50 ${ref.goldP50} · fame p50 ${ref.fameP50} · roster p50 ${ref.rosterP50} · ${ref.alive} alive`);
  if(opened.length)
    bad.push(`the reference player pulled ${opened.map(k=>`${k} ${ref.fired[k]}`).join(", ")} — one of the nineteen opt-in levers is now ON BY DEFAULT. `
      + `Every figure this project publishes is taken on the default rope, so this re-bases all of them at once; v3.236.0's `+"`booking`"+` default did exactly this and was caught only by an unrelated tell going red`);

  /* 2 — and the complete player is a different game */
  lines.push(`the same houses with seventeen doors open: ${sum(most.fired)} pulls · gold p50 ${most.goldP50} against ${ref.goldP50} · fame p50 ${most.fameP50} against ${ref.fameP50} · roster p50 ${most.rosterP50} against ${ref.rosterP50} [five sets: 3,212-4,587 pulls, and roster p50 0 in every one of them — the complete player frees, retires and sells its way to an empty yard]`);
  if(!(sum(most.fired) >= MOST_PULLS))
    bad.push(`the complete-player arm pulled ${sum(most.fired)} times against a bar of ${MOST_PULLS} [measured 3,212-4,587 over five seed sets] — `
      + `levers that used to fire have stopped, and a lever that cannot pull is a trap rather than a control (#219's `+"`rites`"+`, #259's `+"`solvent`"+`). Run `+"`node test/probes/player.mjs 96 420 6`"+` for which`);

  /* 3 — the two routes to a counter the suite reads as zero */
  lines.push(`d.honoured: reference ${ref.honoured} · munus ${munus.honoured} (staged ${munus.fired.staged||0}) · bury ${bury.honoured} (games ${bury.fired["buried:games"]||0}, rites ${bury.fired["buried:rite"]||0}) · all seventeen ${most.honoured} [five sets: 0 / 245-273 / 165-247 / 99-199]`);
  if(ref.honoured !== 0)
    bad.push(`the reference player honoured ${ref.honoured} of its dead — it has never honoured one, and #261 is written on that zero`);
  if(!(munus.honoured >= MUNUS_HONOUR))
    bad.push(`staging a funeral munus reached honoured ${munus.honoured} against a bar of ${MUNUS_HONOUR} [measured 245-273] — `
      + "`stageMunus`" + `'s honoursDead branch is one of the only two writers of `+"`d.honoured`"+`, and the `+"`munera`"+` feat (45 fame, the order perk) needs three`);
  if(!(bury.honoured >= BURY_HONOUR))
    bad.push(`burying the dead reached honoured ${bury.honoured} against a bar of ${BURY_HONOUR} [measured 165-247] — `
      + "`holdMunera`" + ` is the other writer, and the `+"`bury`"+` lever exists because nothing in this suite had ever called it`);
  if(!(most.honoured >= MOST_HONOUR))
    bad.push(`the complete player honoured ${most.honoured} against a bar of ${MOST_HONOUR} [measured 99-199]`);

  /* 4 — and the lender takes the house's life */
  const ratio = ref.weeks ? loan.weeks / ref.weeks : 1;
  lines.push(`the lender alone: ${loan.weeks} house-weeks against the reference's ${ref.weeks} (${(100*ratio).toFixed(0)}%) · borrowed ${loan.fired.borrowed||0}, cleared ${loan.fired.cleared||0} · fame p50 ${loan.fameP50} against ${ref.fameP50} · census rung p50 ${loan.riseP50} against ${ref.riseP50} · ${loan.alive} alive against ${ref.alive} [five sets: 26%, 31%, 66%, 59%, 45% of the reference's weeks, fame 8-47% of it, and 0 alive in every one]`);
  if(!(loan.fired.borrowed > 0))
    bad.push(`the lender arm never borrowed — `+"`loan:\"murena\"`"+` is the rope's only borrowing policy and three probes run it (`+"`credit`, `fuse`, `standing`"+`), `
      + `so if it has stopped firing they are all measuring the default rope under another name`);
  if(!(ratio <= LOAN_SHORTER))
    bad.push(`a house that borrows lived ${(100*ratio).toFixed(0)}% of the reference's weeks against a bar of ${100*LOAN_SHORTER}% [measured 26-66% over five seed sets] — `
      + `the lender has stopped being the one door that costs a house its life, and every check that passes `+"`loan:`"+` should be re-read against the reference rather than beside it`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
