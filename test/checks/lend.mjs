/* A HOUSE THAT CANNOT PAY DOES NOT GO TO MARKET — #244's verify-first.

   (`lend` was free in both directories; checked before writing.)

   #244 wants the player to lend to a rival, and it names what has to be true first: *"Demand: count
   the weeks a rival's `form` falls a third in a season. If no house is ever short, nobody borrows."*
   Its phase 1 — a purse to lend against — shipped as #256, so the question could be asked of the
   money rather than of `form` standing in for it. `probes/lend.mjs` asked it, and found a bug
   underneath first.

   `rivalWeekly` refills every rival to a floor of four fighters, free, every week. `rivalShort` sells a
   house's least valuable man to make the week. THEY WERE IN DIRECT CONTRADICTION AND THE LADDER
   LOST: the sale was undone the same week by a free recruit the house then had to feed at
   `RIVAL_KEEP`, so the roster never fell to the two the doctore rung waits for, `h.under` climbed
   for ever, and `closeHouse(d, h, "broke")` — an ending #256 shipped — was UNREACHABLE THROUGH
   PLAY: **0 firings in 3,146 weeks.** `coffer` passed throughout because it calls `closeHouse`
   itself rather than waiting for the ladder to arrive at it. Traced on House Rufinus: a man sold at
   week 312, then four men and a doctore for sixteen weeks while the purse fell from -35 to -3,776
   at about a thousand a week. Men left rival rosters 297 times in that run and joined 341 times.

   One clause — a house underwater does not recruit — and the ladder terminates:

     weeks a house spends underwater   median 8, max 46   ->   median 2, max 11
     how deep it gets                  median -1,150      ->   median -239
     houses closed broke, in play      0                  ->   1

   THREE ARMS. Two read straight off a forced state, one played.

   1 · THE CLAUSE ITSELF, BOTH WAYS. A house under water and below the floor gains nobody over a
       week; the same house with coin in the purse fills back up to four. One without the other is
       not the fix — the first alone would be a bay that never recruits.
   2 · AND THE DEBT IS BOUNDED. Over a played run, no house sits underwater for longer than the
       ladder needs to walk its three rungs — read off `h.under`, which is the count `rivalShort`
       keeps and the one the third rung waits on. The DEPTH is deliberately not asserted here: the
       week is charged and answered inside one call, so a purse sampled from outside is almost never
       seen below zero, and a first draft of this arm read 0 spells over 1,997 weeks while `under`
       was reaching 4. `probes/lend.mjs` reads the depth from within.
   3 · AND THE LADDER STILL SELLS. The first rung has to keep working, or arm 1 has bought a bounded
       debt by freezing the whole mechanism. */
import { found, clearAll, installRope } from "../harness.mjs";

const HOUSES = 12, WEEKS = 420;
const UNDER_CAP = 26;      /* longest spell underwater; measured max 11 after, 46 before */

export const name = "lend";
export const describe = "a rival that cannot make the week stops buying men, so its debt ends somewhere";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"LEND-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","rivalPurse","rivalOutgo","rivalShort","rivalWeekly","closeHouse","RIVAL_KEEP"]
      .filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };

    /* 1 · the clause, both ways — one week of `rivalWeekly` on a house held at two men */
    const oneWeek = (purse) => {
      const d = A.newGameState("Bay", "clean", "LENDCHK-BAY");
      const h = (d.rivals||[])[0];
      if(!h) return { why:"a founding house has no rivals" };
      h.fighters = (h.fighters||[]).slice(0, 2);
      h.purse = purse;
      const before = h.fighters.length;
      try { A.rivalWeekly(d); } catch(e){ return { why:`rivalWeekly threw: ${e.message}` }; }
      const now = (d.rivals||[]).find(x=>x.name===h.name);
      return { before, after: (now && now.fighters || []).length };
    };
    const broke = oneWeek(-500), flush = oneWeek(4000);

    /* 2 & 3 · the played run */
    const t = { weeks:0, spells:[], deepest:[], sold:0, closedBroke:0, maxUnder:0 };
    for(let hh=0; hh<H; hh++){
      const d = A.newGameState("Ln"+hh, "clean", `LENDCHK-${hh}`);
      const run = {}, seenSold = {}, seenClosed = {}, men = {};
      for(let w=0; w<W; w++){
        if(d.over) break;
        t.weeks++;
        for(const h of (d.rivals||[])){
          if(h.retired){ if(!seenClosed[h.name]){ seenClosed[h.name]=1; if(h.endedAs==="broke") t.closedBroke++; } continue; }
          const purse = A.rivalPurse(h), n = (h.fighters||[]).length;
          if(men[h.name] != null && n < men[h.name]) t.sold += men[h.name] - n;
          men[h.name] = n;
          t.maxUnder = Math.max(t.maxUnder, h.under || 0);
          /* ---- READ `h.under`, NOT THE PURSE ----
             `rivalPurseWeek` charges the week and `rivalShort` answers it inside the same call, so
             a purse sampled from outside is almost never seen below zero — this arm read 0 spells
             over 1,997 weeks while `h.under` was reaching 4. `under` is the count `rivalShort`
             keeps for exactly this, and it is the number the third rung waits on. */
          if((h.under||0) > 0){
            run[h.name] = run[h.name] || { weeks:0, deep:0 };
            run[h.name].weeks = h.under; run[h.name].deep = Math.min(run[h.name].deep, purse);
          } else if(run[h.name]){ t.spells.push(run[h.name].weeks); t.deepest.push(Math.round(run[h.name].deep)); run[h.name]=null; }
        }
        try { R.lanista(d); } catch(e){ break; }
      }
      for(const k of Object.keys(run)) if(run[k]){ t.spells.push(run[k].weeks); t.deepest.push(Math.round(run[k].deep)); }
    }
    return { broke, flush, t };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { broke, flush, t } = r;
  if(broke.why || flush.why) return { pass:false, why: broke.why || flush.why, lines };
  const longest = t.spells.length ? Math.max(...t.spells) : 0;

  lines.push(`one week of the bay's recruiter on a house held at two men: underwater ${broke.before} → ${broke.after} men, `
    + `with coin in the purse ${flush.before} → ${flush.after}`);
  lines.push(`${t.weeks} weeks played · ${t.spells.length} spells underwater, longest ${longest} `
    + `[cap ${UNDER_CAP}; measured max 11 after the fix, 46 before] — the DEPTH is not read here, `
    + `because \`rivalShort\` answers the week inside the same call that charges it and a purse `
    + `sampled from outside is never seen below zero; \`probes/lend.mjs\` reads it from within`);
  lines.push(`  ${t.sold} men sold off rival rosters · ${t.closedBroke} houses closed broke · the longest any house `
    + `was left underwater was ${t.maxUnder} weeks`);

  /* 1 */
  if(broke.after > broke.before)
    bad.push(`a house that cannot make the week recruited anyway (${broke.before} → ${broke.after} men) — `
      + `\`rivalWeekly\`'s floor of four and \`rivalShort\`'s sale are in direct contradiction without this `
      + `clause, and the sale loses: the man comes straight back, free, and is then fed at RIVAL_KEEP. `
      + `That is what made \`closeHouse(d, h, "broke")\` unreachable in 3,146 weeks of play`);
  if(flush.after <= flush.before)
    bad.push(`a house WITH money in the purse did not recruit either (${flush.before} → ${flush.after} men) — `
      + `the clause was meant to stop a broke house going to market, not to stop the bay recruiting at `
      + `all, and a bay that never fills up is a slower version of the same bug`);
  /* 2 */
  if(longest > UNDER_CAP)
    bad.push(`a house sat underwater for ${longest} weeks [cap ${UNDER_CAP}] — the ladder is three rungs and `
      + `walks one a week, so a spell longer than this means a rung is not being reached and the debt `
      + `has no end, which is the state #244's verify-first found`);
  /* 3 */
  if(!t.sold)
    bad.push(`not one man was sold off a rival roster in ${t.weeks} weeks — \`rivalShort\`'s first rung is the `
      + `mechanism arm 1 protects, and if it has stopped firing the bound above is being met by nothing `
      + `ever going wrong rather than by the ladder working`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`a broke house stops buying, the ladder walks, and the debt ends somewhere`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
