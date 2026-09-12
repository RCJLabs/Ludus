/* WHAT THE HOUSE DOES WITH A PROMISE IT HAS MADE TO A MAN — the dead-flag sweep's first question.

     node test/probes/promise.mjs 16 420

   THE SWEEP THAT OPENED THIS. A census of `src/ludus.jsx` — every field assigned on an object,
   against every read of that field anywhere in the file — came back with **538 distinct assigned
   fields, 30 of them written once and read nowhere**. Two of the thirty (`g.fromYard`,
   `h.lineage.soldAt`) were found by hand in #273 and are the calibration: the census finds what a
   careful reading finds. It ships as arm 1 of `checks/promise.mjs`, so the class cannot grow
   unremarked, and `pairWord` is not on its list because this release is why.

   AND THE INSTRUMENT HAD TO BE FIXED FIRST. The census stripped comments AND string and template
   state, so that prose could not count as a read. It returned eight extra dead fields — `avenged`,
   `ended`, `headline`, `imported`, `lastScheme`, `snap`, `stone`, `watchedTac` — and every one of
   them is read inside JSX. The cause is an APOSTROPHE: thirty-six thousand lines of English prose
   inside JSX, and "he doesn't" opens a string state that runs to the next apostrophe, blanking
   whole regions of the render before any read in them is counted. A read is `.field` WITH A
   LEADING DOT and English does not write a leading dot, so string bodies were never the hazard;
   comments are, because this file's notes name dead fields on purpose. Stripping comments and
   nothing else returns the thirty exactly, with no eighth, ninth or tenth.

   Six of the thirty are false positives and are named here so the list is not re-walked:
   `el.dataset.fold` is read by the stylesheet (`.plate[data-fold="1"]`), and `d.law.women` /
   `d.law.damnati` are duplicate bookkeeping beside a live edict (`L.edicts` plus `EDICTS[k].check`
   carry the whole consequence). Six more are read by the gate and by nothing in the game:
   `o.inside`, `c.tookHouse`, `h.watchful`, `d.flags.kinBroken`, `d.flags.everBorrowed`,
   `x.writtenOff` — a check asserts each is stamped, so they are evidence, not mechanism.

   WHAT IS LEFT CLUSTERS, AND THE CLUSTER IS ONE TABLE. `ASKS` is the five things a man will come
   and ask you for. Of the five:

     brother   yes -> d.flags.noSell     READ by herSpareMan — the wife will not pick a man
                                         you promised not to sell.          THE PROMISE IS KEPT.
     woman     yes -> g.family           READ by the death letter (4933) — somebody has to go into
                                         town and tell her.                 THE PROMISE IS KEPT.
     burial    yes -> d.collegium        READ in twenty places. But the ask BUILDS IT BY HAND
                                         instead of calling `foundCollegium`, and so drops the fee,
                                         the rep, the chronicle line and `rememberAll(d,"collegium")`.
     match     yes -> d.flags.wantMatch  { gid, fid, until:+14 }. ONE HIT IN THE FILE.
     year      yes -> d.flags.oneMoreYear{ gid, until:+YEAR_WEEKS }. ONE HIT IN THE FILE.

   And `WORDS.beside` — "put them out together when the card allows it" — writes `d.flags.pairWord`,
   which is a third one-hit promise.

   THE FILE HAS THE MACHINERY FOR ALL OF IT, TWICE OVER. `deadlines(d)` feeds the agenda block
   headed *"what you have promised, or been told"*, which already carries bookings, challenges,
   levies, a patron's want, an unburied man and the pact's expiry — six deadlines, none of them a
   promise to one of your own. And `REGARD.kept` reads, in full, *"You gave him your word and then
   you kept it."* `match`, `year` and `burial` call `remember` on neither branch.

   AND #239 SAID THIS WAS ALREADY DONE. Its note over `REGARD.leave` reads: *"`woman` was the only
   one of the five ASKS whose branches never called `remember`."* It was one of FOUR, and #239 fixed
   the one it was looking at.

   ---- SO THE QUESTION THAT DECIDES WHETHER ANY OF IT SHIPS IS HOW OFTEN IT HAPPENS ----
   The `woman` precedent is the bar and it is a refusal: #239 measured that ask at ONCE IN 2,672
   PLAYED WEEKS and built three of its five phases into nothing. `askWeek` rolls at 6%, picks one
   man, and `d.flags.asked` is one-way — a man asks once in his life about anything. But `ASK_DIE`
   re-weighted the five after that note was written, and `year` now carries the HIGHEST weight of
   the five (w:4 against brother 1, match 1, burial 2, woman 3) and `ASK_FRESH` triples a key that
   has never fired. So the rates the note quotes cannot be read forward.

   This counts them. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 64), W = +(process.argv[3] || 420);
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","endWeek","deadlines","calendarRows","activeG","regardOf","YEAR_WEEKS"]
    .filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  const asks = {}, mem = {}, made = {}, lived = [], lives = [];
  let weeks = 0, askWeeks = 0;
  const bump = (o,k) => { o[k] = (o[k]||0) + 1; };
  const kinds = g => ((g && g.memory) || []).map(m=>m.kind);
  const FLAG = { match:"wantMatch", year:"oneMoreYear" };

  for(let i=0;i<H;i++){
    const d = A.newGameState("Pr","clean",`PROMISE-${i}`);
    const open = [];
    let lastPair = null, lastColl = false;
    let w = 0;
    for(; w<W; w++){
      if(d.over) break;
      weeks++;

      /* the week's question as it stands before the rope answers it */
      const ev = d.pendingEvent;
      const isAsk = !!(ev && ev.id === "ask" && ev.data && ev.data.k);
      const k = isAsk ? ev.data.k : null, gid = isAsk ? ev.data.gid : null;
      const before = isAsk ? kinds((d.gladiators||[]).find(x=>x.id===gid)) : null;
      const hadSell = ((d.flags||{}).noSell||[]).length;

      try { R.lanista(d, MOST); } catch(e){}

      if(isAsk){
        askWeeks++; bump(asks, k);
        const g = (d.gladiators||[]).find(x=>x.id===gid);
        (mem[k] = mem[k] || []).push(...kinds(g).slice(before.length));
        /* what the yes actually left behind */
        const fk = FLAG[k];
        if(fk && (d.flags||{})[fk]){
          bump(made, fk);
          open.push({ k, fk, gid, name:(g&&g.name)||"?", made:d.week,
            until:d.flags[fk].until, seen:JSON.stringify(d.flags[fk]),
            past:0, onCal:0, named:0, cleared:null });
        }
        if(k === "brother" && ((d.flags||{}).noSell||[]).length > hadSell) bump(made, "noSell");
        if(k === "woman"  && g && g.family) bump(made, "family");
        if(k === "burial" && d.collegium && !lastColl){ bump(made, "collegium"); lastColl = true; }
      }
      /* `beside` is a WORD, not an ask — it stamps the week and nothing else */
      if((d.flags||{}).pairWord != null && d.flags.pairWord !== lastPair){
        lastPair = d.flags.pairWord; bump(made, "pairWord");
        open.push({ k:"beside", fk:"pairWord", gid:null, name:null, made:d.week,
          until:d.flags.pairWord + 14, seen:String(d.flags.pairWord),
          past:0, onCal:0, named:0, cleared:null });
      }

      try { A.endWeek(d); } catch(e){ break; }

      /* and what the house does about each running promise, week by week. The forward view is
         `calendarRows` — the one screen that puts every dated thing on one line — and the test is
         EXACT, not a text match: is there a row pinned to the promise's own due week? */
      if(open.length){
        let cal = [];
        try { cal = A.calendarRows(d, A.YEAR_WEEKS) || []; } catch(e){}
        for(const pr of open){
          if(pr.cleared != null) continue;
          const cur = pr.fk === "pairWord" ? d.flags.pairWord : (d.flags||{})[pr.fk];
          if(cur == null){ pr.cleared = d.week; continue; }
          const now = pr.fk === "pairWord" ? String(cur) : JSON.stringify(cur);
          if(now !== pr.seen){ pr.cleared = -d.week; continue; }     /* touched, not cleared */
          if(d.week >= pr.until) pr.past++;
          if(cal.some(r=>r.week === pr.until)) pr.onCal++;
          if(pr.name && cal.some(r=>r.week === pr.until
              && `${r.title||""} ${r.sub||""}`.includes(pr.name))) pr.named++;
        }
      }
    }
    lives.push(w);
    for(const pr of open) lived.push({ ...pr, endWeek:d.week });
  }

  /* ---- ARM B: THE GATE, NOT THE DIE ----
     `askWeek` rolls at 6% and picks ONE man, so a key that never fires may be gated out or may
     simply never have been drawn. These are different faults and only one of them is worth fixing.
     This walks every eligible man every week and asks each of the five whether it COULD speak. */
  const pool = {}, ever = {};
  let poolWeeks = 0, manWeeks = 0;
  for(let i=0;i<H;i++){
    const d = A.newGameState("Pr","clean",`GATE-${i}`);
    const crossed = {};
    for(let w=0; w<W; w++){
      if(d.over) break;
      const men = A.activeG(d).filter(g=>A.regardOf(g) >= 45 && ((g.wins||0)+(g.losses||0)) >= 3
        && !((d.flags||{}).asked||[]).includes(g.id));
      manWeeks += men.length;
      if(men.length) poolWeeks++;
      const here = {};
      for(const g of men) for(const k of A.ASK_KEYS){
        let ok = false; try { ok = !!A.ASKS[k].need(d, g); } catch(e){}
        if(ok){ here[k] = 1; if(!crossed[k]) crossed[k] = 1; } }
      for(const k of Object.keys(here)) pool[k] = (pool[k]||0) + 1;
      try { R.lanista(d, MOST); } catch(e){}
      try { A.endWeek(d); } catch(e){ break; }
    }
    for(const k of Object.keys(crossed)) ever[k] = (ever[k]||0) + 1;
  }

  /* ---- ARM C: THE CONVERSATION, WHICH NO ROPE HAS EVER STARTED ----
     `WORDS` is reached only through `haveWordWith`, a player action. `beside` — "put them out
     together when the card allows it" — is the third promise, and it cannot be counted by watching
     a rope play. This spends the week's one conversation on a man, every week it can. */
  const words = {}; let talks = 0, pairs = 0, talkWeeks = 0;
  /* AND WHETHER THE PROMISE IS EVEN KEEPABLE. `beside` says "put them out together when the card
     allows it". A pair bout exists (`offer.pair`, `doPairFight`, `kind:"pair"` in the book) and the
     rope takes them. What nothing does is put THESE TWO on one. `d.flags.pairWord` is a WEEK —
     a house-wide number with no room for the two men it was given about. */
  let pairOffered = 0, pairTook = 0, keptPair = 0, sworn = 0;
  const waits = [];
  for(let i=0;i<H;i++){
    const d = A.newGameState("Pr","clean",`TALK-${i}`);
    let lastPair = null;
    const owed = [];             /* {a, b, at} — the pairs the house gave its word about */
    for(let w=0; w<W; w++){
      if(d.over) break;
      talkWeeks++;
      const g = A.activeG(d).find(x=>A.wordReady(d, x));
      let promised = null;
      if(g && A.haveWordWith(d, g.id)){
        talks++;
        const ev = d.pendingEvent;
        if(ev && ev.id === "word" && ev.data && ev.data.k){
          words[ev.data.k] = (words[ev.data.k]||0) + 1;
          if(ev.data.k === "beside" && ev.data.ex && ev.data.ex.oid) promised = [g.id, ev.data.ex.oid];
          try { A.EVENTS.word.run(d, ev, 0); } catch(e){}
          d.pendingEvent = null;
        }
      }
      if((d.flags||{}).pairWord != null && d.flags.pairWord !== lastPair){
        lastPair = d.flags.pairWord; pairs++;
        if(promised){ sworn++; owed.push({ a:promised[0], b:promised[1], at:d.week, done:0 }); }
      }
      if(d.games && d.games.offers && d.games.offers.some(o=>o.pair)) pairOffered++;
      const was = {}; for(const x of (d.gladiators||[])) was[x.id] = (x.wins||0)+(x.losses||0);
      const tookBefore = (R.stats().tookPair)||0;
      try { R.lanista(d, MOST); } catch(e){}
      const took = ((R.stats().tookPair)||0) - tookBefore;
      if(took){ pairTook += took;
        const outThisWeek = (d.gladiators||[]).filter(x=>((x.wins||0)+(x.losses||0)) > (was[x.id]||0)).map(x=>x.id);
        for(const o of owed){ if(!o.done && outThisWeek.includes(o.a) && outThisWeek.includes(o.b)){
          o.done = d.week; keptPair++; waits.push(d.week - o.at); } }
      }
      try { A.endWeek(d); } catch(e){ break; }
    }
    for(const o of owed) if(!o.done) waits.push(-(d.week - o.at));
  }

  return { weeks, houses:H, askWeeks, asks, mem, made, lived, lives,
           pool, ever, poolWeeks, manWeeks, words, talks, pairs, talkWeeks,
           pairOffered, pairTook, keptPair, sworn, waits };
}, [H, W, MOST]);

if(out.why){ console.log("PROBE COULD NOT RUN: " + out.why); }
else {
  const L = out.lives.slice().sort((a,b)=>a-b);
  const med = L[Math.floor(L.length/2)];
  const n = k => out.asks[k] || 0;
  const tot = Object.values(out.asks).reduce((a,b)=>a+b,0) || 1;
  console.log(`\n#276 — THE PROMISES THE HOUSE MAKES TO ITS OWN MEN`);
  console.log(`${out.houses} houses · ${out.weeks} played weeks · median house lives ${med}w `
    + `(p25 ${L[Math.floor(L.length*0.25)]} · p75 ${L[Math.floor(L.length*0.75)]} · max ${L[L.length-1]})`);
  console.log(`${out.askWeeks} weeks a man came to the table — ${(out.askWeeks/out.weeks*100).toFixed(2)}% `
    + `of weeks, ${(out.askWeeks/out.houses).toFixed(2)} per house\n`);

  console.log(`  the five ASKS, and what each one leaves on the man:`);
  for(const k of ["match","burial","brother","woman","year"]){
    const m = [...new Set(out.mem[k]||[])];
    console.log(`    ${k.padEnd(8)} ${String(n(k)).padStart(4)} asks `
      + `· ${(n(k)/tot*100).toFixed(1).padStart(5)}% of them `
      + `· one per ${n(k)?Math.round(out.weeks/n(k)):"never"} played weeks `
      + `· his memory gains: ${m.length ? m.join(",") : "NOTHING"}`);
  }

  console.log(`\n  what a yes actually leaves behind:`);
  for(const k of ["noSell","family","collegium","wantMatch","oneMoreYear","pairWord"])
    console.log(`    ${k.padEnd(12)} ${String(out.made[k]||0).padStart(3)}`);

  const byKey = {};
  for(const x of out.lived) (byKey[x.fk] = byKey[x.fk] || []).push(x);
  console.log(`\n  and what becomes of the ones that carry a date:`);
  if(!Object.keys(byKey).length) console.log(`    none were made`);
  for(const [fk, list] of Object.entries(byKey)){
    const past  = list.filter(x=>x.past > 0).length;
    const cl    = list.filter(x=>x.cleared != null && x.cleared > 0).length;
    const tch   = list.filter(x=>x.cleared != null && x.cleared < 0).length;
    const onCal = list.filter(x=>x.onCal > 0).length;
    const named = list.filter(x=>x.named > 0).length;
    const held  = list.map(x=>x.past).sort((a,b)=>a-b);
    console.log(`    ${fk.padEnd(12)} ${String(list.length).padStart(3)} made `
      + `· ${past} outlived their own date · ${cl} cleared · ${tch} touched `
      + `· a calendar row pinned to that week: ${onCal} · one that NAMES him: ${named} `
      + `· median ${held.length?held[Math.floor(held.length/2)]:0}w sitting there after it fell due`);
  }

  console.log(`\n  ARM B — the gate, not the die. Which asks COULD have spoken, over `
    + `${out.poolWeeks} weeks with a man eligible to speak at all (${out.manWeeks} man-weeks):`);
  for(const k of ["burial","brother","match","woman","year"])
    console.log(`    ${k.padEnd(8)} in the pool on ${String(out.pool[k]||0).padStart(4)} weeks `
      + `(${((out.pool[k]||0)/Math.max(1,out.poolWeeks)*100).toFixed(1)}%) `
      + `· reached in ${out.ever[k]||0} of ${out.houses} houses`);

  console.log(`\n  ARM C — the conversation, which no rope has ever started. `
    + `${out.talks} words had over ${out.talkWeeks} weeks:`);
  for(const k of Object.keys(out.words).sort((a,b)=>out.words[b]-out.words[a]))
    console.log(`    ${k.padEnd(8)} ${String(out.words[k]).padStart(4)} `
      + `(${(out.words[k]/Math.max(1,out.talks)*100).toFixed(1)}% of words)`);
  console.log(`    -> d.flags.pairWord stamped ${out.pairs} times`);
  const kept = out.waits.filter(x=>x >= 0).sort((a,b)=>a-b);
  console.log(`\n  and whether the word given in a \`beside\` is even keepable:`);
  console.log(`    a pair was on the card on ${out.pairOffered} of ${out.talkWeeks} weeks `
    + `(${(out.pairOffered/Math.max(1,out.talkWeeks)*100).toFixed(1)}%) · ${out.pairTook} pair bouts fought`);
  console.log(`    ${out.sworn} promises given about a NAMED pair · ${out.keptPair} of them `
    + `(${(out.keptPair/Math.max(1,out.sworn)*100).toFixed(1)}%) saw those two men go out in the same week `
    + (kept.length ? `· median wait ${kept[Math.floor(kept.length/2)]}w` : `· never`));
  console.log("");
}

await browser.close(); server.close();
