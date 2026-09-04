/* IS THERE ANYBODY TO SEE IT? — #241's verify-first, and its first question decides the other three

   `MONUMENTS.endow` costs 44,000 denarii, takes three years, and its blurb promises "games that
   hold themselves, funded out of a sum so large the interest alone pays for blood every year after
   you are gone". Grep the whole 32,000-line source for the literal string "endow" and there is
   EXACTLY ONE HIT — the table entry itself. It never calls `festivalNow`, never touches `CALENDAR`,
   never calls `makeGames`. No game is ever staged. What the purchase actually buys is
   `perk:"acclaim", n:1.1`, consumed in one line of `worksWeek`.

   #241 wants it to build the thing it advertises: a seventh, house-owned `CALENDAR` entry produced
   through the same pipeline the other six use. Four phases. Its own first verify-first question is
   the one that decides whether the other three are worth writing:

     1 · DOES ANYBODY EVER BUILD IT. `workOpen` gates the monument tier behind `monuReady` — all
         five WORKS finished — and then asks 44,000 denarii. The project's own survey has median
         gold FLAT at about 4,000 from year four on. So this counts, over played campaigns: who
         reaches the monument tier at all, when, and which of the four they finish. Two arms,
         because "nobody builds it" is a claim about a POLICY: the rope's builder takes the cheapest
         open work first, and a lanista who wants THIS one does not.

     2 · AND WHAT THE 1.1 IS WORTH TODAY, which the item does not ask and which prices the whole
         purchase. `d.acclaim` is not a bank: `acclaimWeek` drags it toward `acclaimTarget(d)` every
         week — 10% of the gap up, 3% down, less a 0.15 drift — so a flat +1.1 a week is pushing
         against a spring, not accumulating in it. The steady state is wherever the two balance,
         and that is a number, measured here on paired houses rather than reasoned about.

     3 · IS THERE A WEEK FREE FOR A SEVENTH FESTIVAL. `CALENDAR` uses 6 of 18 (2, 5, 8, 11, 14, 17)
         and `festivalNow` is a `find` on `f.w === yearWeek(d)`, so a seventh entry must not collide.
         Static, and cheap, and checked rather than assumed.

     4 · AND DOES IT SURVIVE THE HANDOVER. `succeed()` is said never to touch `d.works`. A monument
         that dies with the lanista would make "games in your name when your grandsons are old" the
         second false promise in the same blurb, so the heir is actually run.

   WHAT IT ANSWERED — three arms over two seeds, 96 campaign runs of up to 520 weeks:

     1 · NOBODY BUILDS IT. Endow is 86,500 denarii deep: the five WORKS cost 42,500 between them,
         `monuReady` gates the tier behind finishing all five, and endow then asks 44,000. A house
         that builds NOTHING peaks at a median 16,200 and an all-seeds maximum of 49,728. Across the
         96 runs the four monuments were finished **1 colossus, 1 endow, 0 arena, 0 capua** — and
         `capua`, which the source calls "the last sentence in the book", has never been built by
         anything. The `wanted` arm found the tier open on 377 house-weeks and the money there on
         ONE of them. So the item's own falsifier for phases 2-4 fires: a festival card here is
         content nobody reaches.
     2 · AND THE FLAT TICK IS THE STRONGEST PERK IN THE TABLE, which inverts the item's phase 3.
         Acclaim is a spring, not a bank — `acclaimWeek` pulls toward `acclaimTarget` at 10% up and
         3% down, less a 0.15 drift — so 1.1 a week holds a GAP, and the fixed point the constants
         imply is (1.1-0.15)/0.03 ~= 32 points. Measured on played houses: **+30 (p50)**, worth +44
         points of plain acclaim. Phase 3 proposed shrinking it.
     3 · there are 12 free weeks of 18 and no collision, so the seam would have worked.
     4 · and the succession promise is TRUE — a finished monument, one still going up, and the perk
         all cross `succeed()`. Verified by running it, not by reading it.

   TWO THINGS THIS PROBE GOT WRONG FIRST, both caught by its own instruments. The arms carried the
   label in the seed string, so "builder" and "wanted" were different POPULATIONS and the 5-of-16
   against 1-of-16 between them was entirely which houses the RNG dealt each arm. And the paired
   acclaim comparison came apart because acclaim gates real rolls, so a house holding the perk stops
   being its twin within a few weeks — eight pairs read from -8.8 to +54.8 and the sign flipped
   twice. The gap against `acclaimTarget` needs no twin and is what the perk actually buys.

   Run: node test/probes/endow.mjs [houses] [weeks] [seed] */
import fs from "node:fs";
import path from "node:path";
import { serve, open, ROOT } from "../harness.mjs";
const H = +(process.argv[2] || 16), W = +(process.argv[3] || 520);
const SEED = process.argv[4] || "ENDOW";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const HITS = (src.match(/endow/g) || []).length;
const CAL  = [...(src.match(/const CALENDAR = \[([\s\S]*?)\n\];/)||["",""])[1]
  .matchAll(/\{ w:(\d+),\s+key:"([a-z]+)"/g)].map(m=>({ w:+m[1], key:m[2] }));

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;

  /* ---- 1: who reaches the monument tier, and what they put up ---- */
  const arm = (label) => {
    const rows = [];
    /* AND WHETHER THE ARM'S OWN LEVER EVER FIRED. Two arms that come back identical to the digit
       are either an honest null or an inert lever, and #240 published the second as the first
       once already. This counts the weeks `wanted` could act and the weeks it did. */
    const lever = { open:0, afford:0, began:0 };
    for(let h=0; h<H; h++){
      /* THE ARMS MUST SHARE A SEED OR THEY ARE NOT ARMS. The first run of this put the label in
         the seed string, so "builder" and "wanted" were different POPULATIONS — one reported 5 of
         16 reaching the tier against the other's 1 of 16, and the whole of that gap was which
         houses the RNG happened to hand each arm. Paired now. */
      const d = A.newGameState("En"+h, "capua", `${SEED}-${h}`);
      const row = { h, weeks:0, ready:null, peakGold:0, done:{}, began:{}, over:null,
        acc:0, accN:0, works:0 };
      for(let w=0; w<W && !d.over; w++){
        try { R.lanista(d, label === "hoard" ? {} : { works:true }); } catch(e){ break; }
        row.weeks++;
        row.peakGold = Math.max(row.peakGold, d.gold||0);
        row.acc += A.acclaimOf(d); row.accN++;
        if(row.ready == null && A.monuReady(d)) row.ready = d.week;
        /* THE ARM THAT WANTS IT. The rope's builder takes the cheapest open work first, which is
           `colossus` at 30,000 before `endow` at 44,000 — so "the reference builder does not finish
           endow" would be a fact about a sort order. This one commissions endow the moment it is
           open and affordable, which is what a lanista who read the blurb would do. */
        if(label === "wanted" && A.workOpen(d, "endow") && !A.workDone(d, "endow") && !A.workOn(d, "endow")){
          lever.open++;
          const Wd = A.workDef("endow");
          const need = Math.ceil(Wd.cost * A.WORK_DEPOSIT) + A.workWeekly(Wd) * 12;
          if((d.gold||0) >= need){ lever.afford++;
            try { if(A.beginWork(d, "endow") === true) lever.began++; } catch(e){} }
        }
        row.works = Math.max(row.works, A.WORK_KEYS.filter(k=>A.workDone(d,k)).length);
        for(const k of A.MONU_KEYS){
          if(A.workOn(d,k) && !row.began[k]) row.began[k] = d.week;
          if(A.workDone(d,k) && !row.done[k]) row.done[k] = d.week;
        }
      }
      row.over = d.over ? (d.over.kind || "over") : null;
      row.end = d.week;
      row.acc = +(row.acc / Math.max(1,row.accN)).toFixed(1);
      rows.push(row);
    }
    return { label, rows, lever };
  };

  /* ---- 2: WHAT THE 1.1 IS WORTH ----
     THE FIRST DRAFT COMPARED ABSOLUTE ACCLAIM ON PAIRED HOUSES AND THE PAIRS CAME APART. Acclaim
     gates real rolls — patron arrivals, the merch stall, the mob's draw — so a house holding the
     perk diverges from its twin within a few weeks and the two are no longer the same experiment;
     eight pairs read from -8.8 to +54.8 and the sign flipped twice.
     The perk's own signature is cleaner and does not need a twin. `acclaimWeek` pulls `d.acclaim`
     toward `acclaimTarget(d)` — 10% of the gap up, 3% down, less a 0.15 drift — so WITHOUT the perk
     a house settles a little BELOW its target, and with it a little above. The steady-state GAP is
     the thing the 44,000 denarii actually buys, and it is measured on the same house either way. */
  const worth = (()=>{
    const run = (withIt, n) => {
      const d = A.newGameState("Acc", "capua", `${SEED}-acc-${n}`);
      d.week = 200; d.fame = 2200; d.gold = 9000;
      if(withIt){ d.works = d.works || {}; d.works.endow = { left:0, owed:0, paid:44000 }; }
      const gaps = [], lvl = [];
      for(let w=0; w<260 && !d.over; w++){
        try { R.lanista(d, {}); } catch(e){ break; }
        gaps.push(A.acclaimOf(d) - A.acclaimTarget(d));
        lvl.push(A.acclaimOf(d));
      }
      const tail = gaps.slice(-80), tl = lvl.slice(-80);
      const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
      return { gap: +mean(tail).toFixed(2), level: +mean(tl).toFixed(1),
        capped: tl.filter(x=>x >= 99.5).length, weeks: gaps.length, perk: A.workPerk(d,"acclaim") };
    };
    const pairs = [];
    for(let n=0;n<14;n++) pairs.push({ n, without: run(false,n), with: run(true,n) });
    return pairs;
  })();

  /* ---- 3: is a week free, and does festivalNow ever see two claimants ---- */
  const weeks = A.CALENDAR ? A.CALENDAR.map(f=>f.w) : [];
  const free = [];
  for(let w=1; w<=18; w++) if(!weeks.includes(w)) free.push(w);

  /* ---- 4: does a monument survive the handover ---- */
  const heir = (()=>{
    const d = A.newGameState("Heir", "capua", `${SEED}-heir`);
    d.week = 220; d.fame = 2600; d.gold = 12000;
    d.works = d.works || {};
    d.works.endow = { left:0, owed:0, paid:44000 };          /* finished */
    d.works.colossus = { left:20, owed:9000, paid:12000 };   /* and one still going up */
    const before = { done: A.workDone(d,"endow"), on: !!A.workOn(d,"colossus"),
      perk: A.workPerk(d,"acclaim"), gen: d.generation };
    let ok = null, threw = null;
    try {
      if(typeof A.succeed === "function"){
        d.heir = { kind:"son", name:"Lucius Verres", traits:[] };
        A.succeed(d, "son");
        ok = true;
      }
    } catch(e){ threw = String(e && e.message || e).slice(0,140); }
    return { before, threw, ran: ok,
      after: { done: A.workDone(d,"endow"), on: !!A.workOn(d,"colossus"),
        perk: A.workPerk(d,"acclaim"), gen: d.generation } };
  })();

  /* THREE ARMS. `hoard` builds NOTHING — it is the ceiling on what a house can accumulate, and it
     separates "the builder's policy is what keeps him poor" from "the money is not there". */
  return { arms: [arm("hoard"), arm("builder"), arm("wanted")], worth, calWeeks: weeks, free, heir,
    costs: A.MONU_KEYS.map(k=>({ k, cost:A.workDef(k).cost, years:A.workDef(k).years,
      weekly:A.workWeekly(A.workDef(k)) })) };
}, [H, W, SEED]);

const q = (a,f) => { const v=[...a].filter(x=>x!=null).sort((x,y)=>x-y);
  return v.length ? v[Math.min(v.length-1, Math.floor(v.length*f))] : null; };
const pc = (a,b) => b ? `${(100*a/b).toFixed(1)}%` : "-";

console.log(`\n  "endow" appears ${HITS} time(s) in src/ludus.jsx — the table entry and nothing else`);
console.log(`  the monument ladder: ${out.costs.map(c=>`${c.k} ${c.cost}d (${c.weekly}/wk x ${c.years}y)`).join(" · ")}`);
console.log(`  and the FIVE works that gate it cost 42,500 between them — so endow is 86,500 denarii deep`);

for(const A2 of out.arms){
  const R2 = A2.rows, n = R2.length;
  console.log(`\n=== 1. WHO EVER GETS THERE? — arm "${A2.label}" (${n} houses x up to ${W} weeks) ===`);
  const ready = R2.filter(x=>x.ready != null);
  console.log(`  reached monuReady (all five works done): ${ready.length} of ${n} (${pc(ready.length,n)})`
    + (ready.length ? ` · at week p50 ${q(ready.map(x=>x.ready),0.5)} · earliest ${Math.min(...ready.map(x=>x.ready))}` : ""));
  console.log(`  houses that died first: ${R2.filter(x=>x.over).length} of ${n} · median last week ${q(R2.map(x=>x.end),0.5)}`);
  console.log(`  of the FIVE works that gate the tier, finished: ${R2.map(x=>x.works).join(" · ")} (p50 ${q(R2.map(x=>x.works),0.5)} of 5)`);
  console.log(`  peak gold: p50 ${q(R2.map(x=>x.peakGold),0.5)} · p90 ${q(R2.map(x=>x.peakGold),0.9)} · max ${Math.max(...R2.map(x=>x.peakGold))} — against endow's 44,000`);
  if(A2.label === "wanted"){ const L = A2.lever;
    console.log(`  the arm's own lever: the tier was open to endow on ${L.open} weeks, it could afford the deposit on ${L.afford}, and commissioned it ${L.began} time(s)`);
    console.log(`    (identical rows to "builder" with lever.open at 0 would mean an INERT arm, not a null result)`); }
  for(const k of ["colossus","endow","arena","capua"]){
    const beg = R2.filter(x=>x.began[k]).length, fin = R2.filter(x=>x.done[k]).length;
    console.log(`    ${k.padEnd(9)} commissioned by ${beg} of ${n}, FINISHED by ${fin}`);
  }
}

console.log(`\n=== 2. AND WHAT IS THE 1.1 A WEEK WORTH? ===`);
console.log(`  \`d.acclaim\` is dragged toward acclaimTarget every week (10% of the gap up, 3% down, -0.15`);
console.log(`  drift), so the perk pushes against a spring. What it holds is a GAP above the target:`);
for(const x of out.worth)
  console.log(`    house ${String(x.n).padStart(2)}: gap without ${String(x.without.gap).padStart(6)} · with ${String(x.with.gap).padStart(6)}`
    + ` · level ${String(x.without.level).padStart(5)} → ${String(x.with.level).padStart(5)}`
    + (x.with.capped ? ` · pinned at 100 on ${x.with.capped} of 80 weeks` : ""));
const dg = out.worth.map(x=>x.with.gap - x.without.gap);
const dl = out.worth.map(x=>x.with.level - x.without.level);
const mean = a => a.reduce((s,x)=>s+x,0)/a.length;
console.log(`  the gap the perk holds: p50 ${q(dg,0.5)} · mean ${mean(dg).toFixed(2)} points above where the house would sit`);
console.log(`  and in plain acclaim:   p50 ${q(dl,0.5)} · mean ${mean(dl).toFixed(2)} · ${out.worth.filter(x=>x.with.capped>0).length} of ${out.worth.length} houses spent time pinned at 100`);
console.log(`    (the equilibrium the constants imply: 1.1 = 0.03*gap + 0.15 → gap ~= ${((1.1-0.15)/0.03).toFixed(0)} points, capped by the 100 ceiling)`);

console.log(`\n=== 3. IS THERE A WEEK FREE FOR A SEVENTH FESTIVAL? ===`);
console.log(`  CALENDAR holds ${out.calWeeks.length} of 18: ${out.calWeeks.join(", ")} — from source, ${CAL.map(c=>`${c.w}:${c.key}`).join(" ")}`);
console.log(`  free: ${out.free.join(", ")} (${out.free.length} of 18)`);
console.log(`  collisions in the table itself: ${out.calWeeks.length === new Set(out.calWeeks).size ? "none" : "YES — festivalNow's find would be ambiguous"}`);

console.log(`\n=== 4. DOES IT SURVIVE THE HANDOVER? ===`);
const Hh = out.heir;
console.log(`  succeed() ran: ${Hh.ran}${Hh.threw ? ` · THREW: ${Hh.threw}` : ""}`);
console.log(`  before: endow done ${Hh.before.done}, colossus still going up ${Hh.before.on}, perk ${Hh.before.perk}, generation ${Hh.before.gen}`);
console.log(`  after:  endow done ${Hh.after.done}, colossus still going up ${Hh.after.on}, perk ${Hh.after.perk}, generation ${Hh.after.gen}`);
console.log("");

await browser.close(); server.close();
