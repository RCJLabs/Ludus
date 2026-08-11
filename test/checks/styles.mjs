/* SIX CLASSES, AND THE 1.8x SPREAD THAT WAS THE INSTRUMENT EVERY TIME.

   The v2.93.0 sweep reported wins per man-week at Dimachaerus 0.167 and Thraex 0.160 against Murmillo
   0.094 and Hoplomachus 0.113, and put "the classes are 1.8x apart" on the audit list. That figure is
   not normalised by bouts fought, so it mixes together who gets picked for a card, who comes back fit
   enough to be picked again, and who wins the bout he is in. Only the last is a balance claim, and
   measured on its own it is not 1.8x.

   THE MATCHUP TABLE IS EXACTLY NEUTRAL, BY CONSTRUCTION. `COUNTERS` is a six-cycle and `CLS_EDGE` pays
   1.15 for the counter and 0.91 against it, so over a uniform mix every class meets exactly one it
   counters and one that counters it: the mean edge is **1.010 for all six**, and with one identical kit
   `winChance` gives every class the same row average to the second decimal — **spread 0.00 points**.

   THREE MEASUREMENTS THAT WERE MINE RATHER THAN THE GAME'S, all worth keeping:

     1. `kitFor(cls, tier)` IS A RANDOM DRAW BY DESIGN. It swaps the weapon 40% of the time for anything
        suitable under the tier's price cap, upgrades to a fine piece at 40%/30%, drops the helm and
        armour at tier 0 — and `pugio` carries `styles:[]`, so a dagger suits everybody and a Retiarius
        came out holding a Fine Pugio instead of his trident. It is not monotone in tier either: one
        Hoplomachus draw was 96d and shield-less at tier 2 against 130d with a clipeus at tier 1. A class
        comparison built on `kitFor` randomises the thing being compared, which is why the PRICED ranking
        (Hoplomachus best at 47.6%) and the FOUGHT ranking (Hoplomachus worst at 37.9%) had nothing to do
        with each other. `defaultKit` is deterministic and is the only fair bench.
     2. A HELPER THAT MAKES A STATE PINS THE RNG. `newGameState` reseeds the global stream, so a helper
        that built a fighter AFTER the arena was seeded made every one of forty iterations the same bout.
        It showed as win rates of exactly 100.0%, 0.0%, 83.3% and 33.3% over 240 bouts — sixths, which is
        six distinct outcomes repeated forty times.
     3. AND THE "RETIARIUS HAS A DEAD KEY STAT" FINDING WAS MEASURED WITH THE ONE FUNCTION THAT CANNOT
        SEE IT. `power` pays 0.00 for `sho`, so priced through `power` the Retiarius key pair (agi+sho)
        was worth +41 at birth against +49 to +53 for every other class. Fought, 54 points of `sho` is
        worth 15 to 16 points of win rate. The stat was never dead; the instrument was blind. That is
        the v2.99.0 quote fix, and `odds` holds it.

   WHAT THIS HOLDS: the cycle is still a cycle, an identical kit still makes the six classes identical,
   and their own default kits keep them inside a few points of each other, priced and fought.
   WHAT WOULD FALSIFY it: a seventh class breaking the cycle, or a gear change that puts one class more
   than ten points clear of another at a dead-equal statline. */

import { hasHandle } from "../harness.mjs";

export const name = "styles";
export const describe = "the six classes are neutral against a uniform mix, and their own kits keep them close";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const bad = [], lines = [];
    const K = Object.keys(A.CLASSES || {}), S = A.STATS;
    if(K.length < 2) return { bad:["`CLASSES` is not on the handle"], lines };
    if(typeof A.CLS_EDGE !== "function" || !A.COUNTERS)
      return { bad:["`CLS_EDGE`/`COUNTERS` are not on the handle — the matchup table cannot be driven"], lines };

    /* ONE state, made once, because `newGameState` reseeds the global RNG */
    const D = A.newGameState("St","clean","STYLES",null);
    D.fame = 1200; D.gold = 90000;
    const MEAN = 82;
    const man = (cls, kit) => { const g = A.clone(A.genGladiator(D, A.qForStat(MEAN)));
      g.cls = cls; for(const k of S) g[k] = MEAN;
      g.kit = kit === undefined ? A.defaultKit(cls) : kit;
      g.morale = 70; g.pfame = 40; g.wins = 4; g.heart = 60; g.traits = [];
      g.fatigue = 0; g.injury = null; g.footing = 1; g.regardMult = 1;
      g.mods = A.kitMods(g.kit, cls, g);
      return g; };

    /* ---- 1. THE CYCLE IS STILL A CYCLE ---- */
    {
      const mean = a => K.reduce((s,b)=>s+A.CLS_EDGE(a,b),0)/K.length;
      const ms = K.map(mean);
      lines.push(`the counter cycle: ${K.map(a=>`${a.slice(0,4)}>${(A.COUNTERS[a]||"?").slice(0,4)}`).join(" ")}`);
      lines.push(`CLS_EDGE over a uniform mix: ${K.map((a,i)=>`${a.slice(0,4)} ${ms[i].toFixed(3)}`).join(" · ")}`);
      const span = Math.max(...ms) - Math.min(...ms);
      if(span > 0.001)
        bad.push(`the mean pairing edge over a uniform mix spans ${span.toFixed(4)} across the classes `
          + `[measured 1.010 for all six]. \`COUNTERS\` is meant to be a cycle in which every class `
          + `counters exactly one and is countered by exactly one — if it is not, the matchup table has `
          + `a favourite and no player can choose around it`);
      const cyc = new Set(K.map(a=>A.COUNTERS[a]));
      if(cyc.size !== K.length)
        bad.push(`${K.length} classes and only ${cyc.size} distinct classes are countered — `
          + `\`COUNTERS\` is no longer a permutation, so somebody is countered twice and somebody not at all`);
    }

    /* ---- 2. ONE IDENTICAL KIT MAKES THE SIX IDENTICAL ---- */
    const FLAT = { weapon:"pugio", offhand:"offnone" };
    {
      const row = a => K.reduce((s,b)=>s+A.winChance(man(a,FLAT), man(b,FLAT), 0, "measured", "measured"),0)/K.length*100;
      const v = K.map(row);
      const span = Math.max(...v) - Math.min(...v);
      lines.push(`in one identical kit the priced row average is ${v.map(x=>x.toFixed(2)).join(" / ")} — spread ${span.toFixed(2)} points`);
      if(span > 1)
        bad.push(`with every man in the same kit at the same statline the classes still spread `
          + `${span.toFixed(2)} points of quoted win rate [measured 0.00]. Class is meant to be the `
          + `matchup cycle and nothing else, so anything here is a class-specific term that has crept `
          + `into \`power\` or \`winChance\``);
    }

    /* ---- 3. THEIR OWN KITS KEEP THEM CLOSE, PRICED ---- */
    const priced = {};
    {
      for(const a of K)
        priced[a] = K.reduce((s,b)=>s+A.winChance(man(a), man(b), 0, "measured", "measured"),0)/K.length*100;
      const v = K.map(a=>priced[a]);
      const span = Math.max(...v) - Math.min(...v);
      lines.push(`in their own default kits: ${K.map(a=>`${a.slice(0,4)} ${priced[a].toFixed(1)}%`).join(" · ")}`
        + ` — spread ${span.toFixed(2)} points`);
      if(span > 12)
        bad.push(`the six classes spread ${span.toFixed(1)} points of quoted win rate in their own `
          + `default kits at a dead-equal statline [measured 4.67, worst Retiarius 39.02%, best `
          + `Hoplomachus 43.69%]. That gap is entirely the gear each class is issued, so a spread this `
          + `wide means one class's kit has been made a strictly better bargain than another's`);
    }

    /* ---- 4. AND FOUGHT, as a confirmation with its own error bar on the record ----
       Small n on purpose: this is a floor under a collapse, not a ranking. At 25 bouts a pairing one
       standard error on a class rate is 4.1 points, so the bar is set where a real fault would sit
       rather than where the measurement happens to land. */
    {
      const N = 25;
      const rows = {};
      for(const a of K){
        let ran = 0, won = 0;
        for(const b of K) for(let i=0;i<N;i++){
          const d = A.newGameState("Sf","clean",`STYLES-${a}-${b}-${i}`,null);   /* made FIRST */
          d.fame = 1200; d.gold = 40000;
          const opp = man(b);
          const o = { id:d.nextId++, tier:2, festival:"a bench", opp, oppRef:null,
            rematch:false, grudgeM:false, stakes:"standard", purse:900 };
          d.games = { festival:"a bench", offers:[o], week:d.week };
          const g = man(a); g.status = "active"; g.mine = true; g.id = d.nextId++; g.lastFought = -9;
          d.gladiators.push(g);
          /* the rope, not a hand-rolled resume: `simulateFight` can come back to the balance three
             times and a one-shot answer silently drops 26.8% of standard bouts — `probe` caught the
             first draft of this check doing exactly that */
          const t = R.run(d, o, [g.id], { tactic:"measured", choice:"press" });
          if(!t.ran || !t.res) continue;
          ran++; if(t.res.win) won++;
        }
        rows[a] = { n:ran, win: ran ? won/ran*100 : null };
      }
      const v = K.filter(a=>rows[a].win != null).map(a=>rows[a].win);
      const se = Math.sqrt(0.25/(N*K.length))*100;
      const span = v.length ? Math.max(...v) - Math.min(...v) : 0;
      lines.push(`fought at ${N} a pairing (${N*K.length} a class, one standard error ${se.toFixed(1)} points): `
        + K.map(a=>`${a.slice(0,4)} ${rows[a].win==null?"—":rows[a].win.toFixed(1)+"%"}`).join(" · ")
        + ` — spread ${span.toFixed(1)}`);
      if(!v.length) bad.push(`not one class resolved a bout on the bench — the fight could not be driven at all`);
      else if(span > 6 * se)
        bad.push(`the six classes spread ${span.toFixed(1)} points of realised win rate at a dead-equal `
          + `statline, which is ${(span/se).toFixed(1)} standard errors [measured 7.8 points at 3.0 SE `
          + `over 360 bouts a class, five of the six inside 4 points]. A gap this size is a class that `
          + `wins or loses on something other than the numbers on the man`);
      const low = v.length ? Math.min(...v) : 0;
      if(v.length && low < 25)
        bad.push(`one class won only ${low.toFixed(1)}% of its bouts against an identical statline `
          + `[measured 40.6% at worst, against a 41-46% house average that \`odds\` pins to FOE_EDGE] — `
          + `that is not a spread, that is a class nobody should ever buy`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
