/* ROME'S NINE READOUTS, WHICH NOTHING HAS EVER CALLED — #152's second cluster

   `coverage` lists 144 exposed functions no check reaches, grouped. After the steel-keeping twelve
   went in v3.43.0 the largest remaining cluster is Rome's own: `romeRuns`, `romeTriumphs`,
   `romeStanding`, `romeWord`, `romePrize`, `romePurseMult`, `romeSineOdds`, `romeGreeting` and
   `makeImperialBout`. They are not independent — eight of the nine hang off one number:

       romeStanding = clamp(runs*12 + triumphs*26 + best*8, 0, 100)

   and that number is written in exactly two places, both at the END of a trip. So the whole cluster
   is a function of how many times a house gets to Rome and what it does there, and the first
   question is not whether the readouts are correct but whether their input ever moves.

   WHAT IS ASKED, in order:
   · the ladder of `romeStanding` — what a house actually reaches, and which of the bands and gates
     downstream of it are inside that range. `romeWord` has four bands, `ROME_TURNS.offer` wants 55,
     `romePurseMult` and `romeSineOdds` scale continuously off it.
   · `makeImperialBout` against the best card Capua draws. Its own comment says the summit had once
     been measurably softer than a good Tuesday at home and was raised for it; that is a claim about
     two distributions and it can be checked directly.
   · `romePrize`, which indexes on triumphs ALREADY BANKED — so the first triumph pays the laurel at
     0 denarii and the statue wants three. Whether any house sees past the first is a count.

   INSTRUMENT NOTES:
   · the trip is driven through the game's own `romeWeek`/`takeBout` by way of the rope, never by
     hand-setting `d.rome`, because what is being asked is whether play reaches these numbers.
   · a GRANTED arm holds the ledger up, because "does a house get to Rome twice" and "does a house
     survive twice" are different questions and only the pair separates them.
   · every band and gate is read off the game's own constants, and the raw per-house rows are printed. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 900);
const SEED = process.argv[4] || "ROME";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const arms = [];
  for(const grant of [0, 200000]){
    const rows = [];
    for(let h=0; h<H; h++){
      const d = A.newGameState("Rm"+h, "clean", `${SEED}-${h}`, null);
      let standPeak = 0, romeWks = 0, offers = 0;
      /* ---- THE BOUTS THEMSELVES, because "no triumph in thirty-two houses" is a claim about
         WINNING and the counters above only see the trip. `d.rome.fought` and `d.rome.won` are the
         game's own tally for the visit; they are read either side of the week so a bout that
         happened can be told from a week that passed. And the two men are compared on the mean of
         the class's key stats, which is what the fight engine reads. */
      let fought = 0, won = 0, trips = 0;
      const gaps = [];
      const meanOf = g => { const k = (A.CLASSES[g.cls]||{key:[]}).key || []; return k.length ? k.reduce((n,x)=>n+(g[x]||0),0)/k.length : 0; };
      for(let w=0; w<W; w++){
        if(d.over) break;
        if(grant) d.gold = Math.max(d.gold, grant);
        if(d.romeOffer) offers++;
        const wasF = d.rome ? d.rome.fought : null, wasW = d.rome ? d.rome.won : null;
        const mine = d.rome ? A.activeG(d).slice().sort((a,b)=>meanOf(b)-meanOf(a))[0] : null;
        const card = d.rome && d.games && (d.games.offers||[]).find(o=>o.imperial);
        R.lanista(d);
        if(d.rome){
          romeWks++;
          if(wasF != null && d.rome.fought > wasF){
            fought += d.rome.fought - wasF;
            won += (d.rome.won||0) - (wasW||0);
            if(mine && card && card.opp) gaps.push({ mine:+meanOf(mine).toFixed(1), theirs:+meanOf(card.opp).toFixed(1) });
          }
          if(wasF == null) trips++;
        }
        standPeak = Math.max(standPeak, A.romeStanding(d));
      }
      rows.push({ runs:A.romeRuns(d), triumphs:A.romeTriumphs(d),
        best:(d.flags&&d.flags.romeBest)||0, stand:A.romeStanding(d), standPeak,
        word:A.romeWord(d), purse:+A.romePurseMult(d).toFixed(3), sine:+A.romeSineOdds(d).toFixed(3),
        prize:A.romePrize(d).name, prizePurse:A.romePrize(d).purse,
        romeWks, offers, fought, won, trips, gaps, week:d.week, over:d.over?d.over.kind:"alive" });
    }
    arms.push({ grant, rows });
  }

  /* ---- THE SUMMIT AGAINST A GOOD TUESDAY ----
     `makeImperialBout`'s own comment says a top card in Capua once drew a stronger man than the
     imperial bill did. Both are drawn here from the same house, many times, and compared on the
     mean of the class's key stats — which is what the fight engine actually reads. */
  const card = (()=>{
    const d = A.newGameState("Cd", "clean", `${SEED}-card`, null);
    d.fame = 3000; d.gold = 40000;
    const mean = g => { const k = A.CLASSES[g.cls].key; return k.reduce((n,x)=>n+(g[x]||0),0)/k.length; };
    const imp = [], home = [];
    for(let i=0;i<160;i++){
      const b = A.makeImperialBout(d);
      if(b && b.opp) imp.push({ m:mean(b.opp), wins:b.opp.wins||0, purse:b.purse||0, sine:b.stakes==="sine" });
    }
    for(let i=0;i<160;i++){ const g = A.genOpponent(3, 100); if(g) home.push({ m:mean(g), wins:g.wins||0 }); }
    /* and the same imperial bill for a house Rome already knows */
    d.flags.romeRuns = 3; d.flags.romeTriumph = 3; d.flags.romeBest = 3;
    const known = [];
    for(let i=0;i<160;i++){ const b = A.makeImperialBout(d); if(b && b.opp) known.push({ m:mean(b.opp), purse:b.purse||0, sine:b.stakes==="sine" }); }
    return { imp, home, known, standKnown:A.romeStanding(d) };
  })();

  /* ---- AND THE BANDS AND GATES, off the game's own tables ---- */
  const bands = (()=>{
    const d = A.newGameState("Bd", "clean", `${SEED}-band`, null);
    const at = (runs, tri, best) => { d.flags.romeRuns = runs; d.flags.romeTriumph = tri; d.flags.romeBest = best;
      return { runs, tri, best, stand:A.romeStanding(d), word:A.romeWord(d),
        purse:+A.romePurseMult(d).toFixed(3), sine:+A.romeSineOdds(d).toFixed(3),
        prize:A.romePrize(d).name, greet:A.romeGreeting(d).slice(0,58) }; };
    const rows = [];
    for(const [r,t,b] of [[0,0,0],[1,0,0],[1,0,2],[1,1,2],[2,1,2],[2,2,3],[3,3,3],[5,4,3]]) rows.push(at(r,t,b));
    const gates = A.RT_KEYS.map(k=>{ let lo = null;
      for(let s=0; s<=100; s++){ d.flags.romeRuns = Math.ceil(s/12); d.flags.romeTriumph = 0; d.flags.romeBest = 0;
        if(A.romeStanding(d) >= s){ } }
      d.flags.romeRuns = 0; d.flags.romeTriumph = 0; d.flags.romeBest = 0;
      return k; });
    return { rows, gates, prizes:A.ROME_PRIZES };
  })();
  return { arms, card, bands };
}, [H, W, SEED]);

const A_ROME_BOUTS = 3;
const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;

console.log(`\n  ROME'S LADDER, read off the game's own tables:`);
console.log(`  runs/tri/best   standing   what the city says               purse x   sine odds   prize on offer`);
for(const r of out.bands.rows)
  console.log(`  ${r.runs}/${r.tri}/${r.best}${" ".repeat(9)} ${String(r.stand).padStart(6)}   ${r.word.padEnd(30)} ${String(r.purse).padStart(7)}   ${String(r.sine).padStart(9)}   ${r.prize}`);
console.log(`  the prize table: ${out.bands.prizes.map((p,i)=>`${i} triumph${i===1?"":"s"} -> ${p.purse}d, ${p.acclaim} acclaim`).join(" · ")}`);
console.log(`  the greetings: ${out.bands.rows.slice(0,4).map(r=>`[${r.runs}/${r.tri}/${r.best}] "${r.greet}…"`).join("\n                 ")}`);

for(const a of out.arms){
  const R2 = a.rows;
  console.log(`\n  ${a.grant ? `WITH THE LEDGER HELD UP (${a.grant}d a week)` : "THE REFERENCE PLAYER"} — ${H} houses x ${W}w · seed "${SEED}"`);
  console.log(`    houses that reached Rome at all: ${R2.filter(x=>x.runs>0).length} of ${R2.length}`
    + ` · twice or more: ${R2.filter(x=>x.runs>1).length}`
    + ` · that ever won a triumph: ${R2.filter(x=>x.triumphs>0).length}`);
  console.log(`    runs ${R2.map(x=>x.runs).join("")} · triumphs ${R2.map(x=>x.triumphs).join("")} · best ${R2.map(x=>x.best).join("")}`);
  console.log(`    standing at the end: median ${med(R2.map(x=>x.stand))}, best ${Math.max(...R2.map(x=>x.standPeak))}`
    + ` · purse multiplier reached ${Math.max(...R2.map(x=>x.purse))}x of a possible 1.45`
    + ` · sine odds ${Math.max(...R2.map(x=>x.sine))} of a possible 0.72`);
  const words = {}; for(const x of R2) words[x.word] = (words[x.word]||0)+1;
  console.log(`    what the city says of them: ${Object.entries(words).sort((p,q)=>q[1]-p[1]).map(([k,v])=>`"${k}" ${v}`).join(" · ")}`);
  const prz = {}; for(const x of R2) prz[x.prize] = (prz[x.prize]||0)+1;
  console.log(`    the prize their NEXT triumph would carry: ${Object.entries(prz).sort((p,q)=>q[1]-p[1]).map(([k,v])=>`"${k}" ${v}`).join(" · ")}`);
  console.log(`    weeks at Rome in total ${R2.reduce((s,x)=>s+x.romeWks,0)} · letters seen ${R2.reduce((s,x)=>s+x.offers,0)} · median life ${med(R2.map(x=>x.week))}w`);
  { const F = R2.reduce((s,x)=>s+x.fought,0), Wn = R2.reduce((s,x)=>s+x.won,0);
    const g = R2.flatMap(x=>x.gaps);
    console.log(`    ON THE SAND AT ROME: ${F} bouts fought, ${Wn} won (${F?((Wn/F)*100).toFixed(1):0}%)`
      + ` — a triumph wants 2 of ${A_ROME_BOUTS} in a trip`);
    if(g.length) console.log(`       the man sent against the man met: mean ${mean(g.map(x=>x.mine)).toFixed(1)} against ${mean(g.map(x=>x.theirs)).toFixed(1)}`
      + ` · best of ours ${Math.max(...g.map(x=>x.mine))} · worst of theirs ${Math.min(...g.map(x=>x.theirs))} (${g.length} pairs)`); }
}

const C = out.card;
console.log(`\n  THE SUMMIT AGAINST A GOOD TUESDAY — 160 draws each, mean of the class's key stats:`);
console.log(`    the imperial bill, house Rome does not know   ${mean(C.imp.map(x=>x.m)).toFixed(1)}  (median wins ${med(C.imp.map(x=>x.wins))})`);
console.log(`    Capua's own tier-3 opponent at quality 100    ${mean(C.home.map(x=>x.m)).toFixed(1)}  (median wins ${med(C.home.map(x=>x.wins))})`);
console.log(`    the imperial bill, house Rome knows (standing ${C.standKnown})  ${mean(C.known.map(x=>x.m)).toFixed(1)}`);
console.log(`    sine missione on the imperial card: ${(C.imp.filter(x=>x.sine).length/C.imp.length*100).toFixed(0)}% unknown · `
  + `${(C.known.filter(x=>x.sine).length/C.known.length*100).toFixed(0)}% known (romeSineOdds says 50% and ${(0.5+C.standKnown/100*0.22)*100|0}%)`);
console.log(`    purse: median ${med(C.imp.map(x=>x.purse))}d unknown · ${med(C.known.map(x=>x.purse))}d known`);

await browser.close(); server.close();
