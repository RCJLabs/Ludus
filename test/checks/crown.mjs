/* THE TOP RUNG OF CAPUA, AND THE ONE WORD YOU ARE TOLD FOR NOTHING.

   `primusMine`, `primusEligible`, `primusWeek`, `PRIMUS_GATE`, `seedPrimus`, `makePrimusOffer`
   and `makeDefenceOffer` went onto the test handle in v2.64.0 for the express purpose of being
   checked. Six releases later the coverage sweep still listed every one of them as never called.
   The primacy is the top of the Capuan ladder and one of the two roads to Rome — `romeReady`
   reads `d.flags.primusHeld`, and #88 found that flag was read in four places and written in
   none, so no save in any version could reach the imperial games.

   WHAT THE MEASUREMENT FOUND, in the order it found it, because three of the four rounds were
   about my own probe and that is the normal ratio here.

   1. Over 490 house-weeks: the whole gate stood open in 22.2% of weeks, 23 primacy offers came,
      and the title was taken **0 times**. Our man died in 6 of the 20 bouts fought.
   2. The odds the game quoted our best man on those 20: **eighteen of them at 3 or 4 per cent.**
   3. That is evidence about the probe first. Side by side, my man was mean 65 and thirty-four
      years old while the primus climbed from 67 to 78 in twelve weeks — my policy was buying the
      best mean on the block, which on a veterans opening buys men already past PRIME [23,28].
   4. REFUTED. Constructed at the ceiling v2.68.0 proved reachable — a yard at mean 99 — the game
      quotes **98%** and the crown is taken in **91.7% of 120 bouts**, with no deaths. Even a
      mean-65 yard is quoted 53% and wins 57.5%. The primacy is not a wall. It is arithmetic, and
      the arithmetic was about the state of my house.

   AND THE THING THAT WAS ACTUALLY WRONG, which none of that was looking for. `readMatch` — the
   per-man reading on the pick screen — returns a real word only when `seen`, and the `wall`
   measurement says a house holds a fresh reading on **15.3%** of the men it is offered. For the
   other 84.7% it says "no read". The one thing given free is `menace(o.opp)` on the offer, and
   its top bucket began at mean 66 while the game's men run to 99: measured against one man at
   mean 92, "Lethal" covered **mean 66 to 99, a quoted chance of 88% down to 4%**. One word for
   the whole top of the game — the primacy, the fourth rung, Rome and the entire elite pool —
   while three words split the range below it where the same man is quoted 86 to 98.

   So: `Murderous` at 78 and `Peerless` at 90, and this check holds every word to covering a band
   where the quote actually differs. */

import { hasHandle } from "../harness.mjs";

export const name = "crown";
export const describe = "the primacy can be won, held and lost, and the free reading says something";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], note = [];
    const S6 = ["str","agi","end","tec","sho","dis"];
    const mean = x => S6.reduce((t,k)=>t+(x[k]||0),0)/6;

    /* a great house: six men at the ceiling a properly-run yard reaches, past the primacy gate */
    const great = (ceil) => {
      const d = A.newGameState("Cw","clean","CROWN-"+ceil,null);
      d.gold = 400000; d.fame = 600; d.favor = 70;
      while(A.activeG(d).length < 6 && !A.rosterFull(d)){
        const m = (d.market||[])[0]; if(!m){ A.makeMarket(d); continue; }
        if(!A.buyFromBlock(d, m.id, null)) break; }
      for(const g of A.activeG(d)){
        for(const k of S6) g[k] = ceil;
        g.age = 26; g.injury = null; g.fatigue = 0; g.strain = 0;
        g.wins = 20; g.losses = 2; g.pfame = 120; g.morale = 80;
        A.armHimOff(d, g.id); }
      return d;
    };

    /* ---- 1. THE GATE ---- */
    const d = great(95);
    const g0 = A.activeG(d)[0];
    if(!A.primusEligible(g0))
      bad.push(`a man with ${g0.wins} wins and renown ${Math.round(g0.pfame)} does not pass PRIMUS_GATE `
        + `(${A.PRIMUS_GATE.wins} wins, ${A.PRIMUS_GATE.pfame} renown)`);
    const raw = A.genGladiator(d, 40); raw.wins = 0; raw.pfame = 0;
    if(A.primusEligible(raw)) bad.push(`a man with no wins and no renown passes the primacy gate`);

    /* ---- 2. THE CITY PUTS ITS CROWN UP ---- */
    d.primus = null;
    let seeded = 0;
    for(let i=0;i<40 && !d.primus;i++){ A.seedPrimus(d); if(d.primus) seeded = i+1; }
    if(!d.primus) bad.push(`seedPrimus was called 40 times and Capua still has no primus`);
    else {
      if(A.primusMine(d)) bad.push(`seedPrimus gave the title to this house rather than to the city`);
      if(!d.primus.house || !d.primus.name) bad.push(`the primus has no house or no name: ${JSON.stringify(d.primus)}`);
    }
    const offer = A.makePrimusOffer(d, 3);
    if(!offer) bad.push(`a house at fame ${d.fame} with an eligible man is offered no primacy bout`);
    else {
      if(!offer.primus) bad.push(`makePrimusOffer returned an offer that is not flagged primus`);
      if(offer.tier < 3) bad.push(`the crown of the city is offered at tier ${offer.tier}`);
      if(!offer.oppRef || offer.oppRef.fid !== d.primus.fid)
        bad.push(`the primacy bout is against somebody other than the man holding it`);
    }

    /* ---- 3. WINNING IT, HOLDING IT, DEFENDING IT, LOSING IT ---- */
    let took = 0, tries = 0, deaths = 0, quote = null;
    if(offer){
      let best = null, bw = 0;
      for(const g of A.activeG(d)){ let w = 0; try { w = A.winChance(g, offer.opp); } catch(e){}
        if(w > bw){ bw = w; best = g; } }
      quote = Math.round(bw * 100);
      for(let i=0;i<40;i++){
        const s = A.clone(d);
        const g = A.activeG(s).find(x=>x.id===best.id); if(!g) break;
        g.lastFought = null; g.fatigue = 0;
        const o = A.clone(offer); o.stakes = "standard";
        tries++;
        let x = A.doFight(s, g.id, o, "measured", null, null, null, "none");
        /* #116: to exhaustion — a bout still at the balance never awarded the primacy */
        { let n=0; while(x && x.crux && n++<4){ const pd = x.pending; pd.beats = x.beats;
          x = A.doFight(s, g.id, o, "measured", null, pd, "press", "none"); } }
        if(A.primusMine(s)) took++;
        if(x && x.dead) deaths++;
      }
      if(!took) bad.push(`a yard at mean ${Math.round(mean(best))} quoted ${quote}% took the crown `
        + `0 times in ${tries} bouts — the top rung of Capua cannot be climbed`);
    }
    /* the reign: it must pay, it must be defensible, and it must be losable */
    const h = great(95);
    const hg = A.activeG(h)[0];
    A.primusTake(h, hg, "Somebody Else");
    if(!A.primusMine(h)) bad.push(`primusTake ran and the house does not hold the primacy`);
    if(!(h.flags.primusHeld > 0))
      bad.push(`the title was taken and flags.primusHeld is ${h.flags.primusHeld} — the road to Rome reads that`);
    const def = A.makeDefenceOffer(h);
    if(!def) bad.push(`the holder of the primacy is never offered a defence`);
    else {
      if(!def.defence) bad.push(`makeDefenceOffer returned an offer that is not flagged as a defence`);
      /* lose it, and the title must actually leave */
      const l = A.clone(h);
      A.primusLose(l, "Some Other House", false);
      if(A.primusMine(l)) bad.push(`the primacy was lost and the house still holds it`);
      if(l.primus) bad.push(`the primacy was lost and d.primus is still set`);
    }
    /* and the man four doors down asks, which is the channel #92 gave it */
    const q = A.clone(h);
    q.primus.since = q.week - 20; q.primus.asked = null; q.pendingEvent = null;
    const second = A.activeG(q).find(x=>x.id !== q.primus.gid);
    if(second){ second.wins = 12; second.pfame = 90; }
    let asked = 0;
    for(let i=0;i<400;i++){
      const s = A.clone(q); s.pendingEvent = null;
      A.primusWeek(s);
      if(s.pendingEvent) asked++;
    }
    if(!asked) bad.push(`the second-best man in the cells never asks for the title in 400 weeks, `
      + `and PRIMUS_ASK is ${A.PRIMUS_ASK} a week`);

    /* ---- 4. THE FREE READING MUST SAY SOMETHING ----
       every word must cover a band where the quoted chance actually differs, and no word may
       swallow the top of the game the way "Lethal" did from 66 to 99 */
    const me = A.activeG(great(92))[0];
    /* ONE OPPONENT PER STEP IS NOISE, NOT A READING. `genOpponent` varies kit and traits, and
       overwriting the six stats leaves both alone — the first version of this section had the
       quote at mean 78 reading 86% in one run and 50% in another, and then tripped its own bar
       on the difference. Twelve men per step, averaged. */
    const ramp = [];
    for(let target=36; target<=99; target+=3){
      let sum = 0, n = 0, word = null;
      for(let i=0;i<12;i++){
        const o = A.genOpponent(3, 82);
        for(const k of S6) o[k] = target;
        o.wins = 12; o.pfame = 80;
        word = A.menace(o);
        let w = 0; try { w = A.winChance(me, o); } catch(e){}
        sum += w; n++;
      }
      ramp.push({ mean:target, word, q:Math.round(sum/Math.max(1,n)*100) });
    }
    const byWord = {};
    for(const r of ramp) (byWord[r.word] = byWord[r.word] || []).push(r);
    const spans = {};
    for(const [word, rs] of Object.entries(byWord)){
      const qs = rs.map(r=>r.q).sort((a,b)=>a-b);
      spans[word] = { lo:rs[0].mean, hi:rs[rs.length-1].mean, qHi:qs[qs.length-1], qLo:qs[0],
                      span:qs[qs.length-1]-qs[0] };
    }
    /* the bar: no single word may cover more than 45 points of quoted chance. "Lethal" covered
       84 (88% down to 4%) before this release, and the words below it covered 12 between them */
    for(const [word, s] of Object.entries(spans)){
      if(s.span > 45)
        bad.push(`"${word}" covers opponent mean ${s.lo} to ${s.hi}, which is a quoted chance of `
          + `${s.qHi}% down to ${s.qLo}% — ${s.span} points of difference inside one word, and it is `
          + `the only reading a player gets without paying to have the man watched`);
    }
    if(A.MENACE_WORDS.length < 5)
      bad.push(`there are only ${A.MENACE_WORDS.length} words for the whole range of men in the game`);
    /* and the paid reading must be better than the free one, which is the bargain */
    const foe = A.genOpponent(3, 82);
    const blind = A.readMatch(me, foe, false), told = A.readMatch(me, foe, true);
    if(!blind || !told) bad.push(`readMatch returned nothing`);
    else if(blind.word === told.word && Math.abs(told.edge) > 0.14)
      bad.push(`a man nobody has watched reads the same as one you have paid for `
        + `("${blind.word}") on a match-up with an edge of ${told.edge.toFixed(2)}`);

    return { bad, note, quote, took, tries, deaths, seeded, asked,
      gate:A.PRIMUS_GATE, ask:A.PRIMUS_ASK, gap:A.PRIMUS_ASK_GAP,
      primus: d.primus ? { name:d.primus.name, house:d.primus.house } : null,
      oppMean: offer ? +mean(offer.opp).toFixed(1) : null,
      words:A.MENACE_WORDS, spans, ramp,
      blind: blind && blind.word, told: told && told.word };
  });

  const lines = [];
  lines.push(`the gate: ${out.gate.wins} wins and ${out.gate.pfame} renown`
    + ` · the city seeded a primus in ${out.seeded} call${out.seeded===1?"":"s"}`
    + (out.primus ? ` — ${out.primus.name} of House ${out.primus.house}, mean ${out.oppMean}` : ""));
  lines.push(`a yard at the reachable ceiling is quoted ${out.quote}% and took the crown `
    + `${out.took} of ${out.tries} times (${(out.took/Math.max(1,out.tries)*100).toFixed(1)}%), `
    + `losing the man ${out.deaths} times`);
  lines.push(`the reign: taken, flagged for Rome, a defence offered, and losable`
    + ` · the second-best man asked in ${out.asked} of 400 weeks (PRIMUS_ASK ${out.ask}, gap ${out.gap})`);
  lines.push(`the free word, and the quote it hides — ${out.words.join(" · ")}:`);
  for(const w of out.words){ const s = out.spans[w]; if(!s) continue;
    lines.push(`  ${w.padEnd(10)} mean ${String(s.lo).padStart(2)}–${String(s.hi).padEnd(2)}`
      + ` → quoted ${String(s.qHi).padStart(2)}% down to ${String(s.qLo).padStart(2)}% (${s.span} points)`); }
  lines.push(`unwatched he reads "${out.blind}"; watched, "${out.told}"`);
  for(const n of out.note) lines.push(`  ${n}`);

  const fails = [...out.bad];
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
