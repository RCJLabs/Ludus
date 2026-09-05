/* #209 — IS THE ENTRANCE EVER DECIDABLY DECISIVE, AND IS THE PLAYER EVER TOLD?

   #166 already priced the four entrances and put every non-cosmetic term on the panel BEFORE the
   bout (`ENT_TERM`, `entranceSays`). The audit's residue is the other end: nothing after the bout
   ever says what the entrance did. This asks whether that is worth saying — how often each
   entrance's effect is LOAD-BEARING, not merely present.

     node test/probes/salute.mjs 10 160

   THE ONE THAT CAN BE PRICED EXACTLY is `boxes`. Its whole promise is a moment — "when he is on
   the ground looking up, they remember it" — so the question is a counterfactual on a real bout:
   he went down, the editor was asked, and would the answer have been different without the day
   allowance? Both odds come from `missioOdds(missioScore(...))`, the game's own pair, run twice on
   the same score with `ctx.day` set and cleared. That is #150's rule used as an instrument: the
   number a settlement would show is the number the roll used.

   `grim` and `showman` cannot be attributed this cleanly — dread moves the other man's vigour and
   momentum moves an exchange, and by the time the bout resolves there is no counterfactual to run
   that is not a second simulation of a different fight. They are measured here only as outcome
   rates against `none`, which is what #166 already did; this probe exists for the salute.

   ---- AND THE CAREER ARMS BELOW ARE WEAK EVIDENCE ON PURPOSE, which is the instrument note ----
   The first cut seeded per-arm and reported `showman` at 26.1% win against `none`'s 41.3% — a
   catastrophe, and flatly against #166's paired finding that showman is the one that PAYS. It was
   four different sets of houses. Sharing seeds put it at 33.4% against 36.2% and its death rate
   BELOW none's. Even shared-seed arms diverge the moment a bout resolves differently, and they
   fight different numbers of bouts (2,222 / 1,979 / 1,610 / 1,843 at 14x200), so the populations
   are not comparable either. Read them for the ONE thing they replicate independently — the salute
   lowers death-of-downs, 17.1% to 14.1% here against #166's 19.31% to 12.85% — and read #166's
   mirrored-card measurement for win rate. The counterfactual below is the only properly controlled
   arm in this file: same men, same accounts, one term moved. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 10), W = +(process.argv[3] || 160);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["missioScore","missioOdds","ENT_MISSIO","ENTRANCE_KEYS"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const arms = {};
  for(const ent of ["none","boxes","showman","grim"]){
    const a = { bouts:0, won:0, wentDown:0, spared:0, died:0 };
    for(let h=0; h<H; h++){
      /* THE SAME SEED IN EVERY ARM. The first cut seeded per-arm (`SAL-${ent}-${h}`) and so
         compared four different sets of houses — 480 / 428 / 395 / 431 bouts, and any win-rate
         gap between them was mostly which men each arm happened to be dealt. Shared seeds start
         the four houses identical; they diverge only from the word. (Not mirrored: the RNG stream
         parts as soon as a bout resolves differently, which is why #166's paired-card measurement
         remains the authority on win rate and this arm is read only for the death rate.) */
      const d = A.newGameState("Salute", "clean", `SAL-${h}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        try { R.lanista(d, { entrance: ent, singlesOnly: true }); } catch(e){ break; }
      }
      /* the run's own record is the arm: every bout the house fought under this entrance */
      for(const g of d.gladiators){ a.bouts += (g.wins||0)+(g.losses||0); a.won += (g.wins||0); }
      a.died += d.gladiators.filter(g=>g.status==="dead").length;
      a.wentDown += d.gladiators.reduce((n,g)=>n+(g.losses||0), 0);
    }
    a.winPc   = a.bouts ? +(a.won/a.bouts*100).toFixed(1) : null;
    a.deathPc = a.wentDown ? +(a.died/a.wentDown*100).toFixed(1) : null;
    arms[ent] = a;
  }

  /* ---- THE COUNTERFACTUAL, on the game's own pair of functions ----
     A spread of real fallen men against a spread of real accounts, asked twice. */
  const cf = { asked:0, flipped:0, spared:0, deltaSum:0, byFame:{} };
  const d0 = A.newGameState("Salute", "clean", "SAL-CF");
  for(let w=0; w<80; w++){ if(d0.over) break; try { R.lanista(d0); } catch(e){ break; } }
  const pool = d0.gladiators.filter(g=>g.status!=="dead");
  if(!pool.length) return { arms, cfNone:"the counterfactual house held no living man" };
  for(const g of pool){
    for(const fame of [0, 40, 150, 600]){
      const man = Object.assign({}, g, { pfame: fame });
      for(const crowd of [30, 55, 80]){
        for(const acct of [30, 55, 80]){
          const base = { favor: 30, fav: 0, man: 0, day: 0 };
          const sc0 = A.missioScore(man, base, crowd, acct, 10, true);
          const sc1 = A.missioScore(man, Object.assign({}, base, { day: A.ENT_MISSIO }), crowd, acct, 10, true);
          const o0 = A.missioOdds(sc0), o1 = A.missioOdds(sc1);
          cf.asked++; cf.deltaSum += (o1 - o0);
          /* "flipped" at the coin: the salute carries him across the even line */
          if(o0 < 0.5 && o1 >= 0.5) cf.flipped++;
          const fb = fame<25?"0-24":fame<100?"25-99":fame<300?"100-299":"300+";
          const b = cf.byFame[fb] = cf.byFame[fb] || { n:0, d:0, flip:0 };
          b.n++; b.d += (o1-o0); if(o0<0.5 && o1>=0.5) b.flip++;
        }
      }
    }
  }
  cf.meanDeltaPts = +(cf.deltaSum/cf.asked*100).toFixed(2);
  cf.flipPc = +(cf.flipped/cf.asked*100).toFixed(1);
  for(const k of Object.keys(cf.byFame)){ const b = cf.byFame[k];
    b.meanPts = +(b.d/b.n*100).toFixed(2); b.flipPc = +(b.flip/b.n*100).toFixed(1); delete b.d; }
  return { arms, cf, entMissio: A.ENT_MISSIO, pool: pool.length };
}, [H,W]);

if(out.miss){ console.log("handle missing:", out.miss.join(", ")); }
else {
  console.log(`ENT_MISSIO = ${out.entMissio}\n`);
  console.log("  arm       bouts   win%   went down   died   death% of downs");
  for(const [k,a] of Object.entries(out.arms))
    console.log(`  ${k.padEnd(8)} ${String(a.bouts).padStart(6)} ${String(a.winPc).padStart(6)}% ${String(a.wentDown).padStart(11)} ${String(a.died).padStart(6)} ${String(a.deathPc).padStart(15)}%`);
  if(out.cf){
    console.log(`\n  THE SALUTE'S COUNTERFACTUAL — ${out.cf.asked} asks over ${out.pool} real men x 4 fame bands x 9 accounts`);
    console.log(`  mean gain in the odds of being spared: ${out.cf.meanDeltaPts} points`);
    console.log(`  asks where it carries him across the even line: ${out.cf.flipPc}%`);
    console.log(`\n  by the man's fame:`);
    for(const [k,b] of Object.entries(out.cf.byFame))
      console.log(`    ${k.padEnd(9)} +${b.meanPts} points · flips ${b.flipPc}% of asks`);
  } else console.log(out.cfNone);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
