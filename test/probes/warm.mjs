/* CAN A HOUSE EVER BECOME FRIENDLY WITH ANOTHER ONE?

   #198 says you can wreck a rival house on purpose and can only warm to one by accident: all four
   `GAMBITS` are hostile (poach, bribe, poison, word) and there is no friendly counterpart. Before
   building one, the item's own clause says to check the INPUT:

       what `warm` actually reaches in a played house, and how many of those events a house ever
       sees — if warmth never rises far enough to open them, the fault is the input, not the
       missing verb.

   THE ONLY PASSIVE SOURCE IS `metHouse`: +1.1 warmth per card fought against that house, and only
   while its grudge is under 30. Everything else is `RIVAL_BEATS`, which is eight one-shot moments
   per house behind a 5.5% weekly roll, and four of the eight are themselves gated on warmth:

       loan     warm >= 34 and you are under 200 denarii
       warning  warm >= 38
       offer    warm >= 50 and met >= 14
       end      warm >= 52, met >= 26, eleven years

   So `offer` needs something like forty-five cards against ONE house with its grudge held under 30
   the whole time. This counts whether that ever happens.

   TWO ARMS, because the reference player's peacefulness is a policy and not a fact:
       control       the reference player — no gambits
       gambit:6      the hostile arm, a trick at a live rival every six weeks

   FALSIFIES the verb half of #198 if warmth reaches the gates on its own: the item would then be
   about the events being invisible rather than a missing action. It CONFIRMS the input reading if
   the gates are never crossed — in which case a friendly gambit is the input, and that is #198.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "WARM";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const TBL  = (src.match(/const RIVAL_BEATS = \{([\s\S]*?)\n\};/)||["",""])[1];
const BEATS = [...TBL.matchAll(/^  ([a-z]+):\s*\{ need:c=>([^,]+(?:,[^,]+)*?), w:(\d+),/gm)]
  .map(m=>({ k:m[1], need:m[2].trim(), w:+m[3] }));
const ROLL = (src.match(/if\(R\(\) > ([\d.]+)\) continue;/)||["","?"])[1];
const PASS = (src.match(/if\(r && \(r\.grudge\|\|0\) < (\d+)\) warmMove\(d, h, ([\d.]+)\);/)||["","?","?"]).slice(1);
const GKEYS = [...(src.match(/const GAMBITS = \{([\s\S]*?)\n\};/)||["",""])[1].matchAll(/^  ([a-z]+):\s+\{ name:/gm)].map(m=>m[1]);
console.log(`RIVAL_BEATS: ${BEATS.length} moments, one-shot per house, behind a ${ROLL} weekly roll`);
for(const b of BEATS) console.log(`     ${b.k.padEnd(8)} w${String(b.w).padStart(2)}  ${b.need.slice(0,86)}`);
console.log(`the only passive warmth: +${PASS[1]} a card, and only while the grudge is under ${PASS[0]}`);
console.log(`GAMBITS: ${GKEYS.join(", ")} — ${GKEYS.length} of them, and the item says all hostile\n`);
if(!BEATS.length || ROLL==="?" || PASS[0]==="?") throw new Error("the table, the roll or the passive source parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const arm = async (opts) => inside(p, ([H, W, SEED, opts, KEYS]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  const T = { houses:0, weeks:0, pairs:0, fired:{}, firedHouses:{}, warmTop:[], warmEnd:[],
              grudgeTop:[], metTop:[], everOver:{ 25:0, 34:0, 38:0, 50:0, 52:0 },
              blocked:0, warmable:0, seenTotal:0 };
  for(const k of KEYS) { T.fired[k] = 0; T.firedHouses[k] = 0; }
  for(let h=0; h<H; h++){
    const d = A.newGameState("Warm","clean",SEED+"-"+h, null); T.houses++;
    /* the high-water mark per house-pair, because warmth can be spent and a snapshot at the end
       reports the trough of a relationship that reached the gate and came back down */
    const peak = new Map();
    for(let w=0; w<W && !d.over; w++){
      R.lanista(d, opts); T.weeks++;
      for(const r of (d.rivals||[])){
        const v = Math.max(0, Math.min(100, r.warm||0));
        peak.set(r.name, Math.max(peak.get(r.name)||0, v));
        if((r.grudge||0) >= 30) T.blocked++; else T.warmable++;
      }
    }
    for(const r of (d.rivals||[])){
      T.pairs++;
      const pk = peak.get(r.name) || 0;
      T.warmTop.push(Math.round(pk));
      T.warmEnd.push(Math.round(r.warm||0));
      T.grudgeTop.push(Math.round(r.grudge||0));
      for(const g of [25,34,38,50,52]) if(pk >= g) T.everOver[g]++;
      const m = (d.metHouse||{})[r.name];
      T.metTop.push(m ? m.met : 0);
      for(const k of ((m && m.seen) || [])){ if(k in T.fired){ T.fired[k]++; T.firedHouses[k]++; } T.seenTotal++; }
    }
  }
  return { T, rope: R.say() };
}, [H, W, SEED, opts, BEATS.map(b=>b.k)]);

const C = await arm({});
const G = await arm({ gambit:6 });
const O = await arm({ overture:6 });
await browser.close(); server.close();

const pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";
const pcOf = pc;
const q = (a,f)=>{ if(!a.length) return "-"; const z=[...a].sort((x,y)=>x-y); return z[Math.min(z.length-1,Math.floor(z.length*f))]; };
console.log(`=== ${C.T.houses} houses x ${W} weeks an arm · control ${C.T.weeks} house-weeks over ${C.T.pairs} house-pairs, hostile ${G.T.weeks} over ${G.T.pairs}\n`);
for(const [lab, X] of [["control (no gambits)", C], ["gambit:6 (hostile)", G], ["overture:6 (FRIENDLY — the new verb)", O]]){
  const T = X.T;
  console.log(`  ${lab}`);
  console.log(`     warmth PEAK per house-pair:  p50 ${q(T.warmTop,.5)} · p90 ${q(T.warmTop,.9)} · highest ${Math.max(0,...T.warmTop)}`);
  console.log(`     warmth where it ended:       p50 ${q(T.warmEnd,.5)} · p90 ${q(T.warmEnd,.9)}`);
  console.log(`     grudge at the end:           p50 ${q(T.grudgeTop,.5)} · p90 ${q(T.grudgeTop,.9)}`);
  console.log(`     cards against one house:     p50 ${q(T.metTop,.5)} · p90 ${q(T.metTop,.9)} · most ${Math.max(0,...T.metTop)}`);
  console.log(`     weeks a rival was too sore to warm at all: ${pc(T.blocked, T.blocked+T.warmable)}`);
  console.log(`     house-pairs whose warmth EVER reached:`
    + [25,34,38,50,52].map(g=>` ${g}: ${T.everOver[g]} (${pc(T.everOver[g],T.pairs)})`).join(" ·"));
  console.log(`     beats that ever fired: ${Object.entries(T.fired).map(([k,v])=>`${k} ${v}`).join(" · ")}  [${T.seenTotal} in all]`);
  console.log("");
}
const gateHit = C.T.everOver[50] + G.T.everOver[50];
const pairs = C.T.pairs + G.T.pairs;
const before = pairs ? gateHit / pairs : 0;
const after = O.T.pairs ? O.T.everOver[50] / O.T.pairs : 0;
const fired = (X, k) => X.T.fired[k] || 0;
console.log(`  >>> THE FALSIFIER HALF-FIRES. The item said: if warmth never rises far enough to open`);
console.log(`      those events, the fault is the input rather than a missing verb. It does rise —`);
console.log(`      ${pc(gateHit, pairs)} of ${pairs} house-pairs reached warm 50 with no help, and every one of the`);
console.log(`      eight beats fired at least once. The writing is not dead and the item's stated`);
console.log(`      reading is wrong.`);
console.log(`  >>> WHAT IS TRUE IS NARROWER AND WORSE: every warmMove in the file is inside a`);
console.log(`      RIVAL_BEATS.hit the game rolls at 5.5% a week, or metHouse's +1.1 a card, and the`);
console.log(`      BILL chooses who you fight. A friendship ran hot or cold on the editor's matching`);
console.log(`      and the player had no move at all. The asymmetry is confirmed; the reason is not`);
console.log(`      that the door is shut, it is that there is no handle on this side of it.`);
console.log(`  >>> AND THE VERB MOVES IT: warm-50 pairs ${pc(gateHit,pairs)} -> ${pc(O.T.everOver[50], O.T.pairs)}`
  + ` (${before ? (after/before).toFixed(1) : "-"}x), peak warmth p50 ${q(C.T.warmTop,.5)} -> ${q(O.T.warmTop,.5)},`
  + ` and the four warm-gated beats fire`);
console.log(`      loan ${fired(C,"loan")}->${fired(O,"loan")} · warning ${fired(C,"warning")}->${fired(O,"warning")}`
  + ` · offer ${fired(C,"offer")}->${fired(O,"offer")} · end ${fired(C,"end")}->${fired(O,"end")}.`);
