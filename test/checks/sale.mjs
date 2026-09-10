/* THE FIRE-SALE, TAKEN — #259.

   (`sale` was free in BOTH directories; checked before writing, in checks and probes.)

   v3.246.0 and v3.247.0 both concluded that **98.1% of debt deaths were coverable**, and the remedy
   in both is `liquidate(d).total`: spare steel, paper owed, and every man but one at
   `gladValue * 0.55`. It is an ARITHMETIC figure, and nothing in this project had ever taken it —
   `probes/survey.mjs` reads **0 men sold across 518 men and 3,538 weeks**, because the rope had no
   lever to sell one. `sellMan` had been on the handle for many releases; `court`, `gambit`, `loan`
   and `works` all had opt-in levers and selling had none.

   THE PRICE WAS RIGHT AND THE COST WAS MISSING. `sellPrice` is `rnd(gladValue(g)*0.55)`, the same
   term `liquidate` sums, so the coin is exactly what was promised. What `sellMan` ALSO does, and
   `liquidate` does not count: `d.unrest += 2 + 3 per sore brother`, `defiance += 3` on every man
   left, `favourLost`, `loseFavourite`, and the brothers remember it.

   MEASURED with the lever (`probes/sale.mjs`, **three seed prefixes x 128 houses x 420 weeks**, 384
   an arm), selling at the red week — the paper, then the steel, then the men cheapest-first, never
   the last man, only far enough to clear the line and a fortnight's bill:

                      ref        sell
       debt           160    ->   89     -44%
       rebellion      100    ->  121     +21%
       alive           67    ->   98     +46%
       men sold          0    ->  675     in 210 of 384 houses

   SO THE REMEDY IS REAL AND "COVERABLE" OVERSTATED IT. The sale removes **71 of 160** debt deaths,
   not 98% of them — and of those 71, **31 become survivors and 21 become the rising**, with the rest
   going to ruin, banned and emptied. Less than half of what it prevents turns into a house that
   lives. The coin arrives; survival does not follow, because the roster it can no longer carry was
   #247's own diagnosis and selling the roster is not the same as fixing it.

   FOUR ARMS. The bars are DIRECTIONS, not levels: this is a difficulty statement and must not become
   a balance check. */
import { installRope } from "../harness.mjs";

export const name = "sale";
export const describe = "a house that sells at the red week loses fewer to debt, and some of what it saves goes to the rising";

const HOUSES = 40, WEEKS = 300;

export async function run({ p }){
  const lines = [], bad = [];
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","moneyRow","activeG","sellMan","sellPrice","gladValue","liquidate",
                  "weeklyBill","owedList"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function")
      return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };

    /* the price the arithmetic promises is the price the action takes — driven, not played */
    const priced = (()=>{ const d = A.newGameState("Sl", "clean", "SALEPRICE");
      d.week = 120; const men = A.activeG(d);
      if(men.length < 2) return { ran:false };
      const g = men.slice().sort((a,b)=>A.gladValue(a)-A.gladValue(b))[0];
      const want = A.sellPrice(g), lq = A.liquidate(d).total, g0 = d.gold, n0 = men.length;
      const u0 = d.unrest, def0 = A.activeG(d).reduce((n,x)=>n+(x.defiance||0),0);
      const ok = A.sellMan(d, g.id, null);
      return { ran:true, ok:!!ok, want, got:Math.round(d.gold - g0), lq:Math.round(lq),
        men:n0 - A.activeG(d).length, unrest:+(d.unrest - u0).toFixed(2),
        defiance:A.activeG(d).reduce((n,x)=>n+(x.defiance||0),0) - def0 + (g.defiance||0) }; })();

    const arm = (o) => {
      const ends = {}; let sold = 0, housesSold = 0;
      for(let i=0;i<H;i++){
        const d = A.newGameState("Sl", "clean", `SALECHK-${i}`);
        let mine = 0;
        for(let w=0; w<W; w++){
          if(d.over) break;
          let did = null; try { did = R.lanista(d, o); } catch(e){ break; }
          if(did && did.soldMan) mine += did.soldMan;
        }
        const k = d.over ? d.over.kind : "alive";
        ends[k] = (ends[k]||0)+1; sold += mine; if(mine) housesSold++;
      }
      return { ends, sold, housesSold,
        debt:ends.debt||0, rebellion:ends.rebellion||0, alive:ends.alive||0 };
    };
    return { priced, ref:arm({}), sell:arm({ sell:true }) };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const { priced, ref, sell } = r;
  const E = a => Object.entries(a.ends).sort((x,y)=>y[1]-x[1]).map(([k,n])=>`${k} ${n}`).join(" · ");

  /* 1 — the price the arithmetic promises is the price the action takes */
  if(!priced.ran) bad.push(`the pricing arm could not build a house with two men in it`);
  else {
    lines.push(`one man sold, driven: \`sellPrice\` wants ${priced.want}d and the box gained ${priced.got}d · \`liquidate\` had ${priced.lq}d on the table · roster −${priced.men}`);
    if(!priced.ok) bad.push(`\`sellMan\` refused the cheapest man in a house of two or more`);
    if(priced.got !== priced.want)
      bad.push(`\`sellPrice\` said ${priced.want}d and ${priced.got}d arrived — \`liquidate\`'s total sums that same term, so a gap here `
        + `means the figure two releases were concluded on is not the coin a player would get`);
  }

  /* 2 — and the cost the arithmetic does NOT count is real */
  if(priced.ran){
    lines.push(`   and what \`liquidate\` does not count: unrest +${priced.unrest}, defiance +${priced.defiance} across the men left`);
    if(!(priced.unrest > 0))
      bad.push(`selling a man moved unrest by ${priced.unrest} — \`sellMan\` puts 2 on it per man and 3 per sore brother, and this arm exists `
        + `because that cost is absent from the figure #246 and #247 were concluded on`);
    if(!(priced.defiance > 0)) bad.push(`selling a man moved no defiance (${priced.defiance}) across the men left`);
  }

  /* 3 — the lever fires, and only with the lever */
  lines.push(`${HOUSES} houses x ${WEEKS}w · ref: ${E(ref)} — ${ref.sold} men sold · sell: ${E(sell)} — ${sell.sold} men sold in ${sell.housesSold} houses`);
  if(ref.sold !== 0)
    bad.push(`the reference player sold ${ref.sold} men without the lever — \`sell\` is opt-in and every figure this project has published assumes it is off`);
  if(!(sell.sold > 0)) bad.push(`the \`sell\` lever sold nothing in ${HOUSES} houses, so arms 3 and 4 are inert`);

  /* 4 — fewer die of debt, and some of it comes back as the rising */
  lines.push(`   debt ${ref.debt} → ${sell.debt} · rebellion ${ref.rebellion} → ${sell.rebellion} · alive ${ref.alive} → ${sell.alive} `
    + `[pooled over 3 prefixes x 128: debt 160 → 89, rebellion 100 → 121, alive 67 → 98]`);
  if(!(sell.debt < ref.debt))
    bad.push(`selling at the red week left ${sell.debt} debt deaths against the reference player's ${ref.debt} [pooled 160 → 89] — `
      + `the remedy #247 called on has stopped removing debt deaths at all`);
  if(!(sell.alive >= ref.alive))
    bad.push(`selling left ${sell.alive} houses standing against ${ref.alive} without it [pooled 67 → 98] — the remedy is costing survival, not buying it`);

  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
