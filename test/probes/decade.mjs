/* THE SECOND DECADE, AND WHO EVER SEES IT — #248 phase 1, the instrument.

   (`decade` was free in both directories; checked before writing.)

   #248's premise, written when the queue was drawn: *"a mature house faces seven demands a week and
   sees nothing it has not seen before — first-time events fall from 86 in the opening thirty weeks
   to zero past week 150"*, with the novelty curve at **0.57 / 0.26 / 0.19 / 0.14** new chronicle
   shapes a week by quarter and **319 / 69 / 17 / 13** first-time event ids. Its stated KPI is that
   curve: *"the fourth quarter above 0.25 new shapes a week without the first quarter rising."* And
   its stated risk is reach — *"content for the two in sixteen."*

   BOTH HALVES ARE OLDER THAN THE GAME THEY DESCRIBE. Since that measurement: #245 gave the event
   pool a weighted, cooled die and a freshness multiplier that raised distinct events met from 13 to
   23; #240 gave a dead rival house a lineage; #256 gave the bay a purse; #246 made the grudge do
   something; #247 moved the money row. Every one of those changes what a long-lived house meets. So
   the first thing to establish is whether the premise still holds, which is the same question that
   turned out to matter in #246 phase 1, #250's pin and #253's diagnosis.

   THREE ARMS, and none of them needs a game change to answer:

     1 · THE CURVE, per house rather than per corpus. `probes/pace.mjs` measures this already and
         its `seenShape` is per house, which is the right shape — the claim is about a player, not
         about the catalogue. This re-reads it on four times the houses, because the item's KPI is a
         number to two decimal places taken over twelve.

     2 · AND WHO REACHES THE SECOND DECADE AT ALL. `LATE`'s four gates are years 6, 7, 8 and 9 with
         conditions, and `lateWeek` is a 4.5% weekly roll that fires each key once. `d.flags.lateSeen`
         records which have happened, so the reach is readable off the state without exporting
         anything: how many houses live to each gate's week, how many of the four they see, and how
         long after the gate opens the roll actually lands. "Two in sixteen" is a claim about
         survival, and survival has moved twice since it was written.

     3 · AND WHAT THE LATE GAME SERVES. The curve says how much is NEW; this says what the weeks
         are made of. Past week 150, the chronicle's kinds and the events actually raised, with the
         share that is a repeat — because "seven demands a week and nothing it has not seen" is a
         claim about the mix, and a house meeting nothing new while meeting very little at all is a
         different item from one drowning in repeats.

     node test/probes/decade.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 64), W = +(process.argv[3] || 420), SEED = process.argv[4] || "DECADE";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H, W, SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState"].filter(k=>A[k]==null);
  /* the item's other half — "a mature house faces seven demands a week" — is a claim about the
     AGENDA, not about events raised, and the two are different surfaces. `agendaRanked` is the
     list the player is shown; if it is not on the handle the arm says so rather than reporting the
     event rate under the agenda's name, which is how a probe ends up refuting a claim it never
     measured. */
  const HASAG = typeof A.agendaRanked === "function";
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
    const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))];
    return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };
  const pc = (v, n) => n ? Math.round(1000*v/n)/10 : 0;
  const shapeOf = t => ((t||"")+"").replace(/[A-Z][a-z]+/g,"_").slice(0,40);
  /* ---- AND THE SAME SHAPE WITH THE DIGITS STRUCK OUT TOO ----
     The KPI's shape function replaces proper nouns and keeps NUMBERS, and only looks at the first
     forty characters. So a line that carries a changing figure near its start — "the 330th bout on
     this sand", a purse, a count of the dead — reads as a brand new shape every single time it
     appears. Before #248 phase 3 builds a ladder of milestone lines, which is precisely that shape,
     it is worth knowing how much of the novelty already being measured is writing and how much is
     arithmetic. Both curves are reported; the strict one strikes digits as well. */
  const shapeStrict = t => ((t||"")+"").replace(/[A-Z][a-z]+/g,"_").replace(/\d+/g,"#").slice(0,40);

  const nov = { shapes:[0,0,0,0], strict:[0,0,0,0], events:[0,0,0,0], weeks:[0,0,0,0],
    book:[0,0,0,0], bookNew:[0,0,0,0] };
  /* #248 phase 3 — is the book's line reaching the novelty loop at all, and is it counted as new? */
  const BOOKMARK = /still calls that corner|name in the yard, in an argument|for this house and the men|stops in the middle of a drill|comes to the gate asking after|cut into the underside|are arguing about whether/;
  const reach = { gates:{}, seenN:[], lived:[], sawAny:0, houses:0, whenSeen:{},
    gen:[], fore:[], everFore:0, foreWeek:[] };
  const QSTART = Math.floor(W * 0.75) + 1;      /* the quarter the KPI measures */
  const q4 = [];
  const late = { weeks:0, chronKinds:{}, evIds:{}, chronN:0, newShapes:0, newEvents:0, evN:0, agN:0, agWeeks:0 };
  const LATEK = ["memoir","boy","rival","tired"];
  /* the gates as WEEKS, since `yearOf` is not on the handle: years 6/7/8/9 at 18 weeks to the year */
  const YW = 18, GATEWK = { boy:6*YW, rival:7*YW, memoir:8*YW, tired:9*YW };
  for(const k of LATEK){ reach.gates[k] = 0; reach.whenSeen[k] = []; }

  for(let h=0; h<H; h++){
    const d = A.newGameState("De"+h, "clean", `${SEED}-${h}`);
    const seenShape = new Set(), seenEv = new Set(), seenStrict = new Set();   /* PER HOUSE */
    let lastLate = [], foreAt = null;
    const ledger = { start:null, end:null };
    for(let w=0; w<W; w++){
      if(d.over) break;
      const e = Math.min(3, Math.floor(w / (W/4)));
      /* ---- AND THE WEEK A LINE IS STAMPED WITH IS NOT ALWAYS THE WEEK IT IS READ IN ----
         `endWeek` opens with `lateWeek`, `foreWeek` and `bookWeek` and only later calls
         `ludusLedger`, which does `d.week++`. So everything written in the first half of the week is
         stamped with the OLD number, and a filter of `c.week === d.week` — which is what this loop
         and `pace.mjs` both used — DROPS IT. That is not a small slice: it is `LATE`, the forebear
         and the book, which is to say every piece of content #248 has added. Sixty-eight book lines
         were found by scanning a run's whole log and ZERO by this loop. Both ends of the week are
         taken now. */
      /* EXACTLY the lines this week added. Accepting two week numbers (see the note above) also
         re-reads the previous week's, which double-counts anything the `seen` sets do not absorb.
         `chron` UNSHIFTS, so the new entries are the ones in front of whatever was in front before —
         walk from index 0 until that same object, and stop. Identity, not week, not length: the log
         rolls at `LOG_ROLL` and a length diff goes wrong the moment it does. */
      const wasFront = (d.log||[])[0] || null;
      let did; try { did = R.lanista(d); } catch(x){ break; }
      const fresh = [];
      for(const c of (d.log||[])){ if(c === wasFront) break; fresh.push(c); }
      /* ---- ONE PASS, BECAUSE TWO PASSES CANNOT SEE THE SAME THING ----
         The first cut counted novelty here and then asked, in a second loop below, whether the late
         week's shapes were new. They never were: the first loop had already put every one of them
         into `seenShape`, so `late.newShapes` was a counter structurally incapable of moving —
         FAULT SIX, in the arm that exists to say whether the late game is new. The two questions
         are asked of the same value at the same moment now. */
      nov.weeks[e]++;
      const isLate = d.week > 150;
      if(isLate){ late.weeks++;
        if(HASAG){ let n = 0; try { n = (A.agendaRanked(d)||[]).length; } catch(x){ n = -1; }
          if(n >= 0){ late.agN += n; late.agWeeks++; } } }
      for(const k of Object.keys((did && did.events) || {})){
        const fresh = !seenEv.has(k);
        if(fresh){ seenEv.add(k); nov.events[e]++; }
        if(isLate){ late.evN += did.events[k];
          late.evIds[k] = (late.evIds[k]||0) + did.events[k];
          if(fresh) late.newEvents++; } }
      for(const c of fresh){ if(!c) continue;
        const s = shapeOf(c.text), fresh = !seenShape.has(s);
        { const st = shapeStrict(c.text);
          const isBook = BOOKMARK.test(c.text||"");
          if(isBook) nov.book[e]++;
          if(!seenStrict.has(st)){ seenStrict.add(st); nov.strict[e]++; if(isBook) nov.bookNew[e]++; } }
        if(fresh){ seenShape.add(s); nov.shapes[e]++; }
        if(isLate){ late.chronN++;
          late.chronKinds[c.kind || "none"] = (late.chronKinds[c.kind||"none"]||0) + 1;
          if(fresh) late.newShapes++; } }
      /* 2 · the LATE keys, off the state the game writes */
      if(foreAt == null && ((d.forebears||[]).length)) foreAt = d.week;
      /* ---- WHAT A HOUSE HAS ACCUMULATED, AT THE FOURTH QUARTER'S TWO ENDS — #248 phase 3 ----
         Phases 1 and 2 failed the KPI for opposite reasons: reach without the quarter, then the
         quarter without reach. What has BOTH is the house's own record — every surviving house
         accumulates, and it keeps accumulating. So the question is what those counts are worth: how
         far they move between week 315 and the end, which is what decides whether a ladder of
         milestones on them can produce new lines at the rate the bar wants. */
      if(d.week === QSTART || (d.week === W && !ledger.end)){
        let R2 = null; try { R2 = A.houseRecord(d); } catch(e){}
        if(R2){ const row = { served:R2.served, bouts:(R2.w||0)+(R2.l||0), wins:R2.w||0,
          kills:R2.k||0, buried:R2.lost||0, freed:R2.freed||0, years:R2.years||0 };
          if(d.week === QSTART) ledger.start = row; else ledger.end = row; } }
      const ls = (d.flags && d.flags.lateSeen) || [];
      if(ls.length !== lastLate.length){
        for(const k of ls) if(!lastLate.includes(k)) reach.whenSeen[k] = (reach.whenSeen[k]||[]).concat(d.week);
        lastLate = ls.slice(); }
    }
    reach.houses++;
    reach.lived.push(d.week);
    /* ---- AND WHETHER THE HOUSE EVER HAS A FOREBEAR — #248 phase 2's gating question ----
       `d.forebears` is written by `succeed` and read by two UI sheets and nothing else: not the
       chronicle, not the bay, not the patrons. Phase 2 is "the forebear as a presence", and before
       any of that is worth writing, the question is whether the state exists at all and WHEN — a
       presence that arrives in the second decade is exactly what v3.226.0 said the KPI needs, and
       one that almost never arrives is another `LATE` doubling. */
    reach.gen.push(d.generation || 1);
    reach.fore.push(((d.forebears||[]).length));
    if((d.forebears||[]).length) reach.everFore++;
    if(foreAt != null) reach.foreWeek.push(foreAt);
    /* the house reached Q4 if it was still standing at the boundary; the end row is its last week */
    if(ledger.start){ if(!ledger.end){ let R3=null; try { R3 = A.houseRecord(d); } catch(e){}
        if(R3) ledger.end = { served:R3.served, bouts:(R3.w||0)+(R3.l||0), wins:R3.w||0,
          kills:R3.k||0, buried:R3.lost||0, freed:R3.freed||0, years:R3.years||0 }; }
      if(ledger.end) q4.push({ start:ledger.start, end:ledger.end, weeks:d.week - QSTART }); }
    const ls = (d.flags && d.flags.lateSeen) || [];
    reach.seenN.push(ls.length);
    if(ls.length) reach.sawAny++;
    for(const k of LATEK) if(d.week >= GATEWK[k]) reach.gates[k]++;
  }

  return {
    houses:reach.houses,
    /* 1 · the KPI */
    novelty: { shapesPerWeek: nov.shapes.map((n,i)=>nov.weeks[i] ? Math.round(1000*n/nov.weeks[i])/1000 : 0),
      strictPerWeek: nov.strict.map((n,i)=>nov.weeks[i] ? Math.round(1000*n/nov.weeks[i])/1000 : 0),
      rawShapes: nov.shapes.slice(), rawStrict: nov.strict.slice(), rawWeeks: nov.weeks.slice(),
      bookLinesByQuarter: nov.book.slice(), bookNewByQuarter: nov.bookNew.slice(),
      newEventsPerQuarter: nov.events, weeks: nov.weeks,
      itemSaid: { shapes:[0.57,0.26,0.19,0.14], events:[319,69,17,13] } },
    /* 2 · the reach */
    reach: { lived:q(reach.lived),
      livedToGate: Object.fromEntries(Object.entries(reach.gates).map(([k,n])=>[k, pc(n, reach.houses)])),
      gateWeeks:GATEWK,
      sawAnyLate: pc(reach.sawAny, reach.houses),
      howManyOfFour: q(reach.seenN),
      sawNone: pc(reach.seenN.filter(n=>n===0).length, reach.houses),
      sawAllFour: pc(reach.seenN.filter(n=>n===4).length, reach.houses),
      whenSeen: Object.fromEntries(Object.entries(reach.whenSeen).map(([k,a])=>[k, { n:a.length, ...(q(a)||{}) }])),
      /* #248 phase 2 */
      generation:q(reach.gen), everHadAForebear: pc(reach.everFore, reach.houses),
      forebearsPerHouse:q(reach.fore), firstForebearWeek:q(reach.foreWeek) },
    /* 3 · what the late weeks are made of */
    /* #248 phase 3 — the house's own record at the fourth quarter's two ends */
    q4Ledger: { qStart:QSTART, housesReachingQ4: q4.length,
      weeksInQ4: q(q4.map(x=>x.weeks)),
      atStart: Object.fromEntries(["served","bouts","wins","kills","buried","freed","years"]
        .map(k=>[k, q(q4.map(x=>x.start[k]))])),
      atEnd: Object.fromEntries(["served","bouts","wins","kills","buried","freed","years"]
        .map(k=>[k, q(q4.map(x=>x.end[k]))])),
      moved: Object.fromEntries(["served","bouts","wins","kills","buried","freed","years"]
        .map(k=>[k, q(q4.map(x=>x.end[k]-x.start[k]))])) },
    late: { weeks:late.weeks,
      chronPerWeek: late.weeks ? Math.round(1000*late.chronN/late.weeks)/1000 : 0,
      eventsPerWeek: late.weeks ? Math.round(1000*late.evN/late.weeks)/1000 : 0,
      newShapesPerWeek: late.weeks ? Math.round(1000*late.newShapes/late.weeks)/1000 : 0,
      newEventsPerWeek: late.weeks ? Math.round(1000*late.newEvents/late.weeks)/1000 : 0,
      agendaRowsPerWeek: late.agWeeks ? Math.round(1000*late.agN/late.agWeeks)/1000 : null,
      agendaReadable: HASAG && late.agWeeks > 0,
      chronKinds:late.chronKinds,
      topEvents: Object.entries(late.evIds).sort((a,b)=>b[1]-a[1]).slice(0, 12) },
  };
}, [H,W,SEED]);

if(out.why){ console.log(out.why); await browser.close(); server.close(); process.exit(1); }
/* FAULT SIX: if no house ever reached a LATE gate, arm 2 is a statement about the sample. */
if(out.reach && out.reach.sawAnyLate === 0)
  console.log("!! no house in this run saw a single LATE event — arm 2 is about the sample, not the game");
if(out.late && !out.late.weeks)
  console.log("!! no house lived past week 150 — arm 3 measured nothing");
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
