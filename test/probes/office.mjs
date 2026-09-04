/* IS THERE A POPULATION FOR "STANDING FOR OFFICE", AND IS THE VOTE A CONTEST? — #234's verify-first

   The item names two falsifiers and refuses to let a constant be written before either is answered:

     "measure how many simulated houses ever clear riseOf(d)>=3 ... by, say, week 150-200 across a
      batch of seeded runs — if eligibility is rare, this is dead weight for most playthroughs and
      belongs later in the rung ladder or gated lower."

     "compute today's resolveElection score spread (base 28-52, +backing up to 44, +9 platform-likes,
      +ri(0,22) roll — roughly a 75-point swing) against a fame/favor-seeded player base, to confirm
      a player standing themselves at eligibility isn't already near-guaranteed to win off seeding
      alone, before a single denarius of Phase-1 campaign spend is added on top."

   And a third question the risk section raises but does not phrase as a measurement: the seat must
   not be a strictly better `backCandidate` at 1300d. That one needs the office's own payout counted,
   not argued about, so this also prices a term.

   So, in one played population:
     1. WHO QUALIFIES — for every house, the week riseOf(d) first reaches 3, how many elections it
        sees before and after, and how many houses never get there at all.
     2. THE CONTEST — at every real moment a real house could have stood, the actual standBase(d)
        against the actual rolled field, scored 4000 times through resolveElection's own arithmetic.
        Not a model of the field: the field, read off d.election.cands as callElection left it.
     3. WHAT BACKING BUYS — the same moments re-scored with each of backLevels' four tiers spent on
        the player's own name, which is the dial the item says already works for free.
     4. WHAT A TERM PAYS — the seven friendly read-sites, evaluated on the same states with and
        without the office, so phase 2's "it is worth exactly a friendly aedile" is a number.

   Run: node test/probes/office.mjs */
import { serve, open } from "../harness.mjs";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(()=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const H = 14, WEEKS = 220;
  const houses = [];         /* one row per house */
  const moments = [];        /* one row per week a house could have stood */
  let elections = 0, qWeeks = 0, qPurse = 0; const qGold = [];

  for(let h = 0; h < H; h++){
    const seed = `OFFICE-${h}`;
    const d = A.newGameState(seed, "clean", seed);
    const row = { h, rank3: null, rank3Fame: 0, elecBefore: 0, elecAfter: 0, top: 0, ended: 0 };
    let sawElection = null, stoodAt = null, lastPurse = 0;
    for(let w = 0; w < WEEKS && !d.over; w++){
      try { R.lanista(d, {}); } catch(e){ row.crash = String(e).slice(0,90); break; }
      if(d.over){ row.ended = d.week; break; }
      const r = A.riseOf(d);
      if(r > row.top) row.top = r;
      if(row.rank3 == null && r >= 3){ row.rank3 = d.week; row.rank3Fame = Math.round(d.fame); }

      /* a fresh election is one whose week we have not counted yet */
      if(d.election && d.election.week !== sawElection){
        sawElection = d.election.week; elections++;
        if(row.rank3 == null) row.elecBefore++; else row.elecAfter++;
      }

      /* what the arena actually pays a qualified house per week at home, which is the only honest
         thing to price an aedile's own public bill against */
      if(A.riseOf(d) >= 3){ qWeeks++; qPurse += Math.max(0, ((d.book && d.book.purse) || 0) - lastPurse); }
      lastPurse = (d.book && d.book.purse) || 0;
      if(A.riseOf(d) >= 3) qGold.push(Math.round(d.gold));

      /* one row per ELECTION he could have entered, not per week — an election is live for three
         weeks and would otherwise be counted three times over with near-identical numbers */
      if(A.standReady(d) && d.election.week !== stoodAt){
        stoodAt = d.election.week;
        const base = A.standBase(d);
        const field = d.election.cands.map(c=>({ base:c.base, plat:c.plat, rival:!!c.rival,
          likes: !!A.PLATFORMS.find(x=>x.key===c.plat).likes(d) }));
        const myPlat = A.standPlat(d);
        const myLikes = !!A.PLATFORMS.find(x=>x.key===myPlat).likes(d);
        moments.push({ h, week:d.week, rise:A.riseOf(d), fame:Math.round(d.fame),
          favor:Math.round(d.favor||0), gold:Math.round(d.gold), rivals:(d.rivals||[]).length,
          base, myPlat, myLikes, field });
      }
    }
    if(row.rank3 == null) row.rank3 = -1;
    houses.push(row);
  }

  /* ---- 2 & 3: score the real fields through resolveElection's own arithmetic ----
     s = base + backing + (likes ? 9 : 0) + ri(0,22), highest wins. The roll is the only unknown, so
     rolling it 4000 times per moment IS the win rate for that moment. */
  const TRIALS = 4000;
  const ri = (a,b) => a + Math.floor(Math.random()*(b-a+1));
  const winRateAt = (m, backing) => {
    let won = 0;
    for(let t = 0; t < TRIALS; t++){
      let best = m.base + backing + (m.myLikes?9:0) + ri(0,22), mine = true;
      for(const c of m.field){
        const s = c.base + 0 + (c.likes?9:0) + ri(0,22);
        if(s > best){ best = s; mine = false; }
      }
      if(mine) won++;
    }
    return won / TRIALS;
  };
  const TIERS = [0, 11, 26, 44];       /* backLevels' odds column */
  const rates = moments.map(m=>({ h:m.h, week:m.week, rise:m.rise, fame:m.fame, favor:m.favor,
    gold:m.gold, rivals:m.rivals, base:m.base, myLikes:m.myLikes, myPlat:m.myPlat,
    fieldTop: Math.max(...m.field.map(c=>c.base + (c.likes?9:0))),
    r: TIERS.map(t=>winRateAt(m, t)) }));

  /* ---- THE SWEEP ----
     The field above is static by construction: `makeCandidate` seeds every NPC at ri(28,52) forever,
     while `standBase` climbs with the house. Two candidate fixes, applied to the SAME recorded
     fields so the comparison is like for like:
       FIELD — the town's notables grow with the town: every NPC base gains min(cap, rise * k).
       ANSWER — the other houses answer his candidacy: on entering, each rival house has a chance
                to put ri(5,14) behind somebody who is not him. (`callElection`'s own loop, aimed.)
     Both are evaluated against the recorded `rivals` count and the recorded rung. */
  const sweepAt = (m, backing, k, cap, answerP) => {
    let won = 0;
    for(let t = 0; t < TRIALS; t++){
      const grow = Math.min(cap, Math.round(m.rise * k));
      const F = m.field.map(c=>({ b: c.base + grow, likes: c.likes }));
      for(let i = 0; i < m.rivals; i++)
        if(Math.random() < answerP && F.length){ const c = F[Math.floor(Math.random()*F.length)]; c.b += ri(5,14); }
      let best = m.base + backing + (m.myLikes?9:0) + ri(0,22), mine = true;
      for(const c of F){ const s = c.b + (c.likes?9:0) + ri(0,22); if(s > best){ best = s; mine = false; } }
      if(mine) won++;
    }
    return won / TRIALS;
  };
  const COMBOS = [ [0,0,0], [3.4,20,0], [0,0,0.55], [3.4,20,0.55], [2.6,16,0.55], [4.2,24,0.7], [3.4,20,0.8] ];
  const sweep = COMBOS.map(([k,cap,ap])=>({ k, cap, ap,
    byRung: [3,4,5,6,7].map(rg=>{
      const ms = moments.filter(m=>m.rise===rg);
      return { rg, n: ms.length, t: TIERS.map(t=>ms.length ? ms.reduce((s,m)=>s+sweepAt(m,t,k,cap,ap),0)/ms.length : null) };
    }) }));

  /* ---- THE SECOND SWEEP: the answer, and what a man's own money buys for his own name ----
     The first sweep says the field-growth term punishes climbing (win rate FALLS from rung 3 to
     rung 6) while leaving 1300d at 96-100%. So this one drops it and varies the two levers that
     actually bear on the two faults: how hard the other houses answer a lanista's candidacy, and
     how much of backLevels' odds column a man buys when the name on the subscription list is his
     own. */
  const selfSweep = [];
  for(const ap of [0.4, 0.55, 0.7]){
    for(const sb of [1, 0.6, 0.45, 0.3]){
      selfSweep.push({ ap, sb, byRung: [3,4,5,6].map(rg=>{
        const ms = moments.filter(m=>m.rise===rg);
        return { rg, n: ms.length, t: TIERS.map(t=>ms.length
          ? ms.reduce((s,m)=>s+sweepAt(m, Math.round(t*sb), 0, 0, ap), 0)/ms.length : null) };
      }) });
    }
  }

  /* ---- 4: what the office is worth on the states that actually reached it ---- */
  const worth = [];
  for(const m of moments.slice(0, 40)){
    /* rebuild a state at that moment is not possible cheaply, so price the office's own dials,
       which are pure functions of the aedile object */
    const fake = w => ({ aedile:{ friendly:w==="friendly", hostile:w==="hostile", mine:w==="mine",
      until: 1e9 }, week: 0 });
    for(const w of ["none","friendly","mine"]){
      const s = w === "none" ? { week:0 } : fake(w);
      worth.push({ w, purse:A.aedilePurse(s), offers:A.aedileOffers(s), missio:A.aedileMissio(s) });
    }
    break;
  }

  return { houses, elections, nMoments: moments.length, rates, worth, sweep, selfSweep,
    qWeeks, qPurse, qGold: qGold.sort((a,b)=>a-b),
    ELECTION_WEEK: A.ELECTION_WEEK, STAND_RANK: A.STAND_RANK,
    backLevels: A.backLevels };
});

const pc = n => `${(n*100).toFixed(1)}%`;
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;

console.log(`\n=== 1. WHO QUALIFIES  (${out.houses.length} houses, up to 220 weeks, ${out.elections} elections) ===`);
const got = out.houses.filter(h=>h.rank3 > 0);
console.log(`  reached rise ${out.STAND_RANK} (Friend of the Magistracy): ${got.length}/${out.houses.length} = ${pc(got.length/out.houses.length)}`);
if(got.length) console.log(`  first reached at week: ${got.map(h=>h.rank3).sort((a,b)=>a-b).join(", ")}  (median ${got.map(h=>h.rank3).sort((a,b)=>a-b)[Math.floor(got.length/2)]})`);
console.log(`  top rung reached, per house: ${out.houses.map(h=>h.top).join(", ")}`);
console.log(`  elections seen while unqualified ${out.houses.reduce((s,h)=>s+h.elecBefore,0)} · while qualified ${out.houses.reduce((s,h)=>s+h.elecAfter,0)}`);
const crashed = out.houses.filter(h=>h.crash);
if(crashed.length) console.log(`  CRASHES: ${crashed.map(h=>`h${h.h}: ${h.crash}`).join(" | ")}`);

console.log(`\n=== 2. THE CONTEST  (${out.nMoments} weeks a real house could have stood) ===`);
if(!out.rates.length) console.log("  none — nobody qualified during a live election");
else {
  const r0 = out.rates.map(x=>x.r[0]);
  console.log(`  standing with no money spent: mean ${pc(mean(r0))} · min ${pc(Math.min(...r0))} · max ${pc(Math.max(...r0))}`);
  console.log(`  the field's best seeded score vs the player's base:`);
  for(const x of out.rates.slice(0, 14))
    console.log(`    h${x.h} w${x.week} rise ${x.rise} fame ${x.fame} favor ${x.favor} → base ${x.base}${x.myLikes?"+9":"  "} (${x.myPlat}) vs field top ${x.fieldTop} → ${pc(x.r[0])}`);
  if(out.rates.length > 14) console.log(`    ... and ${out.rates.length-14} more`);
}

console.log(`\n=== 3. WHAT BACKING YOUR OWN NAME BUYS ===`);
out.backLevels.forEach((L, i)=>{
  if(!out.rates.length) return;
  const r = out.rates.map(x=>x.r[i]);
  console.log(`  ${String(L.n).padStart(4)}d (+${String(L.odds).padStart(2)}) "${L.label}": mean ${pc(mean(r))} · min ${pc(Math.min(...r))} · max ${pc(Math.max(...r))}`);
});

console.log(`\n=== 4. THE SWEEP — win rate by rung, at each backing tier (0 / 180 / 520 / 1300d) ===`);
for(const c of out.sweep){
  console.log(`  field +min(${c.cap}, rise*${c.k})   rivals answer at ${pc(c.ap)}`);
  for(const b of c.byRung){
    if(!b.n) continue;
    console.log(`    rise ${b.rg} (n=${String(b.n).padStart(3)}):  ${b.t.map(x=>pc(x).padStart(6)).join("  ")}`);
  }
}

console.log(`\n=== 5. WHAT A QUALIFIED HOUSE HAS IN THE STRONGBOX (is 1300d still a price?) ===`);
if(out.rates.length){
  const byR = {};
  for(const x of out.rates){ (byR[x.rise] = byR[x.rise] || []).push(x.gold); }
  for(const rg of Object.keys(byR).sort()){
    const g = byR[rg].sort((a,b)=>a-b);
    console.log(`  rise ${rg} (n=${g.length}): median gold ${g[Math.floor(g.length/2)]}d · 1300d is ${((1300/Math.max(1,g[Math.floor(g.length/2)]))*100).toFixed(1)}% of it · rivals ${out.rates.find(x=>x.rise==rg).rivals}`);
  }
}
const qg = out.qGold;
console.log(`  across ${out.qWeeks} qualified weeks the arena paid ${out.qPurse}d in purses = ${(out.qPurse/Math.max(1,out.qWeeks)).toFixed(1)}d/week`);
console.log(`    a term is ${18} weeks, so a term's home purses are about ${Math.round(18*out.qPurse/Math.max(1,out.qWeeks))}d`);
console.log(`    what the 1.14x alone would add over a term: about ${Math.round(18*out.qPurse/Math.max(1,out.qWeeks)*0.14/1.14)}d`);
if(qg.length) console.log(`    gold held on a qualified week: p10 ${qg[Math.floor(qg.length*0.1)]}d · median ${qg[Math.floor(qg.length/2)]}d · p90 ${qg[Math.floor(qg.length*0.9)]}d`);

console.log(`\n=== 6. THE SECOND SWEEP — no field growth; rival answer x what own money buys ===`);
for(const c of out.selfSweep){
  const line = c.byRung.filter(b=>b.n).map(b=>`r${b.rg}: ${b.t.map(x=>pc(x).padStart(6)).join(" ")}`).join("   ");
  console.log(`  answer ${pc(c.ap)}  own money x${c.sb}  →  ${line}`);
}
console.log("");

await browser.close(); server.close();
