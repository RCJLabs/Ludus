/* THE SERVO UNDER THE GRUDGE — the verify-first instrument.

   (`servo` was free in both directories; checked before writing, because v3.210.0 overwrote two
   files that were not.)

   #246 phase 2 measured a bay whose grudge is **0 on 64.4% of house-weeks and under the lowest
   hostile gate on 95.4%** of them, and left that number standing as the reason the hostile moves
   fire as rarely as they do. Reading the file afterwards turned up a candidate mechanism:

     function metHouse(d, h){ ... if(r && (r.grudge||0) < 30) warmMove(d, h, 1.1); }
     function warmMove(d, h, n){ ... if(n > 0) r.grudge = clamp(r.grudge - n*0.4, 0, 100); }

   Every card against a rival house warms that house by 1.1 and, *while its grudge is under 30*,
   takes 0.44 off the grudge. The lowest hostile gate is `GRUDGE_SABOTAGE` at 26. So the term reads
   like a servo: a house climbing toward the gates is pushed back under them by the very thing that
   should be raising the grudge — fighting them.

   THAT IS A STORY, NOT A MEASUREMENT, and this file exists because the difference has bitten this
   project before. Three things have to be true before a constant is touched:

     1 · THE TERM HAS TO FIRE OFTEN ENOUGH TO MATTER. `metHouse` runs once per bout whose opponent
         carries a `house` — not once a week. If your bill sends you against rival-house men on one
         week in five, the term's outflow is 0.09 a week against a `grudgeDecay` of about 1.0, and
         the servo story is simply wrong: the grudge sits at zero because the weekly decay puts it
         there. `d.metHouse[name].met` is the call counter the function itself increments, so the
         rate is readable exactly, per house, per week. No modelling.

     2 · AND IT HAS TO FIRE UNDER THE GATE. A call while the grudge is already 40 does nothing.

     3 · AND REMOVING IT HAS TO MOVE THE HOSTILE SURFACE. The reason for the item is not the
         grudge's distribution for its own sake; it is how often a rival house does something. A
         change that lifts the median grudge from 0 to 3 and leaves the hostile rate where it was
         has bought nothing.

   FIVE ARMS, same seeds, one page:

     ship        the game as it ships.
     nomet       the grudge half of `metHouse`'s move is credited back each week — 0.44 per call. An
                 UPPER BOUND on the term: it credits back calls that the gate blocked and calls that
                 the clamp at 0 swallowed, so if this arm does not move, no gating of the term can.
     half        half of it credited back — the same thing as halving `warmMove`'s 0.4 coupling.
     seek        ship's rules under a different PLAYER: take a rival's card whenever the standard
                 bill carries one, instead of `housePick`'s biggest purse. Not a decoration — a
                 figure for what this term costs the grudge is a figure for a policy, and the
                 default policy fights rivals on a sixth of its bouts while the bill offers one on
                 over half of its cards. This is the arm #240 wanted and could not have: `pick:` was
                 written twice in `lanista`'s object literal until v3.128.0 and the second one won.
     seek-nomet  and the term removed from that hotter world, because a term that does nothing to a
                 cold bay might still do something to a bay that is being fought.

   THE ARMS ARE APPROXIMATE AND THE APPROXIMATION IS ONE WEEK OF LAG. The credit is applied after
   the week runs, so the gates inside that week saw the uncredited grudge. Over 300+ weeks the
   worlds diverge properly — which is the point — but no single week is exact, and a difference
   smaller than a week's decay should not be read as a result.

   WHAT IT ANSWERED, pooled over two runs of 192 houses x 420 weeks — about 236,000 house-weeks an
   arm, after a 48-house run produced a clean 3-of-3 ordering on the hostile rate that four times
   the sample scrambled:

                             ship     half    nomet  |    seek   seek-nomet
     the term fires on      4.8%     4.8%     4.8%   |    7.3%      7.3%   of house-weeks
     and takes             0.021    0.021    0.021   |   0.032     0.032   a house-week
     `grudgeDecay` takes   0.972                     |   0.981
     other outflows        0.348                     |   0.440
     the grudge is fed     0.892                     |   1.015
     ---------------------------------------------------------------------
     so the term is         1.6%                     |    2.3%   OF THE OUTFLOW

     grudge exactly 0      64.9%    62.7%    62.1%   |   56.9%     53.7%
     above SABOTAGE 26      4.28%    4.24%    4.79%  |    8.09%     7.89%
     above POACH 35         2.09%    1.95%    2.39%  |    4.54%     4.38%
     above THUGS 44         1.09%    0.95%    1.29%  |    2.89%     2.77%
     a hostile act every   37 wk    38 wk    35 wk   |   23 wk     23 wk
     rivals fought on      15.2%    15.3%    15.3%   |   23.0%     22.8%   of bouts
     (the bill named one on 53.3% of its offers in every one of the five)

   THE VERDICT, IN TWO PARTS. The term is not a servo — 1.6% of the outflow, 2.3% for the player it
   fires most often against, and removing its grudge half moves nothing outside the between-seed
   spread in either world. It parks houses at zero, worth about two points of that, and that is all
   it does.

   AND THE SECOND PART IS WORTH MORE THAN THE FIRST. Nothing about the game differs between the left
   and right halves of that table; only who the player fights, and that was worth more than every
   constant in the grudge put together. #246's 95.4% is the decay AND the bill.

   THE ROOM LEFT IS LARGER THAN THE ARM USED, AND WHY IS AN OPEN QUESTION. Counted off the bill
   itself, over 48 x 420:

     the bill names one of the three rivals on      52.5% of its offers
     and carries at least one such card on          75.0% of weeks
     standard stakes are                            51.5% of the bill
     and name a rival on                            67.7% of THAT — the stakes filter is not what drops them
     so a rival's card is on the standard bill on    56.5% of weeks
     the reference player fights one on              14.8% of his bouts
     and the arm that PREFERS them reaches           21.7%

   The first draft of this note said `housePick`'s purse sort was the cause. It is not: the seek arm
   overrides that sort entirely and still lands nowhere near what is on offer, so most of the loss
   is somewhere else in `takeBout`'s filtering — the men-count filter on pairs and melees is the
   obvious suspect and this file has not chased it. The figure quoted is the one measured, not the
   cause inferred, which is the whole difference between this directory and a story.

   Nothing was changed on the strength of this file, which is what a verify-first release is for.

     node test/probes/servo.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 12), W = +(process.argv[3] || 360), SEED = process.argv[4] || "SERVO";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","lanistaOf","houseOf","metHouse","warmMove","warmth",
                "GRUDGE_POACH","GRUDGE_SABOTAGE","GRUDGE_BRIBE","GRUDGE_THUGS"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const HOSTILE = ["poached","sabotage","thugs","bribedEditor","stolenSteel","courted","defected","whispers"];
  const GATES = { sabotage:A.GRUDGE_SABOTAGE, poach:A.GRUDGE_POACH, bribe:A.GRUDGE_BRIBE, thugs:A.GRUDGE_THUGS };
  const LOW = Math.min(...Object.values(GATES));
  const MET_WARM = 1.1, MET_COUPLE = 0.4, MET_DEBIT = MET_WARM * MET_COUPLE;   /* what one card costs a grudge */
  const MET_GATE = 30;                                                          /* `metHouse`'s own gate */

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p50:at(.5), p75:at(.75), p90:at(.9), p99:at(.99), max:s[s.length-1] }; };
  const pc = (v, n) => n ? Math.round(1000*v/n)/10 : 0;
  const per = (v, n) => n ? Math.round(1000*v/n)/1000 : 0;

  /* ---- AND WHOSE CARD THIS ROPE TAKES, WHICH IS NOT A PROPERTY OF THE GAME ----
     The default picker is `housePick`: the primacy when it is up, else the biggest purse, out of a
     bill already filtered to `wantStakes:"standard"`. Measured here, that player fights one of his
     three rivals on **15% of bouts** while the bill names one on **over half of its offers**. So a
     figure for what `metHouse` costs the grudge is a figure for THAT POLICY, and the difference between
     "the game cannot" and "this player did not" is the distinction the harness's own #189 note
     exists for. `seek` is the other end of it — the arm #240 wanted and never got until `pick` was
     un-shadowed: take a rival's card whenever the standard bill carries one, and fall back to the
     same `housePick` when it does not. Same stakes policy, different opponent. */
  let curRivals = new Set();
  const seekPick = pool => {
    const r = pool.filter(x=>x && x.opp && curRivals.has(x.opp.house));
    const us = r.length ? r : pool;
    const pr = us.filter(x=>x.primus);
    return (pr.length ? pr : us).sort((a,b)=>(b.purse||0)-(a.purse||0))[0];
  };

  /* one arm. `credit` is the share of `metHouse`'s grudge debit handed back after each week —
     0 is the shipping game, 1 is the term with its grudge half removed. `seek` swaps the picker. */
  const arm = (label, credit, seek) => {
    const t = { weeks:0, houseWeeks:0, grudges:[], over:{}, top:0, acts:0, kinds:{},
      met:0, metWeeks:0, metUnderGate:0, metOverGate:0, credited:0, warms:[],
      decay:0, decayWeeks:0, up:0, upN:0, downOther:0, downN:0, zero:0, fromZero:0,
      /* ---- AND WHETHER THE BILL EVEN OFFERS ONE ----
         `metHouse` fires on a bout whose opponent carries a `house`. If the term turns out to be
         too rare to matter, there are two different reasons it could be — the bay rarely puts a
         rival's man on your card, or this rope rarely takes the one it is offered — and they lead
         to opposite conclusions. That is the distinction the harness's own #189 note exists for, so
         both are counted: what the bill held, and what the rope took. */
      bouts:0, billOffers:0, billHouse:0, billRival:0, billWeeks:0, metAny:0,
      /* ---- AND WHICH OF THE TWO POLICIES COSTS WHAT ----
         Between "the bill names a rival on half its offers" and "the rope fights one on a sixth of
         its bouts" sit TWO filters, and saying which is which is the difference between a measured
         cause and a plausible one. `takeBout` applies `wantStakes` FIRST — the reference player's
         default is strict `"standard"` — and only then hands what survives to `pick`. So the
         standard-stakes subset of the bill is counted separately from the bill, and the gap from
         there to what is fought is what the purse preference costs. */
      billStd:0, billStdRival:0, weeksStdHadRival:0, weeksAnyRival:0 };
    for(const g of Object.values(GATES)) t.over[g] = 0;
    for(let hh=0; hh<H; hh++){
      const d = A.newGameState("Sv"+hh, "clean", `${SEED}-${hh}`);
      const prev = {}, pmet = {};
      for(let w=0; w<W; w++){
        if(d.over) break;
        const riv = (d.rivals||[]).filter(x=>!x.retired);
        for(const h of riv){ prev[h.name] = h.grudge || 0;
          pmet[h.name] = ((d.metHouse||{})[h.name]||{}).met || 0; }
        t.weeks++;
        /* the bill is `d.games.offers` and the first cut of this read `d.offers`, which does not
           exist: 3,447 bouts and `billHousePc` flat 0. FAULT SIX, in the file that was written to
           hold the same line. Both counters below are now asserted against the bout count. */
        { const off = (d.games && d.games.offers) || [];
          /* AND THE TWO ARE NOT THE SAME NUMBER, which the first cut printed side by side as
             though they were. `offer.opp.house` is set for circuit men, town men and the named
             houses of `HOUSES` as well as for your three rivals — `metHouse` books a meeting
             against all of them, but `houseOf` only finds a rival, so only a rival's grudge can
             move. 63.7% of the bill names a house; a sixth of it names one that has a grudge. */
          const mine = new Set((d.rivals||[]).map(x=>x.name));
          if(off.length){ t.billWeeks++; t.billOffers += off.length;
            t.billHouse += off.filter(o=>o && o.opp && o.opp.house).length;
            const riv = off.filter(o=>o && o.opp && mine.has(o.opp.house));
            t.billRival += riv.length;
            if(riv.length) t.weeksAnyRival++;
            const std = off.filter(o=>o && o.stakes === "standard");
            const stdRiv = std.filter(o=>o.opp && mine.has(o.opp.house));
            t.billStd += std.length; t.billStdRival += stdRiv.length;
            if(stdRiv.length) t.weeksStdHadRival++; } }
        { const M = d.metHouse || {}; let n = 0; for(const k of Object.keys(M)) n += M[k].met || 0; t.metAny -= n; }
        const b0 = R.stats().bouts;
        if(seek) curRivals = new Set((d.rivals||[]).filter(x=>!x.retired).map(x=>x.name));
        try { R.lanista(d, seek ? { pick:seekPick } : undefined); } catch(e){ break; }
        t.bouts += R.stats().bouts - b0;
        { const M = d.metHouse || {}; let n = 0; for(const k of Object.keys(M)) n += M[k].met || 0; t.metAny += n; }
        const ev = d.pendingEvent && d.pendingEvent.id;
        if(ev && HOSTILE.includes(ev)){ t.acts++; t.kinds[ev] = (t.kinds[ev]||0)+1; }

        for(const h of (d.rivals||[])){
          if(h.retired || prev[h.name] == null) continue;
          const g0 = prev[h.name], g = h.grudge || 0;
          const dMet = (((d.metHouse||{})[h.name]||{}).met || 0) - (pmet[h.name] || 0);
          /* 1 · THE RATE, exact — the counter `metHouse` itself increments */
          if(dMet > 0){ t.met += dMet; t.metWeeks++;
            /* 2 · AND WHETHER IT WAS UNDER THE GATE. The call is inside the bout, so the grudge at
               call time is not observable from out here; the week's two ends bracket it, and a week
               whose grudge never left the gate's side is unambiguous. Weeks that straddle are
               counted separately rather than guessed at. */
            if(g0 < MET_GATE && g < MET_GATE) t.metUnderGate += dMet;
            else if(g0 >= MET_GATE && g >= MET_GATE) t.metOverGate += dMet; }
          /* the ledger, on the same guard `spite` uses — a clamp at either end reads as a flow */
          const dec = g0 > 0 ? Math.min(g0, 1 * (A.lanistaOf(h.name).grudgeDecay || 1)) : 0;
          const modelled = g0 - dec;
          if(modelled > 0 && modelled < 100 && g0 < 100){
            t.decayWeeks++; t.decay += dec;
            const resid = g - modelled;
            if(resid > 0.001){ t.up += resid; t.upN++; }
            else if(resid < -0.001){ t.downOther += -resid; t.downN++; }
          }
          if(g0 === 0){ t.zero++; if(g > 0) t.fromZero++; }
          /* THE ARM ITSELF, after the week and before the next one */
          if(credit > 0 && dMet > 0){
            const back = MET_DEBIT * dMet * credit;
            const was = h.grudge || 0;
            h.grudge = Math.max(0, Math.min(100, was + back));
            t.credited += h.grudge - was;
          }
          t.houseWeeks++; t.grudges.push(Math.round(h.grudge||0));
          if((h.grudge||0) > t.top) t.top = h.grudge||0;
          for(const gate of Object.keys(t.over)) if((h.grudge||0) >= +gate) t.over[gate]++;
          t.warms.push(Math.round(A.warmth(d, h.name)));
        }
      }
    }
    return { label, credit, seek: !!seek,
      weeks:t.weeks, houseWeeks:t.houseWeeks,
      grudge:q(t.grudges), warm:q(t.warms), top:Math.round(t.top),
      over:Object.fromEntries(Object.entries(t.over).map(([g,n])=>[g, pc(n, t.houseWeeks)])),
      overLowestGate: pc(Object.entries(t.over).filter(([g])=>+g===LOW).reduce((s,[,n])=>s+n,0), t.houseWeeks),
      atZero: pc(t.zero, t.houseWeeks), leftZero: pc(t.fromZero, t.zero),
      metCalls:t.met, metPerHouseWeek: per(t.met, t.houseWeeks),
      metWeeksPc: pc(t.metWeeks, t.houseWeeks),
      bouts:t.bouts, boutsPerWeek: per(t.bouts, t.weeks),
      metShareOfBouts: pc(t.met, t.bouts),
      billAnyHousePc: pc(t.billHouse, t.billOffers), billRivalPc: pc(t.billRival, t.billOffers),
      billStdPc: pc(t.billStd, t.billOffers), billStdRivalPc: pc(t.billStdRival, t.billStd),
      weeksBillHadRivalPc: pc(t.weeksAnyRival, t.billWeeks),
      weeksStdHadRivalPc: pc(t.weeksStdHadRival, t.billWeeks),
      offersPerWeek: per(t.billOffers, t.billWeeks),
      metAnyHouse:t.metAny, metAnyShareOfBouts: pc(t.metAny, t.bouts),
      metUnderGate:t.metUnderGate, metOverGate:t.metOverGate,
      metStraddled: t.met - t.metUnderGate - t.metOverGate,
      /* the whole point of 1 · what the term can possibly be taking, against what the decay takes */
      metDebitPerHouseWeek: per(MET_DEBIT * t.met, t.houseWeeks),
      decayPerWeek: per(t.decay, t.decayWeeks),
      inPerWeek: per(t.up, t.decayWeeks), otherOutPerWeek: per(t.downOther, t.decayWeeks),
      creditedPerHouseWeek: per(t.credited, t.houseWeeks),
      acts:t.acts, kinds:t.kinds, actsPer100Weeks: pc(t.acts, t.weeks),
      everyN: t.acts ? Math.round(t.weeks/t.acts) : null };
  };

  const arms = [arm("ship", 0), arm("nomet", 1), arm("half", 0.5),
                arm("seek", 0, true), arm("seek-nomet", 1, true)];
  return { gates:GATES, lowestGate:LOW, metGate:MET_GATE, metDebit:MET_DEBIT, arms };
}, [H,W,SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
const ship = out.arms[0];
/* FAULT SIX: a counter that cannot move reads exactly like a system that did nothing. If the
   control never called `metHouse`, every arm below is a control and the file says so instead of
   reporting three matching distributions as a finding. */
if(!ship.metCalls) console.log("!! `metHouse` was never called in the control — the arms are three copies of the same world, and nothing below is a comparison");
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
