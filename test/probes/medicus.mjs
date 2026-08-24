/* THE INFIRMARY ROW NOBODY HAS EVER PRESSED

   #203 says the medicus cannot be asked to lie: declare a hurt man fit, he takes the card, nobody
   outside knows, and the risk is `graveLasting`. Two of its clauses do not survive contact with the
   file, and reading them is the first job:

     "a fourth option on a row that has three"  —  `CARE` already has FOUR: rest, convalesce,
        surgeon, through.
     "he takes the card"                        —  `setCareOf(_, _, "through")` already sets
        `g.status = "active"`. A man worked through it can already be sent out.
     "nobody outside knows"                     —  nobody outside knows ANYTHING today. No opponent
        read, no editor, no reputation term reads `g.injury`. There is no concealment to buy because
        there is no disclosure to hide.

   So the item as filed is largely already built. What has never been measured is whether any of it
   is WORTH anything, because `setCareOf` is called from the man's page and nowhere else — no policy
   in this suite has ever pressed that row, and every figure this project has published about wounds
   was taken on the default. This runs the four arms against each other.

   FALSIFIES #203 if `through` already pays — a man who fights hurt and takes the extra bouts would
   make the "declare him fit" option a second name for a button that exists. And it establishes what
   the row is worth either way, which nothing in the project currently knows.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "MEDICUS";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const CARE = [...(src.match(/const CARE = \{([\s\S]*?)\n\};/)||["",""])[1].matchAll(/^  ([a-z]+):\s*\{ name:"([^"]+)"/gm)].map(m=>m[1]);
const MULT = (src.match(/const careMult = ([^;]+);/)||["","(not parsed)"])[1];
const THRU = (src.match(/if\(R\(\) < ([\d.]+) \* \(1 - medicusGuard\(d\)\)\)/)||["","?"])[1];
console.log(`CARE: ${CARE.join(" · ")} — ${CARE.length} options, not three`);
console.log(`graveLasting's careMult: ${MULT.trim()}`);
console.log(`a through week sets the wound badly at ${THRU} x (1 - medicusGuard)\n`);
if(!CARE.length) throw new Error("CARE parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const arm = async (care) => inside(p, ([H, W, SEED, care]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  const T = { houses:0, weeks:0, men:0, hurtMW:0, mw:0, everHurt:0,
              scars:0, lasting:0, dead:0, alive:0, bouts:0, careSet:0, refused:0,
              /* the whole point: weeks a man spent OFF the sand because of a wound */
              lostWeeks:0, endMen:0,
              /* ---- DELTAS, BECAUSE THE ARMS DO NOT LIVE THE SAME LENGTH ----
                 End-state scars per man is confounded: the convalesce arm's houses ran 1,177
                 house-weeks against the control's 1,392, so a per-man total compares two different
                 amounts of life. Scars and lasting hurts are counted as they are TAKEN, against the
                 hurt man-weeks that could have produced them. */
              scarGain:0, lastGain:0, vale:0, valeMax:0, healed:0, healWeeks:0 };
  for(let h=0; h<H; h++){
    const d = A.newGameState("Med","clean",SEED+"-"+h, null); T.houses++;
    const seen = new Set(), hurt = new Set();
    const scars0 = new Map(), last0 = new Map(), hurtAt = new Map();
    for(let w=0; w<W && !d.over; w++){
      for(const g of (d.gladiators||[])){
        if(!scars0.has(g.id)) scars0.set(g.id, (g.scars||[]).length);
        if(!last0.has(g.id)) last0.set(g.id, (g.lasting||[]).length);
        if(g.injury && !hurtAt.has(g.id)) hurtAt.set(g.id, w);
      }
      R.lanista(d, care ? { care } : {}); T.weeks++;
      T.valeMax = Math.max(T.valeMax, (d.buildings && d.buildings.valetudinarium) || 0);
      for(const g of (d.gladiators||[])){
        const s0 = scars0.get(g.id), l0 = last0.get(g.id);
        if(s0 != null && (g.scars||[]).length > s0){ T.scarGain += (g.scars||[]).length - s0; scars0.set(g.id, (g.scars||[]).length); }
        if(l0 != null && (g.lasting||[]).length > l0){ T.lastGain += (g.lasting||[]).length - l0; last0.set(g.id, (g.lasting||[]).length); }
        if(!g.injury && hurtAt.has(g.id)){ T.healed++; T.healWeeks += (w - hurtAt.get(g.id)); hurtAt.delete(g.id); }
      }
      for(const g of (d.gladiators||[])){
        if(!seen.has(g.id)){ seen.add(g.id); T.men++; }
        if(A.isGone(g)) continue;
        T.mw++;
        if(g.injury){ T.hurtMW++; if(!hurt.has(g.id)){ hurt.add(g.id); T.everHurt++; }
          if(care && g.injury.care === care) T.careSet++; }
        if(g.status === "injured") T.lostWeeks++;
      }
    }
    for(const g of (d.gladiators||[])){
      T.scars += (g.scars||[]).length;
      T.lasting += (g.lasting||[]).length;
      if(g.status === "dead") T.dead++;
      else if(g.status === "active") T.endMen++;
    }
  }
  /* `bump` writes the WEEK's return value, not the rope's stat bag, so `st.care` was undefined and
     every arm printed "care set 0" — including the ones plainly working. Counted here instead. */
  const st = R.stats();
  T.bouts = st.bouts || 0;
  return { T, rope: R.say() };
}, [H, W, SEED, care]);

const arms = [];
for(const c of [null, "rest", "convalesce", "surgeon", "through"]) arms.push([c || "control", await arm(c)]);
await browser.close(); server.close();

const pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";
const per = (n,dd) => dd ? (n/dd).toFixed(2) : "-";
console.log(`=== ${H} houses x ${W} weeks an arm\n`);
console.log(`  ${"".padEnd(12)} ${"h-weeks".padStart(8)} ${"bouts/wk".padStart(9)} ${"hurt mw".padStart(8)} ${"scars /kHmw".padStart(12)} ${"lasting /kHmw".padStart(14)} ${"heal wks".padStart(9)} ${"care set".padStart(9)} ${"vale".padStart(5)}`);
for(const [lab, X] of arms){
  const T = X.T, k = T.hurtMW ? 1000/T.hurtMW : 0;
  console.log(`  ${lab.padEnd(12)} ${String(T.weeks).padStart(8)} ${(T.weeks?T.bouts/T.weeks:0).toFixed(3).padStart(9)}`
    + ` ${pc(T.hurtMW,T.mw).padStart(8)} ${(T.scarGain*k).toFixed(1).padStart(12)} ${(T.lastGain*k).toFixed(2).padStart(14)}`
    + ` ${(T.healed?T.healWeeks/T.healed:0).toFixed(1).padStart(9)} ${String(T.careSet).padStart(9)} ${String(T.valeMax).padStart(5)}`);
}
console.log(`  (scars and lasting are counted AS TAKEN, per thousand hurt man-weeks, because the arms do not live the same length)`);
const g = k => arms.find(a=>a[0]===k)[1].T;
const ctl = g("control"), thr = g("through"), sur = g("surgeon"), con = g("convalesce");
console.log(`\n  >>> THE CONTROL SET CARE ${ctl.careSet} TIMES. ${ctl.careSet === 0
  ? "No policy in this suite has ever pressed that row, so every wound figure this project has published was taken on the default."
  : "The reference player does touch it."}`);
const boutsPer = T => T.weeks ? T.bouts / T.weeks : 0;
console.log(`  >>> bouts a week: control ${boutsPer(ctl).toFixed(3)} · through ${boutsPer(thr).toFixed(3)}`
  + ` · surgeon ${boutsPer(sur).toFixed(3)} · convalesce ${boutsPer(con).toFixed(3)}`);
console.log(`  >>> weeks lost to a wound: control ${pc(ctl.lostWeeks,ctl.mw)} · through ${pc(thr.lostWeeks,thr.mw)}`
  + ` · surgeon ${pc(sur.lostWeeks,sur.mw)} · convalesce ${pc(con.lostWeeks,con.mw)}`);
console.log(`  >>> ${boutsPer(thr) > boutsPer(ctl)
  ? `\`through\` BUYS BOUTS — ${((boutsPer(thr)/boutsPer(ctl)-1)*100).toFixed(1)}% more a week than the default, at ${per(thr.scars,thr.men)} scars a man against ${per(ctl.scars,ctl.men)}. #203's "declare him fit" is a second name for a button that already works.`
  : `\`through\` does NOT buy bouts (${boutsPer(thr).toFixed(3)} a week against the default's ${boutsPer(ctl).toFixed(3)}), so the option that already exists is not doing the thing #203 wants a new one for.`}`);
for(const [lab, X] of arms) console.log(`\n  ${lab}: ${X.rope}`);
