/* YOUR OWN GAMES: A CARD YOU PAY FOR, AND ONE BOUT ON IT WAS NOT WHAT YOU BOUGHT.

   `stageMunus` is the one place in this game where the player is the editor. He picks an occasion,
   a scale, a hunt, a centrepiece, sine missione or not, and a headliner, then either hosts it out
   of his own coin or sells the bill. Hosting writes `d.munusCard` and calls `makeGames` on the
   spot, so the bill goes up the same week; `endWeek` nulls it before it builds the next card,
   because a munus is a single afternoon.

   NOTHING HAD EVER LOOKED AT THE CARD. `near` holds the four reasons the panel refuses one and
   `feats` stages three of them to earn `munera`, and neither reads `d.games` afterwards. Measured
   across all twelve combinations of scale and stakes: the card goes up every time, `mine` and
   `fest` are set, the headliner is booked to the marquee bout, the hunt is forced, the purses carry
   the 0.6 of a card you paid for yourself, the cost matches `munusCost` to the denarius, selling
   pays `munusSellFee` exactly and puts no card up, and the card comes down the week after. One
   thing was wrong.

   A PAIR BOUT COULD NEVER BE SINE MISSIONE. `add()` reads `F.allSine`; `addPair` hardcoded
   "standard", and so did the coastal pair. So a player who commissioned a munus SINE MISSIONE and
   paid the 15% surcharge for it got a standard pair on his own bill on **17 of 24 modest cards** —
   and, more to the point, `simulatePair`'s whole sine branch (its intro, a death where a standard
   bout would put the question to the editor, the kin and the unrest tax at 7 against 4) could
   never run in any bout in the game. Driven 18 times before the fix shipped: no throw, 4 of 36
   men dead, every one of them in the fallen, none left standing at zero health.

   WHAT THIS HOLDS: the card exists and is fightable; every promise on the plan is kept on the
   bill; and a card bought sine missione is sine missione all the way down, pair included. The
   melee and the venatio are exempt and always will be — a beast hunt has its own stakes word.
   WHAT WOULD FALSIFY: a plain single at standard stakes on an all-sine card, or a pair that goes
   back to standard, or `munusCard` surviving a week. */

import { hasHandle } from "../harness.mjs";

export const name = "munus";
export const describe = "your own games put up a real card, and a sine missione card is sine missione";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    if(typeof A.stageMunus !== "function" || !A.MUNUS_SCALES)
      return { bad:["`stageMunus`/`MUNUS_SCALES` are not on the handle"], lines };

    const house = (tag, fame) => {
      const d = A.newGameState("Mu", "clean", tag, null);
      d.week = 60; d.gold = 60000; d.fame = fame; d.favor = 60; d.munusLast = -99; d.games = null;
      while(A.activeG(d).length < 5){ const m = A.genGladiator(d, 74); m.id = d.nextId++;
        m.status = "active"; m.mine = true; m.kit = A.defaultKit(m.cls); d.gladiators.push(m); }
      for(const g of A.activeG(d)){ g.injury = null; g.fatigue = 0; g.lastFought = -9; }
      return d;
    };
    /* which engine built a bout, so a not-sine one can be named rather than counted */
    const kindOf = o => o.melee ? (o.spectacle || "melee") : o.venatio ? "venatio" : o.pair ? "pair"
      : o.booking ? "booking" : o.challenge ? "challenge" : "single";
    /* the two engines whose stakes word is the bout itself */
    const OWN_STAKES = new Set(["melee","naumachia","venatio"]);

    /* ---- 1. EVERY COMBINATION OF SCALE AND STAKES PUTS UP A REAL CARD ---- */
    for(const scale of Object.keys(A.MUNUS_SCALES)){
      for(const sine of [false, true]){
        const plan = { occasion:"funeral", scale, hunt:true, sine, spectacle:null, headliner:null, sell:false };
        const d = house(`MUNUS-${scale}-${sine}`, A.MUNUS_SCALES[scale].gate + 900);
        plan.headliner = A.activeG(d)[0].id;
        const gold0 = d.gold, fame0 = d.fame, want = A.munusCost(plan);
        let threw = null;
        try { A.stageMunus(d, plan); } catch(e){ threw = e.message; }
        if(threw){ bad.push(`staging a ${scale} munus threw: ${threw}`); continue; }
        const paid = gold0 - d.gold, MC = d.munusCard, offs = (d.games && d.games.offers) || [];

        if(paid !== want)
          bad.push(`a ${scale} munus${sine?" sine missione":""} with a hunt charged ${paid}d and `
            + `\`munusCost\` prices it at ${want}d`);
        if(!MC){ bad.push(`a ${scale} munus wrote no \`munusCard\` — nothing goes up at the arena`); continue; }
        if(!offs.length){ bad.push(`a ${scale} munus put up a card with no bouts on it`); continue; }
        if(!(d.games.mine && d.games.fest === "munus"))
          bad.push(`your own ${scale} games came up as \`mine=${d.games.mine}\` fest=\`${d.games.fest}\` — `
            + `the arena reads both to know whose card it is`);
        if(MC.purse !== 0.6)
          bad.push(`your own card pays a purse multiplier of ${MC.purse} and it has always been 0.6 — `
            + `an editor who is also the paymaster does not pay himself the full bill`);
        if(!offs.some(o=>o.venatio))
          bad.push(`a ${scale} munus commissioned WITH a hunt has no venatio on the bill — \`forceHunt\` `
            + `is the whole of what that button buys`);
        const headline = offs.filter(o=>o.headline && o.bookedGid === plan.headliner);
        if(!headline.length)
          bad.push(`the man named headliner of a ${scale} munus is not booked to any bout on it — the `
            + `plan carries \`headliner\` and \`makeGames\` is meant to pin it to the marquee single`);
        const odd = offs.filter(o=>!OWN_STAKES.has(kindOf(o)) && o.stakes !== (sine ? "sine" : "standard"));
        lines.push(`${scale.padEnd(7)}${sine?" sine":"     "} ${String(paid).padStart(5)}d · ${MC.offers} promised, `
          + `${String(offs.length).padStart(2)} on the bill · ${offs.map(kindOf).join(" ")}`
          + ` · headliner booked: ${headline.length > 0}`);
        if(odd.length)
          bad.push(`a ${scale} munus bought ${sine?"SINE MISSIONE":"with mercy on offer"} put ${odd.length} `
            + `bout${odd.length===1?"":"s"} on the bill at the wrong stakes — ${odd.map(o=>`${kindOf(o)}/${o.stakes}`).join(", ")}`
            + `. \`add()\` reads \`F.allSine\`; every other engine on the card has to as well, and the `
            + `pair was the one that did not for the life of the feature`);
      }
    }

    /* ---- 2. A CARD BOUGHT SINE MISSIONE IS SINE MISSIONE, over enough cards to see a pair ---- */
    {
      let cards = 0, pairs = 0, sinePairs = 0, oddSingles = 0;
      for(let i=0;i<20;i++){
        const d = house("MUNUS-SINE-"+i, 1200);
        A.stageMunus(d, { occasion:"funeral", scale:"modest", hunt:false, sine:true,
          spectacle:null, headliner:null, sell:false });
        const offs = (d.games && d.games.offers) || [];
        if(!offs.length) continue;
        cards++;
        for(const o of offs){
          const k = kindOf(o);
          if(k === "pair"){ pairs++; if(o.stakes === "sine") sinePairs++; }
          else if(k === "single" && o.stakes !== "sine") oddSingles++;
        }
      }
      lines.push(`${cards} modest cards bought sine missione: ${pairs} pair bouts, ${sinePairs} of them sine`
        + ` · plain singles at standard stakes: ${oddSingles}`);
      if(pairs && sinePairs !== pairs)
        bad.push(`${pairs - sinePairs} of ${pairs} pair bouts on a sine missione card were at standard `
          + `stakes. \`addPair\` has to read \`F.allSine\` — and \`simulatePair\` has the whole sine `
          + `branch, which no bout in this game could reach until v2.98.0`);
      if(oddSingles)
        bad.push(`${oddSingles} ordinary single bouts came up at standard stakes on an all-sine card — `
          + `that is \`add()\` itself, and it is the one engine that always honoured the plan`);
      if(!pairs)
        lines.push(`(no pair came up in ${cards} cards, so the pair assertion above saw nothing — it `
          + `fires at 60% above the second tier, and this says so rather than passing quietly)`);
    }

    /* ---- 3. A DEATH MATCH FOR TWO OF YOUR OWN RESOLVES CLEANLY ----
       The branch had never run. This drives it to the end and holds the aftermath: a man who dies
       is off the roster and in the fallen, and nobody is left standing at zero health. */
    {
      let ran = 0, threw = 0, dead = 0, fallen = 0, zombie = 0;
      for(let i=0;i<12;i++){
        const d = house("MUNUS-PAIR-"+i, 1400);
        A.stageMunus(d, { occasion:"funeral", scale:"grand", hunt:false, sine:true,
          spectacle:null, headliner:null, sell:false });
        const o = ((d.games && d.games.offers) || []).find(x=>x.pair);
        if(!o) continue;
        const mine = A.activeG(d).slice(0,2).map(g=>g.id);
        const f0 = (d.fallen||[]).length;
        ran++;
        try {
          let r = A.doPairFight(d, mine, o, "measured", null, null, null, "none");
          for(let n=0; r && r.crux && n<6; n++){ const pd = r.pending; pd.beats = r.beats;
            r = A.doPairFight(d, mine, o, "measured", null, pd, "press", "none"); }
        } catch(e){ threw++; continue; }
        for(const id of mine){
          const g = (d.gladiators||[]).find(x=>x.id===id);
          if(!g || g.status === "dead") dead++;
          else if(g.status === "active" && g.health != null && g.health <= 0) zombie++;
        }
        fallen += (d.fallen||[]).length - f0;
      }
      lines.push(`${ran} sine missione pair bouts fought to the end: ${threw} threw · ${dead} of your men `
        + `died · ${fallen} rows in the fallen · ${zombie} left standing at zero health`);
      if(threw) bad.push(`${threw} of ${ran} sine missione pair bouts threw — that branch of `
        + `\`simulatePair\` was unreachable until v2.98.0, so it is where a stale field would live`);
      if(dead !== fallen)
        bad.push(`${dead} of your men died in a sine missione pair and ${fallen} reached the fallen — a `
          + `death the annals never record is a death the burial society cannot be held to either`);
      if(zombie) bad.push(`${zombie} men were left \`active\` at zero health after a sine missione pair`);
    }

    /* ---- 4. THE CARD IS ONE AFTERNOON, AND SELLING THE BILL PAYS ---- */
    {
      const d = house("MUNUS-DOWN", 900);
      A.stageMunus(d, { occasion:"triumph", scale:"grand", hunt:false, sine:false,
        spectacle:null, headliner:null, sell:false });
      const up = !!(d.games && d.games.mine);
      d.pendingEvent = null;
      let threw = null;
      try { A.endWeek(d); } catch(e){ threw = e.message; }
      if(threw) bad.push(`the week after your own games threw: ${threw}`);
      else {
        lines.push(`the card goes up the week it is bought (${up}), and comes down after: ${d.munusCard === null}`);
        if(d.munusCard !== null)
          bad.push(`\`munusCard\` survived \`endWeek\` — your own games are a single week, and a card `
            + `that stays up rebuilds itself every week for nothing`);
        if(d.games && d.games.mine)
          bad.push(`the week after your own games, the next card is still billed as yours`);
      }

      const e = house("MUNUS-SELL", 900);
      const plan = { occasion:"funeral", scale:"grand", hunt:false, sine:false, spectacle:null, headliner:null, sell:true };
      const fee = A.munusSellFee(e, plan), g0 = e.gold;
      A.stageMunus(e, plan);
      const got = e.gold - g0;
      lines.push(`selling the bill to an editor paid ${got}d (\`munusSellFee\` said ${fee}d) · a card of `
        + `your own went up: ${!!(e.games && e.games.mine)}`);
      if(got !== fee)
        bad.push(`brokering a grand munus paid ${got}d and \`munusSellFee\` quotes ${fee}d — the panel `
          + `shows the quote before the player commits to it`);
      if(e.munusCard || (e.games && e.games.mine))
        bad.push(`selling the bill still put your own card up — the editor's name is on it, and your `
          + `men are not obliged to fight a card you were paid to hand over`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
