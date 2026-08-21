/* WHEN CAN A HOUSE AFFORD THE TOP OF THE RACK? — the number that picks the sort

   The armory lists gear CHEAPEST FIRST, and price tracks quality across every slot (weapon rho
   +0.79, armor +0.65, offhand +0.55, helm +0.43 over the catalogue). So the list shows the weakest
   pieces first, and the reference player's own rule is the opposite: it buys the most expensive
   piece it can afford. A player with coin scrolls 2,942px to the bottom every time.

   Reversing it is not obviously right. Two orders are on the table and they fail in different ways:

     price descending      stable — the list never moves. Early, the top rows read "Not enough coin"
                           and a poor house scrolls past them to reach what it can buy.
     affordable first      always relevant, but the list REORDERS as gold changes, so a piece that
                           was third last week is ninth this week. A shop that rearranges itself
                           around your wallet is its own kind of hard to use.

   Which cost is real depends on how much of the rack a house can actually afford, and when. If a
   typical house can afford the whole in-style list by week 8, descending is stable AND relevant and
   the choice is easy. This measures that: many houses, the rope playing them, gold and the
   affordable share of each slot's in-style list sampled every few weeks.

   Three seed prefixes, because anything cheap should be run on more than one.

   Usage: node test/probes/afford.mjs [houses per prefix] [weeks]
*/
import { serve, open, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 20), W = +(process.argv[3] || 26);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const AT = [4, 8, 12, 16, 20, 26].filter(w=>w<=W);
  const acc = {}; for(const w of AT) acc[w] = { n:0, gold:0, share:{}, top:0, alive:0 };
  for(const w of AT) for(const s of A.SLOTS) acc[w].share[s] = { got:0, of:0 };

  const styles = d => [...new Set(A.activeG(d).map(g=>g.cls))];
  const inStyleFor = (it, mine) => !it.styles || !it.styles.length || it.styles.some(c=>mine.includes(c));

  for(const pre of ["AFF-1","AFF-2","AFF-3"]){
    for(let h=0; h<H; h++){
      const d = A.newGameState("Af"+h, "clean", `${pre}-${h}`, null);
      for(let w=1; w<=W; w++){
        if(d.over) break;
        R.lanista(d);
        if(!acc[w]) continue;
        const a = acc[w]; a.n++; a.alive++; a.gold += d.gold;
        const mine = styles(d);
        const master = A.masterOpen && A.masterOpen(d);
        let topAfford = true;
        for(const s of A.SLOTS){
          const list = Object.entries(A.GEAR).filter(([id,it]) => it.slot===s && it.price>0
            && (!it.master || master) && inStyleFor(it, mine));
          if(!list.length) continue;
          const prices = list.map(([id,it]) => A.gearPrice(d, it.price, s));
          const can = prices.filter(x => x <= d.gold).length;
          a.share[s].got += can; a.share[s].of += prices.length;
          if(Math.max(...prices) > d.gold) topAfford = false;
        }
        if(topAfford) a.top++;
      }
    }
  }
  return { AT, acc, houses: H*3 };
}, [H,W]);

console.log(`\nWHEN CAN A HOUSE AFFORD THE TOP OF THE RACK?`);
console.log(`  ${out.houses} houses across 3 seed prefixes, the rope playing each\n`);
console.log(`  ${"week".padStart(5)} ${"houses".padStart(7)} ${"mean gold".padStart(10)}  ${"weapon".padStart(7)} ${"offhand".padStart(8)} ${"helm".padStart(6)} ${"armor".padStart(7)}   ${"whole list".padStart(11)}`);
for(const w of out.AT){
  const a = out.acc[w]; if(!a.n) continue;
  const pc = s => a.share[s].of ? `${Math.round(a.share[s].got/a.share[s].of*100)}%` : "—";
  console.log(`  ${String(w).padStart(5)} ${String(a.n).padStart(7)} ${String(Math.round(a.gold/a.n)).padStart(10)}  `
    + `${pc("weapon").padStart(7)} ${pc("offhand").padStart(8)} ${pc("helm").padStart(6)} ${pc("armor").padStart(7)}   `
    + `${`${Math.round(a.top/a.n*100)}%`.padStart(11)}`);
}
console.log(`\n  "whole list" = the share of house-weeks where every in-style piece in every slot is affordable\n`);
await browser.close(); server.close();
