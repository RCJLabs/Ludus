/* DEFIANCE AMBUSHES YOU. DOES IT, AND COULD YOU HAVE SEEN IT COMING?

   #201 says a refusal arrives after you have committed, and asks for it to be a standing readable
   risk on the arena panel. Before printing a number, three things have to be established:

     1. HOW THE REFUSAL ACTUALLY ARRIVES. `refuseWeek` runs in the weekly sweep and sets `g.refusing`
        as a pending event; `canFight` then excludes him. So the item's own framing — "after you have
        committed" — is testable and may simply be wrong, in which case the item is about WARNING and
        not about timing.
     2. WHETHER IT IS PREDICTABLE. The gate is `refuseCandidate` — the lowest-regard man who is either
        `regardOf <= 18`, grief-stricken, or (regard < 32 AND defiance > 62 AND morale < 32) — and then
        `0.05 + max(0, 24 - regardOf(g))*0.011 + (grief ? 0.11 : 0)`. Every term is state the player
        already holds. If the men who refuse were visibly at risk beforehand, a warning is worth
        printing; if refusals come out of a clear sky, printing one is a lie with a number on it.
     3. WHETHER IT IS COMMON ENOUGH TO MATTER at all.

   FALSIFIES the item if refusals are vanishingly rare, or if the man who refuses was not showing any
   of it the week before — either way the panel would be quoting noise.
*/
import fs from "node:fs";
import path from "node:path";
import { serve, open, found, clearAll, installRope, inside, ROOT } from "../harness.mjs";

const H = +(process.argv[2] || 10), W = +(process.argv[3] || 300);
const SEED = process.argv[4] || "REFUSE";

const src = fs.readFileSync(path.join(ROOT, "src/ludus.jsx"), "utf8");
/* scoped to refuseWeek — an unscoped `const odds =` matched `docLesson`'s and printed the
   DOCTORE's lesson odds as the refusal gate, which is a wrong formula printed with confidence */
const RW = (src.match(/function refuseWeek\(d\)\{([\s\S]*?)\n\}/)||["",""])[1];
const ODDS = (RW.match(/const odds = ([^;]+);/)||["","(not parsed)"])[1];
const GATE = (src.match(/function refuseCandidate\(d\)\{([\s\S]*?)\n\}/)||["",""])[1].replace(/\s+/g," ").trim();
console.log(`the weekly odds: ${ODDS.trim()}`);
console.log(`the candidate:   ${GATE.slice(0, 190)}\n`);
if(!ODDS || ODDS === "(not parsed)") throw new Error("the odds parsed EMPTY — fix the regex first");

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:SEED });
await clearAll(p);
await installRope(p);

const out = await inside(p, ([H, W, SEED]) => {
  const A = window.__LVDVS, R = window.__ROPE;
  R.reset();
  const T = { houses:0, weeks:0, men:0, mw:0, refusals:0, everRefused:0,
              /* the risk as the game itself computes it, evaluated on every active man every week */
              atRisk:0, riskTop:[], caught:0, blind:0, oddsAt:[],
              /* the ambush reading: was he the man you would have sent? */
              wasBest:0, wasFit:0, sat:[], byReason:{}, spread:0,
              /* ---- AND THE SAME MAN READ AT THE MOMENT HE SAT ----
                 The risk above is taken BEFORE the week, which is what a panel could show. The game
                 evaluates it INSIDE the sweep, after that week's deaths, wounds and regard have
                 landed. If the two disagree the gap is not an instrument fault, it is the finding:
                 the state that triggers a refusal is made in the same sweep that acts on it. */
              afterRisk:0, afterZero:0, wasRegard:[], nowRegard:[], newGrief:0 };
  /* ---- DO NOT REIMPLEMENT THE GATE ----
     The first cut copied `refuseCandidate`'s three terms into the probe and got a different answer
     from the game — men with regard 64 sat down while the copy scored them zero, because the copy
     had the grief window wrong. #150's rule is one formula, not two, and it applies to instruments
     as hard as it applies to panels. The game is asked who its candidate is and what his chance is;
     nothing here knows the gate. */
  const chanceOf = (d, g) => {
    if(!g) return 0;
    let rg = 50; try { rg = A.regardOf(g); } catch(e){}
    const grief = (()=>{ try { return A.griefStricken(d, g); } catch(e){ return false; } })();
    return 0.05 + Math.max(0, 24 - rg)*0.011 + (grief ? 0.11 : 0);
  };
  for(let h=0; h<H; h++){
    const d = A.newGameState("Sit","clean",SEED+"-"+h, null); T.houses++;
    const seen = new Set(), didRefuse = new Set();
    for(let w=0; w<W && !d.over; w++){
      /* BEFORE the week: who is visibly at risk, and who is the man a player would send */
      const act = A.activeG(d);
      const av = g => A.STATS.reduce((n,k)=>n+(g[k]||0),0)/6;
      const fit = act.filter(g=>!g.injury && (g.fatigue||0) < 55).sort((a,b)=>av(b)-av(a));
      const best = fit[0] || null;
      for(const g of act){
        if(!seen.has(g.id)){ seen.add(g.id); T.men++; }
        T.mw++;
      }
      /* the man the game itself would pick this week, and his chance — which is exactly what a
         panel would print, so the probe measures the panel rather than a theory of it */
      let cand = null; try { cand = A.refuseCandidate(d); } catch(e){}
      const candId = cand ? cand.id : null;
      const candOdds = cand ? chanceOf(d, cand) : 0;
      if(cand){ T.atRisk++; if(T.riskTop.length < 6000) T.riskTop.push(Math.round(candOdds*1000)/10); }
      /* ---- THE SET AND THE SCAN MUST COVER THE SAME POPULATION ----
         This was built from `act` — the ACTIVE men — and compared below against all of
         `d.gladiators`. A man who sits down and then dies keeps `g.refusing` on his record and
         leaves `activeG`, so he was absent from the set and present in the scan and was counted as
         a NEW refusal every week for the rest of the run: 272 of them out of 23 men, with a median
         regard of 99 because most of the rows were the same few corpses. It is `scene.mjs`'s
         denominator fault in another probe — a set built from a filtered population, compared
         against an unfiltered one. */
      const sitting0 = new Set((d.gladiators||[]).filter(g=>A.refusing(g)).map(g=>g.id));
      R.lanista(d); T.weeks++;
      /* AFTER: anyone newly sitting */
      for(const g of (d.gladiators||[])){
        if(!A.refusing(g) || sitting0.has(g.id) || g.status !== "active") continue;
        T.refusals++;
        if(!didRefuse.has(g.id)){ didRefuse.add(g.id); T.everRefused++; }
        const k = g.refusing && g.refusing.reason;
        if(k) T.byReason[k] = (T.byReason[k]||0)+1;
        const named = candId != null && g.id === candId;
        T.oddsAt.push(named ? Math.round(candOdds*1000)/10 : 0);
        if(named) T.caught++; else T.blind++;
        if(cand) T.afterRisk++; else T.afterZero++;
        if(!named){
          let rg = -1; try { rg = Math.round(A.regardOf(g)); } catch(e){}
          T.nowRegard.push(rg);
          let gr = false; try { gr = A.griefStricken(d, g); } catch(e){}
          if(gr) T.newGrief++;
        }
        if(best && g.id === best.id) T.wasBest++;
        if(fit.some(x=>x.id === g.id)) T.wasFit++;
      }
    }
    for(const g of (d.gladiators||[])) if(g.refusing) T.sat.push(g.refusing.weeks||0);
  }
  return { T, rope: R.say() };
}, [H, W, SEED]);
await browser.close(); server.close();

const T = out.T, pc = (n,dd) => dd ? (n/dd*100).toFixed(1)+"%" : "-";
const q = (a,f)=>{ if(!a.length) return "-"; const z=[...a].sort((x,y)=>x-y); return z[Math.min(z.length-1,Math.floor(z.length*f))]; };
console.log(`=== ${T.houses} houses x ${W} weeks · ${T.weeks} house-weeks · ${T.men} men · ${T.mw} active man-weeks\n`);
console.log(`  (3) IS IT COMMON ENOUGH TO MATTER?`);
console.log(`     refusals                       ${String(T.refusals).padStart(5)}   ${pc(T.refusals,T.weeks)} of weeks · ${pc(T.refusals,T.mw)} of man-weeks`);
console.log(`     men who ever sat down          ${String(T.everRefused).padStart(5)}   ${pc(T.everRefused,T.men)} of every man the house held`);
console.log(`     weeks a sitting man sat        median ${q(T.sat,.5)} · p90 ${q(T.sat,.9)}`);
console.log(`     which reason he gave: ${Object.entries(T.byReason).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ") || "none"}`);
console.log(`\n  (2) COULD YOU HAVE SEEN IT COMING?`);
console.log(`     weeks the game had a candidate ${String(T.atRisk).padStart(5)}   ${pc(T.atRisk,T.weeks)} of house-weeks`);
console.log(`     that risk, when it is there:   p50 ${q(T.riskTop,.5)}% · p90 ${q(T.riskTop,.9)}% · worst ${Math.max(0,...T.riskTop)}%`);
console.log(`     >>> refusals from a man ALREADY showing it   ${String(T.caught).padStart(4)}  ${pc(T.caught,T.refusals)}`);
console.log(`     >>> refusals out of a clear sky              ${String(T.blind).padStart(4)}  ${pc(T.blind,T.refusals)}`);
console.log(`     his odds the week he sat down: p50 ${q(T.oddsAt,.5)}% · p90 ${q(T.oddsAt,.9)}%`);
console.log(`     weeks the sweep had a candidate at all: ${T.afterRisk} of ${T.refusals} refusals`);
console.log(`     of the ${T.blind} the panel would NOT have named: regard ${q(T.nowRegard,.5)} when he sat`
  + ` · ${T.newGrief} were grieving by then (${pc(T.newGrief,T.blind)})`);
console.log(`\n  (1) WAS HE THE MAN YOU WERE GOING TO SEND?`);
console.log(`     the refuser was your best fit man   ${String(T.wasBest).padStart(4)}  ${pc(T.wasBest,T.refusals)}`);
console.log(`     the refuser was fit to fight at all ${String(T.wasFit).padStart(4)}  ${pc(T.wasFit,T.refusals)}`);
console.log(`\n  >>> ${T.refusals === 0 ? "NO REFUSALS AT ALL — the item is about a system that never fires."
  : T.blind === 0
    ? `EVERY ONE of ${T.refusals} refusals came from a man the game could already have named — ${pc(T.atRisk,T.mw)} of man-weeks carry a risk and it is never printed. #201 stands, and a warning would be exact rather than a guess.`
    : `${pc(T.caught,T.refusals)} of refusals came from a man already showing the risk. ${pc(T.blind,T.refusals)} did not.`}`);
console.log(`\n  rope: ${out.rope}`);
