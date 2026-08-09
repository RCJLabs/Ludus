/* THE FIRST-YEAR GUIDE, WHICH NOTHING HAD EVER DRIVEN.

   Eleven steps, and the only thing in the game that tells a new lanista what to do next. Its
   shape is far less forgiving than the lessons' queue, because `charterWeek` is a PREFIX:

     while(d.charter.i < CHARTER.length){ if(!CHARTER[d.charter.i].done(d)) break; i++ }

   Step k+1 is never shown until step k is done. A lesson that cannot be reached costs one note;
   a charter step that cannot be finished costs every step after it, plus the year-end 250
   denarii and 12 fame. And the guide was invisible to the suite: not on the test handle until
   v2.69.0, and `haveWatchedOffer` — the whole of step eight — had never been called by any
   check at all, which the coverage sweep had been saying for twenty releases.

   What the first pass found, and what this check now holds:

   TWO STEPS ARGUING WITH EACH OTHER. Step two says "take a bout at first blood — nobody dies at
   those stakes", which is the right first advice. A first-blood bout ends AT the first real
   wound, so nobody is ever on their knees waiting for the box, so it never reaches a crux —
   measured at 250 pit bouts a stake: 0.0% at first blood, 53.2% at surrender, 67.8% sine. And
   step ten is "Let a beaten man up", which needs exactly that moment. Over 40 houses following
   the guide, of the 10 that got past step ten NOT ONE did it by stopping a bout; all ten cleared
   it on a second clause about a man remembering anything at all, and the 5 houses still standing
   at week 40 without finishing were all sitting on it. Section 3 is that measurement, kept.

   AND THE PROBE FAULT THAT CAME FIRST, because it is the shape of most of them. The first run
   reported 17 of 30 houses stalled on step six, "Arm somebody properly". The step's own words
   are "buy a real piece, THEN arm him off the rack", `wears(it)` is `!it.stock && it.price > 0`,
   and the probe was arming men off a rack of free house stock. The cheapest buyable piece is a
   pugio at 80 denarii against an opening purse of 260 to 800: the step was never the problem. */

import { hasHandle } from "../harness.mjs";

export const name = "charter";
export const describe = "the first-year guide can be finished, and no step holds the door";

export async function run({ p, errors }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    const C = A.CHARTER;
    const done = (s, d) => { try { return !!s.done(d); } catch(e){ return false; } };
    const nm = s => `"${s.title}" (${s.id})`;

    /* ---- 1. THE PREFIX MUST BE WALKABLE END TO END ----
       one house, each step's state built to order in turn, and the guide asked what it is
       showing after each. If a step cannot be satisfied, everything after it is unreachable,
       so this is the one section whose failure means the guide is broken rather than slow. */
    const d = A.newGameState("Cr","clean","CHART-1",null);
    d.gold = 200000;
    const build = {
      train: () => { const g = A.activeG(d); A.setSparOf(d, g[0].id, g[1].id); },
      fight: () => { const g = A.activeG(d)[0]; A.makePitCard(d);
        const men = A.pitMen(d) || [];
        const o = A.makePitOffer(d, g, "standard", men.length ? men[0].id : null);
        /* AND THE CRUX MUST BE ANSWERED. A bout left pending is not a bout: `bookBout` runs at
           the verdict, so the record book stays empty and step two reads as impossible. The
           first version of this section reported exactly that. */
        const x = A.doFight(d, g.id, o, "measured", null, null, null, "none");
        if(x && x.crux){ const pd = x.pending; pd.beats = x.beats;
          A.doFight(d, g.id, o, "measured", null, pd, "cover", "none"); } },
      week:  () => { d.pendingEvent = null; A.endWeek(d); d.gold = 200000; },
      buy:   () => { while(A.activeG(d).length < 4 && !A.rosterFull(d)){
        const m = (d.market||[])[0]; if(!m) break; if(!A.buyFromBlock(d, m.id, null)) break; } },
      doctore: () => { A.makeDoctoreMarket(d); const c = (d.doctoreMarket||[])[0];
        if(c) A.hireDoctore(d, c.id); },
      arm:   () => { const g = A.activeG(d)[0];
        const buyable = Object.entries(A.GEAR)
          .filter(([id,it])=>it.slot && !it.stock && it.price>0
            && (!it.cls || !it.cls.length || it.cls.includes(g.cls)))
          .sort((a,b)=>a[1].price-b[1].price);
        if(buyable.length){ const [id, it] = buyable[0];
          if(A.buyGearItem(d, id)) A.equipOne(d, g.id, it.slot, id); } },
      games: () => { d.fame = 200;
        for(let w=1; w<=A.YEAR_WEEKS; w++){ d.week = w; try { A.makeGames(d); } catch(e){}
          const off = ((d.games&&d.games.offers)||[]).filter(o=>!o.pair&&!o.melee&&!o.venatio);
          if(!off.length) continue;
          const g = A.activeG(d).find(x=>!x.injury); if(!g) break;
          g.lastFought = null; g.fatigue = 0;
          const x = A.doFight(d, g.id, off[0], "measured", null, null, null, "none");
          if(x && x.crux){ const pd = x.pending; pd.beats = x.beats;
            A.doFight(d, g.id, off[0], "measured", null, pd, "press", "none"); }
          if(done(C.find(s=>s.id==="games"), d)) break; } },
      /* step eight, and the function behind it that no check had ever called */
      watch: () => { for(let w=1; w<=A.YEAR_WEEKS*2; w++){ d.week = w; try { A.makeGames(d); } catch(e){}
        const off = ((d.games&&d.games.offers)||[]).filter(o=>!o.pair&&!o.melee&&!o.venatio);
        if(off.length && A.haveWatchedOffer(d, off[0].id)) break; } },
      quiet: () => { if(d.unrest >= 12) A.throwFeast(d); },
      /* A CRUX IS NOT GUARANTEED, so this must not depend on one seed's luck. Surrender stakes
         reach a crux in 53% of bouts and sine missione in 68% — but a yard that has been emptied
         cannot fight at all, and the first version of this builder took 40 bouts on whoever was
         left and then reported step ten unfinishable when the RNG stream moved under it in an
         unrelated release. It stands the yard back up and it will take the harder stakes. */
      cloth: () => { for(let i=0;i<120 && !(d.flags.everCloth>0); i++){
        let g = A.activeG(d).find(x=>!x.injury);
        if(!g){ d.gladiators.forEach(x=>{ if(x.status==="injured"){ x.status="active"; x.injury=null; } });
          d.gold = 200000;
          while(A.activeG(d).length < 4 && !A.rosterFull(d)){
            if(!(d.market||[]).length) A.makeMarket(d);
            const m = (d.market||[])[0]; if(!m) break;
            if(!A.buyFromBlock(d, m.id, null)) break; }
          g = A.activeG(d).find(x=>!x.injury); if(!g) break; }
        g.lastFought = null; g.fatigue = 0; g.strain = 0;
        A.makePitCard(d); const men = A.pitMen(d) || [];
        const o = A.makePitOffer(d, g, i % 3 === 2 ? "sine" : "standard", men.length ? men[0].id : null);
        if(!o) break;
        const x = A.doFight(d, g.id, o, "measured", null, null, null, "none");
        if(x && x.crux){ const pd = x.pending; pd.beats = x.beats;
          A.doFight(d, g.id, o, "measured", null, pd, "cloth", "none"); } } },
      year:  () => { while(d.week < A.YEAR_WEEKS + 1){ d.pendingEvent = null;
        d.gold = 200000; try { A.endWeek(d); } catch(e){ break; } if(d.over) break; } },
    };
    const walk = [];
    for(const s of C){
      const showing = A.charterAt(d);
      /* the guide may already have walked past this one — a step whose state arrived early is
         skipped by design, and that is the point of the prefix, not a fault */
      const wasShowing = showing ? showing.id : null;
      let err = null;
      if(!done(s, d) && build[s.id]){ try { build[s.id](); } catch(e){ err = String(e.message||e); } }
      const ok = done(s, d);
      walk.push({ id:s.id, wasShowing, ok, err });
      if(!ok) bad.push(`${nm(s)} could not be finished by a house doing exactly what it asks`
        + `${err?` (${err})`:""} — and it is step ${C.indexOf(s)+1} of ${C.length} of a PREFIX, so `
        + `${C.length - C.indexOf(s) - 1} steps behind it and the year's reward go with it`);
      d.pendingEvent = null; try { A.endWeek(d); } catch(e){}
      d.gold = 200000;
    }
    const finished = !!(d.charter && d.charter.done);
    if(!finished) bad.push(`every step went green and the guide still has not finished — `
      + `it is showing ${(A.charterAt(d)||{}).id || "nothing"} at index ${d.charter?d.charter.i:"?"}`);

    /* ---- 2. NO STEP MAY BE RETIRED BY SOMETHING IT IS NOT ABOUT ----
       Step ten used to clear on `activeG(d).some(g=>(g.memory||[]).length>0)` — a man
       remembering ANYTHING at all. `remember(d, g, "hurt")` runs when one of your own is
       wounded, so in practice the step about sparing a beaten man was retired by having a man
       carried off: all ten houses that got past it passed that way and none had stopped a bout.
       Driven here with the whip, which is the cheapest writer of a memory there is — and note
       `rewardMan` writes none at all, whatever its line about long memory says. */
    const m = A.newGameState("Cr","clean","CHART-2",null);
    m.gold = 20000;
    const cloth = C.find(s=>s.id==="cloth");
    A.whipMan(m, A.activeG(m)[0].id);
    const memory = A.activeG(m).some(g=>(g.memory||[]).length>0);
    const clothAfterReward = done(cloth, m);
    if(memory && clothAfterReward && m.week < A.YEAR_WEEKS)
      bad.push(`${nm(cloth)} is finished by whipping a man in week ${m.week} — `
        + `that writes a memory and nothing else, and the step is about stopping a bout`);

    /* ---- 3. A STEP MAY NOT WANT A MOMENT THE GUIDE'S OWN ADVICE CANNOT PRODUCE ----
       the stake sweep, kept as a measurement rather than a story: step two recommends first
       blood, and a first-blood bout never reaches a crux, which is what step ten needs. */
    const stakes = {};
    for(const stake of ["blood","standard","sine"]){
      const s = A.newGameState("Cr","clean","CHART-S-"+stake,null);
      s.gold = 300000;
      while(A.activeG(s).length < 5 && !A.rosterFull(s)){
        const mm = (s.market||[])[0]; if(!mm) break; if(!A.buyFromBlock(s, mm.id, null)) break; }
      let n = 0, cx = 0;
      for(let i=0;i<60;i++){
        let g = A.activeG(s).find(x=>!x.injury);
        /* stand the yard back up rather than reporting a rate off the two men who survived —
           a crux rate on nineteen bouts cannot carry an assertion, and the first run of this
           section produced exactly nineteen */
        if(!g){ s.gladiators.forEach(x=>{ if(x.status==="injured"){ x.status="active"; x.injury=null; } });
          s.gold = 300000;
          while(A.activeG(s).length < 5 && !A.rosterFull(s)){
            if(!(s.market||[]).length) A.makeMarket(s);
            const mm = (s.market||[])[0]; if(!mm) break;
            if(!A.buyFromBlock(s, mm.id, null)) break; }
          g = A.activeG(s).find(x=>!x.injury); if(!g) break; }
        g.lastFought = null; g.fatigue = 0;
        A.makePitCard(s); const men = A.pitMen(s) || [];
        const o = A.makePitOffer(s, g, stake, men.length ? men[0].id : null);
        if(!o) break;
        n++;
        const x = A.doFight(s, g.id, o, "measured", null, null, null, "none");
        if(x && x.crux){ cx++; const pd = x.pending; pd.beats = x.beats;
          A.doFight(s, g.id, o, "measured", null, pd, "cover", "none"); }
      }
      stakes[stake] = { n, cx };
    }
    /* the assertion is not "first blood must have a crux" — it correctly has none, the bout
       ends at the wound. It is that a step needing one must have a way out that does not */
    if(stakes.blood.n >= 20 && stakes.blood.cx === 0){
      const g = A.newGameState("Cr","clean","CHART-3",null);
      g.week = A.YEAR_WEEKS; g.flags.everCloth = 0;
      if(!done(cloth, g))
        bad.push(`a first-blood bout never reaches a crux (${stakes.blood.cx} of ${stakes.blood.n}) `
          + `and ${nm(cloth)} needs one, with no other way past it — a house told at step two to `
          + `fight at first blood can be held on step ten for the rest of the year`);
    }
    if(stakes.standard.n >= 20 && stakes.standard.cx === 0)
      bad.push(`no bout at surrender stakes reached a crux in ${stakes.standard.n} — the word from `
        + `the box has gone quiet everywhere, which is a bigger thing than the guide`);

    /* ---- 4. AND THE SHAPE ITSELF: skipping forward is by design, blocking is not ---- */
    const sk = A.newGameState("Cr","clean","CHART-4",null);
    const already = C.filter(s=>done(s, sk)).map(s=>s.id);
    A.charterAt(sk);

    return { bad, walk, finished, stakes, already,
      steps:C.map(s=>({ id:s.id, tab:s.tab, title:s.title })),
      memory, clothAfterReward };
  });

  const lines = [];
  lines.push(`${out.steps.length} steps — ${out.steps.map(s=>s.id).join(" → ")}`);
  lines.push(`walked end to end by a house doing what each asks: `
    + out.walk.map(w=>`${w.id}${w.ok?"":" ✗"}`).join(" · "));
  lines.push(`  the guide ${out.finished ? "finished" : "*** DID NOT FINISH ***"}`
    + ` · already true for a fresh house before it starts: ${out.already.join(", ") || "none"}`);
  lines.push(`the word from the box, by stake: `
    + Object.entries(out.stakes).map(([k,v])=>`${k} ${v.cx} of ${v.n} bouts (${(v.cx/Math.max(1,v.n)*100).toFixed(0)}%)`).join(" · "));
  lines.push(`  so step two's advice — first blood — cannot produce what step ten asks for, `
    + `and step ten's way past it is the cloth or the year`);
  lines.push(`whipping a man writes a memory (${out.memory}) and that ${out.clothAfterReward?"STILL retires":"no longer retires"} the step about the cloth`);

  const fails = [...out.bad];
  if(errors.length) fails.push(`${errors.length} page errors`);
  return { pass: fails.length === 0, why: fails.slice(0,4).join("; ") || null, lines };
}
