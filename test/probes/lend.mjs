/* IS ANYBODY SHORT ENOUGH TO BORROW — #244, the verify-first.

   (`lend` is free in both directories; checked before writing, because v3.210.0 overwrote two files
   that were not.)

   #244 wants the player to be able to lend to a rival house, and it says plainly what has to be true
   first: *"Demand: count the weeks a rival's `form` falls a third in a season — the `sell` move's
   trigger — over 16 x 420. If no house is ever short, nobody borrows."*

   Its phase 1 — *"a purse to lend against, #256 in its minimal form"* — SHIPPED as #256 itself
   (v3.211.0-v3.213.0), so the model the item said was missing is here: `rivalPurse`, `rivalOutgo`,
   `rivalWeeks`, and `rivalShort`'s ladder — sell the least valuable man, then let the doctore go,
   then `closeHouse(d, h, "broke")`. That means the demand question can be asked of the money itself
   rather than of `form` standing in for it, which is what the item was reduced to when it was
   written. Both are measured here, the money first.

     1 · THE HOLE. Per rival house per week: the purse, what the week costs them, and the weeks of
         runway that leaves. `rivalShort` fires only on a purse BELOW ZERO — `h.under` counts the
         consecutive weeks underwater — so that, and not `rivalBroke`'s softer 400, is the state a
         loan would answer. Spells, their length, and how deep they go.

     2 · WHAT IT COST THEM. The ladder is three rungs and each is a real loss: a man sold out of
         Capua, the doctore let go, the yard closed. Counted, with the sum that would have carried
         the house past the rung — which IS the loan #244 is asking for, and the first honest
         estimate of its size.

     3 · AND COULD THE PLAYER HAVE PAID IT? A lending system needs demand and supply to coincide.
         At each moment a house goes under, what the player has in the box against what the hole
         costs, and — the number that decides whether the system is reachable at all — the share of
         those moments where the player could have covered it without going short himself.

     4 · AND THE ITEM'S OWN TRIGGER, in its own terms: a rival's `form` falling by a third across a
         thirteen-week season. Reported beside the money so the item's sentence can be checked
         against the thing it was standing in for.

     node test/probes/lend.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "LEND";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","rivalPurse","rivalOutgo","rivalWeeks","rivalBroke","PURSE_SHORT",
                "weeklyBill","lanistaOf","LENDERS"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };

  const t = { weeks:0, houseWeeks:0,
    under:0, broke:0, spells:[], deepest:[], outgo:[], runway:[],
    soldAMan:0, lostDoctore:0, closedBroke:0, closedOther:0,
    holes:[], holesWithAir:[], boxAtHole:[], couldCover:0, couldCoverWithAir:0, holeMoments:0,
    formSeasons:0, formFell:0, playerBill:[], playerFame:[], rivalFame:[] };

  for(let hh=0; hh<H; hh++){
    const d = A.newGameState("Ln"+hh, "clean", `${SEED}-${hh}`);
    const run = {}, seenSold = {}, seenDoc = {}, seenClosed = {}, formHist = {};
    for(let w=0; w<W; w++){
      if(d.over) break;
      t.weeks++;
      /* the player's own week, beside theirs — `rivalOutgo` is 0.12 x fame and the player's bill is
         not, so whether a rival's costs are even the same ORDER as the player's decides whether the
         air a loan would have to buy is a real price or a tuning fault */
      t.playerBill.push(Math.round(A.weeklyBill(d)));
      t.playerFame.push(Math.round(d.fame||0));
      for(const h of (d.rivals||[])){
        if(h.retired){
          if(!seenClosed[h.name]){ seenClosed[h.name] = 1;
            if(h.endedAs === "broke") t.closedBroke++; else t.closedOther++; }
          continue;
        }
        t.houseWeeks++;
        const purse = A.rivalPurse(h), out = A.rivalOutgo(h), rw = A.rivalWeeks(h);
        t.outgo.push(Math.round(out)); t.rivalFame.push(Math.round(h.fame||0));
        if(rw != null && isFinite(rw)) t.runway.push(Math.round(rw));
        if(A.rivalBroke(h)) t.broke++;
        /* 1 · the hole itself: rivalShort's own gate is a purse below zero */
        if(purse < 0){
          t.under++;
          if(!run[h.name]){ run[h.name] = { weeks:0, deepest:0 };
            /* 3 · the moment it opens — what would carry them, and has the player got it? */
            t.holeMoments++;
            /* ---- THE DEBT AND THE AIR ARE DIFFERENT SUMS, AND THE FIRST DRAFT ADDED THEM ----
               It reported one figure, `-purse + outgo x 8`, and every house came out around 7,000
               — because outgo is 0.12 x fame a week and a famous house spends near a thousand of
               it, so "eight weeks of air" swamped the debt and the number said more about the
               house's fame than about what it owed. The debt is what a loan CLEARS; the air is
               what it BUYS. Kept apart, and both carried, because #244 has to choose between
               them and the choice is the design. */
            const debt = Math.round(-purse);
            t.holes.push(debt);
            t.holesWithAir.push(Math.round(debt + out * 8));
            const box = Math.round(d.gold), keep = Math.max(700, A.weeklyBill(d) * 12);
            t.boxAtHole.push(box);
            if(box - keep >= debt) t.couldCover++;
            if(box - keep >= debt + out * 8) t.couldCoverWithAir++;
          }
          run[h.name].weeks++;
          run[h.name].deepest = Math.min(run[h.name].deepest, Math.round(purse));
        } else if(run[h.name]){ t.spells.push(run[h.name].weeks); t.deepest.push(run[h.name].deepest); run[h.name] = null; }
        /* 2 · the rungs */
        if(h.soldToLive && !seenSold[h.name]){ seenSold[h.name] = 1; t.soldAMan++; }
        if(h.doctore === false && seenDoc[h.name] === undefined) seenDoc[h.name] = "no";
        else if(h.doctore && seenDoc[h.name] === "no"){ seenDoc[h.name] = "back"; }
        /* 4 · the item's own trigger, in its own terms */
        const fh = formHist[h.name] = formHist[h.name] || [];
        fh.push(h.form || 0);
        if(fh.length > 13){
          const then = fh[fh.length - 14], now = h.form || 0;
          t.formSeasons++;
          if(then > 0 && now <= then * (2/3)) t.formFell++;
        }
      }
      try { R.lanista(d); } catch(e){ break; }
    }
    for(const k of Object.keys(run)) if(run[k]){ t.spells.push(run[k].weeks); t.deepest.push(run[k].deepest); }
  }
  /* the doctore let go: counted by houses that had one and stopped having one */
  const pc = (v, n) => n ? Math.round(1000*v/n)/10 : 0;
  return {
    weeks:t.weeks, houseWeeks:t.houseWeeks,
    hole: { underPc: pc(t.under, t.houseWeeks), brokePc: pc(t.broke, t.houseWeeks),
      spells: q(t.spells), deepest: q(t.deepest.map(x=>-x)),
      weekCosts: q(t.outgo), runwayWeeks: q(t.runway) },
    theTwoSidesOfTheBay: { aRivalsWeek: q(t.outgo), aRivalsFame: q(t.rivalFame),
      thePlayersWeek: q(t.playerBill), thePlayersFame: q(t.playerFame) },
    ladder: { housesThatSoldAMan:t.soldAMan, closedBroke:t.closedBroke, closedOtherwise:t.closedOther },
    market: { momentsAHouseWentUnder:t.holeMoments,
      theDebtItself:q(t.holes), thatPlusEightWeeksOfAir:q(t.holesWithAir),
      theBoxAtThatMoment:q(t.boxAtHole),
      couldClearTheDebt:t.couldCover, clearPc: pc(t.couldCover, t.holeMoments),
      couldClearItAndBuyTheAir:t.couldCoverWithAir, airPc: pc(t.couldCoverWithAir, t.holeMoments) },
    itemsOwnTrigger: { seasons:t.formSeasons, formFellByAThird:t.formFell, pc: pc(t.formFell, t.formSeasons) } };
}, [H,W,SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
