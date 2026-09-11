/* THE BIGGEST LEVER IN THE GAME IS OFF BY DEFAULT — #260's sweep, and the coin half of it.

   (`tour` was free in BOTH directories; checked before writing, in checks and probes.)

   #260 phase 1 swept nineteen opt-in levers and found six that move a figure this project quotes.
   The largest by far was `tour` — break camp the week the welcome wears and go straight to whichever
   town knows the house least, never touching Capua — and it was published off one sweep. Swept
   properly, paired, sixteen houses to week 420 on EIGHT independent seed sets:

     ref  gold p50 per set    181, 84, 4271, 15, 1258, 46, 86, 1020      median    181
     tour gold p50 per set  8670, 11283, 147480, 59586, 10080, 140818, 7968, 10949   median 11,283

   **Eight of eight sets richer, by 7,882 to 143,209 denarii. Eight of eight higher on fame**, by 263
   to 9,096. Census rung 4-6 against 5-7. The reference spends 129-359 of its ~3,500 weeks out of
   Capua; the tourer spends 2,001-3,654 of ~4,000.

   SO EVERY COIN FIGURE THIS PROJECT PUBLISHES IS A STAY-AT-HOME FIGURE, and the gap is not a
   rounding matter — it is about sixty-fold at the median. `road` is on by default and is the
   REACTIVE half: take the invitation `bayCall` happens to send, come home when the welcome wears.
   `tour` is the same functions used on purpose. Both are ordinary player actions; one of them is
   worth sixty times the other and nothing in this suite has ever done it.

   WHAT IT COSTS IS CONTENT, NOT OUTCOME, which is the part worth arguing about rather than holding.
   From the survey diff at v3.252.0: a touring house sees `ludusNight` 179 -> 11, `feud.weeks`
   1,120 -> 348, `did.feast` 284 -> 12, `did.walk` 364 -> 8 and half the saga arcs. It is richer,
   more famous and higher-ranked, and it meets less of the game. Whether that is the intended reward
   for a committed strategy or a dominant line nobody priced is a design question and is left in the
   roadmap; this file holds the measurement it would have to start from.

   THE BAR IS THE DIRECTION AND AN ORDER OF MAGNITUDE, NOT THE NUMBER. Gold p50 is the most volatile
   statistic in this suite — the reference's own eight sets span 15 to 4,271 — so a bar on either
   arm alone would be worthless. The claim is the PAIRED gap on the same seeds, which was unanimous.

   TWO ARMS. */
import { installRope } from "../harness.mjs";

export const name = "tour";
export const describe = "the reference player stays home, and going on the road is worth about sixty times the coin";

const HOUSES = 16, WEEKS = 420;

/* ---- MEASURED AT THIS EXACT FRAME ON FIVE SEED SETS, not at the eight-set sweep's ----

     seed set      ref gold  tour gold    gap   ref fame  tour fame  xFame   xAway   ref setOut
     TOURCHK           1708      17403  15695       2900       7209   2.49     9.6            0
     TOURCHK-B         -253      75450  75703       1951      10549   5.41    12.8            0
     TOURCHK-C         2042      12940  10898       1637       6006   3.67     9.8            0
     TOURCHK-D           10      20073  20063       2289       7258   3.17    11.1            0
     TOURCHK-E         -282      46395  46677       3795      10831   2.85     9.5            0

   THE COIN BAR IS AN ABSOLUTE GAP AND NOT A RATIO, which the first cut got wrong. The reference's
   gold p50 crosses zero — it is -282, -253, 10, 1708, 2042 over these five sets — so the ratio
   reads 6.3 on one set and 75,450 on the next and says nothing about either. The gap is 10,898 to
   75,703 and behaves. The ratio is still reported, because it is the shape of the finding, but
   nothing is asserted on it. */
const GOLD_GAP  = 3000;  /* tour's gold p50 over the reference's, in denarii; measured 10,898-75,703 */
const FAME_MULT = 1.5;   /* tour's fame p50 over the reference's; measured 2.49x-5.41x */
const AWAY_MULT = 3.0;   /* weeks out of Capua; measured 9.5x-12.8x */

export async function run({ p }){
  const lines = [], bad = [];
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","liquidate","riseOf","setOut","welcomeOf"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function")
      return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    const med = a => { if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(0.5*s.length)]; };

    const arm = (o) => {
      const gold=[], fund=[], fame=[], rise=[];
      let weeks=0, away=0, alive=0, setOuts=0;
      for(let i=0;i<H;i++){
        const d = A.newGameState("To","clean",`TOURCHK-${i}`);
        for(let w=0;w<W;w++){
          if(d.over) break;
          let did=null; try{ did=R.lanista(d,o); }catch(e){ break; }
          weeks++;
          if(did && typeof did.setOut === "number") setOuts += did.setOut;
          /* out of Capua is `d.city` being set to somewhere else — the reference reaches this
             through `road` and `bayCall`, which is the point: it is not that it never travels */
          if(d.city && d.city !== "capua") away++;
        }
        let f=0; try{ f=A.liquidate(d).total; }catch(e){}
        gold.push(Math.round(d.gold)); fund.push(Math.round(f));
        fame.push(Math.round(d.fame||0)); rise.push(A.riseOf(d));
        if(!d.over) alive++;
      }
      return { weeks, away, alive, setOuts, goldP50:med(gold), fundP50:med(fund),
        fameP50:med(fame), riseP50:med(rise) };
    };
    return { ref:arm({}), tour:arm({ tour:true }) };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { ref, tour } = r;
  const rat = (a,b) => b > 0 ? a/b : (a > 0 ? Infinity : 1);
  const show = x => x === Infinity ? "∞" : x.toFixed(1);

  /* 1 — the reference stays home and the lever fires */
  lines.push(`${HOUSES} houses to week ${WEEKS}: the reference spent ${ref.away} of ${ref.weeks} weeks out of Capua and broke camp on purpose ${ref.setOuts} times · the tourer ${tour.away} of ${tour.weeks}, ${tour.setOuts} times [five sets: 9.5x-12.8x the weeks away, and the reference broke camp on purpose 0 times in every one]`);
  if(ref.setOuts > 0)
    bad.push(`the REFERENCE player called setOut ${ref.setOuts} times — \`tour\` is opt-in and \`road\` is the reactive half, `
      + `so if the default rope has started touring then every coin figure this project publishes has just changed meaning by about sixty-fold`);
  if(!(tour.setOuts > 0))
    bad.push(`the tour arm never broke camp — the lever has stopped firing and this check is measuring the reference twice`);
  if(!(rat(tour.away, ref.away) >= AWAY_MULT))
    bad.push(`the tourer spent only ${show(rat(tour.away, ref.away))}x the reference's weeks out of Capua against a bar of ${AWAY_MULT} [measured 9.5x-12.8x]`);

  /* 2 — and the road is worth about sixty times the coin */
  const gap = tour.goldP50 - ref.goldP50;
  const gm = rat(tour.goldP50, ref.goldP50), fm = rat(tour.fameP50, ref.fameP50);
  lines.push(`gold p50 ${ref.goldP50} → ${tour.goldP50} (a gap of ${gap}d; the ratio is ${show(gm)}x and is not asserted — see the note over the bars) · fund ${ref.fundP50} → ${tour.fundP50} · fame ${ref.fameP50} → ${tour.fameP50} (${show(fm)}x) · census rung ${ref.riseP50} → ${tour.riseP50} · ${ref.alive} alive → ${tour.alive}`);
  lines.push(`   [eight paired sets: 8 of 8 richer by 7,882-143,209d, 8 of 8 higher on fame by 263-9,096, ref gold p50 median 181 against the tourer's 11,283]`);
  if(!(gap >= GOLD_GAP))
    bad.push(`going on the road was worth only ${gap}d on the reference's gold p50 (${ref.goldP50} → ${tour.goldP50}) against a bar of ${GOLD_GAP}d `
      + `[measured 10,898-75,703 here, and 8 of 8 paired sets richer elsewhere] — the largest single lever #260 found has stopped being large, `
      + `and the coin figures this project publishes stop being conditioned on a house that stays home`);
  if(!(fm >= FAME_MULT))
    bad.push(`the tourer's fame p50 was ${show(fm)}x the reference's (${ref.fameP50} → ${tour.fameP50}) against a bar of ${FAME_MULT} [measured 2.49x-5.41x] — `
      + `the road paid in coin but not in name, which is not the trade #260 measured`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
