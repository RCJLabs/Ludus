/* THE BIGGEST LEVER IN THE GAME IS OFF BY DEFAULT — #260's sweep, and the coin half of it.

   (`tour` was free in BOTH directories; checked before writing, in checks and probes.)

   #260 phase 1 swept nineteen opt-in levers and found six that move a figure this project quotes.
   The largest by far was `tour` — break camp the week the welcome wears and go straight to whichever
   town knows the house least, never touching Capua — and it was published off one sweep. Swept
   properly, paired, sixteen houses to week 420 on EIGHT independent seed sets:

     ref  gold p50 per set    181, 84, 4271, 15, 1258, 46, 86, 1020      median    181
     tour gold p50 per set  8670, 11283, 147480, 59586, 10080, 140818, 7968, 10949   median 11,283

   **Eight of eight sets richer, by 7,882 to 143,209 denarii.** The reference spends 129-359 of its
   ~3,500 weeks out of Capua; the tourer spends 2,001-3,654 of ~4,000.

   ---- AND THE FAME HALF OF THAT CLAIM WAS THE PARTIES, v3.257.0 ----
   The same eight sets also read "8 of 8 higher on fame, by 263 to 9,096", and a bar was set on it.
   It was measuring a build in which `hostParty` had NO LOCATION GATE: a tourer threw 1,077-1,378
   parties a run, **87-96% of them while out of Capua**, each one worth `+p.fame` and +warm with
   every patron, on a villa two hundred miles behind it. #263 gated it — `patronWeek` already stops
   the patrons asking and decays their favour at 2.5x while the house is away, and its own note says
   *"attention cannot be paid from Puteoli"* — and re-measured on the same eight sets:

     gold   8 of 8 still richer, by 897 to 300,282 denarii — STRONGER, since the tourer no longer
            spends on parties it cannot throw
     fame   **6 of 8**, deltas -947, 0, +1,109, +3,124, +4,972, +5,801, +6,891, +7,283

   So the road pays in coin and NOT reliably in name, which is the trade the source describes. The
   fame bar is gone; the figure is reported. A claim that survives a change to the thing producing
   it was never about that thing, and this one did not survive.

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
     TOURCHK             961      10296   9335       3109       3119   1.00    10.2            0
     TOURCHK-B          -253      51911  52164       1356       6905   5.09    17.4            0
     TOURCHK-C          -301      24064  24365       2893       3943   1.36     8.1            0
     TOURCHK-D          -452     190247 190699       2321       9037   3.89    11.4            0
     TOURCHK-E            75     220114 220039       3356      10696   3.19    10.4            0

   (re-measured at v3.257.0 on the gated build; the pre-gate table it replaces had fame at
   2.49x-5.41x, which was the parties)

   THE COIN BAR IS AN ABSOLUTE GAP AND NOT A RATIO, which the first cut got wrong. The reference's
   gold p50 crosses zero — it is -282, -253, 10, 1708, 2042 over these five sets — so the ratio
   reads 6.3 on one set and 75,450 on the next and says nothing about either. The gap is 10,898 to
   75,703 and behaves. The ratio is still reported, because it is the shape of the finding, but
   nothing is asserted on it. */
const GOLD_GAP  = 3000;  /* tour's gold p50 over the reference's, in denarii; measured 9,335-220,039 */
const AWAY_MULT = 3.0;   /* weeks out of Capua; measured 8.1x-17.4x */
/* NO FAME BAR. It read 1.00x on one of the five sets above and 1.09 as a paired delta of ZERO on
   one of the eight — see the note at the top. Reported, never asserted. */

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
  lines.push(`${HOUSES} houses to week ${WEEKS}: the reference spent ${ref.away} of ${ref.weeks} weeks out of Capua and broke camp on purpose ${ref.setOuts} times · the tourer ${tour.away} of ${tour.weeks}, ${tour.setOuts} times [five sets: 8.1x-17.4x the weeks away, and the reference broke camp on purpose 0 times in every one]`);
  if(ref.setOuts > 0)
    bad.push(`the REFERENCE player called setOut ${ref.setOuts} times — \`tour\` is opt-in and \`road\` is the reactive half, `
      + `so if the default rope has started touring then every coin figure this project publishes has just changed meaning by about sixty-fold`);
  if(!(tour.setOuts > 0))
    bad.push(`the tour arm never broke camp — the lever has stopped firing and this check is measuring the reference twice`);
  if(!(rat(tour.away, ref.away) >= AWAY_MULT))
    bad.push(`the tourer spent only ${show(rat(tour.away, ref.away))}x the reference's weeks out of Capua against a bar of ${AWAY_MULT} [measured 8.1x-17.4x]`);

  /* 2 — and the road is worth about sixty times the coin */
  const gap = tour.goldP50 - ref.goldP50;
  const gm = rat(tour.goldP50, ref.goldP50), fm = rat(tour.fameP50, ref.fameP50);
  lines.push(`gold p50 ${ref.goldP50} → ${tour.goldP50} (a gap of ${gap}d; the ratio is ${show(gm)}x and is not asserted — see the note over the bars) · fund ${ref.fundP50} → ${tour.fundP50} · fame ${ref.fameP50} → ${tour.fameP50} (${show(fm)}x) · census rung ${ref.riseP50} → ${tour.riseP50} · ${ref.alive} alive → ${tour.alive}`);
  lines.push(`   [eight paired sets on the gated build: 8 of 8 richer by 897-300,282d, and fame only 6 of 8 — deltas -947, 0, +1,109, +3,124, +4,972, +5,801, +6,891, +7,283]`);
  if(!(gap >= GOLD_GAP))
    bad.push(`going on the road was worth only ${gap}d on the reference's gold p50 (${ref.goldP50} → ${tour.goldP50}) against a bar of ${GOLD_GAP}d `
      + `[measured 9,335-220,039 here, and 8 of 8 paired sets richer elsewhere] — the largest single lever #260 found has stopped being large, `
      + `and the coin figures this project publishes stop being conditioned on a house that stays home`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
