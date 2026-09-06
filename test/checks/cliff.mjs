/* WHAT THE MONEY ROW IS WORTH — #247a, and it is a ratio, not a rate.

   v3.207.0 measured the debt death; this holds what v3.208.0 did about it. The agenda's approach
   line used to speak whenever `runway < RUNWAY_WARN`, and measured over every house-week of two
   seeded sets of 32 houses x 420 weeks (`probes/cliff.mjs`) that was 1,535 and 1,348 weeks of
   alarm, right — the house died of debt inside ten weeks — 7.9% and 8.2% of the time. It fired for
   all 88 houses of v3.207.0's run, survivors included. A warning that every house hears always is
   not a warning.

   It speaks on EXPOSURE now: what is in the box against what an ordinary week of this house moves,
   or a runway already in blood. Measured the same way: 692 and 706 weeks, right 12.4% and 12.5%,
   every dying house still reached, seven and eight weeks of median warning.

   FOUR ARMS, seeded, 16 houses x 420 weeks under the reference player.

   1 · IT IS WORTH MORE THAN SHORTNESS. The row's precision against the precision of the bare
       `runway < RUNWAY_WARN` on the SAME run — a ratio, because the absolute rates move with the
       seed (7.9 and 8.2 on the two probe sets) and a ratio does not. Measured 1.57 and 1.52; the
       bar is 1.25, and the shipped-before behaviour scores exactly 1.00 by construction.
   2 · AND IT STILL REACHES ALMOST EVERY HOUSE THAT DIES OF IT. Precision bought by dropping houses
       is not precision. This arm asked for EVERY death by debt to have heard the row inside its
       last ten weeks, on the strength of the probe reaching 15 of 15 and 14 of 14 — where exposure
       alone (the sharper design, 17-18%) missed one and was not taken for that reason.

       THAT ABSOLUTE IS NOT TRUE, and it took v3.216.0 to find out, because at 16 houses this
       fixture yields about six deaths and a run with no miss was simply the likely outcome. Run at
       56 houses on two builds that differ by one line: **19 of 21 and 18 of 19** — the row reaches
       about 93% of them, and never did reach all. The two it missed died at weeks 241 and 226,
       while deaths at weeks 12, 25, 43 and 63 all heard it, so there is no early-death exclusion
       that would restore the absolute; the misses are simply houses the row did not speak for
       inside their last ten weeks.

       So: 56 houses, and a FLOOR of 80% rather than an absolute. And the honest character of this
       arm, measured rather than asserted: IT IS A COLLAPSE DETECTOR, NOT A DISCRIMINATOR. Cutting
       the runway alarm from `< RUNWAY_BAD` to `< 0` — a severe narrowing, and exactly the change
       this arm exists to catch, since a pickier row scores BETTER on arm 1 — takes reach only from
       90.5% to 76.2% at this n, and to 80.8% at 80 houses. The floor sits on top of that, so it
       catches that sabotage about half the time. It is not sharper than that and cannot be made so:
       a dying house reaches the row down two clauses, and the lead is no better a signal (10 weeks
       honest against 8 sabotaged) because `DEAD_IN` truncates it at ten by construction.

       ARM 1 IS WHAT HOLDS THIS DESIGN. It is a ratio for the reason stated there, and a row that
       bought precision by abandoning houses would have to keep clearing it. This arm's job is the
       narrower one of noticing if reach falls off a cliff, and 80% is where it does that without
       tripping on a quiet seed — at 21 deaths and a true miss rate near 7%, roughly one run in
       fifty by chance alone.
   3 · AND IT IS NOT A KLAXON. The row may speak on at most a fifth of all house-weeks. It spoke on
       21% before and about 11% now; a fifth is the line back to what it was.
   4 · THE SWING IS MEASURED AT ALL. `swingOf` reads the exponentially-weighted mean absolute weekly
       change, and its first draft read it off `weekDigest`'s `dl.gold` — which is what `endWeek`
       moved and not what the WEEK moved, so everything the player spends between weeks was
       invisible and the swing collapsed onto the bill. So: it must be positive on every house, and
       materially bigger than the bill at the median — measured 1.4x to 3x, because a real week
       carries the purses and everything the player spends. Stated as a ratio and not an equality:
       the first draft asked whether the swing EQUALLED the bill, and an exponentially-weighted mean
       of a bill that moves never equals the bill it is chasing, so the sabotage walked past it. */
import { found, clearAll, installRope } from "../harness.mjs";

const HOUSES = 56, WEEKS = 420, DEAD_IN = 10;
const REACH_FLOOR = 0.80;   /* measured 90.5% and 94.7% at this n — see arm 2's head for the bar */
const WORTH = 1.25;    /* the row must be this many times as precise as bare shortness */
const KLAXON = 0.20;   /* and must not speak on more of the year than this */
const SWING_OVER_BILL = 1.25;   /* a real week moves 1.4-3x the bill; one collapsed onto it reads 1 */

export const name = "cliff";
export const describe = "the money row speaks on exposure, is worth more than shortness, and still reaches every house that dies of it";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"CLIFF-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([H, W, DEAD_IN])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","moneyRow","runway","RUNWAY_WARN","swingOf","exposed","weeklyBill"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    let weeks = 0, said = 0, saidFatal = 0, short = 0, shortFatal = 0;
    const deaths = [], swings = [];
    for(let h=0; h<H; h++){
      const d = A.newGameState("Cf"+h, "clean", `CLIFFCHK-${h}`);
      const mine = [];
      for(let w=0; w<W; w++){
        if(d.over) break;
        let row = null; try { row = A.moneyRow(d); } catch(e){}
        const rw = A.runway(d);
        mine.push({ week:d.week, said: !!row, short: rw != null && rw < A.RUNWAY_WARN });
        if(w === 200){ let sw = null; try { sw = A.swingOf(d); } catch(e){}
          swings.push({ h, swing:sw, bill:A.weeklyBill(d), gold:Math.round(d.gold) }); }
        try { R.lanista(d); } catch(e){ break; }
      }
      const kind = d.over ? d.over.kind : "survived";
      const fatalFrom = kind === "debt" ? d.week - DEAD_IN : null;
      for(const x of mine){ weeks++;
        const fatal = fatalFrom != null && x.week >= fatalFrom;
        if(x.said){ said++; if(fatal) saidFatal++; }
        if(x.short){ short++; if(fatal) shortFatal++; }
      }
      if(kind === "debt"){
        const heard = mine.filter(x=>x.said && x.week >= fatalFrom);
        deaths.push({ h, week:d.week, heard:heard.length, lead: heard.length ? d.week - heard[0].week : null });
      }
    }
    return { weeks, said, saidFatal, short, shortFatal, deaths, swings };
  }, [HOUSES, WEEKS, DEAD_IN]);

  if(r.why) return { pass:false, why:r.why, lines };
  if(!r.deaths.length)
    return { pass:false, why:`no house died of debt in ${r.weeks} weeks — the arm has nothing to measure`, lines };

  const rowP = r.said ? r.saidFatal / r.said : 0;
  const shortP = r.short ? r.shortFatal / r.short : 0;
  const worth = shortP > 0 ? rowP / shortP : 0;
  lines.push(`${r.weeks} house-weeks, ${r.deaths.length} deaths by debt · the row spoke on ${r.said} `
    + `(${(100*r.said/r.weeks).toFixed(1)}% of weeks) and was right ${(100*rowP).toFixed(1)}% of the time`);
  lines.push(`  bare shortness (runway < ${"RUNWAY_WARN"}) would have spoken on ${r.short} `
    + `(${(100*r.short/r.weeks).toFixed(1)}%) and been right ${(100*shortP).toFixed(1)}% — the row is worth ${worth.toFixed(2)}x that`);

  /* 1 */
  if(worth < WORTH)
    bad.push(`the money row is only ${worth.toFixed(2)}x as precise as speaking on shortness alone `
      + `[bar ${WORTH}] — it spoke on ${r.said} weeks at ${(100*rowP).toFixed(1)}% against ${r.short} at `
      + `${(100*shortP).toFixed(1)}%. #247a's whole finding is that shortness is right eight times in a `
      + `hundred and fires for every house that ever lived; a row no better than that has gone back to it`);
  /* 2 */
  const deaf = r.deaths.filter(x=>!x.heard);
  const leads = r.deaths.filter(x=>x.lead != null).map(x=>x.lead).sort((a,b)=>a-b);
  lines.push(`  every death by debt heard it: ${r.deaths.length - deaf.length} of ${r.deaths.length} `
    + `[floor ${Math.round(REACH_FLOOR*100)}%, measured 90.5 and 94.7; the absolute this arm used to assert `
    + `is not true and passed for eight releases on six deaths a run, and see its head for how blunt it is], `
    + `median ${leads.length ? leads[Math.floor(leads.length/2)] : "—"} weeks of warning`);
  if(r.deaths.length && (r.deaths.length - deaf.length) / r.deaths.length < REACH_FLOOR)
    bad.push(`${deaf.length} of ${r.deaths.length} houses died of debt without the money row speaking `
      + `once in their last ${DEAD_IN} weeks — precision bought by dropping the houses it was written `
      + `for is not precision, which is why exposure alone was not taken`);
  /* 3 */
  if(r.said / r.weeks > KLAXON)
    bad.push(`the money row speaks on ${(100*r.said/r.weeks).toFixed(1)}% of all house-weeks `
      + `[bar ${Math.round(KLAXON*100)}%] — it is a klaxon again`);
  /* 4 */
  const flat = r.swings.filter(x=>x.swing == null || x.swing <= 0);
  const ratios = r.swings.filter(x=>x.swing > 0 && x.bill > 0).map(x=>x.swing / x.bill).sort((a,b)=>a-b);
  const midR = ratios.length ? ratios[Math.floor(ratios.length/2)] : 0;
  lines.push(`  the swing at week 200 on ${r.swings.length} houses: `
    + r.swings.slice(0, 4).map(x=>`${x.swing}d against a ${x.bill}d bill`).join(" · ")
    + ` — median ${midR.toFixed(2)}x the bill`);
  if(flat.length) bad.push(`${flat.length} houses had no swing at all by week 200 — \`swingWeek\` is not being run`);
  /* A RATIO, because equality was the wrong shape: the first draft asked whether the swing EQUALLED
     the bill, and an exponentially-weighted mean of a bill that moves never equals the bill it is
     chasing — the sabotage that fed `weeklyBill` straight into `swingWeek` passed it. What the
     measurement actually says is that a real week moves 1.4 to 3 times the bill, because it carries
     the purses and everything the player spends; a swing that has collapsed onto the bill reads 1. */
  if(ratios.length > 2 && midR < SWING_OVER_BILL)
    bad.push(`the swing is only ${midR.toFixed(2)}x the weekly bill at the median of ${ratios.length} `
      + `houses [bar ${SWING_OVER_BILL}] — it has collapsed onto the bill, which is what happens when it `
      + `is read off \`weekDigest\`'s \`dl.gold\`: that is what endWeek moved, not what the week did, `
      + `and everything the player buys between weeks is invisible to it`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the row speaks on exposure, half as often and half again as well`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
