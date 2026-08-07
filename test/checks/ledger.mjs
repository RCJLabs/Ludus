/* THE NUMBERS THAT DRIFTED BECAUSE NOTHING WAS WATCHING THEM.

   Two of this session's findings were the same fault twice: a payout that read
   fame uncapped while its counterweight capped, and a ruin line still asking the
   figure it asked when a week cost fifty denarii. Both had been wrong for many
   releases, and neither could have been caught by the suite — riseStipend,
   liturgy, weeklyBill, creditLine, workUpkeep and the whole rung table were on
   the handle and reached by nothing.

   So this check holds the shape of the standing economy rather than its values,
   because the values are exactly what a future repricing is allowed to move:

   - the stipend and the liturgy read the SAME censual fame. If one of them ever
     climbs past the other's ceiling again, a finished house prints money.
   - a finished, idle house must be under water. The sand pays for the stone.
   - the creditors' line follows the house's own bill, and still folds a house of
     three in a shed at the figure it always did.
   - the rungs climb: fame, favour and census all monotonic, no rung free. */

import { hasHandle } from "../harness.mjs";

export const name = "ledger";
export const describe = "standing pays on the census, and the stone is never free";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;

    /* a house at the top of everything: every rung, every wing, all nine works */
    const finished = (fame)=>{
      const d = A.newGameState("Led","clean","LEDGER"+fame,null);
      d.fame = fame; d.acclaim = 95; d.gold = 40000;
      d.rise = { rank: A.RISE_RANKS.length-1, standing:50 };
      d.patrons = [{ id:1, name:"P", rank:"senator", favor:80, want:null, since:0, served:0, slighted:0 }];
      A.recomputeFavor(d);
      d.buildings = { valetudinarium:3, balneae:3, carceres:3, armamentarium:3, palus:3 };
      for(const k of A.ALL_WORK_KEYS) d.works[k] = { left:0, began:1, paid:0, owed:0, idle:0 };
      return d;
    };

    /* 1. the two sides of standing, across the eras */
    const curve = [1500, 9000, 12000, 27000].map(f=>{
      const d = finished(f);
      return { fame:f, stipend:A.riseStipend(d), liturgy:A.liturgy(d),
        stone:A.workUpkeep(d), bill:A.weeklyBill(d) };
    });

    /* 2. and what a finished house nets with nobody on the sand */
    const idle = (()=>{
      const d = finished(20000);
      const before = d.gold; let weeks = 0;
      for(let w=0;w<18;w++){
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "rest");
        d.pendingEvent = null;
        try { A.endWeek(d); } catch(e){ break; }
        weeks++; if(d.over) break;
      }
      return { perWeek: Math.round((d.gold-before)/Math.max(1,weeks)), weeks };
    })();

    /* 3. the creditors' line, from a shed to a palace */
    const shed = A.newGameState("Shed","clean","LEDSHED",null);
    const shedLoan = A.newGameState("Loan","clean","LEDLOAN",null);
    shedLoan.loan = { lender:"gratus", amount:400, week:1 };
    const palace = finished(20000);
    const lines = { shed:A.creditLine(shed), shedBill:A.weeklyBill(shed),
      loan:A.creditLine(shedLoan), palace:A.creditLine(palace), palaceBill:A.weeklyBill(palace) };

    /* 4. all nine works are still worth more than everything else put together */
    const stoneTotal = A.ALL_WORK_KEYS.reduce((n,k)=>n + (A.WORKS[k]||A.MONUMENTS[k]).cost, 0);

    /* 5. the rungs */
    const rungs = A.RISE_RANKS.map((r,i)=>({ i, name:r.name, fame:r.fame||0,
      favor:r.favor||0, cost:r.cost||0, fee:i? A.riseFee(r) : 0 }));

    return { curve, idle, lines, stoneTotal, rungs, censusTop: A.CENSUS_TOP || null };
  });

  const lines = [], fails = [];
  lines.push("standing's two sides, across the eras:");
  for(const c of out.curve)
    lines.push(`   fame ${String(c.fame).padStart(6)} → stipend ${String(c.stipend).padStart(5)}d · liturgy ${String(c.liturgy).padStart(4)}d · stone ${c.stone}d · the whole bill ${c.bill}d`);
  lines.push(`a finished house with nobody on the sand: ${out.idle.perWeek}d a week over ${out.idle.weeks} weeks`);
  lines.push(`the creditors carry a shed to ${out.lines.shed}d (bill ${out.lines.shedBill}d), ${out.lines.loan}d with paper out, a palace to ${out.lines.palace}d (bill ${out.lines.palaceBill}d)`);
  lines.push(`${out.rungs.length-1} rungs above lanista · ${out.stoneTotal.toLocaleString()} denarii of stone in all`);

  /* ---- the two sides read the same fame ---- */
  const top = out.curve[out.curve.length-1], mid = out.curve[1];   // 27,000 and 9,000
  if(top.stipend > mid.stipend + 2)
    fails.push(`the stipend climbs past the census — ${mid.stipend}d at fame 9,000 and ${top.stipend}d at 27,000, while the liturgy stops. This is the v2.43.0 fault returning.`);
  if(top.liturgy > mid.liturgy + 2)
    fails.push(`the liturgy climbs past the census where the stipend does not — the counterweight has outgrown the payout`);
  /* ---- and the sand pays for the stone ---- */
  if(out.idle.perWeek > 0)
    fails.push(`a finished house nets +${out.idle.perWeek}d a week doing nothing — the strongbox refills itself and the endgame has no floor`);
  if(out.idle.perWeek < -3000)
    fails.push(`a finished, idle house bleeds ${out.idle.perWeek}d a week — that is not a sink, that is a countdown`);
  /* ---- the creditors follow the house ---- */
  if(out.lines.shed !== -250) fails.push(`a house of three in a shed folds at ${out.lines.shed}d — the opening line has always been −250`);
  if(out.lines.loan !== -420) fails.push(`a shed carrying paper folds at ${out.lines.loan}d — it has always been −420`);
  if(!(out.lines.palace < out.lines.shed * 3))
    fails.push(`a palace is carried to ${out.lines.palace}d against a shed's ${out.lines.shed}d — the line does not follow the house's own bill`);
  /* ---- and the stone stays the largest thing in the game ---- */
  if(out.stoneTotal < 300000)
    fails.push(`the works and monuments come to ${out.stoneTotal} denarii — the late-game sink has been repriced downward without a word`);
  /* ---- the ladder is a ladder ---- */
  for(let i=2;i<out.rungs.length;i++){
    const a = out.rungs[i-1], b = out.rungs[i];
    if(b.fame < a.fame)   fails.push(`${b.name} asks less fame than ${a.name}`);
    if(b.favor < a.favor) fails.push(`${b.name} asks less favour than ${a.name}`);
    if(b.cost < a.cost)   fails.push(`${b.name} asks a smaller census than ${a.name}`);
    if(b.fee <= 0)        fails.push(`${b.name} is free to be received`);
  }

  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,3).join("; ") || null, lines };
}
