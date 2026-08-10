/* WHAT A TOWN DOWN THE BAY THINKS OF YOU — TWO SCALES THAT NOTHING HAD EVER TOURED.

   #115: `cityFavWord` took ZERO samples in the whole scales sweep. `coast` drives a town's card and
   asks whether its favour MOVED after one constructed bout, but it never tours, so the RANGE of
   either scale was unmeasured and their bands rested on nothing.

   THE TWO SCALES, and they behave completely differently.

   `cityFavWord(v)` reads `d.bayPol[key].favor` — >=78 "the town is yours", >=58 "well thought of
   here", >=38 "tolerated", >=18 "an outsider", else "not wanted here". It starts at `20 + ri(0,15)`,
   so every town opens on "an outsider", and it moves ONLY in `cityAfter`, by `4 + served*5` per bout
   fought in that town: +9 for the afternoon they came for, +4 for one they did not mind, **-1** for
   one they did not want. There is no decay. Toured properly it runs 10 to 100 over 24 town-houses at
   a median peak of 93, and **all five words are said**.

   THE BOTTOM WORD IS REACHED BY LOSING, and reading nearly cost me that. Favour opens above 18 and
   mostly climbs, so "not wanted here" looks unreachable — but Neapolis wants craft, `cityServed`
   returns -1 for a defeat, and a house beaten repeatedly on Greek sand fell to 10. Section 2 holds
   that branch, because it is the only thing keeping the bottom of the scale alive.

   `knownIn` is the opposite: it is fed by every bout down there and bleeds `BAY_DECAY` 0.55 a week
   for every town you are not standing in. A five-week-a-town round robin pegs all three at 100 by
   about week 20 and never feels the decay at all. Neglect it and it works exactly as advertised — a
   house that tours once to 70-90 and then stays in Capua bleeds to nothing over about 130 weeks, and
   loses `knownIn >= 10 everywhere` around week 130.

   AND ONE BRANCH THAT NEITHER OF MY ARMS COULD REACH, which is why it is section 4. `bayWeek` gives
   a rival the bay on `!d.city && 30 idle weeks && R() < 0.028`. The touring arm reset that clock
   every few weeks and measured it **0 times in 8 houses**; the stay-home arm had it taken in **8 of
   10** (median week 55, median 28 weeks held) and, never travelling, never got it back — one spell
   per house, up to 167 weeks in somebody else's hands at -4 fame every eight. It is cleared ONLY by
   `if(d.city)`: turning up. Driven on purpose, that is **12 of 12**, two weeks after setting out, and
   it costs +10 to +12 grudge with the house you took it from. Two arms drove every part of the
   mechanic except the reward at the end of it, which is what happens when both arms are policies
   rather than one policy and one variable.

   THE THING THIS CHECK DELIBERATELY DOES NOT ASSERT, because it was my probe and not the game: the
   tour probe put 7 of 8 houses out by REBELLION between weeks 17 and 100, which read as a savage
   price on being away. Four arms of 10 houses over 200 weeks, one policy apart from the named
   variable:

     home, no levers        rebellion 7/10, median life  55w
     tour, no levers        rebellion 10/10, median life 68w
     home + unrest levers   rebellion 6/10, median life 117w
     tour + unrest levers   rebellion 6/10, median life 126w

   Pulling the feast and walking the cells roughly doubles the median life in BOTH, touring makes no
   difference to the rebellion at all, and a touring house lives LONGER than a homebound one in both
   pairs. The rebellion was a probe that never touched the cells. That table is in the roadmap and is
   not a bar anything is held to. */

import { hasHandle } from "../harness.mjs";

export const name = "bay";
export const describe = "a town's favour and its memory of you, over a tour that is actually driven";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const KEYS = A.CITY_KEYS;
    const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
    const fin = (fn,args) => { try { return fn(...args); } catch(e){ return { __err:e.message }; } };
    const q = (a,f)=>a.length ? a.slice().sort((x,y)=>x-y)[Math.max(0,Math.floor(a.length*f)-1)] : null;
    const WORDS = ["not wanted here","an outsider","tolerated","well thought of here","the town is yours"];

    /* THE CRUX AGAIN: every away engine returns before it credits the town if the box has not
       spoken, so a silent probe tours and the town never hears of it. See `steel` section 4. */
    const answer = (d, r) => { let g0 = 0;
      while(r && r.crux && g0++ < 5){
        const pd = r.pending; pd.beats = r.beats;
        r = pd.melee ? fin(A.doMelee, [d, pd.ids, pd.offer, pd, null])
          : pd.venatio ? fin(A.doVenatio, [d, pd.gid, pd.offer, pd.tactic, pd, null])
          : pd.pair ? fin(A.doPairFight, [d, pd.ids, pd.offer, pd.tactic, pd, null])
          : fin(A.doFight, [d, pd.gid, pd.offer, pd.tactic, pd.bet, pd, null]);
        if(r && r.__err) break;
      }
      return r; };

    const fightAway = (d) => {
      if(!d.city) return false;
      if(!d.games || !d.games.offers || !d.games.offers.length) A.makeCityGames(d);
      const offers = (d.games && d.games.offers) || [];
      const men = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 62).sort((x,z)=>av(z)-av(x));
      if(!men.length || !offers.length) return false;
      const o = offers.find(x=>!x.pair && !x.melee && !x.venatio) || offers[0];
      if((o.pair && men.length<2) || (o.melee && men.length<3)) return false;
      let r;
      if(o.pair) r = fin(A.doPairFight, [d,[men[0].id,men[1].id],o,"measured",null,null]);
      else if(o.melee) r = fin(A.doMelee, [d,men.slice(0,3).map(g=>g.id),o,null,null,"measured"]);
      else if(o.venatio) r = fin(A.doVenatio, [d,men[0].id,o,"measured",null,null]);
      else r = fin(A.doFight, [d,men[0].id,o,"measured",null,null,null,"none"]);
      if(r && r.__err) return false;
      answer(d, r);
      return true;
    };
    const keepHouse = (d) => {
      d.gold = Math.max(d.gold, 8000);
      while(A.activeG(d).filter(g=>!g.injury).length < 5 && !A.rosterFull(d)){
        const m = (d.market||[]).slice().sort((a,b)=>a.price-b.price)[0];
        if(!m || !A.buyFromBlock(d, m.id, null)) break;
      }
      for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, (g.fatigue||0) > 55 ? "rest" : "palus");
      /* THE LEVERS, ALWAYS. Without them every arm here dies of the cells around week 55 and
         measures the rebellion instead of the bay — see this check's head. */
      if(d.unrest >= 30) A.throwFeast(d);
      if(d.unrest >= 22) fin(A.walkTheCells, [d]);
    };
    const turn = (d) => {
      if(d.pendingEvent){ try { A.EVENTS[d.pendingEvent.id].run(d, d.pendingEvent, 0); } catch(e){} d.pendingEvent = null; }
      try { A.endWeek(d); return true; } catch(e){ return false; }
    };

    /* ================= 1. A TOUR RAISES BOTH SCALES ================= */
    {
      const d = A.newGameState("By", "clean", "BAY-TOUR", null);
      const open = {};
      for(const k of KEYS) open[k] = Math.round(A.bayPol(d, k).favor);
      let bouts = 0, target = 0, stayed = 0, weeks = 0;
      const words = new Set();
      for(let w=0; w<60; w++){
        if(d.over) break;
        keepHouse(d);
        if(d.travel){ /* the road takes weeks, and a probe that fights the week it leaves fights nothing */ }
        else if(d.city){ stayed++; if(fightAway(d)) bouts++;
          if(stayed >= 5){ stayed = 0; A.comeHome(d); } }
        else if(A.setOut(d, KEYS[target++ % KEYS.length])){ /* off */ }
        if(!turn(d)) break;
        weeks++;
        for(const k of KEYS){ const P = (d.bayPol||{})[k]; if(P) words.add(A.cityFavWord(P.favor)); }
      }
      const fav = KEYS.map(k=>Math.round(A.bayPol(d,k).favor));
      const kn  = KEYS.map(k=>Math.round(A.knownIn(d,k)));
      lines.push(`a tour of ${weeks} weeks, five weeks a town: ${bouts} bouts down the bay`);
      lines.push(`   favour ${KEYS.map((k,i)=>`${k.slice(0,3)} ${open[k]}→${fav[i]}`).join(" · ")}`
        + `   (over 8 toured houses: 10 to 100, median peak 93)`);
      lines.push(`   local standing ${KEYS.map((k,i)=>`${k.slice(0,3)} ${kn[i]}`).join(" · ")} of 100 · `
        + `the whole bay knows the name: ${A.bayWide(d)} (total ${Math.round(A.bayKnownTotal(d))} of 180)`);
      lines.push(`   words said on the way up: ${WORDS.filter(w=>words.has(w)).join(" / ")}`);

      if(!bouts) bad.push(`a ${weeks}-week tour fought nothing down the bay — a town's card is `
        + `\`makeCityGames\`, travel takes weeks, and every away engine returns before it credits `
        + `the town if the crux goes unanswered`);
      else {
        if(Math.max(...fav) < 58)
          bad.push(`no town got past favour ${Math.max(...fav)} over ${bouts} bouts down the bay — `
            + `"well thought of here" starts at 58 and a real tour reaches a median peak of 93`);
        if(Math.max(...kn) < 45)
          bad.push(`local standing peaked at ${Math.max(...kn)} over ${bouts} bouts — a five-week-a-`
            + `town round robin pegs all three towns at 100 by about week 20`);
        for(const w of ["an outsider","tolerated"]) if(!words.has(w))
          bad.push(`"${w}" was never said while a house climbed from an opening 20-35 to `
            + `${Math.max(...fav)} — the words seen were ${[...words].join(", ")}`);
      }
    }

    /* ================= 2. AND LOSING TAKES IT AWAY AGAIN =================
       the only route to the bottom word, and the one a reading of the source misses */
    {
      const served = A.cityServed({}, "neapolis", { stakes:"standard" },
        { won:false, theirDead:false, spared:false, vigour:90, crowd:60 });
      lines.push(`what a town gives you for an afternoon it did not want: served ${served} → `
        + `${4 + served*5} favour a bout (Neapolis wants craft, and a defeat is what it scores -1 for)`);
      if(served >= 0)
        bad.push(`a defeat on Neapolitan sand scores served ${served}, so a bout there can never cost `
          + `favour — and "not wanted here" below 18 becomes unreachable, because favour opens at `
          + `20 + ri(0,15) and nothing else lowers it`);

      /* drive it: outmatched men, beaten again and again in the same town */
      const d = A.newGameState("Bl", "clean", "BAY-LOSE", null);
      d.gold = 60000; d.city = "neapolis"; d.flags.cityArrived = 1;
      d.known = { neapolis: 20 };
      const P = A.bayPol(d, "neapolis");
      P.favor = 22;                     /* a cold opening inside the band the roll can produce */
      const opened = P.favor;
      let fought = 0, lost = 0, buried = 0;
      const words = new Set([A.cityFavWord(P.favor)]);
      for(let i=0; i<30; i++){
        /* THE FIRST DRAFT OF THIS ARM GOT THREE BOUTS. Men at 18 in every stat do not merely lose,
           they die, and the yard was empty by the fourth. Two fixes, both of them the game's own
           doors: the cloth ends a bout as a LOSS with the man walked off on his own feet, and the
           block refills the yard between afternoons. */
        while(A.activeG(d).filter(g=>!g.injury).length < 2 && !A.rosterFull(d)){
          const m = (d.market||[]).slice().sort((a,b)=>a.price-b.price)[0];
          if(!m || !A.buyFromBlock(d, m.id, null)) break;
        }
        const men = A.activeG(d).filter(g=>!g.injury);
        if(!men.length) break;
        for(const g of men){
          for(const k of A.STATS) g[k] = 26;      /* outmatched, so the town is not being entertained */
          g.fatigue = 0; if(g.injury) g.injury = null;
        }
        d.games = null;
        A.makeCityGames(d);
        const offers = (d.games && d.games.offers) || [];
        const o = offers.find(x=>!x.pair && !x.melee && !x.venatio && x.stakes !== "sine");
        if(!o) continue;
        const before = A.bayPol(d,"neapolis").favor;
        let r = fin(A.doFight, [d, men[0].id, o, "measured", null, null, null, "none"]);
        if(r && r.__err) break;
        /* throw the cloth at the first balance: a defeat, and he lives to lose the next one */
        let g0 = 0;
        while(r && r.crux && g0++ < 5){
          const pd = r.pending; pd.beats = r.beats;
          r = fin(A.doFight, [d, pd.gid, pd.offer, pd.tactic, pd.bet, pd, "cloth"]);
          if(r && r.__err) break;
        }
        fought++;
        if(men[0].status !== "active") buried++;
        if(A.bayPol(d,"neapolis").favor < before) lost++;
        words.add(A.cityFavWord(A.bayPol(d,"neapolis").favor));
      }
      const now = Math.round(A.bayPol(d,"neapolis").favor);
      lines.push(`beaten at Neapolis: ${fought} bouts (${buried} men buried), ${lost} of them cost favour · ${opened} → ${now} `
        + `("${A.cityFavWord(now)}")   (a toured house's worst town read 10)`);
      if(fought < 6)
        bad.push(`only ${fought} bouts were fought on Neapolitan sand, which is too few to move a `
          + `scale that changes by 1 a losing bout`);
      else if(!lost)
        bad.push(`${fought} defeats at Neapolis cost the house no favour at all — the -1 branch of `
          + `\`cityServed\` is the only thing that can reach "not wanted here"`);
    }

    /* ================= 3. THE MEMORY BLEEDS WHEN YOU STOP GOING ================= */
    {
      const d = A.newGameState("Bd", "clean", "BAY-DECAY", null);
      d.known = {}; for(const k of KEYS) d.known[k] = 70;
      const start = 70, span = 40;
      for(let w=0; w<span; w++){
        if(d.over) break;
        keepHouse(d);
        if(!turn(d)) break;
      }
      const now = KEYS.map(k=>A.knownIn(d,k));
      const fell = start - Math.max(...now);
      const want = A.BAY_DECAY * span;
      lines.push(`left alone for ${span} weeks from 70: ${KEYS.map((k,i)=>`${k.slice(0,3)} ${Math.round(now[i])}`).join(" · ")} `
        + `— BAY_DECAY is ${A.BAY_DECAY} a week, so ${want.toFixed(1)} expected and ${fell.toFixed(1)} seen`
        + `   (a house that tours once and goes home bleeds to nothing over ~130 weeks)`);
      /* TWO BARS, AND THE SECOND ONE IS THE POINT. The first draft only checked the fall against
         `BAY_DECAY * span`, which is a constant validated against itself: setting BAY_DECAY to 0
         made both sides nought, the section agreed with itself, and the check PASSED a build in
         which a town never forgets anybody. A scale's rate must be held against the constant AND
         the constant against zero. */
      if(fell < 8)
        bad.push(`local standing fell ${fell.toFixed(1)} over ${span} idle weeks — a town forgetting `
          + `a house that stops turning up is the only cost of neglecting the bay, and BAY_DECAY `
          + `reads ${A.BAY_DECAY} a week, which over ${span} weeks should be plainly visible`);
      else if(Math.abs(fell - want) > Math.max(4, want*0.35))
        bad.push(`local standing fell ${fell.toFixed(1)} over ${span} idle weeks where BAY_DECAY `
          + `${A.BAY_DECAY} a week predicts ${want.toFixed(1)} — the two should agree, and a house `
          + `that never goes back should lose what it built`);
    }

    /* ================= 4. THE BAY GOES TO SOMEBODY ELSE, AND TURNING UP TAKES IT BACK =========
       neither of my arms reached this: the tourist never idles 30 weeks, the homebody never travels */
    {
      let taken = 0, cleared = 0, tries = 0;
      const lags = [], grudges = [];
      for(let h=0; h<3; h++){
        const d = A.newGameState("Bh"+h, "clean", "BAY-HOLD-"+h, null);
        /* the gate wants 30 weeks since `lastTravelled`; hand it that rather than idle for 30 */
        d.flags.lastTravelled = -40;
        let takenAt = null, holder = null, gBefore = null, phase = "idle";
        for(let w=0; w<150; w++){
          if(d.over) break;
          d.gold = 20000; d.unrest = 0;
          for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "rest");
          if(phase === "goNow" && !d.travel && !d.city){ A.setOut(d, KEYS[0]); phase = "gone"; }
          const before = A.bayHolder(d);
          if(!turn(d)) break;
          const after = A.bayHolder(d);
          if(!before && after){
            taken++; takenAt = d.week; holder = after; phase = "goNow";
            const r = (d.rivals||[]).find(x=>x.name===after);
            gBefore = r ? r.grudge : null;
          }
          if(before && !after && takenAt){
            cleared++; lags.push(d.week - takenAt);
            const r = (d.rivals||[]).find(x=>x.name===before);
            if(r && gBefore != null) grudges.push(Math.round(r.grudge - gBefore));
            break;
          }
        }
        tries++;
      }
      lines.push(`the bay in somebody else's hands: taken in ${taken} of ${tries} idle houses · `
        + `given back by turning up in ${cleared} of ${taken}`
        + (lags.length?` after ${lags.join(", ")} weeks`:"")
        + (grudges.length?` · and it costs ${grudges.join(", ")} grudge with them`:"")
        + `   (measured: 8 of 10 idle houses, 0 of 8 touring ones, and 12 of 12 cleared)`);
      if(!taken)
        bad.push(`no rival took the bay in ${tries} houses idle for over 30 weeks — the gate is `
          + `\`!d.city && 30 weeks since lastTravelled && R() < 0.028\`, and a house that never `
          + `travels is the only one that can meet it`);
      else if(!cleared)
        bad.push(`the bay was taken ${taken} times and turning up never took it back — `
          + `\`bayWeek\` clears the holder only on \`if(d.city)\`, which is the whole reward for `
          + `going, and without it a house that stays home once loses the bay permanently`);
      else if(grudges.length && !grudges.some(g=>g > 0))
        bad.push(`taking the bay back cost nothing with the house you took it from — the source `
          + `puts their grudge up 12, which is what makes turning up a decision`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
