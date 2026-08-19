/* ROME'S NINE, AND THE HALF OF THEM NOTHING CAN REACH — #152's second cluster

   `coverage` groups the 144 exposed functions no check calls. After the steel-keeping twelve went in
   v3.43.0 the largest remaining cluster was Rome's own readouts — `romeRuns`, `romeTriumphs`,
   `romeStanding`, `romeWord`, `romePrize`, `romePurseMult`, `romeSineOdds`, `romeGreeting` and
   `makeImperialBout`. Eight of the nine hang off one number:

       romeStanding = clamp(runs*12 + triumphs*26 + best*8, 0, 100)

   so the cluster is a function of how often a house gets to Rome and what it does there, and driving
   it (`test/probes/imperial.mjs`, 16 houses x 900 weeks, with and without a free grant) says:

     houses that reached Rome at all      11 of 16 played · 16 of 16 with the ledger held up
     houses that got there twice or more   6 of 16 played · 15 of 16 (one reached it SEVENTEEN times)
     bouts fought on the imperial sand    88 played, 312 granted
     bouts WON                            0 and 4 — about ONE PER CENT
     houses that ever won a triumph       0 of 32

   The man sent averages 73-80 on the mean of his class's key stats. The man met averages 98.7-98.9,
   and `makeImperialBout` adds ri(1,4) to every key stat after drawing at quality 100+, so he sits on
   the 99 clamp. Even the best man any house ever sent — 98.3 — met a floor of 95.8. A triumph wants
   two wins of three in one trip; at a one per cent bout, that is about a twentieth of a per cent.

   SO THE STANDING LADDER IS CLIMBED BY ATTENDANCE, NOT BY WINNING, and `romeTriumphs` stays 0. Which
   leaves dark, in a system a house takes twenty years to reach: three of the four entries in
   `ROME_PRIZES` (1,800d, 3,600d and 7,000d), `ROME_TURNS.watched` (needs a triumph), and the `t > 0`
   branch of `romeGreeting`. That is content, priced and written, that the game does not deliver.

   WHAT THIS CHECK DOES is hold the arithmetic and the reachability of the LADDER, which is what a
   coverage check can honestly hold, and RECORD the win rate rather than bar on it — the difficulty
   is deliberate ("the highest night in the game must not be the softest" is in `makeImperialBout`'s
   own comment) and whether it is too deliberate is a design question in the roadmap, not a bar here.
   The one thing it does bar is the summit claim itself: the imperial man must be harder than the
   best Capua draws, because that sentence is the reason the numbers are where they are. */
import { hasHandle } from "../harness.mjs";

export const name = "imperial";
export const describe = "Rome's standing ladder is arithmetic a house can climb, and the summit is the summit";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const d = A.newGameState("Im", "clean", "IMPERIAL", null);
    d.fame = 3000; d.gold = 40000;
    const at = (runs, tri, best) => { d.flags.romeRuns = runs; d.flags.romeTriumph = tri; d.flags.romeBest = best; return d; };

    /* ---- 1. THE LADDER, and every band on it reachable ---- */
    {
      const rows = [[0,0,0],[1,0,0],[1,0,2],[1,1,2],[2,1,2],[2,2,3],[3,3,3]].map(([r,t,b])=>{
        at(r,t,b);
        return { r,t,b, stand:A.romeStanding(d), word:A.romeWord(d),
          purse:+A.romePurseMult(d).toFixed(3), sine:+A.romeSineOdds(d).toFixed(3), prize:A.romePrize(d).name };
      });
      for(const x of rows)
        lines.push(`   ${x.r}/${x.t}/${x.b} -> standing ${String(x.stand).padStart(3)} · "${x.word}" · purse x${x.purse} · sine ${x.sine} · next prize "${x.prize}"`);
      for(const x of rows){
        const want = Math.max(0, Math.min(100, x.r*12 + x.t*26 + x.b*8));
        if(x.stand !== want) bad.push(`\`romeStanding\` reads ${x.stand} at ${x.r}/${x.t}/${x.b} against runs*12 + triumphs*26 + best*8 = ${want}`);
        /* the row stores the reading to three places, so the expectation is rounded the same way —
           comparing a rounded value against an unrounded one at 1e-6 fails on the rounding and not
           on the code, which is what the first version of this bar did on three rows of seven */
        const r3 = v => +v.toFixed(3);
        if(x.purse !== r3(1 + x.stand/100*0.45)) bad.push(`\`romePurseMult\` reads ${x.purse} at standing ${x.stand} against 1 + standing/100 * 0.45`);
        if(x.sine !== r3(0.5 + x.stand/100*0.22)) bad.push(`\`romeSineOdds\` reads ${x.sine} at standing ${x.stand} against 0.5 + standing/100 * 0.22`);
      }
      const words = new Set(rows.map(x=>x.word));
      lines.push(`   the city says ${words.size} different things across that ladder: ${[...words].map(w=>`"${w}"`).join(" · ")}`);
      if(words.size < 4)
        bad.push(`\`romeWord\` has four bands and only ${words.size} of them are on the ladder a house can climb `
          + `(${[...words].join(", ")}) — a band nobody reaches is a sentence nobody reads`);
      /* the greeting is four different states and must not collapse to one */
      const greets = new Set([[0,0,0],[1,0,0],[1,0,2],[1,1,2]].map(([r,t,b])=>{ at(r,t,b); return A.romeGreeting(d); }));
      lines.push(`   and greets a returning house ${greets.size} different ways`);
      if(greets.size < 4) bad.push(`\`romeGreeting\` gives ${greets.size} distinct lines across its four states — `
        + `it branches on runs, triumphs and best, and each branch is a different thing to be told`);
    }

    /* ---- 2. THE PRIZES, all four addressable and each dearer than the last ---- */
    {
      const P = A.ROME_PRIZES;
      lines.push(`   the prize table: ${P.map((x,i)=>`${i} banked -> ${x.purse}d/${x.acclaim} acclaim`).join(" · ")}`);
      for(let i=1;i<P.length;i++){
        if(!(P[i].purse > P[i-1].purse)) bad.push(`prize ${i} pays ${P[i].purse}d against ${P[i-1].purse}d for the one before — "each triumph is worth more than the last"`);
        if(!(P[i].acclaim > P[i-1].acclaim)) bad.push(`prize ${i} carries ${P[i].acclaim} acclaim against ${P[i-1].acclaim}`);
      }
      for(let t=0;t<P.length+2;t++){ at(1, t, 1);
        const want = P[Math.min(P.length-1, t)];
        if(A.romePrize(d).name !== want.name) bad.push(`\`romePrize\` at ${t} banked triumphs returned "${A.romePrize(d).name}" rather than "${want.name}"`);
      }
    }

    /* ---- 3. THE SUMMIT IS THE SUMMIT ----
       `makeImperialBout`'s own comment records that a top card in Capua once drew a stronger man
       than the imperial bill did, and that this was fixed by raising the draw. That is a claim about
       two distributions, and it is the one thing here worth barring on. */
    {
      const mean = g => { const k = (A.CLASSES[g.cls]||{key:[]}).key || []; return k.length ? k.reduce((n,x)=>n+(g[x]||0),0)/k.length : 0; };
      at(0,0,0);
      const imp = [], home = [];
      for(let i=0;i<120;i++){ const b = A.makeImperialBout(d); if(b && b.opp) imp.push({ m:mean(b.opp), w:b.opp.wins||0, sine:b.stakes==="sine", purse:b.purse||0 }); }
      for(let i=0;i<120;i++){ const g = A.genOpponent(3, 100); if(g) home.push(mean(g)); }
      const mi = imp.reduce((s,x)=>s+x.m,0)/imp.length, mh = home.reduce((s,a)=>s+a,0)/home.length;
      const mw = [...imp.map(x=>x.w)].sort((a,b)=>a-b)[Math.floor(imp.length/2)];
      lines.push(`   the imperial bill draws a mean ${mi.toFixed(1)} on the key stats with a median ${mw} career wins, `
        + `against ${mh.toFixed(1)} for Capua's own tier-3 man at quality 100`);
      if(!(mi > mh))
        bad.push(`the imperial man draws ${mi.toFixed(1)} against Capua's ${mh.toFixed(1)} — the highest night in the `
          + `game is no harder than a good Tuesday at home, which is the exact regression the draw was raised for`);
      if(!(mw >= 4))
        bad.push(`the imperial man carries a median ${mw} career wins — he is supposed to come with the years in `
          + `his arms as well as the numbers, which is what a man who survived these games looks like`);
      /* and the house Rome knows is offered a worse night and a better purse */
      at(3,3,3);
      const known = [];
      for(let i=0;i<120;i++){ const b = A.makeImperialBout(d); if(b && b.opp) known.push({ sine:b.stakes==="sine", purse:b.purse||0 }); }
      const pc = a => a.filter(x=>x.sine).length/a.length;
      const md = a => [...a.map(x=>x.purse)].sort((x,y)=>x-y)[Math.floor(a.length/2)];
      lines.push(`   unknown house: ${(pc(imp)*100).toFixed(0)}% sine, median purse ${md(imp)}d · `
        + `a house Rome knows (standing ${A.romeStanding(d)}): ${(pc(known)*100).toFixed(0)}% sine, median purse ${md(known)}d`);
      if(!(md(known) > md(imp)))
        bad.push(`a house Rome knows is offered ${md(known)}d against ${md(imp)}d for a stranger — \`romePurseMult\` `
          + `is the reward for coming back and it has to reach the purse`);
      if(!(pc(known) > pc(imp)))
        bad.push(`a house Rome knows meets sine missione ${(pc(known)*100).toFixed(0)}% of the time against `
          + `${(pc(imp)*100).toFixed(0)}% for a stranger — "they want more from a house they know" is `
          + `\`romeSineOdds\`, and it has to reach the card`);
    }

    /* ---- 4. AND THE PART THAT IS RECORDED RATHER THAN BARRED ----
       Driven play says the imperial bout is won about 1% of the time and no house in 32 ever banked
       a triumph, which leaves three prizes, one ROME_TURN and one greeting branch unreachable. The
       difficulty is deliberate and the design question belongs in the roadmap; what is held here is
       that the gates exist and are addressable, so that if the difficulty is ever revisited nothing
       underneath it has quietly rotted. */
    {
      at(0,0,0); const t0 = A.RT_KEYS.filter(k=>{ try { return A.ROME_TURNS[k].need(d); } catch(e){ return false; } });
      at(3,3,3); const t3 = A.RT_KEYS.filter(k=>{ try { return A.ROME_TURNS[k].need(d); } catch(e){ return false; } });
      lines.push(`   Rome's turns open for a stranger: ${t0.join(", ")||"none"} · for a house it knows: ${t3.join(", ")||"none"}`);
      lines.push(`   MEASURED IN PLAY, recorded not barred: 400 bouts on the imperial sand across 32 houses, 4 won `
        + `(1.0%), 0 triumphs — so ROME_PRIZES 1-3, ROME_TURNS.watched and romeGreeting's triumph branch are `
        + `unreached content. See the roadmap.`);
      if(t3.length <= t0.length)
        bad.push(`a house Rome knows opens no more of \`ROME_TURNS\` than a stranger (${t3.length} against ${t0.length}) — `
          + `the three of them are gated on runs, triumphs and standing precisely so a second visit is not the first`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
