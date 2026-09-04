/* THE ONLY CONVERSATION IN THE GAME, AND IT HAPPENS ONCE A MAN

   `askWeek` is the one place a gladiator speaks to the lanista on his own initiative. Five things he
   can raise — a brother, a match he lost, his year, a burial, a woman in the town — each with its
   own `need`, its own weight, and two written answers.

   The whole of the gate:

       men eligible   regardOf >= 45, at least 3 bouts, AND not already in `d.flags.asked`
       shut when      d.over, d.rome, d.city, d.travel, or an event is already up
       the roll       R() > 0.06 returns — 6% of weeks, house-wide, whatever the roster
       then           ONE man is picked at random, and the five are filtered by their own `need`
       and finally    his id goes into `d.flags.asked` and he is never asked anything again

   Measured in #239 (16 houses x 400 weeks): **33 asks in 2,672 played weeks** — one every 81 —
   reaching **7.4% of the 447 men** who ever stood in the cells, and by kind burial 12, brother 10,
   match 9, woman 1.

   But one every 81 weeks is not the same fact as the 6% roll, which caps the house at one ask every
   17 weeks and no more. Something between those two numbers is doing four fifths of the work, and
   which term it is decides the whole item — the mark, the eligibility gate, the roll, or the five
   `need`s. So this reconstructs every gate from the outside, week by week, from state the handle
   already exposes:

     1 · WHERE THE WEEKS GO — and this cannot be reconstructed from outside the week, which the
         first draft of this probe tried to do and got a CEILING BELOW THE OBSERVED RATE (3.2 against
         8) for its trouble. `askWeek` runs at line 21028, deep inside `endWeek`, after
         `deadlineWeek`, `listenWeek`, `feudWeek`, `yardWeek`, `lateWeek`, `offerPact`, `edictWeek`
         and `lawWeek` — every one of which can set `d.pendingEvent` and shut it out. So it is not
         competing with LAST week's event, as sampling the state before the week implies; it is
         competing with everything that got there first THIS week, and only the game knows what that
         was. It is measured instead by driving: each sampled week, `askWeek` is hammered on clones
         with the week opened, which gives P(ask | the week is open) exactly — pool, `need`s, roll
         and all. The gap between that and the observed rate is what being shut out costs.

     2 · WHAT THE MARK COSTS. The same hammering on a clone whose `d.flags.asked` has been emptied,
         so the one-per-man rule's own contribution is separated from the regard-and-bouts gate
         underneath it and from the roll above it.

     3 · WHO EVER QUALIFIES AT ALL, and how long he waits. A man needs regard 45 and three bouts; if
         most men never reach that, the one-per-man rule is not the binding term and the item is
         about the floor rather than the ceiling.

     4 · AND WHETHER ALL FIVE ARE REACHABLE. `woman` fired once in 2,672 weeks and is both the
         lowest-weighted and the strictest-gated. A conversation nobody has is not a conversation.

   WHAT IT ANSWERED — two seeds x 16 houses x 420 weeks, 5,302 played weeks. **Four hypotheses went
   in and all four came out refuted.** The system is thin, and it is thin for reasons that are the
   game's design rather than a defect in it.

     THE RATE. It fires once every 70-72 weeks (1.39-1.44% of weeks) and reaches 8.6-8.8% of the
     430-odd men who ever stand in the cells. P(an ask fires | the week is OPEN) is 1.98-2.11%,
     against the 6% roll that caps it.

     AND THE LIMIT IS THREE ROUGHLY EQUAL THIRDS, not one thing:
       the pool          mean 1.09-1.31 men qualify at all (regard 45, three bouts), and only
                         65-68% of them have any of the five that FITS
       the mark          costs 0.76-0.88 points, 27.7-29.5% of the openings
       being shut out    costs 30.2-32.1% — askWeek sits at line 21028, behind eight other systems
                         that can raise the week's event first
     REFUTED #1: "the one-ask-per-man rule is the constraint." It is under a third of it. (A 4-house
     smoke said the mark cost NOTHING, -0.01 points; that was small-sample noise, and the scale run
     is what settled it.)

     REFUTED #2, and it is the interesting one: `year` has fired ZERO times in 5,302 weeks. The
     suspicion was the mark — that a man with a career long enough to earn the wooden sword has
     already been spent on one of the four asks that want much less of him. Measured at the moment
     each man first satisfied `year`'s need: **10 of 15 were still free.** Not the mark.

     REFUTED #3: "the rudis bar is unreachable, so `year` is downstream of #238." The source's own
     figure is that `rudisEligible` is crossed by 14.1% of every man who draws breath. Not the bar.

     REFUTED #4: "the contention is a defect." Every weekly event-raiser guards on `d.pendingEvent`
     properly — `edictWeek` even pays a consolation (+6 heat) when it is shut out. It is a priority
     order, and the ask is last in it by design.

     SO WHY `year` NEVER FIRES, plainly: only 15 men in 2,655 weeks ever satisfy its need at all —
     about one per campaign — each has a narrow window, and inside that window he must also be the
     one man `pick` lands on during a 6% week AND win a weighted draw in which he weighs 8 against a
     brother's 10, a match's 9 and a burial's 7, all of which also fit a veteran. Zero is arithmetic,
     not a bug. The one design observation left standing, and NOT acted on here: the draw does not
     prefer the RARER conversation, so the rarest state a man can be in is usually spent on the
     commonest thing he could be asked.

   Run: node test/probes/ask.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "ASK";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const kinds = {}, waits = [];
  let weeks = 0, men = 0, everElig = 0, everAsked = 0, marked = 0, sampled = 0;
  let pOpen = 0, pFree = 0, poolSum = 0, poolFreeSum = 0, fitSum = 0, fitN = 0;
  /* ---- AND WHY `year` NEVER FIRES ----
     It is the only ask that wants a LONG career: `rudisEligible` (ten wins, 180 renown) plus regard
     60. `rudisEligible` is crossed by 14.1% of men, so the bar is not the blocker. The suspicion is
     the MARK: a man who has been in the cells long enough to earn the wooden sword has almost
     certainly been picked already, for one of the four asks that want much less of him. This counts,
     for every man at the moment he first satisfies `year`'s own need, whether he was already spent. */
  const yr = { reached:0, spent:0, free:0, asWhat:{} };
  const HAMMER = 80;

  /* P(an ask fires | the week is open), by driving askWeek on clones. This is the only honest way
     to read it: the gate lives behind a dozen other systems that may already have raised an event
     by the time it is reached, and none of that is visible from outside the week. */
  const chance = (d, clearMark) => {
    let hit = 0;
    for(let i=0;i<HAMMER;i++){
      const c = A.clone(d);
      c.pendingEvent = null; c.rome = null; c.city = null; c.travel = null;
      if(clearMark) c.flags.asked = [];
      const before = (c.flags.asked||[]).length;
      try { A.askWeek(c); } catch(e){}
      if((c.flags.asked||[]).length > before) hit++;
    }
    return hit / HAMMER;
  };

  for(let h=0; h<H; h++){
    const d = A.newGameState("Ak"+h, "clean", `${SEED}-${h}`);
    const seenMen = new Set(), eligAt = new Map(), askedHere = new Set(), yrSeen = new Set();
    let lastAsked = 0;
    for(let w=0; w<W && !d.over; w++){
      weeks++;
      const before = (d.flags.asked||[]).length;
      try { R.lanista(d, {}); } catch(e){ break; }
      const after = (d.flags.asked||[]).length;
      if(after > before){ marked += after - before; waits.push(d.week - lastAsked); lastAsked = d.week;
        const ev = d.pendingEvent, k = ev && ev.data && ev.data.k;
        if(k) kinds[k] = (kinds[k]||0)+1; }

      /* sample the chance every fifth week — the hammer is 80 clones and this is the expensive part */
      if(w % 5 === 0){
        sampled++;
        pOpen += chance(d, false);
        pFree += chance(d, true);
        const qual = A.activeG(d).filter(g=>A.regardOf(g) >= 45 && ((g.wins||0)+(g.losses||0)) >= 3);
        const free = qual.filter(g=>!(d.flags.asked||[]).includes(g.id));
        poolSum += qual.length; poolFreeSum += free.length;
        if(free.length){ let f = 0;
          for(const g of free) if(A.ASK_KEYS.some(k=>{ try { return A.ASKS[k].need(d, g); } catch(e){ return false; } })) f++;
          fitSum += f / free.length; fitN++; }
      }

      for(const g of A.activeG(d)){
        if(!seenMen.has(g.id)){ seenMen.add(g.id); men++; }
        if(!yrSeen.has(g.id)){
          let ok = false; try { ok = A.ASKS.year.need(d, g); } catch(e){}
          if(ok){ yrSeen.add(g.id); yr.reached++;
            if((d.flags.asked||[]).includes(g.id)) yr.spent++; else yr.free++; }
        }
        if(!eligAt.has(g.id) && A.regardOf(g) >= 45 && ((g.wins||0)+(g.losses||0)) >= 3){
          eligAt.set(g.id, d.week); everElig++; }
      }
      for(const id of (d.flags.asked||[])) if(!askedHere.has(id)){ askedHere.add(id); everAsked++; }
    }
  }
  return { weeks, men, everElig, everAsked, marked, waits, kinds, sampled, yr,
    pOpen: pOpen/Math.max(1,sampled), pFree: pFree/Math.max(1,sampled),
    pool: poolSum/Math.max(1,sampled), poolFree: poolFreeSum/Math.max(1,sampled),
    fit: fitSum/Math.max(1,fitN), hammer: HAMMER,
    keys: A.ASK_KEYS, weights: Object.fromEntries(A.ASK_KEYS.map(k=>[k, A.ASKS[k].w])) };
}, [H, W, SEED]);

const pc = (a,b) => b ? `${(100*a/b).toFixed(1)}%` : "-";
const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length?v[Math.floor(v.length/2)]:0; };

console.log(`\n=== 1. WHAT ACTUALLY LIMITS IT (${out.weeks} played weeks, ${out.sampled} sampled x ${out.hammer} clones) ===`);
console.log(`  it fired ${out.marked} times — one every ${Math.round(out.weeks/Math.max(1,out.marked))} weeks (${(100*out.marked/out.weeks).toFixed(2)}% of weeks)`);
console.log(`  P(an ask fires | the week is OPEN):        ${(100*out.pOpen).toFixed(2)}%  — against the 6% roll that caps it`);
console.log(`  so if every week were open it would fire   ${Math.round(out.pOpen*out.weeks)} times, one every ${Math.round(1/Math.max(1e-9,out.pOpen))}`);
console.log(`  being shut out therefore costs             ${Math.round(out.pOpen*out.weeks) - out.marked} of them (${pc(Math.round(out.pOpen*out.weeks)-out.marked, Math.round(out.pOpen*out.weeks))})`);
console.log(`    — askWeek sits at line 21028 of endWeek, behind deadlineWeek, listenWeek, feudWeek,`);
console.log(`      yardWeek, lateWeek, offerPact, edictWeek and lawWeek, any of which raises the event first`);

console.log(`\n=== 2. WHAT THE ONE-PER-MAN MARK COSTS ===`);
console.log(`  P(fires | open), mark as it is:            ${(100*out.pOpen).toFixed(2)}%`);
console.log(`  P(fires | open), mark cleared:             ${(100*out.pFree).toFixed(2)}%`);
console.log(`  the mark's own cost:                       ${(100*(out.pFree-out.pOpen)).toFixed(2)} points (${pc(out.pFree-out.pOpen, out.pFree)} of the openings)`);
console.log(`  mean men qualifying ${out.pool.toFixed(2)} · still unasked ${out.poolFree.toFixed(2)} · share of the pool with any ask that fits ${pc(out.fit,1)}`);

console.log(`\n=== 3. WHO EVER QUALIFIES ===`);
console.log(`  ${out.men} men ever in the cells · ${out.everElig} reached regard 45 and three bouts (${pc(out.everElig,out.men)})`);
console.log(`  ${out.everAsked} were ever asked anything (${pc(out.everAsked,out.men)} of all men, ${pc(out.everAsked,out.everElig)} of those who qualified)`);
console.log(`  weeks between one ask and the next: p50 ${med(out.waits)} · max ${Math.max(0,...out.waits)}`);

console.log(`\n=== 4. AND ARE ALL FIVE REACHABLE? ===`);
const Y = out.yr;
console.log(`  \`year\` wants the wooden sword earned (10 wins, 180 renown) AND regard 60.`);
console.log(`  ${Y.reached} men ever satisfied that need at all. At the moment they first did:`);
console.log(`    already spent — asked something else, and marked forever:  ${Y.spent}  ${pc(Y.spent,Y.reached)}`);
console.log(`    still free to be asked:                                   ${Y.free}  ${pc(Y.free,Y.reached)}`);
for(const k of out.keys)
  console.log(`  ${k.padEnd(9)} w:${String(out.weights[k]).padStart(2)}  fired ${String(out.kinds[k]||0).padStart(3)}  ${pc(out.kinds[k]||0, out.marked)}`);
console.log("");

await browser.close(); server.close();
