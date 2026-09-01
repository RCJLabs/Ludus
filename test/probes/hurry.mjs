/* #210 — WHAT THE FAST-FORWARD CARRIES YOU PAST

   `skipWeeks` runs `endWeek` up to `want` times and breaks on a pending event, an ending, a
   succession, an offer from Rome, a doctore, a re-signing, or a card this week. It does NOT break
   on a DEADLINE coming due — and deadlines are the only things in this game that must be done by a
   particular week, raised by the agenda at urgency 3.

     node test/probes/hurry.mjs 16 320

   WHAT A MISSED ONE COSTS, from the source:
     booking    twice the advance back, −22 fame, every patron −9
     challenge  −14 fame, mob −5, the rival's grudge −12, EVERY man −6 morale, and the arc
                it belongs to is knocked back — `nemHouse.stage = 2`, or `saga.stage = 2`
     levy       auto-paid if the box can stand it; if not, −16 fame and every patron −12

   THE CHALLENGE IS THE ONE THAT MATTERS, and it may be load-bearing for a second audit item. A
   saga's reckoning IS a challenge deadline. #222 measured the saga reaching "his reckoning is set"
   five times in sixteen houses and its finale ZERO times. If the fast-forward walks past a named
   day, the story resets to stage 2 — and a story that resets every time it is nearly told is a
   story that never lands. This probe asks whether that path is real and how wide it is.

   THE ANSWER IS NO, AND IT TOOK THREE CUTS OF THIS FILE TO GET THERE.

     cut 1 called `skipWeeks(c, near + 2)` — a want no player can choose — and reported 25 clean
            overruns out of 400, 10 of them knocking a feud back. It was measuring the probe.
     cut 2 pressed `weeksToSomething(d, 6)` instead, the value the only caller passes, and reported
            203 overruns of 965 with 189 real misses. Better, and still wrong: it never asked
            whether the button was ON THE SCREEN.
     cut 3 asks that too, and the answer is flat. `weekWeight` adds 2 to the load for any deadline
            due within two weeks and the fast-forward is offered only on a `quiet` week, which
            requires a load of ZERO. Measured 12 x 300: a deadline stands on 44% of weeks; on the
            weeks where one stood AND the button was on screen, the offer stopped short 28 times
            out of 28 and NOT ONE deadline was missed.

   So the missing break in `skipWeeks` is real and unreachable — three things stand in front of it,
   and the `hurry` check now holds all three. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 320);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["skipWeeks","deadlines","newGameState","weeksToSomething","weekWeight"].filter(k=>A[k]==null);
  if(miss.length) return { miss };
  const clone = d => { try { return structuredClone(d); } catch(e){ return JSON.parse(JSON.stringify(d)); } };

  const sum = { houses:H, weeks:0, withDeadline:0, byKind:{}, nearest:[],
    buttonEver:0, buttonShown:0, trials:0, offered:[], offerOverruns:0, offerStops:0, overrunBy:[], actuallyMissed:0,
    sagaHit:0, nemHit:0 };

  for(let h=0; h<H; h++){
    const d = A.newGameState("HURRY-"+h);
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d); } catch(e){ break; }
      sum.weeks++;
      const WW = A.weekWeight(d);
      const blk = !!d.pendingEvent || !!d.doctoreOffer || !!d.romeOffer || !!d.reSignOffer || !!d.over;
      if(WW.kind === "quiet" && !blk) sum.buttonEver++;
      const dl = A.deadlines(d).filter(x=>!x.met && x.due >= d.week);
      if(dl.length){
        sum.withDeadline++;
        for(const x of dl) sum.byKind[x.kind] = (sum.byKind[x.kind]||0)+1;
        const near = Math.min(...dl.map(x=>x.due - d.week));
        sum.nearest.push(near);

        /* ---- ARM 1, ON THE PATH A PLAYER ACTUALLY HAS ----
           The first cut called `skipWeeks(c, near + 2)` — a want no player can choose. The ONLY
           caller is `runOn`, and it passes `weeksToSomething(d, 6)`, which already looks ahead for
           deadlines and shortens the offer. Asking the raw function to overrun and reporting that
           it overran measures the probe, not the game. What the player can do is press the button
           the header offers, so that is what is pressed here. */
        /* ---- AND THE BUTTON IS NOT ALWAYS THERE, which the second cut of this probe also missed.
           `runOn` is reachable only when `weekWeight(d).kind === "quiet"` and nothing is blocked,
           and `weekWeight` adds 2 to the load for any deadline due within 2 weeks while `quiet`
           requires a load of ZERO. So on the weeks that matter most the fast-forward is not on the
           screen at all. Counting `weeksToSomething` on weeks where the player has no button is
           measuring a third path the game does not expose. */
        const W = A.weekWeight(d);
        const blocked = !!d.pendingEvent || !!d.doctoreOffer || !!d.romeOffer || !!d.reSignOffer || !!d.over;
        const shown = W.kind === "quiet" && !blocked;
        if(shown) sum.buttonShown++;
        if(shown && near >= 0 && near <= 8){
          sum.trials++;
          const offered = A.weeksToSomething(d, 6);
          sum.offered.push(offered);
          /* would the offer itself carry him past the due week? */
          if(offered > near){
            sum.offerOverruns++;
            sum.overrunBy.push(offered - near);
            const c = clone(d);
            const before = { saga: c.saga ? c.saga.stage : null, nem: c.nemHouse ? c.nemHouse.stage : null,
              dl: A.deadlines(c).filter(x=>!x.met).length };
            let res = null; try { res = A.skipWeeks(c, offered); } catch(e){ res = null; }
            if(res){
              const gone = A.deadlines(c).filter(x=>!x.met).length;
              if(c.week > d.week + near && gone < before.dl){
                sum.actuallyMissed++;
                const after = { saga: c.saga ? c.saga.stage : null, nem: c.nemHouse ? c.nemHouse.stage : null };
                if(before.saga != null && after.saga != null && after.saga < before.saga) sum.sagaHit++;
                if(before.nem  != null && after.nem  != null && after.nem  < before.nem ) sum.nemHit++;
              }
            }
          } else sum.offerStops++;
        }
      }
    }
  }
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { p50:s[Math.floor(.5*s.length)], mean:+(a.reduce((n,x)=>n+x,0)/a.length).toFixed(1) }; };
  sum.nearest = q(sum.nearest); sum.offered = q(sum.offered); sum.overrunBy = q(sum.overrunBy);
  sum.deadlinePc = sum.weeks ? +(sum.withDeadline/sum.weeks*100).toFixed(1) : null;
  return sum;
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.weeks} weeks over ${out.houses} houses`);
  console.log(`  a deadline stands on ${out.withDeadline} of them — ${out.deadlinePc}%`);
  console.log(`  by kind: ${Object.entries(out.byKind).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
  console.log(`  weeks to the nearest one: ${JSON.stringify(out.nearest)}`);
  console.log(`\n  the fast-forward is on screen on ${out.buttonEver} of all weeks, and on ${out.buttonShown} that carried a deadline`);
  console.log(`\n  THE BUTTON'S OWN OFFER, on ${out.trials} of those that ALSO carried a deadline:`);
  console.log(`    weeks it offers to run      : ${JSON.stringify(out.offered)}`);
  console.log(`    the offer stops short of it : ${out.offerStops}`);
  console.log(`    the offer would overrun it  : ${out.offerOverruns} ${out.overrunBy?`(by ${JSON.stringify(out.overrunBy)})`:""}`);
  console.log(`    and a deadline was MISSED   : ${out.actuallyMissed}`);
  console.log(`      a saga knocked back       : ${out.sagaHit}`);
  console.log(`      a feud knocked back       : ${out.nemHit}`);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
