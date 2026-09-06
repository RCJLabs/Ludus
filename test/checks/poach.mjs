/* THE GRUDGE'S TWO TERMS — #246 phase 1.

   (`poach` was free in both directories; checked before writing.)

   #246 was filed on this sentence: *"a rival held grudge ≥ 35 on 107 weeks; `poachTarget` returned a
   man on 0 of 3,133"* — and the second half of it was never true. `poachTarget` was not on the test
   handle, `probes/pace.mjs` called `A.poachTarget(...)` inside a try/catch every week, the TypeError
   was swallowed, and the zero that came out became the item's headline and the stated reason its
   poach branch was called dead. Measured with the function exported (`probes/poach.mjs`, two seeded
   sets of 16 × 420): **a takeable man exists on 65.2% and 66.3% of weeks.** The gate's second term
   is wide open. `checks/probe.mjs` carries the general rule now, as FAULT SIX.

   What IS scarce is the grudge — 3.2% and 4.5% of weeks hold a rival at `GRUDGE_POACH`, both terms
   coincide on 2.5% and 3.2%, and a poach actually began 8 times and 3. The whole hostile surface —
   sabotage, the bribed editor, the thugs, the stolen steel, the whispers, a defection, a poach —
   landed 57 times in 3,937 weeks and 49 in 2,967: one act every 65 weeks or so.

   FOUR ARMS, seeded, 8 houses x 300 weeks, two policies.

   1 · THE SECOND TERM IS NOT A WALL. A man the other house could take, on a fifth of weeks at least.
       This is the arm the item needed and did not have.
   2 · NOR IS THE FIRST. A rival at `GRUDGE_POACH` on some weeks, and the two coinciding on some.
   3 · AND SOMETHING LANDS. The hostile surface fires at least once every two hundred weeks.
   4 · AND THE CONTROL HOLDS, which is what makes the other three mean anything: a house that never
       fights makes no grudge at all. Under `bout:false` the grudge gates must stay shut — measured
       0.0% at every one of the four thresholds, against a top grudge of 10 that never moves. */
import { found, clearAll, installRope } from "../harness.mjs";

const HOUSES = 8, WEEKS = 300;
const TAKEABLE_FLOOR = 0.20;   /* measured 0.65 and 0.66 */
const GRUDGE_FLOOR = 0.005;    /* measured 0.032 and 0.045 */
const BOTH_FLOOR = 0.003;      /* measured 0.025 and 0.032 */
const ACT_EVERY = 200;         /* measured one every 65-69 weeks */

export const name = "poach";
export const describe = "a rival can find a man worth taking, sometimes wants to, and a house that never fights is never hated";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"POACH-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(([H, W])=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","activeG","poachTarget","regardLoyal","isAuctor","GRUDGE_POACH",
                  "GRUDGE_SABOTAGE","GRUDGE_BRIBE","GRUDGE_THUGS"].filter(k=>A[k]==null);
    if(miss.length || !R || typeof R.lanista !== "function") return { why:`the handle is missing ${miss.join(", ") || "the rope"}` };
    const HOSTILE = ["poached","sabotage","thugs","bribedEditor","stolenSteel","courted","defected","whispers"];
    const arm = (opts) => {
      const t = { weeks:0, grudged:0, takeable:0, both:0, started:0, acts:0, top:0, kinds:{} };
      for(let h=0; h<H; h++){
        const d = A.newGameState("Pk"+h, "clean", `POACHCHK-${h}`);
        let had = false;
        for(let w=0; w<W; w++){
          if(d.over) break;
          t.weeks++;
          const riv = (d.rivals||[]).filter(x=>!x.retired);
          t.top = Math.max(t.top, riv.reduce((m,x)=>Math.max(m, x.grudge||0), 0));
          const grudged = riv.some(x=>x.grudge >= A.GRUDGE_POACH);
          let target = null; try { target = riv.length ? A.poachTarget(d, riv[0]) : null; } catch(e){}
          if(grudged) t.grudged++;
          if(target) t.takeable++;
          if(grudged && target) t.both++;
          if(d.poach && !had){ t.started++; had = true; }
          if(!d.poach) had = false;
          try { R.lanista(d, opts); } catch(e){ break; }
          const ev = d.pendingEvent && d.pendingEvent.id;
          if(ev && HOSTILE.includes(ev)){ t.acts++; t.kinds[ev] = (t.kinds[ev]||0)+1; }
        }
      }
      return t;
    };
    return { play: arm({}), calm: arm({ bout:false }) };
  }, [HOUSES, WEEKS]);

  if(r.why) return { pass:false, why:r.why, lines };
  const P = r.play, C = r.calm, pc = (v, n) => n ? `${(100*v/n).toFixed(1)}%` : "—";

  lines.push(`the reference player over ${P.weeks} weeks: a takeable man on ${pc(P.takeable, P.weeks)}, `
    + `a grudged rival on ${pc(P.grudged, P.weeks)}, both on ${pc(P.both, P.weeks)} · ${P.started} poaches began`);
  lines.push(`  hostile acts: ${P.acts} (` + (Object.entries(P.kinds).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${k} ${n}`).join(" · ") || "none")
    + `) — one every ${P.acts ? Math.round(P.weeks/P.acts) : "—"} weeks · top grudge ${Math.round(P.top)}`);
  lines.push(`  and a house that never fights, over ${C.weeks} weeks: grudged on ${pc(C.grudged, C.weeks)}, `
    + `takeable on ${pc(C.takeable, C.weeks)}, ${C.acts} hostile acts, top grudge ${Math.round(C.top)}`);

  /* 1 */
  if(P.takeable / P.weeks < TAKEABLE_FLOOR)
    bad.push(`a rival could find a man worth taking on only ${pc(P.takeable, P.weeks)} of weeks `
      + `[floor ${Math.round(TAKEABLE_FLOOR*100)}%, measured 65-66%] — #246 was filed on this term reading `
      + `ZERO, which was a swallowed TypeError and not the game. If it is really a wall now, that is a `
      + `regression in \`poachTarget\`'s three clauses: defiance 45, the contract, and regard 70`);
  /* 2 */
  if(P.grudged / P.weeks < GRUDGE_FLOOR)
    bad.push(`no rival reached GRUDGE_POACH on more than ${pc(P.grudged, P.weeks)} of weeks — the grudge is `
      + `the scarce term in this gate and a bay that never resents anything cannot act at all`);
  if(P.both / P.weeks < BOTH_FLOOR)
    bad.push(`the two terms coincided on only ${pc(P.both, P.weeks)} of weeks [floor ${(BOTH_FLOOR*100).toFixed(1)}%] — `
      + `a poach needs both at once and this is the number that decides whether it can ever happen`);
  /* 3 */
  if(!P.acts || P.weeks / P.acts > ACT_EVERY)
    bad.push(`the whole hostile surface — poach, sabotage, the bribed editor, the thugs, the stolen steel — `
      + `landed ${P.acts} times in ${P.weeks} weeks [floor one every ${ACT_EVERY}, measured one every 65]`);
  /* 4 */
  if(C.grudged > 0 || C.acts > 0)
    bad.push(`a house that never fought a bout was still resented on ${pc(C.grudged, C.weeks)} of weeks and `
      + `took ${C.acts} hostile acts — the grudge is supposed to come from the sand, and if it accrues to a `
      + `house that does nothing then the three arms above are measuring a clock, not a rivalry`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the man is there, the grudge is the scarce thing, and peace is quiet`);
  return { pass: bad.length === 0, why: bad.slice(0, 2).join("; ") || null, lines };
}
