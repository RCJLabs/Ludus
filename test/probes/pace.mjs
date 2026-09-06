/* PACE — four numbers the second phase queue (#242-#256) was written off, on one run.

     1 · PACING. `pickEvent` shuffles every EVENTS key and takes the first whose make() returns —
         a uniform draw over whatever is eligible that week. This asks how big that set is (make()
         on a clone, before the week runs) and each event's eligibility rate. Measured 12 x 420:
         13 eligible on the median week (p10 10, p90 16, max 21); four or more on 99.9% of weeks.
         grain is eligible on 100% of weeks, bribe 97, fever 95 ... thugs 0.8, poached 1.2.
     2 · RIVAL AGGRESSION. Weeks a rival holds grudge >= `GRUDGE_POACH` · weeks `poachTarget` would return a
         man · both · and the hostile events actually raised. Measured: 107 / 0 / 0 of 3,133, and
         28 hostile acts in all — one every 112 weeks.
     3 · NOVELTY BY ERA. First-time chronicle shapes and first-time event ids per quarter of the
         run. Measured: 0.57 / 0.26 / 0.19 / 0.14 new shapes a week; 319 / 69 / 17 / 13 new events.
     4 · THE ENDING CURVE. Per house: ending, week, unrest p50 and gold p50 by era.

   Seeded (the seed is the THIRD argument of newGameState — see probe.mjs's fifth rule), so a
   before/after on any of the four items is a like-for-like comparison.

     node test/probes/pace.mjs [houses] [weeks] [seed] */
import { serve, open } from "../harness.mjs";
const H = +(process.argv[2] || 12), W = +(process.argv[3] || 420), SEED = process.argv[4] || "AUDIT";
const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
const out = await p.evaluate(([H,W,SEED])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const clone = x => JSON.parse(JSON.stringify(x));
  const q = a => { if(!a.length) return null; const s=a.slice().sort((x,y)=>x-y); const at=f=>s[Math.min(s.length-1,Math.floor(f*s.length))]; return { n:a.length, p10:at(.1), p50:at(.5), p90:at(.9), max:s[s.length-1] }; };
  const EK = Object.keys(A.EVENTS).filter(k=>typeof A.EVENTS[k].make === "function");
  const elig = { sizes:[], per:{}, weeks:0 };
  const agg = { grudge:0, target:0, both:0, weeks:0, threw:0, hostile:{} };
  const missing = ["poachTarget"].filter(k=>typeof A[k] !== "function");
  /* the gate's own figure, not a copy of it — `GRUDGE_POACH` is exported so this cannot drift */
  const GP = A.GRUDGE_POACH != null ? A.GRUDGE_POACH : 35;
  const HOSTILE = new Set(["poached","sabotage","bribedEditor","thugs","stolenSteel","courted","defected"]);
  const nov = { shapes:[0,0,0,0], events:[0,0,0,0], weeks:[0,0,0,0] };
  const houses = [];
  for(let h=0; h<H; h++){
    const d = A.newGameState("Audit", "clean", `${SEED}-${h}`);
    const seenShape = new Set(), seenEv = new Set();
    const era = { unrest:[[],[],[],[]], gold:[[],[],[],[]] };
    for(let w=0; w<W; w++){
      if(d.over) break;
      const e = Math.min(3, Math.floor(w/(W/4)));
      /* 1 · eligibility, on a clone, before the week runs */
      if(!d.rome && !d.city && !d.travel){
        /* every home week, on a clone with the standing question cleared, and the stream put back
           afterwards — see checks/pace.mjs for both faults this first draft carried */
        const st = A.rngGet(); const base = clone(d); base.pendingEvent = null;
        let n = 0;
        for(const k of EK){ let ev = null; try { ev = A.EVENTS[k].make(clone(base)); } catch(x){}
          if(ev){ n++; elig.per[k] = (elig.per[k]||0)+1; } }
        A.rngSet(st);
        elig.sizes.push(n); elig.weeks++;
      }
      /* 2 · aggression availability */
      { const g = (d.rivals||[]).some(x=>!x.retired && (x.grudge||0) >= GP);
        /* ---- A MISSING EXPORT IS NOT A GAME FACT — corrected in v3.214.0 ----
           `poachTarget` was never on the test handle. This line called `undefined(...)`, the catch
           swallowed the TypeError, `t` stayed false, and the probe reported "a rival could take a
           man on 0 of 3,133 weeks" — which went into #246 as the item's headline and was the reason
           its poach branch was called dead. Re-run with the name exported, this arm reads 1,854 of
           2,803 weeks: 66.1%, and `checks/poach.mjs` gets 65-71% on its own seeds. The handle is
           checked once, up front, and a probe that cannot see what it is measuring says so. */
        let t = false; try { t = !!A.poachTarget(d, (d.rivals||[]).find(x=>!x.retired) || {}); } catch(x){ agg.threw++; }
        agg.weeks++; if(g) agg.grudge++; if(t) agg.target++; if(g && t) agg.both++; }
      let did; try { did = R.lanista(d); } catch(x){ break; }
      for(const k of Object.keys((did&&did.events)||{})){ if(HOSTILE.has(k)) agg.hostile[k] = (agg.hostile[k]||0)+did.events[k];
        if(!seenEv.has(k)){ seenEv.add(k); nov.events[e]++; } }
      /* 3 · novelty */
      nov.weeks[e]++;
      for(const c of (d.log||[])){ if(!c || c.week !== d.week) continue;
        const shape = ((c.text||"")+"").replace(/[A-Z][a-z]+/g,"_").slice(0,40);
        if(!seenShape.has(shape)){ seenShape.add(shape); nov.shapes[e]++; } }
      era.unrest[e].push(Math.round(d.unrest)); era.gold[e].push(Math.round(d.gold));
    }
    houses.push({ end: d.over ? d.over.kind : "survived", week: d.week,
      unrest: era.unrest.map(a=>q(a)&&q(a).p50), gold: era.gold.map(a=>q(a)&&q(a).p50) });
  }
  const per = Object.entries(elig.per).map(([k,n])=>[k, Math.round(1000*n/elig.weeks)/10]).sort((a,b)=>b[1]-a[1]);
  return { events: EK.length, elig: { weeks: elig.weeks, size: q(elig.sizes),
      atLeast2: Math.round(1000*elig.sizes.filter(n=>n>=2).length/elig.sizes.length)/10,
      atLeast4: Math.round(1000*elig.sizes.filter(n=>n>=4).length/elig.sizes.length)/10, per },
    agg: Object.assign({}, agg, { missing }), nov, houses };
}, [H,W,SEED]);
if(out.agg && out.agg.missing && out.agg.missing.length)
  console.log(`!! THE HANDLE IS MISSING ${out.agg.missing.join(", ")} — arm 2's target column is not a `
    + `measurement, it is a swallowed TypeError. This is how "0 of 3,133" reached #246.`);
if(out.agg && out.agg.threw)
  console.log(`!! poachTarget threw on ${out.agg.threw} of ${out.agg.weeks} weeks`);
console.log(JSON.stringify(out, null, 1));
await browser.close(); server.close();
