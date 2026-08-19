/* THE BOARD'S PRICE AGAINST WHAT THE BOOK PAYS (#162)

   #162 opened on a coverage count: `oddsFor`, `oddsWord`, `bookOf`, `foeSeen` and `foeTactic` are
   reached by 0 of 67 checks, and the one check that touches the odds panel (`odds`) compares the
   PROBABILITY against the sand at three coarse bands and never looks at the PRICE at all. Its clause
   named #150's shape — a panel quoting a number the engine will not roll on — and asked whether the
   same thing happens here on a bigger surface.

   Reading the source there are three places the two can part, and this probe measures each:

     THE VIG.   The panel prints `oddsWord(oddsFor(p))`, and `oddsFor` is
                  Math.max(1.05, (1/clamp(p,0.02,0.98)) * (1 - VIG))          [src:13666]
                with VIG the constant 0.12. `settleBet` does not call it; it inlines
                  Math.max(1.05, (1/clamp(...,0.02,0.98)) * (1 - lanVig(d)) * bookEye(d))  [src:13675]
                and `lanVig` is 0.06 for a lanista carrying `shrewd`, which is EARNED AT FIVE WAGERS
                WON [src:9404]. So the panel's vig is right until the player is good at this and wrong
                after.
     THE EYE.   `bookEye` shortens the board 5.5% per wager the house has won, to a third off, and
                comes back at 34% a week after three quiet weeks [src:13486, 16588]. Nothing on the
                panel's number knows about it. The player IS told in words — `bookEyeWord` sits in the
                wager row — but the price beside it does not move.
     THE ODDS.  The panel prices `p` off the informed man: prep edge in, the foe's tactic in if he has
                been watched or drilled against [src:25057]. `makeBet` stores
                  chance: winChance(g, opp, 0, tactic)                        [src:18938]
                — no prep, no read. THAT PART IS DESIGN and the panel says so in prose two inches
                below: "The board is struck on the sheet ... It does not know you have drilled for
                this man and had him watched, and that is the whole of what a wager is for."
                The question this arm answers is not whether the two probabilities differ — they are
                meant to — but whether the NUMBER PRINTED AS THE BOARD'S PRICE is struck on the
                board's probability or on the player's.

   INSTRUMENT NOTES:
   · ARM A copies NO formula. The quoted side is the game's own `oddsWord(oddsFor(...))` off the
     handle; the paid side is parsed out of the sentence `settleBet` itself writes into `res.sum`
     ("The bookmakers pay N denarii at X to 1"). Two strings the game produced, compared. The parse
     is printed raw on the first row of every cell so a regex that stopped matching cannot pass as a
     zero gap.
   · ARM B has to reproduce two expressions, because both live inside the React component and are
     not reachable from the handle. Both are quoted verbatim above with their line numbers, and both
     are printed per row.
   · every cell prints its spread, not a mean.

   WHAT IT FOUND, on v3.50.0 — all three, and the third backwards:
     ARM A  the quote and the payout agreed in ONE of eight cells. eye 6 quoted 1.95 and paid 1.30,
            522d against the 778d the panel implied on a 400d wager; `shrewd` at eye 0 paid 2.08.
     ARM B  drilled: the panel quoted 1.09 to 1 on a board offering 1.95 — 344d understated, against
            exactly the player the wager row calls "the whole of what a wager is for".
     ARM D  22 of 24 houses over three seed prefixes opened the eye by median week 2, 14 sat at the
            third-off cap by week 33. Lives 125w median against a never-wagering control's 146w.

   AND FROM v3.51.0 THIS PROBE RUNS AGAINST THE REPAIR, so ARM A and ARM B now read zero gaps —
   which is what `board`, the check, holds. To reproduce the figures above, revert three lines:
     `oddsFor` back to `(d,p) => Math.max(1.05, (1/clamp(p,0.02,0.98)) * (1-VIG))`
     `settleBet`'s `odds` back to the inlined `(1-lanVig(d)) * bookEye(d)` form
     `betChance` to `winChance(g, opp, prepEdge(g), tactic, foeTactic(opp))` for ARM B
   `oddsFor` takes `(d, p)` from v3.51.0 and this file was written against the one-argument form. */
import { serve, open } from "../harness.mjs";
const N = +(process.argv[2] || 24), SEED = process.argv[3] || "BOARD";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([N,SEED])=>{
  const A = window.__LVDVS;
  const mean = f => A.STATS.reduce((s,k)=>s+(f[k]||0),0)/6;

  const state = seed => { const d = A.newGameState("Bd","clean",seed,null);
    d.fame = 1200; d.gold = 200000; d.week = 60; return d; };
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

  /* the engine's own sentence, not a formula of mine */
  const PAID = /The bookmakers pay (\d+) denarii at ([\d.]+) to 1\./;

  /* ============== ARM A: the price on the panel against the price in the sum ============== */
  const STAKE = 400;
  const cells = [];
  for(const shrewd of [false, true]){
    for(const eye of [0, 1, 3, 6]){
      const rows = [];
      for(let i=0; i<N*4 && rows.length < N; i++){
        const d = state(`${SEED}-A-${shrewd?"s":"p"}-${eye}-${i}`);
        d.lanista.traits = shrewd ? ["shrewd"] : [];
        d.flags.bookEye = eye;
        const opp = mkOpp(70);
        const o = mkOffer(d, opp);
        const g = twin(d, opp);
        /* verbatim from `makeBet`, src:18938 */
        const bet = { amount:STAKE, against:false, chance:A.winChance(g, opp, 0, "aggressive") };
        /* the quote is read BEFORE the bout: `settleBet` increments the eye on a win, so reading it
           afterwards prices the panel at eye+1 and pays at eye, which is an off-by-one the size of
           one 5.5% step and would have read as a small honest gap in every cell */
        const quoted = A.oddsFor(d, bet.chance), quotedSay = A.oddsWord(quoted);
        d.gold -= bet.amount;
        let res = A.doFight(d, g.id, o, "aggressive", bet, null, null, "none");
        if(res && res.crux) res = window.__ROPE.answer(d, res, "press").res;
        if(!res || res.crux || res.__err || !res.win) continue;
        const line = (res.sum||[]).find(s=>PAID.test(s));
        if(!line){ rows.push({ raw:"(the payout sentence did not appear on a won wager)", bad:true }); continue; }
        const m = line.match(PAID);
        rows.push({ raw:line, chance:bet.chance,
          quoted, quotedSay,
          paid:+m[2], pay:+m[1], shrewdOn:A.hasLT(d,"shrewd") });
      }
      cells.push({ shrewd, eye, rows });
    }
  }

  /* ============== ARM B: whose probability is the price struck on ============== */
  const bArm = [];
  for(let i=0;i<N;i++){
    const d = state(`${SEED}-B-${i}`);
    const opp = mkOpp(70);
    const o = mkOffer(d, opp, true);
    const g = twin(d, opp);
    const row = { cases:[] };
    for(const [nm, watch, drill] of [["blind",0,0], ["watched",1,0], ["drilled",0,1], ["both",1,1]]){
      const e = A.clone(d);
      const oe = e.games.offers[0], ge = e.gladiators.find(x=>x.id===g.id);
      if(watch) A.watchHim(e, oe);
      /* `prepFor` wants `offer.oppRef.fid === g.prep.fid` and the weeks capped at PREP_MAX —
         the first draft of this arm set neither and read prep 0.00 in all four cases, which is
         a control that never moved and would have said "the drill changes nothing" */
      if(drill) { ge.prep = { fid:7001, house:"a house", name:"the man on the bill",
                              weeks:A.PREP_MAX, since:1 }; }
      /* verbatim from src:25020 and src:25057 — the panel's own two lines */
      const foeTac = (oe.watchedTac || (A.foeSeen(e, oe) ? A.foeTactic(oe.opp) : null)) || null;
      const pPanel = A.winChance(ge, oe.opp, A.prepFor(e, ge, oe), "aggressive", foeTac);
      /* verbatim from src:18938 — what the wager is actually struck on */
      const pBet = A.winChance(ge, oe.opp, 0, "aggressive");
      row.cases.push({ nm, pPanel, pBet, foeTac,
        prep:A.prepFor(e, ge, oe),
        qPanel:A.oddsFor(e, pPanel), qBet:A.oddsFor(e, pBet) });
    }
    bArm.push(row);
  }

  /* ============== ARM C: how a house gets an eye on it, and how fast ============== */
  const cArm = { EYE_STEP:null, EYE_CAP:null, SHREWD_AT:null, VIG:null, LAN_VIG_SHREWD:null,
    curve:[], decay:null };
  {
    const dz = state(`${SEED}-C`);
    dz.lanista.traits = [];
    for(const e of [0,1,2,3,4,5,6,7,8]){
      const q = A.clone(dz); q.flags.bookEye = e;
      cArm.curve.push({ e, word:A.bookEyeWord(q) });
    }
    cArm.trait = A.LAN_TRAITS && A.LAN_TRAITS.shrewd ? A.LAN_TRAITS.shrewd.earn : null;
  }

  /* ============== ARM D: the real trajectory of a house that wagers ==============
     The rope never placed a wager until #162 put a `bet` lever on it, so nothing in this suite had
     ever settled one and the eye had never opened. Two things are read here:
       · THE PAIR. The control (never wagers) runs FIRST on every seed so it cannot inherit RNG state
         from the arm beside it — `season`'s rule. The stake is a FRACTION of the purse rather than a
         flat 400d: the first draft bet 400 flat and killed thirteen founding houses inside twenty
         weeks, which measures the size of the bet and not the price of it.
       · THE PRICE ON THE REAL STATE. At the end each state is CLONED and the game's own `settleBet`
         is called on the clone with a won wager on a MIRRORED pairing, so the paid price is the
         engine's own sentence about that week's real house. No formula of mine anywhere in this arm.
         The first draft priced against whoever `activeG(d)[0]` happened to be and read 35.20 to 1 —
         the clamp at p 0.02, which is a corner and not a price. */
  const dArm = [];
  for(const seed of [`${SEED}-D1`, `${SEED}-D2`, `${SEED}-D3`]){
    for(let h=0; h<8; h++){
      const play = wager => {
        const d = A.newGameState("Wag"+h, "clean", `${seed}-${h}`, null);
        const R = window.__ROPE;
        let firstShrewd = null, firstEye = null, capped = null, staked = 0;
        for(let w=0; w<260; w++){
          if(d.over) break;
          const bet = wager ? Math.max(50, Math.min(800, Math.round(d.gold*0.05))) : 0;
          R.lanista(d, bet ? { bet } : {});
          if(!d.lanista) break;
          if(bet) staked += bet;
          const eye = (d.flags && d.flags.bookEye) || 0;
          if(firstEye == null && eye >= 1) firstEye = d.week;
          if(firstShrewd == null && A.hasLT(d,"shrewd")) firstShrewd = d.week;
          if(capped == null && eye >= 7) capped = d.week;     /* 7 x 5.5% is the third-off cap */
        }
        return { d, firstEye, firstShrewd, capped, staked };
      };
      const ctrl = play(false);                     /* the control FIRST, always */
      const arm  = play(true);
      /* what the panel would print against what the book would pay, on a mirror, on the real state */
      const price = st => { const q = A.clone(st);
        const g = A.activeG(q)[0]; if(!g) return null;
        const opp = mkOpp(Math.round(A.STATS.reduce((s,k)=>s+(g[k]||0),0)/6));
        const off = mkOffer(q, opp);
        const chance = A.winChance(g, opp, 0, "aggressive");
        /* before `settleBet`, which increments the eye on a win — see ARM A's note */
        const quoted = A.oddsFor(q, chance), said = A.oddsWord(quoted);
        const lines = A.settleBet(q, g, off, { amount:400, against:false, chance }, true, { crowd:50 });
        const line = (lines||[]).find(x=>PAID.test(x));
        return { said, quoted, line, chance,
          paid: line ? +line.match(PAID)[2] : null,
          pay: line ? +line.match(PAID)[1] : null }; };
      dArm.push({ seed, h,
        ctrlEnd:ctrl.d.week, ctrlOver:ctrl.d.over?ctrl.d.over.kind:"alive", ctrlGold:Math.round(ctrl.d.gold),
        end:arm.d.week, over:arm.d.over?arm.d.over.kind:"alive", gold:Math.round(arm.d.gold),
        staked:arm.staked,
        eye:(arm.d.flags&&arm.d.flags.bookEye)||0,
        wonBets:arm.d.lanista?(arm.d.lanista.wonBets||0):null,
        shrewd:arm.d.lanista?A.hasLT(arm.d,"shrewd"):null,
        firstEye:arm.firstEye, firstShrewd:arm.firstShrewd, capped:arm.capped,
        probe:price(arm.d) });
    }
  }

  return { cells, bArm, cArm, dArm };
}, [N, SEED]);

const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : null; };
const f2 = x => x==null ? "-" : x.toFixed(2);

console.log(`\n  ARM A — the price the panel prints against the price the book pays, ${N} won wagers a cell, 400d a wager\n`);
console.log(`  shrewd   eye   the panel says   the book paid   gap      400d pays   the panel implied   short by`);
for(const c of out.cells){
  const rows = c.rows.filter(r=>!r.bad);
  if(!rows.length){ console.log(`  ${String(c.shrewd).padEnd(7)} ${String(c.eye).padStart(4)}   — no won wager resolved —`); continue; }
  const q = med(rows.map(r=>r.quoted)), pd = med(rows.map(r=>r.paid));
  const pay = med(rows.map(r=>r.pay)), imp = Math.round(400*q);
  console.log(`  ${String(c.shrewd).padEnd(7)} ${String(c.eye).padStart(4)}   ${f2(q).padStart(13)}   ${f2(pd).padStart(13)}   ${((pd-q)>=0?"+":"")+f2(pd-q)}   ${String(pay).padStart(9)}d  ${String(imp).padStart(17)}d   ${String(pay-imp).padStart(7)}d`);
}
console.log(`\n  the raw sentence off the first won wager of each cell, so a parse that stopped matching cannot read as a zero gap:`);
for(const c of out.cells){
  const r = c.rows[0];
  console.log(`    shrewd ${String(c.shrewd).padEnd(5)} eye ${c.eye}: quoted "${r&&r.quotedSay||"-"}" · the game wrote "${r?r.raw:"(no rows)"}"`);
}

console.log(`\n  ARM B — whose probability the printed price is struck on (${out.bArm.length} pairings)\n`);
console.log(`  (from v3.51.0 the panel prints the BOARD column; before it printed the other one)`);
console.log(`  case      prep edge   your read   the board's p    your price   board price   on 400d`);
for(const nm of ["blind","watched","drilled","both"]){
  const rs = out.bArm.map(r=>r.cases.find(c=>c.nm===nm)).filter(Boolean);
  const pp = med(rs.map(r=>r.pPanel)), pb = med(rs.map(r=>r.pBet));
  const qp = med(rs.map(r=>r.qPanel)), qb = med(rs.map(r=>r.qBet));
  console.log(`  ${nm.padEnd(9)} ${f2(med(rs.map(r=>r.prep))).padStart(9)}   ${(pp*100).toFixed(1).padStart(8)}%   ${(pb*100).toFixed(1).padStart(12)}%   ${f2(qp).padStart(11)}   ${f2(qb).padStart(11)}   ${String(Math.round(400*(qp-qb))).padStart(6)}d`);
}
console.log(`\n  raw, first four pairings:`);
for(const r of out.bArm.slice(0,4))
  console.log(`    ` + r.cases.map(c=>`${c.nm} p ${(c.pPanel*100).toFixed(1)}/${(c.pBet*100).toFixed(1)} tac ${c.foeTac||"-"} prep ${c.prep.toFixed(2)}`).join("  ·  "));

console.log(`\n  ARM C — what the player is told in words while the number does not move\n`);
for(const x of out.cArm.curve) console.log(`    bookEye ${x.e}: ${x.word || "(nothing said)"}`);
console.log(`    the shrewd trait is earned at: ${out.cArm.trait}`);

console.log(`\n  ARM D — ${out.dArm.length} houses that wager 5% of the purse on every single bout, against the same house never wagering\n`);
console.log(`  seed        never wagers        wagers              staked   won   eye   shrewd   first eye   shrewd wk   capped wk`);
for(const r of out.dArm)
  console.log(`  ${r.seed.padEnd(11)} ${(r.ctrlEnd+"w "+r.ctrlOver).padEnd(19)} ${(r.end+"w "+r.over).padEnd(19)} ${String(r.staked).padStart(7)}d ${String(r.wonBets).padStart(5)} ${String(r.eye).padStart(5)}   ${String(r.shrewd).padEnd(6)}   ${String(r.firstEye==null?"-":r.firstEye).padStart(9)}   ${String(r.firstShrewd==null?"-":r.firstShrewd).padStart(9)}   ${String(r.capped==null?"-":r.capped).padStart(9)}`);
console.log(`\n  median weeks lived — never wagers ${med(out.dArm.map(r=>r.ctrlEnd))} · wagers ${med(out.dArm.map(r=>r.end))}`);
console.log(`  median gold at the end — never wagers ${med(out.dArm.map(r=>r.ctrlGold))}d · wagers ${med(out.dArm.map(r=>r.gold))}d`);
const withEye = out.dArm.filter(r=>r.firstEye!=null);
console.log(`  ${withEye.length} of ${out.dArm.length} houses opened the eye at all` + (withEye.length?`, median week ${med(withEye.map(r=>r.firstEye))}`:""));
const shrewdN = out.dArm.filter(r=>r.firstShrewd!=null);
console.log(`  ${shrewdN.length} of ${out.dArm.length} earned \`shrewd\`` + (shrewdN.length?`, median week ${med(shrewdN.map(r=>r.firstShrewd))}`:""));
const cap = out.dArm.filter(r=>r.capped!=null);
console.log(`  ${cap.length} of ${out.dArm.length} reached the third-off cap` + (cap.length?`, median week ${med(cap.map(r=>r.capped))}`:""));
console.log(`  the eye at the end: ${out.dArm.map(r=>r.eye).sort((a,b)=>a-b).join(" ")}`);
console.log(`\n  and the price on the last week of each wagering house, mirrored pairing, the engine's own sentence:`);
for(const r of out.dArm){
  const q = r.probe;
  if(!q){ console.log(`    ${r.seed} h${r.h}: no man left to price`); continue; }
  console.log(`    ${r.seed} h${r.h} eye ${String(r.eye).padStart(2)} shrewd ${String(r.shrewd).padEnd(5)} · panel "${q.said}" · the game wrote "${q.line||"(no payout sentence)"}"  →  400d pays ${q.pay==null?"-":q.pay+"d"} against ${Math.round(400*q.quoted)}d`);
}

await browser.close(); server.close();
