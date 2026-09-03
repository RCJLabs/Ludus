/* THE YARD DUEL IS A FIGHT NOW, AND IT STILL CANNOT KILL ANYBODY

   Phase queue item #232, phases 1 and 3. Two moments in this game stop the whole familia to watch
   two of your own men fight, and neither called a fight engine. `EVENTS.feud`'s i===0 branch — the
   one reached by choosing "put them on the sand" — was two `power()` calls, one comparison against
   a pair of independent 0.8-1.3 rolls, and a flat `R()<0.16` injury coin on the loser, all under a
   line of prose about wooden swords and the doctore counting that described none of it.

   `simulateSpar` is the fifth resolver, sibling to simulateFight/simulatePair/simulateMelee/
   simulateVenatio the way `simulatePair` is — "apart from simulateFight on purpose". What makes it
   a spar is not flavour but arithmetic: there is no fell/appeal/missio block to reach, damage is
   capped AFTER every multiplier at `SPAR_CAP`, and a man's hands go up at `SPAR_YIELD`. Those two
   constants put a hard floor under every man who walks into the square — `SPAR_YIELD - SPAR_CAP`,
   and nothing in the function can go below it.

   EIGHT ARMS:
   1 · IT CANNOT KILL: across 1,200 spars at the most reckless tactic there is, no death/fall/appeal
       beat is ever emitted, no man is left below the arithmetic floor, and the result carries no
       `dead` field for anyone to read.
   2 · THE FLOOR IS ARITHMETIC, NOT LUCK: the worst blow the engine will land is `SPAR_CAP` even
       with every multiplier pushed — checked by reading the largest `dmg` on any beat.
   3 · THE ODDS ARE THE ODDS: a dead-level pair is a coin, and a decisively better man is a heavy
       favourite — the curve `probes/spar.mjs` sized `SPAR_SWING` against, held here as a band so a
       silent re-pricing of the yard duel fails the gate.
   4 · THE FIGHT IS REAL: beats are emitted, rounds are within the cap, and the winner is the man
       the final HP says it is.
   5 · THE FEUD BRANCH HANDS IT TO THE VIEWER: the answer no longer resolves anything — it sets
       `d.pendingSpar` and stands back, the bout comes to the balance for a word, and only the
       resumed fight pays the aftermath. Both men alive, the same morale/pfame/unrest it always
       paid, the grudge ended, and any injury carrying a `part` — a field the old flat
       `INJURIES[ri(0,2)]` roll never set — at reduced weeks.
   6 · THE MENU IS ITS OWN: `cruxSolo` was written as "none of the other three", so a fifth engine
       inherits the single sand's entire menu by default — `cloth` (an appeal, to an editor who is
       not there, in a fight nobody can die in), `finish`, `legs`, `breather`. The item's own
       verify-first predicted this exact hazard. Held here against the rule, not the JSX.
   8 · AND IT HAPPENS WITH NOBODY WATCHING: the rope answers events by calling `EVENTS[id].run`
       and clearing `pendingEvent` itself — it has never heard of a viewer. Handing the duel to one
       therefore meant that in every headless path (every probe, half the checks) the fight simply
       did not happen: no winner, no aftermath, no grudge settled, and the marker left on the save.
       `endWeek` resolves what the box did not, and this holds it.
   7 · GETTING BETWEEN THEM SETTLES NOTHING, AND THAT IS THE PRICE: a stopped spar hurts nobody and
       leaves the grudge exactly where it was; telling them to stop dancing leaves the beaten man
       lower than letting it run does. Both are what the menu says they are. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "spar";
export const describe = "the yard duel is fought round by round, and the square still cannot kill anybody";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"SPAR-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    const d = A.newGameState("Spar", "clean", "SPAR", null);
    const man = q => { const g = A.genGladiator(d, q); g.id = d.nextId++; g.status="active"; g.mine=true;
      g.kit = A.defaultKit(g.cls); return g; };

    /* ---- 1 + 2. it cannot kill, and the floor is arithmetic ---- */
    let arm12 = null;
    { const floor = A.SPAR_YIELD - A.SPAR_CAP;
      let lethal = 0, belowFloor = 0, carriedDead = 0, worstHP = 100, biggestBlow = 0, longest = 0, noBeats = 0;
      for(let i=0;i<1200;i++){
        const a = man(40+Math.floor(Math.random()*55)), b = man(40+Math.floor(Math.random()*55));
        const res = A.simulateSpar(A.clone(a), A.clone(b), "aggressive", { d }, {});
        if(res.beats.some(x=>x.kind==="death" || x.kind==="fall" || x.kind==="appeal" || x.kind==="missio")) lethal++;
        if(res.dead !== undefined) carriedDead++;
        worstHP = Math.min(worstHP, res.vA, res.vB);
        if(Math.min(res.vA,res.vB) < floor) belowFloor++;
        for(const x of res.beats) if((x.dmg||0) > biggestBlow) biggestBlow = x.dmg;
        longest = Math.max(longest, res.rounds);
        if(!res.beats.length) noBeats++;
      }
      arm12 = { floor, lethal, belowFloor, carriedDead, worstHP:+worstHP.toFixed(1), biggestBlow, longest, noBeats,
        cap:A.SPAR_CAP, yieldAt:A.SPAR_YIELD, roundCap:A.SPAR_ROUNDS };
      if(lethal) bad.push(`${lethal} of 1200 aggressive spars emitted a death/fall/appeal beat — the square must be structurally unable to kill`);
      if(carriedDead) bad.push(`the spar result carries a "dead" field — nothing downstream should ever have one to read`);
      if(belowFloor) bad.push(`${belowFloor} spars left a man below the arithmetic floor of ${floor} (SPAR_YIELD ${A.SPAR_YIELD} - SPAR_CAP ${A.SPAR_CAP})`);
      if(biggestBlow > A.SPAR_CAP) bad.push(`a wooden blow landed for ${biggestBlow}, over SPAR_CAP ${A.SPAR_CAP} — the cap must apply after every multiplier`);
      if(longest > A.SPAR_ROUNDS) bad.push(`a spar ran ${longest} rounds, over SPAR_ROUNDS ${A.SPAR_ROUNDS}`);
      if(noBeats) bad.push(`${noBeats} spars produced no beats at all`); }

    /* ---- 3. the odds are the odds ---- */
    let arm3 = null;
    { const powerOf = (x, foe) => A.power(Object.assign(A.clone(x), { mods:A.kitMods(x.kit,x.cls,x) }), "measured", foe.cls, 0, 1);
      let evenN = 0, evenA = 0, gapN = 0, gapBetter = 0;
      for(let i=0;i<2500;i++){
        const a = man(40+Math.floor(Math.random()*55)), b = man(40+Math.floor(Math.random()*55));
        const pa = powerOf(a,b), pb = powerOf(b,a);
        if(!(pa>0)||!(pb>0)) continue;
        const ratio = pa>=pb ? pa/pb : pb/pa;
        const res = A.simulateSpar(A.clone(a), A.clone(b), "measured", { d }, {});
        if(ratio < 1.02){ evenN++; if(res.winner==="A") evenA++; }
        else if(ratio >= 1.28 && ratio <= 1.45){ gapN++; if(res.winner === (pa>=pb?"A":"B")) gapBetter++; }
      }
      const even = evenN ? evenA/evenN*100 : 50, gap = gapN ? gapBetter/gapN*100 : 0;
      arm3 = { evenN, even:+even.toFixed(1), gapN, gap:+gap.toFixed(1) };
      if(evenN >= 100 && (even < 38 || even > 62))
        bad.push(`a dead-level pair went ${even.toFixed(1)}% to one side over ${evenN} spars — the square should be a coin between equals`);
      if(gapN >= 60 && (gap < 78 || gap > 98))
        bad.push(`a clearly better man (power ratio 1.28-1.45) won ${gap.toFixed(1)}% over ${gapN} spars — probes/spar.mjs sized SPAR_SWING to hold the branch's own 88-94% there, so this is a silent re-pricing`); }

    /* ---- 4. the fight is real and internally consistent ---- */
    let arm4 = null;
    { let mismatched = 0, yields = 0, counts = 0, n = 0;
      for(let i=0;i<600;i++){
        const a = man(40+Math.floor(Math.random()*55)), b = man(40+Math.floor(Math.random()*55));
        const res = A.simulateSpar(A.clone(a), A.clone(b), "measured", { d }, {});
        n++;
        if(res.yielded) yields++; else {
          counts++;
          /* on the count the winner is simply whoever has more left */
          if(res.vA !== res.vB && res.winner !== (res.vA > res.vB ? "A" : "B")) mismatched++;
        }
      }
      arm4 = { n, yields, counts, mismatched, yieldPct:+(yields/n*100).toFixed(1) };
      if(mismatched) bad.push(`${mismatched} spars decided on the count named a winner the final HP disagrees with`);
      if(!yields || !counts) bad.push(`a spar should end both ways over 600 runs — got ${yields} yields and ${counts} counts`); }

    /* ---- 5. the feud branch hands the duel to the viewer, and the fight settles it ---- */
    let arm5 = null;
    { let died = 0, hurt = 0, noPart = 0, longWeeks = 0, n = 0, moraleOk = 0, handed = 0, cruxed = 0, tieGone = 0;
      for(let i=0;i<300;i++){
        const dd = A.newGameState("Feud", "clean", `FEUD-${i}`, null);
        const a = A.genGladiator(dd, 70), b = A.genGladiator(dd, 70);
        a.id = dd.nextId++; b.id = dd.nextId++;
        [a,b].forEach(g=>{ g.status="active"; g.mine=true; g.kit=A.defaultKit(g.cls); g.morale=50; dd.gladiators.push(g); });
        const c = A.genGladiator(dd, 60); c.id=dd.nextId++; c.status="active"; c.mine=true; c.kit=A.defaultKit(c.cls); dd.gladiators.push(c);
        A.addTie(dd, a.id, b.id, "rival");
        A.EVENTS.feud.run(dd, { id:"feud", data:{ aid:a.id, bid:b.id } }, 0);
        n++;
        /* the answer no longer resolves anything: it puts them on the sand and stands back */
        if(dd.pendingSpar && dd.pendingSpar.aid===a.id && dd.pendingSpar.bid===b.id) handed++;
        const p = dd.pendingSpar; dd.pendingSpar = null;
        if(!p) continue;
        const first = A.doSpar(dd, p.aid, p.bid, null, null);
        let done = first;
        if(first && first.crux){
          cruxed++;
          if(!(first.pending && first.pending.spar)) bad.push(`a spar came to the balance with no spar pending to resume from`);
          /* and the aftermath lands when the fight finishes, not before */
          if([a,b].some(g=>g.morale !== 50)) bad.push(`the aftermath landed while the bout was still held at the balance`);
          first.pending.beats = first.beats;   /* what `speak` does before it resumes */
          done = A.doSpar(dd, p.aid, p.bid, first.pending, "run");
        }
        if([a,b].some(g=>g.status==="dead")) died++;
        const l = [a,b].find(g=>g.morale < 50), w = [a,b].find(g=>g.morale > 50);
        if(w && l) moraleOk++;
        if(!A.tieBetween(dd, a.id, b.id)) tieGone++;
        const inj = [a,b].map(g=>g.injury).find(Boolean);
        if(inj){ hurt++; if(!inj.part) noPart++; if(inj.weeks > 3) longWeeks++; }
        if(done && done.beats && first.beats && done.beats.length < first.beats.length)
          bad.push(`the resumed spar dropped the beats it had already played`);
      }
      arm5 = { n, handed, cruxed, cruxPct:+(cruxed/n*100).toFixed(1), died, hurt, hurtPct:+(hurt/n*100).toFixed(1), noPart, longWeeks, moraleOk, tieGone };
      if(handed !== n) bad.push(`${n-handed} of ${n} feud answers failed to hand the duel to the viewer via d.pendingSpar`);
      /* the crux is a window, not a promise: a duel settled inside SPAR_SPEAK rounds is simply
         over before there was anything to say. It should still be the common case. */
      if(cruxed / n < 0.5) bad.push(`only ${cruxed} of ${n} spars came to the balance — the square is meant to stop for a word in most duels, not a minority`);
      if(died) bad.push(`${died} of ${n} feud duels killed one of your own men — the branch must be unable to`);
      if(noPart) bad.push(`${noPart} injuries out of the feud duel carry no "part" — the old flat INJURIES[ri(0,2)] roll never set one, so the branch is not going through injuryFor and the fight`);
      if(longWeeks) bad.push(`${longWeeks} feud-duel injuries ran over 3 weeks — a wooden sword's weeks are meant to come down`);
      if(hurt/n < 0.06 || hurt/n > 0.30)
        bad.push(`the feud duel hurt somebody ${(hurt/n*100).toFixed(1)}% of the time — SPAR_HURT was sized to hold the flat 16% it replaced (measured 15.6%)`);
      if(moraleOk !== n) bad.push(`the aftermath did not land on ${n-moraleOk} of ${n} settled duels — a winner should gain morale and a loser lose it, unchanged from before`);
      if(tieGone !== n) bad.push(`${n-tieGone} settled duels left the grudge standing — a duel fought to a finish is meant to end it`); }

    /* ---- 6. the menu a spar gets is its own, not the sand's ---- */
    let arm6 = null;
    { const menu = A.cruxMenuFor({ spar:true });
      const keys = Object.keys(menu).sort();
      const soloFlag = A.cruxSolo({ spar:true });
      const single = Object.keys(A.cruxMenuFor({})).sort();
      arm6 = { keys, soloFlag, single, sparIsSpar: menu === A.SPAR_CRUX };
      if(soloFlag) bad.push(`cruxSolo() calls a spar a solo bout — it would inherit the single sand's whole menu`);
      if(!arm6.sparIsSpar) bad.push(`a spar is not handed SPAR_CRUX: got [${keys.join(",")}]`);
      for(const forbidden of ["cloth","finish","legs","breather","cover"])
        if(keys.includes(forbidden))
          bad.push(`the spar menu offers "${forbidden}" — there is no editor, no appeal and no missio in a training square`);
      if(keys.length !== 3) bad.push(`the spar menu is ${keys.length} entries, not the three it is meant to be: [${keys.join(",")}]`);
      if(!single.includes("cloth")) bad.push(`the single bout lost its own menu on the way: [${single.join(",")}]`);
      /* and the words around it are the spar's own too — no editor, no box, no appeal */
      const W = A.cruxWords({ spar:true }), Wsolo = A.cruxWords({});
      arm6.head = W.head; arm6.soloHead = Wsolo.head;
      if(/BOX/.test(W.head)) bad.push(`the spar's crux is headed "${W.head}" — there is no editor's box at a training square`);
      if(W.foot === Wsolo.foot) bad.push(`the spar reads the single bout's footer back at the player`);
      if(!/BOX/.test(Wsolo.head)) bad.push(`the single bout lost its own crux heading: "${Wsolo.head}"`); }

    /* ---- 7. getting between them settles nothing, and that is the price ---- */
    let arm7 = null;
    { let stoppedHurt = 0, tieKept = 0, n = 0, pressHarder = 0, pressN = 0, runN = 0, runLow = 0, pressLow = 0;
      for(let i=0;i<200;i++){
        const mk = () => { const dd = A.newGameState("Stop", "clean", `STOP-${i}`, null);
          const a = A.genGladiator(dd, 70), b = A.genGladiator(dd, 70);
          a.id = dd.nextId++; b.id = dd.nextId++;
          [a,b].forEach(g=>{ g.status="active"; g.mine=true; g.kit=A.defaultKit(g.cls); g.morale=50; dd.gladiators.push(g); });
          A.addTie(dd, a.id, b.id, "rival");
          return { dd, a, b };
        };
        { const { dd, a, b } = mk();
          const first = A.doSpar(dd, a.id, b.id, null, null);
          if(!first.crux) continue;
          first.pending.beats = first.beats;
          const res = A.doSpar(dd, a.id, b.id, first.pending, "stop");
          n++;
          if([a,b].some(g=>g.injury)) stoppedHurt++;
          if(A.tieBetween(dd, a.id, b.id)) tieKept++;
          if(res && res.win) bad.push(`a stopped spar reported a win`);
          if(res && !res.stopped) bad.push(`a stopped spar did not mark itself stopped`); }
        { const { dd, a, b } = mk();
          const first = A.doSpar(dd, a.id, b.id, null, null);
          if(first.crux){ first.pending.beats = first.beats;
          const res = A.doSpar(dd, a.id, b.id, first.pending, "press");
          pressN++; if(res){ pressLow += Math.min(res.beats[res.beats.length-1].vA ?? 100, res.beats[res.beats.length-1].vB ?? 100); } } }
        { const { dd, a, b } = mk();
          const first = A.doSpar(dd, a.id, b.id, null, null);
          if(first.crux){ first.pending.beats = first.beats;
          const res = A.doSpar(dd, a.id, b.id, first.pending, "run");
          runN++; if(res){ runLow += Math.min(res.beats[res.beats.length-1].vA ?? 100, res.beats[res.beats.length-1].vB ?? 100); } } }
      }
      const pressAvg = pressLow/Math.max(1,pressN), runAvg = runLow/Math.max(1,runN);
      pressHarder = pressAvg < runAvg ? 1 : 0;
      arm7 = { n, stoppedHurt, tieKept, pressAvg:+pressAvg.toFixed(1), runAvg:+runAvg.toFixed(1) };
      if(stoppedHurt) bad.push(`${stoppedHurt} of ${n} stopped spars still injured somebody — getting between them is meant to cost nobody a week`);
      if(tieKept !== n) bad.push(`${n-tieKept} of ${n} stopped spars removed the grudge anyway — nothing is settled when you call it off`);
      if(!pressHarder) bad.push(`pressing them left the beaten man on ${pressAvg.toFixed(1)} against ${runAvg.toFixed(1)} for letting it run — "stop dancing" is meant to cost somebody more`); }

    /* ---- 8. the duel happens when nobody is watching it ---- */
    let arm8 = null;
    { let settled = 0, dangling = 0, n = 0, moraleMoved = 0;
      for(let i=0;i<200;i++){
        const dd = A.newGameState("Head", "clean", `HEAD-${i}`, null);
        const a = A.genGladiator(dd, 70), b = A.genGladiator(dd, 70);
        a.id = dd.nextId++; b.id = dd.nextId++;
        [a,b].forEach(g=>{ g.status="active"; g.mine=true; g.kit=A.defaultKit(g.cls); g.morale=50; dd.gladiators.push(g); });
        const c2 = A.genGladiator(dd, 60); c2.id=dd.nextId++; c2.status="active"; c2.mine=true; c2.kit=A.defaultKit(c2.cls); dd.gladiators.push(c2);
        A.addTie(dd, a.id, b.id, "rival");
        const t0 = A.tieBetween(dd, a.id, b.id);
        /* exactly what the rope does: run the event, clear the question, turn the week.
           No chooseEv, no viewer, nobody at the rail. */
        A.EVENTS.feud.run(dd, { id:"feud", data:{ aid:a.id, bid:b.id } }, 0);
        dd.pendingEvent = null;
        try { A.endWeek(dd); } catch(e){}
        n++;
        if(dd.pendingSpar) dangling++;
        /* the ORIGINAL grudge object, not "is there any tie" — a full week can form a fresh bond
           between the same two men, and that is the week working, not the duel failing */
        if(!t0 || !(dd.ties||[]).includes(t0)) settled++;
        /* a week moves morale for a dozen reasons, so that proves nothing on its own. The duel's
           own chronicle line is written by doSpar and by nothing else — that is the fingerprint. */
        if((dd.log||[]).some(x=>/wooden swords and the doctore counting/.test(x.text))) moraleMoved++;
      }
      arm8 = { n, settled, dangling, moraleMoved };
      if(dangling) bad.push(`${dangling} of ${n} headless duels left d.pendingSpar sitting on the save — the marker outlived the week that was meant to resolve it`);
      if(settled !== n) bad.push(`${n-settled} of ${n} headless duels never settled the grudge — without a viewer the fight simply did not happen`);
      if(moraleMoved !== n) bad.push(`${n-moraleMoved} of ${n} headless duels wrote no duel line to the chronicle — doSpar never ran for them`); }

    return { bad, arm12, arm3, arm4, arm5, arm6, arm7, arm8 };
  });

  bad.push(...r.bad);

  lines.push(`arm 1+2 — 1200 aggressive spars: ${r.arm12.lethal} lethal beats · ${r.arm12.belowFloor} below the floor `
    + `(SPAR_YIELD ${r.arm12.yieldAt} - SPAR_CAP ${r.arm12.cap} = ${r.arm12.floor}) · worst HP reached ${r.arm12.worstHP} `
    + `· biggest blow ${r.arm12.biggestBlow}/${r.arm12.cap} · longest ${r.arm12.longest}/${r.arm12.roundCap} rounds`);
  lines.push(`arm 3 — the odds: dead-level pairs ${r.arm3.even}% to one side (n=${r.arm3.evenN}) `
    + `· the better man at ratio 1.28-1.45 wins ${r.arm3.gap}% (n=${r.arm3.gapN})`);
  lines.push(`arm 4 — ${r.arm4.n} spars: ${r.arm4.yields} ended on a yield (${r.arm4.yieldPct}%), ${r.arm4.counts} on the doctore's count, `
    + `${r.arm4.mismatched} disagreed with their own HP`);
  lines.push(`arm 5 — ${r.arm5.n} feud duels: handed to the viewer ${r.arm5.handed}, came to the balance ${r.arm5.cruxed} (${r.arm5.cruxPct}%) `
    + `· ${r.arm5.died} dead · somebody hurt ${r.arm5.hurtPct}% (the flat roll it replaces: 16%) `
    + `· ${r.arm5.noPart} injuries with no part · ${r.arm5.longWeeks} over 3 weeks · grudge ended ${r.arm5.tieGone}/${r.arm5.n}`);
  lines.push(`arm 6 — the spar's own menu: [${r.arm6.keys.join(", ")}] · cruxSolo says solo: ${r.arm6.soloFlag} `
    + `· the single bout still gets [${r.arm6.single.join(", ")}] · headed "${r.arm6.head}" against "${r.arm6.soloHead}"`);
  lines.push(`arm 7 — ${r.arm7.n} stopped: ${r.arm7.stoppedHurt} hurt, grudge kept ${r.arm7.tieKept}/${r.arm7.n} `
    + `· pressed leaves the beaten man on ${r.arm7.pressAvg} against ${r.arm7.runAvg} for letting it run`);

  lines.push(`arm 8 — ${r.arm8.n} duels answered headlessly (the rope's path, no viewer): `
    + `${r.arm8.dangling} left a dangling marker · grudge settled ${r.arm8.settled}/${r.arm8.n} · the duel's own line written ${r.arm8.moraleMoved}/${r.arm8.n}`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
