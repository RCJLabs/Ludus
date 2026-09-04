/* #219 — IS THE TEMPLE FURNITURE, AND DOES A BLESSING ARRIVE UNSIGNED

   The item: "The temple is furniture. Blessed on 2.3% of weeks, vows never taken (rope), while the
   altar ledger (v3.153.0) made the shop legible. The gods' effects are real but arrive unsigned —
   a blessed win reads exactly like an ordinary one. Recommend outcomes name the god when a
   blessing worked (Fortuna's finger, Aesculapius at the bedside), so piety visibly earns its
   denarii and the 2.3% has a reason to rise."

   READ THE ROPE BEFORE READING THE RATE. Its `rites` lever is

       if(!d.blessing && spare() > 3500) for(const gd of Object.keys(A.GODS||{})) ...
       if(!d.vow      && spare() > 9000) ...

   which is a 3,500-denarii floor over the rope's own reserve for an offering and NINE THOUSAND for
   a vow — so "vows never taken" may be a sentence about that floor rather than about the temple.
   And `Object.keys(GODS)[0]` is "mars", every time, so whatever the rope did buy it bought from
   one god. Both are measured here against a policy that simply prays when the altar will take it.

   AND THE 2.3% IS THE NUMBER v2.60.0 ALREADY PRINTED. The note over `GODS` records "a blessing
   rode with the house 2.45% of weeks" as the fault it was fixing, and `PIETY_TOP` was the fix. So
   the first thing to ask is whether the item is quoting the disease or the cure.

   THREE ARMS: what the rate is now, what a blessing actually CHANGES, and whether anything the
   player reads ever names the god that changed it.

     node test/probes/temple.mjs 10 300 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 300);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"TEMPLE" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","GODS","GOD_KEYS","blessOf","pietyOf","makeOffering","swearVow",
                "offeringReady","vowStake","missioPlace","missioScore","missioOdds","missioAccount",
                "activeG","blessMercy","healSpeed"].filter(k=>A[k]==null);
  if(miss.length) return { miss };
  const pct = n => Math.round(n*1000)/10;

  /* ---- 1. THE RATE, under three policies ---- */
  const arms = {};
  for(const [key, opts, pray] of [["default (rites off)", {}, false],
                                  ["rites:true", { rites:true }, false],
                                  ["pray on every cooldown", {}, true]]){
    const a = arms[key] = { weeks:0, blessed:0, vowWeeks:0, vows:0, offerings:0, byGod:{},
      piety:[], spent:0, houses:0 };
    for(let h = 0; h < H; h++){
      const d = A.newGameState(`TEMPLE-${h}`, "clean", `TEMPLE-${h}`);
      a.houses++;
      for(let w = 0; w < W && !d.over; w++){
        a.weeks++;
        if(A.blessOf(d)) a.blessed++;
        if(d.vow) a.vowWeeks++;
        /* a policy with no floor but the altar's own price and the strongbox */
        if(pray){
          if(!A.blessOf(d) && A.offeringReady(d)){
            const affordable = A.GOD_KEYS.filter(k=>d.gold >= A.GODS[k].cost(d));
            /* not `[0]` — the rope's own lever takes the first key every time and that is Mars */
            const g = affordable[w % Math.max(1, affordable.length)];
            if(g){ const gold = d.gold; if(A.makeOffering(d, g)){ a.offerings++; a.spent += gold - d.gold;
              a.byGod[g] = (a.byGod[g]||0) + 1; } }
          }
          if(!d.vow && d.gold > 2000){
            const g = A.GOD_KEYS[w % A.GOD_KEYS.length];
            if(A.swearVow(d, g)) a.vows++;
          }
        }
        a.piety.push(Math.round(A.pietyOf(d)));
        try { R.lanista(d, opts); } catch(e){ break; }
      }
    }
    a.rate = pct(a.blessed/Math.max(1,a.weeks));
    a.vowRate = pct(a.vowWeeks/Math.max(1,a.weeks));
    a.pietyMid = a.piety.length ? a.piety.slice().sort((x,y)=>x-y)[Math.floor(a.piety.length/2)] : null;
    a.pietyMax = a.piety.length ? Math.max(...a.piety) : null;
    delete a.piety;
  }

  /* ---- 2. WHAT A BLESSING CHANGES, on the roll's own arithmetic ---- */
  /* FORTUNA rides into `ctx.fav` through `missioPlace`. The counterfactual is `saluteWorth`'s:
     ask the same pair of functions twice, with the term in and out. */
  const fort = { asks:0, worth:[], flipped:0 };
  {
    /* a house, not a survivor: thirty weeks of rope left the first draft with an empty roster and
       the arm silently measured nothing, which is the vacuity this project keeps finding */
    const d = A.newGameState("TEMPLE-FORT", "clean", "TEMPLE-FORT");
    for(let w = 0; w < 12; w++) R.lanista(d, {});
    let g = A.activeG(d).slice().sort((a,b)=>(b.pfame||0)-(a.pfame||0))[0];
    if(!g){ g = A.genGladiator(d, 60); g.id = d.nextId++; g.status = "active"; g.mine = true;
      d.gladiators.push(g); }
    fort.men = A.activeG(d).length;
    if(g){
      for(const fame of [10, 60, 200, 600]) for(const account of [20, 40, 60, 80])
        for(const crowd of [40, 62, 85]){
          const man = Object.assign({}, g, { pfame:fame });
          d.blessing = { god:"fortuna", until:d.week + 4 };
          const P = A.missioPlace(d, null);
          const ctx = Object.assign({}, P, { tier:2, man:0, day:0 });
          const full = A.missioOdds(A.missioScore(man, ctx, crowd, account, 16, true));
          const bare = A.missioOdds(A.missioScore(man,
            Object.assign({}, ctx, { fav: (ctx.fav||0) - A.blessMercy(d) }), crowd, account, 16, true));
          fort.asks++; fort.worth.push(full - bare);
          if(bare < 0.5 && full >= 0.5) fort.flipped++;
        }
      d.blessing = null;
    }
  }
  fort.mean = fort.worth.length ? pct(fort.worth.reduce((a,b)=>a+b,0)/fort.worth.length) : null;
  fort.max  = fort.worth.length ? pct(Math.max(...fort.worth)) : null;
  delete fort.worth;

  /* AESCULAPIUS is a rate on the mend, so ask the rate */
  let heal = null;
  { const d = A.newGameState("TEMPLE-HEAL", "clean", "TEMPLE-HEAL");
    for(let w = 0; w < 20; w++) R.lanista(d, {});
    const g = A.activeG(d)[0];
    const bare = A.healSpeed(d, g);
    d.blessing = { god:"aesculapius", until:d.week + 6 };
    const full = A.healSpeed(d, g);
    d.blessing = null;
    heal = { bare:Math.round(bare*100)/100, full:Math.round(full*100)/100 }; }

  /* ---- 3. DOES ANYTHING THE PLAYER READS NAME THE GOD ---- */
  const NAMES = A.GOD_KEYS.map(k=>A.GODS[k].name);
  const said = { blessedWeeks:0, lines:0, named:0, beats:0, beatsNamed:0, samples:[],
                 wheel:0, wheelPts:0, tallied:{}, sums:0, sumsNamed:0 };
  {
    for(let h = 0; h < 4; h++){
      const d = A.newGameState(`TEMPLE-S${h}`, "clean", `TEMPLE-S${h}`);
      let seenLog = 0;
      for(let w = 0; w < 160 && !d.over; w++){
        /* keep a blessing riding so the question is about the SIGN and not the rate */
        if(!A.blessOf(d) && A.offeringReady(d)){
          const k = A.GOD_KEYS[w % A.GOD_KEYS.length];
          d.gold += A.GODS[k].cost(d); A.makeOffering(d, k);
        }
        if(A.blessOf(d)) said.blessedWeeks++;
        const t = R.takeBout(d, {});
        if(t && t.res && t.res.beats) for(const b of t.res.beats){
          said.beats++;
          if(b.kind === "wheel"){ said.wheel++; said.wheelPts += (b.wheel||0); }
          if(NAMES.some(n=>String(b.text||"").includes(n))){ said.beatsNamed++;
            if(said.samples.length < 3) said.samples.push(b.text.slice(0, 100)); }
        }
        for(const l of ((t && t.res && t.res.sum) || (t && t.sum) || [])){
          said.sums++;
          if(NAMES.some(n=>String(l).includes(n))){ said.sumsNamed++;
            if(said.samples.length < 5) said.samples.push(String(l).slice(0, 100)); }
        }
        { const told = A.blessTold(d);
          if(told){ const gd = A.blessOf(d); said.tallied[gd] = told; } }
        try { R.lanista(d, {}); } catch(e){ break; }
        /* the chronicle, minus the offering line the altar writes itself */
        const log = (d.log||[]).slice(0, (d.log||[]).length - seenLog);
        seenLog = (d.log||[]).length;
        for(const l of log){
          const txt = String((l && l.text) || l || "");
          if(!A.blessOf(d)) continue;
          said.lines++;
          if(/denarii to the altar of|vow to |pledged/.test(txt)) continue;
          if(NAMES.some(n=>txt.includes(n))) said.named++;
        }
      }
    }
  }

  return { arms, fort, heal, said, gods:A.GOD_KEYS.map(k=>({ k, name:A.GODS[k].name, weeks:A.GODS[k].weeks })) };
}, [H, W]);

if(out.miss){ console.log("handle is missing:", out.miss.join(", ")); }
else {
  console.log(`\n#219 — is the temple furniture, and does a blessing arrive unsigned\n`);
  console.log(`HOW OFTEN A BLESSING RIDES:`);
  for(const [k, a] of Object.entries(out.arms))
    console.log(`  ${k.padEnd(34)} ${a.houses} houses, ${String(a.weeks).padStart(5)} weeks · blessed ${String(a.rate).padStart(5)}% `
      + `· a vow standing ${a.vowRate}% (${a.vows} sworn, ${a.offerings} offerings, ${a.spent}d)`
      + ` · piety median ${a.pietyMid}, best ${a.pietyMax}`
      + (Object.keys(a.byGod).length ? ` · ${Object.entries(a.byGod).map(([g,n])=>`${g} ${n}`).join(", ")}` : ""));

  console.log(`\nWHAT A BLESSING CHANGES:`);
  console.log(`  (the fixture had ${out.fort.men} men on its roster)`);
  console.log(`  Fortuna: over ${out.fort.asks} asks she is worth ${out.fort.mean} points of spare odds `
    + `on average (most ${out.fort.max}), and carries a man across the even line in ${out.fort.flipped}`);
  console.log(`  Aesculapius: the mend runs ${out.heal.bare} without her and ${out.heal.full} with `
    + `(${Math.round((out.heal.full/out.heal.bare - 1)*100)}% faster)`);

  console.log(`\nDOES ANYTHING NAME THE GOD:`);
  console.log(`  ${out.said.blessedWeeks} weeks with a blessing riding`);
  console.log(`  ${out.said.beatsNamed} of ${out.said.beats} bout beats name one of the five`);
  console.log(`  ${out.said.named} of ${out.said.lines} chronicle lines written under a blessing name one `
    + `(the altar's own offering line excluded)`);
  console.log(`  ${out.said.sumsNamed} of ${out.said.sums} result-summary lines name one`);
  console.log(`  the wheel spoke on ${out.said.wheel} appeals, handing over ${out.said.wheelPts} points of spare odds`);
  console.log(`  the receipt the temple panel showed, by god:`);
  for(const [g, t] of Object.entries(out.said.tallied)) console.log(`     ${g.padEnd(13)} ${t}`);
  for(const s of out.said.samples) console.log(`     e.g. ${s}`);
}
await browser.close(); server.close();
