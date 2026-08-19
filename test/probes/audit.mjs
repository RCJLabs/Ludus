/* THE AUDIT AFTER v3.56.0 — three things nothing has ever pressed

   `coverage` reads 101 of 463 exposed functions never called through the handle, down from 144 of
   435 at the last audit against a surface that grew by 28. What is left is mostly plumbing and
   readers, so this probe takes the three clusters where NOT being called means something a player
   does has never been measured, and measures them. An item opened off this needs figures.

   1 · THE ENTRANCE. Four buttons on the arena panel, pressed before every single bout, and the
       string "entrance" appears in NO check and NO probe in the whole suite. They are not cosmetic:
         showman  crowd +16 · stamina −5 · fame +2 · momentum +1
         grim     dread 1, which is `vB = clamp(vB − dread*8, 40, 100)` — and 2 against a green man
         boxes    missio +10 into `simCtx.fav`, and +2 favour with EVERY patron, every bout
         none     nothing
       Ten points of missio is, by `bay`'s own measurements, worth ten to fifteen points of a beaten
       man's life, and +2 favour a bout on every patron is a standing engine nobody has priced.

   2 · THE PATRON'S FAVOUR. `callFavour`, `favourReady`, `favourOf` and `backCandidate` are all
       dark. Four ranks, each with one favour, a cost in favour points and a cooldown — and each
       with a `can(d)` gate. A favour whose gate a played house never opens is unreachable content,
       which is the shape #151, #156 and #165 all turned out to be.

   3 · `skipWeeks`. The fast-forward. It runs `endWeek` up to `want` times and breaks on a pending
       event, an ending, a succession, an offer from Rome, a doctore, a re-signing, or a card. What
       it does NOT break on is a deadline coming due — and `deadlines(d)` is what the agenda raises
       at urgency 3. A player who presses "skip six weeks" past a levy or a contracted bout has been
       carried through the one thing the game told him was urgent.

   INSTRUMENT NOTES:
   · mirrored men and a fresh state per bout, for the same reason `odds` takes one: `lasting`,
     `strain`, `form`, `wear`, `scars`, `regard` and `defiance` accumulate where the six stats do not.
   · the entrance arms share their seed set, so the only difference between them is the word.
   · spares are counted among LOSSES, because that is what a missio bonus acts on.
   · three seed prefixes on anything played.

   WHAT IT FOUND — three items opened, #166 to #168, and two things that did NOT survive.

   THE ENTRANCE. `showman` is worth +13.4 to +20.7 points of win rate across four seed prefixes
   (58.7/70.0/64.0/58.0 against 45.3/49.3/50.0/39.3 for no entrance), 600 bouts in all, plus 6.9
   points of spare rate and 5.6 fame a bout. `boxes` reads IDENTICAL to no entrance on all four, to
   the digit — its missio 10 lands inside a cap that is already full. `grim` is noise on the win rate
   and worth 7.5 points of spare rate against a GREEN man, which its blurb never mentions.

   THE CAP. `pfame*0.20 + houseFavour*0.22` alone reaches MISSIO_CAP 28 in 18 of 18 houses at a
   median week 8 and peaks at 63.6 to 285.8. Seven other things feed that term and buy nothing after
   week 8. On the curve: +10 there is worth 6.3 points of a beaten man's life to a founding house,
   1.7 to a made one and 0.0 to a great one.

   THE FAVOURS. All four ranks are held and READY on essentially every patron-week — 6,555 to 6,823
   of them over 18 houses — and every one pays when called. Not unreachable content: a lever nobody
   pulls, which is #158's shape.

   AND TWO THAT DIED.
   · `skipWeeks` looked like it might carry a player past a deadline it does not name. It stops after
     one week in every case tried, including a levy three weeks out, because something else always
     interrupts first. No fault; not opened.
   · THE WATCH could not be measured this way and the arm is left here as a warning. Blind, watched
     and countering all read 39.3 / 39.3 / 40.0 — but the read said "measured" on 121 of 150 bouts,
     and `FOE_TACTIC_ANSWER`'s answer to measured is "Nothing to exploit". Mirrored men are the
     problem: `foeTactic`'s `built` term is a DIFFERENCE, so twins score zero on it and sort on record
     alone. Over sixty men off the generator `board` reads aggressive 43 · measured 14 · defensive 3.
     An arm that wants to price the watch needs a varied card, not a mirror. */
import { serve, open } from "../harness.mjs";
const N = +(process.argv[2] || 200), SEED = process.argv[3] || "AUD";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([N,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;

  /* ============ 1. THE ENTRANCE ============ */
  const ent = (()=>{
    const state = seed => { const d = A.newGameState("En","clean",seed,null);
      d.fame = 900; d.gold = 60000; d.week = 60; return d; };
    const twin = (d, m) => {
      const opp = A.genOpponent(2, A.qForStat(m));
      for(const k of A.STATS) opp[k] = Math.round(Math.min(99, m));
      opp.kit = A.kitFor(opp.cls, 2); opp.wins = 8;
      const g = A.genGladiator(d, A.qForStat(m));
      for(const k of A.STATS) g[k] = opp[k];
      g.cls = opp.cls; g.kit = opp.kit; g.traits = (opp.traits||[]).slice();
      g.heart = opp.heart; g.morale = opp.morale; g.pfame = opp.pfame; g.wins = opp.wins;
      g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99;
      d.gladiators.push(g); return { g, opp };
    };
    const cell = (key, green, pre, poor) => {
      let ran = 0, won = 0, lost = 0, died = 0, crowd = 0, fameD = 0, favD = 0;
      for(let i=0;i<N;i++){
        const d = state(`${pre||SEED}-E-${i}`);
        /* a house with nothing, for the arm where the missio cap has not saturated */
        if(poor){ d.fame = 40; d.favor = 12; d.patrons = []; }
        const { g, opp } = twin(d, 78);
        if(green) opp.wins = 1;
        const o = { id:d.nextId++, tier:2, festival:"a bench", opp, oppRef:null,
          stakes:"standard", purse:700, entrance:key };
        d.games = { festival:"x", offers:[o], week:d.week };
        const f0 = d.fame, v0 = A.patronsOf(d).reduce((s,x)=>s+x.favor, 0);
        let res = A.doFight(d, g.id, o, "measured", null, null, null, "none");
        if(res && res.crux) res = R.answer(d, res, "press").res;
        const done = res && !res.__err && !res.crux;
        if(!done) continue;
        ran++; if(res.win) won++; else { lost++; if(res.dead) died++; }
        crowd += res.crowd || 0;
        fameD += d.fame - f0;
        favD += A.patronsOf(d).reduce((s,x)=>s+x.favor, 0) - v0;
      }
      return { key, ran, won, lost, died, pct: ran?won/ran*100:null,
        spared: lost ? (lost-died)/lost*100 : null, crowd: ran?crowd/ran:null,
        fame: ran?fameD/ran:null, favor: ran?favD/ran:null };
    };
    const rows = A.ENTRANCE_KEYS.map(k=>cell(k, false));
    const green = A.ENTRANCE_KEYS.map(k=>cell(k, true));
    const poor = A.ENTRANCE_KEYS.map(k=>cell(k, false, null, true));
    const seeds = [`${SEED}-a`, `${SEED}-b`, `${SEED}-c`].map(pre=>
      ({ pre, arms:A.ENTRANCE_KEYS.map(k=>cell(k, false, pre)) }));
    return { rows, green, poor, seeds, table:A.ENTRANCE_KEYS.map(k=>({ k, ...A.ENTRANCES[k] })) };
  })();

  /* ============ 2. THE PATRON'S FAVOUR ============ */
  const fav = (()=>{
    const ranks = Object.keys(A.FAVOURS || {});
    const table = ranks.map(r=>({ r, title:A.FAVOURS[r].title, cost:A.FAVOURS[r].cost, wait:A.FAVOURS[r].wait }));
    /* what a played house ever has: which ranks it holds, and how often each favour is ready */
    const houses = [];
    for(const pre of [`${SEED}-F1`, `${SEED}-F2`, `${SEED}-F3`]){
      for(let h=0; h<6; h++){
        const d = A.newGameState("Fv"+h, "clean", `${pre}-${h}`, null);
        const held = {}, ready = {}, gate = {};
        let weeks = 0;
        for(let w=0; w<420; w++){
          if(d.over) break;
          d.gold = Math.max(d.gold, 200000);
          R.lanista(d);
          if(!d.lanista) break;
          weeks++;
          for(const pt of A.patronsOf(d)){
            held[pt.rank] = (held[pt.rank]||0) + 1;
            const F = A.FAVOURS[pt.rank]; if(!F) continue;
            let can = false; try { can = !!F.can(d); } catch(e){}
            if(can) gate[pt.rank] = (gate[pt.rank]||0) + 1;
            if(A.favourReady(d, pt)) ready[pt.rank] = (ready[pt.rank]||0) + 1;
          }
        }
        houses.push({ pre, h, end:d.week, over:d.over?d.over.kind:"alive", weeks, held, ready, gate });
      }
    }
    /* and each favour actually called, on a state built to want it */
    const called = ranks.map(r=>{
      const d = A.newGameState("Fc","clean",`${SEED}-fc-${r}`,null);
      d.week = 120; d.gold = 60000; d.fame = 1200;
      /* give the house a patron of this rank with enough favour */
      const pt = { id:d.nextId++, name:"A patron", rank:r, favor:95, since:1, wants:[], calledAt:null };
      d.patrons = [pt];
      try { A.recomputeFavor(d); } catch(e){}
      let can = false; try { can = !!A.FAVOURS[r].can(d); } catch(e){}
      const rdy = A.favourReady(d, pt);
      let line = null, err = null, cost = null;
      if(rdy){ const before = pt.favor;
        try { line = A.callFavour(d, pt.id); } catch(e){ err = e.message; }
        cost = before - (A.patronsOf(d)[0]||{favor:before}).favor; }
      return { r, can, ready:rdy, line: line ? String(line).slice(0, 70) : null, err, cost,
        readyAgain: A.favourReady(d, A.patronsOf(d)[0] || pt) };
    });
    return { table, houses, called };
  })();

  /* ============ 3. skipWeeks ============ */
  const skip = (()=>{
    const rows = [];
    const mk = seed => { const d = A.newGameState("Sk","clean",seed,null);
      d.gold = 40000; d.fame = 600; d.week = 60; return d; };
    /* it stops for the things it names */
    const stopsFor = (nm, setup) => { const d = mk(`${SEED}-sk-${nm}`); setup(d);
      const w0 = d.week; let ran = 0;
      try { ran = A.skipWeeks(d, 6); } catch(e){ return { nm, err:e.message }; }
      return { nm, ran: typeof ran === "number" ? ran : (d.week - w0), weeks:d.week - w0,
        why: d.pendingEvent ? "an event" : d.over ? "the end" : d.succession ? "a succession"
          : d.romeOffer ? "Rome" : d.doctoreOffer ? "a doctore" : d.reSignOffer ? "a contract"
          : (d.games && d.games.offers && d.games.offers.length) ? "a card" : "nothing" }; };
    rows.push(stopsFor("nothing set", d=>{}));
    rows.push(stopsFor("a doctore offering", d=>{ d.doctoreOffer = { name:"Barca", fee:2000 }; }));
    /* AND THE ONE IT DOES NOT NAME: a deadline coming due */
    const dl = (()=>{ const d = mk(`${SEED}-sk-dl`);
      /* a levy due in three weeks, which the agenda raises at urgency 2 and then 3 */
      d.deadlines = [{ kind:"levy", due:d.week + 3, amount:900, name:"a levy" }];
      const before = A.deadlines(d).map(x=>({ kind:x.kind, due:x.due }));
      const w0 = d.week;
      let ran = 0; try { ran = A.skipWeeks(d, 6); } catch(e){ return { err:e.message }; }
      const after = A.deadlines(d).map(x=>({ kind:x.kind, due:x.due }));
      return { before, after, ran, weeks:d.week - w0, past: before.length && after.every(x=>x.due >= d.week) === false,
        stillThere:after.length,
        why: d.pendingEvent ? "an event" : (d.games && d.games.offers && d.games.offers.length) ? "a card" : "nothing" };
    })();
    /* what `weeksToSomething` says it would be safe to skip, beside what skipWeeks does */
    const advice = (()=>{ const d = mk(`${SEED}-sk-adv`);
      d.deadlines = [{ kind:"levy", due:d.week + 3, amount:900, name:"a levy" }];
      let n = null; try { n = A.weeksToSomething(d, 6); } catch(e){ return { err:e.message }; }
      return { n, dueIn:3 }; })();
    return { rows, dl, advice };
  })();

  /* ============ 4. WHAT THE WATCH BUYS, AGAINST WHAT IT COSTS ============
     `watchCost` is `28 + tier*22 + purse*0.045` and `watchHim` buys two tells (three with a doctore)
     plus `watchedTac`, the one thing worth more than any habit: how he means to fight it. None of
     `watchCost`, `watchField` or `clearWatch` is called by any check. The question the panel is
     really asking is whether ACTING on the read pays, so the three arms are: never watch; watch and
     fight the same way regardless; watch and answer the word with the counter the game itself names
     in `FOE_TACTIC_ANSWER` — cover a man coming forward, go and get a man behind his shield. */
  const watch = (()=>{
    const state = seed => { const d = A.newGameState("Wc","clean",seed,null);
      d.fame = 900; d.gold = 60000; d.week = 60; return d; };
    const twin = (d, m) => {
      const opp = A.genOpponent(2, A.qForStat(m));
      for(const k of A.STATS) opp[k] = Math.round(Math.min(99, m));
      opp.kit = A.kitFor(opp.cls, 2); opp.wins = 8;
      const g = A.genGladiator(d, A.qForStat(m));
      for(const k of A.STATS) g[k] = opp[k];
      g.cls = opp.cls; g.kit = opp.kit; g.traits = (opp.traits||[]).slice();
      g.heart = opp.heart; g.morale = opp.morale; g.pfame = opp.pfame; g.wins = opp.wins;
      g.status = "active"; g.injury = null; g.fatigue = 0; g.lastFought = -99;
      d.gladiators.push(g); return { g, opp };
    };
    /* the counter the game names for each word, off FOE_TACTIC_ANSWER's own sense */
    const ANSWER = { aggressive:"defensive", defensive:"aggressive", measured:"measured" };
    const cell = (mode) => {
      let ran = 0, won = 0, lost = 0, died = 0, paid = 0, read = 0;
      const words = {};
      for(let i=0;i<N;i++){
        const d = state(`${SEED}-W-${i}`);
        const { g, opp } = twin(d, 78);
        const o = { id:d.nextId++, tier:2, festival:"a bench", opp, oppRef:null,
          stakes:"standard", purse:700 };
        d.games = { festival:"x", offers:[o], week:d.week };
        let tac = "measured";
        if(mode !== "blind"){
          const c = A.watchCost(d, o);
          if(A.watchHim(d, o)){ paid += c; read++;
            const ft = o.watchedTac; words[ft] = (words[ft]||0)+1;
            if(mode === "counter") tac = ANSWER[ft] || "measured"; }
        }
        let res = A.doFight(d, g.id, o, tac, null, null, null, "none");
        if(res && res.crux) res = R.answer(d, res, "press").res;
        const done = res && !res.__err && !res.crux;
        if(!done) continue;
        ran++; if(res.win) won++; else { lost++; if(res.dead) died++; }
      }
      return { mode, ran, won, lost, died, pct: ran?won/ran*100:null,
        spared: lost ? (lost-died)/lost*100 : null, paid: read?paid/read:null, read, words };
    };
    return { arms:["blind","watched","counter"].map(cell) };
  })();

  return { ent, fav, skip, watch };
}, [N, SEED]);

const f1 = x => x==null ? "—" : (+x).toFixed(1);
const med = a => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : null; };

console.log(`\n  1 · THE ENTRANCE — ${N} mirrored bouts a word, the same seeds in every arm\n`);
console.log(`  the table: ` + out.ent.table.map(t=>`${t.k}{${["crowd","stam","fame","mom","dread","missio","favor"].filter(k=>t[k]!=null).map(k=>`${k} ${t[k]}`).join(", ")||"nothing"}}`).join(" · "));
console.log(`\n  word       bouts   won      spared when he went down   crowd   fame a bout   patron favour a bout`);
for(const r of out.ent.rows)
  console.log(`  ${r.key.padEnd(9)} ${String(r.ran).padStart(6)}  ${(f1(r.pct)+"%").padStart(6)}   ${(f1(r.spared)+"% of "+r.lost).padStart(24)}   ${f1(r.crowd).padStart(5)}   ${f1(r.fame).padStart(11)}   ${f1(r.favor).padStart(20)}`);
console.log(`\n  the same four on three more seed prefixes — one prefix is one RNG trajectory:`);
console.log(`  prefix     ` + out.ent.table.map(t=>t.k.padEnd(9)).join(""));
for(const s of out.ent.seeds)
  console.log(`  ${s.pre.padEnd(10)} ` + s.arms.map(a=>(f1(a.pct)+"%").padEnd(9)).join(""));
console.log(`\n  and on a house with NOTHING — fame 40, standing 12, no patron — where the missio cap has not saturated:`);
console.log(`  word       bouts   won      spared when he went down`);
for(const r of out.ent.poor)
  console.log(`  ${r.key.padEnd(9)} ${String(r.ran).padStart(6)}  ${(f1(r.pct)+"%").padStart(6)}   ${(f1(r.spared)+"% of "+r.lost).padStart(24)}`);
console.log(`\n  and against a green man (under four bouts), which is when \`grim\` is supposed to bite:`);
for(const r of out.ent.green)
  console.log(`  ${r.key.padEnd(9)} ${String(r.ran).padStart(6)}  ${(f1(r.pct)+"%").padStart(6)}   ${(f1(r.spared)+"% of "+r.lost).padStart(24)}   ${f1(r.crowd).padStart(5)}`);

console.log(`\n  2 · THE PATRON'S FAVOUR\n`);
console.log(`  the table: ` + out.fav.table.map(t=>`${t.r} "${t.title}" ${t.cost} favour, ${t.wait}w`).join(" · "));
console.log(`\n  over ${out.fav.houses.length} played houses x 420w with the ledger held up:`);
const allW = out.fav.houses.reduce((s,h)=>s+h.weeks,0);
for(const t of out.fav.table){
  const held = out.fav.houses.reduce((s,h)=>s+(h.held[t.r]||0),0);
  const gate = out.fav.houses.reduce((s,h)=>s+(h.gate[t.r]||0),0);
  const rdy  = out.fav.houses.reduce((s,h)=>s+(h.ready[t.r]||0),0);
  const hs   = out.fav.houses.filter(h=>(h.ready[t.r]||0) > 0).length;
  console.log(`    ${t.r.padEnd(11)} held for ${String(held).padStart(5)} patron-weeks · its gate open on ${String(gate).padStart(5)} · READY on ${String(rdy).padStart(5)} · ${hs} of ${out.fav.houses.length} houses ever had it ready`);
}
console.log(`\n  and each one called, on a house built to want it:`);
for(const c of out.fav.called)
  console.log(`    ${c.r.padEnd(11)} gate ${String(c.can).padEnd(5)} ready ${String(c.ready).padEnd(5)} · ${c.err ? "THREW "+c.err : c.line ? `cost ${c.cost} favour · "${c.line}…"` : "returned nothing"} · ready again at once: ${c.readyAgain}`);

console.log(`\n  4 · WHAT THE WATCH BUYS — ${N} mirrored bouts an arm, the same seeds\n`);
console.log(`  arm        bouts   won      spared when he went down   paid a bout   what the read said`);
for(const a of out.watch.arms)
  console.log(`  ${a.mode.padEnd(9)} ${String(a.ran).padStart(6)}  ${(f1(a.pct)+"%").padStart(6)}   ${(f1(a.spared)+"% of "+a.lost).padStart(24)}   ${(a.paid==null?"—":Math.round(a.paid)+"d").padStart(11)}   ${Object.entries(a.words).map(([k,v])=>`${k} ${v}`).join(" · ")||"—"}`);

console.log(`\n  3 · skipWeeks\n`);
for(const r of out.skip.rows)
  console.log(`    ${r.nm.padEnd(22)} ${r.err ? "THREW "+r.err : `ran ${r.weeks} of 6 · stopped for ${r.why}`}`);
console.log(`    a levy due in three weeks: ${out.skip.dl.err ? "THREW "+out.skip.dl.err
  : `pressed skip-6 and ran ${out.skip.dl.weeks} weeks · stopped for ${out.skip.dl.why} · ${out.skip.dl.stillThere} deadline${out.skip.dl.stillThere===1?"":"s"} still on the books`}`);
console.log(`    \`weeksToSomething\` would have said it is safe to skip ${out.skip.advice.err ? "THREW "+out.skip.advice.err : `${out.skip.advice.n} weeks with the levy ${out.skip.advice.dueIn} away`}`);

await browser.close(); server.close();
