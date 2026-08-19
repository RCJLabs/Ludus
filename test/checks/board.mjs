/* THE PRICE ON THE BOARD, AGAINST THE PRICE IN THE PURSE (#162)

   #162 opened on a coverage count — `oddsFor`, `oddsWord`, `bookOf`, `foeSeen` and `foeTactic`
   reached by 0 of 67 checks — and the clause named #150's shape: a panel quoting a number the
   engine will not roll on. It falsified if the `odds` check's three-band comparison already covered
   what these five do. It does not: `odds` holds the PROBABILITY against the sand and never looks at
   the PRICE, which is a different arithmetic with two terms the panel did not have.

   WHAT WAS MEASURED, off the game's own payout sentence ("The bookmakers pay N denarii at X to 1"),
   parsed out of `settleBet`'s return and set beside the game's own quote. 24 won wagers a cell at
   400d, and the two agreed in exactly one of eight cells:

     shrewd   eye     panel     paid     400d pays    the panel implied
     no        0      1.95      1.95        778d           778d          the one cell that agreed
     no        1      1.95      1.84        736d           778d          42d short
     no        3      1.95      1.62        650d           778d         128d short
     no        6      1.95      1.30        522d           778d         256d short — a third of it
     yes       0      1.95      2.08        832d           778d          54d MORE than quoted
     yes       6      1.95      1.39        557d           778d         221d short

   Two terms, both missing from the panel. `bookEye` shortens the board 5.5% for every wager the
   house has won, to a third off, and `lanVig` halves the vig for a lanista carrying `shrewd`, which
   is earned at five wagers won. The player WAS told about the eye — `bookEyeWord` prints in the
   wager row from the first won wager — while the number beside it did not move.

   AND IT IS NOT A CORNER. The rope had never placed a wager (every call passed `null` for the bet),
   so nothing in this suite had ever settled one. With a `bet` lever on it, 24 houses over three seed
   prefixes wagering 5% of the purse on every single bout: 22 opened the eye by median week 2 — the
   first won wager — 15 earned `shrewd` by median week 14, and 14 sat at the third-off cap by median
   week 33. The two arms lived 146w against 125w median, so the wager is not a fuse; it is simply
   priced wrong on the panel from about the second week of any house that takes one.

   THE THIRD FAULT WAS THE PROBABILITY, and it ran the other way. The panel priced the INFORMED
   chance — prep edge in, the foe's tactic in once he had been watched — while `makeBet` stored
   `winChance(g, opp, 0, tactic)`, which knows neither:

     blind      panel 45.2%   wager 45.2%    1.95 against 1.95        agreed
     watched    panel 41.2%   wager 45.2%    2.14 against 1.95        77d over on 400d
     drilled    panel 80.9%   wager 45.2%    1.09 against 1.95       344d UNDER on 400d
     both       panel 78.3%   wager 45.2%    1.12 against 1.95       329d under

   Backwards, and worst for the player the design is built around: six weeks of drill made the panel
   quote 1.09 to 1 on a board that was offering 1.95, two inches above a sentence reading "It does
   not know your man has drilled for this one, and that is the whole of what a wager is for."

   WHAT THIS CHECK HOLDS:
     1. THE QUOTE IS THE PAYOUT, over the whole grid of trait and eye, taken off the engine's own
        sentence rather than off any formula written here. On the unfixed build this fails in seven
        of eight cells.
     2. THE PRICE MOVES WITH BOTH TERMS. A price that has gone back to a constant passes bar 1 only
        if `settleBet` went constant with it, so the two are held apart.
     3. THE BOARD IS STRUCK ON THE SHEET. `betChance` must be blind to prep and to the watch, and
        the informed chance must differ from it once either is bought — otherwise the drill is
        buying nothing and the wager row's sentence is false.
     4. THE PAYOUT IS THE ARITHMETIC IT PRINTS: N denarii is the stake at the odds in the sentence.
     5. THE EYE OPENS ON A WON WAGER and never on a lost one, and the words track the number.
     6. `bookOf` DERIVES WHAT THE RECORD BOOK SHOWS, which was reached by nothing.
     7. `foeSeen` and `foeTactic`: a read is bought, not guessed, and the man fights the same way
        every time he is asked. */

import { hasHandle } from "../harness.mjs";

export const name = "board";
export const describe = "the price the bookmakers quote is the price they pay, and it is struck on the sheet";

export async function run({ p }){
  if(!await hasHandle(p))
    return { pass:false, why:"no test handle — build with `node build.js --test`", lines:[] };

  const out = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [], lines = [];
    const mean = f => A.STATS.reduce((s,k)=>s+(f[k]||0),0)/6;
    /* the engine's own sentence. Printed raw below, so a regex that stopped matching cannot pass
       as a zero gap — which is how three findings on this project died. */
    const PAID = /The bookmakers pay (\d+) denarii at ([\d.]+) to 1\./;

    const state = seed => { const d = A.newGameState("Bo","clean",seed,null);
      d.fame = 1200; d.gold = 90000; d.week = 60; return d; };
    const mkOpp = m => { const o = A.genOpponent(3, A.qForStat(m));
      for(const k of A.STATS) o[k] = Math.round(Math.min(99, m));
      o.kit = A.kitFor(o.cls, 3); return o; };
    const mkOffer = (d, opp, ref) => { const o = { id:d.nextId++, tier:3, festival:"a bench", opp,
      oppRef: ref ? { fid:7001, house:"a house" } : null,
      rematch:false, grudgeM:false, stakes:"standard", purse:900 };
      d.games = { festival:"a bench", offers:[o], week:d.week }; return o; };
    const twin = (d, opp) => { const g = A.genGladiator(d, A.qForStat(mean(opp)));
      for(const k of A.STATS) g[k] = opp[k];
      g.cls = opp.cls; g.kit = opp.kit; g.traits = (opp.traits||[]).slice();
      g.heart = opp.heart; g.morale = opp.morale; g.pfame = opp.pfame; g.wins = opp.wins||0;
      g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99;
      d.gladiators.push(g); return g; };

    /* ======== 1 & 2. THE QUOTE IS THE PAYOUT, AND THE PRICE MOVES WITH BOTH TERMS ======== */
    {
      const STAKE = 400;
      const seen = [];
      for(const shrewd of [false, true]){
        for(const eye of [0, 1, 3, 6]){
          const d = state(`BOARD-${shrewd?"s":"p"}-${eye}`);
          d.lanista.traits = shrewd ? ["shrewd"] : [];
          d.flags.bookEye = eye;
          if(A.hasLT(d,"shrewd") !== shrewd)
            bad.push(`the control's own control: asked for shrewd ${shrewd} and \`hasLT\` says ${A.hasLT(d,"shrewd")}`);
          const opp = mkOpp(70);
          const off = mkOffer(d, opp);
          const g = twin(d, opp);
          const chance = A.betChance(g, opp, "aggressive");
          const said = A.oddsFor(d, chance);
          /* `settleBet` mutates — the eye it is being measured at is the one on the clone */
          const q = A.clone(d);
          const lines2 = A.settleBet(q, A.activeG(q)[0], off, { amount:STAKE, against:false, chance }, true, { crowd:50 });
          const line = (lines2||[]).find(x=>PAID.test(x));
          if(!line){
            bad.push(`a won wager at shrewd ${shrewd} eye ${eye} wrote no payout sentence — \`settleBet\` `
              + `returned ${JSON.stringify(lines2)}, and every bar in this section is read off that sentence`);
            continue;
          }
          const m = line.match(PAID), paid = +m[2], pay = +m[1];
          seen.push({ shrewd, eye, said, paid, pay, line });
          if(Math.abs(paid - +said.toFixed(2)) > 0.005)
            bad.push(`the panel quotes ${said.toFixed(2)} to 1 at shrewd ${shrewd} eye ${eye} and the book `
              + `paid ${paid.toFixed(2)} — on ${STAKE}d that is ${pay}d against the ${Math.round(STAKE*said)}d `
              + `the quote implies. \`oddsFor\` and \`settleBet\` must be the same function: before v3.51.0 `
              + `the panel used the constant vig and knew nothing of \`bookEye\` or \`lanVig\`, and the two `
              + `agreed in one of these eight cells`);
          /* 4. the payout is the arithmetic it prints — against the UNROUNDED price, because
             `oddsWord` prints two decimals and the purse is paid off the full number. The first
             draft of this bar compared against the printed two decimals and failed on three cells
             by a denarius or two, which is `imperial`'s lesson: round the expectation the same way
             the row does, or do not round it at all. */
          if(Math.abs(pay - Math.round(STAKE * said)) > 0.5)
            bad.push(`the sentence says ${pay} denarii at ${paid} to 1 on a ${STAKE}d wager, and `
              + `${STAKE} at ${said} is ${Math.round(STAKE*said)}`);
        }
      }
      for(const x of seen)
        lines.push(`shrewd ${String(x.shrewd).padEnd(5)} eye ${x.eye}: the panel quotes ${A.oddsWord(x.said)}`
          + ` · the game wrote "${x.line}"`);
      /* 2. and neither term may be a constant */
      const flat = seen.filter(x=>!x.shrewd);
      if(flat.length >= 2 && flat.every(x=>Math.abs(x.paid - flat[0].paid) < 0.005))
        bad.push(`the price is the same at every value of the eye (${flat.map(x=>x.paid).join(", ")}) — `
          + `\`bookEye\` shortens the board 5.5% a won wager to a third off, and a price that ignores it `
          + `is the fault this check was written for, moved one function along`);
      const pair = [seen.find(x=>!x.shrewd && x.eye===0), seen.find(x=>x.shrewd && x.eye===0)];
      if(pair[0] && pair[1] && Math.abs(pair[0].paid - pair[1].paid) < 0.005)
        bad.push(`\`shrewd\` moves the price nought (${pair[0].paid} against ${pair[1].paid}) — \`lanVig\` `
          + `halves the vig for it, and it is the only thing five won wagers buy`);
      if(pair[0] && pair[1] && pair[1].paid <= pair[0].paid)
        bad.push(`the shrewd lanista is quoted ${pair[1].paid} against an ordinary one's ${pair[0].paid} — `
          + `a halved vig must pay MORE, not less`);
    }

    /* ======== 3. THE BOARD IS STRUCK ON THE SHEET, NOT ON WHAT YOU KNOW ======== */
    {
      const d = state("BOARD-SHEET");
      const opp = mkOpp(70);
      const off = mkOffer(d, opp, true);
      const g = twin(d, opp);
      const rows = [];
      for(const [nm, watch, drill] of [["blind",0,0], ["watched",1,0], ["drilled",0,1], ["both",1,1]]){
        const e = A.clone(d);
        const oe = e.games.offers[0], ge = A.activeG(e).find(x=>x.id===g.id);
        if(watch && !A.watchHim(e, oe))
          bad.push(`\`watchHim\` refused to sell a reading at ${e.gold}d — the "${nm}" arm never moved, `
            + `and an arm that never moves reads as agreement`);
        if(drill) ge.prep = { fid:7001, house:"a house", name:"the man on the bill", weeks:A.PREP_MAX, since:1 };
        const prep = A.prepFor(e, ge, oe);
        if(drill && prep <= 0)
          bad.push(`the drilled arm reads a prep edge of ${prep} — \`prepFor\` wants `
            + `\`offer.oppRef.fid === g.prep.fid\`, and an arm whose subject never moved cannot fail`);
        const foeTac = (oe.watchedTac || (A.foeSeen(e, oe) ? A.foeTactic(oe.opp) : null)) || null;
        if(watch && !foeTac)
          bad.push(`the watched arm got no reading on how he means to fight it — \`foeSeen\` says `
            + `${A.foeSeen(e, oe)} after \`watchHim\` took ${d.gold - e.gold}d for it`);
        if(!watch && !drill && foeTac)
          bad.push(`a blind offer already knows the other man fights ${foeTac} — a read is bought, not guessed`);
        const pBoard = A.betChance(ge, oe.opp, "aggressive");
        const pMine  = A.winChance(ge, oe.opp, prep, "aggressive", foeTac);
        rows.push({ nm, prep, foeTac, pBoard, pMine,
          qBoard:A.oddsFor(e, pBoard), qMine:A.oddsFor(e, pMine) });
      }
      const blind = rows[0];
      for(const r of rows){
        lines.push(`${r.nm.padEnd(8)} prep ${r.prep.toFixed(2)} · his tactic ${String(r.foeTac||"—").padEnd(11)}`
          + ` · the board ${(r.pBoard*100).toFixed(1)}% at ${A.oddsWord(r.qBoard)}`
          + ` · your own read ${(r.pMine*100).toFixed(1)}% at ${A.oddsWord(r.qMine)}`);
        if(Math.abs(r.pBoard - blind.pBoard) > 1e-9)
          bad.push(`the board's chance moved from ${(blind.pBoard*100).toFixed(1)}% to `
            + `${(r.pBoard*100).toFixed(1)}% when the house bought a reading ("${r.nm}"). \`betChance\` `
            + `is what the wager is placed on and it must be blind to prep and to the watch — the wager `
            + `row says so in as many words, and pricing the panel off the informed number quoted 1.09 `
            + `to 1 on a board that was offering 1.95`);
      }
      const drilled = rows.find(r=>r.nm==="drilled");
      if(drilled && Math.abs(drilled.pMine - drilled.pBoard) < 0.01)
        bad.push(`six weeks of drill moved the house's own reading ${(Math.abs(drilled.pMine-drilled.pBoard)*100).toFixed(2)} `
          + `points off the board's. If the two are the same number there is nothing a wager is for`);
      const watched = rows.find(r=>r.nm==="watched");
      if(watched && Math.abs(watched.pMine - watched.pBoard) < 0.005)
        bad.push(`having him watched moved the house's own reading nought against the board's — `
          + `\`winChance\`'s \`foeTac\` term is what the watch buys on the odds`);
    }

    /* ======== 5. THE EYE OPENS ON A WON WAGER, AND THE WORDS TRACK THE NUMBER ======== */
    {
      const d = state("BOARD-EYE");
      const opp = mkOpp(70), off = mkOffer(d, opp), g = twin(d, opp);
      const bet = { amount:200, against:false, chance:A.betChance(g, opp, "aggressive") };
      const won = A.clone(d), lost = A.clone(d);
      A.settleBet(won,  A.activeG(won)[0],  off, bet, true,  { crowd:50 });
      A.settleBet(lost, A.activeG(lost)[0], off, bet, false, { crowd:50 });
      const eW = (won.flags.bookEye||0), eL = (lost.flags.bookEye||0);
      lines.push(`the eye after one wager: won ${eW} · lost ${eL} · won bets on the lanista ${won.lanista.wonBets||0}`);
      if(eW !== 1)
        bad.push(`a won wager left the eye at ${eW} — every wager the house wins shortens the board, `
          + `and the reachability figure in this head (22 of 24 houses by week 2) is counted off it`);
      if(eL !== 0)
        bad.push(`a LOST wager moved the eye to ${eL} — the book shortens for what it has paid out, not `
          + `for what it has taken`);
      if((won.lanista.wonBets||0) !== 1)
        bad.push(`a won wager left \`wonBets\` at ${won.lanista.wonBets||0} — \`shrewd\` is earned off it`);
      const words = [];
      for(const e of [0,1,3,6,9]){
        const q = A.clone(d); q.flags.bookEye = e;
        words.push({ e, word:A.bookEyeWord(q), mult:A.bookEye(q) });
      }
      lines.push(`the eye's word against its number: ` + words.map(x=>`${x.e} → ${x.mult.toFixed(3)} "${x.word||"nothing said"}"`).join(" · "));
      if(words[0].word) bad.push(`a house that has never won a wager is being told the book is watching it`);
      for(let i=1;i<words.length;i++){
        if(!words[i].word)
          bad.push(`the book has shortened the board to ${words[i].mult.toFixed(3)} at eye ${words[i].e} and says nothing about it`);
        if(words[i].mult > words[i-1].mult)
          bad.push(`the board is LONGER at eye ${words[i].e} than at ${words[i-1].e} `
            + `(${words[i].mult.toFixed(3)} against ${words[i-1].mult.toFixed(3)})`);
      }
      const cap = words[words.length-1].mult;
      if(cap < 0.66 - 1e-9)
        bad.push(`the eye takes ${((1-cap)*100).toFixed(1)}% off the board — the comment over \`bookEye\` `
          + `says it never goes past a third, and a book that pays a fifth of the quote is not a book`);
    }

    /* ======== 6. WHAT THE RECORD BOOK DERIVES ======== */
    {
      const d = state("BOARD-BOOK");
      const K0 = A.bookOf(d);
      if(!K0 || !K0.B) bad.push(`\`bookOf\` gave nothing back for a founding house — the record book panel reads it`);
      else if(K0.winPc !== 0 || K0.avgCrowd !== 0)
        bad.push(`a house that has fought nothing reads ${K0.winPc}% of nothing at a crowd of ${K0.avgCrowd}`);
      /* three bouts booked by hand through the game's own `bookBout`, two won */
      /* `bookBout(d, o)` takes TWO arguments. The first draft passed four — the gladiator landed
         in `o`, so `o.win`, `o.crowd` and `o.rounds` were all undefined and the book counted three
         bouts at nought per cent, nought crowd and nought rounds. Every bar below would have held
         against a book that had recorded nothing at all. */
      A.bookBout(d, { win:true,  crowd:60, rounds:8,  purse:900, tier:3, cls:"Murmillo", stakes:"standard" });
      A.bookBout(d, { win:true,  crowd:80, rounds:10, purse:900, tier:3, cls:"Murmillo", stakes:"standard" });
      A.bookBout(d, { win:false, crowd:40, rounds:6,  purse:0,   tier:3, cls:"Murmillo", stakes:"standard" });
      const K = A.bookOf(d);
      lines.push(`the book after three bouts: ${K.B.n} booked · ${K.winPc}% won · crowd ${K.avgCrowd}`
        + ` · ${K.avgRounds} rounds · ${K.perBout}d a bout`);
      if(K.B.n !== 3) bad.push(`three bouts booked and the record book counts ${K.B.n}`);
      if(K.winPc !== 67) bad.push(`two wins in three reads ${K.winPc}% in the record book`);
      if(K.avgCrowd !== 60) bad.push(`crowds of 60, 80 and 40 average ${K.avgCrowd} in the record book`);
      if(K.avgRounds !== "8.0") bad.push(`8, 10 and 6 rounds average ${K.avgRounds} in the record book`);
      if(K.rank({ a:{n:5,w:3}, b:{n:3,w:3} }).length !== 1)
        bad.push(`\`rank\` is showing a line off three bouts — it filters at four, because the panel `
          + `puts these up as findings and three bouts is not one`);
      if(typeof K.rate !== "function" || K.rate({n:0,w:0}) !== 0)
        bad.push(`\`rate\` does not answer 0 for a line with no bouts on it`);
    }

    /* ======== 7. THE MAN ACROSS THE SAND IS A FACT, NOT A COIN ======== */
    {
      const d = state("BOARD-FOE");
      const opp = mkOpp(70);
      const off = mkOffer(d, opp);
      if(A.foeSeen(d, off)) bad.push(`an unwatched offer with no house behind it already reads as seen`);
      const t1 = A.foeTactic(opp), t2 = A.foeTactic(opp), t3 = A.foeTactic(A.clone(opp));
      if(t1 !== t2 || t1 !== t3)
        bad.push(`the same man fights ${t1}, then ${t2}, then ${t3} — his tactic is a fact about how he `
          + `is built and what he has survived, and a read that changes between two askings is worth nothing`);
      const gold = d.gold;
      if(!A.watchHim(d, off)) bad.push(`\`watchHim\` would not sell a reading to a house holding ${gold}d`);
      if(!A.foeSeen(d, off)) bad.push(`\`foeSeen\` still says no after the house paid ${gold - d.gold}d to have him watched`);
      if(off.watchedTac !== t1)
        bad.push(`the watch reported he fights ${off.watchedTac} and \`foeTactic\` says ${t1} — what is paid `
          + `for and what happens must be the same word`);
      const spread = {};
      for(let i=0;i<60;i++){
        const o = A.genOpponent(3, A.qForStat(50 + (i%5)*12));
        const w = A.foeTactic(o); spread[w] = (spread[w]||0)+1;
      }
      lines.push(`sixty men off the generator fight: ` + Object.entries(spread).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")
        + ` · the watch on this one said "${A.FOE_TACTIC_WORD ? A.FOE_TACTIC_WORD[t1] : t1}"`);
      if(Object.keys(spread).length < 2)
        bad.push(`sixty generated men all fight ${Object.keys(spread)[0]} — the read costs coin and must `
          + `separate them, which is the fault the tempering over \`foeTactic\` was written for`);
      const top = Math.max(...Object.values(spread));
      if(top > 54)
        bad.push(`${top} of 60 generated men fight the same way, so the reading is nearly free information`);
    }

    return { bad, lines };
  });

  return { pass: out.bad.length === 0, why: out.bad.slice(0,3).join("; ") || null, lines: out.lines };
}
