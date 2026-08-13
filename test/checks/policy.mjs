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

/* ---- THE REFERENCE PLAYER CHANGED UNDER THIS CHECK IN v3.17.0 ----
   He arms his men and he entertains now. Every bracketed "[measured …]" figure below was taken on the
   man who did neither — they are history rather than error, because every bar here is a FLOOR and he
   clears all of them by more than he used to. What he reaches, before and after, same eight seeds:

     median life            60w  ->  211w
     median fame            147  ->  5,497
     best house's fame   11,051  ->  17,840
     stood past week 180  4 of 8 ->  5 of 8
     events fired       36 of 57 ->  41 of 57
     claimed a rank        7 of 8 ->  8 of 8
     the census         19 of 20, `rome` DARK  ->  20 of 20, none dark
     `rome` reached       0 houses ->  6 of 8 · `city` 4 -> 6 · medicus and armourer 4 -> 7 · war 1 -> 2

   The old player was not modelling competence. He was modelling somebody who never found the game, and
   he could not reach Rome at all — which is why `rome` sat at 1 of 8 or 0 of 8 in every census this
   check has ever printed, and why the v3.10.0 floor had to be set low enough to tolerate it. Freeing
   men is still opt-in and the harness note says why: it halves the house's fame, and fame is the
   quantity most of this reachability leans on. */

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
    /* ---- AND THREE OF THE TWENTY WERE FREE PASSES, found in v3.10.0 ----
       "switched on" was `d[k] != null` and not an empty object, which is right for the seventeen
       things that start as `null`. `newGameState` builds three of them as populated objects on the
       first morning — measured on a brand new house, before the player does anything:
           rise    {"rank":0,"standing":0}
           brand   {"licensed":false,"decided":false,"tier":0,"earned":0}
           league  {"first":null,"since":1,"held":0,"best":99,"year":1,"snap":null}
       so all three counted 8 of 8 houses in every run this check has ever done, and could not have
       counted anything else. A census with three entries that cannot fail is a census reading 20 of 20
       while telling you about 17. Each of the three now has to have actually HAPPENED. */
    const SUB_ON = {
      rise:   d => ((d.rise||{}).rank||0) > 0,
      brand:  d => { const b = d.brand||{}; return !!(b.licensed || b.decided || (b.tier||0) > 0 || (b.earned||0) > 0); },
      league: d => { const l = d.league||{}; return !!(l.first || (l.held||0) > 0 || (l.best != null && l.best < 99)); },
    };
    const subOn = (d, k) => { const f = SUB_ON[k];
      if(f){ try { return !!f(d); } catch(e){ return false; } }
      const v = d[k];
      return v != null && !(typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length); };

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
        for(const k of SUBS) if(subOn(d, k)) seen[k] = 1;
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
    /* ---- #128: A LIST OF NAMES IS NOT A MEASUREMENT ----
       This printed the KEYS and nothing else, so "aedile, armourer, bay, ..." looked like twenty
       systems in good health when it is equally consistent with nineteen of them firing in every house
       and the twentieth firing once. `subs[k]` is the number of HOUSES the system switched on in and
       has always been computed here; it was simply never shown. Printed with its count, a system on
       its way dark shows up as a falling number instead of vanishing from a list in one go. */
    const census = SUBS.map(k=>({ k, n:subs[k]||0 })).sort((a,b)=>b.n-a.n);
    lines.push(`the subsystem census, houses each switched on in (of ${HOUSES}): `
      + census.map(x=>`${x.k} ${x.n}`).join(" · "));
    const dark = census.filter(x=>!x.n);
    lines.push(`switched on somewhere: ${SUBS.length - dark.length} of ${SUBS.length}`
      + (dark.length ? ` · DARK: ${dark.map(x=>x.k).join(", ")}` : " · none dark"));
    /* the ending mix, printed. There is no bar on it and the arithmetic below says why. */
    const mix = {}; for(const r of rows) mix[r.kind] = (mix[r.kind]||0)+1;
    const deadRows = rows.filter(r=>r.kind !== "alive");
    lines.push(`how the ${HOUSES} houses ended: `
      + Object.entries(mix).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · ")
      + ` — ${new Set(deadRows.map(r=>r.kind)).size} distinct kinds among the ${deadRows.length} that died`
      + ` [printed, not asserted: see the note on the census bar]`);
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
    /* ---- #128: THE CENSUS NOW HAS A FLOOR, AND IT SITS WHERE THE ARITHMETIC PUTS IT ----
       The census was printed and never asserted, so a subsystem going dark changed a line nobody
       compared against anything. The floor cannot be "all twenty", because two of them are coin flips
       on eight houses: measured, `war` switched on in 1 house of 8 and `rome` in 1 of 8, so p-hat is
       0.125 and P(0 of 8) is 0.875^8 = 34% for each — a bar requiring both would fail more than half
       of all runs with nothing changed. The next-rarest group sits at 4 of 8, where P(0 of 8) is 0.4%.
       So 18 of 20 is the only floor that is under both fragile systems and above every stable one, and
       it fails by chance in roughly 0.5% of runs.

       WHAT IS DELIBERATELY NOT BARRED, and why. Per-system floors are not set: eight houses is one
       observation of each system's rate, and a system seen 8 of 8 has a 95% lower bound near p=0.63,
       where P(2 or fewer of 8) is about 4%. Barring those individually off one run of eight is the
       mistake #127 was about. They are PRINTED with their counts instead, so a system on its way dark
       shows as a falling number across releases and can be barred once there is a series to bar it on.

       The ENDING MIX is not barred either. The only collapse worth failing on is every dead house
       dying of the ledger — the #117 signature of an arm that has stopped being paid — and at 6 dead
       of 8 with the measured mix (debt 3, rebellion 2, ruin 1) that comes up by chance about 1.6% of
       the time, which is above what this suite tolerates since #127. It wants more houses, and HOUSES
       is 8 because this check already takes minutes. Printed, with the count of distinct kinds. */
    const litSubs = SUBS.length - dark.length;
    if(litSubs < 18)
      bad.push(`only ${litSubs} of ${SUBS.length} subsystems switched on in any of ${HOUSES} houses `
        + `(dark: ${dark.map(x=>x.k).join(", ")}) [measured 20 of 20; bar 18, which is under the two `
        + `that are coin flips at this n — war 1 of 8 and rome 1 of 8 — and above the 4-of-8 group]. `
        + `Three or more dark at once is a system that has stopped being reachable, not a reshuffle`);
    if(!subs.doctrine)
      bad.push(`no house ever declared a school, though the reference player tries to once it can pay `
        + `[measured: every surviving house]. Either \`declareDoctrine\` stopped taking or the six `
        + `doctrines have gone — \`school\` holds the system itself`);
    /* ---- THE LINE OF THE HOUSE, from v2.96.0, CORRECTED IN v3.8.0 ----
       `lanistaWeek` at `L.health <= 0` writes `d.succession` if an heir is named and ends the run
       `lanistaDied` if not, and that is the whole difference. Paired on 12 seeds of 900 weeks: naming
       an heir took `lanistaDied` from 4 of 12 to NONE and median life from 104 weeks to 297.

       It also "opened `oldAge` from 0 to 4 of 12", and that was the fault rather than the fix. The
       retirement branch REQUIRED an heir and then ended the run without using him, so the two
       readings of `d.heir` in one function disagreed — and the ending won the race almost every
       time. Over 24 houses of up to 900 weeks, all of which named an heir: `d.succession` raised 0
       times, generation 2 reached 0 times. Retirement raises the succession now and the player
       chooses; the same 24 seeds give 11 successions and generation 2 in 11 of 24. */
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
