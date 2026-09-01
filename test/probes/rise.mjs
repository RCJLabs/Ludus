/* #207's mechanical question, and the answer that half-refuted the item: where do long houses sit
   on the rise ladder, and does the liturgy — the game's own late-game counterweight — ever engage?

     node test/probes/rise.mjs

   MEASURED at v3.155.0, 16 houses x 420 weeks (the survey's seeds): 14 of 16 reach rise >= 4; the
   liturgy engages on 2,445 of 3,849 weeks (64%), taking 345,190d against the stipend's 640,344d
   over 2,675 weeks; median weekly net by era −23 / −58 / −68 / −126. The late game was never
   coasting — it is a treadmill the sand feeds. See the v3.156.0 entry and audit item #207. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);
const out = await p.evaluate(()=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const sum = { houses:16, rise:{}, litWeeks:0, litPaid:0, stipWeeks:0, stipPaid:0, weeks:0,
    endRise:[], endFame:[], netByEra:[[],[],[],[]] };
  for(let h=0; h<16; h++){
    const d = A.newGameState("SURVEY-"+h);   /* same seeds as the survey */
    let goldPrev = d.gold;
    for(let w=0; w<420; w++){
      if(d.over) break;
      try { R.lanista(d); } catch(e){ break; }
      sum.weeks++;
      const lit = A.liturgy(d), st = A.riseStipend(d);
      if(lit>0){ sum.litWeeks++; sum.litPaid += lit; }
      if(st>0){ sum.stipWeeks++; sum.stipPaid += st; }
      const era = Math.min(3, Math.floor(w/105));
      sum.netByEra[era].push(Math.round(d.gold - goldPrev)); goldPrev = d.gold;
    }
    sum.rise[A.riseOf(d)] = (sum.rise[A.riseOf(d)]||0)+1;
    sum.endRise.push(A.riseOf(d)); sum.endFame.push(Math.round(d.fame));
  }
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { p50:s[Math.floor(.5*s.length)], mean:Math.round(a.reduce((n,x)=>n+x,0)/a.length) }; };
  sum.netByEra = sum.netByEra.map(q);
  return sum;
});
console.log(JSON.stringify(out));
await browser.close(); server.close();
