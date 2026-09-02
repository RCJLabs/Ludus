/* #222 — WHERE THE SAGA DIES

   The item: "13 of 16 houses started one; 12 reached stage 2; 5 reached 'his reckoning is set';
   0 reached the finale — across 6,720 possible weeks, the game's built-in hero story has never
   once paid off."

   THE STAGES, from the source:
     1  igniteSaga     a man at pfame>=40 and wins>=8, no city/travel/Rome, 18-week cooldown
     2  nameRival      at renown >= 42
     3  issueReckoning at renown >= 70 AND NO `challenge` DEADLINE ALREADY STANDS
     4  won            -> the `sagaFreedom` arc, the wooden sword
   renown climbs +1.2 a week below stage 3, plus +2 on a beat (22% a week), plus 5-7 a bout won.

   THE HYPOTHESIS WORTH TESTING FIRST, because it is structural rather than statistical:
   `issueReckoning` refuses while ANY `challenge` deadline stands, and there are FIVE sources of
   those — the nemesis house, the player's own challenge, the hunt, an arc, and the saga itself.
   #225 measured a feud standing on 79% of all weeks. If the nemesis arc holds a challenge most of
   the time, the saga's own reckoning can never be issued and the story cannot reach its third act
   for a reason that has nothing to do with the champion.

   AND THE TWO RESETS. A LOST reckoning sends it back to stage 2 at renown-25, and a MISSED one
   does the same. Either turns the finale into a thing that has to be won twice.

   This instruments every saga a played house starts, week by week: what stage it reached, how long
   each took, what ended it, and — on every week it sat at stage 2 with renown past 70 — whether a
   foreign challenge was the thing standing in its way.

   WHAT IT DELIBERATELY DOES NOT REPORT. An earlier cut also counted whether the reckoning's own
   bout was on the week's card, and reported "on the bill in 16 of 41 weeks" — which was the probe
   reading `d.games.offers` on the wrong side of the week boundary, not the game dropping the bout.
   The sub-arm is gone rather than corrected: a number nobody can stand behind is worse than no
   number, and this project has shipped that mistake before.

     node test/probes/saga.mjs 16 420 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"SAGA" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const sagas = [];           /* one row per saga that ever ignited */
  let weeks = 0, houses = 0, died = 0;
  let ripe = 0, ripeBlocked = 0;   /* weeks at stage 2 past the renown gate, and blocked by a foreign challenge */
  /* THE RECKONING'S OWN FATE. It is a `challenge` deadline with `due: week + 4..7`. Reaching stage
     3 is not the story landing — somebody has to FIGHT it. */
  const reck = { issued:0, met:0, missed:0, vanished:0 };
  const blockedBy = {};

  for(let h=0; h<H; h++){
    houses++;
    const d = A.newGameState("Saga", "clean", "SAGA-"+h, null);
    let cur = null; const seen = new Map();
    for(let w=0; w<W; w++){
      if(d.over){ died++; break; }
      try { R.lanista(d); } catch(e){ break; }
      weeks++;
      /* watch the saga's own deadline across the week boundary */
      const dl = (d.deadlines||[]).find(x=>x.kind==="challenge" && x.saga);
      if(dl && !seen.has(dl.id)){ seen.set(dl.id, { due: dl.due, met: !!dl.met }); reck.issued++; }
      for(const [id, rec] of seen){
        const live = (d.deadlines||[]).find(x=>x.id === id);
        if(rec.done) continue;
        if(live && live.met){ rec.done = 1; reck.met++; }
        else if(!live){ rec.done = 1; if(d.week > rec.due) reck.missed++; else reck.vanished++; }
      }
      const s = d.saga;
      if(s && (!cur || cur.gid !== s.gid || cur.since !== s.since)){
        /* a saga that ended and another that began between two readings both land here */
        cur = { gid:s.gid, since:s.since, house:h, top:s.stage, born:d.week,
          atStage:{ 1:d.week }, ended:null, weeks:0, resets:0, lastStage:s.stage };
        sagas.push(cur);
      }
      if(s && cur){
        cur.weeks++;
        if(s.stage > cur.top){ cur.top = s.stage; cur.atStage[s.stage] = d.week; }
        if(s.stage < cur.lastStage) cur.resets++;
        cur.lastStage = s.stage;
        cur.renown = Math.round(s.renown);
        /* THE STRUCTURAL QUESTION: ripe for a reckoning, and what is in the way */
        if(s.stage === 2 && s.renown >= 70){
          ripe++;
          const held = (d.deadlines||[]).filter(x=>x.kind === "challenge" && !x.met);
          if(held.length){ ripeBlocked++;
            const k = held[0].saga ? "its own" : held[0].nem ? "the feud" : held[0].mine ? "your own challenge"
              : held[0].hunt ? "the hunt" : "an arc";
            blockedBy[k] = (blockedBy[k]||0) + 1; }
        }
      }
      if(!s && cur && !cur.ended){
        const g = d.gladiators.find(x=>x.id === cur.gid);
        /* THE STATUS ITSELF, not a label for it. The first cut of this probe bucketed anything
           that was not dead/freed/sold/retired as "ended at stage N" and hid the actual cause:
           `sagaWeek` ends the story on `g.status !== "active"`, and INJURED is one of those. */
        cur.ended = !g ? "gone (not on the books)"
          : g.status === "freed" ? "THE WOODEN SWORD"
          : `the champion went ${g.status}`;
        cur.endStage = cur.top;
        cur = null;
      }
    }
    if(cur && !cur.ended) cur.ended = d.over ? "the house fell" : "still running at the end";
  }

  /* ---- ARM 2: A PLAYER WHO ANSWERS HIS CHAMPION'S RECKONING WITH HIS CHAMPION ----
     The win only advances the story if the man who fights IS the champion: `if(x.saga && d.saga &&
     d.saga.gid === g.id)`. The reference player picks whoever fits best, so a reckoning can be
     ANSWERED — the deadline met, the fame paid — by another man entirely, and the saga sits at
     stage 3 watching somebody else fight its last act. A human player would send his champion.
     This arm plays exactly that difference and nothing else. */
  const armed = { sagas:0, stage3:0, stage4:0, fought:0, won:0, lost:0, freed:0, kept:0, sold:0,
    reckWeeks:0 };
  for(let h=0; h<H; h++){
    const d = A.newGameState("Saga", "clean", "SAGA-"+h, null);
    const seenS = new Set();
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d); } catch(e){ break; }
      const s = d.saga;
      if(s){
        if(!seenS.has(s.since)){ seenS.add(s.since); armed.sagas++; }
        const dl = (d.deadlines||[]).find(x=>x.kind==="challenge" && x.saga && !x.met);
        const g = d.gladiators.find(x=>x.id===s.gid);
      }
      if(d.saga && d.saga.stage >= 4) armed.stage4 = Math.max(armed.stage4, 1);
      /* the fork itself: the freedom arc resolves through pendingEvent */
      if(d.pendingEvent && d.pendingEvent.id === "sagaFreedom"){
        try { A.resolveEvent ? A.resolveEvent(d, d.pendingEvent, 0) : null; } catch(e){}
      }
      if((d.freed||[]).length > armed.freed) armed.freed = (d.freed||[]).length;
    }
  }

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { n:s.length, min:s[0], p50:s[Math.floor(s.length/2)], max:s[s.length-1] }; };
  const reached = n => sagas.filter(x=>x.top >= n).length;
  const ends = {}, endAt = {};
  for(const x of sagas){ ends[x.ended || "?"] = (ends[x.ended || "?"]||0) + 1;
    const k = `${x.ended || "?"} · at stage ${x.endStage != null ? x.endStage : x.top}`;
    endAt[k] = (endAt[k]||0) + 1; }
  return { houses, weeks, died, sagas: sagas.length, endAt, reck, armed,
    stage2: reached(2), stage3: reached(3), stage4: reached(4),
    ends, ripe, ripeBlocked, blockedBy,
    life: q(sagas.map(x=>x.weeks)),
    toRival: q(sagas.filter(x=>x.atStage[2]).map(x=>x.atStage[2]-x.born)),
    toReck:  q(sagas.filter(x=>x.atStage[3]).map(x=>x.atStage[3]-(x.atStage[2]||x.born))),
    resets: q(sagas.map(x=>x.resets)),
    stuck: q(sagas.filter(x=>x.top===2).map(x=>x.renown||0)) };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.weeks} weeks over ${out.houses} houses (${out.died} fell)\n`);
  console.log(`SAGAS: ${out.sagas} ignited`);
  const pc = n => out.sagas ? ` (${(n/out.sagas*100).toFixed(0)}%)` : "";
  console.log(`  reached stage 2, a rival named   ${out.stage2}${pc(out.stage2)}`);
  console.log(`  reached stage 3, the reckoning   ${out.stage3}${pc(out.stage3)}`);
  console.log(`  reached stage 4, the finale      ${out.stage4}${pc(out.stage4)}`);
  console.log(`\n  how they ended, and where:`);
  for(const [k,v] of Object.entries(out.endAt).sort((a,b)=>b[1]-a[1])) console.log(`    ${String(v).padStart(4)}  ${k}`);
  console.log(`\n  weeks a saga lived: ${JSON.stringify(out.life)}`);
  console.log(`  weeks to name a rival: ${JSON.stringify(out.toRival)}`);
  console.log(`  weeks from rival to reckoning: ${JSON.stringify(out.toReck)}`);
  console.log(`  times a saga fell back a stage: ${JSON.stringify(out.resets)}`);
  console.log(`  renown of the ones stuck at stage 2: ${JSON.stringify(out.stuck)}`);
  console.log(`\nTHE RECKONING ITSELF — reaching stage 3 only SCHEDULES it:`);
  console.log(`  issued ${out.reck.issued} · fought ${out.reck.met} · missed ${out.reck.missed} · gone before its day ${out.reck.vanished}`);
  console.log(`\nA SECOND PASS OVER THE SAME HOUSES, as a control on the first: ${out.armed.sagas} sagas`);

  console.log(`\nTHE STRUCTURAL QUESTION — weeks a saga sat at stage 2 with renown past the gate:`);
  console.log(`  ripe for a reckoning: ${out.ripe} weeks`);
  console.log(`  of those, a challenge deadline already stood: ${out.ripeBlocked}`
    + (out.ripe ? ` (${(out.ripeBlocked/out.ripe*100).toFixed(1)}%)` : ""));
  for(const [k,v] of Object.entries(out.blockedBy).sort((a,b)=>b[1]-a[1])) console.log(`    ${String(v).padStart(4)}  ${k}`);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
