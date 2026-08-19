/* WHAT THE STREET MAKES OF YOU, AND WHETHER ANY OF IT IS STEERABLE — #165

   #165 said acclaim "is computed every week and shown to nobody", citing `near`'s own printed line:
   "acclaimTarget reads 14.0 against acclaim 0.0 — a rate read by acclaimWeek, shown to nobody".

   ITS FALSIFICATION IS HALF-SATISFIED BEFORE ANY MEASUREMENT, by reading the screen. The villa
   carries a whole section — "The house as a name" — with a bar, the tier's name, the number out of a
   hundred, the tier's blurb, the graffiti wall and the potters' cut; the summary strip carries
   `acclaimWord`; and the armoury names the master's gate in points ("N more points of acclaim and
   the masters will take your commissions"). So the LEVEL is on screen and the item's headline is
   wrong as written. What is not on screen anywhere is `acclaimTarget` — the six-term number
   `acclaimWeek` converges toward at 10% a week up and 3% down — so a player can read where he is
   and has nothing at all to tell him where he is going or what moves it.

   Which makes the real question the one the item's clause implies rather than states: is this a
   system a player can steer, or a number that walks to a ceiling and stays? `acclaimTarget`'s own
   comment records that being asked twice before — the v2.46 audit found every house past week 150
   at 90-100, and the consolidation pass found the first fix changed nothing (eight houses past week
   250 still at 98-100) because `top3` was unbounded and the primacy term read a RIVAL's title. The
   comment's closing claim is testable and has never been tested by anything in the suite:

       "a calm great house lands in the seventies, a house holding the primacy in a show streak
        still clears 92, and the last rung lapses when the heat goes"

   ARM A takes it. ARM B asks what the number buys, since four gates hang off it. ARM C drives the
   six dark readouts the item lists that are not acclaim at all.

   INSTRUMENT NOTES:
   · the trajectory is sampled every week, not at the end. "Where houses END" and "where houses LIVE"
     are different questions and only the second one is about a six-tier ladder.
   · a GRANTED arm holds the ledger up, because "does the street love a house" and "does a house
     survive" are different questions and only the pair separates them.
   · three seed prefixes. Two findings on this project died for being read off 24 houses.
   · every term of `acclaimTarget` is recomputed here from the game's own handle where it can be, and
     where it cannot the raw is printed beside the total so a term that stopped moving is visible.
     The six are printed SUMMED against the function's own answer on every row, and they matched to
     the decimal on all sixty houses, which is what says the reconstruction is the same arithmetic.

   WHAT IT FOUND, 30 houses x 420w on three seed prefixes:

     THE ITEM'S HEADLINE IS HALF WRONG. The level was always on screen. The TARGET was not, and the
     prose above the bar named three of the six terms.

     THE TOP OF THE LADDER IS EMPTY. Weeks in each rung, played: 29.8% / 35.6% / 26.3% / 8.3% and
     NOUGHT in the last two. With the ledger held up so the house cannot go broke — the upper bound
     on every purchasing policy — 97 weeks of 10,387 in the fifth rung and 3 in the sixth. Two of the
     six rungs are unreached content, and each carries a `once` chronicle line written for it.

     AND WHY. The terms at each house's best week, played then granted:
         the men       32.0 / 46.0   ceiling 46, and capped for two houses in three
         the styles     5.5 /  7.2   ceiling 22
         freed legends  0.0 /  0.7   ceiling 12 — nought in every one of the thirty played houses
         the primacy    1.4 / 12.1   ceiling 14
         the fame spill 10.4 / 14.0  ceiling 14, capped for anyone past fame 234
         the walls      3.0 /  5.7   ceiling 9
     Sixty of the hundred and seventeen points arrive for nothing, and the two a player could chase
     pay a quarter and a sixteenth of their face.

   THREE INSTRUMENT FAULTS IN ARM B, ALL THE SAME SHAPE — a subject that never moved:
   · `primusMine` reads `d.primus.mine`, not the house name. The first draft set a primus with the
     right house on it and read +0.0 for a term worth 14.
   · the base state carried fame 3000, so the fame-spill trial measured nothing against a base that
     already had it. The base is fame 0 now and the spill has two rows.
   · `workDone` reads `w.left <= 0`, not a `done` flag, so ARM C read `monuReady` false with every
     work finished. All three were caught by the value being suspiciously round. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "STREET";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;

  /* ============ ARM A: WHERE A PLAYED HOUSE LIVES ON THE LADDER ============ */
  const arms = [];
  for(const grant of [0, 200000]){
    const houses = [];
    for(const pre of [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`]){
      for(let h=0; h<H; h++){
        const d = A.newGameState("St"+h, "clean", `${pre}-${h}`, null);
        /* weeks spent in each tier, and the target beside the level every week */
        const tierWk = new Array(A.ACCLAIM_TIERS.length).fill(0);
        const samples = [], gates = { master:0, merch:0, street:0 };
        let merchCoin = 0, peak = 0, peakTgt = 0, firstMerch = null, firstMaster = null;
        let bestT = { t:-1 };
        for(let w=0; w<W; w++){
          if(d.over) break;
          if(grant) d.gold = Math.max(d.gold, grant);
          R.lanista(d);
          if(!d.lanista) break;
          const a = A.acclaimOf(d), t = A.acclaimTarget(d);
          tierWk[A.acclaimIdx(d)]++;
          peak = Math.max(peak, a); peakTgt = Math.max(peakTgt, t);
          if(A.masterOpen(d)){ gates.master++; if(firstMaster==null) firstMaster = d.week; }
          if(A.merchLive(d)){ gates.merch++; if(firstMerch==null) firstMerch = d.week; }
          if(A.streetVoice(d) > 0) gates.street++;
          if(w % 20 === 0) samples.push({ w:d.week, a:+a.toFixed(1), t:+t.toFixed(1) });
          /* the six terms at the house's best week, so "why is it there" has an answer with figures.
             Recomputed from the same state `acclaimTarget` reads, and the six are printed summed
             beside the function's own answer so a term I have copied wrong shows as a mismatch. */
          if(t >= bestT.t){
            const men = A.activeG(d).map(g=>g.pfame||0).sort((x,y)=>y-x);
            const top3 = (men[0]||0)*0.5 + (men[1]||0)*0.28 + (men[2]||0)*0.16;
            bestT = { t, wk:d.week,
              men:Math.min(46, top3*0.5),
              show:A.repShare(d,"show")*22 + A.repShare(d,"blood")*10,
              legends:Math.min(12, (d.freed||[]).filter(f=>(f.wins||0)>=10).length * 4),
              primus:A.primusMine && A.primusMine(d) ? 14 : (d.primus && d.primus.mine ? 14 : 0),
              spill:Math.min(14, (d.fame||0)*0.06),
              graff:Math.min(9, A.activeG(d).filter(g=>g.graffiti).length * 3) };
          }
        }
        merchCoin = (d.brand && d.brand.earned) || 0;
        houses.push({ pre, h, end:d.week, over:d.over?d.over.kind:"alive",
          acclaim:+A.acclaimOf(d).toFixed(1), target:+A.acclaimTarget(d).toFixed(1),
          idx:A.acclaimIdx(d), word:A.acclaimWord(A.acclaimOf(d)),
          peak:+peak.toFixed(1), peakTgt:+peakTgt.toFixed(1),
          tierWk, gates, merchCoin, firstMerch, firstMaster,
          primus:!!d.primus, fame:Math.round(d.fame||0), samples,
          streetV:+A.streetVoice(d).toFixed(2), crowd:A.acclaimCrowd(d),
          licensed:!!(d.brand && d.brand.licensed), decided:!!(d.brand && d.brand.decided),
          graff:A.activeG(d).filter(g=>g.graffiti).length, bestT });
      }
    }
    arms.push({ grant, houses });
  }

  /* ============ ARM B: WHAT THE SIX TERMS ARE WORTH, AND WHAT THE NUMBER BUYS ============
     `acclaimTarget` is six terms and the panel names three of them in prose. Each is priced here at
     the top of its own range, off the game's own state, so the player-facing question — "what should
     I actually do to move this" — has an answer with figures behind it. */
  const terms = (()=>{
    const d = A.newGameState("Sb","clean",`${SEED}-terms`,null);
    d.fame = 0;
    const base = A.acclaimTarget(d);
    const out = [];
    const trial = (nm, fn) => { const q = A.clone(d); fn(q); out.push({ nm, v:+A.acclaimTarget(q).toFixed(1) }); };
    trial("nothing at all", ()=>{});
    trial("one man at pfame 120", q=>{ const g = A.activeG(q)[0]; if(g) g.pfame = 120; });
    trial("three men at pfame 120", q=>{ A.activeG(q).slice(0,3).forEach(g=>g.pfame = 120); });
    trial("three men at pfame 400", q=>{ A.activeG(q).slice(0,3).forEach(g=>g.pfame = 400); });
    trial("all show in the ledger", q=>{ q.rep = { blood:0, show:100, craft:0, mercy:0 }; });
    trial("all blood in the ledger", q=>{ q.rep = { blood:100, show:0, craft:0, mercy:0 }; });
    /* `primusMine` reads `d.primus.mine`, not the house name — the first draft set a primus with the
       right house on it and read +0.0, a subject that never moved. And the base state already carried
       fame 3000, so the spill trial was measuring nothing; the base is fame 0 now and the spill has a
       row of its own. */
    trial("the primacy, yours", q=>{ q.primus = { mine:true, gid:(A.activeG(q)[0]||{}).id, week:q.week }; });
    trial("the primacy, a rival's", q=>{ q.primus = { mine:false, house:"another", week:q.week }; });
    trial("fame 300", q=>{ q.fame = 300; });
    trial("fame 3000 (the spill, capped)", q=>{ q.fame = 3000; });
    trial("three men on the walls", q=>{ A.activeG(q).slice(0,3).forEach(g=>g.graffiti = { line:"x", week:1 }); });
    return { base:+base.toFixed(1), out };
  })();

  /* what the number buys, priced off the game's own functions across the scale */
  const buys = [];
  for(const a of [0, 20, 32, 40, 62, 82, 92, 100]){
    const d = A.newGameState("Sc","clean",`${SEED}-buy-${a}`,null);
    d.acclaim = a; d.buildings = { ...(d.buildings||{}), armamentarium:2 };
    const top = A.activeG(d).reduce((m,g)=>Math.max(m, g.pfame||0), 0);
    buys.push({ a, tier:A.acclaimTier(d).name, word:A.acclaimWord(a),
      master:A.masterOpen(d), merch:A.merchLive(d), merchWk:A.merchWeekly(d),
      street:+A.streetVoice(d).toFixed(2), crowd:A.acclaimCrowd(d), topPfame:top });
  }

  /* ============ ARM C: THE SIX ON THE ITEM'S LIST THAT ARE NOT ACCLAIM ============ */
  const dark = (()=>{
    const o = {};
    { const d = A.newGameState("Sd","clean",`${SEED}-fans`,null);
      const g = A.activeG(d)[0];
      const rows = [];
      for(const v of [null, 0, 20, 55, 80, 100, 140]){
        if(v === null) delete g.fans; else g.fans = v;
        rows.push({ set:v, fans:A.fansOf(g), fav:A.isFavourite(g), purse:+A.fanPurse(g).toFixed(3) });
      }
      o.fans = rows; }
    { const d = A.newGameState("Se","clean",`${SEED}-piety`,null);
      const rows = [];
      for(const f of [0, 500, 2000, 20000]){ d.fame = f;
        rows.push({ fame:f, capped:A.pietyFame(d), cost:A.GODS.mars.cost(d) }); }
      o.piety = { rows, top:A.PIETY_TOP }; }
    { const d = A.newGameState("Sf","clean",`${SEED}-bur`,null);
      d.week = 100; d.fallen = [{week:99},{week:85},{week:81},{week:79},{week:40}];
      o.buried = { in20:A.buried20(d), of:d.fallen.length,
        edge:(()=>{ const q = A.clone(d); q.fallen = [{week:80}]; return A.buried20(q); })(),
        past:(()=>{ const q = A.clone(d); q.fallen = [{week:79}]; return A.buried20(q); })() }; }
    { const d = A.newGameState("Sg","clean",`${SEED}-mon`,null);
      const before = A.monuReady(d);
      /* `workDone` reads `w.left <= 0`, not a `done` flag — the first draft set `{done:true}` and read
         `monuReady` false with every work finished, which is a control that never moved */
      d.works = {}; for(const k of A.WORK_KEYS) d.works[k] = { left:0, week:1 };
      o.monu = { before, after:A.monuReady(d), keys:A.WORK_KEYS.length, all:A.ALL_WORK_KEYS.length }; }
    { const d = A.newGameState("Sh","clean",`${SEED}-lic`,null);
      const shut = A.openLicenceNow(d);
      d.acclaim = 70; d.brand = { licensed:false, decided:false, tier:3, earned:0 };
      const open = A.openLicenceNow(d);
      const ev = d.pendingEvent ? d.pendingEvent.id : null;
      o.lic = { shut, open, ev, decided:d.brand.decided }; }
    { const d = A.newGameState("Si","clean",`${SEED}-tour`,null);
      const shut = A.tourneyReady(d);
      d.fame = 3000; d.gold = 60000; d.week = 120;
      while(A.activeG(d).length < 6) d.gladiators.push(A.genGladiator(d, 70));
      const ready = A.tourneyReady(d);
      const g0 = d.gold, before = (d.log||[]).length;
      const men0 = A.activeG(d).map(g=>({ id:g.id, pf:g.pfame||0, fans:g.fans||0, mor:g.morale||0 }));
      const unrest0 = d.unrest;
      const did = A.holdTourney(d);
      const moved = A.activeG(d).filter(g=>{ const w = men0.find(x=>x.id===g.id);
        return w && ((g.pfame||0) > w.pf || (g.fans||0) > w.fans || (g.morale||0) > w.mor); });
      o.tour = { shut, ready, did:did ? did.win : null, spent:Math.round(g0 - d.gold),
        logGrew:(d.log||[]).length - before, moved:moved.length, of:men0.length,
        unrest:+(unrest0 - d.unrest).toFixed(1) }; }
    return o;
  })();

  return { arms, terms, buys, dark };
}, [H, W, SEED]);

const f1 = x => x==null ? "—" : (+x).toFixed(1);
const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : null; };

for(const arm of out.arms){
  const HS = arm.houses;
  console.log(`\n  ARM A — ${HS.length} houses x ${W}w${arm.grant ? ", the ledger held up" : ", as the rope plays"}\n`);
  const wk = new Array(out.arms[0].houses[0].tierWk.length).fill(0);
  let tot = 0;
  for(const h of HS) h.tierWk.forEach((v,i)=>{ wk[i]+=v; tot+=v; });
  console.log(`  where the house LIVES, weeks in each rung of the six:`);
  const NAMES = ["unknown to the street","known in the wine-shops","names on the walls","figures on the shelves","a name the whole city plays at","the street's own house"];
  wk.forEach((v,i)=>console.log(`    ${String(i)} ${NAMES[i].padEnd(32)} ${String(v).padStart(6)} weeks  ${tot?((v/tot*100).toFixed(1)+"%").padStart(6):""}`));
  console.log(`  where the house ENDS: acclaim median ${f1(med(HS.map(h=>h.acclaim)))} · peak median ${f1(med(HS.map(h=>h.peak)))} · target at the end median ${f1(med(HS.map(h=>h.target)))}`);
  console.log(`  the gates: master's bench open ${HS.filter(h=>h.gates.master>0).length} of ${HS.length} houses (first at week ${med(HS.map(h=>h.firstMaster))||"—"})`
    + ` · the potters ${HS.filter(h=>h.gates.merch>0).length} (week ${med(HS.map(h=>h.firstMerch))||"—"})`
    + ` · the street's voice ${HS.filter(h=>h.gates.street>0).length}`);
  console.log(`  the potters paid, over a run: median ${med(HS.map(h=>h.merchCoin))}d · most ${Math.max(...HS.map(h=>h.merchCoin))}d`);
  console.log(`  licence decided in ${HS.filter(h=>h.decided).length} houses, licensed wide in ${HS.filter(h=>h.licensed).length}`);
  console.log(`\n  raw:`);
  console.log(`    seed        ended  ending       acclaim  target  peak   rung  the word                    merch     graffiti`);
  for(const h of HS)
    console.log(`    ${h.pre.padEnd(11)} ${String(h.end).padStart(5)}  ${String(h.over).padEnd(11)} ${f1(h.acclaim).padStart(7)}  ${f1(h.target).padStart(6)}  ${f1(h.peak).padStart(5)}  ${String(h.idx).padStart(4)}   ${h.word.padEnd(26)} ${String(h.merchCoin).padStart(7)}d ${String(h.graff).padStart(8)}`);
  console.log(`\n  and WHY the target sits where it does, the six terms at each house's best week (summed against the function's own answer):`);
  console.log(`    seed        week   the men   the show   freed   primacy   the spill   the walls    sum   acclaimTarget said`);
  for(const h of HS){ const b = h.bestT; if(!b || b.t < 0) continue;
    const sum = b.men + b.show + b.legends + b.primus + b.spill + b.graff;
    console.log(`    ${h.pre.padEnd(11)} ${String(b.wk).padStart(4)}   ${f1(b.men).padStart(7)}   ${f1(b.show).padStart(8)}   ${f1(b.legends).padStart(5)}   ${f1(b.primus).padStart(7)}   ${f1(b.spill).padStart(9)}   ${f1(b.graff).padStart(9)}   ${f1(Math.min(100,sum)).padStart(4)}   ${f1(b.t).padStart(17)}`); }
  { const bs = HS.map(h=>h.bestT).filter(b=>b && b.t>=0);
    if(bs.length){
      const m = k => f1(bs.reduce((s,b)=>s+b[k],0)/bs.length);
      console.log(`    ${"MEAN".padEnd(11)} ${"".padStart(4)}   ${m("men").padStart(7)}   ${m("show").padStart(8)}   ${m("legends").padStart(5)}   ${m("primus").padStart(7)}   ${m("spill").padStart(9)}   ${m("graff").padStart(9)}`);
      console.log(`    the ceiling on each term:            46.0       22.0    12.0      14.0        14.0         9.0   = 117 before the clamp`);
    } }
  const one = HS.find(h=>h.samples.length > 6) || HS[0];
  console.log(`\n  and one trajectory in full (${one.pre} h${one.h}), the level against the target it is walking to:`);
  console.log(`    ` + one.samples.map(s=>`w${s.w} ${s.a}/${s.t}`).join(" · "));
}

console.log(`\n  ARM B — what each term of \`acclaimTarget\` is worth, one at a time, off a founding house (base ${out.terms.base})\n`);
for(const t of out.terms.out)
  console.log(`    ${t.nm.padEnd(28)} target ${f1(t.v).padStart(6)}   ${t.v > out.terms.base ? "+"+(t.v-out.terms.base).toFixed(1) : "—"}`);

console.log(`\n  and what the number buys, across the scale:\n`);
console.log(`  acclaim   the rung                          the word              master's bench   potters   a week   the street's say   crowd`);
for(const b of out.buys)
  console.log(`  ${String(b.a).padStart(7)}   ${b.tier.padEnd(32)}  ${b.word.padEnd(20)}  ${String(b.master).padEnd(14)}   ${String(b.merch).padEnd(7)}   ${String(b.merchWk).padStart(6)}d   ${String(b.street).padStart(16)}   ${String(b.crowd).padStart(5)}`);

console.log(`\n  ARM C — the six on the item's list that are not acclaim at all\n`);
console.log(`    fansOf / isFavourite / fanPurse:`);
for(const r of out.dark.fans) console.log(`      set ${String(r.set).padStart(5)} → fans ${String(r.fans).padStart(3)} · favourite ${String(r.fav).padEnd(5)} · purse x${r.purse}`);
console.log(`    pietyFame (capped at PIETY_TOP ${out.dark.piety.top}) and what Mars costs:`);
for(const r of out.dark.piety.rows) console.log(`      fame ${String(r.fame).padStart(6)} → counts ${String(r.capped).padStart(5)} · Mars asks ${r.cost}d`);
console.log(`    buried20: ${out.dark.buried.in20} of ${out.dark.buried.of} fell inside twenty weeks · at exactly 20 weeks back: ${out.dark.buried.edge} · at 21: ${out.dark.buried.past}`);
console.log(`    monuReady: ${out.dark.monu.before} on a founding house, ${out.dark.monu.after} with all ${out.dark.monu.keys} works done — the pool goes ${out.dark.monu.keys} → ${out.dark.monu.all}`);
console.log(`    openLicenceNow: shut on a founding house (${out.dark.lic.shut}), opens at acclaim 70 (${out.dark.lic.open}) raising "${out.dark.lic.ev}"`);
console.log(`    holdTourney: shut on a founding house (${out.dark.tour.shut}), ready for a great one (${out.dark.tour.ready}) · `
  + `it crowned ${out.dark.tour.did || "nobody"} · ${out.dark.tour.spent}d spent · ${out.dark.tour.moved} of ${out.dark.tour.of} men moved · unrest ${out.dark.tour.unrest>0?"-":"+"}${Math.abs(out.dark.tour.unrest)} · ${out.dark.tour.logGrew} lines written`);

await browser.close(); server.close();
