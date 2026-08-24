/* HOW OFTEN DOES A MAN SPEAK TO YOU, AND HOW MANY ARE STANDING THERE NOT SPEAKING?

   #196 proposes a verb the game does not have: the player opening a conversation with one of his
   own men. Before building a door, measure the traffic through the one that exists.

   `askWeek` is the whole of it. A man is eligible when `regardOf(g) >= 45`, he has fought three
   bouts, and he is NOT already in `d.flags.asked` — and that last clause is one-way, so **a man
   asks you once in his life and never again**. Against that pool the week rolls 6%.

   So the question this answers is not "how often does the ask event fire" — it is how many
   man-weeks are spent by a man who is eligible, alive, thinking well enough of you to speak, and
   permanently past his one turn. That is the population a new verb would be for, and if it is small
   the proposal shrinks to a rounding error and should be said so.

   IT COUNTS THE POOL, NOT THE OUTCOME. The 6% roll and the weighted pick are the game's business;
   what a probe can establish is the size of the room. Every figure here is man-weeks off the game's
   own predicate, evaluated with `regardOf` from the handle rather than a copy of the threshold.

   FALSIFIES the proposal if men who could speak and have not are rare — if the pool is small
   because regard rarely reaches 45, then #196 is about REGARD and not about a missing verb.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420);
const SEED = process.argv[4] || "WORD";
const ARM  = process.argv[5] || "";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
/* scoped to askWeek — an unscoped `const men = activeG(d).filter(` matched a different function
   entirely and printed `canFight(g)` as this gate, which is a wrong denominator printed with
   confidence. */
const ASKW = (src.match(/function askWeek\(d\)\{([\s\S]*?)\n\}/) || ["",""])[1];
const GATE = (ASKW.match(/const men = activeG\(d\)\.filter\(g=>([^;]*)\);/) || ["","(not parsed)"])[1];
const ROLL = (ASKW.match(/if\(R\(\) > ([\d.]+)\) return;/) || ["","?"])[1];
const KEYS = [...(src.match(/const ASKS = \{([\s\S]*?)\n\};/)||["",""])[1].matchAll(/^  ([a-z]+):\s*\{/gm)].map(m=>m[1]);
console.log(`askWeek's gate: ${GATE.trim()}`);
console.log(`the weekly roll: ${ROLL} · ASKS has ${KEYS.length} entries [${KEYS.join(" ")}]\n`);
if(!GATE || !KEYS.length) throw new Error("the gate or the table parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED, ARM, KEYS]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  const opts = ARM ? JSON.parse(ARM) : {};
  const T = { houses:0, weeks:0, men:0, asked:0, askWeeks:0, byKind:{},
              /* man-weeks, off the game's own three terms */
              mw:0, regard45:0, bouts3:0, eligible:0, spent:0, fresh:0,
              everEligible:0, everAsked:0, regardTop:[], spentRuns:[] };
  for(const k of KEYS) T.byKind[k] = 0;

  for(let h=0; h<H; h++){
    const d = A.newGameState("Word","clean",SEED+"-"+h, null); T.houses++;
    const seen = new Set();
    for(let w=0; w<W && !d.over; w++){
      /* catch the event on the week it is raised, before the rope answers it */
      if(d.pendingEvent && d.pendingEvent.id === "ask"){
        T.askWeeks++;
        const k = d.pendingEvent.data && d.pendingEvent.data.k;
        if(k in T.byKind) T.byKind[k]++;
      }
      R.lanista(d, opts); T.weeks++;
      const askedSet = new Set(d.flags.asked || []);
      for(const g of (d.gladiators||[])){
        if(!seen.has(g.id)){ seen.add(g.id); T.men++; }
        if(g.status !== "active" || A.isGone(g)) continue;
        T.mw++;
        let rg = 0; try { rg = A.regardOf(g); } catch(e){}
        const r45 = rg >= 45, b3 = ((g.wins||0)+(g.losses||0)) >= 3, done = askedSet.has(g.id);
        if(r45) T.regard45++;
        if(b3) T.bouts3++;
        if(r45 && b3){
          T.eligible++;
          if(!g.__el){ g.__el = 1; T.everEligible++; }
          /* the population #196 is for: he could speak, and his one turn is behind him */
          if(done){ T.spent++; g.__spentRun = (g.__spentRun||0)+1; }
          else T.fresh++;
        }
        if(done && !g.__ask){ g.__ask = 1; T.everAsked++; }
        if(T.regardTop.length < 4000) T.regardTop.push(Math.round(rg));
      }
    }
    T.asked += (d.flags.asked || []).length;
    for(const g of (d.gladiators||[])) if(g.__spentRun) T.spentRuns.push(g.__spentRun);
  }
  return { T, rope:R.say() };
}, [H, W, SEED, ARM, KEYS]);

await browser.close(); server.close();
const T = out.T, pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";
const q = (a,f)=>{ if(!a.length) return "-"; const z=[...a].sort((x,y)=>x-y); return z[Math.min(z.length-1,Math.floor(z.length*f))]; };
console.log(`=== ${T.houses} houses x ${W} weeks · ${T.weeks} house-weeks · ${T.men} men · ${T.mw} active man-weeks`);
console.log(`\n  the door that exists:`);
console.log(`     men who ever asked you anything   ${String(T.everAsked).padStart(5)}  ${pc(T.everAsked,T.men)} of every man the house held`);
console.log(`     weeks a man was at your table     ${String(T.askWeeks).padStart(5)}  ${pc(T.askWeeks,T.weeks)} of weeks`);
console.log(`     which of the ${KEYS.length} he asked for: ${Object.entries(T.byKind).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}`);
console.log(`\n  the three terms of askWeek's gate, over active man-weeks:`);
console.log(`     regard >= 45                      ${String(T.regard45).padStart(6)}  ${pc(T.regard45,T.mw)}`);
console.log(`     three bouts fought                ${String(T.bouts3).padStart(6)}  ${pc(T.bouts3,T.mw)}`);
console.log(`     both, so he is in the pool        ${String(T.eligible).padStart(6)}  ${pc(T.eligible,T.mw)}   (${T.everEligible} distinct men, ${pc(T.everEligible,T.men)})`);
console.log(`     regard across every man-week: p10 ${q(T.regardTop,.1)} · median ${q(T.regardTop,.5)} · p90 ${q(T.regardTop,.9)}`);
console.log(`\n  >>> AND THE POPULATION #196 IS FOR — eligible, alive, and past his one turn:`);
console.log(`     man-weeks with his turn still to come  ${String(T.fresh).padStart(6)}  ${pc(T.fresh,T.eligible)} of eligible man-weeks`);
console.log(`     man-weeks SPENT — he has asked, and can never ask again  ${String(T.spent).padStart(6)}  ${pc(T.spent,T.eligible)}`);
if(T.spentRuns.length) console.log(`     and a spent man stays spent: median ${q(T.spentRuns,.5)} weeks, p90 ${q(T.spentRuns,.9)}, longest ${Math.max(...T.spentRuns)}`);
console.log(`\n     #196 FALSIFIES if this pool is small. ${T.eligible < T.mw*0.02
  ? "It IS small — under 2% of man-weeks clear the gate at all, so the item is about REGARD, not a missing verb."
  : `It is not: ${pc(T.eligible,T.mw)} of active man-weeks clear the gate, and ${pc(T.spent,T.eligible)} of those belong to a man who has already had his one turn.`}`);
console.log(`\n  rope: ${out.rope}`);
