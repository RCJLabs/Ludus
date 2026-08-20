/* HOW MANY HOUSES A FIGURE NEEDS — the instrument #171 said this project was missing

   Twenty-seven probes in this directory take a house count as their first argument and not one of
   them knows what it should be. Every long-run figure this project has published was read off a
   number chosen by feel — 12, 24, 30, 72 — and the one time that was checked, #171 found 72 was a
   third of what the question needed and the figure had already shipped. #136 has fired five times
   and this is the arithmetic that would have caught all five before the writing-up.

   It does not hunt for "where the number stops moving", which is a thing you cannot see without
   running every sample size. It measures the SPREAD BETWEEN HOUSES, which one run gives you, and
   turns it into the sample the claim needs:

       se = sd / sqrt(n)                 the error on the figure at the sample it was read off
       need = 4 * sd^2 / mean^2          the houses at which a difference this size clears two of them
       mde = 2 * se                      the smallest difference the run you DID could have seen

   If `need` is larger than the run you did, the figure is not yet a figure. And when auditing a
   number somebody has already published, the mde is the honest one to quote: the observed
   difference cannot justify the sample that produced it, because a small run only reports the
   differences that happened to come out large. Anything at or below the mde is noise; anything
   above it is inflated. That is the whole tool.

   It also prints the SIGN TEST, and that is the one to believe: lives are censored at the run length
   and fame has a long tail, so the t-statistic is the optimistic reading of a distribution that is
   not normal. Where the two disagree, the sign test is what survives contact with another seed.

   THE ARM IS GIVEN ON THE COMMAND LINE, as a JSON object of rope options, so any published figure
   that came off a rope arm can be re-checked without writing a probe for it:

       node test/probes/sample.mjs 72 420 SEED '{"favours":"wise"}'
       node test/probes/sample.mjs 24 420 SEED '{"works":true}'
       node test/probes/sample.mjs 24 420 SEED '{"road":false}'

   CALIBRATION, and it is the reason to trust it: run against `{"favours":"wise"}` at the 72 houses
   #167 published off, it says the weekly-fame claim needs far more than 72 — which is what raising
   the sample to 240 then found, and what the ablation had already hinted at. An instrument that
   agrees with a known correction is one you can point at the figures nobody has checked.
*/
import { serve, open, needN, sayNeed } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420), SEED = process.argv[4] || "SMP";
let ARM = {};
try { ARM = JSON.parse(process.argv[5] || "{}"); }
catch(e){ console.log(`the arm must be JSON rope options, e.g. '{"favours":"wise"}' — ${e.message}`); process.exit(1); }

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED,ARM])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const PRES = [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`];

  /* one arm, one row a house, keyed by seed so the two arms can be paired */
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
          const d = A.newGameState("Sm"+h, "clean", id, null);
          cur = { bouts:0, deaths:0 };
          let w = 0, fame = 0, favor = 0, rung = 0, men = 0;
          for(; w<W; w++){
            if(d.over) break;
            R.lanista(d, opts);
            if(!d.lanista) break;
            fame += d.fame||0; favor += d.favor||0;
            rung += (A.riseOf ? A.riseOf(d)||0 : 0); men += A.activeG(d).length;
          }
          rows[id] = { life:w, alive: w >= W ? 1 : 0,
            fame: w ? fame/w : 0, favor: w ? favor/w : 0, rung: w ? rung/w : 0, men: w ? men/w : 0,
            bouts: cur.bouts, deaths: cur.deaths,
            deathRate: cur.bouts ? cur.deaths/cur.bouts*100 : null };
          cur = null;
        }
      }
    } finally { A.doFight = orig; cur = null; }
    return rows;
  };

  const control = arm(undefined);                 /* control FIRST */
  const test = arm(ARM);
  return { control, test, H, W, PRES };
}, [H, W, SEED, ARM]);

const KEYS = ["life","alive","fame","favor","rung","men","deathRate","bouts"];
const ids = Object.keys(out.control).filter(k => out.test[k]);
const diffs = {};
for(const k of KEYS) diffs[k] = ids
  .map(id => { const a = out.test[id][k], b = out.control[id][k];
    return (a == null || b == null) ? null : a - b; })
  .filter(x => x != null);

const mean = (rows, k) => { const v = ids.map(id=>rows[id][k]).filter(x=>x!=null);
  return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; };

console.log(`\nHOW MANY HOUSES THIS FIGURE NEEDS   —   ${JSON.stringify(ARM)}`);
console.log(`${ids.length} houses of ${out.W} weeks an arm, ${out.PRES.length} seed prefixes, control first, paired house for house\n`);
console.log(`  metric            control        arm`);
for(const k of KEYS){
  const c = mean(out.control, k), t = mean(out.test, k);
  if(c == null || t == null) continue;
  console.log(`  ${k.padEnd(16)} ${c.toFixed(1).padStart(9)}  ${t.toFixed(1).padStart(9)}`);
}
console.log(`\n  metric           difference     spread    error    t    sign test        needs / could see`);
const verdicts = [];
for(const k of KEYS){
  const r = needN(diffs[k]);
  console.log(`  ${sayNeed(k, r)}`);
  verdicts.push({ k, r });
}
const short = verdicts.filter(v => v.r.mean != null && v.r.need > v.r.n);
const okd = verdicts.filter(v => v.r.mean != null && v.r.need <= v.r.n);
console.log(`\n  ${okd.length ? okd.map(v=>v.k).join(", ") + " are supported at this sample." : "NOTHING here is supported at this sample."}`);
if(short.length) console.log(`  ${short.map(v=>`${v.k} wants ${v.r.need === Infinity ? "∞" : v.r.need}`).join(" · ")} — quote those and you are quoting the seed.`);
console.log();

await browser.close();
server.close();
