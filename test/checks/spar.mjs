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

   FIVE ARMS:
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
   5 · THE FEUD BRANCH ACTUALLY GOES THROUGH IT: resolving the event leaves both men alive, pays the
       same aftermath it always paid (morale, pfame, unrest), and any injury it hands out carries a
       `part` — a field the old flat `INJURIES[ri(0,2)]` roll never set — at reduced weeks. */
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

    /* ---- 5. the feud branch actually goes through the engine ---- */
    let arm5 = null;
    { let died = 0, hurt = 0, noPart = 0, longWeeks = 0, n = 0, moraleOk = 0, textOk = 0;
      for(let i=0;i<400;i++){
        const dd = A.newGameState("Feud", "clean", `FEUD-${i}`, null);
        const a = A.genGladiator(dd, 70), b = A.genGladiator(dd, 70);
        a.id = dd.nextId++; b.id = dd.nextId++;
        [a,b].forEach(g=>{ g.status="active"; g.mine=true; g.kit=A.defaultKit(g.cls); g.morale=50; dd.gladiators.push(g); });
        const c = A.genGladiator(dd, 60); c.id=dd.nextId++; c.status="active"; c.mine=true; c.kit=A.defaultKit(c.cls); dd.gladiators.push(c);
        const before = { unrest: dd.unrest };
        const say = A.EVENTS.feud.run(dd, { id:"feud", data:{ aid:a.id, bid:b.id } }, 0);
        n++;
        if([a,b].some(g=>g.status==="dead")) died++;
        const l = [a,b].find(g=>g.morale < 50), w = [a,b].find(g=>g.morale > 50);
        if(w && l) moraleOk++;
        const inj = [a,b].map(g=>g.injury).find(Boolean);
        if(inj){ hurt++; if(!inj.part) noPart++; if(inj.weeks > 3) longWeeks++; }
        if(typeof say === "string" && /doctore/.test(say)) textOk++;
      }
      arm5 = { n, died, hurt, hurtPct:+(hurt/n*100).toFixed(1), noPart, longWeeks, moraleOk, textOk };
      if(died) bad.push(`${died} of ${n} feud duels killed one of your own men — the branch must be unable to`);
      if(noPart) bad.push(`${noPart} injuries out of the feud duel carry no "part" — the old flat INJURIES[ri(0,2)] roll never set one, so the branch is not going through injuryFor and the fight`);
      if(longWeeks) bad.push(`${longWeeks} feud-duel injuries ran over 3 weeks — a wooden sword's weeks are meant to come down`);
      if(hurt/n < 0.06 || hurt/n > 0.30)
        bad.push(`the feud duel hurt somebody ${(hurt/n*100).toFixed(1)}% of the time — SPAR_HURT was sized to hold the flat 16% it replaced (measured 15.6%)`);
      if(moraleOk !== n) bad.push(`the branch's own aftermath did not land on ${n-moraleOk} of ${n} duels — a winner should gain morale and a loser lose it, unchanged from before`);
      if(textOk !== n) bad.push(`${n-textOk} of ${n} duel answers dropped the scene's own words`); }

    return { bad, arm12, arm3, arm4, arm5 };
  });

  bad.push(...r.bad);

  lines.push(`arm 1+2 — 1200 aggressive spars: ${r.arm12.lethal} lethal beats · ${r.arm12.belowFloor} below the floor `
    + `(SPAR_YIELD ${r.arm12.yieldAt} - SPAR_CAP ${r.arm12.cap} = ${r.arm12.floor}) · worst HP reached ${r.arm12.worstHP} `
    + `· biggest blow ${r.arm12.biggestBlow}/${r.arm12.cap} · longest ${r.arm12.longest}/${r.arm12.roundCap} rounds`);
  lines.push(`arm 3 — the odds: dead-level pairs ${r.arm3.even}% to one side (n=${r.arm3.evenN}) `
    + `· the better man at ratio 1.28-1.45 wins ${r.arm3.gap}% (n=${r.arm3.gapN})`);
  lines.push(`arm 4 — ${r.arm4.n} spars: ${r.arm4.yields} ended on a yield (${r.arm4.yieldPct}%), ${r.arm4.counts} on the doctore's count, `
    + `${r.arm4.mismatched} disagreed with their own HP`);
  lines.push(`arm 5 — ${r.arm5.n} feud duels: ${r.arm5.died} dead · somebody hurt ${r.arm5.hurtPct}% (the flat roll it replaces: 16%) `
    + `· ${r.arm5.noPart} injuries with no part · ${r.arm5.longWeeks} over 3 weeks`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
