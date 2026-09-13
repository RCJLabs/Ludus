/* THE FIVE-CARD NIGHT DECK, AND WHETHER ALL FIVE ARE DEALT — #281.

     node test/probes/lamp.mjs 40 420

   #268 named this deck as the road's largest missing content and refused to open it. Before any
   decision about WHERE it can be reached, the question is whether it works where it already lives.

   ---- AND #268'S CITATION FOR IT IS WRONG, WHICH IS WHY THIS STARTS BY COUNTING DOORS ----
   Its note reads: *"`walkTheCells` is the ONLY caller of `pickNight`, so its gate is the whole of
   the road's access to the five-card night deck."* `pickNight` has TWO callers:

       walkTheCells       `if(R()<0.5){ const ev = nightEvent(d, pickNight(d)); ... }`
       EVENTS.ludusNight  `make(d){ ... if(R()>0.5) return null; return nightEvent(d, pickNight(d)); }`

   The CONCLUSION survives — `ludusNight.make` opens with its own `awayFromCapua(d)` guard, so both
   doors are shut on the road — but by a different route than the one it gives. Two doors, each
   behind its own coin flip.

   ---- WHAT THIS IS ACTUALLY LOOKING FOR ----
   `pickNight` is `pick(fit)`: **uniform over whichever cards are eligible**, with no weights. So a
   card's share of the deck is decided entirely by how often its `need` puts it in the pool, and the
   five needs are not close to each other in permissiveness:

       dice      activeG >= 3                                            — one term
       night     activeG >= 3 AND (unrest >= 22 OR mean morale < 52)
       brawl     a rival tie >= 30 with both men active
       cracking  a man under 38 morale AND (memory OR strain > 50 OR scars)
       steadied  activeG >= 3 AND a man with wins >= 6 AND regard >= 55
                 AND (unrest >= 25 OR somebody under 40 morale)          — three terms

   `nemesis` is the precedent and it is this project's oldest rule about tables: a conjunction has
   to be split by term before anything can be said about it, because a gate that never opens and a
   die that never picks look identical from the outside. This counts the POOL as well as the deal,
   so the two can be told apart. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420);
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","endWeek","activeG","NIGHT","NIGHT_KEYS","pickNight"]
    .filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  /* ---- TWO ARMS, BECAUSE THE ROPE HARDLY EVER WALKS ----
     The reference rope's cells step is `if(d.unrest >= 22 && walkTheCells(d))`, and #280 measured
     home unrest averaging 3.0 — so the walk door is all but shut for it, and counting nights
     against that policy measures the POLICY, not the deck. `walkReady` allows a walk every
     `WALK_COOL` weeks to any house standing in Capua. So: `reactive` is the reference player, and
     `walks` calls `walkTheCells` every week it is allowed, which is the ceiling a player who works
     his cells actually sees. Same split as #279's `free:true`, which gave a confident worthless
     answer before the second arm was added. */
  const KEYS = A.NIGHT_KEYS;
  const pool = {}, dealt = {}, byDoor = { walk:{}, die:{} };
  for(const k of KEYS){ pool[k] = 0; dealt[k] = 0; byDoor.walk[k] = 0; byDoor.die[k] = 0; }
  let weeks = 0, poolWeeks = 0, nights = 0, houses = 0;
  const poolSize = {};           /* how many cards were eligible at once */
  const everDealt = {};          /* key -> houses that ever saw it */
  for(const k of KEYS) everDealt[k] = new Set();

  const arm = (walker, tag) => {
  const pool = {}, dealt = {}, byDoor = { walk:{}, die:{} };
  for(const k of KEYS){ pool[k] = 0; dealt[k] = 0; byDoor.walk[k] = 0; byDoor.die[k] = 0; }
  let weeks = 0, poolWeeks = 0, nights = 0, houses = 0, walks = 0;
  const poolSize = {};
  const everDealt = {};
  for(const k of KEYS) everDealt[k] = new Set();
  const perHouse = [];              /* what ONE house saw, which is what a player experiences */
  for(let i=0;i<H;i++){
    const d = A.newGameState("Lp","clean",`${tag}-${i}`);
    houses++;
    const mine = {};
    const note = k => { mine[k] = (mine[k]||0) + 1; };
    for(let w=0; w<W; w++){
      if(d.over) break;
      weeks++;

      /* ---- the POOL, read straight off the needs, with no R() spent ---- */
      let n = 0;
      for(const k of KEYS){
        let ok = false; try { ok = !!A.NIGHT[k].need(d); } catch(e){}
        if(ok){ pool[k]++; n++; }
      }
      if(n) poolWeeks++;
      poolSize[n] = (poolSize[n]||0) + 1;

      /* ---- the DEAL, by which door it came through ---- */
      const had = !!d.pendingEvent;
      /* ---- READ THE WALK'S NIGHT BEFORE THE ROPE ANSWERS IT ----
         The first cut walked, then called `R.lanista`, then looked at `d.pendingEvent`. The rope
         ANSWERS the week's question and sets it to null, so the walk's night was resolved and
         cleared before it was ever counted: 730 walks produced 8 recorded nights where the coin
         alone predicts about 365. The reading is taken between the two now. */
      if(walker && !d.pendingEvent){
        try { if(A.walkTheCells(d) === true) walks++; } catch(e){}
        const wev = d.pendingEvent;
        if(wev && wev.id === "ludusNight" && wev.data && wev.data.sit){
          nights++; dealt[wev.data.sit.kind]++; byDoor.walk[wev.data.sit.kind]++;
          everDealt[wev.data.sit.kind].add(i); note(wev.data.sit.kind);
        }
      }
      const hadAfterWalk = !!d.pendingEvent;
      try { R.lanista(d, MOST); } catch(e){}
      let ev = d.pendingEvent;
      if(!had && !hadAfterWalk && ev && ev.id === "ludusNight" && ev.data && ev.data.sit){
        nights++; dealt[ev.data.sit.kind]++; byDoor.walk[ev.data.sit.kind]++;
        everDealt[ev.data.sit.kind].add(i); note(ev.data.sit.kind);
      }
      const before = !!d.pendingEvent;
      try { A.endWeek(d); } catch(e){ break; }
      ev = d.pendingEvent;
      if(!before && ev && ev.id === "ludusNight" && ev.data && ev.data.sit){
        nights++; dealt[ev.data.sit.kind]++; byDoor.die[ev.data.sit.kind]++;
        everDealt[ev.data.sit.kind].add(i); note(ev.data.sit.kind);
      }
    }
    const seen = Object.keys(mine).length, n = Object.values(mine).reduce((a,b)=>a+b,0);
    if(n) perHouse.push({ seen, n, most: Math.max(...Object.values(mine)),
      top: Object.entries(mine).sort((a,b)=>b[1]-a[1])[0][0] });
  }
  const ph = perHouse;
  const med = a => a.length ? a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)] : 0;
  return { tag, weeks, houses, poolWeeks, nights, walks, pool, dealt, byDoor, poolSize,
    reach: Object.fromEntries(KEYS.map(k=>[k, everDealt[k].size])),
    hadAny: ph.length, medSeen: med(ph.map(x=>x.seen)), medNights: med(ph.map(x=>x.n)),
    medMost: med(ph.map(x=>x.most)), allFive: ph.filter(x=>x.seen === KEYS.length).length,
    oneOnly: ph.filter(x=>x.seen === 1).length };
  };
  return { KEYS, reactive: arm(false, "LAMP"), walks: arm(true, "WALKER") };
}, [H, W, MOST]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); }
else {
  const pc = (a,b) => b ? (a/b*100).toFixed(1) : "0.0";
  const say = (r, title) => {
    console.log(`\n  ${title}`);
    console.log(`    ${r.houses} houses · ${r.weeks} played weeks · ${r.walks} walks taken `
      + `· a night came up ${r.nights} times (${pc(r.nights, r.weeks)}% of weeks)`);
    const tot = Object.values(r.dealt).reduce((a,b)=>a+b,0) || 1;
    for(const k of out.KEYS.slice().sort((a,b)=>r.pool[b]-r.pool[a]))
      console.log(`      ${k.padEnd(9)} eligible ${pc(r.pool[k], r.weeks).padStart(5)}% of weeks `
        + `· dealt ${String(r.dealt[k]).padStart(3)} (${pc(r.dealt[k], tot).padStart(5)}%) `
        + `· walk ${String(r.byDoor.walk[k]).padStart(3)} / die ${String(r.byDoor.die[k]).padStart(3)} `
        + `· in ${r.reach[k]} of ${r.houses} houses${r.dealt[k] === 0 ? "  <- NEVER DEALT" : ""}`);
  };
  console.log(`\n#281 — THE FIVE-CARD NIGHT DECK`);
  say(out.reactive, "THE REFERENCE PLAYER — walks only when unrest >= 22, which #280 measured at a mean of 3.0");
  say(out.walks,    "A PLAYER WHO WORKS HIS CELLS — walks every week `walkReady` allows");
  const w = out.walks;
  console.log(`\n  what ONE house saw, walking (${w.hadAny} of ${w.houses} houses had a night at all):`);
  console.log(`    median ${w.medNights} nights, ${w.medSeen} of ${out.KEYS.length} distinct cards, `
    + `most-repeated card seen ${w.medMost}x · all five: ${w.allFive} houses · only one card: ${w.oneOnly}`);
  console.log(`\n  how many of the five were eligible at once (walking arm):`);
  for(const n of Object.keys(out.walks.poolSize).sort())
    console.log(`    ${n} card${n==="1"?"":"s"}: ${String(out.walks.poolSize[n]).padStart(5)} weeks `
      + `(${pc(out.walks.poolSize[n], out.walks.weeks)}%)`);
  console.log("");
}

await browser.close(); server.close();
