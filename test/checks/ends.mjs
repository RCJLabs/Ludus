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

    /* THE ROPE IS NOT OPTIONAL, AND IT IS NO LONGER LOCAL. The first draft of the sweep behind
       this only looked at `d.games.offers` and measured ZERO bouts in every arm, so all its
       policies were the idle one wearing different names. The version that replaced it had the
       pit but never answered the crux, so **60% of the bouts it did find never happened** —
       `doFight` returns at `res.unfinished` before it credits anything and mutates nothing. That
       is #116's finding about this check, among others, and the rope now lives in the harness
       where `probe` can see that every check uses it. */
    /* ---- AND THE ARMS WERE NOT THE STAKES THEY SAID THEY WERE, until v3.0.0 ----
       `stakes:` was passed to `makePitOffer` and NOWHERE ELSE, so an arm asking for `standard` fought
       76% standard, 9% sine, 8% melee and 7% venatio, and the `sine` arm fought 76% sine — the two
       arms of this check overlapped by about a quarter of their bouts. `wantStakes` shipped in v2.91.0
       to fix exactly that and nothing was ever wired to it. `stakes:` now means "prefer these and take
       the bill anyway", which is what this arm wants (a competent player does not sit a week out), and
       it reads 92% standard. THE STRICT READING WAS TRIED FIRST AND IT KILLED THIS CHECK: refusing every
       week without a standard card took `proven` to 4 of 5 houses out by debt against a measured 0-10%,
       because a house that will not fight is a house that is not paid.
       WHAT THE FIX MOVED HERE, and how much of it is the fix: `proven` over 120 weeks went from 6 of 12
       out (rebellion 4, ruin 2, median fame 560) to 4 of 12 out (rebellion 4, median fame 1,845). The
       direction is what you would expect from an arm that has stopped walking into death matches it
       never asked for. The SIZE is not attributable — filtering the bill changes which offer is picked
       and so reshuffles every RNG draw after it, and `policy` measured fame block-medians spanning 84 to
       4,206 on eight houses of the same build. Direction: the fix. Magnitude: unknown. */
    const takeBout = (d, fit, pick, stakes) =>
      window.__ROPE.takeBout(d, { men:fit, pick, stakes }).ran;

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
      /* ---- #117's ARMS: the long arc, and the one-variable lever comparison ----
         `careless` is here because it is the other end of the range — the fattest purse every week,
         to the death — and `proven+cells` is `proven` with the two unrest levers and NOTHING else
         changed, which is the comparison the published table never had (its only feasting arm also
         built stone, kept a bigger reserve and fought at blood). */
      careless: d => {
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "palus");
        const fit = A.activeG(d).filter(g=>!g.injury);
        takeBout(d, fit, os => os.sort((a,b)=>(b.purse||0)-(a.purse||0))[0], "sine");
      },
      "proven+cells": d => {
        if(d.unrest >= 30) A.throwFeast(d);
        if(d.unrest >= 22) fin(A.walkTheCells, [d]);
        ARMS.proven(d);
      },
    };

    /* ---- HOW THE WEEK'S QUESTION IS ANSWERED IS A VARIABLE, AND IT WAS NOT TREATED AS ONE ----
       Both this check and the published 400-week table answered every question with choice 0, and
       called that a control because it was "identical in every arm". It is not a control. On
       `uprising` — the one event that can end a run — choice 0 is "Meet them with steel", the only
       branch that sets `d.over = rebellion`; choice 1 is the magistrate's guards for 300 denarii,
       worth +80 on the house's side of the roll; choice 2 opens the gates and cannot end the run at
       all. Answering 0 every time both manufactures rebellions and truncates every arm's life, which
       distorts every other figure in the table.

       MEASURED, over 20 houses and 400 weeks: sending for the guards instead moved `proven` from a
       median life of 54 weeks to 183 and its rebellion share from 70% to 40%, and made `lanistaDied`
       the plurality ending — the house now lives long enough for the lanista to grow old. So this
       check answers the night the way a solvent player would, and says so. */
    const answerWeek = (d) => {
      const ev = d.pendingEvent;
      if(!ev) return;
      let i = 0;
      if(ev.id === "uprising"){
        const keys = (ev.data && ev.data.keys) || ["fight"];
        const g = keys.indexOf("guards");
        if(g >= 0) i = g;
        upr[keys[i]] = (upr[keys[i]]||0) + 1;
      }
      try { A.EVENTS[ev.id].run(d, ev, i); } catch(e){}
      d.pendingEvent = null;
    };
    const upr = {};

    const HOUSES = 24, WEEKS = 40;
    const rows = [];
    let threw = 0, firstThrow = null;
    for(const arm of Object.keys(ARMS)){
      for(let h=0; h<HOUSES; h++){
        const d = A.newGameState("En"+h, SC[h % SC.length], `ENDS-${arm}-${h}`, null);
        for(let w=0; w<WEEKS; w++){
          if(d.over) break;
          try { ARMS[arm](d); } catch(e){ threw++; if(!firstThrow) firstThrow = `${arm}: ${e.message}`; }
          answerWeek(d);
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

    /* ---- 1. THE OPENING IS SURVIVABLE IF YOU PLAY, AND IT IS NOT ONLY THE LEDGER ----
       RE-MEASURED IN v2.81.0, AND THE OLD FIGURES WERE THE CRUX TRAP. This arm used to report 13
       of 24 out with a median 272 denarii UNDER, and it asserted both. It was calling `doFight`
       without ever answering the balance, so ~60% of its bouts returned at `res.unfinished`,
       mutated nothing, and paid no purse — an arm that fought hard and was paid for two afternoons
       in five. On the harness rope, with every bout resolved, the same 24 houses read **6 out, and
       the survivors and the dead alike have coin: median +506d in the box.** The endings split
       debt 3 / rebellion 3, so what ends a competent opening is as much the CELLS as the ledger. */
    {
      const A2 = rows.filter(r=>r.arm==="proven");
      const dead = A2.filter(r=>r.kind!=="alive");
      if(!dead.length)
        bad.push(`not one of ${A2.length} houses went out in 40 weeks on the proven policy — the `
          + `opening has stopped costing anything at all, which no measurement of it has ever said`);
      if(dead.length > A2.length * 0.6)
        bad.push(`${dead.length} of ${A2.length} houses went out in 40 weeks on the proven policy, `
          + `where the rope-corrected figure is 6 — a jump that large usually means the arm has `
          + `stopped being paid, so check that every bout is resolved before believing it`);
      const debt = dead.filter(r=>r.kind==="debt").length;
      const unrest = dead.filter(r=>r.kind==="rebellion").length;
      lines.push(`   what ends a house that plays: ledger ${debt}, cells ${unrest}, of ${dead.length} `
        + `— an even split, where the crux-blind version of this arm read 78-80% ledger`);
      if(dead.length >= 4 && !debt && !unrest)
        bad.push(`${dead.length} houses went out on the proven policy and not one by debt or by the `
          + `cells — those are the two that a played opening dies of, 3 and 3 of 6 measured`);
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

    /* ---- 3. AND THE GRADIENT, which the rope turned from thin into real ----
       This used to read 13 of 24 out against idle's 12 and the conclusion was that competence buys
       the ceiling and not the first year. With every bout resolved and paid it is **6 against 12**:
       playing well halves the chance of going out in the opening. The old figure was not a fact
       about the game, it was a policy that fought and was paid for two afternoons in five. In the 400-week sweep the careful arm was the only one with houses still standing
       at year 22 (3 of 20, and 2 of 20 on the second run) while every other arm ended 0 of 20.
       So this is recorded, not asserted: if it ever inverts — if doing nothing outlives playing
       well by a wide margin — that is worth knowing and the line below will show it. */
    {
      const pv = rows.filter(r=>r.arm==="proven"), id = rows.filter(r=>r.arm==="idle");
      const outP = pv.filter(r=>r.kind!=="alive").length, outI = id.filter(r=>r.kind!=="alive").length;
      lines.push(`over the opening, playing well roughly a third fewer: ${outP} of ${pv.length} out `
        + `against ${outI} of ${id.length} doing nothing (crux-blind this read 13 against 12; PAIRED `
        + `on one seed at n=60 it is 17 against 28, so "halves" was the unpaired version of it)`);
      if(outP >= outI)
        bad.push(`the proven policy is dying at least as fast as doing nothing (${outP} against `
          + `${outI} of ${pv.length}) — with every bout resolved it goes out half as often, so this `
          + `reads as the arm no longer being paid, or no longer fighting`);
    }

    /* ================= 4. THE LONG ARC, AND THE TABLE IT REPLACES =================
       #117. The roadmap carried a five-policy 400-week table saying debt ends 60-90% of every
       playing policy and 100% of an idle one, and that "the ledger is the competent player's only
       enemy". It was produced by the crux-blind sweep: every arm fought hard and was paid for two
       afternoons in five. Re-run on the rope over 400 weeks and 20 houses, twice, plus 160 and 120
       week runs, the shape INVERTS for anybody who fights:

         pooled debt across all arms   26% / 27% / 28%      against a published 69% / 67%
         idle                          100% / 95% / 100% debt — unchanged, and the only ledger death
         proven                        8-10% debt, rebellion 60-75%
         careful                       16-22% debt, rebellion 78-84%
         middling                      10-33% debt, rebellion 58-80%
         careless                      0% debt in every run, the yard emptying 35-58%

       Purses paid mean no debt; bouts fought mean unrest, and unrest is the one number that ends a
       run outright. WHAT IS NOT ASSERTED, because it is not stable: working the cells moved median
       life 54w->159w and 58w->118w on two runs and 74w->41w on a third, so the lever's value is
       reported and not pinned. Its effect on FAME was large in every run and is printed. */
    {
      const LONG = 120, LH = 12;
      const arc = [];
      for(const arm of ["idle","proven","proven+cells","careless"]){
        for(let h=0; h<LH; h++){
          const d = A.newGameState("Ar"+h, SC[h % SC.length], `ARC-${arm}-${h}`, null);
          for(let w=0; w<LONG; w++){
            if(d.over) break;
            try { ARMS[arm](d); } catch(e){ threw++; if(!firstThrow) firstThrow = `${arm}: ${e.message}`; }
            answerWeek(d);
            try { A.endWeek(d); } catch(e){ break; }
          }
          arc.push({ arm, kind:d.over?d.over.kind:"alive", week:d.week, fame:Math.round(d.fame),
            unrest:Math.round(d.unrest) });
        }
      }
      const med = a => { const b=a.slice().sort((x,y)=>x-y); return b.length?b[Math.floor(b.length/2)]:0; };
      const of = arm => {
        const A2 = arc.filter(r=>r.arm===arm), dead = A2.filter(r=>r.kind!=="alive");
        const t = {}; for(const r of dead) t[r.kind]=(t[r.kind]||0)+1;
        return { A2, dead, t, debt:t.debt||0, reb:t.rebellion||0,
          life:med(A2.map(r=>r.week)), fame:med(A2.map(r=>r.fame)) };
      };
      for(const arm of ["idle","proven","proven+cells","careless"]){
        const o = of(arm);
        lines.push(`${arm.padEnd(13)} over ${LONG}w: ${o.dead.length} of ${o.A2.length} out · `
          + (o.dead.length ? Object.entries(o.t).sort((x,y)=>y[1]-x[1]).map(([k,n])=>`${k} ${n}`).join(" · ") : "none")
          + ` · median life ${o.life}w · median fame ${o.fame}`);
      }

      /* ---- the idle end of the range: the ledger, and nothing else ---- */
      { const o = of("idle");
        if(o.dead.length >= 6 && o.debt < o.dead.length * 0.8)
          bad.push(`only ${o.debt} of ${o.dead.length} idle houses ended by debt over ${LONG} weeks — `
            + `measured at 100%, 95% and 100% on three runs, and it is the one policy the ledger `
            + `really does kill`);
      }
      /* ---- and the playing end: NOT the ledger, which is the correction #117 made ---- */
      for(const arm of ["proven","careless"]){
        const o = of(arm);
        if(o.dead.length < 4) continue;
        if(o.debt > o.dead.length * 0.45)
          bad.push(`${o.debt} of ${o.dead.length} \`${arm}\` houses ended by debt over ${LONG} weeks `
            + `(${Math.round(o.debt/o.dead.length*100)}%) — measured at 0-10%, because a bout that is `
            + `resolved is a bout that is PAID. A debt share this high is the signature of the arm no `
            + `longer being paid, which is what the old table was`);
      }
      { const o = of("proven");
        if(o.dead.length >= 4 && o.reb < o.debt)
          bad.push(`\`proven\` ended by debt more often than by the cells (${o.debt} against ${o.reb} `
            + `of ${o.dead.length}) — rebellion is 60-75% of that arm's endings on every run, and it `
            + `is the finding the reference table now carries`);
      }
      { const p = of("proven"), c = of("proven+cells");
        lines.push(`   the levers, one variable: median life ${p.life}w -> ${c.life}w, `
          + `median fame ${p.fame} -> ${c.fame} (life swung 54->159, 58->118 and 74->41 across three `
          + `runs, so it is printed and not pinned; fame rose in all of them)`);
      }
      /* the pooled share depends on the ARM MIX — idle contributes almost all the debt, so four arms
         with one idle read higher than six arms with one. The six-arm sweep read 26% / 27% / 28%;
         this line is that arithmetic on these four and is not the same number. */
      lines.push(`   pooled debt across these four arms: `
        + `${arc.filter(r=>r.kind==="debt").length} of ${arc.filter(r=>r.kind!=="alive").length}, `
        + `nearly all of it idle's — the six-arm sweep read 26% / 27% / 28% against a published 69% / 67%`);
    }

    /* ================= 5. THE ENDINGS NOTHING REACHES, AND WHY =================
       #118. Two hundred played houses produced seven of the twelve endings the source can set, and
       the probe sent after the rest failed its own control. Re-run with a control that works — an
       ordinary house that must end in a way the record already knows, and it does: ruin 4,
       lanistaDied 1, rebellion 1 of 6 — the four are answered:

         foreclosed  REACHABLE, 6 of 6 houses, week 44. Borrow 2,000 (the lender books 1,400 of it as
                     principal), never repay, and `owes(d)` passes four times the principal in about
                     forty-three weeks. Nothing was wrong with it; no sweep policy borrows.
         oldAge      NOT REACHABLE IN PLAY, and the reason is arithmetic. The gate wants
                     `age >= 62 && health >= 45 && d.heir`. Over 3,070 lanista-weeks the man in the
                     chair was 62 or over in 907 of them, and his health was 45 or better in
                     **NONE**. The two conditions do not co-occur, because health decays with the
                     years — and with an heir named, a lanista whose health reaches nought hands over
                     (`d.succession`, 1,135 weeks of it) rather than ending the run. So the ending is
                     written for a man the game does not produce.
         closed      NOT REACHABLE, AND v2.89.0 CORRECTED WHY — the first answer here was a
                     sampling fault of mine. It said the best man in a 500-week house reached **8
                     wins** against a bar of ten, so nothing qualified. That figure was taken over
                     `activeG(d)` — the men standing in the yard at the moment of sampling — and a
                     long-career man is exactly the one most likely to have already left it, freed or
                     buried. Counted over EVERY man who ever served, 8 houses of 400 weeks: best
                     career **43 wins**, best fame **2,414**, and **21 men clear `wins >= 10 &&
                     pfame >= 180` — 2.6 a house.** The rudis is reachable and always was.
                     What blocked `closed` was the OTHER half of its gate, `freed > lost` — AND
                     v2.91.0 TOOK THAT HALF OUT, on a measurement made with the policy the gate is
                     written for rather than the butcher's policy that produced the figures above.
                     20 houses of 600 weeks, fighting properly and freeing every man the moment he
                     earns the rudis: `freed >= 5` came up 2 times in 20, at a median week 359, and
                     `freed > lost` came up NONE. The two clauses are opposed — the rudis wants
                     `wins >= 10 && pfame >= 180`, so a free-able man has fought a great deal, and a
                     house that fights that much buries a median of 28. The only two houses that
                     ever qualified freed 7 of 69 buried (10%) and 5 of 30 (17%), so the best mercy
                     share real play produces is about a sixth and the clause asked for all of it.
                     No ratio replaced it: anything between `freed*5` (admits neither) and `freed*10`
                     (admits both, one by a single man) would be fitted to two data points, which is
                     how `survive` got `MEN = 6`. The count is the mercy test.
                     AND ONE BLOCKER REMAINS, newly measured and NOT fixed: `!alive` needs an
                     emptied yard, and there are only four ways a man leaves — dead, freed (needs the
                     rudis), retired (needs age 31 or a heavy burden of scars), or departed at the end
                     of an auctor contract. **13 of 23 men standing in six real yards could be let go
                     by none of them.** A lanista who wants to shut his house cannot; he can free the
                     earners and retire the old, and the rest he keeps until they die. Giving him a
                     way to release a man is a feature with its own balance questions — unrest, dodged
                     deaths, dumping a bad buy — and it is the roadmap's to decide, not this check's.
         triumph     UNTESTED HERE. It is a choice on the road back from Rome, offered only to a
                     house that got there and won, and no arm in this check reaches fame 1,000.

       WHAT IS ASSERTED is the reachable one, plus TRIPWIRES on the two constants that make the other
       two unreachable. A dead gate must not be locked in place by its own check — if the rudis bar
       drops or careers lengthen, this says so and asks for the re-measurement rather than failing. */
    {
      /* the reachable one, driven */
      let foreclosedAt = null, borrowed = false;
      { const d = A.newGameState("Fc", "clean", "ENDS-FORECLOSE", null);
        for(let w=0; w<200 && !d.over; w++){
          if(!d.loan && A.LEND_KEYS && A.LEND_KEYS.length){
            if(A.borrow(d, A.LEND_KEYS[0], 2000) !== false) borrowed = true;
          }
          for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "palus");
          const fit = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 55);
          window.__ROPE.takeBout(d, { men:fit, stakes:"standard" });
          answerWeek(d);
          try { A.endWeek(d); } catch(e){ break; }
        }
        if(d.over && d.over.kind === "foreclosed") foreclosedAt = d.week;
        lines.push(`foreclosed: borrowed ${borrowed} · ended "${d.over?d.over.kind:"alive"}" at w${d.week}`
          + ` (measured reachable in 6 of 6 houses at week 44)`);
      }
      if(!borrowed)
        bad.push(`the foreclosure arm could not borrow at all — \`borrow(d, who, amount)\` is the `
          + `only door to \`foreclosed\`, and without it that ending is untested rather than reached`);
      else if(!foreclosedAt)
        bad.push(`a house that borrowed 2,000 and never repaid did not reach \`foreclosed\` in 200 `
          + `weeks — the gate is \`owes(d) > principal * 4\` and it took 44 weeks when measured, so `
          + `either the interest or the gate has moved`);

      /* the tripwires: the two numbers that make the other two endings unreachable */
      { const mock = { wins:9, pfame:500, auctor:null, status:"active" };
        const at9 = A.rudisEligible(mock) === true;
        mock.wins = 10;
        const at10 = A.rudisEligible(mock) === true;
        lines.push(`closed: the rudis wants 10 wins (at 9: ${at9}, at 10: ${at10})`);
        if(!at10)
          bad.push(`\`rudisEligible\` no longer passes a man with 10 wins — the bar has moved UP, and `
            + `the 2.6 freeable men a house measured in v2.89.0 is stale. Re-measure before trusting `
            + `the note above`);

        /* ---- AND THE GATE ITSELF, ON A HAND-BUILT LEDGER, from v2.91.0 ----
           `freed > lost` came out of the gate on the measurement in this check's header. That is a
           claim about one `else if`, so it is held on a bench rather than a campaign: a house with
           nobody alive and a ledger of N freed against M buried must end `closed` at five and must
           NOT end it at four, whatever M is. The 5-against-30 and 7-against-69 rows are the exact
           numbers of the only two houses in twenty that ever qualified. */
        const gate = (freed, lost) => {
          const g2 = A.newGameState("Cg", "clean", `ENDS-GATE-${freed}-${lost}`, null);
          g2.gold = 3000; g2.week = 400;
          g2.gladiators.forEach(x=>{ x.status = "dead"; });
          g2.annals = [];
          const row = (i, fate, extra) => Object.assign({ id:i, name:"x", nick:null, origin:"", cls:"Murmillo",
            sex:"m", auctor:false, joined:1, left:300, fate, age:30, wins:12, losses:3, kills:1,
            pfame:200, scars:2, amb:null, ambMet:false }, extra||{});
          for(let i=0;i<freed;i++) g2.annals.push(row(9000+i, "freed"));
          for(let i=0;i<lost;i++)  g2.annals.push(row(8000+i, "dead"));
          try { A.weekReckoning(g2); } catch(e){ return "threw: " + e.message; }
          return g2.over ? g2.over.kind : "no ending";
        };
        const G = { "5/30":gate(5,30), "7/69":gate(7,69), "5/0":gate(5,0), "4/0":gate(4,0), "0/40":gate(0,40) };
        lines.push(`closed, on a hand-built ledger (freed/buried → ending): `
          + Object.entries(G).map(([k,v])=>`${k} → ${v}`).join(" · "));
        for(const k of ["5/30","7/69","5/0"]) if(G[k] !== "closed")
          bad.push(`a house with nobody alive and ${k.split("/")[0]} men freed ended \`${G[k]}\` rather `
            + `than \`closed\`. Five frees IS the whole gate since v2.91.0 — if a second clause has come `
            + `back, the mercy ending is unreachable again and the header's measurement says why`);
        for(const k of ["4/0","0/40"]) if(G[k] === "closed")
          bad.push(`a house with ${k.split("/")[0]} men freed ended \`closed\` — the count of five is `
            + `the bar and it has stopped biting`);
      }
      /* ---- AND THAT CONCLUSION WAS A POLICY ARTEFACT. CORRECTED v2.96.0. ----
         v2.89.0 recorded `oldAge` as retired rather than fixed, on 907 lanista-weeks at 62 or over
         with health at 45 or better in NONE of them — "written for a man the game does not produce".
         Two defects in the PROBE produced that, and both are fixed in the reference player:
           · it never built the BATHS. `lanistaWeek` mends the lanista by `bLevel(d,"balneae")*0.09`
             a week, and the old policy's build order named five rooms that do not exist, so `balneae`
             was never built and the man never recovered.
           · it never NAMED AN HEIR, and `oldAge` requires `d.heir`.
         With both — 12 houses of 900 weeks through `__ROPE.play` — `oldAge` fires in **4 of 12**, and
         `lanistaDied` in **none**. Against the same seeds with the heir step off: `lanistaDied` 4 of
         12 and `oldAge` 0. The ending is reachable and always was. */
      /* ---- AND IN v3.8.0 IT STOPPED BEING AN ENDING THAT HAPPENS TO YOU ----
         The line below used to read that `oldAge` competes with the succession and wins, "which is
         why a second generation is still 1 in 12 even with an heir named". Counted properly it was
         not 1 in 12, it was NONE: over 24 houses of up to 900 weeks, all of which named an heir,
         `d.succession` was raised 0 times, generation 2 was reached 0 times, 24 of 24 ended with an
         heir standing there unused and 11 of 24 ended at `oldAge` itself. The arithmetic: past 62
         health falls 0.90 a week against 0.06 of mending, so from ~85 it takes about 48 weeks to
         reach the health-45 floor and 6% a week across 48 weeks fires with probability 0.95.
         Retirement now raises the same succession death does and the player chooses. Same 24 seeds
         after: successions 11, generation 2 in 11 of 24, `oldAge` 0 — because this player always
         takes the chair. `oldAge` is now reached only by DECLINING, which `domus` drives. */
      lines.push(`oldAge: needs age>=62 AND health>=45 AND an heir, and since v3.8.0 it is a CHOICE — `
        + `retirement raises the same succession a death does, and this ending is the door you take by `
        + `letting the line end with him. A player who takes the chair sees it 0 times, by design`);
    }

    lines.push(`the night answered the way a solvent player would: `
      + (Object.entries(upr).map(([k,n])=>`${k} ${n}`).join(" · ") || "no uprising faced")
      + ` — answering "meet them with steel" every time, which is what the published table did, `
      + `takes \`proven\` from a median 183 weeks to 54 and its rebellion share from 40% to 70%`);

    /* the rope's own tally, so this check's bouts and its REFUSALS are both on the record. A check
       that asked for 300 bouts and was refused 200 of them used to report the 300 it asked for. */
    lines.push(`the rope across every arm above: ${window.__ROPE.say()}`);

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
