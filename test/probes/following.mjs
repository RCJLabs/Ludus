/* WHETHER A MAN COULD HAVE A TOWN OF HIS OWN — #274's verify-first.

     node test/probes/following.mjs 16 420

   #274 proposes a following per man per town, and states its own falsification clause: "If a tourer
   fights evenly across the three towns, a per-town following is three numbers that move together
   and buys nothing over `pfame`; if it concentrates, the system has a place to live."

   TWO THINGS HAVE TO BE SAID BEFORE ANY NUMBER IS READ.

   **`probes/capua.mjs` does not have the split the item cites.** It splits capua / away / travel /
   rome — home against not-home — and never by WHICH town. The per-town figure the clause turns on
   has never been measured.

   **And the clause asks about the rope, not the game.** The `tour` lever goes "straight to whichever
   of the three towns knows the house least" — it EQUALISES BY CONSTRUCTION, so running it and
   reading an even split would be reading the policy back out of itself. `stay` is the opposite
   policy and concentrates by construction. Both are the player's choice, so "does a tourer
   concentrate" has no single answer and cannot decide the item.

   ---- SO THE QUESTION THAT CAN DECIDE IT IS WHETHER A MAN HAS A GEOGRAPHY OF HIS OWN ----
   There is ONE roster and it travels whole: `setOut` moves `d.city` and `d.travel`, which belong to
   the house, and no man goes anywhere by himself (#268 measured the road as "one roster on wagons").
   So a man's town mix can differ from his house's only by WHICH WEEKS HE FOUGHT — and if every
   man's mix is his house's mix, then a following per man per town is `knownIn` multiplied by a
   per-man scalar, and `pfame` is already that scalar.

   This measures the divergence directly: the house's bouts by town, each man's bouts by town, and
   how far each man's mix sits from the house's. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","CITY_KEYS","knownIn","activeG"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const TOWNS = ["capua"].concat(A.CITY_KEYS);

  const arm = (opts, tag)=>{
    const houseMix = {}; for(const t of TOWNS) houseMix[t] = 0;
    const men = {};            /* gid -> { name, mix, bouts } */
    let weeks = 0, bouts = 0;
    for(let i=0;i<H;i++){
      const d = A.newGameState("Fo","clean",`FOLLOW-${tag}-${i}`);
      const seen = {};
      for(let w=0; w<W; w++){
        if(d.over) break;
        weeks++;
        const where = d.city || "capua";
        /* every man's record before and after the week — a bout is a win or a loss appearing */
        for(const g of A.activeG(d)) seen[g.id] = { w:g.wins||0, l:g.losses||0, name:g.name };
        try { R.lanista(d, opts); } catch(e){}
        try { A.endWeek(d); } catch(e){ break; }
        for(const g of (d.gladiators||[])){
          const was = seen[g.id]; if(!was) continue;
          const n = Math.max(0, (g.wins||0) - was.w) + Math.max(0, (g.losses||0) - was.l);
          if(!n) continue;
          bouts += n; houseMix[where] = (houseMix[where]||0) + n;
          const key = tag + ":" + i + ":" + g.id;
          const m = men[key] || (men[key] = { name:was.name, mix:{}, bouts:0 });
          m.mix[where] = (m.mix[where]||0) + n; m.bouts += n;
        }
      }
    }
    return { houseMix, men, weeks, bouts };
  };

  return { TOWNS,
    tour: arm(Object.assign({ tour:true }, MOST), "tour"),
    stay: arm(Object.assign({ stay:true, road:true }, MOST), "stay"),
    home: arm(MOST, "home") };
}, [H, W, MOST]);

await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const show = (tag, a)=>{
  const tot = a.bouts || 1;
  console.log(`\n${tag.toUpperCase()} — ${a.bouts} bouts over ${a.weeks} weeks`);
  console.log(`   the house's bouts by town: ` +
    out.TOWNS.map(t=>`${t} ${((100*(a.houseMix[t]||0))/tot).toFixed(0)}%`).join(" · "));
  /* how far each man's mix sits from his house's — total variation distance, 0 = identical */
  const men = Object.values(a.men).filter(m=>m.bouts >= 6);
  if(!men.length){ console.log(`   (no man fought six times; nothing to compare)`); return; }
  const hp = out.TOWNS.map(t=>(a.houseMix[t]||0)/tot);
  const tv = m => { const mp = out.TOWNS.map(t=>(m.mix[t]||0)/m.bouts);
    return 0.5 * mp.reduce((s,v,i)=>s + Math.abs(v - hp[i]), 0); };
  const dists = men.map(tv).sort((x,y)=>x-y);
  /* ---- AND THE NULL, WITHOUT WHICH THE NUMBER ABOVE MEANS NOTHING ----
     A man with six bouts across four towns looks concentrated BY CHANCE. So each man is re-drawn
     `n` times from his HOUSE'S OWN mix, with his own bout count, and the same distance taken. If
     the observed distances sit on top of the null, men have no geography beyond the sampling. */
  const REP = 40;
  const nullD = [];
  for(const m of men){
    for(let r=0;r<REP;r++){
      const mix = {};
      for(let b=0;b<m.bouts;b++){
        let x = Math.random(), k = 0;
        for(; k < hp.length - 1; k++){ x -= hp[k]; if(x < 0) break; }
        const t = out.TOWNS[k]; mix[t] = (mix[t]||0) + 1;
      }
      nullD.push(tv({ mix, bouts:m.bouts }));
    }
  }
  nullD.sort((x,y)=>x-y);
  const nq = k => nullD[Math.floor(nullD.length*k)];
  const q = k => dists[Math.floor(dists.length*k)];
  console.log(`   ${men.length} men with 6+ bouts · distance from the house's own mix: ` +
    `p50 ${q(0.5).toFixed(2)} · p90 ${q(0.9).toFixed(2)} · max ${dists[dists.length-1].toFixed(2)}`);
  console.log(`   the SAME men re-drawn from the house's own mix: p50 ${nq(0.5).toFixed(2)} · p90 ${nq(0.9).toFixed(2)}`);
  const lift = q(0.5) - nq(0.5);
  console.log(`   observed minus null at the median: ${lift >= 0 ? "+" : ""}${lift.toFixed(2)} — ` +
    (Math.abs(lift) < 0.05 ? "the men are their house, and the spread is the sampling"
                           : "the men are NOT their house"));
};
console.log(`\n#274 — COULD A MAN HAVE A TOWN OF HIS OWN? · ${H} houses x ${W} weeks an arm`);
console.log(`(distance is total variation: 0 means his town mix IS the house's, 1 means no overlap)`);
show("tour — goes where least known, equalises by construction", out.tour);
show("stay — the resident, concentrates by construction", out.stay);
show("home — never leaves Capua", out.home);
