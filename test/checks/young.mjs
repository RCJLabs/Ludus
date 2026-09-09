/* THE YOUNG HOUSE THAT TIPS — #247's last leftover, measured and declined.

   (`young` was free in BOTH directories; checked before writing, in checks and probes.)

   #247 left two things open. The locked floor was priced and declined at v3.246.0; this is the
   other — *"the young house's death at week 25-41, which is this item's original phase 2 under a
   different diagnosis"*, 76.9% coverable against a built house's 100%.

   THREE THINGS WERE ALREADY ANSWERED, so this does not re-ask them: being poor early does not
   predict death (phase 1, and `probes/opening.mjs` puts the week-8 discriminant at 54.0 on 100
   where 50 knows nothing); an EARLIER ALARM is not worth building (closed v3.228.0 — four
   candidates scored 4.8-9.3% precision against the money row's 19.3%, and arm 6 of
   `checks/cliff.mjs` guards it); and there is no locked floor to shed on a bare house anyway.

   SO THE QUESTION IS WHETHER THE DEATH IS ANSWERABLE AT ALL — #247b's shape, which answered yes for
   the rising. Measured on identical seeds with the rope's own levers as the restraint
   (`probes/young.mjs`, 128 x 120 on THREE seed prefixes, 384 houses an arm):

     ref      the rope as it plays              42/384 = 10.9% die of debt by week 60 · 259 alive
     nobuy    never buys a man                   23/384 =  6.0%                        · 309 alive
     nobuild  never puts up a room               41/384 = 10.7%  (all but identical: not a cost)
     thrift   buys nothing at all, from week one   9/384 =  2.3%                        · 342 alive

   THREE PREFIXES BECAUSE ONE WOULD NOT HAVE DONE. The first cut of this check ran a fourth prefix
   at 96 houses and read 7 against 6 — a ratio of 0.86 where the pooled figure is 0.21 — and would
   have failed a bar set from a single seed set on a build where nothing is wrong. The per-prefix
   ratios are 0.16, 0.33 and 0.18; the SURVIVAL gap (259 to 342, and 61 to 83 on that fourth set) is
   the half of the claim that is steady at any sample this check can afford, so that is the half it
   asserts and the death ratio is reported beside it.

   SO IT IS ANSWERABLE, AND ONLY IN ADVANCE. The young dead hear the money row — 100% of them, first
   at a median of week 18, six red weeks each, dying at a median of week 32 — and they die short a
   median of 207d with 312d of sellable men standing in the yard. But the rope BUYS NOTHING while
   that row is red: 0 men over 128 houses in every arm. The reserve rule is already a solvency rule
   at the moment it matters. What kills them is the roster they committed to before the alarm, which
   is why `probes/opening.mjs` found the discriminant on the MEN and not the box: the men are the
   bill.

   THERE IS THEREFORE NOTHING TO BUILD. Not an alarm, not a floor door, and not a spending brake —
   the brake is on. The lever is "buy fewer men early", which the game already offers and prices.

   AND THE HYPOTHESIS THIS AROSE FROM WAS FALSE, which is worth more than the conclusion. The first
   cut of the probe reported "69.2% of the young dead took another man after the row spoke, at up to
   2,300 denarii" and it was two label faults stacked: a man ARRIVING counts `bargain`, `auctoratus`
   and a damnatio, none of which the rope chose, and "after the row first spoke" counts the quiet
   weeks between red runs. Corrected, purchases on red weeks are ZERO. A lever built to stop them
   came back byte-identical — twice — which is what gave it away both times.

   FIVE ARMS. */
import { installRope } from "../harness.mjs";

export const name = "young";
export const describe = "the young house's death is answerable in advance, and the rope already buys nothing while the row is red";

const HOUSES = 96, WEEKS = 120, CUT = 60;
/* the bars are set well inside the measured figures, because this is a difficulty statement and
   must not become a balance check — it fails on the claim changing, not on the number moving */
const REF_FLOOR = 0.03;   /* measured 10.2% — under 3% the young death has gone and the item is moot */
/* ---- AND THE RESTRAINT ARM ASSERTS THE HALF THAT IS STEADY ----
   Two bars were tried here and both were the fault `checks/tells.mjs` and `checks/cells.mjs` met
   this same stretch — a bar too tight for the sample under it. First "thrift under 6%" at 48
   houses, which read 4.2%, one death from failing on a correct build. Then a ratio bar of 0.6,
   which read 0.86 at 96 houses on a seed set whose pooled sibling reads 0.21. The young-death COUNT
   is 2 to 6 events at any sample this check can afford; the SURVIVAL gap is 20-30 houses and moves
   the same way on all four seed sets measured. So survival is asserted, direction is asserted, and
   the ratio is reported with the pooled figure beside it. */
const ALIVE_GAIN = 8;    /* measured 259 -> 342 over 384 houses, and 61 -> 83 over 96 */

export async function run({ p }){
  const lines = [], bad = [];
  await installRope(p);

  const r = await p.evaluate(([H, W, CUT])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","activeG","weeklyBill","liquidate","moneyRow","creditLine"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function")
      return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
      const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
      return { n:a.length, p50:at(.5), p90:at(.9) }; };

    const arm = (o) => {
      const rows = [];
      for(let i=0;i<H;i++){
        const d = A.newGameState("Yg", "clean", `YOUNGCHK-${i}`);
        let everRed = false, redWeeks = 0, boughtWhileRed = 0, lastRed = null;
        for(let w=0; w<W; w++){
          if(d.over) break;
          let row = null; try { row = A.moneyRow(d); } catch(e){}
          if(row){ everRed = true; redWeeks++;
            lastRed = { gold:Math.round(d.gold), fund:Math.round(A.liquidate(d).total) }; }
          let did = null; try { did = R.lanista(d, o); } catch(e){ break; }
          if(row && did && did.bought) boughtWhileRed += did.bought;
        }
        rows.push({ kind: d.over ? d.over.kind : "alive", week:d.week,
          young: !!(d.over && d.over.kind === "debt" && d.week <= CUT),
          everRed, redWeeks, boughtWhileRed, lastRed,
          fund:Math.round(A.liquidate(d).total) });
      }
      const young = rows.filter(x=>x.young);
      return { n:rows.length, young:young.length, alive:rows.filter(x=>x.kind === "alive").length,
        boughtWhileRed: rows.reduce((n,x)=>n+x.boughtWhileRed, 0),
        heard: young.filter(x=>x.everRed).length,
        redWeeks: q(young.map(x=>x.redWeeks)),
        diedAt: q(young.map(x=>x.week)),
        shortAtRed: q(young.filter(x=>x.lastRed).map(x=>-x.lastRed.gold)),
        fundAtRed: q(young.filter(x=>x.lastRed).map(x=>x.lastRed.fund)),
        nothingLeft: young.filter(x=>x.fund < 100).length };
    };
    return { ref:arm({}), thrift:arm({ buy:false, build:false, folk:false, staff:false, doctore:false }) };
  }, [HOUSES, WEEKS, CUT]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { ref, thrift } = r;
  const pct = (a,b) => b ? (100*a/b).toFixed(1) : "0.0";

  /* 1 — the death exists at all */
  lines.push(`${ref.n} houses to week ${WEEKS}: ${ref.young} died of debt by week ${CUT} (${pct(ref.young,ref.n)}%) at ${ref.diedAt?`p50 week ${ref.diedAt.p50}`:"—"} · ${ref.alive} alive [pooled 42/384 = 10.9%, p50 week 32]`);
  if(!(ref.young / ref.n >= REF_FLOOR))
    bad.push(`only ${ref.young} of ${ref.n} houses died of debt inside ${CUT} weeks (${pct(ref.young,ref.n)}%) [measured 10.2%] — `
      + `the young death this item is about has gone, and the decline that rests on it should be re-read`);

  /* 2 — and it is answerable, in advance */
  lines.push(`thrift on the same seeds: ${thrift.young} young debt deaths (${pct(thrift.young,thrift.n)}%) and ${thrift.alive} alive against ${ref.alive} [pooled 9/384 = 2.3% against 10.9%, 342 alive against 259]`);
  lines.push(`   the death ratio here is ${ref.young ? (thrift.young/ref.young).toFixed(2) : "—"} [pooled 0.21 over three prefixes: 0.16, 0.33, 0.18 — reported, not asserted, at 2-6 events]`);
  if(!(thrift.alive >= ref.alive + ALIVE_GAIN))
    bad.push(`a house that buys nothing at all left ${thrift.alive} standing against the reference player's ${ref.alive}, a gain of ${thrift.alive - ref.alive} against a bar of ${ALIVE_GAIN} `
      + `[measured 259 to 342 over 384 houses]. The young death was declined as ANSWERABLE IN ADVANCE, and restraint no longer answering it re-opens the item`);
  if(thrift.young > ref.young)
    bad.push(`thrift died young MORE often than the reference player (${thrift.young} against ${ref.young}) — the direction of the whole finding has reversed`);

  /* 3 — the house is told */
  lines.push(`the young dead heard the money row ${ref.heard}/${ref.young} times, ${ref.redWeeks?`p50 ${ref.redWeeks.p50} red weeks each`:"—"} [measured 100%, six weeks, first at week 18]`);
  if(ref.young && ref.heard < ref.young)
    bad.push(`${ref.young - ref.heard} of ${ref.young} houses died of debt inside ${CUT} weeks without the money row ever speaking — `
      + `v3.228.0 declined an earlier alarm on the row reaching 78-88% of these deaths, and this arm holds that ground`);

  /* 4 — and the brake is already on */
  lines.push(`men bought on a week the row was red: ${ref.boughtWhileRed} under the reference player, ${thrift.boughtWhileRed} under thrift [measured 0 over 384 houses in every arm]`);
  if(ref.boughtWhileRed > 0)
    bad.push(`the reference player bought ${ref.boughtWhileRed} men while its own money row was red — measured at ZERO over 128 houses, `
      + `and a `+"`solvent`"+` lever built to stop it came back byte-identical because there was nothing to stop. `
      + `If `+"`spare()`"+`'s reserve has stopped being a solvency rule at the moment it matters, every young-death figure in #247 is partly about the rope`);

  /* 5 — and what it had when it was told */
  if(ref.shortAtRed && ref.fundAtRed){
    lines.push(`at its last red week the young house was short p50 ${ref.shortAtRed.p50}d with p50 ${ref.fundAtRed.p50}d of sellable men [measured 207d against 312d] · by the week it dies, ${ref.nothingLeft} of ${ref.young} have under 100d left to sell`);
    if(!(ref.fundAtRed.p50 >= ref.shortAtRed.p50 * 0.6))
      bad.push(`the median young house was short ${ref.shortAtRed.p50}d with only ${ref.fundAtRed.p50}d on the table when the row last spoke `
        + `[measured 207d against 312d] — the sale no longer covers the shortfall, and "answerable" was the whole of the decline`);
  }

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
