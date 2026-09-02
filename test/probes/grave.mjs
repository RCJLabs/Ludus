/* #224 — WHAT HAPPENS TO A DEAD MAN, AND WHAT HAPPENS IF YOU SAY NOTHING

   The item: "470 dead across 16 runs — a death every 8.4 weeks somewhere — and the funeral rites
   were performed 0 times against 164 men standing unburied (12-house arm; THE ACT IS (rope), the
   neglect pressure is not)."

   THE PARENTHETICAL IS THE ITEM CONCEDING ITS OWN ARTIFACT. `holdMunera` is a player action and
   the reference player never takes one, so "0 rites" measures the rope, not the game — the shape
   #208 died of. What is NOT an artifact is the other half: what the game does to a house that
   never answers.

   AND THERE IS A LOOK AT THE SOURCE THAT SAYS THE ANSWER BEFORE ANY MEASURING:

       none:  cost 0, unrest +4, regard -6      "He goes into the ground and the week goes on."
       rite:  cost 70+, unrest -7, regard +5
       games: cost 320+, unrest -19, regard +14

   Three choices, and CHOOSING THE CHEAPEST ONE COSTS YOU. `unhonoured` is a six-week window and
   nothing at all fires when a man falls out of it: the agenda nags for six weeks, says "after this
   nobody can put it right", and then the row disappears. So saying "Nothing" costs unrest and
   regard, and saying nothing at all costs neither. This measures whether that is really true.

     node test/probes/grave.mjs 16 300 */
import { serve, open, found, clearAll, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 16), W = +(process.argv[3] || 300);
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p, { seed:"GRAVE" }); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H,W])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","unhonoured","holdMunera","RITES","RITE_WINDOW"].filter(k=>A[k]==null);
  if(miss.length) return { miss };

  const shape = t => String(t||"").replace(/\d+/g,"#").replace(/\b[A-Z][a-z]{2,}\b/g,"N")
    .replace(/\s+/g," ").trim().slice(0,110);

  let weeks = 0, dead = 0, marked = 0, lapsed = 0, honoured = 0;
  const deathLines = new Map();
  const seenIds = new Set(), honKeys = new Set();

  for(let h=0; h<H; h++){
    const d = A.newGameState("Grave", "clean", "GRAVE-"+h, null);
    let lastTop = null, lastDead = 0;
    const tracked = new Map();          /* gid -> the week he was marked */
    for(let w=0; w<W; w++){
      if(d.over) break;
      try { R.lanista(d); } catch(e){ break; }
      weeks++;
      const nowDead = d.gladiators.filter(g=>g.status==="dead").length + (d.fallen||[]).length;
      if(nowDead > lastDead){ dead += nowDead - lastDead; lastDead = nowDead; }
      for(const m of (d.unburied||[])){
        if(!seenIds.has(m.gid)){ seenIds.add(m.gid); marked++; tracked.set(m.gid, m.week); }
        /* DISTINCT men, not man-weeks: the first cut added one for every listed man every week and
           reported 13,910 rites in a run with none. */
        if(m.done && !m.lapsed && !honKeys.has(m.gid)){ honKeys.add(m.gid); honoured++; }
      }
      /* a man falls OUT of the window unhonoured — the case the agenda warned about */
      for(const [gid, wk] of tracked){
        const m = (d.unburied||[]).find(x=>x.gid===gid);
        if(!m || m.done){ tracked.delete(gid); continue; }
        if(d.week - wk > A.RITE_WINDOW){ lapsed++; tracked.delete(gid); }
      }
      /* what the chronicle said this week about anyone dying */
      const log = d.log||[];
      const i = lastTop == null ? -1 : log.indexOf(lastTop);
      const fresh = (lastTop == null || i < 0) ? log.slice() : log.slice(0, i);
      lastTop = log[0] || lastTop;
      for(const e of fresh){
        if(/died|dead|killed|buried|bench|grave|body|corpse/i.test(e.text||"")){
          const s = shape(e.text); deathLines.set(s, (deathLines.get(s)||0) + 1);
        }
      }
    }
  }

  /* ---- WHAT LAPSING ACTUALLY COSTS, measured against the three answers ----
     One state, four futures: hold each rite, or let the window close in silence. */
  /* A LIVING, SOLVENT HOUSE — the first cut took whatever seed came first and got one at -346
     denarii with nobody left, so all four futures read identically and "still inside the window"
     came back true nine weeks later because `lanista` was not advancing anything at all. Every
     rite is refused when `d.gold < cost`, and that includes the one that costs nothing. */
  let base = null;
  for(const t of ["A","B","C","D","E","F","G","H"]){
    const b = A.newGameState("Grave", "clean", "GRAVE-X"+t, null);
    for(let w=0; w<60; w++){ if(b.over) break; try { R.lanista(b); } catch(e){ break; } }
    if(!b.over && b.gold > 600 && A.activeG(b).length >= 2){ base = b; break; }
  }
  if(!base) return { noBase:true, weeks, dead, marked, lapsed, honoured, deathShapes:0, deathLines:[], deathTotal:0 };
  const clone = x => JSON.parse(JSON.stringify(x));
  const victim = A.activeG(base)[1] || A.activeG(base)[0];
  let arms = null;
  if(victim){
    const seed = clone(base);
    const g = seed.gladiators.find(x=>x.id===victim.id);
    g.status = "dead";
    A.markUnburied(seed, g);
    const read = s => ({ unrest: Math.round(s.unrest), gold: Math.round(s.gold),
      fame: Math.round(s.fame),
      regard: Math.round(A.activeG(s).reduce((n,x)=>n+A.regardOf(x),0) / Math.max(1, A.activeG(s).length)) });
    const before = read(seed);
    arms = { before };
    for(const key of ["none","rite","games"]){
      const s = clone(seed);
      try { A.holdMunera(s, victim.id, key); } catch(e){}
      arms[key] = read(s);
    }
    /* and the fourth: say nothing and let the window pass */
    const q = clone(seed);
    const w0 = q.week;
    for(let w=0; w<A.RITE_WINDOW + 3; w++){ if(q.over) break; try { R.lanista(q); } catch(e){ break; } }
    arms.silence = read(q);
    arms.weeksRan = q.week - w0;   /* a silence arm that never advanced measured nothing */
    /* ---- THE CONTROL, without which "silence costs 19 unrest" is nine weeks of ordinary drift ----
       The same house, the same nine weeks, and nobody dead. What the lapse costs is the DIFFERENCE. */
    const ctl = clone(base);
    for(let w=0; w<A.RITE_WINDOW + 3; w++){ if(ctl.over) break; try { R.lanista(ctl); } catch(e){ break; } }
    arms.control = read(ctl);
    arms.stillListed = (q.unburied||[]).some(x=>x.gid===victim.id && !x.done);
    arms.inWindow = A.unhonoured(q).some(x=>x.gid===victim.id);
  }

  const rows = [...deathLines.entries()].sort((a,b)=>b[1]-a[1]);
  return { weeks, dead, marked, lapsed, honoured, arms,
    deathShapes: rows.length, deathLines: rows.slice(0,10).map(([s,n])=>({n,s})),
    deathTotal: rows.reduce((n,r)=>n+r[1],0) };
}, [H,W]);

if(out.miss) console.log("handle missing:", out.miss.join(", "));
else {
  console.log(`${out.weeks} weeks · ${out.dead} dead · ${out.marked} marked unburied`);
  console.log(`  honoured (by the reference player): ${out.honoured}`);
  console.log(`  LAPSED out of the ${6}-week window unanswered: ${out.lapsed}`
    + (out.marked ? `  (${(out.lapsed/out.marked*100).toFixed(0)}% of them)` : ""));
  if(out.arms){
    console.log(`\nWHAT EACH ANSWER COSTS — one house, one dead man, four futures:`);
    console.log(`  before          ${JSON.stringify(out.arms.before)}`);
    for(const k of ["none","rite","games","silence","control"])
      console.log(`  ${k.padEnd(15)} ${JSON.stringify(out.arms[k])}`
        + (k==="control" ? "   <- the same nine weeks with nobody dead" : ""));
    const dU = out.arms.silence.unrest - out.arms.control.unrest;
    const dR = out.arms.silence.regard - out.arms.control.regard;
    console.log(`  SO THE LAPSE ITSELF COSTS: unrest ${dU>=0?"+":""}${dU} · regard ${dR>=0?"+":""}${dR}`
      + `   (choosing "Nothing" costs unrest +${out.arms.none.unrest-out.arms.before.unrest}`
      + ` · regard ${out.arms.none.regard-out.arms.before.regard})`);
    console.log(`  the silence arm ran ${out.arms.weeksRan} weeks · he is still on the list: ${out.arms.stillListed}`
      + ` · still inside the window: ${out.arms.inWindow}`);
  }
  console.log(`\nWHAT THE CHRONICLE SAYS WHEN A MAN DIES — ${out.deathTotal} lines, ${out.deathShapes} shapes:`);
  for(const r of out.deathLines) console.log(`  ${String(r.n).padStart(4)}  ${r.s.slice(0,92)}`);
}
console.log("\n" + JSON.stringify({ dead:out.dead, marked:out.marked, lapsed:out.lapsed, honoured:out.honoured }));
await browser.close(); server.close();
