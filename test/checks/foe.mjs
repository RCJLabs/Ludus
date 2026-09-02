/* THE MAN ACROSS THE SAND CARRIES WHAT HE HAS SURVIVED

   Audit item #216: "on the sand he is a bare class silhouette, whatever his fame. The
   bearing/ornament machinery built for our men in v3.146.0 (`boreOf`, fame rings, kill marks)
   NEVER APPLIES to him."

   THE SECOND HALF IS MOSTLY FALSE — and the exception is the best thing this item found. Seven of
   the eight sites that build an arena snapshot pass `bore: boreOf(...)` for side B as well as side
   A. THE EIGHTH PASSES NONE, and it is a singles path, so the man across the sand really did come
   through one of the game's main doors with no renown, no kills and no wear — a bare class
   silhouette whatever he was, which is #216 word for word. It was invisible to reading because the
   other singles path a few hundred lines up does pass it, so any grep that stopped at the first hit
   came back yes. Arm 2 below reads the object the fight modal actually renders from, on real
   bouts, which is why it found it and a reading of the source did not.

   Measured over 481 real opponents through all four doors (`probes/foe.mjs`), what came down the
   route on the seven sites that had one:

     his renown   77 distinct values, p50 22, max 106      the machinery applies
     his kills     5 distinct values, p50  1               the machinery applies
     his fatigue   ONE value — 0 on all 481                he always arrives fresh, which is right
     HIS SCARS     ONE value — 0 on 481 OF 481

   So the item is half wrong and half worse than it says. A man the pre-fight card describes as
   sixteen bouts deep walked onto the sand without a mark on him.

   AND THE HALF NOBODY HAD NOTICED. `simulateFight` opens the crowd on
   `(A.scars.length + B.scars.length) * 1.2` — a term that sums BOTH sides and whose second half
   has been structurally zero on every bout this game has ever played. Two scarred men make a
   better show; the game says so and has only ever counted one of them. Measured, his marks are now
   worth +2.56 to the opening crowd.

   FIVE ARMS:
   1 · HE IS MARKED, and by his own record — over real play his marks must take several distinct
       values and be non-zero on nearly all of them.
   2 · AND IT IS THE ARENA THAT GETS THEM. Not the helper in isolation: the `B` snapshot the fight
       modal renders from, off a real bout, must carry them. `boreOf`'s route existed for years and
       carried nothing, which is the whole reason this item was worth measuring.
   3 · OUR MEN ARE UNTOUCHED. `marksOf` must return one of your own men's scars exactly — never
       invent one. His scars are real history and each cost him a stat; inventing one would be a
       lie about a man you have watched bleed.
   4 · IT IS STABLE. The same man asked twice gives the same marks, and two men with the same
       record but different ids do not. A derived mark that re-rolls per render is a body that
       changes between one frame and the next.
   5 · AND HIS STATS ARE NOT DOCKED. `addScar` takes a point off a man for every mark; an
       opponent's stats were rolled to his tier already weathered, so deriving his marks must not
       move a single one of them. */
import { found, clearAll, installRope } from "../harness.mjs";

export const name = "foe";
export const describe = "the man across the sand carries what he has survived";
export const slow = true;   /* plays houses and drives real bouts through the real doors */

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"FOE-1" });
  await clearAll(p, 14);
  await installRope(p);

  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["marksOf","boreOf","genOpponent","newGameState","STATS","activeG"].filter(k=>A[k]==null);
    if(miss.length) return { miss };

    const foe = [], mine = [], snap = [];
    let bouts = 0, sawB = 0, noBore = 0;
    for(let h=0; h<4; h++){
      const d = A.newGameState("Foe", "clean", "FOE-C"+h, null);
      for(let w=0; w<12; w++){ if(d.over) break; try { R.lanista(d); } catch(e){ break; } }
      for(let i=0; i<120 && bouts < (h+1)*30; i++){
        if(d.over) break;
        let t; try { t = R.takeBout(d, {}); } catch(e){ t = null; }
        if(!t || t.ran === false){ try { R.lanista(d); } catch(e){ break; } continue; }
        bouts++;
        for(const x of [].concat((t.offer||{}).opp || [], (t.offer||{}).opps || []).filter(Boolean))
          foe.push(A.marksOf(x).length);
        for(const g of A.activeG(d)) if(g.lastFought === d.week)
          mine.push({ real:(g.scars||[]).length, got:A.marksOf(g).length });
        /* ---- ARM 2: THE SNAPSHOT THE ARENA ACTUALLY RENDERS ----
           `doFight` returns the very object the fight modal draws from. Reading it here is the
           difference between "the helper works" and "the picture gets it". */
        const B = t.res && t.res.B;
        if(B){ const list = [].concat(B);
          for(const b of list) if(b && b.scars){ sawB++; snap.push(b.scars.length); if(!b.bore) noBore++; } }
      }
    }

    /* ---- ARM 4: stable, and not the same man twice ---- */
    const o1 = A.genOpponent(2, 60, null); o1.id = 4242; o1.house = "Ovidius"; o1.wins = 9; o1.losses = 3;
    const o2 = JSON.parse(JSON.stringify(o1)); o2.id = 777;
    const twice = JSON.stringify(A.marksOf(o1)) === JSON.stringify(A.marksOf(o1));
    const differ = JSON.stringify(A.marksOf(o1)) !== JSON.stringify(A.marksOf(o2));

    /* ---- ARM 5: no stat is docked ---- */
    const before = A.STATS.map(k=>o1[k]);
    A.marksOf(o1); A.marksOf(o1);
    const after = A.STATS.map(k=>o1[k]);
    const docked = A.STATS.filter((k,i)=>before[i] !== after[i]);

    const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y);
      return { n:s.length, p50:s[Math.floor(s.length/2)], max:s[s.length-1],
        distinct:new Set(a).size, zero:+(a.filter(v=>!v).length/a.length*100).toFixed(1) }; };
    return { bouts, sawB, noBore, foe:q(foe), snap:q(snap), twice, differ, docked,
      mineWrong: mine.filter(x=>x.real !== x.got).length, mineN: mine.length,
      mineQ: q(mine.map(x=>x.real)) };
  });

  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  if(!r.foe) return { pass:false, why:`no opponent was met in any bout — nothing was measured`, lines };

  const say = (l, v) => `${l.padEnd(28)} p50 ${String(v.p50).padStart(2)} · max ${String(v.max).padStart(2)}`
    + ` · ${String(v.distinct).padStart(2)} distinct · ${String(v.zero).padStart(5)}% unmarked  (${v.n})`;
  lines.push(`${r.bouts} bouts driven through the real doors`);
  lines.push("  " + say("the man across the sand", r.foe));
  if(r.snap) lines.push("  " + say("as the arena is handed him", r.snap)
    + (r.noBore ? `  · ${r.noBore} with no bore at all` : ""));
  if(r.mineQ) lines.push("  " + say("your own men, for comparison", r.mineQ));

  /* 1 — he is marked, and by his record */
  if(r.foe.distinct < 3)
    bad.push(`the opponent's marks take ${r.foe.distinct} distinct value(s) over ${r.foe.n} men — `
      + `the drawing is handed one man however many bouts he has survived, which is #216`);
  if(r.foe.zero > 40)
    bad.push(`${r.foe.zero}% of opponents walk on unmarked — the pre-fight card describes a career `
      + `and the sand shows a clean body`);
  /* 2 — and the arena gets them */
  if(!r.sawB)
    bad.push(`no bout returned a B snapshot, so the arm that checks what the ARENA is handed `
      + `measured nothing — the helper could be perfect and the picture still blank`);
  else if(!r.snap || r.snap.distinct < 3 || r.snap.zero > 40)
    bad.push(`the snapshot the fight modal renders from carries ${r.snap ? r.snap.distinct : 0} distinct `
      + `mark-counts across ${r.sawB} bouts and ${r.snap ? r.snap.zero : 100}% of them are unmarked — the marks `
      + `are not reaching the drawing, which is exactly the shape of the fault #216 named: a route `
      + `that exists and carries nothing. This is the arm that found the second singles snapshot `
      + `passing no \`bore\` at all`);
  /* 2b — and the same snapshot must carry the bearing reading, which one door dropped entirely */
  if(r.noBore)
    bad.push(`${r.noBore} of ${r.sawB} arena snapshots carry no \`bore\` for the man across the sand — `
      + `he is drawn with no renown, no kills and no wear whatever he is, which is #216 verbatim`);
  /* 3 — our men are untouched */
  if(r.mineWrong)
    bad.push(`\`marksOf\` returned something other than his own scars for ${r.mineWrong} of ${r.mineN} `
      + `men of yours — their scars are real history and each one cost him a stat`);
  /* 4 — stable, and not one man twice */
  if(!r.twice) bad.push(`the same opponent asked twice gives different marks — a body that changes between frames`);
  if(!r.differ) bad.push(`two opponents with the same record and different ids draw identically — `
    + `the marks are a function of the record alone, so every 9–3 man in the game is the same man`);
  /* 5 — and no stat is docked */
  if(r.docked.length)
    bad.push(`asking for an opponent's marks moved his ${r.docked.join(", ")} — deriving a mark must not `
      + `dock a man whose stats were rolled to his tier already weathered`);

  if(errors.length) bad.push(`${errors.length} page errors`);
  if(!bad.length) lines.push(`he walks on carrying his record, and the arena is handed it`);
  return { pass: bad.length === 0, why: bad.slice(0,3).join("; ") || null, lines };
}
