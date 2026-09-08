/* BUYING THE YARD — #242 phases 1 and 2.

   (`vacancy` was free in BOTH directories; checked before writing, in checks and probes.)

   MEASURED FIRST (`probes/vacancy.mjs`, 16 x 420, 4,081 house-weeks), because the item makes the
   measurement the gate on whether to build: 13 yards went dark, a median of ONE a house at a median
   of week 185 — not the "twice a run at week 200+" that would have sent this beside #248 — holding a
   median of 6 men worth 7,567d. The nine-name pool never emptied in 420 weeks, so the "stays dark
   for ever" edge the item calls a defect on its own is not reachable. A dark yard stands unsold
   about SEVEN weeks and then `bayRefill` gives it to a stranger; all 13 went that way.

   So it is a once-a-run set-piece with a seven-week window. Phases 1 and 2 fit it; phases 3 and 5 —
   a second yard as a building with its own upkeep and doctore post, then selling it back or willing
   it to an heir — are a great deal of machinery for something that fires once, and are recorded as
   declined rather than built.

   SIX ARMS, and the fourth exists because this release shipped the fault it catches. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "vacancy";
export const describe = "a yard that goes dark carries a price, and a house that can pay it can take it";

export async function run({ p }){
  const lines = [], bad = [];
  await found(p, { seed:"VAC-1" });
  await clearAll(p, 10);
  await installRope(p);

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","closeHouse","lastDark","offerYard","buyYard","yardPrice","yardWalls",
                  "YARD_FAVOUR","YARD_DISCOUNT","gladValue","bayRefill","liveRivals","cellsCap",
                  "activeG","BAY_FLOOR"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    const mk = (how) => {
      const d = A.newGameState("Vac","clean","VAC-A");
      d.week = 120; d.gold = 60000; d.favor = 90;
      const h = (d.rivals||[]).filter(x=>!x.retired)[0];
      A.closeHouse(d, h, how || "fond");
      return { d, h };
    };
    /* 1 — the lineage carries what was standing in it */
    const a = mk();
    const lin = a.h.lineage;
    const trueWorth = Math.round((a.h.fighters||[]).reduce((n,f)=>n+A.gladValue(f), 0));
    /* 2 — the question is put, once, and priced under the worth */
    const o1 = A.offerYard(a.d), o2 = A.offerYard(a.d);
    /* 3 — not for a live house, a sold yard, or a house on the road */
    const live = A.newGameState("Vac","clean","VAC-B"); live.week = 60;
    const noneLive = A.offerYard(live);
    const sold = mk(); sold.h.lineage.sold = "someone"; const noneSold = A.offerYard(sold.d);
    const away = mk(); away.d.city = "nuceria"; const noneAway = A.offerYard(away.d);
    /* 4 — the bay does not hand it to a stranger while the question stands */
    const held = mk();
    held.d.flags.bayDue = held.d.week - 1;
    held.d.askYard = A.offerYard(held.d);
    const liveBefore = A.liveRivals(held.d).length;
    A.bayRefill(held.d);
    const liveAfter = A.liveRivals(held.d).length;
    /* 5 — taking it: the coin, the standing, the men */
    const buy = mk("fond");
    const y = A.offerYard(buy.d);
    const g0 = buy.d.gold, f0 = buy.d.favor, r0 = A.activeG(buy.d).length;
    const stood = (buy.h.fighters||[]).length;
    const took = A.buyYard(buy.d, true, y);
    const cap = A.cellsCap(buy.d);
    /* a broken house sends unwilling men */
    const brk = mk("broken");
    const yb = A.offerYard(brk.d);
    const mine0 = new Set(A.activeG(brk.d).map(g=>g.id));
    A.buyYard(brk.d, true, yb);
    const came = A.activeG(brk.d).filter(g=>!mine0.has(g.id));
    const fondBuy = A.activeG(buy.d).filter(g=>g.fromYard);
    /* 6 — a house with no coin cannot, and declining leaves it for the bay */
    const poor = mk(); const yp = A.offerYard(poor.d); poor.d.gold = 10;
    const okPoor = A.buyYard(poor.d, true, yp);
    const shy = mk(); const ys = A.offerYard(shy.d); shy.d.favor = 0;
    const okShy = A.buyYard(shy.d, true, ys);
    const pass = mk(); const yq = A.offerYard(pass.d);
    A.buyYard(pass.d, false, yq);
    return {
      lin:{ worth:lin.worth, walls:lin.walls, men:lin.men, roster:(lin.roster||[]).length, trueWorth },
      price:{ asked:o1 ? o1.price : null, again:!!o2, discount:A.YARD_DISCOUNT,
        raw:(lin.worth||0)+(lin.walls||0) },
      gates:{ noneLive:!noneLive, noneSold:!noneSold, noneAway:!noneAway },
      bay:{ liveBefore, liveAfter, held: liveAfter === liveBefore },
      buy:{ took, spent:g0 - buy.d.gold, price:y ? y.price : null, favourSpent:f0 - buy.d.favor,
        stood, roster: A.activeG(buy.d).length - r0, cap, tagged:fondBuy.length,
        sold: buy.h.lineage.sold, emptied:(buy.h.fighters||[]).length === 0 },
      willing:{ fond: fondBuy.length ? Math.round(fondBuy.reduce((n,g)=>n+g.morale,0)/fondBuy.length) : null,
        broke: came.length ? Math.round(came.reduce((n,g)=>n+g.morale,0)/came.length) : null,
        fondDef: fondBuy.length ? Math.round(fondBuy.reduce((n,g)=>n+(g.defiance||0),0)/fondBuy.length) : null,
        brokeDef: came.length ? Math.round(came.reduce((n,g)=>n+(g.defiance||0),0)/came.length) : null },
      refuse:{ poor:okPoor, poorKept: poor.h.lineage.sold !== "you",
        shy:okShy, shyKept: shy.h.lineage.sold !== "you",
        passed: pass.h.lineage.sold !== "you" },
      favour:A.YARD_FAVOUR };
  });
  if(out.why) return { pass:false, why:out.why, lines:[out.why] };

  const L = out.lin, P = out.price, G = out.gates, B = out.bay, U = out.buy, W = out.willing, R2 = out.refuse;
  lines.push(`the lineage: ${L.men} men, ${L.roster} of them named, worth ${L.worth}d (the fighters `
    + `came to ${L.trueWorth}d) · walls ${L.walls}d`);
  if(L.worth !== L.trueWorth) bad.push(`the lineage says the men were worth ${L.worth} and \`gladValue\` `
    + `over the same fighters says ${L.trueWorth} — the price the letter quotes has to be the men who `
    + `were standing there, which is the whole of phase 1`);
  if(L.roster !== L.men) bad.push(`${L.men} men closed with the house and ${L.roster} are named on the `
    + `lineage — \`closeHouse\` kept a COUNT before this and the fighters were left where they lay`);

  lines.push(`the price: ${P.asked}d against ${P.raw}d of men and walls (discount ${P.discount}) `
    + `· put twice ${P.again}`);
  if(P.asked == null) bad.push(`no letter was raised for a yard that has been dark since last week`);
  if(P.again) bad.push(`the letter is raised again for a yard already put to the player — it would `
    + `arrive every week of the seven the yard stands dark`);
  if(P.asked != null && !(P.asked < P.raw)) bad.push(`the yard is priced at ${P.asked} against ${P.raw} `
    + `of men and walls, so it is NOT a distressed sale. Priced at what the men are worth it came to a `
    + `median of 10,586 against 5,064 in the box, and was refused 15 times out of 15 — a letter `
    + `offering a thing nobody can buy is a taunt`);

  lines.push(`the gates: a living house ${G.noneLive} · an already-sold yard ${G.noneSold} · a house `
    + `on the road ${G.noneAway}`);
  for(const [k, why] of [["noneLive","a house that has not closed"],["noneSold","a yard already sold on"],
      ["noneAway","a house away in a town, which cannot take a gate in Capua"]])
    if(!G[k]) bad.push(`the yard letter is raised for ${why}`);

  lines.push(`the bay holds while he decides: ${B.liveBefore} live before, ${B.liveAfter} after`);
  if(!B.held) bad.push(`\`bayRefill\` handed the yard to a stranger in the same week the question was `
    + `standing in front of the player — the window is about seven weeks and this makes the letter a taunt`);

  lines.push(`taking it: paid ${U.spent}d of ${U.price} and ${U.favourSpent} standing · ${U.stood} men `
    + `stood there, ${U.roster} came up the hill (cells hold ${U.cap}) · marked sold "${U.sold}"`);
  if(!U.took) bad.push(`a house with 60,000d and 90 favour could not take the yard`);
  if(U.spent !== U.price) bad.push(`the yard cost ${U.spent} and the letter said ${U.price}`);
  if(U.favourSpent !== out.favour) bad.push(`taking the yard spent ${U.favourSpent} standing against the `
    + `${out.favour} the letter names`);
  if(U.sold !== "you") bad.push(`the yard was taken and its lineage is not marked sold to you, so \`lastDark\` `
    + `would offer it again next week`);
  if(!U.emptied) bad.push(`the men are on your roster AND still on the dead house's record`);
  if(!(U.roster > 0)) bad.push(`the yard was bought and not one man came up the hill`);
  if(U.roster > U.cap) bad.push(`${U.roster} men came into cells that hold ${U.cap} — phase 3 would be the `
    + `second yard that holds them, and without it the overflow is sold on at the gate`);
  if(U.tagged !== U.roster) bad.push(`${U.roster} men came and ${U.tagged} carry \`fromYard\` — the tag is `
    + `how a roster view could ever say which gate a man walked in through`);

  lines.push(`willing or not: a house sold up sends men at morale ${W.fond} (defiance ${W.fondDef}) · one `
    + `you finished sends them at ${W.broke} (defiance ${W.brokeDef})`);
  if(!(W.broke < W.fond)) bad.push(`the men of a house you BROKE arrive as glad as the men of one that `
    + `sold up (${W.broke} against ${W.fond}) — \`lineage.endedAs\` is the item's own term for this and `
    + `it is not being read`);
  if(!(W.brokeDef > W.fondDef)) bad.push(`the men of a broken house are no more defiant than the rest`);

  lines.push(`refused: no coin ${!R2.poor && R2.poorKept} · no standing ${!R2.shy && R2.shyKept} `
    + `· let it go ${R2.passed}`);
  if(R2.poor || !R2.poorKept) bad.push(`a house with 10 denarii took the yard`);
  if(R2.shy || !R2.shyKept) bad.push(`a house with no standing at the magistrate took the yard — the item `
    + `asks for coin AND a favour, and a gate that cannot shut is decoration`);
  if(!R2.passed) bad.push(`letting the bay have it still marked the yard sold to you`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
