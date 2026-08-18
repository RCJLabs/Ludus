/* THE SECOND GENERATION — is it declined, or is it arithmetic? (#147)

   #147 opened on a count: 60 houses x 420 weeks produced ruin 26, debt 25, banned 2, emptied 1,
   rebellion 1, and five alive — two endings carrying 85% of outcomes while seven of the twelve the
   source can set never appeared. Its clause said the missing ones might be choices the rope declines
   rather than gates it cannot reach, and named the cheap test: an arm that deliberately pursues each.

   This probe takes the one that cannot be a policy question. `oldAge` is reached only through
   `endTheLine`, which wants a `d.succession` carrying `retire:true`, which is raised by exactly one
   branch in `lanistaWeek`:

       if(L.age >= 62 && L.health >= 45 && d.heir && yearOf(d) >= 6 && R() < 0.06)

   The comment beside that branch argues the gate is generous: "Past 62 health falls (62-42)*0.045 =
   0.90 a week against 0.06 of mending, so from about 85 it takes roughly 48 weeks to reach the
   health-45 floor". That reckons the decay only from 62 onward. The decay starts at 43.

   INSTRUMENT NOTES, all three off this project's record:
   · ARM A drives the game's own `lanistaWeek` — it does not reconstruct the health formula, which
     is the mistake `stone` made and had to be rewritten for. Its one borrowed line is the year
     boundary, and the first draft got that wrong: it reached for `A.WEEKS_PER_YEAR`, which is not
     on the handle, so the modulus was NaN, the age never moved, and all twelve rows read "he never
     got to 62" while ARM B was reaching 62 in twenty-two houses of thirty. It reads `yearOf` now,
     and every row prints the age it actually ran to so a frozen clock cannot pass as a healthy one.
   · ARM B's free grant is a LEVER (argv 5), not the measurement. Run it both ways: a gate that
     opens for a house which cannot go broke and not for the one that can is a survival problem,
     not an arithmetic one, and only the pair distinguishes those.
   · every arm prints its raw spread, not a mean. Two findings on this project died for being read
     off 24 houses and one of them was a maximum, so ARM B runs on whatever seed prefix it is given
     and is meant to be run on three or four. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 30), W = +(process.argv[3] || 1400);
const SEED = process.argv[4] || "SUCC";
/* the free grant is a LEVER, not the measurement. ARM B runs twice: once as the rope actually
   plays (`grant 0`) and once with the ledger held up, and the pair is the finding — a gate that
   opens for the solvent house and not the ordinary one is a survival problem, not an arithmetic one. */
const GRANT = +(process.argv[5] || 0);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED,GRANT])=>{
  const A = window.__LVDVS, R = window.__ROPE;

  /* ---- ARM A: THE CLOCK ON ITS OWN ----
     No yard, no burials, no unrest — nothing but age against mending. This is the kindest run the
     health number can have, so whatever age it reaches here is a ceiling on every real house. */
  const clock = [];
  for(const baths of [0, 4]){
    const rows = [];
    for(let h=0; h<12; h++){
      const d = A.newGameState("Clk"+h, "clean", `${SEED}-clk-${baths}-${h}`, null);
      if(baths) d.buildings = { ...(d.buildings||{}), balneae: baths };
      const L = d.lanista;
      const start = { age:L.age, health:Math.round(L.health) };
      let sub45 = null, dead = null, at62 = null;
      /* the year boundary is read off the game's own `yearOf`, not off a copy of `endWeek`'s
         modulus — the first draft of this arm hardcoded `A.WEEKS_PER_YEAR`, which is not on the
         handle, so `(d.week-1) % undefined` was NaN, the age never moved, and every row read
         "never got there" while ARM B was reaching 62 in 22 houses of 30. */
      let yr = A.yearOf(d);
      for(let w=0; w<1600; w++){
        A.lanistaWeek(d);
        d.week++;
        const y = A.yearOf(d);
        if(y !== yr){ yr = y; L.age++; }
        if(L.age === 62 && at62 == null) at62 = Math.round(L.health);
        if(sub45 == null && L.health < 45) sub45 = L.age;
        if(dead == null && L.health <= 0){ dead = L.age; break; }
      }
      rows.push({ ...start, sub45, dead, at62, endAge:L.age, bathLevel:baths });
    }
    clock.push({ baths, rows });
  }

  /* ---- ARM B: A HOUSE THAT CANNOT GO BROKE ----
     The rope, as it plays, with the ledger held up from underneath. */
  const houses = [];
  for(let h=0; h<H; h++){
    const d = A.newGameState("Succ"+h, "clean", `${SEED}-${h}`, null);
    const L = d.lanista;
    const start = { age:L.age, health:Math.round(L.health) };
    let maxAge = L.age, hAt62 = null, gateOpen = 0, succ = null, retire = null, heirAt = null;
    let sub45 = null, gen = 1;
    for(let w=0; w<W; w++){
      if(d.over) break;
      if(GRANT) d.gold = Math.max(d.gold, GRANT);   /* the free grant, when the lever is on */
      R.lanista(d);
      if(!d.lanista) break;
      const M = d.lanista;
      maxAge = Math.max(maxAge, M.age);
      if(heirAt == null && d.heir) heirAt = d.week;
      if(sub45 == null && M.health < 45) sub45 = M.age;
      if(M.age === 62 && hAt62 == null) hAt62 = Math.round(M.health);
      if(M.age >= 62 && M.health >= 45 && d.heir && A.yearOf(d) >= 6) gateOpen++;
      if(d.succession && !succ) succ = { week:d.week, age:d.succession.age, retire:!!d.succession.retire };
      if(d.succession && d.succession.retire && !retire) retire = d.week;
      if(d.forebears) gen = Math.max(gen, 1 + d.forebears.length);
    }
    houses.push({ ...start, end:d.week, over:d.over?d.over.kind:"alive", maxAge,
      hAt62, gateOpen, succ, retire, heirAt, sub45, gen,
      lanHealth: d.lanista ? Math.round(d.lanista.health) : null, gold:Math.round(d.gold) });
  }
  return { clock, houses };
}, [H, W, SEED, GRANT]);

const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };

console.log(`\n  ARM A — the lanista's clock with no house on it at all (12 runs per row)\n`);
console.log(`  baths   start age/health   health first < 45 at age   health hits 0 at age   health on his 62nd`);
for(const c of out.clock){
  const r = c.rows;
  console.log(`  ${String(c.baths).padEnd(5)}   ${String(med(r.map(x=>x.age))).padStart(3)} / ${String(med(r.map(x=>x.health))).padEnd(9)}   ${String(med(r.map(x=>x.sub45))).padStart(22)}   ${String(med(r.map(x=>x.dead))).padStart(19)}   ${String(r.filter(x=>x.at62!=null).length ? med(r.map(x=>x.at62)) : "never got there").padStart(17)}`);
}
for(const c of out.clock){
  console.log(`  raw, baths level ${c.baths}${c.baths?" (the most the game builds)":""} — the age he got to is printed so a frozen clock cannot read as a healthy one:`);
  for(const x of c.rows)
    console.log(`    start ${x.age}/${x.health}  ->  under 45 at ${x.sub45==null?"-":x.sub45}   zero at ${x.dead==null?"-":x.dead}   at 62: ${x.at62==null?"-":x.at62}   (ran to age ${x.endAge})`);
}

const Hs = out.houses;
console.log(`\n  ARM B — ${Hs.length} houses x up to ${W}w · seed "${SEED}" · ${GRANT ? `coin topped to ${GRANT} every week` : "the rope as it actually plays, no grant"}\n`);
console.log(`  reached age 62 at all:            ${Hs.filter(x=>x.maxAge>=62).length} of ${Hs.length}`);
console.log(`  ... and well enough (health>=45): ${Hs.filter(x=>x.hAt62!=null && x.hAt62>=45).length}`);
console.log(`  weeks the retirement gate stood open, summed over every house: ${Hs.reduce((s,x)=>s+x.gateOpen,0)}`);
console.log(`  a succession of any kind raised:  ${Hs.filter(x=>x.succ).length}`);
console.log(`  ... a RETIREMENT succession:      ${Hs.filter(x=>x.retire).length}`);
console.log(`  houses that named an heir:        ${Hs.filter(x=>x.heirAt!=null).length} (median week ${med(Hs.map(x=>x.heirAt))})`);
console.log(`  second generation reached:        ${Hs.filter(x=>x.gen>=2).length}`);
console.log(`  median oldest age: ${med(Hs.map(x=>x.maxAge))}   ·   median age health first fell under 45: ${med(Hs.map(x=>x.sub45))}`);
console.log(`  median week the house ended: ${med(Hs.map(x=>x.end))}`);
const ends = {}; for(const x of Hs) ends[x.over] = (ends[x.over]||0)+1;
console.log(`  endings: ${Object.entries(ends).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
console.log(`\n  raw:`);
console.log(`    start   oldest   under45@   h@62   gateWks   heir wk   ended wk   ending`);
for(const x of Hs)
  console.log(`    ${String(x.age).padStart(2)}/${String(x.health).padEnd(3)} ${String(x.maxAge).padStart(6)} ${String(x.sub45==null?"-":x.sub45).padStart(10)} ${String(x.hAt62==null?"-":x.hAt62).padStart(6)} ${String(x.gateOpen).padStart(9)} ${String(x.heirAt==null?"-":x.heirAt).padStart(9)} ${String(x.end).padStart(10)}   ${x.over}`);

await browser.close(); server.close();
