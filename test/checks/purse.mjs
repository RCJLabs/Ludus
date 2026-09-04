/* A MAN WITH MONEY OF HIS OWN, AND WHAT TAKING IT COSTS

   Phase queue item #233. No gladiator in this game has ever held a denarius: every purse lands in
   `d.gold` at one of seven credit sites and none of it is his. His only road out is `rudisEligible`,
   a gate the PLAYER acts on while he waits. So a man past a renown of his own keeps a cut of what he
   wins, and when it is enough he asks — with his own money on the table.

   THE ITEM'S NUMBERS DID NOT SURVIVE `probes/purse.mjs`, AND THE FIX WAS WHAT IT MEANS.
   It proposed a trigger at `stash >= gladValue(g)*0.35`. Measured across 12 houses, 1,920 weeks and
   286 men who ever fought: a bout pays 229d, a man is worth 1,783d at 90 renown, and he gets a
   MEDIAN OF SIX MORE BOUTS. Skimming every denarius from that moment to the end of his career
   reaches a median of 75.7% of what he is worth — so at a 100% skim he still cannot buy himself, and
   at the proposed 6-15% the event fires for 0.3% of men. That is the AMB_NEVER failure (0 met out of
   651) the item's own risk section names. Its stated falsifier fired too: `rudisEligible` is reached
   by 4.5% of men who fought, under the 5% it set.

   A man cannot buy his own price. He can buy THE STATE'S CUT of it — `rudisCost`'s first term,
   `gladValue(g) * RUDIS_TAX`, the vicesima libertatis, "a fifth of what the man himself is worth" —
   which is the half a peculium actually bought. The house still pays its own parting gift.

   SEVEN ARMS:
   1 · THE SKIM IS GATED AND IT IS REAL: a man past 90 renown and 4 wins keeps a fifth of each purse;
       a man short of either keeps nothing; a free man (auctoratus) is never skimmed.
   2 · AND IT COMES OFF THE HOUSE, NOT OFF THE EDITOR: `skimStash` returns the house's share, so the
       fame a purse buys and the line the summary prints still read the full sum that changed hands.
   3 · WHAT HE IS SAVING FOR is the state's twentieth of him and nothing else — `stashTarget` is
       `gladValue * RUDIS_TAX`, and the ask stands only at or above it.
   4 · ONE MAN, ONE QUESTION ABOUT THE SAME DOOR: never while `AMBITIONS.freedom` is live on him.
   5 · THE ASK IS ASKED, not entered in a raffle. `pickEvent` draws on 45% of weeks and then shuffles
       fifty-eight events for one winner — measured, nine men reached the point of asking and only
       TWO were ever asked. It belongs in `heldQuestions` with the questions the house owes.
   6 · AND HE DOES NOT NAG: told no, he waits before raising it again.
   7 · TAKING IT COSTS MORE THAN IT PAYS. The item's own falsifier: "if aggregate end-of-run gold is
       higher for players who systematically refuse-and-keep, the punishment side needs raising."
       It was, twice. The first draft made the yard STOP saving after a theft, which measured
       backwards — the skim is money the house does not bank, so ending it paid the player again
       (5,826 gold against 3,982 for freeing him). Men who watch a house rob a man do not stop
       saving; they hold back MORE. Measured on ten houses a policy, identical seeds: taking the bag
       now ends lowest on gold (3,328 v 3,982 v 4,009), lowest on fame and acclaim, highest on
       unrest, and ends runs early 14 times against 4. Held here as a rule rather than a number. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "purse";
export const describe = "a man keeps a cut of his own purses, and taking it off him costs more than it pays";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"PURSE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    const mk = seed => A.newGameState("Purse", "clean", seed, null);
    const man = (d, over) => { const g = A.genGladiator(d, 70); g.id = d.nextId++; g.status="active";
      g.mine=true; g.kit=A.defaultKit(g.cls); g.morale=50; g.stash=0; g.pfame=120; g.wins=8;
      g.ambition = null; g.stashAsk = null;   /* arm 4 owns the ambition rule; the other arms must not trip it */
      Object.assign(g, over||{}); d.gladiators.push(g); return g; };

    /* ---- 1 + 2. the skim is gated, real, and comes off the house's share ---- */
    let arm12 = null;
    { const d = mk("SKIM");
      const rich = man(d, { pfame:120, wins:8 });
      const green = man(d, { pfame:40,  wins:8 });
      const few   = man(d, { pfame:120, wins:1 });
      const took = A.skimStash(d, rich, 1000);
      const tookG = A.skimStash(d, green, 1000);
      const tookF = A.skimStash(d, few, 1000);
      arm12 = { cut:A.SKIM_CUT, took, tookG, tookF, stash:rich.stash, greenStash:green.stash||0, fewStash:few.stash||0 };
      if(!(rich.stash > 0)) bad.push(`a man past ${A.SKIM_FAME} renown and ${A.SKIM_WINS} wins kept nothing of a 1000d purse`);
      if(Math.abs(rich.stash - 1000*A.SKIM_CUT) > 1) bad.push(`he kept ${rich.stash} of 1000, not the ${Math.round(1000*A.SKIM_CUT)} SKIM_CUT says`);
      if(took !== 1000 - rich.stash) bad.push(`the house banked ${took} while he kept ${rich.stash} — the two do not add to the purse`);
      if(green.stash || few.stash) bad.push(`a man short of the gate still skimmed: ${green.stash||0} under-renown, ${few.stash||0} under-wins`);
      if(tookG !== 1000 || tookF !== 1000) bad.push(`an ungated man's purse was reduced anyway (${tookG}, ${tookF})`);
      /* and a free man never skims — he is already paid a wage */
      const au = man(d, { pfame:200, wins:20 });
      au.auctor = { fee:100, wage:10, why:"coin", served:0 };
      const tookA = A.skimStash(d, au, 1000);
      arm12.auctorStash = au.stash||0; arm12.tookA = tookA;
      if(au.stash) bad.push(`an auctoratus — a free man on wages — put ${au.stash} aside out of the house's purse`); }

    /* ---- 3. what he is saving for is the state's twentieth of him ---- */
    let arm3 = null;
    { const d = mk("TGT");
      const g = man(d, { pfame:120, wins:8 });
      const want = A.stashTarget(g), value = A.gladValue(g);
      g.stash = want - 1;
      const shortOf = A.stashReady(d, g);
      g.stash = want;
      const atIt = A.stashReady(d, g);
      arm3 = { want, value, tax:A.RUDIS_TAX, shortOf, atIt, expect:Math.round(value*A.RUDIS_TAX) };
      if(Math.abs(want - Math.round(value*A.RUDIS_TAX)) > 1 && want !== 40)
        bad.push(`stashTarget is ${want} where gladValue*RUDIS_TAX is ${Math.round(value*A.RUDIS_TAX)} — he must be saving for the state's cut and nothing else`);
      if(shortOf) bad.push(`a man a denarius short of the target already stands ready to ask`);
      if(!atIt) bad.push(`a man who has saved the whole target does not stand ready to ask`); }

    /* ---- 4. one man, one question about the same door ---- */
    let arm4 = null;
    { const d = mk("AMB");
      const g = man(d, { pfame:120, wins:8 });
      g.stash = A.stashTarget(g);
      const before = A.stashReady(d, g);
      g.ambition = { kind:"freedom", met:false, broken:false, since:1 };
      const during = A.stashReady(d, g);
      g.ambition.met = true;
      const after = A.stashReady(d, g);
      arm4 = { before, during, after };
      if(!before) bad.push(`a saved man with no ambition running is not ready`);
      if(during) bad.push(`a man already asking for the rudis through his ambition ALSO raises the stash question — one man, one ask`);
      if(!after) bad.push(`a man whose freedom ambition is already met is still blocked from asking`); }

    /* ---- 5 + 6. the ask is asked, and he does not nag ---- */
    let arm56 = null;
    { const d = mk("ASK");
      const g = man(d, { pfame:120, wins:8 });
      man(d, { pfame:50, wins:2 });
      g.stash = A.stashTarget(g) + 50;
      d.pendingEvent = null;
      A.heldQuestions(d);
      const asked = !!(d.pendingEvent && d.pendingEvent.id === "stash");
      /* told no, and he waits */
      let cooled = null, reasked = null;
      if(asked){
        const ev = d.pendingEvent; d.pendingEvent = null;
        A.EVENTS.stash.run(d, ev, 2);          /* give it back */
        cooled = g.stashAsk != null && g.stashAsk > d.week;
        A.heldQuestions(d);
        reasked = !!(d.pendingEvent && d.pendingEvent.id === "stash");
      }
      arm56 = { asked, cooled, reasked, stashKept:g.stash };
      if(!asked) bad.push(`a man standing there with the bag was not asked by heldQuestions — he is in the weekly raffle instead`);
      if(asked && !cooled) bad.push(`told "not yet", he set no clock — he will raise it again next week and every week`);
      if(reasked) bad.push(`he raised it again the same week he was told no`);
      if(asked && !(g.stash > 0)) bad.push(`"give it back" did not leave him his money`); }

    /* ---- 7. the three answers, and what taking it costs ---- */
    let arm7 = null;
    { const build = () => { const d = mk("ANS"); const g = man(d, { pfame:200, wins:12 });
        man(d, { pfame:60, wins:3 }); d.gold = 20000; g.stash = A.stashTarget(g);
        d.pendingEvent = null; A.heldQuestions(d);
        return { d, g, ev:d.pendingEvent }; };

      const F = build(); const fGold = F.d.gold, fHis = F.g.stash;
      const fSay = F.ev ? A.EVENTS.stash.run(F.d, F.ev, 0) : null;
      const freed = F.g.status !== "active";

      const T = build(); const tGold = T.d.gold, tHis = T.g.stash, tFame = T.d.fame;
      T.ev && A.EVENTS.stash.run(T.d, T.ev, 1);
      const tookRegard = (T.g.memory||[]).some(m=>m.kind==="tookStash");
      const rateAfter = A.skimRate(T.d), rateBefore = A.SKIM_CUT;

      const G = build(); const gGold = G.d.gold, gHis = G.g.stash;
      G.ev && A.EVENTS.stash.run(G.d, G.ev, 2);

      arm7 = { freed, fPaid: fGold - F.d.gold, fHis,
        tGained: T.d.gold - tGold, tHis, tFameDrop: tFame - T.d.fame, tookRegard,
        rateBefore, rateAfter, gGold: G.d.gold - gGold, gStash: G.g.stash,
        gRegard: (G.g.memory||[]).some(m=>m.kind==="keptStash") };
      if(!F.ev || !T.ev || !G.ev) bad.push(`the ask did not come up on a man who had saved the whole target`);
      if(!freed) bad.push(`"take it and free him" left him in the cells`);
      /* he paid the state's cut; the house is out the rest, so it pays LESS than his stash was worth */
      /* his bag is the state's twentieth; the house's own parting gift is the rest, and it pays it */
      if(!(arm7.fPaid > 0)) bad.push(`freeing him with his own money cost the house nothing at all (${arm7.fPaid}) — the parting gift is the house's half and it must still pay it`);
      if(arm7.fPaid >= fHis + A.rudisCost(F.d, F.g)) bad.push(`his bag did not come off what the house paid`);
      if(arm7.fPaid < 0) bad.push(`the house came out ${-arm7.fPaid}d AHEAD by freeing him — it pocketed the surplus he had over-saved, which is being paid to let a man buy himself`);
      if(arm7.tGained !== tHis) bad.push(`taking the bag put ${arm7.tGained} in the strongbox where he had saved ${tHis}`);
      if(!tookRegard) bad.push(`taking a man's savings left no mark on what he thinks of you`);
      if(!(arm7.tFameDrop > 0)) bad.push(`Capua never heard that this house robbed a man (fame moved ${-arm7.tFameDrop})`);
      /* and the yard holds back HARDER afterwards — a punishment that ends the skim would pay */
      if(!(rateAfter > rateBefore))
        bad.push(`after a theft the yard skims ${rateAfter} against ${rateBefore} — a consequence that ENDS the saving pays the player twice, which measured at 5,826 gold against 3,982 for freeing him`);
      if(arm7.gGold !== 0) bad.push(`"give it back" moved ${arm7.gGold} through the strongbox — it should move nothing`);
      if(!(arm7.gStash > 0)) bad.push(`"give it back" did not leave him holding it`);
      if(!arm7.gRegard) bad.push(`handing it back left no mark either`); }

    return { bad, arm12, arm3, arm4, arm56, arm7 };
  });

  bad.push(...r.bad);

  lines.push(`arm 1+2 — skim ${Math.round(r.arm12.cut*100)}% of a 1000d purse: he keeps ${r.arm12.stash}, the house banks ${r.arm12.took} `
    + `· under-renown ${r.arm12.greenStash} · under-wins ${r.arm12.fewStash} · a free man ${r.arm12.auctorStash}`);
  lines.push(`arm 3 — he saves for the state's twentieth: target ${r.arm3.want}d on a man worth ${r.arm3.value}d `
    + `(gladValue x RUDIS_TAX ${r.arm3.tax} = ${r.arm3.expect}) · a denarius short: ${r.arm3.shortOf} · at it: ${r.arm3.atIt}`);
  lines.push(`arm 4 — with a live freedom ambition he stays quiet: before ${r.arm4.before} · during ${r.arm4.during} · once met ${r.arm4.after}`);
  lines.push(`arm 5+6 — heldQuestions asked him: ${r.arm56.asked} · told no he set a clock: ${r.arm56.cooled} · asked again the same week: ${r.arm56.reasked}`);
  lines.push(`arm 7 — free him: the house paid ${r.arm7.fPaid}d of a bag worth ${r.arm7.fHis}d and he is out `
    + `· take it: +${r.arm7.tGained}d, fame -${r.arm7.tFameDrop}, and the yard's skim goes ${r.arm7.rateBefore} → ${r.arm7.rateAfter} `
    + `· give it back: ${r.arm7.gGold}d moved, he still holds ${r.arm7.gStash}d`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
