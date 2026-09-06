/* THE BAY'S OWN STRONGBOX — #256 phase 1.

   (`checks/coffer.mjs` is free; `bay` and `purse` are both taken here. Checked before writing,
   because v3.210.0 overwrote two files that were not.)

   A rival house had no purse. `RIVAL_MOVES.buy/sell/retrain/doctore/tour` cost nothing, a rival
   "hires a doctore out of Ravenna at a price people are talking about" with no price, and every
   economic verb pointed at the bay was one-sided because only one side had an economy. It has one
   now: seeded from fame and stature, fed by the tier's appearance fee and purse from every card its
   men fight — the player's and the ones out of town — and spent on the men's keep, the standing, the
   doctore, the wagons and every move the table makes.

   FIVE ARMS. The first three are over seeded play; the last two are DRIVEN, because the ladder's
   lower rungs are rare by design and a rung nobody reaches is a rung nobody has tested.

   1 · EVERY HOUSE HAS ONE, AND IT MOVES. A purse on every rival, changing week to week, and not
       merely drifting one way: some houses richer and some poorer than they opened.
   2 · ON THE PLAYER'S OWN SCALE. The item's stated bar: the bay's median by era against the rope's
       ledger of 1,451 / 4,074 / 4,925 / 6,191. Measured 614 / 4,116 / 6,494 / 3,964 at
       `RIVAL_STANDING` 0.12; the arm holds the ORDER of magnitude, because a curve fitted tighter
       than that is a constant fitted to one seed.
   3 · AND IT IS FED BY THE CARD. Fighting a rival's man credits that house — the appearance fee
       every time, the purse as well when their man is the one who walks off.
   4 · THE LADDER, ALL THREE RUNGS, DRIVEN. A house under water with men to sell sells the least
       valuable of them; with two men and a doctore, the doctore goes; with neither and nothing
       coming in, it goes dark after `RIVAL_DARK` weeks and `endedAs` reads **broke** — a third
       ending beside `fond` and `broken`, which the bay's own sheet and its sale line both tell apart.
   5 · AND NOTHING HERE DRAWS. The whole of this feature is arithmetic: no `R()`, no `ri()`, no
       `pick()`. A rival economy that consumed the stream would re-phase every seeded fixture in the
       suite, so the week's purse tick must leave `rngGet()` exactly where it found it. */
import { found, clearAll, installRope } from "../harness.mjs";

const HOUSES = 12, WEEKS = 420;
const SCALE_LO = 0.2, SCALE_HI = 6;   /* the bay's median may sit between a fifth and six times his */

export const name = "coffer";
export const describe = "a rival house has a purse, on the player's own scale, and an empty one costs it a man before it costs it the yard";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"COFFER-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","rivalPurse","rivalPay","rivalPurseWeek","rivalShort","rivalFee",
                  "rivalWin","PURSE_SEED","RIVAL_DARK","closeHouse","rngGet","gladValue"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const q = a => { if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y);
      return { p10:s[Math.floor(.1*s.length)], p50:s[Math.floor(.5*s.length)], p90:s[Math.floor(.9*s.length)] }; };

    /* ---- 1, 2 and 3 over play ---- */
    const era = [[],[],[],[]], gold = [[],[],[],[]];
    let noPurse = 0, unseeded = 0, moved = 0, richer = 0, poorer = 0, lives = 0, dark = 0;
    for(let h=0; h<H; h++){
      const d = A.newGameState("Co"+h, "clean", `COFCHK-${h}`);
      const open = {}; for(const x of d.rivals) open[x.name] = A.rivalPurse(x);
      let last = {};
      for(let w=0; w<W; w++){
        if(d.over) break;
        const e = Math.min(3, Math.floor((d.week - 1) / (W / 4)));
        gold[e].push(Math.round(d.gold));
        for(const x of d.rivals){
          if(x.retired) continue;
          /* the field is null until first READ — `rivalPurse` seeds it lazily so that a save
             written before #256 does not open at nothing. What must hold is that the read always
             returns a real figure, not that the field was already there: the first draft counted
             `x.purse == null` before the read and flagged the lazy seed it exists to protect. */
          const now = A.rivalPurse(x);
          if(!Number.isFinite(now)) noPurse++;
          if(x.purse == null) unseeded++;
          era[e].push(now);
          if(last[x.name] != null && last[x.name] !== now) moved++;
          last[x.name] = now;
        }
        try { R.lanista(d); } catch(e2){ break; }
      }
      for(const x of d.rivals){ lives++;
        if(x.endedAs === "broke") dark++;
        const o = open[x.name]; if(o == null) continue;
        if(A.rivalPurse(x) > o) richer++; else if(A.rivalPurse(x) < o) poorer++; }
    }

    /* ---- 3, driven: the card pays the other side ---- */
    const card = (()=>{
      const d = A.newGameState("Cd", "clean", "COFCARD");
      const h = d.rivals[0]; const was = A.rivalPurse(h);
      A.rivalPay(h, A.rivalFee(h));                       /* showing a man */
      const afterFee = A.rivalPurse(h);
      A.rivalPay(h, A.rivalWin(h));                       /* and winning with him */
      return { fee: afterFee - was, win: A.rivalPurse(h) - afterFee };
    })();

    /* ---- 4, driven: the three rungs ---- */
    const rung = (()=>{
      const out = {};
      { const d = A.newGameState("R1", "clean", "COFR1"); const h = d.rivals[0];
        const men = h.fighters.length; h.purse = -500;
        A.rivalShort(d, h);
        out.sold = { was:men, now:h.fighters.length, purse:A.rivalPurse(h), retired:!!h.retired }; }
      { const d = A.newGameState("R2", "clean", "COFR2"); const h = d.rivals[0];
        h.fighters = h.fighters.slice(0, 2); h.doctore = true; h.purse = -500;
        A.rivalShort(d, h);
        out.doc = { doctore:!!h.doctore, men:h.fighters.length, retired:!!h.retired }; }
      { const d = A.newGameState("R3", "clean", "COFR3"); const h = d.rivals[0];
        h.fighters = h.fighters.slice(0, 2); h.doctore = false;
        let weeks = 0;
        for(let i=0; i<A.RIVAL_DARK + 4 && !h.retired; i++){ h.purse = -500; A.rivalShort(d, h); weeks++; }
        out.dark = { retired:!!h.retired, endedAs:h.endedAs || null, weeks, bar:A.RIVAL_DARK }; }
      return out;
    })();

    /* ---- 5, driven: the week's tick must not touch the stream ---- */
    const draws = (()=>{
      const d = A.newGameState("Rn", "clean", "COFRNG");
      for(let w=0; w<20; w++){ try { R.lanista(d); } catch(e2){ break; } }
      const before = A.rngGet();
      for(let i=0; i<50; i++) A.rivalPurseWeek(d);
      return { same: A.rngGet() === before, before, after: A.rngGet() };
    })();

    /* and a brand-new house — the one that buys a dark yard — must open with a real box too */
    const fresh = (()=>{ const d = A.newGameState("Fr", "clean", "COFFRESH");
      const h = d.rivals[0]; const seed = A.PURSE_SEED(h);
      return { seed, read: A.rivalPurse({ name:h.name, fame:h.fame }) }; })();
    return { era: era.map(a=>q(a)), gold: gold.map(a=>q(a)), noPurse, unseeded, fresh, moved, richer, poorer,
      lives, dark, card, rung, draws };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };

  const bay = r.era.map(x=>x ? x.p50 : null), mine = r.gold.map(x=>x ? x.p50 : null);
  lines.push(`${r.lives} rival lives · the bay's purse p50 by era ${bay.join(" / ")}`);
  lines.push(`  the player's own box on the same run ${mine.join(" / ")}`);
  lines.push(`  ${r.moved} weekly movements · ${r.richer} houses ended richer than they opened, ${r.poorer} poorer`
    + ` · ${r.dark} went dark broke`);

  /* 1 */
  lines.push(`  the purse read as a real figure on every one of them (${r.unseeded} seeded lazily on first read; `
    + `a fresh house opens at ${r.fresh.read}d against a seed of ${r.fresh.seed}d)`);
  if(r.noPurse) bad.push(`${r.noPurse} rival-weeks read a purse that was not a finite number`);
  if(!(r.fresh.read > 0) || r.fresh.read !== r.fresh.seed)
    bad.push(`a house that has never been read opens at ${r.fresh.read}d where \`PURSE_SEED\` says `
      + `${r.fresh.seed}d — the lazy seed is what gives a save written before #256 a box, and the `
      + `house that buys a dark yard its opening stake`);
  if(!r.moved) bad.push(`no rival purse changed in ${r.lives} lives — the strongbox is a field nobody moves`);
  if(!r.richer || !r.poorer)
    bad.push(`every rival ended ${r.richer ? "richer" : "poorer"} than it opened (${r.richer} up, ${r.poorer} down) — `
      + `a purse that only drifts one way is a counter, not an economy`);
  /* 2 */
  for(let e = 0; e < 4; e++){
    if(bay[e] == null || mine[e] == null || mine[e] <= 0) continue;
    const ratio = bay[e] / mine[e];
    if(ratio < SCALE_LO || ratio > SCALE_HI)
      bad.push(`in era ${e} the bay's median purse is ${bay[e]}d against the player's ${mine[e]}d — `
        + `${ratio.toFixed(1)}x, outside [${SCALE_LO}, ${SCALE_HI}]. #256's own verify-first is that the two `
        + `economies are the same size; charged only the men it read five times his, and `
        + `\`RIVAL_STANDING\` is the dial`);
  }
  /* 3 */
  lines.push(`  a card pays them ${r.card.fee}d for showing a man and ${r.card.win}d more when he wins`);
  if(!(r.card.fee > 0)) bad.push(`showing a man on the player's card pays a rival house nothing — the appearance fee is the other side of a bout the game already prices`);
  if(!(r.card.win > 0)) bad.push(`a rival's man winning on the player's card pays his house nothing`);
  /* 4 */
  const R1 = r.rung.sold, R2 = r.rung.doc, R3 = r.rung.dark;
  lines.push(`  the ladder: a house under water sold ${R1.was - R1.now} man (purse ${R1.purse}d) · `
    + `with two men it ${R2.doctore ? "KEPT" : "let go"} the doctore · with neither it went dark after `
    + `${R3.weeks} weeks (${R3.endedAs || "still standing"}, bar ${R3.bar})`);
  if(R1.now >= R1.was) bad.push(`a rival under water with ${R1.was} men sold none of them — the first rung of the ladder does not move`);
  if(R1.retired) bad.push(`a rival under water with men to sell went dark instead of selling one — the ladder skipped to its last rung`);
  if(R2.doctore) bad.push(`a rival under water with two men kept its doctore — the second rung does not move`);
  if(R2.retired) bad.push(`a rival with a doctore still to let go went dark first`);
  if(!R3.retired) bad.push(`a rival with two men, no doctore and nothing coming in never went dark in ${R3.weeks} weeks [bar ${R3.bar}]`);
  else if(R3.endedAs !== "broke") bad.push(`a rival that ran out of money ended as "${R3.endedAs}" — \`broke\` is its own ending, and the sale line and the bay's sheet both read it`);
  /* 5 */
  lines.push(`  and fifty weeks of purse ticks left the stream at ${r.draws.after} (${r.draws.same ? "unmoved" : "MOVED"})`);
  if(!r.draws.same)
    bad.push(`the weekly purse tick consumed the random stream (${r.draws.before} → ${r.draws.after}) — `
      + `every seeded fixture in this suite re-phases off that, and #256 was built to be arithmetic `
      + `for exactly this reason`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the bay has a strongbox, on his own scale, and an empty one costs a man before it costs the yard`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
