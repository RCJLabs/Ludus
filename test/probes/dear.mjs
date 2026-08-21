/* DOES THE DEAR END OF THE RACK ACTUALLY WIN? — the question under the armory's sort order

   The armory lists gear cheapest first. Price tracks quality across the catalogue (weapon rho +0.79,
   armor +0.65, offhand +0.55, helm +0.43), and the reference player's rule is the opposite of the
   list's: it buys the most expensive piece it can afford. So a player following that rule scrolls
   2,942px to the bottom of the weapon rack on every purchase.

   Before reordering a list around that rule, the rule has to be worth following. It is a policy I
   wrote, not an observation — #180 and #183 both turned on exactly this distinction. So: the same
   seeds twice, one arm buying the dearest affordable piece and one the cheapest, everything else
   identical.

   MEASURED ON WHAT THE LEVER TOUCHES. Gear changes what happens on the sand, so this counts bouts,
   wins and burials — not house LIFE, which carries an sd of 139 weeks on a long run and would need
   a sample this cannot afford. Paired by seed, so the difference is read house by house rather than
   arm mean against arm mean.

   Usage: node test/probes/dear.mjs [houses per prefix] [weeks]
*/
import { serve, open, installRope, needN } from "../harness.mjs";
const H = +(process.argv[2] || 30), W = +(process.argv[3] || 40);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const run = (seed, end) => {
    const d = A.newGameState("Dr", "clean", seed, null);
    for(let w=0; w<W; w++){ if(d.over) break; R.lanista(d, { gearEnd: end }); }
    const b = d.book || {};
    return { n: b.n||0, w: b.w||0, killed: b.killed||0, fame: Math.round(d.fame||0),
      men: A.activeG(d).length, gold: Math.round(d.gold||0), over: !!d.over, week: d.week };
  };
  const pairs = [];
  for(const pre of ["DEAR-1","DEAR-2","DEAR-3"])
    for(let h=0; h<H; h++){
      const seed = `${pre}-${h}`;
      pairs.push({ pre, dear: run(seed, "dear"), cheap: run(seed, "cheap") });
    }
  return pairs;
}, [H,W]);

const col = (k, arm) => out.map(x=>x[arm][k]);
const mean = a => a.reduce((s,x)=>s+x,0)/a.length;
console.log(`\nDOES THE DEAR END OF THE RACK ACTUALLY WIN?`);
console.log(`  ${out.length} seeds, each played twice — ${W} weeks\n`);
console.log(`  ${"".padEnd(12)} ${"dearest".padStart(9)} ${"cheapest".padStart(9)} ${"diff".padStart(8)}   ${"detectable?".padStart(28)}`);
for(const [k,label] of [["n","bouts"],["w","wins"],["killed","burials"],["fame","fame"],["men","men alive"],["gold","gold"]]){
  const D = col(k,"dear"), C = col(k,"cheap");
  const diffs = D.map((x,i)=>x-C[i]);
  const nn = needN(diffs);
  const md = mean(diffs);
  const detect = nn && nn.mde != null
    ? `mde ${nn.mde.toFixed(2)} — ${Math.abs(md) > nn.mde ? "YES" : "no, inside the noise"}`
    : "—";
  console.log(`  ${label.padEnd(12)} ${mean(D).toFixed(1).padStart(9)} ${mean(C).toFixed(1).padStart(9)} `
    + `${(md>=0?`+${md.toFixed(2)}`:md.toFixed(2)).padStart(8)}   ${detect.padStart(28)}`);
}
const wr = arm => { const n=mean(col("n",arm)), w=mean(col("w",arm)); return n? w/n : 0; };
const dr = arm => { const n=mean(col("n",arm)), k=mean(col("killed",arm)); return n? k/n*100 : 0; };
console.log(`\n  win rate   dearest ${(wr("dear")*100).toFixed(1)}%  ·  cheapest ${(wr("cheap")*100).toFixed(1)}%`);
console.log(`  burials a hundred bouts   dearest ${dr("dear").toFixed(2)}  ·  cheapest ${dr("cheap").toFixed(2)}`);
console.log(`  houses ended   dearest ${col("over","dear").filter(Boolean).length}  ·  cheapest ${col("over","cheap").filter(Boolean).length}`);
/* #136, for the seventh time: a bar taken over one trajectory is a bar on one trajectory. The only
   difference that cleared its mde is men alive, so it is the one that has to hold on each prefix
   separately, or it is a fact about a seed rather than about gear. */
console.log(`\n  AND THE ONE DETECTABLE DIFFERENCE, PER PREFIX — men alive:`);
for(const pre of [...new Set(out.map(x=>x.pre))]){
  const g = out.filter(x=>x.pre===pre);
  const d = g.map(x=>x.dear.men), c = g.map(x=>x.cheap.men);
  const diffs = d.map((x,i)=>x-c[i]); const nn = needN(diffs);
  const md = diffs.reduce((s,x)=>s+x,0)/diffs.length;
  console.log(`     ${pre}  n=${g.length}  dearest ${(d.reduce((s,x)=>s+x,0)/d.length).toFixed(2)} `
    + `· cheapest ${(c.reduce((s,x)=>s+x,0)/c.length).toFixed(2)} · diff ${md>=0?"+":""}${md.toFixed(2)} `
    + `· mde ${nn && nn.mde!=null ? nn.mde.toFixed(2) : "—"} ${nn && nn.mde!=null && Math.abs(md)>nn.mde ? "clears it" : "inside the noise"}`);
}
console.log();
await browser.close(); server.close();
