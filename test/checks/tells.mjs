/* EVERY TELL CAN FIRE, AND NONE OF THEM FIRES ON EVERYBODY

   A tell is the whole of what the player buys when he pays to scout a man: nine readings, each
   naming one of five plans, and `planEffect` pays +2.7% power for naming the right one and -3.0%
   for the wrong one. A tell that cannot fire is a reading the player paid for and will never see.
   A tell that fires on everyone hands the plan away free and is not a reading either.

   BOTH FAILURES HAVE ALREADY HAPPENED IN THIS GAME AND NOTHING COULD TELL.

   `cold` read `formOf(o) <= -30`, and `form` is only ever written on your own men — `formShift` is
   called from the bout resolutions and `formWeek` walks `d.gladiators`. It was 0 for every
   opponent a player will ever meet. **Zero firings in the game's entire history**, and it was
   found by reading the source rather than by anything failing. That is #206.

   `veteran` went the other way. Its own note records it: at `wins>=9` it "fired on practically
   everyone the bay ever put up, which handed the plan away free". It was re-banded to `>=14` plus
   a build term, by hand, with nothing holding it there since.

   SO THIS HOLDS EVERY TELL INSIDE A BAND, on the men a player is actually shown. It walks real
   houses week by week with the rope and reads `d.games.offers` — the card itself — rather than
   generating opponents directly, because what matters is the population the game PUTS IN FRONT OF
   HIM, not the one it can make. A generated man and a man out of a rival house are different
   populations and only one of them is on the card.

   THE BAND IS DELIBERATELY WIDE. This is not a balance check and it must not become one: it fails
   only on dead writing and on a giveaway, so re-pitching a tell stays a design decision and does
   not need this file edited. FLOOR is 1% — under that a player can play a whole game and never see
   it. CEIL is 80% — over that it is not intelligence about a man, it is a constant.
*/
import { installRope } from "../harness.mjs";

export const name = "tells";
export const describe = "every tell can fire, and none of them fires on everybody";

const FLOOR = 0.01, CEIL = 0.80;
/* ---- THE HORIZON IS PART OF THE INSTRUMENT, AND THE FIRST RUN GOT IT WRONG ----
   At 260 weeks this reported `veteran` at 0.9% and called it dead. It is not dead, it is LATE:
   its gate is `wins>=14` and only 3.8% of the men a mature house is offered have ever got there,
   while a young one is shown nobody who has. Measured across the eras (`probes/cold.mjs`), wins on
   the card run 0-2 21.6% · 3-5 33.5% · 6-8 27.7% · 9-10 7.2% · 11-13 6.3% · 14+ 3.8% — so a tell
   pitched at the top of a career is genuinely rare and SHOULD be, and a horizon that stops before
   any house gets there measures the horizon rather than the tell.

   The temptation was to re-band `veteran` until this file went green, which would be fitting the
   game to the test. The run goes long enough to contain the population the tell is about instead. */
const HOUSES = 6, WEEKS = 440;

export async function run({ p, errors }){
  const bad = [], lines = [];
  await installRope(p);

  const out = await p.evaluate(([H,W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    if(!A.TELLS || !A.TELL_KEYS) return { missing:true };
    const fired = {}; for(const k of A.TELL_KEYS) fired[k] = 0;
    const threw = {};
    let offers = 0, houses = 0, weeks = 0;
    const spread = [], vetSpread = [];   /* max stat minus min, per man on the card */
    for(let h=0; h<H; h++){
      const d = A.newGameState("T"+h, "clean", `TELLS-${h}`, null);
      houses++;
      for(let w=0; w<W; w++){
        if(d.over) break;
        R.lanista(d);
        if(d.over) break;
        weeks++;
        for(const off of ((d.games && d.games.offers) || [])){
          const o = off.opp; if(!o) continue;
          offers++;
          /* ---- AND WHETHER THE MAN STILL HAS A SHAPE ----
             Added in v3.168.0, after this file went red for a reason it could not name. `veteran`
             wants `o.end - statMean(o) >= 1` — a man BUILT to last — and it had fallen to 0.32% of
             offers. The population was fine: 125 offers carried fourteen wins or more. 118 of them
             failed on that one clause, because a rival house's growth loop climbed every stat
             toward the SAME ceiling, so its long-serving men saturated into six identical numbers —
             99/99/99/99/99/99, 97.86825 six times — and a man who is one number repeated cannot be
             built for anything. It got worse the longer houses lived, so every release that made
             the game kinder pushed this file nearer the floor and told nobody why.
             The spread is measured here now, so the next time it collapses this check says so. */
          const vals = A.STATS.map(k=>+o[k]||0);
          spread.push(+(Math.max(...vals) - Math.min(...vals)).toFixed(1));
          if((o.wins||0) >= 14) vetSpread.push(spread[spread.length-1]);
          for(const k of A.TELL_KEYS){
            try { if(A.TELLS[k].when(o)) fired[k]++; }
            catch(e){ threw[k] = (threw[k]||0) + 1; }
          }
        }
      }
    }
    const q = a => { if(!a.length) return null; const z=a.slice().sort((x,y)=>x-y);
      return { n:z.length, p10:z[Math.floor(z.length*.1)], p50:z[Math.floor(z.length*.5)],
        flat:+(a.filter(v=>v < 1).length/a.length*100).toFixed(1) }; };
    return { fired, threw, offers, houses, weeks, keys:A.TELL_KEYS,
             spread:q(spread), vetSpread:q(vetSpread),
             plans: Object.fromEntries(A.TELL_KEYS.map(k=>[k, A.TELLS[k].plan])) };
  }, [HOUSES, WEEKS]);

  if(!out || out.missing) return { pass:false, why:"__LVDVS does not export TELLS", lines };
  /* a run that saw no offers proves nothing about any tell — say so rather than passing nine of
     nine on a denominator of zero, which is the shape of vacuity this suite has been bitten by */
  if(out.offers < 200)
    return { pass:false, lines,
      why:`only ${out.offers} offers came up over ${out.weeks} weeks — too few to say anything about any tell` };

  lines.push(`${out.offers.toLocaleString()} offers on the card, over ${out.houses} houses and ${out.weeks.toLocaleString()} weeks`);
  const rows = out.keys.map(k=>({ k, n:out.fired[k], r:out.fired[k]/out.offers, plan:out.plans[k] }))
    .sort((a,b)=>a.r-b.r);
  for(const r of rows)
    lines.push(`  ${r.k.padEnd(8)} ${String(r.n).padStart(5)}  ${(r.r*100).toFixed(1).padStart(5)}%  -> ${r.plan}`
      + (r.r < FLOOR ? "   <-- never seen" : r.r > CEIL ? "   <-- fires on everybody" : ""));

  for(const k of Object.keys(out.threw||{}))
    bad.push(`${k}'s when() threw on ${out.threw[k]} opponents — a tell that errors is a tell that is off`);
  for(const r of rows){
    if(r.r < FLOOR)
      bad.push(`${r.k} fired ${r.n} time${r.n===1?"":"s"} in ${out.offers.toLocaleString()} offers `
        + `(${(r.r*100).toFixed(2)}%) — a player can pay to scout every man he is ever shown and never see it, `
        + `so the reading is written, read, and dead`);
    if(r.r > CEIL)
      bad.push(`${r.k} fired on ${(r.r*100).toFixed(1)}% of every man offered — it names ${r.plan} for `
        + `practically everybody, which hands the plan away free and is not intelligence about anyone`);
  }
  /* ---- AND THE MEN ON THE CARD ARE STILL MEN ----
     A dead tell has two possible causes and this file could only ever report one of them. The
     spread is `max stat - min stat` on each opponent offered: a real man is a shape, and a man
     whose six stats are one number is a rival house's growth loop having climbed all of them into
     the same ceiling. `veteran` is the tell that dies of it first — it asks for endurance above the
     man's own mean, which a flat man can never have — but `strong`, `quick`, `tires` and `reach`
     all read one stat against another and all of them go quiet together. */
  const sp = out.spread, vsp = out.vetSpread;
  if(sp) lines.push(`  the men themselves: stat spread p10 ${sp.p10} · median ${sp.p50} · ${sp.flat}% are one `
    + `number repeated` + (vsp ? `  ·  at 14+ wins, median ${vsp.p50} and ${vsp.flat}% flat (${vsp.n})` : ""));
  if(!sp) bad.push(`no opponent's stats were read, so the arm that checks they are still shapes measured nothing`);
  else {
    if(sp.flat > 12)
      bad.push(`${sp.flat}% of the men on the card have six identical stats — a rival house's growth loop `
        + `climbs every stat toward one ceiling, and a man who is one number repeated is not somebody a `
        + `reading can be about. It was 0% at v3.168.0 and it is what killed \`veteran\``);
    if(vsp && vsp.n >= 20 && vsp.flat > 30)
      bad.push(`${vsp.flat}% of the men with fourteen wins or more are one number repeated — the veterans `
        + `flatten first, because they have trained longest, and they are the exact population the `
        + `\`veteran\` reading is about`);
  }
  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`all ${out.keys.length} tells fire, none of them on everybody, and the men are still shapes`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
