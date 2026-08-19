/* THE EDITOR'S BOX, AND EVERYTHING THAT IS NOT IT — #168

   `missioScore`'s standing term is

       min(MISSIO_CAP, pfame*0.20 + houseFavour*0.22 + ctx.fav + patron*0.10)      MISSIO_CAP 28

   and #168 measured that `pfame*0.20 + houseFavour*0.22` alone reaches 28 in 18 of 18 houses at a
   median week 8, peaking between 63.6 and 285.8 — up to ten times the cap. So from about week 8
   everything else feeding that term buys nothing.

   THE SOURCE ALREADY STATES THE RULE THAT SORTS THEM. Beside `street`, two lines below:

       "the top tiers, who are nobody's client and shout anyway. OUTSIDE THE CAP because the cap is
        the editor's box, and deliberately small."

   By that rule the terms inside it divide cleanly:

     the box, correctly inside      houseFavour · a patron · riseFav ("your name carries weight in
                                    the editor's box", its own comment) · the boxes entrance ("the
                                    editor and the good seats their due") · the scenario's opening
                                    mercy pitch, which only matters before the cap saturates anyway
     NOT the box, wrongly inside    pfame ·  favMissio (`favourOf` is "the darling of Capua, they
                                    chant for him" — the CROWD, the same constituency as `street`) ·
                                    veteranGuard (what the man has survived) · blessMercy (Fortuna)

   Which makes the fault sharper than "six things stop paying". **A famous man and an unknown man of
   the same great house are worth the same on the ground**, because his own renown is inside a cap his
   owner's standing has already filled. Making a man famous stops protecting him.

   WHAT IS ASKED:
   · what each term is worth at the margin, at four house standings, and how much of it is truncated
   · what the SCORE distribution actually looks like in play, so a second cap can be derived from
     `missioWord`'s own bands rather than invented
   · and what splitting the term would do to a beaten man's odds, computed on the pure functions
     before anything is rebuilt

   INSTRUMENT NOTES:
   · `missioScore` and `missioOdds` are pure, so the variants are computed rather than simulated and
     carry no sampling error at all. The sand comes after, once a shape is chosen.
   · three seed prefixes on anything played. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 6), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "MIS";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;

  /* ---- the four house standings, built by hand, and every term priced at the margin ---- */
  const houses = [
    { nm:"a founding house", fame:40,   favor:12, pf:5,   wins:1,  fav:0,  rung:0 },
    { nm:"a made house",     fame:900,  favor:45, pf:60,  wins:12, fav:35, rung:2 },
    { nm:"a great house",    fame:4000, favor:85, pf:140, wins:40, fav:70, rung:5 },
    { nm:"the top of it",    fame:9000, favor:100,pf:220, wins:80, fav:95, rung:7 },
  ];
  const terms = houses.map(h=>{
    const d = A.newGameState("Ms","clean",`${SEED}-${h.nm.length}`,null);
    d.fame = h.fame; d.favor = h.favor; d.rise = { rank:h.rung, standing:0 };
    const g = A.activeG(d)[0];
    g.pfame = h.pf; g.wins = h.wins; g.favour = h.fav;
    const box  = (d.favor||0)*0.22 + h.rung*3;                  /* houseFavour + riseFav */
    const man  = (g.pfame||0)*0.20 + A.favMissio(g) + A.veteranGuard(g);
    return { nm:h.nm, box:+box.toFixed(1), man:+man.toFixed(1),
      pfame:+((g.pfame||0)*0.20).toFixed(1), favM:+A.favMissio(g).toFixed(1),
      vet:+A.veteranGuard(g).toFixed(1), rung:h.rung*3,
      total:+(box+man).toFixed(1), capped:Math.min(A.MISSIO_CAP, box+man),
      wasted:+Math.max(0, box+man - A.MISSIO_CAP).toFixed(1) };
  });

  /* ---- what a beaten man's odds are now, and under a split, computed on the pure functions ----
     The split: the BOX keeps MISSIO_CAP; the MAN gets a second bound, walked here so the choice can
     be read off `missioWord`'s own bands rather than picked. */
  const CASE = A.MERCY_CASE || { crowd:62, account:42, endured:16 };
  const bands = A.missioWord ? [0.86, 0.66, 0.42, 0.20] : [];
  const split = houses.map(h=>{
    const d = A.newGameState("Mp","clean",`${SEED}-s-${h.nm.length}`,null);
    d.fame = h.fame; d.favor = h.favor; d.rise = { rank:h.rung, standing:0 };
    const g = A.activeG(d)[0];
    g.pfame = h.pf; g.wins = h.wins; g.favour = h.fav;
    const P = A.missioPlace(d, null);
    const boxRaw = (d.favor||0)*0.22 + h.rung*3;
    const manRaw = (g.pfame||0)*0.20 + A.favMissio(g) + A.veteranGuard(g);
    /* now: everything in one cap. Reconstructed and checked against the engine's own answer. */
    const ctxNow = Object.assign({}, P, { tier:2, patron:null,
      fav: A.favMissio(g) + A.veteranGuard(g) + (P.fav||0) });
    const now = A.missioScore(g, ctxNow, CASE.crowd, CASE.account, CASE.endured, true);
    /* the split, at a walk of bounds for the man's side */
    const at = cap => {
      const boxPart = Math.min(A.MISSIO_CAP, boxRaw);
      const manPart = Math.min(cap, manRaw);
      /* the same score with `standing` replaced by the two parts: subtract what the engine put in
         and add what the split would */
      const engineStanding = Math.min(A.MISSIO_CAP, boxRaw + manRaw);
      return now - engineStanding + boxPart + manPart;
    };
    const walk = [0, 6, 9, 12, 15, 18, 28].map(c=>({ c, sc:+at(c).toFixed(1), p:+(A.missioOdds(at(c))*100).toFixed(1) }));
    return { nm:h.nm, boxRaw:+boxRaw.toFixed(1), manRaw:+manRaw.toFixed(1),
      now:+now.toFixed(1), nowP:+(A.missioOdds(now)*100).toFixed(1), walk };
  });

  /* ---- and the score a played house actually produces, so the bands are read off real weeks ---- */
  const seen = [];
  for(const pre of [`${SEED}-1`, `${SEED}-2`, `${SEED}-3`]){
    for(let h=0; h<H; h++){
      const d = A.newGameState("Mw"+h, "clean", `${pre}-${h}`, null);
      let n = 0, capWk = 0, boxSum = 0, manSum = 0, wasted = 0;
      for(let w=0; w<W; w++){
        if(d.over) break;
        d.gold = Math.max(d.gold, 200000);
        R.lanista(d);
        if(!d.lanista) break;
        const g = A.activeG(d).slice().sort((x,y)=>(y.pfame||0)-(x.pfame||0))[0];
        if(!g) continue;
        n++;
        const box = (d.favor||0)*0.22 + (A.riseFav ? A.riseFav(d) : 0);
        const man = (g.pfame||0)*0.20 + A.favMissio(g) + A.veteranGuard(g);
        boxSum += box; manSum += man;
        if(box + man >= A.MISSIO_CAP) capWk++;
        wasted += Math.max(0, box + man - A.MISSIO_CAP);
      }
      seen.push({ pre, h, end:d.week, n, capWk, box:n?boxSum/n:0, man:n?manSum/n:0, wasted:n?wasted/n:0,
        boxAlone: n ? boxSum/n : 0 });
    }
  }

  return { terms, split, seen, cap:A.MISSIO_CAP, mid:A.MISSIO_MID, slope:A.MISSIO_SLOPE,
    street:A.ACCLAIM_MISSIO, words:[0.86,0.66,0.42,0.20].map(v=>({ v, w:A.missioWord(v) })) };
}, [H, W, SEED]);

const f1 = x => x==null ? "—" : (+x).toFixed(1);

console.log(`\n  the cap is ${out.cap}; the curve turns at ${out.mid} with a slope of ${out.slope}; the street sits outside it at ${out.street}`);
console.log(`  the words: ` + out.words.map(x=>`${(x.v*100).toFixed(0)}%+ "${x.w}"`).join(" · "));

console.log(`\n  1 · WHAT EACH TERM IS WORTH, AND WHAT THE CAP THROWS AWAY\n`);
console.log(`  house                the box   (favour + rung)     the man   (renown + crowd + veteran)   total   capped at   thrown away`);
for(const t of out.terms)
  console.log(`  ${t.nm.padEnd(20)} ${f1(t.box).padStart(7)}   (${f1(t.box-t.rung)} + ${t.rung})${" ".repeat(6)} ${f1(t.man).padStart(7)}   (${f1(t.pfame)} + ${f1(t.favM)} + ${f1(t.vet)})${" ".repeat(4)} ${f1(t.total).padStart(6)}   ${String(t.capped).padStart(9)}   ${f1(t.wasted).padStart(11)}`);

console.log(`\n  2 · A BEATEN MAN'S ODDS NOW, AND UNDER A SPLIT — pure functions, no sampling\n`);
console.log(`  house                the box   the man   now      ` + out.split[0].walk.map(w=>`man cap ${String(w.c).padStart(2)}`).join("  "));
for(const s of out.split)
  console.log(`  ${s.nm.padEnd(20)} ${f1(s.boxRaw).padStart(7)}   ${f1(s.manRaw).padStart(7)}   ${(f1(s.nowP)+"%").padStart(6)}   ` + s.walk.map(w=>`${(f1(w.p)+"%").padStart(10)}`).join("  "));

console.log(`\n  3 · AND WHAT A PLAYED HOUSE CARRIES — ${out.seen.length} houses, the ledger held up\n`);
const n = out.seen.reduce((s,x)=>s+x.n,0), cw = out.seen.reduce((s,x)=>s+x.capWk,0);
console.log(`  the cap is full on ${cw} of ${n} house-weeks (${(cw/n*100).toFixed(1)}%)`);
console.log(`  mean the box carries: ${f1(out.seen.reduce((s,x)=>s+x.box*x.n,0)/n)} · mean the man carries: ${f1(out.seen.reduce((s,x)=>s+x.man*x.n,0)/n)} · mean thrown away a week: ${f1(out.seen.reduce((s,x)=>s+x.wasted*x.n,0)/n)}`);
console.log(`\n  raw:`);
console.log(`    seed        ended   weeks   cap full   the box   the man   thrown away`);
for(const s of out.seen)
  console.log(`    ${s.pre.padEnd(11)} ${String(s.end).padStart(5)}   ${String(s.n).padStart(5)}   ${String(s.capWk).padStart(8)}   ${f1(s.box).padStart(7)}   ${f1(s.man).padStart(7)}   ${f1(s.wasted).padStart(11)}`);

await browser.close(); server.close();
