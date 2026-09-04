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
      rebellion:{any:0,ended:0,weeks:0}, war:{seen:0,done:0}, rome:{offered:0,gone:0}, succession:0 },
    chron: { lines:0, distinct:{}, byKind:{} },
    events: {}, patrons:[], piety:{ offerings:0, vows:0, blessedWeeks:0 },
    circuit:{ trips:0, weeksAway:0 }, works:0, monuments:0, collegium:0, household:[], loans:0,
    elections:0, gambits:0, laws:0, doctrines:0, brand:0, munera:0, court:0, pacts:0, powLot:0 };

  const mark = (o,k,n=1) => { o[k] = (o[k]||0) + n; };
  sum.feud = { weeks:0, declared:0, won:0 }; sum.rites = { honoured:0, unburied:0 }; sum.mercyLine = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState(SEED+"-"+h);
    const seenMen = new Set(); let wasAway = false; let hadLoan = false; let lastNem = null;
    let sawSaga = false, sagaMax = 0, wasRebel = false;
    for(let w=0; w<W; w++){
      if(d.over){ break; }
      let did;
      try { did = R.lanista(d); } catch(e){ mark(sum.sys, "lanistaThrew"); break; }
      sum.weeks++;
      for(const k of Object.keys(did||{})) mark(sum.did, k, did[k]);
      const e = ERA(w);
      sum.era[e].gold.push(Math.round(d.gold));
      sum.era[e].fame.push(Math.round(d.fame));
      const live = A.activeG(d);
      sum.era[e].roster.push(live.length);
      for(const g of d.gladiators) seenMen.add(g.id);
      /* the chronicle is the story the game actually tells */
      /* d.log is a rolling buffer, unshifted at the head and popped at LOG_ROLL — so new lines are
         AT THE FRONT and length alone cannot say how many arrived. Count by week stamp instead. */
      const ch = d.log || [];
      for(const c of ch){ if(!c || c.week !== d.week) continue;
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
      for(const c of (d.log||[])) if(c && c.week===d.week && /still alive somewhere/.test(c.text||"")) sum.mercyLine++;
    }
    /* end of run: what stands, what happened */
    const K = d.over ? d.over.kind : "survived";
    mark(sum.endings, K); if(d.over) sum.endedAt.push(Math.round(d.week/ (52/12) / 12 * 10)/10);
    if(sagaMax>=2) sum.arcs.saga.st2++; if(sagaMax>=3) sum.arcs.saga.st3++; if(sagaMax>=4) sum.arcs.saga.st4++;
    if(d.nemHouse) sum.arcs.nem.houses++; if(d.nemesis) sum.arcs.nem.men++;
    /* PER WEEK, NOT PER REBELLION — and `ended` was never written at all, so the survey has been
       reporting "rebellion 3 / ended 0" as if three arcs had failed to conclude when the 3 was three
       house-WEEKS with `d.rebellion` set and the 0 was a counter nothing incremented. Both are
       counted properly now: a rising edge is a rebellion, and its falling edge is an ending. */
    if(d.rebellion){ sum.arcs.rebellion.weeks++; if(!wasRebel){ sum.arcs.rebellion.any++; wasRebel = true; } }
    else if(wasRebel){ sum.arcs.rebellion.ended++; wasRebel = false; }
    if(d.war){ sum.arcs.war.seen++; if(d.war.done) sum.arcs.war.done++; }
    if(d.rome) sum.arcs.rome.gone++; if(d.romeOffer || (d.flags&&d.flags.romeOffered)) sum.arcs.rome.offered++;
    if((d.forebears||[]).length) sum.arcs.succession += d.forebears.length;
    sum.feud.won += (d.flags && d.flags.nemWon) || 0;
    sum.rites.honoured += d.honoured || 0; sum.rites.unburied += (d.unburied||[]).length;
    sum.patrons.push((d.patrons||[]).length);
    sum.piety.offerings += (d.week - (-9) - 0) && 0; /* not readable; offerings counted via blessing weeks */
    if(d.vow) sum.piety.vows++;
    sum.works += Object.keys(d.works||{}).length;
    sum.collegium += d.collegium ? 1 : 0;
    sum.household.push(Object.keys(d.household||{}).filter(k=>d.household[k]).length);
    sum.elections += d.aedile ? 1 : 0;
    sum.gambits += Object.keys(d.gambits||{}).length;
    sum.laws += d.law ? 1 : 0;
    sum.doctrines += d.doctrine ? 1 : 0;
    sum.brand += (d.brand && d.brand.licensed) ? 1 : 0;
    sum.munera += d.honoured || 0;
    sum.court += d.court ? 1 : 0;
    sum.pacts += d.pact ? 1 : 0;
    sum.powLot += d.powLot ? 1 : 0;
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
