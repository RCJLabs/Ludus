/* THE TOP OF A CAREER, AND WHO EVER GETS THERE — #252 phase 1, the instrument.

   (`rungs` was free in both directories; checked before writing.)

   The item: *"A technique wants a man at about the 85th percentile of wins; a mastery wants one
   above the 90th, then a proof in the square, then a fee and four weeks. The top of a career — six
   named MASTERY forms, twelve TECHNIQUES, the second style — is content for one man in thirty, and
   he is the man most exposed to a per-bout hazard of 10-14%."* Its phase 1 is this and only this:
   of every man who ever fought, the share reaching each rung, by era, as a check with a floor.
   Phase 2 — whether the GATES move or the CAREER does — is decided by what this says and is not
   pre-judged here.

   THE LADDER IS THREE RUNGS AND THEY ARE NOT INDEPENDENT:

     `SIG_GATE`      wins >= 6, and a class with techniques      -> a signature
     `MASTERY_GATE`  wins >= 12 AND pfame >= 55 AND `provedIt`   -> a mastery
     `canSecond`     a mastery, and a doctore in the yard        -> a second style

   So the funnel is counted BOTH ways: each rung as a share of every man who ever fought, and each
   as a share of the men who cleared the rung below. A ladder can fail because nobody reaches the
   bottom rung or because everybody who does is stopped at the top one, and those are opposite
   items. `MASTERY_GATE` is three separate conditions and they are reported apart, because "12 wins"
   and "55 renown" and "a man beaten in the square" fail for different reasons and #252 phase 2's
   whole question is which of them is the binding one.

   WHO IS COUNTED. Only a SOLD man leaves `d.gladiators`; the dead, the freed, the escaped, the
   retired and the departed all stay in the array carrying a status, which is what `debut.mjs`
   found. So the census reads the roster and is short only of sold men — and `annalsEntry` records
   `wins`, `losses`, `pfame` and `fate` but NOT `signature`, `mastery` or `second`, so a sold man's
   rungs are not recoverable from the annals either. That is a fact about the game's own memory and
   it is reported rather than worked around: the sold are counted, and what is missing is named.

   "EVER FOUGHT" is `wins + losses > 0`. A man carries no draw counter — draws live on `d.book` —
   so a man whose only bouts were drawn reads as never having fought. The size of that is measured
   rather than assumed: men with a `lastFought` week and no win or loss are counted separately.

     node test/probes/rungs.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 64), W = +(process.argv[3] || 420), SEED = process.argv[4] || "RUNGS";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","MASTERY_GATE","SIG_GATE","provedIt","isGone","GONE"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const MG = A.MASTERY_GATE, SG = A.SIG_GATE;

  const pc = (v, n) => n ? Math.round(1000*v/n)/10 : 0;
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p50:at(.5), p75:at(.75), p90:at(.9), p99:at(.99), max:s[s.length-1] }; };

  const arm = (label, opts) => {
  const T = { men:0, fought:0, drawOnly:0, sold:0,
    w6:0, sig:0, w12:0, pf55:0, gateBoth:0, proved:0, gateAll:0, mast:0, sec:0,
    winsOfFought:[], winsOfDead:[], byEnd:{}, cohorts:{},
    /* where the men who cleared the bottom rung ended up — a band that is a death zone and one
       that is a time zone are different items */
    after6:{ n:0, ends:{}, reached12:0, wins:[] },
    /* and whether the yard could even offer the top rung */
    hadDoctoreAtEnd:0, houses:0, bumps:{} };

  for(let hh=0; hh<H; hh++){
    const d = A.newGameState("Ru"+hh, "clean", `${SEED}-${hh}`);
    const firstFought = {};
    for(let w=0; w<W; w++){
      if(d.over) break;
      /* ---- WHAT THE LEVER ACTUALLY DID, because three cuts of this file guessed ----
         `lanista` returns what it did. A rope arm whose buttons never fire reads exactly like a
         game with nothing at the top of it, and this file has now aimed at the wrong system once
         (the training regimen instead of the square) and would have reported it as a finding. */
      let did = null; try { did = R.lanista(d, opts); } catch(e){ break; }
      for(const k of ["proving","noPeer","squareShut","mastered","second","signature","wantedPeer",
                      "peerAt100","peerAt90","peerAt80","peerBestOther",
                      "bestRatio100","bestRatio90","bestRatio80","bestRatio60","bestRatioUnder60",
                      "billUp","billNamed","billPeer100","billPeer90",
                      "qualPeerYard","qualPeerYard95","qualPeerBill","qualPeerBill95"])
        if(did && did[k]) T.bumps[k] = (T.bumps[k]||0) + did[k];
      for(const g of (d.gladiators||[]))
        if(firstFought[g.id] == null && ((g.wins||0) + (g.losses||0)) > 0) firstFought[g.id] = d.week;
    }
    T.houses++;
    if(d.doctore) T.hadDoctoreAtEnd++;
    const soldIds = new Set((d.annals||[]).filter(a=>a.fate === "sold").map(a=>a.id));
    T.sold += soldIds.size;
    for(const g of (d.gladiators||[])){
      T.men++;
      const bouts = (g.wins||0) + (g.losses||0);
      if(!bouts){ if(g.lastFought != null && g.lastFought > 0) T.drawOnly++; continue; }
      T.fought++;
      const wins = g.wins||0, pf = g.pfame||0;
      const w6 = wins >= SG.wins, w12 = wins >= MG.wins, pf55 = pf >= MG.pfame;
      let pv = false; try { pv = !!A.provedIt(g); } catch(e){}
      if(w6) T.w6++;
      if(g.signature) T.sig++;
      if(w12) T.w12++;
      if(pf55) T.pf55++;
      if(w12 && pf55){ T.gateBoth++; if(pv) T.gateAll++; }
      if(pv) T.proved++;
      if(g.mastery) T.mast++;
      if(g.second) T.sec++;
      T.winsOfFought.push(wins);
      if(g.status === "dead") T.winsOfDead.push(wins);
      T.byEnd[g.status||"?"] = (T.byEnd[g.status||"?"]||0) + 1;
      if(w6){ T.after6.n++; T.after6.ends[g.status||"?"] = (T.after6.ends[g.status||"?"]||0)+1;
        if(w12) T.after6.reached12++; T.after6.wins.push(wins); }
      /* the cohort: the quarter of the run in which he first fought, with the weeks he had left */
      const fw = firstFought[g.id];
      if(fw != null){ const e = Math.min(3, Math.floor((fw-1) / (W/4)));
        const C = T.cohorts[e] = T.cohorts[e] || { n:0, w6:0, w12:0, mast:0, sec:0, left:[] };
        C.n++; if(w6) C.w6++; if(w12) C.w12++; if(g.mastery) C.mast++; if(g.second) C.sec++;
        C.left.push(Math.max(0, d.week - fw)); }
    }
  }

  const F = T.fought;
  return { label,
    houses:T.houses, menOnRosters:T.men, everFought:F,
    soldAndUncounted:T.sold, drawOnlyNotCounted:T.drawOnly,
    hadDoctoreAtEnd: pc(T.hadDoctoreAtEnd, T.houses),
    leverFired: T.bumps,
    gates: { SIG_GATE:SG, MASTERY_GATE:MG },
    /* the funnel, as a share of every man who ever fought */
    ofEveryManWhoFought: {
      "6 wins": pc(T.w6, F), "has a signature": pc(T.sig, F),
      "12 wins": pc(T.w12, F), "55 renown": pc(T.pf55, F),
      "both gate terms": pc(T.gateBoth, F), "proved in the square": pc(T.proved, F),
      "all three": pc(T.gateAll, F), "has a mastery": pc(T.mast, F), "has a second style": pc(T.sec, F) },
    /* and conditionally, which is where a ladder actually breaks */
    conditional: {
      "of those at 6 wins, reached 12": pc(T.after6.reached12, T.after6.n),
      "of those at 12 wins, also 55 renown": pc(T.gateBoth, T.w12),
      "of those clearing both, also proved": pc(T.gateAll, T.gateBoth),
      "of those clearing all three, has a mastery": pc(T.mast, T.gateAll),
      "of those with a mastery, has a second": pc(T.sec, T.mast) },
    wins: { ofEveryManWhoFought:q(T.winsOfFought), ofTheDead:q(T.winsOfDead) },
    endedAs: Object.fromEntries(Object.entries(T.byEnd).map(([k,n])=>[k, pc(n, T.men)])),
    afterSixWins: { n:T.after6.n, wins:q(T.after6.wins),
      endedAs: Object.fromEntries(Object.entries(T.after6.ends).map(([k,n])=>[k, pc(n, T.after6.n)])) },
    /* by era of first bout — the late cohorts are CENSORED and the weeks-left column says by how much */
    byCohortOfFirstBout: Object.fromEntries(Object.entries(T.cohorts).map(([e,C])=>[`Q${+e+1}`, {
      men:C.n, weeksLeft:q(C.left),
      "6 wins":pc(C.w6,C.n), "12 wins":pc(C.w12,C.n), mastery:pc(C.mast,C.n), second:pc(C.sec,C.n) }])),
  };
  };
  /* ---- TWO ARMS, AND THE SECOND ONE IS THE POINT ----
     The reference player never teaches a signature and — until v3.227.0 gave it a button — could
     not make a master at all. A census run on it alone reports 0% and 0% and reads as "the top of
     the career is dead", which is what #246 phase 1 concluded from a missing export and #221 from
     an unpressed lever. `climb` is the same player with the three levers on: it teaches the
     signature, takes the mastery the week it is offered, buys the second style, and keeps the
     square filled so `provedIt` can be earned. The difference between the two columns is the
     difference between what the GAME reaches and what the reference player does. */
  return { arms: [arm("reference", undefined),
                  arm("climb", { signature:true, mastery:true, pupil:"two" })] };
}, [H,W,SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
/* FAULT SIX: a census whose denominator is empty reports zeroes about itself. */
if(!out.arms.some(a=>a.everFought)) console.log("!! no man in either arm ever fought — every share below is about the sample");
/* and the fault this file was written to avoid: an arm whose levers are not connected reads exactly
   like a game with nothing at the top of it. */
{ const c = out.arms.find(a=>a.label === "climb");
  if(c && c.ofEveryManWhoFought["has a mastery"] === 0 && c.ofEveryManWhoFought["all three"] > 0)
    console.log("!! the climb arm cleared the gate and still made no masters — the lever is not connected"); }
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
