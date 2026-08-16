/* THE SINK, FINALLY DRAINED — does a works-buying reference player finish the tier? — #138

   The works and monuments are the game's own late-game sink, repriced to instalments so "a house
   that nets a few thousand a year can put up a monument over three years instead of never" — and no
   reference player had ever commissioned one, because the rope had no step for it. #138's
   falsification clause: if a works-BUYING rope still cannot finish the works tier on cumulative
   income, the shelf is genuinely priced past play, the out-of-things-to-buy headline survives, and
   #131's answer goes back to losses.

   A CONTROLLED PAIR, the shape every clean item this project has produced used (#133's lesson):
   the same seed twice, identical but for `works`, control first so it cannot inherit RNG state.
   Compared at the last week BOTH were still playing, because a dead house's gold answers a
   different question.

   It also counts the agenda's own door against the game's: the "coin sitting in the box" line at
   ludus.jsx:2990 still filters on d.gold >= the FULL price, though commissioning has needed only
   the 25% deposit since the instalment repricing. The gap between deposit-affordable weeks and
   full-price-affordable weeks is how often the game's one works hint under-fires. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "SINK";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const runOne = (seed, works) => {
    const d = A.newGameState("Sk", "clean", seed, null);
    const hist = [];                                   /* per-week gold/fame so pairs compare at the last common week */
    let commissioned = 0, idleWeeks = 0, nagOpen = 0, doorOpen = 0, sample = 0;
    for(let w=0; w<W; w++){
      if(d.over) break;
      R.lanista(d, works ? { works:true } : undefined);
      if(d.over) break;
      hist.push({ gold: Math.round(d.gold), fame: Math.round(d.fame) });
      for(const k of A.ALL_WORK_KEYS){ const on = A.workOn(d,k); if(on && on.owed>0 && on.idle>0) { idleWeeks++; break; } }
      /* the two doors, counted on weeks with no site up — the agenda's own precondition */
      if(!A.ALL_WORK_KEYS.some(k=>A.workOn(d,k))){
        const openK = A.ALL_WORK_KEYS.filter(k=>!A.workDone(d,k) && A.workOpen(d,k));
        if(openK.length){ sample++;
          if(openK.some(k=>d.gold >= Math.ceil(A.workDef(k).cost*A.WORK_DEPOSIT))) doorOpen++;
          if(openK.some(k=>d.gold >= A.workDef(k).cost)) nagOpen++;
        }
      }
    }
    const finished = A.ALL_WORK_KEYS.filter(k=>A.workDone(d,k));
    const rising = A.ALL_WORK_KEYS.filter(k=>A.workOn(d,k));
    return { life: d.week, hist, finished, rising, idleWeeks, nagOpen, doorOpen, sample,
      monuReady: A.WORK_KEYS.every(k=>A.workDone(d,k)) };
  };

  const pairs = [];
  for(let h=0; h<H; h++){
    const off = runOne(`${SEED}-${h}`, false);         /* control FIRST — it may not inherit RNG state */
    const on  = runOne(`${SEED}-${h}`, true);
    pairs.push({ h, off, on });
  }
  return pairs;
}, [H, W, SEED]);

const med = a => { const v=[...a].sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };
console.log(`\n${H} pairs x ${W}w · seed "${SEED}" · same seed twice, works off (control, run first) vs on\n`);
console.log(`  pair  life off/on   @last common wk: gold off/on    fame off/on   finished (on)          rising`);
let richer = 0, famer = 0, longer = 0, n = 0;
for(const p2 of out){
  const t = Math.min(p2.off.hist.length, p2.on.hist.length) - 1;
  if(t < 0) continue;
  n++;
  const a = p2.off.hist[t], b = p2.on.hist[t];
  if(b.gold > a.gold) richer++;
  if(b.fame > a.fame) famer++;
  if(p2.on.life > p2.off.life) longer++;
  console.log(`  ${String(p2.h).padStart(4)}  ${String(p2.off.life).padStart(4)}/${String(p2.on.life).padEnd(4)}  ${String(a.gold).padStart(8)} /${String(b.gold).padEnd(8)}  ${String(a.fame).padStart(6)} /${String(b.fame).padEnd(6)}  ${(p2.on.finished.join(",")||"-").padEnd(22)} ${p2.on.rising.join(",")||"-"}`);
}
console.log(`\n  the works-buying house was RICHER at the last common week in ${richer} of ${n}, more famous in ${famer}, lived longer in ${longer}`);
const lives = out.map(p2=>p2.on.life);
const late = out.filter(p2=>p2.on.life>=300);
console.log(`  houses (works on) past 300w: ${late.length} · works finished by them: ${late.map(p2=>p2.on.finished.length).sort((a,b)=>a-b).join(" ")||"-"}`);
console.log(`  finished ALL FIVE works (the monument door): ${out.filter(p2=>p2.on.monuReady).length} of ${out.length}`);
const byWork = {};
for(const p2 of out) for(const k of p2.on.finished) byWork[k] = (byWork[k]||0)+1;
console.log(`  what actually got built: ${Object.entries(byWork).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")||"nothing"}`);
console.log(`  masons idle (a site up, unpaid): ${out.reduce((s,p2)=>s+p2.on.idleWeeks,0)} weeks across all works-on houses`);
const dSum = out.reduce((s,p2)=>s+p2.off.doorOpen,0), nSum = out.reduce((s,p2)=>s+p2.off.nagOpen,0), sSum = out.reduce((s,p2)=>s+p2.off.sample,0);
console.log(`\n  THE NAG'S STALE GATE, read off the CONTROL arm (no step interfering):`);
console.log(`  weeks a work could be COMMISSIONED (deposit in the box):  ${dSum} of ${sSum} (${sSum?Math.round(dSum/sSum*100):0}%)`);
console.log(`  weeks the agenda line would fire (FULL price in the box): ${nSum} of ${sSum} (${sSum?Math.round(nSum/sSum*100):0}%)`);

await browser.close(); server.close();
