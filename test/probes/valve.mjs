/* #172 — ARE THE THREE FAVOURS SAFETY VALVES, AND WERE THEY ONLY EVER MEASURED WRONG?

   #171 measured the magistrate, the noble and the senator — called at the best moment anybody has
   found for each — at −26.7 weeks of life over 240 houses, worse than calling nothing. #172 was
   opened on that with a clause: *falsifies if the three are not meant to pay for themselves in the
   house's own numbers. The magistrate's is a safety valve against a rival taking a man, and a lever
   that buys nothing on average may still be the one that saves a particular run.*

   And v3.64.0 says the same thing from the other side: one house's LIFE varies by a standard
   deviation of 139 weeks on a 420-week run, so 72 houses cannot see a difference under 33 and even
   240 cannot see one under 18. Median life is the worst available instrument for a lever that fires
   a handful of times a run. **So this probe stops measuring the three by how long the house lived
   and measures each by the thing its own `run` acts on**, which is a count and not a lifetime:

     magistrate   `d.poach` is a three-week fuse ending in `defect`. Count the fuses that LIT and the
                  ones that BURNED — men actually lost — not the weeks the house survived afterwards.
     noble        she takes a fifth of the biggest name in the bay. Count the weeks the house spent
                  BEHIND that name, which is the thing being bought.
     senator      `romeEarly` takes 150 off `romeBar`. Count the imperial runs reached and whether
                  the house ever got there at all.

   Conditioning is on the STATE AT THE TIME and never on the outcome: a poach that started is a
   poach that started whether or not the house later ruined. Selecting on how the run ended would
   manufacture the effect the clause is asking about.

   THE ARMS, control first, same seeds throughout:
     control · each of the three alone on its own trigger · and the three together, which is #172's
   The merchant is excluded from every arm — #171 established he is the one that pays, and leaving
   him in would hide the other three behind him again.

   Usage: node test/probes/valve.mjs [houses per prefix] [weeks] [seed]
*/
import { serve, open, needN, sayNeed } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420), SEED = process.argv[4] || "VLV";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const PRES = [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`];

  const arm = (opts) => {
    const rows = {};
    let cur = null;
    const orig = A.doFight;
    A.doFight = function(d, gid, offer, tactic, bet, pending){
      const fresh = !pending;
      const r = orig.apply(this, arguments);
      if(cur){ if(fresh) cur.bouts++; if(r && !r.__err && !r.crux && r.dead) cur.deaths++; }
      return r;
    };
    try {
      for(const pre of PRES){
        for(let h=0; h<H; h++){
          const id = `${pre}#${h}`;
          const d = A.newGameState("Vl"+h, "clean", id, null);
          cur = { bouts:0, deaths:0 };
          let w = 0, lit = 0, behind = 0, hadPoach = false, calls = 0;
          for(; w<W; w++){
            if(d.over) break;
            const did = R.lanista(d, opts);
            if(!d.lanista) break;
            for(const k of Object.keys(did||{})) if(k.indexOf("favour:") === 0) calls += did[k];
            /* a fuse that LIT: `d.poach` was not there last week and is now */
            if(d.poach && !hadPoach) lit++;
            hadPoach = !!d.poach;
            /* the weeks spent behind the biggest name in the bay */
            const top = (d.rivals||[]).reduce((m,x)=>Math.max(m, x.fame||0), 0);
            if(top > (d.fame||0)) behind++;
          }
          const burned = (d.defected||[]).length;
          rows[id] = { life:w, alive: w >= W ? 1 : 0, calls,
            lit, burned, survived: lit - burned,
            burnRate: lit ? burned/lit*100 : null,
            behind, behindPct: w ? behind/w*100 : null,
            rome: A.romeRuns ? A.romeRuns(d) : 0, everRome: (A.romeRuns ? A.romeRuns(d) : 0) > 0 ? 1 : 0,
            bouts: cur.bouts, deaths: cur.deaths,
            deathRate: cur.bouts ? cur.deaths/cur.bouts*100 : null,
            ruin: d.over && d.over.kind === "ruin" ? 1 : 0 };
          cur = null;
        }
      }
    } finally { A.doFight = orig; cur = null; }
    return rows;
  };

  const only = (...keep) => ({ favours:"wise",
    favourSkip: ["magistrate","merchant","noble","senator"].filter(k=>keep.indexOf(k) < 0) });

  const arms = [];
  arms.push({ label:"control", rows: arm(undefined) });          /* control FIRST */
  arms.push({ label:"magistrate", rows: arm(only("magistrate")) });
  arms.push({ label:"noble", rows: arm(only("noble")) });
  arms.push({ label:"senator", rows: arm(only("senator")) });
  arms.push({ label:"the three", rows: arm(only("magistrate","noble","senator")) });
  return { arms, H, W, PRES };
}, [H, W, SEED]);

/* ---------------- report ---------------- */
const base = out.arms[0].rows;
const ids = Object.keys(base);
const KEYS = ["lit","burned","survived","behindPct","rome","everRome","life","deathRate","alive","ruin","calls"];
const mean = (rows, k) => { const v = ids.map(id=>rows[id] && rows[id][k]).filter(x=>x!=null);
  return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; };
const total = (rows, k) => ids.reduce((a,id)=>a + ((rows[id] && rows[id][k]) || 0), 0);

console.log(`\n#172 — THE THREE FAVOURS, MEASURED BY WHAT EACH ONE ACTS ON`);
console.log(`${ids.length} houses of ${out.W} weeks an arm, ${out.PRES.length} seed prefixes, control first, paired house for house`);
console.log(`(the merchant is out of every arm — #171 established he is the one that pays)\n`);

console.log(`  arm          calls   poaches lit   men lost   burn rate   weeks behind   imperial runs   ever Rome`);
for(const a of out.arms)
  console.log(`  ${a.label.padEnd(12)} ${total(a.rows,"calls").toString().padStart(5)} `
    + `${total(a.rows,"lit").toString().padStart(13)} ${total(a.rows,"burned").toString().padStart(10)} `
    + `${(total(a.rows,"lit") ? total(a.rows,"burned")/total(a.rows,"lit")*100 : 0).toFixed(1).padStart(10)}% `
    + `${(mean(a.rows,"behindPct")||0).toFixed(1).padStart(13)}% `
    + `${total(a.rows,"rome").toString().padStart(14)} ${total(a.rows,"everRome").toString().padStart(11)} of ${ids.length}`);

console.log(`\n  arm          median life   deaths a bout   alive at ${out.W}w   ruinous ends`);
for(const a of out.arms){
  const lives = ids.map(id=>a.rows[id].life).sort((x,y)=>x-y);
  console.log(`  ${a.label.padEnd(12)} ${String(lives[Math.floor(lives.length/2)]).padStart(9)}w `
    + `${(mean(a.rows,"deathRate")||0).toFixed(2).padStart(14)}% ${total(a.rows,"alive").toString().padStart(13)} `
    + `${total(a.rows,"ruin").toString().padStart(14)}`);
}

for(const a of out.arms.slice(1)){
  console.log(`\n  ${a.label.toUpperCase()} against the control — and what the sample can actually see`);
  for(const k of KEYS){
    const d = ids.map(id => { const x = a.rows[id] && a.rows[id][k], y = base[id] && base[id][k];
      return (x == null || y == null) ? null : x - y; }).filter(x=>x != null);
    const r = needN(d);
    if(r.mean == null) continue;
    console.log(`    ${sayNeed(k, r)}`);
  }
}
console.log();

await browser.close();
server.close();
