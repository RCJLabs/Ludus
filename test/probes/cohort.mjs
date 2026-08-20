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

  /* ---- #176: DOES `standing` RESPOND TO AN ECONOMIC SQUEEZE, ON EACH OF THE FOUR READINGS? ----
     #142 swept three gutting levers over 60 houses and read `standing` 39 / 44 / 39 / 40 against
     `men` 128 / 123 / 94 / 104, and concluded **"`standing` is nearly inert and `men` is the half
     that responds"** — the sentence the current bar design rests on. It was read off `open.mjs`'s
     definition, which is `activeG(d).length > 0` and **ignores `d.over` entirely**. A house that
     went bankrupt in week nine but still has a fit man in the yard counts as standing under it.
     Going bankrupt is precisely what an economic squeeze causes. So the hypothesis is not that #142
     measured badly, it is that its instrument was blind to the failure mode its levers produce.
     The lever here is the opening purse, which needs NO patching — the handle is an object of copied
     references and the engine calls the module-scope binding (#173), so a patched `weeklyBill` would
     be a silent no-op. `d.gold` is state, and state is what the engine reads. One lever, not three,
     and the claim under test is only "is it inert", which one responding lever settles. */
  const squeeze = [];
  for(const gold of [800, 400, 150, 50]){
    const rows = [];
    for(const pre of PRES){
      for(let h=0; h<60; h++){
        const d = A.newGameState("Sq"+h, "clean", `${pre}-SQ-${h}`, null);
        d.gold = gold;
        for(let w=0; w<W; w++){ if(d.over) break; R.lanista(d); if(!d.lanista) break; }
        rows.push({ pre, over: d.over ? (d.over.kind||"ended") : null,
                    yard: inYard(d), fit: (d.gladiators||[]).filter(g=>g.status==="active").length });
      }
    }
    squeeze.push({ gold, rows });
  }
  return { cohorts, squeeze, W, PRES };
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

/* ---------------- #176: the squeeze ---------------- */
const DEFS = [
  ["survive   !over && yard>0", h=>!h.over && h.yard>0],
  ["          !over && fit>0 ", h=>!h.over && h.fit>0],
  ["open.mjs  fit>0          ", h=>h.fit>0],
  ["          yard>0         ", h=>h.yard>0],
];
console.log(`\n#176 — DOES \`standing\` RESPOND TO AN ECONOMIC SQUEEZE?`);
console.log(`the opening purse, ${out.squeeze[0].rows.length} houses a level, ${out.W} weeks, ${out.PRES.length} seed prefixes\n`);
console.log(`  opening gold   ` + DEFS.map(([l])=>l.trim().padStart(18)).join("") + `        men   ended`);
for(const S of out.squeeze){
  const n = S.rows.length;
  const cells = DEFS.map(([,f]) => {
    const k = S.rows.filter(f).length;
    return `${k} (${(k/n*100).toFixed(0)}%)`.padStart(18);
  }).join("");
  const men = S.rows.reduce((a,h)=>a+h.yard, 0);
  const ended = S.rows.filter(h=>h.over).length;
  console.log(`  ${String(S.gold).padStart(12)}   ${cells} ${String(men).padStart(10)} ${String(ended).padStart(7)}`);
}
{
  const a = out.squeeze[0], b = out.squeeze[out.squeeze.length-1], n = a.rows.length;
  console.log(`\n  fall from ${a.gold}d to ${b.gold}d, in points:`);
  for(const [lbl,f] of DEFS){
    const x = a.rows.filter(f).length/n*100, y = b.rows.filter(f).length/n*100;
    const d = y - x;
    console.log(`    ${lbl}  ${x.toFixed(0)}% -> ${y.toFixed(0)}%   ${d>=0?"+":""}${d.toFixed(1)} points`
      + (Math.abs(d) < 3 ? "   <- inert" : ""));
  }
  const mA = a.rows.reduce((s,h)=>s+h.yard,0), mB = b.rows.reduce((s,h)=>s+h.yard,0);
  console.log(`    men                         ${mA} -> ${mB}   ${((mB-mA)/mA*100).toFixed(1)}%`);
  console.log(`\n  the ending mix, which is the mechanism:`);
  for(const S of [a,b]){
    const mix = {}; S.rows.forEach(h=>{ const k = h.over||"alive"; mix[k]=(mix[k]||0)+1; });
    console.log(`    ${String(S.gold).padStart(4)}d: ` + Object.entries(mix).sort((x,y)=>y[1]-x[1])
      .map(([k,v])=>`${k} ${v}`).join(" · "));
  }
  const deadFit = b.rows.filter(h=>h.over && h.fit>0).length;
  console.log(`\n  houses that ENDED but still hold a fit man, at ${b.gold}d: ${deadFit} of ${n}`);
  console.log(`  — every one of those counts as "standing" under \`open.mjs\`'s reading and not under \`survive\`'s.`);

  /* ---- COULD 60 HOUSES ON ONE PREFIX HAVE READ 39 -> 39? ----
     #142's figures came from 60 houses, which is what `open.mjs` runs, on one seed family. #136's
     rule has fired five times in this project: a bar taken over a handful of houses is a bar on one
     RNG trajectory. The four prefixes here are four independent 60-house runs, so the spread at
     that sample is free to read rather than argue about. */
  console.log(`\n  THE SAME LEVER, PREFIX BY PREFIX — four independent 60-house runs, open.mjs's own reading`);
  console.log(`    prefix        800d      150d      change       #142 read 39 -> 39 of 60`);
  const g150 = out.squeeze.find(x=>x.gold === 150);
  for(const pre of out.PRES){
    const A2 = a.rows.filter(h=>h.pre===pre), B2 = g150.rows.filter(h=>h.pre===pre);
    const x = A2.filter(h=>h.fit>0).length, y = B2.filter(h=>h.fit>0).length;
    console.log(`    ${pre.padEnd(10)} ${String(x).padStart(6)}/${A2.length} ${String(y).padStart(6)}/${B2.length}`
      + `   ${(y-x)>=0?"+":""}${y-x}`);
  }
  const per = out.PRES.map(pre => {
    const A2 = a.rows.filter(h=>h.pre===pre), B2 = g150.rows.filter(h=>h.pre===pre);
    return B2.filter(h=>h.fit>0).length - A2.filter(h=>h.fit>0).length; });
  const mu = per.reduce((s,v)=>s+v,0)/per.length;
  const sd = Math.sqrt(per.reduce((s,v)=>s+(v-mu)**2,0)/Math.max(1,per.length-1));
  console.log(`    mean change ${mu.toFixed(1)} houses, sd ${sd.toFixed(1)} across the four runs;`);
  console.log(`    #142's 0 sits ${sd ? Math.abs((0-mu)/sd).toFixed(1) : "?"} standard deviations from this mean.`);
}
console.log();

await browser.close();
server.close();
