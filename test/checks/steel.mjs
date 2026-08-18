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

   FOUR INSTRUMENT FAULTS OF MINE ARE PINNED HERE, because each one changed a headline number and
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

     3. THE BREAK COUNTER. My own detector — a slot that was under 30 and is now a different piece
        — undercounted by 60% (11 against 28) because a break re-arms the man from the rack with
        ANOTHER COPY OF THE SAME GEAR ID, so the slot looks untouched. The game's own chronicle
        line is the only honest counter, and it is what this check reads.

     4. THE ROOM HAS TO BE PAID FOR. The arms comparing armamentarium levels ran `buildUp` on a
        fresh house's purse, so only level 1 was ever affordable and the L2 and L4 arms were the L1
        arm under another name — three runs printing the same 1,036 bouts is what gave it away.
        Section 6 asserts the level it actually built.

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
    /* the wear table and the mend pair, read off the game — every figure in this check that used to be
       a literal about them now comes from here. See the note in section 5. */
    const WR = A.WEAR_RATE || { weapon:[4,7] };
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

    /* ---- #136: THE ARMOURY COMPARISON WAS ONE HOUSE AGAINST ONE HOUSE ----
       Section 6 compared a single armed house's `lowBands` against a single plain one with a strict
       inequality, and it flipped (9.4% against 5.1%) on a build whose only change was one extra key
       in `EVENTS` with its `make` neutered to `return null` — a reshuffle of `pickEvent`, not a fault.
       One house per arm is the smallest sample there is. `pooled` runs several per arm and sums the
       BANDS before taking the share, so the statistic rests on man-slot-weeks rather than on two
       trajectories, and the arms stay matched because each pair shares its index. */
    const pooled = (tag, weeks, arm, k) => {
      const bands = Object.fromEntries(BANDS.map(b=>[b,0]));
      let n = 0, bouts = 0, broke = 0, armLvl = null, houses = 0;
      for(let i = 0; i < k; i++){
        const r = played(`${tag}-${i}`, weeks, arm);
        for(const b of BANDS) bands[b] += r.bands[b] || 0;
        n += r.n; bouts += r.bouts; broke += r.broke; houses++;
        if(armLvl === null || r.arm < armLvl) armLvl = r.arm;   /* the WORST level any arm reached */
      }
      return { bands, n, bouts, broke, houses, arm: armLvl,
        keen: n ? +(bands.keen/n*100).toFixed(1) : null,
        lowBands: n ? +((bands.worn+bands.failing+bands["all but gone"])/n*100).toFixed(1) : null };
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
      /* ---- AND THE "25 BOUTS" WAS A LITERAL IN THIS SENTENCE ----
         It was 100 divided by the mean of the old WEAR_RATE.weapon, written out as a number, and v3.13.0
         moved that rate — so the line would have gone on quoting 25 while the real figure was 18. It is
         derived from the game's own table now, which is the #125 lesson applied to this check. */
      const perBout = (WR.weapon[0] + WR.weapon[1]) / 2;
      const needs = Math.round(100 / perBout);
      lines.push(`careers in that house: ${P0.men} men fought, median ${P0.careerMed} bouts, most `
        + `${P0.careerMax} — against the ~${needs} an unmended weapon needs to break at `
        + `WEAR_RATE.weapon ${WR.weapon[0]}-${WR.weapon[1]} (over 8 houses at the old 3-6: median 3, `
        + `p90 8, 2 of 241 men ever reached 25, and 207 of 263 left the yard dead)`);
      if(P0.careerMed != null && P0.careerMed >= needs * 0.8)
        bad.push(`the median man fought ${P0.careerMed} bouts, which is inside the ${needs} an unmended `
          + `weapon needs — measured at 3, and if careers have grown that far then wear has become a `
          + `different system and the figures in this check's head are stale`);
    }

    /* ================= 6. THE ROOM DOES WHAT IT SAYS ================= */
    {
      const ARMS = 5;
      const P2 = pooled("armed", 60, 2, ARMS);
      const P0p = pooled("plain", 60, 0, ARMS);
      /* both halves of this were literals too — the mend rate and the wear it was set against — and
         both are read off the game now. The parenthesised history is labelled as the OLD pair, because
         it was measured under it and is not a claim about the current one. */
      const mendWk = P2.arm * (A.MEND_RATE != null ? A.MEND_RATE : 0.18);
      lines.push(`${P2.houses} houses with the armoury at level ${P2.arm} (+${mendWk.toFixed(2)} a week per `
        + `slot against ${WR.weapon[0]}-${WR.weapon[1]} a bout, ceiling ${A.MEND_CEIL}): ${P2.bouts} bouts · `
        + `${P2.broke} broke · keen ${P2.keen}% · worn or worse ${P2.lowBands}% over ${P2.n} man-slot-weeks`);
      lines.push(`   against ${P0p.houses} pooled houses with NO armoury: keen ${P0p.keen}% · worn or worse `
        + `${P0p.lowBands}% over ${P0p.n} — pooled because one house against one house flipped on a `
        + `reshuffle (#136)`);
      lines.push(`   under the OLD pair (wear 3-6, mend 2.2 a level, no ceiling) this read 28 breaks at `
        + `L0, 2 at L1 and NONE at L2 or L4 per ~1,050 bouts — the armoury switched wear off entirely, `
        + `which is what v3.13.0 changed`);
      if(P2.arm !== 2)
        bad.push(`the armoury arm asked for level 2 and built ${P2.arm} — \`buildUp\` needs the coin `
          + `in hand, and a probe that floors its purse inside the week loop silently gets level 1`);
      /* the slack was 1.5 until v3.30.0 and false-failed on a pure reshuffle: across seven dead-key
         trajectories the with-minus-without difference read -2.3, -2.4, +2.6, +0.6, -2.4, +0.7 and
         +1.8 — the SIGN itself flips run to run at five houses an arm, because the houses' whole
         trajectories dominate the slot-week count. 3.5 sits above the widest measured swing; the
         v3.13.0 regression this guards (the armoury switching wear off entirely) reads as tens of
         points and the keen bar above catches it first either way. */
      else if(P2.n > 1000 && P0p.n > 1000 && P2.lowBands > P0p.lowBands + 3.5)
        bad.push(`the ${P2.houses} houses WITH the armoury spent more of their time below "serviceable" `
          + `(${P2.lowBands}%) than the ${P0p.houses} without (${P0p.lowBands}%), by more than the 3.5 `
          + `points of slack this bar allows [the difference swings -2.4 to +2.6 across seven dead-key `
          + `trajectories with no game change] — \`repairWeek\` adds level*${A.MEND_RATE != null ? A.MEND_RATE : 0.18} `
          + `a week per level and is supposed to be the thing that holds steel up. Pooled over `
          + `${P2.n} and ${P0p.n} man-slot-weeks, so this is not one unlucky house`);
    }

    /* ================= 7. THE LEDGER: A PIECE IS ON A MAN OR ON THE RACK =================
       #149. `dark` found four actions whose gate never opens on a rope-played house, and three of
       them are the gear book: the reference player buys by price and equips through `equipOne`, so
       `saveKit`, `applyKit` and the two "arm him off the rack" buttons were driven by nothing.
       Driving them found the steel economy's other half unguarded, exactly where #152 said it was.

       The law the game states about itself, for anything that WEARS:

           d.gear[id]  ===  gearUsed(d, id)  +  (d.gearCond[id] || []).length

       `equipOne` kept both halves — the outgoing piece's wear goes into the pool, the incoming
       piece's condition comes out. `applyKit` and `armFromRack` assigned `g.kit` wholesale and
       touched the pool not at all. Measured over 120 applications (`test/probes/kit.mjs`, with
       `equipOne` as the control so a failing LAW could not read as failing code): three of a piece
       owned, all three worn by men, and two still listed on the rack. The condition went nowhere
       either — the rack held one Noric Gladius at 31, a man applied the saved kit, and he read 100
       while the 31 stayed on the shelf.

       Two more came out of the same drive and are held here too:
       · a FORGED piece is named and its own chronicle line says "It is his, and it is not going back
         on the rack". `equipOne` refuses to move it. `applyKit` took it (gladius_f became sica_f) and
         `armFromRack` took it (gladius_f became fuscina_f).
       · `condOf` read `g.wear[it.slot]` and ignored the piece, so every candidate for a slot was
         scored at whatever the man was already carrying there. Forty passes of the "arm him" button
         over a rack of fourteen bought kinds ended with NONE of them worn by anybody — the button
         handed out house issue precisely when a man's own steel was finished. It is 93 calls and
         140 slots changed after, on the same fixture.

       This section is a BENCH, not a campaign: it drives the three paths on a stocked house and reads
       the game's own ownership arithmetic back. No trajectory, nothing to reshuffle. */
    {
      const stocked = tag => {
        const d = A.newGameState("St", "clean", `STEEL-LEDGER-${tag}`, null);
        d.gold = 60000;
        const ids = Object.keys(A.GEAR).filter(id=>A.wears(A.GEAR[id])).slice(0, 10);
        for(const id of ids) for(let i=0;i<3;i++) A.buyGearItem(d, id);
        return { d, ids };
      };
      const offBy = d => {
        const out = [];
        for(const id of Object.keys(d.gear||{})){
          if(!A.wears(A.GEAR[id])) continue;                 /* stock steel never draws the pool */
          const owned = d.gear[id]||0; if(!owned) continue;
          const worn = A.gearUsed(d, id), racked = ((d.gearCond||{})[id]||[]).length;
          if(worn + racked !== owned) out.push(`${id} owned ${owned} worn ${worn} racked ${racked}`);
        }
        return out;
      };

      /* the control first: if this fails, the law is wrong and not the code */
      { const { d, ids } = stocked("equip");
        const men = A.activeG(d);
        for(let r=0;r<12;r++) for(const g of men){
          const id = ids[(r + g.id) % ids.length];
          A.equipOne(d, g.id, A.GEAR[id].slot, id);
        }
        const off = offBy(d);
        lines.push(`the ledger after ${12*men.length} equipOne calls (the control): ${off.length ? off.join(" · ") : "owned = worn + racked, every kind"}`);
        if(off.length)
          bad.push(`\`equipOne\` — the path the game is built around — left the steel ledger out of `
            + `balance (${off.join("; ")}). That is the CONTROL for this section, so read it as the law `
            + `being wrong before reading the arms under it as faults`);
      }

      /* and the two that were dark */
      for(const [what, drive] of [
        ["applyKit", (d, ids, men)=>{
          for(const id of ids.slice(0,4)) A.equipOne(d, men[0].id, A.GEAR[id].slot, id);
          A.saveKit(d, men[0].id);
          const k = (d.kits||[])[0];
          for(let r=0;r<12;r++) for(const g of men) if(k) A.applyKit(d, g.id, k.id);
        }],
        ["armFromRack", (d, ids, men)=>{
          for(let r=0;r<12;r++) for(const g of men){
            A.buyGearItem(d, ids[r % ids.length]);
            A.armFromRack(d, g.id);
            g.wear = g.wear || {};
            for(const s of A.SLOTS) if(g.wear[s] != null) g.wear[s] = Math.max(0, g.wear[s] - 9);
          }
        }],
      ]){
        const { d, ids } = stocked(what);
        drive(d, ids, A.activeG(d));
        const off = offBy(d);
        lines.push(`the ledger after ${what}: ${off.length ? off.join(" · ") : "owned = worn + racked, every kind"}`);
        if(off.length)
          bad.push(`\`${what}\` left the steel ledger out of balance (${off.join("; ")}) — a piece is on `
            + `a man or on the rack, and every path that moves one has to move its condition with it. `
            + `This is what v3.40.0 fixed by routing both through \`swapSlot\`, and \`equipOne\` above `
            + `passes, so the law is not the problem`);
      }

      /* the condition travels with the piece, told as one exchange */
      { const { d, ids } = stocked("cond");
        const men = A.activeG(d);
        const id = ids.find(x=>A.GEAR[x].slot === "weapon") || ids[0];
        const slot = A.GEAR[id].slot;
        d.gearCond[id] = [31, 100];
        A.equipOne(d, men[0].id, slot, id);
        men[0].wear[slot] = 12;
        A.saveKit(d, men[0].id);
        A.applyKit(d, men[1].id, (d.kits||[])[0].id);
        const got = A.wearOf(men[1], slot), pool = (d.gearCond[id]||[]);
        lines.push(`condition travels: the rack held 31, a saved kit was applied, the man reads ${got} `
          + `and the rack now holds ${pool.join(",")||"nothing"} (before v3.40.0 he read 100 and the 31 stayed)`);
        if(got === 100 && !pool.includes(31))
          bad.push(`a man who took the armoury's only battered piece reads 100 — \`applyKit\` is handing `
            + `out condition it did not draw from \`d.gearCond\`, which is free repair and the fault #149 found`);
      }

      /* and the piece that is not going back on the rack */
      { const { d, ids } = stocked("named");
        const men = A.activeG(d);
        const id = ids.find(x=>A.GEAR[x].slot === "weapon") || ids[0];
        const slot = A.GEAR[id].slot;
        const other = ids.find(x=>A.GEAR[x].slot === slot && x !== id);
        A.equipOne(d, men[0].id, slot, id);
        men[0].named = { slot, title:"The Check's Own", made:1 };
        if(other){ A.equipOne(d, men[1].id, slot, other); A.saveKit(d, men[1].id); }
        const keptK = (()=>{ const k=(d.kits||[])[0]; if(!k) return true;
          A.applyKit(d, men[0].id, k.id); return men[0].kit[slot] === id; })();
        A.armFromRack(d, men[0].id);
        const keptR = men[0].kit[slot] === id;
        lines.push(`the forged piece: applyKit ${keptK?"leaves it":"TAKES IT"} · armFromRack ${keptR?"leaves it":"TAKES IT"} `
          + `(equipOne has always refused; the forging's own line is "it is not going back on the rack")`);
        if(!keptK) bad.push(`\`applyKit\` took a man's FORGED, named piece — the forge says "It is his, and `
          + `it is not going back on the rack", \`equipOne\` refuses and \`stripAll\` skips the slot`);
        if(!keptR) bad.push(`\`armFromRack\` took a man's FORGED, named piece — \`bestKitFor\` must hold a `
          + `named slot where it is, which is what the "arm him off the rack" button does to it`);
      }

      /* the scorer values the CANDIDATE, not the slot */
      { const { d, ids } = stocked("score");
        const g = A.activeG(d)[0];
        const id = ids.find(x=>A.GEAR[x].slot === "weapon") || ids[0];
        const slot = A.GEAR[id].slot;
        A.equipOne(d, g.id, slot, id);
        g.wear[slot] = 3;                     /* his own is finished; the rack's are not */
        const res = A.armFromRack(d, g.id);
        const now = A.GEAR[g.kit[slot]];
        lines.push(`a man whose weapon is at 3, re-armed off a full rack: he is handed `
          + `${now ? now.name : "nothing"}${now && A.wears(now) ? "" : " (HOUSE ISSUE)"} `
          + `— before v3.40.0 \`condOf\` scored every candidate at HIS wear, so the answer was the wooden one`);
        if(now && !A.wears(now))
          bad.push(`a man whose own weapon is at condition 3 was re-armed into house issue off a rack `
            + `holding ${ids.length} bought kinds — \`condOf\` is scoring candidates by the wear of the `
            + `piece already in the slot instead of by what the armoury records for each of them`);
      }
    }

    /* ================= 8. THE COST OF KEEPING IT — #152 =================
       `coverage` groups the 144 functions no check reaches, and its largest cluster is this one:
       rackCap, rackUsed, rackOver, rackStrain, rackRent, gearUpkeep, kitKeepOf, repairWeek,
       perkWear, armourerWear, armourerMend and armourerCut. Twelve functions, all of them wired to
       something real — the rent comes out of the box in `rackWeek`, the strain multiplies wear in
       `wearKit`, the upkeep is a term in `weeklyBill`, the armourer's three numbers scale price,
       wear and mending — and not one driven by anything. That is the asymmetry v3.13.0 was written
       to fix, still half in place: the half that TAKES condition away is guarded above, and the half
       that PAYS TO KEEP IT was not.

       Driving it found a real fault, and it is in the same place all of them read from. `wearKit`'s
       break path reassigned `g.kit[s]` and said nothing else, so a piece that snapped at the tang
       stayed in `d.gear` for ever: measured (`test/probes/kit.mjs`), a house owning three of a kind
       still owned three after one broke, the armoury still counted it against `rackCap`, `gearUpkeep`
       still billed for it every week — and when every copy had broken, a man could still be armed
       with one, at condition 100, out of a rack that held none. It goes through `swapSlot` with the
       `scrap` flag now, so the wreck leaves the ledger.

       Held here as a bench, because every one of these is a pure function of the save. */
    {
      const stock = tag => { const d = A.newGameState("Kp", "clean", `STEEL-KEEP-${tag}`, null);
        d.gold = 90000; return d; };
      const wearing = Object.keys(A.GEAR).filter(id=>A.wears(A.GEAR[id]));

      /* ---- the room: what it holds, what it does not, and what it charges ---- */
      { const d = stock("rack");
        const capAt = L => { d.buildings = { armamentarium:L }; return A.rackCap(d); };
        const caps = [0,1,2,3].map(capAt);
        lines.push(`the room holds ${caps.join(" / ")} at armamentarium 0-3`);
        for(let L=0; L<caps.length; L++) if(caps[L] !== 8 + L*7)
          bad.push(`\`rackCap\` reads ${caps[L]} at level ${L}, against the 8 + level*7 its own comment quotes`);

        d.buildings = {};
        const before = A.rackUsed(d);
        /* house issue is not stock in the room — only steel that WEARS is */
        const basic = Object.keys(A.GEAR).find(id=>A.isBasic(id));
        if(basic) for(let i=0;i<5;i++) A.buyGearItem(d, basic);
        if(A.rackUsed(d) !== before)
          bad.push(`five pieces of house issue changed \`rackUsed\` from ${before} to ${A.rackUsed(d)} — `
            + `the room counts steel that wears, and stock is what the room is FOR`);
        for(let i=0;i<12;i++) A.buyGearItem(d, wearing[i % wearing.length]);
        const used = A.rackUsed(d), cap = A.rackCap(d), over = A.rackOver(d);
        lines.push(`${used} wearing pieces in a room built for ${cap}: over by ${over} · `
          + `strain x${A.rackStrain(d).toFixed(2)} · rent ${A.rackRent(d)}d a week`);
        if(over !== Math.max(0, used - cap)) bad.push(`\`rackOver\` is not used minus cap`);
        if(A.rackRent(d) !== over*4) bad.push(`\`rackRent\` reads ${A.rackRent(d)} against ${over}x4`);
        const wantStrain = over ? 1 + Math.min(0.75, over*0.07) : 1;
        if(Math.abs(A.rackStrain(d) - wantStrain) > 1e-9)
          bad.push(`\`rackStrain\` reads ${A.rackStrain(d)} against the 1 + min(0.75, over*0.07) it is documented as`);
        /* and the rent is only a number until something takes it */
        const box = d.gold; A.rackWeek(d);
        if(Math.round(box - d.gold) !== A.rackRent(d))
          bad.push(`\`rackWeek\` took ${Math.round(box - d.gold)}d out of the box against a rent of `
            + `${A.rackRent(d)}d — the overcrowding charge is the only thing that makes the cap bite`);
        else lines.push(`   and \`rackWeek\` takes exactly that out of the box`);
      }

      /* ---- the strain is a multiplier on WEAR, not a line of prose ---- */
      { const run = (over) => {
          const d = stock("strain-"+over);
          d.buildings = { armamentarium:0 };
          const id = wearing.find(x=>A.GEAR[x].slot === "weapon");
          const n = over ? 24 : 1;
          for(let i=0;i<n;i++) A.buyGearItem(d, id);
          const g = A.activeG(d)[0];
          A.equipOne(d, g.id, "weapon", id);
          let lost = 0;
          for(let i=0;i<60;i++){ g.wear.weapon = 100; A.wearKit(d, g, false); lost += 100 - g.wear.weapon; }
          return { strain:A.rackStrain(d), per:lost/60, over:A.rackOver(d) };
        };
        const tidy = run(false), packed = run(true);
        lines.push(`wear off a weapon over 60 bouts: ${tidy.per.toFixed(2)} a bout in a room within its cap, `
          + `${packed.per.toFixed(2)} at ${packed.over} over (strain x${packed.strain.toFixed(2)})`);
        if(packed.strain <= 1) bad.push(`the packed room reported no strain at all`);
        else if(!(packed.per > tidy.per))
          bad.push(`steel wore ${packed.per.toFixed(2)} a bout in a room ${packed.over} past its cap against `
            + `${tidy.per.toFixed(2)} in a tidy one — \`rackStrain\` is quoted at the player as "everything `
            + `wears ${Math.round((packed.strain-1)*100)}% faster" and must reach \`wearKit\` to mean it`);
      }

      /* ---- what a piece costs to keep, and that the weekly bill carries it ---- */
      { const d = stock("keep");
        const cheap = wearing.find(id=>A.GEAR[id].price > 0 && A.GEAR[id].price <= A.KEEP_FLOOR && !A.GEAR[id].keep);
        const dear  = wearing.find(id=>A.GEAR[id].price > A.KEEP_FLOOR && !A.GEAR[id].keep);
        const kc = cheap ? A.kitKeepOf(A.GEAR[cheap]) : null, kd = dear ? A.kitKeepOf(A.GEAR[dear]) : null;
        lines.push(`the smith's fee: ${cheap?`${A.GEAR[cheap].name} at ${A.GEAR[cheap].price}d costs ${kc}d a week`:"(no cheap piece to test)"}`
          + ` · ${dear?`${A.GEAR[dear].name} at ${A.GEAR[dear].price}d costs ${kd}d`:"(no dear piece)"}`
          + ` (the floor is ${A.KEEP_FLOOR}d, the rate ${A.KEEP_RATE})`);
        if(cheap && kc !== 0)
          bad.push(`a ${A.GEAR[cheap].price}d piece costs ${kc}d a week to keep — under KEEP_FLOOR `
            + `(${A.KEEP_FLOOR}) it is ironmongery and free, which is what keeps \`survive\` clear of all this`);
        if(dear && kd !== Math.max(1, Math.round(A.GEAR[dear].price * A.KEEP_RATE)))
          bad.push(`\`kitKeepOf\` reads ${kd}d on a ${A.GEAR[dear].price}d piece against price x ${A.KEEP_RATE}`);
        if(dear){
          const billWas = A.weeklyBill(d), keepWas = A.gearUpkeep(d);
          for(let i=0;i<4;i++) A.buyGearItem(d, dear);
          const grew = A.gearUpkeep(d) - keepWas, billGrew = A.weeklyBill(d) - billWas;
          lines.push(`   four more of them: upkeep +${grew}d a week, and the weekly bill +${billGrew}d`);
          if(grew !== kd*4) bad.push(`\`gearUpkeep\` grew ${grew}d for four pieces at ${kd}d each`);
          if(billGrew < grew) bad.push(`the weekly bill grew ${billGrew}d where the steel alone added ${grew}d — `
            + `\`gearUpkeep\` is a term in \`weeklyBill\` and the player is quoted that bill`);
        }
      }

      /* ---- the armoury mends, and the armourer's three numbers are three real claims ---- */
      { const d = stock("mend");
        const id = wearing.find(x=>A.GEAR[x].slot === "weapon");
        A.buyGearItem(d, id);
        const g = A.activeG(d)[0];
        A.equipOne(d, g.id, "weapon", id);
        d.buildings = {};
        g.wear.weapon = 40; A.repairWeek(d);
        if(g.wear.weapon !== 40) bad.push(`\`repairWeek\` mended ${g.wear.weapon-40} with no armoury built at all`);
        d.buildings = { armamentarium:3 };
        g.wear.weapon = 40; A.repairWeek(d);
        const gained = g.wear.weapon - 40, want = 3*A.MEND_RATE*A.armourerMend(d);
        lines.push(`the armoury at 3 mends ${gained.toFixed(2)} a week per slot (3 x ${A.MEND_RATE} x armourer ${A.armourerMend(d).toFixed(2)})`);
        if(Math.abs(gained - want) > 1e-6)
          bad.push(`\`repairWeek\` added ${gained.toFixed(3)} against level x MEND_RATE x armourerMend = ${want.toFixed(3)}`);
        g.wear.weapon = A.MEND_CEIL + 5; A.repairWeek(d);
        if(g.wear.weapon !== A.MEND_CEIL + 5)
          bad.push(`a piece above MEND_CEIL (${A.MEND_CEIL}) was moved to ${g.wear.weapon} — free care never `
            + `works a piece DOWN, and its own comment says so`);
        g.wear.weapon = A.MEND_CEIL - 1; A.repairWeek(d);
        if(g.wear.weapon > A.MEND_CEIL)
          bad.push(`\`repairWeek\` carried a piece past MEND_CEIL to ${g.wear.weapon} — free care keeps steel `
            + `serviceable, it does not make it new`);
        lines.push(`the armourer with no armourer: cut ${A.armourerCut(d)} · wear ${A.armourerWear(d)} · mend ${A.armourerMend(d)}`);
        for(const [f,v] of [["armourerCut",A.armourerCut(d)],["armourerWear",A.armourerWear(d)],["armourerMend",A.armourerMend(d)]])
          if(v !== 1) bad.push(`\`${f}\` reads ${v} with nobody hired — the three of them are quoted at the `
            + `player as percentages OFF a baseline, so an unstaffed house has to read exactly 1`);
        /* the steel perk is the fourth multiplier on the same line of `wearKit` */
        lines.push(`the steel perk: wear x${A.perkWear(d)} without it`);
        if(A.perkWear(d) !== 1) bad.push(`\`perkWear\` reads ${A.perkWear(d)} on a house with no works standing`);
      }

      /* ---- and the wreck leaves the ledger ---- */
      { const d = stock("break");
        const id = wearing.find(x=>A.GEAR[x].slot === "weapon");
        A.buyGearItem(d, id);
        const g = A.activeG(d)[0];
        A.equipOne(d, g.id, "weapon", id);
        const ownedWas = d.gear[id], roomWas = A.rackUsed(d);
        g.wear.weapon = 1;
        for(let i=0;i<40 && g.kit.weapon===id;i++) A.wearKit(d, g, true);
        const gone = g.kit.weapon !== id;
        const again = A.equipOne(d, A.activeG(d)[1] ? A.activeG(d)[1].id : g.id, "weapon", id);
        lines.push(`a piece that broke: owned ${ownedWas} -> ${d.gear[id]||0} · the room ${roomWas} -> ${A.rackUsed(d)}`
          + ` · re-issuing it to somebody else ${again ? "SUCCEEDED" : "was refused"}`);
        if(!gone) bad.push(`a weapon driven to condition 0 forty times over never broke — this section's `
          + `whole point is what happens when it does`);
        else {
          if((d.gear[id]||0) !== ownedWas - 1)
            bad.push(`the house owned ${ownedWas} and owns ${d.gear[id]||0} after one of them snapped at the `
              + `tang — a wreck is not stock, and while it sits in \`d.gear\` it fills \`rackCap\`, draws `
              + `\`rackRent\` and is billed by \`gearUpkeep\` for ever`);
          if(again)
            bad.push(`the house owns none of a piece and armed a man with one anyway — before v3.43.0 the `
              + `broken one came back at condition 100 in the same week the chronicle said it had been `
              + `beaten out of any use`);
        }
      }
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
