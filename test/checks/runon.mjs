/* THE WEEKS RUN ON WHEN NOTHING WANTS YOU, SAY WHY WHEN THEY DO NOT, AND NEVER PAST THE DEAD — #308

   Audit item 8: the fast-forward's absence was silent, and it was held off too easily. Measured
   before any of this, the audit's own reason was the wrong one — "a fit man who has not fought"
   fires only when games are on the card and held the run alone on 2.5% of weeks — and the real
   one was the dead: a man inside his six-week window held it alone on 93 weeks in 1,665, nearly
   as many as the 104 it was open, in runs of six every time a man died.

   #308 made the dead SOFT — they no longer hide the run — and made the run stop on the last week
   their rites can still be held. `weekWeight` was not touched, so `quiet` still holds that the dead
   weigh on the week; `weeksToSomething` was not touched, so `hurry` still holds the named days.
   What changed is one function, `runnable`, which the button's label and the run itself both read.

   FIVE ARMS. Arm 0 holds the game's soft set to this check's own list (see `MAY_BE_SOFT`); the
   other four are over real play:

     1  THE LOOSENING IS REAL. On weeks where the dead are the only thing weighing and their window
        has a week left, the run is open. If this reads zero, #308 changed nothing a player sees.
     2  NEVER PAST THE DEAD. On every week the run is open with a man still to be honoured, the run
        is driven on a CLONE and the man must still be honourable where it ends. This is the whole
        price of arm 1, and it is paid on every such week the walk meets, not on a sample.
     3  EVERYTHING ELSE STILL HIDES IT. On every week `why` holds a term that is not soft, the run
        is shut. Nothing but the dead was loosened, and this is the arm that says so.
     4  THE SENTENCE IS THE GATE. `runSays` names exactly the hard terms `weekWeight` summed, in the
        words `why` carries — not a parallel description of them, which would drift.

   A walk that meets none of the cases above passes all four on nothing, so each arm carries its own
   floor, and the counts are printed so a reader can see how much each one actually held.
*/
import { hasHandle, installRope } from "../harness.mjs";

/* WHAT MAY BE SOFT — this check's OWN list, not the game's. The first cut of arm 3 asked the game's
   `SOFT_LOAD` which terms were hard, and a sabotage that made near deadlines soft sailed through it:
   the check's idea of "hard" moved in lockstep with the thing it was holding. A check that reads the
   rule it guards to decide what to guard cannot catch the rule changing. So the loosening #308 made is
   written here, and the game must match it exactly — widening it is a change to this line, with a
   reason beside it, never a quiet edit to one `Set`. */
const MAY_BE_SOFT = ["dead"];

export const name = "runon";
export const describe = "the weeks run on when nothing wants you, say why when they cannot, and never past the dead";
export const slow = true;   /* plays houses and reads the week's shape every week */

export async function run({ p }){
  const lines = [], fails = [];
  if(!await hasHandle(p)) return { pass:false, why:"no test handle — build with `node build.js --test`", lines };
  await installRope(p);

  const out = await p.evaluate((MAY)=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const soft = new Set(MAY);
    const need = ["weekWeight","runnable","runSays","honourLeft","SOFT_LOAD","skipWeeks","unhonoured","RITE_WINDOW","newGameState"];
    const miss = need.filter(k=>A[k]==null); if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };
    if(!R || !R.lanista) return { why:"the rope is not installed" };
    const clone = x => JSON.parse(JSON.stringify(x));
    const gameSoft = [...(A.SOFT_LOAD || [])].sort();
    const o = { gameSoft, weeks:0, open:0, oldOpen:0, deadOnly:0, deadOnlyOpen:0, deadClosing:0, drove:0, pastWindow:[],
      hard:0, hardOpen:[], said:0, saidWrong:[] };
    for(let h=0; h<8; h++){
      const d = A.newGameState("Run","capua",`RUNON-${h}`);
      for(let w=0; w<320 && !d.over; w++){
        R.lanista(d); if(d.over) break;
        const W = A.weekWeight(d); if(W.kind === "held") continue;
        o.weeks++;
        const n = A.runnable(d);
        if(n >= 1) o.open++;
        const hard = W.why.filter(x => !soft.has(x.k));
        /* the rule before #308, for the before-and-after: open only on a quiet, unblocked week */
        if(W.kind === "quiet" && !(d.pendingEvent || d.doctoreOffer || d.romeOffer || d.reSignOffer)) o.oldOpen++;
        const dead = W.why.some(x => x.k === "dead");

        /* arm 1 */
        if(dead && !hard.length){
          o.deadOnly++;
          if(A.honourLeft(d) >= 1){ if(n >= 1) o.deadOnlyOpen++; }
          else o.deadClosing++;
        }
        /* arm 2 — drive it, on a clone, and look */
        if(n >= 1 && dead){
          o.drove++;
          const c = clone(d);
          const owed = A.unhonoured(c).filter(m=>!m.done).map(m=>m.id != null ? m.id : m.name);
          try { A.skipWeeks(c, n); } catch(e){ o.pastWindow.push(`skipWeeks threw at week ${d.week}`); continue; }
          for(const m of (c.unburied||[])){
            const id = m.id != null ? m.id : m.name;
            if(owed.includes(id) && !m.done && c.week - m.week > A.RITE_WINDOW && o.pastWindow.length < 4)
              o.pastWindow.push(`week ${d.week}: a run of ${n} ended at ${c.week}, ${c.week - m.week} weeks after a death the window gives ${A.RITE_WINDOW}`);
          }
        }
        /* arm 3 */
        if(hard.length){ o.hard++; if(n >= 1 && o.hardOpen.length < 4) o.hardOpen.push(`week ${d.week}: open for ${n} with ${hard.map(x=>x.k).join("+")} standing`); }
        /* arm 4 */
        const t = A.runSays(d);
        if(n < 1 && hard.length){
          o.said++;
          const missing = hard.filter(x => !String(t||"").includes(x.say));
          if(missing.length && o.saidWrong.length < 4) o.saidWrong.push(`week ${d.week}: "${String(t).slice(0,90)}" omits ${missing.map(x=>x.k).join(", ")}`);
          const extra = W.why.filter(x => soft.has(x.k) && String(t||"").includes(x.say));
          if(extra.length && o.saidWrong.length < 4) o.saidWrong.push(`week ${d.week}: names the soft ${extra.map(x=>x.k).join(", ")} as holding the run`);
        }
      }
    }
    return o;
  }, MAY_BE_SOFT);

  if(out.why) return { pass:false, why:out.why, lines };
  if(out.weeks < 400){
    fails.push(`only ${out.weeks} weeks read — the houses are dying before the walk can mean anything`);
    return { pass:false, why:fails[0], lines };
  }

  /* ---- ARM 0: WHAT THE GAME LOOSENED IS WHAT THIS CHECK SAYS IT MAY ---- */
  const want = MAY_BE_SOFT.slice().sort().join(",");
  if(out.gameSoft.join(",") !== want)
    fails.push(`the game treats [${out.gameSoft.join(", ")}] as soft where this check allows [${want}] — a term that `
      + `no longer hides the run is a player carried past it, and that is decided HERE, with a reason, or not at all`);

  lines.push(`${out.weeks} weeks read on 8 houses · the run open on ${out.open} (${(out.open/out.weeks*100).toFixed(1)}%)`
    + ` · under the rule before #308, ${out.oldOpen} (${(out.oldOpen/out.weeks*100).toFixed(1)}%)`);

  /* ---- ARM 1 ---- */
  if(out.deadOnly < 5) fails.push(`only ${out.deadOnly} weeks weighed by the dead alone — arm 1 has nothing to hold`);
  else if(out.deadOnlyOpen < out.deadOnly - out.deadClosing)
    fails.push(`${out.deadOnly - out.deadClosing - out.deadOnlyOpen} weeks weighed only by the dead, with a week of their window left, `
      + `still hid the run — the loosening #308 made is not reaching the button`);
  lines.push(`weeks held only by the dead: ${out.deadOnly} · the run open on ${out.deadOnlyOpen}`
    + ` · shut because their rites close that week: ${out.deadClosing}`);

  /* ---- ARM 2 ---- */
  if(out.drove < 5) fails.push(`only ${out.drove} runs driven past a death — arm 2 cannot vouch for the window on so few`);
  for(const x of out.pastWindow) fails.push(x);
  lines.push(`runs driven with the dead still owed: ${out.drove} · carried past a window: ${out.pastWindow.length}`);

  /* ---- ARM 3 ---- */
  if(out.hard < 50) fails.push(`only ${out.hard} weeks with a hard term — arm 3 proves little`);
  for(const x of out.hardOpen) fails.push(`the run was open over a term #308 did not loosen — ${x}`);
  lines.push(`weeks with a hard term standing: ${out.hard} · the run open over one anyway: ${out.hardOpen.length}`);

  /* ---- ARM 4 ---- */
  if(out.said < 50) fails.push(`only ${out.said} shut weeks explained — arm 4 proves little`);
  for(const x of out.saidWrong) fails.push(x);
  lines.push(`shut weeks whose sentence names exactly what shut them: ${out.said - out.saidWrong.length} of ${out.said}`);

  if(!fails.length) lines.push("the run opens when nothing wants you, says why when it cannot, and stops before the dead are past helping");
  return { pass: fails.length === 0, why: fails.slice(0, 3).join("; ") || null, lines };
}
