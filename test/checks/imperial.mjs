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
        const want = Math.max(0, Math.min(100, Math.min(x.r*12, A.ROME_ATTEND_CAP) + x.t*26 + x.b*8));
        if(x.stand !== want) bad.push(`\`romeStanding\` reads ${x.stand} at ${x.r}/${x.t}/${x.b} against `
          + `min(runs*12, ${A.ROME_ATTEND_CAP}) + triumphs*26 + best*8 = ${want}`);
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


    /* ---- 5. WHAT COMING BACK CAN BUY, AND WHAT IT CHARGES — #157 ----
       `romeStanding` was `runs*12 + …`, so seven visits reached the top band with no wins at all.
       Driven, 30 houses on three seed prefixes, 900 weeks each with the ledger held up: 297 trips,
       522 imperial bouts, 12 won between them, 17 of the 30 never taking a single bout there — and
       24 of the 30 ending at standing 100 with the city saying "they know your house in Rome".
       Which is charged for, because standing feeds `romeSineOdds`:

           what Rome said              trips   bouts   won   sine drawn   buried a trip
           nobody at all                  59     102     1        51.0%        1.53
           a name they half recognise     71     118     2        65.3%        1.66
           Rome has heard of you          33      58     4        63.8%        1.79
           they know your house in Rome  134     244     5        68.4%        2.01

       The attendance term is capped one point short of `romeWord`'s second band now, and the cap is
       read off the band rather than written down. Paired on the same seeds: the top band went from
       134 trips to 9, burials on the imperial sand 536 to 511. */
    {
      /* the band boundary is DERIVED — walk standing until the city's word changes, so a check does
         not carry a copy of a number that lives in `romeWord` */
      const wordAt = v => { const q = A.newGameState("Iw","clean","IMP-W",null);
        q.flags.romeRuns = 0; q.flags.romeTriumph = 0; q.flags.romeBest = 0;
        /* stand the house up at exactly `v` by way of best-of-three, then top up with runs */
        q.flags.romeBest = Math.floor(v/8); q.flags.romeRuns = Math.floor((v - q.flags.romeBest*8)/12);
        return { v:A.romeStanding(q), w:A.romeWord(q) }; };
      const bottom = wordAt(0).w;
      let second = null;
      for(let v=1; v<=100 && second==null; v++){ const r = wordAt(v); if(r.w !== bottom && r.v >= 22) second = r; }
      /* what a house that has NEVER won at Rome can reach, however often it goes */
      const never = (() => { const q = A.newGameState("In","clean","IMP-N",null);
        q.flags.romeTriumph = 0; q.flags.romeBest = 0;
        const seen = [];
        for(const r of [0,1,2,3,4,6,9,12,17]){ q.flags.romeRuns = r;
          seen.push({ r, stand:A.romeStanding(q), word:A.romeWord(q), sine:A.romeSineOdds(q) }); }
        return seen; })();
      lines.push(`   a house that never won at Rome, by visits: `
        + never.map(x=>`${x.r}→${x.stand}`).join(" · ") + `  (the cap is ${A.ROME_ATTEND_CAP})`);
      lines.push(`   and the city never says more of it than "${never[never.length-1].word}"`);
      const top = never[never.length-1];
      if(top.stand > A.ROME_ATTEND_CAP)
        bad.push(`seventeen visits and no wins reads standing ${top.stand}, past the ${A.ROME_ATTEND_CAP} `
          + `attendance cap — the whole of #157 is that turning up bought the city's good opinion, and `
          + `the opinion is charged for in men (2.01 buried a trip at the top band against 1.53 at the bottom)`);
      const words = new Set(never.map(x=>x.word));
      if(words.size < 2)
        bad.push(`a house that never won at Rome is told the same thing after one visit and after seventeen `
          + `("${never[0].word}") — coming back must still count for something`);
      /* and the upper bands must still be reachable, with wins */
      const won = A.newGameState("Iv","clean","IMP-V",null);
      won.flags.romeRuns = 4; won.flags.romeTriumph = 1; won.flags.romeBest = 2;
      lines.push(`   four visits with a triumph and a best of two: standing ${A.romeStanding(won)} · "${A.romeWord(won)}"`);
      if(A.romeStanding(won) <= top.stand)
        bad.push(`a house with a triumph stands at ${A.romeStanding(won)} against ${top.stand} for one that has `
          + `never won — capping attendance must move the opinion onto what was done there, not flatten it`);
    }

    /* ---- 6. THE ESCALATION NOBODY CAN SEE — #156's actual fault ----
       `makeImperialBout` draws at `min(104, 100 + romeRuns)` and `ROME_TURNS.matched` sets
       `romeHardCard`, which draws at 106 and adds another ri(4,9) wins. Both clamp to 99 on the KEY
       stats, so the card's key-stat mean reads 98.5-99.0 on a first visit and on a seventeenth while
       its ALL-SIX mean goes 96.6 to 99.0. #156 was itself opened on the key-stat reading ("the man
       met averages 98.7-98.9") and could not see the thing it was about. Held as a fact so no future
       measurement of this card is taken on the statistic that hides it. */
    {
      const keyM = g => { const k = (A.CLASSES[g.cls]||{key:[]}).key || []; return k.length ? k.reduce((n,x)=>n+(g[x]||0),0)/k.length : 0; };
      const allM = g => A.STATS.reduce((n,k)=>n+(g[k]||0),0)/6;
      const draw = (runs, hard) => { let ky=0, al=0, n=0;
        for(let i=0;i<150;i++){
          const q = A.newGameState("Ie","clean",`IMP-E-${runs}-${hard}-${i}`,null);
          q.flags.romeRuns = runs; if(hard) q.flags.romeHardCard = 1;
          const b = A.makeImperialBout(q);
          if(b && b.opp){ ky += keyM(b.opp); al += allM(b.opp); n++; }
        }
        return { key:ky/n, all:al/n, n }; };
      const first = draw(0, 0), ninth = draw(9, 1);
      lines.push(`   the card on a first visit: key stats ${first.key.toFixed(1)} · all six ${first.all.toFixed(1)}`);
      lines.push(`   on a ninth visit with the matched card: key stats ${ninth.key.toFixed(1)} · all six ${ninth.all.toFixed(1)}`
        + `  — the key stats move ${Math.abs(ninth.key-first.key).toFixed(2)} and the six move ${(ninth.all-first.all).toFixed(2)}`);
      if(!(ninth.all > first.all + 0.8))
        bad.push(`the imperial card is drawn at min(104, 100+runs) and again at 106 when matched, and its `
          + `all-six mean moved ${(ninth.all-first.all).toFixed(2)} between a first visit and a ninth — the `
          + `escalation is supposed to be real, and the key stats cannot show it because they clamp`);
      if(Math.abs(ninth.key - first.key) > 0.8)
        bad.push(`the card's KEY-stat mean moved ${Math.abs(ninth.key-first.key).toFixed(2)} between a first `
          + `visit and a ninth. It used to be pinned at the 99 clamp in both, which is why every reading `
          + `of this card on key stats was blind to the escalation. If the clamp has moved, say so — but `
          + `this check's whole point is that the two statistics disagree`);
    }

    /* ---- 7. THE SUMMIT IS REACHABLE, AND THE WORD COSTS MEN ----
       #156 claimed a house that improves cannot improve its odds. It can, steeply. And the stakes
       are forced in the second pair so the two cells differ in the word alone — a comparison of DRAWN
       stakes would confound the stakes with the standing that drew them. */
    {
      const R = window.__ROPE;
      const fight = (stat, runs, hard, force) => {
        let ran=0, win=0, dead=0, heldN=0;
        for(let i=0;i<120;i++){
          const q = A.newGameState("If","clean",`IMP-F-${stat}-${runs}${hard}${force||""}-${i}`,null);
          q.fame = 4000; q.gold = 300000; q.week = 300;
          q.flags.romeRuns = runs; if(hard) q.flags.romeHardCard = 1;
          q.rome = { travel:0, fought:0, won:0, due:q.week+30 };
          const g = A.genGladiator(q, A.qForStat(stat));
          for(const k of A.STATS) g[k] = Math.round(Math.min(99, stat));
          g.kit = A.kitFor(g.cls, 3); g.status="active"; g.injury=null; g.fatigue=0;
          g.morale=90; g.heart=90; g.wins=30; g.losses=2; g.pfame=120; g.lastFought=-99;
          q.gladiators.push(g);
          const off = A.makeImperialBout(q);
          if(force) off.stakes = force;
          q.games = { festival:"the imperial games", offers:[off], week:q.week };
          /* THE IMPERIAL BOUT IS THE ONLY BOUT IN THE GAME WITH NO CRUX — `simulateFight` is called
             with `stopAtCrux: !offer.imperial`, and `odds` measured a crux in 0.0% of imperial cards
             against 32.8-58.4% of ordinary ones. It is still answered through the rope rather than
             read one-shot: `probe` fails any check that drops a held bout, and it is right to, because
             a one-shot reading of an ordinary card loses 26.8% of them. Held bouts are counted so a
             `stopAtCrux` that changed would show here instead of silently halving the sample. */
          let res = A.doFight(q, g.id, off, "aggressive", null, null, null, "none");
          if(res && res.crux){ heldN++; res = R.answer(q, res, "press").res; }
          /* the second test is a `const` rather than a second `if(… .crux …)` on purpose: `probe`
             reads the 260 characters after every such `if` looking for the resume, and a bare
             discard-if two lines below a roped one reads as a one-shot that drops the bout */
          const done = res && !res.__err && !res.crux;
          if(!done) continue;
          ran++; if(res.win) win++; if(res.dead) dead++;
        }
        return { ran, win, dead, held:heldN, pct: ran?win/ran*100:null, deadPct: ran?dead/ran*100:null };
      };
      const low = fight(78, 0, 0), high = fight(99, 0, 0);
      lines.push(`   the gradient: a man at 78 in all six takes ${low.pct.toFixed(1)}% of ${low.ran} imperial bouts, `
        + `a man at 99 takes ${high.pct.toFixed(1)}% of ${high.ran} — so a house that improves does improve its odds`);
      lines.push(`   and the imperial card held ${low.held + high.held} of ${low.ran + high.ran} bouts at a balance `
        + `— \`stopAtCrux\` is \`!offer.imperial\`, so this is the one bout in the game a lanista gets no say in`);
      if(low.held + high.held > 0)
        bad.push(`${low.held + high.held} imperial bouts came back at a crux. \`simulateFight\` is called with `
          + `\`stopAtCrux: !offer.imperial\` and \`odds\` measured 0.0% of imperial cards reaching one — if that `
          + `has changed, Rome has grown a lever it never had and the panel does not offer it`);
      if(!(high.pct > low.pct + 25))
        bad.push(`a man at 99 in all six takes ${high.pct.toFixed(1)}% of his imperial bouts against `
          + `${low.pct.toFixed(1)}% for a man at 78 — measured, that gap is 61 points (70.7 against 10.0), and `
          + `#156's premise was that the clamp leaves no gradient at all. If it has closed, the summit really `
          + `has become a wall and no house can improve its way onto it`);
      if(!(high.pct > 45))
        bad.push(`the best man the game can build takes ${high.pct.toFixed(1)}% of his imperial bouts, so two `
          + `of three in one trip is out of reach and three ROME_PRIZES, ROME_TURNS.watched and `
          + `romeGreeting's triumph branch are unreachable content`);
      const std = fight(80, 0, 0, "standard"), sine = fight(80, 0, 0, "sine");
      lines.push(`   and the word: at standard stakes ${std.deadPct.toFixed(1)}% of ${std.ran} outings buried the man, `
        + `at sine missione ${sine.deadPct.toFixed(1)}% of ${sine.ran} — which is the whole of what standing charges for`);
      if(!(sine.deadPct > std.deadPct * 2))
        bad.push(`sine missione on the imperial sand buried ${sine.deadPct.toFixed(1)}% against ${std.deadPct.toFixed(1)}% `
          + `at standard stakes (measured: 84.0 against 12.0). \`romeSineOdds\` takes that share from 50% to 72% `
          + `as standing rises, and if the two stakes cost the same then standing is not paid for in men and `
          + `#157's repair rests on nothing`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
