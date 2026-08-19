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
    /* ---- #158: THE PAIR THAT ISOLATES THE TIMING ----
       `cycle` below answered #154's clause but is not a clean control for #158: it hosts from its own
       spare rule (`gold - 700`) while the rope hosts from `LAN.reserve(d)`, so it differs in the
       THRESHOLD as well as the schedule. `timed` is the reference player with one thing changed —
       `party:"rung"`, which hosts only while favour is short of what the next census rung asks and
       banks otherwise. Same reserve, same kind ladder, same everything else, same seeds. */
    timed:  { note:"the reference player, hosting only while favour is short of the next rung — #158",
      opts:{ party:"rung" } },
    dry:    { note:"the reference player, never entertaining at all — the other end of the range",
      opts:{ party:false } },
    miser:  { note:"`estate`'s own banking arm — build, rites AND the table off",
      opts:{ build:false, rites:false, party:false } },
    banker: { note:"banks the same coin but keeps entertaining — the table is the favour engine",
      opts:{ build:false, rites:false } },
    works:  { note:"the works arm, which is where a long-lived house's coin actually goes",
      opts:{ works:true } },
    /* ---- #154'S CLAUSE, WHICH NAMES ITS OWN ARM ----
       The last rung wants 80,000 HELD at the same moment as favour 90, and no arm above holds both:
       the one that banks hardest (`miser`) never entertains and caps out at favour 84-89, and the one
       that reaches favour 100 spends the coin buying it, because `hostParty` fires whenever spare
       allows. The clause names the missing policy — entertain on a CYCLE rather than every week the
       purse permits. So: the table off in the rope, and hosted here only when favour has slipped
       towards the bar, with everything else banked. `modest` is 150d for +5 warm on every patron, so
       holding station should be cheap; whether it is cheap ENOUGH is the question. */
    cycle:  { note:"banks, and throws a party only when favour slips towards the 90 the top rung wants",
      opts:{ build:false, rites:false, party:false },
      each(d){
        if(d.over || (d.favor||0) >= 92) return;
        const sp = d.gold - 700;
        const kind = sp > 4000 ? "decadent" : sp > 1600 ? "lavish" : sp > 700 ? "modest" : null;
        if(kind) A.hostParty(d, kind);
      } },
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
      let best = 0, goldPeak = 0, favPeak = 0, famePeak = 0, rich = 0, liked = 0, both = 0;
      const wp = { box:0, owed:0, rack:0, men:0, all:0 }, wb = { owed:0, rack:0, men:0, all:0 };
      const ceil = { box:0, men:0, all:0 };
      for(let w=0; w<W; w++){
        if(d.over) break;
        if(arm.grant) d.gold = Math.max(d.gold, arm.grant);
        if(arm.each) arm.each(d);
        if(d.over) break;
        R.lanista(d, arm.opts);
        /* #154: the two requirements of the top rung, asked TOGETHER rather than one at a time */
        if((d.gold||0) >= 80000) rich++;
        if((d.favor||0) >= 90) liked++;
        if((d.gold||0) >= 80000 && (d.favor||0) >= 90) both++;
        /* ---- AND WHAT A CENSUS WOULD COUNT IF IT COUNTED PROPERTY ----
           `goldOk` reads `d.gold` alone. The flavour beside it says a man "had to BE worth it", and
           `paragonReach` already draws exactly this distinction for the block — box against worth.
           So the candidate definitions are built up one term at a time and each is asked the same
           question, because "read a worth instead" is only a repair if some version of it reaches
           80,000 while favour is at 90. Every part is priced off the game's own tables. */
        const box = d.gold||0;
        const owed = A.owedTotal(d)||0;
        let racks = 0;
        for(const [id,c] of Object.entries(d.gear||{}))
          if(A.wears(A.GEAR[id])) racks += A.GEAR[id].price * 0.5 * (c||0);
        let stone = 0;
        for(const k of Object.keys(A.BUILDINGS)){
          const L = A.bLevel(d,k), cost = A.BUILDINGS[k].cost||[];
          for(let i=0;i<L;i++) stone += cost[i]||0;
        }
        const men = A.activeG(d).reduce((n,g)=>n + (A.gladValue(g)||0), 0);
        const w1 = box + owed, w2 = w1 + racks, w3 = w2 + men, w4 = w3 + stone;
        wp.box  = Math.max(wp.box,  box);
        wp.owed = Math.max(wp.owed, w1);
        wp.rack = Math.max(wp.rack, w2);
        wp.men  = Math.max(wp.men,  w3);
        wp.all  = Math.max(wp.all,  w4);
        if((d.favor||0) >= 90){
          if(w1 >= 80000) wb.owed++;
          if(w2 >= 80000) wb.rack++;
          if(w3 >= 80000) wb.men++;
          if(w4 >= 80000) wb.all++;
        }
        /* ---- AND THE WHOLE LADDER UNDER EACH READING, WHICH IS WHERE THE RISK IS ----
           "Count the stone" opens the top rung for a house that builds; it also has to be asked what
           it does to the rungs BELOW, because a census a finished house walks up is not a ladder. The
           highest rung whose fame, favour and PRICE are all met is recorded under each reading — the
           standing meter and the fee are left out on purpose, so this is the ceiling either reading
           allows and not a claim about how fast anybody would get there. */
        for(let r=1; r<A.RISE_RANKS.length; r++){
          const R3 = A.RISE_RANKS[r];
          if((d.fame||0) < (R3.fame||0) || (d.favor||0) < (R3.favor||0)) continue;
          if(box >= (R3.cost||0)) ceil.box = Math.max(ceil.box, r);
          if(w3  >= (R3.cost||0)) ceil.men = Math.max(ceil.men, r);
          if(w4  >= (R3.cost||0)) ceil.all = Math.max(ceil.all, r);
        }
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
      houses.push({ best, week:d.week, over:d.over?d.over.kind:"alive", rich, liked, both, wp, wb, ceil,
        parties:(d.flags&&d.flags.__parties)||0,
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
  console.log(`    the top rung's two demands: weeks holding 80,000+ ${Hs.reduce((s,x)=>s+x.rich,0)}`
    + ` · weeks at favour 90+ ${Hs.reduce((s,x)=>s+x.liked,0)}`
    + ` · weeks with BOTH AT ONCE ${Hs.reduce((s,x)=>s+x.both,0)}`
    + ` (in ${Hs.filter(x=>x.both>0).length} of ${Hs.length} houses)`);
  { const pk = k => Math.max(...Hs.map(x=>Math.round(x.wp[k])));
    const wk = k => Hs.reduce((s,x)=>s+x.wb[k],0);
    console.log(`    what a census could COUNT, best any house reached — box ${pk("box")} · +debts owed ${pk("owed")}`
      + ` · +racks at half ${pk("rack")} · +men ${pk("men")} · +stone ${pk("all")}`);
    console.log(`    weeks each definition would clear 80,000 WITH favour 90 — +debts ${wk("owed")}`
      + ` · +racks ${wk("rack")} · +men ${wk("men")} · +stone ${wk("all")}`);
    const cd = k => { const t={}; for(const x of Hs) t[x.ceil[k]] = (t[x.ceil[k]]||0)+1;
      return Object.entries(t).sort((a,b)=>+a[0]-+b[0]).map(([r,n])=>`${r}x${n}`).join(" "); };
    console.log(`    the highest rung the PRICE would allow (fame and favour met, meter and fee ignored):`);
    console.log(`       counting the box only  ${cd("box")}`);
    console.log(`       + debts, racks and men ${cd("men")}`);
    console.log(`       + the stone as well    ${cd("all")}`); }
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
