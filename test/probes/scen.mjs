/* THE FIVE FOUNDINGS, COMPARED ON ANYTHING AT ALL — the last seam from the v3.27.0 session

   Every long-run figure in this project is measured on `clean`. The other four openings have been
   driven only by `lessons`' opening scan, and never compared on an outcome. Whether they produce
   meaningfully different HOUSES is unmeasured — and two of them are the only states in the game that
   open certain doors on week one (`inherited` the staff room, `champion` the signature).

   INSTRUMENT NOTES, all three off this project's record:
   · the scenario keys come off the handle (`SC_KEYS`) — `newGameState` silently forgives a key it
     does not know and hands back `clean`, which cost `lessons` two releases of five-identical-arms.
     And every scenario row prints its own week-one men and coin, so five identical rows cannot be
     read past (the defence test/README.md names for exactly this fault).
   · lifespans here are era-spiked, not bell-curved (10…401 with a wall of early deaths), so the
     whole spread is printed and the median is not the claim. Between-batch spread dwarfed
     between-policy spread at n=20 once before; run this on several seeds before quoting ANY
     difference, and quote the sign only if it holds on all of them.
   · houses are compared at fixed horizons (alive at 90/180/300) and on best-of-run fame the way
     `policy` bars are, because a median over the dead answers a different question. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "SCEN";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const rows = [];
  for(const sc of A.SC_KEYS){
    const r = { sc, lives:[], fameBest:0, fameAtDeath:[], goldPeak:[], rungBest:0,
      alive90:0, alive180:0, alive300:0, men0:null, gold0:null, ends:{} };
    for(let h=0; h<H; h++){
      const d = A.newGameState("Sc"+h, sc, `${SEED}-${sc}-${h}`, null);
      if(r.men0==null){ r.men0 = A.activeG(d).length; r.gold0 = d.gold; }
      let fameBest = 0, goldPeak = d.gold, rung = 0;
      for(let w=0; w<W; w++){
        if(d.over) break;
        R.lanista(d);
        fameBest = Math.max(fameBest, d.fame||0);
        goldPeak = Math.max(goldPeak, d.gold||0);
        rung = Math.max(rung, A.riseOf(d)||0);
      }
      r.lives.push(d.week);
      if(d.week>=90) r.alive90++; if(d.week>=180) r.alive180++; if(d.week>=300) r.alive300++;
      r.fameBest = Math.max(r.fameBest, Math.round(fameBest));
      r.fameAtDeath.push(Math.round(d.fame||0));
      r.goldPeak.push(Math.round(goldPeak));
      r.rungBest = Math.max(r.rungBest, rung);
      const k = d.over ? d.over.kind : "alive";
      r.ends[k] = (r.ends[k]||0)+1;
    }
    rows.push(r);
  }
  return rows;
}, [H, W, SEED]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };
console.log(`\n${H} houses x ${W}w per scenario · seed "${SEED}" · reference player, all defaults\n`);
console.log(`  scenario    wk1 men/coin   med life   alive @90/@180/@300   best fame   med fame@end   med peak gold   best rung`);
for(const r of out){
  console.log(`  ${r.sc.padEnd(10)} ${String(r.men0).padStart(5)} / ${String(r.gold0).padEnd(6)} ${String(med(r.lives)).padStart(7)}   ${String(r.alive90).padStart(6)} /${String(r.alive180).padStart(4)} /${String(r.alive300).padStart(4)}   ${String(r.fameBest).padStart(9)}   ${String(med(r.fameAtDeath)).padStart(12)}   ${String(med(r.goldPeak)).padStart(13)}   ${String(r.rungBest).padStart(9)}`);
}
console.log(`\n  lifespans, whole spread — the median above is NOT the claim:`);
for(const r of out)
  console.log(`  ${r.sc.padEnd(10)} ${r.lives.sort((a,b)=>a-b).join(" ")}`);
console.log(`\n  endings:`);
for(const r of out)
  console.log(`  ${r.sc.padEnd(10)} ${Object.entries(r.ends).map(([k,v])=>`${k} ${v}`).join(" · ")}`);

await browser.close(); server.close();
