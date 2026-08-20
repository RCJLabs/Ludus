/* #134 — CAN THE CALL-OUT WINDOW OPEN AT ALL?

   `nemCanCallOut` is a conjunction of four terms, and the item is not "does it fire" but "can its
   terms be true together":

       d.nemHouse.stage >= 2   AND   nemEdge(d) >= 1   AND   d.nemHouse.heat >= 45
       AND some man at pfame >= 18   AND   no pending `challenge` deadline

   The tension that made it an item: `nemEdge` is `answered - hits`, and **every answer that raises
   the edge lowers the heat by 3**, while only being schemed against raises it (+4, and +1.4 a week of
   drift while stage < 3). So the two terms you need together are moved in opposite directions by the
   one action available. That is the shape `grudge` exists for — two events waiting above the ceiling
   of the number they read.

   Until v3.24.0 this could not be asked at all: the rope had no step for `answerNem`, so `answered`
   was 0 in every house this project ever ran and the edge was permanently negative. Measured then,
   8 x 320: the call-out gate opened on 0 weeks while `answerNem`'s own gate was open on 73%.

   SO THIS COUNTS EACH TERM SEPARATELY, the way `census` splits its four gates, because "the gate
   never opened" does not say which term is holding and the fix depends entirely on which.

   TWO ARMS:
     answers    the v3.24.0 default — replies when it can afford to, and names the day when it can
     silent     `nem:false`, which is what every measurement before v3.24.0 was taken on

   WHAT WOULD REFUTE #134: the window opening at a decent rate for the answering arm. Then the
   call-out is content the old reference player declined, not a window that cannot open, and the item
   closes the way #132 did.
   WHAT WOULD CONFIRM IT: heat and edge each reachable alone and never together — the two terms
   trading off exactly as the arithmetic predicts. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const ARM = process.argv[4] || "answers";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W,ARM])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const OPTS = ARM === "silent" ? { nem:false } : {};
  const t = { weeks:0, hasNem:0, stage2:0, edge1:0, heat45:0, manOk:0, noChallenge:0,
              allFour:0, canCall:0, answered:0, calledOut:0, everCall:0,
              heatAndStage:0, edgeAndStage:0, heatAndEdge:0,
              /* ---- #174: WHAT THE ANSWER BUTTON ACTUALLY READS ----
                 The panel builds three labels off two tests, and the middle one — ready but the
                 purse is short — exists only to change "Answer him" to "Answer". Whether that
                 branch is worth a wording at all is a count, not an opinion, so count it. */
              btnCooling:0, btnShort:0, btnReady:0, everShort:0 };
  const houses = [];
  const edgeSeen = {}, heatBands = {};
  for(let h=0;h<H;h++){
    const d = A.newGameState("Nm"+h,"clean",`NEM-${h}`,null);
    let bestEdge = -99, bestHeat = 0, calls = 0, nemWeeks = 0, ans = 0, shortWeeks = 0;
    for(let w=0;w<W;w++){
      if(d.over) break;
      t.weeks++;
      const n = d.nemHouse;
      if(n){
        t.hasNem++; nemWeeks++;
        /* each term ALONE, off the game's own functions where they exist */
        const edge = A.nemEdge ? A.nemEdge(d) : ((n.answered||0) - (n.hits||0));
        const s2 = (n.stage||0) >= 2, e1 = edge >= 1, h45 = (n.heat||0) >= 45;
        const man = A.activeG(d).some(g=>(g.pfame||0) >= 18);
        const noCh = !(d.deadlines||[]).some(x=>x.kind === "challenge");
        if(s2) t.stage2++;
        if(e1) t.edge1++;
        if(h45) t.heat45++;
        if(man) t.manOk++;
        if(noCh) t.noChallenge++;
        /* the PAIRS, because the item is about two terms that move oppositely */
        if(h45 && s2) t.heatAndStage++;
        if(e1 && s2) t.edgeAndStage++;
        if(h45 && e1) t.heatAndEdge++;
        if(s2 && e1 && h45 && man && noCh) t.allFour++;
        if(A.nemCanCallOut(d)){ t.canCall++; calls++; }
        /* the three states of the answer button, off the game's own gate and its own price */
        { const cost = A.nemAnswerCost(d);   /* no fallback: if the export goes, this must fail loudly */
          if(!A.nemAnswerReady(d)) t.btnCooling++;
          else if(d.gold < cost){ t.btnShort++; shortWeeks++; }
          else t.btnReady++; }
        if(edge > bestEdge) bestEdge = edge;
        if((n.heat||0) > bestHeat) bestHeat = n.heat||0;
        edgeSeen[Math.max(-5, Math.min(5, edge))] = (edgeSeen[Math.max(-5, Math.min(5, edge))]||0)+1;
        const band = Math.floor((n.heat||0)/10)*10;
        heatBands[band] = (heatBands[band]||0)+1;
      }
      const did = R.lanista(d, OPTS);
      if(did.answeredNem){ t.answered++; ans++; }
      if(did.calledOut){ t.calledOut++; }
    }
    if(calls) t.everCall++;
    if(shortWeeks) t.everShort++;
    houses.push({ h, weeks:d.week, nemWeeks, ans, calls,
      bestEdge: bestEdge === -99 ? null : bestEdge, bestHeat: Math.round(bestHeat),
      ended: d.over ? d.over.kind : "alive" });
  }
  return { t, houses, edgeSeen, heatBands, H, W, rope:R.say() };
}, [H,W,ARM]);
await browser.close(); server.close();
const T = out.t;
const pc = (n,d) => d ? `${(n/d*100).toFixed(1)}%` : "-";
console.log(`=== #134 — CAN THE CALL-OUT WINDOW OPEN? ===  [${ARM}]`);
console.log(`  ${T.weeks} house-weeks over ${out.H} houses · a nemesis existed on ${T.hasNem} of them (${pc(T.hasNem,T.weeks)})`);
console.log(`  the lanista answered ${T.answered} times and called the day ${T.calledOut} times\n`);
console.log(`  EACH TERM ALONE, as a share of the weeks a nemesis existed:`);
console.log(`    stage >= 2                    ${String(T.stage2).padStart(5)}  (${pc(T.stage2,T.hasNem)})`);
console.log(`    edge >= 1  (answered > hits)  ${String(T.edge1).padStart(5)}  (${pc(T.edge1,T.hasNem)})`);
console.log(`    heat >= 45                    ${String(T.heat45).padStart(5)}  (${pc(T.heat45,T.hasNem)})`);
console.log(`    a man at pfame >= 18          ${String(T.manOk).padStart(5)}  (${pc(T.manOk,T.hasNem)})`);
console.log(`    no challenge already pending  ${String(T.noChallenge).padStart(5)}  (${pc(T.noChallenge,T.hasNem)})`);
console.log(`\n  THE PAIRS — the item is that two of these move in opposite directions:`);
console.log(`    heat AND stage                 ${String(T.heatAndStage).padStart(5)}  (${pc(T.heatAndStage,T.hasNem)})`);
console.log(`    edge AND stage                 ${String(T.edgeAndStage).padStart(5)}  (${pc(T.edgeAndStage,T.hasNem)})`);
console.log(`    HEAT AND EDGE                  ${String(T.heatAndEdge).padStart(5)}  (${pc(T.heatAndEdge,T.hasNem)})   <- the tension`);
console.log(`\n  all four together              ${String(T.allFour).padStart(5)}  (${pc(T.allFour,T.hasNem)})`);
console.log(`  and the game's own gate agrees ${String(T.canCall).padStart(5)}  (${pc(T.canCall,T.hasNem)})`
  + `   [these must match; if they do not, my reading of the gate is wrong]`);
console.log(`  houses that saw the window open at all: ${T.everCall} of ${out.H}`);
console.log(`\n  the edge as it was actually seen (clamped to ±5), so the shape is visible:`);
console.log(`    ` + Object.entries(out.edgeSeen).sort((a,b)=>a[0]-b[0]).map(([k,v])=>`${k}: ${v}`).join("  "));
console.log(`  and the heat, in bands of ten:`);
console.log(`    ` + Object.entries(out.heatBands).sort((a,b)=>a[0]-b[0]).map(([k,v])=>`${k}+: ${v}`).join("  "));
console.log(`\n  house  weeks  nemesis weeks  answers  window open  best edge  best heat  ended`);
for(const h of out.houses)
  console.log(`  ${String(h.h).padStart(5)}  ${String(h.weeks).padStart(5)}  ${String(h.nemWeeks).padStart(13)}`
    + `  ${String(h.ans).padStart(7)}  ${String(h.calls).padStart(11)}  ${String(h.bestEdge==null?"-":h.bestEdge).padStart(9)}`
    + `  ${String(h.bestHeat).padStart(9)}  ${h.ended}`);
console.log(`\n  #174 — THE ANSWER BUTTON, over the ${T.hasNem} house-weeks a nemesis existed:`);
console.log(`    cooling off  (not ready)      ${String(T.btnCooling).padStart(5)}  (${pc(T.btnCooling,T.hasNem)})   reads "Answered · Nw"`);
console.log(`    ready, purse SHORT            ${String(T.btnShort).padStart(5)}  (${pc(T.btnShort,T.hasNem)})   reads "Answer him · Nd — not enough coin"`);
console.log(`    ready and affordable          ${String(T.btnReady).padStart(5)}  (${pc(T.btnReady,T.hasNem)})   reads "Answer him · Nd"`);
console.log(`    houses that ever saw the short label: ${T.everShort} of ${out.H}`);
console.log(`    — before v3.69.0 the short branch said only "Answer · Nd", differing from the affordable`);
console.log(`      one by the word "him" on an already-greyed button. It is not a rare state, which is`);
console.log(`      why it was worth a wording rather than a deletion.`);
console.log(`\n  rope: ${out.rope}`);
