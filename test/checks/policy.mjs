/* THE REFERENCE PLAYER, AND A BAR UNDER HIM.

   `survive` asks whether a NEW house can get off the ground — three men, twenty-six weeks, the first
   winter. Nothing asked the other question: can a house that is played WELL still get anywhere? That
   matters more than it sounds, because every reachability claim this audit has ever published was a
   claim about whichever policy the probe happened to have, and in v2.93.0 three attempts at a competent
   one produced median lives of 108, 27 and 157 weeks on the same build:

     no `wantStakes`, cheapest man, spends nothing     108w · fame   974 · 44 of 57 events · no rooms
     best man behind a FLAT 400d reserve              **27w** · fame    90 · 43 of 57 events · 7 of 16 in debt
     the same behind twelve weeks of the bill          157w · fame 1,286 · 48 of 57 events · every room at 4

   The first reported thirteen events and fourteen subsystems dark and almost none of it was the game.
   So the policy now lives in the harness as `__ROPE.lanista` / `__ROPE.play`, once, and this check is
   what keeps it honest: if a change to the game makes the reference player collapse, this says so, and
   every other check that leans on him inherits the warning.

   THE BARS ARE DELIBERATELY WIDE, and every one of them is a long way from its measured value, because
   the lesson this suite has paid for three times is that a threshold fitted close to a sample fails on
   luck. What is printed but NOT asserted: the event tally, the subsystem census and the ending mix,
   which are the audit's raw material rather than a contract.

   AND THE FIRST TWO BARS WERE ON THE WRONG STATISTIC. v2.98.0 added one household hire around week
   twenty and this check failed twice running — median life 106 then 60, against a bar of 70. A 112
   denarius hire cannot do that; consuming two extra rolls of the RNG and reshuffling every draw after
   it can. So the distribution behind the bar was measured instead of the bar being nudged: 48 houses of
   the reference player on this check's own seeds, at 320 weeks.

     dead before week 100   18 of 48 (38%)        alive at the 320-week wall   14 of 48
     life   p10 27 · median 170 · p90 321         fame   p10 38 · median 1,040 · p90 11,180
     THE MEDIAN OF A BLOCK OF EIGHT             54 · 60 · 99 · 121 · 311 · 321       ← the assertion
     the BEST HOUSE in the same blocks          291 · 321 · 321 · 321 · 321 · 321

   The median of eight draws from that spans 54 to 321 and would fail the old life bar in 2 blocks of 6
   and the old fame bar in 3 of 6 — one run in three, with no change to the game at all. The shape is
   the reason: 38% of even well-played houses die in the opening and 29% are still standing at the wall,
   so there is no stable middle for a median to sit in. The claim this check wants to make was never
   about the middle anyway — it is *a house played well can still get somewhere*, and the statistic for
   that is the best house in the run, which spans 291 to 321 weeks and 6,808 to 17,487 fame across the
   same six blocks. Those are what it asserts now, at bars of 150 and 2,000.

   WHAT WOULD FALSIFY the reference player: a build on which NO house of his gets anywhere — that is
   what the best-of-run bars are for. What would falsify the bars themselves: another change of this
   size moving them, which would mean 8 houses is too few even for the top of the distribution. */

import { hasHandle } from "../harness.mjs";

export const name = "policy";
export const describe = "the reference player still gets a house somewhere — the bar under `__ROPE.lanista`";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const bad = [], lines = [];
    if(!R || typeof R.play !== "function")
      return { bad:["`__ROPE.play` is missing — the harness no longer carries the reference player"], lines };

    const HOUSES = 8, WEEKS = 320;
    const q = (a,f)=>{ const b=a.filter(v=>v!=null).slice().sort((x,y)=>x-y);
      return b.length ? b[Math.max(0,Math.floor(b.length*f)-1)] : null; };

    const rows = [], events = {}, subs = {};
    const SUBS = ["doctore","medicus","armourer","blessing","vow","rise","primus","bay","nemesis",
      "election","aedile","war","brand","league","book","rome","city","heir","doctrine","household"];
    /* the reference player declares a school and staffs the household now, so those are live
       subsystems rather than dark ones — `household` was dark by construction until v2.98.0, when
       the nine functions behind it reached the handle at all */

    for(let h=0; h<HOUSES; h++){
      const d = A.newGameState("Po"+h, "clean", `POLICY-${h}`, null);
      const seen = {};
      /* play in slices so the subsystem census can be taken while the house is alive */
      let tot = null;
      for(let s=0; s<WEEKS/20; s++){
        const bit = R.play(d, 20);
        if(!tot) tot = bit;
        else { for(const [k,v] of Object.entries(bit)){
          if(k === "events"){ for(const [e,n] of Object.entries(v)) tot.events[e] = (tot.events[e]||0)+n; }
          else if(k !== "week" && k !== "kind") tot[k] = (tot[k]||0)+v; } tot.week = bit.week; tot.kind = bit.kind; }
        for(const k of SUBS){ const v = d[k];
          if(v != null && !(typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length)) seen[k] = 1; }
        if(d.over) break;
      }
      for(const [e,n] of Object.entries(tot.events||{})) events[e] = (events[e]||0)+n;
      for(const k of Object.keys(seen)) subs[k] = (subs[k]||0)+1;
      const rec = A.houseRecord(d);
      rows.push({ h, week:tot.week, kind:tot.kind, fame:Math.round(d.fame), served:rec.served,
        bouts:tot.bout||0, won:tot.won||0, noBout:tot.noBout||0, threw:tot.threw||0,
        rise:(d.rise&&d.rise.rank)||0, rooms:Object.keys(d.buildings||{}).length,
        did:["feast","walk","bought","doctore","built","offering","vow","school","folk","namedHeir","tookUpHouse","claimedRank","toRome","primusBout"]
          .filter(k=>tot[k]).map(k=>`${k} ${tot[k]}`).join(" ") });
    }

    const medLife = q(rows.map(r=>r.week), 0.5);
    const medFame = q(rows.map(r=>r.fame), 0.5);
    const bestLife = Math.max(...rows.map(r=>r.week));
    const bestFame = Math.max(...rows.map(r=>r.fame));
    const stood = rows.filter(r=>r.week >= 180).length;
    const evN = Object.keys(events).length;
    const allEv = Object.keys(A.EVENTS||{}).length;
    const roomsBest = Math.max(...rows.map(r=>r.rooms));
    const anyRank = rows.filter(r=>r.rise > 0).length;
    const gotDoctore = subs.doctore || 0;
    const threw = rows.reduce((s,r)=>s+r.threw,0);

    for(const r of rows)
      lines.push(`house ${r.h}: ${String(r.week).padStart(4)}w ${r.kind.padEnd(11)} fame ${String(r.fame).padStart(6)}`
        + ` · ${String(r.bouts).padStart(3)} bouts ${String(r.won).padStart(3)} won · rung ${r.rise} · ${r.rooms} rooms`
        + `  [${r.did}]`);
    lines.push(`best house ${bestLife}w at fame ${bestFame} · ${stood} of ${HOUSES} stood past week 180`
      + `  [the medians below are printed, not asserted — see the head]`);
    lines.push(`median life ${medLife}w · median fame ${medFame} · ${evN} of ${allEv} events fired`
      + ` · best rooms held ${roomsBest} of 5 · houses that claimed a rank ${anyRank}/${HOUSES}`
      + ` · hired a doctore ${gotDoctore}/${HOUSES}`);
    lines.push(`subsystems switched on in at least one house: ${Object.keys(subs).sort().join(", ")}`);
    const never = Object.keys(A.EVENTS||{}).filter(k=>!events[k]);
    lines.push(`events not seen in this run (${never.length}): ${never.join(", ") || "none"}`);

    /* ---- THE BARS. Measured values in brackets; each bar sits near half of it. ---- */
    if(bestLife < 150)
      bad.push(`the best house the reference player got anywhere with lived ${bestLife} weeks [the best `
        + `house in each of six blocks of eight measured 291 to 321; bar 150]. He works the cells, buys `
        + `the best man he can afford behind twelve weeks of the bill, hires the doctore, builds rooms, `
        + `keeps the rites and claims the census — if not one house of his outlasts the opening then the `
        + `game has moved under every check that leans on him`);
    if(bestFame < 2000)
      bad.push(`the best house reached fame ${bestFame} [measured 6,808 to 17,487; bar 2,000] — the `
        + `reference player is no longer building a name anywhere, so everything gated on fame is now `
        + `untestable through him`);
    if(!stood)
      bad.push(`not one of ${HOUSES} houses stood past week 180 [measured 1 to 7 per block of eight] — `
        + `38% of well-played houses die in the opening by design, and none of them surviving is a `
        + `different thing entirely`);
    /* the event tally rides on how long the houses live, so it swings with them: the same eight seeds
       gave 42 kinds on one build and 34 on the next, purely from the reshuffle described in the head.
       The bar sits well under the low end rather than near the measured value, for the same reason the
       life bar moved off the median. */
    if(evN < 22)
      bad.push(`only ${evN} of ${allEv} events fired across ${HOUSES} houses [measured 34 to 48 on the `
        + `same seeds across builds; bar 22] — either the event pool has narrowed or the houses are `
        + `dying before the week can ask them anything`);
    if(roomsBest < 3)
      bad.push(`the best-off house held ${roomsBest} of 5 rooms [measured all five at level 4; bar 3] — `
        + `the reference player can no longer afford the buildings, so the late game is out of reach`);
    if(!anyRank)
      bad.push(`no house claimed a single census rung [measured rungs up to 7; bar at least one house] — `
        + `\`claimRise\` is one of the two gates on Rome and the ladder has stopped moving`);
    if(!subs.doctrine)
      bad.push(`no house ever declared a school, though the reference player tries to once it can pay `
        + `[measured: every surviving house]. Either \`declareDoctrine\` stopped taking or the six `
        + `doctrines have gone — \`school\` holds the system itself`);
    /* ---- THE LINE OF THE HOUSE, from v2.96.0 ----
       `lanistaWeek` at `L.health <= 0` writes `d.succession` if an heir is named and ends the run
       `lanistaDied` if not, and that is the whole difference. Paired on 12 seeds of 900 weeks: naming
       an heir took `lanistaDied` from 4 of 12 to NONE, median life from 104 weeks to 297, and opened
       `oldAge` — which needs `d.heir` — from 0 to 4 of 12. The reference player names one now, so a
       run of his that ends `lanistaDied` means the naming stopped working. */
    const died = rows.filter(r=>r.kind === "lanistaDied").length;
    const named = rows.filter(r=>(r.did||"").includes("namedHeir")).length;
    lines.push(`heirs named in ${named}/${HOUSES} houses · ended lanistaDied ${died}`);
    if(!named)
      bad.push(`no house named an heir, though the reference player tries whenever \`heirEligible\` `
        + `offers one [measured 13 namings across 12 houses]. Without it every failing lanista ends the `
        + `run instead of passing the house on, and \`oldAge\` is unreachable too`);
    else if(died > HOUSES / 3)
      bad.push(`${died} of ${HOUSES} houses ended \`lanistaDied\` with an heir named in ${named} of them `
        + `[measured 0 of 12 once the heir step was on]. \`lanistaWeek\` should write \`d.succession\` `
        + `rather than ending the run whenever \`d.heir\` is set`);
    if(!subs.household)
      bad.push(`no house ever staffed the household, though the reference player hires them as soon as `
        + `he can pay [measured: every surviving house]. \`d.household\` was empty in every sweep this `
        + `audit ever ran, and both reasons were true at once — nothing on the screen mentioned it and `
        + `not one of its nine functions was on the handle. \`folk\` holds the system itself`);
    if(!gotDoctore)
      bad.push(`no house hired a doctore [measured 15 of 16] — either the staff market stopped offering `
        + `or \`hireDoctore\` stopped taking`);
    if(threw > rows.length * 3)
      bad.push(`${threw} calls threw inside the reference player across ${rows.length} houses — something `
        + `it drives has changed signature, and every check on \`__ROPE.play\` is now measuring less than `
        + `it thinks`);

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
