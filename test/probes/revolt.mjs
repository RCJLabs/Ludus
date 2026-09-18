/* DOES THE HEAT IN THE CELLS EVER REACH THE LADDER BUILT FOR IT? — the rebellion arc, measured.

     node test/probes/revolt.mjs 40 420

   #285's corrected `depth.mjs` left a short, named list: situations no house of fifty ever reached
   on either arm. Read against the source, that list is not ten scattered cards. Most of it is ONE
   SYSTEM.

   `updateRebellion` is a three-stage state machine with its own decay, its own chronicle lines and
   four events hanging off it:

       stage 1   unrest >= 50   ->  EVENTS.whispers
       stage 2   unrest >= 65   ->  EVENTS.stolenSteel
       stage 3   unrest >= 78   ->  EVENTS.uprising
       and it falls back a stage when unrest drops under 40 / 55 / 68

   `EVENTS.escape` sits beside it on `d.unrest < 40` and the `steadied` night wants `unrest >= 25`
   (or a man under 40 morale). So four of the never-reached situations, plus `whispers`, are the
   same question: **how hot do the cells actually get?**

   THE MEAN IS NOT THE ANSWER AND MUST NOT BE USED AS ONE. `wagons.mjs` reports weekly-mean unrest
   at 1.7-2.3 and #281 measured a home mean of 3.0, and a mean of two says nothing about whether a
   house ever spikes to fifty — a ladder is crossed by PEAKS. This takes the distribution, the
   maximum any house ever reaches, and the count of houses that cross each rung, because that is
   the shape the gates actually read.

   AND IT SEPARATES THE THREE THINGS `depth.mjs` CONFLATES. Of its never-reached list,
   `owedBack`, `defected` and `word` are `make(){ return null; }` — they are not in the weekly deck
   at all and are raised by other code (`word` is #196's, raised by the player from a man's card,
   and the engaged arm meets all four WORDS through it). Counting those as "never reached" reads as
   a content gap and is an artifact of counting `Object.keys(EVENTS)` as if every key were a card.
   This probe reports them apart. */
import { serve, open, clearAll, found, installRope } from "../harness.mjs";

const H = +(process.argv[2] || 40), W = +(process.argv[3] || 420);
const MOST = { court:true, gambit:true, loan:true, payoff:true, works:true, sell:true, munus:true,
  rites:true, bury:true, yard:true, booking:true, favours:true, lot:true, overture:true, free:true,
  mastery:true, signature:true, retire:true };

const { server, port } = await serve({ page:"dist/test.html" });
const { browser, p } = await open(port);
await found(p); await clearAll(p, 20); await installRope(p);

const out = await p.evaluate(([H, W, MOST])=>{
  const A = window.__LVDVS, R = window.__ROPE;
  const miss = ["newGameState","activeG","EVENTS"].filter(k=>A[k]==null);
  if(miss.length) return { why:`the handle is missing ${miss.join(", ")}` };

  /* which EVENTS are drawable at all: a `make` that can return something */
  const undrawable = [];
  for(const [k, e] of Object.entries(A.EVENTS)){
    const src = e && e.make ? String(e.make) : "";
    if(/^\s*(?:make)?\s*\([^)]*\)\s*\{\s*return null;?\s*\}/.test(src) || /=>\s*null\s*$/.test(src))
      undrawable.push(k);
  }

  const RUNGS = [25, 40, 50, 65, 78];
  const arm = (tag, opts) => {
    const all = [];                 /* every weekly unrest reading, for the distribution */
    const houses = [];
    let stages = { 1:0, 2:0, 3:0 }, everReb = 0;
    for(let i=0;i<H;i++){
      const d = A.newGameState("Rv","clean",`REVOLT-${i}`);
      let peak = 0, cross = {}, sawReb = 0, top = 0;
      for(let w=0; w<W; w++){
        if(d.over) break;
        const u = d.unrest || 0;
        all.push(u);
        if(u > peak) peak = u;
        for(const r of RUNGS) if(u >= r) cross[r] = (cross[r]||0) + 1;
        if(d.rebellion){ sawReb = 1; const st = d.rebellion.stage||0; if(st > top) top = st; }
        try { R.lanista(d, opts); } catch(e){}
      }
      everReb += sawReb;
      if(top) stages[top] = (stages[top]||0) + 1;
      houses.push({ peak:+peak.toFixed(1), cross, weeks:d.week, top });
    }
    return { tag, all, houses, stages, everReb };
  };

  return { undrawable,
    reactive: arm("the reference player", MOST),
    /* a house that never soothes: no rites, no household, no feasts — the arm most likely to boil */
    harsh: arm("a harsh house (no rites, no household)", Object.assign({}, MOST, { rites:false, favours:false })) };
}, [H, W, MOST]);

await browser.close(); server.close();
if(out.why){ console.log("PROBE COULD NOT RUN:", out.why); process.exit(1); }

const pc = (a,b) => b ? (a/b*100).toFixed(2) : "0";
const q = (a,f) => { const s=[...a].sort((x,y)=>x-y); return s.length ? +s[Math.min(s.length-1, Math.floor(s.length*f))].toFixed(1) : 0; };

console.log(`\nDOES THE HEAT EVER REACH THE LADDER?  ${H} houses x ${W} weeks an arm\n`);
for(const key of ["reactive","harsh"]){
  const a = out[key];
  console.log(`  ${a.tag.toUpperCase()} — ${a.all.length} weekly readings`);
  console.log(`    unrest   p50 ${q(a.all,.50)} · p90 ${q(a.all,.90)} · p99 ${q(a.all,.99)} `
    + `· max ever ${Math.max(...a.all).toFixed(1)}`);
  const peaks = a.houses.map(h=>h.peak);
  console.log(`    the hottest week each house ever had: median ${q(peaks,.5)} · best ${Math.max(...peaks)}`);
  for(const r of [25, 40, 50, 65, 78]){
    const wk = a.houses.reduce((n,h)=>n + (h.cross[r]||0), 0);
    const hs = a.houses.filter(h=>(h.cross[r]||0) > 0).length;
    const what = { 25:"`steadied` wants", 40:"`escape` wants", 50:"rebellion stage 1",
                   65:"stage 2 · stolenSteel", 78:"stage 3 · uprising" }[r];
    console.log(`      unrest >= ${String(r).padStart(2)}  ${String(wk).padStart(6)} weeks (${pc(wk,a.all.length)}%)`
      + ` · ${String(hs).padStart(3)} of ${a.houses.length} houses   ${what}`);
  }
  console.log(`    a rebellion ever started in ${a.everReb} of ${a.houses.length} houses`
    + ` · furthest stage reached: ` + (Object.entries(a.stages).filter(([,v])=>v).map(([k,v])=>`${k}x${v}`).join(" · ") || "none"));
  console.log("");
}

console.log(`  NOT IN THE WEEKLY DECK AT ALL (\`make\` can only return null) — ${out.undrawable.length}:`);
console.log(`    ${out.undrawable.join(" · ")}`);
console.log(`    These are raised by other code, not drawn. Counting them among "situations never`);
console.log(`    reached" reads as a content gap and is an artifact of treating every key of`);
console.log(`    EVENTS as a card.\n`);
