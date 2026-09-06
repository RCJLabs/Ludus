/* THE RISING, HEARD AND NOT ANSWERED — #247b, the measurement before anything moves.

   v3.207.0: the cells take 29 of 88 seeded houses, and unlike the debt death this one is signposted
   at enormous length. Every one of the 29 climbed all three rungs in order — whispers at 50 unrest,
   blades at 65, the night at 78 — and the first rung stood a median of 96, 80 and 30 weeks before
   the end. The house is told, three times, for a hundred weeks, and dies anyway.

   THAT LEAVES EXACTLY TWO POSSIBILITIES AND THE ITEM CANNOT BE WRITTEN UNTIL THEY ARE SEPARATED.
   Either there is no lever that answers a rising, or there is one and the reference player never
   pulls it. dark.mjs's standing rule: a system the rope never reaches reads as dark, and that is a
   fact about the policy and not about the game. So no constant moves until this probe has run.

     1 · WHERE THE UNREST COMES FROM. The weekly drift is one line in `endWeek`:

           unrest += (avgDef - 34)/9 - 0.6 - docCalm - cellCalm - auctors*0.35
                     - perkCalm - lanCalm - (collOn ? 0.4 : 0) + season*pit

         so every term is computable from the state, and the sum of them is what the week SHOULD
         have moved. The difference between that and what it actually moved is what the week's
         EVENTS did. Both are reported per era, which settles whether the late climb is the drift
         grinding upward or things happening.

     2 · AND WHAT DRIVES THE DRIVER. `avgDef` is the mean defiance of the bound men, and defiance
         has its own weekly rule: +0.8 under 40 morale, +0.6 Defiant, -0.4 Broken, -0.2 Stoic, and
         **+1.5 for a man who is `rudisEligible`** — who has earned the wooden sword and not been
         given it. A house that fights well makes those men. This counts them per era.

     3 · THE COUNTERFACTUAL, which is the whole point. The same seeds under four policies: the
         reference player; one that frees every man who has earned it (`free`, which the rope has
         had all along as an opt-in and which costs real fame); one that also keeps the rites and
         builds; and one that additionally buys the calm outright — a doctore of its own and the
         carceres — by hand each week. If the rising is answerable, the endings move.

     node test/probes/cells.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420), SEED = process.argv[4] || "CELLS";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG","docCalm","cellCalm","perkCalm","lanCalm","collOn","seasonOf",
                "docUnrest","pit","rudisEligible","isAuctor"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const ERA = w => Math.min(3, Math.floor((w - 1) / (W / 4)));
  const bound = d => A.activeG(d).filter(g=>!A.isGone || !A.isGone(g));

  /* ---- 1 and 2, on the reference player ---- */
  const era = [0,1,2,3].map(()=>({ n:0, clean:0, drift:0, event:0, def:0, terms:{}, men:0,
    lowMorale:0, defiant:0, rudis:0, morale:0, unrest:[] }));
  const ends = {};
  for(let h=0; h<H; h++){
    const d = A.newGameState("Cw"+h, "clean", `${SEED}-${h}`);
    let was = d.unrest;
    for(let w=0; w<W; w++){
      if(d.over) break;
      const e = ERA(d.week);
      const act = A.activeG(d), bnd = act.filter(g=>!A.isAuctor(g));
      const avgDef = bnd.length ? bnd.reduce((n,g)=>n + (g.defiance||0), 0) / bnd.length : 10;
      const T = {
        defiance: (avgDef - 34) / 9,
        base:     -0.6,
        doctore:  -A.docCalm(d),
        cells:    -A.cellCalm(d),
        auctors:  -act.filter(g=>A.isAuctor(g)).length * 0.35,
        perk:     -A.perkCalm(d),
        lanista:  -A.lanCalm(d),
        collegium: A.collOn(d) ? -0.4 : 0,
        season:   (A.seasonOf(d).unrest + A.docUnrest(d)) * A.pit(d, "unrest", 1),
      };
      const modelled = Object.values(T).reduce((n,v)=>n+v, 0);
      const E = era[e]; E.n++;
      for(const k of Object.keys(T)) E.terms[k] = (E.terms[k] || 0) + T[k];
      E.def += avgDef; E.men += bnd.length; E.unrest.push(Math.round(d.unrest));
      for(const g of bnd){
        if((g.morale||0) < 40) E.lowMorale++;
        if((g.traits||[]).includes("Defiant")) E.defiant++;
        let el = false; try { el = !!A.rudisEligible(g); } catch(x){}
        if(el) E.rudis++;
        E.morale += (g.morale || 0);
      }
      const before = d.unrest;
      try { R.lanista(d); } catch(x){ break; }
      /* ---- WHAT THE WEEK ACTUALLY MOVED, AGAINST WHAT THE DRIFT SAID ----
         Only on weeks the CLAMP did not bite. `d.unrest` is clamped to [0,100], so on a calm house
         a drift of -1 moves it by 0 and the residual reads +1 — the first cut of this arm reported
         "events" adding a point a week in eras 0, 1 and 3, which was the floor and not an event.
         A week is counted here only if the modelled drift lands strictly inside the range. */
      const moved = d.unrest - was; was = d.unrest;
      const lands = before + modelled;
      E.drift += modelled;
      if(lands > 0.5 && lands < 99.5){ E.clean++; E.event += moved - modelled; }
    }
    const k = d.over ? d.over.kind : "survived";
    ends[k] = (ends[k] || 0) + 1;
  }

  /* ---- 3, the counterfactual: same seeds, four policies ---- */
  const POLICY = {
    reference: {},
    free:      { free:true },
    freeRites: { free:true, rites:true, works:true },
    boughtCalm:{ free:true, rites:true, works:true, BUY:true },
    /* arm 2 says the driver is morale, not the unfreed veteran — so a policy that spends on the
       men every week it can: the feast, the walk, and a doctore of its own */
    keptSweet: { KEEP:true },
    everything:{ free:true, rites:true, works:true, BUY:true, KEEP:true },
  };
  const arms = {};
  for(const [name, o] of Object.entries(POLICY)){
    const a = arms[name] = { ends:{}, unrest:[[],[],[],[]], weeks:0, freed:0, bought:0, feasts:0, walked:0,
      spent:0, gold:[[],[],[],[]] };
    for(let h=0; h<H; h++){
      const d = A.newGameState("Cw"+h, "clean", `${SEED}-${h}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        a.unrest[ERA(d.week)].push(Math.round(d.unrest));
        a.gold[ERA(d.week)].push(Math.round(d.gold));
        /* the levers the rope has no option for, pulled by hand and PAID FOR */
        if(o.KEEP){
          /* the three things a lanista can do for the men, taken whenever they are available —
             and what each one COSTS, because that turns out to be the whole of #247b */
          if(typeof A.walkTheCells === "function"){ try { if(A.walkTheCells(d)) a.walked++; } catch(x){} }
          if(typeof A.throwFeast === "function" && d.gold > 300){
            const was = d.gold;
            try { if(A.throwFeast(d)){ a.feasts++; a.spent += (was - d.gold); } } catch(x){}
          }
          if(!d.doctore && typeof A.hireDoctore === "function"){
            const mkt = (d.doctoreMarket || []).filter(c=>c && d.gold > (c.wage || 0) * 30);
            if(mkt.length){ try { if(A.hireDoctore(d, mkt[0].id)) a.bought++; } catch(x){} }
          }
        }
        if(o.BUY){
          if(!d.doctore && typeof A.hireDoctore === "function"){
            const mkt = (d.doctoreMarket || []).filter(c=>c && d.gold > (c.wage || 0) * 30);
            if(mkt.length && (()=>{ try { return A.hireDoctore(d, mkt[0].id); } catch(x){ return false; } })()) a.bought++;
          }
          if(d.unrest >= 26 && typeof A.throwFeast === "function" && d.gold > 400){
            try { A.throwFeast(d); } catch(x){}
          }
        }
        let did = null; try { did = R.lanista(d, o); } catch(x){ break; }
        if(did && did.freed) a.freed += did.freed;
        a.weeks++;
      }
      const k = d.over ? d.over.kind : "survived";
      a.ends[k] = (a.ends[k] || 0) + 1;
    }
  }
  return { era, ends, arms, houses:H, weeks:W };
}, [H, W, SEED]);
await browser.close(); server.close();
if(out.why){ console.log(out.why); process.exit(1); }

const q = a => { if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y);
  return { p50:s[Math.floor(.5*s.length)], p90:s[Math.floor(.9*s.length)], max:s[s.length-1] }; };
const P = (s, w) => String(s).padEnd(w), N = (v, w) => String(v == null ? "—" : v).padStart(w);
const f2 = v => (v >= 0 ? "+" : "") + v.toFixed(2);

console.log(`\nTHE RISING — ${out.houses} houses x ${out.weeks} weeks, seed ${SEED}`);
console.log(`the reference player ends: ` + Object.entries(out.ends).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · "));

console.log(`\n1 · WHERE THE UNREST COMES FROM — the weekly drift's own terms, per era, per week`);
const TK = ["defiance","base","doctore","cells","auctors","perk","lanista","collegium","season"];
console.log(`  ${P("era", 5)}${P("unrest p50", 12)}` + TK.map(k=>P(k, 10).slice(0,10)).join("") + P("= drift", 9) + P("events", 8));
out.era.forEach((E, i)=>{
  if(!E.n) return;
  const per = k => E.terms[k] / E.n;
  console.log(`  ${P(i, 5)}${N(q(E.unrest) && q(E.unrest).p50, 6)}      `
    + TK.map(k=>P(f2(per(k)), 10)).join("")
    + P(f2(E.drift / E.n), 9) + P(E.clean ? f2(E.event / E.clean) : "—", 8));
});
console.log(`  ("drift" is the line in endWeek; "events" is everything else that touched unrest, over the`);
console.log(`   ` + out.era.map(E=>E.clean).join("/") + ` weeks per era where the clamp at 0 and 100 did not bite)`);

console.log(`\n2 · AND WHAT DRIVES THE DRIVER — the bound men, per era`);
console.log(`  ${P("era", 5)}${P("men", 7)}${P("mean defiance", 15)}${P("mean morale", 13)}${P("under 40", 10)}${P("Defiant", 10)}${P("earned the rudis", 18)}`);
out.era.forEach((E, i)=>{
  if(!E.n) return;
  const pct = v => `${(100 * v / (E.men || 1)).toFixed(1)}%`;
  console.log(`  ${P(i, 5)}${N((E.men / E.n).toFixed(1), 5)}  ${N((E.def / E.n).toFixed(1), 12)}   `
    + P((E.morale / (E.men || 1)).toFixed(1), 13) + P(pct(E.lowMorale), 10) + P(pct(E.defiant), 10) + P(pct(E.rudis), 18));
});

console.log(`\n3 · THE COUNTERFACTUAL — the same ${out.houses} seeds under four policies`);
for(const [name, a] of Object.entries(out.arms)){
  const u = a.unrest.map(x=>q(x) ? q(x).p50 : "—").join(" / ");
  const g = a.gold.map(x=>q(x) ? q(x).p50 : "—").join(" / ");
  console.log(`  ${P(name, 12)} ${P(Object.entries(a.ends).sort((x,y)=>y[1]-x[1]).map(([k,n])=>`${k} ${n}`).join(" · "), 52)}`
    + `  unrest p50 by era ${u}  ${a.freed ? `freed ${a.freed}` : ""}${a.bought ? ` · doctores ${a.bought}` : ""}`
    + `${a.feasts ? ` · feasts ${a.feasts}` : ""}${a.walked ? ` · walks ${a.walked}` : ""}`);
  console.log(`  ${P("", 12)} ${P("", 52)}  gold   p50 by era ${g}`
    + (a.spent ? `  spent ${Math.round(a.spent)}d on feasts (${Math.round(a.spent/(a.weeks||1))}d a week)` : ""));
}
const reb = n => out.arms[n].ends.rebellion || 0;
console.log(`\n  the cells took ${reb("reference")} under the reference player, ${reb("free")} when every man who `
  + `earned the rudis got it, ${reb("freeRites")} with the rites and the stone as well, and ${reb("boughtCalm")} `
  + `with the calm bought outright.`);
console.log(`\nJSON ${JSON.stringify({ ends: out.ends, arms: Object.fromEntries(Object.entries(out.arms).map(([k,a])=>[k, a.ends])) })}`);
