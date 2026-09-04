/* THE SQUARE IS A DOOR THE PLAYER CAN OPEN, AND MASTERY IS EARNED THROUGH IT

   Phase queue item #232, phase 5 — the "optional stretch" the item deferred until phases 1-4 had
   shown the engine's per-use cost was acceptable. It asks to "require a won spar to convert
   g.teaching/g.learning into a granted technique or g.mastery (currently pure wins/pfame + time/fee
   thresholds)". It does not say — and this is the thing that had to be measured first — that the
   prerequisite does not exist.

   THERE WAS NO WAY TO SPAR ON PURPOSE. `d.pendingSpar` was written in exactly two places:
   `EVENTS.feud`'s first answer, which arrives when the yard decides it has a grudge, and
   `holdTourney`'s final, which is a UI-only action the rope never calls. `regimen:"spar"` is a
   weekly TRAINING pairing that never fights. Measured over 2,815 played weeks in 14 houses
   (`probes/master.mjs`): **40 spars, every one from a feud, none from a tournament**, in 10 of 14
   houses — about one square every seventy weeks, and not one of them asked for.

   AND MASTERY WAS ALREADY THIN: `canMaster` wants 12 wins and 55 renown, and **15 of 435 men
   (3.4%)** ever clear it. Gating a 3.4% achievement behind a once-in-seventy-weeks accident would
   not have deepened mastery, it would have deleted it. So phase 5 is two things and the order
   matters: open the square, then put the gate behind it.

   THE BAR IS THE GAME'S OWN PRICE ON A MAN, not a new constant. Beat somebody `gladValue` puts at
   or above you and it is written down. Measured over 1,500 spars: a man beats his equal **49.5%**
   of the time and one worth 15% more **31.0%** — a couple of afternoons for a man who is ready and
   a wall for one who is not, which is the difference between a gate and a delay.

   AND IT IS PRICED. Played out on 8 houses, one afternoon a week whenever there was a matchup worth
   having: **500 afternoons, 97 men proved it, 10 became masters — and 82 of those afternoons (16.4%)
   ended with a man off the roster**, which is `SPAR_HURT` doing exactly what #232 measured it at.

   SEVEN ARMS:
   1 · THE DOOR OPENS, AND IT IS THE PLAYER'S: any two fit men of the house, on his say-so.
   2 · AND IT REFUSES WHAT IT SHOULD, saying which: the same man twice, a man who is not fit, one
       kept out of the yard, a square that is not empty, and a house that has had its afternoon.
   3 · ONE AFTERNOON A WEEK: the second call in the same week is refused and changes nothing.
   4 · THE PROOF IS gladValue AND NOTHING ELSE: at or above writes it, below does not, and a man
       who has it does not collect it twice.
   5 · MASTERY WANTS IT: `canMaster` refuses a man of twelve wins and sixty renown who has proved
       nothing, passes him the moment he has, and `masterNeed` names what is missing rather than
       grey a button out.
   6 · AND THE SQUARE STILL CANNOT KILL: the player's door leads to the same `simulateSpar` that
       #232 built with no fell/appeal/missio block in it, so opening it cannot open a way to lose a
       man — only to hurt one.
   7 · IT IS ON THE SCREEN: the picker renders in the training square, prices both men, and the
       button says what it wants when it cannot be pressed. */
import { found, clearAll, installRope, forge, tab, settle } from "../harness.mjs";

export const name = "prove";
export const describe = "the lanista can put two of his own in the square, and that is where a master is made";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"PROVE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    let tick = 0;
    const yard = (n) => {
      const d = A.newGameState("Prove", "clean", `PRV-${tick++}`, null);
      d.week = 60; d.gold = 3000; d.gladiators = [];
      for(let i=0;i<n;i++){
        const g = A.genGladiator(d, 50 + i*6); g.id = d.nextId++; g.status = "active";
        g.mine = true; g.kit = A.defaultKit(g.cls); g.wins = 4 + i; g.losses = 2;
        g.pfame = 20 + i*10; g.morale = 70; g.fatigue = 0;
        d.gladiators.push(g);
      }
      return d;
    };

    /* ---- 1 + 2 + 3: the door, what it refuses, and one afternoon a week ---- */
    let arm1 = null;
    { const d = yard(4);
      const [a,b,c] = A.activeG(d);
      const ok      = A.squareReady(d, a, b);
      const sameMan = A.squareWhy(d, a, a);
      d.gladiators[2].status = "injured";
      const unfit   = A.squareWhy(d, a, d.gladiators[2]);
      d.gladiators[2].status = "active";
      d.gladiators[3].benched = { weeks:3, why:"kept apart" };
      const benched = A.squareWhy(d, a, d.gladiators[3]);
      d.gladiators[3].benched = null;
      d.pendingSpar = { aid:a.id, bid:b.id, kind:"feud" };
      const busy    = A.squareWhy(d, a, b);
      d.pendingSpar = null;

      const took = A.challengeSquare(d, a.id, b.id);
      const marked = !!d.pendingSpar;
      const weekStamped = d.flags && d.flags.squareWeek === d.week;
      d.pendingSpar = null;                                  /* the box would have fought it */
      const twice = A.challengeSquare(d, a.id, c.id);
      const twiceWhy = A.squareWhy(d, a, c);
      const noSecondMark = !d.pendingSpar;
      d.week++;                                              /* next week, and it opens again */
      const nextWeek = A.challengeSquare(d, a.id, c.id);

      arm1 = { ok, sameMan, unfit, benched, busy, took, marked, weekStamped,
        twice, twiceWhy, noSecondMark, nextWeek };
      if(!ok) bad.push(`two fit men of the house could not be put in the square: ${A.squareWhy(d,a,b)}`);
      if(!sameMan) bad.push(`a man was allowed into the square against himself`);
      if(!unfit) bad.push(`a man who is not fit was allowed into the square`);
      if(!benched) bad.push(`a man kept out of the yard was allowed into the square`);
      if(!busy) bad.push(`the square took a second pair while one was already standing in it`);
      if(!took || !marked) bad.push(`challengeSquare did not put the pair on the sand`);
      if(!weekStamped) bad.push(`the afternoon was not stamped on the week — nothing stops a second one`);
      if(twice || !noSecondMark) bad.push(`a second afternoon ran in the same week`);
      if(!twiceWhy) bad.push(`the second call in a week gave no reason for refusing`);
      if(!nextWeek) bad.push(`the square never opened again the following week`); }

    /* ---- 4: the proof is gladValue and nothing else ---- */
    let arm4 = null;
    { const d = yard(4);
      const men = A.activeG(d).slice().sort((x,y)=>A.gladValue(x)-A.gladValue(y));
      const low = men[0], high = men[men.length-1];
      const beatLow  = A.proveInSquare(d, high, low);     /* high beat a cheaper man — no proof */
      const afterLow = A.provedIt(high);
      const beatHigh = A.proveInSquare(d, low, high);     /* low beat a dearer man — proof */
      const afterHigh = A.provedIt(low);
      const again    = A.proveInSquare(d, low, high);     /* he does not collect it twice */
      const rec = low.proved || {};
      arm4 = { lowWorth:A.gladValue(low), highWorth:A.gladValue(high),
        beatLow, afterLow, beatHigh, afterHigh, again, foe:rec.foe || null, worth:rec.worth || null };
      if(beatLow || afterLow) bad.push(`beating a man the house prices BELOW him counted as proof`);
      if(!beatHigh || !afterHigh) bad.push(`beating a man the house prices ABOVE him did not count as proof`);
      if(again) bad.push(`a man who had already proved it collected the proof a second time`);
      if(!rec.foe) bad.push(`the proof does not record who it was against`); }

    /* ---- 5: mastery wants it ---- */
    let arm5 = null;
    { const d = yard(4);
      const men0 = A.activeG(d).slice().sort((x,y)=>A.gladValue(x)-A.gladValue(y));
      const g = men0[0];
      /* THE STATS FIRST, THE FOE SECOND. `gladValue` reads wins and renown, so setting the
         candidate's up to the mastery gate re-prices him — the first draft picked his foe before
         raising him and then wondered why beating the yard's dearest man proved nothing. */
      g.wins = A.MASTERY_GATE.wins + 2; g.pfame = A.MASTERY_GATE.pfame + 5;
      let foe = A.activeG(d).filter(x=>x.id!==g.id).sort((x,y)=>A.gladValue(y)-A.gladValue(x))[0];
      if(A.gladValue(foe) < A.gladValue(g)){ foe.wins = g.wins + 6; foe.pfame = g.pfame + 120; }
      const men = men0;
      const canBefore = A.canMaster(d, g);
      const madeBefore = A.makeMaster(d, g);
      const needBefore = A.masterNeed(d, g) || [];
      A.proveInSquare(d, g, foe);
      const canAfter = A.canMaster(d, g);
      const needAfter = A.masterNeed(d, g) || [];
      const madeAfter = A.makeMaster(d, g);
      /* and the two older clauses still bite */
      const green = men[1]; green.wins = 2; green.pfame = 5;
      A.proveInSquare(d, green, foe);
      const greenCan = A.canMaster(d, green);
      const greenNeed = A.masterNeed(d, green) || [];
      arm5 = { canBefore, madeBefore, needBefore, canAfter, needAfter, madeAfter,
        greenCan, greenNeed, gate:A.MASTERY_GATE };
      if(canBefore || madeBefore) bad.push(`a man of ${g.wins} wins and ${Math.round(g.pfame)} renown who had proved nothing was made a master`);
      if(!needBefore.some(x=>/square/.test(x))) bad.push(`masterNeed did not name the square: [${needBefore.join("; ")}]`);
      if(!canAfter || !madeAfter) bad.push(`a man who had proved it in the square still could not be made a master`);
      if(needAfter.length) bad.push(`masterNeed still wanted [${needAfter.join("; ")}] from a man who qualifies`);
      if(greenCan) bad.push(`a two-win man who had proved something in the square was made a master — wins and renown still have to hold`);
      if(!greenNeed.some(x=>/wins/.test(x))) bad.push(`masterNeed did not name the wins a green man is short of`); }

    /* ---- 6: and the square still cannot kill ---- */
    let arm6 = null;
    { let dead = 0, hurt = 0, proved = 0, n = 220, threw = null;
      for(let i=0;i<n;i++){
        const d = yard(3);
        const men = A.activeG(d);
        const before = men.length;
        try {
          if(!A.challengeSquare(d, men[0].id, men[1].id)) continue;
          const q = d.pendingSpar; d.pendingSpar = null;
          let res = A.doSpar(d, q.aid, q.bid, null, null, q.kind);
          if(res && res.crux){ res.pending.beats = res.beats; res = A.doSpar(d, q.aid, q.bid, res.pending, "run"); }
          if(d.gladiators.some(g=>g.status === "dead")) dead++;
          if(A.activeG(d).filter(g=>g.status==="active").length < before) hurt++;
          if(d.gladiators.some(g=>A.provedIt(g))) proved++;
        } catch(e){ if(!threw) threw = String(e && e.stack || e).slice(0,180); }
      }
      arm6 = { n, dead, hurt, proved, threw };
      if(threw) bad.push(`the player's own square threw: ${threw}`);
      if(dead) bad.push(`${dead} of ${n} afternoons in the square killed somebody — the square has no fell/appeal/missio block and opening a door to it must not open a way to lose a man`);
      if(!hurt) bad.push(`${n} afternoons and nobody was ever hurt — the injury is the price, and without it this is free`);
      if(!proved) bad.push(`${n} afternoons and nobody ever proved anything`); }

    return { bad, arm1, arm4, arm5, arm6 };
  });

  bad.push(...r.bad);
  lines.push(`the door: two fit men ${r.arm1.ok} · stamped on the week ${r.arm1.weekStamped} · a second afternoon that week ${r.arm1.twice} ("${r.arm1.twiceWhy}") · and it opens again next week ${r.arm1.nextWeek}`);
  lines.push(`  and it refuses, saying which: himself "${r.arm1.sameMan}" · unfit "${r.arm1.unfit}" · kept out "${r.arm1.benched}" · already standing "${r.arm1.busy}"`);
  lines.push(`the proof is the house's own price: beating a ${r.arm4.lowWorth}d man proved nothing to a ${r.arm4.highWorth}d one (${r.arm4.beatLow}); the other way round it did (${r.arm4.beatHigh}), against ${r.arm4.foe} at ${r.arm4.worth}d, once (${r.arm4.again})`);
  lines.push(`mastery at ${r.arm5.gate.wins} wins / ${r.arm5.gate.pfame} renown: before the square ${r.arm5.canBefore}, after it ${r.arm5.canAfter}`);
  lines.push(`  and it says what it wants: [${r.arm5.needBefore.join(" · ")}] · a two-win man who proved it still wants [${r.arm5.greenNeed.join(" · ")}]`);
  lines.push(`${r.arm6.n} afternoons through the player's own door: ${r.arm6.dead} dead, ${r.arm6.hurt} left a man off the roster (${(100*r.arm6.hurt/r.arm6.n).toFixed(1)}%), ${r.arm6.proved} proved something`);

  /* ---- 7: it is on the screen ---- */
  await forge(p, (A) => {
    const d = A.newGameState("Prove", "clean", "PRV-UI", null);
    d.week = 60; d.gold = 3000;
    return { plant:d };
  });
  await tab(p, "ludus");
  await settle(p);
  /* THE SQUARE IS A DOCUMENT, NOT A PANEL ON A TAB. `ScnSquare` opens it through `openDoc` from
     the scene, so arriving at the ludus tab and looking for the picker finds nothing — which is
     what the first draft of this arm reported as "the door does not exist". */
  await p.evaluate(()=>{
    const el = [...document.querySelectorAll('[role="button"]')]
      .find(x=>/training square/i.test(x.getAttribute("aria-label")||""));
    if(el) el.dispatchEvent(new MouseEvent("click", { bubbles:true }));
  });
  await settle(p);
  const ui = await p.evaluate(()=>{
    /* the SMALLEST element that holds the heading AND the lists. Sorting on text length alone
       returns the heading <div> itself, which has no selects in it — reported as "0 lists of -1
       men" by the first draft of this arm. */
    const els = [...document.querySelectorAll("*")].filter(el=>/INTO THE SQUARE/.test(el.textContent||"")
      && el.querySelectorAll("select").length >= 2 && (el.textContent||"").length < 4000);
    els.sort((a,b)=>a.textContent.length-b.textContent.length);
    const box = els[0];
    if(!box) return { found:false };
    const sels = [...box.querySelectorAll("select")];
    const btn = [...box.querySelectorAll("button")][0];
    return { found:true, selects:sels.length, options:sels[0] ? sels[0].options.length : 0,
      btn: btn ? (btn.textContent||"").trim() : null,
      prices: /worth \d+d/.test(box.textContent||"") };
  });
  lines.push(`on the screen: the picker ${ui.found ? `renders with ${ui.selects} lists of ${ui.options-1} men` : "DID NOT RENDER"}${ui.found?` · button "${ui.btn}" · prices the men ${ui.prices}`:""}`);
  if(!ui.found) bad.push(`the training square offers no way into it — the whole of phase 5 is that the door exists`);
  else {
    if(ui.selects !== 2) bad.push(`the picker offers ${ui.selects} lists, not two`);
    if(ui.options < 3) bad.push(`the picker's list holds ${ui.options-1} men`);
    if(!ui.prices) bad.push(`the picker does not price the men, so the player cannot see which of them has anything to prove`);
    if(!ui.btn) bad.push(`the picker has no button`);
  }

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
