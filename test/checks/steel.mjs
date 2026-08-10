/* BOUGHT STEEL WEARS, SAYS ALL FIVE OF ITS WORDS, AND BREAKS — AND THE PROBE THAT SAID OTHERWISE
   WAS READING THE SHELF.

   #114 measured `gearCond` 583 times and found it never read "keen" and never fell below 56, beside
   a lesson promising steel that "wears every bout and eventually breaks in the middle of one".
   BOTH HALVES OF THAT WERE THE INSTRUMENT. `d.gearCond[id]` is the pool of pieces ON THE SHELF:
   `buyGearItem` pushes 100 and `equipOne` splices that number straight back out when the piece
   goes on a man, so what is left in the pool is dominated by spoils off a dead opponent, which
   enter at `ri(55,85)` — which is where a floor of 56 comes from, and a ceiling under 85. While a
   piece is worn its condition lives in `g.wear[slot]`, which is what `wearWord`, the armoury bar,
   `kitFaults` and `gearScore` all read.

   READ OFF THE MAN, IT ALL WORKS. A bout takes 3-6 off a weapon — `WEAR_RATE.weapon`, measured at a
   median of 4 over 87 calls — a weapon carried through enough of them breaks, and a piece walking
   from 100 down to nothing says every one of the five words on the way. In a played house with no
   armoury, 76.6% of man-slot-weeks read "keen", 8.5% read "worn" or worse, and three pieces broke
   in sixty bouts.

   THREE INSTRUMENT FAULTS OF MINE ARE PINNED HERE, because each one changed a headline number and
   any of them can come back:

     1. THE ROPE. The first draft read only `d.games.offers` — the arena bill, which does not open
        until fame 25 — and fought 2 to 5 bouts in 91 weeks. `ends` already has this written on its
        face and I repeated it. The pit is the rope.

     2. THE CRUX, which is the expensive one. `doFight` returns at its `res.unfinished` branch
        BEFORE it calls `wearKit`, and mutates nothing at all, because the bout is being held for
        the box to speak. Between 41% and 82% of bouts reach the balance. A probe that stays silent
        measures a bout that never happened — and because the crux rate is highest at sine
        missione, the arm fighting to the death wore its steel LEAST, which looked like a finding
        about hard wear being backwards. Section 4 holds this per bout rather than as a ratio,
        because the two-arm version of it was wrong in the other direction: a silent arm measured
        MORE total wear than an answering one, since answering resolves the bout, the men die, and
        the silent arm simply got more turns.

     4. THE ROOM HAS TO BE PAID FOR. The arms comparing armamentarium levels ran `buildUp` on a
        fresh house's purse, so only level 1 was ever affordable and the L2 and L4 arms were the L1
        arm under another name — three runs printing the same 1,036 bouts is what gave it away.
        Section 6 asserts the level it actually built.

     3. THE BREAK COUNTER. My own detector — a slot that was under 30 and is now a different piece
        — undercounted by 60% (11 against 28) because a break re-arms the man from the rack with
        ANOTHER COPY OF THE SAME GEAR ID, so the slot looks untouched. The game's own chronicle
        line is the only honest counter, and it is what this check reads.

   WHAT IS TRUE AND IS NOT A FAULT, and is recorded so nobody re-opens it: wear is a system of the
   first years. On the chronicle line, breaks per ~1,050 bouts run 28 with no armamentarium, 2 at
   level 1, and 0 at levels 2 and 4; the keen share runs 83.3% at L0 against 94.8-96.3% above it.
   The room does what it says it does. And underneath even that, the piece outlives its owner: a
   man fights 3 bouts at the median and 8 at p90 against the 25 a weapon needs, only 2 of 241 men
   ever reached 25 of their own, and 207 of 263 left the yard dead. */

import { hasHandle } from "../harness.mjs";

export const name = "steel";
export const describe = "bought steel wears off the man, says all five words and breaks — and the crux must be answered";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const SLOTS = A.SLOTS;
    const wOf = (g,s) => A.wearOf(g, s);
    const wears = it => A.wears(it);
    const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
    const fin = (fn,args) => { try { return fn(...args); } catch(e){ return null; } };
    const q = (a,f)=>a.length ? a.slice().sort((x,y)=>x-y)[Math.max(0,Math.floor(a.length*f)-1)] : null;
    const BANDS = ["keen","serviceable","worn","failing","all but gone"];

    const dearest = slot => Object.entries(A.GEAR)
      .filter(([id,it])=>wears(it) && it.slot===slot)
      .sort((a,b)=>b[1].price-a[1].price)[0];
    const cheapFor = (d, slot) => Object.entries(A.GEAR)
      .filter(([id,it])=>wears(it) && it.slot===slot && it.price <= d.gold*0.22)
      .sort((a,b)=>b[1].price-a[1].price)[0];

    /* THE ROPE — the pit, because the bill is shut until fame 25 — AND THE CRUX ANSWERED unless
       told to stay silent, which section 4 needs. */
    const takeBout = (d, g, opts) => {
      const o2 = opts || {};
      const os = ((d.games && d.games.offers) || []).filter(o=>!(o.pair||o.melee||o.venatio));
      let o = os.length ? os[0] : null;
      if(!o){
        if(!d.pitCard || d.pitCard.week !== d.week) A.makePitCard(d);
        const men = A.pitMen(d) || [];
        o = A.makePitOffer(d, g, o2.stakes || "standard", men.length ? men[0].id : null);
      }
      if(!o) return { ran:false, crux:false };
      let r = fin(A.doFight, [d, g.id, o, "measured", null, null, null, "none"]);
      const sawCrux = !!(r && r.crux);
      if(o2.silent) return { ran:true, crux:sawCrux };
      let guard = 0;
      while(r && r.crux && guard++ < 5){
        const pd = r.pending; pd.beats = r.beats;
        r = fin(A.doFight, [d, pd.gid, pd.offer, pd.tactic, pd.bet, pd, null]);
      }
      return { ran:true, crux:sawCrux };
    };
    const breaksIn = d => [...(d.log||[]), ...(d.kept||[])]
      .filter(l=>/finally goes/.test(l.text||"")).length;

    /* ---- A BENCH ON THE UNIT ITSELF ----
       The first draft of this bench fought real bouts back to back with the week never turned, and
       it got 3 bouts before every man was dead — while an earlier scratch probe got 25 out of the
       same setup only because it never checked `g.status` and was fighting a corpse. Neither is a
       measurement of the wear rate. `wearKit` IS the unit: it is what a bout calls, it holds the
       WEAR_RATE draw, the named-piece halving, the perks and the break branch. Drive it directly
       and the rate, the five words and the break are all exact, and real play is what section 3 is
       for — proving the unit is actually reached. */
    const bench = (tag, opts) => {
      const o = opts || {};
      const d = A.newGameState("Bn", "clean", "STEEL-"+tag, null);
      d.gold = 300000;
      const [wid] = dearest("weapon");
      const g = A.activeG(d)[0];
      if(!g) return { tag, why:"a fresh house has no men" };
      A.buyGearItem(d, wid);
      A.equipOne(d, g.id, "weapon", wid);
      const drops = [], seen = new Set();
      let hits = 0, broke = 0, carried = g.kit.weapon;
      for(let i=0; i<(o.tries||60); i++){
        if(!wears(A.GEAR[g.kit && g.kit.weapon])){
          /* it went. put another on him and keep going, so one bench covers several lifetimes */
          if(!A.buyGearItem(d, wid)) break;
          A.equipOne(d, g.id, "weapon", wid);
          carried = g.kit.weapon;
        }
        const was = wOf(g,"weapon");
        A.wearKit(d, g, !!o.hard);
        hits++;
        if(g.kit.weapon !== carried || !wears(A.GEAR[g.kit.weapon])){ carried = g.kit.weapon; continue; }
        const now = wOf(g,"weapon");
        if(now < was) drops.push(+(was-now).toFixed(2));
        seen.add(A.wearWord(now));
      }
      return { tag, hits, drops, broke:breaksIn(d), words:[...seen],
        totalWear: drops.reduce((s,v)=>s+v,0) };
    };

    /* ---- A PLAYED HOUSE, for the words a player actually sees ---- */
    const played = (tag, weeks, arm) => {
      const d = A.newGameState("Pl", "clean", "STEEL-P-"+tag, null);
      if(arm){ d.gold = 400000; for(let L=0;L<arm;L++) A.buildUp(d, "armamentarium"); }
      d.gold = 5000;                       /* every arm handed the same, so the room is the only difference */
      const bands = Object.fromEntries(BANDS.map(b=>[b,0]));
      let n = 0, bouts = 0, cruxes = 0;
      const careers = {};
      for(let w=0; w<weeks; w++){
        if(d.over) break;
        d.gold = Math.max(d.gold, 5000);
        while(A.activeG(d).filter(g=>!g.injury).length < 4 && !A.rosterFull(d)){
          const m = (d.market||[]).slice().sort((a,b)=>a.price-b.price)[0];
          if(!m || !A.buyFromBlock(d, m.id, null)) break;
        }
        for(const g of A.activeG(d)) for(const s of SLOTS){
          if(wears(A.GEAR[g.kit && g.kit[s]])) continue;
          const c = cheapFor(d, s);
          if(c && A.buyGearItem(d, c[0])) A.equipOne(d, g.id, s, c[0]);
        }
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, (g.fatigue||0) > 55 ? "rest" : "palus");
        const fit = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 60).sort((x,z)=>av(z)-av(x));
        if(fit.length){
          const r = takeBout(d, fit[0]);
          if(r.ran){ bouts++; if(r.crux) cruxes++; careers[fit[0].id] = (careers[fit[0].id]||0)+1; }
        }
        if(d.pendingEvent) d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; }
        for(const g of A.activeG(d)) for(const s of SLOTS){
          if(!wears(A.GEAR[g.kit && g.kit[s]])) continue;
          bands[A.wearWord(wOf(g,s))]++; n++;
        }
      }
      const shelf = Object.values(d.gearCond||{}).flat();
      const cs = Object.values(careers);
      return { tag, week:d.week, end:d.over?d.over.kind:"alive", bouts, cruxes, n, bands,
        broke:breaksIn(d), arm: A.bLevel(d,"armamentarium"),
        keen: n ? +(bands.keen/n*100).toFixed(1) : null,
        lowBands: n ? +((bands.worn+bands.failing+bands["all but gone"])/n*100).toFixed(1) : null,
        shelfN: shelf.length, shelfLow: shelf.length ? Math.min(...shelf) : null,
        careerMed: q(cs,0.5), careerMax: cs.length ? Math.max(...cs) : 0, men:cs.length };
    };

    /* ================= 1. THE RATE, off the man ================= */
    const B = bench("rate", { tries:90 });
    if(B.why) bad.push(B.why);
    lines.push(`the bench: \`wearKit\` driven ${B.hits} times on one bought weapon, replaced each time it went`);
    lines.push(`what one bout takes off a weapon: ${B.drops.slice(0,18).join(", ")}`
      + (B.drops.length>18?` … (${B.drops.length} measured)`:""));
    {
      const lo = A.WEAR_RATE.weapon[0], hi = A.WEAR_RATE.weapon[1];
      const out5 = B.drops.filter(v=>v < lo - 0.01 || v > hi*1.5 + 0.01);
      if(!B.drops.length)
        bad.push(`${B.hits} calls took nothing off a bought weapon — `
          + `either the rope is not reaching the sand or \`wearKit\` is not being called`);
      else if(out5.length > B.drops.length*0.1)
        bad.push(`${out5.length} of ${B.drops.length} calls moved a weapon by something outside `
          + `WEAR_RATE.weapon [${lo},${hi}] and its 1.5x hard multiplier: ${out5.slice(0,6).join(", ")}`);
      lines.push(`WEAR_RATE.weapon is [${lo},${hi}] a bout, 1.5x sine missione · `
        + `measured median ${q(B.drops,0.5)}, total ${Math.round(B.totalWear)} over ${B.drops.length} calls`);
    }

    /* ================= 2. IT BREAKS, AND SAYS ALL FIVE WORDS ================= */
    {
      if(B.broke === 0)
        bad.push(`no bought weapon broke in ${B.hits} calls on the bench — the lesson says steel `
          + `"eventually breaks in the middle of one", and a weapon carried through 25 bouts did`);
      for(const w of BANDS) if(!B.words.includes(w))
        bad.push(`"${w}" was never read off a weapon walking from 100 to nothing across `
          + `${B.hits} calls — the words seen were ${B.words.join(", ")}`);
      lines.push(`pieces that broke on the bench: ${B.broke} (the game's own line, not my detector, `
        + `which undercounts by 60% because a break re-arms from the rack with the same gear id)`);
      lines.push(`words read off the man: ${B.words.join(" / ")}`);
    }

    /* ================= 3. AND WHAT A PLAYED HOUSE SEES ================= */
    const P0 = played("bare", 60, 0);
    lines.push(`a played house, no armoury: to w${P0.week} (${P0.end}) · ${P0.bouts} bouts `
      + `(${P0.bouts?Math.round(P0.cruxes/P0.bouts*100):0}% at the balance) · ${P0.broke} pieces broke`);
    lines.push(`   ${Object.entries(P0.bands).filter(([,v])=>v).map(([b,v])=>`${b} ${(v/P0.n*100).toFixed(1)}%`).join(" · ")}`
      + `  (over 6 houses and 130 weeks: keen 83.3%, worn or worse 4.3%)`);
    {
      if(P0.n < 200) bad.push(`only ${P0.n} man-slot-weeks of bought steel in a played house — `
        + `the arm is not arming its men, so nothing below reads on anything`);
      else if(P0.lowBands === 0)
        bad.push(`not one of ${P0.n} man-slot-weeks in a played house read below "serviceable" — `
          + `4.3% of them did over 6 houses and 130 weeks`);
      if(P0.keen != null && P0.keen > 99)
        bad.push(`${P0.keen}% of a played house's steel read "keen" — measured at 83.3% with no `
          + `armoury, so this reads as wear having stopped reaching the man`);
    }

    /* ---- THE SHELF AGAINST THE MAN, which is #114 in one line ---- */
    {
      const manLow = P0.lowBands > 0;
      lines.push(`the shelf in the same house: ${P0.shelfN} numbers`
        + (P0.shelfN ? `, lowest ${Math.round(P0.shelfLow)}` : "")
        + ` — worn condition lives on the man in \`g.wear\`, not in \`gearCond\``);
      if(!manLow && P0.shelfN === 0)
        bad.push(`neither the man nor the shelf shows any wear at all, so this section is measuring nothing`);
    }

    /* ================= 4. THE CRUX MUST BE ANSWERED =================
       Not two arms and a ratio — the first version of this compared a silent arm against an
       answering one and the SILENT arm measured more wear, because answering resolves the bout and
       the men die, so the silent arm simply got more turns. The exact statement is per bout: a bout
       held at the balance has changed NOTHING yet, and the same bout answered changes the kit. */
    {
      const d = A.newGameState("Cx", "clean", "STEEL-CRUX", null);
      d.gold = 300000;
      const [wid] = dearest("weapon");
      let held = 0, mutatedWhileHeld = 0, mutatedAfter = 0, tried = 0;
      for(let w=0; w<40 && held < 6; w++){
        if(d.over) break;
        d.gold = Math.max(d.gold, 5000);
        while(A.activeG(d).filter(g=>!g.injury).length < 3 && !A.rosterFull(d)){
          const m = (d.market||[]).slice().sort((a,b)=>a.price-b.price)[0];
          if(!m || !A.buyFromBlock(d, m.id, null)) break;
        }
        for(const g of A.activeG(d)){
          if(wears(A.GEAR[g.kit && g.kit.weapon])) continue;
          if(A.buyGearItem(d, wid)) A.equipOne(d, g.id, "weapon", wid);
        }
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, (g.fatigue||0) > 55 ? "rest" : "palus");
        const fit = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 60
          && wears(A.GEAR[g.kit && g.kit.weapon])).sort((x,z)=>av(z)-av(x));
        if(fit.length){
          const g = fit[0], was = wOf(g,"weapon");
          if(!d.pitCard || d.pitCard.week !== d.week) A.makePitCard(d);
          const men = A.pitMen(d) || [];
          const o = A.makePitOffer(d, g, "standard", men.length ? men[0].id : null);
          if(o){
            tried++;
            let r = fin(A.doFight, [d, g.id, o, "measured", null, null, null, "none"]);
            if(r && r.crux){
              held++;
              if(wOf(g,"weapon") !== was) mutatedWhileHeld++;
              let guard = 0;
              while(r && r.crux && guard++ < 5){
                const pd = r.pending; pd.beats = r.beats;
                r = fin(A.doFight, [d, pd.gid, pd.offer, pd.tactic, pd.bet, pd, null]);
              }
              if(g.status === "active" && wOf(g,"weapon") !== was) mutatedAfter++;
            }
          }
        }
        if(d.pendingEvent) d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; }
      }
      lines.push(`the crux trap: of ${tried} bouts, ${held} were held at the balance · `
        + `kit moved while held ${mutatedWhileHeld} of ${held} · kit moved once answered `
        + `${mutatedAfter} of ${held}`);
      if(held === 0)
        bad.push(`no bout of ${tried} reached the balance, so the crux trap cannot be measured — `
          + `the crux rate is 53% at surrender and 68% sine missione and this arm found none`);
      else {
        if(mutatedWhileHeld > 0)
          bad.push(`${mutatedWhileHeld} of ${held} bouts held at the balance had already worn the `
            + `man's kit — \`doFight\` is supposed to return at \`res.unfinished\` before \`wearKit\` `
            + `and mutate nothing, and every silent probe in this suite is built on that`);
        if(mutatedAfter === 0)
          bad.push(`not one of ${held} bouts wore the man's kit once the crux was answered — `
            + `answering is what makes the bout happen, and if it no longer does then the wear, the `
            + `purse and the fatigue of most bouts in the game have gone missing`);
      }
    }

    /* ================= 5. THE PIECE OUTLIVES ITS OWNER ================= */
    {
      lines.push(`careers in that house: ${P0.men} men fought, median ${P0.careerMed} bouts, most `
        + `${P0.careerMax} — against the ~25 a weapon needs to break (over 8 houses: median 3, p90 8, `
        + `2 of 241 men ever reached 25, and 207 of 263 left the yard dead)`);
      if(P0.careerMed != null && P0.careerMed >= 20)
        bad.push(`the median man fought ${P0.careerMed} bouts, which is inside the 25 a weapon needs `
          + `— measured at 3, and if careers have grown that far then wear has become a different `
          + `system and the figures in this check's head are stale`);
    }

    /* ================= 6. THE ROOM DOES WHAT IT SAYS ================= */
    {
      const P2 = played("armed", 60, 2);
      lines.push(`the same house with the armoury at level ${P2.arm} (+${(P2.arm*2.2).toFixed(1)} a week `
        + `against 3-6 a bout): ${P2.bouts} bouts · ${P2.broke} broke · keen ${P2.keen}% · `
        + `worn or worse ${P2.lowBands}%   (per ~1,050 bouts: 28 breaks at L0, 2 at L1, 0 at L2 and L4)`);
      if(P2.arm !== 2)
        bad.push(`the armoury arm asked for level 2 and built ${P2.arm} — \`buildUp\` needs the coin `
          + `in hand, and a probe that floors its purse inside the week loop silently gets level 1`);
      else if(P2.n > 200 && P0.n > 200 && P2.lowBands > P0.lowBands)
        bad.push(`the house WITH the armoury spent more of its time below "serviceable" `
          + `(${P2.lowBands}%) than the one without (${P0.lowBands}%) — \`repairWeek\` adds `
          + `level*2.2 a week and is supposed to be the thing that holds steel up`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
