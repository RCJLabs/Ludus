/* THE MAN WHO HAS EARNED HIS FREEDOM, AND THE LINE THAT ONLY SPEAKS TO A RICH HOUSE — #279.

     node test/probes/earned.mjs 40 420

   This began as #276's recorded gap: `grantRudis` chronicles *"He stays, which he will understand
   and not forgive"* when the house cannot pay, and nothing is behind the not forgiving. Tracing the
   callers closed that item and opened a better one.

   THE FAILURE PATH HAS ONE REACHABLE CALLER AND IT NEVER FIRES. Three call `grantRudis`:
     - the man's own card (30252) gates the button on `canAffordRudis`, so it cannot reach it;
     - `stashAnswer` (6555) checks `d.gold < yours` FIRST, then puts his bag in before calling, so
       the house always holds the fee by then — and rolls back exactly if it still fails;
     - `ASKS.year.no` (16453) calls it bare — and #277 measured `ASKS.year` at **0 fires in 2,402
       played weeks**, its gate crossed on 1.2% of eligible weeks in 5 of 40 houses.
   So the unrecorded sentence is behind a door a player essentially never opens, and putting a
   `remember` call at the end of it would be writing for nobody.

   ---- WHAT IS ACTUALLY WRONG IS ONE LINE UP, IN THE AGENDA ----
   The week's panel carries this, and its own note says why it exists:

       `rudisEligible` is crossed by 14.1% of every man who ever draws breath in a house ... and
       the only thing in the game that ever said so was one line of the doctore's counsel ... So
       the ending nobody reaches was gated on NOTICING, and 146 of those 227 men died first.

   And then it guards the line:

       if(d.gold >= fee + weeklyBill(d))
         add(1, "men", `${g.name} has earned the rudis`, ...)

   **The game tells you a man has earned his freedom only if you can already afford it.** A house
   that cannot is told nothing at all — so it never learns there is something to save for, and he
   goes back on the sand. The line was added because nobody was noticing, and it is gated on the
   one thing that stops a player acting on the notice.

   This file already names that fault. Over `agendaSchool`: *"the `agendaCan` fault this project has
   already priced once, where advice goes quiet exactly when it is needed."* For a doctrine, going
   quiet while poor is right — you cannot act, and the thing will still be there. For a man, it is
   not: he is on the roster now, he is 14.1% of everyone, and he can die.

   THE COUNTERWEIGHT, so this is not read as free advice: `closed` — the ending where the gates
   stand open — wants `freed >= 5`, and the note above counts 146 of 227 earned men dying first.

   This measures how often the line is suppressed, and what becomes of the men it stayed quiet
   about. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420);
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","endWeek","activeG","rudisEligible","rudisCost","weeklyBill","agenda"]
    .filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  /* ---- TWO ARMS, AND THE FIRST ONE CANNOT DECIDE ANYTHING ----
     The reference rope carries `free:true`: it frees an eligible man because it tests
     `rudisEligible` ITSELF, not because the panel told it. Measuring the agenda against a policy
     that already knows the answer reads the policy back out of itself — #274's `tour` lever, which
     equalises by construction and could not be used to decide a per-town following either.

     So `free:true` is reported as the CONTROL — what the ceiling looks like when somebody is
     always watching — and `free:false` is the arm the line exists for: a player who acts when he
     is told and not before. If the hushing costs nothing even there, the guard is right. */
  const arm = (freeOn, tag) => {
  let weeks = 0, earnedWeeks = 0, shown = 0, hushed = 0, nearMiss = 0;
  const men = {};                 /* every man who ever crossed the bar, and what became of him */
  let houses = 0, housesWithEarned = 0;
  const OPTS = Object.assign({}, MOST, { free:freeOn });

  for(let i=0;i<H;i++){
    const d = A.newGameState("Ea","clean",`${tag}-${i}`);
    houses++;
    const mine = {};              /* gid -> { name, firstAt, toldWeeks, eligibleWeeks, fate } */
    for(let w=0; w<W; w++){
      if(d.over) break;
      weeks++;
      const earned = A.activeG(d).filter(g=>{ try { return A.rudisEligible(g); } catch(e){ return false; } });
      if(earned.length){
        earnedWeeks++;
        const g = earned.slice().sort((a,b)=>(b.pfame||0)-(a.pfame||0))[0];
        let fee = 0, bill = 0;
        try { fee = A.rudisCost(d, g); } catch(e){}
        try { bill = A.weeklyBill(d); } catch(e){}
        /* the guard exactly as `agenda` writes it */
        const say = d.gold >= fee + bill;
        if(say) shown++; else { hushed++; if(d.gold >= fee) nearMiss++; }
        for(const m of earned){
          const r = mine[m.id] || (mine[m.id] = { name:m.name, firstAt:d.week,
            eligibleWeeks:0, toldWeeks:0, fate:null });
          r.eligibleWeeks++;
          if(say) r.toldWeeks++;
        }
      }
      try { R.lanista(d, OPTS); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
    }
    /* what became of each of them */
    for(const [gid, r] of Object.entries(mine)){
      const g = (d.gladiators||[]).find(x=>String(x.id) === String(gid));
      r.fate = !g ? "gone" : g.status === "freed" ? "freed" : g.status === "dead" ? "died"
        : g.status === "active" ? "still on the sand" : g.status;
      men[`${i}:${gid}`] = r;
    }
    if(Object.keys(mine).length) housesWithEarned++;
  }

  const all = Object.values(men);
  const byFate = {};
  for(const m of all) byFate[m.fate] = (byFate[m.fate]||0) + 1;
  /* the men the house was NEVER told about — the line was suppressed every week they stood there */
  const never = all.filter(m=>m.toldWeeks === 0);
  const neverByFate = {};
  for(const m of never) neverByFate[m.fate] = (neverByFate[m.fate]||0) + 1;

  return { tag, weeks, houses, housesWithEarned, earnedWeeks, shown, hushed, nearMiss,
    total: all.length, byFate, never: never.length, neverByFate,
    medEligible: all.length ? all.map(m=>m.eligibleWeeks).sort((a,b)=>a-b)[Math.floor(all.length/2)] : 0,
    maxEligible: all.length ? Math.max(...all.map(m=>m.eligibleWeeks)) : 0 };
  };
  return { control: arm(true, "FREES"), tested: arm(false, "WAITS") };
}, [H, W, MOST]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); }
else {
  const pc = (a,b) => b ? (a/b*100).toFixed(1) : "0.0";
  const say = (r, title) => {
    console.log(`\n  ${title}`);
    console.log(`    ${r.houses} houses · ${r.weeks} played weeks · ${r.housesWithEarned} ever held such a man`);
    console.log(`    weeks with a man who has earned the rudis: ${r.earnedWeeks} (${pc(r.earnedWeeks, r.weeks)}% of weeks)`);
    console.log(`      the agenda SAID so on   ${String(r.shown).padStart(5)} (${pc(r.shown, r.earnedWeeks)}%)`);
    console.log(`      it was suppressed on    ${String(r.hushed).padStart(5)} (${pc(r.hushed, r.earnedWeeks)}%)`
      + `  · of those, ${r.nearMiss} could pay the fee and were stopped by the bill alone`);
    console.log(`    ${r.total} men crossed the bar (median ${r.medEligible}w standing there, longest ${r.maxEligible}w):`);
    for(const [k, n] of Object.entries(r.byFate).sort((a,b)=>b[1]-a[1]))
      console.log(`      ${String(k).padEnd(18)} ${String(n).padStart(4)} (${pc(n, r.total)}%)`);
    console.log(`    never told about: ${r.never} of ${r.total} (${pc(r.never, r.total)}%)`
      + (Object.keys(r.neverByFate).length
        ? ` — ${Object.entries(r.neverByFate).map(([k,n])=>`${n} ${k}`).join(", ")}` : ""));
  };
  console.log(`\n#279 — THE MAN WHO HAS EARNED HIS FREEDOM, AND THE LINE THAT ONLY SPEAKS TO A RICH HOUSE`);
  say(out.control, "CONTROL — a player who frees on sight (rope `free:true`, which tests the bar itself)");
  say(out.tested,  "THE ARM THAT DECIDES — a player who acts when he is told (`free:false`)");
  console.log("");
}

await browser.close(); server.close();
