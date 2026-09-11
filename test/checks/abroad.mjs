/* WHY THE ROAD IS WORTH MORE — #263's verify-first, and the answer is none of the three things it
   proposed.

   (`abroad` was free in BOTH directories; checked before writing, in checks and probes.)

   v3.254.0 found `tour` worth 8 of 8 paired seed sets richer, a median gold p50 of 11,283 against
   181. #263 asked where a fix would go: is the money in the GOING (town purses, `BAY_DECAY`) or in
   the NOT RETURNING (Capua's own draw underpriced)? `probes/capua.mjs` splits every week of six
   policies by where the house was standing. The answer is neither, and two of the three candidate
   levers were ruled out by controls rather than by argument.

   NOT CAPUA'S DRAW — THAT WAS THE SPENDING. The first cut read the reference earning **-39.8d a
   week standing in Capua** against +250.5 in a town and nearly published "the home city is a cost
   centre". Capua is also where every denarius is SPENT: a house on the road cannot build a room,
   hire a cook or throw a party. With the spending taken out — buy, build, folk, staff, gear, party
   and doctore all off — Capua pays **+144.8d a week** and is perfectly solvent. The probe's own
   header had written that confound down before the run; it still nearly went out as a finding.

   NOT FRESHNESS. Both the reference and the tourer are out of Capua; only the tourer keeps moving
   to stay inside `STAY_FRESH`. Spending arms put their away weeks at 250.5 against 496.0, which
   looks like freshness paying double. With the spending out it is **523.5 against 541.2** — three
   per cent. Moving on every time buys almost nothing over leaving when the welcome wears.

   AND THE FADE IS NOT BROKEN EITHER, which is the control that took the third lever away. `stay` —
   go once, to the town that knows you least, and never move again — is the only policy in this
   harness that eats `BAY_DECAY`, and it earns **187.5d a week away against a mover's 523.5**, on
   63 bouts a hundred weeks against 88. The brake the game built for the emigrant works.

   SO IT IS THE RATIO OF WEEKS, AND THE SOURCE SAYS SO ON PURPOSE. A town week pays 2.4x-3.1x a
   Capua week at the same bout rate — the per-BOUT ratio is 2.35x-2.98x, tracking it almost exactly,
   so it is the size of the purse and not the number of cards. The reference spends 3.5-6.5% of its
   weeks away and a deliberate tourer spends 68.5%. That ratio is the entire sixtyfold gap.
   And `src` line 14140 states the intent in as many words: *"Capua's patrons neither ask nor credit
   wants while you are down the bay ... A TOUR IS UNTOUCHED; AN EMIGRATION BLEEDS."* The nomad
   paying nothing is the design, carried out exactly. What the measurement adds is that "untouched"
   has no ceiling, and a house can spend two thirds of its life collecting the untouched rate.

   NOTHING IS REBALANCED HERE. Putting a ceiling on it is a new brake on a behaviour the source
   deliberately left free, it would re-base every figure in this project at once, and
   `checks/tour.mjs` is written to go red when the gap closes. That is a decision to take on its own
   release, the way #245 took the die's weighting, and it is left in the roadmap with these numbers.
   This file holds the three measurements it would have to start from.

   TWO ARMS, THREE CLAIMS. */
import { installRope } from "../harness.mjs";

export const name = "abroad";
export const describe = "a town week pays multiples of a Capua week at the same bout rate, the fade prices the emigrant, and the reference player stays home";

const HOUSES = 16, WEEKS = 420;
/* every discretionary purchase off, so the coin below is earnings and not the choice to spend */
const THRIFT = { buy:false, build:false, folk:false, staff:false, gear:false, party:false, doctore:false };

/* ---- MEASURED AT THIS EXACT FRAME ON FIVE SEED SETS ----
     seed set        capua/wk  away/wk  ratio   capua/bout  away/bout  ratio   away%   resident/mover
     ABROADCHK          142.6    430.5   3.02          168        501   2.98    4.2%            0.47
     ABROADCHK-B        143.9    411.9   2.86          171        486   2.84    5.0%            0.56
     ABROADCHK-C        148.5    374.4   2.52          176        435   2.48    3.5%            0.52
     ABROADCHK-D        153.4    372.2   2.43          183        429   2.35    4.8%            0.51
     ABROADCHK-E        153.4    467.3   3.05          181        514   2.84    6.5%            0.44 */
const AWAY_MULT = 1.8;        /* a town week over a Capua week; measured 2.43-3.05 */
const FADE_MAX  = 0.75;       /* the resident's away week over a mover's; measured 0.44-0.56 */
const HOME_SHARE = 0.15;      /* the reference's share of weeks away; measured 3.5-6.5% */

export async function run({ p }){
  const lines = [], bad = [];
  await installRope(p);

  const r = await p.evaluate(([H, W, THRIFT])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","welcomeOf","knownIn","CITY_KEYS","setOut"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function")
      return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };

    const arm = (o) => {
      const at = { capua:{w:0,g:0,b:0}, away:{w:0,g:0,b:0} };
      let weeks = 0;
      for(let i=0;i<H;i++){
        const d = A.newGameState("Ab","clean",`ABROADCHK-${i}`);
        for(let w=0;w<W;w++){
          if(d.over) break;
          /* Rome and the travelling weeks are neither, and are left out rather than folded into
             one side — a week on the road to a town is not a week in the town */
          const where = (d.rome || d.travel) ? null : d.city ? "away" : "capua";
          const g0 = d.gold;
          let did=null; try{ did = R.lanista(d, o); }catch(e){ break; }
          weeks++;
          if(where){ const b = at[where]; b.w++; b.g += d.gold - g0;
            if(did && typeof did.bout === "number") b.b += did.bout; }
        }
      }
      const per = k => at[k].w ? at[k].g/at[k].w : 0;
      const bout = k => at[k].b ? at[k].g/at[k].b : 0;
      return { at, weeks, capW:per("capua"), awyW:per("away"),
        capB:bout("capua"), awyB:bout("away"),
        capRate: at.capua.w ? at.capua.b/at.capua.w : 0,
        awyRate: at.away.w ? at.away.b/at.away.w : 0,
        awayShare: weeks ? at.away.w/weeks : 0 };
    };
    return { ref:arm(Object.assign({}, THRIFT)), stay:arm(Object.assign({stay:true}, THRIFT)) };
  }, [HOUSES, WEEKS, THRIFT]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { ref, stay } = r;
  const mult = ref.capW > 0 ? ref.awyW/ref.capW : 0;
  const multB = ref.capB > 0 ? ref.awyB/ref.capB : 0;
  const fade = ref.awyW > 0 ? stay.awyW/ref.awyW : 1;

  /* 1 — the town pays multiples, and it is the purse and not the card count */
  lines.push(`${HOUSES} houses to week ${WEEKS}, spending nothing: Capua ${ref.capW.toFixed(1)}d a week over ${(100*ref.capRate).toFixed(0)} bouts a hundred weeks · a town ${ref.awyW.toFixed(1)}d over ${(100*ref.awyRate).toFixed(0)} — ${mult.toFixed(2)}x the week and ${multB.toFixed(2)}x the bout [five sets: 2.43-3.05 and 2.35-2.98]`);
  if(!(mult >= AWAY_MULT))
    bad.push(`a town week was worth ${mult.toFixed(2)}x a Capua week against a bar of ${AWAY_MULT} (${ref.capW.toFixed(1)}d against ${ref.awyW.toFixed(1)}d) `
      + `[measured 2.43-3.05] — #263 rests on the road paying multiples of the yard, and `+"`checks/tour.mjs`"+`'s sixtyfold coin gap is this ratio times the share of weeks away`);
  if(ref.capW <= 0)
    bad.push(`a house that spends nothing still lost ${ref.capW.toFixed(1)}d a week standing in Capua — the home city has become a cost centre even with every purchase switched off, `
      + `which is the reading v3.256.0 measured and REJECTED as an artefact of the spending`);

  /* 2 — and the fade prices the emigrant */
  lines.push(`the resident (goes once, never moves): ${stay.awyW.toFixed(1)}d a week away over ${(100*stay.awyRate).toFixed(0)} bouts a hundred weeks, ${(100*fade).toFixed(0)}% of a mover's [five sets: 44-56%]`);
  if(!(fade <= FADE_MAX))
    bad.push(`a house that went once and never moved earned ${(100*fade).toFixed(0)}% of what a mover earns away, against a bar of ${100*FADE_MAX}% [measured 44-56%] — `
      + "`BAY_DECAY`" + ` and the welcome are the game's brake on an emigration and #263 was closed partly on them working; if they have stopped biting, the road has no brake at all`);

  /* 3 — and the reference stays home, which is why every figure here is a stay-at-home figure */
  lines.push(`the reference spent ${(100*ref.awayShare).toFixed(1)}% of its weeks in a town [five sets: 3.5-6.5%; a deliberate tourer spends 68.5%, and that ratio is the whole of the gap]`);
  if(!(ref.awayShare <= HOME_SHARE))
    bad.push(`the reference player spent ${(100*ref.awayShare).toFixed(1)}% of its weeks away against a bar of ${100*HOME_SHARE}% [measured 3.5-6.5%] — `
      + `every coin figure this project publishes is a stay-at-home figure (v3.254.0), and that stops being true here first`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
