/* WHAT ACTUALLY ENDS A HOUSE — AND THE NUMBER THE REFERENCE CARRIED WAS WRONG.

   Three answers to one question were on record and they disagreed. The balance reference said
   **debt is 85% of endings** and "the ledger is the competent player's only enemy". v2.68.1 found
   the first 26 weeks kill by the yard emptying with coin still in the box. The v2.72.0 careless
   sweep put all 24 houses out — 16 emptied, 8 in debt. Each was measured on a different policy
   over a different span, and the reference carried only the first as though it were the game's.

   MEASURED, #110: five policies, every opening, 400 weeks, 20 houses each, no arm ever handed a
   denarius, and the week's question answered identically in every arm so the arms differ by how
   the yard is run. Over two independent runs of 100 houses:

     debt across all five arms   69% / 67%      — not 85%
     the first 26 weeks          debt 80% / 78% of early endings, median -277d / -270d in the box
     idle (does nothing)         debt 100% / 100%
     careless (sine, every week) ruin 40% / 40%, debt 15% / 25%
     middling                    debt 90% / 80%
     careful                     debt 60% / 45%, and 3 of 20 / 2 of 20 alive at year 22

   SO THE MIX IS NOT A PROPERTY OF THE GAME, IT IS A PROPERTY OF THE POLICY — which is exactly
   what #110's falsification clause asked. It runs from 100% ledger for a house that does nothing
   to 40% empty yard for a house that fights every bout to the death. The three figures on record
   were never in conflict; they were three policies, and the fault was a reference presenting one
   of them as the answer.

   AND THE DISAGREEMENT WITH `survive` DISSOLVES THE SAME WAY. That check records five of seven
   early failures as the yard emptying with coin in hand. This one measures 78-80% of early
   failures as the ledger, at a median 270 denarii UNDER. Both are right about their own policy:
   a house that replaces its losses dies of the ledger, a house that does not dies of the empty
   yard. Which one you meet is the buying, not the era.

   WHAT THIS CHECK HOLDS is the cheap, stable half — the opening, which is fast to drive and where
   both figures above were reproducible run to run. The long-campaign table above is in the
   roadmap and is NOT asserted here: at twenty houses per arm the LIFESPAN medians swung from 36
   weeks to 20 between two runs of the same policy, so they are not a bar anything should be held
   to. The mix was stable; the medians were not. Only the stable thing is pinned.

   ONE THING DELIBERATELY NOT CLAIMED. Two hundred played houses produced seven of the twelve
   endings the source can set; `oldAge`, `foreclosed`, `ruined`, `closed` and `triumph` did not
   appear. A probe built to reach each one by constructing the state failed its own control — it
   could not reach `debt`, `ruin` or `rebellion` either, which the played sweep produces
   constantly. So whether those five are rare content or dead content is UNRESOLVED, and it is
   written down as unresolved rather than guessed at. */

import { hasHandle } from "../harness.mjs";

export const name = "ends";
export const describe = "how a house ends is decided by the policy, and the ledger dominates the opening";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const SC = A.SC_KEYS || ["clean"];
    const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
    const fin = (fn, args) => { try { return fn(...args); } catch(e){ return null; } };

    /* the rope is not optional: the first draft of the sweep behind this only looked at
       `d.games.offers` and measured ZERO bouts in every arm, so all its policies were the idle
       one wearing different names */
    const takeBout = (d, fit, pick, stakes) => {
      const os = ((d.games && d.games.offers) || []).filter(o=>(!(o.pair||o.melee) || fit.length>=2));
      if(fit.length && os.length){
        const o = pick(os);
        if(o){
          if(o.pair) fin(A.doPairFight, [d,[fit[0].id,fit[1].id],o,"measured",null,null]);
          else if(o.melee) fin(A.doMelee, [d,fit.slice(0,3).map(g=>g.id),o,null,null,"measured"]);
          else if(o.venatio) fin(A.doVenatio, [d,fit[0].id,o,"measured",null,null]);
          else fin(A.doFight, [d,fit[0].id,o,"measured",null,null,null,"none"]);
          return true;
        }
      }
      if(!fit.length) return false;
      if(!d.pitCard || d.pitCard.week !== d.week) A.makePitCard(d);
      const men = A.pitMen(d) || [];
      const o = A.makePitOffer(d, fit[0], stakes, men.length ? men[0].id : null);
      if(!o) return false;
      fin(A.doFight, [d, fit[0].id, o, "measured", null, null, null, "none"]);
      return true;
    };

    /* survive's own discipline and survive's own constants, with its own reason written down
       there: the CHEAPEST man who fills the gap, and only with a month's purse behind him. A
       policy that buys `market[0]` — the top of the block — is the mistake that check already
       records as having ended three houses in debt with men still in the yard. */
    const KEEP = 4, RESERVE = 260;
    const ARMS = {
      proven: d => {
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, (g.fatigue||0) > 55 ? "rest" : "palus");
        if(A.activeG(d).filter(g=>!g.injury).length < KEEP && !A.rosterFull(d)){
          const m = (d.market||[]).filter(x=>x.price <= d.gold - RESERVE).sort((a,b)=>a.price-b.price)[0];
          if(m) A.buyFromBlock(d, m.id, null);
        }
        const fit = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 55).sort((x,z)=>av(z)-av(x));
        takeBout(d, fit, os => os.sort((a,b)=>(b.purse||0)-(a.purse||0))[0], "standard");
      },
      idle: d => {},
    };

    const HOUSES = 24, WEEKS = 40;
    const rows = [];
    let threw = 0, firstThrow = null;
    for(const arm of Object.keys(ARMS)){
      for(let h=0; h<HOUSES; h++){
        const d = A.newGameState("En"+h, SC[h % SC.length], `ENDS-${arm}-${h}`, null);
        for(let w=0; w<WEEKS; w++){
          if(d.over) break;
          try { ARMS[arm](d); } catch(e){ threw++; if(!firstThrow) firstThrow = `${arm}: ${e.message}`; }
          if(d.pendingEvent){ try { A.EVENTS[d.pendingEvent.id].run(d, d.pendingEvent, 0); } catch(e){} d.pendingEvent = null; }
          try { A.endWeek(d); } catch(e){ break; }
        }
        rows.push({ arm, kind: d.over ? d.over.kind : "alive", week:d.week,
          gold:Math.round(d.gold), men:A.activeG(d).length });
      }
    }

    /* A PROBE THAT SWALLOWS ITS OWN THROWS REPORTS THEM AS THE GAME'S BEHAVIOUR — a wrong
       building key once aborted an arm's whole week, bout included, and four policies then died
       inside a year while the table said it was the economy. */
    if(threw) bad.push(`the policies threw ${threw} times, so the arms are not doing what they say — ${firstThrow}`);

    for(const arm of Object.keys(ARMS)){
      const A2 = rows.filter(r=>r.arm===arm);
      const dead = A2.filter(r=>r.kind!=="alive");
      const t = {}; for(const r of dead) t[r.kind] = (t[r.kind]||0)+1;
      const g = dead.map(r=>r.gold).sort((x,y)=>x-y);
      lines.push(`${arm.padEnd(7)} ${dead.length} of ${A2.length} out inside ${40} weeks: `
        + (dead.length ? Object.entries(t).sort((x,y)=>y[1]-x[1]).map(([k,n])=>`${k} ${n}`).join(" · ") : "none")
        + (dead.length ? ` · median coin in the box at the end ${g[Math.floor(g.length/2)]}d` : ""));
    }

    /* ---- 1. THE OPENING IS LETHAL AND IT IS THE LEDGER THAT DOES IT ---- */
    {
      const A2 = rows.filter(r=>r.arm==="proven");
      const dead = A2.filter(r=>r.kind!=="alive");
      if(dead.length < A2.length * 0.25)
        bad.push(`only ${dead.length} of ${A2.length} houses went out in 40 weeks on the proven policy — `
          + `the opening has stopped being lethal, and every figure in the note above was measured `
          + `against an opening that was`);
      const debt = dead.filter(r=>r.kind==="debt").length;
      const share = dead.length ? debt/dead.length : 0;
      if(dead.length >= 6 && share < 0.5)
        bad.push(`the ledger is no longer what ends the opening: ${debt} of ${dead.length} `
          + `(${Math.round(share*100)}%) went out by debt, against 78-80% measured. If the opening `
          + `now kills by the yard emptying, the table in the roadmap is stale`);
      const g = dead.map(r=>r.gold).sort((x,y)=>x-y);
      const med = g.length ? g[Math.floor(g.length/2)] : 0;
      if(dead.length >= 6 && med > 0)
        bad.push(`houses are going out with ${med}d still in the box — measured, the median was `
          + `270 denarii UNDER, which is what makes this the ledger and not attrition`);
    }

    /* ---- 2. AND THE CONTROL: A HOUSE THAT DOES NOTHING DIES OF THE LEDGER, EVERY TIME ----
       this is the end of the range the mix runs over, and it is the half of #110 that says the
       mix belongs to the policy rather than to the game */
    {
      const A2 = rows.filter(r=>r.arm==="idle");
      const dead = A2.filter(r=>r.kind!=="alive");
      const debt = dead.filter(r=>r.kind==="debt").length;
      if(!dead.length) bad.push(`a house that does nothing at all survived 40 weeks ${A2.length} times over`);
      /* 100% over 400 weeks; over 40 weeks it is 11 of 12, because a yard left alone long enough
         will occasionally go over the wall before the ledger closes. The first version of this
         asserted the 400-week figure at 40 weeks and failed on that one house — a bar copied from
         a different span is a bar measured on a different thing. */
      else if(debt < dead.length * 0.75)
        bad.push(`only ${debt} of ${dead.length} idle houses ended by debt `
          + `(the rest: ${[...new Set(dead.filter(r=>r.kind!=="debt").map(r=>r.kind))].join(", ")}) — `
          + `measured, a house that does nothing ends by the ledger 100% of the time over 400 weeks `
          + `and 11 of 12 over 40`);
    }

    /* ---- 3. AND THE THIN GRADIENT, which is the other half of the answer ----
       Over the OPENING the proven policy barely changes whether the house survives at all — 13 of
       24 out against idle's 12 of 24. What competence buys is not the first year; it is the
       ceiling. In the 400-week sweep the careful arm was the only one with houses still standing
       at year 22 (3 of 20, and 2 of 20 on the second run) while every other arm ended 0 of 20.
       So this is recorded, not asserted: if it ever inverts — if doing nothing outlives playing
       well by a wide margin — that is worth knowing and the line below will show it. */
    {
      const pv = rows.filter(r=>r.arm==="proven"), id = rows.filter(r=>r.arm==="idle");
      const outP = pv.filter(r=>r.kind!=="alive").length, outI = id.filter(r=>r.kind!=="alive").length;
      lines.push(`over the opening, playing well barely changes survival: ${outP} of ${pv.length} out `
        + `against ${outI} of ${id.length} doing nothing. What competence buys is the ceiling, not the first year`);
      if(outP > outI + pv.length * 0.3)
        bad.push(`the proven policy is now dying faster than doing nothing (${outP} against ${outI} `
          + `of ${pv.length}) — either the policy has stopped being one or the opening has changed shape`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
