/* ONE OF THE SIX WOUNDS IS 0.06% OF ALL WOUNDS, AND MOST OF THE ENGINES CANNOT DEAL IT

   `INJ_BY_TARGET` maps six targets onto five wounds. The flank is the only target with two, and
   which one you get is the `severe` flag: `injuryFor(target, severe)` returns **"Pierced side"** for
   a severe flank and **"Cracked ribs"** for a mild one. So `Cracked ribs` — 3 weeks, 7 pen, its own
   name in the table — is reachable only through a NON-SEVERE flank, and #191 counted it at **2 of
   3,317 arrivals, 0.06%**, against 15-32% for the other five.

   THIS COUNTS AT THE BOUT AND IT COUNTS AT THE SOURCE. The item's own correction was that a weekly
   sweep of `g.injury` is biased by how long a wound lasts — `Split brow` heals in one week and read
   36 where the bout count reads 286. So this wraps `injuryFor` itself, which is the single function
   every wound in the game comes through, and records the target, the severe flag and the caller.
   Nothing is inferred from a field that might have healed.

   AND THE ITEM UNDERCOUNTED THE DOORS. It says two of the four engines pass `severe = true` and can
   never produce it, which is right for `doMelee` and `doPairFight`. But `doVenatio` passes
   `res.vA<40`, so a hunt won with vitality between 40 and 62 is a NON-SEVERE door nobody had
   counted; and the opponent's own wound at the end of `doFight` is `injuryFor(res.lastTarget,
   false)`, always mild — the rival's man takes cracked ribs at the full flank rate and the player
   never sees it as a wound of his own. Both are counted here, apart.

   THE FALSIFIER IS THE POLICY: *falsifies if a policy that wins narrowly and often — defensive
   against strong men — lifts it to a visible share; the mild door is a WIN, so this is the one item
   here a tactic might move.* The mild door is `win && res.vA < 45 && R() < 0.4`, so it wants a
   victory that cost you. The four tactics are run as arms, because which of them maximises
   "won, and came off under 45" is an empirical question and not an obvious one — `defensive` takes
   0.58 damage a round, which keeps you ALIVE and also keeps you ABOVE the bar the door needs.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "RIB";
const ARM  = process.argv[5] || "";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const MAP = (src.match(/const INJ_BY_TARGET = \{([^}]*)\}/) || ["",""])[1].trim();
const INJ = [...(src.match(/const INJURIES = (\[.*\]);/)||["",""])[1].matchAll(/\["([^"]+)",(\d+),(\d+)\]/g)]
  .map(m=>({ name:m[1], weeks:+m[2], pen:+m[3] }));
const FN = (src.match(/function injuryFor\(target, severe\)\{([\s\S]*?)\n\}/) || ["",""])[1];
console.log(`INJURIES ${INJ.length}: ${INJ.map(i=>`${i.name} (${i.weeks}w ${i.pen}p)`).join(" · ")}`);
console.log(`INJ_BY_TARGET = ${MAP}`);
console.log(`injuryFor:${FN.split("\n").slice(0,2).join("\n")}\n`);
if(!INJ.length || !MAP) throw new Error("a table parsed EMPTY — fix the regex before reading anything below");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED, ARM]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const opts = ARM ? JSON.parse(ARM) : {};
  if(typeof A.injuryFor !== "function") return { fatal:"injuryFor is not on the handle" };

  /* ---- COUNT THE ARRIVAL ACROSS THE DOOR, NOT THE WOUND ON THE MAN A WEEK LATER ----
     The item's own correction is that a weekly sweep of `g.injury` is biased by how long a wound
     lasts: `Split brow` heals in one week and read 36 where the bout count reads 286. So each
     door is wrapped and the men's `injury` fields are snapshotted either side of it — an arrival
     is a field that was not there, or that changed name, across one call.

     THE FIRST CUT WRAPPED `A.injuryFor` AND CAUGHT NOTHING — 1,074 doors entered and 0 wounds.
     `injuryFor` is a module-scope function and the game calls it directly; reassigning the handle's
     property rebinds the probe's own reference and nothing else. The four doors ARE called through
     the handle, by the rope, which is exactly why those counted and the wound did not. A wrap only
     sees calls that go through the thing you wrapped. */
  const T = { by:{}, ribs:{ byDoor:{}, n:0 }, doors:{}, calls:0, mine:0, theirs:0, theirsBy:{} };
  const snap = (dd) => {
    const m = new Map();
    for(const g of (dd.gladiators||[])) m.set("g"+g.id, g.injury ? g.injury.name : null);
    for(const h of (dd.rivals||[])) for(const f of (h.fighters||[])) m.set("f"+f.id, f.injury ? f.injury.name : null);
    return m;
  };
  const take = (before, dd, door) => {
    const after = snap(dd);
    for(const [k, now] of after){
      const was = before.get(k);
      if(!now || now === was) continue;
      T.calls++;
      const mine = k[0] === "g";
      if(mine) T.mine++; else { T.theirs++; T.theirsBy[now] = (T.theirsBy[now]||0)+1; }
      (T.by[now] = T.by[now] || {})[door + (mine ? "" : " (theirs)")] =
        ((T.by[now]||{})[door + (mine ? "" : " (theirs)")] || 0) + 1;
      if(now === "Cracked ribs"){ T.ribs.n++;
        T.ribs.byDoor[door + (mine ? "" : " (theirs)")] = (T.ribs.byDoor[door + (mine ? "" : " (theirs)")]||0)+1; }
    }
  };
  for(const door of ["doFight","doPairFight","doMelee","doVenatio"]){
    const f = A[door]; if(typeof f !== "function") continue;
    A[door] = function(dd, ...a){ T.doors[door] = (T.doors[door]||0)+1;
      const before = snap(dd);
      try { return f.call(this, dd, ...a); } finally { take(before, dd, door); } };
  }

  let houses = 0, weeks = 0;
  for(let h=0; h<H; h++){
    const d = A.newGameState("Ribs","clean",SEED+"-"+h, null); houses++;
    for(let w=0; w<W && !d.over; w++){ R.lanista(d, opts); weeks++; }
  }
  T.houses = houses; T.weeks = weeks;

  /* ---- AND THE DOOR ITSELF, DRIVEN STRAIGHT ----
     The played house tells you how often it happens; it cannot tell you WHY, because the mild door
     needs a win, a vitality under 45 and a 0.4 roll all at once and a house never separates them.
     Re-run real pairings through `simulateFight` under each tactic and count the branch the engine
     would take, in the order `doFight` tests it. */
  const pairs = [];
  { const d = A.newGameState("Pairs","clean",SEED+"-P", null);
    for(let w=0; w<60 && pairs.length < 40; w++){
      R.lanista(d);
      for(const o of ((d.games && d.games.offers)||[])){
        if(o.melee || o.pair || o.venatio || !o.opp) continue;
        const men = A.activeG(d); if(!men.length) continue;
        pairs.push([JSON.parse(JSON.stringify(men[0])), JSON.parse(JSON.stringify(o.opp))]);
        if(pairs.length >= 40) break;
      }
    }
  }
  const TACS = ["measured","aggressive","defensive","showboat"];
  const branch = {};
  const SIMS = 6000;
  for(const tac of TACS){
    const b = { sims:0, dead:0, sevDoor:0, mildDoor:0, mildAfterRoll:0, neither:0,
                mildFlank:0, sevFlank:0, ribs:0, wins:0, winLow:0, lostVB:[] };
    for(let i=0;i<SIMS && pairs.length;i++){
      const [a0,b0] = pairs[i % pairs.length];
      const a = JSON.parse(JSON.stringify(a0)), bb = JSON.parse(JSON.stringify(b0));
      a.mods = null; bb.mods = null;
      let res = null;
      try { res = A.simulateFight(a, bb, tac, "standard", {}, {}); } catch(e){ continue; }
      if(!res) continue;
      b.sims++;
      if(res.aDies){ b.dead++; continue; }
      const win = res.winner === "A";
      if(win) b.wins++;
      if(win && res.vA < 45) b.winLow++;
      /* ---- AND THE MAN ACROSS THE SAND, WHOSE WOUND IS HARDCODED MILD ----
         `doFight`'s last branch is `f.injury = injuryFor(res.lastTarget, false)` — the beaten
         opponent ALWAYS gets the lighter wound, where your own man in the same state gets the
         heavier one. Both cracked ribs in a played house went to him. So: what vitality is he
         actually on when he loses? */
      if(win && !res.bDies && typeof res.vB === "number") b.lostVB.push(Math.round(res.vB));
      const t = res.lastTarget;
      if(!win && res.fell){ b.sevDoor++; if(t==="flank") b.sevFlank++; }
      else if(win && res.vA < 45){ b.mildDoor++;
        if(Math.random() < 0.4){ b.mildAfterRoll++; if(t==="flank"){ b.mildFlank++; b.ribs++; } } }
      else b.neither++;
    }
    branch[tac] = b;
  }
  T.branch = branch; T.pairs = pairs.length;

  /* ---- AND THE TWO ENGINES THAT HARDCODE `severe = true` ----
     `doMelee` and `doPairFight` call `injuryFor(pick(TARGETS)[0], true)`. Neither engine returns a
     lastTarget, so the random target is honest — but both DO carry the man's vitality at the moment
     he goes down (`ents[i].hpv`, `res.hp.A[i]`) and both throw it away. The file's own convention
     for severity is low vitality: `doVenatio` uses `res.vA < 40`. So the question a fix turns on is
     what that vitality actually IS when a man goes down in a melee or a pairing — if they are all
     under 40 the hardcoded `true` is telling the truth and there is nothing to fix. */
  const downHp = { melee:[], pair:[] };
  const dctx = A.newGameState("Ctx","clean",SEED+"-C", null);
  try {
    for(let i=0;i<400 && pairs.length;i++){
      const [a0,b0] = pairs[i % pairs.length];
      const cp = x => JSON.parse(JSON.stringify(x));
      /* `simulatePair` reads `ctx.d` for the assist multiplier — `{}` threw on `.ties` and the
         first run printed "could not be driven" where the fixture, not the engine, was wrong. */
      const r = A.simulatePair([cp(a0), cp(a0)], [cp(b0), cp(b0)], "measured", "standard",
        { d: dctx, favor:0, street:"", tier:1, tie:null, patron:null, guarded:false }, {});
      if(r && r.down && r.hp) for(let j=0;j<2;j++) if(r.down.A[j]) downHp.pair.push(Math.round(r.hp.A[j]));
    }
  } catch(e){ downHp.pairErr = String(e.message).slice(0,90); }
  try {
    for(let i=0;i<400 && pairs.length;i++){
      const [a0,b0] = pairs[i % pairs.length];
      const cp = x => JSON.parse(JSON.stringify(x));
      const r = A.simulateMelee([cp(a0), cp(a0), cp(a0)], [cp(b0), cp(b0), cp(b0)], "measured", {}, {});
      const es = (r && (r.ents || (r.beats && r.beats.length && r.beats[r.beats.length-1].ents))) || null;
      if(Array.isArray(es)) for(const e of es) if(e && e.out && !e.dead && typeof e.hpv === "number") downHp.melee.push(Math.round(e.hpv));
    }
  } catch(e){ downHp.meleeErr = String(e.message).slice(0,90); }
  T.downHp = downHp;
  return { T, rope:R.say() };
}, [H, W, SEED, ARM]);

await browser.close(); server.close();
if(out.fatal){ console.log("FATAL: " + out.fatal); process.exit(1); }
const T = out.T, pc = (n,dd) => dd ? (n/dd*100).toFixed(2)+"%" : "-";

console.log(`=== ${T.houses} houses x ${W} weeks · ${T.weeks} house-weeks · ${T.calls} wounds dealt, at the bout`);
console.log(`  doors entered: ${Object.entries(T.doors).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
console.log(`  whose wounds: yours ${T.mine} · the men across the sand ${T.theirs}`);
{ const ps = (T.by["Pierced side"]||{}), cr = (T.by["Cracked ribs"]||{});
  const sum = o => Object.values(o).reduce((s,x)=>s+x,0);
  console.log(`  the flank, the only target with two wounds: severe -> Pierced side ${sum(ps)} · MILD -> Cracked ribs ${sum(cr)}`); }
console.log(`\n  every wound, by the door that dealt it and how severe it was asked for:`);
const tot = T.calls || 1;
for(const i of INJ){
  const rows = T.by[i.name] || {};
  const n = Object.values(rows).reduce((s,x)=>s+x,0);
  console.log(`  ${i.name.padEnd(16)} ${String(n).padStart(5)}  ${pc(n,tot).padStart(7)}   ${Object.entries(rows).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "never dealt"}`);
}
const other = Object.keys(T.by).filter(k=>!INJ.some(i=>i.name===k));
if(other.length) console.log(`  (not in the table: ${other.join(", ")})`);
console.log(`\n  Cracked ribs: ${T.ribs.n} of ${T.calls} — ${pc(T.ribs.n,tot)}${T.ribs.n ? `  via ${Object.entries(T.ribs.byDoor).map(([k,v])=>`${k} ${v}`).join(" · ")}` : ""}`);

console.log(`\n  === THE FALSIFIER: the four tactics, ${T.pairs} real pairings re-run straight ===`);
console.log(`  ${"tactic".padEnd(11)} ${"sims".padStart(6)} ${"died".padStart(6)} ${"won".padStart(6)} ${"won&vA<45".padStart(10)} ${"severe door".padStart(12)} ${"MILD door".padStart(10)} ${"after .4".padStart(9)} ${"flank".padStart(6)} ${"ribs".padStart(6)}`);
for(const [tac,b] of Object.entries(T.branch)){
  console.log(`  ${tac.padEnd(11)} ${String(b.sims).padStart(6)} ${String(b.dead).padStart(6)} ${String(b.wins).padStart(6)} ${String(b.winLow).padStart(10)} ${String(b.sevDoor).padStart(12)} ${String(b.mildDoor).padStart(10)} ${String(b.mildAfterRoll).padStart(9)} ${String(b.mildFlank).padStart(6)} ${String(b.ribs).padStart(6)}`);
}
const best = Object.entries(T.branch).sort((a,b)=>b[1].ribs-a[1].ribs)[0];
if(best) console.log(`\n  >>> best tactic for the mild door is ${best[0]}: ${best[1].ribs} ribs in ${best[1].sims} bouts — ${pc(best[1].ribs,best[1].sims)} of bouts fought.`);
console.log(`      #191 FALSIFIES if a tactic lifts it to a visible share of ALL WOUNDS.`);
const q = (a,f)=>{ if(!a.length) return "-"; const z=[...a].sort((x,y)=>x-y); return z[Math.min(z.length-1,Math.floor(z.length*f))]; };
{ const bb = T.branch.measured || {};
  const a = bb.lostVB || [];
  const under = a.filter(x=>x<45).length;
  console.log(`\n  === THE MAN ACROSS THE SAND, WHOSE WOUND IS HARDCODED MILD ===`);
  console.log(`  ${a.length} opponents beaten without dying · vitality p10 ${q(a,.1)} · median ${q(a,.5)} · p90 ${q(a,.9)}`);
  console.log(`  ${under} of ${a.length} (${pc(under,a.length)}) are under 45 — the same bar your own man's mild wound needs —`);
  console.log(`  and every one of them is handed the LIGHTER wound, while your man in that state gets the heavier.`); }
console.log(`\n  === THE TWO ENGINES THAT HARDCODE severe = true ===`);
for(const k of ["melee","pair"]){
  const a = T.downHp[k] || [];
  const err = T.downHp[k+"Err"];
  if(err){ console.log(`  ${k.padEnd(6)} could not be driven: ${err}`); continue; }
  const under = a.filter(x=>x<40).length;
  console.log(`  ${k.padEnd(6)} ${a.length} men went down · vitality p10 ${q(a,.1)} · median ${q(a,.5)} · p90 ${q(a,.9)}`);
  console.log(`         ${under} of ${a.length} (${pc(under,a.length)}) are under 40, which is the threshold \`doVenatio\` already uses —`);
  console.log(`         so ${pc(a.length-under,a.length)} of them are being called SEVERE while the engine knows they are not.`);
}
console.log(`\n  rope: ${out.rope}`);
