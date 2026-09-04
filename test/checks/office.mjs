/* THE AEDILESHIP IS A SEAT A MAN CAN SIT IN, AND IT IS NOT FREE

   Phase queue item #234, phases 1 and 2 plus the cost its own risk section demands. `d.aedile` was
   the one title in this game the player could never hold: its object carried {name, plat, friendly,
   hostile, since, until} and no `mine` branch anywhere in the file — grepped, zero — while
   `d.primus`, the game's OTHER held title, has carried mine/since/defences for releases. The office
   was NPC-held by construction rather than by any decision anybody wrote down, and RISE_RANKS' rung
   3 narrates the climb toward exactly it ("Friend of the Magistracy", "The magistrates take your
   calls") without that standing ever converting into the chair.

   The item refused to let a constant be written before two things were measured, and both
   measurements changed the design:

   THE POPULATION IS THERE. 10 of 14 played houses (71.4%) reach rung 3, median week 80, and see 65
   elections between them afterwards. Not dead weight.

   THE VOTE WAS NOT A CONTEST. Scored through `resolveElection`'s own arithmetic over 67 real
   elections a real house could have entered (test/probes/office.mjs): standing free won 52.8% at
   the qualifying rung and 69-76% above it, and the top backing tier won 100.0% at every rung with a
   minimum of 99.4% — the chair bought outright for 1300d, which is 20-37% of what a qualified house
   has in the strongbox. That is the exact dominance the item's risk section names.

   The sweep found the cause and rejected the obvious fix. Growing the NPC field with the player's
   rung punishes climbing — win rate FELL from 28.5% at rung 3 to 8.6% at rung 6 — and still left
   1300d at 96-100%. What worked was two changes that are the same shape as machinery already here:
   the other houses ANSWER a lanista's candidacy with `callElection`'s own 55%-per-house reach,
   aimed at anybody but him; and a man's own money buys `SELF_BACK` of the odds column, because
   everybody can see whose name is on the subscription list. At 0.45 the four stops read
   37/49/63/77% at the qualifying rung and never pass 92% at any rung.

   AND THE CHAIR HAD TO COST. Played three ways on 16 shared seeds (test/probes/chair.mjs): a house
   that stands free ends +1,258d and +219 fame over one that never stands, at a 50% win rate and a
   higher rung. A house that empties the strongbox on every ballot ends 1,880d POORER than one that
   never stands at all, having spent 5,200d on ballots and 3,576d on games. `AEDILE_GAMES` rides the
   city's call rather than taking a charge of its own, so the Upkeep line, the runway, `creditLine`,
   `merchantCarry` and the reference player's reserve all carry it with no new plumbing.

   EIGHT ARMS:
   1 · THE GATE IS THE RUNG: not below it, not without a live election, not twice, and not at all
       through `standForOffice` when `standReady` says no.
   2 · THE VOTE IS A CONTEST: the item's own falsifier, held as a gate. Standing free is neither a
       formality nor futile, and no amount of money settles it.
   3 · A MAN'S OWN MONEY BUYS LESS: the same tier and the same purse credit two different numbers
       depending on whose name is on the list, and the discount is SELF_BACK exactly.
   4 · THE OTHER HOUSES ANSWER: entering raises the field, and the answer never once lands on the
       candidate who provoked it.
   5 · WINNING SEATS YOU AND THE OFFICE FIRES UNMODIFIED: mine/friendly/hostile, and every read-site
       keyed on `friendly` returns the friendly number without a new branch. Losing docks the name.
   6 · THE CHAIR COSTS AEDILE_GAMES A WEEK: at rung 3 too, where the city's call is otherwise zero
       and an office that only charged rung 4 would be free for the house that can least afford it.
       `weeklyBill` carries it, which is what makes every downstream reader carry it.
   7 · AND THE COST NEVER DEFENDS THE SEAT: the item's explicit guardrail. Holding the chair must
       not raise the number that wins it again — `standBase` reads the same with the office and
       without it, and PACTS.exclusive stops being offered rather than letting a bargain struck with
       the aedile reach into an aedile who is the player.
   8 · IT HAPPENS IN A PLAYED HOUSE: a real rope-driven campaign stands, wins, and loses, with the
       office's own bill showing up in the ledger, and throws nothing.
   9 · AND THE BUTTON ON THE WALL IS CONNECTED TO SOMETHING. Arms 1-8 all call `standForOffice`
       directly, and every one of them passed on a build where the button was DEAD: `standNow` was
       written beside `backHim` and never added to `SX`, so the section destructured `undefined`,
       React rendered `onClick={undefined}`, and the button drew, took the click, and did nothing.
       `actions`' derived sweep does not see it either — it asks whether a swept `mut(d=>…)` closure
       is on the handle, and this one was. Only a browser pressing the button found it, so a browser
       presses it here: the panel is opened by its own tab, the button is clicked, and the state has
       to change. Then his own name is backed through its own row's own 1300d button, because the
       same wiring gap can exist one function down. */
import { found, clearAll, installRope, forge, tab, settle } from "../harness.mjs";

export const name = "office";
export const describe = "a man can stand for aedile, the town can refuse him, and the chair pays for its own games";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"OFFICE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS;
    const bad = [];
    /* A house at the rung, with an election live, built the way the game builds one.
       THE SEED HAS TO MOVE. `R()` is one global mulberry32 counter that `newGameState` reseeds from
       the seed string, so a fixture that names the same seed every time does not run 400 elections
       — it runs ONE, four hundred times. The first draft of this check did exactly that and read
       100.0% at every cell with the rival houses' answer firing 0 times in 1,200 draws, which is
       not a bug in the feature and would have been published as one. */
    let tick = 0;
    const seat = (rank, gold) => { const d = A.newGameState("Office", "clean", `OFF-${tick++}`, null);
      d.rise = { rank, standing: 0 }; d.fame = 900; d.favor = 70; d.gold = gold == null ? 9000 : gold;
      d.week = 40; A.callElection(d); return d; };

    /* ---- 1. the gate is the rung ---- */
    let arm1 = null;
    { const low = seat(2), ok = seat(3), noElec = A.newGameState("N","clean","N",null);
      noElec.rise = { rank:5, standing:0 };
      const lowReady = A.standReady(low), okReady = A.standReady(ok), noReady = A.standReady(noElec);
      const lowTook = A.standForOffice(low), lowN = low.election.cands.filter(c=>c.mine).length;
      const okTook = A.standForOffice(ok), okN = ok.election.cands.filter(c=>c.mine).length;
      const twiceReady = A.standReady(ok), twiceTook = A.standForOffice(ok);
      const okN2 = ok.election.cands.filter(c=>c.mine).length;
      const done = seat(5); done.election.done = true;
      const doneReady = A.standReady(done);
      arm1 = { rank:A.STAND_RANK, lowReady, okReady, noReady, doneReady, lowTook, lowN, okTook, okN,
        twiceReady, twiceTook, okN2, plat:ok.election.cands.find(c=>c.mine).plat,
        stood: ok.election.stood };
      if(lowReady) bad.push(`a house one rung under ${A.STAND_RANK} was allowed to stand`);
      if(!okReady) bad.push(`a house AT rung ${A.STAND_RANK} with a live election could not stand`);
      if(noReady) bad.push(`a house with no election running was told it could stand`);
      if(doneReady) bad.push(`a house was told it could stand in an election already counted`);
      if(lowTook || lowN) bad.push(`standForOffice put an ineligible house on the wall anyway`);
      if(!okTook || okN !== 1) bad.push(`standForOffice did not add exactly one candidate for an eligible house (added ${okN})`);
      if(twiceReady || twiceTook || okN2 !== 1) bad.push(`a house already on the wall was allowed to stand a second time (${okN2} candidates)`);
      if(!A.PLATFORMS.some(x=>x.key === arm1.plat))
        bad.push(`the player's candidate carries plat "${arm1.plat}", which is not in PLATFORMS — resolveElection reads PLATFORMS.find(...).likes with no guard and would throw`); }

    /* ---- 2. the vote is a contest, and 3. own money buys less ---- */
    let arm23 = null;
    { /* run real elections through the real resolver, counting who actually takes the seat */
      const trial = (rank, tier) => { let won = 0, n = 300;
        for(let i=0;i<n;i++){
          const d = seat(rank);
          A.standForOffice(d);
          if(tier > 0){ const me = d.election.cands.find(c=>c.mine); A.backCandidate(d, me.id, tier); }
          A.resolveElection(d);
          if(d.aedile && d.aedile.mine) won++;
        }
        return won/n*100; };
      const free3 = trial(3,0), free5 = trial(5,0), top3 = trial(3,3), top5 = trial(5,3);
      /* what the same purse credits when the name is somebody else's */
      const dA = seat(4); A.standForOffice(dA);
      const me = dA.election.cands.find(c=>c.mine), him = dA.election.cands.find(c=>!c.mine);
      const goldA = dA.gold; A.backCandidate(dA, me.id, 3);
      const mineBack = me.backing, spentMine = goldA - dA.gold;
      const dB = seat(4); A.standForOffice(dB);
      const him2 = dB.election.cands.find(c=>!c.mine);
      const goldB = dB.gold; A.backCandidate(dB, him2.id, 3);
      const hisBack = him2.backing, spentHis = goldB - dB.gold;
      const want = Math.round(A.backLevels[3].odds * A.SELF_BACK);
      arm23 = { free3:+free3.toFixed(1), free5:+free5.toFixed(1), top3:+top3.toFixed(1), top5:+top5.toFixed(1),
        mineBack, hisBack, want, full:A.backLevels[3].odds, spentMine, spentHis, self:A.SELF_BACK };
      if(free3 > 70 || free5 > 70)
        bad.push(`standing with nothing spent won ${free3}% at rung 3 and ${free5}% at rung 5 — the item's own falsifier is that a house at eligibility must not be near-guaranteed off seeding alone`);
      if(free3 < 15 || free5 < 15)
        bad.push(`standing free won only ${free3}%/${free5}% — the rung that narrates "the magistrates take your calls" cannot be a rounding error at the ballot`);
      if(top3 > 95 || top5 > 95)
        bad.push(`the top backing tier won ${top3}%/${top5}% — the chair must never be simply purchasable`);
      if(top3 <= free3 || top5 <= free5)
        bad.push(`spending everything did not beat spending nothing (${top3} vs ${free3}, ${top5} vs ${free5}) — the dial has to point somewhere`);
      if(hisBack !== A.backLevels[3].odds)
        bad.push(`backing another man's name credited ${hisBack}, not backLevels' own ${A.backLevels[3].odds}`);
      if(mineBack !== want)
        bad.push(`backing your own name credited ${mineBack}, expected round(${A.backLevels[3].odds} x SELF_BACK ${A.SELF_BACK}) = ${want}`);
      if(spentMine !== spentHis || spentMine !== A.backLevels[3].n)
        bad.push(`the two backings cost different money (${spentMine}d on your own name, ${spentHis}d on his) — the discount is on what it buys, not what it costs`); }

    /* ---- 4. the other houses answer ---- */
    let arm4 = null;
    { let before = 0, after = 0, onMe = 0, n = 400, raised = 0;
      for(let i=0;i<n;i++){
        const d = seat(4);
        const b = d.election.cands.reduce((s,c)=>s+c.base, 0);
        A.standForOffice(d);
        const mine = d.election.cands.find(c=>c.mine);
        const a = d.election.cands.filter(c=>!c.mine).reduce((s,c)=>s+c.base, 0);
        before += b; after += a; if(a > b) raised++;
        if(mine.base !== A.standBase(d)) onMe++;
      }
      arm4 = { before:Math.round(before/n), after:Math.round(after/n), raised, n, onMe,
        rivals: seat(4).rivals.length };
      if(after <= before)
        bad.push(`the field's mean base did not move when a lanista entered (${Math.round(before/n)} -> ${Math.round(after/n)}) — without the answer the vote measured 53-76% free and 100% bought`);
      if(onMe) bad.push(`${onMe} of ${n} answers landed on the player's own candidate — the rival houses are answering him, not funding him`);
      if(raised < n*0.6) bad.push(`only ${raised} of ${n} candidacies drew any answer at all`); }

    /* ---- 5. winning seats you; losing docks the name ---- */
    let arm5 = null;
    { let winState = null, loseState = null, tries = 0;
      while((!winState || !loseState) && tries++ < 400){
        const d = seat(5); const f0 = d.fame, mg0 = A.patronsOf(d).filter(x=>x.rank==="magistrate").length;
        A.standForOffice(d); A.resolveElection(d);
        const row = { fame0:f0, fame1:Math.round(d.fame), mine:!!(d.aedile&&d.aedile.mine),
          friendly:!!(d.aedile&&d.aedile.friendly), hostile:!!(d.aedile&&d.aedile.hostile),
          until:d.aedile?d.aedile.until - d.week:0, mags:mg0,
          purse:A.aedilePurse(d), offers:A.aedileOffers(d), missio:A.aedileMissio(d) };
        if(row.mine && !winState) winState = row;
        if(!row.mine && !loseState) loseState = row;
      }
      arm5 = { win:winState, lose:loseState, tries };
      if(!winState) bad.push(`400 elections at rung 5 and the player never once took the seat`);
      if(!loseState) bad.push(`400 elections at rung 5 and the player never once lost`);
      if(winState){
        if(!winState.friendly || winState.hostile)
          bad.push(`the player took the office and it came out friendly=${winState.friendly} hostile=${winState.hostile} — the seven read-sites all key on friendly`);
        if(winState.purse !== 1.14 || winState.offers !== 1 || winState.missio !== 9)
          bad.push(`holding the chair paid purse x${winState.purse}, ${winState.offers} slot, ${winState.missio} missio — it must fire the friendly numbers unmodified`);
        if(winState.fame1 <= winState.fame0)
          bad.push(`winning the aedileship did not raise the house's name (${winState.fame0} -> ${winState.fame1})`);
        if(winState.until <= 0) bad.push(`the term was already over the week it began`); }
      if(loseState && loseState.fame1 >= loseState.fame0)
        bad.push(`a name read off the wall and passed over cost nothing (${loseState.fame0} -> ${loseState.fame1})`); }

    /* ---- 6. the chair pays for its own games ---- */
    let arm6 = null;
    { const rows = [];
      for(const rank of [3,4,5,6]){
        const d = seat(rank); d.acclaim = null;
        const off = A.liturgy(d), billOff = A.weeklyBill(d);
        d.aedile = { name:"me", plat:"blood", mine:true, friendly:true, hostile:false,
          since:d.week, until:d.week + 18 };
        const on = A.liturgy(d), billOn = A.weeklyBill(d);
        rows.push({ rank, off, on, d: on-off, billOff, billOn, dBill: billOn-billOff });
      }
      /* and it stops when the term does */
      const d = seat(5);
      d.aedile = { name:"me", plat:"blood", mine:true, friendly:true, hostile:false, since:0, until:d.week };
      const expired = A.liturgy(d);
      d.aedile.until = d.week + 1;
      const live = A.liturgy(d);
      const term = 18 * A.AEDILE_GAMES, buy = A.backLevels[3].n;
      arm6 = { rows, games:A.AEDILE_GAMES, expired, live, term, buy, ratio:+(term/buy).toFixed(2) };
      /* the plumbing assertions below all compare the delta to AEDILE_GAMES itself, so setting the
         constant to zero satisfies every one of them — a check that cannot fail. The anchor is the
         design statement the measurement produced: a year in the chair costs on the order of what
         buying the chair once costs, which is what stops holding it from being free money. */
      if(!(A.AEDILE_GAMES > 0))
        bad.push(`AEDILE_GAMES is ${A.AEDILE_GAMES} — the chair puts on the games at its own expense or it is a strictly better backCandidate`);
      if(term < buy * 0.7 || term > buy * 1.6)
        bad.push(`a term in the chair costs ${term}d against ${buy}d to buy it outright (${(term/buy).toFixed(2)}x) — measured, holding it for a year should cost about what taking it once does`);
      for(const x of rows){
        if(x.d !== A.AEDILE_GAMES)
          bad.push(`at rung ${x.rank} the chair moved the city's call by ${x.d}, not AEDILE_GAMES ${A.AEDILE_GAMES}`);
        if(x.dBill !== A.AEDILE_GAMES)
          bad.push(`at rung ${x.rank} weeklyBill moved by ${x.dBill}, not ${A.AEDILE_GAMES} — the Upkeep line, the runway and creditLine all read that sum`); }
      if(rows[0].off !== 0)
        bad.push(`the city's call at rung 3 is ${rows[0].off}, not zero — arm 6 rests on rung 3 being the rung where the office would otherwise be free`);
      if(live - expired !== A.AEDILE_GAMES)
        bad.push(`an expired term still charged for the games (live ${live} vs expired ${expired})`); }

    /* ---- 7. and the office never defends itself ---- */
    let arm7 = null;
    { const d = seat(5); const bare = A.standBase(d);
      d.aedile = { name:"me", plat:"blood", mine:true, friendly:true, hostile:false,
        since:d.week-9, until:d.week + 9 };
      const seated = A.standBase(d);
      /* the pact struck WITH the aedile has no counterparty when you are him */
      /* TWO POPULATIONS, because "the exclusive was never offered" is not a finding on its own.
         PACTS has three keys and `debt` needs an open loan, so a house with no loan draws from at
         most {season, exclusive} — and if the filter is doing its job the seated house draws from
         {season} alone. The unseated arm is the positive control that says the table CAN produce
         the exclusive under these exact conditions. offerPact writes the kind to
         pendingEvent.data.k and stops at three seen, so both counters are cleared between draws.
         (The first draft read `.pact`/`.kind` — both undefined — and counted zero offers whatever
         the filter did, which is a check that cannot fail. Sabotage 6 walked straight through it.) */
      const draw = (seated) => { const kinds = {}; let drawn = 0, n = 160;
        for(let i=0;i<n;i++){
          const e = seat(5); e.week = 60; e.fame = 400;
          e.aedile = seated
            ? { name:"me", plat:"blood", mine:true, friendly:true, hostile:false, since:e.week-1, until:e.week + 17 }
            : { name:"Someone", plat:"blood", mine:false, friendly:false, hostile:false, since:e.week-1, until:e.week + 17 };
          for(let t=0;t<40;t++){
            e.pendingEvent = null; e.flags.pactsSeen = 0;
            A.offerPact(e);
            const k = e.pendingEvent && e.pendingEvent.data && e.pendingEvent.data.k;
            if(!k) continue;
            drawn++; kinds[k] = (kinds[k]||0) + 1;
          }
        }
        return { drawn, kinds, n }; };
      const seatedDraw = draw(true), looseDraw = draw(false);
      const offered = seatedDraw.kinds.exclusive || 0, control = looseDraw.kinds.exclusive || 0;
      const drawn = seatedDraw.drawn, kinds = seatedDraw.kinds, n = seatedDraw.n;
      const src = String(A.PACTS.exclusive.keptRun) + String(A.PACTS.exclusive.brokeRun);
      arm7 = { bare, seated, offered, control, drawn, kinds, n, loose:looseDraw, guarded: /!d\.aedile\.mine|!\s*d\.aedile\s*\.\s*mine/.test(src) || (src.match(/mine/g)||[]).length >= 2 };
      if(bare !== seated)
        bad.push(`holding the chair moved standBase from ${bare} to ${seated} — the item's guardrail is that incumbency must never feed the score that defends the same seat`);
      if(offered)
        bad.push(`"An exclusive with the aedile" was offered ${offered} times to the man who IS the aedile`);
      if(drawn < 150)
        bad.push(`only ${drawn} pacts were drawn at all across ${n} seated houses — arm 7's exclusive count means nothing if the table is not being read`);
      if(!control)
        bad.push(`the control house, identical but for holding the office, was never offered the exclusive either (${looseDraw.drawn} draws) — nothing here proves the office is what suppressed it`);
      if(!arm7.guarded)
        bad.push(`PACTS.exclusive's endings still reach into d.aedile with no mine guard — breaking a pact would make the player hostile to himself`); }

    return { bad, arm1, arm23, arm4, arm5, arm6, arm7 };
  });

  bad.push(...r.bad);

  lines.push(`the gate is rung ${r.arm1.rank}: under it ${r.arm1.lowReady} · at it ${r.arm1.okReady} · no election ${r.arm1.noReady} · already counted ${r.arm1.doneReady} · twice ${r.arm1.twiceReady}`);
  lines.push(`  he stands on "${r.arm1.plat}", which is a platform resolveElection can score`);
  lines.push(`the vote, run 300 times per cell through resolveElection itself:`);
  lines.push(`  nothing spent — rung 3 ${r.arm23.free3}% · rung 5 ${r.arm23.free5}%`);
  lines.push(`  everything spent (${r.arm23.full} odds, ${r.arm23.self} of it on your own name = ${r.arm23.want}) — rung 3 ${r.arm23.top3}% · rung 5 ${r.arm23.top5}%`);
  lines.push(`  the same ${r.arm23.spentMine}d credits ${r.arm23.hisBack} behind another man and ${r.arm23.mineBack} behind your own`);
  lines.push(`the other houses answer: field base ${r.arm4.before} -> ${r.arm4.after} over ${r.arm4.n} candidacies (${r.arm4.raised} drew one, ${r.arm4.rivals} rival houses), ${r.arm4.onMe} landed on him`);
  if(r.arm5.win) lines.push(`winning: fame ${r.arm5.win.fame0} -> ${r.arm5.win.fame1} · mine ${r.arm5.win.mine} friendly ${r.arm5.win.friendly} hostile ${r.arm5.win.hostile} · ${r.arm5.win.until}w · purse x${r.arm5.win.purse} +${r.arm5.win.offers} slot +${r.arm5.win.missio} missio`);
  if(r.arm5.lose) lines.push(`losing: fame ${r.arm5.lose.fame0} -> ${r.arm5.lose.fame1}, and the office is somebody else's`);
  lines.push(`the chair's own games at ${r.arm6.games}d/week (${r.arm6.term}d a term):`);
  for(const x of r.arm6.rows)
    lines.push(`  rung ${x.rank}: the city's call ${x.off} -> ${x.on} · the weekly bill ${x.billOff} -> ${x.billOn}`);
  lines.push(`  a term is ${r.arm6.term}d of games against ${r.arm6.buy}d to buy the seat outright — ${r.arm6.ratio}x`);
  lines.push(`the guardrail: standBase ${r.arm7.bare} with the chair and ${r.arm7.seated} without it`);
  lines.push(`  the exclusive, drawn from the same table under the same conditions: ${r.arm7.offered} times to the man who is the aedile (${r.arm7.drawn} draws, [${Object.keys(r.arm7.kinds).join(", ")}]) · ${r.arm7.control} times to one who is not (${r.arm7.loose.drawn} draws, [${Object.keys(r.arm7.loose.kinds).join(", ")}])`);

  /* ---- 8. a played house stands, wins, loses, and pays ---- */
  const play = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const errs = []; let stood = 0, won = 0, lost = 0, weeks = 0, held = 0, billSeen = 0;
    for(let h = 0; h < 6; h++){
      const d = A.newGameState(`OFF-P${h}`, "capua", `OFF-P${h}`);
      let pend = false;
      for(let w = 0; w < 200 && !d.over; w++){
        try {
          if(A.standReady(d) && A.standForOffice(d)){ stood++; pend = true;
            const me = d.election.cands.find(c=>c.mine);
            if(me && d.gold >= A.backLevels[2].n) A.backCandidate(d, me.id, 2); }
          if(d.aedile && d.aedile.mine && d.week < d.aedile.until){ held++;
            if(A.liturgy(d) >= A.AEDILE_GAMES) billSeen++; }
          R.lanista(d, {}); weeks++;
          if(pend && d.election && d.election.done){ pend = false;
            if(d.aedile && d.aedile.mine) won++; else lost++; }
        } catch(e){ errs.push(`h${h} w${d.week}: ${String(e && e.stack || e).slice(0,180)}`); break; }
      }
    }
    return { errs, stood, won, lost, weeks, held, billSeen };
  });

  /* ---- 9. and the button on the wall is connected to something ---- */
  await forge(p, (A) => {
    const d = A.newGameState("Verres", "clean", "OFFICE-UI", null);
    d.rise = { rank:5, standing:0 }; d.fame = 1400; d.favor = 78; d.gold = 9000; d.week = 40;
    A.callElection(d);
    return { plant:d };
  });
  await tab(p, "villa");
  await p.evaluate(()=>{ const c = [...document.querySelectorAll("button[role=tab]")]
    .find(b => /coin & council/i.test((b.innerText||"") + " " + (b.getAttribute("aria-label")||"")));
    if(c) c.click(); });
  await settle(p);

  const readPanel = () => p.evaluate(()=>{
    const all = [...document.querySelectorAll("*")].filter(el=>/The aedileship/.test(el.textContent||"")
      && el.children.length < 30 && (el.textContent||"").length > 120 && (el.textContent||"").length < 3000);
    all.sort((a,b)=>a.textContent.length - b.textContent.length);
    const txt = all[0] ? all[0].textContent : "";
    const btn = [...document.querySelectorAll("button")].find(x=>/Put your own name on the wall/i.test(x.textContent||""));
    return { txt, hasButton: !!btn, saysYou: /— you/.test(txt), price: /64d a week/.test(txt) };
  });
  const press = (rx) => p.evaluate((r)=>{
    const b = [...document.querySelectorAll("button")].find(x=>new RegExp(r,"i").test(x.textContent||""));
    if(!b) return false; b.click(); return true;
  }, rx);
  const ui0 = await readPanel();
  const clicked = await press("Put your own name on the wall");
  await settle(p);
  const ui1 = await readPanel();
  /* and his own row's own money */
  const paid = await p.evaluate(()=>{
    const rows = [...document.querySelectorAll("div")].filter(el=>/— you/.test(el.textContent||"")
      && el.children.length < 14 && [...el.querySelectorAll("button")].some(b=>/1300d/.test(b.textContent||"")));
    const row = rows[rows.length-1];
    if(!row) return "no row of his own carrying the tiers";
    const b = [...row.querySelectorAll("button")].find(x=>/1300d/.test(x.textContent||""));
    b.click(); return "clicked";
  });
  await settle(p);
  const ui2 = await readPanel();

  lines.push(`through the screen: the panel offers the wall (${ui0.hasButton}) and names the price before you press it (${ui0.price})`);
  lines.push(`  pressed it → the ballot carries "— you" ${ui1.saysYou} · backed his own name at 1300d → ${paid}`);
  lines.push(`  and the row then reads: "${(ui2.txt.match(/Your money is on[^.]*\./)||["(nothing)"])[0]}"`);
  if(!ui0.hasButton) bad.push(`the aedileship panel offered no way to stand at all`);
  if(!ui0.price) bad.push(`the panel does not name what the chair costs before you press the button for it`);
  if(!clicked) bad.push(`could not press "Put your own name on the wall"`);
  if(!ui1.saysYou)
    bad.push(`pressing the button changed nothing on the ballot — this is the shape that shipped once already, a mut() handler written at the call site and never added to SX, which renders onClick={undefined} and swallows the click`);
  if(paid !== "clicked") bad.push(`could not back his own name from his own row: ${paid}`);
  if(ui1.saysYou && !/Your money is on your own name/.test(ui2.txt))
    bad.push(`he paid for his own candidacy and the panel reported it as money on somebody else`);

  lines.push(`played headless: ${play.weeks} weeks over 6 houses · ${play.stood} candidacies · ${play.won} won, ${play.lost} lost · ${play.held} weeks in the chair, all ${play.billSeen} of them billed`);
  if(play.errs.length) bad.push(`the election threw in played weeks: ${play.errs[0]}`);
  if(!play.stood) bad.push(`6 played houses over 200 weeks and nobody ever qualified to stand — the population the probe measured at 71% is gone`);
  if(play.stood && !play.won) bad.push(`${play.stood} candidacies in played houses and not one seat taken`);
  if(play.stood && !play.lost) bad.push(`${play.stood} candidacies in played houses and not one loss — the town has to be able to refuse him`);
  if(play.held !== play.billSeen) bad.push(`${play.held - play.billSeen} weeks in the chair went unbilled`);

  return { pass: bad.length === 0 && !errors.length, why: bad.slice(0, 3).join("; ") || null, lines };
}
