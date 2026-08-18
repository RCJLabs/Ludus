/* THE FOUR THINGS YOU CAN DO BACK, AND THE PANEL THAT MISQUOTED THEM — #150

   Nothing in this suite touched `runGambit` before v3.41.0. `dark` called it blindly and reported it
   returning null on 348 of 1,100 calls (32%), and the item opened on that count plus a framing the
   code already contradicts: it said "a third of PAID attempts do nothing", and every guard in that
   function runs BEFORE `d.gold -= cost`. Measured over three seeds, 12 houses x 320 weeks
   (`test/probes/quiet2.mjs`): **coin moved on 0 of 1,800 nulls**, and split by the game's own guards
   the nulls are 81-86% the six-week cooldown and 14-19% the price, with the unknown-key and
   unknown-house branches never reached at all. Counted the way `dark` counts — gated on
   `gambitReady` first, so the cooldown cannot appear — 52-63% would be null and **every one of them
   is the price**, which is the item's falsification clause word for word.

   So it was a UI item, and the drive found two faults there:

   · THE PANEL QUOTED A NUMBER THE ENGINE WOULD NOT ROLL. It worked the odds out for itself from
     `gambitDone`, the count stored the last time the trick was used; `runGambit` rolled against
     `gambitStale`, that count minus one for every `GAM_FORGET` weeks since. Of 6,448 rows the panel
     drew across three seeds, **990 were wrong, and wrong in the same direction every time** — the
     panel understating the odds by a median 7 points and up to 14. The fix is not "call the other
     function"; it is `gambitOdds(d,k)`, which both sides now use, so they cannot drift again.
   · A SHUT DOOR SAID NOTHING. The rival buttons rendered behind `ready && S.gold >= cost`, so a
     house short of the price saw a name, a blurb, a price, odds — and no button and no reason. The
     `munusReady` panel below it already carries a comment about naming the thing that is in the way.

   WHAT IS HELD HERE is a bench: the forgetting curve `gambitOdds` is supposed to describe, and the
   four refusals with the coin read before and after each. No trajectory, nothing to reshuffle. */
import { hasHandle } from "../harness.mjs";

export const name = "gambit";
export const describe = "the odds the panel quotes are the odds the game rolls, and a refusal costs nothing";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const K = A.GAM_KEYS[0];

    const fresh = tag => { const d = A.newGameState("Gb", "clean", `GAMBIT-${tag}`, null);
      d.gold = 40000; d.week = 60; return d; };

    /* ---- 1. THE FORGETTING CURVE, which is the whole reason the panel was wrong ---- */
    {
      const d = fresh("forget");
      const base = A.gambitOdds(d, K);
      const seen = [{ label:"never used", odds:Math.round(base*100), worn:A.gambitStale(d,K), done:A.gambitDone(d,K) }];
      /* three uses, stamped as if they all happened this week */
      d.gambits = { [K]: 3 }; d.gamWhen = { [K]: d.week };
      const used = A.gambitOdds(d, K);
      seen.push({ label:"used 3x, this week", odds:Math.round(used*100), worn:A.gambitStale(d,K), done:A.gambitDone(d,K) });
      /* and then the town forgets, one throw per GAM_FORGET weeks */
      const marks = [];
      for(let n=1; n<=3; n++){
        d.week = 60 + A.GAM_FORGET*n;
        marks.push({ n, odds:Math.round(A.gambitOdds(d,K)*100), worn:A.gambitStale(d,K), done:A.gambitDone(d,K) });
      }
      lines.push(`\`${K}\`: ${seen.map(x=>`${x.label} ${x.odds}% (worn ${x.worn}, stored ${x.done})`).join(" → ")}`);
      lines.push(`   and then, ${A.GAM_FORGET} weeks at a time: `
        + marks.map(m=>`+${A.GAM_FORGET*m.n}w ${m.odds}% (worn ${m.worn}, stored ${m.done})`).join(" → "));

      if(!(used < base))
        bad.push(`using \`${K}\` three times did not lower its odds at all (${Math.round(base*100)}% then `
          + `${Math.round(used*100)}%) — every throw of the same trick is meant to cost seven points`);
      if(!(marks[2].odds > marks[0].odds) || marks[2].worn !== 0)
        bad.push(`three lots of ${A.GAM_FORGET} weeks did not bring \`${K}\` back to a clean slate `
          + `(worn ${marks[2].worn}, odds ${marks[2].odds}% against ${Math.round(base*100)}% fresh) — the `
          + `forgetting IS \`GAM_FORGET\`'s design, and a panel that reads the stored count instead of `
          + `the forgotten one is the #150 fault`);
      if(marks[2].done === marks[2].worn && marks[0].worn !== marks[0].done)
        bad.push(`\`gambitDone\` and \`gambitStale\` have stopped differing after ${A.GAM_FORGET*3} `
          + `weeks — if they are the same number the panel cannot misquote, but neither can the town `
          + `forget, and something has been flattened`);
      /* the negative control: the number the panel USED to read does not recover, which is why it lied */
      if(marks[2].done !== 3)
        lines.push(`   (the stored count is still ${marks[2].done} — it never moves between uses, `
          + `which is exactly why the panel reading it quoted the penalty for a trick nobody remembers)`);
    }

    /* ---- 2. THE FOUR REFUSALS, AND NOT ONE OF THEM COSTS A DENARIUS ---- */
    {
      const rows = [];
      const attempt = (label, setup, keep) => {
        const d = fresh(label);
        const h = (d.rivals||[])[0];
        const arg = setup(d, h);
        const was = d.gold;
        const res = A.runGambit(d, arg.k, arg.house);
        const row = { label, ran:res != null, spent:Math.round(was - d.gold) };
        if(keep !== false) rows.push(row);      /* the positive control is NOT one of the refusals */
        return { d, res, row };
      };
      attempt("no such trick",   (d,h)=>({ k:"not-a-gambit", house:h && h.name }));
      attempt("no such house",   (d,h)=>({ k:K, house:"House That Is Not There" }));
      attempt("inside the cooldown", (d,h)=>{ d.flags.gambitWeek = d.week - 1; return { k:K, house:h && h.name }; });
      attempt("cannot afford it",(d,h)=>{ d.gold = 1; return { k:K, house:h && h.name }; });
      const ok = attempt("everything in order", (d,h)=>({ k:K, house:h && h.name }), false);

      for(const r of rows)
        lines.push(`${r.label.padEnd(21)} ${r.ran ? "ran" : "refused"} · ${r.spent}d spent`);
      lines.push(`${"everything in order".padEnd(21)} ${ok.res ? `ran (${ok.res.won?"landed":"missed"}) · ${ok.row.spent}d spent` : "REFUSED"}`);

      for(const r of rows){
        if(r.ran) bad.push(`\`runGambit\` ran on "${r.label}" — that is one of its four guards and it must refuse`);
        if(r.spent !== 0) bad.push(`a refused gambit ("${r.label}") cost the house ${r.spent}d. Every guard in `
          + `\`runGambit\` runs before \`d.gold -= cost\`, and the measurement behind #150 read coin moving `
          + `on 0 of 1,800 nulls — if that has changed, a refusal is now a purchase`);
      }
      if(!ok.res)
        bad.push(`a solvent house past the cooldown, naming a real rival and a real trick, was still `
          + `refused — with the other four guards proven above this leaves no way in at all`);
      else if(ok.res.cost <= 0)
        bad.push(`the gambit ran for ${ok.res.cost}d — all four cost the fame-scaled price in \`GAMBITS[k].cost\``);
    }

    /* ---- 3. AND WHAT THE PANEL WOULD DRAW, off the same function the roll uses ---- */
    {
      const d = fresh("panel");
      const shown = A.GAM_KEYS.map(k=>`${k} ${Math.round(A.gambitOdds(d,k)*100)}%/${A.GAMBITS[k].cost(d)}d`);
      lines.push(`a clean house at week 60 is offered: ${shown.join(" · ")}`);
      for(const k of A.GAM_KEYS){
        const o = A.gambitOdds(d, k);
        if(!(o >= 0.12 && o <= 0.86))
          bad.push(`\`gambitOdds\` returned ${o} for \`${k}\`, outside the 0.12-0.86 the roll is clamped to`);
        if(!(A.GAMBITS[k].cost(d) > 0))
          bad.push(`\`${k}\` costs nothing at week 60 — a gambit the house cannot be short of has no refusal to explain`);
      }
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
