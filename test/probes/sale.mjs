/* THE FIRE-SALE HAS NEVER BEEN MADE — #259

   (`sale` was free in BOTH directories; checked before writing, in checks and probes.)

   v3.246.0 and v3.247.0 both concluded that **98.1% of debt deaths were coverable**, and the remedy
   in both is `liquidate(d).total`: the spare steel, the paper owed, and every man but one at
   `gladValue * 0.55`. It is an ARITHMETIC figure. Nothing in this project has ever taken it —
   `probes/survey.mjs` reads **0 men sold across 518 men and 3,538 weeks**, and the reason is that
   until now the rope had no lever to sell one.

   THE PRICE IS RIGHT AND THE COST IS MISSING. `sellPrice` is `rnd(gladValue(g)*0.55)`, the same term
   `liquidate` sums, so the coin is what was promised. What `sellMan` also does, and `liquidate` does
   not count:

       d.unrest += 2 + sore.length*3        per man sold, per brother left sore
       every remaining active man   defiance += 3
       favourLost / loseFavourite / brothers remember "soldKin"

   A four-man sale is +8 unrest before a single brother, and +12 defiance on everyone left. **The
   other thing that kills these houses is the rising.** So the question this asks is not whether the
   coin arrives — it does — but whether taking it moves a house from `debt` to alive, or from `debt`
   to `rebellion`.

   THE ARMS are paired on identical seeds and differ in one lever:

     ref     the rope as it has always played — it cannot sell
     sell    the same rope, selling at the week the money row is red: the paper, then the steel,
             then the men cheapest-first, never the last man, and only far enough to clear the
             credit line and a fortnight's bill

   IF `debt` FALLS AND `rebellion` RISES BY ABOUT AS MUCH, "coverable" was a word about arithmetic
   and #247's leftover is open again. If `debt` falls and the houses live, the remedy is real and the
   two releases stand.

   Run: node test/probes/sale.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 128), W = +(process.argv[3] || 420), SEED = process.argv[4] || "SALE";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const NEED = ["newGameState","moneyRow","weeklyBill","creditLine","liquidate","activeG",
                "sellMan","sellDebt","sellGearOne","sellPrice","gladValue","owedList"];
  const miss = NEED.filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };
  const pc = (v,n) => n ? Math.round(1000*v/n)/10 : 0;

  const arm = (o) => {
    const rows = [];
    for(let i=0;i<H;i++){
      const d = A.newGameState("Sl", "clean", `${SEED}-${i}`);
      let soldMen = 0, soldPaper = 0, soldSteel = 0, redWeeks = 0;
      const unrestAt = [];
      for(let w=0; w<W; w++){
        if(d.over) break;
        let row = null; try { row = A.moneyRow(d); } catch(e){}
        if(row){ redWeeks++; unrestAt.push(Math.round(d.unrest)); }
        let did = null; try { did = R.lanista(d, o); } catch(e){ break; }
        if(did){ soldMen += did.soldMan || 0; soldPaper += did.soldPaper || 0; soldSteel += did.soldSteel || 0; }
      }
      rows.push({ kind: d.over ? d.over.kind : "alive", week:d.week,
        soldMen, soldPaper, soldSteel, redWeeks,
        unrest:Math.round(d.unrest), men:A.activeG(d).length,
        unrestAtRed: unrestAt.length ? unrestAt[unrestAt.length-1] : null });
    }
    const ends = {}; rows.forEach(r=>{ ends[r.kind] = (ends[r.kind]||0)+1; });
    return { n:rows.length, ends,
      debt:rows.filter(r=>r.kind==="debt").length,
      rebellion:rows.filter(r=>r.kind==="rebellion").length,
      ruin:rows.filter(r=>r.kind==="ruin").length,
      alive:rows.filter(r=>r.kind==="alive").length,
      lived:q(rows.map(r=>r.week)),
      soldMen:rows.reduce((a,r)=>a+r.soldMen,0), soldMenQ:q(rows.map(r=>r.soldMen)),
      soldPaper:rows.reduce((a,r)=>a+r.soldPaper,0), soldSteel:rows.reduce((a,r)=>a+r.soldSteel,0),
      housesThatSold:rows.filter(r=>r.soldMen>0).length,
      redWeeks:q(rows.map(r=>r.redWeeks)),
      endUnrest:q(rows.map(r=>r.unrest)), unrestAtRed:q(rows.filter(r=>r.unrestAtRed!=null).map(r=>r.unrestAtRed)),
      endMen:q(rows.map(r=>r.men)), rows };
  };

  const ref = arm({}), sell = arm({ sell:true });
  /* ---- HOUSE BY HOUSE, AND IT IS COLOUR RATHER THAN A CLAIM ----
     The seed index is the same in both arms but the TRAJECTORY is not: the first sale moves the
     R() stream, so from that week on house i is two different worlds. "Nine houses that lived
     without it died with it" is mostly re-phasing and must not be read as nine houses killed by
     selling. The ENDING MIX pooled over seed prefixes is the claim; this is what it looks like. */
  const paired = { savedFromDebt:0, debtToRebellion:0, debtToRuin:0, debtToOther:0, stillDebt:0,
                   newDeaths:0, aliveToDead:0 };
  for(let i=0;i<ref.rows.length;i++){
    const a = ref.rows[i], b = sell.rows[i];
    if(a.kind === "debt"){
      if(b.kind === "alive") paired.savedFromDebt++;
      else if(b.kind === "debt") paired.stillDebt++;
      else if(b.kind === "rebellion") paired.debtToRebellion++;
      else if(b.kind === "ruin") paired.debtToRuin++;
      else paired.debtToOther++;
    }
    if(a.kind === "alive" && b.kind !== "alive") paired.aliveToDead++;
  }
  delete ref.rows; delete sell.rows;
  return { ref, sell, paired };
}, [H, W, SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
const f = x => x ? `p10 ${x.p10} · p50 ${x.p50} · p90 ${x.p90}` : "—";
const E = a => Object.entries(a.ends).sort((x,y)=>y[1]-x[1]).map(([k,n])=>`${k} ${n}`).join(" · ");
console.log(`#259 — THE FIRE-SALE, TAKEN. ${H} houses x ${W} weeks, seed ${SEED}\n`);
for(const [k,a] of [["REF (cannot sell — every figure this project has published)", out.ref],
                    ["SELL (sells at the red week: paper, steel, then men cheapest-first)", out.sell]]){
  console.log(`== ${k} ==`);
  console.log(`  endings: ${E(a)}`);
  console.log(`  debt ${a.debt} · rebellion ${a.rebellion} · ruin ${a.ruin} · alive ${a.alive} · lived ${f(a.lived)}`);
  console.log(`  sold: ${a.soldMen} men in ${a.housesThatSold}/${a.n} houses (${f(a.soldMenQ)}) · ${a.soldPaper} paper · ${a.soldSteel} steel`);
  console.log(`  red weeks ${f(a.redWeeks)} · unrest at the last red week ${f(a.unrestAtRed)} · at the end ${f(a.endUnrest)} · men left ${f(a.endMen)}\n`);
}
const P = out.paired;
console.log(`== HOUSE BY HOUSE (colour, not a claim — the first sale re-phases the stream) ==`);
console.log(`   on the ${out.ref.debt} that died of debt without the lever:`);
console.log(`  saved outright (alive at ${W})      ${P.savedFromDebt}`);
console.log(`  still died of debt                  ${P.stillDebt}`);
console.log(`  DIED OF THE RISING INSTEAD          ${P.debtToRebellion}`);
console.log(`  died of ruin instead                ${P.debtToRuin}`);
console.log(`  died of something else              ${P.debtToOther}`);
console.log(`  and houses that LIVED without it and died with it: ${P.aliveToDead}`);
await browser.close(); server.close();
