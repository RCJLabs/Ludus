/* WHAT A HOUSE KEEPS, AND WHAT IT LOSES — the falsification clause on the reversibility thesis

   NAME: this was written as `late.mjs` and OVERWROTE the probe of that name — #131's agenda-label
   instrument, the one that produced the 97.7% figure this whole item rests on. It was recovered from
   git and this took a name of its own. `late.mjs` asks what a great house is SHOWN; this asks what a
   great house HOLDS. Two different questions, and the first one nearly went in the bin for it.

   #131 measured that 97.7% of what a year-12 house is shown was available in week one, and the estate
   table said why: a great house has ACQUIRED EVERYTHING AND IS AT RISK OF NOTHING. Two attempts to name
   the missing thing were then refuted by measurement — staff already leave (`walk.mjs`), and the
   replacement is not free (1.1 weeks of the house's own bill, stable over four seeds). What survived
   both refutations is a claim about DIRECTION rather than about price:

     the late game's losses do not fail because they are cheap. They fail because they are REVERSIBLE.

   That is a testable sentence and this is the test. `estate.mjs` reads SNAPSHOTS, which is exactly the
   instrument that could not tell "never lost" from "lost and refilled before anybody looked" — the
   fault that produced the last two dead items. So this reads TRANSITIONS instead: every week, the set
   of things the house holds is diffed against last week's, and every gain and every loss is recorded
   with the era it happened in and whether that exact thing ever came back.

   THE THESIS PREDICTS, and each of these can fail:
     · late weeks carry gains and almost no losses
     · the few late losses are REGAINED, at a much higher rate than early ones
     · the one thing that is permanently lost is men, which are replaceable by purchase — so the
       inventory keeps men apart from the estate rather than letting them drown the signal

   ---- INSTRUMENT, GIVEN THIS SESSION'S RECORD ----
   · n is 72 houses and the run takes seconds, so it is run on FOUR SEEDS and anything that moves
     between them is printed as unstable rather than quoted. Two findings died this session for being
     read off 24 houses, and one of them was a MAXIMUM.
   · a room upgrade must not read as a loss. Rooms are keyed on presence alone and levels are counted
     separately, because `room:bath@1 -> room:bath@2` would otherwise book a loss and a gain per level.
   · the raw transition list is printed, not just the counts. The regex-and-trust habit is what this
     project's standing hazard is made of.

   ---- AND PRINTING IT CAUGHT THE FIRST DRAFT, WHICH ANSWERED THE WRONG QUESTION ----
   The first inventory took `estate.mjs`'s twenty booleans as one flat list of "things the house holds"
   and reported that late weeks are 47% losses — a result that would have refuted the thesis outright.
   The raw table said otherwise: **832 of the 1,332 losses were `nemesis`**, with `rome` at 130 and
   `saga` at 100 behind it. A nemesis is an arch-rival who comes and goes, `d.rome` is a TRIP, and a
   saga is a running story. None of them is a possession, and together they were three quarters of the
   signal. The inventory is split three ways now:

     ESTATE     rooms, works, feats, staff, household, patrons, doctrine, wife, heir, collegium, aedile
     CONTESTED  the bay, the primacy, the name Capua settles on — held, and takeable BY A RIVAL
     EPISODE    nemesis, Rome, saga, court, election, war, loan, vow — begun and finished, never "lost"

   Only the first two can answer #131. The third is printed so that the next reader can see it was
   excluded on purpose rather than quietly dropped. */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 72), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "LATE";
const EARLY = 90, LATE = 180;
/* a loss only proves irreversibility if the house lived long enough to have undone it */
const FAIR = +(process.argv[5] || 40);

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);

const out = await p.evaluate(([H,W,SEED,EARLY,LATE])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const era = w => w < EARLY ? "early" : w < LATE ? "mid" : "late";
  const ERAS = ["early","mid","late"];
  const CATS = ["estate","contested","episode"];
  /* an episode is begun and finished; a holding is acquired and kept. Conflating them made the first
     draft of this probe read 47% losses in the late game, three quarters of which were one arch-rival
     arriving and leaving. */
  const EPISODE = new Set(["nemesis","rome","saga","court","election","war","loan","vow"]);
  const CONTESTED = new Set(["bay","primacy","repName"]);
  const catOf = k => EPISODE.has(k) ? "episode" : CONTESTED.has(k) ? "contested" : "estate";
  const zero = () => { const o={}; for(const c of CATS) o[c] = { early:0, mid:0, late:0 }; return o; };
  const gains = zero(), losses = zero(), regained = zero();
  const weeks = { early:0, mid:0, late:0 };
  const lostFor = {}; for(const c of CATS) lostFor[c] = { early:[], mid:[], late:[] };
  const menLost = { early:0, mid:0, late:0 }, menGot = { early:0, mid:0, late:0 };
  const byKey = {};                       /* what actually moves, so the counter can be read */
  const sample = [];

  /* the estate: what the house HOLDS, men excluded. Presence only — a level is not a key. */
  const held = d => {
    const s = new Set();
    const on = (k,v) => { if(v) s.add(k); };
    on("doctore", d.doctore); on("medicus", d.medicus); on("armourer", d.armourer);
    on("doctrine", d.doctrine); on("blessing", d.blessing); on("vow", d.vow);
    on("nemesis", d.nemesis); on("collegium", d.collegium); on("war", d.war);
    on("heir", d.heir); on("wife", (d.domus||{}).wife); on("rome", d.rome);
    on("loan", d.loan); on("aedile", d.aedile); on("election", d.election);
    on("court", d.court); on("saga", d.saga); on("repName", d.repName);
    on("primacy", A.primusMine && A.primusMine(d)); on("bay", (d.bay||{}).holder);
    for(const k of Object.keys(d.buildings||{})) s.add("room:"+k);
    for(const k of Object.keys(d.works||{})) s.add("work:"+k);
    for(const k of Object.keys(d.household||{})) s.add("hh:"+k);
    for(const x of (A.patronsOf(d)||[])) s.add("patron:"+x.id);
    for(const k of Object.keys(d.feats||{})) s.add("feat:"+k);
    return s;
  };
  const menOf = d => new Set((d.gladiators||[]).filter(g=>g.status==="active").map(g=>g.id));

  for(let h=0; h<H; h++){
    const d = A.newGameState("Lt"+h, "clean", `${SEED}-${h}`, null);
    let prev = held(d), prevMen = menOf(d);
    const openLoss = new Map();           /* key -> week it went, still not back */
    for(let w=0; w<W; w++){
      if(d.over) break;
      R.lanista(d);
      if(d.over) break;
      const e = era(d.week); weeks[e]++;
      const now = held(d), men = menOf(d);

      for(const k of now) if(!prev.has(k)){
        const c = catOf(k);
        gains[c][e]++; byKey[k] = byKey[k] || {g:0,l:0,c}; byKey[k].g++;
        if(openLoss.has(k)){                       /* it came back */
          const o = openLoss.get(k); openLoss.delete(k);
          regained[c][o.era]++; lostFor[c][o.era].push({ back: d.week - o.w, room: d.week - o.w });
          if(sample.length < 600) sample.push({h, key:k, lost:o.w, back:d.week, era:o.era, c});
        }
      }
      for(const k of prev) if(!now.has(k)){
        const c = catOf(k);
        losses[c][e]++; byKey[k] = byKey[k] || {g:0,l:0,c}; byKey[k].l++;
        openLoss.set(k, { w:d.week, era:e, c });
      }
      for(const g of men) if(!prevMen.has(g)) menGot[e]++;
      for(const g of prevMen) if(!men.has(g)) menLost[e]++;
      prev = now; prevMen = men;
    }
    /* ---- CENSORING, WHICH WOULD HAVE FAKED THE HEADLINE ----
       "How much of what was lost came back" falls with the era for a reason that has nothing to do
       with the game: a thing lost in week 400 of a house that ends at 420 has twenty weeks to return,
       and one lost in week 40 has hundreds. The raw rate therefore MOVES WITH THE LENGTH OF THE RUN
       while the code producing it does not — the exact denominator fault the brief names. Every loss
       carries the weeks its house had left, so the report can restrict to losses that were given a
       fair chance and quote that instead. */
    for(const [,o] of openLoss) lostFor[o.c][o.era].push({ back:null, room: d.week - o.w });
  }
  return { gains, losses, weeks, regained, lostFor, menLost, menGot, byKey, sample, ERAS, CATS };
}, [H, W, SEED, EARLY, LATE]);

const ERAS = out.ERAS;
const per = (n, w) => w ? (n/w*1000).toFixed(1) : "-";
const pcs = (n, dn) => dn ? `${Math.round(n/dn*100)}%` : "-";
const medOf = a => { const v=(a||[]).filter(x=>x!=null).sort((x,y)=>x-y); return v.length ? v[Math.floor(v.length/2)] : "-"; };

console.log(`\n${H} houses x ${W}w · seed "${SEED}" · early <${EARLY}w · mid <${LATE}w · late >=${LATE}w`);
console.log(`estate holdings only — men are counted apart, since they are the one thing always lost\n`);
for(const c of out.CATS){
  console.log(`  ${c.toUpperCase()}`);
  console.log(`    era     weeks   gains   losses   losses/1k wks   losses as a share of changes`);
  for(const e of ERAS){
    const tot = out.gains[c][e] + out.losses[c][e];
    console.log(`    ${e.padEnd(6)} ${String(out.weeks[e]).padStart(6)}  ${String(out.gains[c][e]).padStart(6)}`
      + `  ${String(out.losses[c][e]).padStart(7)}   ${String(per(out.losses[c][e], out.weeks[e])).padStart(13)}`
      + `   ${pcs(out.losses[c][e], tot).padStart(6)}`);
  }
  console.log(`    reversible? — RAW, then restricted to losses whose house had >=${FAIR}w left to undo them`);
  for(const e of ERAS){
    const all = out.lostFor[c][e];
    if(!all.length){ console.log(`      ${e.padEnd(6)} nothing lost`); continue; }
    const backs = all.filter(x=>x.back != null);
    /* a loss is only evidence of irreversibility if its house lived long enough to have undone it */
    const fair = all.filter(x=>x.back != null || x.room >= FAIR);
    const fairBack = fair.filter(x=>x.back != null);
    console.log(`      ${e.padEnd(6)} raw ${String(backs.length).padStart(3)}/${String(all.length).padEnd(4)}`
      + ` (${pcs(backs.length, all.length).padStart(4)})   ·   fair ${String(fairBack.length).padStart(3)}/${String(fair.length).padEnd(4)}`
      + ` (${pcs(fairBack.length, fair.length).padStart(4)})   ·   median ${String(medOf(backs.map(x=>x.back))).padStart(3)}w away`
      + `   ·   ${fair.length - fairBack.length} never came back with time to`);
  }
  console.log("");
}
/* ---- THE MEN ROW IS ACTIVE-SET TRANSITIONS, NOT ARRIVALS AND EXITS ----
   A man carried off injured leaves the ACTIVE set and re-enters it when he heals, so both columns
   are inflated by every injury — about threefold against true exits — and a man who dies injured,
   or is still hurt when the era turns or the house ends, books a departure with no return. That is
   what made mid and late read net-negative here (-53 / -67 on this probe's own seed) while TRUE
   arrivals-minus-exits, measured off new ids against the game's own GONE statuses on the identical
   houses, is net POSITIVE in every era (+30 / +27). `yard.mjs` is the corrected instrument; this
   row is kept because the diff itself is honest — it just counts injuries as departures. */
console.log(`\n  MEN — ACTIVE-SET transitions (injury-inflated; see yard.mjs for true arrivals/exits)`);
for(const e of ERAS)
  console.log(`  ${e.padEnd(6)} ${String(out.menLost[e]).padStart(5)} left the yard · ${String(out.menGot[e]).padStart(5)} arrived`
    + ` · net ${out.menGot[e]-out.menLost[e] >= 0 ? "+" : ""}${out.menGot[e]-out.menLost[e]}`);

/* patron ids are per-house and collide across houses, so they are one row rather than 200 */
const roll = k => /^patron:/.test(k) ? "patron:*" : /^feat:/.test(k) ? "feat:*" : k;
const agg = {};
for(const [k,v] of Object.entries(out.byKey)){
  const r = roll(k); agg[r] = agg[r] || {g:0,l:0,c:v.c,n:0};
  agg[r].g += v.g; agg[r].l += v.l; agg[r].n++;
}
const moved = Object.entries(agg).filter(([,v])=>v.l > 0).sort((a,b)=>b[1].l-a[1].l);
console.log(`  WHAT ACTUALLY MOVES — every key ever lost, so the counter can be read rather than trusted`);
for(const [k,v] of moved.slice(0,20))
  console.log(`    ${k.padEnd(16)} ${v.c.padEnd(10)} lost ${String(v.l).padStart(4)} · gained ${String(v.g).padStart(4)}`);
const nev = Object.entries(agg).filter(([,v])=>v.l === 0);
console.log(`\n  NEVER LOST BY ANY HOUSE, IN ${H} HOUSES — this is #131 stated exactly:`);
for(const [k,v] of nev.sort((a,b)=>b[1].g-a[1].g).slice(0,18))
  console.log(`    ${k.padEnd(16)} ${v.c.padEnd(10)} gained ${String(v.g).padStart(4)}${v.n>1?` · ${v.n} distinct keys`:""}`);
if(nev.length > 18) console.log(`    … and ${nev.length-18} more`);
if(out.sample.length){
  console.log(`\n  a sample of losses that were undone, late era only:`);
  for(const s of out.sample.filter(x=>x.era==="late").slice(0,10))
    console.log(`    house ${String(s.h).padStart(2)} ${s.key.padEnd(20)} gone week ${String(s.lost).padStart(3)} → back week ${String(s.back).padStart(3)} (${s.back-s.lost}w)`);
}

await browser.close(); server.close();
