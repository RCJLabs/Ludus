/* THE OFFER PANEL'S NUMBER FOR A STRANGE TOWN, AGAINST WHAT THE SAND DOES — #160

   #160 listed six as dark: `baySince`, `bayStandard`, `bayWorth`, `cityAfter`, `cityCustom`,
   `cityTier`, and its falsification was that `coast` reaches them through the tour. Reading the two
   checks that own this ground, that is largely true and the item is thinner than it looked:
   `coast` drives `cityAfter` and `cityCustom` through `doFight` and asserts their effects, and `bay`
   tours all three towns, holds `knownIn` against `BAY_DECAY`, both scales, the rival taking the bay
   and turning up to take it back. Four of the six are covered in behaviour if not by name.

   What neither reaches is a CLAIM. `bayWorth(d,key).strangerMercy` is printed on the offer panel for
   any town the house is unknown in:

       "A stranger there. A man of yours who goes down is spared about N% of the time,
        against every time at home."

   and it is a fixed transform of the missio penalty —

       strangerMercy = 100 − max(0, 19 − knownIn·0.19) · 2.6        [src, bayWorth]
       the engine's term:  strange = max(0, 19 − knownIn·0.19) · docStrange(d)   [src, simCtx]

   The engine subtracts those points from a missio SCORE and puts the score through `missioOdds`,
   which is a logistic; the panel multiplies them by 2.6 and calls the result a percentage. A fixed
   factor can be right at one place on that curve and nowhere else, and the panel's version also
   drops `docStrange`, the doctrine multiplier. This is #150's, #162's and #165's shape on a fifth
   panel: a number the player reads that the engine does not roll.

   AND THE SECOND HALF OF THE SENTENCE IS ITS OWN CLAIM. "against every time at home" says a beaten
   man in Capua is ALWAYS spared. The missio is a probability, so that is either true by some margin
   nobody has measured or it is simply wrong.

   INSTRUMENT NOTES:
   · the spare rate is counted over LOSSES, not over bouts — "spared" is conditional on going down,
     which is what the sentence says. A rate over all bouts would move with the win rate and read as
     a difference between towns when it was a difference between opponents.
   · mirrored men, a fresh state per bout. `odds` lost four probes to one fighter reused across
     hundreds of bouts because `lasting`, `strain`, `form`, `wear`, `scars`, `regard` and `defiance`
     accumulate where the six stats do not.
   · the home arm and the away arm draw the SAME opponent quality, so the only difference is where
     the afternoon happened.
   · three seed prefixes on the played arms.

   WHAT IT FOUND. The panel printed ONE number for three towns the sand puts thirty-five points
   apart, and the second half of its sentence was simply untrue:

       a man of yours put down, spared      panel said      Pompeii      Neapolis     Puteoli
       a town that has never seen you          51%        55.3/68.5%   90.0/88.0%   77.6/81.4%
       a town that knows you at 50             75%        75.3/79.4%   92.2/97.5%   85.1/92.9%
       and at home, "against every time"        —                  94.8% and 92.4%

   `cityCustom`'s own missio line is −7 at Pompeii, +10 at Neapolis and +2 at Puteoli, which is
   exactly the spread `bayWorth` was throwing away by reading `knownIn` alone. After the repair the
   panel reads 50/77/66 at a standing of nought and 92 at home, in the right order and erring low —
   which is the safe direction when the number is a man's life.

   THE OTHER FIVE ARE COVERED IN BEHAVIOUR AND WERE WORTH DRIVING ANYWAY. `bayStandard` climbs
   81.4 → 99.0 with the best man in the bay and the circuit's top rung follows 82 → 94 while its
   bottom rung stays 34, which is the floor the opening depends on. `cityTier` bands at 30 and 60.
   `baySince` reads 40 for a holder since week 80 in week 120 and 0 with nobody holding it.
   `cityAfter` credits standing, the magistrate and the home house's temper on one call.

   AND THE ROAD ITSELF: 18 houses over 420 weeks with the ledger held up, the deliberate tourist
   reaches `bayWide` in 18 of 18 at a median week 48 and pegs all three towns at 93-100; the rope's
   reactive `road` policy reaches it in 6 of 18; a house that never leaves reaches nought of 180 and
   forfeits the whole 150-fame cut off the Rome bar. Nine of the eighteen tourists ended in rebellion,
   which is recorded and not barred — `bay`'s own head already measured that a touring house lives
   LONGER than a homebound one once the cells are walked. */
import { serve, open } from "../harness.mjs";
const N = +(process.argv[2] || 200), SEED = process.argv[3] || "BAY";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([N,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const mean = f => A.STATS.reduce((s,k)=>s+(f[k]||0),0)/6;

  /* ============ ARM A: THE PANEL'S NUMBER AGAINST THE SAND ============ */
  const state = (seed, city) => {
    const d = A.newGameState("Bw","clean",seed,null);
    d.fame = 900; d.gold = 60000; d.week = 60;
    if(city){ d.city = city; d.flags.cityArrived = d.week; }
    return d;
  };
  const twin = (d, m) => {
    const opp = A.genOpponent(2, A.qForStat(m));
    for(const k of A.STATS) opp[k] = Math.round(Math.min(99, m));
    opp.kit = A.kitFor(opp.cls, 2);
    const g = A.genGladiator(d, A.qForStat(m));
    for(const k of A.STATS) g[k] = opp[k];
    g.cls = opp.cls; g.kit = opp.kit; g.traits = (opp.traits||[]).slice();
    g.heart = opp.heart; g.morale = opp.morale; g.pfame = opp.pfame; g.wins = opp.wins||0;
    g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99;
    d.gladiators.push(g);
    return { g, opp };
  };
  const bout = (seed, city, known, m) => {
    const d = state(seed, city);
    if(city && known != null){ d.known = d.known || {}; d.known[city] = known; }
    const { g, opp } = twin(d, m);
    const o = { id:d.nextId++, tier:2, festival: city ? "the town's card" : "a bench", opp,
      oppRef:null, rematch:false, grudgeM:false, stakes:"standard", purse:600, city: city || undefined };
    d.games = { festival:"x", offers:[o], week:d.week };
    let res = A.doFight(d, g.id, o, "measured", null, null, null, "none");
    if(res && res.crux) res = R.answer(d, res, "press").res;
    if(!res || res.crux || res.__err) return null;
    return { win:!!res.win, dead:!!res.dead };
  };
  const cell = (tag, city, known, m) => {
    let ran = 0, lost = 0, died = 0;
    for(let i=0;i<N;i++){
      const r = bout(`${SEED}-${tag}-${i}`, city, known, m);
      if(!r) continue;
      ran++; if(!r.win){ lost++; if(r.dead) died++; }
    }
    return { ran, lost, died, spared: lost ? (lost-died)/lost*100 : null };
  };
  const panel = (()=>{ const d = state(`${SEED}-panel`, null);
    const out = {};
    for(const k of A.CITY_KEYS){
      out[k] = {};
      for(const kn of [0, 20, 50, 100]){ d.known = d.known || {}; d.known[k] = kn;
        const w = A.bayWorth(d, k); out[k][kn] = `${w.mercyHere}% (home ${w.mercyHome}%)`; }
    }
    return out; })();

  const sand = [];
  for(const m of [70, 84]){
    sand.push({ where:"Capua", known:null, m, ...cell(`H-${m}`, null, null, m) });
    for(const k of A.CITY_KEYS)
      for(const kn of [0, 50])
        sand.push({ where:k, known:kn, m, ...cell(`A-${k}-${kn}-${m}`, k, kn, m) });
  }

  /* ============ ARM B: THE SIX, DRIVEN ============ */
  const six = (()=>{
    const o = {};
    { const d = state(`${SEED}-since`, null);
      d.week = 120; d.bay = { holder:"Ampliatus", since:80, weeks:40 };
      o.since = { held:A.baySince(d), holder:A.bayHolder(d),
        none:(()=>{ const q = A.clone(d); q.bay = null; return { s:A.baySince(q), h:A.bayHolder(q) }; })() }; }
    { const d = state(`${SEED}-std`, null);
      const base = A.bayStandard(d);
      const rows = [{ best:Math.round(Math.max(0, ...A.activeG(d).map(mean))), std:+base.toFixed(1),
        q:[0,1,2,3].map(t=>A.circuitQuality(d,t)) }];
      for(const v of [70, 85, 99]){
        const q = A.clone(d);
        A.activeG(q).forEach(g=>{ for(const k of A.STATS) g[k] = v; });
        rows.push({ best:v, std:+A.bayStandard(q).toFixed(1), q:[0,1,2,3].map(t=>A.circuitQuality(q,t)) });
      }
      o.std = rows; }
    { const d = state(`${SEED}-worth`, null);
      o.worth = A.CITY_KEYS.map(k=>{ const rows = [];
        for(const kn of [0, 30, 60, 100]){ d.known = d.known || {}; d.known[k] = kn;
          const w = A.bayWorth(d, k);
          rows.push({ kn, purse:w.purse, known:w.known, mercy:w.mercyHere, home:w.mercyHome, rusting:w.rusting, tier:A.cityTier(d,k) }); }
        return { k, rows }; });
      o.worthNull = A.bayWorth(d, "nowhere"); }
    { o.custom = A.CITY_KEYS.map(k=>{ const C = A.cityCustom(k);
        return { k, name:C && C.name, wants:C && C.wants, crowd:C && C.crowd, purse:C && C.purse, missio:C && C.missio }; });
      o.customNull = A.cityCustom("nowhere"); }
    { const d = state(`${SEED}-after`, null, null);
      d.city = "pompeii"; d.flags.cityArrived = d.week;
      const { g, opp } = twin(d, 78);
      const off = { id:d.nextId++, tier:2, festival:"the town's card", opp, oppRef:null,
        stakes:"sine", purse:600, city:"pompeii" };
      const P0 = { ...A.bayPol(d, "pompeii") };
      const kn0 = A.knownIn(d, "pompeii");
      const sum = [];
      A.cityAfter(d, off, { won:true, theirDead:true, spared:false, crowd:80, vigour:70 }, sum);
      const P1 = A.bayPol(d, "pompeii");
      o.after = { kn0, kn1:+A.knownIn(d,"pompeii").toFixed(1),
        fav0:+P0.favor.toFixed(1), fav1:+P1.favor.toFixed(1),
        grudge0:P0.grudge, grudge1:P1.grudge, fought:P1.fought, said:sum.length,
        served:A.cityServed(d, "pompeii", off, { won:true, theirDead:true, spared:false, crowd:80, vigour:70 }) };
      /* and the same afternoon at a town that wanted something else */
      const e = state(`${SEED}-after2`, "neapolis");
      const t2 = twin(e, 78);
      const off2 = { id:e.nextId++, tier:2, festival:"x", opp:t2.opp, oppRef:null, stakes:"sine", purse:600, city:"neapolis" };
      const s2 = [];
      const q0 = A.bayPol(e, "neapolis").favor;
      A.cityAfter(e, off2, { won:false, theirDead:false, spared:true, crowd:80, vigour:40 }, s2);
      o.after2 = { fav0:+q0.toFixed(1), fav1:+A.bayPol(e,"neapolis").favor.toFixed(1),
        served:A.cityServed(e, "neapolis", off2, { won:false, theirDead:false, spared:true, crowd:80, vigour:40 }) }; }
    { const d = state(`${SEED}-tier`, null);
      o.tier = [0, 29, 30, 59, 60, 100].map(kn=>{ d.known = { pompeii:kn }; return { kn, tier:A.cityTier(d,"pompeii") }; }); }
    return o;
  })();

  /* ============ ARM C: WHAT A PLAYED HOUSE'S ROAD LOOKS LIKE ============ */
  const roads = [];
  for(const [nm, opts] of [["as it plays (road)", {}], ["deliberately touring", { tour:true }], ["never leaves", { road:false }]]){
    const houses = [];
    for(const pre of [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`]){
      for(let h=0; h<6; h++){
        const d = A.newGameState("Rd"+h, "clean", `${pre}-${h}`, null);
        let awayWk = 0, wide = null, peak = 0;
        const tierWk = { 1:0, 2:0, 3:0 };
        for(let w=0; w<420; w++){
          if(d.over) break;
          d.gold = Math.max(d.gold, 200000);        /* the road, not solvency */
          R.lanista(d, opts);
          if(!d.lanista) break;
          if(d.city) awayWk++;
          peak = Math.max(peak, A.bayKnownTotal(d));
          if(wide == null && A.bayWide(d)) wide = d.week;
          for(const k of A.CITY_KEYS) tierWk[A.cityTier(d,k)]++;
        }
        houses.push({ pre, h, end:d.week, over:d.over?d.over.kind:"alive",
          awayWk, wide, peak:Math.round(peak), tierWk,
          known:Object.fromEntries(A.CITY_KEYS.map(k=>[k, Math.round(A.knownIn(d,k))])),
          total:Math.round(A.bayKnownTotal(d)), cut:A.bayRomeCut ? A.bayRomeCut(d) : null,
          holder:A.bayHolder(d), since:A.baySince(d) });
      }
    }
    roads.push({ nm, houses });
  }

  return { panel, sand, six, roads };
}, [N, SEED]);

const f1 = x => x==null ? "—" : (+x).toFixed(1);
const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : null; };

console.log(`\n  ARM A — the panel's stranger-mercy against the sand, ${N} bouts a cell, mirrored men\n`);
console.log(`  what the panel prints, by town and local standing:`);
for(const [k,v] of Object.entries(out.panel))
  console.log(`    ${k.padEnd(10)} ` + Object.entries(v).map(([kn,m])=>`known ${kn} → ${m}%`).join(" · "));
console.log(`\n  and what the sand did:`);
console.log(`  where        known   men     bouts   lost   died   spared when he went down`);
for(const s of out.sand)
  console.log(`  ${s.where.padEnd(12)} ${String(s.known==null?"—":s.known).padStart(5)}   ${String(s.m).padStart(3)}   ${String(s.ran).padStart(6)}  ${String(s.lost).padStart(5)}  ${String(s.died).padStart(5)}   ${(f1(s.spared)+"%").padStart(8)}`);

console.log(`\n  ARM B — the six, driven\n`);
console.log(`    baySince: a holder since week 80, read in week 120 → ${out.six.since.held} weeks (holder ${out.six.since.holder}) · with no holder → ${out.six.since.none.s} / ${out.six.since.none.h}`);
console.log(`    bayStandard and what the circuit draws off it:`);
for(const r of out.six.std)
  console.log(`      the best man in the bay ${String(r.best).padStart(3)} → standard ${String(r.std).padStart(5)} → circuit tiers ${r.q.join(" / ")}`);
console.log(`    bayWorth, by town:`);
for(const w of out.six.worth)
  console.log(`      ${w.k.padEnd(9)} ` + w.rows.map(r=>`known ${String(r.kn).padStart(3)}: mercy ${r.mercy}% tier ${r.tier}${r.rusting?" rusting":""}`).join(" · ") + `  purse x${w.rows[0].purse}`);
console.log(`      an unknown town → ${JSON.stringify(out.six.worthNull)}`);
console.log(`    cityCustom:`);
for(const c of out.six.custom)
  console.log(`      ${c.k.padEnd(9)} "${c.name}" wants ${c.wants} · crowd ${c.crowd} · purse x${c.purse} · missio ${c.missio}`);
console.log(`      an unknown town → ${out.six.customNull}`);
console.log(`    cityAfter at Pompeii, an afternoon it wanted (served ${out.six.after.served}):`);
console.log(`      local standing ${out.six.after.kn0} → ${out.six.after.kn1} · the magistrate ${out.six.after.fav0} → ${out.six.after.fav1} · the home house ${out.six.after.grudge0} → ${out.six.after.grudge1} · ${out.six.after.said} lines said`);
console.log(`    cityAfter at Neapolis, a defeat (served ${out.six.after2.served}): the magistrate ${out.six.after2.fav0} → ${out.six.after2.fav1}`);
console.log(`    cityTier: ` + out.six.tier.map(t=>`${t.kn}→${t.tier}`).join(" · "));

console.log(`\n  ARM C — what a played house's road looks like, ${out.roads[0].houses.length} houses x 420w, the ledger held up\n`);
console.log(`  policy                  weeks away   bayKnownTotal at the end   peak   known the bay   tier-3 town-weeks   Rome cut`);
for(const r of out.roads){
  const H = r.houses;
  const t3 = H.reduce((s,h)=>s+h.tierWk[3],0), tAll = H.reduce((s,h)=>s+h.tierWk[1]+h.tierWk[2]+h.tierWk[3],0);
  console.log(`  ${r.nm.padEnd(22)} ${String(H.reduce((s,h)=>s+h.awayWk,0)).padStart(10)}   ${String(med(H.map(h=>h.total))).padStart(24)}   ${String(med(H.map(h=>h.peak))).padStart(4)}   ${String(H.filter(h=>h.wide!=null).length+" of "+H.length).padStart(13)}   ${(t3+" of "+tAll).padStart(17)}   ${String(med(H.map(h=>h.cut))).padStart(8)}`);
}
console.log(`\n  raw, the deliberate tourist:`);
console.log(`    seed        ended  ending      away   pom  nea  put   total  peak  wide at   Rome cut`);
for(const h of out.roads[1].houses)
  console.log(`    ${h.pre.padEnd(11)} ${String(h.end).padStart(5)}  ${String(h.over).padEnd(10)} ${String(h.awayWk).padStart(5)}  ${String(h.known.pompeii).padStart(4)} ${String(h.known.neapolis).padStart(4)} ${String(h.known.puteoli).padStart(4)}   ${String(h.total).padStart(5)} ${String(h.peak).padStart(5)}  ${String(h.wide==null?"—":"w"+h.wide).padStart(7)}   ${String(h.cut).padStart(8)}`);

await browser.close(); server.close();
