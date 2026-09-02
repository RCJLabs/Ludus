/* #225 — WHERE A FEUD ENDS, AND WHETHER IT EVER DOES

   The item: "A feud stood on 79% of all weeks; 22 declared and 6 ever won across 12 houses, and a
   new one re-declares soon after any resolution. Always-on and rarely-resolving reads as climate.
   Recommend feuds with shapes and true endings — ruin them, absorb them, marry into them — and a
   real quiet between feuds."

   TWO OF THE THREE ENDINGS IT ASKS FOR ARE ALREADY WRITTEN, which is this project's usual shape:

     ruin them    `settleNemHouse(d,true)` with `nemEdge(d) >= 1` sets `h.retired` — he sells up
                  and takes the road to Nola. A real ending, and a good one.
     marry them   `resolveMatch` and `resolveDaughter` both carry a "rival" branch that drops the
                  house's grudge and sets `h.kin = true`.
     absorb them  nothing.

   AND THE SECOND ONE DOES NOT TOUCH THE FEUD. Read the branch: it moves `h.grudge` and sets
   `h.kin`, and `d.nemHouse` is not mentioned. `h.kin` is written in three places in the file and
   READ IN NONE. So the wedding line says "a feud older than either of you is folded up and put
   away" and "it will hold longer than any truce you could buy" — and the following week
   `nemHouseWeek` escalates the same feud with the same house.

   AND A LOSS IS NOT AN ENDING, which is #222's fault in a second arc:

       settleNemHouse(d,false)  ->  n.stage = 2; n.heat = clamp(n.heat-30, 25, 100)
       a missed grudge match    ->  n.stage = 2; n.heat = clamp(n.heat-20, 25, 100)

   Both leave `d.nemHouse` standing. Heat climbs +1.4 a week and the match re-issues at 72, so
   losing the season's one named bout buys about twenty weeks before he demands it again. There is
   no way to lose a feud, only ways to not have won it yet.

   This counts every feud a played house declares and what became of it, the quiet between them,
   and the fate of every grudge match. It also asks the marriage question directly, on a state
   where a feud is standing.

     node test/probes/feud.mjs 12 420 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"FEUD" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const feuds = [];               /* one row per declared feud */
  const gaps = [];                /* weeks between one feud ending and the next declaring */
  const match = { issued:0, met:0, missed:0, gone:0 };
  let weeks = 0, onWeeks = 0, houses = 0, fell = 0, stage3 = 0;
  const angry = [];               /* the rival's grudge, on every week his feud with you stands */
  const named = []; let namedN = 0, namedNotBest = 0;   /* the stat gap the grudge match is named on */
  const ends = {};

  for(let h=0; h<H; h++){
    houses++;
    const d = A.newGameState("Feud", "clean", "FEUD-"+h, null);
    let cur = null, endedAt = null;
    let was = { won:0, lost:0, un:0 };   /* the engine's own outcome counters, week over week */
    const seenDl = new Map();
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d); } catch(e){ break; }
      weeks++;
      const n = d.nemHouse;
      if(n) onWeeks++;

      /* the grudge match is a `challenge` deadline flagged `nem` */
      const dl = (d.deadlines||[]).find(x=>x.kind==="challenge" && x.nem);
      if(dl && !seenDl.has(dl.id)){ seenDl.set(dl.id, { due:dl.due }); match.issued++;
        if(cur) cur.matches = (cur.matches||0) + 1;
        /* ---- AND WHO IS ACTUALLY ON THE SAND ----
           `issueGrudgeMatch` names YOUR HIGHEST-PFAME man and their `houseChampion` — their star
           if he is fit. Fame is not strength: a famous veteran can be well past it. The bout
           resolves on stats, so this is the gap the day is named on. */
        const mine = A.activeG(d).find(g=>g.id===dl.gid);
        const rh = (d.rivals||[]).find(x=>x.name===dl.house);
        const foe = rh && (rh.fighters||[]).find(f=>f.id===dl.fid);
        const av = g => g ? A.STATS.reduce((n,k)=>n+(g[k]||0),0)/6 : null;
        if(mine && foe){ named.push(+(av(mine)-av(foe)).toFixed(1));
          const best = A.activeG(d).slice().sort((a,b)=>av(b)-av(a))[0];
          if(best && best.id !== mine.id) namedNotBest++;
          namedN++; } }
      for(const [id, rec] of seenDl){
        if(rec.done) continue;
        const live = (d.deadlines||[]).find(x=>x.id === id);
        if(live && live.met){ rec.done = 1; match.met++; }
        else if(!live){ rec.done = 1; if(d.week > rec.due) match.missed++; else match.gone++; }
      }

      if(n && (!cur || cur.since !== n.since)){
        if(endedAt != null) gaps.push(d.week - endedAt);
        cur = { house:n.house, since:n.since, born:d.week, top:n.stage, heat:Math.round(n.heat),
          weeks:0, resets:0, last:n.stage, matches:0 };
        feuds.push(cur);
      }
      if(n && cur){
        cur.weeks++;
        if(n.stage > cur.top){ cur.top = n.stage; if(n.stage>=3 && !cur.saw3){ cur.saw3=1; stage3++; } }
        if(n.stage < cur.last) cur.resets++;
        cur.last = n.stage; cur.heat = Math.round(n.heat);
        cur.rivalGone = !!(A.houseOf ? !A.houseOf(d, n.house) : false);
        /* WHAT THE RIVAL ACTUALLY FEELS while his feud with you stands. `declareNemHouse` wants
           grudge >= 45 to start one and nothing ever re-reads it. */
        { const rh = (d.rivals||[]).find(x=>x.name===n.house);
          if(rh) angry.push(Math.round(rh.grudge||0)); }
      }
      if(!n && cur && !cur.ended){
        /* ---- WHY IT STOPPED, FROM THE COUNTERS THE ENGINE KEEPS ----
           The first cut of this read the world and guessed: "ended at stage 3 with the rival still
           on the books" was called a WIN. That was true only while a loss could not end a feud —
           the moment one could, it filed every loss and every unanswered day under "you won the
           grudge match" and reported 45 wins out of 60. The engine counts each outcome itself;
           this reads the difference across the week instead of inferring one. */
        const now = { won:d.flags.nemWon||0, lost:d.flags.nemLost||0, un:d.flags.nemUnanswered||0 };
        const rh = (d.rivals||[]).find(x=>x.name === cur.house);
        cur.ended = now.won > was.won ? (rh && rh.retired ? "RUINED — you beat him and he sold up"
                                                          : "you won the grudge match")
          : now.lost > was.lost ? "HE WON IT — he named the day and took it"
          : now.un > was.un ? "you did not stand on the day"
          : !rh ? "the rival house is off the books"
          : rh.retired ? "he folded on his own"
          : rh.kin ? "a wedding folded it up"
          : "it went cold — nobody was carrying it any more";
        ends[cur.ended] = (ends[cur.ended]||0) + 1;
        endedAt = d.week; cur = null;
      }
      was = { won:d.flags.nemWon||0, lost:d.flags.nemLost||0, un:d.flags.nemUnanswered||0 };
    }
    if(cur && !cur.ended){ cur.ended = d.over ? "the house fell" : "still running at the end";
      ends[cur.ended] = (ends[cur.ended]||0) + 1; }
    if(d.over) fell++;
  }

  /* ---- THE MARRIAGE QUESTION, ASKED DIRECTLY ----
     Play a house until a feud stands, then marry into that very house and read `d.nemHouse`. */
  let wed = null;
  for(const t of ["A","B","C","D","E","F","G","H"]){
    const d = A.newGameState("Feud", "clean", "FEUD-W"+t, null);
    let ok = false;
    for(let w=0; w<300 && !d.nemHouse; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
    if(!d.nemHouse || d.over) continue;
    const hn = d.nemHouse.house, rh = (d.rivals||[]).find(x=>x.name===hn);
    if(!rh) continue;
    const before = { feud:hn, grudge:Math.round(rh.grudge||0), heat:Math.round(d.nemHouse.heat) };
    /* A REAL DAUGHTER, of an age to be married. The first cut of this arm passed `cid:-1` and
       `resolveDaughter` returns "The moment passes." on a child it cannot find, so it measured the
       fixture rather than the branch. */
    const dm = A.domusOf ? A.domusOf(d) : d.domus;
    const cid = 9001;
    (dm.children = dm.children || []).push({ id:cid, name:"Vettia", sex:"f", born:d.week-17*52, age:17 });
    let said = null;
    try { said = A.resolveDaughter(d, { data:{ cid, opts:[{kind:"rival", house:hn}] } }, 0); } catch(e){ said = "threw: "+e.message; }
    const rh2 = (d.rivals||[]).find(x=>x.name===hn);
    wed = { ...before, said:String(said||"").slice(0,80), afterGrudge:Math.round((rh2&&rh2.grudge)||0),
      kin:!!(rh2&&rh2.kin), feudStillOn: !!(d.nemHouse && d.nemHouse.house===hn) };
    /* and the wife's match carries the same branch — ask it too, on a fresh copy */
    const e2 = JSON.parse(JSON.stringify(d));
    try { A.resolveMatch(e2, { data:{ cands:[{ kind:"rival", house:hn, who:"Vettia", family:hn, dowry:0 }] } }, 0); } catch(err){}
    wed.wifeFeudStillOn = !!(e2.nemHouse && e2.nemHouse.house===hn);
    ok = true;
    if(ok) break;
  }

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    return { n:s.length, min:s[0], p50:s[Math.floor(s.length/2)], max:s[s.length-1],
      mean:+(s.reduce((n,v)=>n+v,0)/s.length).toFixed(1) }; };
  return { houses, weeks, onWeeks, fell, feuds:feuds.length, ends, match, stage3,
    onPc: weeks ? +(onWeeks/weeks*100).toFixed(1) : 0,
    life: q(feuds.map(x=>x.weeks)), gap: q(gaps), resets: q(feuds.map(x=>x.resets)),
    matchesPer: q(feuds.map(x=>x.matches||0)), angry:q(angry),
    angryUnder45: angry.length ? +(angry.filter(v=>v<45).length/angry.length*100).toFixed(1) : 0,
    named:q(named), namedN, namedNotBest, wed };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.weeks} weeks over ${out.houses} houses (${out.fell} fell)\n`);
  console.log(`A FEUD STOOD ON ${out.onWeeks} OF ${out.weeks} WEEKS — ${out.onPc}%`);
  console.log(`  the item measured 79%\n`);
  console.log(`FEUDS: ${out.feuds} declared · ${out.stage3} reached the grudge match (stage 3)`);
  console.log(`  how they ended:`);
  for(const [k,v] of Object.entries(out.ends).sort((a,b)=>b[1]-a[1]))
    console.log(`    ${String(v).padStart(4)}  ${k}`);
  console.log(`\n  weeks a feud lived:        ${JSON.stringify(out.life)}`);
  console.log(`  weeks of quiet between:    ${JSON.stringify(out.gap)}`);
  console.log(`  times it fell back a stage: ${JSON.stringify(out.resets)}`);
  console.log(`  grudge matches per feud:   ${JSON.stringify(out.matchesPer)}`);
  console.log(`\nTHE GRUDGE MATCH — reaching stage 3 only NAMES the day:`);
  console.log(`  issued ${out.match.issued} · fought ${out.match.met} · missed ${out.match.missed} · gone before its day ${out.match.gone}`);
  console.log(`\nTHE MATCHUP THE DAY IS NAMED ON — your man's stat mean minus his:`);
  console.log(`  ${JSON.stringify(out.named)}`);
  console.log(`  the named man was NOT your strongest in ${out.namedNotBest} of ${out.namedN} — `
    + `\`issueGrudgeMatch\` picks on pfame and the bout resolves on stats`);
  console.log(`\nWHAT THE RIVAL FEELS while the feud stands: grudge ${JSON.stringify(out.angry)}`);
  console.log(`  weeks his grudge was UNDER the 45 it takes to declare one: ${out.angryUnder45}%`);
  console.log(`\nMARRYING INTO THE FEUD, on a state where one is standing:`);
  console.log(out.wed ? `  ${JSON.stringify(out.wed)}` : `  no fixture reached a standing feud`);
}
console.log("\n" + JSON.stringify(out));
await browser.close(); server.close();
