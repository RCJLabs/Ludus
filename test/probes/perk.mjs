/* WHAT A WORK IS WORTH WHEN IT COSTS NOTHING — #140's falsification, taken at its upper bound

   #138 measured that a works-BUYING reference player ends poorer and shorter-lived on every seed, and
   opened #140: the sink's bottom shelf is a measured bad trade. The clause named to falsify it was
   "a fame-maximising arm shows stone paying on the score a player actually chases" — the idea being
   that the survival rope does not chase what stone sells.

   THIS ANSWERS THAT WITHOUT A POLICY ARM, AND MORE DECISIVELY. Grant the work FREE — no deposit, no
   mason's draw, standing from week one — and every purchasing policy that could ever exist is bounded
   above by what this measures. If a free work does not move the quantity its own table names, no
   policy can make the purchase pay, and the fault is the PERK rather than the price. If a free work
   moves it plainly, the perk is real and the price is what is wrong. That is the decision #140 asks,
   and it is the difference between repricing the stone and repricing what the stone buys.

   THE ARMS, one control and five treatments per seed, control FIRST so it cannot inherit RNG state
   (the #133/`styles` lesson), compared at the last week BOTH were still playing:

     spina   crowd  +4 per bout      chapel  calm    1.1 unrest/wk      tomb  regard +0.4/wk
     baths   rest   +6 fatigue/wk    school  fame    +3/wk              (and the tomb's SECOND effect,
                                                                        which its `n` does not carry:
                                                                        workPerk("regard") multiplies
                                                                        the lanista's health loss per
                                                                        death by 0.7 at four call sites)

   Each arm's own target quantity is tracked as a weekly mean over the run, so a perk that works but is
   swamped reads differently from a perk that never lands — the walk.mjs habit of counting the door
   before counting what came through it.

   Granting at week one is DELIBERATELY generous: a real house gets its first work late if at all
   (#138: 1-5 per surviving house, first around week 200). Every figure here is therefore an upper
   bound on the purchase, which is exactly what a falsification wants. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "PERK";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const KEYS = A.WORK_KEYS;

  const runOne = (seed, give) => {
    const d = A.newGameState("Pk", "clean", seed, null);
    if(give){
      /* free and finished: workDone reads `left <= 0`, and owed 0 keeps worksWeek's mason off the purse */
      d.works = Object.assign({}, d.works||{}, { [give]: { left:0, began:0, paid:0, owed:0, idle:0 } });
    }
    const hist = [];
    let unrestSum = 0, fatSum = 0, fatN = 0, regSum = 0, regN = 0, healthSum = 0, wk = 0;
    for(let w=0; w<W; w++){
      if(d.over) break;
      R.lanista(d);
      if(d.over) break;
      wk++;
      unrestSum += d.unrest || 0;
      healthSum += (d.lanista && d.lanista.health) || 0;
      for(const g of A.activeG(d)){ fatSum += g.fatigue||0; fatN++; regSum += A.regardOf(g)||0; regN++; }
      hist.push({ gold: Math.round(d.gold), fame: Math.round(d.fame), acc: Math.round(d.acclaim||0) });
    }
    return { life: d.week, hist,
      unrest: wk ? unrestSum/wk : 0, health: wk ? healthSum/wk : 0,
      fat: fatN ? fatSum/fatN : 0, reg: regN ? regSum/regN : 0,
      built: A.WORK_KEYS.filter(k=>A.workDone(d,k)).length };
  };

  const rows = [];
  for(let h=0; h<H; h++){
    const ctl = runOne(`${SEED}-${h}`, null);          /* control FIRST */
    const arms = {};
    for(const k of KEYS) arms[k] = runOne(`${SEED}-${h}`, k);
    rows.push({ h, ctl, arms });
  }
  return { rows, KEYS,
    table: Object.fromEntries(KEYS.map(k=>[k, { cost:A.WORKS[k].cost, perk:A.WORKS[k].perk, n:A.WORKS[k].n }])) };
}, [H, W, SEED]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : 0; };
const f1 = x => (Math.round(x*10)/10).toFixed(1);

console.log(`\n${H} seeds x ${W}w · seed "${SEED}" · each work GRANTED FREE at week one, against one shared control`);
console.log(`free is the upper bound of every purchasing policy — if it does not pay here it cannot pay bought\n`);

console.log(`  work     perk         price   fame better   life longer   its OWN quantity (arm vs control)`);
for(const k of out.KEYS){
  const T = out.table[k];
  let fameUp = 0, lifeUp = 0, n = 0;
  const dq = [];
  for(const r of out.rows){
    const a = r.arms[k], c = r.ctl;
    const t = Math.min(a.hist.length, c.hist.length) - 1;
    if(t < 0) continue;
    n++;
    if(a.hist[t].fame > c.hist[t].fame) fameUp++;
    if(a.life > c.life) lifeUp++;
    const q = T.perk === "calm" ? [c.unrest, a.unrest]
            : T.perk === "rest" ? [c.fat, a.fat]
            : T.perk === "regard" ? [c.reg, a.reg]
            : T.perk === "fame" ? [c.hist[t].fame, a.hist[t].fame]
            : [c.hist[t].gold, a.hist[t].gold];      /* crowd shows up as purse */
    dq.push(q);
  }
  const cq = med(dq.map(x=>x[0])), aq = med(dq.map(x=>x[1]));
  const want = T.perk === "calm" || T.perk === "rest" ? "lower" : "higher";
  const moved = want === "lower" ? cq - aq : aq - cq;
  console.log(`  ${k.padEnd(8)} ${(T.perk+" "+T.n).padEnd(12)} ${String(T.cost).padStart(6)}   ${String(fameUp).padStart(5)}/${n}      ${String(lifeUp).padStart(5)}/${n}      `
    + `median ${f1(cq)} -> ${f1(aq)} (${moved >= 0 ? "better" : "WORSE"} by ${f1(Math.abs(moved))}, want ${want})`);
}

console.log(`\n  THE TOMB'S SECOND EFFECT, which its table entry does not carry — the lanista's own life:`);
{
  const c = [], a = [];
  for(const r of out.rows){ c.push(r.ctl.health); a.push(r.arms.tomb.health); }
  const lc = out.rows.map(r=>r.ctl.life), la = out.rows.map(r=>r.arms.tomb.life);
  console.log(`  mean lanista health over the run: control ${f1(med(c))} · with the tomb ${f1(med(a))}`);
  console.log(`  lifespan: control median ${med(lc)} · with the tomb ${med(la)}`);
}

console.log(`\n  RAW, so the counter can be read rather than trusted — fame at the last common week, per seed:`);
console.log(`  seed   control` + out.KEYS.map(k=>k.slice(0,6).padStart(8)).join(""));
for(const r of out.rows.slice(0, 12)){
  const line = out.KEYS.map(k=>{
    const t = Math.min(r.arms[k].hist.length, r.ctl.hist.length) - 1;
    return String(t<0 ? "-" : r.arms[k].hist[t].fame).padStart(8);
  }).join("");
  const t0 = Math.min(...out.KEYS.map(k=>r.arms[k].hist.length), r.ctl.hist.length) - 1;
  console.log(`  ${String(r.h).padStart(4)}  ${String(t0<0?"-":r.ctl.hist[t0].fame).padStart(8)}${line}`);
}

await browser.close(); server.close();
