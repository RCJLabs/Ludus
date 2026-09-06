/* A THIN HOUSE, AND WHY IT BUYS NOBODY — #247c, the measurement before anything moves.

   (Named `thin`, not `yard`: `probes/yard.mjs` is taken, by the instrument keep.mjs's seam turned
   into — which asks a neighbouring question and is where the arrival/exit counting rules here came
   from. This file overwrote it once; `git status` saying MODIFIED rather than new was the tell.)

   v3.207.0: `ruin` — the house that cannot field a man and cannot buy one — took 11 of 88 seeded
   houses at a median week of 262 and 296, and it is the third shape, not a rounding error. Its
   approach is its own: roster p50 at forty, twenty, ten, five and one week before the end runs
   5 · 5 · 2 · 2 · 1 -> 0 (set A) and 2 · 5 · 2 · 2 · 1 -> 0 (set B), with gold 5,426 -> 100 on both.
   Its last words are its own too: "The cells are empty" on 5 of 7 deaths, and "The bench where he
   sat is empty and nobody has moved along to fill it" on 5 of 7.

   So: men leave faster than they are replaced. The question is WHY THE REPLACING STOPS, and #247b's
   lesson applies before a single constant is touched — the reference player holds a twelve-week
   reserve (`LAN.reserve`) and will only buy a man at half of what is left over it. A thin, poor
   house therefore never buys, and "the game gives no way to refill the yard" and "this policy will
   not spend" look identical from the outside.

     1 · THE FLOW. Men in and men out, by cause, per era, split by how the house ended. `GONE` names
         the six ways out — dead, freed, escaped, retired, departed, sold — and the ways in are the
         block, the slaver at the gate, and the odd gift.

     2 · WHY THE REPLACING STOPS. Every week the house is thin (fewer uninjured actives than the
         policy keeps), the reason it bought nobody, from the state:
           empty      nothing on the block at all
           full       the cells are full — it is not thin for want of buying
           policy     it could afford the cheapest man outright but not under the reserve rule
           broke      it could not afford the cheapest man at any reserve
         `policy` against `broke` is the whole question. One is the rope, the other is the game.

     3 · AND CAN IT BE ANSWERED? The same seeds under four buying policies: the reference player;
         one that keeps six rather than five; one that spends to the last denarius when thin; and
         one that does that AND takes the cheapest man rather than the dearest it can afford.

     node test/probes/yard.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 24), W = +(process.argv[3] || 420), SEED = process.argv[4] || "YARD";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG","GONE","isGone","rosterFull","buyFromBlock","weeklyBill",
                "onTheBooks"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
  const ERA = w => Math.min(3, Math.floor((w - 1) / (W / 4)));
  const KEEP = 5;                       /* the rope's own figure, so the reasons match its gate */
  /* the rope's own rule is `max(700, (weeklyBill + works draws) * 12)`; the draws term is omitted
     here, which makes this reserve SMALLER and the "policy" count below a slight underestimate of
     what the rope actually refuses — conservative in the direction that matters */
  const RESERVE = d => Math.max(700, A.weeklyBill(d) * 12);

  /* ---- 1 and 2, on the reference player ---- */
  const flow = [0,1,2,3].map(()=>({ out:{}, in:0, weeks:0, roster:0 }));
  const why = [0,1,2,3].map(()=>({ thin:0, empty:0, full:0, policy:0, broke:0,
    men:0, hurt:0, away:0, cap:0, infirmary:0, fullMen:0, fullHurt:0, fullAway:0, fullAct:0, fullCap:0,
    lawCap:0, lawCapSum:0 }));
  const ends = {}, byEnd = {};
  for(let h=0; h<H; h++){
    const d = A.newGameState("Yd"+h, "clean", `${SEED}-${h}`);
    let seen = new Set(d.gladiators.map(g=>g.id));
    const mine = { out:{}, in:0 };
    const mineWhy = { thin:0, empty:0, full:0, policy:0, broke:0 };
    for(let w=0; w<W; w++){
      if(d.over) break;
      const e = ERA(d.week), F = flow[e], Y = why[e];
      const act = A.activeG(d);
      F.weeks++; F.roster += act.length;
      /* 2 — thin, and why nobody was bought */
      const fit = act.filter(g=>!g.injury).length;
      if(fit < KEEP){
        Y.thin++; mineWhy.thin++;
        const block = (d.market || []).filter(x=>x && x.price != null);
        const cheapest = block.length ? Math.min(...block.map(x=>x.price)) : null;
        const spare = d.gold - RESERVE(d);
        /* ---- BY STATUS, because `activeG` is not the roster ----
           `rosterFull` counts `rosterCount`, which is every man not GONE; `activeG` is only those
           whose status is "active". A man in the infirmary or away at a noble's villa is on the
           books and not in the yard. The first cut of this counted `act.filter(g=>g.injury)` and
           read 5% hurt on weeks the cells were full — which was 5% of the wrong denominator. */
        const books = d.gladiators.filter(g=>!A.isGone(g));
        const byStat = {}; for(const g of books) byStat[g.status] = (byStat[g.status] || 0) + 1;
        Y.men += books.length; Y.hurt += (byStat.injured || 0); Y.away += (byStat.away || 0);
        Y.cap += (A.cellsCap ? A.cellsCap(d) : 8);
        /* only where an edict has actually bitten: `law.cap` defaults to 99, and averaging that in
           produced a "mean cap of 36.7 men" in the first cut, which is not a number about anything */
        const lc = (d.law && d.law.cap != null) ? d.law.cap : 99;
        if(lc < 8){ Y.lawCap++; Y.lawCapSum += lc; }
        if(A.bLevel && A.bLevel(d, "valetudinarium") > 0) Y.infirmary++;
        if(A.rosterFull(d)) mineWhy.full++;
        else if(!block.length) mineWhy.empty++;
        else if(d.gold < cheapest) mineWhy.broke++;
        else if(cheapest > spare * 0.5) mineWhy.policy++;
        if(A.rosterFull(d)){ Y.full++; Y.fullMen += books.length;
          Y.fullHurt += (byStat.injured || 0); Y.fullAway += (byStat.away || 0);
          Y.fullAct += (byStat.active || 0); Y.fullCap += (A.cellsCap ? A.cellsCap(d) : 8); }
        else if(!block.length) Y.empty++;
        else if(d.gold < cheapest) Y.broke++;
        else if(cheapest > spare * 0.5) Y.policy++;
        /* anything else: it could and did buy, or the gate passed — not a refusal */
      }
      try { R.lanista(d); } catch(x){ break; }
      /* 1 — who left, and who arrived */
      for(const g of d.gladiators){
        if(!seen.has(g.id)){ seen.add(g.id); if(!A.isGone(g)){ flow[e].in++; mine.in++; } }
      }
      for(const g of d.gladiators){
        if(A.isGone(g) && !g._counted){ g._counted = 1;
          flow[e].out[g.status] = (flow[e].out[g.status] || 0) + 1;
          mine.out[g.status] = (mine.out[g.status] || 0) + 1; }
      }
    }
    const k = d.over ? d.over.kind : "survived";
    ends[k] = (ends[k] || 0) + 1;
    const b = byEnd[k] = byEnd[k] || { n:0, in:0, out:{}, why:{ thin:0, empty:0, full:0, policy:0, broke:0 } };
    b.n++; b.in += mine.in;
    for(const r of Object.keys(b.why)) b.why[r] += mineWhy[r];
    for(const s of Object.keys(mine.out)) b.out[s] = (b.out[s] || 0) + mine.out[s];
  }

  /* ---- 3, the counterfactual ---- */
  const POLICY = {
    reference: { rope:{} },
    keepSix:   { rope:{ keep:6 } },
    spendAll:  { rope:{ buy:false }, MINE:{ keep:5, all:true, cheap:false } },
    cheapest:  { rope:{ buy:false }, MINE:{ keep:5, all:true, cheap:true } },
  };
  const arms = {};
  for(const [name, P] of Object.entries(POLICY)){
    const a = arms[name] = { ends:{}, roster:[[],[],[],[]], bought:0, spent:0, weeks:0 };
    for(let h=0; h<H; h++){
      const d = A.newGameState("Yd"+h, "clean", `${SEED}-${h}`);
      for(let w=0; w<W; w++){
        if(d.over) break;
        a.roster[ERA(d.week)].push(A.activeG(d).length);
        if(P.MINE){
          const fit = A.activeG(d).filter(g=>!g.injury).length;
          if(fit < P.MINE.keep && !A.rosterFull(d)){
            const block = (d.market || []).filter(x=>x && x.price != null && x.price <= d.gold);
            if(block.length){
              const pick = P.MINE.cheap
                ? block.reduce((m,x)=>x.price < m.price ? x : m, block[0])
                : block.reduce((m,x)=>x.price > m.price ? x : m, block[0]);
              const was = d.gold;
              try { if(A.buyFromBlock(d, pick.id, null)){ a.bought++; a.spent += was - d.gold; } } catch(x){}
            }
          }
        }
        try { R.lanista(d, P.rope); } catch(x){ break; }
        a.weeks++;
      }
      const k = d.over ? d.over.kind : "survived";
      a.ends[k] = (a.ends[k] || 0) + 1;
    }
  }
  return { flow, why, ends, byEnd, arms, houses:H, weeks:W, keep:KEEP };
}, [H, W, SEED]);
await browser.close(); server.close();
if(out.why2 || out.why && typeof out.why === "string"){ console.log(out.why); process.exit(1); }

const q = a => { if(!a.length) return null; const s = a.slice().sort((x,y)=>x-y);
  return { p50:s[Math.floor(.5*s.length)], p90:s[Math.floor(.9*s.length)] }; };
const P = (s, w) => String(s).padEnd(w), N = (v, w) => String(v == null ? "—" : v).padStart(w);
const OUTS = ["dead","sold","freed","escaped","retired","departed"];

console.log(`\nTHE YARD — ${out.houses} houses x ${out.weeks} weeks, seed ${SEED}`);
console.log(`the reference player ends: ` + Object.entries(out.ends).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · "));

console.log(`\n1 · THE FLOW — men in and out, per era, per house`);
console.log(`  ${P("era", 5)}${P("roster", 9)}${P("in", 7)}` + OUTS.map(k=>P(k, 10)).join("") + P("out", 7));
out.flow.forEach((F, i)=>{
  if(!F.weeks) return;
  const tot = OUTS.reduce((n,k)=>n + (F.out[k]||0), 0);
  console.log(`  ${P(i, 5)}${N((F.roster/F.weeks).toFixed(1), 6)}   ${N(F.in, 5)}  `
    + OUTS.map(k=>N(F.out[k]||0, 10)).join("") + N(tot, 7));
});
console.log(`\n  and by how the house ended, per house:`);
for(const [k, b] of Object.entries(out.byEnd).sort((a,b)=>b[1].n - a[1].n)){
  const tot = OUTS.reduce((n,x)=>n + (b.out[x]||0), 0);
  const wpc = r => b.why.thin ? `${(100*b.why[r]/b.why.thin).toFixed(0)}%` : "—";
  console.log(`  ${P(k, 11)} ${N(b.n, 2)} houses · in ${N((b.in/b.n).toFixed(1), 5)} · out ${N((tot/b.n).toFixed(1), 5)}`
    + `  (` + OUTS.filter(x=>b.out[x]).map(x=>`${x} ${(b.out[x]/b.n).toFixed(1)}`).join(" · ") + `)`
    + `\n              thin ${N(b.why.thin, 5)}w · full ${wpc("full")} · empty ${wpc("empty")} · policy ${wpc("policy")} · broke ${wpc("broke")}`);
}

console.log(`\n2 · WHY THE REPLACING STOPS — the weeks the house was thin (under ${out.keep} fit men)`);
console.log(`  ${P("era", 5)}${P("thin weeks", 12)}${P("cells full", 12)}${P("block empty", 13)}${P("the POLICY", 12)}${P("truly broke", 12)}`);
out.why.forEach((Y, i)=>{
  if(!Y.thin) return;
  const pc = v => `${(100*v/Y.thin).toFixed(0)}%`;
  console.log(`  ${P(i, 5)}${N(Y.thin, 10)}  ${P(pc(Y.full), 12)}${P(pc(Y.empty), 13)}${P(pc(Y.policy), 12)}${P(pc(Y.broke), 12)}`);
});
{ const T = out.why.reduce((a,Y)=>({ thin:a.thin+Y.thin, full:a.full+Y.full, empty:a.empty+Y.empty,
    policy:a.policy+Y.policy, broke:a.broke+Y.broke }), { thin:0, full:0, empty:0, policy:0, broke:0 });
  console.log(`  ${P("all", 5)}${N(T.thin, 10)}  ${P(`${(100*T.full/T.thin).toFixed(0)}%`, 12)}`
    + `${P(`${(100*T.empty/T.thin).toFixed(0)}%`, 13)}${P(`${(100*T.policy/T.thin).toFixed(0)}%`, 12)}`
    + `${P(`${(100*T.broke/T.thin).toFixed(0)}%`, 12)}`);
  console.log(`  "the POLICY" could have bought the cheapest man outright and the reserve rule stopped it;`);
  console.log(`  "truly broke" could not afford him at any reserve. That split is the whole of #247c.`);
  const M = out.why.reduce((a,Y)=>({ men:a.men+Y.men, hurt:a.hurt+Y.hurt, away:a.away+Y.away,
    cap:a.cap+Y.cap, inf:a.inf+Y.infirmary, fm:a.fm+Y.fullMen, fh:a.fh+Y.fullHurt,
    fa:a.fa+Y.fullAway, fc:a.fc+Y.fullAct, fcap:a.fcap+Y.fullCap, full:a.full+Y.full,
    lc:a.lc+Y.lawCap, lcs:a.lcs+Y.lawCapSum }),
    { men:0, hurt:0, away:0, cap:0, inf:0, fm:0, fh:0, fa:0, fc:0, fcap:0, full:0, lc:0, lcs:0 });
  const per = (v, n) => (v / (n || 1)).toFixed(1);
  console.log(`\n  AND WHAT "CELLS FULL" MEANS — on those ${M.full} weeks, by STATUS and not by activeG:`);
  console.log(`    ${per(M.fm, M.full)} men on the books against a cap of ${per(M.fcap, M.full)} — `
    + `${per(M.fc, M.full)} in the yard, ${per(M.fh, M.full)} in the infirmary, ${per(M.fa, M.full)} away`);
  console.log(`  over all ${T.thin} thin weeks: ${per(M.men, T.thin)} on the books, ${per(M.hurt, T.thin)} hurt, `
    + `${per(M.away, T.thin)} away, cap ${per(M.cap, T.thin)}, an infirmary standing on `
    + `${(100*M.inf/(T.thin||1)).toFixed(0)}% of them`);
  console.log(`  AND THE CAP IS THE LAW'S, not the rank's: \`CELLS_BY_RANK\` starts at EIGHT, so a cap of `
    + `${per(M.fcap, M.full)} is an edict. One bit on ${(100*M.lc/(T.thin||1)).toFixed(0)}% of thin weeks, `
    + `holding the house to a mean of ${(M.lcs/(M.lc||1)).toFixed(1)} men where the reference player keeps 5.`);
}

console.log(`\n3 · CAN IT BE ANSWERED — the same ${out.houses} seeds under four buying policies`);
for(const [name, a] of Object.entries(out.arms)){
  const rs = a.roster.map(x=>q(x) ? q(x).p50 : "—").join(" / ");
  console.log(`  ${P(name, 11)} ${P(Object.entries(a.ends).sort((x,y)=>y[1]-x[1]).map(([k,n])=>`${k} ${n}`).join(" · "), 50)}`
    + `  roster p50 by era ${rs}` + (a.bought ? `  bought ${a.bought} for ${Math.round(a.spent)}d` : ""));
}
const ruinOf = n => out.arms[n].ends.ruin || 0;
console.log(`\n  the yard emptied on ${ruinOf("reference")} houses under the reference player, `
  + `${ruinOf("keepSix")} keeping six, ${ruinOf("spendAll")} spending to the last denarius, and `
  + `${ruinOf("cheapest")} buying the cheapest man instead of the dearest.`);
console.log(`\nJSON ${JSON.stringify({ ends: out.ends, arms: Object.fromEntries(Object.entries(out.arms).map(([k,a])=>[k, a.ends])) })}`);
