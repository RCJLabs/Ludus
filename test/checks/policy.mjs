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
   luck. Measured at 8 houses × 320 weeks (a third of the sweep, so the figures are lower):
   the bar is set at roughly half of each. What is printed but NOT asserted: the event tally, the
   subsystem census and the ending mix, which are the audit's raw material rather than a contract.

   WHAT WOULD FALSIFY the reference player: a build on which he dies in the opening like `survive`'s
   houses do. That is what the median-life bar is for. */

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
      "election","aedile","war","brand","league","book","rome","city","heir","doctrine"];
    /* the reference player declares a school now, so this is a live subsystem rather than a dark one */

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
        did:["feast","walk","bought","doctore","built","offering","vow","school","namedHeir","tookUpHouse","claimedRank","toRome","primusBout"]
          .filter(k=>tot[k]).map(k=>`${k} ${tot[k]}`).join(" ") });
    }

    const medLife = q(rows.map(r=>r.week), 0.5);
    const medFame = q(rows.map(r=>r.fame), 0.5);
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
    lines.push(`median life ${medLife}w · median fame ${medFame} · ${evN} of ${allEv} events fired`
      + ` · best rooms held ${roomsBest} of 5 · houses that claimed a rank ${anyRank}/${HOUSES}`
      + ` · hired a doctore ${gotDoctore}/${HOUSES}`);
    lines.push(`subsystems switched on in at least one house: ${Object.keys(subs).sort().join(", ")}`);
    const never = Object.keys(A.EVENTS||{}).filter(k=>!events[k]);
    lines.push(`events not seen in this run (${never.length}): ${never.join(", ") || "none"}`);

    /* ---- THE BARS. Measured values in brackets; each bar sits near half of it. ---- */
    if(medLife < 70)
      bad.push(`the reference player's median house lived ${medLife} weeks [measured 157 at 16x600, and `
        + `the bar is 70]. He works the cells, buys the best man he can afford behind twelve weeks of the `
        + `bill, hires the doctore, builds rooms, keeps the rites and claims the census — if THIS dies in `
        + `the opening then the game has moved under every check that leans on him`);
    if(medFame < 300)
      bad.push(`median fame ${medFame} [measured 1,286; bar 300] — the reference player is no longer `
        + `building a name, so anything gated on fame is now untestable through him`);
    if(evN < 30)
      bad.push(`only ${evN} of ${allEv} events fired across ${HOUSES} houses [measured 48 of 57; bar 30] — `
        + `either the event pool has narrowed or the houses are dying before the week can ask them anything`);
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
