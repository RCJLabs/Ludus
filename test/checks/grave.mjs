/* SAYING NOTHING ABOUT A DEAD MAN IS AN ANSWER

   Audit item #224: "470 dead across 16 runs — and the funeral rites were performed 0 times against
   164 men standing unburied (12-house arm; THE ACT IS (rope), the neglect pressure is not).
   Recommend the graveside week auto-offer the rite with the man's record in the offer, and the
   chronicle's death lines draw on his career."

   THE PARENTHETICAL IS THE ITEM CONCEDING ITS OWN ARTIFACT — `holdMunera` is a player action and
   the reference player takes none, so "0 rites" measures the rope. What is not an artifact is what
   the game did to a house that never answered, and the source says it before any measuring:

       none   cost 0     unrest +4   regard -6     "Nothing"
       rite   cost 70+   unrest -7   regard +5
       games  cost 320+  unrest -19  regard +14

   Three answers, and the cheapest one COSTS YOU. `unhonoured` is a six-week window; the agenda nags
   inside it — "after this nobody can put it right" — and when the window closed, NOTHING FIRED. The
   row disappeared and the man stayed on the list for ever, unanswerable and unpaid for.

   MEASURED over 3,235 weeks (`probes/grave.mjs`): 288 men marked unburied and **276 of them, 96%,
   fell out of the window unanswered.** One house, one dead man, four futures, against a control of
   the same nine weeks with nobody dead:

       choosing the pit          unrest +4    regard -7
       NEVER ANSWERING           unrest -14   regard +1     <- cheaper than the control

   So the dominant option was not on the list, and the game punished a player for using the screen.

   AFTER, on one state with the window pushed past and no weeks played: the pit costs regard -7.6
   and unrest +4; the silence costs regard -8.6 and no unrest at all. Neither is cheaper than the
   other on both axes, which is the whole of what arm 3 asks. Getting there cost four wrong
   answers and one of them is worth naming: a version that put the whole weight on his kin and left
   the yard a token came out CHEAPER house-wide than the pit — the fault wearing the fix's clothes —
   and this file passed it, because arm 3 compared unrest the wrong way round.

   FIVE ARMS:
   1 · THE WINDOW CLOSING IS AN ANSWER. A man past it comes back `done`, not silently unanswerable.
   2 · AND IT COSTS. The men's regard falls — measured on one state with `riteLapse` called once and
       NO weeks played, because nine played weeks with a dead man in them measure the death, not the
       lapse, and the first cut of this arm did exactly that.
   3 · NEITHER ANSWER DOMINATES. Choosing the pit takes unrest and less regard; silence takes more
       regard and no unrest. If one is strictly cheaper on both, the choice is not a choice — and
       the first cut of this arm compared unrest the wrong way round and could not have fired.
   4 · IT SPEAKS, and the rite lines read his record — a man with thirty wins is not buried in the
       same sentence as a man with none, which is #224's second ask.
   5 · AND MEN ACTUALLY DIED, or every arm above passed on an empty list. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "grave";
export const describe = "saying nothing about a dead man is an answer";
export const slow = true;   /* plays houses until men die in them */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"GRAVE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","unhonoured","holdMunera","markUnburied","RITES","RITE_WINDOW","regardOf","activeG"]
      .filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const clone = x => JSON.parse(JSON.stringify(x));
    const shape = t => String(t||"").replace(/\d+/g,"#").replace(/\b[A-Z][a-z]{2,}\b/g,"N").replace(/\s+/g," ").trim();

    /* a living, solvent house — every rite is refused when `d.gold < cost`, including the free one */
    let base = null;
    for(const t of ["A","B","C","D","E","F","G","H"]){
      const b = A.newGameState("Grave", "clean", "GRAVE-K"+t, null);
      for(let w=0; w<60; w++){ if(b.over) break; try { R.lanista(b); } catch(e){ break; } }
      if(!b.over && b.gold > 600 && A.activeG(b).length >= 2){ base = b; break; }
    }
    if(!base) return { noBase:true };
    const victim = A.activeG(base)[1] || A.activeG(base)[0];

    const seed = clone(base);
    { const g = seed.gladiators.find(x=>x.id===victim.id); g.status = "dead"; A.markUnburied(seed, g); }
    const meanRegard = s => A.activeG(s).reduce((n,x)=>n+A.regardOf(x),0) / Math.max(1, A.activeG(s).length);
    const head = s => (s.log && s.log[0]) || null;

    /* 1 and 2 — let the window close */
    const q = clone(seed);
    const r0 = meanRegard(q), u0 = q.unrest, h0 = head(q);
    for(let w=0; w<A.RITE_WINDOW + 3; w++){ if(q.over) break; try { R.lanista(q); } catch(e){ break; } }
    const rec = (q.unburied||[]).find(x=>x.gid===victim.id);
    const answered = !!(rec && rec.done);
    const lapsedFlag = !!(rec && rec.lapsed);

    /* ---- WHAT THE LAPSE COSTS, ISOLATED — and the first cut of this arm was not ----
       It compared nine played weeks with a dead man against nine played weeks with nobody dead, and
       called the difference "the lapse". It is not: a death removes a man from the mean regard,
       changes which bouts are fought and who fights them, and swamps the thing being measured — the
       same arm read -21, +3.63 and +5.41 on three builds whose lapse cost -9, 0 and -3. NO WEEKS ARE
       PLAYED here. One state, the window pushed past, `riteLapse` called once, and the difference
       is the lapse and nothing else. */
    const lap = clone(seed);
    { const m = (lap.unburied||[]).find(x=>x.gid===victim.id); if(m) m.week = lap.week - A.RITE_WINDOW - 1; }
    const lr0 = meanRegard(lap), lu0 = lap.unrest;
    try { A.riteLapse(lap); } catch(e){}
    const dRegard = meanRegard(lap) - lr0;
    const dUnrest = lap.unrest - lu0;

    /* 3 — and the deliberate pit, for the domination test */
    const pit = clone(seed);
    const pr0 = meanRegard(pit), pu0 = pit.unrest;
    let pitHeld = false;
    try { pitHeld = A.holdMunera(pit, victim.id, "none"); } catch(e){}
    const pitRegard = meanRegard(pit) - pr0, pitUnrest = pit.unrest - pu0;

    /* 4 — it speaks, and the rite lines read his record */
    const spokeLapse = (() => {
      const s = clone(seed);
      const was = head(s);
      for(let w=0; w<A.RITE_WINDOW + 2; w++){ if(s.over) break; try { R.lanista(s); } catch(e){ break; } }
      /* any line written in the run mentioning him is enough — the lapse writes one by name */
      return (s.log||[]).some(e => e !== was && new RegExp(String(victim.name)).test(String(e.text||"")));
    })();
    const byRecord = {};
    for(const key of ["none","rite","games"]){
      const set = new Set();
      for(const wins of [0, 30]){
        for(let wk=1; wk<=30; wk++){
          const m = { gid:5000+wins, name:"Verus", pfame:80, wins, kin:[], week:1 };
          try { set.add(shape(A.RITES[key].line({ week:wk }, m)) + "|" + wins); } catch(e){}
        }
      }
      const zero = [...set].filter(x=>x.endsWith("|0")).map(x=>x.slice(0,-2)).sort();
      const many = [...set].filter(x=>x.endsWith("|30")).map(x=>x.slice(0,-3)).sort();
      byRecord[key] = { shapes: new Set([...zero, ...many]).size,
        differs: JSON.stringify(zero) !== JSON.stringify(many) };
    }

    /* 5 — men actually die and lapse over real play */
    let dead = 0, marked = 0, lapsed = 0, weeks = 0;
    const seenIds = new Set();
    for(let h=0; h<5; h++){
      const d = A.newGameState("Grave", "clean", "GRAVE-R"+h, null);
      for(let w=0; w<200; w++){
        if(d.over) break;
        try { R.lanista(d); } catch(e){ break; }
        weeks++;
        for(const m of (d.unburied||[])){
          if(!seenIds.has(m.gid)){ seenIds.add(m.gid); marked++; }
          if(m.lapsed && !m.counted){ m.counted = 1; lapsed++; }
        }
      }
      dead += d.gladiators.filter(g=>g.status==="dead").length + ((d.fallen||[]).length);
    }
    return { answered, lapsedFlag, dRegard:+dRegard.toFixed(2), dUnrest:+dUnrest.toFixed(2),
      pitHeld, pitRegard:+pitRegard.toFixed(2), pitUnrest:+pitUnrest.toFixed(2),
      spokeLapse, byRecord, dead, marked, lapsed, weeks };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(r.noBase) return { pass:false, why:`no living solvent fixture house — nothing was measured`, lines };

  lines.push(`the window closed on him: answered ${r.answered} (lapsed flag ${r.lapsedFlag}) · a line was written ${r.spokeLapse}`);
  lines.push(`  the lapse itself, no weeks played: regard ${r.dRegard} · unrest ${r.dUnrest}`);
  lines.push(`  choosing the pit: regard ${r.pitRegard} · unrest ${r.pitUnrest}`);
  lines.push(`  the rite lines by record: ${Object.entries(r.byRecord).map(([k,v])=>`${k} ${v.shapes} shapes${v.differs?"":" (SAME at 0 and 30 wins)"}`).join(" · ")}`);
  lines.push(`  over ${r.weeks} played weeks: ${r.marked} marked unburied, ${r.lapsed} lapsed`);

  /* 1 — the window closing is an answer */
  if(!r.answered)
    bad.push(`a man past the ${6}-week window comes back with no answer on him — he stays on the list for `
      + `ever, unanswerable and unpaid for, which is what made silence the dominant option`);
  /* 2 — and it costs */
  if(!(r.dRegard < 0))
    bad.push(`the window closing moved the men's regard by ${r.dRegard} — silence is free, and the cheapest `
      + `answer on the screen costs ${r.pitRegard}`);
  /* ---- 3 — NEITHER ANSWER DOMINATES, and the first cut of this arm could not fire ----
     Cheaper means LESS regard lost (a HIGHER delta, both are negative) and LESS unrest gained (a
     LOWER one). The first cut compared both with `>=`, so its unrest clause read "silence adds MORE
     unrest than the pit" — the opposite of the thing it was guarding — and it sat green through a
     build where silence cost 5.56 regard and no unrest against the pit's 6.52 and +4. It is written
     both ways round now, because either option dominating is the same fault. */
  if(!r.pitHeld)
    bad.push(`\`holdMunera\` refused the pit on the fixture house, so the arm that compares silence `
      + `against the cheapest answer on the screen measured nothing — every rite is refused when `
      + `\`d.gold < cost\`, the free one included`);
  else {
    const dom = (aR, aU, bR, bU) => aR >= bR && aU <= bU && (aR > bR || aU < bU);
    if(dom(r.dRegard, r.dUnrest, r.pitRegard, r.pitUnrest))
      bad.push(`silence costs less than choosing the pit on BOTH regard (${r.dRegard} against `
        + `${r.pitRegard}) and unrest (${r.dUnrest} against ${r.pitUnrest}) — the dominant option is `
        + `not on the list, which is #224`);
    else if(dom(r.pitRegard, r.pitUnrest, r.dRegard, r.dUnrest))
      bad.push(`choosing the pit costs less than silence on both axes — the window closing has to be an `
        + `answer with a price on it, not a free pass with a line of prose attached`);
  }
  /* 4 — it speaks, and the lines read his record */
  if(!r.spokeLapse)
    bad.push(`the window closed and the chronicle said nothing about him — a story that stops with no line `
      + `was never a story`);
  for(const [k,v] of Object.entries(r.byRecord)){
    if(v.shapes < 2) bad.push(`the "${k}" rite speaks ${v.shapes} shape(s)`);
    if(!v.differs) bad.push(`the "${k}" rite buries a man with 30 wins in the same words as a man with none — `
      + `"the chronicle's death lines draw on his career" is #224's second ask and \`markUnburied\` has been `
      + `storing his record all along`);
  }
  /* 5 — on men who actually died */
  if(r.marked < 5) bad.push(`only ${r.marked} men were marked unburied in ${r.weeks} weeks — too few to mean anything`);
  if(!r.lapsed) bad.push(`no man lapsed out of the window in ${r.weeks} weeks, so arms 1-3 measured a case `
    + `real play does not reach — measured at v3.167.0 it was 96% of them`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the window closing is an answer, it costs, and it says who he was`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
