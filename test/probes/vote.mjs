/* THE AEDILE'S ELECTION HAS A THREE-WEEK CLOCK AND A GUARD THAT STOPS IT

   `fresh.mjs` reads the agenda row "The aedileship is open" with a longest run of NINETEEN
   consecutive weeks. Its own note is `Math.max(0, 3 - (d.week - d.election.week))` weeks to the
   vote, and the vote is resolved by

       function electionWeek(d){
         if(d.rome || d.over) return;                                   <-- here
         const wk = ((d.week-1) % YEAR_WEEKS) + 1;
         if(wk === ELECTION_WEEK && (!d.election || d.election.done)) callElection(d);
         else if(d.election && !d.election.done && d.week - d.election.week >= 3) resolveElection(d);
       }

   so a house that is AT ROME when the three weeks run out has no vote until it comes home, and
   the row sits on the villa saying "0 weeks to the vote" for the whole trip.

   This counts it: every week an election is open past its due date, the length of each stall,
   what caused it, and how many aedile-years a house loses to one. `d.rome` is read straight off
   the state rather than inferred from a refusal count.

   FALSIFIER, written before the run: if `d.rome` is only ever set for two weeks or fewer, the
   guard costs nothing and this is a guard doing its job. The trip is `ROME_WEEKS_PER_BOUT` x
   `ROME_BOUTS` plus travel, so the prediction is the other way, but the probe measures it rather
   than reading it off the constants. It measured 15 weeks, in all four seeds, to the week.

   ---- AND WHAT IT SHOULD SAY NOW THE FAULT IS GONE (v3.117.0) ----
   `quiet.mjs` had to be turned round after its fix landed, because a probe written to measure a
   fault reads as an accusation for ever unless somebody decides, at the time, what it means once
   the number is zero. So: the guard is `d.over` alone from v3.117.0 and these are the readings a
   HEALTHY build gives — anything else is a regression, not a finding.

       weeks open PAST the three     0.0-0.2% of open weeks
       of those, at Rome             0
       of those, the house ended     all of them; a house that has ended holds no vote, which is
                                     the half of the guard that stayed
       stalls                        0-1 per 150 elections, never longer than 1 week
       longest single trip to Rome   15 weeks, unchanged — the trip did not get shorter, the
                                     ballot stopped waiting for it

   The one number this probe CANNOT see is the one the `aedile` check found: `Math.max(0, 3 - …)`
   read "0 weeks to the vote" on the last week of every election ever held, at home as much as at
   Rome, because the vote lands at the end of that week. `zeroNote` below only counts weeks an
   election ran PAST its due date, so a legitimate final week never entered it. A probe scoped to
   an item is scoped to the item.
*/
import { serve, open, found, clearAll, installRope, inside } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "VOTE";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const T = { houses:0, weeks:0, elections:0, resolved:0, openWeeks:0, lateWeeks:0,
              stalls:[], causeRome:0, causeOver:0, causeOther:0, romeWeeks:0, maxRomeRun:0,
              zeroNote:0, aedileWeeks:0, noAedileWeeks:0, housesStalled:0, lateAtResolve:[] };
  for(let h=0; h<H; h++){
    const d = A.newGameState("Vote","clean",SEED+"-"+h, null); T.houses++;
    let stall = 0, sawStall = false, romeRun = 0;
    let lastElectionWeek = null, wasOpen = false;
    for(let w=0; w<W && !d.over; w++){
      R.lanista(d);
      T.weeks++;
      if(d.rome){ T.romeWeeks++; romeRun++; if(romeRun > T.maxRomeRun) T.maxRomeRun = romeRun; }
      else romeRun = 0;
      const a = d.aedile && d.week < d.aedile.until;
      if(a) T.aedileWeeks++; else T.noAedileWeeks++;
      const E = d.election;
      const openNow = !!(E && !E.done);
      if(openNow){
        T.openWeeks++;
        if(E.week !== lastElectionWeek){ T.elections++; lastElectionWeek = E.week; }
        const late = d.week - E.week - 3;
        if(late > 0){
          T.lateWeeks++; stall++;
          if(Math.max(0, 3 - (d.week - E.week)) === 0) T.zeroNote++;
          if(d.rome) T.causeRome++; else if(d.over) T.causeOver++; else T.causeOther++;
        }
      }
      if(wasOpen && !openNow){
        if(stall > 0){ T.stalls.push(stall); if(!sawStall){ sawStall = true; T.housesStalled++; } }
        stall = 0;
      }
      wasOpen = openNow;
    }
    if(stall > 0){ T.stalls.push(stall); if(!sawStall) T.housesStalled++; }
  }
  return { T, rope:R.say() };
}, [H, W, SEED]);

await browser.close(); server.close();
const T = out.T;
const st = T.stalls.slice().sort((a,b)=>a-b);
const q = f => st.length ? st[Math.min(st.length-1, Math.floor(st.length*f))] : 0;
const pct = (a,b) => b ? (a/b*100).toFixed(1) : "0.0";
console.log(`=== THE VOTE THAT DOES NOT HAPPEN — ${T.houses} houses, ${T.weeks} house-weeks`);
console.log(`  weeks at Rome                     ${T.romeWeeks} (${pct(T.romeWeeks,T.weeks)}%) · longest single trip ${T.maxRomeRun} weeks`);
console.log(`  elections called                  ${T.elections}`);
console.log(`  weeks with an election open       ${T.openWeeks}   (three per election is the design: ${T.elections*3} expected)`);
console.log(`  weeks open PAST the three         ${T.lateWeeks}  (${pct(T.lateWeeks,T.openWeeks)}% of open weeks)`);
console.log(`    of those, the house was at Rome ${T.causeRome} · ended ${T.causeOver} · neither ${T.causeOther}`);
console.log(`  weeks the row reads "0 weeks to the vote"  ${T.zeroNote}`);
console.log(`  stalls: ${st.length} of ${T.elections} elections · ${T.housesStalled} of ${T.houses} houses saw one`);
console.log(`          median ${q(0.5)}w · p90 ${q(0.9)}w · longest ${st.length?st[st.length-1]:0}w`);
console.log(`  weeks with a sitting aedile       ${T.aedileWeeks} (${pct(T.aedileWeeks,T.weeks)}%) · without ${T.noAedileWeeks}`);
console.log(`\n  rope: ${out.rope}`);
