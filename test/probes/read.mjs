/* #231 — THE READ IN WORDS, AND THE NUMBER UNDER IT

   The item: "The pre-fight card offers 50d / 150d / 400d stakes beside a judgement like 'would be
   second best' or 'even, near enough' — a bet priced in denarii against odds priced in prose, on
   the same panel where the engine holds a real number. Recommend the doctore's read price the
   wager the way the missio line already prices mercy ('if he falls now — 13 in the hundred'): the
   same figure the roll uses, shown before coin goes down."

   THREE OF ITS FOUR LIMBS LOOK ALREADY ANSWERED IN THE SOURCE, so measure them first:

     the stakes are not 50/150/400. `stakesFor(d)` scales them off the purse and STAKES_MIN is a
       FLOOR, so those three are what a broke house sees.
     the wager panel is not priced in prose. It prints `oddsWord(oddsFor(S, betChance(...)))` and
       the note over `betChance` says the panel and `makeBet` were made to take that probability
       from one place.
     the read is not beside the stakes. `read.word` is drawn at arena step 1 (choose a man); the
       stake chips are at step 2.

   WHICH LEAVES THE LIMB THE ITEM DID NOT WRITE DOWN, and it is the one worth having. `readMatch`
   bands its word off `rateMan` — "the crude rating behind every 'who would be favoured' line —
   power() without a bout around it": six stats on fixed weights, a flat 1.12/0.9 for a counter,
   and nothing else. The sand rolls `winChance`: real kit, the true class match-up, showmanship,
   the prep edge, and an odds-scale sharpening fitted to measured outcomes. Two different
   functions, so the word and the roll can point opposite ways — #150 exactly.

   And the word is not decoration. `matchAgainst` SORTS BY THAT EDGE and the foe's file prints its
   top five under "Against your house" — the panel that answers "who do I send".

   WHAT IT REPORTED, AND WHAT IT REPORTS NOW. The header's figures are the ones that opened the
   item; re-run against v3.175.0 and the word-band tables tighten to 46–54 for "even, near enough"
   and 0 of 37,217 readings point the other way, while the CALIBRATION arm — which takes its edge
   from the blind path, since `rateMan`'s ranking still lives there — is unchanged, because
   `rateMan` is unchanged. That is the point of keeping the two apart: the curve is what the read
   used to be banded on, and it still says what it always said.

     node test/probes/read.mjs 8 90 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 8), W = +(process.argv[3] || 90);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"READ" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","readMatch","matchAgainst","winChance","rateMan","styleOf","activeG",
                "canFight","foeSeen","fieldAverage","scoutMan","defaultKit","STATS"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const pct = n => Math.round(n*1000)/10;
  const q = (a, f) => a.length ? a.slice().sort((x,y)=>x-y)[Math.min(a.length-1, Math.floor(a.length*f))] : null;

  const card = [], file = [];       /* { word, edge, wc } by where the panel draws it */
  const sorts = [];                 /* matchAgainst's top man against the roll's */
  const strip = [];                 /* the decomposition: which input rateMan is missing */
  const cards = { offers:0, seen:0, sine:0 };
  let weeks = 0, houses = 0, tRate = 0, tWin = 0, calls = 0;

  /* WHAT rateMan CANNOT SEE, put back one at a time. `power` reads morale, fatigue, footing, kit
     and regard; `winChance` adds showmanship, FOE_EDGE and an odds-scale sharpening. `rateMan` has
     the six stats and an injury penalty and nothing else. */
  const cp = f => JSON.parse(JSON.stringify(f));
  const level = (f, keys) => { const o = cp(f);
    if(keys.has("soft")){ o.morale = 70; o.fatigue = 0; o.footing = 1; o.regardMult = 1; }
    if(keys.has("kit")){ o.kit = A.defaultKit(o.cls); o.mods = null; }
    if(keys.has("sho")) o.sho = 50;
    return o; };

  for(let h = 0; h < H; h++){
    let d = A.newGameState(`READ-${h}`, "clean", `READ-${h}`);
    houses++;
    for(let w = 0; w < W && !d.over; w++){
      weeks++;
      const mine = A.activeG(d).filter(g=>A.canFight(g));
      const offers = (d.games && d.games.offers) || [];

      for(const o of offers){
        cards.offers++;
        if(A.foeSeen(d, o)) cards.seen++;
        if(o.stakes === "sine") cards.sine++;
      }

      const take = (foe, into) => {
        for(const g of mine){
          const rd = A.readMatch(g, foe, true);
          if(!rd) continue;
          /* the RATING edge, kept separately: once the word bands the roll, `rd.edge` is the roll,
             and the calibration arm below would be asking the roll about itself. The blind path
             still returns `rateMan`'s ranking, so take it from there. */
          const blindRd = A.readMatch(g, foe, false);
          const t0 = performance.now(); const wc = A.winChance(g, foe, 0, A.styleOf(g)); tWin += performance.now()-t0;
          const t1 = performance.now(); A.rateMan(g); A.rateMan(foe); tRate += performance.now()-t1;
          calls++;
          if(!Number.isFinite(wc)) continue;
          into.push({ id:g.id, word:rd.word, edge:blindRd ? blindRd.edge : rd.edge, wc, pc:rd.pc });
        }
      };

      /* ---- where the panel draws it: the card's opponent, and the rivals' files ---- */
      for(const o of offers) if(o && o.opp) take(o.opp, card);

      for(const H2 of (d.rivals||[]).slice(0, 3)) for(const f of (H2.fighters||[]).slice(0, 3)){
        const at = file.length;
        take(f, file);
        const mineNow = file.slice(at);
        /* the panel's own ordering, from the panel's own function rather than rebuilt — BOTH WAYS
           ROUND, because `matchAgainst` reads `scoutLive` and a rope that never pays to scout only
           ever sees the blind list. The blind order is `rateMan`'s on purpose (it leaks nothing);
           the paid one is the whole of what the scouting is sold for. */
        for(const watched of [false, true]){
          const keep = f.seen;
          if(watched) f.seen = d.week; else delete f.seen;
          const row = A.matchAgainst(d, f);
          if(row.length >= 2 && mineNow.length === row.length){
            const wcOf = id => (mineNow.find(s=>s.id===id) || {}).wc;
            const picked = wcOf(row[0].g.id), best = Math.max(...mineNow.map(s=>s.wc));
            if(Number.isFinite(picked)) sorts.push({ watched, same:picked===best, best, picked });
          }
          if(keep == null) delete f.seen; else f.seen = keep;
        }
        /* ---- and WHY: level one input at a time and ask the roll again ---- */
        if(mineNow.length && strip.length < 3000){
          const g = mine.find(x=>x.id===mineNow[0].id);
          if(g){
            const w = ks => A.winChance(level(g, new Set(ks)), level(f, new Set(ks)), 0, "measured");
            const rec = { edge:mineNow[0].edge, full:mineNow[0].wc, tac:w([]),
              soft:w(["soft"]), kit:w(["kit"]), sho:w(["sho"]), all:w(["soft","kit","sho"]) };
            if(Object.values(rec).every(Number.isFinite)) strip.push(rec);
          }
        }
      }
      R.lanista(d, {});
    }
  }

  /* ---- a positive control on the fog: does having a man watched turn the reading on? ---- */
  let fog = null;
  {
    const d = A.newGameState("READ-FOG", "clean", "READ-FOG");
    let o = null;
    for(let i=0;i<60 && !o;i++){ R.lanista(d, {});
      o = ((d.games && d.games.offers) || []).find(x=>x.opp && x.oppRef && x.oppRef.house) || null; }
    if(o){
      const before = A.foeSeen(d, o);
      const h = A.houseOf(d, o.oppRef.house);
      const f = h && (h.fighters||[]).find(x=>x.id===o.oppRef.fid);
      d.gold += 100000;
      const r = f ? A.scoutMan(d, h.name, f.id) : null;
      fog = { before, after:A.foeSeen(d, o), ok:!!(r && r.ok) };
    }
  }

  const WORDS = ["would be favoured","has a little the better of it","even, near enough",
                 "would be second best","is overmatched"];
  const table = rows => WORDS.map(w=>{
    const v = rows.filter(x=>x.word===w).map(x=>x.wc);
    return { w, n:v.length, lo:v.length?pct(Math.min(...v)):null, p10:v.length?pct(q(v,0.10)):null,
             mid:v.length?pct(q(v,0.50)):null, p90:v.length?pct(q(v,0.90)):null,
             hi:v.length?pct(Math.max(...v)):null };
  });

  const up = new Set(["would be favoured","has a little the better of it"]);
  const dn = new Set(["would be second best","is overmatched"]);
  const wrong = rows => rows.filter(x => (up.has(x.word) && x.wc < 0.5) || (dn.has(x.word) && x.wc > 0.5));
  const evenOff = rows => rows.filter(x => x.word === "even, near enough" && (x.wc < 0.42 || x.wc > 0.58));
  const sum = rows => ({ n:rows.length, wrong:wrong(rows).length, wrongPct:pct(wrong(rows).length/Math.max(1,rows.length)),
    evenOff:evenOff(rows).length, evenN:rows.filter(x=>x.word==="even, near enough").length,
    outer: rows.filter(x=>(x.word==="would be favoured" && x.wc<=0.5)||(x.word==="is overmatched" && x.wc>=0.5)).length });

  /* the box against the roll: every reading that shows a figure must show the roll's own */
  const shown = file.concat(card).filter(x=>x.pc != null);
  const offBy = shown.filter(x => x.pc !== Math.round(x.wc*100));
  const sortSum = w => { const rows = sorts.filter(s=>s.watched===w), bad = rows.filter(s=>!s.same);
    const cost = bad.map(s => pct(s.best - s.picked));
    return { n:rows.length, bad:bad.length, pct:pct(bad.length/Math.max(1,rows.length)),
      mid: cost.length?q(cost,0.5):null, max: cost.length?Math.max(...cost):null,
      big: bad.filter(s=>s.best-s.picked>=0.05).length }; };
  const blind = sortSum(false), paid = sortSum(true);

  /* what edge the roll actually calls even — the read puts the centre of its scale at zero */
  const near = file.concat(card).filter(x=>x.wc > 0.45 && x.wc < 0.55).map(x=>x.edge);
  const evenAt = near.length ? Math.round(q(near, 0.5)*1000)/1000 : null;
  /* the calibration curve: what a given rateMan edge is actually worth on the roll */
  const BUCKETS = [[-99,-0.14],[-0.14,-0.04],[-0.04,0.04],[0.04,0.14],[0.14,99]];
  const curve = BUCKETS.map(([a,b])=>{
    const v = file.concat(card).filter(x=>x.edge>a && x.edge<=b).map(x=>x.wc);
    return { a, b, n:v.length, mid:v.length?pct(q(v,0.5)):null }; });
  /* and where the gap comes from. ONLY ON PAIRINGS THE ROLL CAN STILL MOVE: three quarters of the
     sweep is a rival champion against a novice, pinned on winChance's own 2%–98% clamp, where
     levelling an input moves nothing and drags every median to zero. */
  const live = strip.filter(s => s.full > 0.05 && s.full < 0.95);
  const move = k => { const v = live.map(s=>Math.abs(s.full - s[k]));
    return v.length ? { mid:pct(q(v,0.5)), p90:pct(q(v,0.9)) } : null; };
  const gaps = { tac:move("tac"), soft:move("soft"), kit:move("kit"), sho:move("sho"), all:move("all") };

  return { houses, weeks, cards, fog, calls,
    tWin: Math.round(tWin), tRate: Math.round(tRate),
    perWin: Math.round(tWin/Math.max(1,calls)*1000)/1000, perRate: Math.round(tRate/Math.max(1,calls)*1000)/1000,
    cardTab: table(card), fileTab: table(file), cardSum: sum(card), fileSum: sum(file),
    blind, paid, shown:shown.length, offBy:offBy.length,
    strip: strip.length, live:live.length, gaps, curve, evenAt, nearN:near.length,
    seenPct: pct(cards.seen/Math.max(1,cards.offers)) };
}, [H, W]);

if(out.miss){ console.log("handle is missing:", out.miss.join(", ")); }
else {
  const row = b => `  ${b.w.padEnd(30)} ${String(b.n).padStart(6)}  `
    + `${String(b.lo??"—").padStart(5)} ${String(b.p10??"—").padStart(5)} ${String(b.mid??"—").padStart(5)} `
    + `${String(b.p90??"—").padStart(5)} ${String(b.hi??"—").padStart(5)}`;
  const head = `  ${"word".padEnd(30)} ${"n".padStart(6)}  ${"lo".padStart(5)} ${"p10".padStart(5)} ${"mid".padStart(5)} ${"p90".padStart(5)} ${"hi".padStart(5)}`;

  console.log(`\n#231 — the read in words, against the number the sand rolls`);
  console.log(`${out.houses} houses · ${out.weeks} weeks\n`);

  console.log(`ON THE CARD (arena step 1, the man you are choosing against the offer's man) — win chance %:`);
  console.log(head); out.cardTab.forEach(b=>console.log(row(b)));
  const c = out.cardSum;
  console.log(`  ${c.wrong} of ${c.n} (${c.wrongPct}%) point the other way from the roll; `
    + `${c.evenOff} of ${c.evenN} "even, near enough" sit outside 42–58; ${c.outer} are the outer bands\n`);

  console.log(`ON A RIVAL'S FILE (what "Against your house" reads) — win chance %:`);
  console.log(head); out.fileTab.forEach(b=>console.log(row(b)));
  const f = out.fileSum;
  console.log(`  ${f.wrong} of ${f.n} (${f.wrongPct}%) point the other way; `
    + `${f.evenOff} of ${f.evenN} "even" outside 42–58; ${f.outer} outer\n`);

  console.log(`"AGAINST YOUR HOUSE" — the top of the panel's own list:`);
  for(const [k, v] of [["nobody watched", out.blind], ["watched", out.paid]])
    console.log(`  ${k.padEnd(15)} ${String(v.bad).padStart(5)} of ${String(v.n).padStart(5)} foes (${v.pct}%) `
      + `name a man who is not the best by the roll · median miss ${v.mid} points, worst ${v.max}, `
      + `${v.big} cost 5 or more`);
  console.log("");

  console.log(`THE FIGURE THE PANEL PRINTS, AGAINST THE ROLL IT CAME FROM:`);
  console.log(`  ${out.shown} readings carry a number · ${out.offBy} of them are not the roll's own\n`);
  console.log(`WHAT A rateMan EDGE IS ACTUALLY WORTH ON THE ROLL:`);
  for(const b of out.curve)
    console.log(`  edge ${String(b.a).padStart(6)} .. ${String(b.b).padStart(5)}  ${String(b.n).padStart(6)} pairings  median win chance ${b.mid}%`);
  console.log("");
  console.log(`  the roll calls a bout even at a rateMan edge of ${out.evenAt}, not 0 `
    + `(${out.nearN} pairings landing between 45% and 55%)\n`);
  console.log(`WHERE THE GAP COMES FROM — level one input on BOTH men and roll again `
    + `(${out.live} of ${out.strip} pairings off the 2%–98% clamp):`);
  for(const [k, v] of Object.entries(out.gaps))
    console.log(`  ${k.padEnd(6)} ${v ? `median move ${v.mid} points, p90 ${v.p90}` : "—"}`);
  console.log("");

  console.log(`WHAT THE CARD SHOWS: ${out.cards.offers} offers · a reading live on ${out.seenPct}% `
    + `· ${out.cards.sine} sine missione (the one card that already quotes a number)`);
  if(out.fog) console.log(`  fog control: foeSeen ${out.fog.before} before a scouting, ${out.fog.after} after (scoutMan ok: ${out.fog.ok})`);
  console.log(`\nCOST: ${out.calls} pairings · winChance ${out.tWin}ms total (${out.perWin}ms each) `
    + `· rateMan×2 ${out.tRate}ms (${out.perRate}ms each)`);
}
await browser.close(); server.close();
