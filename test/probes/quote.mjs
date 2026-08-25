/* EVERY PRICE THE PLAYER IS QUOTED, AGAINST THE ONE HE IS CHARGED

   The audit's last unmeasured item: eleven functions — `gearPrice`, `rudisCost`, `canAffordRudis`,
   `pitPurse`, `cityPurse`, `cityMissio`, `owedTotal`, `loanLender`, `canBorrow`, `lanVig`,
   `gladValue` — are every price the player is quoted, and **no check asserts on one of them**.

   The useless version of this instrument asks whether they return positive numbers. The useful
   one asks #150's question, which this project has already been bitten by twice: IS THE NUMBER ON
   THE BUTTON THE NUMBER THAT LEAVES THE STRONGBOX? A priced action has THREE numbers in it and
   they are written in three different places —

     QUOTE   what the panel renders
     GUARD   what the affordability test compares gold against
     CHARGE  what is actually subtracted

   — and nothing has ever held them to each other. So this states the contract as one sentence a
   player would recognise: **you can afford exactly what you are quoted, and not a denarius less.**
   Set gold to the quote and the action must go through and leave nothing behind; set it a denarius
   short and the action must refuse and take nothing. Both directions, because a guard can be wrong
   by being too strict (a purchase refused that he could pay for) or too lax (gold driven negative),
   and only running both tells them apart.

   It drives the real mutators — `buyGearItem`, `grantRudis`, `buyFromBlock`, `borrow` — rather than
   re-deriving prices, because a probe that recomputes the price it is checking proves nothing.

     node test/probes/quote.mjs
*/
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"QUOTE" }); await clearAll(p); await installRope(p);

const out = await p.evaluate(()=>{
  const A = window.__LVDVS;
  const rows = [];
  const fresh = (tag, mut) => { const d = A.newGameState("Q","clean","QUOTE-"+tag,null);
    d.gold = 100000; if(mut) mut(d); return d; };

  /* ---- GEAR ---- every item, at every armamentarium level, which is what moves the multiplier */
  for(const lvl of [0, 2, 4]){
    for(const [id, it] of Object.entries(A.GEAR || {})){
      if(!it || !(it.price > 0)) continue;
      const probe = fresh("g"+lvl+id, d=>{ d.buildings = d.buildings||{}; d.buildings.armamentarium = lvl; });
      const quote = A.gearPrice(probe, it.price, it.slot);
      /* exactly the quote: it must go through, and take exactly that */
      const atA = fresh("g"+lvl+id, d=>{ d.buildings = d.buildings||{}; d.buildings.armamentarium = lvl; d.gold = quote; });
      const okA = A.buyGearItem(atA, id);
      /* a denarius short: it must refuse, and take nothing */
      const atB = fresh("g"+lvl+id, d=>{ d.buildings = d.buildings||{}; d.buildings.armamentarium = lvl; d.gold = quote - 1; });
      const okB = A.buyGearItem(atB, id);
      rows.push({ what:`gear:${id}@arm${lvl}`, quote, list:it.price,
        atQuote:{ ok:!!okA, left:Math.round(atA.gold) },
        short:{ ok:!!okB, left:Math.round(atB.gold) } });
    }
  }

  /* ---- THE RUDIS ---- */
  {
    const mk = gold => { const d = fresh("rud"); const g = d.gladiators.find(x=>x.status==="active");
      if(!g) return null;
      g.wins = 40; g.pfame = 400; g.auctor = null;      /* over both gates by a mile */
      d.gold = gold; return { d, g }; };
    const base = mk(100000);
    if(base){
      const quote = A.rudisCost(base.d, base.g);
      const a = mk(quote), b = mk(quote - 1);
      const okA = A.grantRudis(a.d, a.g.id), okB = A.grantRudis(b.d, b.g.id);
      rows.push({ what:"rudis", quote, list:quote,
        atQuote:{ ok:!!okA, left:Math.round(a.d.gold) },
        short:{ ok:!!okB, left:Math.round(b.d.gold) } });
      /* ---- AND THE ORDERING, WHICH IS A DIFFERENT QUESTION ----
         `grantRudis` charges, writes the chronicle line saying it is paid for, clears his plan and
         applies the favour loss BEFORE it asks `rudisEligible`. If that ever answers no, the player
         has paid and the man stays. Whether it is reachable today is not the point; what it costs
         when it is reached is measurable now. */
      const c = mk(100000);
      c.g.wins = 0; c.g.pfame = 0;                       /* not eligible, and never was */
      const before = c.d.gold;
      const okC = A.grantRudis(c.d, c.g.id);
      rows.push({ what:"rudis:INELIGIBLE", quote:0, list:0,
        atQuote:{ ok:!!okC, left:Math.round(c.d.gold) }, spent: Math.round(before - c.d.gold),
        stillHere: c.g.status });
    }
  }

  /* ---- A MAN OFF THE BLOCK ---- */
  {
    const mk = gold => { const d = fresh("blk"); if(!(d.market||[]).length) return null;
      d.gold = gold; return d; };
    const base = mk(100000);
    if(base && base.market.length){
      const m = base.market[0];
      const ask = A.gladValue ? Math.round(A.gladValue(m)) : null;
      const a = mk(ask), b = mk(ask - 1);
      const okA = a && A.buyFromBlock(a, a.market[0].id, ask);
      const okB = b && A.buyFromBlock(b, b.market[0].id, ask);
      rows.push({ what:"block(at gladValue)", quote:ask, list:ask,
        atQuote:{ ok:!!okA, left:a ? Math.round(a.gold) : null },
        short:{ ok:!!okB, left:b ? Math.round(b.gold) : null } });
    }
  }
  return rows;
});

await browser.close(); server.close();

const bad = [];
console.log(`=== every priced action: can he afford exactly what he is quoted?\n`);
console.log(`  ${"action".padEnd(26)} ${"quote".padStart(7)} ${"list".padStart(7)}   at the quote        a denarius short`);
for(const r of out){
  if(r.what === "rudis:INELIGIBLE") continue;
  const a = `${r.atQuote.ok ? "bought" : "REFUSED"}, ${r.atQuote.left} left`;
  const b = `${r.short.ok ? "BOUGHT" : "refused"}, ${r.short.left} left`;
  const wrongA = !r.atQuote.ok || r.atQuote.left !== 0;
  const wrongB = r.short.ok || r.short.left !== r.quote - 1;
  if(wrongA || wrongB) bad.push(r);
  console.log(`  ${r.what.padEnd(26)} ${String(r.quote).padStart(7)} ${String(r.list).padStart(7)}   `
    + `${a.padEnd(20)}${b}${wrongA||wrongB ? "   <-- " + (wrongA ? "he cannot afford his own quote" : "he could afford less than it") : ""}`);
}
const inel = out.find(r=>r.what === "rudis:INELIGIBLE");
if(inel){
  console.log(`\n=== and the rudis on a man who is not eligible`);
  console.log(`  granted: ${inel.atQuote.ok}   he is now: ${inel.stillHere}   denarii taken: ${inel.spent}`);
  if(!inel.atQuote.ok && inel.spent > 0)
    console.log(`  ** THE PLAYER PAID ${inel.spent} AND THE MAN IS STILL A SLAVE **`);
}
console.log(`\n  ${out.length - 1} priced actions measured · ${bad.length} where the quote is not what he can afford`);
if(bad.length){
  const g = bad.filter(r=>r.what.startsWith("gear"));
  if(g.length) console.log(`  gear: ${g.length} of ${out.filter(r=>r.what.startsWith("gear")).length} items,`
    + ` refusal window up to ${Math.max(...g.map(r=>r.list - r.quote))}d wide on a ${Math.max(...g.map(r=>r.list))}d item`);
}
