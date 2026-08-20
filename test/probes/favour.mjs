/* #167 — THE FOUR FAVOURS, READY ON EVERY PATRON-WEEK AND NEVER ONCE CALLED

   `audit.mjs` found all four ranks held and READY on 6,555 to 6,823 patron-weeks of 18 houses over
   420 weeks, every one paying when called, and the reference player calling none of them, ever. Not
   unreachable content — a lever nobody pulls, which is #158's shape. The item was opened with its
   own falsification: *falsifies if an arm that calls every favour the moment it is ready is not
   measurably better off, in which case the four are priced right and the silence costs nothing.*

   WHAT THE FOUR ARE, and why "call everything" is a policy rather than a free lunch:

     magistrate  cost 30, wait 22   the angriest rival's grudge −55, and a poach and a soft nemesis
                                    dropped with it. Gated on a rival at grudge ≥25 and warmth <45.
     merchant    cost 28, wait 26   ten weeks of upkeep carried, and `weeklyBill` really does read
                                    `d.flags.underwritten` and zero the upkeep line. Never gated.
     noble       cost 26, wait 20   18–30% off the biggest rival's name, +18 grudge from them, and
                                    6 of `show` to your own. Gated on a rival above fame 20.
     senator     cost 34, wait 30   +45–80 fame and `romeEarly`, which takes 150 off `romeBar`.

   The cost is that patron's own favour, and `recomputeFavor` is a weighted mean, so every call takes
   the HOUSE's standing down with it — and `d.favor` is what the census rung asks for, what the
   editor's box weighs, and what the missio reads. That is the trade the reference player has been
   making by default without anybody measuring it: favour banked against favour spent.

   THE ARMS, control FIRST, the same seeds in every one:
     control · all four · and each rank alone, so a policy that pays can be told from a rank that does

   AND HOW BIG THE SAMPLE HAS TO BE, which is the lesson of #171. The first pass ran 72 houses an arm
   on two seed families and published +188 and +537 of weekly fame for the considered policy. Ablated
   at that sample, DROPPING one of its four triggers read better than the whole policy — twice, and by
   more than the policy was worth. That is a sample too small for the variance of a 420-week run, not
   a finding about triggers. At 240 houses an arm the same policy reads +134.4 at 124u/109d, a sign
   count nobody should quote, and its life is a wash; what survives is the ending mix, and that is the
   merchant alone. Nothing below 240 houses an arm should be quoted from this probe.

   INSTRUMENT NOTES:
   · the calls made are PRINTED per arm. `preferStakes` and `entrance` both shipped inert in this
     rope, and both times the tell was zero divergence; an arm reporting nought calls is not a
     finding about favours, it is a finding about the lever.
   · three seed prefixes on everything (#136), and the per-prefix medians printed, because a median
     of twelve houses is one number.
   · deaths are counted off `doFight` through the handle rather than off the roster, because a dead
     man is replaced and an end-of-run head count says nothing about how many went.

   Usage: node test/probes/favour.mjs [houses per prefix] [weeks] [seed]
*/
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420), SEED = process.argv[4] || "FAV";
/* a comma list narrows the arms, so the sample can be spent where the question is. #171 found the
   twelve-arm run at 72 houses could not separate effects of this size from the variance. */
const ONLY = (process.argv[5] || "").split(",").filter(Boolean);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED,ONLY])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const RANKS = ["magistrate","merchant","noble","senator"];
  const PRES = [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`];

  /* one arm: the same seeds every time, one row a house so the comparison can be PAIRED.
     Medians of an arm are chaos at this sample; a per-house difference against the control on the
     same seed is not, and the sign of it over 72 houses is the reading. */
  const arm = (label, opts) => {
    const calls = {}, ends = {}, rows = [];
    let bouts = 0, deaths = 0, ready = 0, patronWeeks = 0, underW = 0, romeRuns = 0;
    const orig = A.doFight;
    A.doFight = function(d, gid, offer, tactic, bet, pending){
      const fresh = !pending;
      const r = orig.apply(this, arguments);
      if(fresh) bouts++;
      if(r && !r.__err && !r.crux && r.dead) deaths++;
      return r;
    };
    try {
      for(const pre of PRES){
        for(let h=0; h<H; h++){
          const d = A.newGameState("Fv"+h, "clean", `${pre}-${h}`, null);
          let w = 0, favSum = 0, fameSum = 0, rungSum = 0;
          for(; w<W; w++){
            if(d.over) break;
            const did = R.lanista(d, opts);
            if(!d.lanista) break;
            for(const k of Object.keys(did||{})) if(k.indexOf("favour:") === 0)
              calls[k.slice(7)] = (calls[k.slice(7)]||0) + did[k];
            for(const pt of A.patronsOf(d)){
              patronWeeks++;
              let ok = false; try { ok = !!A.favourReady(d, pt); } catch(e){}
              if(ok) ready++;
            }
            if((d.flags && d.flags.underwritten) > 0) underW++;
            /* WEEKLY, not at the end: an end-of-run reading is a reading of the ending */
            favSum += d.favor||0; fameSum += d.fame||0; rungSum += (A.riseOf ? A.riseOf(d)||0 : 0);
          }
          romeRuns += (A.romeRuns ? A.romeRuns(d) : 0);
          ends[d.over ? d.over.kind : "alive"] = (ends[d.over ? d.over.kind : "alive"]||0) + 1;
          rows.push({ id:`${pre}-${h}`, life:w,
            favor: w ? favSum/w : 0, fame: w ? fameSum/w : 0, rung: w ? rungSum/w : 0,
            endFame: Math.round(d.fame||0), gold: Math.round(d.gold||0), men: A.activeG(d).length,
            rome: A.romeRuns ? A.romeRuns(d) : 0 });
        }
      }
    } finally { A.doFight = orig; }
    const med = k => { const s = rows.map(r=>r[k]).sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
    const mean = k => rows.reduce((a,r)=>a+r[k],0)/rows.length;
    return { label, calls, ends, bouts, deaths, ready, patronWeeks, underW, romeRuns, rows,
      n: rows.length, life: med("life"), lifeMean: mean("life"),
      favor: mean("favor"), fame: mean("fame"), rung: mean("rung"),
      endFame: med("endFame"), gold: med("gold"), men: mean("men"),
      rate: bouts ? deaths/bouts : null, alive: rows.filter(r=>r.life >= W).length };
  };

  const ALL = [["control", undefined], ["all four", { favours:true }],
    ["wise", { favours:"wise" }], ["thrift", { favours:"thrift" }]];
  for(const rk of RANKS) ALL.push(["wise -"+rk.slice(0,3), { favours:"wise", favourSkip:rk }]);
  for(const rk of RANKS) ALL.push([rk, { favours:rk }]);
  const rows = [];
  for(const [label, opts] of ALL){                           /* control FIRST, always */
    if(ONLY.length && label !== "control" && ONLY.indexOf(label) < 0) continue;
    rows.push(arm(label, opts));
  }
  return { rows, RANKS, H, W, PRES };
}, [H, W, SEED, ONLY]);

const f = (v, n=1) => v == null ? "  —" : v.toFixed(n);
console.log(`\n#167 — THE FOUR FAVOURS, CALLED AND NOT CALLED   (${out.H} houses x ${out.PRES.length} prefixes x ${out.W}w an arm)\n`);

console.log(`  arm          calls made                              ready / patron-weeks    bouts  died a bout`);
for(const r of out.rows){
  const cs = out.RANKS.map(k=>`${k.slice(0,3)} ${r.calls[k]||0}`).join(" · ");
  console.log(`  ${r.label.padEnd(11)} ${cs.padEnd(38)} ${String(r.ready).padStart(6)} / ${String(r.patronWeeks).padEnd(6)} `
    + `${String(r.bouts).padStart(6)}  ${f(r.rate*100, 2)}%`);
}

console.log(`\n  EVERY FIGURE BELOW IS A WEEKLY MEAN OVER THE WEEKS THE HOUSE LIVED, not a reading at the end`);
console.log(`  arm          median life  mean life   mean favour   mean fame   mean rung   mean men   alive at ${out.W}w`);
for(const r of out.rows)
  console.log(`  ${r.label.padEnd(11)} ${String(r.life).padStart(8)}w ${f(r.lifeMean).padStart(10)}w `
    + `${f(r.favor).padStart(13)} ${f(r.fame,0).padStart(11)} ${f(r.rung,2).padStart(11)} `
    + `${f(r.men,1).padStart(10)} ${String(r.alive).padStart(11)} of ${r.n}`);

/* ---- THE PAIRED READING: the same seed, control against arm, one row a house ---- */
const ctl = out.rows[0];
const byId = {}; for(const r of ctl.rows) byId[r.id] = r;
console.log(`\n  PAIRED AGAINST THE CONTROL ON THE SAME SEED — houses better / worse, and the mean difference`);
console.log(`  arm          life                  favour                fame                  rung`);
for(const r of out.rows.slice(1)){
  const cell = k => {
    let up = 0, dn = 0, sum = 0, n = 0;
    for(const row of r.rows){ const c = byId[row.id]; if(!c) continue;
      n++; sum += row[k] - c[k]; if(row[k] > c[k]) up++; else if(row[k] < c[k]) dn++; }
    const d = n ? sum/n : 0;
    return `${String(up).padStart(2)}u/${String(dn).padStart(2)}d ${(d>=0?"+":"")}${d.toFixed(1)}`;
  };
  console.log(`  ${r.label.padEnd(11)} ${cell("life").padEnd(21)} ${cell("favor").padEnd(21)} ${cell("fame").padEnd(21)} ${cell("rung")}`);
}

console.log(`\n  arm          weeks the merchant was carrying it   imperial runs   how the runs ended`);
for(const r of out.rows)
  console.log(`  ${r.label.padEnd(11)} ${String(r.underW).padStart(29)}   ${String(r.romeRuns).padStart(13)}   `
    + Object.entries(r.ends).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · "));
console.log();

await browser.close();
server.close();
