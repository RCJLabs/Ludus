/* THE TOP OF THE LADDER, AND WHICH TERM IS HOLDING IT — #151

   Census rungs 5, 6 and 7 — Known in Rome, Patron of the Games, Amicus Caesaris — were held by
   **0 of 37 late houses** across four seeds. The source's own note beside `RISE_ADMIT` records an
   older measurement in the same direction: one house in twenty-four reached Patron of the Games and
   none reached Amicus Caesaris. This asks which of the four terms is actually in the way, and
   whether a house that plays for the ladder can get there at all.

   `canClaimRise` is a CONJUNCTION of four, and the game hands them over already split —
   `riseNeed(d)` returns `fameOk`, `favorOk`, `goldOk` and `full`. So nothing is reconstructed here:
   the probe reads the game's four booleans every week and counts which one is missing when the
   other three hold, which is the `nemesis` design and the one that made #147 actionable.

   THE ITEM'S CLAUSE names the arm: it falsifies if a deliberately banking arm reaches rung 5, which
   `estate.mjs`'s `miser` "nearly did (72,752d held, blocked on FAVOUR rather than coin)". READ THAT
   ARM BEFORE BELIEVING IT — `miser` is `{ build:false, rites:false, party:false }`, and the table is
   documented in the rope as "the largest lever on the census ladder", worth rung 2.70 against 1.50.
   An arm that banks coin by not entertaining is an arm that has switched off the favour engine, so
   "blocked on favour" may be a fact about the arm. `banker` below is the honest version: the same
   two spends off, the table left ON.

   INSTRUMENT NOTES:
   · every arm runs the same seeds, and `base` runs first.
   · the four-term split is taken against whatever rung the house is CURRENTLY reaching for, and the
     per-rung table is keyed by that rung, so "coin holds the top and favour the bottom" can be read
     rather than assumed.
   · the raw per-house best rung is printed. Two findings on this project died for being read off 24
     houses and one of them was a maximum; run three seed prefixes before quoting. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 700);
const SEED = process.argv[4] || "RUNG";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const ARMS = {
    base:   { note:"the reference player, unchanged", opts:undefined },
    miser:  { note:"`estate`'s own banking arm — build, rites AND the table off",
      opts:{ build:false, rites:false, party:false } },
    banker: { note:"banks the same coin but keeps entertaining — the table is the favour engine",
      opts:{ build:false, rites:false } },
    works:  { note:"the works arm, which is where a long-lived house's coin actually goes",
      opts:{ works:true } },
    /* ---- THE FREE GRANT, WHICH IS THE ONLY WAY TO ASK "IS IT THE COIN" ----
       Every arm above spends: `hostParty` fires whenever spare allows, so even `banker` never banks
       past its reserve, and the top rung wants 80,000 HELD at the same moment as favour 90 — which
       the table is what buys. Two requirements in opposition is the exact shape the source removed
       from `closed`'s gate for being unsatisfiable. Handing the house coin every week bounds the
       question from above: if a house that cannot run out still never reaches rung 7, the gate is
       shut on something other than money, and if it does, the top of the ladder is an accumulation
       problem and not a gate fault. */
    granted:{ note:"coin topped to 200,000 every week — the upper bound on every banking policy",
      grant:200000 },
  };

  const rows = [];
  for(const [name, arm] of Object.entries(ARMS)){
    const houses = [];
    /* per-rung: how many weeks the house was reaching for it, and which term was the last one out */
    const rung = {};
    for(let h=0; h<H; h++){
      const d = A.newGameState("Rg"+h, "clean", `${SEED}-${h}`, null);
      let best = 0, goldPeak = 0, favPeak = 0, famePeak = 0;
      for(let w=0; w<W; w++){
        if(d.over) break;
        if(arm.grant) d.gold = Math.max(d.gold, arm.grant);
        R.lanista(d, arm.opts);
        const r = A.riseOf(d);
        best = Math.max(best, r);
        goldPeak = Math.max(goldPeak, d.gold||0);
        favPeak = Math.max(favPeak, d.favor||0);
        famePeak = Math.max(famePeak, d.fame||0);
        const n = A.riseNeed(d);
        if(!n) continue;                       /* nothing left to reach for */
        const tgt = r + 1;
        const R2 = rung[tgt] = rung[tgt] || { weeks:0, held:{}, oneShort:{}, all:0 };
        R2.weeks++;
        const terms = [["fame",n.fameOk], ["favour",n.favorOk], ["coin held",n.goldOk], ["the town's ear",n.full]];
        const on = terms.filter(t=>t[1]).length;
        R2.held[on] = (R2.held[on]||0)+1;
        if(on === 4) R2.all++;
        if(on === 3){ const miss = terms.find(t=>!t[1])[0]; R2.oneShort[miss] = (R2.oneShort[miss]||0)+1; }
      }
      houses.push({ best, week:d.week, over:d.over?d.over.kind:"alive",
        goldPeak:Math.round(goldPeak), favPeak:Math.round(favPeak), famePeak:Math.round(famePeak),
        favEnd:Math.round(d.favor||0), patrons:(A.patronsOf(d)||[]).length });
    }
    rows.push({ name, note:arm.note, houses, rung });
  }
  return { rows, ranks:A.RISE_RANKS.map((r,i)=>({ i, name:r.name, fame:r.fame||0, favor:r.favor||0, cost:r.cost||0 })) };
}, [H, W, SEED]);

const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };

console.log(`\n  THE LADDER: ${out.ranks.map(r=>`${r.i} ${r.name}${r.i?` (fame ${r.fame}, favour ${r.favor}, hold ${r.cost}d)`:""}`).join("\n               ")}`);
console.log(`\n  ${H} houses x up to ${W}w per arm · seed "${SEED}"\n`);
for(const a of out.rows){
  const Hs = a.houses;
  const dist = {}; for(const x of Hs) dist[x.best] = (dist[x.best]||0)+1;
  console.log(`  ${a.name.toUpperCase()} — ${a.note}`);
  console.log(`    best rung reached: ${Object.entries(dist).sort((x,y)=>+x[0]-+y[0]).map(([k,v])=>`rung ${k} x${v}`).join(" · ")}`
    + `   (median ${med(Hs.map(x=>x.best))}, best ${Math.max(...Hs.map(x=>x.best))})`);
  console.log(`    peaks: coin ${med(Hs.map(x=>x.goldPeak))} (max ${Math.max(...Hs.map(x=>x.goldPeak))})`
    + ` · favour ${med(Hs.map(x=>x.favPeak))} (max ${Math.max(...Hs.map(x=>x.favPeak))})`
    + ` · fame ${med(Hs.map(x=>x.famePeak))} (max ${Math.max(...Hs.map(x=>x.famePeak))})`
    + ` · patrons at the end ${med(Hs.map(x=>x.patrons))}`);
  console.log(`    median life ${med(Hs.map(x=>x.week))}w`);
  for(const tgt of Object.keys(a.rung).sort((x,y)=>+x-+y)){
    const R2 = a.rung[tgt], one = R2.oneShort;
    const rk = out.ranks[+tgt];
    console.log(`      reaching for ${tgt} ${rk?rk.name:"?"}: ${R2.weeks} weeks · all four held on ${R2.all}`
      + `   |   one short (${Object.values(one).reduce((s,v)=>s+v,0)}w): `
      + (Object.entries(one).sort((x,y)=>y[1]-x[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "never one short"));
  }
  console.log("");
}

await browser.close(); server.close();
