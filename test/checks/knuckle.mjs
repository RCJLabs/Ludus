/* A DEBT OVER DICE ASKS FOR A SITUATION NOW, NOT A ROSTER — #283

   (`knuckle` was free in BOTH directories; checked before writing. `probes/dice.mjs` is about the
   RNG die's draws and has nothing to do with this card.)

   Four of the five cards in the night deck describe a state the house is actually in — a rival tie
   at strength, a man under 38 morale, unrest past 22, a veteran holding the block together. The
   fifth asked `activeG(d).length>=3` and then took `twoDistinct(activeG(d))`: three men exist, so
   here are two of them at random.

   Measured (#281) it was eligible on 58% of weeks and took 58% of the deal. And its `build` could
   hand the card two men who already had a tie — which matters because **the card's whole mechanical
   job is to CREATE one**: every branch of its `run` calls `addTie`, and a debt between two men who
   are already brothers or already rivals spends the card on nothing.

   `dicePairs` is the gate and the cast in one place, which is #150's same-call rule: the two men
   the card is about are the two men it was allowed for.

   WHAT THIS DID AND DID NOT DO, because #281 shipped a night-deck fix that did nothing and only
   measuring it afterwards said so. Live over 40 houses x 420 weeks, a player who walks:

       nights            8.5% -> 9.2% of weeks      (UP — the feared cost did not appear)
       dice's share      61.1% -> 54.1%
       brawl eligible    32.4% -> 40.7%             brawl's share 25.8% -> 32.8%
       night, in houses  7 -> 12 of 40
       most-repeated card in one house   3x -> 2x

   `brawl` gained because `dice` now only fires on UNTIED pairs, so every card it deals makes a new
   relationship instead of thickening one that existed — it became a better tie-generator, which is
   what `brawl.need` eats. The feedback runs the opposite way from the obvious fear.

   AND THE THING IT DID NOT MOVE: a house still meets a median of **2 of the 5 cards**. That ceiling
   is house lifespan (#282 measured the median house at four nights in its life and closed it as the
   intended bargain), not the picker, and nothing in this release claims otherwise.

   FOUR ARMS. */
import { hasHandle } from "../harness.mjs";

export const name = "knuckle";
export const describe = "the dice card is gated on a situation, and the pair it is dealt about is the pair it was allowed for";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const miss = ["newGameState","activeG","NIGHT","dicePairs","DICE_IDLE","tieBetween","addTie",
      "genGladiator"].filter(k=>A[k]==null);
    if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

    /* a house of five men, every one of them standing, with the levers this card reads */
    const house = (tag)=>{
      const d = A.newGameState("Kn","clean",`KNUCKLE-${tag}`);
      while(A.activeG(d).length < 5){ const g = A.genGladiator(d, 28); g.status = "active"; d.gladiators.push(g); }
      d.week = 40;
      A.activeG(d).forEach(g=>{ g.morale = 70; g.defiance = 20; g.injury = null;
        g.refusing = false; g.learning = null; g.benched = null; });
      d.unrest = 5;
      return d;
    };
    const men = d => A.activeG(d);

    /* ---- 1. a roster on its own is not a situation ---- */
    const dBusy = house("busy");
    men(dBusy).forEach(g=>{ g.lastFought = dBusy.week; });        /* everybody fought this week */
    const busyOK = A.NIGHT.dice.need(dBusy);
    /* ---- AND THIS FIXTURE HAS TO PROVE ITS OWN PREMISE ----
       The first cut tied all ten pairs of a five-man house and asserted the gate was shut. It was
       not, and the cause was `addTie` refusing: `MAX_TIES` is 3, and a complete graph on five men
       wants four ties a man. The fixture had silently failed to set up the state it was testing,
       which is the same class of fault as every probe bug this sweep has caught. Four men is a
       complete graph at exactly MAX_TIES, and `tiedAll` says whether it worked. */
    const dTied = house("tied");
    while(men(dTied).length > 4) dTied.gladiators.find(g=>g.status === "active").status = "retired";
    men(dTied).forEach(g=>{ g.lastFought = dTied.week - 20; });   /* all idle ... */
    { const m = men(dTied);                                       /* ... and all already tied */
      for(let i=0;i<m.length;i++) for(let j=i+1;j<m.length;j++) A.addTie(dTied, m[i].id, m[j].id, "brother", 30); }
    let tiedAll = true;
    { const m = men(dTied);
      for(let i=0;i<m.length;i++) for(let j=i+1;j<m.length;j++)
        if(!A.tieBetween(dTied, m[i].id, m[j].id)) tiedAll = false; }
    const tiedOK = A.NIGHT.dice.need(dTied);
    const dFree = house("free");
    men(dFree).forEach(g=>{ g.lastFought = dFree.week - 20; });
    const freeOK = A.NIGHT.dice.need(dFree);
    const rosters = { busy:men(dBusy).length, tied:men(dTied).length, free:men(dFree).length };

    /* ---- 2. DICE_IDLE exactly ---- */
    const edge = [];
    for(const back of [A.DICE_IDLE - 1, A.DICE_IDLE]){
      const d = house(`edge${back}`);
      men(d).forEach(g=>{ g.lastFought = d.week; });
      const m = men(d); m[0].lastFought = d.week - back; m[1].lastFought = d.week - back;
      edge.push({ back, on:A.NIGHT.dice.need(d), pairs:A.dicePairs(d).length });
    }

    /* ---- 3. the gate and the cast are the same pair ---- */
    let built = 0, agreed = 0, sample = null;
    for(let t=0;t<60;t++){
      const d = house(`cast${t}`);
      const m = men(d);
      m.forEach((g,i)=>{ g.lastFought = d.week - (i < 3 ? 20 : 0); });   /* only the first three are idle */
      A.addTie(d, m[0].id, m[1].id, "rival", 40);                        /* and one of those pairs is taken */
      if(!A.NIGHT.dice.need(d)) continue;
      const c = A.NIGHT.dice.build(d);
      if(!c) continue;
      built++;
      const idleEnough = x => d.week - (x.lastFought == null ? -9 : x.lastFought) >= A.DICE_IDLE;
      const a = m.find(x=>x.id === c.aid), b = m.find(x=>x.id === c.bid);
      const ok = !!(a && b && a.id !== b.id && idleEnough(a) && idleEnough(b) && !A.tieBetween(d, a.id, b.id));
      if(ok) agreed++; else if(!sample) sample = { a:a&&a.name, b:b&&b.name,
        aIdle:a&&idleEnough(a), bIdle:b&&idleEnough(b), tied:!!(a&&b&&A.tieBetween(d,a.id,b.id)) };
    }

    /* ---- 4. every branch leaves a tie where there was none ---- */
    const branch = [];
    for(const i of [0,1,2]){
      const d = house(`run${i}`);
      men(d).forEach(g=>{ g.lastFought = d.week - 20; });
      d.gold = 500;
      const c = A.NIGHT.dice.build(d);
      if(!c){ branch.push({ i, built:false }); continue; }
      const before = !!A.tieBetween(d, c.aid, c.bid);
      let threw = null;
      try { A.NIGHT.dice.run(d, c, i); } catch(e){ threw = e.message; }
      branch.push({ i, built:true, before, after:!!A.tieBetween(d, c.aid, c.bid), threw });
    }

    return { busyOK, tiedOK, freeOK, tiedAll, rosters, edge, built, agreed, sample, branch,
      IDLE:A.DICE_IDLE };
  });

  if(out.why) return { pass:false, why:out.why, lines:[] };
  const lines = [], fails = [];

  lines.push(`1. men standing · all fought this week: need ${out.busyOK} `
    + `· ${out.rosters.tied} idle but every pair tied (fixture achieved that: ${out.tiedAll}): need ${out.tiedOK} `
    + `· all idle and untied: need ${out.freeOK}`);
  if(!out.tiedAll) fails.push(`the arm-1 fixture did not manage to tie every pair, so its result says `
    + `nothing — MAX_TIES caps a man's ties and the fixture must stay inside it`);
  if(out.busyOK) fails.push(`a roster of ${out.rosters.busy} who all fought this week still opens the card `
    + `— that is the roster gate this item replaced`);
  if(out.tiedOK) fails.push(`a roster of ${out.rosters.tied} idle men who already have ties opens the card, `
    + `and every branch of its \`run\` calls \`addTie\` — it would spend itself on a tie that exists`);
  if(!out.freeOK) fails.push("idle, untied men do not open the card at all");

  for(const e of out.edge)
    lines.push(`2. two men ${e.back}w off the sand (DICE_IDLE ${out.IDLE}): need ${e.on} · ${e.pairs} pairs`);
  const shy = out.edge.find(e=>e.back === out.IDLE - 1), at = out.edge.find(e=>e.back === out.IDLE);
  if(shy && shy.on) fails.push(`${shy.back} weeks off the sand qualifies, and DICE_IDLE is ${out.IDLE}`);
  if(at && !at.on) fails.push(`${at.back} weeks off the sand does NOT qualify, and DICE_IDLE is ${out.IDLE}`);

  lines.push(`3. the cast: ${out.agreed} of ${out.built} builds returned a pair the gate allows`);
  if(!out.built) fails.push("no build ever ran — arm 3 tested nothing");
  else if(out.agreed !== out.built)
    fails.push(`${out.built - out.agreed} of ${out.built} builds cast a pair the gate would not have `
      + `allowed${out.sample ? ` (e.g. ${out.sample.a} + ${out.sample.b}: idle ${out.sample.aIdle}/${out.sample.bIdle}, `
      + `already tied ${out.sample.tied})` : ""} — the gate and the cast must be the same question`);

  for(const b of out.branch)
    lines.push(`4. answer ${b.i}: ${b.built ? `tie before ${b.before} -> after ${b.after}` : "nothing built"}`
      + (b.threw ? ` THREW ${b.threw}` : ""));
  for(const b of out.branch){
    if(!b.built){ fails.push(`answer ${b.i} could not be built on a house of idle untied men`); continue; }
    if(b.threw) fails.push(`answer ${b.i} threw: ${b.threw}`);
    if(b.before) fails.push(`answer ${b.i} was dealt about a pair that already had a tie`);
    if(!b.after) fails.push(`answer ${b.i} left no tie between them — making one is the card's whole `
      + `mechanical job, and \`brawl.need\` is what eats it`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
