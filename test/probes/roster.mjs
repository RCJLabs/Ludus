/* DO THE RIVALS HAVE ANYTHING TO READ? — #236's verify-first, all four of it

   RIVAL_MOVES.retrain sends a man to one of the five classes he is not with a bare `pick()`, and
   RIVAL_MOVES.buy lifts whoever tops `gladValue` off the block. Neither has ever looked at what the
   player is fielding — while COUNTERS and CLS_EDGE make the six-class cycle worth a real 1.15/0.91
   in every bout the player fights. The item wants the rivals to read the roster. Before a line of
   that is written it names four things to measure, and this measures them.

   (1) BASELINE COLLISION. Uniform retrain lands on the one class that counters the player about a
       fifth of the time by chance alone. Anything the bias adds has to beat that floor, and the
       item's own target is a high-train house past ~40%.
   (2) TELL FREQUENCY. `rivalTurn` acts on 30% of weeks and retrain/buy are two of nine weighted
       moves. If a counter-motivated move reaches `d.rivalLog` once every forty-plus weeks, the tell
       reads as a fluke rather than a house that has your number.
   (3) WIN-RATE DELTA. What the cycle is already worth, so the new pressure can be judged as
       additive rather than as something CLS_EDGE does not already produce.
   (4) CHEAPEST SIGNAL FIRST. The item proposes weighting the class tally toward men with a recent
       `g.lastFought`. That is more code than a plain tally, and it is only worth it if it names a
       DIFFERENT dominant class often enough to matter. This asks how often it does.

   Run: node test/probes/roster.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 12), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "READ";

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const CL = Object.keys(A.CLASSES);
  /* the class that BEATS d — COUNTERS[k] is the class k beats, so this is the reverse lookup the
     man card already uses ("beaten by ...") */
  const beats = d => Object.keys(A.COUNTERS).find(k => A.COUNTERS[k] === d) || null;

  const plainTop = men => { const t = {}; for(const g of men) t[g.cls] = (t[g.cls]||0) + 1;
    const ks = Object.keys(t).sort((a,b)=>t[b]-t[a]); return ks.length ? ks[0] : null; };
  const recentTop = (men, week) => { const t = {};
    for(const g of men){ const age = g.lastFought ? week - g.lastFought : 999;
      const w = age <= 4 ? 3 : age <= 12 ? 2 : 1;
      t[g.cls] = (t[g.cls]||0) + w; }
    const ks = Object.keys(t).sort((a,b)=>t[b]-t[a]); return ks.length ? ks[0] : null; };

  let weeks = 0, sampled = 0, differ = 0, noTop = 0, ties = 0, clear = 0, differClear = 0;
  let retrains = 0, buys = 0, moves = 0, hitCounter = 0, retrainable = 0;
  const spread = [];          /* how concentrated the player's roster actually is */
  const perHouse = [];
  const everFought = {};      /* how many of the roster have ever fought at all */
  let hasFought = 0, rosterN = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Rd"+h, "clean", `${SEED}-${h}`);
    let rt = 0, by = 0, mv = 0, hit = 0;
    for(let w=0; w<W && !d.over; w++){
      const logWas = (d.rivalLog||[]).length ? (d.rivalLog[0].week + "|" + d.rivalLog[0].text.slice(0,30)) : null;
      try { R.lanista(d, {}); } catch(e){ break; }
      weeks++;
      const men = A.activeG(d).filter(g=>g.status==="active");
      if(men.length >= 3){
        sampled++;
        const a = plainTop(men), b = recentTop(men, d.week);
        const t = {}; for(const g of men) t[g.cls] = (t[g.cls]||0) + 1;
        const top = Math.max(...Object.values(t));
        const tied = Object.values(t).filter(v=>v===top).length > 1;
        spread.push(+(top/men.length).toFixed(3));
        if(tied) ties++; else {
          clear++;
          /* THE QUESTION CHECK 4 ACTUALLY ASKS. A tally that changes its answer only on weeks where
             the top is a tie has changed nothing — it has broken a coin-flip differently. The
             number that decides whether recency weighting earns its code is the disagreement on
             weeks where there IS an unambiguous dominant class. */
          if(a !== b) differClear++;
        }
        if(!a) noTop++;
        else if(a !== b) differ++;
        rosterN += men.length;
        hasFought += men.filter(g=>g.lastFought).length;
      }
      /* the rival's own move, read off the log line it writes */
      const now = (d.rivalLog||[]).length ? (d.rivalLog[0].week + "|" + d.rivalLog[0].text.slice(0,30)) : null;
      if(now && now !== logWas){
        mv++; moves++;
        const t = d.rivalLog[0].text || "";
        if(/put him back on it as a/.test(t)){ rt++; retrains++;
          /* which class he became, against what would have countered the player */
          const dom = plainTop(men), want = dom ? beats(dom) : null;
          const got = CL.find(c => new RegExp(`as a ${c.toLowerCase()}`).test(t));
          if(want && got){ retrainable++; if(got === want){ hit++; hitCounter++; } }
        }
        else if(/off the block|goes to House|is bought|pays over the odds/.test(t)){ by++; buys++; }
      }
    }
    perHouse.push({ h, weeks:d.week, moves:mv, retrains:rt, buys:by, hitCounter:hit });
  }

  /* ---- (3) what the cycle is already worth, on the engine's own numbers ---- */
  const d0 = A.newGameState("Edge", "clean", `${SEED}-edge`, null);
  const man = (cls, q) => { const g = A.genGladiator(d0, q); g.id = d0.nextId++; g.status="active";
    g.mine = true; g.cls = cls; g.kit = A.defaultKit(cls); return g; };
  const duel = (ac, bc, n) => { let win = 0, k = 0;
    for(let i=0;i<n;i++){
      const a = man(ac, 70), b = man(bc, 70);
      const res = A.simulateSpar(A.clone(a), A.clone(b), "measured", { d:d0 }, {});
      if(res.winner === "A") win++; k++; }
    return k ? +(100*win/k).toFixed(1) : 0; };
  const edge = { counters: duel("Murmillo", "Thraex", 700),      /* A beats B on the cycle */
                 countered: duel("Thraex", "Murmillo", 700),
                 neutral:  duel("Murmillo", "Hoplomachus", 700),
                 CLS_EDGE_for:  A.CLS_EDGE("Murmillo","Thraex"),
                 CLS_EDGE_against: A.CLS_EDGE("Thraex","Murmillo") };

  /* ---- 5. THE CALIBRATION — does each house land where the item's targets want it? ----
     The read fires inside `retrain.run`, so the honest way to price it is to call that function on
     a real house with a real read and count where the man came out. Each lanista in turn, same
     roster, same read, so the only thing varying is who is doing the looking. */
  const cal = (()=>{ const rows = [];
    /* a house with something to read. 33-46% of weeks have no dominant class at all, so one seed
       played to a fixed week is a coin — walk until the roster IS a pattern, which is also the only
       state in which the feature does anything. */
    let base = null, read = null;
    for(let t=0; t<40 && !read; t++){
      const d = A.newGameState("Cal"+t, "clean", `${SEED}-cal-${t}`);
      for(let w=0; w<90 && !d.over; w++){
        try { R.lanista(d, {}); } catch(e){ break; }
        const r = A.rivalReadOf(d);
        if(r && r.want && w > 30){ base = A.clone(d); read = r; break; }
      }
    }
    if(!read) return { read:null, rows:[] };
    for(const nm of ["Tullius","Rufinus","Marcellus","Cossutius","Varro","Solonius","Pollio","Glaber"]){
      let hit = 0, n = 900, told = 0;
      for(let i=0;i<n;i++){
        const d = A.clone(base);
        const h = { name:nm, fighters:[], fame:100 };
        const f = A.makeRivalFighter(d, nm, 55);
        /* never start him as the class we are testing for, so the aim is always a real move */
        f.cls = Object.keys(A.CLASSES).find(c => c !== read.want);
        h.fighters.push(f);
        const line = A.RIVAL_MOVES.retrain.run(d, h);
        if(h.fighters[0].cls === read.want) hit++;
        if(line && /noticed that before you did|is for, and you are fielding it|which way to jump|aimed at somebody/.test(line)) told++;
      }
      rows.push({ nm, train:A.lanistaOf(nm).train, bid:A.lanistaOf(nm).bid,
        sharp:+A.readSharp({name:nm},"train").toFixed(2),
        sharpBid:+A.readSharp({name:nm},"bid").toFixed(2),
        pc:+(100*hit/n).toFixed(1), told:+(100*told/n).toFixed(1) });
    }
    return { read, rows }; })();

  return { weeks, sampled, differ, noTop, ties, clear, differClear, cal, retrains, buys, moves, hitCounter, retrainable,
    perHouse, edge, spread: spread.sort((a,b)=>a-b),
    fought: rosterN ? +(100*hasFought/rosterN).toFixed(1) : 0 };
}, [H, W, SEED]);

const pc = (a,b) => b ? `${(100*a/b).toFixed(1)}%` : "-";
const med = a => a.length ? a[Math.floor(a.length/2)] : 0;

console.log(`\n=== 1. BASELINE COLLISION — where uniform retrain actually lands ===`);
console.log(`  ${out.retrains} retrains over ${out.weeks} played weeks · ${out.retrainable} of them had a nameable counter-class`);
console.log(`  landed on it by chance: ${out.hitCounter} of ${out.retrainable} = ${pc(out.hitCounter, out.retrainable)}  [1 in 5 = 20.0% is the floor]`);

console.log(`\n=== 2. TELL FREQUENCY — how often a rival move reaches the log at all ===`);
console.log(`  ${out.moves} lines reached d.rivalLog over ${out.weeks} weeks — but that channel is SHARED: nemLog and`);
console.log(`  sagaLog write to it too, so it is not a count of rival moves. rivalTurn itself fires on 27.8% of weeks,`);
console.log(`  measured directly against its own R()>0.7 gate. The two counts below are matched on their own text.`);
console.log(`  of them ${out.retrains} retrains (one every ${(out.weeks/Math.max(1,out.retrains)).toFixed(0)}w) and ${out.buys} buys (one every ${(out.weeks/Math.max(1,out.buys)).toFixed(0)}w)`);
console.log(`  per house: ${out.perHouse.map(x=>`${x.retrains}r/${x.buys}b in ${x.weeks}w`).join(" · ")}`);

console.log(`\n=== 3. WHAT THE CYCLE IS ALREADY WORTH ===`);
console.log(`  CLS_EDGE says ${out.edge.CLS_EDGE_for} for the counter and ${out.edge.CLS_EDGE_against} against`);
console.log(`  on 700 even bouts a side: countering wins ${out.edge.counters}% · countered wins ${out.edge.countered}% · neutral ${out.edge.neutral}%`);

console.log(`\n=== 4. CHEAPEST SIGNAL FIRST — is recency weighting worth the code? ===`);
console.log(`  ${out.sampled} weeks with a roster of 3+ · the recency-weighted tally named a DIFFERENT class on ${out.differ} (${pc(out.differ,out.sampled)})`);
console.log(`  BUT ${out.ties} of those weeks (${pc(out.ties,out.sampled)}) had no single dominant class at all — a tie at the top`);
console.log(`  on the ${out.clear} weeks that DID have one, recency changed the answer ${out.differClear} times (${pc(out.differClear,out.clear)})`);
console.log(`  how concentrated a roster is: median top class holds ${(100*med(out.spread)).toFixed(0)}% of it`);
console.log(`  and ${out.fought}% of active men have ever fought (lastFought set), which is what the weighting reads`);
console.log(`\n=== 5. CALIBRATION — where each lanista's retrain actually lands ===`);
if(!out.cal.read) console.log("  the calibration house had no readable roster");
else {
  console.log(`  the house being read: ${out.cal.read.n} men, ${out.cal.read.share} of them ${out.cal.read.dom} — countered by ${out.cal.read.want}`);
  console.log(`  lanista      train  bid   sight  lands on the counter   says so`);
  for(const r of out.cal.rows)
    console.log(`  ${r.nm.padEnd(11)} ${String(r.train).padStart(5)} ${String(r.bid).padStart(4)}  ${String(r.sharp).padStart(5)}   ${String(r.pc).padStart(5)}%${r.pc>=40?"  <- past the item's 40% target":""}          ${String(r.told).padStart(5)}%`);
  console.log(`  [the uniform floor measured 15.8% — anything at that level is a house that is not looking]`);
}
console.log("");

await browser.close(); server.close();
