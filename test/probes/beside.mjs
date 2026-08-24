/* CAN A MAN EVER GO OUT BESIDE SOMEONE HE TRUSTS?

   #202 proposes a verb the game does not have: the player entering two of HIS OWN men as a pair.
   `doPairFight` exists, `addPair` puts pairs on the bill, and `AMBITIONS.beside` — *"To go out on
   the sand beside someone he trusts"* — is met in exactly one place in the file:

       gs.forEach(x=>{ if(x.ambition && x.ambition.kind==="beside" && tie && tie.kind==="brother")
                         ambitionMet(d, x); });

   So meeting it needs THREE coincidences the player has no hand in: a pair offer on this week's
   bill, the man with the ambition being one of the two sent, and the other one already being his
   brother. The bill decides the first, the stat sort decides the second, and nothing decides the
   third.

   WHAT THIS MEASURES, AND WHAT IT DELIBERATELY DOES NOT. The reference player's pair count is not
   a fact about the game: `takeBout` takes `pool[0]` and `makeGames` pushes every single before it
   calls `addPair`, so a single is first on essentially every card. Reporting "the reference player
   fought 0 pairs" as evidence for #202 would be reporting ARRAY ORDER. So this runs two arms:

       control   the reference player, untouched
       pairs     `pairs:true` — take the pair when the bill has one, and send the two men who are
                 already brothers. The policy a lanista trying to meet the ambition would run.

   FALSIFIES #202 if the `pairs` arm meets `beside` at a decent rate: the ambition would then be
   reachable by a player who simply watches the bill, and the item is about SIGNPOSTING rather than
   a missing verb. It also falsifies if pair offers are so common that the bill is already the
   entrance — in which case #202 is a convenience, not a verb.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "BESIDE";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const MET = (src.match(/gs\.forEach\(x=>\{ if\(x\.ambition[^\n]*\n?[^\n]*/) || ["(not parsed)"])[0];
const GATE = (src.match(/if\(d\.fame>=TIERS\[1\]\.fame && activeG\(d\)\.length>=2 && R\(\)<([\d.]+)\) addPair/) || ["","?"])[1];
console.log(`addPair's weekly roll: ${GATE} (and fame >= TIERS[1].fame, two men standing)`);
console.log(`the one place beside is met:\n     ${MET.trim().replace(/\s+/g," ").slice(0,150)}\n`);
if(GATE === "?") throw new Error("addPair's gate parsed EMPTY — fix the regex before trusting a number");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const arm = async (label, opts) => inside(p, ([H, W, SEED, opts]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();   /* both arms run on ONE page and the counters are the rope's, not this probe's */
  const T = { houses:0, weeks:0, men:0,
              billPair:0, billAny:0, fought:{}, pairBouts:0,
              given:0, voiced:0, met:0, despair:0, diedWith:0, aliveWith:0,
              broPairs:0, broMW:0, besideBro:0, besideMW:0, besideMen:0,
              /* the population a SIGNPOST would serve, sized on the bill as the player sees it */
              rightAnswer:0, blindHit:0, ambOnTable:0, fitTwo:0,
              /* WHERE it was met. `applyRefusal(method:"give")` calls `ambitionMet` for ANY kind
                 with no mechanical follow-through — a `beside` man can have the ambition granted
                 across a table without ever standing next to anyone. Counting `a.met` alone would
                 have credited the pair engine with those. Attributed by whether a pair bout was
                 fought on the week the flag turned over. */
              metPair:0, metElse:0 };
  for(let h=0; h<H; h++){
    const d = A.newGameState("Pair","clean",SEED+"-"+h, null); T.houses++;
    const seen = new Set(), gaveTo = new Set();
    for(let w=0; w<W && !d.over; w++){
      const pairsBefore = R.stats().tookPair || 0;
      const unmet = new Set((d.gladiators||[])
        .filter(g=>g.ambition && g.ambition.kind === "beside" && !g.ambition.met).map(g=>g.id));
      /* ---- THE BILL HAS TO BE READ BEFORE THE WEEK SPENDS IT ----
         `doPairFight` ends with `d.games.offers = d.games.offers.filter(o=>o.id!==offer.id)`, so a
         bill read AFTER the week is missing exactly the offer that was taken. The first run of this
         probe reported 247 pair weeks against 118 pairs fought and called that 47.8% — both numbers
         off the same undercount. Read it here, where the player is standing when he chooses. */
      const preOffers = (d.games && d.games.week === d.week && d.games.offers) || [];
      if(preOffers.length) T.billAny++;
      const hasPair = preOffers.some(o=>o.pair);
      if(hasPair) T.billPair++;
      /* what the CHOOSER would show him: fit men, the game's own predicate, best-stat first —
         which is the order the roster is sorted in and the closest thing to an uninformed pick */
      if(hasPair){
        const av = g => A.STATS.reduce((n,k)=>n+(g[k]||0),0)/6;
        const fitM = A.activeG(d).filter(g=>!g.injury && (g.fatigue||0) < 55).sort((x,z)=>av(z)-av(x));
        if(fitM.length >= 2){
          T.fitTwo++;
          const fid = new Set(fitM.map(g=>g.id));
          const bro = (d.ties||[]).filter(t=>t.kind==="brother" && fid.has(t.a) && fid.has(t.b));
          if(bro.length){
            T.rightAnswer++;
            const top = [fitM[0].id, fitM[1].id];
            if(bro.some(t=>top.includes(t.a) && top.includes(t.b))) T.blindHit++;
            const wanting = new Set(fitM.filter(g=>g.ambition && g.ambition.kind === "beside"
              && !g.ambition.met).map(g=>g.id));
            if(bro.some(t=>wanting.has(t.a) || wanting.has(t.b))) T.ambOnTable++;
          }
        }
      }
      R.lanista(d, opts); T.weeks++;
      const pairThisWeek = (R.stats().tookPair || 0) > pairsBefore;
      for(const g of (d.gladiators||[])){
        if(!unmet.has(g.id)) continue;
        const a = g.ambition;
        if(a && a.kind === "beside" && a.met){ if(pairThisWeek) T.metPair++; else T.metElse++; }
      }
      const ties = d.ties || [];
      const live = id => { const g = A.gById ? A.gById(d,id) : (d.gladiators||[]).find(x=>x.id===id);
        return g && g.status === "active"; };
      const bros = ties.filter(t=>t.kind==="brother" && live(t.a) && live(t.b));
      if(bros.length) T.broPairs++;
      T.broMW += bros.length;
      for(const g of (d.gladiators||[])){
        if(!seen.has(g.id)){ seen.add(g.id); T.men++; }
        const a = g.ambition;
        if(a && !gaveTo.has(g.id)){ gaveTo.add(g.id); T.given++; }
        if(!a || a.kind !== "beside") continue;
        if(g.status === "active" && !A.isGone(g)){
          T.besideMW++;
          if(!g.__bes){ g.__bes = 1; T.besideMen++; }
          /* and does he HAVE a brother standing? that is the third coincidence */
          if(bros.some(t=>t.a===g.id||t.b===g.id)) T.besideBro++;
        }
      }
    }
    /* the terminal sweep: a man's ambition is read where he stands at the end, alive or buried */
    for(const g of (d.gladiators||[])){
      const a = g.ambition; if(!a || a.kind !== "beside") continue;
      if(a.met) T.met++;
      else if(a.despair) T.despair++;
      if(a.voiced) T.voiced++;
      if(A.isGone(g)) { if(!a.met) T.diedWith++; } else if(!a.met) T.aliveWith++;
    }
  }
  /* what the rope actually fought, by engine — the counters live in takeBout since #202, and on
     the rope's INTERNAL bag, which is why they are read through stats() and not off the handle:
     `window.__ROPE` is the façade and `R.tookPair` on it is undefined forever. */
  const st = R.stats();
  T.pairBouts = st.tookPair || 0;
  T.fought = { single:st.tookSingle||0, pair:st.tookPair||0, melee:st.tookMelee||0, hunt:st.tookHunt||0 };
  return { T, rope: R.say() };
}, [H, W, SEED, opts]);

const C = await arm("control", {});
const P = await arm("pairs", { pairs:true });
await browser.close(); server.close();

const pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";
/* `den(C)` was handed the WRAPPER — {T, rope} — so every denominator was undefined and every
   percentage column in the first run printed "-". A table of dashes reads as "not measured". */
const row = (lab, c, pp, den) => console.log(`     ${lab.padEnd(40)} ${String(c).padStart(6)} ${(den?pc(c,den(C.T)):"").padStart(7)}   ${String(pp).padStart(6)} ${(den?pc(pp,den(P.T)):"").padStart(7)}`);

console.log(`=== ${C.T.houses} houses x ${W} weeks an arm · control ${C.T.weeks} house-weeks, pairs ${P.T.weeks}\n`);
console.log(`${"".padEnd(42)} ${"control".padStart(15)}   ${"pairs:true".padStart(15)}`);
console.log(`  the bill:`);
row("weeks with any arena offer", C.T.billAny, P.T.billAny, T=>T.weeks);
row("weeks the bill carried a PAIR", C.T.billPair, P.T.billPair, T=>T.weeks);
row("PAIR BOUTS ACTUALLY FOUGHT", C.T.pairBouts, P.T.pairBouts, T=>T.billPair);
console.log(`  the choice, on the weeks a pair was up:`);
row("...and two men were fit to take it", C.T.fitTwo, P.T.fitTwo, T=>T.billPair);
row("...and two of them were BROTHERS", C.T.rightAnswer, P.T.rightAnswer, T=>T.fitTwo);
row("   the top two by stat WERE that pair", C.T.blindHit, P.T.blindHit, T=>T.rightAnswer);
row("   and one of them wanted `beside`", C.T.ambOnTable, P.T.ambOnTable, T=>T.rightAnswer);
console.log(`  the men:`);
row("men the house held", C.T.men, P.T.men, null);
row("distinct men who carried `beside`", C.T.besideMen, P.T.besideMen, T=>T.men);
row("man-weeks carrying it", C.T.besideMW, P.T.besideMW, null);
row("   ...of those, with a brother standing", C.T.besideBro, P.T.besideBro, T=>T.besideMW);
row("weeks the house held any brother pair", C.T.broPairs, P.T.broPairs, T=>T.weeks);
console.log(`  and the ambition itself, read where each man ended:`);
row("MET", C.T.met, P.T.met, T=>T.besideMen);
row("   ...on the sand, in a pair", C.T.metPair, P.T.metPair, T=>T.besideMen);
row("   ...granted across a table (`give`)", C.T.metElse, P.T.metElse, T=>T.besideMen);
row("despaired", C.T.despair, P.T.despair, T=>T.besideMen);
row("died still carrying it", C.T.diedWith, P.T.diedWith, T=>T.besideMen);
row("standing at the end, still carrying it", C.T.aliveWith, P.T.aliveWith, T=>T.besideMen);
console.log(`\n  control rope: ${C.rope}`);
console.log(`  pairs   rope: ${P.rope}`);
console.log(`\n  >>> ${P.T.metPair === 0 && C.T.metPair === 0
  ? `NEITHER ARM MET IT ONCE. A policy written to meet this ambition — take the pair, send the brothers — met it ON THE SAND ${P.T.metPair} times in ${P.T.besideMen} men. #202 stands: the three coincidences do not coincide.`
  : `the pairs arm met it on the sand ${P.T.metPair} of ${P.T.besideMen} (${pc(P.T.metPair,P.T.besideMen)}) against the control's ${C.T.metPair}. ${P.T.metPair > P.T.besideMen*0.25 ? "#202 SHRINKS: a player who watches the bill can reach it, so the item is signposting." : "#202 stands: even the arm written for it reaches it rarely."}`}`);
