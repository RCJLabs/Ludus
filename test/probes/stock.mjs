/* WHICH ENTRIES OF THE HAND-WRITTEN TABLES DOES A PLAYED HOUSE EVER MEET?

   `events.mjs` counted the largest content table in the file (EVENTS, 55 of 59 met) and the
   three misses were three different problems. Four smaller tables have never been counted at
   all, and three of them are not even on the test handle, so no check could have:

     AMBITIONS   7 keys x 5 written lines each = 35 pieces of writing, plus 6 states
     TRAITS      8, of which the world generator uses 7 and kin uses 5
     INJURIES    6, reached through INJ_BY_TARGET's 6 targets
     NICKS       14, drawn at five wins

   THE DENOMINATOR IS PARSED FROM THE SOURCE, NOT TYPED IN HERE. A probe that keeps its own copy
   of a table is a second implementation to keep in step — `d.poachedIn` was invented in a probe
   and was structurally incapable of returning anything but 0. Everything parsed is printed, so a
   bad parse is visible instead of quietly shrinking the denominator.

   AND A ZERO IS A CLAIM ABOUT THE POLICY UNTIL PROVEN OTHERWISE. The rope never frees a man
   (`free:false` by default), so a `freedom` ambition met through `grantRudis` cannot happen here;
   that row is marked with the rope step that would have to be on. Run the arms.
*/
import fs from "node:fs";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";
import path from "node:path";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "STOCK";
const ARM  = process.argv[5] || "";           /* extra rope options as JSON */

/* ---- THE TABLES, READ OFF THE FILE ---- */
const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const block = (re) => { const m = src.match(re); return m ? m[1] : ""; };
const AMB = [...block(/const AMBITIONS = \{([\s\S]*?)\n\};/).matchAll(/^  ([A-Za-z]+):\s*\{/gm)].map(m=>m[1]);
const TRAITS = [...block(/const TRAITS = \{([\s\S]*?)\n\};/).matchAll(/^\s*"?([A-Za-z][A-Za-z -]*?)"?:\s*"/gm)].map(m=>m[1]);
const INJ = [...block(/const INJURIES = (\[.*\]);/).matchAll(/\["([^"]+)",/g)].map(m=>m[1]);
const NICKS = [...block(/const NICKS = (\[.*\]);/).matchAll(/"([^"]+)"/g)].map(m=>m[1]);
const WORLD = [...block(/const WORLD_TRAITS = (\[.*\]);/).matchAll(/"([^"]+)"/g)].map(m=>m[1]);
const KIN   = [...block(/const KIN_TRAITS = (\[.*\]);/).matchAll(/"([^"]+)"/g)].map(m=>m[1]);
const TARGETS = [...block(/const TARGETS = (\[.*\]);/).matchAll(/\["([a-z]+)"/g)].map(m=>m[1]);
const BY_TARGET = block(/const INJ_BY_TARGET = \{([^}]*)\}/);

console.log(`parsed off src/ludus.jsx — AMBITIONS ${AMB.length} [${AMB.join(" ")}]`);
console.log(`  TRAITS ${TRAITS.length} [${TRAITS.join(" · ")}]`);
console.log(`  world generator uses ${WORLD.length}, kin uses ${KIN.length}`);
console.log(`  INJURIES ${INJ.length} [${INJ.join(" · ")}]  from ${TARGETS.length} targets [${TARGETS.join(" ")}]`);
console.log(`  INJ_BY_TARGET ${BY_TARGET.trim()}`);
console.log(`  NICKS ${NICKS.length}\n`);
if(!AMB.length || !TRAITS.length || !INJ.length || !NICKS.length) throw new Error("a table parsed EMPTY — fix the regex before reading anything below");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED, ARM, AMB, TRAITS, INJ, NICKS]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  /* ---- THE ARM THAT ACTUALLY USES THE SYSTEM ----
     `nokill` and `nobeast` have exactly ONE door to being MET in the whole file:
     `applyRefusal(d, g, "give")`, reached by answering the refusal event with its third choice.
     The rope answers 0 to everything, which is "The whip". So "never met" is a statement about
     the reference player until an arm presses that button — write the policy before filing
     anything dead. `mercy` in the arm string does exactly that and nothing else. */
  let opts = {};
  if(ARM){ const raw = ARM.trim();
    if(raw === "mercy") opts = { answer:(ev)=>ev.id === "refusal" ? 2 : null };
    else { opts = JSON.parse(raw);
      if(opts.mercy){ delete opts.mercy; opts.answer = (ev)=>ev.id === "refusal" ? 2 : null; } } }

  const zero = ks => { const o = {}; for(const k of ks) o[k] = 0; return o; };
  /* every pairing the rope actually fought, kept so the branch census below runs on the card
     the game deals rather than on a week-one man against a tier-1 body */
  const pairs = [];
  { const orig = A.doFight;
    A.doFight = function(dd, gid, offer, ...rest){
      try { const g = (dd.gladiators||[]).find(x=>x.id===gid);
        if(g && offer && offer.opp && pairs.length < 900)
          pairs.push([JSON.parse(JSON.stringify(g)), JSON.parse(JSON.stringify(offer.opp)),
                      rest[0] || "measured", offer.stakes || "standard"]);
      } catch(e){}
      return orig.call(this, dd, gid, offer, ...rest); }; }

  /* ---- AND A WEEKLY SWEEP CANNOT COUNT A ONE-WEEK WOUND ----
     The injury tally below reads `g.injury` once a week, AFTER endWeek has healed. "Split brow"
     is one week, so a brow opened and closed inside the same week is invisible, and the weekly
     count is biased by how long each wound lasts — the four-week wounds are the ones seen most.
     This second tally reads the man IMMEDIATELY after the engine returns, through all four doors,
     which is an arrival count with no duration in it. Both are printed; where they disagree, the
     weekly one is the biased one. */
  const atBout = {};
  for(const door of ["doFight","doPairFight","doMelee","doVenatio"]){
    const orig = A[door]; if(typeof orig !== "function") continue;
    A[door] = function(dd, who, ...rest){
      const ids = [].concat(who || []);
      const before = {};
      for(const id of ids){ const g = (dd.gladiators||[]).find(x=>x.id===id);
        before[id] = g && g.injury ? g.injury.name : null; }
      const res = orig.call(this, dd, who, ...rest);
      for(const id of ids){ const g = (dd.gladiators||[]).find(x=>x.id===id);
        const now = g && g.injury ? g.injury.name : null;
        if(now && now !== before[id]) atBout[now] = (atBout[now]||0) + 1; }
      return res;
    };
  }

  /* ---- WHERE THE BLOW LANDED, AND WHICH DOOR THE INJURY CAME THROUGH ----
     A count of injury NAMES cannot separate a target that never comes up from a target whose
     injury is always overridden. `injuryFor(target, severe)` is module-scope and cannot be
     hooked, and THE FIRST VERSION OF THIS TRIED TO READ `res.lastTarget` OFF WHAT `doFight`
     RETURNS — a field that is not there. It printed `(none)` for every bout of a calibration
     run, which is the only reason it was caught; a probe measuring its own fallback is the
     commonest fault in this directory.
     `simulateFight` IS on the handle, returns `lastTarget`, and is the function the door calls.
     So the branch is reconstructed from the engine's own verdict, in the order `doFight` tests it:
        !win && fell            -> injuryFor(lastTarget, TRUE)
        win && vA<45 && R()<0.4 -> injuryFor(lastTarget, FALSE)     <- the only non-severe door
     and `severe && flank` is the one pairing that gets overridden, to "Pierced side". */

  const T = {
    ambGiven: zero(AMB), ambMet: zero(AMB), ambBroken: zero(AMB), ambDespair: zero(AMB),
    ambVoiced: zero(AMB), ambPressed: zero(AMB), ambPromised: zero(AMB),
    traitMine: zero(TRAITS), traitTheirs: zero(TRAITS),
    inj: zero(INJ), injOther: {},
    nick: zero(NICKS), nickOther: 0,
    men: 0, oppMen: 0, houses: 0, weeks: 0, ambStates: {}, scarPart: {},
    /* ---- WHY `freedom` IS NEVER MET, SPLIT BY TERM ----
       `grantRudis` meets it only on `wins>=10 && pfame>=180 && !auctor && age<30`, and
       `rudisEligible` is the first three. A count of "never met" says nothing about which term
       is holding, which is what `nemesis` and `finish` established. Man-weeks, not men: a man
       who clears three terms for a hundred weeks is a hundred chances the fourth never took. */
    rud: { manWeeks:0, wins:0, pfame:0, notAuctor:0, under30:0, eligible:0, all4:0, menAll4:0,
           freed:0, freedAges:[], wantFreedom:0, wantAll4:0 },
    evRefusal: 0, gave: 0,
    nickAwarded: 0, nickClashEver: 0, nickClashLive: 0,
  };
  /* a man is counted ONCE, by id+house, whatever happens to him afterwards — a per-week
     tally would weight a long-lived man's ambition by how long he lived */
  for(let h=0; h<H; h++){
    const d = A.newGameState("Stock","clean",SEED+"-"+h, null);
    T.houses++;
    const seenMan = new Set(), seenAmb = new Set(), seenOpp = new Set(), houseNicks = new Set();
    const sweepMen = () => {
      for(const g of (d.gladiators||[])){
        const key = g.id;
        if(!seenMan.has(key)){ seenMan.add(key); T.men++; }
        /* traits are ADDED later too — a kin trait, a perk — so this is a per-man-per-trait
           mark rather than a snapshot taken the week he arrived */
        for(const t of (g.traits||[])){ const mk = "__p_t_"+t;
          if(!g[mk]){ g[mk] = 1; if(t in T.traitMine) T.traitMine[t]++; } }
        if(g.ambition){
          const a = g.ambition;
          if(!seenAmb.has(key)){ seenAmb.add(key); if(a.kind in T.ambGiven) T.ambGiven[a.kind]++; }
          /* terminal flags are one-way, so counting them every week would multiply; each is
             recorded once per man by a per-man mark on the object the probe owns */
          const mark = (flag, bucket) => { const mk = "__p_"+flag;
            if(a[flag] && !a[mk]){ a[mk] = 1; if(a.kind in bucket) bucket[a.kind]++; } };
          mark("met", T.ambMet); mark("broken", T.ambBroken); mark("despair", T.ambDespair);
          if((a.voiced||0) >= 1 && !a.__p_v1){ a.__p_v1 = 1; if(a.kind in T.ambVoiced) T.ambVoiced[a.kind]++; }
          if((a.voiced||0) >= 2 && !a.__p_v2){ a.__p_v2 = 1; if(a.kind in T.ambPressed) T.ambPressed[a.kind]++; }
          if(a.promised && !a.__p_pr){ a.__p_pr = 1; if(a.kind in T.ambPromised) T.ambPromised[a.kind]++; }
        }
        /* an injury persists for weeks; count the ARRIVAL, which is the week the name changes.
           The first cut keyed on `g.injury.since` — a field that does not exist — so the key
           moved every week and one split brow counted four times. */
        if(g.injury && g.injury.name){
          if(g.__p_inj !== g.injury.name){ g.__p_inj = g.injury.name;
            const n = g.injury.name;
            if(n in T.inj) T.inj[n]++; else T.injOther[n] = (T.injOther[n]||0)+1; }
        } else if(g.__p_inj) g.__p_inj = null;
        if(g.nick && !g.__p_nick){ g.__p_nick = 1;
          if(T.nick[g.nick] != null) T.nick[g.nick]++; else T.nickOther++;
          /* two men in one house can be given the same name by the crowd: `pick(NICKS)` does
             not look at who already holds one. Counted, because a duplicate is a content fault
             the table cannot show. */
          T.nickAwarded++;
          /* "already held" has two readings and only one is a fault the player can see: a name
             held by a man who died two hundred weeks ago is not a collision in the yard. Both
             are counted. */
          if(houseNicks.has(g.nick)) T.nickClashEver++; else houseNicks.add(g.nick);
          const living = (d.gladiators||[]).filter(x=>!A.isGone(x) && x.id!==g.id && x.nick===g.nick);
          if(living.length) T.nickClashLive++; }
        /* the four terms of the rudis, counted on the men who could still take it */
        if(!A.isGone(g) && g.status === "active"){
          const r = T.rud; r.manWeeks++;
          const w10 = (g.wins||0) >= 10, pf = (g.pfame||0) >= 180, na = !g.auctor, u30 = (g.age||99) < 30;
          if(w10) r.wins++; if(pf) r.pfame++; if(na) r.notAuctor++; if(u30) r.under30++;
          let el = false; try { el = !!A.rudisEligible(g); } catch(e){}
          if(el) r.eligible++;
          if(el && u30){ r.all4++; if(!g.__p_all4){ g.__p_all4 = 1; r.menAll4++; } }
          if(g.ambition && g.ambition.kind === "freedom"){ r.wantFreedom++;
            if(el && u30) r.wantAll4++; }
        }
        if(g.status === "freed" && !g.__p_freed){ g.__p_freed = 1;
          T.rud.freed++; if(T.rud.freedAges.length < 400) T.rud.freedAges.push(g.age||0); }
        for(const s of (g.scars||[])){ const part = (s && (s.part||s.where||s.target)) || (typeof s === "string" ? s : "?");
          T.scarPart[part] = (T.scarPart[part]||0)+1; }
      }
      /* the men across the sand are drawn from the same tables and are the larger population */
      for(const o of ((d.games && d.games.offers) || [])){
        for(const x of [o.opp, ...(o.opps||[])]){
          if(!x || !x.id || seenOpp.has(x.id)) continue;
          seenOpp.add(x.id); T.oppMen++;
          for(const t of (x.traits||[])) if(t in T.traitTheirs) T.traitTheirs[t]++;
        }
      }
    };
    for(let w=0; w<W && !d.over; w++){
      if(d.pendingEvent && d.pendingEvent.id === "refusal"){ T.evRefusal++;
        const gg = (d.gladiators||[]).find(x=>x.id===d.pendingEvent.data.gid);
        if(opts.answer && gg && gg.ambition && !gg.ambition.met && !gg.ambition.broken) T.gave++; }
      R.lanista(d, opts); T.weeks++; sweepMen(); }
    /* the terminal state of every ambition this house ever carried */
    for(const g of (d.gladiators||[])){ const a = g.ambition; if(!a) continue;
      const st = a.met ? "met" : a.broken ? "broken" : a.despair ? "despair"
        : (a.voiced||0)>=2 ? "pressed" : (a.voiced||0)>=1 ? "asked" : "silent";
      T.ambStates[st] = (T.ambStates[st]||0)+1; }
  }
  /* ---- AND THE ENGINE DRIVEN STRAIGHT, so the two doors can be counted apart ----
     Men come out of the game's own generators rather than being identical dummies. */
  const branch = { severeTgt:{}, mildTgt:{}, sims:0, severe:0, mildEligible:0, dead:0, neither:0 };
  const SIMS = 12000;
  branch.pairs = pairs.length;
  for(let i=0;i<SIMS && pairs.length;i++){
    const [a0, b0, tac, stakes] = pairs[i % pairs.length];
    const a = JSON.parse(JSON.stringify(a0)), b = JSON.parse(JSON.stringify(b0));
    a.mods = null; b.mods = null;
    let res = null;
    try { res = A.simulateFight(a, b, tac, stakes, {}, {}); } catch(e){ continue; }
    if(!res) continue;
    branch.sims++;
    if(res.aDies){ branch.dead++; continue; }
    const win = res.winner === "A";
    const t = res.lastTarget || "(none)";
    if(!win && res.fell){ branch.severe++; branch.severeTgt[t] = (branch.severeTgt[t]||0)+1; }
    else if(win && res.vA < 45){ branch.mildEligible++; branch.mildTgt[t] = (branch.mildTgt[t]||0)+1; }
    else branch.neither++;
  }
  T.branch = branch;
  T.atBout = atBout;
  return { T, rope:R.say() };
}, [H, W, SEED, ARM, AMB, TRAITS, INJ, NICKS]);

await browser.close(); server.close();

const T = out.T;
const row = (label, obj, note) => {
  const ks = Object.keys(obj), hit = ks.filter(k=>obj[k]>0).length;
  console.log(`\n=== ${label} — ${hit} of ${ks.length} ever seen ${note||""}`);
  for(const k of ks) console.log(`  ${k.padEnd(26)} ${String(obj[k]).padStart(6)}${obj[k]?"":"   <<< NEVER"}`);
};
console.log(`=== ${T.houses} houses x up to ${W} weeks · ${T.weeks} house-weeks · ${T.men} of your men, ${T.oppMen} across the sand`);
row("AMBITIONS GIVEN", T.ambGiven);
row("...ASKED (voiced>=1)", T.ambVoiced);
row("...PRESSED (voiced>=2)", T.ambPressed);
row("...A WORD GIVEN", T.ambPromised);
row("...MET", T.ambMet);
row("...BROKEN", T.ambBroken);
row("...GIVEN UP ON", T.ambDespair);
console.log(`\n  terminal state of every ambition carried: ${Object.entries(T.ambStates).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
row("TRAITS — your men", T.traitMine);
row("TRAITS — theirs", T.traitTheirs);
row("INJURIES", T.inj);
if(Object.keys(T.injOther).length) console.log(`  off-table injury names: ${JSON.stringify(T.injOther)}`);
{ const ab = T.atBout || {}, tot = Object.values(ab).reduce((a,b)=>a+b,0) || 1;
  console.log(`  ...and counted AT THE BOUT instead, which a one-week wound survives (${tot} arrivals):`);
  for(const k of INJ) console.log(`    ${k.padEnd(24)} ${String(ab[k]||0).padStart(6)} ${((ab[k]||0)/tot*100).toFixed(1).padStart(5)}%${ab[k]?"":"   <<< NEVER"}`); }
row("NICKS", T.nick);
if(T.nickOther) console.log(`  nicks not in the table: ${T.nickOther}`);
console.log(`  ${T.nickAwarded} of your men were named by the crowd · ${T.nickClashEver} took a name the house had used before · ${T.nickClashLive} took one a man STILL ON THE BOOKS was wearing`);
const B = T.branch || {};
console.log(`\n=== THE TWO DOORS AN INJURY COMES THROUGH — ${B.sims} re-runs of ${B.pairs} pairings the rope actually fought`);
console.log(`  he died                                ${B.dead}`);
console.log(`  neither door (walked off unhurt)       ${B.neither}`);
console.log(`  !win && fell   -> severe=TRUE          ${B.severe}   ${Object.entries(B.severeTgt||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
console.log(`  win && vA<45   -> severe=FALSE, x0.4   ${B.mildEligible}   ${Object.entries(B.mildTgt||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
const fl = (B.mildTgt||{}).flank || 0;
console.log(`  "Cracked ribs" needs win && vA<45 && R()<0.4 && flank: ${fl} of ${B.sims} bouts, x0.4 = ${(fl*0.4).toFixed(1)} expected per ${B.sims}`);
console.log(`\n  scar parts: ${Object.entries(T.scarPart).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "none"}`);
const rr = T.rud;
const ages = (rr.freedAges||[]).slice().sort((a,b)=>a-b);
const med = ages.length ? ages[Math.floor(ages.length/2)] : "-";
console.log(`\n=== THE FOUR TERMS OF THE RUDIS — over ${rr.manWeeks} active man-weeks`);
console.log(`  wins >= 10            ${String(rr.wins).padStart(7)}  ${(rr.wins/rr.manWeeks*100).toFixed(1)}%`);
console.log(`  pfame >= 180          ${String(rr.pfame).padStart(7)}  ${(rr.pfame/rr.manWeeks*100).toFixed(1)}%`);
console.log(`  not an auctoratus     ${String(rr.notAuctor).padStart(7)}  ${(rr.notAuctor/rr.manWeeks*100).toFixed(1)}%`);
console.log(`  age < 30              ${String(rr.under30).padStart(7)}  ${(rr.under30/rr.manWeeks*100).toFixed(1)}%`);
console.log(`  rudisEligible (3 of)  ${String(rr.eligible).padStart(7)}  ${(rr.eligible/rr.manWeeks*100).toFixed(1)}%`);
console.log(`  ALL FOUR              ${String(rr.all4).padStart(7)}  ${(rr.all4/rr.manWeeks*100).toFixed(1)}%   ${rr.menAll4} distinct men`);
console.log(`  of the men who WANT freedom: ${rr.wantFreedom} man-weeks carrying it, ${rr.wantAll4} of them with all four terms up`);
console.log(`  men actually freed ${rr.freed}, median age at the rudis ${med} (ages ${ages.slice(0,3).join(",")}..${ages.slice(-3).join(",")})`);
console.log(`\n  refusal event offered ${T.evRefusal} times · the arm answered "give him the thing he wants" ${T.gave} of them`);
console.log(`\n  rope: ${out.rope}`);
