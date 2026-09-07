/* THE MONEY DEATH, AND WHETHER IT HAS AN APPROACH — #247 phase 2, the instrument.

   (`brink` was free in both directories; checked before writing.)

   #247 split into three and all three landed on one sentence: *"every remedy converts a death into
   a money death, and the money death is the one with no approach — which is the claim a phase 2 has
   to answer."* Phase 1 established the shape — debt takes more houses than anything else and it is
   a CLIFF: gold p50 4,359 at forty weeks out, 2,105 at ten, ~1,000 at one. #247a gave it a SIGNAL
   (the money row speaks on exposure now, reaches every house that dies, and gives seven or eight
   weeks). What has never been measured is whether the signal is worth anything — whether a house
   that hears it has an ACTION, which is the question #247b answered for the rising and answered
   yes: completely answerable, at 101-131 denarii a week.

   THE DEATH IS ARITHMETIC, so the question can be asked precisely. `d.over = {kind:"debt"}` fires
   at `d.gold < creditLine(d)`, which is 2.5 weeks of the house's OWN bill below nought. So a house
   dies when its outgo has beaten its income for long enough, and the only two remedies are earning
   more or owing less. This reads the second one, because it is the one with a floor:

     `weeklyBill` is nine lines. Reading the file for an action that stops each:

       men       `liquidate`/the market      CAN BE STOPPED
       gear      `sellGearOne`               CAN BE STOPPED
       doctore   `dismissDoctore`            CAN BE STOPPED
       staff     `letStaffGo`                CAN BE STOPPED
       collegium `stopCollegium`             CAN BE STOPPED
       buildings  --                          NO ACTION EXISTS
       works      --                          NO ACTION EXISTS
       liturgy    -- (it is `riseOf(d)`)      NO ACTION EXISTS
       household  -- (a wife is not staff)    NO ACTION EXISTS

     So the bill has a LOCKED FLOOR, and if that floor alone outruns what a dying house can earn,
     the money death genuinely has no approach and phase 2 is a build. If the escapable share is
     the larger part, the approach exists and the item is about price and legibility instead.

   WHAT IS COUNTED, per house, every week: gold, the bill split locked/escapable, income (the gold
   the week actually added, taken as a difference so nothing is modelled), `runway`, whether the
   money row is red, and `liquidate(d).total` — the emergency fund, what selling every spare man and
   every spare piece of steel would raise. On death the last forty weeks are kept.

   TWO CAVEATS, both of which make the remedy look BETTER than it is, so a negative answer here is
   the strong one: shedding men cuts the bill and also cuts the purses they would have won, which is
   not modelled; and the gap is taken net of the house's own discretionary spending, so a remedy of
   "stop buying" is credited to neither side.

   AND THEN THE ONE NUMBER THE PHASE TURNS ON: at the week the money row FIRST went red, could the
   house have survived by cutting? The gap is what it was short by over the weeks it had left; the
   remedy is the escapable bill it could have shed plus what it could have liquidated. Both are read
   off the game's own functions at that week rather than estimated.

     node test/probes/brink.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 64), W = +(process.argv[3] || 420), SEED = process.argv[4] || "BRINK";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","weeklyBill","creditLine","liquidate","runway","moneyRow","activeG",
                "bUpkeep","workUpkeep","gearUpkeep","liturgy","collDues","hhUpkeep","staffWages",
                "docWage","seasonUpkeep","isAuctor","pit"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p25:at(.25), p50:at(.5), p75:at(.75), p90:at(.9) }; };
  const pc = (v, n) => n ? Math.round(1000*v/n)/10 : 0;

  /* the bill, split by whether the game has an action that stops the line. The men's term is
     `weeklyBill`'s own first line, copied rather than approximated. */
  const split = d => {
    const men = A.activeG(d).reduce((n,g)=> n + (10 + A.seasonUpkeep(d)) * A.pit(d,"upkeep")
      + (A.isAuctor(g) ? g.auctor.wage : 0), 0);
    const esc = men + A.gearUpkeep(d) + A.collDues(d) + (d.doctore ? A.docWage(d.doctore) : 0) + A.staffWages(d);
    const lock = A.bUpkeep(d) + A.workUpkeep(d) + A.liturgy(d) + A.hhUpkeep(d);
    return { men, esc, lock, total:A.weeklyBill(d) };
  };

  const t = { houses:0, ends:{}, debt:[], other:[], alive:[],
    /* the decisive tally, over the debt deaths only */
    firstRed:[], gapAtRed:[], remedyAtRed:[], coveredAtRed:0, redSeen:0, noRed:0,
    lockShareAtRed:[], lockShareAtDeath:[], incomeAtRed:[], lockVsIncome:0, weeksFromRed:[],
    /* ---- AND THE TWO KINDS OF DEBT DEATH, WHICH THE POOLED FIGURE HIDES ----
       `lockedShareOfBillAtRed` reads p25 0 and p50 52.5 on one seed and p50 0 on the other: that is
       not noise, it is two populations. A young house dying at week 40 owns nothing and its whole
       bill is escapable; a built house dying at week 250 is carrying buildings, works, a liturgy
       and a household it has no action to stop. Pooling them answers neither question, and the
       phase turns on which of the two the remedy reaches. */
    byKind: { bare:{ n:0, covered:0, lockBeats:0, gap:[], remedy:[], week:[] },
              built:{ n:0, covered:0, lockBeats:0, gap:[], remedy:[], week:[] } } };

  for(let hh=0; hh<H; hh++){
    const d = A.newGameState("Br"+hh, "clean", `${SEED}-${hh}`);
    const log = [];
    let prevGold = d.gold;
    for(let w=0; w<W; w++){
      if(d.over) break;
      const s = split(d);
      let mr = null; try { mr = A.moneyRow(d); } catch(e){}
      const row = { week:d.week, gold:Math.round(d.gold), bill:s.total, lock:s.lock, esc:s.esc,
        run:(()=>{ try { return A.runway(d); } catch(e){ return null; } })(),
        red: !!mr, fund:(()=>{ try { return A.liquidate(d).total; } catch(e){ return 0; } })(),
        net:0 };
      log.push(row);
      try { R.lanista(d); } catch(e){ break; }
      /* NET of everything the week did except the bill — purses and sales in, discretionary
         spending out. It goes negative on a week the house bought a man, and that is correct for
         the gap below (the spending really did contribute to the shortfall); it is NOT gross
         receipts and must not be read as "what the house earns". */
      row.net = Math.round((d.gold - prevGold) + s.total);
      prevGold = d.gold;
      if(log.length > 400) log.shift();
    }
    t.houses++;
    const kind = d.over ? d.over.kind : "alive";
    t.ends[kind] = (t.ends[kind]||0) + 1;
    const last = log.slice(-40);
    const rec = { kind, weeks:d.week, last };
    if(kind === "debt") t.debt.push(rec); else if(kind === "alive") t.alive.push(rec); else t.other.push(rec);

    /* ---- THE MOMENT IS THE LAST RED RUN, NOT THE FIRST RED WEEK ----
       The first cut took the first week the money row ever went red and measured the gap and the
       remedy over everything after it — a median of 82 weeks. That is not the moment #247a is
       about ("seven or eight weeks"), and it flattered the answer twice over: it gave the remedy
       82 weeks of shed bill to work with and reported 100% of deaths coverable. The moment a house
       is actually dying is the CONTIGUOUS red run that reaches the end, and a house that was not
       red when it died is counted apart rather than folded in. */
    let red = null;
    if(log.length && log[log.length-1].red){
      red = log.length - 1;
      while(red > 0 && log[red-1].red) red--;
    }

    /* THE QUESTION, on the debt deaths */
    if(kind === "debt"){
      if(red === null){ t.noRed++; }
      else {
        t.redSeen++;
        const r = log[red], left = log.length - red;
        t.weeksFromRed.push(left);
        t.firstRed.push(r.week);
        /* the gap: what the house was short by over the weeks it had left, taken from its own
           trajectory rather than modelled — gold at the red week, plus everything that came in
           after, against everything the bill took after */
        const after = log.slice(red);
        const inSum = after.reduce((n,x)=>n+x.net, 0), outSum = after.reduce((n,x)=>n+x.bill, 0);
        const gap = Math.max(0, outSum - inSum - r.gold);
        /* the remedy available AT that week: shed the escapable bill for the weeks that remained,
           plus sell everything spare */
        const remedy = r.esc * left + r.fund;
        t.gapAtRed.push(Math.round(gap)); t.remedyAtRed.push(Math.round(remedy));
        if(remedy >= gap) t.coveredAtRed++;
        t.lockShareAtRed.push(Math.round(1000*r.lock/Math.max(1,r.bill))/10);
        const netWk = after.reduce((n,x)=>n+x.net,0)/Math.max(1,left);
        t.incomeAtRed.push(Math.round(netWk));
        if(r.lock > netWk) t.lockVsIncome++;
        { const B = t.byKind[r.lock > 0 ? "built" : "bare"];
          B.n++; if(remedy >= gap) B.covered++; if(r.lock > netWk) B.lockBeats++;
          B.gap.push(Math.round(gap)); B.remedy.push(Math.round(remedy)); B.week.push(r.week); }
      }
      const e = log[log.length-1];
      if(e) t.lockShareAtDeath.push(Math.round(1000*e.lock/Math.max(1,e.bill))/10);
    }
  }

  const atOut = (rows, k, back) => q(rows.map(r=>{ const x = r.last[r.last.length-1-back]; return x ? x[k] : null; }).filter(v=>v!=null));
  const curve = (rows, k) => [40,20,10,5,1].map(b=>({ back:b, ...(atOut(rows, k, b-1)||{}) }));
  return {
    houses:t.houses, ends:t.ends,
    debtN:t.debt.length, aliveN:t.alive.length,
    gold:   { debt:curve(t.debt,"gold"),   alive:curve(t.alive,"gold") },
    bill:   { debt:curve(t.debt,"bill"),   alive:curve(t.alive,"bill") },
    locked: { debt:curve(t.debt,"lock"),   alive:curve(t.alive,"lock") },
    escap:  { debt:curve(t.debt,"esc"),    alive:curve(t.alive,"esc") },
    fund:   { debt:curve(t.debt,"fund"),   alive:curve(t.alive,"fund") },
    net:    { debt:curve(t.debt,"net"),    alive:curve(t.alive,"net") },
    answer: {
      debtDeaths:t.debt.length, sawRed:t.redSeen, neverRed:t.noRed,
      weeksFromRedToDeath: q(t.weeksFromRed),
      gapAtRed: q(t.gapAtRed), remedyAtRed: q(t.remedyAtRed),
      couldHaveCovered: pc(t.coveredAtRed, t.redSeen), coveredN:t.coveredAtRed,
      lockedShareOfBillAtRed: q(t.lockShareAtRed),
      lockedShareOfBillAtDeath: q(t.lockShareAtDeath),
      netAWeekAfterRed: q(t.incomeAtRed),
      lockedFloorBeatsNet: pc(t.lockVsIncome, t.redSeen),
      byKind: Object.fromEntries(Object.entries(t.byKind).map(([k,B])=>[k, { n:B.n,
        couldHaveCovered: pc(B.covered, B.n), lockedFloorBeatsNet: pc(B.lockBeats, B.n),
        diedAtWeek: q(B.week), gap: q(B.gap), remedy: q(B.remedy) }])) },
  };
}, [H,W,SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
/* FAULT SIX: if no house died of debt, every figure under `answer` is a statement about the sample. */
if(!out.debtN) console.log("!! no house died of debt in this run — nothing under `answer` is about the game");
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
