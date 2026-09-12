/* WHAT A HOUSE'S OWN CHAMPION WOULD BE WORTH — #270's verify-first.

     node test/probes/bench.mjs 16 420 [policy]     # houses, weeks, ref|most

   #270 proposes keeping a freed or retired champion on as the house's own man, and asks two
   questions before any of it is built:

     1 · How many men per run reach `rudisEligible` or `retireEligible`? The item reasons from
         `men.freed 3` and `men.retired 16` across 16 houses — "about one a house" — but those are
         counts of men the rope ACTED on, and `free` and `retire` are opt-in doors the reference
         never opens. Eligibility is the number the bench would draw from, and nothing has read it.

     2 · What does the doctore's market actually offer against what those men would be? "If a
         house's own champion is a better doctore than the market's median, the bench prices
         itself." `makeDoctore` draws `skill` as `clamp(quality + ri(-8,8), 30, 82)` over two
         candidates at `ri(34,58)` and `ri(46,74)`, so the market's own distribution is knowable
         exactly and is sampled here rather than reasoned about.

   THE CHAMPIONS ARE COUNTED AT THE MOMENT THEY CROSS, not at the end. A man who reaches the rudis
   bar in week 90 and dies in week 140 was eligible; a sweep of the yard at week 420 would miss him
   entirely, which is the `activeG` sampling fault v2.89.0 already had to correct once in `ends`.
   So every man is watched every week and his crossing is recorded the week it happens.

   AND `retireEligible` IS `g.age>=31 || scarBurden(g)>=20`, which is not a champion test at all —
   it is an age test, and it will be met by nearly everyone who lives. The two gates are counted
   apart because a bench drawn from the first is a bench of champions and a bench drawn from the
   second is a bench of anyone who got old. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420);
const POLICY = process.argv[4] || "ref";
const SET = process.argv[5] || "A";
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true, tour:true };
const OPTS = POLICY === "most" ? MOST : {};

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, OPTS, SET])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","rudisEligible","retireEligible","makeDoctore","STATS","activeG",
    "rudisBar","scarBurden","DOC_AGE_FROM"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  /* ---- 1. the market, sampled off its own generator ---- */
  const mkt = [];
  { const st = A.rngGet();
    const d0 = A.newGameState("Bn","clean","BENCH-MKT");
    for(let i=0;i<400;i++){
      const lo = A.makeDoctore(d0, 34 + Math.floor(Math.random()*25));
      const hi = A.makeDoctore(d0, 46 + Math.floor(Math.random()*29));
      mkt.push(lo, hi);
    }
    A.rngSet(st); }

  /* ---- 2. the champions, caught the week they cross ---- */
  const rud = [], ret = [];
  let weeks = 0, everMen = 0;
  const houses = [];
  for(let i=0;i<H;i++){
    const d = A.newGameState("Bn","clean",`BENCH-${SET}-${i}`);
    const crossedR = {}, crossedT = {};
    let hr = 0, ht = 0;
    for(let w=0; w<W; w++){
      if(d.over) break;
      weeks++;
      for(const g of A.activeG(d)){
        if(!crossedR[g.id] && A.rudisEligible(g)){
          crossedR[g.id] = 1; hr++;
          rud.push({ wins:g.wins||0, fame:Math.round(g.pfame||0), age:g.age,
            str:g.str, agi:g.agi, tec:g.tec, dis:g.dis, week:w, cls:g.cls,
            scar:Math.round(A.scarBurden(g)) });
        }
        if(!crossedT[g.id] && A.retireEligible(g)){
          crossedT[g.id] = 1; ht++;
          ret.push({ wins:g.wins||0, fame:Math.round(g.pfame||0), age:g.age,
            byAge: g.age>=31, byScar: A.scarBurden(g)>=20, week:w });
        }
      }
      try { R.lanista(d, OPTS); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
    }
    everMen += (d.gladiators||[]).length;
    houses.push({ rudis:hr, retire:ht, men:(d.gladiators||[]).length, over:d.over?d.over.kind:null });
  }
  /* ---- 3. AND THE BENCH THAT ALREADY EXISTS ----
     `FREEDMEN.doctore` is "He comes back to teach": `makeDoctore(d, 40 + f.wins*2.2)`, `fee = 0`,
     `fromHouse = true`, his own age, a `pastLine` naming his wins under your colours, and +9 morale
     and +7 regard to every man standing. That is the item's proposal, shipped. So the question is
     not whether it exists but whether it ever FIRES — the #219 shape, where a whole system was
     real, finished and never once reached. */
  const fired = { weeks:0, freedPool:0, eligibleWeeks:0, chairEmpty:0, aManWorthIt:0,
    became:{}, fromHouse:0, houses:0, poolN:0, poolWorth:0 };
  for(let i=0;i<H;i++){
    const d = A.newGameState("Bn","clean",`BENCHF-${SET}-${i}`);
    let sawFromHouse = false;
    for(let w=0; w<W; w++){
      if(d.over) break;
      fired.weeks++;
      const pool = (d.freed||[]).concat(d.retired||[]).filter(f=>!f.became && d.week - f.week >= 5);
      if(pool.length){
        fired.freedPool++;
        /* A CONJUNCTION MUST BE SPLIT BY TERM BEFORE ANYTHING CAN BE FIXED — `nemesis` established
           that in this codebase and the RUINS comment cites it. `need` is `!d.doctore && f.wins >= 8`
           and a count of the whole says nothing about which half is holding the door. */
        const chairEmpty = !d.doctore;
        const worth = pool.filter(f=>(f.wins||0) >= 8).length;
        if(chairEmpty) fired.chairEmpty++;
        if(worth) fired.aManWorthIt++;
        if(chairEmpty && worth) fired.eligibleWeeks++;
        /* AND `pick(pool)` IS UNIFORM, so "some man in the pool has 8 wins" is not the odds — the
           odds are the SHARE of the pool that does. A pool of one champion and nine men who got
           old answers the first at 100% and the second at 10%. */
        fired.poolN += pool.length; fired.poolWorth += worth;
      }
      try { R.lanista(d, OPTS); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
      if(d.doctore && d.doctore.fromHouse) sawFromHouse = true;
    }
    for(const f of (d.freed||[]).concat(d.retired||[])) if(f.became) fired.became[f.became] = (fired.became[f.became]||0)+1;
    if(sawFromHouse) fired.fromHouse++;
    fired.houses++;
  }

  return { mkt, rud, ret, weeks, houses, everMen, docAgeFrom:A.DOC_AGE_FROM, fired };
}, [H, W, OPTS, SET]);

await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const q = (a, f) => { const v = a.map(f).filter(x=>x!=null).sort((x,y)=>x-y);
  if(!v.length) return { p50:0, p10:0, p90:0, n:0, mean:0 };
  return { n:v.length, p10:v[Math.floor(v.length*0.1)], p50:v[Math.floor(v.length*0.5)],
    p90:v[Math.floor(v.length*0.9)], mean:+(v.reduce((s,x)=>s+x,0)/v.length).toFixed(1) }; };

console.log(`\n#270 — THE VETERAN'S BENCH · ${H} houses x ${W} weeks under \`${POLICY}\` (${out.weeks} played, ${out.everMen} men ever)\n`);

const mSkill = q(out.mkt, c=>c.skill), mAge = q(out.mkt, c=>c.age), mSand = q(out.mkt, c=>c.sand);
console.log(`THE MARKET (${out.mkt.length} candidates off \`makeDoctore\`'s own draws):`);
console.log(`   skill p10 ${mSkill.p10} · p50 ${mSkill.p50} · p90 ${mSkill.p90} (mean ${mSkill.mean})`);
console.log(`   age   p10 ${mAge.p10} · p50 ${mAge.p50} · p90 ${mAge.p90} — the years start to tell at ${out.docAgeFrom}`);
console.log(`   sand  p50 ${mSand.p50} years · fee p50 ${q(out.mkt,c=>c.fee).p50}d · wage p50 ${q(out.mkt,c=>c.wage).p50}d/wk\n`);

const perHouse = a => (a.length / out.houses.length).toFixed(2);
console.log(`THE RUDIS BAR — ten wins and a name — crossed by ${out.rud.length} men, ${perHouse(out.rud)} a house:`);
if(out.rud.length){
  console.log(`   wins  p10 ${q(out.rud,m=>m.wins).p10} · p50 ${q(out.rud,m=>m.wins).p50} · p90 ${q(out.rud,m=>m.wins).p90}`);
  console.log(`   fame  p50 ${q(out.rud,m=>m.fame).p50} · age p50 ${q(out.rud,m=>m.age).p50} · scars p50 ${q(out.rud,m=>m.scar).p50}`);
  console.log(`   stats p50 str ${q(out.rud,m=>m.str).p50} agi ${q(out.rud,m=>m.agi).p50} tec ${q(out.rud,m=>m.tec).p50} dis ${q(out.rud,m=>m.dis).p50}`);
  console.log(`   crossed at week p10 ${q(out.rud,m=>m.week).p10} · p50 ${q(out.rud,m=>m.week).p50}`);
}
console.log(`\nTHE RETIRE GATE — age 31 or 20 scars — crossed by ${out.ret.length} men, ${perHouse(out.ret)} a house:`);
if(out.ret.length){
  const byAge = out.ret.filter(m=>m.byAge).length, byScar = out.ret.filter(m=>m.byScar && !m.byAge).length;
  console.log(`   ${byAge} by AGE alone · ${byScar} by scars alone · wins p50 ${q(out.ret,m=>m.wins).p50} · fame p50 ${q(out.ret,m=>m.fame).p50}`);
}
const withR = out.houses.filter(h=>h.rudis > 0).length;
console.log(`\n${withR} of ${out.houses.length} houses ever produced a man who cleared the rudis bar.`);
console.log(`houses: ${out.houses.map(h=>`${h.rudis}/${h.retire}`).join(" ")}   (rudis/retire)`);

const F = out.fired;
console.log(`\n---- AND THE BENCH THAT ALREADY EXISTS: \`FREEDMEN.doctore\` ----`);
console.log(`${F.weeks} weeks over ${F.houses} houses · a freed or retired man was waiting in ${F.freedPool} of them (${(100*F.freedPool/F.weeks).toFixed(1)}%)`);
console.log(`  of those weeks — the chair was EMPTY in ${F.chairEmpty} (${(100*F.chairEmpty/F.freedPool).toFixed(1)}% of them)`);
console.log(`  of those weeks — a waiting man had 8+ WINS in ${F.aManWorthIt} (${(100*F.aManWorthIt/F.freedPool).toFixed(1)}% of them)`);
console.log(`  BOTH at once: ${F.eligibleWeeks} weeks (${(100*F.eligibleWeeks/F.weeks).toFixed(1)}% of all weeks)`);
console.log(`  and \`pick\` is UNIFORM: ${F.poolWorth} of ${F.poolN} men waiting had 8+ wins (${(100*F.poolWorth/Math.max(1,F.poolN)).toFixed(1)}%) — that, not "some man", is the odds`);
console.log(`what freed men actually became: ${Object.entries(F.became).map(([k,n])=>`${k} ${n}`).join(" · ") || "NOTHING — not one of them became anything"}`);
console.log(`houses that ever had their OWN man in the doctore's chair: ${F.fromHouse} of ${F.houses}`);
