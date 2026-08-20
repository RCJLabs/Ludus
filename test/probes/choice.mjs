/* #170 — WHAT EVERY BUTTON AT THE SAND IS WORTH, ON ONE SCALE

   #170 says the entrance's `mom:1` is worth +8.4 points of win rate against a band this file sets
   for a TRAIT — "a trait is worth three to six points here" — and it was opened with its own
   falsification: *falsifies if the trait band is not the right comparison. A trait is a fact about a
   man and an entrance is a decision the player makes every week, and a decision may be allowed to
   be worth more than a fact. In which case the answer is that the other three words are too small.*

   The only way to settle that is to price the whole class the entrance belongs to, on one fixture,
   in one run. A player standing at the rail decides four things and no more:

       the tactic     measured · aggressive · defensive · showboat
       the entrance   none · showman · grim · boxes
       the plan       none · outlast · reach · wait · crowd · press   (and whether it READS him)
       the word       press · cover · finish · legs · breather · rouse · milk, when the bout stops

   Everything here goes in through `doFight`'s own arguments. Nothing patches the engine.

   THE FIXTURE is #166's, and it is the card rather than the mirror ON PURPOSE: twins share a renown,
   which makes `mobClear` false in every bout and hands the crowd's peak to whoever has momentum by
   construction, so a mirror inflates exactly the term under test. The opponent comes from
   `pickRivalOpp`, the tier from the game's own band table, and the renown gap is walked so no arm
   sits in one band.

   INSTRUMENT NOTES:
   · every arm shares the seed set bout for bout, and carries a signature — my man's six stats and
     pfame, the opponent's name, class, stats, pfame and tier, taken BEFORE the fight because a bout
     mutates both men. If two arms did not meet the same men the numbers below are noise.
   · a `when(cx)` on a crux order means the word is not always on the menu. Every arm records how
     often it had to fall back to `press`, and an arm that fell back most of the time says so.
   · the plan's worth depends on reading him right, so `plan:right` picks the plan whose tell
     actually matches this opponent and `plan:wrong` deliberately picks one that does not.

   Usage: node test/probes/choice.mjs [N per arm] [seed]
*/
import { serve, open } from "../harness.mjs";
const N = +(process.argv[2] || 150), SEED = process.argv[3] || "CHO";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([N,SEED])=>{
  const A = window.__LVDVS;
  const avg = f => A.STATS.reduce((s,k)=>s+(f[k]||0),0)/6;
  const TBANDS = [[22,46],[38,60],[54,76],[66,99]];
  const GAPS = [-160,-70,-25,-6,0,6,25,70,160], BASES = [25, 70, 160];

  /* the card, exactly as #166 settled it */
  const card = (d, i) => {
    const g = A.genGladiator(d, A.qForStat(52 + (i % 6) * 8));
    g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99;
    g.wins = 2 + (i % 9); g.losses = i % 4;
    d.gladiators.push(g);
    const a = avg(g);
    let tier = 3; for(let t=0;t<4;t++) if(a >= TBANDS[t][0] && a <= TBANDS[t][1]){ tier = t; break; }
    tier = Math.min(3, tier + (i % 2));
    const pr = A.pickRivalOpp(d, tier);
    const want = GAPS[i % GAPS.length], base = BASES[Math.floor(i / GAPS.length) % 3];
    pr.opp.pfame = Math.max(0, Math.round(base + want/2));
    g.pfame       = Math.max(0, Math.round(base - want/2));
    const o = { id:d.nextId++, tier, festival:"a bench", opp:pr.opp, oppRef:pr.ref,
      stakes:"standard", purse:700 };
    d.games = { festival:"x", offers:[o], week:d.week };
    return { g, o };
  };
  const sigOf = (g, o) => [A.STATS.map(k=>g[k]).join("."), Math.round(g.pfame||0),
    o.opp.name, o.opp.cls, A.STATS.map(k=>o.opp[k]).join("."), Math.round(o.opp.pfame||0), o.tier].join("|");

  /* which plan actually reads this man, and which certainly does not */
  const planFor = (opp, want) => {
    const hit = A.PLAN_KEYS.filter(k => A.PLANS[k].tell
      && A.TELL_KEYS.some(t => A.TELLS[t].plan === k && (()=>{ try { return A.TELLS[t].when(opp); } catch(e){ return false; } })()));
    if(want === "right") return hit[0] || null;
    const miss = A.PLAN_KEYS.filter(k => A.PLANS[k].tell && hit.indexOf(k) < 0);
    return miss[0] || null;
  };

  /* one arm: N bouts of one decision, on one seed prefix. It returns a ROW A BOUT, because two of
     the four classes cannot be read off an average: a crux order is only on the menu when its own
     `when(cx)` allows, and a plan is only a read when it actually reads him. An arm that gave its
     word on a third of the stops is two thirds an arm about `press`. */
  const cell = (kind, key, pre) => {
    const rows = [], sig = [];
    for(let i=0;i<N;i++){
      const d = A.newGameState("Ch","clean",`${pre}-C-${i}`,null);
      d.week = 60; d.fame = 900; d.gold = 60000;
      const { g, o } = card(d, i);
      let tactic = "measured", entrance = null, plan = "none", word = "press";
      if(kind === "tactic")   tactic = key;
      if(kind === "entrance") entrance = key;
      if(kind === "word")     word = key;
      let read = null;
      if(kind === "plan"){
        plan = (key === "right" || key === "wrong") ? (planFor(o.opp, key) || "none") : key;
        read = A.planEffect(plan, o.opp).right;
      }
      o.entrance = entrance;
      sig.push(sigOf(g, o));
      let res = A.doFight(d, g.id, o, tactic, null, null, null, plan);
      let stops = 0, gave = 0, fell = 0, n = 0;
      while(res && res.crux && n < 4){
        const pd = res.pending; pd.beats = res.beats; n++; stops++;
        const cx = pd.crux || {};
        const C = A.CRUX[word];
        let say = word;
        if(!C || (C.when && !(()=>{ try { return C.when(cx); } catch(e){ return false; } })())){
          say = "press"; fell++;
        } else gave++;
        res = A.doFight(d, pd.gid, pd.offer, pd.tactic, pd.bet, pd, say);
        if(!res || res.__err) break;
      }
      if(!res || res.__err || res.crux){ sig.pop(); continue; }
      rows.push({ i, win:!!res.win, dead:!!res.dead, stops, gave, fell, read });
    }
    return { kind, key, pre, rows, sig: sig.join("~") };
  };

  const PRE = [`${SEED}-a`, `${SEED}-b`, `${SEED}-c`, `${SEED}-d`];
  const arm = (kind, key) => PRE.map(pre => cell(kind, key, pre));

  /* the two halves of `showman`, added to ENTRANCES and deliberately NOT to ENTRANCE_KEYS, so the
     game cannot reach them and the panel still shows four buttons. Each keeps the wind cost and the
     two fame; each drops one of the pair. */
  A.ENTRANCES.abCrowd = { name:"the mob only", crowd:A.ENTRANCES.showman.crowd, wind:A.ENTRANCES.showman.wind, fame:A.ENTRANCES.showman.fame };
  A.ENTRANCES.abMom   = { name:"the moment only", wind:A.ENTRANCES.showman.wind, fame:A.ENTRANCES.showman.fame, mom:A.ENTRANCES.showman.mom };
  /* the word as it shipped in v3.59.0. Its cost was a FLAT five off his wind, which on a scale of
     55 to 114 is four to nine per cent of it, so `wind:0.05` is the faithful reproduction — and
     `stam` is not read by the engine any more, so writing it here would be no cost at all. */
  A.ENTRANCES.abFree  = { name:"the old word", crowd:A.ENTRANCES.showman.crowd, fame:A.ENTRANCES.showman.fame, mom:A.ENTRANCES.showman.mom, wind:0.05 };

  const rows = [];
  rows.push({ kind:"base", key:"nothing chosen", cells: arm("tactic", "measured") });
  for(const k of ["aggressive","defensive","showboat"]) rows.push({ kind:"tactic", key:k, cells: arm("tactic", k) });
  for(const k of A.ENTRANCE_KEYS) if(k !== "none") rows.push({ kind:"entrance", key:k, cells: arm("entrance", k) });
  for(const k of ["abCrowd","abMom","abFree"]) rows.push({ kind:"entrance", key:k, cells: arm("entrance", k) });
  for(const k of A.PLAN_KEYS) if(k !== "none") rows.push({ kind:"plan", key:k, cells: arm("plan", k) });
  for(const k of ["right","wrong"]) rows.push({ kind:"plan", key:"the read: "+k, cells: arm("plan", k) });
  for(const k of Object.keys(A.CRUX)) if(k !== "press" && k !== "cloth")
    rows.push({ kind:"word", key:k, cells: arm("word", k) });

  /* ---- AND THE SWEEP THE DECISION NEEDS ----
     `engines` holds a rule this file already believes: "nothing may be clearly best on both axes at
     once — that is what made this a non-choice." Within the entrance class `showman` is exactly
     that, best at winning AND best at keeping him alive. Its blurb bills a cost — "strutting is not
     resting" — and the 5 wind behind that phrase measures at nothing. This walks the cost and prints
     both axes, so the number is picked against the stated rule instead of chosen. */
  const sweep = [];
  {
    const was = A.ENTRANCES.showman.wind;
    for(const st of [0.05, 0.10, 0.15, 0.20, 0.24, 0.28, 0.35]){
      A.ENTRANCES.showman.wind = st;
      const cells = PRE.map(pre => cell("entrance", "showman", pre));
      const rows2 = cells.flatMap(c=>c.rows);
      const lost = rows2.filter(x=>!x.win);
      sweep.push({ st, n:rows2.length,
        pct: rows2.length ? rows2.filter(x=>x.win).length/rows2.length*100 : null,
        spared: lost.length ? (lost.length - lost.filter(x=>x.dead).length)/lost.length*100 : null });
    }
    A.ENTRANCES.showman.wind = was;
  }

  return { rows, N, PRE, sweep, TRAITS:A.WORLD_TRAITS || [] };
}, [N, SEED]);

/* ---------------- report ---------------- */
const f = (v, n=1) => v == null ? "  —  " : v.toFixed(n).padStart(6);
const flat = r => r.cells.flatMap(c=>c.rows.map(x=>Object.assign({ pre:c.pre }, x)));
const rate = rs => rs.length ? rs.filter(x=>x.win).length / rs.length * 100 : null;
const spare = rs => { const l = rs.filter(x=>!x.win); return l.length ? (l.length - l.filter(x=>x.dead).length)/l.length*100 : null; };

/* instrument first: every arm must have met the same men */
const base = out.rows[0];
let paired = true;
for(const r of out.rows) for(let i=0;i<r.cells.length;i++)
  if(r.cells[i].sig !== base.cells[i].sig) paired = false;

const baseRows = flat(base);
const baseBy = {}; for(const x of baseRows) baseBy[`${x.pre}#${x.i}`] = x;
const B = { pct: rate(baseRows), spared: spare(baseRows), n: baseRows.length };

/* the paired delta over a SUBSET of bouts, taken on both sides of the same seeds */
const delta = (rs, keep) => {
  const mine = keep ? rs.filter(keep) : rs;
  const theirs = mine.map(x=>baseBy[`${x.pre}#${x.i}`]).filter(Boolean);
  if(!mine.length || !theirs.length) return null;
  return { n: mine.length, mine: rate(mine), theirs: rate(theirs), d: rate(mine) - rate(theirs) };
};

console.log(`\n#170 — WHAT EVERY BUTTON AT THE SAND IS WORTH   (${out.N} bouts an arm a prefix, ${out.PRE.length} prefixes)\n`);
console.log(`  INSTRUMENT: every arm met the same men, bout for bout — ${paired ? "YES" : "NO — THE NUMBERS BELOW ARE NOISE"}`);
console.log(`  the same man, the same card, nothing chosen: ${f(B.pct)}% won, ${f(B.spared)}% spared when he went down  (${B.n} bouts)`);
const stops = baseRows.filter(x=>x.stops > 0).length;
console.log(`  the bout came to the balance at least once on ${(stops/B.n*100).toFixed(1)}% of them\n`);

console.log(`  class      the button              won      against nothing   spared    and when the button was ACTUALLY AVAILABLE`);
let last = null;
for(const r of out.rows.slice(1)){
  const rs = flat(r);
  const all = delta(rs);
  if(r.kind !== last){ console.log(""); last = r.kind; }
  let cond = "";
  if(r.kind === "word"){
    const c = delta(rs, x=>x.stops > 0 && x.fell === 0);
    const gaveAny = rs.filter(x=>x.gave > 0).length;
    cond = c ? `  ${(c.d>=0?"+":"")}${c.d.toFixed(1)} over the ${c.n} bouts it could be given at every stop`
      : `  never on the menu at all (${gaveAny} bouts)`;
  } else if(r.key === "the read: right" || r.key === "the read: wrong"){
    const want = r.key.endsWith("right");
    const c = delta(rs, x=>x.read === want);
    cond = c ? `  ${(c.d>=0?"+":"")}${c.d.toFixed(1)} over the ${c.n} bouts the read was ${want?"right":"wrong"}` : "";
  }
  console.log(`  ${r.kind.padEnd(10)} ${r.key.padEnd(22)} ${f(all.mine)}%  ${(all.d>=0?"+":"")}${all.d.toFixed(1).padStart(5)} points`
    + `   ${f(spare(rs))}%${cond}`);
}

console.log(`\n  WHAT EACH CLASS OF DECISION IS WORTH, against choosing nothing`);
console.log(`  class      best button              best      the whole spread, worst to best`);
for(const kind of ["tactic","entrance","plan","word"]){
  const rs = out.rows.filter(r=>r.kind === kind)
    .map(r=>({ key:r.key, d:(delta(flat(r))||{}).d })).filter(r=>r.d != null);
  if(!rs.length) continue;
  rs.sort((a,b)=>b.d-a.d);
  const best = rs[0], worst = rs[rs.length-1];
  console.log(`  ${kind.padEnd(10)} ${best.key.padEnd(22)} ${(best.d>=0?"+":"")}${best.d.toFixed(1).padStart(6)} points`
    + `   ${worst.d.toFixed(1)} to ${best.d.toFixed(1)}  (${(best.d-worst.d).toFixed(1)} wide)`);
}
console.log(`\n  and the band this file sets for a TRAIT, in its own words: three to six points.`);

/* the entrance class on both axes, and the cost that would settle it */
const AB = ["abCrowd","abMom","abFree"];
const entRows = out.rows.filter(r=>r.kind === "entrance").map(r=>({ key:r.key, rs:flat(r) }));
const realEnt = entRows.filter(e=>AB.indexOf(e.key) < 0);
const noneRs = baseRows;
console.log(`\n  THE ENTRANCE CLASS ON BOTH AXES — \`engines\` holds that nothing may be clearly best on both`);
console.log(`  word          won      spared when he went down`);
console.log(`  ${"none".padEnd(12)} ${f(rate(noneRs))}%   ${f(spare(noneRs))}%`);
for(const e of entRows) console.log(`  ${e.key.padEnd(12)} ${f(rate(e.rs))}%   ${f(spare(e.rs))}%`);
/* the band every OTHER decision in the game occupies, measured in this same run */
const bestElse = Math.max(...["tactic","plan","word"].flatMap(kind =>
  out.rows.filter(r=>r.kind === kind).map(r=>(delta(flat(r))||{d:-99}).d)));
console.log(`\n  WALKING THE WIND THAT ITS BLURB ALREADY BILLS`);
console.log(`  the best any OTHER decision in the game offers is ${(bestElse>=0?"+":"")}${bestElse.toFixed(1)} points`);
console.log(`  wind        won      against nothing   spared    inside that band?`);
/* the rest of the CLASS — the three words the game actually offers, not the ablation arms */
const bestOtherSpare = Math.max(...realEnt.filter(e=>e.key !== "showman").map(e=>spare(e.rs)), spare(noneRs));
const bestOtherWin  = Math.max(...realEnt.filter(e=>e.key !== "showman").map(e=>rate(e.rs)), rate(noneRs));
for(const w of out.sweep){
  const inBand = (w.pct - B.pct) <= bestElse + 0.05;
  const both = w.pct > bestOtherWin && w.spared > bestOtherSpare;
  console.log(`  ${(w.st*100).toFixed(0).padStart(4)}%  ${f(w.pct)}%  ${((w.pct-B.pct)>=0?"+":"")}${(w.pct-B.pct).toFixed(1).padStart(5)} points`
    + `   ${f(w.spared)}%   ${inBand ? "yes" : "NO — larger than anything else a player can choose"}`
    + (both ? "  (and best on both axes of its own class)" : ""));
}
console.log(`  (the rest of the class tops out at ${bestOtherWin.toFixed(1)}% won and ${bestOtherSpare.toFixed(1)}% spared)`);
console.log();

await browser.close();
server.close();
