/* THE HIGHEST NIGHT IN THE GAME, AND WHAT IT COSTS — #156 and #157

   Two items on one subsystem, measured off the same runs.

   #156 said the imperial games are won once in a hundred (4 of 400 bouts across 32 houses, no house
   ever banking a triumph), and named its own falsification: an arm that pours everything into one man
   wins two of three. The strongest form of that arm is not a policy at all — it is the free-grant
   trick this project already uses on money, turned on the man. `makeImperialBout` draws at quality
   100-104 and then adds `ri(1,4)` to every key stat, which the 99 clamp catches, so the opponent is
   pinned at the top of the scale. If a fighter who is NINETY-NINE IN ALL SIX, in the best kit the
   game sells, with the heart and the record of a man who has done nothing else, cannot take two of
   three, then no house can, and the question stops being about policy.

   #157 said Rome's standing is bought by turning up — `runs*12 + triumphs*26 + best*8`, so nine
   trips reach 100 with no wins — and that it is paid for in blood, because standing feeds
   `romeSineOdds` from 50% to 72%. Its falsification is a count nobody has taken: burials per trip
   against standing. ARM D takes it, and ARM C takes the half of it that needs no sampling at all —
   whether a sine missione bout on the imperial sand actually buries more men than a standard one.

   INSTRUMENT NOTES, all off this project's record:
   · every arm uses the game's own `makeImperialBout`, never a hand-built opponent. The card is what
     is being measured.
   · an imperial bout has NO CRUX — `simulateFight` is called with `stopAtCrux: !offer.imperial`, so
     these resolve in one call. `odds` measured that at 0.0% of imperial cards against 32.8-58.4% of
     ordinary ones. Every arm asserts the bout resolved rather than assuming it.
   · `doFight` reads `d.rome` on an imperial offer to tick `fought`/`won`, so the trip is set up the
     way the game sets it up, and `d.rome.fought` is reset per bout where the arm wants independent
     draws.
   · A FRESH STATE PER BOUT. `odds` lost four probes to one fighter reused across hundreds of bouts:
     `lasting`, `strain`, `form`, `wear`, `scars`, `regard` and `defiance` accumulate where the six
     stats do not, and the man decayed in ways `winChance` cannot see.
   · ARM E is run on three seed prefixes. Two findings on this project died for being read off 24
     houses and one of them was a maximum.

   WHAT IT FOUND, at 150 bouts a cell:

   #156 REFUTED ON ITS OWN CLAUSE. The falsification it named is satisfied: 99 in all six takes
   64-65% of imperial bouts and two of three in a trip about 70-72% of the time. And there is a
   gradient, a steep one — on the shape a house actually trains, against the card a returning house
   actually draws, key 78 wins 2.0%, key 92 wins 16.7%, key 99 wins 30.0%.

   WHY PLAYED HOUSES WIN 2.3% ANYWAY: the man they send is 83.9 across all six while the card is
   99.0 across all six. A house trains a focus and Rome does not. Over 459 identified imperial bouts
   the sender's key-stat mean was 94-101 in the top band and he won 10.7%; walk all six up together
   and the same card is taken 70.7%. The four stats nobody trains are most of the gap.

   AND THE FAULT #156 COULD NOT SEE. `makeImperialBout` draws at min(104, 100+runs) and again at 106
   when `ROME_TURNS.matched` fires. Both clamp to 99 on the KEY stats, so the card's key-stat mean
   reads 98.5-99.0 on a first visit and on a seventeenth while its ALL-SIX mean goes 96.6 to 99.0.
   #156's own headline figure ("the man met averages 98.7-98.9") was read off the statistic that
   hides the escalation. THIS PROBE MADE THE SAME MISTAKE TWICE before it caught it: the first draft
   of ARM A raised all six together, and the first draft of ARM E kept the PEAK key-stat mean of the
   men sent. Read on key stats alone the two arms disagreed by sixty points and both were quotable.

   #157 CONFIRMED, and its named repair shipped. 297 trips, 522 bouts, 12 won between 30 houses, 17
   of which never took a bout at Rome — and 24 ending at standing 100 with the city saying "they know
   your house in Rome". Charged for in men: 1.53 buried a trip at the bottom band against 2.01 at the
   top, and with the stakes FORCED so the cells differ in the word alone, a standard bout on the
   imperial sand buried 12.0% of an 80-stat man's outings against sine missione's 84.0%. */
import { serve, open } from "../harness.mjs";
const N = +(process.argv[2] || 200), SEED = process.argv[3] || "SUMMIT";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([N,SEED])=>{
  const A = window.__LVDVS;
  const keyMean = g => { const k = (A.CLASSES[g.cls]||{key:[]}).key || [];
    return k.length ? k.reduce((n,x)=>n+(g[x]||0),0)/k.length : 0; };
  const allMean = g => A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6;

  /* a house standing in Rome, set up the way the game sets it up */
  const trip = (seed, runs, triumphs, best) => {
    const d = A.newGameState("Su","clean",seed,null);
    d.fame = 4000; d.gold = 300000; d.week = 300;
    d.flags.romeRuns = runs; d.flags.romeTriumph = triumphs; d.flags.romeBest = best;
    d.rome = { travel:0, fought:0, won:0, due:d.week + 30 };
    return d;
  };
  /* the man, built to order and put in the yard */
  const man = (d, stat, cls) => {
    const g = A.genGladiator(d, A.qForStat(stat));
    for(const k of A.STATS) g[k] = Math.round(Math.min(99, stat));
    if(cls) g.cls = cls;
    g.kit = A.kitFor(g.cls, 3);
    g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99;
    g.morale = 90; g.heart = 90; g.wins = 30; g.losses = 2; g.pfame = 120;
    d.gladiators.push(g); return g;
  };
  /* one imperial bout, fresh state, resolved and scored */
  const bout = (seed, stat, runs, triumphs, best, tactic, cls) => {
    const d = trip(seed, runs, triumphs, best);
    const g = man(d, stat, cls);
    const off = A.makeImperialBout(d);
    d.games = { festival:"the imperial games", offers:[off], week:d.week };
    const q = A.winChance(g, off.opp, 0, tactic || "aggressive", null);
    const res = A.doFight(d, g.id, off, tactic || "aggressive", null, null, null, "none");
    if(!res || res.__err) return { err: res ? res.__err : "no result" };
    if(res.crux) return { crux:true };
    return { win:!!res.win, dead:!!res.dead, sine: off.stakes === "sine",
      oppKey:keyMean(off.opp), oppAll:allMean(off.opp), mineKey:keyMean(g), q,
      purse:off.purse, oppDied:!!(res.beats && res.A && res.B) };
  };

  /* ============ ARM A: IS THERE A GRADIENT? ============
     Walk the man sent up the scale, everything else held, and see whether the win rate moves. #156's
     claim was that it cannot — the card is pinned at the 99 clamp, so a house that improves cannot
     improve its odds.

     TWO SHAPES, AND THE FIRST DRAFT ONLY HAD THE WRONG ONE. Setting all six stats to the same number
     builds a man no house produces: a played gladiator trains a focus, so ARM E's men come to Rome
     at 94-101 on their CLASS'S KEY STATS and 83.9 across all six. Read on the key stats alone the two
     arms disagreed by sixty points and I nearly quoted both. `power` weights all six — str 3.55,
     tec 4.44, agi 3.02, end 2.20, dis 1.07, sho 0.00 per ten points — so the four he did not train
     are most of him. The `shape` ladder holds the key stats at the step and the other four eighteen
     points below it, which is the gap ARM E measured.

     AND TWO CARDS. `makeImperialBout` draws at `min(104, 100 + romeRuns)` and `ROME_TURNS.matched`
     sets `romeHardCard`, which draws at 106 with another ri(4,9) wins on top. Both clamp to 99 on the
     key stats, so the card's key mean reads 99.0 whether it is a first visit or a seventeenth — the
     difference is entirely in the four stats nobody looks at, and it is invisible on the panel and in
     any measurement that reads key stats. The ALL-SIX mean of the card is printed beside every row. */
  const grad = [];
  for(const shape of ["flat","trained"]){
    for(const [runs, hard] of [[0,0],[9,1]]){
      for(const stat of [70, 78, 86, 92, 96, 99]){
        let win = 0, ran = 0, dead = 0, sine = 0, q = 0, ok = 0, oppK = 0, oppA = 0, mineA = 0, crux = 0;
        for(let i=0;i<N;i++){
          const d = trip(`${SEED}-G-${shape}-${runs}${hard}-${stat}-${i}`, runs, 0, 0);
          if(hard) d.flags.romeHardCard = 1;
          const g = man(d, stat);
          if(shape === "trained"){
            const key = new Set((A.CLASSES[g.cls]||{key:[]}).key || []);
            for(const k of A.STATS) if(!key.has(k)) g[k] = Math.max(8, Math.round(stat - 18));
          }
          const off = A.makeImperialBout(d);
          d.games = { festival:"the imperial games", offers:[off], week:d.week };
          const qq = A.winChance(g, off.opp, 0, "aggressive", null);
          const res = A.doFight(d, g.id, off, "aggressive", null, null, null, "none");
          if(!res || res.__err) continue;
          if(res.crux){ crux++; continue; }
          ran++; if(res.win) win++; if(res.dead) dead++; if(off.stakes === "sine") sine++;
          q += qq; oppK += keyMean(off.opp); oppA += allMean(off.opp); mineA += allMean(g); ok++;
        }
        grad.push({ shape, runs, hard, stat, ran, crux, win, dead, sine,
          pct: ran ? win/ran*100 : null, deadPct: ran ? dead/ran*100 : null,
          quoted: ok ? q/ok*100 : null, oppKey: ok ? oppK/ok : null, oppAll: ok ? oppA/ok : null,
          mineAll: ok ? mineA/ok : null });
      }
    }
  }

  /* ============ ARM B: THE CEILING, AND WHETHER A TRIUMPH IS REACHABLE ============
     Ninety-nine in all six, best kit, the record of a man who has done nothing else — the free-grant
     trick turned on the fighter. A summit this man cannot take is not open to any house. Every
     tactic, because the word is the one free lever a player has left. */
  const ceil = [];
  for(const tac of ["aggressive","measured","defensive","showboat"]){
    let win = 0, ran = 0, dead = 0;
    for(let i=0;i<N;i++){
      const r = bout(`${SEED}-C-${tac}-${i}`, 99, 0, 0, 0, tac);
      if(r.crux || r.err) continue;
      ran++; if(r.win) win++; if(r.dead) dead++;
    }
    ceil.push({ tac, ran, win, dead, pct: ran ? win/ran*100 : null });
  }

  /* ============ ARM F: WHY THE TWO ARMS DISAGREE BY SIXTY POINTS ============
     ARM B's man at 99 wins 72% of his imperial bouts. A PLAYED house sending a man at 94-101 wins
     10.7% of 28. Same key stats, same card by key stats — sixty points unaccounted for, which is a
     number to explain before either arm is quoted. This turns ARM B's man into the played one a
     factor at a time, and the card into the card a returning house actually draws.

     THE TWO INVISIBLE ONES ARE THE POINT. `makeImperialBout` draws at `min(104, 100 + romeRuns)`
     and `ROME_TURNS.matched` sets `romeHardCard`, which draws at 106 and adds another ri(4,9) wins.
     Every one of those men clamps to 99 on the key stats, so the card's key mean reads 99.0 whether
     it is a first visit or a seventeenth. The ALL-SIX mean is printed beside it, which is where the
     difference actually lives. */
  const decomp = [];
  {
    const CELLS = [
      { nm:"ARM B's man, first visit",      runs:0, hard:0, heart:90, wins:30, losses:2, pfame:120, mor:90, fat:0 },
      { nm:"... on a ninth visit",          runs:9, hard:0, heart:90, wins:30, losses:2, pfame:120, mor:90, fat:0 },
      { nm:"... and the matched card",      runs:9, hard:1, heart:90, wins:30, losses:2, pfame:120, mor:90, fat:0 },
      { nm:"the played man's heart (67)",   runs:0, hard:0, heart:67, wins:30, losses:2, pfame:120, mor:90, fat:0 },
      { nm:"the played man's record",       runs:0, hard:0, heart:90, wins:17, losses:12, pfame:60, mor:90, fat:0 },
      { nm:"the played man's condition",    runs:0, hard:0, heart:90, wins:30, losses:2, pfame:120, mor:87, fat:10 },
      { nm:"all of it, ninth visit, matched", runs:9, hard:1, heart:67, wins:17, losses:12, pfame:60, mor:87, fat:10 },
    ];
    for(const C of CELLS){
      let ran = 0, win = 0, oppAll = 0, oppKey = 0, oppW = 0;
      for(let i=0;i<N;i++){
        const d = trip(`${SEED}-F-${C.nm.length}-${C.runs}${C.hard}${C.heart}${C.wins}${C.mor}-${i}`, C.runs, 0, 0);
        if(C.hard) d.flags.romeHardCard = 1;
        const g = man(d, 99);
        g.heart = C.heart; g.wins = C.wins; g.losses = C.losses; g.pfame = C.pfame;
        g.morale = C.mor; g.fatigue = C.fat;
        const off = A.makeImperialBout(d);
        d.games = { festival:"the imperial games", offers:[off], week:d.week };
        const res = A.doFight(d, g.id, off, "aggressive", null, null, null, "none");
        if(!res || res.__err || res.crux) continue;
        ran++; if(res.win) win++;
        oppAll += allMean(off.opp); oppKey += keyMean(off.opp); oppW += (off.opp.wins||0);
      }
      decomp.push({ ...C, ran, win, pct: ran ? win/ran*100 : null,
        oppAll: ran ? oppAll/ran : null, oppKey: ran ? oppKey/ran : null, oppWins: ran ? oppW/ran : null });
    }
  }

  /* ============ ARM C: WHAT THE STAKES COST, WHICH IS #157's SECOND HALF ============
     `romeSineOdds` decides the stakes and standing decides `romeSineOdds`, so the whole chain from
     standing to blood turns on whether a sine bout actually buries more men than a standard one.
     The stakes are forced here rather than drawn, so the two cells differ in the word and nothing
     else — a comparison of drawn stakes would confound the stakes with the standing that drew them. */
  const stakes = [];
  for(const st of ["standard","sine"]){
    for(const stat of [80, 99]){
      let ran = 0, dead = 0, win = 0;
      for(let i=0;i<N;i++){
        const d = trip(`${SEED}-S-${st}-${stat}-${i}`, 0, 0, 0);
        const g = man(d, stat);
        const off = A.makeImperialBout(d);
        off.stakes = st;                      /* forced, so the arms differ in the word alone */
        d.games = { festival:"the imperial games", offers:[off], week:d.week };
        const res = A.doFight(d, g.id, off, "aggressive", null, null, null, "none");
        if(!res || res.__err || res.crux) continue;
        ran++; if(res.win) win++; if(res.dead) dead++;
      }
      stakes.push({ st, stat, ran, win, dead,
        pct: ran ? win/ran*100 : null, deadPct: ran ? dead/ran*100 : null });
    }
  }

  /* ============ ARM D: THE LADDER OF STANDING, AND THE STAKES IT DRAWS ============
     What the card looks like at each rung a real house can stand on, and the sine share it draws.
     The share is `romeSineOdds` by construction, so this arm is the CHECK ON THE CONSTRUCTION: if
     the drawn share does not match the function, the chain #157 describes is not wired. */
  const ladder = [];
  for(const [runs, tri, best] of [[0,0,0],[1,0,0],[2,0,1],[4,0,1],[6,0,2],[9,0,2],[3,1,2],[5,2,3]]){
    const d0 = trip(`${SEED}-L`, runs, tri, best);
    let sine = 0, ran = 0, oppK = 0, purse = 0;
    for(let i=0;i<N;i++){
      const d = trip(`${SEED}-L-${runs}-${tri}-${best}-${i}`, runs, tri, best);
      const off = A.makeImperialBout(d);
      ran++; if(off.stakes === "sine") sine++;
      oppK += keyMean(off.opp); purse += off.purse;
    }
    ladder.push({ runs, tri, best,
      standing:A.romeStanding(d0), word:A.romeWord(d0),
      sineOdds:A.romeSineOdds(d0), sineDrawn: ran ? sine/ran : null,
      purseMult:A.romePurseMult(d0), oppKey: ran ? oppK/ran : null, purse: ran ? purse/ran : null,
      prize:A.romePrize(d0).name });
  }

  /* ============ ARM E: AND WHAT A PLAYED HOUSE ACTUALLY REACHES ============
     The rope, on three seed prefixes, with the ledger held up so the question is Rome and not
     solvency. Every trip is recorded with the standing it started on, the stakes drawn, what the
     house won, and what it buried — which is #157's count. */
  const houses = [];
  for(const pre of [`${SEED}-E1`, `${SEED}-E2`, `${SEED}-E3`]){
    for(let h=0; h<10; h++){
      const d = A.newGameState("Rm"+h, "clean", `${pre}-${h}`, null);
      const R = window.__ROPE;
      const trips = [];
      let cur = null, buried0 = 0;
      const best = { sent:0, sentAll:0, had:0, hadAll:0 };
      const bouts = [];
      for(let w=0; w<900; w++){
        if(d.over) break;
        d.gold = Math.max(d.gold, 200000);          /* the ledger held up — Rome, not solvency */
        const wasRome = !!d.rome;
        if(d.rome && !cur){
          cur = { start:d.week, standing:A.romeStanding(d), word:A.romeWord(d),
                  fought:0, won:0, sine:0, buried:0 };
          buried0 = (d.annals||[]).filter(a=>a.fate==="dead").length;
        }
        const card = d.rome && d.games && (d.games.offers||[]).find(o=>o.imperial);
        const wasF = d.rome ? d.rome.fought : 0;
        const wk = d.week;                     /* the rope ends the week; `d.week` moves under us */
        /* ---- THE MAN THE HOUSE ACTUALLY SENDS, which ARM A says is the whole question ----
           `takeBout` sorts by the mean of all six and sends men[0] to a single, so the man on the
           imperial card is the best fit man in the yard that week. Both are recorded: the best in
           the yard AND the best fit to fight, because an injured 94 and no 94 are different houses. */
        /* ---- WHO ACTUALLY FOUGHT, read off the game rather than reconstructed ----
           The first draft of this arm rebuilt `takeBout`'s pick by hand and then kept the PEAK of it
           over the whole run. It read a median best-sent of 94.1 and 21 of 30 houses sending a 92 or
           better, which against ARM A's ladder (a 92 wins 56.7%) predicts a win rate twenty-five
           times what the same houses actually took. A peak is not a typical, and a reconstruction is
           not a reading. Both fixed: every man in the yard is snapshotted before the week, and the
           man who fought is the one whose `lastFought` is this week afterwards. */
        const before = new Map(A.activeG(d).map(g=>[g.id, { key:keyMean(g), all:allMean(g),
          fat:g.fatigue||0, mor:g.morale||0, wins:g.wins||0, kit:A.kitMods ? null : null,
          lastFought:g.lastFought }]));
        { for(const g of A.activeG(d)){ best.had = Math.max(best.had, keyMean(g)); best.hadAll = Math.max(best.hadAll, allMean(g)); } }
        R.lanista(d);
        if(cur && card && d.rome && d.rome.fought > wasF){
          cur.fought = d.rome.fought; cur.won = d.rome.won;
          if(card.stakes === "sine") cur.sine++;
          /* `R.lanista` ENDS THE WEEK ITSELF, so `d.week` has already moved on by the time this
             runs and `lastFought === d.week` matched nought of 522 bouts. It is `wk`, the week the
             card was up. A match rate is printed below so a lookup that stops matching cannot pass
             as a house that sent nobody. */
          const fighter = (d.gladiators||[]).find(g=>g.lastFought === wk && before.has(g.id));
          const was = fighter ? before.get(fighter.id) : null;
          const kitWorth = g => { const k = (g && g.kit) || {};
            return Object.values(k).reduce((n,id)=> n + ((A.GEAR[id]||{}).price||0), 0); };
          bouts.push({ standing:cur.standing, sine:card.stakes==="sine",
            oppKey:keyMean(card.opp), oppWins:(card.opp.wins||0), oppHeart:(card.opp.heart||0),
            hard:!!(card.opp.wins||0 && false),
            kit: fighter ? kitWorth(fighter) : null, heart: fighter ? (fighter.heart||0) : null,
            oppKit: kitWorth(card.opp),
            key: was ? was.key : null, all: was ? was.all : null,
            fat: was ? was.fat : null, mor: was ? was.mor : null, wins: was ? was.wins : null,
            won: d.rome.won > (cur.wonSoFar||0) });
          cur.wonSoFar = d.rome.won;
          if(was) best.sent = Math.max(best.sent, was.key);
        }
        if(cur && !d.rome && wasRome){
          cur.buried = (d.annals||[]).filter(a=>a.fate==="dead").length - buried0;
          cur.end = d.week; trips.push(cur); cur = null;
        }
      }
      houses.push({ pre, h, end:d.week, over:d.over?d.over.kind:"alive",
        runs:A.romeRuns(d), triumphs:A.romeTriumphs(d), best:A.romeBest(d),
        standing:A.romeStanding(d), word:A.romeWord(d), trips, peak:best, bouts });
    }
  }

  return { grad, ceil, decomp, stakes, ladder, houses };
}, [N, SEED]);

const f1 = x => x==null ? "—" : x.toFixed(1);
const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : null; };

console.log(`\n  ARM A — is there a gradient? ${N} imperial bouts a step, two shapes of man and two cards\n`);
for(const shape of ["flat","trained"]){
  for(const [runs,hard] of [[0,0],[9,1]]){
    const rows = out.grad.filter(g=>g.shape===shape && g.runs===runs && g.hard===hard);
    console.log(`  ${shape==="flat" ? "all six raised together (a man no house builds)" : "the shape a house trains — key stats at the step, the other four 18 below"}`
      + ` · ${runs ? "a ninth visit, matched card" : "a first visit"}`);
    console.log(`    key stats   all six   the card: key / all six   the quote   won on the sand   died`);
    for(const g of rows)
      console.log(`    ${String(g.stat).padStart(9)}   ${f1(g.mineAll).padStart(7)}   ${(f1(g.oppKey)+" / "+f1(g.oppAll)).padStart(22)}   ${(f1(g.quoted)+"%").padStart(9)}   ${(f1(g.pct)+"% of "+g.ran).padStart(15)}   ${(f1(g.deadPct)+"%").padStart(5)}`);
    console.log("");
  }
}

console.log(`\n  ARM B — the ceiling: 99 in all six, the best kit the game sells, ${N} bouts a word\n`);
for(const c of out.ceil){
  const p = c.pct/100, tri = p*p*(3-2*p);   /* two of three, the triumph gate */
  console.log(`    ${c.tac.padEnd(11)} won ${f1(c.pct)}% of ${c.ran} · died ${f1(c.dead/c.ran*100)}%`
    + `  →  two of three in one trip: ${(tri*100).toFixed(2)}%`);
}

console.log(`\n  ARM F — turning ARM B's man into the played one, and the card into the one a returning house draws\n`);
console.log(`  cell                              won            the card: key   all six   his record`);
for(const c of out.decomp)
  console.log(`  ${c.nm.padEnd(33)} ${(f1(c.pct)+"% of "+c.ran).padStart(12)}   ${f1(c.oppKey).padStart(12)}   ${f1(c.oppAll).padStart(7)}   ${f1(c.oppWins).padStart(10)} wins`);

console.log(`\n  ARM C — what the word costs, stakes FORCED so the arms differ in nothing else\n`);
console.log(`  stakes     man sent   won        buried`);
for(const s of out.stakes)
  console.log(`  ${s.st.padEnd(10)} ${String(s.stat).padStart(8)}   ${(f1(s.pct)+"%").padStart(6)}   ${(f1(s.deadPct)+"% of "+s.ran).padStart(14)}`);

console.log(`\n  ARM D — the ladder of standing and the card it draws (${N} cards a rung)\n`);
console.log(`  runs/tri/best   standing   what Rome says                     sine: said   drawn   purse x   the card   the prize next`);
for(const L of out.ladder)
  console.log(`  ${`${L.runs}/${L.tri}/${L.best}`.padEnd(15)} ${String(L.standing).padStart(8)}   ${L.word.padEnd(33)} ${(f1(L.sineOdds*100)+"%").padStart(10)}   ${(f1(L.sineDrawn*100)+"%").padStart(6)}   ${L.purseMult.toFixed(2)}   ${f1(L.oppKey).padStart(8)}   ${L.prize}`);

const HS = out.houses;
const allTrips = HS.flatMap(h=>h.trips);
console.log(`\n  ARM E — ${HS.length} played houses over three seed prefixes, 900w, the ledger held up\n`);
console.log(`  trips taken:            ${allTrips.length} over ${HS.length} houses (median ${med(HS.map(h=>h.runs))} a house, most ${Math.max(...HS.map(h=>h.runs))})`);
console.log(`  imperial bouts fought:  ${allTrips.reduce((s,t)=>s+t.fought,0)}`);
console.log(`  ... won:                ${allTrips.reduce((s,t)=>s+t.won,0)}`);
console.log(`  triumphs banked:        ${HS.reduce((s,h)=>s+h.triumphs,0)} (a triumph wants two of three in one trip)`);
console.log(`  houses that ever won a bout there: ${HS.filter(h=>h.best>0).length} of ${HS.length}`);
console.log(`  men buried on the imperial sand:   ${allTrips.reduce((s,t)=>s+t.buried,0)}`);
const bands = {};
for(const t of allTrips){ const b = t.standing>=78?"they know your house":t.standing>=50?"Rome has heard of you":t.standing>=22?"half recognise":"nobody at all";
  (bands[b] = bands[b] || { n:0, fought:0, won:0, sine:0, buried:0 });
  bands[b].n++; bands[b].fought+=t.fought; bands[b].won+=t.won; bands[b].sine+=t.sine; bands[b].buried+=t.buried; }
console.log(`\n  and by what Rome says about the house, which is #157's count:`);
console.log(`  what Rome says            trips   bouts   won   sine drawn   buried   buried a trip`);
for(const [k,v] of Object.entries(bands))
  console.log(`  ${k.padEnd(24)} ${String(v.n).padStart(6)}  ${String(v.fought).padStart(6)}  ${String(v.won).padStart(4)}   ${(v.fought?f1(v.sine/v.fought*100)+"%":"—").padStart(10)}   ${String(v.buried).padStart(6)}   ${(v.n?(v.buried/v.n).toFixed(2):"—").padStart(13)}`);
console.log(`\n  AND THE MAN THE HOUSE SENDS, which is what ARM A says decides it:`);
const sents = HS.map(h=>h.peak.sent).filter(x=>x>0);
const hads  = HS.map(h=>h.peak.had).filter(x=>x>0);
console.log(`  best key-stat mean ever SENT to the imperial sand: median ${f1(med(sents))} · spread ${sents.map(x=>x.toFixed(0)).sort((a,b)=>a-b).join(" ")}`);
console.log(`  best key-stat mean ever HELD in the yard:          median ${f1(med(hads))} · spread ${hads.map(x=>x.toFixed(0)).sort((a,b)=>a-b).join(" ")}`);
console.log(`  the card is drawn at ${f1(out.ladder[0].oppKey)}-${f1(out.ladder[out.ladder.length-1].oppKey)}, so read those against ARM A's ladder`);
console.log(`  houses that ever sent a man at 92 or better: ${sents.filter(x=>x>=92).length} of ${HS.length}  ·  at 86 or better: ${sents.filter(x=>x>=86).length}`);
const AB = HS.flatMap(h=>h.bouts).filter(b=>b.key!=null);
console.log(`\n  AND EVERY IMPERIAL BOUT, BY THE MAN WHO ACTUALLY WALKED OUT — set this against ARM A`);
console.log(`  (${AB.length} of ${HS.flatMap(h=>h.bouts).length} bouts matched a fighter; the rest could not be identified)`);
console.log(`  man's key stats   bouts   won        died-arm figures below are the sender's state going in`);
const BANDS = [[0,74],[74,82],[82,88],[88,94],[94,101]];
for(const [lo,hi] of BANDS){
  const g = AB.filter(b=>b.key>=lo && b.key<hi);
  if(!g.length) continue;
  const w = g.filter(b=>b.won).length;
  console.log(`  ${(lo+"-"+hi).padEnd(17)} ${String(g.length).padStart(5)}   ${(f1(w/g.length*100)+"%").padStart(6)}`
    + `   all six ${f1(med(g.map(b=>b.all)))} · fatigue ${f1(med(g.map(b=>b.fat)))} · morale ${f1(med(g.map(b=>b.mor)))} · heart ${f1(med(g.map(b=>b.heart)))} · record ${f1(med(g.map(b=>b.wins)))} wins · kit ${f1(med(g.map(b=>b.kit)))}d`
    + `   ·  the card ${f1(med(g.map(b=>b.oppKey)))} · heart ${f1(med(g.map(b=>b.oppHeart)))} · ${f1(med(g.map(b=>b.oppWins)))} wins · kit ${f1(med(g.map(b=>b.oppKit)))}d`);
}
console.log(`  the man sent, pooled: median key stats ${f1(med(AB.map(b=>b.key)))} · median fatigue ${f1(med(AB.map(b=>b.fat)))} · median morale ${f1(med(AB.map(b=>b.mor)))} · median record ${f1(med(AB.map(b=>b.wins)))} wins`);
console.log(`  ARM B's man, for contrast: key stats 99 · fatigue 0 · morale 90 · record 30 wins · tier-3 kit`);
console.log(`\n  raw, every house:`);
console.log(`    seed        ended   ending        runs  best  triumphs   standing   best sent   best held   what Rome says`);
for(const h of HS)
  console.log(`    ${h.pre.padEnd(11)} ${String(h.end).padStart(5)}   ${String(h.over).padEnd(12)}  ${String(h.runs).padStart(4)}  ${String(h.best).padStart(4)}  ${String(h.triumphs).padStart(8)}   ${String(h.standing).padStart(8)}   ${f1(h.peak.sent).padStart(9)}   ${f1(h.peak.had).padStart(9)}   ${h.word}`);

await browser.close(); server.close();
