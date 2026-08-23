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
  const opts = ARM ? JSON.parse(ARM) : {};

  const zero = ks => { const o = {}; for(const k of ks) o[k] = 0; return o; };
  const T = {
    ambGiven: zero(AMB), ambMet: zero(AMB), ambBroken: zero(AMB), ambDespair: zero(AMB),
    ambVoiced: zero(AMB), ambPressed: zero(AMB), ambPromised: zero(AMB),
    traitMine: zero(TRAITS), traitTheirs: zero(TRAITS),
    inj: zero(INJ), injOther: {},
    nick: zero(NICKS), nickOther: 0,
    men: 0, oppMen: 0, houses: 0, weeks: 0, ambStates: {}, scarPart: {},
    nickAwarded: 0, nickClash: 0,
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
          if(houseNicks.has(g.nick)) T.nickClash++; else houseNicks.add(g.nick);
          T.nickAwarded++; }
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
    for(let w=0; w<W && !d.over; w++){ R.lanista(d, opts); T.weeks++; sweepMen(); }
    /* the terminal state of every ambition this house ever carried */
    for(const g of (d.gladiators||[])){ const a = g.ambition; if(!a) continue;
      const st = a.met ? "met" : a.broken ? "broken" : a.despair ? "despair"
        : (a.voiced||0)>=2 ? "pressed" : (a.voiced||0)>=1 ? "asked" : "silent";
      T.ambStates[st] = (T.ambStates[st]||0)+1; }
  }
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
row("NICKS", T.nick);
if(T.nickOther) console.log(`  nicks not in the table: ${T.nickOther}`);
console.log(`  ${T.nickAwarded} of your men were named by the crowd · ${T.nickClash} of them took a name ALREADY HELD in the same house`);
console.log(`\n  scar parts: ${Object.entries(T.scarPart).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "none"}`);
console.log(`\n  rope: ${out.rope}`);
