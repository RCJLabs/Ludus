/* ONE DIE FOR THIRTY-SIX EVENTS — second phase queue #245, phase 2

   Phase 1 (`checks/pace.mjs`) measured the draw: fourteen events eligible on the median week and
   one ticket each, so an event eligible one week in a hundred had to also win a 1-in-14 shuffle.
   `pickEvent` is weighted now — `EV_DIE` gives each drawn event tickets set from its measured reach —
   and it cools: an event that fired stays out of the pool for `cool` weeks. The ORDER is weighted,
   not the outcome: make() is still asked first-eligible, so every gate keeps its meaning.

   SIX ARMS:
   1 · THE TABLE IS SOUND — every drawn event has a finite weight of one or more and a cooldown of
       zero or more; the raised events (make() is `return null`) are not in the pool at all; and the
       two lists together are every key in EVENTS.
   2 · THE SAMPLER IS PROPORTIONAL — from a pool of four real keys weighted 1 / 2 / 4 / 8, twenty
       thousand draws put each first in proportion to its tickets, within the noise of the count.
   3 · AND EQUAL WEIGHTS ARE STILL FAIR — six keys of one ticket each come out first within 1.15x of
       one another, which is the #108 property `draw.mjs` proved for the shuffle, kept.
   4 · A COOLED EVENT IS OUT OF THE POOL, and back in the week its quiet ends.
   5 · ON A REAL HOUSE EVERY ELIGIBLE EVENT IS STILL DRAWN over two thousand clone draws, and a
       draw stamps the event's week on `flags.evLast`.
   6 · AND THE RARE TIER IS REACHED — over seeded reference play, events holding four tickets or
       more take a share of the drawn firings that the flat die never gave them. The floor is set
       from the measured share, and the number is written beside it. */
import { found, clearAll } from "../harness.mjs";

export const name = "die";
export const describe = "the week's question is drawn by weight and cools after asking, and the rare tier is reached";

export async function run({ p, errors }){
  const lines = [], bad = [];
  await found(p, { seed:"DIE-1" });
  await clearAll(p, 12);
  const r = await p.evaluate(()=>{
    const A = window.__LVDVS, R = window.__ROPE;
    const miss = ["EV_DIE","EV_DRAWN","evTune","evPool","evPick","pickEvent","EVENTS","clone","rngGet","rngSet"].filter(k=>A[k]==null);
    if(miss.length) return { miss };
    const out = { arms:[], notes:[] }; const say = (ok, why) => out.arms.push({ ok, why });
    const KEYS = Object.keys(A.EVENTS);
    const raised = KEYS.filter(k => /^\s*make\s*\(\s*\)\s*\{\s*return\s+null;?\s*\}\s*$/.test(String(A.EVENTS[k].make)));

    /* 1 */
    { const badW = A.EV_DRAWN.filter(k => !(Number.isFinite(A.evTune(k).w) && A.evTune(k).w >= 1 && A.evTune(k).cool >= 0));
      const leak = raised.filter(k => A.EV_DRAWN.includes(k));
      const union = new Set([...A.EV_DRAWN, ...raised]);
      out.notes.push(`${A.EV_DRAWN.length} drawn · ${raised.length} raised · ${KEYS.length} keys · tiers: ${[1,2,4,8].map(w=>w+"×"+A.EV_DRAWN.filter(k=>A.evTune(k).w===w).length).join(" ")}`);
      say(!badW.length && !leak.length && union.size === KEYS.length && A.EV_DRAWN.length + raised.length === KEYS.length,
        `${badW.length} drawn event(s) with a bad weight or cooldown; ${leak.length} raised event(s) in the pool; drawn + raised = ${A.EV_DRAWN.length + raised.length} of ${KEYS.length} keys`); }

    /* 2 */
    { const pick = w => A.EV_DRAWN.find(k => A.evTune(k).w === w);
      const pool = [1,2,4,8].map(pick).filter(Boolean);
      if(pool.length < 4) say(false, `could not find one drawn event at each of the four weights`);
      else {
        const N = 20000, first = {}; for(const k of pool) first[k] = 0;
        for(let i=0;i<N;i++) first[A.evPick(pool.slice())]++;
        const sum = pool.reduce((s,k)=>s+A.evTune(k).w, 0);
        const off = pool.map(k => { const want = A.evTune(k).w / sum, got = first[k] / N; return { k, w:A.evTune(k).w, want:+(want*100).toFixed(1), got:+(got*100).toFixed(1), rel: got / want }; });
        const worst = Math.max(...off.map(o => Math.abs(o.rel - 1)));
        out.notes.push(`proportional: ` + off.map(o=>`${o.k}(w${o.w}) ${o.got}% for ${o.want}%`).join(" · "));
        say(worst < 0.12, `first-out shares track the tickets to within ${(worst*100).toFixed(1)}% relative (bar 12%)`); } }

    /* 3 */
    { const six = A.EV_DRAWN.filter(k => A.evTune(k).w === 1).slice(0, 6);
      const N = 20000, first = {}; for(const k of six) first[k] = 0;
      for(let i=0;i<N;i++) first[A.evPick(six.slice())]++;
      const ps = six.map(k => first[k] / N * 100), sp = Math.max(...ps) / Math.max(0.001, Math.min(...ps));
      say(six.length === 6 && sp <= 1.15, `six one-ticket keys come out first ${ps.map(x=>x.toFixed(1)+"%").join(" / ")} — ${sp.toFixed(2)}x spread (bar 1.15)`); }

    /* 4 */
    { const d = A.newGameState("Die", "clean", "DIE-COOL", null); d.week = 40;
      const k = A.EV_DRAWN.find(x => A.evTune(x).cool >= 3), c = A.evTune(k).cool;
      d.flags.evLast = { [k]: d.week - (c - 1) };
      const outNow = !A.evPool(d).includes(k);
      d.flags.evLast = { [k]: d.week - c };
      const backThen = A.evPool(d).includes(k);
      const rest = A.evPool(d).length;
      say(outNow && backThen && rest === A.EV_DRAWN.length, `${k} (cool ${c}) is out of the pool ${c-1} weeks after firing (${outNow}) and back at ${c} (${backThen}); the pool is otherwise whole (${rest} of ${A.EV_DRAWN.length})`); }

    /* 5 */
    { const d = A.newGameState("Dw", "clean", "DIE-HOUSE", null); d.gold = 6000;
      while(A.activeG(d).length < 5 && !A.rosterFull(d)){ const m = (d.market||[])[0]; if(!m) break; if(!A.buyFromBlock(d, m.id, null)) break; }
      for(let w=0; w<10; w++){ for(const g of A.activeG(d)) A.setRegimenOf(d, g.id, "palus"); d.pendingEvent = null; try { A.endWeek(d); } catch(e){ break; } }
      d.pendingEvent = null; d.flags.evLast = {};
      const eligible = A.EV_DRAWN.filter(k => { try { return !!A.EVENTS[k].make(A.clone(d)); } catch(e){ return false; } });
      const won = {}; let stamped = 0;
      for(let i=0;i<2000;i++){ const c = A.clone(d); const ev = A.pickEvent(c); if(!ev) continue;
        won[ev.id] = (won[ev.id]||0) + 1; if(c.flags.evLast && c.flags.evLast[ev.id] === c.week) stamped++; }
      const drawn = Object.keys(won), missed = eligible.filter(k => !won[k]);
      out.notes.push(`real house wk ${d.week}: ${eligible.length} eligible, ${drawn.length} drawn in 2000 · ` + Object.entries(won).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>`${k} ${(v/20).toFixed(1)}%`).join(" · "));
      say(eligible.length >= 3 && missed.length === 0 && stamped === Object.values(won).reduce((a,b)=>a+b,0),
        `${eligible.length} eligible, ${drawn.length} drawn, ${missed.length} eligible never drawn (${missed.join(", ")||"none"}); every draw stamped evLast (${stamped})`); }

    /* 6 — the rare tier over seeded reference play */
    { const H = 4, W = 220; const fired = {}; let weeks = 0;
      for(let h=0; h<H; h++){ const d = A.newGameState("Die"+h, "clean", `DIE-RUN-${h}`, null);
        for(let w=0; w<W; w++){ if(d.over) break; let did; try { did = R.lanista(d); } catch(e){ break; } weeks++;
          for(const k of Object.keys((did && did.events) || {})) if(A.EV_DRAWN.includes(k)) fired[k] = (fired[k]||0) + did.events[k]; } }
      const total = Object.values(fired).reduce((a,b)=>a+b, 0);
      const byTier = w => Object.keys(fired).filter(k=>A.evTune(k).w >= w).reduce((s,k)=>s+fired[k], 0);
      const rare = byTier(4), share = total ? rare / total : 0;
      out.notes.push(`${weeks} weeks · ${total} drawn firings · four-ticket-and-up: ${rare} (${(share*100).toFixed(1)}%) · ` + Object.entries(fired).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · "));
      out.rare = { total, rare, share:+(share*100).toFixed(1), weeks };
      /* FLOOR: set from the measured share on the first run of this build and written beside it —
         under the flat die the same tier took 2.3% of drawn firings in the seeded survey */
      say(total >= 40 && share >= 0.06, `the rare tier took ${(share*100).toFixed(1)}% of ${total} drawn firings over ${weeks} weeks (floor 6%; the flat die gave it 2.3%)`); }
    return out;
  });
  if(r.miss) return { pass:false, why:`the handle is missing ${r.miss.join(", ")}`, lines };
  for(const n of r.notes) lines.push(n);
  r.arms.forEach((a,i)=>{ lines.push(`${i+1}. ${a.ok ? "held" : "FAILED"} — ${a.why}`); if(!a.ok) bad.push(`arm ${i+1}: ${a.why}`); });
  return { pass: bad.length === 0 && !errors.length, why: bad[0] || null, lines };
}
