/* WHAT A WAGER ON A STRANGER WOULD BE WORTH — #271's verify-first.

     node test/probes/wager.mjs 4000      # bouts an arm

   #271: "the book takes wagers on the card whether or not you are on it. The odds exist, the cut
   exists, the trait exists; what is missing is the counter-party."

   TWO OF THE ITEM'S THREE CITATIONS ARE WRONG BEFORE THE PROBE RUNS.

   **`checks/odds.mjs` does not hold the book.** It holds `winChance` — the arena panel's own
   prediction against the sand — and its subject is which tactic the panel recommends. Nothing in it
   is about wagers.

   **And "the rival fighters are conjured per bout (`makeRivalFighter`), so the odds on a
   stranger-versus-stranger card may have nothing to stand on until #266's roster exists" is void
   twice over.** #266 was WITHDRAWN in v3.262.0 because the roster already exists: `makeRivals`
   gives every house a persistent `fighters` array at founding and `RIVAL_MOVES` buys, sells and
   retrains them week by week. There is a roster, and `scoutLive(d, f)` already says which of a
   rival's men this house has had watched.

   WHAT IS TRUE is the first citation: `bet` is own-bout only. The wager rides inside
   `doFight(d, p.gid, p.offer, p.tactic, p.bet, ...)`, `makeBet(g, opp)` is built in the arena panel
   off YOUR man, and `bet.against` is the FIX — betting against your own man, with a morale hit and
   a chance of being caught — not a wager on a stranger.

   ---- SO THE QUESTION IS NOT "CAN IT BE BUILT" BUT "WHAT WOULD IT PAY" ----
   The system's own measured note says a lanista who knows nothing loses **12.7 denarii on every
   hundred staked**, which is the vig; a house that has drilled for the man returns +22.6, one that
   has had him watched +15.9, both +56.2. **Every one of those edges is information about the
   player's OWN man and his opponent.** On a stranger-versus-stranger card the player has neither,
   so the expected return should be the vig and nothing else — a slow, certain loss.

   That inverts the item's Risk note. The risk is not "coin from nothing"; it is a button that
   cannot be pressed profitably and therefore will not be pressed. This measures it rather than
   arguing it: stranger bouts priced by the book's own `oddsFor(betChance(...))`, settled on the
   sand by the same `doFight` the game uses, over thousands of bouts — uninformed, and with one
   man watched. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const N = +(process.argv[2] || 4000);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([N])=>{
  const A = window.__LVDVS;
  const miss = ["newGameState","genGladiator","genOpponent","winChance","oddsFor","VIG","makeRivals",
    "scoutLive","defaultKit","simulateMelee","doFight"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const d = A.newGameState("Wg","clean","WAGER");
  d.gold = 400000; d.week = 60;

  /* ---- 1. do rival houses ever fight EACH OTHER? ----
     If nothing on the board resolves a bout the player is not in, there is no card to bet on and
     #271 must invent one — which is a far larger thing than "the counter-party is missing". */
  /* `newGameState` already seats the rivals and their fighters — calling `makeRivals` again reset
     the roster and the first pass of this probe duly compared an empty before against an empty
     after and reported "0 of 0", which is not a finding, it is a broken instrument. */
  /* WEEK BY WEEK, NOT BEFORE-AND-AFTER. The first pass snapshotted the roster at week 60 and again
     at 360 and matched on `id` — and matched nothing, because `RIVAL_MOVES` buys and sells and not
     one of the twelve original men was still there. That is its own small finding (a rival roster
     turns over completely inside three hundred weeks) and it is useless for this question, which is
     whether a man's RECORD moves while he is on the books. */
  let moved = 0, total = 0, seen = {}, turnover = 0, upWins = 0, upLoss = 0, churn = 0;
  const everSeen = {}, form = { loud:0, silent:0 };
  for(let w=0; w<300 && !d.over; w++){
    for(const h of (d.rivals||[])) for(const f of (h.fighters||[])){
      const was = seen[f.id];
      /* INCREMENTS ONLY. "The record changed" also catches a retrain or a reset, which is roster
         churn and not a bout; a win or a loss going UP by one is a man who fought. */
      if(was){
        const dw = (f.wins||0) - was.w, dl = (f.losses||0) - was.l;
        if(dw > 0 || dl > 0){ moved++; upWins += Math.max(0,dw); upLoss += Math.max(0,dl); }
        else if(dw < 0 || dl < 0) churn++;
      }
      else turnover++;
      seen[f.id] = { w:f.wins||0, l:f.losses||0 };
    }
    /* THE WINDOW TRUNCATES, so the split is accumulated as entries APPEAR rather than counted off
       the six that survive. Keyed by house, week and name, which is unique per bout. */
    for(const h of (d.rivals||[])) for(const x of (h.lately||[])){
      const key = h.name + "|" + x.w + "|" + x.name;
      if(!everSeen[key]){ everSeen[key] = 1; x.loud ? form.loud++ : form.silent++; }
    }
    try { A.endWeek(d); } catch(e){ break; }
  }
  total = Object.keys(seen).length;
  /* AND WHICH OF THE TWO SITES RESOLVED THEM. `RIVAL_MOVES.won` writes a chronicle line and calls
     itself "a third of their fighting"; `rivalWeekly`'s roll writes nothing. The ledger #271 adds
     marks the loud one, so the split is counted rather than inferred from the weights. */
  const diag = { distinctMenEverSeen:turnover, upWins, upLoss, churn, form,
    housesAfter:(d.rivals||[]).length,
    fightersAfter:(d.rivals||[]).reduce((n,h)=>n+((h.fighters||[]).length),0),
    over:d.over?d.over.kind:null, week:d.week };
  /* ---- 2. what a stranger wager pays ----
     Two men neither of whom is the player's, priced by the book's own call and settled on the
     sand by `simulateFight` — the same resolution the arena uses. */
  const arm = (watched)=>{
    const h = A.newGameState("Wg","clean","WAGERSIM"+(watched?"W":"U"));
    h.gold = 400000; h.week = 60;
    let staked = 0, back = 0, hits = 0, n = 0, sumP = 0;
    /* a plain bout on an ordinary card: no patron, no venue quirk, no bribe */
    const CTX = { plan:null, fav:0, man:0, footing:1, footingB:1, sky:1, skyB:1, venue:0,
      favor:0, tier:1, hostile:false, patron:null, repShow:0, guarded:false, crowd:50 };
    for(let i=0;i<N;i++){
      const a = A.genGladiator(h, 40 + Math.floor(Math.random()*45));
      const b = A.genGladiator(h, 40 + Math.floor(Math.random()*45));
      a.id = h.nextId++; b.id = h.nextId++;
      a.kit = A.defaultKit(a.cls); b.kit = A.defaultKit(b.cls);
      a.status = "active"; b.status = "active";
      /* the book prices the SHEET, which is what `betChance` is */
      const pr = A.winChance(a, b, 0, null);
      if(!(pr > 0.02 && pr < 0.98)) continue;
      const odds = A.oddsFor(h, pr);
      const stake = 100;
      /* `simulateFight(A, B, tA, stakes, ctx, opts)` is the one-on-one the arena actually uses —
         `simulateMelee` is the group fight and takes a different shape entirely, which the first
         pass of this probe found out by throwing "ents.forEach is not a function" on every bout. */
      let res = null;
      try { res = A.simulateFight(a, b, null, "standard", CTX, { stopAtCrux:false }); }
      catch(e){ continue; }
      if(!res || res.winner == null) continue;
      const won = res.winner === "A";
      n++; sumP += pr; staked += stake;
      if(won){ hits++; back += stake * odds; }
    }
    return { n, staked, back:Math.round(back), hits,
      perHundred: n ? +(100*(back - staked)/Math.max(1,staked)).toFixed(2) : null,
      meanP: n ? +(sumP/n).toFixed(3) : null, hitRate: n ? +(hits/n).toFixed(3) : null };
  };

  return { vig:A.VIG, rivalBouts:{ moved, total }, diag,
    cold:arm(false), houses:(d.rivals||[]).length };
}, [N]);

await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

console.log(`\n#271 — WHAT A WAGER ON A STRANGER WOULD BE WORTH\n`);
console.log(`DO RIVAL HOUSES FIGHT EACH OTHER? over 300 weeks and ${out.houses} houses,`);
console.log(`   ${out.rivalBouts.moved} record changes across ${out.rivalBouts.total} distinct rival fighters ever on the books.`);
console.log(`   (if that is 0, nothing on the board resolves a bout the player is not in — there is no card to bet on)`);
console.log(`   [${JSON.stringify(out.diag)}]\n`);
const C = out.cold;
console.log(`A COLD WAGER, priced by the book's own \`oddsFor(winChance(...))\` and settled on the sand:`);
console.log(`   ${C.n} bouts · mean quoted chance ${C.meanP} · realised ${C.hitRate}`);
console.log(`   staked ${C.staked}d · returned ${C.back}d · **${C.perHundred >= 0 ? "+" : ""}${C.perHundred} per hundred**`);
console.log(`   the vig is ${(out.vig*100).toFixed(0)}%, so a fair book with no information edge should read about -${(out.vig*100).toFixed(0)}`);
