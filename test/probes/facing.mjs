/* WHO YOU END UP FACING — #246 phase 5, the instrument that decides which build it is.

   (`facing` was free in both directories; checked before writing, because v3.210.0 overwrote two
   files that were not.)

   v3.222.0's `servo.mjs` closed the grudge question and opened a bigger one it could not answer.
   Three numbers, all measured, that do not fit together:

     the bill names one of the three rivals on   52.5% of its offers
     and carries at least one such card on       75.0% of weeks
     the reference player fights one on          14.8% of his bouts
     and an arm that PREFERS them reaches        21.7%

   The stakes filter is not the answer — 67.7% of the STANDARD offers name a rival too. And the
   purse sort is not the answer either: `seek` overrides `housePick` entirely and still lands at 22.
   Something between the bill and the bout drops three cards in four, and v3.222.0 wrote that down as
   open rather than guessing, because a cause inferred from three percentages is exactly the shape
   #246 phase 1 and this release's own first draft were both wrong about.

   IT MATTERS BECAUSE IT DECIDES THE PHASE. `servo.mjs` measured that fighting rivals at 23% instead
   of 15% nearly doubles time above every hostile gate and takes a hostile act from one every 37
   weeks to one every 23. So phase 5 is worth building — but it is two different builds:

     if the rival cards ARE reachable and simply lose to bigger purses
        -> the build is a PRICE: the grudge belongs on the offer, so choosing the man who hates you
           is a decision with a number on it.
     if the rival cards are NOT reachable — stripped by the men-count filter, or on the wrong stakes,
        or only ever on a town's card while the house is standing in Capua
        -> the build is SUPPLY, and pricing a card the player never sees would have been a null.

   So this reconstructs `takeBout`'s filtering exactly, week by week, and counts what survives each
   stage. No modelling of the outcome — the stages are copied from the function:

     men     `activeG` less the injured and anyone over 55 fatigue          (lanista, line 1047)
     bill    the offers, less melees under three men and pairs under two    (takeBout)
     pool    of those, the ones at the wanted stakes — STRICT by default    (takeBout)
     picked  what the picker chose out of the pool
     fought  and who the bout was actually against, read from `d.metHouse`

   Two arms, the default picker and `seek`, so the drop can be attributed to a stage rather than to
   a policy. If `poolRival` on its own comes out near 22%, the mystery is arithmetic and the phase is
   supply. If it comes out near 50%, the picker is losing them and the phase is price.

   WHAT IT ANSWERED, 64 houses x 420 weeks. The funnel first — two constraints, cleanly separated:

                                          default    seek
     weeks the arena bill is up at all      33.4%    33.7%
     weeks a rival is named on it           30.3%    31.4%
     weeks a rival survives to the pool     22.7%    23.2%
     TAKEN WHEN AVAILABLE                   64.9%     100%
     rivals fought, share of bouts          15.1%    23.7%

   So the ceiling is ~23% and it is SUPPLY: the bill is up a third of weeks and the pit fills the
   rest, where there is no house and no grudge. The men-count filter costs the rival cards nothing —
   every one of the 10,647 rival offers was a single. And under `seek` a rival card that reaches the
   pool is taken 100% of the time, so nothing is being lost after the pool either.

   AND THEN THE PRICE, WHICH IS THE PART THAT DECIDED THE PHASE — and decided against it. On the
   contested weeks (a rival card in the pool, 2,921 of them):

     the rival card ALREADY pays the most on       66.0%      <- the picker is not the fault
     and where it loses, the winner pays        p50 1.61x     p75 2.41x   p90 3.16x
     the grudge on those lost cards is          p50 0         p75 5       p90 18

     a grudge-scaled premium `1 + grudge/100 x K` would flip
        K 0.25 -> 0.9%     K 0.45 -> 2.0%     K 0.75 -> 3.2%     K 1.0 -> 4.8%     K 1.5 -> 6.2%
     a FLAT premium on any rival's card would flip
        +10% -> 6.1%       +20% -> 16.6%      +30% -> 26.6%      +50% -> 43.3%

   THE VERDICT: pricing the grudge onto the offer is a null and the numbers say why. The cards that
   lose, lose by a TIER — 1.6x at the median — and they lose while carrying a grudge of ZERO, so a
   grudge-scaled term has nothing to scale. Buying a real share of them means +50% flat on every
   rival's card, which is a subsidy on half the bill and not a grudge mechanic at all. The player is
   already taking the rival's card exactly when it pays most, which is correct play against a
   correctly built bill; there is no fault here to fix.

   WHICH LEAVES THE ELASTICITY, and it is the useful thing this file found. `servo.mjs` measured the
   `seek` arm lifting the grudge's intake 0.892 -> 1.015 a house-week — **+14%** — and that doubled
   the mass above every hostile gate (4.28% -> 8.09% over `GRUDGE_SABOTAGE`) and took a hostile act
   from one every 37 weeks to one every 23. The gates sit far out on the grudge's tail, so a small
   move in its mean is a large move in the only thing #246 cares about. Fourteen per cent of the
   intake is what the whole of the bill is worth. The grudge's own arithmetic — which #246 phase 4
   left written down and unbuilt — is a smaller change with a bigger lever on it.

     node test/probes/facing.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 64), W = +(process.argv[3] || 420), SEED = process.argv[4] || "FACING";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","activeG","lanistaOf","houseOf"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const pc = (v, n) => n ? Math.round(1000*v/n)/10 : 0;
  const kindOf = o => o.melee ? "melee" : o.pair ? "pair" : o.venatio ? "hunt" : "single";
  const placeOf = d => d.rome ? "rome" : d.travel ? "road" : d.city ? "town" : "capua";

  let curRivals = new Set();
  const seekPick = pool => {
    const r = pool.filter(x=>x && x.opp && curRivals.has(x.opp.house));
    const us = r.length ? r : pool;
    const pr = us.filter(x=>x.primus);
    return (pr.length ? pr : us).sort((a,b)=>(b.purse||0)-(a.purse||0))[0];
  };

  const arm = (label, seek) => {
    const t = { weeks:0, bouts:0, place:{}, kinds:{ rival:{}, other:{} }, stakes:{ rival:{}, other:{} },
      offers:0, offRival:0,
      wkAnyOffer:0, wkOffRival:0, wkBillRival:0, wkPoolRival:0, wkPoolAny:0,
      bill:0, billRival:0, pool:0, poolRival:0,
      menFit:0, menWeeks:0, menUnder3:0, menUnder2:0,
      foughtRival:0, foughtOther:0, foughtNone:0,
      /* the decisive conditional: a bout was fought on a week whose POOL held a rival card */
      poolRivalAndBout:0, poolRivalAndFoughtRival:0,
      /* ---- AND WHAT IT WOULD COST TO WIN THE SORT ----
         If the picker is what loses the rival cards, then #246 phase 5 is a PRICE, and a price
         needs a number. `housePick` takes the primacy when one is up and otherwise the biggest
         purse, so on every week the pool holds a rival card and a non-rival one beats it, the
         question is exactly: BY WHAT RATIO. That distribution is the constant. Guessing a
         multiplier and measuring it afterwards is how you ship a null — a grudge-proportional
         term looks generous at 100 and is worth 1.09 at the median grudge that actually occurs. */
      lostBy:[], lostByGrudge:[], rivalAlreadyWins:0, contested:0 };
    for(let hh=0; hh<H; hh++){
      const d = A.newGameState("Fc"+hh, "clean", `${SEED}-${hh}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        t.weeks++;
        const mine = new Set((d.rivals||[]).filter(x=>!x.retired).map(x=>x.name));
        curRivals = mine;
        t.place[placeOf(d)] = (t.place[placeOf(d)]||0) + 1;

        /* the three stages, copied from `lanista` and `takeBout` rather than approximated */
        const men = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 55);
        t.menFit += men.length; t.menWeeks++;
        if(men.length < 3) t.menUnder3++;
        if(men.length < 2) t.menUnder2++;
        const offers = (d.games && d.games.offers) || [];
        const bill = offers.filter(x=>!(x.melee && men.length < 3) && !(x.pair && men.length < 2));
        const wantStd = !d.rome;                       /* at Rome `wantStakes` is null — take what is there */
        const pool = wantStd ? bill.filter(x=>x.stakes === "standard") : bill;
        const isRiv = o => !!(o && o.opp && mine.has(o.opp.house));
        const offR = offers.filter(isRiv), billR = bill.filter(isRiv), poolR = pool.filter(isRiv);

        t.offers += offers.length; t.offRival += offR.length;
        t.bill += bill.length;     t.billRival += billR.length;
        t.pool += pool.length;     t.poolRival += poolR.length;
        if(offers.length) t.wkAnyOffer++;
        if(offR.length)  t.wkOffRival++;
        if(billR.length) t.wkBillRival++;
        if(pool.length)  t.wkPoolAny++;
        if(poolR.length) t.wkPoolRival++;
        for(const o of offers){
          const b = isRiv(o) ? "rival" : "other";
          t.kinds[b][kindOf(o)] = (t.kinds[b][kindOf(o)]||0) + 1;
          t.stakes[b][o.stakes||"?"] = (t.stakes[b][o.stakes||"?"]||0) + 1;
        }

        /* the sort `housePick` runs, replayed on the same pool — primacy first, else the purse */
        if(poolR.length && pool.length){
          const top = us => { const pr = us.filter(x=>x.primus); return (pr.length ? pr : us)
            .slice().sort((a,b)=>(b.purse||0)-(a.purse||0))[0]; };
          const bestAny = top(pool), bestRiv = top(poolR);
          if(bestAny && bestRiv && bestRiv.purse > 0){
            t.contested++;
            if(bestAny === bestRiv || (bestAny.purse||0) <= (bestRiv.purse||0)) t.rivalAlreadyWins++;
            else {
              t.lostBy.push(Math.round(1000 * (bestAny.purse||0) / (bestRiv.purse||1)) / 1000);
              const rh = A.houseOf(d, bestRiv.opp.house);
              t.lostByGrudge.push(Math.round((rh && rh.grudge) || 0));
            }
          }
        }
        const pre = {}; const M0 = d.metHouse || {};
        for(const k of Object.keys(M0)) pre[k] = M0[k].met || 0;
        const b0 = R.stats().bouts;
        try { R.lanista(d, seek ? { pick:seekPick } : undefined); } catch(e){ break; }
        const fought = R.stats().bouts - b0;
        t.bouts += fought;
        const M1 = d.metHouse || {};
        let hitRival = 0, hitOther = 0;
        for(const k of Object.keys(M1)){
          const dn = (M1[k].met||0) - (pre[k]||0);
          if(dn > 0){ if(mine.has(k)) hitRival += dn; else hitOther += dn; }
        }
        t.foughtRival += hitRival; t.foughtOther += hitOther;
        t.foughtNone += Math.max(0, fought - hitRival - hitOther);
        if(poolR.length && fought > 0){ t.poolRivalAndBout++; if(hitRival > 0) t.poolRivalAndFoughtRival++; }
      }
    }
    return { label, seek: !!seek, weeks:t.weeks, bouts:t.bouts,
      boutsPerWeek: t.weeks ? Math.round(1000*t.bouts/t.weeks)/1000 : 0,
      place: Object.fromEntries(Object.entries(t.place).map(([k,n])=>[k, pc(n, t.weeks)])),
      menFitMean: t.menWeeks ? Math.round(100*t.menFit/t.menWeeks)/100 : 0,
      weeksUnder3Men: pc(t.menUnder3, t.menWeeks), weeksUnder2Men: pc(t.menUnder2, t.menWeeks),
      /* THE FUNNEL, as shares of offers and as shares of weeks */
      offersPerWeek: t.wkAnyOffer ? Math.round(1000*t.offers/t.wkAnyOffer)/1000 : 0,
      rivalShareOfOffers: pc(t.offRival, t.offers),
      rivalShareOfBill:   pc(t.billRival, t.bill),
      rivalShareOfPool:   pc(t.poolRival, t.pool),
      poolShareOfOffers:  pc(t.pool, t.offers),
      weeksOfferedRival: pc(t.wkOffRival, t.weeks),
      weeksBillHadRival: pc(t.wkBillRival, t.weeks),
      weeksPoolHadRival: pc(t.wkPoolRival, t.weeks),
      weeksPoolEmpty:    pc(t.weeks - t.wkPoolAny, t.weeks),
      /* AND WHAT WAS ACTUALLY FOUGHT */
      foughtRivalPcOfBouts: pc(t.foughtRival, t.bouts),
      foughtOtherPcOfBouts: pc(t.foughtOther, t.bouts),
      foughtNoHousePcOfBouts: pc(t.foughtNone, t.bouts),
      /* the decisive conditional — given a rival card SURVIVED to the pool and a bout was fought,
         how often was the rival the one fought. Near 100 under `seek` means the funnel is the whole
         story and the phase is supply; well under means the picker is losing them and it is price. */
      takenWhenAvailable: pc(t.poolRivalAndFoughtRival, t.poolRivalAndBout),
      poolRivalAndBout: t.poolRivalAndBout,
      /* THE PRICE OF THE SORT */
      contested: t.contested, rivalAlreadyWinsPc: pc(t.rivalAlreadyWins, t.contested),
      lostBy: (a=>{ if(!a.length) return null; const q=a.slice().sort((x,y)=>x-y);
        const at=f=>q[Math.min(q.length-1,Math.floor(f*q.length))];
        return { n:a.length, p10:at(.1), p25:at(.25), p50:at(.5), p75:at(.75), p90:at(.9), max:q[q.length-1] }; })(t.lostBy),
      /* and the share a candidate multiplier would flip, at the grudge each of those cards
         actually carried — the whole point, since a grudge-scaled term is worth nothing at 0 */
      wouldFlip: Object.fromEntries([0.25,0.45,0.75,1.0,1.5].map(K=>[K,
        pc(t.lostBy.filter((r,i)=>1 + (t.lostByGrudge[i]/100)*K >= r).length, t.lostBy.length)])),
      /* a flat premium on any rival's card, for comparison — no grudge term at all */
      wouldFlipFlat: Object.fromEntries([0.10,0.20,0.30,0.50].map(K=>[K,
        pc(t.lostBy.filter(r=>1 + K >= r).length, t.lostBy.length)])),
      grudgeWhenLost: (a=>{ if(!a.length) return null; const q=a.slice().sort((x,y)=>x-y);
        const at=f=>q[Math.min(q.length-1,Math.floor(f*q.length))];
        return { n:a.length, p50:at(.5), p75:at(.75), p90:at(.9), max:q[q.length-1] }; })(t.lostByGrudge),
      kinds:t.kinds, stakes:t.stakes };
  };

  return { arms: [arm("default", false), arm("seek", true)] };
}, [H,W,SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
/* FAULT SIX: if no arm ever saw an offer naming a rival, every share below is a zero about the
   counter and not about the game, and the file says so rather than reporting a funnel. */
if(!out.arms.some(a=>a.rivalShareOfOffers > 0))
  console.log("!! no offer in either arm named one of the three rivals — the funnel below is about the counter, not the bill");
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
