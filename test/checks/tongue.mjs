/* THE COMMONEST SENTENCES IN THE GAME ARE MORE THAN ONE SENTENCE

   Audit item #223: "6,274 lines over 16 runs, 1,408 distinct — but the top of the table is
   boilerplate: the mercy line 616 times, festival announcements ~1,215 combined... The story
   organ's most common sentences are its least story-like. Recommend variant pools keyed to the man
   and the count — the third mercy in a month is a REPUTATION, and the line should know it."

   THE DIRECTION IS RIGHT AND THE RANKING IS NOT. Counted by SHAPE — names, numbers and places
   stripped, which is what a reader experiences — over 24,907 lines across 3,176 played weeks
   (`probes/tongue.mjs`), the mercy line was THIRD. The top of the table was:

      1,010  4.1%   <name> rises from the medicus' table, whole.
        967  3.9%   <name> was beaten at <venue>.
        517  2.1%   The man you let up is still alive somewhere...
        507  2.0%   <name> took victory at <venue> (+<n>d).

   The two commonest things in this game are a bout ending and a man coming off the medicus'
   table, and each had ONE sentence. The bout result — the record of the thing the whole game is
   about — knew nothing: not the crowd, not whether he was let up off the ground, not whether he
   walked off or was carried.

   AND THE GAME ALREADY OWNED THE PATTERN THE ITEM ASKED FOR. `AFTERS.triumph` picks from four
   variants. It was the only one of seven entries that did.

   MEASURED, same seeds, same scale:

                                        before      after
      distinct shapes                     923       1,115
      the 10 commonest, as a share       21.6%      13.6%
      the 50 commonest                   49.7%      40.7%
      the single commonest sentence       4.1%       1.8%

   The families are the same size — a bout still ends as often as it did. What changed is how many
   sentences they are spread across.

   FIVE ARMS:
   1 · THE BOUT RESULT IS A POOL. Real bouts driven to real results must produce several distinct
       shapes, or the most-written sentence in the game is one sentence again.
   2 · SO IS THE MEDICUS TABLE, and it is keyed to the count — a man on his fifth trip does not get
       his first trip's line.
   3 · THE MERCY LINE KNOWS THE COUNT, which is #223's own example. Three houses identical but for
       `rep.mercy` must not all say the same thing.
   4 · PROSE DOES NOT TOUCH THE SIMULATION. `pick` draws on the game's own seeded stream, so pooled
       lines built with it would make the WORDS a house writes change which men it loses. Measured:
       the first cut of this release moved `chair`'s butcher arm onto a tie with nothing about the
       surgeon changed. `sayOf` keys on the week and the man instead, and this arm proves the RNG
       state is untouched by twelve hundred calls to every pool.
   5 · NO SINGLE SENTENCE DOMINATES. The commonest shape over real play stays under a ceiling — the
       arm that would have failed before this release, at 4.1% against a bar of 3%.
   6 · AND ENOUGH WAS READ TO MEAN IT. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "tongue";
export const describe = "the commonest sentences in the game are more than one sentence";
export const slow = true;   /* plays houses and reads everything written */

const TOP_CEILING = 0.030;   /* measured 1.8% after, 4.1% before */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"TONGUE-1" });
  await clearAll(p, 12);
  await installRope(p);

  const r = await p.evaluate((CEIL)=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["newGameState","boutLine","tableLine","AFTERS"].filter(k=>A[k]==null);
    if(miss.length) return { miss };

    const shape = t => String(t||"").replace(/\d+/g,"#").replace(/\b[A-Z][a-z]{2,}\b/g,"N")
      .replace(/[""'']/g,"").replace(/\s+/g," ").trim().slice(0,120);

    /* ---- 1 and 2: the two pools, asked directly for what they can say ---- */
    /* HOUSES DIE — the first cut played one named seed and reported "the fixture house held no man"
       the moment the RNG stream shifted under it. Several are tried and the first LIVING one used. */
    let d0 = null, men = [];
    for(const t of ["A","B","C","D","E","F"]){
      const d = A.newGameState("Tongue", "clean", "TONGUE-P"+t, null);
      for(let w=0; w<40; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
      const alive = d.gladiators.filter(g=>g.status!=="dead");
      if(!d.over && alive.length){ d0 = d; men = alive; break; }
    }
    if(!d0) return { noMen:true };
    const offer = { opp:{ name:"Spiculus" }, festival:null };
    /* ---- HOW THESE POOLS VARY, which is not by rolling ----
       `sayOf` is keyed on the week and the man, so asking the same question about the same man in
       the same week gives the same sentence every time — deliberately: prose must not draw on the
       simulation's seeded stream, or the words a house writes change which men it loses. The first
       cut of this check called each pool 400 times with one `d` and one `g` and reported "5 distinct
       shapes", which is what determinism looks like when you test it for randomness. The variety
       lives ACROSS weeks and men, so that is what is swept. */
    const bout = new Set(), table = new Set();
    const states = [{ crowd:85, vA:70 }, { crowd:15, vA:12 }, { crowd:50, vA:50, spared:true },
                    { crowd:50, vA:50, bDies:true }, { crowd:50, vA:50, aDies:true }];
    for(let wk=1; wk<=40; wk++){
      const d = Object.assign({}, d0, { week: wk });
      for(const g of men.slice(0, 6)){
        for(const res of states) for(const win of [true,false]){
          if(res.aDies && win) continue;
          try { bout.add(shape(A.boutLine(d, g, offer, res, win, 120, "the pits"))); } catch(e){}
        }
        for(const n of [0,2,5]){
          const m = Object.assign({}, g, { scars: Array.from({length:n}, ()=>({ part:"flank" })) });
          for(const whole of [true,false]){ try { table.add(shape(A.tableLine(d, m, whole))); } catch(e){} }
        }
      }
    }
    /* and the bands must differ from each other, swept over the same weeks so a shared key
       cannot make two different pools look alike by landing on their common first entry */
    const band = {};
    for(const n of [0,5]){
      const set = new Set();
      for(let wk=1; wk<=40; wk++){
        const d = Object.assign({}, d0, { week: wk });
        for(const g of men.slice(0, 6)){
          const m = Object.assign({}, g, { scars: Array.from({length:n}, ()=>({ part:"flank" })) });
          for(const whole of [true,false]){ try { set.add(shape(A.tableLine(d, m, whole))); } catch(e){} }
        }
      }
      band[n] = [...set].sort();
    }
    const bandsDiffer = JSON.stringify(band[0]) !== JSON.stringify(band[5]);

    /* ---- 3: the mercy line reads the count ---- */
    const mercy = {};
    for(const rep of [0, 20, 40]){
      const s = new Set();
      for(let wk=1; wk<=60; wk++){
        const d = { rep:{ mercy:rep }, gladiators:[], week:wk };
        try { s.add(shape(A.AFTERS.spared.say(d, { spared:1 }))); } catch(e){}
      }
      mercy[rep] = [...s];
    }
    const mercyKeyed = JSON.stringify(mercy[0].slice().sort()) !== JSON.stringify(mercy[40].slice().sort());

    /* ---- ARM 4: PROSE DOES NOT TOUCH THE SIMULATION ----
       `pick` draws from the game's own seeded stream, so pooling the commonest lines with it would
       make every sentence written shift every roll after it — the WORDS a house writes would change
       which men it loses. That is not a determinism bug, but it is the wrong dependency, and it
       showed: the first cut of this release moved `chair`'s butcher arm onto a tie with nothing
       about the surgeon changed. `sayOf` is keyed on the week and the man instead. This proves it:
       the RNG's own state must be untouched by a thousand calls to every pool. */
    let rngHeld = null;
    if(A.rngPeek){
      const before = A.rngPeek();
      const dz = Object.assign({}, d0, { week: 7 });
      for(let i=0;i<400;i++){
        try { A.boutLine(dz, men[0], offer, { crowd:50, vA:50 }, i%2===0, 100, "the pits"); } catch(e){}
        try { A.tableLine(dz, men[0], i%2===0); } catch(e){}
        try { A.AFTERS.spared.say({ rep:{mercy:20}, week:7 }, { spared:1 }); } catch(e){}
      }
      rngHeld = A.rngPeek() === before;
    }

    /* ---- 5 and 6: what a real run actually reads ---- */
    const seen = new Map(); let total = 0, weeks = 0;
    for(let h=0; h<6; h++){
      const d = A.newGameState("Tongue", "clean", "TONGUE-R"+h, null);
      let lastTop = null;
      for(let w=0; w<200; w++){
        if(d.over) break;
        try { R.lanista(d); } catch(e){ break; }
        weeks++;
        const log = d.log||[];
        const i = lastTop == null ? -1 : log.indexOf(lastTop);
        const fresh = (lastTop == null || i < 0) ? log.slice() : log.slice(0, i);
        lastTop = log[0] || lastTop;
        for(const e of fresh){ total++; const k = shape(e.text); seen.set(k, (seen.get(k)||0)+1); }
      }
    }
    const rows = [...seen.entries()].sort((a,b)=>b[1]-a[1]);
    return { bout:[...bout].length, table:[...table].length, bandsDiffer, mercyKeyed, rngHeld,
      mercyN: Object.fromEntries(Object.entries(mercy).map(([k,v])=>[k, v.length])),
      total, weeks, distinct: rows.length,
      topShare: rows.length ? rows[0][1]/total : 1, topLine: rows.length ? rows[0][0].slice(0,72) : null,
      top10: rows.slice(0,10).reduce((n,x)=>n+x[1],0)/Math.max(1,total) };
  }, TOP_CEILING);

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(r.noMen) return { pass:false, why:`the fixture house held no man — nothing was measured`, lines };

  lines.push(`the bout result speaks ${r.bout} distinct shapes · the medicus table ${r.table}`
    + ` (bands ${r.bandsDiffer ? "differ" : "IDENTICAL"})`);
  lines.push(`the mercy line by reputation: ${Object.entries(r.mercyN).map(([k,v])=>`rep ${k} → ${v} shapes`).join(" · ")}`
    + ` · keyed: ${r.mercyKeyed}`);
  lines.push(`prose leaves the simulation's RNG ${r.rngHeld ? "untouched" : "SHIFTED"}`);
  lines.push(`${r.total} lines over ${r.weeks} weeks · ${r.distinct} shapes · commonest ${(r.topShare*100).toFixed(1)}%`
    + ` · top ten ${(r.top10*100).toFixed(1)}%`);
  if(r.topLine) lines.push(`  the commonest: "${r.topLine}"`);

  /* 1 — the bout result is a pool */
  if(r.bout < 6)
    bad.push(`the bout result speaks ${r.bout} distinct shape(s) — it is the most-written sentence in the `
      + `game at 6.8% of everything read, and one shape is what #223 was about`);
  /* 2 — so is the table, and it is keyed */
  if(r.table < 6)
    bad.push(`the medicus table speaks ${r.table} distinct shape(s) — 5.8% of the chronicle through one sentence`);
  if(!r.bandsDiffer)
    bad.push(`a man on his fifth trip to the medicus gets the same lines as a man on his first — the pool is `
      + `many sentences but not keyed to the count, which is half of what #223 asked for`);
  /* 3 — the mercy line, #223's own example */
  if(!r.mercyKeyed)
    bad.push(`the mercy line says the same thing at reputation 0 and 40 — "the third mercy in a month is a `
      + `reputation, and the line should know it" is the item's own sentence and this is where it lands`);
  /* 4 — prose does not touch the simulation */
  if(r.rngHeld === false)
    bad.push(`twelve hundred calls to the line pools advanced the simulation's own RNG — prose is drawing `
      + `on the seeded stream, so the WORDS a house writes change which men it loses. Use \`sayOf\`, `
      + `not \`pick\`, for anything a chronicle says`);
  if(r.rngHeld === null)
    bad.push(`the handle does not expose \`rngPeek\`, so the arm that proves prose never touches the `
      + `simulation measured nothing`);
  /* 5 — and nothing dominates */
  if(r.topShare > TOP_CEILING)
    bad.push(`one sentence is ${(r.topShare*100).toFixed(1)}% of everything a player reads ("${r.topLine}") — `
      + `the bar is ${(TOP_CEILING*100).toFixed(1)}% and it was 4.1% before v3.166.0`);
  /* 6 — on enough */
  if(r.total < 3000) bad.push(`only ${r.total} lines were read — too few to say what dominates`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`the two commonest events in the game have more than one sentence each`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
