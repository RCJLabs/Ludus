/* CAN A GREAT HOUSE LOSE THE PEOPLE IN IT?

   #131's second candidate, and the premise was wrong before a single week was played. I had it written
   down as "staff who walk out at unrest 90 never do, because a great house's unrest is 1.7". Reading
   the file first — which is the cheap half of proving an instrument — there is no 90 anywhere, there is
   no single gate, and two of the three doors have nothing to do with unrest:

     medicus     d.unrest > 72 || repStyle(d) === "blood"     R()<0.06/wk after 6 weeks
     armourer    d.gold < -120                                R()<0.06/wk after 6 weeks
     household   d.unrest > 78 || d.gold < -80                R()<0.05/wk after 8 weeks, never the wife
     poached     rival grudge >= 40 && warmth < 45            R()<0.02/wk after 10 weeks (staff only)

   So the item as I framed it is already part-refuted: the medicus door is OR'd with a POLICY the
   player chooses, and `chair` measures that arm firing every run — the butcher loses his surgeon. The
   armourer door is pure insolvency. Both debt arms describe a house that is failing, which is exactly
   the house #131 is NOT about.

   That leaves the real question, and it is narrower and better than the one I set out with:
   FOR A HOUSE THAT IS LATE, SOLVENT AND NOT RUN ON BLOOD — the great house of the estate table — is
   there any door at all? Only two are left for it: unrest over 72/78, and a rival poaching. So this
   measures how often each gate is OPEN, in house-weeks, before it measures how often anything fires.
   A gate that is never open and a gate that is open constantly while the roll never lands are two
   completely different findings, and a fire count alone cannot tell them apart.

   ---- INSTRUMENT ----
   · The gate predicates are re-evaluated here rather than trusted from a count, and every one of them
     is a pure read. The game's own copies are at ludus.jsx STAFF.quitOn / householdWeek.
   · Losses are detected as present -> absent transitions on d.medicus, d.armourer and the household
     keys, NOT from the chronicle, which rolls at LOG_ROLL and undercounts by an amount that grows
     with the length of the run. The rope re-hires, so a raw count of "does he have one" would read
     an absence and a churn identically.
   · Unrest is printed as a SPREAD, not a median. The 1.7 that sent me here is one number from one
     probe, and one number is what this exists to check. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);
const LATE = +(process.argv[4] || 180);          // "a great house" — year 10 and up
/* ---- TWO FAULTS IN THE FIRST DRAFT OF THIS PROBE, BOTH MINE ----
   · `great` was defined as late AND SOLVENT, and then the table proudly reported that the two debt
     doors are open on 0.00% of great-house weeks. That is not a measurement, it is the definition
     read back. `great` is now late and not-blood, and solvency is MEASURED beside it — a late house
     can and does go into debt, and whether it does is the question, not the filter.
   · the seed prefix was hard-coded, so this probe's lifespans could not be compared against any other
     probe's. `reach.mjs` read a median of 196 weeks an hour before this read ~120, and the only
     honest way to tell a real difference from two draws of the same distribution is to run BOTH on
     the same seeds. It is an argument now. (`repStyle`, `warmth` and `houseFolk` were checked first
     and are pure reads — no RNG, no mutation — so observing every week does not move the run.) */
const SEED = process.argv[5] || "WALK";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,LATE,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const unrestAll = [], unrestLate = [], unrestGreat = [];
  const openW = { medUnrest:0, medBlood:0, armDebt:0, hhUnrest:0, hhDebt:0, poach:0 };
  const greatOpen = { medUnrest:0, medBlood:0, armDebt:0, hhUnrest:0, hhDebt:0, poach:0 };
  const fires = { medicus:0, armourer:0, household:0 };
  const firedAt = [], greatWeeksByHouse = [];
  let allW = 0, lateW = 0, greatW = 0, greatBroke = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Wk"+h, "clean", `${SEED}-${h}`, null);
    let hadMed = false, hadArm = false, hadHH = {};
    let greatWeeks = 0;
    for(let w=0; w<W; w++){
      if(d.over) break;
      const un = d.unrest || 0, gold = d.gold || 0;
      const blood = A.repStyle(d) === "blood";
      const solvent = gold >= 0;
      const late = d.week >= LATE;
      /* the great house of the estate table: late and not run on blood. SOLVENCY IS NOT IN THE
         DEFINITION — it is measured below, because "the debt doors never open for a solvent house"
         is the definition read back rather than a finding. */
      const great = late && !blood;
      allW++; unrestAll.push(un);
      if(late){ lateW++; unrestLate.push(un); }
      if(great){ greatW++; greatWeeks++; unrestGreat.push(un); if(!solvent) greatBroke++; }

      const grudged = (d.rivals||[]).some(x=>x.grudge>=40 && A.warmth(d,x.name)<45);
      const g = { medUnrest: un > 72, medBlood: blood, armDebt: gold < -120,
                  hhUnrest: un > 78, hhDebt: gold < -80, poach: grudged };
      for(const k of Object.keys(g)) if(g[k]){ openW[k]++; if(great) greatOpen[k]++; }

      /* who is in the house before the week runs */
      const med0 = !!d.medicus, arm0 = !!d.armourer;
      const hh0 = Object.keys(A.houseFolk(d) || {});
      R.lanista(d);
      const hh1 = new Set(Object.keys(A.houseFolk(d) || {}));

      /* ---- AND THE HALF THE ESTATE TABLE COULD NOT SEE ----
         "staff at 100% of late weeks" is a SNAPSHOT of presence. It cannot tell a role that was never
         lost from one lost and refilled before anybody looked. So each loss is left open and the week
         the seat refills is recorded against it, with the house's gold at the moment it went empty. */
      const lose = (who) => { fires[who === "medicus" || who === "armourer" ? who : "household"]++;
        firedAt.push({ h, w:d.week, who, un, gold, blood, great, back:null, backW:null }); };
      if(med0 && !d.medicus) lose("medicus");
      if(arm0 && !d.armourer) lose("armourer");
      for(const k of hh0) if(!hh1.has(k)) lose(k);
      /* has anything refilled? */
      const now = { medicus:!!d.medicus, armourer:!!d.armourer };
      for(const f of firedAt){
        if(f.h !== h || f.back != null) continue;
        const filled = f.who === "medicus" ? now.medicus : f.who === "armourer" ? now.armourer : hh1.has(f.who);
        if(filled){ f.back = d.week - f.w; f.backW = d.week; f.goldBack = Math.round(d.gold||0); }
      }
      hadMed = hadMed || med0; hadArm = hadArm || arm0; hh0.forEach(k=>hadHH[k]=1);
    }
    greatWeeksByHouse.push({ h, greatWeeks, lived:d.week, over: d.over?d.over.kind:null,
      unrest: Math.round(d.unrest||0), gold: Math.round(d.gold||0),
      blood: A.repStyle(d)==="blood", med:!!d.medicus, arm:!!d.armourer,
      hh: Object.keys(A.houseFolk(d)||{}).length });
  }
  return { unrestAll, unrestLate, unrestGreat, openW, greatOpen, fires, firedAt,
    greatWeeksByHouse, allW, lateW, greatW, greatBroke };
}, [H, W, LATE, SEED]);

const q = (a, f) => { if(!a.length) return "-"; const s=a.slice().sort((x,y)=>x-y);
  return +s[Math.min(s.length-1, Math.floor(s.length*f))].toFixed(1); };
const spread = a => a.length
  ? `min ${q(a,0)} · p25 ${q(a,.25)} · median ${q(a,.5)} · p75 ${q(a,.75)} · p90 ${q(a,.90)} · p99 ${q(a,.99)} · max ${q(a,1)}`
  : "no weeks";
const pc = (n,dn) => dn ? `${(n/dn*100).toFixed(2)}%` : "-";

console.log(`\n${H} houses x ${W}w · seed "${SEED}" · "great" = week >= ${LATE} and not blood`
  + ` (solvency measured, NOT assumed)\n`);
console.log(`  UNREST, the raw spread rather than the one number that sent me here`);
console.log(`    all ${out.allW} house-weeks     ${spread(out.unrestAll)}`);
console.log(`    ${out.lateW} late weeks          ${spread(out.unrestLate)}`);
console.log(`    ${out.greatW} great-house weeks   ${spread(out.unrestGreat)}`);
console.log(`    of those great-house weeks, ${out.greatBroke} were spent IN DEBT `
  + `(${pc(out.greatBroke,out.greatW)}) — so the debt doors are not excluded by construction\n`);

const LBL = { medUnrest:"medicus  · unrest > 72", medBlood:"medicus  · blood repStyle",
  armDebt:"armourer · gold < -120", hhUnrest:"household· unrest > 78",
  hhDebt:"household· gold < -80", poach:"poached  · grudge>=40, warmth<45" };
console.log(`  HOW OFTEN EACH DOOR IS OPEN — house-weeks, before any roll is made`);
console.log(`    gate                              all weeks            great-house weeks`);
for(const k of Object.keys(LBL))
  console.log(`    ${LBL[k].padEnd(32)}  ${String(out.openW[k]).padStart(6)} ${pc(out.openW[k],out.allW).padStart(8)}`
    + `     ${String(out.greatOpen[k]).padStart(5)} ${pc(out.greatOpen[k],out.greatW).padStart(8)}`);

console.log(`\n  WHAT ACTUALLY LEFT`);
console.log(`    medicus ${out.fires.medicus} · armourer ${out.fires.armourer} · household ${out.fires.household}`
  + `  (total ${out.fires.medicus+out.fires.armourer+out.fires.household} over ${out.allW} house-weeks)`);
const greatFires = out.firedAt.filter(f=>f.great);
console.log(`    of those, ${greatFires.length} happened to a LATE, NON-BLOOD house`
  + (greatFires.length ? ` — and the gold column is why the answer is not "yes":` : " — which is #131's whole question"));
for(const f of greatFires.slice(0,14))
  console.log(`      house ${String(f.h).padStart(2)} week ${String(f.w).padStart(3)}: ${f.who.padEnd(9)} left`
    + ` · unrest ${String(Math.round(f.un)).padStart(3)} · gold ${String(Math.round(f.gold)).padStart(6)}`
    + `  ${f.gold < 0 ? "<- IN DEBT: this is a failing house, not a great one" : ""}`);
const greatRich = greatFires.filter(f=>f.gold >= 0);
console.log(`    and of THOSE, ${greatRich.length} happened to one that was also solvent`
  + ` — the house #131 is actually about`);

/* ---- HOW LONG THE SEAT STAYS EMPTY, WHICH IS WHAT MAKES THE LOSS INVISIBLE ---- */
const back = out.firedAt.filter(f=>f.back != null);
const never = out.firedAt.filter(f=>f.back == null);
console.log(`\n  AND THEN WHAT — the estate table reads PRESENCE at a snapshot, which cannot tell a role`);
console.log(`  that was never lost from one lost and refilled before anybody looked.`);
console.log(`    refilled ${back.length} of ${out.firedAt.length} losses`
  + (back.length ? ` · weeks empty: median ${q(back.map(f=>f.back),.5)}, `
     + `range ${Math.min(...back.map(f=>f.back))}-${Math.max(...back.map(f=>f.back))}` : ""));
console.log(`    still empty at the end: ${never.length}`);
const richBack = back.filter(f=>f.great && f.gold >= 0);
if(richBack.length){
  console.log(`    for the late, solvent house — the loss and the undoing, side by side:`);
  for(const f of richBack)
    console.log(`      house ${String(f.h).padStart(2)}: ${f.who.padEnd(9)} left week ${String(f.w).padStart(3)}`
      + ` holding ${String(Math.round(f.gold)).padStart(5)}d · back after ${String(f.back).padStart(2)}w`
      + ` still holding ${String(f.goldBack).padStart(5)}d`);
}
if(out.firedAt.length){
  console.log(`\n    a sample of every loss, whatever the house looked like:`);
  for(const f of out.firedAt.slice(0,14))
    console.log(`      house ${String(f.h).padStart(2)} week ${String(f.w).padStart(3)}: ${f.who.padEnd(9)}`
      + ` unrest ${String(Math.round(f.un)).padStart(3)} · gold ${String(Math.round(f.gold)).padStart(6)}`
      + ` · ${f.blood?"blood":"     "} · ${f.great?"GREAT HOUSE":""}`);
}
console.log(`\n  house  lived  greatWks  ending          unrest    gold  blood  med  arm  hh`);
for(const r of out.greatWeeksByHouse)
  console.log(`  ${String(r.h).padStart(5)}  ${String(r.lived).padStart(5)}  ${String(r.greatWeeks).padStart(8)}`
    + `  ${String(r.over||"still up").padEnd(14)}  ${String(r.unrest).padStart(6)} ${String(r.gold).padStart(7)}`
    + `  ${r.blood?"yes  ":"no   "}  ${r.med?"y":"-"}    ${r.arm?"y":"-"}   ${r.hh}`);

await browser.close(); server.close();
