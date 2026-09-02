/* #217 — WHETHER A HOUSE EVER SPENDS ITS FORTUNE ON STONE

   The item: "Median era gold 991 -> 4,163 -> 4,361 -> 3,480, and the two big sinks — public works
   and monuments — engaged 0 times in 16 runs (rope). The shelf exists and nothing pulls a house
   toward it. Recommend the works become the named late-game ladder: agenda items when the box can
   afford one, rivals racing you to them, the census noticing."

   TWO OF THE THREE ARE ALREADY ANSWERED IN THE FILE, and the third is answered with a reason:

     the agenda    #138 and #141 built it and then fixed it twice. It names the work THIS house
                   needs (`workNeed` reads unrest, sulking men, worn men) and gates on the deposit
                   rather than the full price, which is `beginWork`'s own gate.
     the census    `censusWorth` counts the box, the debts, the racks, the men and the wings, and
                   its note says the works were "left out DELIBERATELY, because the measurement was
                   taken without them and a term nobody has measured is a term nobody should ship."
     the rivals    nothing. `d.rivals` has no concept of building.

   AND THE "(rope)" IS NOT THE CONCESSION IT LOOKS LIKE. `beginWork`'s only callers were two villa
   buttons until #138 gave the reference player a `works:true` policy — which was made OPT-IN, on
   the record, with the reason: "switching it on re-bases what a long-lived house owns and earns
   (five perk streams), and flipping the default is its own release with every affected figure
   re-measured." Every gold figure in this audit was taken from a player that never builds.

   So this measures both sides of that switch. The same houses, the same seeds, with the works
   policy off and on: what the box holds era by era, how many of the nine ever get commissioned and
   finished, what the instalments cost, what the perks pay back, and what the census would read if
   stone counted the way the wings already do.

     node test/probes/works.mjs 12 460 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 460);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"WORKS" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","ALL_WORK_KEYS","workDef","workDone","workOn","workOpen",
    "WORK_DEPOSIT","workWeekly","censusWorth","beginWork","workUpkeep"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const ERA = 18*4;   /* four years to an era, the bands the item quotes */
  const arm = (works) => {
    const eras = [[],[],[],[]];
    let weeks = 0, commissioned = 0, finished = 0, houses = 0, fell = 0;
    const done = {}, everOpen = {}, nagWeeks = [], rivBuilt = {}; let rivOn = 0;
    const stoneWorth = [], boxWorth = [];
    let hadHint = 0, couldBuild = 0;
    for(let h=0; h<H; h++){
      houses++;
      const d = A.newGameState("Works", "clean", "WORKS-"+h, null);
      const seen = new Set();
      for(let w=0; w<W; w++){
        if(d.over) break;
        try { R.lanista(d, { works }); } catch(e){ break; }
        weeks++;
        const era = Math.min(3, Math.floor(d.week / ERA));
        eras[era].push(Math.round(d.gold||0));
        /* the door: a work open, unstarted, and the deposit affordable */
        const buildable = A.ALL_WORK_KEYS.filter(k=>!A.workDone(d,k) && !A.workOn(d,k)
          && A.workOpen(d,k) && d.gold >= Math.ceil(A.workDef(k).cost*A.WORK_DEPOSIT));
        if(buildable.length) couldBuild++;
        const anyOn = A.ALL_WORK_KEYS.some(k=>A.workOn(d,k));
        if(buildable.length && !anyOn) hadHint++;
        for(const k of A.ALL_WORK_KEYS){
          if(A.workOn(d,k) && !seen.has("on:"+k)){ seen.add("on:"+k); commissioned++; }
          if(A.workDone(d,k) && !seen.has("up:"+k)){ seen.add("up:"+k); finished++;
            done[k] = (done[k]||0)+1; }
          if(A.workOpen(d,k) && !A.workDone(d,k)) everOpen[k] = (everOpen[k]||0)+1;
        }
      }
      /* what the census reads, and what it would read if stone counted */
      const stone = A.ALL_WORK_KEYS.reduce((n,k)=>{ const Wd = A.workDef(k);
        const w2 = (d.works||{})[k];
        return n + (w2 ? (Wd.cost - (w2.owed||0)) : 0); }, 0);
      boxWorth.push(A.censusWorth(d)); stoneWorth.push(Math.round(stone));
      nagWeeks.push(d.week);
      /* and what the bay put up while you were deciding */
      for(const rh of (d.rivals||[])){
        for(const k of (rh.built||[])) rivBuilt[k] = (rivBuilt[k]||0)+1;
        if(rh.work) rivOn++;
      }
      if(d.over) fell++;
    }
    const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
      return { n:s.length, p50:s[Math.floor(s.length/2)], p90:s[Math.floor(s.length*0.9)], max:s[s.length-1] }; };
    return { weeks, houses, fell, commissioned, finished, done,
      era: eras.map(e=>q(e)), census:q(boxWorth), stone:q(stoneWorth),
      rivBuilt, rivOn, rivTotal: Object.values(rivBuilt).reduce((n,v)=>n+v,0),
      hintPc: weeks ? +(hadHint/weeks*100).toFixed(1) : 0,
      openPc: weeks ? +(couldBuild/weeks*100).toFixed(1) : 0 };
  };

  const off = arm(false), on = arm(true);
  /* and whether a rival house has any concept of stone at all */
  const probe = A.newGameState("Works", "clean", "WORKS-R", null);
  const rivalKeys = [...new Set((probe.rivals||[]).flatMap(h=>Object.keys(h)))];
  const rivalBuilds = rivalKeys.filter(k=>/work|build|stone|monu/i.test(k));
  return { off, on, rivalKeys, rivalBuilds };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  const show = (label, a) => {
    console.log(`${label} — ${a.weeks} weeks over ${a.houses} houses (${a.fell} fell)`);
    console.log(`  gold by era:   ${a.era.map((e,i)=>`y${i*4+1}-${i*4+4} ${e?e.p50:"—"}`).join(" · ")}`);
    console.log(`  a work was commissionable on ${a.openPc}% of weeks · the agenda nagged on ${a.hintPc}%`);
    console.log(`  commissioned ${a.commissioned} · FINISHED ${a.finished}`
      + (Object.keys(a.done).length ? ` — ${Object.entries(a.done).map(([k,v])=>`${k} ${v}`).join(" · ")}` : ""));
    console.log(`  the census reads ${JSON.stringify(a.census)}`);
    console.log(`  stone paid for so far ${JSON.stringify(a.stone)}  <- and the census counts it now`);
    console.log(`  the bay put up ${a.rivTotal} of its own`
      + (Object.keys(a.rivBuilt).length ? ` — ${Object.entries(a.rivBuilt).map(([k,v])=>`${k} ${v}`).join(" · ")}` : "")
      + `, ${a.rivOn} house-weeks with masons in\n`);
  };
  show("WORKS OFF — the reference player every figure in this audit was taken from", out.off);
  show("WORKS ON  — the same houses, same seeds, `works:true`", out.on);
  console.log(`A RIVAL HOUSE'S FIELDS: ${out.rivalKeys.join(", ")}`);
  console.log(`  anything about building: ${out.rivalBuilds.length ? out.rivalBuilds.join(", ") : "NOTHING"}`);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
