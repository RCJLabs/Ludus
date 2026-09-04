/* WHAT DOES THE CHAIR ACTUALLY PAY, AND DOES IT PAY MORE THAN IT COSTS? — #234's risk section

   The item's risk is not that standing is hard. It is that standing is *free money*:

     "If standing yourself only adds 'you get to be the friendly aedile' without the seat costing
      more than that per term — continuous public spend, a guaranteed contested re-election, a
      rival's grudge that compounds — it becomes a strictly dominant version of backCandidate's top
      tier ... and gets bypassed by a house rich enough to just buy the chair outright."

   `test/probes/office.mjs` answered the vote: with the rival houses answering a lanista's
   candidacy and a man's own money buying 0.45 of the odds column, the top tier tops out at 92%
   instead of 100%. It did NOT answer this, because it only scored the ballot. The chair itself is
   seven read-sites of gain (1.14x home purse, +1 offer slot, +9 missio, +0.16 debt-pay odds, +0.05
   discount, +0.14 bribe odds, +0.12 petition odds) against one line of cost, `AEDILE_GAMES` riding
   the city's call, and no amount of reading the source says which of those is bigger.

   So this plays it. Same seeds, same rope, three populations:

     NEVER  — the house never puts its name on a wall. The game as it shipped.
     STAND  — the house stands at every election it is entitled to, spending nothing.
     BUY    — the house stands and spends backLevels' top tier on its own name every time.

   and reports what each one has at the end: gold, fame, rung, men buried, and how many terms it
   actually held. If BUY ends richer AND more famous than NEVER by a wide margin, the risk is real
   and `AEDILE_GAMES` is too small. If BUY ends poorer, the office is a trap and it is too big.

   Run: node test/probes/chair.mjs */
import { serve, open } from "../harness.mjs";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(()=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const H = 16, WEEKS = 240;
  const arms = { never:[], stand:[], buy:[] };

  for(const arm of ["never","stand","buy"]){
    for(let h = 0; h < H; h++){
      const seed = `CHAIR-${h}`;
      const d = A.newGameState(seed, "capua", seed);
      let terms = 0, stood = 0, held = 0, litPaid = 0, lastAed = null;
      for(let w = 0; w < WEEKS && !d.over; w++){
        if(arm !== "never" && A.standReady(d)){
          if(A.standForOffice(d)){
            stood++;
            if(arm === "buy"){
              const me = d.election.cands.find(c=>c.mine);
              if(me && d.gold >= 1300) A.backCandidate(d, me.id, 3);
            }
          }
        }
        if(d.aedile && d.aedile.mine && d.week < d.aedile.until){
          held++;
          if(d.aedile.since !== lastAed){ terms++; lastAed = d.aedile.since; }
          litPaid += A.AEDILE_GAMES;
        }
        try { R.lanista(d, {}); } catch(e){ break; }
        if(d.over) break;
      }
      arms[arm].push({ h, week:d.week, gold:Math.round(d.gold), fame:Math.round(d.fame),
        rise:A.riseOf(d), dead:(d.book&&d.book.dead)||0, purse:(d.book&&d.book.purse)||0,
        bouts:(d.book&&d.book.n)||0, stood, terms, held, litPaid, over: d.over ? 1 : 0 });
    }
  }
  return arms;
});

const med = a => { const s = [...a].sort((x,y)=>x-y); return s.length ? s[Math.floor(s.length/2)] : 0; };
const mean = a => a.length ? Math.round(a.reduce((s,x)=>s+x,0)/a.length) : 0;

console.log(`\n=== THE CHAIR, PLAYED THREE WAYS (16 seeds x 240 weeks, same seeds in each arm) ===\n`);
const rows = [];
for(const k of ["never","stand","buy"]){
  const a = out[k];
  rows.push({ k, n:a.length,
    gold: med(a.map(x=>x.gold)), fame: med(a.map(x=>x.fame)), rise: med(a.map(x=>x.rise)),
    dead: med(a.map(x=>x.dead)), purse: med(a.map(x=>x.purse)), bouts: med(a.map(x=>x.bouts)),
    week: med(a.map(x=>x.week)), over: a.filter(x=>x.over).length,
    stood: mean(a.map(x=>x.stood)), terms: mean(a.map(x=>x.terms)),
    held: mean(a.map(x=>x.held)), paid: mean(a.map(x=>x.litPaid)) });
}
const pad = (s,n) => String(s).padStart(n);
console.log(`  arm     median gold   fame   rung   buried   purses   bouts   ended  | stood terms weeks-held  games-paid`);
for(const r of rows)
  console.log(`  ${r.k.padEnd(6)} ${pad(r.gold,11)} ${pad(r.fame,6)} ${pad(r.rise,6)} ${pad(r.dead,8)} ${pad(r.purse,8)} ${pad(r.bouts,7)} ${pad(r.over+"/"+r.n,7)}  | ${pad(r.stood,5)} ${pad(r.terms,5)} ${pad(r.held,10)} ${pad(r.paid,11)}`);

console.log(`\n  win rate at the ballot: stand ${(100*rows[1].terms/Math.max(1,rows[1].stood)).toFixed(0)}% of candidacies · buy ${(100*rows[2].terms/Math.max(1,rows[2].stood)).toFixed(0)}%`);
const dg = rows[2].gold - rows[0].gold, df = rows[2].fame - rows[0].fame;
console.log(`  buying the chair vs never standing: gold ${dg>=0?"+":""}${dg}d · fame ${df>=0?"+":""}${df}`);
console.log(`    (a BUY house also spent 1300d x ${rows[2].stood.toFixed(1)} candidacies = ${Math.round(1300*rows[2].stood)}d on the ballot, and ${rows[2].paid}d on the games)`);

console.log(`\n  per-seed gold, so a median cannot hide a bimodal result:`);
for(let i = 0; i < out.never.length; i++)
  console.log(`    seed ${pad(i,2)}: never ${pad(out.never[i].gold,7)}d  stand ${pad(out.stand[i].gold,7)}d (${out.stand[i].terms}t)  buy ${pad(out.buy[i].gold,7)}d (${out.buy[i].terms}t)`);
console.log("");

await browser.close(); server.close();
