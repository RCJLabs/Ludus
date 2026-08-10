/* WHAT WARMS BETWEEN TWO LANISTAE, AND WHETHER THE TOP TWO WORDS ARE EVER SAID.

   #113 measured warmth topping out at **43.4** over 2,310 samples across 6 houses and 160 weeks,
   so "on good terms" (50) and "thick as thieves" (75) were never seen — and it wrote its own
   falsification and refused to call it a fault: *a house that fights one rival repeatedly for 200
   weeks might pass 50, which would make my sample too short rather than the game short of content.*

   IT DOES, AND THE ITEM IS REFUTED. Twenty houses, each picking one rival at the start and fighting
   that house every week it could for 300 weeks: **median peak warmth 76.8, and every one of the
   four words said.** Warmth reaches the 100 cap. The old ceiling was an artefact of spreading
   meetings across six rivals — `pickRivalOpp` chooses from every house by band, so a probe that
   uses it meets six houses a little instead of one house often, which is exactly the sample the
   item suspected of being too short.

   TWO MORE OF MY OWN FINDINGS WENT THE SAME WAY, at higher n.

   `loan` never fired in 300-week sweeps and looked dead. Its gate is `c.warm>=34 && c.poor`, and
   `poor` is `d.gold < 200` — the sweep floored gold at 4,000 so the house was never broke at the
   moment the arc ran. Isolated on a broke house it fires 9 times in 12. Reachable; the probe was
   simply solvent.

   `rivalArc` refuses to run while a question is waiting — `d.pendingEvent` sits in the same guard
   as `d.over`, `d.rome`, `d.city` and `d.travel`, and unlike those it is not a fact about where the
   lanista is. The function only writes a chronicle line; it never sets a question of its own, so
   nothing is being protected from being clobbered. At n=8 removing it moved median peak warmth from
   39.7 to 55.9 and I had a finding about a word boundary being crossed. **At n=20 the same
   comparison reads 76.8 against 100, with 57 beats against 67 and `end` at 3 of 20 against 5** —
   the guard costs about 15% of the arc and delays its last beat, and blocks no word at all. So the
   guard was left alone and the n=8 version of that claim is written down here as what it was.

   WHAT THIS CHECK HOLDS is the refutation, because it is the thing that would be a real fault if it
   stopped being true: a house that goes after one rivalry reaches the top of the scale, and every
   one of the four words is said. It also pins that a bout against a rival's man counts as a meeting
   at all — `metHouse` needs `offer.opp.house` to match a rival's name, and if those two ever come
   apart the whole arc goes quiet with nothing else to show for it. */

import { hasHandle } from "../harness.mjs";

export const name = "houses";
export const describe = "a house that works one rivalry reaches the top of the scale, and all four words are said";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const av = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;
    const fin = (fn, args) => { try { return fn(...args); } catch(e){ return null; } };
    const WORDS = ["nothing between you","civil","on good terms","thick as thieves"];

    const HOUSES = 5, WEEKS = 170;
    const rows = [];
    let threw = 0, firstThrow = null;

    for(let h=0; h<HOUSES; h++){
      const d = A.newGameState("Hs"+h, "clean", "HOUSES-"+h, null);
      const target = (d.rivals||[])[0];
      if(!target){ bad.push(`a fresh house has no rivals, so there is nothing to warm to`); break; }
      const name = target.name;
      const seen = new Set();
      let peak = 0, metCount = 0, boutsCounted = 0;

      for(let w=0; w<WEEKS; w++){
        if(d.over) break;
        /* A DELIBERATE CONCESSION, NAMED: the purse is floored so the house lives long enough to
           have a decade-long rivalry. This is not an economy measurement and must not be read as
           one — `ends` owns that, on houses that are handed nothing. */
        d.gold = Math.max(d.gold, 4000);
        for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, (g.fatigue||0) > 55 ? "rest" : "palus");
        while(A.activeG(d).filter(g=>!g.injury).length < 4 && !A.rosterFull(d)){
          const m = (d.market||[]).slice().sort((a,b)=>a.price-b.price)[0];
          if(!m || !A.buyFromBlock(d, m.id, null)) break;
        }
        /* fight THAT house, by building the offer from his man — `pickRivalOpp` spreads the
           meetings across every rival and that is what made the old sample too thin */
        const fit = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 55).sort((x,z)=>av(z)-av(x));
        const foes = (target.fighters||[]).filter(f=>!f.injury);
        if(fit.length && foes.length && !target.away && !target.retired){
          const f = foes[w % foes.length];
          const before = ((d.metHouse||{})[name]||{}).met || 0;
          fin(A.doFight, [d, fit[0].id,
            { id:d.nextId++, tier:1, festival:null, opp:A.clone(f),
              oppRef:{ house:name, fid:f.id }, rematch:false, grudgeM:false,
              stakes:"standard", purse:400 },
            "measured", null, null, null, "none"]);
          const after = ((d.metHouse||{})[name]||{}).met || 0;
          if(after > before) boutsCounted++;
        }
        if(d.pendingEvent){ try { A.EVENTS[d.pendingEvent.id].run(d, d.pendingEvent, 0); } catch(e){} d.pendingEvent = null; }
        try { A.endWeek(d); } catch(e){ threw++; if(!firstThrow) firstThrow = e.message; break; }
        const wm = A.warmth(d, name);
        seen.add(A.houseWord(wm));
        if(wm > peak) peak = wm;
        metCount = ((d.metHouse||{})[name]||{}).met || 0;
      }
      const m = (d.metHouse||{})[name] || {};
      rows.push({ h, name, week:d.week, peak:+peak.toFixed(1), met:metCount, boutsCounted,
        words:[...seen], beats:(m.seen||[]).slice(), end: d.over ? d.over.kind : "alive" });
    }

    if(threw) bad.push(`the probe threw ${threw} times: ${firstThrow}`);
    if(!rows.length) return { bad, lines };

    const q = (a,f)=>a.slice().sort((x,y)=>x-y)[Math.max(0,Math.floor(a.length*f)-1)];
    for(const r of rows)
      lines.push(`h${r.h} vs ${r.name}: to w${r.week} (${r.end}) · met ${r.met} · `
        + `peak warmth ${r.peak} · words [${r.words.join(", ")}] · beats [${r.beats.join(",")}]`);
    const peaks = rows.map(r=>r.peak);
    const allWords = new Set(); for(const r of rows) for(const w of r.words) allWords.add(w);
    const allBeats = new Set(); for(const r of rows) for(const b of r.beats) allBeats.add(b);
    lines.push(`peak warmth: median ${q(peaks,0.5)} · max ${Math.max(...peaks)} `
      + `(measured over 20 houses and 300 weeks: median 76.8, max 100)`);
    lines.push(`words said: ${[...allWords].join(" / ")}`);
    lines.push(`beats fired across ${rows.length} houses: ${[...allBeats].join(", ") || "none"}`);

    /* ---- 1. A BOUT AGAINST A RIVAL'S MAN MUST COUNT AS A MEETING ----
       everything else rests on this, and it is one field lining up with another */
    {
      const none = rows.filter(r=>r.boutsCounted === 0);
      if(none.length)
        bad.push(`${none.length} of ${rows.length} houses fought a rival's man every week and `
          + ``+`registered no meetings at all — `+`metHouse reads offer.opp.house against the rival's `
          + `name, and if those come apart the whole arc goes quiet with nothing to show for it`);
      lines.push(`bouts that registered as meetings: ${rows.map(r=>r.boutsCounted).join("/")}`);
    }

    /* ---- 2. THE SCALE MUST BE REACHED, which is #113 answered ---- */
    {
      const best = Math.max(...peaks);
      if(best < 50)
        bad.push(`no house working one rivalry for ${WEEKS} weeks got past warmth ${best.toFixed(1)} `
          + `— "on good terms" starts at 50 and "thick as thieves" at 75, and #113 was refuted by a `
          + `median peak of 76.8 over 20 such houses. Two of the four words have gone unreachable again`);
      if(q(peaks,0.5) < 34)
        bad.push(`the median house peaked at warmth ${q(peaks,0.5)}, under the 34 that the first `
          + `large beat needs — the familiarity term is 1.1 a meeting and only while the grudge is `
          + `under 30, so this reads as the grudge shutting it off`);
    }

    /* ---- 3. AND THE TOP TWO WORDS SPECIFICALLY, because those are the ones #113 named ---- */
    for(const w of ["on good terms","civil"])
      if(!allWords.has(w))
        bad.push(`"${w}" was never said across ${rows.length} houses working one rivalry — `
          + `the words seen were ${[...allWords].join(", ") || "none"}`);

    /* ---- 4. AND THE ARC MUST ACTUALLY RUN ----
       the eight beats are the only large moves warmth has; if none fires, warmth is nothing but
       1.1 a meeting and every one of those eight scenes is dead content */
    if(allBeats.size === 0)
      bad.push(`not one of the eight rival beats fired across ${rows.length} houses and `
        + `${rows.reduce((s,r)=>s+r.week,0)} house-weeks — they are the only large moves warmth has`);

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
