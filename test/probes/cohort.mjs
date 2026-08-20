/* WHAT `survive`'s TWO READINGS ACTUALLY COUNT — and whether they count the same houses

   `survive` reports a pair, and every bar it has is built on that pair:

       standing = live.filter(x => !x.over && x.yard > 0).length     houses NOT ended, with men
       men      = live.reduce((n,x) => n + x.yard, 0)                 yards summed over ALL houses

   The second sum runs over the ENDED houses too. So `men` is not the men the standing houses have;
   it is the men alive anywhere, including in the yards of houses that ruined at week nine. The
   summary line — "N houses still standing, M men between them" — reads as though M belongs to N,
   and it does not.

   THE COMMITTED RECORD ALREADY PROVES IT, with no run at all: four rows in the 89-run tally have
   `standing === 0` and `men > 0`, which is arithmetically impossible if the two readings measured
   the same houses. The loudest is v3.57.0 at **(0, 9)** — the check printed "not one of 5 houses
   came through able to field a man" with nine men alive between the yards, above the tally's own
   median of 5. All four failed the suite. They are four of the seven first-run failures in 57
   builds.

   What the record CANNOT say is how big the effect is, because the tally stores only the pair. That
   is what this measures: over many cohorts of five houses at `survive`'s own shape, how much of
   `men` is contributed by houses that have already ended, and what the bars would fire on if `men`
   counted the standing houses instead.

   IT IS NOT `survive`'s POLICY AND DOES NOT PRETEND TO BE. The rope buys and picks its bouts better
   than the browser check does, so its absolute standing rate is its own and is printed here only so
   the difference is visible rather than assumed. The quantity being measured — what share of the
   `men` sum sits in dead houses — is a property of the arithmetic, and the rope is entitled to
   report it. Where a figure depends on the policy it is labelled.

   Usage: node test/probes/cohort.mjs [cohorts per prefix] [weeks] [seed]
*/
import { serve, open } from "../harness.mjs";
const C = +(process.argv[2] || 40), W = +(process.argv[3] || 26), SEED = process.argv[4] || "COH";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([C,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const PRES = [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`, `${SEED}-4`];
  /* survive's own definition, copied not reconstructed */
  const inYard = d => (d.gladiators||[])
    .filter(g => g.status!=="dead" && g.status!=="gone" && g.status!=="freed").length;
  const cohorts = [];
  for(const pre of PRES){
    for(let c=0; c<C; c++){
      const houses = [];
      for(let h=0; h<5; h++){
        const d = A.newGameState("Ch"+h, "clean", `${pre}-${c}-${h}`, null);
        for(let w=0; w<W; w++){ if(d.over) break; R.lanista(d); if(!d.lanista) break; }
        houses.push({ over: d.over ? (d.over.kind||"ended") : null,
                      yard: inYard(d), fit: (d.gladiators||[]).filter(g=>g.status==="active").length });
      }
      cohorts.push(houses);
    }
  }
  return { cohorts, W, PRES };
}, [C, W, SEED]);

const cohorts = out.cohorts, N = cohorts.length;
/* ---- RAW MATERIAL FIRST: the twelve rows behind the first cohorts, unfiltered ---- */
console.log(`\nRAW — the first three cohorts, house by house, exactly what the two sums read:`);
for(let i=0;i<Math.min(3,N);i++)
  console.log(`  cohort ${i}: ` + cohorts[i].map(h=>`[${h.over?h.over:"up"} yard ${h.yard} fit ${h.fit}]`).join(" "));

const score = c => {
  const standing = c.filter(h=>!h.over && h.yard>0).length;
  const menAll   = c.reduce((n,h)=>n+h.yard, 0);                       /* what survive sums */
  const menUp    = c.filter(h=>!h.over).reduce((n,h)=>n+h.yard, 0);    /* men in houses still going */
  return { standing, menAll, menUp, menDead: menAll - menUp, ended: c.filter(h=>h.over).length };
};
const S = cohorts.map(score);
const sum = k => S.reduce((a,r)=>a+r[k],0);
const mean = k => sum(k)/N;

console.log(`\nWHAT THE TWO READINGS COUNT   —   ${N} cohorts of five houses, ${out.W} weeks, ${out.PRES.length} seed prefixes`);
console.log(`(the rope's policy, not the check's — see the head)\n`);
console.log(`  mean standing                       ${mean("standing").toFixed(2)} of 5`);
console.log(`  mean men, as \`survive\` sums them     ${mean("menAll").toFixed(2)}`);
console.log(`  mean men in houses still going       ${mean("menUp").toFixed(2)}`);
console.log(`  mean men inside houses that ENDED    ${mean("menDead").toFixed(2)}   = ${(sum("menDead")/sum("menAll")*100).toFixed(1)}% of the sum the bars read`);

const impossible = S.filter(r=>r.standing===0 && r.menAll>0);
console.log(`\n  cohorts reading standing 0 with men > 0   ${impossible.length} of ${N} (${(impossible.length/N*100).toFixed(1)}%)`);
console.log(`    — the shape the tally has four of. Under the corrected sum every one of them reads 0 men.`);
if(impossible.length) console.log(`    the largest such \`men\`: ${Math.max(...impossible.map(r=>r.menAll))}`);

/* ---- HOW THE CONTAMINATION SCALES, which is what lets this speak about the check's regime ----
   The rope stands about 4.4 houses of 5; `survive` stands 2.72 across 89 recorded runs. Those are
   different regimes and no rope arm should pretend otherwise. But the contaminating quantity — men
   sitting in the yards of ENDED houses — can only come from ended houses, so it can be measured as
   a function of how many there are, and read off at the check's own number instead of guessed. */
console.log(`\n  HOW IT SCALES WITH THE NUMBER OF HOUSES THAT ENDED`);
console.log(`    ended   cohorts   mean men (all)   mean men in dead houses   share of the sum`);
for(let k=0;k<=5;k++){
  const g = S.filter(r=>r.ended===k);
  if(!g.length) continue;
  const mAll = g.reduce((a,r)=>a+r.menAll,0)/g.length, mDead = g.reduce((a,r)=>a+r.menDead,0)/g.length;
  console.log(`    ${k}       ${String(g.length).padStart(5)}   ${mAll.toFixed(2).padStart(12)}   ${mDead.toFixed(2).padStart(21)}   ${(mAll?mDead/mAll*100:0).toFixed(1).padStart(13)}%`);
}
{
  /* a straight line through the buckets, so the check's own 2.28 ended houses can be read off */
  const pts = [];
  for(let k=0;k<=5;k++){ const g=S.filter(r=>r.ended===k); if(g.length>=5)
    pts.push([k, g.reduce((a,r)=>a+r.menDead,0)/g.length]); }
  if(pts.length>=2){
    const n=pts.length, sx=pts.reduce((a,q)=>a+q[0],0), sy=pts.reduce((a,q)=>a+q[1],0);
    const sxy=pts.reduce((a,q)=>a+q[0]*q[1],0), sxx=pts.reduce((a,q)=>a+q[0]*q[0],0);
    const b=(n*sxy-sx*sy)/(n*sxx-sx*sx), a0=(sy-b*sx)/n;
    const ENDED_CHECK = 5 - 2.72;   /* the 89-run tally's mean standing */
    console.log(`    a line through the buckets: ${a0.toFixed(2)} + ${b.toFixed(2)} per ended house`);
    console.log(`    \`survive\` averages ${ENDED_CHECK.toFixed(2)} ended houses a run, which reads off at`);
    console.log(`    ${(a0+b*ENDED_CHECK).toFixed(1)} of its ${5.36} mean men = ${((a0+b*ENDED_CHECK)/5.36*100).toFixed(0)}% of the sum its bars are read from`);
  }
}

/* ---- AND WHICH "STANDING" IS WHICH: `open.mjs` and `survive` do not use the same word ---- */
console.log(`\n  FOUR READINGS OF "STANDING", ON THESE SAME HOUSES`);
const defs = [
  ["survive:  !over && yard>0     (alive men, injured count)", h=>!h.over && h.yard>0],
  ["          !over && fit>0      (only men who can fight)  ", h=>!h.over && h.fit>0],
  ["open.mjs: fit>0, `over` ignored                         ", h=>h.fit>0],
  ["          yard>0, `over` ignored                        ", h=>h.yard>0],
];
const houses = cohorts.flat();
for(const [lbl,f] of defs)
  console.log(`    ${lbl}  ${houses.filter(f).length} of ${houses.length} = ${(houses.filter(f).length/houses.length*100).toFixed(0)}%`);
console.log(`    — if these disagree, a figure read off one of them does not transfer to another.`);

/* ---- what the bars fire on, current sum against the corrected one ---- */
const BOTH_HOUSE = 2, BOTH_MEN = 4;
const bars = (r, men) => ({
  collapse: r.standing === 0,
  empty:    men === 0,
  conj:     r.standing < BOTH_HOUSE && men < BOTH_MEN,
});
const anyBar = (r,men) => { const b = bars(r,men); return b.collapse || b.empty || b.conj; };
console.log(`\n  WHAT FIRES, on the same ${N} cohorts:`);
for(const [lbl, pick] of [["as it reads now (men over all houses)", r=>r.menAll],
                          ["with men counted over standing houses", r=>r.menUp]]){
  const c = S.filter(r=>bars(r,pick(r)).collapse).length;
  const e = S.filter(r=>bars(r,pick(r)).empty).length;
  const j = S.filter(r=>bars(r,pick(r)).conj).length;
  const a = S.filter(r=>anyBar(r,pick(r))).length;
  console.log(`    ${lbl.padEnd(40)} collapse ${String(c).padStart(3)} · empty ${String(e).padStart(3)} · conjunction ${String(j).padStart(3)} · ANY ${String(a).padStart(3)} (${(a/N*100).toFixed(1)}%)`);
}
console.log(`\n  the three bars overlap under the corrected sum by construction: standing 0 forces men 0.`);
console.log(`  so the question the fix asks is not "does it fire less" but "are the three bars three things".`);
console.log();

await browser.close();
server.close();
