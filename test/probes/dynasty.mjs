/* DOES A RIVAL HOUSE EVER LEAVE PLAY WHILE ANYBODY IS WATCHING? — #240's verify-first

   #240 wants a rival lanista who dies at your hand or your table to sometimes leave a SON: the
   house object survives under the same `name` key, gains a heir-identity override that `lanistaOf`
   checks before the static `LANISTAE` table, and opens hot or warm depending on how his father's
   story ended. Two engine phases, an identity-override layer, a save migration.

   The item states its own falsifier and it is the whole question:

       if either `.retired = true` site fires only a handful of times across a long played campaign,
       the mechanic is a rare, legible beat as intended and worth the two-phase engine lift. If it
       turns out to fire only in single digits across an entire multi-decade campaign, there may not
       be enough occurrences for a player to ever notice the difference.

   That is two readings of the same shape and the difference between them is not the count — it is
   whether the player is still there afterwards. So this asks four things, and the fourth is the one
   the item does not ask:

     1 · HOW OFTEN DOES A HOUSE RETIRE AT ALL, and through which of the two doors. There are exactly
         two `.retired = true` writes: `RIVAL_BEATS.end` (met>=26, years>=11, warm>=52 — the fond
         one) and `settleNemHouse(d,true)` at `nemEdge >= 1` (the broken one). Both are watched here
         by flag transition on `d.rivals`, not from inside a feud window, because `end` can fire on a
         house that was never a declared nemesis at all — which is why `probes/feud.mjs`'s existing
         tally cannot see it.

     2 · CAN THE FOND DOOR BE REACHED BEFORE THE HOUSE DIES. `end` needs ELEVEN YEARS — `yearOf(d)`,
         the campaign clock, not years of rivalry — and the survey's own figure is that the median
         dead house dies at about year 3. A gate at year 11 on a population that mostly does not
         reach year 5 is a different fact from a rare event.

     3 · WHAT ACTUALLY HAPPENS TO THE EMPTY YARD. No probe in this repo has ever touched `bayRefill`
         or `NEW_HOUSES`. `liveRivals` under `BAY_FLOOR` (3) starts a wait timer, and the refill
         installs a stranger from a pool of six. This counts the refills, the wait, and how much of
         the pool a campaign ever exhausts.

     4 · AND WOULD THE PLAYER EVER MEET THE SON. A succession at week 400 of a campaign that ends at
         week 420 is an engine phase nobody sees. So: weeks of campaign remaining after each
         retirement, and cards actually fought against the house that took the empty yard.

   WHAT IT ANSWERED — four cells over two seeds, 64 campaigns, 12,551 played weeks:

     1 · 37 RETIREMENTS, one every ~425 weeks — **0.58 per multi-decade campaign**. 32 through the
         broken door, 5 through the fond one. That is the item's own falsifier on its second arm,
         and v3.194.0 refused the heir roll and the identity-override layer on it.
     2 · the fond door is SATURATED, not rare: all three of its terms held together on 1, 68, 118
         and 8 house-weeks in the four cells — 8 of 228 pairs ever satisfied it at all — and it
         fired 5 times. It goes off very nearly every time it can.
     3 · `bayRefill` installs a stranger 0.5 times a campaign and a campaign uses 3-6 of the pool
         of six. Nothing had ever probed it.
     4 · AND THE PLAYER IS STILL THERE: a median 90 weeks of campaign after a retirement, and the
         stranger who takes the yard is fought in 10 of 16 cases. Which is why the SUCCESSION
         shipped (`closeHouse`, `h.lineage`, `h.after`) and the dynasty did not.

   AND A NOTE ON THE THIRD ARM, which is the reason `checks/probe.mjs` gained a duplicate-key rule.
   `courting` takes the target house's card whenever the bill carries it. Written first, it reported
   0 bills seen and 0 offers examined — `lanista`'s options literal named `pick` twice and JavaScript
   kept the last one, so the `protect` and `pairs` options had been inert since v3.128.0 as well. The
   instrument said so instead of publishing the null as a finding about the game. Fixed in v3.194.0;
   the arm's own counter is printed so it can never quietly go inert again.

   Run: node test/probes/dynasty.mjs [houses] [weeks] [seed] */
import fs from "node:fs";
import path from "node:path";
import { serve, open, ROOT } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "DYN";

/* READ FROM THE SOURCE, NOT THE HANDLE. None of `NEW_HOUSES`, `BAY_FLOOR`, `liveRivals` or
   `RIVAL_SEED` is on the test handle, and a verify-first measurement that has to change the game
   before it can ask its question has already put a thumb on the scale. Same trick `warm.mjs` uses
   on `RIVAL_BEATS`. */
const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const POOL = [...(src.match(/const NEW_HOUSES = \[([\s\S]*?)\n\];/)||["",""])[1]
  .matchAll(/\{ key:"([A-Za-z]+)"/g)].map(m=>m[1]);
const FLOOR = +((src.match(/const BAY_FLOOR = (\d+);/)||["","?"])[1]);
const SEEDS = [...((src.match(/const RIVAL_SEED = \[([\s\S]*?)\];/)||["",""])[1])
  .matchAll(/\["([A-Za-z]+)"/g)].map(m=>m[1]);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const arm = async (label) => { const r = await p.evaluate(([H,W,SEED,label])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const retires = [], refills = [], houses = [];
  /* THE THIRD ARM IS THE POINT NOW. `lanista` used to discard a caller's `pick`, so the first
     courting arm written here examined 0 bills and reported no effect; the harness passes it
     through as of this release and the instrument says how many times it actually chose. */
  let courtName = null;
  const court = { calls:0, hit:0, offers:0 };
  const optsFor = () => label === "control" ? {}
    : label === "overture" ? { overture:6 }
    : { overture:6, pick: pool => {
        court.calls++; court.offers += pool.length;
        const want = courtName && pool.find(x=>x.opp && x.opp.house === courtName);
        if(want){ court.hit++; return want; }
        return pool[0]; } };
  /* ---- AND THE CEILING ON `met`, WHICH IS A FACT ABOUT THE BILL AND NOT ABOUT ANY POLICY ----
     A "courting" arm was written first — a picker that took the target house's card whenever the
     bill carried it — and it courted NOBODY: `lanista` builds its own opts for `takeBout` and passes
     `pick: safePick || pairPick`, so a caller's picker is discarded. The instrument said so (0 bills
     seen) instead of publishing a null result as a finding.
     The upper bound is better than any arm anyway. Each week, before it is played, the card is read
     and every rival house named on it is counted. Fight every one of those and that is the most
     `met` a player could ever reach against that house — no policy can beat it. */
  const ceil = new Map();      /* "house@campaign" -> weeks its men were on the bill at all */
  const billed = { weeks:0, withHouse:0, offers:0 };
  let weeks = 0, feudsDeclared = 0, feudsWon = 0;
  const warmPeak = [], metPeak = [];
  /* THE GATE IS A CONJUNCTION AND THE MARGINALS DO NOT ANSWER IT. A pair can peak at warm 60 in
     year 4 and reach met 26 in year 14 and never once satisfy `end` — three separate percentages
     say nothing about whether the three ever held AT THE SAME TIME. This counts the weeks each
     term held, and the weeks all three did, per pair. */
  const gate = { warm:0, met:0, yr:0, wm:0, all:0, pairs:0, everAll:0, everWM:0, hw:0 };

  for(let h=0; h<H; h++){
    const d = A.newGameState("Dy"+h, "clean", `${SEED}-${h}`);
    const was = new Map();        /* name -> retired flag last week */
    const born = new Map();       /* name -> week it appeared in d.rivals */
    const peak = new Map();       /* name -> highest warmth seen */
    const met  = new Map();       /* name -> highest met count seen */
    for(const r of (d.rivals||[])){ was.set(r.name, !!r.retired); born.set(r.name, 0); }
    let sawFeud = null, lastEnd = 0;
    const wmSeen = new Set(), allSeen = new Set();
    const row = { h, weeks:0, ended:0, retired:0, refilled:0, over:null, yearEnd:0 };
    const mine = [];          /* this house's own retirement and refill rows, for the after-count */

    for(let w=0; w<W && !d.over; w++){
      const feudBefore = d.nemHouse ? d.nemHouse.house : null;
      if(label === "courting"){
        const live = (d.rivals||[]).filter(x=>!x.retired);
        if(!courtName || !live.some(x=>x.name === courtName))
          courtName = (live.slice().sort((x,y)=>(y.warm||0)-(x.warm||0))[0]||{}).name || null;
      }
      const card = (d.games && d.games.offers) || [];
      if(card.length){ billed.weeks++; billed.offers += card.length;
        const named = new Set();
        for(const o of card){ const hn = (o.opp && o.opp.house)
            || (o.opps && o.opps[0] && o.opps[0].house) || null;
          if(hn && (d.rivals||[]).some(r=>r.name === hn && !r.retired)) named.add(hn); }
        if(named.size) billed.withHouse++;
        for(const n of named){ const k = `${h}|${n}`; ceil.set(k, (ceil.get(k)||0)+1); } }
      try { R.lanista(d, optsFor()); } catch(e){ break; }
      weeks++; row.weeks++;
      if(d.nemHouse && d.nemHouse.house !== sawFeud){ sawFeud = d.nemHouse.house; feudsDeclared++; }
      if(!d.nemHouse && feudBefore) sawFeud = null;

      for(const r of (d.rivals||[])){
        /* a house nobody has seen before is a refill (or a freedman's founding) */
        if(!born.has(r.name)){
          born.set(r.name, d.week); was.set(r.name, !!r.retired);
          const rf = { h, week:d.week, name:r.name, freed:!!r.freedFrom, after:0, cards:0,
            opened: r.opened || null };
          refills.push(rf); mine.push(rf); row.refilled++;
        }
        const now = !!r.retired;
        if(now && !was.get(r.name)){
          /* THE DOOR IS TOLD APART BY THE STATE AT THE MOMENT IT SHUT. `settleNemHouse`'s decisive
             branch is the only write that also bumps `d.flags.nemWon`, so the counter moving in the
             same week names the broken door; anything else came through `RIVAL_BEATS.end`. */
          const m = (d.metHouse||{})[r.name] || {};
          const nemNow = (d.flags && d.flags.nemWon) || 0;
          const rt = { h, week:d.week, year:Math.floor((d.week-1)/18)+1, name:r.name,
            door: nemNow > lastEnd ? "broken" : "fond",
            met: m.met||0, warm: Math.round(peak.get(r.name)||0), men: (r.fighters||[]).length,
            seen: (m.seen||[]).length, after:0, age: d.week - (born.get(r.name)||0) };
          retires.push(rt); mine.push(rt);
          lastEnd = nemNow;
          row.retired++;
        }
        was.set(r.name, now);
        const v = Math.max(0, Math.min(100, r.warm||0));
        peak.set(r.name, Math.max(peak.get(r.name)||0, v));
        const mm = ((d.metHouse||{})[r.name]||{}).met || 0;
        met.set(r.name, Math.max(met.get(r.name)||0, mm));
        if(!r.retired){
          gate.hw++;
          const okW = v >= 52, okM = mm >= 26, okY = Math.floor((d.week-1)/18)+1 >= 11;
          if(okW) gate.warm++;
          if(okM) gate.met++;
          if(okY) gate.yr++;
          if(okW && okM){ gate.wm++; if(!wmSeen.has(r.name)){ wmSeen.add(r.name); gate.everWM++; } }
          if(okW && okM && okY){ gate.all++; if(!allSeen.has(r.name)){ allSeen.add(r.name); gate.everAll++; } }
        }
      }
      lastEnd = (d.flags && d.flags.nemWon) || 0;
    }
    /* WEEKS THE CAMPAIGN ACTUALLY RAN AFTERWARDS, not weeks of the budget left. 14 of 16 houses in
       the first run of this probe DIED before the budget did, and the first draft reported "282
       weeks left after a retirement" on campaigns that were already over. The house's own last
       week is the only honest denominator. */
    for(const x of mine) x.after = Math.max(0, d.week - x.week);
    /* and the cards the player fought against the house that took the yard */
    for(const x of mine){ const b = d.book && d.book.house && d.book.house[x.name];
      x.cards = b ? (b.n||0) : 0; }
    feudsWon += (d.flags && d.flags.nemWon) || 0;
    row.over = d.over ? (d.overWhy || d.ending || "over") : null;
    row.yearEnd = Math.floor((d.week-1)/18)+1;
    gate.pairs += peak.size;
    for(const [,v] of peak) warmPeak.push(v);
    for(const [,v] of met) metPeak.push(v);
    houses.push(row);
  }

  return { retires, refills, houses, weeks, feudsDeclared, feudsWon, warmPeak, metPeak, gate,
    billed, ceiling: [...ceil.values()], court };
}, [H, W, `${SEED}-${label}`, label]);
  r.label = label; r.pool = POOL; r.floor = FLOOR; r.seedNames = SEEDS; return r; };

/* TWO ARMS, because the reference player's indifference is a POLICY and not a fact about the game.
   `RIVAL_BEATS.end` — the fond door — is gated on warm>=52, and #198's own finding (probes/warm.mjs)
   was that nothing the player could DO moved warmth at all. `OVERTURES` shipped as the answer to
   exactly that, and the rope has a lever for it. A control arm alone would measure a lanista who
   never tries to make a friend, and then blame the game for his not having one. */
const arms = [ await arm("control"), await arm("overture"), await arm("courting") ];

const q = (a, f) => { const v = [...a].sort((x,y)=>x-y);
  return v.length ? Math.round(v[Math.min(v.length-1, Math.floor(v.length*f))]*10)/10 : 0; };
const pc = (a,b) => b ? `${(100*a/b).toFixed(1)}%` : "-";

for(const out of arms){
console.log(`\n########  ARM: ${out.label}  ########`);
console.log(`\n=== 1. HOW OFTEN DOES A RIVAL HOUSE LEAVE PLAY? (${out.houses.length} houses, ${out.weeks} played weeks) ===`);
const fond = out.retires.filter(x=>x.door==="fond"), broke = out.retires.filter(x=>x.door==="broken");
console.log(`  ${out.retires.length} retirements in ${out.weeks} weeks — one every ${out.retires.length?Math.round(out.weeks/out.retires.length):"∞"} weeks`);
console.log(`    the FOND door (RIVAL_BEATS.end):        ${fond.length}`);
console.log(`    the BROKEN door (settleNemHouse win):   ${broke.length}`);
console.log(`  houses that ever saw one: ${out.houses.filter(x=>x.retired>0).length} of ${out.houses.length}`);
console.log(`  ${out.feudsDeclared} feuds declared · ${out.feudsWon} won outright`);
if(out.retires.length) console.log(`  at week: ${out.retires.map(x=>`w${x.week}(y${x.year},${x.door[0]})`).join(" · ")}`);

console.log(`\n=== 2. CAN THE FOND DOOR BE REACHED BEFORE THE HOUSE DIES? ===`);
console.log(`  RIVAL_BEATS.end wants met>=26, years>=11, warm>=52`);
console.log(`  warmth PEAK per house-pair: p50 ${q(out.warmPeak,0.5)} · p90 ${q(out.warmPeak,0.9)} · max ${Math.round(Math.max(0,...out.warmPeak))}`);
console.log(`    reached 52 at all: ${out.warmPeak.filter(v=>v>=52).length} of ${out.warmPeak.length} pairs (${pc(out.warmPeak.filter(v=>v>=52).length, out.warmPeak.length)})`);
console.log(`  cards against ONE house:    p50 ${q(out.metPeak,0.5)} · p90 ${q(out.metPeak,0.9)} · max ${Math.max(0,...out.metPeak)}`);
console.log(`    reached 26 at all: ${out.metPeak.filter(v=>v>=26).length} of ${out.metPeak.length} pairs (${pc(out.metPeak.filter(v=>v>=26).length, out.metPeak.length)})`);
const G = out.gate;
console.log(`  AND THE GATE IS A CONJUNCTION — of ${G.hw} live house-weeks (a week per un-retired rival):`);
console.log(`    warm>=52 ${G.warm} (${pc(G.warm,G.hw)}) · met>=26 ${G.met} (${pc(G.met,G.hw)}) · year>=11 ${G.yr} (${pc(G.yr,G.hw)})`);
console.log(`    warm AND met together: ${G.wm} house-weeks, on ${G.everWM} of ${G.pairs} pairs`);
console.log(`    ALL THREE at once:     ${G.all} house-weeks (${pc(G.all,G.hw)}), on ${G.everAll} of ${G.pairs} pairs — every week \`end\` could have fired`);
console.log(`    at the 5.5% weekly roll that is ~${(G.all*0.055).toFixed(1)} expected fires (it also competes with the other seven beats)`);
if(out.label === "courting"){ const C2 = out.court;
  console.log(`  the courting picker: ${C2.calls} bills seen, ${C2.offers} offers examined, it took the house it wanted ${C2.hit} times (${pc(C2.hit,C2.calls)})`);
  console.log(`    a low number here means the arm measured the BILL, not the courting — which is what the FIRST draft of it did, silently`); }
{ const B = out.billed, C = out.ceiling;
  console.log(`  THE CEILING ON \`met\`, which no policy can beat — the bill carried a card at all on ${B.weeks} weeks`);
  console.log(`    ${B.offers} offers on those cards · ${B.withHouse} weeks named a LIVE rival (${pc(B.withHouse,B.weeks)})`);
  console.log(`    weeks a given house was on the bill at all: p50 ${q(C,0.5)} · p90 ${q(C,0.9)} · max ${Math.max(0,...C)}`);
  console.log(`    pairs whose CEILING reaches met 26: ${C.filter(v=>v>=26).length} of ${C.length} (${pc(C.filter(v=>v>=26).length, C.length)}) — fight every one and this is the most you could have`); }
const lived = out.houses.map(x=>x.yearEnd);
console.log(`  the house's own life: median year ${q(lived,0.5)} · p90 ${q(lived,0.9)} · ${out.houses.filter(x=>x.yearEnd>=11).length} of ${out.houses.length} ever reached YEAR 11`);
console.log(`  and how they ended: ${out.houses.filter(x=>x.over).length} died, ${out.houses.filter(x=>!x.over).length} still standing`);

const strangers = out.refills.filter(x=>!x.freed);
console.log(`\n=== 3. WHAT HAPPENS TO THE EMPTY YARD? (nothing has ever probed bayRefill) ===`);
console.log(`  the seed bay is [${out.seedNames.join(", ")}], the floor is ${out.floor}, the stranger pool is [${out.pool.join(", ")}]`);
console.log(`  ${strangers.length} strangers installed (${out.refills.filter(x=>x.freed).length} freedman-founded)`);
const byName = {}; for(const x of strangers) byName[x.name] = (byName[x.name]||0)+1;
console.log(`  by name: ${Object.entries(byName).map(([k,v])=>`${k} ${v}`).join(" · ") || "(none)"}`);
console.log(`  pool used: ${Object.keys(byName).length} of ${out.pool.length}`);

console.log(`\n=== 4. WOULD THE PLAYER EVER MEET THE SON? ===`);
if(!out.retires.length) console.log(`  no retirements — the question does not arise`);
else {
  const aft = out.retires.map(x=>x.after);
  console.log(`  weeks the campaign ACTUALLY RAN after each retirement: ${aft.join(" · ")}`);
  console.log(`    p50 ${q(aft,0.5)} · min ${Math.min(...aft)} · max ${Math.max(...aft)} · ${out.retires.filter(x=>x.after>=50).length} of ${out.retires.length} left 50+ weeks to play`);
  console.log(`  men in the yard when it shut (the heir roll's own gate): ${out.retires.map(x=>x.men).join(" · ")} — ${out.retires.filter(x=>x.men>0).length} of ${out.retires.length} clear it`);
}
if(strangers.length){
  console.log(`  the stranger who took the yard: ${strangers.map(x=>`${x.name} w${x.week} → ${x.after}w, ${x.cards} cards`).join(" · ")}`);
  console.log(`    ${strangers.filter(x=>x.after>=50).length} of ${strangers.length} had 50+ weeks · ${strangers.filter(x=>x.cards>0).length} were ever fought at all`);
}

console.log(`\n=== 5. SO HOW MANY PLAYERS WOULD EVER SEE A SON? ===`);
const eligible = out.retires.filter(x=>x.men>0).length;
console.log(`  ${eligible} retirements clear the item's own gate across ${out.houses.length} campaigns = ${(eligible/out.houses.length).toFixed(2)} per campaign, before any roll`);
for(const pr of [0.25, 0.35, 0.50, 0.75]){
  const per = eligible/out.houses.length*pr;
  console.log(`    at p=${pr.toFixed(2)}: ${per.toFixed(2)} heirs a campaign — about 1 player in ${per>0?Math.round(1/per):"∞"}`);
}
}
console.log("");

await browser.close(); server.close();
