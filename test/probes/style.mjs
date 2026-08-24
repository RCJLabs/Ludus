/* A MAN'S STYLE IS RE-SPECIFIED EVERY SINGLE BOUT. SHOULD IT BE?

   #199 says: let the man carry his own default — how he fights when you do not say — pre-filled on
   the arena panel and overridden when it matters. It is the only one of the ten that REMOVES
   interface. Before removing any, measure what the two choices are actually worth, because they are
   not the same kind of choice at all.

   `TACTIC` is four fixed trades. Aggressive deals 1.46x and takes 1.55x; defensive 0.52 and 0.58.
   There is no right or wrong answer in the table — it is a dial, and a standing setting for it can
   never be a mistake, only a preference.

   `PLANS` is a BET. `planEffect` returns `PLAN_READ.right` (pow 1.027) if any of the opponent's
   tells names that plan, and `PLAN_READ.wrong` (pow 0.970) otherwise. `none` alone is neutral. So a
   standing default plan is a standing wager, and a wager is only worth making at odds this probe
   has to establish first:

       right   +2.7% power        wrong   -3.0% power        none    nothing

   THE FALSIFIER, written before the run: if a fixed plan is right much less than half the time
   against the opponents a house actually meets, then a per-man DEFAULT PLAN is a standing loss and
   #199's plan half must not ship as one — whatever is done for the tactic. And if a plan is right
   most of the time, `none` is the trap and the pre-fill is free money.

   It also counts what the panel could pre-fill HONESTLY: how often a tell is already visible,
   because a plan chosen off a scouted tell is not a bet at all.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "STYLE";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
const READ = (src.match(/const PLAN_READ = \{([\s\S]*?)\n\};/)||["",""])[1].replace(/\s+/g," ").trim();
const RESET = (src.match(/const spendOrders = \(\) => \{([^\n]*)/)||["","(not parsed)"])[1];
console.log(`PLAN_READ: ${READ}`);
console.log(`what a bout spends: ${RESET.trim().slice(0,110)}\n`);
if(!READ) throw new Error("PLAN_READ parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  const T = { houses:0, weeks:0, opps:0, byPlan:{}, anyTell:0, tellsSeen:{}, watched:0,
              /* the best plan for THIS opponent, and whether it is the same one twice running */
              bestRuns:[], sameAsLast:0, hadLast:0, noRight:0 };
  for(const k of A.PLAN_KEYS) T.byPlan[k] = { right:0, seen:0 };
  for(const k of A.TELL_KEYS) T.tellsSeen[k] = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Style","clean",SEED+"-"+h, null); T.houses++;
    let last = null;
    for(let w=0; w<W && !d.over; w++){
      R.lanista(d); T.weeks++;
      /* every named opponent the bill put up this week — the men a plan would be chosen against */
      for(const o of ((d.games && d.games.offers) || [])){
        const opp = o.opp; if(!opp) continue;
        T.opps++;
        const live = A.TELL_KEYS.filter(k=>{ try { return A.TELLS[k].when(opp); } catch(e){ return false; } });
        for(const k of live) T.tellsSeen[k]++;
        if(live.length) T.anyTell++; else T.noRight++;
        if(o.watched) T.watched++;
        const rightPlans = new Set(live.map(k=>A.TELLS[k].plan));
        for(const k of A.PLAN_KEYS){
          if(k === "none") continue;
          T.byPlan[k].seen++;
          if(rightPlans.has(k)) T.byPlan[k].right++;
        }
        /* would a standing plan have been right twice running? */
        const best = [...rightPlans].sort()[0] || null;
        if(last != null){ T.hadLast++; if(best && best === last) T.sameAsLast++; }
        last = best;
      }
    }
  }
  return { T, rope: R.say() };
}, [H, W, SEED]);

await browser.close(); server.close();
const T = out.T, pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";
console.log(`=== ${T.houses} houses x ${W} weeks · ${T.weeks} house-weeks · ${T.opps} named opponents on the bill\n`);
console.log(`  how often each plan is the RIGHT one, against the men a house actually meets:`);
for(const [k,v] of Object.entries(T.byPlan)){
  if(k === "none") continue;
  const r = v.seen ? v.right/v.seen : 0;
  const ev = r*2.7 - (1-r)*3.0;
  console.log(`     ${k.padEnd(9)} right ${String(v.right).padStart(5)} of ${v.seen}  ${pc(v.right,v.seen).padStart(6)}`
    + `   ·  standing it every bout is worth ${ev>=0?"+":""}${ev.toFixed(2)}% power against \`none\`'s 0`);
}
console.log(`\n  opponents carrying ANY tell at all: ${T.anyTell} (${pc(T.anyTell,T.opps)}) · carrying none: ${T.noRight} (${pc(T.noRight,T.opps)})`);
console.log(`  which tells: ${Object.entries(T.tellsSeen).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${pc(v,T.opps)}`).join(" · ")}`);
console.log(`  offers already watched when the bill went up: ${T.watched} (${pc(T.watched,T.opps)})`);
console.log(`  the right plan is the same as last bout's: ${T.sameAsLast} of ${T.hadLast} (${pc(T.sameAsLast,T.hadLast)})`);
const best = Object.entries(T.byPlan).filter(([k])=>k!=="none")
  .map(([k,v])=>({ k, r: v.seen ? v.right/v.seen : 0 })).sort((a,b)=>b.r-a.r)[0];
const ev = best.r*2.7 - (1-best.r)*3.0;
console.log(`\n  >>> THE BEST STANDING PLAN IS \`${best.k}\` at ${(best.r*100).toFixed(1)}%, worth ${ev>=0?"+":""}${ev.toFixed(2)}% power a bout.`);
console.log(`      ${ev < 0
  ? `EVERY fixed plan is a standing LOSS against \`none\`. #199's plan half must not ship as a default —`
    + `\n      a per-man plan would quietly cost the player power on most of his bouts. The tactic is a dial`
    + `\n      with no wrong answer and can carry one; the plan is a bet and the honest pre-fill is the one`
    + `\n      the scouting already knows.`
  : `A fixed plan PAYS. \`none\` is the trap and #199's pre-fill is free money.`}`);
console.log(`\n  rope: ${out.rope}`);
