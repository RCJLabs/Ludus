/* THE BAY HAS NO STRONGBOX — #256 phase 1, the verify-first number.

   (Named `coffer`: `purse`, `strongbox` and `bay` are all taken in this directory. Checked before
   the file was written, because v3.210.0 overwrote two files that were not and only `git status`
   caught it.)

   `makeRivals` writes `{ name, fame, grudge, form, formTier, star, fighters }` — a rival house has
   **no purse**. `RIVAL_MOVES.buy/sell/retrain/doctore/tour` cost nothing and are weighted by fame
   and the `LANISTAE` multipliers; a rival "hires a doctore out of Ravenna at a price people are
   talking about" with no price. Every economic verb pointed at a rival is one-sided because only
   one side has an economy.

   The item's own verify-first: *"the scale is the rope's own ledger (gold p50 by era 1,451 / 4,074 /
   4,925 / 6,191); the item's first number is what a rival at the same fame would have earned from
   the same cards."* So this builds a SHADOW LEDGER — what a purse would have done had there been
   one — and asks whether it moves at a scale worth simulating, and whether it would ever empty.

     1 · WHAT COMES IN. Two channels, both already in the game and neither paying anybody:
         · every bout the player fights against a man of that house — the tier's appearance fee
           `t.app`, and the tier's purse when their man wins;
         · `RIVAL_MOVES.won`, the most heavily weighted move in the table (1.6), which is a rival
           taking a card in another town and coming back with it. It pays them fame and nothing else.

     2 · WHAT GOES OUT. Every move the table can make, hooked at `run()` and priced at what the
         PLAYER pays for the same thing: a man off the block at his own asking price, `RETRAIN_FEE`
         for a retrain, a doctore's wage every week he is kept, a tour's weeks away. `sell` is
         income, `free` and `boast` are free.

     3 · AND WHAT THE PURSE WOULD HAVE DONE. Seeded at the fame-and-stature figure phase 1 proposes,
         run weekly, reported per era against the player's own gold — and how many houses would have
         emptied it, which is the `RUINS`-shaped consequence phase 1 asks for and the only part of
         the design that cannot be inferred from the source.

     node test/probes/coffer.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "COFFER";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","TIERS","RIVAL_MOVES","lanistaOf","RETRAIN_FEE","gladValue"]
    .filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const ERA = w => Math.min(3, Math.floor((w - 1) / (W / 4)));
  const tierOf = f => { let t = 0; for(let i=0; i<A.TIERS.length; i++) if(f >= A.TIERS[i].fame) t = i; return t; };
  /* the tier's own figures, unmultiplied — no fame edge, no season, no sine: a floor, not a forecast */
  const appOf = t => A.TIERS[t].app;
  const purseOf = t => A.TIERS[t].purse[0] + A.TIERS[t].purse[1] * 0.5;
  const DOC_WAGE = 26;        /* what a bought doctore costs the player a week, at the middle of the range */
  const TOUR_WEEK = 40;       /* wagons, road and lodging, per week away — a stated assumption */
  /* ---- AND THE HALF THE FIRST CUT LEFT OUT ----
     A ledger of income and purchases with no WEEKLY BILL is not a ledger. The player's own is
     `(10 + seasonUpkeep) * men + buildings + gear + staff + the doctore`, and it is the term that
     flattens his curve — 50 to 550 a week. A rival has no buildings and no staff, so the comparable
     figure is the men and the doctore alone. Both totals are carried below: the purse WITHOUT a
     bill, which is what the first cut measured, and the purse WITH one, which is the honest number. */
  const manWeek = d => 10 + (A.seasonUpkeep ? A.seasonUpkeep(d) : 2);

  const houses = [];
  for(let h=0; h<H; h++){
    const d = A.newGameState("Cf"+h, "clean", `${SEED}-${h}`);
    /* hook every move so its cost is priced where it is actually taken */
    const moves = {}, raw = {};
    const led = {};                                     /* name -> shadow ledger */
    const seed = r => Math.round(r.fame * 12 * ((A.lanistaOf(r.name).stature || 0.4) + 0.6));
    for(const r of d.rivals) led[r.name] = { seed0: seed(r), purse: seed(r), in:0, out:0,
      low: seed(r), broke:0, era:[[],[],[],[]], moves:{}, fights:0, wins:0, wons:0,
      bill:0, kept: seed(r), lowKept: seed(r), brokeKept:0, eraKept:[[],[],[],[]] };
    for(const k of Object.keys(A.RIVAL_MOVES)){
      const M = A.RIVAL_MOVES[k]; raw[k] = M.run;
      M.run = function(dd, hh){
        const before = k === "buy" ? (dd.market || []).slice() : null;
        const out = raw[k].call(this, dd, hh);
        const L = led[hh.name]; if(!L || out == null) return out;
        L.moves[k] = (L.moves[k] || 0) + 1;
        moves[k] = (moves[k] || 0) + 1;
        if(k === "buy" && before){
          /* whoever left the block is the man he took */
          const now = new Set((dd.market || []).map(x=>x.id));
          const took = before.find(x=>!now.has(x.id));
          const price = took ? (took.price || 0) : 0;
          L.out += price; L.paid = (L.paid || 0) + price;
        }
        if(k === "sell"){ const now = (dd.market || []);
          const put = now[0]; L.in += put ? Math.round((put.price || 0) * 0.7) : 0; }
        if(k === "retrain") L.out += A.RETRAIN_FEE;
        if(k === "doctore") L.doctoreFrom = dd.week;
        if(k === "tour") L.out += TOUR_WEEK * (hh.away || 4);
        if(k === "won"){ L.wons++;
          const t = tierOf(hh.fame); L.in += appOf(t) + purseOf(t); }
        return out;
      };
    }
    for(let w=0; w<W; w++){
      if(d.over) break;
      const e = ERA(d.week);
      /* the player's own card: whoever he fights is somebody's man */
      let t = null; try { t = R.takeBout(d, {}); } catch(x){}
      if(t && t.ran !== false && t.offer && t.offer.oppRef && t.offer.oppRef.house){
        const L = led[t.offer.oppRef.house];
        if(L){ L.fights++;
          const ti = t.offer.tier || 0;
          L.in += appOf(ti);
          /* the rope's bout result carries `win` — the PLAYER's verdict — and not `winner`. The
             first cut read `res.winner === "B"` and scored the rival's man at zero wins in 224
             meetings, which is not a number about the game. */
          const theirs = t.res && t.res.win === false;
          if(theirs){ L.wins++; L.in += purseOf(ti); }
        }
      }
      try { R.lanista(d); } catch(x){ break; }
      /* the week's keep, and the ledger struck */
      for(const r of d.rivals){
        const L = led[r.name]; if(!L) continue;
        if(L.doctoreFrom != null) L.out += DOC_WAGE;            /* a doctore is kept, not bought once */
        L.bill += manWeek(d) * (r.fighters || []).length;
        L.purse = Math.round(L.seed0 + L.in - L.out);
        L.kept = Math.round(L.purse - L.bill);                  /* the same purse, paying a bill */
        if(L.purse < L.low) L.low = L.purse;
        if(L.kept < L.lowKept) L.lowKept = L.kept;
        if(L.purse < 0) L.broke++;
        if(L.kept < 0) L.brokeKept++;
        L.era[e].push(L.purse); L.eraKept[e].push(L.kept);
      }
    }
    for(const k of Object.keys(raw)) A.RIVAL_MOVES[k].run = raw[k];
    houses.push({ h, week:d.week, over: d.over ? d.over.kind : "survived",
      gold: Math.round(d.gold), moves,
      rivals: Object.entries(led).map(([nm, L])=>({ name:nm, purse:L.purse, low:L.low, broke:L.broke, seed0:L.seed0,
        in:Math.round(L.in), out:Math.round(L.out), fights:L.fights, wins:L.wins, wons:L.wons,
        bill:Math.round(L.bill), kept:L.kept, lowKept:L.lowKept, brokeKept:L.brokeKept,
        moves:L.moves, era:L.era.map(a=>a.length ? a[Math.floor(a.length/2)] : null),
        eraKept:L.eraKept.map(a=>a.length ? a[Math.floor(a.length/2)] : null) })) });
  }
  return { houses, weeks:W };
}, [H, W, SEED]);
await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const q = a => { if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y);
  return { p10:s[Math.floor(.1*s.length)], p50:s[Math.floor(.5*s.length)], p90:s[Math.floor(.9*s.length)] }; };
const P = (s, w) => String(s).padEnd(w), N = (v, w) => String(v == null ? "—" : v).padStart(w);
const all = out.houses.flatMap(x=>x.rivals);

console.log(`\nTHE BAY'S SHADOW LEDGER — ${out.houses.length} houses x ${out.weeks} weeks, ${all.length} rival-lives`);
console.log(`the player's own box for comparison: p50 ${q(out.houses.map(x=>x.gold)).p50}d at the end\n`);

console.log(`WHAT WOULD HAVE COME IN AND GONE OUT, per rival house over its life`);
console.log(`  ${P("", 10)}${"opened at".padStart(11)}${"in".padStart(10)}${"out".padStart(10)}${"net".padStart(10)}${"low water".padStart(12)}${"weeks under".padStart(13)}`);
{ const S = q(all.map(r=>r.seed0));
  console.log(`  ${P("(seed)", 10)}${N(S.p50, 11)}`); const IN = q(all.map(r=>r.in)), OUT = q(all.map(r=>r.out)), LOW = q(all.map(r=>r.low)),
    BRK = q(all.map(r=>r.broke));
  console.log(`  ${P("p10", 10)}${N("", 11)}${N(IN.p10, 10)}${N(OUT.p10, 10)}${N(IN.p10-OUT.p10, 10)}${N(LOW.p10, 12)}${N(BRK.p10, 13)}`);
  console.log(`  ${P("p50", 10)}${N("", 11)}${N(IN.p50, 10)}${N(OUT.p50, 10)}${N(IN.p50-OUT.p50, 10)}${N(LOW.p50, 12)}${N(BRK.p50, 13)}`);
  console.log(`  ${P("p90", 10)}${N("", 11)}${N(IN.p90, 10)}${N(OUT.p90, 10)}${N(IN.p90-OUT.p90, 10)}${N(LOW.p90, 12)}${N(BRK.p90, 13)}`); }

console.log(`\nWHERE THE MONEY WOULD HAVE COME FROM, per rival house`);
{ const F = q(all.map(r=>r.fights)), Wn = q(all.map(r=>r.wins)), Wo = q(all.map(r=>r.wons));
  console.log(`  bouts on the player's card: p50 ${F.p50} (p90 ${F.p90}), of which their man won ${Wn.p50} (p90 ${Wn.p90})`);
  console.log(`  cards taken out of town (\`RIVAL_MOVES.won\`): p50 ${Wo.p50} (p90 ${Wo.p90})`);
  const tot = { fights:0, wons:0 }; for(const r of all){ tot.fights += r.fights; tot.wons += r.wons; }
  console.log(`  in all: ${tot.fights} meetings on the player's sand against ${tot.wons} cards elsewhere `
    + `— ${(100*tot.wons/((tot.fights+tot.wons)||1)).toFixed(0)}% of a rival's fighting is invisible to the player`); }

console.log(`\nWHAT THE MOVES WOULD HAVE COST — every move the table can make, per rival house`);
{ const keys = {}; for(const r of all) for(const k of Object.keys(r.moves)) keys[k] = (keys[k]||0) + r.moves[k];
  for(const [k, n] of Object.entries(keys).sort((a,b)=>b[1]-a[1]))
    console.log(`  ${P(k, 10)} ${N(n, 5)} times · ${(n/all.length).toFixed(1)} per rival house`); }

console.log(`\nAND WHAT THE PURSE WOULD HAVE DONE — the shadow balance, p50 by era`);
{ for(const e of [0,1,2,3]){
    const v = all.map(r=>r.era[e]).filter(x=>x != null);
    console.log(`  era ${e}: p50 ${N(q(v) && q(v).p50, 8)}d  (p10 ${N(q(v) && q(v).p10, 8)}, p90 ${N(q(v) && q(v).p90, 8)})`); }
  const everBroke = all.filter(r=>r.broke > 0).length;
  console.log(`\n  ${everBroke} of ${all.length} rival houses would have gone under at some point `
    + `(${(100*everBroke/all.length).toFixed(0)}%), and the median low-water mark is ${q(all.map(r=>r.low)).p50}d.`);
  console.log(`  The player's own ledger for scale: 1,451 / 4,074 / 4,925 / 6,191 by era.`);

  console.log(`\nAND THE SAME PURSE PAYING A WEEKLY BILL — the men fed, at the player's own rate`);
  for(const e of [0,1,2,3]){
    const v = all.map(r=>r.eraKept[e]).filter(x=>x != null);
    console.log(`  era ${e}: p50 ${N(q(v) && q(v).p50, 9)}d  (p10 ${N(q(v) && q(v).p10, 9)}, p90 ${N(q(v) && q(v).p90, 9)})`); }
  const B = q(all.map(r=>r.bill)), K = q(all.map(r=>r.brokeKept));
  const underK = all.filter(r=>r.brokeKept > 0).length;
  console.log(`\n  the bill over a life: p50 ${B.p50}d against income of ${q(all.map(r=>r.in)).p50}d — `
    + `${underK} of ${all.length} houses (${(100*underK/all.length).toFixed(0)}%) would be under water at `
    + `some point, for a median of ${K.p50} weeks, low-water ${q(all.map(r=>r.lowKept)).p50}d.`); }
