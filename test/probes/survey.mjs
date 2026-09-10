/* THE DESIGN SURVEY — what a long game actually contains. Written for the #207-#231 audit.

   Not a defect hunt. The question is what a player MEETS: how runs end, what a career looks like,
   which of the game's systems a whole long run engages and which stay furniture, where the coin
   curve goes, what stories the chronicle actually tells and how often it repeats itself.

     node test/probes/survey.mjs 16 420      # houses, weeks

   THE NUMBERS THE AUDIT WAS WRITTEN OFF (16 x 420, 3,961 house-weeks, 1,046 men): endings debt 7 /
   rebellion 3 / ruin 1 / survived 5 · gold p50 by era 991 / 4,163 / 4,361 / 3,480 · fame p50 145 /
   1,727 / 3,053 / 3,848 · career p50 ONE bout, zero wins, p90 ten · saga finales 0 of 13 started ·
   Rome offers 0 · blessed weeks 2.3% · feud standing on 79% of weeks (12 x 360 arm) · rites
   honoured 0 against 164 unburied · the mercy line told on 16% of ALL weeks.

   ---- AND "ROME OFFERS 0" WAS THIS FILE'S OWN SCOPE FAULT, v3.250.0 ----
   It was counted once per house in the end-of-run block, so it said how many houses were IN ROME on
   the night they ended. Corrected, the same shape of run reads **49 trips and 50 offers**, which is
   exactly what `did.toRome` had been reporting alongside it all along. Eleven rows were in that
   block; see the note at the top of the house loop. `checks/probe.mjs` FAULT NINE holds the shape.

   ---- THE CHRONICLE ROWS ABOVE WERE READ THROUGH A FILTER THAT SELECTED, v3.232.0 ----
   Every chronicle figure this file has ever published came off `if(c.week !== d.week) continue`.
   `chron` UNSHIFTS, so the comment that stood here was right that length cannot count new lines and
   wrong about the cure: `endWeek` runs `lateWeek`, `foreWeek` and `bookWeek` BEFORE `ludusLedger`
   does `d.week++`, so a line's stamp says which SIDE of the increment wrote it, not whether it is
   new. Counted by identity instead — walk the log from the front until the object that was at the
   front last week — the same 16 x 420 frame reads **22,288 lines against the filter's 4,944**, and
   **9,951 distinct shapes against 1,305**. The filter saw 22% of the corpus and 13% of its variety.

   AND IT IS NOT A SAMPLE, WHICH IS THE PART WORTH KEEPING. Per shape the filter is BINARY — of the
   twelve commonest lines, six survive at 100% and six at 0%, nothing in between — because a shape
   is written at a fixed point in `endWeek` and that point decides it. So the survivors skew by kind
   (good 33%, info 19%, event 16%, bad 15%) and "how often the chronicle repeats itself", the
   question this file was built to answer, was measured on a subset chosen by authorship order. The
   ONE chronicle row above that is unharmed is the mercy line, which is written after the increment
   and so counts 232 either way; that it now reads 8.0% of weeks rather than 16% is the game moving
   under ten releases, not this fault. Nothing outside `chron` and `mercyLine` reads the log, so the
   endings, coin, career, arc and rites rows are untouched by it.

   TODAY'S FRAME, same seed and shape (16 x 420, 2,890 house-weeks, 467 men): endings debt 8 /
   rebellion 5 / ruin 2 / survived 1 · gold p50 999 / 4,452 / 5,447 / 3,787 · fame p50 164 / 1,770 /
   3,398 / 4,817 · career p50 3 bouts (p90 14) · saga finales 2 of 14 · ~~Rome offers still 0~~
   (the scope fault, see above) · rites honoured still 0, against 189 unburied · 7.7 chronicle lines
   a week.

   STANDING CAVEAT, from dark.mjs: these are the ROPE's weeks. A system the reference player never
   pursues reads as dark and that is a fact about the policy, not the game. The audit marks those
   rows (rope). */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 420), SEED = process.argv[4] || "SURVEY";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const ERA = w => Math.min(3, Math.floor(w / (W/4)));
  const sum = { houses:H, weeks:0, endings:{}, endedAt:[],
    era: [0,1,2,3].map(()=>({ gold:[], fame:[], roster:[], fit:[] })),
    men: { seen:0, died:0, sold:0, freed:0, fled:0, retired:0, bouts:[], wins:[], survivedRun:0 },
    modes: {}, sys: {}, did: {}, arcs: { saga:{started:0,st2:0,st3:0,st4:0}, nem:{houses:0,men:0},
      rebellion:{any:0,ended:0,weeks:0,standing:0,stage:{}}, war:{seen:0,done:0}, rome:{offered:0,gone:0}, succession:0 },
    chron: { lines:0, distinct:{}, byKind:{} },
    events: {}, patrons:[], piety:{ offerings:0, vows:0, blessedWeeks:0 },
    circuit:{ trips:0, weeksAway:0 }, works:0, monuments:0, collegium:0, household:[], loans:0,
    elections:0, gambits:0, laws:0, doctrines:0, brand:0, munera:0, court:0, pacts:0, powLot:0 };

  const mark = (o,k,n=1) => { o[k] = (o[k]||0) + n; };
  sum.feud = { weeks:0, declared:0, won:0 }; sum.rites = { honoured:0, unburied:0 }; sum.mercyLine = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Survey", "clean", SEED+"-"+h);
    const seenMen = new Set(); let wasAway = false; let hadLoan = false; let lastNem = null;
    let sawSaga = false, sagaMax = 0, wasRebel = false;
    /* ---- AND ELEVEN MORE ROWS WERE IN THE WRONG SCOPE — #258 ----
       The note further down records `rebellion` being counted once per house in the end-of-run
       block, so "rebellion 3" meant three houses with a rising STANDING on their last night. That
       was found and fixed. ELEVEN OTHER ROWS WERE LEFT IN EXACTLY THE SAME PLACE, and read the same
       way: `court: 0` meant no house had a courtship OPEN on its final week, and `rome.gone: 1`
       meant one house was in Rome on the night it ended while `did.toRome` on the same run read 49.
       Every one of them is a transition now, counted in the week, on `wasAway`'s pattern. */
    let hadRome = false, hadOffer = false, hadCourt = false, hadPact = false, hadLot = false,
        hadColl = false, hadLaw = false, hadDoc = false, hadBrand = false, hadAed = false;
    let lastMunus = d.munusLast == null ? -99 : d.munusLast;
    let lastOffer = d.lastOffering == null ? -9 : d.lastOffering;
    for(let w=0; w<W; w++){
      if(d.over){ break; }
      let did;
      const wasFront = (d.log||[])[0] || null;
      try { did = R.lanista(d); } catch(e){ mark(sum.sys, "lanistaThrew"); break; }
      sum.weeks++;
      /* `did.events` is an object of per-event counts, not a number — summing it with `+` made a
         string of "[object Object]"s and the audit's event column read as noise. Folded in by key. */
      for(const k of Object.keys(did||{})){
        if(k === "events"){ sum.events = sum.events || {}; for(const e of Object.keys(did.events||{})) mark(sum.events, e, did.events[e]); }
        else mark(sum.did, k, did[k]); }
      const e = ERA(w);
      sum.era[e].gold.push(Math.round(d.gold));
      sum.era[e].fame.push(Math.round(d.fame));
      const live = A.activeG(d);
      sum.era[e].roster.push(live.length);
      for(const g of d.gladiators) seenMen.add(g.id);
      /* the chronicle is the story the game actually tells. `chron` unshifts, so this week's lines
         are the ones in front of the object that led the log last week — identity, not the week
         stamp, which only says whether `ludusLedger` had incremented yet (see the header). If a
         single week ever wrote LOG_ROLL lines the sentinel would be gone and the walk would take
         the whole buffer; it writes single digits. */
      const fresh = []; for(const c of (d.log||[])){ if(c === wasFront) break; fresh.push(c); }
      for(const c of fresh){ if(!c) continue;
        sum.chron.lines++;
        mark(sum.chron.distinct, ((c.text||"")+"").slice(0,34));
        if(c.kind) mark(sum.chron.byKind, c.kind);
      }
      /* systems, sampled weekly as booleans-become-weeks */
      if(A.blessOf && A.blessOf(d)) sum.piety.blessedWeeks++;
      if(d.city){ sum.circuit.weeksAway++; if(!wasAway) sum.circuit.trips++; wasAway = true; } else wasAway = false;
      if(d.loan && !hadLoan){ sum.loans++; hadLoan = true; } if(!d.loan) hadLoan = false;
      if(d.saga && !sawSaga){ sum.arcs.saga.started++; sawSaga = true; }
      if(d.saga) sagaMax = Math.max(sagaMax, d.saga.stage||0);
      if(d.nemHouse){ sum.feud.weeks++;
        if(lastNem !== d.nemHouse.house){ sum.feud.declared++; lastNem = d.nemHouse.house; } }
      else lastNem = null;
      for(const c of fresh) if(c && /still alive somewhere/.test(c.text||"")) sum.mercyLine++;
      /* ---- IT WAS COUNTED ONCE PER HOUSE, OUTSIDE THIS LOOP ----
         `if(d.rebellion) sum.arcs.rebellion.any++` sat down in the end-of-run block, so "rebellion 3"
         never meant three risings or three weeks — it meant three of fourteen houses had one STANDING
         on the night their run ended, and `ended` was a counter nothing wrote. Worse, the first
         attempt to fix it was made in the wrong scope too and published "7 rebellions, 0 ended" as a
         finding. `probes/rising.mjs` settled it by tracing every arc week by week: 18 risings over
         2,878 weeks, a median of NINE weeks each, stage 3 reached by 11 of 18. The arc plays out
         exactly as designed; only this line was broken. Counted here, in the week, now. */
      if(d.rome){ if(!hadRome){ sum.arcs.rome.gone++; hadRome = true; } } else hadRome = false;
      if(d.romeOffer){ if(!hadOffer){ sum.arcs.rome.offered++; hadOffer = true; } } else hadOffer = false;
      if(d.court){ if(!hadCourt){ sum.court++; hadCourt = true; } } else hadCourt = false;
      if(d.pact){ if(!hadPact){ sum.pacts++; hadPact = true; } } else hadPact = false;
      if(d.powLot){ if(!hadLot){ sum.powLot++; hadLot = true; } } else hadLot = false;
      if(d.collegium && !hadColl){ sum.collegium++; hadColl = true; }
      if(d.law && !hadLaw){ sum.laws++; hadLaw = true; }
      if(d.doctrine && !hadDoc){ sum.doctrines++; hadDoc = true; }
      if(d.brand && d.brand.licensed && !hadBrand){ sum.brand++; hadBrand = true; }
      if(d.aedile && !hadAed){ sum.elections++; hadAed = true; }
      /* THE MUNUS AND THE OFFERING are stamps, not flags: `d.munusLast = d.week` and
         `d.lastOffering = d.week`. A change is one taken. The old `munera` row read `d.honoured`,
         which is men given funeral games and is already the `rites.honoured` row under its own name
         — the same field published twice under two labels. */
      { const m = d.munusLast == null ? -99 : d.munusLast;
        if(m !== lastMunus){ sum.munera++; lastMunus = m; } }
      { const o = d.lastOffering == null ? -9 : d.lastOffering;
        if(o !== lastOffer){ sum.piety.offerings++; lastOffer = o; } }
      if(d.rebellion){ sum.arcs.rebellion.weeks++;
        sum.arcs.rebellion.stage[d.rebellion.stage] = (sum.arcs.rebellion.stage[d.rebellion.stage]||0)+1;
        if(!wasRebel){ sum.arcs.rebellion.any++; wasRebel = true; } }
      else if(wasRebel){ sum.arcs.rebellion.ended++; wasRebel = false; }
    }
    /* end of run: what stands, what happened */
    const K = d.over ? d.over.kind : "survived";
    mark(sum.endings, K); if(d.over) sum.endedAt.push(Math.round(d.week/ (52/12) / 12 * 10)/10);
    if(sagaMax>=2) sum.arcs.saga.st2++; if(sagaMax>=3) sum.arcs.saga.st3++; if(sagaMax>=4) sum.arcs.saga.st4++;
    if(d.nemHouse) sum.arcs.nem.houses++; if(d.nemesis) sum.arcs.nem.men++;
    if(wasRebel) sum.arcs.rebellion.standing++;      /* a rising still on the night the run ended */
    if(d.war){ sum.arcs.war.seen++; if(d.war.done) sum.arcs.war.done++; }
    /* rome, court, pacts, powLot, collegium, laws, doctrines, brand and elections are counted in
       the week now — see the note at the top of the house loop. */
    if((d.forebears||[]).length) sum.arcs.succession += d.forebears.length;
    sum.feud.won += (d.flags && d.flags.nemWon) || 0;
    sum.rites.honoured += d.honoured || 0; sum.rites.unburied += (d.unburied||[]).length;
    sum.patrons.push((d.patrons||[]).length);
    if(d.vow) sum.piety.vows++;
    /* `monuments` was initialised to 0 and NEVER INCREMENTED ANYWHERE — a row that read nought for
       ever whatever the game did. `d.works` holds both tables (`workDef` is `WORKS[k] || MONUMENTS[k]`),
       so the split is by key. */
    { const wk = Object.keys(d.works||{}), MK = A.MONU_KEYS || [];
      sum.works += wk.filter(k=>!MK.includes(k)).length;
      sum.monuments += wk.filter(k=>MK.includes(k)).length; }
    sum.household.push(Object.keys(d.household||{}).filter(k=>d.household[k]).length);
    sum.gambits += Object.keys(d.gambits||{}).length;
    /* ---- CAREERS, CORRECTED UNDER AUDIT ITEM #208, and the correction indicts this file's own first figures ----
       The audit's "median career: ONE bout, zero wins" came from here, and it was an artifact.
       A dead man does not leave `d.gladiators` and does not carry `g.dead` — he stays, with
       `status:"dead"` and his real record — while `d.fallen` receives a SUMMARY: `{name, week}`,
       no wins field, and sometimes not even a gladiator (the lanista goes in there in a revolt).
       The first cut read `g.dead` (always undefined, so `died` undercounted the roster's dead to
       zero and took `d.fallen.length` instead) and pushed a career of `(g.wins||0)+(g.losses||0)`
       for every summary — 470 phantom zero-bout careers dragging the median from FIVE to one.
       Measured on the same frame with `debut.mjs` on the true fields: the dead man's median
       career is 5 bouts (p90 16), and the per-bout hazard is flat at 10-14%. One man, one row,
       from the roster, on `status`. */
    for(const g of d.gladiators){
      sum.men.seen++;
      sum.men.bouts.push((g.wins||0)+(g.losses||0));
      sum.men.wins.push(g.wins||0);
      if(g.status === "dead") sum.men.died++;
      else if(g.status === "sold") sum.men.sold++;
      else if(g.status === "freed") sum.men.freed++;
      else if(g.status === "escaped") sum.men.fled++;
      else if(g.status === "retired" || g.status === "departed") sum.men.retired++;
      else sum.men.survivedRun++;
    }
  }

  /* squash arrays to quartiles so the wire stays small */
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at = f => s[Math.min(s.length-1, Math.floor(f*s.length))];
    return { p10:at(.1), p50:at(.5), p90:at(.9), mean:Math.round(a.reduce((n,x)=>n+x,0)/a.length*10)/10 }; };
  for(const e of sum.era){ e.gold = q(e.gold); e.fame = q(e.fame); e.roster = q(e.roster); e.fit = undefined; }
  sum.men.bouts = q(sum.men.bouts); sum.men.wins = q(sum.men.wins);
  sum.patrons = q(sum.patrons); sum.household = q(sum.household);
  sum.chron.distinctCount = Object.keys(sum.chron.distinct).length;
  const top = Object.entries(sum.chron.distinct).sort((a,b)=>b[1]-a[1]).slice(0,12);
  sum.chron.top = top; delete sum.chron.distinct;
  return sum;
}, [H, W, SEED]);
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
